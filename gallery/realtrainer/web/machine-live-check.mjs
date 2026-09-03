#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later
//
// A ported machine against the library, live.
//
//   node gallery/realtrainer/web/machine-live-check.mjs
//
// `machine-check.mjs` drives one machine against a transition table someone
// transcribed by hand — which is worth doing once, to prove the machine was
// READ right. It does not scale: `planDialogMachine` is six states and
// eighteen events, and a hundred and eight cells transcribed by hand is a
// hundred and eight chances to write down what you assumed.
//
// So this asks XState instead. The same config runs in `gallery/statechart`'s
// runner and in `xstate`, every state is crossed with every event from a
// seeded path, and both sides have to answer the same thing: was the event
// handled, where did it leave the machine, and what is the whole context. Then
// the same again over random sequences, which is what catches the orders
// nobody thought to write down.
//
// Two things come from the HOST rather than from the machine, and both sides
// get the same host:
//
//   defaultWeekStart   the original computes it with `new Date()` in its own
//                      reducer; a clock belongs outside a state machine
//   a named action     CONFIRM_WEEK_SELECTION reduces fetched entries to a day
//                      map by asking each date what weekday it is. That is
//                      computation, not data, so the machine NAMES it and the
//                      host provides it — which is XState's own
//                      `setup({ actions })`.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { requireHostTool } from "../../ui/conformance/dom-adapter.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, "..");
const require_ = createRequire(import.meta.url);

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

const { StatechartJson } = require_(
  path.join(ROOT, "..", "statechart", "bin", "StatechartJson.cjs"),
);
const { ScRunner, ScEvent, ScValOps } = require_(
  path.join(ROOT, "..", "statechart", "bin", "Statechart.cjs"),
);

// --- the host, shared by both sides -----------------------------------------

const TODAY = "2026-02-09";

/**
 * `selectFetchedDaysForReplacement`, the one action the machine names instead
 * of describing: every fetched entry's weekday, selected. Both sides run THIS
 * function, so what is compared is the machine and not two readings of a date.
 */
function selectFetchedDays(context) {
  const out = {};
  for (const entry of context.fetchedEntriesInWeek ?? []) {
    out[new Date(entry.date).getDay()] = true;
  }
  return out;
}
const HOST_ACTIONS = { selectFetchedDaysForReplacement: selectFetchedDays };

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

function ours(config, keys) {
  const r = new ScRunner();
  r.start(StatechartJson.load(JSON.stringify(config)));
  r.setStr("defaultWeekStart", TODAY);
  r.setStr("targetWeekStart", TODAY);
  const read = () => Object.fromEntries(keys.map((k) => [k, JSON.parse(r.json(k))]));
  return {
    send: (type, fields) => {
      const e = ScEvent.of(type);
      for (const [k, v] of Object.entries(fields ?? {})) e.with(k, toScVal(v));
      const handled = r.send(e);
      // The host runs what the machine named, which is the whole contract.
      for (const name of r.pending) {
        r.set(name === "selectFetchedDaysForReplacement" ? "replaceSelectedByDay" : name,
              toScVal(HOST_ACTIONS[name](read())));
      }
      return handled;
    },
    state: () => r.state,
    context: read,
  };
}

// --- the library ------------------------------------------------------------

