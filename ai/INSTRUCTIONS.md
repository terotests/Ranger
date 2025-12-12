# Ranger Language Reference for AI Code Generation

## Overview

Ranger is a cross-language, cross-platform compiler that compiles a single source code into multiple target languages including JavaScript (ES6), Java, Go, Swift, PHP, C++, C#, Scala, and Kotlin.

The syntax is based on Lisp with S-expressions but uses curly braces `{ }` for block scoping to make it more readable like modern languages.

## ⚠️ Known Issues - IMPORTANT

### Do NOT use `toString` as a method name

The compiler crashes when a class has a method named `toString` AND another class uses that class as an array element type. Use alternative names like `getSymbol`, `asString`, `toStr`, etc.

```clojure
; BAD - causes compiler crash
fn toString:string () { return value }

; GOOD - use alternative name
fn asString:string () { return value }
fn getSymbol:string () { return value }
```

See `ISSUES.md` for full details.

## File Structure

Each Ranger source file uses `.clj` extension and typically contains:

1. Import statements
2. Enum definitions (optional)
3. Class definitions
4. Operator definitions (optional)

---

## Basic Syntax Rules

### Comments

```clojure
; This is a single-line comment
```

### String Literals

Strings use double quotes and follow JSON escaping rules. Can be multiline:

```clojure
def message "Hello World"
def multiline "
    This is a
    multiline string
"
```

### Expression Syntax

- **Outside blocks**: Use Lisp S-expression syntax with parentheses `(operator arg1 arg2)`
- **Inside blocks `{ }`**: Parentheses often optional, but still required for nested expressions

```clojure
; S-expression style (always valid)
(print "Hello")
(def x (+ 10 20))

; Block style (inside { } braces)
{
    print "Hello"
    def x 10
    def y (x + 20)  ; nested expression needs parens
}
```

---

## Type System

### Primitive Types

| Type         | Description           | Example                  |
| ------------ | --------------------- | ------------------------ |
| `int`        | Integer number        | `def x:int 42`           |
| `double`     | Floating-point number | `def y:double 3.14`      |
| `boolean`    | Boolean value         | `def b:boolean true`     |
| `string`     | Text string           | `def s:string "hello"`   |
| `char`       | Single character      | `def c:char 'a'`         |
| `charbuffer` | Byte array/buffer     | `def buf:charbuffer`     |
| `void`       | No return value       | `fn doSomething:void ()` |

### Collection Types

```clojure
; Array (list) of type T
def list:[string]
def numbers:[int]
def objects:[MyClass]

; Hash map (dictionary) with string keys
def map:[string:T]
def userMap:[string:User]
```

### Optional Types

Variables declared without initialization are optional:

```clojure
def maybeValue:MyClass           ; optional (may be null/undefined)
def maybeValue@(optional):string ; explicitly optional

; Check if optional has value
if (!null? maybeValue) {
    def value (unwrap maybeValue)
}

; Elvis operator (use default if null)
def result (maybeValue ?? defaultValue)
```

---

## Variable Declaration

### Using `def`

```clojure
; With type inference
def x 100              ; inferred as int
def y 3.14             ; inferred as double
def name "John"        ; inferred as string
def obj (new MyClass)  ; inferred as MyClass

; With explicit type
def x:int 100
def y:double 3.14
def name:string "John"

; Without initialization (becomes optional)
def item:MyClass

; Mutable variable (can be reassigned in loops)
def counter@(mutable):int 0
```

### Variable Assignment

```clojure
x = 100
name = "Jane"
obj.property = value
```

---

## Classes

### Basic Class Definition

```clojure
class MyClass {
    ; Member variables (properties)
    def name:string ""
    def count:int 0
    def items:[string]

    ; Constructor
    Constructor (n:string) {
        name = n
    }

    ; Instance method
    fn greet:string () {
        return ("Hello " + name)
    }

    ; Static method
    sfn createDefault:MyClass () {
        return (new MyClass("default"))
    }
}
```

### Class Instantiation

```clojure
; With constructor arguments
def obj (new MyClass("John"))

; Without constructor (if no constructor defined)
def obj (new SimpleClass)

; Using static factory method
def obj (MyClass.createDefault())
```

### Inheritance

```clojure
class Parent {
    def value:int 0
    fn getValue:int () {
        return value
    }
}

class Child {
    Extends(Parent)

    fn getDoubleValue:int () {
        return (value * 2)
    }
}
```

