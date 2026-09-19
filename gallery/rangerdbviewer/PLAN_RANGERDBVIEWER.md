# RangerDBViewer — plan

A database workbench in Ranger: open a database, read its real schema, draw it
in RangerFlow, browse it in the DataGrid, export it, measure it, and help write
the next migration.

LibreOffice Base is the shape to aim at — one window, a rail of object kinds
down the left, a list beside it, work in the middle — and the shape to
*disagree* with in one respect: Base is a front end for authoring a database.
RangerDBViewer is a front end for **understanding** one. The first databases it
opens will be someone else's, with three hundred tables and eleven years of
migrations behind them, and the questions worth answering are "what is in here",
"how did it get this way", "what is slow", and "what does the next change look
like".

```text
                     ┌──────────────────────────────┐
   .duckdb  .sqlite  │        RangerDBViewer        │
   later: pg, mongo  │                              │
        │            │  Schema  Data  Diagram       │
        └───────────▶│  Metrics  Migrations  Export │
                     └──────────────────────────────┘
                          │        │         │
                     RangerDB   DataGrid  RangerFlow
                     (engines)  (rows)    (diagram)
                          │                  │
                     DatabaseSchema ─────────┘
                          ▲
                     RangerSQL (DDL)  ←── migration files
```

---

## 1. What already exists

This is the part that decides the plan. Most of RangerDBViewer is already in
the repository as four libraries that have never been introduced to each other.

| Have | Where | What it gives us |
| --- | --- | --- |
| Engine-neutral DB API | `gallery/rangerdb/src/DBBackend.rgr` | `DBSession` / `DBBackend` / `DBCapabilities`, capability fallback, `lastFallback` reporting |
| SQLite engine | `gallery/rangerdb/host/driver_sqlite.cjs` | `node:sqlite`, built in, synchronous, 65/65 on the contract |
| DuckDB engine | `gallery/rangerdb/host/duckdb_worker.mjs` | async DuckDB made synchronous with `Atomics.wait` + `receiveMessageOnPort` — **the pattern every remote engine will reuse** |
| Structured queries | `gallery/rangerdb/src/DBQuery.rgr` | `QuerySpec`, parameter binding, no string building |
| Columnar results | `gallery/rangerdb/src/DataChunk.rgr` | what a virtualised grid page already wants |
| Host wire | `gallery/rangerdb/src/DbWire.rgr`, `host/wire.cjs` | Ranger ↔ Node bridge, already engine-agnostic |
| SQL parser | `gallery/rangersql/src/` | tokenizer, precedence-climbing parser, arena AST, per-dialect generator, transpiler |
| Schema model | `gallery/rangerflow/domains/erd/DatabaseSchema.rgr` | `DBTable`, `DBColumn`, `DBIndex`, `DBConstraint`, `DBForeignKey`, `DatabaseSchema` |
| Schema → diagram | `gallery/rangerflow/domains/erd/SchemaToGraph.rgr` | 284 lines, crow's foot, field-level ports |
| Diagram editor | `gallery/rangerflow/core/` | 12k lines: model, layout, edge routing, hit testing, undo, on WebGL / SVG / PDF / SDL |
| Diagram export | `gallery/rangerflow/export/FlowExport.rgr` | SVG, PDF, HTML, JSON, scene dump |
| Rows in a grid | `gallery/datagrid/src/db/GridDbSource.rgr` | the spreadsheet already reads and writes a `DBSession` |
| App shell precedent | `gallery/datagrid/web/serve.mjs`, `gallery/rangerflow/web/standalone/build.sh` | how a gallery app gets a window and a static build |
| UI state model | `@process` runtime | `markStateDirty`, `ProcessUiHost`, view DTOs — I/O stays in the host |

**The honest summary: the drawing is done, the engines are done, the grid is
done.** What is missing is everything between a live database and that
`DatabaseSchema` object, and everything downstream of *two* of them.

### What is missing

| Missing | Consequence |
| --- | --- |
| Introspection beyond `tableNames()` / `tableColumns()` | `DBBackend` can list tables and result-column types. It cannot report a primary key, a foreign key, an index, a check constraint, a view, or a comment. **Nothing can build a `DatabaseSchema` from a live connection today.** |
| DDL in RangerSQL | `CREATE TABLE` / `ALTER` / `DROP` are the single largest gap in its own scoreboard — 175 of the 458 unparsed corpus lines. Every migration file is DDL. |
| Schema diff | No way to say what changed between two schemas. |
| Migration-file readers | No Flyway, Django, Alembic, Rails, Liquibase reader. |
| Metrics / index analysis | Nothing measures a database. |
| The application | No shell, no object tree, no sections, no window. |
| Remote transport | SQLite and DuckDB are files on a disk. |

