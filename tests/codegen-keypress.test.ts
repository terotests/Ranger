import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { compileRangerWithFlags } from "./helpers/compiler";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");
const OUTPUT_DIR = path.join(ROOT_DIR, "tests", ".output");

function compileInline(name: string, source: string): { jsText: string } {
  const tmpFile = path.join(OUTPUT_DIR, `${name}.rgr`);
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(tmpFile, source, "utf8");
  const relPath = path.relative(ROOT_DIR, tmpFile).replace(/\\/g, "/");

  const result = compileRangerWithFlags(`./${relPath}`, "es6", OUTPUT_DIR);
  const jsFile = path.join(OUTPUT_DIR, `${name}.js`);

  try {
    fs.unlinkSync(tmpFile);
  } catch {
    // ignore
  }

  expect(
    result.success,
    `Compile failed: ${result.error || result.output}`
  ).toBe(true);
  expect(fs.existsSync(jsFile), `Missing output: ${jsFile}`).toBe(true);
  return { jsText: fs.readFileSync(jsFile, "utf8") };
}

// ISSUES.md #91.
describe("on_keypress", () => {
  it("declares the key variable mutable, because the handler assigns it", () => {
    // `const` here meant the FIRST keypress died with
    // "TypeError: Assignment to constant variable" -- at runtime, in a handler,
    // in raw mode, with the screen already cleared.
    const { jsText } = compileInline(
      "keypress_mutable_test",
      `
class KeypressMutableTest {
    sfn m@(main):void () {
        def lastKey:string ""
        on_keypress lastKey {
        }
        print "registered"
    }
}
`
    );

    expect(jsText).toContain('let lastKey = ""');
    expect(jsText).not.toContain('const lastKey = ""');
    expect(jsText).toContain("lastKey = __rgr_k;");
  });

  it("does not shadow a key variable named `key`", () => {
    // The handler's own parameters used to be `(str, key)`, and `key` is the
    // obvious name for a key variable. The Ranger local was shadowed, so the
    // block received the host's key OBJECT rather than the string, and the
    // assignment landed on the parameter -- the block was silently useless.
    const { jsText } = compileInline(
      "keypress_shadow_test",
      `
class KeypressShadowTest {
    sfn m@(main):void () {
        def key:string ""
        on_keypress key {
            print ("saw " + key)
        }
        print "registered"
    }
}
`
    );

    expect(jsText).toContain("(__rgr_s, __rgr_key) =>");
    expect(jsText).not.toContain("(str, key) =>");
    // The block reads the Ranger variable, which the handler has assigned.
    expect(jsText).toContain('key = __rgr_k;');
    expect(jsText).toContain('"saw " + key');
  });
});
