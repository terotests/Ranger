// pose_wasm_host.h — load the pose wasm guest via wasm3 and drive it with RGP1.
//
// The bridge to the "actual game": write a PoseFrame into the guest's RGP1 block
// (in its wasm3 linear memory), run update(), and read the guest's RGW1 world
// state back out. Same wasm3 C bridge (rg_wasm_bridge) the SDL launcher uses.
// Reusable by the headless smoke test and the live SDL game.
#ifndef POSE_WASM_HOST_H
#define POSE_WASM_HOST_H

#include <cstdint>
#include <string>

extern "C" {
#include "rg_wasm_bridge.h"
}
#include "../native_provider/rg_pose.h"  // rgpose::PoseFrame, WriteRgp1, rgp1::*

class PoseWasmGuest {
 public:
  // Load the .wasm, call init(), and cache the RGP1 + RGW1 base offsets.
  bool load(const std::string& path) {
    handle_ = rg_wasm_load(path.c_str());
    if (handle_ < 0) return false;
    rg_wasm_call_void(handle_, "init", 0, 0, 0, 0, 0, 0);
    pose_base_ = rg_wasm_call_i32(handle_, "rg_pose_ptr", 0, 0, 0, 0, 0, 0);
    abi_base_ = rg_wasm_abi_base(handle_);
    return pose_base_ >= 0 && abi_base_ >= 0;
  }

  // Serialize a pose into RGP1 (in guest memory) and run one update().
  void step(const rgpose::PoseFrame& f) {
    uint8_t buf[rgpose::rgp1::kSize];
    rgpose::WriteRgp1(f, buf);
    for (int i = 0; i < rgpose::rgp1::kSize; i += 4) {
      int32_t v = (int32_t)((uint32_t)buf[i] | ((uint32_t)buf[i + 1] << 8) |
                            ((uint32_t)buf[i + 2] << 16) | ((uint32_t)buf[i + 3] << 24));
      rg_wasm_mem_write_i32(handle_, (uint32_t)pose_base_ + i, v);
    }
    rg_wasm_call_void(handle_, "update", 0, 0, 0, 0, 0, 0);
  }

  // RGW1 readback (fixed-point; /256 for world units). Offsets: wasm_game_abi.h.
  int heroXfp() const { return rg_wasm_mem_read_i32(handle_, (uint32_t)abi_base_ + 64); }
  int heroYfp() const { return rg_wasm_mem_read_i32(handle_, (uint32_t)abi_base_ + 68); }
  int score() const { return rg_wasm_mem_read_i32(handle_, (uint32_t)abi_base_ + 40); }
  int bodyCount() const { return rg_wasm_mem_read_i32(handle_, (uint32_t)abi_base_ + 28); }

  bool ok() const { return handle_ >= 0; }
  void close() { if (handle_ >= 0) rg_wasm_close(handle_); handle_ = -1; }
  ~PoseWasmGuest() { close(); }

 private:
  int handle_ = -1;
  int32_t pose_base_ = -1, abi_base_ = -1;
};

#endif  // POSE_WASM_HOST_H
