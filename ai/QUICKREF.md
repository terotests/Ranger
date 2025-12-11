# Ranger Quick Reference

## File Structure

```clojure
Import "dependency.clj"     ; imports

Enum MyEnum ( Val1 Val2 )   ; enum

class MyClass {             ; class
    def prop:Type value     ; property
    Constructor (p:T) {}    ; constructor
    fn method:T () {}       ; instance method
    sfn static:T () {}      ; static method
}

operators { ... }           ; custom operators
```

## Types

```
int, double, string, boolean, char, charbuffer, void
[T]              ; array of T
[K:V]            ; map with K keys, V values
fn:T (p:T)       ; function type
```

## Variable Declaration

```clojure
def x 10                    ; inferred type
def x:int 10                ; explicit type
def x@(optional):T          ; optional
def x@(mutable):int 0       ; mutable (for reassignment)
```

## Control Flow

```clojure
if (cond) { } { }           ; if/else
if! (cond) { }              ; if NOT
while (cond) { }            ; while loop
for list item:T i { }       ; for loop
switch val { case x { } default { } }
break                       ; break loop
continue                    ; continue loop
```

## Functions

```clojure
fn name:ReturnType (p1:T1 p2:T2) { return value }
sfn staticName:T () { }     ; static function
sfn m@(main):void () { }    ; entry point
```

## Expressions

```clojure
(operator arg1 arg2)        ; S-expression
(a + b), (a - b)           ; math (infix in parens)
(a == b), (a != b)         ; comparison
(a && b), (a || b)         ; boolean
(? cond then else)         ; ternary
```

## Classes

```clojure
def obj (new MyClass)       ; no-arg constructor
def obj (new MyClass(arg))  ; with args
obj.method()                ; call method
MyClass.staticMethod()      ; static call
Extends(ParentClass)        ; inheritance
```

## Arrays

```clojure
def arr:[T]                 ; declare
push arr item               ; add
(itemAt arr 0)              ; get
(array_length arr)          ; length
set arr i val               ; set element at index
remove_array_at arr i       ; remove
for arr item:T i { }        ; iterate
```

## Maps

```clojure
def map:[string:T]          ; declare
set map "key" value         ; set
(get map "key")             ; get (optional)
(has map "key")             ; exists?
(keys map)                  ; get keys
remove map "key"            ; remove
```

## Optionals

```clojure
(null? opt)                 ; is null?
(!null? opt)                ; is not null?
(unwrap opt)                ; get value
(opt ?? default)            ; elvis operator
```

## Strings

```clojure
(strlen s)                  ; length
(substring s start end)     ; slice
(charAt s i)                ; char code
(at s i)                    ; char as string
(strsplit s delim)          ; split
(trim s)                    ; trim
("a" + "b")                 ; concat
```

## I/O

```clojure
print "message"             ; console output
(read_file path name)       ; read (optional)
write_file path name data   ; write
(file_exists path name)     ; exists?
(dir_exists path)           ; dir exists?
create_dir path             ; make dir
```

## Error Handling

```clojure
try { } { }                 ; try/catch
throw "error"               ; throw
(error_msg)                 ; get error message
```

## Lambda

```clojure
def fn1 (fn:ReturnT (p:T) { return value })
fn1(arg)                    ; call lambda
callback({ print item })    ; inline lambda
```

## Common Operators

```
Arithmetic: + - * / %
Comparison: == != < <= > >=
Boolean: && || !
Math: sin cos tan sqrt floor ceil (M_PI)
Convert: to_int to_double to_string str2int
```

## Target Languages

```
es6       JavaScript
java7     Java 7+
go        Go 1.8+
swift3    Swift 3+
cpp       C++14
php       PHP 5.4+
csharp    C# 7.0
scala     Scala 2.x
kotlin    Kotlin
```
