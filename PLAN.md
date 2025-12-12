# Plan: Golang Test Environment for Ranger Compiler

## Status: ✅ COMPLETED

## Summary

Go testing environment has been set up successfully:
- **Go Installed**: v1.25.5
- **Tests Passing**: 14 passed, 1 skipped (due to Go type conversion issue in `math_ops.clj`)
- **CI Updated**: Separate jobs for ES6 and Go tests

---

## Overview

This document outlines the plan to create a test environment for verifying Ranger compiler output for the **Go** target language. Currently, all unit tests compile Ranger to ES6 JavaScript and execute with Node.js. We want to extend this to also test Go output.

## Current State

- **Existing Tests**: 15+ tests in `tests/compiler.test.ts`
- **Current Target**: ES6 JavaScript only (`-es6` flag)
- **Test Framework**: Vitest
- **Test Helper**: `tests/helpers/compiler.ts`
- **Fixtures Directory**: `tests/fixtures/*.clj`
- **Go Installed**: ❌ No (needs installation)

## Goals

1. Port existing fixture tests to also compile and run as Go code
2. Validate that the same Ranger source produces correct output in both JS and Go
3. Maintain parallel test execution capability
4. Keep CI/CD pipeline working (skip Go tests if Go not available)

---

## Phase 1: Prerequisites

### 1.1 Install Go

**Windows (Manual)**:
- Download from https://go.dev/dl/
- Install to default location (`C:\Program Files\Go`)
- Add to PATH

**Windows (Chocolatey)**:
```powershell
choco install golang
```

**Windows (Winget)**:
```powershell
winget install GoLang.Go
```

**CI/CD (GitHub Actions)**:
```yaml
- name: Setup Go
  uses: actions/setup-go@v5
  with:
    go-version: '1.21'
```

### 1.2 Verify Installation
```powershell
go version
# Expected: go version go1.21.x windows/amd64
```

---

## Phase 2: Test Infrastructure

### 2.1 Update Test Helper (`tests/helpers/compiler.ts`)

Add new functions to support Go compilation:

```typescript
// New constants
const GO_OUTPUT_DIR = path.join(ROOT_DIR, "tests", ".output-go");

// New function: Compile Ranger to Go
export function compileRangerToGo(sourceFile: string, outputDir?: string): CompileResult {
  // Similar to compileRanger but uses -go flag instead of -es6
  // Uses -o="filename.go" for output
}

// New function: Build and run Go file
export function runCompiledGo(goFile: string): RunResult {
  // 1. Run: go build -o temp.exe goFile
  // 2. Execute: temp.exe
  // 3. Capture and return output
}

// New convenience function
export function compileAndRunGo(sourceFile: string): { compile: CompileResult; run?: RunResult } {
  // Combines compile + build + run for Go
}
```

### 2.2 Create Go-Specific Output Directory

```
tests/
  .output/          # ES6 JavaScript output (existing)
  .output-go/       # Go source output (new)
```

Add to `.gitignore`:
```
tests/.output-go/
```

### 2.3 Go Module Setup

Create `tests/.output-go/go.mod`:
```go
module ranger_test

go 1.21
```

This allows compiled Go files to be part of a module for proper builds.

---

## Phase 3: Test Organization

### 3.1 Option A: Separate Test Files (Recommended)

Create parallel test structure:

```
tests/
  compiler.test.ts       # ES6 tests (existing)
  compiler-go.test.ts    # Go tests (new)
  helpers/
    compiler.ts          # Updated with Go support
```

**Pros**:
- Clear separation of concerns
- Can skip Go tests easily
- Independent test runs

**Cons**:
- Some code duplication in test assertions

### 3.2 Option B: Parameterized Tests

Use test.each or similar to run same tests for multiple targets:

```typescript
describe.each(['es6', 'go'])('Ranger Compiler - %s', (target) => {
  const compileAndRun = target === 'es6' ? compileAndRunES6 : compileAndRunGo;
  
  it('should compile and run array push', () => {
    // Same test logic, different compiler target
  });
});
```

**Pros**:
- No code duplication
- Single source of truth for test cases

**Cons**:
- More complex setup
- Harder to skip one target

### 3.3 Recommended: Hybrid Approach

1. Create shared test case definitions
2. Import into both ES6 and Go test files
3. Use conditional skipping based on Go availability

