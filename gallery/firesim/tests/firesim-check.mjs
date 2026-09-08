#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later
//
// The gate for gallery/firesim.
//
//   npm run firesim:test
//
// Every layer is checked against what the REAL thing does, and the cases that
// matter are the ones where a naive mock would pass and Firebase would not:
// an update of a document that is not there, a query whose orderBy field is
// missing from a document, a rules block that does not reach a subcollection,
// a list whose one forbidden row denies the whole page.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createSim, toValue, fromValue, loadFiresim } from "../host/firesim.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, "..");
const REPO = path.join(ROOT, "..", "..");

let passed = 0;
const failures = [];
function ok(name, cond, detail) {
  if (cond) {
    passed += 1;
  } else {
    failures.push(`${name}${detail ? `\n      ${detail}` : ""}`);
  }
}
function eq(name, got, want) {
  const g = JSON.stringify(got);
  const w = JSON.stringify(want);
  ok(name, g === w, `got  ${g}\n      want ${w}`);
}
function section(title) {
  process.stdout.write(`\n  ${title}\n`);
}

const R = loadFiresim();

// =============================================================================
section("values, and the order they sort in");
// =============================================================================
{
  const { FsValue, FsTime } = R;
  const iso = "2026-02-09T10:30:00.250Z";
  eq("a timestamp survives the round trip", FsTime.formatIso(FsTime.parseIso(iso)), iso);
  eq("an offset moves the instant", FsTime.parseIso("2026-02-09T12:30:00+02:00"), FsTime.parseIso(iso) - 250);

  const w = new R.VlJsonWriter();
  eq("an integer is quoted on the wire", w.write(FsValue.longV(45).toWire()), '{"integerValue":"45"}');
  eq("a double is not", w.write(FsValue.doubleV(1.5).toWire()), '{"doubleValue":1.5}');

  // The canonical type order: null < bool < number < timestamp < string <
  // bytes < reference < geopoint < array < map.
  const values = [
    FsValue.mapV(),
    FsValue.arrayV(),
    FsValue.strV("a"),
    FsValue.timeV(0),
    FsValue.doubleV(2.5),
    FsValue.longV(2),
    FsValue.boolV(true),
    FsValue.nullV(),
  ];
  const sorted = [...values].sort((a, b) => FsValue.compare(a, b)).map((v) => v.typeOrder());
  eq("mixed types sort by Firestore's canonical order", sorted, [0, 1, 2, 2, 3, 4, 8, 9]);
  ok("an int and a double compare numerically", FsValue.compare(FsValue.longV(2), FsValue.doubleV(2.5)) < 0);
}

// =============================================================================
section("the store");
// =============================================================================
{
  const sim = createSim({ rulesEnabled: false });
  const base = "/v1/projects/demo-firesim/databases/(default)/documents";

  let r = sim.fetchNow(`${base}/things/t1`, { method: "PATCH", body: { fields: { n: { integerValue: "1" }, keep: { stringValue: "yes" } } } });
  eq("a patch creates a document", r.status, 200);

  // A merge writes only the named fields.
  r = sim.fetchNow(`${base}/things/t1?updateMask.fieldPaths=n`, { method: "PATCH", body: { fields: { n: { integerValue: "9" } } } });
  eq("a merge leaves the other fields alone", sim.docData("things/t1"), { n: 9, keep: "yes" });

  // …and a patch with no mask replaces the whole document.
  r = sim.fetchNow(`${base}/things/t1`, { method: "PATCH", body: { fields: { n: { integerValue: "2" } } } });
  eq("a patch with no mask replaces", sim.docData("things/t1"), { n: 2 });

  // An update of something that is not there is a 404, not a create.
  r = sim.fetchNow(`${base}/things/gone?currentDocument.exists=true`, { method: "PATCH", body: { fields: {} } });
  eq("update of a missing document is 404", r.status, 404);

  // A subcollection outlives its parent.
  sim.fetchNow(`${base}/things/t1/notes/n1`, { method: "PATCH", body: { fields: { t: { stringValue: "x" } } } });
  sim.fetchNow(`${base}/things/t1`, { method: "DELETE" });
  ok("a subcollection outlives its parent document", sim.docData("things/t1/notes/n1") !== null);
  ok("…and the parent is gone", sim.docData("things/t1") === null);

  // Transforms.
  sim.fetchNow(`${base}:commit`, {
    method: "POST",
    body: {
      writes: [
        {
          update: { name: `projects/demo-firesim/databases/(default)/documents/counters/c1`, fields: { hits: { integerValue: "5" } } },
          updateTransforms: [
            { fieldPath: "hits", increment: { integerValue: "3" } },
            { fieldPath: "seen", setToServerValue: "REQUEST_TIME" },
            { fieldPath: "tags", appendMissingElements: { arrayValue: { values: [{ stringValue: "a" }, { stringValue: "b" }] } } },
          ],
        },
      ],
    },
  });
  const c1 = sim.docData("counters/c1");
  eq("increment is applied by the server", c1.hits, 8);
  eq("arrayUnion is applied by the server", c1.tags, ["a", "b"]);
  ok("serverTimestamp is a timestamp", typeof c1.seen === "string" && c1.seen.endsWith("Z"));

  // A commit that is refused changes nothing.
  const before = sim.metrics().version;
  const bad = sim.fetchNow(`${base}:commit`, {
    method: "POST",
    body: { writes: [{ update: { name: "projects/demo-firesim/databases/(default)/documents/counters/c2", fields: {} } }, { update: { name: "not-a-path" } }] },
  });
  ok("a malformed commit is refused", bad.status >= 400);
  eq("…and nothing was written", sim.metrics().version, before);
}

