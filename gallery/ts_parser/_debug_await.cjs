const { TSLexer, TSParserSimple } = require('./benchmark/ts_parser_module.cjs');
const code = 'async function fn() { const x = condition ? await a : await b; }';
const lexer = new TSLexer(code);
const tokens = lexer.tokenize();
const parser = new TSParserSimple();
parser.initParser(tokens);
parser.setQuiet(true);
const ast = parser.parseProgram();

function findNode(node, pred, depth = 0) {
  if (!node) return null;
  if (pred(node)) return node;
  
  // Check children array
  if (node.children) {
    for (const child of node.children) {
      const found = findNode(child, pred, depth + 1);
      if (found) return found;
    }
  }
  
  // Check common child fields
  for (const key of ['left', 'right', 'body', 'init', 'test', 'consequent', 'alternate', 'argument', 'params']) {
    if (node[key]) {
      const found = findNode(node[key], pred, depth + 1);
      if (found) return found;
    }
  }
  
  return null;
}

const awaitNode = findNode(ast, n => n.nodeType === 'AwaitExpression');
console.log('Found AwaitExpression:', awaitNode ? 'yes' : 'no');

// Let's look at the function body
const fnDecl = ast.children[0];
console.log('Function decl:', fnDecl.nodeType);
console.log('Body:', fnDecl.body?.nodeType);
console.log('Body children:', fnDecl.body?.children?.length);

if (fnDecl.body?.children?.length > 0) {
  const varDecl = fnDecl.body.children[0];
  console.log('VarDecl:', varDecl.nodeType);
  console.log('VarDecl init:', varDecl.init?.nodeType);
  if (varDecl.init) {
    console.log('Init (ternary) left:', varDecl.init.left?.nodeType);
    console.log('Init consequent:', varDecl.init.consequent?.nodeType);
    console.log('Init alternate:', varDecl.init.alternate?.nodeType);
  }
}

// Dump full AST for ternary
console.log('\n--- Full AST dump ---');
console.log(JSON.stringify(ast, (key, val) => {
  if (key === 'children' && Array.isArray(val)) {
    return val.length > 0 ? val : undefined;
  }
  if (key === 'params' && Array.isArray(val)) {
    return val.length > 0 ? val : undefined;
  }
  if (key === 'decorators' && Array.isArray(val)) {
    return val.length > 0 ? val : undefined;
  }
  if (val === '' || val === 0 || val === false) return undefined;
  return val;
}, 2));
