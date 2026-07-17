/// <reference path="../../scripting/game.d.ts" />
//
// Ylos 3 — taso 1 (viidakon lattia). Seuraavat tasot: pushGame("level2.tsx").
//
// Controls: WASD / arrows + Space. Dual: P1 WASD, P2 arrows.
//
// Run: npm run engine:game-sdl:launcher → Viidakko Pomppija

import { installForestLevel } from "./level_forest";
import {
  paintLevelBg,
  levelHeight,
  buildSprites,
  makeInitState,
  runUpdate,
  playHud
} from "./ylos3_shared";

function bootLevel() {
  installForestLevel();
}

function staticLevelHeight() {
  bootLevel();
  return levelHeight();
}

function createStaticBg() {
  bootLevel();
  paintLevelBg();
}

function sprites() {
  bootLevel();
  return buildSprites();
}

function initState() {
  bootLevel();
  return makeInitState();
}

function update(props) {
  return runUpdate(props);
}

function hud(props) {
  return playHud(props);
}
