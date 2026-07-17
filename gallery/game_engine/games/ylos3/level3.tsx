/// <reference path="../../scripting/game.d.ts" />
//
// Ylos 3 — taso 3 (temppelin huippu). Lopputaso — voiton jälkeen loadGame("index.tsx").

import { LEVEL_TEMPLE } from "./levels/temple";
import {
  setLevelConfig,
  createStaticBg as paintLevelBg,
  sprites as levelSprites,
  initState as levelInitState,
  update as levelUpdate,
  hud as levelHud
} from "./ylos3_shared";

setLevelConfig(LEVEL_TEMPLE);

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
