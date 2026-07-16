#include "rg_wasm_bridge.h"

#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#include "wasm3/wasm3.h"

#define RG_WASM_MAX_RES 24
#define RG_WASM_MAX_FX 16

typedef struct RgWasmRes {
    int kind;   /* 1 = sheet image, 2 = rect */
    int fw, fh, scale, feet;
    int w, h, r, g, b;
    int drawLayer;
    char id[24];
    char path[80];
} RgWasmRes;

/* One guest-requested UI effect (env.rg_ui_glow / env.rg_ui_effect). The guest
 * fires an effect on a node or the whole screen; the host owns the timeline
 * (UIAnimator) and calls rg_ui_effect_done on the guest when it completes,
 * passing back node + tag. */
typedef struct RgWasmFx {
    int kind;      /* 1 = glow (single flash), 2 = pulse (repeated beats) */
    int target;    /* 0 = a UI node (node id), 1 = the whole screen */
    int node;      /* target node id (guest's stable RGU1 id) */
    int durMs;     /* effect duration, milliseconds */
    int delayMs;   /* delay before it starts, milliseconds */
    int r, g, b;   /* effect tint, 0..255 */
    int tag;       /* opaque guest tag, echoed to rg_ui_effect_done */
} RgWasmFx;

typedef struct RgWasmSlot {
    IM3Environment env;
    IM3Runtime runtime;
    IM3Module module;
    int in_use;
    /* Set once m3_LoadModule succeeds: the runtime then owns the module and
     * m3_FreeRuntime frees it. Freeing the module separately would double-free
     * (crash in Function_Release). Only free the module directly when this is 0. */
    int module_in_runtime;
    /* Worker spawning (rg_spawn_worker): a top-level module loaded by the host
     * may spawn exactly ONE resource-loader worker; a spawned worker may not
     * spawn further workers. can_spawn is 1 for host-loaded modules, 0 for
     * spawned children; spawned_child holds the one child handle (0 = none). */
    int can_spawn;
    int spawned_child;
    RgWasmRes res[RG_WASM_MAX_RES];
    int res_count;
    RgWasmFx fx[RG_WASM_MAX_FX];
    int fx_count;
    /* <module dir>/assets — where rg_load_texture resolves texture names. */
    char asset_dir[512];
} RgWasmSlot;

/* Load a module into a fresh slot. can_spawn gates whether this module may
 * later spawn a worker (host-loaded = 1, spawned worker = 0). */
static int rg_wasm_load_ex(const char* path, int can_spawn);

#define RG_WASM_MAX 8
static RgWasmSlot g_slots[RG_WASM_MAX];

static RgWasmSlot* rg_slot(int handle) {
    if (handle <= 0 || handle > RG_WASM_MAX) {
        return NULL;
    }
    RgWasmSlot* s = &g_slots[handle - 1];
    if (!s->in_use) {
        return NULL;
    }
    return s;
}

/* Copy a WASM linear-memory string (offset + length) into a host buffer. */
static void rg_copy_wasm_str(IM3Runtime rt, void* mem, int32_t off, int32_t len,
                             char* dst, int cap) {
    uint32_t sz;
    int n;
    if (cap <= 0) {
        return;
    }
    dst[0] = '\0';
    if (!mem || off < 0 || len < 0) {
        return;
    }
    sz = m3_GetMemorySize(rt);
    if ((uint32_t)off + (uint32_t)len > sz) {
        return;
    }
    n = len;
    if (n > cap - 1) {
        n = cap - 1;
    }
    memcpy(dst, (uint8_t*)mem + off, (size_t)n);
    dst[n] = '\0';
}

/* env.rg_host_register_sheet(idOff,idLen,pathOff,pathLen,fw,fh,scale,feet,drawLayer) */
m3ApiRawFunction(m3_rg_host_register_sheet) {
    m3ApiGetArg(int32_t, idOff)
    m3ApiGetArg(int32_t, idLen)
    m3ApiGetArg(int32_t, pathOff)
    m3ApiGetArg(int32_t, pathLen)
    m3ApiGetArg(int32_t, fw)
    m3ApiGetArg(int32_t, fh)
    m3ApiGetArg(int32_t, scale)
    m3ApiGetArg(int32_t, feet)
    m3ApiGetArg(int32_t, drawLayer)
    RgWasmSlot* s = (RgWasmSlot*)(_ctx->userdata);
    if (s && s->res_count < RG_WASM_MAX_RES) {
        RgWasmRes* rr = &s->res[s->res_count];
        memset(rr, 0, sizeof(*rr));
        rr->kind = 1;
        rr->fw = fw;
        rr->fh = fh;
        rr->scale = scale;
        rr->feet = feet;
        rr->drawLayer = drawLayer;
        rg_copy_wasm_str(runtime, _mem, idOff, idLen, rr->id, (int)sizeof(rr->id));
        rg_copy_wasm_str(runtime, _mem, pathOff, pathLen, rr->path, (int)sizeof(rr->path));
        s->res_count++;
    }
    m3ApiSuccess();
}

