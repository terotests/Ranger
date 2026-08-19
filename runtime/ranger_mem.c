/*
 * Ranger LLVM memory management runtime.
 * Layout: [RangerObjHeader][struct bytes...]
 * Body pointer (i64) = address of struct bytes.
 */
#include <setjmp.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#if defined(__GLIBC__)
#include <malloc.h>
#endif

#define RT_FIELD_STRING 0
#define RT_FIELD_OBJECT 1
#define RT_FIELD_PTR_ARRAY 2
#define RT_FIELD_STRING_MAP 3
#define RT_FIELD_INT_MAP 4

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
  /* Cycle-collector state. Reference counting frees everything acyclic, but a
   * JS program that writes `a.next = b; b.prev = a` builds a cycle whose
   * members keep each other's count above zero forever. These three words let
   * the collector in the "cycle collector" section below find such groups:
   *   reg_idx  slot in the live-object registry (swap-removed on free)
   *   scratch  rc minus the references the heap itself holds
   *   mark     reached from a root during the current collection */
  uint32_t reg_idx;
  int32_t scratch;
  uint8_t mark;
  uint8_t _pad[3];
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
extern void RtIMap_free(int64_t map);  /* int-keyed reference maps (kind 4) */
extern int rt_imap_holds_value(int64_t map, int64_t value);
extern int rt_imap_is_object_map(int64_t map);
extern int32_t rt_imap_slot_count(int64_t map);
extern int64_t rt_imap_value_slot(int64_t map, int32_t i);
extern int rt_smap_holds_value(int64_t map, int64_t value);
/* Map walking for the cycle collector (defined in ranger_rt.c). */
extern int rt_smap_is_object_map(int64_t map);
extern int32_t rt_smap_slot_count(int64_t map);
extern int64_t rt_smap_value_slot(int64_t map, int32_t i);
extern void rt_smap_clear_value_slot(int64_t map, int32_t i);
extern long g_smap_new, g_smap_free;

static int g_live_objects = 0;
/* RANGER_MEM_STATS=1 prints allocation balances at exit. */
static long g_obj_new, g_obj_free, g_arr_new, g_arr_free, g_arr_retain;
/* Cycle-collector counters, declared here so the stats dump below can read them
 * (the collector itself lives further down, next to the code it walks). */
