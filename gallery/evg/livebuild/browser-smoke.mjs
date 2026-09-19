#!/usr/bin/env node
/**
 * Open the live-build page in Chromium and wait for frames to paint.
 *
 *   node gallery/evg/livebuild/browser-smoke.mjs
 *
 * Needs the server already listening (npm run livebuild:serve) and
 * playwright-core plus a Chrome. Without them it exits 2 rather than
 * pretending the page worked.
 */
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const URL = process.env.EVG_LIVEBUILD_URL || "http://127.0.0.1:8765/";
const OUT = process.env.EVG_LIVEBUILD_SHOTS || "/tmp/livebuild-shots";
const require_ = createRequire(import.meta.url);

let chromium;
try {
  ({ chromium } = require_("playwright-core"));
} catch {
  console.error("playwright-core is not installed");
  process.exit(2);
}

fs.mkdirSync(OUT, { recursive: true });

const chrome =
  process.env.CHROME_PATH ||
  ["/usr/bin/google-chrome", "/usr/bin/google-chrome-stable", "/usr/bin/chromium"].find((p) =>
    fs.existsSync(p),
  );

const browser = await chromium.launch({
  executablePath: chrome,
  args: ["--no-sandbox", "--disable-gpu", "--use-gl=swiftshader"],
});

const page = await browser.newPage({ viewport: { width: 1440, height: 980 } });
const problems = [];
page.on("pageerror", (e) => problems.push(`pageerror: ${e.message}`));
page.on("console", (m) => {
  if (m.type() === "error") problems.push(`console: ${m.text()}`);
});

async function waitDone(label) {
  await page.waitForFunction(
    () => document.getElementById("added")?.textContent === "done",
    null,
    { timeout: 20000 },
  );
  const ncmds = await page.locator("#ncmds").innerText();
  const ntok = await page.locator("#ntok").innerText();
  const think = await page.locator("#think").innerText();
  const svg = await page.locator("#screen svg").count();
  if (Number(ncmds) < 8) throw new Error(`${label}: ncmds ${ncmds}`);
  if (Number(ntok) < 10) throw new Error(`${label}: tokens ${ntok}`);
  if (think.includes("has not started")) throw new Error(`${label}: thinking never started`);
  if (svg < 1) throw new Error(`${label}: no SVG painted`);
  const shot = path.join(OUT, `${label}.png`);
  await page.screenshot({ path: shot, fullPage: true });
  console.log(`  ${label.padEnd(12)} cmds=${ncmds} tokens=${ntok} svg=${svg} ${shot}`);
}

