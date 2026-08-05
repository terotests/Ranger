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

A new library with an `operators { }` block or an `operator type:` block must
have an entry in `docs/sources.json`:

```json
{
  "id": "mylib",
  "file": "lib/MyLib.rgr",
  "title": "My library",
  "always": false,
  "import": "MyLib.rgr",
  "summary": "What the operators of the library do.",
  "status": "stable"
}
```

The test `tests/docs-tools.test.ts` fails when a file in `lib/` declares
operators and the registry has no entry for it.

## The status of a source

| Status | Effect |
| --- | --- |
| `stable` | The source gets reference pages and a place in the navigation. |
| `legacy` | The source gets no page. The [not covered page](/Ranger/docs/reference/not-covered/) names it, with the `reason` field. |

Measure before a change of status. The measurement has two parts, and a file is
`legacy` only when it fails both.

**1. The import.** An operator of a library is available only after a program
imports the file:

```sh
grep -rn "Import.*MyLib.rgr" --include="*.rgr" . | grep -v dist/ | grep -v bin/
```

Use a loose pattern. A program can import through a relative path
(`Import "../../lib/MyLib.rgr"`), and a strict pattern misses it.

**2. The playground environment.** The list `libFiles` in
`playground/scripts/build-compiler-env.mjs` states which library files the
browser compiler ships. A program in the playground can import any of them,
also when no file in the repository does. A file on that list stays `stable`,
and the test `docs-tools.test.ts` fails when it does not.

A `legacy` entry needs a `reason`, and the reason states the measurement.

The `CreateFile` list in `compiler/VirtualCompiler.rgr` is **not** a third
signal. That function writes `compileEnv.js`, its only caller is a comment, and
the playground reads `compileEnv.json` from the Node script instead.

## Add an example to a guide page

An example of a guide page has a `topic` header in the place of the `id`
header. The [questions page](/Ranger/docs/faq/) and the
[closed variants page](/Ranger/docs/language/variants/) both use one:

```lisp
;; topic: faq/array-literal
;; title: An array literal instead of repeated push
```

The page then reads the compiled output with `ex("faq/array-literal")`. The page
is an `.mdx` file, because a `.md` file imports no component. A topic example
compiles in the same way as an operator example, so the code on the page is the
output of the compiler.

| Header | Function |
| --- | --- |
| `topic` | The key of the example. The page selects the example with it. The directory of the file is free: `docs/examples/faq/` and `docs/examples/language/` both hold topic examples. |
| `title` | The title of the example. |
| `targets` | The targets that the generator compiles. The default is each target. |

## Build the site

```sh
npm run docs:generate    # the model, the examples, the pages, the coverage
npm run docs:dev         # a local server with the site
npm run docs:build       # the static site in docs/site/dist
```

The generator builds the compiler as a Node module in `docs/.cache/` when the
compiler sources are newer than the cached module. The first run therefore
takes approximately 10 seconds more than the runs after it.
