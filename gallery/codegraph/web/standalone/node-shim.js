/* SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * Minimal Node globals for the in-tab VirtualCompiler bundle.
 * The compiler is emitted for Node; this page runs it with use_real=false.
 * Load this classic script before codegraph_web.js.
 */
(function () {
  var g = globalThis;
  if (g.__codegraphNodeShim) {
    return;
  }
  g.__codegraphNodeShim = true;

  function normalizePath(p) {
    var parts = String(p).replace(/\\/g, "/").split("/");
    var out = [];
    for (var i = 0; i < parts.length; i++) {
      var part = parts[i];
      if (part === "" || part === ".") {
        continue;
      }
      if (part === "..") {
        out.pop();
        continue;
      }
      out.push(part);
    }
    if (String(p).charAt(0) === "/") {
      return "/" + out.join("/");
    }
    return out.join("/") || ".";
  }

  function dirnamePath(p) {
    var n = normalizePath(p);
    var i = n.lastIndexOf("/");
    if (i <= 0) {
      return "/";
    }
    return n.slice(0, i) || "/";
  }

  var moduleCache = {
    path: {
      normalize: normalizePath,
      dirname: dirnamePath,
      join: function () {
        var parts = [];
        for (var i = 0; i < arguments.length; i++) {
          parts.push(arguments[i]);
        }
        return normalizePath(parts.join("/"));
      }
    },
    fs: {
      existsSync: function () { return false; },
      mkdirSync: function () {},
      writeFileSync: function () {},
      readFile: function (_path, _encoding, cb) {
        cb(null, "");
      }
    },
    // A Shell command (git) in the tab: fails the way a missing program
    // does, so the app can say so instead of throwing from require().
    child_process: {
      spawnSync: function () {
        return { error: new Error("no processes in the browser") };
      }
    },
    crypto: {
      createHash: function () {
        return {
          update: function () {
            return { digest: function () { return "codegraph"; } };
          }
        };
      }
    }
  };

  function shimRequire(id) {
    if (Object.prototype.hasOwnProperty.call(moduleCache, id)) {
      return moduleCache[id];
    }
    throw new Error("codegraph require() not available for: " + id);
  }

  if (typeof g.process === "undefined") {
    g.process = {
      argv: ["node", "rgrc", "codegraph.rgr"],
      env: {},
      cwd: function () { return "/"; },
      stdout: { isTTY: false }
    };
  }
  if (typeof g.require === "undefined") {
    g.require = shimRequire;
  }
  g.module = g.module || { exports: {} };
  g.exports = g.exports || g.module.exports;
  g.__dirname = g.__dirname || "/";
})();
