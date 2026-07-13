// camera_v4l2.h — minimal V4L2 USB-camera capture (YUYV -> RGB), Linux only.
//
// Captures at a MODEST resolution (default 640x480) on purpose: the pose models
// only see 224/256 px, and 640x480 YUYV fits USB 2.0 (~18 MB/s) with a trivial
// YUYV->RGB convert and no JPEG dependency. Don't request 1080p — it's wasted
// detail and overruns USB-2 uncompressed. See ../native_game/README.md.
#ifndef RG_CAMERA_V4L2_H
#define RG_CAMERA_V4L2_H

#include <cstdint>
#include <string>
#include <vector>

class CameraV4L2 {
 public:
  ~CameraV4L2();
  // Opens the device and negotiates YUYV at (want_w x want_h). The driver may
  // pick the nearest supported size; width()/height() report the actual size.
  bool open(const std::string& device, int want_w = 640, int want_h = 480);
  void close();

  // Grab the next frame and convert to packed RGB8. Blocks until a frame is
  // ready. Returns false on error. The RGB buffer is valid until the next grab().
  bool grab();

  const uint8_t* rgb() const { return rgb_.data(); }
  int width() const { return w_; }
  int height() const { return h_; }

 private:
  struct Buf { void* start = nullptr; size_t length = 0; };
  int fd_ = -1;
  int w_ = 0, h_ = 0;
  std::vector<Buf> bufs_;
  std::vector<uint8_t> rgb_;  // w*h*3
};

#endif  // RG_CAMERA_V4L2_H
