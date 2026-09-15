# UAST — a language-analysis framework for Ranger

**Status:** research branch, milestone 0 in tree
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
language frontends adapt into a small shared syntax vocabulary, a
semantic graph answers the questions CodeGraph actually asks, and the
existing CodeGraph UI stays a *view* of that graph.

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
| Ranger call/type graph | `compiler/` after `RangerFlowParser`; copied by [`CodeGraphBuilder.rgr`](../codegraph/src/CodeGraphBuilder.rgr) | Golden frontend: we already know classes, fields, methods, `isCalling`, `isDirectlyUsingClasses` |
| CodeGraph presentation | [`CodeGraphModel.rgr`](../codegraph/src/CodeGraphModel.rgr) → pages → RangerFlow / WebGL | Unchanged IR. UAST *projects* into it; it does not replace it |
| TypeScript parser | [`gallery/ts_parser`](../ts_parser/), unified `TSNode`, ESTree-ish | Second frontend, after Ranger |
| JavaScript parser | [`gallery/js_parser`](../js_parser/) | Shared lexer/parser substrate for JS/TS |
| ComponentEngine | `gallery/pdf_writer` / game engine TSX interpreter | Proof Ranger can eat real JS — **not** the UAST representation |
| Source positions on JS AST | [`PLAN_JS_PARSER.md`](../../PLAN_JS_PARSER.md) | Span is non-negotiable on every UNode |

Keep these four things distinct. If they collapse into one
`UnifiedCodeNode`, the project spreads:

```text
parser AST   ≠   UAST (syntax)   ≠   CodeModel (meaning)   ≠   CodeGraph (presentation)
     ≠   Ranger CodeNode
     ≠   compiler IR
     ≠   ComponentEngine eval AST
```

**Do not change `CodeNode`.** An adapter `CodeNode → UAST` is a different
(and much safer) project than “the compiler now uses UAST.”

---

## 2. Four layers

```text
source code
    ↓
language frontend          (Ranger compiler, ts_parser, later Go, …)
    ↓
native AST / CST           (CodeNode, TSNode, …)
    ↓
normalizer / adapter
    ↓
Unified AST                syntax; deliberately a bit dumb
    ↓
semantic indexer
    ↓
Unified Code Model         symbols, refs, relations, confidence
    ↓
CodeGraph UI               one view of the CodeModel
```

Worked examples:

```text
TypeScript
    ↓  gallery/ts_parser  (and/or ComponentEngine parser, as a source of trees)
    ↓  TSNode / ESTree-ish
    ↓  TS → UAST adapter

Ranger
    ↓  VirtualCompiler + RangerFlowParser
    ↓  CodeNode + RangerAppClassDesc / FunctionDesc
    ↓  Ranger → UAST adapter

Go (later, as the “is this accidentally a JS AST?” test)
    ↓  Go parser
    ↓  Go → UAST adapter
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

Those are semantic-graph questions. SCIP makes the same split: source
ranges get symbols, definition/reference roles, and relations — not one
AST that tries to be all of code intelligence. Semgrep’s Generic AST is
the syntax analogue: language parsers normalize into a small shared
model, then analyses run on that (or on a further IR). Tree-sitter’s
whole design is a syntax tree that keeps source ranges, which is why
hover/jump and incremental reparse fall out of the same index.

---

## 3. Unified AST is intentionally a bit dumb

Do not build CodeNode 2.0 that knows everything. First version:

```text
UNode
  id
  kind
  language
  span
  nativeKind
  children
  flags
  origin
  name            (convenience; empty when the node has no name)
```

`kind` is a small shared vocabulary, on the order of **20–30** kinds,
not hundreds:

```text
Module

ClassDecl  InterfaceDecl  EnumDecl  TypeDecl
FunctionDecl  MethodDecl  FieldDecl  VariableDecl  Parameter

Block  If  Switch  For  While  Try  Return  Throw

Call  MemberAccess  IndexAccess  Assign
BinaryOp  UnaryOp  Lambda  New  Identifier  Literal

TypeRef  FunctionType  UnionType  GenericType

Import  Export

Unknown  LanguageSpecific
```

The first temptation is hundreds of node types. Avoid it.

TypeScript

```ts
type X<T extends Foo> =
    T extends Bar ? A<T> : B<T>
