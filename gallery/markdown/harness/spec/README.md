# The pinned specification

`commonmark-0.31.2.txt` is the CommonMark specification, verbatim, from
[commonmark/CommonMark](https://github.com/commonmark/CommonMark). It carries
its own licence: **CC-BY-SA-4.0**, in `LICENSE-commonmark-spec`. It is
third-party content under a `gallery/` path and is not relicensed by being
here — see the repository's [`LICENSING.md`](../../../../LICENSING.md).

It is checked in rather than downloaded because a conformance score that can
move when a website does is not a score. The version is in the filename;
raising it is a commit with a diff.

The file is also the corpus: `tools/markdown-parity.mjs` reads the 652
examples out of it the way the specification's own test runner does — fenced
by 32 backticks, the markdown and the expected HTML separated by a lone `.`,
with `→` standing in for a tab.
