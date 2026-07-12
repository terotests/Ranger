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
  isNameToken () {
    const t = this.peekType();
    if ( t == "Identifier" ) {
      return true;
    }
    if ( t == "TSType" ) {
      return true;
    }
    if ( t == "Keyword" ) {
      return true;
    }
    if ( t == "TSKeyword" ) {
      return true;
    }
    return false;
  };
  isObjectPropertyKeyToken () {
    if ( this.isNameToken() ) {
      return true;
    }
    const t = this.peekType();
    if ( t == "String" ) {
      return true;
    }
    if ( t == "Number" ) {
      return true;
    }
    if ( t == "Boolean" ) {
      return true;
    }
    if ( t == "Null" ) {
      return true;
    }
    return false;
  };
  parseMemberName () {
    if ( this.isNameToken() ) {
      const tok = this.peek();
      this.advance();
      return tok;
    }
    return this.expect("Identifier");
  };
  guardNoProgress (prevPos) {
    if ( this.pos != prevPos ) {
      return;
    }
    if ( this.quiet == false ) {
      const tok = this.peek();
      console.log(((("Parser recovery: skipping unexpected token '" + tok.value) + "' (type ") + tok.tokenType) + ")");
    }
    if ( this.isAtEnd() == false ) {
      this.advance();
    }
  };
  parseProgram () {
    const prog = new TSNode();
    prog.nodeType = "Program";
    while (this.isAtEnd() == false) {
      const beforePos = this.pos;
      const stmt = this.parseStatement();
      prog.children.push(stmt);
      this.guardNoProgress(beforePos);
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
      const beforePos = this.pos;
      const stmt = this.parseStatement();
      body.children.push(stmt);
      this.guardNoProgress(beforePos);
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
        const beforePos = this.pos;
        const stmt = this.parseStatement();
        body.children.push(stmt);
        this.guardNoProgress(beforePos);
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
        const beforePos = this.pos;
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
        this.guardNoProgress(beforePos);
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
      const beforePos = this.pos;
      const stmt = this.parseStatement();
      block.children.push(stmt);
      this.guardNoProgress(beforePos);
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
        const propTok = this.parseMemberName();
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
        if ( this.isNameToken() ) {
          const propTok_1 = this.parseMemberName();
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
      const loopStartPos = this.pos;
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
        if ( this.isObjectPropertyKeyToken() ) {
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
      if ( this.pos == loopStartPos ) {
        break;
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
class TSEmitter  {
  constructor() {
    this.output = "";
    this.indentLevel = 0;
    this.indentStr = "    ";
    this.currentFn = "";
    this.inSpritesFn = false;
    this.inInitFn = false;
    this.inUpdateFn = false;
    this.inResourcesFn = false;
    this.varTypes = {};
    this.stateVarName = "s";
    this.readEntityIds = [];
    this.readEntitySeen = {};
    this.readPlayerIndices = [];
    this.readPlayerSeen = {};
    this.inputVarName = "input";
    this.fnReturnTypes = {};
    this.fnParamTypesCsv = {};
    this.isHelperFn = {};
    this.constScalarTypes = {};
    this.constScalarValues = {};
    this.constArrayNames = {};
    this.constArrayElemType = {};
    this.interfaceFieldsCsv = {};
    this.interfaceNames = [];
    this.stateArrayFieldType = {};
    this.initStateLocalTypes = {};
    this.tmpCounter = 0;
    this.synthStructDone = {};
    this.moduleSingletonClass = "";
    this.moduleIdRaw = "";
    this.moduleConstDeferred = {};
    this.inModuleSingletonCtor = false;
    this.currentEmitBlock = new TSNode();
  }
  annotType (annot) {
    let node = annot;
    if ( annot.nodeType == "TSTypeAnnotation" ) {
      if ( typeof(annot.typeAnnotation) != "undefined" ) {
        node = annot.typeAnnotation;
      }
    }
    return this.typeNodeToRanger(node);
  };
  typeNodeToRanger (node) {
    const t = node.nodeType;
    if ( t == "TSNumberKeyword" ) {
      return "double";
    }
    if ( t == "TSStringKeyword" ) {
      return "string";
    }
    if ( t == "TSBooleanKeyword" ) {
      return "boolean";
    }
    if ( t == "TSArrayType" ) {
      let elem = "double";
      if ( typeof(node.left) != "undefined" ) {
        elem = this.typeNodeToRanger((node.left));
      }
      return ("[" + elem) + "]";
    }
    if ( t == "TSTypeReference" ) {
      return this.typeRefToRanger(node.name);
    }
    return "int";
  };
  typeRefToRanger (name) {
    if ( name == "int" ) {
      return "int";
    }
    if ( name == "float" ) {
      return "double";
    }
    if ( name == "double" ) {
      return "double";
    }
    if ( name == "number" ) {
      return "double";
    }
    if ( name == "i32" ) {
      return "int";
    }
    if ( name == "u8" ) {
      return "int";
    }
    if ( name == "u16" ) {
      return "int";
    }
    if ( name == "u32" ) {
      return "int";
    }
    if ( name == "f64" ) {
      return "double";
    }
    if ( name == "f32" ) {
      return "double";
    }
    if ( name == "string" ) {
      return "string";
    }
    if ( name == "boolean" ) {
      return "boolean";
    }
    if ( name == "bool" ) {
      return "boolean";
    }
    if ( name == "EntityPose" ) {
      return "EntityPoseNative";
    }
    if ( name == "SpriteDef" ) {
      return "SpriteDefNative";
    }
    if ( name == "GameState" ) {
      return "NativeGameState";
    }
    if ( name == "UpdateProps" ) {
      return "UpdatePropsNative";
    }
    if ( name == "IntMap" ) {
      return "[string:int]";
    }
    if ( name == "EntityMap" ) {
      return "[string:EntityPoseNative]";
    }
    return name + "Native";
  };
  splitCsv (s) {
    let out = [];
    if ( (s.length) == 0 ) {
      return out;
    }
    let cur = "";
    let i = 0;
    while (i < (s.length)) {
      const ch = s.substring(i, (i + 1) );
      if ( ch == "," ) {
        out.push(cur);
        cur = "";
      } else {
        cur = cur + ch;
      }
      i = i + 1;
    };
    out.push(cur);
    return out;
  };
  joinCsv (items) {
    let out = "";
    let i = 0;
    while (i < (items.length)) {
      if ( i > 0 ) {
        out = out + ",";
      }
      out = out + (items[i]);
      i = i + 1;
    };
    return out;
  };
  helperReturnType (name) {
    const t = ( this.fnReturnTypes.hasOwnProperty(name) ? this.fnReturnTypes[name] : undefined );
    if ( (typeof(t) !== "undefined" && t != null )  ) {
      return t;
    }
    return "int";
  };
  helperParamType (name, idx) {
    const csv = ( this.fnParamTypesCsv.hasOwnProperty(name) ? this.fnParamTypesCsv[name] : undefined );
    if ( typeof(csv) === "undefined" ) {
      return "";
    }
    const parts = this.splitCsv((csv));
    if ( idx < (parts.length) ) {
      return parts[idx];
    }
    return "";
  };
  isKnownHelper (name) {
    const h = ( this.isHelperFn.hasOwnProperty(name) ? this.isHelperFn[name] : undefined );
    return (typeof(h) !== "undefined" && h != null ) ;
  };
  emit (text) {
    this.output = this.output + text;
  };
  emitLine (text) {
    const pad = this.pad();
    this.output = ((this.output + pad) + text) + "\n";
  };
  pad () {
    let result = "";
    let i = 0;
    while (i < this.indentLevel) {
      result = result + this.indentStr;
      i = i + 1;
    };
    return result;
  };
  indent () {
    this.indentLevel = this.indentLevel + 1;
  };
  dedent () {
    this.indentLevel = this.indentLevel - 1;
  };
  reset () {
    this.output = "";
    this.indentLevel = 0;
    this.currentFn = "";
    this.inSpritesFn = false;
    this.inInitFn = false;
    this.inUpdateFn = false;
    this.inResourcesFn = false;
    let fr = {};
    this.fnReturnTypes = fr;
    let fp = {};
    this.fnParamTypesCsv = fp;
    let fh = {};
    this.isHelperFn = fh;
    let cs = {};
    this.constScalarTypes = cs;
    let csv = {};
    this.constScalarValues = csv;
    let ca = {};
    this.constArrayNames = ca;
    let cae = {};
    this.constArrayElemType = cae;
    let ifc = {};
    this.interfaceFieldsCsv = ifc;
    let ifn = [];
    this.interfaceNames = ifn;
    let saf = {};
    this.stateArrayFieldType = saf;
    let isl = {};
    this.initStateLocalTypes = isl;
    let ssd = {};
    this.synthStructDone = ssd;
    this.moduleSingletonClass = "";
    let mcd = {};
    this.moduleConstDeferred = mcd;
    this.inModuleSingletonCtor = false;
    this.tmpCounter = 0;
    this.seedBridgeStructs();
  };
  setModuleSingletonId (moduleId) {
    this.moduleIdRaw = moduleId;
  };
  isEngineGlobal (name) {
    if ( name == "bgWidth" ) {
      return true;
    }
    if ( name == "bgHeight" ) {
      return true;
    }
    if ( name == "paneIndex" ) {
      return true;
    }
    return false;
  };
  isEngineFn (name) {
    if ( name == "bgClear" ) {
      return true;
    }
    if ( name == "bgFillRect" ) {
      return true;
    }
    if ( name == "bgFillCircle" ) {
      return true;
    }
    return false;
  };
  applyModuleId () {
    if ( (this.moduleIdRaw.length) > 0 ) {
      const cap = this.capitalizeModuleId(this.moduleIdRaw);
      this.moduleSingletonClass = cap + "GameModule";
    }
  };
  capitalizeModuleId (id) {
    if ( (id.length) == 0 ) {
      return "Game";
    }
    let out = "";
    let i = 0;
    let upNext = true;
    while (i < (id.length)) {
      const ch = id.substring(i, (i + 1) );
      if ( (ch == "_") || ((ch == "-") || (ch == ".")) ) {
        upNext = true;
      } else {
        if ( upNext ) {
          const uc = this.upperAscii(ch);
          out = out + uc;
        } else {
          out = out + ch;
        }
        upNext = false;
      }
      i = i + 1;
    };
    if ( (out.length) == 0 ) {
      return "Game";
    }
    const first = out.substring(0, 1 );
    const firstUp = this.upperAscii(first);
    return firstUp + (out.substring(1, (out.length) ));
  };
  upperAscii (ch) {
    if ( ch == "a" ) {
      return "A";
    }
    if ( ch == "b" ) {
      return "B";
    }
    if ( ch == "c" ) {
      return "C";
    }
    if ( ch == "d" ) {
      return "D";
    }
    if ( ch == "e" ) {
      return "E";
    }
    if ( ch == "f" ) {
      return "F";
    }
    if ( ch == "g" ) {
      return "G";
    }
    if ( ch == "h" ) {
      return "H";
    }
    if ( ch == "i" ) {
      return "I";
    }
    if ( ch == "j" ) {
      return "J";
    }
    if ( ch == "k" ) {
      return "K";
    }
    if ( ch == "l" ) {
      return "L";
    }
    if ( ch == "m" ) {
      return "M";
    }
    if ( ch == "n" ) {
      return "N";
    }
    if ( ch == "o" ) {
      return "O";
    }
    if ( ch == "p" ) {
      return "P";
    }
    if ( ch == "q" ) {
      return "Q";
    }
    if ( ch == "r" ) {
      return "R";
    }
    if ( ch == "s" ) {
      return "S";
    }
    if ( ch == "t" ) {
      return "T";
    }
    if ( ch == "u" ) {
      return "U";
    }
    if ( ch == "v" ) {
      return "V";
    }
    if ( ch == "w" ) {
      return "W";
    }
    if ( ch == "x" ) {
      return "X";
    }
    if ( ch == "y" ) {
      return "Y";
    }
    if ( ch == "z" ) {
      return "Z";
    }
    return ch;
  };
  moduleConstAccess (name) {
    return "_mod." + name;
  };
  emitModuleLocalIfNeeded (body) {
    if ( (this.moduleSingletonClass.length) == 0 ) {
      return;
    }
    if ( this.bodyUsesModuleConst(body) == false ) {
      return;
    }
    this.emitLine(((("def _mod:" + this.moduleSingletonClass) + " (") + this.moduleSingletonClass) + ".__singleton())");
  };
  bodyUsesModuleConst (node) {
    if ( node.nodeType == "Identifier" ) {
      const ca = ( this.constArrayNames.hasOwnProperty(node.name) ? this.constArrayNames[node.name] : undefined );
      if ( (typeof(ca) !== "undefined" && ca != null )  ) {
        return true;
      }
      const cs = ( this.constScalarTypes.hasOwnProperty(node.name) ? this.constScalarTypes[node.name] : undefined );
      if ( (typeof(cs) !== "undefined" && cs != null )  ) {
        return true;
      }
      return false;
    }
    if ( typeof(node.left) != "undefined" ) {
      if ( this.bodyUsesModuleConst((node.left)) ) {
        return true;
      }
    }
    if ( typeof(node.right) != "undefined" ) {
      if ( this.bodyUsesModuleConst((node.right)) ) {
        return true;
      }
    }
    if ( typeof(node.body) != "undefined" ) {
      if ( this.bodyUsesModuleConst((node.body)) ) {
        return true;
      }
    }
    if ( typeof(node.init) != "undefined" ) {
      if ( this.bodyUsesModuleConst((node.init)) ) {
        return true;
      }
    }
    if ( typeof(node.test) != "undefined" ) {
      if ( this.bodyUsesModuleConst((node.test)) ) {
        return true;
      }
    }
    if ( typeof(node.consequent) != "undefined" ) {
      if ( this.bodyUsesModuleConst((node.consequent)) ) {
        return true;
      }
    }
    if ( typeof(node.alternate) != "undefined" ) {
      if ( this.bodyUsesModuleConst((node.alternate)) ) {
        return true;
      }
    }
    let i = 0;
    while (i < (node.children.length)) {
      if ( this.bodyUsesModuleConst((node.children[i])) ) {
        return true;
      }
      i = i + 1;
    };
    return false;
  };
  hasModuleConsts (ast) {
    let i = 0;
    while (i < (ast.children.length)) {
      const node = ast.children[i];
      if ( node.nodeType == "VariableDeclaration" ) {
        return true;
      }
      i = i + 1;
    };
    return false;
  };
  seedBridgeStructs () {
    this.interfaceFieldsCsv["SpriteDef"] = "id:string,kind:string,w:int,h:int,rad:int,r:int,g:int,b:int,p0:int,p1:int,p2:int,px:int,br:int,bg:int,bb:int,er:int,eg:int,eb:int,frames:[[string]]";
    this.interfaceFieldsCsv["EntityPose"] = "x:double,y:double,visible:int,r:int,g:int,b:int,rad:int,p0:int,p1:int,p2:int";
    this.interfaceFieldsCsv["ResourceDef"] = "kind:string,id:string,path:string,px:int,frameCount:int,w:int,h:int";
    this.interfaceFieldsCsv["GameEvent"] = "kind:string,id:string,x:double,y:double,amount:int";
    this.interfaceFieldsCsv["PlayerInput"] = "up:boolean,down:boolean,left:boolean,right:boolean,action:boolean";
    this.interfaceFieldsCsv["GameInput"] = "players:[PlayerInputNative]";
  };
  isNativeStateField (prop) {
    if ( prop == "screen" ) {
      return true;
    }
    if ( prop == "showNet" ) {
      return true;
    }
    if ( prop == "score1" ) {
      return true;
    }
    if ( prop == "score2" ) {
      return true;
    }
    if ( prop == "score" ) {
      return true;
    }
    if ( prop == "vx" ) {
      return true;
    }
    if ( prop == "vy" ) {
      return true;
    }
    if ( prop == "hasVx" ) {
      return true;
    }
    if ( prop == "hasVy" ) {
      return true;
    }
    if ( prop == "dt" ) {
      return true;
    }
    if ( prop == "hasDt" ) {
      return true;
    }
    if ( prop == "entities" ) {
      return true;
    }
    if ( prop == "numbers" ) {
      return true;
    }
    if ( prop == "events" ) {
      return true;
    }
    return false;
  };
  fieldType (prop) {
    if ( (prop == "x") || (prop == "y") ) {
      return "double";
    }
    if ( (prop == "vx") || (prop == "vy") ) {
      return "double";
    }
    if ( prop == "dt" ) {
      return "double";
    }
    if ( ((((prop == "up") || (prop == "down")) || (prop == "left")) || (prop == "right")) || (prop == "action") ) {
      return "boolean";
    }
    if ( (prop == "hasVx") || (prop == "hasVy") ) {
      return "boolean";
    }
    if ( prop == "hasDt" ) {
      return "boolean";
    }
    if ( (((prop == "id") || (prop == "kind")) || (prop == "screen")) || (prop == "path") ) {
      return "string";
    }
    if ( prop == "state" ) {
      return "NativeGameState";
    }
    if ( prop == "input" ) {
      return "GameInputNative";
    }
    if ( prop == "players" ) {
      return "[PlayerInputNative]";
    }
    return "int";
  };
  lookupVarType (name) {
    const t = ( this.varTypes.hasOwnProperty(name) ? this.varTypes[name] : undefined );
    if ( (typeof(t) !== "undefined" && t != null )  ) {
      return t;
    }
    return "";
  };
  callExprType (node) {
    if ( typeof(node.left) === "undefined" ) {
      return "int";
    }
    const callee = node.left;
    if ( callee.nodeType == "Identifier" ) {
      if ( this.isBridgeHelper(callee.name) ) {
        return "GameEventNative";
      }
      if ( this.isKnownHelper(callee.name) ) {
        return this.helperReturnType(callee.name);
      }
    }
    if ( callee.nodeType == "MemberExpression" ) {
      return "void";
    }
    return "int";
  };
  elemTypeOf (arrType) {
    if ( (arrType.length) < 3 ) {
      return "int";
    }
    const first = arrType.substring(0, 1 );
    if ( first != "[" ) {
      return "int";
    }
    const inner = arrType.substring(1, ((arrType.length) - 1) );
    const il = inner.length;
    let depth = 0;
    let sep = 0 - 1;
    let i = 0;
    while (i < il) {
      const c = inner.charCodeAt(i );
      if ( c == (91) ) {
        depth = depth + 1;
      }
      if ( c == 93 ) {
        depth = depth - 1;
      }
      if ( (c == (58)) && (depth == 0) ) {
        sep = i;
      }
      i = i + 1;
    };
    if ( sep >= 0 ) {
      return inner.substring((sep + 1), il );
    }
    return inner;
  };
  structFieldType (structType, field) {
    if ( (this).endsWith(structType, "Native") == false ) {
      return "";
    }
    const iface = structType.substring(0, ((structType.length) - 6) );
    const csv = ( this.interfaceFieldsCsv.hasOwnProperty(iface) ? this.interfaceFieldsCsv[iface] : undefined );
    if ( typeof(csv) === "undefined" ) {
      return "";
    }
    const pairs = this.splitCsv((csv));
    let i = 0;
    while (i < (pairs.length)) {
      const pair = pairs[i];
      const colon = pair.indexOf(":");
      if ( colon > 0 ) {
        const fname = pair.substring(0, colon );
        if ( fname == field ) {
          return pair.substring((colon + 1), (pair.length) );
        }
      }
      i = i + 1;
    };
    return "";
  };
  isStateArrayField (name) {
    const t = ( this.stateArrayFieldType.hasOwnProperty(name) ? this.stateArrayFieldType[name] : undefined );
    return (typeof(t) !== "undefined" && t != null ) ;
  };
  stateArrayType (name) {
    const t = ( this.stateArrayFieldType.hasOwnProperty(name) ? this.stateArrayFieldType[name] : undefined );
    if ( (typeof(t) !== "undefined" && t != null )  ) {
      return t;
    }
    return "[int]";
  };
  isComparisonOp (op) {
    if ( op == "<" ) {
      return true;
    }
    if ( op == ">" ) {
      return true;
    }
    if ( op == "<=" ) {
      return true;
    }
    if ( op == ">=" ) {
      return true;
    }
    if ( op == "==" ) {
      return true;
    }
    if ( op == "!=" ) {
      return true;
    }
    if ( op == "===" ) {
      return true;
    }
    if ( op == "!==" ) {
      return true;
    }
    return false;
  };
  isLogicalOp (op) {
    if ( op == "&&" ) {
      return true;
    }
    if ( op == "||" ) {
      return true;
    }
    return false;
  };
  exprType (node) {
    const t = node.nodeType;
    if ( t == "NumericLiteral" ) {
      if ( this.containsChar(node.value, 46) ) {
        return "double";
      }
      return "int";
    }
    if ( t == "BooleanLiteral" ) {
      return "boolean";
    }
    if ( t == "StringLiteral" ) {
      return "string";
    }
    if ( t == "Identifier" ) {
      const vt = this.lookupVarType(node.name);
      if ( (vt.length) > 0 ) {
        return vt;
      }
      const ist = ( this.initStateLocalTypes.hasOwnProperty(node.name) ? this.initStateLocalTypes[node.name] : undefined );
      if ( (typeof(ist) !== "undefined" && ist != null )  ) {
        return ist;
      }
      const ca = ( this.constArrayNames.hasOwnProperty(node.name) ? this.constArrayNames[node.name] : undefined );
      if ( (typeof(ca) !== "undefined" && ca != null )  ) {
        const et = ( this.constArrayElemType.hasOwnProperty(node.name) ? this.constArrayElemType[node.name] : undefined );
        if ( (typeof(et) !== "undefined" && et != null )  ) {
          return ("[" + (et)) + "]";
        }
      }
      const cst = ( this.constScalarTypes.hasOwnProperty(node.name) ? this.constScalarTypes[node.name] : undefined );
      if ( (typeof(cst) !== "undefined" && cst != null )  ) {
        return cst;
      }
      if ( this.isEngineGlobal(node.name) ) {
        return "int";
      }
      return "int";
    }
    if ( t == "CallExpression" ) {
      return this.callExprType(node);
    }
    if ( t == "MemberExpression" ) {
      if ( node.name == "length" ) {
        if ( typeof(node.left) != "undefined" ) {
          return "int";
        }
      }
      if ( node.computed ) {
        if ( typeof(node.left) != "undefined" ) {
          const bt = this.exprType((node.left));
          return this.elemTypeOf(bt);
        }
      }
      if ( typeof(node.left) != "undefined" ) {
        const lbase = node.left;
        if ( lbase.nodeType == "Identifier" ) {
          if ( lbase.name == this.stateVarName ) {
            if ( this.isNativeStateField(node.name) == false ) {
              if ( this.isStateArrayField(node.name) ) {
                return this.stateArrayType(node.name);
              }
              return "double";
            }
          }
        }
        const baseT = this.exprType(lbase);
        const sf = this.structFieldType(baseT, node.name);
        if ( (sf.length) > 0 ) {
          return sf;
        }
      }
      return this.fieldType(node.name);
    }
    if ( t == "UnaryExpression" ) {
      if ( node.value == "!" ) {
        return "boolean";
      }
      if ( typeof(node.left) != "undefined" ) {
        return this.exprType((node.left));
      }
      return "int";
    }
    if ( t == "BinaryExpression" ) {
      const op = node.value;
      if ( this.isComparisonOp(op) ) {
        return "boolean";
      }
      if ( this.isLogicalOp(op) ) {
        return "boolean";
      }
      let lt = "int";
      let rt = "int";
      if ( typeof(node.left) != "undefined" ) {
        lt = this.exprType((node.left));
      }
      if ( typeof(node.right) != "undefined" ) {
        rt = this.exprType((node.right));
      }
      if ( op == "+" ) {
        if ( (lt == "string") || (rt == "string") ) {
          return "string";
        }
      }
      if ( (lt == "double") || (rt == "double") ) {
        return "double";
      }
      return "int";
    }
    if ( t == "ObjectExpression" ) {
      if ( (node.children.length) == 0 ) {
        return "[string:EntityPoseNative]";
      }
      return this.inferObjectStructType(node, "");
    }
    return "int";
  };
  numericCommon (node) {
    let lt = "int";
    let rt = "int";
    if ( typeof(node.left) != "undefined" ) {
      lt = this.exprType((node.left));
    }
    if ( typeof(node.right) != "undefined" ) {
      rt = this.exprType((node.right));
    }
    if ( (lt == "double") || (rt == "double") ) {
      return "double";
    }
    return "int";
  };
  rhsValueType (node) {
    if ( node.nodeType == "BinaryExpression" ) {
      return this.numericCommon(node);
    }
    return this.exprType(node);
  };
  coerceToType (expr, node, target) {
    if ( target == "int" ) {
      const rt = this.rhsValueType(node);
      if ( rt == "double" ) {
        if ( (expr.length) >= 7 ) {
          if ( (expr.substring(0, 7 )) == "(to_int" ) {
            return expr;
          }
        }
        return ("(to_int " + expr) + ")";
      }
    }
    if ( target == "double" ) {
      const rt2 = this.rhsValueType(node);
      if ( rt2 == "int" ) {
        if ( node.nodeType == "NumericLiteral" ) {
          return expr;
        }
        if ( node.nodeType == "Identifier" ) {
          return expr;
        }
        if ( this.containsChar(expr, 46) ) {
          return expr;
        }
        if ( (expr.length) >= 4 ) {
          if ( (expr.substring(0, 4 )) == "(0.0" ) {
            return expr;
          }
        }
        if ( (expr.length) >= 10 ) {
          if ( (expr.substring(0, 10 )) == "(to_double" ) {
            return expr;
          }
        }
        return ("(to_double " + expr) + ")";
      }
    }
    return expr;
  };
  emitProgram (ast) {
    this.reset();
    this.applyModuleId();
    this.prescanProgram(ast);
    this.emitLine("; Generated by gallery/ts_to_ranger/ts_emitter.rgr");
    this.emitLine("; Source: game script (.game.tsx) - do not edit by hand.");
    this.emitLine("");
    this.emitLine("Import \"../../game_engine/scripting/game_engine_host.rgr\"");
    this.emitLine("");
    this.emitInterfaces();
    if ( this.hasModuleConsts(ast) && ((this.moduleSingletonClass.length) > 0) ) {
      this.emitModuleSingleton(ast);
      this.emitLine("");
    }
    this.emitLine("class GeneratedGameScript {");
    this.emitLine("    def host:GameEngineHost (new GameEngineHost)");
    this.emitLine("");
    let i = 0;
    while (i < (ast.children.length)) {
      const node = ast.children[i];
      if ( node.nodeType == "FunctionDeclaration" ) {
        this.emitFunction(node);
      }
      i = i + 1;
    };
    this.emitLine("}");
    return this.output;
  };
  isSpecialFn (name) {
    if ( name == "sprites" ) {
      return true;
    }
    if ( name == "resources" ) {
      return true;
    }
    if ( name == "initState" ) {
      return true;
    }
    if ( name == "update" ) {
      return true;
    }
    if ( name == "hud" ) {
      return true;
    }
    return false;
  };
  prescanProgram (ast) {
    let i = 0;
    while (i < (ast.children.length)) {
      const node = ast.children[i];
      const t = node.nodeType;
      if ( t == "TSInterfaceDeclaration" ) {
        this.recordInterface(node);
      }
      if ( t == "FunctionDeclaration" ) {
        if ( this.isSpecialFn(node.name) == false ) {
          this.recordHelper(node);
        }
      }
      if ( t == "VariableDeclaration" ) {
        this.recordModuleConst(node);
      }
      i = i + 1;
    };
    let j = 0;
    while (j < (ast.children.length)) {
      const node_1 = ast.children[j];
      if ( node_1.nodeType == "FunctionDeclaration" ) {
        if ( node_1.name == "initState" ) {
          this.scanStateArrays(node_1);
        }
      }
      j = j + 1;
    };
    let k = 0;
    while (k < (ast.children.length)) {
      const node2 = ast.children[k];
      if ( node2.nodeType == "FunctionDeclaration" ) {
        if ( this.isSpecialFn(node2.name) == false ) {
          this.inferParamTypesFromProgram(node2.name, ast);
        }
      }
      k = k + 1;
    };
    this.finalizeSynthStructs(ast);
    this.finalizeHelperReturnTypes(ast);
  };
  scanStateArrays (node) {
    if ( typeof(node.body) === "undefined" ) {
      return;
    }
    let empty = {};
    this.initStateLocalTypes = empty;
    const body = node.body;
    let i = 0;
    while (i < (body.children.length)) {
      const stmt = body.children[i];
      if ( stmt.nodeType == "VariableDeclaration" ) {
        this.scanInitStateLocalVar(stmt);
      }
      if ( stmt.nodeType == "ReturnStatement" ) {
        if ( typeof(stmt.left) != "undefined" ) {
          const val = stmt.left;
          if ( val.nodeType == "ObjectExpression" ) {
            this.scanStateArrayProps(val);
          }
        }
      }
      i = i + 1;
    };
  };
  scanInitStateLocalVar (stmt) {
    let j = 0;
    while (j < (stmt.children.length)) {
      const decl = stmt.children[j];
      if ( decl.nodeType == "VariableDeclarator" ) {
        if ( typeof(decl.init) != "undefined" ) {
          const vt = this.exprType((decl.init));
          this.initStateLocalTypes[decl.name] = vt;
        }
      }
      j = j + 1;
    };
  };
  stateArrayTypeFromValueNode (valNode) {
    let vt = this.exprType(valNode);
    if ( valNode.nodeType == "Identifier" ) {
      const lt = ( this.initStateLocalTypes.hasOwnProperty(valNode.name) ? this.initStateLocalTypes[valNode.name] : undefined );
      if ( (typeof(lt) !== "undefined" && lt != null )  ) {
        vt = lt;
      }
    }
    return vt;
  };
  scanStateArrayProps (obj) {
    let i = 0;
    while (i < (obj.children.length)) {
      const prop = obj.children[i];
      if ( prop.nodeType == "Property" ) {
        const key = this.propKey(prop);
        if ( this.isNativeStateField(key) == false ) {
          if ( key != "entities" ) {
            const valNode = this.propertyValueNode(prop);
            const vt = this.stateArrayTypeFromValueNode(valNode);
            let first = "";
            if ( (vt.length) > 0 ) {
              first = vt.substring(0, 1 );
            }
            if ( first == "[" ) {
              this.stateArrayFieldType[key] = vt;
            }
          }
        }
      }
      i = i + 1;
    };
  };
  recordHelper (node) {
    this.isHelperFn[node.name] = true;
    let rt = "int";
    if ( typeof(node.typeAnnotation) != "undefined" ) {
      rt = this.annotType((node.typeAnnotation));
    } else {
      const inferred = this.inferHelperReturnType(node);
      if ( this.isPositiveType(inferred) ) {
        rt = inferred;
      }
    }
    this.fnReturnTypes[node.name] = rt;
    let types = [];
    let i = 0;
    while (i < (node.params.length)) {
      const p = node.params[i];
      let pt = "int";
      if ( typeof(p.typeAnnotation) != "undefined" ) {
        pt = this.annotType((p.typeAnnotation));
      }
      types.push(pt);
      i = i + 1;
    };
    this.fnParamTypesCsv[node.name] = this.joinCsv(types);
    this.inferParamTypes(node);
  };
  isBridgeHelper (name) {
    if ( name == "soundEvent" ) {
      return true;
    }
    if ( name == "musicEvent" ) {
      return true;
    }
    if ( name == "musicScoreEvent" ) {
      return true;
    }
    if ( name == "stopMusicEvent" ) {
      return true;
    }
    if ( name == "particleEvent" ) {
      return true;
    }
    if ( name == "rumbleEvent" ) {
      return true;
    }
    return false;
  };
  emitBridgeHelperValue (name, node) {
    const tmp = "be" + ("" + this.tmpCounter);
    this.tmpCounter = this.tmpCounter + 1;
    this.emitLine(("def " + tmp) + ":GameEventNative (new GameEventNative)");
    if ( name == "soundEvent" ) {
      this.emitLine(tmp + ".kind = \"playSound\"");
      if ( (node.children.length) > 0 ) {
        const id = this.emitExpr((node.children[0]), "string");
        this.emitLine((tmp + ".id = ") + id);
      }
      return tmp;
    }
    if ( name == "stopMusicEvent" ) {
      this.emitLine(tmp + ".kind = \"stopMusic\"");
      this.emitLine(tmp + ".id = \"\"");
      return tmp;
    }
    if ( name == "musicEvent" ) {
      this.emitLine(tmp + ".kind = \"playMusic\"");
      if ( (node.children.length) > 0 ) {
        const id_1 = this.emitExpr((node.children[0]), "string");
        this.emitLine((tmp + ".id = ") + id_1);
      }
      this.emitLine(tmp + ".amount = 1");
      return tmp;
    }
    if ( name == "musicScoreEvent" ) {
      this.emitLine(tmp + ".kind = \"playMusic\"");
      this.emitLine(tmp + ".id = \"inline\"");
      if ( (node.children.length) > 0 ) {
        const txt = this.emitExpr((node.children[0]), "string");
        this.emitLine((tmp + ".text = ") + txt);
      }
      this.emitLine(tmp + ".amount = 1");
      return tmp;
    }
    if ( name == "particleEvent" ) {
      this.emitLine(tmp + ".kind = \"particles\"");
      if ( (node.children.length) > 0 ) {
        const pid = this.emitExpr((node.children[0]), "string");
        this.emitLine((tmp + ".id = ") + pid);
      }
      if ( (node.children.length) > 1 ) {
        const px = this.emitExpr((node.children[1]), "double");
        this.emitLine((tmp + ".x = ") + px);
      }
      if ( (node.children.length) > 2 ) {
        const py = this.emitExpr((node.children[2]), "double");
        this.emitLine((tmp + ".y = ") + py);
      }
      if ( (node.children.length) > 3 ) {
        const amt = this.emitExpr((node.children[3]), "int");
        this.emitLine((tmp + ".amount = ") + amt);
      }
      return tmp;
    }
    if ( name == "rumbleEvent" ) {
      this.emitLine(tmp + ".kind = \"rumble\"");
      if ( (node.children.length) > 0 ) {
        const pad = this.emitExpr((node.children[0]), "int");
        this.emitLine((tmp + ".pad = ") + pad);
      }
      if ( (node.children.length) > 1 ) {
        const lo = this.emitExpr((node.children[1]), "int");
        this.emitLine((tmp + ".low = ") + lo);
      }
      if ( (node.children.length) > 2 ) {
        const hi = this.emitExpr((node.children[2]), "int");
        this.emitLine((tmp + ".high = ") + hi);
      }
      if ( (node.children.length) > 3 ) {
        const dur = this.emitExpr((node.children[3]), "int");
        this.emitLine((tmp + ".ms = ") + dur);
      }
      return tmp;
    }
    return tmp;
  };
  inferObjectStructType (obj, fnName) {
    const known = this.matchKnownStruct(obj);
    if ( (known.length) > 0 ) {
      return known;
    }
    if ( (fnName.length) == 0 ) {
      return "int";
    }
    return this.registerSynthStruct(obj, fnName);
  };
  matchKnownStruct (obj) {
    if ( obj.nodeType != "ObjectExpression" ) {
      return "";
    }
    let hasId = false;
    let hasKind = false;
    let hasX = false;
    let hasY = false;
    let i = 0;
    while (i < (obj.children.length)) {
      const prop = obj.children[i];
      if ( prop.nodeType == "Property" ) {
        const key = this.propKey(prop);
        if ( key == "id" ) {
          hasId = true;
        }
        if ( key == "kind" ) {
          hasKind = true;
        }
        if ( key == "x" ) {
          hasX = true;
        }
        if ( key == "y" ) {
          hasY = true;
        }
      }
      i = i + 1;
    };
    if ( hasId && hasKind ) {
      return "SpriteDefNative";
    }
    if ( hasX && hasY ) {
      return "EntityPoseNative";
    }
    return "";
  };
  registerSynthStruct (obj, fnName) {
    const baseName = fnName + "Ret";
    const structType = baseName + "Native";
    const done = ( this.synthStructDone.hasOwnProperty(baseName) ? this.synthStructDone[baseName] : undefined );
    if ( typeof(done) === "undefined" ) {
      const csv = this.objectFieldsCsv(obj);
      this.interfaceFieldsCsv[baseName] = csv;
      this.interfaceNames.push(baseName);
      this.synthStructDone[baseName] = true;
    }
    return structType;
  };
  objectFieldType (key, valNode) {
    if ( key == "hit" ) {
      return "boolean";
    }
    if ( key == "vx" ) {
      return "double";
    }
    if ( key == "vy" ) {
      return "double";
    }
    if ( key == "bx" ) {
      return "double";
    }
    if ( key == "by" ) {
      return "double";
    }
    return this.exprType(valNode);
  };
  objectFieldsCsv (obj) {
    let pairs = [];
    let i = 0;
    while (i < (obj.children.length)) {
      const prop = obj.children[i];
      if ( prop.nodeType == "Property" ) {
        const key = this.propKey(prop);
        if ( (key.length) > 0 ) {
          const valNode = this.propertyValueNode(prop);
          const ft = this.objectFieldType(key, valNode);
          pairs.push((key + ":") + ft);
        }
      }
      i = i + 1;
    };
    return this.joinCsv(pairs);
  };
  finalizeSynthStructs (ast) {
    let i = 0;
    while (i < (ast.children.length)) {
      const node = ast.children[i];
      if ( node.nodeType == "FunctionDeclaration" ) {
        if ( this.isSpecialFn(node.name) == false ) {
          if ( typeof(node.body) === "undefined" ) {
            i = i + 1;
            continue;
          }
          const body = node.body;
          const saved = this.varTypes;
          let local = {};
          this.varTypes = local;
          this.collectLocalVarTypes(body, body);
          const csv = this.findReturnStructCsv(body, node.name);
          if ( (csv.length) > 0 ) {
            const baseName = node.name + "Ret";
            this.interfaceFieldsCsv[baseName] = csv;
          }
          this.varTypes = saved;
        }
      }
      i = i + 1;
    };
  };
  findReturnStructCsv (block, fnName) {
    let i = 0;
    while (i < (block.children.length)) {
      const csv = this.findReturnStructCsvInStmt((block.children[i]), fnName);
      if ( (csv.length) > 0 ) {
        return csv;
      }
      i = i + 1;
    };
    return "";
  };
  findReturnStructCsvInStmt (stmt, fnName) {
    const t = stmt.nodeType;
    if ( t == "ReturnStatement" ) {
      if ( typeof(stmt.left) != "undefined" ) {
        const val = stmt.left;
        if ( val.nodeType == "ObjectExpression" ) {
          return this.objectFieldsCsv(val);
        }
      }
      return "";
    }
    if ( t == "IfStatement" ) {
      if ( typeof(stmt.body) != "undefined" ) {
        const r1 = this.findReturnStructCsvInStmt((stmt.body), fnName);
        if ( (r1.length) > 0 ) {
          return r1;
        }
      }
      if ( typeof(stmt.right) != "undefined" ) {
        const r2 = this.findReturnStructCsvInStmt((stmt.right), fnName);
        if ( (r2.length) > 0 ) {
          return r2;
        }
      }
      return "";
    }
    if ( t == "BlockStatement" ) {
      return this.findReturnStructCsv(stmt, fnName);
    }
    if ( t == "WhileStatement" ) {
      if ( typeof(stmt.body) != "undefined" ) {
        return this.findReturnStructCsvInStmt((stmt.body), fnName);
      }
    }
    return "";
  };
  inferParamTypes (node) {
    if ( typeof(node.body) === "undefined" ) {
      return;
    }
    const body = node.body;
    const csv = ( this.fnParamTypesCsv.hasOwnProperty(node.name) ? this.fnParamTypesCsv[node.name] : undefined );
    let oldTypes = [];
    if ( (typeof(csv) !== "undefined" && csv != null )  ) {
      oldTypes = this.splitCsv((csv));
    }
    let newTypes = [];
    let i = 0;
    while (i < (node.params.length)) {
      const p = node.params[i];
      let pt = "int";
      if ( typeof(p.typeAnnotation) != "undefined" ) {
        pt = this.annotType((p.typeAnnotation));
      } else {
        if ( i < (oldTypes.length) ) {
          pt = oldTypes[i];
        }
        const inferred = this.inferParamTypeFromBody(p.name, body);
        if ( (inferred.length) > 0 ) {
          pt = inferred;
        }
      }
      newTypes.push(pt);
      i = i + 1;
    };
    this.fnParamTypesCsv[node.name] = this.joinCsv(newTypes);
  };
  inferParamTypesFromProgram (fnName, ast) {
    this.inferParamTypesFromCallsWalk(fnName, ast);
  };
  inferParamTypesFromCallsWalk (fnName, node) {
    if ( node.nodeType == "CallExpression" ) {
      if ( typeof(node.left) != "undefined" ) {
        const callee = node.left;
        if ( callee.nodeType == "Identifier" ) {
          if ( callee.name == fnName ) {
            this.mergeCallArgTypes(fnName, node);
          }
        }
      }
    }
    let i = 0;
    while (i < (node.children.length)) {
      this.inferParamTypesFromCallsWalk(fnName, node.children[i]);
      i = i + 1;
    };
    if ( typeof(node.left) != "undefined" ) {
      this.inferParamTypesFromCallsWalk(fnName, node.left);
    }
    if ( typeof(node.right) != "undefined" ) {
      this.inferParamTypesFromCallsWalk(fnName, node.right);
    }
    if ( typeof(node.body) != "undefined" ) {
      this.inferParamTypesFromCallsWalk(fnName, node.body);
    }
    if ( typeof(node.init) != "undefined" ) {
      this.inferParamTypesFromCallsWalk(fnName, node.init);
    }
    if ( typeof(node.test) != "undefined" ) {
      this.inferParamTypesFromCallsWalk(fnName, node.test);
    }
    if ( typeof(node.consequent) != "undefined" ) {
      this.inferParamTypesFromCallsWalk(fnName, node.consequent);
    }
    if ( typeof(node.alternate) != "undefined" ) {
      this.inferParamTypesFromCallsWalk(fnName, node.alternate);
    }
  };
  inferCallArgType (arg) {
    const at = this.exprType(arg);
    if ( this.isPositiveType(at) ) {
      return at;
    }
    if ( arg.nodeType == "Identifier" ) {
      if ( arg.name == "vx" ) {
        return "double";
      }
      if ( arg.name == "vy" ) {
        return "double";
      }
      if ( arg.name == "bx" ) {
        return "double";
      }
      if ( arg.name == "by" ) {
        return "double";
      }
      if ( arg.name == "prevBx" ) {
        return "double";
      }
    }
    if ( arg.nodeType == "MemberExpression" ) {
      if ( arg.name == "x" ) {
        return "double";
      }
      if ( arg.name == "y" ) {
        return "double";
      }
      if ( arg.name == "vx" ) {
        return "double";
      }
      if ( arg.name == "vy" ) {
        return "double";
      }
    }
    return at;
  };
  mergeCallArgTypes (fnName, call) {
    const csv = ( this.fnParamTypesCsv.hasOwnProperty(fnName) ? this.fnParamTypesCsv[fnName] : undefined );
    if ( typeof(csv) === "undefined" ) {
      return;
    }
    const types = this.splitCsv((csv));
    let newTypes = [];
    let i = 0;
    while (i < (types.length)) {
      let pt = types[i];
      if ( i < (call.children.length) ) {
        const arg = call.children[i];
        const at = this.inferCallArgType(arg);
        if ( this.isPositiveType(at) ) {
          pt = at;
        }
      }
      newTypes.push(pt);
      i = i + 1;
    };
    this.fnParamTypesCsv[fnName] = this.joinCsv(newTypes);
  };
  inferParamTypeFromBody (param, body) {
    if ( param == "entities" ) {
      return "[string:EntityPoseNative]";
    }
    if ( param == "props" ) {
      return "UpdatePropsNative";
    }
    if ( param == "vx" ) {
      return "double";
    }
    if ( param == "vy" ) {
      return "double";
    }
    if ( param == "bx" ) {
      return "double";
    }
    if ( param == "by" ) {
      return "double";
    }
    if ( param == "prevBx" ) {
      return "double";
    }
    if ( param == "paddleY" ) {
      return "double";
    }
    if ( param == "paddleVy" ) {
      return "double";
    }
    if ( param == "p1y" ) {
      return "double";
    }
    if ( param == "p1vy" ) {
      return "double";
    }
    if ( param == "p2y" ) {
      return "double";
    }
    if ( param == "p2vy" ) {
      return "double";
    }
    if ( param == "alive" ) {
      return "[int]";
    }
    if ( param == "dotCol" ) {
      return "[int]";
    }
    if ( param == "dotRow" ) {
      return "[int]";
    }
    if ( param == "dotAlive" ) {
      return "[int]";
    }
    if ( param == "powerCol" ) {
      return "[int]";
    }
    if ( param == "powerRow" ) {
      return "[int]";
    }
    if ( param == "powerAlive" ) {
      return "[int]";
    }
    if ( param == "ghostCol" ) {
      return "[int]";
    }
    if ( param == "ghostRow" ) {
      return "[int]";
    }
    if ( param == "ghostDir" ) {
      return "[int]";
    }
    if ( param == "ghostFrac" ) {
      return "[int]";
    }
    if ( param == "ghostEyes" ) {
      return "[int]";
    }
    if ( param == "a" ) {
      return "[int]";
    }
    const fromUse = this.inferParamTypeWalk(param, body);
    if ( (fromUse.length) > 0 ) {
      return fromUse;
    }
    return "";
  };
  inferParamTypeWalk (param, node) {
    const t = node.nodeType;
    if ( t == "IfStatement" ) {
      if ( typeof(node.test) != "undefined" ) {
        const test = node.test;
        if ( test.nodeType == "Identifier" ) {
          if ( test.name == param ) {
            return "boolean";
          }
        }
      }
    }
    if ( t == "MemberExpression" ) {
      if ( typeof(node.left) != "undefined" ) {
        const base = node.left;
        if ( base.nodeType == "Identifier" ) {
          if ( base.name == param ) {
            if ( node.computed ) {
              return "[int]";
            }
            if ( node.name == "length" ) {
              return "[int]";
            }
            if ( param == "entities" ) {
              return "[string:EntityPoseNative]";
            }
          }
        }
      }
    }
    let i = 0;
    while (i < (node.children.length)) {
      const r = this.inferParamTypeWalk(param, (node.children[i]));
      if ( (r.length) > 0 ) {
        return r;
      }
      i = i + 1;
    };
    if ( typeof(node.left) != "undefined" ) {
      const r2 = this.inferParamTypeWalk(param, (node.left));
      if ( (r2.length) > 0 ) {
        return r2;
      }
    }
    if ( typeof(node.right) != "undefined" ) {
      const r3 = this.inferParamTypeWalk(param, (node.right));
      if ( (r3.length) > 0 ) {
        return r3;
      }
    }
    if ( typeof(node.body) != "undefined" ) {
      return this.inferParamTypeWalk(param, (node.body));
    }
    return "";
  };
  isPositiveType (t) {
    if ( (t.length) == 0 ) {
      return false;
    }
    if ( t == "void" ) {
      return true;
    }
    if ( t == "int" ) {
      return false;
    }
    if ( (t.substring(0, 1 )) == "[" ) {
      return true;
    }
    if ( t == "string" ) {
      return true;
    }
    if ( t == "double" ) {
      return true;
    }
    if ( t == "boolean" ) {
      return true;
    }
    if ( (this).endsWith(t, "Native") ) {
      return true;
    }
    return false;
  };
  inferHelperReturnType (node) {
    if ( typeof(node.body) === "undefined" ) {
      return "int";
    }
    const body = node.body;
    const saved = this.varTypes;
    let local = {};
    this.varTypes = local;
    let pi = 0;
    while (pi < (node.params.length)) {
      const p = node.params[pi];
      const pt = this.helperParamType(node.name, pi);
      if ( (pt.length) > 0 ) {
        this.varTypes[p.name] = pt;
      }
      pi = pi + 1;
    };
    this.collectLocalVarTypes(body, body);
    if ( this.functionHasValueReturn(body) == false ) {
      this.varTypes = saved;
      return "void";
    }
    const result = this.findReturnType(body, node.name);
    this.varTypes = saved;
    return result;
  };
  finalizeHelperReturnTypes (ast) {
    let i = 0;
    while (i < (ast.children.length)) {
      const node = ast.children[i];
      if ( node.nodeType == "FunctionDeclaration" ) {
        if ( this.isSpecialFn(node.name) == false ) {
          if ( typeof(node.typeAnnotation) === "undefined" ) {
            const inferred = this.inferHelperReturnType(node);
            if ( this.isPositiveType(inferred) ) {
              this.fnReturnTypes[node.name] = inferred;
            }
          }
        }
      }
      i = i + 1;
    };
  };
  functionHasValueReturn (block) {
    let i = 0;
    while (i < (block.children.length)) {
      if ( this.stmtHasValueReturn((block.children[i])) ) {
        return true;
      }
      i = i + 1;
    };
    return false;
  };
  stmtHasValueReturn (stmt) {
    const t = stmt.nodeType;
    if ( t == "ReturnStatement" ) {
      return (typeof(stmt.left) !== "undefined" && stmt.left != null ) ;
    }
    if ( t == "BlockStatement" ) {
      return this.functionHasValueReturn(stmt);
    }
    if ( t == "IfStatement" ) {
      if ( typeof(stmt.body) != "undefined" ) {
        if ( this.stmtHasValueReturn((stmt.body)) ) {
          return true;
        }
      }
      if ( typeof(stmt.right) != "undefined" ) {
        if ( this.stmtHasValueReturn((stmt.right)) ) {
          return true;
        }
      }
      return false;
    }
    if ( t == "WhileStatement" ) {
      if ( typeof(stmt.body) != "undefined" ) {
        return this.stmtHasValueReturn((stmt.body));
      }
      return false;
    }
    return false;
  };
  collectLocalVarTypes (block, root) {
    let i = 0;
    while (i < (block.children.length)) {
      const stmt = block.children[i];
      if ( stmt.nodeType == "VariableDeclaration" ) {
        let j = 0;
        while (j < (stmt.children.length)) {
          const d = stmt.children[j];
          if ( d.nodeType == "VariableDeclarator" ) {
            if ( typeof(d.init) != "undefined" ) {
              const vt = this.localInitType((d.init), d.name, root);
              if ( (vt.length) > 0 ) {
                this.varTypes[d.name] = vt;
              }
            }
          }
          j = j + 1;
        };
      }
      i = i + 1;
    };
  };
  localInitType (initNode, name, root) {
    if ( initNode.nodeType == "ObjectExpression" ) {
      if ( (initNode.children.length) == 0 ) {
        if ( name == "entities" ) {
          return "[string:EntityPoseNative]";
        }
        return "[string:EntityPoseNative]";
      }
    }
    if ( initNode.nodeType == "ArrayExpression" ) {
      let elem = "";
      if ( (initNode.children.length) > 0 ) {
        elem = this.exprType((initNode.children[0]));
      } else {
        elem = this.findPushArgType(root, name);
      }
      if ( (elem.length) == 0 ) {
        elem = "int";
      }
      return ("[" + elem) + "]";
    }
    return this.exprType(initNode);
  };
  findPushArgType (block, name) {
    let i = 0;
    while (i < (block.children.length)) {
      const stmt = block.children[i];
      const r = this.findPushArgTypeInStmt(stmt, name);
      if ( (r.length) > 0 ) {
        return r;
      }
      i = i + 1;
    };
    return "";
  };
  findPushArgTypeInStmt (stmt, name) {
    const t = stmt.nodeType;
    if ( t == "BlockStatement" ) {
      return this.findPushArgType(stmt, name);
    }
    if ( t == "ExpressionStatement" ) {
      if ( typeof(stmt.left) != "undefined" ) {
        const expr = stmt.left;
        if ( expr.nodeType == "CallExpression" ) {
          if ( typeof(expr.left) != "undefined" ) {
            const callee = expr.left;
            if ( callee.nodeType == "MemberExpression" ) {
              if ( callee.name == "push" ) {
                if ( typeof(callee.left) != "undefined" ) {
                  const base = callee.left;
                  if ( base.nodeType == "Identifier" ) {
                    if ( base.name == name ) {
                      if ( (expr.children.length) > 0 ) {
                        const argNode = expr.children[0];
                        const at = this.inferCallArgType(argNode);
                        if ( (at.length) > 0 ) {
                          return at;
                        }
                        return this.exprType(argNode);
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
      return "";
    }
    if ( t == "IfStatement" ) {
      if ( typeof(stmt.body) != "undefined" ) {
        const r1 = this.findPushArgTypeInStmt((stmt.body), name);
        if ( (r1.length) > 0 ) {
          return r1;
        }
      }
      if ( typeof(stmt.right) != "undefined" ) {
        const r2 = this.findPushArgTypeInStmt((stmt.right), name);
        if ( (r2.length) > 0 ) {
          return r2;
        }
      }
      return "";
    }
    if ( t == "WhileStatement" ) {
      if ( typeof(stmt.body) != "undefined" ) {
        return this.findPushArgTypeInStmt((stmt.body), name);
      }
      return "";
    }
    return "";
  };
  findReturnType (block, fnName) {
    let i = 0;
    while (i < (block.children.length)) {
      const stmt = block.children[i];
      const rt = this.findReturnTypeInStmt(stmt, fnName);
      if ( this.isPositiveType(rt) ) {
        return rt;
      }
      i = i + 1;
    };
    return "int";
  };
  findReturnTypeInStmt (stmt, fnName) {
    const t = stmt.nodeType;
    if ( t == "ReturnStatement" ) {
      if ( typeof(stmt.left) != "undefined" ) {
        const val = stmt.left;
        if ( val.nodeType == "ObjectExpression" ) {
          return this.inferObjectStructType(val, fnName);
        }
        return this.exprType(val);
      }
      return "void";
    }
    if ( t == "BlockStatement" ) {
      return this.findReturnType(stmt, fnName);
    }
    if ( t == "IfStatement" ) {
      if ( typeof(stmt.body) != "undefined" ) {
        const r1 = this.findReturnTypeInStmt((stmt.body), fnName);
        if ( this.isPositiveType(r1) ) {
          return r1;
        }
      }
      if ( typeof(stmt.right) != "undefined" ) {
        const r2 = this.findReturnTypeInStmt((stmt.right), fnName);
        if ( this.isPositiveType(r2) ) {
          return r2;
        }
      }
      return "int";
    }
    if ( t == "WhileStatement" ) {
      if ( typeof(stmt.body) != "undefined" ) {
        return this.findReturnTypeInStmt((stmt.body), fnName);
      }
      return "int";
    }
    return "int";
  };
  recordModuleConst (node) {
    let i = 0;
    while (i < (node.children.length)) {
      const d = node.children[i];
      if ( d.nodeType == "VariableDeclarator" ) {
        if ( typeof(d.init) != "undefined" ) {
          const initNode = d.init;
          if ( initNode.nodeType == "ArrayExpression" ) {
            this.constArrayNames[d.name] = true;
            this.constArrayElemType[d.name] = this.constArrayElem(d, initNode);
          } else {
            if ( initNode.nodeType == "ObjectExpression" ) {
              const ost = this.registerModuleObjectStruct(d.name, initNode);
              this.constScalarTypes[d.name] = ost;
              this.moduleConstDeferred[d.name] = true;
            } else {
              this.constScalarTypes[d.name] = this.exprType(initNode);
              const folded = this.tryFoldIntExpr(initNode);
              if ( (folded.length) > 0 ) {
                this.constScalarValues[d.name] = folded;
              }
              if ( this.scalarInitNeedsCtor(initNode) == true ) {
                this.moduleConstDeferred[d.name] = true;
              }
            }
          }
        }
      }
      i = i + 1;
    };
  };
  constArrayElem (d, arr) {
    if ( typeof(d.typeAnnotation) != "undefined" ) {
      const full = this.annotType((d.typeAnnotation));
      if ( (full.length) > 2 ) {
        return full.substring(1, ((full.length) - 1) );
      }
    }
    if ( (arr.children.length) > 0 ) {
      const first = arr.children[0];
      if ( first.nodeType == "ObjectExpression" ) {
        return this.registerModuleArrayStruct(d.name, arr);
      }
      if ( first.nodeType == "StringLiteral" ) {
        return "string";
      }
      if ( first.nodeType == "ArrayExpression" ) {
        return "[string]";
      }
      if ( first.nodeType == "NumericLiteral" ) {
        if ( this.containsChar(first.value, 46) ) {
          return "double";
        }
        return "int";
      }
    }
    return "int";
  };
  scalarInitNeedsCtor (node) {
    const t = node.nodeType;
    if ( t == "NumericLiteral" ) {
      return false;
    }
    if ( t == "StringLiteral" ) {
      return false;
    }
    if ( t == "BooleanLiteral" ) {
      return false;
    }
    const folded = this.tryFoldIntExpr(node);
    if ( (folded.length) > 0 ) {
      return false;
    }
    return true;
  };
  mergeArrayObjectFieldsCsv (arr) {
    let pairs = [];
    let seen = {};
    let k = 0;
    while (k < (arr.children.length)) {
      const el = arr.children[k];
      if ( el.nodeType == "ObjectExpression" ) {
        let j = 0;
        while (j < (el.children.length)) {
          const prop = el.children[j];
          if ( prop.nodeType == "Property" ) {
            const key = this.propKey(prop);
            if ( (key.length) > 0 ) {
              const was = ( seen.hasOwnProperty(key) ? seen[key] : undefined );
              if ( typeof(was) === "undefined" ) {
                seen[key] = true;
                const valNode = this.propertyValueNode(prop);
                const ft = this.objectFieldType(key, valNode);
                pairs.push((key + ":") + ft);
              }
            }
          }
          j = j + 1;
        };
      }
      k = k + 1;
    };
    return this.joinCsv(pairs);
  };
  registerModuleArrayStruct (arrName, arr) {
    const baseName = arrName + "Elem";
    const structType = baseName + "Native";
    const done = ( this.synthStructDone.hasOwnProperty(baseName) ? this.synthStructDone[baseName] : undefined );
    if ( typeof(done) === "undefined" ) {
      const csv = this.mergeArrayObjectFieldsCsv(arr);
      this.interfaceFieldsCsv[baseName] = csv;
      this.interfaceNames.push(baseName);
      this.synthStructDone[baseName] = true;
    }
    return structType;
  };
  registerModuleObjectStruct (constName, obj) {
    const baseName = constName + "Const";
    const structType = baseName + "Native";
    const done = ( this.synthStructDone.hasOwnProperty(baseName) ? this.synthStructDone[baseName] : undefined );
    if ( typeof(done) === "undefined" ) {
      const csv = this.objectFieldsCsv(obj);
      this.interfaceFieldsCsv[baseName] = csv;
      this.interfaceNames.push(baseName);
      this.synthStructDone[baseName] = true;
    }
    return structType;
  };
  tryFoldIntExpr (node) {
    const t = node.nodeType;
    if ( t == "NumericLiteral" ) {
      if ( this.containsChar(node.value, 46) ) {
        return "";
      }
      return node.value;
    }
    if ( t == "Identifier" ) {
      const v = ( this.constScalarValues.hasOwnProperty(node.name) ? this.constScalarValues[node.name] : undefined );
      if ( (typeof(v) !== "undefined" && v != null )  ) {
        return v;
      }
      return "";
    }
    if ( t == "BinaryExpression" ) {
      if ( typeof(node.left) === "undefined" ) {
        return "";
      }
      if ( typeof(node.right) === "undefined" ) {
        return "";
      }
      const lv = this.tryFoldIntExpr((node.left));
      const rv = this.tryFoldIntExpr((node.right));
      if ( (lv.length) == 0 ) {
        return "";
      }
      if ( (rv.length) == 0 ) {
        return "";
      }
      const li = this.parseIntStr(lv);
      const ri = this.parseIntStr(rv);
      const op = node.value;
      if ( op == "*" ) {
        return this.formatIntStr((li * ri));
      }
      if ( op == "+" ) {
        return this.formatIntStr((li + ri));
      }
      if ( op == "-" ) {
        return this.formatIntStr((li - ri));
      }
      if ( op == "/" ) {
        return this.formatIntStr(this.divInt(li, ri));
      }
      return "";
    }
    return "";
  };
  recordInterface (node) {
    this.interfaceNames.push(node.name);
    let pairs = [];
    if ( typeof(node.body) != "undefined" ) {
      const body = node.body;
      let i = 0;
      while (i < (body.children.length)) {
        const prop = body.children[i];
        if ( (prop.name.length) > 0 ) {
          let pt = "int";
          if ( typeof(prop.typeAnnotation) != "undefined" ) {
            pt = this.annotType((prop.typeAnnotation));
          }
          pairs.push((prop.name + ":") + pt);
        }
        i = i + 1;
      };
    }
    this.interfaceFieldsCsv[node.name] = this.joinCsv(pairs);
  };
  emitInterfaces () {
    let i = 0;
    while (i < (this.interfaceNames.length)) {
      const name = this.interfaceNames[i];
      this.emitLine("class " + (name + "Native {"));
      const csv = ( this.interfaceFieldsCsv.hasOwnProperty(name) ? this.interfaceFieldsCsv[name] : undefined );
      if ( (typeof(csv) !== "undefined" && csv != null )  ) {
        const pairs = this.splitCsv((csv));
        let j = 0;
        while (j < (pairs.length)) {
          const pair = pairs[j];
          const colon = pair.indexOf(":");
          if ( colon > 0 ) {
            const fname = pair.substring(0, colon );
            const ftype = pair.substring((colon + 1), (pair.length) );
            this.emitLine(("    def " + fname) + ((":" + ftype) + (" " + this.zeroFor(ftype))));
          }
          j = j + 1;
        };
      }
      this.emitLine("}");
      this.emitLine("");
      i = i + 1;
    };
  };
  zeroFor (t) {
    if ( t == "double" ) {
      return "0.0";
    }
    if ( t == "int" ) {
      return "0";
    }
    if ( t == "string" ) {
      return "\"\"";
    }
    if ( t == "boolean" ) {
      return "false";
    }
    const first = t.substring(0, 1 );
    if ( first == "[" ) {
      return "";
    }
    return "(new " + (t + ")");
  };
  emitModuleSingleton (ast) {
    this.emitLine(("class " + this.moduleSingletonClass) + " @singleton(true) {");
    let needsCtor = false;
    let i = 0;
    while (i < (ast.children.length)) {
      const node = ast.children[i];
      if ( node.nodeType == "VariableDeclaration" ) {
        let j = 0;
        while (j < (node.children.length)) {
          const d = node.children[j];
          if ( d.nodeType == "VariableDeclarator" ) {
            const isArr = ( this.constArrayNames.hasOwnProperty(d.name) ? this.constArrayNames[d.name] : undefined );
            if ( (typeof(isArr) !== "undefined" && isArr != null )  ) {
              needsCtor = true;
              const elem = ( this.constArrayElemType.hasOwnProperty(d.name) ? this.constArrayElemType[d.name] : undefined );
              let et = "int";
              if ( (typeof(elem) !== "undefined" && elem != null )  ) {
                et = elem;
              }
              this.emitLine(((("    def " + d.name) + ":[") + et) + "]");
            } else {
              const dep = ( this.moduleConstDeferred.hasOwnProperty(d.name) ? this.moduleConstDeferred[d.name] : undefined );
              if ( (typeof(dep) !== "undefined" && dep != null )  ) {
                needsCtor = true;
                if ( typeof(d.init) != "undefined" ) {
                  const initNode = d.init;
                  let ct = this.exprType(initNode);
                  const stored = ( this.constScalarTypes.hasOwnProperty(d.name) ? this.constScalarTypes[d.name] : undefined );
                  if ( (typeof(stored) !== "undefined" && stored != null )  ) {
                    ct = stored;
                  }
                  this.emitLine((("    def " + d.name) + (":" + ct)) + (" " + this.zeroFor(ct)));
                }
              } else {
                if ( typeof(d.init) != "undefined" ) {
                  const initNode2 = d.init;
                  const ct2 = this.exprType(initNode2);
                  let rhs = "";
                  const fv = ( this.constScalarValues.hasOwnProperty(d.name) ? this.constScalarValues[d.name] : undefined );
                  if ( (typeof(fv) !== "undefined" && fv != null )  ) {
                    rhs = fv;
                  } else {
                    rhs = this.emitExpr(initNode2, ct2);
                  }
                  this.emitLine((("    def " + d.name) + (":" + ct2)) + (" " + rhs));
                }
              }
            }
          }
          j = j + 1;
        };
      }
      i = i + 1;
    };
    if ( needsCtor ) {
      this.emitLine("    Constructor () {");
      this.indentLevel = 2;
      this.inModuleSingletonCtor = true;
      let k = 0;
      while (k < (ast.children.length)) {
        const node2 = ast.children[k];
        if ( node2.nodeType == "VariableDeclaration" ) {
          let m = 0;
          while (m < (node2.children.length)) {
            const d2 = node2.children[m];
            if ( d2.nodeType == "VariableDeclarator" ) {
              const isArr2 = ( this.constArrayNames.hasOwnProperty(d2.name) ? this.constArrayNames[d2.name] : undefined );
              if ( (typeof(isArr2) !== "undefined" && isArr2 != null )  ) {
                const elem2 = ( this.constArrayElemType.hasOwnProperty(d2.name) ? this.constArrayElemType[d2.name] : undefined );
                let et2 = "int";
                if ( (typeof(elem2) !== "undefined" && elem2 != null )  ) {
                  et2 = elem2;
                }
                const tmpName = "_boot_" + d2.name;
                this.emitLine(((("def " + tmpName) + ":[") + et2) + "]");
                if ( typeof(d2.init) != "undefined" ) {
                  const arr = d2.init;
                  if ( arr.nodeType == "ArrayExpression" ) {
                    let n = 0;
                    while (n < (arr.children.length)) {
                      const el = arr.children[n];
                      const ev = this.emitValueExpr(el, et2);
                      this.emitLine((("push " + tmpName) + " ") + ev);
                      n = n + 1;
                    };
                  }
                }
                this.emitLine(d2.name + (" = " + tmpName));
              }
              const dep2 = ( this.moduleConstDeferred.hasOwnProperty(d2.name) ? this.moduleConstDeferred[d2.name] : undefined );
              if ( (typeof(dep2) !== "undefined" && dep2 != null )  ) {
                if ( typeof(d2.init) != "undefined" ) {
                  const init3 = d2.init;
                  if ( init3.nodeType == "ObjectExpression" ) {
                    const ost2 = ( this.constScalarTypes.hasOwnProperty(d2.name) ? this.constScalarTypes[d2.name] : undefined );
                    let ostype = "int";
                    if ( (typeof(ost2) !== "undefined" && ost2 != null )  ) {
                      ostype = ost2;
                    }
                    const tmpO = "_boot_" + d2.name;
                    this.emitStructFromObject(init3, tmpO, ostype);
                    this.emitLine(d2.name + (" = " + tmpO));
                  } else {
                    const ct3 = this.exprType(init3);
                    const rhs3 = this.emitExpr(init3, ct3);
                    this.emitLine(d2.name + (" = " + rhs3));
                  }
                }
              }
            }
            m = m + 1;
          };
        }
        k = k + 1;
      };
      this.indentLevel = 0;
      this.inModuleSingletonCtor = false;
      this.emitLine("    }");
    }
    this.emitLine("}");
  };
  emitConstFields (ast) {
    let i = 0;
    while (i < (ast.children.length)) {
      const node = ast.children[i];
      if ( node.nodeType == "VariableDeclaration" ) {
        let j = 0;
        while (j < (node.children.length)) {
          const d = node.children[j];
          if ( d.nodeType == "VariableDeclarator" ) {
            const isArr = ( this.constArrayNames.hasOwnProperty(d.name) ? this.constArrayNames[d.name] : undefined );
            if ( typeof(isArr) === "undefined" ) {
              if ( typeof(d.init) != "undefined" ) {
                const initNode = d.init;
                const ct = this.exprType(initNode);
                let rhs = "";
                const fv = ( this.constScalarValues.hasOwnProperty(d.name) ? this.constScalarValues[d.name] : undefined );
                if ( (typeof(fv) !== "undefined" && fv != null )  ) {
                  rhs = fv;
                } else {
                  rhs = this.emitExpr(initNode, ct);
                }
                this.emitLine((("    def " + d.name) + (":" + ct)) + (" " + rhs));
              }
            }
          }
          j = j + 1;
        };
      }
      i = i + 1;
    };
    this.emitLine("");
  };
  emitConstArrayMethods (node) {
    let j = 0;
    while (j < (node.children.length)) {
      const d = node.children[j];
      if ( d.nodeType == "VariableDeclarator" ) {
        const isArr = ( this.constArrayNames.hasOwnProperty(d.name) ? this.constArrayNames[d.name] : undefined );
        if ( (typeof(isArr) !== "undefined" && isArr != null )  ) {
          const elem = ( this.constArrayElemType.hasOwnProperty(d.name) ? this.constArrayElemType[d.name] : undefined );
          let et = "int";
          if ( (typeof(elem) !== "undefined" && elem != null )  ) {
            et = elem;
          }
          this.emitLine(((("    fn " + d.name) + ":[") + et) + "] () {");
          this.emitLine(("        def out:[" + et) + "]");
          if ( typeof(d.init) != "undefined" ) {
            const arr = d.init;
            if ( arr.nodeType == "ArrayExpression" ) {
              let k = 0;
              while (k < (arr.children.length)) {
                const el = arr.children[k];
                const ev = this.emitExpr(el, et);
                this.emitLine("        push out " + ev);
                k = k + 1;
              };
            }
          }
          this.emitLine("        return out");
          this.emitLine("    }");
          this.emitLine("");
        }
      }
      j = j + 1;
    };
  };
  emitFunction (node) {
    this.currentFn = node.name;
    this.inSpritesFn = this.currentFn == "sprites";
    this.inInitFn = this.currentFn == "initState";
    this.inUpdateFn = this.currentFn == "update";
    this.inResourcesFn = this.currentFn == "resources";
    let fresh = {};
    this.varTypes = fresh;
    this.stateVarName = "s";
    let freshIds = [];
    this.readEntityIds = freshIds;
    let freshSeen = {};
    this.readEntitySeen = freshSeen;
    let freshPlayers = [];
    this.readPlayerIndices = freshPlayers;
    let freshPlayerSeen = {};
    this.readPlayerSeen = freshPlayerSeen;
    this.inputVarName = "input";
    const isHelper = this.isSpecialFn(this.currentFn) == false;
    let retType = "void";
    if ( this.inSpritesFn ) {
      retType = "[SpriteDefNative]";
    }
    if ( this.inResourcesFn ) {
      retType = "[ResourceDefNative]";
    }
    if ( this.inInitFn ) {
      retType = "NativeGameState";
    }
    if ( this.inUpdateFn ) {
      retType = "NativeGameState";
    }
    if ( this.currentFn == "hud" ) {
      this.emitLine("    fn hud:void (props:UpdatePropsNative) {");
      this.emitLine("        ; omitted on native path (score drawn by NativeGameRunner)");
      this.emitLine("    }");
      this.emitLine("");
      return;
    }
    if ( isHelper ) {
      retType = this.helperReturnType(this.currentFn);
    }
    const params = this.emitParams(node.params);
    this.emitLine((("    fn " + this.currentFn) + (":" + retType)) + ((" (" + params) + ") {"));
    if ( typeof(node.body) === "undefined" ) {
      this.emitLine("    }");
      return;
    }
    const body = node.body;
    this.indentLevel = 2;
    this.emitModuleLocalIfNeeded(body);
    if ( this.inUpdateFn ) {
      this.prescanStateVar(body);
      this.collectEntityReads(body);
      this.collectInputPlayerReads(body);
      this.emitStateBinding(body);
      this.emitEntityHoists();
      this.emitInputPlayerHoists();
      this.emitBlockBodySkippingStateDecl(body);
    } else {
      this.emitBlockBody(body);
    }
    this.indentLevel = 0;
    this.emitLine("    }");
    this.emitLine("");
  };
  emitStateBinding (body) {
    this.emitLine(("def " + this.stateVarName) + ":NativeGameState (props.state)");
    this.varTypes[this.stateVarName] = "NativeGameState";
  };
  emitEntityHoists () {
    let i = 0;
    while (i < (this.readEntityIds.length)) {
      const id = this.readEntityIds[i];
      this.emitLine((((("def in_" + id) + ":EntityPoseNative (unwrap (get ") + this.stateVarName) + (".entities \"" + id)) + "\"))");
      i = i + 1;
    };
  };
  emitBlockBodySkippingStateDecl (block) {
    let i = 0;
    while (i < (block.children.length)) {
      const stmt = block.children[i];
      if ( this.isStateVarDecl(stmt) ) {
        i = i + 1;
        continue;
      }
      this.emitStatement(stmt);
      i = i + 1;
    };
  };
  isStateVarDecl (stmt) {
    if ( stmt.nodeType != "VariableDeclaration" ) {
      return false;
    }
    let i = 0;
    while (i < (stmt.children.length)) {
      const d = stmt.children[i];
      if ( d.nodeType == "VariableDeclarator" ) {
        if ( d.name == this.stateVarName ) {
          if ( typeof(d.init) != "undefined" ) {
            const initNode = d.init;
            if ( this.isPropsStateMember(initNode) ) {
              return true;
            }
          }
        }
        if ( typeof(d.init) != "undefined" ) {
          const initNode2 = d.init;
          if ( this.isPropsInputMember(initNode2) ) {
            this.inputVarName = d.name;
          }
        }
      }
      i = i + 1;
    };
    return false;
  };
  isPropsInputMember (node) {
    if ( node.nodeType != "MemberExpression" ) {
      return false;
    }
    if ( node.name != "input" ) {
      return false;
    }
    if ( typeof(node.left) === "undefined" ) {
      return false;
    }
    const base = node.left;
    if ( base.nodeType != "Identifier" ) {
      return false;
    }
    return base.name == "props";
  };
  isPropsStateMember (node) {
    if ( node.nodeType != "MemberExpression" ) {
      return false;
    }
    if ( node.name != "state" ) {
      return false;
    }
    if ( typeof(node.left) === "undefined" ) {
      return false;
    }
    const base = node.left;
    if ( base.nodeType == "Identifier" ) {
      return base.name == "props";
    }
    return false;
  };
  prescanStateVar (node) {
    if ( node.nodeType == "VariableDeclaration" ) {
      let i = 0;
      while (i < (node.children.length)) {
        const d = node.children[i];
        if ( d.nodeType == "VariableDeclarator" ) {
          if ( typeof(d.init) != "undefined" ) {
            if ( this.isPropsStateMember((d.init)) ) {
              this.stateVarName = d.name;
            }
            if ( this.isPropsInputMember((d.init)) ) {
              this.inputVarName = d.name;
            }
          }
        }
        i = i + 1;
      };
    }
    this.walkChildren(node, "prescanStateVar");
  };
  collectEntityReads (node) {
    if ( node.nodeType == "MemberExpression" ) {
      if ( typeof(node.left) != "undefined" ) {
        const base = node.left;
        if ( base.nodeType == "MemberExpression" ) {
          if ( base.name == "entities" ) {
            const id = node.name;
            if ( (id.length) > 0 ) {
              const seen = ( this.readEntitySeen.hasOwnProperty(id) ? this.readEntitySeen[id] : undefined );
              if ( typeof(seen) === "undefined" ) {
                this.readEntitySeen[id] = true;
                this.readEntityIds.push(id);
              }
            }
          }
        }
      }
    }
    this.walkChildren(node, "collectEntityReads");
  };
  inputPlayerIndex (node) {
    if ( node.nodeType != "MemberExpression" ) {
      return "";
    }
    if ( typeof(node.left) === "undefined" ) {
      return "";
    }
    const idxAccess = node.left;
    if ( idxAccess.nodeType != "MemberExpression" ) {
      return "";
    }
    if ( idxAccess.computed == false ) {
      return "";
    }
    if ( typeof(idxAccess.left) === "undefined" ) {
      return "";
    }
    const playersAccess = idxAccess.left;
    if ( playersAccess.nodeType != "MemberExpression" ) {
      return "";
    }
    if ( playersAccess.name != "players" ) {
      return "";
    }
    if ( typeof(playersAccess.left) === "undefined" ) {
      return "";
    }
    const root = playersAccess.left;
    if ( root.nodeType != "Identifier" ) {
      return "";
    }
    if ( root.name != this.inputVarName ) {
      return "";
    }
    if ( typeof(idxAccess.right) === "undefined" ) {
      return "";
    }
    const idxNode = idxAccess.right;
    if ( idxNode.nodeType != "NumericLiteral" ) {
      return "";
    }
    return idxNode.value;
  };
  collectInputPlayerReads (node) {
    const idx = this.inputPlayerIndex(node);
    if ( (idx.length) > 0 ) {
      const seen = ( this.readPlayerSeen.hasOwnProperty(idx) ? this.readPlayerSeen[idx] : undefined );
      if ( typeof(seen) === "undefined" ) {
        this.readPlayerSeen[idx] = true;
        this.readPlayerIndices.push(idx);
      }
    }
    this.walkChildren(node, "collectInputPlayerReads");
  };
  emitInputPlayerHoists () {
    let i = 0;
    while (i < (this.readPlayerIndices.length)) {
      const idx = this.readPlayerIndices[i];
      const localName = "in_pl" + idx;
      this.emitLine(((("def " + localName) + ":PlayerInputNative (itemAt props.input.players ") + idx) + ")");
      i = i + 1;
    };
  };
  walkChildren (node, visitor) {
    if ( typeof(node.left) != "undefined" ) {
      this.dispatchVisit(node.left, visitor);
    }
    if ( typeof(node.right) != "undefined" ) {
      this.dispatchVisit(node.right, visitor);
    }
    if ( typeof(node.body) != "undefined" ) {
      this.dispatchVisit(node.body, visitor);
    }
    if ( typeof(node.init) != "undefined" ) {
      this.dispatchVisit(node.init, visitor);
    }
    if ( typeof(node.test) != "undefined" ) {
      this.dispatchVisit(node.test, visitor);
    }
    if ( typeof(node.consequent) != "undefined" ) {
      this.dispatchVisit(node.consequent, visitor);
    }
    if ( typeof(node.alternate) != "undefined" ) {
      this.dispatchVisit(node.alternate, visitor);
    }
    let i = 0;
    while (i < (node.children.length)) {
      this.dispatchVisit(node.children[i], visitor);
      i = i + 1;
    };
  };
  dispatchVisit (node, visitor) {
    if ( visitor == "prescanStateVar" ) {
      this.prescanStateVar(node);
      return;
    }
    if ( visitor == "collectEntityReads" ) {
      this.collectEntityReads(node);
      return;
    }
    if ( visitor == "collectInputPlayerReads" ) {
      this.collectInputPlayerReads(node);
      return;
    }
  };
  emitParams (params) {
    if ( this.inUpdateFn ) {
      this.varTypes["props"] = "UpdatePropsNative";
      return "props:UpdatePropsNative";
    }
    let parts = [];
    let i = 0;
    while (i < (params.length)) {
      const p = params[i];
      let pt = "int";
      if ( typeof(p.typeAnnotation) != "undefined" ) {
        pt = this.annotType((p.typeAnnotation));
      } else {
        const fromReg = this.helperParamType(this.currentFn, i);
        if ( (fromReg.length) > 0 ) {
          pt = fromReg;
        }
      }
      this.varTypes[p.name] = pt;
      parts.push((p.name + ":") + pt);
      i = i + 1;
    };
    return this.joinSpace(parts);
  };
  joinSpace (items) {
    let out = "";
    let i = 0;
    while (i < (items.length)) {
      if ( i > 0 ) {
        out = out + " ";
      }
      out = out + (items[i]);
      i = i + 1;
    };
    return out;
  };
  emitBlockBody (block) {
    this.currentEmitBlock = block;
    let i = 0;
    while (i < (block.children.length)) {
      const stmt = block.children[i];
      this.emitStatement(stmt);
      i = i + 1;
    };
  };
  emitStatement (stmt) {
    const t = stmt.nodeType;
    if ( t == "VariableDeclaration" ) {
      this.emitVarDecl(stmt);
      return;
    }
    if ( t == "IfStatement" ) {
      this.emitIf(stmt);
      return;
    }
    if ( t == "ReturnStatement" ) {
      this.emitReturn(stmt);
      return;
    }
    if ( t == "ExpressionStatement" ) {
      this.emitExpressionStatement(stmt);
      return;
    }
    if ( t == "WhileStatement" ) {
      this.emitWhile(stmt);
      return;
    }
    if ( t == "BlockStatement" ) {
      this.emitBlockBody(stmt);
      return;
    }
  };
  emitWhile (node) {
    let cond = "false";
    if ( typeof(node.left) != "undefined" ) {
      cond = this.emitExpr((node.left), "boolean");
    }
    this.emitLine(("while (" + cond) + ") {");
    this.indent();
    if ( typeof(node.body) != "undefined" ) {
      const b = node.body;
      if ( b.nodeType == "BlockStatement" ) {
        this.emitBlockBody(b);
      } else {
        this.emitStatement(b);
      }
    }
    this.dedent();
    this.emitLine("}");
  };
  emitExpressionStatement (stmt) {
    if ( typeof(stmt.left) === "undefined" ) {
      return;
    }
    const expr = stmt.left;
    if ( expr.nodeType == "AssignmentExpression" ) {
      this.emitAssignment(expr);
      return;
    }
    if ( expr.nodeType == "CallExpression" ) {
      this.emitCallStatement(expr);
      return;
    }
  };
  emitCallStatement (node) {
    if ( typeof(node.left) === "undefined" ) {
      return;
    }
    const callee = node.left;
    if ( callee.nodeType == "MemberExpression" ) {
      if ( callee.name == "push" ) {
        if ( typeof(callee.left) != "undefined" ) {
          const base = this.emitExpr((callee.left), "int");
          const et = this.elemTypeOf(this.exprType((callee.left)));
          let argStr = "";
          if ( (node.children.length) > 0 ) {
            const argNode = node.children[0];
            argStr = this.emitValueExpr(argNode, et);
            if ( argNode.nodeType == "CallExpression" ) {
              argStr = ("(" + argStr) + ")";
            }
          }
          this.emitLine((("push " + base) + " ") + argStr);
          return;
        }
      }
    }
    this.emitLine(this.emitCall(node));
  };
  emitAssignment (node) {
    const targetNode = node.left;
    const rhsNode = node.right;
    if ( targetNode.nodeType == "MemberExpression" ) {
      this.emitMemberAssign(targetNode, rhsNode);
      return;
    }
    const lhs = this.emitAssignTarget(targetNode);
    const expected = this.assignTargetType(targetNode);
    let rhs = this.emitExpr(rhsNode, expected);
    rhs = this.coerceToType(rhs, rhsNode, expected);
    this.emitLine((lhs + " = ") + rhs);
    if ( targetNode.nodeType == "Identifier" ) {
      const rhsT = this.exprType(rhsNode);
      if ( rhsT == "double" ) {
        if ( expected == "int" ) {
          this.varTypes[targetNode.name] = "double";
        }
      }
    }
  };
  emitMemberAssign (target, rhs) {
    if ( typeof(target.left) === "undefined" ) {
      return;
    }
    const baseNode = target.left;
    const baseType = this.exprType(baseNode);
    const base = this.emitExpr(baseNode, "int");
    if ( (this).startsWith(baseType, "[string:") ) {
      const valType = this.elemTypeOf(baseType);
      let key = "";
      if ( target.computed ) {
        if ( typeof(target.right) != "undefined" ) {
          const keyNode = target.right;
          key = this.emitExpr(keyNode, "string");
          if ( keyNode.nodeType == "CallExpression" ) {
            key = ("(" + key) + ")";
          }
        }
      } else {
        key = ("\"" + target.name) + "\"";
      }
      const valExpr = this.emitRhsValue(rhs, valType);
      this.emitLine((((("set " + base) + " ") + key) + " ") + valExpr);
      return;
    }
    if ( target.computed ) {
      const et = this.elemTypeOf(baseType);
      let idxT = "int";
      let idx = "0";
      if ( typeof(target.right) != "undefined" ) {
        idxT = this.exprType((target.right));
        idx = this.emitExpr((target.right), idxT);
        if ( idxT == "double" ) {
          idx = ("(to_int " + idx) + ")";
        }
      }
      let valExpr_1 = this.emitRhsValue(rhs, et);
      valExpr_1 = this.coerceToType(valExpr_1, rhs, et);
      this.emitLine((((("set " + base) + " ") + idx) + " ") + valExpr_1);
      return;
    }
    let ft = this.structFieldType(baseType, target.name);
    if ( (ft.length) == 0 ) {
      ft = this.fieldType(target.name);
    }
    let v = this.emitExpr(rhs, ft);
    if ( ft == "double" ) {
      const rt = this.exprType(rhs);
      if ( rt == "int" ) {
        if ( rhs.nodeType != "NumericLiteral" ) {
          if ( rhs.nodeType != "Identifier" ) {
            let skip = false;
            if ( (v.length) >= 4 ) {
              if ( (v.substring(0, 4 )) == "(0.0" ) {
                skip = true;
              }
            }
            if ( (v.length) >= 10 ) {
              if ( (v.substring(0, 10 )) == "(to_double" ) {
                skip = true;
              }
            }
            if ( skip == false ) {
              v = ("(to_double " + v) + ")";
            }
          }
        }
      }
    }
    this.emitLine(((base + ".") + target.name) + (" = " + v));
  };
  emitRhsValue (node, expected) {
    return this.emitValueExpr(node, expected);
  };
  emitValueExpr (node, expected) {
    if ( node.nodeType == "ObjectExpression" ) {
      if ( (this).endsWith(expected, "Native") ) {
        const tmp = "tmp" + ("" + this.tmpCounter);
        this.tmpCounter = this.tmpCounter + 1;
        this.emitStructFromObject(node, tmp, expected);
        return tmp;
      }
    }
    if ( node.nodeType == "ArrayExpression" ) {
      if ( (this).startsWith(expected, "[") ) {
        const et = this.elemTypeOf(expected);
        const tmp2 = "tmp" + ("" + this.tmpCounter);
        this.tmpCounter = this.tmpCounter + 1;
        this.emitLine((("def " + tmp2) + ":") + expected);
        let k = 0;
        while (k < (node.children.length)) {
          const el = node.children[k];
          const ev = this.emitValueExpr(el, et);
          this.emitLine((("push " + tmp2) + " ") + ev);
          k = k + 1;
        };
        return tmp2;
      }
    }
    return this.emitExpr(node, expected);
  };
  startsWith (s, prefix) {
    const plen = prefix.length;
    if ( plen > (s.length) ) {
      return false;
    }
    return (s.substring(0, plen )) == prefix;
  };
  assignTargetType (node) {
    if ( node.nodeType == "Identifier" ) {
      const vt = this.lookupVarType(node.name);
      if ( (vt.length) > 0 ) {
        return vt;
      }
      return "int";
    }
    if ( node.nodeType == "MemberExpression" ) {
      return this.fieldType(node.name);
    }
    return "int";
  };
  emitAssignTarget (node) {
    if ( node.nodeType == "Identifier" ) {
      return node.name;
    }
    if ( node.nodeType == "MemberExpression" ) {
      return this.emitMember(node, "int");
    }
    return "tmp";
  };
  emitVarDecl (node) {
    let i = 0;
    while (i < (node.children.length)) {
      const d = node.children[i];
      if ( d.nodeType != "VariableDeclarator" ) {
        i = i + 1;
        continue;
      }
      const name = d.name;
      let hasAnnot = false;
      let rtype = "int";
      if ( typeof(d.typeAnnotation) != "undefined" ) {
        rtype = this.annotType((d.typeAnnotation));
        hasAnnot = true;
      }
      if ( typeof(d.init) === "undefined" ) {
        this.varTypes[name] = rtype;
        this.emitLine(("def " + name) + (":" + rtype));
        i = i + 1;
        continue;
      }
      const initNode = d.init;
      if ( hasAnnot == false ) {
        rtype = this.exprType(initNode);
      }
      if ( initNode.nodeType == "NumericLiteral" ) {
        if ( this.inUpdateFn ) {
          if ( (this).endsWith(name, "vy") ) {
            rtype = "double";
          }
        }
      }
      if ( initNode.nodeType == "ArrayExpression" ) {
        if ( (initNode.children.length) == 0 ) {
          const pushed = this.findPushArgType(this.currentEmitBlock, name);
          if ( (pushed.length) > 0 ) {
            rtype = ("[" + pushed) + "]";
          }
          if ( this.inUpdateFn && (name == "events") ) {
            if ( (pushed.length) == 0 ) {
              rtype = "[GameEventNative]";
            }
          }
        }
      }
      this.varTypes[name] = rtype;
      if ( initNode.nodeType == "ArrayExpression" ) {
        const et = this.elemTypeOf(rtype);
        this.emitLine((("def " + name) + ":") + rtype);
        let k = 0;
        while (k < (initNode.children.length)) {
          const el = initNode.children[k];
          const ev = this.emitValueExpr(el, et);
          this.emitLine((("push " + name) + " ") + ev);
          k = k + 1;
        };
        i = i + 1;
        continue;
      }
      if ( initNode.nodeType == "ObjectExpression" ) {
        if ( (this).endsWith(rtype, "Native") ) {
          this.emitStructFromObject(initNode, name, rtype);
          i = i + 1;
          continue;
        }
        if ( (initNode.children.length) == 0 ) {
          if ( (this).startsWith(rtype, "[") ) {
            this.emitLine((("def " + name) + ":") + rtype);
            i = i + 1;
            continue;
          }
        }
      }
      const rhs = this.emitExpr(initNode, rtype);
      this.emitLine((("def " + name) + (":" + rtype)) + ((" (" + rhs) + ")"));
      i = i + 1;
    };
  };
  emitStructFromObject (node, varName, structType) {
    this.emitLine(((("def " + varName) + ":") + structType) + ((" (new " + structType) + ")"));
    let i = 0;
    while (i < (node.children.length)) {
      const prop = node.children[i];
      if ( prop.nodeType == "Property" ) {
        const key = this.propKey(prop);
        let ft = this.structFieldType(structType, key);
        if ( (ft.length) == 0 ) {
          ft = this.fieldType(key);
        }
        const valNode = this.propertyValueNode(prop);
        let v = this.emitValueExpr(valNode, ft);
        if ( ft == "double" ) {
          const rt = this.exprType(valNode);
          if ( rt == "int" ) {
            if ( valNode.nodeType != "NumericLiteral" ) {
              if ( valNode.nodeType != "Identifier" ) {
                let skip = false;
                if ( (v.length) >= 4 ) {
                  if ( (v.substring(0, 4 )) == "(0.0" ) {
                    skip = true;
                  }
                }
                if ( (v.length) >= 10 ) {
                  if ( (v.substring(0, 10 )) == "(to_double" ) {
                    skip = true;
                  }
                }
                if ( skip == false ) {
                  v = ("(to_double " + v) + ")";
                }
              }
            }
          }
        }
        this.emitLine((varName + ".") + (key + (" = " + v)));
      }
      i = i + 1;
    };
  };
  emitIf (node) {
    if ( this.inUpdateFn ) {
      if ( typeof(node.left) != "undefined" ) {
        const test = node.left;
        if ( test.nodeType == "Identifier" ) {
          if ( test.name == "input" ) {
            if ( typeof(node.body) != "undefined" ) {
              const cons = node.body;
              if ( cons.nodeType == "BlockStatement" ) {
                this.emitBlockBody(cons);
              } else {
                this.emitStatement(cons);
              }
            }
            return;
          }
        }
        if ( test.nodeType == "MemberExpression" ) {
          if ( test.computed ) {
            if ( typeof(test.left) != "undefined" ) {
              const base = test.left;
              if ( base.nodeType == "MemberExpression" ) {
                if ( base.name == "players" ) {
                  if ( typeof(base.left) != "undefined" ) {
                    const root = base.left;
                    if ( root.nodeType == "Identifier" ) {
                      if ( root.name == "input" ) {
                        let idxLit = "0";
                        if ( typeof(test.right) != "undefined" ) {
                          const idxNode = test.right;
                          if ( idxNode.nodeType == "NumericLiteral" ) {
                            idxLit = idxNode.value;
                          }
                        }
                        let minLen = "1";
                        if ( idxLit == "1" ) {
                          minLen = "2";
                        }
                        if ( idxLit == "2" ) {
                          minLen = "3";
                        }
                        let ifLine = "if ((array_length input.players) >= ";
                        ifLine = ifLine + minLen;
                        ifLine = ifLine + ") {";
                        this.emitLine(ifLine);
                        this.indent();
                        if ( typeof(node.body) != "undefined" ) {
                          const cons2 = node.body;
                          if ( cons2.nodeType == "BlockStatement" ) {
                            this.emitBlockBody(cons2);
                          } else {
                            this.emitStatement(cons2);
                          }
                        }
                        this.dedent();
                        this.emitLine("}");
                        return;
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
    let cond = "";
    if ( typeof(node.left) != "undefined" ) {
      cond = this.emitExpr((node.left), "boolean");
    }
    this.emitLine(("if (" + cond) + ") {");
    this.indent();
    if ( typeof(node.body) != "undefined" ) {
      const cons_1 = node.body;
      if ( cons_1.nodeType == "BlockStatement" ) {
        this.emitBlockBody(cons_1);
      } else {
        this.emitStatement(cons_1);
      }
    }
    this.dedent();
    if ( typeof(node.right) != "undefined" ) {
      this.emitLine("} {");
      this.indent();
      const alt = node.right;
      if ( alt.nodeType == "BlockStatement" ) {
        this.emitBlockBody(alt);
      } else {
        this.emitStatement(alt);
      }
      this.dedent();
      this.emitLine("}");
      return;
    }
    this.emitLine("}");
  };
  emitReturn (node) {
    if ( typeof(node.left) === "undefined" ) {
      this.emitLine("return");
      return;
    }
    const val = node.left;
    if ( this.inSpritesFn ) {
      if ( val.nodeType == "ArrayExpression" ) {
        this.emitSpriteArrayReturn(val);
      } else {
        const rs = this.emitExpr(val, "[SpriteDefNative]");
        this.emitLine("return " + rs);
      }
      return;
    }
    if ( this.inResourcesFn ) {
      this.emitResourceArrayReturn(val);
      return;
    }
    if ( this.inInitFn ) {
      this.emitStateReturn(val, false);
      return;
    }
    if ( this.inUpdateFn ) {
      this.emitStateReturn(val, true);
      return;
    }
    const rt = this.helperReturnType(this.currentFn);
    const expr = this.emitValueExpr(val, rt);
    this.emitLine("return " + expr);
  };
  emitSpriteArrayReturn (node) {
    this.emitLine("def list:[SpriteDefNative]");
    if ( node.nodeType != "ArrayExpression" ) {
      this.emitLine("return list");
      return;
    }
    let i = 0;
    while (i < (node.children.length)) {
      const elem = node.children[i];
      this.emitSpriteFromObject(elem, "d" + ("" + i));
      i = i + 1;
    };
    this.emitLine("return list");
  };
  emitResourceArrayReturn (node) {
    this.emitLine("def list:[ResourceDefNative]");
    if ( node.nodeType != "ArrayExpression" ) {
      this.emitLine("return list");
      return;
    }
    let i = 0;
    while (i < (node.children.length)) {
      const elem = node.children[i];
      this.emitResourceFromObject(elem, "r" + ("" + i));
      i = i + 1;
    };
    this.emitLine("return list");
  };
  emitResourceFromObject (node, varName) {
    if ( node.nodeType != "ObjectExpression" ) {
      return;
    }
    this.emitLine(("def " + varName) + ":ResourceDefNative (new ResourceDefNative)");
    let i = 0;
    while (i < (node.children.length)) {
      const prop = node.children[i];
      if ( prop.nodeType != "Property" ) {
        i = i + 1;
        continue;
      }
      const key = this.propKey(prop);
      const expected = this.fieldType(key);
      const val = this.emitPropertyValue(prop, expected);
      this.emitLine((varName + ".") + (key + (" = " + val)));
      i = i + 1;
    };
    this.emitLine("push list " + varName);
  };
  emitSpriteFromObject (node, varName) {
    if ( node.nodeType != "ObjectExpression" ) {
      return;
    }
    this.emitLine(("def " + varName) + ":SpriteDefNative (new SpriteDefNative)");
    let i = 0;
    while (i < (node.children.length)) {
      const prop = node.children[i];
      if ( prop.nodeType != "Property" ) {
        i = i + 1;
        continue;
      }
      const key = this.propKey(prop);
      const expected = this.fieldType(key);
      const val = this.emitPropertyValue(prop, expected);
      this.emitLine((varName + ".") + (key + (" = " + val)));
      i = i + 1;
    };
    this.emitLine("push list " + varName);
  };
  emitStateReturn (node, patch) {
    let target = "s";
    if ( patch ) {
      target = "patch";
    }
    if ( node.nodeType != "ObjectExpression" ) {
      if ( node.nodeType == "CallExpression" ) {
        if ( typeof(node.left) != "undefined" ) {
          const callee = node.left;
          if ( callee.nodeType == "Identifier" ) {
            if ( callee.name == "initState" ) {
              const callExpr = this.emitCall(node);
              this.emitLine("return " + callExpr);
              return;
            }
            if ( this.isKnownHelper(callee.name) ) {
              const callExpr_1 = this.emitCall(node);
              this.emitLine("return " + callExpr_1);
              return;
            }
          }
        }
      }
      if ( node.nodeType == "Identifier" ) {
        this.emitLine("return " + node.name);
        return;
      }
      this.emitLine(("def " + target) + ":NativeGameState (new NativeGameState)");
      this.emitLine("return " + target);
      return;
    }
    this.emitLine(("def " + target) + ":NativeGameState (new NativeGameState)");
    let i = 0;
    while (i < (node.children.length)) {
      const prop = node.children[i];
      if ( prop.nodeType != "Property" ) {
        i = i + 1;
        continue;
      }
      const key = this.propKey(prop);
      const valNode = this.propertyValueNode(prop);
      if ( key == "entities" ) {
        if ( valNode.nodeType == "ObjectExpression" ) {
          this.emitEntitiesMap(valNode, target);
        } else {
          const ev = this.emitExpr(valNode, "int");
          this.emitLine((target + ".entities = ") + ev);
        }
      } else {
        if ( key == "events" ) {
          this.emitEventsArray(valNode, target);
        } else {
          if ( this.isNativeStateField(key) ) {
            const expected = this.fieldType(key);
            const val = this.emitExpr(valNode, expected);
            this.emitLine((target + ".") + (key + (" = " + val)));
            if ( key == "vx" ) {
              this.emitLine(target + ".hasVx = true");
            }
            if ( key == "vy" ) {
              this.emitLine(target + ".hasVy = true");
            }
            if ( key == "dt" ) {
              this.emitLine(target + ".hasDt = true");
            }
          } else {
            if ( this.isStateArrayField(key) ) {
              const at = this.stateArrayType(key);
              const aval = this.emitExpr(valNode, at);
              this.emitLine(((("set " + target) + ".intArrays \"") + key) + ("\" " + aval));
            } else {
              const vt = this.exprType(valNode);
              if ( vt == "string" ) {
                const sval = this.emitExpr(valNode, "string");
                this.emitLine(((("set " + target) + ".strings \"") + key) + ("\" " + sval));
              } else {
                const dval = this.emitExpr(valNode, "double");
                this.emitLine(((("set " + target) + ".numbers \"") + key) + ("\" " + dval));
              }
            }
          }
        }
      }
      i = i + 1;
    };
    this.emitLine("return " + target);
  };
  emitEventsArray (node, target) {
    this.emitLine(("def " + target) + "_events:[GameEventNative]");
    if ( node.nodeType == "ArrayExpression" ) {
      let i = 0;
      while (i < (node.children.length)) {
        const elem = node.children[i];
        this.emitEventFromObject(elem, target + ("_ev" + ("" + i)));
        i = i + 1;
      };
    }
    this.emitLine(((target + ".events = ") + target) + "_events");
  };
  emitEventFromObject (node, varName) {
    if ( node.nodeType != "ObjectExpression" ) {
      return;
    }
    this.emitLine(("def " + varName) + ":GameEventNative (new GameEventNative)");
    let i = 0;
    while (i < (node.children.length)) {
      const prop = node.children[i];
      if ( prop.nodeType == "Property" ) {
        const key = this.propKey(prop);
        const expected = this.fieldType(key);
        const val = this.emitPropertyValue(prop, expected);
        this.emitLine((varName + ".") + (key + (" = " + val)));
      }
      i = i + 1;
    };
    const listName = this.eventListNameFor(varName);
    this.emitLine(("push " + listName) + (" " + varName));
  };
  eventListNameFor (varName) {
    const idx = varName.indexOf("_ev");
    if ( idx < 0 ) {
      return "events";
    }
    const prefix = varName.substring(0, idx );
    return prefix + "_events";
  };
  emitEntitiesMap (node, target) {
    if ( node.nodeType != "ObjectExpression" ) {
      return;
    }
    let i = 0;
    while (i < (node.children.length)) {
      const prop = node.children[i];
      if ( prop.nodeType != "Property" ) {
        i = i + 1;
        continue;
      }
      const id = this.propKey(prop);
      const valNode = this.propertyValueNode(prop);
      const poseName = "pose_" + id;
      this.emitLine(("def " + poseName) + ":EntityPoseNative (new EntityPoseNative)");
      if ( valNode.nodeType == "ObjectExpression" ) {
        let j = 0;
        while (j < (valNode.children.length)) {
          const p2 = valNode.children[j];
          if ( p2.nodeType == "Property" ) {
            const k = this.propKey(p2);
            const expected = this.fieldType(k);
            const v = this.emitPropertyValue(p2, expected);
            this.emitLine((poseName + ".") + (k + (" = " + v)));
          }
          j = j + 1;
        };
      }
      this.emitLine((("set " + target) + (".entities \"" + id)) + ("\" " + poseName));
      i = i + 1;
    };
  };
  propertyValueNode (prop) {
    if ( typeof(prop.left) != "undefined" ) {
      return prop.left;
    }
    const empty = new TSNode();
    return empty;
  };
  emitPropertyValue (prop, expected) {
    if ( typeof(prop.left) != "undefined" ) {
      return this.emitValueExpr((prop.left), expected);
    }
    return "0";
  };
  propKey (prop) {
    if ( (prop.name.length) > 0 ) {
      return prop.name;
    }
    if ( prop.computed ) {
      return "";
    }
    if ( typeof(prop.left) != "undefined" ) {
      const left = prop.left;
      if ( left.nodeType == "Identifier" ) {
        return left.name;
      }
    }
    return "";
  };
  emitExpr (node, expected) {
    const t = node.nodeType;
    if ( t == "NumericLiteral" ) {
      return this.emitNumber(node.value, expected);
    }
    if ( t == "BooleanLiteral" ) {
      return node.value;
    }
    if ( t == "StringLiteral" ) {
      return ("\"" + node.value) + "\"";
    }
    if ( t == "Identifier" ) {
      const ca = ( this.constArrayNames.hasOwnProperty(node.name) ? this.constArrayNames[node.name] : undefined );
      if ( (typeof(ca) !== "undefined" && ca != null )  ) {
        if ( this.inModuleSingletonCtor ) {
          return node.name;
        }
        if ( (this.moduleSingletonClass.length) > 0 ) {
          return this.moduleConstAccess(node.name);
        }
        return ("(this." + node.name) + "())";
      }
      const cst = ( this.constScalarTypes.hasOwnProperty(node.name) ? this.constScalarTypes[node.name] : undefined );
      if ( (typeof(cst) !== "undefined" && cst != null )  ) {
        if ( this.inModuleSingletonCtor ) {
          return node.name;
        }
        if ( (this.moduleSingletonClass.length) > 0 ) {
          return this.moduleConstAccess(node.name);
        }
        return "this." + node.name;
      }
      if ( this.isEngineGlobal(node.name) ) {
        if ( expected == "double" ) {
          return ("(to_double host." + node.name) + ")";
        }
        return "host." + node.name;
      }
      if ( expected == "double" ) {
        const vt = this.lookupVarType(node.name);
        if ( vt == "int" ) {
          return ("(to_double " + node.name) + ")";
        }
      }
      return node.name;
    }
    if ( t == "CallExpression" ) {
      return this.emitCall(node);
    }
    if ( t == "MemberExpression" ) {
      return this.emitMember(node, expected);
    }
    if ( t == "BinaryExpression" ) {
      return this.emitBinary(node, expected);
    }
    if ( t == "UnaryExpression" ) {
      return this.emitUnary(node, expected);
    }
    if ( t == "ObjectExpression" ) {
      return "{}";
    }
    if ( t == "ArrayExpression" ) {
      return "[]";
    }
    return "0";
  };
  emitCall (node) {
    if ( typeof(node.left) === "undefined" ) {
      return "0";
    }
    const callee = node.left;
    if ( callee.nodeType == "Identifier" ) {
      const name = callee.name;
      if ( this.isBridgeHelper(name) ) {
        return this.emitBridgeHelperValue(name, node);
      }
      let receiver = "this.";
      if ( this.isEngineFn(name) ) {
        receiver = "host.";
      }
      let args = [];
      let i = 0;
      while (i < (node.children.length)) {
        const arg = node.children[i];
        let pexp = this.helperParamType(name, i);
        if ( (pexp.length) == 0 ) {
          pexp = this.exprType(arg);
        }
        const at = this.exprType(arg);
        let emitAs = at;
        if ( (emitAs.length) == 0 ) {
          emitAs = "int";
        }
        let argExpr = this.emitExpr(arg, emitAs);
        if ( pexp == "int" ) {
          if ( at == "double" ) {
            argExpr = ("(to_int " + argExpr) + ")";
          }
        }
        if ( pexp == "double" ) {
          if ( emitAs == "int" ) {
            argExpr = ("(to_double " + argExpr) + ")";
          }
        }
        if ( pexp == "boolean" ) {
          if ( at == "int" ) {
            argExpr = ("(" + argExpr) + " != 0)";
          }
        }
        args.push(argExpr);
        i = i + 1;
      };
      const inner = ((receiver + name) + "(") + (this.joinSpace(args) + ")");
      return ("(" + inner) + ")";
    }
    if ( callee.nodeType == "MemberExpression" ) {
      if ( callee.name == "substring" ) {
        if ( typeof(callee.left) != "undefined" ) {
          const recv = callee.left;
          const recvT = this.exprType(recv);
          const recvExpr = this.emitExpr(recv, recvT);
          let a0 = "0";
          let a1 = "0";
          if ( (node.children.length) > 0 ) {
            const n0 = node.children[0];
            a0 = this.emitExpr(n0, "int");
          }
          if ( (node.children.length) > 1 ) {
            const n1 = node.children[1];
            a1 = this.emitExpr(n1, "int");
          }
          return (((("(substring " + recvExpr) + " ") + a0) + " ") + a1;
        }
      }
    }
    return "0";
  };
  emitNumber (raw, expected) {
    const hasDot = this.containsChar(raw, 46);
    if ( expected == "double" ) {
      if ( hasDot == false ) {
        return raw + ".0";
      }
      return raw;
    }
    return raw;
  };
  emitMember (node, expected) {
    if ( typeof(node.left) === "undefined" ) {
      return "";
    }
    const leftNode = node.left;
    if ( node.computed ) {
      if ( typeof(node.right) != "undefined" ) {
        const idxNode = node.right;
        const baseType = this.exprType(leftNode);
        const base = this.emitExpr(leftNode, "int");
        const idxT = this.exprType(idxNode);
        let idx = this.emitExpr(idxNode, idxT);
        if ( idxT == "double" ) {
          idx = ("(to_int " + idx) + ")";
        }
        const elemT = this.elemTypeOf(baseType);
        const access = ((("(itemAt " + base) + " ") + idx) + ")";
        if ( expected == "double" ) {
          if ( elemT == "int" ) {
            return ("(to_double " + access) + ")";
          }
        }
        return access;
      }
    }
    if ( node.name == "length" ) {
      const base_1 = this.emitExpr(leftNode, "int");
      return ("(array_length " + base_1) + ")";
    }
    const pIdx = this.inputPlayerIndex(node);
    if ( (pIdx.length) > 0 ) {
      const localName = ("in_pl" + pIdx) + ".";
      return localName + node.name;
    }
    if ( leftNode.nodeType == "MemberExpression" ) {
      if ( leftNode.name == "entities" ) {
        return "in_" + node.name;
      }
    }
    if ( leftNode.nodeType == "Identifier" ) {
      if ( leftNode.name == this.stateVarName ) {
        if ( this.isStateArrayField(node.name) ) {
          return ((("(unwrap (get " + this.stateVarName) + ".intArrays \"") + node.name) + "\"))";
        }
        if ( this.isNativeStateField(node.name) == false ) {
          if ( (node.name.length) > 0 ) {
            return ((("(unwrap (get " + this.stateVarName) + ".numbers \"") + node.name) + "\"))";
          }
        }
      }
    }
    const base_2 = this.emitExpr(leftNode, "int");
    const prop = node.name;
    if ( (prop.length) == 0 ) {
      return base_2;
    }
    if ( base_2 == "props" ) {
      return "props." + prop;
    }
    const result = (base_2 + ".") + prop;
    if ( expected == "double" ) {
      const baseT = this.exprType(leftNode);
      const sf = this.structFieldType(baseT, prop);
      if ( sf == "int" ) {
        return ("(to_double " + result) + ")";
      }
    }
    return result;
  };
  endsWith (s, suffix) {
    const slen = s.length;
    const xlen = suffix.length;
    if ( xlen > slen ) {
      return false;
    }
    const start = slen - xlen;
    const tail = s.substring(start, slen );
    return tail == suffix;
  };
  emitBinary (node, expected) {
    let op = node.value;
    if ( op == "===" ) {
      op = "==";
    }
    if ( op == "!==" ) {
      op = "!=";
    }
    let operandExpected = expected;
    if ( this.isComparisonOp(op) || this.isArithmeticOp(op) ) {
      operandExpected = this.numericCommon(node);
    }
    const left = this.emitExpr((node.left), operandExpected);
    const right = this.emitExpr((node.right), operandExpected);
    const result = (("(" + left) + (" " + op)) + ((" " + right) + ")");
    if ( (expected == "int") && (op == "/") ) {
      return ("(to_int " + result) + ")";
    }
    if ( expected == "double" ) {
      const nc = this.numericCommon(node);
      if ( nc == "int" ) {
        return ("(to_double " + result) + ")";
      }
    }
    return result;
  };
  isArithmeticOp (op) {
    if ( op == "+" ) {
      return true;
    }
    if ( op == "-" ) {
      return true;
    }
    if ( op == "*" ) {
      return true;
    }
    if ( op == "/" ) {
      return true;
    }
    if ( op == "%" ) {
      return true;
    }
    return false;
  };
  emitUnary (node, expected) {
    const op = node.value;
    if ( typeof(node.left) === "undefined" ) {
      return op;
    }
    const argType = this.exprType((node.left));
    if ( op == "-" ) {
      let useDouble = argType == "double";
      if ( expected == "double" ) {
        useDouble = true;
      }
      if ( useDouble ) {
        const arg = this.emitExpr((node.left), "double");
        return ("(0.0 - " + arg) + ")";
      }
      const arg2 = this.emitExpr((node.left), "int");
      return ("(0 - " + arg2) + ")";
    }
    if ( op == "!" ) {
      const argB = this.emitExpr((node.left), "boolean");
      return ("(false == " + argB) + ")";
    }
    const argD = this.emitExpr((node.left), argType);
    return op + argD;
  };
  containsChar (s, ch) {
    let i = 0;
    while (i < (s.length)) {
      const c = s.charCodeAt(i );
      if ( c == ch ) {
        return true;
      }
      i = i + 1;
    };
    return false;
  };
  foldDigitChar (d) {
    if ( d == 0 ) {
      return "0";
    }
    if ( d == 1 ) {
      return "1";
    }
    if ( d == 2 ) {
      return "2";
    }
    if ( d == 3 ) {
      return "3";
    }
    if ( d == 4 ) {
      return "4";
    }
    if ( d == 5 ) {
      return "5";
    }
    if ( d == 6 ) {
      return "6";
    }
    if ( d == 7 ) {
      return "7";
    }
    if ( d == 8 ) {
      return "8";
    }
    return "9";
  };
  parseIntStr (s) {
    let out = 0;
    let i = 0;
    let neg = false;
    if ( (s.length) > 0 ) {
      const c0 = s.charCodeAt(0 );
      if ( c0 == 45 ) {
        neg = true;
        i = 1;
      }
    }
    while (i < (s.length)) {
      const ch = s.charCodeAt(i );
      out = (out * 10) + (ch - 48);
      i = i + 1;
    };
    if ( neg ) {
      return 0 - out;
    }
    return out;
  };
  divInt (a, b) {
    if ( b == 0 ) {
      return 0;
    }
    let count = 0;
    let rem = a;
    if ( rem < 0 ) {
      rem = 0 - rem;
    }
    let absB = b;
    if ( b < 0 ) {
      absB = 0 - b;
    }
    while (rem >= absB) {
      rem = rem - absB;
      count = count + 1;
    };
    if ( ((a < 0) && (b > 0)) || ((a > 0) && (b < 0)) ) {
      return 0 - count;
    }
    return count;
  };
  formatIntStr (n) {
    if ( n == 0 ) {
      return "0";
    }
    let neg = false;
    let v = n;
    if ( n < 0 ) {
      neg = true;
      v = 0 - n;
    }
    let digits = [];
    while (v > 0) {
      const digit = v % 10;
      digits.push(this.foldDigitChar(digit));
      v = this.divInt((v - digit), 10);
    };
    let out = "";
    const cnt = digits.length;
    let i = cnt - 1;
    while (i >= 0) {
      out = out + (digits[i]);
      i = i - 1;
    };
    if ( neg ) {
      return "-" + out;
    }
    return out;
  };
}
class TSEmitterMain  {
  constructor() {
  }
}
TSEmitterMain.lastSlash = function(path) {
  let best = -1;
  let i = 0;
  while (i < (path.length)) {
    const ch = path.substring(i, (i + 1) );
    if ( ch == "/" ) {
      best = i;
    }
    i = i + 1;
  };
  return best;
};
TSEmitterMain.lastDot = function(name) {
  let best = -1;
  let i = 0;
  while (i < (name.length)) {
    const ch = name.substring(i, (i + 1) );
    if ( ch == "." ) {
      best = i;
    }
    i = i + 1;
  };
  return best;
};
TSEmitterMain.moduleIdFromPath = function(path, stem) {
  const base = TSEmitterMain.stripGameSuffix(stem);
  if ( (base != "index") && (base != "game") ) {
    return base;
  }
  const slash = TSEmitterMain.lastSlash(path);
  if ( slash < 0 ) {
    return base;
  }
  const parent = path.substring(0, slash );
  const slash2 = TSEmitterMain.lastSlash(parent);
  if ( slash2 < 0 ) {
    return base;
  }
  return parent.substring((slash2 + 1), (parent.length) );
};
TSEmitterMain.stripGameSuffix = function(stem) {
  const n = stem.length;
  if ( n <= 5 ) {
    return stem;
  }
  const tail = stem.substring((n - 5), n );
  if ( tail == ".game" ) {
    return stem.substring(0, (n - 5) );
  }
  return stem;
};
/* static JavaSript main routine at the end of the JS file */
function __js_main() {
  let inputFile = "";
  let outputFile = "";
  let toStdout = false;
  const argCnt = (process.argv.length - 2);
  let i = 0;
  while (i < argCnt) {
    const arg = process.argv[ 2 + i];
    if ( arg == "-i" ) {
      i = i + 1;
      if ( i < argCnt ) {
        inputFile = process.argv[ 2 + i];
      }
    } else {
      if ( arg == "-o" ) {
        i = i + 1;
        if ( i < argCnt ) {
          outputFile = process.argv[ 2 + i];
        }
      } else {
        if ( arg == "--stdout" ) {
          toStdout = true;
        }
      }
    }
    i = i + 1;
  };
  if ( (inputFile.length) == 0 ) {
    console.log("Usage: ts_emitter_main -i <file.game.tsx> [-o out.rgr] [--stdout]");
    return;
  }
  const slash = TSEmitterMain.lastSlash(inputFile);
  const dir = inputFile.substring(0, slash );
  const base = inputFile.substring((slash + 1), (inputFile.length) );
  const dot = TSEmitterMain.lastDot(base);
  let stem = base;
  if ( dot > 0 ) {
    stem = base.substring(0, dot );
  }
  const src = require('fs').readFileSync(dir + '/' + base, 'utf8');
  const moduleId = TSEmitterMain.moduleIdFromPath(inputFile, stem);
  const lexer = new TSLexer(src);
  const tokens = lexer.tokenize();
  const parser = new TSParserSimple();
  parser.initParser(tokens);
  parser.tsxMode = true;
  const ast = parser.parseProgram();
  const emitter = new TSEmitter();
  emitter.setModuleSingletonId(moduleId);
  const code = emitter.emitProgram(ast);
  if ( toStdout ) {
    console.log(code);
    return;
  }
  if ( (outputFile.length) == 0 ) {
    outputFile = stem + "_generated.rgr";
  }
  const outDir = "gallery/ts_to_ranger/generated";
  require('fs').writeFileSync(outDir + '/' + outputFile, Buffer.from((function(s){ var b = new ArrayBuffer(s.length); var v = new Uint8Array(b); for(var i=0;i<s.length;i++)v[i]=s.charCodeAt(i); b._view = new DataView(b); return b; })(code)));
  console.log("Wrote gallery/ts_to_ranger/generated/" + outputFile);
}
__js_main();