---

## 2. Two collisions to clear first

Both are small, both get worse the longer they wait, and Phase 0 exists to fix
them before a single new file imports either side.

### `DBColumn` means two different things

```text
gallery/rangerdb/src/DBValue.rgr:371     class DBColumn   ← a RESULT column: name + kind
gallery/rangerflow/…/DatabaseSchema.rgr:22  class DBColumn   ← a SCHEMA column: type, nullable, PK, FK, default, comment
```

These are genuinely different objects and both names are right in isolation.
But an introspector returns schema columns *through* a backend whose contract
already says `fn tableColumns:[DBColumn]` meaning the other one, so any file
that touches both fails to compile.

Counted usages decide which one moves:

| | files | references |
| --- | ---: | ---: |
| result `DBColumn` | 16 | ~100 |
| schema `DBColumn` | 4 | 23 |

**Rename the schema one to `SchemaColumn`.** Four files, all inside
`gallery/rangerflow` — `DatabaseSchema.rgr`, `SchemaToGraph.rgr`,
`SqlSchemaReader.rgr`, `tests/RangerFlowTest.rgr`. `DBTable`, `DBIndex`,
`DBConstraint` and `DBForeignKey` have no collision and keep their names.

### `DatabaseSchema` lives inside a diagram library

`DatabaseSchema.rgr` is imported by exactly two files, both its siblings, both
by the bare form `Import "DatabaseSchema.rgr"`. Its own header says it should
have "no diagram in sight" — and it does not, it imports nothing at all. But
its *address* is inside a graph editor, which means the metrics analyzer, the
migration differ and the introspector would all have to depend on RangerFlow to
name a table.

**Move it to `gallery/rangerdb/src/schema/DatabaseSchema.rgr`.** Layering then
reads correctly in one direction: RangerDB owns what a database *is*; RangerFlow
has a domain that knows how to draw it; RangerDBViewer uses both.

