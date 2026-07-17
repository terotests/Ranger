/// <reference path="../../scripting/game.d.ts" />
//
// Pac-Man — taso 3 (fortress). Lopputaso → loadGame("win.tsx").

import { installFortressLevel } from "./level_fortress";
import {
  gameScreens,
  paintLevelBg,
  buildSprites,
  makeInitState,
  runUpdate,
  playHud
} from "./pacman_shared";

function bootLevel() {
  installFortressLevel();
}

function screens() {
  return gameScreens();
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
