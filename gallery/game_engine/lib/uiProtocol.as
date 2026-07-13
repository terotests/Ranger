// ============================================================================
// Extra RGU1 protocol property keys - the app-defined ones the `ui` builder does
// not wrap as fluent setters.
// ============================================================================
// ui.as already owns the everyday keys (text/bg/color/font/width/.../bg-image)
// behind El's setters. These are the extra rendering-technique props a game sets
// through El's escape hatches (.propColor / .propEnum / .propI32). They are part
// of the host's RGU1 reader contract (see wasm_ui_io.rgr's applyProps), so they
// belong in one shared module rather than re-declared per game.
//
//   import { P_GLOW, P_GRAD_FROM } from "./uiProtocol";
//   preview.propColor(P_GRAD_FROM, 90, 130, 245, 255);
// ============================================================================

export const P_GRAD_FROM: i32 = 50;   // linear-gradient start colour
export const P_GRAD_TO: i32 = 51;     // linear-gradient end colour
export const P_GRAD_DIR: i32 = 52;    // 0 vertical, 1 horizontal
export const P_ABS_X: i32 = 53;       // absolute page-x placement
export const P_ABS_Y: i32 = 54;       // absolute page-y placement
export const P_GLOW: i32 = 55;        // animated glow strength 0..1000
