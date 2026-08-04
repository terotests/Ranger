/*
 * Shared C runtime for Ranger LLVM native targets (libc-linked).
 * Terminal I/O, CLI args, and small file/string helpers.
 */
#include <sys/stat.h>
#include <sys/time.h>
#include <stdint.h>
#include <fcntl.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <termios.h>
#include <unistd.h>

/* --- CLI --- */

static int g_argc;
static char **g_argv;

void ranger_cli_init(int argc, char **argv) {
  g_argc = argc;
  g_argv = argv;
}

int ranger_shell_arg_cnt(void) {
  if (g_argc <= 1) {
    return 0;
  }
  return g_argc - 1;
}

const char *ranger_shell_arg(int index) {
  static char empty[] = "";
  int real;
  if (index < 0) {
    return empty;
  }
  if (g_argc <= 1) {
    return empty;
  }
  real = index + 1;
  if (real >= g_argc) {
    return empty;
  }
  return g_argv[real];
}

int ranger_char_at(const char *text, int position) {
  if (text == NULL || position < 0) {
    return 0;
  }
  return (unsigned char)text[position];
}

const char *ranger_at_char(const char *text, int position) {
  static char buf[2];
  int c = ranger_char_at(text, position);
  buf[0] = (char)c;
  buf[1] = '\0';
  return buf;
}

/* substring: heap-allocated copy of bytes [start, end) of text.
 * Byte-indexed to match ranger_char_at semantics on this runtime. */
char *ranger_substring(const char *text, int start, int end) {
  int len;
  int n;
  char *out;
  if (text == NULL) {
    return NULL;
  }
  len = (int)strlen(text);
  if (start < 0) {
    start = 0;
  }
  if (end > len) {
    end = len;
  }
  if (end < start) {
    end = start;
  }
  n = end - start;
  out = (char *)malloc((size_t)n + 1);
  if (out == NULL) {
    return NULL;
  }
  if (n > 0) {
    memcpy(out, text + start, (size_t)n);
  }
  out[n] = '\0';
  return out;
}

double ranger_str2double(const char *text) {
  if (text == NULL) {
    return 0.0;
  }
  return strtod(text, NULL);
}

int ranger_str2int(const char *text) {
  if (text == NULL) {
    return 0;
  }
  return (int)strtol(text, NULL, 10);
}

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

/* strfromcode: encode a Unicode codepoint as a heap-allocated UTF-8 string. */
char *ranger_str_fromcode(int code) {
  char *out = (char *)malloc(5);
  int n = 0;
  if (out == NULL) {
    return NULL;
  }
  if (code < 0) {
    code = 0;
  }
  if (code < 0x80) {
    out[n++] = (char)code;
  } else if (code < 0x800) {
    out[n++] = (char)(0xC0 | (code >> 6));
    out[n++] = (char)(0x80 | (code & 0x3F));
  } else if (code < 0x10000) {
    out[n++] = (char)(0xE0 | (code >> 12));
    out[n++] = (char)(0x80 | ((code >> 6) & 0x3F));
    out[n++] = (char)(0x80 | (code & 0x3F));
  } else {
    out[n++] = (char)(0xF0 | (code >> 18));
    out[n++] = (char)(0x80 | ((code >> 12) & 0x3F));
    out[n++] = (char)(0x80 | ((code >> 6) & 0x3F));
    out[n++] = (char)(0x80 | (code & 0x3F));
  }
  out[n] = '\0';
  return out;
}

/* rawbytechar: a single raw byte as a heap-allocated 1-byte string. */
char *ranger_str_frombyte(int code) {
  char *out = (char *)malloc(2);
  if (out == NULL) {
    return NULL;
  }
  out[0] = (char)(code & 0xFF);
  out[1] = '\0';
  return out;
}

