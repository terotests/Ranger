/**
 * tracer/smoke.mjs — does the bitmap tracer page run in a browser?
 *
 *   npm run evg:trace:web && npm run evg:trace:web:smoke
 *
 * Checks that the compiled bundle loads, the sample image vectorizes, and the
 * SVG stage ends up with a real <svg>/<path>.
 */
import fs from "node:fs";
import path from "node:path";
import http from "node:http";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "../../../..");
const DIST = path.resolve(process.argv[2] || path.join(HERE, "dist"));

function loadPlaywright() {
  const anchors = [
    "/opt/node22/lib/node_modules/x",
    path.join(ROOT, "package.json"),
    path.join(process.cwd(), "package.json"),
    import.meta.url,
  ];
  for (const anchor of anchors) {
    for (const name of ["playwright", "playwright-core"]) {
      try {
        return createRequire(anchor)(name);
      } catch { /* next */ }
    }
  }
  return null;
}

function findChrome() {
  const fixed = [process.env.CHROME_PATH, "/usr/bin/chromium", "/usr/bin/google-chrome",
                 "/usr/local/bin/google-chrome"].filter(Boolean);
  for (const c of fixed) if (fs.existsSync(c)) return c;
  return null;
}

const pw = loadPlaywright();
if (!pw) {
  console.log("Playwright is not available — tracer page was not checked.");
  process.exit(0);
}
if (!fs.existsSync(path.join(DIST, "index.html")) ||
    !fs.existsSync(path.join(DIST, "evg_bitmap_tracer.js"))) {
  console.error(`no tracer page in ${path.relative(ROOT, DIST)} — run: npm run evg:trace:web`);
  process.exit(1);
}

const TYPES = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".png": "image/png",
  ".svg": "image/svg+xml",
};
const server = http.createServer((req, res) => {
  let file = path.join(DIST, decodeURIComponent(req.url.split("?")[0]));
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, "index.html");
  if (!file.startsWith(DIST) || !fs.existsSync(file)) {
    res.writeHead(404); res.end("missing"); return;
  }
  const ext = path.extname(file);
  res.writeHead(200, { "Content-Type": TYPES[ext] || "application/octet-stream" });
  fs.createReadStream(file).pipe(res);
});

await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const { port } = server.address();
const url = `http://127.0.0.1:${port}/`;

const { chromium } = pw;
const browser = await chromium.launch({
  executablePath: findChrome() || undefined,
  headless: true,
});
const page = await browser.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));
page.on("console", (msg) => {
  if (msg.type() !== "error") return;
  const t = msg.text();
  if (/favicon\.ico|Failed to load resource.*404/i.test(t)) return;
  errors.push(t);
});

