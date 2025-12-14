import time
import threading
import sys

r_key_queue = []
r_key_lock = threading.Lock()

# -*- coding: utf-8 -*-

class Alien:
  def __init__(self, startX, startY):
    self.x = 0
    self.y = 0
    self.prevX = 0
    self.prevY = 0
    self.alive = True
    self.wasAlive = True
    self.x = startX;
    self.y = startY;
    self.prevX = startX;
    self.prevY = startY;
  def savePrev(self):
    self.prevX = self.x;
    self.prevY = self.y;
    self.wasAlive = self.alive;
class Bullet:
  def __init__(self, startX, startY):
    self.x = 0
    self.y = 0
    self.prevX = 0
    self.prevY = 0
    self.active = True
    self.wasActive = True
    self.x = startX;
    self.y = startY;
    self.prevX = startX;
    self.prevY = startY;
  def savePrev(self):
    self.prevX = self.x;
    self.prevY = self.y;
    self.wasActive = self.active;
class Invaders:
  def __init__(self):
    self.WIDTH = 40
    self.HEIGHT = 18
    self.PLAYER_Y = 16
    self.playerX = 20
    self.drawnPlayerX = -1
    self.aliens = []
    self.bullets = []
    self.score = 0
    self.prevScore = 0
    self.gameOver = False
    self.gameWon = False
    self.alienDirection = 1
    self.frameCount = 0
    self.alienMoveDelay = 8
    self.firstRender = True
    self.initAliens()
  def initAliens(self):
    row = 0
    while row < 3:
      col = 0
      while col < 8:
        ax = (col * 4) + 4
        ay = row + 2
        alien = Alien(ax, ay)
        self.aliens.append(alien)
        col = col + 1;
      row = row + 1;
  def drawAt(self, x, y, ch):
    print(f"\x1b[{y + 1};{x + 1}H", end='')
    print(ch, end='')
  def eraseAt(self, x, y):
    print(f"\x1b[{y + 1};{x + 1}H", end='')
    print(" ", end='')
  def drawBorders(self):
    print(f"\x1b[{1};{1}H", end='')
    i = 0
    borderW = self.WIDTH + 2
    while i < borderW:
      print("=", end='')
      i = i + 1;
    y = 0
    while y < self.HEIGHT:
      print(f"\x1b[{y + 2};{1}H", end='')
      print("|", end='')
      rightX = self.WIDTH + 2
      print(f"\x1b[{y + 2};{rightX}H", end='')
      print("|", end='')
      y = y + 1;
    bottomY = self.HEIGHT + 2
    print(f"\x1b[{bottomY};{1}H", end='')
    j = 0
    while j < borderW:
      print("=", end='')
      j = j + 1;
    scoreY = self.HEIGHT + 3
    print(f"\x1b[{scoreY};{1}H", end='')
    print("Score:       |  Arrows=move  SPACE=shoot  Q=quit", end='')
  def render(self):
    if self.firstRender:
      print("\x1b[2J\x1b[H", end='')
      self.drawBorders()
      self.firstRender = False;
    if self.drawnPlayerX >= 0:
      if self.drawnPlayerX != self.playerX:
        self.eraseAt(self.drawnPlayerX, self.PLAYER_Y)
    self.drawAt(self.playerX, self.PLAYER_Y, "A")
    self.drawnPlayerX = self.playerX;
    for idx, alien in enumerate(self.aliens):
      if alien.wasAlive:
        moved = False
        if alien.prevX != alien.x:
          moved = True;
        if alien.prevY != alien.y:
          moved = True;
        if moved:
          oldAx = alien.prevX + 1
          self.eraseAt(oldAx, alien.prevY)
        if alien.alive == False:
          killAx = alien.x + 1
          self.eraseAt(killAx, alien.y)
      if alien.alive:
        drawX = alien.x + 1
        self.drawAt(drawX, alien.y, "W")
    for idx2, bullet in enumerate(self.bullets):
      if bullet.wasActive:
        oldBx = bullet.prevX + 1
        self.eraseAt(oldBx, bullet.prevY)
      if bullet.active:
        bx = bullet.x + 1
        self.drawAt(bx, bullet.y, "|")
    if self.score != self.prevScore:
      scoreY = self.HEIGHT + 3
      print(f"\x1b[{scoreY};{8}H", end='')
      scoreStr = str(self.score) + "   "
      print(scoreStr, end='')
    endY = self.HEIGHT + 4
    print(f"\x1b[{endY};{1}H", end='')
  def savePrevState(self):
    self.prevScore = self.score;
    for idx, alien in enumerate(self.aliens):
      alien.savePrev()
    for idx2, bullet in enumerate(self.bullets):
      bullet.savePrev()
  def shoot(self):
    bulletY = self.PLAYER_Y - 1
    bullet = Bullet(self.playerX, bulletY)
    self.bullets.append(bullet)
  def moveLeft(self):
    if self.playerX > 2:
      self.playerX = self.playerX - 1;
  def moveRight(self):
    maxX = self.WIDTH - 1
    if self.playerX < maxX:
      self.playerX = self.playerX + 1;
  def updateBullets(self):
    for idx, bullet in enumerate(self.bullets):
      if bullet.active:
        bullet.y = bullet.y - 1;
        if bullet.y < 1:
          bullet.active = False;
  def countAlive(self):
    count = 0
    for idx, a in enumerate(self.aliens):
      if a.alive:
        count = count + 1;
    return count;
  def updateAliens(self):
    moveFrame = self.frameCount % self.alienMoveDelay
    if moveFrame != 0:
      return;
    shouldMoveDown = False
    minX = 999
    maxX = 0
    for idx, alien in enumerate(self.aliens):
      if alien.alive:
        if alien.x < minX:
          minX = alien.x;
        if alien.x > maxX:
          maxX = alien.x;
    rightBound = self.WIDTH - 2
    if self.alienDirection > 0:
      if maxX >= rightBound:
        self.alienDirection = -1;
        shouldMoveDown = True;
    else:
      if minX <= 1:
        self.alienDirection = 1;
        shouldMoveDown = True;
    for idx2, alien_1 in enumerate(self.aliens):
      if alien_1.alive:
        alien_1.x = alien_1.x + self.alienDirection;
        if shouldMoveDown:
          alien_1.y = alien_1.y + 1;
          if alien_1.y >= self.PLAYER_Y:
            self.gameOver = True;
    aliveCount = self.countAlive()
    if aliveCount < 12:
      self.alienMoveDelay = 5;
    if aliveCount < 6:
      self.alienMoveDelay = 3;
    if aliveCount < 3:
      self.alienMoveDelay = 1;
  def checkCollisions(self):
    for bidx, bullet in enumerate(self.bullets):
      if bullet.active:
        for aidx, alien in enumerate(self.aliens):
          if alien.alive:
            if bullet.x == alien.x:
              if bullet.y == alien.y:
                bullet.active = False;
                alien.alive = False;
                self.score = self.score + 10;
  def checkWin(self):
    aliveCount = self.countAlive()
    if aliveCount == 0:
      self.gameWon = True;
      self.gameOver = True;
  def update(self):
    self.frameCount = self.frameCount + 1;
    self.updateBullets()
    self.updateAliens()
    self.checkCollisions()
    self.checkWin()
  def endGame(self):
    print("\x1b[2J\x1b[H", end='')
    print(f"\x1b[{1};{1}H", end='')
    if self.gameWon:
      print("=== YOU WIN! ===")
    else:
      print("=== GAME OVER ===")
    finalMsg = "Final Score: " + str(self.score)
    print(finalMsg)
    print("\x1b[?25h", end='')
  def gameLoop(self):
    while self.gameOver == False:
      self.savePrevState()
      self.update()
      self.render()
      key = (r_key_queue.pop(0) if r_key_queue else "")
      if key != "":
        self.handleKey(key)
      time.sleep(50 / 1000.0)
    self.endGame()
  def handleKey(self, key):
    if key == "left":
      self.moveLeft()
    if key == "right":
      self.moveRight()
    if key == "a":
      self.moveLeft()
    if key == "A":
      self.moveLeft()
    if key == "d":
      self.moveRight()
    if key == "D":
      self.moveRight()
    if key == " ":
      self.shoot()
    if key == "space":
      self.shoot()
    if key == "q":
      self.gameOver = True;
    if key == "Q":
      self.gameOver = True;