```

does **not** need an elegant universal encoding in v1. This is enough:

```text
TypeDecl
  name X
  typeParameters [...]
  value
    LanguageSpecific
      language = typescript
      nativeKind = ConditionalType
```

**The escape hatch is load-bearing.** Without it, UAST becomes

```text
UniversalAST = TypeScriptAST + PythonAST + RustAST + JavaAST + C++AST + …
```

and the abstraction is gone.

Always keep the native node’s identity:

```text
UNode {
    kind: FunctionDecl
    language: "typescript"
    nativeKind: "FunctionDeclaration"
    span: zip.ts:73:3 .. 73:40
    origin:  <frontend-specific, e.g. a TSNode index or CodeNode sp/ep>
}
```

UAST does not have to be lossless. If a later analysis needs a
TypeScript-only fact, the original node is still findable.

### Spans are non-negotiable

```text
SourceSpan {
    fileId
    startByte  endByte
    startLine  startColumn
    endLine    endColumn
}
```

Not just for error messages. Clicking `ZipWriter.addFile()` in CodeGraph
must jump to `zip_tool.rgr:218` or `zip.ts:73`. Hover, rename, find
references, show callers, and show source all ride the same index.

Ranger already has this on `CodeNode` (`sp`, `ep`, `row`, `col`,
`getFilename()`). JS/TS parser nodes already carry start/end/line/col.
The adapter copies them; it does not invent a second coordinate system.

### Typed core, extensible edge — later

Ranger shapes ([`PLAN_SHAPES.md`](../../PLAN_SHAPES.md)) are a good
*later* encoding for closed families:

```text
shape UExpr ( IdentifierExpr LiteralExpr CallExpr … UnknownExpr )
shape UDecl ( … )
shape UStmt ( … )
shape UType ( … )
```

each carrying a shared `NodeInfo { id, span, language, nativeKind }`.

Milestone 0 does **not** use shapes. `TSNode` in `ts_parser` is a single
wide class for the same reason shapes were invented (Ranger has no cheap
open type hierarchy that survives every target). UAST starts the same
way: one `UNode` plus `kind`. Promote to shapes once the vocabulary is
stable and we are tired of stringly `kind` checks.

---

## 4. The semantic model is the valuable part

```text
Symbol
  id  name  kind  language
  declarationNode
  parentSymbol
  type

Reference
  sourceNode
  targetSymbol
  role

Relationship
  from  to  kind  confidence
```

Relationship kinds:

```text
contains  defines  references
calls  constructs
reads  writes
imports  exports
extends  implements  overrides
typeOf  returns  parameterType
usesType
```

Then the current CodeGraph picture is one projection of this data:

```text
ZipWriter
 ├─ fields
 ├─ methods
 ├─ constructs → ZipEntry
 ├─ usesType   → CRC32
 └─ usesType   → GrowableZipBuffer
```

The same index later yields call graph, dependency graph, inheritance
graph, data-flow graph, module graph, type graph — **without changing
the AST model.**

CodeGraph never needs to see UAST. It receives a `CodeModel` (or, today,
a projected `CodeGraph` IR).

### Confidence on every edge

Especially for JavaScript:

```text
exact | inferred | possible | dynamic | unresolved
```

```ts
foo()          // imported statically  →  calls Foo.foo   confidence = exact
obj[name]()    // computed callee      →  calls ?         confidence = dynamic
```

Do not pretend every JS call resolves. That is exactly where Ranger
(static, compiler-resolved) and JavaScript (dynamic) diverge. Showing
the uncertainty in the UI is more honest than a graph that claims to
know everything.

---

## 5. Start from Ranger, not TypeScript

This sounds backwards. It is the safe bootstrap.

There is already a Ranger CodeGraph. First pipeline:

```text
CodeNode / compiler context
        ↓
      UAST                 (optional in M0; spans + decls)
        ↓
 semantic CodeModel
        ↓
 projected CodeGraph
```

**Golden test:** the new pipeline produces, from a Ranger program,
practically the same CodeGraph the current `CodeGraphBuilder` produces.

Ranger already knows classes, fields, methods, types, inheritance, and
method resolution. There is no need to solve parsing and semantics at
the same time.

When `gallery/zip/ZipWriter.rgr` shows

```text
ZipWriter
    entries : [ZipEntry]
    output  : GrowableZipBuffer
    crc     : CRC32
