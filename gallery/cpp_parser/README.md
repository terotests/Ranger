# C++ parser (C++17)

A declaration-oriented C++ parser for [`gallery/uast`](../uast/). It is not a
compiler and does not run `clang`.

**License: AGPL-3.0-or-later.**

It tokenises C++17 source (comments, raw strings, preprocessor lines) and
builds a small AST: `#include`, `namespace`, `class` / `struct`, fields,
methods, free functions, and enough expressions that `this->crc.update(data)`
is a Call. Templates are parsed as syntax on the declaration, not instantiated.
System headers (`#include <vector>`) stay diagnostics; quoted includes resolve
against files already in the UAST workspace.

```bash
npm run uast:cpp
npm run uast:analyze -- gallery/uast/fixtures/cpp
```