function xstateValue(spec) {
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

function theirs(config, keys) {
  const { createMachine, assign, createActor } = xstate;
  const states = {};
  for (const [name, node] of Object.entries(config.states)) {
    const on = {};
    for (const [event, spec] of Object.entries(node.on ?? {})) {
      if (typeof spec === "string") {
        on[event] = { target: spec };
        continue;
      }
      const actions = (spec.actions ?? []).map((action) => {
        if (action.action) {
          const run = HOST_ACTIONS[action.action];
          return assign(({ context }) => ({ replaceSelectedByDay: run(context) }));
        }
        const fields = Object.entries(action.assign ?? {}).map(([k, v]) => [k, xstateValue(v)]);
        return assign(({ context, event }) =>
          Object.fromEntries(fields.map(([k, read]) => [k, read(context, event)])),
        );
      });
      on[event] = spec.target ? { target: spec.target, actions } : { actions };
    }
    states[name] = { on };
  }
  const actor = createActor(
    createMachine({
      id: config.id,
      initial: config.initial,
      context: { ...config.context, defaultWeekStart: TODAY, targetWeekStart: TODAY },
      states,
    }),
  ).start();
  const read = () =>
    Object.fromEntries(keys.map((k) => [k, actor.getSnapshot().context[k] ?? null]));
  return {
    send: (type, fields) => {
      const event = { type, ...(fields ?? {}) };
      const handled = actor.getSnapshot().can(event);
      actor.send(event);
      return handled;
    },
    state: () => actor.getSnapshot().value,
    context: read,
  };
}

// --- the run ----------------------------------------------------------------

const MACHINES = [
  {
    file: "planDialog.machine.json",
    // One path to each state, so every cell starts somewhere real.
    seeds: {
      closed: [],
      weekSelection: [["OPEN_WEEK_SELECTION", { weekStart: "2026-03-02", weekType: "light" }]],
      confirmation: [
        ["OPEN_WEEK_SELECTION", { weekStart: "2026-03-02" }],
        ["CONFIRM_WEEK_SELECTION", { fetchedEntries: [{ id: "a", date: "2026-03-03" }] }],
      ],
      editInstructions: [["OPEN_EDIT_INSTRUCTIONS", {}]],
      regenerating: [["OPEN_EDIT_INSTRUCTIONS", {}], ["START_REGENERATING", {}]],
      creating: [
        ["OPEN_WEEK_SELECTION", { weekStart: "2026-03-02" }],
        ["CONFIRM_WEEK_SELECTION", { fetchedEntries: [{ id: "a", date: "2026-03-03" }] }],
        ["CONFIRM_REPLACEMENT", {}],
      ],
    },
    // The payload each event carries, from the machine's own event union.
    payloads: {
      OPEN_WEEK_SELECTION: { weekStart: "2026-04-06", weekType: "light", showInstructions: true, targetCalendarId: "cal-9" },
      SET_WEEK_START: { weekStart: "2026-05-04" },
      SET_WEEK_TYPE: { weekType: "light" },
      SET_CREATE_INSTRUCTIONS: { instructions: "kevyt viikko" },
      SET_EDIT_GENERAL_FEEDBACK: { feedback: "enemmän vetoja" },
      SET_EDIT_DAY_INSTRUCTIONS: { dayIndex: 2, instructions: "pitkä juoksu" },
      SET_KEEP_SAME_BY_DAY: { day: 3, keep: true },
      SET_SHOW_PREVIOUS_BY_DAY: { day: 4, show: true },
      SET_REPLACE_SELECTED_BY_DAY: { day: 5, selected: false },
      REORDER_DAYS: { newOrder: [6, 5, 4, 3, 2, 1, 0] },
      CONFIRM_WEEK_SELECTION: { fetchedEntries: [{ id: "b", date: "2026-03-05" }] },
      ERROR: { error: "boom" },
    },
  },
];

let failed = 0;
const say = (name, cond, detail) => {
  if (cond) console.log(`  PASS ${name}`);
  else {
    failed += 1;
    console.log(`  FAIL ${name}${detail === undefined ? "" : `\n         ${detail}`}`);
  }
};

for (const spec of MACHINES) {
  const config = JSON.parse(
    fs.readFileSync(path.join(ROOT, "fixtures", "machines", spec.file), "utf8"),
  );
  const keys = Object.keys(config.context).filter((k) => k !== "defaultWeekStart");
  const events = [
    ...new Set(Object.values(config.states).flatMap((s) => Object.keys(s.on ?? {}))),
  ].sort();
  const states = Object.keys(config.states);

  console.log(`\n  ${config.id} — ${states.length} states × ${events.length} events, live against xstate ${xstateVersion}\n`);

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
      const fields = spec.payloads[event] ?? {};
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
  if (failed === 0) {
    console.log(`  PASS ${cells} cells — ${ignored} of them events the machine ignores`);
  }

  // And the orders nobody wrote down.
  let seed = 20260903;
  const next = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff));
  const pick = (list) => list[next() % list.length];
  const RUNS = 300;
  const LENGTH = 14;
  let diverged = 0;
  for (let run = 0; run < RUNS && diverged === 0; run += 1) {
    const a = ours(config, keys);
    const b = theirs(config, keys);
    for (let step = 0; step < LENGTH; step += 1) {
      const event = pick(events);
      const fields = spec.payloads[event] ?? {};
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
