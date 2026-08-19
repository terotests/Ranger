// evg_gl_native.cpp — EVG display list → OpenGL (macOS / desktop).
// Mirrors gallery/evg/gl/evg-webgl.js: SDF rounded rects, text atlas, path tris.

#include "evg_gl_native.h"

#include <cmath>
#include <cstdio>
#include <cstring>
#include <string>
#include <vector>

#if defined(__APPLE__)
#include <OpenGL/gl3.h>
#elif defined(__arm__) || defined(__aarch64__)
#include <GLES2/gl2.h>
#define EVGGL_GLES 1
#else
#define GL_GLEXT_PROTOTYPES 1
#include <GL/gl.h>
#include <GL/glext.h>
#endif

#ifndef EVGGL_GLES
// Desktop core / compatibility entry points used below.
#endif

namespace {

enum Mode { MODE_SHAPE = 0, MODE_TEXT = 1, MODE_IMAGE = 2 };

GLuint g_prog = 0;
GLuint g_pathProg = 0;
GLuint g_vao = 0;
GLuint g_cornerVbo = 0;
GLuint g_rectVbo = 0;
GLuint g_colorVbo = 0;
GLuint g_shapeVbo = 0;
GLuint g_uvVbo = 0;
GLuint g_rotVbo = 0;
GLuint g_pathVao = 0;
GLuint g_pathVbo = 0;
GLuint g_atlasTex = 0;
GLint g_uPage = -1;
GLint g_uAtlas = -1;
GLint g_uImage = -1;
GLint g_pathPage = -1;
GLint g_pathColor = -1;

int g_pageW = 1;
int g_pageH = 1;
int g_drawW = 1;
int g_drawH = 1;

std::vector<float> g_rects;
std::vector<float> g_colors;
std::vector<float> g_shapes;
std::vector<float> g_uvs;
std::vector<float> g_rots;

struct ImageRun {
  int start = 0;
  int count = 0;
  GLuint tex = 0;
};
std::vector<ImageRun> g_imageRuns;
std::vector<GLuint> g_tempImageTex;

struct TriRun {
  std::vector<float> verts;
  float r = 0, g = 0, b = 0, a = 1;
};
std::vector<TriRun> g_triRuns;

struct QuadRun {
  int start = 0;
  int count = 0;
  GLuint tex = 0; // 0 = atlas / shape
  int isImage = 0;
};
std::vector<QuadRun> g_quadRuns;
int g_runStart = 0;

GLuint compile(GLenum type, const char* src) {
  GLuint s = glCreateShader(type);
  glShaderSource(s, 1, &src, nullptr);
  glCompileShader(s);
  GLint ok = GL_FALSE;
  glGetShaderiv(s, GL_COMPILE_STATUS, &ok);
  if (ok != GL_TRUE) {
    char log[1024];
    GLsizei len = 0;
    glGetShaderInfoLog(s, 1024, &len, log);
    std::fprintf(stderr, "[evggl] shader compile failed: %.*s\n", (int)len, log);
    glDeleteShader(s);
    return 0;
  }
  return s;
}

GLuint link(GLuint vs, GLuint fs) {
  GLuint p = glCreateProgram();
  glAttachShader(p, vs);
  glAttachShader(p, fs);
  glBindAttribLocation(p, 0, "aCorner");
  glBindAttribLocation(p, 1, "aRect");
  glBindAttribLocation(p, 2, "aColor");
  glBindAttribLocation(p, 3, "aShape");
  glBindAttribLocation(p, 4, "aUV");
  glBindAttribLocation(p, 5, "aRot");
  glLinkProgram(p);
  glDeleteShader(vs);
  glDeleteShader(fs);
  GLint ok = GL_FALSE;
  glGetProgramiv(p, GL_LINK_STATUS, &ok);
  if (ok != GL_TRUE) {
    char log[1024];
    GLsizei len = 0;
    glGetProgramInfoLog(p, 1024, &len, log);
    std::fprintf(stderr, "[evggl] link failed: %.*s\n", (int)len, log);
    glDeleteProgram(p);
    return 0;
  }
  return p;
}

const char* VERT = R"GLSL(
#version 150
in vec2 aCorner;
in vec4 aRect;
in vec4 aColor;
in vec3 aShape;
in vec4 aUV;
in float aRot;
uniform vec2 uPage;
out vec4 vColor;
out vec2 vLocal;
out vec2 vHalf;
out float vRadius;
out float vThickness;
out float vMode;
out vec2 vUV;
void main() {
  vec2 p = aRect.xy + aCorner * aRect.zw;
  if (aRot != 0.0) {
    vec2 c = aRect.xy + aRect.zw * 0.5;
    float s = sin(aRot), co = cos(aRot);
    vec2 d = p - c;
    p = c + vec2(d.x * co - d.y * s, d.x * s + d.y * co);
  }
  vec2 ndc = vec2((p.x / uPage.x) * 2.0 - 1.0, 1.0 - (p.y / uPage.y) * 2.0);
  gl_Position = vec4(ndc, 0.0, 1.0);
  vColor = aColor;
  vHalf = aRect.zw * 0.5;
  vLocal = (aCorner - 0.5) * aRect.zw;
  vRadius = aShape.x;
  vThickness = aShape.y;
  vMode = aShape.z;
  vUV = mix(aUV.xy, aUV.zw, aCorner);
}
)GLSL";

