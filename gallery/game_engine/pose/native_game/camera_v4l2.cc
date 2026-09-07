// camera_v4l2.cc — implementation (standard V4L2 mmap streaming capture).
#include "camera_v4l2.h"

#include <fcntl.h>
#include <linux/videodev2.h>
#include <sys/ioctl.h>
#include <sys/mman.h>
#include <unistd.h>

#include <cerrno>
#include <cstdio>
#include <cstring>

namespace {
int xioctl(int fd, unsigned long req, void* arg) {
  int r;
  do { r = ioctl(fd, req, arg); } while (r == -1 && errno == EINTR);
  return r;
}
inline uint8_t clamp8(int v) { return (uint8_t)(v < 0 ? 0 : (v > 255 ? 255 : v)); }
}  // namespace

CameraV4L2::~CameraV4L2() { close(); }

bool CameraV4L2::open(const std::string& device, int want_w, int want_h) {
  fd_ = ::open(device.c_str(), O_RDWR | O_NONBLOCK, 0);
  if (fd_ < 0) { fprintf(stderr, "camera: cannot open %s: %s\n", device.c_str(), strerror(errno)); return false; }

  v4l2_format fmt{};
  fmt.type = V4L2_BUF_TYPE_VIDEO_CAPTURE;
  fmt.fmt.pix.width = want_w;
  fmt.fmt.pix.height = want_h;
  fmt.fmt.pix.pixelformat = V4L2_PIX_FMT_YUYV;
  fmt.fmt.pix.field = V4L2_FIELD_NONE;
  if (xioctl(fd_, VIDIOC_S_FMT, &fmt) == -1) {
    fprintf(stderr, "camera: VIDIOC_S_FMT failed: %s\n", strerror(errno)); return false;
  }
  if (fmt.fmt.pix.pixelformat != V4L2_PIX_FMT_YUYV) {
    fprintf(stderr, "camera: driver did not accept YUYV (got 0x%08x). This demo only "
                    "decodes YUYV; pick a YUYV-capable mode (v4l2-ctl --list-formats-ext).\n",
            fmt.fmt.pix.pixelformat);
    return false;
  }
  w_ = fmt.fmt.pix.width; h_ = fmt.fmt.pix.height;
  rgb_.assign((size_t)w_ * h_ * 3, 0);
  fprintf(stderr, "camera: %s YUYV %dx%d\n", device.c_str(), w_, h_);

  v4l2_requestbuffers req{};
  req.count = 4; req.type = V4L2_BUF_TYPE_VIDEO_CAPTURE; req.memory = V4L2_MEMORY_MMAP;
  if (xioctl(fd_, VIDIOC_REQBUFS, &req) == -1) { fprintf(stderr, "camera: REQBUFS failed\n"); return false; }
  bufs_.resize(req.count);
  for (unsigned i = 0; i < req.count; i++) {
    v4l2_buffer b{};
    b.type = V4L2_BUF_TYPE_VIDEO_CAPTURE; b.memory = V4L2_MEMORY_MMAP; b.index = i;
    if (xioctl(fd_, VIDIOC_QUERYBUF, &b) == -1) { fprintf(stderr, "camera: QUERYBUF failed\n"); return false; }
    bufs_[i].length = b.length;
    bufs_[i].start = mmap(nullptr, b.length, PROT_READ | PROT_WRITE, MAP_SHARED, fd_, b.m.offset);
    if (bufs_[i].start == MAP_FAILED) { fprintf(stderr, "camera: mmap failed\n"); return false; }
  }
  for (unsigned i = 0; i < req.count; i++) {
    v4l2_buffer b{};
    b.type = V4L2_BUF_TYPE_VIDEO_CAPTURE; b.memory = V4L2_MEMORY_MMAP; b.index = i;
    if (xioctl(fd_, VIDIOC_QBUF, &b) == -1) { fprintf(stderr, "camera: QBUF failed\n"); return false; }
  }
  v4l2_buf_type type = V4L2_BUF_TYPE_VIDEO_CAPTURE;
  if (xioctl(fd_, VIDIOC_STREAMON, &type) == -1) { fprintf(stderr, "camera: STREAMON failed\n"); return false; }
  return true;
}

bool CameraV4L2::grab() {
  // wait for a frame
  for (;;) {
    fd_set fds; FD_ZERO(&fds); FD_SET(fd_, &fds);
    timeval tv{}; tv.tv_sec = 2; tv.tv_usec = 0;
    int r = select(fd_ + 1, &fds, nullptr, nullptr, &tv);
    if (r == -1) { if (errno == EINTR) continue; fprintf(stderr, "camera: select failed\n"); return false; }
    if (r == 0) { fprintf(stderr, "camera: timeout waiting for frame\n"); return false; }
    break;
  }
  v4l2_buffer b{};
  b.type = V4L2_BUF_TYPE_VIDEO_CAPTURE; b.memory = V4L2_MEMORY_MMAP;
  if (xioctl(fd_, VIDIOC_DQBUF, &b) == -1) { fprintf(stderr, "camera: DQBUF failed\n"); return false; }

  // YUYV (Y0 U Y1 V) -> RGB
  const uint8_t* src = (const uint8_t*)bufs_[b.index].start;
  uint8_t* dst = rgb_.data();
  int npairs = (w_ * h_) / 2;
  for (int i = 0; i < npairs; i++) {
    int y0 = src[i * 4 + 0], u = src[i * 4 + 1], y1 = src[i * 4 + 2], v = src[i * 4 + 3];
    int cu = u - 128, cv = v - 128;
    int r0 = y0 + ((91881 * cv) >> 16);
    int g0 = y0 - ((22554 * cu + 46802 * cv) >> 16);
    int b0 = y0 + ((116130 * cu) >> 16);
    int r1 = y1 + ((91881 * cv) >> 16);
    int g1 = y1 - ((22554 * cu + 46802 * cv) >> 16);
    int b1 = y1 + ((116130 * cu) >> 16);
    dst[i * 6 + 0] = clamp8(r0); dst[i * 6 + 1] = clamp8(g0); dst[i * 6 + 2] = clamp8(b0);
    dst[i * 6 + 3] = clamp8(r1); dst[i * 6 + 4] = clamp8(g1); dst[i * 6 + 5] = clamp8(b1);
  }

  if (xioctl(fd_, VIDIOC_QBUF, &b) == -1) { fprintf(stderr, "camera: requeue QBUF failed\n"); return false; }
  return true;
}

void CameraV4L2::close() {
  if (fd_ >= 0) {
    v4l2_buf_type type = V4L2_BUF_TYPE_VIDEO_CAPTURE;
    xioctl(fd_, VIDIOC_STREAMOFF, &type);
  }
  for (auto& b : bufs_) if (b.start && b.start != MAP_FAILED) munmap(b.start, b.length);
  bufs_.clear();
  if (fd_ >= 0) { ::close(fd_); fd_ = -1; }
}
