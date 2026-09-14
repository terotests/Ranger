# Fixture attribution

Markdown cases under `original/`, `new/`, and `gfm/` are taken from
[markedjs/marked](https://github.com/markedjs/marked) **v4.3.0**
(`test/specs/…`), MIT licensed — see `../vendor/LICENSE.md`.

They are used only as inputs; the Node oracle is the vendored `marked.cjs`
`parse` output (not the checked-in `.html` expectations), so engine vs Node
parity is what this harness measures.
