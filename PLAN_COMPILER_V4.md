# PLAN: Compiler v4 — shape-based AST

> **Status:** design + scaffolding + **compatibility assessment**. Stages
> **C0–C1** under `compiler/v4/`. Live product compiler remains **3.3.x** in
> `compiler/ng_*.rgr` — **untouched**, so the existing Ranger test set stays
> the gate for shipping code.
>
> **Question:** can we rewrite the AST with shapes, keep original code almost
> unchanged, keep `npm test` green the whole time, and stay invisible to users
> (including macros)?
>
> **Short answer:** shapes *fit* CodeNode, but an **in-place** “just change
> CodeNode to a shape” rewrite is **not** a small, invisible change. Macros,
> plugins, VSCode introspection, and ~90 compiler files mutate fat `CodeNode`
> fields in place. The path that respects “minimal original churn + tests
> always green” is a **parallel v4** (what this tree does), with cutover only
> when G1–G3 pass — not a gradual edit of `ng_CodeNode.rgr` under the host.

---

## 0. First goals (not “all gallery”)

v4 is **not** aimed at compiling every gallery demo next. The first success
bar is three programs that already stress the shipping compiler:

| # | Goal | Entry | ~size | Why first |
|---|---|---|---|---|
| **G1** | **JPEG scaler** | `gallery/pdf_writer/src/tools/jpeg_scaler.rgr` (+ `src/jpeg/*`, `src/core/Buffer.rgr`) | ~6.5k LOC | Real CLI app: classes, `buffer`, loops, optionals, file I/O. Already a known ES6/Go target (`jpegscaler:*`, `JPEG_SCALER_LLVM.md`). |
| **G2** | **TypeScript engine** | `gallery/pdf_writer/src/jsx/ComponentEngine.rgr` + `gallery/ts_parser/*` | ~21k LOC | Interpreter + parser that run `.tsx` / `.as`. Pulls in `EvalValue` (already shape-migrating), AST patching, imports. |
| **G3** | **Self-host the compiler** | First `compiler/v4/**`, then enough of `ng_*` / `VirtualCompiler` to rebuild the host | compiler tree | Dogfood: v4 compiles itself to ES6 (then a second target). Replaces “bootstrap decision” as a vague C6 with a hard acceptance test. |

Later “compile the gallery” is allowed only after G1–G3 are green on at least
one writer (ES6). LLVM/native for jpeg_scaler remains a *stretch* (today’s
LLVM path hangs on decode — see `JPEG_SCALER_LLVM.md`); G1 means **ES6 and/or
Go output that runs the scaler**, matching the supported product paths.

### Milestone order

```text
C0–C1  AstNode + parser          ✅ started
  ↓
C2–C4  collect + type + ES6 writer for a growing subset
  ↓
G1     jpeg_scaler compiles & runs (ES6)     ← first external proof
  ↓
G2     ComponentEngine + ts_parser compile & run a smoke .tsx
  ↓
G3a    v4 compiles compiler/v4/** (self-host sketch)
G3b    v4 compiles enough to emit bin/output.js (or equivalent)
```

JPEG before the TS engine because it is smaller and has almost no
meta-programming surface. Self-host tracks in parallel once the ES6 writer
exists: every feature jpeg needs is also a feature the compiler needs.

### Language surface the goals force

| Feature | G1 jpeg | G2 TS engine | G3 self-host |
|---|---|---|---|
| `class` / `fn` / `sfn` / `Import` / `def` | required | required | required |
| `if` / `while` / `for` / `return` | required | required | required |
| arrays, maps, strings, numbers | required | required | required |
| `buffer` + file/shell ops | **required** | some | some (host FS) |
| `@(optional)` / `unwrap` / `null?` | required | required | required |
| `@(weak)` / ownership annos | light | heavy | heavy |
| operators / `Lang.rgr` templates | stdlib + buffer | large | **full** |
| `extension`, lambdas, `Enum` | light | yes | yes |
| `shape` / `match` / `union` | no (today) | `EvalPayload` shape | v4 itself uses shapes |
| writers beyond ES6 | Go nice-to-have | Go/Rust nice | ES6 first, then one native |

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

