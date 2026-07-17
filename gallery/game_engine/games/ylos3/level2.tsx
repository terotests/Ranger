/// <reference path="../../scripting/game.d.ts" />
//
// Ylos 3 — taso 2 (köysisillat). Ladataan pushGame("level2.tsx") tasolta 1.

import { installVinesLevel } from "./level_vines";
import {
  paintLevelBg,
  levelHeight,
  buildSprites,
  makeInitState,
  runUpdate,
  playHud
} from "./ylos3_shared";

function bootLevel() {
  installVinesLevel();
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
