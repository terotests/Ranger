/* Host harness for the Ranger2D streaming worker WASM module.
 *
 * Drives the real worker.wasm (culling + asset load/free policy) over the wasm3
 * bridge exactly as the engine would: write an observation (camera + world +
 * entities) into the shared RGX1 block, call worker_tick(), then drain the
 * results — per-entity visibility (culling) and cell load/free requests
 * (loading). The worker owns the *policy*; this host owns *materialisation*
 * (a mock resource table standing in for rg_res_* / GL upload).
 *
 * Build/run: gallery/game_engine/scripts/build-worker-demo.sh
 */
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "rg_wasm_bridge.h"

/* RGX1 layout — must match wasm/rust_worker/src/lib.rs. */
#define OFF_MAGIC 0
#define OFF_VERSION 4
#define OFF_SIZE 8
#define OFF_REVISION 12
#define OFF_CAM_X 16
#define OFF_CAM_Y 20
#define OFF_CAM_ZOOM_M 24
#define OFF_VIEW_W 28
#define OFF_VIEW_H 32
#define OFF_WORLD_COLS 36
#define OFF_WORLD_ROWS 40
#define OFF_CELL_W 44
#define OFF_CELL_H 48
#define OFF_PRELOAD_R 52
#define OFF_RETIRE_R 56
#define OFF_CULL_MARGIN 60
#define OFF_ENT_COUNT 64
#define OFF_FRAME 68
#define OFF_ENTITIES 128
#define ENT_SIZE 20
#define OFF_VIS_FLAGS 1408
#define OFF_VISIBLE_CNT 1664
#define OFF_CULLED_CNT 1668
#define OFF_LOAD_CNT 1680
#define OFF_FREE_CNT 1684
#define OFF_LOAD_REQ 1696
#define OFF_FREE_REQ 1952
#define REQ_SIZE 8
#define RGX1_MAGIC 0x31584752

/* Mock resource host: what the worker asks to load/free is materialised here
 * into stable u64-ish handles (the real engine does rg_res_* + GL upload). */
#define MAX_RES 64
static int res_cx[MAX_RES], res_cy[MAX_RES];
static long res_handle[MAX_RES];
static int res_n = 0;
static long next_handle = 1;
static long total_loads = 0, total_frees = 0;

static long res_find(int cx, int cy) {
    for (int i = 0; i < res_n; i++)
        if (res_cx[i] == cx && res_cy[i] == cy) return res_handle[i];
    return 0;
}

static long res_load(int cx, int cy) {
    if (res_find(cx, cy)) return res_find(cx, cy); /* dedup */
    if (res_n >= MAX_RES) return 0;
    long h = next_handle++;
    res_cx[res_n] = cx;
    res_cy[res_n] = cy;
    res_handle[res_n] = h;
    res_n++;
    total_loads++;
    return h;
}

static void res_free(int cx, int cy) {
    for (int i = 0; i < res_n; i++) {
        if (res_cx[i] == cx && res_cy[i] == cy) {
            res_n--;
            res_cx[i] = res_cx[res_n];
            res_cy[i] = res_cy[res_n];
            res_handle[i] = res_handle[res_n];
            total_frees++;
            return;
        }
    }
}

static int failures = 0;
static void expect(const char *name, int cond) {
    if (!cond) {
        printf("  ASSERT FAIL: %s\n", name);
        failures++;
    }
}

