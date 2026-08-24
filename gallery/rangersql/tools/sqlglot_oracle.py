#!/usr/bin/env python3
"""Check RangerSQL against SQLGlot itself.

The identity corpus already says how many statements come back out unchanged.
This asks the harder question about the ones that came back CHANGED, and about
every one that came back at all:

    does SQLGlot read RangerSQL's output as the same query it read the input as?

That is the thing a transpiler must not get wrong. A different spelling is a
formatting difference; a different tree is a bug.

    npm run rangersql:identity        # writes bin/identity_out.tsv
    python3 gallery/rangersql/tools/sqlglot_oracle.py

Needs `pip install sqlglot`. Without it the script says so and exits 0, because
a machine with no oracle is not a failing build.
"""
import os
import sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
DUMP = os.path.join(ROOT, "gallery", "rangersql", "bin", "identity_out.tsv")

try:
    import sqlglot
except ImportError:
    print("sqlglot is not installed (pip install sqlglot) - nothing to compare against")
    sys.exit(0)

if not os.path.exists(DUMP):
    print("missing " + DUMP)
    print("run: npm run rangersql:identity")
    sys.exit(1)

same_text = 0
same_tree = 0
different_tree = 0
unreadable = 0
total = 0
examples = []
# Statements SQLGlot refuses in their ORIGINAL form. Nothing to do with us.
corpus_unreadable = 0
corpus_examples = []

with open(DUMP, encoding="utf-8") as fh:
    for raw in fh:
        line = raw.rstrip("\n")
        if not line:
            continue
        parts = line.split("\t")
        if len(parts) != 2:
            continue
        original, ours = parts
        total += 1
        if original == ours:
            same_text += 1
        # The two are parsed SEPARATELY, because failing on one of them is not
        # the same fact as failing on the other.
        #
        # SQLGlot cannot read every line of its own identity corpus — e.g.
        # `DROP TABLE a, b` is in identity.sql and sqlglot 30.x raises on it.
        # Parsing both inside one try reported that as "could not read OURS",
        # which blamed this library for the other one's limitation and made a
        # stated invariant look broken by a change that was byte-identical to
        # the corpus.
        try:
            left = sqlglot.parse_one(original)
        except Exception as exc:  # noqa: BLE001 - the point is to report it
            corpus_unreadable += 1
            if len(corpus_examples) < 5:
                corpus_examples.append(("sqlglot cannot read its own corpus line: " + str(exc).split("\n")[0], original, ours))
            continue
        try:
            right = sqlglot.parse_one(ours)
        except Exception as exc:  # noqa: BLE001 - the point is to report it
            unreadable += 1
            if len(examples) < 10:
                examples.append(("sqlglot could not read OURS: " + str(exc).split("\n")[0], original, ours))
            continue
        if left == right:
            same_tree += 1
        else:
            different_tree += 1
            if len(examples) < 10:
                examples.append(("different tree", original, ours))

print("statements RangerSQL parsed   %d" % total)
print("  byte-identical output       %d" % same_text)
print("  SQLGlot reads it the same   %d" % same_tree)
print("  SQLGlot reads it DIFFERENTLY %d" % different_tree)
print("  SQLGlot could not read ours %d" % unreadable)
print("  (SQLGlot cannot read %d of its own corpus lines either)" % corpus_unreadable)

for why, original, ours in corpus_examples:
    print("")
    print("  " + why)
    print("    in:  " + original)

for why, original, ours in examples:
    print("")
    print("  " + why)
    print("    in:  " + original)
    print("    out: " + ours)

sys.exit(1 if (different_tree or unreadable) else 0)