/* env.rg_host_register_rect(idOff,idLen,w,h,r,g,b,drawLayer) */
m3ApiRawFunction(m3_rg_host_register_rect) {
    m3ApiGetArg(int32_t, idOff)
    m3ApiGetArg(int32_t, idLen)
    m3ApiGetArg(int32_t, w)
    m3ApiGetArg(int32_t, h)
    m3ApiGetArg(int32_t, r)
    m3ApiGetArg(int32_t, g)
    m3ApiGetArg(int32_t, b)
    m3ApiGetArg(int32_t, drawLayer)
    RgWasmSlot* s = (RgWasmSlot*)(_ctx->userdata);
    if (s && s->res_count < RG_WASM_MAX_RES) {
        RgWasmRes* rr = &s->res[s->res_count];
        memset(rr, 0, sizeof(*rr));
        rr->kind = 2;
        rr->w = w;
        rr->h = h;
        rr->r = r;
        rr->g = g;
        rr->b = b;
        rr->drawLayer = drawLayer;
        rg_copy_wasm_str(runtime, _mem, idOff, idLen, rr->id, (int)sizeof(rr->id));
        s->res_count++;
    }
    m3ApiSuccess();
}

/* env.rg_spawn_worker(pathOff, pathLen) -> i32 child handle (0 = denied/failed).
 * The method by which guest WASM (e.g. AS game logic) loads ONE resource-loader
 * worker. Constraints enforced here (this stage):
 *   - the caller may spawn at most one worker (spawned_child already set -> 0);
 *   - a spawned worker may not spawn further workers (can_spawn == 0 -> 0).
 * The child is loaded with can_spawn = 0, so recursion is impossible. */
m3ApiRawFunction(m3_rg_spawn_worker) {
    m3ApiReturnType(int32_t)
    m3ApiGetArg(int32_t, pathOff)
    m3ApiGetArg(int32_t, pathLen)
    RgWasmSlot* s = (RgWasmSlot*)(_ctx->userdata);
    int32_t result = 0;
    if (s && s->can_spawn && s->spawned_child == 0) {
        char path[128];
        rg_copy_wasm_str(runtime, _mem, pathOff, pathLen, path, (int)sizeof(path));
        if (path[0] != '\0') {
            int child = rg_wasm_load_ex(path, 0); /* child may not spawn */
            if (child > 0) {
                s->spawned_child = child;
                result = child;
            }
        }
    }
    m3ApiReturn(result);
}

static void rg_fx_enqueue(RgWasmSlot* s, int kind, int target, int node,
                          int durMs, int delayMs, int r, int g, int b, int tag) {
    if (s && s->fx_count < RG_WASM_MAX_FX) {
        RgWasmFx* fx = &s->fx[s->fx_count];
        fx->kind = kind;
        fx->target = target;
        fx->node = node;
        fx->durMs = durMs;
        fx->delayMs = delayMs;
        fx->r = r;
        fx->g = g;
        fx->b = b;
        fx->tag = tag;
        s->fx_count++;
    }
}

/* env.rg_ui_glow(node, durMs, delayMs, tag) — convenience: a white glow on a
 * node. Equivalent to rg_ui_effect(1, 0, node, dur, delay, 255,255,255, tag). */
m3ApiRawFunction(m3_rg_ui_glow) {
    m3ApiGetArg(int32_t, node)
    m3ApiGetArg(int32_t, durMs)
    m3ApiGetArg(int32_t, delayMs)
    m3ApiGetArg(int32_t, tag)
    rg_fx_enqueue((RgWasmSlot*)(_ctx->userdata), 1, 0, node, durMs, delayMs,
                  255, 255, 255, tag);
    m3ApiSuccess();
}

/* env.rg_ui_effect(kind, target, node, durMs, delayMs, r, g, b, tag) — the
 * general form: kind (1 glow / 2 pulse), target (0 node / 1 screen), tint rgb. */
m3ApiRawFunction(m3_rg_ui_effect) {
    m3ApiGetArg(int32_t, kind)
    m3ApiGetArg(int32_t, target)
    m3ApiGetArg(int32_t, node)
    m3ApiGetArg(int32_t, durMs)
    m3ApiGetArg(int32_t, delayMs)
    m3ApiGetArg(int32_t, r)
    m3ApiGetArg(int32_t, g)
    m3ApiGetArg(int32_t, b)
    m3ApiGetArg(int32_t, tag)
    rg_fx_enqueue((RgWasmSlot*)(_ctx->userdata), kind, target, node, durMs,
                  delayMs, r, g, b, tag);
    m3ApiSuccess();
}