const char* FRAG = R"GLSL(
#version 150
in vec4 vColor;
in vec2 vLocal;
in vec2 vHalf;
in float vRadius;
in float vThickness;
in float vMode;
in vec2 vUV;
uniform sampler2D uAtlas;
uniform sampler2D uImage;
out vec4 outColor;

float sdRoundedBox(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}

float boxCoverage(out float d) {
  float r = min(vRadius, min(vHalf.x, vHalf.y));
  d = sdRoundedBox(vLocal, vHalf, r);
  float aa = clamp(fwidth(d), 0.35, 1.5);
  return smoothstep(aa, -aa, d);
}

void main() {
  if (vMode > 1.5) {
    vec4 tex = texture(uImage, vUV);
    float d;
    float cov = boxCoverage(d);
    if (cov <= 0.001) discard;
    outColor = vec4(tex.rgb, tex.a * cov);
    return;
  }
  if (vMode > 0.5) {
    float cov = texture(uAtlas, vUV).a;
    if (cov <= 0.001) discard;
    outColor = vec4(vColor.rgb, vColor.a * cov);
    return;
  }
  float d;
  float alpha = boxCoverage(d);
  if (vThickness > 0.0) {
    float inner = -vThickness;
    float aa = clamp(fwidth(d), 0.35, 1.5);
    alpha = alpha * smoothstep(inner - aa, inner + aa, d);
  }
  if (alpha <= 0.001) discard;
  outColor = vec4(vColor.rgb, vColor.a * alpha);
}
)GLSL";

const char* PATH_VERT = R"GLSL(
#version 150
in vec2 aPos;
uniform vec2 uPage;
void main() {
  vec2 ndc = vec2((aPos.x / uPage.x) * 2.0 - 1.0, 1.0 - (aPos.y / uPage.y) * 2.0);
  gl_Position = vec4(ndc, 0.0, 1.0);
}
)GLSL";

const char* PATH_FRAG = R"GLSL(
#version 150
uniform vec4 uColor;
out vec4 outColor;
void main() { outColor = uColor; }
)GLSL";

void flushQuadRun() {
  int n = (int)(g_rects.size() / 4);
  int count = n - g_runStart;
  if (count > 0) {
    QuadRun r;
    r.start = g_runStart;
    r.count = count;
    r.tex = 0;
    r.isImage = 0;
    g_quadRuns.push_back(r);
  }
  g_runStart = n;
}

GLuint makeTex(const uint8_t* rgba, int w, int h) {
  GLuint t = 0;
  glGenTextures(1, &t);
  glBindTexture(GL_TEXTURE_2D, t);
  glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_LINEAR);
  glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_LINEAR);
  glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_S, GL_CLAMP_TO_EDGE);
  glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_T, GL_CLAMP_TO_EDGE);
  glPixelStorei(GL_UNPACK_ALIGNMENT, 1);
  glTexImage2D(GL_TEXTURE_2D, 0, GL_RGBA, w, h, 0, GL_RGBA, GL_UNSIGNED_BYTE, rgba);
  return t;
}