const char *ranger_read_file(const char *path, const char *filename) {
  char full[8192];
  FILE *f;
  long sz;
  char *buf;
  size_t nread;

  if (path == NULL || filename == NULL) {
    return NULL;
  }
  snprintf(full, sizeof(full), "%s/%s", path, filename);
  f = fopen(full, "rb");
  if (f == NULL) {
    return NULL;
  }
  if (fseek(f, 0, SEEK_END) != 0) {
    fclose(f);
    return NULL;
  }
  sz = ftell(f);
  if (sz < 0) {
    fclose(f);
    return NULL;
  }
  if (fseek(f, 0, SEEK_SET) != 0) {
    fclose(f);
    return NULL;
  }
  buf = (char *)malloc((size_t)sz + 1);
  if (buf == NULL) {
    fclose(f);
    return NULL;
  }
  nread = fread(buf, 1, (size_t)sz, f);
  if (nread != (size_t)sz) {
    free(buf);
    fclose(f);
    return NULL;
  }
  buf[sz] = '\0';
  fclose(f);
  return buf;
}

/* --- Terminal --- */

static struct termios saved_tty;
static int raw_mode = 0;
static char key_buf[32];

void ranger_clear_screen(void) {
  fputs("\033[2J\033[H", stdout);
  fflush(stdout);
}

void ranger_hide_cursor(void) {
  fputs("\033[?25l", stdout);
  fflush(stdout);
}

void ranger_show_cursor(void) {
  fputs("\033[?25h", stdout);
  fflush(stdout);
}

void ranger_move_cursor(int x, int y) {
  char buf[32];
  snprintf(buf, sizeof(buf), "\033[%d;%dH", y, x);
  fputs(buf, stdout);
  fflush(stdout);
}

void ranger_term_init(void) {
  if (raw_mode) {
    return;
  }
  tcgetattr(STDIN_FILENO, &saved_tty);
  struct termios raw = saved_tty;
  raw.c_lflag &= (tcflag_t) ~(ICANON | ECHO);
  raw.c_cc[VMIN] = 0;
  raw.c_cc[VTIME] = 0;
  tcsetattr(STDIN_FILENO, TCSAFLUSH, &raw);
  int flags = fcntl(STDIN_FILENO, F_GETFL, 0);
  fcntl(STDIN_FILENO, F_SETFL, flags | O_NONBLOCK);
  raw_mode = 1;
}

void ranger_term_restore(void) {
  if (!raw_mode) {
    return;
  }
  tcsetattr(STDIN_FILENO, TCSAFLUSH, &saved_tty);
  raw_mode = 0;
}

const char *ranger_poll_key(void) {
  key_buf[0] = '\0';
  char c = 0;
  if (read(STDIN_FILENO, &c, 1) != 1) {
    return key_buf;
  }
  if (c == 27) {
    char seq[2];
    if (read(STDIN_FILENO, &seq[0], 1) != 1) {
      return key_buf;
    }
    if (read(STDIN_FILENO, &seq[1], 1) != 1) {
      return key_buf;
    }
    if (seq[0] == '[') {
      if (seq[1] == 'D') {
        strcpy(key_buf, "left");
        return key_buf;
      }
      if (seq[1] == 'C') {
        strcpy(key_buf, "right");
        return key_buf;
      }
    }
    return key_buf;
  }
  if (c == ' ') {
    strcpy(key_buf, " ");
    return key_buf;
  }
  key_buf[0] = c;
  key_buf[1] = '\0';
  return key_buf;
}

/* ---------------------------------------------------------------------------
 * String-keyed maps (RtSMap).
 *
 * The generated RtMap_* runtime hashes an i32 key with `key % cap` and stores
 * 4-byte slots, so it cannot hold a `[string:T]` map at all: the key needs
 * hashing by CONTENT, and both key and value are pointer-sized. Rather than
 * widen the emitted IR, string maps live here in C, where the hashing and the
 * resize are ordinary code.
 *
 * Entries are kept in INSERTION ORDER in a flat array, with a separate open
 * addressed index for lookup. JavaScript enumerates string keys in insertion
 * order, and the TypeScript engine's object model depends on that -- an
 * unordered map would be a third wrong answer, the way std::map's sorted order
 * is on the C++ target.
 * ------------------------------------------------------------------------- */

