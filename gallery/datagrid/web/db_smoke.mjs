#!/usr/bin/env node
/**
 * Headless check for the database window host: start serve.mjs with --db, ask
 * for the scene the browser would draw, then edit a cell the way the browser
 * does (POST /input) and confirm the new value is in the next scene and that
 * the app says the database took it.
 *
 * No browser needed - the seam is the display list, so the scene IS the
 * picture as far as this test is concerned.
 *
 *   node gallery/datagrid/web/db_smoke.mjs [--db auto] [--port 8788]
 */
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../../..");

function argVal(name, def) {
  const argv = process.argv.slice(2);
  const i = argv.indexOf(name);
  if (i >= 0 && argv[i + 1]) return argv[i + 1];
  return def;
}

const PORT = argVal("--port", "8788");
const DRIVER = argVal("--db", "auto");
const BASE = `http://127.0.0.1:${PORT}`;

const server = spawn(
  process.execPath,
  [path.join(__dirname, "serve.mjs"), "--db", DRIVER, "--port", PORT],
  { cwd: ROOT, stdio: ["ignore", "pipe", "pipe"] },
);

let serverLog = "";
server.stdout.on("data", (b) => { serverLog += b.toString(); });
server.stderr.on("data", (b) => { serverLog += b.toString(); });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function scene() {
  const res = await fetch(BASE + "/scene.json");
  if (res.status === 204) return null;
  return await res.text();
}

// /scene.json answers 204 when nothing changed, so a fetch right after an
// event can miss the frame that carries the answer. Poll for it.
async function sceneContaining(text, tries) {
  let last = "";
  for (let i = 0; i < tries; i++) {
    const body = await scene();
    if (body) last = body;
    if (last.includes(text)) return last;
    await sleep(200);
  }
  return last;
}

async function post(event) {
  await fetch(BASE + "/input", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(event),
  });
}

// The same command table the keyboard dispatches through - what a host, a
// toolbar button and Ctrl+Q all end up calling.
async function command(id, arg) {
  const res = await fetch(BASE + "/command", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ id, arg: arg || "" }),
  });
  return res.status;
}

let failed = 0;
function must(name, cond) {
  if (cond) {
    console.log("  PASS " + name);
  } else {
    console.log("  FAIL " + name);
    failed++;
  }
}

