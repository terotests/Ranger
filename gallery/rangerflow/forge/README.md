# RangerFlow for Confluence

A Forge macro that does one job: **a pasted RangerFlow share link becomes the
diagram**. No `/iframe`, no width or height fields, no graph storage, no
Confluence editor. RangerFlow itself stays on GitHub Pages.

```text
RangerFlow          Copy for Confluence
                         ↓
Confluence          paste
                         ↓
                    RangerFlow macro
                         ↓
                    the diagram
```

```text
GitHub Pages
┌─────────────────────────┐
│ RangerFlow              │
│ /rangerflow/?embed=1#rf=│
└──────────▲──────────────┘
           │ iframe
           │
┌──────────┴──────────────┐
│ this Forge macro        │
│ • URL autoconvert       │
│ • 650 px × 100 %        │
│ • iframe wrapper        │
└──────────▲──────────────┘
           │
        Confluence
```

## What the user does

1. In RangerFlow, **Copy for Confluence** (or **share link** — either URL
   works).
2. In a Confluence Cloud page, paste.

Confluence matches the URL, inserts this macro, and passes the pasted link as
`autoConvertLink`. The macro adds `?embed=1` if it was missing, iframes the
GitHub Pages app, and RangerFlow fits the diagram to the frame. Width is
whatever the editor's **center / wide / full-width** control already is.

Without this app Confluence can only offer a Smart Link or a generic iframe
macro; a github.io URL is not a first-class embed. That is the whole reason
this wrapper exists.

## Install

You need an [Atlassian developer site](https://developer.atlassian.com/platform/forge/)
and the Forge CLI.

```bash
cd gallery/rangerflow/forge
npm install
npx forge register          # writes a real app.id into manifest.yml
npm run build
npx forge deploy
npx forge install           # pick Confluence, then the site
```

`manifest.yml` ships with a placeholder `app.id`. `forge register` replaces it.
Do not deploy the placeholder to production.

`permissions.external.frames` lets the Custom UI iframe load
`https://terotests.github.io`. `fetch.client` for the same origin lets
**Open in RangerFlow** leave the sandboxed macro through `router.navigate`.

There is no resolver, no Forge storage, and no egress to anywhere else.

## What is matched

Paste any of:

```text
https://terotests.github.io/Ranger/rangerflow/#rf=z…
https://terotests.github.io/Ranger/rangerflow/?embed=1#rf=z…
```

The document travels after `#rf=` so the GET GitHub Pages sees has no diagram
in it. The macro still has to receive the fragment from Confluence's paste
handler — that is client-side, and it is the pasted string, not a server
round-trip.

A later edit in RangerFlow needs a new paste. The link *is* the diagram.

Very long links (the share panel warns above 8 000 characters) can be cut by
Confluence or by a browser. If a paste becomes an empty demo instead of the
drawing you copied, the fragment did not survive; open the link in a tab to
check.

## Tests

```bash
npm test                              # from this directory
npm run rangerflow:forge:test         # from the repository root
```

Those tests do not talk to Atlassian. They check the allow-list, that a
hostile URL cannot become an iframe `src`, that share links still match the
manifest patterns, and that the manifest still has no scopes and no backend.
