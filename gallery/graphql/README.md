# GraphQL — Ranger's northbound data API

A GraphQL language parser written in Ranger: lexer, recursive-descent parser,
typed AST, and a printer. The unit suite is the feature matrix.

```bash
npm run graphql:test
```

This is the language layer for using GraphQL as Ranger's **northbound** API —
the typed door toward application data — not a host bridge. Pointer events,
IME, clipboard and the canvas stay on the other side of the runtime.

```text
┌─────────────────────────────┐
│ Backend / application data  │
│        GraphQL API          │
└──────────────┬──────────────┘
               │
      query / mutation /
        subscription
               │
┌──────────────▼──────────────┐
│       Ranger runtime        │
│                             │
│ generated GraphQL models    │
│ state / controllers         │
│ UI tree / CSS / layout      │
└──────────────┬──────────────┘
               │
       platform services
               │
┌──────────────▼──────────────┐
│ Web / Android / iOS / ...   │
└─────────────────────────────┘
```

## What it reads

| Kind | Examples |
| --- | --- |
| Operations | anonymous `{ … }`, `query`, `mutation`, `subscription` |
| Selections | fields, aliases, arguments, nested sets |
| Variables | `$input: CreateInvoiceInput!`, defaults, list / non-null types |
| Fragments | named, spread, inline (`... on Type`, bare `... { }`) |
| Directives | `@include`, `@skip`, custom, definitions (`repeatable`, locations) |
| Values | int, float, string, block string, boolean, null, enum, list, object, variable |
| SDL | `schema`, `scalar`, `type`, `interface`, `union`, `enum`, `input` |
| Extensions | `extend type` / `enum` / `schema` / … |
| Descriptions | `"…"` and `"""…"""` on types and fields |

Comments (`#`) and commas are Ignored, as in the spec. The first syntax error
wins; a half-built tree is not returned as success.

## The tests are the feature list

`tests/GraphQLTest.rgr` asserts on the **tree**, not on a pretty-print that
can look right while omitting a selection:

- `CreateInvoice` is a mutation whose `$input` has type `CreateInvoiceInput!`
- the Dashboard query's field paths include `Dashboard.invoices.nodes.customer.name`
- the Invoice SDL lists `id: ID!` / `number: String!` / `amount: Float!` / …

Those last two are the shape a later `ranger-graphql-gen` would turn into
Ranger classes. This library stops at the language: it does not talk HTTP,
and it does not generate `.rgr` yet.

```ranger
def r (Gql.parse("query Dashboard { currentUser { id name } }"))
def paths (Gql.fieldPaths("query Dashboard { currentUser { id name } }"))
def fields (Gql.typeFields(sdl "Invoice"))
```

`Gql.format` is the round trip (text → tree → text). Tests compare the second
tree to the first, because whitespace and commas are not part of the language.

## Files

| File | Role |
| --- | --- |
| `src/core/Token.rgr` | Token kinds |
| `src/core/Tokenizer.rgr` | Lexical grammar, including block-string de-indent |
| `src/core/Parser.rgr` | Recursive descent |
| `src/ast/GqlAst.rgr` | One node type, no parent pointers |
| `src/printer/Printer.rgr` | Canonical GraphQL text |
| `src/Gql.rgr` | `parse` / `format` / `fieldPaths` / `typeFields` |
| `tests/GraphQLTest.rgr` | Feature-by-feature suite |

## What this is not

| Interface | GraphQL? |
| --- | --- |
| Ranger ↔ backend data | **yes** — this library |
| Ranger ↔ Android IME | no |
| Ranger ↔ clipboard / pointer / keyboard | no |
| Ranger ↔ Canvas / EVG | no |
| Ranger's widget tree | no |

Server-driven UI (`query Screen { components { type props } }`) is also out of
scope. The schema should describe **data**; Ranger should describe **UI**.
