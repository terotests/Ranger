#![allow(unused_parens)]
#![allow(unused_mut)]
#![allow(unused_variables)]
#![allow(non_snake_case)]
#![allow(dead_code)]

#[derive(Clone)]
struct Alien { 
  x : i64, 
  y : i64, 
  prevX : i64, 
  prevY : i64, 
  alive : bool, 
  wasAlive : bool, 
}
impl Alien { 
  
  pub fn new(startX : i64, startY : i64) ->  Alien {
    let mut me = Alien { 
      x:0, 
      y:0, 
      prevX:0, 
      prevY:0, 
      alive:true, 
      wasAlive:true, 
    };
    me.x = startX;
    me.y = startY;
    me.prevX = startX;
    me.prevY = startY;
    return me;
  }
  fn savePrev(&mut self, ) -> () {
    self.prevX = self.x;
    self.prevY = self.y;
    self.wasAlive = self.alive;
  }
}
#[derive(Clone)]
struct Bullet { 
  x : i64, 
  y : i64, 
  prevX : i64, 
  prevY : i64, 
  active : bool, 
  wasActive : bool, 
}
impl Bullet { 
  
  pub fn new(startX : i64, startY : i64) ->  Bullet {
    let mut me = Bullet { 
      x:0, 
      y:0, 
      prevX:0, 
      prevY:0, 
      active:true, 
      wasActive:true, 
    };
    me.x = startX;
    me.y = startY;
    me.prevX = startX;
    me.prevY = startY;
    return me;
  }
  fn savePrev(&mut self, ) -> () {
    self.prevX = self.x;
    self.prevY = self.y;
    self.wasActive = self.active;
  }
}
#[derive(Clone)]
struct Invaders { 
  WIDTH : i64, 
  HEIGHT : i64, 
  PLAYER_Y : i64, 
  playerX : i64, 
  drawnPlayerX : i64, 
  aliens : Vec<Alien>, 
  bullets : Vec<Bullet>, 
  score : i64, 
  prevScore : i64, 
  gameOver : bool, 
  gameWon : bool, 
  alienDirection : i64, 
  frameCount : i64, 
  alienMoveDelay : i64, 
  firstRender : bool, 
}
impl Invaders { 
  
