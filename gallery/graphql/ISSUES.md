# GraphQL gallery — notes

## Ranger: you can call a method on a call result, but you cannot read a field

The compiler accepts a method on a parenthesized call:

```ranger
def text:string ((node.childNamed("id")).typeText())
```

It rejects a **field** on that same shape (the repo-root gotcha, ISSUES.md #65):

```ranger
; does not compile
(node.varNamed("input")).kind
```

Bind first, then read the field:

```ranger
def inputVar:GqlNode (node.varNamed("input"))
def k:int inputVar.kind
```

`typeText()`, `implementsText()`, `isKind()` are methods — they do not need a
temp. About half of the first test commit's rewrites were this rule applied
too widely.

## Depth and token limits

`Gql.parse` refuses documents nested more than 256 lists / selection
sets / list types. `parseWith` may raise that, but `clampLimits` never
lets it past 2048: Node dies around 5000 frames, and the C++ / Rust /
Swift stacks this library targets are smaller. Raise **tokens**, not
depth, when a real schema does not fit.

The default token cap is 1 000 000. 100 000 rejected GitHub-sized SDL
(~1 MB); a million covers that and typical Shopify schemas. A document
that is only `[` characters is still a DoS — that is what the depth
ceiling is for.

## Shapes (later)

`GqlNode` is one fat class plus an int tag. That is the representation
`gallery/game_engine/v2/interp/bench/value_layer/fat.rgr` already
measured as expensive, because every node allocates six collections it
may never use.

A first cut that would pay off without rewriting the whole AST:

- `GqlValue` as a closed family (`Variable | Int | Float | Str | Bool | Null | Enum | List | Object`)
- `GqlType` as `Named | List | NonNull`

Definitions and selections can stay as classes. Parent pointers stay
absent either way — that argument is about ownership, not about shapes.

`GqlKind` constants are what the parser, printer, tests and the GqlNode
walkers (`typeText`, `valueText`, `collectPaths`, `findOp`) use today.
`kindName` is the number → name table and keeps the integers. Do not
reintroduce raw `kind == 42` in a walker.
