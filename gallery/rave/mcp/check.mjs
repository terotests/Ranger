// SPDX-License-Identifier: AGPL-3.0-or-later
//
// The MCP server, spoken to the way a host speaks to it: initialize, list the
// tools, call them. No client library — if this passes, the wire is right.

import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SERVER = path.join(HERE, "server.mjs");
const ROOT = path.resolve(HERE, "..", "..", "..");

let failed = 0;
const ok = (name, cond, extra) => {
  if (cond) return console.log(`  PASS  ${name}`);
  failed += 1;
  console.log(`  FAIL  ${name}${extra == null ? "" : "  — " + String(extra).slice(0, 300)}`);
};

const dir = fs.mkdtempSync(path.join(os.tmpdir(), "rave-mcp-"));
const server = spawn(process.execPath, [SERVER], { cwd: dir, stdio: ["pipe", "pipe", "pipe"] });

let buffer = "";
const waiting = new Map();
server.stdout.on("data", (chunk) => {
  buffer += chunk;
  let at;
  while ((at = buffer.indexOf("\n")) >= 0) {
    const line = buffer.slice(0, at).trim();
    buffer = buffer.slice(at + 1);
    if (!line) continue;
    const msg = JSON.parse(line);
    const settle = waiting.get(msg.id);
    if (settle) {
      waiting.delete(msg.id);
      settle(msg);
    }
  }
});

let nextId = 1;
const call = (method, params) =>
  new Promise((settle) => {
    const id = nextId++;
    waiting.set(id, settle);
    server.stdin.write(JSON.stringify({ jsonrpc: "2.0", id, method, params }) + "\n");
  });

const hello = await call("initialize", { protocolVersion: "2025-06-18", capabilities: {} });
ok("initialize answers", hello.result && hello.result.serverInfo.name === "ranger-design", JSON.stringify(hello));
ok("…echoing the version the host asked for", hello.result.protocolVersion === "2025-06-18");

const listed = await call("tools/list", {});
const names = (listed.result.tools || []).map((t) => t.name);
ok("the tools are listed", names.length === 8, names.join(", "));
ok("…with schemas", listed.result.tools.every((t) => t.inputSchema && t.inputSchema.type === "object"));

const made = await call("tools/call", {
  name: "rave_new",
  arguments: { path: "app.rave", name: "Served", start: "crud" },
});
ok("rave_new makes a project", !made.result.isError, made.result.content[0].text);
ok("…in the directory the server was started in", fs.existsSync(path.join(dir, "app.rave")));
ok("…and answers with its check", /RAVE OK/.test(made.result.content[0].text));

const read = await call("tools/call", { name: "rave_read", arguments: { path: "app.rave" } });
ok("rave_read is the markup", read.result.content[0].text.startsWith("<app "));

const bad = await call("tools/call", {
  name: "rave_write",
  arguments: {
    path: "app.rave",
    markup:
      '<app name="Bad"/>\n<page name="Home"><h1 style="aspect-ratio: 16/9">Hi</h1></page>\n<route path="/" title="Home" page="Home"/>\n',
  },
});
ok("rave_write says when what was written does not hold up", bad.result.isError === true);
ok("…naming the property the engine refused", /aspect-ratio/.test(bad.result.content[0].text), bad.result.content[0].text);

const good = await call("tools/call", {
  name: "rave_write",
  arguments: {
    path: "app.rave",
    markup:
      '<app name="Fine"/>\n<page name="Home" style="padding: 24px; background-color: #ffffff">' +
      '<h1 style="font-size: 28px; color: #111318">Hi</h1></page>\n' +
      '<route path="/" title="Home" page="Home"/>\n',
  },
});
ok("…and is quiet when it does", good.result.isError !== true, good.result.content[0].text);

const spec = await call("tools/call", { name: "rave_spec", arguments: {} });
ok("rave_spec is the format", /RAVE MARKUP/.test(spec.result.content[0].text));

const fig = await call("tools/call", {
  name: "figma_check",
  arguments: { path: path.join(ROOT, "gallery", "figma", "fixtures", "sample.fig") },
});
ok("figma_check reads a .fig", /sample\.fig · \d+ nodes/.test(fig.result.content[0].text), fig.result.content[0].text);

const missing = await call("tools/call", { name: "nope", arguments: {} });
ok("a tool that is not there is an error, not a crash", !!missing.error);

server.kill();
fs.rmSync(dir, { recursive: true, force: true });
console.log(failed === 0 ? "\nALL PASS" : `\nfailed=${failed}`);
process.exit(failed === 0 ? 0 : 1);
