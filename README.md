
# Ranger cross language compiler

Status: `experimental`

Ranger is a small self-hosting cross -language, cross -platform compiler to enable writing portable algorithms and applications.
The language has type safety, classes, inheritance, operator overloading, lambda functions, generic traits, 
class extensions, type inference and can integrate with host system API's using system classes. 

## Host platforms and target languages

The compiler is *self hosting*  which means that it has been written using the compiler itself and thus it can be hosted
on several platforms. At the moment the official platform is node.js, but it can also be run on browser or JVM or compiled
to binary using Go target.

The target languages suppoerted currently are `JavaScript`, `Java`, `Go`, `Swift`, `PHP`, `C++`, `C#` and `Scala`. The Scala
and C# are lagging behind int the support. Adding support to  Kotlin is considered.

The applications or modules compiled using Ranger can be integrated to various target platforms using custom operators and
system classes with native API's.

## Installing the compiler

The compiler currently can compile itself at least to JavaScript, Java and Go language targets, but prebuild 
version is available as node.js / npm module.

To install the latest test version of the compiler using npm running

```
 npm install -g ranger-compiler
```

Then you can run the command `ranger-compiler` which gives you the output, which is something like this:

```
Usage: <file> <options> <flags>
Options: -<option>=<value>
  -l=<value>             Selected language, one of es6, go, scala, java7, swift3, cpp, php, csharp
  -d=<value>             output directory, default directory is 'bin/'
  -o=<value>             output file, default is 'output.<language>'
  -classdoc=<value>      write class documentation .md file
  -operatordoc=<value>   write operator documention into .md file
Flags: -<flag>
  -typescript    Writes JavaScript code with TypeScript annotations
  -npm           Write the package.json to the output directory
  -nodecli       Insert node.js command line header #!/usr/bin/env node to the beginning of the JavaScript file
  -nodemodule    Export the classes as node.js modules (this option will disable the static main function)
  -pages         create pages for the platform
  -services      create services for the platform
  -client        the code is ment to be run in the client environment
  -scalafiddle   scalafiddle.io compatible output
  -compiler      recompile the compiler
  -copysrc       copy all the source codes into the target directory
```

## Getting started with Hello World

Create file `hello.clj`
```   
class Hello {
    static fn main () {
        print "Hello World"
    }
}

```
Then compile it using `ranger-compiler` using command line

```
ranger-compiler hello.clj
```

The result will be outputtted into directory `bin/hello.js`

# Quick Reference

## Statements
  `def` ,   `for` ,   `set` ,   `remove_index` ,   `insert` ,   `remove` ,   `push` ,   `removeLast` ,   `clear` ,   `forEach` ,   `forKeys` 

| operator | returns | arguments | description |
| -------- | ------- | --------- | ------------| 
| def | |   (`varname`:[T]  )| | 
| for | |   (`list`:[T]  `item`:T  `indexName`:int  `repeat_block`:block  )| | 
| set | |   (`array`:[T]  `index`:int  `value`:T  )| | 
| remove_index | |   (`array`:[T]  `index`:int  )| | 
| insert | |   (`array`:[T]  `index`:int  `item`:T  )| | 
| remove | |   (`array`:[T]  `index`:int  )| | 
| push | |   (`array`:[T]  `item`:<optional>T  )| | 
| removeLast | |   (`array`:[T]  )| | 
| clear | |   (`array`:[T]  )| | 
| forEach | |   (`self`:[T]  `cb`:  )| | 
| forKeys | |   (`self`:[T]  `cb`:  )| | 

## Operators without arguments
  `create_immutable_array` ,   `create_immutable_hash` ,   `M_PI` ,   `shell_arg_cnt` ,   `install_directory` ,   `current_directory` ,   `error_msg` ,   `has_console_colors` 

| operator | returns | arguments | description |
| -------- | ------- | --------- | ------------| 
| create_immutable_array | `[T]` |   ( )| | 
| create_immutable_hash | `[T]` |   ( )| | 
| M_PI | `double` |   ( )| | 
| shell_arg_cnt | `int` |   ( )| return the number of arguments for command line utility| 
| install_directory | `string` |   ( )| | 
| current_directory | `string` |   ( )| | 
| error_msg | `string` |   ( )| | 
| has_console_colors | `boolean` |   ( )| | 

