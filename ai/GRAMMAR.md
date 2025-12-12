# Ranger Language Grammar (Simplified BNF)

This document provides a formal grammar specification for the Ranger language.

## Lexical Elements

```bnf
<letter>        ::= 'a'-'z' | 'A'-'Z'
<digit>         ::= '0'-'9'
<identifier>    ::= <letter> (<letter> | <digit> | '_')*
<integer>       ::= <digit>+
<double>        ::= <digit>+ '.' <digit>+
<string>        ::= '"' <any-chars> '"'
<comment>       ::= ';' <any-chars-to-newline>
```

## Top-Level Constructs

```bnf
<program>       ::= <import>* <top-level-def>*

<import>        ::= 'Import' <string>

<top-level-def> ::= <class-def>
                  | <extension-def>
                  | <enum-def>
                  | <systemclass-def>
                  | <operators-def>
```

## Class Definition

```bnf
<class-def>     ::= 'class' <identifier> '{' <class-body> '}'

<class-body>    ::= (<extends-clause>
                  | <constructor>
                  | <property-def>
                  | <method-def>)*

<extends-clause>::= 'Extends' '(' <identifier> ')'

<constructor>   ::= 'Constructor' '(' <param-list>? ')' <block>

<property-def>  ::= 'def' <identifier> <type-annotation>? <expression>?

<method-def>    ::= <fn-keyword> <identifier> <return-type>?
                    '(' <param-list>? ')' <block>

<fn-keyword>    ::= 'fn' | 'sfn'

<return-type>   ::= ':' <type>

<param-list>    ::= <param> (<param>)*

<param>         ::= <identifier> <type-annotation>
```

## Extension Definition

```bnf
<extension-def> ::= 'extension' <identifier> '{' <class-body> '}'
```

## Enum Definition

```bnf
<enum-def>      ::= 'Enum' <identifier> '(' <enum-values> ')'

<enum-values>   ::= <identifier>+
```

## System Class Definition

```bnf
<systemclass-def> ::= 'systemclass' <identifier> '{' <system-mapping>* '}'

<system-mapping>  ::= <target-lang> <native-name> <import-spec>?

<target-lang>     ::= 'es6' | 'java7' | 'go' | 'swift3' | 'cpp' | 'php' | 'csharp' | 'scala'

<import-spec>     ::= '(' '(' 'imp' <string> ')' ')'
```

## Operators Definition

```bnf
<operators-def>  ::= 'operators' '{' <operator-def>* '}'

<operator-def>   ::= <op-name> <op-return> '(' <param-list>? ')' '{' <op-body> '}'

<op-name>        ::= <identifier> | <symbol>

<op-return>      ::= <identifier> <annotations>? ':' <type>

<op-body>        ::= 'templates' '{' <template-def>* '}'

<template-def>   ::= <target-lang> '(' <template-expr>* ')'
                   | '*' '(' <template-expr>* ')'  ; default for all languages

<template-expr>  ::= <string>
                   | '(' 'e' <integer> ')'           ; emit argument
                   | '(' 'typeof' <integer> ')'      ; type of argument
                   | '(' 'block' <integer> ')'       ; emit block
                   | '(' 'imp' <string> ')'          ; add import
                   | 'nl'                            ; newline
                   | 'I'                             ; increase indent
                   | 'i'                             ; decrease indent
```

## Type System

```bnf
<type>          ::= <primitive-type>
                  | <class-type>
                  | <array-type>
                  | <map-type>
                  | <function-type>
                  | <enum-type>

<primitive-type> ::= 'int' | 'double' | 'string' | 'boolean'
                   | 'char' | 'charbuffer' | 'void'

<class-type>    ::= <identifier>

<array-type>    ::= '[' <type> ']'

<map-type>      ::= '[' <type> ':' <type> ']'

<function-type> ::= 'fn' ':' <type> '(' <param-list>? ')'

<type-annotation> ::= <annotations>? ':' <type>

<annotations>   ::= '@' '(' <annotation-list> ')'

<annotation-list> ::= <identifier> (<identifier>)*
```

## Common Annotations

