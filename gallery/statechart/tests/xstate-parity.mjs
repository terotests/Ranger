#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later
//
// This runner against the library, live.
//
//   node gallery/statechart/tests/xstate-parity.mjs [--manifest <path>]
//
// A hand-transcribed transition table is worth writing once, to prove a machine
// was READ right. It does not scale: six states and eighteen events is a
// hundred and eight cells, and a hundred and eight cells transcribed by hand is
// a hundred and eight chances to write down what you assumed.
//
// So this asks XState instead. The same config runs in this runner and in
// `xstate`, every state the machine can rest in is crossed with every event
// from a seeded path, and both sides have to answer the same thing: was the
// event handled, where did it leave the machine, and what is the whole context.
// Then the same again over random sequences, which is what catches the orders
// nobody thought to write down.
//
// A MANIFEST says which machines to run and what the host provides. Nothing
// about any particular application lives here — `gallery/realtrainer` has its
// own manifest for the three machines it ported, and this module has one for
// the machines that exercise its own semantics.
//
// What this canNOT do is worth stating: both sides read the SAME config, so it
// measures the runner and never the transcription. A guard written down wrong
// is wrong identically in both. The other half is a check that reads the
// original source — `rt:machine:config` for RealTrainer's three.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { requireHostTool } from "../../ui/conformance/dom-adapter.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const MODULE = path.join(HERE, "..");
const require_ = createRequire(import.meta.url);

const args = process.argv.slice(2);
const manifestArg = args.indexOf("--manifest");
const MANIFEST = path.resolve(
  manifestArg === -1 ? path.join(MODULE, "fixtures", "manifest.mjs") : args[manifestArg + 1],
);

let xstate = null;
let xstateVersion = "";
try {
  xstate = requireHostTool("xstate");
  xstateVersion = requireHostTool("xstate/package.json").version ?? "";
} catch {
  /* reported below */
}
if (!xstate) {
  console.log(
    "xstate is not installed, so there is nothing to be measured against.\n" +
      "Install it with `npm run ui:conformance:install`.\n\nSkipped.",
  );
  process.exit(0);
}

const { StatechartJson } = require_(path.join(MODULE, "bin", "StatechartJson.cjs"));
const { ScRunner, ScEvent, ScValOps } = require_(path.join(MODULE, "bin", "Statechart.cjs"));

const manifest = await import(MANIFEST);
const DIR = path.resolve(path.dirname(MANIFEST), manifest.dir ?? "machines");
const MACHINES = manifest.machines;
// The computations a machine NAMES instead of describing — XState's own
// `setup({ actions })`. Both sides run the same functions, so what is compared
// is the machine and not two readings of a calendar.
const HOST_ACTIONS = manifest.actions ?? {};
// Context the HOST owns rather than the machine: a clock, mostly. Applied to
// both sides identically.
const HOST_CONTEXT = manifest.context ?? {};

// --- our runner -------------------------------------------------------------

function toScVal(value) {
  if (value === null || value === undefined) return ScValOps.nothing();
  if (typeof value === "string") return ScValOps.str(value);
  if (typeof value === "boolean") return ScValOps.bool(value);
  if (typeof value === "number") return ScValOps.num(value);
  if (Array.isArray(value)) {
    const list = ScValOps.emptyList();
    for (const item of value) list.items.push(toScVal(item));
    return list;
  }
  const map = ScValOps.emptyMap();
  for (const [k, v] of Object.entries(value)) {
    map.keys.push(k);
    map.entries.push(toScVal(v));
  }
  return map;
}

function hostContextFor(config) {
  const out = {};
  for (const [key, value] of Object.entries(HOST_CONTEXT)) {
    if (key in config.context) out[key] = value;
  }
  return out;
}

