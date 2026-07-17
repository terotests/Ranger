/// <reference path="../../scripting/game.d.ts" />
//
// Pac-Man — taso 1 (avenue). Seuraavat tasot: pushGame("level2.tsx").
//
// Controls: arrows / WASD. Split-screen: game.info splitScreen=auto.
//
// Run: npm run engine:game-sdl:launcher → Pac-Man

import { installAvenueLevel } from "./level_avenue";
import {
  gameScreens,
  paintLevelBg,
  buildSprites,
  makeInitState,
  runUpdate,
  playHud
} from "./pacman_shared";

function bootLevel() {
  installAvenueLevel();
}

function screens() {
  return gameScreens();
}

function createStaticBg() {
  bootLevel();
  bgClear(12, 16, 32);
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
