// pose_wasm_smoke.cc — headless proof that the pose game runs as a wasm3 guest.
//
// Loads pose_guest.wasm, drives it with a fabricated pose (no camera), and reads
// the guest's world state back — proving the camera-free half of the native path:
//   PoseFrame -> WriteRgp1 -> wasm3 linear memory -> guest update() -> RGW1 out.
// The SDL game (pose_wasm_game) swaps the fabricated pose for the real camera +
// TFLite pipeline and renders the RGW1 the guest produces.
#include <cstdio>

#include "pose_wasm_host.h"

int main(int argc, char** argv) {
  const char* wasm = argc > 1 ? argv[1] : "../wasm_guest/pose_guest.wasm";
  PoseWasmGuest guest;
  if (!guest.load(wasm)) { fprintf(stderr, "failed to load %s\n", wasm); return 1; }
  printf("loaded %s  bodyCount=%d\n", wasm, guest.bodyCount());
  printf("frame | gesture | noseX | heroX heroY | score\n");

  int frames = 96;
  for (int t = 0; t < frames; t++) {
    // fabricated pose: nose sweeps 120..360 (world x), arms up periodically
    int phase = t % 160;
    int noseWorldX = phase < 80 ? (120 + phase * 3) : (360 - (phase - 80) * 3);
    int g = (t % 90) < 15 ? rgpose::kArmsUp : rgpose::kNone;

    rgpose::PoseFrame f;
    f.present = 1;
    f.gesture = g;
    f.landmarks[rgpose::kNose] = { noseWorldX / 480.0f, 100.0f / 270.0f, 0, 1 };  // normalized

    guest.step(f);

    if (t % 12 == 0) {
      printf("%5d | %7d | %5d | %5d %5d | %5d\n", t, g, noseWorldX,
             guest.heroXfp() / 256, guest.heroYfp() / 256, guest.score());
    }
  }
  printf("final score=%d\n", guest.score());
  printf("POSE WASM SMOKE OK\n");
  return 0;
}