# Main entry point
def main():
  game = Invaders()
  print("=== SPACE INVADERS ===")
  print("")
  print("Controls:")
  print("  LEFT/RIGHT - Move")
  print("  SPACE      - Shoot")
  print("  Q          - Quit")
  print("")
  print("Starting game...")
  key = ""
  _ = key
  def _keypress_listener():
    global r_key_queue, r_key_lock
    import time
    if sys.platform == 'win32':
      import msvcrt
      while True:
        if msvcrt.kbhit():
          ch = msvcrt.getch()
          if ch == b'\x03': break
          if ch in (b'\x00', b'\xe0'):
            ch2 = msvcrt.getch()
            k = {b'H': 'up', b'P': 'down', b'K': 'left', b'M': 'right'}.get(ch2, '')
          else:
            k = ch.decode('latin-1') if ch != b' ' else 'space'
          if k:
            with r_key_lock:
              r_key_queue.append(k)
        else:
          time.sleep(0.01)
    else:
      import tty, termios
      fd = sys.stdin.fileno()
      old = termios.tcgetattr(fd)
      try:
        tty.setraw(fd)
        while True:
          ch = sys.stdin.read(1)
          if ch == '\x03': break
          if ch == '\x1b':
            ch2 = sys.stdin.read(2)
            k = {'[A': 'up', '[B': 'down', '[C': 'right', '[D': 'left'}.get(ch2, 'escape')
          elif ch == ' ':
            k = 'space'
          else:
            k = ch
          with r_key_lock:
            r_key_queue.append(k)
      finally:
        termios.tcsetattr(fd, termios.TCSADRAIN, old)
  threading.Thread(target=_keypress_listener, daemon=True).start()
  print("\x1b[?25l", end='')
  game.gameLoop()
if __name__ == "__main__":
  main()
