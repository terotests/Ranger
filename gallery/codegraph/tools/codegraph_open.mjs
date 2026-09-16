#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later
//
//   node gallery/codegraph/tools/codegraph_open.mjs <path-or-git-url> [--max=N] …
//
// Local paths go straight to codegraph_cli. A Git HTTPS/SSH URL is cloned
// with gallery/pkg (sparse when the URL has no extra path) into a temp dir,
// then the same CLI opens ranger.json / the checkout root.

import { execFileSync } from "node:child_process";
import { mkdtempSync, existsSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "../../..");

const args = process.argv.slice(2);
if (args.length < 1) {
  console.error(
    "usage: codegraph_open.mjs <file.rgr|dir|ranger.json|git-url> [--max=N] [--filter=substr] [--page=id]"
  );
  process.exit(2);
}

function isGitUrl(path) {
  if (!path) return false;
  return (
    path.startsWith("https://") ||
    path.startsWith("http://") ||
    path.startsWith("git://") ||
    path.startsWith("git@")
  );
}

function run(cmd, cmdArgs) {
  execFileSync(cmd, cmdArgs, { cwd: root, stdio: "inherit" });
}

function suite(src, outDir, outJs, extra) {
  run("bash", ["scripts/rgr-suite.sh", src, outDir, outJs, ...extra]);
}

let target = args[0];
const rest = args.slice(1);

try {
  if (isGitUrl(target)) {
    const toolJs = join(root, "gallery/pkg/bin/pkg_tool.js");
    if (existsSync(toolJs) === false) {
      suite("./gallery/pkg/src/pkg_tool.rgr", "./gallery/pkg/bin", "pkg_tool.js", []);
    }
    const out = mkdtempSync(join(tmpdir(), "codegraph-git-"));
    console.log("cloning", target, "->", out);
    run("node", ["gallery/pkg/tools/clone.mjs", target, "HEAD", out]);
    target = out;
    if (existsSync(join(out, "ranger.json")) === false) {
      const names = readdirSync(out);
      const rgr = names.find((n) => n.endsWith(".rgr"));
      if (rgr) {
        target = join(out, rgr);
      }
    }
  }

  suite(
    "./gallery/codegraph/tools/codegraph_cli.rgr",
    "./gallery/codegraph/bin",
    "codegraph_cli.js",
    [target, ...rest]
  );
} catch (err) {
  const status = err && typeof err.status === "number" ? err.status : 1;
  process.exit(status === 0 ? 1 : status);
}
