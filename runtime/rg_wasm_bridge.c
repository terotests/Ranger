#include "rg_wasm_bridge.h"

#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#include "wasm3/wasm3.h"

typedef struct RgWasmSlot {
    IM3Environment env;
    IM3Runtime runtime;
    IM3Module module;
    int in_use;
} RgWasmSlot;

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
    if (s->module) {
        m3_FreeModule(s->module);
        s->module = NULL;
    }
    if (s->runtime) {
        m3_FreeRuntime(s->runtime);
        s->runtime = NULL;
    }
    if (s->env) {
        m3_FreeEnvironment(s->env);
        s->env = NULL;
    }
    s->in_use = 0;
    return 0;
}

void rg_wasm_close(int handle) {
    RgWasmSlot* s = rg_slot(handle);
    if (!s) {
        return;
    }
    if (s->module) {
        m3_FreeModule(s->module);
        s->module = NULL;
    }
    if (s->runtime) {
        m3_FreeRuntime(s->runtime);
        s->runtime = NULL;
    }
    if (s->env) {
        m3_FreeEnvironment(s->env);
        s->env = NULL;
    }
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
