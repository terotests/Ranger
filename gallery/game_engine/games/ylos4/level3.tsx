/// <reference path="../../scripting/game.d.ts" />
//
// Ylos 4 — taso 3 (temppelin laskut). Lopputaso — Space → loadGame("index.tsx").

import { installTempleLevel } from "./level_temple";
import {
  paintLevelBg,
  levelHeight,
  buildSprites,
  makeInitState,
  runUpdate,
  playHud
} from "./ylos4_shared";

function bootLevel() {
  installTempleLevel();
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
