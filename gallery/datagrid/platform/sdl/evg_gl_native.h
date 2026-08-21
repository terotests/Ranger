#pragma once
#include <cstdint>

// Native EVG display-list → OpenGL drawer (same seam as gallery/evg/gl/evg-webgl.js).
// Geometry is page pixels; the window drawable may be HiDPI — begin() takes both.

#ifdef __cplusplus
extern "C" {
#endif

int evggl_init(void);
void evggl_shutdown(void);

// Start a frame. pageW/H are display-list pixels; drawW/H are the GL drawable.
void evggl_begin(int pageW, int pageH, int drawW, int drawH);

// Optional white-on-transparent text atlas for this frame (RGBA).
void evggl_set_atlas(const uint8_t* rgba, int w, int h);

void evggl_rect(float x, float y, float w, float h,
                float r, float g, float b, float a, float radius);
void evggl_border(float x, float y, float w, float h, float thickness,
                  float r, float g, float b, float a, float radius);
void evggl_text(float x, float y, float w, float h,
                float u0, float v0, float u1, float v1,
                float r, float g, float b, float a, float rotDeg);
void evggl_image(float x, float y, float w, float h,
                 const uint8_t* rgba, int tw, int th, float radius);
// Clip everything drawn from here on to a page-coordinate rectangle; the
// caller intersects as clips nest. `evggl_clip_off` returns to unclipped.
void evggl_clip(float x, float y, float w, float h);
void evggl_clip_off(void);

void evggl_tris(const float* xy, int nFloats,
                float r, float g, float b, float a);
void evggl_tris_doubles(const double* xy, int nFloats,
                        float r, float g, float b, float a);

// Flush batches, swap is caller's (SDL_GL_SwapWindow).
void evggl_flush(void);

#ifdef __cplusplus
}
#endif