/* env.abort(msgPtr, filePtr, line, col) — the AssemblyScript runtime's abort
 * hook. A guest compiled WITHOUT `--use abort=` (the flag in build.sh), or with
 * a non-minimal runtime, imports this. wasm3 rejects any module that references
 * an UNLINKED import at m3_CompileModule time, so rg_wasm_load() then returns 0
 * and the runner treats the game as "not loaded" — it silently disappears from
 * the menu. Linking a stub keeps such a guest loadable regardless of build flags
 * (binary compatibility), and trapping here turns a guest assertion / bounds
 * abort into a clean halt of the current guest call with a diagnostic, rather
 * than letting it continue past a failed check into undefined behaviour. Modules
 * that don't import abort are unaffected (the link lookup simply no-ops). */
m3ApiRawFunction(m3_as_abort) {
    m3ApiGetArg(int32_t, msgPtr)
    m3ApiGetArg(int32_t, filePtr)
    m3ApiGetArg(int32_t, line)
    m3ApiGetArg(int32_t, col)
    (void)msgPtr;
    (void)filePtr;
    fprintf(stderr, "[wasm] guest called abort() at %d:%d\n", line, col);
    m3ApiTrap("assemblyscript guest abort");
}

/* ---- host-managed 3D scene (IDEAL_3D Phase H) ----------------------------
 * The strong rgfx_scene_* definitions live in gfx_sdl's C++ polyfill
 * (extern "C"); these weak fallbacks let this bridge link in a headless build
 * that does not include the GL scene (the scene calls then no-op). */
__attribute__((weak)) int  rgfx_scene_load_texture(const char* d, const char* n){ (void)d;(void)n; return 0; }
__attribute__((weak)) int  rgfx_scene_model_mesh(const char* n){ (void)n; return 0; }
__attribute__((weak)) int  rgfx_scene_sprite_tex(const char* n){ (void)n; return 0; }
__attribute__((weak)) int  rgfx_scene_resource_names(const char* k, char* o, int c){ (void)k;(void)o;(void)c; return 0; }
__attribute__((weak)) int  rgfx_scene_create_sprite(int t,int c,int r,float w,float h){ (void)t;(void)c;(void)r;(void)w;(void)h; return 0; }
__attribute__((weak)) void rgfx_scene_set_sprite_cell(int i,int c,int r){ (void)i;(void)c;(void)r; }
__attribute__((weak)) int  rgfx_scene_create_box(float a,float b,float c,float d,float e,float f,int t){ (void)a;(void)b;(void)c;(void)d;(void)e;(void)f;(void)t; return 0; }
__attribute__((weak)) int  rgfx_scene_create_mesh_entity(int m,int t){ (void)m;(void)t; return 0; }
__attribute__((weak)) int  rgfx_scene_create_camera(float a,float b,float c){ (void)a;(void)b;(void)c; return 0; }
__attribute__((weak)) int  rgfx_scene_create_light(int ty,int col,float in){ (void)ty;(void)col;(void)in; return 0; }
__attribute__((weak)) void rgfx_scene_set_position(int i,float x,float y,float z){ (void)i;(void)x;(void)y;(void)z; }
__attribute__((weak)) void rgfx_scene_set_rotation(int i,float x,float y,float z,float w){ (void)i;(void)x;(void)y;(void)z;(void)w; }
__attribute__((weak)) void rgfx_scene_set_scale(int i,float x,float y,float z){ (void)i;(void)x;(void)y;(void)z; }
__attribute__((weak)) void rgfx_scene_set_target(int i,float x,float y,float z){ (void)i;(void)x;(void)y;(void)z; }
__attribute__((weak)) void rgfx_scene_set_range(int i,float r){ (void)i;(void)r; }
__attribute__((weak)) void rgfx_scene_set_enabled(int i,int o){ (void)i;(void)o; }
__attribute__((weak)) void rgfx_scene_set_visible(int i,int o){ (void)i;(void)o; }
__attribute__((weak)) void rgfx_scene_set_active_camera(int i){ (void)i; }
__attribute__((weak)) void rgfx_scene_destroy(int i){ (void)i; }

#define RG3D_FP(v) ((float)(v) / 256.0f)
#define RG3D_Q(v)  ((float)(v) / 65536.0f)

m3ApiRawFunction(m3_rg_load_texture) {
    m3ApiReturnType(int32_t)
    m3ApiGetArg(int32_t, nameOff)
    m3ApiGetArg(int32_t, nameLen)
    RgWasmSlot* s = (RgWasmSlot*)(_ctx->userdata);
    char name[128];
    rg_copy_wasm_str(runtime, _mem, nameOff, nameLen, name, (int)sizeof(name));
    m3ApiReturn(rgfx_scene_load_texture(s ? s->asset_dir : "assets", name));
}
/* env.rg_load_model(name_ptr, name_len) -> meshId. Resolves a preloaded GLB
 * model (uploaded + registered by the runner) by name; 0 when not found. */
