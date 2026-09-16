# UAST — a language-analysis framework for Ranger

**Status:** research branch, M9 started (C++17 frontend + TSX + TS fromDir +
projector CLI + shared call resolution + workspace imports + Ranger/TS
ZipWriter)
**License:** AGPL-3.0-or-later (this directory is under `gallery/`)
**Related:** [`gallery/codegraph`](../codegraph/README.md),
[`gallery/ts_parser`](../ts_parser/README.md),
[`gallery/js_parser`](../js_parser/README.md),
[`gallery/cpp_parser`](../cpp_parser/README.md),
[`PLAN_TS_PARSER.md`](../../PLAN_TS_PARSER.md),
[`PLAN_JS_PARSER.md`](../../PLAN_JS_PARSER.md)

Ranger already compiles *out* to many languages. UAST is the mirror image:
many languages *in*, one analysis model, then CodeGraph and other tools.

```text
       many input languages
               ↓
          Ranger UAST          syntax
               ↓
     shared semantic pipeline
               ↓
        semantic CodeModel     meaning
          ↙          ↘
    CodeGraph       analyses, queries, hover, find-refs

--------------------------------

         Ranger source
               ↓
        Ranger compiler
               ↓
       many output languages
```

This is **not** “Ranger parses every language into one perfect AST.”
That would be a bad goal. This **is** a language-analysis framework:
language frontends emit a small UAST plus hints; a **shared** semantic
pipeline builds the CodeModel; CodeGraph stays a *view*.

The largest risk is not parsers. It is **abstraction boundaries leaking**:
each frontend growing into its own semantic engine. Keep these layers hard.

---

## 1. The decision that keeps the project small

> **Do not build a universal parser. Build a universal analysis model
> that language-specific parsers adapt into.**

A full “Ranger understands every language’s AST and every call edge”
project is huge. **Ranger + JS/TS → shared analysis model → CodeGraph**
is a realistic next research branch, and the repository already has most
of the pieces:

| Piece | Where it lives | What UAST uses it for |
| --- | --- | --- |
| Ranger call/type graph | `compiler/` after `RangerFlowParser`; copied by [`CodeGraphBuilder.rgr`](../codegraph/src/CodeGraphBuilder.rgr) | Strong `compilerResolved` hints. Reference implementation, **not** the semantic spec |
| CodeGraph presentation | [`CodeGraphModel.rgr`](../codegraph/src/CodeGraphModel.rgr) → pages → RangerFlow / WebGL | Unchanged IR. UAST *projects* into it; it does not replace it |
| TypeScript parser | [`gallery/ts_parser`](../ts_parser/), unified `TSNode`, ESTree-ish | Second frontend, after Ranger |
| JavaScript parser | [`gallery/js_parser`](../js_parser/) | Shared lexer/parser substrate for JS/TS |
| ComponentEngine | `gallery/pdf_writer` / game engine TSX interpreter | Proof Ranger can eat real JS — **not** the UAST representation |
| Source positions on JS AST | [`PLAN_JS_PARSER.md`](../../PLAN_JS_PARSER.md) | Span is non-negotiable on every UNode |

Keep these distinct. If they collapse into one `UnifiedCodeNode`, the
project spreads:

```text
native AST   ≠   UAST (syntax)   ≠   CodeModel (meaning)   ≠   CodeGraph (presentation)
     ≠   Ranger CodeNode
     ≠   compiler IR
     ≠   ComponentEngine eval AST
```

**Do not change `CodeNode`’s shape or `CodeGraphBuilder`’s public
contract.** An adapter `CodeNode → UAST` is a different (and much
safer) project than “the compiler now uses UAST.” The one parser
edit this work allows is *where* a `;` comment is stored: leading
comments in a block attach to the **next** statement (the property
or method they document), not to the block. AST `children` stay as
they were.

**Comments and documentation are first-class.** A language-analysis
framework that cannot say what a field *means* is only half useful.
Ranger `;` comments immediately above a `def` / `fn` are that
field’s documentation overview (see `SheetView.sortHeadRows` /
`sortKind` in `fixtures/sheet_view.rgr`). `doc { }` remains the
public API tail (`PLAN_API_DOCS.md`); `;` comments document the
implementation. UAST copies the leading-comment text onto the
UNode and the CodeModel symbol as a multiline string. CodeGraph
does not have to display it yet — the builder and UI contracts
stay unchanged.

