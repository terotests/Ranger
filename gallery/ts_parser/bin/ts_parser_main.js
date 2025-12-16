#!/usr/bin/env node
class Token  {
  constructor() {
    this.tokenType = "";
    this.value = "";
    this.line = 0;
    this.col = 0;
    this.start = 0;
    this.end = 0;
  }
}
class TSLexer  {
  constructor(src) {
    this.source = "";
    this.pos = 0;
    this.line = 1;
    this.col = 1;
    this.__len = 0;
    this.source = src;
    this.__len = src.length;
  }
  peek () {
    if ( this.pos >= this.__len ) {
      return "";
    }
    return this.source[this.pos];
  };
  peekAt (offset) {
    const idx = this.pos + offset;
    if ( idx >= this.__len ) {
      return "";
    }
    return this.source[idx];
  };
  advance () {
    if ( this.pos >= this.__len ) {
      return "";
    }
    const ch = this.source[this.pos];
    this.pos = this.pos + 1;
    if ( (ch == "\n") || (ch == "\r\n") ) {
      this.line = this.line + 1;
      this.col = 1;
    } else {
      this.col = this.col + 1;
    }
    return ch;
  };
  isDigit (ch) {
    if ( ch == "0" ) {
      return true;
    }
    if ( ch == "1" ) {
      return true;
    }
    if ( ch == "2" ) {
      return true;
    }
    if ( ch == "3" ) {
      return true;
    }
    if ( ch == "4" ) {
      return true;
    }
    if ( ch == "5" ) {
      return true;
    }
    if ( ch == "6" ) {
      return true;
    }
    if ( ch == "7" ) {
      return true;
    }
    if ( ch == "8" ) {
      return true;
    }
    if ( ch == "9" ) {
      return true;
    }
    return false;
  };
  isAlpha (ch) {
    if ( (ch.length) == 0 ) {
      return false;
    }
    const code = this.source.charCodeAt(this.pos );
    if ( code >= 97 ) {
      if ( code <= 122 ) {
        return true;
      }
    }
    if ( code >= 65 ) {
      if ( code <= 90 ) {
        return true;
      }
    }
    if ( ch == "_" ) {
      return true;
    }
    if ( ch == "$" ) {
      return true;
    }
    return false;
  };
  isAlphaNumCh (ch) {
    if ( this.isDigit(ch) ) {
      return true;
    }
    if ( ch == "_" ) {
      return true;
    }
    if ( ch == "$" ) {
      return true;
    }
    if ( (ch.length) == 0 ) {
      return false;
    }
    const code = this.source.charCodeAt(this.pos );
    if ( code >= 97 ) {
      if ( code <= 122 ) {
        return true;
      }
    }
    if ( code >= 65 ) {
      if ( code <= 90 ) {
        return true;
      }
    }
    return false;
  };
  isWhitespace (ch) {
    if ( ch == " " ) {
      return true;
    }
    if ( ch == "\t" ) {
      return true;
    }
    if ( ch == "\n" ) {
      return true;
    }
    if ( ch == "\r" ) {
      return true;
    }
    if ( ch == "\r\n" ) {
      return true;
    }
    return false;
  };
  skipWhitespace () {
    while (this.pos < this.__len) {
      const ch = this.peek();
      if ( this.isWhitespace(ch) ) {
        this.advance();
      } else {
        return;
      }
    };
  };
  makeToken (tokType, value, startPos, startLine, startCol) {
    const tok = new Token();
    tok.tokenType = tokType;
    tok.value = value;
    tok.start = startPos;
    tok.end = this.pos;
    tok.line = startLine;
    tok.col = startCol;
    return tok;
  };
  readLineComment () {
    const startPos = this.pos;
    const startLine = this.line;
    const startCol = this.col;
    this.advance();
    this.advance();
    let value = "";
    while (this.pos < this.__len) {
      const ch = this.peek();
      if ( ch == "\n" ) {
        return this.makeToken("LineComment", value, startPos, startLine, startCol);
      }
      if ( ch == "\r\n" ) {
        return this.makeToken("LineComment", value, startPos, startLine, startCol);
      }
      value = value + this.advance();
    };
    return this.makeToken("LineComment", value, startPos, startLine, startCol);
  };
  readBlockComment () {
    const startPos = this.pos;
    const startLine = this.line;
    const startCol = this.col;
    this.advance();
    this.advance();
    let value = "";
    while (this.pos < this.__len) {
      const ch = this.peek();
      if ( ch == "*" ) {
        if ( this.peekAt(1) == "/" ) {
          this.advance();
          this.advance();
          return this.makeToken("BlockComment", value, startPos, startLine, startCol);
        }
      }
      value = value + this.advance();
    };
    return this.makeToken("BlockComment", value, startPos, startLine, startCol);
  };
  readString (quote) {
    const startPos = this.pos;
    const startLine = this.line;
    const startCol = this.col;
    this.advance();
    let value = "";
    while (this.pos < this.__len) {
      const ch = this.peek();
      if ( ch == quote ) {
        this.advance();
        return this.makeToken("String", value, startPos, startLine, startCol);
      }
      if ( ch == "\\" ) {
        this.advance();
        const esc = this.advance();
        if ( esc == "n" ) {
          value = value + "\n";
        } else {
          if ( esc == "t" ) {
            value = value + "\t";
          } else {
            if ( esc == "r" ) {
              value = value + "\r";
            } else {
              if ( esc == "\\" ) {
                value = value + "\\";
              } else {
                if ( esc == quote ) {
                  value = value + quote;
                } else {
                  value = value + esc;
                }
              }
            }
          }
        }
      } else {
        value = value + this.advance();
      }
    };
    return this.makeToken("String", value, startPos, startLine, startCol);
  };
  readNumber () {
    const startPos = this.pos;
    const startLine = this.line;
    const startCol = this.col;
    let value = "";
    while (this.pos < this.__len) {
      const ch = this.peek();
      if ( this.isDigit(ch) ) {
        value = value + this.advance();
      } else {
        if ( ch == "." ) {
          value = value + this.advance();
        } else {
          return this.makeToken("Number", value, startPos, startLine, startCol);
        }
      }
    };
    return this.makeToken("Number", value, startPos, startLine, startCol);
  };
  readIdentifier () {
    const startPos = this.pos;
    const startLine = this.line;
    const startCol = this.col;
    let value = "";
    while (this.pos < this.__len) {
      const ch = this.peek();
      if ( this.isAlphaNumCh(ch) ) {
        value = value + this.advance();
      } else {
        return this.makeToken(this.identType(value), value, startPos, startLine, startCol);
      }
    };
    return this.makeToken(this.identType(value), value, startPos, startLine, startCol);
  };
  identType (value) {
    if ( value == "var" ) {
      return "Keyword";
    }
    if ( value == "let" ) {
      return "Keyword";
    }
    if ( value == "const" ) {
      return "Keyword";
    }
    if ( value == "function" ) {
      return "Keyword";
    }
    if ( value == "return" ) {
      return "Keyword";
    }
    if ( value == "if" ) {
      return "Keyword";
    }
    if ( value == "else" ) {
      return "Keyword";
    }
    if ( value == "while" ) {
      return "Keyword";
    }
    if ( value == "for" ) {
      return "Keyword";
    }
    if ( value == "in" ) {
      return "Keyword";
    }
    if ( value == "of" ) {
      return "Keyword";
    }
    if ( value == "switch" ) {
      return "Keyword";
    }
    if ( value == "case" ) {
      return "Keyword";
    }
    if ( value == "default" ) {
      return "Keyword";
    }
    if ( value == "break" ) {
      return "Keyword";
    }
    if ( value == "continue" ) {
      return "Keyword";
    }
    if ( value == "try" ) {
      return "Keyword";
    }
    if ( value == "catch" ) {
      return "Keyword";
    }
    if ( value == "finally" ) {
      return "Keyword";
    }
    if ( value == "throw" ) {
      return "Keyword";
    }
    if ( value == "new" ) {
      return "Keyword";
    }
    if ( value == "typeof" ) {
      return "Keyword";
    }
    if ( value == "instanceof" ) {
      return "Keyword";
    }
    if ( value == "this" ) {
      return "Keyword";
    }
    if ( value == "class" ) {
      return "Keyword";
    }
    if ( value == "extends" ) {
      return "Keyword";
    }
    if ( value == "static" ) {
      return "Keyword";
    }
    if ( value == "get" ) {
      return "Keyword";
    }
    if ( value == "set" ) {
      return "Keyword";
    }
    if ( value == "super" ) {
      return "Keyword";
    }
    if ( value == "async" ) {
      return "Keyword";
    }
    if ( value == "await" ) {
      return "Keyword";
    }
    if ( value == "yield" ) {
      return "Keyword";
    }
    if ( value == "import" ) {
      return "Keyword";
    }
    if ( value == "export" ) {
      return "Keyword";
    }
    if ( value == "from" ) {
      return "Keyword";
    }
    if ( value == "as" ) {
      return "Keyword";
    }
    if ( value == "delete" ) {
      return "Keyword";
    }
    if ( value == "void" ) {
      return "Keyword";
    }
    if ( value == "type" ) {
      return "TSKeyword";
    }
    if ( value == "interface" ) {
      return "TSKeyword";
    }
    if ( value == "namespace" ) {
      return "TSKeyword";
    }
    if ( value == "module" ) {
      return "TSKeyword";
    }
    if ( value == "declare" ) {
      return "TSKeyword";
    }
    if ( value == "readonly" ) {
      return "TSKeyword";
    }
    if ( value == "abstract" ) {
      return "TSKeyword";
    }
    if ( value == "implements" ) {
      return "TSKeyword";
    }
    if ( value == "private" ) {
      return "TSKeyword";
    }
    if ( value == "protected" ) {
      return "TSKeyword";
    }
    if ( value == "public" ) {
      return "TSKeyword";
    }
    if ( value == "override" ) {
      return "TSKeyword";
    }
    if ( value == "is" ) {
      return "TSKeyword";
    }
    if ( value == "keyof" ) {
      return "TSKeyword";
    }
    if ( value == "infer" ) {
      return "TSKeyword";
    }
    if ( value == "asserts" ) {
      return "TSKeyword";
    }
    if ( value == "satisfies" ) {
      return "TSKeyword";
    }
    if ( value == "string" ) {
      return "TSType";
    }
    if ( value == "number" ) {
      return "TSType";
    }
    if ( value == "boolean" ) {
      return "TSType";
    }
    if ( value == "any" ) {
      return "TSType";
    }
    if ( value == "unknown" ) {
      return "TSType";
    }
    if ( value == "never" ) {
      return "TSType";
    }
    if ( value == "undefined" ) {
      return "TSType";
    }
    if ( value == "object" ) {
      return "TSType";
    }
    if ( value == "symbol" ) {
      return "TSType";
    }
    if ( value == "bigint" ) {
      return "TSType";
    }
    if ( value == "true" ) {
      return "Boolean";
    }
    if ( value == "false" ) {
      return "Boolean";
    }
    if ( value == "null" ) {
      return "Null";
    }
    return "Identifier";
  };
  nextToken () {
    this.skipWhitespace();
    if ( this.pos >= this.__len ) {
      return this.makeToken("EOF", "", this.pos, this.line, this.col);
    }
    const ch = this.peek();
    const startPos = this.pos;
    const startLine = this.line;
    const startCol = this.col;
    if ( ch == "/" ) {
      const next = this.peekAt(1);
      if ( next == "/" ) {
        return this.readLineComment();
      }
      if ( next == "*" ) {
        return this.readBlockComment();
      }
    }
    if ( ch == "\"" ) {
      return this.readString("\"");
    }
    if ( ch == "'" ) {
      return this.readString("'");
    }
    if ( this.isDigit(ch) ) {
      return this.readNumber();
    }
    if ( this.isAlpha(ch) ) {
      return this.readIdentifier();
    }
    const next_1 = this.peekAt(1);
    if ( ch == "=" ) {
      if ( next_1 == "=" ) {
        if ( this.peekAt(2) == "=" ) {
          this.advance();
          this.advance();
          this.advance();
          return this.makeToken("Punctuator", "===", startPos, startLine, startCol);
        }
      }
    }
    if ( ch == "!" ) {
      if ( next_1 == "=" ) {
        if ( this.peekAt(2) == "=" ) {
          this.advance();
          this.advance();
          this.advance();
          return this.makeToken("Punctuator", "!==", startPos, startLine, startCol);
        }
      }
    }
    if ( ch == "=" ) {
      if ( next_1 == ">" ) {
        this.advance();
        this.advance();
        return this.makeToken("Punctuator", "=>", startPos, startLine, startCol);
      }
    }
    if ( ch == "=" ) {
      if ( next_1 == "=" ) {
        this.advance();
        this.advance();
        return this.makeToken("Punctuator", "==", startPos, startLine, startCol);
      }
    }
    if ( ch == "!" ) {
      if ( next_1 == "=" ) {
        this.advance();
        this.advance();
        return this.makeToken("Punctuator", "!=", startPos, startLine, startCol);
      }
    }
    if ( ch == "<" ) {
      if ( next_1 == "=" ) {
        this.advance();
        this.advance();
        return this.makeToken("Punctuator", "<=", startPos, startLine, startCol);
      }
    }
    if ( ch == ">" ) {
      if ( next_1 == "=" ) {
        this.advance();
        this.advance();
        return this.makeToken("Punctuator", ">=", startPos, startLine, startCol);
      }
    }
    if ( ch == "&" ) {
      if ( next_1 == "&" ) {
        this.advance();
        this.advance();
        return this.makeToken("Punctuator", "&&", startPos, startLine, startCol);
      }
    }
    if ( ch == "|" ) {
      if ( next_1 == "|" ) {
        this.advance();
        this.advance();
        return this.makeToken("Punctuator", "||", startPos, startLine, startCol);
      }
    }
    if ( ch == "?" ) {
      if ( next_1 == "?" ) {
        this.advance();
        this.advance();
        return this.makeToken("Punctuator", "??", startPos, startLine, startCol);
      }
      if ( next_1 == "." ) {
        this.advance();
        this.advance();
        return this.makeToken("Punctuator", "?.", startPos, startLine, startCol);
      }
    }
    if ( ch == "+" ) {
      if ( next_1 == "+" ) {
        this.advance();
        this.advance();
        return this.makeToken("Punctuator", "++", startPos, startLine, startCol);
      }
    }
    if ( ch == "-" ) {
      if ( next_1 == "-" ) {
        this.advance();
        this.advance();
        return this.makeToken("Punctuator", "--", startPos, startLine, startCol);
      }
    }
    if ( ch == "." ) {
      if ( next_1 == "." ) {
        if ( this.peekAt(2) == "." ) {
          this.advance();
          this.advance();
          this.advance();
          return this.makeToken("Punctuator", "...", startPos, startLine, startCol);
        }
      }
    }
    this.advance();
    return this.makeToken("Punctuator", ch, startPos, startLine, startCol);
  };
  tokenize () {
    let tokens = [];
    while (true) {
      const tok = this.nextToken();
      tokens.push(tok);
      if ( tok.tokenType == "EOF" ) {
        return tokens;
      }
    };
    return tokens;
  };
}
class TSNode  {
  constructor() {
    this.nodeType = "";
    this.start = 0;
    this.end = 0;
    this.line = 0;
    this.col = 0;
    this.name = "";
    this.value = "";
    this.kind = "";
    this.optional = false;
    this.readonly = false;
    this.children = [];
    this.params = [];
  }
}
class TSParserSimple  {
  constructor() {
    this.tokens = [];
    this.pos = 0;
    this.quiet = false;
  }
  initParser (toks) {
    this.tokens = toks;
    this.pos = 0;
    this.quiet = false;
    if ( (toks.length) > 0 ) {
      this.currentToken = toks[0];
    }
  };
  setQuiet (q) {
    this.quiet = q;
  };
  peek () {
    return this.currentToken;
  };
  peekType () {
    if ( typeof(this.currentToken) === "undefined" ) {
      return "EOF";
    }
    const tok = this.currentToken;
    return tok.tokenType;
  };
  peekValue () {
    if ( typeof(this.currentToken) === "undefined" ) {
      return "";
    }
    const tok = this.currentToken;
    return tok.value;
  };
  advance () {
    this.pos = this.pos + 1;
    if ( this.pos < (this.tokens.length) ) {
      this.currentToken = this.tokens[this.pos];
    } else {
      const eof = new Token();
      eof.tokenType = "EOF";
      eof.value = "";
      this.currentToken = eof;
    }
  };
  expect (expectedType) {
    const tok = this.peek();
    if ( tok.tokenType != expectedType ) {
      if ( this.quiet == false ) {
        console.log((("Parse error: expected " + expectedType) + " but got ") + tok.tokenType);
      }
    }
    this.advance();
    return tok;
  };
  expectValue (expectedValue) {
    const tok = this.peek();
    if ( tok.value != expectedValue ) {
      if ( this.quiet == false ) {
        console.log(((("Parse error: expected '" + expectedValue) + "' but got '") + tok.value) + "'");
      }
    }
    this.advance();
    return tok;
  };
  isAtEnd () {
    const t = this.peekType();
    return t == "EOF";
  };
  matchType (tokenType) {
    const t = this.peekType();
    return t == tokenType;
  };
  matchValue (value) {
    const v = this.peekValue();
    return v == value;
  };
  parseProgram () {
    const prog = new TSNode();
    prog.nodeType = "Program";
    while (this.isAtEnd() == false) {
      const stmt = this.parseStatement();
      prog.children.push(stmt);
    };
    return prog;
  };
  parseStatement () {
    const tokVal = this.peekValue();
    if ( tokVal == "interface" ) {
      return this.parseInterface();
    }
    if ( tokVal == "type" ) {
      return this.parseTypeAlias();
    }
    if ( (tokVal == "let") || (tokVal == "const") ) {
      return this.parseVarDecl();
    }
    if ( tokVal == "function" ) {
      return this.parseFuncDecl();
    }
    if ( tokVal == "return" ) {
      return this.parseReturn();
    }
    if ( tokVal == "{" ) {
      return this.parseBlock();
    }
    if ( tokVal == ";" ) {
      this.advance();
      const empty = new TSNode();
      empty.nodeType = "EmptyStatement";
      return empty;
    }
    return this.parseExprStmt();
  };
  parseReturn () {
    const node = new TSNode();
    node.nodeType = "ReturnStatement";
    const startTok = this.peek();
    node.start = startTok.start;
    node.line = startTok.line;
    node.col = startTok.col;
    this.expectValue("return");
    const v = this.peekValue();
    if ( (v != ";") && (this.isAtEnd() == false) ) {
      const arg = this.parseExpr();
      node.left = arg;
    }
    if ( this.matchValue(";") ) {
      this.advance();
    }
    return node;
  };
  parseInterface () {
    const node = new TSNode();
    node.nodeType = "TSInterfaceDeclaration";
    const startTok = this.peek();
    node.start = startTok.start;
    node.line = startTok.line;
    node.col = startTok.col;
    this.expectValue("interface");
    const nameTok = this.expect("Identifier");
    node.name = nameTok.value;
    const body = this.parseInterfaceBody();
    node.body = body;
    return node;
  };
  parseInterfaceBody () {
    const body = new TSNode();
    body.nodeType = "TSInterfaceBody";
    const startTok = this.peek();
    body.start = startTok.start;
    body.line = startTok.line;
    body.col = startTok.col;
    this.expectValue("{");
    while ((this.matchValue("}") == false) && (this.isAtEnd() == false)) {
      const prop = this.parsePropertySig();
      body.children.push(prop);
      if ( this.matchValue(";") || this.matchValue(",") ) {
        this.advance();
      }
    };
    this.expectValue("}");
    return body;
  };
  parsePropertySig () {
    const prop = new TSNode();
    prop.nodeType = "TSPropertySignature";
    const startTok = this.peek();
    prop.start = startTok.start;
    prop.line = startTok.line;
    prop.col = startTok.col;
    if ( this.matchValue("readonly") ) {
      prop.readonly = true;
      this.advance();
    }
    const nameTok = this.expect("Identifier");
    prop.name = nameTok.value;
    if ( this.matchValue("?") ) {
      prop.optional = true;
      this.advance();
    }
    if ( this.matchValue(":") ) {
      const typeAnnot = this.parseTypeAnnotation();
      prop.typeAnnotation = typeAnnot;
    }
    return prop;
  };
  parseTypeAlias () {
    const node = new TSNode();
    node.nodeType = "TSTypeAliasDeclaration";
    const startTok = this.peek();
    node.start = startTok.start;
    node.line = startTok.line;
    node.col = startTok.col;
    this.expectValue("type");
    const nameTok = this.expect("Identifier");
    node.name = nameTok.value;
    this.expectValue("=");
    const typeExpr = this.parseType();
    node.typeAnnotation = typeExpr;
    if ( this.matchValue(";") ) {
      this.advance();
    }
    return node;
  };
  parseVarDecl () {
    const node = new TSNode();
    node.nodeType = "VariableDeclaration";
    const startTok = this.peek();
    node.start = startTok.start;
    node.line = startTok.line;
    node.col = startTok.col;
    node.kind = startTok.value;
    this.advance();
    const declarator = new TSNode();
    declarator.nodeType = "VariableDeclarator";
    const nameTok = this.expect("Identifier");
    declarator.name = nameTok.value;
    declarator.start = nameTok.start;
    declarator.line = nameTok.line;
    declarator.col = nameTok.col;
    if ( this.matchValue(":") ) {
      const typeAnnot = this.parseTypeAnnotation();
      declarator.typeAnnotation = typeAnnot;
    }
    if ( this.matchValue("=") ) {
      this.advance();
      const initExpr = this.parseExpr();
      declarator.init = initExpr;
    }
    node.children.push(declarator);
    if ( this.matchValue(";") ) {
      this.advance();
    }
    return node;
  };
  parseFuncDecl () {
    const node = new TSNode();
    node.nodeType = "FunctionDeclaration";
    const startTok = this.peek();
    node.start = startTok.start;
    node.line = startTok.line;
    node.col = startTok.col;
    this.expectValue("function");
    const nameTok = this.expect("Identifier");
    node.name = nameTok.value;
    this.expectValue("(");
    while (this.matchValue(")") == false) {
      if ( (node.params.length) > 0 ) {
        this.expectValue(",");
      }
      const param = this.parseParam();
      node.params.push(param);
    };
    this.expectValue(")");
    if ( this.matchValue(":") ) {
      const returnType = this.parseTypeAnnotation();
      node.typeAnnotation = returnType;
    }
    const body = this.parseBlock();
    node.body = body;
    return node;
  };
  parseParam () {
    const param = new TSNode();
    param.nodeType = "Parameter";
    const nameTok = this.expect("Identifier");
    param.name = nameTok.value;
    param.start = nameTok.start;
    param.line = nameTok.line;
    param.col = nameTok.col;
    if ( this.matchValue("?") ) {
      param.optional = true;
      this.advance();
    }
    if ( this.matchValue(":") ) {
      const typeAnnot = this.parseTypeAnnotation();
      param.typeAnnotation = typeAnnot;
    }
    return param;
  };
  parseBlock () {
    const block = new TSNode();
    block.nodeType = "BlockStatement";
    const startTok = this.peek();
    block.start = startTok.start;
    block.line = startTok.line;
    block.col = startTok.col;
    this.expectValue("{");
    while ((this.matchValue("}") == false) && (this.isAtEnd() == false)) {
      const stmt = this.parseStatement();
      block.children.push(stmt);
    };
    this.expectValue("}");
    return block;
  };
  parseExprStmt () {
    const stmt = new TSNode();
    stmt.nodeType = "ExpressionStatement";
    const startTok = this.peek();
    stmt.start = startTok.start;
    stmt.line = startTok.line;
    stmt.col = startTok.col;
    const expr = this.parseExpr();
    stmt.left = expr;
    if ( this.matchValue(";") ) {
      this.advance();
    }
    return stmt;
  };
  parseTypeAnnotation () {
    const annot = new TSNode();
    annot.nodeType = "TSTypeAnnotation";
    const startTok = this.peek();
    annot.start = startTok.start;
    annot.line = startTok.line;
    annot.col = startTok.col;
    this.expectValue(":");
    const typeExpr = this.parseType();
    annot.typeAnnotation = typeExpr;
    return annot;
  };
  parseType () {
    return this.parseUnionType();
  };
  parseUnionType () {
    const left = this.parseArrayType();
    if ( this.matchValue("|") ) {
      const union = new TSNode();
      union.nodeType = "TSUnionType";
      union.start = left.start;
      union.line = left.line;
      union.col = left.col;
      union.children.push(left);
      while (this.matchValue("|")) {
        this.advance();
        const right = this.parseArrayType();
        union.children.push(right);
      };
      return union;
    }
    return left;
  };
  parseArrayType () {
    let elemType = this.parsePrimaryType();
    while (this.matchValue("[") && this.checkNext("]")) {
      this.advance();
      this.advance();
      const arrayType = new TSNode();
      arrayType.nodeType = "TSArrayType";
      arrayType.start = elemType.start;
      arrayType.line = elemType.line;
      arrayType.col = elemType.col;
      arrayType.left = elemType;
      elemType = arrayType;
    };
    return elemType;
  };
  checkNext (value) {
    const nextPos = this.pos + 1;
    if ( nextPos < (this.tokens.length) ) {
      const nextTok = this.tokens[nextPos];
      const v = nextTok.value;
      return v == value;
    }
    return false;
  };
  parsePrimaryType () {
    const tokVal = this.peekValue();
    const tok = this.peek();
    if ( tokVal == "string" ) {
      this.advance();
      const node = new TSNode();
      node.nodeType = "TSStringKeyword";
      node.start = tok.start;
      node.end = tok.end;
      node.line = tok.line;
      node.col = tok.col;
      return node;
    }
    if ( tokVal == "number" ) {
      this.advance();
      const node_1 = new TSNode();
      node_1.nodeType = "TSNumberKeyword";
      node_1.start = tok.start;
      node_1.end = tok.end;
      node_1.line = tok.line;
      node_1.col = tok.col;
      return node_1;
    }
    if ( tokVal == "boolean" ) {
      this.advance();
      const node_2 = new TSNode();
      node_2.nodeType = "TSBooleanKeyword";
      node_2.start = tok.start;
      node_2.end = tok.end;
      node_2.line = tok.line;
      node_2.col = tok.col;
      return node_2;
    }
    if ( tokVal == "any" ) {
      this.advance();
      const node_3 = new TSNode();
      node_3.nodeType = "TSAnyKeyword";
      node_3.start = tok.start;
      node_3.end = tok.end;
      node_3.line = tok.line;
      node_3.col = tok.col;
      return node_3;
    }
    if ( tokVal == "unknown" ) {
      this.advance();
      const node_4 = new TSNode();
      node_4.nodeType = "TSUnknownKeyword";
      node_4.start = tok.start;
      node_4.end = tok.end;
      node_4.line = tok.line;
      node_4.col = tok.col;
      return node_4;
    }
    if ( tokVal == "void" ) {
      this.advance();
      const node_5 = new TSNode();
      node_5.nodeType = "TSVoidKeyword";
      node_5.start = tok.start;
      node_5.end = tok.end;
      node_5.line = tok.line;
      node_5.col = tok.col;
      return node_5;
    }
    if ( tokVal == "null" ) {
      this.advance();
      const node_6 = new TSNode();
      node_6.nodeType = "TSNullKeyword";
      node_6.start = tok.start;
      node_6.end = tok.end;
      node_6.line = tok.line;
      node_6.col = tok.col;
      return node_6;
    }
    const tokType = this.peekType();
    if ( tokType == "Identifier" ) {
      return this.parseTypeRef();
    }
    if ( tokVal == "(" ) {
      this.advance();
      const innerType = this.parseType();
      this.expectValue(")");
      return innerType;
    }
    if ( this.quiet == false ) {
      console.log("Unknown type: " + tokVal);
    }
    this.advance();
    const errNode = new TSNode();
    errNode.nodeType = "TSAnyKeyword";
    return errNode;
  };
  parseTypeRef () {
    const ref = new TSNode();
    ref.nodeType = "TSTypeReference";
    const tok = this.peek();
    ref.start = tok.start;
    ref.line = tok.line;
    ref.col = tok.col;
    const nameTok = this.expect("Identifier");
    ref.name = nameTok.value;
    if ( this.matchValue("<") ) {
      this.advance();
      while (this.matchValue(">") == false) {
        if ( (ref.params.length) > 0 ) {
          this.expectValue(",");
        }
        const typeArg = this.parseType();
        ref.params.push(typeArg);
      };
      this.expectValue(">");
    }
    return ref;
  };
  parseExpr () {
    return this.parseAssign();
  };
  parseAssign () {
    const left = this.parseBinary();
    if ( this.matchValue("=") ) {
      this.advance();
      const right = this.parseAssign();
      const assign = new TSNode();
      assign.nodeType = "AssignmentExpression";
      assign.value = "=";
      assign.left = left;
      assign.right = right;
      assign.start = left.start;
      assign.line = left.line;
      assign.col = left.col;
      return assign;
    }
    return left;
  };
  parseBinary () {
    let left = this.parseUnary();
    let tokVal = this.peekValue();
    while ((((((((tokVal == "+") || (tokVal == "-")) || (tokVal == "*")) || (tokVal == "/")) || (tokVal == "===")) || (tokVal == "!==")) || (tokVal == "<")) || (tokVal == ">")) {
      const opTok = this.peek();
      this.advance();
      const right = this.parseUnary();
      const binExpr = new TSNode();
      binExpr.nodeType = "BinaryExpression";
      binExpr.value = opTok.value;
      binExpr.left = left;
      binExpr.right = right;
      binExpr.start = left.start;
      binExpr.line = left.line;
      binExpr.col = left.col;
      left = binExpr;
      tokVal = this.peekValue();
    };
    return left;
  };
  parseUnary () {
    const tokVal = this.peekValue();
    if ( (tokVal == "!") || (tokVal == "-") ) {
      const opTok = this.peek();
      this.advance();
      const arg = this.parseUnary();
      const unary = new TSNode();
      unary.nodeType = "UnaryExpression";
      unary.value = opTok.value;
      unary.left = arg;
      unary.start = opTok.start;
      unary.line = opTok.line;
      unary.col = opTok.col;
      return unary;
    }
    return this.parseCall();
  };
  parseCall () {
    let callee = this.parsePrimary();
    while (this.matchValue("(")) {
      this.advance();
      const call = new TSNode();
      call.nodeType = "CallExpression";
      call.left = callee;
      call.start = callee.start;
      call.line = callee.line;
      call.col = callee.col;
      while (this.matchValue(")") == false) {
        if ( (call.children.length) > 0 ) {
          this.expectValue(",");
        }
        const arg = this.parseExpr();
        call.children.push(arg);
      };
      this.expectValue(")");
      callee = call;
    };
    return callee;
  };
  parsePrimary () {
    const tokType = this.peekType();
    const tokVal = this.peekValue();
    const tok = this.peek();
    if ( tokType == "Identifier" ) {
      this.advance();
      const id = new TSNode();
      id.nodeType = "Identifier";
      id.name = tok.value;
      id.start = tok.start;
      id.end = tok.end;
      id.line = tok.line;
      id.col = tok.col;
      return id;
    }
    if ( tokType == "Number" ) {
      this.advance();
      const num = new TSNode();
      num.nodeType = "NumericLiteral";
      num.value = tok.value;
      num.start = tok.start;
      num.end = tok.end;
      num.line = tok.line;
      num.col = tok.col;
      return num;
    }
    if ( tokType == "String" ) {
      this.advance();
      const str = new TSNode();
      str.nodeType = "StringLiteral";
      str.value = tok.value;
      str.start = tok.start;
      str.end = tok.end;
      str.line = tok.line;
      str.col = tok.col;
      return str;
    }
    if ( (tokVal == "true") || (tokVal == "false") ) {
      this.advance();
      const bool = new TSNode();
      bool.nodeType = "BooleanLiteral";
      bool.value = tokVal;
      bool.start = tok.start;
      bool.end = tok.end;
      bool.line = tok.line;
      bool.col = tok.col;
      return bool;
    }
    if ( tokVal == "(" ) {
      this.advance();
      const expr = this.parseExpr();
      this.expectValue(")");
      return expr;
    }
    if ( this.quiet == false ) {
      console.log("Unexpected token: " + tokVal);
    }
    this.advance();
    const errId = new TSNode();
    errId.nodeType = "Identifier";
    errId.name = "error";
    return errId;
  };
}
class TSParserMain  {
  constructor() {
  }
}
TSParserMain.showHelp = function() {
  console.log("TypeScript Parser");
  console.log("");
  console.log("Usage: node ts_parser_main.js [options]");
  console.log("");
  console.log("Options:");
  console.log("  -h, --help          Show this help message");
  console.log("  -d                  Run built-in demo/test suite");
  console.log("  -i <file>           Input TypeScript file to parse");
  console.log("  --tokens            Show tokens in addition to AST");
  console.log("  --show-interfaces   List all interfaces in the file");
  console.log("  --show-types        List all type aliases in the file");
  console.log("  --show-functions    List all functions in the file");
  console.log("");
  console.log("Examples:");
  console.log("  node ts_parser_main.js -d                              Run the demo");
  console.log("  node ts_parser_main.js -i script.ts                    Parse and show AST");
  console.log("  node ts_parser_main.js -i script.ts --tokens           Also show tokens");
  console.log("  node ts_parser_main.js -i script.ts --show-interfaces  List interfaces");
};
TSParserMain.listDeclarations = async function(filename, showInterfaces, showTypes, showFunctions) {
  const codeOpt = await (new Promise(resolve => { require('fs').readFile( "." + '/' + filename , 'utf8', (err,data)=>{ resolve(data) }) } ));
  if ( typeof(codeOpt) === "undefined" ) {
    console.log("Error: Could not read file: " + filename);
    return;
  }
  const code = codeOpt;
  const lexer = new TSLexer(code);
  const tokens = lexer.tokenize();
  const parser = new TSParserSimple();
  parser.initParser(tokens);
  parser.setQuiet(true);
  const program = parser.parseProgram();
  if ( showInterfaces ) {
    console.log(("=== Interfaces in " + filename) + " ===");
    console.log("");
    TSParserMain.listInterfaces(program);
    console.log("");
  }
  if ( showTypes ) {
    console.log(("=== Type Aliases in " + filename) + " ===");
    console.log("");
    TSParserMain.listTypeAliases(program);
    console.log("");
  }
  if ( showFunctions ) {
    console.log(("=== Functions in " + filename) + " ===");
    console.log("");
    TSParserMain.listFunctions(program);
    console.log("");
  }
};
TSParserMain.listInterfaces = function(program) {
  let count = 0;
  for ( let idx = 0; idx < program.children.length; idx++) {
    var stmt = program.children[idx];
    if ( stmt.nodeType == "TSInterfaceDeclaration" ) {
      count = count + 1;
      const line = "" + stmt.line;
      let props = 0;
      if ( (typeof(stmt.body) !== "undefined" && stmt.body != null )  ) {
        const body = stmt.body;
        props = body.children.length;
      }
      console.log(((((("  " + stmt.name) + " (") + props) + " properties) [line ") + line) + "]");
      if ( (typeof(stmt.body) !== "undefined" && stmt.body != null )  ) {
        const bodyNode = stmt.body;
        for ( let mi = 0; mi < bodyNode.children.length; mi++) {
          var member = bodyNode.children[mi];
          if ( member.nodeType == "TSPropertySignature" ) {
            let propInfo = "    - " + member.name;
            if ( member.optional ) {
              propInfo = propInfo + "?";
            }
            if ( member.readonly ) {
              propInfo = "    - readonly " + member.name;
              if ( member.optional ) {
                propInfo = propInfo + "?";
              }
            }
            if ( (typeof(member.typeAnnotation) !== "undefined" && member.typeAnnotation != null )  ) {
              const typeNode = member.typeAnnotation;
              if ( (typeof(typeNode.typeAnnotation) !== "undefined" && typeNode.typeAnnotation != null )  ) {
                const innerType = typeNode.typeAnnotation;
                propInfo = (propInfo + ": ") + TSParserMain.getTypeName(innerType);
              }
            }
            console.log(propInfo);
          }
        };
      }
    }
  };
  console.log("");
  console.log(("Total: " + count) + " interface(s)");
};
TSParserMain.listTypeAliases = function(program) {
  let count = 0;
  for ( let idx = 0; idx < program.children.length; idx++) {
    var stmt = program.children[idx];
    if ( stmt.nodeType == "TSTypeAliasDeclaration" ) {
      count = count + 1;
      const line = "" + stmt.line;
      let typeInfo = "  " + stmt.name;
      if ( (typeof(stmt.typeAnnotation) !== "undefined" && stmt.typeAnnotation != null )  ) {
        const typeNode = stmt.typeAnnotation;
        typeInfo = (typeInfo + " = ") + TSParserMain.getTypeName(typeNode);
      }
      typeInfo = ((typeInfo + " [line ") + line) + "]";
      console.log(typeInfo);
    }
  };
  console.log("");
  console.log(("Total: " + count) + " type alias(es)");
};
TSParserMain.listFunctions = function(program) {
  let count = 0;
  for ( let idx = 0; idx < program.children.length; idx++) {
    var stmt = program.children[idx];
    if ( stmt.nodeType == "FunctionDeclaration" ) {
      count = count + 1;
      const line = "" + stmt.line;
      let funcInfo = ("  " + stmt.name) + "(";
      /** unused:  const paramCount = stmt.params.length   **/ 
      let pi = 0;
      for ( let paramIdx = 0; paramIdx < stmt.params.length; paramIdx++) {
        var param = stmt.params[paramIdx];
        if ( pi > 0 ) {
          funcInfo = funcInfo + ", ";
        }
        funcInfo = funcInfo + param.name;
        if ( param.optional ) {
          funcInfo = funcInfo + "?";
        }
        if ( (typeof(param.typeAnnotation) !== "undefined" && param.typeAnnotation != null )  ) {
          const paramType = param.typeAnnotation;
          if ( (typeof(paramType.typeAnnotation) !== "undefined" && paramType.typeAnnotation != null )  ) {
            const innerType = paramType.typeAnnotation;
            funcInfo = (funcInfo + ": ") + TSParserMain.getTypeName(innerType);
          }
        }
        pi = pi + 1;
      };
      funcInfo = funcInfo + ")";
      if ( (typeof(stmt.typeAnnotation) !== "undefined" && stmt.typeAnnotation != null )  ) {
        const retType = stmt.typeAnnotation;
        if ( (typeof(retType.typeAnnotation) !== "undefined" && retType.typeAnnotation != null )  ) {
          const innerRet = retType.typeAnnotation;
          funcInfo = (funcInfo + ": ") + TSParserMain.getTypeName(innerRet);
        }
      }
      funcInfo = ((funcInfo + " [line ") + line) + "]";
      console.log(funcInfo);
    }
  };
  console.log("");
  console.log(("Total: " + count) + " function(s)");
};
TSParserMain.getTypeName = function(typeNode) {
  const nodeType = typeNode.nodeType;
  if ( nodeType == "TSStringKeyword" ) {
    return "string";
  }
  if ( nodeType == "TSNumberKeyword" ) {
    return "number";
  }
  if ( nodeType == "TSBooleanKeyword" ) {
    return "boolean";
  }
  if ( nodeType == "TSAnyKeyword" ) {
    return "any";
  }
  if ( nodeType == "TSVoidKeyword" ) {
    return "void";
  }
  if ( nodeType == "TSNullKeyword" ) {
    return "null";
  }
  if ( nodeType == "TSUndefinedKeyword" ) {
    return "undefined";
  }
  if ( nodeType == "TSTypeReference" ) {
    let result = typeNode.name;
    if ( (typeNode.params.length) > 0 ) {
      result = result + "<";
      let gi = 0;
      for ( let gpIdx = 0; gpIdx < typeNode.params.length; gpIdx++) {
        var gp = typeNode.params[gpIdx];
        if ( gi > 0 ) {
          result = result + ", ";
        }
        result = result + TSParserMain.getTypeName(gp);
        gi = gi + 1;
      };
      result = result + ">";
    }
    return result;
  }
  if ( nodeType == "TSUnionType" ) {
    let result_1 = "";
    let ui = 0;
    for ( let utIdx = 0; utIdx < typeNode.children.length; utIdx++) {
      var ut = typeNode.children[utIdx];
      if ( ui > 0 ) {
        result_1 = result_1 + " | ";
      }
      result_1 = result_1 + TSParserMain.getTypeName(ut);
      ui = ui + 1;
    };
    return result_1;
  }
  return nodeType;
};
TSParserMain.parseFile = async function(filename, showTokens) {
  const codeOpt = await (new Promise(resolve => { require('fs').readFile( "." + '/' + filename , 'utf8', (err,data)=>{ resolve(data) }) } ));
  if ( typeof(codeOpt) === "undefined" ) {
    console.log("Error: Could not read file: " + filename);
    return;
  }
  const code = codeOpt;
  console.log(("=== Parsing: " + filename) + " ===");
  console.log("");
  const lexer = new TSLexer(code);
  const tokens = lexer.tokenize();
  if ( showTokens ) {
    console.log("--- Tokens ---");
    for ( let ti = 0; ti < tokens.length; ti++) {
      var tok = tokens[ti];
      const output = ((tok.tokenType + ": '") + tok.value) + "'";
      console.log(output);
    };
    console.log("");
  }
  const parser = new TSParserSimple();
  parser.initParser(tokens);
  const program = parser.parseProgram();
  console.log("--- AST ---");
  console.log(("Program with " + (program.children.length)) + " statements:");
  console.log("");
  for ( let idx = 0; idx < program.children.length; idx++) {
    var stmt = program.children[idx];
    TSParserMain.printNode(stmt, 0);
  };
};
TSParserMain.runDemo = function() {
  const code = "\r\ninterface Person {\r\n  readonly id: number;\r\n  name: string;\r\n  age?: number;\r\n}\r\n\r\ntype ID = string | number;\r\n\r\ntype Result = Person | null;\r\n\r\nlet count: number = 42;\r\n\r\nconst message: string = 'hello';\r\n\r\nfunction greet(name: string, age?: number): string {\r\n  return name;\r\n}\r\n\r\nlet data: Array<string>;\r\n";
  console.log("=== TypeScript Parser Demo ===");
  console.log("");
  console.log("Input:");
  console.log(code);
  console.log("");
  console.log("--- Tokens ---");
  const lexer = new TSLexer(code);
  const tokens = lexer.tokenize();
  for ( let i = 0; i < tokens.length; i++) {
    var tok = tokens[i];
    const output = ((tok.tokenType + ": '") + tok.value) + "'";
    console.log(output);
  };
  console.log("");
  console.log("--- AST ---");
  const parser = new TSParserSimple();
  parser.initParser(tokens);
  const program = parser.parseProgram();
  console.log(("Program with " + (program.children.length)) + " statements:");
  console.log("");
  for ( let idx = 0; idx < program.children.length; idx++) {
    var stmt = program.children[idx];
    TSParserMain.printNode(stmt, 0);
  };
};
TSParserMain.printNode = function(node, depth) {
  let indent = "";
  let i = 0;
  while (i < depth) {
    indent = indent + "  ";
    i = i + 1;
  };
  const nodeType = node.nodeType;
  const loc = ((("[" + node.line) + ":") + node.col) + "]";
  if ( nodeType == "TSInterfaceDeclaration" ) {
    console.log((((indent + "TSInterfaceDeclaration: ") + node.name) + " ") + loc);
    if ( (typeof(node.body) !== "undefined" && node.body != null )  ) {
      TSParserMain.printNode(node.body, depth + 1);
    }
    return;
  }
  if ( nodeType == "TSInterfaceBody" ) {
    console.log((indent + "TSInterfaceBody ") + loc);
    for ( let mi = 0; mi < node.children.length; mi++) {
      var member = node.children[mi];
      TSParserMain.printNode(member, depth + 1);
    };
    return;
  }
  if ( nodeType == "TSPropertySignature" ) {
    let modifiers = "";
    if ( node.readonly ) {
      modifiers = "readonly ";
    }
    if ( node.optional ) {
      modifiers = modifiers + "optional ";
    }
    console.log(((((indent + "TSPropertySignature: ") + modifiers) + node.name) + " ") + loc);
    if ( (typeof(node.typeAnnotation) !== "undefined" && node.typeAnnotation != null )  ) {
      TSParserMain.printNode(node.typeAnnotation, depth + 1);
    }
    return;
  }
  if ( nodeType == "TSTypeAliasDeclaration" ) {
    console.log((((indent + "TSTypeAliasDeclaration: ") + node.name) + " ") + loc);
    if ( (typeof(node.typeAnnotation) !== "undefined" && node.typeAnnotation != null )  ) {
      TSParserMain.printNode(node.typeAnnotation, depth + 1);
    }
    return;
  }
  if ( nodeType == "TSTypeAnnotation" ) {
    console.log((indent + "TSTypeAnnotation ") + loc);
    if ( (typeof(node.typeAnnotation) !== "undefined" && node.typeAnnotation != null )  ) {
      TSParserMain.printNode(node.typeAnnotation, depth + 1);
    }
    return;
  }
  if ( nodeType == "TSUnionType" ) {
    console.log((indent + "TSUnionType ") + loc);
    for ( let ti = 0; ti < node.children.length; ti++) {
      var typeNode = node.children[ti];
      TSParserMain.printNode(typeNode, depth + 1);
    };
    return;
  }
  if ( nodeType == "TSTypeReference" ) {
    console.log((((indent + "TSTypeReference: ") + node.name) + " ") + loc);
    for ( let pi = 0; pi < node.params.length; pi++) {
      var param = node.params[pi];
      TSParserMain.printNode(param, depth + 1);
    };
    return;
  }
  if ( nodeType == "TSArrayType" ) {
    console.log((indent + "TSArrayType ") + loc);
    if ( (typeof(node.left) !== "undefined" && node.left != null )  ) {
      TSParserMain.printNode(node.left, depth + 1);
    }
    return;
  }
  if ( nodeType == "TSStringKeyword" ) {
    console.log((indent + "TSStringKeyword ") + loc);
    return;
  }
  if ( nodeType == "TSNumberKeyword" ) {
    console.log((indent + "TSNumberKeyword ") + loc);
    return;
  }
  if ( nodeType == "TSBooleanKeyword" ) {
    console.log((indent + "TSBooleanKeyword ") + loc);
    return;
  }
  if ( nodeType == "TSAnyKeyword" ) {
    console.log((indent + "TSAnyKeyword ") + loc);
    return;
  }
  if ( nodeType == "TSNullKeyword" ) {
    console.log((indent + "TSNullKeyword ") + loc);
    return;
  }
  if ( nodeType == "TSVoidKeyword" ) {
    console.log((indent + "TSVoidKeyword ") + loc);
    return;
  }
  if ( nodeType == "VariableDeclaration" ) {
    console.log((((indent + "VariableDeclaration (") + node.kind) + ") ") + loc);
    for ( let di = 0; di < node.children.length; di++) {
      var declarator = node.children[di];
      TSParserMain.printNode(declarator, depth + 1);
    };
    return;
  }
  if ( nodeType == "VariableDeclarator" ) {
    console.log((((indent + "VariableDeclarator: ") + node.name) + " ") + loc);
    if ( (typeof(node.typeAnnotation) !== "undefined" && node.typeAnnotation != null )  ) {
      TSParserMain.printNode(node.typeAnnotation, depth + 1);
    }
    if ( (typeof(node.init) !== "undefined" && node.init != null )  ) {
      console.log(indent + "  init:");
      TSParserMain.printNode(node.init, depth + 2);
    }
    return;
  }
  if ( nodeType == "FunctionDeclaration" ) {
    let paramNames = "";
    for ( let pi_1 = 0; pi_1 < node.params.length; pi_1++) {
      var p = node.params[pi_1];
      if ( pi_1 > 0 ) {
        paramNames = paramNames + ", ";
      }
      paramNames = paramNames + p.name;
      if ( p.optional ) {
        paramNames = paramNames + "?";
      }
    };
    console.log((((((indent + "FunctionDeclaration: ") + node.name) + "(") + paramNames) + ") ") + loc);
    if ( (typeof(node.typeAnnotation) !== "undefined" && node.typeAnnotation != null )  ) {
      console.log(indent + "  returnType:");
      TSParserMain.printNode(node.typeAnnotation, depth + 2);
    }
    if ( (typeof(node.body) !== "undefined" && node.body != null )  ) {
      TSParserMain.printNode(node.body, depth + 1);
    }
    return;
  }
  if ( nodeType == "BlockStatement" ) {
    console.log((indent + "BlockStatement ") + loc);
    for ( let si = 0; si < node.children.length; si++) {
      var stmt = node.children[si];
      TSParserMain.printNode(stmt, depth + 1);
    };
    return;
  }
  if ( nodeType == "ExpressionStatement" ) {
    console.log((indent + "ExpressionStatement ") + loc);
    if ( (typeof(node.left) !== "undefined" && node.left != null )  ) {
      TSParserMain.printNode(node.left, depth + 1);
    }
    return;
  }
  if ( nodeType == "ReturnStatement" ) {
    console.log((indent + "ReturnStatement ") + loc);
    if ( (typeof(node.left) !== "undefined" && node.left != null )  ) {
      TSParserMain.printNode(node.left, depth + 1);
    }
    return;
  }
  if ( nodeType == "Identifier" ) {
    console.log((((indent + "Identifier: ") + node.name) + " ") + loc);
    return;
  }
  if ( nodeType == "NumericLiteral" ) {
    console.log((((indent + "NumericLiteral: ") + node.value) + " ") + loc);
    return;
  }
  if ( nodeType == "StringLiteral" ) {
    console.log((((indent + "StringLiteral: ") + node.value) + " ") + loc);
    return;
  }
  console.log(((indent + nodeType) + " ") + loc);
};
/* static JavaSript main routine at the end of the JS file */
async function __js_main() {
  const argCnt = (process.argv.length - 2);
  if ( argCnt == 0 ) {
    TSParserMain.showHelp();
    return;
  }
  let inputFile = "";
  let runDefault = false;
  let showTokens = false;
  let showInterfaces = false;
  let showTypes = false;
  let showFunctions = false;
  let i = 0;
  while (i < argCnt) {
    const arg = process.argv[ 2 + i];
    if ( (arg == "--help") || (arg == "-h") ) {
      TSParserMain.showHelp();
      return;
    }
    if ( arg == "-d" ) {
      runDefault = true;
      i = i + 1;
    } else {
      if ( arg == "-i" ) {
        i = i + 1;
        if ( i < argCnt ) {
          inputFile = process.argv[ 2 + i];
        }
        i = i + 1;
      } else {
        if ( arg == "--tokens" ) {
          showTokens = true;
          i = i + 1;
        } else {
          if ( arg == "--show-interfaces" ) {
            showInterfaces = true;
            i = i + 1;
          } else {
            if ( arg == "--show-types" ) {
              showTypes = true;
              i = i + 1;
            } else {
              if ( arg == "--show-functions" ) {
                showFunctions = true;
                i = i + 1;
              } else {
                i = i + 1;
              }
            }
          }
        }
      }
    }
  };
  if ( runDefault ) {
    TSParserMain.runDemo();
    return;
  }
  if ( (inputFile.length) > 0 ) {
    if ( (showInterfaces || showTypes) || showFunctions ) {
      await TSParserMain.listDeclarations(inputFile, showInterfaces, showTypes, showFunctions);
      return;
    }
    await TSParserMain.parseFile(inputFile, showTokens);
    return;
  }
  TSParserMain.showHelp();
}
__js_main();
