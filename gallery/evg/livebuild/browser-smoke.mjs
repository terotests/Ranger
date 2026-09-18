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
  await waitDone("dashboard");

  await page.getByRole("button", { name: "Settings" }).click();
  await waitDone("settings");

  await page.getByRole("button", { name: "Invoices" }).click();
  await waitDone("invoices");

  await page.fill("#prompt", "Build me a settings screen with notifications");
  await page.click("#go");
  await waitDone("prompt");
  const kind = (await page.locator("#kindLabel").innerText()).trim().toLowerCase();
  if (!kind.includes("settings")) throw new Error(`prompt mapped to ${kind}, want settings`);

  await page.getByRole("button", { name: "Dashboard", exact: true }).click();
  await waitDone("dashboard-again");
  await page.fill("#prompt", "Make the title larger and use a gold accent");
  await page.click("#go");
  await waitDone("restyle");
  const think = await page.locator("#think").innerText();
  if (!/gold|accent|title|larger/i.test(think)) {
    throw new Error(`restyle thinking missed the ask: ${think.slice(0, 180)}`);
  }

  if (problems.length) {
    console.error(problems.join("\n"));
    throw new Error(`${problems.length} console/page errors`);
  }
  console.log("ALL PASS — Chromium painted recipes, a typed prompt, and a restyle");
} finally {
  await browser.close();
}
