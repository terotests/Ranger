/// <reference path="../../scripting/game.d.ts" />
//
// Night level — darker sky, crystal platforms, trickier layout.

const BASE_W = 480;

function scaleX(v) {
  return (v * bgWidth) / BASE_W;
}

function drawNightSky() {
  let y = 0;
  while (y < bgHeight) {
    const t = y / bgHeight;
    const r = 8 + t * 18;
    const g = 14 + t * 28;
    const b = 48 + t * 42;
    bgFillRect(0, y, bgWidth, 4, r, g, b);
    y = y + 4;
  }
}

function drawStar(sx, sy, size) {
  bgFillCircle(sx, sy, size, 220, 230, 255);
}

function drawMoon(mx, my) {
  bgFillCircle(mx, my, 28, 240, 245, 210);
  bgFillCircle(mx + 10, my - 6, 22, 18, 28, 72);
}

function drawNightBackground() {
  drawNightSky();
  drawMoon(scaleX(390), 95);
  drawStar(scaleX(60), 80, 2);
  drawStar(scaleX(140), 140, 1);
  drawStar(scaleX(220), 60, 2);
  drawStar(scaleX(310), 120, 1);
  drawStar(scaleX(50), 320, 1);
  drawStar(scaleX(400), 280, 2);
  drawStar(scaleX(180), 400, 1);
  drawStar(scaleX(350), 520, 2);
  drawStar(scaleX(90), 640, 1);
  drawStar(scaleX(430), 760, 1);
  drawStar(scaleX(160), 880, 2);
  drawStar(scaleX(300), 1020, 1);
  drawStar(scaleX(70), 1180, 1);
  drawStar(scaleX(420), 1340, 2);
  drawStar(scaleX(200), 1500, 1);
  drawStar(scaleX(360), 1680, 1);
}

export function drawNightLevelBackground() {
  drawNightBackground();
}

const NIGHT_SUMMIT_MUSIC =
  "tempo 118\n" +
  "beats 4/4\n" +
  "\n" +
  "@melody piano\n" +
  "1:A3 1:C4 1:E4 1:G4\n" +
  "1:F4 1:E4 1:D4 2:C4\n" +
  "1:G3 1:B3 1:D4 1:F4\n" +
  "2:E4 2:C4\n";

export const NIGHT_LEVEL = {
  id: "night",
  title: "Yökiipeily",
  hudIntro: "Yötaivas! Kapeammat lautat, enemmän vihollisia. Timantit hohtavat.",
  victoryRestartText: "Paina Space — pelaa uudelleen",
  nextLevelPath: "",
  worldH: 1980,
  p1StartX: 100,
  p2StartX: 380,
  summitMusic: NIGHT_SUMMIT_MUSIC,
  movingPlatSpeed: 0.078,
  platforms: [
    { x: 0, y: 1920, w: 480, h: 60 },
    { x: 20, y: 1780, w: 130, h: 12 },
    { x: 200, y: 1680, w: 80, h: 12 },
    { x: 340, y: 1580, w: 70, h: 12 },
    { x: 60, y: 1480, w: 75, h: 12 },
    { x: 250, y: 1380, w: 90, h: 12 },
    { x: 100, y: 1280, w: 65, h: 12 },
    { x: 320, y: 1180, w: 80, h: 12 },
    { x: 40, y: 1080, w: 70, h: 12 },
    { x: 180, y: 980, w: 85, h: 12 },
    { x: 330, y: 880, w: 75, h: 12 },
    { x: 70, y: 780, w: 60, h: 12 },
    { x: 240, y: 680, w: 95, h: 12 },
    { x: 120, y: 580, w: 70, h: 12 },
    { x: 300, y: 480, w: 80, h: 12 },
    { x: 50, y: 380, w: 65, h: 12 },
    { x: 200, y: 280, w: 90, h: 12 },
    { x: 340, y: 200, w: 70, h: 12 },
    { x: 150, y: 120, w: 180, h: 18 }
  ],
  movingPlatforms: [
    { x: 40, y: 1720, w: 85, h: 12, min: 25, max: 280, dir: 1 },
    { x: 280, y: 1620, w: 75, h: 12, min: 60, max: 360, dir: -1 },
    { x: 55, y: 1520, w: 70, h: 12, min: 35, max: 250, dir: 1 },
    { x: 220, y: 1420, w: 80, h: 12, min: 80, max: 340, dir: -1 },
    { x: 90, y: 1220, w: 65, h: 12, min: 45, max: 270, dir: 1 },
    { x: 260, y: 1120, w: 75, h: 12, min: 70, max: 350, dir: -1 },
    { x: 50, y: 920, w: 70, h: 12, min: 30, max: 290, dir: 1 },
    { x: 300, y: 820, w: 80, h: 12, min: 100, max: 380, dir: -1 }
  ],
  enemyDefs: [
    { x: 45, y: 1780, dir: 1, min: 28, max: 95 },
    { x: 210, y: 1680, dir: -1, min: 205, max: 270 },
    { x: 350, y: 1580, dir: 1, min: 345, max: 405 },
    { x: 75, y: 1480, dir: 1, min: 65, max: 130 },
    { x: 265, y: 1380, dir: -1, min: 255, max: 335 },
    { x: 115, y: 1280, dir: 1, min: 105, max: 160 },
    { x: 335, y: 1180, dir: -1, min: 325, max: 395 },
    { x: 55, y: 1080, dir: 1, min: 45, max: 105 },
    { x: 200, y: 980, dir: -1, min: 185, max: 260 },
    { x: 340, y: 880, dir: 1, min: 335, max: 400 },
    { x: 85, y: 780, dir: 1, min: 75, max: 125 },
    { x: 255, y: 680, dir: -1, min: 245, max: 330 }
  ],
  fruitDefs: [
    { x: 55, y: 1755 },
    { x: 230, y: 1655 },
    { x: 370, y: 1555 },
    { x: 90, y: 1355 },
    { x: 310, y: 1155 },
    { x: 130, y: 955 },
    { x: 360, y: 255 },
    { x: 180, y: 355 }
  ],
  diamondDefs: [
    { x: 400, y: 1855, respawn: true },
    { x: 280, y: 1555, respawn: true },
    { x: 140, y: 1255, respawn: false },
    { x: 320, y: 855, respawn: false },
    { x: 210, y: 555, respawn: false },
    { x: 100, y: 355, respawn: false }
  ],
  theme: {
    platColorBody: { r: 52, g: 58, b: 118 },
    platColorTop: { r: 100, g: 120, b: 200 },
    platColorBottom: { r: 28, g: 32, b: 72 },
    fruitColor: { r: 255, g: 210, b: 80 },
    flagPole: { r: 120, g: 130, b: 180 },
    flagRed: { r: 180, g: 120, b: 255 },
    flagGold: { r: 200, g: 220, b: 255 },
    diamondBright: { r: 80, g: 200, b: 255 },
    diamondEdge: { r: 200, g: 240, b: 255 }
  }
};
