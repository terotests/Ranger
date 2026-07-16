// ============================================================================
// engine-host.js — instantiate the compiled Ranger engine against a VFS.
// ============================================================================
//
// The build step (build.mjs) emits `engine.bundle.js`: the es6-compiled engine
// with its trailing auto-run `__js_main();` stripped and an epilogue appended
// that returns the classes we drive from JS. Loaded that way, the whole engine
// executes inside a function scope where `require` is *our* VFS shim — so every
// require('fs').readFileSync in the engine resolves against the virtual FS
// instead of a real disk that the browser does not have.
//
// The bundle text is wrapped as the body of a factory:
//     function(require, process, Buffer, module, exports) { ...engine...
//                                                            return {GameRunner}; }
// ============================================================================

(function (root) {
  "use strict";

  const FS = root.RangerWebFS;

  // Minimal Buffer.from for the browser — the engine only uses it to hand bytes
  // to writeFileSync (which the VFS swallows), so a Uint8Array is sufficient.
  function makeBuffer() {
    if (typeof Buffer !== "undefined") return Buffer;
    const B = {
      from(data) {
        return FS.toU8(data);
      },
      isBuffer(x) {
        return x instanceof Uint8Array;
      },
    };
    return B;
  }

  // Instantiate an engine bundle. `bundleSource` is the text of engine.bundle.js
  // (a bare function body ending in `return {...}`). `vfs` is a RangerVFS.
  function createEngine(bundleSource, vfs, options) {
    const opts = options || {};
    const req = FS.makeRequire(vfs, { onWrite: opts.onWrite });
    const proc = { argv: ["node", "engine", ...(opts.argv || [])], env: {} };
    const Buf = makeBuffer();
    // eslint-disable-next-line no-new-func
    const factory = new Function(
      "require",
      "process",
      "Buffer",
      "module",
      "exports",
      bundleSource,
    );
    const mod = { exports: {} };
    const api = factory(req, proc, Buf, mod, mod.exports);
    return api && api.GameRunner ? api : mod.exports;
  }

  root.RangerEngineHost = { createEngine };
  if (typeof module !== "undefined" && module.exports) {
    module.exports = { createEngine };
  }
})(typeof globalThis !== "undefined" ? globalThis : this);
