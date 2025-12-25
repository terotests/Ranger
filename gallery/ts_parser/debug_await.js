const { TSLexer, TSParserSimple } = require('./benchmark/ts_parser_module.cjs');

const code = `async function fn() { const x = condition ? await a : await b; }`;

const lexer = new TSLexer(code);
const tokens = lexer.tokenize();
const parser = new TSParserSimple();
parser.initParser(tokens);
parser.setQuiet(true);
const ast = parser.parseProgram();

// Recursive find
function findNode(node, predicate, depth = 0) {
  if (!node) return null;
  if (predicate(node)) return node;
  
  // Check left, right, body, init, etc.
  for (const key of ['left', 'right', 'body', 'init', 'test', 'consequent', 'alternate']) {
    if (node[key]) {
      const found = findNode(node[key], predicate, depth + 1);
      if (found) return found;
    }
  }
  
  // Check arrays
  for (const key of ['children', 'params']) {
    if (node[key] && Array.isArray(node[key])) {
      for (const child of node[key]) {
        const found = findNode(child, predicate, depth + 1);
        if (found) return found;
      }
    }
  }
  
  return null;
}

// Find conditional expression
const conditional = findNode(ast, n => n.nodeType === 'ConditionalExpression');
console.log('ConditionalExpression found:', !!conditional);
if (conditional) {
  console.log('  consequent nodeType:', conditional.consequent?.nodeType);
  console.log('  alternate nodeType:', conditional.alternate?.nodeType);
}

// Find any await expression
const awaitExpr = findNode(ast, n => n.nodeType === 'AwaitExpression');
console.log('AwaitExpression found:', !!awaitExpr);

// Print AST structure
function printAST(node, indent = 0) {
  if (!node) return;
  const prefix = '  '.repeat(indent);
  console.log(`${prefix}${node.nodeType || 'unknown'} ${node.name || node.value || ''}`);
  
  for (const key of ['left', 'right', 'body', 'init', 'test', 'consequent', 'alternate']) {
    if (node[key]) {
      console.log(`${prefix}  .${key}:`);
      printAST(node[key], indent + 2);
    }
  }
  
  if (node.children && node.children.length > 0) {
    console.log(`${prefix}  .children:`);
    for (const child of node.children) {
      printAST(child, indent + 2);
    }
  }
}

console.log('\n--- AST Structure ---');
printAST(ast);
