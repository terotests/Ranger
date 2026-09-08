// SPDX-License-Identifier: AGPL-3.0-or-later
//
// The inspector, in a browser. Everything it drives is the compiled Ranger
// module in `firesim.browser.js` — the same code the Node checks run.
//
// There is no server behind this page. `fetch` here is the simulator's own
// routing, called directly, which is the point: an app that talks to firesim
// in a tab has a whole backend with nothing installed.

import Firesim from "./firesim.browser.js";

const {
  FsSim, FsRequest, FsRules, FsValue, VlJsonWriter, VlJsonParser, FsSeed,
} = Firesim;

const $ = (id) => document.getElementById(id);
const writer = new VlJsonWriter();

const sim = new FsSim();
const server = sim.backend();
const auth = server.accounts();
server.projectId = "demo-firesim";
auth.projectId = server.projectId;
sim.wait().baseMs = 120;

const DEFAULT_RULES = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function signedIn() { return request.auth != null; }
    function owns(uid)  { return signedIn() && request.auth.uid == uid; }

    match /calendars/{calendarId} {
      allow read:   if owns(resource.data.userId) || resource.data.visibility == 'shared';
      allow create: if owns(request.resource.data.userId);
      allow update, delete: if owns(resource.data.userId);
    }
    match /entries/{entryId} {
      allow read, write: if owns(resource.data.userId) || owns(request.resource.data.userId);
    }
    match /{document=**} { allow read, write: if false; }
  }
}`;

const DEMO_SEED = {
  calendars: [
    { id: "cal-plan", name: "Harjoitussuunnitelma", type: "plan", color: "#3B82F6", visibility: "private" },
    { id: "cal-train", name: "Treenipäiväkirja", type: "training", color: "#F97316", visibility: "private" },
    { id: "cal-shared", name: "Seuran ohjelma", type: "plan", color: "#22C55E", visibility: "shared" },
  ],
  entries: [
    { id: "e1", calendarId: "cal-plan", date: "2026-02-09", compact: "[2026-02-09]\n## Kevyt salitreeni\nTags kuntosali, voima\nDuration 45min" },
    { id: "e2", calendarId: "cal-plan", date: "2026-02-11", compact: "[2026-02-11]\n## Intervalli\nTags kestävyys\n6x400m" },
    { id: "e3", calendarId: "cal-train", date: "2026-02-10", compact: "[2026-02-10]\n## Penkki\nPenkkipunnerrus 3x5x90kg" },
  ],
};

// --- accounts -----------------------------------------------------------------
const accounts = [];
let current = null;

function refreshAccounts() {
  const sel = $("who");
  sel.innerHTML = "";
  const none = document.createElement("option");
  none.value = "";
  none.textContent = "— nobody —";
  sel.append(none);
  for (const a of accounts) {
    const o = document.createElement("option");
    o.value = a.uid;
    o.textContent = `${a.email || "anonymous"} (${a.uid})`;
    sel.append(o);
  }
  sel.value = current?.uid ?? "";
  $("claims").textContent = current
    ? JSON.stringify(JSON.parse(Firesim.FsBase64.decode(current.idToken.split(".")[1])), null, 2)
    : "not signed in";
}

function remember(result, email) {
  const a = { uid: result.localId, idToken: result.idToken, email };
  const at = accounts.findIndex((x) => x.uid === a.uid);
  if (at >= 0) accounts[at] = a;
  else accounts.push(a);
  current = a;
  refreshAccounts();
}

$("signup").onclick = () => {
  const r = auth.signUp($("email").value, $("password").value, "", sim.nowMs);
  if (!r.ok) return say("response", r.error, false);
  remember(r, $("email").value);
  say("response", `created ${r.localId}`, true);
};
$("signin").onclick = () => {
  const r = auth.signIn($("email").value, $("password").value, sim.nowMs);
  if (!r.ok) return say("response", r.error, false);
  remember(r, $("email").value);
  say("response", `signed in as ${r.localId}`, true);
};
$("anon").onclick = () => {
  const r = auth.signUp("", "", "", sim.nowMs);
  remember(r, "");
  say("response", `anonymous ${r.localId}`, true);
};
$("signout").onclick = () => {
  current = null;
  refreshAccounts();
};
$("who").onchange = (e) => {
  current = accounts.find((a) => a.uid === e.target.value) ?? null;
  refreshAccounts();
};

// --- the wait -----------------------------------------------------------------
const latency = sim.wait();
$("latency").oninput = (e) => {
  latency.baseMs = Number(e.target.value);
  $("latencyOut").textContent = `${e.target.value} ms`;
};
$("jitter").oninput = (e) => {
  latency.jitterMs = Number(e.target.value);
  $("jitterOut").textContent = `${e.target.value} ms`;
};
$("offline").onchange = (e) => {
  latency.offline = e.target.checked;
};
$("failnext").onchange = (e) => {
  latency.failNext = e.target.checked;
};

function metrics() {
  $("metrics").textContent =
    `${sim.callCount} calls · ${sim.failCount} failed · ${Math.round(sim.waitedMs)} ms waited · ` +
    `store version ${server.db().version} · clock ${Math.round(sim.nowMs)} ms`;
}

// --- rules --------------------------------------------------------------------
$("rules").value = DEFAULT_RULES;
$("applyRules").onclick = () => {
  const parsed = FsRules.parse($("rules").value);
  if (!parsed.ok()) {
    $("rulesStatus").textContent = `line ${parsed.errorLine}: ${parsed.error}`;
    $("rulesStatus").className = "small bad";
    return;
  }
  server.rules = parsed;
  $("rulesStatus").textContent = "applied";
  $("rulesStatus").className = "small ok";
};
$("rulesOn").onchange = (e) => {
  server.rulesEnabled = e.target.checked;
};
$("applyRules").onclick();

// --- data ---------------------------------------------------------------------
function seed(json) {
  const parser = new VlJsonParser();
  const owner = current?.uid ?? "";
  const written = FsSeed.load(server.db(), parser.parse(JSON.stringify(json)), owner, sim.nowMs);
  $("seedStatus").textContent = `${written} documents${owner ? `, owned by ${owner}` : ", with no owner"}`;
  listDocs();
  metrics();
}
$("seedDemo").onclick = () => seed(DEMO_SEED);
$("seedFile").onchange = async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  seed(JSON.parse(await file.text()));
};
$("wipe").onclick = () => {
  server.db().wipe();
  listDocs();
  metrics();
};

function listDocs() {
  const list = $("docs");
  list.innerHTML = "";
  for (const p of server.db().paths.slice().sort()) {
    const li = document.createElement("li");
    li.textContent = p;
    li.onclick = () => {
      for (const other of list.children) other.removeAttribute("aria-current");
      li.setAttribute("aria-current", "true");
      $("doc").textContent = writer.writePretty(server.db().get(p).root().toPlain());
    };
    list.append(li);
  }
  if (!list.children.length) $("doc").textContent = "the store is empty";
}

// --- the wire -----------------------------------------------------------------
$("url").value = "/v1/projects/demo-firesim/databases/(default)/documents/calendars/cal-plan";

function request(method, url, body) {
  const req = FsRequest.parse(method, url, body ?? "");
  if (current) req.head().set("authorization", `Bearer ${current.idToken}`);
  return sim.send(req);
}

// The clock is the app's: run it forward until this call has fully arrived,
// then read it. A page that wanted to SEE the wait would tick on a frame
// instead — that is the only difference.
function settle(id) {
  const call = sim.callById(id);
  let guard = 0;
  while (!call.complete(sim.nowMs) && guard < 10000) {
    const target = call.done ? call.readyMs + call.res().lastChunkMs() : call.readyMs;
    sim.tick(Math.max(target - sim.nowMs, 0.001));
    guard += 1;
  }
  return call;
}

$("send").onclick = () => {
  const id = request($("method").value, $("url").value, $("reqBody").value.trim());
  const call = settle(id);
  const res = call.res();
  const took = Math.round(call.readyMs - call.issuedMs);
  let text = res.streaming ? res.joined() : res.body;
  try {
    text = JSON.stringify(JSON.parse(text), null, 2);
  } catch {
    /* not JSON — show it as it came */
  }
  say("response", `${res.status} · ${took} ms\n\n${text}`, res.status < 400);
  listDocs();
  metrics();
};

// --- the model ----------------------------------------------------------------
$("aiFail").onchange = (e) => {
  server.model().failAfter = e.target.checked ? 3 : -1;
};

$("ask").onclick = () => {
  const id = request("POST", "/ai/v1/chat:stream", JSON.stringify({ prompt: $("prompt").value, requestId: `r${sim.callCount}` }));
  const call = sim.callById(id);
  $("reply").textContent = "";
  $("replyMeta").textContent = "";
  const started = sim.nowMs;
  // A real frame loop, so the words appear the way they would in the app.
  const step = () => {
    sim.tick(50);
    for (const piece of sim.takeChunks(id)) {
      for (const line of piece.split("\n")) {
        const t = line.trim();
        if (!t.startsWith("data:")) continue;
        const payload = t.slice(5).trim();
        if (payload === "[DONE]") continue;
        let event;
        try {
          event = JSON.parse(payload);
        } catch {
          continue;
        }
        if (event.type === "chunk") $("reply").textContent += event.text;
        if (event.type === "error") {
          $("reply").textContent += ` — ${event.message}`;
          $("reply").className = "reply bad";
        }
        if (event.type === "done") {
          $("replyMeta").textContent =
            `${event.actions.length} proposed action(s), ${Math.round(sim.nowMs - started)} ms of simulated time`;
        }
      }
    }
    if (!call.complete(sim.nowMs)) requestAnimationFrame(step);
    else metrics();
  };
  $("reply").className = "reply";
  requestAnimationFrame(step);
};

function say(id, text, good) {
  const el = $(id);
  el.textContent = text;
  el.className = good ? "small ok" : "small bad";
}

$("build").textContent = `${Object.keys(Firesim).length} classes, compiled from Ranger.`;
refreshAccounts();
listDocs();
metrics();
