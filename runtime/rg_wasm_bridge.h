#ifndef RG_WASM_BRIDGE_H
#define RG_WASM_BRIDGE_H

#include <stdint.h>

#ifdef __cplusplus
extern "C" {
#endif

int rg_wasm_load(const char* path);
void rg_wasm_close(int handle);

int32_t rg_wasm_call_i32(int handle, const char* name, int nargs,
                         int32_t a0, int32_t a1, int32_t a2, int32_t a3, int32_t a4);

void rg_wasm_call_void(int handle, const char* name, int nargs,
                       int32_t a0, int32_t a1, int32_t a2, int32_t a3, int32_t a4);

uint32_t rg_wasm_mem_size(int handle);
int32_t rg_wasm_abi_base(int handle);

/* 1 if the module exports a function named `name`, else 0. Lets a host run the
 * forward-compat capability gate (rg_abi_version / rg_required_caps / ...) and
 * distinguish "guest exported it and returned 0" from "guest did not export it"
 * (a legacy guest = ABI v1, caps 0). Does not call the function. */
int rg_wasm_has_export(int handle, const char* name);

/* Handle of the single worker a module spawned via the env.rg_spawn_worker
 * host import (0 = none). A host-loaded module may spawn one worker; a spawned
 * worker may not spawn further workers. */
int rg_wasm_spawned_child(int handle);

int32_t rg_wasm_mem_read_i32(int handle, uint32_t off);
void rg_wasm_mem_write_i32(int handle, uint32_t off, int32_t val);
/* Read `len` bytes of the module's linear memory at byte offset `off` as a
 * NUL-terminated string (for lowering `s`/string command args — a ptr+len into
 * the guest's own memory, e.g. a pkg-relative asset path). Returns a pointer to
 * a static buffer valid until the next call; the caller copies it immediately. */
const char* rg_wasm_mem_read_str(int handle, int32_t off, int32_t len);

/* Host resource manifest — populated when the WASM module calls the linked
 * host import functions (env.rg_host_register_sheet / rg_host_register_rect).
 * The Ranger host drains this after calling the module's declare_resources(). */
int rg_wasm_host_res_reset(int handle);
int rg_wasm_host_res_count(int handle);
int rg_wasm_host_res_kind(int handle, int idx);
int rg_wasm_host_res_ival(int handle, int idx, int field);
const char* rg_wasm_host_res_id(int handle, int idx);
const char* rg_wasm_host_res_path(int handle, int idx);

/* Guest-requested UI effects — populated when the WASM UI guest calls the linked
 * host import env.rg_ui_glow(node, durMs, delayMs, tag). The Ranger host drains
 * this after each guest call, drives its UIAnimator with the requests, and calls
 * the guest's rg_ui_effect_done(node, tag) export when an effect completes. */
int rg_wasm_fx_reset(int handle);
int rg_wasm_fx_count(int handle);
/* field: 0 kind, 1 target, 2 node, 3 durMs, 4 delayMs, 5 tag, 6 r, 7 g, 8 b */
int rg_wasm_fx_ival(int handle, int idx, int field);

#ifdef __cplusplus
}
#endif

#endif
