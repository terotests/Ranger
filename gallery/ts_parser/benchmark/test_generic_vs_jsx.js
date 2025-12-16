import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { TSLexer, TSParserSimple } = require("./ts_parser_module.cjs");

function testCode(code, name, tsxMode = true) {
  console.log(`\n=== ${name} ===`);
  console.log(`Code: ${code}`);
  console.log(`TSX Mode: ${tsxMode}`);
  try {
    const lexer = new TSLexer(code);
    const tokens = lexer.tokenize();
    const parser = new TSParserSimple();
    parser.initParser(tokens);
    parser.setQuiet(true);
    if (tsxMode) parser.setTsxMode(true);
    const ast = parser.parseProgram();
    
    // Find all node types
    function findTypes(node, types = new Set()) {
      if (!node || typeof node !== 'object') return types;
      if (node.nodeType) types.add(node.nodeType);
      if (node.children) node.children.forEach(c => findTypes(c, types));
      if (node.left) findTypes(node.left, types);
      if (node.right) findTypes(node.right, types);
      if (node.body) findTypes(node.body, types);
      if (node.params) node.params.forEach(p => findTypes(p, types));
      return types;
    }
    console.log("Node types:", [...findTypes(ast)]);
    
    const hasJSX = [...findTypes(ast)].some(t => t.startsWith("JSX"));
    const hasArrow = [...findTypes(ast)].includes("ArrowFunctionExpression");
    const hasTypeParam = [...findTypes(ast)].includes("TypeParameter");
    
    console.log(`Has JSX: ${hasJSX}, Has Arrow: ${hasArrow}, Has TypeParameter: ${hasTypeParam}`);
  } catch (e) {
    console.log("Error:", e.message);
  }
}

// In TSX mode:
// 1. <T>() => {} should be parsed as JSX (and would fail in real TS)
testCode('const genericFn = <T>() => { return "test"; }', "Ambiguous <T> (should be JSX in TSX mode)", true);

// 2. <T extends {}>() => {} should be parsed as generic arrow function
testCode('const genericFn = <T extends {}>() => { return "test"; }', "Generic with extends {} (should be generic)", true);

// 3. <T extends unknown>() => {} should be parsed as generic arrow function  
testCode('const genericFn = <T extends unknown>() => { return "test"; }', "Generic with extends unknown (should be generic)", true);

// 4. Without TSX mode, all should be generics
testCode('const genericFn = <T>() => { return "test"; }', "Without TSX mode (should be generic)", false);
