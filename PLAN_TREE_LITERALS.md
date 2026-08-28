# PLAN: Tree literals — `treefactory` and `tree`

> **Status:** the S-expression core is **implemented** and tested. `treefactory`
> declares what a tag builds; `(tree Name (Tag …))` builds one; both are lowered
> to ordinary Ranger — a `new`, some field assignments and some method calls —
> in a single pass before anything else looks at the program. Nine targets
> compile the fixture and five of them (ES6, Go, Rust, C++, Python) print the
> same three lines. XML/JSX-style `<Tag>` is **not** implemented and is only
> ever intended as sugar over this.

---

## What it is, and what it deliberately is not

The valuable part of `createElement` is not React. It is **tree construction**:
a hierarchy written as a hierarchy, and functions that return hierarchies. That
part is a syntax transformation, and it belongs in the language.

Everything else React puts around it — a virtual DOM, a reconciler, a diff, a
render loop, hooks, a DOM host, an element type — is a runtime, and none of it
is here. There is no node type, no base class, no interface, no registry and no
UI in this feature. What a tag means is decided entirely by the factory the
program declares.

## The two forms

```ranger
treefactory UiTree {
    child addKid          ; how a parent takes a child
    text  label           ; the field a bare value child sets
    tag   Row  Box        ; what a tag builds
    tag   Cell Box
}
```

```ranger
def ui (tree UiTree
    (Row (props (name "root"))
        (Cell (props (name "a")) title)
        (Cell (props (name "b")) "literal")
        (child (badge("tero")))))
```

lowers, in the enclosing block, to:

```ranger
def _tree1 (new Box)
_tree1.name = "root"
def _tree2 (new Box)
_tree2.name = "a"
_tree2.label = title
_tree1.addKid(_tree2)
def _tree3 (new Box)
_tree3.name = "b"
_tree3.label = "literal"
_tree1.addKid(_tree3)
_tree1.addKid(badge("tero"))
def ui _tree1
```

That is the whole feature. The generated C++ and Rust contain no helper, no
factory object and no word from this document.

### Inside a tag form

| Form | Meaning |
| --- | --- |
| `(props (name value) …)` | field assignments on the node |
| `(child expr …)` | expressions attached with the factory's `child` method |
| `(Tag …)` where `Tag` is declared | a nested element |
| anything else | a value child, assigned to the factory's `text` field |

`props` is optional; there is no empty-parentheses placeholder, and `()` is a
named error rather than a silently empty child.

`(child …)` exists because `(UserBadge user)` and a mistyped tag are the same
shape. Guessing between them would turn a typo into a call to something that
does not exist, so a computed child is marked. **A component is then just a
Ranger function that returns a node** — no component type, no registration, no
runtime:

```ranger
sfn badge:Box (who:string) {
    return (tree UiTree
        (Cell (props (name "badge")) who))
}
```

## Why the checking is not a second type checker

Every mistake this feature can make is lowered into code that was already
checkable:

| Mistake | Becomes | Reported by |
| --- | --- | --- |
| misspelled property | assignment to a field that does not exist | the type checker |
| wrongly typed property | a type error on that assignment | the type checker |
| child the parent cannot take | argument mismatch on the child call | the type checker |
| tag the factory never declared | — | the pass, by name |
| factory that does not exist | — | the pass, by name |

There is no property table to keep in step with the type checker, because the
type checker is doing the work. The pass raises exactly the two errors the type
checker cannot see.

## Where it happens

One pass, `DesugarTrees`, next to `DesugarShapes` at the top of
`CollectMethods` — before templates, before collection, before type checking.
By the time any target writer runs, there is nothing left to see. Eighteen
writers, no JSX implementations.

## The same syntax over unrelated object spaces

`tests/fixtures/tree_literal.rgr` drives two object spaces that share no base
class, no interface and no shape: a display tree whose parent takes children
with `addKid`, and a SQL select whose parent takes columns with `addColumn`.
Same tag syntax, different everything else. This is the difference from JSX,
where the factory is fixed by the runtime — here it is named at the use site
and defined by the program.

```ranger
treefactory SqlTree {
    child addColumn
    tag   Query  Select
    tag   Column Column
}

def q (tree SqlTree
    (Query (props (table "documents"))
        (Column (props (name "id")))
        (Column (props (name "title")))))
```

## Retained trees, not re-rendering

A tree literal **builds a tree, once**. It is not a render function and nothing
re-runs it. In `gallery/ui`'s terms: a controller may build its subtree with a
tree literal in its constructor and then go on mutating that subtree in place,
exactly as it does now. Nothing about the runtime semantics changes; what
changes is that

```ranger
root = (EVGElement.createDiv())
root.className = "foo"
def title (EVGElement.createDiv())
title.className = "title"
root.addChild(title)
UiTree.leafText(title text)
```

can be written as the tree it already is.

## Where a literal may appear

A tree literal lowers to statements, so it lives where a statement can go: a
function body, a constructor, a loop, an argument, a `return`. That covers the
retained-controller pattern this was wanted for — build the subtree once in the
constructor, keep the reference, mutate it in place afterwards:

```ranger
Constructor (t:string) {
    rootEl = (tree EvgUi
        (Div (props (id "card") (className "ui-card"))
            (Text (props (className "ui-card-title") (elementType 1)) t)))
}
```

It may **not** appear in a class field initializer. That one is not merely
unsupported but badly reported: by the time the pass runs, a class member's
value is no longer reachable from the AST it walks, so the literal survives to
the type checker and fails as `Unknown type: type ID : 11`. Everywhere else a
stray literal is named. Measured, and left named here rather than in a comment
nobody reads.

## Two things trying it on EVG surfaced

Building a real `EVGElement` tree works — `tests`-level proof is in the plan's
fixture, and an EVG tree with classes, ids and text builds correctly. Two gaps
showed up immediately, and both are about the *element API*, not the syntax:

1. **No way to name a node inside a literal.** A retained controller keeps
   `trackEl`, `thumbEl` and mutates them later; a literal returns only its root.
   The natural fix is a `bind` form (`(Div (bind trackEl) …)`), and it is the
   first thing to add if this is used for the controllers.
2. **Class-first helpers are operations, not fields.** `UiTree.setState` writes
   two classes and `UiTree.leafText` writes two fields and clears children; a
   factory can only assign fields. `(props (elementType 1))` reproduces
   `leafText` by hand, which works and reads badly. Either the factory learns to
   call a setter, or `EVGElement` grows the fields these helpers are hiding.

## Not done

- **`<Tag>` syntax.** Only ever sugar over the form above, and deliberately
  last: `<` is ambiguous in an expression language, and there is no reason to
  touch the parser before the semantics have been used in anger. Nothing in the
  current parser produces an XML node, so this is a real parser change when it
  comes.
- **Child lists and fragments.** `(child a b c)` takes several expressions, but
  an expression that evaluates to an *array* of nodes is not spread. That needs
  the pass to know the expression's type, which it cannot at this point in the
  pipeline; the fix is either a `children` keyword that emits a loop, or moving
  the pass after type inference.
- **A declared node type.** `treefactory` has no `node T`, on purpose: it would
  have been a field the lowering never read. The moment child lists need a
  temporary's type, it earns its place.
- **Tags that are not classes.** Every tag maps to a class instantiated with
  `new`. A factory whose tags are made by a static function would need a second
  spelling (`tag Row Box.make`), and there is no user for it yet.
