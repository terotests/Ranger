#include <fcntl.h>
#include <stdio.h>
#include <string.h>
#include <termios.h>
#include <unistd.h>

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
