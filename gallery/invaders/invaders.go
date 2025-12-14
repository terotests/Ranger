package main
import (
  "fmt"
  "strings"
  "strconv"
  "time"
  "os"
  "os/exec"
  "runtime"
  "syscall"
  "unsafe"
)

type GoNullable struct { 
  value interface{}
  has_value bool
}


var r_key_channel chan string

var (
	msvcrt = syscall.NewLazyDLL("msvcrt.dll")
	kbhit = msvcrt.NewProc("_kbhit")
	getch = msvcrt.NewProc("_getch")
)

var _ = unsafe.Sizeof(0) // suppress unused import

func r_setup_raw_mode() {
	if runtime.GOOS != "windows" {
		exec.Command("stty", "-F", "/dev/tty", "cbreak", "min", "1").Run()
		exec.Command("stty", "-F", "/dev/tty", "-echo").Run()
	}
}

func r_read_key() string {
	if runtime.GOOS == "windows" {
		ret, _, _ := kbhit.Call()
		if ret == 0 {
			time.Sleep(10 * time.Millisecond)
			return ""
		}
		ch, _, _ := getch.Call()
		if ch == 3 { // Ctrl+C
			fmt.Print("\x1b[?25h")
			os.Exit(0)
		}
		if ch == 224 || ch == 0 { // Extended key
			ch2, _, _ := getch.Call()
			switch ch2 {
			case 72:
				return "up"
			case 80:
				return "down"
			case 75:
				return "left"
			case 77:
				return "right"
			}
			return ""
		}
		switch ch {
		case 8:
			return "backspace"
		case 9:
			return "tab"
		case 13:
			return "enter"
		case 27:
			return "escape"
		case 32:
			return "space"
		}
		return string(rune(ch))
	}
	var b []byte = make([]byte, 3)
	n, err := os.Stdin.Read(b[:1])
	if err != nil || n == 0 {
		return ""
	}
	if b[0] == 3 { // Ctrl+C
		fmt.Print("\x1b[?25h")
		os.Exit(0)
	}
	if b[0] == 27 { // Escape sequence
		os.Stdin.Read(b[1:3])
		if b[1] == 91 {
			switch b[2] {
			case 65:
				return "up"
			case 66:
				return "down"
			case 67:
				return "right"
			case 68:
				return "left"
			}
		}
		return "escape"
	}
	switch b[0] {
	case 8, 127:
		return "backspace"
	case 9:
		return "tab"
	case 10, 13:
		return "enter"
	case 32:
		return "space"
	}
	return string(b[0])
}

type Alien struct { 
  x int64 `json:"x"` 
  y int64 `json:"y"` 
  prevX int64 `json:"prevX"` 
  prevY int64 `json:"prevY"` 
  alive bool `json:"alive"` 
  wasAlive bool `json:"wasAlive"` 
}

func CreateNew_Alien(startX int64, startY int64) *Alien {
  me := new(Alien)
  me.x = int64(0)
  me.y = int64(0)
  me.prevX = int64(0)
  me.prevY = int64(0)
  me.alive = true
  me.wasAlive = true
  me.x = startX; 
  me.y = startY; 
  me.prevX = startX; 
  me.prevY = startY; 
  return me;
}
func (this *Alien) savePrev () () {
  this.prevX = this.x; 
  this.prevY = this.y; 
  this.wasAlive = this.alive; 
}
type Bullet struct { 
  x int64 `json:"x"` 
  y int64 `json:"y"` 
  prevX int64 `json:"prevX"` 
  prevY int64 `json:"prevY"` 
  active bool `json:"active"` 
  wasActive bool `json:"wasActive"` 
}

