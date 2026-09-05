// SPDX-License-Identifier: AGPL-3.0-or-later
//
// The engine off the main thread.
//
// PLAN_NATIVE_HOSTS.md S1, the web half. An EVG app — the tree, the cascade,
// the layout, the display list, the hit test — is pure Ranger and needs no
// DOM, so it can run in a Worker, and then a layout that takes twelve
// milliseconds on a chart-heavy page blocks neither the pointer nor the
// compositor. What crosses back is the display list as `toBinary()` gives
// it: three `Int32Array`s and a string pool, TRANSFERRED rather than copied,
// read on the main thread by `evg-binary.js` into the same commands the
// painter has always been fed. Input crosses the other way, as the calls the
// host already made — `press`, `scrollDrag`, `setHover` — and the hit test
// happens where the tree is.
//
// One file, two halves:
//
//   serveEngine(opts)      the worker's side — owns the app and answers
//   connectEngine(worker)  the page's side — a proxy the host talks to
//
// THE PROTOCOL, and why it is shaped like this.
//
//   post(name, ...args)    a call with no answer, QUEUED — a pointer move, a
//                          key, a press. Nothing is sent yet.
//   call(name, ...args)    a call with an answer, as a promise: `hitId` for
//                          the cursor, `fieldStateJson` for the text bridge.
//                          Sent at once, with everything queued before it,
//                          so order is what the host wrote.
//   frame(dt)              the frame: every queued post, then `tick(dt)`,
//                          then the display list — ONE message each way per
//                          frame, however many events the browser delivered.
//
// The reply to `frame` is one of three things, and the host's painter
// already knows what to do with each — it is exactly the distinction
// `gallery/realtrainer/web/main.js` draws with `buildSeq` and `frameSeq`:
//
//   { t: "frame", doc, shifts }   a new build: buffers to upload
//   { t: "shift", shifts }        the kept list moved — a scroll — draw the
//                                 frame on the card with new offsets
//   { t: "idle" }                 nothing moved; do not draw
//
// Every reply carries `state`: a small object the app-side bootstrap
// composes from what the host reads on every frame — the scene's name, the
// focused field, the scroll velocity — so the host is not making a round
// trip for a string. What a host cannot do is READ synchronously; that is
// the whole change, and `main-worker.js` beside the RealTrainer page shows
// what a host looks like written that way.

import { cmdsOfBinary, transferablesOf } from "./evg-binary.js";

// ---------------------------------------------------------------------------
// The worker's side
// ---------------------------------------------------------------------------

/**
 * Serve an app from inside a Worker.
 *
 * @param {object} opts
 * @param {(init: any) => object} opts.make    build the app from the `init`
 *        message's payload — install the measurer FIRST (`evg-measure.js`
 *        works here through `OffscreenCanvas`), because the app keeps a
 *        layout from the moment it exists
 * @param {(app: object) => object} opts.display  the display list for the
 *        frame: `app.display()` for a host that keeps its list
 * @param {(app: object, dt: number) => boolean} [opts.tick]  the clock;
 *        default `app.tick(dt)`
 * @param {(app: object) => object} [opts.state]  what every reply carries
 * @param {(app: object) => object|undefined} [opts.effect]  the surface
 *        effect, in the JSON's shape — `effectOf` from evg-list.js
 * @param {(app: object) => number[][]} opts.shifts  the layers' shifts —
 *        `shiftsOf` from evg-list.js
 * @param {(app: object, dl: object) => object} [opts.onBuild]  what a NEW
 *        BUILD carries beside the picture — the accessibility tree, say,
 *        which changes when the tree changes and at no other time — merged
 *        into the "frame" reply as `built`
 * @param {object} [opts.hooks]  functions the host may post or call by
 *        `@name` — host logic that belongs beside the tree, such as "hit
 *        test this point and hover what is there", written once here rather
 *        than as three round trips
 * @param {object} [opts.scope]  `self` by default
 */