try {
  let body = null;
  for (let i = 0; i < 60 && !body; i++) {
    await sleep(500);
    try { body = await scene(); } catch (e) { body = null; }
  }
  if (!body) throw new Error("no scene from the server:\n" + serverLog);

  const engineLine = (serverLog.match(/^ {2}\w+: \w+, \d+ rows.*$/m) || [])[0] || "";
  console.log("  engine: " + engineLine.trim());
  must("the server opened an engine", engineLine.length > 0);
  must("the sheet is a database sheet", body.includes("DB sales"));
  must("rows from the database are drawn", body.includes("Finland"));

  // Put the caret on a known cell and type into it. Naming the cell rather
  // than clicking a pixel is what makes this survive a change in row height
  // or toolbar size: the sheet is id, region, country, month, revenue, units,
  // so C2 is the first country and E2 is its revenue.
  await command("nav.goto", "C2");
  await post({ type: "text", text: "SmokeLand" });
  await post({ type: "key", key: "enter" });
  await sleep(300);
  const after = (await scene()) || body;
  must("the edit is in the next scene", after.includes("SmokeLand"));
  must("the database took it", after.includes("updated in sales"));

  // A value the column cannot hold must be refused and undone.
  await command("nav.goto", "E2");
  await post({ type: "text", text: "not-a-number" });
  await post({ type: "key", key: "enter" });
  await sleep(300);
  const refused = (await scene()) || after;
  // The text is expected to appear exactly ONCE, in the status bar's
  // explanation - if it also reached the cell it would be drawn twice.
  const mentions = refused.split("not-a-number").length - 1;
  must("a bad value never reaches the cell", mentions === 1);
  must("and the app says why", refused.includes("is not a valid"));

  // --- the SQL box, driven the way a person drives it -----------------------
  // Ctrl+Q opens it; the dialog is modal, so typing goes into its field; Enter
  // is the default button. Nothing here reaches past the UI.
  await command("db.sql.dialog", "");
  await sleep(200);
  const withBox = (await scene()) || refused;
  must("the SQL box is on screen", withBox.includes("SQL query"));

  const query = "SELECT id, country, revenue FROM sales WHERE revenue > 40000 ORDER BY revenue DESC";
  await post({ type: "text", text: query });
  await sleep(200);
  const typedInBox = (await scene()) || withBox;
  must("what was typed is in the box", typedInBox.includes("WHERE revenue > 40000"));

  await post({ type: "key", key: "enter" });
  await sleep(400);
  const queried = (await scene()) || typedInBox;
  must("the query became a sheet", queried.includes("planned SQL"));
  must("with the columns the query asked for", queried.includes("revenue"));
  must("and the box reports the engine", queried.includes("rows"));

  // The same thing through the command surface, with the query as its argument.
  const status = await command("db.sql", "SELECT country FROM sales ORDER BY country LIMIT 5");
  must("db.sql is a command a host can run", status === 200);
  await sleep(300);
  const oneColumn = (await scene()) || queried;
  must("the new query replaced the sheet", oneColumn.includes("country"));

  // --- the connection window, opened by its BUTTON ---------------------------
  // Ctrl+D is the browser's bookmark, so the button is the path that works in
  // a page. This clicks it where the toolbar says it is.
  // The SQL box is still up from the step above, and it is modal - a click on
  // the toolbar behind it is swallowed, which is what a modal is for.
  await post({ type: "key", key: "escape" });
  await sleep(150);
  const bar = await (await fetch(BASE + "/toolbar")).json();
  const dbButton = bar.items.find((i) => i.command === "db.connection");
  must("the toolbar has a database button", !!dbButton);
  must("and one for the SQL box", !!bar.items.find((i) => i.command === "db.sql.dialog"));
  if (dbButton) {
    const bx = dbButton.x + Math.floor(dbButton.w / 2);
    const by = dbButton.y + Math.floor(dbButton.h / 2);
    await post({ type: "pointer", x: bx, y: by, down: true });
    await post({ type: "pointer", x: bx, y: by, down: false });
    await sleep(250);
    const clicked = (await scene()) || oneColumn;
    must("clicking it opens the connection window", clicked.includes("Database connection"));
  }

  await command("db.connection", "");
  await sleep(200);
  const connOpen = (await scene()) || oneColumn;
  must("the connection window is on screen", connOpen.includes("Database connection"));
  must("it names the engine it is connected to", connOpen.includes("connected: "));
  must("and what that engine can do", connOpen.includes("engine can: "));
  must("and which columns identify a row", connOpen.includes("key columns: "));

  // The Engine field has focus: clear it, type another engine, Enter is
  // Connect. RangerDB is always present, so this switch works anywhere.
  for (let i = 0; i < 14; i++) {
    await post({ type: "key", key: "backspace" });
  }
  await post({ type: "text", text: "rangerdb" });
  await post({ type: "key", key: "enter" });
  // What is checked here is the WINDOW, not the status bar: the status bar is
  // also the app's tooltip surface (the toolbar's hot label writes itself
  // there every frame), so which of the two wrote last depends on where the
  // pointer is resting. The window's own lines are the connection's state.
  const switched = await sceneContaining("connected: rangerdb", 20);
  must("the host connected the engine that was asked for", switched.includes("connected: rangerdb"));
  must("and the server says the same", serverLog.includes("connected: rangerdb"));
  must("and the window shows the new connection, not the question", switched.includes("rangerdb: sales"));
  must("and the sheet came back with it", switched.includes("Finland"));

  console.log(failed === 0 ? "ALL PASS" : "FAILURES");
} catch (e) {
  console.error("[db-smoke] " + (e && e.message ? e.message : e));
  failed = 1;
} finally {
  server.kill("SIGTERM");
}
process.exit(failed === 0 ? 0 : 1);
