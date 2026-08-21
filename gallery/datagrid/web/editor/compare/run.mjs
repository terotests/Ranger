#!/usr/bin/env node
/**
 * Side by side: the Ranger EVG code editor and CodeMirror 6, in the same
 * browser, given the same document and the same key presses.
 *
 *   node run.mjs                 # behaviour parity + timings
 *   node run.mjs --lines 5000    # how big the timing document is
 *   node run.mjs --headed
 *
 * Two questions, and they are not the same question:
 *
 *   1. BEHAVIOUR. Press Ctrl+Right on the same text and see whether the caret
 *      lands in the same column. This is the useful one — CodeMirror is the
 *      reference for what a key is supposed to do, and every row where the two
 *      disagree is either a bug here or a decision worth writing down.
 *
 *   2. TIME. Both editors are asked to open a document and apply 200 single
 *      character inserts through their own edit path. The pipelines below that
 *      are different by design — a display list drawn on the GPU against a DOM
 *      the browser lays out — so this is a repeatable shared workload, not a
 *      claim that one renderer is faster than another.
 */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";
import { PARITY_DOC, bigDoc, KEY_SCRIPT, formatTable } from "./corpus.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const RANGER_DIST = path.resolve(HERE, "../dist");
const CM_PAGE = path.join(HERE, "page");
const PORT = parseInt(argVal("--port", "8896"), 10);
const LINES = parseInt(argVal("--lines", "5000"), 10);
const TYPE_COUNT = parseInt(argVal("--inserts", "200"), 10);

function argVal(flag, dflt) {
  const i = process.argv.indexOf(flag);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : dflt;
}

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".ttf": "font/ttf",
};

function serve() {
  const server = http.createServer((req, res) => {
    let rel = decodeURIComponent((req.url || "/").split("?")[0]);
    let root = RANGER_DIST;
    if (rel.startsWith("/cm/")) {
      root = CM_PAGE;
      rel = rel.slice(3);
    } else if (rel.startsWith("/ranger/")) {
      rel = rel.slice(7);
    }
    const file = path.join(root, rel === "/" ? "index.html" : rel);
    if (!file.startsWith(root) || !fs.existsSync(file)) {
      res.writeHead(404);
      res.end("no");
      return;
    }
    res.writeHead(200, {
      "content-type": MIME[path.extname(file)] || "application/octet-stream",
      "cache-control": "no-store",
    });
    res.end(fs.readFileSync(file));
  });
  return new Promise((resolve) => server.listen(PORT, "127.0.0.1", () => resolve(server)));
}

function findChromium() {
  const guesses = [process.env.CHROME_PATH];
  try {
    guesses.push(chromium.executablePath());
  } catch (_) {
    /* not where it says */
  }
  const root = process.env.PLAYWRIGHT_BROWSERS_PATH || "/opt/pw-browsers";
  try {
    for (const dir of fs.readdirSync(root)) {
      if (!dir.startsWith("chromium")) continue;
      for (const rel of ["chrome-linux/chrome", "chrome-linux64/chrome"]) {
        guesses.push(path.join(root, dir, rel));
      }
    }
  } catch (_) {
    /* none */
  }
  guesses.push("/usr/bin/chromium", "/usr/bin/google-chrome");
  for (const g of guesses) if (g && fs.existsSync(g)) return g;
  return null;
}

/** The CodeMirror bundle is built rather than checked in. */
function ensureBundle() {
  const out = path.join(CM_PAGE, "cm-bundle.js");
  const src = path.join(HERE, "src", "cm_boot.js");
  if (fs.existsSync(out) && fs.statSync(out).mtimeMs > fs.statSync(src).mtimeMs) return;
  const esbuild = path.join(HERE, "node_modules", ".bin", "esbuild");
  if (!fs.existsSync(esbuild)) {
    console.error("run `npm install` in " + HERE + " first (it needs codemirror and esbuild)");
    process.exit(1);
  }
  const r = spawnSync(esbuild, [src, "--bundle", "--format=iife", "--outfile=" + out, "--log-level=warning"], {
    stdio: "inherit",
  });
  if (r.status !== 0) process.exit(r.status || 1);
}

