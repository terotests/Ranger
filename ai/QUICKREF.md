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
node bin/output.js -l=es6 ./hello.rgr -o=./bin/hello.js
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

A call that yields a value needs its own parentheses:
`return (this.helper())` — see [FAQ](https://terotests.github.io/Ranger/docs/faq/#why-does-my-call-not-compile).

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