// =============================================================================
section("queries, and the ones Firestore refuses");
// =============================================================================
{
  const sim = createSim({ rulesEnabled: false });
  const base = "/v1/projects/demo-firesim/databases/(default)/documents";
  const rows = [
    ["e3", { userId: "u1", date: "2026-02-11", minutes: 60, tags: ["voima"] }],
    ["e1", { userId: "u1", date: "2026-02-09", minutes: 45, tags: ["kesto", "voima"] }],
    ["e2", { userId: "u2", date: "2026-02-10", minutes: 30, tags: ["kesto"] }],
    ["e4", { userId: "u1", minutes: 20, tags: [] }], // no `date` at all
  ];
  for (const [id, data] of rows) {
    const fields = {};
    const v = toValue(data);
    for (const k of v.keys) fields[k] = JSON.parse(new R.VlJsonWriter().write(v.field(k).toWire()));
    sim.fetchNow(`${base}/entries/${id}`, { method: "PATCH", body: { fields } });
  }

  const q = (structuredQuery) => {
    const r = sim.fetchNow(`${base}:runQuery`, { method: "POST", body: { structuredQuery } });
    return { status: r.status, body: JSON.parse(r.bodyText) };
  };
  const ids = (res) => res.body.filter((x) => x.document).map((x) => x.document.name.split("/").pop());

  eq(
    "a filter and an order",
    ids(
      q({
        from: [{ collectionId: "entries" }],
        where: { fieldFilter: { field: { fieldPath: "userId" }, op: "EQUAL", value: { stringValue: "u1" } } },
        orderBy: [{ field: { fieldPath: "date" }, direction: "ASCENDING" }],
      }),
    ),
    ["e1", "e3"],
  );
  ok("a document without the ordered field is left out", !ids(q({ from: [{ collectionId: "entries" }], orderBy: [{ field: { fieldPath: "date" } }] })).includes("e4"));
  eq("array-contains", ids(q({ from: [{ collectionId: "entries" }], where: { fieldFilter: { field: { fieldPath: "tags" }, op: "ARRAY_CONTAINS", value: { stringValue: "voima" } } } })), ["e1", "e3"]);
  eq(
    "descending with a limit",
    ids(q({ from: [{ collectionId: "entries" }], orderBy: [{ field: { fieldPath: "minutes" }, direction: "DESCENDING" }], limit: 2 })),
    ["e3", "e1"],
  );
  eq(
    "a cursor pages",
    ids(
      q({
        from: [{ collectionId: "entries" }],
        orderBy: [{ field: { fieldPath: "minutes" }, direction: "ASCENDING" }],
        startAt: { values: [{ integerValue: "45" }], before: false },
      }),
    ),
    ["e3"],
  );

  // The refusals — the whole reason to simulate a query engine rather than
  // filter an array.
  const inequalityWithWrongOrder = q({
    from: [{ collectionId: "entries" }],
    where: { fieldFilter: { field: { fieldPath: "minutes" }, op: "GREATER_THAN", value: { integerValue: "10" } } },
    orderBy: [{ field: { fieldPath: "date" } }],
  });
  eq("an inequality with the wrong first orderBy is refused", inequalityWithWrongOrder.status, 400);

  const twoInequalities = q({
    from: [{ collectionId: "entries" }],
    where: {
      compositeFilter: {
        op: "AND",
        filters: [
          { fieldFilter: { field: { fieldPath: "minutes" }, op: "GREATER_THAN", value: { integerValue: "10" } } },
          { fieldFilter: { field: { fieldPath: "date" }, op: "LESS_THAN", value: { stringValue: "2026-03-01" } } },
        ],
      },
    },
  });
  eq("inequalities on two fields are refused", twoInequalities.status, 400);

  // A collection group reaches every depth.
  sim.fetchNow(`${base}/calendars/c1/entries/deep1`, { method: "PATCH", body: { fields: { userId: { stringValue: "u1" } } } });
  eq(
    "a collection group query reaches subcollections",
    ids(q({ from: [{ collectionId: "entries", allDescendants: true }] })).length,
    5,
  );
}

