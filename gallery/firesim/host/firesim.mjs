// SPDX-License-Identifier: AGPL-3.0-or-later
//
// The Node face of gallery/firesim.
//
// Everything below this file is Ranger and compiles to twelve languages; this
// is the part that only Node needs — a friendlier constructor, a `fetch` that
// advances the simulated clock for you, an async iterator over a streamed
// answer, and a real HTTP server for when a browser, a device simulator or
// `curl` has to reach the same simulator over a socket.
//
//   import { createSim } from "gallery/firesim/host/firesim.mjs";
//
//   const sim = createSim({ projectId: "realtrainer-4354b", rules: rulesText });
//   sim.seedFile("gallery/realtrainer/fixtures/reference/seed.json", { ownerUid: uid });
//   const res = await sim.fetch("/v1/projects/…/documents/calendars/cal-plan");
//
// Two clock modes, and the difference matters:
//
//   autoAdvance: true   (default) `fetch` moves the clock to the moment the
//                       answer is due and returns it. Nothing sleeps.
//   autoAdvance: false  `fetch` returns a handle; the app ticks. This is the
//                       mode a UI runs in, because the wait is the point.

import fs from "node:fs";
import path from "node:path";
import http from "node:http";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const MODULE_ROOT = path.join(HERE, "..");
const require_ = createRequire(import.meta.url);

const BUILT = path.join(MODULE_ROOT, "bin", "FsSimBridge.cjs");

export function loadFiresim() {
  if (!fs.existsSync(BUILT)) {
    throw new Error(
      `gallery/firesim is not built.\n  npm run firesim:build\nwrites ${path.relative(process.cwd(), BUILT)}.`,
    );
  }
  return require_(BUILT);
}

const R = loadFiresim();

// --- values -------------------------------------------------------------------
// A plain JavaScript value into an FsValue, and back. `toValue` guesses the
// Firestore type the way a seed file means it: a whole number is an integer,
// a Date is a timestamp, `{ __ref: "a/b" }` is a reference.
export function toValue(v) {
  if (v === null || v === undefined) return R.FsValue.nullV();
  if (typeof v === "boolean") return R.FsValue.boolV(v);
  if (typeof v === "number") {
    return Number.isInteger(v) ? R.FsValue.longV(v) : R.FsValue.doubleV(v);
  }
  if (typeof v === "string") return R.FsValue.strV(v);
  if (v instanceof Date) return R.FsValue.timeV(v.getTime());
  if (Array.isArray(v)) {
    const out = R.FsValue.arrayV();
    for (const item of v) out.addItem(toValue(item));
    return out;
  }
  if (typeof v === "object") {
    if (typeof v.__ref === "string") return R.FsValue.refV(v.__ref);
    const out = R.FsValue.mapV();
    for (const [k, val] of Object.entries(v)) out.setField(k, toValue(val));
    return out;
  }
  return R.FsValue.strV(String(v));
}

export function fromValue(v) {
  switch (v.kind) {
    case 0:
      return null;
    case 1:
      return v.b;
    case 2:
      return Math.round(v.num);
    case 3:
      return v.num;
    case 4:
      return v.str;
    case 5:
      return v.str;
    case 6:
      return v.str;
    case 7:
      return { __ref: v.str };
    case 8:
      return { latitude: v.num, longitude: v.lng };
    case 9:
      return v.items.map(fromValue);
    default: {
      const out = {};
      for (const k of v.keys) out[k] = fromValue(v.field(k));
      return out;
    }
  }
}

