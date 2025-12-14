#include  <memory>
#include  "variant.hpp"
#include  <vector>
#include  <string>
#include  <iostream>
#include  <chrono>
#include  <thread>
#include  <mutex>
#include  <queue>

// define classes here to avoid compiler errors
class Alien;
class Bullet;
class Invaders;

typedef mpark::variant<std::shared_ptr<Alien>, std::shared_ptr<Bullet>, std::shared_ptr<Invaders>, int, std::string, bool, double>  r_union_Any;

#include <string>
#include <queue>
#include <mutex>

std::queue<std::string> r_key_queue;
std::mutex r_key_mutex;

#ifdef _WIN32
#include <conio.h>
void r_setup_raw_mode() {}
std::string r_read_key() {
    if (!_kbhit()) {
        std::this_thread::sleep_for(std::chrono::milliseconds(10));
        return "";
    }
    int ch = _getch();
    if (ch == 3) { std::cout << "\x1b[?25h"; exit(0); }
    if (ch == 224 || ch == 0) {
        int ch2 = _getch();
        switch (ch2) {
            case 72: return "up";
            case 80: return "down";
            case 75: return "left";
            case 77: return "right";
        }
        return "";
    }
    switch (ch) {
        case 8: return "backspace";
        case 9: return "tab";
        case 13: return "enter";
        case 27: return "escape";
        case 32: return "space";
    }
    return std::string(1, (char)ch);
}
#else
#include <termios.h>
#include <unistd.h>
void r_setup_raw_mode() {
    system("stty cbreak min 1 -echo");
}
std::string r_read_key() {
    char buf[3];
    if (read(STDIN_FILENO, buf, 1) <= 0) return "";
    if (buf[0] == 3) { std::cout << "\x1b[?25h"; exit(0); }
    if (buf[0] == 27) {
        read(STDIN_FILENO, buf+1, 2);
        if (buf[1] == 91) {
            switch (buf[2]) {
                case 65: return "up";
                case 66: return "down";
                case 67: return "right";
                case 68: return "left";
            }
        }
        return "escape";
    }
    switch (buf[0]) {
        case 8: case 127: return "backspace";
        case 9: return "tab";
        case 10: case 13: return "enter";
        case 32: return "space";
    }
    return std::string(1, buf[0]);
}
#endif


// header definitions
class Alien : public std::enable_shared_from_this<Alien>  { 
  public :
    int x;
    int y;
    int prevX;
    int prevY;
    bool alive;
    bool wasAlive;
    /* class constructor */ 
    Alien( int startX , int startY  );
    /* instance methods */ 
    void savePrev();
};
class Bullet : public std::enable_shared_from_this<Bullet>  { 
  public :
    int x;
    int y;
    int prevX;
    int prevY;
    bool active;
    bool wasActive;
    /* class constructor */ 
    Bullet( int startX , int startY  );
    /* instance methods */ 
    void savePrev();
};
class Invaders : public std::enable_shared_from_this<Invaders>  { 
  public :
    int WIDTH;
    int HEIGHT;
    int PLAYER_Y;
    int playerX;
    int drawnPlayerX;
    std::vector<std::shared_ptr<Alien>> aliens;
    std::vector<std::shared_ptr<Bullet>> bullets;
    int score;
    int prevScore;
    bool gameOver;
    bool gameWon;
    int alienDirection;
    int frameCount;
    int alienMoveDelay;
    bool firstRender;
    /* class constructor */ 
    Invaders( );
    /* static methods */ 
    static void m();
    /* instance methods */ 
    void initAliens();
    void drawAt( int x , int y , std::string ch );
    void eraseAt( int x , int y );
    void drawBorders();
    void render();
    void savePrevState();
    void shoot();
    void moveLeft();
    void moveRight();
    void updateBullets();
    int countAlive();
    void updateAliens();
    void checkCollisions();
    void checkWin();
    void update();
    void endGame();
    void gameLoop();
    void handleKey( std::string key );
};