## 2.5 Compatibility assessment — is an “AST-only” shape rewrite possible?

### Constraint (from product goals)

1. Change **as little as possible** of the original `compiler/ng_*` code.
2. **Ranger test set keeps passing** the whole time (`npm test`, publish suite).
3. Invisible to users in most parts (language semantics, macros, plugins, IDE).
4. Not a “full rewrite of Ranger” — an AST representation change — but honest
   about how much core that still forces.

### What is coupled to fat `CodeNode` today

| Surface | Coupling | Breaks if CodeNode becomes a shape in-place |
|---|---|---|
| **`@macro(true)`** (`buildMacro` in `ng_parser_std_match2.rgr`) | String expand → reparse → **clear/replace `callArgs.children`**, set `parent`, re-`WalkNode` | First to break: `if` / `??` / dozens of `Lang.rgr` macros |
| **`defn` / `TransformOpFn`** | `rebuildWithType`, `getChildrenFrom`, `copyEvalResFrom`, in-place child splice | `lib/stdops.rgr` Map/ForEach and compiler-defined ops |
| **`TNodeFactory` (`r.*`)** | `@macro` expanding to `CodeNode.op` / `vref` / … | Host cannot rebuild itself |
| **Plugins** (`pre_flow`, `postprocess`, `generate_ast`) | JS/Ranger plugins walk `root:CodeNode` fields | External plugins |
| **VSCode + `dist/api.d.ts` + introspection tests** | `children`, `vref`, `eval_type_name`, `sp`/`ep`, `value_type` | IDE / `tests/introspection.test.ts` |
| **Source maps** | `CodeNode.code` / `sp` / `getLine()` | `-sourcemap` |
| **Shape desugar itself** | `DesugarShapes` mutates CodeNode trees | Chicken-egg if host AST is already a shape mid-edit |

Rough size: **~90 files / ~3.8k `CodeNode` mentions** under `compiler/`; hot path
FlowParser + FlowWork + LiveCompiler alone is on the order of **15k LOC**.

### Strategy options

| Strategy | Original code churn | Tests stay green? | Macros / users | Verdict |
|---|---|---|---|---|
| **A. Parallel `compiler/v4/`** (current) | **None** on `ng_*` until cutover | **Yes** — shipping path unchanged; v4 has its own tests | Invisible until cutover | **Recommended** under the constraints above |
| **B. In-place: `CodeNode` → shape** | Very high (FlowParser, macros, writers, API) | **No** through the migration — flag soup → `match` is a rewrite | Visible risk: macros first, then IDE/plugins | **Reject** for “minimal change / always green” |
| **C. Dual: v4 AstNode → lower to today’s CodeNode** | Low (adapter only) | Yes on product path | Invisible | Optional bridge to parse real files early; **does not** deliver shape-based mid/backend |
| **D. Split fields without shapes** (`CodeNodeLiteral` / side tables) | Low–medium | Medium risk if hot AST moves | Invisible if careful | Good hygiene for incremental/IDE; **not** the shapes payoff |

**B fails the constraint even if framed as “just AST”:** a mega-shape that keeps
every field gains nothing; a real case-split forces every `node.vref` /
`node.children` / `value_type` site to become `match`/`case`. Shapes also do
not preserve the call style macros and extensions rely on (`node.fn()` vs
`Shape.fn(node)`, mutable weak `parent`, `@serialize` on shapes still open).

### Macros specifically

Macros are **not** a thin string layer over an opaque AST. They invent and
mutate CodeNode:

1. `@macro(true)` — ~111 sites in `compiler/` (mostly `Lang.rgr`): emit Ranger
   text, reparse to CodeNode, splice into the call node, walk again.
