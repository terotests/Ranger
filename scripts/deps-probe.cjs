/**
 * deps-probe — record which source files a compiler run actually touched.
 *
 * Preloaded into the compiler process with `node -r` by `rgrc-cached.mjs`,
 * which uses the result as its cache key. Writes JSON to `$RGRC_DEPS_OUT` on
 * exit:
 *
 *   read    every `.rgr` and `ranger.json` the compiler opened and got bytes
 *           from — the files whose contents the output depends on.
 *   missed  every such path it looked for and did not find. These matter as
 *           much: `Import` resolution walks `RANGER_LIB` search paths, a
 *           `ranger.json` dependency map, `ranger.lock`, `vendor/` and the
 *           package cache in order, so a file appearing at a path that was
 *           empty when the manifest was written changes what the same `Import`
 *           resolves to next time. Without this set the cache would keep
 *           serving a build made from the file that used to win.
 *
 * Asking the compiler what it read, rather than resolving imports again here,
 * is the point: a second implementation of those resolution rules that drifted
 * by one case would serve a stale build and say nothing.
 *
 * SPDX-License-Identifier: MIT
 */
const fs = require("fs");
const path = require("path");

const read = new Set();
const missed = new Set();

/** Sources, and the manifests that decide where a `pkg:` import points. */
const isSource = (p) =>
  typeof p === "string" && (/\.rgr$/.test(p) || /(^|[\\/])ranger\.(json|lock)$/.test(p));

const abs = (p) => {
  try { return path.resolve(p); } catch { return null; }
};
const noteRead = (p) => { const a = abs(p); if (a) { read.add(a); missed.delete(a); } };
const noteMiss = (p) => { const a = abs(p); if (a && !read.has(a)) missed.add(a); };

const origReadSync = fs.readFileSync;
fs.readFileSync = function (p, ...rest) {
  if (!isSource(p)) return origReadSync.call(fs, p, ...rest);
  try {
    const data = origReadSync.call(fs, p, ...rest);
    noteRead(p);
    return data;
  } catch (e) {
    noteMiss(p);
    throw e;
  }
};

const origRead = fs.readFile;
fs.readFile = function (p, ...rest) {
  const cb = rest[rest.length - 1];
  if (isSource(p) && typeof cb === "function") {
    rest[rest.length - 1] = function (err, data) {
      // The compiler reads sources with a callback that ignores `err` and
      // resolves `undefined`, so a miss is "no data" rather than an error.
      if (err || data === undefined || data === null) noteMiss(p);
      else noteRead(p);
      return cb.apply(this, arguments);
    };
  }
  return origRead.call(fs, p, ...rest);
};

for (const fn of ["existsSync", "statSync", "accessSync"]) {
  const orig = fs[fn];
  if (typeof orig !== "function") continue;
  fs[fn] = function (p, ...rest) {
    if (!isSource(p)) return orig.call(fs, p, ...rest);
    try {
      const r = orig.call(fs, p, ...rest);
      if (fn === "existsSync" && r === false) noteMiss(p);
      return r;
    } catch (e) {
      noteMiss(p);
      throw e;
    }
  };
}

process.on("exit", () => {
  const out = process.env.RGRC_DEPS_OUT;
  if (!out) return;
  try {
    fs.mkdirSync(path.dirname(out), { recursive: true });
    origReadSync; // keep the original referenced; writeFileSync is untouched
    fs.writeFileSync(out, JSON.stringify({
      read: [...read].sort(),
      missed: [...missed].sort(),
    }));
  } catch {}
});
