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
ok("the tools are listed", names.length === 11, names.join(", "));
ok("…with schemas", listed.result.tools.every((t) => t.inputSchema && t.inputSchema.type === "object"));
ok("…including measure and outline", names.includes("rave_measure") && names.includes("rave_outline"));

const made = await call("tools/call", {
  name: "rave_new",
  arguments: { path: "app.rave", name: "Served", start: "crud" },
});
ok("rave_new makes a project", !made.result.isError, made.result.content[0].text);
ok("…in the directory the server was started in", fs.existsSync(path.join(dir, "app.rave")));
ok("…and answers with its check", /RAVE OK/.test(made.result.content[0].text));
ok("…naming the routes, so a shot does not have to guess", /\/items/.test(made.result.content[0].text), made.result.content[0].text);

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

const shot = await call("tools/call", {
  name: "rave_shot",
  arguments: { path: "app.rave", width: 390 },
});
const image = (shot.result.content || []).find((c) => c.type === "image");
ok("rave_shot comes back as a picture", !!image, JSON.stringify(shot.result).slice(0, 300));
ok("…a real PNG", !!image && Buffer.from(image.data, "base64").subarray(1, 4).toString() === "PNG");
ok("…naming the route, not a deleted temp file", / at 390/.test(shot.result.content[0].text) && !/\/tmp\/rave-shot-/.test(shot.result.content[0].text), shot.result.content[0].text);
ok("…and measuring the same tree", /MEASURE 0 findings/.test(shot.result.content[0].text), shot.result.content[0].text);

const outlined = await call("tools/call", { name: "rave_outline", arguments: { path: "app.rave", width: 390, depth: 2 } });
ok("rave_outline is the laid-out tree", /#page-shot/.test(outlined.result.content[0].text), outlined.result.content[0].text);

const measured = await call("tools/call", { name: "rave_measure", arguments: { path: "app.rave", width: 390 } });
ok("rave_measure is quiet on a sound page", measured.result.isError !== true && /MEASURE 0 findings/.test(measured.result.content[0].text), measured.result.content[0].text);

const wide = await call("tools/call", {
  name: "rave_write",
  arguments: {
    path: "wide.rave",
    markup:
      '<app name="Wide"/>\n<page name="Home">' +
      '<div name="Too wide" style="width: 800px; height: 40px; background-color: #111318"></div>' +
      "</page>\n<route path=\"/\" title=\"Home\" page=\"Home\"/>\n",
  },
});
ok("a wide box still parses", /RAVE OK/.test(wide.result.content[0].text), wide.result.content[0].text);
const wideMeasure = await call("tools/call", { name: "rave_measure", arguments: { path: "wide.rave", width: 390 } });
ok("rave_measure says when a box does not fit", wideMeasure.result.isError === true, wideMeasure.result.content[0].text);
ok("…as MEASURE, not raw JSON", /MEASURE 1 finding/.test(wideMeasure.result.content[0].text), wideMeasure.result.content[0].text);
ok("…naming overflow or the page edge", /overflow|past the page/.test(wideMeasure.result.content[0].text), wideMeasure.result.content[0].text);

const missing = await call("tools/call", { name: "nope", arguments: {} });
ok("a tool that is not there is an error, not a crash", !!missing.error);

server.kill();
fs.rmSync(dir, { recursive: true, force: true });
console.log(failed === 0 ? "\nALL PASS" : `\nfailed=${failed}`);
process.exit(failed === 0 ? 0 : 1);