```

with the right dependency edges, **UAST → semantic graph → visualization
works.** Only then:

```text
TSNode → UAST → CodeModel → CodeGraph
```

and we measure how much of the same picture TypeScript can fill in.

`CodeGraphBuilder` is the reference, not the thing we rewrite in place.
It stays the Ranger-only path. `UastRanger` is the new path. They must
agree on fixtures (`gallery/codegraph/fixtures/calls.rgr`,
`gallery/zip/zip_tool.rgr`).

---

## 6. TypeScript second, and only “80 % CodeGraph”

[`PLAN_TS_PARSER.md`](../../PLAN_TS_PARSER.md) already reports a core
TS parser on a unified `TSNode`, covering interfaces, type aliases,
unions, typed variables, functions, generics, and cross-compilation to
JS / Rust / C++ / Go / Swift. The root README uses `gallery/ts_parser`
as a cross-target test. That is plenty of syntax.

The TS parser does **not** need to be perfect. MVP understands:

```text
imports / exports
class  interface  function  method  field  variable
extends  implements
calls  new  member access
basic TypeRef  generic TypeRef
arrow function
```

That already builds a picture like:

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

```text
symbols:
  class ZipWriter
  field ZipWriter.entries : Array<ZipEntry>
  field ZipWriter.output  : GrowableZipBuffer
  field ZipWriter.crc     : CRC32
  method ZipWriter.addFile(string, Buffer)

edges:
  ZipWriter --usesType--> ZipEntry
  ZipWriter --usesType--> GrowableZipBuffer
  ZipWriter --usesType--> CRC32
  ZipWriter.addFile --calls--> CRC32.update     exact
```

Leave for later: conditional types, declaration merging, overload
resolution, decorators, mapped types, TSX.

### ComponentEngine is not the UAST

ComponentEngine proves Ranger can process real JavaScript (the repo
runs a large JS conformance suite through it, and compiles the engine
to several targets). Its AST is shaped for *execute / lookup / invoke /
closure*. Code intelligence wants *declaration site / source range /
lexical scope / import / resolved symbol / declared type*.

```text
ComponentEngine parser AST ─┐
                            ├→ adapter → UAST
TS parser TSNode ────────────┘
```

If those parser layers merge later, good. Do **not** bind the unified
model to the interpreter’s internal representation.

### TSX is not “just more node types”

JS → TS is a fairly straight extension. TS → TSX is not. `<` starts a
generic or JSX depending on context; plus regex vs division, ASI,
template strings, contextual keywords, optional chaining, nullish
coalescing, decorators, fragments, and the type grammar mixed into the
expression grammar.

**TSX is not a first milestone.** JS/TS source → UAST → symbols →
CodeGraph first.

---

## 7. A third language, later: Go

If the same UAST can describe Ranger, TypeScript, *and Go* without
feeling like “a JS AST with extra flags,” the abstraction is real.
Go is the first deliberately different test, not the second frontend.

---

## 8. What lives in this directory

Milestone 0 layout (what is in the tree now):

```text
gallery/uast/
    PLAN_UAST.md              this file
    README.md
    src/
        UastSource.rgr        SourceFile + SourceSpan
        UastKind.rgr          node / relation / confidence / symbol vocabulary
        UastNode.rgr          UNode
        UastSymbol.rgr        Symbol + Reference
        UastRelation.rgr      Relationship + Diagnostic
        UastModel.rgr         CodeModel  (the thing tools consume)
        UastCodeGraph.rgr     CodeModel → gallery/codegraph CodeGraph
        UastSample.rgr        ZipWriter fixture (no compiler)
        UastRanger.rgr        compiler context → CodeModel
        UastTypeScript.rgr    TSNode nativeKind → UNode kind (no parser import)
    tests/
        UastTest.rgr          schema + ZipWriter fixture + TS mapping
        UastRangerTest.rgr    golden: same CodeGraph as CodeGraphBuilder
    fixtures/
        zip_writer.ts         the “80 % CodeGraph” TypeScript twin
    bin/                      compiled suite output (gitignored)
