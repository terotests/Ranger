#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later
//
// The emulated M-Files API, measured two ways.
//
//   npm run mfiles:bench              # coverage + timings
//   node gallery/mfiles/tests/uix-bench.mjs --json
//
// COVERAGE — every IVault method the official uix-extensions declarations list
// (uix/uix-api.js, generated from vault.d.ts) is called once with an empty
// request from inside a UIX v2 application. "emulated" is any answer but the
// emulator's own 501; a 4xx for a missing field still means the method exists.
//
// SPEED — the same vault read at three depths, so the cost of each layer is
// visible on its own:
//
//   direct     JS → compiled Ranger MfGrpc.call (JSON in, JSON out)
//   uix v2     an application in Ranger's ComponentEngine awaiting
//              shellUI.Vault.ObjectOperations.GetObjectDataOfMultipleObjects
//   uix v1     the same read through the synchronous v1 COM-style API
//   mfgrpc     building request messages with the uix-vault-messages helpers
//
// The clock is the host's. The engine's realm clock does not advance inside a
// turn, so a loop timed with Date.now() inside the application reads zero; the
// loop runs in a CustomCommand handler and this file times the command.

import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const MODULE = path.join(HERE, "..");
const require_ = createRequire(import.meta.url);
const { MfUixHost } = require_(path.join(MODULE, "bin", "MfUixHost.cjs"));
const read = (rel) => fs.readFileSync(path.join(MODULE, rel), "utf8");
const asJson = process.argv.includes("--json");
const N = Number(process.env.MFILES_BENCH_N || 300);

function boot(mode) {
  const host = MfUixHost.withSampleVault();
  host.setScripts(read("uix/uix-api.js"), read("uix/uix-core.js"), read("uix/uix1-prelude.js"), read("uix/uix2-prelude.js"), read("uix/mfgrpc.js"));
  host.mode = mode;
  return host;
}

// An application with one command whose handler runs `body`. Returns the host
// and the command id, with the application started and idle.
function appWithCommand(mode, body) {
  const host = boot(mode);
  const entry =
    mode === 2
      ? `function OnNewShellUI(ui) { ui.Events.Register(Event.NewNormalShellFrame, (frame) => { frame.Events.Register(Event.Started, async () => {
           const cmd = await frame.Commands.CreateCustomCommand("bench");
           frame.Commands.Events.Register(Event.CustomCommand, async (id) => { if (id !== cmd) return; try { ${body} } catch (e) { console.error(String(e)); } });
         }); }); }`
      : `function OnNewShellUI(ui) { ui.Events.Register(Event_NewNormalShellFrame, function (frame) { frame.Events.Register(Event_Started, function () {
           var cmd = frame.Commands.CreateCustomCommand("bench");
           frame.Commands.Events.Register(Event_CustomCommand, function (id) { if (id !== cmd) return; try { ${body} } catch (e) { console.error(String(e)); } });
         }); }); }`;
  host.addApp("bench", "{BENCH}", mode, entry);
  const cmd = host.shell.commands.find((c) => c.name === "bench");
  if (!cmd) throw new Error("the bench application did not start:\n" + host.shell.logs.map((l) => l.text).join("\n"));
  return { host, id: cmd.id };
}

function lastLog(host) {
  const out = host.shell.logs.filter((l) => l.appId === "bench" && (l.level === "log" || l.level === "error"));
  const errors = out.filter((l) => l.level === "error");
  if (errors.length) throw new Error(errors.map((l) => l.text).join("\n"));
  return out.length ? out[out.length - 1].text : "";
}

// --- coverage -------------------------------------------------------------------
const cov = appWithCommand(
  2,
  `
  const rows = [];
  for (const group of Object.keys(__MF_VAULT_API)) {
    for (const method of __MF_VAULT_API[group]) {
      let code = 200;
      try { await ui.Vault[group][method]({}); } catch (e) { code = e.code || 500; }
      rows.push([group + "." + method, code]);
    }
  }
  console.log(JSON.stringify(rows));
`
);
cov.host.runCustomCommand(cov.id);
const coverage = JSON.parse(lastLog(cov.host));
const emulated = coverage.filter(([, code]) => code !== 501);

// --- speed ----------------------------------------------------------------------
const objVer = { obj_vers: [{ obj_id: { type: 0, item_id: { internal_id: 1 } }, version: { type: 1 } }] };
const searchReq = {
  conditions: [{ value: [{ expression: { type: 1, data: { property_value: { property_def: 1006 } } }, type: 3, value: { type: 3, data: { real_number: 1000 } } }] }],
};

function timeDirect(method, req) {
  const host = boot(2);
  const g = host.shell.grpc;
  const text = JSON.stringify(req);
  g.call(method, text);
  const t0 = performance.now();
  for (let i = 0; i < N; i += 1) g.call(method, text);
  return (performance.now() - t0) / N;
}

// Mean milliseconds per iteration of `loop`, with the command dispatch itself
// (an empty loop) subtracted.
function timeInApp(mode, setup, loop) {
  const run = (count) => {
    const { host, id } = appWithCommand(mode, `${setup}\nfor (let i = 0; i < ${count}; i++) { ${loop} }\nconsole.log("done");`);
    host.runCustomCommand(id);
    const t0 = performance.now();
    host.runCustomCommand(id);
    const ms = performance.now() - t0;
    if (lastLog(host) !== "done") throw new Error("the bench loop did not finish");
    return ms;
  };
  const empty = run(0);
  return Math.max(0, run(N) - empty) / N;
}

const timings = {
  "direct GetObjectDataOfMultipleObjects": timeDirect("ObjectOperations.GetObjectDataOfMultipleObjects", objVer),
  "direct SearchObjects": timeDirect("SearchOperations.SearchObjects", searchReq),
  "uix v2 GetObjectDataOfMultipleObjects": timeInApp(2, `const req = ${JSON.stringify(objVer)};`, "await ui.Vault.ObjectOperations.GetObjectDataOfMultipleObjects(req);"),
  "uix v2 SearchObjects": timeInApp(2, `const req = ${JSON.stringify(searchReq)};`, "await ui.Vault.SearchOperations.SearchObjects(req);"),
  "uix v1 ObjectPropertyOperations.GetProperties": timeInApp(
    1,
    `var v = frame.ShellUI.Vault; var ov = MFiles.CreateInstance("ObjVer"); ov.SetIDs(0, 1, -1);`,
    "v.ObjectPropertyOperations.GetProperties(ov, false);"
  ),
  "mfgrpc build SearchConditionArray + wire": timeInApp(
    2,
    "",
    "const c = new MFGrpc.SearchConditionArray().Property(1006, 3, 3, 1000).Property(100, 1, 9, 2); c.AddDeletedCondition(false); __mfWire({ conditions: [c] });"
  ),
};

if (asJson) {
  console.log(JSON.stringify({ n: N, coverage: { declared: coverage.length, emulated: emulated.length, methods: coverage }, timings }, null, 2));
} else {
  console.log(`\n  IVault coverage (${read("uix/uix-api.js").match(/Source: (\S+)/)[1]})`);
  console.log(`  ${emulated.length} of ${coverage.length} declared methods emulated\n`);
  for (const [name, code] of coverage) console.log(`    ${code === 501 ? "·" : "✓"} ${name}${code === 501 || code === 200 ? "" : `  (${code} for an empty request)`}`);
  console.log(`\n  timings, mean of ${N} calls (ms per call)\n`);
  for (const [name, ms] of Object.entries(timings)) console.log(`    ${ms.toFixed(3).padStart(9)}  ${name}`);
  console.log("");
}
