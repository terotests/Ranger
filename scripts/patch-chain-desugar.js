#!/usr/bin/env node
/**
 * Bootstrap compiler cannot emit tryDesugarNewMethodChain from .rgr yet.
 * Re-apply the hand-maintained desugar after `npm run compile`.
 */
const fs = require("fs");
const path = require("path");

const outputPath = path.join(__dirname, "..", "bin", "output.js");
let src = fs.readFileSync(outputPath, "utf8");

const stub =
  "  tryDesugarNewMethodChain () {\n    return false;\n  };";

const impl = `  tryDesugarNewMethodChain () {
    const chlen = this.children.length;
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
    return true;
  };`;

if (!src.includes(stub)) {
  if (src.includes("tryDesugarNewMethodChain () {") && src.includes("finalizeAsCallChainRoot();")) {
    process.exit(0);
  }
  console.error("patch-chain-desugar: stub not found in bin/output.js");
  process.exit(1);
}

src = src.replace(stub, impl);
fs.writeFileSync(outputPath, src);
console.log("patch-chain-desugar: applied tryDesugarNewMethodChain");