typedef struct {
  char *key;      /* owned copy; NULL once removed */
  int64_t value;
  uint32_t hash;
} RtSMapEntry;

/* Value ownership, set at construction (see RtSMap_new_kind):
 *   0 = plain values (ints, borrowed pointers) -- nothing to release
 *   1 = owned OBJECTS   -- retained on put, released on overwrite/remove/free
 *   2 = owned STRINGS   -- copied on put, freed on overwrite/remove/free
 * Without this a map was a pure borrow, so an EvalValue stored in an object's
 * property map died the moment the local that produced it went out of scope. */
typedef struct {
  RtSMapEntry *entries; /* insertion order, may contain removed holes */
  int32_t count;        /* entries used, holes included */
  int32_t cap;
  int32_t live;         /* entries with key != NULL */
  int32_t *index;       /* open-addressed: entry slot + 1, or 0 when empty */
  int32_t index_cap;
  int32_t valkind;      /* 0 plain / 1 owned object / 2 owned string */
} RtSMap;

static uint32_t rt_smap_hash(const char *s) {
  uint32_t h = 2166136261u; /* FNV-1a */
  while (*s) {
    h ^= (unsigned char)*s++;
    h *= 16777619u;
  }
  return h;
}

static void rt_smap_reindex(RtSMap *m, int32_t new_cap) {
  int32_t i;
  free(m->index);
  m->index_cap = new_cap;
  m->index = (int32_t *)calloc((size_t)new_cap, sizeof(int32_t));
  if (m->index == NULL) {
    m->index_cap = 0;
    return;
  }
  for (i = 0; i < m->count; i++) {
    uint32_t slot;
    if (m->entries[i].key == NULL) {
      continue;
    }
    slot = m->entries[i].hash & (uint32_t)(new_cap - 1);
    while (m->index[slot] != 0) {
      slot = (slot + 1) & (uint32_t)(new_cap - 1);
    }
    m->index[slot] = i + 1;
  }
}

extern void ranger_obj_retain(int64_t body);
extern void ranger_obj_release(int64_t body);

static void rt_smap_retain_value(RtSMap *m, int64_t v) {
  if (m->valkind == 1 && v != 0) {
    ranger_obj_retain(v);
  }
}

static void rt_smap_release_value(RtSMap *m, int64_t v) {
  if (v == 0) {
    return;
  }
  if (m->valkind == 1) {
    ranger_obj_release(v);
  } else if (m->valkind == 2) {
    free((void *)(intptr_t)v);
  }
}

int64_t RtSMap_new_kind(int valkind) {
  RtSMap *m = (RtSMap *)calloc(1, sizeof(RtSMap));
  if (m == NULL) {
    return 0;
  }
  m->cap = 8;
  m->valkind = valkind;
  m->entries = (RtSMapEntry *)calloc((size_t)m->cap, sizeof(RtSMapEntry));
  rt_smap_reindex(m, 16);
  return (int64_t)(intptr_t)m;
}

int64_t RtSMap_new(void) { return RtSMap_new_kind(0); }

/* Entry index for `key`, or -1. */
static int32_t rt_smap_find(RtSMap *m, const char *key, uint32_t h) {
  uint32_t slot;
  if (m == NULL || m->index == NULL || key == NULL) {
    return -1;
  }
  slot = h & (uint32_t)(m->index_cap - 1);
  while (m->index[slot] != 0) {
    int32_t ei = m->index[slot] - 1;
    if (m->entries[ei].key != NULL && m->entries[ei].hash == h &&
        strcmp(m->entries[ei].key, key) == 0) {
      return ei;
    }
    slot = (slot + 1) & (uint32_t)(m->index_cap - 1);
  }
  return -1;
}

