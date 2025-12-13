# Ranger cross language compiler

**Version 3.0.0-alpha.1** | Status: `experimental`

Ranger is a small self-hosting cross-language, cross-platform compiler to enable writing portable algorithms and applications.
The language has type safety, classes, inheritance, operator overloading, lambda functions, generic traits,
class extensions, type inference and can integrate with host system API's using system classes.

## What's New in Version 3.0

🚀 **Ranger 3.0** is a major evolution focusing on developer experience and production readiness.

### 3.0.0-alpha.1 Changes (December 2025)

#### ✅ File Extension Change: `.clj` → `.rgr`

Ranger now uses its own `.rgr` file extension instead of `.clj`. This establishes Ranger's identity and enables proper editor/tooling support.

- **132 source files** renamed across `compiler/` and `lib/`
- All import statements updated
- Both extensions currently supported (`.clj` deprecated)

#### ✅ New CLI Alias: `rgrc`

Use the shorter `rgrc` command instead of `ranger-compiler`:

```bash
# New (recommended)
rgrc -l=es6 myfile.rgr -o=output.js

# Still works
ranger-compiler -l=es6 myfile.rgr -o=output.js
```

#### ✅ CI/CD Pipeline

- GitHub Actions for automated testing (Node 18/20/22)
- NPM publish workflow on release
- Test suite: 87 tests passing across ES6, Python, Go, Rust targets

#### ✅ Compiler Introspection API

New API for IDE integration enabling:
- Position-based type queries
- Class property/method inspection
- Error location tracking

See [ai/INTROSPECTION.md](ai/INTROSPECTION.md) for documentation.

### Coming Soon

- **Web-based IDE** - Browser playground with Monaco editor
- **VSCode Extension** - Full language server with go-to-definition, autocomplete
- **Simplified Imports** - Auto-load standard library
- **Source Maps** - JavaScript debugging support

### Quick Start

```bash
# Install globally
npm install -g ranger-compiler

# Compile to JavaScript
rgrc -l=es6 myfile.rgr -o=output.js

# Compile to TypeScript
rgrc -l=es6 -typescript myfile.rgr -o=output.ts

# Compile to Python
rgrc -l=python myfile.rgr -o=output.py

# Compile to Rust
rgrc -l=rust myfile.rgr -o=output.rs

# Compile to Go
rgrc -l=go myfile.rgr -o=output.go
```

See [CHANGELOG.md](CHANGELOG.md) for full version history and [PLAN_3.md](PLAN_3.md) for the roadmap.

---

## Host platforms and target languages

The compiler is _self hosting_ which means that it has been written using the compiler itself and thus it can be hosted
on several platforms. At the moment the official platform is node.js, because external plugins are only available as npm packages.

The target languages supported are `JavaScript`, `Java`, `Go`, `Swift`, `PHP`, `C++`, `C#`, `Scala`, `Python`, and `Rust`. The quality
of the target translation still varies and at the moment of this writing the compiler can only be compiled fully to JavaSript
target. However, most targets already can compile reasonably good code.

## Recent Updates (December 2025)

### Swift 6 Target Support

The Swift 6 target (`-l=swift6`) has been added with the following features:

- Modern Swift 6 compatible code generation
- `@main` struct entry point pattern
- Proper integer-to-string conversion using `String()`
- Array operations using `.append()` instead of `.push()`
- Uses `print()` for console output
- Falls back to Swift 3 system class definitions when Swift 6 not defined

Example compilation:

```bash
rgrc -l=swift6 myfile.rgr -o=myfile.swift
swiftc myfile.swift -o myfile
```

### Rust Target Support (Preliminary)

The Rust target (`-l=rust`) now has preliminary support with the following features:

- Classes compiled to structs with `impl` blocks
- Constructors as `pub fn new()` returning owned structs
- Static factory methods
- Instance methods with `&mut self`
- Proper String handling with `.to_string()` for literals
- Array operations (`push`, `itemAt`, `set`) with `Vec<T>`
- String concatenation using `format!` macro
- Ternary expressions as `if/else` expressions
- Automatic `#[derive(Clone)]` for structs
- Smart mutability detection (`let` vs `let mut`)

Example compilation:

```bash
ranger-compiler -l=rust myfile.clj -o=myfile.rs
rustc myfile.rs -o myfile
```

### Unit Test Suite

A comprehensive test suite has been added using Vitest:

```bash
npm test              # Run all tests
npm run test:es6      # JavaScript/ES6 tests only
npm run test:python   # Python target tests
npm run test:go       # Go target tests
npm run test:rust     # Rust target tests
```

Test coverage includes:

- **ES6/JavaScript**: Full runtime tests (array operations, classes, inheritance, string operations, math, etc.)
- **Python**: Compilation and runtime tests with pytest
- **Go**: Compilation and runtime tests
- **Rust**: Compilation tests (runtime tests in progress)

### Known Issues

See `ISSUES.md` for a comprehensive list of known issues and their status. Key issues include:

- `toString` method name causes compiler crash (use `getSymbol` or similar instead)
- Go target has integer division type conversion issues
- Python target has inheritance constructor argument issues

### AI Documentation

The `ai/` folder contains documentation optimized for AI assistants:

- `INSTRUCTIONS.md` - Complete language guide
- `EXAMPLES.md` - Code examples for common patterns
- `GRAMMAR.md` - Formal grammar reference
- `QUICKREF.md` - Quick reference card
- `INTROSPECTION.md` - Compiler introspection API for IDE/AI integration

### Compiler Introspection API (New)

The compiler now exposes powerful introspection capabilities for IDE integration and AI-assisted development:

**Position-Based Type Querying**

- Query what type is at any line/column position in source code
- Convert between line/column and byte offsets
- Find all typed nodes in a source file

**Class Structure Introspection**

- Check if classes have specific properties with optional type verification
- Check if classes have specific methods with optional return type verification
- Get all properties and methods with full signatures
- Track inheritance relationships

**Use Cases**

- IDE autocomplete and hover information
- AI code generation with type-safe suggestions
- Incremental compilation planning
- Codebase analysis and documentation

Example usage:

```typescript
import {
  compileForIntrospection,
  classHasProperty,
  getTypeAtPosition,
} from "./tests/helpers/introspection";

// Compile source code
const result = await compileForIntrospection(sourceCode);

// Check class structure
if (classHasProperty(result, "Person", "name", "string")) {
  // Safe to reference person.name
}

// Query type at cursor position (1-based line/column)
const typeInfo = getTypeAtPosition(result.rootNode, sourceCode, 5, 12);
console.log(typeInfo.evalTypeName); // e.g., "int"
```

See `ai/INTROSPECTION.md` for complete API documentation.

## Installing the compiler

To install the latest test version of the compiler using npm run

```
 npm install -g ranger-compiler
```

Running `ranger-compiler` without arguments shows available command-line options:

```
Ranger compiler, version 2.1.33
Installed at: C:\dev\static\tools\ranger-compiler
Usage: <file> <options> <flags>
Options: -<option>=<value>
  -l=<value>             Selected language, one of es6, go, scala, java7, swift3, cpp, php, csharp, python
  -d=<value>             output directory, default directory is "bin/"
  -o=<value>             output file, default is "output.<language>"
  -classdoc=<value>      write class documentation .md file
  -operatordoc=<value>   write operator documention into .md file
Flags: -<flag>
  -forever       Leave the main program into eternal loop (Go, Swift)
  -allowti       Allow type inference at target lang (creates slightly smaller code)
  -plugins-only  ignore built-in language output and use only plugins
  -plugins       (node compiler only) run specified npm plugins -plugins="plugin1,plugin2"
  -strict        Strict mode. Do not allow automatic unwrapping of optionals outside of try blocks.
  -typescript    Writes JavaScript code with TypeScript annotations
  -npm           Write the package.json to the output directory
  -nodecli       Insert node.js command line header #!/usr/bin/env node to the beginning of the JavaScript file
  -nodemodule    Export the classes as node.js modules (this option will disable the static main function)
  -client        the code is ment to be run in the client environment
  -scalafiddle   scalafiddle.io compatible output
  -compiler      recompile the compiler
  -copysrc       copy all the source codes into the target directory
Pragmas: (inside the source code files)
   @noinfix(true)   disable operator infix parsing and automatic type definition checking
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

## Compiling using TypeScript

The compiler can be used from TypeScript, which makes possible to create new versions of the
compiler just using TypeScript.

Note: the example requires content of Lang, stdlib, stdops and JSON to be loaded for the compiler, in this example they are loaded from the filesystem using `readFileSync`.

```typescript
// Notice this part of example is required:
addFile("Lang.clj", fs.readFileSync("./libs/Lang.clj", "utf8"));
addFile("stdlib.clj", fs.readFileSync("./libs/stdlib.clj", "utf8"));
addFile("stdops.clj", fs.readFileSync("./libs/stdops.clj", "utf8"));
addFile("JSON.clj", fs.readFileSync("./libs/JSON.clj", "utf8"));
```

The full compiler code:

```typescript
import * as R from "ranger-compiler";
import { CodeNode } from "ranger-compiler";

const compilerInput = new R.InputEnv();
compilerInput.use_real = false;

