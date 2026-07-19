// Guest-side test fixture for ylos3d (rule 5): observations for the e2e driver.
function playerY(slot) { return __game.players[slot].y; }
function playerX(slot) { return __game.players[slot].x; }
function reachedGoal(slot) { return __game.players[slot].reachedGoal; }
function playerSpriteId(slot) { return __game.players[slot].sprite.id; }
function diamondCount() { return __game.diamonds.length; }
function diamondSpriteId(i) { return __game.diamonds[i].sprite.id; }
