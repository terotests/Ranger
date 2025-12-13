/**
 * Unit tests for error analysis and smart recovery
 * Tests incremental typing scenarios and contextual error hints
 */

import { describe, it, expect } from "vitest";
import { compileRangerCode } from "../rangerCompiler";

describe("Error Analysis and Smart Recovery", () => {
  describe("Type mismatch detection in function calls", () => {
    it("should detect string passed to method expecting double", async () => {
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
      const result1 = await compileRangerCode(workingCode, "test.rngr");
      expect(result1.errors).toHaveLength(0);

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
      const result2 = await compileRangerCode(brokenCode, "test.rngr");

      expect(result2.errors.length).toBeGreaterThan(0);
      const error = result2.errors[0];

      // Should pinpoint the line with setRotation call
      expect(error.line).toBeGreaterThan(0);
      expect(error.line).not.toBe(1); // Not just line 1

      // Should mention the method name and parameter issue
      expect(error.message).toMatch(/setRotation/i);
      expect(error.message).toMatch(/parameter|type|string|numeric/i);
    });

    it("should handle incomplete function calls", async () => {
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

      await compileRangerCode(workingCode, "test.rngr");

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

      const result = await compileRangerCode(incompleteCode, "test.rngr");

      // Should use cached results
      expect(result.ast).toBeDefined();

      // Should have error about incomplete expression
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe("Incremental typing simulation", () => {
    it("should handle progressive typing of method call", async () => {
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
        const result = await compileRangerCode(code, "test.rngr");

        console.log(
          `Step ${i}: errors=${result.errors.length}, hasAST=${!!result.ast}`
        );

        // After first successful compilation, should have context
        if (i === 0) {
          expect(result.errors).toHaveLength(0);
          expect(result.ast).toBeDefined();
        }

        // Subsequent steps may fail but should use cache
        if (i > 0 && result.errors.length > 0) {
          expect(result.ast).toBeDefined(); // Should have cached AST

          // Last step should detect the type error
          if (i === typingSteps.length - 1) {
            expect(result.errors[0].message).toMatch(/setRotation/i);
          }
        }

        previousResult = result;
      }
    });
  });

  describe("Line/column accuracy", () => {
    it("should calculate correct line numbers for multiline code", async () => {
      const workingCode = `line 1
line 2
line 3
def test() {
  def x = 1
}`;

      await compileRangerCode(workingCode, "test.rngr");

      // Add error on line 5
      const brokenCode = `line 1
line 2
line 3
def test() {
  invalid syntax here!!!
}`;

      const result = await compileRangerCode(brokenCode, "test.rngr");

      expect(result.errors.length).toBeGreaterThan(0);
      const error = result.errors[0];

      // Should be around line 5 (where the change occurred)
      expect(error.line).toBeGreaterThan(3);
      expect(error.line).toBeLessThan(7);
    });
  });
});
