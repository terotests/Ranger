# Ranger Language Grammar (Simplified BNF)

Formal sketch of the syntax. For operator signatures and per-target output, use
the [generated operator reference](https://terotests.github.io/Ranger/docs/reference/operators/statements/)
and the [FAQ](https://terotests.github.io/Ranger/docs/faq/). Offline syntax card:
[`QUICKREF.md`](QUICKREF.md).

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
                  | <record-def>
                  | <shape-def>
                  | <union-def>
                  | <extension-def>
                  | <enum-def>
                  | <systemclass-def>
                  | <operators-def>
```

## Shape Definition

A closed family of variants: one type, a fixed set of cases, and optional named
subsets (`group`). Lowers to one record class per case plus a union over them.

```bnf
<shape-def>     ::= 'shape' <identifier> '{' <shape-member>* '}'

<shape-member>  ::= <group-def> | <case-def>

<group-def>     ::= 'group' <identifier> ('{' <property-def>* '}')?

<case-def>      ::= ('case' | 'variant') <identifier>
                    ('does' <identifier>)?
                    ('{' <property-def>* '}')?
```

```ranger
shape Value {
    group Ref { def identityId:int 0 }
    case Nothing
    case Num  { def value:double 0.0 }
    case Items does Ref { def items:[Value] }
}
```

A case belongs to at most one group and carries that group's fields as well as
its own. `Value` names the whole family, `Value.Num` one variant and `Value.Ref`
the group — all three are usable as types. Construction is ordinary:
`(new Value.Num(2.5))`.

## Match Statement

```bnf
<match-stmt>    ::= 'match' <identifier> '{' <match-arm>+ '}'

<match-arm>     ::= <arm-names> <binding>? <block>

<arm-names>     ::= <case-or-group> ('|' <case-or-group>)*

<case-or-group> ::= <identifier> | <identifier> '.' <identifier>
```

```ranger
match v {
    Nothing | Text { out = "primitive" }   ; one arm, two cases
    Value.Num n    { out = n.value }       ; binds the variant
    Ref r          { out = r.identityId }  ; a group covers its members
}
```

Every case of the shape must be covered exactly once — a missing case, a case
covered twice and a `_` catch-all are all compile errors. A `match` whose arms
cover exactly one group is complete for a value of that group's type. Lowers to
a chain of `case` narrowings, so no target needs native pattern matching.

Narrowing a single variant without a match is the `case` statement:
`case v n:Value.Num { … }`.

## Union Definition

```bnf
<union-def>     ::= 'union' <identifier> '(' <identifier>+ ')'

; Narrowing: case <value> <binding> ':' <member-type> '{' <block> '}'
```

## Record Definition

```bnf
<record-def>    ::= 'record' <identifier> '{' <property-def>* '}'

; Construction: (new Point(3 4)) or keyword form (new Point xpos 3 ypos 4)
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

Entry point: `sfn main:void ()` (name `main` receives `@(main)` automatically).

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

<target-lang>     ::= 'es6' | 'ts' | 'python' | 'go' | 'java7' | 'kotlin'
                    | 'csharp' | 'rust' | 'dart' | 'swift3' | 'swift6'
                    | 'cpp' | 'php' | 'scala' | 'llvm' | '*'

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

<annotation-list> ::= <identifier> (<identifier> | <string>)*
```

### Common annotations

`main` · `optional` · `mutable` · `weak` · `strong` · `temp` · `lives` ·
`pure` · `async` · `throws` · `singleton` · `serialize`

HTTP route annotations (`GET`, `POST`, `SSE`, …) take a path sibling:
`fn handle@(GET "/"):void (req:HttpRequest res:HttpResponse)`.

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
                  | <method-call>

<s-expression>  ::= '(' <operator> <expression>* ')'

<member-access> ::= <expression> '.' <identifier>

<method-call>   ::= <expression> '.' <identifier> '(' <arg-list>? ')'
                  | <identifier> '(' <arg-list>? ')'

<arg-list>      ::= <expression> (<expression>)*

<block>         ::= '{' <statement>* '}'
```

A call that produces a value used as an argument (including `return`) must be
wrapped in its own parentheses. See
[FAQ — Why does my call not compile?](https://terotests.github.io/Ranger/docs/faq/#why-does-my-call-not-compile).

## Literals

```bnf
<literal>       ::= <integer>
                  | <double>
                  | <string>
                  | <boolean>
                  | <array-literal>
                  | <lambda>

<boolean>       ::= 'true' | 'false'

; Untyped:  ([] a b c)
; Typed:    ([] _:T ( a b c ))   — type marker then a parenthesised group
<array-literal> ::= '(' '[]' <expression>+ ')'
                  | '(' '[]' '_:' <type> '(' <expression>* ')' ')'

<lambda>        ::= '(' 'fn' ':' <type> '(' <param-list>? ')' <block> ')'
                  | <block>  ; shorthand when types can be inferred
```

## Object Construction

```bnf
<new-expression>::= '(' 'new' <identifier> ')'
                  | '(' 'new' <identifier> '(' <arg-list>? ')' ')'
```

## Operator templates (for writing operators)

```ranger
operators {
    myOp _:ReturnType (arg1:Type1 arg2:Type2) {
        templates {
            es6 ("js_code(" (e 1) ", " (e 2) ")")
            * ("default(" (e 1) ", " (e 2) ")")
        }
    }

    double _:int (x:int) {
        templates {
            * @macro(true) ("(" (e 1) " * 2)")
        }
    }
}
```

| Expression | Description |
| --- | --- |
| `(e N)` | Emit argument N |
| `(typeof N)` | Type name of argument N |
| `(nameof N)` | Variable name of argument N |
| `(block N)` | Emit block argument N |
| `(imp "X")` | Add import |
| `(create_polyfill "code")` | Add helper (deduplicated) |
| `nl` / `I` / `i` | Newline / indent / dedent |
| `(comma N)` / `(list N)` | Separated lists |
| `(ifa N "str")` | Emit `"str"` if arg N exists |
| `(custom _)` | Custom compiler handling |

## Built-in operators

Do not maintain signature tables here — they drift. Use:

- [Operator reference](https://terotests.github.io/Ranger/docs/reference/operators/statements/)
- [FAQ](https://terotests.github.io/Ranger/docs/faq/) for array literals, mutation, `!`, memory annotations
- [`QUICKREF.md`](QUICKREF.md) for a short offline list

Notable names agents often get wrong:

| Want | Write |
| --- | --- |
| Integer division | `idiv` (not `/`) |
| Elvis / default | `(?? value fallback)` (prefix) |
| Array set / remove | `set_at` / `remove_index` (also `set` for arrays/maps) |
| Logical not | `(! value)` |
