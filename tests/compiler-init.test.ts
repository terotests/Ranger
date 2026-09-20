import { describe, it, expect, afterEach } from "vitest";
import { execSync } from "child_process";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");
const RGRC = path.join(ROOT, "bin", "output.js");

function rgrc(args: string, cwd?: string): string {
  return execSync(`node "${RGRC}" ${args}`, {
    cwd: cwd || ROOT,
    encoding: "utf8",
    env: {
      ...process.env,
      RANGER_LIB: `${path.join(ROOT, "compiler", "Lang.rgr")}:${path.join(ROOT, "lib", "stdops.rgr")}`,
    },
  });
}

describe("rgrc init", () => {
  const dirs: string[] = [];

  afterEach(() => {
    for (const d of dirs) {
      fs.rmSync(d, { recursive: true, force: true });
    }
    dirs.length = 0;
  });

  it("lists init in the help", () => {
    const out = rgrc("");
    expect(out).toMatch(/\binit\b/);
    expect(out).toMatch(/coffee/i);
    expect(out).toMatch(/\binstall\b/);
  });

  it("writes the coffee shop into a new directory", () => {
    const dest = fs.mkdtempSync(path.join(os.tmpdir(), "rgrc-init-coffee-"));
    dirs.push(dest);
    const out = rgrc(`init "${dest}" -force`);
    expect(out).toMatch(/Created Ranger project/);
    expect(out).toMatch(/template\s+coffee/);
    expect(fs.existsSync(path.join(dest, "src", "Main.rgr"))).toBe(true);
    expect(fs.existsSync(path.join(dest, "src", "ReceiptPdf.rgr"))).toBe(true);
    expect(fs.existsSync(path.join(dest, "scripts", "rgr"))).toBe(true);
    expect(fs.existsSync(path.join(dest, "package.json"))).toBe(true);
    expect(fs.existsSync(path.join(dest, "ranger.json"))).toBe(true);
    const man = JSON.parse(fs.readFileSync(path.join(dest, "ranger.json"), "utf8"));
    expect(man.entry).toBe("src/Main.rgr");
    expect(man.dependencies.evg.git).toContain("github.com/terotests/Ranger");
    expect(man.dependencies.evg.subdir).toBe("lib/evg");
    const pkg = JSON.parse(fs.readFileSync(path.join(dest, "package.json"), "utf8"));
    expect(pkg.scripts.start).toMatch(/scripts\/rgr/);
    const main = fs.readFileSync(path.join(dest, "src", "Main.rgr"), "utf8");
    expect(main).toContain("Ranger Coffee");
  });

  it("writes the hello greeter with -template=hello", () => {
    const dest = fs.mkdtempSync(path.join(os.tmpdir(), "rgrc-init-hello-"));
    dirs.push(dest);
    const out = rgrc(`init "${dest}" -template=hello -force`);
    expect(out).toMatch(/template\s+hello/);
    expect(fs.existsSync(path.join(dest, "src", "Greeter.rgr"))).toBe(true);
    expect(fs.existsSync(path.join(dest, "src", "ReceiptPdf.rgr"))).toBe(false);
    const man = JSON.parse(fs.readFileSync(path.join(dest, "ranger.json"), "utf8"));
    expect(man.dependencies).toBeUndefined();
    const greet = fs.readFileSync(path.join(dest, "src", "Greeter.rgr"), "utf8");
    expect(greet).toContain("class Greeter");
  });

  it("refuses to overwrite src/Main.rgr without -force", () => {
    const dest = fs.mkdtempSync(path.join(os.tmpdir(), "rgrc-init-refuse-"));
    dirs.push(dest);
    fs.mkdirSync(path.join(dest, "src"));
    fs.writeFileSync(path.join(dest, "src", "Main.rgr"), "; keep me\n");
    let threw = false;
    try {
      rgrc(`init "${dest}"`);
    } catch (e) {
      threw = true;
      const err = e as { stdout?: string; stderr?: string; status?: number };
      const text = `${err.stdout || ""}${err.stderr || ""}`;
      expect(text).toMatch(/already has src\/Main\.rgr/);
    }
    expect(threw).toBe(true);
    expect(fs.readFileSync(path.join(dest, "src", "Main.rgr"), "utf8")).toContain("keep me");
  });
});
