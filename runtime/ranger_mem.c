/*
 * Ranger LLVM memory management runtime.
 * Layout: [RangerObjHeader][struct bytes...]
 * Body pointer (i64) = address of struct bytes.
 */
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define RT_FIELD_STRING 0
#define RT_FIELD_OBJECT 1
#define RT_FIELD_PTR_ARRAY 2

typedef struct {
  uint32_t offset;
  uint8_t kind;
  uint8_t owned;
  uint8_t _pad[2];
} RangerFieldDesc;

typedef struct {
  uint32_t struct_size;
  uint16_t field_count;
  uint16_t _pad;
  const RangerFieldDesc *fields;
} RangerTypeDesc;

typedef struct {
  uint32_t rc;
  uint32_t size;
  const RangerTypeDesc *type;
  uint32_t _pad;
} RangerObjHeader;

/* Must match buildRtPtrArrayNew in ng_LowIRRuntime.rgr:
 * data | len | cap | owned (element KIND) | rc. */
typedef struct {
  int64_t data;
  int32_t len;
  int32_t cap;
  int32_t owned;
  int32_t rc;
} RtPtrArrayDesc;

#define RANGER_HEADER_SIZE ((int)sizeof(RangerObjHeader))

void ranger_obj_release(int64_t body);
void ranger_ptrarray_release(int64_t desc_addr);

static int g_live_objects = 0;
/* RANGER_MEM_STATS=1 prints allocation balances at exit. */
static long g_obj_new, g_obj_free, g_arr_new, g_arr_free, g_arr_retain;

static void ranger_mem_dump_stats(void) {
  fprintf(stderr,
          "[mem] objects new=%ld freed=%ld live=%d | arrays new=%ld freed=%ld retained=%ld\n",
          g_obj_new, g_obj_free, g_live_objects, g_arr_new, g_arr_free, g_arr_retain);
}

/* Checked once: this sits on the object-allocation path, so a getenv per
 * allocation would itself distort what it measures. */
void ranger_mem_stats_enable(void) {
  static int state = 0; /* 0 = unchecked, 1 = on, 2 = off */
  if (state != 0) {
    return;
  }
  if (getenv("RANGER_MEM_STATS")) {
    state = 1;
    atexit(ranger_mem_dump_stats);
  } else {
    state = 2;
  }
}

int ranger_mem_live_objects(void) { return g_live_objects; }

void ranger_mem_reset_stats(void) { g_live_objects = 0; }

static void ranger_destroy_field(int64_t body, const RangerFieldDesc *f) {
  char *base;
  int64_t val;
  if (body == 0 || f == NULL) {
    return;
  }
  /* Borrowed fields (owned==0) alias memory owned elsewhere; do not free. */
  if (!f->owned) {
    return;
  }
  base = (char *)(intptr_t)body;
  switch (f->kind) {
  case RT_FIELD_STRING:
    val = *(int64_t *)(base + f->offset);
    if (val != 0) {
      free((void *)(intptr_t)val);
    }
    break;
  case RT_FIELD_OBJECT:
    val = *(int64_t *)(base + f->offset);
    if (val != 0) {
      ranger_obj_release(val);
    }
    break;
  case RT_FIELD_PTR_ARRAY:
    val = *(int64_t *)(base + f->offset);
    if (val != 0) {
      ranger_ptrarray_release(val);
    }
    break;
  default:
    break;
  }
}

static void ranger_destroy_fields(int64_t body, const RangerTypeDesc *type) {
  uint16_t i;
  if (body == 0 || type == NULL || type->fields == NULL) {
    return;
  }
  for (i = 0; i < type->field_count; i++) {
    ranger_destroy_field(body, &type->fields[i]);
  }
}

int64_t ranger_obj_new(uint32_t size, const RangerTypeDesc *type) {
  size_t total = (size_t)RANGER_HEADER_SIZE + (size_t)size;
  char *block = (char *)calloc(1, total);
  RangerObjHeader *h;
  if (block == NULL) {
    return 0;
  }
  h = (RangerObjHeader *)block;
  h->rc = 1;
  h->size = size;
  h->type = type;
  g_live_objects++;
  g_obj_new++;
  ranger_mem_stats_enable();
  return (int64_t)(block + RANGER_HEADER_SIZE);
}