**Import firewall:** `UastModel.rgr`, `UastSemantic.rgr`, `UastCodeGraph.rgr`
and the UAST/schema files must not import any Ranger compiler type.
`UastRanger.rgr` is the only frontend allowed to.

---

## 2. Layers — frontend does not own CodeModel

```text
source code
    ↓
language frontend          parse / adapt only
    ↓
native AST / CST
    ↓
FrontendResult
    ├─ UAST
    ├─ diagnostics
    └─ semanticHints
    ↓
Shared Semantic Pipeline
    1. declaration indexing
    2. scopes                 (M4)
    3. references             (M4)
    4. type links
    5. call resolution        (M6)
    6. relations
    ↓
CodeModel
    ↓
CodeGraph UI
```

If `analyze()` returns a CodeModel from the frontend, you eventually get:

```text
Ranger frontend  → Ranger-specific semantic engine → CodeModel
TS frontend      → TS-specific semantic engine     → CodeModel
Go frontend      → Go-specific semantic engine     → CodeModel
```

and UAST is a passthrough. So the plugin API is:

```text
frontend.parse(source) → FrontendResult
workspace.add(result)
semantic.indexDeclarations(workspace)
semantic.resolve(workspace)            ; M4+
```

M0–M3 may run one file through `UastSemantic.fromResult`. The types already
include `UastWorkspace`. M5 is when multi-file becomes mandatory.

### Semantic hints

Ranger can give very strong hints because the compiler already knows.
TypeScript gives weaker ones. The pipeline still writes the CodeModel.

```text
SemanticHint
    nodeId
    kind          ; calls, usesType, extends, implements, constructs, …
    target        ; node id, symbol id, or name
    resolution
    confidence
    source
```

```text
source = compilerResolved | frontendInferred | sharedResolver
```

### Worked frontends

```text
TypeScript  →  ts_parser TSNode  →  TS adapter  →  FrontendResult
Ranger      →  VirtualCompiler   →  UastRanger  →  FrontendResult
C++17       →  cpp_parser        →  UastCpp     →  FrontendResult
Go later    →  Go parser         →  Go adapter  →  FrontendResult
```

CodeGraph should **not** sit directly on the AST.

| AST answers | CodeGraph / CodeModel answers |
| --- | --- |
| How is this file built? | What is this symbol? |
| | Who calls this? |
| | What does this class use? |
| | Where did this method come from? |
| | What implements this interface? |
| | Where is this variable read or written? |

---

## 3. Unified AST is intentionally a bit dumb

Do not build CodeNode 2.0 that knows everything.

```text
UNode
  id
  kind
  language
  span
  nativeKind
  flags
  origin          ; UastOrigin, not a raw pointer
  name
  children        ; [UChild { role, nodeId }]
```

`kind` is **20–30** shared kinds, not hundreds. The first temptation is
to add `ConditionalType`, `MappedType`, `InferType` when TS is hard.
**Do not.** Add a common kind only when **at least two frontends** need
the same concept **and** shared analysis benefits. Parser-only syntax
stays `LanguageSpecific`.

### Child roles (M0 — painful to retrofit)

A bare `children : [UNode]` invents silent conventions (`children[0]` is
the name, `[1]` the type). Frontends will disagree. Children are edges:

```text
UChild { role, nodeId }
```

Small role vocabulary:

```text
name  body  type  value  initializer
receiver  member  callee  argument
condition  then  else
parameter  typeParameter
left  right  element
field  method  returnType
```

So:

```text
Call
  child(callee)    → MemberAccess
  child(argument)  → Identifier

MemberAccess
  child(receiver)  → MemberAccess | Identifier
  child(member)    → Identifier

FieldDecl
  child(type)      → TypeRef

MethodDecl
  child(parameter) → Parameter
  child(returnType)→ TypeRef
  child(body)      → Block
```

Small node vocabulary, rich structure.

### `LanguageSpecific` vs `Unknown`

These are not the same, and the metrics must not lump them.

| Kind | Means |
| --- | --- |
| `LanguageSpecific` | Frontend **understands** the construct; UAST will not normalize it. Example: TS `T extends Foo ? A : B` with `nativeKind = ConditionalType`. |
| `Unknown` | Frontend did **not** understand the construct (parse recovery, unimplemented grammar). |

```text
normalized coverage        91 %
language-specific known     8 %
unknown                     1 %
```

