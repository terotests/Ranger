/* RtIMap: integer-keyed map with 64-bit owned values (runtime/ranger_rt.c).
 *
 * `[int:EvalValue]` needs both -- the generated RtMap_* runtime stores 4-byte
 * slots and cannot hold an object reference, and a slot holding one has to be
 * retained or the map would outlive what it points at. This checks the dense
 * numeric range an interpreter frame uses, the tombstone a removal leaves in a
 * probe chain, growth across several resizes, and the ownership rules.
 *
 * Built and run by tests/compiler-llvm.test.ts.
 */
#include <stdint.h>
#include <stdio.h>
#include <string.h>
extern int64_t RtIMap_new_kind(int);
extern void RtIMap_set(int64_t, int64_t, int64_t);
extern int64_t RtIMap_get(int64_t, int64_t);
extern int RtIMap_has(int64_t, int64_t);
extern void RtIMap_remove(int64_t, int64_t);
extern int RtIMap_size(int64_t);
extern void RtIMap_free(int64_t);
extern int64_t ranger_obj_new(uint32_t, const void *);
extern int ranger_mem_live_objects(void);
extern int ranger_obj_refcount(int64_t);

static int fails = 0;
static void ck(const char *what, long got, long want) {
  if (got != want) { printf("  FAIL %-34s got=%ld want=%ld\n", what, got, want); fails++; }
}

int main(void) {
  int64_t m = RtIMap_new_kind(0);
  int i;
  /* dense range, the intended use */
  for (i = 1340; i < 1420; i++) RtIMap_set(m, i, i * 10);
  ck("size after 80 dense keys", RtIMap_size(m), 80);
  ck("get 1340", RtIMap_get(m, 1340), 13400);
  ck("get 1419", RtIMap_get(m, 1419), 14190);
  ck("has absent", RtIMap_has(m, 1500), 0);
  ck("get absent reads 0", RtIMap_get(m, 1500), 0);
  /* overwrite */
  RtIMap_set(m, 1350, 999);
  ck("overwrite keeps size", RtIMap_size(m), 80);
  ck("overwrite value", RtIMap_get(m, 1350), 999);
  /* removal leaves a tombstone the probe chain must cross */
  RtIMap_remove(m, 1350);
  ck("size after remove", RtIMap_size(m), 79);
  ck("removed reads 0", RtIMap_get(m, 1350), 0);
  ck("neighbour survives remove", RtIMap_get(m, 1351), 13510);
  /* growth: force several resizes */
  for (i = 0; i < 5000; i++) RtIMap_set(m, i * 7, i);
  {
    /* The two key sets overlap: multiples of 7 inside the dense range are
     * already present. Counted rather than hard-coded, so the assertion says
     * what it means. */
    int overlap = 0;
    int k;
    for (k = 1340; k < 1420; k++) {
      if (k != 1350 && (k % 7) == 0) overlap++;
    }
    ck("size after growth", RtIMap_size(m), 79 + 5000 - overlap);
  }
  ck("value survives resize", RtIMap_get(m, 4999 * 7), 4999);
  RtIMap_free(m);

  /* ownership: an object map must retain on put and release on free */
  {
    int64_t om = RtIMap_new_kind(1);
    int64_t a = ranger_obj_new(8, NULL);
    int base = ranger_mem_live_objects();
    ck("fresh object rc", ranger_obj_refcount(a), 1);
    RtIMap_set(om, 5, a);
    ck("rc after put", ranger_obj_refcount(a), 2);
    RtIMap_set(om, 5, a);
    ck("rc after put over itself", ranger_obj_refcount(a), 2);
    RtIMap_remove(om, 5);
    ck("rc after remove", ranger_obj_refcount(a), 1);
    RtIMap_set(om, 6, a);
    RtIMap_free(om);
    ck("rc after map freed", ranger_obj_refcount(a), 1);
    ck("no objects leaked", ranger_mem_live_objects(), base);
  }
  printf(fails ? "  %d FAILURES\n" : "  all RtIMap checks passed\n", fails);
  return fails ? 1 : 0;
}
