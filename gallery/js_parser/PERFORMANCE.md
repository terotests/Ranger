# js_parser Performance Benchmarks

Benchmark results comparing JavaScript (Node.js) and C++ versions of the js_parser.

**Date:** December 15, 2025  
**Platform:** Windows 11, WSL2 cross-compilation  
**C++ Compiler:** x86_64-w64-mingw32-g++-posix (MinGW-w64)  
**Node.js:** v20.x

## Test Files

| File                 | Lines | Size  | Description           |
| -------------------- | ----- | ----- | --------------------- |
| `demo.js` (built-in) | 244   | ~6 KB | ES6 features demo     |
| `large_test.js`      | 1,071 | 26 KB | Generated stress test |

## Results

### Small File (244 lines - demo mode)

| Version    | Time                | Notes                         |
| ---------- | ------------------- | ----------------------------- |
| C++ (-O2)  | 29 ms               | Startup overhead minimal      |
| Node.js    | 49 ms               | V8 startup overhead dominates |
| **Winner** | **C++ 1.7x faster** |                               |

### Large File (1,071 lines)

| Version                    | Time   | vs Original                |
| -------------------------- | ------ | -------------------------- |
| C++ Original (-O2)         | 612 ms | baseline                   |
| C++ Optimized (-O3, ASCII) | 74 ms  | **8.3x faster**            |
| Node.js                    | 50 ms  | 12.3x faster than original |

| Comparison               | Result                  |
| ------------------------ | ----------------------- |
| Node.js vs C++ Original  | Node.js **9.2x faster** |
| Node.js vs C++ Optimized | Node.js **1.5x faster** |

## Analysis

### Why C++ Was Slow (Original)

The UTF-8 polyfills (`r_utf8_char_at`, `r_utf8_substr`) scan from the beginning of the string on every character access:

```cpp
// O(n) per character access = O(n²) for lexer
std::string r_utf8_char_at(const std::string& str, int pos) {
    for (q=0, i=0; i < str.length(); i++, q++) {
        if (q == pos) { /* found it */ }
        // skip UTF-8 continuation bytes...
    }
}
```

For a 1,071-line file with ~26,000 characters, the lexer's `peek()` and `advance()` methods were making millions of unnecessary iterations.

### The Optimization

For ASCII-only source code (most JavaScript), we replaced the O(n) polyfills with O(1) direct indexing:

```cpp
// O(1) - direct array access
inline std::string r_utf8_char_at(const std::string& str, int pos) {
    if (pos < 0 || pos >= str.length()) return "";
    return std::string(1, str[pos]);
}

inline std::string r_utf8_substr(const std::string& str, int start, int len) {
    return str.substr(start, len);
}
```

This reduced complexity from **O(n²)** to **O(n)** for the lexer.

### Why Node.js Is Still Faster

1. **JIT Compilation**: V8 optimizes hot paths at runtime
2. **String Interning**: V8 reuses string objects efficiently
3. **Garbage Collection**: Modern GC can outperform `shared_ptr` reference counting
4. **Native Methods**: `String.prototype.charAt()` is highly optimized C++

### Remaining C++ Bottlenecks

- `std::string` comparisons create temporary objects for each `==` check
- `shared_ptr<Token>` overhead on every token creation
- No string interning for repeated values

## Compilation Flags

```bash
# Original
x86_64-w64-mingw32-g++-posix -std=c++17 -static -O2 -I.

# Optimized
x86_64-w64-mingw32-g++-posix -std=c++17 -static -O3 -march=x86-64 -flto -I.
```

Note: Compiler flags alone (`-O3`, `-flto`) provided negligible improvement. The algorithmic fix to the polyfills was essential.

## Future Optimization Opportunities

1. Use `char` instead of `std::string` for single characters
2. Use `std::string_view` to avoid copies
3. Replace `shared_ptr` with raw pointers or `unique_ptr`
4. Pre-allocate token vectors
5. String interning for keywords and operators

## Conclusion

- **Small files**: C++ wins due to Node.js startup overhead
- **Large files**: Node.js wins due to V8's runtime optimizations
- **Key insight**: Algorithmic complexity matters more than compiler flags
