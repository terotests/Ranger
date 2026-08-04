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
#define RT_FIELD_STRING_MAP 3

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
#ifdef RANGER_MEM_DEBUG
  /* Leak-triage fields, compiled in ONLY for debug builds: they add ~150 bytes
   * to every object header, which is far more than most objects carry in
   * fields. Build with -DRANGER_MEM_DEBUG and set RANGER_MEM_SITES to use them.
   *   site   allocation return address
   *   lnext/lprev  live-object registry, so the heap can be walked at exit
   *   rets/rels    retain and release sites, to find the unmatched retain
   */
  void *site;
  void *lnext;
  void *lprev;
  /* A single CHRONOLOGICAL event log. Separate retain and release lists could
   * only be compared statistically; with one ordered log the events pair like
   * brackets -- each release closes the most recent open retain -- and whatever
   * is still open at the end is the unmatched retain, by name. */
  void *evsite[96];
  unsigned char evret[96]; /* 1 = retain, 0 = release */
  uint32_t nev;
  uint32_t nret;
  uint32_t nrel;
  void *lastret;
#endif
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
extern void RtSMap_free(int64_t map); /* string-map fields (kind 3) */
extern int rt_smap_holds_value(int64_t map, int64_t value);
extern long g_smap_new, g_smap_free;

static int g_live_objects = 0;
/* RANGER_MEM_STATS=1 prints allocation balances at exit. */
static long g_obj_new, g_obj_free, g_arr_new, g_arr_free, g_arr_retain;

#ifdef RANGER_MEM_DEBUG
/* RANGER_MEM_SITES=1 additionally tallies LIVE objects by allocation site, so a
 * steady leak can be attributed to the call that made it rather than guessed
 * at from the source. Off by default: it widens every object header. */
#ifdef RANGER_MEM_DEBUG
static int g_site_track = 0;
static int g_site_depth = 0;
#endif
#define RT_SITES 4096
static void *g_site_addr[RT_SITES];
static long g_site_live[RT_SITES];

static void rt_site_bump(void *site, int delta) {
  unsigned h = (unsigned)(((uintptr_t)site >> 3) & (RT_SITES - 1));
  unsigned probe;
  for (probe = 0; probe < RT_SITES; probe++) {
    unsigned k = (h + probe) & (RT_SITES - 1);
    if (g_site_addr[k] == NULL || g_site_addr[k] == site) {
      g_site_addr[k] = site;
      g_site_live[k] += delta;
      return;
    }
  }
}

/* Live-object registry. Under RANGER_MEM_SITES every live object is threaded
 * onto a list so the heap can be WALKED at exit: for each leaked object we can
 * then count how many live objects still point at it. A leak with zero incoming
 * references is an over-retain (a retain with no matching release); a leak with
 * incoming references is genuinely still reachable, and the holder tells you
 * where to look. Reading the code could not tell these apart. */
static char *g_live_head = NULL;

static void rt_live_add(char *block) {
  RangerObjHeader *h = (RangerObjHeader *)block;
  h->lprev = NULL;
  h->lnext = g_live_head;
  if (g_live_head) {
    ((RangerObjHeader *)g_live_head)->lprev = block;
  }
  g_live_head = block;
}

static void rt_live_remove(char *block) {
  RangerObjHeader *h = (RangerObjHeader *)block;
  if (h->lprev) {
    ((RangerObjHeader *)h->lprev)->lnext = h->lnext;
  } else if (g_live_head == block) {
    g_live_head = (char *)h->lnext;
  }
  if (h->lnext) {
    ((RangerObjHeader *)h->lnext)->lprev = h->lprev;
  }
  h->lnext = NULL;
  h->lprev = NULL;
}

/* Does live object `holder` reference `target` through any of its fields? */
static int rt_holder_points_at(char *holder_block, int64_t target) {
  RangerObjHeader *h = (RangerObjHeader *)holder_block;
  int64_t body = (int64_t)(intptr_t)(holder_block + RANGER_HEADER_SIZE);
  uint16_t i;
  if (h->type == NULL || h->type->fields == NULL) {
    return 0;
  }
  for (i = 0; i < h->type->field_count; i++) {
    const RangerFieldDesc *f = &h->type->fields[i];
    int64_t val = *(int64_t *)(intptr_t)(body + f->offset);
    if (val == 0) {
      continue;
    }
    if (f->kind == RT_FIELD_OBJECT && val == target) {
      return 1;
    }
    if (f->kind == RT_FIELD_PTR_ARRAY) {
      RtPtrArrayDesc *d = (RtPtrArrayDesc *)(intptr_t)val;
      int32_t k;
      if (d->owned == 1 && d->data != 0) {
        int64_t *elems = (int64_t *)(intptr_t)d->data;
        for (k = 0; k < d->len; k++) {
          if (elems[k] == target) {
            return 1;
          }
        }
      }
    }
    if (f->kind == RT_FIELD_STRING_MAP) {
      if (rt_smap_holds_value(val, target)) {
        return 1;
      }
    }
  }
  return 0;
}

