// pose_bench.cc — native TFLite BlazePose perf + correctness probe.
//
// Standalone, discardable: this whole directory can be deleted with no effect on
// the rest of the repo. It loads the two TFLite models extracted from a MediaPipe
// pose_landmarker .task bundle (pose_detector + pose_landmarks_detector), runs the
// two-stage BlazePose pipeline on a PPM image, prints the resulting landmarks +
// the RGP1 mapping, and times each stage (XNNPACK, N threads).
//
// It is written for correctness by construction where that is possible (TFLite API
// usage, tensor shapes read at runtime, preprocessing, back-projection) and follows
// MediaPipe's documented pose-detection post-processing for the parts that are not
// verifiable without the device. Constants that must be confirmed on-device are
// tagged  // VERIFY.  A --no-detector mode skips stage 1 (treats the whole square-
// cropped image as the ROI) to validate the landmark model + timing independently.
//
// SCOPE (this is Option B in ../NATIVE_EMBED.md, and only partially): it does NOT
// implement heatmap-based landmark refinement (step 9), world-landmarks (11),
// tracking/next-frame ROI (12-13), or temporal smoothing (14), and the detector
// NMS is simplified to top-1. So the TIMING is representative but landmark
// ACCURACY is provisional — diff it against the browser MediaPipe reference in
// ../mediapipe_poc/ before trusting the coordinates.
//
// Build: see README.md (needs a tensorflow source checkout for TFLite's CMake).
// Run:   ./pose_bench pose_detector.tflite pose_landmarks_detector.tflite img.ppm
//        [--threads 4] [--iters 30] [--no-detector]

#include <algorithm>
#include <chrono>
#include <cmath>
#include <cstdint>
#include <cstdio>
#include <cstring>
#include <fstream>
#include <memory>
#include <string>
#include <vector>

#include "tensorflow/lite/interpreter.h"
#include "tensorflow/lite/kernels/register.h"
#include "tensorflow/lite/model.h"
#include "tensorflow/lite/delegates/xnnpack/xnnpack_delegate.h"

namespace {

// ------------------------------------------------------------------ image (PPM)
struct Image {
  int w = 0, h = 0;
  std::vector<uint8_t> rgb;  // w*h*3
  uint8_t at(int x, int y, int c) const {
    if (x < 0 || y < 0 || x >= w || y >= h) return 0;
    return rgb[(y * w + x) * 3 + c];
  }
};

bool LoadPPM(const std::string& path, Image* img) {
  std::ifstream f(path, std::ios::binary);
  if (!f) { fprintf(stderr, "cannot open %s\n", path.c_str()); return false; }
  std::string magic; f >> magic;
  if (magic != "P6") { fprintf(stderr, "not a binary PPM (P6): %s\n", path.c_str()); return false; }
  int maxv;
  f >> img->w >> img->h >> maxv;
  f.get();  // single whitespace after header
  if (img->w <= 0 || img->h <= 0 || maxv != 255) { fprintf(stderr, "bad PPM header\n"); return false; }
  img->rgb.resize((size_t)img->w * img->h * 3);
  f.read(reinterpret_cast<char*>(img->rgb.data()), img->rgb.size());
  return (size_t)f.gcount() == img->rgb.size();
}

float BilinearRGB(const Image& im, float x, float y, int c) {
  int x0 = (int)std::floor(x), y0 = (int)std::floor(y);
  float fx = x - x0, fy = y - y0;
  float a = im.at(x0, y0, c), b = im.at(x0 + 1, y0, c);
  float d = im.at(x0, y0 + 1, c), e = im.at(x0 + 1, y0 + 1, c);
  return (a * (1 - fx) + b * fx) * (1 - fy) + (d * (1 - fx) + e * fx) * fy;
}

// ------------------------------------------------------------------ tflite wrap
class Model {
 public:
  Model(const std::string& path, int threads) {
    model_ = tflite::FlatBufferModel::BuildFromFile(path.c_str());
    if (!model_) { fprintf(stderr, "failed to load model %s\n", path.c_str()); std::exit(2); }
    tflite::ops::builtin::BuiltinOpResolver resolver;
    tflite::InterpreterBuilder(*model_, resolver)(&interp_);
    if (!interp_) { fprintf(stderr, "failed to build interpreter\n"); std::exit(2); }
    auto opts = TfLiteXNNPackDelegateOptionsDefault();
    opts.num_threads = threads;
    xnn_ = TfLiteXNNPackDelegateCreate(&opts);
    if (interp_->ModifyGraphWithDelegate(xnn_) != kTfLiteOk)
      fprintf(stderr, "warning: XNNPACK delegate not applied (falling back to default kernels)\n");
    if (interp_->AllocateTensors() != kTfLiteOk) { fprintf(stderr, "AllocateTensors failed\n"); std::exit(2); }
  }
  ~Model() { if (xnn_) TfLiteXNNPackDelegateDelete(xnn_); }

