/* Streaming-world stress test (games/streaming_world).
 *
 * A player roams an effectively-infinite (really 1000x1000-cell) world. Two WASM
 * modules run the whole pipeline:
 *   - the Rust game guest (worker.wasm) computes the camera residency ring each
 *     step: which cells to LOAD ahead of the player and which to FREE behind;
 *   - the AssemblyScript loader (resource_loader.wasm) GENERATES a resource per
 *     new cell and RELEASES it on free, as a bounded pool.
 *
 * The point of the stress test: as the player walks arbitrarily far, resources
 * are generated ahead and freed behind, and live resource use stays BOUNDED.
 * A HUD prints the player coordinates + live/peak/generated/freed and an ASCII
 * map of the loaded neighbourhood.
 *
 * Run: gallery/game_engine/scripts/build-world-stress.sh
 */
#include <stdio.h>
#include <string.h>
#include "rg_wasm_bridge.h"

/* RGX1 (game guest / worker) — must match wasm/rust_worker/src/lib.rs. */
#define X_CAM_X 16
#define X_CAM_Y 20
#define X_VIEW_W 28
#define X_VIEW_H 32
#define X_WORLD_COLS 36
#define X_WORLD_ROWS 40
#define X_CELL_W 44
#define X_CELL_H 48
#define X_PRELOAD_R 52
#define X_RETIRE_R 56
#define X_CULL_MARGIN 60
#define X_ENT_COUNT 64
#define X_LOAD_CNT 1680
#define X_FREE_CNT 1684
#define X_LOAD_REQ 1696
#define X_FREE_REQ 1952
#define X_REQ_SIZE 8
#define X_LOADER_PATH_LEN 2208
#define X_LOADER_PATH 2212

/* RGLD (loader) — must match wasm/as_resource_loader/assembly/index.ts. */
#define L_REQ_KIND 16
#define L_REQ_CELLX 20
#define L_REQ_CELLY 24
#define L_STATUS 32
#define L_LIVE 56
#define L_PEAK 60
#define L_TOTAL_GEN 64
#define L_TOTAL_FREED 68

/* World / camera config. */
#define COLS 1000
#define ROWS 1000
#define CELLW 64
#define CELLH 64
#define VIEWW 64
#define VIEWH 64
#define PRELOAD 1
#define RETIRE 2
#define RING_MAX ((2 * RETIRE + 1) * (2 * RETIRE + 1)) /* max live cells = 25 */

/* Host-side mirror of live cells (for the HUD map + handle bookkeeping). */
#define HOST_MAX 128
static int hc_x[HOST_MAX], hc_y[HOST_MAX];
static long hc_handle[HOST_MAX];
static int hc_n = 0;
static long next_handle = 1;

static long host_find(int cx, int cy) {
    for (int i = 0; i < hc_n; i++)
        if (hc_x[i] == cx && hc_y[i] == cy) return hc_handle[i];
    return 0;
}
static void host_add(int cx, int cy, long h) {
    if (host_find(cx, cy) || hc_n >= HOST_MAX) return;
    hc_x[hc_n] = cx; hc_y[hc_n] = cy; hc_handle[hc_n] = h; hc_n++;
}
static void host_remove(int cx, int cy) {
    for (int i = 0; i < hc_n; i++)
        if (hc_x[i] == cx && hc_y[i] == cy) {
            hc_n--; hc_x[i] = hc_x[hc_n]; hc_y[i] = hc_y[hc_n]; hc_handle[i] = hc_handle[hc_n];
            return;
        }
}

static int failures = 0;
static void expect(const char *name, int cond) {
    if (!cond) { printf("  ASSERT FAIL: %s\n", name); failures++; }
}

static void write_str(int h, int off, const char *s) {
    int len = (int)strlen(s);
    for (int i = 0; i < len; i += 4) {
        int w = 0;
        for (int b = 0; b < 4 && i + b < len; b++)
            w |= ((int)(unsigned char)s[i + b]) << (8 * b);
        rg_wasm_mem_write_i32(h, (unsigned)(off + i), w);
    }
}

static int game, loader, gbase, lbase;

