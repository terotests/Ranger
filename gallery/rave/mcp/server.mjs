#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later
//
// ranger-design — one MCP server over the two design tools in this gallery:
// Rave (an application you can check) and the Figma reader under it.
//
// Dependency-free on purpose. MCP over stdio is newline-delimited JSON-RPC and
// four methods; a server that is one file with no install step is one a person
// can point Claude Code, Claude Desktop or Cursor at without thinking about it.
//
//   claude mcp add ranger-design -- node <ranger>/gallery/rave/mcp/server.mjs
//
//   // ~/.cursor/mcp.json, or .cursor/mcp.json beside a project
//   { "mcpServers": { "ranger-design": {
//       "command": "node", "args": ["<ranger>/gallery/rave/mcp/server.mjs"] } } }
//
// Paths in tool arguments are resolved against RANGER_DESIGN_CWD when it is
// set, and against the server's own working directory otherwise — which is the
// project directory in every host that launches it from one.

import { spawnSync } from "node:child_process";
import os from "node:os";
import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const RAVE = path.resolve(HERE, "..", "cli.mjs");
const FIGMA = path.resolve(HERE, "..", "..", "figma", "cli.mjs");
const BASE = process.env.RANGER_DESIGN_CWD || process.cwd();

const resolve = (p) => (path.isAbsolute(p) ? p : path.join(BASE, p));

function run(cli, args) {
  const out = spawnSync(process.execPath, [cli, ...args], {
    cwd: BASE,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
  const text = ((out.stdout || "") + (out.stderr || "")).trim();
  const failed = /^RAVE FAIL/m.test(text) || (out.status ?? 0) !== 0;
  return { text: text || "(no output)", failed };
}

const reply = (text, failed) => ({
  content: [{ type: "text", text }],
  isError: failed === true,
});

const TOOLS = [
  {
    name: "rave_spec",
    description:
      "The Rave markup format in full: every element, every attribute, the CSS the engine understands and the CSS it does not. Read this before writing or editing a .rave document for the first time.",
    inputSchema: { type: "object", properties: {} },
    run: () => reply(run(RAVE, ["spec"]).text),
  },
  {
    name: "rave_new",
    description:
      "Make a new Rave application at `path` — a routed, responsive, accessible app that runs, not a picture of one. Answers the four questions the editor's New-project sheet asks.",
    inputSchema: {
      type: "object",
      properties: {
        path: { type: "string", description: "where to write it, e.g. app.rave" },
        name: { type: "string" },
        start: {
          type: "string",
          enum: ["dashboard", "crud", "marketing", "masterdetail", "settings", "empty"],
        },
        nav: { type: "string", enum: ["sidebar", "topbar", "tabs", "none"] },
        auth: { type: "boolean", description: "a login page and protected routes (default true)" },
        targets: { type: "string", description: 'the widths, e.g. "web tablet mobile"' },
      },
      required: ["path"],
    },
    run: (a) => {
      const args = ["new", resolve(a.path)];
      if (a.name) args.push("--name", a.name);
      if (a.start) args.push("--start", a.start);
      if (a.nav) args.push("--nav", a.nav);
      if (a.auth === false) args.push("--no-auth");
      if (a.targets) args.push("--targets", a.targets);
      const made = run(RAVE, args);
      if (made.failed) return reply(made.text, true);
      const checked = run(RAVE, ["check", resolve(a.path)]);
      return reply(made.text + "\n\n" + checked.text, checked.failed);
    },
  },
  {
    name: "rave_check",
    description:
      "Parse a Rave document and build every route at every width it targets. Reports parse errors with line numbers, every CSS declaration the engine refused (these draw nothing and are silent anywhere else), and every accessibility problem. Ends RAVE OK or RAVE FAIL n. Run this after every change.",
    inputSchema: {
      type: "object",
      properties: { path: { type: "string" } },
      required: ["path"],
    },
    run: (a) => {
      const r = run(RAVE, ["check", resolve(a.path)]);
      return reply(r.text, r.failed);
    },
  },
  {
    name: "rave_read",
    description:
      "The document at `path` as Rave markup, spelled the way the writer spells it. Works on a .rave and on an app.rave.json alike.",
    inputSchema: {
      type: "object",
      properties: { path: { type: "string" } },
      required: ["path"],
    },
    run: (a) => {
      const r = run(RAVE, ["markup", resolve(a.path)]);
      return reply(r.text, r.failed);
    },
  },
  {
    name: "rave_write",
    description:
      "Write Rave markup to `path` and check it in the same breath: the answer is the check, so a document that does not hold up says so immediately. Use rave_spec first if you have not written this markup before.",
    inputSchema: {
      type: "object",
      properties: {
        path: { type: "string" },
        markup: { type: "string", description: "the whole document, from <app/> to the last <route/>" },
      },
      required: ["path", "markup"],
    },
    run: (a) => {
      const target = resolve(a.path);
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.writeFileSync(target, a.markup);
      const r = run(RAVE, ["check", target]);
      return reply(`wrote ${a.path} (${a.markup.length} bytes)\n\n${r.text}`, r.failed);
    },
  },
  {
    name: "rave_shot",
    description:
      "Paint one route of a Rave document at one width and return the picture. No browser: the route is built and styled at that viewport — a @media rule does not apply at all unless one is stated — and the gallery's own software rasterizer paints it. Use it to SEE what a change did, not only whether it passed the check.",
    inputSchema: {
      type: "object",
      properties: {
        path: { type: "string" },
        route: { type: "string", description: "which route, e.g. /dashboard (default: the first)" },
        width: { type: "number", description: "the viewport width, e.g. 390 or 1440 (default: the project's first target)" },
        loggedOut: { type: "boolean", description: "draw it as a visitor who has not signed in" },
      },
      required: ["path"],
    },
    run: (a) => {
      const out = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "rave-shot-")), "shot.png");
      const args = ["shot", resolve(a.path), "--out", out];
      if (a.route) args.push("--route", a.route);
      if (a.width) args.push("--width", String(a.width));
      if (a.loggedOut) args.push("--logged-out");
      const r = run(RAVE, args);
      if (!fs.existsSync(out)) return reply(r.text, true);
      const png = fs.readFileSync(out);
      fs.rmSync(path.dirname(out), { recursive: true, force: true });
      return {
        content: [
          { type: "text", text: r.text },
          { type: "image", data: png.toString("base64"), mimeType: "image/png" },
        ],
      };
    },
  },
  {
    name: "figma_check",
    description:
      "Read a .fig file the whole way — parsed, converted, imported as an application and drawn — and report everything each stage could not carry.",
    inputSchema: {
      type: "object",
      properties: { path: { type: "string" } },
      required: ["path"],
    },
    run: (a) => {
      const r = run(FIGMA, ["check", resolve(a.path)]);
      return reply(r.text, r.failed);
    },
  },
  {
    name: "figma_markup",
    description:
      "A .fig file read as a Rave application and printed as Rave markup — the design, as something that can be edited and checked.",
    inputSchema: {
      type: "object",
      properties: { path: { type: "string" } },
      required: ["path"],
    },
    run: (a) => {
      const r = run(FIGMA, ["markup", resolve(a.path)]);
      return reply(r.text, r.failed);
    },
  },
  {
    name: "figma_tree",
    description: "The node tree of a .fig file, as the reader sees it: types, names, ids and sizes.",
    inputSchema: {
      type: "object",
      properties: { path: { type: "string" } },
      required: ["path"],
    },
    run: (a) => {
      const r = run(FIGMA, ["tree", resolve(a.path)]);
      return reply(r.text, r.failed);
    },
  },
];