m3ApiRawFunction(m3_rg_load_model) {
    m3ApiReturnType(int32_t)
    m3ApiGetArg(int32_t, nameOff)
    m3ApiGetArg(int32_t, nameLen)
    char name[128];
    rg_copy_wasm_str(runtime, _mem, nameOff, nameLen, name, (int)sizeof(name));
    m3ApiReturn(rgfx_scene_model_mesh(name));
}
/* env.rg_list_resources(kind_ptr, kind_len, out_ptr, out_cap) -> bytes needed.
 * Lists what the runner preloaded for `kind` ("models" | "sprites"), writing the
 * basenames into guest memory at out_ptr as NUL-separated strings. Returns the
 * byte size the full list needs: when that exceeds out_cap the buffer still holds
 * only whole names, so the guest can size a buffer and ask again. Unlike every
 * other import here this one writes *into* linear memory, so the destination
 * range is bounds-checked against the guest's memory size before it is handed to
 * the (untrusted-length) copy. */
m3ApiRawFunction(m3_rg_list_resources) {
    m3ApiReturnType(int32_t)
    m3ApiGetArg(int32_t, kindOff)
    m3ApiGetArg(int32_t, kindLen)
    m3ApiGetArg(int32_t, outOff)
    m3ApiGetArg(int32_t, outCap)
    char kind[32];
    uint32_t sz;
    rg_copy_wasm_str(runtime, _mem, kindOff, kindLen, kind, (int)sizeof(kind));
    if (!_mem || outOff < 0 || outCap <= 0) {
        m3ApiReturn(0);
    }
    sz = m3_GetMemorySize(runtime);
    if ((uint32_t)outOff + (uint32_t)outCap > sz) {
        m3ApiReturn(0);
    }
    m3ApiReturn(rgfx_scene_resource_names(kind, (char*)_mem + outOff, outCap));
}
/* env.rg_load_sprite(name_ptr, name_len) -> texId of a preloaded sprite sheet. */
m3ApiRawFunction(m3_rg_load_sprite) {
    m3ApiReturnType(int32_t)
    m3ApiGetArg(int32_t, nameOff)
    m3ApiGetArg(int32_t, nameLen)
    char name[128];
    rg_copy_wasm_str(runtime, _mem, nameOff, nameLen, name, (int)sizeof(name));
    m3ApiReturn(rgfx_scene_sprite_tex(name));
}
/* env.rg_create_sprite(texId, cols, rows, w, h) -> billboard EntityId. w/h fixed-point. */
m3ApiRawFunction(m3_rg_create_sprite) {
    m3ApiReturnType(int32_t)
    m3ApiGetArg(int32_t, texId)
    m3ApiGetArg(int32_t, cols)
    m3ApiGetArg(int32_t, rows)
    m3ApiGetArg(int32_t, w)
    m3ApiGetArg(int32_t, h)
    m3ApiReturn(rgfx_scene_create_sprite(texId, cols, rows, RG3D_FP(w), RG3D_FP(h)));
}
/* env.rg_set_sprite_cell(entity, col, row) — pick the sheet cell to display. */
m3ApiRawFunction(m3_rg_set_sprite_cell) {
    m3ApiGetArg(int32_t, e)
    m3ApiGetArg(int32_t, col)
    m3ApiGetArg(int32_t, row)
    rgfx_scene_set_sprite_cell(e, col, row);
    m3ApiSuccess();
}
m3ApiRawFunction(m3_rg_create_box) {
    m3ApiReturnType(int32_t)
    m3ApiGetArg(int32_t, x0)
    m3ApiGetArg(int32_t, y0)
    m3ApiGetArg(int32_t, z0)
    m3ApiGetArg(int32_t, x1)
    m3ApiGetArg(int32_t, y1)
    m3ApiGetArg(int32_t, z1)
    m3ApiGetArg(int32_t, texId)
    m3ApiReturn(rgfx_scene_create_box(RG3D_FP(x0), RG3D_FP(y0), RG3D_FP(z0), RG3D_FP(x1), RG3D_FP(y1), RG3D_FP(z1), texId));
}
m3ApiRawFunction(m3_rg_create_mesh_entity) {
    m3ApiReturnType(int32_t)
    m3ApiGetArg(int32_t, meshId)
    m3ApiGetArg(int32_t, texId)
    m3ApiReturn(rgfx_scene_create_mesh_entity(meshId, texId));
}
m3ApiRawFunction(m3_rg_create_camera) {
    m3ApiReturnType(int32_t)
    m3ApiGetArg(int32_t, fovy)
    m3ApiGetArg(int32_t, nearp)
    m3ApiGetArg(int32_t, farp)
    m3ApiReturn(rgfx_scene_create_camera(RG3D_FP(fovy), RG3D_FP(nearp), RG3D_FP(farp)));
}
m3ApiRawFunction(m3_rg_create_light) {
    m3ApiReturnType(int32_t)
    m3ApiGetArg(int32_t, type)
    m3ApiGetArg(int32_t, color)
    m3ApiGetArg(int32_t, intensity)
    m3ApiReturn(rgfx_scene_create_light(type, color, RG3D_FP(intensity)));
}
m3ApiRawFunction(m3_rg_set_position) {
    m3ApiGetArg(int32_t, e)
    m3ApiGetArg(int32_t, x)
    m3ApiGetArg(int32_t, y)
    m3ApiGetArg(int32_t, z)
    rgfx_scene_set_position(e, RG3D_FP(x), RG3D_FP(y), RG3D_FP(z));
    m3ApiSuccess();
}
m3ApiRawFunction(m3_rg_set_rotation) {
    m3ApiGetArg(int32_t, e)
    m3ApiGetArg(int32_t, qx)
    m3ApiGetArg(int32_t, qy)
    m3ApiGetArg(int32_t, qz)
    m3ApiGetArg(int32_t, qw)
    rgfx_scene_set_rotation(e, RG3D_Q(qx), RG3D_Q(qy), RG3D_Q(qz), RG3D_Q(qw));
    m3ApiSuccess();
}
m3ApiRawFunction(m3_rg_set_scale) {
    m3ApiGetArg(int32_t, e)
    m3ApiGetArg(int32_t, sx)
    m3ApiGetArg(int32_t, sy)
    m3ApiGetArg(int32_t, sz)
    rgfx_scene_set_scale(e, RG3D_FP(sx), RG3D_FP(sy), RG3D_FP(sz));
    m3ApiSuccess();
}
m3ApiRawFunction(m3_rg_set_target) {
    m3ApiGetArg(int32_t, e)
    m3ApiGetArg(int32_t, x)
    m3ApiGetArg(int32_t, y)
    m3ApiGetArg(int32_t, z)
    rgfx_scene_set_target(e, RG3D_FP(x), RG3D_FP(y), RG3D_FP(z));
    m3ApiSuccess();
}
m3ApiRawFunction(m3_rg_set_range) {
    m3ApiGetArg(int32_t, e)
    m3ApiGetArg(int32_t, r)
    rgfx_scene_set_range(e, RG3D_FP(r));
    m3ApiSuccess();
}
m3ApiRawFunction(m3_rg_set_enabled) {
    m3ApiGetArg(int32_t, e)
    m3ApiGetArg(int32_t, on)
    rgfx_scene_set_enabled(e, on);
    m3ApiSuccess();
}
m3ApiRawFunction(m3_rg_set_visible) {
    m3ApiGetArg(int32_t, e)
    m3ApiGetArg(int32_t, on)
    rgfx_scene_set_visible(e, on);
    m3ApiSuccess();
}
m3ApiRawFunction(m3_rg_set_active_camera) {
    m3ApiGetArg(int32_t, e)
    rgfx_scene_set_active_camera(e);
    m3ApiSuccess();
}
m3ApiRawFunction(m3_rg_destroy_entity) {
    m3ApiGetArg(int32_t, e)
    rgfx_scene_destroy(e);
    m3ApiSuccess();
}

