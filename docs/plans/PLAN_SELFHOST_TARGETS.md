# PLAN_SELFHOST_TARGETS — rendering this compiler to every target, and building it

> **Status: C++, Go, Python, Kotlin and C# build. Rust type-checks with 9
> known errors. Java produces a file for the first time and needs an
> `org.json` polyfill to finish. Dart, Swift and LLVM are unmeasured here for
> want of a toolchain.**

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
| Rust | yes | 9 rustc errors, known | `bash scripts/rust-selfhost-check.sh` |
| Java | yes, 223 files | 157 javac errors, 152 of them one missing dependency | see below |
| Dart | yes | `dart analyze` — no `dart` on this machine | `npm run selfhost:check:dart` |
| Swift | untested | no `swiftc` on this machine | — |

## What the last round fixed

**C# — two missing semicolons.** `Array.Copy(…)` and
`System.IO.File.WriteAllBytes(…)` are the C# spellings of `buffer_copy` and
`buffer_write_file`, both `void` operators that only ever appear as a
statement. The java7, Dart and PHP entries beside them carry a `;`; the C#
entries did not, so fifteen call sites in the compiler's own buffer and package
code were `mcs` syntax errors. The C# rendering of this compiler now builds.

**Java — four writer holes, and it produces a file at all.** Before this it
stopped in the type checker and wrote nothing:

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

## What Java still needs

`org.json` — 152 of the 157 remaining errors. Kotlin had the same problem and
solved it in `lib/JSON.rgr` with a ~180-line polyfill that declares
`JSONObject`, `JSONArray`, a reader and a writer, so a generated file builds
with a plain `kotlinc` line and no dependency. Java needs the same class set,
and the `java7` entries in `lib/JSON.rgr` need to stop importing
`org.json.*`. That is the whole remaining blocker and it is mechanical.

Five other errors, each its own small thing:

- `args` is only in scope inside `main` on Java, and two call sites outside it
  read the command line. Kotlin and Dart copy it into a `__g_args` global in
  `main`; Java has no file scope, so it needs a static holder.
- `charcode` returns a Ranger `char`, which is a `byte` here, and
  `def ch:int (charcode …)` is a widening every other target does implicitly.
- one `byte`/`char` narrowing in `DictNode`.
- one singleton class missing its generated `__singleton()`.

## How to check

```sh
npm run compile
npm run selfhost:check:cpp
npm run selfhost:check:go
npm run selfhost:check:python
npm run selfhost:check:kotlin      # needs kotlinc
npm run selfhost:check:csharp      # needs mcs
bash scripts/rust-selfhost-check.sh
# Java has no script yet, because it does not pass:
#   node bin/output.js -l=java7 ./compiler/Compiler.rgr -nodecli \
#     -d=./tmp/selfhost-java -o=ranger_compiler.java
#   javac -nowarn -Xmaxerrs 10000 -d tmp/selfhost-java/cls \
#     $(find tmp/selfhost-java -name '*.java')
```

Related: [PLAN_RUST_SEMANTIC_IDIOMS.md](PLAN_RUST_SEMANTIC_IDIOMS.md),
[`gallery/friendly/README.md`](../../gallery/friendly/README.md).
