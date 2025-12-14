
var r_key_channel: java.util.concurrent.BlockingQueue<String>? = null
var r_windows_key_process: Process? = null
var r_windows_key_reader: java.io.BufferedReader? = null

fun r_setup_raw_mode() {
    val os = System.getProperty("os.name").lowercase()
    if (os.contains("win")) {
        // Start a persistent PowerShell process for reading keys
        val pb = ProcessBuilder("powershell", "-NoProfile", "-Command", 
            "[Console]::TreatControlCAsInput = \$true; while(\$true) { \$k = \$host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown'); [Console]::WriteLine(\$k.VirtualKeyCode) }")
        pb.redirectErrorStream(true)
        r_windows_key_process = pb.start()
        r_windows_key_reader = r_windows_key_process?.inputStream?.bufferedReader()
    } else {
        Runtime.getRuntime().exec(arrayOf("/bin/sh", "-c", "stty -F /dev/tty cbreak min 1 -echo"))
    }
    // Add shutdown hook to restore cursor
    Runtime.getRuntime().addShutdownHook(Thread {
        print("\u001b[?25h")
        r_windows_key_process?.destroyForcibly()
    })
}

fun r_read_key(): String {
    val os = System.getProperty("os.name").lowercase()
    if (os.contains("win")) {
        // Read from persistent PowerShell process (blocks until key available)
        try {
            val reader = r_windows_key_reader ?: return ""
            val line = reader.readLine() ?: return ""
            val code = line.trim().toIntOrNull() ?: return ""
            if (code == 3 || code == 67) { // Ctrl+C check
                print("\u001b[?25h")
                r_windows_key_process?.destroyForcibly()
                System.exit(0)
            }
            return when (code) {
                38 -> "up"
                40 -> "down"
                37 -> "left"
                39 -> "right"
                32 -> "space"
                13 -> "enter"
                27 -> "escape"
                8 -> "backspace"
                9 -> "tab"
                else -> if (code in 65..90) code.toChar().lowercase() else ""
            }
        } catch (e: Exception) { return "" }
    } else {
        // Unix: read from stdin
        try {
            val buf = ByteArray(3)
            val n = System.`in`.read(buf, 0, 1)
            if (n <= 0) return ""
            if (buf[0].toInt() == 3) { // Ctrl+C
                print("\u001b[?25h")
                System.exit(0)
            }
            if (buf[0].toInt() == 27) { // Escape sequence
                System.`in`.read(buf, 1, 2)
                if (buf[1].toInt() == 91) {
                    return when (buf[2].toInt()) {
                        65 -> "up"
                        66 -> "down"
                        67 -> "right"
                        68 -> "left"
                        else -> "escape"
                    }
                }
                return "escape"
            }
            return when (buf[0].toInt()) {
                8, 127 -> "backspace"
                9 -> "tab"
                10, 13 -> "enter"
                32 -> "space"
                else -> buf[0].toInt().toChar().toString()
            }
        } catch (e: Exception) { return "" }
    }
}


class Alien( startX : Int, startY : Int ) 
 {
  var x : Int  = 0;
  var y : Int  = 0;
  var prevX : Int  = 0;
  var prevY : Int  = 0;
  var alive : Boolean  = true;
  var wasAlive : Boolean  = true;
  
  init {
    x = startX;
    y = startY;
    prevX = startX;
    prevY = startY;
  }
  
  fun  savePrev() : Unit {
    prevX = x;
    prevY = y;
    wasAlive = alive;
  }
}

class Bullet( startX : Int, startY : Int ) 
 {
  var x : Int  = 0;
  var y : Int  = 0;
  var prevX : Int  = 0;
  var prevY : Int  = 0;
  var active : Boolean  = true;
  var wasActive : Boolean  = true;
  
  init {
    x = startX;
    y = startY;
    prevX = startX;
    prevY = startY;
  }
  
  fun  savePrev() : Unit {
    prevX = x;
    prevY = y;
    wasActive = active;
  }
}

