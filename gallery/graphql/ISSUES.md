# GraphQL gallery — notes

## Ranger: bind a call before reading a field

`((node.childNamed("id")).typeText())` and `(node.varNamed("input")).kind`
do not compile. The compiler cannot see `.kind` / `.typeText` on a
parenthesized method result (the same gotcha as ISSUES.md #65 in the
repo root). Bind first:

```ranger
def idField:GqlNode (node.childNamed("id"))
def text:string (idField.typeText())
```

The first test commit had to rewrite about ten of these. They are not
off-by-ones — they are this rule.

## Depth and token limits

`Gql.parse` refuses documents nested more than 256 lists / selection
sets / list types, and documents with more than 100 000 tokens.
`Gql.parseWith` sets both. Without a cap a 50 000-deep `[` chain
overflows the JS stack; on C++ / Rust / Swift it is a segfault.

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

`GqlKind` constants are what the parser and the tests use today. Do not
reintroduce raw `kind = 42`.