```bnf
<annotation>    ::= 'main'        ; entry point
                  | 'optional'    ; nullable value
                  | 'mutable'     ; can be reassigned
                  | 'weak'        ; weak reference
                  | 'strong'      ; strong reference
                  | 'temp'        ; temporary variable
                  | 'pure'        ; pure function (no side effects)
                  | 'async'       ; asynchronous function
                  | 'throws'      ; function may throw
```

## Statements

```bnf
<statement>     ::= <var-def>
                  | <assignment>
                  | <if-stmt>
                  | <while-stmt>
                  | <for-stmt>
                  | <switch-stmt>
                  | <try-stmt>
                  | <return-stmt>
                  | <throw-stmt>
                  | <break-stmt>
                  | <continue-stmt>
                  | <expression>

<var-def>       ::= 'def' <identifier> <type-annotation>? <expression>?
                  | 'let' <identifier> <type-annotation>? <expression>?

<assignment>    ::= <lvalue> '=' <expression>

<lvalue>        ::= <identifier>
                  | <expression> '.' <identifier>
                  | <expression> '[' <expression> ']'
```

## Control Flow

```bnf
<if-stmt>       ::= 'if' '(' <expression> ')' <block> <block>?
                  | 'if!' '(' <expression> ')' <block> <block>?

<while-stmt>    ::= 'while' '(' <expression> ')' <block>

<for-stmt>      ::= 'for' <expression> <identifier> ':' <type> <identifier> <block>

<switch-stmt>   ::= 'switch' <expression> '{' <case-clause>* <default-clause>? '}'

<case-clause>   ::= 'case' <expression> <block>

<default-clause>::= 'default' <block>

<try-stmt>      ::= 'try' <block> <block>

<return-stmt>   ::= 'return' <expression>?

<throw-stmt>    ::= 'throw' <expression>

<break-stmt>    ::= 'break'

<continue-stmt> ::= 'continue'
```

## Expressions

```bnf
<expression>    ::= <s-expression>
                  | <literal>
                  | <identifier>
                  | <member-access>
                  | <infix-expression>

<s-expression>  ::= '(' <operator> <expression>* ')'

<infix-expression> ::= <expression> <infix-op> <expression>

<infix-op>      ::= '+' | '-' | '*' | '/' | '%'
                  | '==' | '!=' | '<' | '<=' | '>' | '>='
                  | '&&' | '||'

<member-access> ::= <expression> '.' <identifier>

<method-call>   ::= <expression> '.' <identifier> '(' <arg-list>? ')'
                  | <identifier> '(' <arg-list>? ')'
                  | '(' <identifier> <arg-list>? ')'

<arg-list>      ::= <expression> (<expression>)*

<block>         ::= '{' <statement>* '}'
```

## Literals

```bnf
<literal>       ::= <integer>
                  | <double>
                  | <string>
                  | <boolean>
                  | <array-literal>
                  | <lambda>

<boolean>       ::= 'true' | 'false'

<array-literal> ::= '(' '[]' <type> '(' <expression>* ')' ')'
                  | '(' 'make' '_:' <array-type> <integer> <expression> ')'

<lambda>        ::= '(' 'fn' ':' <type> '(' <param-list>? ')' <block> ')'
                  | <block>  ; shorthand when types can be inferred
```

## Object Construction

```bnf
<new-expression>::= '(' 'new' <identifier> ')'
                  | '(' 'new' <identifier> '(' <arg-list>? ')' ')'
```

---

## Built-in Operators Reference

### Variable Operations

| Operator | Signature             | Description     |
| -------- | --------------------- | --------------- |
| `def`    | `def name:Type value` | Define variable |
| `=`      | `left = right`        | Assignment      |

### Arithmetic

| Operator | Signature             | Description    |
| -------- | --------------------- | -------------- |
| `+`      | `_:T (a:T b:T)`       | Addition       |
| `-`      | `_:T (a:T b:T)`       | Subtraction    |
| `*`      | `_:T (a:T b:T)`       | Multiplication |
| `/`      | `_:T (a:T b:T)`       | Division       |
| `%`      | `_:int (a:int b:int)` | Modulo         |

### Comparison

