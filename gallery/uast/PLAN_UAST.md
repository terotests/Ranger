# UAST — a language-analysis framework for Ranger

**Status:** research branch, milestone 0 in tree (schema includes child
roles, resolution/confidence, and `FrontendResult` → shared pipeline)
**License:** AGPL-3.0-or-later (this directory is under `gallery/`)
**Related:** [`gallery/codegraph`](../codegraph/README.md),
[`gallery/ts_parser`](../ts_parser/README.md),
[`gallery/js_parser`](../js_parser/README.md),
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

**Do not change `CodeNode`.** An adapter `CodeNode → UAST` is a different
(and much safer) project than “the compiler now uses UAST.”

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

`UastWorkspace` is in the tree now. M0–M4 may still be one file.

---

## 7. A third language, later: Go — then a harder fourth

Ranger + TypeScript + Go is **proof of architecture** (Go is not a JS
AST with flags). It is not yet proof of abstraction.

After Go works, take a deliberately harder language:

| Language | Stresses |
| --- | --- |
| **Python** | not declaration-heavy; dynamic/monkey; decorators; nested scopes; implicit instance |
| **Rust** | traits; associated functions; patterns; expressions-as-control-flow; lifetimes/generics; macros as a boundary |

Do not declare UAST “universal” after Go.

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
        UastRanger.rgr        compiler context → FrontendResult
        UastTypeScript.rgr    TSNode nativeKind → UNode kind
    tests/
        UastTest.rgr          schema, roles, dump, dynamic vs exact
        UastRangerTest.rgr    compatibility + ZipWriter spec
    fixtures/
        zip_writer.ts
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
| **2** | CodeNode → UAST walk | Keep (after M1 on purpose) |
| **3** | TS parser → UAST | Keep |
| **4** | TS scopes / refs | **Shared semantic pipeline becomes mandatory** (not per-frontend resolvers) |
| **5** | imports / exports | **Workspace + two-phase declaration indexing** |
| **6** | calls | **resolution ≠ confidence**; exact only if unique known declaration |
| **7** | TS CodeGraph in the existing explorer | Keep; projector only |
| **8** | TSX | Keep late |
| **9** | Go | Keep. Python or Rust after that, not in this table |

M0 is the fixture path (no compiler). M1 is started (`UastRanger` + golden).

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
- No edits to `compiler/` `CodeNode` or to `CodeGraphBuilder`’s public contract.
- No import of `gallery/ts_parser` into the UAST tests yet.
- No TSX, no Go parser, no pretence of JS call resolution.
- No merge of ComponentEngine’s eval AST into UNode.
- No LSP, incremental parsing, data-flow, SSA, or a full type checker.

The next useful screenshot is the same ZipWriter page, once from Ranger
via `UastRanger` and once from `zip_writer.ts` via a TS adapter, plus
the same dump shape on a Call/MemberAccess node. If those agree, the
concept is proven.
