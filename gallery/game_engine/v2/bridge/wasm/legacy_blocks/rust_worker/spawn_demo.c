/* Verifies the rg_spawn_worker capability and its limits (this stage):
 *
 *   1. A host-loaded guest can load ONE resource-loader worker from its own
 *      WASM code (spawn_loader() -> child handle > 0).
 *   2. A second spawn from the same guest is denied (limit one) -> 0.
 *   3. The spawned worker may NOT load further workers -> 0.
 *
 * The guest here is worker.wasm itself (it exports spawn_loader, which calls the
 * env.rg_spawn_worker host import); a real game guest — in practice AS — calls
 * the identical import. Run: gallery/game_engine/scripts/build-spawn-demo.sh
 */
#include <stdio.h>
#include "rg_wasm_bridge.h"

static int failures = 0;
static void expect(const char *name, int cond) {
    printf("  %-42s %s\n", name, cond ? "ok" : "FAIL");
    if (!cond) failures++;
}

int main(int argc, char **argv) {
    setvbuf(stdout, NULL, _IONBF, 0);
    const char *wasm = (argc > 1) ? argv[1]
        : "gallery/game_engine/games/streaming_worker/worker.wasm";

    /* Top-level "game" guest, loaded by the host (may spawn one worker). */
    int game = rg_wasm_load(wasm);
    if (game <= 0) {
        printf("ERROR: could not load %s\n", wasm);
        return 2;
    }
    printf("game guest loaded: handle=%d\n\n", game);

    /* 1. Guest loads one resource worker from its own code. */
    int child1 = rg_wasm_call_i32(game, "spawn_loader", 0, 0, 0, 0, 0, 0);
    printf("spawn_loader() #1 -> %d\n", child1);
    expect("guest spawned one worker (handle > 0)", child1 > 0);
    expect("bridge recorded the child", rg_wasm_spawned_child(game) == child1);

    /* 2. Second spawn from the same guest is denied (limit one). */
    int child2 = rg_wasm_call_i32(game, "spawn_loader", 0, 0, 0, 0, 0, 0);
    printf("spawn_loader() #2 -> %d\n", child2);
    expect("second spawn denied (limit one)", child2 == 0);
    expect("child unchanged after denied spawn", rg_wasm_spawned_child(game) == child1);

    /* 3. The spawned worker may not load further workers. */
    if (child1 > 0) {
        int grand = rg_wasm_call_i32(child1, "spawn_loader", 0, 0, 0, 0, 0, 0);
        printf("child.spawn_loader() -> %d\n", grand);
        expect("resource worker cannot spawn (denied)", grand == 0);
        expect("no grandchild recorded", rg_wasm_spawned_child(child1) == 0);
    }

    rg_wasm_close(child1);
    rg_wasm_close(game);
    if (failures == 0) {
        printf("\nSPAWN_DEMO_OK\n");
        return 0;
    }
    printf("\nSPAWN_DEMO_FAILED (%d)\n", failures);
    return 1;
}
