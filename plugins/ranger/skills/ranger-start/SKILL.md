---
name: ranger-start
description: Start Ranger in a project that has none — install the compiler, write the first program that actually runs, and set up the build loop. Use when asked to try Ranger, start a Ranger project, add Ranger to an existing repository, or when a `.rgr` file is to be written somewhere with no Ranger toolchain yet. Also use when asked what Ranger can do or what to build with it.
---

# Starting from nothing

Ranger is a typed, S-expression language that compiles to JavaScript, Python,
Go, C++, Rust, Java, Kotlin, Swift, Dart, C#, PHP and Scala — one source, many
targets. It is self-hosting: the compiler is written in it.

Four commands, and the fourth one prints:

```bash
npm init -y
npm i -D ranger-compiler
cat > Main.rgr <<'RGR'
class Main {
    sfn m@(main):void () {
        print "hei maailma"
    }
}
RGR
rgr run Main.rgr
```

`rgr` comes with this plugin and is on the PATH already. **Use it rather than
calling the compiler directly** — the reason is the next section, and it is not
a style preference.

## The compiler exits 0 when it fails

`rgrc` prints `[FAIL]` and `Compilation FAILED` and then **exits zero**. So:

```bash
rgrc Main.rgr -o=Main.js && node bin/Main.js     # ← DO NOT
```

The `&&` is satisfied by that zero, the previous build is still on disk, and
node runs **that**. The program prints what it printed before the edit: the
change looks applied, the test looks green, and neither is true.

`rgr` deletes the output first, reads the log for the failure the exit status
omits, and treats a missing output file as an error:

```bash
rgr run   Main.rgr              # compile to JS and run
rgr run   Main.rgr -l=python    # the same source, as Python
rgr build Main.rgr -l=go        # compile only
rgr check Main.rgr              # does it compile? nothing else
```

Inside a Ranger checkout `rgr` uses the repository's own compiler; anywhere
else it uses the installed `ranger-compiler`. Same commands either way.

## The second program: more than one file

```ranger
; Greeter.rgr
class Greeter {
    fn hello:string (name:string) {
        return ("hei " + name)
    }
}
```

```ranger
; Main.rgr
Import "Greeter.rgr"

class Main {
    sfn m@(main):void () {
        def g (new Greeter())
        print (g.hello("maailma"))
    }
}
```

`rgr run Main.rgr` — the import is a path relative to the importing file.

## Before writing much Ranger

**Read the `ranger-lang` skill.** Ranger's syntax is small but four of its
rules cost an hour each when met by surprise: a returned call needs its own
parentheses, one statement per line, some method names are reserved and fail at
every CALL SITE rather than where they are defined, and arithmetic on a call
result needs a variable. That skill is the list of them.

## What to build with it

`/ranger:example` lists worked examples by what they do — a parser, a PDF, a
chart, a Figma file, an iOS screen — and sets one up. Ask it before designing
anything from scratch: the gallery has usually solved the shape of the problem
already.

Two families are worth knowing about:

- **A program that runs everywhere.** Parsers, analyzers, generators, small
  tools. Write once, emit JavaScript for the web, Python for the scripts, Go or
  C++ for the speed. This is what Ranger is for and it works today.
- **The gallery** (`gallery/` in a Ranger checkout, AGPL): EVG — a CSS layout
  engine with no browser in it, which prints PDF, PNG, HTML, PowerPoint, Word
  and Figma files; RangerFlow for diagrams; Vela for Vega charts; Rave for
  applications. These need the repository, not only the npm compiler, and the
  `evg-edit` and `rave` skills cover the two that are most often asked for.

## A project layout that stays sane

```
ranger.json          { "name": "app", "entry": "src/Main.rgr" }   and dependencies
src/*.rgr            the source
bin/                 the compiler's output — gitignore it
package.json         "build": "rgr build src/Main.rgr", "start": "rgr run src/Main.rgr"
```

`ranger.json` is Ranger's own package file; a dependency is
`"evg": { "path": "../evg" }`. It matters once there is more than one module;
before that, plain files and `Import` are enough.
