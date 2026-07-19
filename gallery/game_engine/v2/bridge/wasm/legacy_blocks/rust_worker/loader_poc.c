/* PoC: a game guest spawns a *separate* resource-loader WASM module and drives
 * it to produce resources. The loader here is AssemblyScript
 * (as_resource_loader -> resource_loader.wasm), proving the loader can be AS —
 * it plugs into the same wasm3 bridge and RGX/RGLD block ABI as the Rust guest.
 *
 * Flow:
 *   1. host loads the game guest (rust_worker / worker.wasm);
 *   2. host writes the loader path into the game's RGX1 block and the game calls
 *      spawn_loader() -> the host loads resource_loader.wasm as the one worker;
 *   3. host drives the loader: for each cell, write a generate request, call
 *      loader_tick(), read the produced resource, materialise a mock handle.
 *
 * Run: gallery/game_engine/scripts/build-loader-poc.sh
 */
#include <stdio.h>
#include <string.h>
#include "rg_wasm_bridge.h"

/* RGX1 (game guest) — must match wasm/rust_worker/src/lib.rs. */
#define X_OFF_LOADER_PATH_LEN 2208
#define X_OFF_LOADER_PATH 2212

/* RGLD (loader) — must match wasm/as_resource_loader/assembly/index.ts. */
#define L_MAGIC 0x444C4752
#define L_OFF_MAGIC 0
#define L_OFF_REQ_KIND 16
#define L_OFF_REQ_CELLX 20
#define L_OFF_REQ_CELLY 24
#define L_OFF_STATUS 32
#define L_OFF_BYTES 36
#define L_OFF_CHECKSUM 40
#define L_OFF_WIDTH 44
#define L_OFF_HEIGHT 48

static int failures = 0;
static void expect(const char *name, int cond) {
    printf("  %-44s %s\n", name, cond ? "ok" : "FAIL");
    if (!cond) failures++;
}

/* Write a byte string into guest linear memory via 4-byte word writes. */
static void write_str(int h, int off, const char *s) {
    int len = (int)strlen(s);
    for (int i = 0; i < len; i += 4) {
        int w = 0;
        for (int b = 0; b < 4 && i + b < len; b++)
            w |= ((int)(unsigned char)s[i + b]) << (8 * b);
        rg_wasm_mem_write_i32(h, (unsigned)(off + i), w);
    }
}

int main(int argc, char **argv) {
    setvbuf(stdout, NULL, _IONBF, 0);
    const char *game_wasm = (argc > 1) ? argv[1]
        : "gallery/game_engine/games/streaming_worker/worker.wasm";
    const char *loader_path = (argc > 2) ? argv[2]
        : "gallery/game_engine/games/streaming_worker/resource_loader.wasm";

    int game = rg_wasm_load(game_wasm);
    if (game <= 0) { printf("ERROR: load game %s\n", game_wasm); return 2; }
    rg_wasm_call_void(game, "worker_init", 0, 0, 0, 0, 0, 0);
    int gbase = rg_wasm_call_i32(game, "worker_ptr", 0, 0, 0, 0, 0, 0);
    printf("game guest loaded (handle=%d)\n", game);

    /* Tell the game which loader to spawn, then let it spawn it. */
    rg_wasm_mem_write_i32(game, (unsigned)(gbase + X_OFF_LOADER_PATH_LEN),
                          (int)strlen(loader_path));
    write_str(game, gbase + X_OFF_LOADER_PATH, loader_path);

    int loader = rg_wasm_call_i32(game, "spawn_loader", 0, 0, 0, 0, 0, 0);
    printf("game spawned loader -> handle=%d (%s)\n", loader, loader_path);
    expect("game spawned a separate loader (handle > 0)", loader > 0);
    expect("loader is the game's recorded child", rg_wasm_spawned_child(game) == loader);
    if (loader <= 0) { printf("\nLOADER_POC_FAILED\n"); return 1; }

    rg_wasm_call_void(loader, "loader_init", 0, 0, 0, 0, 0, 0);
    int lbase = rg_wasm_call_i32(loader, "loader_ptr", 0, 0, 0, 0, 0, 0);
    int lmagic = rg_wasm_mem_read_i32(loader, (unsigned)(lbase + L_OFF_MAGIC));
    printf("loader is AssemblyScript, magic=0x%08x (%s)\n\n",
           lmagic, lmagic == L_MAGIC ? "RGLD ok" : "BAD");
    expect("loader block is RGLD", lmagic == L_MAGIC);

    /* Drive the loader: generate a resource per cell, materialise a handle. */
    long next_handle = 1;
    int prev_checksum = -1;
    int distinct = 1;
    printf("cell  status bytes  wxh     checksum    handle\n");
    printf("----  ------ -----  ------  ----------  ------\n");
    for (int cell = 0; cell < 4; cell++) {
        rg_wasm_mem_write_i32(loader, (unsigned)(lbase + L_OFF_REQ_KIND), 2); /* generate */
        rg_wasm_mem_write_i32(loader, (unsigned)(lbase + L_OFF_REQ_CELLX), cell);
        rg_wasm_mem_write_i32(loader, (unsigned)(lbase + L_OFF_REQ_CELLY), 0);

        rg_wasm_call_void(loader, "loader_tick", 0, 0, 0, 0, 0, 0);

        int status = rg_wasm_mem_read_i32(loader, (unsigned)(lbase + L_OFF_STATUS));
        int bytes = rg_wasm_mem_read_i32(loader, (unsigned)(lbase + L_OFF_BYTES));
        int csum = rg_wasm_mem_read_i32(loader, (unsigned)(lbase + L_OFF_CHECKSUM));
        int w = rg_wasm_mem_read_i32(loader, (unsigned)(lbase + L_OFF_WIDTH));
        int hgt = rg_wasm_mem_read_i32(loader, (unsigned)(lbase + L_OFF_HEIGHT));
        long handle = (status == 1 && bytes > 0) ? next_handle++ : 0; /* materialise */
        printf("%4d  %6d %5d  %2dx%-3d  %10d  %6ld\n",
               cell, status, bytes, w, hgt, csum, handle);
        expect("resource produced (status ready, bytes > 0)", status == 1 && bytes > 0);
        if (cell > 0 && csum == prev_checksum) distinct = 0;
        prev_checksum = csum;
    }
    expect("each cell produced a distinct resource", distinct);
    printf("\nmaterialised %ld resource handles from the AS loader\n", next_handle - 1);

    rg_wasm_close(loader);
    rg_wasm_close(game);
    if (failures == 0) { printf("\nLOADER_POC_OK\n"); return 0; }
    printf("\nLOADER_POC_FAILED (%d)\n", failures);
    return 1;
}
