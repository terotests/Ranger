/// <reference path="../../scripting/game.d.ts" />
//
// Invaders level 1 — clear the wave to pushGame("level2.tsx").
//
// Controls: Left/Right or A/D move. Space = fire.
//
// Run: npm run engine:game-sdl:launcher → Space Invaders

import {
  buildSprites,
  makePlayState,
  playHud,
  runPlayUpdate
} from "./invaders_shared";

function resources() {
  return [
    { kind: "image", id: "bg", path: "assets/invaders_bg.png" },
    { kind: "image", id: "win", path: "assets/win2.png" }
  ];
}

function backgroundImage() {
  return "bg";
}

function sprites() {
  return buildSprites();
}

function initState() {
  return makePlayState(0, 3, "LEVEL 1");
}

function update(props) {
  return runPlayUpdate(props, 11, "level1");
}

function hud(props) {
  const s = props.state;
  return playHud(s.levelLabel, s.score1, s.score2, s.levelCleared);
}
