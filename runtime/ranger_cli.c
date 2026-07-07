#include <stdio.h>
#include <stdlib.h>
#include <string.h>

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
