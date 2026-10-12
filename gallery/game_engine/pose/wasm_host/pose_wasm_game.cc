// pose_wasm_game.cc — the actual game, running as a wasm3 guest, driven live.
//
// Full native shipping path on one machine:
//   V4L2 camera -> TFLite pose pipeline (PoseWorker thread) -> PoseChannel
//     -> game thread: WriteRgp1 into the wasm3 guest's memory -> guest update()
//        -> read RGW1 (hero body + score the GUEST computed) -> SDL render.
//
// The game LOGIC (hero follows head, score on ARMS_UP) lives in the compiled
// wasm guest (../wasm_guest), not in this host — the same guest that could run
// interpreted or in the browser. This host just moves bytes and draws.
//
// Run:
//   ./pose_wasm_game det.tflite lm.tflite pose_guest.wasm \
//       --device /dev/video0 --threads 2 --cam-w 640 --cam-h 480

#include <SDL2/SDL.h>

#include <atomic>
#include <cmath>
#include <cstdio>
#include <cstdlib>
#include <string>

#include "../native_game/camera_v4l2.h"
#include "../native_bench/pose_pipeline.h"
#include "../native_provider/rg_pose.h"
#include "pose_wasm_host.h"

namespace {
std::atomic<double> g_infer_ms{0};
void FillCircle(SDL_Renderer* r, int cx, int cy, int rad) {
  for (int dy = -rad; dy <= rad; dy++) {
    int dx = (int)std::sqrt((double)rad * rad - (double)dy * dy);
    SDL_RenderDrawLine(r, cx - dx, cy + dy, cx + dx, cy + dy);
  }
}
}  // namespace

