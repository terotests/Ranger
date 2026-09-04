#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later
//
// The ported state machine, against the machine it was ported from.
//
//   node gallery/realtrainer/web/machine-check.mjs
//
// `fixtures/machines/*.json` is the transition table transcribed from the
// XState machine in the RealTrainer monorepo: every state crossed with every
// event, and what each cell does. This drives the Ranger port through all of
// them and compares the state AND the whole context.
//
// The point is the IGNORES. Thirteen of the twenty-one cells here are pairs
// the machine does not handle, and they are the half a hand-port gets wrong:
// `OPEN` while already open must not re-blank what someone typed, `ERROR` out
// of `saving` must keep the input rather than throw it away, and
// `START_SAVING` while saving must do nothing at all. A port tested only on
// its happy path passes while being wrong about every one of them.
//
// No browser, no emulator, no Firebase: a state machine is the one part of an
// app that can be checked with none of them.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { requireHostTool } from "../../ui/conformance/dom-adapter.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const BIN = path.join(HERE, "..", "bin", "AddWorkoutDialog.cjs");
if (!fs.existsSync(BIN)) {
  console.error("compiled machine missing — run `npm run rt:machine:build` first");
  process.exit(3);
}
const require_ = createRequire(import.meta.url);
const { AddWorkoutDialog } = require_(BIN);
const CHART = path.join(HERE, "..", "bin", "AddWorkoutChart.cjs");
if (!fs.existsSync(CHART)) {
  console.error("compiled chart missing — run `npm run rt:machine:build` first");
  process.exit(3);
}
const { AddWorkoutChart } = require_(CHART);
const JSONBIN = path.join(HERE, "..", "..", "statechart", "bin", "StatechartJson.cjs");
if (!fs.existsSync(JSONBIN)) {
  console.error("compiled loader missing — run `npm run rt:machine:build` first");
  process.exit(3);
}
const { StatechartJson } = require_(JSONBIN);
const { ScRunner, ScEvent } = require_(
  path.join(HERE, "..", "..", "statechart", "bin", "Statechart.cjs"),
);

// XState's events are objects — `{ type: "OPEN", targetDate: "…" }` — and an
// assignment reads them by name, so the table says which field each event's
// payload belongs to. The hand-written port takes one payload and knows what
// it is for; the two data-driven ones are handed the real event.
const eventOf = (type, field, value) => {
  const e = ScEvent.of(type);
  if (field) e.withStr(field, value);
  return e;
};

// The runner's context is typed now — a string, a boolean, a list, a map — so
// it is read back as JSON and parsed. That round trip IS the comparison: the
// two sides agree only if the runner's own JSON bridge writes what the library
// holds.
const contextOf = (runner, keys) =>
  Object.fromEntries(keys.map((k) => [k, JSON.parse(runner.json(k))]));

const CONTEXT_KEYS = ["targetDate", "targetCalendarId", "inputText", "error"];
const machineJson = fs.readFileSync(
  path.join(HERE, "..", "fixtures", "machines", "addWorkoutDialog.machine.json"),
  "utf8",
);

// Two independent readings of one specification. The hand-written port is the
// machine written out as branches; the chart is the same machine as DATA, run
// by gallery/statechart's generic runner. Either they agree with the table or
// one of them is wrong — which is what makes the table worth transcribing, and
// what a single implementation checked against itself could never show.
// --- and the same config through REAL XSTATE --------------------------------
//
// The table is a transcription, and three implementations agreeing with a
// transcription mostly proves they agree with each other. XState itself is the
// oracle: the same config object, executed by the library the app runs, is
// what says whether the transcription — and this runner's semantics — are
// right.
//
// The declarative value expressions become real `assign` functions here, and
// that translation is the claim being tested: `{"or": [{"event":"targetDate"},
// {"context":"today"}]}` has to mean what `event.targetDate || today` means.
let xstate = null;
let xstateVersion = "";
try {
  xstate = requireHostTool("xstate");
  xstateVersion = requireHostTool("xstate/package.json").version ?? "";
} catch {
  // Missing is not a pass: it is a gate that could not run, and it says so at
  // the end rather than going quiet.
}