func CreateNew_Bullet(startX int64, startY int64) *Bullet {
  me := new(Bullet)
  me.x = int64(0)
  me.y = int64(0)
  me.prevX = int64(0)
  me.prevY = int64(0)
  me.active = true
  me.wasActive = true
  me.x = startX; 
  me.y = startY; 
  me.prevX = startX; 
  me.prevY = startY; 
  return me;
}
func (this *Bullet) savePrev () () {
  this.prevX = this.x; 
  this.prevY = this.y; 
  this.wasActive = this.active; 
}
type Invaders struct { 
  WIDTH int64 `json:"WIDTH"` 
  HEIGHT int64 `json:"HEIGHT"` 
  PLAYER_Y int64 `json:"PLAYER_Y"` 
  playerX int64 `json:"playerX"` 
  drawnPlayerX int64 `json:"drawnPlayerX"` 
  aliens []*Alien `json:"aliens"` 
  bullets []*Bullet `json:"bullets"` 
  score int64 `json:"score"` 
  prevScore int64 `json:"prevScore"` 
  gameOver bool `json:"gameOver"` 
  gameWon bool `json:"gameWon"` 
  alienDirection int64 `json:"alienDirection"` 
  frameCount int64 `json:"frameCount"` 
  alienMoveDelay int64 `json:"alienMoveDelay"` 
  firstRender bool `json:"firstRender"` 
}

