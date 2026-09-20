---
title: Start a project
description: rgrc init writes a Ranger project — Ranger Coffee by default, or a two-file greeter — without cloning RangerStarter.
---

`npx ranger-compiler Hello.rgr` still compiles a single file. What was missing
was a way to turn a directory into a project. That is `rgrc init`.

```sh
npx ranger-compiler init my-cafe
cd my-cafe
npm install
npx rgrc install          # coffee template: fetch EVG
npm start                 # sample order + receipt.pdf
npm start -- latte bun
npm test
```

The default template is **Ranger Coffee**: a command-line till. You pass product
codes; it prints the bill and writes a PDF receipt that
[EVG](https://github.com/terotests/Ranger/tree/master/lib/evg) laid out. EVG is
MIT (`lib/evg`). The receipt painter in the template is a small Helvetica PDF
writer, also MIT — it does not pull in the AGPL gallery PDF toolkit.

```sh
rgrc init my-cafe
rgrc init my-cafe -template=hello    # greeter, two source files
rgrc init -template=hello            # current directory
rgrc init my-cafe -force             # overwrite src/Main.rgr if it exists
```

`scripts/rgr` is the build loop. Compilers through 3.5.1 printed `[FAIL]` and
exited 0, so `rgrc … && node build/Main.js` ran the previous build. `scripts/rgr`
deletes the output first and reads the log.

## RangerStarter

[RangerStarter](https://github.com/terotests/RangerStarter) is the fuller
clone-and-go kit: fourteen target languages, CI, agent skills, ecosystem
packaging, and an opt-in for the AGPL gallery. `rgrc init` is the small door
next to it — a directory and a program that runs. Clone RangerStarter when you
want the whole kit.

```sh
git clone https://github.com/terotests/RangerStarter my-app
cd my-app && npm install && npm start
```
