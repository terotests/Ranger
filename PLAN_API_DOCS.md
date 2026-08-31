# PLAN_API_DOCS — documentation and API declarations in the language

Scope: a `doc { … }` metadata block that attaches to a Ranger declaration, a canonical
**ApiIR** built from it and from what the compiler already knows, and the per-target
outputs generated from that IR — doc comments and annotations inside the emitted code,
the package and layout each platform expects, and standalone API artifacts.

> **Status: phases A, B (JavaScript, C#, Kotlin, Swift, Python, Dart) and D are
> implemented.** The `doc { … }` tail, the detach pass, the model, the validation
> including the public-API type-leak check, `api.json` / `api.md` / `api.txt`,
> doc-comment emission for six targets, doc-driven visibility or export surface
> for five of them, and the npm, NuGet, Gradle/Dokka, SwiftPM/DocC, pip and pub
> packaging are in the tree. §17 records what shipped and what each part is
> verified against. The rest of this document is the design, unchanged.

This is **not** [`PLAN_DOCS.md`](PLAN_DOCS.md). That document is about the *language's own*
reference site, generated from the operator definitions in `compiler/Lang.rgr` and `lib/`.
This one is about **the programs people write in Ranger**: how an author marks up an
accessibility tree, a parser or an Office model so that the Swift build gets DocC, the
.NET build gets XML documentation DocFX can consume, the Rust build gets rustdoc, the
Dart build gets a generated barrel file, and all of them get the *same* descriptions from
one source.

The two meet in one place only: both end at a JSON model a renderer consumes. They do not
share a vocabulary and should not be merged.

---

## 1. Current state

Ranger already has a `doc` form. It is class-level, method-only, and holds one string:

```ranger
class RangerAppClassDesc {
  doc isSameOrParentClass "
    Returns true if the class is the same or a parent class of the given class
  "
}
```

`compiler/ng_RangerFlowParser.rgr:2958` reads those nodes out of the class body, finds the
method by name, and assigns `fndesc.git_doc`. `compiler/ng_RangerDocGenerator.rgr:63`
(`createClassDoc`) writes them to Markdown under `-classdoc=<file>`.

The whole feature is **two call sites in the tree** (`ng_RangerAppClassDesc.rgr:191`,
`feature_tests.rgr:56`), which is the honest measure of how usable it is:

| Limit | Consequence |
| --- | --- |
| Methods only | A class, a field, a record and a static function cannot be documented at all |
| One free-text string | No parameters, no return value, no deprecation, no version, nothing a doc tool can render as structure |
| Detached from the declaration | The doc names the method by string. Rename the method, keep the doc, and nothing complains |
| No visibility concept | There is no way to say "this is the API and that is an implementation detail" |
| One output | Markdown, in one flat file, from one compilation |
| Nothing reaches the emitted code | Not one target writes a doc comment. `grep '/\*\*'` over the writers finds only `/** note: unused */` |

Separately, `@doc('…')` annotates *operator* definitions in `Lang.rgr` and feeds
`-operatordoc`. That is the PLAN_DOCS pipeline and stays where it is.

`compiler/RangerDocs.rgr` holds an empty `docs { }` block with the comment "testing the
documentation generation ideas". Nothing parses it. §10 gives that name a job.

So: the language has a documentation stub, and no API surface concept whatsoever.

---

## 2. The syntax: a `doc` tail on the declaration

The block goes **after** the declaration, as its tail:

```ranger
fn find:EVGA11yNode ( id:string ) {
    ...
} doc {
    public
    description "Finds an accessibility node by its stable identifier."
    param id "The stable accessibility identifier."
    returns "The matching node."
    since "1.2"
}
```

The signature stays clean, the documentation is visibly an attachment to the declaration
rather than a part of the program, and nothing above the body has to be read past to see
what the function is.

### 2.1 It already parses

This is not a proposal about the parser. It is a proposal about what the compiler does
with a tree it *already builds*.

`RangerLispParser` ends an expression at a newline when the parent is a block node
(`compiler/ng_RangerLispParser.rgr:64`, `skip_space`). A `}` that closes the function body
returns to the `fn` expression and keeps scanning the same line. So `doc` and the block
after it become children 4 and 5 of the `fn` node:

```text
fn                    ; child 0
foo:void              ; child 1   nameNode
( x:int )             ; child 2   fnArgs
{ … }                 ; child 3   fnBody
doc                   ; child 4   ← the tail
{ public … }          ; child 5   ←
```

`EnterFnParts` (`compiler/ng_RangerFlowParser.rgr:1031`) reads children at fixed indices
`idx+1`, `idx+2`, `idx+3` and never looks past them. Compiled against the current compiler
(`bin/output.js`, v3.3.1), every form below was tried as written:

| Form | Today |
| --- | --- |
| `fn foo:int (x:int) { … } doc { … }` | Compiles, correct output |
| `sfn bar:int (x:int) { … } doc { … }`, nested `deprecated { … }` included | Compiles, correct output |
| `def focusId:string "abc" doc { … }` (class field) | Compiles, field and initialiser correct, runs |
| top-level `sfn helper:int (x:int) { … } doc { … }` | Compiles |
| `enum Color { … } doc { … }` | Compiles |
| `Constructor ( … ) { … } doc { … }` | **Error**, clean: `Method expexts four arguments` |
| `record Point { … fn … } doc { … }` | **Error** |
| `shape Value { … } doc { … }` | **Error**, 20 of them |
| `class Sample { … } doc { … }` | **Silently wrong output** |

The first five need no parser work at all: the doc block is simply discarded. The
`Constructor`, `record` and `shape` errors are arity checks doing their job — noisy, but
honest. The last row is the one that matters.

`EnterClass` (`ng_RangerFlowParser.rgr:2891`) takes the class body as the *last* child
(`body_index = chlen() - 1`) and permits a 5-child node because `class Child extends Base { }`
is 5 children. Append a doc tail to a class and the body index lands on the doc block:

```ranger
class Sample {
  fn foo:int ( x:int ) {
    return (x + 1)
  }
} doc { public }
```

reports `[OK] Compilation successful!` and emits

```javascript
foo (x) {
    return+x1          // ← the body was never analysed
}
```

The doc block was taken for the class body, so the real body was never walked and the
infix repair that turns `(x + 1)` into an addition never ran. **A class with a doc tail
compiles clean and produces broken code.** Any trailing `token { block }` does it, not just
`doc`. That is [ISSUES.md #75](ISSUES.md), a latent bug independent of this plan, and it
fixes the direction of the design: the doc tail must be removed from `children` before
anything counts children.

### 2.2 Attachment rule

**A `doc` block is valid only as the tail of the declaration expression it documents.**

That is not a rule the compiler has to enforce with lookback — it is what the tree already
means. `} doc {` on one line is the same expression; a `doc {` on its own line is a
different node. The rule therefore costs nothing and buys the property the parser needs:
`doc` never has to be matched to a declaration by guessing.

```ranger
fn foo:void () {
} doc { public }              ; binds to foo

fn bar:void () {
}
doc { public }                ; ERROR: documentation block is not attached to a declaration
```

The detached form compiles silently today (it parses as a class-body statement and nothing
reads it). It must become an error, because a doc block that binds to nothing is a doc
block the author believes is published.

### 2.3 Attachment points

| Declaration | Form |
| --- | --- |
| Method | `fn name:T ( … ) { … } doc { … }` |
| Static method | `sfn name:T ( … ) { … } doc { … }` |
| Constructor | `Constructor ( … ) { … } doc { … }` |
| Class | `class X { … } doc { … }` |
| Record | `record X { … } doc { … }` |
| Field | `def name:T value doc { … }` |
| Enum | `enum X { … } doc { … }` |
| Shape, case, group | `shape X { … } doc { … }`, `case Num { … } doc { … }` |
| Module | `module X { … } doc { … }` — see §11 |

Locals do not take a doc block. `EnterVarDef` (`compiler/FlowEnterVarDef.rgr:39`) rejects a
`def` with more than three children inside a method, and that check stays: a local variable
is not API. The class-field path is separate and already accepts the tail.

### 2.4 Why not an annotation, and why not a comment

`@doc('…')` exists and is used for operators. It does not extend: annotations are
single-valued, so `param` × 4 plus `deprecated { … }` does not fit, and the text ends up
inside the signature — which is exactly what the tail form is for.

`;` comments stay what they are. They are already collected onto nodes
(`ng_RangerLispParser.rgr` pushes them to `curr_node.comments`), and they document *the
implementation*. `doc` documents *the interface*. A compiler that treats them as the same
thing publishes the notes an author wrote for themselves.

---

## 3. The governing principle: documentation completes the program, it never restates it

`documentation.js` earns its reputation on inference: it reads parameters, membership and
much of the type information out of the source instead of making the author repeat it in
JSDoc, and it can restrict the output to exported symbols. That principle is right, and
**Ranger is in a much stronger position to apply it than any JavaScript tool**, because a
JavaScript tool infers from an untyped AST and Ranger infers from a fully type-checked one.

So this is rejected:

```ranger
fn foo:void ( x:int ) {
} doc {
    public
    description "Processes a number."
    param x int "The input number."      ; ← the type is already known
    returns void                         ; ← so is this
}
```

and this is the language:

```ranger
fn foo:void ( x:int ) {
} doc {
    public
    description "Processes a number."
    param x "The input number."
}
```

from which the compiler assembles:

```text
name         foo
visibility   public API
parameter    x
  type       int
  doc        The input number.
return       void
description  Processes a number.
```

The rule, stated so it can settle future vocabulary arguments:

> **A doc entry may not carry information the compiler already has.** If the compiler can
> derive it, it derives it. The doc block carries *only* what no analysis can recover:
> prose, intent, audience, version history and cross-references.

Everything in §4 passes that test. Everything rejected in §4.4 fails it. And the rule is
enforceable, not just aspirational: `param x int "…"` is a parse error, not a tolerated
redundancy, precisely because a restated type is a type that will eventually disagree with
the signature.

---

## 4. The vocabulary

Small, closed, and checked. Every entry is a vref followed by either strings or a block.

### 4.1 Version 1

| Entry | Form | Meaning |
| --- | --- | --- |
| `public` | flag | Part of the exported API surface |
| `internal` | flag | Explicitly not API (the default, stated) |
| `description` | `description "…"` | The prose. Repeatable; lines join into paragraphs |
| `param` | `param name "…"` | One parameter. The name is checked against the signature |
| `returns` | `returns "…"` | The return value. Rejected on a `void` function |
| `throws` | `throws "…"` | What the function raises. Repeatable |
| `since` | `since "1.2"` | Library version that introduced it |
| `deprecated` | `deprecated { since "2.0" use "find" description "…" }` | See §4.2 |
| `see` | `see EVGA11yNode` | A cross-reference. The name is resolved (§6.4) |
| `example` | `example "…"` or `example { … }` | Sample code. Repeatable |
| `category` | `category "Accessibility"` | Grouping hint for the rendered output |
| `experimental` | flag | Stability marker; renders as the target's alpha/beta tag |
| `platform` | `platform editor` | Audience/platform of the symbol. See §11.4 |

### 4.2 `deprecated`

A block, because three independent facts have to reach three different places:

```ranger
} doc {
    public
    description "Finds an accessibility node."
    deprecated {
        since "2.0"
        use "find"
        description "Use find instead."
    }
}
```

- `since` → the version argument of `#[deprecated(since=…)]`, `@deprecated("…", "2.0")`
- `use` → the *replacement symbol*, resolved like `see`, so `ReplaceWith("find(id)")` on
  Kotlin and `renamed: "find"` on Swift can be generated rather than typed
- `description` → the message

`use` being a resolved symbol rather than a string is §3 applied: the compiler knows the
replacement's signature, so a target that can express "renamed to" gets a machine-checkable
rename and one that cannot gets prose. Neither is typed by the author.

### 4.3 Target escape hatch

Some markup is genuinely per-target and has no portable meaning. It is confined to a
`target` block so it never contaminates the semantic vocabulary:

```ranger
} doc {
    public
    description "Changes the surface size."

    target swift {
        attr "@MainActor"
        description "Changes the surface size. Call from the main actor."
    }
    target csharp {
        attr "[EditorBrowsable(EditorBrowsableState.Advanced)]"
    }
}
```

- `attr "…"` — emitted verbatim above the declaration, in that target only
- any v1 entry inside a `target` block **overrides** the portable one for that target

The rule that keeps this honest: **the portable vocabulary must be sufficient on its own.**
`attr` is for things Ranger has no opinion about (`@MainActor`, `@objc`, `#[inline]`), never
for deprecation, visibility or descriptions — those have portable entries, and a target
block that restates one is a lint error.

### 4.4 Deliberately not in v1

Rejected by §3, because the compiler already knows them: parameter types, return types,
`@static`, `@readonly`, `@memberof`, `@constructor`, `@extends`, `@typedef`, `@interface`,
`@instance`, `@name`. Every one of those is a JSDoc tag that exists because JavaScript
cannot tell the tool; Ranger can.

Rejected for other reasons: `author`, `license`, `copyright` — module-level facts, so they
belong on `module` (§11). `todo`, `note` — that is what `;` is for. `namespace` — see §7.2,
it is not a property of a symbol.

---

## 5. Visibility: documentation *is* the API declaration

The three states come out of the syntax with nothing added:

```text
no doc block            → internal, undocumented
doc { … }               → documented, internal
doc { public … }        → documented, exported public API
```

This is the part of the design that earns its place. It means:

- No `api fn` / `export fn` keyword. The API surface is a property of the documentation,
  which is where an author is already thinking about audience.
- **An undocumented function cannot be public.** Not as a lint — as a consequence of the
  grammar. There is no spelling for it.
- The surface is greppable and diffable: `doc {` followed by `public` is the whole API.

`documentation.js` reaches roughly the same place with `--document-exported`, inferring the
surface from ES `export`. Ranger states it instead of inferring it, which is the right
trade when the same declaration has to become `export`, `pub`, `public`, a capital letter
and a barrel-file entry depending on where it lands.

### 5.1 `public` is not a modifier — it is a packaging fact

The naive reading is that `public` selects a keyword. On four of the targets it does not:

| Target | `public` means |
| --- | --- |
| TypeScript / JS | `export`, TSDoc `@public`, and presence in the rolled-up `.d.ts` |
| Java | `public` modifier |
| Kotlin | `public` (the default); internal becomes `internal` |
| C# | `public` modifier |
| Swift | `public` modifier (internal is the default) |
| Rust | `pub`, **and a `pub use` re-export from `lib.rs`** |
| **Dart** | **membership of the generated barrel `lib/<pkg>.dart`; internals stay in `lib/src/`** |
| **Go** | **a capitalised compiled identifier** — visibility is spelling |
| Python | membership of `__all__`; internals take a `_` prefix |
| C++ | declaration in the public header rather than the implementation unit |
| PHP | `public` + PHPDoc `@api`; internal takes `@internal` |

Dart is the sharpest case and the most useful one. Dart's only private form is a `_`
prefix, which changes every call site, so the idiomatic package puts implementation in
`lib/src/` and re-exports the public surface from one library file. Ranger can generate
that file:

```ranger
class EVGA11yTree { … } doc { public   description "…" }
class EVGA11yIndex { … }                              ; no doc → internal
```

```dart
// lib/evg_a11y.dart   — generated, in full, from the ApiIR
export 'src/evg_a11y_tree.dart';
// EVGA11yIndex is not exported: lib/src/evg_a11y_index.dart only
```

**A barrel file is exactly the kind of list that rots when a human maintains it**, and it
is derivable, so Ranger should derive it. The same argument makes Rust's `lib.rs`
`pub use` block and Python's `__all__` generated rather than written. This is the concrete
answer to "what is `public` for": it is not decoration on a declaration, it is the input
to the packaging step.

**Go visibility is spelling**, so `public` forces the compiled name to be capitalised. If
the author's name is `find` and something else in the package already compiles to `Find`,
that is a Ranger-level error, not a Go build failure discovered later.

### 5.2 The check that makes this worth having

**A public declaration may not expose a non-public type.**

```ranger
class InternalCache { … }                 ; no doc block → internal

fn getCache:InternalCache () {
} doc {
    public                                ; ERROR: public `getCache` returns
    description "…"                       ;        internal type `InternalCache`
}
```

Rust enforces this (`E0446`), Swift enforces it, and every other target lets it through and
produces an API nobody outside the module can call — or, on Dart, a barrel file exporting a
type that is not exported. Ranger can check it once, for all targets, before any of them is
written. It applies to parameter types, return types, array and hash element types, field
types, and base classes of a public class.

Under `-apistrict` two more become errors instead of warnings: a public declaration with no
`description`, and a public function with a parameter that has no `param` line.

---

## 6. Compiler pipeline

### 6.1 Stage 0 — detach (new, and it must be first)

A pass over the parsed tree, before `CollectMethods`:

```text
for each node whose children end in [ vref "doc", block ]:
    node.docNode = block            ; new field, ng_CodeNodeCompilerExtensions.rgr
    remove those two children
```

After it, **every existing arity check, index lookup and writer sees exactly the tree it
sees today.** `EnterClass` counts 3 or 5 again, `EnterFnParts` finds the body at `idx+3`,
`EnterVarDef` sees three children. The §2.1 miscompilation cannot occur because the tail is
gone before anything counts.

This is the whole reason the design is cheap. The alternative — teaching each of the ~12
declaration handlers to skip a trailing doc block — is twelve chances to get it wrong and
one of them is already wrong.

Placement: alongside `DesugarShapes` and `DesugarTrees` at the head of `CollectMethods`
(`ng_RangerFlowParser.rgr:7164`), which is where the tree is normalised before anything
reads it. It runs on imports too, so a documented library keeps its docs.

A `doc` block found anywhere the detach pass did not put it — a bare statement in a class
body or at top level — is the §2.2 error, reported by the same pass, which is the only pass
that knows the difference.

### 6.2 Stage 1 — parse the block into a model

New class `RangerDocBlock` (new file `compiler/ng_RangerDocBlock.rgr`):

```ranger
class RangerDocParam {
  def name:string ""
  def text:string ""
  def node@(weak):CodeNode          ; for error reporting
}
class RangerDocDeprecation {
  def since:string ""
  def use:string ""
  def description:string ""
}
class RangerDocBlock {
  def is_public:boolean false
  def is_experimental:boolean false
  def description:string ""
  def params:[RangerDocParam]
  def returns:string ""
  def throws:[string]
  def since:string ""
  def deprecation@(optional):RangerDocDeprecation
  def see:[string]
  def examples:[string]
  def category:string ""
  def platform:string ""             ; §11.4
  def attrs:[string:[string]]        ; target → verbatim attributes
  def overrides:[string:RangerDocBlock]   ; target → override block
  def node@(weak):CodeNode
}
```

Note what is **not** in it: no type, no signature, no parameter list independent of the
function's own, no namespace. Those come from the descriptors, per §3.

It hangs off the descriptors that already exist:

- `RangerAppFunctionDesc` — methods, static methods, constructors
- `RangerAppClassDesc` — classes, records, shapes, enums
- `RangerAppParamDesc` — fields

`git_doc` (`ng_RangerAppParamDesc.rgr:164`) stays as the legacy slot and is populated from
`description` so `-classdoc` keeps working unchanged.

### 6.3 Stage 2 — validate

Run after `CollectMethods`, when signatures are known:

| Check | Severity |
| --- | --- |
| `param` names a parameter that does not exist | error |
| Two `param` lines for one parameter | error |
| `param x int "…"` — a restated type (§3) | error |
| `returns` on a `void` function | error |
| `deprecated` `use` names a symbol that does not exist | error |
| `see` names a symbol that does not exist | warning (it may be prose) |
| Public declaration exposes an internal type (§5.2) | error |
| `public` on a member of an internal class | error |
| A `target` block restating a portable entry that is not a description | error |
| Unknown vref in a doc block | error |
| `docs { }` references a symbol that does not exist (§10) | error |
| Public declaration with no `description` | warning; error under `-apistrict` |
| Public parameter with no `param` line | warning; error under `-apistrict` |

Every one of these is a class of stale documentation a comment-based system cannot detect.
It is the concrete payoff of structured metadata over `;`, and it is where Ranger should
beat `documentation.js` outright rather than match it: that tool lints JSDoc text against
an inferred model, and Ranger lints doc metadata against a type-checked one.

### 6.4 Stage 3 — resolve

`see` and `deprecated.use` are resolved against the class/function registry and stored as
resolved references, not strings. That is what lets each target write its own link syntax
from one source:

| Target | `see EVGA11yNode` becomes |
| --- | --- |
| Java | `@see EVGA11yNode` / `{@link EVGA11yNode}` |
| C# | `<see cref="EVGA11yNode"/>` |
| Rust | ``[`EVGA11yNode`]`` |
| Dart | `[EVGA11yNode]` |
| Swift | ` ``EVGA11yNode`` ` |
| TypeScript | `{@link EVGA11yNode}` |
| Kotlin | `@see EVGA11yNode` |
| Go | prose; Go doc has no link tag |

---

## 7. ApiIR — the canonical model

Everything downstream reads one target-independent model. Doc comments, package layout,
the Markdown reference, the API report and any third-party renderer are all views of it.

DocFX is the benchmark for this shape and it is a better one than `documentation.js`: DocFX
extracts an API metadata model first (as YAML), and only then renders documentation from
it. The metadata stage is a separate artifact with a separate consumer set. Ranger should
have the same seam, for the same reason — and the seam is more valuable here, because it is
also what the *code* emitters read.

### 7.1 Shape

```json
{
  "module": "evg.a11y",
  "version": "1.2.0",
  "classes": [{
    "name": "EVGA11yTree",
    "public": true,
    "category": "Accessibility",
    "description": "A platform-independent accessibility tree.",
    "fields": [
      { "name": "focusId", "type": "string", "public": true,
        "description": "The identifier of the currently focused node." }
    ],
    "methods": [{
      "name": "find", "static": false, "public": true, "since": "1.2",
      "returns": { "type": "EVGA11yNode", "description": "The matching node." },
      "params": [
        { "name": "id", "type": "string", "description": "The stable accessibility identifier." }
      ],
      "see": ["EVGA11yNode"],
      "targets": {
        "swift":  { "name": "find", "signature": "func find(id: String) -> EVGA11yNode",
                    "module": "EVGA11y" },
        "csharp": { "name": "Find", "signature": "public EVGA11yNode Find(string id)",
                    "namespace": "EVG.A11y", "assembly": "EVG.A11y" },
        "go":     { "name": "Find", "signature": "func (t *EVGA11yTree) Find(id string) *EVGA11yNode",
                    "package": "evga11y" },
        "rust":   { "name": "find", "signature": "pub fn find(&self, id: String) -> EVGA11yNode",
                    "crate": "evg_a11y" },
        "dart":   { "name": "find", "signature": "EVGA11yNode find(String id)",
                    "library": "package:evg_a11y/evg_a11y.dart" }
      }
    }]
  }]
}
```

The `targets` map is what makes this more than a doc dump: the compiler is the only thing
that knows the C# method is called `Find`, the Rust one borrows `&self`, and the Dart one
is reachable through a generated library file. **A cross-language API reference showing the
real signature in each language is something only the compiler can produce**, and it falls
out of a model it already has.

### 7.2 The rule that keeps ApiIR canonical: no namespace

**ApiIR names a *logical module*, never a namespace, package, assembly or directory.**

That is not fussiness. The five ecosystems disagree about how many levels there even are:

| Ecosystem | Levels between "the API" and "the symbol" |
| --- | --- |
| Java | package (dotted, = directory) → JAR → Maven coordinates |
| C# / .NET | namespace (dotted) → assembly → project → NuGet package |
| Unity | **UPM package → assembly (`.asmdef`) → namespace → folder (`Runtime/`, `Editor/`)** — four, and they are independent |
| Swift | package → product → target → **module, which *is* the top-level namespace and has no hierarchy** |
| Kotlin JVM | package (dotted) → Gradle project → JAR |
| Kotlin MP | package → Gradle project → **source set** (`commonMain`, `androidMain`, `iosMain`, …) |
| Dart | pub package → **library** (a barrel file) → `lib/src` implementation files |
| TypeScript | npm package → ES module → `export` |
| Rust | crate → `mod` tree → `pub use` re-exports |
| Go | module path → package (= directory, and the package name is the directory) |

A single `namespace` field in the canonical model would have to be a lie for at least four
of those. Swift makes the point hardest: `evg.a11y` does not become `EVG.A11y` there,
because Swift has no namespace hierarchy — it becomes the module `EVGA11y`, and that
module is also a SwiftPM target and a product. Unity makes the opposite point: one logical
module becomes a package *and* an assembly *and* a namespace *and* a folder, and those four
names are not derivable from each other.

So ApiIR says:

```text
symbol:         EVGA11yTree
logical module: evg.a11y
visibility:     public
platform:       (none | editor | …)
```

and the mapping to physical names lives in the target configuration (§11), where it can be
as many levels deep as that platform needs.

### 7.3 A benchmark Ranger should hold itself to

DocFX can build API documentation from a compiled `.dll` plus its XML documentation file,
with no DocFX-specific input in the source. That is the standard to aim for, generalised:

> **Ranger emits idiomatic source for the target. The target's own documentation tool then
> works on it with no Ranger-specific plugin, configuration hack or post-processing.**

If `dart doc`, `cargo doc`, `dokka`, `docfx`, `swift package generate-documentation`,
`javadoc`, `typedoc` and `doxygen` each run on Ranger output unmodified and produce the
documentation their users expect, the feature is done. If any of them needs a Ranger plugin,
Ranger emitted the wrong thing.

---

## 8. Output A — doc comments and annotations in the emitted code

Each class writer gains two hooks, called immediately before it writes a declaration:

```ranger
fn writeDocComment:void ( doc:RangerDocBlock ctx:RangerAppWriterContext wr:CodeWriter )
fn writeDocAttrs:void   ( doc:RangerDocBlock ctx:RangerAppWriterContext wr:CodeWriter )
```

A shared `RangerDocRenderer` holds everything that is not target syntax — paragraph
wrapping, escaping, ordering, the `see`/`use` resolution above — so a writer implements only
its own comment shape. A writer that implements neither hook emits nothing, which is
today's behaviour; the feature can land target by target.

Controlled by `-docstyle=native|none` (default `native`).

### 8.1 Per-target rendering

```ranger
fn find:EVGA11yNode ( id:string ) {
    ...
} doc {
    public
    description "Finds an accessibility node by its stable identifier."
    param id "The stable accessibility identifier."
    returns "The matching node."
    since "1.2"
    see EVGA11yNode
}
```

**C# — the DocFX benchmark.** Nothing here is Ranger-specific; it is the XML documentation
format the C# compiler emits to a `.xml` file and DocFX and Sandcastle/SHFB consume:

```csharp
/// <summary>
/// Finds an accessibility node by its stable identifier.
/// </summary>
/// <param name="id">The stable accessibility identifier.</param>
/// <returns>The matching node.</returns>
/// <seealso cref="EVGA11yNode"/>
public EVGA11yNode Find(string id) { … }
```

**TypeScript / JavaScript** — TSDoc, consumed by TypeDoc and API Extractor:

```typescript
/**
 * Finds an accessibility node by its stable identifier.
 *
 * @param id - The stable accessibility identifier.
 * @returns The matching node.
 * @see {@link EVGA11yNode}
 * @public
 */
export find(id: string): EVGA11yNode { … }
```

**Swift** — DocC markup. DocC reads `- Parameter`, `- Parameters`, `- Returns` and
`- Throws` sections out of `///` comments:

```swift
/// Finds an accessibility node by its stable identifier.
///
/// - Parameter id: The stable accessibility identifier.
/// - Returns: The matching node.
///
/// > Since: 1.2
///
/// See also: ``EVGA11yNode``
public func find(id: String) -> EVGA11yNode { … }
```

Note what `since` does **not** become: `@available` is OS availability, not library version.
Mapping `since "1.2"` to `@available` would emit a platform gate the author never asked for.
It renders as a DocC callout.

**Kotlin** — KDoc, consumed by Dokka. `@return`, not `@returns`:

```kotlin
/**
 * Finds an accessibility node by its stable identifier.
 *
 * @param id The stable accessibility identifier.
 * @return The matching node.
 */
public fun find(id: String): EVGA11yNode { … }
```

**Dart** — `///`, Markdown, `[Symbol]` references, consumed by `dart doc`:

```dart
/// Finds an accessibility node by its stable identifier.
///
/// [id] is the stable accessibility identifier.
///
/// Returns the matching node.
///
/// See also [EVGA11yNode].
EVGA11yNode find(String id) { … }
```

**Rust** — rustdoc has no parameter tag, so `param` lines render as a `# Parameters`
section, which is the convention rustdoc readers expect:

```rust
/// Finds an accessibility node by its stable identifier.
///
/// # Parameters
///
/// * `id` - The stable accessibility identifier.
///
/// # Returns
///
/// The matching node.
///
/// See also [`EVGA11yNode`].
pub fn find(&self, id: String) -> EVGA11yNode { … }
```

**Go** — the doc comment must begin with the identifier, and the identifier is the
capitalised compiled name from §5.1:

```go
// Find finds an accessibility node by its stable identifier.
//
// The id parameter is the stable accessibility identifier.
// It returns the matching node.
func (t *EVGA11yTree) Find(id string) *EVGA11yNode { … }
```

**Java** — Javadoc. The annotation and the tag are different things: `javac` warns on
`@Deprecated`, `javadoc` renders `@deprecated`, and both are emitted.

**Python** — Google-style docstrings (`sphinx.ext.napoleon`, pdoc and mkdocstrings all read
them). **C++** — Doxygen `@brief` / `@param` / `@return` on the header declaration.
**PHP** — PHPDoc. **Scala** — Scaladoc.

### 8.2 Annotations derived from the vocabulary

Deprecation is the case that pays for the structure: one `deprecated` block, twelve correct
target forms, none of them typed by the author.

| Target | From `deprecated { since "2.0" use "find" description "Use find instead." }` |
| --- | --- |
| Java | `@Deprecated` + `@deprecated Use find instead. Use {@link #find} instead.` |
| Kotlin | `@Deprecated("Use find instead.", ReplaceWith("find(id)"))` |
| C# | `[Obsolete("Use find instead.")]` |
| Swift | `@available(*, deprecated, renamed: "find", message: "Use find instead.")` |
| Rust | `#[deprecated(since = "2.0", note = "Use find instead.")]` |
| C++ | `[[deprecated("Use find instead.")]]` |
| Dart | `@Deprecated('Use find instead. Use find.')` |
| TypeScript | TSDoc `@deprecated Use {@link find} instead.` |
| Go | a `// Deprecated: Use Find instead.` paragraph — the pkgsite convention |
| PHP | `@deprecated 2.0 Use find instead.` |
| Scala | `@deprecated("Use find instead.", "2.0")` |
| Python | `.. deprecated:: 2.0` in the docstring |

Python is deliberately docstring-only. Emitting `warnings.warn(…, DeprecationWarning)`
changes what the program *does*, and a documentation flag must not. It becomes available
under an explicit `-docstyle=native+runtime` if anyone wants it.

`experimental` maps to TSDoc `@alpha`, Kotlin `@RequiresOptIn`, Rust a `# Stability`
section, and an "Experimental" callout everywhere else.

---

## 9. Output B — standalone API artifacts

### 9.1 `api.json` — ApiIR on disk

§7's model, serialised. Everything else is a rendering of it, including renderings this
repository never writes.

### 9.2 `api.md` — the portable reference

Markdown from the same model: one section per class, a table of the public surface, the
per-target signature in tabs. This is the successor to `-classdoc` and replaces it.

### 9.3 `api.txt` — the API report

A flat, sorted, one-line-per-member text rendering of the **public** surface only:

```text
EVGA11yTree
EVGA11yTree.focusId: string
EVGA11yTree.find(id: string): EVGA11yNode      @since 1.2
EVGA11yTree.oldFind(id: string): EVGA11yNode   @deprecated 2.0
```

Committed to the repository and diffed in CI, the way API Extractor's `.api.md` report is
used. A pull request that changes the public API shows it as a diff hunk instead of as a
surprise in a release. For a compiler that targets eleven languages it is the only
practical way to notice that a change broke the Swift consumers but not the TypeScript
ones.

### 9.4 HTML

Not written by Ranger. §7.3 is the position: each target's own tool renders HTML, and the
portable HTML case is served by pointing a static-site generator at `api.json`. Writing an
HTML renderer would be the one part of this plan that competes with tools that are better
at it than Ranger will ever be.

---

## 10. `docs { }` — reference organization, kept out of the API metadata

`documentation.js` has a `documentation.yml` that orders API elements and interleaves
narrative sections between them. DocFX has `toc.yml`, DocC has documentation catalogs and
`## Topics` sections, Dokka has module and package Markdown files, TypeDoc has categories.
Every mature system separates *what a symbol is* from *how the manual is arranged*, and
Ranger should too — a `category "…"` on each declaration is a hint, not a table of
contents.

So a second, separate block, at file level and attached to nothing:

```ranger
docs {
    section "Accessibility Trees" {
        EVGA11yTree
        EVGA11yNode
    }
    section "Focus" {
        EVGA11yTree.setFocus
        EVGA11yTree.focusId
    }
}
```

`compiler/RangerDocs.rgr` already reserves the name with an empty block and the comment
"testing the documentation generation ideas". This gives it a meaning.

Three layers, and they should never be collapsed into two:

```text
doc { … }        symbol metadata          in the source, on the declaration
docs { … }       reference organization   in the source, separate from declarations
docs/*.md        guides, concepts         outside the source entirely
```

Each target maps all three into its own system:

| Target | `docs { section … }` | `docs/*.md` |
| --- | --- | --- |
| Swift | `## Topics` / `### Group` in the `.docc` catalog | DocC catalog articles and documentation extensions |
| Kotlin | Dokka module/package Markdown | Dokka `includes` Markdown |
| C# | DocFX `toc.yml` | DocFX articles |
| TypeScript | TypeDoc categories / navigation | TypeDoc project documents |
| Rust | `//!` module docs with sections | `#[doc = include_str!(…)]` |
| Dart | `dartdoc` categories | `doc/` package documentation |
| Markdown / JSON | section order in `api.md`, `sections` in `api.json` | copied through |

The gain is that a symbol never has to know where in the manual it appears, and the manual
can be reorganised without touching a declaration.

Phase: `docs { }` is worth designing now and building after `doc { }` ships. It is
useless without an ApiIR to arrange.

---

## 11. Language × platform: the target model

### 11.1 The problem

`-l=csharp` is not enough information to emit a Unity package, and `-l=kotlin` is not enough
to emit a Kotlin Multiplatform source-set layout. Both would be the same *language emitter*
with a completely different *packaging emitter*:

```text
C#/.NET target                  Unity target
    → .cs                           → .cs
    → XML docs                      → XML docs
    → .csproj                       → .asmdef
    → NuGet / DLL                   → package.json (UPM)
    → DocFX                         → Documentation~/
```

The C# syntax and the XML-doc rendering are identical. Everything after them differs. So
`unity` must not be `csharp` with flags, and it must not be a twelfth language either.

### 11.2 The three layers

```text
                    Ranger ApiIR
                          │
                          ▼
                  Language emitter          syntax + doc comments + annotations
              ┌───────────┼───────────┐
              ▼           ▼           ▼
             C#         Swift       Kotlin      Dart      TypeScript   …
              │           │           │           │            │
              ▼           ▼           ▼           ▼            ▼
                  Platform emitter          layout + manifest + visibility surface
              │           │           │           │            │
        .NET | Unity   SwiftPM     JVM |       Dart |         npm
                                   Android |   Flutter
                                   Multiplatform
```

Spelled in the source, per build rather than per declaration:

```ranger
target {
    language csharp
    platform unity
}
```

### 11.3 The mapping table

Where a logical module lands, per language and platform:

| Language | Platform | API unit | Layout | Manifest | Doc tool |
| --- | --- | --- | --- | --- | --- |
| C# | dotnet | namespace + assembly | `<Name>/*.cs` | `.csproj`, NuGet | DocFX, SHFB |
| C# | **unity** | **package + assembly + namespace + folder** | `Runtime/`, `Editor/`, `Tests/` | `package.json`, `*.asmdef` | XML docs + `Documentation~/` |
| Swift | swiftpm | **module** (no hierarchy) | `Sources/<Target>/` | `Package.swift` | DocC catalog |
| Kotlin | jvm | package | `src/main/kotlin/<pkg>/` | Gradle | Dokka |
| Kotlin | android | package | `src/main/kotlin/<pkg>/` | Gradle, AAR | Dokka |
| Kotlin | **multiplatform** | package + **source set** | `src/commonMain/kotlin/<pkg>/`, `src/androidMain/…`, `src/iosMain/…` | Gradle KMP | Dokka |
| Dart | dart | pub package + **library** | `lib/<pkg>.dart`, `lib/src/` | `pubspec.yaml` | `dart doc` |
| Dart | **flutter** | pub package + library | as Dart, plus assets and native platform dirs | `pubspec.yaml` | `dart doc` |
| TypeScript | npm | npm package + ES module | `dist/index.d.ts` | `package.json` | TypeDoc, API Extractor |
| Java | maven/gradle | package | `src/main/java/<pkg path>/` | `pom.xml` / Gradle | Javadoc |
| Rust | cargo | crate + `mod` | `src/lib.rs`, `src/*.rs` | `Cargo.toml` | rustdoc |
| Go | module | package = directory | `<pkg>/*.go`, `doc.go` | `go.mod` | pkgsite |
| Python | pypi | package | `<pkg>/__init__.py` | `pyproject.toml` | Sphinx, pdoc |
| C++ | — | header/impl | `include/<name>/`, `src/` | CMake | Doxygen |

### 11.4 Worked case: Unity

Unity is the case that proves the split, because one logical module becomes four
independent physical names.

```ranger
module EVGA11y {
    package "evg.a11y"
} doc {
    public
    version "1.0.0"
    description "Accessibility support for EVG."
}

target {
    language csharp
    platform unity

    unity {
        package "evg.a11y" {
            name        "com.evg.a11y"
            displayName "EVG Accessibility"
            unity       "6000.0"

            assembly runtime {
                name      "EVG.A11y"
                namespace "EVG.A11y"
            }
            assembly editor {
                name      "EVG.A11y.Editor"
                namespace "EVG.A11y.Editor"
            }
        }
    }
}
```

A declaration says only which audience it is for, never where the file goes:

```ranger
fn count:int () {
} doc {
    public
    description "Returns the number of accessibility nodes."
}

fn inspectTree:void ( tree:EVGA11yTree ) {
} doc {
    public
    platform editor
    description "Opens the accessibility tree inspector."
}
```

and the platform emitter produces:

```text
Packages/com.evg.a11y/
├── package.json
├── Runtime/
│   ├── EVG.A11y.asmdef
│   ├── EVGA11yTree.cs               ; namespace EVG.A11y
│   └── EVGA11yNode.cs
├── Editor/
│   ├── EVG.A11y.Editor.asmdef       ; includePlatforms: ["Editor"], references EVG.A11y
│   └── EVGA11yInspector.cs          ; namespace EVG.A11y.Editor
├── Documentation~/
│   ├── index.md
│   └── api.md
├── Tests/
├── CHANGELOG.md
└── LICENSE.md
```

`Documentation~` is the Unity convention — the trailing tilde keeps Unity from importing it
as assets, and the Package Manager can still open it. The point of the example is that the
author wrote `platform editor` and nothing else; the folder, the assembly, the namespace and
the `.asmdef` reference all came from the target configuration.

### 11.5 Worked case: Swift, where the module is the namespace

```ranger
target {
    language swift
    platform swiftpm

    swift {
        package "EVG"
        module "evg.a11y" {
            target  "EVGA11y"
            product "EVGA11y"
        }
    }
}
```

```text
Package.swift
Sources/
    EVGA11y/
        EVGA11yTree.swift
        EVGA11yNode.swift
        EVGA11y.docc/
            EVGA11y.md               ; from docs { }, §10
Tests/
    EVGA11yTests/
```

`evg.a11y` does **not** become `EVG.A11y` here. Swift has no namespace hierarchy: the
module is the namespace, and it is simultaneously a SwiftPM target and a product. This is
the case §7.2 exists for.

### 11.6 Worked case: Dart, where `public` writes a file

```ranger
target {
    language dart
    platform dart

    dart {
        package "evg_a11y"
        module "evg.a11y" { library "evg_a11y" }
    }
}
```

```text
evg_a11y/
├── pubspec.yaml
├── lib/
│   ├── evg_a11y.dart                ; generated barrel — public surface only
│   └── src/
│       ├── evg_a11y_tree.dart
│       ├── evg_a11y_node.dart
│       └── evg_a11y_index.dart      ; internal: compiled, never exported
├── test/
└── doc/api/                         ; dart doc output
```

The barrel file is generated in full from ApiIR (§5.1). The author never maintains an
export list, and an internal type can never leak into it, because §5.2 already rejected the
program that would have leaked it.

### 11.7 What is not in scope here

**Ranger emits one file per target today** (`-o=output.js`). Multi-file package layout is a
*packaging* feature: it is what a `.docc` catalog, a Dart barrel, a Unity `.asmdef` and a
Rust `lib.rs` need, but nothing about a doc comment requires it. Conflating the two would
make a cheap feature wait on an expensive one.

So documentation lands without layout (§14 phases A and B), the `module` declaration lands
with it because the *logical* identity is needed for the artifacts, and the language ×
platform split is real work with its own plan. `CodeWriter.getFileWriter(path, name)`
(`compiler/ng_writer.rgr:337`) already takes a path, and `-npm`
(`ng_RangerJavaScriptClassWriter.rgr:1531`) and `-pubspec` are the precedent that the
compiler already writes manifests next to output.

---

## 12. Benchmarks

Each of these is studied for one specific thing, and the acceptance criterion is §7.3.

| System | Ecosystem | What Ranger takes from it |
| --- | --- | --- |
| **documentation.js** (ISC) | JavaScript | The inference principle (§3), exported-only documentation, doc validation, one model → HTML/Markdown/JSON, and `documentation.yml` → §10. The best reference for **how `doc { }` should feel to write** |
| **DocFX** | C# / .NET | The metadata-stage-then-render seam → ApiIR (§7). Reads a compiled assembly plus XML docs, so it is the proof that a compiler-produced API model is a legitimate input |
| **Sandcastle / SHFB** | C# legacy | The same input format with a different consumer — evidence that XML documentation is the stable interface, not any one tool |
| **TypeDoc** + API Extractor | TypeScript | Typed API surface, release tags, and the `.api.md` report → §9.3 |
| **rustdoc** | Rust | The tightest compiler integration of any of them: doc tests, resolved intra-doc links, visibility straight from the language |
| **DocC** | Swift | `- Parameter` / `- Returns` structure, and catalogs/extensions → the §10 three-layer split |
| **Dokka** | Kotlin | Module and package Markdown alongside KDoc; multiple output formats from one model |
| **dart doc** | Dart | Library-level public surface, and the barrel-file idiom that makes `public` a packaging fact (§5.1) |
| **Javadoc** | Java | The oldest and most conservative structured vocabulary; a good floor for what must be expressible |
| **Doxygen** | C++ and others | What a *multi-language* documentation system gets wrong — a lowest-common-denominator model that serves no language idiomatically. The argument against Ranger writing its own renderer (§9.4) |

The first milestone that means anything, stated as a question:

> Can Ranger produce, from its own type-checked AST and a `doc { }` block, everything
> `documentation.js` produces from JSDoc text — **and** an idiomatic Java, C#, TypeScript,
> Swift, Kotlin and Dart API whose own documentation tool runs on it unmodified?

---

## 13. Command-line surface

| Option | Effect |
| --- | --- |
| `-docstyle=native` | Emit target doc comments and annotations in the code. Default |
| `-docstyle=none` | Emit no doc comments; ApiIR still feeds the artifacts |
| `-apidoc=<dir>` | Write the API artifacts to a directory |
| `-apiformat=json,markdown,report` | Which artifacts. Default `json,markdown` |
| `-platform=<name>` | The platform emitter (§11); defaults to the language's plain platform |
| `-apiscaffold` | Also write the target's doc-tool configuration |
| `-apistrict` | Undocumented public members and undocumented public parameters are errors |
| `-classdoc=<file>` | Unchanged; now fed by `description` |

---

## 14. Milestones

**Phase A — the language and the IR.** Detach pass, `RangerDocBlock`, descriptor fields,
validation, resolution, the §2.2 error, and [ISSUES.md #75](ISSUES.md) fixed. `-apidoc`
writes `api.json` and `api.md`. No writer changes. *All the leverage is here: the model, the
checks and the portable output, in one new pass and one new file.*

**Phase B — doc comments in the code.** `writeDocComment` / `writeDocAttrs` on the writers,
in benchmark order so each one can be validated against a real tool: C# (DocFX), TypeScript
(TypeDoc), Swift (DocC), Rust (`cargo doc`), Dart (`dart doc`), Kotlin (Dokka), Java
(javadoc), Python, Go, C++, PHP, Scala. Each is independent and testable on its own; a
writer without the hooks keeps today's behaviour.

**Phase C — visibility enforcement.** §5.1 emission and the §5.2 leak check. Held back from
Phase A because it changes generated code for existing programs (a Go method silently
becomes `Find`), so it wants its own release note.

**Phase D — artifacts and scaffolding.** `api.txt` in CI, the doc-tool configuration files.

**Phase E — `docs { }`.** §10, once there is an ApiIR to arrange.

**Phase F — language × platform.** §11. The largest piece, and a separate plan: multi-file
emission, platform emitters, Unity and Kotlin Multiplatform layouts. This document's job for
that phase is to have made sure ApiIR does not need to change when it arrives — which is
what §7.2 is for.

### 14.1 Tests

`tests/api-docs.test.ts` alongside `tests/docs-tools.test.ts`, plus a fixture pair under
`tests/fixtures/`: one documented source, one golden `api.json`, and a golden emission per
target in `tests/golden/`. The validation table in §6.3 is a row-per-test list, which is the
best kind of specification to hand a test file.

The Phase B acceptance test is not a golden file — it is running the target's own tool. CI
already installs several of these toolchains for the conformance suites.

The ISSUES.md #75 class miscompilation gets its own regression test regardless of what else
lands.

---

## 15. Risks

**`doc` is not reserved, and this makes it nearly reserved.** A user method named `doc` in
statement position at class body level already collides with the legacy `doc name "…"` form;
the tail form is unambiguous because it is inside another expression. The two existing
legacy uses (§1) migrate by hand. Low risk, but it belongs in the release note. `docs` (§10)
is currently used once, as an empty stub.

**Silent acceptance is the failure mode.** A doc block that binds to nothing, a `param` for a
renamed parameter, a `see` to a deleted class — each publishes something false. Every one is
in the §6.3 table as an error, and that table is the feature's real contract.

**The vocabulary will be asked to grow.** `category`, `example` and `see` are already at the
edge of what every target can render structurally. Two rules hold the line: §3 (no restating
what the compiler knows), and an entry earns its place only if at least three targets can
render it *structurally* rather than as prose. Everything else is `description` text or a
`target` block.

**Phase B is twelve writers.** It is the largest documentation piece and the least
interesting one. It can be delivered in any order and abandoned partway with no breakage,
which is why the renderer is shared and the hooks are optional.

**Phase F is a packaging project wearing a documentation hat.** Multi-file output, platform
emitters and Unity/KMP layouts are worth doing, and they are not this plan. The risk is
letting them block Phase A. §7.2 is the mitigation: get the canonical model right now, so
the layout work is additive when it comes.

---

## 16. Open decisions

1. **Field docs on records.** `record Point { def x:int 0 doc { … } }` — the tail parses on
   a field, but a record's fields are also its constructor parameters. Does a field doc
   double as the constructor parameter doc? Proposed: yes, and `Constructor … doc { param x … }`
   overrides it.

2. **Inheritance.** Does an overriding method inherit the base method's doc block when it has
   none? Java's `{@inheritDoc}` and C#'s `<inheritdoc/>` exist; Rust and Go have no such
   thing. Proposed: no implicit inheritance, an explicit `inherit` flag later if it is missed.

3. **`public` on a shape case.** A shape lowers to a record per case plus a union. Is the
   case public because the shape is, or independently? Proposed: the shape's `public` covers
   the whole family; a case may not be public on its own.

4. **Whether `-classdoc` is removed.** Superseded by `-apiformat=markdown`. Proposed: keep it
   working, document it as legacy, remove at the next major version.

5. **Python docstring style.** Google style is proposed in §8.1. NumPy style is the
   alternative and is better for numeric APIs. Proposed: Google, no option, until someone
   needs otherwise.

6. **How far `platform` goes.** §11.4 uses it for Unity's Runtime/Editor split, which is a
   real and common need. Whether it generalises — `platform android`, `platform ios` for
   Kotlin Multiplatform source sets — or stays a small closed set is a Phase F question, and
   getting it wrong early is expensive because it appears on declarations. Proposed: define
   `editor` now because Unity needs it, and leave the set open.

7. **Where the target configuration lives.** §11 spells it in Ranger source. It could equally
   be a `ranger.toml` or command-line flags. Proposed: in the source, because the module ↔
   package ↔ assembly ↔ namespace mapping is a property of the API, not of a build
   invocation — but this is the decision most likely to be revisited.


---

## 17. What shipped

Implemented on this branch, verified against the tools named in §12 rather than
against golden files alone.

### 17.1 Compiler

| Piece | Where |
| --- | --- |
| `doc { … }` model, reader, doc-comment renderers | `compiler/ng_RangerDocBlock.rgr` |
| ApiIR, builder, validation, artifacts, packaging | `compiler/ng_RangerApiDoc.rgr` |
| `DetachDocBlocks` pass, at the head of `CollectMethods` | `compiler/ng_RangerFlowParser.rgr` |
| `has_doc_tail` / `docNode` on a node | `compiler/ng_CodeNodeCompilerExtensions.rgr` |
| `has_doc` / `docBlock` on a descriptor | `compiler/ng_RangerAppParamDesc.rgr` |
| JSDoc emission | `compiler/ng_RangerJavaScriptClassWriter.rgr` |
| XML documentation, namespace, visibility | `compiler/ng_RangerCSharpClassWriter.rgr` |
| KDoc, package statement, visibility | `compiler/ng_RangerKotlinClassWriter.rgr` |
| DocC markup, visibility | `compiler/ng_RangerSwift6ClassWriter.rgr` |
| Google docstrings | `compiler/ng_RangerPythonClassWriter.rgr` |
| dartdoc comments | `compiler/ng_RangerDartClassWriter.rgr` |
| Pipeline and options | `compiler/VirtualCompiler.rgr` |
| Tests and fixtures | `tests/api-docs.test.ts`, `tests/fixtures/api_docs_*.rgr` |

### 17.2 Command line

| Option | Effect |
| --- | --- |
| `-apidoc=<dir>` | Write the API artifacts into that subdirectory of the output directory |
| `-apiformat=json,markdown,report` | Which artifacts. Default `json,markdown` |
| `-apipackage` | Also write the packaging the target ecosystem expects |
| `-apistrict` | An undocumented public declaration or parameter is an error, not a warning |
| `-csnamespace=<name>` | The C# namespace; defaults to `-name=` under `-apipackage` |
| `-ktpackage=<name>` | The Kotlin package; defaults to `-name=` under `-apipackage` |

### 17.3 JavaScript

```bash
node bin/output.js -es6 a11y.rgr -d=out -o=index.js -nodemodule \
  -apidoc=docs -apipackage -name=evg-a11y -version=1.2.0 -license=MIT
```

writes `index.js` with JSDoc, `package.json`, `README.md`, `docs/api.json` and
`docs/api.md`. In the package, `npm run docs` is `documentation build index.js
-f html -o docs/api`.

The JSDoc carries the compiler's types, never the author's: `@param {string} id`,
`@returns {EVGA11yNode}`, `@type {string}` on a field. `public` becomes `@public`
and a documented-internal member becomes `@private`, so a default
`documentation build` renders exactly the public API and `--private` renders
everything — which is the three-state model of §5 expressed in the tool's own
terms.

**Verified:** `documentation@14` builds JSON, Markdown and HTML from the output
with no configuration, and `documentation lint` reports nothing. Asserted in
`tests/api-docs.test.ts`; the two interop tests skip unless documentation.js is
installed (`npm i -D documentation`), because it is a 270-package tree and this
repository keeps six devDependencies.

One defect had to be fixed to get there. The compiler marks an unused member
with `/** note: unused */`, which is a **doc comment**: documentation.js
attached it to nothing and reported two anonymous symbols in the API. The same
markers exist in eleven writers, so Javadoc, KDoc, Doxygen and DocFX all had the
same hole. They are now `/* note: unused */`.

### 17.4 C#

```bash
node bin/output.js -l=csharp a11y.rgr -d=out -o=EvgA11y.cs \
  -apidoc=docs -apipackage -name=Evg.A11y -version=1.2.0 -license=MIT
```

writes `EvgA11y.cs` with XML documentation comments inside `namespace Evg.A11y { … }`,
plus `Evg.A11y.csproj`, `docfx.json`, `README.md` and the artifacts.

The csproj sets `<GenerateDocumentationFile>true</GenerateDocumentationFile>`,
which is the line the whole .NET documentation path depends on: without it the
compiler discards the comments and DocFX has nothing to read.

**Visibility is real on this target.** A C# type with no access modifier is
internal, so the writer's unconditional `public` was the only thing making the
output usable — and it made every implementation detail part of the assembly's
API. Now `public` in a doc block becomes `public` and everything else becomes
`internal`. The gate is the **class**: a class with no doc block is not opted
into the API model and keeps the previous all-public output exactly, so no
existing program changes.

**Verified:** `mcs -langversion:latest -doc:Evg.A11y.xml` compiles the output and
produces a well-formed XML documentation file. The C# compiler resolves
`see EVGA11yNode` to `<seealso cref="T:Evg.A11y.EVGA11yNode" />` — a fully
qualified reference it only emits for a type it found, so the cross-reference is
checked by two compilers rather than spelled by the author. That file plus the
assembly is exactly DocFX's and Sandcastle's input, with no Ranger-specific
plugin, which is §7.3 met for .NET.

A block namespace is emitted rather than the file-scoped C# 10 form: Mono's
`mcs` is a supported host for this repository and rejects `namespace X;`.

### 17.5 Kotlin

```bash
node bin/output.js -l=kotlin a11y.rgr -d=out -o=EvgA11y.kt \
  -apidoc=docs -apipackage -name=com.evg.a11y -version=1.2.0
```

writes `EvgA11y.kt` with `package com.evg.a11y` and KDoc, plus `build.gradle.kts`
(Kotlin JVM, Dokka, `maven-publish`), `module.md`, `README.md` and the artifacts.
`-name=` with a dot is read as a Maven coordinate: everything before the last dot
is the group, the last segment is the artifact.

Kotlin is the inverse of C# and Swift: it defaults to **public**, so the modifier
that has to be written is the restrictive one. A member without `public` in a
documented class becomes `internal`, and Dokka then leaves it out of the
rendered API entirely.

`deprecated` becomes `@Deprecated("…", ReplaceWith("find(id)"))`, and the
argument list in `ReplaceWith` is built from the **replacement's own signature**,
looked up in the class that declares it. If no such method exists the hint is
left out rather than guessed — a wrong `ReplaceWith` is a refactoring the IDE
will happily apply.

**Verified:** `kotlinc 2.0.21` compiles the output and it runs; `gradle dokkaHtml`
builds the HTML reference from the generated project with no Ranger-specific
configuration. The rendered `find` page carries the description, `Return`,
`Since 1.2`, the `Parameters` table and a resolved `See also` link to
`EVGA11yNode`; the `oldFind` page carries the deprecation with a copyable
`Replace with find(id)` action; `rebuildIndex` and `secretHelper` appear nowhere
in the output. With `kotlinc` on the PATH the repository's own Kotlin suites also
pass: `compiler-kotlin` 19/19, and 9 more tests in the process and chain suites
that had been skipping for want of a compiler.

The generated build script deliberately pins **no** `jvmToolchain(…)`. The first
version pinned 17, which failed the build before it compiled anything on a
JDK-21 machine with no toolchain repositories configured — a generated file
cannot know which JDKs are installed.

### 17.6 Swift

```bash
node bin/output.js -l=swift6 a11y.rgr -d=out -o=EvgA11y.swift \
  -apidoc=docs -apipackage -name=EVGA11y -version=1.2.0
```

writes `EvgA11y.swift` with DocC markup, `Package.swift`, a
`EVGA11y.docc/EVGA11y.md` catalog, `README.md` and the artifacts.

The catalog's `## Topics` section is grouped by the `category` entry of each
public type. That is the first thing in the implementation that uses `category`
for what §10 says it is for — a hint, consumed by the reference organisation,
not a property of the symbol.

`- Parameter` is used for a single parameter and `- Parameters:` for several,
which is what DocC expects. `since` becomes a `> Since:` **callout**, never
`@available`: that attribute is OS availability, not library version, and
emitting it would gate the symbol on a platform the author never mentioned.
Deprecation does become `@available(*, deprecated, renamed: "find", message: …)`.

Swift, like C#, defaults to internal, so `public` from a doc block is what makes
a module export anything at all.

**Not compiler-verified.** There is no Swift toolchain in this environment and
`download.swift.org` is blocked by the proxy, so the Swift output is asserted
structurally in `tests/api-docs.test.ts` and has not been through `swiftc` or
`swift package generate-documentation`. That is the one place in this work where
§7.3's criterion is claimed rather than demonstrated, and it should be run before
the Swift path is relied on.

`Package.swift` uses the flat layout — `path: "."` with the one generated file
named in `sources:` — because Ranger still emits one file per target. The
`Sources/<Target>/` tree is the multi-file layout, which is Phase F.

### 17.7 Python

```bash
node bin/output.js -l=python a11y.rgr -d=out -o=evg_a11y.py \
  -apidoc=docs -apipackage -name=evg-a11y -version=1.2.0
```

Python is the one target where the documentation is not a comment: a docstring
is the **first statement inside** the `def` or `class`, so the writer emits it
after the block is opened and indented rather than before the declaration.

Google style, because `sphinx.ext.napoleon`, pdoc and mkdocstrings all read it
and it is the one that stays readable in the source. The module declares
`__docformat__ = "google"` (PEP 258) — without it pdoc renders `Args:` as a line
of text instead of a section, and declaring it in the module is what keeps the
tooling free of project-specific configuration. `since` becomes
`.. versionadded::` and `deprecated` becomes `.. deprecated::`.

Deprecation is docstring-only. Emitting `warnings.warn(…, DeprecationWarning)`
would change what the program *does*, and a documentation flag must not.

`-apipackage` writes `pyproject.toml` and appends `__all__` built from the model.

**Verified:** `python3 -m py_compile` accepts the output, it runs, and
`python3 -m pdoc` renders the docstrings with `Args:` as a real section and
`.. versionadded:: 1.2` as "New in version 1.2".

### 17.8 Dart

```bash
node bin/output.js -l=dart a11y.rgr -d=pkg/lib/src -o=evg_a11y_impl.dart \
  -apidoc=docs -apipackage -name=evg_a11y -version=1.2.0
```

writes `pkg/pubspec.yaml`, `pkg/lib/evg_a11y.dart` and
`pkg/lib/src/evg_a11y_impl.dart`. The layout is not cosmetic: `dart doc`
documents the libraries under `lib/` **and nothing else** — a flat directory
gives "dartdoc could not find any libraries to document" — and it skips
`lib/src/` once the package resolves.

**This is where `public` writes a file.** Dart's only private form is a leading
underscore, which renames every call site, so the idiomatic package expresses
its API surface as an export list instead. Ranger generates it from the model:

```dart
library evg_a11y;

export 'src/evg_a11y_impl.dart'
    show EVGA11yNode, EVGA11yTree;
```

A barrel file is exactly the kind of list that rots when a person maintains it,
and it is derivable, so it is derived — the same argument as Python's `__all__`.

dartdoc has no `@param` tag; a parameter is documented in prose with the name in
brackets, which dartdoc resolves. `see` becomes `[Symbol]`, and `deprecated`
becomes `@Deprecated('…')`.

**Verified:** `dart analyze` reports no errors, and `dart pub get && dart doc`
reports *"Documented 1 public library"* — the package library, with `lib/src`
excluded — and puts `find` canonically under `evg_a11y/EVGA11yTree/find.html`
with its description, parameter, `Returns`, `Since 1.2` and a resolved
`See also` link.

`dart pub get` matters and is not incidental: without package resolution dartdoc
sees `file://` URIs, cannot tell `lib/src` from `lib`, names the implementation
library after its absolute path, and makes it canonical instead of the package
library. The first version of this work reached that state and looked wrong for
a reason that had nothing to do with the generated code.

### 17.9 What visibility does and does not reach

| Target | Type-level API surface | Member-level privacy |
| --- | --- | --- |
| C# | `public` / `internal` on the type | `public` / `internal` on the member |
| Swift | `public` / internal on the type | `public` / internal on the member |
| Kotlin | `internal` on the type | `internal` on the member |
| JavaScript | TSDoc `@public` / `@private` | TSDoc `@public` / `@private` |
| Dart | generated `export … show` list | **not implemented** |
| Python | generated `__all__` | **not implemented** |

Dart and Python express type-level API surface exactly as their ecosystems do,
and both are verified. Neither hides a **member** of a public type: Dart's
`_name` and Python's `_name` are the only mechanisms, and both rename the
symbol, so applying them means renaming every call site. That is a compiled-name
change with its own regression surface and it is not in this work. So
`rebuildIndex` still appears in the Dart and Python documentation of a public
class, and does not appear in the C#, Swift, Kotlin or JavaScript output.

### 17.10 Visibility: the rule and the bug it hid

One helper decides the modifier for every target
(`RangerDocCommentWriter.memberVisibility` / `classVisibility`), and it takes
**three** values, not two:

| | C# | Swift | Kotlin |
| --- | --- | --- | --- |
| class has no doc block (legacy) | `public ` | *(nothing)* | *(nothing)* |
| documented `public` | `public ` | `public ` | *(nothing)* |
| documented, or undocumented member of a documented class | `internal ` | *(nothing)* | `internal ` |

The legacy column is not the same as the public column, and the first version of
the helper conflated them. C# had written `public ` on everything, so reusing the
public form for the legacy case was invisible there — and on Swift it silently
turned **every undocumented class in every existing program** into `public`. The
byte-for-byte parity check against the previous compiler caught it; the test
suite did not. The three-value form is what the table above requires.

### 17.11 The bug this uncovered

[ISSUES.md #75](ISSUES.md) — `class X { … } doc { … }`, and any other trailing
`token { block }` on a class, made `EnterClass` take the trailing block for the
class body. The real body was never flow-analysed, the compiler reported
success, and `return (x + 1)` came out as `return+x1`. The detach pass removes
the shape for the documented case and `tests/api-docs.test.ts` holds a
regression test that compiles **and runs** the result. The underlying arity
check in `EnterClass` is still wrong for any other trailing token and is filed
separately.

### 17.12 Not built

Phases C (the remaining six targets), E (`docs { }`) and F (language × platform)
are unchanged from the plan above. JavaScript, C#, Kotlin, Swift, Python and Dart
carry doc comments; Go, Rust, Java, C++, PHP and Scala still emit exactly what
they emitted before.

Dart is the first target with a **real multi-file layout** (`pubspec.yaml`,
`lib/`, `lib/src/`), because `dart doc` does not work without one. It is written
by the package writer around output the compiler still emits as one file, not by
the multi-file emission of Phase F.

The type-leak check of §5.2 **is** implemented and runs for every target, because
it is the check that keeps a `public` Swift or Rust declaration from failing in
the target compiler rather than in Ranger.