void pushInstance(float x, float y, float w, float h,
                  float r, float g, float b, float a,
                  float radius, float thick, float mode,
                  float u0, float v0, float u1, float v1, float rotDeg) {
  g_rects.push_back(x); g_rects.push_back(y); g_rects.push_back(w); g_rects.push_back(h);
  g_colors.push_back(r); g_colors.push_back(g); g_colors.push_back(b); g_colors.push_back(a);
  g_shapes.push_back(radius); g_shapes.push_back(thick); g_shapes.push_back(mode);
  g_uvs.push_back(u0); g_uvs.push_back(v0); g_uvs.push_back(u1); g_uvs.push_back(v1);
  g_rots.push_back(rotDeg * 3.14159265f / 180.f);
}

} // namespace

extern "C" int evggl_init(void) {
  if (g_prog != 0) return 1;
  GLuint vs = compile(GL_VERTEX_SHADER, VERT);
  GLuint fs = compile(GL_FRAGMENT_SHADER, FRAG);
  if (!vs || !fs) return 0;
  g_prog = link(vs, fs);
  if (!g_prog) return 0;

  GLuint pvs = compile(GL_VERTEX_SHADER, PATH_VERT);
  GLuint pfs = compile(GL_FRAGMENT_SHADER, PATH_FRAG);
  if (!pvs || !pfs) return 0;
  g_pathProg = glCreateProgram();
  glAttachShader(g_pathProg, pvs);
  glAttachShader(g_pathProg, pfs);
  glBindAttribLocation(g_pathProg, 0, "aPos");
  glLinkProgram(g_pathProg);
  glDeleteShader(pvs);
  glDeleteShader(pfs);
  GLint ok = GL_FALSE;
  glGetProgramiv(g_pathProg, GL_LINK_STATUS, &ok);
  if (ok != GL_TRUE) {
    std::fprintf(stderr, "[evggl] path program link failed\n");
    return 0;
  }

  g_uPage = glGetUniformLocation(g_prog, "uPage");
  g_uAtlas = glGetUniformLocation(g_prog, "uAtlas");
  g_uImage = glGetUniformLocation(g_prog, "uImage");
  g_pathPage = glGetUniformLocation(g_pathProg, "uPage");
  g_pathColor = glGetUniformLocation(g_pathProg, "uColor");

  glGenVertexArrays(1, &g_vao);
  glBindVertexArray(g_vao);

  const float quad[8] = {0, 0, 1, 0, 0, 1, 1, 1};
  glGenBuffers(1, &g_cornerVbo);
  glBindBuffer(GL_ARRAY_BUFFER, g_cornerVbo);
  glBufferData(GL_ARRAY_BUFFER, sizeof(quad), quad, GL_STATIC_DRAW);
  glEnableVertexAttribArray(0);
  glVertexAttribPointer(0, 2, GL_FLOAT, GL_FALSE, 0, (void*)0);
  glVertexAttribDivisor(0, 0);

  auto makeInst = [](GLuint* buf, GLuint loc, int size) {
    glGenBuffers(1, buf);
    glBindBuffer(GL_ARRAY_BUFFER, *buf);
    glBufferData(GL_ARRAY_BUFFER, 4, nullptr, GL_STREAM_DRAW);
    glEnableVertexAttribArray(loc);
    glVertexAttribPointer(loc, size, GL_FLOAT, GL_FALSE, 0, (void*)0);
    glVertexAttribDivisor(loc, 1);
  };
  makeInst(&g_rectVbo, 1, 4);
  makeInst(&g_colorVbo, 2, 4);
  makeInst(&g_shapeVbo, 3, 3);
  makeInst(&g_uvVbo, 4, 4);
  makeInst(&g_rotVbo, 5, 1);

  glGenVertexArrays(1, &g_pathVao);
  glBindVertexArray(g_pathVao);
  glGenBuffers(1, &g_pathVbo);
  glBindBuffer(GL_ARRAY_BUFFER, g_pathVbo);
  glEnableVertexAttribArray(0);
  glVertexAttribPointer(0, 2, GL_FLOAT, GL_FALSE, 0, (void*)0);

  glGenTextures(1, &g_atlasTex);
  glBindTexture(GL_TEXTURE_2D, g_atlasTex);
  unsigned char px[4] = {0, 0, 0, 0};
  glTexImage2D(GL_TEXTURE_2D, 0, GL_RGBA, 1, 1, 0, GL_RGBA, GL_UNSIGNED_BYTE, px);

  glBindVertexArray(0);
  return 1;
}