export function serveEngine(opts) {
  const scope = opts.scope || self;
  let app = null;
  let lastList = null;
  let lastSeq = -1;
  let lastShifts = "";
  const tick = opts.tick || ((a, dt) => a.tick(dt));
  const state = opts.state || (() => ({}));

  const reply = (msg, transfer) => scope.postMessage(msg, transfer || []);

  const run = (name, args) => {
    if (name.charCodeAt(0) === 64) {
      const h = opts.hooks && opts.hooks[name.slice(1)];
      if (typeof h !== "function") throw new Error(`engine: no hook ${name}`);
      return h(app, ...args);
    }
    const f = app[name];
    if (typeof f !== "function") throw new Error(`engine: the app has no method ${name}`);
    return f.apply(app, args);
  };

  const frameReply = (dt, dirty) => {
    let ticked = false;
    if (dt !== undefined && dt !== null) ticked = !!tick(app, dt);
    const dl = opts.display(app);
    const seq = dl.buildSeq * 100000 + dl.frameSeq;
    const shifts = opts.shifts(app, dl);
    const st = state(app, dl);
    if (dl !== lastList || seq !== lastSeq) {
      lastList = dl;
      lastSeq = seq;
      lastShifts = JSON.stringify(shifts);
      const bin = dl.toBinary();
      const doc = {
        width: bin.width, height: bin.height, seq,
        bin: { count: bin.count, cmds: bin.cmds, pts: bin.pts, ends: bin.ends, strings: bin.strings },
      };
      const effect = opts.effect ? opts.effect(app, dl) : undefined;
      if (effect) doc.effect = effect;
      const built = opts.onBuild ? opts.onBuild(app, dl) : undefined;
      reply({ t: "frame", doc, shifts, state: st, ticked, built }, transferablesOf(bin));
      return;
    }
    const sh = JSON.stringify(shifts);
    if (sh !== lastShifts || ticked || dirty) {
      lastShifts = sh;
      reply({ t: "shift", shifts, state: st, ticked });
      return;
    }
    reply({ t: "idle", state: st, ticked });
  };

  scope.onmessage = (ev) => {
    const m = ev.data;
    try {
      switch (m.t) {
        case "init":
          app = opts.make(m.init);
          reply({ t: "ready", state: state(app, null) });
          break;
        case "post":
          run(m.name, m.args);
          break;
        case "call": {
          const value = run(m.name, m.args);
          reply({ t: "ret", id: m.id, value: value === undefined ? null : value });
          break;
        }
        case "batch": {
          let dirty = false;
          for (const [name, args] of m.posts) {
            const r = run(name, args);
            if (r === true) dirty = true;
          }
          for (const c of m.calls) {
            const value = run(c.name, c.args);
            reply({ t: "ret", id: c.id, value: value === undefined ? null : value });
          }
          if (m.frame) frameReply(m.dt, dirty || m.dirty);
          break;
        }
        case "close":
          scope.close();
          break;
        default:
          throw new Error(`engine: unknown message ${m.t}`);
      }
    } catch (e) {
      reply({ t: "error", id: m.id, message: String((e && e.stack) || e), during: m.t + ":" + (m.name || "") });
    }
  };
}

// ---------------------------------------------------------------------------
// The page's side
// ---------------------------------------------------------------------------

/**
 * Talk to an app served by `serveEngine`.
 *
 * @param {Worker} worker
 * @param {any} init  what the worker's `make` is handed
 * @returns {{
 *   ready: Promise<object>,
 *   post: (name: string, ...args: any[]) => void,
 *   call: (name: string, ...args: any[]) => Promise<any>,
 *   frame: (dt?: number, dirty?: boolean) => Promise<object>,
 *   flush: () => void,
 *   state: () => object,
 *   onError: (fn: (e: {message: string, during: string}) => void) => void,
 *   close: () => void,
 * }}
 */
export function connectEngine(worker, init) {
  let nextId = 1;
  const waiting = new Map();
  let posts = [];
  let last = {};
  let errorFn = (e) => console.error("engine:", e.during, e.message);
  let readyResolve;
  const ready = new Promise((r) => { readyResolve = r; });
  // At most one frame in flight: a host that asks for the next frame before
  // the last one came back is asking the worker to fall behind, and a
  // second request is answered by the reply already coming.
  let frameWaiting = null;

  worker.onmessage = (ev) => {
    const m = ev.data;
    switch (m.t) {
      case "ready":
        last = m.state || {};
        readyResolve(last);
        break;
      case "ret": {
        const w = waiting.get(m.id);
        if (w) { waiting.delete(m.id); w.resolve(m.value); }
        break;
      }
      case "frame": {
        // The buffers arrive owned by this thread; the commands are made once.
        m.doc.list = { seq: m.doc.seq, shifts: m.shifts, cmds: cmdsOfBinary(m.doc.bin) };
        if (m.doc.effect) m.doc.list.effect = m.doc.effect;
        delete m.doc.bin;
        // falls through
      }
      case "shift":
      case "idle": {
        last = m.state || last;
        const w = frameWaiting;
        frameWaiting = null;
        if (w) w.resolve(m);
        break;
      }
      case "error": {
        if (m.id !== undefined && waiting.has(m.id)) {
          const w = waiting.get(m.id);
          waiting.delete(m.id);
          w.reject(new Error(m.message));
        } else if (frameWaiting && m.during.startsWith("batch")) {
          const w = frameWaiting;
          frameWaiting = null;
          w.reject(new Error(m.message));
        }
        errorFn(m);
        break;
      }
      default:
        break;
    }
  };

  worker.postMessage({ t: "init", init });

  const send = (calls, frame, dt, dirty) => {
    const batch = { t: "batch", posts, calls, frame, dt, dirty };
    posts = [];
    worker.postMessage(batch);
  };

  return {
    ready,
    post(name, ...args) {
      posts.push([name, args]);
    },
    call(name, ...args) {
      const id = nextId++;
      return new Promise((resolve, reject) => {
        waiting.set(id, { resolve, reject });
        send([{ id, name, args }], false);
      });
    },
    frame(dt, dirty) {
      if (frameWaiting) return frameWaiting.promise;
      let resolve, reject;
      const promise = new Promise((res, rej) => { resolve = res; reject = rej; });
      frameWaiting = { promise, resolve, reject };
      send([], true, dt, !!dirty);
      return promise;
    },
    /** Send what is queued without asking for a frame. */
    flush() {
      if (posts.length) send([], false);
    },
    state() {
      return last;
    },
    onError(fn) {
      errorFn = fn;
    },
    close() {
      worker.postMessage({ t: "close" });
    },
  };
}