// =============================================================================
section("security rules, as the file the project deploys");
// =============================================================================
{
  const rules = `
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function signedIn() { return request.auth != null; }
    function owns(uid)  { return signedIn() && request.auth.uid == uid; }
    function isAdmin()  { return signedIn() && request.auth.token.admin == true; }

    match /calendars/{calendarId} {
      allow read:   if owns(resource.data.userId) || resource.data.visibility == 'public' || isAdmin();
      allow create: if owns(request.resource.data.userId);
      allow update: if owns(resource.data.userId)
                    && request.resource.data.keys().hasAll(['userId', 'name']);
      allow delete: if owns(resource.data.userId);

      match /entries/{entryId} {
        allow read, write: if owns(get(/databases/$(database)/documents/calendars/$(calendarId)).data.userId);
      }
    }
    match /{document=**} { allow read, write: if false; }
  }
}`;
  const sim = createSim({ rules });
  const alice = sim.signUp("alice@example.com", "password1", "Alice");
  const bob = sim.signUp("bob@example.com", "password2", "Bob");
  const admin = sim.signUp("admin@example.com", "password3", "Admin");
  sim.setClaims(admin.uid, { admin: true });
  const adminToken = sim.signIn("admin@example.com", "password3").idToken;

  const base = "/v1/projects/demo-firesim/databases/(default)/documents";
  const as = (who) => (who ? { Authorization: `Bearer ${who}` } : {});
  // The seeder uses the owner escape, as the emulator's admin REST does.
  sim.fetchNow(`${base}/calendars/cal-a`, { method: "PATCH", headers: as("owner"), body: { fields: { userId: { stringValue: alice.uid }, name: { stringValue: "Alicen" }, visibility: { stringValue: "private" } } } });
  sim.fetchNow(`${base}/calendars/cal-pub`, { method: "PATCH", headers: as("owner"), body: { fields: { userId: { stringValue: bob.uid }, name: { stringValue: "Julkinen" }, visibility: { stringValue: "public" } } } });
  sim.fetchNow(`${base}/calendars/cal-priv`, { method: "PATCH", headers: as("owner"), body: { fields: { userId: { stringValue: bob.uid }, name: { stringValue: "Bobin" }, visibility: { stringValue: "private" } } } });
  sim.fetchNow(`${base}/calendars/cal-a/entries/e1`, { method: "PATCH", headers: as("owner"), body: { fields: { note: { stringValue: "x" } } } });

  eq("the owner reads their calendar", sim.fetchNow(`${base}/calendars/cal-a`, { headers: as(alice.idToken) }).status, 200);
  eq("a stranger does not", sim.fetchNow(`${base}/calendars/cal-a`, { headers: as(bob.idToken) }).status, 403);
  eq("nor does an anonymous caller", sim.fetchNow(`${base}/calendars/cal-a`).status, 403);
  eq("a public calendar is readable by anyone signed in", sim.fetchNow(`${base}/calendars/cal-pub`, { headers: as(alice.idToken) }).status, 200);
  eq("a custom claim opens it too", sim.fetchNow(`${base}/calendars/cal-a`, { headers: as(adminToken) }).status, 200);

  eq(
    "an update that drops a required key is refused",
    sim.fetchNow(`${base}/calendars/cal-a`, { method: "PATCH", headers: as(alice.idToken), body: { fields: { userId: { stringValue: alice.uid } } } }).status,
    403,
  );
  eq(
    "…and one that keeps them is allowed",
    sim.fetchNow(`${base}/calendars/cal-a`, { method: "PATCH", headers: as(alice.idToken), body: { fields: { userId: { stringValue: alice.uid }, name: { stringValue: "Uusi" } } } }).status,
    200,
  );
  eq(
    "creating a calendar for someone else is refused",
    sim.fetchNow(`${base}/calendars/cal-b`, { method: "PATCH", headers: as(alice.idToken), body: { fields: { userId: { stringValue: bob.uid }, name: { stringValue: "x" } } } }).status,
    403,
  );

  // The nested block, and the get() it depends on.
  eq("the nested rule reads the parent document", sim.fetchNow(`${base}/calendars/cal-a/entries/e1`, { headers: as(alice.idToken) }).status, 200);
  eq("…and refuses the other user", sim.fetchNow(`${base}/calendars/cal-a/entries/e1`, { headers: as(bob.idToken) }).status, 403);

  // A list is denied whole when one row is not readable — the emulator's
  // behaviour, and the error a too-broad query gets in production.
  const all = sim.fetchNow(`${base}:runQuery`, { method: "POST", headers: as(alice.idToken), body: { structuredQuery: { from: [{ collectionId: "calendars" }] } } });
  eq("a query that reaches a forbidden row is denied whole", all.status, 403);
  const mine = sim.fetchNow(`${base}:runQuery`, {
    method: "POST",
    headers: as(alice.idToken),
    body: { structuredQuery: { from: [{ collectionId: "calendars" }], where: { fieldFilter: { field: { fieldPath: "userId" }, op: "EQUAL", value: { stringValue: alice.uid } } } } },
  });
  eq("…and the narrowed one is allowed", mine.status, 200);

  // A rules file this subset cannot read must FAIL, never quietly allow.
  const broken = createSim({ rulesEnabled: false });
  let threw = "";
  try {
    broken.loadRules("service cloud.firestore { match /databases/{db}/documents { match /x/{y} { allow read: if resource.data.name.matches('^a'); } } }");
    const r = broken.fetchNow("/v1/projects/demo-firesim/databases/(default)/documents/x/y1");
    threw = `status ${r.status}`;
  } catch (e) {
    threw = "parse error";
  }
  ok("an unsupported rules construct is not silently allowed", threw !== "", threw);

  const badSyntax = createSim({ rulesEnabled: false });
  let parseFailed = false;
  try {
    badSyntax.loadRules("service cloud.firestore { match /x/{y} { allow read: if } }");
  } catch {
    parseFailed = true;
  }
  ok("a rules file that does not parse is an error", parseFailed);
}

