
# Ranger cross language compiler

Status: `experimental`

Ranger is a small self-hosting cross -language, cross -platform compiler to enable writing portable algorithms and applications.
The language has type safety, classes, inheritance, operator overloading, lambda functions, generic traits, 
class extensions, type inference and can integrate with host system API's using system classes. 

## Host platforms and target languages

The compiler is *self hosting*  which means that it has been written using the compiler itself and thus it can be hosted
on several platforms. At the moment the official platform is node.js, but it can also be run on browser or JVM or compiled
to binary using Go target.

The target languages suppoerted currently are `JavaScript`, `Java 7`, `Go`, `Swift 3`, `PHP` and To some extent C++. There is
planned support for `C#` and `Scala` and possibility to inculde Kotlin is considered.

The applications or modules compiled using Ranger can be integrated to various target platforms using custom operators and
system classes with native API's.

## Setup

The compiler currently can compile itself at least to JavaScript, Java and Go language targets, but prebuild 
version is available as node.js / npm module.

To install the latest test version of the compiler using npm running

```
 npm install -g ranger-compiler
```

Download the language definition file into your working directory:
https://github.com/terotests/Ranger/blob/master/compiler/Lang.clj

## Compiling a new version of the compiler

Get the files from directory `https://github.com/terotests/Ranger/blob/master/compiler/`

Then run command
```
ranger-compiler ng_Compiler.clj Lang.clj es6 out compiler.js
```
The result will be written to directory `out/compiler.js` Then you can test the new version of the compiler running `node compiler.js`
 
## Getting started with a Hello World

Create file `Hello.clj`
```   
class Hello {
    fn sayHello:void () {
        print "Hello World"
    }
    sfn hello@(main):void () {
        def hello:Hello (new Hello ())
        hello.sayHello()
    }   
}

```
Then compile it using `ranger-compiler` using command line

```
ranger-compiler Hello.clj Lang.clj es6 . hello.js
```

Then you can try running hello.js under node.js To compile to other languages simply change the language type

```
ranger-compiler Hello.clj Lang.clj java7 . hello.java
ranger-compiler Hello.clj Lang.clj go . hello.go
ranger-compiler Hello.clj Lang.clj php . hello.php
ranger-compiler Hello.clj Lang.clj swift3 . hello.swift
```

# Short notes about the syntax

Ranger syntax is originally based on Lisp -language syntax and most operators will use prefix notation. However, the Ranger modifies
the original Lisp so that inside block expression `{ ... }` there is no need to insert parenthesis which makes the language appear to
be a bit more like standard languages. Thus you can write exressions like

```
class Hello {
    fn sayHello:void () {
        def x 20
        if ( x < 10 ) {
            print "x < 10"
        } {
            print "x >= 10"
        }   
    }
}
```

However, when you go deeper in the expression you may have to include the parenthesis, for example when invoking object you have to write
```
def obj (new Hello) 
```

For most common mathematical symbols and boolean operators infix notation can be used and they are automatically converted to lisp expressions.
Thus you can write expressions such as `(x + y * z)` instead of `(+ x (* y z))`

```
def x 100
def y 200
def z ( x + y * 10)    
if ( x < 20 || y == 0 ) {

}
```
The assigment operator is also automatically prefixed from infix notation so you can say
```
x = y
```
Instead of common lisp syntax `(= x y)`

## Main function

Each file can have a class with a function declared with `@(main)` annotation

```   
class Hello {
    sfn hello@(main):void () {
    }   
}

```
This is a static function which marks the start of execution for the program.

## Functions and Static functions

```   
class Hello {
    fn SomeNonStaticFn () {
    }      
    sfn SomeStaticFn () {
        ; static function which instantiates Hello and calls non-static
        def o (new Hello)
        o.SomeNonStaticFn()
    }   
}

```

Calling static function of a class can be done with

```
Hello.SomeStaticFn()
```

## Return values of functions

Function not inferred or declared as `void` should always return value with `return` statement.


## Comments
```
; here is a comment
class Hello {

}
```

## Type inference and variable definition

Type inference can be used to determine variable type for local variables and class properties

```
def x 100      ; inferred type = int
def y:int 200
def o (new myClass) ; inferred type myClass
```

## Standard types

Basic primitive types are

- int
- boolean
- string
- double
- char  
- charbuffer

Type of function returning nothing is
- void

Type which can be used as variable types, but require signature are
- Arrays
- Hashes
- Anonymous functions