/* Apply one worker request (load or free) to the AS loader + host mirror. */
static void loader_op(int kind, int cx, int cy) {
    rg_wasm_mem_write_i32(loader, (unsigned)(lbase + L_REQ_KIND), kind);
    rg_wasm_mem_write_i32(loader, (unsigned)(lbase + L_REQ_CELLX), cx);
    rg_wasm_mem_write_i32(loader, (unsigned)(lbase + L_REQ_CELLY), cy);
    rg_wasm_call_void(loader, "loader_tick", 0, 0, 0, 0, 0, 0);
    int status = rg_wasm_mem_read_i32(loader, (unsigned)(lbase + L_STATUS));
    if (kind == 3) {
        host_remove(cx, cy);
    } else if (status == 1) {
        host_add(cx, cy, next_handle++);
    }
}

/* One player step: move, run the worker ring, apply load/free to the loader. */
static void step(int *px, int *py, int dx, int dy) {
    *px += dx; *py += dy;
    int camX = *px - VIEWW / 2;
    int camY = *py - VIEWH / 2;
    rg_wasm_mem_write_i32(game, (unsigned)(gbase + X_CAM_X), camX);
    rg_wasm_mem_write_i32(game, (unsigned)(gbase + X_CAM_Y), camY);
    rg_wasm_call_void(game, "worker_tick", 0, 0, 0, 0, 0, 0);

    int ln = rg_wasm_mem_read_i32(game, (unsigned)(gbase + X_LOAD_CNT));
    int fn = rg_wasm_mem_read_i32(game, (unsigned)(gbase + X_FREE_CNT));
    for (int i = 0; i < fn; i++) {
        int r = gbase + X_FREE_REQ + i * X_REQ_SIZE;
        loader_op(3, rg_wasm_mem_read_i32(game, (unsigned)r),
                     rg_wasm_mem_read_i32(game, (unsigned)(r + 4)));
    }
    for (int i = 0; i < ln; i++) {
        int r = gbase + X_LOAD_REQ + i * X_REQ_SIZE;
        loader_op(2, rg_wasm_mem_read_i32(game, (unsigned)r),
                     rg_wasm_mem_read_i32(game, (unsigned)(r + 4)));
    }
}

static void hud(int px, int py, int stepNo) {
    int live = rg_wasm_mem_read_i32(loader, (unsigned)(lbase + L_LIVE));
    int peak = rg_wasm_mem_read_i32(loader, (unsigned)(lbase + L_PEAK));
    int gen = rg_wasm_mem_read_i32(loader, (unsigned)(lbase + L_TOTAL_GEN));
    int freed = rg_wasm_mem_read_i32(loader, (unsigned)(lbase + L_TOTAL_FREED));
    int pcx = px / CELLW, pcy = py / CELLH;
    printf("\n[HUD] step %-4d  pos (%5d,%5d)  cell (%3d,%3d)   live=%-2d peak=%-2d  gen=%-4d freed=%-4d  host_handles=%d\n",
           stepNo, px, py, pcx, pcy, live, peak, gen, freed, hc_n);
    for (int dy = -2; dy <= 2; dy++) {
        printf("        ");
        for (int dx = -2; dx <= 2; dx++) {
            int cx = pcx + dx, cy = pcy + dy;
            if (dx == 0 && dy == 0) printf(" @");
            else printf(" %c", host_find(cx, cy) ? '#' : '.');
        }
        printf("\n");
    }
}