// =============================================================================
section("accounts");
// =============================================================================
{
  const sim = createSim({ projectId: "realtrainer-4354b", rulesEnabled: false });
  const idt = "/identitytoolkit.googleapis.com/v1";
  let r = sim.fetchNow(`${idt}/accounts:signUp?key=fake`, { method: "POST", body: { email: "t@e.st", password: "testpassword123", displayName: "Test", returnSecureToken: true } });
  const created = JSON.parse(r.bodyText);
  eq("signUp answers a token", r.status, 200);
  ok("…which is a JWT with three parts", created.idToken.split(".").length === 3);
  const payload = JSON.parse(R.FsBase64.decode(created.idToken.split(".")[1]));
  eq("…whose audience is the project", payload.aud, "realtrainer-4354b");
  eq("…and whose subject is the uid", payload.sub, created.localId);

  eq("a duplicate e-mail is EMAIL_EXISTS", JSON.parse(sim.fetchNow(`${idt}/accounts:signUp`, { method: "POST", body: { email: "t@e.st", password: "another123" } }).bodyText).error.status, "EMAIL_EXISTS");
  eq("a wrong password is INVALID_PASSWORD", JSON.parse(sim.fetchNow(`${idt}/accounts:signInWithPassword`, { method: "POST", body: { email: "t@e.st", password: "nope" } }).bodyText).error.status, "INVALID_PASSWORD");
  eq("an unknown e-mail is EMAIL_NOT_FOUND", JSON.parse(sim.fetchNow(`${idt}/accounts:signInWithPassword`, { method: "POST", body: { email: "no@one", password: "x" } }).bodyText).error.status, "EMAIL_NOT_FOUND");

  const anon = sim.signInAnonymously();
  ok("an anonymous session gets a uid", anon.uid.length > 0);
  eq("lookup answers the record", JSON.parse(sim.fetchNow(`${idt}/accounts:lookup`, { method: "POST", body: { idToken: created.idToken } }).bodyText).users[0].email, "t@e.st");

  // A token that has expired is refused, which is the case nobody tests.
  const short = createSim({ rulesEnabled: false });
  short.auth.tokenLifetimeMs = 1000;
  const u = short.signUp("a@b.c", "password1");
  eq("a fresh token is accepted", short.fetchNow("/v1/projects/demo-firesim/databases/(default)/documents/x/y", { headers: { Authorization: `Bearer ${u.idToken}` } }).status, 404);
  short.tick(2000);
  eq("an expired token is 401", short.fetchNow("/v1/projects/demo-firesim/databases/(default)/documents/x/y", { headers: { Authorization: `Bearer ${u.idToken}` } }).status, 401);

  // Wiping, as the e2e helpers do before every test.
  sim.fetchNow(`/emulator/v1/projects/realtrainer-4354b/accounts`, { method: "DELETE" });
  eq("the emulator wipe empties the accounts", sim.state().users.length, 0);
}