is a different story than `unknown = 9 %`.

### Origin is versioned, never a raw pointer

```text
UastOrigin {
    frontend
    artifactId
    nativeNodeId
    sourceVersion
}
```

`UNode.id` is stable **inside one source version**. After a reparse,
`origin.nativeNodeId` as a TSNode index is meaningless. CodeModel must
not treat origin as a durable identity. Bytes + file version are the
identity.

### Spans: bytes are canonical

```text
SourceSpan {
    fileId
    startByte  endByte          ; canonical identity, UTF-8
    startLine startColumn
    endLine   endColumn         ; display only
    coordinateEncoding          ; display convention for columns
}
```

Column can mean byte offset, Unicode code point, or UTF-16 code unit.
LSP/TypeScript use UTF-16. Until a frontend needs otherwise, display
columns are `utf16-code-units`. Adapters **copy** parser coordinates;
they do not invent a second system.

Ranger `CodeNode` has `sp`/`ep`/`row`/`col`/`getFilename()`. JS/TS nodes
have start/end/line/col. Copy them.

### SourceFile version

```text
SourceFile { id, path, language, contentHash, version }
```

Hover, find-refs, rename, and editor integration need to know which
parse a node id belongs to.

### Typed core, extensible edge — later

Ranger shapes ([`PLAN_SHAPES.md`](../../PLAN_SHAPES.md)) are a good
*later* encoding. Milestone 0 uses one `UNode` plus `kind`, same reason
`TSNode` is one wide class. Promote to shapes once the vocabulary is
stable.

---

## 4. The semantic model is the valuable part

**Invariant**

| Thing | Edge |
| --- | --- |
| **Reference** | syntax node → symbol (`identifier ──ref──► CRC32`) |
| **Relationship** | semantic entity → semantic entity (`ZipWriter.addFile ──calls──► CRC32.compute`) |

`Relationship.defines` and `Relationship.references` are not used.
Find-references walks `Reference`. Call graphs walk `Relationship`.

```text
UNode Identifier "CRC32"
        ↓ Reference
Symbol CRC32

Symbol ZipWriter.crc
        ↓ usesType
Symbol CRC32
```

Relationship kinds (entity → entity):

```text
contains
calls  constructs
reads  writes
imports  exports
extends  implements  overrides
typeOf  returns  parameterType
usesType
```

Then the current CodeGraph picture is one projection:

```text
ZipWriter
 ├─ fields
 ├─ methods
 ├─ constructs → ZipEntry
 ├─ usesType   → CRC32
 └─ usesType   → GrowableZipBuffer
```

The same index later yields call / dependency / inheritance / data-flow /
module / type graphs **without changing the AST model.**

CodeGraph never sees UAST. It receives a `CodeModel`.

### Resolution and confidence are different axes

Do not mix “how sure” with “what happened”:

```text
resolution:   resolved | partiallyResolved | dynamic | unresolved
confidence:   exact | inferred | possible
```

```text
obj.foo()
    target = A.foo | B.foo
    resolution = partiallyResolved
    confidence = inferred

obj[name]()
    target = ?
    resolution = dynamic
    confidence = possible

this.crc.update()   ; unique declared CRC32.update
    resolution = resolved
    confidence = exact
```

**Exact only when one unique declaration follows from facts UAST/CodeModel
actually knows. Never upgrade a guess to exact.** Unions, `T extends CRC32`,
structural `{ update(...) }`, and overrides are not exact.

The pipeline enforces that: a `frontendInferred` hint with `confidence =
exact` is lowered unless `source = compilerResolved`.

---

## 5. Start from Ranger, not TypeScript

There is already a Ranger CodeGraph. First pipeline:

```text
compiler context
        ↓
 FrontendResult (UAST decls + compilerResolved hints)
        ↓
 shared semantic pipeline
        ↓
 CodeModel → projected CodeGraph
```

Ranger already knows classes, fields, methods, types, inheritance, and
method resolution. There is no need to solve parsing and semantics at
the same time.

`UastRanger` must not write Ranger-only structure into CodeModel that TS
cannot reproduce. It emits UNodes and hints; `UastSemantic` indexes.

Two tests, not one:

