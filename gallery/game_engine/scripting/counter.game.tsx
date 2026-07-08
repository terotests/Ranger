/// <reference path="./game.d.ts" />
//
// Minimal while-loop demo for the TS -> Ranger -> native pipeline. Exercises
// while loops + integer locals + reassignment on both the interpreter and the
// static-compiled paths. Sums 0..4 each frame into the score field.

function sprites() {
  return [
    { id: "bar", kind: "rect", w: 4, h: 4, r: 200, g: 200, b: 255 }
  ];
}

function initState() {
  return {
    entities: { bar: { x: 0, y: 0 } },
    score1: 0
  };
}

function update(props) {
  const s = props.state;
  let n = 0;
  let i = 0;
  while (i < 5) {
    n = n + i;
    i = i + 1;
  }
  return {
    entities: { bar: { x: 0, y: 0 } },
    score1: n
  };
}
