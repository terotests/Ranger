/*
 * JSON runtime for the Ranger LLVM target (libc-linked).
 *
 * Every @serialize class generates a toDictionary / fromDictionary pair that
 * calls json_object / set / getStr / getValue / keys, so without a JSON
 * implementation the compiler could not be compiled for this target at all --
 * 421 of the 435 remaining errors were in that generated code. This is the
 * same gap the C++ writer had (see TARGET_NOTES.md, "What C++ took").
 *
 * A JSON value is one heap node behind an int64_t handle, which is how every
 * other object travels through this backend. Objects keep their keys in
 * INSERTION ORDER: `keys` feeds a walk that writes the serialized form, and
 * JavaScript -- the reference target -- enumerates in insertion order, so a
 * hash order here would produce a different file for the same input.
 *
 * Ownership is reference counted (RtJson_retain / RtJson_release). A child
 * stored into an object or array is retained by its parent; freeing a parent
 * releases its children.
 */
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define RJ_NULL 0
#define RJ_BOOL 1
#define RJ_INT 2
#define RJ_DOUBLE 3
#define RJ_STR 4
#define RJ_ARR 5
#define RJ_OBJ 6

typedef struct RtJson RtJson;

struct RtJson {
  int32_t kind;
  int32_t rc;
  int64_t ival;   /* RJ_INT / RJ_BOOL */
  double dval;    /* RJ_DOUBLE */
  char *sval;     /* RJ_STR (owned) */
  RtJson **items; /* RJ_ARR / RJ_OBJ values (owned refs) */
  char **keys;    /* RJ_OBJ keys (owned), NULL for arrays */
  int32_t count;
  int32_t cap;
};

char *ranger_strdup(const char *text);
char *ranger_double_to_string(double v);

/* The ptr-array descriptor the emitted RtPtrArray_* IR uses. `keys` answers
 * one, so it is built here the way ranger_str_split builds its result: the
 * runtime routines are emitted IR and cannot be called from C, but the layout
 * is fixed. Element kind 2 = owned strings. */
typedef struct {
  int64_t data;
  int32_t len;
  int32_t cap;
  int32_t owned;
  int32_t rc;
} RtJsonArrDesc;

