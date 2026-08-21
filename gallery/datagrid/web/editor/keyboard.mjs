/**
 * keyboard.mjs — the code editor, driven by a real keyboard, in a real browser.
 *
 * The dump-DOM smoke beside this file calls the app's own methods; this one
 * presses keys. Playwright sends them the way a keyboard does — through focus,
 * `keydown`, `beforeinput` and composition — so what is under test is the part
 * of a canvas editor that is easiest to get wrong and impossible to unit test:
 * whether a person who never touches the mouse can use it at all.
 *
 * That includes the two things a canvas gets wrong by default:
 *   * a canvas has no text and no caret for a screen reader, so the page keeps
 *     a hidden <textarea> mirroring the caret's line — checked here;
 *   * Tab in a code editor indents, which in a web page is a KEYBOARD TRAP
 *     (WCAG 2.1.2). Escape arms an escape hatch and the next Tab leaves —
 *     also checked here, because a trap that is only documented is still a
 *     trap.
 *
 *   node gallery/datagrid/web/editor/keyboard.mjs [--port 8897] [--headed]
 */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.join(HERE, "dist");
const PORT = parseInt(argVal("--port", "8897"), 10);

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
    const rel = decodeURIComponent((req.url || "/").split("?")[0]);
    const file = path.join(DIST, rel === "/" ? "index.html" : rel);
    if (!file.startsWith(DIST) || !fs.existsSync(file)) {
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

/** The browser Playwright has, wherever this machine put it. Its own
 *  `executablePath()` names the version it was built against, which is not
 *  always the version that is installed. */
function findChromium() {
  const guesses = [process.env.CHROME_PATH];
  try {
    guesses.push(chromium.executablePath());
  } catch (_) {
    /* not installed the usual way */
  }
  const root = process.env.PLAYWRIGHT_BROWSERS_PATH || "/opt/pw-browsers";
  try {
    for (const dir of fs.readdirSync(root)) {
      if (!dir.startsWith("chromium")) continue;
      for (const rel of ["chrome-linux/chrome", "chrome-linux64/chrome", "chrome-mac/Chromium.app/Contents/MacOS/Chromium"]) {
        guesses.push(path.join(root, dir, rel));
      }
    }
  } catch (_) {
    /* none */
  }
  guesses.push("/usr/bin/chromium", "/usr/bin/google-chrome");
  for (const g of guesses) {
    if (g && fs.existsSync(g)) return g;
  }
  return null;
}

const checks = [];
function check(name, ok, detail) {
  checks.push({ name, ok: !!ok });
  console.log(`  ${ok ? "PASS" : "FAIL"} ${name}${detail !== undefined && !ok ? " — " + detail : ""}`);
}

/** What the app thinks is true, read out of the page. */
async function state(page) {
  return page.evaluate(() => {
    const ta = document.getElementById("a11y");
    const doc = window.__editorDoc;
    const texts = doc ? doc.list.cmds.filter((c) => c.k === 3 && c.text) : [];
    const colours = new Set(texts.map((c) => JSON.stringify(c.c)));
    return {
      caretLine: window.__web.caretLine(),
      caretCol: window.__web.caretCol(),
      lines: window.__web.lineCount(),
      hasSelection: window.__web.hasSelection(),
      currentLine: window.__web.currentLine(),
      text: window.__web.documentText(),
      docName: window.__web.documentName(),
      cmds: doc ? doc.list.cmds.length : 0,
      textRuns: texts.length,
      colours: colours.size,
      focused: document.activeElement === ta,
      taValue: ta.value,
      taStart: ta.selectionStart,
      taEnd: ta.selectionEnd,
      live: document.getElementById("live").textContent,
    };
  });
}

async function main() {
  if (!fs.existsSync(path.join(DIST, "code_editor_web.js"))) {
    console.error("no build in " + DIST + " — run: npm run datagrid:editor:web");
    process.exit(1);
  }
  const exe = findChromium();
  if (!exe) {
    console.error("no Chromium for Playwright — set CHROME_PATH");
    process.exit(1);
  }
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
    const page = await browser.newPage({ viewport: { width: 1100, height: 900 } });
    const pageErrors = [];
    page.on("pageerror", (e) => pageErrors.push(e.message));
    await page.goto(`http://127.0.0.1:${PORT}/index.html`);
    await page.waitForFunction(() => window.__editorReady === true, null, { timeout: 30000 });
    // The facade, where the assertions can reach it.
    await page.evaluate(() => {
      window.__web = window.__web || null;
    });
    await page.addInitScript(() => {});
    // `web` is a module-scope const; the page publishes it for the test.
    await page.evaluate(() => {
      // eslint-disable-next-line no-undef
      window.__web = window.__editorWeb;
    });

    console.log("\n== it draws, and it is reachable by keyboard ==");
    let s = await state(page);
    check("WebGL drew the page", s.cmds > 100, s.cmds);
    check("with highlighted text", s.colours >= 4, s.colours);

    // A keyboard user arrives from the page ABOVE the editor, so that is
    // where the walk starts: put the sequential-focus starting point on the
    // heading and press Tab once. (Blurring instead would leave the starting
    // point ON the editor, and Tab would step past it — which is a fact about
    // sequential navigation, not about this page.)
    await page.evaluate(() => {
      const h = document.querySelector("header h1");
      h.tabIndex = -1;
      h.focus();
    });
    await page.keyboard.press("Tab");
    s = await state(page);
    check("Tab reaches the editor", s.focused);

    const roles = await page.evaluate(() => {
      const ta = document.getElementById("a11y");
      const canvas = document.getElementById("screen");
      return {
        role: ta.getAttribute("role"),
        multiline: ta.getAttribute("aria-multiline"),
        label: ta.getAttribute("aria-label"),
        described: !!document.getElementById(ta.getAttribute("aria-describedby")),
        canvasHidden: canvas.getAttribute("aria-hidden"),
        live: document.getElementById("live").getAttribute("aria-live"),
      };
    });
    check("the focusable element says it is a textbox", roles.role === "textbox", roles.role);
    check("and that it is multi-line", roles.multiline === "true");
    check("and has a name", (roles.label || "").length > 4, roles.label);
    check("and points at its key help", roles.described);
    check("the canvas is hidden from assistive tech", roles.canvasHidden === "true");
    check("there is a live region for announcements", roles.live === "polite");

    console.log("\n== the mouse hands the keyboard over ==");
    // The way a person starts: click in the text, then type. Every check in
    // this file used to reach the editor with the KEYBOARD, and that is how a
    // page that took a click and then ignored every key shipped — the browser
    // moves focus on mousedown AFTER the handler runs, and the canvas is not
    // focusable, so the default action took the keyboard straight back.
    const box = await page.locator("#screen").boundingBox();
    await page.mouse.click(box.x + 220, box.y + 220);
    s = await state(page);
    check("a click puts the keyboard in the editor", s.focused);
    await page.keyboard.type("CLICKED");
    s = await state(page);
    check("so typing after a click lands in the document", s.text.includes("CLICKED"));
    check("and in the picture", await page.evaluate(() =>
      window.__editorDoc.list.cmds.some((c) => c.k === 3 && c.text.includes("CLICKED"))));
    await page.keyboard.press("Control+z");

    console.log("\n== typing ==");
    await page.keyboard.press("Control+Home");
    await page.keyboard.type("const typed = 42;");
    s = await state(page);
    check("what was typed is in the document", s.text.includes("const typed = 42;"));
    check("the caret is after it", s.caretCol === 17, s.caretCol);
    check("and it reached the picture", await page.evaluate(() =>
      window.__editorDoc.list.cmds.some((c) => c.k === 3 && c.text.includes("typed"))));

    await page.keyboard.press("Enter");
    s = await state(page);
    check("Enter opened a line", s.caretLine === 1 && s.caretCol === 0, s.caretLine + ":" + s.caretCol);
    await page.keyboard.press("Backspace");
    s = await state(page);
    check("Backspace joined it back", s.caretLine === 0 && s.caretCol === 17, s.caretLine + ":" + s.caretCol);

    console.log("\n== moving ==");
    await page.keyboard.press("Home");
    s = await state(page);
    check("Home goes to the start of the line", s.caretCol === 0);
    await page.keyboard.press("Control+ArrowRight");
    s = await state(page);
    check("Ctrl+Right crosses a word", s.caretCol === 5, s.caretCol);
    await page.keyboard.press("Control+ArrowRight");
    s = await state(page);
    check("and the next one", s.caretCol === 11, s.caretCol);
    await page.keyboard.press("Control+ArrowLeft");
    s = await state(page);
    check("Ctrl+Left goes back", s.caretCol === 6, s.caretCol);
    await page.keyboard.press("End");
    s = await state(page);
    check("End is the end of the line", s.caretCol === s.currentLine.length, s.caretCol + " of " + s.currentLine.length);
    await page.keyboard.press("Control+End");
    s = await state(page);
    check("Ctrl+End is the end of the document", s.caretLine === s.lines - 1, s.caretLine);
    await page.keyboard.press("Control+Home");
    s = await state(page);
    check("Ctrl+Home is the start", s.caretLine === 0 && s.caretCol === 0);
    await page.keyboard.press("PageDown");
    const afterPage = await state(page);
    check("PageDown moved a screenful", afterPage.caretLine > 10, afterPage.caretLine);
    await page.keyboard.press("PageUp");
    s = await state(page);
    check("PageUp came back", s.caretLine === 0, s.caretLine);

    console.log("\n== selecting ==");
    await page.keyboard.press("Shift+ArrowRight");
    await page.keyboard.press("Shift+ArrowRight");
    s = await state(page);
    check("Shift+Right selects", s.hasSelection);
    check("and the mirror shows the selection", s.taEnd - s.taStart === 2, s.taStart + ".." + s.taEnd);
    await page.keyboard.press("Shift+ArrowDown");
    s = await state(page);
    check("Shift+Down keeps it open", s.hasSelection && s.caretLine === 1);
    await page.keyboard.press("ArrowLeft");
    s = await state(page);
    check("a plain arrow collapses it", !s.hasSelection);

    console.log("\n== what a screen reader is given ==");
    await page.keyboard.press("Control+Home");
    s = await state(page);
    check("the textarea holds the caret's line", s.taValue === s.currentLine, s.taValue);
    check("with the caret in the right column", s.taStart === s.caretCol, s.taStart + " vs " + s.caretCol);
    await page.keyboard.press("ArrowDown");
    s = await state(page);
    check("moving down mirrors the next line", s.taValue === s.currentLine, s.taValue);
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowRight");
    s = await state(page);
    check("and the column follows the caret", s.taStart === s.caretCol, s.taStart + " vs " + s.caretCol);

    console.log("\n== the keyboard trap, and the way out ==");
    await page.keyboard.press("Control+Home");
    await page.keyboard.press("Tab");
    s = await state(page);
    check("Tab indents inside the editor", s.currentLine.startsWith("  "), s.currentLine.slice(0, 8));
    check("and focus stayed put", s.focused);
    await page.keyboard.press("Escape");
    // The live region is cleared and re-filled a tick later, because a region
    // that is set to the text it already holds says nothing at all.
    const announced = await page
      .waitForFunction(
        () => (document.getElementById("live").textContent || "").toLowerCase().includes("tab"),
        null,
        { timeout: 3000 },
      )
      .then(() => true)
      .catch(() => false);
    s = await state(page);
    check("Escape says how to leave", announced, s.live);
    await page.keyboard.press("Tab");
    s = await state(page);
    check("and then Tab leaves the editor", !s.focused);
    await page.keyboard.press("Shift+Tab");
    s = await state(page);
    check("Shift+Tab comes back to it", s.focused);

    console.log("\n== IME, paste, undo ==");
    await page.keyboard.press("Control+End");
    // A composition, as an IME sends one: keydown 229, composition events, no
    // plain keypress anywhere.
    await page.evaluate(() => {
      const ta = document.getElementById("a11y");
      ta.dispatchEvent(new CompositionEvent("compositionstart", { data: "", bubbles: true }));
      ta.dispatchEvent(new CompositionEvent("compositionupdate", { data: "かん", bubbles: true }));
      ta.dispatchEvent(new CompositionEvent("compositionend", { data: "漢字", bubbles: true }));
    });
    s = await state(page);
    check("a composed string is inserted whole", s.text.includes("漢字"));

    const before = (await state(page)).text;
    await page.evaluate(() => {
      const ta = document.getElementById("a11y");
      const dt = new DataTransfer();
      dt.setData("text/plain", "// pasted line\n");
      ta.dispatchEvent(new ClipboardEvent("paste", { clipboardData: dt, bubbles: true, cancelable: true }));
    });
    s = await state(page);
    check("paste arrives as text", s.text.includes("// pasted line"), s.text.length - before.length);
    // The live region is filled a tick after the event, so this waits for the
    // announcement rather than racing it.
    const pasteSaid = await page
      .waitForFunction(
        () => (document.getElementById("live").textContent || "").toLowerCase().includes("pasted"),
        null,
        { timeout: 3000 },
      )
      .then(() => true)
      .catch(() => false);
    check("and is announced", pasteSaid, (await state(page)).live);

    await page.keyboard.press("Control+z");
    s = await state(page);
    check("Ctrl+Z undoes it", !s.text.includes("// pasted line"));

    console.log("\n== the language plugin, in the browser ==");
    await page.evaluate(() => window.__editorWeb.setDocumentNamed("broken.tsx", "function f() {\n  return 1;\n"));
    await page.waitForTimeout(120);
    let diag = await page.evaluate(() => ({
      lang: window.__editorWeb.languageId(),
      count: window.__editorWeb.problemCount(),
      lines: window.__editorWeb.problemLines(),
    }));
    check("a .tsx is diagnosed by the javascript plugin", diag.lang === "javascript", diag.lang);
    check("and its unclosed brace is found", diag.count === 1, JSON.stringify(diag.lines));
    check("with a line, a column and a source", /^0\|13\|0\|javascript\|/.test(diag.lines[0] || ""), diag.lines[0]);

    // The squiggle has to REACH the picture, not just the model. The page
    // redraws on its own frame, so this waits for the drawing rather than
    // guessing how long one takes.
    const countSquiggles = () =>
      page.evaluate(() =>
        (window.__editorDoc ? window.__editorDoc.list.cmds : []).filter(
          // The wave is 3px-wide, 1px-tall rectangles in the error colour.
          (c) => c.k === 0 && c.h === 1 && c.c && c.c[0] === 247 && c.c[1] === 118,
        ).length,
      );
    const drawn = await page
      .waitForFunction(
        () =>
          (window.__editorDoc ? window.__editorDoc.list.cmds : []).filter(
            (c) => c.k === 0 && c.h === 1 && c.c && c.c[0] === 247 && c.c[1] === 118,
          ).length >= 2,
        null,
        { timeout: 5000 },
      )
      .then(() => true)
      .catch(() => false);
    check("and it is drawn as a squiggle", drawn, await countSquiggles());
    // …and marked in the gutter, which is what makes a problem below the fold
    // findable at all.
    const gutter = await page.evaluate(() =>
      (window.__editorDoc ? window.__editorDoc.list.cmds : []).some(
        (c) => c.k === 0 && c.w === 3 && c.h > 5 && c.c && c.c[0] === 247 && c.x < 12,
      ),
    );
    check("and marked in the gutter", gutter);

    await page.evaluate(() => window.__editorWeb.setDocumentNamed("thing.rgr", "class A {\n  fn f:int () {\n    return this.g()\n  }\n}\n"));
    await page.waitForTimeout(120);
    diag = await page.evaluate(() => ({
      lang: window.__editorWeb.languageId(),
      count: window.__editorWeb.problemCount(),
      lines: window.__editorWeb.problemLines(),
    }));
    check("a .rgr goes to the other plugin", diag.lang === "ranger", diag.lang);
    check("which has its own opinion", diag.count === 1 && (diag.lines[0] || "").includes("ranger"), JSON.stringify(diag.lines));
    check("as a warning, not an error", (diag.lines[0] || "").split("|")[2] === "1", diag.lines[0]);

    await page.evaluate(() => window.__editorWeb.setDocumentNamed("notes.txt", "just words\n"));
    await page.waitForTimeout(120);
    diag = await page.evaluate(() => ({
      lang: window.__editorWeb.languageId(),
      count: window.__editorWeb.problemCount(),
    }));
    check("and an unknown file is left alone", diag.lang === "text" && diag.count === 0, diag.lang);

    console.log("\n== and it does not redraw for nothing ==");
    // A page that rebuilds and re-serializes the whole document sixty times a
    // second while nobody types is the difference between 4 fps and 200. The
    // caret still blinks, so "no redraws at all" would be wrong too.
    const idle = await page.evaluate(
      () =>
        new Promise((resolve) => {
          const started = performance.now();
          let frames = 0;
          let redraws = 0;
          let last = window.__editorWeb.revision();
          const tick = () => {
            frames += 1;
            const now = window.__editorWeb.revision();
            if (now !== last) {
              redraws += 1;
              last = now;
            }
            if (performance.now() - started > 1500) resolve({ frames, redraws });
            else requestAnimationFrame(tick);
          };
          tick();
        }),
    );
    check("frames keep coming", idle.frames > 20, idle.frames);
    check("but an idle second redraws a handful of times, not every frame",
      idle.redraws <= 8, idle.redraws + " of " + idle.frames);
    check("and the caret still blinks", idle.redraws >= 1, idle.redraws);

    console.log("\n== and it is still drawing ==");
    // Back to a real document: the checks below are about the scene, and the
    // one left open by the plugin section is a single line of prose.
    await page.evaluate(() => window.__editorWeb.nextSample());
    await page.waitForTimeout(200);
    s = await state(page);
    check("the scene survived all of that", s.cmds > 100, s.cmds);
    check("still in colour", s.colours >= 4, s.colours);
    check("no page errors", pageErrors.length === 0, pageErrors.join(" | "));

    const failed = checks.filter((c) => !c.ok).length;
    console.log(`\n  ${checks.length - failed} passed, ${failed} failed`);
    if (failed) process.exitCode = 1;
    else console.log("\nthe editor is usable without a mouse, on WebGL, in a real browser");
  } finally {
    await browser.close();
    server.close();
  }
}

main().catch((e) => {
  console.error("keyboard test failed:", e && e.stack ? e.stack : e);
  process.exit(1);
});