```

Logical split for later, if the files grow:

```text
uast/          source, node, kind
semantic/      symbol, reference, relation, model
frontends/     ranger_adapter, typescript_adapter, go_adapter
graph/         CodeGraph projector
```

Do not grow a viewer in this directory until the golden Ranger test is
green and a TS adapter produces a recognisable ZipWriter page. The UI
should be a sibling of CodeGraph (same chrome: class rail, UML toggle,
click-to-zoom), reading `CodeModel` instead of walking
`RangerAppWriterContext` itself.

---

## 9. Plugin shape

A language frontend is a small adapter, not a new analysis engine:

```text
fn language : string
fn analyze  : CodeModel   (source, fileName)     ; single file / snippet
fn analyzeContext : CodeModel (nativeContext)    ; compiler / project, when available
```

The frontend:

1. Parses (or reuses an existing parse).
2. Emits UNodes with spans, `language`, `nativeKind`, and `LanguageSpecific` where needed.
3. Indexes symbols and relations. Unresolved edges are still edges, with `confidence`.
4. Returns a `CodeModel`. Diagnostics live on the model, not in thrown errors.

UAST does not compile the program. Ranger’s frontend is allowed to
*ask* the compiler, because that compiler is already here. A TS
frontend is not allowed to require `tsc`.

---

## 10. Milestones

| # | Goal | Done when |
| --- | --- | --- |
| **0** | Schema + ZipWriter fixture + CodeGraph projector | `npm run uast:test` draws the ZipWriter class page from a CodeModel that never saw a parser |
| **1** | Ranger adapter reproduces current CodeGraph | `npm run uast:ranger` agrees with `CodeGraphBuilder` on `calls.rgr` and `zip_tool.rgr` (classes, fields, methods, call/use edges) |
| **2** | CodeNode → UAST walk (syntax, not only decls from descriptors) | Ranger UNodes cover class/method/field/call/identifier with spans; `LanguageSpecific` for the rest |
| **3** | TS parser → UAST adapter | `fixtures/zip_writer.ts` parses and maps to the same symbol picture as the Ranger ZipWriter fixture, modulo `compute` vs `update` |
| **4** | TS scopes, definitions, references | identifiers in that fixture resolve; unresolved ones are marked |
| **5** | TS imports/exports, classes, methods, types | multi-file ZipWriter-shaped corpus |
| **6** | TS call resolution, static only | `this.crc.update(...)` is `exact`; `obj[name]()` is `dynamic` / `unresolved` |
| **7** | TS CodeGraph in the existing explorer | a tab or example picker entry, projected through `UastToCodeGraph` — **no** new layout engine |
| **8** | TSX | JSX/generic disambiguation; fragments; still no claim of a full TS checker |
| **9** | A third language (Go) | same ZipWriter-level class/method/type view from Go source |

Milestone 1 is started in this PR (`UastRanger` + golden suite).
Milestone 0 is the fixture path that does not pull in the compiler, so a
schema mistake does not wait on a 3 MB frontend compile — the same split
CodeGraph already uses (`CodeGraphTest` vs `CodeGraphBuilderTest`).

---

## 11. How to measure success

Not “we support 187 TypeScript node types.”

```text
Real TS corpus:

files parsed              …
top-level declarations    …
symbols indexed           …
references resolved       …
static calls resolved     …
unknown AST nodes         …     (LanguageSpecific / Unknown rate)
```

And on the graph:

```text
addFile()
    calls CRC32.update       exact
    calls foo                inferred
    calls obj[name]          unresolved
```

That is more useful than a system that pretends to know everything.

Ranger golden tests are exact: the projected graph must match
`CodeGraphBuilder` on the named fixtures. TS tests are recall/precision
on a corpus, with an explicit unknown-node budget.

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

So the claim is not “Ranger starts parsing every language.”
It is: **Ranger gets a language-analysis framework.**

That matches what Ranger already is — a language for parsers, compilers,
and generators.

---

## 13. What this PR does *not* do

- No CodeGraph UI changes, no UAST viewer chrome.
- No edits to `compiler/` `CodeNode` or to `CodeGraphBuilder`’s public contract.
- No import of `gallery/ts_parser` into the UAST tests yet (the mapping
  table is standalone so the schema suite stays small).
- No TSX, no Go parser, no pretence of JS call resolution.
- No merge of ComponentEngine’s eval AST into UNode.

The next useful screenshot is the same ZipWriter page, once from Ranger
via `UastRanger` and once from `zip_writer.ts` via a TS adapter. If those
two pictures agree, the concept is proven.
