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

// ---- action probes (drive v1-parity systems without attract climb) ----------
function probeCollectDiamond(slot) {
  const pl = __game.players[slot];
  const gem = __game.diamonds[0];
  pl.x = gem.x - 13;
  pl.y = gem.y - 44;
  pl.done = 0;
  __game.collectDiamonds(pl);
  return pl.superMs;
}

function probeStompEnemy(slot) {
  const pl = __game.players[slot];
  const e = __game.enemies[0];
  e.alive = 1;
  e.x = 100;
  e.y = 1700;
  // feet just above enemy, falling → stomp
  pl.x = e.x - 13;
  pl.y = e.y - 10 - 44;
  pl.vy = 0.2;
  pl.done = 0;
  __game.applyEnemyHits(pl);
  return e.alive;
}

function probeEnterFinish(slot) {
  const pl = __game.players[slot];
  __game.enterFinish(pl);
  return pl.done;
}

function probeTickFinish(slot) {
  const pl = __game.players[slot];
  __game.tickFinishPlayer(pl, 100);
  return pl.finishMs;
}
