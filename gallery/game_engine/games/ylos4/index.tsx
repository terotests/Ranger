/// <reference path="../../scripting/game.d.ts" />
//
// Ylos 4 — taso 1 (viidakon laskut). Hyppää oikeaan vastaukseen → timantti.
// Seuraavat tasot: pushGame("level2.tsx").
//
// Controls: WASD / arrows + Space. Dual: P1 WASD, P2 arrows.
//
// Run: npm run engine:game-sdl:run:ylos4

import { installForestLevel } from "./level_forest";
import {
  paintLevelBg,
  levelHeight,
  buildSprites,
  makeInitState,
  runUpdate,
  playHud
} from "./ylos4_shared";

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
