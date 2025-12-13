"use strict";
/**
 * Unit tests for error analysis and smart recovery
 * Tests incremental typing scenarios and contextual error hints
 */
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const rangerCompiler_1 = require("../rangerCompiler");
(0, vitest_1.describe)("Error Analysis and Smart Recovery", () => {
    (0, vitest_1.describe)("Type mismatch detection in function calls", () => {
        (0, vitest_1.it)("should detect string passed to method expecting double", async () => {
            // Start with working code
            const workingCode = `
class Mat2 {
  def setRotation(v:double) {
    // implementation
  }
}

def rotateVector() {
  def matrix (new Mat2)
  matrix.setRotation(0.0)
  return matrix
}
`;
            // First compilation - should succeed and cache
            const result1 = await (0, rangerCompiler_1.compileRangerCode)(workingCode, "test.rgr");
            (0, vitest_1.expect)(result1.errors).toHaveLength(0);
            // User types string instead of double
            const brokenCode = `
class Mat2 {
  def setRotation(v:double) {
    // implementation
  }
}

def rotateVector() {
  def matrix (new Mat2)
  matrix.setRotation("aasdf")
  return matrix
}
`;
            // Second compilation - should fail but provide helpful error
            const result2 = await (0, rangerCompiler_1.compileRangerCode)(brokenCode, "test.rgr");
            (0, vitest_1.expect)(result2.errors.length).toBeGreaterThan(0);
            const error = result2.errors[0];
            // Should pinpoint the line with setRotation call
            (0, vitest_1.expect)(error.line).toBeGreaterThan(0);
            (0, vitest_1.expect)(error.line).not.toBe(1); // Not just line 1
            // Should mention the method name and parameter issue
            (0, vitest_1.expect)(error.message).toMatch(/setRotation/i);
            (0, vitest_1.expect)(error.message).toMatch(/parameter|type|string|numeric/i);
        });
        (0, vitest_1.it)("should handle incomplete function calls", async () => {
            const workingCode = `
class Vec2 {
  def x:double
  def y:double
}

def test() {
  def v (new Vec2)
  v.x = 1.0
}
`;
            await (0, rangerCompiler_1.compileRangerCode)(workingCode, "test.rgr");
            // User starts typing a method call but doesn't finish
            const incompleteCode = `
class Vec2 {
  def x:double
  def y:double
}

def test() {
  def v (new Vec2)
  v.x = 1.0
  v.
}
`;
            const result = await (0, rangerCompiler_1.compileRangerCode)(incompleteCode, "test.rgr");
            // Should use cached results
            (0, vitest_1.expect)(result.ast).toBeDefined();
            // Should have error about incomplete expression
            (0, vitest_1.expect)(result.errors.length).toBeGreaterThan(0);
        });
    });
    (0, vitest_1.describe)("Incremental typing simulation", () => {
        (0, vitest_1.it)("should handle progressive typing of method call", async () => {
            const baseCode = `
class Mat2 {
  def setRotation(v:double) {}
}

def test() {
  def m (new Mat2)
`;
            const typingSteps = [
                baseCode + "\n}", // Complete and valid
                baseCode + "\n  m.\n}", // Start member access
                baseCode + "\n  m.set\n}", // Partial method name
                baseCode + "\n  m.setRotation(\n}", // Open paren
                baseCode + '\n  m.setRotation(""\n}', // Wrong type param (no closing paren)
                baseCode + '\n  m.setRotation("")\n}', // Wrong type param (complete)
            ];
            let previousResult = null;
            for (let i = 0; i < typingSteps.length; i++) {
                const code = typingSteps[i];
                const result = await (0, rangerCompiler_1.compileRangerCode)(code, "test.rgr");
                console.log(`Step ${i}: errors=${result.errors.length}, hasAST=${!!result.ast}`);
                // After first successful compilation, should have context
                if (i === 0) {
                    (0, vitest_1.expect)(result.errors).toHaveLength(0);
                    (0, vitest_1.expect)(result.ast).toBeDefined();
                }
                // Subsequent steps may fail but should use cache
                if (i > 0 && result.errors.length > 0) {
                    (0, vitest_1.expect)(result.ast).toBeDefined(); // Should have cached AST
                    // Last step should detect the type error
                    if (i === typingSteps.length - 1) {
                        (0, vitest_1.expect)(result.errors[0].message).toMatch(/setRotation/i);
                    }
                }
                previousResult = result;
            }
        });
    });
    (0, vitest_1.describe)("Line/column accuracy", () => {
        (0, vitest_1.it)("should calculate correct line numbers for multiline code", async () => {
            const workingCode = `line 1
line 2
line 3
def test() {
  def x = 1
}`;
            await (0, rangerCompiler_1.compileRangerCode)(workingCode, "test.rgr");
            // Add error on line 5
            const brokenCode = `line 1
line 2
line 3
def test() {
  invalid syntax here!!!
}`;
            const result = await (0, rangerCompiler_1.compileRangerCode)(brokenCode, "test.rgr");
            (0, vitest_1.expect)(result.errors.length).toBeGreaterThan(0);
            const error = result.errors[0];
            // Should be around line 5 (where the change occurred)
            (0, vitest_1.expect)(error.line).toBeGreaterThan(3);
            (0, vitest_1.expect)(error.line).toBeLessThan(7);
        });
    });
});
//# sourceMappingURL=errorAnalysis.test.js.map