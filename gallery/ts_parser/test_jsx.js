const m = require('./benchmark/ts_parser_module.cjs');

function testJSX(code) {
  console.log('\n--- Testing:', code, '---');
  const lexer = new m.TSLexer(code);
  const tokens = lexer.tokenize();
  console.log('Tokens:', tokens.map(t => t.value).join(' '));
  
  const parser = new m.TSParserSimple();
  parser.initParser(tokens);
  parser.setTsxMode(true);
  
  const ast = parser.parseExpr();
  console.log('AST nodeType:', ast.nodeType);
  if (ast.left) console.log('  Opening:', ast.left.name, ast.left.nodeType);
  if (ast.right) console.log('  Closing:', ast.right.name, ast.right.nodeType);
  if (ast.children && ast.children.length > 0) {
    console.log('  Children:', ast.children.length);
    ast.children.forEach((c, i) => {
      console.log('    [' + i + ']', c.nodeType, c.value || c.name || '');
    });
  }
  return ast;
}

// Test basic element
testJSX('<div>Hello</div>');

// Test with attributes
testJSX('<button onClick={handleClick}>Click</button>');

// Test self-closing
testJSX('<input type="text" />');

// Test nested
testJSX('<div><span>nested</span></div>');

// Test fragment
testJSX('<><span>in fragment</span></>');

console.log('\nAll JSX tests completed!');
