# Attribution

This directory vendors [acorn](https://github.com/acornjs/acorn) **v8.14.1**
(`vendor/acorn.js`, the UMD build) for a guest-realm smoke / unit test.

- License: MIT (see `vendor/LICENSE`)
- Copyright: 2012–2024 Acorn contributors / Marijn Haverbeke et al.

The engine load path unwraps the UMD bootstrap and rewrites `new this` →
`new Parser` (see `acorn-smoke.cjs`). Node uses the vendored file as-is.
