# Ranger Quick Reference

Offline card for agents. Prefer the
[FAQ](https://terotests.github.io/Ranger/docs/faq/) and the
[docs site](https://terotests.github.io/Ranger/docs/) when online.
Repo gotchas: [`../AGENTS.md`](../AGENTS.md).

## Compile

```bash
# From npm: ranger-compiler / rgrc
rgrc hello.rgr -l=es6 -d=./bin -o=hello.js

# From a checkout (after npm run compile)
node dist/rgrc.js -l=es6 ./hello.rgr -o=./bin/hello.js
```

| Flag | Target |
| --- | --- |
| `-l=es6` | JavaScript (add `-typescript` for `.ts`) |
| `-l=python` | Python 3 |
| `-l=go` | Go |
| `-l=kotlin` | Kotlin |
| `-l=csharp` | C# |
| `-l=rust` | Rust |
| `-l=dart` | Dart |
| `-l=swift6` / `-l=swift3` | Swift |
| `-l=cpp` | C++14 |
| `-l=java7` | Java |
| `-l=scala` | Scala |
| `-l=php` | PHP |

Always pass `-o=` with the **full filename and extension**. Sources use **`.rgr`**.

## File shape

```ranger
Import "OtherFile.rgr"

Enum Color ( Red Green Blue )

record Point {
    def x:int 0
    def y:int 0
}

class App {
    def items:[string]

    Constructor () {}

    fn greet:string (name:string) {
        return ("hello " + name)
    }

    sfn main:void () {
        print ( (new App).greet("world") )
    }
}
```

`sfn main:void ()` is the entry point (`@(main)` is applied automatically when
the name is `main`). Older `sfn m@(main):void ()` still works.

## Types

```
int  double  string  boolean  char  charbuffer  void
[T]          ; array
[K:V]        ; map
fn:T (p:T)   ; function type
```

`string` is text and `charbuffer` is bytes — one element of a charbuffer is
one octet, not one character. See "Strings" below for the three views of text
and the conversions between them.

```ranger
def x 10
def x:int 10
def maybe@(optional):string
def counter@(mutable):int 0
```

## Control flow

```ranger
if (cond) { } { }           ; if / else
if! (cond) { }              ; if NOT
while (cond) { }
for list item:T i { }
switch val { case x { } default { } }
break
continue
```

## Expressions

```ranger
(operator arg1 arg2)        ; S-expression (always valid)
(a + b)  (a - b)  (a * b)
(a / b)                     ; real division
(idiv a b)                  ; integer division
(a == b)  (a != b)  (a < b)
(a && b)  (a || b)  (! a)
(? cond then else)
```

A call on a dotted receiver may be written bare: `return this.helper()`,
`def v:int (this.helper() + 1)`. A callee that is not dotted — a lambda in a
local — still needs its own parentheses: `return (fn1(3))`. See
[FAQ](https://terotests.github.io/Ranger/docs/faq/#why-does-my-call-not-compile).

## Classes and records

```ranger
def obj (new MyClass)
def obj (new MyClass(arg))
obj.method()
MyClass.staticMethod()
Extends(ParentClass)

def p (new Point(3 4))      ; record: positional
```

## API documentation (`doc` tail)

```ranger
fn find:Node ( id:string ) {
    ...
} doc {
    public                       ; -> part of the exported API
    description "Finds a node."
    param id "The identifier."   ; NEVER `param id string "…"` -- the
    returns "The matching node." ; compiler already knows the type
    since "1.2"
    see Node
    example findExample          ; a FUNCTION, compiled and type checked,
                                 ; rendered per target, then left out of the
                                 ; output (-keep-examples puts it back)
    deprecated { since "2.0" use "find" description "Use find instead." }
}
```

Goes after the body, on the same line as the closing `}`. Valid on `fn`, `sfn`,
`Constructor`, `class`, `record`, `shape`, `enum`, `module` and a class-level
`def`. A `doc` block on its own line binds to nothing and is an error.

```text
no doc block        -> internal, undocumented
doc { … }           -> documented, internal
doc { public … }    -> exported public API
```

`-apidoc=<dir>` writes `api.json` / `api.md`; `-apipackage` writes the packaging.
JavaScript gets JSDoc (documentation.js), C# XML docs (DocFX), Kotlin KDoc
(Dokka), Swift DocC, Python Google docstrings (pdoc), Dart dartdoc. On Dart and
Python `public` also generates the export list (`export … show`, `__all__`).

## Generic classes

```ranger
class History @params(Op) {     ; declare with @params
    def ops:[Op]                ; T as an array element
    fn record:void (op:Op) {    ; …as a parameter
        push ops op
    }
    fn newest:Op () {           ; …and as a return type
        def v:Op (last ops)
        return v
    }
}

def h:History@(int) (new History@(int) ())     ; instantiate with @(...)
def rows:History@([string]) (new History@([string]) ())
def byId:Store@([string:int]) (new Store@([string:int]) ())
```

Also allowed: `[string:T]` fields, a constructor with arguments, `Extends`, one
generic class holding another at its own parameter (`def slot:Cell@(T)`), an
instantiation as a collection element (`def kids:[Tree@(T)]`,
`def byName:[string:Tree@(int)]`), and a generic class naming itself.

No bounds, no constraints, no variance. Each instantiation is expanded into a
concrete class (`History_int`, `History_arr_string`) before codegen, so every
target sees ordinary classes. Traits take `@params` the same way.

**No static side:** `sfn` in a generic class is unreachable — only the
instantiations exist. Put statics on a plain class beside it.

## Arrays

```ranger
def arr:[int]
([] 1 2 3)                  ; literal (type from items)
([] _:string ( "a" "b" ))   ; typed literal — group required

push arr 1
(itemAt arr 0)
(array_length arr)
set_at arr 0 99             ; or: set arr 0 99
remove_index arr 0
removeLast arr
clear arr
for arr item:int i { }
```

## Maps

```ranger
def map:[string:int]
set map "k" 1
(get map "k")               ; optional
(has map "k")
(keys map)
remove map "k"
```

## Optionals

Prefix form only:

```ranger
(null? opt)
(!null? opt)
(unwrap opt)                ; or (!! opt)
(?? opt default)
```

Inside `if (!null? obj) { … }` (or `if obj`, or an `&&` of `!null?` checks)
`obj.field` and `obj.method()` need no `unwrap`, also under `-strict`, and
`def o:T obj` takes the value. Not narrowed yet: `||`, code after an early
`return`, the else branch, and optional int/double values.

```ranger
def model@(late):Model     ; set by attach() before use; -strict accepts reads
```

A field without a value that the constructor always assigns needs no
`@(late)`: `-strict` sees the assignment.

## Strings

```ranger
(strlen s)
(substring s start end)
(charAt s i)
(at s i)
(strsplit s delim)
(trim s)
("a" + "b")
```

**An index does not mean the same thing on every target.** `strlen`, `charAt`,
`substring`, `indexOf` and `charcode` agree with each other on any one target,
and disagree between targets: a UTF-16 code unit on JavaScript, Java, Kotlin,
C#, Dart and Swift; a Unicode code point on Python; a UTF-8 byte on C++, PHP,
Rust and Go. So `(strlen "a—b")` is 3 or 5 depending on where it runs, and an
index-based scan over non-ASCII text lands in different places.

`tests/fixtures/string_units.rgr` prints what the target it was compiled for
actually does, and `tests/string-units.test.ts` pins it. Write ASCII-only
scans with `charAt`, use `to_chars` for text that may not be ASCII, and see
`docs/plans/PLAN_STRING_INDEXING.md` for the rest.

`-strict-strings` lists the sites where the unit is *observable* — where the
answer, not just the number, changes with the target. It proves the rest
quiet: an ASCII literal, `(strlen s) == 0`, a length that indexes some
string, an index that bounds a scan. What is left is a length nothing
indexes with (a column, a width, a padding count) or a code-point offset
handed to `charAt`. A length compared against a constant or against another
length is listed separately as a note. The compiler itself reports zero.

Where the provenance crosses a function boundary — a scan position held in a
field, a length handed in as a parameter — the pass cannot follow it. Say so
in the source and it stops asking:

```ranger
def srcLen@(units):int (strlen src)   ; a position, checked
fn getColumn@(units):int (sp:int) {   ; ...or a whole function
```

Three explicit conversions DO mean the same thing everywhere. `char_length`
is the count of characters — code points — for anything a person sees:

```ranger
def w:int (char_length line)         ; a column: same number everywhere
def n:int (strlen line)              ; a scan bound: the target's own unit
```

`to_chars` is
the portable indexable view — Unicode code points, built once in O(n) and
read in O(1) — and is what text a human wrote should be walked with:

```ranger
def cs:[int] (to_chars s)            ; code points, same on every target
def n:int (array_length cs)
def c:int (itemAt cs 0)
```

A `charbuffer` is a buffer of **bytes** — one element is one octet, 0..255,
not a character. `Vec<u8>`, `[]byte`, `Uint8Array`, `bytes`, `byte[]`,
`[UInt8]`, `List<int>`, depending on the target; the same type whether the
bytes came from a file, a socket or a piece of text.

Text and bytes are separate, and the two operators that cross between them
are the ones that name an encoding — UTF-8, because a conversion cannot be
done without choosing one:

```ranger
def b:charbuffer (to_charbuffer s)   ; text -> its UTF-8 bytes
def n:int (length b)                 ; how many BYTES
def c:int (charAt b 0)               ; ONE byte, 0..255
def back:string (to_string b)        ; bytes -> the text they encode
def head:string (substring b 0 1)    ; the text THAT RANGE encodes
```

So UTF-8 is a property of the conversion, not of the buffer: a `charbuffer`
holding a PNG is bytes, and `to_string` on it means nothing. And `charAt` on
one is a byte, so copying a buffer back into text one element at a time
decodes each byte of a multi-byte character on its own and gets a
replacement character for each — walk the `string` when the subject is text.

Above the Basic Multilingual Plane the three views differ by construction:
`"a😀b"` is 3 `to_chars` elements, 6 `to_charbuffer` bytes, and 3 or 4 `strlen`
units depending on the target.

An index is **O(1) on every target**, because each one uses the unit its own
string is made of. `gallery/friendly/bench/strscan.rgr` measures it: it used
to be O(n) on Rust and Go — `s.chars().nth(i)` and `[]rune(s)[i]` both walked
from the start — which made the ordinary
`while (i < (strlen s)) { charAt s i }` loop quadratic there.

## I/O and errors

```ranger
print "message"
(read_file path name)       ; optional string
write_file path name data
(file_exists path name)

try { } { }
throw "error"
(error_msg)
```

## Lambdas

```ranger
def fn1 (fn:int (p:int) { return (p + 1) })
fn1(3)
callback({ print item })
```

## Common operators

```
Arithmetic: + - * / idiv %
Comparison: == != < <= > >=
Boolean:    && || !
Math:       sin cos tan sqrt floor ceil (M_PI)
Convert:    to_int to_double to_string str2int
```

Full list: [operator reference](https://terotests.github.io/Ranger/docs/reference/operators/statements/).

## Introspection (IDE / AI)

```typescript
const result = await compileForIntrospection(sourceCode);
classHasProperty(result, "MyClass", "propName", "string");
classHasMethod(result, "MyClass", "methodName", "int");
getTypeAtPosition(rootNode, sourceCode, line, column); // 1-based
```

See [`INTROSPECTION.md`](INTROSPECTION.md).