  const TfLiteTensor* in() const { return interp_->input_tensor(0); }
  float* in_data() { return interp_->typed_input_tensor<float>(0); }
  int in_w() const { return in()->dims->data[2]; }
  int in_h() const { return in()->dims->data[1]; }
  int num_out() const { return (int)interp_->outputs().size(); }
  const TfLiteTensor* out(int i) const { return interp_->output_tensor(i); }
  const float* out_data(int i) const { return interp_->typed_output_tensor<float>(i); }

  double Invoke() {
    auto t0 = std::chrono::high_resolution_clock::now();
    if (interp_->Invoke() != kTfLiteOk) { fprintf(stderr, "Invoke failed\n"); std::exit(2); }
    auto t1 = std::chrono::high_resolution_clock::now();
    return std::chrono::duration<double, std::milli>(t1 - t0).count();
  }

 private:
  std::unique_ptr<tflite::FlatBufferModel> model_;
  std::unique_ptr<tflite::Interpreter> interp_;
  TfLiteDelegate* xnn_ = nullptr;
};

// ------------------------------------------------------------- BlazePose config
// MediaPipe pose_detection SsdAnchorsCalculator options.  // VERIFY against the
// pose_detection subgraph if landmarks look wrong.
struct AnchorOpts {
  int input_w = 224, input_h = 224;                 // filled from the model at runtime
  int num_layers = 5;
  float min_scale = 0.1484375f, max_scale = 0.75f;
  float offset_x = 0.5f, offset_y = 0.5f;
  std::vector<int> strides = {8, 16, 32, 32, 32};
  bool fixed_anchor_size = true;
  float interp_aspect = 1.0f;
};
struct Anchor { float xc, yc, w, h; };

std::vector<Anchor> GenAnchors(const AnchorOpts& o) {
  std::vector<Anchor> anchors;
  int layer = 0;
  const int n = (int)o.strides.size();
  while (layer < o.num_layers) {
    std::vector<float> aspect, scales;
    int last = layer;
    while (last < n && o.strides[last] == o.strides[layer]) {
      float scale = o.min_scale + (o.max_scale - o.min_scale) * last / std::max(1, n - 1);
      aspect.push_back(1.0f); scales.push_back(scale);  // aspect_ratios = {1.0}
      if (o.interp_aspect > 0.0f) {
        float snext = (last == n - 1) ? 1.0f
                     : o.min_scale + (o.max_scale - o.min_scale) * (last + 1) / std::max(1, n - 1);
        scales.push_back(std::sqrt(scale * snext));
        aspect.push_back(o.interp_aspect);
      }
      last++;
    }
    int stride = o.strides[layer];
    int fmh = (int)std::ceil((float)o.input_h / stride);
    int fmw = (int)std::ceil((float)o.input_w / stride);
    for (int y = 0; y < fmh; y++)
      for (int x = 0; x < fmw; x++)
        for (size_t a = 0; a < aspect.size(); a++) {
          Anchor an;
          an.xc = (x + o.offset_x) / fmw;
          an.yc = (y + o.offset_y) / fmh;
          an.w = o.fixed_anchor_size ? 1.0f : scales[a];
          an.h = o.fixed_anchor_size ? 1.0f : scales[a];
          anchors.push_back(an);
        }
    layer = last;
  }
  return anchors;
}

inline float Sigmoid(float x) { return 1.0f / (1.0f + std::exp(-x)); }

struct Detection {
  float score;
  float cx, cy, w, h;      // normalized to detector input [0,1]
  float kp[8];             // 4 keypoints (x,y) normalized to detector input
};

// TensorsToDetections for pose_detection: num_coords=12, keypoints=4,
// reverse_output_order=true, x/y/w/h_scale=input size, sigmoid score.  // VERIFY
std::vector<Detection> DecodeDetections(const float* boxes, const float* scores,
                                        const std::vector<Anchor>& anchors,
                                        float in_w, float in_h, float thresh) {
  const int C = 12;
  std::vector<Detection> out;
  for (size_t i = 0; i < anchors.size(); i++) {
    float s = std::max(-100.0f, std::min(100.0f, scores[i]));
    s = Sigmoid(s);
    if (s < thresh) continue;
    const float* b = boxes + i * C;
    const Anchor& a = anchors[i];
    // reverse_output_order => layout is x, y, w, h
    float cx = b[0] / in_w * a.w + a.xc;
    float cy = b[1] / in_h * a.h + a.yc;
    float w = b[2] / in_w * a.w;
    float h = b[3] / in_h * a.h;
    Detection d; d.score = s; d.cx = cx; d.cy = cy; d.w = w; d.h = h;
    for (int k = 0; k < 4; k++) {
      d.kp[k * 2 + 0] = b[4 + k * 2 + 0] / in_w * a.w + a.xc;
      d.kp[k * 2 + 1] = b[4 + k * 2 + 1] / in_h * a.h + a.yc;
    }
    out.push_back(d);
  }
  return out;
}

struct Roi { float cx, cy, size, angle; };  // image pixels, radians

// AlignmentPointsRects + RectTransformation for pose: center = keypoint 0,
// size = 2 * dist(kp0,kp1), rotation from kp0->kp1 to 90deg, expand x1.25. // VERIFY
//
// Letterbox back-projection: a detector-normalized coord n maps to the original
// image as img_norm = (n - pad) / frac, where `frac` is the fraction of the
// detector input the scaled image occupies (nw/W) and `pad` is the normalized pad
// (ox/W). See main() where fracX/fracY/padX/padY are computed.
Roi DetectionToRoi(const Detection& d, float fracX, float fracY, float padX, float padY,
                   int img_w, int img_h) {
  auto imgX = [&](float nx) { return (nx - padX) / fracX; };  // -> [0,1] in image
  auto imgY = [&](float ny) { return (ny - padY) / fracY; };
  float x0 = imgX(d.kp[0]) * img_w, y0 = imgY(d.kp[1]) * img_h;   // kp0 (mid-hip)
  float x1 = imgX(d.kp[2]) * img_w, y1 = imgY(d.kp[3]) * img_h;   // kp1 (scale/rot)
  float dist = std::sqrt((x1 - x0) * (x1 - x0) + (y1 - y0) * (y1 - y0));
  float target = M_PI / 2.0f;                                     // 90 degrees
  float angle = target - std::atan2(-(y1 - y0), x1 - x0);
  // normalize angle to (-pi, pi]
  angle = angle - 2.0f * M_PI * std::floor((angle + M_PI) / (2.0f * M_PI));
  Roi r; r.cx = x0; r.cy = y0; r.size = 2.0f * dist * 1.25f; r.angle = angle;
  return r;
}

struct Landmark { float x, y, z, visibility, presence; };  // x,y in image pixels

// Crop a rotated square ROI into the landmark model's input buffer (RGB, [0,1]).
void CropRoi(const Image& im, const Roi& roi, Model* lm) {
  int W = lm->in_w(), H = lm->in_h();
  float* dst = lm->in_data();
  float ca = std::cos(roi.angle), sa = std::sin(roi.angle);
  for (int oy = 0; oy < H; oy++)
    for (int ox = 0; ox < W; ox++) {
      float nx = (ox + 0.5f) / W - 0.5f;
      float ny = (oy + 0.5f) / H - 0.5f;
      float rx = nx * ca - ny * sa;
      float ry = nx * sa + ny * ca;
      float ix = roi.cx + rx * roi.size;
      float iy = roi.cy + ry * roi.size;
      float* p = dst + (oy * W + ox) * 3;
      p[0] = BilinearRGB(im, ix, iy, 0) / 255.0f;   // landmark input range [0,1] // VERIFY
      p[1] = BilinearRGB(im, ix, iy, 1) / 255.0f;
      p[2] = BilinearRGB(im, ix, iy, 2) / 255.0f;
    }
}

// Heatmap-based landmark refinement (MediaPipe RefineLandmarksFromHeatmap, step 9).
// Soft-argmax in a window around each coarse landmark, in LANDMARK-INPUT space
// (0..in_size), before back-projection. hm is the [1,hmH,hmW,hmK] output (HWC).
void RefineFromHeatmap(std::vector<float>& xy /* x,y per landmark, input space */,
                       int nland, const float* hm, int hmH, int hmW, int hmK,
                       int in_size, int kernel = 9) {
  int half = kernel / 2;
  for (int k = 0; k < nland && k < hmK; k++) {
    int cx = (int)std::lround(xy[k * 2 + 0] / in_size * hmW);
    int cy = (int)std::lround(xy[k * 2 + 1] / in_size * hmH);
    float vsum = 0, xsum = 0, ysum = 0, vmax = 0;
    for (int r = cy - half; r <= cy + half; r++) {
      if (r < 0 || r >= hmH) continue;
      for (int c = cx - half; c <= cx + half; c++) {
        if (c < 0 || c >= hmW) continue;
        float v = Sigmoid(hm[(r * hmW + c) * hmK + k]);
        vmax = std::max(vmax, v);
        vsum += v; xsum += v * (c + 0.5f); ysum += v * (r + 0.5f);
      }
    }
    if (vsum > 0 && vmax > 0.1f) {   // min confidence // VERIFY
      xy[k * 2 + 0] = xsum / vsum / hmW * in_size;
      xy[k * 2 + 1] = ysum / vsum / hmH * in_size;
    }
  }
}

// Decode the 39x5 landmark tensor -> image coords through the ROI, with optional
// heatmap refinement (step 9). `out[i*5+..]` = x,y (0..in_size), z, visibility,
// presence (logits).
std::vector<Landmark> DecodeLandmarks(const float* out, int count, const Roi& roi, int in_size,
                                      const float* hm, int hmH, int hmW, int hmK, bool refine) {
  std::vector<float> xy(count * 2);
  for (int i = 0; i < count; i++) { xy[i * 2] = out[i * 5 + 0]; xy[i * 2 + 1] = out[i * 5 + 1]; }
  if (refine && hm) RefineFromHeatmap(xy, count, hm, hmH, hmW, hmK, in_size);

  std::vector<Landmark> lms;
  float ca = std::cos(roi.angle), sa = std::sin(roi.angle);
  for (int i = 0; i < count; i++) {
    float nx = xy[i * 2] / in_size - 0.5f, ny = xy[i * 2 + 1] / in_size - 0.5f;
    float rx = nx * ca - ny * sa;   // inverse rotation == same matrix (crop used +angle)
    float ry = nx * sa + ny * ca;
    Landmark lm;
    lm.x = roi.cx + rx * roi.size;
    lm.y = roi.cy + ry * roi.size;
    lm.z = out[i * 5 + 2];
    lm.visibility = Sigmoid(out[i * 5 + 3]);
    lm.presence = Sigmoid(out[i * 5 + 4]);
    lms.push_back(lm);
  }
  return lms;
}

// ------------------------------------------------------------- RGP1 mapping
// Same source-side logic as rgp1.mjs (arms-up / lean + nose -> world fixed-point).
enum { G_NONE = 0, G_ARMS_UP = 1, G_LEAN_LEFT = 2, G_LEAN_RIGHT = 3 };
enum { L_NOSE = 0, L_LSH = 11, L_RSH = 12, L_LWR = 15, L_RWR = 16 };
const int FP = 256, VIEW_W = 480, VIEW_H = 270;

int Classify(const std::vector<Landmark>& lm, int img_w) {
  float shoulderY = std::min(lm[L_LSH].y, lm[L_RSH].y);
  if (lm[L_LWR].y < shoulderY && lm[L_RWR].y < shoulderY) return G_ARMS_UP;
  float nx = lm[L_NOSE].x / img_w;
  if (nx < 0.42f) return G_LEAN_LEFT;
  if (nx > 0.58f) return G_LEAN_RIGHT;
  return G_NONE;
}

// --------------------------------------------------------------- timing helper
struct Stat { double mn, med, mean, p95; };
Stat Stats(std::vector<double> v) {
  std::sort(v.begin(), v.end());
  double sum = 0; for (double x : v) sum += x;
  auto pct = [&](double p) { return v[std::min(v.size() - 1, (size_t)(p / 100.0 * v.size()))]; };
  return {v.front(), pct(50), sum / v.size(), pct(95)};
}

}  // namespace

