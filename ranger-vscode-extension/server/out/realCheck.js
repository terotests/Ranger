"use strict";
/**
 * Diagnostics from the real compiler.
 *
 * The in-memory analyzer runs an old embedded compiler on one file, so it
 * cannot follow `Import` or know newer forms (tree literals, components).
 * This runs the Ranger checkout's own `dist/rgrc.js` on the file as saved, in
 * its directory, exactly as a build would, and turns its messages into
 * diagnostics, including the ones that land in imported files.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.findRangerRoot = findRangerRoot;
exports.parseCompilerOutput = parseCompilerOutput;
exports.runRealCheck = runRealCheck;
const fs = __importStar(require("fs"));
const os = __importStar(require("os"));
const path = __importStar(require("path"));
const child_process_1 = require("child_process");
const projectIndex_1 = require("./projectIndex");
/** The Ranger checkout for a file: the nearest directory with dist/rgrc.js. */
function findRangerRoot(file, fallbacks = []) {
    let d = path.dirname(path.resolve(file));
    for (;;) {
        if (fs.existsSync(path.join(d, "dist", "rgrc.js")))
            return d;
        const up = path.dirname(d);
        if (up === d)
            break;
        d = up;
    }
    for (const f of fallbacks) {
        if (f && fs.existsSync(path.join(f, "dist", "rgrc.js")))
            return f;
    }
    return null;
}
/**
 * The compiler's messages. Each one is a `path:line:col` line followed by a
 * `[FAIL] text` (or `[WARN] text`) line and a source excerpt.
 */
function parseCompilerOutput(out) {
    const clean = out.replace(/\x1b\[[0-9;]*m/g, "");
    const lines = clean.split(/\r?\n/);
    const msgs = [];
    for (let i = 0; i < lines.length; i++) {
        const at = /^(\S.*\.(?:rgr|ranger)):(\d+):(\d+)\s*$/.exec(lines[i]);
        if (!at)
            continue;
        for (let j = i + 1; j < Math.min(lines.length, i + 4); j++) {
            const m = /^\s*\[(FAIL|WARN|ERROR)\]\s*(.*)$/.exec(lines[j]);
            if (m) {
                msgs.push({
                    file: at[1],
                    line: Math.max(0, Number(at[2]) - 1),
                    column: Math.max(0, Number(at[3])),
                    message: m[2].trim(),
                    severity: m[1] === "WARN" ? "warning" : "error",
                });
                break;
            }
        }
    }
    return msgs;
}
/** Compile `file` with the checkout's compiler and group the messages by file. */
function runRealCheck(file, root, timeoutMs = 60000) {
    const abs = path.resolve(file);
    const outDir = fs.mkdtempSync(path.join(os.tmpdir(), "ranger-lsp-"));
    return new Promise((resolve) => {
        const p = (0, child_process_1.spawn)(process.execPath, [path.join(root, "dist", "rgrc.js"), "-es6", "-nodemodule", abs, `-d=${outDir}`, "-o=check.cjs"], { cwd: root, stdio: ["ignore", "pipe", "pipe"] });
        let out = "";
        p.stdout.on("data", (d) => (out += d));
        p.stderr.on("data", (d) => (out += d));
        const timer = setTimeout(() => p.kill(), timeoutMs);
        p.on("close", () => {
            clearTimeout(timer);
            fs.rmSync(outDir, { recursive: true, force: true });
            const index = new projectIndex_1.ProjectIndex(abs);
            const byFile = new Map();
            byFile.set(abs, []);
            for (const m of parseCompilerOutput(out)) {
                const f = index.fileFor(m.file, abs) || abs;
                // A message in a file we cannot find is shown on the saved file's
                // first line, with the path, rather than dropped.
                const msg = f === abs && !sameFile(m.file, abs, index) ? { ...m, line: 0, column: 0, message: `${m.file}:${m.line + 1}: ${m.message}` } : m;
                if (!byFile.has(f))
                    byFile.set(f, []);
                byFile.get(f).push(msg);
            }
            resolve([...byFile].map(([f, messages]) => ({ file: f, messages })));
        });
    });
}
function sameFile(reported, abs, index) {
    return index.fileFor(reported, abs) === abs;
}
//# sourceMappingURL=realCheck.js.map