function ours(config, keys) {
  const r = new ScRunner();
  r.start(StatechartJson.load(JSON.stringify(config)));
  for (const [key, value] of Object.entries(hostContextFor(config))) r.set(key, toScVal(value));
  const read = () => Object.fromEntries(keys.map((k) => [k, JSON.parse(r.json(k))]));

  // The host runs what the machine named, which is the whole contract: the
  // machine says WHICH computation, and the host is the only side that can do
  // it. The runner stops settling while an action is owed — a state can fork on
  // the length of a list a named action fills — so this is a loop: run what is
  // named, `resume`, and it may name more.
  const drain = (fields) => {
    for (let step = 0; step < 32 && r.pending.length > 0; step += 1) {
      for (const name of [...r.pending]) {
        for (const [key, value] of Object.entries(HOST_ACTIONS[name](read(), fields))) {
          r.set(key, toScVal(value));
        }
      }
      r.resume();
    }
  };
  drain({});

  return {
    send: (type, fields) => {
      const e = ScEvent.of(type);
      for (const [k, v] of Object.entries(fields ?? {})) e.with(k, toScVal(v));
      const handled = r.send(e);
      drain(fields ?? {});
      return handled;
    },
    state: () => r.state,
    context: read,
  };
}

// --- the library ------------------------------------------------------------

function xstateGuard(spec) {
  if (spec.or) {
    const parts = spec.or.map(xstateGuard);
    return (c, e) => parts.some((p) => p(c, e));
  }
  if (spec.and) {
    const parts = spec.and.map(xstateGuard);
    return (c, e) => parts.every((p) => p(c, e));
  }
  if (spec.not) {
    const part = xstateGuard(spec.not);
    return (c, e) => !part(c, e);
  }
  // `present` is "carries something", which is what the runner means by it —
  // and `[]`, `{}` and `false` are empty here as they are there.
  const presentOf = (v) => {
    if (v === null || v === undefined || v === "" || v === false) return false;
    if (Array.isArray(v)) return v.length > 0;
    if (typeof v === "object") return Object.keys(v).length > 0;
    return true;
  };
  // Blankness is a question about TEXT; anything else is asked whether it is
  // there at all.
  if (spec.nonBlank) {
    const read = xstateValue(spec.nonBlank);
    return (c, e) => {
      const v = read(c, e);
      return typeof v === "string" ? v.trim().length > 0 : presentOf(v);
    };
  }
  if (spec.present) {
    const read = xstateValue(spec.present);
    return (c, e) => presentOf(read(c, e));
  }
  const size = (v) =>
    v === null || v === undefined ? 0 : Array.isArray(v) || typeof v === "string"
      ? v.length : typeof v === "object" ? Object.keys(v).length : 0;
  if (spec.countEq) {
    const read = xstateValue(spec.countEq.of);
    return (c, e) => size(read(c, e)) === spec.countEq.n;
  }
  if (spec.countGt) {
    const read = xstateValue(spec.countGt.of);
    return (c, e) => size(read(c, e)) > spec.countGt.n;
  }
  if (spec.some) {
    const read = xstateValue(spec.some.of);
    return (c, e) =>
      (read(c, e) ?? []).some(
        (item) => JSON.stringify(item?.[spec.some.field]) === JSON.stringify(spec.some.eq),
      );
  }
  return () => true;
}

function xstateValue(spec) {
  if (spec.append) {
    const list = xstateValue(spec.append.list);
    const item = xstateValue(spec.append.item);
    return (c, e) => [...(list(c, e) ?? []), item(c, e)];
  }
  if (spec.setKey) {
    const map = xstateValue(spec.setKey.map);
    const key = xstateValue(spec.setKey.key);
    const value = xstateValue(spec.setKey.value);
    return (c, e) => ({ ...(map(c, e) ?? {}), [key(c, e)]: value(c, e) });
  }
  if (spec.or) {
    const parts = spec.or.map(xstateValue);
    return (c, e) => {
      for (const part of parts) {
        const answer = part(c, e);
        const empty =
          answer === undefined || answer === null || answer === "" || answer === false ||
          (Array.isArray(answer) && answer.length === 0) ||
          (answer && typeof answer === "object" && Object.keys(answer).length === 0);
        if (!empty) return answer;
      }
      // `||` yields its LAST operand when everything is falsy, and so does this.
      return parts.length > 0 ? parts[parts.length - 1](c, e) : null;
    };
  }
  if (spec.event !== undefined) return (_c, e) => e[spec.event] ?? null;
  if (spec.context !== undefined) return (c) => c[spec.context] ?? null;
  return () => (spec.value === undefined ? null : spec.value);
}

