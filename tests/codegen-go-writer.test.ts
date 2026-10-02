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

  it.skipIf(!goAvailable)(
    "PresDeck shapes: map-of-double get, optional-backed local, indexOfFrom, a local named copy",
    () => {
      // Four things that kept Sliqtly's PresDeck from building as Go:
      // `unwrap (get m k)` on a [string:double] read .value off a float64;
      // `def previous:T board` (board optional) is a *GoNullable and a
      // method call on it was a call on the box; indexOfFrom's own `idx`
      // hid a caller's `idx` in the start offset; a local named `copy` hid
      // copy() from buffer_copy.
      const tmpFile = path.join(OUTPUT_DIR, "go_presdeck_shapes_run.rgr");
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
      fs.writeFileSync(
        tmpFile,
        `
class ShapeBoard {
    def kind:string "board"
    fn clone:ShapeBoard () {
        def b (new ShapeBoard)
        b.kind = this.kind
        return b
    }
}
class ShapeHolder {
    def board@(optional):ShapeBoard
    fn kids:string () {
        def previous:ShapeBoard board
        def child (previous.clone())
        child.kind = (child.kind + "-step")
        return child.kind
    }
}
class ShapeBuf {
    def data:buffer (buffer_alloc 4)
    fn clone:ShapeBuf () {
        def copy (new ShapeBuf)
        buffer_copy copy.data 0 this.data 0 4
        return copy
    }
}
class PresDeckShapesRun {
    sfn m@(main):void () {
        def sums:[string:double]
        set sums "a" 1.5
        def s:double 0.0
        if (has sums "a") {
            s = (unwrap (get sums "a"))
        }
        print ("sum " + s)
        def xml:string "<a><Relationship x><b>"
        def idx:int (indexOfFrom xml "<Relationship" 0)
        def end:int (indexOfFrom xml ">" idx)
        print ("idx " + idx + " end " + end)
        def h (new ShapeHolder)
        h.board = (new ShapeBoard)
        print (h.kids())
        def b (new ShapeBuf)
        def c:ShapeBuf (b.clone())
        print ("copied " + (buffer_length c.data))
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
      expect(run?.output).toContain("sum 1.5");
      expect(run?.output).toContain("idx 3 end 18");
      expect(run?.output).toContain("board-step");
      expect(run?.output).toContain("copied 4");
    }
  );

  it.skipIf(!goAvailable)(
    "an array parameter the callee grows reaches the caller (ISSUES.md #58)",
    () => {
      // A slice is passed by value: `push out x` in the callee was lost.
      // Such a parameter is a *[]T now, through static functions, methods
      // (an override and its interface keep one signature), a parameter
      // handed on to another callee, a field and a call result.
      const tmpFile = path.join(OUTPUT_DIR, "go_slice_param_run.rgr");
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
      fs.writeFileSync(
        tmpFile,
        `
class SliceEmit {
    def tag:string "e"
    fn emit:void (out:[string]) {
        push out tag
        this.more(out)
    }
    fn more:void (out:[string]) {
        push out "more"
    }
}
class SliceEmit2 {
    Extends (SliceEmit)
    fn emit:void (out:[string]) {
        push out "two"
    }
}
class SliceFiller {
    def items:[int]
    sfn fill:void (output:[int] n:int) {
        def i:int 0
        while (i < n) {
            push output i
            i = (i + 1)
        }
    }
    sfn reset:void (data:[int]) {
        clear data
        push data 42
    }
    sfn mk:[int] () {
        def r:[int]
        push r 7
        return r
    }
}
class SliceParamRun {
    sfn m@(main):void () {
        def arr:[int]
        SliceFiller.fill(arr 3)
        print ("fill " + (array_length arr))
        SliceFiller.reset(arr)
        print ("reset " + (array_length arr) + " " + (itemAt arr 0))
        def f (new SliceFiller)
        SliceFiller.fill(f.items 2)
        print ("field " + (array_length f.items))
        SliceFiller.fill((SliceFiller.mk()) 2)
        def parts:[string]
        def e (new SliceEmit)
        e.emit(parts)
        def e2:SliceEmit (new SliceEmit2)
        e2.emit(parts)
        print ("emit " + (join parts ","))
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
      expect(run?.output).toContain("fill 3");
      expect(run?.output).toContain("reset 1 42");
      expect(run?.output).toContain("field 2");
      expect(run?.output).toContain("emit e,more,two");
    }
  );
});
