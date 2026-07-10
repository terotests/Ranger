/// <reference path="../../scripting/game.d.ts" />
//
// Invaders victory screen — same image.png backdrop. Space → popGame (menu).

function resources() {
  return [
    { kind: "image", id: "bg", path: "assets/win2.png" }
  ];
}

function backgroundImage() {
  return "bg";
}

function sprites() {
  return [];
}

function readScore(data, key, fallback) {
  const v = data[key];
  if (v == null) {
    return fallback;
  }
  return v;
}

function initState() {
  const data = loadGameData();
  return {
    score1: readScore(data, "score1", 0),
    score2: readScore(data, "score2", 0)
  };
}

function update(props) {
  if (props.action) {
    popGame();
  }
  return props.state;
}

function hud(props) {
  const s = props.state;
  return (
    <View width="100%" height="100%" flexDirection="column" justifyContent="center" align="center">
      <Label color="#fff060">YOU WIN</Label>
      <Label color="#8fd3ff">SCORE {s.score1}</Label>
      <Label color="#aaaaaa">SPACE MENU</Label>
    </View>
  );
}
