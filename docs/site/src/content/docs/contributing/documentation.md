---
title: How to add to the reference
description: How to add an example, a description or a new operator source to the generated documentation.
---

The operator reference is generated. Do not edit a page under
`reference/operators/` or `reference/libraries/`: the next build removes the
change. Edit the input of the generator instead.

## The input files

| Directory | Content |
| --- | --- |
| `docs/sources.json` | The list of the files that declare operators. |
| `docs/examples/` | The example programs. Each one compiles. |
| `docs/descriptions/` | One Markdown file per operator, with the prose. |
| `docs/tools/` | The generator. |

## Add an example

1. Find the identifier of the operator. The reference prints it in the address
   of the entry, for example `core/mod.int.int`.
2. Write the program into `docs/examples/core/<category>/<name>.rgr`. Put the
   operator code in the static function `main`.
3. Add the header:

   ```lisp
   ;; id: core/mod.int.int
   ;; title: Integer remainder
   ;; category: numeric
   ```

4. Run the generator:

   ```sh
   npm run docs:generate
   ```

The header keys are `id` (one identifier or more, separated by a comma),
`title`, `category` and `targets`. The key `targets` limits the example to a
list of target languages. The default is every target that has a template.

An example that fails for one target is not an error. The page then shows the
message of the compiler, which is correct information about that target. An
example that fails for every target stops the build.

## Add a description

Write the file `docs/descriptions/<identifier>.md`, where the identifier holds
`__` in the place of the slash and `-` in the place of a point. The identifier
`core/mod.int.int` becomes `core__mod-int-int.md`.

The file holds Markdown paragraphs, inline code and links. The
[writing rules](/Ranger/docs/contributing/writing-rules/) apply to the text.

## Add an operator source

A new library with an `operators { }` block must have an entry in
`docs/sources.json`:

```json
{
  "id": "mylib",
  "file": "lib/MyLib.rgr",
  "title": "My library",
  "always": false,
  "import": "MyLib.rgr",
  "summary": "What the operators of the library do."
}
```

The test `tests/docs-tools.test.ts` fails when a file in `lib/` declares
operators and the registry has no entry for it.

## Build the site

```sh
npm run docs:generate    # the model, the examples, the pages, the coverage
npm run docs:dev         # a local server with the site
npm run docs:build       # the static site in docs/site/dist
```

The generator builds the compiler as a Node module in `docs/.cache/` when the
compiler sources are newer than the cached module. The first run therefore
takes approximately 10 seconds more than the runs after it.
