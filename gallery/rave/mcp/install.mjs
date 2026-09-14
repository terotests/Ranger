// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Write the `ranger-design` MCP entry where a host will find it, with
// ABSOLUTE paths — which is the difference between a server that starts and
// one a host reports as "configured, but not running in this session".
//
//   node gallery/rave/mcp/install.mjs --cursor            ~/.cursor/mcp.json
//   node gallery/rave/mcp/install.mjs --cursor --project  ./.cursor/mcp.json
//   node gallery/rave/mcp/install.mjs --claude            ~/.claude.json (user scope)
//   node gallery/rave/mcp/install.mjs --print             just show the entry
//   node gallery/rave/mcp/install.mjs --verify            start it and speak to it
//
// A relative `args` path only works when the host happens to launch the server
// from the directory the path is relative to. Claude Code does; Cursor is not
// obliged to, and when it does not, node exits with MODULE_NOT_FOUND before
// anything can say why.

import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SERVER = path.join(HERE, "server.mjs");
const args = process.argv.slice(2);
const has = (f) => args.includes(f);

// RANGER_DESIGN_CWD is where the tools' relative paths land. Default it to
// wherever this was run from, which is the project being worked on.
const entry = {
  command: process.execPath,
  args: [SERVER],
  env: { RANGER_DESIGN_CWD: process.cwd() },
};

if (has("--print") || args.length === 0) {
  console.log(JSON.stringify({ mcpServers: { "ranger-design": entry } }, null, 2));
  if (args.length === 0) {
    console.log("");
    console.log("  --cursor            write ~/.cursor/mcp.json");
    console.log("  --cursor --project  write ./.cursor/mcp.json");
    console.log("  --claude            print the `claude mcp add` line");
    console.log("  --verify            start the entry and speak to it");
  }
  process.exit(0);
}

function merge(file) {
  let doc = {};
  if (fs.existsSync(file)) {
    try {
      doc = JSON.parse(fs.readFileSync(file, "utf8"));
    } catch (e) {
      console.error(`${file} is not JSON — not touching it`);
      process.exit(1);
    }
  }
  doc.mcpServers = doc.mcpServers || {};
  doc.mcpServers["ranger-design"] = entry;
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(doc, null, 2) + "\n");
  console.log(`wrote ${file}`);
}

// Start the entry exactly as a host would and ask it for its tools. A host
// that says "configured, but not running" says nothing about why; this does.
async function verify() {
  const server = spawn(entry.command, entry.args, {
    cwd: os.homedir(),
    env: { ...process.env, ...entry.env },
    stdio: ["pipe", "pipe", "pipe"],
  });
  let err = "";
  server.stderr.on("data", (c) => (err += c));
  const answer = await new Promise((settle) => {
    let buffer = "";
    const timer = setTimeout(() => settle(null), 15000);
    server.stdout.on("data", (chunk) => {
      buffer += chunk;
      const at = buffer.indexOf("\n");
      if (at < 0) return;
      clearTimeout(timer);
      try {
        settle(JSON.parse(buffer.slice(0, at)));
      } catch (e) {
        settle(null);
      }
    });
    server.on("exit", () => {
      clearTimeout(timer);
      settle(null);
    });
    server.stdin.write(
      JSON.stringify({ jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-06-18", capabilities: {} } }) + "\n",
    );
  });
  server.kill();
  if (answer && answer.result && answer.result.serverInfo) {
    console.log(`the server starts and answers: ${answer.result.serverInfo.name} ${answer.result.serverInfo.version || ""}`.trim());
    return true;
  }
  console.error("the server did not answer. What it said on stderr:");
  console.error(err.trim() || "  (nothing)");
  return false;
}

if (has("--verify") && !has("--cursor") && !has("--claude")) {
  process.exit((await verify()) ? 0 : 1);
}

if (has("--cursor")) {
  merge(has("--project") ? path.join(process.cwd(), ".cursor", "mcp.json") : path.join(os.homedir(), ".cursor", "mcp.json"));
  console.log("");
  console.log("In Cursor: Settings → Cursor Settings → MCP (or the MCP Tools panel),");
  console.log("find `ranger-design` and turn it on. If it is not listed, reload the");
  console.log("window — Cursor reads the file when the window opens.");
  console.log("");
  if (!(await verify())) process.exit(1);
}

if (has("--claude")) {
  console.log(`claude mcp add --scope user ranger-design -- ${process.execPath} ${SERVER}`);
}