// --- the wire ---------------------------------------------------------------

const send = (msg) => process.stdout.write(JSON.stringify(msg) + "\n");
const ok = (id, result) => send({ jsonrpc: "2.0", id, result });
const err = (id, code, message) => send({ jsonrpc: "2.0", id, error: { code, message } });

readline.createInterface({ input: process.stdin }).on("line", (line) => {
  const text = line.trim();
  if (!text) return;
  let msg;
  try {
    msg = JSON.parse(text);
  } catch (e) {
    return;
  }
  const { id, method, params } = msg;
  // A notification has no id and wants no answer.
  if (id === undefined) return;

  if (method === "initialize") {
    const asked = params && typeof params.protocolVersion === "string" ? params.protocolVersion : null;
    ok(id, {
      protocolVersion: asked || "2024-11-05",
      capabilities: { tools: {} },
      serverInfo: { name: "ranger-design", version: "1.0.0" },
    });
    return;
  }
  if (method === "ping") {
    ok(id, {});
    return;
  }
  if (method === "tools/list") {
    ok(id, {
      tools: TOOLS.map((t) => ({
        name: t.name,
        description: t.description,
        inputSchema: t.inputSchema,
      })),
    });
    return;
  }
  if (method === "tools/call") {
    const tool = TOOLS.find((t) => t.name === (params && params.name));
    if (!tool) {
      err(id, -32602, `no tool called ${params && params.name}`);
      return;
    }
    try {
      ok(id, tool.run((params && params.arguments) || {}));
    } catch (e) {
      ok(id, reply(String((e && e.stack) || e), true));
    }
    return;
  }
  err(id, -32601, `no method called ${method}`);
});
