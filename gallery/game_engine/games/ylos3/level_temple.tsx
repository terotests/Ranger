// Taso 3 — temppelin huippu: tiukat hypyt, nopeat viholliset, kultainen maali.
import { setLevelConfig } from "./ylos3_shared";

export function installTempleLevel() {
  setLevelConfig({
  id: "temple",
  label: "Taso 3 — Temppelin huippu",
  worldH: 2280,
  platColors: {
    body: { r: 118, g: 88, b: 48 },
    top: { r: 210, g: 180, b: 90 },
    bottom: { r: 72, g: 52, b: 28 }
  },
  bgKind: "jungle_temple",
  movingPlatSpeed: 0.1,
  enemySpeed: 0.12,
  music:
    "tempo 156\n" +
    "beats 4/4\n" +
    "\n" +
    "@melody brass\n" +
    "0.5:E4 0.5:G4 1:B4 1:G4\n" +
    "0.5:D4 0.5:F4 1:A4 1:F4\n" +
    "0.5:E4 0.5:G4 1:B4 1:D5\n" +
    "1:C5 1:B4 2:G4\n",
  nextLevel: "",
  isFinal: true,
  platforms: [
    { x: 0, y: 2220, w: 480, h: 60 },
    { x: 15, y: 2095, w: 65, h: 11 },
    { x: 120, y: 2095, w: 65, h: 11 },
    { x: 225, y: 2095, w: 65, h: 11 },
    { x: 330, y: 2095, w: 65, h: 11 },
    { x: 400, y: 2095, w: 65, h: 11 },
    { x: 70, y: 1970, w: 55, h: 11 },
    { x: 200, y: 1970, w: 80, h: 11 },
    { x: 350, y: 1970, w: 55, h: 11 },
    { x: 130, y: 1845, w: 60, h: 11 },
    { x: 290, y: 1845, w: 60, h: 11 },
    { x: 40, y: 1720, w: 55, h: 11 },
    { x: 385, y: 1720, w: 55, h: 11 },
    { x: 175, y: 1720, w: 130, h: 11 },
    { x: 90, y: 1595, w: 50, h: 11 },
    { x: 340, y: 1595, w: 50, h: 11 },
    { x: 210, y: 1595, w: 60, h: 11 },
    { x: 55, y: 1470, w: 55, h: 11 },
    { x: 370, y: 1470, w: 55, h: 11 },
    { x: 160, y: 1345, w: 50, h: 11 },
    { x: 270, y: 1345, w: 50, h: 11 },
    { x: 200, y: 1220, w: 80, h: 11 },
    { x: 30, y: 1095, w: 55, h: 11 },
    { x: 395, y: 1095, w: 55, h: 11 },
    { x: 140, y: 970, w: 50, h: 11 },
    { x: 290, y: 970, w: 50, h: 11 },
    { x: 210, y: 845, w: 60, h: 11 },
    { x: 60, y: 720, w: 55, h: 11 },
    { x: 365, y: 720, w: 55, h: 11 },
    { x: 175, y: 595, w: 50, h: 11 },
    { x: 255, y: 595, w: 50, h: 11 },
    { x: 200, y: 470, w: 80, h: 11 },
    { x: 45, y: 345, w: 55, h: 11 },
    { x: 380, y: 345, w: 55, h: 11 },
    { x: 150, y: 220, w: 50, h: 11 },
    { x: 280, y: 220, w: 50, h: 11 },
    { x: 160, y: 130, w: 160, h: 22 }
  ],
  movingPlatforms: [
    { x: 30, y: 2030, w: 55, h: 11, min: 20, max: 160, dir: 1 },
    { x: 360, y: 2030, w: 55, h: 11, min: 280, max: 430, dir: -1 },
    { x: 50, y: 1905, w: 50, h: 11, min: 30, max: 220, dir: 1 },
    { x: 340, y: 1905, w: 50, h: 11, min: 230, max: 420, dir: -1 },
    { x: 80, y: 1780, w: 50, h: 11, min: 40, max: 300, dir: 1 },
    { x: 310, y: 1780, w: 50, h: 11, min: 160, max: 420, dir: -1 },
    { x: 45, y: 1655, w: 50, h: 11, min: 25, max: 260, dir: 1 },
    { x: 350, y: 1655, w: 50, h: 11, min: 200, max: 435, dir: -1 },
    { x: 70, y: 1530, w: 48, h: 11, min: 35, max: 290, dir: 1 },
    { x: 330, y: 1530, w: 48, h: 11, min: 170, max: 425, dir: -1 },
    { x: 55, y: 1280, w: 48, h: 11, min: 30, max: 270, dir: 1 },
    { x: 345, y: 1280, w: 48, h: 11, min: 190, max: 430, dir: -1 },
    { x: 65, y: 1030, w: 48, h: 11, min: 40, max: 280, dir: 1 },
    { x: 335, y: 1030, w: 48, h: 11, min: 180, max: 420, dir: -1 },
    { x: 50, y: 780, w: 48, h: 11, min: 30, max: 260, dir: 1 },
    { x: 350, y: 780, w: 48, h: 11, min: 200, max: 430, dir: -1 }
  ],
  enemyDefs: [
    { x: 20, y: 2095, dir: 1, min: 18, max: 75 },
    { x: 125, y: 2095, dir: -1, min: 120, max: 180 },
    { x: 230, y: 2095, dir: 1, min: 225, max: 285 },
    { x: 335, y: 2095, dir: -1, min: 330, max: 390 },
    { x: 75, y: 1970, dir: 1, min: 70, max: 120 },
    { x: 355, y: 1970, dir: -1, min: 350, max: 400 },
    { x: 180, y: 1845, dir: 1, min: 135, max: 185 },
    { x: 295, y: 1845, dir: -1, min: 290, max: 345 },
    { x: 45, y: 1720, dir: 1, min: 40, max: 90 },
    { x: 390, y: 1720, dir: -1, min: 385, max: 435 },
    { x: 95, y: 1595, dir: 1, min: 90, max: 135 },
    { x: 345, y: 1595, dir: -1, min: 340, max: 385 },
    { x: 60, y: 1470, dir: 1, min: 55, max: 105 },
    { x: 375, y: 1470, dir: -1, min: 370, max: 420 },
    { x: 35, y: 1095, dir: 1, min: 30, max: 80 },
    { x: 400, y: 1095, dir: -1, min: 395, max: 445 },
    { x: 65, y: 720, dir: 1, min: 60, max: 110 },
    { x: 370, y: 720, dir: -1, min: 365, max: 415 },
    { x: 50, y: 345, dir: 1, min: 45, max: 95 },
    { x: 385, y: 345, dir: -1, min: 380, max: 430 }
  ],
  fruitDefs: [
    { x: 45, y: 2070 },
    { x: 150, y: 2070 },
    { x: 255, y: 2070 },
    { x: 360, y: 2070 },
    { x: 215, y: 1945 },
    { x: 215, y: 1820 },
    { x: 215, y: 1695 },
    { x: 215, y: 1570 },
    { x: 215, y: 1320 },
    { x: 215, y: 1070 },
    { x: 215, y: 820 },
    { x: 215, y: 445 },
    { x: 215, y: 195 }
  ],
  diamondDefs: [
    { x: 450, y: 2170, respawn: true },
    { x: 420, y: 1720, respawn: true },
    { x: 215, y: 1445, respawn: false },
    { x: 215, y: 1195, respawn: false },
    { x: 215, y: 945, respawn: false },
    { x: 215, y: 570, respawn: false },
    { x: 215, y: 195, respawn: false }
  ]
  });
}