function xstateValue(spec) {
  if (spec.or) {
    const parts = spec.or.map(xstateValue);
    return (context, event) => {
      for (const part of parts) {
        const answer = part(context, event);
        if (answer !== undefined && answer !== null && answer !== "") return answer;
      }
      return "";
    };
  }
  if (spec.event !== undefined) return (_c, event) => event[spec.event] ?? "";
  if (spec.context !== undefined) return (context) => context[spec.context] ?? "";
  return () => spec.value ?? "";
}

function xstateMachine(config, today) {
  const { createMachine, assign } = xstate;
  const states = {};
  for (const [name, node] of Object.entries(config.states)) {
    const on = {};
    for (const [event, spec] of Object.entries(node.on ?? {})) {
      if (typeof spec === "string") {
        on[event] = { target: spec };
        continue;
      }
      const actions = (spec.actions ?? []).map((action) => {
        const fields = Object.entries(action.assign ?? {}).map(([key, value]) => [
          key,
          xstateValue(value),
        ]);
        return assign(({ context, event }) =>
          Object.fromEntries(fields.map(([key, read]) => [key, read(context, event)])),
        );
      });
      on[event] = spec.target ? { target: spec.target, actions } : { actions };
    }
    states[name] = { on };
  }
  return createMachine({
    id: config.id,
    initial: config.initial,
    // The harness's own initialisation, which the other implementations do
    // with two `set` calls: the host's date, and the reset that follows it.
    context: { ...config.context, today, targetDate: today },
    states,
  });
}

const IMPLEMENTATIONS = [
  {
    name: "hand-written  (src/AddWorkoutDialog.rgr)",
    make: (today) => {
      const d = new AddWorkoutDialog();
      d.today = today;
      d.reset();
      return {
        send: (e, v) => d.send(e, v),
        state: () => d.state,
        context: () => ({
          targetDate: d.targetDate,
          targetCalendarId: d.targetCalendarId,
          inputText: d.inputText,
          error: d.error,
        }),
      };
    },
  },
  {
    // The machine read from the shape createMachine() takes — one file the
    // TypeScript app and this could both hold, neither a transcription of the
    // other.
    name: "from the config (fixtures/machines/addWorkoutDialog.machine.json)",
    make: (today) => {
      const r = new ScRunner();
      r.start(StatechartJson.load(machineJson));
      r.setStr("today", today);
      r.setStr("targetDate", today);
      return {
        send: (type, value, field) => r.send(eventOf(type, field, value)),
        state: () => r.state,
        context: () => contextOf(r, CONTEXT_KEYS),
      };
    },
  },
  {
    name: "as data       (src/AddWorkoutChart.rgr on gallery/statechart)",
    make: (today) => {
      const r = AddWorkoutChart.started(today);
      return {
        send: (type, value, field) => r.send(eventOf(type, field, value)),
        state: () => r.state,
        context: () => contextOf(r, CONTEXT_KEYS),
      };
    },
  },
];

if (xstate) {
  IMPLEMENTATIONS.push({
    name: `real XState (xstate ${xstateVersion}, the same config)`,
    make: (today) => {
      const actor = xstate.createActor(xstateMachine(JSON.parse(machineJson), today)).start();
      const read = () => {
        const s = actor.getSnapshot();
        return {
          state: s.value,
          context: {
            targetDate: s.context.targetDate,
            targetCalendarId: s.context.targetCalendarId,
            inputText: s.context.inputText,
            error: s.context.error,
          },
        };
      };
      return {
        send: (type, value, field) => {
          const event = field ? { type, [field]: value } : { type };
          // `can` is the question the other implementations answer: did the
          // current state HANDLE this event. An earlier draft here compared
          // the snapshot before and after instead, which is a different
          // question — and the fuzz below caught it on the first run it
          // mattered: `SET_INPUT_TEXT { text: "" }` while the text is already
          // empty is handled and changes nothing.
          const handled = actor.getSnapshot().can(event);
          actor.send(event);
          return handled;
        },
        state: () => read().state,
        context: () => read().context,
      };
    },
  });
}

const table = JSON.parse(
  fs.readFileSync(
    path.join(HERE, "..", "fixtures", "machines", "addWorkoutDialog.json"),
    "utf8",
  ),
);

let failed = 0;

console.log(`\n  ${table.machine} — ${table.source}`);

