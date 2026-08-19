/*
 * Ranger LLVM buffer runtime: byte buffers and int64 buffers as opaque i64 handles.
 */
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

typedef struct {
  uint8_t *data;
  int32_t len;
  int32_t cap;
} RtByteBuffer;

typedef struct {
  int64_t *data;
  int32_t len;
  int32_t cap;
} RtIntBuffer;

static RtByteBuffer *byte_buf(int64_t handle) {
  if (handle == 0) {
    return NULL;
  }
  return (RtByteBuffer *)(intptr_t)handle;
}

static RtIntBuffer *int_buf(int64_t handle) {
  if (handle == 0) {
    return NULL;
  }
  return (RtIntBuffer *)(intptr_t)handle;
}

static int byte_grow(RtByteBuffer *d, int32_t need_len) {
  int32_t new_cap;
  uint8_t *ndata;
  if (d == NULL || need_len <= d->cap) {
    return 1;
  }
  new_cap = (d->cap == 0) ? 4 : d->cap;
  while (new_cap < need_len) {
    new_cap *= 2;
  }
  ndata = (uint8_t *)realloc(d->data, (size_t)new_cap);
  if (ndata == NULL) {
    return 0;
  }
  if (d->len < new_cap) {
    memset(ndata + d->len, 0, (size_t)(new_cap - d->len));
  }
  d->data = ndata;
  d->cap = new_cap;
  return 1;
}

int64_t ranger_buffer_alloc(int32_t size) {
  RtByteBuffer *d;
  if (size < 0) {
    size = 0;
  }
  d = (RtByteBuffer *)calloc(1, sizeof(RtByteBuffer));
  if (d == NULL) {
    return 0;
  }
  if (size > 0) {
    d->data = (uint8_t *)calloc((size_t)size, 1);
    if (d->data == NULL) {
      free(d);
      return 0;
    }
    d->len = size;
    d->cap = size;
  }
  return (int64_t)(intptr_t)d;
}

void ranger_buffer_release(int64_t handle) {
  RtByteBuffer *d = byte_buf(handle);
  if (d == NULL) {
    return;
  }
  free(d->data);
  free(d);
}

int32_t ranger_buffer_length(int64_t handle) {
  RtByteBuffer *d = byte_buf(handle);
  if (d == NULL) {
    return 0;
  }
  return d->len;
}

int32_t ranger_buffer_get(int64_t handle, int32_t offset) {
  RtByteBuffer *d = byte_buf(handle);
  if (d == NULL || d->data == NULL || offset < 0 || offset >= d->len) {
    return 0;
  }
  return (int32_t)d->data[offset];
}

void ranger_buffer_set(int64_t handle, int32_t offset, int32_t value) {
  RtByteBuffer *d = byte_buf(handle);
  int32_t need_len;
  if (d == NULL || offset < 0) {
    return;
  }
  need_len = offset + 1;
  if (need_len > d->len) {
    if (!byte_grow(d, need_len)) {
      return;
    }
    d->len = need_len;
  }
  d->data[offset] = (uint8_t)(value & 0xff);
}

/* Fill [start, end) with one byte value. Clamped to the buffer the way
 * ranger_int_buffer_fill clamps its own, so an out-of-range end is a short
 * fill rather than a stray write. */
void ranger_buffer_fill(int64_t handle, int32_t value, int32_t start,
                        int32_t end) {
  RtByteBuffer *d = byte_buf(handle);
  int32_t i;
  if (d == NULL || d->data == NULL) {
    return;
  }
  if (start < 0) {
    start = 0;
  }
  if (end > d->len) {
    end = d->len;
  }
  for (i = start; i < end; i++) {
    d->data[i] = (uint8_t)(value & 0xff);
  }
}

int64_t ranger_buffer_read_file(const char *path, const char *filename) {
  char full[8192];
  FILE *f;
  long sz;
  RtByteBuffer *d;
  size_t nread;

  if (path == NULL || filename == NULL) {
    return 0;
  }
  snprintf(full, sizeof(full), "%s/%s", path, filename);
  f = fopen(full, "rb");
  if (f == NULL) {
    return ranger_buffer_alloc(0);
  }
  if (fseek(f, 0, SEEK_END) != 0) {
    fclose(f);
    return ranger_buffer_alloc(0);
  }
  sz = ftell(f);
  if (sz < 0) {
    fclose(f);
    return ranger_buffer_alloc(0);
  }
  if (fseek(f, 0, SEEK_SET) != 0) {
    fclose(f);
    return ranger_buffer_alloc(0);
  }
  d = byte_buf(ranger_buffer_alloc((int32_t)sz));
  if (d == NULL || d->data == NULL) {
    fclose(f);
    return 0;
  }
  nread = fread(d->data, 1, (size_t)sz, f);
  fclose(f);
  if (nread != (size_t)sz) {
    ranger_buffer_release((int64_t)(intptr_t)d);
    return ranger_buffer_alloc(0);
  }
  return (int64_t)(intptr_t)d;
}

void ranger_buffer_write_file(const char *path, const char *filename,
                              int64_t handle) {
  char full[8192];
  FILE *f;
  RtByteBuffer *d = byte_buf(handle);

  if (path == NULL || filename == NULL || d == NULL) {
    return;
  }
  snprintf(full, sizeof(full), "%s/%s", path, filename);
  f = fopen(full, "wb");
  if (f == NULL) {
    return;
  }
  if (d->data != NULL && d->len > 0) {
    fwrite(d->data, 1, (size_t)d->len, f);
  }
  fclose(f);
}

int64_t ranger_int_buffer_alloc(int32_t size) {
  RtIntBuffer *d;
  if (size < 0) {
    size = 0;
  }
  d = (RtIntBuffer *)calloc(1, sizeof(RtIntBuffer));
  if (d == NULL) {
    return 0;
  }
  if (size > 0) {
    d->data = (int64_t *)calloc((size_t)size, sizeof(int64_t));
    if (d->data == NULL) {
      free(d);
      return 0;
    }
    d->len = size;
    d->cap = size;
  }
  return (int64_t)(intptr_t)d;
}

void ranger_int_buffer_release(int64_t handle) {
  RtIntBuffer *d = int_buf(handle);
  if (d == NULL) {
    return;
  }
  free(d->data);
  free(d);
}

int32_t ranger_int_buffer_get(int64_t handle, int32_t index) {
  RtIntBuffer *d = int_buf(handle);
  if (d == NULL || d->data == NULL || index < 0 || index >= d->len) {
    return 0;
  }
  return (int32_t)d->data[index];
}

void ranger_int_buffer_set(int64_t handle, int32_t index, int32_t value) {
  RtIntBuffer *d = int_buf(handle);
  if (d == NULL || d->data == NULL || index < 0 || index >= d->len) {
    return;
  }
  d->data[index] = (int64_t)value;
}

void ranger_int_buffer_fill(int64_t handle, int32_t value, int32_t start,
                            int32_t end) {
  RtIntBuffer *d = int_buf(handle);
  int32_t i;
  if (d == NULL || d->data == NULL) {
    return;
  }
  if (start < 0) {
    start = 0;
  }
  if (end > d->len) {
    end = d->len;
  }
  for (i = start; i < end; i++) {
    d->data[i] = (int64_t)value;
  }
}