int main(int argc, char** argv) {
  if (argc < 4) {
    fprintf(stderr, "usage: %s pose_detector.tflite pose_landmarks_detector.tflite img.ppm "
                    "[--threads N] [--iters N] [--no-detector] [--no-refine] [--json]\n", argv[0]);
    return 1;
  }
  std::string det_path = argv[1], lm_path = argv[2], img_path = argv[3];
  int threads = 4, iters = 30; bool use_detector = true, json = false, refine = true;
  for (int i = 4; i < argc; i++) {
    std::string a = argv[i];
    if (a == "--threads" && i + 1 < argc) threads = std::atoi(argv[++i]);
    else if (a == "--iters" && i + 1 < argc) iters = std::atoi(argv[++i]);
    else if (a == "--no-detector") use_detector = false;
    else if (a == "--no-refine") refine = false;   // disable heatmap refinement
    else if (a == "--json") json = true;
  }

  Image img;
  if (!LoadPPM(img_path, &img)) return 1;
  // diagnostics -> stderr so stdout stays clean for --json (or the human report)
  fprintf(stderr, "image %dx%d  threads=%d  iters=%d  detector=%s\n",
          img.w, img.h, threads, iters, use_detector ? "on" : "off");

  Model det(det_path, threads), lm(lm_path, threads);
  fprintf(stderr, "detector in %dx%d, %d outputs   landmark in %dx%d, %d outputs\n",
          det.in_w(), det.in_h(), det.num_out(), lm.in_w(), lm.in_h(), lm.num_out());

  // ---- preprocess: letterbox the image into the detector input (range [-1,1]) ----
  AnchorOpts aopts; aopts.input_w = det.in_w(); aopts.input_h = det.in_h();
  auto anchors = GenAnchors(aopts);
  fprintf(stderr, "anchors=%zu\n", anchors.size());

  // fraction of the detector input covered by the scaled image, and normalized pad
  float fracX, fracY, padX, padY;
  {
    int W = det.in_w(), H = det.in_h();
    float s = std::min((float)W / img.w, (float)H / img.h);
    float nw = img.w * s, nh = img.h * s;
    float ox = (W - nw) / 2.0f, oy = (H - nh) / 2.0f;
    float* in = det.in_data();
    for (int y = 0; y < H; y++)
      for (int x = 0; x < W; x++) {
        float ix = (x - ox) / s, iy = (y - oy) / s;
        float* p = in + (y * W + x) * 3;
        for (int c = 0; c < 3; c++)
          p[c] = BilinearRGB(img, ix, iy, c) / 127.5f - 1.0f;   // detector range [-1,1] // VERIFY
      }
    fracX = nw / W; fracY = nh / H; padX = ox / W; padY = oy / H;
  }

  Roi roi{img.w / 2.0f, img.h / 2.0f, (float)std::max(img.w, img.h), 0.0f};  // --no-detector default
  float det_score = -1;

  auto run_once = [&](double* det_ms, double* lm_ms) {
    if (use_detector) {
      *det_ms = det.Invoke();
      // find box (last dim 12) and score (last dim 1) outputs by shape
      const float *boxes = nullptr, *scores = nullptr;
      for (int i = 0; i < det.num_out(); i++) {
        const TfLiteTensor* t = det.out(i);
        int last = t->dims->data[t->dims->size - 1];
        if (last == 12) boxes = det.out_data(i);
        else if (last == 1) scores = det.out_data(i);
      }
      if (boxes && scores) {
        auto dets = DecodeDetections(boxes, scores, anchors, det.in_w(), det.in_h(), 0.5f);
        if (!dets.empty()) {
          auto best = *std::max_element(dets.begin(), dets.end(),
                        [](const Detection& a, const Detection& b) { return a.score < b.score; });
          det_score = best.score;
          roi = DetectionToRoi(best, fracX, fracY, padX, padY, img.w, img.h);
        }
      }
    } else {
      *det_ms = 0;
    }
    CropRoi(img, roi, &lm);
    *lm_ms = lm.Invoke();
  };

  // warmup
  for (int i = 0; i < 3; i++) { double a, b; run_once(&a, &b); }
  std::vector<double> dt, lt, tot;
  for (int i = 0; i < iters; i++) {
    double a, b; run_once(&a, &b);
    dt.push_back(a); lt.push_back(b); tot.push_back(a + b);
  }

  // locate landmark / heatmap / world tensors by shape
  const float* lmout = nullptr; int lmcount = 0;
  const float* hm = nullptr; int hmH = 0, hmW = 0, hmK = 0;
  const float* world = nullptr; int worldCount = 0;
  for (int i = 0; i < lm.num_out(); i++) {
    const TfLiteTensor* t = lm.out(i);
    int n = 1; for (int d = 0; d < t->dims->size; d++) n *= t->dims->data[d];
    if (t->dims->size == 4 && t->dims->data[1] <= 128 && t->dims->data[1] == t->dims->data[2]
        && t->dims->data[3] >= 33) {            // heatmap [1,H,W,K]
      hm = lm.out_data(i); hmH = t->dims->data[1]; hmW = t->dims->data[2]; hmK = t->dims->data[3];
    } else if (!lmout && n % 5 == 0 && n >= 33 * 5) {   // landmarks [1,K*5]
      lmout = lm.out_data(i); lmcount = n / 5;
    } else if (!world && n % 3 == 0 && n >= 33 * 3 && n < 33 * 5) {  // world [1,K*3]
      world = lm.out_data(i); worldCount = n / 3;
    }
  }
  if (!lmout) { fprintf(stderr, "could not find landmark output tensor\n"); return 2; }
  fprintf(stderr, "landmark tensor: %d landmarks;  heatmap: %s;  world-landmarks: %s\n",
          lmcount, hm ? "yes" : "no", world ? "yes" : "no"); (void)world; (void)worldCount;
  bool do_refine = refine && hm;
  auto lms = DecodeLandmarks(lmout, std::min(lmcount, 33), roi, lm.in_w(),
                             hm, hmH, hmW, hmK, do_refine);

  auto D = Stats(dt), L = Stats(lt), T = Stats(tot);

  // --json: emit one image's landmarks in NORMALIZED coords (like the browser
  // reference) so compare.mjs can diff native vs MediaPipe. stdout only.
  if (json) {
    std::string base = img_path.substr(img_path.find_last_of('/') + 1);
    printf("{\"image\":\"%s\",\"w\":%d,\"h\":%d,\"present\":1,\"detector\":%s,",
           base.c_str(), img.w, img.h, use_detector ? "true" : "false");
    printf("\"timingMs\":{\"detector\":%.2f,\"landmark\":%.2f,\"total\":%.2f},",
           D.med, L.med, T.med);
    printf("\"landmarks\":[");
    for (size_t i = 0; i < lms.size(); i++)
      printf("%s{\"x\":%.5f,\"y\":%.5f,\"z\":%.5f,\"v\":%.4f}", i ? "," : "",
             lms[i].x / img.w, lms[i].y / img.h, lms[i].z, lms[i].visibility);
    printf("]}\n");
    return 0;
  }

  printf("\n--- timing (ms) ---\n");
  printf("  detector : min %.2f  median %.2f  mean %.2f  p95 %.2f%s\n",
         D.mn, D.med, D.mean, D.p95, use_detector ? "" : "  (skipped)");
  printf("  landmark : min %.2f  median %.2f  mean %.2f  p95 %.2f\n", L.mn, L.med, L.mean, L.p95);
  printf("  total    : min %.2f  median %.2f  mean %.2f  p95 %.2f  (%.1f fps median)\n",
         T.mn, T.med, T.mean, T.p95, 1000.0 / T.med);

  printf("\n--- pose ---\n");
  if (use_detector) printf("  detector score=%.3f  roi(cx=%.0f cy=%.0f size=%.0f angle=%.1fdeg)\n",
                           det_score, roi.cx, roi.cy, roi.size, roi.angle * 180.0f / M_PI);
  auto show = [&](const char* n, int i) {
    printf("  %-9s (%.0f, %.0f)  vis=%.2f\n", n, lms[i].x, lms[i].y, lms[i].visibility);
  };
  show("nose", L_NOSE); show("l.shoulder", L_LSH); show("r.shoulder", L_RSH);
  show("l.wrist", L_LWR); show("r.wrist", L_RWR);

  int g = Classify(lms, img.w);
  const char* gname[] = {"NONE", "ARMS_UP", "LEAN_LEFT", "LEAN_RIGHT"};
  int noseXfp = (int)std::lround(lms[L_NOSE].x / img.w * VIEW_W * FP);
  int noseYfp = (int)std::lround(lms[L_NOSE].y / img.h * VIEW_H * FP);
  printf("\n--- RGP1 ---\n  present=1 gesture=%d(%s) count=1 nose=(%.1f,%.1f) [fp %d,%d]\n",
         g, gname[g], noseXfp / (float)FP, noseYfp / (float)FP, noseXfp, noseYfp);
  return 0;
}
