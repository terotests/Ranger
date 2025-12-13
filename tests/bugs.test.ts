import { describe, it, expect } from "vitest";
import { compileRanger } from "./helpers/compiler";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FIXTURES_DIR = path.join(__dirname, "fixtures");

describe("Ranger Compiler - Known Bugs", () => {
  describe("Issue #1: toString method name crash", () => {
    // Skip this test - the bug is context-dependent and doesn't always reproduce
    // The bug was confirmed manually but the minimal test case doesn't trigger it consistently
    // See ISSUES.md for details on the bug
    it.skip("should crash when class has toString method and is used in array", () => {
      // This test documents a known bug
      // The compiler crashes during "Collecting available methods" phase
      // when a class has a method named "toString" and another class
      // uses that class as an array element type

      const filePath = path.join(FIXTURES_DIR, "bug_tostring.rgr");
      const result = compileRanger(filePath);

      // Currently this FAILS - documenting the bug
      expect(result.success).toBe(false);
      expect(result.error).toContain(
        "Cannot read properties of undefined (reading 'push')"
      );
    });
  });
});
