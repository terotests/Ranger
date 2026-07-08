#!/usr/bin/env node
/**
 * Dev watch: rebuild + restart native SDL game when source changes.
 *
 * Native Path B bakes logic into C++; true in-process hot-reload is not available.
 * This watches the .game.tsx source and re-runs emit → Ranger → g++ → game.
 *
 * Usage:
 *   node gallery/game_engine/scripts/watch-game-sdl-native.mjs pacman
 *   npm run engine:game-sdl-native:watch:pacman
 */

import { spawn } from 'node:child_process';
import { watch } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const BUILD = path.join(ROOT, 'gallery/game_engine/scripts/build-game-sdl-native.sh');

const GAMES = {
  pacman: ['gallery/game_engine/scripting/pacman_native.game.tsx'],
  invaders: ['gallery/game_engine/scripting/invaders.game.tsx'],
  pong: ['gallery/game_engine/scripting/pong.game.tsx'],
};

const game = process.argv[2] || 'pacman';
const paths = GAMES[game];
if (!paths) {
  console.error(`Unknown game "${game}". Use: ${Object.keys(GAMES).join(', ')}`);
  process.exit(1);
}

let child = null;
let building = false;
let pending = false;
let debounce = null;

function stopChild() {
  if (!child) return;
  child.kill('SIGTERM');
  child = null;
}

function runBuildAndPlay() {
  if (building) {
    pending = true;
    return;
  }
  building = true;
  pending = false;
  stopChild();

  console.log(`\n==> [watch] rebuild + run native ${game} ...`);

  const proc = spawn('bash', [BUILD, '--run', game], {
    cwd: ROOT,
    stdio: 'inherit',
  });
  child = proc;

  proc.on('exit', (code, signal) => {
    building = false;
    if (child === proc) child = null;
    if (signal === 'SIGTERM') {
      // killed for reload — next build already scheduled
    } else if (code !== 0 && code !== null) {
      console.log(`==> [watch] game/build exited with code ${code}`);
    }
    if (pending) {
      schedule();
    }
  });
}

function schedule() {
  clearTimeout(debounce);
  debounce = setTimeout(runBuildAndPlay, 450);
}

console.log(`==> [watch] native SDL dev loop (${game})`);
for (const rel of paths) {
  const full = path.join(ROOT, rel);
  console.log(`    watching ${rel}`);
  watch(full, { persistent: true }, () => schedule());
}

runBuildAndPlay();

process.on('SIGINT', () => {
  stopChild();
  process.exit(0);
});