// --- the response a caller sees -----------------------------------------------
class SimResponse {
  constructor(raw, chunks) {
    this.status = raw.status;
    this.ok = raw.status >= 200 && raw.status < 300;
    this.contentType = raw.contentType;
    this.streaming = raw.streaming;
    this.chunks = chunks ?? raw.chunks.map((c) => c.text);
    this._body = raw.streaming ? this.chunks.join("") : raw.body;
  }
  async text() {
    return this._body;
  }
  get bodyText() {
    return this._body;
  }
  async json() {
    return JSON.parse(this._body || "{}");
  }
  // The `data:` payloads of an SSE body, already parsed. `[DONE]` is dropped.
  events() {
    const out = [];
    for (const line of this._body.split("\n")) {
      const t = line.trim();
      if (!t.startsWith("data:")) continue;
      const payload = t.slice(5).trim();
      if (!payload || payload === "[DONE]") continue;
      try {
        out.push(JSON.parse(payload));
      } catch {
        out.push(payload);
      }
    }
    return out;
  }
}

const DEFAULT_RULES = `
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} { allow read, write: if request.auth != null; }
  }
}
`;

export function createSim(options = {}) {
  const sim = new R.FsSim();
  const server = sim.backend();
  const latency = sim.wait();

  server.projectId = options.projectId ?? "demo-firesim";
  server.databaseId = options.databaseId ?? "(default)";
  if (options.rulesEnabled === false) server.rulesEnabled = false;

  const auth = server.accounts();
  auth.projectId = server.projectId;

  const lat = options.latency ?? {};
  latency.baseMs = lat.baseMs ?? 0;
  latency.jitterMs = lat.jitterMs ?? 0;
  latency.readMs = lat.readMs ?? -1;
  latency.writeMs = lat.writeMs ?? -1;
  latency.queryMs = lat.queryMs ?? -1;
  latency.authMs = lat.authMs ?? -1;
  latency.seed = lat.seed ?? 12345;

  const rulesText = options.rules ?? DEFAULT_RULES;
  const rulesError = sim.loadRules(rulesText);
  if (rulesError) throw new Error(`the rules did not parse: ${rulesError}`);

  const autoAdvance = options.autoAdvance !== false;

  const api = {
    raw: R,
    sim,
    server,
    latency,
    auth,
    get nowMs() {
      return sim.nowMs;
    },

    // --- the clock ---
    tick(ms) {
      sim.tick(ms);
      return sim.nowMs;
    },
    // Move the clock to the moment a call is fully answered, stream included.
    advanceTo(callId) {
      const call = sim.callById(callId);
      let guard = 0;
      while (!call.complete(sim.nowMs) && guard < 100000) {
        const target = call.done
          ? call.readyMs + call.res().lastChunkMs()
          : call.readyMs;
        const step = Math.max(target - sim.nowMs, 0);
        sim.tick(step + (step === 0 ? 1 : 0));
        guard += 1;
      }
      return call;
    },

    // --- requests ---
    // Returns a call id; the caller ticks. This is the mode a UI uses.
    send(method, url, body, headers) {
      const req = buildRequest(method, url, body, headers);
      return sim.send(req);
    },
    responseOf(callId) {
      return new SimResponse(sim.responseOf(callId));
    },
    ready(callId) {
      return sim.ready(callId);
    },
    takeChunks(callId) {
      return sim.takeChunks(callId);
    },

    // Answer now, with no wait at all — seeding and admin calls.
    fetchNow(url, init = {}) {
      const req = buildRequest(init.method ?? "GET", url, init.body, init.headers);
      return new SimResponse(sim.sendNow(req));
    },

    // The `fetch` shape. With autoAdvance it moves the clock and resolves;
    // without it, it waits for the app's own ticks to get there.
    async fetch(url, init = {}) {
      const id = api.send(init.method ?? "GET", url, init.body, init.headers);
      if (autoAdvance) api.advanceTo(id);
      const call = sim.callById(id);
      if (!call.complete(sim.nowMs)) {
        throw new Error(
          "the call has not arrived yet — tick the simulator, or construct it with autoAdvance",
        );
      }
      return new SimResponse(sim.responseOf(id));
    },

    // A streamed answer, chunk by chunk, as the clock reaches each one.
    async *stream(url, init = {}) {
      const id = api.send(init.method ?? "POST", url, init.body, init.headers);
      const call = sim.callById(id);
      let guard = 0;
      while (!call.complete(sim.nowMs) && guard < 100000) {
        if (!call.done) {
          sim.tick(Math.max(call.readyMs - sim.nowMs, 1));
        } else {
          const res = call.res();
          const next = res.chunks[call.takenChunks];
          if (!next) break;
          sim.tick(Math.max(call.readyMs + next.atMs - sim.nowMs, 0.001));
          for (const text of sim.takeChunks(id)) yield text;
        }
        guard += 1;
      }
      for (const text of sim.takeChunks(id)) yield text;
    },

    // --- seeding ---
    seed(json, { ownerUid = "" } = {}) {
      const text = typeof json === "string" ? json : JSON.stringify(json);
      return sim.seedJson(text, ownerUid);
    },
    seedFile(file, opts) {
      return api.seed(fs.readFileSync(file, "utf8"), opts);
    },
    loadRules(text) {
      const err = sim.loadRules(text);
      if (err) throw new Error(`the rules did not parse: ${err}`);
    },

    // --- accounts ---
    signUp(email, password, displayName = "") {
      const r = auth.signUp(email, password, displayName, sim.nowMs);
      if (!r.ok) throw new Error(r.error);
      return { uid: r.localId, idToken: r.idToken, refreshToken: r.refreshToken };
    },
    signIn(email, password) {
      const r = auth.signIn(email, password, sim.nowMs);
      if (!r.ok) throw new Error(r.error);
      return { uid: r.localId, idToken: r.idToken, refreshToken: r.refreshToken };
    },
    signInAnonymously() {
      const r = auth.signUp("", "", "", sim.nowMs);
      return { uid: r.localId, idToken: r.idToken, refreshToken: r.refreshToken };
    },
    setClaims(uid, claims) {
      return auth.setClaims(uid, toValue(claims));
    },

    // --- reading, without the wire ---
    // For a test that wants to assert on the store rather than on a response.
    docData(pathStr) {
      const store = server.db();
      if (!store.exists(pathStr)) return null;
      return fromValue(store.get(pathStr).root());
    },
    paths() {
      return [...server.db().paths];
    },
    state() {
      return JSON.parse(new R.VlJsonWriter().write(server.stateJson()));
    },
    metrics() {
      return {
        calls: sim.callCount,
        failures: sim.failCount,
        waitedMs: sim.waitedMs,
        version: server.db().version,
        log: server.logPaths.map((p, i) => ({
          method: server.logMethods[i],
          path: p,
          status: server.logStatuses[i],
        })),
      };
    },

    // --- listeners ---
    // A query that answers again when its answer changes. It is the
    // simulator's own — the real thing carries `onSnapshot` over a gRPC
    // channel a REST surface cannot pretend to be — so it lives under the
    // `firesim/` prefix and is named for what it is.
    watch(structuredQuery, { parent = "" } = {}) {
      const body = typeof structuredQuery === "string" ? { document: structuredQuery } : { structuredQuery, parent };
      const first = api.fetchNow("/firesim/v1/watch", { method: "POST", body, headers: authHeader() });
      if (!first.ok) throw new Error(first.bodyText);
      const started = JSON.parse(first.bodyText);
      return {
        id: started.watchId,
        // The whole result, as a view draws it before anything has changed.
        initial: started.changes,
        // What has changed since the last ask. Cheap when nothing has: the
        // store's version has not moved, so the query is not even run.
        poll() {
          const res = api.fetchNow("/firesim/v1/poll", { method: "POST", body: { watchId: started.watchId }, headers: authHeader() });
          if (!res.ok) throw new Error(res.bodyText);
          return JSON.parse(res.bodyText);
        },
        stop() {
          api.fetchNow("/firesim/v1/unwatch", { method: "POST", body: { watchId: started.watchId } });
        },
      };
    },

    // --- the model ---
    ai: {
      canned(prompt, reply) {
        server.model().addCanned(prompt, reply);
      },
      set({ firstTokenMs, chunkMs, failAfter, failMessage } = {}) {
        const m = server.model();
        if (firstTokenMs !== undefined) m.firstTokenMs = firstTokenMs;
        if (chunkMs !== undefined) m.chunkMs = chunkMs;
        if (failAfter !== undefined) m.failAfter = failAfter;
        if (failMessage !== undefined) m.failMessage = failMessage;
      },
    },

    // --- a socket, for the clients that need one ---
    listen(port = 0, { timeScale = 1 } = {}) {
      return startServer(api, sim, port, timeScale);
    },
  };

  // Who a convenience call speaks as. `signIn`/`signUp` set it, so a test
  // does not repeat the Authorization header on every line.
  let asToken = "";
  const authHeader = () => (asToken ? { Authorization: `Bearer ${asToken}` } : {});
  api.actAs = (idTokenOrNull) => {
    asToken = idTokenOrNull ?? "";
    return api;
  };
  for (const name of ["signUp", "signIn", "signInAnonymously"]) {
    const inner = api[name];
    api[name] = (...args) => {
      const out = inner(...args);
      asToken = out.idToken;
      return out;
    };
  }

  if (options.seed) api.seed(options.seed, { ownerUid: options.ownerUid ?? "" });
  return api;
}