  pub fn new() ->  Invaders {
    let mut me = Invaders { 
      WIDTH:40, 
      HEIGHT:18, 
      PLAYER_Y:16, 
      playerX:20, 
      drawnPlayerX:-1, 
      aliens: Vec::new(), 
      bullets: Vec::new(), 
      score:0, 
      prevScore:0, 
      gameOver:false, 
      gameWon:false, 
      alienDirection:1, 
      frameCount:0, 
      alienMoveDelay:8, 
      firstRender:true, 
    };
    me.initAliens();
    return me;
  }
  fn initAliens(&mut self, ) -> () {
    let mut row : i64 = 0;
    while row < 3 {
      let mut col : i64 = 0;
      while col < 8 {
        let ax : i64 = (col * 4) + 4;
        let ay : i64 = row + 2;
        let mut alien : Alien = Alien::new(ax, ay);
        self.aliens.push(alien);
        col = col + 1;
      }
      row = row + 1;
    }
  }
  fn drawAt(&mut self, x : i64, y : i64, ch : String) -> () {
    print!("\x1b[{};{}H", y + 1, x + 1);
    print!("{}", ch);
  }
  fn eraseAt(&mut self, x : i64, y : i64) -> () {
    print!("\x1b[{};{}H", y + 1, x + 1);
    print!("{}", " ".to_string());
  }
  fn drawBorders(&mut self, ) -> () {
    print!("\x1b[{};{}H", 1, 1);
    let mut i : i64 = 0;
    let borderW : i64 = self.WIDTH + 2;
    while i < borderW {
      print!("{}", "=".to_string());
      i = i + 1;
    }
    let mut y : i64 = 0;
    while y < self.HEIGHT {
      print!("\x1b[{};{}H", y + 2, 1);
      print!("{}", "|".to_string());
      let rightX : i64 = self.WIDTH + 2;
      print!("\x1b[{};{}H", y + 2, rightX);
      print!("{}", "|".to_string());
      y = y + 1;
    }
    let bottomY : i64 = self.HEIGHT + 2;
    print!("\x1b[{};{}H", bottomY, 1);
    let mut j : i64 = 0;
    while j < borderW {
      print!("{}", "=".to_string());
      j = j + 1;
    }
    let scoreY : i64 = self.HEIGHT + 3;
    print!("\x1b[{};{}H", scoreY, 1);
    print!("{}", "Score:       |  Arrows=move  SPACE=shoot  Q=quit".to_string());
  }
  fn render(&mut self, ) -> () {
    if  self.firstRender {
      print!("\x1b[2J\x1b[H");
      self.drawBorders();
      self.firstRender = false;
    }
    if  self.drawnPlayerX >= 0 {
      if  self.drawnPlayerX != self.playerX {
        self.eraseAt(self.drawnPlayerX, self.PLAYER_Y);
      }
    }
    self.drawAt(self.playerX, self.PLAYER_Y, "A".to_string());
    self.drawnPlayerX = self.playerX;
    for idx in 0..self.aliens.len() {
      let mut alien = self.aliens[idx as usize].clone();
      if  alien.wasAlive {
        let mut moved : bool = false;
        if  alien.prevX != alien.x {
          moved = true;
        }
        if  alien.prevY != alien.y {
          moved = true;
        }
        if  moved {
          let oldAx : i64 = alien.prevX + 1;
          self.eraseAt(oldAx, alien.prevY);
        }
        if  alien.alive == false {
          let killAx : i64 = alien.x + 1;
          self.eraseAt(killAx, alien.y);
        }
      }
      if  alien.alive {
        let drawX : i64 = alien.x + 1;
        self.drawAt(drawX, alien.y, "W".to_string());
      }
      self.aliens[idx as usize] = alien;
    }
    for idx2 in 0..self.bullets.len() {
      let mut bullet = self.bullets[idx2 as usize].clone();
      if  bullet.wasActive {
        let oldBx : i64 = bullet.prevX + 1;
        self.eraseAt(oldBx, bullet.prevY);
      }
      if  bullet.active {
        let bx : i64 = bullet.x + 1;
        self.drawAt(bx, bullet.y, "|".to_string());
      }
      self.bullets[idx2 as usize] = bullet;
    }
    if  self.score != self.prevScore {
      let scoreY : i64 = self.HEIGHT + 3;
      print!("\x1b[{};{}H", scoreY, 8);
      let scoreStr : String = format!("{}{}", self.score, "   ".to_string());
      print!("{}", scoreStr);
    }
    let endY : i64 = self.HEIGHT + 4;
    print!("\x1b[{};{}H", endY, 1);
  }
  fn savePrevState(&mut self, ) -> () {
    self.prevScore = self.score;
    for idx in 0..self.aliens.len() {
      let mut alien = self.aliens[idx as usize].clone();
      alien.savePrev();
      self.aliens[idx as usize] = alien;
    }
    for idx2 in 0..self.bullets.len() {
      let mut bullet = self.bullets[idx2 as usize].clone();
      bullet.savePrev();
      self.bullets[idx2 as usize] = bullet;
    }
  }
  fn shoot(&mut self, ) -> () {
    let bulletY : i64 = self.PLAYER_Y - 1;
    let mut bullet : Bullet = Bullet::new(self.playerX, bulletY);
    self.bullets.push(bullet);
  }
  fn moveLeft(&mut self, ) -> () {
    if  self.playerX > 0 {
      self.playerX = self.playerX - 1;
    }
  }
  fn moveRight(&mut self, ) -> () {
    let maxX : i64 = self.WIDTH - 1;
    if  self.playerX < maxX {
      self.playerX = self.playerX + 1;
    }
  }
  fn updateBullets(&mut self, ) -> () {
    for idx in 0..self.bullets.len() {
      let mut bullet = self.bullets[idx as usize].clone();
      if  bullet.active {
        bullet.y = bullet.y - 1;
        if  bullet.y < 1 {
          bullet.active = false;
        }
      }
      self.bullets[idx as usize] = bullet;
    }
  }
  fn countAlive(&mut self, ) -> i64 {
    let mut count : i64 = 0;
    for idx in 0..self.aliens.len() {
      let mut a = self.aliens[idx as usize].clone();
      if  a.alive {
        count = count + 1;
      }
      self.aliens[idx as usize] = a;
    }
    return count;
  }
  fn updateAliens(&mut self, ) -> () {
    let moveFrame : i64 = self.frameCount % self.alienMoveDelay;
    if  moveFrame != 0 {
      return;
    }
    let mut shouldMoveDown : bool = false;
    let mut minX : i64 = 999;
    let mut maxX : i64 = 0;
    for idx in 0..self.aliens.len() {
      let mut alien = self.aliens[idx as usize].clone();
      if  alien.alive {
        if  alien.x < minX {
          minX = alien.x;
        }
        if  alien.x > maxX {
          maxX = alien.x;
        }
      }
      self.aliens[idx as usize] = alien;
    }
    let rightBound : i64 = self.WIDTH - 2;
    if  self.alienDirection > 0 {
      if  maxX >= rightBound {
        self.alienDirection = -1;
        shouldMoveDown = true;
      }
    } else {
      if  minX <= 1 {
        self.alienDirection = 1;
        shouldMoveDown = true;
      }
    }
    for idx2 in 0..self.aliens.len() {
      let mut alien_1 = self.aliens[idx2 as usize].clone();
      if  alien_1.alive {
        alien_1.x = alien_1.x + self.alienDirection;
        if  shouldMoveDown {
          alien_1.y = alien_1.y + 1;
          if  alien_1.y >= self.PLAYER_Y {
            self.gameOver = true;
          }
        }
      }
      self.aliens[idx2 as usize] = alien_1;
    }
    let aliveCount : i64 = self.countAlive();
    if  aliveCount < 12 {
      self.alienMoveDelay = 5;
    }
    if  aliveCount < 6 {
      self.alienMoveDelay = 3;
    }
    if  aliveCount < 3 {
      self.alienMoveDelay = 1;
    }
  }
  fn checkCollisions(&mut self, ) -> () {
    for bidx in 0..self.bullets.len() {
      let mut bullet = self.bullets[bidx as usize].clone();
      if  bullet.active {
        for aidx in 0..self.aliens.len() {
          let mut alien = self.aliens[aidx as usize].clone();
          if  alien.alive {
            if  bullet.x == alien.x {
              if  bullet.y == alien.y {
                bullet.active = false;
                alien.alive = false;
                self.score = self.score + 10;
              }
            }
          }
          self.aliens[aidx as usize] = alien;
        }
      }
      self.bullets[bidx as usize] = bullet;
    }
  }
  fn checkWin(&mut self, ) -> () {
    let aliveCount : i64 = self.countAlive();
    if  aliveCount == 0 {
      self.gameWon = true;
      self.gameOver = true;
    }
  }
  fn update(&mut self, ) -> () {
    self.frameCount = self.frameCount + 1;
    self.updateBullets();
    self.updateAliens();
    self.checkCollisions();
    self.checkWin();
  }
  fn endGame(&mut self, ) -> () {
    print!("\x1b[2J\x1b[H");
    print!("\x1b[{};{}H", 1, 1);
    if  self.gameWon {
      println!( "{}", "=== YOU WIN! ===".to_string() );
    } else {
      println!( "{}", "=== GAME OVER ===".to_string() );
    }
    let finalMsg : String = ["Final Score: ".to_string() , (self.score.to_string()) ].join("");
    println!( "{}", finalMsg );
    print!("\x1b[?25h");
  }
  fn gameLoop(&mut self, ) -> () {
    while self.gameOver == false {
      self.savePrevState();
      self.update();
      self.render();
      let key : String = {
        if let Some(ref recv) = *R_KEY_RECEIVER.lock().unwrap() {
          recv.try_recv().unwrap_or_default()
        } else { String::new() }
      };
      if  key != "".to_string() {
        self.handleKey(key);
      }
      std::thread::sleep(std::time::Duration::from_millis(50 as u64));
    }
    self.endGame();
  }
  fn handleKey(&mut self, key : String) -> () {
    if  key == "left".to_string() {
      self.moveLeft();
    }
    if  key == "right".to_string() {
      self.moveRight();
    }
    if  key == "a".to_string() {
      self.moveLeft();
    }
    if  key == "A".to_string() {
      self.moveLeft();
    }
    if  key == "d".to_string() {
      self.moveRight();
    }
    if  key == "D".to_string() {
      self.moveRight();
    }
    if  key == " ".to_string() {
      self.shoot();
    }
    if  key == "space".to_string() {
      self.shoot();
    }
    if  key == "q".to_string() {
      self.gameOver = true;
    }
    if  key == "Q".to_string() {
      self.gameOver = true;
    }
  }
}
fn main() {
  let mut game : Invaders = Invaders::new();
  println!( "{}", "=== SPACE INVADERS ===".to_string() );
  println!( "{}", "".to_string() );
  println!( "{}", "Controls:".to_string() );
  println!( "{}", "  LEFT/RIGHT - Move".to_string() );
  println!( "{}", "  SPACE      - Shoot".to_string() );
  println!( "{}", "  Q          - Quit".to_string() );
  println!( "{}", "".to_string() );
  println!( "{}", "Starting game...".to_string() );
  let key : String = "".to_string();
  let (r_key_sender, r_key_receiver) = std::sync::mpsc::channel::<String>();
  *R_KEY_RECEIVER.lock().unwrap() = Some(r_key_receiver);
  std::thread::spawn(move || {
    r_setup_raw_mode();
    loop {
      if let Some(k) = r_read_key() {
        if r_key_sender.send(k).is_err() { break; }
      }
    }
  });
  print!("\x1b[?25l");
  game.gameLoop();
}

