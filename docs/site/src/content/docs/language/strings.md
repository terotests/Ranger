---
title: Strings
description: The string operators of Ranger, the form of a string literal, and the index rule that applies to each target language.
---

A string holds text. The type is `string`, and a literal is inside double
quotation marks.

```lisp
def text "Hello World"
```

## The common operators

```lisp
def text "Hello World"

def len (strlen text)                  ; 11
def sub (substring text 0 5)           ; "Hello"

def lower (to_lowercase text)          ; "hello world"
def upper (to_uppercase text)          ; "HELLO WORLD"

def idx (indexOf text "World")         ; 6
def hasWorld (contains text "World")   ; true
def starts (startsWith text "Hello")   ; true
def ends (endsWith text "World")       ; true

def replaced (replace text "World" "Ranger")   ; "Hello Ranger"
def parts (strsplit text " ")                  ; ["Hello", "World"]
def trimmed (trim "  hello  ")                 ; "hello"
```

The operators are in prefix form: the operator is first and the arguments are
after it.

## Concatenation

The `+` operator joins two strings. A value of another type needs a conversion
first, except in a `print` statement, where the compiler adds the conversion.

```lisp
def count 3
print ("count " + count)
def label ("count " + (to_string count))
```

## The index of a character

The index of a character is a code point index. A target language that counts
bytes or UTF-16 units gets the operation that gives the same result as the other
targets. A program therefore reads the same character at the same index on each
target language.

## The complete list

The [string operators](/Ranger/docs/reference/operators/string/) page holds
each operator with its signature, its target support and the code that it
writes for each target language.
