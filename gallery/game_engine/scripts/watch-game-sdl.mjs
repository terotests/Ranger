#!/usr/bin/env node
/**
 * Dev launcher for TS-interpreter SDL games with in-process hot reload.
 *
 * game_sdl polls the .game.tsx mtime each frame and patches changed AST nodes
 * via ComponentEngine.patchScript() — no process restart on save.
 *
 * Usage:
 *   npm run engine:game:watch:invaders
 *   node gallery/game_engine/scripts/watch-game-sdl.mjs pacman
 */

import { spawn } from 'node:child_process';
import { existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const BUILD = path.join(ROOT, 'gallery/game_engine/scripts/build-game-sdl.sh');
const BIN = path.join(ROOT, 'tmp/game-sdl/game_sdl');

/** Ranger sources that compile into the native host — rebuild when newer than the binary. */
const HOST_SOURCES = [
  'gallery/game_engine/scripting/game_sdl_runner.rgr',
  'gallery/game_engine/scripting/game_runtime.rgr',
  'gallery/game_engine/scripting/game_hud.rgr',
  'gallery/evg/EVGLayout.rgr',
  'gallery/evg/EVGElement.rgr',
];

const GAMES = {
  invaders: 'gallery/game_engine/scripting/invaders.game.tsx',
  pacman: 'gallery/game_engine/scripting/pacman.game.tsx',
  pong: 'gallery/game_engine/scripting/pong.game.tsx',
  breakout: 'gallery/game_engine/scripting/breakout.game.tsx',
};

const game = process.argv[2] || 'invaders';
const tsxRel = GAMES[game];
if (!tsxRel) {
  console.error(`Unknown game "${game}". Use: ${Object.keys(GAMES).join(', ')}`);
  process.exit(1);
}

let child = null;

function stopChild() {
  if (!child) return;
  child.kill('SIGTERM');
  child = null;
}

function hostSourcesStale() {
  if (!existsSync(BIN)) return true;
  const binMtime = statSync(BIN).mtimeMs;
  for (const rel of HOST_SOURCES) {
    const abs = path.join(ROOT, rel);
    if (existsSync(abs) && statSync(abs).mtimeMs > binMtime) {
      return true;
    }
  }
  return false;
}

function ensureHostBinary(cb) {
  if (existsSync(BIN) && !hostSourcesStale()) {
    cb();
    return;
  }
  console.log('==> [watch] building game_sdl host (missing or stale .rgr sources) ...');
  const build = spawn('bash', [BUILD], { cwd: ROOT, stdio: 'inherit' });
  build.on('exit', (code) => {
    if (code !== 0) {
      console.error('==> [watch] host build failed');
      process.exit(code ?? 1);
    }
    cb();
  });
}

function runGame() {
  console.log(`\n==> [watch] starting ${tsxRel} (in-process hot reload enabled)`);
  child = spawn(BIN, [tsxRel], { cwd: ROOT, stdio: 'inherit' });
  child.on('exit', (code, signal) => {
    if (child && signal !== 'SIGTERM' && code !== 0 && code !== null) {
      console.log(`==> [watch] game exited with code ${code}`);
    }
    child = null;
  });
}

ensureHostBinary(() => {
  console.log(`==> [watch] TS game dev (${game}) — save .game.tsx to hot-reload`);
  runGame();
});

process.on('SIGINT', () => {
  stopChild();
  process.exit(0);
});
