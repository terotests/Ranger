# PLAN_FIRESIM — a Firebase backend, simulated, under the Ranger apps

Status: **phases 1–7 implemented and gated**; phases 8–11 are the plan.
Module: [`gallery/firesim`](gallery/firesim/README.md).

## The ask

`gallery/realtrainer` is a five-screen application with no backend. It reads
its week out of a JSON file, "saves" through a countdown with nothing behind
it, and streams a coach's reply from a mock that exists so the screen can be
drawn at all. What it needs — and what any Ranger application aimed at a phone
needs — is a backend that can be run:

- with **no Google account**, or with six accounts at once;
- with a **test database seeded in one call**;
- **in a browser**, with no heavy emulator, no Java, no Docker;
- **inside an Android or an iOS simulator**, and on a device on the same
  network;
- with the **latencies and failures** a real network has, on purpose;
- with **streamed HTTP**, because the AI screen draws a reply as it arrives;
- and — second priority — perhaps on a **watch**, Wear OS or watchOS.

And when the app is ready for a real project, the change should be the
**deployment target and nothing else**.

## The decision the rest follows from

> **The seam is the wire protocol, not an interface invented for the
> simulator.**

The obvious design is a `Backend` interface with the methods the app happens
to call, and a `FakeBackend` behind it. That design fails in a specific and
expensive way: the fake passes, the app ships, and production teaches
everything the fake's author did not know — that `update` on a missing
document is a 404 rather than a create, that an `orderBy` on a field a
document lacks removes that document from the result, that an inequality on
two fields is refused outright, that a `list` is denied whole rather than
filtered.

So the simulator answers **Google's published REST surface**: Firestore's
documents, `:runQuery`, `:commit` and `:batchGet`; the Identity Toolkit's
`accounts:*`; the emulator's own wipe endpoints. The app builds those request
bodies and reads those response shapes, and "switch to the real backend"
becomes a base URL.

The second decision follows from the first:

> **The transport is a queue and knows nothing about the simulator.**

`FsTransport` is a mailbox: requests in one end, answers out the other.
`FsSimBridge` drains it into the in-process simulator; a host (URLSession,
OkHttp, `fetch`, libcurl) drains it over HTTPS. Ranger has no HTTP and should
not — the language has no business owning a socket, and every host already has
one that is configured, proxied and trusted on that platform.

That split is also what keeps a client build small enough to be worth
compiling for a watch.

```
        the app  (Ranger — one source, twelve targets)
            │
        FsClient                requests built, answers read
            │
        FsTransport             a queue. Nothing else.
     ┌──────┴───────┐
FsSimBridge      the host       URLSession / OkHttp / fetch / libcurl
     │                                        │
   FsSim         the clock, the wait, failure │
     │                                        ▼
  FsServer       routing                firestore.googleapis.com
     │
  ┌──┴────┬──────────┬─────────┐
FsStore FsQuery  FsRulesEval FsAuth      FsAi
```

## Phase 1 — the value model and the store *(done)*

`FsValue` is a Firestore value with its REST encoding (`{"integerValue":"45"}`,
`{"mapValue":{"fields":…}}`) and Firestore's **canonical cross-type order**:
null < boolean < number < timestamp < string < bytes < reference < geopoint <
array < map, with integers and doubles sharing one slot and comparing
numerically. `FsTime` does RFC 3339 both ways with no host `Date`, so a
document sorts identically on Node, Kotlin and Swift.

`FsStore` keeps documents by full path; a collection is implied by the
documents under it and never recorded. What it is deliberately faithful about:

- a collection lists in `__name__` order, never insertion order;
- a subcollection survives its parent document's deletion;
- `update` on a missing document fails; `set` creates;
- `set` with a merge mask writes only the named fields;
- the field transforms — `serverTimestamp`, `increment`, `maximum`,
  `minimum`, `arrayUnion`, `arrayRemove` — are applied **by the server** after
  the write;
- every write bumps one counter and appends to one change log, which is what a
  snapshot listener will replay (phase 6).

## Phase 2 — queries, and the ones the real API refuses *(done)*

`FsQuery` is the REST `StructuredQuery`: `from` (with `allDescendants` for a
collection group), a composite `where`, `orderBy`, `limit`, `offset`, and two
cursors. Running it is a loop; the value is in `validate()`, which returns the
message the real API returns:

