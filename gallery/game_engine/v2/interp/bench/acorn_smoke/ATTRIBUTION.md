# Attribution

This directory vendors [acorn](https://github.com/acornjs/acorn) **v8.14.1**
(`vendor/acorn.js`, the UMD build) for a guest-realm smoke / unit test.

- License: MIT (see `vendor/LICENSE`)
- Copyright: 2012–2024 Acorn contributors / Marijn Haverbeke et al.

The engine load path rewrites the UMD bootstrap and a few engine-specific
syntax/runtime pitfalls (see `acorn-smoke.cjs` prepare step). Node uses the
vendored file as-is.
