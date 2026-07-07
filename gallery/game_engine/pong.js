#!/usr/bin/env node
class Buttons  {
  constructor() {
    this.up = false;
    this.down = false;
    this.action = false;
    this.quit = false;
  }
  reset () {
    this.up = false;
    this.down = false;
    this.action = false;
    this.quit = false;
  };
}
class Pong  {
  constructor() {
    this.W = 60;
    this.H = 24;
    this.PADDLE_H = 5;
    this.STEP = 3;
    this.leftY = 9;
    this.rightY = 9;
    this.ballX = 30;
    this.ballY = 12;
    this.vxDir = 1;
    this.vyDir = 1;
    this.vxMag = 2;
    this.vyMag = 1;
    this.axAcc = 0;
    this.ayAcc = 0;
    this.leftScore = 0;
    this.rightScore = 0;
    this.running = true;
    this.frame = 0;
    this.serveDir = 1;
    this.netX = 30;
    this.netX = this.half(this.W);
    this.serveBall(1);
  }
  half (n) {
    let result = 0;
    let rem = n;
    while (rem >= 2) {
      rem = rem - 2;
      result = result + 1;
    };
    return result;
  };
  serveBall (dir) {
    this.ballX = this.netX;
    this.ballY = this.half(this.H);
    this.vxDir = dir;
    this.vyDir = this.serveDir;
    this.vxMag = 2;
    this.vyMag = 1;
    this.axAcc = 0;
    this.ayAcc = 0;
    this.serveDir = 0 - this.serveDir;
  };
  clampPaddle (y) {
    const maxY = (this.H - 1) - this.PADDLE_H;
    if ( y < 1 ) {
      return 1;
    }
    if ( y > maxY ) {
      return maxY;
    }
    return y;
  };
  bounceFrom (paddleTop) {
    const center = paddleTop + 2;
    const offset = this.ballY - center;
    if ( offset < 0 ) {
      this.vyDir = -1;
      this.vyMag = 0 - offset;
    } else {
      this.vyDir = 1;
      this.vyMag = offset;
    }
    if ( this.vyMag > 2 ) {
      this.vyMag = 2;
    }
    if ( this.vyMag < 1 ) {
      this.vyMag = 1;
    }
  };
  stepAI () {
    const target = this.ballY - 2;
    if ( this.rightY < target ) {
      this.rightY = this.rightY + 1;
    }
    if ( this.rightY > target ) {
      this.rightY = this.rightY - 1;
    }
    this.rightY = this.clampPaddle(this.rightY);
  };
  moveBall () {
    this.axAcc = this.axAcc + this.vxMag;
    while (this.axAcc >= this.STEP) {
      this.axAcc = this.axAcc - this.STEP;
      this.ballX = this.ballX + this.vxDir;
      this.resolveHorizontal();
    };
    this.ayAcc = this.ayAcc + this.vyMag;
    while (this.ayAcc >= this.STEP) {
      this.ayAcc = this.ayAcc - this.STEP;
      this.ballY = this.ballY + this.vyDir;
      this.resolveVertical();
    };
  };
  resolveVertical () {
    if ( this.ballY <= 1 ) {
      this.ballY = 1;
      this.vyDir = 1;
    }
    const bottom = this.H - 2;
    if ( this.ballY >= bottom ) {
      this.ballY = bottom;
      this.vyDir = -1;
    }
  };
  resolveHorizontal () {
    if ( this.ballX <= 2 ) {
      const hitLeft = (this.ballY >= this.leftY) && (this.ballY < (this.leftY + this.PADDLE_H));
      if ( hitLeft ) {
        this.ballX = 2;
        this.vxDir = 1;
        this.vxMag = 2;
        this.bounceFrom(this.leftY);
      } else {
        this.rightScore = this.rightScore + 1;
        this.serveBall(-1);
      }
    }
    const rightCol = this.W - 3;
    if ( this.ballX >= rightCol ) {
      const hitRight = (this.ballY >= this.rightY) && (this.ballY < (this.rightY + this.PADDLE_H));
      if ( hitRight ) {
        this.ballX = rightCol;
        this.vxDir = -1;
        this.vxMag = 2;
        this.bounceFrom(this.rightY);
      } else {
        this.leftScore = this.leftScore + 1;
        this.serveBall(1);
      }
    }
  };
  step (input) {
    if ( input.quit ) {
      this.running = false;
      return;
    }
    this.frame = this.frame + 1;
    if ( input.up ) {
      this.leftY = this.clampPaddle((this.leftY - 1));
    }
    if ( input.down ) {
      this.leftY = this.clampPaddle((this.leftY + 1));
    }
    this.stepAI();
    this.moveBall();
  };
  cellAt (x, y) {
    if ( y == 0 ) {
      return "=";
    }
    if ( y == (this.H - 1) ) {
      return "=";
    }
    if ( (x == this.ballX) && (y == this.ballY) ) {
      return "O";
    }
    if ( x == 1 ) {
      if ( (y >= this.leftY) && (y < (this.leftY + this.PADDLE_H)) ) {
        return "#";
      }
    }
    if ( x == (this.W - 2) ) {
      if ( (y >= this.rightY) && (y < (this.rightY + this.PADDLE_H)) ) {
        return "#";
      }
    }
    if ( x == this.netX ) {
      const even = (y % 2) == 0;
      if ( even ) {
        return ":";
      }
    }
    return " ";
  };
}
class Terminal  {
  constructor() {
    this.firstFrame = true;     /** note: unused */
    this.showDebug = false;
  }
  init () {
    process.stdout.write("\x1b[?25l");
    process.stdout.write("\x1b[2J\x1b[H");
  };
  shutdown () {
    process.stdout.write("\x1b[?25h");
    process.stdout.write(`\x1b[${24 + 3};${1}H`);
  };
  readInput (btns) {
    btns.reset();
    let key = (global.r_key_queue && global.r_key_queue.length > 0 ? global.r_key_queue.shift() : "");
    while (key != "") {
      this.applyKey(key, btns);
      key = (global.r_key_queue && global.r_key_queue.length > 0 ? global.r_key_queue.shift() : "");
    };
  };
  applyKey (key, btns) {
    if ( key == "w" ) {
      btns.up = true;
    }
    if ( key == "W" ) {
      btns.up = true;
    }
    if ( key == "up" ) {
      btns.up = true;
    }
    if ( key == "s" ) {
      btns.down = true;
    }
    if ( key == "S" ) {
      btns.down = true;
    }
    if ( key == "down" ) {
      btns.down = true;
    }
    if ( key == " " ) {
      btns.action = true;
    }
    if ( key == "space" ) {
      btns.action = true;
    }
    if ( key == "q" ) {
      btns.quit = true;
    }
    if ( key == "Q" ) {
      btns.quit = true;
    }
    if ( key == "d" ) {
      this.toggleDebug();
    }
    if ( key == "D" ) {
      this.toggleDebug();
    }
  };
  toggleDebug () {
    if ( this.showDebug ) {
      this.showDebug = false;
    } else {
      this.showDebug = true;
    }
  };
  renderDebug (game) {
    const hudY = game.H + 2;
    process.stdout.write(`\x1b[${hudY};${1}H`);
    let dbg = "  DEBUG f=" + game.frame;
    dbg = dbg + " ball=(";
    dbg = dbg + game.ballX;
    dbg = dbg + ",";
    dbg = dbg + game.ballY;
    dbg = dbg + ") vx=";
    dbg = dbg + game.vxDir;
    dbg = dbg + " vyDir=";
    dbg = dbg + game.vyDir;
    dbg = dbg + " vyMag=";
    dbg = dbg + game.vyMag;
    dbg = dbg + " lY=";
    dbg = dbg + game.leftY;
    dbg = dbg + " rY=";
    dbg = dbg + game.rightY;
    dbg = dbg + "        ";
    process.stdout.write(dbg);
  };
  render (game) {
    let y = 0;
    while (y < game.H) {
      process.stdout.write(`\x1b[${y + 1};${1}H`);
      let line = "";
      let x = 0;
      while (x < game.W) {
        const ch = game.cellAt(x, y);
        line = line + ch;
        x = x + 1;
      };
      process.stdout.write(line);
      y = y + 1;
    };
    const statusY = game.H + 1;
    process.stdout.write(`\x1b[${statusY};${1}H`);
    let status = "  P1 " + game.leftScore;
    status = status + "   -   CPU ";
    status = status + game.rightScore;
    status = status + "     [W/S move  D debug  Q quit]      ";
    process.stdout.write(status);
    if ( this.showDebug ) {
      this.renderDebug(game);
    } else {
      const hudY = game.H + 2;
      process.stdout.write(`\x1b[${hudY};${1}H`);
      process.stdout.write("                                                            ");
    }
  };
  async run (game, btns) {
    this.init();
    while (game.running) {
      this.readInput(btns);
      game.step(btns);
      this.render(game);
      await new Promise(r => setTimeout(r, 40));
    };
    this.shutdown();
  };
}
/* static JavaSript main routine at the end of the JS file */
async function __js_main() {
  const game = new Pong();
  const term = new Terminal();
  const btns = new Buttons();
  console.log("=== RANGER PONG (engine base) ===");
  console.log("Move your paddle with W / S. Press Q to quit.");
  console.log("Starting...");
  const key = "";
  global.r_key_queue = [];
  const readline = require('readline');
  readline.emitKeypressEvents(process.stdin);
  if (process.stdin.isTTY) { process.stdin.setRawMode(true); }
  process.stdin.resume();
  process.stdin.on('keypress', (str, key) => {
    if (key && key.ctrl && key.name === 'c') { process.stdout.write('\x1b[?25h'); process.exit(); }
    var __rgr_k = "";
    if (key && key.name) { __rgr_k = key.name; } else if (str && str.length > 0) { __rgr_k = str; } else if (key && key.sequence) { __rgr_k = key.sequence; }
    if (__rgr_k !== "") { key = __rgr_k; global.r_key_queue.push(__rgr_k); }
  });
  await term.run(game, btns);
  console.log("=== GAME OVER ===");
  let finalMsg = "Final score  P1 " + game.leftScore;
  finalMsg = finalMsg + "  CPU ";
  finalMsg = finalMsg + game.rightScore;
  console.log(finalMsg);
}
__js_main();
