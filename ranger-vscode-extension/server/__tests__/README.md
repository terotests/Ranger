# Language Server Testing

## Overview

This directory contains unit tests for the Ranger language server, focusing on error analysis, smart recovery, and incremental typing scenarios.

## Setup

Tests are written using **Vitest** for fast, modern testing with TypeScript support.

```bash
cd server
npm install
npm test          # Run tests once
npm run test:watch  # Run tests in watch mode
```

## Test Structure

### Error Analysis Tests (`__tests__/errorAnalysis.test.ts`)

Tests the smart error recovery system that provides contextual hints when the LISP parser fails:

#### 1. Type Mismatch Detection

- Tests detection of wrong parameter types (e.g., string where double expected)
- Validates line/column accuracy for errors
- Ensures error messages mention the method name and parameter issues

```typescript
// Example: User types string instead of double
matrix.setRotation("aasdf"); // expects double

// Expected error at correct line:
// "Check parameters for method 'setRotation' - verify types match expected signature"
```

#### 2. Incomplete Function Calls

- Tests behavior when user types incomplete code (e.g., `v.`)
- Validates that cached AST is used for autocomplete
- Ensures graceful degradation during typing

#### 3. Incremental Typing Simulation

- Simulates progressive typing of method calls
- Tests caching strategy with code changes ≤50 characters
- Validates that autocomplete works even with syntax errors

```typescript
// Simulated typing steps:
"m"; // ✓ Cache from previous success
"m."; // ✓ Use cache, show members
"m.setRotation("; // ✓ Use cache, incomplete
'm.setRotation("")'; // ✗ Error with context hint
```

#### 4. Line/Column Accuracy

- Tests offset-to-line/column conversion
- Validates error reporting at correct source locations
- Ensures multi-line code is handled properly

## Testing Philosophy

The tests simulate **real user typing scenarios** rather than just testing isolated functions:

1. **Progressive State**: Each test builds on previous state (like a user typing)
2. **Cache Strategy**: Tests verify the 50-char threshold for cache usage
3. **Error Context**: Validates that error messages provide actionable hints
4. **LISP Parser Challenges**: Tests work around parser limitations by using code diffs

## Writing New Tests

### Pattern: Incremental Typing Test

```typescript
it("should handle user typing scenario", async () => {
  const workingCode = `...valid code...`;

  // First compilation - establish cache
  await compileRangerCode(workingCode, "test.rgr");

  // User makes a change
  const modifiedCode = `...code with error...`;

  // Should provide contextual error
  const result = await compileRangerCode(modifiedCode, "test.rgr");

  expect(result.errors[0].line).toBeGreaterThan(0);
  expect(result.errors[0].message).toMatch(/expected hint/);
});
```

### Pattern: Type Mismatch Test

```typescript
it("should detect type mismatch in specific context", async () => {
  const code = `
    def method(x:ExpectedType) {}
    method(wrongType)  // This should error
  `;

  const result = await compileRangerCode(code, "test.rgr");

  expect(result.errors[0].message).toMatch(/method/i);
  expect(result.errors[0].message).toMatch(/ExpectedType/i);
});
```

## Current Test Coverage

- ✅ Type mismatch detection in function calls
- ✅ Incomplete expression handling
- ✅ Incremental typing simulation (6-step progression)
- ✅ Line/column accuracy for multiline code
- ⚠️ TODO: Class member access errors
- ⚠️ TODO: Method signature mismatch details
- ⚠️ TODO: Performance benchmarks for cache strategy

## Debugging Tests

Enable verbose logging:

```typescript
console.log("[Test] Result:", JSON.stringify(result, null, 2));
```

Run specific test:

```bash
npm test -- errorAnalysis.test.ts -t "should detect string passed"
```

## Integration with VS Code

These tests validate the behavior that users see in VS Code:

- **Hover**: Should show class members even with syntax errors nearby
- **Autocomplete**: Should work when code has errors (uses cache)
- **Diagnostics**: Should pinpoint error location, not just report "line 1"
- **Error Messages**: Should be contextual, not generic

## Performance Considerations

- Tests run in-memory (no file I/O)
- Each test is independent (no shared state)
- Cache is per-file, so tests don't interfere
- Average test run time: <100ms per test

## Contributing

When adding new language features, add tests for:

1. **Happy path**: Feature works correctly
2. **Error path**: Feature fails gracefully with good error message
3. **Incremental path**: Feature works while user is typing
4. **Cache path**: Feature works when code has errors nearby