/** XState's nested value — `{ sending: "streaming" }` — as a path. */
function pathOf(value) {
  if (typeof value === "string") return value;
  const [name, inner] = Object.entries(value)[0];
  return `${name}.${pathOf(inner)}`;
}

function theirs(config, keys) {
  const { createMachine, assign, createActor } = xstate;

  const actionOf = (action) => {
    if (action.action) {
      const run = HOST_ACTIONS[action.action];
      return assign(({ context, event }) => run(context, event));
    }
    const fields = Object.entries(action.assign ?? {}).map(([k, v]) => [k, xstateValue(v)]);
    return assign(({ context, event }) =>
      Object.fromEntries(fields.map(([k, read]) => [k, read(context, event)])),
    );
  };

  // One transition, in any of the three shapes XState writes: a bare target,
  // an object, or an array of guarded alternatives.
  const transitionOf = (spec) => {
    if (Array.isArray(spec)) return spec.map(transitionOf);
    if (typeof spec === "string") return { target: spec };
    const out = { actions: (spec.actions ?? []).map(actionOf) };
    if (spec.target) out.target = spec.target;
    // XState hands a guard ONE argument, `{ context, event }`; the predicates
    // above take the two positionally, as the runner does.
    if (spec.guard) {
      const g = xstateGuard(spec.guard);
      out.guard = ({ context, event }) => g(context, event);
    }
    return out;
  };

  const nodeOf = (node) => {
    const out = {};
    if (node.initial) out.initial = node.initial;
    if (node.type) out.type = node.type;
    if (node.on) {
      out.on = Object.fromEntries(
        Object.entries(node.on).map(([event, spec]) => [event, transitionOf(spec)]),
      );
    }
    if (node.always) out.always = transitionOf(node.always);
    if (node.onDone) out.onDone = transitionOf(node.onDone);
    if (node.states) {
      out.states = Object.fromEntries(
        Object.entries(node.states).map(([name, child]) => [name, nodeOf(child)]),
      );
    }
    return out;
  };

  const machine = createMachine({
    id: config.id,
    initial: config.initial,
    context: { ...config.context, ...hostContextFor(config) },
    states: Object.fromEntries(
      Object.entries(config.states).map(([name, node]) => [name, nodeOf(node)]),
    ),
    ...(config.on
      ? {
          on: Object.fromEntries(
            Object.entries(config.on).map(([event, spec]) => [event, transitionOf(spec)]),
          ),
        }
      : {}),
  });

  const actor = createActor(machine).start();
  const read = () =>
    Object.fromEntries(keys.map((k) => [k, actor.getSnapshot().context[k] ?? null]));
  return {
    send: (type, fields) => {
      const event = { type, ...(fields ?? {}) };
      const handled = actor.getSnapshot().can(event);
      actor.send(event);
      return handled;
    },
    state: () => pathOf(actor.getSnapshot().value),
    context: read,
  };
}

// --- reading a config -------------------------------------------------------

/** Every leaf state, by dot path — `reviewing.multiAction`. */
function leavesOf(states, prefix) {
  const out = [];
  for (const [name, node] of Object.entries(states)) {
    const path_ = prefix ? `${prefix}.${name}` : name;
    if (node.states) out.push(...leavesOf(node.states, path_));
    else out.push(path_);
  }
  return out;
}

function nodeAt(config, path_) {
  let node = config;
  for (const part of path_.split(".")) node = node.states[part];
  return node;
}

/** Every event name anywhere in the tree, the machine's own included. */
function eventsOf(config) {
  const out = new Set(Object.keys(config.on ?? {}));
  const walk = (states) => {
    for (const node of Object.values(states)) {
      for (const name of Object.keys(node.on ?? {})) out.add(name);
      if (node.states) walk(node.states);
    }
  };
  walk(config.states);
  return [...out].sort();
}

// --- the run ----------------------------------------------------------------

let failed = 0;
const say = (name, cond, detail) => {
  if (cond) console.log(`  PASS ${name}`);
  else {
    failed += 1;
    console.log(`  FAIL ${name}${detail === undefined ? "" : `\n         ${detail}`}`);
  }
};

