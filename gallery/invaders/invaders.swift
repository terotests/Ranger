import Foundation

var r_key_channel: DispatchQueue? = nil
var r_key_queue: [String] = []
var r_key_queue_lock = NSLock()

#if os(Windows)
@_silgen_name("_kbhit") func _kbhit() -> Int32
@_silgen_name("_getch") func _getch() -> Int32

func r_setup_raw_mode() {
    // No setup needed on Windows
}

func r_read_key() -> String? {
    if _kbhit() == 0 { return nil }
    let ch = _getch()
    if ch == 3 { // Ctrl+C
        print("\u{1b}[?25h", terminator: "")
        exit(0)
    }
    if ch == 224 || ch == 0 { // Extended key
        let ch2 = _getch()
        switch ch2 {
        case 72: return "up"
        case 80: return "down"
        case 75: return "left"
        case 77: return "right"
        default: return ""
        }
    }
    switch ch {
    case 8: return "backspace"
    case 9: return "tab"
    case 13: return "enter"
    case 27: return "escape"
    case 32: return "space"
    default: return String(UnicodeScalar(UInt8(ch)))
    }
}
#else
func r_setup_raw_mode() {
    let _ = system("stty cbreak min 1 -echo")
}

func r_read_key() -> String? {
    var buf = [UInt8](repeating: 0, count: 3)
    let n = read(STDIN_FILENO, &buf, 1)
    if n <= 0 { return nil }
    if buf[0] == 3 { // Ctrl+C
        print("\u{1b}[?25h", terminator: "")
        exit(0)
    }
    if buf[0] == 27 { // Escape sequence
        let _ = read(STDIN_FILENO, &buf[1], 2)
        if buf[1] == 91 {
            switch buf[2] {
            case 65: return "up"
            case 66: return "down"
            case 67: return "right"
            case 68: return "left"
            default: break
            }
        }
        return "escape"
    }
    switch buf[0] {
    case 8, 127: return "backspace"
    case 9: return "tab"
    case 10, 13: return "enter"
    case 32: return "space"
    default: return String(UnicodeScalar(buf[0]))
    }
}
#endif

