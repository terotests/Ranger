#!/usr/bin/env node
/**
 * Drive EVG live-build with Google Gemini Flash over the network.
 *
 *   npm run livebuild:withgemini
 *
 * Needs a Google AI Studio key — not the Cursor `agent` CLI:
 *
 *   export GEMINI_API_KEY=…     # https://aistudio.google.com/apikey
 *
 * GOOGLE_API_KEY is accepted if GEMINI_API_KEY is empty.
 * Optional: EVG_GEMINI_MODEL (default gemini-3.8-flash).
 *
 * Recipe still works without keys (`npm run livebuild:serve`).
 * Cursor still works with `npm run livebuild:withcursor`.
 */
import fs from "node:fs";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { geminiBase, geminiKey, geminiMaxTurns, geminiModel, geminiRates, geminiSandbox } from "./gemini-agent.mjs";
import { root } from "./agents.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.EVG_LIVEBUILD_PORT || 8765);

function helpMissing() {
  return `GEMINI_API_KEY is not set.

Get a key from Google AI Studio (the Gemini Developer API, not Vertex):
  https://aistudio.google.com/apikey

  export GEMINI_API_KEY=…

GOOGLE_API_KEY is accepted if GEMINI_API_KEY is empty.

Optional:
  export EVG_GEMINI_MODEL=gemini-3.8-flash
  export EVG_GEMINI_MAX_TURNS=64          # generateContent rounds per Follow-up
  export EVG_GEMINI_SANDBOX=docker        # opt-in: same four tools in node-slim
  export TESSERACT_PATH=/opt/homebrew/bin/tesseract   # ocr tool; brew install tesseract

Then:
  npm run livebuild:withgemini

Recipe (no keys) still works:
  npm run livebuild:serve

Local Cursor (your subscription) is a different door:
  npm run livebuild:withcursor
`;
}

function compile(src, out, outRel = "gallery/evg/bin") {
  const env = { ...process.env, RANGER_LIB: "./compiler/Lang.rgr:./lib/stdops.rgr" };
  const outdir = path.join(root, outRel);
  const dest = path.join(outdir, out);
  fs.mkdirSync(outdir, { recursive: true });
  try {
    fs.unlinkSync(dest);
  } catch {
    /* first run */
  }
  const log = spawnSync(
    "node",
    ["bin/output.js", "-es6", src, `-d=${outdir}`, `-o=${out}`, "-nodecli"],
    { cwd: root, encoding: "utf8", env, maxBuffer: 20 * 1024 * 1024 },
  );
  const text = `${log.stdout || ""}${log.stderr || ""}`;
  if (log.status !== 0 || /Compilation FAILED/.test(text) || !fs.existsSync(dest)) {
    const fail = text.split("\n").filter((l) => /\[FAIL\]|FAILED|error/i.test(l)).slice(0, 40);
    throw new Error(`compile ${src} failed:\n${fail.join("\n") || text.slice(-1500)}`);
  }
}

function report() {
  const rates = geminiRates();
  process.stderr.write(`Gemini key:  ${geminiKey() ? "yes" : "no"}\n`);
  process.stderr.write(`Model:       ${geminiModel()}\n`);
  process.stderr.write(`Max turns:   ${geminiMaxTurns()}\n`);
  process.stderr.write(`Sandbox:     ${geminiSandbox()}\n`);
  process.stderr.write(`Endpoint:    ${geminiBase()}\n`);
  process.stderr.write(`Rates:       $${rates.inputPerM} / $${rates.outputPerM} per 1M in/out (Flash paid tier)\n`);
}

function main() {
  const check = process.argv.includes("--check");
  const key = geminiKey();
  if (!key) {
    if (check) {
      process.stdout.write("gemini API off\n");
      process.exit(0);
    }
    process.stderr.write(helpMissing());
    process.exit(1);
  }
  if (check) {
    report();
    process.stdout.write(`gemini API ready (${geminiModel()})\n`);
    process.exit(0);
  }

  compile("./gallery/evg/livebuild/EvgLiveBuildMain.rgr", "evg_livebuild.js");
  try {
    compile("./lib/evg/agent/evg_agent.rgr", "evg_agent.js", "lib/evg/bin");
  } catch (e) {
    process.stderr.write(`evg_agent compile skipped: ${e.message}\n`);
  }

  process.env.EVG_LIVEBUILD_DEFAULT_AGENT = process.env.EVG_LIVEBUILD_DEFAULT_AGENT || "gemini";
  report();
  process.stderr.write(`\nOpen http://127.0.0.1:${PORT}/?agent=gemini\n`);
  process.stderr.write("The page calls Gemini Flash over the network and runs ./evg-agent in a bounded workspace.\n");
  process.stderr.write("Each Follow-up prints input / output tokens and an about-cost on this console.\n");
  process.stderr.write("This uses your Google AI Studio credits. Ctrl+C stops the server.\n\n");

  const child = spawn(process.execPath, [path.join(here, "serve.mjs")], {
    cwd: root,
    env: process.env,
    stdio: "inherit",
  });
  child.on("exit", (code, signal) => {
    if (signal) process.exit(1);
    process.exit(code ?? 1);
  });
}

main();
