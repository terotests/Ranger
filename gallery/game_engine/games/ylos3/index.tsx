/// <reference path="../../scripting/game.d.ts" />
//
// Ylos 3 — taso 1 (viidakon lattia). Seuraavat tasot ladataan pushGame/loadGame.
//
// Controls: WASD / arrows + Space. Dual: P1 WASD, P2 arrows.
//
// Run: npm run engine:game-sdl:launcher → Viidakko Pomppija

import { LEVEL_FOREST } from "./levels/forest";
import {
  setLevelConfig,
  createStaticBg as paintLevelBg,
  sprites as levelSprites,
  initState as levelInitState,
  update as levelUpdate,
  hud as levelHud
} from "./ylos3_shared";

setLevelConfig(LEVEL_FOREST);

function createStaticBg() {
  paintLevelBg();
}

function sprites() {
  return levelSprites();
}

function initState() {
  return levelInitState();
}

function update(props) {
  return levelUpdate(props);
}

function hud(props) {
  return levelHud(props);
}