static void rt_dump_holders(void) {
  char *b;
  long orphan = 0, held = 0, shown = 0;
  fprintf(stderr, "[mem] leak triage: who still points at live objects\n");
  for (b = g_live_head; b != NULL; b = (char *)((RangerObjHeader *)b)->lnext) {
    int64_t body = (int64_t)(intptr_t)(b + RANGER_HEADER_SIZE);
    char *o;
    int refs = 0;
    for (o = g_live_head; o != NULL; o = (char *)((RangerObjHeader *)o)->lnext) {
      if (o == b) {
        continue;
      }
      refs += rt_holder_points_at(o, body);
      if (refs) {
        break;
      }
    }
    if (refs) {
      held++;
    } else {
      orphan++;
      if (shown < 6) {
        {
          RangerObjHeader *oh = (RangerObjHeader *)b;
          unsigned q;
          /* Diff the two lists per SITE: the site whose retains outnumber its
           * releases is the unmatched one. Printing the raw sequences only
           * showed which sites were involved, not which one failed to pair. */
          unsigned nr = oh->nret < 64 ? oh->nret : 64;
          unsigned ne = oh->nrel < 64 ? oh->nrel : 64;
          fprintf(stderr, "  ORPHAN rc=%u alloc=%p retains=%u releases=%u\n",
                  oh->rc, oh->site, oh->nret, oh->nrel);
          /* Bracket-match the log: a release closes the most recent still-open
           * retain. What stays open is the retain nobody gave back. */
          void *open[96];
          unsigned depth = 0;
          (void)nr; (void)ne;
          fprintf(stderr, "  ORPHAN rc=%u alloc=%p events=%u\n", oh->rc, oh->site, oh->nev);
          for (q = 0; q < oh->nev && q < 96; q++) {
            if (oh->evret[q]) {
              if (depth < 96) { open[depth++] = oh->evsite[q]; }
            } else if (depth > 0) {
              depth--;
            }
          }
          for (q = 0; q < depth; q++) {
            fprintf(stderr, "    UNMATCHED RETAIN at %p\n", open[q]);
          }
          fprintf(stderr, "    LOG:");
          for (q = 0; q < oh->nev && q < 96; q++) {
            fprintf(stderr, " %c%p", oh->evret[q] ? '+' : '-', oh->evsite[q]);
          }
          fprintf(stderr, "\n");
        }
        shown++;
      }
    }
  }
  fprintf(stderr, "  orphaned (over-retained): %ld,  still referenced: %ld\n",
          orphan, held);
}

static void rt_dump_sites(void) {
  int shown = 0;
  int round;
  fprintf(stderr, "[mem] live objects by allocation site:\n");
  for (round = 0; round < 12; round++) {
    long best = 0;
    int bi = -1;
    int k;
    for (k = 0; k < RT_SITES; k++) {
      if (g_site_live[k] > best) { best = g_site_live[k]; bi = k; }
    }
    if (bi < 0) break;
    fprintf(stderr, "  %p  live=%ld\n", g_site_addr[bi], g_site_live[bi]);
    g_site_live[bi] = 0;
    shown++;
  }
  if (!shown) fprintf(stderr, "  (none)\n");
}

#endif /* RANGER_MEM_DEBUG */

static void ranger_mem_dump_stats(void) {
  fprintf(stderr,
          "[mem] objects new=%ld freed=%ld live=%d | arrays freed=%ld retained=%ld"
          " | smaps new=%ld freed=%ld live=%ld\n",
          g_obj_new, g_obj_free, g_live_objects, g_arr_free, g_arr_retain,
          g_smap_new, g_smap_free, g_smap_new - g_smap_free);
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
#ifdef RANGER_MEM_DEBUG
    if (getenv("RANGER_MEM_SITES")) {
      g_site_track = 1;
      g_site_depth = (getenv("RANGER_MEM_SITES")[0] == '2') ? 1 : 0;
      if (getenv("RANGER_MEM_HOLDERS")) {
        atexit(rt_dump_holders);
      }
      atexit(rt_dump_sites);
    }
#endif
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
  case RT_FIELD_STRING_MAP:
    val = *(int64_t *)(base + f->offset);
    if (val != 0) {
      RtSMap_free(val);
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
#ifdef RANGER_MEM_DEBUG
  if (g_site_track) {
    /* RANGER_MEM_SITES=2 records the CALLER of the allocating helper: every
     * EvalValue comes from the same few constructors, so level 0 only ever
     * names those. */
    h->site = g_site_depth ? __builtin_return_address(1) : __builtin_return_address(0);
    rt_site_bump(h->site, 1);
    rt_live_add(block);
  }
#endif
  return (int64_t)(block + RANGER_HEADER_SIZE);
}

void ranger_obj_retain(int64_t body) {
  RangerObjHeader *h;
  if (body == 0) {
    return;
  }
  h = (RangerObjHeader *)((char *)body - RANGER_HEADER_SIZE);
#ifdef RANGER_MEM_DEBUG
  if (g_site_track) {
    h->lastret = __builtin_return_address(0);
    if (h->nev < 96) {
      h->evsite[h->nev] = h->lastret;
      h->evret[h->nev] = 1;
      h->nev++;
    }
    h->nret++;
  }
#endif
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
#ifdef RANGER_MEM_DEBUG
  if (g_site_track) {
    if (h->nev < 96) {
      h->evsite[h->nev] = __builtin_return_address(0);
      h->evret[h->nev] = 0;
      h->nev++;
    }
    h->nrel++;
  }
#endif
  if (h->rc == 0) {
    return;
  }
  if (--h->rc > 0) {
    return;
  }
  ranger_destroy_fields(body, h->type);
#ifdef RANGER_MEM_DEBUG
  if (g_site_track) {
    if (h->site) {
      rt_site_bump(h->site, -1);
    }
    rt_live_remove(block);
  }
#endif
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