Update the two importers to the *same* path form — mixed bare-vs-path imports of
one file have broken inherited-method resolution here before (`ISSUES.md` #64),
so there is no compatibility shim. One path, both sites, done in the same commit.

---

## 3. Where the code goes

```text
gallery/rangerdb/src/schema/
  DatabaseSchema.rgr        moved here (Phase 0), SchemaColumn renamed
  DBIntrospector.rgr        the contract: DBSession → DatabaseSchema
  introspect/
    SqliteIntrospector.rgr  sqlite_master + PRAGMA
    DuckdbIntrospector.rgr  duckdb_* catalog functions
    RangerDbIntrospector.rgr  its own catalog
    PostgresIntrospector.rgr  (Phase 7)
    MongoIntrospector.rgr     (Phase 7, by sampling)

gallery/rangersql/src/ast/     SqlKind gains the DDL kinds
gallery/rangersql/src/core/    Parser gains parseCreate / parseAlter / parseDrop
gallery/rangersql/src/generators/  Generator gains the DDL writers
gallery/rangersql/src/schema/
  DdlToSchema.rgr           apply DDL statements to a DatabaseSchema
  SchemaToDdl.rgr           the reverse, per dialect

gallery/rangerdbviewer/
  README.md
  app/
    DbViewerApp.rgr         @process root — the window's state
    DbSource.rgr            engine + DSN + detection, one connection
    ObjectTree.rgr          the left rail's model: schemas → tables → indexes
    SectionSchema.rgr       object list + column detail
    SectionData.rgr         DataGrid over the selected table
    SectionDiagram.rgr      RangerFlow over the introspected schema
    SectionMetrics.rgr      the analysis tool section
    SectionMigrations.rgr   history, timeline, diff, authoring
    SectionExport.rgr       every writer, one dialog
  diff/
    SchemaDiff.rgr          two DatabaseSchema → [SchemaChange]
    SchemaChange.rgr        the change vocabulary
    RenameDetect.rgr        heuristic, always a suggestion
    MigrationPlan.rgr       [SchemaChange] → ordered up/down DDL
  migrations/
    MigrationSource.rgr     the reader contract
    MigrationSet.rgr        an ordered, replayable history
    readers/
      FlywayReader.rgr  DjangoReader.rgr  AlembicReader.rgr
      RailsReader.rgr   LiquibaseReader.rgr  GoMigrateReader.rgr
      PrismaReader.rgr  KnexReader.rgr
    Timeline.rgr            replay → a DatabaseSchema per version
    Drift.rgr               replayed vs live
  metrics/
    StorageMetrics.rgr      sizes, row counts, pages
    IndexAnalysis.rgr       unused, duplicate, redundant, missing
    ConstraintAudit.rgr     no PK, unindexed FK, orphan rows
    ColumnProfile.rgr       nulls, distinct, min/max, histogram
    PlanReader.rgr          EXPLAIN → a graph
    Findings.rgr            severity + suggested DDL
  export/
    ExportDdl.rgr  ExportJson.rgr  ExportMarkdown.rgr
    ExportDbml.rgr ExportMermaid.rgr ExportPlantUml.rgr
    ExportGraphviz.rgr ExportJsonSchema.rgr
  host/
    serve.mjs               the window, after datagrid/web/serve.mjs
    open.cjs                file → engine detection, on the host side
  fixtures/                 chinook.sqlite, a Flyway tree, a Django tree
  tests/
  docs/
```

---

## 4. Phases

Each phase ends with something runnable and something measured. No phase
depends on a later one.

### Phase 0 — clear the ground

Move `DatabaseSchema.rgr`, rename `DBColumn` → `SchemaColumn`, update the two
importers and the RangerFlow test.

- **Exit:** `npm run rangerflow:test` (399 assertions) and `npm run rangerdb:test`
  both pass unchanged. No new behaviour, no new tests — a refactor that changes
  a count is a refactor that did something else too.

### Phase 1 — introspection

The keystone. Everything else in this plan reads its output.

`DBIntrospector` is a contract beside `DBBackend`, not inside it: an engine that
can run queries but not describe itself is still a useful engine, and the
existing 65-assertion contract should not grow a hundred new required methods.

```ranger
class DBIntrospector {
    fn schemaNames:[string] ()
    fn introspect:DatabaseSchema (schemaName:string)
    fn tableDetail:DBTable (schemaName:string table:string)
    fn rowCountEstimate:int (schemaName:string table:string)
}
```

Per engine, using what each one actually offers:

| Engine | Tables & columns | Keys | Indexes | Sizes |
| --- | --- | --- | --- | --- |
| SQLite | `sqlite_master`, `PRAGMA table_info` | `PRAGMA foreign_key_list`, `pk` column of `table_info` | `PRAGMA index_list` + `index_info` + `index_xinfo` | `dbstat` virtual table, `PRAGMA page_count`/`page_size` |
| DuckDB | `duckdb_tables()`, `duckdb_columns()` | `duckdb_constraints()` | `duckdb_indexes()` | `PRAGMA database_size`, `duckdb_tables().estimated_size` |
| RangerDB | its own catalog | its own catalog | — | in-memory accounting |

Two things this phase must get right, because they are cheap now and expensive
later:

- **Views are tables with `kind = "view"`,** and their SQL is kept. A viewer
  that hides views is wrong about a third of most reporting databases.
- **`dbstat` and `duckdb_indexes()` are optional.** Report a metric as
  *unavailable*, never as zero. The existing house rule — "an engine that is not
  installed is reported as skipped, never as failed" — applies to a capability
  as much as to an engine.

- **Test:** a shared `IntrospectContract.rgr` in the shape of the existing
  `DbContract.rgr` — written once, run against every engine, over a fixture
  database built by DDL the test itself issues.
- **Exit:** `npm run rangerdb:introspect:test` green on SQLite, DuckDB and
  RangerDB, with a per-engine table of what each could not answer.

### Phase 2 — the application, opening a file

The window, the rail, the object tree, and rows.

```text
┌────────┬──────────────────┬────────────────────────────────┐
│ Schema │ ▸ main           │  customers                     │
│ Data   │   ▾ tables       │  ┌──────────┬─────────┬──────┐ │
│Diagram │     customers    │  │ column   │ type    │ null │ │
│Metrics │     orders       │  ├──────────┼─────────┼──────┤ │
│Migrate │   ▸ views        │  │ PK id    │ INTEGER │  no  │ │
│ Export │   ▸ indexes      │  │    email │ VARCHAR │  no  │ │
└────────┴──────────────────┴────────────────────────────────┘
```

`DbViewerApp` is a `@process` class: the sections, the selection, the open
connection. Every button is one method on it, so the same authoring runs in the
window and in a headless test — the rule RangerFlow's toolbar already follows.
I/O stays in the host, per the `@process` contract.

Engine detection belongs in the host (`open.cjs`) and is by content, not by
name: a SQLite file starts with `SQLite format 3\0`, a DuckDB file with `DUCK`
at offset 8. Extension is the fallback, not the test — `.db` is claimed by both
and by four other products.

Data browsing is `GridDbSource` unchanged. That is the whole point of it
existing.

- **Exit:** `npm run rangerdbviewer:window -- chinook.sqlite` opens, lists,
  and pages a table. `npm run rangerdbviewer:smoke` drives it headless.

### Phase 3 — the diagram

`introspect() → DatabaseSchema → SchemaToGraph → FlowEditor`. The pipeline
already exists end to end; this phase is wiring plus the two things a *live*
schema needs that a nine-table fixture did not.

- **Subject areas.** A 400-table schema is not a diagram, it is a wall. The
  viewer needs to pick a set — one table plus its neighbours to depth N, or a
  named saved subset — and draw that. Auto-layout on 400 nodes is already
  benchmarked (`rangerflow:bench` at 500), so the constraint is legibility, not
  speed.
- **Layout persistence.** Positions the user dragged must survive a reopen.
  A sidecar `<database>.rdbview.json` beside the file, keyed by qualified table
  name so a new column does not lose the layout. **Never the connection string,
  never credentials** — the sidecar is a layout file and will end up in
  someone's git repository.

- **Exit:** open a real database, get a laid-out ERD, drag it, reopen, find it
  where it was left.

### Phase 4 — DDL in RangerSQL

The enabling work for Phase 5, and worth doing on its own account: it is the
largest single item on RangerSQL's own measured roadmap.

Parse and generate `CREATE TABLE` / `VIEW` / `INDEX`, `ALTER TABLE`
(`ADD` / `DROP` / `RENAME` / `ALTER COLUMN` / `ADD CONSTRAINT`), `DROP`,
`RENAME`, `COMMENT ON`.

Then two adapters:

- `DdlToSchema.rgr` — apply a statement list to a `DatabaseSchema`. This is what
  makes replaying a migration history possible, and it is also what
  `SqlSchemaReader.rgr` becomes: its own header already predicts that "when the
  two meet, this reader becomes a thin adapter over that AST". 720 hand-rolled
  lines retire.
- `SchemaToDdl.rgr` — the reverse, per dialect, which is Phase 6's DDL export
  and Phase 5's migration output.

- **Measured exit:** the SQLGlot identity corpus moves from **458 unparsed** to
  roughly **283**, and the oracle still reports zero statements SQLGlot reads
  differently. Both numbers are already printed by `npm run rangersql:oracle`,
  so this is a scoreboard move, not a claim.

### Phase 5 — migrations

The reason to build the rest.

**Diff.** `SchemaDiff` takes two `DatabaseSchema` and produces an ordered list of
`SchemaChange`: table added/dropped, column added/dropped/retyped, nullability,
default, PK, FK, unique, check, index. Ordering is a correctness property, not
cosmetics — drop foreign keys before the columns they cover, create tables
before the keys that point at them.

**Renames are a suggestion.** A dropped `user_name` and an added `username` of
the same type at the same position is *probably* a rename, and generating
`ALTER TABLE … RENAME COLUMN` on a heuristic silently destroys data when it is
wrong. `RenameDetect` scores candidates and the UI asks. Never silent.

**Reading someone else's history.** `MigrationSource` is one contract with a
reader per convention:

| Convention | Files | Applied-state table |
| --- | --- | --- |
| Flyway | `V<v>__<desc>.sql`, `U…` undo, `R…` repeatable | `flyway_schema_history` |
| Django | `<app>/migrations/NNNN_<name>.py`, `dependencies` graph | `django_migrations` |
| Alembic | `versions/<rev>_<slug>.py`, `down_revision` chain | `alembic_version` |
| Rails | `db/migrate/<ts>_<name>.rb`, `db/schema.rb` | `schema_migrations` |
| Liquibase | XML / YAML / JSON changelogs | `DATABASECHANGELOG` |
| golang-migrate | `NNN_<name>.up.sql` / `.down.sql` | `schema_migrations` |
| Prisma | `prisma/migrations/<ts>_<name>/migration.sql` | `_prisma_migrations` |
| Knex / dbmate / sqlx | numbered or timestamped SQL | varies |

The SQL-file conventions are all the same reader with a different filename
grammar once Phase 4 lands — that is most of the table. Django and Alembic are
the interesting ones and they are *easier*, not harder: their operations are
already a structured list (`CreateModel`, `AddField`, `AlterField`,
`RemoveField`), so the reader extracts operations rather than parsing Python.
Rails and Liquibase are likewise declarative. Ship Flyway and golang-migrate
first (pure DDL, immediate value), then Django, then the rest.

**Evolution.** Replay a `MigrationSet` in order through `DdlToSchema` and keep
the `DatabaseSchema` at each version. That is the schema's history as data, and
it makes three features one feature:

```text
V1 ──▶ V2 ──▶ V3 ──▶ … ──▶ V47      ← the timeline
 │      │                     │
 └──────┴─ diff any two ──────┘      ← what changed, and when
                              │
                        vs live      ← drift
```

Step the diagram through it, diff any two points, or point it at the live
database and get a **drift report** — the difference between what the
migrations say the schema should be and what it actually is. On a database with
eleven years of history, that report is frequently the most valuable screen in
the product.

**Authoring.** Edit the diagram, diff against live, and emit the migration *in
the project's own convention* — a `V48__add_orders_index.sql` for a Flyway tree,
a numbered `.py` with an operations list for a Django one. Destructive
statements are flagged and separated, and the down-migration is generated beside
the up.

- **Exit:** `npm run rangerdbviewer:migrations:test` replays a real Flyway tree
  and a real Django tree from `fixtures/` and asserts the final schema matches
  the one introspected from a database those same migrations built. That is the
  only test of a migration reader that means anything.

### Phase 6 — the tool section: metrics, indexes, metadata

A section, as asked, and a rules engine behind it rather than a wall of numbers.

**Storage** — table and index sizes, row counts, page counts, and for SQLite the
fragmentation `dbstat` exposes.

**Indexes** — the findings that pay for themselves:

- an index no query uses (needs the plan cache or a supplied workload — report
  it as *unobserved*, not as *unused*, when there is no workload to judge by)
- two indexes on the same columns in the same order
- an index whose columns are a prefix of another's
- a foreign key with no index on the referencing side
- a single-column index on a column with two distinct values

**Constraints and metadata** — tables with no primary key, nullable foreign
keys, orphan rows (an actual `LEFT JOIN … IS NULL` count, run on request because
it is not free), columns with no comment in a schema that otherwise comments.

**Column profiles** — null fraction, distinct count, min/max, histogram. The
DataGrid's chart engine already draws these.

**Query plans** — `EXPLAIN QUERY PLAN` on SQLite, `EXPLAIN` on DuckDB, parsed
into a tree and drawn **in RangerFlow**. A plan is a graph; the editor is
already there; a plan node is a compartment node with different words in it.
This is the third domain on the same core, after ERD and UML, and it costs one
file.

Every finding is `Findings.rgr`: a severity, a sentence, and where possible the
DDL that would fix it — which hands straight to Phase 5 as a proposed change.

- **Exit:** `npm run rangerdbviewer:metrics:test` — a fixture database seeded
  with each defect on purpose, asserting each rule fires exactly once and no
  rule fires on the clean control schema. False positives are the failure mode
  of an analyzer, so the control schema is the more important half.

### Phase 7 — over a network

Two different problems that look like one.

**PostgreSQL** is the easy one and mostly already solved: it is asynchronous in
its host, and `duckdb_worker.mjs` is exactly the pattern for that — promises on
a worker thread, `Atomics.wait` on the main one. Introspection is
`information_schema` plus `pg_catalog` (`pg_index`, `pg_stats`, and
`pg_stat_user_indexes`, which finally makes "unused index" an *observed* fact
rather than an inference). It is a new introspector and a new driver, against
contracts that exist.

**MongoDB** is the one that needs an argument. There is no schema to read, so
introspection means sampling documents and *inferring* one: field paths, types
seen and their frequencies, arrays, embedded documents, and reference patterns
between collections. Every inferred field carries the fraction of sampled
documents that had it, because "present in 4% of documents" and "present in
100%" are not the same column and a diagram that draws them alike is lying.
`DatabaseSchema` needs one honest extension for this — a confidence on a column
— and MongoDB's diagram is a collection diagram with dashed inferred edges.

**Security**, once a DSN can be a URL: read-only by default, an explicit gesture
to enable writes, credentials never written to the layout sidecar, and no query
built by string concatenation — `QuerySpec` already guarantees the last one.

---

## 5. The decisions worth arguing about

**The schema model is the interface, not SQL text and not a connection.**
Everything in this plan either produces a `DatabaseSchema` or consumes one:
introspection produces it, migration replay produces it, the diagram consumes
it, the exporters consume it, and the differ consumes two. That is what makes
"diff the live database against migration V31" a sentence the code can say
without either side knowing what the other one is.

**Migration readers extract operations; they do not execute anything.** A Django
migration is a Python file and an Alembic migration is a Python file, and the
temptation to run them is real because it would be accurate. It is also
arbitrary code execution against someone's repository. Read the operations
list — it is structured, it is declarative, and it is what the framework itself
diffs against.

**Refuse rather than guess.** RangerDB's SQL planner already "refuses rather than
guesses — a join, a subquery, an expression in the projection each come back as
an error naming what was in the way", and that rule is worth more here than
there. A migration reader that half-understands a file must say which statement
it could not read, and a schema built from a partly-read history must be marked
as such everywhere it is shown. A confident wrong ERD is worse than no ERD.

**Nothing writes to the database without being asked.** The viewer opens
read-only. Metrics that cost a table scan (orphan-row checks, distinct counts on
a large column) are run on request and say what they will cost first. Generating
a migration produces a *file*, and running it is the user's job with the user's
own tool.

**One diagram core, three domains.** ERD, UML and now query plans are the same
compartment node with different words in it. If the plan viewer needs a change
in `gallery/rangerflow/core/`, that is a signal the change belongs in the domain
file instead.

---

## 6. Risks

| Risk | Mitigation |
| --- | --- |
| DDL parsing is a long tail across dialects | The corpus is already the metric. Ship the subset that carries schema shape, count what is unparsed, and never silently skip a statement. |
| Rename detection destroys data when wrong | It is never applied automatically. It is a scored suggestion with a confirm step. |
| A 400-table ERD is unreadable | Subject areas in Phase 3, not deferred — a viewer that only works on toy schemas has not been tested. |
| `dbstat` / index stats vary by build | Report unavailable, never zero. Same rule the engines already follow. |
| Migration replay diverges from reality | The exit test is exactly this comparison, on both a Flyway and a Django fixture. |
| Scope | Phases 0–3 are a useful product on their own: open a database, see its schema, draw it, browse it, export it. Everything after that is additive. |

---

## 7. Scoreboard

The numbers this plan expects to move, all of them already printed by an
existing command or by one this plan adds.

| Measure | Now | After |
| --- | ---: | ---: |
| RangerSQL identity corpus, unparsed | 458 | ~283 |
| RangerSQL statements SQLGlot reads differently | 0 | 0 |
| Introspection contract, per engine | — | SQLite / DuckDB / RangerDB |
| Migration conventions read | 0 | 8 |
| Export formats | SVG, PDF, HTML, JSON | + DDL (per dialect), Markdown, DBML, Mermaid, PlantUML, Graphviz, JSON Schema |
| Engines | SQLite, DuckDB, RangerDB | + PostgreSQL, MongoDB |

---

## 8. Commands this plan adds

```bash
npm run rangerdb:introspect:test      # the introspection contract, every engine
npm run rangerdbviewer:test           # diff, migration readers, metrics rules
npm run rangerdbviewer:window         # the workbench, on a database file
npm run rangerdbviewer:smoke          # …the same, headless
npm run rangerdbviewer:migrations:test # replay Flyway and Django fixtures
npm run rangerdbviewer:metrics:test   # every rule fires once; none on the control
npm run rangerdbviewer:export         # every writer over a fixture schema
```

---

## 9. Order of work

```text
Phase 0  clear the ground         ── refactor only, no behaviour
Phase 1  introspection            ── the keystone; everything reads its output
Phase 2  the application          ── open a file, list it, page it
Phase 3  the diagram              ── + subject areas, + layout persistence
      ─── a useful product ───
Phase 4  DDL in RangerSQL         ── moves RangerSQL's own scoreboard
Phase 5  migrations               ── diff, read, replay, drift, author
Phase 6  metrics and indexes      ── the tool section
Phase 7  PostgreSQL, MongoDB      ── over a network
```
