/*
 * Shared C runtime for Ranger LLVM native targets (libc-linked).
 * Terminal I/O, CLI args, and small file/string helpers.
 */
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
