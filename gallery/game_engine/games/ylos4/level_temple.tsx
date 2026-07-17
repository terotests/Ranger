// Taso 3 — temppelin laskut: tiukempia yhteenlaskuja, kultainen maali.
import { setLevelConfig } from "./ylos4_shared";

export function installTempleLevel() {
  setLevelConfig({
  id: "temple",
  label: "Taso 3 — Temppelin laskut",
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
    { x: 70, y: 2030, w: 55, h: 11 },
    { x: 200, y: 2030, w: 80, h: 11 },
    { x: 350, y: 2030, w: 55, h: 11 },
    // Between puzzles
    { x: 130, y: 1845, w: 60, h: 11 },
    { x: 290, y: 1845, w: 60, h: 11 },
    { x: 40, y: 1720, w: 55, h: 11 },
    { x: 385, y: 1720, w: 55, h: 11 },
    { x: 175, y: 1720, w: 130, h: 11 },
    { x: 90, y: 1655, w: 50, h: 11 },
    { x: 340, y: 1655, w: 50, h: 11 },
    { x: 210, y: 1530, w: 60, h: 11 },
    { x: 55, y: 1405, w: 55, h: 11 },
    { x: 370, y: 1405, w: 55, h: 11 },
    { x: 160, y: 1280, w: 50, h: 11 },
    { x: 270, y: 1280, w: 50, h: 11 },
    { x: 200, y: 1215, w: 80, h: 11 },
    { x: 30, y: 1030, w: 55, h: 11 },
    { x: 395, y: 1030, w: 55, h: 11 },
    { x: 140, y: 905, w: 50, h: 11 },
    { x: 290, y: 905, w: 50, h: 11 },
    { x: 210, y: 780, w: 60, h: 11 },
    { x: 60, y: 655, w: 55, h: 11 },
    { x: 365, y: 655, w: 55, h: 11 },
    { x: 175, y: 530, w: 50, h: 11 },
    { x: 255, y: 530, w: 50, h: 11 },
    { x: 200, y: 405, w: 80, h: 11 },
    { x: 45, y: 280, w: 55, h: 11 },
    { x: 380, y: 280, w: 55, h: 11 },
    { x: 150, y: 200, w: 50, h: 11 },
    { x: 280, y: 200, w: 50, h: 11 },
    { x: 160, y: 130, w: 160, h: 22 }
  ],
  movingPlatforms: [
    { x: 30, y: 1970, w: 55, h: 11, min: 20, max: 160, dir: 1 },
    { x: 360, y: 1970, w: 55, h: 11, min: 280, max: 430, dir: -1 },
    { x: 80, y: 1595, w: 50, h: 11, min: 40, max: 300, dir: 1 },
    { x: 310, y: 1595, w: 50, h: 11, min: 160, max: 420, dir: -1 },
    { x: 55, y: 1095, w: 48, h: 11, min: 30, max: 270, dir: 1 },
    { x: 345, y: 1095, w: 48, h: 11, min: 190, max: 430, dir: -1 },
    { x: 50, y: 720, w: 48, h: 11, min: 30, max: 260, dir: 1 },
    { x: 350, y: 720, w: 48, h: 11, min: 200, max: 430, dir: -1 }
  ],
  enemyDefs: [
    { x: 20, y: 2095, dir: 1, min: 18, max: 75 },
    { x: 125, y: 2095, dir: -1, min: 120, max: 180 },
    { x: 230, y: 2095, dir: 1, min: 225, max: 285 },
    { x: 335, y: 2095, dir: -1, min: 330, max: 390 },
    { x: 180, y: 1845, dir: 1, min: 135, max: 185 },
    { x: 295, y: 1845, dir: -1, min: 290, max: 345 },
    { x: 45, y: 1720, dir: 1, min: 40, max: 90 },
    { x: 390, y: 1720, dir: -1, min: 385, max: 435 },
    { x: 60, y: 1405, dir: 1, min: 55, max: 105 },
    { x: 375, y: 1405, dir: -1, min: 370, max: 420 },
    { x: 35, y: 1030, dir: 1, min: 30, max: 80 },
    { x: 400, y: 1030, dir: -1, min: 395, max: 445 },
    { x: 65, y: 655, dir: 1, min: 60, max: 110 },
    { x: 370, y: 655, dir: -1, min: 365, max: 415 },
    { x: 50, y: 280, dir: 1, min: 45, max: 95 },
    { x: 385, y: 280, dir: -1, min: 380, max: 430 }
  ],
  fruitDefs: [
    { x: 45, y: 2070 },
    { x: 150, y: 2070 },
    { x: 255, y: 2070 },
    { x: 360, y: 2070 },
    { x: 215, y: 1695 },
    { x: 215, y: 1505 },
    { x: 215, y: 1190 },
    { x: 215, y: 755 },
    { x: 215, y: 380 },
    { x: 215, y: 175 }
  ],
  diamondDefs: [
    { x: 240, y: 1940, respawn: false, puzzle: 0 },
    { x: 240, y: 1320, respawn: false, puzzle: 1 },
    { x: 240, y: 760, respawn: false, puzzle: 2 },
    { x: 240, y: 380, respawn: false, puzzle: 3 }
  ],
  mathPuzzles: [
    {
      a: 7,
      b: 8,
      qx: 140,
      qy: 1978,
      answers: [
        { x: 25, y: 1985, w: 90, h: 11, value: 14 },
        { x: 195, y: 1985, w: 90, h: 11, value: 15 },
        { x: 365, y: 1985, w: 90, h: 11, value: 16 }
      ],
      correct: 15
    },
    {
      a: 9,
      b: 6,
      qx: 145,
      qy: 1358,
      answers: [
        { x: 25, y: 1365, w: 90, h: 11, value: 14 },
        { x: 195, y: 1365, w: 90, h: 11, value: 15 },
        { x: 365, y: 1365, w: 90, h: 11, value: 16 }
      ],
      correct: 15
    },
    {
      a: 8,
      b: 9,
      qx: 140,
      qy: 798,
      answers: [
        { x: 25, y: 805, w: 90, h: 11, value: 16 },
        { x: 195, y: 805, w: 90, h: 11, value: 17 },
        { x: 365, y: 805, w: 90, h: 11, value: 18 }
      ],
      correct: 17
    },
    {
      a: 5,
      b: 9,
      qx: 150,
      qy: 418,
      answers: [
        { x: 25, y: 425, w: 90, h: 11, value: 13 },
        { x: 195, y: 425, w: 90, h: 11, value: 14 },
        { x: 365, y: 425, w: 90, h: 11, value: 15 }
      ],
      correct: 14
    }
  ]
  });
}
