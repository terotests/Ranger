// pose_demo/game.as - an AssemblyScript game that reacts to streamed pose data.
//
// It reads the RGP1 pose block (filled each frame by the host PoseProvider) and:
//   - moves the "hero" sprite (body 0) to the tracked head/nose position, and
//   - spawns a "super" sprite (body 1) whenever the ARMS_UP gesture is detected,
//     bumping a counter on each rising edge.
// Same source runs interpreted (AsSourceRunner) or compiled by asc — the pose
// readers below are imported from the game SDK just like the RGW1 helpers.
// Sprites are the ylos2 LPC sheets (p1_walk / p1_super).
import { abiWrite, writeBodyPos, uiReset, uiNode, uiTextRgb, uiFinish, hostSheet, posePresent, poseGesture, poseX, poseY } from "@ranger/game";

const OFF_BODY_COUNT: i32 = 28;
const OFF_SCORE: i32 = 40;

const G_ARMS_UP: i32 = 1;

let uiRev: i32 = 0;
let lastGesture: i32 = 0;
let armReps: i32 = 0;

function gname(g: i32): string {
  if (g == 1) { return "ARMS_UP"; }
  if (g == 2) { return "LEAN_LEFT"; }
  if (g == 3) { return "LEAN_RIGHT"; }
  return "NONE";
}

export function declare_resources(): void {
  hostSheet("hero", "assets/p1_walk.png", 64, 64, 1, 54, 10);
  hostSheet("hero_super", "assets/p1_super.png", 64, 64, 1, 54, 11);
}

export function init(): void {
  abiWrite(OFF_BODY_COUNT, 1);
  writeBodyPos(0, 240 * 256, 135 * 256);
  abiWrite(OFF_SCORE, 0);
}

export function update(): void {
  let present = posePresent();
  let g = poseGesture();
  let nx = poseX(0);
  let ny = poseY(0);

  let bodies = 1;
  if (present != 0) {
    writeBodyPos(0, nx, ny);
    if (g == G_ARMS_UP) {
      // spawn the super sprite just above the tracked head while arms are up
      let superY = ny - 48 * 256;
      writeBodyPos(1, nx, superY);
      bodies = 2;
      if (lastGesture != G_ARMS_UP) {
        armReps = armReps + 1;
      }
    }
  }
  abiWrite(OFF_BODY_COUNT, bodies);
  abiWrite(OFF_SCORE, armReps);
  lastGesture = g;

  let poseLabel = "POSE " + gname(g);
  let repsLabel = "SUPERS " + armReps;
  uiReset();
  uiNode(1, 0, 1, 0);                                    // root VIEW
  uiTextRgb(2, 1, 0, poseLabel, 255, 220, 120);
  uiTextRgb(3, 1, 1, repsLabel, 140, 230, 180);
  uiFinish(uiRev);
  uiRev = uiRev + 1;
}
