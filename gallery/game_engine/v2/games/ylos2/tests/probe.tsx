// ============================================================================
// ylos2 test fixture (guest-side, games/AGENTS.md rule 5) — NOT shipped logic.
// ============================================================================
// Loaded by the e2e driver through the generic host's fixture door, in the same
// realm as the game. Exposes read-only observations of the game instance for
// host-side assertions. Production index.tsx exports no test accessors.
function playerY(slot) { return __game.players[slot].y; }
function playerX(slot) { return __game.players[slot].x; }
function reachedGoal(slot) { return __game.players[slot].reachedGoal; }
function playerSpriteId(slot) { return __game.players[slot].sprite.id; }
