// Guest-side test fixture for ylos3d (rule 5): observations for the e2e driver.
function playerY(slot) { return __game.players[slot].y; }
function playerX(slot) { return __game.players[slot].x; }
function reachedGoal(slot) { return __game.players[slot].reachedGoal; }
function playerDone(slot) { return __game.players[slot].done; }
function playerFinishMs(slot) { return __game.players[slot].finishMs; }
function playerSuperMs(slot) { return __game.players[slot].superMs; }
function playerSpriteId(slot) { return __game.players[slot].sprite.id; }
function playerSuperSpriteId(slot) { return __game.players[slot].superSprite.id; }
function diamondCount() { return __game.diamonds.length; }
function diamondSpriteId(i) { return __game.diamonds[i].sprite.id; }
function diamondTaken(i) { return __game.diamonds[i].taken; }
function enemyAlive(i) { return __game.enemies[i].alive; }
function enemyCount() { return __game.enemies.length; }
