/// <reference path="./game.d.ts" />
//
// Demo: background image via resources() id + backgroundImage() hook.
//
function resources() {
  return [
    { kind: "image", id: "bg", path: "game_bg_8x8.png" }
  ];
}

function backgroundImage() {
  return "bg";
}

function sprites() {
  return [
    { id: "dot", kind: "circle", rad: 4, r: 255, g: 255, b: 255 }
  ];
}

function initState() {
  return {
    entities: {
      dot: { x: 16, y: 16 }
    }
  };
}

function update(props) {
  return props.state;
}
