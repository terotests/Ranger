# Licensing

This repository uses two licenses.

| Path | License | SPDX |
| --- | --- | --- |
| Everything outside `gallery/` | MIT, unless a file says otherwise | `MIT` |
| Everything under `gallery/` | GNU Affero General Public License v3.0 or later, unless a file says otherwise | `AGPL-3.0-or-later` |

The root [`LICENSE`](LICENSE) file is the overview, not a single license
text. GitHub may not show a single license badge; that is intentional.

| File | Role |
| --- | --- |
| [`LICENSE`](LICENSE) | Mixed-license overview |
| [`LICENSE-MIT`](LICENSE-MIT) | Full MIT text |
| [`LICENSE-AGPL-3.0`](LICENSE-AGPL-3.0) | Full GNU AGPLv3 text |
| [`gallery/LICENSE`](gallery/LICENSE) | Gallery notice (AGPL-3.0-or-later) |

```text
                    RANGER
                      │
        ┌─────────────┴──────────────┐
        │                            │
     PLATFORM                    APPLICATION IP
        │                            │
       MIT                          AGPL
        │                            │
  compiler                       EVG
  runtime                        Office
  std primitives                DataGrid
  parser basics                 PDF / layout
  generic utilities             advanced editors
  examples/
```

## Why the split exists

**Ranger the language is MIT.** You can download the compiler, write
`proprietary_program.rgr`, compile it, and sell the result without opening
that program. Compiling with Ranger does not put the AGPL on your source, any
more than compiling with GCC or Clang does.

**Ranger Gallery technologies are AGPL.** `gallery/` is not a folder of Hello
World samples. It is the application stack built in Ranger: the EVG rendering
engine, display lists, text and layout, DataGrid / XLSX, DOCX, PPTX, PDF,
editors, and the other large programs. Taking `gallery/evg` (or Office, or
DataGrid) and building a product on it is using that application framework,
not merely using the programming language.

The competitive work is the whole stack, not only the Office-format parsers.
EVG is therefore AGPL with the rest of `gallery/`, not MIT with the compiler.

A later commercial license for EVG or an Office engine is possible because
those trees are not already given away under MIT.

## What you can do

These cases stay under MIT:

```text
Ranger compiler
      ↓
compile your own program
      ↓
ship a proprietary product
```

```text
Ranger compiler
+ your own renderer
+ your own application
```

This case is AGPL (or a separate commercial license, if one is offered):

```text
gallery/evg
+ your application built on EVG
```

The same rule applies to DataGrid, the Office readers and editors, the PDF
and layout tools, and the other gallery programs.

## Dependency direction

AGPL code may use MIT code. MIT code must not depend on AGPL code.

```text
compiler/           MIT
lib/                MIT
examples/           MIT
        ↑
        │ imports
        │
gallery/evg/        AGPL
gallery/datagrid/   AGPL
gallery/pptx/       AGPL
gallery/docx_viewer/ AGPL
```

`gallery/` may import `lib/` and `compiler/`. `lib/` and `compiler/` never
import `gallery/`.

Generic building blocks stay on the MIT side even when gallery programs use
them. Examples: math helpers, XML, JSON, image decoders, and other files
under `lib/`. They are language infrastructure. EVG and the editors are
application innovation.

## Third-party material

A few trees under `gallery/` keep the license of their authors. Those files
are not re-licensed by the gallery AGPL. Each such tree has its own license
file:

| Location | License |
| --- | --- |
| `gallery/pdf_writer/assets/fonts/Noto_Sans/` | Apache-2.0 |
| `gallery/pdf_writer/assets/fonts/Open_Sans/` | Apache-2.0 |
| `gallery/pdf_writer/assets/fonts/Droid_Serif/` | Apache-2.0 |
| `gallery/pdf_writer/assets/fonts/Noto_Emoji/` | SIL OFL-1.1 |
| `gallery/datagrid/src/xlsx/vendor/ooxml-encryption/` | MIT (third party) |
| `gallery/datagrid/src/xlsx/vendor/office-crypto.LICENSE` | MIT (third party) |
| `gallery/vela/VEGA_LICENSE` | BSD-3-Clause (Vega project; Vela itself is AGPL) |
| `gallery/game_engine/v2/interp/bench/zoo_octane/` | BSD-style (V8 / Octane) |

## SPDX headers

Ranger sources carry an SPDX identifier on the first line so the license
travels with a copied file:

```text
; SPDX-License-Identifier: MIT
; SPDX-License-Identifier: AGPL-3.0-or-later
```

A file without a header still follows the path rule above. The identifier
is `AGPL-3.0-or-later` (later GNU AGPL versions are allowed), not
`AGPL-3.0-only`.

## npm package

The published `ranger-compiler` package is the compiler only (`dist/`,
`LICENSE`, `LICENSE-MIT`, the package README). Its license field is MIT.

## Earlier snapshots

Copies of this repository published before this split remain under the
license those copies stated. From this tree forward, `gallery/` is
AGPL-3.0-or-later unless a file says otherwise.