2. `defn` — AST-to-AST via `rebuildWithType` + in-place `getChildrenFrom`.
3. Compiler `r.*` factories — macros that expand to CodeNode constructors.

User-authored macro *templates* rarely name CodeNode fields (they use `(e N)` /
`(block N)`), so **template source** can stay stable. The **engine** that runs
them cannot: any in-place AST change must reimplement splice + re-walk +
register lifting + recursion guards (`active_macros`, depth 512) or macros
mis-expand / hang (see `tests/macro-recursion.test.ts`).

**Estimate:** reimplementing the macro engine on shapes is a **dedicated
mid-stage** of v4 (after parse/collect/type), not a free side effect of changing
the node type. Until then, G1–G2 on v4 either (a) avoid relying on host macros
by lowering operators differently, or (b) use strategy **C** and keep expansion
on CodeNode.

### Bootstrap / chicken-egg

- Generation N (class `CodeNode` in `bin/output.js`) can compile source that
  *declares* shapes — that is how shapes work today.
- Making the **host** AST itself a shape is a **generational** cutover (N
  compiles N+1), not an edit inside one running compiler.
- Therefore: v4 **uses** shapes while still being compiled by ng_; only G3
  flips the host.

### Realistic estimate (effort shape, not calendar)

| Work | Invasiveness | Notes |
|---|---|---|
| Keep `ng_*` frozen; grow `compiler/v4/` | Low on original tree | Meets “tests always green” for the product suite |
| C0–C1 AstNode + parser | Done / small | No user visibility |
| C2–C4 collect + type + ES6 writer (no `@macro` yet) | Medium **new** code | Enough for a jpeg *subset* if operators are built-in or copied as non-macro |
| Macro / `defn` engine on AstNode | **High** new code | Port of `buildMacro` + `TransformOpFn` + `rebuildWithType` |
| Full FlowParser feature parity | **Very high** new code | This is most of “the compiler,” even if framed as AST-driven |
| In-place edit of `ng_CodeNode` + call sites | **Very high** on original | Conflicts with constraints; expect long red test windows |

**Bottom line for the constraints:**

- **Possible to keep original code and tests green?** Yes — only via **parallel
  v4** (A), not via in-place shape-ification of CodeNode (B).
- **Invisible to users?** Yes until cutover; at cutover, language should match
  if acceptance is “same output on G1–G3 + `npm test`.”
- **“Just AST, not full rewrite”?** The *type* change is local; the *call-site*
  change is not. Expect the bulk of work to be walkers/macros/writers that
  today assume one fat node — whether that work lives in new `compiler/v4/`
  files or as edits to `ng_*` is a packaging choice; the volume is similar.
- **Macros?** Hardest compatibility cliff after the parser. Plan for an
  explicit port; do not assume they keep working “for free.”

### Chosen approach under these constraints

1. **Do not modify `compiler/ng_*.rgr` for the AST experiment** (except unrelated
   bugfixes). Product `npm test` remains the ng_ suite.
2. Continue **A**: `compiler/v4/` with shape `AstNode`.
3. Allow optional **C** later if we need to parse real G1 sources before the v4
   mid-end exists (AstNode → CodeNode → existing pipeline) — experiment only.
4. Port macros only when v4 has a walk that needs them; gate G1 on either
   non-macro operator coverage or a working macro port.
5. Cutover (replace `ng_Compiler` entry) only when G1 + G2 smoke + G3a and the
   **existing** test suite run through the v4-built host (or a documented
   subset with explicit gaps).

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
- Gate: small programs that are **slices of G1** (buffer read, class method, CLI args)

### C5 — Grow surface toward G1 (JPEG scaler)

- Operators used by jpeg (`buffer_*`, arithmetic, `shell_arg*`, `substring`, …)
- Optionals, `while`, nested classes, `Import` graph resolution
- **Acceptance:** v4 ES6 output of `jpeg_scaler.rgr` scales a fixture JPEG
  (parity with `gallery/pdf_writer/bin/jpeg_scaler.js` behavior on one image)

