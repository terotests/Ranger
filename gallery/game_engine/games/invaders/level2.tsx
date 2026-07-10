/// <reference path="../../scripting/game.d.ts" />
//
// Invaders level 2 — faster wave, assets/image.png background.
// Loaded via pushGame from index.tsx. Clear wave → loadGame("win.tsx").
//
// Controls: Left/Right or A/D move. Space = fire.

import {
  buildSprites,
  makePlayState,
  playHud,
  runPlayUpdate
} from "./invaders_shared";

function resources() {
  return [
    { kind: "image", id: "bg", path: "assets/image.png" },
    { kind: "image", id: "win", path: "assets/win2.png" }
  ];
}

function backgroundImage() {
  return "bg";
}

function sprites() {
  return buildSprites();
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
  const score1 = readScore(data, "score1", 0);
  const score2 = readScore(data, "score2", 3);
  return makePlayState(score1, score2, "LEVEL 2");
}

function update(props) {
  return runPlayUpdate(props, 7, "level2");
}

function hud(props) {
  const s = props.state;
  return playHud(s.levelLabel, s.score1, s.score2, s.levelCleared);
}
