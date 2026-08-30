/**
 * DOM side of the bench.
 *
 * The same Radix / TanStack / dnd-kit host the conformance gate uses, driven
 * from the same fixtures. A comparison against a hand-rolled table would be
 * measuring this file; a comparison against App is measuring the libraries
 * the kit is already scored against.
 */

import React from "react";
import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import { App } from "../conformance/dom/app.jsx";
import { SCENES, fixtureFor, actionTid } from "./scenes.js";

const host = document.getElementById("dom");
const root = createRoot(host);

function now() {
  return performance.now();
}

function frames(n = 2) {
  return new Promise((resolve) => {
    const step = (left) => {
      if (left <= 0) return resolve();
      requestAnimationFrame(() => step(left - 1));
    };
    step(n);
  });
}

function median(xs) {
  const a = xs.slice().sort((x, y) => x - y);
  const m = Math.floor(a.length / 2);
  return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2;
}

function countDom() {
  return host.querySelectorAll("*").length;
}

let gen = 0;

async function mount(scene) {
  const fixture = fixtureFor(scene);
  gen += 1;
  const t0 = now();
  flushSync(() => {
    root.render(<App key={scene.id + ":" + gen} fixture={fixture} />);
  });
  const committed = now();
  await frames(1);
  const painted = now();
  return {
    commit_ms: committed - t0,
    paint_ms: painted - committed,
    mount_ms: painted - t0,
    nodes: countDom(),
  };
}

async function clickTid(tid) {
  const el = host.querySelector(`[data-tid="${tid}"]`);
  if (!el) return;
  const t0 = now();
  flushSync(() => {
    el.click();
  });
  await frames(1);
  return now() - t0;
}

function repeatsFor(scene) {
  if (scene.n && scene.n >= 1000) return { warm: 1, timed: 3 };
  if (scene.n && scene.n >= 200) return { warm: 1, timed: 5 };
  return { warm: 1, timed: 7 };
}

export async function benchDom(scene) {
  if (scene.evg === "showcase") {
    return {
      side: "dom",
      id: scene.id,
      group: scene.group,
      skipped: true,
      reason: "showcase trees are EVG-decorated; kit-* is the fair pair",
    };
  }

  const reps = repeatsFor(scene);
  for (let i = 0; i < reps.warm; i++) await mount(scene);

  const samples = [];
  for (let i = 0; i < reps.timed; i++) samples.push(await mount(scene));

  let update_ms = 0;
  const tid = actionTid(scene);
  if (tid) {
    const updates = [];
    for (let i = 0; i < reps.timed; i++) {
      await mount(scene);
      updates.push(await clickTid(tid));
    }
    update_ms = median(updates.filter((v) => typeof v === "number"));
  }

  return {
    side: "dom",
    id: scene.id,
    group: scene.group,
    n: scene.n || 0,
    pageSize: scene.pageSize || 0,
    mount_ms: median(samples.map((s) => s.mount_ms)),
    commit_ms: median(samples.map((s) => s.commit_ms)),
    paint_ms: median(samples.map((s) => s.paint_ms)),
    update_ms,
    nodes: samples[0].nodes,
  };
}

window.__benchDom = benchDom;
window.__SCENES__ = SCENES;
window.__DOM_READY__ = true;
