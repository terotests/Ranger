# Known gaps found by the syntax app

Each entry below has a short program in [`gaps/`](gaps/) and a line in
[`gaps/gaps.json`](gaps/gaps.json). `tests/syntax-app.test.ts` compiles every
probe on every run and fails when one changes state, so a fix cannot land
unnoticed and a gap cannot quietly get worse.

None of these is worked around inside the app except where the note says so.
The app simply does not use the construct, and the comment at the site says
which probe holds it.

## Compiler and language

### `last_index` never compiles

`compiler/Lang.rgr`:

```ranger
last_index _:int ( array:[T] ) {
    templates {
        * @macro(true) ('(array_length ' (e 1) ') - 1')
    }
}
```

The macro writes `(array_length x) - 1`, which is not one expression, so the
result does not type check on any target:

```
[FAIL] Could not match argument types for
   1 │ (array_length nums) - 1
                          ^── here
```

Wrapping the body in one more pair of parentheses would fix it.
Probe: `gaps/last_index.rgr`.

### `make` drops the fill value on ES6

`(make arr 3 7)` writes `new Array(3)` and never uses the `7`, so every element
reads back as `undefined`. The program compiles and then prints the wrong
answer, which is the worst of the two failure modes.
Probe: `gaps/make_fill.rgr`.

### `nullify` does not count as a mutation

The JavaScript writer decides between `const` and `let` from the mutations it
sees, and `nullify` is not one of them, so:

```js
const clearMe = "temporary";
clearMe = undefined;   // TypeError: Assignment to constant variable.
```

`@(mutable)` on the declaration does not change it.
Probe: `gaps/nullify_const.rgr`.

### `empty` cannot be assigned to a typed optional

`(empty x)` keeps the generic return type `T`:

```
[FAIL] Variable was assigned an incompatible type. Types were string vs T
```

Probe: `gaps/empty_typed.rgr`.

### The elvis operator is not infix

`ai/QUICKREF.md` and `README.md` both document `(value ?? fallback)`. That form
fails with `Undefined variable ??`. The prefix form `(?? value fallback)` works,
and the app uses it.
Probe: `gaps/elvis_infix.rgr`.

### `for` does not take an array of arrays

`for grid row:[int] i { }` does not match. The outer walk has to be a `while`
loop over the index.
Probe: `gaps/for_nested_array.rgr`.

### An array of function values cannot be declared

`def ops:[(fn:int (n:int))]` reports `Undefined variable n` at the element type.
Probe: `gaps/lambda_array.rgr`.

### Inheritance is one level deep

A grandchild does not see the fields its grandparent declares:

```
[FAIL] WriteVREF -> Undefined variable name in class Grandchild
```

Probe: `gaps/inheritance_three_levels.rgr`.

### A subclass constructor calls `super` with the wrong names

When the base class has a `Constructor` and the subclass declares its own, the
JavaScript writer emits `super(<the names of the base constructor parameters>)`
inside the subclass constructor. Those names do not exist there:

```
ReferenceError: baseName is not defined
```

`README.md` already notes that "calling the parent class constructor does not
work properly". The app gives its base class an `init` method instead of a
constructor because of it.
Probe: `gaps/super_constructor.rgr`.

### Strings cannot be ordered

`<`, `<=`, `>` and `>=` have `(int,int)`, `(double,double)` and the `char`
overloads, but no `(string,string)` one, so an array of strings cannot be
sorted with the obvious comparator. The `maps` section walks a fixed probe list
rather than sorting `keys`.
Probe: `gaps/string_ordering.rgr`.

### `string + boolean` has no overload

`+` covers `(string,int)`, `(string,double)`, `(string,enum)` and
`(string,string)`. A boolean has to go through `to_string` first. The
`sayBool` helper of the app does that.
Probe: `gaps/string_plus_boolean.rgr`.

### `create_dir` does not nest inside `if!`

`create_dir` writes raw target source; `if!` is a macro whose block is parsed
again as Ranger. The pair fails with `Undefined variable require`. A plain `if`
over a bound boolean works.
Probe: `gaps/create_dir_in_if_not.rgr`.

## `lib/stdlib.rgr`

### `[T].has(el)` calls `indexOf` without a receiver

```ranger
fn has:boolean ( el:T) {
    def idx (indexOf el)      ; should be (indexOf self el)
    return (idx >= 0)
}
```

Any program that calls it fails with
`Could not match argument types for indexOf`, reported at `lib/stdlib.rgr`
rather than at the call site.
Probe: `gaps/stdlib_has.rgr`.

### `[T].contains(cb)` does not bind its block parameter

`contains` has the same signature as `any`, and `any` works. In `contains` the
block parameter `item` does not bind, which points at the name colliding with
the core `contains(string,string)` operator.
Probe: `gaps/stdlib_contains.rgr`.

## Target specific

These compile and run correctly on ES6 and fail elsewhere, so their entry in
`gaps.json` names the target to measure on.

### ~~Go: `for` over an array of objects does not declare the item~~ (fixed)

The Go writer asked `treeReferencesVRef` whether the loop body mentions the
item, and the walk never matched a namespaced path's root — a body reading
only `row.label` was judged not to reference `row`, so the binding line was
omitted and the build stopped at `undefined: row`. Fixed in the compiler; the
shared `render()` of `sx_base.rgr` uses the natural `for rows row:CheckRow i`
form again and the probe is deleted.

### Go: `if!` with one block does not negate

The generated Go runs the block when the condition is **true**. The program
builds, runs and prints the wrong answer; the `control` section shows it as a
`diff` in the matrix.
Probe: `gaps/go_if_not_single_branch.rgr`.

### ~~Python: an empty method body emits nothing under `def`~~ (fixed)

Python has no empty suite, so `def render(self):` with nothing indented under
it is an `IndentationError` — and an empty method is the usual way to write the
default of an overridable hook. The same held for an empty `if:` or `else:`
block, which is what the TypeScript engine tripped over. Both are fixed: the
`(block N)` template command and the Python writer's method-body walk each
write `pass` when the body produced no output. The probe is deleted.

## Not gaps, but worth knowing

Things that surprised on the way and are documented at the site instead of in
`gaps/`:

- `floor` and `ceil` give an **int**, not a double.
- `/` between two integers is real division. Integer division is `idiv`.
- `to_int` and `to_double` of a *string* give an **optional**, like `str2int`.
  Of a double or an int they do not.
- `get` gives an optional on an array as well as on a map. `itemAt` and `at` do
  not.
- `buffer_copy` and its `int_` and `double_` siblings take the **destination**
  first: `(dest destOffset src srcOffset length)`.
- `buffer_fill` takes `(buf value start end)` and the end is excluded.
- `throw` needs `@(throws)` on the function unless the `try` is in the same
  function.
- `on_keypress` takes the *name of an existing* string variable; it does not
  declare one.
- `env_var` gives an optional.
- There is no operator that removes a key from a hash map. `remove` is the
  array one.
- `compiler/Lang.rgr` declares `buffer_fill` twice, with identical bodies.