- an inequality constrains at most one field;
- with an inequality, the first `orderBy` must be on that field;
- one `array-contains`; one of `in` / `not-in` / `array-contains-any`;
- a document missing an `orderBy` field is not in the result;
- a filter on an absent field matches nothing — not even `!=`;
- every result is finally ordered by `__name__`, so paging is total.

`indexHint()` prints the composite index a query would need. Whether such an
index exists is **not** simulated: a guess would be wrong in both directions.

## Phase 3 — the rules, in the real language *(done)*

The half of a backend an app cannot test without one. `FsRules` is a scanner
and a recursive-descent parser for `firestore.rules` — the file a project
deploys — and `FsRulesEval` runs it against one request.

Supported: nested `match`, `{var}` and `{var=**}`, user functions with
parameters, `&& || !`, the comparisons, `in`, `is`, the ternary, list
literals, path literals with `$(interpolation)`, `request.auth`,
`request.auth.token.*`, `request.resource.data`, `resource.data`,
`request.method`, `request.time`, `exists()`, `get()`, and `.keys()`
`.values()` `.size()` `.get(k,d)` `.hasAll()` `.hasAny()` `.hasOnly()`
`.toMillis()` `.lower()` `.upper()` `.split()`.

Not supported: `getAfter()`, `existsAfter()`, `.diff()`, regular expressions
in `.matches()`, `math.*`. **Every one of them is a parse error with a line
number, never a quiet allow** — a rules engine that ignores a clause it did
not understand is the most dangerous thing such a module could contain. An
evaluation error denies, as the real engine does.

Two behaviours kept because people get them wrong: a block's `allow` covers
its own path and no deeper, and reading an absent field is an error rather
than a null.

A `list` is evaluated per document and **one denial denies the whole query** —
what the Firebase emulator does, and the "your query would return documents
you do not have access to" a broad query gets in production. Filtering the
result instead would let a query pass here that the real thing rejects.

## Phase 4 — accounts, the clock, and a model that streams *(done)*

**Accounts.** The Identity Toolkit subset, minting the same token shape the
Auth emulator mints — a JWT with `alg: none` and an empty signature — so a
client that decodes its own token for `uid` or a custom claim works unchanged,
and the credential is refused by production. `tokenLifetimeMs` runs on the
simulated clock, which makes "what does the app do when its token expires" a
case you can run.

**The clock.** A call is a handle: issued at one moment, readable at another,
and the app moves between them by ticking — the same tick RealTrainer already
drives its animation with. A request is answered when it becomes *ready*, not
when it was issued, so two writes issued together land in the order their
latencies say. `baseMs` and per-kind overrides, seeded `jitterMs`, `failNext`,
`failRate` and `offline`. Nothing sleeps; a suite of two hundred cases runs in
the time it takes to run the loops.

**The model.** `FsAi` answers deterministically, a word per `chunkMs`, over
SSE in two shapes: a plain one and Gemini's `:streamGenerateContent`. The
reply branches on the prompt (a `?` proposes nothing; `" ja "` proposes two
actions; otherwise one), which is exactly the fork RealTrainer's review step
takes. `failAfter` breaks the stream part-way — the state the app's error path
is written for and otherwise unreachable.

## Phase 5 — the hosts, and the proof *(done)*

| where | how |
| --- | --- |
| Node | `host/firesim.mjs`: `createSim`, a `fetch` that advances the clock, an async iterator over a stream |
| a socket | `host/serve.mjs`: a real HTTP server for an Android emulator, an iOS simulator, a browser or `curl`; SSE in real time, `--time-scale` to make it instant in CI |
| a browser tab | `demo/build.mjs` wraps the compiled module as an ES module with **no bundler** (the compiled `.cjs` has no `require` in it) and copies EVG's three browser helpers beside it; the workbench of phase 7 is what runs there |
| iOS / Android / Linux SDL | the module compiles to Swift, Kotlin and C++, in-process through `FsSimBridge` or over the socket |

**The proof** is `npm run firesim:realtrainer`. `gallery/realtrainer`'s
reference recorder seeds the *real* Firebase emulator from
`fixtures/reference/seed.json`; that same file goes into this simulator
unconverted (747 documents), is asked back over `:runQuery` as a signed-in
user through the rules, and is handed to `RealTrainerDemo` in place of the
file. The app must then draw the **same accessibility tree** — six scenarios,
node for node. Changing one calendar's name on the way back breaks five of the
six.

