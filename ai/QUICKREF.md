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

## Closed variants (shape)

```ranger
shape Value {
    group Ref { def identityId:int 0 }   ; named subset + shared fields
    case Nothing                          ; no fields
    case Num  { def value:double 0.0 }
    case Items does Ref { def items:[Value] }
}

def n:Value.Num (new Value.Num(2.5))      ; ctor takes the fields in order

match v {                                 ; every case, exactly once, no `_`
    Nothing | Num  { out = "scalar" }     ; one arm, two cases
    Value.Items a  { out = (to_string (array_length a.items)) }
}

(Value.equals a b)                        ; content for value cases,
(Value.notEquals a b)                     ; identity for reference cases
```

`Value` / `Value.Num` / `Value.Ref` are all types. A case holding only scalars
is a value case (immutable, compares by content); `@(value)` / `@(reference)`
override. A shape is top-level only and holds no methods.

## Unions and identity

```ranger
union Item ( Circle Label )   ; a type over classes that already exist
case it c:Circle { }          ; narrow a union (no exhaustiveness check)
(identical a b)               ; same object? (`==` is not identity everywhere)
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