static void rg_link_host_imports(RgWasmSlot* s) {
    if (!s || !s->module) {
        return;
    }
    /* host-managed 3D scene (IDEAL_3D Phase H) */
    (void)m3_LinkRawFunctionEx(s->module, "env", "rg_load_texture", "i(ii)", &m3_rg_load_texture, s);
    (void)m3_LinkRawFunctionEx(s->module, "env", "rg_load_model", "i(ii)", &m3_rg_load_model, s);
    (void)m3_LinkRawFunctionEx(s->module, "env", "rg_list_resources", "i(iiii)", &m3_rg_list_resources, s);
    (void)m3_LinkRawFunctionEx(s->module, "env", "rg_load_sprite", "i(ii)", &m3_rg_load_sprite, s);
    (void)m3_LinkRawFunctionEx(s->module, "env", "rg_create_sprite", "i(iiiii)", &m3_rg_create_sprite, s);
    (void)m3_LinkRawFunctionEx(s->module, "env", "rg_set_sprite_cell", "v(iii)", &m3_rg_set_sprite_cell, s);
    (void)m3_LinkRawFunctionEx(s->module, "env", "rg_create_box", "i(iiiiiii)", &m3_rg_create_box, s);
    (void)m3_LinkRawFunctionEx(s->module, "env", "rg_create_mesh_entity", "i(ii)", &m3_rg_create_mesh_entity, s);
    (void)m3_LinkRawFunctionEx(s->module, "env", "rg_create_camera", "i(iii)", &m3_rg_create_camera, s);
    (void)m3_LinkRawFunctionEx(s->module, "env", "rg_create_light", "i(iii)", &m3_rg_create_light, s);
    (void)m3_LinkRawFunctionEx(s->module, "env", "rg_set_position", "v(iiii)", &m3_rg_set_position, s);
    (void)m3_LinkRawFunctionEx(s->module, "env", "rg_set_rotation", "v(iiiii)", &m3_rg_set_rotation, s);
    (void)m3_LinkRawFunctionEx(s->module, "env", "rg_set_scale", "v(iiii)", &m3_rg_set_scale, s);
    (void)m3_LinkRawFunctionEx(s->module, "env", "rg_set_target", "v(iiii)", &m3_rg_set_target, s);
    (void)m3_LinkRawFunctionEx(s->module, "env", "rg_set_range", "v(ii)", &m3_rg_set_range, s);
    (void)m3_LinkRawFunctionEx(s->module, "env", "rg_set_enabled", "v(ii)", &m3_rg_set_enabled, s);
    (void)m3_LinkRawFunctionEx(s->module, "env", "rg_set_visible", "v(ii)", &m3_rg_set_visible, s);
    (void)m3_LinkRawFunctionEx(s->module, "env", "rg_set_active_camera", "v(i)", &m3_rg_set_active_camera, s);
    (void)m3_LinkRawFunctionEx(s->module, "env", "rg_destroy_entity", "v(i)", &m3_rg_destroy_entity, s);
    /* Suppress lookup failures: modules that don't import these still load. */
    (void)m3_LinkRawFunctionEx(s->module, "env", "rg_host_register_sheet",
                               "v(iiiiiiiii)", &m3_rg_host_register_sheet, s);
    (void)m3_LinkRawFunctionEx(s->module, "env", "rg_host_register_rect",
                               "v(iiiiiiii)", &m3_rg_host_register_rect, s);
    (void)m3_LinkRawFunctionEx(s->module, "env", "rg_spawn_worker",
                               "i(ii)", &m3_rg_spawn_worker, s);
    (void)m3_LinkRawFunctionEx(s->module, "env", "rg_ui_glow",
                               "v(iiii)", &m3_rg_ui_glow, s);
    (void)m3_LinkRawFunctionEx(s->module, "env", "rg_ui_effect",
                               "v(iiiiiiiii)", &m3_rg_ui_effect, s);
    /* AssemblyScript runtime import: present whenever a guest is built without
     * `--use abort=`. Link it so a stock-flags rebuild stays loadable instead of
     * being rejected by wasm3 as a missing import. */
    (void)m3_LinkRawFunctionEx(s->module, "env", "abort",
                               "v(iiii)", &m3_as_abort, s);
}

