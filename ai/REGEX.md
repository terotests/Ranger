# Regex — string-pattern matching

Ranger has **no** `/pattern/flags` literals and **no** `RegExp` type. Patterns are ordinary strings; matching uses `regex_test` or `RegexMatch.testIgnoreCase`.

## Semantics

Matches [ES6 `RegExp(pattern, 'i').test(haystack)`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/test):

- Case-insensitive
- Substring search (pattern may match anywhere in haystack)
- `^` / `$` anchors when present in the pattern string
- Invalid patterns → `false` (native targets catch syntax errors)

## Usage

```rgr
Import "RegexLib.rgr"

if (regex_test "bench.*press" exerciseName) {
  print "matched"
}

if (RegexMatch.testIgnoreCase "squat" lineText) {
  print "ok"
}
```

## Layers

| Layer | Location | Role |
|-------|----------|------|
| **Stdlib** | `lib/Regex/RegexMatch.rgr` | Portable subset (`.`, `*`, `^`, `$`, `\\`) for ranger/swift6 `*` fallback |
| **Intrinsic** | `compiler/Lang.rgr` | `regex_test` — Kotlin `Regex`, ES6 `RegExp`, Swift `range(of:options:)` |

## What not to do

- Do not add `/literal/` regex syntax without a full context-sensitive lexer change
- Do not use regex for ISO date parsing — use `IsoDate/`
- For YearSheet filters: `exact` / `contains` need no regex; `exerciseNameMatch: 'regex'` uses `regex_test`