func CreateNew_Invaders() *Invaders {
  me := new(Invaders)
  me.WIDTH = int64(40)
  me.HEIGHT = int64(18)
  me.PLAYER_Y = int64(16)
  me.playerX = int64(20)
  me.drawnPlayerX = int64(-1)
  me.aliens = make([]*Alien,0)
  me.bullets = make([]*Bullet,0)
  me.score = int64(0)
  me.prevScore = int64(0)
  me.gameOver = false
  me.gameWon = false
  me.alienDirection = int64(1)
  me.frameCount = int64(0)
  me.alienMoveDelay = int64(8)
  me.firstRender = true
  me.initAliens();
  return me;
}
func (this *Invaders) initAliens () () {
  var row int64= int64(0);
  for row < int64(3) {
    var col int64= int64(0);
    for col < int64(8) {
      var ax int64= (col * int64(4)) + int64(4);
      var ay int64= row + int64(2);
      var alien *Alien= CreateNew_Alien(ax, ay);
      this.aliens = append(this.aliens,alien); 
      col = col + int64(1); 
    }
    row = row + int64(1); 
  }
}
func (this *Invaders) drawAt (x int64, y int64, ch string) () {
  fmt.Printf("\x1b[%d;%dH", y + int64(1), x + int64(1))
  fmt.Print( ch )
}
func (this *Invaders) eraseAt (x int64, y int64) () {
  fmt.Printf("\x1b[%d;%dH", y + int64(1), x + int64(1))
  fmt.Print( " " )
}
func (this *Invaders) drawBorders () () {
  fmt.Printf("\x1b[%d;%dH", int64(1), int64(1))
  var i int64= int64(0);
  var borderW int64= this.WIDTH + int64(2);
  for i < borderW {
    fmt.Print( "=" )
    i = i + int64(1); 
  }
  var y int64= int64(0);
  for y < this.HEIGHT {
    fmt.Printf("\x1b[%d;%dH", y + int64(2), int64(1))
    fmt.Print( "|" )
    var rightX int64= this.WIDTH + int64(2);
    fmt.Printf("\x1b[%d;%dH", y + int64(2), rightX)
    fmt.Print( "|" )
    y = y + int64(1); 
  }
  var bottomY int64= this.HEIGHT + int64(2);
  fmt.Printf("\x1b[%d;%dH", bottomY, int64(1))
  var j int64= int64(0);
  for j < borderW {
    fmt.Print( "=" )
    j = j + int64(1); 
  }
  var scoreY int64= this.HEIGHT + int64(3);
  fmt.Printf("\x1b[%d;%dH", scoreY, int64(1))
  fmt.Print( "Score:       |  Arrows=move  SPACE=shoot  Q=quit" )
}
func (this *Invaders) render () () {
  if  this.firstRender {
    fmt.Print("\x1b[2J\x1b[H")
    this.drawBorders();
    this.firstRender = false; 
  }
  if  this.drawnPlayerX >= int64(0) {
    if  this.drawnPlayerX != this.playerX {
      this.eraseAt(this.drawnPlayerX, this.PLAYER_Y);
    }
  }
  this.drawAt(this.playerX, this.PLAYER_Y, "A");
  this.drawnPlayerX = this.playerX; 
  var idx int64 = 0;  
  for ; idx < int64(len(this.aliens)) ; idx++ {
    alien := this.aliens[idx];
    if  alien.wasAlive {
      var moved bool= false;
      if  alien.prevX != alien.x {
        moved = true; 
      }
      if  alien.prevY != alien.y {
        moved = true; 
      }
      if  moved {
        var oldAx int64= alien.prevX + int64(1);
        this.eraseAt(oldAx, alien.prevY);
      }
      if  alien.alive == false {
        var killAx int64= alien.x + int64(1);
        this.eraseAt(killAx, alien.y);
      }
    }
    if  alien.alive {
      var drawX int64= alien.x + int64(1);
      this.drawAt(drawX, alien.y, "W");
    }
  }
  var idx2 int64 = 0;  
  for ; idx2 < int64(len(this.bullets)) ; idx2++ {
    bullet := this.bullets[idx2];
    if  bullet.wasActive {
      var oldBx int64= bullet.prevX + int64(1);
      this.eraseAt(oldBx, bullet.prevY);
    }
    if  bullet.active {
      var bx int64= bullet.x + int64(1);
      this.drawAt(bx, bullet.y, "|");
    }
  }
  if  this.score != this.prevScore {
    var scoreY int64= this.HEIGHT + int64(3);
    fmt.Printf("\x1b[%d;%dH", scoreY, int64(8))
    var scoreStr string= strings.Join([]string{ strconv.FormatInt(this.score, 10),"   " }, "");
    fmt.Print( scoreStr )
  }
  var endY int64= this.HEIGHT + int64(4);
  fmt.Printf("\x1b[%d;%dH", endY, int64(1))
}
func (this *Invaders) savePrevState () () {
  this.prevScore = this.score; 
  var idx int64 = 0;  
  for ; idx < int64(len(this.aliens)) ; idx++ {
    alien := this.aliens[idx];
    alien.savePrev();
  }
  var idx2 int64 = 0;  
  for ; idx2 < int64(len(this.bullets)) ; idx2++ {
    bullet := this.bullets[idx2];
    bullet.savePrev();
  }
}
func (this *Invaders) shoot () () {
  var bulletY int64= this.PLAYER_Y - int64(1);
  var bullet *Bullet= CreateNew_Bullet(this.playerX, bulletY);
  this.bullets = append(this.bullets,bullet); 
}
func (this *Invaders) moveLeft () () {
  if  this.playerX > int64(2) {
    this.playerX = this.playerX - int64(1); 
  }
}
func (this *Invaders) moveRight () () {
  var maxX int64= this.WIDTH - int64(1);
  if  this.playerX < maxX {
    this.playerX = this.playerX + int64(1); 
  }
}
func (this *Invaders) updateBullets () () {
  var idx int64 = 0;  
  for ; idx < int64(len(this.bullets)) ; idx++ {
    bullet := this.bullets[idx];
    if  bullet.active {
      bullet.y = bullet.y - int64(1); 
      if  bullet.y < int64(1) {
        bullet.active = false; 
      }
    }
  }
}
func (this *Invaders) countAlive () int64 {
  var count int64= int64(0);
  var idx int64 = 0;  
  for ; idx < int64(len(this.aliens)) ; idx++ {
    a := this.aliens[idx];
    if  a.alive {
      count = count + int64(1); 
    }
  }
  return count
}
func (this *Invaders) updateAliens () () {
  var moveFrame int64= this.frameCount % this.alienMoveDelay;
  if  moveFrame != int64(0) {
    return
  }
  var shouldMoveDown bool= false;
  var minX int64= int64(999);
  var maxX int64= int64(0);
  var idx int64 = 0;  
  for ; idx < int64(len(this.aliens)) ; idx++ {
    alien := this.aliens[idx];
    if  alien.alive {
      if  alien.x < minX {
        minX = alien.x; 
      }
      if  alien.x > maxX {
        maxX = alien.x; 
      }
    }
  }
  var rightBound int64= this.WIDTH - int64(2);
  if  this.alienDirection > int64(0) {
    if  maxX >= rightBound {
      this.alienDirection = int64(-1); 
      shouldMoveDown = true; 
    }
  } else {
    if  minX <= int64(1) {
      this.alienDirection = int64(1); 
      shouldMoveDown = true; 
    }
  }
  var idx2 int64 = 0;  
  for ; idx2 < int64(len(this.aliens)) ; idx2++ {
    alien_1 := this.aliens[idx2];
    if  alien_1.alive {
      alien_1.x = alien_1.x + this.alienDirection; 
      if  shouldMoveDown {
        alien_1.y = alien_1.y + int64(1); 
        if  alien_1.y >= this.PLAYER_Y {
          this.gameOver = true; 
        }
      }
    }
  }
  var aliveCount int64= this.countAlive();
  if  aliveCount < int64(12) {
    this.alienMoveDelay = int64(5); 
  }
  if  aliveCount < int64(6) {
    this.alienMoveDelay = int64(3); 
  }
  if  aliveCount < int64(3) {
    this.alienMoveDelay = int64(1); 
  }
}
func (this *Invaders) checkCollisions () () {
  var bidx int64 = 0;  
  for ; bidx < int64(len(this.bullets)) ; bidx++ {
    bullet := this.bullets[bidx];
    if  bullet.active {
      var aidx int64 = 0;  
      for ; aidx < int64(len(this.aliens)) ; aidx++ {
        alien := this.aliens[aidx];
        if  alien.alive {
          if  bullet.x == alien.x {
            if  bullet.y == alien.y {
              bullet.active = false; 
              alien.alive = false; 
              this.score = this.score + int64(10); 
            }
          }
        }
      }
    }
  }
}
func (this *Invaders) checkWin () () {
  var aliveCount int64= this.countAlive();
  if  aliveCount == int64(0) {
    this.gameWon = true; 
    this.gameOver = true; 
  }
}
func (this *Invaders) update () () {
  this.frameCount = this.frameCount + int64(1); 
  this.updateBullets();
  this.updateAliens();
  this.checkCollisions();
  this.checkWin();
}
func (this *Invaders) endGame () () {
  fmt.Print("\x1b[2J\x1b[H")
  fmt.Printf("\x1b[%d;%dH", int64(1), int64(1))
  if  this.gameWon {
    fmt.Println( "=== YOU WIN! ===" )
  } else {
    fmt.Println( "=== GAME OVER ===" )
  }
  var finalMsg string= strings.Join([]string{ "Final Score: ",strconv.FormatInt(this.score, 10) }, "");
  fmt.Println( finalMsg )
  fmt.Print("\x1b[?25h")
}
func (this *Invaders) gameLoop () () {
  for this.gameOver == false {
    this.savePrevState();
    this.update();
    this.render();
    var key string= func() string { select { case k := <-r_key_channel: return k; default: return "" } }();
    if  key != "" {
      this.handleKey(key);
    }
    time.Sleep(time.Duration(int64(50)) * time.Millisecond)
  }
  this.endGame();
}
func (this *Invaders) handleKey (key string) () {
  if  key == "left" {
    this.moveLeft();
  }
  if  key == "right" {
    this.moveRight();
  }
  if  key == "a" {
    this.moveLeft();
  }
  if  key == "A" {
    this.moveLeft();
  }
  if  key == "d" {
    this.moveRight();
  }
  if  key == "D" {
    this.moveRight();
  }
  if  key == " " {
    this.shoot();
  }
  if  key == "space" {
    this.shoot();
  }
  if  key == "q" {
    this.gameOver = true; 
  }
  if  key == "Q" {
    this.gameOver = true; 
  }
}
func main() {
  var game *Invaders= CreateNew_Invaders();
  fmt.Println( "=== SPACE INVADERS ===" )
  fmt.Println( "" )
  fmt.Println( "Controls:" )
  fmt.Println( "  LEFT/RIGHT - Move" )
  fmt.Println( "  SPACE      - Shoot" )
  fmt.Println( "  Q          - Quit" )
  fmt.Println( "" )
  fmt.Println( "Starting game..." )
  var key string= "";
  r_key_channel = make(chan string, 100)
  go func() {
    r_setup_raw_mode()
    for {
      if k := r_read_key(); k != "" {
        key = k
        r_key_channel <- k
        game.handleKey(key);
      }
    }
  }()
  fmt.Print("\x1b[?25l")
  game.gameLoop();
}
