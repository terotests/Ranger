/// <reference path="../../scripting/game.d.ts" />
//
// Day level layout and visuals for Ylos 2.

const BASE_W = 480;

function scaleX(v) {
  return (v * bgWidth) / BASE_W;
}

function drawSkyGradient() {
  let y = 0;
  while (y < bgHeight) {
    const t = y / bgHeight;
    const r = 30 + t * 50;
    const g = 70 + t * 90;
    const b = 140 + t * 60;
    bgFillRect(0, y, bgWidth, 4, r, g, b);
    y = y + 4;
  }
}

function drawCloud(cx, cy) {
  bgFillCircle(cx, cy, 14, 240, 245, 255);
  bgFillCircle(cx - 16, cy + 4, 10, 235, 240, 250);
  bgFillCircle(cx + 16, cy + 4, 10, 235, 240, 250);
}

function drawDayBackground() {
  drawSkyGradient();
  drawCloud(scaleX(80), 220);
  drawCloud(scaleX(360), 420);
  drawCloud(scaleX(120), 720);
  drawCloud(scaleX(400), 980);
  drawCloud(scaleX(60), 1280);
}

export function drawDayLevelBackground() {
  drawDayBackground();
}

const SUMMIT_MUSIC =
  "tempo 152\n" +
  "beats 4/4\n" +
  "\n" +
  "@melody piano\n" +
  "0.5:E4 0.5:G4 1:A4 1:G4 1:E4\n" +
  "0.5:D4 0.5:E4 1:G4 2:E4\n" +
  "0.5:E4 0.5:G4 1:A4 1:C5 1:B4\n" +
  "1:A4 1:G4 2:E4\n";

export const DAY_LEVEL = {
  id: "day",
  title: "Ylos 2",
  hudIntro: "Kerää timantteja = supervoima. LPC-hahmot.",
  victoryRestartText: "Paina Space — yökiipeily!",
  nextLevelPath: "night.tsx",
  worldH: 1890,
  p1StartX: 120,
  p2StartX: 360,
  summitMusic: SUMMIT_MUSIC,
  platforms: [
    { x: 0, y: 1830, w: 480, h: 60 },
    { x: 30, y: 1700, w: 190, h: 14 },
    { x: 170, y: 1590, w: 100, h: 14 },
    { x: 310, y: 1480, w: 90, h: 14 },
    { x: 50, y: 1370, w: 110, h: 14 },
    { x: 260, y: 1260, w: 100, h: 14 },
    { x: 120, y: 1150, w: 90, h: 14 },
    { x: 300, y: 1040, w: 100, h: 14 },
    { x: 40, y: 930, w: 120, h: 14 },
    { x: 220, y: 820, w: 110, h: 14 },
    { x: 80, y: 710, w: 100, h: 14 },
    { x: 280, y: 600, w: 120, h: 14 },
    { x: 140, y: 490, w: 100, h: 14 },
    { x: 320, y: 380, w: 90, h: 14 },
    { x: 60, y: 270, w: 110, h: 14 },
    { x: 40, y: 220, w: 95, h: 12 },
    { x: 200, y: 160, w: 180, h: 20 }
  ],
  movingPlatforms: [
    { x: 50, y: 980, w: 100, h: 14, min: 35, max: 310, dir: 1 },
    { x: 220, y: 880, w: 90, h: 14, min: 70, max: 340, dir: -1 },
    { x: 60, y: 780, w: 110, h: 14, min: 40, max: 300, dir: 1 },
    { x: 250, y: 680, w: 85, h: 14, min: 90, max: 350, dir: -1 },
    { x: 45, y: 560, w: 100, h: 14, min: 30, max: 290, dir: 1 },
    { x: 230, y: 460, w: 95, h: 14, min: 80, max: 330, dir: -1 },
    { x: 70, y: 350, w: 90, h: 14, min: 50, max: 280, dir: 1 },
    { x: 210, y: 220, w: 110, h: 14, min: 60, max: 320, dir: -1 }
  ],
  enemyDefs: [
    { x: 55, y: 1700, dir: 1, min: 35, max: 115 },
    { x: 190, y: 1590, dir: -1, min: 175, max: 265 },
    { x: 320, y: 1480, dir: 1, min: 315, max: 395 },
    { x: 70, y: 1370, dir: 1, min: 55, max: 155 },
    { x: 275, y: 1260, dir: -1, min: 265, max: 355 },
    { x: 135, y: 1150, dir: 1, min: 125, max: 205 },
    { x: 310, y: 1040, dir: -1, min: 305, max: 395 },
    { x: 90, y: 710, dir: 1, min: 85, max: 175 },
    { x: 165, y: 490, dir: 1, min: 155, max: 225 },
    { x: 355, y: 380, dir: -1, min: 335, max: 400 },
    { x: 100, y: 270, dir: 1, min: 72, max: 158 },
    { x: 75, y: 220, dir: 1, min: 48, max: 122 }
  ],
  fruitDefs: [
    { x: 70, y: 1675 },
    { x: 210, y: 1565 },
    { x: 350, y: 1455 },
    { x: 100, y: 1245 },
    { x: 150, y: 1025 },
    { x: 85, y: 248 },
    { x: 330, y: 365 }
  ],
  diamondDefs: [
    { x: 420, y: 1775, respawn: true },
    { x: 300, y: 1455, respawn: true },
    { x: 130, y: 1125, respawn: false },
    { x: 300, y: 715, respawn: false },
    { x: 200, y: 475, respawn: false }
  ],
  theme: {
    platColorBody: { r: 72, g: 150, b: 64 },
    platColorTop: { r: 110, g: 190, b: 86 },
    platColorBottom: { r: 42, g: 96, b: 38 },
    fruitColor: { r: 255, g: 170, b: 40 },
    flagPole: { r: 160, g: 120, b: 70 },
    flagRed: { r: 255, g: 90, b: 90 },
    flagGold: { r: 255, g: 210, b: 60 }
  }
};
