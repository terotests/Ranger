import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { TSLexer, TSParserSimple } = require("./ts_parser_module.cjs");

function getAllTypes(node, types = [], path = '') {
  if (!node || typeof node !== 'object') return types;
  
  // Check common type property names
  const type = node.type || node.nodeType || node.kind;
  if (type) {
    types.push({ type, path });
  }
  
  // Traverse all properties
  for (const key of Object.keys(node)) {
    const val = node[key];
    if (val && typeof val === 'object') {
      if (Array.isArray(val)) {
        val.forEach((item, i) => getAllTypes(item, types, `${path}.${key}[${i}]`));
      } else {
        getAllTypes(val, types, `${path}.${key}`);
      }
    }
  }
  return types;
}

function printNode(node, indent = 0) {
  if (!node || typeof node !== 'object') return;
  const prefix = '  '.repeat(indent);
  const type = node.type || node.nodeType || node.kind;
  if (type) {
    const name = node.name || node.value || '';
    console.log(`${prefix}${type}${name ? ' (' + name + ')' : ''}`);
    for (const key of Object.keys(node)) {
      if (['type', 'nodeType', 'kind', 'name', 'value'].includes(key)) continue;
      const val = node[key];
      if (val && typeof val === 'object') {
        if (Array.isArray(val) && val.length > 0) {
          console.log(`${prefix}  ${key}:`);
          val.forEach(item => printNode(item, indent + 2));
        } else if (!Array.isArray(val)) {
          console.log(`${prefix}  ${key}:`);
          printNode(val, indent + 2);
        }
      }
    }
  }
}

function testCode(code, name, tsxMode = true) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`${name}`);
  console.log(`Code: ${code}`);
  console.log(`TSX Mode: ${tsxMode}`);
  console.log('='.repeat(60));
  try {
    const lexer = new TSLexer(code);
    const tokens = lexer.tokenize();
    const parser = new TSParserSimple();
    parser.initParser(tokens);
    parser.setQuiet(true);
    if (tsxMode) parser.setTsxMode(true);
    const ast = parser.parseProgram();
    
    console.log("\nAST Structure:");
    printNode(ast);
    
    const allTypes = getAllTypes(ast);
    console.log("\nAll types found:", allTypes.map(t => t.type));
    
    const hasJSX = allTypes.some(t => t.type && t.type.includes("JSX"));
    const hasArrow = allTypes.some(t => t.type === "ArrowFunctionExpression");
    const hasTypeParam = allTypes.some(t => t.type === "TypeParameter" || t.type === "TSTypeParameter");
    
    console.log(`\nResult: JSX=${hasJSX}, Arrow=${hasArrow}, TypeParam=${hasTypeParam}`);
  } catch (e) {
    console.log("Error:", e.message);
  }
}

// Test cases
testCode('const genericFn = <T>() => { return "test"; }', "1. Ambiguous <T> - should be JSX in TSX mode", true);
testCode('const genericFn = <T extends {}>() => { return "test"; }', "2. Generic with extends {} - should be generic", true);
testCode('const genericFn = <T extends unknown>() => { return "test"; }', "3. Generic with extends unknown - should be generic", true);
testCode('const genericFn = <T>() => { return "test"; }', "4. Without TSX mode - should be generic", false);
