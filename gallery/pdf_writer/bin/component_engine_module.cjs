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
    this.__len = this.countCodeUnits(src);
  }
  utf8WidthFromLead (lead) {
    if ( lead <= 127 ) {
      return 1;
    }
    if ( lead >= 192 ) {
      if ( lead <= 223 ) {
        return 2;
      }
    }
    if ( lead >= 224 ) {
      if ( lead <= 239 ) {
        return 3;
      }
    }
    if ( lead >= 240 ) {
      if ( lead <= 247 ) {
        return 4;
      }
    }
    return 1;
  };
  countCodeUnits (text) {
    const byteLen = text.length;
    let bytePos = 0;
    let count = 0;
    while (bytePos < byteLen) {
      const lead = text.charCodeAt(bytePos );
      const w = this.utf8WidthFromLead(lead);
      bytePos = bytePos + w;
      count = count + 1;
    };
    return count;
  };
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
    const code = ch.charCodeAt(0 );
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
  isLetterCode (code) {
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
    const code = ch.charCodeAt(0 );
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
      let wordApostrophe = false;
      if ( this.pos > 0 ) {
        if ( (this.pos + 1) < this.__len ) {
          const prevCh = this.peekAt(-1);
          const nextCh = this.peekAt(1);
          if ( (prevCh.length) > 0 ) {
            if ( (nextCh.length) > 0 ) {
              const prevCode = prevCh.charCodeAt(0 );
              const nextCode = nextCh.charCodeAt(0 );
              if ( this.isLetterCode(prevCode) && this.isLetterCode(nextCode) ) {
                wordApostrophe = true;
              }
            }
          }
        }
      }
      if ( wordApostrophe ) {
        this.advance();
        return this.makeToken("Punctuator", "'", startPos, startLine, startCol);
      }
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
      if ( next_1 == "=" ) {
        this.advance();
        this.advance();
        return this.makeToken("Punctuator", "+=", startPos, startLine, startCol);
      }
    }
    if ( ch == "-" ) {
      if ( next_1 == "-" ) {
        this.advance();
        this.advance();
        return this.makeToken("Punctuator", "--", startPos, startLine, startCol);
      }
      if ( next_1 == "=" ) {
        this.advance();
        this.advance();
        return this.makeToken("Punctuator", "-=", startPos, startLine, startCol);
      }
    }
    if ( ch == "*" ) {
      if ( next_1 == "*" ) {
        this.advance();
        this.advance();
        return this.makeToken("Punctuator", "**", startPos, startLine, startCol);
      }
      if ( next_1 == "=" ) {
        this.advance();
        this.advance();
        return this.makeToken("Punctuator", "*=", startPos, startLine, startCol);
      }
    }
    if ( ch == "/" ) {
      if ( next_1 == "=" ) {
        this.advance();
        this.advance();
        return this.makeToken("Punctuator", "/=", startPos, startLine, startCol);
      }
    }
    if ( ch == "%" ) {
      if ( next_1 == "=" ) {
        this.advance();
        this.advance();
        return this.makeToken("Punctuator", "%=", startPos, startLine, startCol);
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
    if ( (ch.length) == 0 ) {
      return this.makeToken("EOF", "", this.pos, this.line, this.col);
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
    this.prefix = false;
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
      this.skipIgnoredTokens();
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
    this.skipIgnoredTokens();
  };
  skipIgnoredTokens () {
    while (this.pos < (this.tokens.length)) {
      const tok = this.peek();
      const tokType = tok.tokenType;
      if ( (tokType == "LineComment") || (tokType == "BlockComment") ) {
        this.pos = this.pos + 1;
        if ( this.pos < (this.tokens.length) ) {
          this.currentToken = this.tokens[this.pos];
        } else {
          const eof = new Token();
          eof.tokenType = "EOF";
          eof.value = "";
          this.currentToken = eof;
          return;
        }
      } else {
        return;
      }
    };
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
    if ( tokVal == "break" ) {
      return this.parseBreak();
    }
    if ( tokVal == "continue" ) {
      return this.parseContinue();
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
  parseBreak () {
    const node = new TSNode();
    node.nodeType = "BreakStatement";
    const startTok = this.peek();
    node.start = startTok.start;
    node.line = startTok.line;
    node.col = startTok.col;
    this.expectValue("break");
    if ( this.matchValue(";") ) {
      this.advance();
    }
    return node;
  };
  parseContinue () {
    const node = new TSNode();
    node.nodeType = "ContinueStatement";
    const startTok = this.peek();
    node.start = startTok.start;
    node.line = startTok.line;
    node.col = startTok.col;
    this.expectValue("continue");
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
    if ( tokVal == "object" ) {
      this.advance();
      const node_8 = new TSNode();
      node_8.nodeType = "TSObjectKeyword";
      node_8.start = tok.start;
      node_8.end = tok.end;
      node_8.line = tok.line;
      node_8.col = tok.col;
      return node_8;
    }
    if ( tokVal == "void" ) {
      this.advance();
      const node_9 = new TSNode();
      node_9.nodeType = "TSVoidKeyword";
      node_9.start = tok.start;
      node_9.end = tok.end;
      node_9.line = tok.line;
      node_9.col = tok.col;
      return node_9;
    }
    if ( tokVal == "null" ) {
      this.advance();
      const node_10 = new TSNode();
      node_10.nodeType = "TSNullKeyword";
      node_10.start = tok.start;
      node_10.end = tok.end;
      node_10.line = tok.line;
      node_10.col = tok.col;
      return node_10;
    }
    if ( tokVal == "never" ) {
      this.advance();
      const node_11 = new TSNode();
      node_11.nodeType = "TSNeverKeyword";
      node_11.start = tok.start;
      node_11.end = tok.end;
      node_11.line = tok.line;
      node_11.col = tok.col;
      return node_11;
    }
    if ( tokVal == "undefined" ) {
      this.advance();
      const node_12 = new TSNode();
      node_12.nodeType = "TSUndefinedKeyword";
      node_12.start = tok.start;
      node_12.end = tok.end;
      node_12.line = tok.line;
      node_12.col = tok.col;
      return node_12;
    }
    const tokType = this.peekType();
    if ( tokType == "Identifier" ) {
      return this.parseTypeRef();
    }
    if ( tokType == "String" ) {
      this.advance();
      const node_13 = new TSNode();
      node_13.nodeType = "TSLiteralType";
      node_13.start = tok.start;
      node_13.end = tok.end;
      node_13.line = tok.line;
      node_13.col = tok.col;
      node_13.value = tok.value;
      node_13.kind = "string";
      return node_13;
    }
    if ( tokType == "Number" ) {
      this.advance();
      const node_14 = new TSNode();
      node_14.nodeType = "TSLiteralType";
      node_14.start = tok.start;
      node_14.end = tok.end;
      node_14.line = tok.line;
      node_14.col = tok.col;
      node_14.value = tok.value;
      node_14.kind = "number";
      return node_14;
    }
    if ( (tokVal == "true") || (tokVal == "false") ) {
      this.advance();
      const node_15 = new TSNode();
      node_15.nodeType = "TSLiteralType";
      node_15.start = tok.start;
      node_15.end = tok.end;
      node_15.line = tok.line;
      node_15.col = tok.col;
      node_15.value = tokVal;
      node_15.kind = "boolean";
      return node_15;
    }
    if ( tokType == "Template" ) {
      this.advance();
      const node_16 = new TSNode();
      node_16.nodeType = "TSTemplateLiteralType";
      node_16.start = tok.start;
      node_16.end = tok.end;
      node_16.line = tok.line;
      node_16.col = tok.col;
      node_16.value = tok.value;
      return node_16;
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
    if ( ((((tokVal == "+=") || (tokVal == "-=")) || (tokVal == "*=")) || (tokVal == "/=")) || (tokVal == "%=") ) {
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
    if ( ((tokVal == "&&=") || (tokVal == "||=")) || (tokVal == "??=") ) {
      this.advance();
      const right_2 = this.parseAssign();
      const assign_2 = new TSNode();
      assign_2.nodeType = "AssignmentExpression";
      assign_2.value = tokVal;
      assign_2.left = left;
      assign_2.right = right_2;
      assign_2.start = left.start;
      assign_2.line = left.line;
      assign_2.col = left.col;
      return assign_2;
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
    let left = this.parseBitwiseOr();
    while (this.matchValue("&&")) {
      this.advance();
      const right = this.parseBitwiseOr();
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
  parseBitwiseOr () {
    let left = this.parseBitwiseXor();
    while (this.matchValue("|")) {
      this.advance();
      const right = this.parseBitwiseXor();
      const expr = new TSNode();
      expr.nodeType = "BinaryExpression";
      expr.value = "|";
      expr.left = left;
      expr.right = right;
      expr.start = left.start;
      expr.line = left.line;
      expr.col = left.col;
      left = expr;
    };
    return left;
  };
  parseBitwiseXor () {
    let left = this.parseBitwiseAnd();
    while (this.matchValue("^")) {
      this.advance();
      const right = this.parseBitwiseAnd();
      const expr = new TSNode();
      expr.nodeType = "BinaryExpression";
      expr.value = "^";
      expr.left = left;
      expr.right = right;
      expr.start = left.start;
      expr.line = left.line;
      expr.col = left.col;
      left = expr;
    };
    return left;
  };
  parseBitwiseAnd () {
    let left = this.parseEquality();
    while (this.matchValue("&")) {
      this.advance();
      const right = this.parseEquality();
      const expr = new TSNode();
      expr.nodeType = "BinaryExpression";
      expr.value = "&";
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
    if ( (tokVal == "++") || (tokVal == "--") ) {
      const opTok = this.peek();
      this.advance();
      const arg = this.parseUnary();
      const update = new TSNode();
      update.nodeType = "UpdateExpression";
      update.value = opTok.value;
      update.left = arg;
      update.prefix = true;
      update.start = opTok.start;
      update.line = opTok.line;
      update.col = opTok.col;
      return update;
    }
    if ( ((tokVal == "!") || (tokVal == "-")) || (tokVal == "+") ) {
      const opTok_1 = this.peek();
      this.advance();
      const arg_1 = this.parseUnary();
      const unary = new TSNode();
      unary.nodeType = "UnaryExpression";
      unary.value = opTok_1.value;
      unary.left = arg_1;
      unary.start = opTok_1.start;
      unary.line = opTok_1.line;
      unary.col = opTok_1.col;
      return unary;
    }
    if ( tokVal == "typeof" ) {
      const opTok_2 = this.peek();
      this.advance();
      const arg_2 = this.parseUnary();
      const unary_1 = new TSNode();
      unary_1.nodeType = "UnaryExpression";
      unary_1.value = "typeof";
      unary_1.left = arg_2;
      unary_1.start = opTok_2.start;
      unary_1.line = opTok_2.line;
      unary_1.col = opTok_2.col;
      return unary_1;
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
      const arg_3 = this.parseUnary();
      const awaitExpr = new TSNode();
      awaitExpr.nodeType = "AwaitExpression";
      awaitExpr.left = arg_3;
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
          const arg_4 = this.parseUnary();
          const assertion = new TSNode();
          assertion.nodeType = "TSTypeAssertion";
          assertion.typeAnnotation = typeNode;
          assertion.left = arg_4;
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
        computed.computed = true;
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
      if ( (tokVal == "++") || (tokVal == "--") ) {
        const opTok = this.peek();
        this.advance();
        const update = new TSNode();
        update.nodeType = "UpdateExpression";
        update.value = opTok.value;
        update.left = expr;
        update.prefix = false;
        update.start = expr.start;
        update.line = expr.line;
        update.col = expr.col;
        expr = update;
      }
      const newTokVal = this.peekValue();
      const newTokType = this.peekType();
      if ( (((((((((newTokVal != "(") && (newTokVal != ".")) && (newTokVal != "?.")) && (newTokVal != "[")) && (newTokVal != "!")) && (newTokVal != "as")) && (newTokVal != "satisfies")) && (newTokVal != "++")) && (newTokVal != "--")) && (newTokType != "Template") ) {
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
class TSTopLevelDecl  {
  constructor() {
    this.name = "";
    this.declKind = "";
    this.node = new TSNode();
    this.text = "";
  }
}
class TSAstPatchChange  {
  constructor() {
    this.changeKind = "";
    this.name = "";
    this.declKind = "";
  }
}
class TSAstPatchResult  {
  constructor() {
    this.changes = [];
    this.functionsChanged = false;
    this.variablesChanged = false;
    this.sceneAffecting = false;
    this.hasChanges = false;
  }
}
class TSAstPatcher  {
  constructor() {
  }
  nodeSpanEnd (node) {
    let best = node.end;
    if ( best < node.start ) {
      best = node.start;
    }
    if ( typeof(node.body) != "undefined" ) {
      const bodyEnd = this.nodeSpanEnd((node.body));
      if ( bodyEnd > best ) {
        best = bodyEnd;
      }
    }
    if ( typeof(node.left) != "undefined" ) {
      const leftEnd = this.nodeSpanEnd((node.left));
      if ( leftEnd > best ) {
        best = leftEnd;
      }
    }
    if ( typeof(node.right) != "undefined" ) {
      const rightEnd = this.nodeSpanEnd((node.right));
      if ( rightEnd > best ) {
        best = rightEnd;
      }
    }
    if ( typeof(node.init) != "undefined" ) {
      const initEnd = this.nodeSpanEnd((node.init));
      if ( initEnd > best ) {
        best = initEnd;
      }
    }
    if ( typeof(node.test) != "undefined" ) {
      const testEnd = this.nodeSpanEnd((node.test));
      if ( testEnd > best ) {
        best = testEnd;
      }
    }
    if ( typeof(node.consequent) != "undefined" ) {
      const consEnd = this.nodeSpanEnd((node.consequent));
      if ( consEnd > best ) {
        best = consEnd;
      }
    }
    if ( typeof(node.alternate) != "undefined" ) {
      const altEnd = this.nodeSpanEnd((node.alternate));
      if ( altEnd > best ) {
        best = altEnd;
      }
    }
    let i = 0;
    while (i < (node.children.length)) {
      const childEnd = this.nodeSpanEnd((node.children[i]));
      if ( childEnd > best ) {
        best = childEnd;
      }
      i = i + 1;
    };
    return best;
  };
  declText (src, node) {
    let start = node.start;
    let end = this.nodeSpanEnd(node);
    const __len = src.length;
    if ( start < 0 ) {
      start = 0;
    }
    if ( end > __len ) {
      end = __len;
    }
    if ( end <= start ) {
      return "";
    }
    return src.substring(start, end );
  };
  isSceneAffectingFunction (name) {
    if ( name == "initState" ) {
      return true;
    }
    if ( name == "sprites" ) {
      return true;
    }
    if ( name == "resources" ) {
      return true;
    }
    if ( name == "screens" ) {
      return true;
    }
    if ( name == "createStaticBg" ) {
      return true;
    }
    if ( name == "staticLevelHeight" ) {
      return true;
    }
    if ( name == "backgroundImage" ) {
      return true;
    }
    return false;
  };
  collectFromNode (src, node, decls) {
    if ( node.nodeType == "FunctionDeclaration" ) {
      if ( node.name == "render" ) {
        return;
      }
      const d = new TSTopLevelDecl();
      d.name = node.name;
      d.declKind = "function";
      d.node = node;
      d.text = this.declText(src, node);
      decls.push(d);
      return;
    }
    if ( node.nodeType == "VariableDeclaration" ) {
      let i = 0;
      while (i < (node.children.length)) {
        const decl = node.children[i];
        if ( decl.nodeType == "VariableDeclarator" ) {
          const d2 = new TSTopLevelDecl();
          d2.name = decl.name;
          d2.declKind = "variable";
          d2.node = node;
          d2.text = this.declText(src, node);
          decls.push(d2);
        }
        i = i + 1;
      };
      return;
    }
    if ( node.nodeType == "ExportNamedDeclaration" ) {
      if ( typeof(node.left) != "undefined" ) {
        this.collectFromNode(src, node.left, decls);
      }
      return;
    }
    if ( node.nodeType == "ExportDefaultDeclaration" ) {
      if ( typeof(node.left) != "undefined" ) {
        this.collectFromNode(src, node.left, decls);
      }
    }
  };
  collectTopLevelDecls (ast, src) {
    let decls = [];
    let i = 0;
    while (i < (ast.children.length)) {
      const node = ast.children[i];
      this.collectFromNode(src, node, decls);
      i = i + 1;
    };
    return decls;
  };
  findDeclByName (decls, name) {
    const empty = new TSNode();
    let i = 0;
    while (i < (decls.length)) {
      const d = decls[i];
      if ( d.name == name ) {
        return d.node;
      }
      i = i + 1;
    };
    return empty;
  };
  findDeclMeta (decls, name) {
    let i = 0;
    while (i < (decls.length)) {
      const d = decls[i];
      if ( d.name == name ) {
        return d.node;
      }
      i = i + 1;
    };
    const empty = new TSNode();
    return empty;
  };
  hasDeclByName (decls, name) {
    let i = 0;
    while (i < (decls.length)) {
      const d = decls[i];
      if ( d.name == name ) {
        return true;
      }
      i = i + 1;
    };
    return false;
  };
  findDeclText (decls, name) {
    let i = 0;
    while (i < (decls.length)) {
      const d = decls[i];
      if ( d.name == name ) {
        return d.text;
      }
      i = i + 1;
    };
    return "";
  };
  findDeclKind (decls, name) {
    let i = 0;
    while (i < (decls.length)) {
      const d = decls[i];
      if ( d.name == name ) {
        return d.declKind;
      }
      i = i + 1;
    };
    return "";
  };
  pushChange (result, kind, name, declKind, newNode) {
    const ch = new TSAstPatchChange();
    ch.changeKind = kind;
    ch.name = name;
    ch.declKind = declKind;
    ch.newNode = newNode;
    result.changes.push(ch);
    result.hasChanges = true;
    if ( declKind == "function" ) {
      result.functionsChanged = true;
      if ( this.isSceneAffectingFunction(name) ) {
        result.sceneAffecting = true;
      }
    }
    if ( declKind == "variable" ) {
      result.variablesChanged = true;
      result.sceneAffecting = true;
    }
  };
  diffTopLevel (oldAst, oldSrc, newAst, newSrc) {
    const result = new TSAstPatchResult();
    let emptyChanges = [];
    result.changes = emptyChanges;
    const oldDecls = this.collectTopLevelDecls(oldAst, oldSrc);
    const newDecls = this.collectTopLevelDecls(newAst, newSrc);
    let i = 0;
    while (i < (newDecls.length)) {
      const nd = newDecls[i];
      if ( this.hasDeclByName(oldDecls, nd.name) == false ) {
        this.pushChange(result, "added", nd.name, nd.declKind, nd.node);
      } else {
        const oldText = this.findDeclText(oldDecls, nd.name);
        if ( oldText != nd.text ) {
          this.pushChange(result, "modified", nd.name, nd.declKind, nd.node);
        }
      }
      i = i + 1;
    };
    let j = 0;
    while (j < (oldDecls.length)) {
      const od = oldDecls[j];
      if ( this.hasDeclByName(newDecls, od.name) == false ) {
        const emptyNode = new TSNode();
        this.pushChange(result, "removed", od.name, od.declKind, emptyNode);
      }
      j = j + 1;
    };
    return result;
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
  if ( trimmed == "auto" ) {
    return unit;
  }
  const lastChar = trimmed.charCodeAt((__len - 1) );
  if ( lastChar == 37 ) {
    const numStr = trimmed.substring(0, (__len - 1) );
    const numVal = isNaN( parseFloat(numStr) ) ? undefined : parseFloat(numStr);
    if ( typeof(numVal) != "undefined" ) {
      unit.value = numVal;
      unit.unitType = 1;
      unit.isSet = true;
    }
    return unit;
  }
  if ( __len >= 2 ) {
    const suffix = trimmed.substring((__len - 2), __len );
    if ( suffix == "em" ) {
      const numStr_1 = trimmed.substring(0, (__len - 2) );
      const numVal_1 = isNaN( parseFloat(numStr_1) ) ? undefined : parseFloat(numStr_1);
      if ( typeof(numVal_1) != "undefined" ) {
        unit.value = numVal_1;
        unit.unitType = 2;
        unit.isSet = true;
      }
      return unit;
    }
    if ( suffix == "px" ) {
      const numStr_2 = trimmed.substring(0, (__len - 2) );
      const numVal_2 = isNaN( parseFloat(numStr_2) ) ? undefined : parseFloat(numStr_2);
      if ( typeof(numVal_2) != "undefined" ) {
        unit.value = numVal_2;
        unit.pixels = unit.value;
        unit.unitType = 0;
        unit.isSet = true;
      }
      return unit;
    }
    if ( suffix == "hp" ) {
      const numStr_3 = trimmed.substring(0, (__len - 2) );
      const numVal_3 = isNaN( parseFloat(numStr_3) ) ? undefined : parseFloat(numStr_3);
      if ( typeof(numVal_3) != "undefined" ) {
        unit.value = numVal_3;
        unit.unitType = 3;
        unit.isSet = true;
      }
      return unit;
    }
  }
  const numVal_4 = isNaN( parseFloat(trimmed) ) ? undefined : parseFloat(trimmed);
  if ( typeof(numVal_4) != "undefined" ) {
    unit.value = numVal_4;
    unit.pixels = unit.value;
    unit.unitType = 0;
    unit.isSet = true;
  }
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
    this.format = "";
    this.orientation = "";
    this.pageWidth = 0.0;
    this.pageHeight = 0.0;
    this.children = [];
    this.opacity = 1.0;
    this.direction = "row";
    this.align = "left";
    this.verticalAlign = "top";
    this.isInline = false;
    this.lineBreak = false;
    this.overflow = "visible";
    this.fontFamily = "Noto Sans";
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
    this.imageViewBox = "";     /** note: unused */
    this.imageViewBoxX = 0.0;     /** note: unused */
    this.imageViewBoxY = 0.0;     /** note: unused */
    this.imageViewBoxW = 1.0;     /** note: unused */
    this.imageViewBoxH = 1.0;     /** note: unused */
    this.imageViewBoxSet = false;     /** note: unused */
    this.objectFit = "cover";
    this.sourceWidth = 0.0;     /** note: unused */
    this.sourceHeight = 0.0;     /** note: unused */
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
    this.calculatedInnerWidth = 0.0;     /** note: unused */
    this.calculatedInnerHeight = 0.0;     /** note: unused */
    this.calculatedFlexWidth = 0.0;     /** note: unused */
    this.calculatedPage = 0;     /** note: unused */
    this.isAbsolute = false;
    this.isLayoutComplete = false;     /** note: unused */
    this.unitsResolved = false;
    this.hasReturn = false;
    this.hasBreak = false;
    this.hasContinue = false;
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
    this.imageOffsetX = EVGUnit.unset();
    this.imageOffsetY = EVGUnit.unset();
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
    if ( (this.tagName == "layer") || (this.tagName == "Layer") ) {
      return true;
    }
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
  resolveBookFormat () {
    let w = 595.0;
    let h = 842.0;
    if ( this.format == "a4" ) {
      w = 595.0;
      h = 842.0;
    }
    if ( this.format == "letter" ) {
      w = 612.0;
      h = 792.0;
    }
    if ( this.format == "trade-5x8" ) {
      w = 360.0;
      h = 576.0;
    }
    if ( this.format == "trade-6x9" ) {
      w = 432.0;
      h = 648.0;
    }
    if ( this.format == "trade-8x10" ) {
      w = 576.0;
      h = 720.0;
    }
    if ( this.format == "mini-square" ) {
      w = 360.0;
      h = 360.0;
    }
    if ( this.format == "small-square" ) {
      w = 504.0;
      h = 504.0;
    }
    if ( this.format == "standard-portrait" ) {
      w = 576.0;
      h = 720.0;
    }
    if ( this.format == "standard-landscape" ) {
      w = 720.0;
      h = 576.0;
    }
    if ( this.format == "large-landscape" ) {
      w = 936.0;
      h = 792.0;
    }
    if ( this.format == "large-square" ) {
      w = 864.0;
      h = 864.0;
    }
    if ( this.format == "magazine" ) {
      w = 612.0;
      h = 792.0;
    }
    if ( this.orientation == "landscape" ) {
      if ( w < h ) {
        const temp = w;
        w = h;
        h = temp;
      }
    }
    if ( this.orientation == "portrait" ) {
      if ( w > h ) {
        const temp_1 = w;
        w = h;
        h = temp_1;
      }
    }
    if ( this.pageWidth > 0.0 ) {
      w = this.pageWidth;
    }
    if ( this.pageHeight > 0.0 ) {
      h = this.pageHeight;
    }
    this.pageWidth = w;
    this.pageHeight = h;
  };
  inheritProperties (parentEl) {
    if ( this.fontFamily == "Noto Sans" ) {
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
    if ( name == "format" ) {
      this.format = value.toLowerCase();
      return;
    }
    if ( name == "orientation" ) {
      this.orientation = value.toLowerCase();
      return;
    }
    if ( name == "pageWidth" ) {
      const pw = isNaN( parseFloat(value) ) ? undefined : parseFloat(value);
      if ( typeof(pw) != "undefined" ) {
        this.pageWidth = pw;
      }
      return;
    }
    if ( name == "pageHeight" ) {
      const ph = isNaN( parseFloat(value) ) ? undefined : parseFloat(value);
      if ( typeof(ph) != "undefined" ) {
        this.pageHeight = ph;
      }
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
    if ( (name == "object-fit") || (name == "objectFit") ) {
      this.objectFit = value;
      return;
    }
    if ( (name == "image-offset-x") || (name == "imageOffsetX") ) {
      this.imageOffsetX = EVGUnit.parse(value);
      return;
    }
    if ( (name == "image-offset-y") || (name == "imageOffsetY") ) {
      this.imageOffsetY = EVGUnit.parse(value);
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
class EvalValue  {
  constructor() {
    this.valueType = 0;
    this.numberValue = 0.0;
    this.stringValue = "";
    this.boolValue = false;
    this.arrayValue = [];
    this.objectMap = {};
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
  isElement () {
    return this.valueType == 7;
  };
  isUndefined () {
    return this.valueType == 8;
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
    if ( this.valueType == 8 ) {
      return "undefined";
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
      const keyList = Object.keys(this.objectMap);
      let i_1 = 0;
      for ( let idx = 0; idx < keyList.length; idx++) {
        var kk = keyList[idx];
        if ( i_1 > 0 ) {
          result_1 = result_1 + ", ";
        }
        const val = (( this.objectMap.hasOwnProperty(kk) ? this.objectMap[kk] : undefined ));
        const valStr = (val).toString();
        result_1 = ((result_1 + kk) + ": ") + valStr;
        i_1 = i_1 + 1;
      };
      return result_1 + "}";
    }
    if ( this.valueType == 6 ) {
      return ("[Function: " + this.functionName) + "]";
    }
    if ( this.valueType == 7 ) {
      if ( typeof(this.evgElement) != "undefined" ) {
        const el = this.evgElement;
        return ("[EVGElement: " + el.tagName) + "]";
      }
      return "[EVGElement: null]";
    }
    return "undefined";
  };
  toBool () {
    if ( this.valueType == 0 ) {
      return false;
    }
    if ( this.valueType == 8 ) {
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
    if ( this.valueType == 7 ) {
      return true;
    }
    return false;
  };
  getMember (key) {
    if ( this.valueType == 5 ) {
      if ( ( typeof(this.objectMap[key] ) != "undefined" && this.objectMap.hasOwnProperty(key) ) ) {
        return (( this.objectMap.hasOwnProperty(key) ? this.objectMap[key] : undefined ));
      }
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
  setMember (key, value) {
    if ( this.valueType != 5 ) {
      return;
    }
    this.objectMap[key] = value;
  };
  setIndexAt (index, value) {
    if ( this.valueType != 4 ) {
      return;
    }
    while (index >= (this.arrayValue.length)) {
      this.arrayValue.push(EvalValue.null());
    };
    this.arrayValue[index] = value;
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
    if ( this.valueType == 8 ) {
      return other.valueType == 8;
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
  let i = 0;
  while (i < (keys.length)) {
    if ( i < (values.length) ) {
      v.objectMap[keys[i]] = values[i];
    }
    i = i + 1;
  };
  return v;
};
EvalValue.function = function(fnNode) {
  const v = new EvalValue();
  v.valueType = 6;
  v.functionNode = fnNode;
  v.functionName = fnNode.name;
  return v;
};
EvalValue.element = function(el) {
  const v = new EvalValue();
  v.valueType = 7;
  v.evgElement = el;
  return v;
};
EvalValue.undefined = function() {
  const v = new EvalValue();
  v.valueType = 8;
  return v;
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
    return ((((((degrees.toString())) + "° ") + ((minutes.toString()))) + "' ") + seconds) + "\"";
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
class ImportedSymbol  {
  constructor() {
    this.name = "";
    this.originalName = "";
    this.sourcePath = "";
    this.symbolType = "";
    this.helperFunctions = [];
  }
}
class EvalContext  {
  constructor() {
    this.bindings = {};
  }
  define (name, value) {
    this.bindings[name] = value;
  };
  lookup (name) {
    const found = ( this.bindings.hasOwnProperty(name) ? this.bindings[name] : undefined );
    if ( typeof(found) != "undefined" ) {
      return found;
    }
    if ( typeof(this.parent) != "undefined" ) {
      const p = this.parent;
      return p.lookup(name);
    }
    return EvalValue.null();
  };
  assignExisting (name, value) {
    if ( ( typeof(this.bindings[name] ) != "undefined" && this.bindings.hasOwnProperty(name) ) ) {
      this.bindings[name] = value;
      return true;
    }
    if ( typeof(this.parent) != "undefined" ) {
      const p = this.parent;
      return p.assignExisting(name, value);
    }
    return false;
  };
  assign (name, value) {
    if ( this.assignExisting(name, value) ) {
      return;
    }
    this.define(name, value);
  };
  removeBinding (name) {
    if ( ( typeof(this.bindings[name] ) != "undefined" && this.bindings.hasOwnProperty(name) ) ) {
      let newBindings = {};
      const keyList = Object.keys(this.bindings);
      for ( let idx = 0; idx < keyList.length; idx++) {
        var kk = keyList[idx];
        if ( kk != name ) {
          newBindings[kk] = (( this.bindings.hasOwnProperty(kk) ? this.bindings[kk] : undefined ));
        }
      };
      this.bindings = newBindings;
      return true;
    }
    if ( typeof(this.parent) != "undefined" ) {
      const p = this.parent;
      return p.removeBinding(name);
    }
    return false;
  };
  moduleScope () {
    if ( typeof(this.moduleRoot) != "undefined" ) {
      return this.moduleRoot;
    }
    return this;
  };
  has (name) {
    if ( ( typeof(this.bindings[name] ) != "undefined" && this.bindings.hasOwnProperty(name) ) ) {
      return true;
    }
    if ( typeof(this.parent) != "undefined" ) {
      const p = this.parent;
      return (p).has(name);
    }
    return false;
  };
  createChild () {
    const child = new EvalContext();
    child.parent = this;
    if ( typeof(this.moduleRoot) != "undefined" ) {
      child.moduleRoot = this.moduleRoot;
    } else {
      child.moduleRoot = this;
    }
    return child;
  };
}
class EvalNativeBridge  {
  constructor() {
  }
  has (name) {
    return false;
  };
  invoke (name, args) {
    return EvalValue.null();
  };
}
class ComponentEngine  {
  constructor() {
    this.source = "";
    this.basePath = "./";
    this.assetPaths = [];
    this.pageWidth = 595.0;
    this.pageHeight = 842.0;
    this.printFormat = "a4";
    this.printOrientation = "portrait";
    this.printMarginTop = 0.0;
    this.printMarginRight = 0.0;
    this.printMarginBottom = 0.0;
    this.printMarginLeft = 0.0;
    this.printPageCount = 1;
    this.imports = [];
    this.localComponents = [];
    this.loadedFiles = [];
    this.importLoading = [];
    this.importLoaded = [];
    this.primitives = [];
    this.scriptDidReturn = false;
    this.scriptReturnValue = EvalValue.null();
    this.loopBreak = false;
    this.loopContinue = false;
    this.quiet = false;
    this.astPatcher = new TSAstPatcher();
    this.resolvedImportDir = "./";
    const p = new TSParserSimple();
    this.parser = p;
    this.parser.tsxMode = true;
    let imp = [];
    this.imports = imp;
    let loc = [];
    this.localComponents = loc;
    let lf = [];
    this.loadedFiles = lf;
    let il = [];
    this.importLoading = il;
    let id = [];
    this.importLoaded = id;
    const host = new EvalContext();
    host.moduleRoot = host;
    this.hostScope = host;
    const mod = new EvalContext();
    mod.parent = this.hostScope;
    mod.moduleRoot = mod;
    this.moduleScope = mod;
    this.context = mod;
    let prim = [];
    this.primitives = prim;
    let ap = [];
    this.assetPaths = ap;
    this.primitives.push("View");
    this.primitives.push("Label");
    this.primitives.push("Print");
    this.primitives.push("Section");
    this.primitives.push("Page");
    this.primitives.push("Image");
    this.primitives.push("Path");
    this.primitives.push("Spacer");
    this.primitives.push("Divider");
    this.primitives.push("Layer");
    this.primitives.push("div");
    this.primitives.push("span");
    this.primitives.push("p");
    this.primitives.push("h1");
    this.primitives.push("h2");
    this.primitives.push("h3");
    this.primitives.push("img");
    this.primitives.push("path");
    this.primitives.push("layer");
  }
  trace (msg) {
    if ( this.quiet == false ) {
      console.log(msg);
    }
  };
  addAssetPath (path) {
    if ( (path.length) == 0 ) {
      return;
    }
    let i = 0;
    while (i < (this.assetPaths.length)) {
      if ( (this.assetPaths[i]) == path ) {
        return;
      }
      i = i + 1;
    };
    this.assetPaths.push(path);
  };
  setAssetPaths (paths) {
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
          this.assetPaths.push(part);
          console.log("ComponentEngine: Added asset path: " + part);
        }
        start = i + 1;
      }
      i = i + 1;
    };
  };
  resolveComponentPath (relativePath) {
    const fullPath = this.basePath + relativePath;
    let i = 0;
    while (i < (this.assetPaths.length)) {
      const assetDir = this.assetPaths[i];
      i = i + 1;
    };
    return fullPath;
  };
  getLoadedFiles () {
    return this.loadedFiles;
  };
  normalizeDirPath (dirPath) {
    if ( (dirPath.length) == 0 ) {
      return "./";
    }
    const last = dirPath.length;
    const lastCh = dirPath.substring((last - 1), last );
    if ( lastCh != "/" ) {
      return dirPath + "/";
    }
    return dirPath;
  };
  dirnameOfModulePath (fullPath) {
    let lastSlash = -1;
    let i = 0;
    while (i < (fullPath.length)) {
      const ch = fullPath.substring(i, (i + 1) );
      if ( ch == "/" ) {
        lastSlash = i;
      }
      i = i + 1;
    };
    if ( lastSlash < 0 ) {
      return "";
    }
    return fullPath.substring(0, (lastSlash + 1) );
  };
  moduleDirFromRead (searchDir, fullPath) {
    const subDir = this.dirnameOfModulePath(fullPath);
    return this.normalizeDirPath((searchDir + subDir));
  };
  isInStringList (value, list) {
    let i = 0;
    while (i < (list.length)) {
      if ( (list[i]) == value ) {
        return true;
      }
      i = i + 1;
    };
    return false;
  };
  listWithoutString (list, value) {
    let out = [];
    let i = 0;
    while (i < (list.length)) {
      const item = list[i];
      if ( item != value ) {
        out.push(item);
      }
      i = i + 1;
    };
    return out;
  };
  listWithStringIfMissing (list, value) {
    if ( this.isInStringList(value, list) ) {
      return list;
    }
    let out = [];
    let i = 0;
    while (i < (list.length)) {
      out.push(list[i]);
      i = i + 1;
    };
    out.push(value);
    return out;
  };
  clearImportState () {
    let empty = [];
    this.importLoading = empty;
    this.importLoaded = empty;
  };
  resetParseState () {
    const scope = new EvalContext();
    scope.parent = this.hostScope;
    scope.moduleRoot = scope;
    this.moduleScope = scope;
    this.context = scope;
    this.clearLocalComponents();
    this.clearImportState();
    let emptyFiles = [];
    this.loadedFiles = emptyFiles;
  };
  upsertLocalComponent (sym) {
    let i = 0;
    while (i < (this.localComponents.length)) {
      const existing = this.localComponents[i];
      if ( existing.name == sym.name ) {
        existing.functionNode = sym.functionNode;
        existing.originalName = sym.originalName;
        existing.sourcePath = sym.sourcePath;
        existing.symbolType = sym.symbolType;
        existing.helperFunctions = sym.helperFunctions;
        return;
      }
      i = i + 1;
    };
    this.localComponents.push(sym);
  };
  removeLocalComponentByName (name) {
    let out = [];
    let i = 0;
    while (i < (this.localComponents.length)) {
      const sym = this.localComponents[i];
      if ( sym.name != name ) {
        out.push(sym);
      }
      i = i + 1;
    };
    this.localComponents = out;
  };
  localNameForImport (exportName, exportNames, localNames) {
    let i = 0;
    while (i < (exportNames.length)) {
      if ( (exportNames[i]) == exportName ) {
        return localNames[i];
      }
      i = i + 1;
    };
    return exportName;
  };
  bindImportedFunction (exportName, localName, fnNode, helperFns, sourcePath) {
    const sym = new ImportedSymbol();
    sym.name = localName;
    sym.originalName = exportName;
    sym.sourcePath = sourcePath;
    sym.symbolType = "component";
    sym.functionNode = fnNode;
    sym.helperFunctions = helperFns;
    this.upsertLocalComponent(sym);
    this.defineModuleBinding(localName, EvalValue.function(fnNode));
    this.trace((((("Imported: " + localName) + " (") + exportName) + ") from ") + sourcePath);
  };
  rebindImportDeclaration (node) {
    let exportNames = [];
    let localNames = [];
    let j = 0;
    while (j < (node.children.length)) {
      const spec = node.children[j];
      if ( spec.nodeType == "ImportSpecifier" ) {
        if ( spec.kind != "type" ) {
          const exportName = spec.name;
          let localName = spec.name;
          if ( (spec.value.length) > 0 ) {
            localName = spec.value;
          }
          exportNames.push(exportName);
          localNames.push(localName);
        }
      }
      if ( spec.nodeType == "ImportDefaultSpecifier" ) {
        exportNames.push("default");
        localNames.push(spec.name);
      }
      j = j + 1;
    };
    let k = 0;
    while (k < (exportNames.length)) {
      const exportName_1 = exportNames[k];
      const localName_1 = localNames[k];
      const existing = this.moduleScope.lookup(exportName_1);
      if ( existing.isFunction() ) {
        if ( typeof(existing.functionNode) === "undefined" ) {
        } else {
          const fnNode = existing.functionNode;
          let emptyHelpers = [];
          this.bindImportedFunction(exportName_1, localName_1, fnNode, emptyHelpers, "");
        }
      } else {
        if ( false == existing.isNull() ) {
          this.defineModuleBinding(localName_1, existing);
        }
      }
      k = k + 1;
    };
  };
  parseFile (dirPath, fileName) {
    this.resetParseState();
    this.setBasePath(dirPath);
    const mainFilePath = this.basePath + fileName;
    this.loadedFiles.push(mainFilePath);
    const fileContent = (function(){ var b = require('fs').readFileSync(dirPath + '/' + fileName); var ab = new ArrayBuffer(b.length); var v = new Uint8Array(ab); for(var i=0;i<b.length;i++)v[i]=b[i]; ab._view = new DataView(ab); return ab; })();
    const src = (function(b){ var v = new Uint8Array(b); return String.fromCharCode.apply(null, v); })(fileContent);
    return this.parse(src);
  };
  setBasePath (dirPath) {
    this.basePath = dirPath;
    if ( (dirPath.length) > 0 ) {
      const last = dirPath.length;
      const lastCh = dirPath.substring((last - 1), last );
      if ( lastCh != "/" ) {
        this.basePath = dirPath + "/";
      }
    }
  };
  parse (src) {
    this.resetParseState();
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
  registerGlobal (name, value) {
    this.hostScope.define(name, value);
  };
  removeGlobal (name) {
    this.hostScope.removeBinding(name);
  };
  setNativeBridge (bridge) {
    this.nativeBridge = bridge;
  };
  collectCallArgs (node) {
    let args = [];
    let i = 0;
    while (i < (node.children.length)) {
      const argNode = node.children[i];
      args.push(this.evaluateExpr(argNode));
      i = i + 1;
    };
    return args;
  };
  defineModuleBinding (name, value) {
    this.moduleScope.define(name, value);
  };
  getGlobal (name) {
    const v = this.context.lookup(name);
    if ( false == v.isNull() ) {
      return v;
    }
    return this.hostScope.lookup(name);
  };
  parseProgramFromSrc (src) {
    const lexer = new TSLexer(src);
    const tokens = lexer.tokenize();
    this.parser.initParser(tokens);
    this.parser.tsxMode = true;
    return this.parser.parseProgram();
  };
  clearLocalComponents () {
    let empty = [];
    this.localComponents = empty;
  };
  loadScript (src) {
    this.source = src;
    const ast = this.parseProgramFromSrc(src);
    this.programAst = ast;
    const scope = new EvalContext();
    scope.parent = this.hostScope;
    scope.moduleRoot = scope;
    this.moduleScope = scope;
    this.context = scope;
    this.clearLocalComponents();
    this.clearImportState();
    let emptyFiles = [];
    this.loadedFiles = emptyFiles;
    this.processImports(ast);
    this.registerComponents(ast);
    this.processVariables(ast);
  };
  updateLocalComponentNode (name, node) {
    let i = 0;
    while (i < (this.localComponents.length)) {
      const sym = this.localComponents[i];
      if ( sym.name == name ) {
        sym.functionNode = node;
        return;
      }
      i = i + 1;
    };
    this.registerFunctionDeclaration(node);
  };
  patchScript (src) {
    if ( typeof(this.programAst) === "undefined" ) {
      this.loadScript(src);
      return true;
    }
    const oldAst = this.programAst;
    const oldSrc = this.source;
    const newAst = this.parseProgramFromSrc(src);
    const patch = this.astPatcher.diffTopLevel(oldAst, oldSrc, newAst, src);
    if ( patch.hasChanges == false ) {
      return false;
    }
    this.source = src;
    this.programAst = newAst;
    this.clearLocalComponents();
    this.clearImportState();
    this.processImports(newAst);
    let ci = 0;
    while (ci < (patch.changes.length)) {
      const ch = patch.changes[ci];
      if ( ch.changeKind == "removed" ) {
        this.moduleScope.removeBinding(ch.name);
        this.removeLocalComponentByName(ch.name);
        this.trace("Removed binding: " + ch.name);
      } else {
        if ( ch.declKind == "function" ) {
          if ( ch.changeKind != "removed" ) {
            if ( typeof(ch.newNode) != "undefined" ) {
              const fnNode = ch.newNode;
              this.updateLocalComponentNode(ch.name, fnNode);
              this.moduleScope.define(ch.name, EvalValue.function(fnNode));
              this.trace("Patched function: " + ch.name);
            }
          }
        }
        if ( ch.declKind == "variable" ) {
          if ( ch.changeKind != "removed" ) {
            if ( typeof(ch.newNode) != "undefined" ) {
              const varNode = ch.newNode;
              this.processModuleVariableDeclaration(varNode);
              this.trace("Patched variable: " + ch.name);
            }
          }
        }
      }
      ci = ci + 1;
    };
    return patch.sceneAffecting;
  };
  callFunction (name, props) {
    const fnValue = this.context.lookup(name);
    if ( false == fnValue.isFunction() ) {
      return EvalValue.null();
    }
    if ( typeof(fnValue.functionNode) === "undefined" ) {
      return EvalValue.null();
    }
    const fnNode = fnValue.functionNode;
    return this.evaluateFunctionCall(fnNode, props);
  };
  callRender (name, props) {
    const fnValue = this.context.lookup(name);
    if ( false == fnValue.isFunction() ) {
      const empty = new EVGElement();
      return empty;
    }
    if ( typeof(fnValue.functionNode) === "undefined" ) {
      const empty2 = new EVGElement();
      return empty2;
    }
    const fnNode = fnValue.functionNode;
    return this.evaluateFunctionWithProps(fnNode, props);
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
    if ( node.kind == "type" ) {
      return;
    }
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
    if ( (modulePath.indexOf(".d.ts")) >= 0 ) {
      return;
    }
    let importExportNames = [];
    let importLocalNames = [];
    let j = 0;
    while (j < (node.children.length)) {
      const spec = node.children[j];
      if ( spec.nodeType == "ImportSpecifier" ) {
        if ( spec.kind != "type" ) {
          const exportName = spec.name;
          let localName = spec.name;
          if ( (spec.value.length) > 0 ) {
            localName = spec.value;
          }
          importExportNames.push(exportName);
          importLocalNames.push(localName);
        }
      }
      if ( spec.nodeType == "ImportDefaultSpecifier" ) {
        importExportNames.push("default");
        importLocalNames.push(spec.name);
      }
      j = j + 1;
    };
    const fullPath = this.resolveModulePath(modulePath);
    if ( (fullPath.length) == 0 ) {
      return;
    }
    const importerBase = this.normalizeDirPath(this.basePath);
    this.resolvedImportDir = importerBase;
    const canonicalPath = importerBase + fullPath;
    if ( this.isInStringList(canonicalPath, this.importLoading) ) {
      this.trace("Import cycle skipped: " + canonicalPath);
      this.rebindImportDeclaration(node);
      return;
    }
    if ( this.isInStringList(canonicalPath, this.importLoaded) ) {
      this.rebindImportDeclaration(node);
      return;
    }
    this.importLoading.push(canonicalPath);
    const src = this.readImportSource(importerBase, fullPath);
    const foundDir = this.resolvedImportDir;
    const dirPath = this.moduleDirFromRead(foundDir, fullPath);
    this.resolvedImportDir = dirPath;
    if ( (src.length) == 0 ) {
      this.importLoading = this.listWithoutString(this.importLoading, canonicalPath);
      console.log("");
      console.log(("ERROR: Could not load component module: " + importerBase) + fullPath);
      console.log("");
      console.log("Please ensure the imported file exists. You may need to:");
      console.log("  1. Check that the import path is correct in your TSX file");
      console.log("  2. Make sure the component file exists in one of your asset paths:");
      let pathIdx = 0;
      while (pathIdx < (this.assetPaths.length)) {
        console.log("     - " + (this.assetPaths[pathIdx]));
        pathIdx = pathIdx + 1;
      };
      console.log("");
      return;
    }
    console.log(("Loading import: " + dirPath) + fullPath);
    const loadedFilePath = dirPath + fullPath;
    this.loadedFiles = this.listWithStringIfMissing(this.loadedFiles, loadedFilePath);
    const lexer = new TSLexer(src);
    const tokens = lexer.tokenize();
    const importParser = new TSParserSimple();
    importParser.initParser(tokens);
    importParser.tsxMode = true;
    const importAst = importParser.parseProgram();
    const savedBasePath = this.basePath;
    this.basePath = dirPath;
    this.processImports(importAst);
    this.basePath = savedBasePath;
    this.materializeImportedModule(importAst);
    let helperFns = [];
    let hk = 0;
    while (hk < (importAst.children.length)) {
      const hstmt = importAst.children[hk];
      if ( hstmt.nodeType == "FunctionDeclaration" ) {
        const hfnName = hstmt.name;
        if ( this.isInList(hfnName, importExportNames) == false ) {
          helperFns.push(hstmt);
          console.log("  Found helper function: " + hfnName);
        }
      }
      hk = hk + 1;
    };
    let k = 0;
    while (k < (importAst.children.length)) {
      const stmt = importAst.children[k];
      if ( stmt.nodeType == "ExportNamedDeclaration" ) {
        if ( typeof(stmt.left) != "undefined" ) {
          const declNode = stmt.left;
          if ( declNode.nodeType == "FunctionDeclaration" ) {
            const fnName = declNode.name;
            if ( this.isInList(fnName, importExportNames) ) {
              const localName_1 = this.localNameForImport(fnName, importExportNames, importLocalNames);
              this.bindImportedFunction(fnName, localName_1, declNode, helperFns, fullPath);
            }
          }
        }
      }
      if ( stmt.nodeType == "FunctionDeclaration" ) {
        const fnName_1 = stmt.name;
        if ( this.isInList(fnName_1, importExportNames) ) {
          const localName_2 = this.localNameForImport(fnName_1, importExportNames, importLocalNames);
          this.bindImportedFunction(fnName_1, localName_2, stmt, helperFns, fullPath);
        }
      }
      k = k + 1;
    };
    this.importLoading = this.listWithoutString(this.importLoading, canonicalPath);
    this.importLoaded = this.listWithStringIfMissing(this.importLoaded, canonicalPath);
  };
  materializeImportedModule (ast) {
    const saved = this.context;
    this.context = this.moduleScope;
    let i = 0;
    while (i < (ast.children.length)) {
      const node = ast.children[i];
      this.materializeImportedNode(node);
      i = i + 1;
    };
    this.context = saved;
  };
  materializeImportedNode (node) {
    if ( node.nodeType == "FunctionDeclaration" ) {
      if ( node.name != "render" ) {
        this.defineModuleBinding(node.name, EvalValue.function(node));
      }
      return;
    }
    if ( node.nodeType == "VariableDeclaration" ) {
      this.processModuleVariableDeclaration(node);
      return;
    }
    if ( node.nodeType == "ExportNamedDeclaration" ) {
      if ( typeof(node.left) != "undefined" ) {
        this.materializeImportedNode(node.left);
      }
      return;
    }
    if ( node.nodeType == "ExportDefaultDeclaration" ) {
      if ( typeof(node.left) != "undefined" ) {
        this.materializeImportedNode(node.left);
      }
    }
  };
  readImportSource (dirPath, fullPath) {
    if ( require("fs").existsSync(dirPath + "/" + fullPath ) ) {
      const content = (function(){ var b = require('fs').readFileSync(dirPath + '/' + fullPath); var ab = new ArrayBuffer(b.length); var v = new Uint8Array(ab); for(var i=0;i<b.length;i++)v[i]=b[i]; ab._view = new DataView(ab); return ab; })();
      const src = (function(b){ var v = new Uint8Array(b); return String.fromCharCode.apply(null, v); })(content);
      if ( (src.length) > 0 ) {
        this.resolvedImportDir = dirPath;
        return src;
      }
    }
    let i = 0;
    while (i < (this.assetPaths.length)) {
      const assetDir = this.assetPaths[i];
      if ( require("fs").existsSync(assetDir + "/" + fullPath ) ) {
        const tryBuf = (function(){ var b = require('fs').readFileSync(assetDir + '/' + fullPath); var ab = new ArrayBuffer(b.length); var v = new Uint8Array(ab); for(var i=0;i<b.length;i++)v[i]=b[i]; ab._view = new DataView(ab); return ab; })();
        const trySrc = (function(b){ var v = new Uint8Array(b); return String.fromCharCode.apply(null, v); })(tryBuf);
        if ( (trySrc.length) > 0 ) {
          this.resolvedImportDir = assetDir;
          return trySrc;
        }
      }
      i = i + 1;
    };
    return "";
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
      this.registerTopLevelNode(node);
      i = i + 1;
    };
  };
  registerTopLevelNode (node) {
    if ( node.nodeType == "FunctionDeclaration" ) {
      this.registerFunctionDeclaration(node);
      return;
    }
    if ( node.nodeType == "ExportNamedDeclaration" ) {
      if ( typeof(node.left) != "undefined" ) {
        this.registerTopLevelNode(node.left);
      }
      return;
    }
    if ( node.nodeType == "ExportDefaultDeclaration" ) {
      if ( typeof(node.left) != "undefined" ) {
        this.registerTopLevelNode(node.left);
      }
    }
  };
  registerFunctionDeclaration (node) {
    if ( node.name == "render" ) {
      return;
    }
    const sym = new ImportedSymbol();
    sym.name = node.name;
    sym.originalName = node.name;
    sym.symbolType = "component";
    sym.functionNode = node;
    this.upsertLocalComponent(sym);
    this.defineModuleBinding(node.name, EvalValue.function(node));
    this.trace("Registered local component: " + node.name);
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
      this.processTopLevelVarNode(node);
      i = i + 1;
    };
  };
  processTopLevelVarNode (node) {
    if ( node.nodeType == "VariableDeclaration" ) {
      this.processModuleVariableDeclaration(node);
      return;
    }
    if ( node.nodeType == "ExportNamedDeclaration" ) {
      if ( typeof(node.left) != "undefined" ) {
        this.processTopLevelVarNode(node.left);
      }
      return;
    }
    if ( node.nodeType == "ExportDefaultDeclaration" ) {
      if ( typeof(node.left) != "undefined" ) {
        this.processTopLevelVarNode(node.left);
      }
    }
  };
  processModuleVariableDeclaration (node) {
    const saved = this.context;
    this.context = this.moduleScope;
    let i = 0;
    while (i < (node.children.length)) {
      const decl = node.children[i];
      if ( decl.nodeType == "VariableDeclarator" ) {
        const varName = decl.name;
        if ( typeof(decl.init) != "undefined" ) {
          const initNode = decl.init;
          const value = this.evaluateExpr(initNode);
          this.moduleScope.define(varName, value);
          if ( false == this.quiet ) {
            this.trace((("Defined module binding: " + varName) + " = ") + (value).toString());
          }
        }
      }
      i = i + 1;
    };
    this.context = saved;
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
          if ( false == this.quiet ) {
            this.trace((("Defined variable: " + varName) + " = ") + (value).toString());
          }
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
  evaluateFunctionCall (fnNode, props) {
    const savedContext = this.context;
    let savedDidReturn = this.scriptDidReturn;
    let savedReturnValue = this.scriptReturnValue;
    savedDidReturn = this.scriptDidReturn;
    savedReturnValue = this.scriptReturnValue;
    this.scriptDidReturn = false;
    this.scriptReturnValue = EvalValue.null();
    this.context = this.context.createChild();
    if ( props.valueType != 0 ) {
      this.bindFunctionParams(fnNode, props);
    }
    const body = this.getFunctionBody(fnNode);
    const result = this.evaluateFunctionBodyValue(body);
    this.context = savedContext;
    this.scriptDidReturn = savedDidReturn;
    this.scriptReturnValue = savedReturnValue;
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
      if ( stmt.nodeType == "IfStatement" ) {
        const ifResult = this.evaluateIfStatement(stmt);
        if ( ifResult.hasReturn ) {
          return ifResult;
        }
      }
      if ( stmt.nodeType == "ForStatement" ) {
        const forResult = this.evaluateForStatement(stmt);
        if ( forResult.hasReturn ) {
          return forResult;
        }
      }
      if ( stmt.nodeType == "ForOfStatement" ) {
        const forOfResult = this.evaluateForOfStatement(stmt);
        if ( forOfResult.hasReturn ) {
          return forOfResult;
        }
      }
      if ( stmt.nodeType == "WhileStatement" ) {
        const whileResult = this.evaluateWhileStatement(stmt);
        if ( whileResult.hasReturn ) {
          return whileResult;
        }
      }
      if ( stmt.nodeType == "ExpressionStatement" ) {
        if ( typeof(stmt.left) != "undefined" ) {
          const exprNode = stmt.left;
          this.evaluateExprForSideEffect(exprNode);
        }
      }
      if ( stmt.nodeType == "ReturnStatement" ) {
        if ( typeof(stmt.left) != "undefined" ) {
          const returnExpr = stmt.left;
          return this.evaluateJSX(returnExpr);
        } else {
          const bareReturn = new EVGElement();
          bareReturn.hasReturn = true;
          return bareReturn;
        }
      }
      i = i + 1;
    };
    if ( (body.nodeType == "JSXElement") || (body.nodeType == "JSXFragment") ) {
      return this.evaluateJSX(body);
    }
    return empty;
  };
  evaluateFunctionBodyValue (body) {
    if ( body.nodeType == "BlockStatement" ) {
      const savedDidReturn = this.scriptDidReturn;
      const savedReturnValue = this.scriptReturnValue;
      this.scriptDidReturn = false;
      this.scriptReturnValue = EvalValue.null();
      this.runStatementList(body.children);
      const blockOut = this.scriptReturnValue;
      this.scriptDidReturn = savedDidReturn;
      this.scriptReturnValue = savedReturnValue;
      return blockOut;
    }
    let i = 0;
    while (i < (body.children.length)) {
      const stmt = body.children[i];
      if ( stmt.nodeType == "VariableDeclaration" ) {
        this.processVariableDeclaration(stmt);
      }
      if ( stmt.nodeType == "IfStatement" ) {
        const ifResult = this.evaluateIfStatement(stmt);
        if ( ifResult.hasReturn ) {
        }
      }
      if ( stmt.nodeType == "ForStatement" ) {
        this.runForStatementValue(stmt);
      }
      if ( stmt.nodeType == "ForOfStatement" ) {
        this.runForOfStatementValue(stmt);
      }
      if ( stmt.nodeType == "WhileStatement" ) {
        this.runWhileStatementValue(stmt);
      }
      if ( stmt.nodeType == "ExpressionStatement" ) {
        if ( typeof(stmt.left) != "undefined" ) {
          const exprNode = stmt.left;
          this.evaluateExprForSideEffect(exprNode);
        }
      }
      if ( stmt.nodeType == "ReturnStatement" ) {
        if ( typeof(stmt.left) != "undefined" ) {
          const returnExpr = stmt.left;
          return this.evaluateExpr(returnExpr);
        }
        return EvalValue.null();
      }
      i = i + 1;
    };
    if ( (body.nodeType == "JSXElement") || (body.nodeType == "JSXFragment") ) {
      const el = this.evaluateJSX(body);
      return EvalValue.element(el);
    }
    if ( (body.nodeType != "BlockStatement") && (body.nodeType != "") ) {
      return this.evaluateExpr(body);
    }
    return EvalValue.null();
  };
  runForStatementValue (stmt) {
    const savedBreak = this.loopBreak;
    const savedContinue = this.loopContinue;
    this.loopBreak = false;
    this.loopContinue = false;
    if ( typeof(stmt.init) != "undefined" ) {
      const initNode = stmt.init;
      if ( initNode.nodeType == "VariableDeclaration" ) {
        this.processVariableDeclaration(initNode);
      }
    }
    const maxIterations = 100000;
    let iterations = 0;
    let looping = true;
    while ((iterations < maxIterations) && looping) {
      if ( this.scriptDidReturn ) {
        looping = false;
      } else {
        let proceed = true;
        if ( typeof(stmt.left) != "undefined" ) {
          const testResult = this.evaluateExpr((stmt.left));
          if ( testResult.toBool() == false ) {
            proceed = false;
          }
        }
        if ( proceed == false ) {
          looping = false;
        } else {
          this.loopContinue = false;
          if ( typeof(stmt.body) != "undefined" ) {
            this.runBlockOrStatement(stmt.body);
          }
          if ( this.scriptDidReturn ) {
            looping = false;
          } else {
            if ( this.loopBreak ) {
              looping = false;
            } else {
              if ( typeof(stmt.right) != "undefined" ) {
                this.evaluateUpdateExpr(stmt.right);
              }
              iterations = iterations + 1;
            }
          }
        }
      }
    };
    this.loopBreak = savedBreak;
    this.loopContinue = savedContinue;
  };
  runForOfStatementValue (stmt) {
    const savedBreak = this.loopBreak;
    const savedContinue = this.loopContinue;
    this.loopBreak = false;
    this.loopContinue = false;
    let varName = "";
    if ( typeof(stmt.left) != "undefined" ) {
      const leftNode = stmt.left;
      if ( leftNode.nodeType == "VariableDeclaration" ) {
        if ( (leftNode.children.length) > 0 ) {
          const decl = leftNode.children[0];
          varName = decl.name;
        }
      }
    }
    if ( typeof(stmt.right) != "undefined" ) {
      const rightNode = stmt.right;
      const arrayValue = this.evaluateExpr(rightNode);
      if ( (arrayValue).isArray() ) {
        let i = 0;
        let looping = true;
        while ((i < (arrayValue.arrayValue.length)) && looping) {
          if ( this.scriptDidReturn ) {
            looping = false;
          } else {
            if ( this.loopBreak ) {
              looping = false;
            } else {
              const item = arrayValue.arrayValue[i];
              if ( (varName.length) > 0 ) {
                this.context.define(varName, item);
              }
              this.loopContinue = false;
              if ( typeof(stmt.body) != "undefined" ) {
                this.runBlockOrStatement(stmt.body);
              }
              if ( this.scriptDidReturn ) {
                looping = false;
              } else {
                if ( this.loopBreak ) {
                  looping = false;
                } else {
                  i = i + 1;
                }
              }
            }
          }
        };
      }
    }
    this.loopBreak = savedBreak;
    this.loopContinue = savedContinue;
  };
  runWhileStatementValue (stmt) {
    const savedBreak = this.loopBreak;
    const savedContinue = this.loopContinue;
    this.loopBreak = false;
    this.loopContinue = false;
    const maxIterations = 100000;
    let iterations = 0;
    let looping = true;
    while ((iterations < maxIterations) && looping) {
      if ( this.scriptDidReturn ) {
        looping = false;
      } else {
        let proceed = true;
        if ( typeof(stmt.left) != "undefined" ) {
          const testResult = this.evaluateExpr((stmt.left));
          if ( testResult.toBool() == false ) {
            proceed = false;
          }
        }
        if ( proceed == false ) {
          looping = false;
        } else {
          this.loopContinue = false;
          if ( typeof(stmt.body) != "undefined" ) {
            this.runBlockOrStatement(stmt.body);
          }
          if ( this.scriptDidReturn ) {
            looping = false;
          } else {
            if ( this.loopBreak ) {
              looping = false;
            } else {
              iterations = iterations + 1;
            }
          }
        }
      }
    };
    this.loopBreak = savedBreak;
    this.loopContinue = savedContinue;
  };
  runStatementList (stmts) {
    let i = 0;
    while (i < (stmts.length)) {
      if ( this.scriptDidReturn ) {
        return;
      }
      if ( this.loopBreak ) {
        return;
      }
      if ( this.loopContinue ) {
        return;
      }
      this.runStatementValue(stmts[i]);
      i = i + 1;
    };
  };
  runStatementValue (stmt) {
    if ( this.scriptDidReturn ) {
      return;
    }
    if ( stmt.nodeType == "ReturnStatement" ) {
      if ( typeof(stmt.left) != "undefined" ) {
        this.scriptReturnValue = this.evaluateExpr((stmt.left));
      } else {
        this.scriptReturnValue = EvalValue.null();
      }
      this.scriptDidReturn = true;
      return;
    }
    if ( stmt.nodeType == "VariableDeclaration" ) {
      this.processVariableDeclaration(stmt);
      return;
    }
    if ( stmt.nodeType == "ExpressionStatement" ) {
      if ( typeof(stmt.left) != "undefined" ) {
        this.evaluateExprForSideEffect(stmt.left);
      }
      return;
    }
    if ( stmt.nodeType == "IfStatement" ) {
      this.runIfValue(stmt);
      return;
    }
    if ( stmt.nodeType == "BlockStatement" ) {
      this.runStatementList(stmt.children);
      return;
    }
    if ( stmt.nodeType == "BreakStatement" ) {
      this.loopBreak = true;
      return;
    }
    if ( stmt.nodeType == "ContinueStatement" ) {
      this.loopContinue = true;
      return;
    }
    if ( stmt.nodeType == "ForStatement" ) {
      this.runForStatementValue(stmt);
      return;
    }
    if ( stmt.nodeType == "ForOfStatement" ) {
      this.runForOfStatementValue(stmt);
      return;
    }
    if ( stmt.nodeType == "WhileStatement" ) {
      this.runWhileStatementValue(stmt);
      return;
    }
  };
  runIfValue (node) {
    if ( typeof(node.left) != "undefined" ) {
      const cond = this.evaluateExpr((node.left));
      if ( cond.toBool() ) {
        if ( typeof(node.body) != "undefined" ) {
          this.runBlockOrStatement(node.body);
        }
      } else {
        if ( typeof(node.right) != "undefined" ) {
          this.runBlockOrStatement(node.right);
        }
      }
    }
  };
  runBlockOrStatement (blk) {
    if ( blk.nodeType == "BlockStatement" ) {
      this.runStatementList(blk.children);
    } else {
      this.runStatementValue(blk);
    }
  };
  evaluateIfStatement (node) {
    const result = new EVGElement();
    result.hasReturn = false;
    if ( typeof(node.left) != "undefined" ) {
      const condNode = node.left;
      const condition = this.evaluateExpr(condNode);
      if ( condition.toBool() ) {
        if ( typeof(node.body) != "undefined" ) {
          const thenBlock = node.body;
          const blockResult = this.evaluateStatementBlock(thenBlock);
          if ( blockResult.hasReturn ) {
            return blockResult;
          }
          if ( blockResult.hasBreak ) {
            return blockResult;
          }
          if ( blockResult.hasContinue ) {
            return blockResult;
          }
        }
      } else {
        if ( typeof(node.right) != "undefined" ) {
          const elseBlock = node.right;
          if ( elseBlock.nodeType == "IfStatement" ) {
            const elseIfResult = this.evaluateIfStatement(elseBlock);
            if ( elseIfResult.hasReturn ) {
              return elseIfResult;
            }
            if ( elseIfResult.hasBreak ) {
              return elseIfResult;
            }
            if ( elseIfResult.hasContinue ) {
              return elseIfResult;
            }
          } else {
            const blockResult_1 = this.evaluateStatementBlock(elseBlock);
            if ( blockResult_1.hasReturn ) {
              return blockResult_1;
            }
            if ( blockResult_1.hasBreak ) {
              return blockResult_1;
            }
            if ( blockResult_1.hasContinue ) {
              return blockResult_1;
            }
          }
        }
      }
    }
    return result;
  };
  evaluateStatementBlock (block) {
    const result = new EVGElement();
    result.hasReturn = false;
    if ( block.nodeType == "ContinueStatement" ) {
      result.hasContinue = true;
      return result;
    }
    if ( block.nodeType == "BreakStatement" ) {
      result.hasBreak = true;
      return result;
    }
    if ( block.nodeType == "ReturnStatement" ) {
      if ( typeof(block.left) != "undefined" ) {
        const returnExpr = block.left;
        const returnedEl = this.evaluateJSX(returnExpr);
        returnedEl.hasReturn = true;
        return returnedEl;
      } else {
        result.hasReturn = true;
        return result;
      }
    }
    if ( block.nodeType == "BlockStatement" ) {
      let i = 0;
      while (i < (block.children.length)) {
        const stmt = block.children[i];
        if ( stmt.nodeType == "VariableDeclaration" ) {
          this.processVariableDeclaration(stmt);
        }
        if ( stmt.nodeType == "IfStatement" ) {
          const ifResult = this.evaluateIfStatement(stmt);
          if ( ifResult.hasReturn ) {
            return ifResult;
          }
          if ( ifResult.hasBreak ) {
            return ifResult;
          }
          if ( ifResult.hasContinue ) {
            return ifResult;
          }
        }
        if ( stmt.nodeType == "ForStatement" ) {
          const forResult = this.evaluateForStatement(stmt);
          if ( forResult.hasReturn ) {
            return forResult;
          }
          if ( forResult.hasBreak ) {
            return forResult;
          }
          if ( forResult.hasContinue ) {
            return forResult;
          }
        }
        if ( stmt.nodeType == "ForOfStatement" ) {
          const forOfResult = this.evaluateForOfStatement(stmt);
          if ( forOfResult.hasReturn ) {
            return forOfResult;
          }
          if ( forOfResult.hasBreak ) {
            return forOfResult;
          }
          if ( forOfResult.hasContinue ) {
            return forOfResult;
          }
        }
        if ( stmt.nodeType == "WhileStatement" ) {
          const whileResult = this.evaluateWhileStatement(stmt);
          if ( whileResult.hasReturn ) {
            return whileResult;
          }
          if ( whileResult.hasBreak ) {
            return whileResult;
          }
          if ( whileResult.hasContinue ) {
            return whileResult;
          }
        }
        if ( stmt.nodeType == "ExpressionStatement" ) {
          if ( typeof(stmt.left) != "undefined" ) {
            const exprNode = stmt.left;
            this.evaluateExprForSideEffect(exprNode);
          }
        }
        if ( stmt.nodeType == "ReturnStatement" ) {
          if ( typeof(stmt.left) != "undefined" ) {
            const returnExpr_1 = stmt.left;
            const returnedEl_1 = this.evaluateJSX(returnExpr_1);
            returnedEl_1.hasReturn = true;
            return returnedEl_1;
          } else {
            result.hasReturn = true;
            return result;
          }
        }
        if ( stmt.nodeType == "ContinueStatement" ) {
          result.hasContinue = true;
          return result;
        }
        if ( stmt.nodeType == "BreakStatement" ) {
          result.hasBreak = true;
          return result;
        }
        i = i + 1;
      };
    }
    return result;
  };
  evaluateExprForSideEffect (node) {
    if ( node.nodeType == "CallExpression" ) {
      this.evaluateCallExprForSideEffect(node);
    }
    if ( node.nodeType == "UpdateExpression" ) {
      this.evaluateUpdateExpr(node);
    }
    if ( node.nodeType == "AssignmentExpression" ) {
      this.evaluateUpdateExpr(node);
    }
  };
  evaluateCallExprForSideEffect (node) {
    if ( typeof(node.left) != "undefined" ) {
      const calleeNode = node.left;
      if ( calleeNode.nodeType == "MemberExpression" ) {
        const methodName = calleeNode.name;
        if ( typeof(calleeNode.left) != "undefined" ) {
          const objNode = calleeNode.left;
          if ( objNode.nodeType == "Identifier" ) {
            const objName = objNode.name;
            const objValue = this.context.lookup(objName);
            if ( (methodName == "push") && (objValue).isArray() ) {
              if ( (node.children.length) > 0 ) {
                const argNode = node.children[0];
                const argValue = this.evaluateExpr(argNode);
                objValue.arrayValue.push(argValue);
                this.context.assign(objName, objValue);
              }
              return;
            }
          }
        }
      }
    }
    this.evaluateCallExpr(node);
  };
  evaluateForStatement (node) {
    const result = new EVGElement();
    result.hasReturn = false;
    this.trace("evaluateForStatement called");
    if ( typeof(node.init) != "undefined" ) {
      const initNode = node.init;
      this.trace("For init nodeType: " + initNode.nodeType);
      if ( initNode.nodeType == "VariableDeclaration" ) {
        this.processVariableDeclaration(initNode);
      }
    }
    const maxIterations = 10000;
    let iterations = 0;
    while (iterations < maxIterations) {
      if ( typeof(node.left) != "undefined" ) {
        const testNode = node.left;
        const testResult = this.evaluateExpr(testNode);
        if ( testResult.toBool() == false ) {
          return result;
        }
      }
      if ( typeof(node.body) != "undefined" ) {
        const bodyNode = node.body;
        const bodyResult = this.evaluateStatementBlock(bodyNode);
        if ( bodyResult.hasReturn ) {
          return bodyResult;
        }
        if ( bodyResult.hasBreak ) {
          return result;
        }
        if ( bodyResult.hasContinue ) {
          if ( typeof(node.right) != "undefined" ) {
            const updateNode = node.right;
            this.evaluateUpdateExpr(updateNode);
          }
          iterations = iterations + 1;
        } else {
          if ( typeof(node.right) != "undefined" ) {
            const updateNode_1 = node.right;
            this.evaluateUpdateExpr(updateNode_1);
          }
          iterations = iterations + 1;
        }
      } else {
        iterations = iterations + 1;
      }
    };
    return result;
  };
  evaluateForOfStatement (node) {
    const result = new EVGElement();
    result.hasReturn = false;
    let varName = "";
    if ( typeof(node.left) != "undefined" ) {
      const leftNode = node.left;
      if ( leftNode.nodeType == "VariableDeclaration" ) {
        if ( (leftNode.children.length) > 0 ) {
          const decl = leftNode.children[0];
          varName = decl.name;
        }
      }
    }
    if ( typeof(node.right) != "undefined" ) {
      const rightNode = node.right;
      const arrayValue = this.evaluateExpr(rightNode);
      if ( (arrayValue).isArray() ) {
        let i = 0;
        while (i < (arrayValue.arrayValue.length)) {
          const item = arrayValue.arrayValue[i];
          this.context.define(varName, item);
          if ( typeof(node.body) != "undefined" ) {
            const bodyNode = node.body;
            const bodyResult = this.evaluateStatementBlock(bodyNode);
            if ( bodyResult.hasReturn ) {
              return bodyResult;
            }
            if ( bodyResult.hasBreak ) {
              return result;
            }
            if ( bodyResult.hasContinue ) {
              i = i + 1;
            } else {
              i = i + 1;
            }
          } else {
            i = i + 1;
          }
        };
      }
    }
    return result;
  };
  evaluateWhileStatement (node) {
    const result = new EVGElement();
    result.hasReturn = false;
    const maxIterations = 100000;
    let iterations = 0;
    while (iterations < maxIterations) {
      if ( typeof(node.left) != "undefined" ) {
        const testNode = node.left;
        const testResult = this.evaluateExpr(testNode);
        if ( testResult.toBool() == false ) {
          return result;
        }
      } else {
        return result;
      }
      if ( typeof(node.body) != "undefined" ) {
        const bodyNode = node.body;
        const bodyResult = this.evaluateStatementBlock(bodyNode);
        if ( bodyResult.hasReturn ) {
          return bodyResult;
        }
        if ( bodyResult.hasBreak ) {
          return result;
        }
        if ( bodyResult.hasContinue ) {
          iterations = iterations + 1;
        } else {
          iterations = iterations + 1;
        }
      } else {
        iterations = iterations + 1;
      }
    };
    return result;
  };
  evaluateUpdateExpr (node) {
    if ( node.nodeType == "UpdateExpression" ) {
      if ( typeof(node.left) != "undefined" ) {
        const argNode = node.left;
        if ( argNode.nodeType == "Identifier" ) {
          const varName = argNode.name;
          const current = this.context.lookup(varName);
          const currentNum = current.toNumber();
          if ( node.value == "++" ) {
            this.context.assign(varName, EvalValue.number((currentNum + 1.0)));
          }
          if ( node.value == "--" ) {
            this.context.assign(varName, EvalValue.number((currentNum - 1.0)));
          }
        }
      }
    }
    if ( node.nodeType == "AssignmentExpression" ) {
      if ( typeof(node.left) != "undefined" ) {
        const leftNode = node.left;
        if ( leftNode.nodeType == "Identifier" ) {
          const varName_1 = leftNode.name;
          const op = node.value;
          if ( typeof(node.right) != "undefined" ) {
            const rightNode = node.right;
            const rightValue = this.evaluateExpr(rightNode);
            if ( op == "=" ) {
              this.context.assign(varName_1, rightValue);
            }
            if ( op == "+=" ) {
              const current_1 = this.context.lookup(varName_1);
              const isLeftStr = current_1.isString();
              const isRightStr = rightValue.isString();
              if ( isLeftStr || isRightStr ) {
                this.context.assign(varName_1, EvalValue.string(((current_1).toString() + (rightValue).toString())));
              } else {
                this.context.assign(varName_1, EvalValue.number((current_1.toNumber() + rightValue.toNumber())));
              }
            }
            if ( op == "-=" ) {
              const current_2 = this.context.lookup(varName_1);
              this.context.assign(varName_1, EvalValue.number((current_2.toNumber() - rightValue.toNumber())));
            }
            if ( op == "*=" ) {
              const current_3 = this.context.lookup(varName_1);
              this.context.assign(varName_1, EvalValue.number((current_3.toNumber() * rightValue.toNumber())));
            }
            if ( op == "/=" ) {
              const current_4 = this.context.lookup(varName_1);
              const rightNum = rightValue.toNumber();
              if ( rightNum != 0.0 ) {
                this.context.assign(varName_1, EvalValue.number((current_4.toNumber() / rightNum)));
              }
            }
          }
        }
        if ( leftNode.nodeType == "MemberExpression" ) {
          const op_1 = node.value;
          if ( op_1 == "=" ) {
            if ( typeof(node.right) != "undefined" ) {
              const rightNode_1 = node.right;
              const rightValue_1 = this.evaluateExpr(rightNode_1);
              let obj = EvalValue.null();
              let objName = "";
              if ( typeof(leftNode.left) != "undefined" ) {
                const objNode = leftNode.left;
                if ( objNode.nodeType == "Identifier" ) {
                  objName = objNode.name;
                  obj = this.context.lookup(objName);
                } else {
                  obj = this.evaluateExpr(objNode);
                }
              }
              if ( leftNode.computed ) {
                if ( typeof(leftNode.right) != "undefined" ) {
                  const indexExpr = leftNode.right;
                  const indexVal = this.evaluateExpr(indexExpr);
                  if ( indexVal.isNumber() ) {
                    obj.setIndexAt(Math.floor( indexVal.toNumber()), rightValue_1);
                  }
                  if ( indexVal.isString() ) {
                    obj.setMember(indexVal.stringValue, rightValue_1);
                  }
                }
              } else {
                obj.setMember(leftNode.name, rightValue_1);
              }
              if ( (objName.length) > 0 ) {
                this.context.assign(objName, obj);
              }
            }
          }
        }
      }
    }
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
    const val = this.evaluateExpr(node);
    if ( val.isElement() ) {
      if ( typeof(val.evgElement) != "undefined" ) {
        return val.evgElement;
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
    if ( ((tagName == "Label") || (tagName == "span")) || (tagName == "text") ) {
      element.elementType = 1;
    }
    if ( ((tagName == "Image") || (tagName == "img")) || (tagName == "image") ) {
      element.elementType = 2;
    }
    if ( (tagName == "Path") || (tagName == "path") ) {
      element.elementType = 3;
    }
    if ( typeof(jsxNode.left) != "undefined" ) {
      const openingEl_1 = jsxNode.left;
      this.evaluateAttributes(element, openingEl_1);
    }
    if ( tagName == "Print" ) {
      element.resolveBookFormat();
      if ( element.pageWidth > 0.0 ) {
        this.pageWidth = element.pageWidth;
      }
      if ( element.pageHeight > 0.0 ) {
        this.pageHeight = element.pageHeight;
      }
      this.printFormat = element.format;
      this.printOrientation = element.orientation;
      console.log((((((("Print settings: format=" + this.printFormat) + " orientation=") + this.printOrientation) + " ") + ((this.pageWidth.toString()))) + "x") + ((this.pageHeight.toString())));
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
    let foundIdx = -1;
    let i = 0;
    while (i < (this.localComponents.length)) {
      const sym = this.localComponents[i];
      if ( sym.name == name ) {
        foundIdx = i;
      }
      i = i + 1;
    };
    if ( foundIdx >= 0 ) {
      const sym_1 = this.localComponents[foundIdx];
      const props = this.evaluateProps(jsxNode);
      if ( typeof(sym_1.functionNode) != "undefined" ) {
        const fnNode = sym_1.functionNode;
        let hi = 0;
        while (hi < (sym_1.helperFunctions.length)) {
          const helperFn = sym_1.helperFunctions[hi];
          const helperName = helperFn.name;
          const helperValue = EvalValue.function(helperFn);
          this.context.define(helperName, helperValue);
          console.log("Registered helper function: " + helperName);
          hi = hi + 1;
        };
        return this.evaluateFunctionWithProps(fnNode, props);
      }
    }
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
    let hasExplicitChildren = false;
    let ci = 0;
    while (ci < (keys.length)) {
      if ( (keys[ci]) == "children" ) {
        hasExplicitChildren = true;
      }
      ci = ci + 1;
    };
    if ( hasExplicitChildren == false ) {
      const childElements = this.collectChildElements(jsxNode);
      if ( (childElements.length) > 0 ) {
        keys.push("children");
        if ( (childElements.length) == 1 ) {
          values.push(childElements[0]);
        } else {
          values.push(EvalValue.array(childElements));
        }
      }
    }
    return EvalValue.object(keys, values);
  };
  collectChildElements (jsxNode) {
    let results = [];
    let i = 0;
    while (i < (jsxNode.children.length)) {
      const child = jsxNode.children[i];
      if ( child.nodeType == "JSXElement" ) {
        const el = this.evaluateJSXElement(child);
        if ( (el.tagName.length) > 0 ) {
          results.push(EvalValue.element(el));
        }
      }
      if ( child.nodeType == "JSXText" ) {
        const text = this.trimText(child.value);
        if ( (text.length) > 0 ) {
          const textEl = new EVGElement();
          textEl.tagName = "text";
          textEl.textContent = text;
          results.push(EvalValue.element(textEl));
        }
      }
      if ( child.nodeType == "JSXExpressionContainer" ) {
        if ( typeof(child.left) != "undefined" ) {
          const exprNode = child.left;
          const exprValue = this.evaluateExpr(exprNode);
          if ( exprValue.isElement() ) {
            results.push(exprValue);
          }
          if ( (exprValue).isArray() ) {
            let ai = 0;
            while (ai < (exprValue.arrayValue.length)) {
              const arrItem = exprValue.arrayValue[ai];
              if ( arrItem.isElement() ) {
                results.push(arrItem);
              }
              ai = ai + 1;
            };
          }
        }
      }
      i = i + 1;
    };
    return results;
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
          result = this.smartJoinText(result, rawText);
        }
      }
      if ( child.nodeType == "JSXExpressionContainer" ) {
        if ( typeof(child.left) != "undefined" ) {
          const exprNode = child.left;
          const exprValue = this.evaluateExpr(exprNode);
          const exprStr = (exprValue).toString();
          result = this.smartJoinText(result, exprStr);
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
        accumulatedText = this.smartJoinText(accumulatedText, child.value);
        i = i + 1;
        continue;
      }
      if ( (accumulatedText.length) > 0 ) {
        const normalizedText = this.normalizeWhitespace(accumulatedText);
        const text = this.trimText(normalizedText);
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
        if ( typeof(exprNode.left) != "undefined" ) {
          const calleeNode = exprNode.left;
          if ( calleeNode.nodeType == "MemberExpression" ) {
            const methodName = calleeNode.name;
            if ( methodName == "map" ) {
              this.evaluateArrayMapChild(element, exprNode);
              return;
            }
          }
        }
        const callResult = this.evaluateExpr(exprNode);
        if ( (callResult).isArray() ) {
          let ai = 0;
          while (ai < (callResult.arrayValue.length)) {
            const arrItem = callResult.arrayValue[ai];
            if ( arrItem.isElement() ) {
              if ( typeof(arrItem.evgElement) != "undefined" ) {
                const arrChildEl = arrItem.evgElement;
                if ( (arrChildEl.tagName.length) > 0 ) {
                  element.addChild(arrChildEl);
                }
              }
            }
            ai = ai + 1;
          };
          return;
        }
        if ( callResult.isElement() ) {
          if ( typeof(callResult.evgElement) != "undefined" ) {
            const childEl = callResult.evgElement;
            if ( (childEl.tagName.length) > 0 ) {
              element.addChild(childEl);
            }
          }
          return;
        }
        const isStr = callResult.isString();
        const isNum = callResult.isNumber();
        if ( isStr || isNum ) {
          const textEl = new EVGElement();
          textEl.tagName = "text";
          textEl.textContent = (callResult).toString();
          element.addChild(textEl);
        }
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
      if ( value.isElement() ) {
        if ( typeof(value.evgElement) != "undefined" ) {
          const childEl_1 = value.evgElement;
          if ( (childEl_1.tagName.length) > 0 ) {
            element.addChild(childEl_1);
          }
        }
        return;
      }
      if ( (value).isArray() ) {
        let ai_1 = 0;
        while (ai_1 < (value.arrayValue.length)) {
          const arrItem_1 = value.arrayValue[ai_1];
          if ( arrItem_1.isElement() ) {
            if ( typeof(arrItem_1.evgElement) != "undefined" ) {
              const arrChildEl_1 = arrItem_1.evgElement;
              if ( (arrChildEl_1.tagName.length) > 0 ) {
                element.addChild(arrChildEl_1);
              }
            }
          }
          ai_1 = ai_1 + 1;
        };
        return;
      }
      const isStr_1 = value.isString();
      const isNum_1 = value.isNumber();
      if ( isStr_1 || isNum_1 ) {
        const textEl_1 = new EVGElement();
        textEl_1.tagName = "text";
        textEl_1.textContent = (value).toString();
        element.addChild(textEl_1);
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
    const nt = node.nodeType;
    if ( nt == "Identifier" ) {
      if ( node.name == "undefined" ) {
        return EvalValue.undefined();
      }
      return this.context.lookup(node.name);
    }
    if ( nt == "MemberExpression" ) {
      return this.evaluateMemberExpr(node);
    }
    if ( nt == "CallExpression" ) {
      return this.evaluateCallExpr(node);
    }
    if ( nt == "BinaryExpression" ) {
      return this.evaluateBinaryExpr(node);
    }
    if ( nt == "NumericLiteral" ) {
      const fastNum = isNaN( parseFloat(node.value) ) ? undefined : parseFloat(node.value);
      if ( typeof(fastNum) != "undefined" ) {
        return EvalValue.number((fastNum));
      }
      return EvalValue.number(0.0);
    }
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
    if ( node.nodeType == "TemplateLiteral" ) {
      console.log(("TemplateLiteral: processing template with " + (((node.children.length).toString()))) + " children");
      let templateText = "";
      let ti = 0;
      while (ti < (node.children.length)) {
        const templateChild = node.children[ti];
        console.log((((("TemplateLiteral child " + ((ti.toString()))) + ": nodeType=") + templateChild.nodeType) + " value=") + templateChild.value);
        if ( templateChild.nodeType == "TemplateElement" ) {
          const rawText = templateChild.value;
          const processedText = this.evaluateTemplateExpressions(rawText);
          templateText = templateText + processedText;
        }
        ti = ti + 1;
      };
      console.log(("TemplateLiteral: result = '" + templateText) + "'");
      return EvalValue.string(templateText);
    }
    if ( node.nodeType == "BooleanLiteral" ) {
      return EvalValue.boolean((node.value == "true"));
    }
    if ( node.nodeType == "NullLiteral" ) {
      return EvalValue.null();
    }
    if ( node.nodeType == "Identifier" ) {
      if ( node.name == "undefined" ) {
        return EvalValue.undefined();
      }
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
    if ( node.nodeType == "TSAsExpression" ) {
      if ( typeof(node.left) != "undefined" ) {
        return this.evaluateExpr((node.left));
      }
    }
    if ( node.nodeType == "TSNonNullExpression" ) {
      if ( typeof(node.left) != "undefined" ) {
        return this.evaluateExpr((node.left));
      }
    }
    if ( node.nodeType == "JSXElement" ) {
      const el = this.evaluateJSXElement(node);
      return EvalValue.element(el);
    }
    if ( node.nodeType == "JSXFragment" ) {
      const el_1 = new EVGElement();
      el_1.tagName = "div";
      this.evaluateChildren(el_1, node);
      return EvalValue.element(el_1);
    }
    if ( node.nodeType == "CallExpression" ) {
      return this.evaluateCallExpr(node);
    }
    return EvalValue.null();
  };
  evaluateCallExpr (node) {
    if ( typeof(node.left) != "undefined" ) {
      const callee = node.left;
      if ( callee.nodeType == "MemberExpression" ) {
        let obj = EvalValue.null();
        let methodName = "";
        if ( typeof(callee.left) != "undefined" ) {
          const objNode = callee.left;
          obj = this.evaluateExpr(objNode);
        }
        methodName = callee.name;
        if ( (methodName.length) == 0 ) {
          if ( typeof(callee.right) != "undefined" ) {
            const propNode = callee.right;
            methodName = propNode.name;
            if ( (methodName.length) == 0 ) {
              methodName = propNode.value;
            }
          }
        }
        if ( false == this.quiet ) {
          this.trace((("Method call: " + methodName) + " on value type=") + ((obj.valueType.toString())));
        }
        if ( methodName == "toFixed" ) {
          const numVal = obj.toNumber();
          let decimals = 0;
          if ( (node.children.length) > 0 ) {
            const argNode = node.children[0];
            const argVal = this.evaluateExpr(argNode);
            decimals = Math.floor( argVal.toNumber());
          }
          let multiplier = 1.0;
          let i = 0;
          while (i < decimals) {
            multiplier = multiplier * 10.0;
            i = i + 1;
          };
          const rounded = (Math.floor( ((numVal * multiplier) + 0.5)));
          const result = rounded / multiplier;
          let resultStr = (result.toString());
          const dotIdx = resultStr.indexOf(".");
          if ( decimals == 0 ) {
            if ( dotIdx >= 0 ) {
              return EvalValue.string((resultStr.substring(0, dotIdx )));
            }
            return EvalValue.string(resultStr);
          }
          if ( dotIdx < 0 ) {
            resultStr = resultStr + ".";
            let z = 0;
            while (z < decimals) {
              resultStr = resultStr + "0";
              z = z + 1;
            };
            return EvalValue.string(resultStr);
          }
          const currentDecimals = ((resultStr.length) - dotIdx) - 1;
          if ( currentDecimals < decimals ) {
            let p = currentDecimals;
            while (p < decimals) {
              resultStr = resultStr + "0";
              p = p + 1;
            };
          } else {
            resultStr = resultStr.substring(0, ((dotIdx + 1) + decimals) );
          }
          return EvalValue.string(resultStr);
        }
        if ( methodName == "toString" ) {
          return EvalValue.string((obj).toString());
        }
        if ( methodName == "toUpperCase" ) {
          return EvalValue.string(((obj).toString().toUpperCase()));
        }
        if ( methodName == "toLowerCase" ) {
          return EvalValue.string(((obj).toString().toLowerCase()));
        }
        if ( methodName == "trim" ) {
          return EvalValue.string(((obj).toString().trim()));
        }
        if ( methodName == "charAt" ) {
          const str = (obj).toString();
          let idx = 0;
          if ( (node.children.length) > 0 ) {
            const argNode_1 = node.children[0];
            const argVal_1 = this.evaluateExpr(argNode_1);
            idx = Math.floor( argVal_1.toNumber());
          }
          if ( idx < (str.length) ) {
            return EvalValue.string((str.substring(idx, (idx + 1) )));
          }
          return EvalValue.string("");
        }
        if ( methodName == "substring" ) {
          const str_1 = (obj).toString();
          let startIdx = 0;
          let endIdx = str_1.length;
          if ( (node.children.length) > 0 ) {
            const argNode_2 = node.children[0];
            const argVal_2 = this.evaluateExpr(argNode_2);
            startIdx = Math.floor( argVal_2.toNumber());
          }
          if ( (node.children.length) > 1 ) {
            const argNode2 = node.children[1];
            const argVal2 = this.evaluateExpr(argNode2);
            endIdx = Math.floor( argVal2.toNumber());
          }
          return EvalValue.string((str_1.substring(startIdx, endIdx )));
        }
        if ( methodName == "padStart" ) {
          const str_2 = (obj).toString();
          let targetLen = str_2.length;
          let padStr = " ";
          if ( (node.children.length) > 0 ) {
            const argNode_3 = node.children[0];
            const argVal_3 = this.evaluateExpr(argNode_3);
            targetLen = Math.floor( argVal_3.toNumber());
          }
          if ( (node.children.length) > 1 ) {
            const argNode2_1 = node.children[1];
            const argVal2_1 = this.evaluateExpr(argNode2_1);
            padStr = (argVal2_1).toString();
            if ( (padStr.length) == 0 ) {
              padStr = " ";
            }
          }
          const currentLen = str_2.length;
          if ( currentLen >= targetLen ) {
            return EvalValue.string(str_2);
          }
          let padding = "";
          const padLen = padStr.length;
          while ((padding.length) < (targetLen - currentLen)) {
            padding = padding + padStr;
          };
          const neededPad = targetLen - currentLen;
          if ( (padding.length) > neededPad ) {
            padding = padding.substring(0, neededPad );
          }
          return EvalValue.string((padding + str_2));
        }
        if ( methodName == "padEnd" ) {
          const str_3 = (obj).toString();
          let targetLen_1 = str_3.length;
          let padStr_1 = " ";
          if ( (node.children.length) > 0 ) {
            const argNode_4 = node.children[0];
            const argVal_4 = this.evaluateExpr(argNode_4);
            targetLen_1 = Math.floor( argVal_4.toNumber());
          }
          if ( (node.children.length) > 1 ) {
            const argNode2_2 = node.children[1];
            const argVal2_2 = this.evaluateExpr(argNode2_2);
            padStr_1 = (argVal2_2).toString();
            if ( (padStr_1.length) == 0 ) {
              padStr_1 = " ";
            }
          }
          const currentLen_1 = str_3.length;
          if ( currentLen_1 >= targetLen_1 ) {
            return EvalValue.string(str_3);
          }
          let padding_1 = "";
          const padLen_1 = padStr_1.length;
          while ((padding_1.length) < (targetLen_1 - currentLen_1)) {
            padding_1 = padding_1 + padStr_1;
          };
          const neededPad_1 = targetLen_1 - currentLen_1;
          if ( (padding_1.length) > neededPad_1 ) {
            padding_1 = padding_1.substring(0, neededPad_1 );
          }
          return EvalValue.string((str_3 + padding_1));
        }
        let mathObjName = "";
        if ( typeof(callee.left) != "undefined" ) {
          const mathObjNode = callee.left;
          if ( mathObjNode.nodeType == "Identifier" ) {
            mathObjName = mathObjNode.name;
          }
        }
        if ( mathObjName == "Math" ) {
          if ( (node.children.length) > 0 ) {
            const argNode_5 = node.children[0];
            const argVal_5 = this.evaluateExpr(argNode_5);
            const num = argVal_5.toNumber();
            if ( methodName == "round" ) {
              return EvalValue.number(((Math.floor( (num + 0.5)))));
            }
            if ( methodName == "floor" ) {
              return EvalValue.number(((Math.floor( num))));
            }
            if ( methodName == "ceil" ) {
              const intPart = Math.floor( num);
              if ( num > (intPart) ) {
                return EvalValue.number(((intPart + 1)));
              }
              return EvalValue.number((intPart));
            }
            if ( methodName == "abs" ) {
              if ( num < 0.0 ) {
                return EvalValue.number((0.0 - num));
              }
              return EvalValue.number(num);
            }
            if ( methodName == "sin" ) {
              const s = Math.sin(num);
              return EvalValue.number(s);
            }
            if ( methodName == "cos" ) {
              const c = Math.cos(num);
              return EvalValue.number(c);
            }
          }
        }
        console.log("Warning: Unhandled method call: " + methodName);
        return EvalValue.null();
      }
      if ( callee.nodeType == "Identifier" ) {
        const fnName = callee.name;
        if ( false == this.quiet ) {
          this.trace("Evaluating function call: " + fnName);
        }
        if ( fnName == "usePrintSettings" ) {
          return this.evaluateUsePrintSettings();
        }
        if ( fnName == "useImage" ) {
          let srcArg = "";
          if ( (node.children.length) > 0 ) {
            const argNode_6 = node.children[0];
            this.trace("useImage arg nodeType: " + argNode_6.nodeType);
            const argValue = this.evaluateExpr(argNode_6);
            if ( false == this.quiet ) {
              this.trace((("useImage arg value: " + (argValue).toString()) + " type=") + ((argValue.valueType.toString())));
            }
            srcArg = argValue.stringValue;
            this.trace("useImage srcArg: " + srcArg);
          }
          return this.evaluateUseImage(srcArg);
        }
        if ( typeof(this.nativeBridge) != "undefined" ) {
          const bridge = this.nativeBridge;
          if ( (bridge).has(fnName) ) {
            const nativeArgs = this.collectCallArgs(node);
            return bridge.invoke(fnName, nativeArgs);
          }
        }
        const fnValue = this.context.lookup(fnName);
        if ( false == this.quiet ) {
          this.trace((((("Lookup function '" + fnName) + "' -> type=") + ((fnValue.valueType.toString()))) + " isFunction=") + ((fnValue.isFunction().toString())));
        }
        if ( fnValue.isFunction() ) {
          if ( typeof(fnValue.functionNode) != "undefined" ) {
            const fnNode = fnValue.functionNode;
            const savedContext = this.context;
            let savedDidReturn = this.scriptDidReturn;
            let savedReturnValue = this.scriptReturnValue;
            savedDidReturn = this.scriptDidReturn;
            savedReturnValue = this.scriptReturnValue;
            this.scriptDidReturn = false;
            this.scriptReturnValue = EvalValue.null();
            this.context = this.context.createChild();
            const numArgs = node.children.length;
            const numParams = fnNode.params.length;
            if ( false == this.quiet ) {
              this.trace(((((("Function " + fnName) + " called with ") + ((numArgs.toString()))) + " args, has ") + ((numParams.toString()))) + " params");
            }
            let argIdx = 0;
            while (argIdx < numParams) {
              if ( argIdx < numArgs ) {
                const argNode_7 = node.children[argIdx];
                const argValue_1 = this.evaluateExpr(argNode_7);
                const paramNode = fnNode.params[argIdx];
                const paramName = paramNode.name;
                if ( false == this.quiet ) {
                  this.trace((("Binding param '" + paramName) + "' = ") + (argValue_1).toString());
                }
                this.context.define(paramName, argValue_1);
              }
              argIdx = argIdx + 1;
            };
            const body = this.getFunctionBody(fnNode);
            const result_1 = this.evaluateFunctionBodyValue(body);
            this.context = savedContext;
            this.scriptDidReturn = savedDidReturn;
            this.scriptReturnValue = savedReturnValue;
            return result_1;
          }
        }
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
    if ( op == "??" ) {
      if ( typeof(node.left) != "undefined" ) {
        const leftExpr_2 = node.left;
        const left_2 = this.evaluateExpr(leftExpr_2);
        if ( false == left_2.isNull() ) {
          return left_2;
        }
        if ( typeof(node.right) != "undefined" ) {
          const rightExpr_2 = node.right;
          return this.evaluateExpr(rightExpr_2);
        }
      }
    }
    let left_3 = EvalValue.null();
    let right = EvalValue.null();
    if ( typeof(node.left) != "undefined" ) {
      const leftExpr_3 = node.left;
      left_3 = this.evaluateExpr(leftExpr_3);
    }
    if ( typeof(node.right) != "undefined" ) {
      const rightExpr_3 = node.right;
      right = this.evaluateExpr(rightExpr_3);
    }
    if ( op == "+" ) {
      const isLeftStr = left_3.isString();
      const isRightStr = right.isString();
      if ( isLeftStr || isRightStr ) {
        return EvalValue.string(((left_3).toString() + (right).toString()));
      }
      return EvalValue.number((left_3.toNumber() + right.toNumber()));
    }
    if ( op == "-" ) {
      return EvalValue.number((left_3.toNumber() - right.toNumber()));
    }
    if ( op == "*" ) {
      return EvalValue.number((left_3.toNumber() * right.toNumber()));
    }
    if ( op == "/" ) {
      const rightNum = right.toNumber();
      if ( rightNum != 0.0 ) {
        return EvalValue.number((left_3.toNumber() / rightNum));
      }
      return EvalValue.number(0.0);
    }
    if ( op == "%" ) {
      const leftInt = Math.floor( left_3.toNumber());
      const rightInt = Math.floor( right.toNumber());
      if ( rightInt != 0 ) {
        return EvalValue.fromInt((leftInt % rightInt));
      }
      return EvalValue.number(0.0);
    }
    if ( op == "|" ) {
      const leftInt_1 = Math.floor( left_3.toNumber());
      const rightInt_1 = Math.floor( right.toNumber());
      return EvalValue.fromInt(((leftInt_1 | rightInt_1)));
    }
    if ( op == "&" ) {
      const leftInt_2 = Math.floor( left_3.toNumber());
      const rightInt_2 = Math.floor( right.toNumber());
      return EvalValue.fromInt(((leftInt_2 & rightInt_2)));
    }
    if ( op == "^" ) {
      const leftInt_3 = Math.floor( left_3.toNumber());
      const rightInt_3 = Math.floor( right.toNumber());
      return EvalValue.fromInt(((leftInt_3 ^ rightInt_3)));
    }
    if ( op == "<" ) {
      return EvalValue.boolean((left_3.toNumber() < right.toNumber()));
    }
    if ( op == ">" ) {
      return EvalValue.boolean((left_3.toNumber() > right.toNumber()));
    }
    if ( op == "<=" ) {
      return EvalValue.boolean((left_3.toNumber() <= right.toNumber()));
    }
    if ( op == ">=" ) {
      return EvalValue.boolean((left_3.toNumber() >= right.toNumber()));
    }
    if ( (op == "==") || (op == "===") ) {
      return EvalValue.boolean(left_3.equals(right));
    }
    if ( (op == "!=") || (op == "!==") ) {
      return EvalValue.boolean((left_3.equals(right) == false));
    }
    return EvalValue.null();
  };
  bindingExists (name) {
    return (this.context).has(name);
  };
  typeofTag (val) {
    if ( val.isUndefined() ) {
      return "undefined";
    }
    if ( val.isNull() ) {
      return "object";
    }
    if ( val.isNumber() ) {
      return "number";
    }
    if ( val.isString() ) {
      return "string";
    }
    if ( val.isBoolean() ) {
      return "boolean";
    }
    if ( val.isFunction() ) {
      return "function";
    }
    if ( (val).isArray() ) {
      return "object";
    }
    if ( val.isObject() ) {
      return "object";
    }
    if ( val.isElement() ) {
      return "object";
    }
    return "undefined";
  };
  evaluateTypeofExpr (node) {
    if ( typeof(node.left) != "undefined" ) {
      const argNode = node.left;
      if ( argNode.nodeType == "Identifier" ) {
        const name = argNode.name;
        if ( name == "undefined" ) {
          return EvalValue.string("undefined");
        }
        if ( false == this.bindingExists(name) ) {
          return EvalValue.string("undefined");
        }
        const val = this.context.lookup(name);
        return EvalValue.string(this.typeofTag(val));
      }
      const val_1 = this.evaluateExpr(argNode);
      return EvalValue.string(this.typeofTag(val_1));
    }
    return EvalValue.string("undefined");
  };
  evaluateUnaryExpr (node) {
    const op = node.value;
    if ( op == "typeof" ) {
      return this.evaluateTypeofExpr(node);
    }
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
      const propName = node.name;
      if ( leftExpr.nodeType == "Identifier" ) {
        if ( leftExpr.name == "Math" ) {
          if ( propName == "PI" ) {
            const pi = Math.PI;
            return EvalValue.number(pi);
          }
        }
      }
      const obj = this.evaluateExpr(leftExpr);
      if ( node.computed ) {
        if ( typeof(node.right) != "undefined" ) {
          const indexExpr = node.right;
          const indexVal = this.evaluateExpr(indexExpr);
          if ( false == this.quiet ) {
            this.trace((("  Index value: " + (indexVal).toString()) + " type=") + ((indexVal.valueType.toString())));
          }
          if ( indexVal.isNumber() ) {
            const idx = Math.floor( indexVal.toNumber());
            if ( false == this.quiet ) {
              this.trace((("  Getting index " + ((idx.toString()))) + " from array of length ") + (((obj.arrayValue.length).toString())));
            }
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
    if ( jsxTag == "Layer" ) {
      return "layer";
    }
    if ( jsxTag == "Label" ) {
      return "text";
    }
    if ( jsxTag == "Image" ) {
      return "image";
    }
    if ( jsxTag == "Path" ) {
      return "path";
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
    if ( jsxTag == "path" ) {
      return "path";
    }
    if ( jsxTag == "layer" ) {
      return "layer";
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
  startsWithPunctuation (s) {
    if ( (s.length) == 0 ) {
      return false;
    }
    const first = s.charCodeAt(0 );
    if ( (((((first == 44) || (first == 46)) || (first == 33)) || (first == 63)) || (first == 58)) || (first == 59) ) {
      return true;
    }
    if ( ((first == 41) || (first == 93)) || (first == 125) ) {
      return true;
    }
    if ( ((first == 39) || (first == 34)) || (first == 45) ) {
      return true;
    }
    return false;
  };
  endsWithOpenPunctuation (s) {
    const __len = s.length;
    if ( __len == 0 ) {
      return false;
    }
    const last = s.charCodeAt((__len - 1) );
    if ( (((last == 40) || (last == 91)) || (last == 123)) || (last == 45) ) {
      return true;
    }
    return false;
  };
  smartJoinText (existing, newText) {
    if ( (existing.length) == 0 ) {
      return newText;
    }
    if ( (newText.length) == 0 ) {
      return existing;
    }
    if ( this.startsWithPunctuation(newText) ) {
      return existing + newText;
    }
    if ( this.endsWithOpenPunctuation(existing) ) {
      return existing + newText;
    }
    return (existing + " ") + newText;
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
  evaluateTemplateExpressions (templateStr) {
    console.log(("evaluateTemplateExpressions: input = '" + templateStr) + "'");
    let result = "";
    const __len = templateStr.length;
    let i = 0;
    while (i < __len) {
      const ch = templateStr[i];
      if ( ch == "$" ) {
        if ( (i + 1) < __len ) {
          const nextCh = templateStr[(i + 1)];
          if ( nextCh == "{" ) {
            const exprStart = i + 2;
            let braceDepth = 1;
            let j = exprStart;
            while ((j < __len) && (braceDepth > 0)) {
              const c = templateStr[j];
              if ( c == "{" ) {
                braceDepth = braceDepth + 1;
              }
              if ( c == "}" ) {
                braceDepth = braceDepth - 1;
              }
              if ( braceDepth > 0 ) {
                j = j + 1;
              }
            };
            if ( braceDepth == 0 ) {
              const exprStr = templateStr.substring(exprStart, j );
              console.log(("evaluateTemplateExpressions: found expression '" + exprStr) + "'");
              const exprValue = this.evaluateTemplateExpression(exprStr);
              result = result + exprValue;
              i = j + 1;
            } else {
              result = result + ch;
              i = i + 1;
            }
          } else {
            result = result + ch;
            i = i + 1;
          }
        } else {
          result = result + ch;
          i = i + 1;
        }
      } else {
        result = result + ch;
        i = i + 1;
      }
    };
    return result;
  };
  evaluateTemplateExpression (exprStr) {
    console.log(("evaluateTemplateExpression: parsing '" + exprStr) + "'");
    const lexer = new TSLexer(exprStr);
    const tokens = lexer.tokenize();
    const parser_1 = new TSParserSimple();
    parser_1.initParser(tokens);
    const ast = parser_1.parseProgram();
    console.log(("evaluateTemplateExpression: AST has " + (((ast.children.length).toString()))) + " children");
    if ( (ast.children.length) > 0 ) {
      const stmt = ast.children[0];
      console.log("evaluateTemplateExpression: stmt.nodeType = " + stmt.nodeType);
      if ( stmt.nodeType == "ExpressionStatement" ) {
        if ( typeof(stmt.left) != "undefined" ) {
          const exprNode = stmt.left;
          console.log("evaluateTemplateExpression: exprNode.nodeType = " + exprNode.nodeType);
          const value = this.evaluateExpr(exprNode);
          console.log("evaluateTemplateExpression: result = " + (value).toString());
          return (value).toString();
        }
      }
      const value_1 = this.evaluateExpr(stmt);
      console.log("evaluateTemplateExpression: direct result = " + (value_1).toString());
      return (value_1).toString();
    }
    console.log(("evaluateTemplateExpression: fallback for '" + exprStr) + "'");
    return ("${" + exprStr) + "}";
  };
  evaluateUsePrintSettings () {
    console.log("Hook: usePrintSettings() called");
    let propNames = [];
    let propValues = [];
    propNames.push("format");
    const formatVal = EvalValue.string(this.printFormat);
    propValues.push(formatVal);
    propNames.push("width");
    const widthVal = EvalValue.number(this.pageWidth);
    propValues.push(widthVal);
    propNames.push("height");
    const heightVal = EvalValue.number(this.pageHeight);
    propValues.push(heightVal);
    propNames.push("orientation");
    const orientVal = EvalValue.string(this.printOrientation);
    propValues.push(orientVal);
    propNames.push("pageCount");
    const pageCountVal = EvalValue.number((this.printPageCount));
    propValues.push(pageCountVal);
    propNames.push("margins");
    let marginNames = [];
    let marginValues = [];
    marginNames.push("top");
    marginValues.push(EvalValue.number(this.printMarginTop));
    marginNames.push("right");
    marginValues.push(EvalValue.number(this.printMarginRight));
    marginNames.push("bottom");
    marginValues.push(EvalValue.number(this.printMarginBottom));
    marginNames.push("left");
    marginValues.push(EvalValue.number(this.printMarginLeft));
    const marginsVal = EvalValue.object(marginNames, marginValues);
    propValues.push(marginsVal);
    return EvalValue.object(propNames, propValues);
  };
  parseGPSCoordinate (direction, coordStr, originalValue) {
    let names = [];
    let values = [];
    names.push("direction");
    values.push(EvalValue.string(direction));
    let degrees = 0.0;
    let minutes = 0.0;
    let seconds = 0.0;
    console.log(("parseGPSCoordinate: coordStr = '" + coordStr) + "'");
    const hasDegreeSym = (coordStr.indexOf("°")) >= 0;
    if ( hasDegreeSym ) {
      const degEnd = coordStr.indexOf("°");
      console.log("parseGPSCoordinate: degEnd = " + ((degEnd.toString())));
      if ( degEnd > 0 ) {
        const degStr = coordStr.substring(0, degEnd );
        const cleanDegStr = this.extractNumber(degStr);
        console.log(((("parseGPSCoordinate: degStr = '" + degStr) + "' -> clean: '") + cleanDegStr) + "'");
        const degVal = isNaN( parseFloat(cleanDegStr) ) ? undefined : parseFloat(cleanDegStr);
        if ( typeof(degVal) != "undefined" ) {
          degrees = degVal;
        }
      }
      const minEnd = coordStr.indexOf("'");
      console.log("parseGPSCoordinate: minEnd = " + ((minEnd.toString())));
      if ( minEnd > degEnd ) {
        const minStr = coordStr.substring((degEnd + 1), minEnd );
        const cleanMinStr = this.extractNumber(minStr);
        console.log(((("parseGPSCoordinate: minStr = '" + minStr) + "' -> clean: '") + cleanMinStr) + "'");
        const minVal = isNaN( parseFloat(cleanMinStr) ) ? undefined : parseFloat(cleanMinStr);
        if ( typeof(minVal) != "undefined" ) {
          minutes = minVal;
        }
      }
      let secEnd = coordStr.indexOf("\"");
      console.log("parseGPSCoordinate: secEnd = " + ((secEnd.toString())));
      if ( secEnd < 0 ) {
        secEnd = coordStr.length;
      }
      if ( secEnd > minEnd ) {
        const secStr = coordStr.substring((minEnd + 1), secEnd );
        const cleanSecStr = this.extractNumber(secStr);
        console.log(((("parseGPSCoordinate: secStr = '" + secStr) + "' -> clean: '") + cleanSecStr) + "'");
        const secVal = isNaN( parseFloat(cleanSecStr) ) ? undefined : parseFloat(cleanSecStr);
        if ( typeof(secVal) != "undefined" ) {
          seconds = secVal;
        }
      }
    } else {
      const decVal = isNaN( parseFloat((coordStr.trim())) ) ? undefined : parseFloat((coordStr.trim()));
      if ( typeof(decVal) != "undefined" ) {
        const decimalDeg = decVal;
        const degreesInt = Math.floor(decimalDeg);
        degrees = degreesInt;
        const minFloat = (decimalDeg - degrees) * 60.0;
        const minutesInt = Math.floor(minFloat);
        minutes = minutesInt;
        seconds = (minFloat - minutes) * 60.0;
      }
    }
    console.log((((("parseGPSCoordinate: degrees=" + ((degrees.toString()))) + " minutes=") + ((minutes.toString()))) + " seconds=") + ((seconds.toString())));
    names.push("degrees");
    values.push(EvalValue.number(degrees));
    names.push("minutes");
    values.push(EvalValue.number(minutes));
    names.push("seconds");
    values.push(EvalValue.number(seconds));
    names.push("originalValue");
    values.push(EvalValue.string(originalValue));
    return EvalValue.object(names, values);
  };
  extractNumber (str) {
    let result = "";
    let i = 0;
    const __len = str.length;
    while (i < __len) {
      const chCode = str.charCodeAt(i );
      if ( (((chCode >= 48) && (chCode <= 57)) || (chCode == 46)) || (chCode == 45) ) {
        const chStr = str.substring(i, (i + 1) );
        result = result + chStr;
      }
      i = i + 1;
    };
    return result;
  };
  parseDateInfo (dateStr) {
    let names = [];
    let values = [];
    if ( (dateStr.length) < 10 ) {
      return EvalValue.null();
    }
    let year = 0;
    let month = 0;
    let day = 0;
    let hour = 0;
    let minute = 0;
    let second = 0;
    if ( (dateStr.length) >= 4 ) {
      const yearStr = dateStr.substring(0, 4 );
      const yearOpt = isNaN( parseFloat(yearStr) ) ? undefined : parseFloat(yearStr);
      if ( typeof(yearOpt) != "undefined" ) {
        year = Math.floor( (yearOpt));
      }
    }
    if ( (dateStr.length) >= 7 ) {
      const monthStr = dateStr.substring(5, 7 );
      const monthOpt = isNaN( parseFloat(monthStr) ) ? undefined : parseFloat(monthStr);
      if ( typeof(monthOpt) != "undefined" ) {
        month = Math.floor( (monthOpt));
      }
    }
    if ( (dateStr.length) >= 10 ) {
      const dayStr = dateStr.substring(8, 10 );
      const dayOpt = isNaN( parseFloat(dayStr) ) ? undefined : parseFloat(dayStr);
      if ( typeof(dayOpt) != "undefined" ) {
        day = Math.floor( (dayOpt));
      }
    }
    if ( (dateStr.length) >= 13 ) {
      const hourStr = dateStr.substring(11, 13 );
      const hourOpt = isNaN( parseFloat(hourStr) ) ? undefined : parseFloat(hourStr);
      if ( typeof(hourOpt) != "undefined" ) {
        hour = Math.floor( (hourOpt));
      }
    }
    if ( (dateStr.length) >= 16 ) {
      const minuteStr = dateStr.substring(14, 16 );
      const minuteOpt = isNaN( parseFloat(minuteStr) ) ? undefined : parseFloat(minuteStr);
      if ( typeof(minuteOpt) != "undefined" ) {
        minute = Math.floor( (minuteOpt));
      }
    }
    if ( (dateStr.length) >= 19 ) {
      const secondStr = dateStr.substring(17, 19 );
      const secondOpt = isNaN( parseFloat(secondStr) ) ? undefined : parseFloat(secondStr);
      if ( typeof(secondOpt) != "undefined" ) {
        second = Math.floor( (secondOpt));
      }
    }
    names.push("year");
    values.push(EvalValue.number((year)));
    names.push("month");
    values.push(EvalValue.number((month)));
    names.push("day");
    values.push(EvalValue.number((day)));
    names.push("hour");
    values.push(EvalValue.number((hour)));
    names.push("minute");
    values.push(EvalValue.number((minute)));
    names.push("second");
    values.push(EvalValue.number((second)));
    names.push("monthName");
    let monthName = "Unknown";
    if ( month == 1 ) {
      monthName = "January";
    }
    if ( month == 2 ) {
      monthName = "February";
    }
    if ( month == 3 ) {
      monthName = "March";
    }
    if ( month == 4 ) {
      monthName = "April";
    }
    if ( month == 5 ) {
      monthName = "May";
    }
    if ( month == 6 ) {
      monthName = "June";
    }
    if ( month == 7 ) {
      monthName = "July";
    }
    if ( month == 8 ) {
      monthName = "August";
    }
    if ( month == 9 ) {
      monthName = "September";
    }
    if ( month == 10 ) {
      monthName = "October";
    }
    if ( month == 11 ) {
      monthName = "November";
    }
    if ( month == 12 ) {
      monthName = "December";
    }
    values.push(EvalValue.string(monthName));
    names.push("monthShort");
    let monthShort = "Unk";
    if ( month == 1 ) {
      monthShort = "Jan";
    }
    if ( month == 2 ) {
      monthShort = "Feb";
    }
    if ( month == 3 ) {
      monthShort = "Mar";
    }
    if ( month == 4 ) {
      monthShort = "Apr";
    }
    if ( month == 5 ) {
      monthShort = "May";
    }
    if ( month == 6 ) {
      monthShort = "Jun";
    }
    if ( month == 7 ) {
      monthShort = "Jul";
    }
    if ( month == 8 ) {
      monthShort = "Aug";
    }
    if ( month == 9 ) {
      monthShort = "Sep";
    }
    if ( month == 10 ) {
      monthShort = "Oct";
    }
    if ( month == 11 ) {
      monthShort = "Nov";
    }
    if ( month == 12 ) {
      monthShort = "Dec";
    }
    values.push(EvalValue.string(monthShort));
    names.push("weekday");
    let weekdayName = "Unknown";
    let weekdayNum = 0;
    let adjustedMonth = month;
    let adjustedYear = year;
    if ( month < 3 ) {
      adjustedMonth = month + 12;
      adjustedYear = year - 1;
    }
    const k = adjustedYear % 100;
    const j = Math.floor( ((adjustedYear) / 100.0));
    const monthTerm = Math.floor( (((13 * (adjustedMonth + 1))) / 5.0));
    const kDiv4 = Math.floor( ((k) / 4.0));
    const jDiv4 = Math.floor( ((j) / 4.0));
    let h = (((((day + monthTerm) + k) + kDiv4) + jDiv4) - (2 * j)) % 7;
    if ( h < 0 ) {
      h = h + 7;
    }
    weekdayNum = (h + 6) % 7;
    if ( weekdayNum == 0 ) {
      weekdayName = "Sunday";
    }
    if ( weekdayNum == 1 ) {
      weekdayName = "Monday";
    }
    if ( weekdayNum == 2 ) {
      weekdayName = "Tuesday";
    }
    if ( weekdayNum == 3 ) {
      weekdayName = "Wednesday";
    }
    if ( weekdayNum == 4 ) {
      weekdayName = "Thursday";
    }
    if ( weekdayNum == 5 ) {
      weekdayName = "Friday";
    }
    if ( weekdayNum == 6 ) {
      weekdayName = "Saturday";
    }
    values.push(EvalValue.string(weekdayName));
    names.push("weekdayShort");
    let weekdayShort = "Unk";
    if ( weekdayNum == 0 ) {
      weekdayShort = "Sun";
    }
    if ( weekdayNum == 1 ) {
      weekdayShort = "Mon";
    }
    if ( weekdayNum == 2 ) {
      weekdayShort = "Tue";
    }
    if ( weekdayNum == 3 ) {
      weekdayShort = "Wed";
    }
    if ( weekdayNum == 4 ) {
      weekdayShort = "Thu";
    }
    if ( weekdayNum == 5 ) {
      weekdayShort = "Fri";
    }
    if ( weekdayNum == 6 ) {
      weekdayShort = "Sat";
    }
    values.push(EvalValue.string(weekdayShort));
    names.push("weekdayNumber");
    values.push(EvalValue.number((weekdayNum)));
    names.push("timeOfDay");
    let timeOfDay = "night";
    if ( (hour >= 5) && (hour < 12) ) {
      timeOfDay = "morning";
    }
    if ( (hour >= 12) && (hour < 14) ) {
      timeOfDay = "noon";
    }
    if ( (hour >= 14) && (hour < 17) ) {
      timeOfDay = "afternoon";
    }
    if ( (hour >= 17) && (hour < 21) ) {
      timeOfDay = "evening";
    }
    if ( (hour >= 21) || (hour < 5) ) {
      timeOfDay = "night";
    }
    values.push(EvalValue.string(timeOfDay));
    names.push("ampm");
    if ( hour < 12 ) {
      values.push(EvalValue.string("AM"));
    } else {
      values.push(EvalValue.string("PM"));
    }
    names.push("hour12");
    let hour12 = hour;
    if ( hour == 0 ) {
      hour12 = 12;
    } else {
      if ( hour > 12 ) {
        hour12 = hour - 12;
      }
    }
    values.push(EvalValue.number((hour12)));
    names.push("isoDate");
    let monthPad = (month.toString());
    if ( month < 10 ) {
      monthPad = "0" + monthPad;
    }
    let dayPad = (day.toString());
    if ( day < 10 ) {
      dayPad = "0" + dayPad;
    }
    values.push(EvalValue.string(((((((year.toString())) + "-") + monthPad) + "-") + dayPad)));
    names.push("time");
    let hourPad = (hour.toString());
    if ( hour < 10 ) {
      hourPad = "0" + hourPad;
    }
    let minPad = (minute.toString());
    if ( minute < 10 ) {
      minPad = "0" + minPad;
    }
    let secPad = (second.toString());
    if ( second < 10 ) {
      secPad = "0" + secPad;
    }
    values.push(EvalValue.string(((((hourPad + ":") + minPad) + ":") + secPad)));
    names.push("formatted");
    values.push(EvalValue.string(((((((weekdayName + ", ") + monthName) + " ") + ((day.toString()))) + ", ") + ((year.toString())))));
    names.push("shortFormatted");
    values.push(EvalValue.string(((((monthShort + " ") + ((day.toString()))) + ", ") + ((year.toString())))));
    names.push("originalValue");
    values.push(EvalValue.string(dateStr));
    return EvalValue.object(names, values);
  };
  evaluateUseImage (src) {
    let resolvedPath = src;
    if ( (src.length) > 0 ) {
      const firstChar = src.substring(0, 1 );
      if ( firstChar != "/" ) {
        let startsWithDotSlash = false;
        if ( (src.length) >= 2 ) {
          if ( (src.substring(0, 2 )) == "./" ) {
            startsWithDotSlash = true;
          }
        }
        if ( startsWithDotSlash ) {
          if ( this.basePath == "./" ) {
            resolvedPath = src;
          } else {
            resolvedPath = this.basePath + (src.substring(2, (src.length) ));
          }
        } else {
          resolvedPath = this.basePath + src;
        }
      }
    }
    console.log((("Hook: useImage() called with src: " + src) + " -> resolved: ") + resolvedPath);
    const lastSlash = resolvedPath.lastIndexOf("/");
    let dirPath = "";
    let fileName = resolvedPath;
    if ( lastSlash >= 0 ) {
      dirPath = resolvedPath.substring(0, (lastSlash + 1) );
      fileName = resolvedPath.substring((lastSlash + 1), (resolvedPath.length) );
    }
    console.log((("Hook: parsing JPEG - dir: " + dirPath) + " file: ") + fileName);
    const parser_1 = new JPEGMetadataParser();
    let metadata = parser_1.parseMetadata(dirPath, fileName);
    if ( metadata.isValid == false ) {
      let altDirPath = "";
      if ( (dirPath.indexOf("./")) == 0 ) {
        altDirPath = "./assets/" + (dirPath.substring(2, (dirPath.length) ));
      } else {
        altDirPath = "./assets/" + dirPath;
      }
      console.log(("Hook: useImage() trying alternative path: " + altDirPath) + fileName);
      metadata = parser_1.parseMetadata(altDirPath, fileName);
      if ( metadata.isValid ) {
        resolvedPath = altDirPath + fileName;
      }
    }
    let propNames = [];
    let propValues = [];
    propNames.push("resolvedPath");
    propValues.push(EvalValue.string(resolvedPath));
    propNames.push("width");
    propValues.push(EvalValue.number((metadata.width)));
    propNames.push("height");
    propValues.push(EvalValue.number((metadata.height)));
    propNames.push("createdAt");
    if ( (metadata.dateTimeOriginal.length) > 0 ) {
      propValues.push(EvalValue.string(metadata.dateTimeOriginal));
    } else {
      if ( (metadata.dateTime.length) > 0 ) {
        propValues.push(EvalValue.string(metadata.dateTime));
      } else {
        propValues.push(EvalValue.null());
      }
    }
    propNames.push("camera");
    if ( (metadata.cameraModel.length) > 0 ) {
      let cameraStr = "";
      if ( (metadata.cameraMake.length) > 0 ) {
        cameraStr = (metadata.cameraMake + " ") + metadata.cameraModel;
      } else {
        cameraStr = metadata.cameraModel;
      }
      propValues.push(EvalValue.string(cameraStr));
    } else {
      propValues.push(EvalValue.null());
    }
    propNames.push("orientation");
    propValues.push(EvalValue.number((metadata.orientation)));
    propNames.push("gps");
    if ( metadata.hasGPS ) {
      let gpsNames = [];
      let gpsValues = [];
      const latRaw = (metadata.gpsLatitudeRef + " ") + metadata.gpsLatitude;
      gpsNames.push("latitude");
      gpsValues.push(this.parseGPSCoordinate(metadata.gpsLatitudeRef, metadata.gpsLatitude, latRaw));
      const lonRaw = (metadata.gpsLongitudeRef + " ") + metadata.gpsLongitude;
      gpsNames.push("longitude");
      gpsValues.push(this.parseGPSCoordinate(metadata.gpsLongitudeRef, metadata.gpsLongitude, lonRaw));
      if ( (metadata.gpsAltitude.length) > 0 ) {
        gpsNames.push("altitude");
        gpsValues.push(EvalValue.string(metadata.gpsAltitude));
      }
      propValues.push(EvalValue.object(gpsNames, gpsValues));
    } else {
      propValues.push(EvalValue.null());
    }
    propNames.push("colorSpace");
    if ( metadata.colorComponents == 1 ) {
      propValues.push(EvalValue.string("Grayscale"));
    } else {
      if ( metadata.colorComponents == 3 ) {
        propValues.push(EvalValue.string("RGB"));
      } else {
        if ( metadata.colorComponents == 4 ) {
          propValues.push(EvalValue.string("CMYK"));
        } else {
          propValues.push(EvalValue.string("Unknown"));
        }
      }
    }
    propNames.push("bitsPerComponent");
    propValues.push(EvalValue.number((metadata.bitsPerComponent)));
    propNames.push("features");
    let featNames = [];
    let featValues = [];
    featNames.push("hasExif");
    const hasExif = ((((metadata.dateTimeOriginal.length) > 0) || ((metadata.cameraModel.length) > 0)) || metadata.hasGPS) || (metadata.orientation > 1);
    featValues.push(EvalValue.boolean(hasExif));
    featNames.push("hasGps");
    featValues.push(EvalValue.boolean(metadata.hasGPS));
    featNames.push("hasDateTime");
    const hasDateTime = ((metadata.dateTimeOriginal.length) > 0) || ((metadata.dateTime.length) > 0);
    featValues.push(EvalValue.boolean(hasDateTime));
    featNames.push("hasCamera");
    const hasCamera = (metadata.cameraModel.length) > 0;
    featValues.push(EvalValue.boolean(hasCamera));
    featNames.push("hasOrientation");
    const hasOrientation = metadata.orientation > 1;
    featValues.push(EvalValue.boolean(hasOrientation));
    propValues.push(EvalValue.object(featNames, featValues));
    propNames.push("dateInfo");
    if ( (metadata.dateTimeOriginal.length) > 0 ) {
      propValues.push(this.parseDateInfo(metadata.dateTimeOriginal));
    } else {
      if ( (metadata.dateTime.length) > 0 ) {
        propValues.push(this.parseDateInfo(metadata.dateTime));
      } else {
        propValues.push(EvalValue.null());
      }
    }
    return EvalValue.object(propNames, propValues);
  };
  setPrintSettings (format, orientation, width, height) {
    this.printFormat = format;
    this.printOrientation = orientation;
    this.pageWidth = width;
    this.pageHeight = height;
    console.log((((((("Print settings updated: " + format) + " ") + orientation) + " ") + ((width.toString()))) + "x") + ((height.toString())));
  };
  setPrintMargins (top, right, bottom, left) {
    this.printMarginTop = top;
    this.printMarginRight = right;
    this.printMarginBottom = bottom;
    this.printMarginLeft = left;
  };
}
class ComponentEngineModule  {
  constructor() {
  }
}
module.exports.Token = Token;
module.exports.TSLexer = TSLexer;
module.exports.TSNode = TSNode;
module.exports.TSParserSimple = TSParserSimple;
module.exports.TSTopLevelDecl = TSTopLevelDecl;
module.exports.TSAstPatchChange = TSAstPatchChange;
module.exports.TSAstPatchResult = TSAstPatchResult;
module.exports.TSAstPatcher = TSAstPatcher;
module.exports.EVGUnit = EVGUnit;
module.exports.EVGColor = EVGColor;
module.exports.EVGBox = EVGBox;
module.exports.EVGGradientStop = EVGGradientStop;
module.exports.EVGGradient = EVGGradient;
module.exports.EVGElement = EVGElement;
module.exports.EvalValue = EvalValue;
module.exports.BufferChunk = BufferChunk;
module.exports.GrowableBuffer = GrowableBuffer;
module.exports.ExifTag = ExifTag;
module.exports.JPEGMetadataInfo = JPEGMetadataInfo;
module.exports.JPEGMetadataParser = JPEGMetadataParser;
module.exports.JPEGMetadataMain = JPEGMetadataMain;
module.exports.ImportedSymbol = ImportedSymbol;
module.exports.EvalContext = EvalContext;
module.exports.EvalNativeBridge = EvalNativeBridge;
module.exports.ComponentEngine = ComponentEngine;
module.exports.ComponentEngineModule = ComponentEngineModule;
