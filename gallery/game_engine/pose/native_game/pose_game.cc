// pose_game.cc — a simple native pose-controlled game (SDL2), using the VALIDATED
// TFLite pipeline on a live V4L2 camera. Same threading contract as the shipping
// plan: the camera + inference run on a PoseWorker thread and publish to a
// lock-free PoseChannel; the render thread reads the latest pose. (This demo draws
// with SDL directly instead of writing RGP1 into a wasm3 guest — that ABI hop is
// the next step; here the point is to see the detector drive a game on the Pi.)
//
// Game: "touch the targets." A circle follows your head (nose); reach either hand
// (wrist) into the glowing target to score; a new target appears. The border tints
// with the detected gesture (arms-up / lean). Title bar shows score / fps / infer ms.
//
// Build: see README.md.  Run:
//   ./pose_game pose_detector.tflite pose_landmarks_detector.tflite \
//       --device /dev/video0 --threads 2 --cam-w 640 --cam-h 480

#include <SDL2/SDL.h>

#include <atomic>
#include <cmath>
#include <cstdint>
#include <cstdio>
#include <cstdlib>
#include <string>

#include "camera_v4l2.h"
#include "../native_bench/pose_pipeline.h"
#include "../native_provider/rg_pose.h"

namespace {
std::atomic<double> g_infer_ms{0};

void FillCircle(SDL_Renderer* r, int cx, int cy, int rad) {
  for (int dy = -rad; dy <= rad; dy++) {
    int dx = (int)std::sqrt((double)rad * rad - (double)dy * dy);
    SDL_RenderDrawLine(r, cx - dx, cy + dy, cx + dx, cy + dy);
  }
}
float frand() { return (float)std::rand() / (float)RAND_MAX; }
}  // namespace