for (const impl of IMPLEMENTATIONS) {
  console.log(`\n  · ${impl.name}\n`);
  for (const cell of table.cells) {
    const m = impl.make(table.today);
    for (const [event, value, field] of table.seeds[cell.from]) m.send(event, value, field);

    if (m.state() !== cell.from) {
      failed += 1;
      console.log(`  FAIL ${cell.from} + ${cell.event} — seed left it in ${m.state()}`);
      continue;
    }

    const moved = m.send(cell.event, cell.value, cell.field);
    const got = { moved, state: m.state(), context: m.context() };
    const want = { moved: cell.moved, state: cell.to, context: cell.context };
    const same = JSON.stringify(got) === JSON.stringify(want);
    const label = `${cell.from} + ${cell.event}`.padEnd(34);
    if (same) {
      console.log(`  PASS ${label} → ${cell.to}${cell.ignored ? "  (ignored)" : ""}`);
    } else {
      failed += 1;
      console.log(`  FAIL ${label}\n         want ${JSON.stringify(want)}\n          got ${JSON.stringify(got)}`);
    }
  }
}

// --- differential fuzz against the real library -----------------------------
//
// Twenty-one cells from three seeds is a table, not a parity test: it only
// asks what happens from the three contexts someone thought to write down.
// This walks random event sequences instead and requires every implementation
// to stay in lockstep with XState after EVERY step — state and whole context.
//
// The sequences are seeded, so a divergence is reproducible: the seed and the
// step are printed and the run can be repeated exactly.
if (xstate) {
  const EVENTS = Object.keys(
    Object.values(JSON.parse(machineJson).states).reduce(
      (all, node) => Object.assign(all, node.on ?? {}),
      {},
    ),
  );
  const FIELD = Object.fromEntries(
    table.cells.filter((c) => c.field).map((c) => [c.event, c.field]),
  );
  const VALUES = ["", "2026-07-04", "Exercise Kyykky|5x5", "boom"];

  // A small deterministic generator: a fuzz that cannot be re-run is a bug
  // report nobody can act on. xorshift32 rather than an LCG on doubles —
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

  const RUNS = 400;
  const LENGTH = 12;
  let diverged = 0;

  for (let run = 0; run < RUNS && diverged === 0; run += 1) {
    const made = IMPLEMENTATIONS.map((impl) => ({
      name: impl.name,
      m: impl.make(table.today),
    }));
    for (let step = 0; step < LENGTH; step += 1) {
      const type = pick(EVENTS);
      const field = FIELD[type] ?? "";
      const value = field ? pick(VALUES) : "";
      const answers = made.map(({ name, m }) => {
        const moved = m.send(type, value, field);
        return { name, moved, state: m.state(), context: m.context() };
      });
      const oracle = answers[answers.length - 1];
      const off = answers.filter(
        (a) => JSON.stringify({ ...a, name: 0 }) !== JSON.stringify({ ...oracle, name: 0 }),
      );
      if (off.length > 0) {
        diverged += 1;
        failed += 1;
        console.log(
          `\n  FAIL fuzz run ${run}, step ${step}: ${type}` +
            (field ? ` { ${field}: ${JSON.stringify(value)} }` : "") +
            `\n         XState ${JSON.stringify({ ...oracle, name: undefined })}`,
        );
        for (const a of off) {
          console.log(`         ${a.name}\n           ${JSON.stringify({ ...a, name: undefined })}`);
        }
        break;
      }
    }
  }
  if (diverged === 0) {
    console.log(
      `\n  PASS ${RUNS} random sequences of ${LENGTH} events — every implementation\n` +
        `       stayed in lockstep with xstate ${xstateVersion} after every step`,
    );
  }
}

const ignores = table.cells.filter((c) => c.ignored).length;
console.log("");
if (failed) {
  console.log(`${failed} of ${table.cells.length} cell(s) differ from the machine`);
  process.exit(1);
}
if (!xstate) {
  console.log(
    "NOTE: xstate is not installed, so the real library did not run and these\n" +
      "implementations are only agreeing with a transcription. Install it with\n" +
      "`npm run ui:conformance:install`.",
  );
}
console.log(
  `all ${table.cells.length} cells match the machine in ${IMPLEMENTATIONS.length} implementations ` +
    `— ${ignores} of them events it ignores`,
);
console.log("ALL PASS");