## Generic operators
  `empty` ,   `wrap` ,   `!!` ,   `unwrap` ,   `return` ,   `??` ,   `[]` ,   `null?` ,   `!null?` ,   `==` ,   `!=` ,   `&&` ,   `cast` ,   `to` 

| operator | returns | arguments | description |
| -------- | ------- | --------- | ------------| 
| empty | `<optional>T` |   (`node`:T  )| | 
| wrap | `<optional>T` |   (`arg`:T  )| | 
| !! | `T` |   (`arg`:<optional>T  )| | 
| unwrap | `T` |   (`arg`:<optional>T  )| | 
| return | `T` |   (`value`:T  )| | 
| ?? | `T` |   (`left`:<optional>T  `right`:T  )| | 
| [] | `[T]` |   (`typeDef`:T  `listOf`:expression  )| | 
| null? | `boolean` |   (`arg`:<optional>T  )| | 
| !null? | `boolean` |   (`arg`:<optional>T  )| | 
| == | `boolean` |   (`left`:T  `right`:T  )| | 
| != | `boolean` |   (`left`:T  `right`:T  )| | 
| && | `boolean` |   (`left`:<optional>T  `right`:<optional>S  )| | 
| cast | `S` |   (`arg`:T  `target`:S  )| | 
| to | `T` |   (`to`:T  `item`:T  )| | 

## Numeric operators
  `fabs` ,   `tan` ,   `shell_arg` ,   `unwrap` ,   `unwrap` ,   `-` ,   `-` ,   `+` ,   `+` ,   `*` ,   `*` ,   `/` ,   `/` ,   `int2double` ,   `acos` ,   `cos` ,   `sin` ,   `sqrt` ,   `null?` ,   `null?` ,   `!null?` ,   `!null?` ,   `to_string` ,   `to_int` ,   `to_int` ,   `strfromcode` ,   `double2str` ,   `to_double` ,   `==` ,   `==` ,   `>` ,   `>` ,   `<=` ,   `<=` ,   `<` ,   `<` ,   `!=` ,   `>=` ,   `>=` ,   `r.value` ,   `r.value` 

| operator | returns | arguments | description |
| -------- | ------- | --------- | ------------| 
| fabs | `double` |   (`v`:double  )| | 
| tan | `double` |   (`v`:double  )| | 
| shell_arg | `string` |   (`index`:int  )| | 
| unwrap | `int` |   (`arg`:<optional>int  )| | 
| unwrap | `double` |   (`arg`:<optional>double  )| | 
| - | `double` |   (`left`:double  `right`:double  )| | 
| - | `int` |   (`left`:int  `right`:int  )| | 
| + | `double` |   (`left`:double  `right`:double  )| | 
| + | `int` |   (`left`:int  `right`:<optional>int  )| | 
| * | `double` |   (`left`:double  `right`:double  )| | 
| * | `int` |   (`left`:int  `right`:int  )| | 
| / | `double` |   (`left`:double  `right`:double  )| | 
| / | `double` |   (`left`:int  `right`:int  )| | 
| int2double | `double` |   (`value`:int  )| | 
| acos | `double` |   (`value`:double  )| | 
| cos | `double` |   (`value`:double  )| | 
| sin | `double` |   (`value`:double  )| | 
| sqrt | `double` |   (`value`:double  )| | 
| null? | `boolean` |   (`arg`:<optional>int  )| | 
| null? | `boolean` |   (`arg`:<optional>double  )| | 
| !null? | `boolean` |   (`arg`:<optional>int  )| | 
| !null? | `boolean` |   (`arg`:<optional>double  )| | 
| to_string | `string` |   (`value`:int  )| | 
| to_int | `int` |   (`value`:double  )| | 
| to_int | `string` |   (`value`:int  )| | 
| strfromcode | `string` |   (`code`:int  )| | 
| double2str | `string` |   (`value`:double  )| | 
| to_double | `double` |   (`input`:int  )| | 
| == | `boolean` |   (`left`:int  `right`:char  )| | 
| == | `boolean` |   (`left`:double  `right`:double  )| | 
| > | `boolean` |   (`left`:double  `right`:double  )| | 
| > | `boolean` |   (`left`:int  `right`:int  )| | 
| <= | `boolean` |   (`left`:int  `right`:char  )| | 
| <= | `boolean` |   (`left`:double  `right`:double  )| | 
| < | `boolean` |   (`left`:int  `right`:char  )| | 
| < | `boolean` |   (`left`:double  `right`:double  )| | 
| != | `boolean` |   (`left`:int  `right`:char  )| | 
| >= | `boolean` |   (`left`:int  `right`:char  )| | 
| >= | `boolean` |   (`left`:double  `right`:double  )| | 
| r.value | `CodeNode` |   (`n`:double  )| | 
| r.value | `CodeNode` |   (`n`:int  )| | 

