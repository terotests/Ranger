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

## Persistent collections

Two worlds, spelled differently. `[T]` is the mutable array it has always been;
`#[T]` is a persistent value — an operation on it never changes the value it was
given. Needs `Import "ImmutableVector.rgr"`.

```ranger
[int]            ; mutable array
[string:User]    ; mutable map

#[int]           ; persistent vector
#[string:User]   ; persistent map
```

```ranger
def a:#[int] (new Vector@(int))
def b (conj a 4)          ; append      -> new value, a unchanged
def c (assoc b 1 20)      ; replace idx -> new value, b unchanged
def d (removeAt c 0)      ; drop idx    -> new value (O(n))

def m:#[string:int] (new Map@(string int))
def m1 (assoc m "a" 1)    ; set key
def m2 (dissoc m1 "a")    ; drop key

(itemAt a 0)  (size a)  (array_length a)
```

A class field declared `#[T]` starts as an empty persistent collection, so no
initializer is needed:

```ranger
class AppState@(immutable) {
  def loading:boolean false
  def tags:[string]      ; ordinary array — `for`, `push`, replaced wholesale
  def rows:#[string]     ; structural sharing
}
```

`@(immutable)` generates a `set_<field>` per field, each returning a **new**
instance sharing everything it did not change:

```ranger
def s1 (s0.set_loading(true))
def s2 (s1.set_rows(rows2))
; s1.rows == s2.rows when rows did not change — a renderer can skip that branch
```

Cost: `conj` / `assoc` on a vector share structure; `removeAt` rebuilds, and
every `Map` operation copies the whole map (copy-on-write, not a HAMT).

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
