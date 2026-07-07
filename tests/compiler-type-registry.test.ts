import { describe, it, expect } from "vitest";
import { compileRanger } from "./helpers/compiler";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");

describe("Type registry and systemclass discovery (Track 3.1)", () => {
  it("should recognize HttpRequest from Lang.rgr without hardcoded isDefinedType entries", () => {
    const source = `
class HttpTypeSmokeTest {
    fn handle:void (req:HttpRequest res:HttpResponse) {
        print "ok"
    }
    sfn m@(main):void () {
        print "types-ok"
    }
}
`;
    const tmpDir = path.join(ROOT_DIR, "tests", ".output");
    const tmpFile = path.join(tmpDir, "http_type_smoke.rgr");
    fs.mkdirSync(tmpDir, { recursive: true });
    fs.writeFileSync(tmpFile, source, "utf8");
    const relPath = path.relative(ROOT_DIR, tmpFile).replace(/\\/g, "/");

    const result = compileRanger(`./${relPath}`, "es6");
    const combined = `${result.output}\n${result.error ?? ""}`;

    try {
      fs.unlinkSync(tmpFile);
    } catch {
      // ignore cleanup errors
    }

    expect(result.success, `Compile failed: ${combined}`).toBe(true);
    expect(combined).not.toContain("Unknown type: HttpRequest");
    expect(combined).not.toContain("Unknown type: HttpResponse");
  });

  it("should emit Uint8Array for buffer type via TTypeRegistry mapping", () => {
    const source = `
class BufferTypeSmokeTest {
    def data:buffer
    sfn m@(main):void () {
        print "buffer-ok"
    }
}
`;
    const tmpDir = path.join(ROOT_DIR, "tests", ".output");
    const tmpFile = path.join(tmpDir, "buffer_type_smoke.rgr");
    fs.mkdirSync(tmpDir, { recursive: true });
    fs.writeFileSync(tmpFile, source, "utf8");
    const relPath = path.relative(ROOT_DIR, tmpFile).replace(/\\/g, "/");

    const result = compileRanger(`./${relPath}`, "es6");
    const combined = `${result.output}\n${result.error ?? ""}`;

    try {
      fs.unlinkSync(tmpFile);
    } catch {
      // ignore cleanup errors
    }

    expect(result.success, `Compile failed: ${combined}`).toBe(true);
    expect(combined).not.toContain("Unknown type");
  });
});