static int rg_alloc_handle(void) {
    int i;
    for (i = 0; i < RG_WASM_MAX; ++i) {
        if (!g_slots[i].in_use) {
            return i + 1;
        }
    }
    return 0;
}

static uint8_t* rg_read_file(const char* path, size_t* out_size) {
    FILE* f;
    long sz;
    uint8_t* buf;
    size_t n;

    if (!path || !out_size) {
        return NULL;
    }
    *out_size = 0;
    f = fopen(path, "rb");
    if (!f) {
        return NULL;
    }
    if (fseek(f, 0, SEEK_END) != 0) {
        fclose(f);
        return NULL;
    }
    sz = ftell(f);
    if (sz <= 0) {
        fclose(f);
        return NULL;
    }
    if (fseek(f, 0, SEEK_SET) != 0) {
        fclose(f);
        return NULL;
    }
    buf = (uint8_t*)malloc((size_t)sz);
    if (!buf) {
        fclose(f);
        return NULL;
    }
    n = fread(buf, 1, (size_t)sz, f);
    fclose(f);
    if (n != (size_t)sz) {
        free(buf);
        return NULL;
    }
    *out_size = (size_t)sz;
    return buf;
}

int rg_wasm_load(const char* path) {
    return rg_wasm_load_ex(path, 1); /* host-loaded modules may spawn one worker */
}

