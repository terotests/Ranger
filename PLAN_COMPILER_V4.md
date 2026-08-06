# PLAN: Compiler v4 — shape-based AST

> **Status:** design + scaffolding. Stages **C0–C1** are under `compiler/v4/`
> (shape `AstNode` + Lisp parser). The live product compiler remains **3.3.x**
> in `compiler/ng_*.rgr`.
>
> **Question this plan answers:** can the Ranger compiler be rewritten using
> `shape` / `case` / `group` / `match`, especially to replace the overloaded
> `CodeNode` structure?
>
> **Verdict: yes — and CodeNode is the highest-leverage place to start.**
> Shapes were designed for exactly this kind of fat tagged object
> (`PLAN_SHAPES.md`, `EvalValue` migration). CodeNode is the same pattern at
> compiler scale: one class, an integer/`RangerNodeType` tag, dozens of fields
> that only some nodes use, plus analysis and target scratchpads bolted on.

---

## 1. The CodeNode overload (measured)

| File | Role | Lines |
|---|---|---|
| `compiler/ng_CodeNode.rgr` | parse tree + syntax fields | 843 |
| `compiler/ng_CodeNodeCompilerExtensions.rgr` | typing / flow / descriptor links | 828 |
| Call sites of `CodeNode` under `compiler/` | — | ~2000+ mentions |

One object is simultaneously:

1. **S-expression tree node** — `children`, `expression`, `is_block_node`, atoms
2. **Typed expression** — `eval_type*`, `evalTypeClass`, `paramDesc`, `fnDesc`, `clDesc`
3. **Rewrite scratchpad** — registers, operator match, method chains
4. **Per-target hints** — `rust_needs_preevaluate`, `rust_use_tmpvar`, …

Illegal states are representable: a `Double` node can still carry `fnDesc`,
`children`, and Rust borrow flags. Walkers test flags instead of variants;
forgetting a kind is a silent fall-through, not a compile error.

`CodeNodeLiteral` and `cleanNode()` already admit that syntax and analysis
should diverge — they just never became separate types in the main pipeline.

---

## 2. Why shapes fit

| Fat-class defect | Shape remedy |
|---|---|
| Every field on every node | Each `case` owns only its payload |
| Tag + parallel booleans (`expression`, `hasFnCall`, …) | The case *is* the tag |
| Missed kind in a walker | Exhaustive `match` |
| Value vs reference equality hand-rolled | `@(value)` / `@(reference)` |
| Native targets pay for unused fields | Scalar cases inline on C++/Rust (measured in PLAN_SHAPES) |

Precedent: `gallery/game_engine/v2/interp/migrate/src/EvalValue.rgr` already
split `EvalPayload` into a shape (`None | FnCore | ElemBox`) and cut
`sizeof(EvalValue)` on C++ from 680 → 376 bytes.

---

## 3. Design: split the layers

Do **not** put the whole of today's CodeNode into one mega-shape. Split by
pipeline phase:

```text
Source
  → Parser          →  AstNode          (shape: syntax only)
  → Collect / Walk  →  TypedExpr + Env  (shape + tables; no AST mutation for types)
  → Mid-end         →  MidOp            (optional later)
  → Writers         →  target code
```

### 3.1 `AstNode` — syntax shape (C1)

Closed family of what the Lisp parser can emit. Shared source span via a
`group Located`. No `paramDesc`, no Rust flags, no `eval_type`.

```ranger
shape AstNode {
    group Located {
        def sp:int 0
        def ep:int 0
        def row:int 0
        def col:int 0
    }

    case Integer@(value) does Located { def value:int 0 }
    case Double@(value)  does Located { def value:double 0.0 }
    case String@(value)  does Located { def value:string "" }
    case Boolean@(value) does Located { def value:boolean false }
    case Comment@(value) does Located { def text:string "" }
    case VRef does Located {
        def name:string ""
        def ns:[string]
        def typeName:string ""
        def keyType:string ""
        def arrayType:string ""
        def kind:int 0
    }
    case Expression does Located {
        def children:[AstNode]
        def isBlock:boolean false
    }
}
```

Parent links stay on the **parser stack** (as today), not on every node — weak
back-pointers on shape cases are untested and not required for walkers that
carry context.

### 3.2 Typed / analysis layer (C2+)

Keep symbol tables (`RangerApp*Desc`) as today. Attach results either:

- **A (preferred early):** side map `nodeId → TypedInfo`, AST stays immutable after parse
- **B:** second shape `TypedExpr` produced by a lowering pass (bigger rewrite)

Writers then match on `TypedExpr` / `AstNode` instead of reading 90 fields.

### 3.3 What stays out of v4 initially