use std::io::Read;
use std::sync::Mutex;

static R_KEY_RECEIVER: Mutex<Option<std::sync::mpsc::Receiver<String>>> = Mutex::new(None);

#[cfg(windows)]
fn r_setup_raw_mode() {
    // Windows: nothing needed, we use _getch() which handles raw input
}

#[cfg(unix)]
fn r_setup_raw_mode() {
    use std::process::Command;
    let _ = Command::new("stty").args(["-F", "/dev/tty", "cbreak", "min", "1", "-echo"]).status();
}

#[cfg(windows)]
fn r_read_key() -> Option<String> {
    extern "C" {
        fn _getch() -> i32;
        fn _kbhit() -> i32;
    }
    unsafe {
        if _kbhit() == 0 {
            std::thread::sleep(std::time::Duration::from_millis(10));
            return None;
        }
        let ch = _getch();
        if ch == 3 { // Ctrl+C
            print!("\x1b[?25h");
            std::process::exit(0);
        }
        if ch == 224 || ch == 0 { // Extended key
            let ch2 = _getch();
            return match ch2 {
                72 => Some("up".to_string()),
                80 => Some("down".to_string()),
                75 => Some("left".to_string()),
                77 => Some("right".to_string()),
                _ => None,
            };
        }
        if ch == 32 {
            return Some("space".to_string());
        }
        if ch == 27 {
            return Some("escape".to_string());
        }
        return Some((ch as u8 as char).to_string());
    }
}

#[cfg(unix)]
fn r_read_key() -> Option<String> {
    let mut buffer = [0u8; 3];
    let stdin = std::io::stdin();
    let mut handle = stdin.lock();
    if handle.read(&mut buffer[0..1]).is_ok() {
        if buffer[0] == 3 { // Ctrl+C
            print!("\x1b[?25h");
            std::process::exit(0);
        }
        if buffer[0] == 27 { // Escape sequence
            if handle.read(&mut buffer[1..3]).is_ok() {
                if buffer[1] == 91 {
                    return match buffer[2] {
                        65 => Some("up".to_string()),
                        66 => Some("down".to_string()),
                        67 => Some("right".to_string()),
                        68 => Some("left".to_string()),
                        _ => Some("escape".to_string()),
                    };
                }
            }
            return Some("escape".to_string());
        }
        if buffer[0] == 32 {
            return Some("space".to_string());
        }
        return Some((buffer[0] as char).to_string());
    }
    None
}