int main(int argc, char **argv) {
    setvbuf(stdout, NULL, _IONBF, 0);
    const char *game_wasm = (argc > 1) ? argv[1]
        : "gallery/game_engine/games/streaming_worker/worker.wasm";
    const char *loader_path = (argc > 2) ? argv[2]
        : "gallery/game_engine/games/streaming_worker/resource_loader.wasm";

    game = rg_wasm_load(game_wasm);
    if (game <= 0) { printf("ERROR: load game\n"); return 2; }
    rg_wasm_call_void(game, "worker_init", 0, 0, 0, 0, 0, 0);
    gbase = rg_wasm_call_i32(game, "worker_ptr", 0, 0, 0, 0, 0, 0);

    /* Static world config for the worker. */
    rg_wasm_mem_write_i32(game, (unsigned)(gbase + X_VIEW_W), VIEWW);
    rg_wasm_mem_write_i32(game, (unsigned)(gbase + X_VIEW_H), VIEWH);
    rg_wasm_mem_write_i32(game, (unsigned)(gbase + X_WORLD_COLS), COLS);
    rg_wasm_mem_write_i32(game, (unsigned)(gbase + X_WORLD_ROWS), ROWS);
    rg_wasm_mem_write_i32(game, (unsigned)(gbase + X_CELL_W), CELLW);
    rg_wasm_mem_write_i32(game, (unsigned)(gbase + X_CELL_H), CELLH);
    rg_wasm_mem_write_i32(game, (unsigned)(gbase + X_PRELOAD_R), PRELOAD);
    rg_wasm_mem_write_i32(game, (unsigned)(gbase + X_RETIRE_R), RETIRE);
    rg_wasm_mem_write_i32(game, (unsigned)(gbase + X_CULL_MARGIN), 0);
    rg_wasm_mem_write_i32(game, (unsigned)(gbase + X_ENT_COUNT), 0);

    /* Game spawns the separate AS resource loader. */
    rg_wasm_mem_write_i32(game, (unsigned)(gbase + X_LOADER_PATH_LEN), (int)strlen(loader_path));
    write_str(game, gbase + X_LOADER_PATH, loader_path);
    loader = rg_wasm_call_i32(game, "spawn_loader", 0, 0, 0, 0, 0, 0);
    if (loader <= 0) { printf("ERROR: spawn loader\n"); return 2; }
    rg_wasm_call_void(loader, "loader_init", 0, 0, 0, 0, 0, 0);
    lbase = rg_wasm_call_i32(loader, "loader_ptr", 0, 0, 0, 0, 0, 0);

    printf("streaming-world stress test\n");
    printf("world %dx%d cells of %dx%d px  (%d cells, effectively infinite)\n",
           COLS, ROWS, CELLW, CELLH, COLS * ROWS);
    printf("game guest=%d, AS loader=%d, ring cap=%d cells\n", game, loader, RING_MAX);

    /* Player starts near the middle and walks a long boustrophedon path, so it
     * crosses far more cells than could ever be resident at once. */
    int px = COLS / 2 * CELLW, py = ROWS / 2 * CELLH;
    step(&px, &py, 0, 0); /* prime the starting ring */
    hud(px, py, 0);

    int stepNo = 0;
    int peak_host = 0;
    /* 6 sweeps of 60 cells right/left, dropping 3 cells between: ~400 steps. */
    for (int sweep = 0; sweep < 6; sweep++) {
        int dir = (sweep % 2 == 0) ? CELLW : -CELLW;
        for (int i = 0; i < 60; i++) { step(&px, &py, dir, 0); stepNo++;
            if (hc_n > peak_host) peak_host = hc_n; }
        for (int i = 0; i < 3; i++) { step(&px, &py, 0, CELLH); stepNo++;
            if (hc_n > peak_host) peak_host = hc_n; }
        hud(px, py, stepNo);
    }

    int live = rg_wasm_mem_read_i32(loader, (unsigned)(lbase + L_LIVE));
    int peak = rg_wasm_mem_read_i32(loader, (unsigned)(lbase + L_PEAK));
    int gen = rg_wasm_mem_read_i32(loader, (unsigned)(lbase + L_TOTAL_GEN));
    int freed = rg_wasm_mem_read_i32(loader, (unsigned)(lbase + L_TOTAL_FREED));
    printf("\n=== summary after %d steps ===\n", stepNo);
    printf("generated=%d  freed=%d  live=%d  peak_live=%d  host_handles=%d peak=%d\n",
           gen, freed, live, peak, hc_n, peak_host);

    /* The whole point: memory stayed bounded while the player roamed far. */
    expect("generated many resources (roamed far)", gen > 300);
    expect("freed almost all of them", freed > gen - RING_MAX);
    expect("live == generated - freed (conservation)", live == gen - freed);
    expect("live resources bounded by the ring", live <= RING_MAX);
    expect("peak live bounded by the ring", peak <= RING_MAX);
    expect("host handle mirror matches loader live", hc_n == live);

    rg_wasm_close(loader);
    rg_wasm_close(game);
    if (failures == 0) { printf("\nWORLD_STRESS_OK\n"); return 0; }
    printf("\nWORLD_STRESS_FAILED (%d)\n", failures);
    return 1;
}