| Test | Role |
| --- | --- |
| **Compatibility** | projected graph == `CodeGraphBuilder` on `calls.rgr` / `zip_tool.rgr`. Builder is a **reference implementation**. |
| **Semantic expectation** | ZipWriter has `entries : [ZipEntry]`, `output : GrowableZipBuffer`, `crc : CRC32`, regardless of whether the old builder is perfect. |

Otherwise a builder bug becomes the new spec.

M0 → M1 → M2 order (schema, then known semantics, then syntax walk)
de-risks layers one at a time. M2 is *not* a prerequisite of M1.

---

## 6. TypeScript second, and only “80 % CodeGraph”

[`PLAN_TS_PARSER.md`](../../PLAN_TS_PARSER.md) already reports a core
TS parser on unified `TSNode`. MVP understands:

```text
imports / exports
class  interface  function  method  field  variable
extends  implements
calls  new  member access
basic TypeRef  generic TypeRef
arrow function
```

```ts
class ZipWriter {
    entries: ZipEntry[]
    output: GrowableZipBuffer
    crc: CRC32
    addFile(name: string, data: Buffer) {
        this.crc.update(data)
    }
}
```

should produce the same class/field/usesType picture as Ranger (modulo
`compute` vs `update`). `this.crc.update` may be `exact` only when both
classes are unique declarations the model actually has.

Leave for later: conditional types, declaration merging, overload
resolution, decorators, mapped types, TSX.

### ComponentEngine is not the UAST

Its AST is shaped for execute / lookup / invoke. Code intelligence wants
declaration site / span / scope / import / resolved symbol / declared type.

```text
ComponentEngine parser AST ─┐
                            ├→ adapter → FrontendResult
TS parser TSNode ────────────┘
```

Do **not** bind UAST to the interpreter IR.

### TSX is not “just more node types”

JS → TS is a fairly straight extension. TS → TSX is not (`<` generic vs
JSX, regex vs division, ASI, templates, …). **TSX is not a first
milestone.**

### Multi-file (M5)

```ts
// a.ts
export class Foo { hello() {} }
// b.ts
import { Foo } from "./a"
const x = new Foo()
x.hello()
```

`b.ts` cannot resolve until `a.ts` exports are indexed. API:

```text
parse files → FrontendResult per file
    ↓
index declarations from all files
    ↓
resolve modules
    ↓
resolve references
    ↓
resolve calls
```

`UastWorkspace` is in the tree now. M5 indexes every file first, then
resolves `Import` specifiers against workspace paths. The TypeScript
frontend may first load on-disk package `.d.ts` files for a bare
specifier (`node_modules/<pkg>`, `package.json` `types`/`typings`,
`@types/<pkg>`) and add those files to the workspace. Application
`fromDir` still skips `node_modules` as source. A missing module is a
diagnostic; analysis of the other files continues. There is no
`ranger install` and no package manager.

A related, later problem is not TypeScript modules but **Ranger apps that
do not ship their gallery sources** (bare `Import "WindowCtl.rgr"`, a
checked-in EVG `.mjs`, no submodule). That is §14. It is not a package
manager task for this branch.

---

## 7. A harder third language: C++17 — then Go / Python / Rust

Ranger + TypeScript + C++ is **proof of architecture** (C++ is not a JS
AST with flags). It is not yet proof of abstraction. The C++ frontend
targets **C++17 or newer**: classes, namespaces, quoted includes, and
`this->` calls. It does not run `clang`, instantiate templates, or
walk system headers.

After that, other languages still stress different axes:

| Language | Stresses |
| --- | --- |
| **Go** | packages; methods on named types; interfaces without inheritance |
| **Python** | not declaration-heavy; dynamic/monkey; decorators; nested scopes |
| **Rust** | traits; associated functions; patterns; lifetimes/generics; macros |

Do not declare UAST “universal” after C++.

---

## 8. What lives in this directory