static int rg_wasm_load_ex(const char* path, int can_spawn) {
    RgWasmSlot* s;
    int handle;
    uint8_t* bytes;
    size_t size;
    M3Result r;

    bytes = rg_read_file(path, &size);
    if (!bytes) {
        fprintf(stderr, "[wasm] failed to read: %s\n", path ? path : "(null)");
        return 0;
    }

    handle = rg_alloc_handle();
    if (handle == 0) {
        free(bytes);
        fprintf(stderr, "[wasm] no free slot\n");
        return 0;
    }

    s = &g_slots[handle - 1];
    memset(s, 0, sizeof(*s));
    s->in_use = 1;
    s->can_spawn = can_spawn;
    s->spawned_child = 0;
    /* asset_dir = dirname(path) + "/assets" (for rg_load_texture). */
    if (path) {
        const char* slash = strrchr(path, '/');
        int dlen = slash ? (int)(slash - path) : 0;
        if (dlen > (int)sizeof(s->asset_dir) - 8) { dlen = (int)sizeof(s->asset_dir) - 8; }
        memcpy(s->asset_dir, path, (size_t)dlen);
        memcpy(s->asset_dir + dlen, "/assets", 8); /* includes the NUL */
    }

    s->env = m3_NewEnvironment();
    if (!s->env) {
        goto fail;
    }
    s->runtime = m3_NewRuntime(s->env, 64 * 1024, NULL);
    if (!s->runtime) {
        goto fail;
    }

    r = m3_ParseModule(s->env, &s->module, bytes, (uint32_t)size);
    free(bytes);
    bytes = NULL;
    if (r) {
        fprintf(stderr, "[wasm] parse failed: %s (%s)\n", path, r);
        goto fail;
    }

    r = m3_LoadModule(s->runtime, s->module);
    if (r) {
        fprintf(stderr, "[wasm] load module failed: %s (%s)\n", path, r);
        goto fail;
    }
    s->module_in_runtime = 1; /* runtime now owns the module */

    rg_link_host_imports(s);

    r = m3_CompileModule(s->module);
    if (r) {
        fprintf(stderr, "[wasm] compile failed: %s (%s)\n", path, r);
        goto fail;
    }

    return handle;

fail:
    if (bytes) {
        free(bytes);
    }
    /* Free the module directly only if the runtime does not own it yet; once
     * m3_LoadModule succeeds, m3_FreeRuntime frees it (see module_in_runtime). */
    if (s->module && !s->module_in_runtime) {
        m3_FreeModule(s->module);
    }
    s->module = NULL;
    if (s->runtime) {
        m3_FreeRuntime(s->runtime);
        s->runtime = NULL;
    }
    if (s->env) {
        m3_FreeEnvironment(s->env);
        s->env = NULL;
    }
    s->module_in_runtime = 0;
    s->in_use = 0;
    return 0;
}

void rg_wasm_close(int handle) {
    RgWasmSlot* s = rg_slot(handle);
    if (!s) {
        return;
    }
    /* Do NOT m3_FreeModule when the runtime owns the module — m3_FreeRuntime
     * frees it, and a second free crashes in Function_Release (double-free). */
    if (s->module && !s->module_in_runtime) {
        m3_FreeModule(s->module);
    }
    s->module = NULL;
    if (s->runtime) {
        m3_FreeRuntime(s->runtime);
        s->runtime = NULL;
    }
    if (s->env) {
        m3_FreeEnvironment(s->env);
        s->env = NULL;
    }
    s->module_in_runtime = 0;
    s->in_use = 0;
}

static IM3Function rg_find_fn(RgWasmSlot* s, const char* name) {
    IM3Function fn = NULL;
    M3Result r;

    if (!s || !name) {
        return NULL;
    }
    r = m3_FindFunction(&fn, s->runtime, name);
    if (r) {
        fprintf(stderr, "[wasm] find '%s': %s\n", name, r);
        return NULL;
    }
    return fn;
}

int32_t rg_wasm_call_i32(int handle, const char* name, int nargs,
                         int32_t a0, int32_t a1, int32_t a2, int32_t a3, int32_t a4) {
    RgWasmSlot* s = rg_slot(handle);
    IM3Function fn;
    M3Result r;
    int32_t ret = 0;

    fn = rg_find_fn(s, name);
    if (!fn) {
        return 0;
    }

    switch (nargs) {
    case 0: r = m3_CallV(fn); break;
    case 1: r = m3_CallV(fn, a0); break;
    case 2: r = m3_CallV(fn, a0, a1); break;
    case 3: r = m3_CallV(fn, a0, a1, a2); break;
    case 4: r = m3_CallV(fn, a0, a1, a2, a3); break;
    default: r = m3_CallV(fn, a0, a1, a2, a3, a4); break;
    }
    if (r) {
        fprintf(stderr, "[wasm] call '%s': %s\n", name, r);
        return 0;
    }
    if (m3_GetRetCount(fn) > 0) {
        r = m3_GetResultsV(fn, &ret);
        if (r) {
            fprintf(stderr, "[wasm] results '%s': %s\n", name, r);
            return 0;
        }
    }
    return ret;
}

void rg_wasm_call_void(int handle, const char* name, int nargs,
                       int32_t a0, int32_t a1, int32_t a2, int32_t a3, int32_t a4) {
    RgWasmSlot* s = rg_slot(handle);
    IM3Function fn;
    M3Result r;

    if (!s) {
        return;
    }
    fn = rg_find_fn(s, name);
    if (!fn) {
        return;
    }

    switch (nargs) {
    case 0: r = m3_CallV(fn); break;
    case 1: r = m3_CallV(fn, a0); break;
    case 2: r = m3_CallV(fn, a0, a1); break;
    case 3: r = m3_CallV(fn, a0, a1, a2); break;
    case 4: r = m3_CallV(fn, a0, a1, a2, a3); break;
    default: r = m3_CallV(fn, a0, a1, a2, a3, a4); break;
    }
    if (r) {
        fprintf(stderr, "[wasm] call '%s': %s\n", name, r);
    }
}