int main(int argc, char** argv) {
  if (argc < 4) {
    fprintf(stderr, "usage: %s det.tflite lm.tflite pose_guest.wasm "
                    "[--device /dev/video0] [--threads 2] [--cam-w 640] [--cam-h 480]\n", argv[0]);
    return 1;
  }
  std::string det = argv[1], lm = argv[2], wasm = argv[3], device = "/dev/video0";
  int threads = 2, cam_w = 640, cam_h = 480;
  for (int i = 4; i < argc; i++) {
    std::string a = argv[i];
    if (a == "--device" && i + 1 < argc) device = argv[++i];
    else if (a == "--threads" && i + 1 < argc) threads = std::atoi(argv[++i]);
    else if (a == "--cam-w" && i + 1 < argc) cam_w = std::atoi(argv[++i]);
    else if (a == "--cam-h" && i + 1 < argc) cam_h = std::atoi(argv[++i]);
  }

  // ---- the game, as a wasm3 guest ----
  PoseWasmGuest guest;
  if (!guest.load(wasm)) { fprintf(stderr, "failed to load %s\n", wasm.c_str()); return 2; }

  // ---- camera + inference on a worker thread ----
  CameraV4L2 cam;
  if (!cam.open(device, cam_w, cam_h)) return 2;
  rgnpose::PosePipeline pipe(det, lm, threads);
  if (!pipe.ok()) { fprintf(stderr, "pipeline: unexpected model tensor layout\n"); return 2; }

  rgpose::PoseChannel channel;
  auto infer = [&](int64_t) -> rgpose::PoseFrame {
    rgpose::PoseFrame f;
    if (!cam.grab()) return f;
    rgnpose::RgbFrame frame{cam.width(), cam.height(), cam.rgb()};
    rgnpose::PoseResult res = pipe.run(frame, true, true);
    g_infer_ms.store(res.det_ms + res.lm_ms);
    if (res.present && res.landmarks.size() >= 33) {
      f.present = 1;
      for (int i = 0; i < 33; i++)
        f.landmarks[i] = { res.landmarks[i].x / frame.w, res.landmarks[i].y / frame.h,
                           res.landmarks[i].z, res.landmarks[i].visibility };
      f.gesture = rgpose::ClassifyGesture(f.landmarks);
    }
    return f;
  };
  rgpose::PoseWorker worker(infer, &channel, 20, true);
  worker.Start();

  // ---- SDL ----
  if (SDL_Init(SDL_INIT_VIDEO) != 0) { fprintf(stderr, "SDL_Init: %s\n", SDL_GetError()); return 3; }
  const int W = 960, H = 720;
  SDL_Window* win = SDL_CreateWindow("Ranger Pose Game (wasm3 guest)", SDL_WINDOWPOS_CENTERED,
                                     SDL_WINDOWPOS_CENTERED, W, H, SDL_WINDOW_SHOWN);
  SDL_Renderer* ren = SDL_CreateRenderer(win, -1, SDL_RENDERER_ACCELERATED | SDL_RENDERER_PRESENTVSYNC);

  const int CONN[][2] = {{11,12},{11,13},{13,15},{12,14},{14,16},{11,23},{12,24},
                         {23,24},{23,25},{25,27},{24,26},{26,28}};
  const int NCONN = (int)(sizeof(CONN) / sizeof(CONN[0]));

  rgpose::PoseFrame pose; bool have_pose = false;
  Uint32 fps_t = SDL_GetTicks(); int fps_n = 0; float fps = 0;
  bool running = true;
  while (running) {
    SDL_Event e;
    while (SDL_PollEvent(&e)) {
      if (e.type == SDL_QUIT) running = false;
      if (e.type == SDL_KEYDOWN && (e.key.keysym.sym == SDLK_ESCAPE || e.key.keysym.sym == SDLK_q))
        running = false;
    }

    // new pose -> drive the wasm guest one step
    if (channel.Latest(&pose)) { have_pose = true; guest.step(pose); }

    // read what the GUEST computed (world fixed-point -> window, mirror X)
    int heroWX = guest.heroXfp() / 256, heroWY = guest.heroYfp() / 256;
    int guest_score = guest.score();
    int hx = (int)((1.0f - heroWX / 480.0f) * W), hy = (int)(heroWY / 270.0f * H);

    auto sx = [&](float nx) { return (int)((1.0f - nx) * W); };
    auto sy = [&](float ny) { return (int)(ny * H); };
    int gesture = have_pose ? pose.gesture : 0;

    SDL_SetRenderDrawColor(ren, 18, 22, 34, 255); SDL_RenderClear(ren);
    Uint8 br = 40, bg = 60, bb = 90;
    if (gesture == rgpose::kArmsUp) { br = 90; bg = 220; bb = 130; }
    else if (gesture == rgpose::kLeanLeft || gesture == rgpose::kLeanRight) { br = 220; bg = 180; bb = 80; }
    SDL_SetRenderDrawColor(ren, br, bg, bb, 255);
    for (int i = 0; i < 6; i++) { SDL_Rect rc{i, i, W - 2 * i, H - 2 * i}; SDL_RenderDrawRect(ren, &rc); }

    if (have_pose && pose.present) {
      auto& L = pose.landmarks;
      SDL_SetRenderDrawColor(ren, 120, 200, 255, 255);
      for (int i = 0; i < NCONN; i++)
        SDL_RenderDrawLine(ren, sx(L[CONN[i][0]].x), sy(L[CONN[i][0]].y),
                           sx(L[CONN[i][1]].x), sy(L[CONN[i][1]].y));
      SDL_SetRenderDrawColor(ren, 255, 120, 120, 255);
      FillCircle(ren, sx(L[15].x), sy(L[15].y), 12);
      FillCircle(ren, sx(L[16].x), sy(L[16].y), 12);
    }
    // hero position comes from the guest (RGW1 body 0)
    SDL_SetRenderDrawColor(ren, 140, 240, 170, 255);
    FillCircle(ren, hx, hy, 16);

    SDL_RenderPresent(ren);

    fps_n++;
    Uint32 now = SDL_GetTicks();
    if (now - fps_t >= 500) { fps = fps_n * 1000.0f / (now - fps_t); fps_n = 0; fps_t = now; }
    char title[160];
    const char* gname[] = {"NONE", "ARMS_UP", "LEAN_LEFT", "LEAN_RIGHT"};
    std::snprintf(title, sizeof(title),
                  "Ranger Pose Game (wasm3)  |  guest score %d  |  %.0f fps  |  infer %.0f ms  |  %s%s",
                  guest_score, fps, g_infer_ms.load(), gname[gesture & 3], have_pose ? "" : "  (waiting)");
    SDL_SetWindowTitle(win, title);
  }

  worker.Stop();
  guest.close();
  SDL_DestroyRenderer(ren); SDL_DestroyWindow(win); SDL_Quit();
  cam.close();
  printf("final guest score: %d\n", guest.score());
  return 0;
}
