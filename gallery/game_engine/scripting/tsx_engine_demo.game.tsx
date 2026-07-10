const COLS = 5;
const ROWS = 3;
const ALIEN_COUNT = COLS * ROWS;
const LOOP_N = 15;
const LINES = ["..XXX..", ".XXXXX.", "XXOXXX."];
const PALETTE = { r: 10, g: 20, b: 30 };

function whileLoopLen() {
  const items = [];
  let i = 0;
  while (i < LOOP_N) {
    items.push(i);
    i = i + 1;
  }
  return items.length;
}

function moduleConstSum() {
  return LOOP_N + 5;
}

function computedConst() {
  return ALIEN_COUNT;
}

function arrayConstLen() {
  return LINES.length;
}

function arrayConstFirst() {
  return LINES[0];
}

function objectConstField() {
  return PALETTE.r + PALETTE.g + PALETTE.b;
}

function whileWithModuleConst() {
  let n = 0;
  let i = 0;
  while (i < ALIEN_COUNT) {
    n = n + 1;
    i = i + 1;
  }
  return n;
}

function memberAssign() {
  const bag = {};
  bag.score = 10;
  bag.label = "ok";
  const cells = [];
  cells[2] = 7;
  return bag.score + cells[2] + bag.label.length;
}

function helperSideEffect() {
  const bag = { n: 0 };
  bumpBag(bag);
  return bag.n;
}

function bumpBag(b) {
  b.n = 1;
}

let moduleCounter = 0;

function bumpModuleCounter() {
  moduleCounter = moduleCounter + 1;
  return moduleCounter;
}

function returnFromWhile() {
  let i = 0;
  while (i < 10) {
    if (i == 5) {
      return i;
    }
    i = i + 1;
  }
  return -1;
}