function buildRequest(method, url, body, headers) {
  let target = url;
  const scheme = target.indexOf("://");
  if (scheme > 0) {
    const rest = target.slice(scheme + 3);
    const slash = rest.indexOf("/");
    target = slash < 0 ? "/" : rest.slice(slash);
  }
  const text = typeof body === "string" ? body : body ? JSON.stringify(body) : "";
  const req = R.FsRequest.parse(method.toUpperCase(), target, text);
  const head = req.head();
  for (const [k, v] of Object.entries(headers ?? {})) head.set(k, String(v));
  return req;
}

// A real socket, so a browser page, an Android or iOS simulator, or curl can
// reach the same simulator. A streamed answer goes out as Server-Sent Events
// on the clock, scaled by `timeScale` — 0 makes it arrive at once, which is
// what a CI run wants.
function startServer(api, sim, port, timeScale) {
  const server = http.createServer((req, res) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", async () => {
      const body = Buffer.concat(chunks).toString("utf8");
      const headers = {};
      for (const [k, v] of Object.entries(req.headers)) headers[k] = Array.isArray(v) ? v[0] : v;
      const cors = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "*",
        "Access-Control-Allow-Methods": "GET,POST,PATCH,DELETE,OPTIONS",
      };
      if (req.method === "OPTIONS") {
        res.writeHead(204, cors);
        res.end();
        return;
      }
      const id = api.send(req.method, req.url, body, headers);
      const call = sim.callById(id);
      // Wait out the latency in real time, so a browser sees the spinner.
      const waitMs = Math.max(call.readyMs - sim.nowMs, 0) * timeScale;
      await sleep(waitMs);
      sim.tick(Math.max(call.readyMs - sim.nowMs, 0));
      const answer = call.res();
      if (!answer.streaming) {
        const payload = answer.body;
        res.writeHead(answer.status, {
          ...cors,
          "Content-Type": answer.contentType,
          "Content-Length": Buffer.byteLength(payload),
        });
        res.end(payload);
        return;
      }
      res.writeHead(answer.status, {
        ...cors,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      });
      let at = 0;
      for (const chunk of answer.chunks) {
        await sleep(Math.max(chunk.atMs - at, 0) * timeScale);
        at = chunk.atMs;
        sim.tick(Math.max(call.readyMs + chunk.atMs - sim.nowMs, 0));
        res.write(chunk.text);
      }
      res.end();
    });
  });
  return new Promise((resolve) => {
    server.listen(port, () => {
      const address = server.address();
      resolve({
        port: address.port,
        url: `http://127.0.0.1:${address.port}`,
        close: () => new Promise((done) => server.close(done)),
        server,
      });
    });
  });
}

const sleep = (ms) => (ms > 0 ? new Promise((r) => setTimeout(r, ms)) : Promise.resolve());

export { SimResponse, DEFAULT_RULES };