### Class Extensions

```clojure
; Add methods/properties to existing class
extension MyClass {
    def extraField:string ""

    fn extraMethod:void () {
        print "Extended functionality"
    }
}
```

### Main Function

```clojure
class MainProgram {
    sfn m@(main):void () {
        ; Program entry point
        print "Hello World"
    }
}
```

---

## Functions

### Instance Methods

```clojure
fn methodName:ReturnType (param1:Type1 param2:Type2) {
    ; function body
    return value
}

; Void function
fn doSomething:void () {
    print "Done"
}
```

### Static Functions

```clojure
sfn staticMethod:ReturnType (param:Type) {
    return value
}

; Call static method
(ClassName.staticMethod(arg))
```

### Anonymous Functions (Lambdas)

```clojure
; Define lambda
def filter (fn:boolean (item:string) {
    return ((strlen item) > 5)
})

; Use lambda
if (filter("testing")) {
    print "Longer than 5 chars"
}

; Lambda as function parameter
fn forEach:void (callback:(fn:void (item:string index:int))) {
    ; ...
}

; Calling with inline lambda
list.forEach({
    print item
})
```

---

## Control Flow

### If Statement

```clojure
; If without else
if (condition) {
    ; then branch
}

; If with else
if (condition) {
    ; then branch
} {
    ; else branch
}

; Negated if (if NOT)
if! (condition) {
    ; executes if condition is false
}
```

### Ternary Operator

```clojure
def result (? condition trueValue falseValue)
```

### Switch/Case

```clojure
switch value {
    case 1 {
        print "One"
    }
    case 2 {
        print "Two"
    }
    default {
        print "Other"
    }
}
```

### While Loop

```clojure
def i 0
while (i < 10) {
    print i
    i = i + 1
}
```

### For Loop (Array Iteration)

```clojure
def list:[string]
; ... populate list

for list item:string index {
    print (index + ": " + item)
}
```

### Loop Control

```clojure
while (true) {
    if (shouldStop) {
        break
    }
    if (shouldSkip) {
        continue
    }
}
```

---

## Operators

### Arithmetic Operators

```clojure
(a + b)    ; addition
(a - b)    ; subtraction
(a * b)    ; multiplication
(a / b)    ; division
(a % b)    ; modulo
```

### Comparison Operators

```clojure
(a == b)   ; equal
(a != b)   ; not equal
(a < b)    ; less than
(a <= b)   ; less than or equal
(a > b)    ; greater than
(a >= b)   ; greater than or equal
```

### Boolean Operators

```clojure
(a && b)   ; logical AND
(a || b)   ; logical OR
(! a)      ; logical NOT
(false == condition)  ; alternative NOT
```

### String Operations

```clojure
; Concatenation
def result (str1 + str2)
def msg ("Value: " + number)

; Length
def len (strlen text)

; Substring
def sub (substring text startIndex endIndex)

; Character at position
def ch (charAt text index)

; Split string
def parts (strsplit text delimiter)

; Trim whitespace
def trimmed (trim text)
```

### Array Operations

```clojure
def list:[string]

; Add item
push list "item"

; Get item at index
def item (itemAt list 0)

; Get length
def len (array_length list)

; Set item at index
set list 0 "newValue"

; Remove item at index
remove_array_at list 0

; Check if contains
def found (indexOf list "item")  ; returns -1 if not found
```

### Hash/Map Operations

```clojure
def map:[string:MyClass]

; Set value
set map "key" value

; Get value (returns optional)
def maybeValue (get map "key")

; Check if key exists
if (has map "key") {
    ; ...
}

; Get all keys
def keys:[string] (keys map)

; Remove key
remove map "key"
```

---

## Import and Modules

```clojure
Import "OtherFile.clj"
Import "lib/Utilities.clj"
```

---

## Enums

```clojure
Enum Color (
    Red
    Green
    Blue
)

class Example {
    def currentColor:Color Color.Red

    fn checkColor:void () {
        if (currentColor == Color.Blue) {
            print "It's blue"
        }
    }
}
```

---

## Error Handling

### Try/Catch

```clojure
try {
    ; risky code
    def result (riskyOperation())
} {
    ; catch block - handles errors
    print "An error occurred"
    print (error_msg)
}
```

### Throw

```clojure
throw "Error message"
```

---

## System Classes

System classes map to native types in target languages:

```clojure
systemclass DOMElement {
    es6 DOMElement
    java7 Element ((imp 'org.w3c.dom.Element'))
}
```

