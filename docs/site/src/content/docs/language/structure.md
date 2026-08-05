---
title: Program structure
description: Classes, functions, blocks and comments in a Ranger program.
---

Ranger uses parentheses for a call and braces for a block. A call has the
operator or the function first, and the arguments after it.

```lisp
print ("sum " + (1 + 2))
```

## Class

A class holds data and functions:

```lisp
class Counter {
    def value:int 0

    fn add:void (amount:int) {
        value = value + amount
    }

    fn current:int () {
        return value
    }
}
```

| Keyword | Function |
| --- | --- |
| `class` | A class with data and functions. |
| `record` | A class that holds data only. The compiler writes a constructor that takes one argument per field, in the order of the fields. `record Point { def x:int 0 def y:int 0 }` gives `(new Point(3 4))`. A record is a reference on every target, like a class. |
| `systemclass` | A class that the target language gives. The compiler writes no code for it. |
| `shape` | A closed family of variants. The body holds a `case` per variant and a `group` per named subset. See [Closed variants](/Ranger/docs/language/variants/). |
| `union` | A type that accepts one of the listed classes: `union Item ( Circle Label )`. The `case` statement narrows it to one member. |
| `fn` | A function of an object. |
| `sfn` | A static function of the class. |
| `def` | A variable or a property. |
| `Import` | Read another source file. |
| `Extend` | Add functions to a class that another file declares. |
| `Enum` | A set of named integer values. |

## Entry point

The compiler starts the program from the static function `main`:

```lisp
class Main {
    sfn main:void () {
        print "the program runs"
    }
}
```

## Comments

A comment starts with `;` and continues to the end of the line.

```lisp
; This line is a comment.
def limit 10   ; This part of the line is also a comment.
```

## Blocks

Braces mark a block. A block is an argument of an operator, and the operator
decides when the block runs.

```lisp
if (limit > 5) {
    print "the limit is large"
} {
    print "the limit is small"
}
```

The `if` operator has three arguments: the condition, the block for a true
condition and the block for a false condition. The third argument is optional.
