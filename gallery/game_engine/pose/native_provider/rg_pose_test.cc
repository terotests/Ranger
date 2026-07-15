// rg_pose_test.cc — verifies the pose threading contract (rg_pose.h). Pure C++,
// builds anywhere: g++ -std=c++17 -O2 -pthread rg_pose.cc rg_pose_test.cc.
#include "rg_pose.h"

#include <atomic>
#include <cmath>
#include <cstdint>
#include <cstdio>
#include <thread>
#include <vector>

using namespace rgpose;

static int g_fail = 0;
#define CHECK(cond, msg)                                        \
  do {                                                          \
    if (!(cond)) { printf("  FAIL: %s\n", msg); g_fail++; }     \
    else printf("  ok  : %s\n", msg);                           \
  } while (0)

static int32_t Rd32(const uint8_t* d, int off) {
  return (int32_t)((uint32_t)d[off] | ((uint32_t)d[off + 1] << 8) |
                   ((uint32_t)d[off + 2] << 16) | ((uint32_t)d[off + 3] << 24));
}

static void TestRgp1() {
  printf("WriteRgp1 / ClassifyGesture:\n");
  PoseFrame f;
  f.present = 1; f.gesture = kArmsUp; f.sequence = 7;
  f.landmarks[kNose] = {0.5f, 0.5f, 0, 1};
  uint8_t buf[rgp1::kSize];
  WriteRgp1(f, buf);
  CHECK((uint32_t)Rd32(buf, rgp1::kOffMagic) == rgp1::kMagic, "magic 'RGP1'");
  CHECK(Rd32(buf, rgp1::kOffVersion) == 2, "version 2");
  CHECK(Rd32(buf, rgp1::kOffSize) == rgp1::kSize && rgp1::kSize == 856, "size 856");
  CHECK(Rd32(buf, rgp1::kOffPresent) == 1, "present=1");
  CHECK(Rd32(buf, rgp1::kOffGesture) == kArmsUp, "gesture=ARMS_UP");
  CHECK(Rd32(buf, rgp1::kOffCount) == kLandmarkCount, "count=full skeleton");
  CHECK(Rd32(buf, rgp1::kOffFlags) == (int)rgp1::kFlagValid, "flags=VALID");
  CHECK(Rd32(buf, rgp1::kOffRevision) == 7, "revision=sequence");
  // Positions are NORMALIZED (no view size baked in): 0.5 * 256 = 128.
  CHECK(Rd32(buf, rgp1::kOffLm0 + rgp1::kLmX) == 128, "nose x normalized fixed-point");
  CHECK(Rd32(buf, rgp1::kOffLm0 + rgp1::kLmY) == 128, "nose y normalized fixed-point");
  CHECK(Rd32(buf, rgp1::kOffLm0 + rgp1::kLmConf) == 256, "nose confidence = visibility*256");

  std::array<Landmark, kLandmarkCount> lm{};
  lm[kLShoulder] = {0.4f, 0.5f, 0, 1}; lm[kRShoulder] = {0.6f, 0.5f, 0, 1};
  lm[kLWrist] = {0.4f, 0.3f, 0, 1};    lm[kRWrist] = {0.6f, 0.3f, 0, 1};  // wrists above
  lm[kNose] = {0.5f, 0.2f, 0, 1};
  CHECK(ClassifyGesture(lm) == kArmsUp, "arms above shoulders -> ARMS_UP");
  lm[kLWrist].y = 0.7f; lm[kRWrist].y = 0.7f;  // wrists down
  lm[kNose].x = 0.30f; CHECK(ClassifyGesture(lm) == kLeanLeft, "nose left -> LEAN_LEFT");
  lm[kNose].x = 0.70f; CHECK(ClassifyGesture(lm) == kLeanRight, "nose right -> LEAN_RIGHT");
  lm[kNose].x = 0.50f; CHECK(ClassifyGesture(lm) == kNone, "nose center -> NONE");
}

static void TestChannelSingle() {
  printf("PoseChannel (single-thread):\n");
  PoseChannel ch; PoseFrame out;
  CHECK(!ch.Latest(&out), "nothing published -> Latest false");
  PoseFrame f; f.sequence = 1; f.present = 1; ch.Publish(f);
  CHECK(ch.Latest(&out) && out.sequence == 1, "reads published frame");
  CHECK(!ch.Latest(&out), "no new frame -> Latest false");
  f.sequence = 2; ch.Publish(f); f.sequence = 3; ch.Publish(f);
  CHECK(ch.Latest(&out) && out.sequence == 3, "returns the LATEST when producer ran ahead");
}

