# PLAN_SELFHOST_TARGETS — rendering this compiler to every target, and building it

> **Status: C++, Go, Python, Kotlin, C#, Java and Rust all build. Dart, Swift
> and LLVM are unmeasured here for want of a toolchain.**

The strongest test a target writer has is the compiler's own sources: 60-odd
`.rgr` files, every operator, every shape, every optional, 60–90 thousand lines
of output. A study in `gallery/friendly` is eleven small programs; this is the
whole language at once, and it finds what the studies cannot.

## Where each target stands

| Target | Generate | Build | Command |
| --- | --- | --- | --- |
| C++ | yes | `g++ -fsyntax-only` clean | `npm run selfhost:check:cpp` |
| Go | yes | `go build` clean | `npm run selfhost:check:go` |
| Python | yes | `py_compile` clean | `npm run selfhost:check:python` |
| Kotlin | yes | `kotlinc` clean | `npm run selfhost:check:kotlin` |
| C# | yes | `mcs` clean | `npm run selfhost:check:csharp` |
| Rust | yes | `rustc` clean, and the binary runs | `bash scripts/rust-selfhost-check.sh` |
| Java | yes, 228 files | `javac` clean | `npm run selfhost:check:java` |
| Dart | yes | `dart analyze` — no `dart` on this machine | `npm run selfhost:check:dart` |
| Swift | untested | no `swiftc` on this machine | — |

## What the last round fixed

**C# — two missing semicolons.** `Array.Copy(…)` and
`System.IO.File.WriteAllBytes(…)` are the C# spellings of `buffer_copy` and
`buffer_write_file`, both `void` operators that only ever appear as a
statement. The java7, Dart and PHP entries beside them carry a `;`; the C#
entries did not, so fifteen call sites in the compiler's own buffer and package
code were `mcs` syntax errors. The C# rendering of this compiler now builds.

**Java — six writer holes, before it produced a file at all.** Before these
it stopped in the type checker and wrote nothing:

1. **`sort` had no `java7` template.** The operator did not match, and
   `FlowCollect` — which sorts the serialized classes topologically — stopped
   the whole run. Java 7 has no lambdas, so the callback arrives as a
   `LambdaSignature` object; the entry wraps it in a `java.util.Comparator`
   and sorts a copy, because `sort` leaves its argument alone on every other
   target.
2. **`(atype N)` wrote nothing, on every target.** It resolved the element
   type through `LiveCompiler.getTypeString`, which is a stub that returns
   `""`. Its only other use in the tree is a commented-out Scala line, so the
   template function had never worked. It goes through the language writer
   now.
3. **A map whose value is a collection kept its Ranger spelling.**
   `def m:[string:[string]]` became `HashMap<String,[string]>`. The flow
   parser has fifteen of those.
4. **A captured mutable local put its subscript on the wrong side.** Java 7
   boxes one in a one-element array, and the writer emitted
   `[0]stdCode.children.add(…)` instead of `stdCode[0].children.add(…)`.
5. **The plugin systemclass had no `java7` entry**, so the writer crashed with
   `Cannot read properties of undefined (reading 'split')` rather than
   emitting anything. An external plugin is an npm package, so Java says what
   C++, Go, Dart, Python, C# and Kotlin already say: there is no plugin host
   here.
6. **`Optional.isPresent()` on Java 7.** Six templates called it. It is a
   Java 8 type, and an optional on this target is a nullable reference or a
   boxed primitive — which is what `null?` already compares against.

## What Java needed, and got

**`org.json` — 152 of the 157.** The JSON systemclasses named `JSONObject` and
`JSONArray` and the java7 entries imported them from `org.json`, a Maven
dependency nothing puts on a plain `javac` line. Kotlin had the same problem
and solved it in `lib/JSON.rgr` with a polyfill declaring the classes; Java
writes one public type per file, so the writer emits `JSONObject.java`,
`JSONArray.java`, `JSONException.java` and `RgJson.java` itself when the
program uses JSON, and the `(imp "org.json.…")` lines are gone. The set is the
API the java7 templates actually call: `isNull` (by key and by index),
`optString` / `optInt` / `optDouble` / `optBoolean` returning boxed values so
`o.isNull(k) ? null : o.optInt(k)` types, `getJSONObject`, `getJSONArray`,
`put`, `names`, `length`, `get`, a `toString` that writes JSON and a
constructor that reads it.

**The command line.** `args` is a parameter of `main` on Java, so a class
method that reads it cannot. Kotlin and Dart copy it into a file-scope global;
Java has no file scope, so `RgArgs.java` holds a static field that `main`
assigns as its first statement.

**`@singleton(true)` had no accessor.** Call sites already wrote
`ClassName.__singleton()` through the ordinary static path and the definition
was simply missing, exactly as it had been on C#.

**A Ranger `char` is an `int` here now, not a `byte`.** The operators that make
one are declared to return `char` while the code that reads it says
`def ch:int`. Java widens `byte` to `int` freely but BOXES it to `Byte`, so
`Integer ch = someByte` is a type error and `Integer ch = someInt` is not.
`chararray` stays `byte[]`, and `strfromcode` casts.

**`final` on an assigned parameter.** Every parameter carried `final`, which is
what lets an inner class capture one — Java 7 requires it and the lambda
lowering depends on it. Two methods rebind their parameter, which `final`
forbids, so the ones with `set_cnt > 0` no longer get it.

**Four unreachable statements**, all in the compiler's own sources and all dead
on every target: two abandoned tails after a `return`, and two `switch`es whose
`default` arm returned the same value as the line below it. javac is the only
target that says so. The dead tails are deleted and the duplicated fallbacks
folded into the one place Ranger requires a function to have one.

## Rust — one operator, nine errors

All nine were the same template. `remove_at` wrote
`xs.remove(i as usize)`, and `as` binds tighter than `-` in Rust, so
`children.remove(cnt - 1 as usize)` parsed as `cnt - (1 as usize)`: an `i64`
minus a `usize`, which is three errors per site and there were three sites.
Parenthesising the index is the whole fix. `rustc --emit=metadata` is clean
now, a full `rustc -o` produces a binary, and the binary runs.

## How to check

```sh
npm run compile
npm run selfhost:check:cpp
npm run selfhost:check:go
npm run selfhost:check:python
npm run selfhost:check:kotlin      # needs kotlinc
npm run selfhost:check:csharp      # needs mcs
npm run selfhost:check:java        # needs javac
bash scripts/rust-selfhost-check.sh
```

Related: [PLAN_RUST_SEMANTIC_IDIOMS.md](PLAN_RUST_SEMANTIC_IDIOMS.md),
[`gallery/friendly/README.md`](../../gallery/friendly/README.md).
