# mfiles — an M-Files client and vault, emulated

A place to write and try **M-Files UI Extensibility Framework** applications
without an M-Files server or licence. Everything runs in one browser tab (or in
Node for the checks), and all of it except the page host is Ranger:

```
  your extension (.js)                      UIX v2 (async) or UIX v1 (sync, COM-style)
        │
  ComponentEngine — one per application     Ranger's JavaScript engine
        │  prelude: uix-core + uix1|uix2 + mfgrpc
        │  __mf_vault / __mf_shell / __mf_log
        ▼
  MfUixHost ──── MfShell (window state) ──── MfilesApp (EVG UI, WebGL)
        │
  MfGrpc  — the Vault API as gRPC JSON (field names from vault.d.ts)
        │
  MfVault — objects, versions, check-out/in, search, views, value lists
```

**License:** AGPL-3.0-or-later (Gallery). `uix/uix-api.js` holds enum names and
numbers and the IVault method list generated from the MIT-licensed
`@m-filescorporation/uix-extensions` type declarations.

## Try it

```bash
npm run mfiles:web          # build, serve on http://127.0.0.1:8124/  (?mode=1 for UIX v1)
```

The window follows the M-Files web client: views and applications on the left,
the listing (grouped by object type, or sorted by a column header) in the
middle with the built-in commands and every task-pane command an extension
added, and the right pane with **Metadata** (edit with one editor per datatype,
saving makes a version), **Preview**, the tabs extensions add, and
**Extension code** — an editor where an application is pasted, loaded and
restarted. The console along the bottom shows what applications logged and
every Vault API call they made, and switches the emulator between UIX v1 and v2.

## The pieces

| Path | What it is |
| --- | --- |
| `src/vault/MfVault.rgr` | Metadata (object types, value lists, property defs, classes), objects with versions, implicit versioning on save, check-out/in/undo, required-property validation, search conditions, grouped views, named values, aliases |
| `src/vault/MfSampleVault.rgr` | A small "Sample Vault": job applications, invoices, customers, projects, contacts, views |
| `src/grpc/MfGrpc.rgr` | `Group.Method` + request JSON → `{ok, response}` / `{ok:false, error}` |
| `src/shell/MfShell.rgr` | Location, listing, selection, commands and menus, pane tabs, dialogs, toasts, log |
| `src/uix/MfUixHost.rgr` | One ComponentEngine per application, the native bridge, the event queue, the UIX mode |
| `uix/uix-core.js` | Events, promises, timers and console for both preludes |
| `uix/uix2-prelude.js` | IShellUI, IShellFrame, ICommands, IShellListing, panes, tabs, dashboards, ICommonFunctions, IVault |
| `uix/uix1-prelude.js` | The classic synchronous API: 1-based collections, `MFiles.CreateInstance`, `vault.ObjectPropertyOperations…` |
| `uix/mfgrpc.js` | `MFGrpc` — the helpers of `@m-filescorporation/uix-vault-messages` (TypedValue.Text, PropertyValue.Bool, SearchConditionArray, ObjectVersionEx …) |
| `extensions/` | Samples: Hello World (v2), Metadata Inspector (v2, gRPC), Invoice Approval (v2, uix-vault-messages, a BuiltinCommand veto), Property Report (v1) |
| `web/` | `MfilesApp.rgr` (EVG window over gallery/ui's InputCtl and TableCtl), stylesheet, page host |
| `tools/gen-uix-api.mjs` | Regenerates `uix/uix-api.js` from a newer uix-extensions package |

## Checks and the benchmark

```bash
npm run mfiles:test         # vault, gRPC, engine bridge, UIX apps, the window (headless)
npm run mfiles:bench        # IVault coverage + timings per layer
```

`mfiles:bench` calls every IVault method the official declarations list and
times the same read directly, through UIX v2 and through UIX v1. At the time of
writing: 25 of 40 methods emulated; about 0.14 ms per call direct, 0.9 ms
through a v2 application, 2.5 ms through v1.

## What is not emulated (yet)

- Permissions, ACLs and workflows; files are text, there are no uploads.
- Dashboards are not HTML pages: a tab or popup shows the dashboard id and its
  data, and `data.emulatorView = { title, text, rows: [[label, value]] }` is
  drawn as a card.
- `ShowNewObjectWindow` / `ShowEditObjectWindow` open a placeholder that answers
  Cancel. UIX v1 `ShowMessage` cannot block and returns 1 at once.
- Unimplemented Vault methods reject with code 501 naming the method.

## Engine notes found on the way

Running real extension code through Ranger's ComponentEngine surfaced two
engine bugs, fixed in `gallery/game_engine/v2/interp/migrate/src/ComponentEngine.rgr`:
a native-bridge function called from a bytecode-compiled function body was
"not defined" (`bcExpr` now leaves such calls to the walker), and `new ns.C()`
with a class value on an object was "not a constructor" (D-NEWCLASSMEMBER).
`tests/EngineSmoke.rgr` keeps the first one fixed.

Still true, and worked around in the preludes: a class declared inside a
function does not close over that function's locals (mfgrpc.js reaches its
helpers through a global `__mfg`), `JSON.stringify` includes getters (the wire
serializer drops PascalCase keys), `console.*` cannot be replaced (the host
rewrites it to `__mfConsole.*`), and the realm clock does not advance inside a
turn.