## String operators
  `has_option` ,   `get_option` ,   `get_required_option` ,   `sha256` ,   `md5` ,   `env_var` ,   `file_exists` ,   `dir_exists` ,   `read_file` ,   `+` ,   `null?` ,   `!null?` ,   `trim` ,   `strsplit` ,   `strlen` ,   `substring` ,   `to_charbuffer` ,   `to_int` ,   `length` ,   `charAt` ,   `charcode` ,   `ccode` ,   `str2int` ,   `str2double` ,   `to_double` ,   `indexOf` ,   `to_uppercase` ,   `==` ,   `!=` ,   `r.op` ,   `r.vref` ,   `r.value` 

| operator | returns | arguments | description |
| -------- | ------- | --------- | ------------| 
| has_option | `boolean` |   (`name`:string  )| | 
| get_option | `string` |   (`name`:string  )| | 
| get_required_option | `string` |   (`n`:string  )| | 
| sha256 | `string` |   (`input`:string  )| | 
| md5 | `string` |   (`input`:string  )| | 
| env_var | `<optional>string` |   (`name`:string  )| | 
| file_exists | `boolean` |   (`path`:string  `filename`:string  )| | 
| dir_exists | `boolean` |   (`path`:string  )| | 
| read_file | `<optional>string` |   (`path`:string  `filename`:string  )| | 
| + | `string` |   (`left`:string  `right`:enum  )| | 
| null? | `boolean` |   (`arg`:<optional>string  )| | 
| !null? | `boolean` |   (`arg`:<optional>string  )| | 
| trim | `string` |   (`value`:string  )| | 
| strsplit | `[string]` |   (`strToSplit`:string  `delimiter`:string  )| | 
| strlen | `int` |   (`text`:string  )| | 
| substring | `string` |   (`text`:string  `start`:int  `end`:int  )| | 
| to_charbuffer | `charbuffer` |   (`text`:string  )| | 
| to_int | `<optional>int` |   (`txt`:string  )| | 
| length | `int` |   (`text`:string  )| | 
| charAt | `int` |   (`text`:string  `position`:int  )| | 
| charcode | `char` |   (`text`:string  )| | 
| ccode | `char` |   (`text`:string  )| | 
| str2int | `<optional>int` |   (`value`:string  )| | 
| str2double | `<optional>double` |   (`value`:string  )| | 
| to_double | `<optional>double` |   (`value`:string  )| | 
| indexOf | `int` |   (`str`:string  `key`:string  )| | 
| to_uppercase | `string` |   (`s`:string  )| | 
| == | `boolean` |   (`left`:string  `right`:string  )| | 
| != | `boolean` |   (`left`:string  `right`:string  )| | 
| r.op | `CodeNode` |   (`n`:string  )| | 
| r.vref | `CodeNode` |   (`n`:string  `t`:string  )| | 
| r.value | `CodeNode` |   (`n`:string  )| | 


## Array operators
  `def` ,   `make` ,   `for` ,   `length` ,   `join` ,   `has` ,   `set` ,   `lift` ,   `itemAt` ,   `indexOf` ,   `clone` ,   `contains` ,   `remove_index` ,   `insert` ,   `remove` ,   `push` ,   `removeLast` ,   `clear` ,   `last_index` ,   `last` ,   `sort` ,   `reverse` ,   `array_length` ,   `array_extract` ,   `forEach` ,   `map` ,   `filter` ,   `reduce` ,   `groupBy` ,   `find` ,   `count` 