extern "C" void evggl_shutdown(void) {
  // Soft teardown; process exit also releases GL.
  g_prog = 0;
}

extern "C" void evggl_begin(int pageW, int pageH, int drawW, int drawH) {
  g_pageW = pageW > 0 ? pageW : 1;
  g_pageH = pageH > 0 ? pageH : 1;
  g_drawW = drawW > 0 ? drawW : g_pageW;
  g_drawH = drawH > 0 ? drawH : g_pageH;
  g_rects.clear();
  g_colors.clear();
  g_shapes.clear();
  g_uvs.clear();
  g_rots.clear();
  g_quadRuns.clear();
  g_triRuns.clear();
  g_runStart = 0;
  for (GLuint t : g_tempImageTex) glDeleteTextures(1, &t);
  g_tempImageTex.clear();
  g_imageRuns.clear();
}

extern "C" void evggl_set_atlas(const uint8_t* rgba, int w, int h) {
  if (!rgba || w <= 0 || h <= 0) return;
  glBindTexture(GL_TEXTURE_2D, g_atlasTex);
  glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_LINEAR);
  glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_LINEAR);
  glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_S, GL_CLAMP_TO_EDGE);
  glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_T, GL_CLAMP_TO_EDGE);
  glPixelStorei(GL_UNPACK_ALIGNMENT, 1);
  glTexImage2D(GL_TEXTURE_2D, 0, GL_RGBA, w, h, 0, GL_RGBA, GL_UNSIGNED_BYTE, rgba);
}

extern "C" void evggl_rect(float x, float y, float w, float h,
                           float r, float g, float b, float a, float radius) {
  pushInstance(x, y, w, h, r, g, b, a, radius, 0.f, (float)MODE_SHAPE, 0, 0, 0, 0, 0);
}

extern "C" void evggl_border(float x, float y, float w, float h, float thickness,
                             float r, float g, float b, float a, float radius) {
  pushInstance(x, y, w, h, r, g, b, a, radius, thickness, (float)MODE_SHAPE, 0, 0, 0, 0, 0);
}

extern "C" void evggl_text(float x, float y, float w, float h,
                           float u0, float v0, float u1, float v1,
                           float r, float g, float b, float a, float rotDeg) {
  pushInstance(x, y, w, h, r, g, b, a, 0, 0, (float)MODE_TEXT, u0, v0, u1, v1, rotDeg);
}

extern "C" void evggl_image(float x, float y, float w, float h,
                            const uint8_t* rgba, int tw, int th, float radius) {
  if (!rgba || tw <= 0 || th <= 0) return;
  flushQuadRun();
  GLuint tex = makeTex(rgba, tw, th);
  g_tempImageTex.push_back(tex);
  pushInstance(x, y, w, h, 1, 1, 1, 1, radius, 0, (float)MODE_IMAGE, 0, 0, 1, 1, 0);
  QuadRun run;
  run.start = (int)(g_rects.size() / 4) - 1;
  run.count = 1;
  run.tex = tex;
  run.isImage = 1;
  g_quadRuns.push_back(run);
  g_runStart = (int)(g_rects.size() / 4);
}

extern "C" void evggl_tris(const float* xy, int nFloats,
                           float r, float g, float b, float a) {
  if (!xy || nFloats < 6) return;
  flushQuadRun();
  TriRun tr;
  tr.verts.assign(xy, xy + nFloats);
  tr.r = r; tr.g = g; tr.b = b; tr.a = a;
  g_triRuns.push_back(std::move(tr));
  int triIndex = (int)g_triRuns.size() - 1;
  QuadRun marker;
  marker.start = -1 - triIndex;
  marker.count = 0;
  marker.tex = 0;
  marker.isImage = 2;
  g_quadRuns.push_back(marker);
}