---

## Custom Operators

Define reusable operators with target-specific implementations:

```clojure
operators {
    myOperator _:ReturnType (arg1:Type1 arg2:Type2) {
        templates {
            es6 ("javascript_code(" (e 1) ", " (e 2) ")")
            java7 ("JavaCode(" (e 1) ", " (e 2) ")")
            go ("goCode(" (e 1) ", " (e 2) ")")
            * ("fallback_for_all(" (e 1) ", " (e 2) ")")
        }
    }

    ; Macro-based operator (transforms to Ranger code)
    myMacro _:int (a:int b:int) {
        templates {
            * @macro(true) ("(+ " (e 1) " " (e 2) ")")
        }
    }
}
```

---

## Common Patterns

### Factory Pattern

```clojure
class Product {
    def name:string ""

    sfn create:Product (n:string) {
        def p (new Product)
        p.name = n
        return p
    }
}
```

### Builder Pattern

```clojure
class Builder {
    def config:[string:string]

    fn withOption:Builder (key:string value:string) {
        set config key value
        return this
    }

    fn build:Config () {
        def c (new Config)
        ; apply config
        return c
    }
}
```

### Callback Pattern

```clojure
fn fetchData:void (url:string callback:(fn:void (data:string))) {
    ; ... async operation
    callback(result)
}

; Usage
fetchData("http://api.example.com" {
    print data
})
```

---

## Math Functions

```clojure
(sin x)        ; sine
(cos x)        ; cosine
(tan x)        ; tangent
(asin x)       ; arc sine
(acos x)       ; arc cosine
(sqrt x)       ; square root
(floor x)      ; floor
(ceil x)       ; ceiling
(fabs x)       ; absolute value
(M_PI)         ; pi constant
```

---

## Type Conversion

```clojure
(to_int doubleValue)           ; double to int
(to_double intValue)           ; int to double
(to_string value)              ; any to string
(to_charbuffer text)           ; string to byte buffer
(str2int text)                 ; string to int (optional)
(str2double text)              ; string to double (optional)
```

---

## I/O Operations

### Console Output

```clojure
print "Hello World"
print ("Value: " + x)
```

### File Operations

```clojure
; Read file (returns optional string)
def content (read_file path filename)
if (!null? content) {
    def text (unwrap content)
}

; Write file
write_file path filename content

; Check if file exists
if (file_exists path filename) {
    ; ...
}

; Check if directory exists
if (dir_exists path) {
    ; ...
}

; Create directory
create_dir path
```

### Command Line Arguments

```clojure
def argCount (shell_arg_cnt)
def firstArg (shell_arg 0)
```

---

## Platform-Specific Code

```clojure
if_javascript {
    ; JavaScript-only code
}

if_java {
    ; Java-only code
}

if_go {
    ; Go-only code
}

if_swift {
    ; Swift-only code
}

if_php {
    ; PHP-only code
}

if_cpp {
    ; C++-only code
}

if_csharp {
    ; C#-only code
}
```

---

## Complete Example

```clojure
Import "stdlib.clj"

Enum Status (
    Pending
    Active
    Completed
)

class Task {
    def id:int 0
    def title:string ""
    def status:Status Status.Pending

    Constructor (taskId:int taskTitle:string) {
        id = taskId
        title = taskTitle
    }

    fn complete:void () {
        status = Status.Completed
    }

    fn isCompleted:boolean () {
        return (status == Status.Completed)
    }

    fn toString:string () {
        return ("[" + id + "] " + title)
    }
}

class TaskManager {
    def tasks:[Task]
    def taskMap:[string:Task]
    def nextId:int 1

    fn addTask:Task (title:string) {
        def task (new Task(nextId title))
        push tasks task
        set taskMap title task
        nextId = nextId + 1
        return task
    }

    fn findByTitle@(optional):Task (title:string) {
        if (has taskMap title) {
            return (unwrap (get taskMap title))
        }
        ; return nothing (optional is empty)
    }

    fn listAll:void () {
        for tasks task:Task i {
            print (task.toString())
        }
    }

    fn getCompletedCount:int () {
        def count 0
        for tasks task:Task i {
            if (task.isCompleted()) {
                count = count + 1
            }
        }
        return count
    }

    sfn m@(main):void () {
        def manager (new TaskManager)

        manager.addTask("Learn Ranger")
        manager.addTask("Build something cool")
        def task3 (manager.addTask("Ship it"))

        task3.complete()

        print "All tasks:"
        manager.listAll()

        print ("Completed: " + (manager.getCompletedCount()))

        def found (manager.findByTitle("Learn Ranger"))
        if (!null? found) {
            print ("Found task: " + ((unwrap found).toString()))
        }
    }
}
```

