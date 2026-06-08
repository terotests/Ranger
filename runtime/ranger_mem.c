/*
 * Ranger LLVM memory management runtime.
 * Layout: [RangerObjHeader][struct bytes...]
 * Body pointer (i64) = address of struct bytes.
 */
#include <stdint.h>
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

typedef struct {
  int64_t data;
  int32_t len;
  int32_t cap;
  int32_t owned;
} RtPtrArrayDesc;

#define RANGER_HEADER_SIZE ((int)sizeof(RangerObjHeader))

void ranger_obj_release(int64_t body);
void ranger_ptrarray_release(int64_t desc_addr);

static int g_live_objects = 0;

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
}

void ranger_str_release(char *s) {
  if (s == NULL) {
    return;
  }
  free(s);
}

void ranger_ptrarray_release(int64_t desc_addr) {
  RtPtrArrayDesc *d;
  int32_t i;
  if (desc_addr == 0) {
    return;
  }
  d = (RtPtrArrayDesc *)(intptr_t)desc_addr;
  if (d->owned && d->data != 0) {
    int64_t *elems = (int64_t *)(intptr_t)d->data;
    for (i = 0; i < d->len; i++) {
      ranger_obj_release(elems[i]);
    }
  }
  if (d->data != 0) {
    free((void *)(intptr_t)d->data);
  }
  free(d);
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
  if (d->owned && val != 0) {
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