int main(int argc, char **argv) {
    const char *wasm = (argc > 1) ? argv[1]
        : "gallery/game_engine/games/streaming_worker/worker.wasm";

    /* Unbuffered so the trace survives even if teardown misbehaves. */
    setvbuf(stdout, NULL, _IONBF, 0);

    int h = rg_wasm_load(wasm);
    if (h <= 0) { /* rg_wasm_load returns 0 on failure, handles are >= 1 */
        printf("ERROR: could not load %s\n", wasm);
        return 2;
    }
    rg_wasm_call_void(h, "worker_init", 0, 0, 0, 0, 0, 0);
    int base = rg_wasm_call_i32(h, "worker_ptr", 0, 0, 0, 0, 0, 0);
    int size = rg_wasm_call_i32(h, "worker_size", 0, 0, 0, 0, 0, 0);
    int magic = rg_wasm_mem_read_i32(h, (unsigned)(base + OFF_MAGIC));
    printf("worker loaded: ptr=%d size=%d magic=0x%08x (%s)\n", base, size, magic,
           magic == RGX1_MAGIC ? "RGX1 ok" : "BAD MAGIC");
    expect("magic is RGX1", magic == RGX1_MAGIC);

    /* World: 6x1 cells of 200x270; camera pans right half a cell per frame. */
    const int COLS = 6, ROWS = 1, CELLW = 200, CELLH = 270;
    const int VIEWW = 200, VIEWH = 270;
    const int PRELOAD = 1, RETIRE = 2, MARGIN = 32;
    const int ENTC = COLS; /* one 16x16 entity at the centre of each cell */

    /* Static observation fields written once. */
    rg_wasm_mem_write_i32(h, (unsigned)(base + OFF_VIEW_W), VIEWW);
    rg_wasm_mem_write_i32(h, (unsigned)(base + OFF_VIEW_H), VIEWH);
    rg_wasm_mem_write_i32(h, (unsigned)(base + OFF_WORLD_COLS), COLS);
    rg_wasm_mem_write_i32(h, (unsigned)(base + OFF_WORLD_ROWS), ROWS);
    rg_wasm_mem_write_i32(h, (unsigned)(base + OFF_CELL_W), CELLW);
    rg_wasm_mem_write_i32(h, (unsigned)(base + OFF_CELL_H), CELLH);
    rg_wasm_mem_write_i32(h, (unsigned)(base + OFF_PRELOAD_R), PRELOAD);
    rg_wasm_mem_write_i32(h, (unsigned)(base + OFF_RETIRE_R), RETIRE);
    rg_wasm_mem_write_i32(h, (unsigned)(base + OFF_CULL_MARGIN), MARGIN);
    rg_wasm_mem_write_i32(h, (unsigned)(base + OFF_ENT_COUNT), ENTC);
    for (int i = 0; i < ENTC; i++) {
        int e = base + OFF_ENTITIES + i * ENT_SIZE;
        rg_wasm_mem_write_i32(h, (unsigned)(e + 0), i);              /* id */
        rg_wasm_mem_write_i32(h, (unsigned)(e + 4), i * CELLW + 100); /* x centre */
        rg_wasm_mem_write_i32(h, (unsigned)(e + 8), 135);            /* y */
        rg_wasm_mem_write_i32(h, (unsigned)(e + 12), 16);            /* w */
        rg_wasm_mem_write_i32(h, (unsigned)(e + 16), 16);            /* h */
    }

    int frames = 11;
    int saw_cull = 0, saw_load = 0, saw_free = 0;
    printf("\nframe camX cell  vis/cull   load        free        live\n");
    printf("----- ---- ----  --------   ----------  ----------  ----\n");
    for (int f = 0; f < frames; f++) {
        int camX = f * 100;
        rg_wasm_mem_write_i32(h, (unsigned)(base + OFF_CAM_X), camX);
        rg_wasm_mem_write_i32(h, (unsigned)(base + OFF_CAM_Y), 0);
        rg_wasm_mem_write_i32(h, (unsigned)(base + OFF_FRAME), f);

        rg_wasm_call_void(h, "worker_tick", 0, 0, 0, 0, 0, 0);

        int vis = rg_wasm_mem_read_i32(h, (unsigned)(base + OFF_VISIBLE_CNT));
        int cull = rg_wasm_mem_read_i32(h, (unsigned)(base + OFF_CULLED_CNT));
        int ln = rg_wasm_mem_read_i32(h, (unsigned)(base + OFF_LOAD_CNT));
        int fn = rg_wasm_mem_read_i32(h, (unsigned)(base + OFF_FREE_CNT));
        int ccx = (camX + VIEWW / 2) / CELLW;

        char loadbuf[64] = "-", freebuf[64] = "-";
        int lp = 0, fp = 0;
        for (int i = 0; i < ln; i++) {
            int r = base + OFF_LOAD_REQ + i * REQ_SIZE;
            int cx = rg_wasm_mem_read_i32(h, (unsigned)(r));
            int cy = rg_wasm_mem_read_i32(h, (unsigned)(r + 4));
            res_load(cx, cy);
            lp += snprintf(loadbuf + (lp ? lp : 0), sizeof(loadbuf) - lp,
                           "%s%d", i ? "," : "", cx);
        }
        for (int i = 0; i < fn; i++) {
            int r = base + OFF_FREE_REQ + i * REQ_SIZE;
            int cx = rg_wasm_mem_read_i32(h, (unsigned)(r));
            int cy = rg_wasm_mem_read_i32(h, (unsigned)(r + 4));
            res_free(cx, cy);
            fp += snprintf(freebuf + (fp ? fp : 0), sizeof(freebuf) - fp,
                           "%s%d", i ? "," : "", cx);
        }
        if (cull > 0) saw_cull = 1;
        if (ln > 0) saw_load = 1;
        if (fn > 0) saw_free = 1;

        printf("%5d %4d %4d  %3d/%-4d   %-10s  %-10s  %4d\n",
               f, camX, ccx, vis, cull, loadbuf, freebuf, res_n);

        /* Every frame every entity is classified. */
        expect("vis+cull == entity count", vis + cull == ENTC);
    }

    printf("\ntotals: loads=%ld frees=%ld live=%d\n", total_loads, total_frees, res_n);
    /* The worker must have culled offscreen entities, loaded cells ahead, and
     * freed cells behind as the camera crossed the world. */
    expect("some entities were culled", saw_cull);
    expect("cells were loaded", saw_load);
    expect("cells were freed (hysteresis)", saw_free);
    expect("live resources bounded by ring", res_n > 0 && res_n <= (2 * RETIRE + 1));
    expect("more loads than final live (churn happened)", total_loads > res_n);

    rg_wasm_close(h);
    if (failures == 0) {
        printf("\nWORKER_DEMO_OK\n");
        return 0;
    }
    printf("\nWORKER_DEMO_FAILED (%d)\n", failures);
    return 1;
}
