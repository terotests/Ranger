// Minimal .as game — runs interpreted (Ranger) or compiled (asc), same ABI.
// The bridge functions come from "@ranger/game": native in the interpreter,
// the real RGW1/RGU1 SDK when compiled with asc.
import { abiWrite, abiRead, uiReset, uiNode, uiPropEnum, uiText, uiFinish } from "@ranger/game";

const OFF_MAGIC: i32 = 0;
const OFF_VERSION: i32 = 4;
const OFF_SIZE: i32 = 8;
const OFF_SCORE: i32 = 40;
const RGW1_MAGIC: i32 = 827803474; // 'RGW1'
const ABI_SIZE: i32 = 2560;

const VIEW: i32 = 1;
const DIR_COLUMN: i32 = 1;
const K_FLEX_DIRECTION: i32 = 21;
const C_CYAN: i32 = 0x40d0ffff;
const C_GREEN: i32 = 0x30c060ff;

export function init(): void {
  abiWrite(OFF_MAGIC, RGW1_MAGIC);
  abiWrite(OFF_VERSION, 1);
  abiWrite(OFF_SIZE, ABI_SIZE);
  abiWrite(OFF_SCORE, 0);
}

export function update(): void {
  let score: i32 = abiRead(OFF_SCORE);
  score = score + 1;
  abiWrite(OFF_SCORE, score);

  uiReset();
  uiNode(1, 0, VIEW, 0);
  uiPropEnum(K_FLEX_DIRECTION, DIR_COLUMN);
  uiText(2, 1, 0, "SCORE " + score, C_CYAN);
  uiText(3, 1, 1, "AS SOURCE", C_GREEN);
  uiFinish(score);
}
