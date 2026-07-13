// pose_pipeline.h — the validated BlazePose TFLite pipeline as a reusable header.
//
// Extracted verbatim from the pose_bench.cc that matched the browser MediaPipe
// reference to ~0.7% on a Pi 5 (compare.mjs -> [OK], mean 0.0073). Both the bench
// (pose_bench.cc) and the live game (../native_game/pose_game.cc) use this, so the
// game runs the exact same detection code that was validated. Constants that were
// confirmed on-device are still tagged // VERIFY for future model swaps.
//
// Input is an RgbFrame view (packed RGB8, top-left origin) over any buffer — a PPM
// for the bench, a V4L2 camera frame for the game.
#ifndef RG_POSE_PIPELINE_H
#define RG_POSE_PIPELINE_H

#include <algorithm>
#include <chrono>
#include <cmath>
#include <cstdint>
#include <cstdio>
#include <memory>
#include <string>
#include <vector>

#include "tensorflow/lite/interpreter.h"
#include "tensorflow/lite/kernels/register.h"
#include "tensorflow/lite/model.h"
#include "tensorflow/lite/delegates/xnnpack/xnnpack_delegate.h"

namespace rgnpose {

// A non-owning view over packed RGB8 pixels.
struct RgbFrame {
  int w = 0, h = 0;
  const uint8_t* rgb = nullptr;  // w*h*3
  uint8_t at(int x, int y, int c) const {
    if (x < 0 || y < 0 || x >= w || y >= h) return 0;
    return rgb[((size_t)y * w + x) * 3 + c];
  }
};

inline float BilinearRGB(const RgbFrame& im, float x, float y, int c) {
  int x0 = (int)std::floor(x), y0 = (int)std::floor(y);
  float fx = x - x0, fy = y - y0;
  float a = im.at(x0, y0, c), b = im.at(x0 + 1, y0, c);
  float d = im.at(x0, y0 + 1, c), e = im.at(x0 + 1, y0 + 1, c);
  return (a * (1 - fx) + b * fx) * (1 - fy) + (d * (1 - fx) + e * fx) * fy;
}

inline float Sigmoid(float x) { return 1.0f / (1.0f + std::exp(-x)); }

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
      fprintf(stderr, "warning: XNNPACK delegate not applied\n");
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
struct AnchorOpts {
  int input_w = 224, input_h = 224;
  int num_layers = 5;
  float min_scale = 0.1484375f, max_scale = 0.75f;
  float offset_x = 0.5f, offset_y = 0.5f;
  std::vector<int> strides = {8, 16, 32, 32, 32};
  bool fixed_anchor_size = true;
  float interp_aspect = 1.0f;
};
struct Anchor { float xc, yc, w, h; };

inline std::vector<Anchor> GenAnchors(const AnchorOpts& o) {
  std::vector<Anchor> anchors;
  int layer = 0;
  const int n = (int)o.strides.size();
  while (layer < o.num_layers) {
    std::vector<float> aspect, scales;
    int last = layer;
    while (last < n && o.strides[last] == o.strides[layer]) {
      float scale = o.min_scale + (o.max_scale - o.min_scale) * last / std::max(1, n - 1);
      aspect.push_back(1.0f); scales.push_back(scale);
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

struct Detection { float score, cx, cy, w, h, kp[8]; };

inline std::vector<Detection> DecodeDetections(const float* boxes, const float* scores,
                                               const std::vector<Anchor>& anchors,
                                               float in_w, float in_h, float thresh) {
  const int C = 12;
  std::vector<Detection> out;
  for (size_t i = 0; i < anchors.size(); i++) {
    float s = Sigmoid(std::max(-100.0f, std::min(100.0f, scores[i])));
    if (s < thresh) continue;
    const float* b = boxes + i * C;
    const Anchor& a = anchors[i];
    Detection d;
    d.score = s;
    d.cx = b[0] / in_w * a.w + a.xc;
    d.cy = b[1] / in_h * a.h + a.yc;
    d.w = b[2] / in_w * a.w;
    d.h = b[3] / in_h * a.h;
    for (int k = 0; k < 4; k++) {
      d.kp[k * 2 + 0] = b[4 + k * 2 + 0] / in_w * a.w + a.xc;
      d.kp[k * 2 + 1] = b[4 + k * 2 + 1] / in_h * a.h + a.yc;
    }
    out.push_back(d);
  }
  return out;
}

struct Roi { float cx, cy, size, angle; };

inline Roi DetectionToRoi(const Detection& d, float fracX, float fracY, float padX, float padY,
                          int img_w, int img_h) {
  auto imgX = [&](float nx) { return (nx - padX) / fracX; };
  auto imgY = [&](float ny) { return (ny - padY) / fracY; };
  float x0 = imgX(d.kp[0]) * img_w, y0 = imgY(d.kp[1]) * img_h;
  float x1 = imgX(d.kp[2]) * img_w, y1 = imgY(d.kp[3]) * img_h;
  float dist = std::sqrt((x1 - x0) * (x1 - x0) + (y1 - y0) * (y1 - y0));
  float angle = (float)(M_PI / 2.0) - std::atan2(-(y1 - y0), x1 - x0);
  angle = angle - 2.0f * (float)M_PI * std::floor((angle + (float)M_PI) / (2.0f * (float)M_PI));
  Roi r; r.cx = x0; r.cy = y0; r.size = 2.0f * dist * 1.25f; r.angle = angle;  // VERIFY 1.25
  return r;
}

inline void CropRoi(const RgbFrame& im, const Roi& roi, Model* lm) {
  int W = lm->in_w(), H = lm->in_h();
  float* dst = lm->in_data();
  float ca = std::cos(roi.angle), sa = std::sin(roi.angle);
  for (int oy = 0; oy < H; oy++)
    for (int ox = 0; ox < W; ox++) {
      float nx = (ox + 0.5f) / W - 0.5f, ny = (oy + 0.5f) / H - 0.5f;
      float rx = nx * ca - ny * sa, ry = nx * sa + ny * ca;
      float ix = roi.cx + rx * roi.size, iy = roi.cy + ry * roi.size;
      float* p = dst + ((size_t)oy * W + ox) * 3;
      p[0] = BilinearRGB(im, ix, iy, 0) / 255.0f;   // VERIFY landmark input range [0,1]
      p[1] = BilinearRGB(im, ix, iy, 1) / 255.0f;
      p[2] = BilinearRGB(im, ix, iy, 2) / 255.0f;
    }
}

inline void RefineFromHeatmap(std::vector<float>& xy, int nland, const float* hm,
                              int hmH, int hmW, int hmK, int in_size, int kernel = 9) {
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
    if (vsum > 0 && vmax > 0.1f) {   // VERIFY min confidence
      xy[k * 2 + 0] = xsum / vsum / hmW * in_size;
      xy[k * 2 + 1] = ysum / vsum / hmH * in_size;
    }
  }
}

// Landmark in ORIGINAL image pixels.
struct Landmark { float x, y, z, visibility, presence; };

inline std::vector<Landmark> DecodeLandmarks(const float* out, int count, const Roi& roi,
                                             int in_size, const float* hm, int hmH, int hmW,
                                             int hmK, bool refine) {
  std::vector<float> xy(count * 2);
  for (int i = 0; i < count; i++) { xy[i * 2] = out[i * 5 + 0]; xy[i * 2 + 1] = out[i * 5 + 1]; }
  if (refine && hm) RefineFromHeatmap(xy, count, hm, hmH, hmW, hmK, in_size);
  std::vector<Landmark> lms;
  float ca = std::cos(roi.angle), sa = std::sin(roi.angle);
  for (int i = 0; i < count; i++) {
    float nx = xy[i * 2] / in_size - 0.5f, ny = xy[i * 2 + 1] / in_size - 0.5f;
    float rx = nx * ca - ny * sa, ry = nx * sa + ny * ca;
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

// ---------------------------------------------------------------- the pipeline
struct PoseResult {
  bool present = false;
  float score = 0;
  Roi roi{};
  std::vector<Landmark> landmarks;  // 33, image pixels
  double det_ms = 0, lm_ms = 0;
  bool has_heatmap = false, has_world = false;
};

// Loads both models once; run() executes the two-stage pipeline on one frame.
class PosePipeline {
 public:
  PosePipeline(const std::string& det_path, const std::string& lm_path, int threads)
      : det_(det_path, threads), lm_(lm_path, threads) {
    AnchorOpts o; o.input_w = det_.in_w(); o.input_h = det_.in_h();
    anchors_ = GenAnchors(o);
    // detector outputs: boxes (last dim 12), scores (last dim 1)
    for (int i = 0; i < det_.num_out(); i++) {
      const TfLiteTensor* t = det_.out(i);
      int last = t->dims->data[t->dims->size - 1];
      if (last == 12) det_boxes_ = i; else if (last == 1) det_scores_ = i;
    }
    // landmark outputs: landmarks [1,K*5], heatmap [1,H,W,K], world [1,K*3]
    for (int i = 0; i < lm_.num_out(); i++) {
      const TfLiteTensor* t = lm_.out(i);
      int nn = 1; for (int d = 0; d < t->dims->size; d++) nn *= t->dims->data[d];
      if (t->dims->size == 4 && t->dims->data[1] == t->dims->data[2] && t->dims->data[3] >= 33) {
        lm_hm_ = i; hmH_ = t->dims->data[1]; hmW_ = t->dims->data[2]; hmK_ = t->dims->data[3];
      } else if (lm_lm_ < 0 && nn % 5 == 0 && nn >= 33 * 5) {
        lm_lm_ = i; lm_count_ = nn / 5;
      } else if (lm_world_ < 0 && nn % 3 == 0 && nn >= 33 * 3 && nn < 33 * 5) {
        lm_world_ = i;
      }
    }
  }

  int det_in() const { return det_.in_w(); }
  bool ok() const { return det_boxes_ >= 0 && det_scores_ >= 0 && lm_lm_ >= 0; }

  PoseResult run(const RgbFrame& frame, bool use_detector = true, bool refine = true) {
    PoseResult res;
    res.has_heatmap = lm_hm_ >= 0; res.has_world = lm_world_ >= 0;
    // ---- letterbox into the detector input ([-1,1]) ----
    int W = det_.in_w(), H = det_.in_h();
    float s = std::min((float)W / frame.w, (float)H / frame.h);
    float nw = frame.w * s, nh = frame.h * s;
    float ox = (W - nw) / 2.0f, oy = (H - nh) / 2.0f;
    float* in = det_.in_data();
    for (int y = 0; y < H; y++)
      for (int x = 0; x < W; x++) {
        float ix = (x - ox) / s, iy = (y - oy) / s;
        float* p = in + ((size_t)y * W + x) * 3;
        for (int c = 0; c < 3; c++) p[c] = BilinearRGB(frame, ix, iy, c) / 127.5f - 1.0f;  // VERIFY [-1,1]
      }
    float fracX = nw / W, fracY = nh / H, padX = ox / W, padY = oy / H;

    Roi roi{frame.w / 2.0f, frame.h / 2.0f, (float)std::max(frame.w, frame.h), 0.0f};
    if (use_detector) {
      res.det_ms = det_.Invoke();
      auto dets = DecodeDetections(det_.out_data(det_boxes_), det_.out_data(det_scores_),
                                   anchors_, det_.in_w(), det_.in_h(), 0.5f);
      if (!dets.empty()) {
        auto best = *std::max_element(dets.begin(), dets.end(),
                      [](const Detection& a, const Detection& b) { return a.score < b.score; });
        res.score = best.score;
        roi = DetectionToRoi(best, fracX, fracY, padX, padY, frame.w, frame.h);
        res.present = true;
      }
    } else {
      res.present = true;
    }
    res.roi = roi;

    CropRoi(frame, roi, &lm_);
    res.lm_ms = lm_.Invoke();
    const float* hm = lm_hm_ >= 0 ? lm_.out_data(lm_hm_) : nullptr;
    res.landmarks = DecodeLandmarks(lm_.out_data(lm_lm_), std::min(lm_count_, 33), roi,
                                    lm_.in_w(), hm, hmH_, hmW_, hmK_, refine);
    return res;
  }

 private:
  Model det_, lm_;
  std::vector<Anchor> anchors_;
  int det_boxes_ = -1, det_scores_ = -1;
  int lm_lm_ = -1, lm_hm_ = -1, lm_world_ = -1, lm_count_ = 0;
  int hmH_ = 0, hmW_ = 0, hmK_ = 0;
};

}  // namespace rgnpose

#endif  // RG_POSE_PIPELINE_H
