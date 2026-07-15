// rg_pose.cc — implementation of the native pose threading contract (rg_pose.h).
#include "rg_pose.h"

#include <chrono>
#include <cmath>

namespace rgpose {

// -------------------------------------------------------------------- RGP1
static void Wr32(uint8_t* d, int off, int32_t v) {
  d[off + 0] = (uint8_t)(v & 0xff);
  d[off + 1] = (uint8_t)((v >> 8) & 0xff);
  d[off + 2] = (uint8_t)((v >> 16) & 0xff);
  d[off + 3] = (uint8_t)((v >> 24) & 0xff);
}

int ClassifyGesture(const std::array<Landmark, kLandmarkCount>& lm) {
  float shoulder_y = std::min(lm[kLShoulder].y, lm[kRShoulder].y);
  if (lm[kLWrist].y < shoulder_y && lm[kRWrist].y < shoulder_y) return kArmsUp;
  float nx = lm[kNose].x;
  if (nx < 0.42f) return kLeanLeft;
  if (nx > 0.58f) return kLeanRight;
  return kNone;
}

void WriteRgp1(const PoseFrame& f, uint8_t* dst) {
  using namespace rgp1;
  for (int i = 0; i < kSize; i++) dst[i] = 0;
  Wr32(dst, kOffMagic, (int32_t)kMagic);
  Wr32(dst, kOffVersion, kVersion);
  Wr32(dst, kOffSize, kSize);
  Wr32(dst, kOffPresent, f.present ? 1 : 0);
  Wr32(dst, kOffGesture, f.gesture);
  Wr32(dst, kOffTimeMs, (int32_t)(f.timestamp_us / 1000));
  Wr32(dst, kOffFlags, (int32_t)kFlagValid);
  if (f.present) {
    Wr32(dst, kOffCount, kMaxLm);
    // Full skeleton, NORMALIZED [0,1] * kFP — the guest scales into its world.
    for (int i = 0; i < kMaxLm; i++) {
      const Landmark& lm = f.landmarks[i];
      int base = kOffLm0 + i * kLmStride;
      Wr32(dst, base + kLmX, (int32_t)std::lround(lm.x * kFP));
      Wr32(dst, base + kLmY, (int32_t)std::lround(lm.y * kFP));
      Wr32(dst, base + kLmConf, (int32_t)std::lround(lm.visibility * kFP));
    }
  } else {
    Wr32(dst, kOffCount, 0);
  }
  // Publish the revision LAST (a mid-write reader on another thread retries).
  Wr32(dst, kOffRevision, (int32_t)f.sequence);
}

// ---------------------------------------------------------------- PoseChannel
void PoseChannel::Publish(const PoseFrame& f) {
  slots_[write_] = f;
  uint32_t stale = ready_.exchange((write_ << 1) | 1u, std::memory_order_acq_rel);
  write_ = (int)(stale >> 1);
}

bool PoseChannel::Latest(PoseFrame* out) {
  if (!(ready_.load(std::memory_order_acquire) & 1u)) return false;  // nothing new
  uint32_t nr = ready_.exchange((uint32_t)(read_ << 1), std::memory_order_acq_rel);
  read_ = (int)(nr >> 1);
  *out = slots_[read_];
  return true;
}

// --------------------------------------------------------------- OneEuroFilter
float OneEuroFilter::Filter(float x, float dt_s) {
  if (dt_s <= 0) dt_s = 1e-3f;
  if (!started_) { started_ = true; x_prev_ = x; dx_prev_ = 0; return x; }
  float dx = (x - x_prev_) / dt_s;
  float a_d = Alpha(d_cutoff_, dt_s);
  float dx_hat = a_d * dx + (1 - a_d) * dx_prev_;
  float cutoff = min_cutoff_ + beta_ * std::fabs(dx_hat);
  float a_x = Alpha(cutoff, dt_s);
  float x_hat = a_x * x + (1 - a_x) * x_prev_;
  x_prev_ = x_hat;
  dx_prev_ = dx_hat;
  return x_hat;
}

void PoseSmoother::Apply(PoseFrame* f, float dt_s) {
  if (!f->present) {
    for (int i = 0; i < kLandmarkCount; i++) { fx_[i].Reset(); fy_[i].Reset(); }
    return;
  }
  for (int i = 0; i < kLandmarkCount; i++) {
    f->landmarks[i].x = fx_[i].Filter(f->landmarks[i].x, dt_s);
    f->landmarks[i].y = fy_[i].Filter(f->landmarks[i].y, dt_s);
  }
}

// -------------------------------------------------------------- RoiFromLandmarks
Roi RoiFromLandmarks(const std::array<Landmark, kLandmarkCount>& lm, int img_w, int img_h) {
  auto px = [&](int i) { return lm[i].x * img_w; };
  auto py = [&](int i) { return lm[i].y * img_h; };
  float hip_x = (px(kLHip) + px(kRHip)) * 0.5f, hip_y = (py(kLHip) + py(kRHip)) * 0.5f;
  float sh_x = (px(kLShoulder) + px(kRShoulder)) * 0.5f, sh_y = (py(kLShoulder) + py(kRShoulder)) * 0.5f;
  float torso = std::sqrt((sh_x - hip_x) * (sh_x - hip_x) + (sh_y - hip_y) * (sh_y - hip_y));
  float target = 3.14159265f / 2.0f;  // point the torso "up"
  float angle = target - std::atan2(-(sh_y - hip_y), sh_x - hip_x);
  angle = angle - 2.0f * 3.14159265f * std::floor((angle + 3.14159265f) / (2.0f * 3.14159265f));
  Roi r;
  r.cx = hip_x;
  r.cy = hip_y;
  r.size = torso * 2.5f;  // VERIFY expansion factor against MediaPipe on-device
  r.angle = angle;
  return r;
}

// ----------------------------------------------------------------- PoseWorker
static int64_t NowUs() {
  return std::chrono::duration_cast<std::chrono::microseconds>(
             std::chrono::steady_clock::now().time_since_epoch())
      .count();
}

void PoseWorker::Start() {
  if (running_.exchange(true)) return;
  thread_ = std::thread(&PoseWorker::Loop, this);
}

void PoseWorker::Stop() {
  if (!running_.exchange(false)) return;
  if (thread_.joinable()) thread_.join();
}

void PoseWorker::Loop() {
  int64_t last_us = 0;
  while (running_.load(std::memory_order_relaxed)) {
    int64_t t0 = NowUs();
    PoseFrame f = infer_(t0);
    f.sequence = ++seq_;
    f.timestamp_us = t0;
    if (smooth_) {
      float dt_s = last_us ? (t0 - last_us) / 1e6f : 1.0f / 30.0f;
      smoother_.Apply(&f, dt_s);
    }
    last_us = t0;
    out_->Publish(f);
    int64_t elapsed = NowUs() - t0;
    int64_t sleep_us = interval_us_ - elapsed;
    if (sleep_us > 0) std::this_thread::sleep_for(std::chrono::microseconds(sleep_us));
  }
}

}  // namespace rgpose
