# Python — can Ranger write idiomatic Python?

The same nine programs as [`../src/`](../src/) compiled with `-l=python`,
then `python3`. Snapshots are in [`generated/`](generated/).

```bash
bash gallery/friendly/python/compile.sh
```

The Python I wanted is 3.12: `None`, `Optional[T]` hints, dataclasses,
`raise` / `except`, generators, `match`, `Protocol`, and a
`if __name__ == "__main__"` guard. Ranger already gets several of those
right, and this is the most readable target in the study.

## Verdict

**I could write Ranger that runs and looks like Python.** Classes are
classes. `None` is `None`. `??` is `x if x is not None else fallback`.
`for xs v:int i` is `for i, v in enumerate(xs)`. Sharing is ordinary
object identity. `try`/`throw` is `try`/`except Exception as e` /
`raise Exception("…")` and it catches. `sfn main` becomes `def main()`
plus the `__main__` guard. Lambdas that are more than an expression are
hoisted to `def __rg_lambda_1`.

**I could not write idiomatic Python.** There are no type hints, no
`@dataclass`, no `Enum`, no `match` statement (shapes dispatch on a
`_rg_kind` string), no `Protocol` / ABC from a Ranger `trait`, no
`yield`, no `with`, no `pathlib`. A `shape` used as Result is two
classes with a kind tag, not a tuple and not an exception hierarchy.
Constructors still assign defaults and then overwrite them.

## How to write Ranger today if the Python output matters

| Wanted Python | Write this Ranger | What comes out |
| --- | --- | --- |
| `@dataclass class Point` | `record Point` | `class Point` with `__init__(self, x, y)` |
| `None` / `x or "unknown"` | `@(optional)`, `(?? x "unknown")` | `None`, `x if x is not None else "unknown"` |
| `raise` / `except` | `try` / `throw` | **works** — `raise Exception` / `except Exception as e` |
| `IntEnum` | `Enum Color` | an integer compared with `==` |
| `match msg:` | `shape` + `match` | `if getattr(r, "_rg_kind", None) == "…"` |
| `class Named(Protocol)` | `trait Named` | copied methods |
| `[v * 2 for v in xs]` | a `for` that `push`es | `enumerate` + `append` |
| `def f[T](x: T) -> T` | `class Stack @params(T)` | `Stack_int` / `Stack_string` |

This is the target where `try`/`throw` is an acceptable spelling, not a
trap. A shape is still better if the same source must run on Rust.

---

## The studies

### 01 — objects and sharing

```python
class Point:
    def __init__(self, x, y):
        self.x = 0
        self.y = 0
        self.x = x
        self.y = y
```

`alias = left` shares. `parent = None` / `c.parent = self` is exactly
Python. `@(weak)` is ignored — the cycle is a normal reference and GC
collects it when nothing else holds the nodes. Double-init of fields is
the constructor template.

### 02 — optionals and Result

`findName` returns `None` or the string. `str2int` is a small
`r_str_to_int` that `return None` on `ValueError`. `ParseOutcome` is two
classes stamped with `_rg_kind`. `describe` is two `if getattr` tests.
Readable, not a `NamedTuple` / `dataclass` Result.

### 03 — enums and match

`Color` is an int. `Message` cases are classes with `_rg_kind`. No
`enum.Enum`, no `match`/`case`.

### 04 — traits

Mixin copy. `show(self, who)` is typed at Ranger compile time as `User`,
so `Bot` cannot be passed. No `Protocol`.

### 05 — iteration

`for i, v in enumerate(xs)` is the Python a human writes when they need
the index. `applyEach` takes a callable. The lambda in `main` is hoisted:

```python
def __rg_lambda_1(p):
    return p + 1
addOne = __rg_lambda_1
```

A one-line body could have been `lambda p: p + 1`. The writer always
hoists.

### 06 — generics

Two classes, `Stack_int` and `Stack_string`. `peek` returns `None` or the
value. No `TypeVar`, no `list[T]`.

### 07 — strings

`greet(self, name)` concatenates with `+`. `firstChar` uses Ranger
`substring`, which becomes a slice. Fine, not `name[0]`.

### 08 — builder

Copying builder is a helper class. `return this` on `MutRequest` is
`return self` — the Python fluent style, and it does not clone.

### 09 — errors

The shape path runs. The throw attempt runs too:

```python
raise Exception("negative")
# …
except Exception as e:
    caught = str(e)   # or error_msg
```

`after_bad negative` prints. That is close enough to idiomatic Python
that I would keep `try`/`throw` on a Python-only program.

## What I could not write

Type hints, dataclasses, `enum.Enum`, `match`, `Protocol`, generators,
`async`, `with` / context managers, `pathlib`, exception classes other
than `Exception(string)`, `__repr__` / `__eq__` from Ranger (`asString`
is just a method).

## How the language could improve (for Python)

1. Emit typing / `Optional[T]` / `list[int]` from Ranger types. The
   writer already knows.
2. `record` → `@dataclass`.
3. `Enum` → `enum.IntEnum`.
4. `shape` + `match` → a `match` statement on `_rg_kind` or a
   `typing.Union`.
5. Field-free `trait` → `Protocol`.
6. One-expression lambdas as `lambda`, not a hoisted def.
7. `asString` → `__str__` (and `equals` → `__eq__`) so `print(obj)`
   works.