// manually create a filesystem
const folder = new R.InputFSFolder();
const addFile = (name: string, contents: string) => {
  const newFile = new R.InputFSFile();
  newFile.name = name;
  newFile.data = contents;
  folder.files.push(newFile);
};
addFile(
  "hello.clj",
  ` 
class hello {
    static fn main() {
        print "Hello World"
    }
}  
`
);

// compiler requires language definition and libraries to work
const fs = require("fs");
addFile("Lang.clj", fs.readFileSync("./libs/Lang.clj", "utf8"));
addFile("stdlib.clj", fs.readFileSync("./libs/stdlib.clj", "utf8"));
addFile("stdops.clj", fs.readFileSync("./libs/stdops.clj", "utf8"));
addFile("JSON.clj", fs.readFileSync("./libs/JSON.clj", "utf8"));

compilerInput.filesystem = folder;

// set compiler options -l=es6 -typescript
const params = new R.CmdParams();
// target language is Go
params.params["l"] = "go";
params.params["o"] = "hello.go";
params.values.push("hello.clj");
compilerInput.commandLine = params;

// Run compiler
const vComp = new R.VirtualCompiler();

// Check results...
const res = await vComp.run(compilerInput);

// browse through the target compiler file system
res.fileSystem.files.forEach((file) => {
  console.log(file.getCode());
});
```

## Switching to different target language

Include command line parameter `-l=<language>` and the compiler will produce the output files for the language in the output directory.
Available languages are listed when you run the compiler without any parameters.

## Languages and versions supported

Currently the compiler supports at least following language versions:

- JavaScript ES2015
- PHP versions 5.4 and above
- C++ version C++14
- Java version 7
- Swift version 3
- Golang version 1.8
- Scala 2.xx
- CSharp 7.0
- Python 3.x
- Rust (preliminary support, 2021 edition)

However, it is possible to add support for older versions by implementing custom operators, which target to certain compiler flags.

Additionally, JavaScript has '-typescript' flag, which will add typescript annotations to the source file.

# Operators

Operators enable creating short, funtional commands like 'get' or 'push' that operate on certain, typed parameters. Whenever there is
need for some functionality it is woth considering whether it is best implemented using operator or a function or a class method. A
simple operator definition would be `M_PI` which is defined in the Compilers internal Lang.clj file as

```
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
```

Oops! Looks like C# defintion is missing! It should be `Math.PI` and it requires `System`. We can add that easily to Lang.clj

```
    M_PI mathPi:double () {
        templates {
            es6 ("Math.PI")
            go ( "math.Pi" (imp "math"))
            swift3 ( "Double.pi" (imp "Foundation"))
            java7 ( "Math.PI" (imp "java.lang.Math"))
            php ("pi()")
            cpp ("M_PI" (imp "<math.h>"))
            csharp ("Math.PI" (imp "System"))
        }
    }
```

Thus, the platform specific code is implemented using operators, which can also implement native polyfills in the target language.

Operators also be written can be as macros in Ranger language itself.

For a quick reference of available basic operators see [Operators doc](operators.md)

# Plugins

Compiling

```
ranger-compiler hello.clj -npm  -nodemodule
```

Example

```javascript
Import "VirtualCompiler.clj"

flag npm (
  name "hello"
  version "0.0.1"
  description "Plugin Hello World"
  author "Tero Tolonen"
  license "MIT"
)

class Plugin {
  fn features:[string] () {
      return ([]  "postprocess")
  }
  fn postprocess (root:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
    print "*** plugin postprocess was called ***"
  }
}
```

# Notes about the syntax

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

Each file can have a static main function, which is executed as the main program.

```
class Hello {
    static fn main() {
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

## String Operations

Ranger provides a comprehensive set of string manipulation operators. Here are some commonly used ones:

```
def text "Hello World"

; Length and substring operations
def len (strlen text)                    ; returns 11
def sub (substring text 0 5)             ; returns "Hello"

; Case conversion
def lower (to_lowercase text)            ; returns "hello world"
def upper (to_uppercase text)            ; returns "HELLO WORLD"

; Search operations
def idx (indexOf text "World")           ; returns 6
def hasWorld (contains text "World")     ; returns true
def starts (startsWith text "Hello")     ; returns true
def ends (endsWith text "World")         ; returns true

; String manipulation
def replaced (replace text "World" "Ranger")  ; returns "Hello Ranger"
def parts (strsplit text " ")            ; returns ["Hello", "World"]
def trimmed (trim "  hello  ")           ; returns "hello"
```

For the complete list of string operators, see [Operators doc](operators.md).

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

**Warning\*** currently optinal variables in Ranger are not "safe" in the sense the language makes sure that you can not make
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

To integrate with the target languages running environment, Ranger modules can declare `systemclass` which can be used
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
