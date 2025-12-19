const { TSLexer, TSParserSimple } = require("./benchmark/ts_parser_module.cjs");
const source = 'function Star({ color = "#gold", size = 40 }) { return 1; }';
const lexer = new TSLexer(source);
const tokens = lexer.tokenize();
const parser = new TSParserSimple();
parser.initParser(tokens);
parser.setQuiet(true);
const prog = parser.parseProgram();
const fn = prog.children[0];
console.log("params count:", fn.params ? fn.params.length : "none");
for (const p of fn.params || []) {
  console.log("param:", p.nodeType, p.name);
  if (p.children) {
    for (const c of p.children) {
      console.log("  child:", c.nodeType, c.name);
      if (c.init) console.log("    init:", c.init.nodeType, c.init.value);
      if (c.left) console.log("    left:", c.left.nodeType, c.left.value);
    }
  }
}
