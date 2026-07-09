// ============================================================================
// TypeScript type definitions for Ranger GAME SCRIPTS
// ============================================================================
//
// Game screens can be authored as TypeScript/TSX and evaluated at runtime by
// the gallery ComponentEngine (see GAME_SCRIPTING.md). The runtime IGNORES type
// annotations, so these declarations exist purely for editor tooling
// (autocomplete + type-checking) while you write `*.game.tsx` scripts.
//
// Reference this file from a script with a triple-slash directive:
//   /// <reference path="./game.d.ts" />
//
// Generic engine types live in engine.d.ts (Game, Framebuffer, GameState,
// MultiScreenState, SpriteDef, GameScript, …). Per-game screen types belong in
// a sibling *.d.ts — see breakout.d.ts.
//
// Multi-screen helpers (getScreen, activeScreen): import from "game_helpers"
// (resolved via gallery/game_engine/lib/ at runtime).
//
// The host injects the `game`, `Buttons` and `screen` (framebuffer) globals into
// the script namespace (via ComponentEngine.registerGlobal), so no import is
// required for those.
// ============================================================================

/// <reference path="./engine.d.ts" />
