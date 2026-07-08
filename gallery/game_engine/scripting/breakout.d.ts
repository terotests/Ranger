/// <reference path="./engine.d.ts" />
//
// Breakout-specific types — extend generic engine types for this game only.
//

/** Breakout play-screen sub-state (paddle, ball, bricks). */
interface BreakoutPlayScreen extends ScreenState {
  layout: "breakout";
  entities: Record<string, EntityPose>;
  px: number;
  py: number;
  bx: number;
  by: number;
  vx: number;
  vy: number;
  alive: number[];
  score: number;
  lives: number;
}

/** Breakout game-over screen sub-state. */
interface BreakoutGameOverScreen extends ScreenState {
  layout: "breakout";
  score: number;
  won: number;
  lives: number;
}

/** Per-screen map for Breakout. */
interface BreakoutScreens {
  play: BreakoutPlayScreen;
  gameOver?: BreakoutGameOverScreen;
}

/** Full Breakout multi-screen state. */
type BreakoutState = MultiScreenState<"play" | "gameOver", BreakoutScreens>;
