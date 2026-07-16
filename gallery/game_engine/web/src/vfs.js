// ============================================================================
// vfs.js — in-browser virtual filesystem + Node-API shim for the Ranger engine.
// ============================================================================
//
// The Ranger engine is emitted for Node: it loads game scripts and assets with
// require('fs').readFileSync/existsSync/statSync and (harmlessly) writeFileSync,
// and reads process.argv. In the browser none of that exists, so this module
// provides:
//
//   * RangerVFS   — a Map<path,{bytes,mtimeMs}> with normalized paths. This is
//                   the single substrate shared by the engine (reads assets),
//                   the editor (writes edits, bumping mtimeMs), and asset
//                   providers (zip / manifest / IndexedDB fill it).
//   * makeRequire — a require() that resolves 'fs'/'path' against a VFS, so the
//                   emitted engine JS runs unmodified.
//
// Only four fs methods are ever called by the engine, so the surface is tiny.
// "Zip or database" are just providers behind the same VFS interface.
//
// Runs in both Node (build/test tooling) and the browser (no bundler needed):
// attaches to `globalThis.RangerVFS` and also supports CommonJS export.
// ============================================================================

(function (root) {
  "use strict";

  function normalize(p) {
    // Collapse `//`, resolve `.`/`..`, strip leading `./`. Keeps paths
    // repo-relative (no leading slash) so they match what the engine hardcodes,
    // e.g. "gallery/game_engine/scripting/pong.game.tsx".
    const abs = p.startsWith("/");
    const parts = String(p).replace(/\\/g, "/").split("/");
    const out = [];
    for (const part of parts) {
      if (part === "" || part === ".") continue;
      if (part === "..") {
        out.pop();
        continue;
      }
      out.push(part);
    }
    return (abs ? "/" : "") + out.join("/");
  }

  function toU8(data) {
    if (data instanceof Uint8Array) return data;
    if (data instanceof ArrayBuffer) return new Uint8Array(data);
    if (ArrayBuffer.isView(data)) {
      return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
    }
    if (typeof data === "string") {
      if (typeof TextEncoder !== "undefined") {
        return new TextEncoder().encode(data);
      }
      const u = new Uint8Array(data.length);
      for (let i = 0; i < data.length; i++) u[i] = data.charCodeAt(i) & 0xff;
      return u;
    }
    // Node Buffer or array-like
    return Uint8Array.from(data);
  }

  function u8ToString(u8) {
    if (typeof TextDecoder !== "undefined") {
      return new TextDecoder("utf-8").decode(u8);
    }
    let s = "";
    for (let i = 0; i < u8.length; i++) s += String.fromCharCode(u8[i]);
    return s;
  }

  // ------------------------------------------------------------------ VFS
  class RangerVFS {
    constructor() {
      this.files = new Map(); // normalized path -> { bytes: Uint8Array, mtimeMs }
      this._clock = 1;
    }

    _now() {
      // Monotonic logical clock — a write always produces a strictly larger
      // mtimeMs than any prior write, which is exactly what the engine's
      // statSync().mtimeMs hot-reload poll needs. No wall clock required.
      return this._clock++;
    }

    write(path, data) {
      const key = normalize(path);
      this.files.set(key, { bytes: toU8(data), mtimeMs: this._now() });
      return key;
    }

    // Convenience for providers / editors.
    writeText(path, text) {
      return this.write(path, toU8(text));
    }

    exists(path) {
      return this.files.has(normalize(path));
    }

    read(path) {
      const f = this.files.get(normalize(path));
      if (!f) {
        const e = new Error("ENOENT: no such file, open '" + path + "'");
        e.code = "ENOENT";
        throw e;
      }
      return f.bytes;
    }

    readText(path) {
      return u8ToString(this.read(path));
    }

    stat(path) {
      const f = this.files.get(normalize(path));
      if (!f) {
        const e = new Error("ENOENT: no such file, stat '" + path + "'");
        e.code = "ENOENT";
        throw e;
      }
      return { mtimeMs: f.mtimeMs, size: f.bytes.length, isFile: () => true };
    }

    list() {
      return [...this.files.keys()].sort();
    }

    // ---- providers -------------------------------------------------------

    // JSON manifest: { "path": "<utf8 text>" | {b64:"..."} }. Text-only games
    // (pong) fit the plain-string form; binary assets use base64.
    mountManifest(manifest) {
      for (const [path, val] of Object.entries(manifest)) {
        if (typeof val === "string") this.writeText(path, val);
        else if (val && val.b64) this.write(path, base64ToU8(val.b64));
      }
    }

    // Stored (uncompressed, method 0) ZIP. Enough for shipping a game package
    // as a single .zip without pulling in a DEFLATE dependency; larger binary
    // packs can move to a compressed reader later behind this same call.
    mountZip(arrayBuffer, opts) {
      const prefix = (opts && opts.prefix) || "";
      const dv = new DataView(
        arrayBuffer instanceof ArrayBuffer ? arrayBuffer : toU8(arrayBuffer).buffer,
      );
      const u8 = new Uint8Array(dv.buffer);
      // Walk local file headers (PK\x03\x04). Central directory is ignored.
      let i = 0;
      const n = u8.length;
      let count = 0;
      while (i + 4 <= n) {
        const sig = dv.getUint32(i, true);
        if (sig !== 0x04034b50) break; // not a local file header -> done
        const method = dv.getUint16(i + 8, true);
        const compSize = dv.getUint32(i + 18, true);
        const nameLen = dv.getUint16(i + 26, true);
        const extraLen = dv.getUint16(i + 28, true);
        const nameStart = i + 30;
        const name = u8ToString(u8.subarray(nameStart, nameStart + nameLen));
        const dataStart = nameStart + nameLen + extraLen;
        if (method !== 0) {
          throw new Error(
            "vfs.mountZip: entry '" + name + "' uses compression method " +
              method + "; only stored (0) is supported. Build with `zip -0`.",
          );
        }
        if (!name.endsWith("/")) {
          this.write(prefix + name, u8.subarray(dataStart, dataStart + compSize));
          count++;
        }
        i = dataStart + compSize;
      }
      return count;
    }
  }

  function base64ToU8(b64) {
    if (typeof atob === "function") {
      const bin = atob(b64);
      const u = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
      return u;
    }
    return Uint8Array.from(Buffer.from(b64, "base64"));
  }

  // -------------------------------------------------- Node-API require shim
  // Returns a require() the emitted engine can be handed. Only the modules the
  // engine actually touches are provided; anything else throws loudly.
  function makeRequire(vfs, options) {
    const opts = options || {};
    const onWrite = opts.onWrite || null; // (path, bytes) => void, optional

    const fsModule = {
      readFileSync(p, enc) {
        const bytes = vfs.read(p);
        if (enc === "utf8" || enc === "utf-8" || (enc && enc.encoding)) {
          return u8ToString(bytes);
        }
        // The engine wraps the returned bytes with `new Uint8Array(b)` and reads
        // `.length`, so a Uint8Array (or Node Buffer) is what it expects.
        return typeof Buffer !== "undefined" ? Buffer.from(bytes) : bytes;
      },
      existsSync(p) {
        return vfs.exists(p);
      },
      writeFileSync(p, data) {
        vfs.write(p, data);
        if (onWrite) onWrite(normalize(p), toU8(data));
      },
      statSync(p) {
        return vfs.stat(p);
      },
      mkdirSync() {},
    };

    const pathModule = {
      normalize,
      join: (...parts) => normalize(parts.join("/")),
      dirname(p) {
        const n = normalize(p);
        const i = n.lastIndexOf("/");
        return i <= 0 ? "." : n.slice(0, i);
      },
      basename(p) {
        const n = normalize(p);
        return n.slice(n.lastIndexOf("/") + 1);
      },
    };

    const cache = { fs: fsModule, path: pathModule };
    return function req(id) {
      if (id in cache) return cache[id];
      throw new Error("ranger-web require(): module not available in browser: " + id);
    };
  }

  const api = { RangerVFS, makeRequire, normalize, toU8, u8ToString, base64ToU8 };
  root.RangerVFS = RangerVFS;
  root.RangerWebFS = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
