# TODO: Performance Fixes

## Critical Priority

- [x] **Fix document cache memory leak** - Clear `documentCache` entries when documents are closed
- [x] **Fix compilation cache memory leak** - Add LRU eviction policy and clear on document close
- [x] **Add debouncing to validation** - Prevent full re-parse on every keystroke (300ms delay)

## Medium Priority

- [x] **Cache Lang.clj content** - Avoid reading from disk on every parse
- [x] **Add conditional logging** - Only log when RANGER_DEBUG=true
- [ ] **Convert to async file I/O** - Use `fs.promises` instead of `fs.readFileSync`

## Low Priority

- [ ] **Add AST traversal depth limit** - Prevent stack overflow on malformed ASTs
- [ ] **Cache regex patterns** - Avoid recompiling regexes in `inferTypeFromNode`
- [ ] **Add performance monitoring** - Optional memory/timing logging for diagnostics

## Completed

- [x] Initial performance review (see PERFORMANCE_REVIEW.md)
- [x] Debouncing (300ms) for document validation
- [x] LRU cache with max 10 entries for compilation cache
- [x] Cache cleanup on document close (documentCache, compilationCache, pendingValidations)
- [x] Lang.clj and standard library content caching
- [x] Conditional debug logging (set RANGER_DEBUG=true to enable)