void RtSMap_put(int64_t map, const char *key, int64_t value) {
  RtSMap *m = (RtSMap *)(intptr_t)map;
  uint32_t h;
  int32_t ei;
  if (m == NULL || key == NULL) {
    return;
  }
  h = rt_smap_hash(key);
  ei = rt_smap_find(m, key, h);
  if (ei >= 0) {
    /* retain BEFORE releasing: putting a value back over itself must not free it */
    rt_smap_retain_value(m, value);
    rt_smap_release_value(m, m->entries[ei].value);
    m->entries[ei].value = value; /* replace: keeps the original position */
    return;
  }
  rt_smap_retain_value(m, value);
  if (m->count == m->cap) {
    int32_t nc = m->cap * 2;
    RtSMapEntry *ne = (RtSMapEntry *)realloc(m->entries, (size_t)nc * sizeof(RtSMapEntry));
    if (ne == NULL) {
      return;
    }
    memset(ne + m->cap, 0, (size_t)(nc - m->cap) * sizeof(RtSMapEntry));
    m->entries = ne;
    m->cap = nc;
  }
  m->entries[m->count].key = ranger_strdup(key);
  m->entries[m->count].value = value;
  m->entries[m->count].hash = h;
  m->count++;
  m->live++;
  /* keep the open-addressed index under half full */
  if (m->count * 2 >= m->index_cap) {
    rt_smap_reindex(m, m->index_cap * 2);
  } else {
    uint32_t slot = h & (uint32_t)(m->index_cap - 1);
    while (m->index[slot] != 0) {
      slot = (slot + 1) & (uint32_t)(m->index_cap - 1);
    }
    m->index[slot] = m->count; /* count is (entry index + 1) */
  }
}

int64_t RtSMap_get(int64_t map, const char *key) {
  RtSMap *m = (RtSMap *)(intptr_t)map;
  int32_t ei;
  if (m == NULL || key == NULL) {
    return 0;
  }
  ei = rt_smap_find(m, key, rt_smap_hash(key));
  return (ei >= 0) ? m->entries[ei].value : 0;
}

int RtSMap_has(int64_t map, const char *key) {
  RtSMap *m = (RtSMap *)(intptr_t)map;
  if (m == NULL || key == NULL) {
    return 0;
  }
  return rt_smap_find(m, key, rt_smap_hash(key)) >= 0 ? 1 : 0;
}

void RtSMap_remove(int64_t map, const char *key) {
  RtSMap *m = (RtSMap *)(intptr_t)map;
  int32_t ei;
  if (m == NULL || key == NULL) {
    return;
  }
  ei = rt_smap_find(m, key, rt_smap_hash(key));
  if (ei < 0) {
    return;
  }
  free(m->entries[ei].key);
  m->entries[ei].key = NULL; /* hole: later keys keep their positions */
  rt_smap_release_value(m, m->entries[ei].value);
  m->entries[ei].value = 0;
  m->live--;
  rt_smap_reindex(m, m->index_cap);
}

/* Live entry count. */
int RtSMap_size(int64_t map) {
  RtSMap *m = (RtSMap *)(intptr_t)map;
  return (m == NULL) ? 0 : m->live;
}

/* The i-th LIVE key in insertion order, or NULL. Callers walk 0..size-1. */
const char *RtSMap_keyAt(int64_t map, int i) {
  RtSMap *m = (RtSMap *)(intptr_t)map;
  int32_t k;
  int32_t seen = 0;
  if (m == NULL || i < 0) {
    return NULL;
  }
  for (k = 0; k < m->count; k++) {
    if (m->entries[k].key == NULL) {
      continue;
    }
    if (seen == i) {
      return m->entries[k].key;
    }
    seen++;
  }
  return NULL;
}

void RtSMap_free(int64_t map) {
  RtSMap *m = (RtSMap *)(intptr_t)map;
  int32_t i;
  if (m == NULL) {
    return;
  }
  for (i = 0; i < m->count; i++) {
    free(m->entries[i].key);
    rt_smap_release_value(m, m->entries[i].value);
  }
  free(m->entries);
  free(m->index);
  free(m);
}

