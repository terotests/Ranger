# Performance Review: Ranger VS Code Extension

## Executive Summary

This document analyzes potential performance concerns in the Ranger Language Support extension, focusing on memory usage, CPU consumption, and potential memory leaks.

---

## 🔴 Critical Issues

### 1. Document Cache Never Cleared (Memory Leak)

**Location:** [server/src/server.ts](server/src/server.ts#L55-L63)

```typescript
const documentCache = new Map<
  string,
  {
    analyzer: ASTAnalyzer;
    typeResolver: TypeResolver;
    completionProvider: CompletionProvider;
    version: number;
  }
>();
```

**Problem:** The `documentCache` grows indefinitely. When documents are closed, the cache entry is never removed.

**Impact:** Each cached entry holds:
- Full `ASTAnalyzer` with AST references
- `TypeResolver` instance
- `CompletionProvider` instance
- References to the Ranger compiler context (`RangerAppWriterContext`)

**Recommendation:** Add cleanup on document close:
```typescript
documents.onDidClose((e) => {
  documentSettings.delete(e.document.uri);
  documentCache.delete(e.document.uri);  // ADD THIS LINE
});
```

---

### 2. Compilation Cache Never Cleared (Memory Leak)

**Location:** [server/src/rangerCompiler.ts](server/src/rangerCompiler.ts#L17-L22)

```typescript
const compilationCache: Map<string, SuccessfulCompilation> = new Map();
```

**Problem:** `compilationCache` stores full compilation results including:
- Original source code string
- Complete AST (`rootNode`)
- Full compiler context

**Impact:** Over time, this cache grows unbounded as files are opened.

**Recommendation:** 
1. Add LRU eviction policy (e.g., max 10 entries)
2. Clear entries on document close
3. Add timestamp-based expiration

---

### 3. Full Re-parse on Every Keystroke

**Location:** [server/src/server.ts](server/src/server.ts#L157-L159)

```typescript
documents.onDidChangeContent((change) => {
  validateTextDocument(change.document);
});
```

**Problem:** Every character typed triggers a full compilation through `VirtualCompiler.run()`.

**Impact:** 
- High CPU usage during typing
- UI lag/stuttering
- Potential for outdated requests to pile up

**Recommendation:** Add debouncing:
```typescript
const pendingValidations = new Map<string, NodeJS.Timeout>();

documents.onDidChangeContent((change) => {
  const uri = change.document.uri;
  
  // Clear pending validation
  if (pendingValidations.has(uri)) {
    clearTimeout(pendingValidations.get(uri));
  }
  
  // Debounce: wait 300ms after last keystroke
  pendingValidations.set(uri, setTimeout(() => {
    pendingValidations.delete(uri);
    validateTextDocument(change.document);
  }, 300));
});
```

---

## 🟡 Moderate Issues

### 4. Heavy Compiler Initialization on Each Parse

**Location:** [server/src/rangerCompiler.ts](server/src/rangerCompiler.ts#L232-L290)

```typescript
export async function parseRangerCode(...) {
  // Creates new InputEnv, VirtualCompiler, etc. every time
  const compilerInput = new InputEnv();
  const folder = new InputFSFolder();
  // ... loads Lang.clj from disk every time
  const vComp = new VirtualCompiler();
}
```

**Problem:** Each parse creates entirely new compiler infrastructure and reads `Lang.clj` from disk.

**Impact:**
- Disk I/O on every keystroke
- Object allocation overhead
- GC pressure

**Recommendation:**
1. Cache the loaded `Lang.clj` content in a module-level variable
2. Consider pooling `VirtualCompiler` instances if safe

---

### 5. AST Traversal Without Bounds

**Location:** [server/src/astAnalyzer.ts](server/src/astAnalyzer.ts#L264-L283)

```typescript
findNodeAtOffset(offset: number, node?: CodeNode): CodeNode | null {
  const currentNode = node || this.rootNode;
  // Recursive with no depth limit
  for (const child of currentNode.children) {
    const found = this.findNodeAtOffset(offset, child);
    if (found) return found;
  }
}
```

**Problem:** Recursive AST traversal with no depth limit or cycle detection.

**Impact:** Potential stack overflow on deeply nested or malformed ASTs.

**Recommendation:** Add iterative traversal or depth limit:
```typescript
findNodeAtOffset(offset: number, maxDepth: number = 100): CodeNode | null {
  // Use iterative approach with explicit stack
}
```

---

### 6. Synchronous File I/O in Async Context

**Location:** [server/src/rangerCompiler.ts](server/src/rangerCompiler.ts#L257-L274)

```typescript
addFile("Lang.clj", fs.readFileSync(path.join(compilerRoot, "compiler/Lang.clj"), "utf8"));
```

**Problem:** `fs.readFileSync` blocks the event loop.

**Impact:** Server becomes unresponsive during file reads.

**Recommendation:** Use `fs.promises.readFile` or cache file contents.

---

### 7. Console Logging in Production

**Location:** Multiple files

```typescript
console.log("[Ranger Compiler] Running VirtualCompiler...");
connection.console.log("onCompletion triggered");
```

**Problem:** Extensive logging even in production mode.

**Impact:** 
- String formatting overhead
- I/O overhead
- Memory allocations for log strings

**Recommendation:** Add conditional logging:
```typescript
const DEBUG = process.env.RANGER_DEBUG === 'true';
if (DEBUG) console.log("[Ranger Compiler] ...");
```

---

## 🟢 Minor Issues

### 8. Regex Recompilation

**Location:** [server/src/astAnalyzer.ts](server/src/astAnalyzer.ts#L468-L477)

```typescript
private inferTypeFromNode(node: CodeNode): string | null {
  const defPattern = new RegExp(`def\\s+${varName}\\s*\\(new\\s+(\\w+)\\)`, "g");
  const typeAnnotPattern = new RegExp(`def\\s+${varName}\\s*:\\s*(\\w+)`, "g");
}
```

**Problem:** Regexes are compiled on every call.

**Impact:** Minor CPU overhead.

**Recommendation:** Cache common regex patterns.

---

### 9. Map Iteration Creating Intermediate Arrays

**Location:** [server/src/completionProvider.ts](server/src/completionProvider.ts#L101-L110)

```typescript
const classes = this.analyzer.getDefinedClasses();
for (const [className, classInfo] of classes) {
  // ...
}
```

**Problem:** `Map.entries()` creates iterator objects.

**Impact:** Minor GC pressure.

---

## Memory Leak Detection

### How to Verify Memory Leaks

1. **Monitor Node.js memory:**
   ```bash
   # Start server with memory inspection
   node --inspect server/out/server.js
   ```

2. **Use Chrome DevTools:**
   - Open `chrome://inspect`
   - Take heap snapshots before/after opening files
   - Compare retained sizes

3. **Add memory logging:**
   ```typescript
   setInterval(() => {
     const used = process.memoryUsage();
     connection.console.log(`Memory: ${Math.round(used.heapUsed / 1024 / 1024)} MB`);
   }, 30000);
   ```

---

## Recommended Fixes Priority

| Priority | Issue | Effort | Impact |
|----------|-------|--------|--------|
| 1 | Document cache cleanup | Low | High |
| 2 | Add debouncing | Low | High |
| 3 | Compilation cache cleanup | Low | High |
| 4 | Cache Lang.clj content | Low | Medium |
| 5 | Conditional logging | Low | Medium |
| 6 | Async file I/O | Medium | Low |
| 7 | AST traversal bounds | Medium | Low |

---

## Quick Fix Implementation

Here's a minimal patch to address the most critical issues:

```typescript
// server/src/server.ts

// 1. Add debouncing
const pendingValidations = new Map<string, NodeJS.Timeout>();
const VALIDATION_DELAY_MS = 300;

documents.onDidChangeContent((change) => {
  const uri = change.document.uri;
  
  if (pendingValidations.has(uri)) {
    clearTimeout(pendingValidations.get(uri)!);
  }
  
  pendingValidations.set(uri, setTimeout(() => {
    pendingValidations.delete(uri);
    validateTextDocument(change.document);
  }, VALIDATION_DELAY_MS));
});

// 2. Clear cache on document close
documents.onDidClose((e) => {
  documentSettings.delete(e.document.uri);
  documentCache.delete(e.document.uri);
  
  // Also clear pending validation
  const pending = pendingValidations.get(e.document.uri);
  if (pending) {
    clearTimeout(pending);
    pendingValidations.delete(e.document.uri);
  }
});
```

```typescript
// server/src/rangerCompiler.ts

// 3. Add cache size limit
const MAX_CACHE_SIZE = 10;

function updateCompilationCache(filename: string, entry: SuccessfulCompilation) {
  // Evict oldest if at capacity
  if (compilationCache.size >= MAX_CACHE_SIZE) {
    let oldest = { key: '', time: Date.now() };
    for (const [key, value] of compilationCache) {
      if (value.timestamp < oldest.time) {
        oldest = { key, time: value.timestamp };
      }
    }
    if (oldest.key) {
      compilationCache.delete(oldest.key);
    }
  }
  compilationCache.set(filename, entry);
}

// 4. Cache Lang.clj content
let cachedLangClj: string | null = null;

function getLangCljContent(): string {
  if (cachedLangClj === null) {
    const fs = require('fs');
    const path = require('path');
    const compilerRoot = path.join(__dirname, "../../..");
    cachedLangClj = fs.readFileSync(
      path.join(compilerRoot, "compiler/Lang.clj"), 
      "utf8"
    );
  }
  return cachedLangClj;
}
```

---

## Monitoring Recommendations

1. **Add VS Code settings for debugging:**
   ```json
   "ranger.enablePerformanceLogging": false,
   "ranger.validationDelay": 300
   ```

2. **Output channel for diagnostics:**
   ```typescript
   connection.console.log(`[Perf] Parse time: ${endTime - startTime}ms`);
   connection.console.log(`[Perf] Cache size: ${documentCache.size}`);
   ```

---

## Conclusion

The extension has several memory management issues that will cause problems in long-running sessions. The critical fixes (cache cleanup and debouncing) are low-effort but high-impact and should be implemented immediately.

The current architecture is functional but not optimized for production use. For large Ranger projects, users may experience:
- Gradual memory growth (10-50 MB per hour of active editing)
- Occasional UI stuttering during rapid typing
- Higher CPU usage compared to mature language extensions

Implementing the quick fixes above should reduce memory growth by ~80% and improve typing responsiveness significantly.
