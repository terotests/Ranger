# Ranger Coffee

A small command-line till written in Ranger. You pick drinks and pastries from
the board; it prints the bill and writes a PDF receipt that
[EVG](../../lib/evg) laid out.

This directory is the in-repo copy. Outside this tree the same sources are what
`rgrc init my-cafe` writes (with a git dependency on `lib/evg` instead of a
path). MIT, including the tiny Helvetica PDF painter — the AGPL gallery PDF
toolkit is not involved.

## In this repository

```bash
npm run coffee:test     # the cart, without EVG
npm run coffee:run      # sample order → examples/coffee_shop/receipt.pdf
```

Or by hand:

```bash
bash scripts/rgr-suite.sh ./examples/coffee_shop/src/MainTest.rgr \
  ./examples/coffee_shop/bin MainTest.js

bash scripts/rgr-suite.sh ./examples/coffee_shop/src/Main.rgr \
  ./examples/coffee_shop/bin Main.js
node ./examples/coffee_shop/bin/Main.js latte bun cookie
```

## Codes

`espresso` `latte` `cappuccino` `mocha` `bun` `cookie`

Prices include 14 % VAT. `--out=stem` writes `stem.pdf` and `stem.evg.json`.