for (const spec of MACHINES) {
  const config = JSON.parse(fs.readFileSync(path.join(DIR, spec.file), "utf8"));
  const keys = Object.keys(config.context).filter((k) => !(k in HOST_CONTEXT));
  const events = eventsOf(config);
  const states = Object.keys(spec.seeds);

  // An event's payload is one shape, or a list of shapes the fuzz varies over.
  const payloadFor = (event, which) => {
    const p = spec.payloads[event] ?? {};
    return Array.isArray(p) ? p[which % p.length] : p;
  };

  // A state left out of `seeds` has to be one the machine cannot rest in,
  // never one that was forgotten: an `always` fork or a final child.
  const skipped = leavesOf(config.states, "").filter((p) => !(p in spec.seeds));
  const stuck = skipped.filter((p) => {
    const node = nodeAt(config, p);
    return !node.always && node.type !== "final";
  });

  console.log(`\n  ${config.id} — ${states.length} states × ${events.length} events, live against xstate ${xstateVersion}\n`);
  if (stuck.length > 0) say(`every leaf state is seeded`, false, `no seed for ${stuck.join(", ")}`);

  const before = failed;
  let cells = 0;
  let ignored = 0;
  for (const from of states) {
    for (const event of events) {
      const a = ours(config, keys);
      const b = theirs(config, keys);
      for (const [type, fields] of spec.seeds[from]) {
        a.send(type, fields);
        b.send(type, fields);
      }
      if (a.state() !== from || b.state() !== from) {
        say(`${from} + ${event}`, false, `seed landed in ${a.state()} / ${b.state()}`);
        continue;
      }
      const fields = payloadFor(event, 0);
      const got = { moved: a.send(event, fields), state: a.state(), context: a.context() };
      const want = { moved: b.send(event, fields), state: b.state(), context: b.context() };
      cells += 1;
      if (!want.moved) ignored += 1;
      const same = JSON.stringify(got) === JSON.stringify(want);
      if (!same) {
        say(`${from} + ${event}`, false,
            `xstate ${JSON.stringify(want)}\n         ours   ${JSON.stringify(got)}`);
      }
    }
  }
  if (failed === before) {
    console.log(`  PASS ${cells} cells — ${ignored} of them events the machine ignores`);
  }

  // And the orders nobody wrote down.
  //
  // A deterministic generator: a fuzz that cannot be re-run is a bug report
  // nobody can act on. xorshift32 rather than an LCG on doubles —
  // `seed * 1103515245` runs past 2^53 and the low bits stop moving, so
  // `next() % n` was returning the same event over and over.
  let seed = 20260903 >>> 0;
  const next = () => {
    seed ^= seed << 13; seed >>>= 0;
    seed ^= seed >>> 17;
    seed ^= seed << 5; seed >>>= 0;
    return seed;
  };
  const pick = (list) => list[next() % list.length];
  const RUNS = 300;
  const LENGTH = 14;
  let diverged = 0;
  for (let run = 0; run < RUNS && diverged === 0; run += 1) {
    const a = ours(config, keys);
    const b = theirs(config, keys);
    for (let step = 0; step < LENGTH; step += 1) {
      const event = pick(events);
      const fields = payloadFor(event, next());
      const got = { moved: a.send(event, fields), state: a.state(), context: a.context() };
      const want = { moved: b.send(event, fields), state: b.state(), context: b.context() };
      if (JSON.stringify(got) !== JSON.stringify(want)) {
        diverged += 1;
        say(`fuzz run ${run}, step ${step}: ${event}`, false,
            `xstate ${JSON.stringify(want)}\n         ours   ${JSON.stringify(got)}`);
        break;
      }
    }
  }
  if (diverged === 0) {
    console.log(`  PASS ${RUNS} random sequences of ${LENGTH} events, in lockstep throughout`);
  }
}

console.log("");
if (failed) {
  console.log(`${failed} difference(s) from xstate ${xstateVersion}`);
  process.exit(1);
}
console.log(`in lockstep with xstate ${xstateVersion}`);
console.log("ALL PASS");