---

## Key Differences from Other Languages

1. **Lisp-style function calls**: `(functionName arg1 arg2)` instead of `functionName(arg1, arg2)`
2. **No semicolons**: Statements separated by newlines
3. **Type after name**: `def name:type value` instead of `type name = value`
4. **Block-style if/else**: `if (cond) { } { }` instead of `if (cond) { } else { }`
5. **For loop syntax**: `for list item:Type index { }` instead of `for (item in list)`
6. **Static methods**: Use `sfn` keyword instead of `static fn`
7. **Main function**: Annotated with `@(main)` attribute
8. **Optional handling**: Explicit with `!null?`, `null?`, `unwrap`, `??`

---

## Tips for AI Code Generation

1. **Always use S-expression syntax for nested operations**: `(a + (b * c))`
2. **Use explicit types when clarity is needed**: `def x:int 0`
3. **Remember operator precedence**: Use parentheses liberally
4. **Handle optionals explicitly**: Check with `!null?` before `unwrap`
5. **Use `@(mutable)` for loop counters** that need reassignment
6. **Import required files** at the top of each source file
7. **One class per file** is conventional but not required
8. **Main entry point** uses `sfn m@(main):void ()`

---

## Environment Setup and Compilation

### RANGER_LIB Environment Variable

The `RANGER_LIB` environment variable tells the compiler where to find language definitions and library files. It should be a semicolon-separated list of paths to `.clj` files.

```powershell
# Windows PowerShell - include both compiler and lib folders
$env:RANGER_LIB="./compiler/Lang.clj;./lib/stdops.clj"

# Or using cross-env in package.json scripts
cross-env RANGER_LIB=./compiler/Lang.clj node bin/output.js -es6 ./myfile.clj
```

The compiler automatically searches for imports in:

1. The directory of the source file being compiled
2. `<install_dir>/../compiler/`
3. `<install_dir>/../lib/`
4. Paths specified in `RANGER_LIB`

### Compiling a Ranger Source File

```bash
# Basic compilation to ES6 JavaScript
node bin/output.js -es6 ./myfile.clj -nodecli

# With output directory
node bin/output.js -es6 ./myfile.clj -nodecli -d=./output

# With specific output filename
node bin/output.js -es6 ./myfile.clj -nodecli -o=myfile.js

# Full example with RANGER_LIB (PowerShell)
$env:RANGER_LIB="./compiler/Lang.clj;./lib/stdops.clj"
node bin/output.js -es6 ./myfile.clj -nodecli -d=./output -o=myfile.js
```

### Compiler Options

| Option        | Description                      |
| ------------- | -------------------------------- |
| `-es6`        | Target ES6 JavaScript            |
| `-java7`      | Target Java 7                    |
| `-go`         | Target Go                        |
| `-swift3`     | Target Swift 3                   |
| `-cpp`        | Target C++                       |
| `-php`        | Target PHP                       |
| `-csharp`     | Target C#                        |
| `-scala`      | Target Scala                     |
| `-kotlin`     | Target Kotlin                    |
| `-nodecli`    | Build for Node.js CLI execution  |
| `-d=<dir>`    | Output directory                 |
| `-o=<name>`   | Output filename                  |
| `-typescript` | Generate TypeScript declarations |

### Recompiling the Ranger Compiler Itself

The compiler is self-hosted (written in Ranger). To recompile it after making changes to compiler source files:

```powershell
# Set environment and compile
$env:RANGER_LIB="./compiler/Lang.clj;./lib/stdops.clj"
node bin/output.js -es6 ./compiler/ng_Compiler.clj -nodecli -d=./bin
```

Or use the npm script:

```bash
npm run compile
```

The compiler source files are in the `compiler/` directory:

- `ng_Compiler.clj` - Main entry point
- `VirtualCompiler.clj` - Core compilation logic
- `Lang.clj` - Language operator definitions
- `ng_*.clj` - Various compiler components

### Exit Codes

The compiler now exits with proper exit codes:

- `0` - Compilation successful
- `1` - Compilation failed (syntax error, type error, or internal error)

This allows integration with build systems and CI/CD pipelines.
