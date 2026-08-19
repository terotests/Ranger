/**
 * clipboard_smoke.mjs — copy a chart through the running host and check that
 * what comes back is what Excel and Word would actually receive.
 *
 * The unit tests build the payload directly; this drives the whole seam the
 * browser drives — start the server, click the buttons by finding them in the
 * scene, read the reply — because the interesting failure is not "the PNG is
 * wrong" but "the click produced no reply at all". A chart is copied by a
 * BUTTON as well as by Ctrl+C, and a pointer event used to return nothing.
 *
 * No browser needed: fetch does what the client does.
 *
 *   node gallery/datagrid/web/clipboard_smoke.mjs [--port 8799]
 */
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import zlib from "node:zlib";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "../../..");
const PORT = parseInt(argVal("--port", "8799"), 10);
const BASE = `http://127.0.0.1:${PORT}`;
const FIXTURE = "gallery/datagrid/fixtures/sales.xlsx";

function argVal(flag, dflt) {
  const i = process.argv.indexOf(flag);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : dflt;
}

const checks = [];
function check(name, ok, detail) {
  checks.push({ name, ok });
  console.log(`  ${ok ? "PASS" : "FAIL"} ${name}${detail ? " — " + detail : ""}`);
}

async function post(route, body) {
  const res = await fetch(BASE + route, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  if (res.status === 204) return null;
  return res.json();
}

async function get(route) {
  const res = await fetch(BASE + route);
  return res.json();
}

/** Where a piece of text is painted, so a click can find a button by its
 *  label rather than by a coordinate that goes stale. */
async function findText(label) {
  const scene = await get("/scene.json");
  for (const c of scene.list.cmds) {
    if (c.text === label) return c;
  }
  return null;
}

async function clickText(label, dx, dy) {
  const at = await findText(label);
  if (!at) throw new Error(`nothing painted says "${label}"`);
  const x = Math.round(at.x + (dx || 8));
  const y = Math.round(at.y + (dy || 6));
  const down = await post("/input", { type: "pointer", x, y, down: true });
  const up = await post("/input", { type: "pointer", x, y, down: false });
  return down || up;
}

/** The PNG, read the way any other program would read it. */
function readPng(bytes) {
  if (bytes.length < 24) return { ok: false, why: "too short" };
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  if (!bytes.subarray(0, 8).equals(sig)) return { ok: false, why: "no signature" };
  let pos = 8;
  let idat = Buffer.alloc(0);
  let width = 0;
  let height = 0;
  while (pos + 8 <= bytes.length) {
    const len = bytes.readUInt32BE(pos);
    const tag = bytes.subarray(pos + 4, pos + 8).toString("latin1");
    const body = bytes.subarray(pos + 8, pos + 8 + len);
    const crc = bytes.readUInt32BE(pos + 8 + len);
    if (crc !== zlib.crc32(bytes.subarray(pos + 4, pos + 8 + len))) {
      return { ok: false, why: `bad CRC on ${tag}` };
    }
    if (tag === "IHDR") {
      width = body.readUInt32BE(0);
      height = body.readUInt32BE(4);
    } else if (tag === "IDAT") {
      idat = Buffer.concat([idat, body]);
    }
    pos += 12 + len;
  }
  let raw;
  try {
    raw = zlib.inflateSync(idat);
  } catch (e) {
    return { ok: false, why: "IDAT does not inflate: " + e.message };
  }
  const want = height * (1 + width * 3);
  if (raw.length !== want) {
    return { ok: false, why: `inflated ${raw.length}, expected ${want}` };
  }
  return { ok: true, width, height };
}

async function waitForHealth(tries) {
  for (let i = 0; i < tries; i += 1) {
    try {
      const h = await get("/health");
      if (h && h.ok) return true;
    } catch (_) {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 400));
  }
  return false;
}

async function main() {
  const server = spawn(
    process.execPath,
    [path.join(HERE, "serve.mjs"), "--port", String(PORT), "--xlsx", FIXTURE],
    { cwd: ROOT, stdio: ["ignore", "pipe", "pipe"] }
  );
  server.stdout.on("data", () => {});
  server.stderr.on("data", (d) => process.stderr.write(d));
  try {
    if (!(await waitForHealth(25))) throw new Error("server never came up");

    await post("/command", { id: "nav.goto", arg: "B2" });
    await post("/command", { id: "insert.chart", arg: "" });
    check("the picker opened on the selection", !!(await findText("Chart type")));
    await clickText("Create", 8, 6);
    check("a chart window appeared", !!(await findText("Copy")));

    const reply = await clickText("Copy", 8, 6);
    check("clicking Copy answers with a payload", !!(reply && reply.clipboard !== undefined));
    if (!reply) throw new Error("no clipboard payload");

    check("it says a chart was copied", reply.clipboardKind === "chart", reply.clipboardKind);
    check("text/plain carries the numbers", /\t/.test(reply.clipboard || ""));
    const html = reply.clipboardHtml || "";
    check("text/html is one inline image", html.includes("<img ") && html.includes("data:image/png;base64,"));
    check("with nothing to fetch", !html.includes("http"));

    const png = Buffer.from(reply.clipboardPng || "", "base64");
    const read = readPng(png);
    check("image/png is a PNG any decoder reads", read.ok, read.ok ? `${read.width}x${read.height}` : read.why);
    check("and it is not a thumbnail", read.ok && read.width >= 320, read.ok ? String(read.width) : "");

    const clip = await get("/clipboard");
    check("the vector flavour is there too", (clip.svg || "").startsWith("<svg "));
    // The chart also travels as a document: spec, numbers and presentation.
    // This is what makes a pasted chart editable rather than a picture of one.
    let doc = null;
    try {
      doc = JSON.parse(clip.chart || "null");
    } catch (_) {
      doc = null;
    }
    check("and the chart travels as a document", !!doc && doc.ranger === "vela-chart");
    check("carrying its own specification", !!(doc && doc.spec && doc.spec.mark));
    check("and the numbers it was made of", !!(doc && Array.isArray(doc.cells) && doc.cells.length > 1));
    check("the html carries the same document", (reply.clipboardHtml || "").includes("data-ranger-chart"));
    check("named after the chart", (clip.name || "").length > 0, clip.name);
    check("and the host can tell copies apart", (clip.seq | 0) > 0, String(clip.seq));

    // Copying cells afterwards puts the sheet back on the clipboard.
    await post("/command", { id: "edit.copy", arg: "" });
    const after = await get("/clipboard");
    check("copying cells drops the picture", after.kind === "cells" && !after.png);
  } finally {
    server.kill();
  }

  const bad = checks.filter((c) => !c.ok).length;
  console.log(`\n${checks.length - bad} of ${checks.length} clipboard checks passed`);
  if (bad) process.exit(1);
}

main().catch((e) => {
  console.error("clipboard smoke failed:", e.message);
  process.exit(1);
});