| Operator | Signature             | Description      |
| -------- | --------------------- | ---------------- |
| `==`     | `_:boolean (a:T b:T)` | Equal            |
| `!=`     | `_:boolean (a:T b:T)` | Not equal        |
| `<`      | `_:boolean (a:T b:T)` | Less than        |
| `<=`     | `_:boolean (a:T b:T)` | Less or equal    |
| `>`      | `_:boolean (a:T b:T)` | Greater than     |
| `>=`     | `_:boolean (a:T b:T)` | Greater or equal |

### Boolean

| Operator | Signature                         | Description |
| -------- | --------------------------------- | ----------- |
| `&&`     | `_:boolean (a:boolean b:boolean)` | Logical AND |
| `\|\|`   | `_:boolean (a:boolean b:boolean)` | Logical OR  |
| `!`      | `_:boolean (a:boolean)`           | Logical NOT |

### Optional Handling

| Operator | Signature                         | Description             |
| -------- | --------------------------------- | ----------------------- |
| `null?`  | `_:boolean (v@(optional):T)`      | Check if null           |
| `!null?` | `_:boolean (v@(optional):T)`      | Check if not null       |
| `unwrap` | `_:T (v@(optional):T)`            | Get value from optional |
| `wrap`   | `_@(optional):T (v:T)`            | Wrap value as optional  |
| `??`     | `_:T (left@(optional):T right:T)` | Elvis operator          |

### Array Operations

| Operator          | Signature                           | Description          |
| ----------------- | ----------------------------------- | -------------------- |
| `push`            | `_:void (arr:[T] item:T)`           | Add item to end      |
| `itemAt`          | `_:T (arr:[T] idx:int)`             | Get item at index    |
| `array_length`    | `_:int (arr:[T])`                   | Get array length     |
| `set`             | `_:void (arr:[T] idx:int val:T)`    | Set item at index    |
| `remove_array_at` | `_:void (arr:[T] idx:int)`          | Remove item at index |
| `indexOf`         | `_:int (arr:[T] item:T)`            | Find item index      |
| `slice`           | `_:[T] (arr:[T] start:int end:int)` | Get subarray         |

### Map Operations

| Operator | Signature                          | Description      |
| -------- | ---------------------------------- | ---------------- |
| `set`    | `_:void (map:[K:V] key:K val:V)`   | Set key-value    |
| `get`    | `_@(optional):V (map:[K:V] key:K)` | Get value by key |
| `has`    | `_:boolean (map:[K:V] key:K)`      | Check key exists |
| `keys`   | `_:[K] (map:[K:V])`                | Get all keys     |
| `remove` | `_:void (map:[K:V] key:K)`         | Remove key       |

### String Operations

| Operator       | Signature                                   | Description               |
| -------------- | ------------------------------------------- | ------------------------- |
| `strlen`       | `_:int (s:string)`                          | String length             |
| `substring`    | `_:string (s:string start:int end:int)`     | Get substring             |
| `charAt`       | `_:int (s:string idx:int)`                  | Get char code at index    |
| `at`           | `_:string (s:string idx:int)`               | Get char at index         |
| `strsplit`     | `_:[string] (s:string delim:string)`        | Split string              |
| `trim`         | `_:string (s:string)`                       | Trim whitespace           |
| `indexOf`      | `_:int (s:string sub:string)`               | Find substring            |
| `startsWith`   | `_:boolean (s:string prefix:string)`        | Check if starts with      |
| `endsWith`     | `_:boolean (s:string suffix:string)`        | Check if ends with        |
| `contains`     | `_:boolean (s:string sub:string)`           | Check if contains         |
| `replace`      | `_:string (s:string old:string new:string)` | Replace first occurrence  |
| `to_uppercase` | `_:string (s:string)`                       | Convert to uppercase      |
| `to_lowercase` | `_:string (s:string)`                       | Convert to lowercase      |
| `join`         | `_:string (arr:[string] delim:string)`      | Join array with delimiter |

### Type Conversion

| Operator        | Signature                        | Description                       |
| --------------- | -------------------------------- | --------------------------------- |
| `to_int`        | `_:int (v:double)`               | Double to int                     |
| `to_double`     | `_:double (v:int)`               | Int to double (alias: int2double) |
| `to_string`     | `_:string (v:charbuffer)`        | Buffer to string                  |
| `to_charbuffer` | `_:charbuffer (s:string)`        | String to buffer                  |
| `str2int`       | `_@(optional):int (s:string)`    | Parse string to int               |
| `str2double`    | `_@(optional):double (s:string)` | Parse string to double            |