/* --- string helpers the LLVM target needs -------------------------------- */

/* Byte index of `key` in `text`, or -1. Byte-indexed, matching
 * ranger_char_at/ranger_substring on this runtime. */
int ranger_str_index_of(const char *text, const char *key) {
  const char *hit;
  if (text == NULL || key == NULL) {
    return -1;
  }
  hit = strstr(text, key);
  return (hit == NULL) ? -1 : (int)(hit - text);
}

int ranger_str_last_index_of(const char *text, const char *key) {
  const char *p;
  int last = -1;
  size_t klen;
  if (text == NULL || key == NULL) {
    return -1;
  }
  klen = strlen(key);
  if (klen == 0) {
    return (int)strlen(text);
  }
  for (p = text; (p = strstr(p, key)) != NULL; p++) {
    last = (int)(p - text);
  }
  return last;
}

int ranger_str_contains(const char *text, const char *key) {
  return ranger_str_index_of(text, key) >= 0 ? 1 : 0;
}

/* ASCII case mapping, which is what the es6 target's toLowerCase does for the
 * engine's identifiers and keywords. Non-ASCII bytes are passed through. */
char *ranger_str_lower(const char *text) {
  char *out;
  size_t i, n;
  if (text == NULL) {
    return ranger_strdup("");
  }
  n = strlen(text);
  out = (char *)malloc(n + 1);
  if (out == NULL) {
    return ranger_strdup("");
  }
  for (i = 0; i < n; i++) {
    unsigned char c = (unsigned char)text[i];
    out[i] = (char)((c >= 'A' && c <= 'Z') ? (c - 'A' + 'a') : c);
  }
  out[n] = '\0';
  return out;
}

char *ranger_str_upper(const char *text) {
  char *out;
  size_t i, n;
  if (text == NULL) {
    return ranger_strdup("");
  }
  n = strlen(text);
  out = (char *)malloc(n + 1);
  if (out == NULL) {
    return ranger_strdup("");
  }
  for (i = 0; i < n; i++) {
    unsigned char c = (unsigned char)text[i];
    out[i] = (char)((c >= 'a' && c <= 'z') ? (c - 'a' + 'A') : c);
  }
  out[n] = '\0';
  return out;
}

int ranger_file_exists(const char *path, const char *filename) {
  char *full;
  FILE *f;
  size_t n;
  if (path == NULL || filename == NULL) {
    return 0;
  }
  n = strlen(path) + strlen(filename) + 2;
  full = (char *)malloc(n);
  if (full == NULL) {
    return 0;
  }
  snprintf(full, n, "%s/%s", path, filename);
  f = fopen(full, "rb");
  free(full);
  if (f == NULL) {
    return 0;
  }
  fclose(f);
  return 1;
}

/* ---------------------------------------------------------------------------
 * strsplit -> a ptr-array of owned strings.
 *
 * The RtPtrArray_* runtime is emitted as LLVM IR, so it cannot build the
 * result from a C loop -- but the descriptor layout is fixed (it is the same
 * one ranger_mem.c releases), so the array is constructed here directly.
 * Element kind 2 marks the elements as owned STRINGS, which is what makes the
 * release path free them instead of treating them as objects.
 *
 * An empty separator splits into single BYTES, matching the C++ polyfill.
 * ------------------------------------------------------------------------- */

typedef struct {
  int64_t data;
  int32_t len;
  int32_t cap;
  int32_t owned;
  int32_t rc;
} RtSplitDesc;

static void rt_split_push(RtSplitDesc *d, char *s) {
  int64_t *data;
  int32_t new_cap;
  if (d->len >= d->cap) {
    new_cap = (d->cap == 0) ? 8 : (d->cap * 2);
    data = (int64_t *)realloc((void *)(intptr_t)d->data, (size_t)new_cap * sizeof(int64_t));
    if (data == NULL) {
      return;
    }
    d->data = (int64_t)(intptr_t)data;
    d->cap = new_cap;
  }
  data = (int64_t *)(intptr_t)d->data;
  data[d->len] = (int64_t)(intptr_t)s;
  d->len = d->len + 1;
}