static long g_gc_runs = 0, g_gc_freed = 0;
static long g_gc_threshold = 500000, g_gc_floor = 500000;

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
    if (f->kind == RT_FIELD_INT_MAP) {
      if (rt_imap_holds_value(val, target)) {
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
  /* Bytes actually held by malloc. The per-population counters above only see
   * what they were told about; a heap that grows while every counter stays flat
   * means the growth is in something none of them names. */
  {
#if defined(__GLIBC__)
    struct mallinfo2 mi = mallinfo2();
    fprintf(stderr, "[mem] heap in-use=%.1f MB (malloc)\n",
            (double)mi.uordblks / (1024.0 * 1024.0));
#endif
  }
  fprintf(stderr, "[mem] gc collections=%ld cycles-freed=%ld next-threshold=%ld\n",
          g_gc_runs, g_gc_freed, g_gc_threshold);
}

/* RANGER_MEM_TRACE=N prints the same line every N object allocations. A program
 * that dies on an allocation failure -- or is killed for growing too fast --
 * never reaches atexit, so the exit summary says nothing about the run that
 * actually mattered. A periodic line shows WHICH population is growing. */
static long g_trace_every = 0;
static long g_trace_next = 0;

/* Checked once: this sits on the object-allocation path, so a getenv per
 * allocation would itself distort what it measures. */
void ranger_mem_stats_enable(void) {
  static int state = 0; /* 0 = unchecked, 1 = on, 2 = off */
  if (state != 0) {
    return;
  }
  if (getenv("RANGER_MEM_TRACE")) {
    g_trace_every = atol(getenv("RANGER_MEM_TRACE"));
    if (g_trace_every < 1) {
      g_trace_every = 1000000;
    }
    g_trace_next = g_trace_every;
  }
  if (getenv("RANGER_MEM_STATS") || g_trace_every > 0) {
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

/* The reference count of one object, for callers that need to know whether a
 * value is UNIQUELY owned. An interpreter can update a number in place instead
 * of minting a new one when nothing else can observe the old one, and rc == 1
 * -- only the binding holds it -- is exactly that condition. Returns 0 for a
 * null body so a caller can treat "cannot tell" and "not unique" alike. */
int ranger_obj_refcount(int64_t body) {
  if (body == 0) {
    return 0;
  }
  return (int)((RangerObjHeader *)((char *)(intptr_t)body - RANGER_HEADER_SIZE))->rc;
}

/* The type descriptor an object was created with, as a plain address. This is
 * the object's RUNTIME class: emitted code compares it against the &X_typeDesc
 * of each candidate to dispatch a method call through a base-class reference,
 * which is how a target with no vtables of its own resolves an override.
 * Returns 0 for a null body, which falls through to the base implementation. */
int64_t ranger_obj_type(int64_t body) {
  if (body == 0) {
    return 0;
  }
  return (int64_t)(intptr_t)((RangerObjHeader *)((char *)(intptr_t)body -
                                                 RANGER_HEADER_SIZE))
      ->type;
}

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
  case RT_FIELD_INT_MAP:
    val = *(int64_t *)(base + f->offset);
    if (val != 0) {
      RtIMap_free(val);
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

/* ======================================================================
 * Cycle collector
 *
 * Reference counting frees everything the moment its last owner lets go --
 * except a group of objects that reference each other. `a.next = b; b.prev = a`
 * leaves both counts at 1 with nobody able to reach them, and a benchmark that
 * builds a linked structure per iteration (richards' task list, for one) grows
 * without bound. Measurement showed exactly this: every other allocation shape
 * stayed flat at ~4,600 live objects regardless of iteration count, while the
 * two-object cycle grew by exactly 2 per iteration.
 *
 * The algorithm is synchronous trial deletion over the whole heap:
 *
 *   1. scratch = rc for every live object
 *   2. walk every object's outgoing references and subtract one per reference
 *   3. an object with scratch > 0 still has an owner OUTSIDE the object graph
 *      -- a local, a global, a standalone container -- so it is a root
 *   4. mark everything reachable from the roots
 *   5. whatever stays unmarked is referenced only by other unmarked objects:
 *      a cycle, and unreachable
 *
 * Step 3 is conservative in the safe direction. A reference the collector
 * cannot see (an object held in a plain integer array, say) is never
 * subtracted, so scratch stays positive and the object is treated as a root.
 * The failure mode is a missed collection, not a premature free. The C stack is
 * scanned for the same reason: a local that borrows a body pointer without
 * retaining it would otherwise be invisible.
 * ====================================================================== */

#define RT_UNREGISTERED 0xFFFFFFFFu
#define RT_BODY_OF(block) ((int64_t)(intptr_t)((block) + RANGER_HEADER_SIZE))
#define RT_HEADER_OF(body) ((RangerObjHeader *)((char *)(intptr_t)(body) - RANGER_HEADER_SIZE))

/* Every live object, so the heap can be walked without a shadow structure.
 * A doubly-linked list through the header would cost 16 bytes per object; an
 * index plus swap-remove costs 4 and keeps the walk sequential. */
static char **g_reg = NULL;
static long g_reg_len = 0, g_reg_cap = 0;
static int g_gc_enabled = -1; /* -1 unchecked, 0 off, 1 on */
static int g_gc_running = 0;
static char *g_stack_base = NULL;

/* The bottom of the C stack, so a conservative scan knows where to stop. Called
 * from the program's entry shim with the address of one of main's locals. */
void ranger_gc_stack_base(void *p) { g_stack_base = (char *)p; }

static void rt_reg_add(char *block) {
  RangerObjHeader *h = (RangerObjHeader *)block;
  if (g_reg_len == g_reg_cap) {
    long nc = (g_reg_cap == 0) ? 1024 : g_reg_cap * 2;
    char **nb = (char **)realloc(g_reg, (size_t)nc * sizeof(char *));
    if (nb == NULL) {
      /* Without a complete registry the collector cannot tell a cycle from a
       * root, so it must not run at all rather than run on a partial heap. */
      h->reg_idx = RT_UNREGISTERED;
      g_gc_enabled = 0;
      return;
    }
    g_reg = nb;
    g_reg_cap = nc;
  }
  h->reg_idx = (uint32_t)g_reg_len;
  g_reg[g_reg_len++] = block;
}

static void rt_reg_remove(char *block) {
  RangerObjHeader *h = (RangerObjHeader *)block;
  uint32_t i = h->reg_idx;
  if (i == RT_UNREGISTERED || (long)i >= g_reg_len || g_reg[i] != block) {
    return;
  }
  g_reg_len--;
  g_reg[i] = g_reg[g_reg_len];
  ((RangerObjHeader *)g_reg[i])->reg_idx = i;
  h->reg_idx = RT_UNREGISTERED;
}

/* --- a set of container addresses, to count shared containers once --------
 * A ptr-array descriptor or a string map can be held by two objects at once
 * (rc > 1) while its elements were retained only once. Walking it from both
 * holders would subtract two for a single reference and make a live object look
 * like garbage, so each container contributes its edges exactly once. */
typedef struct {
  uintptr_t *slots;
  size_t cap;
  size_t used;
} RtPtrSet;

static void rt_set_init(RtPtrSet *s) {
  s->slots = NULL;
  s->cap = 0;
  s->used = 0;
}

static void rt_set_free(RtPtrSet *s) {
  free(s->slots);
  rt_set_init(s);
}

static int rt_set_add(RtPtrSet *s, uintptr_t p) {
  size_t mask, i;
  if (s->slots == NULL || (s->used + 1) * 2 > s->cap) {
    size_t nc = (s->cap == 0) ? 256 : s->cap * 2;
    uintptr_t *ns = (uintptr_t *)calloc(nc, sizeof(uintptr_t));
    size_t k;
    if (ns == NULL) {
      return 1; /* out of memory: count the edge, worst case a missed collection */
    }
    for (k = 0; k < s->cap; k++) {
      uintptr_t v = s->slots[k];
      if (v != 0) {
        size_t j = (v >> 4) & (nc - 1);
        while (ns[j] != 0) {
          j = (j + 1) & (nc - 1);
        }
        ns[j] = v;
      }
    }
    free(s->slots);
    s->slots = ns;
    s->cap = nc;
  }
  mask = s->cap - 1;
  i = (p >> 4) & mask;
  while (s->slots[i] != 0) {
    if (s->slots[i] == p) {
      return 0;
    }
    i = (i + 1) & mask;
  }
  s->slots[i] = p;
  s->used++;
  return 1;
}

/* --- the mark worklist ---------------------------------------------------
 * An explicit stack rather than recursion: the object graph of a running
 * interpreter is deep enough that recursive marking would overflow. */
typedef struct {
  int64_t *items;
  long len;
  long cap;
} RtBodyStack;

static void rt_stack_push(RtBodyStack *st, int64_t v) {
  if (st->len == st->cap) {
    long nc = (st->cap == 0) ? 1024 : st->cap * 2;
    int64_t *ni = (int64_t *)realloc(st->items, (size_t)nc * sizeof(int64_t));
    if (ni == NULL) {
      return; /* dropping a mark can only retain garbage, never free live data */
    }
    st->items = ni;
    st->cap = nc;
  }
  st->items[st->len++] = v;
}

#define RT_EDGE_SUB 0
#define RT_EDGE_MARK 1

static void rt_edge(int64_t ref, int mode, RtBodyStack *work) {
  RangerObjHeader *h;
  if (ref == 0) {
    return;
  }
  h = RT_HEADER_OF(ref);
  if (mode == RT_EDGE_SUB) {
    h->scratch--;
    return;
  }
  if (!h->mark) {
    h->mark = 1;
    rt_stack_push(work, ref);
  }
}

/* Every object reference reachable from one object's fields, once per
 * container. In SUB mode a borrowed field is skipped: it aliases memory owned
 * elsewhere and never bumped the count, so subtracting for it would be
 * double-counting. In MARK mode it is followed, because keeping a borrowed
 * target alive is the safe direction. */
static void rt_walk_edges(int64_t body, const RangerTypeDesc *type, RtPtrSet *seen,
                          int mode, RtBodyStack *work) {
  char *base = (char *)(intptr_t)body;
  uint16_t i;
  if (body == 0 || type == NULL || type->fields == NULL) {
    return;
  }
  for (i = 0; i < type->field_count; i++) {
    const RangerFieldDesc *f = &type->fields[i];
    int64_t val;
    if (f->kind == RT_FIELD_STRING) {
      continue;
    }
    if (!f->owned && mode == RT_EDGE_SUB) {
      continue;
    }
    val = *(int64_t *)(base + f->offset);
    if (val == 0) {
      continue;
    }
    if (f->kind == RT_FIELD_OBJECT) {
      rt_edge(val, mode, work);
    } else if (f->kind == RT_FIELD_PTR_ARRAY) {
      RtPtrArrayDesc *d = (RtPtrArrayDesc *)(intptr_t)val;
      int64_t *elems;
      int32_t k;
      if (d->owned != 1 || d->data == 0) {
        continue;
      }
      if (!rt_set_add(seen, (uintptr_t)val)) {
        continue;
      }
      elems = (int64_t *)(intptr_t)d->data;
      for (k = 0; k < d->len; k++) {
        rt_edge(elems[k], mode, work);
      }
    } else if (f->kind == RT_FIELD_STRING_MAP) {
      int32_t n, k;
      if (!rt_smap_is_object_map(val)) {
        continue;
      }
      if (!rt_set_add(seen, (uintptr_t)val)) {
        continue;
      }
      n = rt_smap_slot_count(val);
      for (k = 0; k < n; k++) {
        rt_edge(rt_smap_value_slot(val, k), mode, work);
      }
    } else if (f->kind == RT_FIELD_INT_MAP) {
      int32_t n, k;
      if (!rt_imap_is_object_map(val)) {
        continue;
      }
      if (!rt_set_add(seen, (uintptr_t)val)) {
        continue;
      }
      n = rt_imap_slot_count(val);
      for (k = 0; k < n; k++) {
        rt_edge(rt_imap_value_slot(val, k), mode, work);
      }
    }
  }
}

static int rt_cmp_uptr(const void *a, const void *b) {
  uintptr_t x = *(const uintptr_t *)a;
  uintptr_t y = *(const uintptr_t *)b;
  return (x < y) ? -1 : ((x > y) ? 1 : 0);
}

/* Treat any stack word that looks like a live body pointer as a root. The
 * generated code keeps owned locals counted, but a borrowed local -- an object
 * read out of a field into a temporary -- is invisible to the count, and
 * collecting it while a frame still points at it would be a use-after-free.
 * False positives (an old value that happens to match) only delay a collection. */
static void rt_gc_scan_range(uintptr_t start, uintptr_t end, RtBodyStack *work) {
  uintptr_t *sorted;
  uintptr_t lo, hi, p;
  long i;
  if (g_reg_len == 0 || end <= start) {
    return;
  }
  sorted = (uintptr_t *)malloc((size_t)g_reg_len * sizeof(uintptr_t));
  if (sorted == NULL) {
    return;
  }
  for (i = 0; i < g_reg_len; i++) {
    sorted[i] = (uintptr_t)(intptr_t)RT_BODY_OF(g_reg[i]);
  }
  qsort(sorted, (size_t)g_reg_len, sizeof(uintptr_t), rt_cmp_uptr);
  lo = sorted[0];
  hi = sorted[g_reg_len - 1];
  start &= ~(uintptr_t)(sizeof(uintptr_t) - 1);
  for (p = start; p + sizeof(uintptr_t) <= end; p += sizeof(uintptr_t)) {
    uintptr_t v = *(uintptr_t *)p;
    long a, b;
    if (v < lo || v > hi) {
      continue;
    }
    a = 0;
    b = g_reg_len - 1;
    while (a <= b) {
      long mid = a + (b - a) / 2;
      if (sorted[mid] == v) {
        RangerObjHeader *h = RT_HEADER_OF((int64_t)(intptr_t)v);
        if (!h->mark) {
          h->mark = 1;
          rt_stack_push(work, (int64_t)(intptr_t)v);
        }
        break;
      }
      if (sorted[mid] < v) {
        a = mid + 1;
      } else {
        b = mid - 1;
      }
    }
  }
  free(sorted);
}

static void rt_gc_scan_stack(RtBodyStack *work) {
  jmp_buf regs;
  if (g_stack_base == NULL) {
    return;
  }
  /* setjmp spills the callee-saved registers into `regs`, which lives in this
   * frame -- so scanning from `regs` upward covers the registers too. */
  setjmp(regs);
  rt_gc_scan_range((uintptr_t)(void *)&regs, (uintptr_t)g_stack_base, work);
}

void ranger_gc_collect(void) {
  RtPtrSet seen;
  RtBodyStack work;
  char **dead;
  long i, ndead = 0, k;

  if (g_gc_running || g_reg_len == 0) {
    return;
  }
  g_gc_running = 1;

  for (i = 0; i < g_reg_len; i++) {
    RangerObjHeader *h = (RangerObjHeader *)g_reg[i];
    h->scratch = (int32_t)h->rc;
    h->mark = 0;
  }

  rt_set_init(&seen);
  for (i = 0; i < g_reg_len; i++) {
    RangerObjHeader *h = (RangerObjHeader *)g_reg[i];
    rt_walk_edges(RT_BODY_OF(g_reg[i]), h->type, &seen, RT_EDGE_SUB, NULL);
  }
  rt_set_free(&seen);

  work.items = NULL;
  work.len = 0;
  work.cap = 0;
  for (i = 0; i < g_reg_len; i++) {
    RangerObjHeader *h = (RangerObjHeader *)g_reg[i];
    if (h->scratch > 0 && !h->mark) {
      h->mark = 1;
      rt_stack_push(&work, RT_BODY_OF(g_reg[i]));
    }
  }
  rt_gc_scan_stack(&work);

  rt_set_init(&seen);
  while (work.len > 0) {
    int64_t b = work.items[--work.len];
    rt_walk_edges(b, RT_HEADER_OF(b)->type, &seen, RT_EDGE_MARK, &work);
  }
  rt_set_free(&seen);
  free(work.items);

  for (i = 0; i < g_reg_len; i++) {
    if (!((RangerObjHeader *)g_reg[i])->mark) {
      ndead++;
    }
  }
  if (ndead == 0) {
    g_gc_running = 0;
    g_gc_runs++;
    return;
  }
  dead = (char **)malloc((size_t)ndead * sizeof(char *));
  if (dead == NULL) {
    g_gc_running = 0;
    return;
  }
  ndead = 0;
  for (i = 0; i < g_reg_len; i++) {
    if (!((RangerObjHeader *)g_reg[i])->mark) {
      dead[ndead++] = g_reg[i];
    }
  }

  /* Hold every doomed object up while the group's internal references are
   * dropped, so a release inside the cascade cannot free a block this loop is
   * still about to visit. */
  for (k = 0; k < ndead; k++) {
    ((RangerObjHeader *)dead[k])->rc++;
  }
  for (k = 0; k < ndead; k++) {
    RangerObjHeader *h = (RangerObjHeader *)dead[k];
    const RangerTypeDesc *t = h->type;
    int64_t body = RT_BODY_OF(dead[k]);
    /* Clear the type first: if this object is released again during the
     * cascade, its fields must not be destroyed a second time. */
    h->type = NULL;
    ranger_destroy_fields(body, t);
    memset((void *)(intptr_t)body, 0, h->size);
  }
  /* Every incoming reference came from another doomed object and has now been
   * given back, so each count is down to the protective one this pass added. */
  for (k = 0; k < ndead; k++) {
    ranger_obj_release(RT_BODY_OF(dead[k]));
  }
  free(dead);
  g_gc_runs++;
  g_gc_freed += ndead;
  g_gc_running = 0;
}

/* Collect when the heap has grown past the threshold, then set the next
 * threshold from what survived: a program with a genuinely large live set must
 * not pay for a full trace on every allocation past a fixed mark. */
static void ranger_gc_maybe_collect(void) {
  long survivors;
  if (g_gc_enabled == -1) {
    const char *v = getenv("RANGER_GC");
    g_gc_enabled = (v != NULL && v[0] == '0') ? 0 : 1;
    if (getenv("RANGER_GC_THRESHOLD")) {
      long t = atol(getenv("RANGER_GC_THRESHOLD"));
      if (t > 1000) {
        g_gc_threshold = t;
        g_gc_floor = t;
      }
    }
  }
  if (!g_gc_enabled || g_reg_len < g_gc_threshold) {
    return;
  }
  ranger_gc_collect();
  /* Next threshold from what survived, never below the configured floor: a
   * program with a genuinely large live set must not trace on every allocation
   * past a fixed mark, and one with a small live set must not have its floor
   * silently raised past the point where cycles accumulate again. */
  survivors = g_reg_len;
  g_gc_threshold = (survivors * 2 > g_gc_floor) ? survivors * 2 : g_gc_floor;
}

long ranger_gc_collections(void) { return g_gc_runs; }
long ranger_gc_freed(void) { return g_gc_freed; }

/* --- object block pool ---------------------------------------------------
 * Interpreter values are the definition of allocation churn: one size, born
 * and dead within a statement, millions of them. Measured on `s = s + i`, the
 * engine makes 28 heap allocations per loop iteration where QuickJS makes zero.
 * A block released here goes on a free list by size instead of back to libc,
 * so the next value of the same shape costs a pop and a memset.
 *
 * Sizes are bucketed in 8-byte steps up to RT_POOL_MAX_SIZE; anything larger
 * (or any bucket already full) falls through to malloc/free as before. The
 * free-list link lives in the block's own bytes, which are dead while pooled.
 *
 * RANGER_OBJ_POOL=0 disables it, so the pooled and unpooled costs stay
 * measurable against each other. */
#define RT_POOL_MAX_SIZE 1024
#define RT_POOL_BUCKETS ((RT_POOL_MAX_SIZE / 8) + 1)
#define RT_POOL_PER_BUCKET 8192

static char *g_obj_pool[RT_POOL_BUCKETS];
static int32_t g_obj_pool_len[RT_POOL_BUCKETS];
static int g_obj_pool_on = -1;
static long g_pool_hit, g_pool_miss;

static int rt_obj_pool_enabled(void) {
  if (g_obj_pool_on < 0) {
    const char *v = getenv("RANGER_OBJ_POOL");
    g_obj_pool_on = (v != NULL && v[0] == '0') ? 0 : 1;
  }
  return g_obj_pool_on;
}

/* Bucket index for a body size, or -1 when the size is not poolable.
 *
 * A pooled block keeps its free-list link in the BODY (block + header), so a
 * body smaller than a pointer has nowhere to put it. A class with no fields at
 * all -- the compiler's own sources have several -- has size 0, and pooling one
 * wrote eight bytes past the end of the allocation and read them back on the
 * next alloc, which corrupts the malloc arena. Such bodies are never pooled. */
static int rt_pool_bucket(uint32_t size) {
  if (size < (uint32_t)sizeof(char *)) {
    return -1;
  }
  if (size > RT_POOL_MAX_SIZE) {
    return -1;
  }
  return (int)((size + 7u) / 8u);
}

int64_t ranger_obj_new(uint32_t size, const RangerTypeDesc *type) {
  size_t total = (size_t)RANGER_HEADER_SIZE + (size_t)size;
  char *block = NULL;
  int bucket = rt_pool_bucket(size);
  RangerObjHeader *h;
  if (bucket >= 0 && g_obj_pool[bucket] != NULL && rt_obj_pool_enabled()) {
    block = g_obj_pool[bucket];
    g_obj_pool[bucket] = *(char **)(block + RANGER_HEADER_SIZE);
    g_obj_pool_len[bucket]--;
    /* Same state calloc would have handed back: every constructor and every
     * destroy path reads unset fields as zero. */
    memset(block, 0, total);
    g_pool_hit++;
  } else {
    block = (char *)calloc(1, total);
    g_pool_miss++;
  }
  if (block == NULL) {
    return 0;
  }
  h = (RangerObjHeader *)block;
  h->rc = 1;
  h->size = size;
  h->type = type;
  rt_reg_add(block);
  g_live_objects++;
  g_obj_new++;
  ranger_mem_stats_enable();
  if (g_trace_every > 0 && g_obj_new >= g_trace_next) {
    g_trace_next = g_obj_new + g_trace_every;
    ranger_mem_dump_stats();
  }
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
  /* The object is registered and holds its own count, so a collection here
   * sees it as a root; its constructor arguments are still on the C stack,
   * which the scan covers. */
  ranger_gc_maybe_collect();
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
  rt_reg_remove(block);
  {
    int bucket = rt_pool_bucket(h->size);
    if (bucket >= 0 && g_obj_pool_len[bucket] < RT_POOL_PER_BUCKET &&
        rt_obj_pool_enabled()) {
      *(char **)(block + RANGER_HEADER_SIZE) = g_obj_pool[bucket];
      g_obj_pool[bucket] = block;
      g_obj_pool_len[bucket]++;
      g_live_objects--;
      g_obj_free++;
      return;
    }
  }
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

/* `insert xs i v` / `remove xs i` / `array_extract xs i`.
 *
 * The RtPtrArray_* routines are emitted as LLVM IR and only cover new / len /
 * get / set / push, so the three operators that shift elements are written
 * here against the same descriptor layout, the way ranger_str_split builds a
 * result array in C.
 *
 * An out-of-range index is a no-op rather than a wild write: `insert xs 0 v`
 * on an empty array is how the compiler prepends, and the guard has to accept
 * index == len for exactly that. */
void ranger_ptrarray_insert(int64_t desc_addr, int32_t index, int64_t val) {
  RtPtrArrayDesc *d;
  int64_t *data;
  int32_t new_cap;
  int32_t k;
  if (desc_addr == 0) {
    return;
  }
  d = (RtPtrArrayDesc *)(intptr_t)desc_addr;
  if (index < 0 || index > d->len) {
    return;
  }
  if (d->owned == 1 && val != 0) {
    ranger_obj_retain(val);
  }
  if (d->len >= d->cap) {
    new_cap = (d->cap == 0) ? 4 : (d->cap * 2);
    data = (int64_t *)realloc((void *)(intptr_t)d->data,
                              (size_t)new_cap * sizeof(int64_t));
    if (data == NULL) {
      return;
    }
    d->data = (int64_t)(intptr_t)data;
    d->cap = new_cap;
  }
  data = (int64_t *)(intptr_t)d->data;
  for (k = d->len; k > index; k--) {
    data[k] = data[k - 1];
  }
  data[index] = val;
  d->len = d->len + 1;
}

/* Answers the element that was taken out, which is what `array_extract` needs.
 * The reference is HANDED TO THE CALLER: an owned array does not release it
 * here, because `array_extract` is declared @(strong) and the value lives on.
 * `remove` throws the answer away, so an owned element leaks rather than being
 * freed twice -- see TARGET_NOTES.md. */
int64_t ranger_ptrarray_remove(int64_t desc_addr, int32_t index) {
  RtPtrArrayDesc *d;
  int64_t *data;
  int64_t out;
  int32_t k;
  if (desc_addr == 0) {
    return 0;
  }
  d = (RtPtrArrayDesc *)(intptr_t)desc_addr;
  if (index < 0 || index >= d->len) {
    return 0;
  }
  data = (int64_t *)(intptr_t)d->data;
  out = data[index];
  for (k = index; k < (d->len - 1); k++) {
    data[k] = data[k + 1];
  }
  d->len = d->len - 1;
  return out;
}

/* `clear xs` -- drop every element. Owned elements are NOT released here, for
 * the same reason ranger_ptrarray_remove does not: leaking is safer than a
 * double free while the ownership analysis on this backend is young. */
void ranger_ptrarray_clear(int64_t desc_addr) {
  RtPtrArrayDesc *d;
  if (desc_addr == 0) {
    return;
  }
  d = (RtPtrArrayDesc *)(intptr_t)desc_addr;
  d->len = 0;
}