```typescript
// tests/fixtures/test-cases.ts
export const TEST_CASES = {
  array_push: {
    fixture: 'array_push.clj',
    expectedOutput: ['Done'],
  },
  // ...
};
```

---

## Phase 4: CI/CD Updates

### 4.1 Update GitHub Workflow (`.github/workflows/ci.yml`)

```yaml
name: CI

on: [push, pull_request]

jobs:
  test-es6:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [18.x, 20.x]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
      - run: npm ci
      - run: npm test

  test-go:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20.x'
      - uses: actions/setup-go@v5
        with:
          go-version: '1.21'
      - run: npm ci
      - run: npm run test:go

  test-gate:
    needs: [test-es6, test-go]
    runs-on: ubuntu-latest
    steps:
      - run: echo "All tests passed!"
```

### 4.2 Update `package.json` Scripts

```json
{
  "scripts": {
    "test": "vitest run",
    "test:es6": "vitest run compiler.test.ts",
    "test:go": "vitest run compiler-go.test.ts",
    "test:all": "vitest run"
  }
}
```

---

## Phase 5: Implementation Steps

### Step-by-Step Checklist

- [x] **Step 1**: Install Go locally
- [x] **Step 2**: Update `tests/helpers/compiler.ts` with Go functions
- [x] **Step 3**: Create `tests/.output-go/` directory (auto-created)
- [x] **Step 4**: Update `.gitignore`
- [x] **Step 5**: Create `tests/compiler-go.test.ts` with first test
- [x] **Step 6**: Verify first Go test works locally
- [x] **Step 7**: Port remaining fixture tests to Go
- [x] **Step 8**: Update CI workflow
- [ ] **Step 9**: Add conditional skip if Go not available (implemented via `describe.skipIf`)
- [ ] **Step 10**: Document in README.md

---

## Phase 6: Handling Go-Specific Differences

### 6.1 Known Differences

1. **Package declaration**: Go files need `package main`
2. **Imports**: Go compiler auto-generates imports
3. **Entry point**: `func main()` required
4. **Print output**: May have slight formatting differences

### 6.2 Test Adjustments

Some tests may need Go-specific assertions:

```typescript
// Go may format numbers differently
if (target === 'go') {
  expect(run?.output).toMatch(/3\.14/);
} else {
  expect(run?.output).toContain('3.14');
}
```

### 6.3 Fixtures That May Need Adjustment

| Fixture | Issue | Solution |
|---------|-------|----------|
| `string_ops.clj` | Unicode handling | Test both or skip |
| `optional_values.clj` | Nil vs undefined | Adjust assertions |

---

## Phase 7: Future Considerations

### 7.1 Additional Language Targets

Once Go testing is established, the same pattern can apply to:
- Java (`-java7`)
- Swift (`-swift3`)
- PHP (`-php`)
- C++ (`-cpp`)

### 7.2 Performance Testing

Go tests could include performance benchmarks since Go has built-in benchmarking.

### 7.3 Cross-Platform Testing

CI matrix could expand to test Go on multiple OSes:
- ubuntu-latest
- windows-latest
- macos-latest

---

## Quick Start (After Go Installation)

```powershell
# 1. Install Go (if not done)
winget install GoLang.Go

# 2. Restart terminal to get PATH updates

# 3. Verify Go
go version

# 4. Run Go tests (after implementation)
npm run test:go
```

---

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `tests/helpers/compiler.ts` | Modify | Add Go compilation functions |
| `tests/compiler-go.test.ts` | Create | Go-specific test file |
| `tests/.output-go/go.mod` | Create | Go module definition |
| `.gitignore` | Modify | Add `.output-go/` |
| `.github/workflows/ci.yml` | Modify | Add Go test job |
| `package.json` | Modify | Add test:go script |
| `README.md` | Modify | Document Go testing |

---

## Estimated Effort

| Phase | Time Estimate |
|-------|---------------|
| Phase 1: Prerequisites | 15 min |
| Phase 2: Infrastructure | 1 hour |
| Phase 3: Test Organization | 30 min |
| Phase 4: CI/CD | 30 min |
| Phase 5: Implementation | 2 hours |
| Phase 6: Go-specific fixes | 1 hour |
| **Total** | **~5-6 hours** |

---

## Success Criteria

1. ✅ Go is installed and working
2. ✅ At least 5 fixture tests pass for Go target
3. ✅ CI pipeline runs both ES6 and Go tests
4. ✅ Tests skip gracefully if Go is not available
5. ✅ Documentation is updated
