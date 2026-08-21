# Fixtures

`identity.sql` is **SQLGlot's own identity corpus**, copied verbatim from
[`tests/fixtures/identity.sql`](https://github.com/tobymao/sqlglot/blob/main/tests/fixtures/identity.sql)
(SQLGlot is MIT licensed, © Toby Mao).

Every line in it is a statement that SQLGlot parses and regenerates
**character for character**. That makes it a ready-made conformance suite for
anything that claims to do the same thing, which is why RangerSQL is measured
against it rather than against fixtures written to match whatever RangerSQL
already does.

`npm run rangersql:identity` runs every line through RangerSQL and prints how
many round-trip identically, how many fail to parse, and how many parse but
regenerate differently. The number is expected to grow; it is not expected to
be 980 for a long time, because the corpus covers window functions, DDL,
PIVOT, LATERAL, INTERVAL arithmetic and several vendor extensions.

`tools/sqlglot_oracle.py` compares the two implementations directly where
Python and SQLGlot are available.