static void rt_json_desc_push(RtJsonArrDesc *d, char *s) {
  int64_t *data;
  int32_t new_cap;
  if (d->len >= d->cap) {
    new_cap = (d->cap == 0) ? 8 : (d->cap * 2);
    data = (int64_t *)realloc((void *)(intptr_t)d->data,
                              (size_t)new_cap * sizeof(int64_t));
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

/* --- construction ------------------------------------------------------- */

static RtJson *rt_json_new(int kind) {
  RtJson *v = (RtJson *)calloc(1, sizeof(RtJson));
  if (v == NULL) {
    return NULL;
  }
  v->kind = kind;
  v->rc = 1;
  return v;
}

static RtJson *rt_json_of(int64_t handle) { return (RtJson *)(intptr_t)handle; }

static int64_t rt_json_h(RtJson *v) { return (int64_t)(intptr_t)v; }

void RtJson_retain(int64_t handle) {
  RtJson *v = rt_json_of(handle);
  if (v != NULL) {
    v->rc = v->rc + 1;
  }
}

void RtJson_release(int64_t handle) {
  RtJson *v = rt_json_of(handle);
  int32_t i;
  if (v == NULL) {
    return;
  }
  v->rc = v->rc - 1;
  if (v->rc > 0) {
    return;
  }
  for (i = 0; i < v->count; i++) {
    if (v->keys != NULL && v->keys[i] != NULL) {
      free(v->keys[i]);
    }
    RtJson_release(rt_json_h(v->items[i]));
  }
  free(v->items);
  free(v->keys);
  free(v->sval);
  free(v);
}

int64_t RtJson_new_object(void) { return rt_json_h(rt_json_new(RJ_OBJ)); }
int64_t RtJson_new_array(void) { return rt_json_h(rt_json_new(RJ_ARR)); }

int RtJson_kind(int64_t handle) {
  RtJson *v = rt_json_of(handle);
  return (v == NULL) ? RJ_NULL : (int)v->kind;
}

/* `isArray` on a value that is not JSON at all (a NULL handle) is false, not
 * a crash: the serialize code tests before it narrows. */
int RtJson_is_array(int64_t handle) {
  return RtJson_kind(handle) == RJ_ARR ? 1 : 0;
}

int RtJson_is_object(int64_t handle) {
  return RtJson_kind(handle) == RJ_OBJ ? 1 : 0;
}

int RtJson_length(int64_t handle) {
  RtJson *v = rt_json_of(handle);
  return (v == NULL) ? 0 : (int)v->count;
}

static int rt_json_grow(RtJson *v) {
  int32_t new_cap;
  RtJson **items;
  if (v->count < v->cap) {
    return 1;
  }
  new_cap = (v->cap == 0) ? 8 : (v->cap * 2);
  items = (RtJson **)realloc(v->items, (size_t)new_cap * sizeof(RtJson *));
  if (items == NULL) {
    return 0;
  }
  v->items = items;
  if (v->kind == RJ_OBJ) {
    char **keys = (char **)realloc(v->keys, (size_t)new_cap * sizeof(char *));
    if (keys == NULL) {
      return 0;
    }
    v->keys = keys;
  }
  v->cap = new_cap;
  return 1;
}

/* Insertion order with overwrite in place: setting an existing key keeps its
 * position, which is what every other target's map does. */
static void rt_json_put(RtJson *o, const char *key, RtJson *val) {
  int32_t i;
  if (o == NULL || o->kind != RJ_OBJ || key == NULL) {
    RtJson_release(rt_json_h(val));
    return;
  }
  for (i = 0; i < o->count; i++) {
    if (o->keys[i] != NULL && strcmp(o->keys[i], key) == 0) {
      RtJson_release(rt_json_h(o->items[i]));
      o->items[i] = val;
      return;
    }
  }
  if (!rt_json_grow(o)) {
    RtJson_release(rt_json_h(val));
    return;
  }
  o->keys[o->count] = ranger_strdup(key);
  o->items[o->count] = val;
  o->count = o->count + 1;
}

static void rt_json_append(RtJson *a, RtJson *val) {
  if (a == NULL || a->kind != RJ_ARR) {
    RtJson_release(rt_json_h(val));
    return;
  }
  if (!rt_json_grow(a)) {
    RtJson_release(rt_json_h(val));
    return;
  }
  a->items[a->count] = val;
  a->count = a->count + 1;
}

static RtJson *rt_json_str(const char *s) {
  RtJson *v = rt_json_new(RJ_STR);
  if (v != NULL) {
    v->sval = ranger_strdup(s == NULL ? "" : s);
  }
  return v;
}

static RtJson *rt_json_int(int64_t i) {
  RtJson *v = rt_json_new(RJ_INT);
  if (v != NULL) {
    v->ival = i;
  }
  return v;
}

static RtJson *rt_json_double(double d) {
  RtJson *v = rt_json_new(RJ_DOUBLE);
  if (v != NULL) {
    v->dval = d;
  }
  return v;
}

static RtJson *rt_json_bool(int b) {
  RtJson *v = rt_json_new(RJ_BOOL);
  if (v != NULL) {
    v->ival = b ? 1 : 0;
  }
  return v;
}

/* --- setters ------------------------------------------------------------ */

void RtJson_set_str(int64_t o, const char *k, const char *v) {
  rt_json_put(rt_json_of(o), k, rt_json_str(v));
}
void RtJson_set_int(int64_t o, const char *k, int64_t v) {
  rt_json_put(rt_json_of(o), k, rt_json_int(v));
}
void RtJson_set_double(int64_t o, const char *k, double v) {
  rt_json_put(rt_json_of(o), k, rt_json_double(v));
}
void RtJson_set_bool(int64_t o, const char *k, int v) {
  rt_json_put(rt_json_of(o), k, rt_json_bool(v));
}
/* A child handle is RETAINED, not moved: the caller keeps its own reference
 * and releases it on its own schedule. */
void RtJson_set_value(int64_t o, const char *k, int64_t child) {
  RtJson_retain(child);
  rt_json_put(rt_json_of(o), k, rt_json_of(child));
}

void RtJson_push_str(int64_t a, const char *v) {
  rt_json_append(rt_json_of(a), rt_json_str(v));
}
void RtJson_push_int(int64_t a, int64_t v) {
  rt_json_append(rt_json_of(a), rt_json_int(v));
}
void RtJson_push_double(int64_t a, double v) {
  rt_json_append(rt_json_of(a), rt_json_double(v));
}
void RtJson_push_bool(int64_t a, int v) {
  rt_json_append(rt_json_of(a), rt_json_bool(v));
}
void RtJson_push_value(int64_t a, int64_t child) {
  RtJson_retain(child);
  rt_json_append(rt_json_of(a), rt_json_of(child));
}

/* --- getters ------------------------------------------------------------ */

static RtJson *rt_json_find(int64_t o, const char *k) {
  RtJson *v = rt_json_of(o);
  int32_t i;
  if (v == NULL || v->kind != RJ_OBJ || k == NULL) {
    return NULL;
  }
  for (i = 0; i < v->count; i++) {
    if (v->keys[i] != NULL && strcmp(v->keys[i], k) == 0) {
      return v->items[i];
    }
  }
  return NULL;
}

/* A missing key answers the empty string, which is what the C++ and Go
 * polyfills do -- the generated fromDictionary tests the result rather than
 * the presence of the key. The pointer is the node's own buffer and stays
 * valid for the life of the node, so the caller does not free it. */
const char *RtJson_get_str(int64_t o, const char *k) {
  RtJson *v = rt_json_find(o, k);
  if (v == NULL) {
    return "";
  }
  if (v->kind == RJ_STR) {
    return v->sval == NULL ? "" : v->sval;
  }
  return "";
}

int64_t RtJson_get_int(int64_t o, const char *k) {
  RtJson *v = rt_json_find(o, k);
  if (v == NULL) {
    return 0;
  }
  if (v->kind == RJ_INT || v->kind == RJ_BOOL) {
    return v->ival;
  }
  if (v->kind == RJ_DOUBLE) {
    return (int64_t)v->dval;
  }
  return 0;
}

double RtJson_get_double(int64_t o, const char *k) {
  RtJson *v = rt_json_find(o, k);
  if (v == NULL) {
    return 0.0;
  }
  if (v->kind == RJ_DOUBLE) {
    return v->dval;
  }
  if (v->kind == RJ_INT || v->kind == RJ_BOOL) {
    return (double)v->ival;
  }
  return 0.0;
}

/* Absent answers false, matching the `null?` note on the boolean overload in
 * Lang.rgr: false IS the absent value for a JSON boolean. */
int RtJson_get_bool(int64_t o, const char *k) {
  RtJson *v = rt_json_find(o, k);
  if (v == NULL) {
    return 0;
  }
  if (v->kind == RJ_BOOL || v->kind == RJ_INT) {
    return v->ival != 0 ? 1 : 0;
  }
  return 0;
}

/* getObject / getArray are optional: a missing or wrong-shaped key answers
 * NULL, which is the absent value `null?` tests for. The handle is BORROWED
 * from the parent -- the generated code reads it inside the parent's lifetime. */
int64_t RtJson_get_object(int64_t o, const char *k) {
  RtJson *v = rt_json_find(o, k);
  if (v == NULL || v->kind != RJ_OBJ) {
    return 0;
  }
  return rt_json_h(v);
}

int64_t RtJson_get_array(int64_t o, const char *k) {
  RtJson *v = rt_json_find(o, k);
  if (v == NULL || v->kind != RJ_ARR) {
    return 0;
  }
  return rt_json_h(v);
}

/* `getValue arr i` -- the i-th element as a union value, borrowed. */
int64_t RtJson_get_value(int64_t a, int index) {
  RtJson *v = rt_json_of(a);
  if (v == NULL || index < 0 || index >= v->count) {
    return 0;
  }
  return rt_json_h(v->items[index]);
}

/* `keys obj` -> a fresh [string] ptr-array in insertion order. */
int64_t RtJson_keys(int64_t o) {
  RtJsonArrDesc *d = (RtJsonArrDesc *)calloc(1, sizeof(RtJsonArrDesc));
  RtJson *v = rt_json_of(o);
  int32_t i;
  if (d == NULL) {
    return 0;
  }
  d->owned = 2;
  d->rc = 1;
  if (v == NULL || v->kind != RJ_OBJ) {
    return (int64_t)(intptr_t)d;
  }
  for (i = 0; i < v->count; i++) {
    rt_json_desc_push(d, ranger_strdup(v->keys[i] == NULL ? "" : v->keys[i]));
  }
  return (int64_t)(intptr_t)d;
}

/* A union value narrowed to a string / int / double / boolean. `case v
 * s:string { }` lowers to a kind test plus one of these. */
const char *RtJson_value_str(int64_t handle) {
  RtJson *v = rt_json_of(handle);
  if (v == NULL || v->kind != RJ_STR || v->sval == NULL) {
    return "";
  }
  return v->sval;
}

int64_t RtJson_value_int(int64_t handle) {
  RtJson *v = rt_json_of(handle);
  if (v == NULL) {
    return 0;
  }
  if (v->kind == RJ_INT || v->kind == RJ_BOOL) {
    return v->ival;
  }
  if (v->kind == RJ_DOUBLE) {
    return (int64_t)v->dval;
  }
  return 0;
}

double RtJson_value_double(int64_t handle) {
  RtJson *v = rt_json_of(handle);
  if (v == NULL) {
    return 0.0;
  }
  if (v->kind == RJ_DOUBLE) {
    return v->dval;
  }
  if (v->kind == RJ_INT || v->kind == RJ_BOOL) {
    return (double)v->ival;
  }
  return 0.0;
}

int RtJson_value_bool(int64_t handle) {
  RtJson *v = rt_json_of(handle);
  if (v == NULL) {
    return 0;
  }
  return v->ival != 0 ? 1 : 0;
}

/* --- serialize ---------------------------------------------------------- */

typedef struct {
  char *buf;
  size_t len;
  size_t cap;
} RtJsonOut;

static void rt_out_reserve(RtJsonOut *o, size_t extra) {
  size_t want = o->len + extra + 1;
  char *nb;
  if (want <= o->cap) {
    return;
  }
  while (o->cap < want) {
    o->cap = (o->cap == 0) ? 64 : (o->cap * 2);
  }
  nb = (char *)realloc(o->buf, o->cap);
  if (nb == NULL) {
    return;
  }
  o->buf = nb;
}

static void rt_out_puts(RtJsonOut *o, const char *s) {
  size_t n;
  if (s == NULL) {
    return;
  }
  n = strlen(s);
  rt_out_reserve(o, n);
  if (o->buf == NULL) {
    return;
  }
  memcpy(o->buf + o->len, s, n);
  o->len += n;
  o->buf[o->len] = '\0';
}

static void rt_out_putc(RtJsonOut *o, char c) {
  rt_out_reserve(o, 1);
  if (o->buf == NULL) {
    return;
  }
  o->buf[o->len] = c;
  o->len++;
  o->buf[o->len] = '\0';
}

static void rt_out_quoted(RtJsonOut *o, const char *s) {
  const unsigned char *p;
  char esc[8];
  rt_out_putc(o, '"');
  for (p = (const unsigned char *)(s == NULL ? "" : s); *p; p++) {
    unsigned char c = *p;
    if (c == '"' || c == '\\') {
      rt_out_putc(o, '\\');
      rt_out_putc(o, (char)c);
    } else if (c == '\n') {
      rt_out_puts(o, "\\n");
    } else if (c == '\r') {
      rt_out_puts(o, "\\r");
    } else if (c == '\t') {
      rt_out_puts(o, "\\t");
    } else if (c < 32) {
      sprintf(esc, "\\u%04x", (unsigned)c);
      rt_out_puts(o, esc);
    } else {
      rt_out_putc(o, (char)c);
    }
  }
  rt_out_putc(o, '"');
}

static void rt_json_write(RtJson *v, RtJsonOut *o) {
  int32_t i;
  if (v == NULL) {
    rt_out_puts(o, "null");
    return;
  }
  switch (v->kind) {
  case RJ_NULL:
    rt_out_puts(o, "null");
    return;
  case RJ_BOOL:
    rt_out_puts(o, v->ival ? "true" : "false");
    return;
  case RJ_INT: {
    char num[32];
    sprintf(num, "%lld", (long long)v->ival);
    rt_out_puts(o, num);
    return;
  }
  case RJ_DOUBLE: {
    char *num = ranger_double_to_string(v->dval);
    rt_out_puts(o, num);
    free(num);
    return;
  }
  case RJ_STR:
    rt_out_quoted(o, v->sval);
    return;
  case RJ_ARR:
    rt_out_putc(o, '[');
    for (i = 0; i < v->count; i++) {
      if (i > 0) {
        rt_out_putc(o, ',');
      }
      rt_json_write(v->items[i], o);
    }
    rt_out_putc(o, ']');
    return;
  case RJ_OBJ:
    rt_out_putc(o, '{');
    for (i = 0; i < v->count; i++) {
      if (i > 0) {
        rt_out_putc(o, ',');
      }
      rt_out_quoted(o, v->keys[i]);
      rt_out_putc(o, ':');
      rt_json_write(v->items[i], o);
    }
    rt_out_putc(o, '}');
    return;
  default:
    rt_out_puts(o, "null");
    return;
  }
}

char *RtJson_stringify(int64_t handle) {
  RtJsonOut o;
  o.buf = NULL;
  o.len = 0;
  o.cap = 0;
  rt_json_write(rt_json_of(handle), &o);
  if (o.buf == NULL) {
    return ranger_strdup("");
  }
  return o.buf;
}

/* --- parse -------------------------------------------------------------- */

typedef struct {
  const char *s;
  size_t i;
  size_t n;
  int failed;
} RtJsonIn;

static RtJson *rt_json_parse_value(RtJsonIn *in);

static void rt_skip_ws(RtJsonIn *in) {
  while (in->i < in->n) {
    char c = in->s[in->i];
    if (c == ' ' || c == '\t' || c == '\n' || c == '\r') {
      in->i++;
    } else {
      break;
    }
  }
}

static void rt_utf8_put(RtJsonOut *o, unsigned cp) {
  if (cp < 0x80) {
    rt_out_putc(o, (char)cp);
  } else if (cp < 0x800) {
    rt_out_putc(o, (char)(0xC0 | (cp >> 6)));
    rt_out_putc(o, (char)(0x80 | (cp & 0x3F)));
  } else if (cp < 0x10000) {
    rt_out_putc(o, (char)(0xE0 | (cp >> 12)));
    rt_out_putc(o, (char)(0x80 | ((cp >> 6) & 0x3F)));
    rt_out_putc(o, (char)(0x80 | (cp & 0x3F)));
  } else {
    rt_out_putc(o, (char)(0xF0 | (cp >> 18)));
    rt_out_putc(o, (char)(0x80 | ((cp >> 12) & 0x3F)));
    rt_out_putc(o, (char)(0x80 | ((cp >> 6) & 0x3F)));
    rt_out_putc(o, (char)(0x80 | (cp & 0x3F)));
  }
}

static unsigned rt_hex4(RtJsonIn *in) {
  unsigned v = 0;
  int k;
  for (k = 0; k < 4 && in->i < in->n; k++) {
    char c = in->s[in->i++];
    v <<= 4;
    if (c >= '0' && c <= '9') {
      v |= (unsigned)(c - '0');
    } else if (c >= 'a' && c <= 'f') {
      v |= (unsigned)(c - 'a' + 10);
    } else if (c >= 'A' && c <= 'F') {
      v |= (unsigned)(c - 'A' + 10);
    } else {
      in->failed = 1;
      return 0;
    }
  }
  return v;
}

/* Answers a malloc'd string, or NULL on a malformed literal. */
static char *rt_json_parse_string(RtJsonIn *in) {
  RtJsonOut o;
  o.buf = NULL;
  o.len = 0;
  o.cap = 0;
  if (in->i >= in->n || in->s[in->i] != '"') {
    in->failed = 1;
    return NULL;
  }
  in->i++;
  while (in->i < in->n) {
    char c = in->s[in->i++];
    if (c == '"') {
      if (o.buf == NULL) {
        return ranger_strdup("");
      }
      return o.buf;
    }
    if (c != '\\') {
      rt_out_putc(&o, c);
      continue;
    }
    if (in->i >= in->n) {
      break;
    }
    c = in->s[in->i++];
    switch (c) {
    case 'n': rt_out_putc(&o, '\n'); break;
    case 't': rt_out_putc(&o, '\t'); break;
    case 'r': rt_out_putc(&o, '\r'); break;
    case 'b': rt_out_putc(&o, '\b'); break;
    case 'f': rt_out_putc(&o, '\f'); break;
    case '/': rt_out_putc(&o, '/'); break;
    case '"': rt_out_putc(&o, '"'); break;
    case '\\': rt_out_putc(&o, '\\'); break;
    case 'u': {
      unsigned cp = rt_hex4(in);
      /* a surrogate pair is one code point */
      if (cp >= 0xD800 && cp <= 0xDBFF && in->i + 1 < in->n &&
          in->s[in->i] == '\\' && in->s[in->i + 1] == 'u') {
        unsigned lo;
        in->i += 2;
        lo = rt_hex4(in);
        if (lo >= 0xDC00 && lo <= 0xDFFF) {
          cp = 0x10000 + ((cp - 0xD800) << 10) + (lo - 0xDC00);
        }
      }
      rt_utf8_put(&o, cp);
      break;
    }
    default:
      rt_out_putc(&o, c);
      break;
    }
  }
  in->failed = 1;
  free(o.buf);
  return NULL;
}

static RtJson *rt_json_parse_number(RtJsonIn *in) {
  size_t start = in->i;
  int isDouble = 0;
  char *text;
  RtJson *v;
  size_t n;
  if (in->i < in->n && (in->s[in->i] == '-' || in->s[in->i] == '+')) {
    in->i++;
  }
  while (in->i < in->n) {
    char c = in->s[in->i];
    if (c >= '0' && c <= '9') {
      in->i++;
    } else if (c == '.' || c == 'e' || c == 'E' || c == '+' || c == '-') {
      isDouble = 1;
      in->i++;
    } else {
      break;
    }
  }
  n = in->i - start;
  if (n == 0) {
    in->failed = 1;
    return NULL;
  }
  text = (char *)malloc(n + 1);
  if (text == NULL) {
    in->failed = 1;
    return NULL;
  }
  memcpy(text, in->s + start, n);
  text[n] = '\0';
  if (isDouble) {
    v = rt_json_double(atof(text));
  } else {
    v = rt_json_int(strtoll(text, NULL, 10));
  }
  free(text);
  return v;
}

static RtJson *rt_json_parse_value(RtJsonIn *in) {
  rt_skip_ws(in);
  if (in->i >= in->n) {
    in->failed = 1;
    return NULL;
  }
  {
    char c = in->s[in->i];
    if (c == '{') {
      RtJson *o = rt_json_new(RJ_OBJ);
      in->i++;
      rt_skip_ws(in);
      if (in->i < in->n && in->s[in->i] == '}') {
        in->i++;
        return o;
      }
      for (;;) {
        char *key;
        RtJson *val;
        rt_skip_ws(in);
        key = rt_json_parse_string(in);
        if (in->failed) {
          free(key);
          RtJson_release(rt_json_h(o));
          return NULL;
        }
        rt_skip_ws(in);
        if (in->i >= in->n || in->s[in->i] != ':') {
          in->failed = 1;
          free(key);
          RtJson_release(rt_json_h(o));
          return NULL;
        }
        in->i++;
        val = rt_json_parse_value(in);
        if (in->failed) {
          free(key);
          RtJson_release(rt_json_h(o));
          return NULL;
        }
        rt_json_put(o, key, val);
        free(key);
        rt_skip_ws(in);
        if (in->i < in->n && in->s[in->i] == ',') {
          in->i++;
          continue;
        }
        if (in->i < in->n && in->s[in->i] == '}') {
          in->i++;
          return o;
        }
        in->failed = 1;
        RtJson_release(rt_json_h(o));
        return NULL;
      }
    }
    if (c == '[') {
      RtJson *a = rt_json_new(RJ_ARR);
      in->i++;
      rt_skip_ws(in);
      if (in->i < in->n && in->s[in->i] == ']') {
        in->i++;
        return a;
      }
      for (;;) {
        RtJson *val = rt_json_parse_value(in);
        if (in->failed) {
          RtJson_release(rt_json_h(a));
          return NULL;
        }
        rt_json_append(a, val);
        rt_skip_ws(in);
        if (in->i < in->n && in->s[in->i] == ',') {
          in->i++;
          continue;
        }
        if (in->i < in->n && in->s[in->i] == ']') {
          in->i++;
          return a;
        }
        in->failed = 1;
        RtJson_release(rt_json_h(a));
        return NULL;
      }
    }
    if (c == '"') {
      char *s = rt_json_parse_string(in);
      RtJson *v;
      if (in->failed) {
        free(s);
        return NULL;
      }
      v = rt_json_str(s);
      free(s);
      return v;
    }
    if (in->n - in->i >= 4 && memcmp(in->s + in->i, "true", 4) == 0) {
      in->i += 4;
      return rt_json_bool(1);
    }
    if (in->n - in->i >= 5 && memcmp(in->s + in->i, "false", 5) == 0) {
      in->i += 5;
      return rt_json_bool(0);
    }
    if (in->n - in->i >= 4 && memcmp(in->s + in->i, "null", 4) == 0) {
      in->i += 4;
      return rt_json_new(RJ_NULL);
    }
    return rt_json_parse_number(in);
  }
}

/* `from_string` is declared @throws. There is no exception machinery on this
 * backend, so malformed input answers an EMPTY OBJECT rather than a wild
 * pointer -- the callers all test the result before reading it. */
int64_t RtJson_parse(const char *text) {
  RtJsonIn in;
  RtJson *v;
  in.s = (text == NULL) ? "" : text;
  in.i = 0;
  in.n = strlen(in.s);
  in.failed = 0;
  v = rt_json_parse_value(&in);
  if (in.failed || v == NULL) {
    return RtJson_new_object();
  }
  return rt_json_h(v);
}
