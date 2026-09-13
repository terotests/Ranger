// SPDX-License-Identifier: AGPL-3.0-or-later
//
// uix-core.js — what both UIX preludes share.
//
// Runs INSIDE Ranger's ComponentEngine, ahead of the application. It owns the
// plumbing between the application's objects and the emulator:
//
//   events    handlers registered by target ("frame", "listing", "tab:<id>"…)
//             and event number; the host calls __mfHostEvent to fire them
//   promises  a dialog's promise waits under the dialog id; __mfResolve settles it
//   timers    setTimeout / setInterval, advanced by the host through __mfTick
//   console   console.* is rewritten to __mfConsole.* before the application
//             loads, so what it logs reaches the emulator's console panel
//
// Nothing here knows UIX v1 from v2; the preludes decide what an event
// argument such as {"$ref":"selection"} becomes (__mfResolveRef).

var window = globalThis;
var self = globalThis;

var __mf = {
  handlers: [],
  nextHandle: 1,
  pending: {},
  results: {},
  nextToken: 1,
  timers: [],
  clock: 0,
  nextTimer: 1,
  frame: null,
};

function __mfText(v) {
  if (typeof v === "string") return v;
  if (v === undefined) return "undefined";
  try {
    return JSON.stringify(v);
  } catch (e) {
    return String(v);
  }
}

var __mfConsole = {
  log: (...a) => __mf_log("log", a.map(__mfText).join(" ")),
  info: (...a) => __mf_log("info", a.map(__mfText).join(" ")),
  debug: (...a) => __mf_log("debug", a.map(__mfText).join(" ")),
  warn: (...a) => __mf_log("warn", a.map(__mfText).join(" ")),
  error: (...a) => __mf_log("error", a.map(__mfText).join(" ")),
};

function __mfErrorText(e) {
  if (e && typeof e === "object" && e.message !== undefined) {
    return (e.name ? e.name + ": " : "") + e.message;
  }
  return String(e);
}

function __mfReport(e, where) {
  __mf_log("error", (where ? where + ": " : "") + __mfErrorText(e));
}

// The gRPC wire carries snake_case fields only. Helper accessors on message
// objects (ID, Type, IsNull …) are PascalCase and must not travel.
function __mfWire(value) {
  return JSON.stringify(value === undefined ? {} : value, function (key, v) {
    if (key) {
      var c = key.charCodeAt(0);
      if (c >= 65 && c <= 90) return undefined;
    }
    return v;
  });
}

function __mfParse(text) {
  if (!text || text === "null") return null;
  return JSON.parse(text);
}

// A shell operation whose arguments are emulator-shaped (safe to filter).
function __mfOp(op, args) {
  return __mfParse(__mf_shell(op, __mfWire(args || {})));
}

// A shell operation whose arguments carry application data verbatim.
function __mfOpRaw(op, args) {
  return __mfParse(__mf_shell(op, JSON.stringify(args || {})));
}

function __mfVaultSync(method, request) {
  var env = JSON.parse(__mf_vault(method, __mfWire(request || {})));
  if (env.ok) return env.response;
  var err = new Error(env.error.message);
  err.code = env.error.code;
  throw err;
}

function __mfVaultAsync(method, request) {
  return new Promise(function (resolve, reject) {
    try {
      resolve(__mfVaultSync(method, request));
    } catch (e) {
      reject(e);
    }
  });
}

function __mfAwait(id) {
  return new Promise(function (resolve) {
    __mf.pending[id] = { resolve: resolve };
  });
}

// Events. `sync` answers Register with the handle itself (UIX v1) instead of
// a promise of it (UIX v2).
function __mfEvents(target, sync) {
  return {
    Register: function (event, callback) {
      var handle = __mf.nextHandle++;
      __mf.handlers.push({ handle: handle, target: target, event: event, callback: callback });
      return sync ? handle : Promise.resolve(handle);
    },
    RegisterAsync: function (event, callback) {
      return this.Register(event, callback);
    },
    Unregister: function (handle) {
      __mf.handlers = __mf.handlers.filter((h) => h.handle !== handle);
      return sync ? true : Promise.resolve(true);
    },
  };
}

function __mfEventName(n) {
  var names = typeof __MF_ENUMS !== "undefined" ? __MF_ENUMS.Event : null;
  return names && names[n] ? "Event." + names[n] : "event " + n;
}

function __mfHostEvent(json) {
  var msg = JSON.parse(json);
  var token = String(__mf.nextToken++);
  var results = [];
  __mf.results[token] = results;
  var hs = __mf.handlers.filter((h) => h.target === msg.target && h.event === msg.event);
  if (hs.length === 0) return token;
  var args = (msg.args || []).map(__mfResolveRef);
  hs.forEach(function (h) {
    var slot = { done: false, value: undefined };
    results.push(slot);
    try {
      var r = h.callback(...args);
      if (r && typeof r.then === "function") {
        r.then(
          function (v) {
            slot.done = true;
            slot.value = v;
          },
          function (e) {
            slot.done = true;
            __mfReport(e, __mfEventName(msg.event));
          }
        );
      } else {
        slot.done = true;
        slot.value = r;
      }
    } catch (e) {
      slot.done = true;
      __mfReport(e, __mfEventName(msg.event));
    }
  });
  return token;
}

function __mfResult(token) {
  var rs = __mf.results[token] || [];
  delete __mf.results[token];
  return JSON.stringify({
    values: rs.map((s) => (s.done && s.value !== undefined ? s.value : null)),
    pending: rs.filter((s) => !s.done).length,
  });
}

function __mfResolve(json) {
  var m = JSON.parse(json);
  var p = __mf.pending[m.id];
  if (p) {
    delete __mf.pending[m.id];
    p.resolve(m.value);
  }
  return "";
}

function setTimeout(fn, ms) {
  var id = __mf.nextTimer++;
  __mf.timers.push({ id: id, at: __mf.clock + (Number(ms) || 0), fn: fn, every: 0 });
  return id;
}

function setInterval(fn, ms) {
  var id = __mf.nextTimer++;
  var every = Math.max(Number(ms) || 0, 1);
  __mf.timers.push({ id: id, at: __mf.clock + every, fn: fn, every: every });
  return id;
}

function clearTimeout(id) {
  __mf.timers = __mf.timers.filter((t) => t.id !== id);
}

var clearInterval = clearTimeout;

function __mfTick(msText) {
  __mf.clock += Number(msText) || 0;
  var due = __mf.timers.filter((t) => t.at <= __mf.clock);
  due.forEach(function (t) {
    if (t.every > 0) {
      t.at += t.every;
    } else {
      __mf.timers = __mf.timers.filter((x) => x.id !== t.id);
    }
    try {
      t.fn();
    } catch (e) {
      __mfReport(e, "timer");
    }
  });
  return "";
}

function __mfStart() {
  var entry = typeof window.OnNewShellUI === "function" ? window.OnNewShellUI : null;
  if (!entry) {
    __mf_log("error", "The application defines no OnNewShellUI function");
    return "";
  }
  try {
    var r = entry(shellUI);
    if (r && typeof r.then === "function") {
      r.then(null, (e) => __mfReport(e, "OnNewShellUI"));
    }
  } catch (e) {
    __mfReport(e, "OnNewShellUI");
  }
  return "";
}
