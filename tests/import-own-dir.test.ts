// ============================================================================
// import-own-dir.test.ts — `Import "x"` in an imported file looks in that
// file's own folder first. Before, the entry file's folder won when both had
// an x (the window crate's lib.rs hid gallery/math/src/lib.rs).
// ============================================================================

import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";
import { spawnSync } from "child_process";

const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(ROOT, "tests", ".output", "import-own-dir");

describe("Import from an imported file's own folder", () => {
  it("sub/Uses.rgr reads sub/util.rgr, not the entry's util.rgr", () => {
    fs.rmSync(OUT, { recursive: true, force: true });
    fs.mkdirSync(OUT, { recursive: true });
    const c = spawnSync("node", ["dist/rgrc.js", "-l=es6", "tests/fixtures/import_own_dir/app.rgr", "-nodecli",
      `-d=${path.relative(ROOT, OUT)}`, "-o=app.js"], { cwd: ROOT, encoding: "utf8" });
    const out = (c.stdout ?? "") + (c.stderr ?? "");
    expect(c.status === 0 && !out.includes("[FAIL]"), out).toBe(true);
    const r = spawnSync("node", [path.join(OUT, "app.js")], { encoding: "utf8" });
    expect(r.stdout.trim()).toBe("top+sub");
  });
});