- Full FlowParser / LiveCompiler port
- All language writers
- Incremental compile (`INCREMENTAL_PLAN.md`)
- Replacing `ng_Compiler.rgr` as the shipped binary

v4 is a **parallel tree** under `compiler/v4/` until it can parse + type a
useful subset and emit at least one target.

---

## 4. Feasibility risks

| Risk | Mitigation |
|---|---|
| Parser mutates `curr_node.children` | Expression case is `@(reference)` (non-scalar default); mutate the array after narrowing |
| `match` is statement-only | Bind results to locals; helpers return via assigned out-params or small visitor class |
| Shape methods cannot use virtual dispatch | Static `AstNode.asString(n)` ops — already the shape-method pattern |
| Self-host: v4 is written in Ranger 3 | Compile v4 with the current `bin/output.js`; dogfood later |
| Scope explosion (7k-line FlowParser) | Stage gates; v3 remains shipping |
| `@(weak)` on shape fields untested | Avoid parent pointers on nodes; use walk context |
| XML / lambda / expression-type nodes | Add cases when the parser subset needs them |

---

## 5. Stages

### C0 — Plan + probe ✅

- This document
- `compiler/v4/AstNode.rgr`: shape + `asString` / constructors
- Fixture + test: builds AstNodes, exhaustive match, runs on ES6/Python/Go/Rust

### C1 — Shape-based Lisp parser ✅ (started)

- `compiler/v4/Source.rgr`, `Parser.rgr`, `ParseProbe.rgr`
- Parse subset: atoms, lists, blocks, comments, typed vrefs / array / hash types
- Pretty-print tests in `tests/compiler-v4-ast.test.ts`
- Not yet: annotations (`@…`), infix, expression-types, full file Import/class

### C2 — Declarations + collect

- Recognize `class` / `fn` / `sfn` / `Import` / `def` at top level
- Build lightweight `Module` / `ClassInfo` / `FnInfo` tables (plain classes OK)
- Drive from `AstNode` match, not CodeNode flags

### C3 — Expression typing (subset)

- Primitive ops, calls, `return`, `if`, `for`
- Side-table or `TypedExpr` shape
- Error messages with `Located` spans

### C4 — One writer (ES6)

- Emit JS for the typed subset
- Compare output to ng_ compiler on the same fixtures

### C5 — Grow surface + second target

- Operators, lambdas, classes, optionals
- Rust or C++ writer to validate native shape lowering benefits in the compiler itself

### C6 — Bootstrapping decision

- Only when C4/C5 cover enough to compile `compiler/v4/**`
- Then consider replacing ng_ entry points

---

## 6. Directory layout

```text
compiler/v4/
  README.md           # how to build / test the sketch
  AstNode.rgr         # shape AstNode + helpers
  Source.rgr          # SourceFile (C1)
  Parser.rgr          # Lisp parser → AstNode (C1)
  Probe.rgr           # small main used by tests

PLAN_COMPILER_V4.md   # this file (repo root, with other PLAN_*)
tests/fixtures/v4_ast_probe.rgr
tests/compiler-v4-ast.test.ts
```

The product entry `compiler/ng_Compiler.rgr` is untouched.

---

## 7. Success criteria for "shapes can rewrite the compiler"

| Criterion | How we know |
|---|---|
| AstNode shape compiles on ES6 / Python / Go / Rust | `tests/compiler-v4-ast.test.ts` |
| Exhaustive walkers replace flag soup for syntax | `AstNode.asString` / parser use `match` |
| Illegal payloads unrepresentable | no `children` on `Integer`, etc. |
| Parser produces only AstNode cases | C1 fixture round-trips |
| No regression to shipping 3.3.x | ng_ tree unchanged |

A full self-hosting v4 is **not** a success criterion for C0–C1; it is the
C6 decision after a working subset exists.

---

## 8. Relation to other plans

| Plan | Relation |
|---|---|
| `PLAN_SHAPES.md` | Language feature v4 consumes; S0–S5 |
| `PLAN_3.md` | Historical product 3.0; not an AST rewrite |
| `INCREMENTAL_PLAN.md` | Builds on today's CodeNode; v4 should make invalidation easier (immutable AST + side tables) |
| `EvalValue` shape migration | Same pattern; proof that production code can adopt shapes |

---

## 9. Immediate next actions

1. ~~Land C0: plan + AstNode probe + test~~
2. ~~Implement C1 parser emitting AstNode (subset)~~
3. Extend C1: annotations, better block/statement handling, file parse API
4. Start C2: collect `class` / `fn` / `Import` from AstNode trees
5. Keep every stage green under `tests/compiler-v4-ast.test.ts`
