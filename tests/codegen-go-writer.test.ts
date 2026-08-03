import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import {
  compileRangerToGo,
  compileAndRunGo,
  isGoAvailable,
} from "./helpers/compiler";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");
const OUTPUT_DIR = path.join(ROOT_DIR, "tests", ".output");

const goAvailable = isGoAvailable();

function compileInline(name: string, source: string): { goText: string } {
  const tmpFile = path.join(OUTPUT_DIR, `${name}.rgr`);
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(tmpFile, source, "utf8");
  const relPath = path.relative(ROOT_DIR, tmpFile).replace(/\\/g, "/");

  const result = compileRangerToGo(`./${relPath}`, OUTPUT_DIR);
  const goFile = path.join(OUTPUT_DIR, `${name}.go`);

  try {
    fs.unlinkSync(tmpFile);
  } catch {
    // ignore
  }

  expect(
    result.success,
    `Compile failed: ${result.error || result.output}`
  ).toBe(true);
  expect(fs.existsSync(goFile), `Missing output: ${goFile}`).toBe(true);
  return { goText: fs.readFileSync(goFile, "utf8") };
}

describe("Go writer regressions", () => {
  it("emits double literals from the parsed value, not a source slice", () => {
    // The Double case used node.getParsedString(), which re-reads the source
    // file at the node's recorded position; macro-shifted positions sliced
    // unrelated bytes into the output. The writer must format double_value.
    const { goText } = compileInline(
      "go_double_literal_test",
      `
class DoubleLiteralTest {
    sfn m@(main):void () {
        def a:double 2.50
        def b:double 3.0
        def xs:[double]
        push xs 1.25
        def v:double (at xs 0)
        print ("" + (a + b + v))
    }
}
`
    );
    // value-formatted: trailing zero dropped
    expect(goText).toContain("2.5");
    expect(goText).not.toMatch(/2\.50/);
    // whole doubles keep a .0 suffix so Go types them as float64
    expect(goText).toContain("3.0");
    expect(goText).toContain("1.25");
  });

  it("emits the loop-item binding when the body only uses a field path", () => {
    // treeReferencesVRef missed ns-path roots: a body referencing only
    // tag.tagName never matched "tag", so go_for_bind dropped the binding
    // and the Go output failed with "undefined: tag".
    const { goText } = compileInline(
      "go_for_bind_test",
      `
class BindTag {
    def tagName:string "exif"
}
class ForBindTest {
    sfn m@(main):void () {
        def tags:[BindTag]
        def t1:BindTag (new BindTag ())
        push tags t1
        for tags tag:BindTag i {
            print tag.tagName
        }
        print "done"
    }
}
`
    );
    expect(goText).toMatch(/tag\s*:?=/);
    expect(goText).toContain(".tagName");
  });

  it("lowers to_int on doubles with floor semantics", () => {
    // int64(x) truncates toward zero; JS/C++/Python/PHP floor. The template
    // must emit math.Floor so negative values agree across targets.
    const { goText } = compileInline(
      "go_to_int_floor_test",
      `
class ToIntFloorTest {
    sfn m@(main):void () {
        def v:double (0.0 - 1.5)
        def i:int (to_int v)
        print ("" + i)
    }
}
`
    );
    expect(goText).toContain("int64(math.Floor(");
  });

  it.skipIf(!goAvailable)(
    "to_int of -1.5 evaluates to -2 at runtime",
    () => {
      const tmpFile = path.join(OUTPUT_DIR, "go_to_int_floor_run.rgr");
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
      fs.writeFileSync(
        tmpFile,
        `
class ToIntFloorRun {
    sfn m@(main):void () {
        def v:double (0.0 - 1.5)
        def i:int (to_int v)
        print ("" + i)
    }
}
`,
        "utf8"
      );
      const relPath = path.relative(ROOT_DIR, tmpFile).replace(/\\/g, "/");
      const { compile, run } = compileAndRunGo(`./${relPath}`);
      try {
        fs.unlinkSync(tmpFile);
      } catch {
        // ignore
      }
      expect(
        compile.success,
        `Compile failed: ${compile.error || compile.output}`
      ).toBe(true);
      expect(run?.success, `Run failed: ${run?.error}`).toBe(true);
      expect(run?.output).toContain("-2");
    }
  );
});
