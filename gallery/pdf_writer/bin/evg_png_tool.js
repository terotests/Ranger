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
    if ( code > 127 ) {
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
    if ( code > 127 ) {
      return true;
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
  readTemplateLiteral () {
    const startPos = this.pos;
    const startLine = this.line;
    const startCol = this.col;
    this.advance();
    let value = "";
    while (this.pos < this.__len) {
      const ch = this.peek();
      if ( ch == "`" ) {
        this.advance();
        return this.makeToken("Template", value, startPos, startLine, startCol);
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
            if ( esc == "`" ) {
              value = value + "`";
            } else {
              if ( esc == "$" ) {
                value = value + "$";
              } else {
                value = value + esc;
              }
            }
          }
        }
      } else {
        value = value + this.advance();
      }
    };
    return this.makeToken("Template", value, startPos, startLine, startCol);
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
        if ( ch == "_" ) {
          value = value + this.advance();
        } else {
          if ( ch == "." ) {
            value = value + this.advance();
          } else {
            if ( ch == "n" ) {
              value = value + this.advance();
              return this.makeToken("BigInt", value, startPos, startLine, startCol);
            }
            return this.makeToken("Number", value, startPos, startLine, startCol);
          }
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
    if ( ch == "`" ) {
      return this.readTemplateLiteral();
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
        if ( this.peek() == "=" ) {
          this.advance();
          return this.makeToken("Punctuator", "&&=", startPos, startLine, startCol);
        }
        return this.makeToken("Punctuator", "&&", startPos, startLine, startCol);
      }
    }
    if ( ch == "|" ) {
      if ( next_1 == "|" ) {
        this.advance();
        this.advance();
        if ( this.peek() == "=" ) {
          this.advance();
          return this.makeToken("Punctuator", "||=", startPos, startLine, startCol);
        }
        return this.makeToken("Punctuator", "||", startPos, startLine, startCol);
      }
    }
    if ( ch == "?" ) {
      if ( next_1 == "?" ) {
        this.advance();
        this.advance();
        if ( this.peek() == "=" ) {
          this.advance();
          return this.makeToken("Punctuator", "??=", startPos, startLine, startCol);
        }
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
    if ( ch == "*" ) {
      if ( next_1 == "*" ) {
        this.advance();
        this.advance();
        return this.makeToken("Punctuator", "**", startPos, startLine, startCol);
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
    this.shorthand = false;
    this.computed = false;
    this.method = false;
    this.generator = false;
    this.async = false;
    this.delegate = false;
    this.await = false;
    this.children = [];
    this.params = [];
    this.decorators = [];
  }
}
class TSParserSimple  {
  constructor() {
    this.tokens = [];
    this.pos = 0;
    this.quiet = false;
    this.tsxMode = false;
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
  setTsxMode (enabled) {
    this.tsxMode = enabled;
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
    if ( tokVal == "@" ) {
      let decorators = [];
      while (this.matchValue("@")) {
        const dec = this.parseDecorator();
        decorators.push(dec);
      };
      const decorated = this.parseStatement();
      decorated.decorators = decorators;
      return decorated;
    }
    if ( tokVal == "declare" ) {
      return this.parseDeclare();
    }
    if ( tokVal == "import" ) {
      return this.parseImport();
    }
    if ( tokVal == "export" ) {
      return this.parseExport();
    }
    if ( tokVal == "interface" ) {
      return this.parseInterface();
    }
    if ( tokVal == "type" ) {
      return this.parseTypeAlias();
    }
    if ( tokVal == "class" ) {
      return this.parseClass();
    }
    if ( tokVal == "abstract" ) {
      const nextVal = this.peekNextValue();
      if ( nextVal == "class" ) {
        return this.parseClass();
      }
    }
    if ( tokVal == "enum" ) {
      return this.parseEnum();
    }
    if ( tokVal == "namespace" ) {
      return this.parseNamespace();
    }
    if ( tokVal == "const" ) {
      const nextVal_1 = this.peekNextValue();
      if ( nextVal_1 == "enum" ) {
        return this.parseEnum();
      }
    }
    if ( (tokVal == "let") || (tokVal == "const") ) {
      return this.parseVarDecl();
    }
    if ( tokVal == "function" ) {
      return this.parseFuncDecl(false);
    }
    if ( tokVal == "async" ) {
      const nextVal_2 = this.peekNextValue();
      if ( nextVal_2 == "function" ) {
        this.advance();
        return this.parseFuncDecl(true);
      }
    }
    if ( tokVal == "return" ) {
      return this.parseReturn();
    }
    if ( tokVal == "throw" ) {
      return this.parseThrow();
    }
    if ( tokVal == "if" ) {
      return this.parseIfStatement();
    }
    if ( tokVal == "while" ) {
      return this.parseWhileStatement();
    }
    if ( tokVal == "do" ) {
      return this.parseDoWhileStatement();
    }
    if ( tokVal == "for" ) {
      return this.parseForStatement();
    }
    if ( tokVal == "switch" ) {
      return this.parseSwitchStatement();
    }
    if ( tokVal == "try" ) {
      return this.parseTryStatement();
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
    const tokType = this.peekType();
    if ( tokType == "Identifier" ) {
      const nextVal_3 = this.peekNextValue();
      if ( nextVal_3 == ":" ) {
        return this.parseLabeledStatement();
      }
    }
    return this.parseExprStmt();
  };
  parseLabeledStatement () {
    const node = new TSNode();
    node.nodeType = "LabeledStatement";
    const startTok = this.peek();
    node.start = startTok.start;
    node.line = startTok.line;
    node.col = startTok.col;
    const labelTok = this.expect("Identifier");
    node.name = labelTok.value;
    this.expectValue(":");
    const body = this.parseStatement();
    node.body = body;
    return node;
  };
  peekNextValue () {
    const nextPos = this.pos + 1;
    if ( nextPos < (this.tokens.length) ) {
      const nextTok = this.tokens[nextPos];
      return nextTok.value;
    }
    return "";
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
  parseImport () {
    const node = new TSNode();
    node.nodeType = "ImportDeclaration";
    const startTok = this.peek();
    node.start = startTok.start;
    node.line = startTok.line;
    node.col = startTok.col;
    this.expectValue("import");
    if ( this.matchValue("type") ) {
      this.advance();
      node.kind = "type";
    }
    const v = this.peekValue();
    if ( v == "{" ) {
      this.advance();
      let specifiers = [];
      while ((this.matchValue("}") == false) && (this.isAtEnd() == false)) {
        const spec = new TSNode();
        spec.nodeType = "ImportSpecifier";
        if ( this.matchValue("type") ) {
          this.advance();
          spec.kind = "type";
        }
        const importedName = this.expect("Identifier");
        spec.name = importedName.value;
        if ( this.matchValue("as") ) {
          this.advance();
          const localName = this.expect("Identifier");
          spec.value = localName.value;
        } else {
          spec.value = importedName.value;
        }
        specifiers.push(spec);
        if ( this.matchValue(",") ) {
          this.advance();
        }
      };
      this.expectValue("}");
      node.children = specifiers;
    }
    if ( v == "*" ) {
      this.advance();
      this.expectValue("as");
      const namespaceName = this.expect("Identifier");
      const nsSpec = new TSNode();
      nsSpec.nodeType = "ImportNamespaceSpecifier";
      nsSpec.name = namespaceName.value;
      node.children.push(nsSpec);
    }
    if ( this.matchType("Identifier") ) {
      const defaultSpec = new TSNode();
      defaultSpec.nodeType = "ImportDefaultSpecifier";
      const defaultName = this.expect("Identifier");
      defaultSpec.name = defaultName.value;
      node.children.push(defaultSpec);
      if ( this.matchValue(",") ) {
        this.advance();
        if ( this.matchValue("{") ) {
          this.advance();
          while ((this.matchValue("}") == false) && (this.isAtEnd() == false)) {
            const spec_1 = new TSNode();
            spec_1.nodeType = "ImportSpecifier";
            const importedName_1 = this.expect("Identifier");
            spec_1.name = importedName_1.value;
            if ( this.matchValue("as") ) {
              this.advance();
              const localName_1 = this.expect("Identifier");
              spec_1.value = localName_1.value;
            } else {
              spec_1.value = importedName_1.value;
            }
            node.children.push(spec_1);
            if ( this.matchValue(",") ) {
              this.advance();
            }
          };
          this.expectValue("}");
        }
      }
    }
    if ( this.matchValue("from") ) {
      this.advance();
      const sourceStr = this.expect("String");
      const source = new TSNode();
      source.nodeType = "StringLiteral";
      source.value = sourceStr.value;
      node.left = source;
    }
    if ( this.matchValue(";") ) {
      this.advance();
    }
    return node;
  };
  parseExport () {
    const node = new TSNode();
    node.nodeType = "ExportNamedDeclaration";
    const startTok = this.peek();
    node.start = startTok.start;
    node.line = startTok.line;
    node.col = startTok.col;
    this.expectValue("export");
    if ( this.matchValue("type") ) {
      const nextV = this.peekNextValue();
      if ( nextV == "{" ) {
        this.advance();
        node.kind = "type";
      }
    }
    const v = this.peekValue();
    if ( v == "default" ) {
      node.nodeType = "ExportDefaultDeclaration";
      this.advance();
      const nextVal = this.peekValue();
      if ( ((nextVal == "class") || (nextVal == "function")) || (nextVal == "interface") ) {
        const decl = this.parseStatement();
        node.left = decl;
      } else {
        const expr = this.parseExpr();
        node.left = expr;
      }
      if ( this.matchValue(";") ) {
        this.advance();
      }
      return node;
    }
    if ( v == "{" ) {
      this.advance();
      let specifiers = [];
      while ((this.matchValue("}") == false) && (this.isAtEnd() == false)) {
        const spec = new TSNode();
        spec.nodeType = "ExportSpecifier";
        const localName = this.expect("Identifier");
        spec.name = localName.value;
        if ( this.matchValue("as") ) {
          this.advance();
          const exportedName = this.expect("Identifier");
          spec.value = exportedName.value;
        } else {
          spec.value = localName.value;
        }
        specifiers.push(spec);
        if ( this.matchValue(",") ) {
          this.advance();
        }
      };
      this.expectValue("}");
      node.children = specifiers;
      if ( this.matchValue("from") ) {
        this.advance();
        const sourceStr = this.expect("String");
        const source = new TSNode();
        source.nodeType = "StringLiteral";
        source.value = sourceStr.value;
        node.left = source;
      }
      if ( this.matchValue(";") ) {
        this.advance();
      }
      return node;
    }
    if ( v == "*" ) {
      node.nodeType = "ExportAllDeclaration";
      this.advance();
      if ( this.matchValue("as") ) {
        this.advance();
        const exportName = this.expect("Identifier");
        node.name = exportName.value;
      }
      this.expectValue("from");
      const sourceStr_1 = this.expect("String");
      const source_1 = new TSNode();
      source_1.nodeType = "StringLiteral";
      source_1.value = sourceStr_1.value;
      node.left = source_1;
      if ( this.matchValue(";") ) {
        this.advance();
      }
      return node;
    }
    if ( (((((((v == "function") || (v == "class")) || (v == "interface")) || (v == "type")) || (v == "const")) || (v == "let")) || (v == "enum")) || (v == "abstract") ) {
      const decl_1 = this.parseStatement();
      node.left = decl_1;
      return node;
    }
    if ( v == "async" ) {
      const decl_2 = this.parseStatement();
      node.left = decl_2;
      return node;
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
    if ( this.matchValue("<") ) {
      const typeParams = this.parseTypeParams();
      node.params = typeParams;
    }
    if ( this.matchValue("extends") ) {
      this.advance();
      let extendsList = [];
      const extendsType = this.parseType();
      extendsList.push(extendsType);
      while (this.matchValue(",")) {
        this.advance();
        const nextType = this.parseType();
        extendsList.push(nextType);
      };
      for ( let i = 0; i < extendsList.length; i++) {
        var ext = extendsList[i];
        const wrapper = new TSNode();
        wrapper.nodeType = "TSExpressionWithTypeArguments";
        wrapper.left = ext;
        node.children.push(wrapper);
      };
    }
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
  parseTypeParams () {
    let params = [];
    this.expectValue("<");
    while ((this.matchValue(">") == false) && (this.isAtEnd() == false)) {
      if ( (params.length) > 0 ) {
        this.expectValue(",");
      }
      const param = new TSNode();
      param.nodeType = "TSTypeParameter";
      const nameTok = this.expect("Identifier");
      param.name = nameTok.value;
      param.start = nameTok.start;
      param.line = nameTok.line;
      param.col = nameTok.col;
      if ( this.matchValue("extends") ) {
        this.advance();
        const constraint = this.parseType();
        param.typeAnnotation = constraint;
      }
      if ( this.matchValue("=") ) {
        this.advance();
        const defaultType = this.parseType();
        param.init = defaultType;
      }
      params.push(param);
    };
    this.expectValue(">");
    return params;
  };
  parsePropertySig () {
    const startTok = this.peek();
    const startPos = startTok.start;
    const startLine = startTok.line;
    const startCol = startTok.col;
    let isReadonly = false;
    if ( this.matchValue("readonly") ) {
      isReadonly = true;
      this.advance();
    }
    if ( this.matchValue("[") ) {
      this.advance();
      const paramTok = this.expect("Identifier");
      return this.parseIndexSignatureRest(isReadonly, paramTok, startPos, startLine, startCol);
    }
    if ( this.matchValue("(") ) {
      return this.parseCallSignature(startPos, startLine, startCol);
    }
    if ( this.matchValue("new") ) {
      return this.parseConstructSignature(startPos, startLine, startCol);
    }
    const prop = new TSNode();
    prop.nodeType = "TSPropertySignature";
    prop.start = startPos;
    prop.line = startLine;
    prop.col = startCol;
    prop.readonly = isReadonly;
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
  parseCallSignature (startPos, startLine, startCol) {
    const sig = new TSNode();
    sig.nodeType = "TSCallSignatureDeclaration";
    sig.start = startPos;
    sig.line = startLine;
    sig.col = startCol;
    if ( this.matchValue("<") ) {
      const typeParams = this.parseTypeParams();
      sig.params = typeParams;
    }
    this.expectValue("(");
    while ((this.matchValue(")") == false) && (this.isAtEnd() == false)) {
      if ( (sig.children.length) > 0 ) {
        this.expectValue(",");
      }
      const param = this.parseParam();
      sig.children.push(param);
    };
    this.expectValue(")");
    if ( this.matchValue(":") ) {
      const typeAnnot = this.parseTypeAnnotation();
      sig.typeAnnotation = typeAnnot;
    }
    return sig;
  };
  parseConstructSignature (startPos, startLine, startCol) {
    const sig = new TSNode();
    sig.nodeType = "TSConstructSignatureDeclaration";
    sig.start = startPos;
    sig.line = startLine;
    sig.col = startCol;
    this.expectValue("new");
    if ( this.matchValue("<") ) {
      const typeParams = this.parseTypeParams();
      sig.params = typeParams;
    }
    this.expectValue("(");
    while ((this.matchValue(")") == false) && (this.isAtEnd() == false)) {
      if ( (sig.children.length) > 0 ) {
        this.expectValue(",");
      }
      const param = this.parseParam();
      sig.children.push(param);
    };
    this.expectValue(")");
    if ( this.matchValue(":") ) {
      const typeAnnot = this.parseTypeAnnotation();
      sig.typeAnnotation = typeAnnot;
    }
    return sig;
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
    if ( this.matchValue("<") ) {
      const typeParams = this.parseTypeParams();
      node.params = typeParams;
    }
    this.expectValue("=");
    const typeExpr = this.parseType();
    node.typeAnnotation = typeExpr;
    if ( this.matchValue(";") ) {
      this.advance();
    }
    return node;
  };
  parseDecorator () {
    const node = new TSNode();
    node.nodeType = "Decorator";
    const startTok = this.peek();
    node.start = startTok.start;
    node.line = startTok.line;
    node.col = startTok.col;
    this.expectValue("@");
    const expr = this.parsePostfix();
    node.left = expr;
    return node;
  };
  parseClass () {
    const node = new TSNode();
    node.nodeType = "ClassDeclaration";
    const startTok = this.peek();
    node.start = startTok.start;
    node.line = startTok.line;
    node.col = startTok.col;
    if ( this.matchValue("abstract") ) {
      node.kind = "abstract";
      this.advance();
    }
    this.expectValue("class");
    const nameTok = this.expect("Identifier");
    node.name = nameTok.value;
    if ( this.matchValue("<") ) {
      const typeParams = this.parseTypeParams();
      node.params = typeParams;
    }
    if ( this.matchValue("extends") ) {
      this.advance();
      const superClass = this.parseType();
      const extendsNode = new TSNode();
      extendsNode.nodeType = "TSExpressionWithTypeArguments";
      extendsNode.left = superClass;
      node.left = extendsNode;
    }
    if ( this.matchValue("implements") ) {
      this.advance();
      const impl = this.parseType();
      const implNode = new TSNode();
      implNode.nodeType = "TSExpressionWithTypeArguments";
      implNode.left = impl;
      node.children.push(implNode);
      while (this.matchValue(",")) {
        this.advance();
        const nextImpl = this.parseType();
        const nextImplNode = new TSNode();
        nextImplNode.nodeType = "TSExpressionWithTypeArguments";
        nextImplNode.left = nextImpl;
        node.children.push(nextImplNode);
      };
    }
    const body = this.parseClassBody();
    node.body = body;
    return node;
  };
  parseClassBody () {
    const body = new TSNode();
    body.nodeType = "ClassBody";
    const startTok = this.peek();
    body.start = startTok.start;
    body.line = startTok.line;
    body.col = startTok.col;
    this.expectValue("{");
    while ((this.matchValue("}") == false) && (this.isAtEnd() == false)) {
      const member = this.parseClassMember();
      body.children.push(member);
      if ( this.matchValue(";") ) {
        this.advance();
      }
    };
    this.expectValue("}");
    return body;
  };
  parseClassMember () {
    const member = new TSNode();
    const startTok = this.peek();
    member.start = startTok.start;
    member.line = startTok.line;
    member.col = startTok.col;
    let decorators = [];
    while (this.matchValue("@")) {
      const dec = this.parseDecorator();
      decorators.push(dec);
    };
    if ( (decorators.length) > 0 ) {
      member.decorators = decorators;
    }
    let isStatic = false;
    let isAbstract = false;
    let isReadonly = false;
    let isAsync = false;
    let accessibility = "";
    let keepParsing = true;
    while (keepParsing) {
      const tokVal = this.peekValue();
      if ( tokVal == "public" ) {
        accessibility = "public";
        this.advance();
      }
      if ( tokVal == "private" ) {
        accessibility = "private";
        this.advance();
      }
      if ( tokVal == "protected" ) {
        accessibility = "protected";
        this.advance();
      }
      if ( tokVal == "static" ) {
        isStatic = true;
        this.advance();
        if ( this.matchValue("{") ) {
          member.nodeType = "StaticBlock";
          member.body = this.parseBlock();
          member.start = startTok.start;
          member.line = startTok.line;
          member.col = startTok.col;
          return member;
        }
      }
      if ( tokVal == "abstract" ) {
        isAbstract = true;
        this.advance();
      }
      if ( tokVal == "readonly" ) {
        isReadonly = true;
        this.advance();
      }
      if ( tokVal == "async" ) {
        isAsync = true;
        this.advance();
      }
      const newTokVal = this.peekValue();
      if ( ((((((newTokVal != "public") && (newTokVal != "private")) && (newTokVal != "protected")) && (newTokVal != "static")) && (newTokVal != "abstract")) && (newTokVal != "readonly")) && (newTokVal != "async") ) {
        keepParsing = false;
      }
    };
    if ( this.matchValue("constructor") ) {
      member.nodeType = "MethodDefinition";
      member.kind = "constructor";
      this.advance();
      this.expectValue("(");
      while ((this.matchValue(")") == false) && (this.isAtEnd() == false)) {
        if ( (member.params.length) > 0 ) {
          this.expectValue(",");
        }
        const param = this.parseConstructorParam();
        member.params.push(param);
      };
      this.expectValue(")");
      if ( this.matchValue("{") ) {
        const bodyNode = this.parseBlock();
        member.body = bodyNode;
      }
      return member;
    }
    const nameTok = this.expect("Identifier");
    member.name = nameTok.value;
    if ( accessibility != "" ) {
      member.kind = accessibility;
    }
    member.readonly = isReadonly;
    if ( this.matchValue("?") ) {
      member.optional = true;
      this.advance();
    }
    if ( this.matchValue("(") ) {
      member.nodeType = "MethodDefinition";
      if ( isStatic ) {
        member.kind = "static";
      }
      if ( isAbstract ) {
        member.kind = "abstract";
      }
      if ( isAsync ) {
        member.async = true;
      }
      this.expectValue("(");
      while ((this.matchValue(")") == false) && (this.isAtEnd() == false)) {
        if ( (member.params.length) > 0 ) {
          this.expectValue(",");
        }
        const param_1 = this.parseParam();
        member.params.push(param_1);
      };
      this.expectValue(")");
      if ( this.matchValue(":") ) {
        const returnType = this.parseTypeAnnotation();
        member.typeAnnotation = returnType;
      }
      if ( this.matchValue("{") ) {
        const bodyNode_1 = this.parseBlock();
        member.body = bodyNode_1;
      }
    } else {
      member.nodeType = "PropertyDefinition";
      if ( isStatic ) {
        member.kind = "static";
      }
      if ( this.matchValue(":") ) {
        const typeAnnot = this.parseTypeAnnotation();
        member.typeAnnotation = typeAnnot;
      }
      if ( this.matchValue("=") ) {
        this.advance();
        const initExpr = this.parseExpr();
        member.init = initExpr;
      }
    }
    return member;
  };
  parseConstructorParam () {
    const param = new TSNode();
    param.nodeType = "Parameter";
    const startTok = this.peek();
    param.start = startTok.start;
    param.line = startTok.line;
    param.col = startTok.col;
    const tokVal = this.peekValue();
    if ( (((tokVal == "public") || (tokVal == "private")) || (tokVal == "protected")) || (tokVal == "readonly") ) {
      param.kind = tokVal;
      this.advance();
      const nextVal = this.peekValue();
      if ( nextVal == "readonly" ) {
        param.readonly = true;
        this.advance();
      }
    }
    const nameTok = this.expect("Identifier");
    param.name = nameTok.value;
    if ( this.matchValue("?") ) {
      param.optional = true;
      this.advance();
    }
    if ( this.matchValue(":") ) {
      const typeAnnot = this.parseTypeAnnotation();
      param.typeAnnotation = typeAnnot;
    }
    if ( this.matchValue("=") ) {
      this.advance();
      const defaultVal = this.parseExpr();
      param.init = defaultVal;
    }
    return param;
  };
  parseEnum () {
    const node = new TSNode();
    node.nodeType = "TSEnumDeclaration";
    const startTok = this.peek();
    node.start = startTok.start;
    node.line = startTok.line;
    node.col = startTok.col;
    if ( this.matchValue("const") ) {
      node.kind = "const";
      this.advance();
    }
    this.expectValue("enum");
    const nameTok = this.expect("Identifier");
    node.name = nameTok.value;
    this.expectValue("{");
    while ((this.matchValue("}") == false) && (this.isAtEnd() == false)) {
      const member = new TSNode();
      member.nodeType = "TSEnumMember";
      const memberTok = this.expect("Identifier");
      member.name = memberTok.value;
      member.start = memberTok.start;
      member.line = memberTok.line;
      member.col = memberTok.col;
      if ( this.matchValue("=") ) {
        this.advance();
        const initVal = this.parseExpr();
        member.init = initVal;
      }
      node.children.push(member);
      if ( this.matchValue(",") ) {
        this.advance();
      }
    };
    this.expectValue("}");
    return node;
  };
  parseNamespace () {
    const node = new TSNode();
    node.nodeType = "TSModuleDeclaration";
    const startTok = this.peek();
    node.start = startTok.start;
    node.line = startTok.line;
    node.col = startTok.col;
    this.expectValue("namespace");
    const nameTok = this.expect("Identifier");
    node.name = nameTok.value;
    this.expectValue("{");
    const body = new TSNode();
    body.nodeType = "TSModuleBlock";
    while ((this.matchValue("}") == false) && (this.isAtEnd() == false)) {
      const stmt = this.parseStatement();
      body.children.push(stmt);
    };
    this.expectValue("}");
    node.body = body;
    return node;
  };
  parseDeclare () {
    const startTok = this.peek();
    this.expectValue("declare");
    const nextVal = this.peekValue();
    if ( nextVal == "module" ) {
      const node = new TSNode();
      node.nodeType = "TSModuleDeclaration";
      node.start = startTok.start;
      node.line = startTok.line;
      node.col = startTok.col;
      node.kind = "declare";
      this.advance();
      const nameTok = this.peek();
      if ( this.matchType("String") ) {
        this.advance();
        node.name = nameTok.value;
      } else {
        this.advance();
        node.name = nameTok.value;
      }
      this.expectValue("{");
      const body = new TSNode();
      body.nodeType = "TSModuleBlock";
      while ((this.matchValue("}") == false) && (this.isAtEnd() == false)) {
        const stmt = this.parseStatement();
        body.children.push(stmt);
      };
      this.expectValue("}");
      node.body = body;
      return node;
    }
    const node_1 = this.parseStatement();
    node_1.kind = "declare";
    return node_1;
  };
  parseIfStatement () {
    const node = new TSNode();
    node.nodeType = "IfStatement";
    const startTok = this.peek();
    node.start = startTok.start;
    node.line = startTok.line;
    node.col = startTok.col;
    this.expectValue("if");
    this.expectValue("(");
    const test = this.parseExpr();
    node.left = test;
    this.expectValue(")");
    const consequent = this.parseStatement();
    node.body = consequent;
    if ( this.matchValue("else") ) {
      this.advance();
      const alternate = this.parseStatement();
      node.right = alternate;
    }
    return node;
  };
  parseWhileStatement () {
    const node = new TSNode();
    node.nodeType = "WhileStatement";
    const startTok = this.peek();
    node.start = startTok.start;
    node.line = startTok.line;
    node.col = startTok.col;
    this.expectValue("while");
    this.expectValue("(");
    const test = this.parseExpr();
    node.left = test;
    this.expectValue(")");
    const body = this.parseStatement();
    node.body = body;
    return node;
  };
  parseDoWhileStatement () {
    const node = new TSNode();
    node.nodeType = "DoWhileStatement";
    const startTok = this.peek();
    node.start = startTok.start;
    node.line = startTok.line;
    node.col = startTok.col;
    this.expectValue("do");
    const body = this.parseStatement();
    node.body = body;
    this.expectValue("while");
    this.expectValue("(");
    const test = this.parseExpr();
    node.left = test;
    this.expectValue(")");
    if ( this.matchValue(";") ) {
      this.advance();
    }
    return node;
  };
  parseThrow () {
    const node = new TSNode();
    node.nodeType = "ThrowStatement";
    const startTok = this.peek();
    node.start = startTok.start;
    node.line = startTok.line;
    node.col = startTok.col;
    this.expectValue("throw");
    const arg = this.parseExpr();
    node.left = arg;
    if ( this.matchValue(";") ) {
      this.advance();
    }
    return node;
  };
  parseForStatement () {
    const node = new TSNode();
    const startTok = this.peek();
    node.start = startTok.start;
    node.line = startTok.line;
    node.col = startTok.col;
    this.expectValue("for");
    let isAwait = false;
    if ( this.matchValue("await") ) {
      this.advance();
      isAwait = true;
    }
    this.expectValue("(");
    const tokVal = this.peekValue();
    if ( ((tokVal == "let") || (tokVal == "const")) || (tokVal == "var") ) {
      const kind = tokVal;
      this.advance();
      const varName = this.expect("Identifier");
      const nextVal = this.peekValue();
      if ( nextVal == "of" ) {
        node.nodeType = "ForOfStatement";
        node.await = isAwait;
        this.advance();
        const left = new TSNode();
        left.nodeType = "VariableDeclaration";
        left.kind = kind;
        const declarator = new TSNode();
        declarator.nodeType = "VariableDeclarator";
        declarator.name = varName.value;
        left.children.push(declarator);
        node.left = left;
        const right = this.parseExpr();
        node.right = right;
        this.expectValue(")");
        const body = this.parseStatement();
        node.body = body;
        return node;
      }
      if ( nextVal == "in" ) {
        node.nodeType = "ForInStatement";
        this.advance();
        const left_1 = new TSNode();
        left_1.nodeType = "VariableDeclaration";
        left_1.kind = kind;
        const declarator_1 = new TSNode();
        declarator_1.nodeType = "VariableDeclarator";
        declarator_1.name = varName.value;
        left_1.children.push(declarator_1);
        node.left = left_1;
        const right_1 = this.parseExpr();
        node.right = right_1;
        this.expectValue(")");
        const body_1 = this.parseStatement();
        node.body = body_1;
        return node;
      }
      node.nodeType = "ForStatement";
      const initDecl = new TSNode();
      initDecl.nodeType = "VariableDeclaration";
      initDecl.kind = kind;
      const declarator_2 = new TSNode();
      declarator_2.nodeType = "VariableDeclarator";
      declarator_2.name = varName.value;
      if ( this.matchValue(":") ) {
        const typeAnnot = this.parseTypeAnnotation();
        declarator_2.typeAnnotation = typeAnnot;
      }
      if ( this.matchValue("=") ) {
        this.advance();
        const initVal = this.parseExpr();
        declarator_2.init = initVal;
      }
      initDecl.children.push(declarator_2);
      node.init = initDecl;
    } else {
      node.nodeType = "ForStatement";
      if ( this.matchValue(";") == false ) {
        const initExpr = this.parseExpr();
        node.init = initExpr;
      }
    }
    this.expectValue(";");
    if ( this.matchValue(";") == false ) {
      const test = this.parseExpr();
      node.left = test;
    }
    this.expectValue(";");
    if ( this.matchValue(")") == false ) {
      const update = this.parseExpr();
      node.right = update;
    }
    this.expectValue(")");
    const body_2 = this.parseStatement();
    node.body = body_2;
    return node;
  };
  parseSwitchStatement () {
    const node = new TSNode();
    node.nodeType = "SwitchStatement";
    const startTok = this.peek();
    node.start = startTok.start;
    node.line = startTok.line;
    node.col = startTok.col;
    this.expectValue("switch");
    this.expectValue("(");
    const discriminant = this.parseExpr();
    node.left = discriminant;
    this.expectValue(")");
    this.expectValue("{");
    while ((this.matchValue("}") == false) && (this.isAtEnd() == false)) {
      const caseNode = new TSNode();
      if ( this.matchValue("case") ) {
        caseNode.nodeType = "SwitchCase";
        this.advance();
        const test = this.parseExpr();
        caseNode.left = test;
        this.expectValue(":");
      }
      if ( this.matchValue("default") ) {
        caseNode.nodeType = "SwitchCase";
        caseNode.kind = "default";
        this.advance();
        this.expectValue(":");
      }
      while ((((this.matchValue("case") == false) && (this.matchValue("default") == false)) && (this.matchValue("}") == false)) && (this.isAtEnd() == false)) {
        if ( this.matchValue("break") ) {
          const breakNode = new TSNode();
          breakNode.nodeType = "BreakStatement";
          this.advance();
          if ( this.matchValue(";") ) {
            this.advance();
          }
          caseNode.children.push(breakNode);
        } else {
          const stmt = this.parseStatement();
          caseNode.children.push(stmt);
        }
      };
      node.children.push(caseNode);
    };
    this.expectValue("}");
    return node;
  };
  parseTryStatement () {
    const node = new TSNode();
    node.nodeType = "TryStatement";
    const startTok = this.peek();
    node.start = startTok.start;
    node.line = startTok.line;
    node.col = startTok.col;
    this.expectValue("try");
    const tryBlock = this.parseBlock();
    node.body = tryBlock;
    if ( this.matchValue("catch") ) {
      const catchNode = new TSNode();
      catchNode.nodeType = "CatchClause";
      this.advance();
      if ( this.matchValue("(") ) {
        this.advance();
        const param = this.expect("Identifier");
        catchNode.name = param.value;
        if ( this.matchValue(":") ) {
          const typeAnnot = this.parseTypeAnnotation();
          catchNode.typeAnnotation = typeAnnot;
        }
        this.expectValue(")");
      }
      const catchBlock = this.parseBlock();
      catchNode.body = catchBlock;
      node.left = catchNode;
    }
    if ( this.matchValue("finally") ) {
      this.advance();
      const finallyBlock = this.parseBlock();
      node.right = finallyBlock;
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
    const nextVal = this.peekValue();
    if ( nextVal == "{" ) {
      const pattern = this.parseObjectPattern();
      declarator.left = pattern;
      declarator.start = pattern.start;
      declarator.line = pattern.line;
      declarator.col = pattern.col;
    } else {
      if ( nextVal == "[" ) {
        const pattern_1 = this.parseArrayPattern();
        declarator.left = pattern_1;
        declarator.start = pattern_1.start;
        declarator.line = pattern_1.line;
        declarator.col = pattern_1.col;
      } else {
        const nameTok = this.expect("Identifier");
        declarator.name = nameTok.value;
        declarator.start = nameTok.start;
        declarator.line = nameTok.line;
        declarator.col = nameTok.col;
      }
    }
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
  parseObjectPattern () {
    const node = new TSNode();
    node.nodeType = "ObjectPattern";
    const startTok = this.peek();
    node.start = startTok.start;
    node.line = startTok.line;
    node.col = startTok.col;
    this.expectValue("{");
    while ((this.matchValue("}") == false) && (this.isAtEnd() == false)) {
      if ( (node.children.length) > 0 ) {
        this.expectValue(",");
        if ( this.matchValue("}") ) {
          break;
        }
      }
      if ( this.matchValue("...") ) {
        this.advance();
        const restProp = new TSNode();
        restProp.nodeType = "RestElement";
        const restName = this.expect("Identifier");
        restProp.name = restName.value;
        node.children.push(restProp);
      } else {
        const prop = new TSNode();
        prop.nodeType = "Property";
        const keyTok = this.expect("Identifier");
        prop.name = keyTok.value;
        if ( this.matchValue(":") ) {
          this.advance();
          const valueTok = this.expect("Identifier");
          const valueId = new TSNode();
          valueId.nodeType = "Identifier";
          valueId.name = valueTok.value;
          prop.right = valueId;
        } else {
          prop.shorthand = true;
        }
        if ( this.matchValue("=") ) {
          this.advance();
          const defaultExpr = this.parseExpr();
          prop.init = defaultExpr;
          prop.left = defaultExpr;
        }
        node.children.push(prop);
      }
    };
    this.expectValue("}");
    return node;
  };
  parseArrayPattern () {
    const node = new TSNode();
    node.nodeType = "ArrayPattern";
    const startTok = this.peek();
    node.start = startTok.start;
    node.line = startTok.line;
    node.col = startTok.col;
    this.expectValue("[");
    while ((this.matchValue("]") == false) && (this.isAtEnd() == false)) {
      if ( (node.children.length) > 0 ) {
        this.expectValue(",");
        if ( this.matchValue("]") ) {
          break;
        }
      }
      if ( this.matchValue(",") ) {
        const hole = new TSNode();
        hole.nodeType = "Elision";
        node.children.push(hole);
      } else {
        if ( this.matchValue("...") ) {
          this.advance();
          const restElem = new TSNode();
          restElem.nodeType = "RestElement";
          const restName = this.expect("Identifier");
          restElem.name = restName.value;
          node.children.push(restElem);
        } else {
          const elem = new TSNode();
          const elemTok = this.expect("Identifier");
          elem.nodeType = "Identifier";
          elem.name = elemTok.value;
          if ( this.matchValue("=") ) {
            this.advance();
            const defaultExpr = this.parseExpr();
            const assignPat = new TSNode();
            assignPat.nodeType = "AssignmentPattern";
            assignPat.left = elem;
            assignPat.right = defaultExpr;
            node.children.push(assignPat);
          } else {
            node.children.push(elem);
          }
        }
      }
    };
    this.expectValue("]");
    return node;
  };
  parseFuncDecl (isAsync) {
    const node = new TSNode();
    node.nodeType = "FunctionDeclaration";
    const startTok = this.peek();
    node.start = startTok.start;
    node.line = startTok.line;
    node.col = startTok.col;
    if ( isAsync ) {
      node.async = true;
    }
    this.expectValue("function");
    if ( this.matchValue("*") ) {
      this.advance();
      node.generator = true;
    }
    const nameTok = this.expect("Identifier");
    node.name = nameTok.value;
    if ( this.matchValue("<") ) {
      const typeParams = this.parseTypeParams();
      for ( let i = 0; i < typeParams.length; i++) {
        var tp = typeParams[i];
        node.children.push(tp);
      };
    }
    this.expectValue("(");
    while ((this.matchValue(")") == false) && (this.isAtEnd() == false)) {
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
    let decorators = [];
    while (this.matchValue("@")) {
      const dec = this.parseDecorator();
      decorators.push(dec);
    };
    let isRest = false;
    if ( this.matchValue("...") ) {
      this.advance();
      isRest = true;
    }
    if ( this.matchValue("{") ) {
      const pattern = this.parseObjectPattern();
      for ( let i = 0; i < decorators.length; i++) {
        var d = decorators[i];
        pattern.decorators.push(d);
      };
      if ( isRest ) {
        const restElem = new TSNode();
        restElem.nodeType = "RestElement";
        restElem.left = pattern;
        return restElem;
      }
      return pattern;
    }
    if ( this.matchValue("[") ) {
      const pattern_1 = this.parseArrayPattern();
      for ( let i_1 = 0; i_1 < decorators.length; i_1++) {
        var d_1 = decorators[i_1];
        pattern_1.decorators.push(d_1);
      };
      if ( isRest ) {
        const restElem_1 = new TSNode();
        restElem_1.nodeType = "RestElement";
        restElem_1.left = pattern_1;
        return restElem_1;
      }
      return pattern_1;
    }
    const param = new TSNode();
    if ( isRest ) {
      param.nodeType = "RestElement";
      param.kind = "rest";
    } else {
      param.nodeType = "Parameter";
    }
    for ( let i_2 = 0; i_2 < decorators.length; i_2++) {
      var d_2 = decorators[i_2];
      param.decorators.push(d_2);
    };
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
    if ( this.matchValue("=") ) {
      this.advance();
      param.init = this.parseExpr();
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
    const nextVal = this.peekValue();
    if ( nextVal == "asserts" ) {
      const assertsTok = this.peek();
      this.advance();
      const predicate = new TSNode();
      predicate.nodeType = "TSTypePredicate";
      predicate.start = assertsTok.start;
      predicate.line = assertsTok.line;
      predicate.col = assertsTok.col;
      predicate.value = "asserts";
      const paramTok = this.expect("Identifier");
      predicate.name = paramTok.value;
      if ( this.matchValue("is") ) {
        this.advance();
        const assertType = this.parseType();
        predicate.typeAnnotation = assertType;
      }
      annot.typeAnnotation = predicate;
      return annot;
    }
    if ( this.matchType("Identifier") ) {
      const savedPos = this.pos;
      const savedTok = this.currentToken;
      const paramTok_1 = this.peek();
      this.advance();
      if ( this.matchValue("is") ) {
        this.advance();
        const predicate_1 = new TSNode();
        predicate_1.nodeType = "TSTypePredicate";
        predicate_1.start = paramTok_1.start;
        predicate_1.line = paramTok_1.line;
        predicate_1.col = paramTok_1.col;
        predicate_1.name = paramTok_1.value;
        const typeExpr = this.parseType();
        predicate_1.typeAnnotation = typeExpr;
        annot.typeAnnotation = predicate_1;
        return annot;
      }
      this.pos = savedPos;
      this.currentToken = savedTok;
    }
    const typeExpr_1 = this.parseType();
    annot.typeAnnotation = typeExpr_1;
    return annot;
  };
  parseType () {
    return this.parseConditionalType();
  };
  parseConditionalType () {
    const checkType = this.parseUnionType();
    if ( this.matchValue("extends") ) {
      this.advance();
      const extendsType = this.parseUnionType();
      if ( this.matchValue("?") ) {
        this.advance();
        const conditional = new TSNode();
        conditional.nodeType = "TSConditionalType";
        conditional.start = checkType.start;
        conditional.line = checkType.line;
        conditional.col = checkType.col;
        conditional.left = checkType;
        conditional.params.push(extendsType);
        conditional.body = this.parseUnionType();
        this.expectValue(":");
        conditional.right = this.parseUnionType();
        return conditional;
      }
      return checkType;
    }
    return checkType;
  };
  parseUnionType () {
    const left = this.parseIntersectionType();
    if ( this.matchValue("|") ) {
      const union = new TSNode();
      union.nodeType = "TSUnionType";
      union.start = left.start;
      union.line = left.line;
      union.col = left.col;
      union.children.push(left);
      while (this.matchValue("|")) {
        this.advance();
        const right = this.parseIntersectionType();
        union.children.push(right);
      };
      return union;
    }
    return left;
  };
  parseIntersectionType () {
    const left = this.parseArrayType();
    if ( this.matchValue("&") ) {
      const intersection = new TSNode();
      intersection.nodeType = "TSIntersectionType";
      intersection.start = left.start;
      intersection.line = left.line;
      intersection.col = left.col;
      intersection.children.push(left);
      while (this.matchValue("&")) {
        this.advance();
        const right = this.parseArrayType();
        intersection.children.push(right);
      };
      return intersection;
    }
    return left;
  };
  parseArrayType () {
    let elemType = this.parsePrimaryType();
    while (this.matchValue("[")) {
      if ( this.checkNext("]") ) {
        this.advance();
        this.advance();
        const arrayType = new TSNode();
        arrayType.nodeType = "TSArrayType";
        arrayType.start = elemType.start;
        arrayType.line = elemType.line;
        arrayType.col = elemType.col;
        arrayType.left = elemType;
        elemType = arrayType;
      } else {
        this.advance();
        const indexType = this.parseType();
        this.expectValue("]");
        const indexedAccess = new TSNode();
        indexedAccess.nodeType = "TSIndexedAccessType";
        indexedAccess.start = elemType.start;
        indexedAccess.line = elemType.line;
        indexedAccess.col = elemType.col;
        indexedAccess.left = elemType;
        indexedAccess.right = indexType;
        elemType = indexedAccess;
      }
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
    if ( tokVal == "keyof" ) {
      this.advance();
      const operand = this.parsePrimaryType();
      const node = new TSNode();
      node.nodeType = "TSTypeOperator";
      node.value = "keyof";
      node.start = tok.start;
      node.line = tok.line;
      node.col = tok.col;
      node.typeAnnotation = operand;
      return node;
    }
    if ( tokVal == "typeof" ) {
      this.advance();
      const operand_1 = this.parsePrimaryType();
      const node_1 = new TSNode();
      node_1.nodeType = "TSTypeQuery";
      node_1.value = "typeof";
      node_1.start = tok.start;
      node_1.line = tok.line;
      node_1.col = tok.col;
      node_1.typeAnnotation = operand_1;
      return node_1;
    }
    if ( tokVal == "infer" ) {
      this.advance();
      const paramTok = this.expect("Identifier");
      const node_2 = new TSNode();
      node_2.nodeType = "TSInferType";
      node_2.start = tok.start;
      node_2.line = tok.line;
      node_2.col = tok.col;
      const typeParam = new TSNode();
      typeParam.nodeType = "TSTypeParameter";
      typeParam.name = paramTok.value;
      node_2.typeAnnotation = typeParam;
      return node_2;
    }
    if ( tokVal == "string" ) {
      this.advance();
      const node_3 = new TSNode();
      node_3.nodeType = "TSStringKeyword";
      node_3.start = tok.start;
      node_3.end = tok.end;
      node_3.line = tok.line;
      node_3.col = tok.col;
      return node_3;
    }
    if ( tokVal == "number" ) {
      this.advance();
      const node_4 = new TSNode();
      node_4.nodeType = "TSNumberKeyword";
      node_4.start = tok.start;
      node_4.end = tok.end;
      node_4.line = tok.line;
      node_4.col = tok.col;
      return node_4;
    }
    if ( tokVal == "boolean" ) {
      this.advance();
      const node_5 = new TSNode();
      node_5.nodeType = "TSBooleanKeyword";
      node_5.start = tok.start;
      node_5.end = tok.end;
      node_5.line = tok.line;
      node_5.col = tok.col;
      return node_5;
    }
    if ( tokVal == "any" ) {
      this.advance();
      const node_6 = new TSNode();
      node_6.nodeType = "TSAnyKeyword";
      node_6.start = tok.start;
      node_6.end = tok.end;
      node_6.line = tok.line;
      node_6.col = tok.col;
      return node_6;
    }
    if ( tokVal == "unknown" ) {
      this.advance();
      const node_7 = new TSNode();
      node_7.nodeType = "TSUnknownKeyword";
      node_7.start = tok.start;
      node_7.end = tok.end;
      node_7.line = tok.line;
      node_7.col = tok.col;
      return node_7;
    }
    if ( tokVal == "void" ) {
      this.advance();
      const node_8 = new TSNode();
      node_8.nodeType = "TSVoidKeyword";
      node_8.start = tok.start;
      node_8.end = tok.end;
      node_8.line = tok.line;
      node_8.col = tok.col;
      return node_8;
    }
    if ( tokVal == "null" ) {
      this.advance();
      const node_9 = new TSNode();
      node_9.nodeType = "TSNullKeyword";
      node_9.start = tok.start;
      node_9.end = tok.end;
      node_9.line = tok.line;
      node_9.col = tok.col;
      return node_9;
    }
    if ( tokVal == "never" ) {
      this.advance();
      const node_10 = new TSNode();
      node_10.nodeType = "TSNeverKeyword";
      node_10.start = tok.start;
      node_10.end = tok.end;
      node_10.line = tok.line;
      node_10.col = tok.col;
      return node_10;
    }
    if ( tokVal == "undefined" ) {
      this.advance();
      const node_11 = new TSNode();
      node_11.nodeType = "TSUndefinedKeyword";
      node_11.start = tok.start;
      node_11.end = tok.end;
      node_11.line = tok.line;
      node_11.col = tok.col;
      return node_11;
    }
    const tokType = this.peekType();
    if ( tokType == "Identifier" ) {
      return this.parseTypeRef();
    }
    if ( tokType == "String" ) {
      this.advance();
      const node_12 = new TSNode();
      node_12.nodeType = "TSLiteralType";
      node_12.start = tok.start;
      node_12.end = tok.end;
      node_12.line = tok.line;
      node_12.col = tok.col;
      node_12.value = tok.value;
      node_12.kind = "string";
      return node_12;
    }
    if ( tokType == "Number" ) {
      this.advance();
      const node_13 = new TSNode();
      node_13.nodeType = "TSLiteralType";
      node_13.start = tok.start;
      node_13.end = tok.end;
      node_13.line = tok.line;
      node_13.col = tok.col;
      node_13.value = tok.value;
      node_13.kind = "number";
      return node_13;
    }
    if ( (tokVal == "true") || (tokVal == "false") ) {
      this.advance();
      const node_14 = new TSNode();
      node_14.nodeType = "TSLiteralType";
      node_14.start = tok.start;
      node_14.end = tok.end;
      node_14.line = tok.line;
      node_14.col = tok.col;
      node_14.value = tokVal;
      node_14.kind = "boolean";
      return node_14;
    }
    if ( tokType == "Template" ) {
      this.advance();
      const node_15 = new TSNode();
      node_15.nodeType = "TSTemplateLiteralType";
      node_15.start = tok.start;
      node_15.end = tok.end;
      node_15.line = tok.line;
      node_15.col = tok.col;
      node_15.value = tok.value;
      return node_15;
    }
    if ( tokVal == "new" ) {
      return this.parseConstructorType();
    }
    if ( tokVal == "import" ) {
      return this.parseImportType();
    }
    if ( tokVal == "(" ) {
      return this.parseParenOrFunctionType();
    }
    if ( tokVal == "[" ) {
      return this.parseTupleType();
    }
    if ( tokVal == "{" ) {
      return this.parseTypeLiteral();
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
      while ((this.matchValue(">") == false) && (this.isAtEnd() == false)) {
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
  parseTupleType () {
    const tuple = new TSNode();
    tuple.nodeType = "TSTupleType";
    const startTok = this.peek();
    tuple.start = startTok.start;
    tuple.line = startTok.line;
    tuple.col = startTok.col;
    this.expectValue("[");
    while ((this.matchValue("]") == false) && (this.isAtEnd() == false)) {
      if ( (tuple.children.length) > 0 ) {
        this.expectValue(",");
      }
      if ( this.matchValue("...") ) {
        const restTok = this.peek();
        this.advance();
        let restName = "";
        if ( this.matchType("Identifier") ) {
          const savedPos = this.pos;
          const savedTok = this.currentToken;
          const nameTok = this.peek();
          this.advance();
          if ( this.matchValue(":") ) {
            restName = nameTok.value;
            this.advance();
          } else {
            this.pos = savedPos;
            this.currentToken = savedTok;
          }
        }
        const innerType = this.parseType();
        const restType = new TSNode();
        restType.nodeType = "TSRestType";
        restType.start = restTok.start;
        restType.line = restTok.line;
        restType.col = restTok.col;
        restType.typeAnnotation = innerType;
        if ( restName != "" ) {
          restType.name = restName;
        }
        tuple.children.push(restType);
      } else {
        let isNamed = false;
        let elemName = "";
        let elemOptional = false;
        const elemStart = this.peek();
        if ( this.matchType("Identifier") ) {
          const savedPos_1 = this.pos;
          const savedTok_1 = this.currentToken;
          const nameTok_1 = this.peek();
          this.advance();
          if ( this.matchValue("?") ) {
            this.advance();
            elemOptional = true;
          }
          if ( this.matchValue(":") ) {
            isNamed = true;
            elemName = nameTok_1.value;
            this.advance();
          } else {
            this.pos = savedPos_1;
            this.currentToken = savedTok_1;
            elemOptional = false;
          }
        }
        const elemType = this.parseType();
        if ( isNamed ) {
          const namedElem = new TSNode();
          namedElem.nodeType = "TSNamedTupleMember";
          namedElem.start = elemStart.start;
          namedElem.line = elemStart.line;
          namedElem.col = elemStart.col;
          namedElem.name = elemName;
          namedElem.optional = elemOptional;
          namedElem.typeAnnotation = elemType;
          tuple.children.push(namedElem);
        } else {
          if ( this.matchValue("?") ) {
            this.advance();
            const optType = new TSNode();
            optType.nodeType = "TSOptionalType";
            optType.start = elemType.start;
            optType.line = elemType.line;
            optType.col = elemType.col;
            optType.typeAnnotation = elemType;
            tuple.children.push(optType);
          } else {
            tuple.children.push(elemType);
          }
        }
      }
    };
    this.expectValue("]");
    return tuple;
  };
  parseParenOrFunctionType () {
    const startTok = this.peek();
    const startPos = startTok.start;
    const startLine = startTok.line;
    const startCol = startTok.col;
    this.expectValue("(");
    if ( this.matchValue(")") ) {
      this.advance();
      if ( this.matchValue("=>") ) {
        this.advance();
        const returnType = this.parseType();
        const funcType = new TSNode();
        funcType.nodeType = "TSFunctionType";
        funcType.start = startPos;
        funcType.line = startLine;
        funcType.col = startCol;
        funcType.typeAnnotation = returnType;
        return funcType;
      }
      const voidNode = new TSNode();
      voidNode.nodeType = "TSVoidKeyword";
      return voidNode;
    }
    const isIdentifier = this.matchType("Identifier");
    if ( isIdentifier ) {
      const savedPos = this.pos;
      const savedToken = this.currentToken;
      this.advance();
      if ( this.matchValue(":") || this.matchValue("?") ) {
        this.pos = savedPos;
        this.currentToken = savedToken;
        return this.parseFunctionType(startPos, startLine, startCol);
      }
      if ( this.matchValue(",") ) {
        const savedPos2 = this.pos;
        const savedToken2 = this.currentToken;
        let depth = 1;
        while ((depth > 0) && (this.isAtEnd() == false)) {
          if ( this.matchValue("(") ) {
            depth = depth + 1;
          }
          if ( this.matchValue(")") ) {
            depth = depth - 1;
          }
          if ( depth > 0 ) {
            this.advance();
          }
        };
        if ( this.matchValue(")") ) {
          this.advance();
          if ( this.matchValue("=>") ) {
            this.pos = savedPos;
            this.currentToken = savedToken;
            return this.parseFunctionType(startPos, startLine, startCol);
          }
        }
        this.pos = savedPos;
        this.currentToken = savedToken;
      }
      this.pos = savedPos;
      this.currentToken = savedToken;
    }
    const innerType = this.parseType();
    this.expectValue(")");
    if ( this.matchValue("=>") ) {
      this.advance();
      const returnType_1 = this.parseType();
      const funcType_1 = new TSNode();
      funcType_1.nodeType = "TSFunctionType";
      funcType_1.start = startPos;
      funcType_1.line = startLine;
      funcType_1.col = startCol;
      funcType_1.typeAnnotation = returnType_1;
      return funcType_1;
    }
    return innerType;
  };
  parseFunctionType (startPos, startLine, startCol) {
    const funcType = new TSNode();
    funcType.nodeType = "TSFunctionType";
    funcType.start = startPos;
    funcType.line = startLine;
    funcType.col = startCol;
    while ((this.matchValue(")") == false) && (this.isAtEnd() == false)) {
      if ( (funcType.params.length) > 0 ) {
        this.expectValue(",");
      }
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
      funcType.params.push(param);
    };
    this.expectValue(")");
    if ( this.matchValue("=>") ) {
      this.advance();
      const returnType = this.parseType();
      funcType.typeAnnotation = returnType;
    }
    return funcType;
  };
  parseConstructorType () {
    const ctorType = new TSNode();
    ctorType.nodeType = "TSConstructorType";
    const startTok = this.peek();
    ctorType.start = startTok.start;
    ctorType.line = startTok.line;
    ctorType.col = startTok.col;
    this.expectValue("new");
    if ( this.matchValue("<") ) {
      const typeParams = this.parseTypeParams();
      ctorType.children = typeParams;
    }
    this.expectValue("(");
    while ((this.matchValue(")") == false) && (this.isAtEnd() == false)) {
      if ( (ctorType.params.length) > 0 ) {
        this.expectValue(",");
      }
      const param = this.parseParam();
      ctorType.params.push(param);
    };
    this.expectValue(")");
    if ( this.matchValue("=>") ) {
      this.advance();
      const returnType = this.parseType();
      ctorType.typeAnnotation = returnType;
    }
    return ctorType;
  };
  parseImportType () {
    const importType = new TSNode();
    importType.nodeType = "TSImportType";
    const startTok = this.peek();
    importType.start = startTok.start;
    importType.line = startTok.line;
    importType.col = startTok.col;
    this.expectValue("import");
    this.expectValue("(");
    const sourceTok = this.expect("String");
    importType.value = sourceTok.value;
    this.expectValue(")");
    if ( this.matchValue(".") ) {
      this.advance();
      const memberTok = this.expect("Identifier");
      importType.name = memberTok.value;
      if ( this.matchValue("<") ) {
        this.advance();
        while ((this.matchValue(">") == false) && (this.isAtEnd() == false)) {
          if ( (importType.params.length) > 0 ) {
            this.expectValue(",");
          }
          const typeArg = this.parseType();
          importType.params.push(typeArg);
        };
        this.expectValue(">");
      }
    }
    return importType;
  };
  parseTypeLiteral () {
    const literal = new TSNode();
    literal.nodeType = "TSTypeLiteral";
    const startTok = this.peek();
    literal.start = startTok.start;
    literal.line = startTok.line;
    literal.col = startTok.col;
    this.expectValue("{");
    while ((this.matchValue("}") == false) && (this.isAtEnd() == false)) {
      const member = this.parseTypeLiteralMember();
      literal.children.push(member);
      if ( this.matchValue(";") || this.matchValue(",") ) {
        this.advance();
      }
    };
    this.expectValue("}");
    return literal;
  };
  parseTypeLiteralMember () {
    const startTok = this.peek();
    const startPos = startTok.start;
    const startLine = startTok.line;
    const startCol = startTok.col;
    let isReadonly = false;
    if ( this.matchValue("readonly") ) {
      isReadonly = true;
      this.advance();
    }
    let readonlyModifier = "";
    if ( this.matchValue("+") || this.matchValue("-") ) {
      readonlyModifier = this.peekValue();
      this.advance();
      if ( this.matchValue("readonly") ) {
        isReadonly = true;
        this.advance();
      }
    }
    if ( this.matchValue("[") ) {
      this.advance();
      const paramName = this.expect("Identifier");
      if ( this.matchValue("in") ) {
        return this.parseMappedType(isReadonly, readonlyModifier, paramName.value, startPos, startLine, startCol);
      }
      return this.parseIndexSignatureRest(isReadonly, paramName, startPos, startLine, startCol);
    }
    const nameTok = this.expect("Identifier");
    const memberName = nameTok.value;
    let isOptional = false;
    if ( this.matchValue("?") ) {
      isOptional = true;
      this.advance();
    }
    if ( this.matchValue("(") ) {
      return this.parseMethodSignature(memberName, isOptional, startPos, startLine, startCol);
    }
    const prop = new TSNode();
    prop.nodeType = "TSPropertySignature";
    prop.start = startPos;
    prop.line = startLine;
    prop.col = startCol;
    prop.name = memberName;
    prop.readonly = isReadonly;
    prop.optional = isOptional;
    if ( this.matchValue(":") ) {
      const typeAnnot = this.parseTypeAnnotation();
      prop.typeAnnotation = typeAnnot;
    }
    return prop;
  };
  parseMappedType (isReadonly, readonlyMod, paramName, startPos, startLine, startCol) {
    const mapped = new TSNode();
    mapped.nodeType = "TSMappedType";
    mapped.start = startPos;
    mapped.line = startLine;
    mapped.col = startCol;
    mapped.readonly = isReadonly;
    if ( readonlyMod != "" ) {
      mapped.kind = readonlyMod;
    }
    this.expectValue("in");
    const typeParam = new TSNode();
    typeParam.nodeType = "TSTypeParameter";
    typeParam.name = paramName;
    const constraint = this.parseType();
    typeParam.typeAnnotation = constraint;
    mapped.params.push(typeParam);
    if ( this.matchValue("as") ) {
      this.advance();
      const nameType = this.parseType();
      mapped.right = nameType;
    }
    this.expectValue("]");
    let optionalMod = "";
    if ( this.matchValue("+") || this.matchValue("-") ) {
      optionalMod = this.peekValue();
      this.advance();
    }
    if ( this.matchValue("?") ) {
      mapped.optional = true;
      if ( optionalMod != "" ) {
        mapped.value = optionalMod;
      }
      this.advance();
    }
    if ( this.matchValue(":") ) {
      this.advance();
      const valueType = this.parseType();
      mapped.typeAnnotation = valueType;
    }
    return mapped;
  };
  parseIndexSignatureRest (isReadonly, paramTok, startPos, startLine, startCol) {
    const indexSig = new TSNode();
    indexSig.nodeType = "TSIndexSignature";
    indexSig.start = startPos;
    indexSig.line = startLine;
    indexSig.col = startCol;
    indexSig.readonly = isReadonly;
    const param = new TSNode();
    param.nodeType = "Parameter";
    param.name = paramTok.value;
    param.start = paramTok.start;
    param.line = paramTok.line;
    param.col = paramTok.col;
    if ( this.matchValue(":") ) {
      const typeAnnot = this.parseTypeAnnotation();
      param.typeAnnotation = typeAnnot;
    }
    indexSig.params.push(param);
    this.expectValue("]");
    if ( this.matchValue(":") ) {
      const typeAnnot_1 = this.parseTypeAnnotation();
      indexSig.typeAnnotation = typeAnnot_1;
    }
    return indexSig;
  };
  parseMethodSignature (methodName, isOptional, startPos, startLine, startCol) {
    const method = new TSNode();
    method.nodeType = "TSMethodSignature";
    method.start = startPos;
    method.line = startLine;
    method.col = startCol;
    method.name = methodName;
    method.optional = isOptional;
    this.expectValue("(");
    while ((this.matchValue(")") == false) && (this.isAtEnd() == false)) {
      if ( (method.params.length) > 0 ) {
        this.expectValue(",");
      }
      const param = this.parseParam();
      method.params.push(param);
    };
    this.expectValue(")");
    if ( this.matchValue(":") ) {
      const returnType = this.parseTypeAnnotation();
      method.typeAnnotation = returnType;
    }
    return method;
  };
  parseExpr () {
    return this.parseAssign();
  };
  parseAssign () {
    const left = this.parseNullishCoalescing();
    const tokVal = this.peekValue();
    if ( tokVal == "=" ) {
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
    if ( ((tokVal == "&&=") || (tokVal == "||=")) || (tokVal == "??=") ) {
      this.advance();
      const right_1 = this.parseAssign();
      const assign_1 = new TSNode();
      assign_1.nodeType = "AssignmentExpression";
      assign_1.value = tokVal;
      assign_1.left = left;
      assign_1.right = right_1;
      assign_1.start = left.start;
      assign_1.line = left.line;
      assign_1.col = left.col;
      return assign_1;
    }
    return left;
  };
  parseNullishCoalescing () {
    let left = this.parseTernary();
    while (this.matchValue("??")) {
      this.advance();
      const right = this.parseTernary();
      const nullish = new TSNode();
      nullish.nodeType = "LogicalExpression";
      nullish.value = "??";
      nullish.left = left;
      nullish.right = right;
      nullish.start = left.start;
      nullish.line = left.line;
      nullish.col = left.col;
      left = nullish;
    };
    return left;
  };
  parseTernary () {
    const testExpr = this.parseLogicalOr();
    if ( this.matchValue("?") ) {
      this.advance();
      const consequentExpr = this.parseAssign();
      if ( this.matchValue(":") ) {
        this.advance();
        const alternateExpr = this.parseAssign();
        const cond = new TSNode();
        cond.nodeType = "ConditionalExpression";
        cond.start = testExpr.start;
        cond.line = testExpr.line;
        cond.col = testExpr.col;
        cond.left = testExpr;
        cond.test = testExpr;
        cond.consequent = consequentExpr;
        cond.alternate = alternateExpr;
        return cond;
      }
    }
    return testExpr;
  };
  parseLogicalOr () {
    let left = this.parseLogicalAnd();
    while (this.matchValue("||")) {
      this.advance();
      const right = this.parseLogicalAnd();
      const expr = new TSNode();
      expr.nodeType = "BinaryExpression";
      expr.value = "||";
      expr.left = left;
      expr.right = right;
      expr.start = left.start;
      expr.line = left.line;
      expr.col = left.col;
      left = expr;
    };
    return left;
  };
  parseLogicalAnd () {
    let left = this.parseEquality();
    while (this.matchValue("&&")) {
      this.advance();
      const right = this.parseEquality();
      const expr = new TSNode();
      expr.nodeType = "BinaryExpression";
      expr.value = "&&";
      expr.left = left;
      expr.right = right;
      expr.start = left.start;
      expr.line = left.line;
      expr.col = left.col;
      left = expr;
    };
    return left;
  };
  parseEquality () {
    let left = this.parseComparison();
    let tokVal = this.peekValue();
    while ((((tokVal == "==") || (tokVal == "!=")) || (tokVal == "===")) || (tokVal == "!==")) {
      const opTok = this.peek();
      this.advance();
      const right = this.parseComparison();
      const expr = new TSNode();
      expr.nodeType = "BinaryExpression";
      expr.value = opTok.value;
      expr.left = left;
      expr.right = right;
      expr.start = left.start;
      expr.line = left.line;
      expr.col = left.col;
      left = expr;
      tokVal = this.peekValue();
    };
    return left;
  };
  parseComparison () {
    let left = this.parseAdditive();
    let tokVal = this.peekValue();
    while ((((tokVal == "<") || (tokVal == ">")) || (tokVal == "<=")) || (tokVal == ">=")) {
      if ( tokVal == "<" ) {
        if ( this.tsxMode == true ) {
          if ( left.nodeType == "Identifier" ) {
            if ( this.startsWithLowerCase(left.name) ) {
              if ( this.looksLikeGenericCall() ) {
                return left;
              }
            }
          }
        }
      }
      const opTok = this.peek();
      this.advance();
      const right = this.parseAdditive();
      const expr = new TSNode();
      expr.nodeType = "BinaryExpression";
      expr.value = opTok.value;
      expr.left = left;
      expr.right = right;
      expr.start = left.start;
      expr.line = left.line;
      expr.col = left.col;
      left = expr;
      tokVal = this.peekValue();
    };
    return left;
  };
  parseAdditive () {
    let left = this.parseMultiplicative();
    let tokVal = this.peekValue();
    while ((tokVal == "+") || (tokVal == "-")) {
      const opTok = this.peek();
      this.advance();
      const right = this.parseMultiplicative();
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
  parseMultiplicative () {
    let left = this.parseUnary();
    let tokVal = this.peekValue();
    while ((((tokVal == "*") || (tokVal == "/")) || (tokVal == "%")) || (tokVal == "**")) {
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
    if ( tokVal == "yield" ) {
      const yieldTok = this.peek();
      this.advance();
      const yieldExpr = new TSNode();
      yieldExpr.nodeType = "YieldExpression";
      yieldExpr.start = yieldTok.start;
      yieldExpr.line = yieldTok.line;
      yieldExpr.col = yieldTok.col;
      if ( this.matchValue("*") ) {
        this.advance();
        yieldExpr.delegate = true;
      }
      const nextVal = this.peekValue();
      if ( (((nextVal != ";") && (nextVal != "}")) && (nextVal != ",")) && (nextVal != ")") ) {
        yieldExpr.left = this.parseAssign();
      }
      return yieldExpr;
    }
    if ( tokVal == "await" ) {
      const awaitTok = this.peek();
      this.advance();
      const arg_1 = this.parseUnary();
      const awaitExpr = new TSNode();
      awaitExpr.nodeType = "AwaitExpression";
      awaitExpr.left = arg_1;
      awaitExpr.start = awaitTok.start;
      awaitExpr.line = awaitTok.line;
      awaitExpr.col = awaitTok.col;
      return awaitExpr;
    }
    if ( tokVal == "<" ) {
      if ( this.tsxMode == true ) {
        const peekNext = this.peekNextValue();
        const peekNextT = this.peekNextType();
        if ( peekNext == ">" ) {
          return this.parsePostfix();
        }
        if ( peekNextT == "Identifier" ) {
          const peekTwoAhead = this.peekAheadValue(2);
          if ( peekTwoAhead != "extends" ) {
            return this.parsePostfix();
          }
        }
      }
      const startTok = this.peek();
      this.advance();
      const nextType = this.peekType();
      if ( ((nextType == "Identifier") || (nextType == "Keyword")) || (nextType == "TSType") ) {
        const typeNode = this.parseType();
        if ( this.matchValue(">") ) {
          this.advance();
          const arg_2 = this.parseUnary();
          const assertion = new TSNode();
          assertion.nodeType = "TSTypeAssertion";
          assertion.typeAnnotation = typeNode;
          assertion.left = arg_2;
          assertion.start = startTok.start;
          assertion.line = startTok.line;
          assertion.col = startTok.col;
          return assertion;
        }
      }
    }
    return this.parsePostfix();
  };
  parsePostfix () {
    let expr = this.parsePrimary();
    let keepParsing = true;
    while (keepParsing) {
      let tokVal = this.peekValue();
      if ( tokVal == "<" ) {
        let shouldParseAsGenericCall = false;
        if ( this.tsxMode == false ) {
          const next1 = this.peekAheadValue(1);
          const next2 = this.peekAheadValue(2);
          if ( ((next2 == ">") || (next2 == ",")) || (next2 == "extends") ) {
            shouldParseAsGenericCall = true;
          }
        } else {
          if ( expr.nodeType == "Identifier" ) {
            if ( this.startsWithLowerCase(expr.name) ) {
              if ( this.looksLikeGenericCall() ) {
                shouldParseAsGenericCall = true;
              }
            }
          }
          if ( expr.nodeType == "MemberExpression" ) {
            if ( this.looksLikeGenericCall() ) {
              shouldParseAsGenericCall = true;
            }
          }
        }
        if ( shouldParseAsGenericCall ) {
          this.advance();
          const call = new TSNode();
          call.nodeType = "CallExpression";
          call.left = expr;
          call.start = expr.start;
          call.line = expr.line;
          call.col = expr.col;
          while ((this.matchValue(">") == false) && (this.isAtEnd() == false)) {
            if ( (call.params.length) > 0 ) {
              this.expectValue(",");
            }
            const typeArg = this.parseType();
            call.params.push(typeArg);
          };
          this.expectValue(">");
          if ( this.matchValue("(") ) {
            this.advance();
            while ((this.matchValue(")") == false) && (this.isAtEnd() == false)) {
              if ( (call.children.length) > 0 ) {
                this.expectValue(",");
              }
              if ( this.matchValue("...") ) {
                this.advance();
                const spreadArg = this.parseExpr();
                const spread = new TSNode();
                spread.nodeType = "SpreadElement";
                spread.left = spreadArg;
                call.children.push(spread);
              } else {
                const arg = this.parseExpr();
                call.children.push(arg);
              }
            };
            this.expectValue(")");
            expr = call;
          }
        }
      }
      tokVal = this.peekValue();
      if ( tokVal == "(" ) {
        this.advance();
        const call_1 = new TSNode();
        call_1.nodeType = "CallExpression";
        call_1.left = expr;
        call_1.start = expr.start;
        call_1.line = expr.line;
        call_1.col = expr.col;
        while ((this.matchValue(")") == false) && (this.isAtEnd() == false)) {
          if ( (call_1.children.length) > 0 ) {
            this.expectValue(",");
          }
          if ( this.matchValue("...") ) {
            this.advance();
            const spreadArg_1 = this.parseExpr();
            const spread_1 = new TSNode();
            spread_1.nodeType = "SpreadElement";
            spread_1.left = spreadArg_1;
            call_1.children.push(spread_1);
          } else {
            const arg_1 = this.parseExpr();
            call_1.children.push(arg_1);
          }
        };
        this.expectValue(")");
        expr = call_1;
      }
      if ( tokVal == "." ) {
        this.advance();
        const propTok = this.expect("Identifier");
        const member = new TSNode();
        member.nodeType = "MemberExpression";
        member.left = expr;
        member.name = propTok.value;
        member.start = expr.start;
        member.line = expr.line;
        member.col = expr.col;
        expr = member;
      }
      if ( tokVal == "?." ) {
        this.advance();
        const nextTokVal = this.peekValue();
        if ( nextTokVal == "(" ) {
          this.advance();
          const optCall = new TSNode();
          optCall.nodeType = "OptionalCallExpression";
          optCall.optional = true;
          optCall.left = expr;
          optCall.start = expr.start;
          optCall.line = expr.line;
          optCall.col = expr.col;
          while ((this.matchValue(")") == false) && (this.isAtEnd() == false)) {
            if ( (optCall.children.length) > 0 ) {
              this.expectValue(",");
            }
            const arg_2 = this.parseExpr();
            optCall.children.push(arg_2);
          };
          this.expectValue(")");
          expr = optCall;
        }
        if ( nextTokVal == "[" ) {
          this.advance();
          const indexExpr = this.parseExpr();
          this.expectValue("]");
          const optIndex = new TSNode();
          optIndex.nodeType = "OptionalMemberExpression";
          optIndex.optional = true;
          optIndex.left = expr;
          optIndex.right = indexExpr;
          optIndex.start = expr.start;
          optIndex.line = expr.line;
          optIndex.col = expr.col;
          expr = optIndex;
        }
        if ( this.matchType("Identifier") ) {
          const propTok_1 = this.expect("Identifier");
          const optMember = new TSNode();
          optMember.nodeType = "OptionalMemberExpression";
          optMember.optional = true;
          optMember.left = expr;
          optMember.name = propTok_1.value;
          optMember.start = expr.start;
          optMember.line = expr.line;
          optMember.col = expr.col;
          expr = optMember;
        }
      }
      if ( tokVal == "[" ) {
        this.advance();
        const indexExpr_1 = this.parseExpr();
        this.expectValue("]");
        const computed = new TSNode();
        computed.nodeType = "MemberExpression";
        computed.left = expr;
        computed.right = indexExpr_1;
        computed.start = expr.start;
        computed.line = expr.line;
        computed.col = expr.col;
        expr = computed;
      }
      if ( tokVal == "!" ) {
        const tok = this.peek();
        this.advance();
        const nonNull = new TSNode();
        nonNull.nodeType = "TSNonNullExpression";
        nonNull.left = expr;
        nonNull.start = expr.start;
        nonNull.line = expr.line;
        nonNull.col = tok.col;
        expr = nonNull;
      }
      if ( tokVal == "as" ) {
        this.advance();
        const asType = this.parseType();
        const assertion = new TSNode();
        assertion.nodeType = "TSAsExpression";
        assertion.left = expr;
        assertion.typeAnnotation = asType;
        assertion.start = expr.start;
        assertion.line = expr.line;
        assertion.col = expr.col;
        expr = assertion;
      }
      if ( tokVal == "satisfies" ) {
        this.advance();
        const satisfiesType = this.parseType();
        const satisfiesExpr = new TSNode();
        satisfiesExpr.nodeType = "TSSatisfiesExpression";
        satisfiesExpr.left = expr;
        satisfiesExpr.typeAnnotation = satisfiesType;
        satisfiesExpr.start = expr.start;
        satisfiesExpr.line = expr.line;
        satisfiesExpr.col = expr.col;
        expr = satisfiesExpr;
      }
      const tokType = this.peekType();
      if ( tokType == "Template" ) {
        const quasi = this.parseTemplateLiteral();
        const tagged = new TSNode();
        tagged.nodeType = "TaggedTemplateExpression";
        tagged.left = expr;
        tagged.right = quasi;
        tagged.start = expr.start;
        tagged.line = expr.line;
        tagged.col = expr.col;
        expr = tagged;
      }
      const newTokVal = this.peekValue();
      const newTokType = this.peekType();
      if ( (((((((newTokVal != "(") && (newTokVal != ".")) && (newTokVal != "?.")) && (newTokVal != "[")) && (newTokVal != "!")) && (newTokVal != "as")) && (newTokVal != "satisfies")) && (newTokType != "Template") ) {
        keepParsing = false;
      }
    };
    return expr;
  };
  parsePrimary () {
    const tokType = this.peekType();
    const tokVal = this.peekValue();
    const tok = this.peek();
    if ( (tokType == "Identifier") || (tokType == "TSType") ) {
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
    if ( tokType == "BigInt" ) {
      this.advance();
      const bigint = new TSNode();
      bigint.nodeType = "BigIntLiteral";
      bigint.value = tok.value;
      bigint.start = tok.start;
      bigint.end = tok.end;
      bigint.line = tok.line;
      bigint.col = tok.col;
      return bigint;
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
    if ( tokType == "Template" ) {
      return this.parseTemplateLiteral();
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
    if ( tokVal == "null" ) {
      this.advance();
      const nullLit = new TSNode();
      nullLit.nodeType = "NullLiteral";
      nullLit.start = tok.start;
      nullLit.end = tok.end;
      nullLit.line = tok.line;
      nullLit.col = tok.col;
      return nullLit;
    }
    if ( tokVal == "undefined" ) {
      this.advance();
      const undefId = new TSNode();
      undefId.nodeType = "Identifier";
      undefId.name = "undefined";
      undefId.start = tok.start;
      undefId.end = tok.end;
      undefId.line = tok.line;
      undefId.col = tok.col;
      return undefId;
    }
    if ( tokVal == "[" ) {
      return this.parseArrayLiteral();
    }
    if ( tokVal == "{" ) {
      return this.parseObjectLiteral();
    }
    if ( (this.tsxMode == true) && (tokVal == "<") ) {
      const nextType = this.peekNextType();
      const nextVal = this.peekNextValue();
      if ( nextVal == ">" ) {
        return this.parseJSXFragment();
      }
      if ( (nextType == "Identifier") || (nextType == "Keyword") ) {
        const peekTwoAhead = this.peekAheadValue(2);
        if ( peekTwoAhead != "extends" ) {
          return this.parseJSXElement();
        }
      }
    }
    if ( tokVal == "(" ) {
      return this.parseParenOrArrow();
    }
    if ( tokVal == "async" ) {
      const nextVal_1 = this.peekNextValue();
      const nextType_1 = this.peekNextType();
      if ( (nextVal_1 == "(") || (nextType_1 == "Identifier") ) {
        return this.parseArrowFunction();
      }
    }
    if ( tokVal == "new" ) {
      return this.parseNewExpression();
    }
    if ( tokVal == "import" ) {
      const importTok = this.peek();
      this.advance();
      if ( this.matchValue(".") ) {
        this.advance();
        if ( this.matchValue("meta") ) {
          this.advance();
          const metaProp = new TSNode();
          metaProp.nodeType = "MetaProperty";
          metaProp.name = "import";
          metaProp.value = "meta";
          metaProp.start = importTok.start;
          metaProp.line = importTok.line;
          metaProp.col = importTok.col;
          return metaProp;
        }
      }
      if ( this.matchValue("(") ) {
        this.advance();
        const source = this.parseExpr();
        this.expectValue(")");
        const importExpr = new TSNode();
        importExpr.nodeType = "ImportExpression";
        importExpr.left = source;
        importExpr.start = importTok.start;
        importExpr.line = importTok.line;
        importExpr.col = importTok.col;
        return importExpr;
      }
    }
    if ( tokVal == "this" ) {
      this.advance();
      const thisExpr = new TSNode();
      thisExpr.nodeType = "ThisExpression";
      thisExpr.start = tok.start;
      thisExpr.end = tok.end;
      thisExpr.line = tok.line;
      thisExpr.col = tok.col;
      return thisExpr;
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
  parseTemplateLiteral () {
    const node = new TSNode();
    node.nodeType = "TemplateLiteral";
    const tok = this.peek();
    node.start = tok.start;
    node.line = tok.line;
    node.col = tok.col;
    this.advance();
    const quasi = new TSNode();
    quasi.nodeType = "TemplateElement";
    quasi.value = tok.value;
    node.children.push(quasi);
    return node;
  };
  parseArrayLiteral () {
    const node = new TSNode();
    node.nodeType = "ArrayExpression";
    const tok = this.peek();
    node.start = tok.start;
    node.line = tok.line;
    node.col = tok.col;
    this.expectValue("[");
    while ((this.matchValue("]") == false) && (this.isAtEnd() == false)) {
      if ( this.matchValue("...") ) {
        this.advance();
        const spreadArg = this.parseExpr();
        const spread = new TSNode();
        spread.nodeType = "SpreadElement";
        spread.left = spreadArg;
        node.children.push(spread);
      } else {
        if ( this.matchValue(",") ) {
        } else {
          const elem = this.parseExpr();
          node.children.push(elem);
        }
      }
      if ( this.matchValue(",") ) {
        this.advance();
      }
    };
    this.expectValue("]");
    return node;
  };
  parseObjectLiteral () {
    const node = new TSNode();
    node.nodeType = "ObjectExpression";
    const tok = this.peek();
    node.start = tok.start;
    node.line = tok.line;
    node.col = tok.col;
    this.expectValue("{");
    while ((this.matchValue("}") == false) && (this.isAtEnd() == false)) {
      if ( this.matchValue("...") ) {
        this.advance();
        const spreadArg = this.parseExpr();
        const spread = new TSNode();
        spread.nodeType = "SpreadElement";
        spread.left = spreadArg;
        node.children.push(spread);
      } else {
        const prop = new TSNode();
        prop.nodeType = "Property";
        let isComputed = false;
        let isMethod = false;
        let isGetter = false;
        let isSetter = false;
        let currVal = this.peekValue();
        let nextType = this.peekNextType();
        let nextVal = this.peekNextValue();
        if ( currVal == "async" ) {
          if ( ((nextType == "Identifier") || (nextVal == "[")) || (nextVal == "(") ) {
            this.advance();
            prop.async = true;
            currVal = this.peekValue();
            nextType = this.peekNextType();
            nextVal = this.peekNextValue();
          }
        }
        if ( currVal == "get" ) {
          if ( (nextType == "Identifier") || (nextVal == "[") ) {
            this.advance();
            isGetter = true;
            prop.kind = "get";
          }
        }
        if ( currVal == "set" ) {
          if ( (nextType == "Identifier") || (nextVal == "[") ) {
            this.advance();
            isSetter = true;
            prop.kind = "set";
          }
        }
        const keyTok = this.peek();
        if ( this.matchValue("[") ) {
          this.advance();
          const keyExpr = this.parseExpr();
          this.expectValue("]");
          prop.right = keyExpr;
          isComputed = true;
          prop.computed = true;
        }
        if ( this.matchType("Identifier") ) {
          prop.name = keyTok.value;
          this.advance();
        }
        if ( this.matchType("String") ) {
          prop.name = keyTok.value;
          this.advance();
        }
        if ( this.matchType("Number") ) {
          prop.name = keyTok.value;
          this.advance();
        }
        if ( this.matchValue("(") ) {
          isMethod = true;
          prop.method = true;
          const fnNode = new TSNode();
          fnNode.nodeType = "FunctionExpression";
          this.advance();
          while ((this.matchValue(")") == false) && (this.isAtEnd() == false)) {
            if ( (fnNode.params.length) > 0 ) {
              this.expectValue(",");
            }
            fnNode.params.push(this.parseParam());
          };
          this.expectValue(")");
          if ( this.matchValue(":") ) {
            this.advance();
            fnNode.typeAnnotation = this.parseType();
          }
          if ( this.matchValue("{") ) {
            fnNode.body = this.parseBlock();
          }
          prop.left = fnNode;
          if ( (isGetter == false) && (isSetter == false) ) {
            prop.kind = "init";
          }
        }
        if ( isMethod == false ) {
          if ( this.matchValue(":") ) {
            this.advance();
            const valueExpr = this.parseExpr();
            prop.left = valueExpr;
            prop.kind = "init";
          } else {
            if ( isComputed == false ) {
              const shorthandVal = new TSNode();
              shorthandVal.nodeType = "Identifier";
              shorthandVal.name = prop.name;
              prop.left = shorthandVal;
              prop.shorthand = true;
              prop.kind = "init";
            }
          }
        }
        node.children.push(prop);
      }
      if ( this.matchValue(",") ) {
        this.advance();
      }
    };
    this.expectValue("}");
    return node;
  };
  parseParenOrArrow () {
    const startTok = this.peek();
    const savedPos = this.pos;
    const savedTok = this.currentToken;
    this.advance();
    let parenDepth = 1;
    while ((parenDepth > 0) && (this.isAtEnd() == false)) {
      const v = this.peekValue();
      if ( v == "(" ) {
        parenDepth = parenDepth + 1;
      }
      if ( v == ")" ) {
        parenDepth = parenDepth - 1;
      }
      if ( parenDepth > 0 ) {
        this.advance();
      }
    };
    if ( this.matchValue(")") == false ) {
      this.pos = savedPos;
      this.currentToken = savedTok;
      this.advance();
      const expr = this.parseExpr();
      this.expectValue(")");
      return expr;
    }
    this.advance();
    if ( this.matchValue(":") ) {
      this.advance();
      this.parseType();
    }
    if ( this.matchValue("=>") ) {
      this.pos = savedPos;
      this.currentToken = savedTok;
      return this.parseArrowFunction();
    }
    this.pos = savedPos;
    this.currentToken = savedTok;
    this.advance();
    const expr_1 = this.parseExpr();
    this.expectValue(")");
    return expr_1;
  };
  parseArrowFunction () {
    const node = new TSNode();
    node.nodeType = "ArrowFunctionExpression";
    const startTok = this.peek();
    node.start = startTok.start;
    node.line = startTok.line;
    node.col = startTok.col;
    if ( this.matchValue("async") ) {
      this.advance();
      node.kind = "async";
    }
    if ( this.matchValue("(") ) {
      this.advance();
      while ((this.matchValue(")") == false) && (this.isAtEnd() == false)) {
        if ( (node.params.length) > 0 ) {
          this.expectValue(",");
        }
        const param = this.parseParam();
        node.params.push(param);
      };
      this.expectValue(")");
    } else {
      const paramTok = this.expect("Identifier");
      const param_1 = new TSNode();
      param_1.nodeType = "Parameter";
      param_1.name = paramTok.value;
      node.params.push(param_1);
    }
    if ( this.matchValue(":") ) {
      this.advance();
      const retType = this.parseType();
      node.typeAnnotation = retType;
    }
    this.expectValue("=>");
    if ( this.matchValue("{") ) {
      const body = this.parseBlock();
      node.body = body;
    } else {
      const body_1 = this.parseExpr();
      node.body = body_1;
    }
    return node;
  };
  parseNewExpression () {
    const node = new TSNode();
    node.nodeType = "NewExpression";
    const tok = this.peek();
    node.start = tok.start;
    node.line = tok.line;
    node.col = tok.col;
    this.expectValue("new");
    if ( this.matchValue(".") ) {
      this.advance();
      if ( this.matchValue("target") ) {
        this.advance();
        node.nodeType = "MetaProperty";
        node.name = "new";
        node.value = "target";
        return node;
      }
    }
    const callee = this.parsePrimary();
    node.left = callee;
    if ( this.matchValue("<") ) {
      let depth = 1;
      this.advance();
      while ((depth > 0) && (this.isAtEnd() == false)) {
        const v = this.peekValue();
        if ( v == "<" ) {
          depth = depth + 1;
        }
        if ( v == ">" ) {
          depth = depth - 1;
        }
        this.advance();
      };
    }
    if ( this.matchValue("(") ) {
      this.advance();
      while ((this.matchValue(")") == false) && (this.isAtEnd() == false)) {
        if ( (node.children.length) > 0 ) {
          this.expectValue(",");
        }
        const arg = this.parseExpr();
        node.children.push(arg);
      };
      this.expectValue(")");
    }
    return node;
  };
  peekNextType () {
    const nextPos = this.pos + 1;
    if ( nextPos < (this.tokens.length) ) {
      const nextTok = this.tokens[nextPos];
      return nextTok.tokenType;
    }
    return "EOF";
  };
  peekAheadValue (offset) {
    const aheadPos = this.pos + offset;
    if ( aheadPos < (this.tokens.length) ) {
      const tok = this.tokens[aheadPos];
      return tok.value;
    }
    return "";
  };
  startsWithLowerCase (s) {
    if ( (s.length) == 0 ) {
      return false;
    }
    const code = s.charCodeAt(0 );
    if ( (code >= 97) && (code <= 122) ) {
      return true;
    }
    return false;
  };
  looksLikeGenericCall () {
    let depth = 1;
    let offset = 1;
    const maxLookahead = 20;
    while ((depth > 0) && (offset < maxLookahead)) {
      const ahead = this.peekAheadValue(offset);
      if ( ahead == "" ) {
        return false;
      }
      if ( ahead == "<" ) {
        depth = depth + 1;
      }
      if ( ahead == ">" ) {
        depth = depth - 1;
      }
      if ( (((ahead == "{") || (ahead == "}")) || (ahead == ";")) || (ahead == "=>") ) {
        return false;
      }
      offset = offset + 1;
    };
    if ( depth == 0 ) {
      const afterClose = this.peekAheadValue(offset);
      if ( afterClose == "(" ) {
        return true;
      }
    }
    return false;
  };
  parseJSXElement () {
    const node = new TSNode();
    node.nodeType = "JSXElement";
    const tok = this.peek();
    node.start = tok.start;
    node.line = tok.line;
    node.col = tok.col;
    const opening = this.parseJSXOpeningElement();
    node.left = opening;
    if ( opening.kind == "self-closing" ) {
      node.nodeType = "JSXElement";
      return node;
    }
    const tagName = opening.name;
    while (this.isAtEnd() == false) {
      const v = this.peekValue();
      if ( v == "<" ) {
        const nextVal = this.peekNextValue();
        if ( nextVal == "/" ) {
          break;
        }
        const child = this.parseJSXElement();
        node.children.push(child);
      } else {
        if ( v == "{" ) {
          const exprChild = this.parseJSXExpressionContainer();
          node.children.push(exprChild);
        } else {
          const t = this.peekType();
          if ( ((t != "EOF") && (v != "<")) && (v != "{") ) {
            const textChild = this.parseJSXText();
            node.children.push(textChild);
          } else {
            break;
          }
        }
      }
    };
    const closing = this.parseJSXClosingElement();
    node.right = closing;
    return node;
  };
  parseJSXOpeningElement () {
    const node = new TSNode();
    node.nodeType = "JSXOpeningElement";
    const tok = this.peek();
    node.start = tok.start;
    node.line = tok.line;
    node.col = tok.col;
    this.expectValue("<");
    const tagName = this.parseJSXElementName();
    node.name = tagName.name;
    node.left = tagName;
    while (this.isAtEnd() == false) {
      const v = this.peekValue();
      if ( (v == ">") || (v == "/") ) {
        break;
      }
      const attr = this.parseJSXAttribute();
      node.children.push(attr);
    };
    if ( this.matchValue("/") ) {
      this.advance();
      node.kind = "self-closing";
    }
    this.expectValue(">");
    return node;
  };
  parseJSXClosingElement () {
    const node = new TSNode();
    node.nodeType = "JSXClosingElement";
    const tok = this.peek();
    node.start = tok.start;
    node.line = tok.line;
    node.col = tok.col;
    this.expectValue("<");
    this.expectValue("/");
    const tagName = this.parseJSXElementName();
    node.name = tagName.name;
    node.left = tagName;
    this.expectValue(">");
    return node;
  };
  parseJSXElementName () {
    const node = new TSNode();
    node.nodeType = "JSXIdentifier";
    const tok = this.peek();
    node.start = tok.start;
    node.line = tok.line;
    node.col = tok.col;
    let namePart = tok.value;
    this.advance();
    while (this.matchValue(".")) {
      this.advance();
      const nextTok = this.peek();
      namePart = (namePart + ".") + nextTok.value;
      this.advance();
      node.nodeType = "JSXMemberExpression";
    };
    node.name = namePart;
    return node;
  };
  parseJSXAttribute () {
    const node = new TSNode();
    node.nodeType = "JSXAttribute";
    const tok = this.peek();
    node.start = tok.start;
    node.line = tok.line;
    node.col = tok.col;
    if ( this.matchValue("{") ) {
      this.advance();
      if ( this.matchValue("...") ) {
        this.advance();
        node.nodeType = "JSXSpreadAttribute";
        const arg = this.parseExpr();
        node.left = arg;
        this.expectValue("}");
        return node;
      }
    }
    const attrName = tok.value;
    node.name = attrName;
    this.advance();
    if ( this.matchValue("=") ) {
      this.advance();
      const valTok = this.peekValue();
      if ( valTok == "{" ) {
        const exprValue = this.parseJSXExpressionContainer();
        node.right = exprValue;
      } else {
        const strTok = this.peek();
        const strNode = new TSNode();
        strNode.nodeType = "StringLiteral";
        strNode.value = strTok.value;
        strNode.start = strTok.start;
        strNode.end = strTok.end;
        strNode.line = strTok.line;
        strNode.col = strTok.col;
        this.advance();
        node.right = strNode;
      }
    }
    return node;
  };
  parseJSXExpressionContainer () {
    const node = new TSNode();
    node.nodeType = "JSXExpressionContainer";
    const tok = this.peek();
    node.start = tok.start;
    node.line = tok.line;
    node.col = tok.col;
    this.expectValue("{");
    if ( this.matchValue("}") ) {
      const empty = new TSNode();
      empty.nodeType = "JSXEmptyExpression";
      node.left = empty;
    } else {
      const expr = this.parseExpr();
      node.left = expr;
    }
    this.expectValue("}");
    return node;
  };
  parseJSXText () {
    const node = new TSNode();
    node.nodeType = "JSXText";
    const tok = this.peek();
    node.start = tok.start;
    node.line = tok.line;
    node.col = tok.col;
    node.value = tok.value;
    this.advance();
    return node;
  };
  parseJSXFragment () {
    const node = new TSNode();
    node.nodeType = "JSXFragment";
    const tok = this.peek();
    node.start = tok.start;
    node.line = tok.line;
    node.col = tok.col;
    this.expectValue("<");
    this.expectValue(">");
    while (this.isAtEnd() == false) {
      const v = this.peekValue();
      if ( v == "<" ) {
        const nextVal = this.peekNextValue();
        if ( nextVal == "/" ) {
          break;
        }
        const child = this.parseJSXElement();
        node.children.push(child);
      } else {
        if ( v == "{" ) {
          const exprChild = this.parseJSXExpressionContainer();
          node.children.push(exprChild);
        } else {
          const t = this.peekType();
          if ( ((t != "EOF") && (v != "<")) && (v != "{") ) {
            const textChild = this.parseJSXText();
            node.children.push(textChild);
          } else {
            break;
          }
        }
      }
    };
    this.expectValue("<");
    this.expectValue("/");
    this.expectValue(">");
    return node;
  };
}
class EVGUnit  {
  constructor() {
    this.value = 0.0;
    this.unitType = 0;
    this.isSet = false;
    this.pixels = 0.0;
    this.value = 0.0;
    this.unitType = 0;
    this.isSet = false;
    this.pixels = 0.0;
  }
  resolve (parentSize, fontSize) {
    if ( this.isSet == false ) {
      this.pixels = 0.0;
      return;
    }
    if ( this.unitType == 0 ) {
      this.pixels = this.value;
      return;
    }
    if ( this.unitType == 1 ) {
      this.pixels = (parentSize * this.value) / 100.0;
      return;
    }
    if ( this.unitType == 2 ) {
      this.pixels = fontSize * this.value;
      return;
    }
    if ( this.unitType == 3 ) {
      this.pixels = (parentSize * this.value) / 100.0;
      return;
    }
    if ( this.unitType == 4 ) {
      this.pixels = parentSize;
      return;
    }
    this.pixels = this.value;
  };
  resolveForHeight (parentWidth, parentHeight, fontSize) {
    if ( this.isSet == false ) {
      this.pixels = 0.0;
      return;
    }
    if ( this.unitType == 3 ) {
      this.pixels = (parentHeight * this.value) / 100.0;
      return;
    }
    if ( this.unitType == 1 ) {
      this.pixels = (parentHeight * this.value) / 100.0;
      return;
    }
    this.resolve(parentWidth, fontSize);
  };
  resolveWithHeight (parentWidth, parentHeight, fontSize) {
    if ( this.isSet == false ) {
      this.pixels = 0.0;
      return;
    }
    if ( this.unitType == 3 ) {
      this.pixels = (parentHeight * this.value) / 100.0;
      return;
    }
    this.resolve(parentWidth, fontSize);
  };
  isPixels () {
    return this.unitType == 0;
  };
  isPercent () {
    return this.unitType == 1;
  };
  isEm () {
    return this.unitType == 2;
  };
  isHeightPercent () {
    return this.unitType == 3;
  };
  isFill () {
    return this.unitType == 4;
  };
  toString () {
    if ( this.isSet == false ) {
      return "unset";
    }
    if ( this.unitType == 0 ) {
      return ((this.value.toString())) + "px";
    }
    if ( this.unitType == 1 ) {
      return ((this.value.toString())) + "%";
    }
    if ( this.unitType == 2 ) {
      return ((this.value.toString())) + "em";
    }
    if ( this.unitType == 3 ) {
      return ((this.value.toString())) + "hp";
    }
    if ( this.unitType == 4 ) {
      return "fill";
    }
    return (this.value.toString());
  };
}
EVGUnit.create = function(val, uType) {
  const unit = new EVGUnit();
  unit.value = val;
  unit.unitType = uType;
  unit.isSet = true;
  return unit;
};
EVGUnit.px = function(val) {
  return EVGUnit.create(val, 0);
};
EVGUnit.percent = function(val) {
  return EVGUnit.create(val, 1);
};
EVGUnit.em = function(val) {
  return EVGUnit.create(val, 2);
};
EVGUnit.heightPercent = function(val) {
  return EVGUnit.create(val, 3);
};
EVGUnit.fill = function() {
  return EVGUnit.create(100.0, 4);
};
EVGUnit.unset = function() {
  const unit = new EVGUnit();
  unit.isSet = false;
  return unit;
};
EVGUnit.parse = function(str) {
  const unit = new EVGUnit();
  const trimmed = str.trim();
  const __len = trimmed.length;
  if ( __len == 0 ) {
    return unit;
  }
  if ( trimmed == "fill" ) {
    unit.value = 100.0;
    unit.unitType = 4;
    unit.isSet = true;
    return unit;
  }
  const lastChar = trimmed.charCodeAt((__len - 1) );
  if ( lastChar == 37 ) {
    const numStr = trimmed.substring(0, (__len - 1) );
    const numVal = isNaN( parseFloat(numStr) ) ? undefined : parseFloat(numStr);
    unit.value = numVal;
    unit.unitType = 1;
    unit.isSet = true;
    return unit;
  }
  if ( __len >= 2 ) {
    const suffix = trimmed.substring((__len - 2), __len );
    if ( suffix == "em" ) {
      const numStr_1 = trimmed.substring(0, (__len - 2) );
      const numVal_1 = isNaN( parseFloat(numStr_1) ) ? undefined : parseFloat(numStr_1);
      unit.value = numVal_1;
      unit.unitType = 2;
      unit.isSet = true;
      return unit;
    }
    if ( suffix == "px" ) {
      const numStr_2 = trimmed.substring(0, (__len - 2) );
      const numVal_2 = isNaN( parseFloat(numStr_2) ) ? undefined : parseFloat(numStr_2);
      unit.value = numVal_2;
      unit.pixels = unit.value;
      unit.unitType = 0;
      unit.isSet = true;
      return unit;
    }
    if ( suffix == "hp" ) {
      const numStr_3 = trimmed.substring(0, (__len - 2) );
      const numVal_3 = isNaN( parseFloat(numStr_3) ) ? undefined : parseFloat(numStr_3);
      unit.value = numVal_3;
      unit.unitType = 3;
      unit.isSet = true;
      return unit;
    }
  }
  const numVal_4 = isNaN( parseFloat(trimmed) ) ? undefined : parseFloat(trimmed);
  unit.value = numVal_4;
  unit.pixels = unit.value;
  unit.unitType = 0;
  unit.isSet = true;
  return unit;
};
class EVGColor  {
  constructor() {
    this.r = 0.0;
    this.g = 0.0;
    this.b = 0.0;
    this.a = 1.0;
    this.isSet = true;
    this.r = 0.0;
    this.g = 0.0;
    this.b = 0.0;
    this.a = 1.0;
    this.isSet = true;
  }
  red () {
    if ( this.r > 255.0 ) {
      return 255;
    }
    if ( this.r < 0.0 ) {
      return 0;
    }
    return Math.floor( this.r);
  };
  green () {
    if ( this.g > 255.0 ) {
      return 255;
    }
    if ( this.g < 0.0 ) {
      return 0;
    }
    return Math.floor( this.g);
  };
  blue () {
    if ( this.b > 255.0 ) {
      return 255;
    }
    if ( this.b < 0.0 ) {
      return 0;
    }
    return Math.floor( this.b);
  };
  alpha () {
    if ( this.a < 0.0 ) {
      return 0.0;
    }
    if ( this.a > 1.0 ) {
      return 1.0;
    }
    return this.a;
  };
  toCSSString () {
    if ( this.isSet == false ) {
      return "none";
    }
    if ( this.a < 1.0 ) {
      return ((((((("rgba(" + ((this.red().toString()))) + ",") + ((this.green().toString()))) + ",") + ((this.blue().toString()))) + ",") + ((this.alpha().toString()))) + ")";
    }
    return ((((("rgb(" + ((this.red().toString()))) + ",") + ((this.green().toString()))) + ",") + ((this.blue().toString()))) + ")";
  };
  toHexString () {
    if ( this.isSet == false ) {
      return "none";
    }
    const hexChars = "0123456789ABCDEF";
    const rH = this.red();
    const gH = this.green();
    const bH = this.blue();
    const r1D = (rH) / 16.0;
    const r1 = Math.floor( r1D);
    const r2 = rH % 16;
    const g1D = (gH) / 16.0;
    const g1 = Math.floor( g1D);
    const g2 = gH % 16;
    const b1D = (bH) / 16.0;
    const b1 = Math.floor( b1D);
    const b2 = bH % 16;
    return ((((("#" + (String.fromCharCode((hexChars.charCodeAt(r1 ))))) + (String.fromCharCode((hexChars.charCodeAt(r2 ))))) + (String.fromCharCode((hexChars.charCodeAt(g1 ))))) + (String.fromCharCode((hexChars.charCodeAt(g2 ))))) + (String.fromCharCode((hexChars.charCodeAt(b1 ))))) + (String.fromCharCode((hexChars.charCodeAt(b2 ))));
  };
  toPDFColorString () {
    if ( this.isSet == false ) {
      return "";
    }
    const rN = this.r / 255.0;
    const gN = this.g / 255.0;
    const bN = this.b / 255.0;
    return (((((rN.toString())) + " ") + ((gN.toString()))) + " ") + ((bN.toString()));
  };
  withAlpha (newAlpha) {
    return EVGColor.create(this.r, this.g, this.b, newAlpha);
  };
  lighten (amount) {
    const newR = this.r + ((255.0 - this.r) * amount);
    const newG = this.g + ((255.0 - this.g) * amount);
    const newB = this.b + ((255.0 - this.b) * amount);
    return EVGColor.create(newR, newG, newB, this.a);
  };
  darken (amount) {
    const newR = this.r * (1.0 - amount);
    const newG = this.g * (1.0 - amount);
    const newB = this.b * (1.0 - amount);
    return EVGColor.create(newR, newG, newB, this.a);
  };
}
EVGColor.create = function(red, green, blue, alpha) {
  const c = new EVGColor();
  c.r = red;
  c.g = green;
  c.b = blue;
  c.a = alpha;
  c.isSet = true;
  return c;
};
EVGColor.rgb = function(red, green, blue) {
  return EVGColor.create((red), (green), (blue), 1.0);
};
EVGColor.rgba = function(red, green, blue, alpha) {
  return EVGColor.create((red), (green), (blue), alpha);
};
EVGColor.noColor = function() {
  const c = new EVGColor();
  c.isSet = false;
  return c;
};
EVGColor.black = function() {
  return EVGColor.rgb(0, 0, 0);
};
EVGColor.white = function() {
  return EVGColor.rgb(255, 255, 255);
};
EVGColor.transparent = function() {
  return EVGColor.rgba(0, 0, 0, 0.0);
};
EVGColor.hexDigit = function(ch) {
  if ( (ch >= 48) && (ch <= 57) ) {
    return ch - 48;
  }
  if ( (ch >= 65) && (ch <= 70) ) {
    return (ch - 65) + 10;
  }
  if ( (ch >= 97) && (ch <= 102) ) {
    return (ch - 97) + 10;
  }
  return 0;
};
EVGColor.parseHex = function(hex) {
  const c = new EVGColor();
  let __len = hex.length;
  let start = 0;
  if ( __len > 0 ) {
    const firstChar = hex.charCodeAt(0 );
    if ( firstChar == 35 ) {
      start = 1;
      __len = __len - 1;
    }
  }
  if ( __len == 3 ) {
    const r1 = EVGColor.hexDigit((hex.charCodeAt(start )));
    const g1 = EVGColor.hexDigit((hex.charCodeAt((start + 1) )));
    const b1 = EVGColor.hexDigit((hex.charCodeAt((start + 2) )));
    c.r = ((r1 * 16) + r1);
    c.g = ((g1 * 16) + g1);
    c.b = ((b1 * 16) + b1);
    c.a = 1.0;
    c.isSet = true;
    return c;
  }
  if ( __len == 6 ) {
    const r1_1 = EVGColor.hexDigit((hex.charCodeAt(start )));
    const r2 = EVGColor.hexDigit((hex.charCodeAt((start + 1) )));
    const g1_1 = EVGColor.hexDigit((hex.charCodeAt((start + 2) )));
    const g2 = EVGColor.hexDigit((hex.charCodeAt((start + 3) )));
    const b1_1 = EVGColor.hexDigit((hex.charCodeAt((start + 4) )));
    const b2 = EVGColor.hexDigit((hex.charCodeAt((start + 5) )));
    c.r = ((r1_1 * 16) + r2);
    c.g = ((g1_1 * 16) + g2);
    c.b = ((b1_1 * 16) + b2);
    c.a = 1.0;
    c.isSet = true;
    return c;
  }
  if ( __len == 8 ) {
    const r1_2 = EVGColor.hexDigit((hex.charCodeAt(start )));
    const r2_1 = EVGColor.hexDigit((hex.charCodeAt((start + 1) )));
    const g1_2 = EVGColor.hexDigit((hex.charCodeAt((start + 2) )));
    const g2_1 = EVGColor.hexDigit((hex.charCodeAt((start + 3) )));
    const b1_2 = EVGColor.hexDigit((hex.charCodeAt((start + 4) )));
    const b2_1 = EVGColor.hexDigit((hex.charCodeAt((start + 5) )));
    const a1 = EVGColor.hexDigit((hex.charCodeAt((start + 6) )));
    const a2 = EVGColor.hexDigit((hex.charCodeAt((start + 7) )));
    c.r = ((r1_2 * 16) + r2_1);
    c.g = ((g1_2 * 16) + g2_1);
    c.b = ((b1_2 * 16) + b2_1);
    c.a = (((a1 * 16) + a2)) / 255.0;
    c.isSet = true;
    return c;
  }
  c.isSet = false;
  return c;
};
EVGColor.hue2rgb = function(p, q, tt) {
  let t = tt;
  if ( t < 0.0 ) {
    t = t + 1.0;
  }
  if ( t > 1.0 ) {
    t = t - 1.0;
  }
  if ( t < (1.0 / 6.0) ) {
    return p + (((q - p) * 6.0) * t);
  }
  if ( t < (1.0 / 2.0) ) {
    return q;
  }
  if ( t < (2.0 / 3.0) ) {
    return p + (((q - p) * ((2.0 / 3.0) - t)) * 6.0);
  }
  return p;
};
EVGColor.hslToRgb = function(h, s, l) {
  const c = new EVGColor();
  const hNorm = h / 360.0;
  const sNorm = s / 100.0;
  const lNorm = l / 100.0;
  if ( sNorm == 0.0 ) {
    const gray = lNorm * 255.0;
    c.r = gray;
    c.g = gray;
    c.b = gray;
  } else {
    let q = 0.0;
    if ( lNorm < 0.5 ) {
      q = lNorm * (1.0 + sNorm);
    } else {
      q = (lNorm + sNorm) - (lNorm * sNorm);
    }
    const p = (2.0 * lNorm) - q;
    c.r = EVGColor.hue2rgb(p, q, (hNorm + (1.0 / 3.0))) * 255.0;
    c.g = EVGColor.hue2rgb(p, q, hNorm) * 255.0;
    c.b = EVGColor.hue2rgb(p, q, (hNorm - (1.0 / 3.0))) * 255.0;
  }
  c.a = 1.0;
  c.isSet = true;
  return c;
};
EVGColor.parseNumber = function(str) {
  const val = isNaN( parseFloat((str.trim())) ) ? undefined : parseFloat((str.trim()));
  return val;
};
EVGColor.parse = function(str) {
  const trimmed = str.trim();
  const __len = trimmed.length;
  if ( __len == 0 ) {
    return EVGColor.noColor();
  }
  const firstChar = trimmed.charCodeAt(0 );
  if ( firstChar == 35 ) {
    return EVGColor.parseHex(trimmed);
  }
  if ( __len >= 4 ) {
    const prefix = trimmed.substring(0, 4 );
    if ( prefix == "rgba" ) {
      return EVGColor.parseRgba(trimmed);
    }
    const prefix3 = trimmed.substring(0, 3 );
    if ( prefix3 == "rgb" ) {
      return EVGColor.parseRgb(trimmed);
    }
    if ( prefix3 == "hsl" ) {
      return EVGColor.parseHsl(trimmed);
    }
  }
  return EVGColor.parseNamed(trimmed);
};
EVGColor.parseRgb = function(str) {
  const c = new EVGColor();
  const __len = str.length;
  let start = 0;
  let i = 0;
  while (i < __len) {
    const ch = str.charCodeAt(i );
    if ( ch == 40 ) {
      start = i + 1;
    }
    i = i + 1;
  };
  let end = __len - 1;
  i = __len - 1;
  while (i >= 0) {
    const ch_1 = str.charCodeAt(i );
    if ( ch_1 == 41 ) {
      end = i;
    }
    i = i - 1;
  };
  const content = str.substring(start, end );
  let parts = [];
  let current = "";
  i = 0;
  const contentLen = content.length;
  while (i < contentLen) {
    const ch_2 = content.charCodeAt(i );
    if ( (ch_2 == 44) || (ch_2 == 32) ) {
      const trimPart = current.trim();
      if ( (trimPart.length) > 0 ) {
        parts.push(trimPart);
      }
      current = "";
    } else {
      current = current + (String.fromCharCode(ch_2));
    }
    i = i + 1;
  };
  const trimPart_1 = current.trim();
  if ( (trimPart_1.length) > 0 ) {
    parts.push(trimPart_1);
  }
  if ( (parts.length) >= 3 ) {
    c.r = EVGColor.parseNumber((parts[0]));
    c.g = EVGColor.parseNumber((parts[1]));
    c.b = EVGColor.parseNumber((parts[2]));
    c.a = 1.0;
    c.isSet = true;
  }
  return c;
};
EVGColor.parseRgba = function(str) {
  const c = EVGColor.parseRgb(str);
  const __len = str.length;
  let start = 0;
  let end = __len - 1;
  let i = 0;
  while (i < __len) {
    const ch = str.charCodeAt(i );
    if ( ch == 40 ) {
      start = i + 1;
    }
    if ( ch == 41 ) {
      end = i;
    }
    i = i + 1;
  };
  const content = str.substring(start, end );
  let parts = [];
  let current = "";
  i = 0;
  const contentLen = content.length;
  while (i < contentLen) {
    const ch_1 = content.charCodeAt(i );
    if ( (ch_1 == 44) || (ch_1 == 32) ) {
      const trimPart = current.trim();
      if ( (trimPart.length) > 0 ) {
        parts.push(trimPart);
      }
      current = "";
    } else {
      current = current + (String.fromCharCode(ch_1));
    }
    i = i + 1;
  };
  const trimPart_1 = current.trim();
  if ( (trimPart_1.length) > 0 ) {
    parts.push(trimPart_1);
  }
  if ( (parts.length) >= 4 ) {
    c.r = EVGColor.parseNumber((parts[0]));
    c.g = EVGColor.parseNumber((parts[1]));
    c.b = EVGColor.parseNumber((parts[2]));
    c.a = EVGColor.parseNumber((parts[3]));
    c.isSet = true;
  }
  return c;
};
EVGColor.parseHsl = function(str) {
  const __len = str.length;
  let start = 0;
  let end = __len - 1;
  let i = 0;
  while (i < __len) {
    const ch = str.charCodeAt(i );
    if ( ch == 40 ) {
      start = i + 1;
    }
    if ( ch == 41 ) {
      end = i;
    }
    i = i + 1;
  };
  const content = str.substring(start, end );
  let parts = [];
  let current = "";
  i = 0;
  const contentLen = content.length;
  while (i < contentLen) {
    const ch_1 = content.charCodeAt(i );
    if ( (ch_1 == 44) || (ch_1 == 32) ) {
      const trimPart = current.trim();
      if ( (trimPart.length) > 0 ) {
        parts.push(trimPart);
      }
      current = "";
    } else {
      current = current + (String.fromCharCode(ch_1));
    }
    i = i + 1;
  };
  const trimPart_1 = current.trim();
  if ( (trimPart_1.length) > 0 ) {
    parts.push(trimPart_1);
  }
  if ( (parts.length) >= 3 ) {
    const h = EVGColor.parseNumber((parts[0]));
    const s = EVGColor.parseNumber((parts[1]));
    const l = EVGColor.parseNumber((parts[2]));
    const c = EVGColor.hslToRgb(h, s, l);
    if ( (parts.length) >= 4 ) {
      c.a = EVGColor.parseNumber((parts[3]));
    }
    return c;
  }
  return EVGColor.noColor();
};
EVGColor.parseNamed = function(name) {
  let lower = "";
  const __len = name.length;
  let i = 0;
  while (i < __len) {
    const ch = name.charCodeAt(i );
    if ( (ch >= 65) && (ch <= 90) ) {
      lower = lower + (String.fromCharCode((ch + 32)));
    } else {
      lower = lower + (String.fromCharCode(ch));
    }
    i = i + 1;
  };
  if ( lower == "black" ) {
    return EVGColor.rgb(0, 0, 0);
  }
  if ( lower == "white" ) {
    return EVGColor.rgb(255, 255, 255);
  }
  if ( lower == "red" ) {
    return EVGColor.rgb(255, 0, 0);
  }
  if ( lower == "green" ) {
    return EVGColor.rgb(0, 128, 0);
  }
  if ( lower == "blue" ) {
    return EVGColor.rgb(0, 0, 255);
  }
  if ( lower == "yellow" ) {
    return EVGColor.rgb(255, 255, 0);
  }
  if ( lower == "cyan" ) {
    return EVGColor.rgb(0, 255, 255);
  }
  if ( lower == "magenta" ) {
    return EVGColor.rgb(255, 0, 255);
  }
  if ( lower == "gray" ) {
    return EVGColor.rgb(128, 128, 128);
  }
  if ( lower == "grey" ) {
    return EVGColor.rgb(128, 128, 128);
  }
  if ( lower == "orange" ) {
    return EVGColor.rgb(255, 165, 0);
  }
  if ( lower == "purple" ) {
    return EVGColor.rgb(128, 0, 128);
  }
  if ( lower == "pink" ) {
    return EVGColor.rgb(255, 192, 203);
  }
  if ( lower == "brown" ) {
    return EVGColor.rgb(165, 42, 42);
  }
  if ( lower == "transparent" ) {
    return EVGColor.transparent();
  }
  if ( lower == "none" ) {
    return EVGColor.noColor();
  }
  return EVGColor.noColor();
};
class EVGBox  {
  constructor() {
    this.marginTopPx = 0.0;
    this.marginRightPx = 0.0;
    this.marginBottomPx = 0.0;
    this.marginLeftPx = 0.0;
    this.paddingTopPx = 0.0;
    this.paddingRightPx = 0.0;
    this.paddingBottomPx = 0.0;
    this.paddingLeftPx = 0.0;
    this.borderWidthPx = 0.0;
    this.borderRadiusPx = 0.0;
    this.marginTop = EVGUnit.unset();
    this.marginRight = EVGUnit.unset();
    this.marginBottom = EVGUnit.unset();
    this.marginLeft = EVGUnit.unset();
    this.paddingTop = EVGUnit.unset();
    this.paddingRight = EVGUnit.unset();
    this.paddingBottom = EVGUnit.unset();
    this.paddingLeft = EVGUnit.unset();
    this.borderWidth = EVGUnit.unset();
    this.borderColor = EVGColor.noColor();
    this.borderRadius = EVGUnit.unset();
  }
  setMargin (all) {
    this.marginTop = all;
    this.marginRight = all;
    this.marginBottom = all;
    this.marginLeft = all;
  };
  setMarginValues (top, right, bottom, left) {
    this.marginTop = top;
    this.marginRight = right;
    this.marginBottom = bottom;
    this.marginLeft = left;
  };
  setPadding (all) {
    this.paddingTop = all;
    this.paddingRight = all;
    this.paddingBottom = all;
    this.paddingLeft = all;
  };
  setPaddingValues (top, right, bottom, left) {
    this.paddingTop = top;
    this.paddingRight = right;
    this.paddingBottom = bottom;
    this.paddingLeft = left;
  };
  resolveUnits (parentWidth, parentHeight, fontSize) {
    this.marginTop.resolve(parentHeight, fontSize);
    this.marginTopPx = this.marginTop.pixels;
    this.marginRight.resolve(parentWidth, fontSize);
    this.marginRightPx = this.marginRight.pixels;
    this.marginBottom.resolve(parentHeight, fontSize);
    this.marginBottomPx = this.marginBottom.pixels;
    this.marginLeft.resolve(parentWidth, fontSize);
    this.marginLeftPx = this.marginLeft.pixels;
    this.paddingTop.resolve(parentHeight, fontSize);
    this.paddingTopPx = this.paddingTop.pixels;
    this.paddingRight.resolve(parentWidth, fontSize);
    this.paddingRightPx = this.paddingRight.pixels;
    this.paddingBottom.resolve(parentHeight, fontSize);
    this.paddingBottomPx = this.paddingBottom.pixels;
    this.paddingLeft.resolve(parentWidth, fontSize);
    this.paddingLeftPx = this.paddingLeft.pixels;
    this.borderWidth.resolve(parentWidth, fontSize);
    this.borderWidthPx = this.borderWidth.pixels;
    let smallerDim = parentWidth;
    if ( parentHeight < parentWidth ) {
      smallerDim = parentHeight;
    }
    this.borderRadius.resolve(smallerDim, fontSize);
    this.borderRadiusPx = this.borderRadius.pixels;
  };
  getInnerWidth (outerWidth) {
    return ((outerWidth - this.paddingLeftPx) - this.paddingRightPx) - (this.borderWidthPx * 2.0);
  };
  getInnerHeight (outerHeight) {
    return ((outerHeight - this.paddingTopPx) - this.paddingBottomPx) - (this.borderWidthPx * 2.0);
  };
  getTotalWidth (contentWidth) {
    return ((((contentWidth + this.marginLeftPx) + this.marginRightPx) + this.paddingLeftPx) + this.paddingRightPx) + (this.borderWidthPx * 2.0);
  };
  getTotalHeight (contentHeight) {
    return ((((contentHeight + this.marginTopPx) + this.marginBottomPx) + this.paddingTopPx) + this.paddingBottomPx) + (this.borderWidthPx * 2.0);
  };
  getContentX (elementX) {
    return ((elementX + this.marginLeftPx) + this.borderWidthPx) + this.paddingLeftPx;
  };
  getContentY (elementY) {
    return ((elementY + this.marginTopPx) + this.borderWidthPx) + this.paddingTopPx;
  };
  getHorizontalSpace () {
    return (((this.marginLeftPx + this.marginRightPx) + this.paddingLeftPx) + this.paddingRightPx) + (this.borderWidthPx * 2.0);
  };
  getVerticalSpace () {
    return (((this.marginTopPx + this.marginBottomPx) + this.paddingTopPx) + this.paddingBottomPx) + (this.borderWidthPx * 2.0);
  };
  getMarginHorizontal () {
    return this.marginLeftPx + this.marginRightPx;
  };
  getMarginVertical () {
    return this.marginTopPx + this.marginBottomPx;
  };
  getPaddingHorizontal () {
    return this.paddingLeftPx + this.paddingRightPx;
  };
  getPaddingVertical () {
    return this.paddingTopPx + this.paddingBottomPx;
  };
  toString () {
    return ((((((((((((((((("Box[margin:" + ((this.marginTopPx.toString()))) + "/") + ((this.marginRightPx.toString()))) + "/") + ((this.marginBottomPx.toString()))) + "/") + ((this.marginLeftPx.toString()))) + " padding:") + ((this.paddingTopPx.toString()))) + "/") + ((this.paddingRightPx.toString()))) + "/") + ((this.paddingBottomPx.toString()))) + "/") + ((this.paddingLeftPx.toString()))) + " border:") + ((this.borderWidthPx.toString()))) + "]";
  };
}
class EVGGradientStop  {
  constructor() {
    this.percentage = 0.0;
    this.color = new EVGColor();
  }
}
EVGGradientStop.create = function(pct, col) {
  const stop = new EVGGradientStop();
  stop.percentage = pct;
  stop.color = col;
  return stop;
};
class EVGGradient  {
  constructor() {
    this.isSet = false;
    this.isLinear = true;
    this.angle = 0.0;
    this.stops = [];
    let s = [];
    this.stops = s;
  }
  getStartColor () {
    if ( (this.stops.length) > 0 ) {
      const stop = this.stops[0];
      return stop.color;
    }
    return EVGColor.noColor();
  };
  getEndColor () {
    const __len = this.stops.length;
    if ( __len > 0 ) {
      const stop = this.stops[(__len - 1)];
      return stop.color;
    }
    return EVGColor.noColor();
  };
  getStopCount () {
    return this.stops.length;
  };
  getStop (index) {
    return this.stops[index];
  };
  addStop (percentage, color) {
    const stop = EVGGradientStop.create(percentage, color);
    this.stops.push(stop);
  };
  toCSSString () {
    if ( this.isSet == false ) {
      return "";
    }
    let result = "";
    if ( this.isLinear ) {
      result = ("linear-gradient(" + ((this.angle.toString()))) + "deg";
    } else {
      result = "radial-gradient(circle";
    }
    const numStops = this.stops.length;
    let i = 0;
    while (i < numStops) {
      const stop = this.stops[i];
      result = (result + ", ") + stop.color.toCSSString();
      i = i + 1;
    };
    result = result + ")";
    return result;
  };
}
EVGGradient.parse = function(gradStr) {
  const grad = new EVGGradient();
  const __len = gradStr.length;
  if ( __len == 0 ) {
    return grad;
  }
  const linearIdx = gradStr.indexOf("linear-gradient");
  const radialIdx = gradStr.indexOf("radial-gradient");
  if ( linearIdx >= 0 ) {
    grad.isLinear = true;
    grad.isSet = true;
  }
  if ( radialIdx >= 0 ) {
    grad.isLinear = false;
    grad.isSet = true;
  }
  if ( grad.isSet == false ) {
    return grad;
  }
  if ( grad.isLinear ) {
    const degIdx = gradStr.indexOf("deg");
    if ( degIdx > 0 ) {
      const startIdx = gradStr.indexOf("(");
      if ( startIdx >= 0 ) {
        const angleStr = gradStr.substring((startIdx + 1), degIdx );
        const angleVal = isNaN( parseFloat((angleStr.trim())) ) ? undefined : parseFloat((angleStr.trim()));
        if ( typeof(angleVal) != "undefined" ) {
          grad.angle = angleVal;
        }
      }
    }
  }
  let colors = [];
  let i = 0;
  while (i < __len) {
    const ch = gradStr.charCodeAt(i );
    if ( ch == 35 ) {
      const colorStart = i;
      let colorEnd = i + 1;
      while (colorEnd < __len) {
        const c = gradStr.charCodeAt(colorEnd );
        let isHex = false;
        if ( (c >= 48) && (c <= 57) ) {
          isHex = true;
        }
        if ( (c >= 65) && (c <= 70) ) {
          isHex = true;
        }
        if ( (c >= 97) && (c <= 102) ) {
          isHex = true;
        }
        if ( isHex ) {
          colorEnd = colorEnd + 1;
        } else {
          break;
        }
      };
      const colorStr = gradStr.substring(colorStart, colorEnd );
      const parsedColor = EVGColor.parseHex(colorStr);
      if ( parsedColor.isSet ) {
        colors.push(parsedColor);
      }
      i = colorEnd;
    } else {
      i = i + 1;
    }
  };
  const numColors = colors.length;
  if ( numColors > 0 ) {
    let colorIdx = 0;
    while (colorIdx < numColors) {
      let pct = 0.0;
      if ( numColors > 1 ) {
        pct = (colorIdx) / ((numColors - 1));
      }
      const col = colors[colorIdx];
      grad.addStop(pct, col);
      colorIdx = colorIdx + 1;
    };
  }
  return grad;
};
class EVGElement  {
  constructor() {
    this.id = "";
    this.tagName = "div";
    this.elementType = 0;
    this.children = [];
    this.opacity = 1.0;
    this.direction = "row";
    this.align = "left";
    this.verticalAlign = "top";
    this.isInline = false;
    this.lineBreak = false;
    this.overflow = "visible";
    this.fontFamily = "Helvetica";
    this.fontWeight = "normal";
    this.lineHeight = 1.2;
    this.textAlign = "left";
    this.textContent = "";
    this.display = "block";
    this.flex = 0.0;
    this.flexDirection = "column";
    this.justifyContent = "flex-start";
    this.alignItems = "flex-start";
    this.position = "relative";
    this.src = "";
    this.alt = "";
    this.svgPath = "";
    this.viewBox = "";
    this.strokeWidth = 0.0;
    this.clipPath = "";
    this.className = "";
    this.imageQuality = 0;
    this.maxImageSize = 0;
    this.rotate = 0.0;
    this.scale = 1.0;
    this.backgroundGradient = "";
    this.gradient = new EVGGradient();
    this.calculatedX = 0.0;
    this.calculatedY = 0.0;
    this.calculatedWidth = 0.0;
    this.calculatedHeight = 0.0;
    this.calculatedInnerWidth = 0.0;
    this.calculatedInnerHeight = 0.0;
    this.calculatedFlexWidth = 0.0;
    this.calculatedPage = 0;
    this.isAbsolute = false;
    this.isLayoutComplete = false;
    this.unitsResolved = false;
    this.inheritedFontSize = 14.0;
    this.tagName = "div";
    this.elementType = 0;
    this.width = EVGUnit.unset();
    this.height = EVGUnit.unset();
    this.minWidth = EVGUnit.unset();
    this.minHeight = EVGUnit.unset();
    this.maxWidth = EVGUnit.unset();
    this.maxHeight = EVGUnit.unset();
    this.left = EVGUnit.unset();
    this.top = EVGUnit.unset();
    this.right = EVGUnit.unset();
    this.bottom = EVGUnit.unset();
    this.x = EVGUnit.unset();
    this.y = EVGUnit.unset();
    const newBox = new EVGBox();
    this.box = newBox;
    this.backgroundColor = EVGColor.noColor();
    this.color = EVGColor.black();
    this.fontSize = EVGUnit.px(14.0);
    this.shadowRadius = EVGUnit.unset();
    this.shadowColor = EVGColor.noColor();
    this.shadowOffsetX = EVGUnit.unset();
    this.shadowOffsetY = EVGUnit.unset();
    this.fillColor = EVGColor.noColor();
    this.strokeColor = EVGColor.noColor();
  }
  addChild (child) {
    child.parent = this;
    this.children.push(child);
  };
  resetLayoutState () {
    this.unitsResolved = false;
    this.calculatedX = 0.0;
    this.calculatedY = 0.0;
    this.calculatedWidth = 0.0;
    this.calculatedHeight = 0.0;
    let i = 0;
    while (i < (this.children.length)) {
      const child = this.children[i];
      child.resetLayoutState();
      i = i + 1;
    };
  };
  getChildCount () {
    return this.children.length;
  };
  getChild (index) {
    return this.children[index];
  };
  hasParent () {
    if ( typeof(this.parent) != "undefined" ) {
      return true;
    }
    return false;
  };
  isContainer () {
    return this.elementType == 0;
  };
  isText () {
    return this.elementType == 1;
  };
  isImage () {
    return this.elementType == 2;
  };
  isPath () {
    return this.elementType == 3;
  };
  hasAbsolutePosition () {
    if ( this.left.isSet ) {
      return true;
    }
    if ( this.top.isSet ) {
      return true;
    }
    if ( this.right.isSet ) {
      return true;
    }
    if ( this.bottom.isSet ) {
      return true;
    }
    if ( this.x.isSet ) {
      return true;
    }
    if ( this.y.isSet ) {
      return true;
    }
    return false;
  };
  inheritProperties (parentEl) {
    if ( this.fontFamily == "Helvetica" ) {
      this.fontFamily = parentEl.fontFamily;
    }
    if ( this.color.isSet == false ) {
      this.color = parentEl.color;
    }
    this.inheritedFontSize = parentEl.inheritedFontSize;
    if ( this.fontSize.isSet ) {
      this.fontSize.resolve(this.inheritedFontSize, this.inheritedFontSize);
      this.inheritedFontSize = this.fontSize.pixels;
    }
  };
  resolveUnits (parentWidth, parentHeight) {
    if ( this.unitsResolved ) {
      return;
    }
    this.unitsResolved = true;
    const fs = this.inheritedFontSize;
    this.width.resolveWithHeight(parentWidth, parentHeight, fs);
    this.height.resolveForHeight(parentWidth, parentHeight, fs);
    this.minWidth.resolve(parentWidth, fs);
    this.minHeight.resolve(parentHeight, fs);
    this.maxWidth.resolve(parentWidth, fs);
    this.maxHeight.resolve(parentHeight, fs);
    this.left.resolve(parentWidth, fs);
    this.top.resolve(parentHeight, fs);
    this.right.resolve(parentWidth, fs);
    this.bottom.resolve(parentHeight, fs);
    this.x.resolve(parentWidth, fs);
    this.y.resolve(parentHeight, fs);
    this.box.resolveUnits(parentWidth, parentHeight, fs);
    this.shadowRadius.resolve(parentWidth, fs);
    this.shadowOffsetX.resolve(parentWidth, fs);
    this.shadowOffsetY.resolve(parentHeight, fs);
    this.isAbsolute = this.hasAbsolutePosition();
  };
  setAttribute (name, value) {
    if ( name == "id" ) {
      this.id = value;
      return;
    }
    if ( name == "width" ) {
      this.width = EVGUnit.parse(value);
      return;
    }
    if ( name == "height" ) {
      this.height = EVGUnit.parse(value);
      return;
    }
    if ( (name == "min-width") || (name == "minWidth") ) {
      this.minWidth = EVGUnit.parse(value);
      return;
    }
    if ( (name == "min-height") || (name == "minHeight") ) {
      this.minHeight = EVGUnit.parse(value);
      return;
    }
    if ( (name == "max-width") || (name == "maxWidth") ) {
      this.maxWidth = EVGUnit.parse(value);
      return;
    }
    if ( (name == "max-height") || (name == "maxHeight") ) {
      this.maxHeight = EVGUnit.parse(value);
      return;
    }
    if ( name == "left" ) {
      this.left = EVGUnit.parse(value);
      return;
    }
    if ( name == "top" ) {
      this.top = EVGUnit.parse(value);
      return;
    }
    if ( name == "right" ) {
      this.right = EVGUnit.parse(value);
      return;
    }
    if ( name == "bottom" ) {
      this.bottom = EVGUnit.parse(value);
      return;
    }
    if ( name == "x" ) {
      this.x = EVGUnit.parse(value);
      return;
    }
    if ( name == "y" ) {
      this.y = EVGUnit.parse(value);
      return;
    }
    if ( name == "margin" ) {
      this.box.setMargin(EVGUnit.parse(value));
      return;
    }
    if ( (name == "margin-left") || (name == "marginLeft") ) {
      this.box.marginLeft = EVGUnit.parse(value);
      return;
    }
    if ( (name == "margin-right") || (name == "marginRight") ) {
      this.box.marginRight = EVGUnit.parse(value);
      return;
    }
    if ( (name == "margin-top") || (name == "marginTop") ) {
      this.box.marginTop = EVGUnit.parse(value);
      return;
    }
    if ( (name == "margin-bottom") || (name == "marginBottom") ) {
      this.box.marginBottom = EVGUnit.parse(value);
      return;
    }
    if ( name == "padding" ) {
      this.box.setPadding(EVGUnit.parse(value));
      return;
    }
    if ( (name == "padding-left") || (name == "paddingLeft") ) {
      this.box.paddingLeft = EVGUnit.parse(value);
      return;
    }
    if ( (name == "padding-right") || (name == "paddingRight") ) {
      this.box.paddingRight = EVGUnit.parse(value);
      return;
    }
    if ( (name == "padding-top") || (name == "paddingTop") ) {
      this.box.paddingTop = EVGUnit.parse(value);
      return;
    }
    if ( (name == "padding-bottom") || (name == "paddingBottom") ) {
      this.box.paddingBottom = EVGUnit.parse(value);
      return;
    }
    if ( (name == "border-width") || (name == "borderWidth") ) {
      this.box.borderWidth = EVGUnit.parse(value);
      return;
    }
    if ( (name == "border-color") || (name == "borderColor") ) {
      this.box.borderColor = EVGColor.parse(value);
      return;
    }
    if ( (name == "border-radius") || (name == "borderRadius") ) {
      this.box.borderRadius = EVGUnit.parse(value);
      return;
    }
    if ( (name == "background-color") || (name == "backgroundColor") ) {
      this.backgroundColor = EVGColor.parse(value);
      return;
    }
    if ( (name == "background-gradient") || (name == "backgroundGradient") ) {
      this.backgroundGradient = value;
      this.gradient = EVGGradient.parse(value);
      return;
    }
    if ( name == "background" ) {
      if ( (value.includes("linear-gradient")) || (value.includes("radial-gradient")) ) {
        this.backgroundGradient = value;
        this.gradient = EVGGradient.parse(value);
      } else {
        this.backgroundColor = EVGColor.parse(value);
      }
      return;
    }
    if ( name == "color" ) {
      this.color = EVGColor.parse(value);
      return;
    }
    if ( name == "opacity" ) {
      const val = isNaN( parseFloat(value) ) ? undefined : parseFloat(value);
      this.opacity = val;
      return;
    }
    if ( name == "direction" ) {
      this.direction = value;
      return;
    }
    if ( name == "align" ) {
      this.align = value;
      return;
    }
    if ( (name == "vertical-align") || (name == "verticalAlign") ) {
      this.verticalAlign = value;
      return;
    }
    if ( name == "inline" ) {
      this.isInline = value == "true";
      return;
    }
    if ( (name == "line-break") || (name == "lineBreak") ) {
      this.lineBreak = value == "true";
      return;
    }
    if ( name == "overflow" ) {
      this.overflow = value;
      return;
    }
    if ( (name == "flex-direction") || (name == "flexDirection") ) {
      this.flexDirection = value;
      return;
    }
    if ( name == "flex" ) {
      const val_1 = isNaN( parseFloat(value) ) ? undefined : parseFloat(value);
      if ( typeof(val_1) != "undefined" ) {
        this.flex = val_1;
      }
      return;
    }
    if ( name == "gap" ) {
      this.gap = EVGUnit.parse(value);
      return;
    }
    if ( (name == "justify-content") || (name == "justifyContent") ) {
      this.justifyContent = value;
      return;
    }
    if ( (name == "align-items") || (name == "alignItems") ) {
      this.alignItems = value;
      return;
    }
    if ( (name == "font-size") || (name == "fontSize") ) {
      this.fontSize = EVGUnit.parse(value);
      return;
    }
    if ( (name == "font-family") || (name == "fontFamily") ) {
      this.fontFamily = value;
      return;
    }
    if ( (name == "font-weight") || (name == "fontWeight") ) {
      this.fontWeight = value;
      return;
    }
    if ( (name == "text-align") || (name == "textAlign") ) {
      this.textAlign = value;
      return;
    }
    if ( (name == "line-height") || (name == "lineHeight") ) {
      const val_2 = isNaN( parseFloat(value) ) ? undefined : parseFloat(value);
      if ( typeof(val_2) != "undefined" ) {
        this.lineHeight = val_2;
      }
      return;
    }
    if ( name == "rotate" ) {
      const val_3 = isNaN( parseFloat(value) ) ? undefined : parseFloat(value);
      this.rotate = val_3;
      return;
    }
    if ( name == "scale" ) {
      const val_4 = isNaN( parseFloat(value) ) ? undefined : parseFloat(value);
      this.scale = val_4;
      return;
    }
    if ( (name == "shadow-radius") || (name == "shadowRadius") ) {
      this.shadowRadius = EVGUnit.parse(value);
      return;
    }
    if ( (name == "shadow-color") || (name == "shadowColor") ) {
      this.shadowColor = EVGColor.parse(value);
      return;
    }
    if ( (name == "shadow-offset-x") || (name == "shadowOffsetX") ) {
      this.shadowOffsetX = EVGUnit.parse(value);
      return;
    }
    if ( (name == "shadow-offset-y") || (name == "shadowOffsetY") ) {
      this.shadowOffsetY = EVGUnit.parse(value);
      return;
    }
    if ( (name == "clip-path") || (name == "clipPath") ) {
      this.clipPath = value;
      return;
    }
    if ( name == "imageQuality" ) {
      const val_5 = isNaN( parseInt(value) ) ? undefined : parseInt(value);
      if ( typeof(val_5) != "undefined" ) {
        this.imageQuality = val_5;
      }
      return;
    }
    if ( name == "maxImageSize" ) {
      const val_6 = isNaN( parseInt(value) ) ? undefined : parseInt(value);
      if ( typeof(val_6) != "undefined" ) {
        this.maxImageSize = val_6;
      }
      return;
    }
    if ( (name == "d") || (name == "svgPath") ) {
      this.svgPath = value;
      return;
    }
    if ( name == "viewBox" ) {
      this.viewBox = value;
      return;
    }
    if ( name == "fill" ) {
      this.fillColor = EVGColor.parse(value);
      return;
    }
    if ( name == "stroke" ) {
      this.strokeColor = EVGColor.parse(value);
      return;
    }
    if ( (name == "stroke-width") || (name == "strokeWidth") ) {
      const val_7 = isNaN( parseFloat(value) ) ? undefined : parseFloat(value);
      if ( typeof(val_7) != "undefined" ) {
        this.strokeWidth = val_7;
      }
      return;
    }
  };
  getCalculatedBounds () {
    return (((((("(" + ((this.calculatedX.toString()))) + ", ") + ((this.calculatedY.toString()))) + ") ") + ((this.calculatedWidth.toString()))) + "x") + ((this.calculatedHeight.toString()));
  };
  toString () {
    return ((((("<" + this.tagName) + " id=\"") + this.id) + "\" ") + this.getCalculatedBounds()) + ">";
  };
}
EVGElement.createDiv = function() {
  const el = new EVGElement();
  el.tagName = "div";
  el.elementType = 0;
  return el;
};
EVGElement.createSpan = function() {
  const el = new EVGElement();
  el.tagName = "span";
  el.elementType = 1;
  return el;
};
EVGElement.createImg = function() {
  const el = new EVGElement();
  el.tagName = "img";
  el.elementType = 2;
  return el;
};
EVGElement.createPath = function() {
  const el = new EVGElement();
  el.tagName = "path";
  el.elementType = 3;
  return el;
};
class JSXToEVG  {
  constructor() {
    this.source = "";
    this.pageWidth = 595.0;
    this.pageHeight = 842.0;
    this.parser = new TSParserSimple();
    this.parser.tsxMode = true;
  }
  camelToKebab (name) {
    let result = "";
    let i = 0;
    const __len = name.length;
    while (i < __len) {
      const code = name.charCodeAt(i );
      const codeInt = code;
      if ( (codeInt >= 65) && (codeInt <= 90) ) {
        if ( i > 0 ) {
          result = result + "-";
        }
        const lowerCode = codeInt + 32;
        const lowerCh = String.fromCharCode(lowerCode);
        result = result + lowerCh;
      } else {
        const ch = String.fromCharCode(codeInt);
        result = result + ch;
      }
      i = i + 1;
    };
    return result;
  };
  parseFile (dirPath, fileName) {
    const fileContent = (function(){ var b = require('fs').readFileSync(dirPath + '/' + fileName); var ab = new ArrayBuffer(b.length); var v = new Uint8Array(ab); for(var i=0;i<b.length;i++)v[i]=b[i]; ab._view = new DataView(ab); return ab; })();
    const src = (function(b){ var v = new Uint8Array(b); return String.fromCharCode.apply(null, v); })(fileContent);
    return this.parse(src);
  };
  parse (src) {
    this.source = src;
    const lexer = new TSLexer(src);
    const tokens = lexer.tokenize();
    this.parser.initParser(tokens);
    this.parser.tsxMode = true;
    const ast = this.parser.parseProgram();
    const jsxRoot = this.findJSXRoot(ast);
    if ( jsxRoot.nodeType == "" ) {
      console.log("Error: No JSX found in render() function");
      const empty = new EVGElement();
      return empty;
    }
    return this.convertNode(jsxRoot);
  };
  findJSXRoot (ast) {
    const result = this.searchForRenderFunction(ast);
    return result;
  };
  searchForRenderFunction (node) {
    const empty = new TSNode();
    if ( node.nodeType == "FunctionDeclaration" ) {
      if ( node.name == "render" ) {
        return this.findReturnJSX(node);
      }
    }
    if ( node.nodeType == "VariableDeclaration" ) {
      let i = 0;
      while (i < (node.children.length)) {
        const child = node.children[i];
        if ( child.name == "render" ) {
          if ( typeof(child.right) != "undefined" ) {
            const rightNode = child.right;
            if ( rightNode.nodeType == "FunctionExpression" ) {
              return this.findReturnJSX(rightNode);
            }
            if ( rightNode.nodeType == "ArrowFunctionExpression" ) {
              return this.findReturnJSX(rightNode);
            }
          }
        }
        i = i + 1;
      };
    }
    let i_1 = 0;
    while (i_1 < (node.children.length)) {
      const child_1 = node.children[i_1];
      const found = this.searchForRenderFunction(child_1);
      if ( found.nodeType != "" ) {
        return found;
      }
      i_1 = i_1 + 1;
    };
    if ( typeof(node.left) != "undefined" ) {
      const leftNode = node.left;
      const found_1 = this.searchForRenderFunction(leftNode);
      if ( found_1.nodeType != "" ) {
        return found_1;
      }
    }
    if ( typeof(node.right) != "undefined" ) {
      const rightNode_1 = node.right;
      const found_2 = this.searchForRenderFunction(rightNode_1);
      if ( found_2.nodeType != "" ) {
        return found_2;
      }
    }
    return empty;
  };
  findReturnJSX (funcNode) {
    const empty = new TSNode();
    if ( typeof(funcNode.body) != "undefined" ) {
      const bodyNode = funcNode.body;
      const found = this.findReturnJSX(bodyNode);
      if ( found.nodeType != "" ) {
        return found;
      }
    }
    let i = 0;
    while (i < (funcNode.children.length)) {
      const child = funcNode.children[i];
      if ( child.nodeType == "ReturnStatement" ) {
        if ( typeof(child.left) != "undefined" ) {
          const leftNode = child.left;
          if ( (leftNode.nodeType == "JSXElement") || (leftNode.nodeType == "JSXFragment") ) {
            return leftNode;
          }
        }
      }
      if ( child.nodeType == "BlockStatement" ) {
        const found_1 = this.findReturnJSX(child);
        if ( found_1.nodeType != "" ) {
          return found_1;
        }
      }
      if ( (child.nodeType == "JSXElement") || (child.nodeType == "JSXFragment") ) {
        return child;
      }
      i = i + 1;
    };
    if ( typeof(funcNode.right) != "undefined" ) {
      const rightNode = funcNode.right;
      if ( (rightNode.nodeType == "JSXElement") || (rightNode.nodeType == "JSXFragment") ) {
        return rightNode;
      }
    }
    return empty;
  };
  convertNode (jsxNode) {
    const element = new EVGElement();
    if ( jsxNode.nodeType == "JSXElement" ) {
      return this.convertJSXElement(jsxNode);
    }
    if ( jsxNode.nodeType == "JSXFragment" ) {
      element.tagName = "div";
      this.convertChildren(element, jsxNode);
      return element;
    }
    if ( jsxNode.nodeType == "JSXText" ) {
      element.tagName = "text";
      element.textContent = this.trimText(jsxNode.value);
      return element;
    }
    if ( jsxNode.nodeType == "JSXExpressionContainer" ) {
      if ( typeof(jsxNode.left) != "undefined" ) {
        if ( jsxNode.left.nodeType == "StringLiteral" ) {
          element.tagName = "text";
          element.textContent = jsxNode.left.value;
          return element;
        }
        if ( jsxNode.left.nodeType == "NumericLiteral" ) {
          element.tagName = "text";
          element.textContent = jsxNode.left.value;
          return element;
        }
      }
      element.tagName = "";
      return element;
    }
    element.tagName = "";
    return element;
  };
  convertJSXElement (jsxNode) {
    const element = new EVGElement();
    let tagName = "";
    if ( typeof(jsxNode.left) != "undefined" ) {
      tagName = jsxNode.left.name;
    }
    element.tagName = this.mapTagName(tagName);
    if ( tagName == "page" ) {
      element.tagName = "page";
    }
    if ( tagName == "row" ) {
      element.tagName = "div";
      element.display = "flex";
      element.flexDirection = "row";
    }
    if ( tagName == "column" ) {
      element.tagName = "div";
      element.display = "flex";
      element.flexDirection = "column";
    }
    if ( tagName == "spacer" ) {
      element.tagName = "spacer";
    }
    if ( tagName == "divider" ) {
      element.tagName = "divider";
    }
    if ( typeof(jsxNode.left) != "undefined" ) {
      const leftNode = jsxNode.left;
      this.parseAttributes(element, leftNode);
    }
    if ( ((tagName == "span") || (tagName == "Label")) || (tagName == "text") ) {
      element.textContent = this.collectTextContent(jsxNode);
    } else {
      this.convertChildren(element, jsxNode);
    }
    return element;
  };
  collectTextContent (jsxNode) {
    let result = "";
    let i = 0;
    while (i < (jsxNode.children.length)) {
      const child = jsxNode.children[i];
      if ( child.nodeType == "JSXText" ) {
        const text = this.trimText(child.value);
        if ( (text.length) > 0 ) {
          if ( (result.length) > 0 ) {
            const firstChar = text.charCodeAt(0 );
            const isPunct = ((((((((firstChar == 44) || (firstChar == 46)) || (firstChar == 33)) || (firstChar == 63)) || (firstChar == 58)) || (firstChar == 59)) || (firstChar == 45)) || (firstChar == 41)) || (firstChar == 93);
            if ( isPunct ) {
              result = result + text;
            } else {
              result = (result + " ") + text;
            }
          } else {
            result = text;
          }
        }
      }
      if ( child.nodeType == "JSXExpressionContainer" ) {
        if ( typeof(child.left) != "undefined" ) {
          if ( child.left.nodeType == "StringLiteral" ) {
            const text_1 = this.unquote(child.left.value);
            if ( (result.length) > 0 ) {
              result = (result + " ") + text_1;
            } else {
              result = text_1;
            }
          }
          if ( child.left.nodeType == "TemplateLiteral" ) {
            const leftNode = child.left;
            const text_2 = this.extractTemplateLiteralText(leftNode);
            if ( (result.length) > 0 ) {
              result = (result + " ") + text_2;
            } else {
              result = text_2;
            }
          }
        }
      }
      i = i + 1;
    };
    return result;
  };
  extractTemplateLiteralText (node) {
    let result = "";
    let i = 0;
    while (i < (node.children.length)) {
      const child = node.children[i];
      if ( child.nodeType == "TemplateElement" ) {
        if ( (result.length) > 0 ) {
          result = result + child.value;
        } else {
          result = child.value;
        }
      }
      i = i + 1;
    };
    return result;
  };
  mapTagName (jsxTag) {
    if ( jsxTag == "Print" ) {
      return "print";
    }
    if ( jsxTag == "Section" ) {
      return "section";
    }
    if ( jsxTag == "Page" ) {
      return "page";
    }
    if ( jsxTag == "page" ) {
      return "page";
    }
    if ( jsxTag == "View" ) {
      return "div";
    }
    if ( jsxTag == "div" ) {
      return "div";
    }
    if ( jsxTag == "box" ) {
      return "div";
    }
    if ( jsxTag == "row" ) {
      return "div";
    }
    if ( jsxTag == "column" ) {
      return "div";
    }
    if ( jsxTag == "span" ) {
      return "text";
    }
    if ( jsxTag == "Label" ) {
      return "text";
    }
    if ( jsxTag == "text" ) {
      return "text";
    }
    if ( jsxTag == "img" ) {
      return "image";
    }
    if ( jsxTag == "image" ) {
      return "image";
    }
    if ( jsxTag == "Image" ) {
      return "image";
    }
    if ( jsxTag == "path" ) {
      return "path";
    }
    if ( jsxTag == "Path" ) {
      return "path";
    }
    return "div";
  };
  parseAttributes (element, openingNode) {
    let i = 0;
    while (i < (openingNode.children.length)) {
      const attr = openingNode.children[i];
      if ( attr.nodeType == "JSXAttribute" ) {
        const rawAttrName = attr.name;
        const attrName = this.camelToKebab(rawAttrName);
        const attrValue = this.getAttributeValue(attr);
        console.log((((("  Attr: " + rawAttrName) + " -> ") + attrName) + " = ") + attrValue);
        if ( attrName == "id" ) {
          element.id = attrValue;
        }
        if ( attrName == "className" ) {
          element.className = attrValue;
        }
        if ( attrName == "src" ) {
          element.src = attrValue;
        }
        if ( attrName == "alt" ) {
          element.alt = attrValue;
        }
        if ( (attrName == "d") || (attrName == "svg-path") ) {
          element.svgPath = attrValue;
        }
        if ( attrName == "view-box" ) {
          element.viewBox = attrValue;
        }
        if ( attrName == "fill" ) {
          element.fillColor = EVGColor.parse(attrValue);
        }
        if ( attrName == "stroke" ) {
          element.strokeColor = EVGColor.parse(attrValue);
        }
        if ( attrName == "stroke-width" ) {
          element.strokeWidth = (isNaN( parseFloat(attrValue) ) ? undefined : parseFloat(attrValue));
        }
        if ( attrName == "clip-path" ) {
          element.clipPath = attrValue;
        }
        if ( attrName == "width" ) {
          const unit = EVGUnit.parse(attrValue);
          element.width = unit;
          if ( (unit.unitType == 0) && (unit.pixels > 0.0) ) {
            this.pageWidth = unit.pixels;
          }
        }
        if ( attrName == "height" ) {
          const unit_1 = EVGUnit.parse(attrValue);
          element.height = unit_1;
          if ( (unit_1.unitType == 0) && (unit_1.pixels > 0.0) ) {
            this.pageHeight = unit_1.pixels;
          }
        }
        if ( attrName == "page-width" ) {
          const unit_2 = EVGUnit.parse(attrValue);
          element.width = unit_2;
        }
        if ( attrName == "page-height" ) {
          const unit_3 = EVGUnit.parse(attrValue);
          element.height = unit_3;
        }
        if ( attrName == "color" ) {
          element.color = EVGColor.parse(attrValue);
        }
        if ( attrName == "style" ) {
          this.parseStyleAttribute(element, attr);
        }
        if ( attrName == "padding" ) {
          this.applyStyleProperty(element, "padding", attrValue);
        }
        if ( attrName == "margin" ) {
          this.applyStyleProperty(element, "margin", attrValue);
        }
        if ( attrName == "margin-top" ) {
          this.applyStyleProperty(element, "marginTop", attrValue);
        }
        if ( attrName == "margin-bottom" ) {
          this.applyStyleProperty(element, "marginBottom", attrValue);
        }
        if ( attrName == "margin-left" ) {
          this.applyStyleProperty(element, "marginLeft", attrValue);
        }
        if ( attrName == "margin-right" ) {
          this.applyStyleProperty(element, "marginRight", attrValue);
        }
        if ( attrName == "font-size" ) {
          this.applyStyleProperty(element, "fontSize", attrValue);
        }
        if ( attrName == "font-weight" ) {
          this.applyStyleProperty(element, "fontWeight", attrValue);
        }
        if ( attrName == "font-family" ) {
          this.applyStyleProperty(element, "fontFamily", attrValue);
        }
        if ( attrName == "background-color" ) {
          console.log("  Parsing background-color: " + attrValue);
          this.applyStyleProperty(element, "backgroundColor", attrValue);
          const bgc = element.backgroundColor;
          console.log((("  After parse: isSet=" + ((bgc.isSet.toString()))) + " r=") + ((bgc.r.toString())));
        }
        if ( attrName == "border-radius" ) {
          this.applyStyleProperty(element, "borderRadius", attrValue);
        }
        if ( attrName == "border-width" ) {
          this.applyStyleProperty(element, "borderWidth", attrValue);
        }
        if ( attrName == "line-height" ) {
          this.applyStyleProperty(element, "lineHeight", attrValue);
        }
        if ( attrName == "text-align" ) {
          this.applyStyleProperty(element, "textAlign", attrValue);
        }
        if ( attrName == "flex-direction" ) {
          this.applyStyleProperty(element, "flexDirection", attrValue);
        }
        if ( attrName == "flex" ) {
          this.applyStyleProperty(element, "flex", attrValue);
        }
        if ( attrName == "border-color" ) {
          this.applyStyleProperty(element, "borderColor", attrValue);
        }
        if ( attrName == "shadow-radius" ) {
          this.applyStyleProperty(element, "shadowRadius", attrValue);
        }
        if ( attrName == "shadow-color" ) {
          this.applyStyleProperty(element, "shadowColor", attrValue);
        }
        if ( attrName == "shadow-offset-x" ) {
          this.applyStyleProperty(element, "shadowOffsetX", attrValue);
        }
        if ( attrName == "shadow-offset-y" ) {
          this.applyStyleProperty(element, "shadowOffsetY", attrValue);
        }
        if ( attrName == "background" ) {
          this.applyStyleProperty(element, "background", attrValue);
        }
        if ( attrName == "background-gradient" ) {
          this.applyStyleProperty(element, "backgroundGradient", attrValue);
        }
      }
      i = i + 1;
    };
  };
  getAttributeValue (attr) {
    if ( typeof(attr.right) != "undefined" ) {
      const rightNode = attr.right;
      if ( rightNode.nodeType == "StringLiteral" ) {
        return this.unquote(rightNode.value);
      }
      if ( rightNode.nodeType == "JSXExpressionContainer" ) {
        if ( typeof(rightNode.left) != "undefined" ) {
          const exprNode = rightNode.left;
          return this.extractExpressionValue(exprNode);
        }
      }
    }
    return "";
  };
  extractExpressionValue (exprNode) {
    if ( exprNode.nodeType == "NumericLiteral" ) {
      return exprNode.value;
    }
    if ( exprNode.nodeType == "StringLiteral" ) {
      return this.unquote(exprNode.value);
    }
    if ( exprNode.nodeType == "Identifier" ) {
      return exprNode.name;
    }
    if ( exprNode.nodeType == "ObjectExpression" ) {
      return "OBJECT";
    }
    return "";
  };
  parseStyleAttribute (element, attr) {
    if ( typeof(attr.right) != "undefined" ) {
      const rightNode = attr.right;
      if ( rightNode.nodeType == "JSXExpressionContainer" ) {
        if ( typeof(rightNode.left) != "undefined" ) {
          const styleExpr = rightNode.left;
          this.parseStyleObject(element, styleExpr);
        }
      }
    }
  };
  parseStyleObject (element, styleNode) {
    if ( styleNode.nodeType != "ObjectExpression" ) {
      return;
    }
    let i = 0;
    while (i < (styleNode.children.length)) {
      const prop = styleNode.children[i];
      if ( prop.nodeType == "Property" ) {
        const propName = prop.name;
        let propValue = "";
        if ( typeof(prop.right) != "undefined" ) {
          const propRightNode = prop.right;
          propValue = this.extractExpressionValue(propRightNode);
          if ( propRightNode.nodeType == "StringLiteral" ) {
            propValue = this.unquote(propRightNode.value);
          }
        }
        this.applyStyleProperty(element, propName, propValue);
      }
      i = i + 1;
    };
  };
  applyStyleProperty (element, name, value) {
    if ( name == "width" ) {
      element.width = EVGUnit.parse(value);
    }
    if ( name == "height" ) {
      element.height = EVGUnit.parse(value);
    }
    if ( name == "minWidth" ) {
      element.minWidth = EVGUnit.parse(value);
    }
    if ( name == "maxWidth" ) {
      element.maxWidth = EVGUnit.parse(value);
    }
    if ( name == "minHeight" ) {
      element.minHeight = EVGUnit.parse(value);
    }
    if ( name == "maxHeight" ) {
      element.maxHeight = EVGUnit.parse(value);
    }
    if ( name == "margin" ) {
      const unit = EVGUnit.parse(value);
      element.box.marginTop = unit;
      element.box.marginRight = unit;
      element.box.marginBottom = unit;
      element.box.marginLeft = unit;
    }
    if ( name == "marginTop" ) {
      element.box.marginTop = EVGUnit.parse(value);
    }
    if ( name == "marginRight" ) {
      element.box.marginRight = EVGUnit.parse(value);
    }
    if ( name == "marginBottom" ) {
      element.box.marginBottom = EVGUnit.parse(value);
    }
    if ( name == "marginLeft" ) {
      element.box.marginLeft = EVGUnit.parse(value);
    }
    if ( name == "padding" ) {
      const unit_1 = EVGUnit.parse(value);
      element.box.paddingTop = unit_1;
      element.box.paddingRight = unit_1;
      element.box.paddingBottom = unit_1;
      element.box.paddingLeft = unit_1;
    }
    if ( name == "paddingTop" ) {
      element.box.paddingTop = EVGUnit.parse(value);
    }
    if ( name == "paddingRight" ) {
      element.box.paddingRight = EVGUnit.parse(value);
    }
    if ( name == "paddingBottom" ) {
      element.box.paddingBottom = EVGUnit.parse(value);
    }
    if ( name == "paddingLeft" ) {
      element.box.paddingLeft = EVGUnit.parse(value);
    }
    if ( name == "border" ) {
      element.box.borderWidth = EVGUnit.parse(value);
    }
    if ( name == "borderWidth" ) {
      element.borderWidth = EVGUnit.parse(value);
    }
    if ( name == "borderColor" ) {
      element.borderColor = EVGColor.parse(value);
    }
    if ( name == "borderTop" ) {
      element.borderTopWidth = EVGUnit.parse(value);
    }
    if ( name == "borderRight" ) {
      element.borderRightWidth = EVGUnit.parse(value);
    }
    if ( name == "borderBottom" ) {
      element.borderBottomWidth = EVGUnit.parse(value);
    }
    if ( name == "borderLeft" ) {
      element.borderLeftWidth = EVGUnit.parse(value);
    }
    if ( name == "borderRadius" ) {
      element.box.borderRadius = EVGUnit.parse(value);
    }
    if ( name == "display" ) {
      element.display = value;
    }
    if ( name == "flexDirection" ) {
      element.flexDirection = value;
    }
    if ( name == "justifyContent" ) {
      element.justifyContent = value;
    }
    if ( name == "alignItems" ) {
      element.alignItems = value;
    }
    if ( name == "gap" ) {
      element.gap = EVGUnit.parse(value);
    }
    if ( name == "flex" ) {
      element.flex = this.parseNumberValue(value);
    }
    if ( name == "position" ) {
      element.position = value;
    }
    if ( name == "top" ) {
      element.top = EVGUnit.parse(value);
    }
    if ( name == "left" ) {
      element.left = EVGUnit.parse(value);
    }
    if ( name == "right" ) {
      element.right = EVGUnit.parse(value);
    }
    if ( name == "bottom" ) {
      element.bottom = EVGUnit.parse(value);
    }
    if ( name == "backgroundColor" ) {
      element.backgroundColor = EVGColor.parse(value);
    }
    if ( name == "background" ) {
      if ( (value.includes("linear-gradient")) || (value.includes("radial-gradient")) ) {
        element.backgroundGradient = value;
        element.gradient = EVGGradient.parse(value);
      } else {
        element.backgroundColor = EVGColor.parse(value);
      }
    }
    if ( name == "backgroundGradient" ) {
      element.backgroundGradient = value;
      element.gradient = EVGGradient.parse(value);
    }
    if ( name == "color" ) {
      element.color = EVGColor.parse(value);
    }
    if ( name == "opacity" ) {
      element.opacity = this.parseNumberValue(value);
    }
    if ( name == "shadowRadius" ) {
      element.shadowRadius = EVGUnit.parse(value);
    }
    if ( name == "shadowColor" ) {
      element.shadowColor = EVGColor.parse(value);
    }
    if ( name == "shadowOffsetX" ) {
      element.shadowOffsetX = EVGUnit.parse(value);
    }
    if ( name == "shadowOffsetY" ) {
      element.shadowOffsetY = EVGUnit.parse(value);
    }
    if ( name == "fontSize" ) {
      element.fontSize = EVGUnit.parse(value);
    }
    if ( name == "fontFamily" ) {
      element.fontFamily = value;
    }
    if ( name == "fontWeight" ) {
      element.fontWeight = value;
    }
    if ( name == "textAlign" ) {
      element.textAlign = value;
    }
    if ( name == "lineHeight" ) {
      element.lineHeight = this.parseNumberValue(value);
    }
  };
  convertChildren (element, jsxNode) {
    let i = 0;
    while (i < (jsxNode.children.length)) {
      const childJsx = jsxNode.children[i];
      if ( childJsx.nodeType == "JSXOpeningElement" ) {
        i = i + 1;
        continue;
      }
      if ( childJsx.nodeType == "JSXClosingElement" ) {
        i = i + 1;
        continue;
      }
      if ( childJsx.nodeType == "JSXAttribute" ) {
        i = i + 1;
        continue;
      }
      const childElement = this.convertNode(childJsx);
      if ( childElement.tagName != "" ) {
        if ( childElement.tagName == "text" ) {
          let hasContent = false;
          if ( (childElement.textContent.length) > 0 ) {
            hasContent = true;
          }
          if ( childElement.getChildCount() > 0 ) {
            hasContent = true;
          }
          if ( hasContent == false ) {
            i = i + 1;
            continue;
          }
        }
        childElement.parent = element;
        element.children.push(childElement);
      }
      i = i + 1;
    };
  };
  unquote (s) {
    const __len = s.length;
    if ( __len < 2 ) {
      return s;
    }
    const first = s.charCodeAt(0 );
    const last = s.charCodeAt((__len - 1) );
    if ( ((first == 34) || (first == 39)) && (first == last) ) {
      return s.substring(1, (__len - 1) );
    }
    return s;
  };
  trimText (s) {
    const __len = s.length;
    let result = "";
    let lastWasSpace = true;
    let i = 0;
    while (i < __len) {
      const c = s.charCodeAt(i );
      const isWhitespace = (((c == 32) || (c == 9)) || (c == 10)) || (c == 13);
      if ( isWhitespace ) {
        if ( lastWasSpace == false ) {
          result = result + " ";
          lastWasSpace = true;
        }
      } else {
        result = result + (String.fromCharCode(c));
        lastWasSpace = false;
      }
      i = i + 1;
    };
    const resultLen = result.length;
    if ( resultLen > 0 ) {
      const lastChar = result.charCodeAt((resultLen - 1) );
      if ( lastChar == 32 ) {
        result = result.substring(0, (resultLen - 1) );
      }
    }
    return result;
  };
  parseNumberValue (s) {
    const result = isNaN( parseFloat(s) ) ? undefined : parseFloat(s);
    if ( typeof(result) != "undefined" ) {
      return result;
    }
    return 0.0;
  };
  getPageWidth () {
    return this.pageWidth;
  };
  getPageHeight () {
    return this.pageHeight;
  };
}
class BufferChunk  {
  constructor(size) {
    this.data = (function(){ var b = new ArrayBuffer(0); b._view = new DataView(b); return b; })();
    this.used = 0;
    this.capacity = 0;
    this.data = (function(){ var b = new ArrayBuffer(size); b._view = new DataView(b); return b; })();
    this.capacity = size;
    this.used = 0;
  }
  remaining () {
    return this.capacity - this.used;
  };
  isFull () {
    return this.used >= this.capacity;
  };
}
class GrowableBuffer  {
  constructor() {
    this.firstChunk = new BufferChunk(4096);
    this.currentChunk = new BufferChunk(4096);
    this.chunkSize = 4096;
    this.totalSize = 0;
    const chunk = new BufferChunk(this.chunkSize);
    this.firstChunk = chunk;
    this.currentChunk = chunk;
  }
  setChunkSize (size) {
    this.chunkSize = size;
  };
  allocateNewChunk () {
    const newChunk = new BufferChunk(this.chunkSize);
    this.currentChunk.next = newChunk;
    this.currentChunk = newChunk;
  };
  writeByte (b) {
    if ( this.currentChunk.isFull() ) {
      this.allocateNewChunk();
    }
    const pos = this.currentChunk.used;
    this.currentChunk.data._view.setUint8(pos, b);
    this.currentChunk.used = pos + 1;
    this.totalSize = this.totalSize + 1;
  };
  writeBytes (src, srcOffset, length) {
    let i = 0;
    while (i < length) {
      const b = src._view.getUint8((srcOffset + i));
      this.writeByte(b);
      i = i + 1;
    };
  };
  writeBuffer (src) {
    const __len = src.byteLength;
    this.writeBytes(src, 0, __len);
  };
  writeString (s) {
    const __len = s.length;
    let i = 0;
    while (i < __len) {
      const ch = s.charCodeAt(i );
      this.writeByte(ch);
      i = i + 1;
    };
  };
  writeInt16BE (value) {
    const highD = value / 256;
    const high = Math.floor( highD);
    const low = value - (high * 256);
    this.writeByte(high);
    this.writeByte(low);
  };
  writeInt32BE (value) {
    const b1D = value / 16777216;
    const b1 = Math.floor( b1D);
    const rem1 = value - (b1 * 16777216);
    const b2D = rem1 / 65536;
    const b2 = Math.floor( b2D);
    const rem2 = rem1 - (b2 * 65536);
    const b3D = rem2 / 256;
    const b3 = Math.floor( b3D);
    const b4 = rem2 - (b3 * 256);
    this.writeByte(b1);
    this.writeByte(b2);
    this.writeByte(b3);
    this.writeByte(b4);
  };
  size () {
    return this.totalSize;
  };
  toBuffer () {
    const allocSize = this.totalSize;
    const result = (function(){ var b = new ArrayBuffer(allocSize); b._view = new DataView(b); return b; })();
    let pos = 0;
    let chunk = this.firstChunk;
    let done = false;
    while (done == false) {
      const chunkUsed = chunk.used;
      let i = 0;
      while (i < chunkUsed) {
        const b = chunk.data._view.getUint8(i);
        result._view.setUint8(pos, b);
        pos = pos + 1;
        i = i + 1;
      };
      if ( typeof(chunk.next) === "undefined" ) {
        done = true;
      } else {
        chunk = chunk.next;
      }
    };
    return result;
  };
  toString () {
    let result = "";
    let chunk = this.firstChunk;
    let done = false;
    while (done == false) {
      const chunkUsed = chunk.used;
      let i = 0;
      while (i < chunkUsed) {
        const b = chunk.data._view.getUint8(i);
        result = result + (String.fromCharCode(b));
        i = i + 1;
      };
      if ( typeof(chunk.next) === "undefined" ) {
        done = true;
      } else {
        chunk = chunk.next;
      }
    };
    return result;
  };
  clear () {
    const chunk = new BufferChunk(this.chunkSize);
    this.firstChunk = chunk;
    this.currentChunk = chunk;
    this.totalSize = 0;
  };
}
class Color  {
  constructor() {
    this.r = 0;
    this.g = 0;
    this.b = 0;
    this.a = 255;
  }
  setRGB (red, green, blue) {
    this.r = red;
    this.g = green;
    this.b = blue;
    this.a = 255;
  };
  setRGBA (red, green, blue, alpha) {
    this.r = red;
    this.g = green;
    this.b = blue;
    this.a = alpha;
  };
  clamp (val) {
    if ( val < 0 ) {
      return 0;
    }
    if ( val > 255 ) {
      return 255;
    }
    return val;
  };
  set (red, green, blue) {
    this.r = this.clamp(red);
    this.g = this.clamp(green);
    this.b = this.clamp(blue);
  };
  grayscale () {
    return ((((this.r * 77) + (this.g * 150)) + (this.b * 29)) >> 8);
  };
  toGrayscale () {
    const gray = this.grayscale();
    this.r = gray;
    this.g = gray;
    this.b = gray;
  };
  invert () {
    this.r = 255 - this.r;
    this.g = 255 - this.g;
    this.b = 255 - this.b;
  };
  adjustBrightness (amount) {
    this.r = this.clamp((this.r + amount));
    this.g = this.clamp((this.g + amount));
    this.b = this.clamp((this.b + amount));
  };
}
class ImageBuffer  {
  constructor() {
    this.width = 0;
    this.height = 0;
    this.pixels = (function(){ var b = new ArrayBuffer(0); b._view = new DataView(b); return b; })();
  }
  init (w, h) {
    this.width = w;
    this.height = h;
    const size = (w * h) * 4;
    this.pixels = (function(){ var b = new ArrayBuffer(size); b._view = new DataView(b); return b; })();
    this.fill(255, 255, 255, 255);
  };
  getPixelOffset (x, y) {
    return ((y * this.width) + x) * 4;
  };
  isValidCoord (x, y) {
    if ( x < 0 ) {
      return false;
    }
    if ( y < 0 ) {
      return false;
    }
    if ( x >= this.width ) {
      return false;
    }
    if ( y >= this.height ) {
      return false;
    }
    return true;
  };
  getPixel (x, y) {
    const c = new Color();
    if ( this.isValidCoord(x, y) ) {
      const off = this.getPixelOffset(x, y);
      c.r = this.pixels._view.getUint8(off);
      c.g = this.pixels._view.getUint8((off + 1));
      c.b = this.pixels._view.getUint8((off + 2));
      c.a = this.pixels._view.getUint8((off + 3));
    }
    return c;
  };
  setPixel (x, y, c) {
    if ( this.isValidCoord(x, y) ) {
      const off = this.getPixelOffset(x, y);
      this.pixels._view.setUint8(off, c.r);
      this.pixels._view.setUint8(off + 1, c.g);
      this.pixels._view.setUint8(off + 2, c.b);
      this.pixels._view.setUint8(off + 3, c.a);
    }
  };
  setPixelRGB (x, y, r, g, b) {
    if ( this.isValidCoord(x, y) ) {
      const off = this.getPixelOffset(x, y);
      this.pixels._view.setUint8(off, r);
      this.pixels._view.setUint8(off + 1, g);
      this.pixels._view.setUint8(off + 2, b);
      this.pixels._view.setUint8(off + 3, 255);
    }
  };
  fill (r, g, b, a) {
    const size = (this.width * this.height) * 4;
    let i = 0;
    while (i < size) {
      this.pixels._view.setUint8(i, r);
      this.pixels._view.setUint8(i + 1, g);
      this.pixels._view.setUint8(i + 2, b);
      this.pixels._view.setUint8(i + 3, a);
      i = i + 4;
    };
  };
  fillRect (x, y, w, h, c) {
    const endX = x + w;
    const endY = y + h;
    let py = y;
    while (py < endY) {
      let px = x;
      while (px < endX) {
        this.setPixel(px, py, c);
        px = px + 1;
      };
      py = py + 1;
    };
  };
  invert () {
    const size = this.width * this.height;
    let i = 0;
    while (i < size) {
      const off = i * 4;
      const r = this.pixels._view.getUint8(off);
      const g = this.pixels._view.getUint8((off + 1));
      const b = this.pixels._view.getUint8((off + 2));
      this.pixels._view.setUint8(off, 255 - r);
      this.pixels._view.setUint8(off + 1, 255 - g);
      this.pixels._view.setUint8(off + 2, 255 - b);
      i = i + 1;
    };
  };
  grayscale () {
    const size = this.width * this.height;
    let i = 0;
    while (i < size) {
      const off = i * 4;
      const r = this.pixels._view.getUint8(off);
      const g = this.pixels._view.getUint8((off + 1));
      const b = this.pixels._view.getUint8((off + 2));
      const gray = ((((r * 77) + (g * 150)) + (b * 29)) >> 8);
      this.pixels._view.setUint8(off, gray);
      this.pixels._view.setUint8(off + 1, gray);
      this.pixels._view.setUint8(off + 2, gray);
      i = i + 1;
    };
  };
  adjustBrightness (amount) {
    const size = this.width * this.height;
    let i = 0;
    while (i < size) {
      const off = i * 4;
      let r = this.pixels._view.getUint8(off);
      let g = this.pixels._view.getUint8((off + 1));
      let b = this.pixels._view.getUint8((off + 2));
      r = r + amount;
      g = g + amount;
      b = b + amount;
      if ( r < 0 ) {
        r = 0;
      }
      if ( r > 255 ) {
        r = 255;
      }
      if ( g < 0 ) {
        g = 0;
      }
      if ( g > 255 ) {
        g = 255;
      }
      if ( b < 0 ) {
        b = 0;
      }
      if ( b > 255 ) {
        b = 255;
      }
      this.pixels._view.setUint8(off, r);
      this.pixels._view.setUint8(off + 1, g);
      this.pixels._view.setUint8(off + 2, b);
      i = i + 1;
    };
  };
  threshold (level) {
    const size = this.width * this.height;
    let i = 0;
    while (i < size) {
      const off = i * 4;
      const r = this.pixels._view.getUint8(off);
      const g = this.pixels._view.getUint8((off + 1));
      const b = this.pixels._view.getUint8((off + 2));
      const gray = ((((r * 77) + (g * 150)) + (b * 29)) >> 8);
      let val = 0;
      if ( gray >= level ) {
        val = 255;
      }
      this.pixels._view.setUint8(off, val);
      this.pixels._view.setUint8(off + 1, val);
      this.pixels._view.setUint8(off + 2, val);
      i = i + 1;
    };
  };
  sepia () {
    const size = this.width * this.height;
    let i = 0;
    while (i < size) {
      const off = i * 4;
      const r = this.pixels._view.getUint8(off);
      const g = this.pixels._view.getUint8((off + 1));
      const b = this.pixels._view.getUint8((off + 2));
      let newR = ((((r * 101) + (g * 197)) + (b * 48)) >> 8);
      let newG = ((((r * 89) + (g * 175)) + (b * 43)) >> 8);
      let newB = ((((r * 70) + (g * 137)) + (b * 33)) >> 8);
      if ( newR > 255 ) {
        newR = 255;
      }
      if ( newG > 255 ) {
        newG = 255;
      }
      if ( newB > 255 ) {
        newB = 255;
      }
      this.pixels._view.setUint8(off, newR);
      this.pixels._view.setUint8(off + 1, newG);
      this.pixels._view.setUint8(off + 2, newB);
      i = i + 1;
    };
  };
  flipHorizontal () {
    let y = 0;
    while (y < this.height) {
      let x = 0;
      const halfW = (this.width >> 1);
      while (x < halfW) {
        const x2 = (this.width - 1) - x;
        const off1 = this.getPixelOffset(x, y);
        const off2 = this.getPixelOffset(x2, y);
        const r1 = this.pixels._view.getUint8(off1);
        const g1 = this.pixels._view.getUint8((off1 + 1));
        const b1 = this.pixels._view.getUint8((off1 + 2));
        const a1 = this.pixels._view.getUint8((off1 + 3));
        const r2 = this.pixels._view.getUint8(off2);
        const g2 = this.pixels._view.getUint8((off2 + 1));
        const b2 = this.pixels._view.getUint8((off2 + 2));
        const a2 = this.pixels._view.getUint8((off2 + 3));
        this.pixels._view.setUint8(off1, r2);
        this.pixels._view.setUint8(off1 + 1, g2);
        this.pixels._view.setUint8(off1 + 2, b2);
        this.pixels._view.setUint8(off1 + 3, a2);
        this.pixels._view.setUint8(off2, r1);
        this.pixels._view.setUint8(off2 + 1, g1);
        this.pixels._view.setUint8(off2 + 2, b1);
        this.pixels._view.setUint8(off2 + 3, a1);
        x = x + 1;
      };
      y = y + 1;
    };
  };
  flipVertical () {
    let y = 0;
    const halfH = (this.height >> 1);
    while (y < halfH) {
      const y2 = (this.height - 1) - y;
      let x = 0;
      while (x < this.width) {
        const off1 = this.getPixelOffset(x, y);
        const off2 = this.getPixelOffset(x, y2);
        const r1 = this.pixels._view.getUint8(off1);
        const g1 = this.pixels._view.getUint8((off1 + 1));
        const b1 = this.pixels._view.getUint8((off1 + 2));
        const a1 = this.pixels._view.getUint8((off1 + 3));
        const r2 = this.pixels._view.getUint8(off2);
        const g2 = this.pixels._view.getUint8((off2 + 1));
        const b2 = this.pixels._view.getUint8((off2 + 2));
        const a2 = this.pixels._view.getUint8((off2 + 3));
        this.pixels._view.setUint8(off1, r2);
        this.pixels._view.setUint8(off1 + 1, g2);
        this.pixels._view.setUint8(off1 + 2, b2);
        this.pixels._view.setUint8(off1 + 3, a2);
        this.pixels._view.setUint8(off2, r1);
        this.pixels._view.setUint8(off2 + 1, g1);
        this.pixels._view.setUint8(off2 + 2, b1);
        this.pixels._view.setUint8(off2 + 3, a1);
        x = x + 1;
      };
      y = y + 1;
    };
  };
  drawLine (x1, y1, x2, y2, c) {
    let dx = x2 - x1;
    let dy = y2 - y1;
    if ( dx < 0 ) {
      dx = 0 - dx;
    }
    if ( dy < 0 ) {
      dy = 0 - dy;
    }
    let sx = 1;
    if ( x1 > x2 ) {
      sx = -1;
    }
    let sy = 1;
    if ( y1 > y2 ) {
      sy = -1;
    }
    let err = dx - dy;
    let x = x1;
    let y = y1;
    let done = false;
    while (done == false) {
      this.setPixel(x, y, c);
      if ( (x == x2) && (y == y2) ) {
        done = true;
      } else {
        const e2 = err * 2;
        if ( e2 > (0 - dy) ) {
          err = err - dy;
          x = x + sx;
        }
        if ( e2 < dx ) {
          err = err + dx;
          y = y + sy;
        }
      }
    };
  };
  drawRect (x, y, w, h, c) {
    this.drawLine(x, y, (x + w) - 1, y, c);
    this.drawLine((x + w) - 1, y, (x + w) - 1, (y + h) - 1, c);
    this.drawLine((x + w) - 1, (y + h) - 1, x, (y + h) - 1, c);
    this.drawLine(x, (y + h) - 1, x, y, c);
  };
  scale (factor) {
    const newW = this.width * factor;
    const newH = this.height * factor;
    return this.scaleToSize(newW, newH);
  };
  scaleToSize (newW, newH) {
    const result = new ImageBuffer();
    result.init(newW, newH);
    const scaleX = (this.width) / (newW);
    const scaleY = (this.height) / (newH);
    let destY = 0;
    while (destY < newH) {
      const srcYf = (destY) * scaleY;
      const srcY0 = Math.floor( srcYf);
      let srcY1 = srcY0 + 1;
      if ( srcY1 >= this.height ) {
        srcY1 = this.height - 1;
      }
      const fy = srcYf - (srcY0);
      let destX = 0;
      while (destX < newW) {
        const srcXf = (destX) * scaleX;
        const srcX0 = Math.floor( srcXf);
        let srcX1 = srcX0 + 1;
        if ( srcX1 >= this.width ) {
          srcX1 = this.width - 1;
        }
        const fx = srcXf - (srcX0);
        const off00 = ((srcY0 * this.width) + srcX0) * 4;
        const off01 = ((srcY0 * this.width) + srcX1) * 4;
        const off10 = ((srcY1 * this.width) + srcX0) * 4;
        const off11 = ((srcY1 * this.width) + srcX1) * 4;
        const r = this.bilinear((this.pixels._view.getUint8(off00)), (this.pixels._view.getUint8(off01)), (this.pixels._view.getUint8(off10)), (this.pixels._view.getUint8(off11)), fx, fy);
        const g = this.bilinear((this.pixels._view.getUint8((off00 + 1))), (this.pixels._view.getUint8((off01 + 1))), (this.pixels._view.getUint8((off10 + 1))), (this.pixels._view.getUint8((off11 + 1))), fx, fy);
        const b = this.bilinear((this.pixels._view.getUint8((off00 + 2))), (this.pixels._view.getUint8((off01 + 2))), (this.pixels._view.getUint8((off10 + 2))), (this.pixels._view.getUint8((off11 + 2))), fx, fy);
        const a = this.bilinear((this.pixels._view.getUint8((off00 + 3))), (this.pixels._view.getUint8((off01 + 3))), (this.pixels._view.getUint8((off10 + 3))), (this.pixels._view.getUint8((off11 + 3))), fx, fy);
        const destOff = ((destY * newW) + destX) * 4;
        result.pixels._view.setUint8(destOff, r);
        result.pixels._view.setUint8(destOff + 1, g);
        result.pixels._view.setUint8(destOff + 2, b);
        result.pixels._view.setUint8(destOff + 3, a);
        destX = destX + 1;
      };
      destY = destY + 1;
    };
    return result;
  };
  bilinear (v00, v01, v10, v11, fx, fy) {
    const top = ((v00) * (1.0 - fx)) + ((v01) * fx);
    const bottom = ((v10) * (1.0 - fx)) + ((v11) * fx);
    const result = (top * (1.0 - fy)) + (bottom * fy);
    return Math.floor( result);
  };
  rotate90CW () {
    const result = new ImageBuffer();
    result.init(this.height, this.width);
    let y = 0;
    while (y < this.height) {
      let x = 0;
      while (x < this.width) {
        const newX = (this.height - 1) - y;
        const newY = x;
        const srcOff = ((y * this.width) + x) * 4;
        const destOff = ((newY * this.height) + newX) * 4;
        result.pixels._view.setUint8(destOff, this.pixels._view.getUint8(srcOff));
        result.pixels._view.setUint8(destOff + 1, this.pixels._view.getUint8((srcOff + 1)));
        result.pixels._view.setUint8(destOff + 2, this.pixels._view.getUint8((srcOff + 2)));
        result.pixels._view.setUint8(destOff + 3, this.pixels._view.getUint8((srcOff + 3)));
        x = x + 1;
      };
      y = y + 1;
    };
    return result;
  };
  rotate180 () {
    const result = new ImageBuffer();
    result.init(this.width, this.height);
    let y = 0;
    while (y < this.height) {
      let x = 0;
      while (x < this.width) {
        const newX = (this.width - 1) - x;
        const newY = (this.height - 1) - y;
        const srcOff = ((y * this.width) + x) * 4;
        const destOff = ((newY * this.width) + newX) * 4;
        result.pixels._view.setUint8(destOff, this.pixels._view.getUint8(srcOff));
        result.pixels._view.setUint8(destOff + 1, this.pixels._view.getUint8((srcOff + 1)));
        result.pixels._view.setUint8(destOff + 2, this.pixels._view.getUint8((srcOff + 2)));
        result.pixels._view.setUint8(destOff + 3, this.pixels._view.getUint8((srcOff + 3)));
        x = x + 1;
      };
      y = y + 1;
    };
    return result;
  };
  rotate270CW () {
    const result = new ImageBuffer();
    result.init(this.height, this.width);
    let y = 0;
    while (y < this.height) {
      let x = 0;
      while (x < this.width) {
        const newX = y;
        const newY = (this.width - 1) - x;
        const srcOff = ((y * this.width) + x) * 4;
        const destOff = ((newY * this.height) + newX) * 4;
        result.pixels._view.setUint8(destOff, this.pixels._view.getUint8(srcOff));
        result.pixels._view.setUint8(destOff + 1, this.pixels._view.getUint8((srcOff + 1)));
        result.pixels._view.setUint8(destOff + 2, this.pixels._view.getUint8((srcOff + 2)));
        result.pixels._view.setUint8(destOff + 3, this.pixels._view.getUint8((srcOff + 3)));
        x = x + 1;
      };
      y = y + 1;
    };
    return result;
  };
  transpose () {
    const result = new ImageBuffer();
    result.init(this.height, this.width);
    let y = 0;
    while (y < this.height) {
      let x = 0;
      while (x < this.width) {
        const srcOff = ((y * this.width) + x) * 4;
        const destOff = ((x * this.height) + y) * 4;
        result.pixels._view.setUint8(destOff, this.pixels._view.getUint8(srcOff));
        result.pixels._view.setUint8(destOff + 1, this.pixels._view.getUint8((srcOff + 1)));
        result.pixels._view.setUint8(destOff + 2, this.pixels._view.getUint8((srcOff + 2)));
        result.pixels._view.setUint8(destOff + 3, this.pixels._view.getUint8((srcOff + 3)));
        x = x + 1;
      };
      y = y + 1;
    };
    return result;
  };
  transverse () {
    const result = new ImageBuffer();
    result.init(this.height, this.width);
    let y = 0;
    while (y < this.height) {
      let x = 0;
      while (x < this.width) {
        const newX = (this.height - 1) - y;
        const newY = (this.width - 1) - x;
        const srcOff = ((y * this.width) + x) * 4;
        const destOff = ((newY * this.height) + newX) * 4;
        result.pixels._view.setUint8(destOff, this.pixels._view.getUint8(srcOff));
        result.pixels._view.setUint8(destOff + 1, this.pixels._view.getUint8((srcOff + 1)));
        result.pixels._view.setUint8(destOff + 2, this.pixels._view.getUint8((srcOff + 2)));
        result.pixels._view.setUint8(destOff + 3, this.pixels._view.getUint8((srcOff + 3)));
        x = x + 1;
      };
      y = y + 1;
    };
    return result;
  };
  applyExifOrientation (orientation) {
    if ( orientation == 1 ) {
      return this.scale(1);
    }
    if ( orientation == 2 ) {
      const result = new ImageBuffer();
      result.init(this.width, this.height);
      let y = 0;
      while (y < this.height) {
        let x = 0;
        while (x < this.width) {
          const srcOff = ((y * this.width) + x) * 4;
          const destOff = ((y * this.width) + ((this.width - 1) - x)) * 4;
          result.pixels._view.setUint8(destOff, this.pixels._view.getUint8(srcOff));
          result.pixels._view.setUint8(destOff + 1, this.pixels._view.getUint8((srcOff + 1)));
          result.pixels._view.setUint8(destOff + 2, this.pixels._view.getUint8((srcOff + 2)));
          result.pixels._view.setUint8(destOff + 3, this.pixels._view.getUint8((srcOff + 3)));
          x = x + 1;
        };
        y = y + 1;
      };
      return result;
    }
    if ( orientation == 3 ) {
      return this.rotate180();
    }
    if ( orientation == 4 ) {
      const result_1 = new ImageBuffer();
      result_1.init(this.width, this.height);
      let y_1 = 0;
      while (y_1 < this.height) {
        let x_1 = 0;
        while (x_1 < this.width) {
          const srcOff_1 = ((y_1 * this.width) + x_1) * 4;
          const destOff_1 = ((((this.height - 1) - y_1) * this.width) + x_1) * 4;
          result_1.pixels._view.setUint8(destOff_1, this.pixels._view.getUint8(srcOff_1));
          result_1.pixels._view.setUint8(destOff_1 + 1, this.pixels._view.getUint8((srcOff_1 + 1)));
          result_1.pixels._view.setUint8(destOff_1 + 2, this.pixels._view.getUint8((srcOff_1 + 2)));
          result_1.pixels._view.setUint8(destOff_1 + 3, this.pixels._view.getUint8((srcOff_1 + 3)));
          x_1 = x_1 + 1;
        };
        y_1 = y_1 + 1;
      };
      return result_1;
    }
    if ( orientation == 5 ) {
      return this.transpose();
    }
    if ( orientation == 6 ) {
      return this.rotate90CW();
    }
    if ( orientation == 7 ) {
      return this.transverse();
    }
    if ( orientation == 8 ) {
      return this.rotate270CW();
    }
    return this.scale(1);
  };
}
class RasterPixel  {
  constructor() {
    this.r = 0;
    this.g = 0;
    this.b = 0;
    this.a = 255;
  }
  init (red, green, blue, alpha) {
    this.r = red;
    this.g = green;
    this.b = blue;
    this.a = alpha;
  };
  initRGB (red, green, blue) {
    this.r = red;
    this.g = green;
    this.b = blue;
    this.a = 255;
  };
  clone () {
    const p = new RasterPixel();
    p.r = this.r;
    p.g = this.g;
    p.b = this.b;
    p.a = this.a;
    return p;
  };
}
class RasterBuffer  {
  constructor() {
    this.width = 0;
    this.height = 0;
    this.pixels = (function(){ var b = new ArrayBuffer(0); b._view = new DataView(b); return b; })();
  }
  create (w, h) {
    this.width = w;
    this.height = h;
    const size = (w * h) * 4;
    this.pixels = (function(){ var b = new ArrayBuffer(size); b._view = new DataView(b); return b; })();
    let i = 0;
    while (i < size) {
      this.pixels._view.setUint8(i, 0);
      i = i + 1;
    };
  };
  createWithColor (w, h, r, g, b, a) {
    this.create(w, h);
    this.fill(r, g, b, a);
  };
  getIndex (x, y) {
    return ((y * this.width) + x) * 4;
  };
  inBounds (x, y) {
    if ( x < 0 ) {
      return false;
    }
    if ( y < 0 ) {
      return false;
    }
    if ( x >= this.width ) {
      return false;
    }
    if ( y >= this.height ) {
      return false;
    }
    return true;
  };
  setPixel (x, y, r, g, b, a) {
    if ( this.inBounds(x, y) == false ) {
      return;
    }
    const idx = this.getIndex(x, y);
    this.pixels._view.setUint8(idx, r);
    this.pixels._view.setUint8(idx + 1, g);
    this.pixels._view.setUint8(idx + 2, b);
    this.pixels._view.setUint8(idx + 3, a);
  };
  setPixelObj (x, y, p) {
    this.setPixel(x, y, p.r, p.g, p.b, p.a);
  };
  getPixel (x, y) {
    const p = new RasterPixel();
    if ( this.inBounds(x, y) == false ) {
      return p;
    }
    const idx = this.getIndex(x, y);
    p.r = this.pixels._view.getUint8(idx);
    p.g = this.pixels._view.getUint8((idx + 1));
    p.b = this.pixels._view.getUint8((idx + 2));
    p.a = this.pixels._view.getUint8((idx + 3));
    return p;
  };
  getR (x, y) {
    if ( this.inBounds(x, y) == false ) {
      return 0;
    }
    const idx = this.getIndex(x, y);
    return this.pixels._view.getUint8(idx);
  };
  getG (x, y) {
    if ( this.inBounds(x, y) == false ) {
      return 0;
    }
    const idx = this.getIndex(x, y);
    return this.pixels._view.getUint8((idx + 1));
  };
  getB (x, y) {
    if ( this.inBounds(x, y) == false ) {
      return 0;
    }
    const idx = this.getIndex(x, y);
    return this.pixels._view.getUint8((idx + 2));
  };
  getA (x, y) {
    if ( this.inBounds(x, y) == false ) {
      return 0;
    }
    const idx = this.getIndex(x, y);
    return this.pixels._view.getUint8((idx + 3));
  };
  fill (r, g, b, a) {
    const size = this.width * this.height;
    let i = 0;
    while (i < size) {
      const idx = i * 4;
      this.pixels._view.setUint8(idx, r);
      this.pixels._view.setUint8(idx + 1, g);
      this.pixels._view.setUint8(idx + 2, b);
      this.pixels._view.setUint8(idx + 3, a);
      i = i + 1;
    };
  };
  clear () {
    this.fill(0, 0, 0, 0);
  };
  clearWhite () {
    this.fill(255, 255, 255, 255);
  };
  fillRect (x, y, w, h, r, g, b, a) {
    let endX = x + w;
    let endY = y + h;
    if ( x < 0 ) {
      x = 0;
    }
    if ( y < 0 ) {
      y = 0;
    }
    if ( endX > this.width ) {
      endX = this.width;
    }
    if ( endY > this.height ) {
      endY = this.height;
    }
    let py = y;
    while (py < endY) {
      let px = x;
      while (px < endX) {
        this.setPixel(px, py, r, g, b, a);
        px = px + 1;
      };
      py = py + 1;
    };
  };
  copyFrom (src, srcX, srcY, dstX, dstY, w, h) {
    let sy = 0;
    while (sy < h) {
      let sx = 0;
      while (sx < w) {
        const p = src.getPixel((srcX + sx), (srcY + sy));
        this.setPixel(dstX + sx, dstY + sy, p.r, p.g, p.b, p.a);
        sx = sx + 1;
      };
      sy = sy + 1;
    };
  };
  clone () {
    const copy = new RasterBuffer();
    copy.create(this.width, this.height);
    const size = (this.width * this.height) * 4;
    let i = 0;
    while (i < size) {
      copy.pixels._view.setUint8(i, this.pixels._view.getUint8(i));
      i = i + 1;
    };
    return copy;
  };
  getPixelCount () {
    return this.width * this.height;
  };
  getByteSize () {
    return (this.width * this.height) * 4;
  };
  toImageBuffer () {
    const img = new ImageBuffer();
    img.init(this.width, this.height);
    const size = (this.width * this.height) * 4;
    let i = 0;
    while (i < size) {
      let r = this.pixels._view.getUint8(i);
      let g = this.pixels._view.getUint8((i + 1));
      let b = this.pixels._view.getUint8((i + 2));
      const a = this.pixels._view.getUint8((i + 3));
      if ( a < 255 ) {
        const alpha = (a) / 255.0;
        const invAlpha = 1.0 - alpha;
        r = Math.floor( (((r) * alpha) + (255.0 * invAlpha)));
        g = Math.floor( (((g) * alpha) + (255.0 * invAlpha)));
        b = Math.floor( (((b) * alpha) + (255.0 * invAlpha)));
      }
      img.pixels._view.setUint8(i, r);
      img.pixels._view.setUint8(i + 1, g);
      img.pixels._view.setUint8(i + 2, b);
      img.pixels._view.setUint8(i + 3, 255);
      i = i + 4;
    };
    return img;
  };
  fromImageBuffer (img) {
    this.create(img.width, img.height);
    const size = (img.width * img.height) * 4;
    let i = 0;
    while (i < size) {
      this.pixels._view.setUint8(i, img.pixels._view.getUint8(i));
      this.pixels._view.setUint8(i + 1, img.pixels._view.getUint8((i + 1)));
      this.pixels._view.setUint8(i + 2, img.pixels._view.getUint8((i + 2)));
      this.pixels._view.setUint8(i + 3, 255);
      i = i + 4;
    };
  };
  getRawBuffer () {
    return this.pixels;
  };
}
class RasterCompositor  {
  constructor() {
  }
  clamp255 (val) {
    if ( val < 0 ) {
      return 0;
    }
    if ( val > 255 ) {
      return 255;
    }
    return val;
  };
  clamp01 (val) {
    if ( val < 0.0 ) {
      return 0.0;
    }
    if ( val > 1.0 ) {
      return 1.0;
    }
    return val;
  };
  blendSourceOver (buf, x, y, srcR, srcG, srcB, srcA) {
    if ( buf.inBounds(x, y) == false ) {
      return;
    }
    if ( srcA >= 255 ) {
      buf.setPixel(x, y, srcR, srcG, srcB, 255);
      return;
    }
    if ( srcA <= 0 ) {
      return;
    }
    const dst = buf.getPixel(x, y);
    const srcAlpha = (srcA) / 255.0;
    const dstAlpha = (dst.a) / 255.0;
    const outAlpha = srcAlpha + (dstAlpha * (1.0 - srcAlpha));
    if ( outAlpha < 0.001 ) {
      buf.setPixel(x, y, 0, 0, 0, 0);
      return;
    }
    const invSrcAlpha = 1.0 - srcAlpha;
    let outR = ((srcR) * srcAlpha) + (((dst.r) * dstAlpha) * invSrcAlpha);
    let outG = ((srcG) * srcAlpha) + (((dst.g) * dstAlpha) * invSrcAlpha);
    let outB = ((srcB) * srcAlpha) + (((dst.b) * dstAlpha) * invSrcAlpha);
    outR = outR / outAlpha;
    outG = outG / outAlpha;
    outB = outB / outAlpha;
    buf.setPixel(x, y, this.clamp255((Math.floor( outR))), this.clamp255((Math.floor( outG))), this.clamp255((Math.floor( outB))), this.clamp255((Math.floor( (outAlpha * 255.0)))));
  };
  blendPixelOver (buf, x, y, src) {
    this.blendSourceOver(buf, x, y, src.r, src.g, src.b, src.a);
  };
  fillRectBlended (buf, x, y, w, h, r, g, b, a) {
    let endX = x + w;
    let endY = y + h;
    if ( x < 0 ) {
      x = 0;
    }
    if ( y < 0 ) {
      y = 0;
    }
    if ( endX > buf.width ) {
      endX = buf.width;
    }
    if ( endY > buf.height ) {
      endY = buf.height;
    }
    let py = y;
    while (py < endY) {
      let px = x;
      while (px < endX) {
        this.blendSourceOver(buf, px, py, r, g, b, a);
        px = px + 1;
      };
      py = py + 1;
    };
  };
  compositeOver (dst, src, dstX, dstY) {
    let sy = 0;
    while (sy < src.height) {
      let sx = 0;
      while (sx < src.width) {
        const p = src.getPixel(sx, sy);
        this.blendSourceOver(dst, dstX + sx, dstY + sy, p.r, p.g, p.b, p.a);
        sx = sx + 1;
      };
      sy = sy + 1;
    };
  };
  compositeRegionOver (dst, src, srcX, srcY, srcW, srcH, dstX, dstY) {
    let sy = 0;
    while (sy < srcH) {
      let sx = 0;
      while (sx < srcW) {
        const p = src.getPixel((srcX + sx), (srcY + sy));
        this.blendSourceOver(dst, dstX + sx, dstY + sy, p.r, p.g, p.b, p.a);
        sx = sx + 1;
      };
      sy = sy + 1;
    };
  };
  blendMultiply (buf, x, y, srcR, srcG, srcB, srcA) {
    if ( buf.inBounds(x, y) == false ) {
      return;
    }
    const dst = buf.getPixel(x, y);
    let outR = Math.floor( (((srcR * dst.r)) / 255.0));
    let outG = Math.floor( (((srcG * dst.g)) / 255.0));
    let outB = Math.floor( (((srcB * dst.b)) / 255.0));
    const srcAlpha = (srcA) / 255.0;
    const invAlpha = 1.0 - srcAlpha;
    outR = Math.floor( (((outR) * srcAlpha) + ((dst.r) * invAlpha)));
    outG = Math.floor( (((outG) * srcAlpha) + ((dst.g) * invAlpha)));
    outB = Math.floor( (((outB) * srcAlpha) + ((dst.b) * invAlpha)));
    buf.setPixel(x, y, this.clamp255(outR), this.clamp255(outG), this.clamp255(outB), dst.a);
  };
  blendScreen (buf, x, y, srcR, srcG, srcB, srcA) {
    if ( buf.inBounds(x, y) == false ) {
      return;
    }
    const dst = buf.getPixel(x, y);
    const scrR = 255 - srcR;
    const scrG = 255 - srcG;
    const scrB = 255 - srcB;
    const dstInvR = 255 - dst.r;
    const dstInvG = 255 - dst.g;
    const dstInvB = 255 - dst.b;
    let outR = 255 - (Math.floor( (((scrR * dstInvR)) / 255.0)));
    let outG = 255 - (Math.floor( (((scrG * dstInvG)) / 255.0)));
    let outB = 255 - (Math.floor( (((scrB * dstInvB)) / 255.0)));
    const srcAlpha = (srcA) / 255.0;
    const invAlpha = 1.0 - srcAlpha;
    outR = Math.floor( (((outR) * srcAlpha) + ((dst.r) * invAlpha)));
    outG = Math.floor( (((outG) * srcAlpha) + ((dst.g) * invAlpha)));
    outB = Math.floor( (((outB) * srcAlpha) + ((dst.b) * invAlpha)));
    buf.setPixel(x, y, this.clamp255(outR), this.clamp255(outG), this.clamp255(outB), dst.a);
  };
  blendAdditive (buf, x, y, srcR, srcG, srcB, srcA) {
    if ( buf.inBounds(x, y) == false ) {
      return;
    }
    const dst = buf.getPixel(x, y);
    const srcAlpha = (srcA) / 255.0;
    const addR = Math.floor( ((srcR) * srcAlpha));
    const addG = Math.floor( ((srcG) * srcAlpha));
    const addB = Math.floor( ((srcB) * srcAlpha));
    const outR = dst.r + addR;
    const outG = dst.g + addG;
    const outB = dst.b + addB;
    buf.setPixel(x, y, this.clamp255(outR), this.clamp255(outG), this.clamp255(outB), dst.a);
  };
  blendPreMultiplied (buf, x, y, srcR, srcG, srcB, srcA) {
    if ( buf.inBounds(x, y) == false ) {
      return;
    }
    if ( srcA >= 255 ) {
      buf.setPixel(x, y, srcR, srcG, srcB, 255);
      return;
    }
    if ( srcA <= 0 ) {
      return;
    }
    const dst = buf.getPixel(x, y);
    const invAlpha = 255 - srcA;
    const outR = srcR + (Math.floor( (((dst.r * invAlpha)) / 255.0)));
    const outG = srcG + (Math.floor( (((dst.g * invAlpha)) / 255.0)));
    const outB = srcB + (Math.floor( (((dst.b * invAlpha)) / 255.0)));
    const outA = srcA + (Math.floor( (((dst.a * invAlpha)) / 255.0)));
    buf.setPixel(x, y, this.clamp255(outR), this.clamp255(outG), this.clamp255(outB), this.clamp255(outA));
  };
}
class RasterPrimitives  {
  constructor() {
    this.compositor = new RasterCompositor();
  }
  drawLine (buf, x1, y1, x2, y2, r, g, b, a) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    let absDx = dx;
    if ( absDx < 0 ) {
      absDx = 0 - absDx;
    }
    let absDy = dy;
    if ( absDy < 0 ) {
      absDy = 0 - absDy;
    }
    let sx = 1;
    if ( x1 > x2 ) {
      sx = 0 - 1;
    }
    let sy = 1;
    if ( y1 > y2 ) {
      sy = 0 - 1;
    }
    let err = absDx - absDy;
    let x = x1;
    let y = y1;
    let done = false;
    while (done == false) {
      this.compositor.blendSourceOver(buf, x, y, r, g, b, a);
      if ( (x == x2) && (y == y2) ) {
        done = true;
      } else {
        const e2 = err * 2;
        if ( e2 > (0 - absDy) ) {
          err = err - absDy;
          x = x + sx;
        }
        if ( e2 < absDx ) {
          err = err + absDx;
          y = y + sy;
        }
      }
    };
  };
  drawRect (buf, x, y, w, h, r, g, b, a) {
    this.drawLine(buf, x, y, (x + w) - 1, y, r, g, b, a);
    this.drawLine(buf, (x + w) - 1, y, (x + w) - 1, (y + h) - 1, r, g, b, a);
    this.drawLine(buf, (x + w) - 1, (y + h) - 1, x, (y + h) - 1, r, g, b, a);
    this.drawLine(buf, x, (y + h) - 1, x, y, r, g, b, a);
  };
  fillRect (buf, x, y, w, h, r, g, b, a) {
    this.compositor.fillRectBlended(buf, x, y, w, h, r, g, b, a);
  };
  fillRectSolid (buf, x, y, w, h, r, g, b, a) {
    buf.fillRect(x, y, w, h, r, g, b, a);
  };
  fillRoundedRect (buf, x, y, w, h, radius, r, g, b, a) {
    let maxR = Math.floor( ((w) / 2.0));
    const halfH = Math.floor( ((h) / 2.0));
    if ( halfH < maxR ) {
      maxR = halfH;
    }
    if ( radius > maxR ) {
      radius = maxR;
    }
    if ( radius < 0 ) {
      radius = 0;
    }
    if ( radius == 0 ) {
      this.fillRect(buf, x, y, w, h, r, g, b, a);
      return;
    }
    this.fillRect(buf, x, y + radius, w, h - (radius * 2), r, g, b, a);
    this.fillRect(buf, x + radius, y, w - (radius * 2), radius, r, g, b, a);
    this.fillRect(buf, x + radius, (y + h) - radius, w - (radius * 2), radius, r, g, b, a);
    this.fillCircleQuadrant(buf, x + radius, y + radius, radius, 2, r, g, b, a);
    this.fillCircleQuadrant(buf, ((x + w) - radius) - 1, y + radius, radius, 1, r, g, b, a);
    this.fillCircleQuadrant(buf, x + radius, ((y + h) - radius) - 1, radius, 3, r, g, b, a);
    this.fillCircleQuadrant(buf, ((x + w) - radius) - 1, ((y + h) - radius) - 1, radius, 4, r, g, b, a);
  };
  drawRoundedRect (buf, x, y, w, h, radius, r, g, b, a) {
    let maxR = Math.floor( ((w) / 2.0));
    const halfH = Math.floor( ((h) / 2.0));
    if ( halfH < maxR ) {
      maxR = halfH;
    }
    if ( radius > maxR ) {
      radius = maxR;
    }
    if ( radius < 0 ) {
      radius = 0;
    }
    if ( radius == 0 ) {
      this.drawRect(buf, x, y, w, h, r, g, b, a);
      return;
    }
    this.drawLine(buf, x + radius, y, ((x + w) - radius) - 1, y, r, g, b, a);
    this.drawLine(buf, x + radius, (y + h) - 1, ((x + w) - radius) - 1, (y + h) - 1, r, g, b, a);
    this.drawLine(buf, x, y + radius, x, ((y + h) - radius) - 1, r, g, b, a);
    this.drawLine(buf, (x + w) - 1, y + radius, (x + w) - 1, ((y + h) - radius) - 1, r, g, b, a);
    this.drawCircleArcQuadrant(buf, x + radius, y + radius, radius, 2, r, g, b, a);
    this.drawCircleArcQuadrant(buf, ((x + w) - radius) - 1, y + radius, radius, 1, r, g, b, a);
    this.drawCircleArcQuadrant(buf, x + radius, ((y + h) - radius) - 1, radius, 3, r, g, b, a);
    this.drawCircleArcQuadrant(buf, ((x + w) - radius) - 1, ((y + h) - radius) - 1, radius, 4, r, g, b, a);
  };
  fillCircle (buf, cx, cy, radius, r, g, b, a) {
    const r2 = radius * radius;
    let y = 0 - radius;
    while (y <= radius) {
      let x = 0 - radius;
      while (x <= radius) {
        const d2 = (x * x) + (y * y);
        if ( d2 <= r2 ) {
          this.compositor.blendSourceOver(buf, cx + x, cy + y, r, g, b, a);
        }
        x = x + 1;
      };
      y = y + 1;
    };
  };
  drawCircle (buf, cx, cy, radius, r, g, b, a) {
    let x = 0;
    let y = radius;
    let d = 1 - radius;
    this.drawCirclePoints(buf, cx, cy, x, y, r, g, b, a);
    while (x < y) {
      if ( d < 0 ) {
        d = (d + (2 * x)) + 3;
      } else {
        d = (d + (2 * (x - y))) + 5;
        y = y - 1;
      }
      x = x + 1;
      this.drawCirclePoints(buf, cx, cy, x, y, r, g, b, a);
    };
  };
  drawCirclePoints (buf, cx, cy, x, y, r, g, b, a) {
    this.compositor.blendSourceOver(buf, cx + x, cy + y, r, g, b, a);
    this.compositor.blendSourceOver(buf, cx - x, cy + y, r, g, b, a);
    this.compositor.blendSourceOver(buf, cx + x, cy - y, r, g, b, a);
    this.compositor.blendSourceOver(buf, cx - x, cy - y, r, g, b, a);
    this.compositor.blendSourceOver(buf, cx + y, cy + x, r, g, b, a);
    this.compositor.blendSourceOver(buf, cx - y, cy + x, r, g, b, a);
    this.compositor.blendSourceOver(buf, cx + y, cy - x, r, g, b, a);
    this.compositor.blendSourceOver(buf, cx - y, cy - x, r, g, b, a);
  };
  fillCircleQuadrant (buf, cx, cy, radius, quadrant, r, g, b, a) {
    const r2 = radius * radius;
    const startY = 0;
    const endY = radius;
    const startX = 0;
    const endX = radius;
    let dirX = 1;
    let dirY = 1;
    if ( quadrant == 1 ) {
      dirX = 1;
      dirY = -1;
    }
    if ( quadrant == 2 ) {
      dirX = -1;
      dirY = -1;
    }
    if ( quadrant == 3 ) {
      dirX = -1;
      dirY = 1;
    }
    if ( quadrant == 4 ) {
      dirX = 1;
      dirY = 1;
    }
    let dy = 0;
    while (dy <= radius) {
      let dx = 0;
      while (dx <= radius) {
        const d2 = (dx * dx) + (dy * dy);
        if ( d2 <= r2 ) {
          const px = cx + (dx * dirX);
          const py = cy + (dy * dirY);
          this.compositor.blendSourceOver(buf, px, py, r, g, b, a);
        }
        dx = dx + 1;
      };
      dy = dy + 1;
    };
  };
  drawCircleArcQuadrant (buf, cx, cy, radius, quadrant, r, g, b, a) {
    let x = 0;
    let y = radius;
    let d = 1 - radius;
    let dirX = 1;
    let dirY = -1;
    if ( quadrant == 1 ) {
      dirX = 1;
      dirY = -1;
    }
    if ( quadrant == 2 ) {
      dirX = -1;
      dirY = -1;
    }
    if ( quadrant == 3 ) {
      dirX = -1;
      dirY = 1;
    }
    if ( quadrant == 4 ) {
      dirX = 1;
      dirY = 1;
    }
    this.compositor.blendSourceOver(buf, cx + (x * dirX), cy + (y * dirY), r, g, b, a);
    this.compositor.blendSourceOver(buf, cx + (y * dirX), cy + (x * dirY), r, g, b, a);
    while (x < y) {
      if ( d < 0 ) {
        d = (d + (2 * x)) + 3;
      } else {
        d = (d + (2 * (x - y))) + 5;
        y = y - 1;
      }
      x = x + 1;
      this.compositor.blendSourceOver(buf, cx + (x * dirX), cy + (y * dirY), r, g, b, a);
      this.compositor.blendSourceOver(buf, cx + (y * dirX), cy + (x * dirY), r, g, b, a);
    };
  };
  drawLineAA (buf, x0, y0, x1, y1, r, g, b, a) {
    this.drawLine(buf, x0, y0, x1, y1, r, g, b, a);
  };
  fillEllipse (buf, cx, cy, rx, ry, r, g, b, a) {
    const rx2 = (rx) * (rx);
    const ry2 = (ry) * (ry);
    let y = 0 - ry;
    while (y <= ry) {
      const yf = y;
      const xExtent = Math.sqrt((rx2 * (1.0 - ((yf * yf) / ry2))));
      const xi = Math.floor( xExtent);
      let x = 0 - xi;
      while (x <= xi) {
        this.compositor.blendSourceOver(buf, cx + x, cy + y, r, g, b, a);
        x = x + 1;
      };
      y = y + 1;
    };
  };
  drawEllipse (buf, cx, cy, rx, ry, r, g, b, a) {
    let steps = (rx + ry) * 2;
    if ( steps < 20 ) {
      steps = 20;
    }
    const angleStep = 6.28318530718 / (steps);
    let angle = 0.0;
    let lastX = cx + rx;
    let lastY = cy;
    let i = 0;
    while (i <= steps) {
      const newX = cx + (Math.floor( ((rx) * (Math.cos(angle)))));
      const newY = cy + (Math.floor( ((ry) * (Math.sin(angle)))));
      if ( i > 0 ) {
        this.drawLine(buf, lastX, lastY, newX, newY, r, g, b, a);
      }
      lastX = newX;
      lastY = newY;
      angle = angle + angleStep;
      i = i + 1;
    };
  };
}
class GradientStop  {
  constructor() {
    this.position = 0.0;
    this.r = 0;
    this.g = 0;
    this.b = 0;
    this.a = 255;
  }
  init (pos, red, green, blue, alpha) {
    this.position = pos;
    this.r = red;
    this.g = green;
    this.b = blue;
    this.a = alpha;
  };
  initRGB (pos, red, green, blue) {
    this.position = pos;
    this.r = red;
    this.g = green;
    this.b = blue;
    this.a = 255;
  };
}
class RasterGradient  {
  constructor() {
  }
  interpolateColor (stop1, stop2, t) {
    const p = new RasterPixel();
    if ( t < 0.0 ) {
      t = 0.0;
    }
    if ( t > 1.0 ) {
      t = 1.0;
    }
    const invT = 1.0 - t;
    p.r = Math.floor( (((stop1.r) * invT) + ((stop2.r) * t)));
    p.g = Math.floor( (((stop1.g) * invT) + ((stop2.g) * t)));
    p.b = Math.floor( (((stop1.b) * invT) + ((stop2.b) * t)));
    p.a = Math.floor( (((stop1.a) * invT) + ((stop2.a) * t)));
    return p;
  };
  getColorAtPosition (stops, position) {
    const numStops = stops.length;
    if ( numStops == 0 ) {
      const p = new RasterPixel();
      return p;
    }
    if ( numStops == 1 ) {
      const stop = stops[0];
      const p_1 = new RasterPixel();
      p_1.r = stop.r;
      p_1.g = stop.g;
      p_1.b = stop.b;
      p_1.a = stop.a;
      return p_1;
    }
    if ( position <= 0.0 ) {
      const stop_1 = stops[0];
      const p_2 = new RasterPixel();
      p_2.r = stop_1.r;
      p_2.g = stop_1.g;
      p_2.b = stop_1.b;
      p_2.a = stop_1.a;
      return p_2;
    }
    if ( position >= 1.0 ) {
      const stop_2 = stops[(numStops - 1)];
      const p_3 = new RasterPixel();
      p_3.r = stop_2.r;
      p_3.g = stop_2.g;
      p_3.b = stop_2.b;
      p_3.a = stop_2.a;
      return p_3;
    }
    let i = 0;
    while (i < (numStops - 1)) {
      const stop1 = stops[i];
      const stop2 = stops[(i + 1)];
      if ( (position >= stop1.position) && (position <= stop2.position) ) {
        const range = stop2.position - stop1.position;
        if ( range < 0.001 ) {
          const p_4 = new RasterPixel();
          p_4.r = stop1.r;
          p_4.g = stop1.g;
          p_4.b = stop1.b;
          p_4.a = stop1.a;
          return p_4;
        }
        const t = (position - stop1.position) / range;
        return this.interpolateColor(stop1, stop2, t);
      }
      i = i + 1;
    };
    const stop_3 = stops[(numStops - 1)];
    const p_5 = new RasterPixel();
    p_5.r = stop_3.r;
    p_5.g = stop_3.g;
    p_5.b = stop_3.b;
    p_5.a = stop_3.a;
    return p_5;
  };
  renderLinearGradient (buf, x, y, w, h, angleDeg, stops) {
    const angleRad = (angleDeg * 3.14159265359) / 180.0;
    const dirX = Math.cos(angleRad);
    const dirY = Math.sin(angleRad);
    const hw = (w) / 2.0;
    const hh = (h) / 2.0;
    const d1 = (hw * dirX) + (hh * dirY);
    const d2 = (hw * dirX) - (hh * dirY);
    const d3 = ((0.0 - hw) * dirX) + (hh * dirY);
    const d4 = ((0.0 - hw) * dirX) - (hh * dirY);
    let minD = d1;
    if ( d2 < minD ) {
      minD = d2;
    }
    if ( d3 < minD ) {
      minD = d3;
    }
    if ( d4 < minD ) {
      minD = d4;
    }
    let maxD = d1;
    if ( d2 > maxD ) {
      maxD = d2;
    }
    if ( d3 > maxD ) {
      maxD = d3;
    }
    if ( d4 > maxD ) {
      maxD = d4;
    }
    let gradientLength = maxD - minD;
    if ( gradientLength < 1.0 ) {
      gradientLength = 1.0;
    }
    const cx = hw;
    const cy = hh;
    let py = 0;
    while (py < h) {
      let px = 0;
      while (px < w) {
        const relX = (px) - cx;
        const relY = (py) - cy;
        const proj = (relX * dirX) + (relY * dirY);
        const t = (proj - minD) / gradientLength;
        const color = this.getColorAtPosition(stops, t);
        buf.setPixel(x + px, y + py, color.r, color.g, color.b, color.a);
        px = px + 1;
      };
      py = py + 1;
    };
  };
  renderRadialGradient (buf, x, y, w, h, cx, cy, radius, stops) {
    if ( radius < 1.0 ) {
      radius = 1.0;
    }
    let py = 0;
    while (py < h) {
      let px = 0;
      while (px < w) {
        const dx = (px) - cx;
        const dy = (py) - cy;
        const dist = Math.sqrt(((dx * dx) + (dy * dy)));
        let t = dist / radius;
        if ( t > 1.0 ) {
          t = 1.0;
        }
        const color = this.getColorAtPosition(stops, t);
        buf.setPixel(x + px, y + py, color.r, color.g, color.b, color.a);
        px = px + 1;
      };
      py = py + 1;
    };
  };
  renderRadialGradientCentered (buf, x, y, w, h, stops) {
    const cx = (w) / 2.0;
    const cy = (h) / 2.0;
    const radius = Math.sqrt(((cx * cx) + (cy * cy)));
    this.renderRadialGradient(buf, x, y, w, h, cx, cy, radius, stops);
  };
  renderTwoColorLinear (buf, x, y, w, h, angleDeg, r1, g1, b1, r2, g2, b2) {
    let stops = [];
    const stop1 = new GradientStop();
    stop1.initRGB(0.0, r1, g1, b1);
    stops.push(stop1);
    const stop2 = new GradientStop();
    stop2.initRGB(1.0, r2, g2, b2);
    stops.push(stop2);
    this.renderLinearGradient(buf, x, y, w, h, angleDeg, stops);
  };
  renderTwoColorRadial (buf, x, y, w, h, r1, g1, b1, r2, g2, b2) {
    let stops = [];
    const stop1 = new GradientStop();
    stop1.initRGB(0.0, r1, g1, b1);
    stops.push(stop1);
    const stop2 = new GradientStop();
    stop2.initRGB(1.0, r2, g2, b2);
    stops.push(stop2);
    this.renderRadialGradientCentered(buf, x, y, w, h, stops);
  };
  parseColorToStop (colorStr, stop) {
    const firstChar = colorStr.substring(0, 1 );
    if ( firstChar == "#" ) {
      const hex = colorStr.substring(1, (colorStr.length) );
      const hexLen = hex.length;
      if ( hexLen == 6 ) {
        const rHex = hex.substring(0, 2 );
        const gHex = hex.substring(2, 4 );
        const bHex = hex.substring(4, 6 );
        stop.r = this.hexToInt(rHex);
        stop.g = this.hexToInt(gHex);
        stop.b = this.hexToInt(bHex);
        stop.a = 255;
      }
      if ( hexLen == 3 ) {
        const rHex_1 = hex.substring(0, 1 );
        const gHex_1 = hex.substring(1, 2 );
        const bHex_1 = hex.substring(2, 3 );
        stop.r = this.hexToInt((rHex_1 + rHex_1));
        stop.g = this.hexToInt((gHex_1 + gHex_1));
        stop.b = this.hexToInt((bHex_1 + bHex_1));
        stop.a = 255;
      }
      return;
    }
    if ( colorStr.includes("rgba") ) {
      const start = colorStr.indexOf("(");
      const end = colorStr.indexOf(")");
      if ( (start >= 0) && (end > start) ) {
        const inner = colorStr.substring((start + 1), end );
        const parts = inner.split(",");
        if ( (parts.length) >= 4 ) {
          stop.r = this.parseIntSafe(((parts[0]).trim()));
          stop.g = this.parseIntSafe(((parts[1]).trim()));
          stop.b = this.parseIntSafe(((parts[2]).trim()));
          const aStr = (parts[3]).trim();
          const alpha = this.parseDoubleSafe(aStr);
          if ( alpha <= 1.0 ) {
            stop.a = Math.floor( (alpha * 255.0));
          } else {
            stop.a = Math.floor( alpha);
          }
        }
      }
      return;
    }
    if ( colorStr.includes("rgb") ) {
      const start_1 = colorStr.indexOf("(");
      const end_1 = colorStr.indexOf(")");
      if ( (start_1 >= 0) && (end_1 > start_1) ) {
        const inner_1 = colorStr.substring((start_1 + 1), end_1 );
        const parts_1 = inner_1.split(",");
        if ( (parts_1.length) >= 3 ) {
          stop.r = this.parseIntSafe(((parts_1[0]).trim()));
          stop.g = this.parseIntSafe(((parts_1[1]).trim()));
          stop.b = this.parseIntSafe(((parts_1[2]).trim()));
          stop.a = 255;
        }
      }
      return;
    }
    if ( colorStr == "red" ) {
      stop.r = 255;
      stop.g = 0;
      stop.b = 0;
      stop.a = 255;
      return;
    }
    if ( colorStr == "green" ) {
      stop.r = 0;
      stop.g = 128;
      stop.b = 0;
      stop.a = 255;
      return;
    }
    if ( colorStr == "blue" ) {
      stop.r = 0;
      stop.g = 0;
      stop.b = 255;
      stop.a = 255;
      return;
    }
    if ( colorStr == "white" ) {
      stop.r = 255;
      stop.g = 255;
      stop.b = 255;
      stop.a = 255;
      return;
    }
    if ( colorStr == "black" ) {
      stop.r = 0;
      stop.g = 0;
      stop.b = 0;
      stop.a = 255;
      return;
    }
    if ( colorStr == "yellow" ) {
      stop.r = 255;
      stop.g = 255;
      stop.b = 0;
      stop.a = 255;
      return;
    }
    if ( colorStr == "cyan" ) {
      stop.r = 0;
      stop.g = 255;
      stop.b = 255;
      stop.a = 255;
      return;
    }
    if ( colorStr == "magenta" ) {
      stop.r = 255;
      stop.g = 0;
      stop.b = 255;
      stop.a = 255;
      return;
    }
    if ( colorStr == "orange" ) {
      stop.r = 255;
      stop.g = 165;
      stop.b = 0;
      stop.a = 255;
      return;
    }
    if ( colorStr == "purple" ) {
      stop.r = 128;
      stop.g = 0;
      stop.b = 128;
      stop.a = 255;
      return;
    }
    if ( colorStr == "gray" ) {
      stop.r = 128;
      stop.g = 128;
      stop.b = 128;
      stop.a = 255;
      return;
    }
    if ( colorStr == "grey" ) {
      stop.r = 128;
      stop.g = 128;
      stop.b = 128;
      stop.a = 255;
      return;
    }
    if ( colorStr == "transparent" ) {
      stop.r = 0;
      stop.g = 0;
      stop.b = 0;
      stop.a = 0;
      return;
    }
    stop.r = 0;
    stop.g = 0;
    stop.b = 0;
    stop.a = 255;
  };
  hexToInt (hex) {
    let result = 0;
    let i = 0;
    const __len = hex.length;
    while (i < __len) {
      const c = hex.charCodeAt(i );
      let digit = 0;
      if ( (c >= 48) && (c <= 57) ) {
        digit = c - 48;
      }
      if ( (c >= 97) && (c <= 102) ) {
        digit = c - 87;
      }
      if ( (c >= 65) && (c <= 70) ) {
        digit = c - 55;
      }
      result = (result * 16) + digit;
      i = i + 1;
    };
    return result;
  };
  parseIntSafe (s) {
    let result = 0;
    let i = 0;
    const __len = s.length;
    let negative = false;
    if ( __len == 0 ) {
      return 0;
    }
    const first = s.charCodeAt(0 );
    if ( first == 45 ) {
      negative = true;
      i = 1;
    }
    while (i < __len) {
      const c = s.charCodeAt(i );
      if ( (c >= 48) && (c <= 57) ) {
        result = (result * 10) + (c - 48);
      }
      i = i + 1;
    };
    if ( negative ) {
      return 0 - result;
    }
    return result;
  };
  parseDoubleSafe (s) {
    let result = 0.0;
    let decimal = 0.1;
    let inDecimal = false;
    let negative = false;
    let i = 0;
    const __len = s.length;
    if ( __len == 0 ) {
      return 0.0;
    }
    const first = s.charCodeAt(0 );
    if ( first == 45 ) {
      negative = true;
      i = 1;
    }
    while (i < __len) {
      const c = s.charCodeAt(i );
      if ( c == 46 ) {
        inDecimal = true;
      } else {
        if ( (c >= 48) && (c <= 57) ) {
          const digit = (c - 48);
          if ( inDecimal ) {
            result = result + (digit * decimal);
            decimal = decimal * 0.1;
          } else {
            result = (result * 10.0) + digit;
          }
        }
      }
      i = i + 1;
    };
    if ( negative ) {
      return 0.0 - result;
    }
    return result;
  };
}
class RasterBlur  {
  constructor() {
  }
  blurHorizontal (src, radius) {
    const dst = new RasterBuffer();
    dst.create(src.width, src.height);
    if ( radius < 1 ) {
      let i = 0;
      const size = (src.width * src.height) * 4;
      while (i < size) {
        dst.pixels._view.setUint8(i, src.pixels._view.getUint8(i));
        i = i + 1;
      };
      return dst;
    }
    const diameter = (radius * 2) + 1;
    const divisor = diameter;
    let y = 0;
    while (y < src.height) {
      let sumR = 0;
      let sumG = 0;
      let sumB = 0;
      let sumA = 0;
      let i_1 = 0 - radius;
      while (i_1 <= radius) {
        let sampleX = i_1;
        if ( sampleX < 0 ) {
          sampleX = 0;
        }
        if ( sampleX >= src.width ) {
          sampleX = src.width - 1;
        }
        const p = src.getPixel(sampleX, y);
        sumR = sumR + p.r;
        sumG = sumG + p.g;
        sumB = sumB + p.b;
        sumA = sumA + p.a;
        i_1 = i_1 + 1;
      };
      let x = 0;
      while (x < src.width) {
        const outR = Math.floor( ((sumR) / divisor));
        const outG = Math.floor( ((sumG) / divisor));
        const outB = Math.floor( ((sumB) / divisor));
        const outA = Math.floor( ((sumA) / divisor));
        dst.setPixel(x, y, outR, outG, outB, outA);
        let leftX = x - radius;
        let rightX = (x + radius) + 1;
        if ( leftX < 0 ) {
          leftX = 0;
        }
        if ( rightX >= src.width ) {
          rightX = src.width - 1;
        }
        const leftP = src.getPixel(leftX, y);
        sumR = sumR - leftP.r;
        sumG = sumG - leftP.g;
        sumB = sumB - leftP.b;
        sumA = sumA - leftP.a;
        const rightP = src.getPixel(rightX, y);
        sumR = sumR + rightP.r;
        sumG = sumG + rightP.g;
        sumB = sumB + rightP.b;
        sumA = sumA + rightP.a;
        x = x + 1;
      };
      y = y + 1;
    };
    return dst;
  };
  blurVertical (src, radius) {
    const dst = new RasterBuffer();
    dst.create(src.width, src.height);
    if ( radius < 1 ) {
      let i = 0;
      const size = (src.width * src.height) * 4;
      while (i < size) {
        dst.pixels._view.setUint8(i, src.pixels._view.getUint8(i));
        i = i + 1;
      };
      return dst;
    }
    const diameter = (radius * 2) + 1;
    const divisor = diameter;
    let x = 0;
    while (x < src.width) {
      let sumR = 0;
      let sumG = 0;
      let sumB = 0;
      let sumA = 0;
      let i_1 = 0 - radius;
      while (i_1 <= radius) {
        let sampleY = i_1;
        if ( sampleY < 0 ) {
          sampleY = 0;
        }
        if ( sampleY >= src.height ) {
          sampleY = src.height - 1;
        }
        const p = src.getPixel(x, sampleY);
        sumR = sumR + p.r;
        sumG = sumG + p.g;
        sumB = sumB + p.b;
        sumA = sumA + p.a;
        i_1 = i_1 + 1;
      };
      let y = 0;
      while (y < src.height) {
        const outR = Math.floor( ((sumR) / divisor));
        const outG = Math.floor( ((sumG) / divisor));
        const outB = Math.floor( ((sumB) / divisor));
        const outA = Math.floor( ((sumA) / divisor));
        dst.setPixel(x, y, outR, outG, outB, outA);
        let topY = y - radius;
        let bottomY = (y + radius) + 1;
        if ( topY < 0 ) {
          topY = 0;
        }
        if ( bottomY >= src.height ) {
          bottomY = src.height - 1;
        }
        const topP = src.getPixel(x, topY);
        sumR = sumR - topP.r;
        sumG = sumG - topP.g;
        sumB = sumB - topP.b;
        sumA = sumA - topP.a;
        const bottomP = src.getPixel(x, bottomY);
        sumR = sumR + bottomP.r;
        sumG = sumG + bottomP.g;
        sumB = sumB + bottomP.b;
        sumA = sumA + bottomP.a;
        y = y + 1;
      };
      x = x + 1;
    };
    return dst;
  };
  boxBlur (src, radius) {
    const temp = this.blurHorizontal(src, radius);
    return this.blurVertical(temp, radius);
  };
  boxBlurMultiPass (src, radius, passes) {
    let result = src;
    let i = 0;
    while (i < passes) {
      result = this.boxBlur(result, radius);
      i = i + 1;
    };
    return result;
  };
  gaussianApproxBlur (src, radius) {
    let passRadius = Math.floor( ((radius) / 3.0));
    if ( passRadius < 1 ) {
      passRadius = 1;
    }
    return this.boxBlurMultiPass(src, passRadius, 3);
  };
}
class RasterShadow  {
  constructor() {
    this.blur = new RasterBlur();
  }
  createShadow (src, blurRadius, shadowR, shadowG, shadowB, shadowA) {
    const shadowShape = new RasterBuffer();
    shadowShape.create(src.width, src.height);
    let y = 0;
    while (y < src.height) {
      let x = 0;
      while (x < src.width) {
        const srcAlpha = src.getA(x, y);
        if ( srcAlpha > 0 ) {
          const outAlpha = Math.floor( (((srcAlpha * shadowA)) / 255.0));
          shadowShape.setPixel(x, y, shadowR, shadowG, shadowB, outAlpha);
        }
        x = x + 1;
      };
      y = y + 1;
    };
    if ( blurRadius > 0 ) {
      return this.blur.gaussianApproxBlur(shadowShape, blurRadius);
    }
    return shadowShape;
  };
  createDropShadow (src, offsetX, offsetY, blurRadius, shadowR, shadowG, shadowB, shadowA) {
    const spread = blurRadius * 2;
    let absOffsetX = offsetX;
    if ( absOffsetX < 0 ) {
      absOffsetX = 0 - absOffsetX;
    }
    let absOffsetY = offsetY;
    if ( absOffsetY < 0 ) {
      absOffsetY = 0 - absOffsetY;
    }
    const newWidth = (src.width + spread) + absOffsetX;
    const newHeight = (src.height + spread) + absOffsetY;
    let srcX = spread;
    let srcY = spread;
    if ( offsetX < 0 ) {
      srcX = srcX - offsetX;
    }
    if ( offsetY < 0 ) {
      srcY = srcY - offsetY;
    }
    const shadowShape = new RasterBuffer();
    shadowShape.create(newWidth, newHeight);
    const shadowPosX = srcX + offsetX;
    const shadowPosY = srcY + offsetY;
    let y = 0;
    while (y < src.height) {
      let x = 0;
      while (x < src.width) {
        const srcAlpha = src.getA(x, y);
        if ( srcAlpha > 0 ) {
          const outAlpha = Math.floor( (((srcAlpha * shadowA)) / 255.0));
          shadowShape.setPixel(shadowPosX + x, shadowPosY + y, shadowR, shadowG, shadowB, outAlpha);
        }
        x = x + 1;
      };
      y = y + 1;
    };
    if ( blurRadius > 0 ) {
      return this.blur.gaussianApproxBlur(shadowShape, blurRadius);
    }
    return shadowShape;
  };
  renderRectShadow (width, height, blurRadius, shadowR, shadowG, shadowB, shadowA) {
    const rect = new RasterBuffer();
    const spreadW = width + (blurRadius * 4);
    const spreadH = height + (blurRadius * 4);
    rect.create(spreadW, spreadH);
    const offsetX = blurRadius * 2;
    const offsetY = blurRadius * 2;
    rect.fillRect(offsetX, offsetY, width, height, 255, 255, 255, 255);
    return this.createShadow(rect, blurRadius, shadowR, shadowG, shadowB, shadowA);
  };
  renderRoundedRectShadow (width, height, radius, blurRadius, shadowR, shadowG, shadowB, shadowA) {
    const spreadW = width + (blurRadius * 4);
    const spreadH = height + (blurRadius * 4);
    const rect = new RasterBuffer();
    rect.create(spreadW, spreadH);
    const offsetX = blurRadius * 2;
    const offsetY = blurRadius * 2;
    let maxR = Math.floor( ((width) / 2.0));
    const halfH = Math.floor( ((height) / 2.0));
    if ( halfH < maxR ) {
      maxR = halfH;
    }
    if ( radius > maxR ) {
      radius = maxR;
    }
    rect.fillRect(offsetX + radius, offsetY, width - (radius * 2), height, 255, 255, 255, 255);
    rect.fillRect(offsetX, offsetY + radius, width, height - (radius * 2), 255, 255, 255, 255);
    this.fillCornerCircle(rect, offsetX + radius, offsetY + radius, radius);
    this.fillCornerCircle(rect, ((offsetX + width) - radius) - 1, offsetY + radius, radius);
    this.fillCornerCircle(rect, offsetX + radius, ((offsetY + height) - radius) - 1, radius);
    this.fillCornerCircle(rect, ((offsetX + width) - radius) - 1, ((offsetY + height) - radius) - 1, radius);
    return this.createShadow(rect, blurRadius, shadowR, shadowG, shadowB, shadowA);
  };
  fillCornerCircle (buf, cx, cy, radius) {
    const r2 = radius * radius;
    let y = 0 - radius;
    while (y <= radius) {
      let x = 0 - radius;
      while (x <= radius) {
        const d2 = (x * x) + (y * y);
        if ( d2 <= r2 ) {
          buf.setPixel(cx + x, cy + y, 255, 255, 255, 255);
        }
        x = x + 1;
      };
      y = y + 1;
    };
  };
}
class FDCT  {
  constructor() {
    this.cosTable = new Int32Array(64);
    this.zigzagOrder = new Int32Array(64);
    this.cosTable[0] = 1024;
    this.cosTable[1] = 1004;
    this.cosTable[2] = 946;
    this.cosTable[3] = 851;
    this.cosTable[4] = 724;
    this.cosTable[5] = 569;
    this.cosTable[6] = 392;
    this.cosTable[7] = 200;
    this.cosTable[8] = 1024;
    this.cosTable[9] = 851;
    this.cosTable[10] = 392;
    this.cosTable[11] = -200;
    this.cosTable[12] = -724;
    this.cosTable[13] = -1004;
    this.cosTable[14] = -946;
    this.cosTable[15] = -569;
    this.cosTable[16] = 1024;
    this.cosTable[17] = 569;
    this.cosTable[18] = -392;
    this.cosTable[19] = -1004;
    this.cosTable[20] = -724;
    this.cosTable[21] = 200;
    this.cosTable[22] = 946;
    this.cosTable[23] = 851;
    this.cosTable[24] = 1024;
    this.cosTable[25] = 200;
    this.cosTable[26] = -946;
    this.cosTable[27] = -569;
    this.cosTable[28] = 724;
    this.cosTable[29] = 851;
    this.cosTable[30] = -392;
    this.cosTable[31] = -1004;
    this.cosTable[32] = 1024;
    this.cosTable[33] = -200;
    this.cosTable[34] = -946;
    this.cosTable[35] = 569;
    this.cosTable[36] = 724;
    this.cosTable[37] = -851;
    this.cosTable[38] = -392;
    this.cosTable[39] = 1004;
    this.cosTable[40] = 1024;
    this.cosTable[41] = -569;
    this.cosTable[42] = -392;
    this.cosTable[43] = 1004;
    this.cosTable[44] = -724;
    this.cosTable[45] = -200;
    this.cosTable[46] = 946;
    this.cosTable[47] = -851;
    this.cosTable[48] = 1024;
    this.cosTable[49] = -851;
    this.cosTable[50] = 392;
    this.cosTable[51] = 200;
    this.cosTable[52] = -724;
    this.cosTable[53] = 1004;
    this.cosTable[54] = -946;
    this.cosTable[55] = 569;
    this.cosTable[56] = 1024;
    this.cosTable[57] = -1004;
    this.cosTable[58] = 946;
    this.cosTable[59] = -851;
    this.cosTable[60] = 724;
    this.cosTable[61] = -569;
    this.cosTable[62] = 392;
    this.cosTable[63] = -200;
    this.zigzagOrder[0] = 0;
    this.zigzagOrder[1] = 1;
    this.zigzagOrder[2] = 8;
    this.zigzagOrder[3] = 16;
    this.zigzagOrder[4] = 9;
    this.zigzagOrder[5] = 2;
    this.zigzagOrder[6] = 3;
    this.zigzagOrder[7] = 10;
    this.zigzagOrder[8] = 17;
    this.zigzagOrder[9] = 24;
    this.zigzagOrder[10] = 32;
    this.zigzagOrder[11] = 25;
    this.zigzagOrder[12] = 18;
    this.zigzagOrder[13] = 11;
    this.zigzagOrder[14] = 4;
    this.zigzagOrder[15] = 5;
    this.zigzagOrder[16] = 12;
    this.zigzagOrder[17] = 19;
    this.zigzagOrder[18] = 26;
    this.zigzagOrder[19] = 33;
    this.zigzagOrder[20] = 40;
    this.zigzagOrder[21] = 48;
    this.zigzagOrder[22] = 41;
    this.zigzagOrder[23] = 34;
    this.zigzagOrder[24] = 27;
    this.zigzagOrder[25] = 20;
    this.zigzagOrder[26] = 13;
    this.zigzagOrder[27] = 6;
    this.zigzagOrder[28] = 7;
    this.zigzagOrder[29] = 14;
    this.zigzagOrder[30] = 21;
    this.zigzagOrder[31] = 28;
    this.zigzagOrder[32] = 35;
    this.zigzagOrder[33] = 42;
    this.zigzagOrder[34] = 49;
    this.zigzagOrder[35] = 56;
    this.zigzagOrder[36] = 57;
    this.zigzagOrder[37] = 50;
    this.zigzagOrder[38] = 43;
    this.zigzagOrder[39] = 36;
    this.zigzagOrder[40] = 29;
    this.zigzagOrder[41] = 22;
    this.zigzagOrder[42] = 15;
    this.zigzagOrder[43] = 23;
    this.zigzagOrder[44] = 30;
    this.zigzagOrder[45] = 37;
    this.zigzagOrder[46] = 44;
    this.zigzagOrder[47] = 51;
    this.zigzagOrder[48] = 58;
    this.zigzagOrder[49] = 59;
    this.zigzagOrder[50] = 52;
    this.zigzagOrder[51] = 45;
    this.zigzagOrder[52] = 38;
    this.zigzagOrder[53] = 31;
    this.zigzagOrder[54] = 39;
    this.zigzagOrder[55] = 46;
    this.zigzagOrder[56] = 53;
    this.zigzagOrder[57] = 60;
    this.zigzagOrder[58] = 61;
    this.zigzagOrder[59] = 54;
    this.zigzagOrder[60] = 47;
    this.zigzagOrder[61] = 55;
    this.zigzagOrder[62] = 62;
    this.zigzagOrder[63] = 63;
  }
  dct1d (input, startIdx, stride, output, outIdx, outStride) {
    let u = 0;
    while (u < 8) {
      let sum = 0;
      let x = 0;
      while (x < 8) {
        const pixel = input[(startIdx + (x * stride))];
        const cosVal = this.cosTable[((x * 8) + u)];
        sum = sum + (pixel * cosVal);
        x = x + 1;
      };
      if ( u == 0 ) {
        sum = ((sum * 724) >> 10);
      }
      output[outIdx + (u * outStride)] = (sum >> 11);
      u = u + 1;
    };
  };
  transform (pixels) {
    const shifted = new Int32Array(64);
    let i = 0;
    while (i < 64) {
      shifted[i] = (pixels[i]) - 128;
      i = i + 1;
    };
    const temp = new Int32Array(64);
    let row = 0;
    while (row < 8) {
      const rowStart = row * 8;
      this.dct1d(shifted, rowStart, 1, temp, rowStart, 1);
      row = row + 1;
    };
    const coeffs = new Int32Array(64);
    let col = 0;
    while (col < 8) {
      this.dct1d(temp, col, 8, coeffs, col, 8);
      col = col + 1;
    };
    return coeffs;
  };
  zigzag (block) {
    const zigzagOut = new Int32Array(64);
    let i = 0;
    while (i < 64) {
      const pos = this.zigzagOrder[i];
      zigzagOut[i] = block[pos];
      i = i + 1;
    };
    return zigzagOut;
  };
}
class BitWriter  {
  constructor() {
    this.buffer = new GrowableBuffer();
    this.bitBuffer = 0;
    this.bitCount = 0;
  }
  writeBit (bit) {
    this.bitBuffer = (this.bitBuffer << 1);
    this.bitBuffer = (this.bitBuffer | ((bit & 1)));
    this.bitCount = this.bitCount + 1;
    if ( this.bitCount == 8 ) {
      this.flushByte();
    }
  };
  writeBits (value, numBits) {
    let i = numBits - 1;
    while (i >= 0) {
      const bit = (((value >> i)) & 1);
      this.writeBit(bit);
      i = i - 1;
    };
  };
  flushByte () {
    if ( this.bitCount > 0 ) {
      while (this.bitCount < 8) {
        this.bitBuffer = (this.bitBuffer << 1);
        this.bitBuffer = (this.bitBuffer | 1);
        this.bitCount = this.bitCount + 1;
      };
      this.buffer.writeByte(this.bitBuffer);
      if ( this.bitBuffer == 255 ) {
        this.buffer.writeByte(0);
      }
      this.bitBuffer = 0;
      this.bitCount = 0;
    }
  };
  writeByte (b) {
    this.flushByte();
    this.buffer.writeByte(b);
  };
  writeWord (w) {
    this.writeByte((w >> 8));
    this.writeByte((w & 255));
  };
  getBuffer () {
    this.flushByte();
    return this.buffer.toBuffer();
  };
  getLength () {
    return (this.buffer).size();
  };
}
class JPEGEncoder  {
  constructor() {
    this.quality = 75;
    this.yQuantTable = [];
    this.cQuantTable = [];
    this.stdYQuant = [];
    this.stdCQuant = [];
    this.dcYBits = [];
    this.dcYValues = [];
    this.acYBits = [];
    this.acYValues = [];
    this.dcCBits = [];
    this.dcCValues = [];
    this.acCBits = [];
    this.acCValues = [];
    this.dcYCodes = [];
    this.dcYLengths = [];
    this.acYCodes = [];
    this.acYLengths = [];
    this.dcCCodes = [];
    this.dcCLengths = [];
    this.acCCodes = [];
    this.acCLengths = [];
    this.prevDCY = 0;
    this.prevDCCb = 0;
    this.prevDCCr = 0;
    this.fdct = new FDCT();
    this.initQuantTables();
    this.initHuffmanTables();
  }
  initQuantTables () {
    this.stdYQuant.push(16);
    this.stdYQuant.push(11);
    this.stdYQuant.push(10);
    this.stdYQuant.push(16);
    this.stdYQuant.push(24);
    this.stdYQuant.push(40);
    this.stdYQuant.push(51);
    this.stdYQuant.push(61);
    this.stdYQuant.push(12);
    this.stdYQuant.push(12);
    this.stdYQuant.push(14);
    this.stdYQuant.push(19);
    this.stdYQuant.push(26);
    this.stdYQuant.push(58);
    this.stdYQuant.push(60);
    this.stdYQuant.push(55);
    this.stdYQuant.push(14);
    this.stdYQuant.push(13);
    this.stdYQuant.push(16);
    this.stdYQuant.push(24);
    this.stdYQuant.push(40);
    this.stdYQuant.push(57);
    this.stdYQuant.push(69);
    this.stdYQuant.push(56);
    this.stdYQuant.push(14);
    this.stdYQuant.push(17);
    this.stdYQuant.push(22);
    this.stdYQuant.push(29);
    this.stdYQuant.push(51);
    this.stdYQuant.push(87);
    this.stdYQuant.push(80);
    this.stdYQuant.push(62);
    this.stdYQuant.push(18);
    this.stdYQuant.push(22);
    this.stdYQuant.push(37);
    this.stdYQuant.push(56);
    this.stdYQuant.push(68);
    this.stdYQuant.push(109);
    this.stdYQuant.push(103);
    this.stdYQuant.push(77);
    this.stdYQuant.push(24);
    this.stdYQuant.push(35);
    this.stdYQuant.push(55);
    this.stdYQuant.push(64);
    this.stdYQuant.push(81);
    this.stdYQuant.push(104);
    this.stdYQuant.push(113);
    this.stdYQuant.push(92);
    this.stdYQuant.push(49);
    this.stdYQuant.push(64);
    this.stdYQuant.push(78);
    this.stdYQuant.push(87);
    this.stdYQuant.push(103);
    this.stdYQuant.push(121);
    this.stdYQuant.push(120);
    this.stdYQuant.push(101);
    this.stdYQuant.push(72);
    this.stdYQuant.push(92);
    this.stdYQuant.push(95);
    this.stdYQuant.push(98);
    this.stdYQuant.push(112);
    this.stdYQuant.push(100);
    this.stdYQuant.push(103);
    this.stdYQuant.push(99);
    this.stdCQuant.push(17);
    this.stdCQuant.push(18);
    this.stdCQuant.push(24);
    this.stdCQuant.push(47);
    this.stdCQuant.push(99);
    this.stdCQuant.push(99);
    this.stdCQuant.push(99);
    this.stdCQuant.push(99);
    this.stdCQuant.push(18);
    this.stdCQuant.push(21);
    this.stdCQuant.push(26);
    this.stdCQuant.push(66);
    this.stdCQuant.push(99);
    this.stdCQuant.push(99);
    this.stdCQuant.push(99);
    this.stdCQuant.push(99);
    this.stdCQuant.push(24);
    this.stdCQuant.push(26);
    this.stdCQuant.push(56);
    this.stdCQuant.push(99);
    this.stdCQuant.push(99);
    this.stdCQuant.push(99);
    this.stdCQuant.push(99);
    this.stdCQuant.push(99);
    this.stdCQuant.push(47);
    this.stdCQuant.push(66);
    this.stdCQuant.push(99);
    this.stdCQuant.push(99);
    this.stdCQuant.push(99);
    this.stdCQuant.push(99);
    this.stdCQuant.push(99);
    this.stdCQuant.push(99);
    this.stdCQuant.push(99);
    this.stdCQuant.push(99);
    this.stdCQuant.push(99);
    this.stdCQuant.push(99);
    this.stdCQuant.push(99);
    this.stdCQuant.push(99);
    this.stdCQuant.push(99);
    this.stdCQuant.push(99);
    this.stdCQuant.push(99);
    this.stdCQuant.push(99);
    this.stdCQuant.push(99);
    this.stdCQuant.push(99);
    this.stdCQuant.push(99);
    this.stdCQuant.push(99);
    this.stdCQuant.push(99);
    this.stdCQuant.push(99);
    this.stdCQuant.push(99);
    this.stdCQuant.push(99);
    this.stdCQuant.push(99);
    this.stdCQuant.push(99);
    this.stdCQuant.push(99);
    this.stdCQuant.push(99);
    this.stdCQuant.push(99);
    this.stdCQuant.push(99);
    this.stdCQuant.push(99);
    this.stdCQuant.push(99);
    this.stdCQuant.push(99);
    this.stdCQuant.push(99);
    this.stdCQuant.push(99);
    this.stdCQuant.push(99);
    this.stdCQuant.push(99);
    this.stdCQuant.push(99);
    this.scaleQuantTables(this.quality);
  };
  scaleQuantTables (q) {
    let scale = 0;
    if ( q < 50 ) {
      scale = Math.floor( (5000 / q));
    } else {
      scale = 200 - (q * 2);
    }
    this.yQuantTable.length = 0;
    this.cQuantTable.length = 0;
    let i = 0;
    while (i < 64) {
      let yVal = Math.floor( ((((this.stdYQuant[i]) * scale) + 50) / 100));
      if ( yVal < 1 ) {
        yVal = 1;
      }
      if ( yVal > 255 ) {
        yVal = 255;
      }
      this.yQuantTable.push(yVal);
      let cVal = Math.floor( ((((this.stdCQuant[i]) * scale) + 50) / 100));
      if ( cVal < 1 ) {
        cVal = 1;
      }
      if ( cVal > 255 ) {
        cVal = 255;
      }
      this.cQuantTable.push(cVal);
      i = i + 1;
    };
  };
  initHuffmanTables () {
    this.dcYBits.push(0);
    this.dcYBits.push(1);
    this.dcYBits.push(5);
    this.dcYBits.push(1);
    this.dcYBits.push(1);
    this.dcYBits.push(1);
    this.dcYBits.push(1);
    this.dcYBits.push(1);
    this.dcYBits.push(1);
    this.dcYBits.push(0);
    this.dcYBits.push(0);
    this.dcYBits.push(0);
    this.dcYBits.push(0);
    this.dcYBits.push(0);
    this.dcYBits.push(0);
    this.dcYBits.push(0);
    this.dcYValues.push(0);
    this.dcYValues.push(1);
    this.dcYValues.push(2);
    this.dcYValues.push(3);
    this.dcYValues.push(4);
    this.dcYValues.push(5);
    this.dcYValues.push(6);
    this.dcYValues.push(7);
    this.dcYValues.push(8);
    this.dcYValues.push(9);
    this.dcYValues.push(10);
    this.dcYValues.push(11);
    this.acYBits.push(0);
    this.acYBits.push(2);
    this.acYBits.push(1);
    this.acYBits.push(3);
    this.acYBits.push(3);
    this.acYBits.push(2);
    this.acYBits.push(4);
    this.acYBits.push(3);
    this.acYBits.push(5);
    this.acYBits.push(5);
    this.acYBits.push(4);
    this.acYBits.push(4);
    this.acYBits.push(0);
    this.acYBits.push(0);
    this.acYBits.push(1);
    this.acYBits.push(125);
    this.acYValues.push(1);
    this.acYValues.push(2);
    this.acYValues.push(3);
    this.acYValues.push(0);
    this.acYValues.push(4);
    this.acYValues.push(17);
    this.acYValues.push(5);
    this.acYValues.push(18);
    this.acYValues.push(33);
    this.acYValues.push(49);
    this.acYValues.push(65);
    this.acYValues.push(6);
    this.acYValues.push(19);
    this.acYValues.push(81);
    this.acYValues.push(97);
    this.acYValues.push(7);
    this.acYValues.push(34);
    this.acYValues.push(113);
    this.acYValues.push(20);
    this.acYValues.push(50);
    this.acYValues.push(129);
    this.acYValues.push(145);
    this.acYValues.push(161);
    this.acYValues.push(8);
    this.acYValues.push(35);
    this.acYValues.push(66);
    this.acYValues.push(177);
    this.acYValues.push(193);
    this.acYValues.push(21);
    this.acYValues.push(82);
    this.acYValues.push(209);
    this.acYValues.push(240);
    this.acYValues.push(36);
    this.acYValues.push(51);
    this.acYValues.push(98);
    this.acYValues.push(114);
    this.acYValues.push(130);
    this.acYValues.push(9);
    this.acYValues.push(10);
    this.acYValues.push(22);
    this.acYValues.push(23);
    this.acYValues.push(24);
    this.acYValues.push(25);
    this.acYValues.push(26);
    this.acYValues.push(37);
    this.acYValues.push(38);
    this.acYValues.push(39);
    this.acYValues.push(40);
    this.acYValues.push(41);
    this.acYValues.push(42);
    this.acYValues.push(52);
    this.acYValues.push(53);
    this.acYValues.push(54);
    this.acYValues.push(55);
    this.acYValues.push(56);
    this.acYValues.push(57);
    this.acYValues.push(58);
    this.acYValues.push(67);
    this.acYValues.push(68);
    this.acYValues.push(69);
    this.acYValues.push(70);
    this.acYValues.push(71);
    this.acYValues.push(72);
    this.acYValues.push(73);
    this.acYValues.push(74);
    this.acYValues.push(83);
    this.acYValues.push(84);
    this.acYValues.push(85);
    this.acYValues.push(86);
    this.acYValues.push(87);
    this.acYValues.push(88);
    this.acYValues.push(89);
    this.acYValues.push(90);
    this.acYValues.push(99);
    this.acYValues.push(100);
    this.acYValues.push(101);
    this.acYValues.push(102);
    this.acYValues.push(103);
    this.acYValues.push(104);
    this.acYValues.push(105);
    this.acYValues.push(106);
    this.acYValues.push(115);
    this.acYValues.push(116);
    this.acYValues.push(117);
    this.acYValues.push(118);
    this.acYValues.push(119);
    this.acYValues.push(120);
    this.acYValues.push(121);
    this.acYValues.push(122);
    this.acYValues.push(131);
    this.acYValues.push(132);
    this.acYValues.push(133);
    this.acYValues.push(134);
    this.acYValues.push(135);
    this.acYValues.push(136);
    this.acYValues.push(137);
    this.acYValues.push(138);
    this.acYValues.push(146);
    this.acYValues.push(147);
    this.acYValues.push(148);
    this.acYValues.push(149);
    this.acYValues.push(150);
    this.acYValues.push(151);
    this.acYValues.push(152);
    this.acYValues.push(153);
    this.acYValues.push(154);
    this.acYValues.push(162);
    this.acYValues.push(163);
    this.acYValues.push(164);
    this.acYValues.push(165);
    this.acYValues.push(166);
    this.acYValues.push(167);
    this.acYValues.push(168);
    this.acYValues.push(169);
    this.acYValues.push(170);
    this.acYValues.push(178);
    this.acYValues.push(179);
    this.acYValues.push(180);
    this.acYValues.push(181);
    this.acYValues.push(182);
    this.acYValues.push(183);
    this.acYValues.push(184);
    this.acYValues.push(185);
    this.acYValues.push(186);
    this.acYValues.push(194);
    this.acYValues.push(195);
    this.acYValues.push(196);
    this.acYValues.push(197);
    this.acYValues.push(198);
    this.acYValues.push(199);
    this.acYValues.push(200);
    this.acYValues.push(201);
    this.acYValues.push(202);
    this.acYValues.push(210);
    this.acYValues.push(211);
    this.acYValues.push(212);
    this.acYValues.push(213);
    this.acYValues.push(214);
    this.acYValues.push(215);
    this.acYValues.push(216);
    this.acYValues.push(217);
    this.acYValues.push(218);
    this.acYValues.push(225);
    this.acYValues.push(226);
    this.acYValues.push(227);
    this.acYValues.push(228);
    this.acYValues.push(229);
    this.acYValues.push(230);
    this.acYValues.push(231);
    this.acYValues.push(232);
    this.acYValues.push(233);
    this.acYValues.push(234);
    this.acYValues.push(241);
    this.acYValues.push(242);
    this.acYValues.push(243);
    this.acYValues.push(244);
    this.acYValues.push(245);
    this.acYValues.push(246);
    this.acYValues.push(247);
    this.acYValues.push(248);
    this.acYValues.push(249);
    this.acYValues.push(250);
    this.dcCBits.push(0);
    this.dcCBits.push(3);
    this.dcCBits.push(1);
    this.dcCBits.push(1);
    this.dcCBits.push(1);
    this.dcCBits.push(1);
    this.dcCBits.push(1);
    this.dcCBits.push(1);
    this.dcCBits.push(1);
    this.dcCBits.push(1);
    this.dcCBits.push(1);
    this.dcCBits.push(0);
    this.dcCBits.push(0);
    this.dcCBits.push(0);
    this.dcCBits.push(0);
    this.dcCBits.push(0);
    this.dcCValues.push(0);
    this.dcCValues.push(1);
    this.dcCValues.push(2);
    this.dcCValues.push(3);
    this.dcCValues.push(4);
    this.dcCValues.push(5);
    this.dcCValues.push(6);
    this.dcCValues.push(7);
    this.dcCValues.push(8);
    this.dcCValues.push(9);
    this.dcCValues.push(10);
    this.dcCValues.push(11);
    this.acCBits.push(0);
    this.acCBits.push(2);
    this.acCBits.push(1);
    this.acCBits.push(2);
    this.acCBits.push(4);
    this.acCBits.push(4);
    this.acCBits.push(3);
    this.acCBits.push(4);
    this.acCBits.push(7);
    this.acCBits.push(5);
    this.acCBits.push(4);
    this.acCBits.push(4);
    this.acCBits.push(0);
    this.acCBits.push(1);
    this.acCBits.push(2);
    this.acCBits.push(119);
    this.acCValues.push(0);
    this.acCValues.push(1);
    this.acCValues.push(2);
    this.acCValues.push(3);
    this.acCValues.push(17);
    this.acCValues.push(4);
    this.acCValues.push(5);
    this.acCValues.push(33);
    this.acCValues.push(49);
    this.acCValues.push(6);
    this.acCValues.push(18);
    this.acCValues.push(65);
    this.acCValues.push(81);
    this.acCValues.push(7);
    this.acCValues.push(97);
    this.acCValues.push(113);
    this.acCValues.push(19);
    this.acCValues.push(34);
    this.acCValues.push(50);
    this.acCValues.push(129);
    this.acCValues.push(8);
    this.acCValues.push(20);
    this.acCValues.push(66);
    this.acCValues.push(145);
    this.acCValues.push(161);
    this.acCValues.push(177);
    this.acCValues.push(193);
    this.acCValues.push(9);
    this.acCValues.push(35);
    this.acCValues.push(51);
    this.acCValues.push(82);
    this.acCValues.push(240);
    this.acCValues.push(21);
    this.acCValues.push(98);
    this.acCValues.push(114);
    this.acCValues.push(209);
    this.acCValues.push(10);
    this.acCValues.push(22);
    this.acCValues.push(36);
    this.acCValues.push(52);
    this.acCValues.push(225);
    this.acCValues.push(37);
    this.acCValues.push(241);
    this.acCValues.push(23);
    this.acCValues.push(24);
    this.acCValues.push(25);
    this.acCValues.push(26);
    this.acCValues.push(38);
    this.acCValues.push(39);
    this.acCValues.push(40);
    this.acCValues.push(41);
    this.acCValues.push(42);
    this.acCValues.push(53);
    this.acCValues.push(54);
    this.acCValues.push(55);
    this.acCValues.push(56);
    this.acCValues.push(57);
    this.acCValues.push(58);
    this.acCValues.push(67);
    this.acCValues.push(68);
    this.acCValues.push(69);
    this.acCValues.push(70);
    this.acCValues.push(71);
    this.acCValues.push(72);
    this.acCValues.push(73);
    this.acCValues.push(74);
    this.acCValues.push(83);
    this.acCValues.push(84);
    this.acCValues.push(85);
    this.acCValues.push(86);
    this.acCValues.push(87);
    this.acCValues.push(88);
    this.acCValues.push(89);
    this.acCValues.push(90);
    this.acCValues.push(99);
    this.acCValues.push(100);
    this.acCValues.push(101);
    this.acCValues.push(102);
    this.acCValues.push(103);
    this.acCValues.push(104);
    this.acCValues.push(105);
    this.acCValues.push(106);
    this.acCValues.push(115);
    this.acCValues.push(116);
    this.acCValues.push(117);
    this.acCValues.push(118);
    this.acCValues.push(119);
    this.acCValues.push(120);
    this.acCValues.push(121);
    this.acCValues.push(122);
    this.acCValues.push(130);
    this.acCValues.push(131);
    this.acCValues.push(132);
    this.acCValues.push(133);
    this.acCValues.push(134);
    this.acCValues.push(135);
    this.acCValues.push(136);
    this.acCValues.push(137);
    this.acCValues.push(138);
    this.acCValues.push(146);
    this.acCValues.push(147);
    this.acCValues.push(148);
    this.acCValues.push(149);
    this.acCValues.push(150);
    this.acCValues.push(151);
    this.acCValues.push(152);
    this.acCValues.push(153);
    this.acCValues.push(154);
    this.acCValues.push(162);
    this.acCValues.push(163);
    this.acCValues.push(164);
    this.acCValues.push(165);
    this.acCValues.push(166);
    this.acCValues.push(167);
    this.acCValues.push(168);
    this.acCValues.push(169);
    this.acCValues.push(170);
    this.acCValues.push(178);
    this.acCValues.push(179);
    this.acCValues.push(180);
    this.acCValues.push(181);
    this.acCValues.push(182);
    this.acCValues.push(183);
    this.acCValues.push(184);
    this.acCValues.push(185);
    this.acCValues.push(186);
    this.acCValues.push(194);
    this.acCValues.push(195);
    this.acCValues.push(196);
    this.acCValues.push(197);
    this.acCValues.push(198);
    this.acCValues.push(199);
    this.acCValues.push(200);
    this.acCValues.push(201);
    this.acCValues.push(202);
    this.acCValues.push(210);
    this.acCValues.push(211);
    this.acCValues.push(212);
    this.acCValues.push(213);
    this.acCValues.push(214);
    this.acCValues.push(215);
    this.acCValues.push(216);
    this.acCValues.push(217);
    this.acCValues.push(218);
    this.acCValues.push(226);
    this.acCValues.push(227);
    this.acCValues.push(228);
    this.acCValues.push(229);
    this.acCValues.push(230);
    this.acCValues.push(231);
    this.acCValues.push(232);
    this.acCValues.push(233);
    this.acCValues.push(234);
    this.acCValues.push(242);
    this.acCValues.push(243);
    this.acCValues.push(244);
    this.acCValues.push(245);
    this.acCValues.push(246);
    this.acCValues.push(247);
    this.acCValues.push(248);
    this.acCValues.push(249);
    this.acCValues.push(250);
    let i = 0;
    while (i < 256) {
      this.dcYCodes.push(0);
      this.dcYLengths.push(0);
      this.acYCodes.push(0);
      this.acYLengths.push(0);
      this.dcCCodes.push(0);
      this.dcCLengths.push(0);
      this.acCCodes.push(0);
      this.acCLengths.push(0);
      i = i + 1;
    };
    this.buildHuffmanCodes(this.dcYBits, this.dcYValues, this.dcYCodes, this.dcYLengths);
    this.buildHuffmanCodes(this.acYBits, this.acYValues, this.acYCodes, this.acYLengths);
    this.buildHuffmanCodes(this.dcCBits, this.dcCValues, this.dcCCodes, this.dcCLengths);
    this.buildHuffmanCodes(this.acCBits, this.acCValues, this.acCCodes, this.acCLengths);
  };
  buildHuffmanCodes (bits, values, codes, lengths) {
    let code = 0;
    let valueIdx = 0;
    let bitLen = 1;
    while (bitLen <= 16) {
      const count = bits[(bitLen - 1)];
      let j = 0;
      while (j < count) {
        const symbol = values[valueIdx];
        codes[symbol] = code;
        lengths[symbol] = bitLen;
        code = code + 1;
        valueIdx = valueIdx + 1;
        j = j + 1;
      };
      code = (code << 1);
      bitLen = bitLen + 1;
    };
  };
  getCategory (value) {
    if ( value < 0 ) {
      value = 0 - value;
    }
    if ( value == 0 ) {
      return 0;
    }
    let cat = 0;
    while (value > 0) {
      cat = cat + 1;
      value = (value >> 1);
    };
    return cat;
  };
  encodeNumber (value, category) {
    if ( value < 0 ) {
      return value + (((1 << category)) - 1);
    }
    return value;
  };
  encodeBlock (writer, coeffs, quantTable, dcCodes, dcLengths, acCodes, acLengths, prevDC) {
    const quantized = new Int32Array(64);
    let i = 0;
    while (i < 64) {
      const q = quantTable[i];
      const c = coeffs[i];
      let qVal = 0;
      if ( c >= 0 ) {
        qVal = Math.floor( ((c + ((q >> 1))) / q));
      } else {
        qVal = Math.floor( ((c - ((q >> 1))) / q));
      }
      quantized[i] = qVal;
      i = i + 1;
    };
    const zigzagged = this.fdct.zigzag(quantized);
    const dc = zigzagged[0];
    const dcDiff = dc - prevDC;
    const dcCat = this.getCategory(dcDiff);
    const dcCode = dcCodes[dcCat];
    const dcLen = dcLengths[dcCat];
    writer.writeBits(dcCode, dcLen);
    if ( dcCat > 0 ) {
      const dcVal = this.encodeNumber(dcDiff, dcCat);
      writer.writeBits(dcVal, dcCat);
    }
    let zeroRun = 0;
    let k = 1;
    while (k < 64) {
      const ac = zigzagged[k];
      if ( ac == 0 ) {
        zeroRun = zeroRun + 1;
      } else {
        while (zeroRun >= 16) {
          const zrlCode = acCodes[240];
          const zrlLen = acLengths[240];
          writer.writeBits(zrlCode, zrlLen);
          zeroRun = zeroRun - 16;
        };
        const acCat = this.getCategory(ac);
        const runCat = (((zeroRun << 4)) | acCat);
        const acHuffCode = acCodes[runCat];
        const acHuffLen = acLengths[runCat];
        writer.writeBits(acHuffCode, acHuffLen);
        const acVal = this.encodeNumber(ac, acCat);
        writer.writeBits(acVal, acCat);
        zeroRun = 0;
      }
      k = k + 1;
    };
    if ( zeroRun > 0 ) {
      const eobCode = acCodes[0];
      const eobLen = acLengths[0];
      writer.writeBits(eobCode, eobLen);
    }
  };
  rgbToYCbCr (r, g, b, yOut, cbOut, crOut) {
    let y = ((((77 * r) + (150 * g)) + (29 * b)) >> 8);
    let cb = (((((0 - (43 * r)) - (85 * g)) + (128 * b)) >> 8)) + 128;
    let cr = (((((128 * r) - (107 * g)) - (21 * b)) >> 8)) + 128;
    if ( y < 0 ) {
      y = 0;
    }
    if ( y > 255 ) {
      y = 255;
    }
    if ( cb < 0 ) {
      cb = 0;
    }
    if ( cb > 255 ) {
      cb = 255;
    }
    if ( cr < 0 ) {
      cr = 0;
    }
    if ( cr > 255 ) {
      cr = 255;
    }
    yOut.push(y);
    cbOut.push(cb);
    crOut.push(cr);
  };
  extractBlock (img, blockX, blockY, channel) {
    const output = new Int32Array(64);
    let idx = 0;
    let py = 0;
    while (py < 8) {
      let px = 0;
      while (px < 8) {
        let imgX = blockX + px;
        let imgY = blockY + py;
        if ( imgX >= img.width ) {
          imgX = img.width - 1;
        }
        if ( imgY >= img.height ) {
          imgY = img.height - 1;
        }
        const c = img.getPixel(imgX, imgY);
        const y = ((((77 * c.r) + (150 * c.g)) + (29 * c.b)) >> 8);
        const cb = (((((0 - (43 * c.r)) - (85 * c.g)) + (128 * c.b)) >> 8)) + 128;
        const cr = (((((128 * c.r) - (107 * c.g)) - (21 * c.b)) >> 8)) + 128;
        if ( channel == 0 ) {
          output[idx] = y;
        }
        if ( channel == 1 ) {
          output[idx] = cb;
        }
        if ( channel == 2 ) {
          output[idx] = cr;
        }
        idx = idx + 1;
        px = px + 1;
      };
      py = py + 1;
    };
    return output;
  };
  writeMarkers (writer, width, height) {
    writer.writeByte(255);
    writer.writeByte(216);
    writer.writeByte(255);
    writer.writeByte(224);
    writer.writeWord(16);
    writer.writeByte(74);
    writer.writeByte(70);
    writer.writeByte(73);
    writer.writeByte(70);
    writer.writeByte(0);
    writer.writeByte(1);
    writer.writeByte(1);
    writer.writeByte(0);
    writer.writeWord(1);
    writer.writeWord(1);
    writer.writeByte(0);
    writer.writeByte(0);
    writer.writeByte(255);
    writer.writeByte(219);
    writer.writeWord(67);
    writer.writeByte(0);
    let i = 0;
    while (i < 64) {
      writer.writeByte(this.yQuantTable[(this.fdct.zigzagOrder[i])]);
      i = i + 1;
    };
    writer.writeByte(255);
    writer.writeByte(219);
    writer.writeWord(67);
    writer.writeByte(1);
    i = 0;
    while (i < 64) {
      writer.writeByte(this.cQuantTable[(this.fdct.zigzagOrder[i])]);
      i = i + 1;
    };
    writer.writeByte(255);
    writer.writeByte(192);
    writer.writeWord(17);
    writer.writeByte(8);
    writer.writeWord(height);
    writer.writeWord(width);
    writer.writeByte(3);
    writer.writeByte(1);
    writer.writeByte(17);
    writer.writeByte(0);
    writer.writeByte(2);
    writer.writeByte(17);
    writer.writeByte(1);
    writer.writeByte(3);
    writer.writeByte(17);
    writer.writeByte(1);
    writer.writeByte(255);
    writer.writeByte(196);
    writer.writeWord(31);
    writer.writeByte(0);
    i = 0;
    while (i < 16) {
      writer.writeByte(this.dcYBits[i]);
      i = i + 1;
    };
    i = 0;
    while (i < 12) {
      writer.writeByte(this.dcYValues[i]);
      i = i + 1;
    };
    writer.writeByte(255);
    writer.writeByte(196);
    writer.writeWord(181);
    writer.writeByte(16);
    i = 0;
    while (i < 16) {
      writer.writeByte(this.acYBits[i]);
      i = i + 1;
    };
    i = 0;
    while (i < 162) {
      writer.writeByte(this.acYValues[i]);
      i = i + 1;
    };
    writer.writeByte(255);
    writer.writeByte(196);
    writer.writeWord(31);
    writer.writeByte(1);
    i = 0;
    while (i < 16) {
      writer.writeByte(this.dcCBits[i]);
      i = i + 1;
    };
    i = 0;
    while (i < 12) {
      writer.writeByte(this.dcCValues[i]);
      i = i + 1;
    };
    writer.writeByte(255);
    writer.writeByte(196);
    writer.writeWord(181);
    writer.writeByte(17);
    i = 0;
    while (i < 16) {
      writer.writeByte(this.acCBits[i]);
      i = i + 1;
    };
    i = 0;
    while (i < 162) {
      writer.writeByte(this.acCValues[i]);
      i = i + 1;
    };
    writer.writeByte(255);
    writer.writeByte(218);
    writer.writeWord(12);
    writer.writeByte(3);
    writer.writeByte(1);
    writer.writeByte(0);
    writer.writeByte(2);
    writer.writeByte(17);
    writer.writeByte(3);
    writer.writeByte(17);
    writer.writeByte(0);
    writer.writeByte(63);
    writer.writeByte(0);
  };
  encodeToBuffer (img) {
    const writer = new BitWriter();
    this.writeMarkers(writer, img.width, img.height);
    const mcuWidth = Math.floor( ((img.width + 7) / 8));
    const mcuHeight = Math.floor( ((img.height + 7) / 8));
    this.prevDCY = 0;
    this.prevDCCb = 0;
    this.prevDCCr = 0;
    let mcuY = 0;
    while (mcuY < mcuHeight) {
      let mcuX = 0;
      while (mcuX < mcuWidth) {
        const blockX = mcuX * 8;
        const blockY = mcuY * 8;
        const yBlock = this.extractBlock(img, blockX, blockY, 0);
        const yCoeffs = this.fdct.transform(yBlock);
        this.encodeBlock(writer, yCoeffs, this.yQuantTable, this.dcYCodes, this.dcYLengths, this.acYCodes, this.acYLengths, this.prevDCY);
        const yZig = this.fdct.zigzag(yCoeffs);
        const yQ = this.yQuantTable[0];
        const yDC = yZig[0];
        if ( yDC >= 0 ) {
          this.prevDCY = Math.floor( ((yDC + ((yQ >> 1))) / yQ));
        } else {
          this.prevDCY = Math.floor( ((yDC - ((yQ >> 1))) / yQ));
        }
        const cbBlock = this.extractBlock(img, blockX, blockY, 1);
        const cbCoeffs = this.fdct.transform(cbBlock);
        this.encodeBlock(writer, cbCoeffs, this.cQuantTable, this.dcCCodes, this.dcCLengths, this.acCCodes, this.acCLengths, this.prevDCCb);
        const cbZig = this.fdct.zigzag(cbCoeffs);
        const cbQ = this.cQuantTable[0];
        const cbDC = cbZig[0];
        if ( cbDC >= 0 ) {
          this.prevDCCb = Math.floor( ((cbDC + ((cbQ >> 1))) / cbQ));
        } else {
          this.prevDCCb = Math.floor( ((cbDC - ((cbQ >> 1))) / cbQ));
        }
        const crBlock = this.extractBlock(img, blockX, blockY, 2);
        const crCoeffs = this.fdct.transform(crBlock);
        this.encodeBlock(writer, crCoeffs, this.cQuantTable, this.dcCCodes, this.dcCLengths, this.acCCodes, this.acCLengths, this.prevDCCr);
        const crZig = this.fdct.zigzag(crCoeffs);
        const crQ = this.cQuantTable[0];
        const crDC = crZig[0];
        if ( crDC >= 0 ) {
          this.prevDCCr = Math.floor( ((crDC + ((crQ >> 1))) / crQ));
        } else {
          this.prevDCCr = Math.floor( ((crDC - ((crQ >> 1))) / crQ));
        }
        mcuX = mcuX + 1;
      };
      mcuY = mcuY + 1;
    };
    writer.flushByte();
    const outBuf = writer.getBuffer();
    const outLen = writer.getLength();
    const finalBuf = (function(){ var b = new ArrayBuffer((outLen + 2)); b._view = new DataView(b); return b; })();
    let i = 0;
    while (i < outLen) {
      finalBuf._view.setUint8(i, outBuf._view.getUint8(i));
      i = i + 1;
    };
    finalBuf._view.setUint8(outLen, 255);
    finalBuf._view.setUint8(outLen + 1, 217);
    return finalBuf;
  };
  encode (img, dirPath, fileName) {
    console.log("Encoding JPEG: " + fileName);
    console.log((("  Image size: " + ((img.width.toString()))) + "x") + ((img.height.toString())));
    const writer = new BitWriter();
    this.writeMarkers(writer, img.width, img.height);
    const mcuWidth = Math.floor( ((img.width + 7) / 8));
    const mcuHeight = Math.floor( ((img.height + 7) / 8));
    console.log((("  MCU grid: " + ((mcuWidth.toString()))) + "x") + ((mcuHeight.toString())));
    this.prevDCY = 0;
    this.prevDCCb = 0;
    this.prevDCCr = 0;
    let mcuY = 0;
    while (mcuY < mcuHeight) {
      let mcuX = 0;
      while (mcuX < mcuWidth) {
        const blockX = mcuX * 8;
        const blockY = mcuY * 8;
        const yBlock = this.extractBlock(img, blockX, blockY, 0);
        const yCoeffs = this.fdct.transform(yBlock);
        this.encodeBlock(writer, yCoeffs, this.yQuantTable, this.dcYCodes, this.dcYLengths, this.acYCodes, this.acYLengths, this.prevDCY);
        const yZig = this.fdct.zigzag(yCoeffs);
        const yQ = this.yQuantTable[0];
        const yDC = yZig[0];
        if ( yDC >= 0 ) {
          this.prevDCY = Math.floor( ((yDC + ((yQ >> 1))) / yQ));
        } else {
          this.prevDCY = Math.floor( ((yDC - ((yQ >> 1))) / yQ));
        }
        const cbBlock = this.extractBlock(img, blockX, blockY, 1);
        const cbCoeffs = this.fdct.transform(cbBlock);
        this.encodeBlock(writer, cbCoeffs, this.cQuantTable, this.dcCCodes, this.dcCLengths, this.acCCodes, this.acCLengths, this.prevDCCb);
        const cbZig = this.fdct.zigzag(cbCoeffs);
        const cbQ = this.cQuantTable[0];
        const cbDC = cbZig[0];
        if ( cbDC >= 0 ) {
          this.prevDCCb = Math.floor( ((cbDC + ((cbQ >> 1))) / cbQ));
        } else {
          this.prevDCCb = Math.floor( ((cbDC - ((cbQ >> 1))) / cbQ));
        }
        const crBlock = this.extractBlock(img, blockX, blockY, 2);
        const crCoeffs = this.fdct.transform(crBlock);
        this.encodeBlock(writer, crCoeffs, this.cQuantTable, this.dcCCodes, this.dcCLengths, this.acCCodes, this.acCLengths, this.prevDCCr);
        const crZig = this.fdct.zigzag(crCoeffs);
        const crQ = this.cQuantTable[0];
        const crDC = crZig[0];
        if ( crDC >= 0 ) {
          this.prevDCCr = Math.floor( ((crDC + ((crQ >> 1))) / crQ));
        } else {
          this.prevDCCr = Math.floor( ((crDC - ((crQ >> 1))) / crQ));
        }
        mcuX = mcuX + 1;
      };
      mcuY = mcuY + 1;
    };
    writer.flushByte();
    const outBuf = writer.getBuffer();
    const outLen = writer.getLength();
    const finalBuf = (function(){ var b = new ArrayBuffer((outLen + 2)); b._view = new DataView(b); return b; })();
    let i = 0;
    while (i < outLen) {
      finalBuf._view.setUint8(i, outBuf._view.getUint8(i));
      i = i + 1;
    };
    finalBuf._view.setUint8(outLen, 255);
    finalBuf._view.setUint8(outLen + 1, 217);
    require('fs').writeFileSync(dirPath + '/' + fileName, Buffer.from(finalBuf));
    console.log(("  Encoded size: " + (((outLen + 2).toString()))) + " bytes");
    console.log((("  Saved: " + dirPath) + "/") + fileName);
  };
  setQuality (q) {
    this.quality = q;
    this.scaleQuantTables(q);
  };
}
class EVGRasterRenderer  {
  constructor() {
    this.buffer = new RasterBuffer();
    this.compositor = new RasterCompositor();
    this.primitives = new RasterPrimitives();
    this.gradient = new RasterGradient();
    this.shadow = new RasterShadow();
  }
  init (width, height) {
    this.buffer.create(width, height);
  };
  clear (r, g, b, a) {
    this.buffer.fill(r, g, b, a);
  };
  clearWhite () {
    this.buffer.fill(255, 255, 255, 255);
  };
  clearTransparent () {
    this.buffer.fill(0, 0, 0, 0);
  };
  getBuffer () {
    return this.buffer;
  };
  renderRectWithShadow (x, y, w, h, bgR, bgG, bgB, bgA, shadowR, shadowG, shadowB, shadowA, blurRadius, offsetX, offsetY) {
    const shadowBuf = this.shadow.renderRectShadow(w, h, blurRadius, shadowR, shadowG, shadowB, shadowA);
    const spread = blurRadius * 2;
    this.compositor.compositeOver(this.buffer, shadowBuf, (x + offsetX) - spread, (y + offsetY) - spread);
    this.primitives.fillRect(this.buffer, x, y, w, h, bgR, bgG, bgB, bgA);
  };
  renderRoundedRectWithShadow (x, y, w, h, radius, bgR, bgG, bgB, bgA, shadowR, shadowG, shadowB, shadowA, blurRadius, offsetX, offsetY) {
    const shadowBuf = this.shadow.renderRoundedRectShadow(w, h, radius, blurRadius, shadowR, shadowG, shadowB, shadowA);
    const spread = blurRadius * 2;
    this.compositor.compositeOver(this.buffer, shadowBuf, (x + offsetX) - spread, (y + offsetY) - spread);
    this.primitives.fillRoundedRect(this.buffer, x, y, w, h, radius, bgR, bgG, bgB, bgA);
  };
  renderShadowOnly (x, y, w, h, radius, shadowR, shadowG, shadowB, shadowA, blurRadius, offsetX, offsetY) {
    const spread = blurRadius * 2;
    if ( radius > 0 ) {
      const shadowBuf = this.shadow.renderRoundedRectShadow(w, h, radius, blurRadius, shadowR, shadowG, shadowB, shadowA);
      this.compositor.compositeOver(this.buffer, shadowBuf, (x + offsetX) - spread, (y + offsetY) - spread);
    } else {
      const shadowBuf2 = this.shadow.renderRectShadow(w, h, blurRadius, shadowR, shadowG, shadowB, shadowA);
      this.compositor.compositeOver(this.buffer, shadowBuf2, (x + offsetX) - spread, (y + offsetY) - spread);
    }
  };
  fillRect (x, y, w, h, r, g, b, a) {
    this.primitives.fillRect(this.buffer, x, y, w, h, r, g, b, a);
  };
  fillRoundedRect (x, y, w, h, radius, r, g, b, a) {
    this.primitives.fillRoundedRect(this.buffer, x, y, w, h, radius, r, g, b, a);
  };
  fillCircle (cx, cy, radius, r, g, b, a) {
    this.primitives.fillCircle(this.buffer, cx, cy, radius, r, g, b, a);
  };
  drawRect (x, y, w, h, r, g, b, a) {
    this.primitives.drawRect(this.buffer, x, y, w, h, r, g, b, a);
  };
  drawRoundedRect (x, y, w, h, radius, r, g, b, a) {
    this.primitives.drawRoundedRect(this.buffer, x, y, w, h, radius, r, g, b, a);
  };
  renderLinearGradientRect (x, y, w, h, angleDeg, r1, g1, b1, r2, g2, b2) {
    const gradBuf = new RasterBuffer();
    gradBuf.create(w, h);
    this.gradient.renderTwoColorLinear(gradBuf, 0, 0, w, h, angleDeg, r1, g1, b1, r2, g2, b2);
    this.compositor.compositeOver(this.buffer, gradBuf, x, y);
  };
  renderLinearGradientRoundedRect (x, y, w, h, radius, angleDeg, r1, g1, b1, r2, g2, b2) {
    const gradBuf = new RasterBuffer();
    gradBuf.create(w, h);
    this.gradient.renderTwoColorLinear(gradBuf, 0, 0, w, h, angleDeg, r1, g1, b1, r2, g2, b2);
    this.maskRoundedRect(gradBuf, w, h, radius);
    this.compositor.compositeOver(this.buffer, gradBuf, x, y);
  };
  renderRadialGradientRect (x, y, w, h, r1, g1, b1, r2, g2, b2) {
    const gradBuf = new RasterBuffer();
    gradBuf.create(w, h);
    this.gradient.renderTwoColorRadial(gradBuf, 0, 0, w, h, r1, g1, b1, r2, g2, b2);
    this.compositor.compositeOver(this.buffer, gradBuf, x, y);
  };
  renderRadialGradientRoundedRect (x, y, w, h, radius, r1, g1, b1, r2, g2, b2) {
    const gradBuf = new RasterBuffer();
    gradBuf.create(w, h);
    this.gradient.renderTwoColorRadial(gradBuf, 0, 0, w, h, r1, g1, b1, r2, g2, b2);
    this.maskRoundedRect(gradBuf, w, h, radius);
    this.compositor.compositeOver(this.buffer, gradBuf, x, y);
  };
  renderLinearGradientWithShadow (x, y, w, h, radius, angleDeg, r1, g1, b1, r2, g2, b2, shadowR, shadowG, shadowB, shadowA, blurRadius, offsetX, offsetY) {
    this.renderShadowOnly(x, y, w, h, radius, shadowR, shadowG, shadowB, shadowA, blurRadius, offsetX, offsetY);
    if ( radius > 0 ) {
      this.renderLinearGradientRoundedRect(x, y, w, h, radius, angleDeg, r1, g1, b1, r2, g2, b2);
    } else {
      this.renderLinearGradientRect(x, y, w, h, angleDeg, r1, g1, b1, r2, g2, b2);
    }
  };
  maskRoundedRect (buf, w, h, radius) {
    const mask = new RasterBuffer();
    mask.create(w, h);
    this.primitives.fillRoundedRect(mask, 0, 0, w, h, radius, 255, 255, 255, 255);
    let y = 0;
    while (y < h) {
      let x = 0;
      while (x < w) {
        const maskA = mask.getA(x, y);
        if ( maskA < 255 ) {
          const p = buf.getPixel(x, y);
          const newA = Math.floor( (((p.a * maskA)) / 255.0));
          buf.setPixel(x, y, p.r, p.g, p.b, newA);
        }
        x = x + 1;
      };
      y = y + 1;
    };
  };
  toImageBuffer () {
    return this.buffer.toImageBuffer();
  };
  toJPEG (quality) {
    const img = this.buffer.toImageBuffer();
    const encoder = new JPEGEncoder();
    encoder.setQuality(quality);
    return encoder.encodeToBuffer(img);
  };
  saveAsJPEG (dirPath, fileName, quality) {
    const img = this.buffer.toImageBuffer();
    const encoder = new JPEGEncoder();
    encoder.setQuality(quality);
    encoder.encode(img, dirPath, fileName);
  };
  getRawBuffer () {
    return this.buffer.getRawBuffer();
  };
  getWidth () {
    return this.buffer.width;
  };
  getHeight () {
    return this.buffer.height;
  };
  savePPM (dirPath, fileName) {
    const w = this.buffer.width;
    const h = this.buffer.height;
    const buf = new GrowableBuffer();
    buf.writeString("P6\n");
    buf.writeString(((((w.toString())) + " ") + ((h.toString()))) + "\n");
    buf.writeString("255\n");
    let y = 0;
    while (y < h) {
      let x = 0;
      while (x < w) {
        const p = this.buffer.getPixel(x, y);
        buf.writeByte(p.r);
        buf.writeByte(p.g);
        buf.writeByte(p.b);
        x = x + 1;
      };
      y = y + 1;
    };
    const data = buf.toBuffer();
    require('fs').writeFileSync(dirPath + '/' + fileName, Buffer.from(data));
    console.log((("Saved PPM: " + dirPath) + "/") + fileName);
  };
}
class TTFTableRecord  {
  constructor() {
    this.tag = "";
    this.checksum = 0;
    this.offset = 0;
    this.length = 0;
  }
}
class TTFGlyphMetrics  {
  constructor() {
    this.advanceWidth = 0;     /** note: unused */
    this.leftSideBearing = 0;     /** note: unused */
  }
}
class TrueTypeFont  {
  constructor() {
    this.fontData = (function(){ var b = new ArrayBuffer(0); b._view = new DataView(b); return b; })();
    this.fontPath = "";
    this.fontFamily = "";
    this.fontStyle = "Regular";
    this.sfntVersion = 0;
    this.numTables = 0;
    this.searchRange = 0;
    this.entrySelector = 0;
    this.rangeShift = 0;
    this.tables = [];
    this.unitsPerEm = 1000;
    this.xMin = 0;
    this.yMin = 0;
    this.xMax = 0;
    this.yMax = 0;
    this.indexToLocFormat = 0;
    this.ascender = 0;
    this.descender = 0;
    this.lineGap = 0;
    this.numberOfHMetrics = 0;
    this.numGlyphs = 0;
    this.cmapFormat = 0;
    this.cmapOffset = 0;
    this.glyphWidths = [];
    this.defaultWidth = 500;
    this.charWidths = [];
    this.charWidthsLoaded = false;
    let t = [];
    this.tables = t;
    let gw = [];
    this.glyphWidths = gw;
    let cw = [];
    this.charWidths = cw;
  }
  loadFromFile (path) {
    this.fontPath = path;
    let lastSlash = -1;
    let i = 0;
    while (i < (path.length)) {
      const ch = path.charCodeAt(i );
      if ( (ch == 47) || (ch == 92) ) {
        lastSlash = i;
      }
      i = i + 1;
    };
    let dirPath = ".";
    let fileName = path;
    if ( lastSlash >= 0 ) {
      dirPath = path.substring(0, lastSlash );
      fileName = path.substring((lastSlash + 1), (path.length) );
    }
    if ( (require("fs").existsSync(dirPath + "/" + fileName )) == false ) {
      return false;
    }
    this.fontData = (function(){ var b = require('fs').readFileSync(dirPath + '/' + fileName); var ab = new ArrayBuffer(b.length); var v = new Uint8Array(ab); for(var i=0;i<b.length;i++)v[i]=b[i]; ab._view = new DataView(ab); return ab; })();
    if ( (this.fontData.byteLength) == 0 ) {
      console.log("TrueTypeFont: Failed to load " + path);
      return false;
    }
    if ( this.parseOffsetTable() == false ) {
      return false;
    }
    if ( this.parseTableDirectory() == false ) {
      return false;
    }
    this.parseHeadTable();
    this.parseHheaTable();
    this.parseMaxpTable();
    this.parseCmapTable();
    this.parseHmtxTable();
    this.parseNameTable();
    this.buildCharWidthCache();
    return true;
  };
  parseOffsetTable () {
    if ( (this.fontData.byteLength) < 12 ) {
      return false;
    }
    this.sfntVersion = this.readUInt32(0);
    this.numTables = this.readUInt16(4);
    this.searchRange = this.readUInt16(6);
    this.entrySelector = this.readUInt16(8);
    this.rangeShift = this.readUInt16(10);
    return true;
  };
  parseTableDirectory () {
    let offset = 12;
    let i = 0;
    while (i < this.numTables) {
      const record = new TTFTableRecord();
      record.tag = this.readTag(offset);
      record.checksum = this.readUInt32((offset + 4));
      record.offset = this.readUInt32((offset + 8));
      record.length = this.readUInt32((offset + 12));
      this.tables.push(record);
      offset = offset + 16;
      i = i + 1;
    };
    return true;
  };
  findTable (tag) {
    let i = 0;
    while (i < (this.tables.length)) {
      const t = this.tables[i];
      if ( t.tag == tag ) {
        return t;
      }
      i = i + 1;
    };
    const empty = new TTFTableRecord();
    return empty;
  };
  parseHeadTable () {
    const table = this.findTable("head");
    if ( table.offset == 0 ) {
      return;
    }
    const off = table.offset;
    this.unitsPerEm = this.readUInt16((off + 18));
    this.xMin = this.readInt16((off + 36));
    this.yMin = this.readInt16((off + 38));
    this.xMax = this.readInt16((off + 40));
    this.yMax = this.readInt16((off + 42));
    this.indexToLocFormat = this.readInt16((off + 50));
  };
  parseHheaTable () {
    const table = this.findTable("hhea");
    if ( table.offset == 0 ) {
      return;
    }
    const off = table.offset;
    this.ascender = this.readInt16((off + 4));
    this.descender = this.readInt16((off + 6));
    this.lineGap = this.readInt16((off + 8));
    this.numberOfHMetrics = this.readUInt16((off + 34));
  };
  parseMaxpTable () {
    const table = this.findTable("maxp");
    if ( table.offset == 0 ) {
      return;
    }
    const off = table.offset;
    this.numGlyphs = this.readUInt16((off + 4));
  };
  parseCmapTable () {
    const table = this.findTable("cmap");
    if ( table.offset == 0 ) {
      return;
    }
    const off = table.offset;
    const numSubtables = this.readUInt16((off + 2));
    let i = 0;
    let subtableOffset = 0;
    while (i < numSubtables) {
      const recordOff = (off + 4) + (i * 8);
      const platformID = this.readUInt16(recordOff);
      const encodingID = this.readUInt16((recordOff + 2));
      const subOff = this.readUInt32((recordOff + 4));
      if ( (platformID == 3) && (encodingID == 1) ) {
        subtableOffset = subOff;
      }
      if ( (platformID == 0) && (subtableOffset == 0) ) {
        subtableOffset = subOff;
      }
      i = i + 1;
    };
    if ( subtableOffset > 0 ) {
      this.cmapOffset = off + subtableOffset;
      this.cmapFormat = this.readUInt16(this.cmapOffset);
    }
  };
  parseHmtxTable () {
    const table = this.findTable("hmtx");
    if ( table.offset == 0 ) {
      return;
    }
    const off = table.offset;
    let i = 0;
    while (i < this.numberOfHMetrics) {
      const advanceWidth = this.readUInt16((off + (i * 4)));
      this.glyphWidths.push(advanceWidth);
      i = i + 1;
    };
    if ( this.numberOfHMetrics > 0 ) {
      this.defaultWidth = this.glyphWidths[(this.numberOfHMetrics - 1)];
    }
  };
  parseNameTable () {
    const table = this.findTable("name");
    if ( table.offset == 0 ) {
      return;
    }
    const off = table.offset;
    const count = this.readUInt16((off + 2));
    const stringOffset = this.readUInt16((off + 4));
    let i = 0;
    while (i < count) {
      const recordOff = (off + 6) + (i * 12);
      const platformID = this.readUInt16(recordOff);
      const encodingID = this.readUInt16((recordOff + 2));
      const languageID = this.readUInt16((recordOff + 4));
      const nameID = this.readUInt16((recordOff + 6));
      const length = this.readUInt16((recordOff + 8));
      const strOffset = this.readUInt16((recordOff + 10));
      if ( (nameID == 1) && (platformID == 3) ) {
        const strOff = (off + stringOffset) + strOffset;
        this.fontFamily = this.readUnicodeString(strOff, length);
      }
      if ( ((nameID == 1) && (platformID == 1)) && ((this.fontFamily.length) == 0) ) {
        const strOff_1 = (off + stringOffset) + strOffset;
        this.fontFamily = this.readAsciiString(strOff_1, length);
      }
      if ( (nameID == 2) && (platformID == 3) ) {
        const strOff_2 = (off + stringOffset) + strOffset;
        this.fontStyle = this.readUnicodeString(strOff_2, length);
      }
      if ( ((nameID == 2) && (platformID == 1)) && ((this.fontStyle.length) == 0) ) {
        const strOff_3 = (off + stringOffset) + strOffset;
        this.fontStyle = this.readAsciiString(strOff_3, length);
      }
      i = i + 1;
    };
  };
  getGlyphIndex (charCode) {
    if ( this.cmapOffset == 0 ) {
      return 0;
    }
    if ( this.cmapFormat == 4 ) {
      return this.getGlyphIndexFormat4(charCode);
    }
    if ( this.cmapFormat == 0 ) {
      if ( charCode < 256 ) {
        return this.readUInt8(((this.cmapOffset + 6) + charCode));
      }
    }
    if ( this.cmapFormat == 6 ) {
      const firstCode = this.readUInt16((this.cmapOffset + 6));
      const entryCount = this.readUInt16((this.cmapOffset + 8));
      if ( (charCode >= firstCode) && (charCode < (firstCode + entryCount)) ) {
        return this.readUInt16(((this.cmapOffset + 10) + ((charCode - firstCode) * 2)));
      }
    }
    return 0;
  };
  getGlyphIndexFormat4 (charCode) {
    const off = this.cmapOffset;
    const segCountX2 = this.readUInt16((off + 6));
    const segCountD = (segCountX2) / 2.0;
    const segCount = Math.floor( segCountD);
    const endCodesOff = off + 14;
    const startCodesOff = (endCodesOff + segCountX2) + 2;
    const idDeltaOff = startCodesOff + segCountX2;
    const idRangeOffsetOff = idDeltaOff + segCountX2;
    let i = 0;
    while (i < segCount) {
      const endCode = this.readUInt16((endCodesOff + (i * 2)));
      const startCode = this.readUInt16((startCodesOff + (i * 2)));
      if ( (charCode >= startCode) && (charCode <= endCode) ) {
        const idDelta = this.readInt16((idDeltaOff + (i * 2)));
        const idRangeOffset = this.readUInt16((idRangeOffsetOff + (i * 2)));
        if ( idRangeOffset == 0 ) {
          return (charCode + idDelta) % 65536;
        } else {
          const glyphIdOff = ((idRangeOffsetOff + (i * 2)) + idRangeOffset) + ((charCode - startCode) * 2);
          const glyphId = this.readUInt16(glyphIdOff);
          if ( glyphId != 0 ) {
            return (glyphId + idDelta) % 65536;
          }
        }
      }
      i = i + 1;
    };
    return 0;
  };
  getGlyphWidth (glyphIndex) {
    if ( glyphIndex < (this.glyphWidths.length) ) {
      return this.glyphWidths[glyphIndex];
    }
    return this.defaultWidth;
  };
  buildCharWidthCache () {
    let i = 0;
    while (i < 256) {
      const glyphIdx = this.getGlyphIndex(i);
      const width = this.getGlyphWidth(glyphIdx);
      this.charWidths.push(width);
      i = i + 1;
    };
    this.charWidthsLoaded = true;
  };
  getCharWidth (charCode) {
    if ( this.charWidthsLoaded && (charCode < 256) ) {
      return this.charWidths[charCode];
    }
    const glyphIdx = this.getGlyphIndex(charCode);
    return this.getGlyphWidth(glyphIdx);
  };
  getCharWidthPoints (charCode, fontSize) {
    const fontUnits = this.getCharWidth(charCode);
    return ((fontUnits) * fontSize) / (this.unitsPerEm);
  };
  measureText (text, fontSize) {
    let width = 0.0;
    const __len = text.length;
    let i = 0;
    while (i < __len) {
      const ch = text.charCodeAt(i );
      width = width + this.getCharWidthPoints(ch, fontSize);
      i = i + 1;
    };
    return width;
  };
  getAscender (fontSize) {
    return ((this.ascender) * fontSize) / (this.unitsPerEm);
  };
  getDescender (fontSize) {
    return ((this.descender) * fontSize) / (this.unitsPerEm);
  };
  getLineHeight (fontSize) {
    const asc = this.getAscender(fontSize);
    const desc = this.getDescender(fontSize);
    const gap = ((this.lineGap) * fontSize) / (this.unitsPerEm);
    return (asc - desc) + gap;
  };
  getFontData () {
    return this.fontData;
  };
  getPostScriptName () {
    const name = this.fontFamily;
    let result = "";
    let i = 0;
    while (i < (name.length)) {
      const ch = name.charCodeAt(i );
      if ( ch != 32 ) {
        result = result + (String.fromCharCode(ch));
      }
      i = i + 1;
    };
    if ( (result.length) == 0 ) {
      return "CustomFont";
    }
    return result;
  };
  readUInt8 (offset) {
    return this.fontData._view.getUint8(offset);
  };
  readUInt16 (offset) {
    const b1 = this.fontData._view.getUint8(offset);
    const b2 = this.fontData._view.getUint8((offset + 1));
    return (b1 * 256) + b2;
  };
  readInt16 (offset) {
    const val = this.readUInt16(offset);
    if ( val >= 32768 ) {
      return val - 65536;
    }
    return val;
  };
  readUInt32 (offset) {
    const b1 = this.fontData._view.getUint8(offset);
    const b2 = this.fontData._view.getUint8((offset + 1));
    const b3 = this.fontData._view.getUint8((offset + 2));
    const b4 = this.fontData._view.getUint8((offset + 3));
    const result = (((((b1 * 256) + b2) * 256) + b3) * 256) + b4;
    return result;
  };
  readTag (offset) {
    let result = "";
    let i = 0;
    while (i < 4) {
      const ch = this.fontData._view.getUint8((offset + i));
      result = result + (String.fromCharCode(ch));
      i = i + 1;
    };
    return result;
  };
  readAsciiString (offset, length) {
    let result = "";
    let i = 0;
    while (i < length) {
      const ch = this.fontData._view.getUint8((offset + i));
      if ( ch > 0 ) {
        result = result + (String.fromCharCode(ch));
      }
      i = i + 1;
    };
    return result;
  };
  readUnicodeString (offset, length) {
    let result = "";
    let i = 0;
    while (i < length) {
      const ch = this.readUInt16((offset + i));
      if ( (ch > 0) && (ch < 128) ) {
        result = result + (String.fromCharCode(ch));
      }
      i = i + 2;
    };
    return result;
  };
  printInfo () {
    console.log((("Font: " + this.fontFamily) + " ") + this.fontStyle);
    console.log("  Units per EM: " + ((this.unitsPerEm.toString())));
    console.log("  Ascender: " + ((this.ascender.toString())));
    console.log("  Descender: " + ((this.descender.toString())));
    console.log("  Line gap: " + ((this.lineGap.toString())));
    console.log("  Num glyphs: " + ((this.numGlyphs.toString())));
    console.log("  Num hMetrics: " + ((this.numberOfHMetrics.toString())));
    console.log("  Tables: " + (((this.tables.length).toString())));
  };
}
class EVGTextMetrics  {
  constructor() {
    this.width = 0.0;
    this.height = 0.0;
    this.ascent = 0.0;
    this.descent = 0.0;
    this.lineHeight = 0.0;
    this.width = 0.0;
    this.height = 0.0;
    this.ascent = 0.0;
    this.descent = 0.0;
    this.lineHeight = 0.0;
  }
}
EVGTextMetrics.create = function(w, h) {
  const m = new EVGTextMetrics();
  m.width = w;
  m.height = h;
  return m;
};
class EVGTextMeasurer  {
  constructor() {
  }
  measureText (text, fontFamily, fontSize) {
    const avgCharWidth = fontSize * 0.55;
    const textLen = text.length;
    const width = (textLen) * avgCharWidth;
    const lineHeight = fontSize * 1.2;
    const metrics = new EVGTextMetrics();
    metrics.width = width;
    metrics.height = lineHeight;
    metrics.ascent = fontSize * 0.8;
    metrics.descent = fontSize * 0.2;
    metrics.lineHeight = lineHeight;
    return metrics;
  };
  measureTextWidth (text, fontFamily, fontSize) {
    const metrics = this.measureText(text, fontFamily, fontSize);
    return metrics.width;
  };
  getLineHeight (fontFamily, fontSize) {
    return fontSize * 1.2;
  };
  measureChar (ch, fontFamily, fontSize) {
    if ( ch == 32 ) {
      return fontSize * 0.3;
    }
    if ( ((((ch == 105) || (ch == 108)) || (ch == 106)) || (ch == 116)) || (ch == 102) ) {
      return fontSize * 0.3;
    }
    if ( (ch == 109) || (ch == 119) ) {
      return fontSize * 0.8;
    }
    if ( (ch == 77) || (ch == 87) ) {
      return fontSize * 0.9;
    }
    if ( ch == 73 ) {
      return fontSize * 0.35;
    }
    return fontSize * 0.55;
  };
  wrapText (text, fontFamily, fontSize, maxWidth) {
    let lines = [];
    let currentLine = "";
    let currentWidth = 0.0;
    let wordStart = 0;
    const textLen = text.length;
    let i = 0;
    while (i <= textLen) {
      let ch = 0;
      const isEnd = i == textLen;
      if ( isEnd == false ) {
        ch = text.charCodeAt(i );
      }
      let isWordEnd = false;
      if ( isEnd ) {
        isWordEnd = true;
      }
      if ( ch == 32 ) {
        isWordEnd = true;
      }
      if ( ch == 10 ) {
        isWordEnd = true;
      }
      if ( isWordEnd ) {
        let word = "";
        if ( i > wordStart ) {
          word = text.substring(wordStart, i );
        }
        const wordWidth = this.measureTextWidth(word, fontFamily, fontSize);
        let spaceWidth = 0.0;
        if ( (currentLine.length) > 0 ) {
          spaceWidth = this.measureTextWidth(" ", fontFamily, fontSize);
        }
        if ( ((currentWidth + spaceWidth) + wordWidth) <= maxWidth ) {
          if ( (currentLine.length) > 0 ) {
            currentLine = currentLine + " ";
            currentWidth = currentWidth + spaceWidth;
          }
          currentLine = currentLine + word;
          currentWidth = currentWidth + wordWidth;
        } else {
          if ( (currentLine.length) > 0 ) {
            lines.push(currentLine);
          }
          currentLine = word;
          currentWidth = wordWidth;
        }
        if ( ch == 10 ) {
          lines.push(currentLine);
          currentLine = "";
          currentWidth = 0.0;
        }
        wordStart = i + 1;
      }
      i = i + 1;
    };
    if ( (currentLine.length) > 0 ) {
      lines.push(currentLine);
    }
    return lines;
  };
}
class SimpleTextMeasurer  extends EVGTextMeasurer {
  constructor() {
    super()
    this.charWidthRatio = 0.55;
  }
  setCharWidthRatio (ratio) {
    this.charWidthRatio = ratio;
  };
  measureText (text, fontFamily, fontSize) {
    const textLen = text.length;
    let width = 0.0;
    let i = 0;
    while (i < textLen) {
      const ch = text.charCodeAt(i );
      width = width + this.measureChar(ch, fontFamily, fontSize);
      i = i + 1;
    };
    const lineHeight = fontSize * 1.2;
    const metrics = new EVGTextMetrics();
    metrics.width = width;
    metrics.height = lineHeight;
    metrics.ascent = fontSize * 0.8;
    metrics.descent = fontSize * 0.2;
    metrics.lineHeight = lineHeight;
    return metrics;
  };
}
class FontManager  {
  constructor() {
    this.fonts = [];
    this.fontNames = [];
    this.fontsDirectory = "./Fonts";
    this.fontsDirectories = [];
    this.defaultFont = new TrueTypeFont();
    this.hasDefaultFont = false;
    let f = [];
    this.fonts = f;
    let n = [];
    this.fontNames = n;
    let fd = [];
    this.fontsDirectories = fd;
  }
  setFontsDirectory (path) {
    this.fontsDirectory = path;
  };
  getFontCount () {
    return this.fonts.length;
  };
  addFontsDirectory (path) {
    this.fontsDirectories.push(path);
  };
  setFontsDirectories (paths) {
    let start = 0;
    let i = 0;
    const __len = paths.length;
    while (i <= __len) {
      let ch = "";
      if ( i < __len ) {
        ch = paths.substring(i, (i + 1) );
      }
      if ( (ch == ";") || (i == __len) ) {
        if ( i > start ) {
          const part = paths.substring(start, i );
          this.fontsDirectories.push(part);
          console.log("FontManager: Added fonts directory: " + part);
        }
        start = i + 1;
      }
      i = i + 1;
    };
    if ( (this.fontsDirectories.length) > 0 ) {
      this.fontsDirectory = this.fontsDirectories[0];
    }
  };
  loadFont (relativePath) {
    let i = 0;
    while (i < (this.fontsDirectories.length)) {
      const dir = this.fontsDirectories[i];
      const fullPath = (dir + "/") + relativePath;
      const font = new TrueTypeFont();
      if ( font.loadFromFile(fullPath) == true ) {
        this.fonts.push(font);
        this.fontNames.push(font.fontFamily);
        if ( this.hasDefaultFont == false ) {
          this.defaultFont = font;
          this.hasDefaultFont = true;
        }
        console.log((((("FontManager: Loaded font '" + font.fontFamily) + "' (") + font.fontStyle) + ") from ") + fullPath);
        return true;
      }
      i = i + 1;
    };
    const fullPath_1 = (this.fontsDirectory + "/") + relativePath;
    const font_1 = new TrueTypeFont();
    if ( font_1.loadFromFile(fullPath_1) == false ) {
      console.log("FontManager: Failed to load font: " + relativePath);
      return false;
    }
    this.fonts.push(font_1);
    this.fontNames.push(font_1.fontFamily);
    if ( this.hasDefaultFont == false ) {
      this.defaultFont = font_1;
      this.hasDefaultFont = true;
    }
    console.log(((("FontManager: Loaded font '" + font_1.fontFamily) + "' (") + font_1.fontStyle) + ")");
    return true;
  };
  loadFontFamily (familyDir) {
    this.loadFont(((familyDir + "/") + familyDir) + "-Regular.ttf");
  };
  getFont (fontFamily) {
    let i = 0;
    while (i < (this.fonts.length)) {
      const f = this.fonts[i];
      if ( f.fontFamily == fontFamily ) {
        return f;
      }
      i = i + 1;
    };
    i = 0;
    while (i < (this.fonts.length)) {
      const f_1 = this.fonts[i];
      if ( (f_1.fontFamily.indexOf(fontFamily)) >= 0 ) {
        return f_1;
      }
      i = i + 1;
    };
    return this.defaultFont;
  };
  measureText (text, fontFamily, fontSize) {
    const font = this.getFont(fontFamily);
    if ( font.unitsPerEm > 0 ) {
      return font.measureText(text, fontSize);
    }
    return (((text.length)) * fontSize) * 0.5;
  };
  getLineHeight (fontFamily, fontSize) {
    const font = this.getFont(fontFamily);
    if ( font.unitsPerEm > 0 ) {
      return font.getLineHeight(fontSize);
    }
    return fontSize * 1.2;
  };
  getAscender (fontFamily, fontSize) {
    const font = this.getFont(fontFamily);
    if ( font.unitsPerEm > 0 ) {
      return font.getAscender(fontSize);
    }
    return fontSize * 0.8;
  };
  getDescender (fontFamily, fontSize) {
    const font = this.getFont(fontFamily);
    if ( font.unitsPerEm > 0 ) {
      return font.getDescender(fontSize);
    }
    return fontSize * -0.2;
  };
  getFontData (fontFamily) {
    const font = this.getFont(fontFamily);
    return font.getFontData();
  };
  getPostScriptName (fontFamily) {
    const font = this.getFont(fontFamily);
    return font.getPostScriptName();
  };
  printLoadedFonts () {
    console.log(("FontManager: " + (((this.fonts.length).toString()))) + " fonts loaded:");
    let i = 0;
    while (i < (this.fonts.length)) {
      const f = this.fonts[i];
      console.log(((("  - " + f.fontFamily) + " (") + f.fontStyle) + ")");
      i = i + 1;
    };
  };
}
class TTFTextMeasurer  extends EVGTextMeasurer {
  constructor(fm) {
    super()
    this.fontManager = fm;
  }
  measureText (text, fontFamily, fontSize) {
    const width = this.fontManager.measureText(text, fontFamily, fontSize);
    const lineHeight = this.fontManager.getLineHeight(fontFamily, fontSize);
    const ascent = this.fontManager.getAscender(fontFamily, fontSize);
    const descent = this.fontManager.getDescender(fontFamily, fontSize);
    const metrics = new EVGTextMetrics();
    metrics.width = width;
    metrics.height = lineHeight;
    metrics.ascent = ascent;
    metrics.descent = descent;
    metrics.lineHeight = lineHeight;
    return metrics;
  };
  measureTextWidth (text, fontFamily, fontSize) {
    return this.fontManager.measureText(text, fontFamily, fontSize);
  };
  getLineHeight (fontFamily, fontSize) {
    return this.fontManager.getLineHeight(fontFamily, fontSize);
  };
  measureChar (ch, fontFamily, fontSize) {
    const font = this.fontManager.getFont(fontFamily);
    if ( font.unitsPerEm > 0 ) {
      return font.getCharWidthPoints(ch, fontSize);
    }
    return fontSize * 0.5;
  };
}
class GlyphPoint  {
  constructor() {
    this.x = 0.0;
    this.y = 0.0;
    this.onCurve = true;
  }
  init (px, py, on) {
    this.x = px;
    this.y = py;
    this.onCurve = on;
  };
}
class GlyphContour  {
  constructor() {
    this.points = [];
    let p = [];
    this.points = p;
  }
  addPoint (x, y, onCurve) {
    const pt = new GlyphPoint();
    pt.init(x, y, onCurve);
    this.points.push(pt);
  };
  numPoints () {
    return this.points.length;
  };
}
class GlyphOutline  {
  constructor() {
    this.contours = [];
    this.xMin = 0.0;
    this.yMin = 0.0;
    this.xMax = 0.0;
    this.yMax = 0.0;
    this.advanceWidth = 0.0;
    this.leftSideBearing = 0.0;     /** note: unused */
    let c = [];
    this.contours = c;
  }
  addContour (contour) {
    this.contours.push(contour);
  };
}
class GlyphEdge  {
  constructor() {
    this.x1 = 0.0;
    this.y1 = 0.0;
    this.x2 = 0.0;
    this.y2 = 0.0;
    this.minY = 0.0;
    this.maxY = 0.0;
    this.xAtMinY = 0.0;
    this.dxdy = 0.0;
    this.dir = 0;
  }
  init (px1, py1, px2, py2) {
    this.x1 = px1;
    this.y1 = py1;
    this.x2 = px2;
    this.y2 = py2;
    if ( this.y1 < this.y2 ) {
      this.minY = this.y1;
      this.maxY = this.y2;
      this.xAtMinY = this.x1;
      this.dir = 1;
    } else {
      this.minY = this.y2;
      this.maxY = this.y1;
      this.xAtMinY = this.x2;
      this.dir = 0 - 1;
    }
    const dy = this.maxY - this.minY;
    if ( dy > 0.0001 ) {
      if ( this.y1 < this.y2 ) {
        this.dxdy = (this.x2 - this.x1) / dy;
      } else {
        this.dxdy = (this.x1 - this.x2) / dy;
      }
    } else {
      this.dxdy = 0.0;
    }
  };
  getX (y) {
    return this.xAtMinY + (this.dxdy * (y - this.minY));
  };
}
class RasterText  {
  constructor() {
    this.compositor = new RasterCompositor();
    this.glyfOffset = 0;
    this.locaOffset = 0;
    this.locaFormat = 0;
  }
  setFont (ttf) {
    this.font = ttf;
    this.findTableOffsets();
  };
  findTableOffsets () {
    let i = 0;
    const numTables = this.font.tables.length;
    while (i < numTables) {
      const t = this.font.tables[i];
      if ( t.tag == "glyf" ) {
        this.glyfOffset = t.offset;
      }
      if ( t.tag == "loca" ) {
        this.locaOffset = t.offset;
      }
      i = i + 1;
    };
    this.locaFormat = this.font.indexToLocFormat;
  };
  getGlyphOffset (glyphIndex) {
    if ( this.locaFormat == 0 ) {
      const off = this.locaOffset + (glyphIndex * 2);
      const offset16 = this.readUInt16(off);
      return offset16 * 2;
    }
    const off_1 = this.locaOffset + (glyphIndex * 4);
    return this.readUInt32(off_1);
  };
  getGlyphLength (glyphIndex) {
    const start = this.getGlyphOffset(glyphIndex);
    const end = this.getGlyphOffset((glyphIndex + 1));
    return end - start;
  };
  parseGlyph (glyphIndex, fontSize) {
    const outline = new GlyphOutline();
    const scale = fontSize / (this.font.unitsPerEm);
    const glyphLen = this.getGlyphLength(glyphIndex);
    if ( glyphLen == 0 ) {
      outline.advanceWidth = (this.font.getGlyphWidth(glyphIndex)) * scale;
      return outline;
    }
    const off = this.glyfOffset + this.getGlyphOffset(glyphIndex);
    const numberOfContours = this.readInt16(off);
    outline.xMin = this.readInt16((off + 2));
    outline.yMin = this.readInt16((off + 4));
    outline.xMax = this.readInt16((off + 6));
    outline.yMax = this.readInt16((off + 8));
    if ( numberOfContours < 0 ) {
      return outline;
    }
    if ( numberOfContours == 0 ) {
      return outline;
    }
    let endPts = [];
    let i = 0;
    while (i < numberOfContours) {
      const endPt = this.readUInt16(((off + 10) + (i * 2)));
      endPts.push(endPt);
      i = i + 1;
    };
    const instrLen = this.readUInt16(((off + 10) + (numberOfContours * 2)));
    const dataOff = (((off + 10) + (numberOfContours * 2)) + 2) + instrLen;
    const lastEndPt = endPts[(numberOfContours - 1)];
    const numPoints = lastEndPt + 1;
    if ( numPoints > 10000 ) {
      console.log("Warning: Too many points in glyph: " + ((numPoints.toString())));
      return outline;
    }
    let flags = [];
    let flagOff = dataOff;
    i = 0;
    while (i < numPoints) {
      const flag = this.readUInt8(flagOff);
      flags.push(flag);
      flagOff = flagOff + 1;
      i = i + 1;
      if ( ((flag & 8)) != 0 ) {
        const repeatCount = this.readUInt8(flagOff);
        flagOff = flagOff + 1;
        let j = 0;
        while ((j < repeatCount) && (i < numPoints)) {
          flags.push(flag);
          j = j + 1;
          i = i + 1;
        };
      }
    };
    let xCoords = [];
    let xOff = flagOff;
    let x = 0;
    i = 0;
    while (i < numPoints) {
      const flag_1 = flags[i];
      const xShort = ((flag_1 & 2)) != 0;
      const xSame = ((flag_1 & 16)) != 0;
      if ( xShort ) {
        const dx = this.readUInt8(xOff);
        xOff = xOff + 1;
        if ( xSame ) {
          x = x + dx;
        } else {
          x = x - dx;
        }
      } else {
        if ( xSame == false ) {
          const dx_1 = this.readInt16(xOff);
          xOff = xOff + 2;
          x = x + dx_1;
        }
      }
      xCoords.push(x);
      i = i + 1;
    };
    let yCoords = [];
    let yOff = xOff;
    let y = 0;
    i = 0;
    while (i < numPoints) {
      const flag_2 = flags[i];
      const yShort = ((flag_2 & 4)) != 0;
      const ySame = ((flag_2 & 32)) != 0;
      if ( yShort ) {
        const dy = this.readUInt8(yOff);
        yOff = yOff + 1;
        if ( ySame ) {
          y = y + dy;
        } else {
          y = y - dy;
        }
      } else {
        if ( ySame == false ) {
          const dy_1 = this.readInt16(yOff);
          yOff = yOff + 2;
          y = y + dy_1;
        }
      }
      yCoords.push(y);
      i = i + 1;
    };
    const scale_2 = fontSize / (this.font.unitsPerEm);
    let startPt = 0;
    let contourIdx = 0;
    while (contourIdx < numberOfContours) {
      const endPt_1 = endPts[contourIdx];
      const contour = new GlyphContour();
      let ptIdx = startPt;
      while (ptIdx <= endPt_1) {
        const px = ((xCoords[ptIdx])) * scale_2;
        const py = ((yCoords[ptIdx])) * scale_2;
        const flag_3 = flags[ptIdx];
        const onCurve = ((flag_3 & 1)) != 0;
        contour.addPoint(px, py, onCurve);
        ptIdx = ptIdx + 1;
      };
      outline.addContour(contour);
      startPt = endPt_1 + 1;
      contourIdx = contourIdx + 1;
    };
    outline.advanceWidth = (this.font.getGlyphWidth(glyphIndex)) * scale_2;
    return outline;
  };
  renderGlyph (buf, outline, x, y, r, g, b, a) {
    let edges = [];
    const numContours = outline.contours.length;
    let cIdx = 0;
    while (cIdx < numContours) {
      const contour = outline.contours[cIdx];
      const numPts = contour.numPoints();
      if ( numPts >= 2 ) {
        this.flattenContour(contour, edges, x, y);
      }
      cIdx = cIdx + 1;
    };
    this.scanlineFillAA(buf, edges, r, g, b, a);
  };
  renderGlyphFast (buf, outline, x, y, r, g, b, a) {
    let edges = [];
    const numContours = outline.contours.length;
    let cIdx = 0;
    while (cIdx < numContours) {
      const contour = outline.contours[cIdx];
      const numPts = contour.numPoints();
      if ( numPts >= 2 ) {
        this.flattenContour(contour, edges, x, y);
      }
      cIdx = cIdx + 1;
    };
    this.scanlineFill(buf, edges, r, g, b, a);
  };
  flattenContour (contour, edges, offsetX, offsetY) {
    const numPts = contour.numPoints();
    if ( numPts < 2 ) {
      return;
    }
    let startX = 0.0;
    let startY = 0.0;
    const firstPt = contour.points[0];
    if ( firstPt.onCurve ) {
      startX = firstPt.x + offsetX;
      startY = offsetY - firstPt.y;
    } else {
      const lastPt = contour.points[(numPts - 1)];
      if ( lastPt.onCurve ) {
        startX = lastPt.x + offsetX;
        startY = offsetY - lastPt.y;
      } else {
        startX = ((firstPt.x + lastPt.x) / 2.0) + offsetX;
        startY = offsetY - ((firstPt.y + lastPt.y) / 2.0);
      }
    }
    let currX = startX;
    let currY = startY;
    let i = 0;
    while (i < numPts) {
      const pt = contour.points[i];
      const nextIdx = (i + 1) % numPts;
      const nextPt = contour.points[nextIdx];
      if ( pt.onCurve ) {
        if ( nextPt.onCurve ) {
          const nx = nextPt.x + offsetX;
          const ny = offsetY - nextPt.y;
          this.addEdge(edges, currX, currY, nx, ny);
          currX = nx;
          currY = ny;
        }
      } else {
        const p0x = currX;
        const p0y = currY;
        const p1x = pt.x + offsetX;
        const p1y = offsetY - pt.y;
        let p2x = 0.0;
        let p2y = 0.0;
        if ( nextPt.onCurve ) {
          p2x = nextPt.x + offsetX;
          p2y = offsetY - nextPt.y;
        } else {
          p2x = ((pt.x + nextPt.x) / 2.0) + offsetX;
          p2y = offsetY - ((pt.y + nextPt.y) / 2.0);
        }
        const segments = 8;
        let j = 1;
        while (j <= segments) {
          const t = (j) / (segments);
          const invT = 1.0 - t;
          const nx_1 = (((invT * invT) * p0x) + (((2.0 * invT) * t) * p1x)) + ((t * t) * p2x);
          const ny_1 = (((invT * invT) * p0y) + (((2.0 * invT) * t) * p1y)) + ((t * t) * p2y);
          this.addEdge(edges, currX, currY, nx_1, ny_1);
          currX = nx_1;
          currY = ny_1;
          j = j + 1;
        };
      }
      i = i + 1;
    };
    let dx = currX - startX;
    let dy = currY - startY;
    if ( dx < 0.0 ) {
      dx = 0.0 - dx;
    }
    if ( dy < 0.0 ) {
      dy = 0.0 - dy;
    }
    if ( (dx > 0.01) || (dy > 0.01) ) {
      this.addEdge(edges, currX, currY, startX, startY);
    }
  };
  addEdge (edges, x1, y1, x2, y2) {
    let dy = y2 - y1;
    if ( dy < 0.0 ) {
      dy = 0.0 - dy;
    }
    if ( dy < 0.001 ) {
      return;
    }
    const edge = new GlyphEdge();
    edge.init(x1, y1, x2, y2);
    edges.push(edge);
  };
  flattenQuadBezier (edges, x0, y0, x1, y1, x2, y2, segments) {
    let prevX = x0;
    let prevY = y0;
    let i = 1;
    while (i <= segments) {
      const t = (i) / (segments);
      const invT = 1.0 - t;
      const currX = (((invT * invT) * x0) + (((2.0 * invT) * t) * x1)) + ((t * t) * x2);
      const currY = (((invT * invT) * y0) + (((2.0 * invT) * t) * y1)) + ((t * t) * y2);
      this.addEdge(edges, prevX, prevY, currX, currY);
      prevX = currX;
      prevY = currY;
      i = i + 1;
    };
  };
  scanlineFill (buf, edges, r, g, b, a) {
    const numEdges = edges.length;
    if ( numEdges == 0 ) {
      return;
    }
    let minY = 99999.0;
    let maxY = 0.0 - 99999.0;
    let i = 0;
    while (i < numEdges) {
      const e = edges[i];
      if ( e.minY < minY ) {
        minY = e.minY;
      }
      if ( e.maxY > maxY ) {
        maxY = e.maxY;
      }
      i = i + 1;
    };
    let startY = Math.floor( minY);
    let endY = Math.floor( maxY);
    if ( startY < 0 ) {
      startY = 0;
    }
    if ( endY >= buf.height ) {
      endY = buf.height - 1;
    }
    let scanY = startY;
    while (scanY <= endY) {
      const y = (scanY) + 0.5;
      let intersections = [];
      i = 0;
      while (i < numEdges) {
        const e_1 = edges[i];
        if ( (y >= e_1.minY) && (y < e_1.maxY) ) {
          const ix = e_1.getX(y);
          intersections.push(ix);
        }
        i = i + 1;
      };
      this.sortDoubles(intersections);
      const numInt = intersections.length;
      let j = 0;
      while ((j + 1) < numInt) {
        let x1 = Math.floor( (intersections[j]));
        let x2 = Math.floor( (intersections[(j + 1)]));
        if ( x1 < 0 ) {
          x1 = 0;
        }
        if ( x2 >= buf.width ) {
          x2 = buf.width - 1;
        }
        let px = x1;
        while (px <= x2) {
          this.compositor.blendSourceOver(buf, px, scanY, r, g, b, a);
          px = px + 1;
        };
        j = j + 2;
      };
      scanY = scanY + 1;
    };
  };
  scanlineFillAA (buf, edges, r, g, b, a) {
    const numEdges = edges.length;
    if ( numEdges == 0 ) {
      return;
    }
    let minY = 99999.0;
    let maxY = 0.0 - 99999.0;
    let minX = 99999.0;
    let maxX = 0.0 - 99999.0;
    let i = 0;
    while (i < numEdges) {
      const e = edges[i];
      if ( e.minY < minY ) {
        minY = e.minY;
      }
      if ( e.maxY > maxY ) {
        maxY = e.maxY;
      }
      if ( e.x1 < minX ) {
        minX = e.x1;
      }
      if ( e.x2 < minX ) {
        minX = e.x2;
      }
      if ( e.x1 > maxX ) {
        maxX = e.x1;
      }
      if ( e.x2 > maxX ) {
        maxX = e.x2;
      }
      i = i + 1;
    };
    let startY = (Math.floor( minY)) - 1;
    let endY = (Math.floor( maxY)) + 1;
    let startX = (Math.floor( minX)) - 1;
    let endX = (Math.floor( maxX)) + 1;
    if ( startY < 0 ) {
      startY = 0;
    }
    if ( endY >= buf.height ) {
      endY = buf.height - 1;
    }
    if ( startX < 0 ) {
      startX = 0;
    }
    if ( endX >= buf.width ) {
      endX = buf.width - 1;
    }
    const subStep = 0.25;
    const subOffset = 0.125;
    const samplesPerPixel = 16.0;
    const epsilon = 0.0001;
    let scanY = startY;
    while (scanY <= endY) {
      let scanX = startX;
      while (scanX <= endX) {
        let coverage = 0;
        let sy = 0;
        while (sy < 4) {
          const sampleY = ((scanY) + subOffset) + ((sy) * subStep);
          let sx = 0;
          while (sx < 4) {
            const sampleX = ((scanX) + subOffset) + ((sx) * subStep);
            let winding = 0;
            i = 0;
            while (i < numEdges) {
              const e_1 = edges[i];
              if ( (sampleY >= e_1.minY) && (sampleY < e_1.maxY) ) {
                const edgeX = e_1.getX(sampleY);
                if ( edgeX < sampleX ) {
                  winding = winding + e_1.dir;
                }
              }
              i = i + 1;
            };
            if ( winding != 0 ) {
              coverage = coverage + 1;
            }
            sx = sx + 1;
          };
          sy = sy + 1;
        };
        if ( coverage > 0 ) {
          const coverageAlpha = Math.floor( (((coverage) / samplesPerPixel) * (a)));
          this.compositor.blendSourceOver(buf, scanX, scanY, r, g, b, coverageAlpha);
        }
        scanX = scanX + 1;
      };
      scanY = scanY + 1;
    };
  };
  sortIntersections (arr, dirs) {
    const n = arr.length;
    let i = 0;
    while (i < n) {
      let j = 0;
      while (j < ((n - i) - 1)) {
        const v1 = arr[j];
        const v2 = arr[(j + 1)];
        if ( v1 > v2 ) {
          arr[j] = v2;
          arr[j + 1] = v1;
          const d1 = dirs[j];
          const d2 = dirs[(j + 1)];
          dirs[j] = d2;
          dirs[j + 1] = d1;
        }
        j = j + 1;
      };
      i = i + 1;
    };
  };
  sortDoubles (arr) {
    const n = arr.length;
    let i = 0;
    while (i < n) {
      let j = 0;
      while (j < ((n - i) - 1)) {
        const v1 = arr[j];
        const v2 = arr[(j + 1)];
        if ( v1 > v2 ) {
          arr[j] = v2;
          arr[j + 1] = v1;
        }
        j = j + 1;
      };
      i = i + 1;
    };
  };
  renderText (buf, text, x, y, fontSize, r, g, b, a) {
    let currX = x;
    const __len = text.length;
    let i = 0;
    const baseline = this.font.getAscender(fontSize);
    const renderY = y + baseline;
    while (i < __len) {
      const ch = text.charCodeAt(i );
      const glyphIdx = this.font.getGlyphIndex(ch);
      const outline = this.parseGlyph(glyphIdx, fontSize);
      this.renderGlyph(buf, outline, currX, renderY, r, g, b, a);
      currX = currX + outline.advanceWidth;
      i = i + 1;
    };
  };
  renderTextWithShadow (buf, text, x, y, fontSize, textR, textG, textB, textA, shadowR, shadowG, shadowB, shadowA, shadowOffX, shadowOffY, blurRadius) {
    const shadowBuf = new RasterBuffer();
    const margin = blurRadius * 2;
    const textWidth = this.font.measureText(text, fontSize);
    const textHeight = this.font.getLineHeight(fontSize);
    const bufW = (((Math.floor( textWidth)) + margin) + margin) + 10;
    const bufH = (((Math.floor( textHeight)) + margin) + margin) + 10;
    shadowBuf.create(bufW, bufH);
    this.renderText(shadowBuf, text, margin, margin, fontSize, shadowR, shadowG, shadowB, 255);
    if ( blurRadius > 0 ) {
      const blur = new RasterBlur();
      const blurred = blur.gaussianApproxBlur(shadowBuf, blurRadius);
      let py = 0;
      while (py < blurred.height) {
        let px = 0;
        while (px < blurred.width) {
          const p = blurred.getPixel(px, py);
          const newA = Math.floor( (((p.a * shadowA)) / 255.0));
          blurred.setPixel(px, py, p.r, p.g, p.b, newA);
          px = px + 1;
        };
        py = py + 1;
      };
      const shadowX = (Math.floor( (x + shadowOffX))) - margin;
      const shadowY = (Math.floor( (y + shadowOffY))) - margin;
      this.compositor.compositeOver(buf, blurred, shadowX, shadowY);
    } else {
      const shadowX_1 = (Math.floor( (x + shadowOffX))) - margin;
      const shadowY_1 = (Math.floor( (y + shadowOffY))) - margin;
      let py_1 = 0;
      while (py_1 < shadowBuf.height) {
        let px_1 = 0;
        while (px_1 < shadowBuf.width) {
          const p_1 = shadowBuf.getPixel(px_1, py_1);
          const newA_1 = Math.floor( (((p_1.a * shadowA)) / 255.0));
          shadowBuf.setPixel(px_1, py_1, p_1.r, p_1.g, p_1.b, newA_1);
          px_1 = px_1 + 1;
        };
        py_1 = py_1 + 1;
      };
      this.compositor.compositeOver(buf, shadowBuf, shadowX_1, shadowY_1);
    }
    this.renderText(buf, text, x, y, fontSize, textR, textG, textB, textA);
  };
  readUInt8 (offset) {
    return this.font.fontData._view.getUint8(offset);
  };
  readUInt16 (offset) {
    const b1 = this.font.fontData._view.getUint8(offset);
    const b2 = this.font.fontData._view.getUint8((offset + 1));
    return (b1 * 256) + b2;
  };
  readInt16 (offset) {
    const val = this.readUInt16(offset);
    if ( val >= 32768 ) {
      return val - 65536;
    }
    return val;
  };
  readUInt32 (offset) {
    const b1 = this.font.fontData._view.getUint8(offset);
    const b2 = this.font.fontData._view.getUint8((offset + 1));
    const b3 = this.font.fontData._view.getUint8((offset + 2));
    const b4 = this.font.fontData._view.getUint8((offset + 3));
    return (((((b1 * 256) + b2) * 256) + b3) * 256) + b4;
  };
}
class PNGEncoder  {
  constructor() {
    this.crcTable = [];
    this.crcTableInit = false;
    this.output = new GrowableBuffer();
  }
  initCRCTable () {
    if ( this.crcTableInit ) {
      return;
    }
    let n = 0;
    while (n < 256) {
      let c = n;
      let k = 0;
      while (k < 8) {
        if ( ((c & 1)) != 0 ) {
          c = (((c >>> 1)) ^ 3988292384);
        } else {
          c = (c >>> 1);
        }
        k = k + 1;
      };
      this.crcTable.push(c);
      n = n + 1;
    };
    this.crcTableInit = true;
  };
  crc32Buffer (data) {
    this.initCRCTable();
    let crc = 4294967295;
    const buf = data.toBuffer();
    const __len = (data).size();
    let i = 0;
    while (i < __len) {
      const byte = buf._view.getUint8(i);
      const idx = (((crc ^ byte)) & 255);
      crc = (((crc >>> 8)) ^ (this.crcTable[idx]));
      i = i + 1;
    };
    return (crc ^ 4294967295);
  };
  writeSignature () {
    this.output.writeByte(137);
    this.output.writeByte(80);
    this.output.writeByte(78);
    this.output.writeByte(71);
    this.output.writeByte(13);
    this.output.writeByte(10);
    this.output.writeByte(26);
    this.output.writeByte(10);
  };
  writeUInt32 (value) {
    this.output.writeByte((((value >> 24)) & 255));
    this.output.writeByte((((value >> 16)) & 255));
    this.output.writeByte((((value >> 8)) & 255));
    this.output.writeByte((value & 255));
  };
  writeUInt32To (buf, value) {
    buf.writeByte((((value >> 24)) & 255));
    buf.writeByte((((value >> 16)) & 255));
    buf.writeByte((((value >> 8)) & 255));
    buf.writeByte((value & 255));
  };
  writeChunk (chunkType, data) {
    const dataLen = (data).size();
    this.writeUInt32(dataLen);
    const crcData = new GrowableBuffer();
    let i = 0;
    while (i < 4) {
      const ch = chunkType.charCodeAt(i );
      crcData.writeByte(ch);
      this.output.writeByte(ch);
      i = i + 1;
    };
    const dataBuf = data.toBuffer();
    i = 0;
    while (i < dataLen) {
      const b = dataBuf._view.getUint8(i);
      crcData.writeByte(b);
      this.output.writeByte(b);
      i = i + 1;
    };
    const crc = this.crc32Buffer(crcData);
    this.writeUInt32(crc);
  };
  writeIHDR (width, height) {
    const data = new GrowableBuffer();
    this.writeUInt32To(data, width);
    this.writeUInt32To(data, height);
    data.writeByte(8);
    data.writeByte(2);
    data.writeByte(0);
    data.writeByte(0);
    data.writeByte(0);
    this.writeChunk("IHDR", data);
  };
  adler32 (data) {
    let a = 1;
    let b = 0;
    const buf = data.toBuffer();
    const __len = (data).size();
    let i = 0;
    while (i < __len) {
      a = (a + (buf._view.getUint8(i))) % 65521;
      b = (b + a) % 65521;
      i = i + 1;
    };
    return (((b << 16)) | a);
  };
  createDeflateData (rawData, compressed) {
    const rawBuf = rawData.toBuffer();
    const dataLen = (rawData).size();
    const blockSize = 65535;
    let offset = 0;
    while (offset < dataLen) {
      const remaining = dataLen - offset;
      let __len = blockSize;
      if ( remaining < __len ) {
        __len = remaining;
      }
      let isFinal = 0;
      if ( (offset + __len) >= dataLen ) {
        isFinal = 1;
      }
      compressed.writeByte(isFinal);
      compressed.writeByte((__len & 255));
      compressed.writeByte((((__len >> 8)) & 255));
      const nlen = (__len ^ 65535);
      compressed.writeByte((nlen & 255));
      compressed.writeByte((((nlen >> 8)) & 255));
      let i = 0;
      while (i < __len) {
        compressed.writeByte(rawBuf._view.getUint8((offset + i)));
        i = i + 1;
      };
      offset = offset + __len;
    };
  };
  writeIDAT (buf) {
    const rawData = new GrowableBuffer();
    let y = 0;
    while (y < buf.height) {
      rawData.writeByte(0);
      let x = 0;
      while (x < buf.width) {
        const idx = ((y * buf.width) + x) * 4;
        rawData.writeByte(buf.pixels._view.getUint8(idx));
        rawData.writeByte(buf.pixels._view.getUint8((idx + 1)));
        rawData.writeByte(buf.pixels._view.getUint8((idx + 2)));
        x = x + 1;
      };
      y = y + 1;
    };
    const zlibData = new GrowableBuffer();
    zlibData.writeByte(120);
    zlibData.writeByte(1);
    this.createDeflateData(rawData, zlibData);
    const adler = this.adler32(rawData);
    zlibData.writeByte((((adler >> 24)) & 255));
    zlibData.writeByte((((adler >> 16)) & 255));
    zlibData.writeByte((((adler >> 8)) & 255));
    zlibData.writeByte((adler & 255));
    this.writeChunk("IDAT", zlibData);
  };
  writeIEND () {
    const data = new GrowableBuffer();
    this.writeChunk("IEND", data);
  };
  encode (buf, dirPath, fileName) {
    console.log("Encoding PNG: " + fileName);
    console.log((("  Image size: " + ((buf.width.toString()))) + "x") + ((buf.height.toString())));
    this.output = new GrowableBuffer();
    this.writeSignature();
    this.writeIHDR(buf.width, buf.height);
    this.writeIDAT(buf);
    this.writeIEND();
    const finalSize = (this.output).size();
    console.log(("  Encoded size: " + ((finalSize.toString()))) + " bytes");
    const outBuf = this.output.toBuffer();
    require('fs').writeFileSync(dirPath + '/' + fileName, Buffer.from(outBuf));
    console.log((("  Saved: " + dirPath) + "/") + fileName);
  };
}
class EVGImageDimensions  {
  constructor() {
    this.width = 0;
    this.height = 0;
    this.aspectRatio = 1.0;
    this.isValid = false;
    this.width = 0;
    this.height = 0;
    this.aspectRatio = 1.0;
    this.isValid = false;
  }
}
EVGImageDimensions.create = function(w, h) {
  const d = new EVGImageDimensions();
  d.width = w;
  d.height = h;
  if ( h > 0 ) {
    d.aspectRatio = (w) / (h);
  }
  d.isValid = true;
  return d;
};
class EVGImageMeasurer  {
  constructor() {
  }
  getImageDimensions (src) {
    const dims = new EVGImageDimensions();
    return dims;
  };
  calculateHeightForWidth (src, targetWidth) {
    const dims = this.getImageDimensions(src);
    if ( dims.isValid ) {
      return targetWidth / dims.aspectRatio;
    }
    return targetWidth;
  };
  calculateWidthForHeight (src, targetHeight) {
    const dims = this.getImageDimensions(src);
    if ( dims.isValid ) {
      return targetHeight * dims.aspectRatio;
    }
    return targetHeight;
  };
  calculateFitDimensions (src, maxWidth, maxHeight) {
    const dims = this.getImageDimensions(src);
    if ( dims.isValid == false ) {
      return EVGImageDimensions.create((Math.floor( maxWidth)), (Math.floor( maxHeight)));
    }
    const scaleW = maxWidth / (dims.width);
    const scaleH = maxHeight / (dims.height);
    let scale = scaleW;
    if ( scaleH < scaleW ) {
      scale = scaleH;
    }
    const newW = Math.floor( ((dims.width) * scale));
    const newH = Math.floor( ((dims.height) * scale));
    return EVGImageDimensions.create(newW, newH);
  };
}
class SimpleImageMeasurer  extends EVGImageMeasurer {
  constructor() {
    super()
  }
}
class EVGLayout  {
  constructor() {
    this.pageWidth = 612.0;
    this.pageHeight = 792.0;
    this.currentPage = 0;
    this.debug = false;
    const m = new SimpleTextMeasurer();
    this.measurer = m;
    const im = new SimpleImageMeasurer();
    this.imageMeasurer = im;
  }
  setMeasurer (m) {
    this.measurer = m;
  };
  setImageMeasurer (m) {
    this.imageMeasurer = m;
  };
  setPageSize (w, h) {
    this.pageWidth = w;
    this.pageHeight = h;
  };
  setDebug (d) {
    this.debug = d;
  };
  log (msg) {
    if ( this.debug ) {
      console.log(msg);
    }
  };
  layout (root) {
    this.log("EVGLayout: Starting layout");
    this.currentPage = 0;
    if ( root.width.isSet == false ) {
      root.width = EVGUnit.px(this.pageWidth);
    }
    if ( root.height.isSet == false ) {
      root.height = EVGUnit.px(this.pageHeight);
    }
    this.layoutElement(root, 0.0, 0.0, this.pageWidth, this.pageHeight);
    this.log("EVGLayout: Layout complete");
  };
  layoutElement (element, parentX, parentY, parentWidth, parentHeight) {
    element.resolveUnits(parentWidth, parentHeight);
    let width = parentWidth;
    if ( element.width.isSet ) {
      width = element.width.pixels;
    }
    let height = 0.0;
    let autoHeight = true;
    if ( element.height.isSet ) {
      height = element.height.pixels;
      autoHeight = false;
    }
    if ( element.tagName == "image" ) {
      const imgSrc = element.src;
      if ( (imgSrc.length) > 0 ) {
        const dims = this.imageMeasurer.getImageDimensions(imgSrc);
        if ( dims.isValid ) {
          if ( element.width.isSet && (element.height.isSet == false) ) {
            height = width / dims.aspectRatio;
            autoHeight = false;
            this.log((("  Image aspect ratio: " + ((dims.aspectRatio.toString()))) + " -> height=") + ((height.toString())));
          }
          if ( (element.width.isSet == false) && element.height.isSet ) {
            width = height * dims.aspectRatio;
            this.log((("  Image aspect ratio: " + ((dims.aspectRatio.toString()))) + " -> width=") + ((width.toString())));
          }
          if ( (element.width.isSet == false) && (element.height.isSet == false) ) {
            width = dims.width;
            height = dims.height;
            if ( width > parentWidth ) {
              const scale = parentWidth / width;
              width = parentWidth;
              height = height * scale;
            }
            autoHeight = false;
            this.log((("  Image natural size: " + ((width.toString()))) + "x") + ((height.toString())));
          }
        }
      }
    }
    if ( element.minWidth.isSet ) {
      if ( width < element.minWidth.pixels ) {
        width = element.minWidth.pixels;
      }
    }
    if ( element.maxWidth.isSet ) {
      if ( width > element.maxWidth.pixels ) {
        width = element.maxWidth.pixels;
      }
    }
    element.calculatedWidth = width;
    element.calculatedInnerWidth = element.box.getInnerWidth(width);
    if ( autoHeight == false ) {
      element.calculatedHeight = height;
      element.calculatedInnerHeight = element.box.getInnerHeight(height);
    }
    if ( element.isAbsolute ) {
      this.layoutAbsolute(element, parentWidth, parentHeight);
    }
    const childCount = element.getChildCount();
    let contentHeight = 0.0;
    if ( childCount > 0 ) {
      contentHeight = this.layoutChildren(element);
    } else {
      if ( (element.tagName == "text") || (element.tagName == "span") ) {
        let fontSize = element.inheritedFontSize;
        if ( element.fontSize.isSet ) {
          fontSize = element.fontSize.pixels;
        }
        if ( fontSize <= 0.0 ) {
          fontSize = 14.0;
        }
        let lineHeightFactor = element.lineHeight;
        if ( lineHeightFactor <= 0.0 ) {
          lineHeightFactor = 1.2;
        }
        const lineSpacing = fontSize * lineHeightFactor;
        const textContent = element.textContent;
        const availableWidth = (width - element.box.paddingLeftPx) - element.box.paddingRightPx;
        const lineCount = this.estimateLineCount(textContent, availableWidth, fontSize);
        contentHeight = lineSpacing * (lineCount);
      }
    }
    if ( autoHeight ) {
      height = ((contentHeight + element.box.paddingTopPx) + element.box.paddingBottomPx) + (element.box.borderWidthPx * 2.0);
    }
    if ( element.minHeight.isSet ) {
      if ( height < element.minHeight.pixels ) {
        height = element.minHeight.pixels;
      }
    }
    if ( element.maxHeight.isSet ) {
      if ( height > element.maxHeight.pixels ) {
        height = element.maxHeight.pixels;
      }
    }
    element.calculatedHeight = height;
    element.calculatedInnerHeight = element.box.getInnerHeight(height);
    element.calculatedPage = this.currentPage;
    element.isLayoutComplete = true;
    this.log((((((((((("  Laid out " + element.tagName) + " id=") + element.id) + " at (") + ((element.calculatedX.toString()))) + ",") + ((element.calculatedY.toString()))) + ") size=") + ((width.toString()))) + "x") + ((height.toString())));
  };
  layoutChildren (parent) {
    const childCount = parent.getChildCount();
    if ( childCount == 0 ) {
      return 0.0;
    }
    const innerWidth = parent.calculatedInnerWidth;
    const innerHeight = parent.calculatedInnerHeight;
    const startX = ((parent.calculatedX + parent.box.marginLeftPx) + parent.box.borderWidthPx) + parent.box.paddingLeftPx;
    const startY = ((parent.calculatedY + parent.box.marginTopPx) + parent.box.borderWidthPx) + parent.box.paddingTopPx;
    let currentX = startX;
    let currentY = startY;
    let rowHeight = 0.0;
    let rowElements = [];
    let totalHeight = 0.0;
    const isColumn = parent.flexDirection == "column";
    if ( isColumn == false ) {
      let fixedWidth = 0.0;
      let totalFlex = 0.0;
      let j = 0;
      while (j < childCount) {
        const c = parent.getChild(j);
        c.resolveUnits(innerWidth, innerHeight);
        if ( c.width.isSet ) {
          fixedWidth = ((fixedWidth + c.width.pixels) + c.box.marginLeftPx) + c.box.marginRightPx;
        } else {
          if ( c.flex > 0.0 ) {
            totalFlex = totalFlex + c.flex;
            fixedWidth = (fixedWidth + c.box.marginLeftPx) + c.box.marginRightPx;
          } else {
            fixedWidth = ((fixedWidth + innerWidth) + c.box.marginLeftPx) + c.box.marginRightPx;
          }
        }
        j = j + 1;
      };
      let availableForFlex = innerWidth - fixedWidth;
      if ( availableForFlex < 0.0 ) {
        availableForFlex = 0.0;
      }
      if ( totalFlex > 0.0 ) {
        j = 0;
        while (j < childCount) {
          const c_1 = parent.getChild(j);
          if ( (c_1.width.isSet == false) && (c_1.flex > 0.0) ) {
            const flexWidth = (availableForFlex * c_1.flex) / totalFlex;
            c_1.calculatedFlexWidth = flexWidth;
          }
          j = j + 1;
        };
      }
    }
    let i = 0;
    while (i < childCount) {
      const child = parent.getChild(i);
      child.inheritProperties(parent);
      child.resolveUnits(innerWidth, innerHeight);
      if ( child.isAbsolute ) {
        this.layoutAbsolute(child, innerWidth, innerHeight);
        child.calculatedX = child.calculatedX + startX;
        child.calculatedY = child.calculatedY + startY;
        if ( child.getChildCount() > 0 ) {
          this.layoutChildren(child);
        }
        i = i + 1;
        continue;
      }
      let childWidth = innerWidth;
      if ( child.width.isSet ) {
        childWidth = child.width.pixels;
      } else {
        if ( child.calculatedFlexWidth > 0.0 ) {
          childWidth = child.calculatedFlexWidth;
        }
      }
      const childTotalWidth = (childWidth + child.box.marginLeftPx) + child.box.marginRightPx;
      if ( isColumn == false ) {
        const availableWidth = (startX + innerWidth) - currentX;
        if ( (childTotalWidth > availableWidth) && ((rowElements.length) > 0) ) {
          this.alignRow(rowElements, parent, rowHeight, startX, innerWidth);
          currentY = currentY + rowHeight;
          totalHeight = totalHeight + rowHeight;
          currentX = startX;
          rowHeight = 0.0;
          rowElements.length = 0;
        }
      }
      child.calculatedX = currentX + child.box.marginLeftPx;
      child.calculatedY = currentY + child.box.marginTopPx;
      this.layoutElement(child, child.calculatedX, child.calculatedY, childWidth, innerHeight);
      const childHeight = child.calculatedHeight;
      const childTotalHeight = (childHeight + child.box.marginTopPx) + child.box.marginBottomPx;
      if ( isColumn ) {
        currentY = currentY + childTotalHeight;
        totalHeight = totalHeight + childTotalHeight;
      } else {
        currentX = currentX + childTotalWidth;
        rowElements.push(child);
        if ( childTotalHeight > rowHeight ) {
          rowHeight = childTotalHeight;
        }
      }
      if ( child.lineBreak ) {
        if ( isColumn == false ) {
          this.alignRow(rowElements, parent, rowHeight, startX, innerWidth);
          currentY = currentY + rowHeight;
          totalHeight = totalHeight + rowHeight;
          currentX = startX;
          rowHeight = 0.0;
          rowElements.length = 0;
        }
      }
      i = i + 1;
    };
    if ( (isColumn == false) && ((rowElements.length) > 0) ) {
      this.alignRow(rowElements, parent, rowHeight, startX, innerWidth);
      totalHeight = totalHeight + rowHeight;
    }
    return totalHeight;
  };
  alignRow (rowElements, parent, rowHeight, startX, innerWidth) {
    const elementCount = rowElements.length;
    if ( elementCount == 0 ) {
      return;
    }
    let rowWidth = 0.0;
    let i = 0;
    while (i < elementCount) {
      const el = rowElements[i];
      rowWidth = ((rowWidth + el.calculatedWidth) + el.box.marginLeftPx) + el.box.marginRightPx;
      i = i + 1;
    };
    let offsetX = 0.0;
    if ( parent.align == "center" ) {
      offsetX = (innerWidth - rowWidth) / 2.0;
    }
    if ( parent.align == "right" ) {
      offsetX = innerWidth - rowWidth;
    }
    let effectiveRowHeight = rowHeight;
    if ( parent.height.isSet ) {
      const parentInnerHeight = parent.calculatedInnerHeight;
      if ( parentInnerHeight > rowHeight ) {
        effectiveRowHeight = parentInnerHeight;
      }
    }
    i = 0;
    while (i < elementCount) {
      const el_1 = rowElements[i];
      if ( offsetX != 0.0 ) {
        el_1.calculatedX = el_1.calculatedX + offsetX;
      }
      const childTotalHeight = (el_1.calculatedHeight + el_1.box.marginTopPx) + el_1.box.marginBottomPx;
      let offsetY = 0.0;
      if ( parent.verticalAlign == "center" ) {
        offsetY = (effectiveRowHeight - childTotalHeight) / 2.0;
      }
      if ( parent.verticalAlign == "bottom" ) {
        offsetY = effectiveRowHeight - childTotalHeight;
      }
      if ( offsetY != 0.0 ) {
        el_1.calculatedY = el_1.calculatedY + offsetY;
      }
      i = i + 1;
    };
  };
  layoutAbsolute (element, parentWidth, parentHeight) {
    if ( element.left.isSet ) {
      element.calculatedX = element.left.pixels + element.box.marginLeftPx;
    } else {
      if ( element.x.isSet ) {
        element.calculatedX = element.x.pixels + element.box.marginLeftPx;
      } else {
        if ( element.right.isSet ) {
          let width = element.calculatedWidth;
          if ( width == 0.0 ) {
            if ( element.width.isSet ) {
              width = element.width.pixels;
            }
          }
          element.calculatedX = ((parentWidth - element.right.pixels) - width) - element.box.marginRightPx;
        }
      }
    }
    if ( element.top.isSet ) {
      element.calculatedY = element.top.pixels + element.box.marginTopPx;
    } else {
      if ( element.y.isSet ) {
        element.calculatedY = element.y.pixels + element.box.marginTopPx;
      } else {
        if ( element.bottom.isSet ) {
          let height = element.calculatedHeight;
          if ( height == 0.0 ) {
            if ( element.height.isSet ) {
              height = element.height.pixels;
            }
          }
          element.calculatedY = ((parentHeight - element.bottom.pixels) - height) - element.box.marginBottomPx;
        }
      }
    }
  };
  printLayout (element, indent) {
    let indentStr = "";
    let i = 0;
    while (i < indent) {
      indentStr = indentStr + "  ";
      i = i + 1;
    };
    console.log(((((((((((indentStr + element.tagName) + " id=\"") + element.id) + "\" (") + ((element.calculatedX.toString()))) + ", ") + ((element.calculatedY.toString()))) + ") ") + ((element.calculatedWidth.toString()))) + "x") + ((element.calculatedHeight.toString())));
    const childCount = element.getChildCount();
    i = 0;
    while (i < childCount) {
      const child = element.getChild(i);
      this.printLayout(child, indent + 1);
      i = i + 1;
    };
  };
  estimateLineCount (text, maxWidth, fontSize) {
    if ( (text.length) == 0 ) {
      return 1;
    }
    if ( maxWidth <= 0.0 ) {
      return 1;
    }
    const words = text.split(" ");
    let lineCount = 1;
    let currentLineWidth = 0.0;
    const spaceWidth = fontSize * 0.3;
    let i = 0;
    while (i < (words.length)) {
      const word = words[i];
      const wordWidth = this.measurer.measureTextWidth(word, "Helvetica", fontSize);
      if ( currentLineWidth == 0.0 ) {
        currentLineWidth = wordWidth;
      } else {
        const testWidth = (currentLineWidth + spaceWidth) + wordWidth;
        if ( testWidth > maxWidth ) {
          lineCount = lineCount + 1;
          currentLineWidth = wordWidth;
        } else {
          currentLineWidth = testWidth;
        }
      }
      i = i + 1;
    };
    return lineCount;
  };
}
class EVGPNGTool  {
  constructor() {
    this.inputFile = "";
    this.outputFile = "";
    this.pageWidth = 595.0;
    this.pageHeight = 842.0;
    this.scale = 1.0;
    this.debug = false;
    this.baseDir = "";
  }
  run () {
    const argCount = (process.argv.length - 2);
    if ( argCount < 2 ) {
      this.printUsage();
      return;
    }
    this.inputFile = process.argv[ 2 + 0];
    this.outputFile = process.argv[ 2 + 1];
    let i = 2;
    while (i < argCount) {
      const arg = process.argv[ 2 + i];
      if ( arg == "-w" ) {
        if ( (i + 1) < argCount ) {
          i = i + 1;
          const wArg = process.argv[ 2 + i];
          const wVal = isNaN( parseFloat(wArg) ) ? undefined : parseFloat(wArg);
          if ( typeof(wVal) != "undefined" ) {
            this.pageWidth = wVal;
          }
        }
      }
      if ( arg == "-h" ) {
        if ( (i + 1) < argCount ) {
          i = i + 1;
          const hArg = process.argv[ 2 + i];
          const hVal = isNaN( parseFloat(hArg) ) ? undefined : parseFloat(hArg);
          if ( typeof(hVal) != "undefined" ) {
            this.pageHeight = hVal;
          }
        }
      }
      if ( arg == "-scale" ) {
        if ( (i + 1) < argCount ) {
          i = i + 1;
          const sArg = process.argv[ 2 + i];
          const sVal = isNaN( parseFloat(sArg) ) ? undefined : parseFloat(sArg);
          if ( typeof(sVal) != "undefined" ) {
            this.scale = sVal;
          }
        }
      }
      if ( arg == "-debug" ) {
        this.debug = true;
      }
      i = i + 1;
    };
    console.log("EVG PNG Tool");
    console.log("Input:  " + this.inputFile);
    console.log("Output: " + this.outputFile);
    console.log(((("Page:   " + ((this.pageWidth.toString()))) + " x ") + ((this.pageHeight.toString()))) + " points");
    console.log("Scale:  " + ((this.scale.toString())));
    this.convert();
  };
  printUsage () {
    console.log("EVG PNG Tool - Convert TSX files to PNG");
    console.log("");
    console.log("Usage: evg_png_tool input.tsx output.png");
    console.log("");
    console.log("Options:");
    console.log("  -w WIDTH   Page width in points (default: 595 = A4)");
    console.log("  -h HEIGHT  Page height in points (default: 842 = A4)");
    console.log("  -scale S   Scale factor (default: 1.0)");
    console.log("  -debug     Enable debug output");
    console.log("");
    console.log("Example:");
    console.log("  evg_png_tool sample.tsx output.png");
    console.log("  evg_png_tool sample.tsx output.png -w 800 -h 600 -scale 2");
  };
  convert () {
    let inputDir = "";
    let inputFileName = this.inputFile;
    let lastSlash = this.inputFile.lastIndexOf("/");
    let lastBackslash = this.inputFile.lastIndexOf("\\");
    let lastSep = lastSlash;
    if ( lastBackslash > lastSep ) {
      lastSep = lastBackslash;
    }
    if ( lastSep >= 0 ) {
      inputDir = this.inputFile.substring(0, (lastSep + 1) );
      inputFileName = this.inputFile.substring((lastSep + 1), (this.inputFile.length) );
    } else {
      inputDir = "./";
    }
    this.baseDir = inputDir;
    console.log("");
    console.log("Parsing TSX file...");
    const converter = new JSXToEVG();
    converter.pageWidth = this.pageWidth;
    converter.pageHeight = this.pageHeight;
    const root = converter.parseFile(inputDir, inputFileName);
    if ( root.tagName == "" ) {
      console.log("Error: Failed to parse TSX file or no JSX content found");
      return;
    }
    console.log(("Found root element: <" + root.tagName) + ">");
    console.log("Children: " + ((root.getChildCount().toString())));
    console.log("");
    console.log("Initializing raster renderer...");
    const pixelWidth = Math.floor( (this.pageWidth * this.scale));
    const pixelHeight = Math.floor( (this.pageHeight * this.scale));
    console.log(((("Raster size: " + ((pixelWidth.toString()))) + " x ") + ((pixelHeight.toString()))) + " pixels");
    this.renderer = new EVGRasterRenderer();
    this.renderer.init(pixelWidth, pixelHeight);
    (this.renderer).clear(245, 245, 245, 255);
    const testBuf = this.renderer.getBuffer();
    const p0 = testBuf.pixels._view.getUint8(0);
    const p1 = testBuf.pixels._view.getUint8(1);
    const p2 = testBuf.pixels._view.getUint8(2);
    const p3 = testBuf.pixels._view.getUint8(3);
    console.log((((((("Buffer created - first pixel RGBA: " + ((p0.toString()))) + ",") + ((p1.toString()))) + ",") + ((p2.toString()))) + ",") + ((p3.toString())));
    this.fontManager = new FontManager();
    this.fontManager.setFontsDirectories(inputDir + "../assets/fonts");
    this.fontManager.loadFont("Open_Sans/OpenSans-Regular.ttf");
    this.fontManager.loadFont("Open_Sans/OpenSans-Bold.ttf");
    this.textRenderer = new RasterText();
    const defaultFont = this.fontManager.getFont("Open Sans");
    if ( defaultFont.unitsPerEm > 0 ) {
      this.textRenderer.setFont(defaultFont);
    }
    console.log("");
    console.log("Running layout engine...");
    this.layout = new EVGLayout();
    this.layout.setPageSize(this.pageWidth, this.pageHeight);
    this.layout.debug = true;
    this.layout.layout(root);
    console.log((((((("Root calculated: x=" + ((root.calculatedX.toString()))) + " y=") + ((root.calculatedY.toString()))) + " w=") + ((root.calculatedWidth.toString()))) + " h=") + ((root.calculatedHeight.toString())));
    const beforeRender = this.renderer.getBuffer();
    const br0 = beforeRender.pixels._view.getUint8(0);
    console.log("Before renderElement - first pixel R: " + ((br0.toString())));
    console.log("");
    console.log("Rendering to raster buffer...");
    this.renderElement(root, 0.0, 0.0);
    const afterRender = this.renderer.getBuffer();
    const ar0 = afterRender.pixels._view.getUint8(0);
    console.log("After renderElement - first pixel R: " + ((ar0.toString())));
    console.log("");
    console.log("Saving PNG...");
    let outputDir = "";
    let outputFileName = this.outputFile;
    lastSlash = this.outputFile.lastIndexOf("/");
    lastBackslash = this.outputFile.lastIndexOf("\\");
    lastSep = lastSlash;
    if ( lastBackslash > lastSep ) {
      lastSep = lastBackslash;
    }
    if ( lastSep >= 0 ) {
      outputDir = this.outputFile.substring(0, (lastSep + 1) );
      outputFileName = this.outputFile.substring((lastSep + 1), (this.outputFile.length) );
    } else {
      outputDir = "./";
    }
    const finalBuf = this.renderer.getBuffer();
    const fp0 = finalBuf.pixels._view.getUint8(0);
    const fp1 = finalBuf.pixels._view.getUint8(1);
    const fp2 = finalBuf.pixels._view.getUint8(2);
    const fp3 = finalBuf.pixels._view.getUint8(3);
    console.log((((((("Before PNG encode - first pixel RGBA: " + ((fp0.toString()))) + ",") + ((fp1.toString()))) + ",") + ((fp2.toString()))) + ",") + ((fp3.toString())));
    console.log((("  Buffer size: " + ((finalBuf.width.toString()))) + "x") + ((finalBuf.height.toString())));
    const pngEncoder = new PNGEncoder();
    pngEncoder.encode(this.renderer.getBuffer(), outputDir, outputFileName);
    console.log("");
    console.log("Done!");
    console.log("Output: " + this.outputFile);
  };
  renderElement (el, offsetX, offsetY) {
    const x = el.calculatedX * this.scale;
    const y = el.calculatedY * this.scale;
    const w = el.calculatedWidth * this.scale;
    const h = el.calculatedHeight * this.scale;
    let padTop = 0.0;
    let padRight = 0.0;
    let padBottom = 0.0;
    let padLeft = 0.0;
    if ( typeof(el.paddingTop) != "undefined" ) {
      if ( el.paddingTop.isSet ) {
        padTop = el.paddingTop.pixels * this.scale;
      }
    }
    if ( typeof(el.paddingRight) != "undefined" ) {
      if ( el.paddingRight.isSet ) {
        padRight = el.paddingRight.pixels * this.scale;
      }
    }
    if ( typeof(el.paddingBottom) != "undefined" ) {
      if ( el.paddingBottom.isSet ) {
        padBottom = el.paddingBottom.pixels * this.scale;
      }
    }
    if ( typeof(el.paddingLeft) != "undefined" ) {
      if ( el.paddingLeft.isSet ) {
        padLeft = el.paddingLeft.pixels * this.scale;
      }
    }
    let radius = 0;
    if ( typeof(el.borderRadius) != "undefined" ) {
      if ( el.borderRadius.isSet ) {
        radius = Math.floor( (el.borderRadius.pixels * this.scale));
      }
    }
    if ( this.debug ) {
      console.log((((((((("Render: " + el.tagName) + " at (") + ((x.toString()))) + ", ") + ((y.toString()))) + ") size ") + ((w.toString()))) + "x") + ((h.toString())));
    }
    console.log((((((((((((("  Render: " + el.tagName) + " bg=") + ((el.backgroundColor.isSet.toString()))) + " grad=") + el.backgroundGradient) + " x=") + (((Math.floor( x)).toString()))) + " y=") + (((Math.floor( y)).toString()))) + " w=") + (((Math.floor( w)).toString()))) + " h=") + (((Math.floor( h)).toString())));
    if ( typeof(el.shadowColor) != "undefined" ) {
      if ( el.shadowColor.isSet ) {
        const shadowR = el.shadowColor.red();
        const shadowG = el.shadowColor.green();
        const shadowB = el.shadowColor.blue();
        const shadowA = Math.floor( (el.shadowColor.alpha() * 255.0));
        let blurRadius = 0;
        let shadowOffX = 0;
        let shadowOffY = 0;
        if ( typeof(el.shadowRadius) != "undefined" ) {
          if ( el.shadowRadius.isSet ) {
            blurRadius = Math.floor( (el.shadowRadius.pixels * this.scale));
          }
        }
        if ( typeof(el.shadowOffsetX) != "undefined" ) {
          if ( el.shadowOffsetX.isSet ) {
            shadowOffX = Math.floor( (el.shadowOffsetX.pixels * this.scale));
          }
        }
        if ( typeof(el.shadowOffsetY) != "undefined" ) {
          if ( el.shadowOffsetY.isSet ) {
            shadowOffY = Math.floor( (el.shadowOffsetY.pixels * this.scale));
          }
        }
        if ( w > 0.0 ) {
          if ( h > 0.0 ) {
            this.renderer.renderShadowOnly(Math.floor( x), Math.floor( y), Math.floor( w), Math.floor( h), radius, shadowR, shadowG, shadowB, shadowA, blurRadius, shadowOffX, shadowOffY);
          }
        }
      }
    }
    if ( el.backgroundGradient != "" ) {
      this.renderGradient(el, x, y, w, h, radius);
    } else {
      if ( el.backgroundColor.isSet ) {
        const bgR = el.backgroundColor.red();
        const bgG = el.backgroundColor.green();
        const bgB = el.backgroundColor.blue();
        const bgA = Math.floor( (el.backgroundColor.alpha() * 255.0));
        console.log((((((("    fillRect color: " + ((bgR.toString()))) + ",") + ((bgG.toString()))) + ",") + ((bgB.toString()))) + ",") + ((bgA.toString())));
        if ( w > 0.0 ) {
          if ( h > 0.0 ) {
            if ( radius > 0 ) {
              this.renderer.fillRoundedRect(Math.floor( x), Math.floor( y), Math.floor( w), Math.floor( h), radius, bgR, bgG, bgB, bgA);
            } else {
              this.renderer.fillRect(Math.floor( x), Math.floor( y), Math.floor( w), Math.floor( h), bgR, bgG, bgB, bgA);
            }
          }
        }
      }
    }
    if ( typeof(el.borderWidth) != "undefined" ) {
      if ( el.borderWidth.isSet ) {
        if ( typeof(el.borderColor) != "undefined" ) {
          if ( el.borderColor.isSet ) {
            const bw = Math.floor( (el.borderWidth.pixels * this.scale));
            const br = el.borderColor.red();
            const bg = el.borderColor.green();
            const bb = el.borderColor.blue();
            const ba = Math.floor( (el.borderColor.alpha() * 255.0));
            if ( w > 0.0 ) {
              if ( h > 0.0 ) {
                if ( radius > 0 ) {
                  this.renderer.drawRoundedRect(Math.floor( x), Math.floor( y), Math.floor( w), Math.floor( h), radius, br, bg, bb, ba);
                } else {
                  this.renderer.drawRect(Math.floor( x), Math.floor( y), Math.floor( w), Math.floor( h), br, bg, bb, ba);
                }
              }
            }
          }
        }
      }
    }
    if ( el.textContent != "" ) {
      this.renderText(el, x, y, w, h, padLeft, padTop);
    }
    for ( let i = 0; i < el.children.length; i++) {
      var child = el.children[i];
      this.renderElement(child, 0.0, 0.0);
    };
  };
  renderGradient (el, x, y, w, h, radius) {
    const grad = el.gradient;
    console.log((((("    renderGradient: isSet=" + ((grad.isSet.toString()))) + " isLinear=") + ((grad.isLinear.toString()))) + " stops=") + ((grad.getStopCount().toString())));
    if ( grad.isSet == false ) {
      console.log("    NO GRADIENT - returning");
      return;
    }
    const startColor = grad.getStartColor();
    const endColor = grad.getEndColor();
    const r1 = startColor.red();
    const g1 = startColor.green();
    const b1 = startColor.blue();
    const r2 = endColor.red();
    const g2 = endColor.green();
    const b2 = endColor.blue();
    if ( grad.isLinear ) {
      const angle = grad.angle;
      if ( radius > 0 ) {
        this.renderer.renderLinearGradientRoundedRect(Math.floor( x), Math.floor( y), Math.floor( w), Math.floor( h), radius, angle, r1, g1, b1, r2, g2, b2);
      } else {
        this.renderer.renderLinearGradientRect(Math.floor( x), Math.floor( y), Math.floor( w), Math.floor( h), angle, r1, g1, b1, r2, g2, b2);
      }
    } else {
      this.renderer.renderRadialGradientRoundedRect(Math.floor( x), Math.floor( y), Math.floor( w), Math.floor( h), radius, r1, g1, b1, r2, g2, b2);
    }
  };
  renderText (el, x, y, w, h, padLeft, padTop) {
    let textR = 0;
    let textG = 0;
    let textB = 0;
    let textA = 255;
    if ( el.color.isSet ) {
      textR = el.color.red();
      textG = el.color.green();
      textB = el.color.blue();
      textA = Math.floor( (el.color.alpha() * 255.0));
    }
    let fontSize = 14.0 * this.scale;
    if ( typeof(el.fontSize) != "undefined" ) {
      if ( el.fontSize.isSet ) {
        fontSize = el.fontSize.pixels * this.scale;
      }
    }
    if ( fontSize < 1.0 ) {
      fontSize = 14.0 * this.scale;
    }
    const fontName = "Open Sans";
    if ( el.fontWeight == "bold" ) {
      const boldFont = this.fontManager.getFont("Open Sans Bold");
      if ( boldFont.unitsPerEm > 0 ) {
        this.textRenderer.setFont(boldFont);
      }
    } else {
      const regularFont = this.fontManager.getFont("Open Sans");
      if ( regularFont.unitsPerEm > 0 ) {
        this.textRenderer.setFont(regularFont);
      }
    }
    let hasShadow = false;
    if ( typeof(el.shadowColor) != "undefined" ) {
      if ( el.shadowColor.isSet ) {
        hasShadow = true;
      }
    }
    if ( hasShadow ) {
      const shadowR = el.shadowColor.red();
      const shadowG = el.shadowColor.green();
      const shadowB = el.shadowColor.blue();
      const shadowA = Math.floor( (el.shadowColor.alpha() * 255.0));
      let blurRadius = 0;
      let shadowOffX = 0.0;
      let shadowOffY = 0.0;
      if ( typeof(el.shadowRadius) != "undefined" ) {
        if ( el.shadowRadius.isSet ) {
          blurRadius = Math.floor( (el.shadowRadius.pixels * this.scale));
        }
      }
      if ( typeof(el.shadowOffsetX) != "undefined" ) {
        if ( el.shadowOffsetX.isSet ) {
          shadowOffX = el.shadowOffsetX.pixels * this.scale;
        }
      }
      if ( typeof(el.shadowOffsetY) != "undefined" ) {
        if ( el.shadowOffsetY.isSet ) {
          shadowOffY = el.shadowOffsetY.pixels * this.scale;
        }
      }
      this.textRenderer.renderTextWithShadow(this.renderer.getBuffer(), el.textContent, x + padLeft, y + padTop, fontSize, textR, textG, textB, textA, shadowR, shadowG, shadowB, shadowA, shadowOffX, shadowOffY, blurRadius);
    } else {
      this.textRenderer.renderText(this.renderer.getBuffer(), el.textContent, x + padLeft, y + padTop, fontSize, textR, textG, textB, textA);
    }
  };
}
/* static JavaSript main routine at the end of the JS file */
function __js_main() {
  const tool = new EVGPNGTool();
  tool.run();
}
__js_main();