class Invaders( ) 
 {
  var WIDTH : Int  = 40;
  var HEIGHT : Int  = 18;
  var PLAYER_Y : Int  = 16;
  var playerX : Int  = 20;
  var drawnPlayerX : Int  = -1;
  var aliens : MutableList<Alien>  = arrayListOf();
  var bullets : MutableList<Bullet>  = arrayListOf();
  var score : Int  = 0;
  var prevScore : Int  = 0;
  var gameOver : Boolean  = false;
  var gameWon : Boolean  = false;
  var alienDirection : Int  = 1;
  var frameCount : Int  = 0;
  var alienMoveDelay : Int  = 8;
  var firstRender : Boolean  = true;
  
  init {
    this.initAliens();
  }
  companion object {
    
  }
  
  fun  initAliens() : Unit {
    var row : Int  = 0;
    while (row < 3) {
      var col : Int  = 0;
      while (col < 8) {
        val ax : Int  = (col * 4) + 4;
        val ay : Int  = row + 2;
        val alien : Alien  =  Alien(ax, ay);
        aliens.add(alien);
        col = col + 1;
      }
      row = row + 1;
    }
  }
  
  fun  drawAt( x : Int, y : Int, ch : String) : Unit {
    print("\u001b[" + (y + 1) + ";" + (x + 1) + "H")
    print(ch)
  }
  
  fun  eraseAt( x : Int, y : Int) : Unit {
    print("\u001b[" + (y + 1) + ";" + (x + 1) + "H")
    print(" ")
  }
  
  fun  drawBorders() : Unit {
    print("\u001b[" + (1) + ";" + (1) + "H")
    var i : Int  = 0;
    val borderW : Int  = WIDTH + 2;
    while (i < borderW) {
      print("=")
      i = i + 1;
    }
    var y : Int  = 0;
    while (y < HEIGHT) {
      print("\u001b[" + (y + 2) + ";" + (1) + "H")
      print("|")
      val rightX : Int  = WIDTH + 2;
      print("\u001b[" + (y + 2) + ";" + (rightX) + "H")
      print("|")
      y = y + 1;
    }
    val bottomY : Int  = HEIGHT + 2;
    print("\u001b[" + (bottomY) + ";" + (1) + "H")
    var j : Int  = 0;
    while (j < borderW) {
      print("=")
      j = j + 1;
    }
    val scoreY : Int  = HEIGHT + 3;
    print("\u001b[" + (scoreY) + ";" + (1) + "H")
    print("Score:       |  Arrows=move  SPACE=shoot  Q=quit")
  }
  
  fun  render() : Unit {
    if ( firstRender ) {
      print("\u001b[2J\u001b[H")
      this.drawBorders();
      firstRender = false;
    }
    if ( drawnPlayerX >= 0 ) {
      if ( drawnPlayerX != playerX ) {
        this.eraseAt(drawnPlayerX, PLAYER_Y);
      }
    }
    this.drawAt(playerX, PLAYER_Y, "A");
    drawnPlayerX = playerX;
    for ( idx in aliens.indices ) {
      val alien = aliens[idx]
      if ( alien.wasAlive ) {
        var moved : Boolean  = false;
        if ( alien.prevX != alien.x ) {
          moved = true;
        }
        if ( alien.prevY != alien.y ) {
          moved = true;
        }
        if ( moved ) {
          val oldAx : Int  = alien.prevX + 1;
          this.eraseAt(oldAx, alien.prevY);
        }
        if ( alien.alive == false ) {
          val killAx : Int  = alien.x + 1;
          this.eraseAt(killAx, alien.y);
        }
      }
      if ( alien.alive ) {
        val drawX : Int  = alien.x + 1;
        this.drawAt(drawX, alien.y, "W");
      }
    }
    for ( idx2 in bullets.indices ) {
      val bullet = bullets[idx2]
      if ( bullet.wasActive ) {
        val oldBx : Int  = bullet.prevX + 1;
        this.eraseAt(oldBx, bullet.prevY);
      }
      if ( bullet.active ) {
        val bx : Int  = bullet.x + 1;
        this.drawAt(bx, bullet.y, "|");
      }
    }
    if ( score != prevScore ) {
      val scoreY : Int  = HEIGHT + 3;
      print("\u001b[" + (scoreY) + ";" + (8) + "H")
      val scoreStr : String  = score.toString() + "   ";
      print(scoreStr)
    }
    val endY : Int  = HEIGHT + 4;
    print("\u001b[" + (endY) + ";" + (1) + "H")
  }
  
  fun  savePrevState() : Unit {
    prevScore = score;
    for ( idx in aliens.indices ) {
      val alien = aliens[idx]
      alien.savePrev();
    }
    for ( idx2 in bullets.indices ) {
      val bullet = bullets[idx2]
      bullet.savePrev();
    }
  }
  
  fun  shoot() : Unit {
    val bulletY : Int  = PLAYER_Y - 1;
    val bullet : Bullet  =  Bullet(playerX, bulletY);
    bullets.add(bullet);
  }
  
  fun  moveLeft() : Unit {
    if ( playerX > 2 ) {
      playerX = playerX - 1;
    }
  }
  
  fun  moveRight() : Unit {
    val maxX : Int  = WIDTH - 1;
    if ( playerX < maxX ) {
      playerX = playerX + 1;
    }
  }
  
  fun  updateBullets() : Unit {
    for ( idx in bullets.indices ) {
      val bullet = bullets[idx]
      if ( bullet.active ) {
        bullet.y = bullet.y - 1;
        if ( bullet.y < 1 ) {
          bullet.active = false;
        }
      }
    }
  }
  
  fun  countAlive() : Int {
    var count : Int  = 0;
    for ( idx in aliens.indices ) {
      val a = aliens[idx]
      if ( a.alive ) {
        count = count + 1;
      }
    }
    return count;
  }
  
  fun  updateAliens() : Unit {
    val moveFrame : Int  = frameCount % alienMoveDelay;
    if ( moveFrame != 0 ) {
      return;
    }
    var shouldMoveDown : Boolean  = false;
    var minX : Int  = 999;
    var maxX : Int  = 0;
    for ( idx in aliens.indices ) {
      val alien = aliens[idx]
      if ( alien.alive ) {
        if ( alien.x < minX ) {
          minX = alien.x;
        }
        if ( alien.x > maxX ) {
          maxX = alien.x;
        }
      }
    }
    val rightBound : Int  = WIDTH - 2;
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
    for ( idx2 in aliens.indices ) {
      val alien_1 = aliens[idx2]
      if ( alien_1.alive ) {
        alien_1.x = alien_1.x + alienDirection;
        if ( shouldMoveDown ) {
          alien_1.y = alien_1.y + 1;
          if ( alien_1.y >= PLAYER_Y ) {
            gameOver = true;
          }
        }
      }
    }
    val aliveCount : Int  = this.countAlive();
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
  
  fun  checkCollisions() : Unit {
    for ( bidx in bullets.indices ) {
      val bullet = bullets[bidx]
      if ( bullet.active ) {
        for ( aidx in aliens.indices ) {
          val alien = aliens[aidx]
          if ( alien.alive ) {
            if ( bullet.x == alien.x ) {
              if ( bullet.y == alien.y ) {
                bullet.active = false;
                alien.alive = false;
                score = score + 10;
              }
            }
          }
        }
      }
    }
  }
  
  fun  checkWin() : Unit {
    val aliveCount : Int  = this.countAlive();
    if ( aliveCount == 0 ) {
      gameWon = true;
      gameOver = true;
    }
  }
  
  fun  update() : Unit {
    frameCount = frameCount + 1;
    this.updateBullets();
    this.updateAliens();
    this.checkCollisions();
    this.checkWin();
  }
  
  fun  endGame() : Unit {
    print("\u001b[2J\u001b[H")
    print("\u001b[" + (1) + ";" + (1) + "H")
    if ( gameWon ) {
      println( "=== YOU WIN! ===" )
    } else {
      println( "=== GAME OVER ===" )
    }
    val finalMsg : String  = "Final Score: " + score.toString();
    println( finalMsg )
    print("\u001b[?25h")
  }
  
  fun  gameLoop() : Unit {
    while (gameOver == false) {
      this.savePrevState();
      this.update();
      this.render();
      val key : String  = (r_key_channel?.poll() ?: "");
      if ( key != "" ) {
        this.handleKey(key);
      }
      Thread.sleep(50.toLong())
    }
    this.endGame();
  }
  
  fun  handleKey( key : String) : Unit {
    if ( key == "left" ) {
      this.moveLeft();
    }
    if ( key == "right" ) {
      this.moveRight();
    }
    if ( key == "a" ) {
      this.moveLeft();
    }
    if ( key == "A" ) {
      this.moveLeft();
    }
    if ( key == "d" ) {
      this.moveRight();
    }
    if ( key == "D" ) {
      this.moveRight();
    }
    if ( key == " " ) {
      this.shoot();
    }
    if ( key == "space" ) {
      this.shoot();
    }
    if ( key == "q" ) {
      gameOver = true;
    }
    if ( key == "Q" ) {
      gameOver = true;
    }
  }
}

fun main(args : Array<String>) {
  val game : Invaders  =  Invaders();
  println( "=== SPACE INVADERS ===" )
  println( "" )
  println( "Controls:" )
  println( "  LEFT/RIGHT - Move" )
  println( "  SPACE      - Shoot" )
  println( "  Q          - Quit" )
  println( "" )
  println( "Starting game..." )
  val key : String  = "";
  r_key_channel = java.util.concurrent.LinkedBlockingQueue<String>()
  Thread {
    r_setup_raw_mode()
    while (true) {
      val k = r_read_key()
      if (k.isNotEmpty()) {
        r_key_channel?.offer(k)
      }
    }
  }.start()
  print("\u001b[?25l")
  game.gameLoop();
}