```text
gallery/uast/
    PLAN_UAST.md
    README.md
    src/
        UastSource.rgr        SourceFile + SourceSpan + Origin
        UastKind.rgr          kinds, child roles, resolution, confidence
        UastNode.rgr          UNode + UChild
        UastSymbol.rgr        Symbol + Reference
        UastRelation.rgr      Relationship + Diagnostic
        UastFrontend.rgr      FrontendResult, SemanticHint, Workspace
        UastSemantic.rgr      shared pipeline (no compiler import)
        UastModel.rgr         CodeModel
        UastCodeGraph.rgr     CodeModel → CodeGraph (no compiler import)
        UastDump.rgr          the Ranger/TS debug dump
        UastSample.rgr        ZipWriter FrontendResult fixture
        UastQuery.rgr        class/method/field lookup, callee names, refTarget
        UastRanger.rgr        compiler context → FrontendResult
        UastTypeScript.rgr    TSNode nativeKind → UNode kind
        UastTs.rgr            ts_parser → FrontendResult
        UastCpp.rgr           cpp_parser → FrontendResult
    tests/
        UastTest.rgr          schema, roles, dump, dynamic vs exact
        UastRangerTest.rgr    compatibility + ZipWriter spec + comments
        UastTsTest.rgr        zip_writer.ts via ts_parser
        UastCppTest.rgr       zip_writer.hpp via cpp_parser
    fixtures/
        zip_writer.ts
        cpp/zip_writer.hpp    C++17 ZipWriter twin (`this->crc.update`)
        cpp/shapes.hpp        inheritance, enum class, namespace
        cpp/helper.hpp        quoted include target
        cpp/user.cpp          #include "helper.hpp" vs <vector>
        cpp/templates.hpp     HasContainerTraits<T>::value, if constexpr
        foo_a.ts / foo_b.ts   export Foo + import { Foo } / unresolved ./nope
        sheet_view.rgr        leading comments on the right property
```

Do not grow a viewer here until Ranger and TypeScript agree on ZipWriter.
The UI should be CodeGraph chrome over `CodeModel`.

Not in scope (scope creep): LSP, incremental parse, data-flow, SSA, a
full type checker.

---

## 9. Plugin shape

```text
fn language : string
fn parse    : FrontendResult   (source, fileName)
```

The frontend:

1. Parses (or reuses an existing parse).
2. Emits UNodes with spans, child **roles**, `language`, `nativeKind`.
3. Emits `semanticHints` (Ranger: `compilerResolved`; TS: weaker).
4. Returns `FrontendResult`. Diagnostics live there, not thrown.

UAST does not compile the program. Ranger may *ask* the compiler. A TS
frontend is not allowed to require `tsc`.

---

## 10. Milestones

| # | Goal | Change from the first draft |
| --- | --- | --- |
| **0** | Schema + ZipWriter fixture + projector | **Child roles, SourceFile version, origin, resolution/confidence, FrontendResult pipeline** |
| **1** | Ranger → FrontendResult → CodeModel | Keep. Two tests (compatibility + ZipWriter spec). Do not write compiler types into CodeModel. |
| **2** | CodeNode → UAST walk + comments on the next member | Leading `;` comments attach to the following property/method; UAST copies them. Do not change CodeGraphBuilder. |
| **3** | TS parser → UAST | `UastTs` walks `TSNode`; `uast:ts` on `zip_writer.ts`. No `tsc`. |
| **4** | TS scopes / refs | **Shared semantic pipeline becomes mandatory** (not per-frontend resolvers) |
| **5** | imports / exports | **Workspace + two-phase declaration indexing** |
| **6** | calls | **resolution ≠ confidence**; exact only if unique known declaration |
| **7** | TS CodeGraph in the existing explorer | Keep; projector only |
| **8** | TSX | Keep late |
| **9** | C++17 | Hard language: not a JS AST. Parser in `gallery/cpp_parser`, adapter `UastCpp`. No clang. Go / Python / Rust after that |

