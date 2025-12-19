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
        let isAsync = false;
        let currVal = this.peekValue();
        let nextType = this.peekNextType();
        let nextVal = this.peekNextValue();
        if ( currVal == "async" ) {
          if ( ((nextType == "Identifier") || (nextVal == "[")) || (nextVal == "(") ) {
            this.advance();
            isAsync = true;
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
EVGUnit.pixels = function(val) {
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
    this.display = "block";     /** note: unused */
    this.flex = 0.0;
    this.flexDirection = "column";
    this.justifyContent = "flex-start";
    this.alignItems = "flex-start";
    this.position = "relative";     /** note: unused */
    this.src = "";
    this.alt = "";     /** note: unused */
    this.className = "";
    this.rotate = 0.0;
    this.scale = 1.0;
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
    this.fontSize = EVGUnit.pixels(14.0);
    this.shadowRadius = EVGUnit.unset();
    this.shadowColor = EVGColor.noColor();
    this.shadowOffsetX = EVGUnit.unset();
    this.shadowOffsetY = EVGUnit.unset();
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
    const buf = this.currentChunk.data;
    const pos = this.currentChunk.used;
    buf._view.setUint8(pos, b);
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
      const chunkData = chunk.data;
      const chunkUsed = chunk.used;
      let i = 0;
      while (i < chunkUsed) {
        const b = chunkData._view.getUint8(i);
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
      const chunkData = chunk.data;
      const chunkUsed = chunk.used;
      let i = 0;
      while (i < chunkUsed) {
        const b = chunkData._view.getUint8(i);
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
class JPEGImage  {
  constructor() {
    this.width = 0;
    this.height = 0;
    this.colorComponents = 3;
    this.bitsPerComponent = 8;
    this.isValid = false;
    this.errorMessage = "";
  }
}
class JPEGReader  {
  constructor() {
  }
  readUint16BE (data, offset) {
    const high = data._view.getUint8(offset);
    const low = data._view.getUint8((offset + 1));
    return (high * 256) + low;
  };
  readJPEG (dirPath, fileName) {
    const result = new JPEGImage();
    const data = (function(){ var b = require('fs').readFileSync(dirPath + '/' + fileName); var ab = new ArrayBuffer(b.length); var v = new Uint8Array(ab); for(var i=0;i<b.length;i++)v[i]=b[i]; ab._view = new DataView(ab); return ab; })();
    const dataLen = data.byteLength;
    if ( dataLen < 4 ) {
      result.errorMessage = "File too small to be a valid JPEG";
      return result;
    }
    const marker1 = data._view.getUint8(0);
    const marker2 = data._view.getUint8(1);
    if ( (marker1 != 255) || (marker2 != 216) ) {
      result.errorMessage = "Invalid JPEG signature - expected FFD8";
      return result;
    }
    let pos = 2;
    let foundSOF = false;
    while ((pos < (dataLen - 2)) && (foundSOF == false)) {
      const m1 = data._view.getUint8(pos);
      if ( m1 != 255 ) {
        pos = pos + 1;
      } else {
        const m2 = data._view.getUint8((pos + 1));
        if ( m2 == 255 ) {
          pos = pos + 1;
        } else {
          if ( m2 == 0 ) {
            pos = pos + 2;
          } else {
            if ( ((m2 == 192) || (m2 == 193)) || (m2 == 194) ) {
              if ( (pos + 9) < dataLen ) {
                result.bitsPerComponent = data._view.getUint8((pos + 4));
                result.height = this.readUint16BE(data, (pos + 5));
                result.width = this.readUint16BE(data, (pos + 7));
                result.colorComponents = data._view.getUint8((pos + 9));
                foundSOF = true;
              }
            } else {
              if ( m2 == 217 ) {
                pos = dataLen;
              } else {
                if ( m2 == 218 ) {
                  pos = dataLen;
                } else {
                  if ( (pos + 4) < dataLen ) {
                    const segLen = this.readUint16BE(data, (pos + 2));
                    pos = (pos + 2) + segLen;
                  } else {
                    pos = dataLen;
                  }
                }
              }
            }
          }
        }
      }
    };
    if ( foundSOF == false ) {
      result.errorMessage = "Could not find SOF marker in JPEG";
      return result;
    }
    result.imageData = data;
    result.isValid = true;
    return result;
  };
  getImageInfo (img) {
    if ( img.isValid == false ) {
      return "Invalid JPEG: " + img.errorMessage;
    }
    return ((((((("JPEG: " + ((img.width.toString()))) + "x") + ((img.height.toString()))) + " pixels, ") + ((img.colorComponents.toString()))) + " components, ") + ((img.bitsPerComponent.toString()))) + " bits";
  };
}
class ExifTag  {
  constructor() {
    this.tagId = 0;
    this.tagName = "";
    this.tagValue = "";
    this.dataType = 0;
  }
}
class JPEGMetadataInfo  {
  constructor() {
    this.isValid = false;
    this.errorMessage = "";
    this.hasJFIF = false;
    this.jfifVersion = "";
    this.densityUnits = 0;
    this.xDensity = 0;
    this.yDensity = 0;
    this.width = 0;
    this.height = 0;
    this.colorComponents = 0;
    this.bitsPerComponent = 0;
    this.hasExif = false;
    this.cameraMake = "";
    this.cameraModel = "";
    this.software = "";
    this.dateTime = "";
    this.dateTimeOriginal = "";
    this.exposureTime = "";
    this.fNumber = "";
    this.isoSpeed = "";
    this.focalLength = "";
    this.flash = "";
    this.orientation = 1;
    this.xResolution = "";
    this.yResolution = "";
    this.resolutionUnit = 0;
    this.hasGPS = false;
    this.gpsLatitude = "";
    this.gpsLongitude = "";
    this.gpsAltitude = "";
    this.gpsLatitudeRef = "";
    this.gpsLongitudeRef = "";
    this.hasComment = false;
    this.comment = "";
    this.exifTags = [];
  }
}
class JPEGMetadataParser  {
  constructor() {
    this.data = (function(){ var b = new ArrayBuffer(0); b._view = new DataView(b); return b; })();
    this.dataLen = 0;
    this.littleEndian = false;
  }
  readUint16BE (offset) {
    const high = this.data._view.getUint8(offset);
    const low = this.data._view.getUint8((offset + 1));
    return (high * 256) + low;
  };
  readUint16 (offset) {
    let result = 0;
    if ( this.littleEndian ) {
      const low = this.data._view.getUint8(offset);
      const high = this.data._view.getUint8((offset + 1));
      result = (high * 256) + low;
    } else {
      const high_1 = this.data._view.getUint8(offset);
      const low_1 = this.data._view.getUint8((offset + 1));
      result = (high_1 * 256) + low_1;
    }
    return result;
  };
  readUint32 (offset) {
    let result = 0;
    if ( this.littleEndian ) {
      const b0 = this.data._view.getUint8(offset);
      const b1 = this.data._view.getUint8((offset + 1));
      const b2 = this.data._view.getUint8((offset + 2));
      const b3 = this.data._view.getUint8((offset + 3));
      result = (((b3 * 16777216) + (b2 * 65536)) + (b1 * 256)) + b0;
    } else {
      const b0_1 = this.data._view.getUint8(offset);
      const b1_1 = this.data._view.getUint8((offset + 1));
      const b2_1 = this.data._view.getUint8((offset + 2));
      const b3_1 = this.data._view.getUint8((offset + 3));
      result = (((b0_1 * 16777216) + (b1_1 * 65536)) + (b2_1 * 256)) + b3_1;
    }
    return result;
  };
  readString (offset, length) {
    let result = "";
    let i = 0;
    while (i < length) {
      const b = this.data._view.getUint8((offset + i));
      if ( b == 0 ) {
        return result;
      }
      result = result + (String.fromCharCode(b));
      i = i + 1;
    };
    return result;
  };
  getTagName (tagId, ifdType) {
    if ( ifdType == 2 ) {
      if ( tagId == 0 ) {
        return "GPSVersionID";
      }
      if ( tagId == 1 ) {
        return "GPSLatitudeRef";
      }
      if ( tagId == 2 ) {
        return "GPSLatitude";
      }
      if ( tagId == 3 ) {
        return "GPSLongitudeRef";
      }
      if ( tagId == 4 ) {
        return "GPSLongitude";
      }
      if ( tagId == 5 ) {
        return "GPSAltitudeRef";
      }
      if ( tagId == 6 ) {
        return "GPSAltitude";
      }
      return "GPS_" + ((tagId.toString()));
    }
    if ( tagId == 256 ) {
      return "ImageWidth";
    }
    if ( tagId == 257 ) {
      return "ImageHeight";
    }
    if ( tagId == 258 ) {
      return "BitsPerSample";
    }
    if ( tagId == 259 ) {
      return "Compression";
    }
    if ( tagId == 262 ) {
      return "PhotometricInterpretation";
    }
    if ( tagId == 270 ) {
      return "ImageDescription";
    }
    if ( tagId == 271 ) {
      return "Make";
    }
    if ( tagId == 272 ) {
      return "Model";
    }
    if ( tagId == 274 ) {
      return "Orientation";
    }
    if ( tagId == 282 ) {
      return "XResolution";
    }
    if ( tagId == 283 ) {
      return "YResolution";
    }
    if ( tagId == 296 ) {
      return "ResolutionUnit";
    }
    if ( tagId == 305 ) {
      return "Software";
    }
    if ( tagId == 306 ) {
      return "DateTime";
    }
    if ( tagId == 315 ) {
      return "Artist";
    }
    if ( tagId == 33432 ) {
      return "Copyright";
    }
    if ( tagId == 33434 ) {
      return "ExposureTime";
    }
    if ( tagId == 33437 ) {
      return "FNumber";
    }
    if ( tagId == 34850 ) {
      return "ExposureProgram";
    }
    if ( tagId == 34855 ) {
      return "ISOSpeedRatings";
    }
    if ( tagId == 36864 ) {
      return "ExifVersion";
    }
    if ( tagId == 36867 ) {
      return "DateTimeOriginal";
    }
    if ( tagId == 36868 ) {
      return "DateTimeDigitized";
    }
    if ( tagId == 37377 ) {
      return "ShutterSpeedValue";
    }
    if ( tagId == 37378 ) {
      return "ApertureValue";
    }
    if ( tagId == 37380 ) {
      return "ExposureBiasValue";
    }
    if ( tagId == 37381 ) {
      return "MaxApertureValue";
    }
    if ( tagId == 37383 ) {
      return "MeteringMode";
    }
    if ( tagId == 37384 ) {
      return "LightSource";
    }
    if ( tagId == 37385 ) {
      return "Flash";
    }
    if ( tagId == 37386 ) {
      return "FocalLength";
    }
    if ( tagId == 37500 ) {
      return "MakerNote";
    }
    if ( tagId == 37510 ) {
      return "UserComment";
    }
    if ( tagId == 40960 ) {
      return "FlashpixVersion";
    }
    if ( tagId == 40961 ) {
      return "ColorSpace";
    }
    if ( tagId == 40962 ) {
      return "PixelXDimension";
    }
    if ( tagId == 40963 ) {
      return "PixelYDimension";
    }
    if ( tagId == 41486 ) {
      return "FocalPlaneXResolution";
    }
    if ( tagId == 41487 ) {
      return "FocalPlaneYResolution";
    }
    if ( tagId == 41488 ) {
      return "FocalPlaneResolutionUnit";
    }
    if ( tagId == 41495 ) {
      return "SensingMethod";
    }
    if ( tagId == 41728 ) {
      return "FileSource";
    }
    if ( tagId == 41729 ) {
      return "SceneType";
    }
    if ( tagId == 41985 ) {
      return "CustomRendered";
    }
    if ( tagId == 41986 ) {
      return "ExposureMode";
    }
    if ( tagId == 41987 ) {
      return "WhiteBalance";
    }
    if ( tagId == 41988 ) {
      return "DigitalZoomRatio";
    }
    if ( tagId == 41989 ) {
      return "FocalLengthIn35mmFilm";
    }
    if ( tagId == 41990 ) {
      return "SceneCaptureType";
    }
    if ( tagId == 34665 ) {
      return "ExifIFDPointer";
    }
    if ( tagId == 34853 ) {
      return "GPSInfoIFDPointer";
    }
    return "Tag_" + ((tagId.toString()));
  };
  formatRational (offset) {
    const numerator = this.readUint32(offset);
    const denominator = this.readUint32((offset + 4));
    if ( denominator == 0 ) {
      return (numerator.toString());
    }
    if ( denominator == 1 ) {
      return (numerator.toString());
    }
    return (((numerator.toString())) + "/") + ((denominator.toString()));
  };
  formatGPSCoordinate (offset, ref) {
    const degNum = this.readUint32(offset);
    const degDen = this.readUint32((offset + 4));
    const minNum = this.readUint32((offset + 8));
    const minDen = this.readUint32((offset + 12));
    const secNum = this.readUint32((offset + 16));
    const secDen = this.readUint32((offset + 20));
    let degrees = 0;
    if ( degDen > 0 ) {
      let tempDeg = degNum;
      while (tempDeg >= degDen) {
        tempDeg = tempDeg - degDen;
        degrees = degrees + 1;
      };
    }
    let minutes = 0;
    if ( minDen > 0 ) {
      let tempMin = minNum;
      while (tempMin >= minDen) {
        tempMin = tempMin - minDen;
        minutes = minutes + 1;
      };
    }
    let seconds = "0";
    if ( secDen > 0 ) {
      let secWhole = 0;
      let tempSec = secNum;
      while (tempSec >= secDen) {
        tempSec = tempSec - secDen;
        secWhole = secWhole + 1;
      };
      const secRem = tempSec;
      if ( secRem > 0 ) {
        let decPartTemp = secRem * 100;
        let decPart = 0;
        while (decPartTemp >= secDen) {
          decPartTemp = decPartTemp - secDen;
          decPart = decPart + 1;
        };
        if ( decPart < 10 ) {
          seconds = (((secWhole.toString())) + ".0") + ((decPart.toString()));
        } else {
          seconds = (((secWhole.toString())) + ".") + ((decPart.toString()));
        }
      } else {
        seconds = (secWhole.toString());
      }
    }
    return (((((((degrees.toString())) + "° ") + ((minutes.toString()))) + "' ") + seconds) + "\" ") + ref;
  };
  parseIFD (info, tiffStart, ifdOffset, ifdType) {
    let pos = tiffStart + ifdOffset;
    if ( (pos + 2) > this.dataLen ) {
      return;
    }
    const numEntries = this.readUint16(pos);
    pos = pos + 2;
    let i = 0;
    while (i < numEntries) {
      if ( (pos + 12) > this.dataLen ) {
        return;
      }
      const tagId = this.readUint16(pos);
      const dataType = this.readUint16((pos + 2));
      const numValues = this.readUint32((pos + 4));
      let valueOffset = pos + 8;
      let dataSize = 0;
      if ( dataType == 1 ) {
        dataSize = numValues;
      }
      if ( dataType == 2 ) {
        dataSize = numValues;
      }
      if ( dataType == 3 ) {
        dataSize = numValues * 2;
      }
      if ( dataType == 4 ) {
        dataSize = numValues * 4;
      }
      if ( dataType == 5 ) {
        dataSize = numValues * 8;
      }
      if ( dataType == 7 ) {
        dataSize = numValues;
      }
      if ( dataType == 9 ) {
        dataSize = numValues * 4;
      }
      if ( dataType == 10 ) {
        dataSize = numValues * 8;
      }
      if ( dataSize > 4 ) {
        valueOffset = tiffStart + this.readUint32((pos + 8));
      }
      const tagName = this.getTagName(tagId, ifdType);
      let tagValue = "";
      if ( dataType == 2 ) {
        tagValue = this.readString(valueOffset, numValues);
      }
      if ( dataType == 3 ) {
        if ( dataSize <= 4 ) {
          tagValue = (this.readUint16((pos + 8)).toString());
        } else {
          tagValue = (this.readUint16(valueOffset).toString());
        }
      }
      if ( dataType == 4 ) {
        if ( dataSize <= 4 ) {
          tagValue = (this.readUint32((pos + 8)).toString());
        } else {
          tagValue = (this.readUint32(valueOffset).toString());
        }
      }
      if ( dataType == 5 ) {
        tagValue = this.formatRational(valueOffset);
      }
      const tag = new ExifTag();
      tag.tagId = tagId;
      tag.tagName = tagName;
      tag.tagValue = tagValue;
      tag.dataType = dataType;
      info.exifTags.push(tag);
      if ( tagId == 271 ) {
        info.cameraMake = tagValue;
      }
      if ( tagId == 272 ) {
        info.cameraModel = tagValue;
      }
      if ( tagId == 305 ) {
        info.software = tagValue;
      }
      if ( tagId == 306 ) {
        info.dateTime = tagValue;
      }
      if ( tagId == 274 ) {
        info.orientation = this.readUint16((pos + 8));
      }
      if ( tagId == 282 ) {
        info.xResolution = tagValue;
      }
      if ( tagId == 283 ) {
        info.yResolution = tagValue;
      }
      if ( tagId == 296 ) {
        info.resolutionUnit = this.readUint16((pos + 8));
      }
      if ( tagId == 36867 ) {
        info.dateTimeOriginal = tagValue;
      }
      if ( tagId == 33434 ) {
        info.exposureTime = tagValue;
      }
      if ( tagId == 33437 ) {
        info.fNumber = tagValue;
      }
      if ( tagId == 34855 ) {
        info.isoSpeed = tagValue;
      }
      if ( tagId == 37386 ) {
        info.focalLength = tagValue;
      }
      if ( tagId == 37385 ) {
        const flashVal = this.readUint16((pos + 8));
        if ( (flashVal % 2) == 1 ) {
          info.flash = "Fired";
        } else {
          info.flash = "Did not fire";
        }
      }
      if ( tagId == 34665 ) {
        const exifOffset = this.readUint32((pos + 8));
        this.parseIFD(info, tiffStart, exifOffset, 1);
      }
      if ( tagId == 34853 ) {
        info.hasGPS = true;
        const gpsOffset = this.readUint32((pos + 8));
        this.parseIFD(info, tiffStart, gpsOffset, 2);
      }
      if ( ifdType == 2 ) {
        if ( tagId == 1 ) {
          info.gpsLatitudeRef = tagValue;
        }
        if ( tagId == 2 ) {
          info.gpsLatitude = this.formatGPSCoordinate(valueOffset, info.gpsLatitudeRef);
        }
        if ( tagId == 3 ) {
          info.gpsLongitudeRef = tagValue;
        }
        if ( tagId == 4 ) {
          info.gpsLongitude = this.formatGPSCoordinate(valueOffset, info.gpsLongitudeRef);
        }
        if ( tagId == 6 ) {
          const altNum = this.readUint32(valueOffset);
          const altDen = this.readUint32((valueOffset + 4));
          if ( altDen > 0 ) {
            let altWhole = 0;
            let tempAlt = altNum;
            while (tempAlt >= altDen) {
              tempAlt = tempAlt - altDen;
              altWhole = altWhole + 1;
            };
            const altRem = tempAlt;
            if ( altRem > 0 ) {
              let altDecTemp = altRem * 10;
              let altDec = 0;
              while (altDecTemp >= altDen) {
                altDecTemp = altDecTemp - altDen;
                altDec = altDec + 1;
              };
              info.gpsAltitude = ((((altWhole.toString())) + ".") + ((altDec.toString()))) + " m";
            } else {
              info.gpsAltitude = ((altWhole.toString())) + " m";
            }
          } else {
            info.gpsAltitude = ((altNum.toString())) + " m";
          }
        }
      }
      pos = pos + 12;
      i = i + 1;
    };
  };
  parseExif (info, appStart, appLen) {
    const header = this.readString(appStart, 4);
    if ( header != "Exif" ) {
      return;
    }
    info.hasExif = true;
    const tiffStart = appStart + 6;
    const byteOrder0 = this.data._view.getUint8(tiffStart);
    const byteOrder1 = this.data._view.getUint8((tiffStart + 1));
    if ( (byteOrder0 == 73) && (byteOrder1 == 73) ) {
      this.littleEndian = true;
    } else {
      if ( (byteOrder0 == 77) && (byteOrder1 == 77) ) {
        this.littleEndian = false;
      } else {
        return;
      }
    }
    const magic = this.readUint16((tiffStart + 2));
    if ( magic != 42 ) {
      return;
    }
    const ifd0Offset = this.readUint32((tiffStart + 4));
    this.parseIFD(info, tiffStart, ifd0Offset, 0);
  };
  parseJFIF (info, appStart, appLen) {
    const header = this.readString(appStart, 4);
    if ( header != "JFIF" ) {
      return;
    }
    info.hasJFIF = true;
    const verMajor = this.data._view.getUint8((appStart + 5));
    const verMinor = this.data._view.getUint8((appStart + 6));
    info.jfifVersion = (((verMajor.toString())) + ".") + ((verMinor.toString()));
    info.densityUnits = this.data._view.getUint8((appStart + 7));
    info.xDensity = this.readUint16BE((appStart + 8));
    info.yDensity = this.readUint16BE((appStart + 10));
  };
  parseComment (info, appStart, appLen) {
    info.hasComment = true;
    info.comment = this.readString(appStart, appLen);
  };
  parseMetadata (dirPath, fileName) {
    const info = new JPEGMetadataInfo();
    this.data = (function(){ var b = require('fs').readFileSync(dirPath + '/' + fileName); var ab = new ArrayBuffer(b.length); var v = new Uint8Array(ab); for(var i=0;i<b.length;i++)v[i]=b[i]; ab._view = new DataView(ab); return ab; })();
    this.dataLen = this.data.byteLength;
    if ( this.dataLen < 4 ) {
      info.errorMessage = "File too small";
      return info;
    }
    const m1 = this.data._view.getUint8(0);
    const m2 = this.data._view.getUint8(1);
    if ( (m1 != 255) || (m2 != 216) ) {
      info.errorMessage = "Not a valid JPEG file";
      return info;
    }
    info.isValid = true;
    let pos = 2;
    while (pos < this.dataLen) {
      const marker1 = this.data._view.getUint8(pos);
      if ( marker1 != 255 ) {
        pos = pos + 1;
        continue;
      }
      const marker2 = this.data._view.getUint8((pos + 1));
      if ( marker2 == 255 ) {
        pos = pos + 1;
        continue;
      }
      if ( (marker2 == 216) || (marker2 == 217) ) {
        pos = pos + 2;
        continue;
      }
      if ( (marker2 >= 208) && (marker2 <= 215) ) {
        pos = pos + 2;
        continue;
      }
      if ( (pos + 4) > this.dataLen ) {
        return info;
      }
      const segLen = this.readUint16BE((pos + 2));
      const segStart = pos + 4;
      if ( marker2 == 224 ) {
        this.parseJFIF(info, segStart, segLen - 2);
      }
      if ( marker2 == 225 ) {
        this.parseExif(info, segStart, segLen - 2);
      }
      if ( marker2 == 254 ) {
        this.parseComment(info, segStart, segLen - 2);
      }
      if ( (marker2 == 192) || (marker2 == 194) ) {
        if ( (pos + 9) < this.dataLen ) {
          info.bitsPerComponent = this.data._view.getUint8((pos + 4));
          info.height = this.readUint16BE((pos + 5));
          info.width = this.readUint16BE((pos + 7));
          info.colorComponents = this.data._view.getUint8((pos + 9));
        }
      }
      if ( marker2 == 218 ) {
        return info;
      }
      if ( marker2 == 217 ) {
        return info;
      }
      pos = (pos + 2) + segLen;
    };
    return info;
  };
  formatMetadata (info) {
    const out = new GrowableBuffer();
    out.writeString("=== JPEG Metadata ===\n\n");
    if ( info.isValid == false ) {
      out.writeString(("Error: " + info.errorMessage) + "\n");
      return (out).toString();
    }
    out.writeString("--- Image Info ---\n");
    out.writeString(((("  Dimensions: " + ((info.width.toString()))) + " x ") + ((info.height.toString()))) + "\n");
    out.writeString(("  Color Components: " + ((info.colorComponents.toString()))) + "\n");
    out.writeString(("  Bits per Component: " + ((info.bitsPerComponent.toString()))) + "\n");
    if ( info.hasJFIF ) {
      out.writeString("\n--- JFIF Info ---\n");
      out.writeString(("  Version: " + info.jfifVersion) + "\n");
      let densityStr = "No units (aspect ratio)";
      if ( info.densityUnits == 1 ) {
        densityStr = "pixels/inch";
      }
      if ( info.densityUnits == 2 ) {
        densityStr = "pixels/cm";
      }
      out.writeString(((((("  Density: " + ((info.xDensity.toString()))) + " x ") + ((info.yDensity.toString()))) + " ") + densityStr) + "\n");
    }
    if ( info.hasExif ) {
      out.writeString("\n--- EXIF Info ---\n");
      if ( (info.cameraMake.length) > 0 ) {
        out.writeString(("  Camera Make: " + info.cameraMake) + "\n");
      }
      if ( (info.cameraModel.length) > 0 ) {
        out.writeString(("  Camera Model: " + info.cameraModel) + "\n");
      }
      if ( (info.software.length) > 0 ) {
        out.writeString(("  Software: " + info.software) + "\n");
      }
      if ( (info.dateTimeOriginal.length) > 0 ) {
        out.writeString(("  Date/Time Original: " + info.dateTimeOriginal) + "\n");
      } else {
        if ( (info.dateTime.length) > 0 ) {
          out.writeString(("  Date/Time: " + info.dateTime) + "\n");
        }
      }
      if ( (info.exposureTime.length) > 0 ) {
        out.writeString(("  Exposure Time: " + info.exposureTime) + " sec\n");
      }
      if ( (info.fNumber.length) > 0 ) {
        out.writeString(("  F-Number: f/" + info.fNumber) + "\n");
      }
      if ( (info.isoSpeed.length) > 0 ) {
        out.writeString(("  ISO Speed: " + info.isoSpeed) + "\n");
      }
      if ( (info.focalLength.length) > 0 ) {
        out.writeString(("  Focal Length: " + info.focalLength) + " mm\n");
      }
      if ( (info.flash.length) > 0 ) {
        out.writeString(("  Flash: " + info.flash) + "\n");
      }
      let orientStr = "Normal";
      if ( info.orientation == 2 ) {
        orientStr = "Flip horizontal";
      }
      if ( info.orientation == 3 ) {
        orientStr = "Rotate 180";
      }
      if ( info.orientation == 4 ) {
        orientStr = "Flip vertical";
      }
      if ( info.orientation == 5 ) {
        orientStr = "Transpose";
      }
      if ( info.orientation == 6 ) {
        orientStr = "Rotate 90 CW";
      }
      if ( info.orientation == 7 ) {
        orientStr = "Transverse";
      }
      if ( info.orientation == 8 ) {
        orientStr = "Rotate 270 CW";
      }
      out.writeString(("  Orientation: " + orientStr) + "\n");
    }
    if ( info.hasGPS ) {
      out.writeString("\n--- GPS Info ---\n");
      if ( (info.gpsLatitude.length) > 0 ) {
        out.writeString(("  Latitude: " + info.gpsLatitude) + "\n");
      }
      if ( (info.gpsLongitude.length) > 0 ) {
        out.writeString(("  Longitude: " + info.gpsLongitude) + "\n");
      }
      if ( (info.gpsAltitude.length) > 0 ) {
        out.writeString(("  Altitude: " + info.gpsAltitude) + "\n");
      }
    }
    if ( info.hasComment ) {
      out.writeString("\n--- Comment ---\n");
      out.writeString(("  " + info.comment) + "\n");
    }
    const tagCount = info.exifTags.length;
    if ( tagCount > 0 ) {
      out.writeString(("\n--- All EXIF Tags (" + ((tagCount.toString()))) + ") ---\n");
      for ( let idx = 0; idx < info.exifTags.length; idx++) {
        var tag = info.exifTags[idx];
        out.writeString(("  " + tag.tagName) + " (0x");
        let tagHex = "";
        const tid = tag.tagId;
        const hexChars = "0123456789ABCDEF";
        const h3D = tid / 4096;
        const h3 = Math.floor( h3D);
        const r3 = tid - (h3 * 4096);
        const h2D = r3 / 256;
        const h2 = Math.floor( h2D);
        const r2 = r3 - (h2 * 256);
        const h1D = r2 / 16;
        const h1 = Math.floor( h1D);
        const h0 = r2 - (h1 * 16);
        tagHex = (((hexChars.substring(h3, (h3 + 1) )) + (hexChars.substring(h2, (h2 + 1) ))) + (hexChars.substring(h1, (h1 + 1) ))) + (hexChars.substring(h0, (h0 + 1) ));
        out.writeString(((tagHex + "): ") + tag.tagValue) + "\n");
      };
    }
    return (out).toString();
  };
}
class JPEGMetadataMain  {
  constructor() {
  }
}
class PDFWriter  {
  constructor() {
    this.nextObjNum = 1;
    this.objectOffsets = [];
    this.imageObjNum = 0;
    const buf = new GrowableBuffer();
    this.pdfBuffer = buf;
    const reader = new JPEGReader();
    this.jpegReader = reader;
    const parser = new JPEGMetadataParser();
    this.metadataParser = parser;
  }
  writeObject (content) {
    const buf = this.pdfBuffer;
    this.objectOffsets.push((buf).size());
    buf.writeString(((this.nextObjNum.toString())) + " 0 obj\n");
    buf.writeString(content);
    buf.writeString("\nendobj\n\n");
    this.nextObjNum = this.nextObjNum + 1;
  };
  writeObjectGetNum (content) {
    const objNum = this.nextObjNum;
    this.writeObject(content);
    return objNum;
  };
  writeImageObject (header, imageData, footer) {
    const buf = this.pdfBuffer;
    this.objectOffsets.push((buf).size());
    buf.writeString(((this.nextObjNum.toString())) + " 0 obj\n");
    buf.writeString(header);
    buf.writeBuffer(imageData);
    buf.writeString(footer);
    buf.writeString("\nendobj\n\n");
    const objNum = this.nextObjNum;
    this.nextObjNum = this.nextObjNum + 1;
    return objNum;
  };
  addJPEGImage (dirPath, fileName) {
    const reader = this.jpegReader;
    const img = reader.readJPEG(dirPath, fileName);
    if ( img.isValid == false ) {
      console.log("Error loading image: " + img.errorMessage);
      return 0;
    }
    console.log(reader.getImageInfo(img));
    const parser = this.metadataParser;
    const meta = parser.parseMetadata(dirPath, fileName);
    this.lastImageMetadata = meta;
    let colorSpace = "/DeviceRGB";
    if ( img.colorComponents == 1 ) {
      colorSpace = "/DeviceGray";
    }
    if ( img.colorComponents == 4 ) {
      colorSpace = "/DeviceCMYK";
    }
    const imgData = img.imageData;
    const dataLen = imgData.byteLength;
    let imgHeader = "<< /Type /XObject /Subtype /Image";
    imgHeader = (imgHeader + " /Width ") + ((img.width.toString()));
    imgHeader = (imgHeader + " /Height ") + ((img.height.toString()));
    imgHeader = (imgHeader + " /ColorSpace ") + colorSpace;
    imgHeader = (imgHeader + " /BitsPerComponent ") + ((img.bitsPerComponent.toString()));
    imgHeader = imgHeader + " /Filter /DCTDecode";
    imgHeader = (imgHeader + " /Length ") + ((dataLen.toString()));
    imgHeader = imgHeader + " >>\nstream\n";
    const imgFooter = "\nendstream";
    this.imageObjNum = this.writeImageObject(imgHeader, imgData, imgFooter);
    return this.imageObjNum;
  };
  escapeText (text) {
    let result = "";
    const __len = text.length;
    let i = 0;
    while (i < __len) {
      const ch = text.charCodeAt(i );
      if ( ch == 40 ) {
        result = result + "\\(";
      } else {
        if ( ch == 41 ) {
          result = result + "\\)";
        } else {
          if ( ch == 92 ) {
            result = result + "\\\\";
          } else {
            result = result + (String.fromCharCode(ch));
          }
        }
      }
      i = i + 1;
    };
    return result;
  };
  createHelloWorldPDF (message) {
    return this.createPDFWithImage(message, "", "");
  };
  createPDFWithImage (message, imageDirPath, imageFileName) {
    this.nextObjNum = 1;
    const buf = this.pdfBuffer;
    (buf).clear();
    this.imageObjNum = 0;
    this.objectOffsets.length = 0;
    buf.writeString("%PDF-1.4\n");
    buf.writeByte(37);
    buf.writeByte(226);
    buf.writeByte(227);
    buf.writeByte(207);
    buf.writeByte(211);
    buf.writeByte(10);
    let hasImage = (imageFileName.length) > 0;
    if ( hasImage ) {
      const imgNum = this.addJPEGImage(imageDirPath, imageFileName);
      if ( imgNum == 0 ) {
        hasImage = false;
      }
    }
    const catalogObjNum = this.nextObjNum;
    const pagesObjNum = this.nextObjNum + 1;
    this.writeObject(("<< /Type /Catalog /Pages " + ((pagesObjNum.toString()))) + " 0 R >>");
    const pageObjNum = this.nextObjNum + 1;
    this.writeObject(("<< /Type /Pages /Kids [" + ((pageObjNum.toString()))) + " 0 R] /Count 1 >>");
    const contentObjNum = this.nextObjNum + 1;
    const fontObjNum = this.nextObjNum + 2;
    let resourcesStr = ("<< /Font << /F1 " + ((fontObjNum.toString()))) + " 0 R >>";
    if ( hasImage ) {
      resourcesStr = ((resourcesStr + " /XObject << /Img1 ") + ((this.imageObjNum.toString()))) + " 0 R >>";
    }
    resourcesStr = resourcesStr + " >>";
    this.writeObject(((((("<< /Type /Page /Parent " + ((pagesObjNum.toString()))) + " 0 R /MediaBox [0 0 612 792] /Contents ") + ((contentObjNum.toString()))) + " 0 R /Resources ") + resourcesStr) + " >>");
    const streamBuf = new GrowableBuffer();
    if ( hasImage ) {
      streamBuf.writeString("q\n");
      streamBuf.writeString("150 0 0 150 400 600 cm\n");
      streamBuf.writeString("/Img1 Do\n");
      streamBuf.writeString("Q\n");
    }
    streamBuf.writeString("q\n");
    streamBuf.writeString("1 0 0 RG\n");
    streamBuf.writeString("1 0.8 0.8 rg\n");
    streamBuf.writeString("2 w\n");
    streamBuf.writeString("100 650 80 60 re\n");
    streamBuf.writeString("B\n");
    streamBuf.writeString("Q\n");
    streamBuf.writeString("q\n");
    streamBuf.writeString("0 0 1 RG\n");
    streamBuf.writeString("0.8 0.8 1 rg\n");
    streamBuf.writeString("2 w\n");
    streamBuf.writeString("220 650 m\n");
    streamBuf.writeString("280 650 l\n");
    streamBuf.writeString("250 710 l\n");
    streamBuf.writeString("h\n");
    streamBuf.writeString("B\n");
    streamBuf.writeString("Q\n");
    streamBuf.writeString("q\n");
    streamBuf.writeString("0 0.5 0 RG\n");
    streamBuf.writeString("0.8 1 0.8 rg\n");
    streamBuf.writeString("2 w\n");
    const cx = 370;
    const cy = 680;
    const r = 30;
    const k = 17;
    streamBuf.writeString((((((cx + r).toString())) + " ") + ((cy.toString()))) + " m\n");
    streamBuf.writeString((((((((((((((cx + r).toString())) + " ") + (((cy + k).toString()))) + " ") + (((cx + k).toString()))) + " ") + (((cy + r).toString()))) + " ") + ((cx.toString()))) + " ") + (((cy + r).toString()))) + " c\n");
    streamBuf.writeString((((((((((((((cx - k).toString())) + " ") + (((cy + r).toString()))) + " ") + (((cx - r).toString()))) + " ") + (((cy + k).toString()))) + " ") + (((cx - r).toString()))) + " ") + ((cy.toString()))) + " c\n");
    streamBuf.writeString((((((((((((((cx - r).toString())) + " ") + (((cy - k).toString()))) + " ") + (((cx - k).toString()))) + " ") + (((cy - r).toString()))) + " ") + ((cx.toString()))) + " ") + (((cy - r).toString()))) + " c\n");
    streamBuf.writeString((((((((((((((cx + k).toString())) + " ") + (((cy - r).toString()))) + " ") + (((cx + r).toString()))) + " ") + (((cy - k).toString()))) + " ") + (((cx + r).toString()))) + " ") + ((cy.toString()))) + " c\n");
    streamBuf.writeString("B\n");
    streamBuf.writeString("Q\n");
    streamBuf.writeString("q\n");
    streamBuf.writeString("0.8 0 0.2 RG\n");
    streamBuf.writeString("1 0.4 0.5 rg\n");
    streamBuf.writeString("2 w\n");
    streamBuf.writeString("140 480 m\n");
    streamBuf.writeString("90 510 80 560 110 580 c\n");
    streamBuf.writeString("130 595 140 580 140 565 c\n");
    streamBuf.writeString("140 580 150 595 170 580 c\n");
    streamBuf.writeString("200 560 190 510 140 480 c\n");
    streamBuf.writeString("h\n");
    streamBuf.writeString("B\n");
    streamBuf.writeString("Q\n");
    streamBuf.writeString("q\n");
    streamBuf.writeString("0 0.5 0.8 RG\n");
    streamBuf.writeString("2 w\n");
    const sx = 300;
    const sy = 530;
    const arm = 50;
    streamBuf.writeString(((((sx.toString())) + " ") + ((sy.toString()))) + " m\n");
    streamBuf.writeString(((((sx.toString())) + " ") + (((sy + arm).toString()))) + " l\n");
    streamBuf.writeString(((((sx.toString())) + " ") + ((sy.toString()))) + " m\n");
    streamBuf.writeString((((((sx + 43).toString())) + " ") + (((sy + 25).toString()))) + " l\n");
    streamBuf.writeString(((((sx.toString())) + " ") + ((sy.toString()))) + " m\n");
    streamBuf.writeString((((((sx + 43).toString())) + " ") + (((sy - 25).toString()))) + " l\n");
    streamBuf.writeString(((((sx.toString())) + " ") + ((sy.toString()))) + " m\n");
    streamBuf.writeString(((((sx.toString())) + " ") + (((sy - arm).toString()))) + " l\n");
    streamBuf.writeString(((((sx.toString())) + " ") + ((sy.toString()))) + " m\n");
    streamBuf.writeString((((((sx - 43).toString())) + " ") + (((sy - 25).toString()))) + " l\n");
    streamBuf.writeString(((((sx.toString())) + " ") + ((sy.toString()))) + " m\n");
    streamBuf.writeString((((((sx - 43).toString())) + " ") + (((sy + 25).toString()))) + " l\n");
    streamBuf.writeString((((((sx - 10).toString())) + " ") + ((((sy + arm) - 10).toString()))) + " m\n");
    streamBuf.writeString(((((sx.toString())) + " ") + (((sy + arm).toString()))) + " l\n");
    streamBuf.writeString((((((sx + 10).toString())) + " ") + ((((sy + arm) - 10).toString()))) + " l\n");
    streamBuf.writeString((((((sx - 10).toString())) + " ") + ((((sy - arm) + 10).toString()))) + " m\n");
    streamBuf.writeString(((((sx.toString())) + " ") + (((sy - arm).toString()))) + " l\n");
    streamBuf.writeString((((((sx + 10).toString())) + " ") + ((((sy - arm) + 10).toString()))) + " l\n");
    streamBuf.writeString("S\n");
    streamBuf.writeString("Q\n");
    streamBuf.writeString("q\n");
    streamBuf.writeString("0.8 0.6 0 RG\n");
    streamBuf.writeString("1 0.9 0.3 rg\n");
    streamBuf.writeString("2 w\n");
    streamBuf.writeString("460 575 m\n");
    streamBuf.writeString("472 545 l\n");
    streamBuf.writeString("505 545 l\n");
    streamBuf.writeString("478 522 l\n");
    streamBuf.writeString("488 490 l\n");
    streamBuf.writeString("460 508 l\n");
    streamBuf.writeString("432 490 l\n");
    streamBuf.writeString("442 522 l\n");
    streamBuf.writeString("415 545 l\n");
    streamBuf.writeString("448 545 l\n");
    streamBuf.writeString("h\n");
    streamBuf.writeString("B\n");
    streamBuf.writeString("Q\n");
    streamBuf.writeString("q\n");
    streamBuf.writeString("0.5 0.5 0.5 RG\n");
    streamBuf.writeString("1 w\n");
    streamBuf.writeString("50 450 m\n");
    streamBuf.writeString("562 450 l\n");
    streamBuf.writeString("S\n");
    streamBuf.writeString("Q\n");
    streamBuf.writeString("q\n");
    streamBuf.writeString("0.6 0 0.6 RG\n");
    streamBuf.writeString("3 w\n");
    streamBuf.writeString("50 400 m\n");
    streamBuf.writeString("150 450 200 350 300 400 c\n");
    streamBuf.writeString("400 450 450 350 550 400 c\n");
    streamBuf.writeString("S\n");
    streamBuf.writeString("Q\n");
    streamBuf.writeString("BT\n");
    streamBuf.writeString("/F1 36 Tf\n");
    streamBuf.writeString("100 320 Td\n");
    streamBuf.writeString(("(" + this.escapeText(message)) + ") Tj\n");
    streamBuf.writeString("ET\n");
    streamBuf.writeString("BT\n");
    streamBuf.writeString("/F1 14 Tf\n");
    streamBuf.writeString("100 280 Td\n");
    streamBuf.writeString("(Generated by Ranger PDF Writer) Tj\n");
    streamBuf.writeString("ET\n");
    streamBuf.writeString("BT\n/F1 10 Tf\n100 630 Td\n(Rectangle) Tj\nET\n");
    streamBuf.writeString("BT\n/F1 10 Tf\n225 630 Td\n(Triangle) Tj\nET\n");
    streamBuf.writeString("BT\n/F1 10 Tf\n355 630 Td\n(Circle) Tj\nET\n");
    streamBuf.writeString("BT\n/F1 10 Tf\n125 465 Td\n(Heart) Tj\nET\n");
    streamBuf.writeString("BT\n/F1 10 Tf\n275 465 Td\n(Snowflake) Tj\nET\n");
    streamBuf.writeString("BT\n/F1 10 Tf\n445 465 Td\n(Star) Tj\nET\n");
    if ( hasImage ) {
      streamBuf.writeString("BT\n/F1 10 Tf\n400 585 Td\n(JPEG Image) Tj\nET\n");
      if ( (typeof(this.lastImageMetadata) !== "undefined" && this.lastImageMetadata != null )  ) {
        const meta = this.lastImageMetadata;
        let metaY = 240;
        streamBuf.writeString(("BT\n/F1 12 Tf\n400 " + ((metaY.toString()))) + " Td\n(Image Metadata:) Tj\nET\n");
        metaY = metaY - 14;
        streamBuf.writeString(((((("BT\n/F1 9 Tf\n400 " + ((metaY.toString()))) + " Td\n(Size: ") + ((meta.width.toString()))) + " x ") + ((meta.height.toString()))) + ") Tj\nET\n");
        metaY = metaY - 12;
        if ( meta.hasExif ) {
          if ( (meta.cameraMake.length) > 0 ) {
            streamBuf.writeString(((("BT\n/F1 9 Tf\n400 " + ((metaY.toString()))) + " Td\n(Make: ") + this.escapeText(meta.cameraMake)) + ") Tj\nET\n");
            metaY = metaY - 12;
          }
          if ( (meta.cameraModel.length) > 0 ) {
            streamBuf.writeString(((("BT\n/F1 9 Tf\n400 " + ((metaY.toString()))) + " Td\n(Model: ") + this.escapeText(meta.cameraModel)) + ") Tj\nET\n");
            metaY = metaY - 12;
          }
          if ( (meta.dateTimeOriginal.length) > 0 ) {
            streamBuf.writeString(((("BT\n/F1 9 Tf\n400 " + ((metaY.toString()))) + " Td\n(Date: ") + this.escapeText(meta.dateTimeOriginal)) + ") Tj\nET\n");
            metaY = metaY - 12;
          }
          if ( (meta.exposureTime.length) > 0 ) {
            streamBuf.writeString(((("BT\n/F1 9 Tf\n400 " + ((metaY.toString()))) + " Td\n(Exposure: ") + meta.exposureTime) + " sec) Tj\nET\n");
            metaY = metaY - 12;
          }
          if ( (meta.fNumber.length) > 0 ) {
            streamBuf.writeString(((("BT\n/F1 9 Tf\n400 " + ((metaY.toString()))) + " Td\n(Aperture: f/") + meta.fNumber) + ") Tj\nET\n");
            metaY = metaY - 12;
          }
          if ( (meta.isoSpeed.length) > 0 ) {
            streamBuf.writeString(((("BT\n/F1 9 Tf\n400 " + ((metaY.toString()))) + " Td\n(ISO: ") + meta.isoSpeed) + ") Tj\nET\n");
            metaY = metaY - 12;
          }
          if ( (meta.focalLength.length) > 0 ) {
            streamBuf.writeString(((("BT\n/F1 9 Tf\n400 " + ((metaY.toString()))) + " Td\n(Focal Length: ") + meta.focalLength) + " mm) Tj\nET\n");
            metaY = metaY - 12;
          }
          if ( (meta.flash.length) > 0 ) {
            streamBuf.writeString(((("BT\n/F1 9 Tf\n400 " + ((metaY.toString()))) + " Td\n(Flash: ") + meta.flash) + ") Tj\nET\n");
            metaY = metaY - 12;
          }
        }
        if ( meta.hasGPS ) {
          streamBuf.writeString(("BT\n/F1 9 Tf\n400 " + ((metaY.toString()))) + " Td\n(--- GPS Data ---) Tj\nET\n");
          metaY = metaY - 12;
          if ( (meta.gpsLatitude.length) > 0 ) {
            streamBuf.writeString(((("BT\n/F1 9 Tf\n400 " + ((metaY.toString()))) + " Td\n(Latitude: ") + meta.gpsLatitude) + ") Tj\nET\n");
            metaY = metaY - 12;
          }
          if ( (meta.gpsLongitude.length) > 0 ) {
            streamBuf.writeString(((("BT\n/F1 9 Tf\n400 " + ((metaY.toString()))) + " Td\n(Longitude: ") + meta.gpsLongitude) + ") Tj\nET\n");
            metaY = metaY - 12;
          }
          if ( (meta.gpsAltitude.length) > 0 ) {
            streamBuf.writeString(((("BT\n/F1 9 Tf\n400 " + ((metaY.toString()))) + " Td\n(Altitude: ") + meta.gpsAltitude) + ") Tj\nET\n");
            metaY = metaY - 12;
          }
        }
      }
    }
    const streamLen = (streamBuf).size();
    const streamContent = (streamBuf).toString();
    this.writeObject(((("<< /Length " + ((streamLen.toString()))) + " >>\nstream\n") + streamContent) + "endstream");
    this.writeObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
    let rootObjNum = 1;
    if ( hasImage ) {
      rootObjNum = 2;
    }
    const xrefOffset = (buf).size();
    buf.writeString("xref\n");
    buf.writeString(("0 " + ((this.nextObjNum.toString()))) + "\n");
    buf.writeString("0000000000 65535 f \n");
    for ( let i = 0; i < this.objectOffsets.length; i++) {
      var offset = this.objectOffsets[i];
      let offsetStr = (offset.toString());
      while ((offsetStr.length) < 10) {
        offsetStr = "0" + offsetStr;
      };
      buf.writeString(offsetStr + " 00000 n \n");
    };
    buf.writeString("trailer\n");
    buf.writeString(((("<< /Size " + ((this.nextObjNum.toString()))) + " /Root ") + ((rootObjNum.toString()))) + " 0 R >>\n");
    buf.writeString("startxref\n");
    buf.writeString(((xrefOffset.toString())) + "\n");
    buf.writeString("%%EOF\n");
    return buf.toBuffer();
  };
  savePDF (path, filename, message) {
    const pdfContent = this.createHelloWorldPDF(message);
    require('fs').writeFileSync(path + '/' + filename, Buffer.from(pdfContent));
    console.log((("PDF saved to " + path) + "/") + filename);
  };
  savePDFWithImage (path, filename, message, imageDirPath, imageFileName) {
    const pdfContent = this.createPDFWithImage(message, imageDirPath, imageFileName);
    require('fs').writeFileSync(path + '/' + filename, Buffer.from(pdfContent));
    console.log((("PDF saved to " + path) + "/") + filename);
  };
}
class Main  {
  constructor() {
  }
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
      root.width = EVGUnit.pixels(this.pageWidth);
    }
    if ( root.height.isSet == false ) {
      root.height = EVGUnit.pixels(this.pageHeight);
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
    i = 0;
    while (i < elementCount) {
      const el_1 = rowElements[i];
      if ( offsetX != 0.0 ) {
        el_1.calculatedX = el_1.calculatedX + offsetX;
      }
      const childTotalHeight = (el_1.calculatedHeight + el_1.box.marginTopPx) + el_1.box.marginBottomPx;
      let offsetY = 0.0;
      if ( parent.verticalAlign == "center" ) {
        offsetY = (rowHeight - childTotalHeight) / 2.0;
      }
      if ( parent.verticalAlign == "bottom" ) {
        offsetY = rowHeight - childTotalHeight;
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
class FontManager  {
  constructor() {
    this.fonts = [];
    this.fontNames = [];
    this.fontsDirectory = "./Fonts";
    this.defaultFont = new TrueTypeFont();
    this.hasDefaultFont = false;
    let f = [];
    this.fonts = f;
    let n = [];
    this.fontNames = n;
  }
  setFontsDirectory (path) {
    this.fontsDirectory = path;
  };
  loadFont (relativePath) {
    const fullPath = (this.fontsDirectory + "/") + relativePath;
    const font = new TrueTypeFont();
    if ( font.loadFromFile(fullPath) == false ) {
      console.log("FontManager: Failed to load font: " + fullPath);
      return false;
    }
    this.fonts.push(font);
    this.fontNames.push(font.fontFamily);
    if ( this.hasDefaultFont == false ) {
      this.defaultFont = font;
      this.hasDefaultFont = true;
    }
    console.log(((("FontManager: Loaded font '" + font.fontFamily) + "' (") + font.fontStyle) + ")");
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
class BitReader  {
  constructor() {
    this.data = (function(){ var b = new ArrayBuffer(0); b._view = new DataView(b); return b; })();
    this.dataStart = 0;
    this.dataEnd = 0;
    this.bytePos = 0;
    this.bitPos = 0;
    this.currentByte = 0;
    this.eof = false;
  }
  init (buf, startPos, length) {
    this.data = buf;
    this.dataStart = startPos;
    this.dataEnd = startPos + length;
    this.bytePos = startPos;
    this.bitPos = 0;
    this.currentByte = 0;
    this.eof = false;
  };
  loadNextByte () {
    if ( this.bytePos >= this.dataEnd ) {
      this.eof = true;
      this.currentByte = 0;
      this.bitPos = 8;
      return;
    }
    this.currentByte = this.data._view.getUint8(this.bytePos);
    this.bytePos = this.bytePos + 1;
    if ( this.currentByte == 255 ) {
      if ( this.bytePos < this.dataEnd ) {
        const nextByte = this.data._view.getUint8(this.bytePos);
        if ( nextByte == 0 ) {
          this.bytePos = this.bytePos + 1;
        } else {
          if ( (nextByte >= 208) && (nextByte <= 215) ) {
            this.bytePos = this.bytePos + 1;
            this.loadNextByte();
            return;
          }
          if ( nextByte == 255 ) {
            this.bytePos = this.bytePos + 1;
            this.loadNextByte();
            return;
          }
        }
      }
    }
    this.bitPos = 8;
  };
  readBit () {
    if ( this.bitPos == 0 ) {
      this.loadNextByte();
    }
    if ( this.eof ) {
      return 0;
    }
    this.bitPos = this.bitPos - 1;
    const bit = (((this.currentByte >> this.bitPos)) & 1);
    return bit;
  };
  readBits (count) {
    let result = 0;
    let i = 0;
    while (i < count) {
      result = (((result << 1)) | this.readBit());
      i = i + 1;
    };
    return result;
  };
  peekBits (count) {
    const savedBytePos = this.bytePos;
    const savedBitPos = this.bitPos;
    const savedCurrentByte = this.currentByte;
    const savedEof = this.eof;
    const result = this.readBits(count);
    this.bytePos = savedBytePos;
    this.bitPos = savedBitPos;
    this.currentByte = savedCurrentByte;
    this.eof = savedEof;
    return result;
  };
  alignToByte () {
    this.bitPos = 0;
  };
  getBytePosition () {
    return this.bytePos;
  };
  isEOF () {
    return this.eof;
  };
  receiveExtend (length) {
    if ( length == 0 ) {
      return 0;
    }
    let value = this.readBits(length);
    const threshold = (1 << (length - 1));
    if ( value < threshold ) {
      value = value - (((threshold << 1)) - 1);
    }
    return value;
  };
}
class HuffmanTable  {
  constructor() {
    this.bits = [];
    this.values = [];
    this.maxCode = [];
    this.minCode = [];
    this.valPtr = [];
    this.tableClass = 0;
    this.tableId = 0;
    let i = 0;
    while (i < 16) {
      this.bits.push(0);
      this.maxCode.push(-1);
      this.minCode.push(0);
      this.valPtr.push(0);
      i = i + 1;
    };
  }
  build () {
    let code = 0;
    let valueIdx = 0;
    let i = 0;
    while (i < 16) {
      const count = this.bits[i];
      if ( count > 0 ) {
        this.minCode[i] = code;
        this.valPtr[i] = valueIdx;
        valueIdx = valueIdx + count;
        code = code + count;
        this.maxCode[i] = code - 1;
      } else {
        this.maxCode[i] = -1;
        this.minCode[i] = 0;
        this.valPtr[i] = valueIdx;
      }
      code = (code << 1);
      i = i + 1;
    };
  };
  decode (reader) {
    let code = 0;
    let length = 0;
    while (length < 16) {
      const bit = reader.readBit();
      code = (((code << 1)) | bit);
      const maxC = this.maxCode[length];
      if ( maxC >= 0 ) {
        if ( code <= maxC ) {
          const minC = this.minCode[length];
          const ptr = this.valPtr[length];
          const idx = ptr + (code - minC);
          return this.values[idx];
        }
      }
      length = length + 1;
    };
    console.log("Huffman decode error: code not found");
    return 0;
  };
}
class HuffmanDecoder  {
  constructor() {
    this.dcTable0 = new HuffmanTable();
    this.dcTable1 = new HuffmanTable();
    this.acTable0 = new HuffmanTable();
    this.acTable1 = new HuffmanTable();
  }
  getDCTable (id) {
    if ( id == 0 ) {
      return this.dcTable0;
    }
    return this.dcTable1;
  };
  getACTable (id) {
    if ( id == 0 ) {
      return this.acTable0;
    }
    return this.acTable1;
  };
  parseDHT (data, pos, length) {
    const endPos = pos + length;
    while (pos < endPos) {
      const tableInfo = data._view.getUint8(pos);
      pos = pos + 1;
      const tableClass = (tableInfo >> 4);
      const tableId = (tableInfo & 15);
      let table = this.getDCTable(tableId);
      if ( tableClass == 1 ) {
        table = this.getACTable(tableId);
      }
      table.tableClass = tableClass;
      table.tableId = tableId;
      table.bits.length = 0;
      let totalSymbols = 0;
      let i = 0;
      while (i < 16) {
        const count = data._view.getUint8(pos);
        table.bits.push(count);
        totalSymbols = totalSymbols + count;
        pos = pos + 1;
        i = i + 1;
      };
      table.values.length = 0;
      table.maxCode.length = 0;
      table.minCode.length = 0;
      table.valPtr.length = 0;
      i = 0;
      while (i < 16) {
        table.maxCode.push(-1);
        table.minCode.push(0);
        table.valPtr.push(0);
        i = i + 1;
      };
      i = 0;
      while (i < totalSymbols) {
        table.values.push(data._view.getUint8(pos));
        pos = pos + 1;
        i = i + 1;
      };
      table.build();
      let classStr = "DC";
      if ( tableClass == 1 ) {
        classStr = "AC";
      }
      console.log((((("  Huffman table " + classStr) + ((tableId.toString()))) + ": ") + ((totalSymbols.toString()))) + " symbols");
    };
  };
}
class IDCT  {
  constructor() {
    this.cosTable = [];
    this.zigzagMap = [];
    this.cosTable.push(1024);
    this.cosTable.push(1004);
    this.cosTable.push(946);
    this.cosTable.push(851);
    this.cosTable.push(724);
    this.cosTable.push(569);
    this.cosTable.push(392);
    this.cosTable.push(200);
    this.cosTable.push(1024);
    this.cosTable.push(851);
    this.cosTable.push(392);
    this.cosTable.push(-200);
    this.cosTable.push(-724);
    this.cosTable.push(-1004);
    this.cosTable.push(-946);
    this.cosTable.push(-569);
    this.cosTable.push(1024);
    this.cosTable.push(569);
    this.cosTable.push(-392);
    this.cosTable.push(-1004);
    this.cosTable.push(-724);
    this.cosTable.push(200);
    this.cosTable.push(946);
    this.cosTable.push(851);
    this.cosTable.push(1024);
    this.cosTable.push(200);
    this.cosTable.push(-946);
    this.cosTable.push(-569);
    this.cosTable.push(724);
    this.cosTable.push(851);
    this.cosTable.push(-392);
    this.cosTable.push(-1004);
    this.cosTable.push(1024);
    this.cosTable.push(-200);
    this.cosTable.push(-946);
    this.cosTable.push(569);
    this.cosTable.push(724);
    this.cosTable.push(-851);
    this.cosTable.push(-392);
    this.cosTable.push(1004);
    this.cosTable.push(1024);
    this.cosTable.push(-569);
    this.cosTable.push(-392);
    this.cosTable.push(1004);
    this.cosTable.push(-724);
    this.cosTable.push(-200);
    this.cosTable.push(946);
    this.cosTable.push(-851);
    this.cosTable.push(1024);
    this.cosTable.push(-851);
    this.cosTable.push(392);
    this.cosTable.push(200);
    this.cosTable.push(-724);
    this.cosTable.push(1004);
    this.cosTable.push(-946);
    this.cosTable.push(569);
    this.cosTable.push(1024);
    this.cosTable.push(-1004);
    this.cosTable.push(946);
    this.cosTable.push(-851);
    this.cosTable.push(724);
    this.cosTable.push(-569);
    this.cosTable.push(392);
    this.cosTable.push(-200);
    this.zigzagMap.push(0);
    this.zigzagMap.push(1);
    this.zigzagMap.push(8);
    this.zigzagMap.push(16);
    this.zigzagMap.push(9);
    this.zigzagMap.push(2);
    this.zigzagMap.push(3);
    this.zigzagMap.push(10);
    this.zigzagMap.push(17);
    this.zigzagMap.push(24);
    this.zigzagMap.push(32);
    this.zigzagMap.push(25);
    this.zigzagMap.push(18);
    this.zigzagMap.push(11);
    this.zigzagMap.push(4);
    this.zigzagMap.push(5);
    this.zigzagMap.push(12);
    this.zigzagMap.push(19);
    this.zigzagMap.push(26);
    this.zigzagMap.push(33);
    this.zigzagMap.push(40);
    this.zigzagMap.push(48);
    this.zigzagMap.push(41);
    this.zigzagMap.push(34);
    this.zigzagMap.push(27);
    this.zigzagMap.push(20);
    this.zigzagMap.push(13);
    this.zigzagMap.push(6);
    this.zigzagMap.push(7);
    this.zigzagMap.push(14);
    this.zigzagMap.push(21);
    this.zigzagMap.push(28);
    this.zigzagMap.push(35);
    this.zigzagMap.push(42);
    this.zigzagMap.push(49);
    this.zigzagMap.push(56);
    this.zigzagMap.push(57);
    this.zigzagMap.push(50);
    this.zigzagMap.push(43);
    this.zigzagMap.push(36);
    this.zigzagMap.push(29);
    this.zigzagMap.push(22);
    this.zigzagMap.push(15);
    this.zigzagMap.push(23);
    this.zigzagMap.push(30);
    this.zigzagMap.push(37);
    this.zigzagMap.push(44);
    this.zigzagMap.push(51);
    this.zigzagMap.push(58);
    this.zigzagMap.push(59);
    this.zigzagMap.push(52);
    this.zigzagMap.push(45);
    this.zigzagMap.push(38);
    this.zigzagMap.push(31);
    this.zigzagMap.push(39);
    this.zigzagMap.push(46);
    this.zigzagMap.push(53);
    this.zigzagMap.push(60);
    this.zigzagMap.push(61);
    this.zigzagMap.push(54);
    this.zigzagMap.push(47);
    this.zigzagMap.push(55);
    this.zigzagMap.push(62);
    this.zigzagMap.push(63);
  }
  dezigzag (zigzag) {
    let block = [];
    let i = 0;
    while (i < 64) {
      block.push(0);
      i = i + 1;
    };
    i = 0;
    while (i < 64) {
      const pos = this.zigzagMap[i];
      block[pos] = zigzag[i];
      i = i + 1;
    };
    return block;
  };
  idct1d (input, startIdx, stride, output, outIdx, outStride) {
    let x = 0;
    while (x < 8) {
      let sum = 0;
      let u = 0;
      while (u < 8) {
        const coeff = input[(startIdx + (u * stride))];
        if ( coeff != 0 ) {
          const cosVal = this.cosTable[((x * 8) + u)];
          let contrib = coeff * cosVal;
          if ( u == 0 ) {
            contrib = ((contrib * 724) >> 10);
          }
          sum = sum + contrib;
        }
        u = u + 1;
      };
      output[outIdx + (x * outStride)] = (sum >> 11);
      x = x + 1;
    };
  };
  transform (block, output) {
    let temp = [];
    let i = 0;
    while (i < 64) {
      temp.push(0);
      i = i + 1;
    };
    let row = 0;
    while (row < 8) {
      const rowStart = row * 8;
      this.idct1d(block, rowStart, 1, temp, rowStart, 1);
      row = row + 1;
    };
    let col = 0;
    while (col < 8) {
      this.idct1d(temp, col, 8, output, col, 8);
      col = col + 1;
    };
    i = 0;
    while (i < 64) {
      let val = (output[i]) + 128;
      if ( val < 0 ) {
        val = 0;
      }
      if ( val > 255 ) {
        val = 255;
      }
      output[i] = val;
      i = i + 1;
    };
  };
  transformFast (coeffs, output) {
    this.transform(coeffs, output);
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
class PPMImage  {
  constructor() {
  }
  parseNumber (data, startPos, endPos) {
    const __len = data.byteLength;
    let pos = startPos;
    let skipping = true;
    while (skipping && (pos < __len)) {
      const ch = data._view.getUint8(pos);
      if ( (((ch == 32) || (ch == 10)) || (ch == 13)) || (ch == 9) ) {
        pos = pos + 1;
      } else {
        skipping = false;
      }
    };
    let value = 0;
    let parsing = true;
    while (parsing && (pos < __len)) {
      const ch_1 = data._view.getUint8(pos);
      if ( (ch_1 >= 48) && (ch_1 <= 57) ) {
        value = (value * 10) + (ch_1 - 48);
        pos = pos + 1;
      } else {
        parsing = false;
      }
    };
    endPos[0] = pos;
    return value;
  };
  skipToNextLine (data, pos) {
    const __len = data.byteLength;
    while (pos < __len) {
      const ch = data._view.getUint8(pos);
      pos = pos + 1;
      if ( ch == 10 ) {
        return pos;
      }
    };
    return pos;
  };
  load (dirPath, fileName) {
    const data = (function(){ var b = require('fs').readFileSync(dirPath + '/' + fileName); var ab = new ArrayBuffer(b.length); var v = new Uint8Array(ab); for(var i=0;i<b.length;i++)v[i]=b[i]; ab._view = new DataView(ab); return ab; })();
    const __len = data.byteLength;
    if ( __len < 10 ) {
      console.log("Error: File too small: " + fileName);
      const errImg = new ImageBuffer();
      errImg.init(1, 1);
      return errImg;
    }
    const m1 = data._view.getUint8(0);
    const m2 = data._view.getUint8(1);
    if ( (m1 != 80) || ((m2 != 54) && (m2 != 51)) ) {
      console.log("Error: Not a PPM file (P3 or P6): " + fileName);
      const errImg_1 = new ImageBuffer();
      errImg_1.init(1, 1);
      return errImg_1;
    }
    const isBinary = m2 == 54;
    let pos = 2;
    let endPos = [];
    endPos.push(0);
    let skippingComments = true;
    while (skippingComments && (pos < __len)) {
      const ch = data._view.getUint8(pos);
      if ( (((ch == 32) || (ch == 10)) || (ch == 13)) || (ch == 9) ) {
        pos = pos + 1;
      } else {
        if ( ch == 35 ) {
          pos = this.skipToNextLine(data, pos);
        } else {
          skippingComments = false;
        }
      }
    };
    const width = this.parseNumber(data, pos, endPos);
    pos = endPos[0];
    const height = this.parseNumber(data, pos, endPos);
    pos = endPos[0];
    const maxVal = this.parseNumber(data, pos, endPos);
    pos = endPos[0];
    if ( pos < __len ) {
      pos = pos + 1;
    }
    console.log((((("Loading PPM: " + ((width.toString()))) + "x") + ((height.toString()))) + ", maxval=") + ((maxVal.toString())));
    const img = new ImageBuffer();
    img.init(width, height);
    if ( isBinary ) {
      let y = 0;
      while (y < height) {
        let x = 0;
        while (x < width) {
          if ( (pos + 2) < __len ) {
            const r = data._view.getUint8(pos);
            const g = data._view.getUint8((pos + 1));
            const b = data._view.getUint8((pos + 2));
            img.setPixelRGB(x, y, r, g, b);
            pos = pos + 3;
          }
          x = x + 1;
        };
        y = y + 1;
      };
    } else {
      let y_1 = 0;
      while (y_1 < height) {
        let x_1 = 0;
        while (x_1 < width) {
          const r_1 = this.parseNumber(data, pos, endPos);
          pos = endPos[0];
          const g_1 = this.parseNumber(data, pos, endPos);
          pos = endPos[0];
          const b_1 = this.parseNumber(data, pos, endPos);
          pos = endPos[0];
          img.setPixelRGB(x_1, y_1, r_1, g_1, b_1);
          x_1 = x_1 + 1;
        };
        y_1 = y_1 + 1;
      };
    }
    return img;
  };
  save (img, dirPath, fileName) {
    const buf = new GrowableBuffer();
    buf.writeString("P6\n");
    buf.writeString(((((img.width.toString())) + " ") + ((img.height.toString()))) + "\n");
    buf.writeString("255\n");
    let y = 0;
    while (y < img.height) {
      let x = 0;
      while (x < img.width) {
        const c = img.getPixel(x, y);
        buf.writeByte(c.r);
        buf.writeByte(c.g);
        buf.writeByte(c.b);
        x = x + 1;
      };
      y = y + 1;
    };
    const data = buf.toBuffer();
    require('fs').writeFileSync(dirPath + '/' + fileName, Buffer.from(data));
    console.log((("Saved PPM: " + dirPath) + "/") + fileName);
  };
  saveP3 (img, dirPath, fileName) {
    const buf = new GrowableBuffer();
    buf.writeString("P3\n");
    buf.writeString("# Created by Ranger ImageEditor\n");
    buf.writeString(((((img.width.toString())) + " ") + ((img.height.toString()))) + "\n");
    buf.writeString("255\n");
    let y = 0;
    while (y < img.height) {
      let x = 0;
      while (x < img.width) {
        const c = img.getPixel(x, y);
        buf.writeString((((((c.r.toString())) + " ") + ((c.g.toString()))) + " ") + ((c.b.toString())));
        if ( x < (img.width - 1) ) {
          buf.writeString("  ");
        }
        x = x + 1;
      };
      buf.writeString("\n");
      y = y + 1;
    };
    const data = buf.toBuffer();
    require('fs').writeFileSync(dirPath + '/' + fileName, Buffer.from(data));
    console.log((("Saved PPM (ASCII): " + dirPath) + "/") + fileName);
  };
}
class JPEGComponent  {
  constructor() {
    this.id = 0;
    this.hSamp = 1;
    this.vSamp = 1;
    this.quantTableId = 0;
    this.dcTableId = 0;
    this.acTableId = 0;
    this.prevDC = 0;
  }
}
class QuantizationTable  {
  constructor() {
    this.values = [];
    this.id = 0;
    let i_1 = 0;
    while (i_1 < 64) {
      this.values.push(1);
      i_1 = i_1 + 1;
    };
  }
}
class JPEGDecoder  {
  constructor() {
    this.data = (function(){ var b = new ArrayBuffer(0); b._view = new DataView(b); return b; })();
    this.dataLen = 0;
    this.width = 0;
    this.height = 0;
    this.numComponents = 0;
    this.precision = 8;
    this.components = [];
    this.quantTables = [];
    this.scanDataStart = 0;
    this.scanDataLen = 0;
    this.mcuWidth = 8;
    this.mcuHeight = 8;
    this.mcusPerRow = 0;
    this.mcusPerCol = 0;
    this.maxHSamp = 1;
    this.maxVSamp = 1;
    this.restartInterval = 0;
    this.huffman = new HuffmanDecoder();
    this.idct = new IDCT();
    let i_2 = 0;
    while (i_2 < 4) {
      this.quantTables.push(new QuantizationTable());
      i_2 = i_2 + 1;
    };
  }
  readUint16BE (pos) {
    const high = this.data._view.getUint8(pos);
    const low = this.data._view.getUint8((pos + 1));
    return (high * 256) + low;
  };
  parseSOF (pos, length) {
    this.precision = this.data._view.getUint8(pos);
    this.height = this.readUint16BE((pos + 1));
    this.width = this.readUint16BE((pos + 3));
    this.numComponents = this.data._view.getUint8((pos + 5));
    console.log(((((("  Image: " + ((this.width.toString()))) + "x") + ((this.height.toString()))) + ", ") + ((this.numComponents.toString()))) + " components");
    this.components.length = 0;
    this.maxHSamp = 1;
    this.maxVSamp = 1;
    let i = 0;
    let offset = pos + 6;
    while (i < this.numComponents) {
      const comp = new JPEGComponent();
      comp.id = this.data._view.getUint8(offset);
      const sampling = this.data._view.getUint8((offset + 1));
      comp.hSamp = (sampling >> 4);
      comp.vSamp = (sampling & 15);
      comp.quantTableId = this.data._view.getUint8((offset + 2));
      if ( comp.hSamp > this.maxHSamp ) {
        this.maxHSamp = comp.hSamp;
      }
      if ( comp.vSamp > this.maxVSamp ) {
        this.maxVSamp = comp.vSamp;
      }
      this.components.push(comp);
      console.log((((((("    Component " + ((comp.id.toString()))) + ": ") + ((comp.hSamp.toString()))) + "x") + ((comp.vSamp.toString()))) + " sampling, quant table ") + ((comp.quantTableId.toString())));
      offset = offset + 3;
      i = i + 1;
    };
    this.mcuWidth = this.maxHSamp * 8;
    this.mcuHeight = this.maxVSamp * 8;
    this.mcusPerRow = Math.floor( (((this.width + this.mcuWidth) - 1) / this.mcuWidth));
    this.mcusPerCol = Math.floor( (((this.height + this.mcuHeight) - 1) / this.mcuHeight));
    console.log((((((("  MCU size: " + ((this.mcuWidth.toString()))) + "x") + ((this.mcuHeight.toString()))) + ", grid: ") + ((this.mcusPerRow.toString()))) + "x") + ((this.mcusPerCol.toString())));
  };
  parseDQT (pos, length) {
    const endPos = pos + length;
    while (pos < endPos) {
      const info = this.data._view.getUint8(pos);
      pos = pos + 1;
      const precision_1 = (info >> 4);
      const tableId = (info & 15);
      const table = this.quantTables[tableId];
      table.id = tableId;
      table.values.length = 0;
      let i = 0;
      while (i < 64) {
        if ( precision_1 == 0 ) {
          table.values.push(this.data._view.getUint8(pos));
          pos = pos + 1;
        } else {
          table.values.push(this.readUint16BE(pos));
          pos = pos + 2;
        }
        i = i + 1;
      };
      console.log(((("  Quantization table " + ((tableId.toString()))) + " (") + (((precision_1 + 1).toString()))) + "-byte values)");
    };
  };
  parseSOS (pos, length) {
    const numScanComponents = this.data._view.getUint8(pos);
    pos = pos + 1;
    let i = 0;
    while (i < numScanComponents) {
      const compId = this.data._view.getUint8(pos);
      const tableSelect = this.data._view.getUint8((pos + 1));
      pos = pos + 2;
      let j = 0;
      while (j < this.numComponents) {
        const comp = this.components[j];
        if ( comp.id == compId ) {
          comp.dcTableId = (tableSelect >> 4);
          comp.acTableId = (tableSelect & 15);
          console.log((((("    Component " + ((compId.toString()))) + ": DC table ") + ((comp.dcTableId.toString()))) + ", AC table ") + ((comp.acTableId.toString())));
        }
        j = j + 1;
      };
      i = i + 1;
    };
    pos = pos + 3;
    this.scanDataStart = pos;
    let searchPos = pos;
    while (searchPos < (this.dataLen - 1)) {
      const b = this.data._view.getUint8(searchPos);
      if ( b == 255 ) {
        const nextB = this.data._view.getUint8((searchPos + 1));
        if ( (nextB != 0) && (nextB != 255) ) {
          if ( (nextB >= 208) && (nextB <= 215) ) {
            searchPos = searchPos + 2;
            continue;
          }
          this.scanDataLen = searchPos - this.scanDataStart;
          return;
        }
      }
      searchPos = searchPos + 1;
    };
    this.scanDataLen = this.dataLen - this.scanDataStart;
  };
  parseMarkers () {
    let pos = 0;
    if ( this.dataLen < 2 ) {
      console.log("Error: File too small");
      return false;
    }
    const m1 = this.data._view.getUint8(0);
    const m2 = this.data._view.getUint8(1);
    if ( (m1 != 255) || (m2 != 216) ) {
      console.log("Error: Not a JPEG file (missing SOI)");
      return false;
    }
    pos = 2;
    console.log("Parsing JPEG markers...");
    while (pos < (this.dataLen - 1)) {
      const marker1 = this.data._view.getUint8(pos);
      if ( marker1 != 255 ) {
        pos = pos + 1;
        continue;
      }
      const marker2 = this.data._view.getUint8((pos + 1));
      if ( marker2 == 255 ) {
        pos = pos + 1;
        continue;
      }
      if ( marker2 == 0 ) {
        pos = pos + 2;
        continue;
      }
      if ( marker2 == 216 ) {
        pos = pos + 2;
        continue;
      }
      if ( marker2 == 217 ) {
        console.log("  End of Image");
        return true;
      }
      if ( (marker2 >= 208) && (marker2 <= 215) ) {
        pos = pos + 2;
        continue;
      }
      if ( (pos + 4) > this.dataLen ) {
        return true;
      }
      const markerLen = this.readUint16BE((pos + 2));
      const dataStart = pos + 4;
      const markerDataLen = markerLen - 2;
      if ( marker2 == 192 ) {
        console.log("  SOF0 (Baseline DCT)");
        this.parseSOF(dataStart, markerDataLen);
      }
      if ( marker2 == 193 ) {
        console.log("  SOF1 (Extended Sequential DCT)");
        this.parseSOF(dataStart, markerDataLen);
      }
      if ( marker2 == 194 ) {
        console.log("  SOF2 (Progressive DCT) - NOT SUPPORTED");
        return false;
      }
      if ( marker2 == 196 ) {
        console.log("  DHT (Huffman Tables)");
        this.huffman.parseDHT(this.data, dataStart, markerDataLen);
      }
      if ( marker2 == 219 ) {
        console.log("  DQT (Quantization Tables)");
        this.parseDQT(dataStart, markerDataLen);
      }
      if ( marker2 == 221 ) {
        this.restartInterval = this.readUint16BE(dataStart);
        console.log(("  DRI (Restart Interval: " + ((this.restartInterval.toString()))) + ")");
      }
      if ( marker2 == 218 ) {
        console.log("  SOS (Start of Scan)");
        this.parseSOS(dataStart, markerDataLen);
        pos = this.scanDataStart + this.scanDataLen;
        continue;
      }
      if ( marker2 == 224 ) {
        console.log("  APP0 (JFIF)");
      }
      if ( marker2 == 225 ) {
        console.log("  APP1 (EXIF)");
      }
      if ( marker2 == 254 ) {
        console.log("  COM (Comment)");
      }
      pos = (pos + 2) + markerLen;
    };
    return true;
  };
  decodeBlock (reader, comp, quantTable) {
    let coeffs = [];
    let i = 0;
    while (i < 64) {
      coeffs.push(0);
      i = i + 1;
    };
    const dcTable = this.huffman.getDCTable(comp.dcTableId);
    const dcCategory = dcTable.decode(reader);
    const dcDiff = reader.receiveExtend(dcCategory);
    const dcValue = comp.prevDC + dcDiff;
    comp.prevDC = dcValue;
    const dcQuant = quantTable.values[0];
    coeffs[0] = dcValue * dcQuant;
    const acTable = this.huffman.getACTable(comp.acTableId);
    let k = 1;
    while (k < 64) {
      const acSymbol = acTable.decode(reader);
      if ( acSymbol == 0 ) {
        k = 64;
      } else {
        const runLength = (acSymbol >> 4);
        const acCategory = (acSymbol & 15);
        if ( acSymbol == 240 ) {
          k = k + 16;
        } else {
          k = k + runLength;
          if ( k < 64 ) {
            const acValue = reader.receiveExtend(acCategory);
            const acQuant = quantTable.values[k];
            coeffs[k] = acValue * acQuant;
            k = k + 1;
          }
        }
      }
    };
    return coeffs;
  };
  decode (dirPath, fileName) {
    this.data = (function(){ var b = require('fs').readFileSync(dirPath + '/' + fileName); var ab = new ArrayBuffer(b.length); var v = new Uint8Array(ab); for(var i=0;i<b.length;i++)v[i]=b[i]; ab._view = new DataView(ab); return ab; })();
    this.dataLen = this.data.byteLength;
    console.log(((("Decoding JPEG: " + fileName) + " (") + ((this.dataLen.toString()))) + " bytes)");
    const ok = this.parseMarkers();
    if ( ok == false ) {
      console.log("Error parsing JPEG markers");
      const errImg = new ImageBuffer();
      errImg.init(1, 1);
      return errImg;
    }
    if ( (this.width == 0) || (this.height == 0) ) {
      console.log("Error: Invalid image dimensions");
      const errImg_1 = new ImageBuffer();
      errImg_1.init(1, 1);
      return errImg_1;
    }
    console.log(("Decoding " + ((this.scanDataLen.toString()))) + " bytes of scan data...");
    const img = new ImageBuffer();
    img.init(this.width, this.height);
    const reader = new BitReader();
    reader.init(this.data, this.scanDataStart, this.scanDataLen);
    let c = 0;
    while (c < this.numComponents) {
      const comp = this.components[c];
      comp.prevDC = 0;
      c = c + 1;
    };
    let yBlocksData = [];
    let yBlockCount = 0;
    let cbBlock = [];
    let crBlock = [];
    let mcuCount = 0;
    let mcuY = 0;
    while (mcuY < this.mcusPerCol) {
      let mcuX = 0;
      while (mcuX < this.mcusPerRow) {
        if ( ((this.restartInterval > 0) && (mcuCount > 0)) && ((mcuCount % this.restartInterval) == 0) ) {
          c = 0;
          while (c < this.numComponents) {
            const compRst = this.components[c];
            compRst.prevDC = 0;
            c = c + 1;
          };
          reader.alignToByte();
        }
        yBlocksData.length = 0;
        yBlockCount = 0;
        let compIdx = 0;
        while (compIdx < this.numComponents) {
          const comp_1 = this.components[compIdx];
          const quantTable = this.quantTables[comp_1.quantTableId];
          let blockV = 0;
          while (blockV < comp_1.vSamp) {
            let blockH = 0;
            while (blockH < comp_1.hSamp) {
              const coeffs = this.decodeBlock(reader, comp_1, quantTable);
              let blockPixels = [];
              let bi = 0;
              while (bi < 64) {
                blockPixels.push(0);
                bi = bi + 1;
              };
              const tempBlock = this.idct.dezigzag(coeffs);
              this.idct.transform(tempBlock, blockPixels);
              if ( compIdx == 0 ) {
                bi = 0;
                while (bi < 64) {
                  yBlocksData.push(blockPixels[bi]);
                  bi = bi + 1;
                };
                yBlockCount = yBlockCount + 1;
              }
              if ( compIdx == 1 ) {
                cbBlock.length = 0;
                bi = 0;
                while (bi < 64) {
                  cbBlock.push(blockPixels[bi]);
                  bi = bi + 1;
                };
              }
              if ( compIdx == 2 ) {
                crBlock.length = 0;
                bi = 0;
                while (bi < 64) {
                  crBlock.push(blockPixels[bi]);
                  bi = bi + 1;
                };
              }
              blockH = blockH + 1;
            };
            blockV = blockV + 1;
          };
          compIdx = compIdx + 1;
        };
        this.writeMCU(img, mcuX, mcuY, yBlocksData, yBlockCount, cbBlock, crBlock);
        mcuX = mcuX + 1;
        mcuCount = mcuCount + 1;
      };
      mcuY = mcuY + 1;
      if ( (mcuY % 10) == 0 ) {
        console.log((("  Row " + ((mcuY.toString()))) + "/") + ((this.mcusPerCol.toString())));
      }
    };
    console.log("Decode complete!");
    return img;
  };
  writeMCU (img, mcuX, mcuY, yBlocksData, yBlockCount, cbBlock, crBlock) {
    const baseX = mcuX * this.mcuWidth;
    const baseY = mcuY * this.mcuHeight;
    const comp0 = this.components[0];
    if ( (this.maxHSamp == 1) && (this.maxVSamp == 1) ) {
      let py = 0;
      while (py < 8) {
        let px = 0;
        while (px < 8) {
          const imgX = baseX + px;
          const imgY = baseY + py;
          if ( (imgX < this.width) && (imgY < this.height) ) {
            const idx = (py * 8) + px;
            const y = yBlocksData[idx];
            let cb = 128;
            let cr = 128;
            if ( this.numComponents >= 3 ) {
              cb = cbBlock[idx];
              cr = crBlock[idx];
            }
            let r = y + (((359 * (cr - 128)) >> 8));
            let g = (y - (((88 * (cb - 128)) >> 8))) - (((183 * (cr - 128)) >> 8));
            let b = y + (((454 * (cb - 128)) >> 8));
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
            img.setPixelRGB(imgX, imgY, r, g, b);
          }
          px = px + 1;
        };
        py = py + 1;
      };
      return;
    }
    if ( (this.maxHSamp == 2) && (this.maxVSamp == 2) ) {
      let blockIdx = 0;
      let blockY = 0;
      while (blockY < 2) {
        let blockX = 0;
        while (blockX < 2) {
          const yBlockOffset = blockIdx * 64;
          let py_1 = 0;
          while (py_1 < 8) {
            let px_1 = 0;
            while (px_1 < 8) {
              const imgX_1 = (baseX + (blockX * 8)) + px_1;
              const imgY_1 = (baseY + (blockY * 8)) + py_1;
              if ( (imgX_1 < this.width) && (imgY_1 < this.height) ) {
                const yIdx = (yBlockOffset + (py_1 * 8)) + px_1;
                const y_1 = yBlocksData[yIdx];
                const chromaX = (blockX * 4) + ((px_1 >> 1));
                const chromaY = (blockY * 4) + ((py_1 >> 1));
                const chromaIdx = (chromaY * 8) + chromaX;
                let cb_1 = 128;
                let cr_1 = 128;
                if ( this.numComponents >= 3 ) {
                  cb_1 = cbBlock[chromaIdx];
                  cr_1 = crBlock[chromaIdx];
                }
                let r_1 = y_1 + (((359 * (cr_1 - 128)) >> 8));
                let g_1 = (y_1 - (((88 * (cb_1 - 128)) >> 8))) - (((183 * (cr_1 - 128)) >> 8));
                let b_1 = y_1 + (((454 * (cb_1 - 128)) >> 8));
                if ( r_1 < 0 ) {
                  r_1 = 0;
                }
                if ( r_1 > 255 ) {
                  r_1 = 255;
                }
                if ( g_1 < 0 ) {
                  g_1 = 0;
                }
                if ( g_1 > 255 ) {
                  g_1 = 255;
                }
                if ( b_1 < 0 ) {
                  b_1 = 0;
                }
                if ( b_1 > 255 ) {
                  b_1 = 255;
                }
                img.setPixelRGB(imgX_1, imgY_1, r_1, g_1, b_1);
              }
              px_1 = px_1 + 1;
            };
            py_1 = py_1 + 1;
          };
          blockIdx = blockIdx + 1;
          blockX = blockX + 1;
        };
        blockY = blockY + 1;
      };
      return;
    }
    if ( (this.maxHSamp == 2) && (this.maxVSamp == 1) ) {
      let blockX_1 = 0;
      while (blockX_1 < 2) {
        const yBlockOffset_1 = blockX_1 * 64;
        let py_2 = 0;
        while (py_2 < 8) {
          let px_2 = 0;
          while (px_2 < 8) {
            const imgX_2 = (baseX + (blockX_1 * 8)) + px_2;
            const imgY_2 = baseY + py_2;
            if ( (imgX_2 < this.width) && (imgY_2 < this.height) ) {
              const yIdx_1 = (yBlockOffset_1 + (py_2 * 8)) + px_2;
              const y_2 = yBlocksData[yIdx_1];
              const chromaX_1 = (blockX_1 * 4) + ((px_2 >> 1));
              const chromaY_1 = py_2;
              const chromaIdx_1 = (chromaY_1 * 8) + chromaX_1;
              let cb_2 = 128;
              let cr_2 = 128;
              if ( this.numComponents >= 3 ) {
                cb_2 = cbBlock[chromaIdx_1];
                cr_2 = crBlock[chromaIdx_1];
              }
              let r_2 = y_2 + (((359 * (cr_2 - 128)) >> 8));
              let g_2 = (y_2 - (((88 * (cb_2 - 128)) >> 8))) - (((183 * (cr_2 - 128)) >> 8));
              let b_2 = y_2 + (((454 * (cb_2 - 128)) >> 8));
              if ( r_2 < 0 ) {
                r_2 = 0;
              }
              if ( r_2 > 255 ) {
                r_2 = 255;
              }
              if ( g_2 < 0 ) {
                g_2 = 0;
              }
              if ( g_2 > 255 ) {
                g_2 = 255;
              }
              if ( b_2 < 0 ) {
                b_2 = 0;
              }
              if ( b_2 > 255 ) {
                b_2 = 255;
              }
              img.setPixelRGB(imgX_2, imgY_2, r_2, g_2, b_2);
            }
            px_2 = px_2 + 1;
          };
          py_2 = py_2 + 1;
        };
        blockX_1 = blockX_1 + 1;
      };
      return;
    }
    if ( yBlockCount > 0 ) {
      let py_3 = 0;
      while (py_3 < 8) {
        let px_3 = 0;
        while (px_3 < 8) {
          const imgX_3 = baseX + px_3;
          const imgY_3 = baseY + py_3;
          if ( (imgX_3 < this.width) && (imgY_3 < this.height) ) {
            const y_3 = yBlocksData[((py_3 * 8) + px_3)];
            img.setPixelRGB(imgX_3, imgY_3, y_3, y_3, y_3);
          }
          px_3 = px_3 + 1;
        };
        py_3 = py_3 + 1;
      };
    }
  };
}
class FDCT  {
  constructor() {
    this.cosTable = [];
    this.zigzagOrder = [];
    this.cosTable.push(1024);
    this.cosTable.push(1004);
    this.cosTable.push(946);
    this.cosTable.push(851);
    this.cosTable.push(724);
    this.cosTable.push(569);
    this.cosTable.push(392);
    this.cosTable.push(200);
    this.cosTable.push(1024);
    this.cosTable.push(851);
    this.cosTable.push(392);
    this.cosTable.push(-200);
    this.cosTable.push(-724);
    this.cosTable.push(-1004);
    this.cosTable.push(-946);
    this.cosTable.push(-569);
    this.cosTable.push(1024);
    this.cosTable.push(569);
    this.cosTable.push(-392);
    this.cosTable.push(-1004);
    this.cosTable.push(-724);
    this.cosTable.push(200);
    this.cosTable.push(946);
    this.cosTable.push(851);
    this.cosTable.push(1024);
    this.cosTable.push(200);
    this.cosTable.push(-946);
    this.cosTable.push(-569);
    this.cosTable.push(724);
    this.cosTable.push(851);
    this.cosTable.push(-392);
    this.cosTable.push(-1004);
    this.cosTable.push(1024);
    this.cosTable.push(-200);
    this.cosTable.push(-946);
    this.cosTable.push(569);
    this.cosTable.push(724);
    this.cosTable.push(-851);
    this.cosTable.push(-392);
    this.cosTable.push(1004);
    this.cosTable.push(1024);
    this.cosTable.push(-569);
    this.cosTable.push(-392);
    this.cosTable.push(1004);
    this.cosTable.push(-724);
    this.cosTable.push(-200);
    this.cosTable.push(946);
    this.cosTable.push(-851);
    this.cosTable.push(1024);
    this.cosTable.push(-851);
    this.cosTable.push(392);
    this.cosTable.push(200);
    this.cosTable.push(-724);
    this.cosTable.push(1004);
    this.cosTable.push(-946);
    this.cosTable.push(569);
    this.cosTable.push(1024);
    this.cosTable.push(-1004);
    this.cosTable.push(946);
    this.cosTable.push(-851);
    this.cosTable.push(724);
    this.cosTable.push(-569);
    this.cosTable.push(392);
    this.cosTable.push(-200);
    this.zigzagOrder.push(0);
    this.zigzagOrder.push(1);
    this.zigzagOrder.push(8);
    this.zigzagOrder.push(16);
    this.zigzagOrder.push(9);
    this.zigzagOrder.push(2);
    this.zigzagOrder.push(3);
    this.zigzagOrder.push(10);
    this.zigzagOrder.push(17);
    this.zigzagOrder.push(24);
    this.zigzagOrder.push(32);
    this.zigzagOrder.push(25);
    this.zigzagOrder.push(18);
    this.zigzagOrder.push(11);
    this.zigzagOrder.push(4);
    this.zigzagOrder.push(5);
    this.zigzagOrder.push(12);
    this.zigzagOrder.push(19);
    this.zigzagOrder.push(26);
    this.zigzagOrder.push(33);
    this.zigzagOrder.push(40);
    this.zigzagOrder.push(48);
    this.zigzagOrder.push(41);
    this.zigzagOrder.push(34);
    this.zigzagOrder.push(27);
    this.zigzagOrder.push(20);
    this.zigzagOrder.push(13);
    this.zigzagOrder.push(6);
    this.zigzagOrder.push(7);
    this.zigzagOrder.push(14);
    this.zigzagOrder.push(21);
    this.zigzagOrder.push(28);
    this.zigzagOrder.push(35);
    this.zigzagOrder.push(42);
    this.zigzagOrder.push(49);
    this.zigzagOrder.push(56);
    this.zigzagOrder.push(57);
    this.zigzagOrder.push(50);
    this.zigzagOrder.push(43);
    this.zigzagOrder.push(36);
    this.zigzagOrder.push(29);
    this.zigzagOrder.push(22);
    this.zigzagOrder.push(15);
    this.zigzagOrder.push(23);
    this.zigzagOrder.push(30);
    this.zigzagOrder.push(37);
    this.zigzagOrder.push(44);
    this.zigzagOrder.push(51);
    this.zigzagOrder.push(58);
    this.zigzagOrder.push(59);
    this.zigzagOrder.push(52);
    this.zigzagOrder.push(45);
    this.zigzagOrder.push(38);
    this.zigzagOrder.push(31);
    this.zigzagOrder.push(39);
    this.zigzagOrder.push(46);
    this.zigzagOrder.push(53);
    this.zigzagOrder.push(60);
    this.zigzagOrder.push(61);
    this.zigzagOrder.push(54);
    this.zigzagOrder.push(47);
    this.zigzagOrder.push(55);
    this.zigzagOrder.push(62);
    this.zigzagOrder.push(63);
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
    let shifted = [];
    let i = 0;
    while (i < 64) {
      shifted.push((pixels[i]) - 128);
      i = i + 1;
    };
    let temp = [];
    i = 0;
    while (i < 64) {
      temp.push(0);
      i = i + 1;
    };
    let row = 0;
    while (row < 8) {
      const rowStart = row * 8;
      this.dct1d(shifted, rowStart, 1, temp, rowStart, 1);
      row = row + 1;
    };
    let coeffs = [];
    i = 0;
    while (i < 64) {
      coeffs.push(0);
      i = i + 1;
    };
    let col = 0;
    while (col < 8) {
      this.dct1d(temp, col, 8, coeffs, col, 8);
      col = col + 1;
    };
    return coeffs;
  };
  zigzag (block) {
    let zigzagOut = [];
    let i = 0;
    while (i < 64) {
      const pos = this.zigzagOrder[i];
      zigzagOut.push(block[pos]);
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
    let quantized = [];
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
      quantized.push(qVal);
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
    let output = [];
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
          output.push(y);
        }
        if ( channel == 1 ) {
          output.push(cb);
        }
        if ( channel == 2 ) {
          output.push(cr);
        }
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
class EmbeddedFont  {
  constructor(n, pn, font) {
    this.name = "";
    this.fontObjNum = 0;     /** note: unused */
    this.fontDescObjNum = 0;     /** note: unused */
    this.fontFileObjNum = 0;     /** note: unused */
    this.pdfName = "";
    this.name = n;
    this.pdfName = pn;
    this.ttfFont = font;
  }
}
class EmbeddedImage  {
  constructor(s) {
    this.src = "";
    this.objNum = 0;
    this.width = 0;
    this.height = 0;
    this.orientation = 1;
    this.pdfName = "";
    this.src = s;
  }
}
class EVGPDFRenderer  extends EVGImageMeasurer {
  constructor() {
    super()
    this.pageWidth = 595.0;
    this.pageHeight = 842.0;
    this.nextObjNum = 1;
    this.fontObjNum = 0;     /** note: unused */
    this.pagesObjNum = 0;
    this.contentObjNums = [];
    this.pageCount = 1;     /** note: unused */
    this.debug = false;
    this.fontManager = new FontManager();
    this.embeddedFonts = [];
    this.usedFontNames = [];
    this.embeddedImages = [];
    this.jpegReader = new JPEGReader();     /** note: unused */
    this.jpegDecoder = new JPEGDecoder();
    this.jpegEncoder = new JPEGEncoder();
    this.metadataParser = new JPEGMetadataParser();
    this.baseDir = "./";
    this.maxImageWidth = 800;
    this.maxImageHeight = 800;
    this.jpegQuality = 75;
    this.imageDimensionsCache = [];
    this.imageDimensionsCacheKeys = [];
    const w = new PDFWriter();
    this.writer = w;
    const lay = new EVGLayout();
    this.layout = lay;
    const m_1 = new SimpleTextMeasurer();
    this.measurer = m_1;
    const buf_1 = new GrowableBuffer();
    this.streamBuffer = buf_1;
    let ef = [];
    this.embeddedFonts = ef;
    let uf = [];
    this.usedFontNames = uf;
    let ei = [];
    this.embeddedImages = ei;
    let idc = [];
    this.imageDimensionsCache = idc;
    let idck = [];
    this.imageDimensionsCacheKeys = idck;
    this.layout.setImageMeasurer(this);
  }
  setPageSize (width, height) {
    this.pageWidth = width;
    this.pageHeight = height;
    this.layout.setPageSize(width, height);
  };
  setBaseDir (dir) {
    this.baseDir = dir;
  };
  setMeasurer (m) {
    this.measurer = m;
    this.layout.setMeasurer(m);
  };
  setFontManager (fm) {
    this.fontManager = fm;
  };
  setDebug (enabled) {
    this.layout.debug = enabled;
    this.debug = enabled;
  };
  getImageDimensions (src) {
    let i = 0;
    while (i < (this.imageDimensionsCacheKeys.length)) {
      const key = this.imageDimensionsCacheKeys[i];
      if ( key == src ) {
        return this.imageDimensionsCache[i];
      }
      i = i + 1;
    };
    let dims = new EVGImageDimensions();
    let imgDir = "";
    let imgFile = "";
    let imgSrc = src;
    if ( (src.length) > 2 ) {
      const prefix = src.substring(0, 2 );
      if ( prefix == "./" ) {
        imgSrc = src.substring(2, (src.length) );
      }
    }
    const lastSlash = imgSrc.lastIndexOf("/");
    const lastBackslash = imgSrc.lastIndexOf("\\");
    let lastSep = lastSlash;
    if ( lastBackslash > lastSep ) {
      lastSep = lastBackslash;
    }
    if ( lastSep >= 0 ) {
      imgDir = this.baseDir + (imgSrc.substring(0, (lastSep + 1) ));
      imgFile = imgSrc.substring((lastSep + 1), (imgSrc.length) );
    } else {
      imgDir = this.baseDir;
      imgFile = imgSrc;
    }
    const reader = new JPEGReader();
    const jpegImage = reader.readJPEG(imgDir, imgFile);
    if ( jpegImage.isValid ) {
      const metaInfo = this.metadataParser.parseMetadata(imgDir, imgFile);
      const orientation = metaInfo.orientation;
      let imgW = jpegImage.width;
      let imgH = jpegImage.height;
      if ( (((orientation == 5) || (orientation == 6)) || (orientation == 7)) || (orientation == 8) ) {
        const tmp = imgW;
        imgW = imgH;
        imgH = tmp;
      }
      dims = EVGImageDimensions.create(imgW, imgH);
      console.log(((((((("Image dimensions: " + src) + " = ") + ((imgW.toString()))) + "x") + ((imgH.toString()))) + " (orientation=") + ((orientation.toString()))) + ")");
    }
    this.imageDimensionsCacheKeys.push(src);
    this.imageDimensionsCache.push(dims);
    return dims;
  };
  getPdfFontName (fontFamily) {
    let i = 0;
    while (i < (this.usedFontNames.length)) {
      const name = this.usedFontNames[i];
      if ( name == fontFamily ) {
        return "/F" + (((i + 1).toString()));
      }
      i = i + 1;
    };
    this.usedFontNames.push(fontFamily);
    return "/F" + (((this.usedFontNames.length).toString()));
  };
  render (root) {
    if ( root.tagName == "print" ) {
      return this.renderMultiPageToPDF(root);
    }
    this.layout.layout(root);
    return this.renderToPDF(root);
  };
  findPageElements (el, pages) {
    if ( el.tagName == "page" ) {
      pages.push(el);
    }
    let i = 0;
    const childCount = el.getChildCount();
    while (i < childCount) {
      const child = el.getChild(i);
      this.findPageElements(child, pages);
      i = i + 1;
    };
  };
  findSectionElements (el, sections) {
    let i = 0;
    const childCount = el.getChildCount();
    while (i < childCount) {
      const child = el.getChild(i);
      if ( child.tagName == "section" ) {
        sections.push(child);
      }
      i = i + 1;
    };
  };
  getSectionPageWidth (section) {
    if ( section.width.isSet ) {
      return section.width.pixels;
    }
    return 595.0;
  };
  getSectionPageHeight (section) {
    if ( section.height.isSet ) {
      return section.height.pixels;
    }
    return 842.0;
  };
  getSectionMargin (section) {
    const m = section.box.marginTop;
    if ( m.isSet ) {
      return m.pixels;
    }
    return 40.0;
  };
  renderMultiPageToPDF (root) {
    const pdf = new GrowableBuffer();
    this.nextObjNum = 1;
    this.contentObjNums.length = 0;
    this.usedFontNames.length = 0;
    this.embeddedFonts.length = 0;
    this.embeddedImages.length = 0;
    pdf.writeString("%PDF-1.5\n");
    pdf.writeByte(37);
    pdf.writeByte(226);
    pdf.writeByte(227);
    pdf.writeByte(207);
    pdf.writeByte(211);
    pdf.writeByte(10);
    let objectOffsets = [];
    let sections = [];
    this.findSectionElements(root, sections);
    let allPages = [];
    let allPageWidths = [];
    let allPageHeights = [];
    let allPageMargins = [];
    let si = 0;
    while (si < (sections.length)) {
      const section = sections[si];
      const sectionWidth = this.getSectionPageWidth(section);
      const sectionHeight = this.getSectionPageHeight(section);
      const sectionMargin = this.getSectionMargin(section);
      let pages = [];
      this.findPageElements(section, pages);
      let pi = 0;
      while (pi < (pages.length)) {
        const pg = pages[pi];
        allPages.push(pg);
        allPageWidths.push(sectionWidth);
        allPageHeights.push(sectionHeight);
        allPageMargins.push(sectionMargin);
        const contentWidth = sectionWidth - (sectionMargin * 2.0);
        const contentHeight = sectionHeight - (sectionMargin * 2.0);
        console.log((((("Page " + (((pi + 1).toString()))) + " content size: ") + ((contentWidth.toString()))) + " x ") + ((contentHeight.toString())));
        this.layout.pageWidth = contentWidth;
        this.layout.pageHeight = contentHeight;
        pg.resetLayoutState();
        pg.width.pixels = contentWidth;
        pg.width.value = contentWidth;
        pg.width.unitType = 0;
        pg.width.isSet = true;
        pg.height.pixels = contentHeight;
        pg.height.value = contentHeight;
        pg.height.unitType = 0;
        pg.height.isSet = true;
        this.layout.layout(pg);
        console.log((("  After layout: pg.calculatedWidth=" + ((pg.calculatedWidth.toString()))) + " pg.calculatedHeight=") + ((pg.calculatedHeight.toString())));
        if ( pg.getChildCount() > 0 ) {
          const firstChild = pg.getChild(0);
          console.log((("  First child: w=" + ((firstChild.calculatedWidth.toString()))) + " h=") + ((firstChild.calculatedHeight.toString())));
        }
        pi = pi + 1;
      };
      si = si + 1;
    };
    if ( (allPages.length) == 0 ) {
      this.layout.layout(root);
      allPages.push(root);
      allPageWidths.push(this.pageWidth);
      allPageHeights.push(this.pageHeight);
      allPageMargins.push(0.0);
    }
    const numPages = allPages.length;
    console.log(("Rendering " + ((numPages.toString()))) + " pages");
    let contentDataList = [];
    let pgi = 0;
    while (pgi < numPages) {
      const pg_1 = allPages[pgi];
      const pgWidth = allPageWidths[pgi];
      const pgHeight = allPageHeights[pgi];
      const pgMargin = allPageMargins[pgi];
      this.pageHeight = pgHeight;
      (this.streamBuffer).clear();
      this.renderElement(pg_1, pgMargin, pgMargin);
      const contentData = this.streamBuffer.toBuffer();
      contentDataList.push(contentData);
      console.log(((("  Page " + (((pgi + 1).toString()))) + ": ") + (((contentData.byteLength).toString()))) + " bytes");
      pgi = pgi + 1;
    };
    let fontObjNums = [];
    let fi = 0;
    while (fi < (this.usedFontNames.length)) {
      const fontName = this.usedFontNames[fi];
      const ttfFont = this.fontManager.getFont(fontName);
      if ( ttfFont.unitsPerEm > 0 ) {
        const fontFileData = ttfFont.getFontData();
        const fontFileLen = fontFileData.byteLength;
        objectOffsets.push((pdf).size());
        pdf.writeString(((this.nextObjNum.toString())) + " 0 obj\n");
        pdf.writeString(((("<< /Length " + ((fontFileLen.toString()))) + " /Length1 ") + ((fontFileLen.toString()))) + " >>\n");
        pdf.writeString("stream\n");
        pdf.writeBuffer(fontFileData);
        pdf.writeString("\nendstream\n");
        pdf.writeString("endobj\n\n");
        const fontFileObjNum = this.nextObjNum;
        this.nextObjNum = this.nextObjNum + 1;
        objectOffsets.push((pdf).size());
        pdf.writeString(((this.nextObjNum.toString())) + " 0 obj\n");
        pdf.writeString("<< /Type /FontDescriptor");
        pdf.writeString(" /FontName /" + this.sanitizeFontName(ttfFont.fontFamily));
        pdf.writeString(" /Flags 32");
        pdf.writeString((((" /FontBBox [0 " + ((ttfFont.descender.toString()))) + " 1000 ") + ((ttfFont.ascender.toString()))) + "]");
        pdf.writeString(" /ItalicAngle 0");
        pdf.writeString(" /Ascent " + ((ttfFont.ascender.toString())));
        pdf.writeString(" /Descent " + ((ttfFont.descender.toString())));
        pdf.writeString(" /CapHeight " + ((ttfFont.ascender.toString())));
        pdf.writeString(" /StemV 80");
        pdf.writeString((" /FontFile2 " + ((fontFileObjNum.toString()))) + " 0 R");
        pdf.writeString(" >>\n");
        pdf.writeString("endobj\n\n");
        const fontDescObjNum = this.nextObjNum;
        this.nextObjNum = this.nextObjNum + 1;
        objectOffsets.push((pdf).size());
        pdf.writeString(((this.nextObjNum.toString())) + " 0 obj\n");
        let toUnicodeStream = "/CIDInit /ProcSet findresource begin\n12 dict begin\nbegincmap\n/CIDSystemInfo << /Registry (Adobe) /Ordering (UCS) /Supplement 0 >> def\n/CMapName /Adobe-Identity-UCS def\n/CMapType 2 def\n1 begincodespacerange\n<00> <FF>\nendcodespacerange\n";
        toUnicodeStream = toUnicodeStream + "2 beginbfrange\n<20> <7E> <0020>\n<A0> <FF> <00A0>\nendbfrange\n";
        toUnicodeStream = toUnicodeStream + "endcmap\nCMapName currentdict /CMap defineresource pop\nend\nend";
        const toUnicodeLen = toUnicodeStream.length;
        pdf.writeString(("<< /Length " + ((toUnicodeLen.toString()))) + " >>\n");
        pdf.writeString("stream\n");
        pdf.writeString(toUnicodeStream);
        pdf.writeString("\nendstream\n");
        pdf.writeString("endobj\n\n");
        const toUnicodeObjNum = this.nextObjNum;
        this.nextObjNum = this.nextObjNum + 1;
        objectOffsets.push((pdf).size());
        pdf.writeString(((this.nextObjNum.toString())) + " 0 obj\n");
        pdf.writeString("<< /Type /Font");
        pdf.writeString(" /Subtype /TrueType");
        pdf.writeString(" /BaseFont /" + this.sanitizeFontName(ttfFont.fontFamily));
        pdf.writeString(" /FirstChar 32");
        pdf.writeString(" /LastChar 255");
        pdf.writeString(" /Widths [");
        let ch = 32;
        while (ch <= 255) {
          const cw = ttfFont.getCharWidth(ch);
          const scaledWd = ((cw) * 1000.0) / (ttfFont.unitsPerEm);
          const scaledW = Math.floor( scaledWd);
          pdf.writeString((scaledW.toString()));
          if ( ch < 255 ) {
            pdf.writeString(" ");
          }
          ch = ch + 1;
        };
        pdf.writeString("]");
        pdf.writeString((" /FontDescriptor " + ((fontDescObjNum.toString()))) + " 0 R");
        pdf.writeString(" /Encoding /WinAnsiEncoding");
        pdf.writeString((" /ToUnicode " + ((toUnicodeObjNum.toString()))) + " 0 R");
        pdf.writeString(" >>\n");
        pdf.writeString("endobj\n\n");
        fontObjNums.push(this.nextObjNum);
        this.nextObjNum = this.nextObjNum + 1;
      } else {
        objectOffsets.push((pdf).size());
        pdf.writeString(((this.nextObjNum.toString())) + " 0 obj\n");
        pdf.writeString("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\n");
        pdf.writeString("endobj\n\n");
        fontObjNums.push(this.nextObjNum);
        this.nextObjNum = this.nextObjNum + 1;
      }
      fi = fi + 1;
    };
    if ( (fontObjNums.length) == 0 ) {
      objectOffsets.push((pdf).size());
      pdf.writeString(((this.nextObjNum.toString())) + " 0 obj\n");
      pdf.writeString("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\n");
      pdf.writeString("endobj\n\n");
      fontObjNums.push(this.nextObjNum);
      this.nextObjNum = this.nextObjNum + 1;
    }
    let imgIdx = 0;
    while (imgIdx < (this.embeddedImages.length)) {
      const embImg = this.embeddedImages[imgIdx];
      let imgSrc = embImg.src;
      let imgDir = this.baseDir;
      let imgFile = imgSrc;
      if ( (imgSrc.length) > 2 ) {
        const prefix = imgSrc.substring(0, 2 );
        if ( prefix == "./" ) {
          imgSrc = imgSrc.substring(2, (imgSrc.length) );
        }
      }
      const lastSlash = imgSrc.lastIndexOf("/");
      const lastBackslash = imgSrc.lastIndexOf("\\");
      let lastSep = lastSlash;
      if ( lastBackslash > lastSep ) {
        lastSep = lastBackslash;
      }
      if ( lastSep >= 0 ) {
        imgDir = this.baseDir + (imgSrc.substring(0, (lastSep + 1) ));
        imgFile = imgSrc.substring((lastSep + 1), (imgSrc.length) );
      } else {
        imgDir = this.baseDir;
        imgFile = imgSrc;
      }
      console.log((("Loading image: dir=" + imgDir) + " file=") + imgFile);
      const metaInfo = this.metadataParser.parseMetadata(imgDir, imgFile);
      embImg.orientation = metaInfo.orientation;
      let imgBuffer = this.jpegDecoder.decode(imgDir, imgFile);
      if ( (imgBuffer.width > 1) && (imgBuffer.height > 1) ) {
        if ( metaInfo.orientation > 1 ) {
          console.log("  Applying EXIF orientation: " + ((metaInfo.orientation.toString())));
          imgBuffer = imgBuffer.applyExifOrientation(metaInfo.orientation);
        }
        const origW = imgBuffer.width;
        const origH = imgBuffer.height;
        let newW = origW;
        let newH = origH;
        if ( (origW > this.maxImageWidth) || (origH > this.maxImageHeight) ) {
          const scaleW = (this.maxImageWidth) / (origW);
          const scaleH = (this.maxImageHeight) / (origH);
          let scale = scaleW;
          if ( scaleH < scaleW ) {
            scale = scaleH;
          }
          newW = Math.floor( ((origW) * scale));
          newH = Math.floor( ((origH) * scale));
          console.log((((((("  Resizing from " + ((origW.toString()))) + "x") + ((origH.toString()))) + " to ") + ((newW.toString()))) + "x") + ((newH.toString())));
          imgBuffer = imgBuffer.scaleToSize(newW, newH);
        }
        this.jpegEncoder.setQuality(this.jpegQuality);
        const encodedData = this.jpegEncoder.encodeToBuffer(imgBuffer);
        const encodedLen = encodedData.byteLength;
        embImg.width = newW;
        embImg.height = newH;
        objectOffsets.push((pdf).size());
        pdf.writeString(((this.nextObjNum.toString())) + " 0 obj\n");
        pdf.writeString("<< /Type /XObject");
        pdf.writeString(" /Subtype /Image");
        pdf.writeString(" /Width " + ((newW.toString())));
        pdf.writeString(" /Height " + ((newH.toString())));
        pdf.writeString(" /ColorSpace /DeviceRGB");
        pdf.writeString(" /BitsPerComponent 8");
        pdf.writeString(" /Filter /DCTDecode");
        pdf.writeString(" /Length " + ((encodedLen.toString())));
        pdf.writeString(" >>\n");
        pdf.writeString("stream\n");
        pdf.writeBuffer(encodedData);
        pdf.writeString("\nendstream\n");
        pdf.writeString("endobj\n\n");
        embImg.objNum = this.nextObjNum;
        embImg.pdfName = "/Im" + (((imgIdx + 1).toString()));
        this.nextObjNum = this.nextObjNum + 1;
        console.log(((((("Embedded image: " + embImg.src) + " (") + ((newW.toString()))) + "x") + ((newH.toString()))) + ")");
      } else {
        console.log("Failed to decode image: " + embImg.src);
      }
      imgIdx = imgIdx + 1;
    };
    let contentObjNumList = [];
    let ci = 0;
    while (ci < numPages) {
      const contentData_1 = contentDataList[ci];
      const contentLen = contentData_1.byteLength;
      objectOffsets.push((pdf).size());
      pdf.writeString(((this.nextObjNum.toString())) + " 0 obj\n");
      pdf.writeString(("<< /Length " + ((contentLen.toString()))) + " >>\n");
      pdf.writeString("stream\n");
      pdf.writeBuffer(contentData_1);
      pdf.writeString("\nendstream\n");
      pdf.writeString("endobj\n\n");
      contentObjNumList.push(this.nextObjNum);
      this.nextObjNum = this.nextObjNum + 1;
      ci = ci + 1;
    };
    let pageObjNumList = [];
    const pagesRefNum = this.nextObjNum + numPages;
    let pi2 = 0;
    while (pi2 < numPages) {
      const pgWidth_1 = allPageWidths[pi2];
      const pgHeight_1 = allPageHeights[pi2];
      const contentObjN = contentObjNumList[pi2];
      objectOffsets.push((pdf).size());
      pdf.writeString(((this.nextObjNum.toString())) + " 0 obj\n");
      pdf.writeString(("<< /Type /Page /Parent " + ((pagesRefNum.toString()))) + " 0 R");
      pdf.writeString((((" /MediaBox [0 0 " + this.formatNum(pgWidth_1)) + " ") + this.formatNum(pgHeight_1)) + "]");
      pdf.writeString((" /Contents " + ((contentObjN.toString()))) + " 0 R");
      pdf.writeString(" /Resources <<");
      pdf.writeString(" /Font <<");
      let ffi = 0;
      while (ffi < (fontObjNums.length)) {
        const fontObjN = fontObjNums[ffi];
        pdf.writeString((((" /F" + (((ffi + 1).toString()))) + " ") + ((fontObjN.toString()))) + " 0 R");
        ffi = ffi + 1;
      };
      pdf.writeString(" >>");
      if ( (this.embeddedImages.length) > 0 ) {
        pdf.writeString(" /XObject <<");
        let ii = 0;
        while (ii < (this.embeddedImages.length)) {
          const embImg_1 = this.embeddedImages[ii];
          if ( embImg_1.objNum > 0 ) {
            pdf.writeString((((" /Im" + (((ii + 1).toString()))) + " ") + ((embImg_1.objNum.toString()))) + " 0 R");
          }
          ii = ii + 1;
        };
        pdf.writeString(" >>");
      }
      pdf.writeString(" >> >>\n");
      pdf.writeString("endobj\n\n");
      pageObjNumList.push(this.nextObjNum);
      this.nextObjNum = this.nextObjNum + 1;
      pi2 = pi2 + 1;
    };
    objectOffsets.push((pdf).size());
    pdf.writeString(((this.nextObjNum.toString())) + " 0 obj\n");
    pdf.writeString("<< /Type /Pages /Kids [");
    let ki = 0;
    while (ki < numPages) {
      const pageObjN = pageObjNumList[ki];
      pdf.writeString(((pageObjN.toString())) + " 0 R");
      if ( ki < (numPages - 1) ) {
        pdf.writeString(" ");
      }
      ki = ki + 1;
    };
    pdf.writeString(("] /Count " + ((numPages.toString()))) + " >>\n");
    pdf.writeString("endobj\n\n");
    this.pagesObjNum = this.nextObjNum;
    this.nextObjNum = this.nextObjNum + 1;
    objectOffsets.push((pdf).size());
    pdf.writeString(((this.nextObjNum.toString())) + " 0 obj\n");
    pdf.writeString(("<< /Type /Catalog /Pages " + ((this.pagesObjNum.toString()))) + " 0 R >>\n");
    pdf.writeString("endobj\n\n");
    const catalogObjNum = this.nextObjNum;
    this.nextObjNum = this.nextObjNum + 1;
    const xrefOffset = (pdf).size();
    pdf.writeString("xref\n");
    pdf.writeString(("0 " + ((this.nextObjNum.toString()))) + "\n");
    pdf.writeString("0000000000 65535 f \n");
    let xi = 0;
    while (xi < (objectOffsets.length)) {
      const offset = objectOffsets[xi];
      pdf.writeString(this.padLeft(((offset.toString())), 10, "0") + " 00000 n \n");
      xi = xi + 1;
    };
    pdf.writeString("trailer\n");
    pdf.writeString(((("<< /Size " + ((this.nextObjNum.toString()))) + " /Root ") + ((catalogObjNum.toString()))) + " 0 R >>\n");
    pdf.writeString("startxref\n");
    pdf.writeString(((xrefOffset.toString())) + "\n");
    pdf.writeString("%%EOF\n");
    return pdf.toBuffer();
  };
  renderToPDF (root) {
    const pdf = new GrowableBuffer();
    this.nextObjNum = 1;
    this.contentObjNums.length = 0;
    this.usedFontNames.length = 0;
    this.embeddedFonts.length = 0;
    this.embeddedImages.length = 0;
    pdf.writeString("%PDF-1.5\n");
    pdf.writeByte(37);
    pdf.writeByte(226);
    pdf.writeByte(227);
    pdf.writeByte(207);
    pdf.writeByte(211);
    pdf.writeByte(10);
    let objectOffsets = [];
    (this.streamBuffer).clear();
    this.renderElement(root, 0.0, 0.0);
    const contentData = this.streamBuffer.toBuffer();
    const contentLen = contentData.byteLength;
    let fontObjNums = [];
    let i = 0;
    while (i < (this.usedFontNames.length)) {
      const fontName = this.usedFontNames[i];
      const ttfFont = this.fontManager.getFont(fontName);
      if ( ttfFont.unitsPerEm > 0 ) {
        const fontFileData = ttfFont.getFontData();
        const fontFileLen = fontFileData.byteLength;
        objectOffsets.push((pdf).size());
        pdf.writeString(((this.nextObjNum.toString())) + " 0 obj\n");
        pdf.writeString(((("<< /Length " + ((fontFileLen.toString()))) + " /Length1 ") + ((fontFileLen.toString()))) + " >>\n");
        pdf.writeString("stream\n");
        pdf.writeBuffer(fontFileData);
        pdf.writeString("\nendstream\n");
        pdf.writeString("endobj\n\n");
        const fontFileObjNum = this.nextObjNum;
        this.nextObjNum = this.nextObjNum + 1;
        objectOffsets.push((pdf).size());
        pdf.writeString(((this.nextObjNum.toString())) + " 0 obj\n");
        pdf.writeString("<< /Type /FontDescriptor");
        pdf.writeString(" /FontName /" + this.sanitizeFontName(ttfFont.fontFamily));
        pdf.writeString(" /Flags 32");
        pdf.writeString((((" /FontBBox [0 " + ((ttfFont.descender.toString()))) + " 1000 ") + ((ttfFont.ascender.toString()))) + "]");
        pdf.writeString(" /ItalicAngle 0");
        pdf.writeString(" /Ascent " + ((ttfFont.ascender.toString())));
        pdf.writeString(" /Descent " + ((ttfFont.descender.toString())));
        pdf.writeString(" /CapHeight " + ((ttfFont.ascender.toString())));
        pdf.writeString(" /StemV 80");
        pdf.writeString((" /FontFile2 " + ((fontFileObjNum.toString()))) + " 0 R");
        pdf.writeString(" >>\n");
        pdf.writeString("endobj\n\n");
        const fontDescObjNum = this.nextObjNum;
        this.nextObjNum = this.nextObjNum + 1;
        objectOffsets.push((pdf).size());
        pdf.writeString(((this.nextObjNum.toString())) + " 0 obj\n");
        let toUnicodeStream = "/CIDInit /ProcSet findresource begin\n12 dict begin\nbegincmap\n/CIDSystemInfo << /Registry (Adobe) /Ordering (UCS) /Supplement 0 >> def\n/CMapName /Adobe-Identity-UCS def\n/CMapType 2 def\n1 begincodespacerange\n<00> <FF>\nendcodespacerange\n";
        toUnicodeStream = toUnicodeStream + "2 beginbfrange\n<20> <7E> <0020>\n<A0> <FF> <00A0>\nendbfrange\n";
        toUnicodeStream = toUnicodeStream + "endcmap\nCMapName currentdict /CMap defineresource pop\nend\nend";
        const toUnicodeLen = toUnicodeStream.length;
        pdf.writeString(("<< /Length " + ((toUnicodeLen.toString()))) + " >>\n");
        pdf.writeString("stream\n");
        pdf.writeString(toUnicodeStream);
        pdf.writeString("\nendstream\n");
        pdf.writeString("endobj\n\n");
        const toUnicodeObjNum = this.nextObjNum;
        this.nextObjNum = this.nextObjNum + 1;
        objectOffsets.push((pdf).size());
        pdf.writeString(((this.nextObjNum.toString())) + " 0 obj\n");
        pdf.writeString("<< /Type /Font");
        pdf.writeString(" /Subtype /TrueType");
        pdf.writeString(" /BaseFont /" + this.sanitizeFontName(ttfFont.fontFamily));
        pdf.writeString(" /FirstChar 32");
        pdf.writeString(" /LastChar 255");
        pdf.writeString(" /Widths [");
        let ch = 32;
        while (ch <= 255) {
          const w = ttfFont.getCharWidth(ch);
          const scaledWd = ((w) * 1000.0) / (ttfFont.unitsPerEm);
          const scaledW = Math.floor( scaledWd);
          pdf.writeString((scaledW.toString()));
          if ( ch < 255 ) {
            pdf.writeString(" ");
          }
          ch = ch + 1;
        };
        pdf.writeString("]");
        pdf.writeString((" /FontDescriptor " + ((fontDescObjNum.toString()))) + " 0 R");
        pdf.writeString(" /Encoding /WinAnsiEncoding");
        pdf.writeString((" /ToUnicode " + ((toUnicodeObjNum.toString()))) + " 0 R");
        pdf.writeString(" >>\n");
        pdf.writeString("endobj\n\n");
        fontObjNums.push(this.nextObjNum);
        this.nextObjNum = this.nextObjNum + 1;
      } else {
        objectOffsets.push((pdf).size());
        pdf.writeString(((this.nextObjNum.toString())) + " 0 obj\n");
        pdf.writeString("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\n");
        pdf.writeString("endobj\n\n");
        fontObjNums.push(this.nextObjNum);
        this.nextObjNum = this.nextObjNum + 1;
      }
      i = i + 1;
    };
    if ( (fontObjNums.length) == 0 ) {
      objectOffsets.push((pdf).size());
      pdf.writeString(((this.nextObjNum.toString())) + " 0 obj\n");
      pdf.writeString("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\n");
      pdf.writeString("endobj\n\n");
      fontObjNums.push(this.nextObjNum);
      this.nextObjNum = this.nextObjNum + 1;
    }
    let imgIdx = 0;
    while (imgIdx < (this.embeddedImages.length)) {
      const embImg = this.embeddedImages[imgIdx];
      let imgSrc = embImg.src;
      let imgDir = this.baseDir;
      let imgFile = imgSrc;
      if ( (imgSrc.length) > 2 ) {
        const prefix = imgSrc.substring(0, 2 );
        if ( prefix == "./" ) {
          imgSrc = imgSrc.substring(2, (imgSrc.length) );
        }
      }
      const lastSlash = imgSrc.lastIndexOf("/");
      const lastBackslash = imgSrc.lastIndexOf("\\");
      let lastSep = lastSlash;
      if ( lastBackslash > lastSep ) {
        lastSep = lastBackslash;
      }
      if ( lastSep >= 0 ) {
        imgDir = this.baseDir + (imgSrc.substring(0, (lastSep + 1) ));
        imgFile = imgSrc.substring((lastSep + 1), (imgSrc.length) );
      } else {
        imgDir = this.baseDir;
        imgFile = imgSrc;
      }
      console.log((("Loading image: dir=" + imgDir) + " file=") + imgFile);
      const metaInfo = this.metadataParser.parseMetadata(imgDir, imgFile);
      embImg.orientation = metaInfo.orientation;
      let imgBuffer = this.jpegDecoder.decode(imgDir, imgFile);
      if ( (imgBuffer.width > 1) && (imgBuffer.height > 1) ) {
        if ( metaInfo.orientation > 1 ) {
          console.log("  Applying EXIF orientation: " + ((metaInfo.orientation.toString())));
          imgBuffer = imgBuffer.applyExifOrientation(metaInfo.orientation);
        }
        const origW = imgBuffer.width;
        const origH = imgBuffer.height;
        let newW = origW;
        let newH = origH;
        if ( (origW > this.maxImageWidth) || (origH > this.maxImageHeight) ) {
          const scaleW = (this.maxImageWidth) / (origW);
          const scaleH = (this.maxImageHeight) / (origH);
          let scale = scaleW;
          if ( scaleH < scaleW ) {
            scale = scaleH;
          }
          newW = Math.floor( ((origW) * scale));
          newH = Math.floor( ((origH) * scale));
          console.log((((((("  Resizing from " + ((origW.toString()))) + "x") + ((origH.toString()))) + " to ") + ((newW.toString()))) + "x") + ((newH.toString())));
          imgBuffer = imgBuffer.scaleToSize(newW, newH);
        }
        this.jpegEncoder.setQuality(this.jpegQuality);
        const encodedData = this.jpegEncoder.encodeToBuffer(imgBuffer);
        const encodedLen = encodedData.byteLength;
        embImg.width = newW;
        embImg.height = newH;
        objectOffsets.push((pdf).size());
        pdf.writeString(((this.nextObjNum.toString())) + " 0 obj\n");
        pdf.writeString("<< /Type /XObject");
        pdf.writeString(" /Subtype /Image");
        pdf.writeString(" /Width " + ((newW.toString())));
        pdf.writeString(" /Height " + ((newH.toString())));
        pdf.writeString(" /ColorSpace /DeviceRGB");
        pdf.writeString(" /BitsPerComponent 8");
        pdf.writeString(" /Filter /DCTDecode");
        pdf.writeString(" /Length " + ((encodedLen.toString())));
        pdf.writeString(" >>\n");
        pdf.writeString("stream\n");
        pdf.writeBuffer(encodedData);
        pdf.writeString("\nendstream\n");
        pdf.writeString("endobj\n\n");
        embImg.objNum = this.nextObjNum;
        embImg.pdfName = "/Im" + (((imgIdx + 1).toString()));
        this.nextObjNum = this.nextObjNum + 1;
        console.log(((((((("Embedded image: " + imgSrc) + " (resized to ") + ((newW.toString()))) + "x") + ((newH.toString()))) + ", ") + ((encodedLen.toString()))) + " bytes)");
      } else {
        console.log("Failed to decode image: " + imgSrc);
      }
      imgIdx = imgIdx + 1;
    };
    objectOffsets.push((pdf).size());
    pdf.writeString(((this.nextObjNum.toString())) + " 0 obj\n");
    pdf.writeString(("<< /Length " + ((contentLen.toString()))) + " >>\n");
    pdf.writeString("stream\n");
    pdf.writeBuffer(contentData);
    pdf.writeString("\nendstream\n");
    pdf.writeString("endobj\n\n");
    const contentObjNum = this.nextObjNum;
    this.nextObjNum = this.nextObjNum + 1;
    objectOffsets.push((pdf).size());
    pdf.writeString(((this.nextObjNum.toString())) + " 0 obj\n");
    const pagesRef = this.nextObjNum + 1;
    pdf.writeString(("<< /Type /Page /Parent " + ((pagesRef.toString()))) + " 0 R");
    pdf.writeString((((" /MediaBox [0 0 " + this.formatNum(this.pageWidth)) + " ") + this.formatNum(this.pageHeight)) + "]");
    pdf.writeString((" /Contents " + ((contentObjNum.toString()))) + " 0 R");
    pdf.writeString(" /Resources <<");
    pdf.writeString(" /Font <<");
    let fi = 0;
    while (fi < (fontObjNums.length)) {
      const fontObjN = fontObjNums[fi];
      pdf.writeString((((" /F" + (((fi + 1).toString()))) + " ") + ((fontObjN.toString()))) + " 0 R");
      fi = fi + 1;
    };
    pdf.writeString(" >>");
    if ( (this.embeddedImages.length) > 0 ) {
      pdf.writeString(" /XObject <<");
      let ii = 0;
      while (ii < (this.embeddedImages.length)) {
        const embImg_1 = this.embeddedImages[ii];
        if ( embImg_1.objNum > 0 ) {
          pdf.writeString((((" /Im" + (((ii + 1).toString()))) + " ") + ((embImg_1.objNum.toString()))) + " 0 R");
        }
        ii = ii + 1;
      };
      pdf.writeString(" >>");
    }
    pdf.writeString(" >> >>\n");
    pdf.writeString("endobj\n\n");
    const pageObjNum = this.nextObjNum;
    this.nextObjNum = this.nextObjNum + 1;
    objectOffsets.push((pdf).size());
    pdf.writeString(((this.nextObjNum.toString())) + " 0 obj\n");
    pdf.writeString(("<< /Type /Pages /Kids [" + ((pageObjNum.toString()))) + " 0 R] /Count 1 >>\n");
    pdf.writeString("endobj\n\n");
    this.pagesObjNum = this.nextObjNum;
    this.nextObjNum = this.nextObjNum + 1;
    objectOffsets.push((pdf).size());
    pdf.writeString(((this.nextObjNum.toString())) + " 0 obj\n");
    pdf.writeString(("<< /Type /Catalog /Pages " + ((this.pagesObjNum.toString()))) + " 0 R >>\n");
    pdf.writeString("endobj\n\n");
    const catalogObjNum = this.nextObjNum;
    this.nextObjNum = this.nextObjNum + 1;
    const xrefOffset = (pdf).size();
    pdf.writeString("xref\n");
    pdf.writeString(("0 " + ((this.nextObjNum.toString()))) + "\n");
    pdf.writeString("0000000000 65535 f \n");
    let i_2 = 0;
    while (i_2 < (objectOffsets.length)) {
      const offset = objectOffsets[i_2];
      pdf.writeString(this.padLeft(((offset.toString())), 10, "0") + " 00000 n \n");
      i_2 = i_2 + 1;
    };
    pdf.writeString("trailer\n");
    pdf.writeString(((("<< /Size " + ((this.nextObjNum.toString()))) + " /Root ") + ((catalogObjNum.toString()))) + " 0 R >>\n");
    pdf.writeString("startxref\n");
    pdf.writeString(((xrefOffset.toString())) + "\n");
    pdf.writeString("%%EOF\n");
    return pdf.toBuffer();
  };
  renderElement (el, offsetX, offsetY) {
    const x = el.calculatedX + offsetX;
    const y = el.calculatedY + offsetY;
    const w = el.calculatedWidth;
    const h = el.calculatedHeight;
    const pdfY = (this.pageHeight - y) - h;
    const bgColor = el.backgroundColor;
    if ( this.debug ) {
      console.log((((("  bg check: " + el.tagName) + " isSet=") + ((bgColor.isSet.toString()))) + " r=") + ((bgColor.r.toString())));
    }
    if ( bgColor.isSet ) {
      this.renderBackground(x, pdfY, w, h, bgColor);
    }
    this.renderBorder(el, x, pdfY, w, h);
    if ( el.tagName == "text" ) {
      this.renderText(el, x, pdfY, w, h);
    }
    if ( el.tagName == "divider" ) {
      this.renderDivider(el, x, pdfY, w, h);
    }
    if ( el.tagName == "image" ) {
      this.renderImage(el, x, pdfY, w, h);
    }
    let i = 0;
    const childCount = el.getChildCount();
    while (i < childCount) {
      const child = el.getChild(i);
      this.renderElement(child, offsetX, offsetY);
      i = i + 1;
    };
  };
  getImagePdfName (src) {
    let i = 0;
    while (i < (this.embeddedImages.length)) {
      const embImg = this.embeddedImages[i];
      if ( embImg.src == src ) {
        return "/Im" + (((i + 1).toString()));
      }
      i = i + 1;
    };
    const newImg = new EmbeddedImage(src);
    this.embeddedImages.push(newImg);
    return "/Im" + (((this.embeddedImages.length).toString()));
  };
  renderImage (el, x, y, w, h) {
    const src = el.src;
    if ( (src.length) == 0 ) {
      return;
    }
    const imgName = this.getImagePdfName(src);
    this.streamBuffer.writeString("q\n");
    this.streamBuffer.writeString(((((((this.formatNum(w) + " 0 0 ") + this.formatNum(h)) + " ") + this.formatNum(x)) + " ") + this.formatNum(y)) + " cm\n");
    this.streamBuffer.writeString(imgName + " Do\n");
    this.streamBuffer.writeString("Q\n");
  };
  renderBackground (x, y, w, h, color) {
    this.streamBuffer.writeString("q\n");
    const r = color.r / 255.0;
    const g = color.g / 255.0;
    const b = color.b / 255.0;
    this.streamBuffer.writeString(((((this.formatNum(r) + " ") + this.formatNum(g)) + " ") + this.formatNum(b)) + " rg\n");
    this.streamBuffer.writeString(((((((this.formatNum(x) + " ") + this.formatNum(y)) + " ") + this.formatNum(w)) + " ") + this.formatNum(h)) + " re\n");
    this.streamBuffer.writeString("f\n");
    this.streamBuffer.writeString("Q\n");
  };
  renderBorder (el, x, y, w, h) {
    const borderWidth = el.box.borderWidth.pixels;
    if ( borderWidth <= 0.0 ) {
      return;
    }
    let borderColor = el.box.borderColor;
    if ( borderColor.isSet == false ) {
      borderColor = EVGColor.black();
    }
    this.streamBuffer.writeString("q\n");
    const r = borderColor.r / 255.0;
    const g = borderColor.g / 255.0;
    const b = borderColor.b / 255.0;
    this.streamBuffer.writeString(((((this.formatNum(r) + " ") + this.formatNum(g)) + " ") + this.formatNum(b)) + " RG\n");
    this.streamBuffer.writeString(this.formatNum(borderWidth) + " w\n");
    this.streamBuffer.writeString(((((((this.formatNum(x) + " ") + this.formatNum(y)) + " ") + this.formatNum(w)) + " ") + this.formatNum(h)) + " re\n");
    this.streamBuffer.writeString("S\n");
    this.streamBuffer.writeString("Q\n");
  };
  renderText (el, x, y, w, h) {
    const text = this.getTextContent(el);
    if ( (text.length) == 0 ) {
      return;
    }
    let fontSize = 14.0;
    if ( el.fontSize.isSet ) {
      fontSize = el.fontSize.pixels;
    }
    let color = el.color;
    if ( color.isSet == false ) {
      color = EVGColor.black();
    }
    let lineHeight = el.lineHeight;
    if ( lineHeight <= 0.0 ) {
      lineHeight = 1.2;
    }
    const lineSpacing = fontSize * lineHeight;
    let fontFamily = el.fontFamily;
    if ( (fontFamily.length) == 0 ) {
      fontFamily = "Helvetica";
    }
    const lines = this.wrapText(text, w, fontSize, fontFamily);
    const fontName = this.getPdfFontName(fontFamily);
    let lineY = (y + h) - fontSize;
    let i = 0;
    while (i < (lines.length)) {
      const line = lines[i];
      this.streamBuffer.writeString("BT\n");
      this.streamBuffer.writeString(((fontName + " ") + this.formatNum(fontSize)) + " Tf\n");
      const r = color.r / 255.0;
      const g = color.g / 255.0;
      const b = color.b / 255.0;
      this.streamBuffer.writeString(((((this.formatNum(r) + " ") + this.formatNum(g)) + " ") + this.formatNum(b)) + " rg\n");
      let textX = x;
      if ( el.textAlign == "center" ) {
        const textWidth = this.measurer.measureTextWidth(line, fontFamily, fontSize);
        textX = x + ((w - textWidth) / 2.0);
      }
      if ( el.textAlign == "right" ) {
        const textWidth_1 = this.measurer.measureTextWidth(line, fontFamily, fontSize);
        textX = (x + w) - textWidth_1;
      }
      this.streamBuffer.writeString(((this.formatNum(textX) + " ") + this.formatNum(lineY)) + " Td\n");
      this.streamBuffer.writeString(("(" + this.escapeText(line)) + ") Tj\n");
      this.streamBuffer.writeString("ET\n");
      lineY = lineY - lineSpacing;
      i = i + 1;
    };
  };
  wrapText (text, maxWidth, fontSize, fontFamily) {
    let lines = [];
    const words = text.split(" ");
    let currentLine = "";
    let i = 0;
    while (i < (words.length)) {
      const word = words[i];
      let testLine = "";
      if ( (currentLine.length) == 0 ) {
        testLine = word;
      } else {
        testLine = (currentLine + " ") + word;
      }
      const testWidth = this.measurer.measureTextWidth(testLine, fontFamily, fontSize);
      if ( (testWidth > maxWidth) && ((currentLine.length) > 0) ) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
      i = i + 1;
    };
    if ( (currentLine.length) > 0 ) {
      lines.push(currentLine);
    }
    return lines;
  };
  renderDivider (el, x, y, w, h) {
    let color = el.color;
    if ( color.isSet == false ) {
      color = EVGColor.rgb(200, 200, 200);
    }
    const lineY = y + (h / 2.0);
    this.streamBuffer.writeString("q\n");
    const r = color.r / 255.0;
    const g = color.g / 255.0;
    const b = color.b / 255.0;
    this.streamBuffer.writeString(((((this.formatNum(r) + " ") + this.formatNum(g)) + " ") + this.formatNum(b)) + " RG\n");
    this.streamBuffer.writeString("1 w\n");
    this.streamBuffer.writeString(((this.formatNum(x) + " ") + this.formatNum(lineY)) + " m\n");
    this.streamBuffer.writeString(((this.formatNum((x + w)) + " ") + this.formatNum(lineY)) + " l\n");
    this.streamBuffer.writeString("S\n");
    this.streamBuffer.writeString("Q\n");
  };
  getTextContent (el) {
    if ( (el.textContent.length) > 0 ) {
      return el.textContent;
    }
    let result = "";
    let i = 0;
    const childCount = el.getChildCount();
    while (i < childCount) {
      const child = el.getChild(i);
      if ( child.tagName == "text" ) {
        const childText = child.textContent;
        if ( (childText.length) > 0 ) {
          if ( (result.length) > 0 ) {
            const lastChar = result.charCodeAt(((result.length) - 1) );
            const firstChar = childText.charCodeAt(0 );
            if ( (lastChar != 32) && (firstChar != 32) ) {
              result = result + " ";
            }
          }
          result = result + childText;
        }
      }
      i = i + 1;
    };
    return result;
  };
  estimateTextWidth (text, fontSize) {
    return this.measurer.measureTextWidth(text, "Helvetica", fontSize);
  };
  escapeText (text) {
    let result = "";
    const __len = text.length;
    let i = 0;
    while (i < __len) {
      const ch = text.charCodeAt(i );
      if ( ch == 40 ) {
        result = result + "\\(";
      } else {
        if ( ch == 41 ) {
          result = result + "\\)";
        } else {
          if ( ch == 92 ) {
            result = result + "\\\\";
          } else {
            result = result + (String.fromCharCode(ch));
          }
        }
      }
      i = i + 1;
    };
    return result;
  };
  formatNum (n) {
    const result = (n.toString());
    return result;
  };
  padLeft (s, __len, padChar) {
    let result = s;
    while ((result.length) < __len) {
      result = padChar + result;
    };
    return result;
  };
  sanitizeFontName (name) {
    let result = "";
    const __len = name.length;
    let i = 0;
    while (i < __len) {
      const ch = name.charCodeAt(i );
      if ( (((ch >= 65) && (ch <= 90)) || ((ch >= 97) && (ch <= 122))) || ((ch >= 48) && (ch <= 57)) ) {
        result = result + (String.fromCharCode(ch));
      }
      i = i + 1;
    };
    return result;
  };
}
class EvalValue  {
  constructor() {
    this.valueType = 0;
    this.numberValue = 0.0;
    this.stringValue = "";
    this.boolValue = false;
    this.arrayValue = [];
    this.objectKeys = [];
    this.objectValues = [];
    this.functionName = "";
    this.functionBody = "";     /** note: unused */
  }
  isNull () {
    return this.valueType == 0;
  };
  isNumber () {
    return this.valueType == 1;
  };
  isString () {
    return this.valueType == 2;
  };
  isBoolean () {
    return this.valueType == 3;
  };
  isArray () {
    return this.valueType == 4;
  };
  isObject () {
    return this.valueType == 5;
  };
  isFunction () {
    return this.valueType == 6;
  };
  toNumber () {
    if ( this.valueType == 1 ) {
      return this.numberValue;
    }
    if ( this.valueType == 2 ) {
      const parsed = isNaN( parseFloat(this.stringValue) ) ? undefined : parseFloat(this.stringValue);
      return parsed;
    }
    if ( this.valueType == 3 ) {
      if ( this.boolValue ) {
        return 1.0;
      }
      return 0.0;
    }
    return 0.0;
  };
  toString () {
    if ( this.valueType == 0 ) {
      return "null";
    }
    if ( this.valueType == 1 ) {
      const s = (this.numberValue.toString());
      const intVal = Math.floor( this.numberValue);
      if ( (intVal) == this.numberValue ) {
        return (intVal.toString());
      }
      return s;
    }
    if ( this.valueType == 2 ) {
      return this.stringValue;
    }
    if ( this.valueType == 3 ) {
      if ( this.boolValue ) {
        return "true";
      }
      return "false";
    }
    if ( this.valueType == 4 ) {
      let result = "[";
      let i = 0;
      while (i < (this.arrayValue.length)) {
        if ( i > 0 ) {
          result = result + ", ";
        }
        const item = this.arrayValue[i];
        const itemStr = (item).toString();
        result = result + itemStr;
        i = i + 1;
      };
      return result + "]";
    }
    if ( this.valueType == 5 ) {
      let result_1 = "{";
      let i_1 = 0;
      while (i_1 < (this.objectKeys.length)) {
        if ( i_1 > 0 ) {
          result_1 = result_1 + ", ";
        }
        const key = this.objectKeys[i_1];
        const val = this.objectValues[i_1];
        const valStr = (val).toString();
        result_1 = ((result_1 + key) + ": ") + valStr;
        i_1 = i_1 + 1;
      };
      return result_1 + "}";
    }
    if ( this.valueType == 6 ) {
      return ("[Function: " + this.functionName) + "]";
    }
    return "undefined";
  };
  toBool () {
    if ( this.valueType == 0 ) {
      return false;
    }
    if ( this.valueType == 1 ) {
      return this.numberValue != 0.0;
    }
    if ( this.valueType == 2 ) {
      return (this.stringValue.length) > 0;
    }
    if ( this.valueType == 3 ) {
      return this.boolValue;
    }
    if ( this.valueType == 4 ) {
      return true;
    }
    if ( this.valueType == 5 ) {
      return true;
    }
    if ( this.valueType == 6 ) {
      return true;
    }
    return false;
  };
  getMember (key) {
    if ( this.valueType == 5 ) {
      let i = 0;
      while (i < (this.objectKeys.length)) {
        if ( (this.objectKeys[i]) == key ) {
          return this.objectValues[i];
        }
        i = i + 1;
      };
    }
    if ( this.valueType == 4 ) {
      if ( key == "length" ) {
        return EvalValue.fromInt((this.arrayValue.length));
      }
    }
    if ( this.valueType == 2 ) {
      if ( key == "length" ) {
        return EvalValue.fromInt((this.stringValue.length));
      }
    }
    return EvalValue.null();
  };
  getIndex (index) {
    if ( this.valueType == 4 ) {
      if ( (index >= 0) && (index < (this.arrayValue.length)) ) {
        return this.arrayValue[index];
      }
    }
    if ( this.valueType == 2 ) {
      if ( (index >= 0) && (index < (this.stringValue.length)) ) {
        const charStr = this.stringValue.substring(index, (index + 1) );
        return EvalValue.string(charStr);
      }
    }
    return EvalValue.null();
  };
  equals (other) {
    if ( this.valueType != other.valueType ) {
      return false;
    }
    if ( this.valueType == 0 ) {
      return true;
    }
    if ( this.valueType == 1 ) {
      return this.numberValue == other.numberValue;
    }
    if ( this.valueType == 2 ) {
      return this.stringValue == other.stringValue;
    }
    if ( this.valueType == 3 ) {
      return this.boolValue == other.boolValue;
    }
    return false;
  };
}
EvalValue.null = function() {
  const v = new EvalValue();
  v.valueType = 0;
  return v;
};
EvalValue.number = function(n) {
  const v = new EvalValue();
  v.valueType = 1;
  v.numberValue = n;
  return v;
};
EvalValue.fromInt = function(n) {
  const v = new EvalValue();
  v.valueType = 1;
  v.numberValue = n;
  return v;
};
EvalValue.string = function(s) {
  const v = new EvalValue();
  v.valueType = 2;
  v.stringValue = s;
  return v;
};
EvalValue.boolean = function(b) {
  const v = new EvalValue();
  v.valueType = 3;
  v.boolValue = b;
  return v;
};
EvalValue.array = function(items) {
  const v = new EvalValue();
  v.valueType = 4;
  v.arrayValue = items;
  return v;
};
EvalValue.object = function(keys, values) {
  const v = new EvalValue();
  v.valueType = 5;
  v.objectKeys = keys;
  v.objectValues = values;
  return v;
};
class ImportedSymbol  {
  constructor() {
    this.name = "";
    this.originalName = "";
    this.sourcePath = "";
    this.symbolType = "";
  }
}
class EvalContext  {
  constructor() {
    this.variables = [];
    this.values = [];
    let v = [];
    this.variables = v;
    let vl = [];
    this.values = vl;
  }
  define (name, value) {
    let i = 0;
    while (i < (this.variables.length)) {
      if ( (this.variables[i]) == name ) {
        this.values[i] = value;
        return;
      }
      i = i + 1;
    };
    this.variables.push(name);
    this.values.push(value);
  };
  lookup (name) {
    let i = 0;
    while (i < (this.variables.length)) {
      if ( (this.variables[i]) == name ) {
        return this.values[i];
      }
      i = i + 1;
    };
    if ( typeof(this.parent) != "undefined" ) {
      const p = this.parent;
      return p.lookup(name);
    }
    return EvalValue.null();
  };
  has (name) {
    let i = 0;
    while (i < (this.variables.length)) {
      if ( (this.variables[i]) == name ) {
        return true;
      }
      i = i + 1;
    };
    if ( typeof(this.parent) != "undefined" ) {
      const p = this.parent;
      return (p).has(name);
    }
    return false;
  };
  createChild () {
    const child = new EvalContext();
    child.parent = this;
    return child;
  };
}
class ComponentEngine  {
  constructor() {
    this.source = "";
    this.basePath = "./";
    this.pageWidth = 595.0;
    this.pageHeight = 842.0;
    this.imports = [];
    this.localComponents = [];
    this.primitives = [];
    const p = new TSParserSimple();
    this.parser = p;
    this.parser.tsxMode = true;
    let imp = [];
    this.imports = imp;
    let loc = [];
    this.localComponents = loc;
    const ctx = new EvalContext();
    this.context = ctx;
    let prim = [];
    this.primitives = prim;
    this.primitives.push("View");
    this.primitives.push("Label");
    this.primitives.push("Print");
    this.primitives.push("Section");
    this.primitives.push("Page");
    this.primitives.push("Image");
    this.primitives.push("Spacer");
    this.primitives.push("Divider");
    this.primitives.push("div");
    this.primitives.push("span");
    this.primitives.push("p");
    this.primitives.push("h1");
    this.primitives.push("h2");
    this.primitives.push("h3");
    this.primitives.push("img");
  }
  parseFile (dirPath, fileName) {
    this.basePath = dirPath;
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
    this.processImports(ast);
    this.registerComponents(ast);
    this.processVariables(ast);
    const renderFn = this.findRenderFunction(ast);
    if ( renderFn.nodeType == "" ) {
      console.log("Error: No render() function found");
      const empty = new EVGElement();
      return empty;
    }
    return this.evaluateFunction(renderFn);
  };
  processImports (ast) {
    let i = 0;
    while (i < (ast.children.length)) {
      const node = ast.children[i];
      if ( node.nodeType == "ImportDeclaration" ) {
        this.processImportDeclaration(node);
      }
      i = i + 1;
    };
  };
  processImportDeclaration (node) {
    let modulePath = "";
    if ( typeof(node.left) != "undefined" ) {
      const srcNode = node.left;
      modulePath = this.unquote(srcNode.value);
    }
    if ( (modulePath.length) == 0 ) {
      return;
    }
    if ( (modulePath.indexOf("evg_types")) >= 0 ) {
      return;
    }
    if ( (modulePath.indexOf("evg_")) >= 0 ) {
      return;
    }
    let importedNames = [];
    let j = 0;
    while (j < (node.children.length)) {
      const spec = node.children[j];
      if ( spec.nodeType == "ImportSpecifier" ) {
        importedNames.push(spec.name);
      }
      if ( spec.nodeType == "ImportDefaultSpecifier" ) {
        importedNames.push(spec.name);
      }
      j = j + 1;
    };
    const fullPath = this.resolveModulePath(modulePath);
    if ( (fullPath.length) == 0 ) {
      return;
    }
    const dirPath = this.basePath;
    console.log(("Loading import: " + dirPath) + fullPath);
    const fileContent = (function(){ var b = require('fs').readFileSync(dirPath + '/' + fullPath); var ab = new ArrayBuffer(b.length); var v = new Uint8Array(ab); for(var i=0;i<b.length;i++)v[i]=b[i]; ab._view = new DataView(ab); return ab; })();
    const src = (function(b){ var v = new Uint8Array(b); return String.fromCharCode.apply(null, v); })(fileContent);
    if ( (src.length) == 0 ) {
      console.log("Warning: Could not load module: " + fullPath);
      return;
    }
    const lexer = new TSLexer(src);
    const tokens = lexer.tokenize();
    const importParser = new TSParserSimple();
    importParser.initParser(tokens);
    importParser.tsxMode = true;
    const importAst = importParser.parseProgram();
    let k = 0;
    while (k < (importAst.children.length)) {
      const stmt = importAst.children[k];
      if ( stmt.nodeType == "ExportNamedDeclaration" ) {
        if ( typeof(stmt.left) != "undefined" ) {
          const declNode = stmt.left;
          if ( declNode.nodeType == "FunctionDeclaration" ) {
            const fnName = declNode.name;
            if ( this.isInList(fnName, importedNames) ) {
              const sym = new ImportedSymbol();
              sym.name = fnName;
              sym.originalName = fnName;
              sym.sourcePath = fullPath;
              sym.symbolType = "component";
              sym.functionNode = declNode;
              this.localComponents.push(sym);
              console.log((("Imported component: " + fnName) + " from ") + fullPath);
            }
          }
        }
      }
      if ( stmt.nodeType == "FunctionDeclaration" ) {
        const fnName_1 = stmt.name;
        if ( this.isInList(fnName_1, importedNames) ) {
          const sym_1 = new ImportedSymbol();
          sym_1.name = fnName_1;
          sym_1.originalName = fnName_1;
          sym_1.sourcePath = fullPath;
          sym_1.symbolType = "component";
          sym_1.functionNode = stmt;
          this.localComponents.push(sym_1);
          console.log((("Imported component: " + fnName_1) + " from ") + fullPath);
        }
      }
      k = k + 1;
    };
  };
  resolveModulePath (modulePath) {
    if ( (modulePath.indexOf("./")) == 0 ) {
      let path = modulePath.substring(2, (modulePath.length) );
      if ( (path.length) == 0 ) {
        return "";
      }
      if ( (path.indexOf(".tsx")) < 0 ) {
        if ( (path.indexOf(".ts")) < 0 ) {
          path = path + ".tsx";
        }
      }
      return path;
    }
    if ( (modulePath.indexOf(".tsx")) < 0 ) {
      if ( (modulePath.indexOf(".ts")) < 0 ) {
        return modulePath + ".tsx";
      }
    }
    return modulePath;
  };
  isInList (name, list) {
    let i = 0;
    while (i < (list.length)) {
      if ( (list[i]) == name ) {
        return true;
      }
      i = i + 1;
    };
    return false;
  };
  registerComponents (ast) {
    let i = 0;
    while (i < (ast.children.length)) {
      const node = ast.children[i];
      if ( node.nodeType == "FunctionDeclaration" ) {
        if ( node.name != "render" ) {
          const sym = new ImportedSymbol();
          sym.name = node.name;
          sym.originalName = node.name;
          sym.symbolType = "component";
          sym.functionNode = node;
          this.localComponents.push(sym);
          console.log("Registered local component: " + node.name);
        }
      }
      i = i + 1;
    };
  };
  findRenderFunction (ast) {
    const empty = new TSNode();
    let i = 0;
    while (i < (ast.children.length)) {
      const node = ast.children[i];
      if ( node.nodeType == "FunctionDeclaration" ) {
        if ( node.name == "render" ) {
          return node;
        }
      }
      i = i + 1;
    };
    return empty;
  };
  processVariables (ast) {
    let i = 0;
    while (i < (ast.children.length)) {
      const node = ast.children[i];
      if ( node.nodeType == "VariableDeclaration" ) {
        this.processVariableDeclaration(node);
      }
      i = i + 1;
    };
  };
  processVariableDeclaration (node) {
    let i = 0;
    while (i < (node.children.length)) {
      const decl = node.children[i];
      if ( decl.nodeType == "VariableDeclarator" ) {
        const varName = decl.name;
        if ( typeof(decl.init) != "undefined" ) {
          const initNode = decl.init;
          const value = this.evaluateExpr(initNode);
          this.context.define(varName, value);
          console.log((("Defined variable: " + varName) + " = ") + (value).toString());
        }
      }
      i = i + 1;
    };
  };
  evaluateFunction (fnNode) {
    const savedContext = this.context;
    this.context = this.context.createChild();
    const body = this.getFunctionBody(fnNode);
    const result = this.evaluateFunctionBody(body);
    this.context = savedContext;
    return result;
  };
  evaluateFunctionWithProps (fnNode, props) {
    const savedContext = this.context;
    this.context = this.context.createChild();
    this.bindFunctionParams(fnNode, props);
    const body = this.getFunctionBody(fnNode);
    const result = this.evaluateFunctionBody(body);
    this.context = savedContext;
    return result;
  };
  bindFunctionParams (fnNode, props) {
    let i = 0;
    while (i < (fnNode.params.length)) {
      const param = fnNode.params[i];
      if ( param.nodeType == "ObjectPattern" ) {
        this.bindObjectPattern(param, props);
      }
      if ( param.nodeType == "Parameter" ) {
        this.context.define(param.name, props);
      }
      if ( param.nodeType == "Identifier" ) {
        this.context.define(param.name, props);
      }
      i = i + 1;
    };
  };
  bindObjectPattern (pattern, props) {
    let i = 0;
    while (i < (pattern.children.length)) {
      const prop = pattern.children[i];
      if ( prop.nodeType == "Property" ) {
        const propName = prop.name;
        let propValue = props.getMember(propName);
        if ( propValue.isNull() ) {
          if ( typeof(prop.init) != "undefined" ) {
            const initNode = prop.init;
            propValue = this.evaluateExpr(initNode);
          }
        }
        this.context.define(propName, propValue);
      }
      i = i + 1;
    };
  };
  getFunctionBody (fnNode) {
    if ( typeof(fnNode.body) != "undefined" ) {
      return fnNode.body;
    }
    const empty = new TSNode();
    return empty;
  };
  evaluateFunctionBody (body) {
    const empty = new EVGElement();
    let i = 0;
    while (i < (body.children.length)) {
      const stmt = body.children[i];
      if ( stmt.nodeType == "VariableDeclaration" ) {
        this.processVariableDeclaration(stmt);
      }
      if ( stmt.nodeType == "ReturnStatement" ) {
        if ( typeof(stmt.left) != "undefined" ) {
          const returnExpr = stmt.left;
          return this.evaluateJSX(returnExpr);
        }
      }
      i = i + 1;
    };
    if ( (body.nodeType == "JSXElement") || (body.nodeType == "JSXFragment") ) {
      return this.evaluateJSX(body);
    }
    return empty;
  };
  evaluateJSX (node) {
    const element = new EVGElement();
    if ( node.nodeType == "JSXElement" ) {
      return this.evaluateJSXElement(node);
    }
    if ( node.nodeType == "JSXFragment" ) {
      element.tagName = "div";
      this.evaluateChildren(element, node);
      return element;
    }
    if ( node.nodeType == "ParenthesizedExpression" ) {
      if ( typeof(node.left) != "undefined" ) {
        const inner = node.left;
        return this.evaluateJSX(inner);
      }
    }
    return element;
  };
  evaluateJSXElement (jsxNode) {
    let tagName = "";
    if ( typeof(jsxNode.left) != "undefined" ) {
      const openingEl = jsxNode.left;
      tagName = openingEl.name;
    }
    if ( this.isComponent(tagName) ) {
      return this.expandComponent(tagName, jsxNode);
    }
    const element = new EVGElement();
    element.tagName = this.mapTagName(tagName);
    if ( typeof(jsxNode.left) != "undefined" ) {
      const openingEl_1 = jsxNode.left;
      this.evaluateAttributes(element, openingEl_1);
    }
    if ( ((tagName == "Label") || (tagName == "span")) || (tagName == "text") ) {
      element.textContent = this.evaluateTextContent(jsxNode);
    } else {
      this.evaluateChildren(element, jsxNode);
    }
    return element;
  };
  isComponent (name) {
    if ( (name.length) == 0 ) {
      return false;
    }
    let i = 0;
    while (i < (this.primitives.length)) {
      if ( (this.primitives[i]) == name ) {
        return false;
      }
      i = i + 1;
    };
    const firstChar = name.charCodeAt(0 );
    if ( (firstChar >= 65) && (firstChar <= 90) ) {
      return true;
    }
    return false;
  };
  expandComponent (name, jsxNode) {
    let i = 0;
    while (i < (this.localComponents.length)) {
      const sym = this.localComponents[i];
      if ( sym.name == name ) {
        const props = this.evaluateProps(jsxNode);
        if ( typeof(sym.functionNode) != "undefined" ) {
          const fnNode = sym.functionNode;
          return this.evaluateFunctionWithProps(fnNode, props);
        }
      }
      i = i + 1;
    };
    console.log("Warning: Unknown component: " + name);
    const empty = new EVGElement();
    empty.tagName = "div";
    return empty;
  };
  evaluateProps (jsxNode) {
    let keys = [];
    let values = [];
    if ( typeof(jsxNode.left) != "undefined" ) {
      const openingEl = jsxNode.left;
      let i = 0;
      while (i < (openingEl.children.length)) {
        const attr = openingEl.children[i];
        if ( attr.nodeType == "JSXAttribute" ) {
          const attrName = attr.name;
          const attrValue = this.evaluateAttributeValue(attr);
          keys.push(attrName);
          values.push(attrValue);
        }
        i = i + 1;
      };
    }
    return EvalValue.object(keys, values);
  };
  evaluateAttributeValue (attr) {
    if ( typeof(attr.right) != "undefined" ) {
      const rightNode = attr.right;
      if ( rightNode.nodeType == "StringLiteral" ) {
        return EvalValue.string(this.unquote(rightNode.value));
      }
      if ( rightNode.nodeType == "JSXExpressionContainer" ) {
        if ( typeof(rightNode.left) != "undefined" ) {
          const exprNode = rightNode.left;
          return this.evaluateExpr(exprNode);
        }
      }
    }
    return EvalValue.boolean(true);
  };
  evaluateAttributes (element, openingNode) {
    let i = 0;
    while (i < (openingNode.children.length)) {
      const attr = openingNode.children[i];
      if ( attr.nodeType == "JSXAttribute" ) {
        const rawAttrName = attr.name;
        const attrValue = this.evaluateAttributeValue(attr);
        const strValue = (attrValue).toString();
        this.applyAttribute(element, rawAttrName, strValue);
      }
      i = i + 1;
    };
  };
  applyAttribute (element, rawName, strValue) {
    if ( rawName == "id" ) {
      element.id = strValue;
      return;
    }
    if ( rawName == "className" ) {
      element.className = strValue;
      return;
    }
    if ( rawName == "src" ) {
      element.src = strValue;
      return;
    }
    element.setAttribute(rawName, strValue);
  };
  evaluateTextContent (jsxNode) {
    let result = "";
    let i = 0;
    while (i < (jsxNode.children.length)) {
      const child = jsxNode.children[i];
      if ( child.nodeType == "JSXText" ) {
        const rawText = child.value;
        if ( (rawText.length) > 0 ) {
          if ( (result.length) > 0 ) {
            result = result + " ";
          }
          result = result + rawText;
        }
      }
      if ( child.nodeType == "JSXExpressionContainer" ) {
        if ( typeof(child.left) != "undefined" ) {
          const exprNode = child.left;
          const exprValue = this.evaluateExpr(exprNode);
          const exprStr = (exprValue).toString();
          if ( (result.length) > 0 ) {
            result = result + " ";
          }
          result = result + exprStr;
        }
      }
      i = i + 1;
    };
    const normalizedText = this.normalizeWhitespace(result);
    const trimmedText = this.trimText(normalizedText);
    return trimmedText;
  };
  evaluateChildren (element, jsxNode) {
    let i = 0;
    let accumulatedText = "";
    while (i < (jsxNode.children.length)) {
      const child = jsxNode.children[i];
      if ( child.nodeType == "JSXText" ) {
        console.log(("JSXText token value: [" + child.value) + "]");
        if ( (accumulatedText.length) > 0 ) {
          accumulatedText = accumulatedText + " ";
        }
        accumulatedText = accumulatedText + child.value;
        i = i + 1;
        continue;
      }
      if ( (accumulatedText.length) > 0 ) {
        console.log(("Accumulated JSXText: [" + accumulatedText) + "]");
        const normalizedText = this.normalizeWhitespace(accumulatedText);
        console.log(("After normalization: [" + normalizedText) + "]");
        const text = this.trimText(normalizedText);
        console.log(("After trim: [" + text) + "]");
        if ( (text.length) > 0 ) {
          const textEl = new EVGElement();
          textEl.tagName = "text";
          textEl.textContent = text;
          element.addChild(textEl);
        }
        accumulatedText = "";
      }
      if ( child.nodeType == "JSXElement" ) {
        const childEl = this.evaluateJSXElement(child);
        if ( (childEl.tagName.length) > 0 ) {
          element.addChild(childEl);
        }
      }
      if ( child.nodeType == "JSXExpressionContainer" ) {
        this.evaluateExpressionChild(element, child);
      }
      if ( child.nodeType == "JSXFragment" ) {
        this.evaluateChildren(element, child);
      }
      i = i + 1;
    };
    if ( (accumulatedText.length) > 0 ) {
      const normalizedText_1 = this.normalizeWhitespace(accumulatedText);
      const text_1 = this.trimText(normalizedText_1);
      if ( (text_1.length) > 0 ) {
        const textEl_1 = new EVGElement();
        textEl_1.tagName = "text";
        textEl_1.textContent = text_1;
        element.addChild(textEl_1);
      }
    }
  };
  evaluateExpressionChild (element, exprContainer) {
    if ( typeof(exprContainer.left) != "undefined" ) {
      const exprNode = exprContainer.left;
      if ( exprNode.nodeType == "CallExpression" ) {
        this.evaluateArrayMapChild(element, exprNode);
        return;
      }
      if ( exprNode.nodeType == "ConditionalExpression" ) {
        this.evaluateTernaryChild(element, exprNode);
        return;
      }
      if ( exprNode.nodeType == "BinaryExpression" ) {
        if ( exprNode.value == "&&" ) {
          this.evaluateAndChild(element, exprNode);
          return;
        }
      }
      const value = this.evaluateExpr(exprNode);
      const isStr = value.isString();
      const isNum = value.isNumber();
      if ( isStr || isNum ) {
        const textContent = (value).toString();
        console.log(("Expression text value: [" + textContent) + "]");
        const textEl = new EVGElement();
        textEl.tagName = "text";
        textEl.textContent = textContent;
        element.addChild(textEl);
      }
    }
  };
  evaluateArrayMapChild (element, callNode) {
    if ( typeof(callNode.left) != "undefined" ) {
      const calleeNode = callNode.left;
      if ( calleeNode.nodeType == "MemberExpression" ) {
        const methodName = calleeNode.name;
        if ( methodName == "map" ) {
          if ( typeof(calleeNode.left) != "undefined" ) {
            const arrayExpr = calleeNode.left;
            const arrayValue = this.evaluateExpr(arrayExpr);
            if ( (arrayValue).isArray() ) {
              if ( (callNode.children.length) > 0 ) {
                const callback = callNode.children[0];
                let i = 0;
                while (i < (arrayValue.arrayValue.length)) {
                  const item = arrayValue.arrayValue[i];
                  const savedContext = this.context;
                  this.context = this.context.createChild();
                  this.bindMapCallback(callback, item, i);
                  const resultEl = this.evaluateMapCallbackBody(callback);
                  if ( (resultEl.tagName.length) > 0 ) {
                    element.addChild(resultEl);
                  }
                  this.context = savedContext;
                  i = i + 1;
                };
              }
            }
          }
        }
      }
    }
  };
  bindMapCallback (callback, item, index) {
    if ( callback.nodeType == "ArrowFunctionExpression" ) {
      if ( (callback.params.length) > 0 ) {
        const param = callback.params[0];
        const paramName = param.name;
        this.context.define(paramName, item);
      }
      if ( (callback.params.length) > 1 ) {
        const indexParam = callback.params[1];
        this.context.define(indexParam.name, EvalValue.fromInt(index));
      }
    }
  };
  evaluateMapCallbackBody (callback) {
    const empty = new EVGElement();
    if ( callback.nodeType == "ArrowFunctionExpression" ) {
      if ( typeof(callback.body) != "undefined" ) {
        const body = callback.body;
        if ( (body.nodeType == "JSXElement") || (body.nodeType == "JSXFragment") ) {
          return this.evaluateJSX(body);
        }
        if ( body.nodeType == "BlockStatement" ) {
          return this.evaluateFunctionBody(body);
        }
      }
    }
    return empty;
  };
  evaluateTernaryChild (element, node) {
    if ( typeof(node.test) != "undefined" ) {
      const testExpr = node.test;
      const testValue = this.evaluateExpr(testExpr);
      if ( testValue.toBool() ) {
        if ( typeof(node.consequent) != "undefined" ) {
          const conseqNode = node.consequent;
          if ( (conseqNode.nodeType == "JSXElement") || (conseqNode.nodeType == "JSXFragment") ) {
            const childEl = this.evaluateJSX(conseqNode);
            if ( (childEl.tagName.length) > 0 ) {
              element.addChild(childEl);
            }
          }
        }
      } else {
        if ( typeof(node.alternate) != "undefined" ) {
          const altNode = node.alternate;
          if ( (altNode.nodeType == "JSXElement") || (altNode.nodeType == "JSXFragment") ) {
            const childEl_1 = this.evaluateJSX(altNode);
            if ( (childEl_1.tagName.length) > 0 ) {
              element.addChild(childEl_1);
            }
          }
        }
      }
    }
  };
  evaluateAndChild (element, node) {
    if ( typeof(node.left) != "undefined" ) {
      const leftExpr = node.left;
      const leftValue = this.evaluateExpr(leftExpr);
      if ( leftValue.toBool() ) {
        if ( typeof(node.right) != "undefined" ) {
          const rightNode = node.right;
          if ( (rightNode.nodeType == "JSXElement") || (rightNode.nodeType == "JSXFragment") ) {
            const childEl = this.evaluateJSX(rightNode);
            if ( (childEl.tagName.length) > 0 ) {
              element.addChild(childEl);
            }
          }
        }
      }
    }
  };
  evaluateExpr (node) {
    if ( node.nodeType == "NumericLiteral" ) {
      const numVal = isNaN( parseFloat(node.value) ) ? undefined : parseFloat(node.value);
      if ( typeof(numVal) != "undefined" ) {
        return EvalValue.number((numVal));
      }
      return EvalValue.number(0.0);
    }
    if ( node.nodeType == "StringLiteral" ) {
      return EvalValue.string(this.unquote(node.value));
    }
    if ( node.nodeType == "BooleanLiteral" ) {
      return EvalValue.boolean((node.value == "true"));
    }
    if ( node.nodeType == "NullLiteral" ) {
      return EvalValue.null();
    }
    if ( node.nodeType == "Identifier" ) {
      return this.context.lookup(node.name);
    }
    if ( node.nodeType == "BinaryExpression" ) {
      return this.evaluateBinaryExpr(node);
    }
    if ( node.nodeType == "UnaryExpression" ) {
      return this.evaluateUnaryExpr(node);
    }
    if ( node.nodeType == "ConditionalExpression" ) {
      return this.evaluateConditionalExpr(node);
    }
    if ( node.nodeType == "MemberExpression" ) {
      return this.evaluateMemberExpr(node);
    }
    if ( node.nodeType == "ArrayExpression" ) {
      return this.evaluateArrayExpr(node);
    }
    if ( node.nodeType == "ObjectExpression" ) {
      return this.evaluateObjectExpr(node);
    }
    if ( node.nodeType == "ParenthesizedExpression" ) {
      if ( typeof(node.left) != "undefined" ) {
        const inner = node.left;
        return this.evaluateExpr(inner);
      }
    }
    return EvalValue.null();
  };
  evaluateBinaryExpr (node) {
    const op = node.value;
    if ( op == "&&" ) {
      if ( typeof(node.left) != "undefined" ) {
        const leftExpr = node.left;
        const left = this.evaluateExpr(leftExpr);
        if ( left.toBool() == false ) {
          return left;
        }
        if ( typeof(node.right) != "undefined" ) {
          const rightExpr = node.right;
          return this.evaluateExpr(rightExpr);
        }
      }
    }
    if ( op == "||" ) {
      if ( typeof(node.left) != "undefined" ) {
        const leftExpr_1 = node.left;
        const left_1 = this.evaluateExpr(leftExpr_1);
        if ( left_1.toBool() ) {
          return left_1;
        }
        if ( typeof(node.right) != "undefined" ) {
          const rightExpr_1 = node.right;
          return this.evaluateExpr(rightExpr_1);
        }
      }
    }
    let left_2 = EvalValue.null();
    let right = EvalValue.null();
    if ( typeof(node.left) != "undefined" ) {
      const leftExpr_2 = node.left;
      left_2 = this.evaluateExpr(leftExpr_2);
    }
    if ( typeof(node.right) != "undefined" ) {
      const rightExpr_2 = node.right;
      right = this.evaluateExpr(rightExpr_2);
    }
    if ( op == "+" ) {
      const isLeftStr = left_2.isString();
      const isRightStr = right.isString();
      if ( isLeftStr || isRightStr ) {
        return EvalValue.string(((left_2).toString() + (right).toString()));
      }
      return EvalValue.number((left_2.toNumber() + right.toNumber()));
    }
    if ( op == "-" ) {
      return EvalValue.number((left_2.toNumber() - right.toNumber()));
    }
    if ( op == "*" ) {
      return EvalValue.number((left_2.toNumber() * right.toNumber()));
    }
    if ( op == "/" ) {
      const rightNum = right.toNumber();
      if ( rightNum != 0.0 ) {
        return EvalValue.number((left_2.toNumber() / rightNum));
      }
      return EvalValue.number(0.0);
    }
    if ( op == "%" ) {
      const leftInt = Math.floor( left_2.toNumber());
      const rightInt = Math.floor( right.toNumber());
      if ( rightInt != 0 ) {
        return EvalValue.fromInt((leftInt % rightInt));
      }
      return EvalValue.number(0.0);
    }
    if ( op == "<" ) {
      return EvalValue.boolean((left_2.toNumber() < right.toNumber()));
    }
    if ( op == ">" ) {
      return EvalValue.boolean((left_2.toNumber() > right.toNumber()));
    }
    if ( op == "<=" ) {
      return EvalValue.boolean((left_2.toNumber() <= right.toNumber()));
    }
    if ( op == ">=" ) {
      return EvalValue.boolean((left_2.toNumber() >= right.toNumber()));
    }
    if ( (op == "==") || (op == "===") ) {
      return EvalValue.boolean(left_2.equals(right));
    }
    if ( (op == "!=") || (op == "!==") ) {
      return EvalValue.boolean((left_2.equals(right) == false));
    }
    return EvalValue.null();
  };
  evaluateUnaryExpr (node) {
    const op = node.value;
    if ( typeof(node.left) != "undefined" ) {
      const argExpr = node.left;
      const arg = this.evaluateExpr(argExpr);
      if ( op == "!" ) {
        return EvalValue.boolean((arg.toBool() == false));
      }
      if ( op == "-" ) {
        return EvalValue.number((0.0 - arg.toNumber()));
      }
      if ( op == "+" ) {
        return EvalValue.number(arg.toNumber());
      }
    }
    return EvalValue.null();
  };
  evaluateConditionalExpr (node) {
    if ( typeof(node.test) != "undefined" ) {
      const testExpr = node.test;
      const test = this.evaluateExpr(testExpr);
      if ( test.toBool() ) {
        if ( typeof(node.consequent) != "undefined" ) {
          const conseqNode = node.consequent;
          return this.evaluateExpr(conseqNode);
        }
      } else {
        if ( typeof(node.alternate) != "undefined" ) {
          const altNode = node.alternate;
          return this.evaluateExpr(altNode);
        }
      }
    }
    return EvalValue.null();
  };
  evaluateMemberExpr (node) {
    if ( typeof(node.left) != "undefined" ) {
      const leftExpr = node.left;
      const obj = this.evaluateExpr(leftExpr);
      const propName = node.name;
      if ( node.computed ) {
        if ( typeof(node.right) != "undefined" ) {
          const indexExpr = node.right;
          const indexVal = this.evaluateExpr(indexExpr);
          if ( indexVal.isNumber() ) {
            const idx = Math.floor( indexVal.toNumber());
            return obj.getIndex(idx);
          }
          if ( indexVal.isString() ) {
            return obj.getMember(indexVal.stringValue);
          }
        }
      }
      return obj.getMember(propName);
    }
    return EvalValue.null();
  };
  evaluateArrayExpr (node) {
    let items = [];
    let i = 0;
    while (i < (node.children.length)) {
      const elem = node.children[i];
      const value = this.evaluateExpr(elem);
      items.push(value);
      i = i + 1;
    };
    return EvalValue.array(items);
  };
  evaluateObjectExpr (node) {
    let keys = [];
    let values = [];
    let i = 0;
    while (i < (node.children.length)) {
      const prop = node.children[i];
      if ( prop.nodeType == "Property" ) {
        const key = prop.name;
        keys.push(key);
        if ( typeof(prop.left) != "undefined" ) {
          const valueNode = prop.left;
          values.push(this.evaluateExpr(valueNode));
        } else {
          values.push(EvalValue.null());
        }
      }
      i = i + 1;
    };
    return EvalValue.object(keys, values);
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
    if ( jsxTag == "View" ) {
      return "div";
    }
    if ( jsxTag == "Label" ) {
      return "text";
    }
    if ( jsxTag == "Image" ) {
      return "image";
    }
    if ( jsxTag == "Spacer" ) {
      return "spacer";
    }
    if ( jsxTag == "Divider" ) {
      return "divider";
    }
    if ( jsxTag == "div" ) {
      return "div";
    }
    if ( jsxTag == "span" ) {
      return "text";
    }
    if ( jsxTag == "img" ) {
      return "image";
    }
    return "div";
  };
  trimText (text) {
    let result = "";
    let started = false;
    let i = 0;
    const __len = text.length;
    while (i < __len) {
      const c = text.charCodeAt(i );
      const isWhitespace = (((c == 32) || (c == 9)) || (c == 10)) || (c == 13);
      if ( started ) {
        result = result + (String.fromCharCode(c));
      } else {
        if ( isWhitespace == false ) {
          started = true;
          result = String.fromCharCode(c);
        }
      }
      i = i + 1;
    };
    let trimLen = result.length;
    while (trimLen > 0) {
      const lastC = result.charCodeAt((trimLen - 1) );
      if ( (((lastC == 32) || (lastC == 9)) || (lastC == 10)) || (lastC == 13) ) {
        result = result.substring(0, (trimLen - 1) );
        trimLen = trimLen - 1;
      } else {
        trimLen = 0;
      }
    };
    return result;
  };
  normalizeWhitespace (text) {
    let result = "";
    let lastWasSpace = false;
    let i = 0;
    const __len = text.length;
    while (i < __len) {
      const c = text.charCodeAt(i );
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
    return result;
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
}
class EVGComponentTool  {
  constructor() {
    this.pageWidth = 595.0;
    this.pageHeight = 842.0;
    this.inputPath = "";
    this.outputPath = "";
    this.fontsDir = "./Fonts";
    this.fontManager = new FontManager();
  }
  main (args) {
    console.log("EVG Component Tool v1.0 - PDF Generator with TSX Components");
    console.log("============================================================");
    if ( (args.length) < 3 ) {
      console.log("Usage: ranger evg_component_tool.rgr <input.tsx> <output.pdf>");
      console.log("");
      console.log("Example:");
      console.log("  ranger evg_component_tool.rgr test_invoice.tsx invoice.pdf");
      return;
    }
    this.inputPath = args[1];
    this.outputPath = args[2];
    console.log("Input:  " + this.inputPath);
    console.log("Output: " + this.outputPath);
    console.log("");
    const basePath = this.getDirectory(this.inputPath);
    const fileName = this.getFileName(this.inputPath);
    console.log("Base path: " + basePath);
    console.log("File name: " + fileName);
    console.log("");
    this.initFonts();
    const engine = new ComponentEngine();
    engine.pageWidth = this.pageWidth;
    engine.pageHeight = this.pageHeight;
    console.log("Parsing TSX with components...");
    const evgRoot = engine.parseFile(basePath, fileName);
    if ( (evgRoot.tagName.length) == 0 ) {
      console.log("Error: Failed to generate EVG tree");
      return;
    }
    console.log("EVG tree generated successfully");
    console.log("");
    console.log("EVG Tree Structure:");
    console.log("-------------------");
    this.printEVGTree(evgRoot, 0);
    console.log("");
    console.log("Rendering to PDF...");
    const renderer = new EVGPDFRenderer();
    renderer.setPageSize(this.pageWidth, this.pageHeight);
    renderer.setFontManager(this.fontManager);
    renderer.setBaseDir(basePath);
    const ttfMeasurer = new TTFTextMeasurer(this.fontManager);
    renderer.setMeasurer(ttfMeasurer);
    const pdfBuffer = renderer.render(evgRoot);
    const outputDir = this.getDirectory(this.outputPath);
    const outputFileName = this.getFileName(this.outputPath);
    require('fs').writeFileSync(outputDir + '/' + outputFileName, Buffer.from(pdfBuffer));
    console.log("PDF generated successfully: " + this.outputPath);
  };
  printEVGTree (el, depth) {
    let indent = "";
    let i = 0;
    while (i < depth) {
      indent = indent + "  ";
      i = i + 1;
    };
    let info = (indent + "<") + el.tagName;
    if ( (el.id.length) > 0 ) {
      info = ((info + " id=\"") + el.id) + "\"";
    }
    if ( (el.textContent.length) > 0 ) {
      if ( (el.textContent.length) > 30 ) {
        info = ((info + " text=\"") + (el.textContent.substring(0, 30 ))) + "...\"";
      } else {
        info = ((info + " text=\"") + el.textContent) + "\"";
      }
    }
    info = (((((((info + "> pos=(") + ((el.calculatedX.toString()))) + ",") + ((el.calculatedY.toString()))) + ") size=") + ((el.calculatedWidth.toString()))) + "x") + ((el.calculatedHeight.toString()));
    console.log(info);
    i = 0;
    while (i < (el.children.length)) {
      const child = el.children[i];
      this.printEVGTree(child, depth + 1);
      i = i + 1;
    };
  };
  initFonts () {
    console.log("Loading fonts...");
    this.fontManager.setFontsDirectory(this.fontsDir);
    this.fontManager.loadFont("Open_Sans/OpenSans-Regular.ttf");
    this.fontManager.loadFont("Open_Sans/OpenSans-Bold.ttf");
    this.fontManager.loadFont("Helvetica/Helvetica.ttf");
    this.fontManager.loadFont("Noto_Sans/NotoSans-Regular.ttf");
    this.fontManager.loadFont("Noto_Sans/NotoSans-Bold.ttf");
  };
  getDirectory (path) {
    let lastSlash = -1;
    let i = 0;
    const __len = path.length;
    while (i < __len) {
      const ch = path.substring(i, (i + 1) );
      if ( (ch == "/") || (ch == "\\") ) {
        lastSlash = i;
      }
      i = i + 1;
    };
    if ( lastSlash >= 0 ) {
      return path.substring(0, (lastSlash + 1) );
    }
    return "./";
  };
  getFileName (path) {
    let lastSlash = -1;
    let i = 0;
    const __len = path.length;
    while (i < __len) {
      const ch = path.substring(i, (i + 1) );
      if ( (ch == "/") || (ch == "\\") ) {
        lastSlash = i;
      }
      i = i + 1;
    };
    if ( lastSlash >= 0 ) {
      return path.substring((lastSlash + 1), __len );
    }
    return path;
  };
}
/* static JavaSript main routine at the end of the JS file */
function __js_main() {
  const tool = new EVGComponentTool();
  const argCount = (process.argv.length - 2);
  if ( argCount < 2 ) {
    console.log("Usage: evg_component_tool <input.tsx> <output.pdf>");
    return;
  }
  let args = [];
  args.push("evg_component_tool");
  let i = 0;
  while (i < argCount) {
    args.push(process.argv[ 2 + i]);
    i = i + 1;
  };
  tool.main(args);
}
__js_main();