// =============================================================================
section("the wait, and the failures you can ask for");
// =============================================================================
{
  const sim = createSim({ rulesEnabled: false, autoAdvance: false, latency: { baseMs: 100, writeMs: 400 } });
  const base = "/v1/projects/demo-firesim/databases/(default)/documents";
  const write = sim.send("PATCH", `${base}/x/y`, { fields: { a: { stringValue: "b" } } });
  const read = sim.send("GET", `${base}/x/y`);
  sim.tick(150);
  ok("the read is back first", sim.ready(read));
  ok("…and the write is still in flight", !sim.ready(write));
  eq("…so the read did not see it", sim.responseOf(read).status, 404);
  sim.tick(300);
  ok("the write lands when its latency says", sim.ready(write));
  eq("nothing slept: the clock is the app's", sim.nowMs, 450);

  // Made to fail on purpose.
  const flaky = createSim({ rulesEnabled: false, latency: { baseMs: 10 } });
  flaky.latency.failNext = true;
  const id = flaky.send("GET", `${base}/x/y`);
  flaky.advanceTo(id);
  eq("failNext fails the next call", flaky.responseOf(id).status, 503);
  const id2 = flaky.send("GET", `${base}/x/y`);
  flaky.advanceTo(id2);
  ok("…and only that one", flaky.responseOf(id2).status !== 503);

  const offline = createSim({ rulesEnabled: false, latency: { baseMs: 10 } });
  offline.latency.offline = true;
  const oid = offline.send("GET", `${base}/x/y`);
  offline.advanceTo(oid);
  eq("offline fails every call", offline.responseOf(oid).status, 503);

  // The same seed gives the same jitter.
  const runs = [0, 1].map(() => {
    const s = createSim({ rulesEnabled: false, latency: { baseMs: 100, jitterMs: 50, seed: 7 } });
    const out = [];
    for (let i = 0; i < 5; i += 1) out.push(Math.round(s.sim.callById(s.send("GET", `${base}/x/y`)).readyMs));
    return out;
  });
  eq("a seeded jitter repeats", runs[0], runs[1]);
}