M0 is the fixture path (no compiler). M1 is started (`UastRanger` + golden).
M2 walks method bodies (Call / MemberAccess) and treats comments as
part of the node, not as trivia on the enclosing block.
M3 is started: `UastTs` + `npm run uast:ts`. The dump of
`this.crc.update(data)` is the same shape as Ranger’s
`this.crc.compute`, with `confidence: inferred` because the hint
is `frontendInferred`.
M4 is started: `UastSemantic.resolveRefs` indexes `Parameter` symbols
and resolves `this`, parameters, `TypeRef`, and `MemberAccess` on a
typed receiver. Exact when the unique member follows from the model
(enclosing class, not a globally unique method name).
M5 is started: `UastSemantic.fromWorkspace` indexes modules and exports,
then `resolveImports` binds named specifiers to exported symbols. Paths
are resolved only against files already in the workspace (`./foo_a` →
`foo_a.ts`). `import { Z } from "./nope"` and bare `WindowCtl.rgr` become
diagnostics; `class:Foo` is still indexed.
M6 is started: `UastSemantic.resolveCalls` writes `calls` from a Call
whose callee MemberAccess already resolved to a unique method. Exact
when that unique declaration follows from the model (enclosing class +
receiver type), not a globally unique method name. `UastTs` no longer
emits `frontendInferred` call hints. IndexAccess stays `dynamic` /
`possible`. Ranger `compilerResolved` hints still apply.
M7 is started: `UastTs.fromDir` walks a TypeScript tree (skips
`node_modules` / `dist` / `.git`), indexes `FunctionDecl` /
`InterfaceDecl` / `export default` / `extends`, and
`npm run uast:analyze` prints PLAN §11 metrics then projects into the
existing CodeGraph IR. No CodeGraphBuilder or UI change. Tried on
sindresorhus/p-queue in `/tmp` (not vendored): `PQueue` / `PriorityQueue`
classes, type aliases, `.js`→`.ts` workspace imports, exact internal
calls. Missing npm packages stay diagnostics.
M8 is started: `.tsx` files enable `ts_parser` TSX mode. PascalCase
function / `const` arrow / class `render` components are declarations;
`<Card />` lowers to a Call (host tags like `div` stay markup). Shared
`resolveCalls` binds JSX to `function:Card`. The projector draws
PascalCase functions as CodeGraph classes with stereotype `component`.
Tried on emilkowalski/sonner in `/tmp` (not vendored): Loader and
other function components, JSX calls such as getLoadingIcon → Loader.
`'use client'`, typed rest parameters, parenthesized union arrays,
qualified types (`JSX.Element`, `React.ReactNode`), leading `|` unions,
keyword / quoted keys in type literals, member generic calls
(`React.useRef<{ x: number }>(null)`), `n < 0` comparisons, named
function expressions, and `export { type Foo }` parse. Bare `react` /
`react-dom` resolve when a `.d.ts` is on disk (package `types` field,
`index.d.ts`, or `@types`, including `export as namespace`); they stay
diagnostics when it is not.
JSX node types stay `LanguageSpecific` in the mapping — the adapter
does the lowering. No CodeGraphBuilder or UI change.
M9 is started: a C++17 parser (`gallery/cpp_parser`) and `UastCpp`
frontend. Classes / structs, fields, methods, namespaces, `enum class`,
and quoted `#include` walk into the same CodeModel. `this->crc.update(data)`
is a Call whose dump matches the ZipWriter TS/Ranger shape (`method:CRC32.update`,
exact). `<vector>` and other system headers stay diagnostics; there is
no clang and no package manager. Angle-bracket includes resolve when the
path is already in the workspace (`<AK/Array.h>`). `npm run uast:cpp` /
`uast:analyze -- gallery/uast/fixtures/cpp`.
Tried on p-ranav/argparse in `/tmp` (not vendored): `Argument` /
`ArgumentParser`, template structs such as `HasContainerTraits`,
`HasContainerTraits<T>::value`, `if constexpr`, and `>>` as two template
closes. System headers stay diagnostics. Remaining parse noise is a
lambda inside `repr`; analysis continues.
Tried on skift-org/skift (`src/kernel`, not vendored): C++20 `import` /
`export module` skipped, `[[gnu::packed]]`, `asm volatile`, `try$`,
`requires`, GNU `__attribute__`. `Io` / `Vmm` / `Pmm` / `Task` /
`Domain` / `Object`, 64 exact calls (`Io.read → Io.in`, `Task.ret → signal`).
Tried on SerenityOS `AK/` (sparse `/tmp` checkout, not vendored): 243
files, 6404 symbols, 2078 projected methods, `Vector` / `Array` /
`HashMap` / `Optional` / `RefPtr` / `String` / `ByteBuffer`, 581 exact
calls (`Array.from_span → TypedTransfer.copy`). `<AK/...>` includes bind
in-workspace. Remaining parse noise is pack expansions, GNU statement
expressions, and similar; analysis continues.

---

## 11. How to measure success

Not “we support 187 TypeScript node types.”

```text
files parsed
top-level declarations
symbols indexed
references resolved
static calls resolved
normalized coverage
language-specific known
unknown
```

And on the graph:

```text
addFile()
    calls CRC32.update       resolved / exact
    calls foo                resolved / inferred
    calls obj[name]          dynamic / possible
```

### The dump that must work for both languages

