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
class Lexer  {
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
    let isJSDoc = false;
    if ( this.peek() == "*" ) {
      const nextCh = this.peekAt(1);
      if ( nextCh != "/" ) {
        isJSDoc = true;
      }
    }
    while (this.pos < this.__len) {
      const ch = this.peek();
      if ( ch == "*" ) {
        if ( this.peekAt(1) == "/" ) {
          this.advance();
          this.advance();
          if ( isJSDoc ) {
            return this.makeToken("JSDocComment", value, startPos, startLine, startCol);
          }
          return this.makeToken("BlockComment", value, startPos, startLine, startCol);
        }
      }
      value = value + this.advance();
    };
    if ( isJSDoc ) {
      return this.makeToken("JSDocComment", value, startPos, startLine, startCol);
    }
    return this.makeToken("BlockComment", value, startPos, startLine, startCol);
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
    let hasExpressions = false;
    while (this.pos < this.__len) {
      const ch = this.peek();
      if ( ch == "`" ) {
        this.advance();
        if ( hasExpressions ) {
          return this.makeToken("TemplateLiteral", value, startPos, startLine, startCol);
        } else {
          return this.makeToken("TemplateLiteral", value, startPos, startLine, startCol);
        }
      }
      if ( ch == "\\" ) {
        this.advance();
        const esc = this.advance();
        if ( esc == "n" ) {
          value = value + "\n";
        }
        if ( esc == "t" ) {
          value = value + "\t";
        }
        if ( esc == "r" ) {
          value = value + "\r";
        }
        if ( esc == "\\" ) {
          value = value + "\\";
        }
        if ( esc == "`" ) {
          value = value + "`";
        }
        if ( esc == "$" ) {
          value = value + "$";
        }
      } else {
        if ( ch == "$" ) {
          if ( this.peekAt(1) == "{" ) {
            hasExpressions = true;
            value = value + this.advance();
            value = value + this.advance();
          } else {
            value = value + this.advance();
          }
        } else {
          value = value + this.advance();
        }
      }
    };
    return this.makeToken("TemplateLiteral", value, startPos, startLine, startCol);
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
  readRegexLiteral () {
    const startPos = this.pos;
    const startLine = this.line;
    const startCol = this.col;
    this.advance();
    let pattern = "";
    let inCharClass = false;
    while (this.pos < this.__len) {
      const ch = this.peek();
      if ( ch == "[" ) {
        inCharClass = true;
        pattern = pattern + this.advance();
      } else {
        if ( ch == "]" ) {
          inCharClass = false;
          pattern = pattern + this.advance();
        } else {
          if ( ch == "\\" ) {
            pattern = pattern + this.advance();
            if ( this.pos < this.__len ) {
              pattern = pattern + this.advance();
            }
          } else {
            if ( (ch == "/") && (inCharClass == false) ) {
              this.advance();
              break;
            } else {
              if ( ((ch == "\n") || (ch == "\r")) || (ch == "\r\n") ) {
                return this.makeToken("RegexLiteral", pattern, startPos, startLine, startCol);
              } else {
                pattern = pattern + this.advance();
              }
            }
          }
        }
      }
    };
    let flags = "";
    while (this.pos < this.__len) {
      const ch_1 = this.peek();
      if ( (((((ch_1 == "g") || (ch_1 == "i")) || (ch_1 == "m")) || (ch_1 == "s")) || (ch_1 == "u")) || (ch_1 == "y") ) {
        flags = flags + this.advance();
      } else {
        break;
      }
    };
    const fullValue = (pattern + "/") + flags;
    return this.makeToken("RegexLiteral", fullValue, startPos, startLine, startCol);
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
class JSNode  {
  constructor() {
    this.nodeType = "";
    this.start = 0;
    this.end = 0;
    this.line = 0;
    this.col = 0;
    this.strValue = "";
    this.strValue2 = "";
    this.children = [];
  }
}
class SimpleParser  {
  constructor() {
    this.tokens = [];
    this.pos = 0;
  }
  initParser (toks) {
    this.tokens = toks;
    this.pos = 0;
    if ( (toks.length) > 0 ) {
      this.currentToken = toks[0];
    }
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
      console.log((("Parse error: expected " + expectedType) + " but got ") + tok.tokenType);
    }
    this.advance();
    return tok;
  };
  expectValue (expectedValue) {
    const tok = this.peek();
    if ( tok.value != expectedValue ) {
      console.log(((("Parse error: expected '" + expectedValue) + "' but got '") + tok.value) + "'");
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
    const prog = new JSNode();
    prog.nodeType = "Program";
    while (this.isAtEnd() == false) {
      const stmt = this.parseStatement();
      prog.children.push(stmt);
    };
    return prog;
  };
  parseStatement () {
    const tokVal = this.peekValue();
    if ( tokVal == "var" ) {
      return this.parseVarDecl();
    }
    if ( tokVal == "function" ) {
      return this.parseFuncDecl();
    }
    if ( tokVal == "return" ) {
      return this.parseReturn();
    }
    if ( tokVal == "if" ) {
      return this.parseIf();
    }
    if ( tokVal == "while" ) {
      return this.parseWhile();
    }
    if ( tokVal == "do" ) {
      return this.parseDoWhile();
    }
    if ( tokVal == "for" ) {
      return this.parseFor();
    }
    if ( tokVal == "switch" ) {
      return this.parseSwitch();
    }
    if ( tokVal == "try" ) {
      return this.parseTry();
    }
    if ( tokVal == "throw" ) {
      return this.parseThrow();
    }
    if ( tokVal == "break" ) {
      return this.parseBreak();
    }
    if ( tokVal == "continue" ) {
      return this.parseContinue();
    }
    if ( tokVal == "{" ) {
      return this.parseBlock();
    }
    if ( tokVal == ";" ) {
      this.advance();
      const empty = new JSNode();
      empty.nodeType = "EmptyStatement";
      return empty;
    }
    return this.parseExprStmt();
  };
  parseVarDecl () {
    const decl = new JSNode();
    decl.nodeType = "VariableDeclaration";
    const startTok = this.peek();
    decl.start = startTok.start;
    decl.line = startTok.line;
    decl.col = startTok.col;
    this.expectValue("var");
    let first = true;
    while (first || this.matchValue(",")) {
      if ( first == false ) {
        this.advance();
      }
      first = false;
      const declarator = new JSNode();
      declarator.nodeType = "VariableDeclarator";
      const idTok = this.expect("Identifier");
      const id = new JSNode();
      id.nodeType = "Identifier";
      id.strValue = idTok.value;
      id.start = idTok.start;
      id.line = idTok.line;
      id.col = idTok.col;
      declarator.left = id;
      declarator.start = idTok.start;
      declarator.line = idTok.line;
      declarator.col = idTok.col;
      if ( this.matchValue("=") ) {
        this.advance();
        const initExpr = this.parseAssignment();
        declarator.right = initExpr;
      }
      decl.children.push(declarator);
    };
    if ( this.matchValue(";") ) {
      this.advance();
    }
    return decl;
  };
  parseFuncDecl () {
    const _func = new JSNode();
    _func.nodeType = "FunctionDeclaration";
    const startTok = this.peek();
    _func.start = startTok.start;
    _func.line = startTok.line;
    _func.col = startTok.col;
    this.expectValue("function");
    const idTok = this.expect("Identifier");
    _func.strValue = idTok.value;
    this.expectValue("(");
    while (this.matchValue(")") == false) {
      if ( (_func.children.length) > 0 ) {
        this.expectValue(",");
      }
      const paramTok = this.expect("Identifier");
      const param = new JSNode();
      param.nodeType = "Identifier";
      param.strValue = paramTok.value;
      param.start = paramTok.start;
      param.line = paramTok.line;
      param.col = paramTok.col;
      _func.children.push(param);
    };
    this.expectValue(")");
    const body = this.parseBlock();
    _func.body = body;
    return _func;
  };
  parseBlock () {
    const block = new JSNode();
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
  parseReturn () {
    const ret = new JSNode();
    ret.nodeType = "ReturnStatement";
    const startTok = this.peek();
    ret.start = startTok.start;
    ret.line = startTok.line;
    ret.col = startTok.col;
    this.expectValue("return");
    if ( (this.matchValue(";") == false) && (this.isAtEnd() == false) ) {
      const arg = this.parseExpr();
      ret.left = arg;
    }
    if ( this.matchValue(";") ) {
      this.advance();
    }
    return ret;
  };
  parseIf () {
    const ifStmt = new JSNode();
    ifStmt.nodeType = "IfStatement";
    const startTok = this.peek();
    ifStmt.start = startTok.start;
    ifStmt.line = startTok.line;
    ifStmt.col = startTok.col;
    this.expectValue("if");
    this.expectValue("(");
    const test = this.parseExpr();
    ifStmt.test = test;
    this.expectValue(")");
    const consequent = this.parseStatement();
    ifStmt.body = consequent;
    if ( this.matchValue("else") ) {
      this.advance();
      const alt = this.parseStatement();
      ifStmt.alternate = alt;
    }
    return ifStmt;
  };
  parseWhile () {
    const whileStmt = new JSNode();
    whileStmt.nodeType = "WhileStatement";
    const startTok = this.peek();
    whileStmt.start = startTok.start;
    whileStmt.line = startTok.line;
    whileStmt.col = startTok.col;
    this.expectValue("while");
    this.expectValue("(");
    const test = this.parseExpr();
    whileStmt.test = test;
    this.expectValue(")");
    const body = this.parseStatement();
    whileStmt.body = body;
    return whileStmt;
  };
  parseDoWhile () {
    const doWhileStmt = new JSNode();
    doWhileStmt.nodeType = "DoWhileStatement";
    const startTok = this.peek();
    doWhileStmt.start = startTok.start;
    doWhileStmt.line = startTok.line;
    doWhileStmt.col = startTok.col;
    this.expectValue("do");
    const body = this.parseStatement();
    doWhileStmt.body = body;
    this.expectValue("while");
    this.expectValue("(");
    const test = this.parseExpr();
    doWhileStmt.test = test;
    this.expectValue(")");
    if ( this.matchValue(";") ) {
      this.advance();
    }
    return doWhileStmt;
  };
  parseFor () {
    const forStmt = new JSNode();
    forStmt.nodeType = "ForStatement";
    const startTok = this.peek();
    forStmt.start = startTok.start;
    forStmt.line = startTok.line;
    forStmt.col = startTok.col;
    this.expectValue("for");
    this.expectValue("(");
    if ( this.matchValue(";") == false ) {
      if ( this.matchValue("var") ) {
        const varDecl = this.parseVarDecl();
        forStmt.left = varDecl;
      } else {
        const initExpr = this.parseExpr();
        forStmt.left = initExpr;
        if ( this.matchValue(";") ) {
          this.advance();
        }
      }
    } else {
      this.advance();
    }
    if ( this.matchValue(";") == false ) {
      const test = this.parseExpr();
      forStmt.test = test;
    }
    if ( this.matchValue(";") ) {
      this.advance();
    }
    if ( this.matchValue(")") == false ) {
      const update = this.parseExpr();
      forStmt.right = update;
    }
    this.expectValue(")");
    const body = this.parseStatement();
    forStmt.body = body;
    return forStmt;
  };
  parseSwitch () {
    const switchStmt = new JSNode();
    switchStmt.nodeType = "SwitchStatement";
    const startTok = this.peek();
    switchStmt.start = startTok.start;
    switchStmt.line = startTok.line;
    switchStmt.col = startTok.col;
    this.expectValue("switch");
    this.expectValue("(");
    const discriminant = this.parseExpr();
    switchStmt.test = discriminant;
    this.expectValue(")");
    this.expectValue("{");
    while ((this.matchValue("}") == false) && (this.isAtEnd() == false)) {
      const caseNode = new JSNode();
      if ( this.matchValue("case") ) {
        caseNode.nodeType = "SwitchCase";
        const caseTok = this.peek();
        caseNode.start = caseTok.start;
        caseNode.line = caseTok.line;
        caseNode.col = caseTok.col;
        this.advance();
        const testExpr = this.parseExpr();
        caseNode.test = testExpr;
        this.expectValue(":");
        while ((((this.matchValue("case") == false) && (this.matchValue("default") == false)) && (this.matchValue("}") == false)) && (this.isAtEnd() == false)) {
          const stmt = this.parseStatement();
          caseNode.children.push(stmt);
        };
        switchStmt.children.push(caseNode);
      } else {
        if ( this.matchValue("default") ) {
          caseNode.nodeType = "SwitchCase";
          caseNode.strValue = "default";
          const defTok = this.peek();
          caseNode.start = defTok.start;
          caseNode.line = defTok.line;
          caseNode.col = defTok.col;
          this.advance();
          this.expectValue(":");
          while (((this.matchValue("case") == false) && (this.matchValue("}") == false)) && (this.isAtEnd() == false)) {
            const stmt_1 = this.parseStatement();
            caseNode.children.push(stmt_1);
          };
          switchStmt.children.push(caseNode);
        } else {
          this.advance();
        }
      }
    };
    this.expectValue("}");
    return switchStmt;
  };
  parseTry () {
    const tryStmt = new JSNode();
    tryStmt.nodeType = "TryStatement";
    const startTok = this.peek();
    tryStmt.start = startTok.start;
    tryStmt.line = startTok.line;
    tryStmt.col = startTok.col;
    this.expectValue("try");
    const block = this.parseBlock();
    tryStmt.body = block;
    if ( this.matchValue("catch") ) {
      const catchNode = new JSNode();
      catchNode.nodeType = "CatchClause";
      const catchTok = this.peek();
      catchNode.start = catchTok.start;
      catchNode.line = catchTok.line;
      catchNode.col = catchTok.col;
      this.advance();
      this.expectValue("(");
      const paramTok = this.expect("Identifier");
      catchNode.strValue = paramTok.value;
      this.expectValue(")");
      const catchBody = this.parseBlock();
      catchNode.body = catchBody;
      tryStmt.left = catchNode;
    }
    if ( this.matchValue("finally") ) {
      this.advance();
      const finallyBlock = this.parseBlock();
      tryStmt.right = finallyBlock;
    }
    return tryStmt;
  };
  parseThrow () {
    const throwStmt = new JSNode();
    throwStmt.nodeType = "ThrowStatement";
    const startTok = this.peek();
    throwStmt.start = startTok.start;
    throwStmt.line = startTok.line;
    throwStmt.col = startTok.col;
    this.expectValue("throw");
    const arg = this.parseExpr();
    throwStmt.left = arg;
    if ( this.matchValue(";") ) {
      this.advance();
    }
    return throwStmt;
  };
  parseBreak () {
    const breakStmt = new JSNode();
    breakStmt.nodeType = "BreakStatement";
    const startTok = this.peek();
    breakStmt.start = startTok.start;
    breakStmt.line = startTok.line;
    breakStmt.col = startTok.col;
    this.expectValue("break");
    if ( this.matchType("Identifier") ) {
      const labelTok = this.peek();
      breakStmt.strValue = labelTok.value;
      this.advance();
    }
    if ( this.matchValue(";") ) {
      this.advance();
    }
    return breakStmt;
  };
  parseContinue () {
    const contStmt = new JSNode();
    contStmt.nodeType = "ContinueStatement";
    const startTok = this.peek();
    contStmt.start = startTok.start;
    contStmt.line = startTok.line;
    contStmt.col = startTok.col;
    this.expectValue("continue");
    if ( this.matchType("Identifier") ) {
      const labelTok = this.peek();
      contStmt.strValue = labelTok.value;
      this.advance();
    }
    if ( this.matchValue(";") ) {
      this.advance();
    }
    return contStmt;
  };
  parseExprStmt () {
    const stmt = new JSNode();
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
  parseExpr () {
    return this.parseAssignment();
  };
  parseAssignment () {
    const left = this.parseTernary();
    const tokVal = this.peekValue();
    if ( tokVal == "=" ) {
      const opTok = this.peek();
      this.advance();
      const right = this.parseAssignment();
      const assign = new JSNode();
      assign.nodeType = "AssignmentExpression";
      assign.strValue = opTok.value;
      assign.left = left;
      assign.right = right;
      assign.start = left.start;
      assign.line = left.line;
      assign.col = left.col;
      return assign;
    }
    return left;
  };
  parseTernary () {
    const condition = this.parseLogicalOr();
    if ( this.matchValue("?") ) {
      this.advance();
      const consequent = this.parseAssignment();
      this.expectValue(":");
      const alternate = this.parseAssignment();
      const ternary = new JSNode();
      ternary.nodeType = "ConditionalExpression";
      ternary.left = condition;
      ternary.body = consequent;
      ternary.right = alternate;
      ternary.start = condition.start;
      ternary.line = condition.line;
      ternary.col = condition.col;
      return ternary;
    }
    return condition;
  };
  parseLogicalOr () {
    let left = this.parseLogicalAnd();
    while (this.matchValue("||")) {
      const opTok = this.peek();
      this.advance();
      const right = this.parseLogicalAnd();
      const binary = new JSNode();
      binary.nodeType = "LogicalExpression";
      binary.strValue = opTok.value;
      binary.left = left;
      binary.right = right;
      binary.start = left.start;
      binary.line = left.line;
      binary.col = left.col;
      left = binary;
    };
    return left;
  };
  parseLogicalAnd () {
    let left = this.parseEquality();
    while (this.matchValue("&&")) {
      const opTok = this.peek();
      this.advance();
      const right = this.parseEquality();
      const binary = new JSNode();
      binary.nodeType = "LogicalExpression";
      binary.strValue = opTok.value;
      binary.left = left;
      binary.right = right;
      binary.start = left.start;
      binary.line = left.line;
      binary.col = left.col;
      left = binary;
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
      const binary = new JSNode();
      binary.nodeType = "BinaryExpression";
      binary.strValue = opTok.value;
      binary.left = left;
      binary.right = right;
      binary.start = left.start;
      binary.line = left.line;
      binary.col = left.col;
      left = binary;
      tokVal = this.peekValue();
    };
    return left;
  };
  parseComparison () {
    let left = this.parseAdditive();
    let tokVal = this.peekValue();
    while ((((tokVal == "<") || (tokVal == ">")) || (tokVal == "<=")) || (tokVal == ">=")) {
      const opTok = this.peek();
      this.advance();
      const right = this.parseAdditive();
      const binary = new JSNode();
      binary.nodeType = "BinaryExpression";
      binary.strValue = opTok.value;
      binary.left = left;
      binary.right = right;
      binary.start = left.start;
      binary.line = left.line;
      binary.col = left.col;
      left = binary;
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
      const binary = new JSNode();
      binary.nodeType = "BinaryExpression";
      binary.strValue = opTok.value;
      binary.left = left;
      binary.right = right;
      binary.start = left.start;
      binary.line = left.line;
      binary.col = left.col;
      left = binary;
      tokVal = this.peekValue();
    };
    return left;
  };
  parseMultiplicative () {
    let left = this.parseUnary();
    let tokVal = this.peekValue();
    while (((tokVal == "*") || (tokVal == "/")) || (tokVal == "%")) {
      const opTok = this.peek();
      this.advance();
      const right = this.parseUnary();
      const binary = new JSNode();
      binary.nodeType = "BinaryExpression";
      binary.strValue = opTok.value;
      binary.left = left;
      binary.right = right;
      binary.start = left.start;
      binary.line = left.line;
      binary.col = left.col;
      left = binary;
      tokVal = this.peekValue();
    };
    return left;
  };
  parseUnary () {
    const tokVal = this.peekValue();
    if ( ((tokVal == "!") || (tokVal == "-")) || (tokVal == "+") ) {
      const opTok = this.peek();
      this.advance();
      const arg = this.parseUnary();
      const unary = new JSNode();
      unary.nodeType = "UnaryExpression";
      unary.strValue = opTok.value;
      unary.left = arg;
      unary.start = opTok.start;
      unary.line = opTok.line;
      unary.col = opTok.col;
      return unary;
    }
    return this.parseCallMember();
  };
  parseCallMember () {
    let object = this.parsePrimary();
    let cont = true;
    while (cont) {
      const tokVal = this.peekValue();
      if ( tokVal == "." ) {
        this.advance();
        const propTok = this.expect("Identifier");
        const member = new JSNode();
        member.nodeType = "MemberExpression";
        member.left = object;
        member.strValue = propTok.value;
        member.strValue2 = "dot";
        member.start = object.start;
        member.line = object.line;
        member.col = object.col;
        object = member;
      } else {
        if ( tokVal == "[" ) {
          this.advance();
          const propExpr = this.parseExpr();
          this.expectValue("]");
          const member_1 = new JSNode();
          member_1.nodeType = "MemberExpression";
          member_1.left = object;
          member_1.right = propExpr;
          member_1.strValue2 = "bracket";
          member_1.start = object.start;
          member_1.line = object.line;
          member_1.col = object.col;
          object = member_1;
        } else {
          if ( tokVal == "(" ) {
            this.advance();
            const call = new JSNode();
            call.nodeType = "CallExpression";
            call.left = object;
            call.start = object.start;
            call.line = object.line;
            call.col = object.col;
            while (this.matchValue(")") == false) {
              if ( (call.children.length) > 0 ) {
                this.expectValue(",");
              }
              const arg = this.parseAssignment();
              call.children.push(arg);
            };
            this.expectValue(")");
            object = call;
          } else {
            cont = false;
          }
        }
      }
    };
    return object;
  };
  parsePrimary () {
    const tokType = this.peekType();
    const tokVal = this.peekValue();
    const tok = this.peek();
    if ( tokType == "Identifier" ) {
      this.advance();
      const id = new JSNode();
      id.nodeType = "Identifier";
      id.strValue = tok.value;
      id.start = tok.start;
      id.end = tok.end;
      id.line = tok.line;
      id.col = tok.col;
      return id;
    }
    if ( tokType == "Number" ) {
      this.advance();
      const lit = new JSNode();
      lit.nodeType = "Literal";
      lit.strValue = tok.value;
      lit.strValue2 = "number";
      lit.start = tok.start;
      lit.end = tok.end;
      lit.line = tok.line;
      lit.col = tok.col;
      return lit;
    }
    if ( tokType == "String" ) {
      this.advance();
      const lit_1 = new JSNode();
      lit_1.nodeType = "Literal";
      lit_1.strValue = tok.value;
      lit_1.strValue2 = "string";
      lit_1.start = tok.start;
      lit_1.end = tok.end;
      lit_1.line = tok.line;
      lit_1.col = tok.col;
      return lit_1;
    }
    if ( (tokVal == "true") || (tokVal == "false") ) {
      this.advance();
      const lit_2 = new JSNode();
      lit_2.nodeType = "Literal";
      lit_2.strValue = tok.value;
      lit_2.strValue2 = "boolean";
      lit_2.start = tok.start;
      lit_2.end = tok.end;
      lit_2.line = tok.line;
      lit_2.col = tok.col;
      return lit_2;
    }
    if ( tokVal == "null" ) {
      this.advance();
      const lit_3 = new JSNode();
      lit_3.nodeType = "Literal";
      lit_3.strValue = "null";
      lit_3.strValue2 = "null";
      lit_3.start = tok.start;
      lit_3.end = tok.end;
      lit_3.line = tok.line;
      lit_3.col = tok.col;
      return lit_3;
    }
    if ( tokVal == "(" ) {
      this.advance();
      const expr = this.parseExpr();
      this.expectValue(")");
      return expr;
    }
    if ( tokVal == "[" ) {
      return this.parseArray();
    }
    if ( tokVal == "{" ) {
      return this.parseObject();
    }
    this.advance();
    const fallback = new JSNode();
    fallback.nodeType = "Identifier";
    fallback.strValue = tok.value;
    fallback.start = tok.start;
    fallback.end = tok.end;
    fallback.line = tok.line;
    fallback.col = tok.col;
    return fallback;
  };
  parseArray () {
    const arr = new JSNode();
    arr.nodeType = "ArrayExpression";
    const startTok = this.peek();
    arr.start = startTok.start;
    arr.line = startTok.line;
    arr.col = startTok.col;
    this.expectValue("[");
    while (this.matchValue("]") == false) {
      if ( (arr.children.length) > 0 ) {
        this.expectValue(",");
      }
      if ( this.matchValue("]") ) {
        break;
      }
      const elem = this.parseAssignment();
      arr.children.push(elem);
    };
    this.expectValue("]");
    return arr;
  };
  parseObject () {
    const obj = new JSNode();
    obj.nodeType = "ObjectExpression";
    const startTok = this.peek();
    obj.start = startTok.start;
    obj.line = startTok.line;
    obj.col = startTok.col;
    this.expectValue("{");
    while (this.matchValue("}") == false) {
      if ( (obj.children.length) > 0 ) {
        this.expectValue(",");
      }
      if ( this.matchValue("}") ) {
        break;
      }
      const prop = new JSNode();
      prop.nodeType = "Property";
      const keyTok = this.peek();
      const keyType = this.peekType();
      if ( ((keyType == "Identifier") || (keyType == "String")) || (keyType == "Number") ) {
        this.advance();
        prop.strValue = keyTok.value;
        prop.start = keyTok.start;
        prop.line = keyTok.line;
        prop.col = keyTok.col;
        this.expectValue(":");
        const val = this.parseAssignment();
        prop.left = val;
      }
      obj.children.push(prop);
    };
    this.expectValue("}");
    return obj;
  };
}
class JSParserMain  {
  constructor() {
  }
}
JSParserMain.printNode = function(node, depth) {
  let indent = "";
  let i = 0;
  while (i < depth) {
    indent = indent + "  ";
    i = i + 1;
  };
  const nodeType = node.nodeType;
  const loc = ((("[" + node.line) + ":") + node.col) + "]";
  if ( nodeType == "VariableDeclaration" ) {
    console.log((indent + "VariableDeclaration ") + loc);
    for ( let ci = 0; ci < node.children.length; ci++) {
      var child = node.children[ci];
      JSParserMain.printNode(child, depth + 1);
    };
    return;
  }
  if ( nodeType == "VariableDeclarator" ) {
    if ( (typeof(node.left) !== "undefined" && node.left != null )  ) {
      const id = node.left;
      console.log((((indent + "VariableDeclarator: ") + id.strValue) + " ") + loc);
      if ( (typeof(node.right) !== "undefined" && node.right != null )  ) {
        JSParserMain.printNode(node.right, depth + 1);
      }
    }
    return;
  }
  if ( nodeType == "FunctionDeclaration" ) {
    let paramNames = "";
    for ( let pi = 0; pi < node.children.length; pi++) {
      var p = node.children[pi];
      if ( pi > 0 ) {
        paramNames = paramNames + ", ";
      }
      paramNames = paramNames + p.strValue;
    };
    console.log((((((indent + "FunctionDeclaration: ") + node.strValue) + "(") + paramNames) + ") ") + loc);
    if ( (typeof(node.body) !== "undefined" && node.body != null )  ) {
      JSParserMain.printNode(node.body, depth + 1);
    }
    return;
  }
  if ( nodeType == "BlockStatement" ) {
    console.log((indent + "BlockStatement ") + loc);
    for ( let si = 0; si < node.children.length; si++) {
      var stmt = node.children[si];
      JSParserMain.printNode(stmt, depth + 1);
    };
    return;
  }
  if ( nodeType == "ReturnStatement" ) {
    console.log((indent + "ReturnStatement ") + loc);
    if ( (typeof(node.left) !== "undefined" && node.left != null )  ) {
      JSParserMain.printNode(node.left, depth + 1);
    }
    return;
  }
  if ( nodeType == "IfStatement" ) {
    console.log((indent + "IfStatement ") + loc);
    console.log(indent + "  test:");
    if ( (typeof(node.test) !== "undefined" && node.test != null )  ) {
      JSParserMain.printNode(node.test, depth + 2);
    }
    console.log(indent + "  consequent:");
    if ( (typeof(node.body) !== "undefined" && node.body != null )  ) {
      JSParserMain.printNode(node.body, depth + 2);
    }
    if ( (typeof(node.alternate) !== "undefined" && node.alternate != null )  ) {
      console.log(indent + "  alternate:");
      JSParserMain.printNode(node.alternate, depth + 2);
    }
    return;
  }
  if ( nodeType == "ExpressionStatement" ) {
    console.log((indent + "ExpressionStatement ") + loc);
    if ( (typeof(node.left) !== "undefined" && node.left != null )  ) {
      JSParserMain.printNode(node.left, depth + 1);
    }
    return;
  }
  if ( nodeType == "AssignmentExpression" ) {
    console.log((((indent + "AssignmentExpression: ") + node.strValue) + " ") + loc);
    if ( (typeof(node.left) !== "undefined" && node.left != null )  ) {
      console.log(indent + "  left:");
      JSParserMain.printNode(node.left, depth + 2);
    }
    if ( (typeof(node.right) !== "undefined" && node.right != null )  ) {
      console.log(indent + "  right:");
      JSParserMain.printNode(node.right, depth + 2);
    }
    return;
  }
  if ( (nodeType == "BinaryExpression") || (nodeType == "LogicalExpression") ) {
    console.log(((((indent + nodeType) + ": ") + node.strValue) + " ") + loc);
    if ( (typeof(node.left) !== "undefined" && node.left != null )  ) {
      console.log(indent + "  left:");
      JSParserMain.printNode(node.left, depth + 2);
    }
    if ( (typeof(node.right) !== "undefined" && node.right != null )  ) {
      console.log(indent + "  right:");
      JSParserMain.printNode(node.right, depth + 2);
    }
    return;
  }
  if ( nodeType == "UnaryExpression" ) {
    console.log((((indent + "UnaryExpression: ") + node.strValue) + " ") + loc);
    if ( (typeof(node.left) !== "undefined" && node.left != null )  ) {
      JSParserMain.printNode(node.left, depth + 1);
    }
    return;
  }
  if ( nodeType == "ConditionalExpression" ) {
    console.log((indent + "ConditionalExpression ") + loc);
    console.log(indent + "  test:");
    if ( (typeof(node.left) !== "undefined" && node.left != null )  ) {
      JSParserMain.printNode(node.left, depth + 2);
    }
    console.log(indent + "  consequent:");
    if ( (typeof(node.body) !== "undefined" && node.body != null )  ) {
      JSParserMain.printNode(node.body, depth + 2);
    }
    console.log(indent + "  alternate:");
    if ( (typeof(node.right) !== "undefined" && node.right != null )  ) {
      JSParserMain.printNode(node.right, depth + 2);
    }
    return;
  }
  if ( nodeType == "CallExpression" ) {
    console.log((indent + "CallExpression ") + loc);
    if ( (typeof(node.left) !== "undefined" && node.left != null )  ) {
      console.log(indent + "  callee:");
      JSParserMain.printNode(node.left, depth + 2);
    }
    if ( (node.children.length) > 0 ) {
      console.log(indent + "  arguments:");
      for ( let ai = 0; ai < node.children.length; ai++) {
        var arg = node.children[ai];
        JSParserMain.printNode(arg, depth + 2);
      };
    }
    return;
  }
  if ( nodeType == "MemberExpression" ) {
    if ( node.strValue2 == "dot" ) {
      console.log((((indent + "MemberExpression: .") + node.strValue) + " ") + loc);
    } else {
      console.log((indent + "MemberExpression: [computed] ") + loc);
    }
    if ( (typeof(node.left) !== "undefined" && node.left != null )  ) {
      JSParserMain.printNode(node.left, depth + 1);
    }
    if ( (typeof(node.right) !== "undefined" && node.right != null )  ) {
      JSParserMain.printNode(node.right, depth + 1);
    }
    return;
  }
  if ( nodeType == "Identifier" ) {
    console.log((((indent + "Identifier: ") + node.strValue) + " ") + loc);
    return;
  }
  if ( nodeType == "Literal" ) {
    console.log((((((indent + "Literal: ") + node.strValue) + " (") + node.strValue2) + ") ") + loc);
    return;
  }
  if ( nodeType == "ArrayExpression" ) {
    console.log((indent + "ArrayExpression ") + loc);
    for ( let ei = 0; ei < node.children.length; ei++) {
      var elem = node.children[ei];
      JSParserMain.printNode(elem, depth + 1);
    };
    return;
  }
  if ( nodeType == "ObjectExpression" ) {
    console.log((indent + "ObjectExpression ") + loc);
    for ( let pi_1 = 0; pi_1 < node.children.length; pi_1++) {
      var prop = node.children[pi_1];
      JSParserMain.printNode(prop, depth + 1);
    };
    return;
  }
  if ( nodeType == "Property" ) {
    console.log((((indent + "Property: ") + node.strValue) + " ") + loc);
    if ( (typeof(node.left) !== "undefined" && node.left != null )  ) {
      JSParserMain.printNode(node.left, depth + 1);
    }
    return;
  }
  if ( nodeType == "WhileStatement" ) {
    console.log((indent + "WhileStatement ") + loc);
    console.log(indent + "  test:");
    if ( (typeof(node.test) !== "undefined" && node.test != null )  ) {
      JSParserMain.printNode(node.test, depth + 2);
    }
    console.log(indent + "  body:");
    if ( (typeof(node.body) !== "undefined" && node.body != null )  ) {
      JSParserMain.printNode(node.body, depth + 2);
    }
    return;
  }
  if ( nodeType == "DoWhileStatement" ) {
    console.log((indent + "DoWhileStatement ") + loc);
    console.log(indent + "  body:");
    if ( (typeof(node.body) !== "undefined" && node.body != null )  ) {
      JSParserMain.printNode(node.body, depth + 2);
    }
    console.log(indent + "  test:");
    if ( (typeof(node.test) !== "undefined" && node.test != null )  ) {
      JSParserMain.printNode(node.test, depth + 2);
    }
    return;
  }
  if ( nodeType == "ForStatement" ) {
    console.log((indent + "ForStatement ") + loc);
    if ( (typeof(node.left) !== "undefined" && node.left != null )  ) {
      console.log(indent + "  init:");
      JSParserMain.printNode(node.left, depth + 2);
    }
    if ( (typeof(node.test) !== "undefined" && node.test != null )  ) {
      console.log(indent + "  test:");
      JSParserMain.printNode(node.test, depth + 2);
    }
    if ( (typeof(node.right) !== "undefined" && node.right != null )  ) {
      console.log(indent + "  update:");
      JSParserMain.printNode(node.right, depth + 2);
    }
    console.log(indent + "  body:");
    if ( (typeof(node.body) !== "undefined" && node.body != null )  ) {
      JSParserMain.printNode(node.body, depth + 2);
    }
    return;
  }
  if ( nodeType == "SwitchStatement" ) {
    console.log((indent + "SwitchStatement ") + loc);
    console.log(indent + "  discriminant:");
    if ( (typeof(node.test) !== "undefined" && node.test != null )  ) {
      JSParserMain.printNode(node.test, depth + 2);
    }
    console.log(indent + "  cases:");
    for ( let ci_1 = 0; ci_1 < node.children.length; ci_1++) {
      var caseNode = node.children[ci_1];
      JSParserMain.printNode(caseNode, depth + 2);
    };
    return;
  }
  if ( nodeType == "SwitchCase" ) {
    if ( node.strValue == "default" ) {
      console.log((indent + "SwitchCase: default ") + loc);
    } else {
      console.log((indent + "SwitchCase ") + loc);
      console.log(indent + "  test:");
      if ( (typeof(node.test) !== "undefined" && node.test != null )  ) {
        JSParserMain.printNode(node.test, depth + 2);
      }
    }
    if ( (node.children.length) > 0 ) {
      console.log(indent + "  consequent:");
      for ( let si_1 = 0; si_1 < node.children.length; si_1++) {
        var stmt_1 = node.children[si_1];
        JSParserMain.printNode(stmt_1, depth + 2);
      };
    }
    return;
  }
  if ( nodeType == "TryStatement" ) {
    console.log((indent + "TryStatement ") + loc);
    console.log(indent + "  block:");
    if ( (typeof(node.body) !== "undefined" && node.body != null )  ) {
      JSParserMain.printNode(node.body, depth + 2);
    }
    if ( (typeof(node.left) !== "undefined" && node.left != null )  ) {
      console.log(indent + "  handler:");
      JSParserMain.printNode(node.left, depth + 2);
    }
    if ( (typeof(node.right) !== "undefined" && node.right != null )  ) {
      console.log(indent + "  finalizer:");
      JSParserMain.printNode(node.right, depth + 2);
    }
    return;
  }
  if ( nodeType == "CatchClause" ) {
    console.log((((indent + "CatchClause: ") + node.strValue) + " ") + loc);
    if ( (typeof(node.body) !== "undefined" && node.body != null )  ) {
      JSParserMain.printNode(node.body, depth + 1);
    }
    return;
  }
  if ( nodeType == "ThrowStatement" ) {
    console.log((indent + "ThrowStatement ") + loc);
    if ( (typeof(node.left) !== "undefined" && node.left != null )  ) {
      JSParserMain.printNode(node.left, depth + 1);
    }
    return;
  }
  if ( nodeType == "BreakStatement" ) {
    if ( (node.strValue.length) > 0 ) {
      console.log((((indent + "BreakStatement: ") + node.strValue) + " ") + loc);
    } else {
      console.log((indent + "BreakStatement ") + loc);
    }
    return;
  }
  if ( nodeType == "ContinueStatement" ) {
    if ( (node.strValue.length) > 0 ) {
      console.log((((indent + "ContinueStatement: ") + node.strValue) + " ") + loc);
    } else {
      console.log((indent + "ContinueStatement ") + loc);
    }
    return;
  }
  console.log(((indent + nodeType) + " ") + loc);
};
/* static JavaSript main routine at the end of the JS file */
function __js_main() {
  const code = "var x = 123;\r\nvar y = 'hello';\r\n\r\n// Function declaration\r\nfunction add(a, b) {\r\n    return a + b;\r\n}\r\n\r\n// While loop\r\nvar i = 0;\r\nwhile (i < 10) {\r\n    i = i + 1;\r\n}\r\n\r\n// Do-while loop\r\ndo {\r\n    i = i - 1;\r\n} while (i > 0);\r\n\r\n// For loop\r\nfor (var j = 0; j < 5; j = j + 1) {\r\n    x = x + j;\r\n}\r\n\r\n// Switch statement\r\nswitch (x) {\r\n    case 1:\r\n        y = 'one';\r\n        break;\r\n    case 2:\r\n        y = 'two';\r\n        break;\r\n    default:\r\n        y = 'other';\r\n}\r\n\r\n// Try-catch-finally\r\ntry {\r\n    throw 'error';\r\n} catch (e) {\r\n    y = e;\r\n} finally {\r\n    x = 0;\r\n}\r\n\r\n// If-else\r\nif (x > 100) {\r\n    y = 'big';\r\n} else {\r\n    y = 'small';\r\n}\r\n\r\nvar arr = [1, 2, 3];\r\nvar obj = { name: 'test', value: 42 };\r\n\r\n// Unary expressions\r\nvar negNum = -42;\r\nvar posNum = +5;\r\nvar notTrue = !true;\r\nvar notFalse = !false;\r\nvar doubleNot = !!x;\r\nvar negExpr = -(a + b);\r\n\r\n// Logical expressions\r\nvar andResult = true && false;\r\nvar orResult = true || false;\r\nvar complexLogic = (a > 0) && (b < 10) || (c == 5);\r\nvar shortCircuit = x && y && z;\r\nvar orChain = a || b || c;\r\n\r\n// Ternary expressions\r\nvar ternResult = x > 0 ? 'positive' : 'non-positive';\r\nvar nestedTern = a > b ? (b > c ? 'a>b>c' : 'a>b, b<=c') : 'a<=b';\r\nvar ternInExpr = 1 + (x ? 2 : 3);\r\n\r\n// Operator precedence tests\r\nvar prec1 = 1 + 2 * 3;\r\nvar prec2 = (1 + 2) * 3;\r\nvar prec3 = 1 + 2 + 3 + 4;\r\nvar prec4 = 2 * 3 + 4 * 5;\r\nvar prec5 = 1 < 2 && 3 > 1;\r\nvar prec6 = !x && y || z;\r\nvar prec7 = a == b && c != d;\r\nvar prec8 = -x + y * -z;\r\n\r\n// Comparison operators\r\nvar cmp1 = a == b;\r\nvar cmp2 = a != b;\r\nvar cmp3 = a < b;\r\nvar cmp4 = a <= b;\r\nvar cmp5 = a > b;\r\nvar cmp6 = a >= b;\r\n";
  console.log("=== JavaScript ES5 Parser ===");
  console.log("");
  console.log("Input:");
  console.log(code);
  console.log("");
  const lexer = new Lexer(code);
  const tokens = lexer.tokenize();
  console.log(("--- Tokens: " + (tokens.length)) + " ---");
  console.log("");
  console.log("--- AST ---");
  const parser = new SimpleParser();
  parser.initParser(tokens);
  const program = parser.parseProgram();
  console.log(("Program with " + (program.children.length)) + " statements:");
  console.log("");
  for ( let idx = 0; idx < program.children.length; idx++) {
    var stmt = program.children[idx];
    JSParserMain.printNode(stmt, 0);
  };
}
__js_main();