func ==(l: Alien, r: Alien) -> Bool {
  return l === r
}
class Alien : Equatable  { 
  var x : Int = 0
  var y : Int = 0
  var prevX : Int = 0
  var prevY : Int = 0
  var alive : Bool = true
  var wasAlive : Bool = true
  init(startX : Int, startY : Int ) {
    self.x = startX;
    self.y = startY;
    self.prevX = startX;
    self.prevY = startY;
  }
  func savePrev() -> Void {
    self.prevX = self.x;
    self.prevY = self.y;
    self.wasAlive = self.alive;
  }
}
func ==(l: Bullet, r: Bullet) -> Bool {
  return l === r
}
class Bullet : Equatable  { 
  var x : Int = 0
  var y : Int = 0
  var prevX : Int = 0
  var prevY : Int = 0
  var active : Bool = true
  var wasActive : Bool = true
  init(startX : Int, startY : Int ) {
    self.x = startX;
    self.y = startY;
    self.prevX = startX;
    self.prevY = startY;
  }
  func savePrev() -> Void {
    self.prevX = self.x;
    self.prevY = self.y;
    self.wasActive = self.active;
  }
}
func ==(l: Invaders, r: Invaders) -> Bool {
  return l === r
}
class Invaders : Equatable  { 
  var WIDTH : Int = 40
  var HEIGHT : Int = 18
  var PLAYER_Y : Int = 16
  var playerX : Int = 20
  var drawnPlayerX : Int = -1
  var aliens : [Alien] = [Alien]()
  var bullets : [Bullet] = [Bullet]()
  var score : Int = 0
  var prevScore : Int = 0
  var gameOver : Bool = false
  var gameWon : Bool = false
  var alienDirection : Int = 1
  var frameCount : Int = 0
  var alienMoveDelay : Int = 8
  var firstRender : Bool = true
  init( ) {
    self.initAliens()
  }
  func initAliens() -> Void {
    var row : Int = 0
    while (row < 3) {
      var col : Int = 0
      while (col < 8) {
        let ax : Int = (col * 4) + 4
        let ay : Int = row + 2
        let alien : Alien = Alien(startX : ax, startY : ay)
        self.aliens.append(alien)
        col = col + 1;
      }
      row = row + 1;
    }
  }
  func drawAt(x : Int, y : Int, ch : String) -> Void {
    print("\u{1b}[\(y + 1);\(x + 1)H", terminator: "")
    print(ch, terminator: "")
  }
  func eraseAt(x : Int, y : Int) -> Void {
    print("\u{1b}[\(y + 1);\(x + 1)H", terminator: "")
    print(" ", terminator: "")
  }
  func drawBorders() -> Void {
    print("\u{1b}[\(1);\(1)H", terminator: "")
    var i : Int = 0
    let borderW : Int = self.WIDTH + 2
    while (i < borderW) {
      print("=", terminator: "")
      i = i + 1;
    }
    var y : Int = 0
    while (y < self.HEIGHT) {
      print("\u{1b}[\(y + 2);\(1)H", terminator: "")
      print("|", terminator: "")
      let rightX : Int = self.WIDTH + 2
      print("\u{1b}[\(y + 2);\(rightX)H", terminator: "")
      print("|", terminator: "")
      y = y + 1;
    }
    let bottomY : Int = self.HEIGHT + 2
    print("\u{1b}[\(bottomY);\(1)H", terminator: "")
    var j : Int = 0
    while (j < borderW) {
      print("=", terminator: "")
      j = j + 1;
    }
    let scoreY : Int = self.HEIGHT + 3
    print("\u{1b}[\(scoreY);\(1)H", terminator: "")
    print("Score:       |  Arrows=move  SPACE=shoot  Q=quit", terminator: "")
  }
  func render() -> Void {
    if ( self.firstRender ) {
      print("\u{1b}[2J\u{1b}[H", terminator: "")
      self.drawBorders()
      self.firstRender = false;
    }
    if ( self.drawnPlayerX >= 0 ) {
      if ( self.drawnPlayerX != self.playerX ) {
        self.eraseAt(x : self.drawnPlayerX, y : self.PLAYER_Y)
      }
    }
    self.drawAt(x : self.playerX, y : self.PLAYER_Y, ch : "A")
    self.drawnPlayerX = self.playerX;
    for (idx, alien) in self.aliens.enumerated() {
      if ( alien.wasAlive ) {
        var moved : Bool = false
        if ( alien.prevX != alien.x ) {
          moved = true;
        }
        if ( alien.prevY != alien.y ) {
          moved = true;
        }
        if ( moved ) {
          let oldAx : Int = alien.prevX + 1
          self.eraseAt(x : oldAx, y : alien.prevY)
        }
        if ( alien.alive == false ) {
          let killAx : Int = alien.x + 1
          self.eraseAt(x : killAx, y : alien.y)
        }
      }
      if ( alien.alive ) {
        let drawX : Int = alien.x + 1
        self.drawAt(x : drawX, y : alien.y, ch : "W")
      }
    }
    for (idx2, bullet) in self.bullets.enumerated() {
      if ( bullet.wasActive ) {
        let oldBx : Int = bullet.prevX + 1
        self.eraseAt(x : oldBx, y : bullet.prevY)
      }
      if ( bullet.active ) {
        let bx : Int = bullet.x + 1
        self.drawAt(x : bx, y : bullet.y, ch : "|")
      }
    }
    if ( self.score != self.prevScore ) {
      let scoreY : Int = self.HEIGHT + 3
      print("\u{1b}[\(scoreY);\(8)H", terminator: "")
      let scoreStr : String = String(self.score) + "   "
      print(scoreStr, terminator: "")
    }
    let endY : Int = self.HEIGHT + 4
    print("\u{1b}[\(endY);\(1)H", terminator: "")
  }
  func savePrevState() -> Void {
    self.prevScore = self.score;
    for (idx, alien) in self.aliens.enumerated() {
      alien.savePrev()
    }
    for (idx2, bullet) in self.bullets.enumerated() {
      bullet.savePrev()
    }
  }
  func shoot() -> Void {
    let bulletY : Int = self.PLAYER_Y - 1
    let bullet : Bullet = Bullet(startX : self.playerX, startY : bulletY)
    self.bullets.append(bullet)
  }
  func moveLeft() -> Void {
    if ( self.playerX > 2 ) {
      self.playerX = self.playerX - 1;
    }
  }
  func moveRight() -> Void {
    let maxX : Int = self.WIDTH - 1
    if ( self.playerX < maxX ) {
      self.playerX = self.playerX + 1;
    }
  }
  func updateBullets() -> Void {
    for (idx, bullet) in self.bullets.enumerated() {
      if ( bullet.active ) {
        bullet.y = bullet.y - 1;
        if ( bullet.y < 1 ) {
          bullet.active = false;
        }
      }
    }
  }
  func countAlive() -> Int {
    var count : Int = 0
    for (idx, a) in self.aliens.enumerated() {
      if ( a.alive ) {
        count = count + 1;
      }
    }
    return count;
  }
  func updateAliens() -> Void {
    let moveFrame : Int = self.frameCount % self.alienMoveDelay
    if ( moveFrame != 0 ) {
      return;
    }
    var shouldMoveDown : Bool = false
    var minX : Int = 999
    var maxX : Int = 0
    for (idx, alien) in self.aliens.enumerated() {
      if ( alien.alive ) {
        if ( alien.x < minX ) {
          minX = alien.x;
        }
        if ( alien.x > maxX ) {
          maxX = alien.x;
        }
      }
    }
    let rightBound : Int = self.WIDTH - 2
    if ( self.alienDirection > 0 ) {
      if ( maxX >= rightBound ) {
        self.alienDirection = -1;
        shouldMoveDown = true;
      }
    } else {
      if ( minX <= 1 ) {
        self.alienDirection = 1;
        shouldMoveDown = true;
      }
    }
    for (idx2, alien_1) in self.aliens.enumerated() {
      if ( alien_1.alive ) {
        alien_1.x = alien_1.x + self.alienDirection;
        if ( shouldMoveDown ) {
          alien_1.y = alien_1.y + 1;
          if ( alien_1.y >= self.PLAYER_Y ) {
            self.gameOver = true;
          }
        }
      }
    }
    let aliveCount : Int = self.countAlive()
    if ( aliveCount < 12 ) {
      self.alienMoveDelay = 5;
    }
    if ( aliveCount < 6 ) {
      self.alienMoveDelay = 3;
    }
    if ( aliveCount < 3 ) {
      self.alienMoveDelay = 1;
    }
  }
  func checkCollisions() -> Void {
    for (bidx, bullet) in self.bullets.enumerated() {
      if ( bullet.active ) {
        for (aidx, alien) in self.aliens.enumerated() {
          if ( alien.alive ) {
            if ( bullet.x == alien.x ) {
              if ( bullet.y == alien.y ) {
                bullet.active = false;
                alien.alive = false;
                self.score = self.score + 10;
              }
            }
          }
        }
      }
    }
  }
  func checkWin() -> Void {
    let aliveCount : Int = self.countAlive()
    if ( aliveCount == 0 ) {
      self.gameWon = true;
      self.gameOver = true;
    }
  }
  func update() -> Void {
    self.frameCount = self.frameCount + 1;
    self.updateBullets()
    self.updateAliens()
    self.checkCollisions()
    self.checkWin()
  }
  func endGame() -> Void {
    print("\u{1b}[2J\u{1b}[H", terminator: "")
    print("\u{1b}[\(1);\(1)H", terminator: "")
    if ( self.gameWon ) {
      print("=== YOU WIN! ===")
    } else {
      print("=== GAME OVER ===")
    }
    let finalMsg : String = "Final Score: " + String(self.score)
    print(finalMsg)
    print("\u{1b}[?25h", terminator: "")
  }
  func gameLoop() -> Void {
    while (self.gameOver == false) {
      self.savePrevState()
      self.update()
      self.render()
      let key : String = { () -> String in r_key_queue_lock.lock(); defer { r_key_queue_lock.unlock() }; if r_key_queue.isEmpty { return "" }; return r_key_queue.removeFirst() }()
      if ( key != "" ) {
        self.handleKey(key : key)
      }
      Thread.sleep(forTimeInterval: Double(50) / 1000.0)
    }
    self.endGame()
  }
  func handleKey(key : String) -> Void {
    if ( key == "left" ) {
      self.moveLeft()
    }
    if ( key == "right" ) {
      self.moveRight()
    }
    if ( key == "a" ) {
      self.moveLeft()
    }
    if ( key == "A" ) {
      self.moveLeft()
    }
    if ( key == "d" ) {
      self.moveRight()
    }
    if ( key == "D" ) {
      self.moveRight()
    }
    if ( key == " " ) {
      self.shoot()
    }
    if ( key == "space" ) {
      self.shoot()
    }
    if ( key == "q" ) {
      self.gameOver = true;
    }
    if ( key == "Q" ) {
      self.gameOver = true;
    }
  }
}
// Swift 6 entry point
@main
struct Main {
  static func main() {
    let game : Invaders = Invaders()
    print("=== SPACE INVADERS ===")
    print("")
    print("Controls:")
    print("  LEFT/RIGHT - Move")
    print("  SPACE      - Shoot")
    print("  Q          - Quit")
    print("")
    print("Starting game...")
    let key : String = ""
    _ = key
    r_key_channel = DispatchQueue(label: "keypress")
    r_key_channel!.async {
      r_setup_raw_mode()
      while true {
        if let k = r_read_key(), !k.isEmpty {
          r_key_queue_lock.lock()
          r_key_queue.append(k)
          r_key_queue_lock.unlock()
        }
        Thread.sleep(forTimeInterval: 0.01)
      }
    }
    print("\u{1b}[?25l", terminator: "")
    game.gameLoop()
  }
}