### The gates

| | |
| --- | --- |
| `npm run firesim:test` | 101 assertions: values, the store, queries and their refusals, the rules, accounts, the wait, listeners, the model, the Ranger client, the RealTrainer seed, and a real socket |
| `npm run firesim:realtrainer` | the demo drawing from the simulator, six scenarios |
| `npm run firesim:targets` | 24/24 — two builds × twelve targets |
| `npm run firesim:demo` | the workbench, driven with no browser: 87 assertions |
| `npm run firesim:demo:frame` | the same page in Chromium, at the pixels |
| `npm run firesim:size` | what each build costs, per target |

All of them except the browser gate are wired into
`scripts/run-gallery-editor-tests.sh`, which is what CI's `gallery-editors`
job runs; `firesim:demo:frame` needs a Chromium and skips loudly without one.

## Is it light enough for a watch?

Measured, not asserted (`npm run firesim:size`):

| build | Kotlin | Swift | JavaScript |
| --- | --- | --- | --- |
| **client** (`FsClient.rgr`) | 113 kB / 4 540 lines | 117 kB / 4 307 lines | 97 kB / 4 125 lines |
| **whole simulator** (`FsSimBridge.rgr`) | 236 kB / 8 923 lines | 249 kB / 8 623 lines | 204 kB / 8 226 lines |

The client build — values, paths, queries, wire shapes, transport — is what an
app carries. No rules parser, no routing, no accounts, no model: those are
behind the transport. It allocates no threads, opens no sockets, and depends
on nothing but the Ranger runtime.

**Verdict: yes for the client**, on Wear OS and watchOS, at about four and
a half thousand lines of generated source. Running the whole simulator on the watch
compiles and would work, but is not the shape to reach for — point the watch's
transport at the simulator on the phone or the laptop and seed once, rather
than seeding two devices. Compiled binary size and RAM under a real seed are
**not** measured: they need platform toolchains this repository's CI does not
have, and a made-up number would be worth nothing.

## Phase 6 — a query that answers again *(done)*

`onSnapshot` is the one Firestore feature an app leans on that a REST
simulator cannot inherit: the real thing carries it over a gRPC `Listen`
channel. So `FsWatch` is **this simulator's own**, under the `firesim/` prefix
and named for what it is — `POST /firesim/v1/watch`, `…/poll`, `…/unwatch` —
because claiming Google's shape for something Google does not do that way is
the one thing this module has avoided throughout.

A watch is a registered query plus what it last answered; a poll re-runs it
and diffs the **result set**. That is the design decision, and it is not the
obvious one: a change log tells you which documents were written, and does not
tell you that a document nobody touched left the result because someone else's
write pushed it past the `limit`, that an edit to an unrelated field made a
document start matching a `where`, or that a rule stopped allowing a row that
is still there. Those three are exactly what an app renders wrongly when its
listener is built on a write log.

The rules run again on every poll, as a `list`, so a listener cannot see what
a query could not. A poll where the store's version has not moved answers
`quiet` without running the query at all.

Building it also found a real fidelity bug: CEL's logical operators **absorb
errors**, and the strict `&&`/`||` here did not. `resource.data.userId == uid
|| request.resource.data.userId == uid` is the ordinary way to write one rule
for a create and an update, and on a create the left half reads a document
that is not there — which this engine was denying. `||` now answers true when
either side is true even if the other errored, `&&` false when either is
false, and only a combination that decides nothing keeps the error. `resource`
is now `null` on a create too, rather than an empty map, which is what makes
`resource == null` work as a create guard.

## Phase 7 — the workbench, on github.io *(done)*

