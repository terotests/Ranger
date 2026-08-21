# RangerSQL — a SQL parser, generator and transpiler in Ranger

SQLGlot-inspired, not a SQLGlot port: the same architecture, at the scale one
language runtime can carry, and measured against SQLGlot's own test corpus.

```text
SQL text
   ↓
Tokenizer          one tokenizer, dialect-configured
   ↓
Parser             precedence climbing + recursive descent
   ↓
Common AST         a flat arena of nodes addressed by int
   ↓
 ┌──────────────┬────────────────┬──────────────┐
 ↓              ↓                ↓
Generator     Analysis         Planner
 ↓            (later)            ↓
SQLite / Postgres / MySQL     RangerDB QuerySpec
```

```bash
npm run rangersql:test       # the pieces: tokenizer, tree, generator, dialects
npm run rangersql:identity   # SQLGlot's 980-statement identity corpus
npm run rangersql:oracle     # …and what SQLGlot itself says about our output
```

## Where it is

Against [SQLGlot's own `tests/fixtures/identity.sql`](tests/fixtures/README.md)
— 980 statements it parses and regenerates character for character:

| | count | |
| --- | ---: | --- |
| **identical** | **519** | parsed and came back out the same |
| differs | 3 | parsed, regenerated differently (2 are optimizer hints) |
| unparsed | 458 | the grammar does not cover it yet |

Cross-checked against SQLGlot itself — for the 522 statements RangerSQL parses,
does SQLGlot read our output as the *same query*?

```text
byte-identical output        519
SQLGlot reads it the same    520
SQLGlot reads it DIFFERENTLY   2      (optimizer hints: we print the comment
                                       after the SELECT list, not before it)
SQLGlot could not read ours    0
```

That distinction is the point of the oracle: a different spelling is a
formatting difference; a different tree would be a bug.

What the 458 are, largest first — this is the roadmap, measured rather than
guessed:

| lines | feature |
| ---: | --- |
| 175 | DDL: `CREATE TABLE` / `VIEW` / `FUNCTION` / `INDEX`, `ALTER`, `DROP` |
| 32 | `(` after a statement: `VALUES` lists, `PIVOT`, table functions |
| 9 | `INSERT OVERWRITE` |
| 9 | `:` — struct / map / slice syntax |
| 7 | `GROUPING SETS` |
| ~6 each | `AT TIME ZONE`, array slices `x[1:2]`, `UNION` inside `IN`, `LATERAL` |

## The decisions

### The AST is an arena, not an object graph

```ranger
def id (ast.newNode((SqlKind.binary()) "+"))
ast.attach(id (SqlRole.leftOperand()) left)
```

`SqlAst.nodes[45]`, not `node.parent.args["expressions"][0]`. A tree of objects
with parent pointers is pleasant on a garbage-collected target and painful on
Rust, C++ and Swift — and this library exists to compile to all of them. A node
carries a kind, its text, flags, and `(role, child)` pairs. Roles rather than
named slots, because a `SELECT` has nine kinds of child and inventing nine int
fields would be a worse version of the same list.

### Expressions climb precedence

One table of binding powers instead of a nest of rules called term / factor /
comparison / conjunction:

```text
OR 1   AND 2   NOT 3   comparisons, IS, IN, LIKE, BETWEEN 4
|| & | ^ << >> 5   + - 6   * / % 7   -> ->> 8   :: 9
```

`x BETWEEN 1 AND 2 AND y` parses the way SQL means it because the bounds are
parsed above `AND`'s power, not because of a special case.

### Comments belong to nodes

A comment is a token the parser hands to whatever it was written beside, and
the generator writes it back:

```sql
SELECT 1 /* c1 */ + 2 /* c2 */, 3 /* c3 */
```

round-trips exactly. A formatter that drops the one comment in a query is not a
formatter.

### One tokenizer, one generator, a dialect for the differences

```ranger
Sql.transpile("SELECT IFNULL(a, 0) FROM t" "sqlite" "postgres")
;; SELECT COALESCE(a, 0) FROM t

Sql.transpile("SELECT a FROM t LIMIT 10, 20" "mysql" "postgres")
;; SELECT a FROM t LIMIT 20 OFFSET 10

Sql.transpile("SELECT x::INT FROM t" "postgres" "sqlite")
;; SELECT CAST(x AS INT) FROM t
```

`SqlDialect` answers the handful of questions engines disagree on — which
characters quote a name, whether a backslash escapes inside a string, what a
function is called here, whether `NULLS LAST` exists. Adding MySQL was thirty
lines, not a second tokenizer.

### It is also RangerDB's query engine

[`gallery/rangerdb/src/SqlFront.rgr`](../rangerdb/src/SqlFront.rgr) plans a
parsed `SELECT` into the `QuerySpec` RangerDB already executes, and an
`INSERT` / `UPDATE` / `DELETE` into a `DBMutation`. SQL became a front end over
the existing execution rather than a second way into the engine — which is
exactly what a structured-first database API is for.

The planner refuses rather than guesses: a join, a subquery, an expression in
the projection, `OR` in a `WHERE`, an `UPDATE` with no `WHERE` — each comes back
as an error naming what was in the way. A planner that silently drops a clause
returns the wrong rows and looks like it worked.

And because the plan is a `QuerySpec`, a query typed into the spreadsheet's
**Ctrl+Q box** produces an ordinary editable sheet — sort, filter and
write-back keep working on it, rather than a read-only dump of a result set:

![The SQL query box over a database sheet](../datagrid/artifacts/db_sql_box.png)

```bash
npm run datagrid:db:window          # …then Ctrl+Q
npm run datagrid:db:window:smoke    # the same box, driven headlessly
```

## Milestones

| | | status |
| --- | --- | --- |
| M0 | AST + JSON dump | done |
| M1 | tokenizer | done |
| M2 | precedence-climbing expression parser | done |
| M3 | SELECT / FROM / WHERE | done |
| M4 | JOIN / GROUP / HAVING / ORDER / LIMIT | done |
| M5 | AST → SQL generator | done |
| M6 | SQLite dialect | done |
| M7 | PostgreSQL dialect | done |
| M8 | SQLite ↔ Postgres transpile | done |
| M9 | INSERT / UPDATE / DELETE | done |
| — | window functions, CTEs, set operations, comments | done |
| M10 | CREATE / DDL | next, and the largest corpus bucket |
| M11 | AST visitors and transforms | `walk` / `findKind` exist; `transform` does not |
| M12 | table and column analysis | not started |
| M13 | scope resolver | not started |
| M14 | lineage | not started |
| M15 | simplify / normalize optimizer | not started |
| M16 | MySQL dialect | quoting and NULLS ordering only |
| M17 | wider SQLGlot compatibility | the 458 above |

## Portability

The whole library is ordinary Ranger: no host bindings, no operator templates.
It compiles for all 12 Ranger targets, and the RangerDB suite that now includes
the SQL front end passes identically on **JavaScript, Python and native C++**
(94/94 each) from this same source.

## Files

| File | What is in it |
| --- | --- |
| `src/core/Token.rgr` | the token, and what kinds there are |
| `src/core/Tokenizer.rgr` | text → tokens, comments and string prefixes included |
| `src/core/Parser.rgr` | precedence climbing, statements, error positions |
| `src/core/Sql.rgr` | `parse` / `format` / `transpile` |
| `src/ast/SqlAst.rgr` | the arena: kinds, roles, flags, `walk`, JSON |
| `src/dialects/Dialect.rgr` | generic, SQLite, Postgres, MySQL |
| `src/generators/Generator.rgr` | AST → SQL |
| `tests/RangerSqlTest.rgr` | the pieces, in the small |
| `tests/IdentityTest.rgr` | the corpus, with a baseline that fails on regression |
| `tools/sqlglot_oracle.py` | what SQLGlot says about our output |
