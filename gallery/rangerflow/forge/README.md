# RangerFlow for Confluence

A Forge macro that does one job: **a pasted RangerFlow share link becomes the
diagram**. No `/iframe`, no width or height fields, no graph storage, no
Confluence editor. RangerFlow itself stays on GitHub Pages.

```text
RangerFlow     Copy for Confluence
                    ↓
Confluence     Ctrl/Cmd+V
                    ↓
               RangerFlow macro
                    ↓
               github.io embed
```

Without this app Confluence turns the paste into a Smart Link. GitHub Pages
is not an embed provider, so the page shows:

> We can't display content from this type of terotests.github.io link.

That card is the default site title. Confluence fetched the URL without the
`#rf=` fragment, so it never had the diagram.

## Build and install (local npm)

The Custom UI bundle and `node_modules` are gitignored. Build them on the
machine that deploys.

From the repository root:

```bash
npm run rangerflow:forge:install   # once: npm install in gallery/rangerflow/forge
npm run rangerflow:forge:build     # writes static/rangerflow/macro.js (gitignored)
npm run rangerflow:forge:test
```

Or from this directory:

```bash
cd gallery/rangerflow/forge
npm install
npm test
npm run build
```

Then, once per Atlassian site (needs a [developer account](https://developer.atlassian.com/platform/forge/)
and a Confluence Cloud site you can install apps on):

```bash
npm run login                      # forge login
npm run register                   # writes a real app.id into manifest.yml
npm run deploy                     # build + check + forge deploy
npm run install:confluence         # forge install --product confluence
```

`manifest.yml` ships with a placeholder `app.id`. `npm run register` replaces
it. Keep that change on the machine that owns the app (it is a secret of
sorts: whoever registered it administers it). Later updates:

```bash
npm run deploy
npm run upgrade                    # forge install --upgrade
```

Live-reload against a site:

```bash
npm run watch                      # in one terminal: rebuild Custom UI
npm run tunnel                     # in another: forge tunnel
```

`npm run deploy` refuses to run until `macro.js` exists and `app.id` is no
longer the placeholder.

There is no resolver, no Forge storage, and no egress except GitHub Pages
(`permissions.external.frames` for the iframe, `fetch.client` so **Open in
RangerFlow** can leave the sandbox).

## What is matched

```text
https://terotests.github.io/Ranger/rangerflow/#rf=z…
https://terotests.github.io/Ranger/rangerflow/?embed=1#rf=z…
```

(The published path is `/Ranger/rangerflow/`, not `/rangerflow/`.)

The document travels after `#rf=` so the GET GitHub Pages sees has no diagram
in it. The macro still has to receive the fragment from Confluence's paste
handler — that is client-side, and it is the pasted string, not a server
round-trip.

A later edit in RangerFlow needs a new paste. The link *is* the diagram.

The iframe starts at 650 px × 100 %. The embed page then tells the macro how
tall it wants to be. Width is Confluence's center / wide / full-width control.

Very long links (the share panel warns above 8 000 characters) can be cut by
Confluence or by a browser. If a paste becomes an empty demo instead of the
drawing you copied, the fragment did not survive; open the link in a tab to
check.

Until the app is installed, RangerFlow's **Copy picture** puts a PNG on the
clipboard.

## Tests

```bash
npm test                              # from this directory
npm run rangerflow:forge:test         # from the repository root
```

Those tests do not talk to Atlassian. They check the allow-list, that a
hostile URL cannot become an iframe `src`, that share links still match the
manifest patterns, and that the adapter still has no backend.
