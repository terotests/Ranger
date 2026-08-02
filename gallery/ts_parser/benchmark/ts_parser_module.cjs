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
    this.prevType = "";
    this.prevValue = "";
    this.prevLine = 0;
    this.braceKinds = "";
    this.lastCloseKind = "o";
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
  readHtmlComment () {
    const startPos = this.pos;
    const startLine = this.line;
    const startCol = this.col;
    let value = "";
    while (this.pos < this.__len) {
      const ch = this.peek();
      if ( ch == "\n" ) {
        break;
      }
      if ( ch == "\r\n" ) {
        break;
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
      if ( ch == "\n" ) {
        return this.makeToken("Invalid", value, startPos, startLine, startCol);
      }
      if ( ch == "\r" ) {
        return this.makeToken("Invalid", value, startPos, startLine, startCol);
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
              if ( esc == "b" ) {
                value = value + (String.fromCharCode(8));
              } else {
                if ( esc == "f" ) {
                  value = value + (String.fromCharCode(12));
                } else {
                  if ( esc == "v" ) {
                    value = value + (String.fromCharCode(11));
                  } else {
                    if ( esc == "0" ) {
                      const afterZero = this.peek();
                      if ( this.isDigit(afterZero) ) {
                        value = value + esc;
                      } else {
                        value = value + (String.fromCharCode(0));
                      }
                    } else {
                      if ( esc == "x" ) {
                        const h1 = this.peek();
                        const hv1 = this.hexValue(h1);
                        const h2 = this.peekAt(1);
                        const hv2 = this.hexValue(h2);
                        if ( (hv1 < 0) || (hv2 < 0) ) {
                          return this.makeToken("Invalid", value, startPos, startLine, startCol);
                        }
                        this.advance();
                        this.advance();
                        value = value + (String.fromCharCode(((hv1 * 16) + hv2)));
                      } else {
                        if ( esc == "u" ) {
                          const uEsc = this.readUnicodeEscapeBody();
                          if ( (uEsc.length) == 0 ) {
                            return this.makeToken("Invalid", value, startPos, startLine, startCol);
                          }
                          value = value + uEsc;
                        } else {
                          if ( esc == "\\" ) {
                            value = value + "\\";
                          } else {
                            if ( esc == "\r" ) {
                              if ( this.peek() == "\n" ) {
                                this.advance();
                              }
                            }
                            if ( (esc == "\n") || (esc == "\r") ) {
                            } else {
                              value = value + esc;
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
        }
      } else {
        value = value + this.advance();
      }
    };
    return this.makeToken("Invalid", value, startPos, startLine, startCol);
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
  digitVal (ch) {
    if ( (ch.length) == 0 ) {
      return 0 - 1;
    }
    const code = ch.charCodeAt(0 );
    if ( code >= 48 ) {
      if ( code <= 57 ) {
        return code - 48;
      }
    }
    if ( code >= 97 ) {
      if ( code <= 102 ) {
        return (code - 97) + 10;
      }
    }
    if ( code >= 65 ) {
      if ( code <= 70 ) {
        return (code - 65) + 10;
      }
    }
    return 0 - 1;
  };
  readRadix (radix, startPos, startLine, startCol) {
    this.advance();
    this.advance();
    let acc = 0;
    let looping = true;
    while ((this.pos < this.__len) && looping) {
      const ch = this.peek();
      if ( ch == "_" ) {
        this.advance();
      } else {
        const d = this.digitVal(ch);
        if ( d >= 0 ) {
          if ( d < radix ) {
            acc = (acc * radix) + d;
            this.advance();
          } else {
            looping = false;
          }
        } else {
          looping = false;
        }
      }
    };
    const digitsRead = this.pos > (startPos + 2);
    const tail = this.peek();
    let runsOn = false;
    if ( this.isAlphaNumCh(tail) ) {
      runsOn = true;
    }
    if ( (digitsRead == false) || runsOn ) {
      while (this.pos < this.__len) {
        const tch = this.peek();
        if ( this.isAlphaNumCh(tch) ) {
          this.advance();
        } else {
          break;
        }
      };
      return this.makeToken("Invalid", (this.source.substring(startPos, this.pos )), startPos, startLine, startCol);
    }
    return this.makeToken("Number", ((acc.toString())), startPos, startLine, startCol);
  };
  readNumber () {
    const startPos = this.pos;
    const startLine = this.line;
    const startCol = this.col;
    let value = "";
    if ( this.peek() == "0" ) {
      const p1 = this.peekAt(1);
      if ( (p1 == "x") || (p1 == "X") ) {
        return this.readRadix(16, startPos, startLine, startCol);
      }
      if ( (p1 == "b") || (p1 == "B") ) {
        return this.readRadix(2, startPos, startLine, startCol);
      }
      if ( (p1 == "o") || (p1 == "O") ) {
        return this.readRadix(8, startPos, startLine, startCol);
      }
    }
    let sawDot = false;
    let legacyOctal = false;
    if ( this.peek() == "0" ) {
      const secondCh = this.peekAt(1);
      if ( this.isDigit(secondCh) ) {
        legacyOctal = true;
      }
    }
    let scanning = true;
    while ((this.pos < this.__len) && scanning) {
      const ch = this.peek();
      if ( this.isDigit(ch) ) {
        value = value + this.advance();
      } else {
        if ( ch == "_" ) {
          this.advance();
        } else {
          if ( ((ch == ".") && (sawDot == false)) && (legacyOctal == false) ) {
            sawDot = true;
            value = value + this.advance();
          } else {
            if ( ch == "n" ) {
              value = value + this.advance();
              return this.makeToken("BigInt", value, startPos, startLine, startCol);
            }
            if ( (ch == "e") || (ch == "E") ) {
              const afterE = this.peekAt(1);
              let expDigit = afterE;
              let signLen = 0;
              if ( (afterE == "+") || (afterE == "-") ) {
                expDigit = this.peekAt(2);
                signLen = 1;
              }
              if ( this.isDigit(expDigit) ) {
                value = value + this.advance();
                if ( signLen > 0 ) {
                  value = value + this.advance();
                }
                while (this.pos < this.__len) {
                  const ech = this.peek();
                  if ( this.isDigit(ech) ) {
                    value = value + this.advance();
                  } else {
                    break;
                  }
                };
              }
            }
            scanning = false;
          }
        }
      }
    };
    const numTail = this.peek();
    if ( this.isAlphaNumCh(numTail) ) {
      while (this.pos < this.__len) {
        const tch = this.peek();
        if ( this.isAlphaNumCh(tch) ) {
          this.advance();
        } else {
          break;
        }
      };
      return this.makeToken("Invalid", (this.source.substring(startPos, this.pos )), startPos, startLine, startCol);
    }
    return this.makeToken("Number", value, startPos, startLine, startCol);
  };
  hexValue (ch) {
    if ( (ch.length) == 0 ) {
      return -1;
    }
    const code = ch.charCodeAt(0 );
    if ( code >= 48 ) {
      if ( code <= 57 ) {
        return code - 48;
      }
    }
    if ( code >= 97 ) {
      if ( code <= 102 ) {
        return (code - 97) + 10;
      }
    }
    if ( code >= 65 ) {
      if ( code <= 70 ) {
        return (code - 65) + 10;
      }
    }
    return -1;
  };
  readUnicodeEscape () {
    const savedPos = this.pos;
    const savedLine = this.line;
    const savedCol = this.col;
    if ( this.peek() != "\\" ) {
      return "";
    }
    this.advance();
    if ( this.peek() != "u" ) {
      this.pos = savedPos;
      this.line = savedLine;
      this.col = savedCol;
      return "";
    }
    this.advance();
    const decoded = this.readUnicodeEscapeBody();
    if ( (decoded.length) == 0 ) {
      this.pos = savedPos;
      this.line = savedLine;
      this.col = savedCol;
      return "";
    }
    return decoded;
  };
  readUnicodeEscapeBody () {
    let code = 0;
    if ( this.peek() == "{" ) {
      this.advance();
      let any = false;
      while (this.pos < this.__len) {
        const ch = this.peek();
        if ( ch == "}" ) {
          break;
        }
        const hv = this.hexValue(ch);
        if ( hv < 0 ) {
          return "";
        }
        code = (code * 16) + hv;
        any = true;
        this.advance();
      };
      if ( any == false ) {
        return "";
      }
      if ( this.peek() != "}" ) {
        return "";
      }
      this.advance();
    } else {
      let i = 0;
      while (i < 4) {
        const hch = this.peek();
        const hv_1 = this.hexValue(hch);
        if ( hv_1 < 0 ) {
          return "";
        }
        code = (code * 16) + hv_1;
        this.advance();
        i = i + 1;
      };
    }
    return String.fromCharCode(code);
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
        if ( ch == "\\" ) {
          const esc = this.readUnicodeEscape();
          if ( (esc.length) == 0 ) {
            if ( (value.length) == 0 ) {
              this.advance();
              return this.makeToken("Punctuator", "\\", startPos, startLine, startCol);
            }
            return this.makeToken(this.identType(value), value, startPos, startLine, startCol);
          }
          value = value + esc;
        } else {
          return this.makeToken(this.identType(value), value, startPos, startLine, startCol);
        }
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
      if ( this.regexAllowed() ) {
        const re = this.readRegex();
        if ( re.tokenType == "Regex" ) {
          return re;
        }
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
                if ( this.prevType != "Keyword" ) {
                  wordApostrophe = true;
                }
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
    if ( ch == "<" ) {
      if ( this.peekAt(1) == "!" ) {
        if ( this.peekAt(2) == "-" ) {
          if ( this.peekAt(3) == "-" ) {
            return this.readHtmlComment();
          }
        }
      }
    }
    if ( ch == "-" ) {
      if ( this.peekAt(1) == "-" ) {
        if ( this.peekAt(2) == ">" ) {
          if ( (this.prevType == "") || (this.line > this.prevLine) ) {
            return this.readHtmlComment();
          }
        }
      }
    }
    if ( ch == "`" ) {
      return this.readTemplateLiteral();
    }
    if ( this.isDigit(ch) ) {
      return this.readNumber();
    }
    if ( ch == "." ) {
      const afterDot = this.peekAt(1);
      if ( this.isDigit(afterDot) ) {
        return this.readNumber();
      }
    }
    if ( this.isAlpha(ch) ) {
      return this.readIdentifier();
    }
    if ( ch == "\\" ) {
      if ( this.peekAt(1) == "u" ) {
        return this.readIdentifier();
      }
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
      if ( next_1 == "<" ) {
        if ( this.peekAt(2) == "=" ) {
          this.advance();
          this.advance();
          this.advance();
          return this.makeToken("Punctuator", "<<=", startPos, startLine, startCol);
        }
      }
      if ( next_1 == "=" ) {
        this.advance();
        this.advance();
        return this.makeToken("Punctuator", "<=", startPos, startLine, startCol);
      }
    }
    if ( ch == ">" ) {
      if ( next_1 == ">" ) {
        if ( this.peekAt(2) == "=" ) {
          this.advance();
          this.advance();
          this.advance();
          return this.makeToken("Punctuator", ">>=", startPos, startLine, startCol);
        }
        if ( this.peekAt(2) == ">" ) {
          if ( this.peekAt(3) == "=" ) {
            this.advance();
            this.advance();
            this.advance();
            this.advance();
            return this.makeToken("Punctuator", ">>>=", startPos, startLine, startCol);
          }
        }
      }
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
      if ( next_1 == "=" ) {
        this.advance();
        this.advance();
        return this.makeToken("Punctuator", "&=", startPos, startLine, startCol);
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
      if ( next_1 == "=" ) {
        this.advance();
        this.advance();
        return this.makeToken("Punctuator", "|=", startPos, startLine, startCol);
      }
    }
    if ( ch == "^" ) {
      if ( next_1 == "=" ) {
        this.advance();
        this.advance();
        return this.makeToken("Punctuator", "^=", startPos, startLine, startCol);
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
        if ( this.peekAt(2) == "=" ) {
          this.advance();
          this.advance();
          this.advance();
          return this.makeToken("Punctuator", "**=", startPos, startLine, startCol);
        }
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
      if ( (tok.tokenType != "LineComment") && (tok.tokenType != "BlockComment") ) {
        if ( tok.tokenType == "Punctuator" ) {
          if ( tok.value == "{" ) {
            this.braceKinds = this.braceKinds + this.braceKindHere();
          }
          if ( tok.value == "}" ) {
            const depth = this.braceKinds.length;
            if ( depth > 0 ) {
              this.lastCloseKind = this.braceKinds.substring((depth - 1), depth );
              this.braceKinds = this.braceKinds.substring(0, (depth - 1) );
            } else {
              this.lastCloseKind = "o";
            }
          }
        }
        this.prevType = tok.tokenType;
        this.prevValue = tok.value;
        this.prevLine = tok.line;
      }
      if ( tok.tokenType == "EOF" ) {
        return tokens;
      }
    };
    return tokens;
  };
  braceKindHere () {
    if ( this.prevType == "" ) {
      return "b";
    }
    if ( this.prevType == "Punctuator" ) {
      if ( this.prevValue == ")" ) {
        return "b";
      }
      if ( this.prevValue == ";" ) {
        return "b";
      }
      if ( this.prevValue == "{" ) {
        return "b";
      }
      if ( this.prevValue == "}" ) {
        return "b";
      }
      if ( this.prevValue == "=>" ) {
        return "b";
      }
      return "o";
    }
    if ( this.prevType == "Keyword" ) {
      if ( this.prevValue == "else" ) {
        return "b";
      }
      if ( this.prevValue == "do" ) {
        return "b";
      }
      if ( this.prevValue == "try" ) {
        return "b";
      }
      if ( this.prevValue == "finally" ) {
        return "b";
      }
      return "o";
    }
    return "o";
  };
  regexAllowed () {
    if ( this.prevType == "" ) {
      return true;
    }
    if ( this.prevType == "Number" ) {
      return false;
    }
    if ( this.prevType == "BigInt" ) {
      return false;
    }
    if ( this.prevType == "String" ) {
      return false;
    }
    if ( this.prevType == "Template" ) {
      return false;
    }
    if ( this.prevType == "Regex" ) {
      return false;
    }
    if ( this.prevType == "Identifier" ) {
      return false;
    }
    if ( this.prevType == "TSType" ) {
      return false;
    }
    if ( this.prevType == "Keyword" ) {
      if ( this.prevValue == "this" ) {
        return false;
      }
      if ( this.prevValue == "super" ) {
        return false;
      }
      if ( this.prevValue == "true" ) {
        return false;
      }
      if ( this.prevValue == "false" ) {
        return false;
      }
      if ( this.prevValue == "null" ) {
        return false;
      }
      return true;
    }
    if ( this.prevType == "Punctuator" ) {
      if ( this.prevValue == ")" ) {
        return false;
      }
      if ( this.prevValue == "]" ) {
        return false;
      }
      if ( this.prevValue == "++" ) {
        return false;
      }
      if ( this.prevValue == "--" ) {
        return false;
      }
      if ( this.prevValue == "<" ) {
        return false;
      }
      if ( this.prevValue == "}" ) {
        if ( this.lastCloseKind == "b" ) {
          return true;
        }
        return false;
      }
      return true;
    }
    return true;
  };
  readRegex () {
    const startPos = this.pos;
    const startLine = this.line;
    const startCol = this.col;
    let value = this.advance();
    let inClass = false;
    let closed = false;
    while (this.pos < this.__len) {
      const ch = this.peek();
      if ( ch == "\n" ) {
        break;
      }
      if ( ch == "\\" ) {
        value = value + this.advance();
        if ( this.pos < this.__len ) {
          value = value + this.advance();
        }
      } else {
        if ( ch == "[" ) {
          inClass = true;
          value = value + this.advance();
        } else {
          if ( ch == "]" ) {
            inClass = false;
            value = value + this.advance();
          } else {
            if ( ch == "/" ) {
              if ( inClass ) {
                value = value + this.advance();
              } else {
                value = value + this.advance();
                closed = true;
                break;
              }
            } else {
              value = value + this.advance();
            }
          }
        }
      }
    };
    if ( closed == false ) {
      this.pos = startPos;
      this.line = startLine;
      this.col = startCol;
      return this.makeToken("", "", startPos, startLine, startCol);
    }
    while (this.pos < this.__len) {
      const fch = this.peek();
      if ( this.isAlphaNumCh(fch) ) {
        value = value + this.advance();
      } else {
        break;
      }
    };
    return this.makeToken("Regex", value, startPos, startLine, startCol);
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
    this.errorCount = 0;
    this.scopeNames = [];
    this.scopeStart = [];
    this.scopeIsFn = [];
    this.suppressBlockScope = false;
    this.speculating = 0;
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
  syntaxError (msg) {
    this.errorCount = this.errorCount + 1;
    if ( this.speculating > 0 ) {
      return;
    }
    if ( this.quiet == false ) {
      console.log(msg);
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
  listPrefix (list, n) {
    let out = [];
    let i = 0;
    while (i < n) {
      out.push(list[i]);
      i = i + 1;
    };
    return out;
  };
  intListPrefix (list, n) {
    let out = [];
    let i = 0;
    while (i < n) {
      out.push(list[i]);
      i = i + 1;
    };
    return out;
  };
  pushScope (isFunctionBoundary) {
    this.scopeStart.push(this.scopeNames.length);
    if ( isFunctionBoundary ) {
      this.scopeIsFn.push(1);
    } else {
      this.scopeIsFn.push(0);
    }
  };
  popScope () {
    const depth = this.scopeStart.length;
    if ( depth == 0 ) {
      return;
    }
    const start = this.scopeStart[(depth - 1)];
    this.scopeNames = this.listPrefix(this.scopeNames, start);
    this.scopeStart = this.intListPrefix(this.scopeStart, (depth - 1));
    this.scopeIsFn = this.intListPrefix(this.scopeIsFn, (depth - 1));
  };
  declareBinding (kind, name) {
    if ( (name.length) == 0 ) {
      return;
    }
    const depth = this.scopeStart.length;
    if ( depth == 0 ) {
      return;
    }
    const total = this.scopeNames.length;
    const scopeIdx = depth - 1;
    let limit = 0;
    if ( kind == "v" ) {
      let walk = scopeIdx;
      let keepWalking = true;
      while ((walk >= 0) && keepWalking) {
        if ( (this.scopeIsFn[walk]) == 1 ) {
          keepWalking = false;
        } else {
          walk = walk - 1;
        }
      };
      if ( walk < 0 ) {
        limit = 0;
      } else {
        limit = this.scopeStart[walk];
      }
    } else {
      limit = this.scopeStart[scopeIdx];
    }
    const ownStart = this.scopeStart[scopeIdx];
    let i = limit;
    while (i < total) {
      const entry = this.scopeNames[i];
      const sep = 1;
      const entryKind = entry.substring(0, 1 );
      const entryName = entry.substring(2, (entry.length) );
      if ( entryName == name ) {
        let clash = false;
        if ( kind == "l" ) {
          if ( i >= ownStart ) {
            clash = true;
          }
        }
        if ( kind == "v" ) {
          if ( entryKind == "l" ) {
            clash = true;
          }
        }
        if ( kind == "p" ) {
          if ( i >= ownStart ) {
            if ( entryKind == "p" ) {
              clash = true;
            }
          }
        }
        if ( clash ) {
          this.syntaxError(("Parse error: '" + name) + "' has already been declared");
          this.scopeNames.push((kind + "|") + name);
          return;
        }
      }
      i = i + 1;
    };
    this.scopeNames.push((kind + "|") + name);
  };
  declareBindingKind (declKind, declarator) {
    let k = "v";
    if ( declKind == "let" ) {
      k = "l";
    }
    if ( declKind == "const" ) {
      k = "l";
    }
    if ( (declarator.name.length) > 0 ) {
      this.declareBinding(k, declarator.name);
    }
  };
  declareParam (param) {
    if ( (param.name.length) == 0 ) {
      return;
    }
    this.declareBinding("q", param.name);
  };
  isAlwaysReservedWord (word) {
    if ( word == "break" ) {
      return true;
    }
    if ( word == "case" ) {
      return true;
    }
    if ( word == "catch" ) {
      return true;
    }
    if ( word == "class" ) {
      return true;
    }
    if ( word == "const" ) {
      return true;
    }
    if ( word == "continue" ) {
      return true;
    }
    if ( word == "debugger" ) {
      return true;
    }
    if ( word == "default" ) {
      return true;
    }
    if ( word == "delete" ) {
      return true;
    }
    if ( word == "do" ) {
      return true;
    }
    if ( word == "else" ) {
      return true;
    }
    if ( word == "enum" ) {
      return true;
    }
    if ( word == "export" ) {
      return true;
    }
    if ( word == "extends" ) {
      return true;
    }
    if ( word == "false" ) {
      return true;
    }
    if ( word == "finally" ) {
      return true;
    }
    if ( word == "for" ) {
      return true;
    }
    if ( word == "function" ) {
      return true;
    }
    if ( word == "if" ) {
      return true;
    }
    if ( word == "import" ) {
      return true;
    }
    if ( word == "in" ) {
      return true;
    }
    if ( word == "instanceof" ) {
      return true;
    }
    if ( word == "new" ) {
      return true;
    }
    if ( word == "null" ) {
      return true;
    }
    if ( word == "return" ) {
      return true;
    }
    if ( word == "super" ) {
      return true;
    }
    if ( word == "switch" ) {
      return true;
    }
    if ( word == "this" ) {
      return true;
    }
    if ( word == "throw" ) {
      return true;
    }
    if ( word == "true" ) {
      return true;
    }
    if ( word == "try" ) {
      return true;
    }
    if ( word == "typeof" ) {
      return true;
    }
    if ( word == "var" ) {
      return true;
    }
    if ( word == "void" ) {
      return true;
    }
    if ( word == "while" ) {
      return true;
    }
    if ( word == "with" ) {
      return true;
    }
    return false;
  };
  expectModuleExportName () {
    const tt = this.peekType();
    if ( ((((((tt == "Identifier") || (tt == "TSType")) || (tt == "Keyword")) || (tt == "TSKeyword")) || (tt == "Boolean")) || (tt == "Null")) || (tt == "String") ) {
      const tok = this.peek();
      this.advance();
      return tok;
    }
    return this.expect("Identifier");
  };
  expectBindingName () {
    const tt = this.peekType();
    if ( (((((tt == "Identifier") || (tt == "TSType")) || (tt == "Keyword")) || (tt == "TSKeyword")) || (tt == "Boolean")) || (tt == "Null") ) {
      const tok = this.peek();
      if ( this.isAlwaysReservedWord(tok.value) ) {
        this.syntaxError(("Parse error: '" + tok.value) + "' is a reserved word and cannot be used as a name");
      }
      this.advance();
      return tok;
    }
    return this.expect("Identifier");
  };
  expect (expectedType) {
    const tok = this.peek();
    if ( tok.tokenType != expectedType ) {
      this.syntaxError((("Parse error: expected " + expectedType) + " but got ") + tok.tokenType);
    }
    this.advance();
    return tok;
  };
  expectValue (expectedValue) {
    const tok = this.peek();
    if ( tok.value != expectedValue ) {
      this.syntaxError(((("Parse error: expected '" + expectedValue) + "' but got '") + tok.value) + "'");
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
    const t = this.peekType();
    if ( t == "String" ) {
      return false;
    }
    if ( t == "Template" ) {
      return false;
    }
    if ( t == "Regex" ) {
      return false;
    }
    const v = this.peekValue();
    return v == value;
  };
  matchPunct (value) {
    if ( this.peekType() != "Punctuator" ) {
      return false;
    }
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
    if ( t == "Boolean" ) {
      return true;
    }
    if ( t == "Null" ) {
      return true;
    }
    if ( t == "Number" ) {
      return true;
    }
    if ( t == "String" ) {
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
    const recTok = this.peek();
    this.syntaxError(((("Parser recovery: skipping unexpected token '" + recTok.value) + "' (type ") + recTok.tokenType) + ")");
    if ( this.isAtEnd() == false ) {
      this.advance();
    }
  };
  parseProgram () {
    const prog = new TSNode();
    prog.nodeType = "Program";
    this.pushScope(true);
    while (this.isAtEnd() == false) {
      const beforePos = this.pos;
      const stmt = this.parseStatement();
      prog.children.push(stmt);
      this.guardNoProgress(beforePos);
    };
    this.popScope();
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
    if ( ((tokVal == "let") || (tokVal == "const")) || (tokVal == "var") ) {
      const afterKind = this.peekNextValue();
      const afterKindType = this.peekNextType();
      let startsBinding = false;
      if ( (afterKindType == "Identifier") || (afterKindType == "TSType") ) {
        startsBinding = true;
      }
      if ( afterKind == "{" ) {
        startsBinding = true;
      }
      if ( afterKind == "[" ) {
        startsBinding = true;
      }
      if ( tokVal != "let" ) {
        startsBinding = true;
      }
      if ( startsBinding ) {
        return this.parseVarDecl();
      }
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
    if ( ((v != ";") && (v != "}")) && (this.isAtEnd() == false) ) {
      const arg = this.parseExprSeq();
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
    if ( this.isNameToken() ) {
      const labelTok = this.peek();
      if ( labelTok.line == startTok.line ) {
        this.advance();
        node.name = labelTok.value;
      }
    }
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
    if ( this.isNameToken() ) {
      const labelTok = this.peek();
      if ( labelTok.line == startTok.line ) {
        this.advance();
        node.name = labelTok.value;
      }
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
        const importedName = this.expectModuleExportName();
        spec.name = importedName.value;
        if ( this.matchValue("as") ) {
          this.advance();
          const localName = this.expectBindingName();
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
            const importedName_1 = this.expectModuleExportName();
            spec_1.name = importedName_1.value;
            if ( this.matchValue("as") ) {
              this.advance();
              const localName_1 = this.expectBindingName();
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
        const localName = this.expectModuleExportName();
        spec.name = localName.value;
        if ( this.matchValue("as") ) {
          this.advance();
          const exportedName = this.expectModuleExportName();
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
    if ( this.matchType("Identifier") ) {
      const nameTok = this.expect("Identifier");
      node.name = nameTok.value;
    }
    if ( this.matchValue("<") ) {
      const typeParams = this.parseTypeParams();
      node.params = typeParams;
    }
    if ( this.matchValue("extends") ) {
      this.advance();
      const superClass = this.parsePostfix();
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
      if ( this.matchValue(";") ) {
        this.advance();
      } else {
        const member = this.parseClassMember();
        body.children.push(member);
        if ( this.matchValue(";") ) {
          this.advance();
        }
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
      const modifierStartPos = this.pos;
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
        const afterStatic = this.peekNextValue();
        if ( (((afterStatic != "(") && (afterStatic != "=")) && (afterStatic != ";")) && (afterStatic != "}") ) {
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
      if ( this.pos == modifierStartPos ) {
        keepParsing = false;
      }
    };
    if ( this.matchValue("constructor") ) {
      member.nodeType = "MethodDefinition";
      member.kind = "constructor";
      this.advance();
      this.pushScope(true);
      this.expectValue("(");
      while ((this.matchValue(")") == false) && (this.isAtEnd() == false)) {
        if ( (member.params.length) > 0 ) {
          this.expectValue(",");
        }
        const param = this.parseConstructorParam();
        if ( (param.name.length) > 0 ) {
          this.declareBinding("p", param.name);
        }
        member.params.push(param);
      };
      this.expectValue(")");
      if ( this.matchValue("{") ) {
        this.suppressBlockScope = true;
        const bodyNode = this.parseBlock();
        member.body = bodyNode;
      }
      this.popScope();
      return member;
    }
    if ( this.matchValue("*") ) {
      this.advance();
      member.generator = true;
    }
    if ( this.matchValue("#") ) {
      this.advance();
      member.value = "#";
    }
    if ( this.matchPunct("[") ) {
      this.advance();
      const keyExpr = this.parseExpr();
      this.expectValue("]");
      member.computed = true;
      member.init = keyExpr;
    } else {
      const nameTok = this.parseMemberName();
      member.name = nameTok.value;
    }
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
      this.pushScope(true);
      this.expectValue("(");
      while ((this.matchValue(")") == false) && (this.isAtEnd() == false)) {
        if ( (member.params.length) > 0 ) {
          this.expectValue(",");
        }
        const param_1 = this.parseParam();
        if ( (param_1.name.length) > 0 ) {
          this.declareBinding("p", param_1.name);
        }
        member.params.push(param_1);
      };
      this.expectValue(")");
      if ( this.matchValue(":") ) {
        const returnType = this.parseTypeAnnotation();
        member.typeAnnotation = returnType;
      }
      if ( this.matchValue("{") ) {
        this.suppressBlockScope = true;
        const bodyNode_1 = this.parseBlock();
        member.body = bodyNode_1;
      }
      this.popScope();
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
        const initExpr = this.parseExprSeq();
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
      let hasPattern = false;
      let patternNode = new TSNode();
      let varNameStr = "";
      const bindTokVal = this.peekValue();
      if ( bindTokVal == "[" ) {
        hasPattern = true;
        patternNode = this.parseArrayPattern();
      } else {
        if ( bindTokVal == "{" ) {
          hasPattern = true;
          patternNode = this.parseObjectPattern();
        } else {
          const vt = this.expect("Identifier");
          varNameStr = vt.value;
        }
      }
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
        if ( hasPattern ) {
          declarator.left = patternNode;
        } else {
          declarator.name = varNameStr;
        }
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
        if ( hasPattern ) {
          declarator_1.left = patternNode;
        } else {
          declarator_1.name = varNameStr;
        }
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
      if ( hasPattern ) {
        declarator_2.left = patternNode;
      } else {
        declarator_2.name = varNameStr;
      }
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
      while (this.matchValue(",")) {
        this.advance();
        const more = new TSNode();
        more.nodeType = "VariableDeclarator";
        const moreTarget = this.parseBindingTarget();
        if ( moreTarget.nodeType == "Identifier" ) {
          more.name = moreTarget.name;
        } else {
          more.left = moreTarget;
        }
        if ( this.matchValue(":") ) {
          const moreType = this.parseTypeAnnotation();
          more.typeAnnotation = moreType;
        }
        if ( this.matchValue("=") ) {
          this.advance();
          const moreInit = this.parseExpr();
          more.init = moreInit;
        }
        initDecl.children.push(more);
      };
      node.init = initDecl;
    } else {
      node.nodeType = "ForStatement";
      if ( this.matchValue(";") == false ) {
        const initExpr = this.parseExpr();
        if ( this.matchValue("of") ) {
          node.nodeType = "ForOfStatement";
          node.await = isAwait;
          this.advance();
          node.left = initExpr;
          const ofRight = this.parseExpr();
          node.right = ofRight;
          this.expectValue(")");
          const ofBody = this.parseStatement();
          node.body = ofBody;
          return node;
        }
        if ( initExpr.nodeType == "BinaryExpression" ) {
          if ( initExpr.value == "in" ) {
            if ( this.matchValue(")") ) {
              node.nodeType = "ForInStatement";
              node.left = initExpr.left;
              node.right = initExpr.right;
              this.expectValue(")");
              const inBody = this.parseStatement();
              node.body = inBody;
              return node;
            }
          }
        }
        if ( this.matchValue(",") ) {
          const seq = new TSNode();
          seq.nodeType = "SequenceExpression";
          seq.start = initExpr.start;
          seq.line = initExpr.line;
          seq.col = initExpr.col;
          seq.children.push(initExpr);
          while (this.matchValue(",")) {
            this.advance();
            const more_1 = this.parseExpr();
            seq.children.push(more_1);
          };
          node.init = seq;
        } else {
          node.init = initExpr;
        }
      }
    }
    this.expectValue(";");
    if ( this.matchValue(";") == false ) {
      const test = this.parseExprSeq();
      node.left = test;
    }
    this.expectValue(";");
    if ( this.matchValue(")") == false ) {
      const update = this.parseExprSeq();
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
        const param = this.parseBindingTarget();
        catchNode.name = param.name;
        catchNode.left = param;
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
    let moreDecls = true;
    while (moreDecls) {
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
          const nameTok = this.expectBindingName();
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
      this.declareBindingKind(node.kind, declarator);
      node.children.push(declarator);
      if ( this.matchValue(",") ) {
        this.advance();
      } else {
        moreDecls = false;
      }
    };
    if ( this.matchValue(";") ) {
      this.advance();
    }
    return node;
  };
  isAssignmentPatternFollow () {
    if ( this.matchValue("=") ) {
      return true;
    }
    if ( this.matchValue("in") ) {
      return true;
    }
    if ( this.matchValue("of") ) {
      return true;
    }
    return false;
  };
  parseBindingTarget () {
    if ( this.matchValue("{") ) {
      return this.parseObjectPattern();
    }
    if ( this.matchValue("[") ) {
      return this.parseArrayPattern();
    }
    const tok = this.peek();
    const tt = this.peekType();
    if ( (((tt == "Identifier") || (tt == "TSType")) || (tt == "Keyword")) || (tt == "TSKeyword") ) {
      if ( this.isAlwaysReservedWord(tok.value) ) {
        this.syntaxError(("Parse error: '" + tok.value) + "' is a reserved word and cannot be bound");
      }
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
    const bad = this.expect("Identifier");
    const errId = new TSNode();
    errId.nodeType = "Identifier";
    errId.name = bad.value;
    return errId;
  };
  parseBindingElement () {
    const target = this.parseBindingTarget();
    if ( this.matchValue("=") ) {
      this.advance();
      const defaultExpr = this.parseExpr();
      const assignPat = new TSNode();
      assignPat.nodeType = "AssignmentPattern";
      assignPat.left = target;
      assignPat.right = defaultExpr;
      assignPat.start = target.start;
      assignPat.line = target.line;
      assignPat.col = target.col;
      return assignPat;
    }
    return target;
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
        const restTarget = this.parseBindingTarget();
        restProp.left = restTarget;
        restProp.name = restTarget.name;
        node.children.push(restProp);
      } else {
        const prop = new TSNode();
        prop.nodeType = "Property";
        if ( this.matchPunct("[") ) {
          this.advance();
          const keyExpr = this.parseExpr();
          this.expectValue("]");
          prop.computed = true;
          prop.body = keyExpr;
          this.expectValue(":");
          prop.right = this.parseBindingElement();
        } else {
          const keyTok = this.peek();
          const keyType = this.peekType();
          if ( (keyType == "String") || (keyType == "Number") ) {
            this.advance();
            prop.name = keyTok.value;
          } else {
            const idTok = this.parseBindingTarget();
            prop.name = idTok.name;
          }
          if ( this.matchValue(":") ) {
            this.advance();
            prop.right = this.parseBindingElement();
          } else {
            prop.shorthand = true;
            if ( this.matchValue("=") ) {
              this.advance();
              const defaultExpr = this.parseExpr();
              prop.init = defaultExpr;
              prop.left = defaultExpr;
            }
          }
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
          const restTarget = this.parseBindingTarget();
          restElem.left = restTarget;
          restElem.name = restTarget.name;
          node.children.push(restElem);
        } else {
          node.children.push(this.parseBindingElement());
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
    if ( this.matchValue("(") == false ) {
      const nameTok = this.expectBindingName();
      node.name = nameTok.value;
      this.declareBinding("v", node.name);
    }
    this.pushScope(true);
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
      this.declareParam(param);
      node.params.push(param);
    };
    this.expectValue(")");
    if ( this.matchValue(":") ) {
      const returnType = this.parseTypeAnnotation();
      node.typeAnnotation = returnType;
    }
    this.suppressBlockScope = true;
    const body = this.parseBlock();
    node.body = body;
    this.popScope();
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
      if ( this.matchValue(":") ) {
        const patType = this.parseTypeAnnotation();
        pattern.typeAnnotation = patType;
      }
      if ( this.matchValue("=") ) {
        this.advance();
        const patDefault = this.parseExpr();
        const patAssign = new TSNode();
        patAssign.nodeType = "AssignmentPattern";
        patAssign.left = pattern;
        patAssign.right = patDefault;
        return patAssign;
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
      if ( this.matchValue(":") ) {
        const patType_1 = this.parseTypeAnnotation();
        pattern_1.typeAnnotation = patType_1;
      }
      if ( this.matchValue("=") ) {
        this.advance();
        const patDefault_1 = this.parseExpr();
        const patAssign_1 = new TSNode();
        patAssign_1.nodeType = "AssignmentPattern";
        patAssign_1.left = pattern_1;
        patAssign_1.right = patDefault_1;
        return patAssign_1;
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
    const nameTok = this.expectBindingName();
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
    let ownScope = true;
    if ( this.suppressBlockScope ) {
      ownScope = false;
      this.suppressBlockScope = false;
    }
    if ( ownScope ) {
      this.pushScope(false);
    }
    while ((this.matchValue("}") == false) && (this.isAtEnd() == false)) {
      const beforePos = this.pos;
      const stmt = this.parseStatement();
      block.children.push(stmt);
      this.guardNoProgress(beforePos);
    };
    if ( ownScope ) {
      this.popScope();
    }
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
    const expr = this.parseExprSeq();
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
    this.syntaxError("Unknown type: " + tokVal);
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
  parseExprSeq () {
    const first = this.parseExpr();
    if ( this.matchValue(",") == false ) {
      return first;
    }
    const seq = new TSNode();
    seq.nodeType = "SequenceExpression";
    seq.start = first.start;
    seq.line = first.line;
    seq.col = first.col;
    seq.children.push(first);
    while (this.matchValue(",")) {
      this.advance();
      const next = this.parseExpr();
      seq.children.push(next);
    };
    return seq;
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
    if ( (((((((((((tokVal == "+=") || (tokVal == "-=")) || (tokVal == "*=")) || (tokVal == "/=")) || (tokVal == "%=")) || (tokVal == "**=")) || (tokVal == "&=")) || (tokVal == "|=")) || (tokVal == "^=")) || (tokVal == "<<=")) || (tokVal == ">>=")) || (tokVal == ">>>=") ) {
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
    let left = this.parseShift();
    let tokVal = this.peekValue();
    let tokType = this.peekType();
    while ((((((tokVal == "<") || (tokVal == ">")) || (tokVal == "<=")) || (tokVal == ">=")) && (tokType == "Punctuator")) || (((tokVal == "instanceof") || (tokVal == "in")) && (tokType != "String"))) {
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
      const right = this.parseShift();
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
      tokType = this.peekType();
    };
    return left;
  };
  parseShift () {
    let left = this.parseAdditive();
    let cur = this.peekValue();
    let nxt = this.peekAheadValue(1);
    while ((this.peekType() == "Punctuator") && (((cur == "<") && (nxt == "<")) || ((cur == ">") && (nxt == ">")))) {
      const startTok = this.peek();
      let op = "";
      if ( cur == "<" ) {
        this.advance();
        this.advance();
        op = "<<";
      } else {
        this.advance();
        this.advance();
        op = ">>";
        if ( this.peekValue() == ">" ) {
          this.advance();
          op = ">>>";
        }
      }
      const right = this.parseAdditive();
      const expr = new TSNode();
      expr.nodeType = "BinaryExpression";
      expr.value = op;
      expr.left = left;
      expr.right = right;
      expr.start = left.start;
      expr.line = left.line;
      expr.col = left.col;
      left = expr;
      cur = this.peekValue();
      nxt = this.peekAheadValue(1);
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
    const tokIsPunct = this.peekType() == "Punctuator";
    if ( tokIsPunct && ((tokVal == "++") || (tokVal == "--")) ) {
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
    if ( tokIsPunct && ((((tokVal == "!") || (tokVal == "-")) || (tokVal == "+")) || (tokVal == "~")) ) {
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
    if ( (tokVal == "void") || (tokVal == "delete") ) {
      const opTok_2 = this.peek();
      this.advance();
      const arg_2 = this.parseUnary();
      const unary_1 = new TSNode();
      unary_1.nodeType = "UnaryExpression";
      unary_1.value = opTok_2.value;
      unary_1.left = arg_2;
      unary_1.start = opTok_2.start;
      unary_1.line = opTok_2.line;
      unary_1.col = opTok_2.col;
      return unary_1;
    }
    if ( tokVal == "typeof" ) {
      const opTok_3 = this.peek();
      this.advance();
      const arg_3 = this.parseUnary();
      const unary_2 = new TSNode();
      unary_2.nodeType = "UnaryExpression";
      unary_2.value = "typeof";
      unary_2.left = arg_3;
      unary_2.start = opTok_3.start;
      unary_2.line = opTok_3.line;
      unary_2.col = opTok_3.col;
      return unary_2;
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
      const arg_4 = this.parseUnary();
      const awaitExpr = new TSNode();
      awaitExpr.nodeType = "AwaitExpression";
      awaitExpr.left = arg_4;
      awaitExpr.start = awaitTok.start;
      awaitExpr.line = awaitTok.line;
      awaitExpr.col = awaitTok.col;
      return awaitExpr;
    }
    if ( (tokVal == "<") && (this.peekType() == "Punctuator") ) {
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
          const arg_5 = this.parseUnary();
          const assertion = new TSNode();
          assertion.nodeType = "TSTypeAssertion";
          assertion.typeAnnotation = typeNode;
          assertion.left = arg_5;
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
      if ( (tokVal == "<") && (this.peekType() == "Punctuator") ) {
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
      if ( this.peekNextValue() == "=>" ) {
        return this.parseArrowFunction();
      }
    }
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
      const arrSavedPos = this.pos;
      const arrSavedTok = this.currentToken;
      const arrSavedErrors = this.errorCount;
      this.speculating = this.speculating + 1;
      const arrPat = this.parseArrayPattern();
      this.speculating = this.speculating - 1;
      if ( this.errorCount == arrSavedErrors ) {
        if ( this.isAssignmentPatternFollow() ) {
          return arrPat;
        }
      }
      this.pos = arrSavedPos;
      this.currentToken = arrSavedTok;
      this.errorCount = arrSavedErrors;
      return this.parseArrayLiteral();
    }
    if ( tokVal == "{" ) {
      const objSavedPos = this.pos;
      const objSavedTok = this.currentToken;
      const objSavedErrors = this.errorCount;
      this.speculating = this.speculating + 1;
      const objPat = this.parseObjectPattern();
      this.speculating = this.speculating - 1;
      if ( this.errorCount == objSavedErrors ) {
        if ( this.isAssignmentPatternFollow() ) {
          return objPat;
        }
      }
      this.pos = objSavedPos;
      this.currentToken = objSavedTok;
      this.errorCount = objSavedErrors;
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
    if ( tokType == "Regex" ) {
      this.advance();
      const re = new TSNode();
      re.nodeType = "RegExpLiteral";
      re.value = tok.value;
      re.start = tok.start;
      re.end = tok.end;
      re.line = tok.line;
      re.col = tok.col;
      return re;
    }
    if ( tokVal == "function" ) {
      const fnExpr = this.parseFuncDecl(false);
      fnExpr.nodeType = "FunctionExpression";
      return fnExpr;
    }
    if ( tokVal == "async" ) {
      if ( this.peekNextValue() == "function" ) {
        this.advance();
        const asyncFnExpr = this.parseFuncDecl(true);
        asyncFnExpr.nodeType = "FunctionExpression";
        return asyncFnExpr;
      }
    }
    if ( tokVal == "class" ) {
      const clsExpr = this.parseClass();
      clsExpr.nodeType = "ClassExpression";
      return clsExpr;
    }
    if ( tokVal == "super" ) {
      this.advance();
      const superExpr = new TSNode();
      superExpr.nodeType = "Super";
      superExpr.start = tok.start;
      superExpr.end = tok.end;
      superExpr.line = tok.line;
      superExpr.col = tok.col;
      return superExpr;
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
    if ( tokType == "Keyword" ) {
      let contextual = false;
      if ( tokVal == "let" ) {
        contextual = true;
      }
      if ( tokVal == "yield" ) {
        contextual = true;
      }
      if ( tokVal == "await" ) {
        contextual = true;
      }
      if ( tokVal == "of" ) {
        contextual = true;
      }
      if ( tokVal == "static" ) {
        contextual = true;
      }
      if ( tokVal == "as" ) {
        contextual = true;
      }
      if ( tokVal == "from" ) {
        contextual = true;
      }
      if ( contextual ) {
        this.advance();
        const ctxId = new TSNode();
        ctxId.nodeType = "Identifier";
        ctxId.name = tok.value;
        ctxId.start = tok.start;
        ctxId.end = tok.end;
        ctxId.line = tok.line;
        ctxId.col = tok.col;
        return ctxId;
      }
    }
    this.syntaxError("Unexpected token: " + tokVal);
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
        if ( currVal == "*" ) {
          this.advance();
          prop.generator = true;
          currVal = this.peekValue();
          nextType = this.peekNextType();
          nextVal = this.peekNextValue();
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
        if ( this.matchPunct("[") ) {
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
          this.pushScope(true);
          while ((this.matchValue(")") == false) && (this.isAtEnd() == false)) {
            if ( (fnNode.params.length) > 0 ) {
              this.expectValue(",");
            }
            const mParam = this.parseParam();
            if ( (mParam.name.length) > 0 ) {
              this.declareBinding("p", mParam.name);
            }
            fnNode.params.push(mParam);
          };
          this.expectValue(")");
          if ( this.matchValue(":") ) {
            this.advance();
            fnNode.typeAnnotation = this.parseType();
          }
          if ( this.matchValue("{") ) {
            this.suppressBlockScope = true;
            fnNode.body = this.parseBlock();
          }
          this.popScope();
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
      if ( this.matchPunct("(") ) {
        parenDepth = parenDepth + 1;
      }
      if ( this.matchPunct(")") ) {
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
      const expr = this.parseExprSeq();
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
    const expr_1 = this.parseExprSeq();
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
    this.pushScope(true);
    if ( this.matchValue("(") ) {
      this.advance();
      while ((this.matchValue(")") == false) && (this.isAtEnd() == false)) {
        if ( (node.params.length) > 0 ) {
          this.expectValue(",");
        }
        const param = this.parseParam();
        if ( (param.name.length) > 0 ) {
          this.declareBinding("p", param.name);
        }
        node.params.push(param);
      };
      this.expectValue(")");
    } else {
      const paramTok = this.expectBindingName();
      const param_1 = new TSNode();
      param_1.nodeType = "Parameter";
      param_1.name = paramTok.value;
      this.declareBinding("p", param_1.name);
      node.params.push(param_1);
    }
    if ( this.matchValue(":") ) {
      this.advance();
      const retType = this.parseType();
      node.typeAnnotation = retType;
    }
    this.expectValue("=>");
    if ( this.matchValue("{") ) {
      this.suppressBlockScope = true;
      const body = this.parseBlock();
      node.body = body;
    } else {
      const body_1 = this.parseExpr();
      node.body = body_1;
    }
    this.popScope();
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
    let callee = this.parsePrimary();
    let keepMember = true;
    while (keepMember) {
      if ( this.matchValue(".") ) {
        this.advance();
        const propTok = this.parseMemberName();
        const member = new TSNode();
        member.nodeType = "MemberExpression";
        member.left = callee;
        member.name = propTok.value;
        member.start = callee.start;
        member.line = callee.line;
        member.col = callee.col;
        callee = member;
      } else {
        keepMember = false;
      }
    };
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
          if ( this.matchValue(")") ) {
            break;
          }
        }
        if ( this.matchValue("...") ) {
          this.advance();
          const spreadArg = this.parseExpr();
          const spread = new TSNode();
          spread.nodeType = "SpreadElement";
          spread.left = spreadArg;
          node.children.push(spread);
        } else {
          const arg = this.parseExpr();
          node.children.push(arg);
        }
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
      const paramCount = stmt.params.length;
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
  const code = "\ninterface Person {\n  readonly id: number;\n  name: string;\n  age?: number;\n}\n\ntype ID = string | number;\n\ntype Result = Person | null;\n\nlet count: number = 42;\n\nconst message: string = 'hello';\n\nfunction greet(name: string, age?: number): string {\n  return name;\n}\n\nlet data: Array<string>;\n";
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
module.exports.Token = Token;
module.exports.TSLexer = TSLexer;
module.exports.TSNode = TSNode;
module.exports.TSParserSimple = TSParserSimple;
module.exports.TSParserMain = TSParserMain;
