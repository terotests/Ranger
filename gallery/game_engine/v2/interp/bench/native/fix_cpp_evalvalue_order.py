#!/usr/bin/env python3
"""Move by-value EvalValue case classes ahead of types that embed the variant.

The C++ writer emits ordinary classes before shape case classes. Any class that
stores `r_union_EvalValue` by value (EvMapEntry, EvPropertyBag, …) then sees
incomplete `EvalValue_Null` / … alternatives. Reference cases are `shared_ptr`
and may stay incomplete; only the six scalar cases must be complete first.
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

PRIMS = ("Null", "Undefined", "Hole", "Number", "String", "Boolean")
MARKER = "/* Ranger C++: by-value EvalValue cases before r_union_EvalValue users */"


def fix(text: str) -> str:
    if MARKER in text:
        return text
    blocks: list[str] = []
    for name in PRIMS:
        m = re.search(rf"(?ms)^class EvalValue_{name} \{{.*?\n\}};\n", text)
        if not m:
            raise SystemExit(f"fix_cpp_evalvalue_order: missing class EvalValue_{name}")
        blocks.append(m.group(0))
        text = text[: m.start()] + text[m.end() :]
    anchor = re.search(r"(?m)^class EvMapEntry \{", text)
    if not anchor:
        raise SystemExit("fix_cpp_evalvalue_order: missing class EvMapEntry")
    insert = MARKER + "\n" + "".join(blocks)
    return text[: anchor.start()] + insert + text[anchor.start() :]


def main() -> None:
    path = Path(sys.argv[1] if len(sys.argv) > 1 else "-")
    if str(path) == "-":
        sys.stdout.write(fix(sys.stdin.read()))
        return
    original = path.read_text()
    updated = fix(original)
    if updated != original:
        path.write_text(updated)
        print(f"fixed EvalValue case order in {path}")
    else:
        print(f"already ordered: {path}")


if __name__ == "__main__":
    main()
