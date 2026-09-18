#!/usr/bin/env node
/**
 * The cloud-agent slot: this process stays alive while a host agent
 * (the Cursor agent in this container) edits `doc.evg.json` and appends
 * thinking lines to `think.log`. The orchestrator tokenizes stdout and
 * frames the watched tree.
 *
 *   node self-agent.mjs <workspace>
 *
 * Write `STOP` in the workspace when the tree is done.
 */
import fs from "node:fs";
import path from "node:path";

const ws = process.argv[2];
if (!ws) {
  console.error("usage: self-agent.mjs <workspace>");
  process.exit(2);
}

const thinkFile = path.join(ws, "think.log");
const stopFile = path.join(ws, "STOP");
fs.writeFileSync("/tmp/evg-live-self-workspace", ws + "\n");
if (!fs.existsSync(thinkFile)) fs.writeFileSync(thinkFile, "");

console.log("This is the Cursor cloud agent, not a recipe.");
console.log("Workspace " + ws);
console.log("I will patch doc.evg.json with EVGPatch. The host lays each save out.");

let pos = 0;
const started = Date.now();
const limitMs = Number(process.env.EVG_SELF_TIMEOUT_MS || 180000);

function flushThink() {
  let st;
  try {
    st = fs.statSync(thinkFile);
  } catch {
    return;
  }
  if (st.size <= pos) return;
  const buf = Buffer.alloc(st.size - pos);
  const fd = fs.openSync(thinkFile, "r");
  fs.readSync(fd, buf, 0, buf.length, pos);
  fs.closeSync(fd);
  pos = st.size;
  for (const line of buf.toString("utf8").split("\n")) {
    if (line.trim()) console.log(line);
  }
}

const iv = setInterval(() => {
  flushThink();
  if (fs.existsSync(stopFile) || Date.now() - started > limitMs) {
    flushThink();
    clearInterval(iv);
    console.log("Done. The tree is in doc.evg.json.");
    process.exit(0);
  }
}, 80);
