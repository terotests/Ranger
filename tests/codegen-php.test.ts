import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { compileRangerWithFlags } from "./helpers/compiler";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");
const OUTPUT_DIR = path.join(ROOT_DIR, "tests", ".output");

function compileInline(name: string, source: string): { phpText: string } {
  const tmpFile = path.join(OUTPUT_DIR, `${name}.rgr`);
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(tmpFile, source, "utf8");
  const relPath = path.relative(ROOT_DIR, tmpFile).replace(/\\/g, "/");

  const result = compileRangerWithFlags(`./${relPath}`, "php", OUTPUT_DIR);
  const phpFile = path.join(OUTPUT_DIR, `${name}.php`);

  try {
    fs.unlinkSync(tmpFile);
  } catch {
    // ignore
  }

  expect(
    result.success,
    `Compile failed: ${result.error || result.output}`
  ).toBe(true);
  expect(fs.existsSync(phpFile), `Missing output: ${phpFile}`).toBe(true);
  return { phpText: fs.readFileSync(phpFile, "utf8") };
}

describe("PHP writer regressions", () => {
  // ISSUES.md #83. The `$` case in EncodeString emitted a backslash followed by
  // a DOUBLE QUOTE, copied from the case above it, so `"literal $HOME stays"`
  // came out as `"literal \"HOME stays"`: a parse error, and not the escape
  // that was intended either (PHP interpolates `$` inside double quotes, so the
  // escape is `\$`).
  it("escapes a dollar in a string literal as \\$, not as a quote", () => {
    const { phpText } = compileInline(
      "php_dollar_escape_test",
      `
class PhpDollarEscapeTest {
    sfn m@(main):void () {
        print "literal $HOME stays"
        print "two $A and $B"
        print "a real quote \\" and a dollar $"
        print "no dollars here"
    }
}
`
    );

    expect(phpText).toContain('"literal \\$HOME stays"');
    expect(phpText).toContain('"two \\$A and \\$B"');
    expect(phpText).toContain('"a real quote \\" and a dollar \\$"');
    expect(phpText).toContain('"no dollars here"');

    // The defect's signature: a dollar turning into an unbalanced quote. If it
    // ever comes back, the generated file has an odd number of quotes on that
    // line and PHP cannot parse it.
    expect(phpText).not.toContain('"literal \\"HOME stays"');
  });
});