Types which require type declaration are
- Enum
- class
- systemclass
- systemunion
- trait

## String literals

String literals are escaped using JSON escaping rules and can be multilne

```
def long_string "
    this is
    a multiline string
"
```

## Enums

Enums will be compiled to type `int` but are type checked by the Ranger preprosessor
```
Enum LineJoin (
    Undefined
    Miter
    Round
    Bevel
)
class foo {
    def lineType:LineJoin LineJoin.Undefined
}
```

## Arrays and Hashes

Arrays and hashes are automatically initialized and are ready to be used after their declaration
```
def list:[string]
def usedKeywords:[string:string]
def classMap:[string:myClass]
```

## Arrays and Hashes

Arrays and hashes are automatically initialized and are ready to be used after their declaration
```
def list:[string]
def usedKeywords:[string:string]
```

## Anonymous functions / lambdas

Anonymous function type declaration is automatically inferred
```
def name "foo"
def myFilter (fn:boolean (param:string) {
    return (param == name)
})
if(myFilter("foo")) {
    print "it was foo"
}
```

To give declare Anonymous function as parameter of function you must include the full signature, for
example for a callback taking `string` and `int` signature is `fn:void (txt:string i:int)`

```
fn foo:void ( callback:( fn:void (txt:string i:int)) ) {
    callback("got this?" 10)
}
```

When giving lambda as a parameter, the formal type definition can be omitted, the named parameters are
automatically declared to the block scope of the lambda.

````
this.foo({
    print txt + " = " i
})
```


# Operators for hashes

## set 

Set a map key to some value
```
  def someMap:[string:string]
  set someMap "foo" "bar"
```

## has

```
    def hashTbl:[string:string]
    set hashTbl "someKey" "foo"    
    if (has hashTbl "someKey") {
        print "did have"
    }
```

## get

Get a value associated to a key 
```
  def someMap:[string:string]
  set someMap "foo" "bar"
  def value (unwrap (get someMap "foor"))
```


# Automatically infixed math support 

It is easy to define new mathetmatical operations in the Lang.clj file or in modules. However, some mathematical operations are automatically infixed
for easier usage. Thus, instead of using common lips notation `(* 4 10)` you can use easier to read infixed `4 * 10` -syntax

## Boolean logic operators

```
a && b
a || b
```

## Math operators

```
a * b
a / b
a - b
a + b
```

## Logical comparisions

```
a < b
a <= b
a > b
a >= b
a != b
```


# Common set of Operators and the Grammar file

The file `Lang.clj` is used by the compiler for the common set of operators and compilation rules. The
most common operators for example

- to_double
- read_file
- array_length

Are defined in this file. Using the Lang.clj -file it is quite easy to extend the language to support new operators
or to modify the existing rules for better results, if so required. However, the Lang.clj is not ment for daily
modifications, rather it describes common set of rules used and thus should be edited sparingly.

The file has couple of sections, but the `reserved_words` and `commands`. The Reserved words section declares (surprise!)
the reserved words and their transformation. This is required because for example in Go the word `map` is a keyword and can
not be used unless it is conveted to some other name, for example to `FnMap`.
```
    reserved_words {
        map FnMap
        forEach forEachItem
    }
