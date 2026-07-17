/// <reference path="../../scripting/game.d.ts" />
//
// Ylos 3 — taso 2 (köysisillat). Ladataan pushGame("level2.tsx") tasolta 1.

import { LEVEL_VINES } from "./levels/vines";
import {
  setLevelConfig,
  createStaticBg as paintLevelBg,
  sprites as levelSprites,
  initState as levelInitState,
  update as levelUpdate,
  hud as levelHud
} from "./ylos3_shared";

setLevelConfig(LEVEL_VINES);

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