int64_t ranger_str_split(const char *text, const char *sep) {
  RtSplitDesc *d = (RtSplitDesc *)calloc(1, sizeof(RtSplitDesc));
  const char *cur;
  size_t seplen;
  if (d == NULL) {
    return 0;
  }
  d->owned = 2;
  d->rc = 1;
  if (text == NULL) {
    return (int64_t)(intptr_t)d;
  }
  seplen = (sep == NULL) ? 0 : strlen(sep);
  if (seplen == 0) {
    /* one element per byte */
    size_t i;
    size_t n = strlen(text);
    for (i = 0; i < n; i++) {
      char *one = (char *)malloc(2);
      if (one == NULL) {
        break;
      }
      one[0] = text[i];
      one[1] = '\0';
      rt_split_push(d, one);
    }
    return (int64_t)(intptr_t)d;
  }
  cur = text;
  for (;;) {
    const char *hit = strstr(cur, sep);
    size_t n = (hit == NULL) ? strlen(cur) : (size_t)(hit - cur);
    char *piece = (char *)malloc(n + 1);
    if (piece == NULL) {
      break;
    }
    if (n > 0) {
      memcpy(piece, cur, n);
    }
    piece[n] = '\0';
    rt_split_push(d, piece);
    if (hit == NULL) {
      break;
    }
    cur = hit + seplen;
  }
  return (int64_t)(intptr_t)d;
}

double ranger_random(void) { return (double)rand() / ((double)RAND_MAX + 1.0); }

/* Wall-clock milliseconds since the Unix epoch -- the LLVM target's
 * `wall_clock_ms`. Embedders that want Date.now() to advance (Octane) read
 * this; the engine's default host clock stays frozen for conformance runs. */
double ranger_wall_clock_ms(void) {
  struct timeval tv;
  if (gettimeofday(&tv, NULL) != 0) {
    return 0.0;
  }
  return (double)tv.tv_sec * 1000.0 + (double)tv.tv_usec / 1000.0;
}

/* A buffer is a length-prefixed byte block on this runtime (see the
 * buffer_alloc lowering); copy its bytes out as a NUL-terminated string. */
char *ranger_buffer_to_string(int64_t buf, int len) {
  char *out;
  if (buf == 0 || len < 0) {
    return ranger_strdup("");
  }
  out = (char *)malloc((size_t)len + 1);
  if (out == NULL) {
    return ranger_strdup("");
  }
  memcpy(out, (const void *)(intptr_t)buf, (size_t)len);
  out[len] = '\0';
  return out;
}

int64_t ranger_file_mtime(const char *path, const char *filename) {
  char *full;
  struct stat st;
  size_t n;
  int64_t r = 0;
  if (path == NULL || filename == NULL) {
    return 0;
  }
  n = strlen(path) + strlen(filename) + 2;
  full = (char *)malloc(n);
  if (full == NULL) {
    return 0;
  }
  snprintf(full, n, "%s/%s", path, filename);
  if (stat(full, &st) == 0) {
    r = (int64_t)st.st_mtime * 1000;
  }
  free(full);
  return r;
}

char *ranger_str_trim(const char *text) {
  const char *b;
  const char *e;
  char *out;
  size_t n;
  if (text == NULL) {
    return ranger_strdup("");
  }
  b = text;
  while (*b == ' ' || *b == '\t' || *b == '\n' || *b == '\r') {
    b++;
  }
  e = b + strlen(b);
  while (e > b) {
    char c = *(e - 1);
    if (c != ' ' && c != '\t' && c != '\n' && c != '\r') {
      break;
    }
    e--;
  }
  n = (size_t)(e - b);
  out = (char *)malloc(n + 1);
  if (out == NULL) {
    return ranger_strdup("");
  }
  memcpy(out, b, n);
  out[n] = '\0';
  return out;
}
