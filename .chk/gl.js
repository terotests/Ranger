const { chromium } = require("playwright-core");
(async () => {
  const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
    args: ["--use-gl=swiftshader","--enable-unsafe-swiftshader","--use-angle=swiftshader"] });
  const p = await b.newPage({ viewport: { width: 780, height: 1050 } });
  p.on("console", m => { if (m.type()==="error") console.log("console:", m.text()); });
  await p.goto("http://127.0.0.1:8743/gl/view.html?list=" + process.argv[2]);
  await p.waitForFunction(() => window.__evgStats !== undefined, { timeout: 25000 });
  console.log(process.argv[2], JSON.stringify(await p.evaluate(() => window.__evgStats)));
  if (process.argv[3]) await p.screenshot({ path: process.argv[3] });
  await b.close();
})();
