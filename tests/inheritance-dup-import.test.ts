import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { compileAndRun } from "./helpers/compiler";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");
const OUTPUT_DIR = path.join(ROOT_DIR, "tests", ".output");

// Regression for the import de-duplication / inheritance bug: when the SAME
// file is imported via two DIFFERENT path strings (e.g. a bare name resolved on
// a library path vs. an explicit repo-relative path), the class it defines used
// to be collected twice. The second walk registered the methods on a throw-away
// class desc, so a SUBCLASS could no longer resolve the parent's inherited
// methods — failing with a misleading "function variable not found <method>".
// The fix (RangerAppClassDesc.is_collected) skips re-walking an already-collected
// class body. See ISSUES.md.
describe("inheritance across a file imported via two path strings", () => {
  it("resolves inherited methods when the parent file is imported twice", () => {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });

    // Parent in its own file.
    const baseFile = path.join(OUTPUT_DIR, "dup_base.rgr");
    fs.writeFileSync(
      baseFile,
      `class DupBase {
    def val:int 42
    fn baseVal:int () {
        return (this.val)
    }
}
`,
      "utf8"
    );

    // The SUBCLASS lives in its own file and one of its methods calls an
    // INHERITED method — exactly the shape that broke (a subclass file loaded
    // twice registered its methods on a throw-away desc, so the inherited
    // `baseVal` no longer resolved inside `childVal`).
    const childFile = path.join(OUTPUT_DIR, "dup_child.rgr");
    fs.writeFileSync(
      childFile,
      `Import "dup_base.rgr"
class DupChild extends DupBase {
    fn childVal:int () {
        return (this.baseVal())
    }
}
`,
      "utf8"
    );

    // The main imports the SAME subclass file via two different path strings:
    //  - "dup_child.rgr"                 (found on the entry file's dir)
    //  - "tests/.output/dup_child.rgr"   (repo-relative)
    const mainFile = path.join(OUTPUT_DIR, "dup_main.rgr");
    fs.writeFileSync(
      mainFile,
      `Import "dup_child.rgr"
Import "tests/.output/dup_child.rgr"
class DupMain {
    sfn m@(main):void () {
        def c:DupChild (new DupChild)
        print (to_string (c.childVal()))
    }
}
`,
      "utf8"
    );

    const relMain = path.relative(ROOT_DIR, mainFile).replace(/\\/g, "/");
    const { compile, run } = compileAndRun(`./${relMain}`);

    try {
      fs.unlinkSync(baseFile);
      fs.unlinkSync(childFile);
      fs.unlinkSync(mainFile);
    } catch {
      // ignore
    }

    expect(
      compile.success,
      `Compile failed: ${compile.error || compile.output}`
    ).toBe(true);
    expect(run?.success, `Run failed: ${run?.error || run?.output}`).toBe(true);
    expect((run?.output || "").trim()).toBe("42");
  });
});
