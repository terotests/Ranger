# Engine bugs found by running real programs

A record of correctness bugs found in `ComponentEngine` (and the Ranger
compiler's build) by running real third-party libraries and the compiler's own
output on the engine, rather than by extending a test corpus.

The pattern worth keeping: **every one of these was invisible to the
conformance suite and obvious within minutes of running a real program.** A
suite made of small probes exercises one execution tier, one call shape and one
scope depth at a time. Real code combines them, and that is where these lived.

Each entry states the symptom as it was first seen, the actual cause, and the
commit. All are fixed with regression coverage.

---

## 1. A pooled call frame kept its `const` marks

**Symptom** — `Assignment to constant variable` thrown from `let c = …; c = …`,
in a function with no `const` in it. Depended on call order and only appeared
after the program had been running for a while.

**Cause** — `EvalContext.resetForPool` cleared `bindings` and `slotNames` but
not `constNames`. A recycled frame therefore carried one function's `const c`
into the next call that reused it.

Found by running the Ranger compiler on the engine; its Lisp parser hit it in
`skip_space` / `getOperator` / `parse`. Diagnosis and fix both came from that
run.

`042cd5e7`

## 2. An array mutator reached through a property read mutated a copy

**Symptom** — `o.q.shift()` returned the element and left `o.q` untouched.
`while (next = queue.shift())` never terminated.

**Cause** — a handle is not the array. Reading `o.q` mints a fresh `EvHandle`
over the same store, and `arrSetItems` — which `shift`, `unshift`, `splice`,
`reverse`, `sort`, `fill` and `copyWithin` are all built on — assigned a **new
body to the handle** instead of refilling the item list. Only that temporary
saw the mutation. `push`/`pop` were unaffected because they mutate the list
itself, which is why the split showed only through a property read.

Found loading **marked**: it drains its inline-token queue with
`while (next = this.inlineQueue.shift())`, so `# Hello` became ~1e6 characters
of repeated text — 100000 passes over the same queue entry, the engine's
iteration cap.

`b7a323c9`

## 3. A guest binding lost to a built-in global of the same name

**Symptom** — HTML escaping silently became URL escaping (`Hello%20world`).

**Cause** — the global-call chain in `evaluateCallExpr` matched on the **name
alone**, so a program declaring its own `escape` never had it called. Every
name in that chain — `Object`, `String`, `Date`, `parseInt` — is an ordinary
identifier a program may rebind.

Found in **marked**, which defines its own `escape` at module scope.

`b7a323c9`

## 4. `await` lost its value

**Symptom** — `await Promise.resolve("hello")` answered `undefined`; in a loop,
literally `nullnullnull`.

**Cause** — the resumption did not carry the resolved value back to the binding.
Return position worked; binding position did not.

Master-only; already fixed on the branch by the time it was reported. Measured
by building both engines and running the same 20 shapes against each. Pinned
afterwards, because the shape that mattered — `const c = await ops.read(p)` in
a prototype method — was not covered.

## 5. `type` was treated as a keyword in value position

**Symptom** — `var type = 1; type = 2;` failed with
`expected Identifier but got Punctuator`.

**Cause** — statement parsing took the TypeScript type-alias branch on the word
alone. `type` is contextual: it opens an alias only when an alias **name**
follows.

Found loading **acorn**, whose `pp.readWord` does `type = keywords[word]`.

`ba3e5fdd`

## 6. A string literal spelling a keyword was parsed as that keyword

**Symptom** — `"function";` as an expression statement failed to parse.
`"class";` tried to parse a class, `"if";` demanded a `(`, `"return";`
returned.

**Cause** — a string token's *value* is its text, and the statement dispatcher
compared that value against the keyword list. A literal always begins an
expression.

Minified UMD opens with exactly this shape (`"function"==typeof exports`), so
bundles died on their first line.

`41d66547`

## 7. The comma operator was rejected in statement heads

**Symptom** — `if (a, b)` failed with `expected ')' but got ','`; `if ((a, b))`
worked.

**Cause** — `if`, `while`, `do…while`, `switch`, `case`, `throw` and for-in's
RHS all take a full `Expression` per the grammar, but their parentheses are
**statement syntax** — nothing re-enters the sequence parser for them, so each
stopped at `AssignmentExpression`. for-`of` correctly keeps
`AssignmentExpression`, where an unparenthesised comma is a `SyntaxError` in
Node too.

A parenthesised `case` test was separately broken in both directions: the arrow
lookahead read the clause's `:` as a TypeScript return-type annotation, so
`case (2):` never matched, comma or not.

`41d66547`

## 8. Duplicate function declarations in a block were rejected

**Symptom** — `'d' has already been declared` on regenerator-built bundles.

**Cause** — two function declarations in one block are legal in **sloppy** code
(annex B: the second wins) and an error only in **strict** code, where a block
function is lexical. The check did not distinguish.

Blocked date-fns and ajv.

`41d66547`

## 9. A parse failure was invisible, and sticky

**Symptom** — a bundle that failed to parse looked exactly like one that
loaded.

**Cause** — two separate faults. `loadScript` cannot raise (there is no `throw`
to the host from engine source), so the only signal was a printed line. Worse,
the parser instance is **reused** and `initParser` never reset `errorCount`, so
one bad bundle caused every later script on that engine to be refused, however
well it parsed.

`lastSyntaxError` now carries the first diagnostic, and the count resets per
parse.

`41d66547`

## 10. The native bridge was reachable only from the walker

**Symptom** — `__host_exists is not defined`, from a call that worked at top
level.

**Cause** — `setNativeBridge` is how a host installs functions a guest can
call, and the bridge was consulted at exactly one place: the walker's bare-name
call. Called from a **compiled** body the name raised before anything could ask
the bridge; held in a variable the value's own name was never consulted.

Found running the compiler on the engine: its `fs` shim is a plain object whose
methods compile.

`65e6ede3`

## 11. `return ";"` returned undefined

**Symptom** — `Unexpected compiler error: Cannot read properties of undefined
(reading 'charCodeAt')`, with no stack, during code generation.

**Cause** — the return parser decides "no argument" by comparing the next
token's **value** against the statement terminators, and a string literal's
value is its text. `return ";"` and `return "}"` were read as argument-less
returns. `throw` had the same test.

Any writer that emits a statement terminator hits this. The JS writer's
`lineEnding()` returns `";"`, the override answered `undefined`, and codegen
died downstream. `""` returned fine, which is why the base class worked and
only the override looked broken — and why a trivial program compiled while
every real one failed.

`5e251073`

## 12. Callable proxies could not be called through `call`/`apply`/`bind`

**Symptom** — `p.call(o)` answered `call is not a function`, though `typeof p`
said `"function"` and `p.call` read back a function.

**Cause** — all three are `Function.prototype`'s, and the branch that owns them
gates on `isFunction()`. A proxy is an object. `bind` needed more: it copies the
proxy marker onto a function stub, so the result stopped being an object and was
no longer recognised.

`76f7e2e7`

## 13. A tagged template's strings object was neither frozen nor cached

**Symptom** — the same literal handed back a fresh object on every call, which
template-caching libraries key on.

Fixing it exposed a much larger fault: the **bytecode tier stored array elements
without consulting any write-refusal rule**, so `Object.freeze(a)[0] = 'Z'` took
inside a function while the identical line at top level was ignored.

`99c53faa`

---

## Compiler build, not the engine

## 14. `bin/output.js` was not reproducible from its own source

**Symptom** — none visible. The build was green.

**Cause** — the `.rgr` source of `tryDesugarNewMethodChain` was a
`return false` stub, and `scripts/patch-chain-desugar.js` spliced ~50
hand-maintained lines of JavaScript into the emitted compiler after every
build. The shipped compiler could desugar `new`-expression method chains; one
built from source silently could not, so `(new X()).a().b()` compiled under the
released compiler and not under a rebuild of it.

The stub's "bootstrap compiler cannot emit this yet" comment was stale — the
statement-level form of the same desugar had been in `RangerFlowParser` all
along. Written in Ranger, the patch retired, and verified as a bootstrap:
**gen2 == gen3, byte for byte.**

`c2102139`

---

## Self-hosting status

`gallery/game_engine/v2/interp/bench/self_host/` runs the compiler on the
engine and diffs every emitted file against the same compile run natively.

| Input | Engine | Node | Output |
|---|---|---|---|
| hello (5 lines) | ~35 s | ~0.9 s | byte-identical |
| `chain_fluent_builder.rgr` | ~70 s | ~1 s | byte-identical (534 B) |
| `process_nesting.rgr` (process/actor feature) | ~93 s | ~1 s | byte-identical (42,639 B) |
| the compiler itself (76 files, 5 MB) | see below | ~9 s | not established |

The compiler compiling **itself** on the engine is not established here. Two
attempts exhausted the heap — OOM at a 12 GB cap after ~6 minutes and again at
13.6 GB on a 15 GB machine, with V8 spending ~96 % of its time in GC. A third
attempt with the parser fix in place ran past 35 minutes without dying and had
not finished at the time of writing, so the question is open rather than
answered either way.

What *is* established: the engine runs the compiler correctly and compiles real
programs to byte-identical output. Whether the compiler's own 5 MB working set
fits is a question about the engine's memory model, not its correctness.
