// Taso 2 — köysilaskut: isompia yhteenlaskuja, kapeammat lankut.
import { setLevelConfig } from "./ylos4_shared";

export function installVinesLevel() {
  setLevelConfig({
  id: "vines",
  label: "Taso 2 — Köysilaskut",
  worldH: 2100,
  platColors: {
    body: { r: 64, g: 98, b: 52 },
    top: { r: 100, g: 210, b: 110 },
    bottom: { r: 38, g: 72, b: 34 }
  },
  bgKind: "jungle_mist",
  movingPlatSpeed: 0.085,
  enemySpeed: 0.1,
  music:
    "tempo 148\n" +
    "beats 4/4\n" +
    "\n" +
    "@melody flute\n" +
    "0.5:A3 0.5:C4 1:E4 0.5:G4 0.5:E4\n" +
    "0.5:D4 0.5:F4 1:A4 2:F4\n" +
    "0.5:C4 0.5:E4 1:G4 1:B4\n" +
    "1:A4 1:G4 2:E4\n",
  nextLevel: "level3.tsx",
  isFinal: false,
  platforms: [
    { x: 0, y: 2040, w: 480, h: 60 },
    { x: 20, y: 1910, w: 130, h: 12 },
    { x: 200, y: 1910, w: 130, h: 12 },
    { x: 380, y: 1910, w: 80, h: 12 },
    { x: 90, y: 1840, w: 75, h: 12 },
    { x: 280, y: 1840, w: 75, h: 12 },
    // Between puzzle 1 and 2
    { x: 160, y: 1660, w: 160, h: 12 },
    { x: 30, y: 1535, w: 90, h: 12 },
    { x: 340, y: 1535, w: 90, h: 12 },
    { x: 120, y: 1470, w: 70, h: 12 },
    { x: 290, y: 1470, w: 70, h: 12 },
    { x: 200, y: 1345, w: 80, h: 12 },
    { x: 40, y: 1220, w: 85, h: 12 },
    { x: 350, y: 1220, w: 85, h: 12 },
    // Between puzzle 2 and 3
    { x: 185, y: 1035, w: 110, h: 12 },
    { x: 55, y: 910, w: 80, h: 12 },
    { x: 345, y: 910, w: 80, h: 12 },
    { x: 140, y: 785, w: 70, h: 12 },
    { x: 270, y: 785, w: 70, h: 12 },
    { x: 195, y: 660, w: 90, h: 12 },
    { x: 35, y: 535, w: 85, h: 12 },
    { x: 360, y: 535, w: 85, h: 12 },
    { x: 150, y: 410, w: 75, h: 12 },
    { x: 255, y: 410, w: 75, h: 12 },
    { x: 175, y: 200, w: 130, h: 18 }
  ],
  movingPlatforms: [
    { x: 40, y: 1755, w: 70, h: 12, min: 25, max: 180, dir: 1 },
    { x: 300, y: 1755, w: 70, h: 12, min: 260, max: 410, dir: -1 },
    { x: 100, y: 1285, w: 60, h: 12, min: 50, max: 320, dir: 1 },
    { x: 280, y: 1285, w: 60, h: 12, min: 120, max: 390, dir: -1 },
    { x: 55, y: 845, w: 65, h: 12, min: 35, max: 270, dir: 1 },
    { x: 325, y: 845, w: 65, h: 12, min: 190, max: 430, dir: -1 },
    { x: 80, y: 285, w: 60, h: 12, min: 40, max: 300, dir: 1 }
  ],
  enemyDefs: [
    { x: 35, y: 1910, dir: 1, min: 25, max: 95 },
    { x: 210, y: 1910, dir: -1, min: 205, max: 320 },
    { x: 175, y: 1660, dir: 1, min: 165, max: 310 },
    { x: 40, y: 1535, dir: 1, min: 35, max: 115 },
    { x: 350, y: 1535, dir: -1, min: 345, max: 425 },
    { x: 45, y: 1220, dir: 1, min: 40, max: 120 },
    { x: 355, y: 1220, dir: -1, min: 350, max: 430 },
    { x: 60, y: 910, dir: 1, min: 55, max: 130 },
    { x: 350, y: 910, dir: -1, min: 345, max: 420 },
    { x: 155, y: 535, dir: 1, min: 40, max: 115 },
    { x: 265, y: 410, dir: -1, min: 260, max: 325 }
  ],
  fruitDefs: [
    { x: 55, y: 1885 },
    { x: 235, y: 1885 },
    { x: 400, y: 1885 },
    { x: 205, y: 1635 },
    { x: 205, y: 1320 },
    { x: 100, y: 1010 },
    { x: 300, y: 1010 },
    { x: 200, y: 635 },
    { x: 190, y: 255 }
  ],
  diamondDefs: [
    { x: 240, y: 1750, respawn: false, puzzle: 0 },
    { x: 240, y: 1140, respawn: false, puzzle: 1 },
    { x: 240, y: 580, respawn: false, puzzle: 2 }
  ],
  mathPuzzles: [
    {
      a: 6,
      b: 7,
      qx: 145,
      qy: 1788,
      answers: [
        { x: 30, y: 1795, w: 95, h: 12, value: 14 },
        { x: 190, y: 1795, w: 95, h: 12, value: 12 },
        { x: 350, y: 1795, w: 95, h: 12, value: 13 }
      ],
      correct: 13
    },
    {
      a: 8,
      b: 5,
      qx: 150,
      qy: 1178,
      answers: [
        { x: 30, y: 1185, w: 95, h: 12, value: 13 },
        { x: 190, y: 1185, w: 95, h: 12, value: 14 },
        { x: 350, y: 1185, w: 95, h: 12, value: 12 }
      ],
      correct: 13
    },
    {
      a: 9,
      b: 4,
      qx: 150,
      qy: 618,
      answers: [
        { x: 30, y: 625, w: 95, h: 12, value: 12 },
        { x: 190, y: 625, w: 95, h: 12, value: 14 },
        { x: 350, y: 625, w: 95, h: 12, value: 13 }
      ],
      correct: 13
    }
  ]
  });
}
