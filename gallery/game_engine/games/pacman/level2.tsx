/// <reference path="../../scripting/game.d.ts" />
//
// Pac-Man — taso 2 (garden). Ladataan pushGame("level2.tsx") tasolta 1.

import { installGardenLevel } from "./level_garden";
import {
  gameScreens,
  paintLevelBg,
  buildSprites,
  makeInitState,
  runUpdate,
  playHud
} from "./pacman_shared";

function bootLevel() {
  installGardenLevel();
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
