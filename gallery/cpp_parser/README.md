# C++ parser (C++17)

A declaration-oriented C++ parser for [`gallery/uast`](../uast/). It is not a
compiler and does not run `clang`.

**License: AGPL-3.0-or-later.**

It tokenises C++17 source (comments, raw strings, preprocessor lines) and
builds a small AST: `#include`, `namespace`, `class` / `struct`, fields,
methods, free functions, and enough expressions that `this->crc.update(data)`
is a Call. Templates are parsed as syntax on the declaration, not instantiated.
C++20 `import` / `export module` lines are skipped. `requires` clauses,
GNU `__attribute__`, `asm volatile`, C-style casts, user-defined string
literals (`"="sv`), alternative tokens (`not` / `and`), `enum struct`,
parenthesized rvalue-ref array params (`T (&&a)[N]`), and C++17
if-init / structured bindings are parsed far enough to keep going. System headers (`#include <vector>`) stay
diagnostics; quoted includes and angle-bracket paths that already exist
in the UAST workspace (`<AK/Array.h>`) resolve.

```bash
npm run uast:cpp
npm run uast:analyze -- gallery/uast/fixtures/cpp
```
