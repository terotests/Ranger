#!/usr/bin/env node
class Alien  {
  constructor(startX, startY) {
    this.x = 0;
    this.y = 0;
    this.prevX = 0;
    this.prevY = 0;
    this.alive = true;
    this.wasAlive = true;
    this.x = startX;
    this.y = startY;
    this.prevX = startX;
    this.prevY = startY;
  }
  savePrev () {
    this.prevX = this.x;
    this.prevY = this.y;
    this.wasAlive = this.alive;
  };
}
class Bullet  {
  constructor(startX, startY) {
    this.x = 0;
    this.y = 0;
    this.prevX = 0;
    this.prevY = 0;
    this.active = true;
    this.wasActive = true;
    this.x = startX;
    this.y = startY;
    this.prevX = startX;
    this.prevY = startY;
  }
  savePrev () {
    this.prevX = this.x;
    this.prevY = this.y;
    this.wasActive = this.active;
  };
}
class Invaders  {
  constructor() {
    this.WIDTH = 40;
    this.HEIGHT = 18;
    this.PLAYER_Y = 16;
    this.playerX = 20;
    this.drawnPlayerX = -1;
    this.aliens = [];
    this.bullets = [];
    this.score = 0;
    this.prevScore = 0;
    this.gameOver = false;
    this.gameWon = false;
    this.alienDirection = 1;
    this.frameCount = 0;
    this.alienMoveDelay = 8;
    this.firstRender = true;
    this.initAliens();
  }
  initAliens () {
    let row = 0;
    while (row < 3) {
      let col = 0;
      while (col < 8) {
        const ax = (col * 4) + 4;
        const ay = row + 2;
        const alien = new Alien(ax, ay);
        this.aliens.push(alien);
        col = col + 1;
      };
      row = row + 1;
    };
  };
  drawAt (x, y, ch) {
    process.stdout.write(`\x1b[${y + 1};${x + 1}H`);
    process.stdout.write(ch);
  };
  eraseAt (x, y) {
    process.stdout.write(`\x1b[${y + 1};${x + 1}H`);
    process.stdout.write(" ");
  };
  drawBorders () {
    process.stdout.write(`\x1b[${1};${1}H`);
    let i = 0;
    const borderW = this.WIDTH + 2;
    while (i < borderW) {
      process.stdout.write("=");
      i = i + 1;
    };
    let y = 0;
    while (y < this.HEIGHT) {
      process.stdout.write(`\x1b[${y + 2};${1}H`);
      process.stdout.write("|");
      const rightX = this.WIDTH + 2;
      process.stdout.write(`\x1b[${y + 2};${rightX}H`);
      process.stdout.write("|");
      y = y + 1;
    };
    const bottomY = this.HEIGHT + 2;
    process.stdout.write(`\x1b[${bottomY};${1}H`);
    let j = 0;
    while (j < borderW) {
      process.stdout.write("=");
      j = j + 1;
    };
    const scoreY = this.HEIGHT + 3;
    process.stdout.write(`\x1b[${scoreY};${1}H`);
    process.stdout.write("Score:       |  Arrows=move  SPACE=shoot  Q=quit");
  };
  render () {
    if ( this.firstRender ) {
      process.stdout.write("\x1b[2J\x1b[H");
      this.drawBorders();
      this.firstRender = false;
    }
    if ( this.drawnPlayerX >= 0 ) {
      if ( this.drawnPlayerX != this.playerX ) {
        this.eraseAt(this.drawnPlayerX, this.PLAYER_Y);
      }
    }
    this.drawAt(this.playerX, this.PLAYER_Y, "A");
    this.drawnPlayerX = this.playerX;
    for ( let idx = 0; idx < this.aliens.length; idx++) {
      var alien = this.aliens[idx];
      if ( alien.wasAlive ) {
        let moved = false;
        if ( alien.prevX != alien.x ) {
          moved = true;
        }
        if ( alien.prevY != alien.y ) {
          moved = true;
        }
        if ( moved ) {
          const oldAx = alien.prevX + 1;
          this.eraseAt(oldAx, alien.prevY);
        }
        if ( alien.alive == false ) {
          const killAx = alien.x + 1;
          this.eraseAt(killAx, alien.y);
        }
      }
      if ( alien.alive ) {
        const drawX = alien.x + 1;
        this.drawAt(drawX, alien.y, "W");
      }
    };
    for ( let idx2 = 0; idx2 < this.bullets.length; idx2++) {
      var bullet = this.bullets[idx2];
      if ( bullet.wasActive ) {
        const oldBx = bullet.prevX + 1;
        this.eraseAt(oldBx, bullet.prevY);
      }
      if ( bullet.active ) {
        const bx = bullet.x + 1;
        this.drawAt(bx, bullet.y, "|");
      }
    };
    if ( this.score != this.prevScore ) {
      const scoreY = this.HEIGHT + 3;
      process.stdout.write(`\x1b[${scoreY};${8}H`);
      const scoreStr = this.score + "   ";
      process.stdout.write(scoreStr);
    }
    const endY = this.HEIGHT + 4;
    process.stdout.write(`\x1b[${endY};${1}H`);
  };
  savePrevState () {
    this.prevScore = this.score;
    for ( let idx = 0; idx < this.aliens.length; idx++) {
      var alien = this.aliens[idx];
      alien.savePrev();
    };
    for ( let idx2 = 0; idx2 < this.bullets.length; idx2++) {
      var bullet = this.bullets[idx2];
      bullet.savePrev();
    };
  };
  shoot () {
    const bulletY = this.PLAYER_Y - 1;
    const bullet = new Bullet(this.playerX, bulletY);
    this.bullets.push(bullet);
  };
  moveLeft () {
    if ( this.playerX > 2 ) {
      this.playerX = this.playerX - 1;
    }
  };
  moveRight () {
    const maxX = this.WIDTH - 1;
    if ( this.playerX < maxX ) {
      this.playerX = this.playerX + 1;
    }
  };
  updateBullets () {
    for ( let idx = 0; idx < this.bullets.length; idx++) {
      var bullet = this.bullets[idx];
      if ( bullet.active ) {
        bullet.y = bullet.y - 1;
        if ( bullet.y < 1 ) {
          bullet.active = false;
        }
      }
    };
  };
  countAlive () {
    let count = 0;
    for ( let idx = 0; idx < this.aliens.length; idx++) {
      var a = this.aliens[idx];
      if ( a.alive ) {
        count = count + 1;
      }
    };
    return count;
  };
  updateAliens () {
    const moveFrame = this.frameCount % this.alienMoveDelay;
    if ( moveFrame != 0 ) {
      return;
    }
    let shouldMoveDown = false;
    let minX = 999;
    let maxX = 0;
    for ( let idx = 0; idx < this.aliens.length; idx++) {
      var alien = this.aliens[idx];
      if ( alien.alive ) {
        if ( alien.x < minX ) {
          minX = alien.x;
        }
        if ( alien.x > maxX ) {
          maxX = alien.x;
        }
      }
    };
    const rightBound = this.WIDTH - 2;
    if ( this.alienDirection > 0 ) {
      if ( maxX >= rightBound ) {
        this.alienDirection = -1;
        shouldMoveDown = true;
      }
    } else {
      if ( minX <= 1 ) {
        this.alienDirection = 1;
        shouldMoveDown = true;
      }
    }
    for ( let idx2 = 0; idx2 < this.aliens.length; idx2++) {
      var alien_1 = this.aliens[idx2];
      if ( alien_1.alive ) {
        alien_1.x = alien_1.x + this.alienDirection;
        if ( shouldMoveDown ) {
          alien_1.y = alien_1.y + 1;
          if ( alien_1.y >= this.PLAYER_Y ) {
            this.gameOver = true;
          }
        }
      }
    };
    const aliveCount = this.countAlive();
    if ( aliveCount < 12 ) {
      this.alienMoveDelay = 5;
    }
    if ( aliveCount < 6 ) {
      this.alienMoveDelay = 3;
    }
    if ( aliveCount < 3 ) {
      this.alienMoveDelay = 1;
    }
  };
  checkCollisions () {
    for ( let bidx = 0; bidx < this.bullets.length; bidx++) {
      var bullet = this.bullets[bidx];
      if ( bullet.active ) {
        for ( let aidx = 0; aidx < this.aliens.length; aidx++) {
          var alien = this.aliens[aidx];
          if ( alien.alive ) {
            if ( bullet.x == alien.x ) {
              if ( bullet.y == alien.y ) {
                bullet.active = false;
                alien.alive = false;
                this.score = this.score + 10;
              }
            }
          }
        };
      }
    };
  };
  checkWin () {
    const aliveCount = this.countAlive();
    if ( aliveCount == 0 ) {
      this.gameWon = true;
      this.gameOver = true;
    }
  };
  update () {
    this.frameCount = this.frameCount + 1;
    this.updateBullets();
    this.updateAliens();
    this.checkCollisions();
    this.checkWin();
  };
  endGame () {
    process.stdout.write("\x1b[2J\x1b[H");
    process.stdout.write(`\x1b[${1};${1}H`);
    if ( this.gameWon ) {
      console.log("=== YOU WIN! ===");
    } else {
      console.log("=== GAME OVER ===");
    }
    const finalMsg = "Final Score: " + this.score;
    console.log(finalMsg);
    process.stdout.write("\x1b[?25h");
  };
  async gameLoop () {
    while (this.gameOver == false) {
      this.savePrevState();
      this.update();
      this.render();
      const key = (global.r_key_queue && global.r_key_queue.length > 0 ? global.r_key_queue.shift() : "");
      if ( key != "" ) {
        this.handleKey(key);
      }
      await new Promise(r => setTimeout(r, 50));
    };
    this.endGame();
  };
  handleKey (key) {
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
      this.gameOver = true;
    }
    if ( key == "Q" ) {
      this.gameOver = true;
    }
  };
}
/* static JavaSript main routine at the end of the JS file */
async function __js_main() {
  const game = new Invaders();
  console.log("=== SPACE INVADERS ===");
  console.log("");
  console.log("Controls:");
  console.log("  LEFT/RIGHT - Move");
  console.log("  SPACE      - Shoot");
  console.log("  Q          - Quit");
  console.log("");
  console.log("Starting game...");
  const key = "";
  global.r_key_queue = [];
  const readline = require('readline');
  readline.emitKeypressEvents(process.stdin);
  if (process.stdin.isTTY) { process.stdin.setRawMode(true); }
  process.stdin.on('keypress', (key, data) => {
    if (data && data.ctrl && data.name === 'c') { process.stdout.write('\x1b[?25h'); process.exit(); }
    if (data && data.name) { key = data.name; global.r_key_queue.push(key); }
    game.handleKey(key);
  });
  process.stdout.write("\x1b[?25l");
  await game.gameLoop();
}
__js_main();
