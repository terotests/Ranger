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

int32_t rg_wasm_mem_read_i32(int handle, uint32_t off);
void rg_wasm_mem_write_i32(int handle, uint32_t off, int32_t val);

/* Host resource manifest — populated when the WASM module calls the linked
 * host import functions (env.rg_host_register_sheet / rg_host_register_rect).
 * The Ranger host drains this after calling the module's declare_resources(). */
int rg_wasm_host_res_reset(int handle);
int rg_wasm_host_res_count(int handle);
int rg_wasm_host_res_kind(int handle, int idx);
int rg_wasm_host_res_ival(int handle, int idx, int field);
const char* rg_wasm_host_res_id(int handle, int idx);
const char* rg_wasm_host_res_path(int handle, int idx);

#ifdef __cplusplus
}
#endif

#endif