### C6 — Grow toward G2 (TypeScript engine)

- Lambdas, maps, `extension`, richer optionals/weak, larger import graphs
- Enough to compile `ts_parser_main.rgr` then `ComponentEngine.rgr`
- **Acceptance:** compiled engine evaluates a tiny `.tsx` smoke (e.g. `1+1` /
  one JSX node) under the existing test harness style

### C7 — Self-host (G3)

- **G3a:** v4 compiles `compiler/v4/**` to ES6 and the result still parses
- **G3b:** v4 compiles a trimmed host (`ng_Compiler` path or a v4 CLI) that can
  compile `jpeg_scaler` — closing the loop
- Only then consider retiring `ng_*` as the shipped binary

### C8 — Second target (optional, after G1)

- Go or Rust writer; jpeg_scaler on Go is the natural check
- LLVM for jpeg remains out of scope until the existing LLVM hang is fixed
  independently

---

## 6. Directory layout

```text
compiler/v4/
  README.md           # how to build / test the sketch
  AstNode.rgr         # shape AstNode + helpers
  Source.rgr          # SourceFile (C1)
  Parser.rgr          # Lisp parser → AstNode (C1)
  Probe.rgr / ParseProbe.rgr

PLAN_COMPILER_V4.md   # this file (repo root, with other PLAN_*)
tests/fixtures/v4_ast_probe.rgr
tests/fixtures/v4_parse_probe.rgr
tests/compiler-v4-ast.test.ts
```

The product entry `compiler/ng_Compiler.rgr` is untouched until G3b.

---

## 7. Success criteria

### Scaffolding (C0–C1) — done / in progress

| Criterion | How we know |
|---|---|
| AstNode shape compiles on ES6 / Python / Go / Rust | `tests/compiler-v4-ast.test.ts` |
| Exhaustive walkers replace flag soup for syntax | `AstNode.asString` / parser use `match` |
| Illegal payloads unrepresentable | no `children` on `Integer`, etc. |
| Parser produces only AstNode cases | C1 fixture round-trips |
| No regression to shipping 3.3.x | ng_ tree unchanged |

### First product goals

| Goal | Done when |
|---|---|
| **G1 JPEG scaler** | `node <v4-es6-out>/jpeg_scaler.js -width N in.jpg out.jpg` matches ng_ output on a fixture |
| **G2 TS engine** | v4-built `ComponentEngine` (or `ts_parser_main`) runs a smoke script in CI |
| **G3 Self-host** | v4-built compiler compiles G1 (and ideally `compiler/v4`) without the ng_ host |

---

## 8. Relation to other plans

| Plan | Relation |
|---|---|
| `PLAN_SHAPES.md` | Language feature v4 consumes; S0–S5 |
| `PLAN_3.md` | Historical product 3.0; not an AST rewrite |
| `INCREMENTAL_PLAN.md` | Builds on today's CodeNode; v4 should make invalidation easier (immutable AST + side tables) |
| `EvalValue` shape migration | Same pattern; G2 already depends on shapes in the engine |
| `JPEG_SCALER_LLVM.md` | G1 tracks ES6/Go; LLVM hang is separate |

---

## 9. Immediate next actions

1. ~~Land C0: plan + AstNode probe + test~~
2. ~~Implement C1 parser emitting AstNode (subset)~~
3. ~~Pin first goals: G1 jpeg_scaler, G2 TS engine, G3 self-host~~
4. ~~Compatibility assessment: reject in-place CodeNode→shape under “always green”~~
5. Keep **`ng_*` frozen**; extend C1 (annotations, file API) then C2 collect for G1
6. Document which G1 operators need `@macro` vs can be direct writer templates
7. Keep `tests/compiler-v4-ast.test.ts` green; never gate product `npm test` on v4 until cutover
