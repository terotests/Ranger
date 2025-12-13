# Incremental Compilation Strategy for Ranger Language Server

## Problem Statement

The Ranger compiler crashes when parsing incomplete code (e.g., typing `v.` triggers autocomplete but the compiler encounters `TypeError: Cannot read properties of undefined (reading 'compiledName')`). This causes the language server to restart repeatedly, providing poor user experience.

## Root Cause

1. **Incomplete Code**: When users type incomplete expressions like `v.`, the compiler tries to compile it and crashes
2. **Missing Type Information**: Even when compilation succeeds, some classes show 0 properties (e.g., `Vec2` has `x` and `y` but they don't appear in `definedClasses`)
3. **Server Crashes**: Unhandled exceptions cause the entire language server process to exit

## Solution: Incremental Compilation with Caching

### Core Strategy

Keep the **last successful compilation** in memory as a reference. When new compilation fails:

1. **Check if code is similar**: Compare the new code with the last successful compilation
2. **Identify stable regions**: The beginning of the file (up to the edit point) is likely unchanged
3. **Reuse old context**: Use the context from last successful compilation for autocomplete/hover
4. **Mark uncertain areas**: Treat the newly added/modified code as "unknown" until successfully compiled

### Implementation Design

#### 1. Compilation Cache Structure

```typescript
interface SuccessfulCompilation {
  code: string; // The source code that compiled successfully
  rootNode: CodeNode | null; // The AST root node
  context: any | null; // RangerAppWriterContext with definedClasses
  timestamp: number; // When this was cached
}

const compilationCache: Map<string, SuccessfulCompilation> = new Map();
```

#### 2. Compilation Flow

```
┌─────────────────────────────────────┐
│  New code arrives (e.g., user types) │
└──────────────┬──────────────────────┘
               │
               ▼
      ┌────────────────────┐
      │  Try to compile    │
      └────────┬───────────┘
               │
        ┌──────┴──────┐
        │             │
     Success       Failure
        │             │
        ▼             ▼
  ┌──────────┐  ┌──────────────────────┐
  │ Cache it │  │ Check cache for file │
  └────┬─────┘  └──────┬───────────────┘
       │               │
       │          ┌────┴─────┐
       │          │          │
       │       No Cache   Has Cache
       │          │          │
       │          ▼          ▼
       │    ┌─────────┐  ┌─────────────────────┐
       │    │ Return  │  │ Compare with cached │
       │    │ errors  │  │ code (prefix match) │
       │    └─────────┘  └──────┬──────────────┘
       │                         │
       │                    ┌────┴────┐
       │                    │         │
       │                  Match   Different
       │                    │         │
       │                    ▼         ▼
       │            ┌───────────────────────┐
       │            │ Use cached context    │
       │            │ (old working state)   │
       │            └───────────────────────┘
       │
       └──────────────┐
                      │
                      ▼
           ┌──────────────────────┐
           │ Provide LSP features │
           │ (hover, complete...) │
           └──────────────────────┘
```

#### 3. Code Similarity Detection

**Strategy**: Check if the new code starts with the same prefix as the cached code

```typescript
function codeHasCommonPrefix(newCode: string, cachedCode: string): boolean {
  // Find common prefix length
  let prefixLen = 0;
  const minLen = Math.min(newCode.length, cachedCode.length);

  for (let i = 0; i < minLen; i++) {
    if (newCode[i] === cachedCode[i]) {
      prefixLen++;
    } else {
      break;
    }
  }

  // If at least 80% of the smaller code matches, consider it similar
  return prefixLen > minLen * 0.8;
}
```

**Example**:

- **Cached (successful)**:
  ```
  class Vec2 { def x:double 0.0 ... }
  def v (new Vec2)
  v.x = 10
  ```
- **New code (incomplete)**:
  ```
  class Vec2 { def x:double 0.0 ... }
  def v (new Vec2)
  v.
  ```
- **Analysis**: First 95% matches → Use cached context for `Vec2` class info

#### 4. Fallback Behavior

When compilation fails but cache is available:

1. **Return cached context**: LSP features use the old, working type information
2. **Log the strategy**: Make it clear we're using cached data
3. **Mark as partial**: Indicate that some info might be stale
4. **No errors for incomplete code**: Don't show compiler errors for syntax issues at cursor

#### 5. Cache Invalidation

Clear cache when:

- **Major structural changes**: Class definitions significantly altered
- **File rename/delete**: The file path changes
- **Explicit request**: User action or configuration change

Keep cache when:

- **Minor edits**: Adding/modifying within existing structures
- **Incomplete expressions**: Typing in progress
- **Comments/whitespace**: Non-semantic changes

## Benefits

1. **No Server Crashes**: Compiler errors caught and handled gracefully
2. **Continuous Autocomplete**: Even while typing incomplete code
3. **Better UX**: Smooth experience without server restarts
4. **Accurate Type Info**: Use last known good state for type information
5. **Progressive Enhancement**: As code becomes complete, update the cache

## Trade-offs

1. **Stale Information**: If user makes breaking changes, cached info might be outdated
2. **Memory Usage**: Each file stores a compilation result in memory
3. **Complexity**: More logic to maintain and debug

## Future Enhancements

1. **Smart Diff Analysis**: Use AST diffing to identify changed regions more precisely
2. **Partial Recompilation**: Only recompile changed functions/classes
3. **Error Recovery**: Try to parse around errors using error productions
4. **Multi-version Cache**: Keep last N successful compilations for undo scenarios

## Implementation Checklist

- [x] Add compilation cache data structure
- [ ] Wrap VirtualCompiler.run() in try-catch
- [ ] Implement cache lookup on compilation failure
- [ ] Add code similarity detection
- [ ] Update parseRangerCode to use cached results
- [ ] Add logging for cache hits/misses
- [ ] Test with incomplete code scenarios
- [ ] Test with code refactoring scenarios
- [ ] Verify memory usage is acceptable
- [ ] Document cache behavior in user-facing docs

## Testing Scenarios

1. **Scenario: Incomplete autocomplete**

   - Type `class Vec2 { def x 0.0 }` → Compiles ✓
   - Type `def v (new Vec2)` → Compiles ✓
   - Type `v.` → Compilation fails, use cache for Vec2 info ✓

2. **Scenario: Major refactoring**

   - Delete entire class → Cache invalid, return errors ✓
   - Rename class → Cache stale, but graceful degradation ✓

3. **Scenario: Memory management**
   - Open 100 files → Each cached independently ✓
   - Close file → Consider cache eviction policy ✓

---

**Document Version**: 1.0  
**Date**: 2025-12-13  
**Author**: GitHub Copilot + User Collaboration