/**
 * One editor, behind the same six calls, whichever page it is in. Everything
 * the bench does goes through this — including the typing, which is real key
 * events into whatever element that editor puts the focus on.
 */
function adapterFor(page, kind) {
  const read = () =>
    page.evaluate((k) => {
      if (k === "cm") {
        const e = window.__editor;
        const c = e.caret();
        return {
          line: c.line,
          col: c.col,
          sel: e.hasSelection(),
          lines: e.lineCount(),
          len: e.text().length,
          focused: document.activeElement.closest(".cm-editor") !== null,
        };
      }
      const w = window.__editorWeb;
      return {
        line: w.caretLine(),
        col: w.caretCol(),
        sel: w.hasSelection(),
        lines: w.lineCount(),
        len: w.documentText().length,
        focused: document.activeElement === document.getElementById("a11y"),
      };
    }, kind);

  return {
    kind,
    read,
    async focus() {
      await page.evaluate((k) => {
        if (k === "cm") window.__editor.focus();
        else document.getElementById("a11y").focus();
      }, kind);
    },
    async setDoc(text) {
      await page.evaluate(
        ([k, t]) => {
          if (k === "cm") window.__editor.setDoc(t);
          else window.__editorWeb.setDocument(t);
        },
        [kind, text],
      );
    },
    async press(key) {
      await page.keyboard.press(key);
    },
    async type(text) {
      await page.keyboard.type(text);
    },
    /** Open a document and force the editor to lay it out and paint it. */
    async timeOpen(text) {
      return page.evaluate(
        ([k, t]) => {
          const t0 = performance.now();
          if (k === "cm") {
            window.__editor.setDoc(t);
            window.__editor.measure();
          } else {
            window.__editorWeb.setDocument(t);
            window.__editorWeb.scene();
          }
          return performance.now() - t0;
        },
        [kind, text],
      );
    },
    /** The last full re-lex, in ms — the Ranger editor only. */
    async lexMs() {
      return page.evaluate((k) => {
        if (k === "cm") return null;
        return window.__editorWeb.lexMicros() / 1000;
      }, kind);
    },
    /** N single-character inserts through the editor's own edit path, each
     *  followed by whatever that editor does to make the change visible. */
    async timeInserts(n) {
      return page.evaluate(
        ([k, count]) => {
          const t0 = performance.now();
          for (let i = 0; i < count; i++) {
            if (k === "cm") {
              window.__editor.insert("x");
              window.__editor.measure();
            } else {
              window.__editorWeb.text("x", false, false);
              window.__editorWeb.scene();
            }
          }
          return performance.now() - t0;
        },
        [kind, n],
      );
    },
  };
}

const rows = [];
const notes = [];

