/**
 * Minimal Node.js globals for the in-browser VirtualCompiler bundle.
 * The compiler is emitted for Node; the playground runs it with use_real=false.
 */
let installed = false;

function normalizePath(p: string): string {
  const parts = p.replace(/\\/g, "/").split("/");
  const out: string[] = [];
  for (const part of parts) {
    if (part === "" || part === ".") {
      continue;
    }
    if (part === "..") {
      out.pop();
      continue;
    }
    out.push(part);
  }
  if (p.startsWith("/")) {
    return "/" + out.join("/");
  }
  return out.join("/") || ".";
}

function dirnamePath(p: string): string {
  const n = normalizePath(p);
  const i = n.lastIndexOf("/");
  if (i <= 0) {
    return "/";
  }
  return n.slice(0, i) || "/";
}

function createPathModule() {
  return {
    normalize: normalizePath,
    dirname: dirnamePath,
    join: (...parts: string[]) => normalizePath(parts.join("/")),
  };
}

function createFsModule() {
  return {
    existsSync: () => false,
    mkdirSync: () => undefined,
    writeFileSync: () => undefined,
    readFile: (
      _path: string,
      _encoding: string,
      cb: (err: Error | null, data?: string) => void,
    ) => {
      cb(null, "");
    },
  };
}

function createCryptoModule() {
  return {
    createHash: () => ({
      update: () => ({
        digest: () => "playground",
      }),
    }),
  };
}

const moduleCache: Record<string, unknown> = {
  path: createPathModule(),
  fs: createFsModule(),
  crypto: createCryptoModule(),
};

function playgroundRequire(id: string): unknown {
  if (id in moduleCache) {
    return moduleCache[id];
  }
  throw new Error(`playground require() not available for: ${id}`);
}

export function installNodeShim(): void {
  if (installed) {
    return;
  }
  installed = true;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const g = globalThis as any;

  if (typeof g.process === "undefined") {
    g.process = {
      argv: ["node", "rgrc", "playground.rgr"],
      env: {},
      cwd: () => "/",
      stdout: { isTTY: false },
    };
  }

  if (typeof g.require === "undefined") {
    g.require = playgroundRequire;
  }

  g.module = g.module ?? { exports: {} };
  g.exports = g.exports ?? g.module.exports;
  g.__dirname = g.__dirname ?? "/";
}

// Install as soon as this module is imported (before ranger-compiler.js loads).
installNodeShim();