`gallery/firesim/demo`, published at
[`/firesim/`](https://terotests.github.io/Ranger/firesim/): a **database
browser** over the simulator — drawn by EVG on WebGL, controlled by
`gallery/ui`'s own controllers, full screen, with the whole backend running in
the tab and no server behind the page.

It is deliberately not an application demo, and that was a correction worth
making: the first version of this page was a RealTrainer screen with the
simulator behind it, which showed an app and not a database. What a person
reaching for a backend simulator wants is the thing the Firebase console gives
them — *what is actually in there* — so:

- **Data**: collections, the documents in one, and a document's fields with
  their Firestore TYPES; a subcollection listed apart from the fields, because
  it is not one, and pressable, so the tree is walked rather than described.
  The list is an `FsWatch`, so a row appears because a listener said it did.
- **Rules**: the permission grid for **whatever path is selected in the
  browser**, every identity against every method, each cell `FsRulesEval` at
  that moment.
- **Query**: a `where` and an `orderBy` built by pressing — the fields and
  values read out of the data — with the refusals as the point.
- **Users**: the accounts table, providers and custom claims.
- **Traffic**: every request answered, with runs of listener polls collapsed.

Two datasets and neither is built in: a sample written in Ranger with one of
every value type, and `gallery/realtrainer`'s own 747-document seed as
**example data**, fetched by the host and loaded through `FsSeed` unconverted.
Each carries its own rules file, because rules belong to a dataset and not to
a tool. Nothing in the workbench knows what a calendar is.

The page has **no bundler and no install**. The compiled module is one
self-contained file, so the build is a wrapper, a copy of EVG's three browser
helpers (followed transitively, and asserted to resolve where they are put)
and an `index.html` — the same claim the simulator makes about itself.

The plain-DOM inspector that phase 5 shipped under `web/` was removed with
this: two pages doing the same job is worse than one, and the workbench does
strictly more.

---

# What is next

## Phase 8 — the host transports, for real

The queue exists and is checked; the three implementations that drain it over
HTTPS do not.

- **Node** (`host/rest-transport.mjs`): drains into `fetch` against a real
  project. The value is a "same test, both backends" runner — the same
  scenario against the simulator and against a scratch Firebase project, with
  a diff.
- **Swift** (`gallery/firesim/ios/`): `URLSession`, and SSE through
  `URLSession.bytes`.
- **Kotlin** (`gallery/firesim/android/`): OkHttp, and SSE through its
  event-source support.

Each is a hundred lines and none of them is Ranger. Acceptance: the RealTrainer
iOS and Android ports run against the simulator over the socket unchanged, and
against a real project by changing `baseUrl`. The watch endpoints are the part
that needs real work here: against a real project they have to become an
actual `onSnapshot`, which is why they are named as this simulator's own.

## Phase 9 — Storage and Functions

- **Cloud Storage**: `POST /v0/b/{bucket}/o?name=`, `GET /v0/b/{bucket}/o/{name}`,
  download tokens, and rules under `service firebase.storage`. RealTrainer's
  workout images are the case. The rules parser already handles a second
  service; the store needs a blob table beside the document table.
- **Callable functions**: `POST /{region}-{project}.cloudfunctions.net/{name}`
  with the `{"data": …}` envelope, answered by a table of handlers a test
  registers. This is the shape the coach's "accept these actions" step would
  really take.

## Phase 10 — fidelity, measured against the real emulator

The honest end of this module. `gallery/realtrainer`'s trace harness already
has the pattern: a reference recorded against the real thing, committed, and
diffed here.

- A corpus of requests — every endpoint, every refusal, every rules case —
  replayed against the **Firebase emulator suite** on a machine that has it,
  with the responses recorded to `fixtures/oracle/`.
- `firesim:oracle` diffs this simulator against that recording in CI, where
  the emulator is not available, exactly as `rt:l0` does for the COMPACT
  layer.
- Every deviation is listed with its reason rather than left out. A family
  with no reference is a gap, not a pass.

That check is what would let this module claim fidelity instead of describing
it, and it is the most valuable thing left to build.

## Phase 11 — the console, wired to RealTrainer's own data

The console draws three made-up entries. The obvious next step is to seed it
from `gallery/realtrainer/fixtures/reference/seed.json` — 747 documents, the
same file `firesim:realtrainer` proves the demo can draw from — and put the
RealTrainer port's own screens beside the rail, so one page shows an app and
the backend under it at the same time. The pieces are all here; what is
missing is the page that puts them together.

## Deliberately out of scope

- **The client SDKs' gRPC channel.** `connectFirestoreEmulator` from the
  official JS/iOS/Android SDK speaks gRPC-Web or gRPC, not REST. Implementing
  it would double the module and is not what the ask needs: an app written
  against `FsClient` reaches both backends already.
- **Indexes.** Whether a composite index exists is answered by
  `indexHint()` and nothing more.
- **Security.** Plaintext passwords, unsigned tokens, and a `Bearer owner`
  escape. It is a simulator, and it says so.