After M0–M3, `ZipWriter.rgr` and `zip_writer.ts` should both produce
the class page **and** a dump like:

```text
Node n:call:compute
  kind: Call
  span: gallery/zip/ZipWriter.rgr:36:9-9
  callee: MemberAccess
  argument: Identifier fileData
Resolution:
  method:CRC32.compute
  resolution: resolved
  confidence: exact
```

If that dump concept works for Ranger and TypeScript, this is a
language-analysis framework, not a CodeGraph adapter.

---

## 12. How big is this, really?

| Goal | Difficulty |
| --- | --- |
| TS → shared syntax tree | moderate |
| Ranger + TS into the same UAST | moderate |
| Class/method CodeGraph from TS, ZipWriter-level | moderate |
| Imports/exports + symbol references | moderate–hard |
| Good call graph for TypeScript | hard |
| Good call graph for JavaScript | very hard |
| Perfect universal AST | **bad goal** |
| Multi-language semantic code intelligence | large, and the interesting project |

M0–M3 is a reasonable project. M4–M7 is the real language-tooling work.
M8+ is optional expansion.

The claim is not “Ranger starts parsing every language.”
It is: **Ranger gets a language-analysis framework.**

---

## 13. What this PR does *not* do

- No CodeGraph UI changes, no UAST viewer chrome.
- No change to `CodeNode` fields or to `CodeGraphBuilder`’s public contract.
  The parser may move a `;` comment from the block onto the next sibling;
  it must not add, remove, or reorder `children`.
- No import of `gallery/ts_parser` into `uast:test`. The TS walk lives
  in `uast:ts` (`UastTs.rgr`), the same split as `uast:ranger`.
- No import of `gallery/cpp_parser` into `uast:test`. The C++ walk lives
  in `uast:cpp` (`UastCpp.rgr`).
- No clang, no C++ package manager, no pretence of JS call resolution.
- No merge of ComponentEngine’s eval AST into UNode.
- No LSP, incremental parsing, data-flow, SSA, or a full type checker.

The next useful screenshot is the same ZipWriter page, once from Ranger
via `UastRanger` and once from `zip_writer.ts` via a TS adapter, plus
the same dump shape on a Call/MemberAccess node. If those agree, the
concept is proven.

A documentation overview such as the comments above `SheetView.sortHeadRows`
and `SheetView.sortKind` must appear on **those properties** in UAST,
never on the class.

---

## 14. Apps that import gallery without shipping gallery

Not in scope, and it will keep happening.

A training app (HarjoitusChart, TreeniWeekDemo, `PORT=8788 npm run demo:web`)
fails at compile with:

```text
[FAIL] Could not import file Statechart.rgr
[FAIL] Could not import file WindowCtl.rgr
[FAIL] Could not import file SliderCtl.rgr
```

The `Import` lines are bare names (`"Statechart.rgr"`, `"WindowCtl.rgr"`).
The files live here as:

```text
gallery/statechart/src/Statechart.rgr
gallery/ui/src/WindowCtl.rgr
gallery/ui/src/SliderCtl.rgr
gallery/evg/EVGElement.rgr
…
```

Relative spellings such as `Import "../evg/EVGElement.rgr"` only work when
the source tree has that sibling layout. Bare names only work when those
directories are on `RANGER_LIB`. Ranger has **no package manager** — there
is no `ranger install evg`, no registry, no lockfile. EVG was wired into
that environment locally and never reached the training repo as source,
not even as a submodule.

`npm run demo:web` can still serve because a **precompiled `.mjs` that
already contains EVG** was checked in. The `.rgr` that UAST and CodeGraph
would walk is not there. The compiler, CodeGraphBuilder, and `UastRanger`
all stop at the same `Could not import file` line.

New applications will copy this pattern: ship the JS bundle, omit the
Ranger/EVG/UI sources. Do **not** invent a package system in this PR.

When M5 (workspace / imports) is built:

- an unresolved `Import` is a diagnostic on that file, not a crash of the
  whole analysis
- a library map / VFS (CodeGraph already flattens `Import "../evg/…"` to a
  basename when the file *is* present) can point a bare name at gallery
  **if the sources are actually on disk**
- a repo that only has `.mjs` cannot be analysed as Ranger; say so, and
  analyse the JavaScript if a JS frontend exists

Until then, analyse apps from **this** tree, where `gallery/evg` and
`gallery/ui` are the real files.
