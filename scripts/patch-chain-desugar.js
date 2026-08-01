#!/usr/bin/env node
/**
 * Bootstrap compiler cannot emit tryDesugarNewMethodChain from .rgr yet.
 * Re-apply the hand-maintained desugar after `npm run compile`.
 *
 * Two artifacts carry the compiler and both need the desugar:
 *   bin/output.js  (CLI, copied to dist/rgrc.js by build:dist:copy)
 *   dist/api.js    (programmatic API, built by build:dist:module via tsc)
 * They differ only in the formatting tsc gives the method, so each target
 * declares the stub it is expected to contain.
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");

const body = `    const chlen = this.children.length;
    if (chlen < 4) return false;
    if (this.getFirst().vref !== "new") return false;
    let first_dot = -1;
    for (let di = 0; di < chlen; di++) {
      const item = this.children[di];
      const dotName = item.children.length > 0 ? item.getFirst().vref : item.vref;
      if (dotName.length > 0 && dotName.charCodeAt(0) === ".".charCodeAt(0)) {
        first_dot = di;
        break;
      }
    }
    if (first_dot < 2) return false;
    const recv = this.copy();
    while (recv.children.length > first_dot) {
      recv.children.pop();
    }
    let innerNode = recv;
    for (let i = first_dot; i < chlen - 1; i += 2) {
      const item = this.children[i];
      const dotName2 = item.children.length > 0 ? item.getFirst().vref : item.vref;
      if (dotName2.length === 0 || dotName2.charCodeAt(0) !== ".".charCodeAt(0)) return false;
      const method_name = dotName2.substring(1);
      let mArgs = this.newExpressionNode();
      if (item.children.length > 1) {
        mArgs = item.getSecond();
      } else {
        mArgs = this.children[i + 1];
      }
      const newNode = this.newExpressionNode();
      newNode.add(this.newVRefNode("call"));
      newNode.add(innerNode.copy());
      newNode.add(this.newVRefNode(method_name));
      newNode.add(mArgs.copy());
      innerNode = newNode;
      item.is_part_of_chain = true;
      if (item.children.length <= 1) {
        this.children[i + 1].is_part_of_chain = true;
      }
    }
    this.getChildrenFrom(innerNode);
    this.finalizeAsCallChainRoot();
    return true;`;

const targets = [
  {
    file: "bin/output.js",
    required: true,
    stub: "  tryDesugarNewMethodChain () {\n    return false;\n  };",
    impl: `  tryDesugarNewMethodChain () {\n${body}\n  };`,
    marker: "tryDesugarNewMethodChain () {",
  },
  {
    // Only present after build:dist:module; skipped otherwise.
    file: "dist/api.js",
    required: false,
    stub: "    tryDesugarNewMethodChain() {\n        return false;\n    }",
    impl: `    tryDesugarNewMethodChain() {\n${body}\n    }`,
    marker: "tryDesugarNewMethodChain() {",
  },
];

let failed = false;

for (const target of targets) {
  const targetPath = path.join(ROOT, target.file);

  if (!fs.existsSync(targetPath)) {
    if (target.required) {
      console.error(`patch-chain-desugar: missing ${target.file}`);
      failed = true;
    }
    continue;
  }

  const src = fs.readFileSync(targetPath, "utf8");

  if (!src.includes(target.stub)) {
    // Already patched is fine; anything else means the emitted shape moved.
    if (src.includes(target.marker) && src.includes("finalizeAsCallChainRoot();")) {
      continue;
    }
    console.error(`patch-chain-desugar: stub not found in ${target.file}`);
    failed = true;
    continue;
  }

  fs.writeFileSync(targetPath, src.replace(target.stub, target.impl));
  console.log(`patch-chain-desugar: applied tryDesugarNewMethodChain to ${target.file}`);
}

process.exit(failed ? 1 : 0);