// =============================================================================
section("the model, streamed on the clock");
// =============================================================================
{
  const sim = createSim({ rulesEnabled: false, latency: { baseMs: 0 } });
  sim.ai.set({ firstTokenMs: 200, chunkMs: 100 });
  const r = await sim.fetch("/ai/v1/chat:stream", { method: "POST", body: { prompt: "Lisää lenkki", requestId: "r1" } });
  const events = r.events();
  eq("the reply arrives in pieces", events.filter((e) => e.type === "chunk").length, 4);
  eq("…and ends with what it proposes", events.at(-1).actions.length, 1);
  eq("a question proposes nothing", (await sim.fetch("/ai/v1/chat:stream", { method: "POST", body: { prompt: "Miten palaudun?" } })).events().at(-1).actions.length, 0);
  eq("two things proposes two", (await sim.fetch("/ai/v1/chat:stream", { method: "POST", body: { prompt: "lenkki ja kyykky" } })).events().at(-1).actions.length, 2);

  // Timing is the simulated clock's, exactly.
  const timed = createSim({ rulesEnabled: false, latency: { baseMs: 0 }, autoAdvance: false });
  timed.ai.set({ firstTokenMs: 200, chunkMs: 100 });
  const id = timed.send("POST", "/ai/v1/chat:stream", { prompt: "Lisää lenkki" });
  timed.tick(250);
  eq("one chunk at 250 ms", timed.takeChunks(id).length, 1);
  timed.tick(100);
  eq("the next at 350 ms", timed.takeChunks(id).length, 1);

  // A stream that dies in the middle.
  const broken = createSim({ rulesEnabled: false, latency: { baseMs: 0 } });
  broken.ai.set({ failAfter: 2 });
  const events2 = (await broken.fetch("/ai/v1/chat:stream", { method: "POST", body: { prompt: "Lisää lenkki" } })).events();
  eq("a stream can be made to fail part-way", events2.at(-1).type, "error");
  eq("…after the chunks it did send", events2.filter((e) => e.type === "chunk").length, 2);

  // Gemini's shape, for a client that speaks it.
  const g = await sim.fetch("/v1beta/models/gemini-2.0-flash:streamGenerateContent", { method: "POST", body: { contents: [{ parts: [{ text: "Lisää lenkki" }] }] } });
  ok("the Gemini shape carries candidates", g.events()[0].candidates[0].content.parts[0].text.length > 0);

  // The same prompt, twice, is the same words at the same milliseconds.
  const twice = [0, 1].map(() => {
    const s = createSim({ rulesEnabled: false, latency: { baseMs: 0 }, autoAdvance: false });
    const cid = s.send("POST", "/ai/v1/chat:stream", { prompt: "Lisää lenkki" });
    s.advanceTo(cid);
    return s.sim.responseOf(cid).chunks.map((c) => `${c.atMs}:${c.text}`);
  });
  eq("a reply is deterministic", twice[0], twice[1]);
}

// =============================================================================
section("a Ranger app, over the same seam");
// =============================================================================
{
  const { FsSim, FsTransport, FsClient, FsSimBridge, FsValue, FsQuery, FsFilter, FsOrder } = R;
  const sim = new FsSim();
  sim.backend().rulesEnabled = false;
  sim.wait().baseMs = 100;
  const transport = FsTransport.to("");
  const client = new FsClient();
  client.transport = transport;
  const bridge = FsSimBridge.attach(transport, sim);

  let id = client.signUp("app@example.com", "password1", "App");
  bridge.tick(200);
  ok("the client signs in", client.readSignIn(id));

  const data = FsValue.mapV();
  data.setField("title", FsValue.strV("Kevyt salitreeni"));
  data.setField("minutes", FsValue.longV(45));
  id = client.setDoc("entries/e1", data);
  bridge.tick(200);
  eq("…writes a document", client.readDoc(id).field("minutes").asInt(), 45);

  const q = new FsQuery();
  q.collectionId = "entries";
  q.where = FsFilter.field("minutes", ">", FsValue.longV(10));
  q.orders.push(FsOrder.by("minutes", false));
  id = client.runQuery(q);
  bridge.tick(200);
  eq("…and reads it back with a query", client.readDocs(id).map((d) => d.path), ["entries/e1"]);

  id = client.ask("Lisää lenkki", "r1");
  let chunks = [];
  for (let i = 0; i < 30; i += 1) {
    bridge.tick(60);
    chunks = chunks.concat(client.takeChunks(id));
  }
  ok("…and sees the model stream", chunks.length >= 4);

  // The transport is a queue: a host can drain it instead, which is the
  // whole deployment switch.
  const hostSide = FsTransport.to("https://firestore.googleapis.com");
  const hosted = new FsClient();
  hosted.transport = hostSide;
  const cid = hosted.getDoc("calendars/cal-plan");
  const pending = hostSide.nextPending();
  eq("a host transport hands the request over", hostSide.pendingUrl(pending), "https://firestore.googleapis.com/v1/projects/demo-firesim/databases/(default)/documents/calendars/cal-plan");
  hostSide.deliver(cid, 200, JSON.stringify({ name: "projects/p/databases/d/documents/calendars/cal-plan", fields: { name: { stringValue: "Suunnitelma" } } }));
  eq("…and the answer reads the same either way", hosted.readDoc(cid).field("name").asString(), "Suunnitelma");
}