extern "C" void evggl_tris_doubles(const double* xy, int nFloats,
                                   float r, float g, float b, float a) {
  if (!xy || nFloats < 6) return;
  std::vector<float> f;
  f.reserve((size_t)nFloats);
  for (int i = 0; i < nFloats; ++i) f.push_back((float)xy[i]);
  evggl_tris(f.data(), nFloats, r, g, b, a);
}

extern "C" void evggl_flush(void) {
  if (g_prog == 0) {
    if (!evggl_init()) return;
  }
  flushQuadRun();

  glViewport(0, 0, g_drawW, g_drawH);
  glDisable(GL_DEPTH_TEST);
  glEnable(GL_BLEND);
  glBlendFunc(GL_SRC_ALPHA, GL_ONE_MINUS_SRC_ALPHA);
  glClearColor(0.92f, 0.93f, 0.95f, 1.f);
  glClear(GL_COLOR_BUFFER_BIT);

  auto upload = [](GLuint buf, const std::vector<float>& data) {
    glBindBuffer(GL_ARRAY_BUFFER, buf);
    glBufferData(GL_ARRAY_BUFFER, (GLsizeiptr)(data.size() * sizeof(float)),
                 data.empty() ? nullptr : data.data(), GL_STREAM_DRAW);
  };
  upload(g_rectVbo, g_rects);
  upload(g_colorVbo, g_colors);
  upload(g_shapeVbo, g_shapes);
  upload(g_uvVbo, g_uvs);
  upload(g_rotVbo, g_rots);

  auto pointAt = [](int first) {
    auto bind = [&](GLuint buf, GLuint loc, int size) {
      glBindBuffer(GL_ARRAY_BUFFER, buf);
      glVertexAttribPointer(loc, size, GL_FLOAT, GL_FALSE, 0,
                            (void*)(intptr_t)(first * size * (int)sizeof(float)));
    };
    bind(g_rectVbo, 1, 4);
    bind(g_colorVbo, 2, 4);
    bind(g_shapeVbo, 3, 3);
    bind(g_uvVbo, 4, 4);
    bind(g_rotVbo, 5, 1);
  };

  int triCursor = 0;
  for (const QuadRun& run : g_quadRuns) {
    if (run.isImage == 2) {
      // Tri marker: start = -1 - index
      int idx = -1 - run.start;
      if (idx >= 0 && idx < (int)g_triRuns.size()) {
        const TriRun& tr = g_triRuns[(size_t)idx];
        glUseProgram(g_pathProg);
        glBindVertexArray(g_pathVao);
        glUniform2f(g_pathPage, (float)g_pageW, (float)g_pageH);
        glUniform4f(g_pathColor, tr.r, tr.g, tr.b, tr.a);
        glBindBuffer(GL_ARRAY_BUFFER, g_pathVbo);
        glBufferData(GL_ARRAY_BUFFER, (GLsizeiptr)(tr.verts.size() * sizeof(float)),
                     tr.verts.data(), GL_STREAM_DRAW);
        glDrawArrays(GL_TRIANGLES, 0, (GLsizei)(tr.verts.size() / 2));
      }
      (void)triCursor;
      continue;
    }
    if (run.count <= 0) continue;
    glUseProgram(g_prog);
    glBindVertexArray(g_vao);
    glUniform2f(g_uPage, (float)g_pageW, (float)g_pageH);
    glUniform1i(g_uAtlas, 0);
    glUniform1i(g_uImage, 1);
    glActiveTexture(GL_TEXTURE0);
    glBindTexture(GL_TEXTURE_2D, g_atlasTex);
    if (run.isImage && run.tex) {
      glActiveTexture(GL_TEXTURE1);
      glBindTexture(GL_TEXTURE_2D, run.tex);
    }
    pointAt(run.start);
    glDrawArraysInstanced(GL_TRIANGLE_STRIP, 0, 4, run.count);
  }

  // Any trailing tris that were not interleaved (none expected).
  glBindVertexArray(0);
}
