import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { compileRangerToGo } from "./helpers/compiler";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");
const OUTPUT_DIR = path.join(ROOT_DIR, "tests", ".output");

describe("Go clear operator codegen (Issue #59)", () => {
  it("should emit slice reset [:0] instead of nil assignment for clear", () => {
    const source = `
class ClearCodegenTest {
    sfn m@(main):void () {
        def xs:[int]
        push xs 1
        clear xs
        print "ok"
    }
}
`;
    const tmpFile = path.join(OUTPUT_DIR, "clear_codegen_test.rgr");
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    fs.writeFileSync(tmpFile, source, "utf8");
    const relPath = path.relative(ROOT_DIR, tmpFile).replace(/\\/g, "/");

    const result = compileRangerToGo(`./${relPath}`, OUTPUT_DIR);
    const goFile = path.join(OUTPUT_DIR, "clear_codegen_test.go");

    try {
      fs.unlinkSync(tmpFile);
    } catch {
      // ignore
    }

    expect(
      result.success,
      `Compile failed: ${result.error || result.output}`
    ).toBe(true);
    expect(fs.existsSync(goFile)).toBe(true);
    const goSource = fs.readFileSync(goFile, "utf8");
    expect(goSource).toMatch(/\[:0\]/);
  });
});