async function main() {
  if (!fs.existsSync(path.join(RANGER_DIST, "code_editor_web.js"))) {
    console.error("no Ranger build — run: npm run datagrid:editor:web");
    process.exit(1);
  }
  ensureBundle();
  const exe = findChromium();
  if (!exe) {
    console.error("no Chromium for Playwright — set CHROME_PATH");
    process.exit(1);
  }
  // The CodeMirror page reads its opening document from a script beside it.
  fs.writeFileSync(
    path.join(CM_PAGE, "doc.js"),
    "window.__initialDoc = " + JSON.stringify(PARITY_DOC) + ";\n",
  );

  const server = await serve();
  const browser = await chromium.launch({
    executablePath: exe,
    headless: !process.argv.includes("--headed"),
    args: [
      "--no-sandbox",
      "--use-gl=angle",
      "--use-angle=swiftshader",
      "--enable-unsafe-swiftshader",
      "--no-proxy-server",
      "--proxy-bypass-list=<-loopback>",
    ],
  });
  try {
    const ranger = await browser.newPage({ viewport: { width: 1100, height: 900 } });
    await ranger.goto(`http://127.0.0.1:${PORT}/ranger/index.html`);
    await ranger.waitForFunction(() => window.__editorReady === true, null, { timeout: 30000 });

    const cm = await browser.newPage({ viewport: { width: 1100, height: 900 } });
    await cm.goto(`http://127.0.0.1:${PORT}/cm/index.html`);
    await cm.waitForFunction(() => window.__editorReady === true, null, { timeout: 30000 });

    const A = adapterFor(ranger, "ranger");
    const B = adapterFor(cm, "cm");

    // --- behaviour ----------------------------------------------------------
    console.log("== the same keys, on the same text ==\n");
    for (const ed of [A, B]) {
      await ed.setDoc(PARITY_DOC);
      await ed.focus();
    }
    let agreed = 0;
    for (const step of KEY_SCRIPT) {
      for (const ed of [A, B]) {
        await ed.focus();
        for (const key of step.keys) await ed.press(key);
        if (step.type) await ed.type(step.type);
      }
      const a = await A.read();
      const b = await B.read();
      const same =
        a.line === b.line && a.col === b.col && a.sel === b.sel && a.len === b.len;
      if (same) agreed += 1;
      rows.push([
        step.name,
        `${a.line}:${a.col}${a.sel ? " sel" : ""}`,
        `${b.line}:${b.col}${b.sel ? " sel" : ""}`,
        same ? "same" : "differs",
      ]);
      if (!same && step.name === "Tab") {
        notes.push(
          "Tab: both indent here, because the bench turns CodeMirror's `indentWithTab` ON. " +
            "CodeMirror does NOT bind Tab by default — binding it traps the keyboard — and the " +
            "Ranger editor takes it with Escape+Tab as the documented way out.",
        );
      }
    }
    console.log(
      formatTable(rows, ["step", "ranger (line:col)", "codemirror 6", "verdict"]),
    );
    console.log(`\n  ${agreed}/${rows.length} steps agree`);

    // Focus escape, which is the one behaviour a canvas editor has to earn.
    const escaped = { ranger: false, cm: false };
    for (const [name, ed] of [["ranger", A], ["cm", B]]) {
      await ed.setDoc(PARITY_DOC);
      await ed.focus();
      await ed.press("Escape");
      await ed.press("Tab");
      escaped[name] = (await ed.read()).focused === false;
    }
    console.log(
      `\n  Escape then Tab leaves the editor:  ranger ${escaped.ranger ? "yes" : "NO"}` +
        `   codemirror ${escaped.cm ? "yes" : "NO"}`,
    );

    // --- time ---------------------------------------------------------------
    console.log(`\n== the same work, timed  (document ${LINES} lines, ${TYPE_COUNT} inserts) ==\n`);
    const big = bigDoc(LINES);
    const timing = [];
    for (const [name, ed] of [["ranger-evg", A], ["codemirror6", B]]) {
      const open = await ed.timeOpen(big);
      await ed.focus();
      const inserts = await ed.timeInserts(TYPE_COUNT);
      const after = await ed.read();
      // Where an insert's time went. Only the Ranger side can answer: it
      // re-lexes the WHOLE document on every edit, and this is the number that
      // says when that stops being free.
      const lexMs = await ed.lexMs();
      timing.push([
        name,
        open.toFixed(1) + " ms",
        inserts.toFixed(1) + " ms",
        (inserts / TYPE_COUNT).toFixed(3) + " ms",
        lexMs === null ? "—" : lexMs.toFixed(3) + " ms",
        String(after.lines),
      ]);
    }
    console.log(
      formatTable(timing, [
        "engine",
        "open + paint",
        `${TYPE_COUNT} inserts`,
        "per insert",
        "of which re-lex",
        "lines",
      ]),
    );
    console.log(
      "\n  Different pipelines: the Ranger figure is model + lexer + layout + a\n" +
        "  display list handed to WebGL; the CodeMirror figure is model + its DOM\n" +
        "  view. Same workload, not the same machine underneath.",
    );

    for (const n of notes) console.log("\n  note: " + n);

    const out = path.join(HERE, "last-results.json");
    fs.writeFileSync(
      out,
      JSON.stringify({ lines: LINES, inserts: TYPE_COUNT, parity: rows, escaped, timing }, null, 2),
    );
    console.log("\nwrote " + path.relative(process.cwd(), out));

    if (!escaped.ranger) {
      console.error("\nFAIL the Ranger editor did not release focus on Escape+Tab");
      process.exitCode = 1;
    }
  } finally {
    await browser.close();
    server.close();
  }
}

main().catch((e) => {
  console.error("compare failed:", e && e.stack ? e.stack : e);
  process.exit(1);
});
