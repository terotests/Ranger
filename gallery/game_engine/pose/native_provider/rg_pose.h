// rg_pose.h — the host-side threading contract for native pose input on the SDL
// host (see ../NATIVE_EMBED.md). Pure C++ (no TFLite), so it builds and is tested
// anywhere. The inference thread produces PoseFrames; the game thread consumes the
// latest one and is the ONLY thread that writes RGP1 into wasm3 linear memory.
//
//   camera/inference thread → PoseWorker(infer) → PoseChannel (lock-free) →
//   game thread → Latest() → WriteRgp1() into wasm3 memory → guest update()
//
#ifndef RG_POSE_H
#define RG_POSE_H

#include <atomic>
#include <array>
#include <cstdint>
#include <functional>
#include <thread>

namespace rgpose {

constexpr int kLandmarkCount = 33;

// gesture enum shared with the guest / rgp1.mjs
enum Gesture { kNone = 0, kArmsUp = 1, kLeanLeft = 2, kLeanRight = 3 };
// key landmark indices (BlazePose)
enum { kNose = 0, kLShoulder = 11, kRShoulder = 12, kLWrist = 15, kRWrist = 16,
       kLHip = 23, kRHip = 24 };

struct Landmark { float x = 0, y = 0, z = 0, visibility = 0; };  // x,y normalized [0,1]

// One complete pose sample. Published atomically — a consumer never sees a
// partially-written frame.
struct PoseFrame {
  uint32_t sequence = 0;
  int64_t timestamp_us = 0;
  int present = 0;      // 1 if a pose was detected this frame
  int gesture = kNone;  // RGP1 gesture enum
  std::array<Landmark, kLandmarkCount> landmarks{};
};

// ---- RGP1 byte layout (must match the wasm pose block / as_abi_bridge) --------
namespace rgp1 {
constexpr int kOffPresent = 0, kOffGesture = 4, kOffCount = 8, kOffRevision = 12, kOffLm0 = 16;
constexpr int kFP = 256, kViewW = 480, kViewH = 270, kSize = 128;
}  // namespace rgp1

// Write a PoseFrame into a 128-byte RGP1 buffer (little-endian i32) — the exact
// bytes the wasm3 guest reads. Nose landmark -> world-unit fixed-point. Only the
// game thread calls this, into guest linear memory.
void WriteRgp1(const PoseFrame& f, uint8_t* dst /* >= rgp1::kSize */);

// Classify the RGP1 gesture from landmarks (same rule as rgp1.mjs).
int ClassifyGesture(const std::array<Landmark, kLandmarkCount>& lm);

// ---- lock-free latest-value channel (single producer, single consumer) --------
// A triple buffer: the producer writes a private slot and swaps it into "ready"
// with one atomic RMW; the consumer swaps "ready" into its private slot. No slot
// is ever written and read at once, so there is no tearing and no lock — a robust
// form of the A/B-swap sketch (3 slots handle a slow consumer without stalling
// the producer).
class PoseChannel {
 public:
  void Publish(const PoseFrame& f);        // producer (inference thread)
  bool Latest(PoseFrame* out);             // consumer (game thread); false = nothing new
 private:
  PoseFrame slots_[3];
  std::atomic<uint32_t> ready_{(1u << 1)}; // (readySlot << 1) | dirtyBit; slot 1 ready, clean
  int write_ = 0;                          // producer-private index
  int read_ = 2;                           // consumer-private index
};

// ---- 1€ filter (temporal landmark smoothing, video mode) ----------------------
// Per-signal One-Euro filter: low lag on fast motion, low jitter when still.
class OneEuroFilter {
 public:
  OneEuroFilter(float min_cutoff = 1.0f, float beta = 0.0f, float d_cutoff = 1.0f)
      : min_cutoff_(min_cutoff), beta_(beta), d_cutoff_(d_cutoff) {}
  float Filter(float x, float dt_s);
  void Reset() { started_ = false; }
 private:
  static float Alpha(float cutoff, float dt) {
    float tau = 1.0f / (2.0f * 3.14159265f * cutoff);
    return 1.0f / (1.0f + tau / dt);
  }
  float min_cutoff_, beta_, d_cutoff_;
  float x_prev_ = 0, dx_prev_ = 0;
  bool started_ = false;
};

// Smooths a full pose (x,y per landmark) across frames.
class PoseSmoother {
 public:
  void Apply(PoseFrame* f, float dt_s);
 private:
  OneEuroFilter fx_[kLandmarkCount]{}, fy_[kLandmarkCount]{};
};

// ---- ROI region for the landmark model (image-pixel space) --------------------
struct Roi { float cx = 0, cy = 0, size = 0, angle = 0; };  // pixels, radians

// Derive the next-frame ROI from the current landmarks (tracking, step 12/13):
// center between the hips, rotation hips->shoulders to vertical, size from torso
// span. Lets the detector be skipped while tracking holds.
Roi RoiFromLandmarks(const std::array<Landmark, kLandmarkCount>& lm, int img_w, int img_h);

// ---- inference worker ---------------------------------------------------------
// Runs `infer(timestamp_us) -> PoseFrame` on its own thread at a target interval,
// smooths, and publishes to a PoseChannel. `infer` is where the TFLite pipeline
// (native_bench) plugs in; here it is any callable, so the worker is testable with
// a mock. The provider owns the camera + `infer`; the game thread only reads the
// channel.
class PoseWorker {
 public:
  using InferFn = std::function<PoseFrame(int64_t timestamp_us)>;
  PoseWorker(InferFn infer, PoseChannel* out, int target_fps = 15, bool smooth = true)
      : infer_(std::move(infer)), out_(out), interval_us_(1000000 / target_fps), smooth_(smooth) {}
  void Start();
  void Stop();
  ~PoseWorker() { Stop(); }
 private:
  void Loop();
  InferFn infer_;
  PoseChannel* out_;
  int64_t interval_us_;
  bool smooth_;
  std::atomic<bool> running_{false};
  std::thread thread_;
  PoseSmoother smoother_;
  uint32_t seq_ = 0;
};

}  // namespace rgpose

#endif  // RG_POSE_H