int __g_argc;
char **__g_argv;
Alien::Alien( int startX , int startY  ) {
  this->x = 0;
  this->y = 0;
  this->prevX = 0;
  this->prevY = 0;
  this->alive = true;
  this->wasAlive = true;
  x = startX;
  y = startY;
  prevX = startX;
  prevY = startY;
}
void  Alien::savePrev() {
  prevX = x;
  prevY = y;
  wasAlive = alive;
}
Bullet::Bullet( int startX , int startY  ) {
  this->x = 0;
  this->y = 0;
  this->prevX = 0;
  this->prevY = 0;
  this->active = true;
  this->wasActive = true;
  x = startX;
  y = startY;
  prevX = startX;
  prevY = startY;
}
void  Bullet::savePrev() {
  prevX = x;
  prevY = y;
  wasActive = active;
}
Invaders::Invaders( ) {
  this->WIDTH = 40;
  this->HEIGHT = 18;
  this->PLAYER_Y = 16;
  this->playerX = 20;
  this->drawnPlayerX = -1;
  this->score = 0;
  this->prevScore = 0;
  this->gameOver = false;
  this->gameWon = false;
  this->alienDirection = 1;
  this->frameCount = 0;
  this->alienMoveDelay = 8;
  this->firstRender = true;
  this->initAliens();
}
void  Invaders::initAliens() {
  int row = 0;
  while (row < 3) {
    int col = 0;
    while (col < 8) {
      int ax = (col * 4) + 4;
      int ay = row + 2;
      std::shared_ptr<Alien> alien =  std::make_shared<Alien>(ax, ay);
      aliens.push_back( alien  );
      col = col + 1;
    }
    row = row + 1;
  }
}
void  Invaders::drawAt( int x , int y , std::string ch ) {
  std::cout << "\x1b[" << y + 1 << ";" << x + 1 << "H" << std::flush;
  std::cout << ch << std::flush;
}
void  Invaders::eraseAt( int x , int y ) {
  std::cout << "\x1b[" << y + 1 << ";" << x + 1 << "H" << std::flush;
  std::cout << std::string(" ") << std::flush;
}
void  Invaders::drawBorders() {
  std::cout << "\x1b[" << 1 << ";" << 1 << "H" << std::flush;
  int i = 0;
  int borderW = WIDTH + 2;
  while (i < borderW) {
    std::cout << std::string("=") << std::flush;
    i = i + 1;
  }
  int y = 0;
  while (y < HEIGHT) {
    std::cout << "\x1b[" << y + 2 << ";" << 1 << "H" << std::flush;
    std::cout << std::string("|") << std::flush;
    int rightX = WIDTH + 2;
    std::cout << "\x1b[" << y + 2 << ";" << rightX << "H" << std::flush;
    std::cout << std::string("|") << std::flush;
    y = y + 1;
  }
  int bottomY = HEIGHT + 2;
  std::cout << "\x1b[" << bottomY << ";" << 1 << "H" << std::flush;
  int j = 0;
  while (j < borderW) {
    std::cout << std::string("=") << std::flush;
    j = j + 1;
  }
  int scoreY = HEIGHT + 3;
  std::cout << "\x1b[" << scoreY << ";" << 1 << "H" << std::flush;
  std::cout << std::string("Score:       |  Arrows=move  SPACE=shoot  Q=quit") << std::flush;
}
void  Invaders::render() {
  if ( firstRender ) {
    std::cout << "\x1b[2J\x1b[H" << std::flush;
    this->drawBorders();
    firstRender = false;
  }
  if ( drawnPlayerX >= 0 ) {
    if ( drawnPlayerX != playerX ) {
      this->eraseAt(drawnPlayerX, PLAYER_Y);
    }
  }
  this->drawAt(playerX, PLAYER_Y, std::string("A"));
  drawnPlayerX = playerX;
  for ( int idx = 0; idx != (int)(aliens.size()); idx++) {
    std::shared_ptr<Alien> alien = aliens.at(idx);
    if ( alien->wasAlive ) {
      bool moved = false;
      if ( alien->prevX != alien->x ) {
        moved = true;
      }
      if ( alien->prevY != alien->y ) {
        moved = true;
      }
      if ( moved ) {
        int oldAx = alien->prevX + 1;
        this->eraseAt(oldAx, alien->prevY);
      }
      if ( alien->alive == false ) {
        int killAx = alien->x + 1;
        this->eraseAt(killAx, alien->y);
      }
    }
    if ( alien->alive ) {
      int drawX = alien->x + 1;
      this->drawAt(drawX, alien->y, std::string("W"));
    }
  }
  for ( int idx2 = 0; idx2 != (int)(bullets.size()); idx2++) {
    std::shared_ptr<Bullet> bullet = bullets.at(idx2);
    if ( bullet->wasActive ) {
      int oldBx = bullet->prevX + 1;
      this->eraseAt(oldBx, bullet->prevY);
    }
    if ( bullet->active ) {
      int bx = bullet->x + 1;
      this->drawAt(bx, bullet->y, std::string("|"));
    }
  }
  if ( score != prevScore ) {
    int scoreY = HEIGHT + 3;
    std::cout << "\x1b[" << scoreY << ";" << 8 << "H" << std::flush;
    std::string scoreStr = std::to_string(score) + std::string("   ");
    std::cout << scoreStr << std::flush;
  }
  int endY = HEIGHT + 4;
  std::cout << "\x1b[" << endY << ";" << 1 << "H" << std::flush;
}
void  Invaders::savePrevState() {
  prevScore = score;
  for ( int idx = 0; idx != (int)(aliens.size()); idx++) {
    std::shared_ptr<Alien> alien = aliens.at(idx);
    alien->savePrev();
  }
  for ( int idx2 = 0; idx2 != (int)(bullets.size()); idx2++) {
    std::shared_ptr<Bullet> bullet = bullets.at(idx2);
    bullet->savePrev();
  }
}
void  Invaders::shoot() {
  int bulletY = PLAYER_Y - 1;
  std::shared_ptr<Bullet> bullet =  std::make_shared<Bullet>(playerX, bulletY);
  bullets.push_back( bullet  );
}
void  Invaders::moveLeft() {
  if ( playerX > 2 ) {
    playerX = playerX - 1;
  }
}
void  Invaders::moveRight() {
  int maxX = WIDTH - 1;
  if ( playerX < maxX ) {
    playerX = playerX + 1;
  }
}
void  Invaders::updateBullets() {
  for ( int idx = 0; idx != (int)(bullets.size()); idx++) {
    std::shared_ptr<Bullet> bullet = bullets.at(idx);
    if ( bullet->active ) {
      bullet->y = bullet->y - 1;
      if ( bullet->y < 1 ) {
        bullet->active = false;
      }
    }
  }
}
int  Invaders::countAlive() {
  int count = 0;
  for ( int idx = 0; idx != (int)(aliens.size()); idx++) {
    std::shared_ptr<Alien> a = aliens.at(idx);
    if ( a->alive ) {
      count = count + 1;
    }
  }
  return count;
}
void  Invaders::updateAliens() {
  int moveFrame = frameCount % alienMoveDelay;
  if ( moveFrame != 0 ) {
    return;
  }
  bool shouldMoveDown = false;
  int minX = 999;
  int maxX = 0;
  for ( int idx = 0; idx != (int)(aliens.size()); idx++) {
    std::shared_ptr<Alien> alien = aliens.at(idx);
    if ( alien->alive ) {
      if ( alien->x < minX ) {
        minX = alien->x;
      }
      if ( alien->x > maxX ) {
        maxX = alien->x;
      }
    }
  }
  int rightBound = WIDTH - 2;
  if ( alienDirection > 0 ) {
    if ( maxX >= rightBound ) {
      alienDirection = -1;
      shouldMoveDown = true;
    }
  } else {
    if ( minX <= 1 ) {
      alienDirection = 1;
      shouldMoveDown = true;
    }
  }
  for ( int idx2 = 0; idx2 != (int)(aliens.size()); idx2++) {
    std::shared_ptr<Alien> alien_1 = aliens.at(idx2);
    if ( alien_1->alive ) {
      alien_1->x = alien_1->x + alienDirection;
      if ( shouldMoveDown ) {
        alien_1->y = alien_1->y + 1;
        if ( alien_1->y >= PLAYER_Y ) {
          gameOver = true;
        }
      }
    }
  }
  int aliveCount = this->countAlive();
  if ( aliveCount < 12 ) {
    alienMoveDelay = 5;
  }
  if ( aliveCount < 6 ) {
    alienMoveDelay = 3;
  }
  if ( aliveCount < 3 ) {
    alienMoveDelay = 1;
  }
}
void  Invaders::checkCollisions() {
  for ( int bidx = 0; bidx != (int)(bullets.size()); bidx++) {
    std::shared_ptr<Bullet> bullet = bullets.at(bidx);
    if ( bullet->active ) {
      for ( int aidx = 0; aidx != (int)(aliens.size()); aidx++) {
        std::shared_ptr<Alien> alien = aliens.at(aidx);
        if ( alien->alive ) {
          if ( bullet->x == alien->x ) {
            if ( bullet->y == alien->y ) {
              bullet->active = false;
              alien->alive = false;
              score = score + 10;
            }
          }
        }
      }
    }
  }
}
void  Invaders::checkWin() {
  int aliveCount = this->countAlive();
  if ( aliveCount == 0 ) {
    gameWon = true;
    gameOver = true;
  }
}
void  Invaders::update() {
  frameCount = frameCount + 1;
  this->updateBullets();
  this->updateAliens();
  this->checkCollisions();
  this->checkWin();
}
void  Invaders::endGame() {
  std::cout << "\x1b[2J\x1b[H" << std::flush;
  std::cout << "\x1b[" << 1 << ";" << 1 << "H" << std::flush;
  if ( gameWon ) {
    std::cout << std::string("=== YOU WIN! ===") << std::endl;
  } else {
    std::cout << std::string("=== GAME OVER ===") << std::endl;
  }
  std::string finalMsg = std::string("Final Score: ") + std::to_string(score);
  std::cout << finalMsg << std::endl;
  std::cout << "\x1b[?25h" << std::flush;
}
void  Invaders::gameLoop() {
  while (gameOver == false) {
    this->savePrevState();
    this->update();
    this->render();
    std::string key = [&]() -> std::string { std::lock_guard<std::mutex> lock(r_key_mutex); if (r_key_queue.empty()) return ""; std::string k = r_key_queue.front(); r_key_queue.pop(); return k; }();
    if ( key != std::string("") ) {
      this->handleKey(key);
    }
    std::this_thread::sleep_for(std::chrono::milliseconds(50));
  }
  this->endGame();
}
void  Invaders::handleKey( std::string key ) {
  if ( key == std::string("left") ) {
    this->moveLeft();
  }
  if ( key == std::string("right") ) {
    this->moveRight();
  }
  if ( key == std::string("a") ) {
    this->moveLeft();
  }
  if ( key == std::string("A") ) {
    this->moveLeft();
  }
  if ( key == std::string("d") ) {
    this->moveRight();
  }
  if ( key == std::string("D") ) {
    this->moveRight();
  }
  if ( key == std::string(" ") ) {
    this->shoot();
  }
  if ( key == std::string("space") ) {
    this->shoot();
  }
  if ( key == std::string("q") ) {
    gameOver = true;
  }
  if ( key == std::string("Q") ) {
    gameOver = true;
  }
}
int main(int argc, char* argv[]) {
  __g_argc = argc;
  __g_argv = argv;
  std::shared_ptr<Invaders> game =  std::make_shared<Invaders>();
  std::cout << std::string("=== SPACE INVADERS ===") << std::endl;
  std::cout << std::string("") << std::endl;
  std::cout << std::string("Controls:") << std::endl;
  std::cout << std::string("  LEFT/RIGHT - Move") << std::endl;
  std::cout << std::string("  SPACE      - Shoot") << std::endl;
  std::cout << std::string("  Q          - Quit") << std::endl;
  std::cout << std::string("") << std::endl;
  std::cout << std::string("Starting game...") << std::endl;
  std::string key = std::string("");
  std::thread([&]() {
    r_setup_raw_mode();
    while (true) {
      std::string k = r_read_key();
      if (!k.empty()) {
        key = k;
        {
          std::lock_guard<std::mutex> lock(r_key_mutex);
          r_key_queue.push(k);
        }
        game->handleKey(key);
      }
    }
  }).detach();
  std::cout << "\x1b[?25l" << std::flush;
  game->gameLoop();
  return 0;
}
