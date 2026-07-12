#ifndef RG_WASM_BRIDGE_H
#define RG_WASM_BRIDGE_H

#include <stdint.h>

#ifdef __cplusplus
extern "C" {
#endif

/* Load a .wasm file. Returns handle (>=1) or 0 on failure. */
int rg_wasm_load(const char* path);

void rg_wasm_close(int handle);

/* Call an exported function returning i32. nargs in [0..5]. Unused args ignored. */
int32_t rg_wasm_call_i32(int handle, const char* name, int nargs,
                         int32_t a0, int32_t a1, int32_t a2, int32_t a3, int32_t a4);

/* Call an exported function with no return value. */
void rg_wasm_call_void(int handle, const char* name, int nargs,
                       int32_t a0, int32_t a1, int32_t a2, int32_t a3, int32_t a4);

#ifdef __cplusplus
}
#endif

#endif
