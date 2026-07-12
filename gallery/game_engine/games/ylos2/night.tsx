/// <reference path="../../scripting/game.d.ts" />
//
// Ylos 2 — yökiipeily. Tummempi taivas, kapeammat lautat, nopeammat liikkuvat alustat.
// Ladataan pushGame("night.tsx") päivätasolta. Pisteet säilyvät gamedata.jsonissa.

import {
  setupYlos2Game,
  initState as coreInitState,
  update as coreUpdate,
  hud as coreHud,
  sprites as coreSprites,
  createStaticBg as coreCreateStaticBg,
  staticLevelHeight as coreStaticLevelHeight
} from "./ylos2_shared";
import { NIGHT_LEVEL } from "./ylos2_level_night";

setupYlos2Game(NIGHT_LEVEL, { carryScores: true });

function initState() {
  return coreInitState();
}

function update(props) {
  return coreUpdate(props);
}

function hud(props) {
  return coreHud(props);
}

function sprites() {
  return coreSprites();
}

function createStaticBg() {
  return coreCreateStaticBg();
}

function staticLevelHeight() {
  return coreStaticLevelHeight();
}