static void TestChannelThreaded() {
  printf("PoseChannel (SPSC, tearing + ordering):\n");
  PoseChannel ch;
  std::atomic<bool> run{true};
  const int kN = 200000;
  // producer: every landmark stamped with the sequence, so a torn read is detectable
  std::thread prod([&] {
    for (int s = 1; s <= kN && run.load(); s++) {
      PoseFrame f; f.sequence = (uint32_t)s; f.present = 1;
      for (int i = 0; i < kLandmarkCount; i++) f.landmarks[i] = {(float)s, -(float)s, 0, 1};
      ch.Publish(f);
    }
  });
  int reads = 0, torn = 0; uint32_t last = 0; bool backward = false;
  PoseFrame out;
  while (prod.joinable() && (reads == 0 || last < (uint32_t)kN)) {
    if (ch.Latest(&out)) {
      reads++;
      if (out.sequence < last) backward = true;
      last = out.sequence;
      for (int i = 0; i < kLandmarkCount; i++)
        if (out.landmarks[i].x != (float)out.sequence || out.landmarks[i].y != -(float)out.sequence) { torn++; break; }
    }
    if (last >= (uint32_t)kN) break;
  }
  run = false; prod.join();
  printf("    reads=%d lastSeq=%u\n", reads, last);
  CHECK(torn == 0, "no torn frames across threads");
  CHECK(!backward, "sequence never goes backward");
  CHECK(last == (uint32_t)kN, "consumer saw the final frame");
}

static void TestOneEuro() {
  printf("OneEuroFilter (jitter reduction):\n");
  OneEuroFilter f(1.0f, 0.0f, 1.0f);
  // noisy constant signal
  float in_var = 0, out_var = 0, in_mean = 0, out_mean = 0;
  std::vector<float> ins, outs;
  unsigned seed = 12345;
  auto rnd = [&]() { seed = seed * 1103515245u + 12345u; return ((seed >> 16) & 0x7fff) / 32767.0f - 0.5f; };
  for (int i = 0; i < 400; i++) {
    float x = 0.5f + 0.1f * rnd();
    float y = f.Filter(x, 1.0f / 30.0f);
    ins.push_back(x); outs.push_back(y);
  }
  for (size_t i = 100; i < ins.size(); i++) { in_mean += ins[i]; out_mean += outs[i]; }
  int n = (int)ins.size() - 100; in_mean /= n; out_mean /= n;
  for (size_t i = 100; i < ins.size(); i++) {
    in_var += (ins[i] - in_mean) * (ins[i] - in_mean);
    out_var += (outs[i] - out_mean) * (outs[i] - out_mean);
  }
  printf("    in_var=%.5f out_var=%.5f\n", in_var / n, out_var / n);
  CHECK(out_var < in_var * 0.6f, "filtered variance clearly lower than input");
  CHECK(std::fabs(out_mean - 0.5f) < 0.03f, "filter tracks the mean");
}

static void TestRoi() {
  printf("RoiFromLandmarks:\n");
  std::array<Landmark, kLandmarkCount> lm{};
  lm[kLHip] = {0.45f, 0.60f, 0, 1}; lm[kRHip] = {0.55f, 0.60f, 0, 1};
  lm[kLShoulder] = {0.45f, 0.40f, 0, 1}; lm[kRShoulder] = {0.55f, 0.40f, 0, 1};
  Roi r = RoiFromLandmarks(lm, 1000, 1000);
  CHECK(std::fabs(r.cx - 500) < 1 && std::fabs(r.cy - 600) < 1, "ROI centered on mid-hip");
  CHECK(std::fabs(r.angle) < 0.05f, "upright torso -> angle ~0");
  CHECK(r.size > 0, "ROI size positive");
}

static void TestWorker() {
  printf("PoseWorker (threaded infer -> channel):\n");
  PoseChannel ch;
  std::atomic<int> infer_calls{0};
  auto infer = [&](int64_t ts) {
    infer_calls++;
    PoseFrame f; f.present = 1;
    f.landmarks[kNose] = {0.5f, 0.5f, 0, 1};
    return f;
  };
  PoseWorker w(infer, &ch, /*fps=*/60, /*smooth=*/true);
  w.Start();
  int reads = 0; PoseFrame out;
  for (int i = 0; i < 30; i++) {
    if (ch.Latest(&out)) reads++;
    std::this_thread::sleep_for(std::chrono::milliseconds(10));
  }
  w.Stop();
  printf("    infer_calls=%d reads=%d\n", infer_calls.load(), reads);
  CHECK(infer_calls.load() > 3, "worker ran inference on its thread");
  CHECK(reads > 0, "game thread received published frames");
  CHECK(out.sequence > 0, "frames carry an increasing sequence");
}

int main() {
  TestRgp1();
  TestChannelSingle();
  TestChannelThreaded();
  TestOneEuro();
  TestRoi();
  TestWorker();
  printf("\n%s (%d failures)\n", g_fail ? "FAILED" : "ALL PASS", g_fail);
  return g_fail ? 1 : 0;
}
