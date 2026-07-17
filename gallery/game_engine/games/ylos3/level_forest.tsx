// Taso 1 — viidakon lattio: tutustumistaso, leveät puulankut, harvat viholliset.
import { setLevelConfig } from "./ylos3_shared";

export function installForestLevel() {
  setLevelConfig({
  id: "forest",
  label: "Taso 1 — Viidakon lattia",
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
    { x: 200, y: 1585, w: 95, h: 14 },
    { x: 320, y: 1475, w: 100, h: 14 },
    { x: 55, y: 1365, w: 115, h: 14 },
    { x: 250, y: 1255, w: 105, h: 14 },
    { x: 110, y: 1145, w: 95, h: 14 },
    { x: 295, y: 1035, w: 105, h: 14 },
    { x: 45, y: 925, w: 125, h: 14 },
    { x: 215, y: 815, w: 115, h: 14 },
    { x: 75, y: 705, w: 105, h: 14 },
    { x: 270, y: 595, w: 125, h: 14 },
    { x: 130, y: 485, w: 105, h: 14 },
    { x: 310, y: 375, w: 95, h: 14 },
    { x: 55, y: 265, w: 115, h: 14 },
    { x: 35, y: 215, w: 100, h: 12 },
    { x: 195, y: 155, w: 190, h: 20 }
  ],
  movingPlatforms: [
    { x: 55, y: 975, w: 95, h: 14, min: 40, max: 300, dir: 1 },
    { x: 225, y: 875, w: 85, h: 14, min: 75, max: 335, dir: -1 },
    { x: 65, y: 775, w: 105, h: 14, min: 45, max: 295, dir: 1 },
    { x: 245, y: 675, w: 80, h: 14, min: 95, max: 345, dir: -1 },
    { x: 50, y: 555, w: 95, h: 14, min: 35, max: 285, dir: 1 },
    { x: 235, y: 455, w: 90, h: 14, min: 85, max: 325, dir: -1 },
    { x: 75, y: 345, w: 85, h: 14, min: 55, max: 275, dir: 1 },
    { x: 215, y: 215, w: 105, h: 14, min: 65, max: 315, dir: -1 }
  ],
  enemyDefs: [
    { x: 60, y: 1700, dir: 1, min: 45, max: 110 },
    { x: 210, y: 1585, dir: -1, min: 205, max: 290 },
    { x: 70, y: 1365, dir: 1, min: 60, max: 160 },
    { x: 280, y: 1255, dir: -1, min: 255, max: 350 },
    { x: 130, y: 1145, dir: 1, min: 120, max: 200 },
    { x: 90, y: 705, dir: 1, min: 85, max: 170 },
    { x: 170, y: 485, dir: 1, min: 140, max: 220 },
    { x: 95, y: 265, dir: 1, min: 70, max: 155 }
  ],
  fruitDefs: [
    { x: 75, y: 1675 },
    { x: 230, y: 1560 },
    { x: 355, y: 1450 },
    { x: 105, y: 1240 },
    { x: 155, y: 1020 },
    { x: 90, y: 240 },
    { x: 335, y: 350 }
  ],
  diamondDefs: [
    { x: 410, y: 1770, respawn: true },
    { x: 290, y: 1450, respawn: true },
    { x: 125, y: 1120, respawn: false },
    { x: 295, y: 710, respawn: false },
    { x: 195, y: 470, respawn: false }
  ]
  });
}