int main(int argc, char** argv) {
  if (argc < 3) {
    fprintf(stderr, "usage: %s det.tflite lm.tflite [--device /dev/video0] "
                    "[--threads 2] [--cam-w 640] [--cam-h 480]\n", argv[0]);
    return 1;
  }
  std::string det = argv[1], lm = argv[2], device = "/dev/video0";
  int threads = 2, cam_w = 640, cam_h = 480;
  for (int i = 3; i < argc; i++) {
    std::string a = argv[i];
    if (a == "--device" && i + 1 < argc) device = argv[++i];
    else if (a == "--threads" && i + 1 < argc) threads = std::atoi(argv[++i]);
    else if (a == "--cam-w" && i + 1 < argc) cam_w = std::atoi(argv[++i]);
    else if (a == "--cam-h" && i + 1 < argc) cam_h = std::atoi(argv[++i]);
  }

  CameraV4L2 cam;
  if (!cam.open(device, cam_w, cam_h)) return 2;
  rgnpose::PosePipeline pipe(det, lm, threads);
  if (!pipe.ok()) { fprintf(stderr, "pipeline: unexpected model tensor layout\n"); return 2; }

  // camera + inference on the worker thread -> channel
  rgpose::PoseChannel channel;
  auto infer = [&](int64_t) -> rgpose::PoseFrame {
    rgpose::PoseFrame f;
    if (!cam.grab()) return f;  // present stays 0
    rgnpose::RgbFrame frame{cam.width(), cam.height(), cam.rgb()};
    rgnpose::PoseResult res = pipe.run(frame, /*use_detector=*/true, /*refine=*/true);
    g_infer_ms.store(res.det_ms + res.lm_ms);
    if (res.present && res.landmarks.size() >= 33) {
      f.present = 1;
      for (int i = 0; i < 33; i++) {
        f.landmarks[i] = { res.landmarks[i].x / frame.w, res.landmarks[i].y / frame.h,
                           res.landmarks[i].z, res.landmarks[i].visibility };
      }
      f.gesture = rgpose::ClassifyGesture(f.landmarks);
    }
    return f;
  };
  rgpose::PoseWorker worker(infer, &channel, /*target_fps=*/20, /*smooth=*/true);
  worker.Start();

  // ---- SDL window ----
  if (SDL_Init(SDL_INIT_VIDEO) != 0) { fprintf(stderr, "SDL_Init: %s\n", SDL_GetError()); return 3; }
  const int W = 960, H = 720;
  SDL_Window* win = SDL_CreateWindow("Ranger Pose Game", SDL_WINDOWPOS_CENTERED,
                                     SDL_WINDOWPOS_CENTERED, W, H, SDL_WINDOW_SHOWN);
  SDL_Renderer* ren = SDL_CreateRenderer(win, -1, SDL_RENDERER_ACCELERATED | SDL_RENDERER_PRESENTVSYNC);

  // skeleton connections (BlazePose indices)
  const int CONN[][2] = {{11,12},{11,13},{13,15},{12,14},{14,16},{11,23},{12,24},
                         {23,24},{23,25},{25,27},{24,26},{26,28}};
  const int NCONN = (int)(sizeof(CONN) / sizeof(CONN[0]));

  int score = 0;
  float tx = frand(), ty = frand();          // target in normalized coords
  const float TARGET_R = 0.06f;              // normalized hit radius
  rgpose::PoseFrame pose;                     // last pose the game has
  bool have_pose = false;

  Uint32 fps_t = SDL_GetTicks(); int fps_n = 0; float fps = 0;
  bool running = true;
  while (running) {
    SDL_Event e;
    while (SDL_PollEvent(&e)) {
      if (e.type == SDL_QUIT) running = false;
      if (e.type == SDL_KEYDOWN && (e.key.keysym.sym == SDLK_ESCAPE || e.key.keysym.sym == SDLK_q))
        running = false;
    }
    if (channel.Latest(&pose)) have_pose = true;

    auto sx = [&](float nx) { return (int)((1.0f - nx) * W); };  // mirror X
    auto sy = [&](float ny) { return (int)(ny * H); };

    // --- game update ---
    int gesture = have_pose ? pose.gesture : 0;
    if (have_pose && pose.present) {
      auto& L = pose.landmarks;
      float lwx = L[15].x, lwy = L[15].y, rwx = L[16].x, rwy = L[16].y;   // wrists
      auto hit = [&](float wx, float wy) {
        float dx = wx - tx, dy = wy - ty;
        return std::sqrt(dx * dx + dy * dy) < TARGET_R;
      };
      if (hit(lwx, lwy) || hit(rwx, rwy)) { score++; tx = 0.1f + 0.8f * frand(); ty = 0.1f + 0.8f * frand(); }
    }

    // --- render ---
    SDL_SetRenderDrawColor(ren, 18, 22, 34, 255); SDL_RenderClear(ren);
    // gesture border
    Uint8 br = 40, bg = 60, bb = 90;
    if (gesture == rgpose::kArmsUp) { br = 90; bg = 220; bb = 130; }
    else if (gesture == rgpose::kLeanLeft || gesture == rgpose::kLeanRight) { br = 220; bg = 180; bb = 80; }
    SDL_SetRenderDrawColor(ren, br, bg, bb, 255);
    for (int i = 0; i < 6; i++) { SDL_Rect rc{i, i, W - 2 * i, H - 2 * i}; SDL_RenderDrawRect(ren, &rc); }

    // target
    SDL_SetRenderDrawColor(ren, 255, 210, 80, 255);
    FillCircle(ren, sx(tx), sy(ty), (int)(TARGET_R * H));

    if (have_pose && pose.present) {
      auto& L = pose.landmarks;
      // skeleton
      SDL_SetRenderDrawColor(ren, 120, 200, 255, 255);
      for (int i = 0; i < NCONN; i++)
        SDL_RenderDrawLine(ren, sx(L[CONN[i][0]].x), sy(L[CONN[i][0]].y),
                           sx(L[CONN[i][1]].x), sy(L[CONN[i][1]].y));
      // hands
      SDL_SetRenderDrawColor(ren, 255, 120, 120, 255);
      FillCircle(ren, sx(L[15].x), sy(L[15].y), 12);
      FillCircle(ren, sx(L[16].x), sy(L[16].y), 12);
      // head (hero)
      SDL_SetRenderDrawColor(ren, 140, 240, 170, 255);
      FillCircle(ren, sx(L[0].x), sy(L[0].y), 16);
    }

    SDL_RenderPresent(ren);

    // fps + title
    fps_n++;
    Uint32 now = SDL_GetTicks();
    if (now - fps_t >= 500) { fps = fps_n * 1000.0f / (now - fps_t); fps_n = 0; fps_t = now; }
    char title[128];
    const char* gname[] = {"NONE", "ARMS_UP", "LEAN_LEFT", "LEAN_RIGHT"};
    std::snprintf(title, sizeof(title), "Ranger Pose Game  |  score %d  |  %.0f fps  |  infer %.0f ms  |  %s%s",
                  score, fps, g_infer_ms.load(), gname[gesture & 3], have_pose ? "" : "  (waiting for pose)");
    SDL_SetWindowTitle(win, title);
  }

  worker.Stop();
  SDL_DestroyRenderer(ren); SDL_DestroyWindow(win); SDL_Quit();
  cam.close();
  printf("final score: %d\n", score);
  return 0;
}