| operator | returns | arguments | description |
| -------- | ------- | --------- | ------------| 
| def | |   (`varname`:[T]  )| | 
| make | `[T]` |   (`typeDef`:[T]  `size`:int  `repeatItem`:T  )| | 
| for | |   (`list`:[T]  `item`:T  `indexName`:int  `repeat_block`:block  )| | 
| length | `int` |   (`array`:[T]  )| | 
| join | `string` |   (`array`:[string]  `delimiter`:string  )| | 
| has | `boolean` |   (`array`:[T]  )| | 
| set | |   (`array`:[T]  `index`:int  `value`:T  )| | 
| lift | `<optional>T` |   (`array`:[T]  `index`:int  )| | 
| itemAt | `T` |   (`array`:[T]  `index`:int  )| | 
| indexOf | `int` |   (`array`:[T]  `element`:T  )| | 
| clone | `[T]` |   (`array`:[T]  )| Create a copy of this buffer| 
| contains | `boolean` |   (`array`:[T]  `element`:T  )| | 
| remove_index | |   (`array`:[T]  `index`:int  )| | 
| insert | |   (`array`:[T]  `index`:int  `item`:T  )| | 
| remove | |   (`array`:[T]  `index`:int  )| | 
| push | |   (`array`:[T]  `item`:<optional>T  )| | 
| removeLast | |   (`array`:[T]  )| | 
| clear | |   (`array`:[T]  )| | 
| last_index | `int` |   (`array`:[T]  )| | 
| last | `T` |   (`array`:[T]  )| | 
| sort | `[T]` |   (`array`:[T]  `cb`:  )| | 
| reverse | `[T]` |   (`array`:[T]  )| | 
| array_length | `int` |   (`array`:[T]  )| | 
| array_extract | `T` |   (`array`:[T]  `position`:int  )| | 
| forEach | |   (`self`:[T]  `cb`:  )| Call `fb` for each item in array| 
| map | `[S]` |   (`self`:[T]  `cb`:  `to`:[S]  )| | 
| filter | `[T]` |   (`self`:[T]  `cb`:  )| | 
| reduce | `T` |   (`self`:[T]  `cb`:  `initialValue`:T  )| | 
| groupBy | `[T]` |   (`self`:[T]  `cb`:  )| | 
| find | `<optional>T` |   (`self`:[T]  `cb`:  )| | 
| count | `int` |   (`self`:[T]  `cb`:  )| | 

## Map operators
  `def` ,   `for` ,   `keys` ,   `has` ,   `get` ,   `get` ,   `set` ,   `forEach` ,   `forKeys` 

| operator | returns | arguments | description |
| -------- | ------- | --------- | ------------| 
| def | |   (`varname`:[T]  )| | 
| for | |   (`hash`:[T]  `item`:T  `itemName`:string  `repeat_block`:block  )| | 
| keys | `[string]` |   (`map`:[T]  )| | 
| has | `boolean` |   (`map`:[T]  `key`:K  )| | 
| get | `<optional>int` |   (`map`:[int]  `key`:K  )| | 
| get | `<optional>T` |   (`map`:[T]  `key`:K  )| | 
| set | |   (`map`:[T]  `key`:K  `value`:T  )| | 
| forEach | |   (`self`:[T]  `cb`:  )| | 
| forKeys | |   (`self`:[T]  `cb`:  )| | 

## Boolean operators... 
  `?` ,   `==` ,   `&&` ,   `||` ,   `r.value` 

| operator | returns | arguments | description |
| -------- | ------- | --------- | ------------| 
| ? | `T` |   (`condition`:boolean  `left`:T  `right`:T  )| | 
| == | `boolean` |   (`left`:boolean  `right`:boolean  )| | 
| && | `boolean` |   (`left`:boolean  `right`:<optional>S  )| | 
| &#124;&#124; | `boolean` |   (`left`:boolean  `right`:boolean  )| | 
| r.value | `CodeNode` |   (`n`:boolean  )| | 

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

### Operators for hashes

if we have a hashmap
```
  def someMap:[string:string]
```
Operator `set` can be used to set key/value pair
```
  set someMap "foo" "bar"
```
Operator `has` can be used to check if a key exists in the hash
```
    if (has someMap "a key") {
        
    }
```
Get is used to read the value associated with a key. The result is `@(optional)`
```
  (get someMap "foo")
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

```
this.foo({
    print txt + " = " i
})
```



# Automatically infixed math support 

It is easy to define new mathematical operations in the Lang.clj file or in modules. However, some mathematical operations are automatically infixed
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

The basic unit of the program is class. The functions of classes can not be overloaded at the moment, which means that you can not
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

# Advanced topics


## Compiling a new version of the compiler

Then run command
```
ranger-compiler -compiler -copysrc
```
The result will be written to directory `bin/ng_Compiler.js`.


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
