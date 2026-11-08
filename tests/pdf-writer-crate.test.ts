// ============================================================================
// pdf-writer-crate.test.ts — gallery/pdf_writer's PDF path as Rust syntax.
// ============================================================================
//
// The PDF write path (PDFWriter, fonts, JPEG reader, EVGPDFRenderer) is a
// crate of .rs modules (gallery/pdf_writer/src/lib.rs) that Ranger reads and
// writes to every target. evg_pdf_tool, still .rgr, renders example .tsx
// files with it; es6 and Go must write the same bytes.

import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";
import { execSync, spawnSync } from "child_process";

const ROOT = path.resolve(__dirname, "..");
const TOOL = "gallery/pdf_writer/src/tools/evg_pdf_tool.rgr";
const PDF_DIR = path.join(ROOT, "gallery", "pdf_writer");
const OUT = path.join(ROOT, "tests", ".output", "pdf-writer-crate");
const EXAMPLES = ["test_row", "test_layout", "test_fonts", "test_multipage", "product_catalog"];

function has(cmd: string): boolean {
  try {
    execSync(cmd, { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function run(cmd: string, args: string[], cwd = ROOT) {
  const r = spawnSync(cmd, args, { cwd, encoding: "utf8", timeout: 600000, maxBuffer: 64 << 20 });
  return { status: r.status, out: (r.stdout ?? "") + (r.stderr ?? "") };
}

function compile(lang: string, file: string): string {
  const dir = path.join(OUT, lang);
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  const extra = lang === "es6" ? ["-nodecli"] : [];
  const c = run("node", ["--max-old-space-size=8192", "dist/rgrc.js", `-l=${lang}`, TOOL, ...extra, `-d=${path.relative(ROOT, dir)}`, `-o=${file}`]);
  expect(c.status === 0 && !c.out.includes("[FAIL]"), c.out.slice(-4000)).toBe(true);
  return dir;
}

function render(cmd: string, args: string[], dir: string): Map<string, Buffer> {
  const out = new Map<string, Buffer>();
  for (const e of EXAMPLES) {
    const pdf = path.join(dir, `${e}.pdf`);
    const r = run(cmd, [...args, `examples/${e}.tsx`, pdf], PDF_DIR);
    expect(r.status, r.out.slice(-2000)).toBe(0);
    const b = fs.readFileSync(pdf);
    expect(b.subarray(0, 5).toString()).toBe("%PDF-");
    out.set(e, b);
  }
  return out;
}

describe("gallery/pdf_writer crate", () => {
  it.skipIf(!has("go version"))("es6 and Go write the same PDFs", () => {
    const es = compile("es6", "tool.js");
    const esPdfs = render("node", [path.join(es, "tool.js")], es);
    const go = compile("go", "tool.go");
    if (!fs.existsSync(path.join(go, "go.mod"))) {
      expect(run("go", ["mod", "init", "pdftool"], go).status).toBe(0);
    }
    const b = run("go", ["build", "-o", "tool", "."], go);
    expect(b.status, b.out.slice(-4000)).toBe(0);
    const goPdfs = render(path.join(go, "tool"), [], go);
    for (const e of EXAMPLES) {
      expect(goPdfs.get(e)!.equals(esPdfs.get(e)!), e).toBe(true);
    }
  }, 1800000);
});