```
What the result should be is of course highly opinionated. In this example, the line `map FnMap` means that if possible the 
compiler will transform anything named `map` to `fnMap` if possible. If transformation is not possible, compiler error is
generated.

The common operators are declared in section `commands`, which describe commands, their expected parameters
and return values and rules on how they should be compiled into the target languages, possible imported libraries
and possible macros or helper function which should be created if the operator is used.

Example of simple operator is `(M_PI)` which will return double value of mathematical symbol "pi".
```
    commands {
        M_PI mathPi:double () {
            templates {
                es6 ("Math.PI")
                go ( "math.Pi" (imp "math"))                                
                swift3 ( "Double.pi" (imp "Foundation"))   
                java7 ( "Math.PI" (imp "java.lang.Math"))         
                php ("pi()")        
                cpp ("M_PI" (imp "<math.h>"))               
            }
        }
        ...
```

Most operators are simple, but some require creating custom macros, helpoer functions and some of them are so complex
that they may be implemented in the compiler core.


# Modules, classes and operators

The basic unit of the program is class. The functions of classes can not be overloaded at the moment, which meanse that you can not
have two functions with different parameters or different return values. 

Each source file can import other files using `Import` command. 
``` 
Import "Vec2.clj"  

class vectorTest {
    fn testVectors () {
        def v (new Vec2 ( 5 4 ))
    }
}
```

## Class declaration

``` 
class fatherClass {
    def msg "Hello "
    fn foo:string ( txt:string ) {
        return (msg + txt)
    }
}
class childClass {
    Extends( fatherClass )
}
class mainProgram {
    sfn m@(main) {
        ; invoke the class
        def cc (new childClass)
        cc.foo("World!")
    }
}

```

## Class constructor

``` 
class myClass {
    def name:string ""
    Constructor (n:string) {
        name = s
    }
}
```

Notes:
1. currently only a single variant of the constructor is possible. 
2. as of this writing calling the parent class constructor does not work properly

## Class invocation
```
def obj (new myClass ("name"))
```
classes without constructor can be invocated without arguments

```
def obj (new simpleClass)
```

## Creating a class extension

Class extensions are useful for keeping classes simple and moving dependencies to external Modules
which can extend the classes.

Extension can

- add new functions to the class
- add new member variables to the class

``` 
extension childClass {
    def name:string ""
    fn bar:string ( txt:string ) {
        return ("Hello from exteision: " + txt)
    }
}
```

## Optional variables

In several target languages so called "optional" type can be used. In Ranger Option -type can be used as function or operator
return value and as filter to opertors. To use optional variable directly it should be first unwrapped. Also, trying to unwrap
non-nullable value should cause compiler error. In Ranger any variable which is declared not given value is considered optional.
This corresponds to Swift `?` optional type.

You can also declare variables optional using @optional annotation
```
    def item@(optional):myClass
```

Some operators also return optional values, for example `(get <hash> <key>)` operator is returning always optional value. To use
the value you must use `(unwrap <value>)` operator
```
    def strMap:[string:string]
    def str (get strMap "myKey")
    if(!null? str) {
        print (unwrap str)
    }
``` 

**Warning***  currently optinal variables in Ranger are not "safe" in the sense the language makes sure that you can not make 
programming errors - it is possible to create programming mistake by using a variable which automatically unwrapped. The plan
is to try to make them safer in the future, and options are considered how to enable them 

Another warning: Ranger does not protect you from mistakes when automatically unwrapping long reference chains like
`obj.property.subProperty.foo` where `property` and `subProperty ` are optional variables. 

## Control flow

### if

If statement is quite similar to other language, but `then` and `else` keywords are not used

```
def x 100
if ( x < 10 ) {
    ; then branch
} {
    ; else branch
}
```

### switch - case 

Note: currently case statement does not support multiple matching values, it is planned to add support for that later.

```
def name "John"
switch name {
    case "John" {

    }
    case "Flat Eric" {

    }
    default {

    }
}
```

## Loops

### for -loop
```
def list:[string]
for list s:string i {
    print s
}
```
You can use `break` and `continue` to control the for -loop.

### while -loop
```
def cnt 10
while (cnt > 0 ) {
    print "round " + cnt
}
```

You can use `break` and `continue` to control the while -loop.

## Custom operators

One of the most important features or Ranger is the ability to create custom operators which can target some specific language or all languages
using macros. Together with `systemclass` they allow the system to integrate to target environment or to create new abstraction over existing
native API's.

Operators allow type matching against
- defined primitive types
- defined classes
- Enums
- optionality
- traits

Operators can be writing directly target language construct or they can be macros, which write code in Ranger and the compiler will then
transform the resulting AST tree into the target language's code using the conventions of target language. Which is better depends on the
situation, for example operators for system classes usually are written directly to the traget language while operators which are using
Ranger's own classes or datatypes are usually better to write with macros.

Simple example of useful macro is Matrix and Vector multiplication. Let's say that you have defined a Matrix class and
want to overload the `*` -operator for easy matrix multiplication.

```
class Mat2 {
  def m0 1.0
  def m1 0.0
  def m2 0.0
  def m3 1.0
  def m4 0.0
  def m5 0.0
  fn multiply:Mat2 ( b:Mat2 ) {
      def t0 (m0*b.m0 + m1 * b.m2)
      def t2 (m2*b.m0 + m3 * b.m2)
      def t4 (m4*b.m0 + m5 * b.m2 + b.m4)

      def res (new Mat2)
      res.m1 = (m0 * b.m1 + m1 * b.m3)
      res.m3 = (m2 * b.m1 + m3 * b.m3)
      res.m5 = (m4 * b.m1 + m5 * b.m3 + b.m5)
      res.m0 = t0
      res.m2 = t2
      res.m4 = t4
      return res
  }
}
operators {
    *  base:Mat2 ( a:Mat2 b:Mat2) {
        templates {
            * @macro(true) ( (e 1 ) ".multiply(" (e 2) " )" )
        }        
    }
}

```
The `* @macro(true)` means that we target all languages and this is a macro, not actual target language construct.


## Custom operators and System classes

To integrate with the target languages running environment,  Ranger modules can declare `systemclass` which can be used
together with the code.

```
systemclass DOMElement {
    es6 DOMElement
}

operators {
    find  base:DOMElement ( id:string) {
        templates {
            es6 ("document.getElementById( " (e 1) " )")
        }        
    }
    setAttribute  _:void ( elem:DOMElement name:string value:string) {
        templates {
            es6 ( (e 1) ".setAttribute(" (e 2) ", " (e 3) ")" )
        }        
    }
}

class tester {
    fn modifyDom () {
        def e (find "#someelem")
        setAttribute( e "className", "activeElement")
    }
}
```


Note: Definition of system classes will be revisited in near future and there will be potentially small changes to it.

## Unions of system classes

Sometimes the system class can be of union type. This means that the traget language can accept multiple types in place of 
a single type.

```
systemunion DOMElementUnion ( DOMElement string )
```
The you can create operator which accepts either `DOMElement` or `string` and reduces that to a single type. 


## Traits

Traits are like extensions, which can be plugged into several classes using `does` keyword.

Traits 
```
trait bar {
    fn hello() {
        print "Hello"
    }
}

; foo implements "bar" trait 
class foo {
    does bar
}
```

Traits are very useful when used together with custom operators, because operators can also match traits.

Another useful feature of traits is their genericity. While classes can not be generic, traits can and thus
it is possible to implement for example generic collections using generic traits.

```
trait GenericCollection @params(T S) {
    def items:[T]
    fn  add (item:T) {
        push items item
    }
    fn  map:S ( callback:( f:T (item:T))  ) {
        def res:S (new S ())
        for items ch@(lives):T i {
            def new_item@(lives):T (callback (ch))
            res.add(new_item)
        }
        return res
    }
    ; ... TODO: add more collection functions...
}

; then create a specific "string" collection..
class StringCollection {
    does GenericCollection @params(string StringCollection)
}

class Main {
    fn testCollection:void () {
        def coll:StringCollection (new StringCollection)
        coll.add("A")
        coll.add("B")
        def n (coll.map({
            return ("item = " + item)
        }))
        print (join n.items " ")     
    }
    sfn hello@(main):void () {
        def hello (new Main ())
        hello.testCollection()
    }   
}
``` 

## Variable definitions

Values can be defined using `def` keyword.

```
def x:double
def x:double 0.4            ; double with initializer
def list1:[double]          ; list of doubles
def strList:[string]        ; list of Strings
def strMap:[string:string]  ; map of string -> string
def strObjMap:[string:someClass]    ; map of string -> object of type someClass
```


# Annotations

Compiler is using annotation syntax for specifying some parameters for class, trait and variable construction.

## sfn someFn@(main)

Static functions can be annotated to be the start point of compiled application using `@(main)` annotation.

## trait myTrait @params(...)

@params(...) annotation can be used to greate generic traits.

```
trait GenericCollection @paras(T V) {
    def items:[T]
    fn  map:S ( callback:( f:T (item:T))  ) {
        def res:S (new S ())
        for children ch@(lives):T i {
            def new_item@(lives):T (callback (ch))
            res.add(new_item)
        }
        return res
    }
}

class StringCollection {
    does GenericCollection @params(string StringCollection)
}
``` 

## def variableName@(optional)

Optional variables can be used as return values of functions where the result is not certain. You can
force the unwrapping of the variable with `(unwrap <variable>)`

## def variableName@(weak)

Weak variables are ment to be compiled in the target language as weak references

## def variableName@(strong)

Weak variables are ment to be compiled in the target language as strong references

## def variableName@(lives)

@(lives) annotation can be used to note the compiler that the variable is supposed to outlive it's current scope.

The variables have lifetime, which determines the point where the variable should be removed. In garbage collected
languages you do not have to worry about the lifetime, but in the future there can be target languages which require
the lifetime calculations.

## def variableName@(temp)

@(temp) annotation can be used to note the compiler that it should not worry about freeing the variable, in case the
target language has option to release the variable. 
