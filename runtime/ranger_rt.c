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

/* argv[0] itself. ranger_shell_arg skips it (a Ranger program's argument 0 is
 * the first real argument), and install_directory needs the executable. */
const char *ranger_argv0(void) {
  static char empty[] = "";
  if (g_argc <= 0 || g_argv == NULL) {
    return empty;
  }
  return g_argv[0];
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

/* Always a HEAP copy, including for NULL and for an allocation failure: the
 * result is owned by the caller and ranger_str_release frees it. Handing back
 * a static buffer aborted the process the first time such a string went out
 * of scope ("munmap_chunk(): invalid pointer"). */
char *ranger_strdup(const char *text) {
  size_t n;
  char *copy;
  if (text == NULL) {
    copy = (char *)malloc(1);
    if (copy != NULL) {
      copy[0] = '\0';
    }
    return copy;
  }
  n = strlen(text);
  copy = (char *)malloc(n + 1);
  if (copy == NULL) {
    return NULL;
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
  /* A string is BYTES on this target and charAt hands back one byte, so
   * `strfromcode (charAt s i)` has to round-trip. Re-encoding a 0x80..0xFF byte
   * as two-byte UTF-8 turned every non-ASCII character the compiler copied out
   * of a source file into mojibake -- the box-drawing and check-mark literals
   * in CLIProgress came back as "â". This matches the C++ target, whose
   * strfromcode is std::string(1, char(x)). Real codepoints above 0xFF, which
   * no byte-wise read can produce, are still encoded. */
  if (code < 0x100) {
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
  /* An empty path means the filename is the whole path (see
   * ranger_file_exists). */
  if (path[0] == '\0') {
    snprintf(full, sizeof(full), "%s", filename);
  } else {
    snprintf(full, sizeof(full), "%s/%s", path, filename);
  }
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
  int32_t rc;           /* shared maps: a field and a local can both hold one */
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
extern int ranger_obj_refcount(int64_t body);

/* Answers the value to STORE. An owned-object value is retained; an owned
 * STRING value is copied, which is what makes the map's copy independent of
 * the caller's temporary -- the header above has always said "copied on put"
 * and the copy was missing, so a map of strings held pointers into memory the
 * caller had already freed. */
static int64_t rt_smap_own_value(RtSMap *m, int64_t v) {
  if (v == 0) {
    return v;
  }
  if (m->valkind == 1) {
    ranger_obj_retain(v);
    return v;
  }
  if (m->valkind == 2) {
    return (int64_t)(intptr_t)ranger_strdup((const char *)(intptr_t)v);
  }
  return v;
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

/* RANGER_MEM_STATS: maps are not objects, so a leaked one is invisible to the
 * object registry -- yet it keeps every value it holds alive. Counting them
 * separately is what distinguishes "value over-retained" from "value still held
 * by a map nobody freed". */
long g_smap_new = 0, g_smap_free = 0;

/* Free list of RtSMap headers.
 *
 * Every EvalValue owns five string-map fields, so constructing one -- even for
 * the number 42 -- costs five calloc/free round trips before a digit is stored.
 * Measured on `s = s + i`: 28 heap allocations per loop iteration against
 * QuickJS's zero, with 57% of all instructions inside malloc/free. The header
 * is a fixed 64-odd bytes and its lifetime is a churn of same-size blocks,
 * which is exactly the shape a free list handles better than the general
 * allocator. Storage inside the map (entries/index) stays malloc'd, since those
 * vary in size and most maps never get one.
 *
 * RANGER_SMAP_POOL=0 turns this off, so the pooled and unpooled costs stay
 * measurable against each other. */
static RtSMap *g_smap_pool = NULL;
static long g_smap_pool_len = 0;
static int g_smap_pool_on = -1;
#define RT_SMAP_POOL_MAX 4096

static int rt_smap_pool_enabled(void) {
  if (g_smap_pool_on < 0) {
    const char *v = getenv("RANGER_SMAP_POOL");
    g_smap_pool_on = (v != NULL && v[0] == '0') ? 0 : 1;
  }
  return g_smap_pool_on;
}

int64_t RtSMap_new_kind(int valkind) {
  g_smap_new++;
  RtSMap *m;
  if (g_smap_pool != NULL && rt_smap_pool_enabled()) {
    /* The `entries` pointer doubles as the free-list link while pooled. */
    m = g_smap_pool;
    g_smap_pool = (RtSMap *)(void *)m->entries;
    g_smap_pool_len--;
    memset(m, 0, sizeof(RtSMap));
  } else {
    m = (RtSMap *)calloc(1, sizeof(RtSMap));
  }
  if (m == NULL) {
    return 0;
  }
  /* Storage is allocated on the FIRST put, not here. Every EvalValue owns five
   * string-map fields (objectMap, getterMap, setterMap, attrFlags,
   * suppressedKeys) and almost every value -- every number, string and boolean
   * the engine makes -- uses none of them. Allocating eagerly cost ~250 bytes
   * per map, so a plain number carried more than a kilobyte of empty tables.
   * Every reader already copes with the empty state: rt_smap_find returns -1 on
   * a NULL index, and size/keyAt/free all work off count, which stays 0. */
  m->valkind = valkind;
  m->rc = 1;
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
  if (m->entries == NULL) {
    m->cap = 8;
    m->entries = (RtSMapEntry *)calloc((size_t)m->cap, sizeof(RtSMapEntry));
    if (m->entries == NULL) {
      return;
    }
    rt_smap_reindex(m, 16);
    if (m->index == NULL) {
      return;
    }
  }
  h = rt_smap_hash(key);
  ei = rt_smap_find(m, key, h);
  if (ei >= 0) {
    /* own BEFORE releasing: putting a value back over itself must not free it */
    int64_t owned = rt_smap_own_value(m, value);
    rt_smap_release_value(m, m->entries[ei].value);
    m->entries[ei].value = owned; /* replace: keeps the original position */
    return;
  }
  value = rt_smap_own_value(m, value);
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
  if (m == NULL) {
    return 0;
  }
#ifdef RANGER_SMAP_GUARD
  /* Temporary diagnostic: a handle that is not a map at all reads a wild
   * `live`, and the walk that follows allocates until the process dies. */
  if (m->live < 0 || m->cap < 0 || m->count < 0 || m->live > m->count ||
      m->count > m->cap) {
    fprintf(stderr,
            "RtSMap_size: implausible map %p live=%d count=%d cap=%d\n",
            (void *)m, (int)m->live, (int)m->count, (int)m->cap);
    abort();
  }
#endif
  return m->live;
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

/* Leak triage (ranger_mem.c heap walk): does this map still hold `value`? */
int rt_smap_holds_value(int64_t map, int64_t value) {
  RtSMap *m = (RtSMap *)(intptr_t)map;
  int32_t i;
  if (m == NULL) {
    return 0;
  }
  for (i = 0; i < m->count; i++) {
    if (m->entries[i].key != NULL && m->entries[i].value == value) {
      return 1;
    }
  }
  return 0;
}

/* --- accessors the cycle collector uses to walk a map's OBJECT values ---
 * The collector lives in ranger_mem.c and must not know the RtSMap layout, but
 * it does have to enumerate the object references a map holds: a property map
 * hanging off an object field is exactly where a JS-level cycle lives
 * (`a.next = b; b.prev = a` is two puts into two property maps). Exposing the
 * count and an indexed read keeps the layout private while making the edges
 * visible. Index positions include removed holes, which read back as 0. */
int rt_smap_is_object_map(int64_t map) {
  RtSMap *m = (RtSMap *)(intptr_t)map;
  return (m != NULL && m->valkind == 1) ? 1 : 0;
}

int32_t rt_smap_slot_count(int64_t map) {
  RtSMap *m = (RtSMap *)(intptr_t)map;
  return (m == NULL) ? 0 : m->count;
}

int64_t rt_smap_value_slot(int64_t map, int32_t i) {
  RtSMap *m = (RtSMap *)(intptr_t)map;
  if (m == NULL || i < 0 || i >= m->count) {
    return 0;
  }
  return (m->entries[i].key != NULL) ? m->entries[i].value : 0;
}

/* Drop a slot's object value without touching the key, so the collector can
 * break a cycle that runs through a map. The slot keeps its key and reads back
 * as 0 afterwards, which every reader already treats as "no value". */
void rt_smap_clear_value_slot(int64_t map, int32_t i) {
  RtSMap *m = (RtSMap *)(intptr_t)map;
  if (m == NULL || i < 0 || i >= m->count) {
    return;
  }
  m->entries[i].value = 0;
}

/* ---------------------------------------------------------------------------
 * Integer-keyed maps (RtIMap).
 *
 * The generated RtMap_* runtime stores 4-byte slots, so it can hold `[int:int]`
 * and nothing else -- an object reference does not fit. `[int:EvalValue]` needs
 * 64-bit values AND ownership: a value put into the map has to be retained and
 * released like a string map's, or a slot would outlive what it points at.
 *
 * So this lives in C for the same reason RtSMap does: widening the emitted IR
 * would mean hand-writing the wider hash, resize and ownership in LLVM IR,
 * where here they are ordinary code.
 *
 * Open addressing on the key itself. The intended use is a dense numeric range
 * per call frame, which a multiplicative hash spreads evenly and which never
 * needs insertion order -- unlike a string map, whose order JavaScript observes.
 * ------------------------------------------------------------------------- */

typedef struct {
  int64_t key;
  int64_t value;
  uint8_t used;   /* 0 empty, 1 live, 2 tombstone */
} RtIMapEntry;

typedef struct {
  RtIMapEntry *entries;
  int32_t cap;    /* power of two, 0 until the first put */
  int32_t live;
  int32_t used;   /* live + tombstones, drives the resize */
  int32_t valkind; /* 0 plain / 1 owned object / 2 owned string */
  int32_t rc;
} RtIMap;

long g_imap_new = 0, g_imap_free = 0;

static uint32_t rt_imap_hash(int64_t k) {
  uint64_t x = (uint64_t)k;
  x *= 0x9E3779B97F4A7C15ull; /* Fibonacci hashing: good spread for dense keys */
  return (uint32_t)(x >> 32);
}

static void rt_imap_retain_value(RtIMap *m, int64_t v) {
  if (m->valkind == 1 && v != 0) {
    ranger_obj_retain(v);
  }
}

static void rt_imap_release_value(RtIMap *m, int64_t v) {
  if (v == 0) {
    return;
  }
  if (m->valkind == 1) {
    ranger_obj_release(v);
  } else if (m->valkind == 2) {
    free((void *)(intptr_t)v);
  }
}

int64_t RtIMap_new_kind(int valkind) {
  RtIMap *m = (RtIMap *)calloc(1, sizeof(RtIMap));
  g_imap_new++;
  if (m == NULL) {
    return 0;
  }
  /* Storage waits for the first put, as RtSMap's does: most maps in an
   * interpreter never receive one. */
  m->valkind = valkind;
  m->rc = 1;
  return (int64_t)(intptr_t)m;
}

int64_t RtIMap_new(void) { return RtIMap_new_kind(0); }

/* Slot for `key`: the live entry, or the first free slot to claim. */
static int32_t rt_imap_slot(RtIMap *m, int64_t key, int wantFree) {
  uint32_t mask;
  uint32_t i;
  int32_t firstFree = -1;
  if (m == NULL || m->entries == NULL) {
    return -1;
  }
  mask = (uint32_t)(m->cap - 1);
  i = rt_imap_hash(key) & mask;
  for (;;) {
    RtIMapEntry *e = &m->entries[i];
    if (e->used == 0) {
      return wantFree ? ((firstFree >= 0) ? firstFree : (int32_t)i) : -1;
    }
    if (e->used == 1 && e->key == key) {
      return (int32_t)i;
    }
    if (e->used == 2 && firstFree < 0) {
      firstFree = (int32_t)i;
    }
    i = (i + 1) & mask;
  }
}

static int rt_imap_grow(RtIMap *m, int32_t newCap) {
  RtIMapEntry *old = m->entries;
  int32_t oldCap = m->cap;
  int32_t i;
  RtIMapEntry *ne = (RtIMapEntry *)calloc((size_t)newCap, sizeof(RtIMapEntry));
  if (ne == NULL) {
    return 0;
  }
  m->entries = ne;
  m->cap = newCap;
  m->used = m->live;
  for (i = 0; i < oldCap; i++) {
    if (old[i].used == 1) {
      int32_t s = rt_imap_slot(m, old[i].key, 1);
      if (s >= 0) {
        m->entries[s] = old[i];
      }
    }
  }
  free(old);
  return 1;
}

void RtIMap_set(int64_t map, int64_t key, int64_t value) {
  RtIMap *m = (RtIMap *)(intptr_t)map;
  int32_t s;
  if (m == NULL) {
    return;
  }
  if (m->entries == NULL) {
    if (!rt_imap_grow(m, 16)) {
      return;
    }
  }
  /* Resize at half full: open addressing degrades badly past that. */
  if ((m->used + 1) * 2 > m->cap) {
    if (!rt_imap_grow(m, m->cap * 2)) {
      return;
    }
  }
  s = rt_imap_slot(m, key, 1);
  if (s < 0) {
    return;
  }
  /* retain BEFORE releasing: storing a value over itself must not free it */
  rt_imap_retain_value(m, value);
  if (m->entries[s].used == 1) {
    rt_imap_release_value(m, m->entries[s].value);
  } else {
    if (m->entries[s].used == 0) {
      m->used++;
    }
    m->live++;
  }
  m->entries[s].key = key;
  m->entries[s].value = value;
  m->entries[s].used = 1;
}

int64_t RtIMap_get(int64_t map, int64_t key) {
  RtIMap *m = (RtIMap *)(intptr_t)map;
  int32_t s = rt_imap_slot(m, key, 0);
  return (s >= 0) ? m->entries[s].value : 0;
}

int RtIMap_has(int64_t map, int64_t key) {
  return (rt_imap_slot((RtIMap *)(intptr_t)map, key, 0) >= 0) ? 1 : 0;
}

void RtIMap_remove(int64_t map, int64_t key) {
  RtIMap *m = (RtIMap *)(intptr_t)map;
  int32_t s = rt_imap_slot(m, key, 0);
  if (s < 0) {
    return;
  }
  rt_imap_release_value(m, m->entries[s].value);
  m->entries[s].value = 0;
  m->entries[s].used = 2; /* tombstone: a probe chain through here must go on */
  m->live--;
}

int RtIMap_size(int64_t map) {
  RtIMap *m = (RtIMap *)(intptr_t)map;
  return (m == NULL) ? 0 : m->live;
}

void RtIMap_retain(int64_t map) {
  RtIMap *m = (RtIMap *)(intptr_t)map;
  if (m != NULL) {
    m->rc++;
  }
}

void RtIMap_free(int64_t map) {
  RtIMap *m = (RtIMap *)(intptr_t)map;
  int32_t i;
  if (m == NULL) {
    return;
  }
  if (m->rc > 1) {
    m->rc--;
    return;
  }
  m->rc = 0;
  g_imap_free++;
  for (i = 0; i < m->cap; i++) {
    if (m->entries[i].used == 1) {
      rt_imap_release_value(m, m->entries[i].value);
    }
  }
  free(m->entries);
  free(m);
}

/* Does this map hold `value`? Used by the cycle collector's holder scan. */
int rt_imap_holds_value(int64_t map, int64_t value) {
  RtIMap *m = (RtIMap *)(intptr_t)map;
  int32_t i;
  if (m == NULL) {
    return 0;
  }
  for (i = 0; i < m->cap; i++) {
    if (m->entries[i].used == 1 && m->entries[i].value == value) {
      return 1;
    }
  }
  return 0;
}

/* Slot walking for the cycle collector, mirroring the RtSMap accessors. */
int rt_imap_is_object_map(int64_t map) {
  RtIMap *m = (RtIMap *)(intptr_t)map;
  return (m != NULL && m->valkind == 1) ? 1 : 0;
}

int32_t rt_imap_slot_count(int64_t map) {
  RtIMap *m = (RtIMap *)(intptr_t)map;
  return (m == NULL) ? 0 : m->cap;
}

int64_t rt_imap_value_slot(int64_t map, int32_t i) {
  RtIMap *m = (RtIMap *)(intptr_t)map;
  if (m == NULL || i < 0 || i >= m->cap) {
    return 0;
  }
  return (m->entries[i].used == 1) ? m->entries[i].value : 0;
}

/* Assign to `key` only if it already exists, answering whether it did.
 *
 * `if (has m k) { set m k v }` is the shape every scope-chain assignment walks,
 * and it costs two full lookups -- two hashes and two key comparisons -- where
 * one would do. Scope assignment is on the hot path of every statement that
 * writes a variable, so the pair is collapsed here. */
int RtSMap_put_if_present(int64_t map, const char *key, int64_t value) {
  RtSMap *m = (RtSMap *)(intptr_t)map;
  int32_t ei;
  if (m == NULL || key == NULL) {
    return 0;
  }
  ei = rt_smap_find(m, key, rt_smap_hash(key));
  if (ei < 0) {
    return 0;
  }
  /* own BEFORE releasing, exactly as RtSMap_put does: assigning a value over
   * itself must not free it. */
  {
    int64_t owned = rt_smap_own_value(m, value);
    rt_smap_release_value(m, m->entries[ei].value);
    m->entries[ei].value = owned;
  }
  return 1;
}

/* Is the value under `key` held by NOBODY BUT this map?
 *
 * The reference count answers "is this value uniquely owned", which is the
 * exact condition for updating it in place instead of allocating a replacement
 * -- an interpreter's `i++` writes the same binding every time and never needs
 * a new object. Asking from Ranger does not work: the surrounding function's
 * own locals each hold a reference, so the baseline is whatever that function's
 * shape happens to produce, and a hard-coded threshold silently becomes wrong
 * when the function is edited. Here there are no locals at all, so rc == 1 is
 * unambiguous: the map's own reference and nothing else.
 *
 * A pooled small integer or an interned literal is rejected for free -- the
 * pool array holds a second reference -- and so is a value a second binding
 * aliases. Both are exactly the cases that must not be mutated. */
int rt_smap_value_unique(int64_t map, const char *key) {
  RtSMap *m = (RtSMap *)(intptr_t)map;
  int32_t ei;
  int64_t val;
  if (m == NULL || key == NULL || m->valkind != 1) {
    return 0;
  }
  ei = rt_smap_find(m, key, rt_smap_hash(key));
  if (ei < 0) {
    return 0;
  }
  val = m->entries[ei].value;
  if (val == 0) {
    return 0;
  }
  return (ranger_obj_refcount(val) == 1) ? 1 : 0;
}

void RtSMap_retain(int64_t map) {
  RtSMap *m = (RtSMap *)(intptr_t)map;
  if (m == NULL) {
    return;
  }
  m->rc++;
}

void RtSMap_free(int64_t map) {
  RtSMap *m = (RtSMap *)(intptr_t)map;
  int32_t i;
  if (m == NULL) {
    return;
  }
  /* A map stored into an object field and still named by the local that built
   * it has two owners; only the last release frees it. rc==0 means the map
   * predates refcounting -- treat it as a single owner. */
  if (m->rc > 1) {
    m->rc--;
    return;
  }
  m->rc = 0;
  g_smap_free++;
  for (i = 0; i < m->count; i++) {
    free(m->entries[i].key);
    rt_smap_release_value(m, m->entries[i].value);
  }
  free(m->entries);
  free(m->index);
  if (g_smap_pool_len < RT_SMAP_POOL_MAX && rt_smap_pool_enabled()) {
    m->entries = (RtSMapEntry *)(void *)g_smap_pool;
    g_smap_pool = m;
    g_smap_pool_len++;
    return;
  }
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
  /* An EMPTY path means the filename is the whole path. Joining with "/"
   * turned a relative `tmp/probe/x.rgr` into the absolute `/tmp/probe/x.rgr`,
   * so the compiler reported "File not found" for a file that was there. */
  if (path[0] == '\0') {
    snprintf(full, n, "%s", filename);
  } else {
    snprintf(full, n, "%s/%s", path, filename);
  }
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

/* JavaScript-style double formatting, which "%g" is not: %g carries six
 * significant digits, so 946684800000 printed as 9.46685e+11 and every Date in
 * milliseconds lost its value on the way to a string.
 *
 * The rules that matter here: an integral magnitude below 1e21 prints in full
 * with no exponent, and everything else takes the SHORTEST representation that
 * reads back as the same double. */
char *ranger_double_to_string(double v) {
  char buf[64];
  int prec;
  if (v != v) {
    return ranger_strdup("NaN");
  }
  if (v > 1.7976931348623157e308) {
    return ranger_strdup("Infinity");
  }
  if (v < -1.7976931348623157e308) {
    return ranger_strdup("-Infinity");
  }
  if (v == 0.0) {
    return ranger_strdup("0");
  }
  {
    double a = v < 0 ? -v : v;
    /* floor(a) == a means integral; below 1e21 JavaScript writes it out */
    if (a < 1e21 && a == (double)(long long)a) {
      snprintf(buf, sizeof(buf), "%lld", (long long)v);
      return ranger_strdup(buf);
    }
  }
  for (prec = 15; prec <= 17; prec++) {
    snprintf(buf, sizeof(buf), "%.*g", prec, v);
    if (strtod(buf, NULL) == v) {
      break;
    }
  }
  return ranger_strdup(buf);
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

/* `startsWith` / `endsWith`. The Ranger operators answer a boolean; the C
 * helpers answer 0/1 and the lowering compares against zero (Ranger booleans
 * are i1, so returning i32 straight into an `||` would emit `or i1 <i32>`). */
int ranger_str_starts_with(const char *text, const char *prefix) {
  size_t tn;
  size_t pn;
  if (text == NULL || prefix == NULL) {
    return 0;
  }
  tn = strlen(text);
  pn = strlen(prefix);
  if (pn > tn) {
    return 0;
  }
  return memcmp(text, prefix, pn) == 0 ? 1 : 0;
}

int ranger_str_ends_with(const char *text, const char *suffix) {
  size_t tn;
  size_t sn;
  if (text == NULL || suffix == NULL) {
    return 0;
  }
  tn = strlen(text);
  sn = strlen(suffix);
  if (sn > tn) {
    return 0;
  }
  return memcmp(text + (tn - sn), suffix, sn) == 0 ? 1 : 0;
}

/* `indexOfFrom`: search starts at startPos. A start past the end is not an
 * error -- every other target answers -1 rather than reading out of bounds. */
int ranger_str_index_of_from(const char *text, const char *key, int startPos) {
  const char *hit;
  size_t tn;
  if (text == NULL || key == NULL) {
    return -1;
  }
  if (startPos < 0) {
    startPos = 0;
  }
  tn = strlen(text);
  if ((size_t)startPos > tn) {
    return -1;
  }
  hit = strstr(text + startPos, key);
  if (hit == NULL) {
    return -1;
  }
  return (int)(hit - text);
}

/* `replace` changes EVERY occurrence, matching the operator's contract on the
 * other targets. An empty `from` would loop forever, so it answers a copy. */
char *ranger_str_replace(const char *text, const char *from, const char *to) {
  size_t fromLen;
  size_t toLen;
  size_t hits = 0;
  size_t outLen;
  const char *p;
  const char *hit;
  char *out;
  char *w;
  if (text == NULL) {
    return ranger_strdup("");
  }
  if (from == NULL || to == NULL) {
    return ranger_strdup(text);
  }
  fromLen = strlen(from);
  toLen = strlen(to);
  if (fromLen == 0) {
    return ranger_strdup(text);
  }
  for (p = text; (hit = strstr(p, from)) != NULL; p = hit + fromLen) {
    hits++;
  }
  if (hits == 0) {
    return ranger_strdup(text);
  }
  outLen = strlen(text) + hits * toLen - hits * fromLen;
  out = (char *)malloc(outLen + 1);
  if (out == NULL) {
    return ranger_strdup("");
  }
  w = out;
  for (p = text; (hit = strstr(p, from)) != NULL; p = hit + fromLen) {
    size_t lead = (size_t)(hit - p);
    memcpy(w, p, lead);
    w += lead;
    memcpy(w, to, toLen);
    w += toLen;
  }
  strcpy(w, p);
  return out;
}

/* --- Directories, writes and the environment ---------------------------- */

int ranger_dir_exists(const char *path) {
  struct stat st;
  if (path == NULL || path[0] == '\0') {
    return 0;
  }
  if (stat(path, &st) != 0) {
    return 0;
  }
  return S_ISDIR(st.st_mode) ? 1 : 0;
}

/* mkdir -p. Every other target's create_dir is recursive (mkdirs,
 * create_dir_all, createSync(recursive: true)), and the compiler writes its
 * output into a directory several levels deep that may not exist at all. */
void ranger_create_dir(const char *path) {
  char *work;
  size_t n;
  size_t i;
  if (path == NULL || path[0] == '\0') {
    return;
  }
  n = strlen(path);
  work = (char *)malloc(n + 1);
  if (work == NULL) {
    return;
  }
  memcpy(work, path, n + 1);
  for (i = 1; i <= n; i++) {
    if (work[i] == '/' || work[i] == '\0') {
      char saved = work[i];
      work[i] = '\0';
      if (work[0] != '\0') {
        mkdir(work, 0777);
      }
      work[i] = saved;
    }
  }
  free(work);
}

/* `write_file path name data`. `path` may be empty, in which case `name` is
 * the whole filename -- the same rule the Kotlin and C# polyfills use. */
void ranger_write_file(const char *path, const char *filename, const char *data) {
  char *full;
  size_t pn;
  size_t fn;
  FILE *f;
  if (filename == NULL) {
    return;
  }
  pn = (path == NULL) ? 0 : strlen(path);
  fn = strlen(filename);
  full = (char *)malloc(pn + fn + 2);
  if (full == NULL) {
    return;
  }
  if (pn > 0) {
    memcpy(full, path, pn);
    full[pn] = '/';
    memcpy(full + pn + 1, filename, fn + 1);
  } else {
    memcpy(full, filename, fn + 1);
  }
  f = fopen(full, "wb");
  if (f != NULL) {
    if (data != NULL) {
      fwrite(data, 1, strlen(data), f);
    }
    fclose(f);
  }
  free(full);
}

/* `env_var` is optional:string -- an unset (or empty) variable answers NULL,
 * which is what `null?` compares a string against on this backend. The result
 * is a private copy: getenv's buffer belongs to the environment. */
char *ranger_env_var(const char *name) {
  const char *v;
  if (name == NULL) {
    return NULL;
  }
  v = getenv(name);
  if (v == NULL || v[0] == '\0') {
    return NULL;
  }
  return ranger_strdup(v);
}

/* --- SHA-256 ------------------------------------------------------------
 * The compiler hashes two class bodies into a service GUID, so this is on the
 * self-host path. Same digest as the C++ polyfill in Lang.rgr, written out
 * here rather than pulled from a header at build time. */

static uint32_t rt_sha_rotr(uint32_t x, int n) {
  return (x >> n) | (x << (32 - n));
}

char *ranger_sha256_hex(const char *text) {
  static const uint32_t K[64] = {
      0x428a2f98u, 0x71374491u, 0xb5c0fbcfu, 0xe9b5dba5u, 0x3956c25bu,
      0x59f111f1u, 0x923f82a4u, 0xab1c5ed5u, 0xd807aa98u, 0x12835b01u,
      0x243185beu, 0x550c7dc3u, 0x72be5d74u, 0x80deb1feu, 0x9bdc06a7u,
      0xc19bf174u, 0xe49b69c1u, 0xefbe4786u, 0x0fc19dc6u, 0x240ca1ccu,
      0x2de92c6fu, 0x4a7484aau, 0x5cb0a9dcu, 0x76f988dau, 0x983e5152u,
      0xa831c66du, 0xb00327c8u, 0xbf597fc7u, 0xc6e00bf3u, 0xd5a79147u,
      0x06ca6351u, 0x14292967u, 0x27b70a85u, 0x2e1b2138u, 0x4d2c6dfcu,
      0x53380d13u, 0x650a7354u, 0x766a0abbu, 0x81c2c92eu, 0x92722c85u,
      0xa2bfe8a1u, 0xa81a664bu, 0xc24b8b70u, 0xc76c51a3u, 0xd192e819u,
      0xd6990624u, 0xf40e3585u, 0x106aa070u, 0x19a4c116u, 0x1e376c08u,
      0x2748774cu, 0x34b0bcb5u, 0x391c0cb3u, 0x4ed8aa4au, 0x5b9cca4fu,
      0x682e6ff3u, 0x748f82eeu, 0x78a5636fu, 0x84c87814u, 0x8cc70208u,
      0x90befffau, 0xa4506cebu, 0xbef9a3f7u, 0xc67178f2u};
  uint32_t h[8] = {0x6a09e667u, 0xbb67ae85u, 0x3c6ef372u, 0xa54ff53au,
                   0x510e527fu, 0x9b05688cu, 0x1f83d9abu, 0x5be0cd19u};
  unsigned char *msg;
  size_t n;
  size_t total;
  size_t off;
  size_t i;
  char *out;
  uint64_t bits;

  n = (text == NULL) ? 0 : strlen(text);
  /* message + 0x80 + zero padding to 56 mod 64 + 8 length bytes */
  total = n + 1;
  while ((total % 64) != 56) {
    total++;
  }
  total += 8;
  msg = (unsigned char *)calloc(total, 1);
  if (msg == NULL) {
    return ranger_strdup("");
  }
  if (n > 0) {
    memcpy(msg, text, n);
  }
  msg[n] = 0x80;
  bits = (uint64_t)n * 8u;
  for (i = 0; i < 8; i++) {
    msg[total - 1 - i] = (unsigned char)((bits >> (8 * i)) & 0xffu);
  }

  for (off = 0; off < total; off += 64) {
    uint32_t w[64];
    uint32_t a, b, c, d, e, f, g, hh;
    int t;
    for (t = 0; t < 16; t++) {
      w[t] = ((uint32_t)msg[off + t * 4] << 24) |
             ((uint32_t)msg[off + t * 4 + 1] << 16) |
             ((uint32_t)msg[off + t * 4 + 2] << 8) |
             ((uint32_t)msg[off + t * 4 + 3]);
    }
    for (t = 16; t < 64; t++) {
      uint32_t s0 = rt_sha_rotr(w[t - 15], 7) ^ rt_sha_rotr(w[t - 15], 18) ^
                    (w[t - 15] >> 3);
      uint32_t s1 = rt_sha_rotr(w[t - 2], 17) ^ rt_sha_rotr(w[t - 2], 19) ^
                    (w[t - 2] >> 10);
      w[t] = w[t - 16] + s0 + w[t - 7] + s1;
    }
    a = h[0]; b = h[1]; c = h[2]; d = h[3];
    e = h[4]; f = h[5]; g = h[6]; hh = h[7];
    for (t = 0; t < 64; t++) {
      uint32_t S1 = rt_sha_rotr(e, 6) ^ rt_sha_rotr(e, 11) ^ rt_sha_rotr(e, 25);
      uint32_t ch = (e & f) ^ ((~e) & g);
      uint32_t temp1 = hh + S1 + ch + K[t] + w[t];
      uint32_t S0 = rt_sha_rotr(a, 2) ^ rt_sha_rotr(a, 13) ^ rt_sha_rotr(a, 22);
      uint32_t maj = (a & b) ^ (a & c) ^ (b & c);
      uint32_t temp2 = S0 + maj;
      hh = g; g = f; f = e;
      e = d + temp1;
      d = c; c = b; b = a;
      a = temp1 + temp2;
    }
    h[0] += a; h[1] += b; h[2] += c; h[3] += d;
    h[4] += e; h[5] += f; h[6] += g; h[7] += hh;
  }
  free(msg);

  out = (char *)malloc(65);
  if (out == NULL) {
    return ranger_strdup("");
  }
  for (i = 0; i < 8; i++) {
    sprintf(out + i * 8, "%08x", (unsigned)h[i]);
  }
  out[64] = '\0';
  return out;
}

/* `join xs sep` over the ptr-array of strings strsplit also produces. */
char *ranger_str_join(int64_t desc_addr, const char *sep) {
  RtSplitDesc *d;
  int64_t *data;
  size_t seplen;
  size_t total = 0;
  int32_t i;
  char *out;
  char *w;
  if (desc_addr == 0) {
    return ranger_strdup("");
  }
  d = (RtSplitDesc *)(intptr_t)desc_addr;
  seplen = (sep == NULL) ? 0 : strlen(sep);
  data = (int64_t *)(intptr_t)d->data;
  for (i = 0; i < d->len; i++) {
    const char *s = (const char *)(intptr_t)data[i];
    if (s != NULL) {
      total += strlen(s);
    }
    if (i + 1 < d->len) {
      total += seplen;
    }
  }
  out = (char *)malloc(total + 1);
  if (out == NULL) {
    return ranger_strdup("");
  }
  w = out;
  for (i = 0; i < d->len; i++) {
    const char *s = (const char *)(intptr_t)data[i];
    size_t n;
    if (s != NULL) {
      n = strlen(s);
      memcpy(w, s, n);
      w += n;
    }
    if (i + 1 < d->len && seplen > 0) {
      memcpy(w, sep, seplen);
      w += seplen;
    }
  }
  *w = '\0';
  return out;
}

/* `trim_right` -- trailing whitespace only. */
char *ranger_str_trim_right(const char *text) {
  const char *e;
  char *out;
  size_t n;
  if (text == NULL) {
    return ranger_strdup("");
  }
  e = text + strlen(text);
  while (e > text) {
    char c = *(e - 1);
    if (c != ' ' && c != '\t' && c != '\n' && c != '\r') {
      break;
    }
    e--;
  }
  n = (size_t)(e - text);
  out = (char *)malloc(n + 1);
  if (out == NULL) {
    return ranger_strdup("");
  }
  memcpy(out, text, n);
  out[n] = '\0';
  return out;
}

/* --- Paths --------------------------------------------------------------
 * `normalize`, `path_dirname`, `install_directory` and `current_directory`.
 * The same rules the polyfills in Lang.rgr spell out for the other targets:
 * "." and ".." are resolved textually, a trailing slash is kept unless the
 * result is the root, and dirname of a bare name is ".". */
char *ranger_path_normalize(const char *p) {
  size_t n;
  int absolute;
  int trailing;
  char *work;
  char **parts;
  size_t nparts = 0;
  size_t i;
  size_t start;
  size_t outLen;
  char *out;
  if (p == NULL || p[0] == '\0') {
    return ranger_strdup("");
  }
  n = strlen(p);
  absolute = (p[0] == '/');
  trailing = (n > 1 && p[n - 1] == '/');
  work = (char *)malloc(n + 1);
  parts = (char **)malloc((n + 1) * sizeof(char *));
  if (work == NULL || parts == NULL) {
    free(work);
    free(parts);
    return ranger_strdup(p);
  }
  memcpy(work, p, n + 1);
  start = 0;
  for (i = 0; i <= n; i++) {
    if (work[i] == '/' || work[i] == '\0') {
      work[i] = '\0';
      if (start < i) {
        char *seg = work + start;
        if (strcmp(seg, ".") == 0) {
          /* drop */
        } else if (strcmp(seg, "..") == 0) {
          if (nparts > 0 && strcmp(parts[nparts - 1], "..") != 0) {
            nparts--;
          } else if (!absolute) {
            parts[nparts++] = seg;
          }
        } else {
          parts[nparts++] = seg;
        }
      }
      start = i + 1;
    }
  }
  outLen = 1;
  for (i = 0; i < nparts; i++) {
    outLen += strlen(parts[i]) + 1;
  }
  outLen += 2;
  out = (char *)malloc(outLen);
  if (out == NULL) {
    free(work);
    free(parts);
    return ranger_strdup(p);
  }
  out[0] = '\0';
  if (absolute) {
    strcat(out, "/");
  }
  for (i = 0; i < nparts; i++) {
    if (i > 0) {
      strcat(out, "/");
    }
    strcat(out, parts[i]);
  }
  if (out[0] == '\0') {
    strcat(out, absolute ? "/" : ".");
  }
  if (trailing && strcmp(out, "/") != 0) {
    strcat(out, "/");
  }
  free(work);
  free(parts);
  return out;
}

char *ranger_path_dirname(const char *p) {
  char *s = ranger_path_normalize(p);
  size_t n;
  char *pos;
  char *out;
  if (s == NULL) {
    return ranger_strdup(".");
  }
  n = strlen(s);
  if (n > 1 && s[n - 1] == '/') {
    s[n - 1] = '\0';
  }
  pos = strrchr(s, '/');
  if (pos == NULL) {
    free(s);
    return ranger_strdup(".");
  }
  if (pos == s) {
    free(s);
    return ranger_strdup("/");
  }
  *pos = '\0';
  out = ranger_strdup(s);
  free(s);
  return out;
}

char *ranger_current_directory(void) {
  char buf[4096];
  if (getcwd(buf, sizeof(buf)) == NULL) {
    return ranger_strdup(".");
  }
  return ranger_strdup(buf);
}

/* The directory of argv[0], which is where the compiler looks for Lang.rgr
 * and lib/ -- the same rule the C++ build uses. */
char *ranger_install_directory(void) {
  const char *argv0 = ranger_argv0();
  if (argv0 == NULL || argv0[0] == '\0') {
    return ranger_current_directory();
  }
  return ranger_path_dirname(argv0);
}

/* `is_tty` -- whether stdout is a terminal, which is what the progress output
 * asks before it emits colours. */
int ranger_is_tty(void) { return isatty(1) != 0 ? 1 : 0; }
