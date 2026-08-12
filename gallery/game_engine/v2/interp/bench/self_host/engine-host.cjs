// Host surface for running bin/output.js -- the Ranger compiler itself --
// inside ComponentEngine.
//
// The compiler is an ordinary Node program: it reads `process.argv`, requires
// `fs`/`path`/`crypto`, and writes its result with `fs.writeFileSync`. None of
// that exists inside the engine, so it is supplied here in two layers:
//
//   * HostBridge  -- real file reads, sha256 and path math, reached from guest
//                    code through the engine's native bridge (setNativeBridge).
//                    Writes are CAPTURED, never applied to disk, so a run can
//                    be compared against the Node oracle without touching the
//                    tree it was built from.
//   * buildPrelude -- the guest-side `process`, `require` and `__dirname` the
//                    compiler expects, written on top of those bridge calls.
//
// Everything else -- the parser, the type checker, every writer -- runs on the
// engine.
const fs = require('fs');
const pathMod = require('path');
const crypto = require('crypto');

const ROOT = pathMod.resolve(__dirname, '../../../../../..');
const ENGINE_MODULE = pathMod.join(ROOT, 'gallery/game_engine/v2/interp/bin/engine_module.cjs');
const M = require(ENGINE_MODULE);
const { ComponentEngine, EvHandle, EvValueBridge, EvalNativeBridge } = M;

const S = (s) => EvValueBridge.taggedString(String(s));
const B = (b) => EvValueBridge.taggedBoolean(!!b);
const NUL = () => EvValueBridge.taggedNull();

class HostBridge extends EvalNativeBridge {
  constructor(stats) {
    super();
    this.writes = {};
    this.stats = stats || { reads: 0, exists: 0, writes: 0 };
  }
  has(name) {
    return String(name).indexOf('__host_') === 0;
  }
  invoke(name, args) {
    const a = (i) => (args[i] && args[i].isString ? args[i].stringOf() : String(args[i]));
    try {
      switch (name) {
        case '__host_read': {
          const p = a(0);
          this.stats.reads++;
          if (!fs.existsSync(p)) return NUL();
          return S(fs.readFileSync(p, 'utf8'));
        }
        case '__host_exists':
          this.stats.exists++;
          return B(fs.existsSync(a(0)));
        case '__host_write':
          this.writes[a(0)] = a(1);
          this.stats.writes++;
          return B(true);
        case '__host_mkdir':
          return B(true);
        case '__host_dirname':
          return S(pathMod.dirname(a(0)));
        case '__host_normalize':
          return S(pathMod.normalize(a(0)));
        case '__host_sha256':
          return S(crypto.createHash('sha256').update(a(0)).digest('hex'));
      }
    } catch (e) {
      return NUL();
    }
    return NUL();
  }
}

// The Node surface, as guest source. Paths are resolved against the repo root,
// which is the working directory the compiler's own relative paths assume.
function buildPrelude(argv) {
  const R = JSON.stringify(ROOT);
  return `
var process = {
  argv: ${JSON.stringify(argv)},
  env: { RANGER_LIB: "./compiler/Lang.rgr:./lib/stdops.rgr" },
  cwd: function () { return ${R}; },
  stdout: { isTTY: false, write: function () {} },
  platform: "linux",
  exit: function () {}
};
var __dirname = ${JSON.stringify(pathMod.join(ROOT, 'bin'))};
var __filename = ${JSON.stringify(pathMod.join(ROOT, 'bin/output.js'))};
function __abs(p) {
  p = String(p);
  if (p.charAt(0) === "/") return __host_normalize(p);
  return __host_normalize(${R} + "/" + p);
}
var __fs = {
  existsSync: function (p) { return __host_exists(__abs(p)); },
  readFileSync: function (p) { var r = __host_read(__abs(p)); return r === null ? "" : r; },
  readFile: function (p, enc, cb) {
    var f = (typeof enc === "function") ? enc : cb;
    var r = __host_read(__abs(p));
    if (r === null) { f(new Error("ENOENT: " + p), null); } else { f(null, r); }
  },
  writeFileSync: function (p, c) { __host_write(__abs(p), c); },
  mkdirSync: function (p) { return __host_mkdir(__abs(p)); },
  readdirSync: function () { return []; }
};
var __path = {
  dirname: function (p) { return __host_dirname(String(p)); },
  normalize: function (p) { return __host_normalize(String(p)); },
  resolve: function (p) { return __abs(p); },
  join: function () {
    var out = "";
    for (var i = 0; i < arguments.length; i++) {
      out = out.length ? out + "/" + arguments[i] : String(arguments[i]);
    }
    return __host_normalize(out);
  },
  sep: "/"
};
var __crypto = {
  createHash: function () {
    var acc = "";
    var h = {
      update: function (s) { acc += String(s); return h; },
      digest: function () { return __host_sha256(acc); }
    };
    return h;
  }
};
function require(name) {
  if (name === "fs") return __fs;
  if (name === "path") return __path;
  if (name === "crypto") return __crypto;
  return {};
}
`;
}

// Load the compiler bundle into an engine. The shebang goes (it is not
// JavaScript) and the trailing `__js_main();` call is removed so the caller
// decides when to start it -- the entry is async, and its continuations only
// run when the job queue is drained.
function loadCompiler(engine, argv, compilerJs) {
  let src = fs.readFileSync(compilerJs || pathMod.join(ROOT, 'bin/output.js'), 'utf8');
  if (src.charCodeAt(0) === 35) src = src.slice(src.indexOf('\n') + 1);
  src = src.replace(/\n__js_main\(\);\s*$/, '\n');
  const boot = `
var __DONE = "no";
function __boot() {
  var p = __js_main();
  if (p && p.then) {
    p.then(function () { __DONE = "resolved"; }, function (e) { __DONE = "rejected:" + (e && e.message); });
  }
  return "started";
}
function __bootState() { return __DONE; }
`;
  engine.loadScript(buildPrelude(argv) + '\n' + src + boot);
  if (engine.lastSyntaxError) throw new Error('parse: ' + engine.lastSyntaxError);
}

module.exports = { HostBridge, buildPrelude, loadCompiler, ROOT, ComponentEngine, EvHandle, EngineModule: M };
