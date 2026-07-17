// Taso 1 — viidakon laskut: helppoja yhteenlaskuja, leveät lankut.
import { setLevelConfig } from "./ylos4_shared";

export function installForestLevel() {
  setLevelConfig({
  id: "forest",
  label: "Taso 1 — Viidakon laskut",
  worldH: 1890,
  platColors: {
    body: { r: 110, g: 78, b: 42 },
    top: { r: 150, g: 210, b: 80 },
    bottom: { r: 68, g: 48, b: 26 }
  },
  bgKind: "jungle_floor",
  movingPlatSpeed: 0.06,
  enemySpeed: 0.08,
  music:
    "tempo 138\n" +
    "beats 4/4\n" +
    "\n" +
    "@melody marimba\n" +
    "0.5:G3 0.5:B3 1:D4 1:B3\n" +
    "0.5:A3 0.5:C4 1:E4 2:C4\n" +
    "0.5:G3 0.5:B3 1:D4 1:F4\n" +
    "1:E4 1:D4 2:B3\n",
  nextLevel: "level2.tsx",
  isFinal: false,
  platforms: [
    { x: 0, y: 1830, w: 480, h: 60 },
    { x: 40, y: 1700, w: 180, h: 14 },
    // Approach ledge before puzzle 1
    { x: 200, y: 1640, w: 95, h: 14 },
    // Between puzzles
    { x: 55, y: 1475, w: 115, h: 14 },
    { x: 250, y: 1365, w: 105, h: 14 },
    { x: 110, y: 1255, w: 95, h: 14 },
    // Approach puzzle 2
    { x: 215, y: 1195, w: 100, h: 14 },
    { x: 45, y: 980, w: 125, h: 14 },
    { x: 270, y: 870, w: 125, h: 14 },
    { x: 130, y: 760, w: 105, h: 14 },
    // Approach puzzle 3
    { x: 310, y: 700, w: 95, h: 14 },
    { x: 55, y: 480, w: 115, h: 14 },
    { x: 35, y: 265, w: 100, h: 12 },
    { x: 195, y: 155, w: 190, h: 20 }
  ],
  movingPlatforms: [
    { x: 55, y: 1085, w: 95, h: 14, min: 40, max: 300, dir: 1 },
    { x: 225, y: 590, w: 90, h: 14, min: 85, max: 325, dir: -1 },
    { x: 75, y: 375, w: 85, h: 14, min: 55, max: 275, dir: 1 }
  ],
  enemyDefs: [
    { x: 60, y: 1700, dir: 1, min: 45, max: 110 },
    { x: 70, y: 1475, dir: 1, min: 60, max: 160 },
    { x: 280, y: 1365, dir: -1, min: 255, max: 350 },
    { x: 130, y: 1255, dir: 1, min: 120, max: 200 },
    { x: 170, y: 760, dir: 1, min: 140, max: 220 },
    { x: 95, y: 265, dir: 1, min: 70, max: 155 }
  ],
  fruitDefs: [
    { x: 75, y: 1675 },
    { x: 230, y: 1615 },
    { x: 105, y: 1340 },
    { x: 155, y: 1170 },
    { x: 90, y: 240 },
    { x: 335, y: 675 }
  ],
  // puzzle: N → diamond appears only after that math puzzle is solved.
  diamondDefs: [
    { x: 240, y: 1545, respawn: false, puzzle: 0 },
    { x: 240, y: 1095, respawn: false, puzzle: 1 },
    { x: 240, y: 595, respawn: false, puzzle: 2 }
  ],
  mathPuzzles: [
    {
      a: 3,
      b: 5,
      qx: 150,
      qy: 1548,
      answers: [
        { x: 40, y: 1585, w: 100, h: 14, value: 8 },
        { x: 190, y: 1585, w: 100, h: 14, value: 7 },
        { x: 340, y: 1585, w: 100, h: 14, value: 9 }
      ],
      correct: 8
    },
    {
      a: 2,
      b: 4,
      qx: 160,
      qy: 1128,
      answers: [
        { x: 40, y: 1145, w: 100, h: 14, value: 5 },
        { x: 190, y: 1145, w: 100, h: 14, value: 7 },
        { x: 340, y: 1145, w: 100, h: 14, value: 6 }
      ],
      correct: 6
    },
    {
      a: 4,
      b: 4,
      qx: 160,
      qy: 628,
      answers: [
        { x: 40, y: 645, w: 100, h: 14, value: 9 },
        { x: 190, y: 645, w: 100, h: 14, value: 7 },
        { x: 340, y: 645, w: 100, h: 14, value: 8 }
      ],
      correct: 8
    }
  ]
  });
}