try {
  await page.goto(URL, { waitUntil: "domcontentloaded" });
  await page.waitForFunction(
    () =>
      document.getElementById("added")?.textContent === "seed" &&
      !document.getElementById("go")?.disabled &&
      Number(document.getElementById("ncmds")?.textContent) >= 8,
    null,
    { timeout: 15000 },
  );
  const seedCmds = await page.locator("#ncmds").innerText();
  const seedSvg = await page.locator("#screen svg").count();
  if (seedSvg < 1) throw new Error("seed: no SVG painted");
  console.log(`  seed         cmds=${seedCmds} svg=${seedSvg} Follow up enabled`);

  const goLabel = await page.locator("#go").innerText();
  if (!/follow up/i.test(goLabel)) throw new Error(`expected Follow up button, got ${goLabel}`);

  await page.getByRole("button", { name: "Settings" }).click();
  await page.waitForFunction(
    () => document.getElementById("kindLabel")?.textContent?.includes("settings") &&
      !document.getElementById("go")?.disabled,
    null,
    { timeout: 10000 },
  );

  await page.getByRole("button", { name: "Dashboard", exact: true }).click();
  await page.waitForFunction(
    () => document.getElementById("kindLabel")?.textContent?.includes("dashboard") &&
      !document.getElementById("go")?.disabled,
    null,
    { timeout: 10000 },
  );
  const beforeFollow = Number(await page.locator("#ncmds").innerText());
  await page.fill("#prompt", "Make the title larger and use a gold accent");
  await page.click("#go");
  await waitDone("restyle");
  const afterFollow = Number(await page.locator("#ncmds").innerText());
  if (afterFollow < Math.max(8, Math.floor(beforeFollow * 0.5))) {
    throw new Error(`follow-up wiped the phone: cmds ${beforeFollow} → ${afterFollow}`);
  }
  const think = await page.locator("#think").innerText();
  if (!/gold|accent|title|larger/i.test(think)) {
    throw new Error(`restyle thinking missed the ask: ${think.slice(0, 180)}`);
  }
  const svgText = await page.locator("#screen").innerText();
  if (svgText.length === 0) throw new Error("follow-up left the phone with no painted text");

  await page.getByRole("button", { name: "Empty" }).click();
  await page.waitForFunction(
    () => document.getElementById("added")?.textContent === "seed" &&
      !document.getElementById("go")?.disabled,
    null,
    { timeout: 10000 },
  );
  const emptyCmds = Number(await page.locator("#ncmds").innerText());
  if (emptyCmds >= beforeFollow) {
    throw new Error(`Empty chip did not start over: cmds ${emptyCmds}`);
  }

  // Run mode: the machine owns the page and a press is a point that becomes an
  // event. PLAN_LIVE_APP.md S2 — a tab that does something is the whole
  // difference between an app and a picture of one.
  await page.click("#run");
  await page.waitForFunction(
    () => (document.getElementById("kindLabel")?.textContent || "").startsWith("app ·"),
    null,
    { timeout: 60000 },
  );
  const stateNow = async () => (await page.locator("#kindLabel").innerText()).toLowerCase();
  const first = await stateNow();
  const box = await page.locator("#screen").boundingBox();
  const press = async (x, y) => {
    await page.mouse.click(box.x + x, box.y + y);
    await page.waitForTimeout(600);
  };
  await press(195, 790);
  const second = await stateNow();
  if (first === second) throw new Error(`a press on the nav changed nothing: ${first}`);
  if (!/routes/.test(second)) throw new Error(`the nav went somewhere unexpected: ${second}`);
  await press(195, 400);
  const trail = await page.locator("#findings").innerText();
  if (!/not an event|nav\./.test(trail)) throw new Error(`run mode said nothing about the press: ${trail}`);
  await page.click("#run");
  await page.waitForFunction(
    () => document.getElementById("added")?.textContent === "seed",
    null,
    { timeout: 20000 },
  );
  if (!/in the tab/.test(second)) {
    throw new Error(`the app ran on the server, not in the browser: ${second}`);
  }
  console.log(`  run          ${first} → ${second}, and back to design mode`);

  // The runtime in the tab, timed. A press that has to reach a process is
  // ~300ms and needs a tool on the machine; this one is a function call. The
  // number is not the point — "no process, no tool, no shell" is — but a
  // press that quietly went back to the server would still pass everything
  // above, and this is what notices.
  await page.click("#run");
  await page.waitForFunction(
    () => (document.getElementById("kindLabel")?.textContent || "").includes("in the tab"),
    null,
    { timeout: 60000 },
  );
  const loop = await page.evaluate(() => {
    const t0 = performance.now();
    for (let i = 0; i < 40; i += 1) {
      window.webApp.press(195, 790);
      window.webApp.frame();
    }
    return Math.round(performance.now() - t0);
  });
  if (loop > 1500) throw new Error(`40 presses took ${loop}ms — something is leaving the tab`);
  console.log(`  in the tab   40 presses and frames in ${loop}ms, no fetch in sight`);
  await page.click("#run");
  await page.waitForFunction(
    () => document.getElementById("added")?.textContent === "seed",
    null,
    { timeout: 20000 },
  );

  if (problems.length) {
    console.error(problems.join("\n"));
    throw new Error(`${problems.length} console/page errors`);
  }
  console.log("ALL PASS — seed painted, Follow up kept the phone, Empty started over, the app ran");
} finally {
  await browser.close();
}