await page.goto(url, { waitUntil: "networkidle" });
const ready = await page.evaluate(() =>
  typeof EvgBitmapTracer === "function" && typeof ImageBuffer === "function"
);
if (!ready) {
  console.error("bundle did not publish EvgBitmapTracer / ImageBuffer");
  process.exitCode = 1;
} else {
  await page.click("#sample");
  await page.waitForFunction(() => {
    const st = document.getElementById("status");
    return st && /OK/.test(st.textContent || "");
  }, { timeout: 60000 });
  const info = await page.evaluate(() => {
    const out = document.getElementById("outStage");
    const svg = out && out.querySelector("svg");
    const paths = svg ? svg.querySelectorAll("path").length : 0;
    return {
      status: document.getElementById("status").textContent,
      hasSvg: !!svg,
      paths,
    };
  });
  console.log(JSON.stringify(info, null, 2));
  if (!info.hasSvg || info.paths < 1) {
    console.error("expected an SVG with at least one path");
    process.exitCode = 1;
  }

  // Color mode: the posterize path is the one with the moving parts.
  await page.evaluate(() => {
    document.getElementById("status").textContent = "…";
    const cc = document.getElementById("colorCount");
    cc.value = "8";
    cc.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await page.waitForFunction(() => {
    const st = document.getElementById("status");
    return st && /OK/.test(st.textContent || "");
  }, { timeout: 60000 });
  const color = await page.evaluate(() => {
    const out = document.getElementById("outStage");
    const svg = out && out.querySelector("svg");
    const fills = svg
      ? Array.from(svg.querySelectorAll("path")).map((p) => p.getAttribute("fill"))
      : [];
    return {
      status: document.getElementById("status").textContent,
      paths: fills.length,
      distinctFills: new Set(fills).size,
      swatches: document.querySelectorAll("#palette .sw").length,
    };
  });
  console.log(JSON.stringify(color, null, 2));
  if (color.paths < 2 || color.distinctFills < 2) {
    console.error("expected several colored paths in posterize mode");
    process.exitCode = 1;
  }
  if (color.swatches !== color.paths) {
    console.error("palette swatches should match the emitted layers");
    process.exitCode = 1;
  }
  // The palette controls: a control that is on screen must be one that does
  // something, and none of them may be clipped out of the panel.
  const controls = await page.evaluate(() => {
    const $ = (id) => document.getElementById(id);
    const panel = document.querySelector(".body").getBoundingClientRect();
    const overflow = (id) =>
      Math.round($(id).getBoundingClientRect().right - panel.right);
    const row = $("row-palEdit");
    return {
      autoShowsEditor: getComputedStyle(row).display !== "none",
      autoMarksItIdle: row.classList.contains("pal-inactive"),
      noteShown: !$("palNote").hidden,
      biasOverflow: overflow("paletteBias"),
      modeOverflow: overflow("paletteMode"),
      bgOverflow: overflow("bgMode"),
    };
  });
  console.log(JSON.stringify(controls, null, 2));
  // Hiding the editor on "auto" put "Poimi tuloksesta" out of reach and made
  // the whole group look inert; it stays visible and says it is idle instead.
  if (!controls.autoShowsEditor || !controls.autoMarksItIdle || !controls.noteShown) {
    console.error("the palette editor should be visible and marked idle on auto");
    process.exitCode = 1;
  }
  if (controls.biasOverflow > 0 || controls.modeOverflow > 0 || controls.bgOverflow > 0) {
    console.error("a select is clipped outside the parameter panel");
    process.exitCode = 1;
  }

  // Editing a color while the mode is "auto" must take effect, not vanish.
  const before = color.paths;
  await page.evaluate(() => {
    document.getElementById("status").textContent = "…";
    const inp = document.querySelector("#palEdit input");
    inp.value = "#ff0055";
    inp.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await page.waitForFunction(() => {
    const st = document.getElementById("status");
    return st && /OK/.test(st.textContent || "");
  }, { timeout: 60000 });
  const edited = await page.evaluate(() => ({
    mode: document.getElementById("paletteMode").value,
    fills: Array.from(document.querySelectorAll("#outStage path"))
      .map((p) => p.getAttribute("fill")),
  }));
  console.log(JSON.stringify(edited));
  if (edited.mode !== "fixed") {
    console.error("editing a color on auto should switch the palette to it");
    process.exitCode = 1;
  }
  if (!edited.fills.includes("#FF0055")) {
    console.error("the edited color should appear in the traced output");
    process.exitCode = 1;
  }
  if (edited.fills.length === before) {
    console.error("the palette change did not reach the output");
    process.exitCode = 1;
  }

  // Pasting an image loads and traces it; a paste with no image, or one aimed
  // at a text field, is left alone.
  const pasted = await page.evaluate(async () => {
    const cv = document.createElement("canvas");
    cv.width = 40; cv.height = 30;
    const ctx = cv.getContext("2d");
    ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, 40, 30);
    ctx.fillStyle = "#101010"; ctx.fillRect(8, 6, 24, 18);
    const blob = await new Promise((r) => cv.toBlob(r, "image/png"));
    const fire = (build) => {
      const dt = new DataTransfer();
      build(dt);
      document.dispatchEvent(new ClipboardEvent("paste", {
        clipboardData: dt, bubbles: true, cancelable: true,
      }));
    };
    document.getElementById("status").textContent = "…";
    fire((dt) => dt.items.add(new File([blob], "pasted.png", { type: "image/png" })));
    await new Promise((r) => setTimeout(r, 1500));
    const afterImage = document.getElementById("status").textContent;

    // A paste carrying no image must not disturb anything.
    document.getElementById("status").textContent = "UNTOUCHED";
    fire((dt) => dt.setData("text/plain", "just words"));
    await new Promise((r) => setTimeout(r, 400));
    const afterText = document.getElementById("status").textContent;

    // Nor may it steal a paste meant for a text field.
    const tf = document.createElement("input");
    tf.type = "text";
    document.body.appendChild(tf);
    tf.focus();
    document.getElementById("status").textContent = "UNTOUCHED";
    fire((dt) => dt.items.add(new File([blob], "pasted.png", { type: "image/png" })));
    await new Promise((r) => setTimeout(r, 400));
    const afterField = document.getElementById("status").textContent;
    tf.remove();

    return { afterImage, afterText, afterField, size: "40x30" };
  });
  console.log(JSON.stringify(pasted));
  if (!/40×30/.test(pasted.afterImage)) {
    console.error("pasting an image should load and trace it");
    process.exitCode = 1;
  }
  if (pasted.afterText !== "UNTOUCHED" || pasted.afterField !== "UNTOUCHED") {
    console.error("paste should be ignored without an image, and inside a text field");
    process.exitCode = 1;
  }

  // The checkerboard is the only way to tell transparent from a painted
  // background, so it must actually be behind both stages.
  const view = await page.evaluate(() => {
    const src = document.getElementById("srcStage");
    const out = document.getElementById("outStage");
    const on = src.classList.contains("checker") && out.classList.contains("checker");
    const box = document.getElementById("checker");
    box.checked = false;
    box.dispatchEvent(new Event("change", { bubbles: true }));
    const off = src.classList.contains("checker") || out.classList.contains("checker");
    box.checked = true;
    box.dispatchEvent(new Event("change", { bubbles: true }));
    return { on, off, backAgain: out.classList.contains("checker") };
  });
  console.log(JSON.stringify(view));
  if (!view.on || view.off || !view.backAgain) {
    console.error("the checkerboard should be on by default and follow its checkbox");
    process.exitCode = 1;
  }

  // --- edit mode ----------------------------------------------------------
  // A traced layer is one path per color, so the thing that makes edit mode
  // possible at all is splitting those into one path per shape. Check that,
  // then each of the three tools and undo.
  await page.evaluate(() => {
    const c = document.getElementById("colorCount");
    c.value = 8;
    c.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await page.click("#sample");
  await page.waitForFunction(() => !document.getElementById("dl").disabled, { timeout: 120000 });
  // A queued re-trace replaces the drawing and ends the edit session with it,
  // so wait for the tracer to go idle before opening one.
  await page.waitForFunction(() => !document.getElementById("run").disabled, { timeout: 120000 });
  await page.waitForTimeout(300);

  const edit = await (async () => {
    const before = await page.evaluate(() => document.querySelectorAll("#outStage svg path").length);
    await page.click("#editToggle");
    const exploded = await page.evaluate(() => document.querySelectorAll("#outStage svg path").length);

    // The status line quotes a shape count and a byte count, and editing
    // changes both — it used to go on quoting the file the tracer produced,
    // which after a few edits describes something that no longer exists.
    await page.waitForTimeout(250);
    const statusLive = await page.evaluate(() => {
      const m = document.getElementById("status").textContent.match(/layers=(\d+).*svg=(\d+)/);
      const live = document.querySelector("#outStage svg");
      return {
        saysLayers: +m[1], saysBytes: +m[2],
        realLayers: live.querySelectorAll("path").length,
        realBytes: new XMLSerializer().serializeToString(live).length
      };
    });

    // merge: set the picker, click the biggest shape, count what took the color
    await page.evaluate(() => {
      const c = document.getElementById("editColor");
      c.value = "#00ff88";
      c.dispatchEvent(new Event("input", { bubbles: true }));
      const ps = [...document.querySelectorAll("#outStage svg path")];
      ps.sort((a, b) => {
        const x = a.getBBox(), y = b.getBBox();
        return y.width * y.height - x.width * x.height;
      });
      ps[1].dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    const green = () => page.evaluate(() =>
      [...document.querySelectorAll("#outStage svg path")]
        .filter(e => (e.getAttribute("fill") || "").toLowerCase() === "#00ff88").length);
    const merged = await green();
    await page.click("#editUndo");
    const undone = await green();

    // pick: take a shape's own fill into the picker
    await page.click("#toolPick");
    const want = await page.evaluate(() => {
      const el = document.querySelectorAll("#outStage svg path")[2];
      el.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      return (el.getAttribute("fill") || "").toLowerCase();
    });
    const picked = await page.evaluate(() => document.getElementById("editColor").value.toLowerCase());

    // refine: drag over an area, which re-traces it with a palette of its own
    // and lays the result on top, masked to the stroke. The mask is the part
    // worth guarding — resolved in the wrong coordinate system it hides the
    // whole result, and the tool then reports success while changing nothing.
    await page.click("#toolRefine");
    // Force the patch to differ from what is already there. With the palette
    // seeded from the border and the mask feathered, a refine stroke can quite
    // correctly change nothing — it had nothing to add — and then this test
    // would pass a broken mask as a no-op. Given its own colors to invent and
    // no edge snapping, it must change something, and that is what makes the
    // "is the mask hiding everything" check mean anything.
    await page.evaluate(() => {
      const x = document.getElementById("refineExtra");
      x.value = 12; x.dispatchEvent(new Event("input", { bubbles: true }));
      const e = document.getElementById("edgeBlend");
      e.value = 0; e.dispatchEvent(new Event("input", { bubbles: true }));
    });
    const refined = await page.evaluate(async () => {
      const svg = document.querySelector("#outStage svg");
      const rect = svg.getBoundingClientRect();
      // Rasterize a probe inside the stroke: "one group was added" is not the
      // same claim as "the picture changed", and the mask bug satisfied the
      // first while failing the second.
      const shot = async () => {
        const str = new XMLSerializer().serializeToString(svg);
        const im = new Image();
        im.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(str)));
        await im.decode();
        await new Promise(r => setTimeout(r, 150));
        const vb = svg.getAttribute("viewBox").split(/[\s,]+/).map(Number);
        const c = document.createElement("canvas");
        c.width = vb[2]; c.height = vb[3];
        const g = c.getContext("2d");
        g.fillStyle = "#fff"; g.fillRect(0, 0, c.width, c.height);
        g.drawImage(im, 0, 0, c.width, c.height);
        return g.getImageData(0, 0, c.width, c.height).data;
      };
      const vb = svg.getAttribute("viewBox").split(/[\s,]+/).map(Number);
      const before = await shot();
      const stage = document.getElementById("outStage");
      const at = (fx, fy) => ({ x: rect.left + rect.width * fx, y: rect.top + rect.height * fy });
      const send = (type, pt) => stage.dispatchEvent(new PointerEvent(type, {
        bubbles: true, clientX: pt.x, clientY: pt.y
      }));
      send("pointerdown", at(0.3, 0.45));
      for (let i = 1; i <= 12; i++) send("pointermove", at(0.3 + 0.4 * i / 12, 0.45));
      const preview = svg.querySelectorAll('path[stroke="#ff2ec4"]').length;
      send("pointerup", at(0.7, 0.45));
      await new Promise(r => setTimeout(r, 400));
      const after = await shot();
      let changed = 0;
      const y0 = Math.round(vb[3] * 0.40), y1 = Math.round(vb[3] * 0.50);
      const x0 = Math.round(vb[2] * 0.32), x1 = Math.round(vb[2] * 0.68);
      for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
        const o = (y * vb[2] + x) * 4;
        if (Math.abs(before[o] - after[o]) + Math.abs(before[o+1] - after[o+1])
          + Math.abs(before[o+2] - after[o+2]) > 24) changed++;
      }
      return { preview, previewLeft: svg.querySelectorAll('path[stroke="#ff2ec4"]').length, changed };
    });
    const groups = await page.evaluate(() => document.querySelectorAll("#outStage svg g[mask]").length);
    const masks = await page.evaluate(() => document.querySelectorAll("#outStage svg mask").length);
    await page.click("#editUndo");
    const groupsUndone = await page.evaluate(() => document.querySelectorAll("#outStage svg g[mask]").length);
    const masksUndone = await page.evaluate(() => document.querySelectorAll("#outStage svg mask").length);

    // smooth: brush over the biggest shape's own colour and check the outline
    // gets simpler rather than heavier, and that undo restores it exactly.
    await page.click("#toolSmooth");
    const smooth = await page.evaluate(async () => {
      const svg = document.querySelector("#outStage svg");
      const ps = [...svg.querySelectorAll("path")];
      ps.sort((a, b) => {
        const x = a.getBBox(), y = b.getBBox();
        return y.width * y.height - x.width * x.height;
      });
      // The biggest shape is usually the background frame; take the biggest one
      // that actually has an outline worth smoothing.
      const el = ps.find(e => (e.getAttribute("d") || "").length > 400) || ps[1];
      el.id = "__smoothTarget";
      const fill = el.getAttribute("fill");
      const c = document.getElementById("editColor");
      c.value = fill; c.dispatchEvent(new Event("input", { bubbles: true }));
      const bb = el.getBBox();
      const rect = svg.getBoundingClientRect();
      const vb = svg.getAttribute("viewBox").split(/[\s,]+/).map(Number);
      const toScreen = (ux, uy) => ({
        x: rect.left + ux / vb[2] * rect.width,
        y: rect.top + uy / vb[3] * rect.height
      });
      const before = el.getAttribute("d").length;
      const stage = document.getElementById("outStage");
      const send = (type, pt) => stage.dispatchEvent(new PointerEvent(type, {
        bubbles: true, clientX: pt.x, clientY: pt.y
      }));
      for (let pass = 0; pass < 3; pass++) {
        send("pointerdown", toScreen(bb.x + bb.width * 0.2, bb.y + bb.height * 0.5));
        for (let i = 1; i <= 12; i++) {
          send("pointermove", toScreen(bb.x + bb.width * (0.2 + 0.6 * i / 12), bb.y + bb.height * 0.5));
        }
        send("pointerup", toScreen(bb.x + bb.width * 0.8, bb.y + bb.height * 0.5));
      }
      return { before, after: el.getAttribute("d").length };
    });
    // A stroke is one undo step however many shapes it crossed, so three
    // strokes are exactly three clicks back.
    await page.click("#editUndo");
    await page.click("#editUndo");
    await page.click("#editUndo");
    const smoothUndone = await page.evaluate(() => {
      const el = document.getElementById("__smoothTarget");
      return el ? el.getAttribute("d").length : -1;
    });

    // The refine-size slider must not re-trace: a re-trace replaces the
    // drawing and takes the edit session down with it, which is a strange way
    // to lose your work while sizing the next click.
    await page.evaluate(() => {
      const r = document.getElementById("refineSize");
      r.value = 80;
      r.dispatchEvent(new Event("input", { bubbles: true }));
    });
    await page.waitForTimeout(400);
    const stillEditing = await page.evaluate(() =>
      document.getElementById("editbar").classList.contains("on"));
    return { before, exploded, statusLive, merged, undone, picked, want, groups, groupsUndone, stillEditing,
             masks, masksUndone, preview: refined.preview, previewLeft: refined.previewLeft,
             refineChangedPixels: refined.changed,
             smoothBefore: smooth.before, smoothAfter: smooth.after, smoothUndone };
  })();
  console.log(JSON.stringify(edit));
  if (!(edit.exploded > edit.before)) {
    console.error("edit mode must split color layers into individual shapes");
    process.exitCode = 1;
  }
  if (edit.statusLive.saysLayers !== edit.statusLive.realLayers
    || edit.statusLive.saysBytes !== edit.statusLive.realBytes) {
    console.error("the status line must describe the drawing on screen, got "
      + JSON.stringify(edit.statusLive));
    process.exitCode = 1;
  }
  if (edit.merged !== 1 || edit.undone !== 0) {
    console.error("merge should recolor exactly one shape, and undo should put it back");
    process.exitCode = 1;
  }
  if (edit.picked !== edit.want) {
    console.error("the picker should take the clicked shape's fill, got " + edit.picked + " want " + edit.want);
    process.exitCode = 1;
  }
  if (edit.groups !== 1 || edit.groupsUndone !== 0 || edit.masks !== 1 || edit.masksUndone !== 0) {
    console.error("a refine stroke should add one masked group and its mask, and undo should take both away");
    process.exitCode = 1;
  }
  if (!(edit.refineChangedPixels > 0)) {
    console.error("a refine stroke must change the picture under it, not just add a hidden group");
    process.exitCode = 1;
  }
  if (edit.preview !== 1 || edit.previewLeft !== 0) {
    console.error("the stroke preview should show while dragging and be gone afterwards");
    process.exitCode = 1;
  }
  if (!(edit.smoothAfter > 0) || edit.smoothAfter === edit.smoothBefore) {
    console.error("the smooth brush should change the outline it is dragged over");
    process.exitCode = 1;
  }
  if (edit.smoothUndone !== edit.smoothBefore) {
    console.error("undo should restore the smoothed outline exactly, got "
      + edit.smoothUndone + " want " + edit.smoothBefore);
    process.exitCode = 1;
  }
  if (!edit.stillEditing) {
    console.error("sizing the refine box must not re-trace and drop the edit session");
    process.exitCode = 1;
  }

  if (!process.exitCode) {
    console.log("tracer smoke OK");
  }
}

if (errors.length) {
  console.error("page errors:\n" + errors.join("\n"));
  process.exitCode = 1;
}

await browser.close();
server.close();
process.exit(process.exitCode || 0);