int rg_wasm_has_export(int handle, const char* name) {
    RgWasmSlot* s = rg_slot(handle);
    IM3Function fn = NULL;
    M3Result r;

    if (!s || !name) {
        return 0;
    }
    /* Query directly (not via rg_find_fn) so a missing optional export is silent
     * — the capability gate probes for handshake exports that MAY be absent. */
    r = m3_FindFunction(&fn, s->runtime, name);
    if (r || !fn) {
        return 0;
    }
    return 1;
}

static uint8_t* rg_wasm_mem(int handle) {
    RgWasmSlot* s = rg_slot(handle);
    if (!s) {
        return NULL;
    }
    return m3_GetMemory(s->runtime, NULL, 0);
}

uint32_t rg_wasm_mem_size(int handle) {
    RgWasmSlot* s = rg_slot(handle);
    if (!s) {
        return 0;
    }
    return m3_GetMemorySize(s->runtime);
}

int32_t rg_wasm_abi_base(int handle) {
    return rg_wasm_call_i32(handle, "abi_base", 0, 0, 0, 0, 0, 0);
}

/* Handle of the one worker this module spawned via rg_spawn_worker (0 = none). */
int rg_wasm_spawned_child(int handle) {
    RgWasmSlot* s = rg_slot(handle);
    return s ? s->spawned_child : 0;
}

int32_t rg_wasm_mem_read_i32(int handle, uint32_t off) {
    uint8_t* mem = rg_wasm_mem(handle);
    uint32_t sz;
    int32_t v;
    if (!mem) {
        return 0;
    }
    sz = m3_GetMemorySize(rg_slot(handle)->runtime);
    if (off + 4 > sz) {
        return 0;
    }
    memcpy(&v, mem + off, 4);
    return v;
}

void rg_wasm_mem_write_i32(int handle, uint32_t off, int32_t val) {
    RgWasmSlot* s = rg_slot(handle);
    uint8_t* mem;
    uint32_t sz;
    if (!s) {
        return;
    }
    mem = rg_wasm_mem(handle);
    if (!mem) {
        return;
    }
    sz = m3_GetMemorySize(s->runtime);
    if (off + 4 > sz) {
        return;
    }
    memcpy(mem + off, &val, 4);
}

int rg_wasm_host_res_reset(int handle) {
    RgWasmSlot* s = rg_slot(handle);
    if (!s) {
        return 0;
    }
    s->res_count = 0;
    return 0;
}

int rg_wasm_host_res_count(int handle) {
    RgWasmSlot* s = rg_slot(handle);
    if (!s) {
        return 0;
    }
    return s->res_count;
}

int rg_wasm_host_res_kind(int handle, int idx) {
    RgWasmSlot* s = rg_slot(handle);
    if (!s || idx < 0 || idx >= s->res_count) {
        return 0;
    }
    return s->res[idx].kind;
}

int rg_wasm_host_res_ival(int handle, int idx, int field) {
    RgWasmSlot* s = rg_slot(handle);
    RgWasmRes* rr;
    if (!s || idx < 0 || idx >= s->res_count) {
        return 0;
    }
    rr = &s->res[idx];
    switch (field) {
    case 0: return rr->fw;
    case 1: return rr->fh;
    case 2: return rr->scale;
    case 3: return rr->feet;
    case 4: return rr->w;
    case 5: return rr->h;
    case 6: return rr->r;
    case 7: return rr->g;
    case 8: return rr->b;
    case 9: return rr->drawLayer;
    default: return 0;
    }
}

const char* rg_wasm_host_res_id(int handle, int idx) {
    RgWasmSlot* s = rg_slot(handle);
    if (!s || idx < 0 || idx >= s->res_count) {
        return "";
    }
    return s->res[idx].id;
}

const char* rg_wasm_host_res_path(int handle, int idx) {
    RgWasmSlot* s = rg_slot(handle);
    if (!s || idx < 0 || idx >= s->res_count) {
        return "";
    }
    return s->res[idx].path;
}

/* Guest-requested UI effects (env.rg_ui_glow) — drained by the Ranger host after
 * each guest call, then cleared so the queue only holds this frame's requests. */
int rg_wasm_fx_reset(int handle) {
    RgWasmSlot* s = rg_slot(handle);
    if (!s) {
        return 0;
    }
    s->fx_count = 0;
    return 0;
}

int rg_wasm_fx_count(int handle) {
    RgWasmSlot* s = rg_slot(handle);
    if (!s) {
        return 0;
    }
    return s->fx_count;
}

int rg_wasm_fx_ival(int handle, int idx, int field) {
    RgWasmSlot* s = rg_slot(handle);
    RgWasmFx* fx;
    if (!s || idx < 0 || idx >= s->fx_count) {
        return 0;
    }
    fx = &s->fx[idx];
    switch (field) {
    case 0: return fx->kind;
    case 1: return fx->target;
    case 2: return fx->node;
    case 3: return fx->durMs;
    case 4: return fx->delayMs;
    case 5: return fx->tag;
    case 6: return fx->r;
    case 7: return fx->g;
    case 8: return fx->b;
    default: return 0;
    }
}
