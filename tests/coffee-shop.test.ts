import { describe, it, expect } from "vitest";
import { compileAndRun } from "./helpers/compiler";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(ROOT, "tests", ".output");
const RGRC = path.join(ROOT, "bin", "output.js");

describe("Ranger Coffee", () => {
  it("rings up two lattes and a bun", () => {
    const { compile, run } = compileAndRun(
      "examples/coffee_shop/src/MainTest.rgr"
    );
    expect(compile.success, compile.error || compile.output).toBe(true);
    expect(run?.success, run?.error || run?.output).toBe(true);
    expect(run?.output).toContain("ALL PASS");
  });

  it("lays out a receipt and writes a PDF", () => {
    fs.mkdirSync(OUT, { recursive: true });
    const js = path.join(OUT, "CoffeeMain.js");
    if (fs.existsSync(js)) {
      fs.unlinkSync(js);
    }
    const log = execSync(
      `node "${RGRC}" -es6 "./examples/coffee_shop/src/Main.rgr" -nodecli -d="${path.relative(ROOT, OUT)}" -o="CoffeeMain.js"`,
      {
        cwd: ROOT,
        encoding: "utf8",
        timeout: 180000,
        env: {
          ...process.env,
          RANGER_LIB: "./compiler/Lang.rgr;./lib/stdops.rgr",
        },
      }
    );
    expect(log).not.toMatch(/Compilation FAILED/);
    expect(fs.existsSync(js)).toBe(true);
    const stem = path.join(OUT, "coffee-receipt");
    const output = execSync(`node "${js}" --out="${stem}" latte bun`, {
      cwd: ROOT,
      encoding: "utf8",
      timeout: 30000,
    });
    expect(output).toContain("Ranger Coffee");
    expect(output).toContain("Latte");
    expect(output).toContain("Cinnamon bun");
    expect(output).toMatch(/Wrote .+\.pdf/);
    const pdf = fs.readFileSync(`${stem}.pdf`);
    expect(pdf.subarray(0, 5).toString("ascii")).toBe("%PDF-");
    const json = fs.readFileSync(`${stem}.evg.json`, "utf8");
    expect(json).toContain("\"evg\":1");
    expect(json).toContain("Ranger Coffee");
  }, 180_000);
});