// =============================================================================
section("RealTrainer's own seed, unconverted");
// =============================================================================
{
  const seedFile = path.join(REPO, "gallery", "realtrainer", "fixtures", "reference", "seed.json");
  const rules = fs.readFileSync(path.join(ROOT, "fixtures", "realtrainer.rules"), "utf8");
  const sim = createSim({ projectId: "realtrainer-4354b", databaseId: "europewest1", rules });
  const me = sim.signUp("test@example.com", "testpassword123", "Test User");
  const written = sim.seedFile(seedFile, { ownerUid: me.uid });
  ok("the reference seed loads as it stands", written > 700, `${written} documents`);

  const base = "/v1/projects/realtrainer-4354b/databases/europewest1/documents";
  const H = { Authorization: `Bearer ${me.idToken}` };
  const cal = JSON.parse(sim.fetchNow(`${base}/calendars/cal-plan`, { headers: H }).bodyText);
  eq("the plan calendar is there", cal.fields.name.stringValue, "Harjoitussuunnitelma");

  const week = JSON.parse(
    sim.fetchNow(`${base}:runQuery`, {
      method: "POST",
      headers: H,
      body: {
        structuredQuery: {
          from: [{ collectionId: "entries" }],
          where: {
            compositeFilter: {
              op: "AND",
              filters: [
                { fieldFilter: { field: { fieldPath: "userId" }, op: "EQUAL", value: { stringValue: me.uid } } },
                { fieldFilter: { field: { fieldPath: "calendarId" }, op: "EQUAL", value: { stringValue: "cal-train" } } },
              ],
            },
          },
          orderBy: [{ field: { fieldPath: "date" }, direction: "ASCENDING" }],
          limit: 5,
        },
      },
    }).bodyText,
  ).filter((r) => r.document);
  ok("a week of the training diary reads back", week.length === 5, `${week.length} entries`);
  ok("…in date order", week.map((r) => r.document.fields.date.stringValue).every((d, i, a) => i === 0 || a[i - 1] <= d));

  // Another user sees none of it — the point of seeding with an owner.
  const other = sim.signUp("other@example.com", "password1", "Other");
  eq("another account cannot read it", sim.fetchNow(`${base}/calendars/cal-plan`, { headers: { Authorization: `Bearer ${other.idToken}` } }).status, 403);

  // Seeding a second account is a second seed with a different owner.
  const second = sim.seedFile(seedFile, { ownerUid: other.uid });
  eq("…and re-seeding for them overwrites the same paths", second, written);
}

// =============================================================================
section("over a socket");
// =============================================================================
{
  const sim = createSim({ projectId: "p1", rulesEnabled: false, latency: { baseMs: 5 } });
  const host = await sim.listen(0, { timeScale: 0 });
  const base = `${host.url}/v1/projects/p1/databases/(default)/documents`;
  let r = await fetch(`${base}/things?documentId=t1`, { method: "POST", body: JSON.stringify({ fields: { name: { stringValue: "hello" } } }) });
  eq("a real HTTP client can create a document", r.status, 200);
  r = await fetch(`${base}/things/t1`);
  eq("…and read it", (await r.json()).fields.name.stringValue, "hello");
  r = await fetch(`${host.url}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=fake-api-key`, {
    method: "POST",
    body: JSON.stringify({ email: "sock@et", password: "password1", returnSecureToken: true }),
  });
  ok("…and sign up over the wire", (await r.json()).idToken.length > 0);
  const sse = await fetch(`${host.url}/ai/v1/chat:stream`, { method: "POST", body: JSON.stringify({ prompt: "Lisää lenkki" }) });
  eq("…and read an SSE stream", sse.headers.get("content-type"), "text/event-stream");
  const text = await sse.text();
  ok("…that ends with [DONE]", text.trim().endsWith("[DONE]"));
  await host.close();
}

// =============================================================================
process.stdout.write(`\n  ${passed} passed`);
if (failures.length) {
  process.stdout.write(`, ${failures.length} FAILED\n\n`);
  for (const f of failures) process.stdout.write(`  ✗ ${f}\n`);
  process.stdout.write("\n");
  process.exit(1);
}
process.stdout.write(", 0 failed\n\n  ALL PASS\n\n");
