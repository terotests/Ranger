// Guest-side test fixture for ylos3d (rule 5): observations for the e2e driver.
function playerY(slot) { return __game.players[slot].y; }
function playerX(slot) { return __game.players[slot].x; }
function reachedGoal(slot) { return __game.players[slot].reachedGoal; }
function playerDone(slot) { return __game.players[slot].done; }
function playerFinishMs(slot) { return __game.players[slot].finishMs; }
function playerSuperMs(slot) { return __game.players[slot].superMs; }
function playerSpriteId(slot) { return __game.players[slot].sprite.id; }
function playerSuperSpriteId(slot) { return __game.players[slot].superSprite.id; }
// Per-pane session: counts/state are scoped to the slot's own world.
function diamondCount(slot) { return __game.players[slot].diamonds.length; }
function diamondSpriteId(slot) { return __game.players[slot].diamonds[0].sprite.id; }
function diamondTaken(slot) { return __game.players[slot].diamonds[0].taken; }
function enemyAlive(slot) { return __game.players[slot].enemies[0].alive; }
function enemyCount(slot) { return __game.players[slot].enemies.length; }

// ---- action probes (drive v1-parity systems without attract climb) ----------
function probeCollectDiamond(slot) {
  const pl = __game.players[slot];
  const gem = pl.diamonds[0];
  gem.taken = 0;
  gem.sprite.setPos(gem.x, gem.y);
  pl.x = gem.x - 13;
  pl.y = gem.y - 44;
  pl.done = 0;
  pl.superMs = 0;
  __game.collectDiamonds(pl);
  return pl.superMs;
}

function probeStompEnemy(slot) {
  const pl = __game.players[slot];
  const e = pl.enemies[0];
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

// After slot 0 collects diamond 0, slot 1's copy must remain untaken.
function probeSessionsIndependent(slot) {
  const a = __game.players[0];
  const b = __game.players[1];
  a.diamonds[0].taken = 0;
  a.diamonds[0].sprite.setPos(a.diamonds[0].x, a.diamonds[0].y);
  b.diamonds[0].taken = 0;
  b.diamonds[0].sprite.setPos(b.diamonds[0].x, b.diamonds[0].y);
  a.x = a.diamonds[0].x - 13;
  a.y = a.diamonds[0].y - 44;
  a.done = 0;
  __game.collectDiamonds(a);
  if (a.diamonds[0].taken != 1) { return 0; }
  if (b.diamonds[0].taken != 0) { return 0; }
  return 1;
}
