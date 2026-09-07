# Attribution

This directory vendors [marked](https://github.com/markedjs/marked) **v4.3.0**
for a guest-realm smoke test:

- `vendor/marked.umd.js` — loaded into ComponentEngine
- `vendor/marked.cjs` — Node oracle for HTML parity checks

- License: MIT (see `vendor/LICENSE.md`)
- Copyright: MarkedJS contributors / Christopher Jeffrey

Both builds are checked in so the harness does not need a network fetch at
test time. Bump deliberately — newer marked (v9+/v18) uses syntax the
ComponentEngine parser still rejects in the UMD bootstrap (`typeof x<"u"`
aside, the v18 bundle still fails to parse).