### Math Functions

| Operator | Signature             | Description    |
| -------- | --------------------- | -------------- |
| `sin`    | `_:double (v:double)` | Sine           |
| `cos`    | `_:double (v:double)` | Cosine         |
| `tan`    | `_:double (v:double)` | Tangent        |
| `asin`   | `_:double (v:double)` | Arc sine       |
| `acos`   | `_:double (v:double)` | Arc cosine     |
| `sqrt`   | `_:double (v:double)` | Square root    |
| `floor`  | `_:int (v:double)`    | Floor          |
| `ceil`   | `_:int (v:double)`    | Ceiling        |
| `fabs`   | `_:double (v:double)` | Absolute value |
| `M_PI`   | `_:double ()`         | Pi constant    |

### I/O Operations

| Operator      | Signature                                       | Description       |
| ------------- | ----------------------------------------------- | ----------------- |
| `print`       | `_:void (msg:string)`                           | Print to console  |
| `read_file`   | `_@(optional):string (path:string file:string)` | Read file         |
| `write_file`  | `_:void (path:string file:string data:string)`  | Write file        |
| `file_exists` | `_:boolean (path:string file:string)`           | Check file exists |
| `dir_exists`  | `_:boolean (path:string)`                       | Check dir exists  |
| `create_dir`  | `_:void (path:string)`                          | Create directory  |

### Miscellaneous

| Operator | Signature                          | Description     |
| -------- | ---------------------------------- | --------------- |
| `new`    | `_:T (class:T)`                    | Create instance |
| `?`      | `_:T (cond:boolean then:T else:T)` | Ternary         |
| `random` | `_:double ()`                      | Random 0-1      |
| `random` | `_:int (min:int max:int)`          | Random in range |
| `sha256` | `_:string (input:string)`          | SHA256 hash     |
| `md5`    | `_:string (input:string)`          | MD5 hash        |

---

## Operator Definition Patterns

### Basic Operator

```clojure
operators {
    myOp _:ReturnType (arg1:Type1 arg2:Type2) {
        templates {
            es6 ("js_code(" (e 1) ", " (e 2) ")")
            java7 ("javaCode(" (e 1) ", " (e 2) ")")
            * ("default(" (e 1) ", " (e 2) ")")
        }
    }
}
```

### Operator with Imports

```clojure
operators {
    myOp _:ReturnType (arg:Type) {
        templates {
            java7 ("SomeClass.method(" (e 1) ")"
                   (imp "com.example.SomeClass"))
            es6 ("require('module').method(" (e 1) ")")
        }
    }
}
```

### Macro Operator (generates Ranger code)

```clojure
operators {
    double _:int (x:int) {
        templates {
            * @macro(true) ("(" (e 1) " * 2)")
        }
    }
}
```

### Operator with Polyfill

```clojure
operators {
    myOp _:string (input:string) {
        templates {
            go ("helperFunc(" (e 1) ")"
                (create_polyfill "
func helperFunc(s string) string {
    return s + s
}
"))
        }
    }
}
```

### Operator with Blocks

```clojure
operators {
    forEach _:void (list:[T] code:block) {
        templates {
            es6 ("for(let item of " (e 1) ") {" nl
                 I (block 2) i nl "}")
        }
    }
}
```

---

## Template Expression Reference

| Expression                 | Description                  |
| -------------------------- | ---------------------------- |
| `(e N)`                    | Emit argument N              |
| `(typeof N)`               | Type name of argument N      |
| `(nameof N)`               | Variable name of argument N  |
| `(block N)`                | Emit block argument N        |
| `(imp "X")`                | Add import statement         |
| `(create_polyfill "code")` | Add helper function          |
| `nl`                       | Newline                      |
| `I`                        | Increase indent              |
| `i`                        | Decrease indent              |
| `(comma N)`                | Comma-separated list         |
| `(list N)`                 | Space-separated list         |
| `(ifa N "str")`            | Emit "str" if arg N exists   |
| `(custom _)`               | Use custom compiler handling |