void ranger_obj_retain(int64_t body) {
  RangerObjHeader *h;
  if (body == 0) {
    return;
  }
  h = (RangerObjHeader *)((char *)body - RANGER_HEADER_SIZE);
  h->rc++;
}

void ranger_obj_release(int64_t body) {
  char *block;
  RangerObjHeader *h;
  if (body == 0) {
    return;
  }
  block = (char *)body - RANGER_HEADER_SIZE;
  h = (RangerObjHeader *)block;
  if (h->rc == 0) {
    return;
  }
  if (--h->rc > 0) {
    return;
  }
  ranger_destroy_fields(body, h->type);
  free(block);
  g_live_objects--;
  g_obj_free++;
}

void ranger_str_release(char *s) {
  if (s == NULL) {
    return;
  }
  free(s);
}

void ranger_ptrarray_retain(int64_t desc_addr) {
  RtPtrArrayDesc *d;
  if (desc_addr == 0) {
    return;
  }
  d = (RtPtrArrayDesc *)(intptr_t)desc_addr;
  d->rc++;
  g_arr_retain++;
}

void ranger_ptrarray_release(int64_t desc_addr) {
  RtPtrArrayDesc *d;
  int32_t i;
  if (desc_addr == 0) {
    return;
  }
  d = (RtPtrArrayDesc *)(intptr_t)desc_addr;
  /* Shared arrays: a local handed to a constructor that keeps it, or a field
   * array handed back to a caller, has more than one owner. Only the last
   * release frees. rc==0 means the descriptor predates refcounting (or was
   * built by hand); treat it as a single owner. */
  if (d->rc > 1) {
    d->rc--;
    return;
  }
  d->rc = 0;
  /* The flag word is an element KIND, not a plain boolean: 0 = plain values,
   * 1 = owned objects, 2 = owned strings. A string element is a malloc'd
   * buffer with no object header, so releasing it as an object read memory
   * before the allocation. */
  if (d->data != 0 && (d->owned == 1 || d->owned == 2)) {
    int64_t *elems = (int64_t *)(intptr_t)d->data;
    for (i = 0; i < d->len; i++) {
      if (elems[i] == 0) {
        continue;
      }
      if (d->owned == 2) {
        free((void *)(intptr_t)elems[i]);
      } else {
        ranger_obj_release(elems[i]);
      }
    }
  }
  if (d->data != 0) {
    free((void *)(intptr_t)d->data);
  }
  free(d);
  g_arr_free++;
}

void ranger_ptrarray_push_owned(int64_t desc_addr, int64_t val) {
  RtPtrArrayDesc *d;
  int64_t *data;
  int32_t new_cap;
  size_t bytes;
  if (desc_addr == 0) {
    return;
  }
  d = (RtPtrArrayDesc *)(intptr_t)desc_addr;
  /* Only an OBJECT element carries a refcount to bump (see the kinds above). */
  if (d->owned == 1 && val != 0) {
    ranger_obj_retain(val);
  }
  if (d->len >= d->cap) {
    new_cap = (d->cap == 0) ? 4 : (d->cap * 2);
    bytes = (size_t)new_cap * sizeof(int64_t);
    data = (int64_t *)realloc((void *)(intptr_t)d->data, bytes);
    if (data == NULL) {
      return;
    }
    d->data = (int64_t)(intptr_t)data;
    d->cap = new_cap;
  }
  data = (int64_t *)(intptr_t)d->data;
  data[d->len] = val;
  d->len = d->len + 1;
}

/* Weak so that builds which also link ranger_rt.c (which defines its own
 * ranger_strdup) do not hit a duplicate-symbol error; the rt.c version wins.
 * When only ranger_mem.c is linked (memory unit tests) this definition is used. */
__attribute__((weak))
char *ranger_strdup(const char *text) {
  static char empty[] = "";
  size_t n;
  char *copy;
  if (text == NULL) {
    return empty;
  }
  n = strlen(text);
  copy = (char *)malloc(n + 1);
  if (copy == NULL) {
    return empty;
  }
  memcpy(copy, text, n + 1);
  return copy;
}
