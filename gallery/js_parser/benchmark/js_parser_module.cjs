class Token {
  constructor() {
    this.tokenType = "";
    this.value = "";
    this.line = 0;
    this.col = 0;
    this.start = 0;
    this.end = 0;
  }
}
class Lexer {
  constructor(src) {
    this.source = "";
    this.pos = 0;
    this.line = 1;
    this.col = 1;
    this.__len = 0;
    this.source = src;
    this.__len = src.length;
  }
  peek() {
    if (this.pos >= this.__len) {
      return "";
    }
    return this.source[this.pos];
  }
  peekAt(offset) {
    const idx = this.pos + offset;
    if (idx >= this.__len) {
      return "";
    }
    return this.source[idx];
  }
  advance() {
    if (this.pos >= this.__len) {
      return "";
    }
    const ch = this.source[this.pos];
    this.pos = this.pos + 1;
    if (ch == "\n" || ch == "\r\n") {
      this.line = this.line + 1;
      this.col = 1;
    } else {
      this.col = this.col + 1;
    }
    return ch;
  }
  isDigit(ch) {
    if (ch == "0") {
      return true;
    }
    if (ch == "1") {
      return true;
    }
    if (ch == "2") {
      return true;
    }
    if (ch == "3") {
      return true;
    }
    if (ch == "4") {
      return true;
    }
    if (ch == "5") {
      return true;
    }
    if (ch == "6") {
      return true;
    }
    if (ch == "7") {
      return true;
    }
    if (ch == "8") {
      return true;
    }
    if (ch == "9") {
      return true;
    }
    return false;
  }
  isAlpha(ch) {
    if (ch.length == 0) {
      return false;
    }
    const code = this.source.charCodeAt(this.pos);
    if (code >= 97) {
      if (code <= 122) {
        return true;
      }
    }
    if (code >= 65) {
      if (code <= 90) {
        return true;
      }
    }
    if (ch == "_") {
      return true;
    }
    if (ch == "$") {
      return true;
    }
    return false;
  }
  isAlphaNumCh(ch) {
    if (this.isDigit(ch)) {
      return true;
    }
    if (ch == "_") {
      return true;
    }
    if (ch == "$") {
      return true;
    }
    if (ch.length == 0) {
      return false;
    }
    const code = this.source.charCodeAt(this.pos);
    if (code >= 97) {
      if (code <= 122) {
        return true;
      }
    }
    if (code >= 65) {
      if (code <= 90) {
        return true;
      }
    }
    return false;
  }
  isWhitespace(ch) {
    if (ch == " ") {
      return true;
    }
    if (ch == "\t") {
      return true;
    }
    if (ch == "\n") {
      return true;
    }
    if (ch == "\r") {
      return true;
    }
    if (ch == "\r\n") {
      return true;
    }
    return false;
  }
  skipWhitespace() {
    while (this.pos < this.__len) {
      const ch = this.peek();
      if (this.isWhitespace(ch)) {
        this.advance();
      } else {
        return;
      }
    }
  }
  readLineComment() {
    const startPos = this.pos;
    const startLine = this.line;
    const startCol = this.col;
    this.advance();
    this.advance();
    let value = "";
    while (this.pos < this.__len) {
      const ch = this.peek();
      if (ch == "\n") {
        return this.makeToken(
          "LineComment",
          value,
          startPos,
          startLine,
          startCol
        );
      }
      if (ch == "\r\n") {
        return this.makeToken(
          "LineComment",
          value,
          startPos,
          startLine,
          startCol
        );
      }
      value = value + this.advance();
    }
    return this.makeToken("LineComment", value, startPos, startLine, startCol);
  }
  readBlockComment() {
    const startPos = this.pos;
    const startLine = this.line;
    const startCol = this.col;
    this.advance();
    this.advance();
    let value = "";
    let isJSDoc = false;
    if (this.peek() == "*") {
      const nextCh = this.peekAt(1);
      if (nextCh != "/") {
        isJSDoc = true;
      }
    }
    while (this.pos < this.__len) {
      const ch = this.peek();
      if (ch == "*") {
        if (this.peekAt(1) == "/") {
          this.advance();
          this.advance();
          if (isJSDoc) {
            return this.makeToken(
              "JSDocComment",
              value,
              startPos,
              startLine,
              startCol
            );
          }
          return this.makeToken(
            "BlockComment",
            value,
            startPos,
            startLine,
            startCol
          );
        }
      }
      value = value + this.advance();
    }
    if (isJSDoc) {
      return this.makeToken(
        "JSDocComment",
        value,
        startPos,
        startLine,
        startCol
      );
    }
    return this.makeToken("BlockComment", value, startPos, startLine, startCol);
  }
  makeToken(tokType, value, startPos, startLine, startCol) {
    const tok = new Token();
    tok.tokenType = tokType;
    tok.value = value;
    tok.start = startPos;
    tok.end = this.pos;
    tok.line = startLine;
    tok.col = startCol;
    return tok;
  }
  readString(quote) {
    const startPos = this.pos;
    const startLine = this.line;
    const startCol = this.col;
    this.advance();
    let value = "";
    while (this.pos < this.__len) {
      const ch = this.peek();
      if (ch == quote) {
        this.advance();
        return this.makeToken("String", value, startPos, startLine, startCol);
      }
      if (ch == "\\") {
        this.advance();
        const esc = this.advance();
        if (esc == "n") {
          value = value + "\n";
        } else {
          if (esc == "t") {
            value = value + "\t";
          } else {
            if (esc == "r") {
              value = value + "\r";
            } else {
              if (esc == "\\") {
                value = value + "\\";
              } else {
                if (esc == quote) {
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
    }
    return this.makeToken("String", value, startPos, startLine, startCol);
  }
  readTemplateLiteral() {
    const startPos = this.pos;
    const startLine = this.line;
    const startCol = this.col;
    this.advance();
    let value = "";
    let hasExpressions = false;
    while (this.pos < this.__len) {
      const ch = this.peek();
      if (ch == "`") {
        this.advance();
        if (hasExpressions) {
          return this.makeToken(
            "TemplateLiteral",
            value,
            startPos,
            startLine,
            startCol
          );
        } else {
          return this.makeToken(
            "TemplateLiteral",
            value,
            startPos,
            startLine,
            startCol
          );
        }
      }
      if (ch == "\\") {
        this.advance();
        const esc = this.advance();
        if (esc == "n") {
          value = value + "\n";
        }
        if (esc == "t") {
          value = value + "\t";
        }
        if (esc == "r") {
          value = value + "\r";
        }
        if (esc == "\\") {
          value = value + "\\";
        }
        if (esc == "`") {
          value = value + "`";
        }
        if (esc == "$") {
          value = value + "$";
        }
      } else {
        if (ch == "$") {
          if (this.peekAt(1) == "{") {
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
    }
    return this.makeToken(
      "TemplateLiteral",
      value,
      startPos,
      startLine,
      startCol
    );
  }
  readNumber() {
    const startPos = this.pos;
    const startLine = this.line;
    const startCol = this.col;
    let value = "";
    while (this.pos < this.__len) {
      const ch = this.peek();
      if (this.isDigit(ch)) {
        value = value + this.advance();
      } else {
        if (ch == ".") {
          value = value + this.advance();
        } else {
          return this.makeToken("Number", value, startPos, startLine, startCol);
        }
      }
    }
    return this.makeToken("Number", value, startPos, startLine, startCol);
  }
  readIdentifier() {
    const startPos = this.pos;
    const startLine = this.line;
    const startCol = this.col;
    let value = "";
    while (this.pos < this.__len) {
      const ch = this.peek();
      if (this.isAlphaNumCh(ch)) {
        value = value + this.advance();
      } else {
        return this.makeToken(
          this.identType(value),
          value,
          startPos,
          startLine,
          startCol
        );
      }
    }
    return this.makeToken(
      this.identType(value),
      value,
      startPos,
      startLine,
      startCol
    );
  }
  identType(value) {
    if (value == "var") {
      return "Keyword";
    }
    if (value == "let") {
      return "Keyword";
    }
    if (value == "const") {
      return "Keyword";
    }
    if (value == "function") {
      return "Keyword";
    }
    if (value == "return") {
      return "Keyword";
    }
    if (value == "if") {
      return "Keyword";
    }
    if (value == "else") {
      return "Keyword";
    }
    if (value == "while") {
      return "Keyword";
    }
    if (value == "for") {
      return "Keyword";
    }
    if (value == "in") {
      return "Keyword";
    }
    if (value == "of") {
      return "Keyword";
    }
    if (value == "switch") {
      return "Keyword";
    }
    if (value == "case") {
      return "Keyword";
    }
    if (value == "default") {
      return "Keyword";
    }
    if (value == "break") {
      return "Keyword";
    }
    if (value == "continue") {
      return "Keyword";
    }
    if (value == "try") {
      return "Keyword";
    }
    if (value == "catch") {
      return "Keyword";
    }
    if (value == "finally") {
      return "Keyword";
    }
    if (value == "throw") {
      return "Keyword";
    }
    if (value == "new") {
      return "Keyword";
    }
    if (value == "typeof") {
      return "Keyword";
    }
    if (value == "instanceof") {
      return "Keyword";
    }
    if (value == "this") {
      return "Keyword";
    }
    if (value == "class") {
      return "Keyword";
    }
    if (value == "extends") {
      return "Keyword";
    }
    if (value == "static") {
      return "Keyword";
    }
    if (value == "get") {
      return "Keyword";
    }
    if (value == "set") {
      return "Keyword";
    }
    if (value == "super") {
      return "Keyword";
    }
    if (value == "async") {
      return "Keyword";
    }
    if (value == "await") {
      return "Keyword";
    }
    if (value == "yield") {
      return "Keyword";
    }
    if (value == "import") {
      return "Keyword";
    }
    if (value == "export") {
      return "Keyword";
    }
    if (value == "from") {
      return "Keyword";
    }
    if (value == "as") {
      return "Keyword";
    }
    if (value == "true") {
      return "Boolean";
    }
    if (value == "false") {
      return "Boolean";
    }
    if (value == "null") {
      return "Null";
    }
    return "Identifier";
  }
  nextToken() {
    this.skipWhitespace();
    if (this.pos >= this.__len) {
      return this.makeToken("EOF", "", this.pos, this.line, this.col);
    }
    const ch = this.peek();
    const startPos = this.pos;
    const startLine = this.line;
    const startCol = this.col;
    if (ch == "/") {
      const next = this.peekAt(1);
      if (next == "/") {
        return this.readLineComment();
      }
      if (next == "*") {
        return this.readBlockComment();
      }
    }
    if (ch == '"') {
      return this.readString('"');
    }
    if (ch == "'") {
      return this.readString("'");
    }
    if (ch == "`") {
      return this.readTemplateLiteral();
    }
    if (this.isDigit(ch)) {
      return this.readNumber();
    }
    if (this.isAlpha(ch)) {
      return this.readIdentifier();
    }
    const next_1 = this.peekAt(1);
    if (ch == "=") {
      if (next_1 == "=") {
        if (this.peekAt(2) == "=") {
          this.advance();
          this.advance();
          this.advance();
          return this.makeToken(
            "Punctuator",
            "===",
            startPos,
            startLine,
            startCol
          );
        }
      }
    }
    if (ch == "!") {
      if (next_1 == "=") {
        if (this.peekAt(2) == "=") {
          this.advance();
          this.advance();
          this.advance();
          return this.makeToken(
            "Punctuator",
            "!==",
            startPos,
            startLine,
            startCol
          );
        }
      }
    }
    if (ch == "=") {
      if (next_1 == ">") {
        this.advance();
        this.advance();
        return this.makeToken(
          "Punctuator",
          "=>",
          startPos,
          startLine,
          startCol
        );
      }
    }
    if (ch == "=") {
      if (next_1 == "=") {
        this.advance();
        this.advance();
        return this.makeToken(
          "Punctuator",
          "==",
          startPos,
          startLine,
          startCol
        );
      }
    }
    if (ch == "!") {
      if (next_1 == "=") {
        this.advance();
        this.advance();
        return this.makeToken(
          "Punctuator",
          "!=",
          startPos,
          startLine,
          startCol
        );
      }
    }
    if (ch == "<") {
      if (next_1 == "=") {
        this.advance();
        this.advance();
        return this.makeToken(
          "Punctuator",
          "<=",
          startPos,
          startLine,
          startCol
        );
      }
    }
    if (ch == ">") {
      if (next_1 == "=") {
        this.advance();
        this.advance();
        return this.makeToken(
          "Punctuator",
          ">=",
          startPos,
          startLine,
          startCol
        );
      }
    }
    if (ch == "&") {
      if (next_1 == "&") {
        this.advance();
        this.advance();
        return this.makeToken(
          "Punctuator",
          "&&",
          startPos,
          startLine,
          startCol
        );
      }
    }
    if (ch == "|") {
      if (next_1 == "|") {
        this.advance();
        this.advance();
        return this.makeToken(
          "Punctuator",
          "||",
          startPos,
          startLine,
          startCol
        );
      }
    }
    if (ch == "?") {
      if (next_1 == "?") {
        this.advance();
        this.advance();
        return this.makeToken(
          "Punctuator",
          "??",
          startPos,
          startLine,
          startCol
        );
      }
      if (next_1 == ".") {
        this.advance();
        this.advance();
        return this.makeToken(
          "Punctuator",
          "?.",
          startPos,
          startLine,
          startCol
        );
      }
    }
    if (ch == "+") {
      if (next_1 == "+") {
        this.advance();
        this.advance();
        return this.makeToken(
          "Punctuator",
          "++",
          startPos,
          startLine,
          startCol
        );
      }
    }
    if (ch == "-") {
      if (next_1 == "-") {
        this.advance();
        this.advance();
        return this.makeToken(
          "Punctuator",
          "--",
          startPos,
          startLine,
          startCol
        );
      }
    }
    if (ch == ".") {
      if (next_1 == ".") {
        if (this.peekAt(2) == ".") {
          this.advance();
          this.advance();
          this.advance();
          return this.makeToken(
            "Punctuator",
            "...",
            startPos,
            startLine,
            startCol
          );
        }
      }
    }
    this.advance();
    return this.makeToken("Punctuator", ch, startPos, startLine, startCol);
  }
  readRegexLiteral() {
    const startPos = this.pos;
    const startLine = this.line;
    const startCol = this.col;
    this.advance();
    let pattern = "";
    let inCharClass = false;
    while (this.pos < this.__len) {
      const ch = this.peek();
      if (ch == "[") {
        inCharClass = true;
        pattern = pattern + this.advance();
      } else {
        if (ch == "]") {
          inCharClass = false;
          pattern = pattern + this.advance();
        } else {
          if (ch == "\\") {
            pattern = pattern + this.advance();
            if (this.pos < this.__len) {
              pattern = pattern + this.advance();
            }
          } else {
            if (ch == "/" && inCharClass == false) {
              this.advance();
              break;
            } else {
              if (ch == "\n" || ch == "\r" || ch == "\r\n") {
                return this.makeToken(
                  "RegexLiteral",
                  pattern,
                  startPos,
                  startLine,
                  startCol
                );
              } else {
                pattern = pattern + this.advance();
              }
            }
          }
        }
      }
    }
    let flags = "";
    while (this.pos < this.__len) {
      const ch_1 = this.peek();
      if (
        ch_1 == "g" ||
        ch_1 == "i" ||
        ch_1 == "m" ||
        ch_1 == "s" ||
        ch_1 == "u" ||
        ch_1 == "y"
      ) {
        flags = flags + this.advance();
      } else {
        break;
      }
    }
    const fullValue = pattern + "/" + flags;
    return this.makeToken(
      "RegexLiteral",
      fullValue,
      startPos,
      startLine,
      startCol
    );
  }
  tokenize() {
    let tokens = [];
    while (true) {
      const tok = this.nextToken();
      tokens.push(tok);
      if (tok.tokenType == "EOF") {
        return tokens;
      }
    }
    return tokens;
  }
}
class Position {
  constructor() {
    this.line = 1; /** note: unused */
    this.column = 0; /** note: unused */
  }
}
class SourceLocation {
  constructor() {}
}
class JSNode {
  constructor() {
    this.type = "";
    this.start = 0;
    this.end = 0;
    this.line = 0;
    this.col = 0;
    this.name = "";
    this.raw = "";
    this.regexPattern = "";
    this.regexFlags = "";
    this.operator = "";
    this.prefix = false;
    this.params = []; /** note: unused */
    this.generator = false;
    this.async = false;
    this.expression = false; /** note: unused */
    this.declarations = []; /** note: unused */
    this.kind = "";
    this.computed = false;
    this.optional = false; /** note: unused */
    this.arguments = []; /** note: unused */
    this.elements = []; /** note: unused */
    this.properties = []; /** note: unused */
    this.method = false; /** note: unused */
    this.shorthand = false;
    this.cases = []; /** note: unused */
    this.consequentStatements = []; /** note: unused */
    this.specifiers = []; /** note: unused */
    this.quasis = []; /** note: unused */
    this.expressions = []; /** note: unused */
    this.tail = false; /** note: unused */
    this.cooked = ""; /** note: unused */
    this.sourceType = ""; /** note: unused */
    this.static = false;
    this.delegate = false;
    this.children = [];
    this.leadingComments = [];
    this.trailingComments = []; /** note: unused */
  }
}
class SimpleParser {
  constructor() {
    this.tokens = [];
    this.pos = 0;
    this.errors = [];
    this.pendingComments = [];
    this.source = "";
  }
  initParser(toks) {
    this.tokens = toks;
    this.pos = 0;
    if (toks.length > 0) {
      this.currentToken = toks[0];
    }
    this.skipComments();
  }
  initParserWithSource(toks, src) {
    this.tokens = toks;
    this.source = src;
    this.lexer = new Lexer(src);
    this.pos = 0;
    if (toks.length > 0) {
      this.currentToken = toks[0];
    }
    this.skipComments();
  }
  isCommentToken() {
    const t = this.peekType();
    if (t == "LineComment") {
      return true;
    }
    if (t == "BlockComment") {
      return true;
    }
    if (t == "JSDocComment") {
      return true;
    }
    return false;
  }
  skipComments() {
    while (this.isCommentToken()) {
      const tok = this.peek();
      const commentNode = new JSNode();
      commentNode.type = tok.tokenType;
      commentNode.raw = tok.value;
      commentNode.line = tok.line;
      commentNode.col = tok.col;
      commentNode.start = tok.start;
      commentNode.end = tok.end;
      this.pendingComments.push(commentNode);
      this.advanceRaw();
    }
  }
  advanceRaw() {
    this.pos = this.pos + 1;
    if (this.pos < this.tokens.length) {
      this.currentToken = this.tokens[this.pos];
    } else {
      const eof = new Token();
      eof.tokenType = "EOF";
      eof.value = "";
      this.currentToken = eof;
    }
  }
  collectComments() {
    let comments = [];
    for (let i = 0; i < this.pendingComments.length; i++) {
      var c = this.pendingComments[i];
      comments.push(c);
    }
    let empty = [];
    this.pendingComments = empty;
    return comments;
  }
  attachComments(node) {
    const comments = this.collectComments();
    for (let i = 0; i < comments.length; i++) {
      var c = comments[i];
      node.leadingComments.push(c);
    }
  }
  peek() {
    return this.currentToken;
  }
  peekType() {
    if (typeof this.currentToken === "undefined") {
      return "EOF";
    }
    const tok = this.currentToken;
    return tok.tokenType;
  }
  peekValue() {
    if (typeof this.currentToken === "undefined") {
      return "";
    }
    const tok = this.currentToken;
    return tok.value;
  }
  advance() {
    this.advanceRaw();
    this.skipComments();
  }
  addError(msg) {
    this.errors.push(msg);
  }
  expect(expectedType) {
    const tok = this.peek();
    if (tok.tokenType != expectedType) {
      const err =
        "Parse error at line " +
        tok.line +
        ":" +
        tok.col +
        ": expected " +
        expectedType +
        " but got " +
        tok.tokenType;
      this.addError(err);
    }
    this.advance();
    return tok;
  }
  expectValue(expectedValue) {
    const tok = this.peek();
    if (tok.value != expectedValue) {
      const err =
        "Parse error at line " +
        tok.line +
        ":" +
        tok.col +
        ": expected '" +
        expectedValue +
        "' but got '" +
        tok.value +
        "'";
      this.addError(err);
    }
    this.advance();
    return tok;
  }
  isAtEnd() {
    const t = this.peekType();
    return t == "EOF";
  }
  matchType(tokenType) {
    const t = this.peekType();
    return t == tokenType;
  }
  matchValue(value) {
    const v = this.peekValue();
    return v == value;
  }
  hasErrors() {
    return this.errors.length > 0;
  }
  parseRegexLiteral() {
    const tok = this.peek();
    const startPos = tok.start;
    const startLine = tok.line;
    const startCol = tok.col;
    if (typeof this.lexer === "undefined") {
      const err = new JSNode();
      err.type = "Identifier";
      err.name = "regex_error";
      this.advance();
      return err;
    }
    const lex = this.lexer;
    lex.pos = startPos;
    lex.line = startLine;
    lex.col = startCol;
    const regexTok = lex.readRegexLiteral();
    const fullValue = regexTok.value;
    let pattern = "";
    let flags = "";
    let lastSlash = -1;
    let i = 0;
    while (i < fullValue.length) {
      const ch = fullValue[i];
      if (ch == "/") {
        lastSlash = i;
      }
      i = i + 1;
    }
    if (lastSlash >= 0) {
      pattern = fullValue.substring(0, lastSlash);
      flags = fullValue.substring(lastSlash + 1, fullValue.length);
    } else {
      pattern = fullValue;
    }
    const regex = new JSNode();
    regex.type = "Literal";
    regex.raw = fullValue;
    regex.regexPattern = pattern;
    regex.regexFlags = flags;
    regex.start = startPos;
    regex.end = lex.pos;
    regex.line = startLine;
    regex.col = startCol;
    this.advance();
    while (this.isAtEnd() == false) {
      const nextTok = this.peek();
      if (nextTok.start < lex.pos) {
        this.advance();
      } else {
        break;
      }
    }
    return regex;
  }
  parseProgram() {
    const prog = new JSNode();
    prog.type = "Program";
    while (this.isAtEnd() == false) {
      const stmt = this.parseStatement();
      prog.children.push(stmt);
    }
    return prog;
  }
  parseStatement() {
    const comments = this.collectComments();
    const tokVal = this.peekValue();
    let stmt;
    if (tokVal == "var") {
      stmt = this.parseVarDecl();
    }
    if (typeof stmt === "undefined" && tokVal == "let") {
      stmt = this.parseLetDecl();
    }
    if (typeof stmt === "undefined" && tokVal == "const") {
      stmt = this.parseConstDecl();
    }
    if (typeof stmt === "undefined" && tokVal == "function") {
      stmt = this.parseFuncDecl();
    }
    if (typeof stmt === "undefined" && tokVal == "async") {
      stmt = this.parseAsyncFuncDecl();
    }
    if (typeof stmt === "undefined" && tokVal == "class") {
      stmt = this.parseClass();
    }
    if (typeof stmt === "undefined" && tokVal == "import") {
      stmt = this.parseImport();
    }
    if (typeof stmt === "undefined" && tokVal == "export") {
      stmt = this.parseExport();
    }
    if (typeof stmt === "undefined" && tokVal == "return") {
      stmt = this.parseReturn();
    }
    if (typeof stmt === "undefined" && tokVal == "if") {
      stmt = this.parseIf();
    }
    if (typeof stmt === "undefined" && tokVal == "while") {
      stmt = this.parseWhile();
    }
    if (typeof stmt === "undefined" && tokVal == "do") {
      stmt = this.parseDoWhile();
    }
    if (typeof stmt === "undefined" && tokVal == "for") {
      stmt = this.parseFor();
    }
    if (typeof stmt === "undefined" && tokVal == "switch") {
      stmt = this.parseSwitch();
    }
    if (typeof stmt === "undefined" && tokVal == "try") {
      stmt = this.parseTry();
    }
    if (typeof stmt === "undefined" && tokVal == "throw") {
      stmt = this.parseThrow();
    }
    if (typeof stmt === "undefined" && tokVal == "break") {
      stmt = this.parseBreak();
    }
    if (typeof stmt === "undefined" && tokVal == "continue") {
      stmt = this.parseContinue();
    }
    if (typeof stmt === "undefined" && tokVal == "{") {
      stmt = this.parseBlock();
    }
    if (typeof stmt === "undefined" && tokVal == ";") {
      this.advance();
      const empty = new JSNode();
      empty.type = "EmptyStatement";
      stmt = empty;
    }
    if (typeof stmt === "undefined") {
      stmt = this.parseExprStmt();
    }
    const result = stmt;
    for (let i = 0; i < comments.length; i++) {
      var c = comments[i];
      result.leadingComments.push(c);
    }
    return result;
  }
  parseVarDecl() {
    const decl = new JSNode();
    decl.type = "VariableDeclaration";
    const startTok = this.peek();
    decl.start = startTok.start;
    decl.line = startTok.line;
    decl.col = startTok.col;
    this.expectValue("var");
    let first = true;
    while (first || this.matchValue(",")) {
      if (first == false) {
        this.advance();
      }
      first = false;
      const declarator = new JSNode();
      declarator.type = "VariableDeclarator";
      const idTok = this.expect("Identifier");
      const id = new JSNode();
      id.type = "Identifier";
      id.name = idTok.value;
      id.start = idTok.start;
      id.line = idTok.line;
      id.col = idTok.col;
      declarator.id = id;
      declarator.start = idTok.start;
      declarator.line = idTok.line;
      declarator.col = idTok.col;
      if (this.matchValue("=")) {
        this.advance();
        const initExpr = this.parseAssignment();
        declarator.init = initExpr;
      }
      decl.children.push(declarator);
    }
    if (this.matchValue(";")) {
      this.advance();
    }
    return decl;
  }
  parseLetDecl() {
    const decl = new JSNode();
    decl.type = "VariableDeclaration";
    decl.kind = "let";
    const startTok = this.peek();
    decl.start = startTok.start;
    decl.line = startTok.line;
    decl.col = startTok.col;
    this.expectValue("let");
    let first = true;
    while (first || this.matchValue(",")) {
      if (first == false) {
        this.advance();
      }
      first = false;
      const declarator = new JSNode();
      declarator.type = "VariableDeclarator";
      const declTok = this.peek();
      declarator.start = declTok.start;
      declarator.line = declTok.line;
      declarator.col = declTok.col;
      if (this.matchValue("[")) {
        const pattern = this.parseArrayPattern();
        declarator.id = pattern;
      } else {
        if (this.matchValue("{")) {
          const pattern_1 = this.parseObjectPattern();
          declarator.id = pattern_1;
        } else {
          const idTok = this.expect("Identifier");
          const id = new JSNode();
          id.type = "Identifier";
          id.name = idTok.value;
          id.start = idTok.start;
          id.line = idTok.line;
          id.col = idTok.col;
          declarator.id = id;
        }
      }
      if (this.matchValue("=")) {
        this.advance();
        const initExpr = this.parseAssignment();
        declarator.init = initExpr;
      }
      decl.children.push(declarator);
    }
    if (this.matchValue(";")) {
      this.advance();
    }
    return decl;
  }
  parseConstDecl() {
    const decl = new JSNode();
    decl.type = "VariableDeclaration";
    decl.kind = "const";
    const startTok = this.peek();
    decl.start = startTok.start;
    decl.line = startTok.line;
    decl.col = startTok.col;
    this.expectValue("const");
    let first = true;
    while (first || this.matchValue(",")) {
      if (first == false) {
        this.advance();
      }
      first = false;
      const declarator = new JSNode();
      declarator.type = "VariableDeclarator";
      const declTok = this.peek();
      declarator.start = declTok.start;
      declarator.line = declTok.line;
      declarator.col = declTok.col;
      if (this.matchValue("[")) {
        const pattern = this.parseArrayPattern();
        declarator.id = pattern;
      } else {
        if (this.matchValue("{")) {
          const pattern_1 = this.parseObjectPattern();
          declarator.id = pattern_1;
        } else {
          const idTok = this.expect("Identifier");
          const id = new JSNode();
          id.type = "Identifier";
          id.name = idTok.value;
          id.start = idTok.start;
          id.line = idTok.line;
          id.col = idTok.col;
          declarator.id = id;
        }
      }
      if (this.matchValue("=")) {
        this.advance();
        const initExpr = this.parseAssignment();
        declarator.init = initExpr;
      }
      decl.children.push(declarator);
    }
    if (this.matchValue(";")) {
      this.advance();
    }
    return decl;
  }
  parseFuncDecl() {
    const _func = new JSNode();
    _func.type = "FunctionDeclaration";
    const startTok = this.peek();
    _func.start = startTok.start;
    _func.line = startTok.line;
    _func.col = startTok.col;
    this.expectValue("function");
    if (this.matchValue("*")) {
      _func.generator = true;
      this.advance();
    }
    const idTok = this.expect("Identifier");
    _func.name = idTok.value;
    this.expectValue("(");
    while (this.matchValue(")") == false && this.isAtEnd() == false) {
      if (_func.children.length > 0) {
        this.expectValue(",");
      }
      if (this.matchValue(")") || this.isAtEnd()) {
        break;
      }
      if (this.matchValue("...")) {
        const restTok = this.peek();
        this.advance();
        const paramTok = this.expect("Identifier");
        const rest = new JSNode();
        rest.type = "RestElement";
        rest.name = paramTok.value;
        rest.start = restTok.start;
        rest.line = restTok.line;
        rest.col = restTok.col;
        const argNode = new JSNode();
        argNode.type = "Identifier";
        argNode.name = paramTok.value;
        argNode.start = paramTok.start;
        argNode.line = paramTok.line;
        argNode.col = paramTok.col;
        rest.argument = argNode;
        _func.children.push(rest);
      } else {
        if (this.matchValue("[")) {
          const pattern = this.parseArrayPattern();
          if (this.matchValue("=")) {
            this.advance();
            const defaultVal = this.parseAssignment();
            const assignPat = new JSNode();
            assignPat.type = "AssignmentPattern";
            assignPat.left = pattern;
            assignPat.right = defaultVal;
            assignPat.start = pattern.start;
            assignPat.line = pattern.line;
            assignPat.col = pattern.col;
            _func.children.push(assignPat);
          } else {
            _func.children.push(pattern);
          }
        } else {
          if (this.matchValue("{")) {
            const pattern_1 = this.parseObjectPattern();
            if (this.matchValue("=")) {
              this.advance();
              const defaultVal_1 = this.parseAssignment();
              const assignPat_1 = new JSNode();
              assignPat_1.type = "AssignmentPattern";
              assignPat_1.left = pattern_1;
              assignPat_1.right = defaultVal_1;
              assignPat_1.start = pattern_1.start;
              assignPat_1.line = pattern_1.line;
              assignPat_1.col = pattern_1.col;
              _func.children.push(assignPat_1);
            } else {
              _func.children.push(pattern_1);
            }
          } else {
            const paramTok_1 = this.expect("Identifier");
            const param = new JSNode();
            param.type = "Identifier";
            param.name = paramTok_1.value;
            param.start = paramTok_1.start;
            param.line = paramTok_1.line;
            param.col = paramTok_1.col;
            if (this.matchValue("=")) {
              this.advance();
              const defaultVal_2 = this.parseAssignment();
              const assignPat_2 = new JSNode();
              assignPat_2.type = "AssignmentPattern";
              assignPat_2.left = param;
              assignPat_2.right = defaultVal_2;
              assignPat_2.start = param.start;
              assignPat_2.line = param.line;
              assignPat_2.col = param.col;
              _func.children.push(assignPat_2);
            } else {
              _func.children.push(param);
            }
          }
        }
      }
    }
    this.expectValue(")");
    const body = this.parseBlock();
    _func.body = body;
    return _func;
  }
  parseFunctionExpression() {
    const _func = new JSNode();
    _func.type = "FunctionExpression";
    const startTok = this.peek();
    _func.start = startTok.start;
    _func.line = startTok.line;
    _func.col = startTok.col;
    this.expectValue("function");
    if (this.matchValue("*")) {
      _func.generator = true;
      this.advance();
    }
    if (this.matchType("Identifier")) {
      const idTok = this.expect("Identifier");
      _func.name = idTok.value;
    }
    this.expectValue("(");
    while (this.matchValue(")") == false && this.isAtEnd() == false) {
      if (_func.children.length > 0) {
        this.expectValue(",");
      }
      if (this.matchValue(")") || this.isAtEnd()) {
        break;
      }
      if (this.matchValue("...")) {
        const restTok = this.peek();
        this.advance();
        const paramTok = this.expect("Identifier");
        const rest = new JSNode();
        rest.type = "RestElement";
        rest.name = paramTok.value;
        rest.start = restTok.start;
        rest.line = restTok.line;
        rest.col = restTok.col;
        const argNode = new JSNode();
        argNode.type = "Identifier";
        argNode.name = paramTok.value;
        argNode.start = paramTok.start;
        argNode.line = paramTok.line;
        argNode.col = paramTok.col;
        rest.argument = argNode;
        _func.children.push(rest);
      } else {
        if (this.matchValue("[")) {
          const pattern = this.parseArrayPattern();
          if (this.matchValue("=")) {
            this.advance();
            const defaultVal = this.parseAssignment();
            const assignPat = new JSNode();
            assignPat.type = "AssignmentPattern";
            assignPat.left = pattern;
            assignPat.right = defaultVal;
            assignPat.start = pattern.start;
            assignPat.line = pattern.line;
            assignPat.col = pattern.col;
            _func.children.push(assignPat);
          } else {
            _func.children.push(pattern);
          }
        } else {
          if (this.matchValue("{")) {
            const pattern_1 = this.parseObjectPattern();
            if (this.matchValue("=")) {
              this.advance();
              const defaultVal_1 = this.parseAssignment();
              const assignPat_1 = new JSNode();
              assignPat_1.type = "AssignmentPattern";
              assignPat_1.left = pattern_1;
              assignPat_1.right = defaultVal_1;
              assignPat_1.start = pattern_1.start;
              assignPat_1.line = pattern_1.line;
              assignPat_1.col = pattern_1.col;
              _func.children.push(assignPat_1);
            } else {
              _func.children.push(pattern_1);
            }
          } else {
            const paramTok_1 = this.expect("Identifier");
            const param = new JSNode();
            param.type = "Identifier";
            param.name = paramTok_1.value;
            param.start = paramTok_1.start;
            param.line = paramTok_1.line;
            param.col = paramTok_1.col;
            if (this.matchValue("=")) {
              this.advance();
              const defaultVal_2 = this.parseAssignment();
              const assignPat_2 = new JSNode();
              assignPat_2.type = "AssignmentPattern";
              assignPat_2.left = param;
              assignPat_2.right = defaultVal_2;
              assignPat_2.start = param.start;
              assignPat_2.line = param.line;
              assignPat_2.col = param.col;
              _func.children.push(assignPat_2);
            } else {
              _func.children.push(param);
            }
          }
        }
      }
    }
    this.expectValue(")");
    const body = this.parseBlock();
    _func.body = body;
    return _func;
  }
  parseAsyncFuncDecl() {
    const _func = new JSNode();
    _func.type = "FunctionDeclaration";
    const startTok = this.peek();
    _func.start = startTok.start;
    _func.line = startTok.line;
    _func.col = startTok.col;
    _func.async = true;
    this.expectValue("async");
    this.expectValue("function");
    if (this.matchValue("*")) {
      _func.async = true;
      _func.generator = true;
      this.advance();
    }
    const idTok = this.expect("Identifier");
    _func.name = idTok.value;
    this.expectValue("(");
    while (this.matchValue(")") == false && this.isAtEnd() == false) {
      if (_func.children.length > 0) {
        this.expectValue(",");
      }
      if (this.matchValue(")") || this.isAtEnd()) {
        break;
      }
      const paramTok = this.expect("Identifier");
      const param = new JSNode();
      param.type = "Identifier";
      param.name = paramTok.value;
      param.start = paramTok.start;
      param.line = paramTok.line;
      param.col = paramTok.col;
      _func.children.push(param);
    }
    this.expectValue(")");
    const body = this.parseBlock();
    _func.body = body;
    return _func;
  }
  parseClass() {
    const classNode = new JSNode();
    classNode.type = "ClassDeclaration";
    const startTok = this.peek();
    classNode.start = startTok.start;
    classNode.line = startTok.line;
    classNode.col = startTok.col;
    this.expectValue("class");
    const idTok = this.expect("Identifier");
    classNode.name = idTok.value;
    if (this.matchValue("extends")) {
      this.advance();
      const superTok = this.expect("Identifier");
      const superClassNode = new JSNode();
      superClassNode.type = "Identifier";
      superClassNode.name = superTok.value;
      superClassNode.start = superTok.start;
      superClassNode.line = superTok.line;
      superClassNode.col = superTok.col;
      classNode.superClass = superClassNode;
    }
    const body = new JSNode();
    body.type = "ClassBody";
    const bodyStart = this.peek();
    body.start = bodyStart.start;
    body.line = bodyStart.line;
    body.col = bodyStart.col;
    this.expectValue("{");
    while (this.matchValue("}") == false && this.isAtEnd() == false) {
      const method = this.parseClassMethod();
      body.children.push(method);
    }
    this.expectValue("}");
    classNode.body = body;
    return classNode;
  }
  parseClassMethod() {
    const method = new JSNode();
    method.type = "MethodDefinition";
    const startTok = this.peek();
    method.start = startTok.start;
    method.line = startTok.line;
    method.col = startTok.col;
    let isStatic = false;
    if (this.matchValue("static")) {
      isStatic = true;
      method.static = true;
      this.advance();
    }
    let methodKind = "method";
    if (this.matchValue("get")) {
      const nextTok = this.peekAt(1);
      if (nextTok != "(") {
        methodKind = "get";
        this.advance();
      }
    }
    if (this.matchValue("set")) {
      const nextTok_1 = this.peekAt(1);
      if (nextTok_1 != "(") {
        methodKind = "set";
        this.advance();
      }
    }
    const nameTok = this.expect("Identifier");
    const keyNode = new JSNode();
    keyNode.type = "Identifier";
    keyNode.name = nameTok.value;
    keyNode.start = nameTok.start;
    keyNode.line = nameTok.line;
    keyNode.col = nameTok.col;
    method.key = keyNode;
    if (nameTok.value == "constructor") {
      methodKind = "constructor";
    }
    method.kind = methodKind;
    const _func = new JSNode();
    _func.type = "FunctionExpression";
    _func.start = nameTok.start;
    _func.line = nameTok.line;
    _func.col = nameTok.col;
    this.expectValue("(");
    while (this.matchValue(")") == false && this.isAtEnd() == false) {
      if (_func.children.length > 0) {
        this.expectValue(",");
      }
      if (this.matchValue(")") || this.isAtEnd()) {
        break;
      }
      const paramTok = this.expect("Identifier");
      const param = new JSNode();
      param.type = "Identifier";
      param.name = paramTok.value;
      param.start = paramTok.start;
      param.line = paramTok.line;
      param.col = paramTok.col;
      _func.children.push(param);
    }
    this.expectValue(")");
    const funcBody = this.parseBlock();
    _func.body = funcBody;
    method.body = _func;
    return method;
  }
  peekAt(offset) {
    const targetPos = this.pos + offset;
    if (targetPos >= this.tokens.length) {
      return "";
    }
    const tok = this.tokens[targetPos];
    return tok.value;
  }
  parseImport() {
    const importNode = new JSNode();
    importNode.type = "ImportDeclaration";
    const startTok = this.peek();
    importNode.start = startTok.start;
    importNode.line = startTok.line;
    importNode.col = startTok.col;
    this.expectValue("import");
    if (this.matchType("String")) {
      const sourceTok = this.peek();
      this.advance();
      const source_1 = new JSNode();
      source_1.type = "Literal";
      source_1.raw = sourceTok.value;
      source_1.start = sourceTok.start;
      source_1.line = sourceTok.line;
      source_1.col = sourceTok.col;
      importNode.right = source_1;
      if (this.matchValue(";")) {
        this.advance();
      }
      return importNode;
    }
    if (this.matchValue("*")) {
      this.advance();
      this.expectValue("as");
      const localTok = this.expect("Identifier");
      const specifier = new JSNode();
      specifier.type = "ImportNamespaceSpecifier";
      specifier.name = localTok.value;
      specifier.start = localTok.start;
      specifier.line = localTok.line;
      specifier.col = localTok.col;
      importNode.children.push(specifier);
      this.expectValue("from");
      const sourceTok_1 = this.expect("String");
      const source_2 = new JSNode();
      source_2.type = "Literal";
      source_2.raw = sourceTok_1.value;
      source_2.start = sourceTok_1.start;
      source_2.line = sourceTok_1.line;
      source_2.col = sourceTok_1.col;
      importNode.right = source_2;
      if (this.matchValue(";")) {
        this.advance();
      }
      return importNode;
    }
    if (this.matchType("Identifier")) {
      const defaultTok = this.expect("Identifier");
      const defaultSpec = new JSNode();
      defaultSpec.type = "ImportDefaultSpecifier";
      const localNode = new JSNode();
      localNode.type = "Identifier";
      localNode.name = defaultTok.value;
      localNode.start = defaultTok.start;
      localNode.line = defaultTok.line;
      localNode.col = defaultTok.col;
      defaultSpec.local = localNode;
      defaultSpec.start = defaultTok.start;
      defaultSpec.line = defaultTok.line;
      defaultSpec.col = defaultTok.col;
      importNode.children.push(defaultSpec);
      if (this.matchValue(",")) {
        this.advance();
        if (this.matchValue("*")) {
          this.advance();
          this.expectValue("as");
          const localTok2 = this.expect("Identifier");
          const nsSpec = new JSNode();
          nsSpec.type = "ImportNamespaceSpecifier";
          const nsLocal = new JSNode();
          nsLocal.type = "Identifier";
          nsLocal.name = localTok2.value;
          nsLocal.start = localTok2.start;
          nsLocal.line = localTok2.line;
          nsLocal.col = localTok2.col;
          nsSpec.local = nsLocal;
          nsSpec.start = localTok2.start;
          nsSpec.line = localTok2.line;
          nsSpec.col = localTok2.col;
          importNode.children.push(nsSpec);
        } else {
          this.parseImportSpecifiers(importNode);
        }
      }
      this.expectValue("from");
    } else {
      if (this.matchValue("{")) {
        this.parseImportSpecifiers(importNode);
        this.expectValue("from");
      }
    }
    const sourceTok_2 = this.expect("String");
    const source_3 = new JSNode();
    source_3.type = "Literal";
    source_3.raw = sourceTok_2.value;
    source_3.start = sourceTok_2.start;
    source_3.line = sourceTok_2.line;
    source_3.col = sourceTok_2.col;
    importNode.right = source_3;
    if (this.matchValue(";")) {
      this.advance();
    }
    return importNode;
  }
  parseImportSpecifiers(importNode) {
    this.expectValue("{");
    while (this.matchValue("}") == false && this.isAtEnd() == false) {
      if (importNode.children.length > 0) {
        if (this.matchValue(",")) {
          this.advance();
        }
      }
      if (this.matchValue("}") || this.isAtEnd()) {
        break;
      }
      const specifier = new JSNode();
      specifier.type = "ImportSpecifier";
      const importedTok = this.expect("Identifier");
      const importedNode = new JSNode();
      importedNode.type = "Identifier";
      importedNode.name = importedTok.value;
      importedNode.start = importedTok.start;
      importedNode.line = importedTok.line;
      importedNode.col = importedTok.col;
      specifier.imported = importedNode;
      specifier.start = importedTok.start;
      specifier.line = importedTok.line;
      specifier.col = importedTok.col;
      if (this.matchValue("as")) {
        this.advance();
        const localTok = this.expect("Identifier");
        const localNode = new JSNode();
        localNode.type = "Identifier";
        localNode.name = localTok.value;
        localNode.start = localTok.start;
        localNode.line = localTok.line;
        localNode.col = localTok.col;
        specifier.local = localNode;
      } else {
        specifier.local = importedNode;
      }
      importNode.children.push(specifier);
    }
    this.expectValue("}");
  }
  parseExport() {
    const exportNode = new JSNode();
    exportNode.type = "ExportNamedDeclaration";
    const startTok = this.peek();
    exportNode.start = startTok.start;
    exportNode.line = startTok.line;
    exportNode.col = startTok.col;
    this.expectValue("export");
    if (this.matchValue("default")) {
      exportNode.type = "ExportDefaultDeclaration";
      this.advance();
      if (this.matchValue("function")) {
        const _func = this.parseFuncDecl();
        exportNode.left = _func;
      } else {
        if (this.matchValue("async")) {
          const func_1 = this.parseAsyncFuncDecl();
          exportNode.left = func_1;
        } else {
          if (this.matchValue("class")) {
            const cls = this.parseClass();
            exportNode.left = cls;
          } else {
            const expr = this.parseAssignment();
            exportNode.left = expr;
            if (this.matchValue(";")) {
              this.advance();
            }
          }
        }
      }
      return exportNode;
    }
    if (this.matchValue("*")) {
      exportNode.type = "ExportAllDeclaration";
      this.advance();
      if (this.matchValue("as")) {
        this.advance();
        const exportedTok = this.expect("Identifier");
        exportNode.name = exportedTok.value;
      }
      this.expectValue("from");
      const sourceTok = this.expect("String");
      const source_1 = new JSNode();
      source_1.type = "Literal";
      source_1.raw = sourceTok.value;
      source_1.start = sourceTok.start;
      source_1.line = sourceTok.line;
      source_1.col = sourceTok.col;
      exportNode.right = source_1;
      if (this.matchValue(";")) {
        this.advance();
      }
      return exportNode;
    }
    if (this.matchValue("{")) {
      this.parseExportSpecifiers(exportNode);
      if (this.matchValue("from")) {
        this.advance();
        const sourceTok_1 = this.expect("String");
        const source_2 = new JSNode();
        source_2.type = "Literal";
        source_2.raw = sourceTok_1.value;
        source_2.start = sourceTok_1.start;
        source_2.line = sourceTok_1.line;
        source_2.col = sourceTok_1.col;
        exportNode.right = source_2;
      }
      if (this.matchValue(";")) {
        this.advance();
      }
      return exportNode;
    }
    if (this.matchValue("const")) {
      const decl = this.parseConstDecl();
      exportNode.left = decl;
      return exportNode;
    }
    if (this.matchValue("let")) {
      const decl_1 = this.parseLetDecl();
      exportNode.left = decl_1;
      return exportNode;
    }
    if (this.matchValue("var")) {
      const decl_2 = this.parseVarDecl();
      exportNode.left = decl_2;
      return exportNode;
    }
    if (this.matchValue("function")) {
      const func_2 = this.parseFuncDecl();
      exportNode.left = func_2;
      return exportNode;
    }
    if (this.matchValue("async")) {
      const func_3 = this.parseAsyncFuncDecl();
      exportNode.left = func_3;
      return exportNode;
    }
    if (this.matchValue("class")) {
      const cls_1 = this.parseClass();
      exportNode.left = cls_1;
      return exportNode;
    }
    const expr_1 = this.parseExprStmt();
    exportNode.left = expr_1;
    return exportNode;
  }
  parseExportSpecifiers(exportNode) {
    this.expectValue("{");
    while (this.matchValue("}") == false && this.isAtEnd() == false) {
      const numChildren = exportNode.children.length;
      if (numChildren > 0) {
        if (this.matchValue(",")) {
          this.advance();
        }
      }
      if (this.matchValue("}") || this.isAtEnd()) {
        break;
      }
      const specifier = new JSNode();
      specifier.type = "ExportSpecifier";
      const localTok = this.peek();
      if (this.matchType("Identifier") || this.matchValue("default")) {
        this.advance();
        const localNode = new JSNode();
        localNode.type = "Identifier";
        localNode.name = localTok.value;
        localNode.start = localTok.start;
        localNode.line = localTok.line;
        localNode.col = localTok.col;
        specifier.local = localNode;
        specifier.start = localTok.start;
        specifier.line = localTok.line;
        specifier.col = localTok.col;
      } else {
        const err =
          "Parse error at line " +
          localTok.line +
          ":" +
          localTok.col +
          ": expected Identifier but got " +
          localTok.tokenType;
        this.addError(err);
        this.advance();
      }
      if (this.matchValue("as")) {
        this.advance();
        const exportedTok = this.expect("Identifier");
        const exportedNode = new JSNode();
        exportedNode.type = "Identifier";
        exportedNode.name = exportedTok.value;
        exportedNode.start = exportedTok.start;
        exportedNode.line = exportedTok.line;
        exportedNode.col = exportedTok.col;
        specifier.exported = exportedNode;
      } else {
        specifier.exported = specifier.local;
      }
      exportNode.children.push(specifier);
    }
    this.expectValue("}");
  }
  parseBlock() {
    const block = new JSNode();
    block.type = "BlockStatement";
    const startTok = this.peek();
    block.start = startTok.start;
    block.line = startTok.line;
    block.col = startTok.col;
    this.expectValue("{");
    while (this.matchValue("}") == false && this.isAtEnd() == false) {
      const stmt = this.parseStatement();
      block.children.push(stmt);
    }
    this.expectValue("}");
    return block;
  }
  parseReturn() {
    const ret = new JSNode();
    ret.type = "ReturnStatement";
    const startTok = this.peek();
    ret.start = startTok.start;
    ret.line = startTok.line;
    ret.col = startTok.col;
    this.expectValue("return");
    if (this.matchValue(";") == false && this.isAtEnd() == false) {
      const arg = this.parseExpr();
      ret.left = arg;
    }
    if (this.matchValue(";")) {
      this.advance();
    }
    return ret;
  }
  parseIf() {
    const ifStmt = new JSNode();
    ifStmt.type = "IfStatement";
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
    if (this.matchValue("else")) {
      this.advance();
      const alt = this.parseStatement();
      ifStmt.alternate = alt;
    }
    return ifStmt;
  }
  parseWhile() {
    const whileStmt = new JSNode();
    whileStmt.type = "WhileStatement";
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
  }
  parseDoWhile() {
    const doWhileStmt = new JSNode();
    doWhileStmt.type = "DoWhileStatement";
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
    if (this.matchValue(";")) {
      this.advance();
    }
    return doWhileStmt;
  }
  parseFor() {
    const forStmt = new JSNode();
    const startTok = this.peek();
    forStmt.start = startTok.start;
    forStmt.line = startTok.line;
    forStmt.col = startTok.col;
    this.expectValue("for");
    this.expectValue("(");
    let isForOf = false;
    let isForIn = false;
    let leftNode;
    if (this.matchValue(";") == false) {
      if (
        this.matchValue("var") ||
        this.matchValue("let") ||
        this.matchValue("const")
      ) {
        const keyword = this.peekValue();
        this.advance();
        const declarator = new JSNode();
        declarator.type = "VariableDeclarator";
        const declTok = this.peek();
        declarator.start = declTok.start;
        declarator.line = declTok.line;
        declarator.col = declTok.col;
        if (this.matchValue("[")) {
          const pattern = this.parseArrayPattern();
          declarator.id = pattern;
        } else {
          if (this.matchValue("{")) {
            const pattern_1 = this.parseObjectPattern();
            declarator.id = pattern_1;
          } else {
            const idTok = this.expect("Identifier");
            const id = new JSNode();
            id.type = "Identifier";
            id.name = idTok.value;
            id.start = idTok.start;
            id.line = idTok.line;
            id.col = idTok.col;
            declarator.id = id;
          }
        }
        if (this.matchValue("of")) {
          isForOf = true;
          this.advance();
          const varDecl = new JSNode();
          varDecl.type = "VariableDeclaration";
          varDecl.kind = keyword;
          varDecl.start = declTok.start;
          varDecl.line = declTok.line;
          varDecl.col = declTok.col;
          varDecl.children.push(declarator);
          leftNode = varDecl;
        } else {
          if (this.matchValue("in")) {
            isForIn = true;
            this.advance();
            const varDecl_1 = new JSNode();
            varDecl_1.type = "VariableDeclaration";
            varDecl_1.kind = keyword;
            varDecl_1.start = declTok.start;
            varDecl_1.line = declTok.line;
            varDecl_1.col = declTok.col;
            varDecl_1.children.push(declarator);
            leftNode = varDecl_1;
          } else {
            if (this.matchValue("=")) {
              this.advance();
              const initVal = this.parseAssignment();
              declarator.init = initVal;
            }
            const varDecl_2 = new JSNode();
            varDecl_2.type = "VariableDeclaration";
            varDecl_2.kind = keyword;
            varDecl_2.start = declTok.start;
            varDecl_2.line = declTok.line;
            varDecl_2.col = declTok.col;
            varDecl_2.children.push(declarator);
            leftNode = varDecl_2;
            if (this.matchValue(";")) {
              this.advance();
            }
          }
        }
      } else {
        const initExpr = this.parseExpr();
        if (this.matchValue("of")) {
          isForOf = true;
          this.advance();
          leftNode = initExpr;
        } else {
          if (this.matchValue("in")) {
            isForIn = true;
            this.advance();
            leftNode = initExpr;
          } else {
            leftNode = initExpr;
            if (this.matchValue(";")) {
              this.advance();
            }
          }
        }
      }
    } else {
      this.advance();
    }
    if (isForOf) {
      forStmt.type = "ForOfStatement";
      forStmt.left = leftNode;
      const rightExpr = this.parseExpr();
      forStmt.right = rightExpr;
      this.expectValue(")");
      const body = this.parseStatement();
      forStmt.body = body;
      return forStmt;
    }
    if (isForIn) {
      forStmt.type = "ForInStatement";
      forStmt.left = leftNode;
      const rightExpr_1 = this.parseExpr();
      forStmt.right = rightExpr_1;
      this.expectValue(")");
      const body_1 = this.parseStatement();
      forStmt.body = body_1;
      return forStmt;
    }
    forStmt.type = "ForStatement";
    if (typeof leftNode !== "undefined" && leftNode != null) {
      forStmt.left = leftNode;
    }
    if (this.matchValue(";") == false) {
      const test = this.parseExpr();
      forStmt.test = test;
    }
    if (this.matchValue(";")) {
      this.advance();
    }
    if (this.matchValue(")") == false) {
      const update = this.parseExpr();
      forStmt.right = update;
    }
    this.expectValue(")");
    const body_2 = this.parseStatement();
    forStmt.body = body_2;
    return forStmt;
  }
  parseSwitch() {
    const switchStmt = new JSNode();
    switchStmt.type = "SwitchStatement";
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
    while (this.matchValue("}") == false && this.isAtEnd() == false) {
      const caseNode = new JSNode();
      if (this.matchValue("case")) {
        caseNode.type = "SwitchCase";
        const caseTok = this.peek();
        caseNode.start = caseTok.start;
        caseNode.line = caseTok.line;
        caseNode.col = caseTok.col;
        this.advance();
        const testExpr = this.parseExpr();
        caseNode.test = testExpr;
        this.expectValue(":");
        while (
          this.matchValue("case") == false &&
          this.matchValue("default") == false &&
          this.matchValue("}") == false &&
          this.isAtEnd() == false
        ) {
          const stmt = this.parseStatement();
          caseNode.children.push(stmt);
        }
        switchStmt.children.push(caseNode);
      } else {
        if (this.matchValue("default")) {
          caseNode.type = "SwitchCase";
          caseNode.name = "default";
          const defTok = this.peek();
          caseNode.start = defTok.start;
          caseNode.line = defTok.line;
          caseNode.col = defTok.col;
          this.advance();
          this.expectValue(":");
          while (
            this.matchValue("case") == false &&
            this.matchValue("}") == false &&
            this.isAtEnd() == false
          ) {
            const stmt_1 = this.parseStatement();
            caseNode.children.push(stmt_1);
          }
          switchStmt.children.push(caseNode);
        } else {
          this.advance();
        }
      }
    }
    this.expectValue("}");
    return switchStmt;
  }
  parseTry() {
    const tryStmt = new JSNode();
    tryStmt.type = "TryStatement";
    const startTok = this.peek();
    tryStmt.start = startTok.start;
    tryStmt.line = startTok.line;
    tryStmt.col = startTok.col;
    this.expectValue("try");
    const block = this.parseBlock();
    tryStmt.body = block;
    if (this.matchValue("catch")) {
      const catchNode = new JSNode();
      catchNode.type = "CatchClause";
      const catchTok = this.peek();
      catchNode.start = catchTok.start;
      catchNode.line = catchTok.line;
      catchNode.col = catchTok.col;
      this.advance();
      this.expectValue("(");
      const paramTok = this.expect("Identifier");
      catchNode.name = paramTok.value;
      this.expectValue(")");
      const catchBody = this.parseBlock();
      catchNode.body = catchBody;
      tryStmt.left = catchNode;
    }
    if (this.matchValue("finally")) {
      this.advance();
      const finallyBlock = this.parseBlock();
      tryStmt.right = finallyBlock;
    }
    return tryStmt;
  }
  parseThrow() {
    const throwStmt = new JSNode();
    throwStmt.type = "ThrowStatement";
    const startTok = this.peek();
    throwStmt.start = startTok.start;
    throwStmt.line = startTok.line;
    throwStmt.col = startTok.col;
    this.expectValue("throw");
    const arg = this.parseExpr();
    throwStmt.left = arg;
    if (this.matchValue(";")) {
      this.advance();
    }
    return throwStmt;
  }
  parseBreak() {
    const breakStmt = new JSNode();
    breakStmt.type = "BreakStatement";
    const startTok = this.peek();
    breakStmt.start = startTok.start;
    breakStmt.line = startTok.line;
    breakStmt.col = startTok.col;
    this.expectValue("break");
    if (this.matchType("Identifier")) {
      const labelTok = this.peek();
      breakStmt.name = labelTok.value;
      this.advance();
    }
    if (this.matchValue(";")) {
      this.advance();
    }
    return breakStmt;
  }
  parseContinue() {
    const contStmt = new JSNode();
    contStmt.type = "ContinueStatement";
    const startTok = this.peek();
    contStmt.start = startTok.start;
    contStmt.line = startTok.line;
    contStmt.col = startTok.col;
    this.expectValue("continue");
    if (this.matchType("Identifier")) {
      const labelTok = this.peek();
      contStmt.name = labelTok.value;
      this.advance();
    }
    if (this.matchValue(";")) {
      this.advance();
    }
    return contStmt;
  }
  parseExprStmt() {
    const stmt = new JSNode();
    stmt.type = "ExpressionStatement";
    const startTok = this.peek();
    stmt.start = startTok.start;
    stmt.line = startTok.line;
    stmt.col = startTok.col;
    const expr = this.parseExpr();
    stmt.left = expr;
    if (this.matchValue(";")) {
      this.advance();
    }
    return stmt;
  }
  parseExpr() {
    return this.parseAssignment();
  }
  parseAssignment() {
    const left = this.parseTernary();
    const tokVal = this.peekValue();
    if (
      tokVal == "=" ||
      tokVal == "+=" ||
      tokVal == "-=" ||
      tokVal == "*=" ||
      tokVal == "/=" ||
      tokVal == "%=" ||
      tokVal == "**=" ||
      tokVal == "<<=" ||
      tokVal == ">>=" ||
      tokVal == ">>>=" ||
      tokVal == "&=" ||
      tokVal == "^=" ||
      tokVal == "|=" ||
      tokVal == "&&=" ||
      tokVal == "||=" ||
      tokVal == "??="
    ) {
      const opTok = this.peek();
      this.advance();
      const right = this.parseAssignment();
      const assign = new JSNode();
      assign.type = "AssignmentExpression";
      assign.operator = opTok.value;
      assign.left = left;
      assign.right = right;
      assign.start = left.start;
      assign.line = left.line;
      assign.col = left.col;
      return assign;
    }
    return left;
  }
  parseTernary() {
    const condition = this.parseLogicalOr();
    if (this.matchValue("?")) {
      this.advance();
      const consequent = this.parseAssignment();
      this.expectValue(":");
      const alternate = this.parseAssignment();
      const ternary = new JSNode();
      ternary.type = "ConditionalExpression";
      ternary.left = condition;
      ternary.body = consequent;
      ternary.right = alternate;
      ternary.start = condition.start;
      ternary.line = condition.line;
      ternary.col = condition.col;
      return ternary;
    }
    return condition;
  }
  parseLogicalOr() {
    let left = this.parseNullishCoalescing();
    while (this.matchValue("||")) {
      const opTok = this.peek();
      this.advance();
      const right = this.parseNullishCoalescing();
      const binary = new JSNode();
      binary.type = "LogicalExpression";
      binary.operator = opTok.value;
      binary.left = left;
      binary.right = right;
      binary.start = left.start;
      binary.line = left.line;
      binary.col = left.col;
      left = binary;
    }
    return left;
  }
  parseNullishCoalescing() {
    let left = this.parseLogicalAnd();
    while (this.matchValue("??")) {
      const opTok = this.peek();
      this.advance();
      const right = this.parseLogicalAnd();
      const binary = new JSNode();
      binary.type = "LogicalExpression";
      binary.operator = opTok.value;
      binary.left = left;
      binary.right = right;
      binary.start = left.start;
      binary.line = left.line;
      binary.col = left.col;
      left = binary;
    }
    return left;
  }
  parseLogicalAnd() {
    let left = this.parseEquality();
    while (this.matchValue("&&")) {
      const opTok = this.peek();
      this.advance();
      const right = this.parseEquality();
      const binary = new JSNode();
      binary.type = "LogicalExpression";
      binary.operator = opTok.value;
      binary.left = left;
      binary.right = right;
      binary.start = left.start;
      binary.line = left.line;
      binary.col = left.col;
      left = binary;
    }
    return left;
  }
  parseEquality() {
    let left = this.parseComparison();
    let tokVal = this.peekValue();
    while (
      tokVal == "==" ||
      tokVal == "!=" ||
      tokVal == "===" ||
      tokVal == "!=="
    ) {
      const opTok = this.peek();
      this.advance();
      const right = this.parseComparison();
      const binary = new JSNode();
      binary.type = "BinaryExpression";
      binary.operator = opTok.value;
      binary.left = left;
      binary.right = right;
      binary.start = left.start;
      binary.line = left.line;
      binary.col = left.col;
      left = binary;
      tokVal = this.peekValue();
    }
    return left;
  }
  parseComparison() {
    let left = this.parseAdditive();
    let tokVal = this.peekValue();
    while (tokVal == "<" || tokVal == ">" || tokVal == "<=" || tokVal == ">=") {
      const opTok = this.peek();
      this.advance();
      const right = this.parseAdditive();
      const binary = new JSNode();
      binary.type = "BinaryExpression";
      binary.operator = opTok.value;
      binary.left = left;
      binary.right = right;
      binary.start = left.start;
      binary.line = left.line;
      binary.col = left.col;
      left = binary;
      tokVal = this.peekValue();
    }
    return left;
  }
  parseAdditive() {
    let left = this.parseMultiplicative();
    let tokVal = this.peekValue();
    while (tokVal == "+" || tokVal == "-") {
      const opTok = this.peek();
      this.advance();
      const right = this.parseMultiplicative();
      const binary = new JSNode();
      binary.type = "BinaryExpression";
      binary.operator = opTok.value;
      binary.left = left;
      binary.right = right;
      binary.start = left.start;
      binary.line = left.line;
      binary.col = left.col;
      left = binary;
      tokVal = this.peekValue();
    }
    return left;
  }
  parseMultiplicative() {
    let left = this.parseUnary();
    let tokVal = this.peekValue();
    while (tokVal == "*" || tokVal == "/" || tokVal == "%") {
      const opTok = this.peek();
      this.advance();
      const right = this.parseUnary();
      const binary = new JSNode();
      binary.type = "BinaryExpression";
      binary.operator = opTok.value;
      binary.left = left;
      binary.right = right;
      binary.start = left.start;
      binary.line = left.line;
      binary.col = left.col;
      left = binary;
      tokVal = this.peekValue();
    }
    return left;
  }
  parseUnary() {
    const tokType = this.peekType();
    const tokVal = this.peekValue();
    if (tokType == "Punctuator") {
      if (tokVal == "!" || tokVal == "-" || tokVal == "+") {
        const opTok = this.peek();
        this.advance();
        const arg = this.parseUnary();
        const unary = new JSNode();
        unary.type = "UnaryExpression";
        unary.operator = opTok.value;
        unary.left = arg;
        unary.start = opTok.start;
        unary.line = opTok.line;
        unary.col = opTok.col;
        return unary;
      }
    }
    if (tokType == "Keyword" && tokVal == "typeof") {
      const opTok_1 = this.peek();
      this.advance();
      const arg_1 = this.parseUnary();
      const unary_1 = new JSNode();
      unary_1.type = "UnaryExpression";
      unary_1.operator = opTok_1.value;
      unary_1.left = arg_1;
      unary_1.start = opTok_1.start;
      unary_1.line = opTok_1.line;
      unary_1.col = opTok_1.col;
      return unary_1;
    }
    if (tokType == "Punctuator" && (tokVal == "++" || tokVal == "--")) {
      const opTok_2 = this.peek();
      this.advance();
      const arg_2 = this.parseUnary();
      const update = new JSNode();
      update.type = "UpdateExpression";
      update.operator = opTok_2.value;
      update.prefix = true;
      update.left = arg_2;
      update.start = opTok_2.start;
      update.line = opTok_2.line;
      update.col = opTok_2.col;
      return update;
    }
    if (tokVal == "yield") {
      const yieldTok = this.peek();
      this.advance();
      const yieldExpr = new JSNode();
      yieldExpr.type = "YieldExpression";
      yieldExpr.start = yieldTok.start;
      yieldExpr.line = yieldTok.line;
      yieldExpr.col = yieldTok.col;
      if (this.matchValue("*")) {
        yieldExpr.delegate = true;
        this.advance();
      }
      const nextVal = this.peekValue();
      if (
        nextVal != ";" &&
        nextVal != "}" &&
        nextVal != "," &&
        nextVal != ")"
      ) {
        const arg_3 = this.parseAssignment();
        yieldExpr.left = arg_3;
      }
      return yieldExpr;
    }
    if (tokVal == "await") {
      const awaitTok = this.peek();
      this.advance();
      const arg_4 = this.parseUnary();
      const awaitExpr = new JSNode();
      awaitExpr.type = "AwaitExpression";
      awaitExpr.left = arg_4;
      awaitExpr.start = awaitTok.start;
      awaitExpr.line = awaitTok.line;
      awaitExpr.col = awaitTok.col;
      return awaitExpr;
    }
    return this.parseCallMember();
  }
  parseCallMember() {
    if (this.matchValue("new")) {
      return this.parseNewExpression();
    }
    let object = this.parsePrimary();
    let cont = true;
    while (cont) {
      const tokVal = this.peekValue();
      if (tokVal == "++" || tokVal == "--") {
        const opTok = this.peek();
        this.advance();
        const update = new JSNode();
        update.type = "UpdateExpression";
        update.operator = opTok.value;
        update.prefix = false;
        update.left = object;
        update.start = object.start;
        update.line = object.line;
        update.col = object.col;
        object = update;
      } else {
        if (tokVal == "?.") {
          this.advance();
          const nextTokVal = this.peekValue();
          if (nextTokVal == "(") {
            this.advance();
            const call = new JSNode();
            call.type = "OptionalCallExpression";
            call.left = object;
            call.start = object.start;
            call.line = object.line;
            call.col = object.col;
            while (this.matchValue(")") == false && this.isAtEnd() == false) {
              if (call.children.length > 0) {
                this.expectValue(",");
              }
              if (this.matchValue(")") || this.isAtEnd()) {
                break;
              }
              const arg = this.parseAssignment();
              call.children.push(arg);
            }
            this.expectValue(")");
            object = call;
          } else {
            if (nextTokVal == "[") {
              this.advance();
              const propExpr = this.parseExpr();
              this.expectValue("]");
              const member = new JSNode();
              member.type = "OptionalMemberExpression";
              member.left = object;
              member.right = propExpr;
              member.computed = true;
              member.start = object.start;
              member.line = object.line;
              member.col = object.col;
              object = member;
            } else {
              const propTok = this.expect("Identifier");
              const member_1 = new JSNode();
              member_1.type = "OptionalMemberExpression";
              member_1.left = object;
              member_1.name = propTok.value;
              member_1.computed = false;
              member_1.start = object.start;
              member_1.line = object.line;
              member_1.col = object.col;
              object = member_1;
            }
          }
        } else {
          if (tokVal == ".") {
            this.advance();
            const propTok_1 = this.expect("Identifier");
            const member_2 = new JSNode();
            member_2.type = "MemberExpression";
            member_2.left = object;
            member_2.name = propTok_1.value;
            member_2.computed = false;
            member_2.start = object.start;
            member_2.line = object.line;
            member_2.col = object.col;
            object = member_2;
          } else {
            if (tokVal == "[") {
              this.advance();
              const propExpr_1 = this.parseExpr();
              this.expectValue("]");
              const member_3 = new JSNode();
              member_3.type = "MemberExpression";
              member_3.left = object;
              member_3.right = propExpr_1;
              member_3.computed = true;
              member_3.start = object.start;
              member_3.line = object.line;
              member_3.col = object.col;
              object = member_3;
            } else {
              if (tokVal == "(") {
                this.advance();
                const call_1 = new JSNode();
                call_1.type = "CallExpression";
                call_1.left = object;
                call_1.start = object.start;
                call_1.line = object.line;
                call_1.col = object.col;
                while (
                  this.matchValue(")") == false &&
                  this.isAtEnd() == false
                ) {
                  if (call_1.children.length > 0) {
                    this.expectValue(",");
                  }
                  if (this.matchValue(")") || this.isAtEnd()) {
                    break;
                  }
                  if (this.matchValue("...")) {
                    const spreadTok = this.peek();
                    this.advance();
                    const spreadArg = this.parseAssignment();
                    const spread = new JSNode();
                    spread.type = "SpreadElement";
                    spread.left = spreadArg;
                    spread.start = spreadTok.start;
                    spread.line = spreadTok.line;
                    spread.col = spreadTok.col;
                    call_1.children.push(spread);
                  } else {
                    const arg_1 = this.parseAssignment();
                    call_1.children.push(arg_1);
                  }
                }
                this.expectValue(")");
                object = call_1;
              } else {
                cont = false;
              }
            }
          }
        }
      }
    }
    return object;
  }
  parseNewExpression() {
    const newExpr = new JSNode();
    newExpr.type = "NewExpression";
    const startTok = this.peek();
    newExpr.start = startTok.start;
    newExpr.line = startTok.line;
    newExpr.col = startTok.col;
    this.expectValue("new");
    let callee = this.parsePrimary();
    let cont = true;
    while (cont) {
      const tokVal = this.peekValue();
      if (tokVal == ".") {
        this.advance();
        const propTok = this.expect("Identifier");
        const member = new JSNode();
        member.type = "MemberExpression";
        member.left = callee;
        member.name = propTok.value;
        member.computed = false;
        member.start = callee.start;
        member.line = callee.line;
        member.col = callee.col;
        callee = member;
      } else {
        cont = false;
      }
    }
    newExpr.left = callee;
    if (this.matchValue("(")) {
      this.advance();
      while (this.matchValue(")") == false && this.isAtEnd() == false) {
        if (newExpr.children.length > 0) {
          this.expectValue(",");
        }
        if (this.matchValue(")") || this.isAtEnd()) {
          break;
        }
        const arg = this.parseAssignment();
        newExpr.children.push(arg);
      }
      this.expectValue(")");
    }
    return newExpr;
  }
  parsePrimary() {
    const tokType = this.peekType();
    const tokVal = this.peekValue();
    const tok = this.peek();
    if (tokVal == "async") {
      const nextVal = this.peekAt(1);
      const nextNext = this.peekAt(2);
      if (nextVal == "(" || nextNext == "=>") {
        return this.parseAsyncArrowFunction();
      }
    }
    if (tokType == "Identifier") {
      const nextVal_1 = this.peekAt(1);
      if (nextVal_1 == "=>") {
        return this.parseArrowFunction();
      }
      this.advance();
      const id = new JSNode();
      id.type = "Identifier";
      id.name = tok.value;
      id.start = tok.start;
      id.end = tok.end;
      id.line = tok.line;
      id.col = tok.col;
      return id;
    }
    if (tokType == "Number") {
      this.advance();
      const lit = new JSNode();
      lit.type = "Literal";
      lit.raw = tok.value;
      lit.start = tok.start;
      lit.end = tok.end;
      lit.line = tok.line;
      lit.col = tok.col;
      return lit;
    }
    if (tokType == "String") {
      this.advance();
      const lit_1 = new JSNode();
      lit_1.type = "Literal";
      lit_1.raw = tok.value;
      lit_1.start = tok.start;
      lit_1.end = tok.end;
      lit_1.line = tok.line;
      lit_1.col = tok.col;
      return lit_1;
    }
    if (tokVal == "true" || tokVal == "false") {
      this.advance();
      const lit_2 = new JSNode();
      lit_2.type = "Literal";
      lit_2.raw = tok.value;
      lit_2.start = tok.start;
      lit_2.end = tok.end;
      lit_2.line = tok.line;
      lit_2.col = tok.col;
      return lit_2;
    }
    if (tokVal == "null") {
      this.advance();
      const lit_3 = new JSNode();
      lit_3.type = "Literal";
      lit_3.raw = "null";
      lit_3.start = tok.start;
      lit_3.end = tok.end;
      lit_3.line = tok.line;
      lit_3.col = tok.col;
      return lit_3;
    }
    if (tokType == "TemplateLiteral") {
      this.advance();
      const tmpl = new JSNode();
      tmpl.type = "TemplateLiteral";
      tmpl.raw = tok.value;
      tmpl.start = tok.start;
      tmpl.end = tok.end;
      tmpl.line = tok.line;
      tmpl.col = tok.col;
      return tmpl;
    }
    if (tokVal == "(") {
      if (this.isArrowFunction()) {
        return this.parseArrowFunction();
      }
      this.advance();
      const expr = this.parseExpr();
      this.expectValue(")");
      return expr;
    }
    if (tokVal == "[") {
      return this.parseArray();
    }
    if (tokVal == "{") {
      return this.parseObject();
    }
    if (tokVal == "/") {
      return this.parseRegexLiteral();
    }
    if (tokVal == "function") {
      return this.parseFunctionExpression();
    }
    this.advance();
    const fallback = new JSNode();
    fallback.type = "Identifier";
    fallback.name = tok.value;
    fallback.start = tok.start;
    fallback.end = tok.end;
    fallback.line = tok.line;
    fallback.col = tok.col;
    return fallback;
  }
  parseArray() {
    const arr = new JSNode();
    arr.type = "ArrayExpression";
    const startTok = this.peek();
    arr.start = startTok.start;
    arr.line = startTok.line;
    arr.col = startTok.col;
    this.expectValue("[");
    while (this.matchValue("]") == false && this.isAtEnd() == false) {
      if (arr.children.length > 0) {
        this.expectValue(",");
      }
      if (this.matchValue("]") || this.isAtEnd()) {
        break;
      }
      if (this.matchValue("...")) {
        const spreadTok = this.peek();
        this.advance();
        const arg = this.parseAssignment();
        const spread = new JSNode();
        spread.type = "SpreadElement";
        spread.left = arg;
        spread.start = spreadTok.start;
        spread.line = spreadTok.line;
        spread.col = spreadTok.col;
        arr.children.push(spread);
      } else {
        const elem = this.parseAssignment();
        arr.children.push(elem);
      }
    }
    this.expectValue("]");
    return arr;
  }
  parseObject() {
    const obj = new JSNode();
    obj.type = "ObjectExpression";
    const startTok = this.peek();
    obj.start = startTok.start;
    obj.line = startTok.line;
    obj.col = startTok.col;
    this.expectValue("{");
    while (this.matchValue("}") == false && this.isAtEnd() == false) {
      if (obj.children.length > 0) {
        this.expectValue(",");
      }
      if (this.matchValue("}") || this.isAtEnd()) {
        break;
      }
      if (this.matchValue("...")) {
        const spreadTok = this.peek();
        this.advance();
        const arg = this.parseAssignment();
        const spread = new JSNode();
        spread.type = "SpreadElement";
        spread.left = arg;
        spread.start = spreadTok.start;
        spread.line = spreadTok.line;
        spread.col = spreadTok.col;
        obj.children.push(spread);
      } else {
        const prop = new JSNode();
        prop.type = "Property";
        const keyTok = this.peek();
        const keyType = this.peekType();
        if (this.matchValue("[")) {
          this.advance();
          const keyExpr = this.parseAssignment();
          this.expectValue("]");
          this.expectValue(":");
          const val = this.parseAssignment();
          prop.right = keyExpr;
          prop.left = val;
          prop.computed = true;
          prop.start = keyTok.start;
          prop.line = keyTok.line;
          prop.col = keyTok.col;
          obj.children.push(prop);
        } else {
          if (
            keyType == "Identifier" ||
            keyType == "String" ||
            keyType == "Number"
          ) {
            this.advance();
            prop.name = keyTok.value;
            prop.start = keyTok.start;
            prop.line = keyTok.line;
            prop.col = keyTok.col;
            if (this.matchValue(":")) {
              this.expectValue(":");
              const val_1 = this.parseAssignment();
              prop.left = val_1;
            } else {
              const id = new JSNode();
              id.type = "Identifier";
              id.name = keyTok.value;
              id.start = keyTok.start;
              id.line = keyTok.line;
              id.col = keyTok.col;
              prop.left = id;
              prop.shorthand = true;
            }
            obj.children.push(prop);
          } else {
            const err =
              "Parse error at line " +
              keyTok.line +
              ":" +
              keyTok.col +
              ": unexpected token '" +
              keyTok.value +
              "' in object literal";
            this.addError(err);
            this.advance();
          }
        }
      }
    }
    this.expectValue("}");
    return obj;
  }
  parseArrayPattern() {
    const pattern = new JSNode();
    pattern.type = "ArrayPattern";
    const startTok = this.peek();
    pattern.start = startTok.start;
    pattern.line = startTok.line;
    pattern.col = startTok.col;
    this.expectValue("[");
    while (this.matchValue("]") == false && this.isAtEnd() == false) {
      if (pattern.children.length > 0) {
        this.expectValue(",");
      }
      if (this.matchValue("]") || this.isAtEnd()) {
        break;
      }
      if (this.matchValue("...")) {
        const restTok = this.peek();
        this.advance();
        const idTok = this.expect("Identifier");
        const rest = new JSNode();
        rest.type = "RestElement";
        rest.name = idTok.value;
        rest.start = restTok.start;
        rest.line = restTok.line;
        rest.col = restTok.col;
        pattern.children.push(rest);
      } else {
        if (this.matchValue("[")) {
          const nested = this.parseArrayPattern();
          pattern.children.push(nested);
        } else {
          if (this.matchValue("{")) {
            const nested_1 = this.parseObjectPattern();
            pattern.children.push(nested_1);
          } else {
            const idTok_1 = this.expect("Identifier");
            const id = new JSNode();
            id.type = "Identifier";
            id.name = idTok_1.value;
            id.start = idTok_1.start;
            id.line = idTok_1.line;
            id.col = idTok_1.col;
            pattern.children.push(id);
          }
        }
      }
    }
    this.expectValue("]");
    return pattern;
  }
  parseObjectPattern() {
    const pattern = new JSNode();
    pattern.type = "ObjectPattern";
    const startTok = this.peek();
    pattern.start = startTok.start;
    pattern.line = startTok.line;
    pattern.col = startTok.col;
    this.expectValue("{");
    while (this.matchValue("}") == false && this.isAtEnd() == false) {
      if (pattern.children.length > 0) {
        this.expectValue(",");
      }
      if (this.matchValue("}") || this.isAtEnd()) {
        break;
      }
      if (this.matchValue("...")) {
        const restTok = this.peek();
        this.advance();
        const idTok = this.expect("Identifier");
        const rest = new JSNode();
        rest.type = "RestElement";
        rest.name = idTok.value;
        rest.start = restTok.start;
        rest.line = restTok.line;
        rest.col = restTok.col;
        pattern.children.push(rest);
      } else {
        const prop = new JSNode();
        prop.type = "Property";
        const keyTok = this.expect("Identifier");
        prop.name = keyTok.value;
        prop.start = keyTok.start;
        prop.line = keyTok.line;
        prop.col = keyTok.col;
        if (this.matchValue(":")) {
          this.advance();
          if (this.matchValue("[")) {
            const nested = this.parseArrayPattern();
            prop.left = nested;
          } else {
            if (this.matchValue("{")) {
              const nested_1 = this.parseObjectPattern();
              prop.left = nested_1;
            } else {
              const idTok2 = this.expect("Identifier");
              const id = new JSNode();
              id.type = "Identifier";
              id.name = idTok2.value;
              id.start = idTok2.start;
              id.line = idTok2.line;
              id.col = idTok2.col;
              prop.left = id;
            }
          }
        } else {
          const id_1 = new JSNode();
          id_1.type = "Identifier";
          id_1.name = keyTok.value;
          id_1.start = keyTok.start;
          id_1.line = keyTok.line;
          id_1.col = keyTok.col;
          prop.left = id_1;
          prop.shorthand = true;
        }
        pattern.children.push(prop);
      }
    }
    this.expectValue("}");
    return pattern;
  }
  isArrowFunction() {
    if (this.matchValue("(") == false) {
      return false;
    }
    let depth = 1;
    let scanPos = 1;
    while (depth > 0) {
      const scanVal = this.peekAt(scanPos);
      if (scanVal == "") {
        return false;
      }
      if (scanVal == "(") {
        depth = depth + 1;
      }
      if (scanVal == ")") {
        depth = depth - 1;
      }
      scanPos = scanPos + 1;
    }
    const afterParen = this.peekAt(scanPos);
    return afterParen == "=>";
  }
  parseArrowFunction() {
    const arrow = new JSNode();
    arrow.type = "ArrowFunctionExpression";
    const startTok = this.peek();
    arrow.start = startTok.start;
    arrow.line = startTok.line;
    arrow.col = startTok.col;
    if (this.matchValue("(")) {
      this.advance();
      while (this.matchValue(")") == false && this.isAtEnd() == false) {
        if (arrow.children.length > 0) {
          this.expectValue(",");
        }
        if (this.matchValue(")") || this.isAtEnd()) {
          break;
        }
        const paramTok = this.expect("Identifier");
        const param = new JSNode();
        param.type = "Identifier";
        param.name = paramTok.value;
        param.start = paramTok.start;
        param.line = paramTok.line;
        param.col = paramTok.col;
        arrow.children.push(param);
      }
      this.expectValue(")");
    } else {
      const paramTok_1 = this.expect("Identifier");
      const param_1 = new JSNode();
      param_1.type = "Identifier";
      param_1.name = paramTok_1.value;
      param_1.start = paramTok_1.start;
      param_1.line = paramTok_1.line;
      param_1.col = paramTok_1.col;
      arrow.children.push(param_1);
    }
    this.expectValue("=>");
    if (this.matchValue("{")) {
      const body = this.parseBlock();
      arrow.body = body;
    } else {
      const expr = this.parseAssignment();
      arrow.body = expr;
    }
    return arrow;
  }
  parseAsyncArrowFunction() {
    const arrow = new JSNode();
    arrow.type = "ArrowFunctionExpression";
    arrow.async = true;
    const startTok = this.peek();
    arrow.start = startTok.start;
    arrow.line = startTok.line;
    arrow.col = startTok.col;
    this.expectValue("async");
    if (this.matchValue("(")) {
      this.advance();
      while (this.matchValue(")") == false && this.isAtEnd() == false) {
        if (arrow.children.length > 0) {
          this.expectValue(",");
        }
        if (this.matchValue(")") || this.isAtEnd()) {
          break;
        }
        const paramTok = this.expect("Identifier");
        const param = new JSNode();
        param.type = "Identifier";
        param.name = paramTok.value;
        param.start = paramTok.start;
        param.line = paramTok.line;
        param.col = paramTok.col;
        arrow.children.push(param);
      }
      this.expectValue(")");
    } else {
      const paramTok_1 = this.expect("Identifier");
      const param_1 = new JSNode();
      param_1.type = "Identifier";
      param_1.name = paramTok_1.value;
      param_1.start = paramTok_1.start;
      param_1.line = paramTok_1.line;
      param_1.col = paramTok_1.col;
      arrow.children.push(param_1);
    }
    this.expectValue("=>");
    if (this.matchValue("{")) {
      const body = this.parseBlock();
      arrow.body = body;
    } else {
      const expr = this.parseAssignment();
      arrow.body = expr;
    }
    return arrow;
  }
}
class ASTPrinter {
  constructor() {}
}
ASTPrinter.printNode = function (node, depth) {
  let indent = "";
  let i = 0;
  while (i < depth) {
    indent = indent + "  ";
    i = i + 1;
  }
  const numComments = node.leadingComments.length;
  if (numComments > 0) {
    for (let ci = 0; ci < node.leadingComments.length; ci++) {
      var comment = node.leadingComments[ci];
      const commentType = comment.type;
      let preview = comment.raw;
      if (preview.length > 40) {
        preview = preview.substring(0, 40) + "...";
      }
      console.log(indent + commentType + ": " + preview);
    }
  }
  const nodeType = node.type;
  const loc = "[" + node.line + ":" + node.col + "]";
  if (nodeType == "VariableDeclaration") {
    const kind = node.name;
    if (kind.length > 0) {
      console.log(indent + "VariableDeclaration (" + kind + ") " + loc);
    } else {
      console.log(indent + "VariableDeclaration " + loc);
    }
    for (let ci_1 = 0; ci_1 < node.children.length; ci_1++) {
      var child = node.children[ci_1];
      ASTPrinter.printNode(child, depth + 1);
    }
    return;
  }
  if (nodeType == "VariableDeclarator") {
    if (typeof node.left !== "undefined" && node.left != null) {
      const id = node.left;
      const idType = id.type;
      if (idType == "Identifier") {
        console.log(indent + "VariableDeclarator: " + id.name + " " + loc);
      } else {
        console.log(indent + "VariableDeclarator " + loc);
        console.log(indent + "  pattern:");
        ASTPrinter.printNode(id, depth + 2);
      }
    } else {
      console.log(indent + "VariableDeclarator " + loc);
    }
    if (typeof node.right !== "undefined" && node.right != null) {
      ASTPrinter.printNode(node.right, depth + 1);
    }
    return;
  }
  if (nodeType == "FunctionDeclaration") {
    let params = "";
    for (let pi = 0; pi < node.children.length; pi++) {
      var p = node.children[pi];
      if (pi > 0) {
        params = params + ", ";
      }
      params = params + p.name;
    }
    let prefix = "";
    if (node.async) {
      if (node.generator) {
        prefix = "async function* ";
      } else {
        prefix = "async ";
      }
    } else {
      if (node.generator) {
        prefix = "function* ";
      }
    }
    if (prefix.length > 0) {
      console.log(
        indent +
          "FunctionDeclaration: " +
          prefix +
          node.name +
          "(" +
          params +
          ") " +
          loc
      );
    } else {
      console.log(
        indent + "FunctionDeclaration: " + node.name + "(" + params + ") " + loc
      );
    }
    if (typeof node.body !== "undefined" && node.body != null) {
      ASTPrinter.printNode(node.body, depth + 1);
    }
    return;
  }
  if (nodeType == "ClassDeclaration") {
    let output = indent + "ClassDeclaration: " + node.name;
    if (typeof node.left !== "undefined" && node.left != null) {
      const superClass = node.left;
      output = output + " extends " + superClass.name;
    }
    console.log(output + " " + loc);
    if (typeof node.body !== "undefined" && node.body != null) {
      ASTPrinter.printNode(node.body, depth + 1);
    }
    return;
  }
  if (nodeType == "ClassBody") {
    console.log(indent + "ClassBody " + loc);
    for (let mi = 0; mi < node.children.length; mi++) {
      var method = node.children[mi];
      ASTPrinter.printNode(method, depth + 1);
    }
    return;
  }
  if (nodeType == "MethodDefinition") {
    let staticStr = "";
    if (node.static) {
      staticStr = "static ";
    }
    console.log(
      indent + "MethodDefinition: " + staticStr + node.name + " " + loc
    );
    if (typeof node.body !== "undefined" && node.body != null) {
      ASTPrinter.printNode(node.body, depth + 1);
    }
    return;
  }
  if (nodeType == "ArrowFunctionExpression") {
    let params_1 = "";
    for (let pi_1 = 0; pi_1 < node.children.length; pi_1++) {
      var p_1 = node.children[pi_1];
      if (pi_1 > 0) {
        params_1 = params_1 + ", ";
      }
      params_1 = params_1 + p_1.name;
    }
    let asyncStr = "";
    if (node.async) {
      asyncStr = "async ";
    }
    console.log(
      indent +
        "ArrowFunctionExpression: " +
        asyncStr +
        "(" +
        params_1 +
        ") => " +
        loc
    );
    if (typeof node.body !== "undefined" && node.body != null) {
      ASTPrinter.printNode(node.body, depth + 1);
    }
    return;
  }
  if (nodeType == "YieldExpression") {
    let delegateStr = "";
    if (node.name == "delegate") {
      delegateStr = "*";
    }
    console.log(indent + "YieldExpression" + delegateStr + " " + loc);
    if (typeof node.left !== "undefined" && node.left != null) {
      ASTPrinter.printNode(node.left, depth + 1);
    }
    return;
  }
  if (nodeType == "AwaitExpression") {
    console.log(indent + "AwaitExpression " + loc);
    if (typeof node.left !== "undefined" && node.left != null) {
      ASTPrinter.printNode(node.left, depth + 1);
    }
    return;
  }
  if (nodeType == "TemplateLiteral") {
    console.log(indent + "TemplateLiteral: `" + node.name + "` " + loc);
    return;
  }
  if (nodeType == "BlockStatement") {
    console.log(indent + "BlockStatement " + loc);
    for (let ci_2 = 0; ci_2 < node.children.length; ci_2++) {
      var child_1 = node.children[ci_2];
      ASTPrinter.printNode(child_1, depth + 1);
    }
    return;
  }
  if (nodeType == "ReturnStatement") {
    console.log(indent + "ReturnStatement " + loc);
    if (typeof node.left !== "undefined" && node.left != null) {
      ASTPrinter.printNode(node.left, depth + 1);
    }
    return;
  }
  if (nodeType == "IfStatement") {
    console.log(indent + "IfStatement " + loc);
    console.log(indent + "  test:");
    if (typeof node.test !== "undefined" && node.test != null) {
      ASTPrinter.printNode(node.test, depth + 2);
    }
    console.log(indent + "  consequent:");
    if (typeof node.body !== "undefined" && node.body != null) {
      ASTPrinter.printNode(node.body, depth + 2);
    }
    if (typeof node.alternate !== "undefined" && node.alternate != null) {
      console.log(indent + "  alternate:");
      ASTPrinter.printNode(node.alternate, depth + 2);
    }
    return;
  }
  if (nodeType == "ExpressionStatement") {
    console.log(indent + "ExpressionStatement " + loc);
    if (typeof node.left !== "undefined" && node.left != null) {
      ASTPrinter.printNode(node.left, depth + 1);
    }
    return;
  }
  if (nodeType == "AssignmentExpression") {
    console.log(indent + "AssignmentExpression: " + node.name + " " + loc);
    if (typeof node.left !== "undefined" && node.left != null) {
      console.log(indent + "  left:");
      ASTPrinter.printNode(node.left, depth + 2);
    }
    if (typeof node.right !== "undefined" && node.right != null) {
      console.log(indent + "  right:");
      ASTPrinter.printNode(node.right, depth + 2);
    }
    return;
  }
  if (nodeType == "BinaryExpression" || nodeType == "LogicalExpression") {
    console.log(indent + nodeType + ": " + node.name + " " + loc);
    if (typeof node.left !== "undefined" && node.left != null) {
      console.log(indent + "  left:");
      ASTPrinter.printNode(node.left, depth + 2);
    }
    if (typeof node.right !== "undefined" && node.right != null) {
      console.log(indent + "  right:");
      ASTPrinter.printNode(node.right, depth + 2);
    }
    return;
  }
  if (nodeType == "UnaryExpression") {
    console.log(indent + "UnaryExpression: " + node.name + " " + loc);
    if (typeof node.left !== "undefined" && node.left != null) {
      ASTPrinter.printNode(node.left, depth + 1);
    }
    return;
  }
  if (nodeType == "UpdateExpression") {
    let prefix_1 = "";
    if (node.prefix) {
      prefix_1 = "prefix ";
    } else {
      prefix_1 = "postfix ";
    }
    console.log(
      indent + "UpdateExpression: " + prefix_1 + node.name + " " + loc
    );
    if (typeof node.left !== "undefined" && node.left != null) {
      ASTPrinter.printNode(node.left, depth + 1);
    }
    return;
  }
  if (nodeType == "NewExpression") {
    console.log(indent + "NewExpression " + loc);
    console.log(indent + "  callee:");
    if (typeof node.left !== "undefined" && node.left != null) {
      ASTPrinter.printNode(node.left, depth + 2);
    }
    if (node.children.length > 0) {
      console.log(indent + "  arguments:");
      for (let ai = 0; ai < node.children.length; ai++) {
        var arg = node.children[ai];
        ASTPrinter.printNode(arg, depth + 2);
      }
    }
    return;
  }
  if (nodeType == "ConditionalExpression") {
    console.log(indent + "ConditionalExpression " + loc);
    console.log(indent + "  test:");
    if (typeof node.left !== "undefined" && node.left != null) {
      ASTPrinter.printNode(node.left, depth + 2);
    }
    console.log(indent + "  consequent:");
    if (typeof node.body !== "undefined" && node.body != null) {
      ASTPrinter.printNode(node.body, depth + 2);
    }
    console.log(indent + "  alternate:");
    if (typeof node.right !== "undefined" && node.right != null) {
      ASTPrinter.printNode(node.right, depth + 2);
    }
    return;
  }
  if (nodeType == "CallExpression") {
    console.log(indent + "CallExpression " + loc);
    if (typeof node.left !== "undefined" && node.left != null) {
      console.log(indent + "  callee:");
      ASTPrinter.printNode(node.left, depth + 2);
    }
    if (node.children.length > 0) {
      console.log(indent + "  arguments:");
      for (let ai_1 = 0; ai_1 < node.children.length; ai_1++) {
        var arg_1 = node.children[ai_1];
        ASTPrinter.printNode(arg_1, depth + 2);
      }
    }
    return;
  }
  if (nodeType == "MemberExpression") {
    if (node.computed == false) {
      console.log(indent + "MemberExpression: ." + node.name + " " + loc);
    } else {
      console.log(indent + "MemberExpression: [computed] " + loc);
    }
    if (typeof node.left !== "undefined" && node.left != null) {
      ASTPrinter.printNode(node.left, depth + 1);
    }
    if (typeof node.right !== "undefined" && node.right != null) {
      ASTPrinter.printNode(node.right, depth + 1);
    }
    return;
  }
  if (nodeType == "Identifier") {
    console.log(indent + "Identifier: " + node.name + " " + loc);
    return;
  }
  if (nodeType == "Literal") {
    console.log(
      indent + "Literal: " + node.name + " (" + node.raw + ") " + loc
    );
    return;
  }
  if (nodeType == "ArrayExpression") {
    console.log(indent + "ArrayExpression " + loc);
    for (let ei = 0; ei < node.children.length; ei++) {
      var elem = node.children[ei];
      ASTPrinter.printNode(elem, depth + 1);
    }
    return;
  }
  if (nodeType == "ObjectExpression") {
    console.log(indent + "ObjectExpression " + loc);
    for (let pi_2 = 0; pi_2 < node.children.length; pi_2++) {
      var prop = node.children[pi_2];
      ASTPrinter.printNode(prop, depth + 1);
    }
    return;
  }
  if (nodeType == "Property") {
    let shorthand = "";
    if (node.shorthand) {
      shorthand = " (shorthand)";
    }
    console.log(indent + "Property: " + node.name + shorthand + " " + loc);
    if (typeof node.left !== "undefined" && node.left != null) {
      ASTPrinter.printNode(node.left, depth + 1);
    }
    return;
  }
  if (nodeType == "ArrayPattern") {
    console.log(indent + "ArrayPattern " + loc);
    for (let ei_1 = 0; ei_1 < node.children.length; ei_1++) {
      var elem_1 = node.children[ei_1];
      ASTPrinter.printNode(elem_1, depth + 1);
    }
    return;
  }
  if (nodeType == "ObjectPattern") {
    console.log(indent + "ObjectPattern " + loc);
    for (let pi_3 = 0; pi_3 < node.children.length; pi_3++) {
      var prop_1 = node.children[pi_3];
      ASTPrinter.printNode(prop_1, depth + 1);
    }
    return;
  }
  if (nodeType == "SpreadElement") {
    console.log(indent + "SpreadElement " + loc);
    if (typeof node.left !== "undefined" && node.left != null) {
      ASTPrinter.printNode(node.left, depth + 1);
    }
    return;
  }
  if (nodeType == "RestElement") {
    console.log(indent + "RestElement: ..." + node.name + " " + loc);
    return;
  }
  if (nodeType == "WhileStatement") {
    console.log(indent + "WhileStatement " + loc);
    console.log(indent + "  test:");
    if (typeof node.test !== "undefined" && node.test != null) {
      ASTPrinter.printNode(node.test, depth + 2);
    }
    console.log(indent + "  body:");
    if (typeof node.body !== "undefined" && node.body != null) {
      ASTPrinter.printNode(node.body, depth + 2);
    }
    return;
  }
  if (nodeType == "DoWhileStatement") {
    console.log(indent + "DoWhileStatement " + loc);
    console.log(indent + "  body:");
    if (typeof node.body !== "undefined" && node.body != null) {
      ASTPrinter.printNode(node.body, depth + 2);
    }
    console.log(indent + "  test:");
    if (typeof node.test !== "undefined" && node.test != null) {
      ASTPrinter.printNode(node.test, depth + 2);
    }
    return;
  }
  if (nodeType == "ForStatement") {
    console.log(indent + "ForStatement " + loc);
    if (typeof node.left !== "undefined" && node.left != null) {
      console.log(indent + "  init:");
      ASTPrinter.printNode(node.left, depth + 2);
    }
    if (typeof node.test !== "undefined" && node.test != null) {
      console.log(indent + "  test:");
      ASTPrinter.printNode(node.test, depth + 2);
    }
    if (typeof node.right !== "undefined" && node.right != null) {
      console.log(indent + "  update:");
      ASTPrinter.printNode(node.right, depth + 2);
    }
    console.log(indent + "  body:");
    if (typeof node.body !== "undefined" && node.body != null) {
      ASTPrinter.printNode(node.body, depth + 2);
    }
    return;
  }
  if (nodeType == "ForOfStatement") {
    console.log(indent + "ForOfStatement " + loc);
    if (typeof node.left !== "undefined" && node.left != null) {
      console.log(indent + "  left:");
      ASTPrinter.printNode(node.left, depth + 2);
    }
    if (typeof node.right !== "undefined" && node.right != null) {
      console.log(indent + "  right:");
      ASTPrinter.printNode(node.right, depth + 2);
    }
    console.log(indent + "  body:");
    if (typeof node.body !== "undefined" && node.body != null) {
      ASTPrinter.printNode(node.body, depth + 2);
    }
    return;
  }
  if (nodeType == "ForInStatement") {
    console.log(indent + "ForInStatement " + loc);
    if (typeof node.left !== "undefined" && node.left != null) {
      console.log(indent + "  left:");
      ASTPrinter.printNode(node.left, depth + 2);
    }
    if (typeof node.right !== "undefined" && node.right != null) {
      console.log(indent + "  right:");
      ASTPrinter.printNode(node.right, depth + 2);
    }
    console.log(indent + "  body:");
    if (typeof node.body !== "undefined" && node.body != null) {
      ASTPrinter.printNode(node.body, depth + 2);
    }
    return;
  }
  if (nodeType == "SwitchStatement") {
    console.log(indent + "SwitchStatement " + loc);
    console.log(indent + "  discriminant:");
    if (typeof node.test !== "undefined" && node.test != null) {
      ASTPrinter.printNode(node.test, depth + 2);
    }
    console.log(indent + "  cases:");
    for (let ci_3 = 0; ci_3 < node.children.length; ci_3++) {
      var caseNode = node.children[ci_3];
      ASTPrinter.printNode(caseNode, depth + 2);
    }
    return;
  }
  if (nodeType == "SwitchCase") {
    if (node.name == "default") {
      console.log(indent + "SwitchCase: default " + loc);
    } else {
      console.log(indent + "SwitchCase " + loc);
      if (typeof node.test !== "undefined" && node.test != null) {
        console.log(indent + "  test:");
        ASTPrinter.printNode(node.test, depth + 2);
      }
    }
    if (node.children.length > 0) {
      console.log(indent + "  consequent:");
      for (let si = 0; si < node.children.length; si++) {
        var stmt = node.children[si];
        ASTPrinter.printNode(stmt, depth + 2);
      }
    }
    return;
  }
  if (nodeType == "TryStatement") {
    console.log(indent + "TryStatement " + loc);
    console.log(indent + "  block:");
    if (typeof node.body !== "undefined" && node.body != null) {
      ASTPrinter.printNode(node.body, depth + 2);
    }
    if (typeof node.left !== "undefined" && node.left != null) {
      console.log(indent + "  handler:");
      ASTPrinter.printNode(node.left, depth + 2);
    }
    if (typeof node.right !== "undefined" && node.right != null) {
      console.log(indent + "  finalizer:");
      ASTPrinter.printNode(node.right, depth + 2);
    }
    return;
  }
  if (nodeType == "CatchClause") {
    console.log(indent + "CatchClause: " + node.name + " " + loc);
    if (typeof node.body !== "undefined" && node.body != null) {
      ASTPrinter.printNode(node.body, depth + 1);
    }
    return;
  }
  if (nodeType == "ThrowStatement") {
    console.log(indent + "ThrowStatement " + loc);
    if (typeof node.left !== "undefined" && node.left != null) {
      ASTPrinter.printNode(node.left, depth + 1);
    }
    return;
  }
  if (nodeType == "BreakStatement") {
    if (node.name.length > 0) {
      console.log(indent + "BreakStatement: " + node.name + " " + loc);
    } else {
      console.log(indent + "BreakStatement " + loc);
    }
    return;
  }
  if (nodeType == "ContinueStatement") {
    if (node.name.length > 0) {
      console.log(indent + "ContinueStatement: " + node.name + " " + loc);
    } else {
      console.log(indent + "ContinueStatement " + loc);
    }
    return;
  }
  console.log(indent + nodeType + " " + loc);
};
class JSPrinter {
  constructor() {
    this.indentLevel = 0;
    this.indentStr = "  ";
    this.output = "";
  }
  getIndent() {
    let result = "";
    let i = 0;
    while (i < this.indentLevel) {
      result = result + this.indentStr;
      i = i + 1;
    }
    return result;
  }
  emit(text) {
    this.output = this.output + text;
  }
  emitLine(text) {
    this.output = this.output + this.getIndent() + text + "\n";
  }
  emitIndent() {
    this.output = this.output + this.getIndent();
  }
  indent() {
    this.indentLevel = this.indentLevel + 1;
  }
  dedent() {
    this.indentLevel = this.indentLevel - 1;
  }
  printLeadingComments(node) {
    const numComments = node.leadingComments.length;
    if (numComments == 0) {
      return;
    }
    for (let i = 0; i < node.leadingComments.length; i++) {
      var comment = node.leadingComments[i];
      this.printComment(comment);
    }
  }
  printComment(comment) {
    const commentType = comment.type;
    const value = comment.raw;
    if (commentType == "LineComment") {
      this.emitLine("//" + value);
      return;
    }
    if (commentType == "BlockComment") {
      this.emitLine("/*" + value + "*/");
      return;
    }
    if (commentType == "JSDocComment") {
      this.printJSDocComment(value);
      return;
    }
  }
  printJSDocComment(value) {
    this.emitLine("/*" + value + "*/");
  }
  print(node) {
    this.output = "";
    this.indentLevel = 0;
    this.printNode(node);
    return this.output;
  }
  printNode(node) {
    const nodeType = node.type;
    if (nodeType == "Program") {
      this.printProgram(node);
      return;
    }
    if (nodeType == "VariableDeclaration") {
      this.printVariableDeclaration(node);
      return;
    }
    if (nodeType == "FunctionDeclaration") {
      this.printFunctionDeclaration(node);
      return;
    }
    if (nodeType == "ClassDeclaration") {
      this.printClassDeclaration(node);
      return;
    }
    if (nodeType == "ImportDeclaration") {
      this.printImportDeclaration(node);
      return;
    }
    if (nodeType == "ExportNamedDeclaration") {
      this.printExportNamedDeclaration(node);
      return;
    }
    if (nodeType == "ExportDefaultDeclaration") {
      this.printExportDefaultDeclaration(node);
      return;
    }
    if (nodeType == "ExportAllDeclaration") {
      this.printExportAllDeclaration(node);
      return;
    }
    if (nodeType == "BlockStatement") {
      this.printBlockStatement(node);
      return;
    }
    if (nodeType == "ExpressionStatement") {
      this.printExpressionStatement(node);
      return;
    }
    if (nodeType == "ReturnStatement") {
      this.printReturnStatement(node);
      return;
    }
    if (nodeType == "IfStatement") {
      this.printIfStatement(node);
      return;
    }
    if (nodeType == "WhileStatement") {
      this.printWhileStatement(node);
      return;
    }
    if (nodeType == "DoWhileStatement") {
      this.printDoWhileStatement(node);
      return;
    }
    if (nodeType == "ForStatement") {
      this.printForStatement(node);
      return;
    }
    if (nodeType == "ForOfStatement") {
      this.printForOfStatement(node);
      return;
    }
    if (nodeType == "ForInStatement") {
      this.printForInStatement(node);
      return;
    }
    if (nodeType == "SwitchStatement") {
      this.printSwitchStatement(node);
      return;
    }
    if (nodeType == "TryStatement") {
      this.printTryStatement(node);
      return;
    }
    if (nodeType == "ThrowStatement") {
      this.printThrowStatement(node);
      return;
    }
    if (nodeType == "BreakStatement") {
      this.emit("break");
      return;
    }
    if (nodeType == "ContinueStatement") {
      this.emit("continue");
      return;
    }
    if (nodeType == "EmptyStatement") {
      return;
    }
    if (nodeType == "Identifier") {
      this.emit(node.name);
      return;
    }
    if (nodeType == "Literal") {
      this.printLiteral(node);
      return;
    }
    if (nodeType == "TemplateLiteral") {
      this.emit("`" + node.name + "`");
      return;
    }
    if (nodeType == "RegexLiteral") {
      this.emit("/" + node.name + "/" + node.kind);
      return;
    }
    if (nodeType == "ArrayExpression") {
      this.printArrayExpression(node);
      return;
    }
    if (nodeType == "ObjectExpression") {
      this.printObjectExpression(node);
      return;
    }
    if (nodeType == "BinaryExpression") {
      this.printBinaryExpression(node);
      return;
    }
    if (nodeType == "LogicalExpression") {
      this.printBinaryExpression(node);
      return;
    }
    if (nodeType == "UnaryExpression") {
      this.printUnaryExpression(node);
      return;
    }
    if (nodeType == "UpdateExpression") {
      this.printUpdateExpression(node);
      return;
    }
    if (nodeType == "AssignmentExpression") {
      this.printAssignmentExpression(node);
      return;
    }
    if (nodeType == "ConditionalExpression") {
      this.printConditionalExpression(node);
      return;
    }
    if (nodeType == "CallExpression") {
      this.printCallExpression(node);
      return;
    }
    if (nodeType == "OptionalCallExpression") {
      this.printOptionalCallExpression(node);
      return;
    }
    if (nodeType == "MemberExpression") {
      this.printMemberExpression(node);
      return;
    }
    if (nodeType == "OptionalMemberExpression") {
      this.printOptionalMemberExpression(node);
      return;
    }
    if (nodeType == "NewExpression") {
      this.printNewExpression(node);
      return;
    }
    if (nodeType == "ArrowFunctionExpression") {
      this.printArrowFunction(node);
      return;
    }
    if (nodeType == "FunctionExpression") {
      this.printFunctionExpression(node);
      return;
    }
    if (nodeType == "YieldExpression") {
      this.printYieldExpression(node);
      return;
    }
    if (nodeType == "AwaitExpression") {
      this.printAwaitExpression(node);
      return;
    }
    if (nodeType == "SpreadElement") {
      this.printSpreadElement(node);
      return;
    }
    if (nodeType == "RestElement") {
      this.emit("..." + node.name);
      return;
    }
    if (nodeType == "ArrayPattern") {
      this.printArrayPattern(node);
      return;
    }
    if (nodeType == "ObjectPattern") {
      this.printObjectPattern(node);
      return;
    }
    this.emit("/* unknown: " + nodeType + " */");
  }
  printProgram(node) {
    for (let idx = 0; idx < node.children.length; idx++) {
      var stmt = node.children[idx];
      this.printStatement(stmt);
    }
  }
  printStatement(node) {
    this.printLeadingComments(node);
    const nodeType = node.type;
    if (nodeType == "BlockStatement") {
      this.printBlockStatement(node);
      return;
    }
    if (
      nodeType == "FunctionDeclaration" ||
      nodeType == "ClassDeclaration" ||
      nodeType == "IfStatement" ||
      nodeType == "WhileStatement" ||
      nodeType == "DoWhileStatement" ||
      nodeType == "ForStatement" ||
      nodeType == "ForOfStatement" ||
      nodeType == "ForInStatement" ||
      nodeType == "SwitchStatement" ||
      nodeType == "TryStatement"
    ) {
      this.emitIndent();
      this.printNode(node);
      this.emit("\n");
      return;
    }
    this.emitIndent();
    this.printNode(node);
    this.emit(";\n");
  }
  printVariableDeclaration(node) {
    let kind = node.name;
    if (kind.length == 0) {
      kind = "var";
    }
    this.emit(kind + " ");
    let first = true;
    for (let idx = 0; idx < node.children.length; idx++) {
      var decl = node.children[idx];
      if (first == false) {
        this.emit(", ");
      }
      first = false;
      this.printVariableDeclarator(decl);
    }
  }
  printVariableDeclarator(node) {
    if (typeof node.left !== "undefined" && node.left != null) {
      const left = node.left;
      this.printNode(left);
    }
    if (typeof node.right !== "undefined" && node.right != null) {
      this.emit(" = ");
      this.printNode(node.right);
    }
  }
  printFunctionDeclaration(node) {
    const kind = node.kind;
    if (kind == "async") {
      this.emit("async ");
    }
    if (kind == "async-generator") {
      this.emit("async ");
    }
    this.emit("function");
    if (kind == "generator" || kind == "async-generator") {
      this.emit("*");
    }
    this.emit(" " + node.name + "(");
    this.printParams(node.children);
    this.emit(") ");
    if (typeof node.body !== "undefined" && node.body != null) {
      this.printNode(node.body);
    }
  }
  printParams(params) {
    let first = true;
    for (let idx = 0; idx < params.length; idx++) {
      var p = params[idx];
      if (first == false) {
        this.emit(", ");
      }
      first = false;
      this.printNode(p);
    }
  }
  printClassDeclaration(node) {
    this.emit("class " + node.name);
    if (typeof node.left !== "undefined" && node.left != null) {
      const superClass = node.left;
      this.emit(" extends " + superClass.name);
    }
    this.emit(" ");
    if (typeof node.body !== "undefined" && node.body != null) {
      this.printClassBody(node.body);
    }
  }
  printClassBody(node) {
    this.emit("{\n");
    this.indent();
    for (let idx = 0; idx < node.children.length; idx++) {
      var method = node.children[idx];
      this.printMethodDefinition(method);
    }
    this.dedent();
    this.emitIndent();
    this.emit("}");
  }
  printMethodDefinition(node) {
    this.emitIndent();
    if (node.kind == "static") {
      this.emit("static ");
    }
    this.emit(node.name + "(");
    if (typeof node.body !== "undefined" && node.body != null) {
      const _func = node.body;
      this.printParams(_func.children);
    }
    this.emit(") ");
    if (typeof node.body !== "undefined" && node.body != null) {
      const func_1 = node.body;
      if (typeof func_1.body !== "undefined" && func_1.body != null) {
        this.printNode(func_1.body);
      }
    }
    this.emit("\n");
  }
  printBlockStatement(node) {
    this.emit("{\n");
    this.indent();
    for (let idx = 0; idx < node.children.length; idx++) {
      var stmt = node.children[idx];
      this.printStatement(stmt);
    }
    this.dedent();
    this.emitIndent();
    this.emit("}");
  }
  printExpressionStatement(node) {
    if (typeof node.left !== "undefined" && node.left != null) {
      this.printNode(node.left);
    }
  }
  printReturnStatement(node) {
    this.emit("return");
    if (typeof node.left !== "undefined" && node.left != null) {
      this.emit(" ");
      this.printNode(node.left);
    }
  }
  printIfStatement(node) {
    this.emit("if (");
    if (typeof node.test !== "undefined" && node.test != null) {
      this.printNode(node.test);
    }
    this.emit(") ");
    if (typeof node.body !== "undefined" && node.body != null) {
      this.printNode(node.body);
    }
    if (typeof node.alternate !== "undefined" && node.alternate != null) {
      this.emit(" else ");
      this.printNode(node.alternate);
    }
  }
  printWhileStatement(node) {
    this.emit("while (");
    if (typeof node.test !== "undefined" && node.test != null) {
      this.printNode(node.test);
    }
    this.emit(") ");
    if (typeof node.body !== "undefined" && node.body != null) {
      this.printNode(node.body);
    }
  }
  printDoWhileStatement(node) {
    this.emit("do ");
    if (typeof node.body !== "undefined" && node.body != null) {
      this.printNode(node.body);
    }
    this.emit(" while (");
    if (typeof node.test !== "undefined" && node.test != null) {
      this.printNode(node.test);
    }
    this.emit(")");
  }
  printForStatement(node) {
    this.emit("for (");
    if (typeof node.left !== "undefined" && node.left != null) {
      this.printNode(node.left);
    }
    this.emit("; ");
    if (typeof node.test !== "undefined" && node.test != null) {
      this.printNode(node.test);
    }
    this.emit("; ");
    if (typeof node.right !== "undefined" && node.right != null) {
      this.printNode(node.right);
    }
    this.emit(") ");
    if (typeof node.body !== "undefined" && node.body != null) {
      this.printNode(node.body);
    }
  }
  printForOfStatement(node) {
    this.emit("for (");
    if (typeof node.left !== "undefined" && node.left != null) {
      this.printNode(node.left);
    }
    this.emit(" of ");
    if (typeof node.right !== "undefined" && node.right != null) {
      this.printNode(node.right);
    }
    this.emit(") ");
    if (typeof node.body !== "undefined" && node.body != null) {
      this.printNode(node.body);
    }
  }
  printForInStatement(node) {
    this.emit("for (");
    if (typeof node.left !== "undefined" && node.left != null) {
      this.printNode(node.left);
    }
    this.emit(" in ");
    if (typeof node.right !== "undefined" && node.right != null) {
      this.printNode(node.right);
    }
    this.emit(") ");
    if (typeof node.body !== "undefined" && node.body != null) {
      this.printNode(node.body);
    }
  }
  printSwitchStatement(node) {
    this.emit("switch (");
    if (typeof node.test !== "undefined" && node.test != null) {
      this.printNode(node.test);
    }
    this.emit(") {\n");
    this.indent();
    for (let idx = 0; idx < node.children.length; idx++) {
      var caseNode = node.children[idx];
      this.printSwitchCase(caseNode);
    }
    this.dedent();
    this.emitIndent();
    this.emit("}");
  }
  printSwitchCase(node) {
    if (node.name == "default") {
      this.emitLine("default:");
    } else {
      this.emitIndent();
      this.emit("case ");
      if (typeof node.test !== "undefined" && node.test != null) {
        this.printNode(node.test);
      }
      this.emit(":\n");
    }
    this.indent();
    for (let idx = 0; idx < node.children.length; idx++) {
      var stmt = node.children[idx];
      this.printStatement(stmt);
    }
    this.dedent();
  }
  printTryStatement(node) {
    this.emit("try ");
    if (typeof node.body !== "undefined" && node.body != null) {
      this.printNode(node.body);
    }
    if (typeof node.left !== "undefined" && node.left != null) {
      const catchClause = node.left;
      this.emit(" catch (" + catchClause.name + ") ");
      if (typeof catchClause.body !== "undefined" && catchClause.body != null) {
        this.printNode(catchClause.body);
      }
    }
    if (typeof node.right !== "undefined" && node.right != null) {
      this.emit(" finally ");
      this.printNode(node.right);
    }
  }
  printThrowStatement(node) {
    this.emit("throw ");
    if (typeof node.left !== "undefined" && node.left != null) {
      this.printNode(node.left);
    }
  }
  printLiteral(node) {
    const litType = node.kind;
    if (litType == "string") {
      this.emit("'" + node.name + "'");
    } else {
      this.emit(node.name);
    }
  }
  printArrayExpression(node) {
    this.emit("[");
    let first = true;
    for (let idx = 0; idx < node.children.length; idx++) {
      var elem = node.children[idx];
      if (first == false) {
        this.emit(", ");
      }
      first = false;
      this.printNode(elem);
    }
    this.emit("]");
  }
  printObjectExpression(node) {
    if (node.children.length == 0) {
      this.emit("{}");
      return;
    }
    this.emit("{ ");
    let first = true;
    for (let idx = 0; idx < node.children.length; idx++) {
      var prop = node.children[idx];
      if (first == false) {
        this.emit(", ");
      }
      first = false;
      this.printProperty(prop);
    }
    this.emit(" }");
  }
  printProperty(node) {
    const nodeType = node.type;
    if (nodeType == "SpreadElement") {
      this.printSpreadElement(node);
      return;
    }
    if (node.kind == "shorthand") {
      this.emit(node.name);
      return;
    }
    if (node.kind == "computed") {
      this.emit("[");
      if (typeof node.right !== "undefined" && node.right != null) {
        this.printNode(node.right);
      }
      this.emit("]: ");
      if (typeof node.left !== "undefined" && node.left != null) {
        this.printNode(node.left);
      }
      return;
    }
    this.emit(node.name + ": ");
    if (typeof node.left !== "undefined" && node.left != null) {
      this.printNode(node.left);
    }
  }
  printBinaryExpression(node) {
    this.emit("(");
    if (typeof node.left !== "undefined" && node.left != null) {
      this.printNode(node.left);
    }
    this.emit(" " + node.name + " ");
    if (typeof node.right !== "undefined" && node.right != null) {
      this.printNode(node.right);
    }
    this.emit(")");
  }
  printUnaryExpression(node) {
    const op = node.name;
    this.emit(op);
    if (op == "typeof") {
      this.emit(" ");
    }
    if (typeof node.left !== "undefined" && node.left != null) {
      this.printNode(node.left);
    }
  }
  printUpdateExpression(node) {
    const op = node.name;
    const isPrefix = node.kind == "prefix";
    if (isPrefix) {
      this.emit(op);
    }
    if (typeof node.left !== "undefined" && node.left != null) {
      this.printNode(node.left);
    }
    if (isPrefix == false) {
      this.emit(op);
    }
  }
  printAssignmentExpression(node) {
    if (typeof node.left !== "undefined" && node.left != null) {
      this.printNode(node.left);
    }
    this.emit(" " + node.name + " ");
    if (typeof node.right !== "undefined" && node.right != null) {
      this.printNode(node.right);
    }
  }
  printConditionalExpression(node) {
    if (typeof node.left !== "undefined" && node.left != null) {
      this.printNode(node.left);
    }
    this.emit(" ? ");
    if (typeof node.body !== "undefined" && node.body != null) {
      this.printNode(node.body);
    }
    this.emit(" : ");
    if (typeof node.right !== "undefined" && node.right != null) {
      this.printNode(node.right);
    }
  }
  printCallExpression(node) {
    if (typeof node.left !== "undefined" && node.left != null) {
      this.printNode(node.left);
    }
    this.emit("(");
    let first = true;
    for (let idx = 0; idx < node.children.length; idx++) {
      var arg = node.children[idx];
      if (first == false) {
        this.emit(", ");
      }
      first = false;
      this.printNode(arg);
    }
    this.emit(")");
  }
  printMemberExpression(node) {
    if (typeof node.left !== "undefined" && node.left != null) {
      this.printNode(node.left);
    }
    const accessType = node.kind;
    if (accessType == "bracket") {
      this.emit("[");
      if (typeof node.right !== "undefined" && node.right != null) {
        this.printNode(node.right);
      }
      this.emit("]");
    } else {
      this.emit("." + node.name);
    }
  }
  printOptionalMemberExpression(node) {
    if (typeof node.left !== "undefined" && node.left != null) {
      this.printNode(node.left);
    }
    const accessType = node.kind;
    if (accessType == "bracket") {
      this.emit("?.[");
      if (typeof node.right !== "undefined" && node.right != null) {
        this.printNode(node.right);
      }
      this.emit("]");
    } else {
      this.emit("?." + node.name);
    }
  }
  printOptionalCallExpression(node) {
    if (typeof node.left !== "undefined" && node.left != null) {
      this.printNode(node.left);
    }
    this.emit("?.(");
    let first = true;
    for (let idx = 0; idx < node.children.length; idx++) {
      var arg = node.children[idx];
      if (first == false) {
        this.emit(", ");
      }
      first = false;
      this.printNode(arg);
    }
    this.emit(")");
  }
  printImportDeclaration(node) {
    this.emit("import ");
    const numSpecifiers = node.children.length;
    if (numSpecifiers == 0) {
      if (typeof node.right !== "undefined" && node.right != null) {
        const source = node.right;
        this.emit('"' + source.raw + '"');
      }
      return;
    }
    let hasDefault = false;
    let hasNamespace = false;
    let hasNamed = false;
    for (let idx = 0; idx < node.children.length; idx++) {
      var spec = node.children[idx];
      if (spec.type == "ImportDefaultSpecifier") {
        hasDefault = true;
      }
      if (spec.type == "ImportNamespaceSpecifier") {
        hasNamespace = true;
      }
      if (spec.type == "ImportSpecifier") {
        hasNamed = true;
      }
    }
    let printedSomething = false;
    for (let idx_1 = 0; idx_1 < node.children.length; idx_1++) {
      var spec_1 = node.children[idx_1];
      if (spec_1.type == "ImportDefaultSpecifier") {
        this.emit(spec_1.name);
        printedSomething = true;
      }
    }
    for (let idx_2 = 0; idx_2 < node.children.length; idx_2++) {
      var spec_2 = node.children[idx_2];
      if (spec_2.type == "ImportNamespaceSpecifier") {
        if (printedSomething) {
          this.emit(", ");
        }
        this.emit("* as " + spec_2.name);
        printedSomething = true;
      }
    }
    if (hasNamed) {
      if (printedSomething) {
        this.emit(", ");
      }
      this.emit("{ ");
      let firstNamed = true;
      for (let idx_3 = 0; idx_3 < node.children.length; idx_3++) {
        var spec_3 = node.children[idx_3];
        if (spec_3.type == "ImportSpecifier") {
          if (firstNamed == false) {
            this.emit(", ");
          }
          firstNamed = false;
          this.emit(spec_3.name);
          if (spec_3.kind.length > 0) {
            this.emit(" as " + spec_3.kind);
          }
        }
      }
      this.emit(" }");
    }
    this.emit(" from ");
    if (typeof node.right !== "undefined" && node.right != null) {
      const source_1 = node.right;
      this.emit('"' + source_1.raw + '"');
    }
  }
  printExportNamedDeclaration(node) {
    this.emit("export ");
    const numSpecifiers = node.children.length;
    if (numSpecifiers > 0) {
      this.emit("{ ");
      let first = true;
      for (let idx = 0; idx < node.children.length; idx++) {
        var spec = node.children[idx];
        if (first == false) {
          this.emit(", ");
        }
        first = false;
        this.emit(spec.name);
        if (spec.kind.length > 0) {
          this.emit(" as " + spec.kind);
        }
      }
      this.emit(" }");
      if (typeof node.right !== "undefined" && node.right != null) {
        const source = node.right;
        this.emit(' from "' + source.raw + '"');
      }
      return;
    }
    if (typeof node.left !== "undefined" && node.left != null) {
      this.printNode(node.left);
    }
  }
  printExportDefaultDeclaration(node) {
    this.emit("export default ");
    if (typeof node.left !== "undefined" && node.left != null) {
      this.printNode(node.left);
    }
  }
  printExportAllDeclaration(node) {
    this.emit("export *");
    if (node.name.length > 0) {
      this.emit(" as " + node.name);
    }
    this.emit(" from ");
    if (typeof node.right !== "undefined" && node.right != null) {
      const source = node.right;
      this.emit('"' + source.raw + '"');
    }
  }
  printNewExpression(node) {
    this.emit("new ");
    if (typeof node.left !== "undefined" && node.left != null) {
      this.printNode(node.left);
    }
    this.emit("(");
    let first = true;
    for (let idx = 0; idx < node.children.length; idx++) {
      var arg = node.children[idx];
      if (first == false) {
        this.emit(", ");
      }
      first = false;
      this.printNode(arg);
    }
    this.emit(")");
  }
  printArrowFunction(node) {
    if (node.kind == "async") {
      this.emit("async ");
    }
    const paramCount = node.children.length;
    if (paramCount == 1) {
      const firstParam = node.children[0];
      if (firstParam.type == "Identifier") {
        this.emit(firstParam.name);
      } else {
        this.emit("(");
        this.printNode(firstParam);
        this.emit(")");
      }
    } else {
      this.emit("(");
      this.printParams(node.children);
      this.emit(")");
    }
    this.emit(" => ");
    if (typeof node.body !== "undefined" && node.body != null) {
      const body = node.body;
      if (body.type == "BlockStatement") {
        this.printNode(body);
      } else {
        this.printNode(body);
      }
    }
  }
  printFunctionExpression(node) {
    this.emit("function(");
    this.printParams(node.children);
    this.emit(") ");
    if (typeof node.body !== "undefined" && node.body != null) {
      this.printNode(node.body);
    }
  }
  printYieldExpression(node) {
    this.emit("yield");
    if (node.name == "delegate") {
      this.emit("*");
    }
    if (typeof node.left !== "undefined" && node.left != null) {
      this.emit(" ");
      this.printNode(node.left);
    }
  }
  printAwaitExpression(node) {
    this.emit("await ");
    if (typeof node.left !== "undefined" && node.left != null) {
      this.printNode(node.left);
    }
  }
  printSpreadElement(node) {
    this.emit("...");
    if (typeof node.left !== "undefined" && node.left != null) {
      this.printNode(node.left);
    }
  }
  printArrayPattern(node) {
    this.emit("[");
    let first = true;
    for (let idx = 0; idx < node.children.length; idx++) {
      var elem = node.children[idx];
      if (first == false) {
        this.emit(", ");
      }
      first = false;
      this.printNode(elem);
    }
    this.emit("]");
  }
  printObjectPattern(node) {
    this.emit("{ ");
    let first = true;
    for (let idx = 0; idx < node.children.length; idx++) {
      var prop = node.children[idx];
      if (first == false) {
        this.emit(", ");
      }
      first = false;
      const propType = prop.type;
      if (propType == "RestElement") {
        this.emit("..." + prop.name);
      } else {
        if (prop.kind == "shorthand") {
          this.emit(prop.name);
        } else {
          this.emit(prop.name + ": ");
          if (typeof prop.left !== "undefined" && prop.left != null) {
            this.printNode(prop.left);
          }
        }
      }
    }
    this.emit(" }");
  }
}
class JSParserMain {
  constructor() {}
}
JSParserMain.showHelp = function () {
  console.log("JavaScript ES6 Parser and Pretty Printer");
  console.log("");
  console.log("Usage: node js_parser.js [options]");
  console.log("");
  console.log("Options:");
  console.log("  -h, --help     Show this help message");
  console.log("  -d             Run built-in demo/test suite");
  console.log("  -i <file>      Input JavaScript file to parse");
  console.log("  -o <file>      Output file for pretty-printed JavaScript");
  console.log(
    "  --ast          Show AST instead of pretty-printed output (with -i)"
  );
  console.log("");
  console.log("Examples:");
  console.log("  node js_parser.js -d                        Run the demo");
  console.log(
    "  node js_parser.js -i script.js              Parse and show AST"
  );
  console.log(
    "  node js_parser.js -i script.js -o out.js    Parse and pretty-print to file"
  );
  console.log("  node js_parser.js -i src/app.js -o dist/app.js");
};
JSParserMain.processFile = async function (inputFile, outputFile) {
  const codeOpt = await new Promise((resolve) => {
    require("fs").readFile("." + "/" + inputFile, "utf8", (err, data) => {
      resolve(data);
    });
  });
  if (typeof codeOpt === "undefined") {
    console.log("Error: Could not read file: " + inputFile);
    return;
  }
  const code = codeOpt;
  const lexer = new Lexer(code);
  const tokens = lexer.tokenize();
  const parser = new SimpleParser();
  parser.initParserWithSource(tokens, code);
  const program = parser.parseProgram();
  if (parser.hasErrors()) {
    console.log("=== Parse Errors ===");
    for (let ei = 0; ei < parser.errors.length; ei++) {
      var err = parser.errors[ei];
      console.log(err);
    }
    console.log("");
  }
  const printer = new JSPrinter();
  const output = printer.print(program);
  require("fs").writeFileSync("." + "/" + outputFile, output);
  console.log("Parsed " + inputFile + " -> " + outputFile);
  console.log("  " + program.children.length + " statements processed");
};
JSParserMain.parseFile = async function (filename) {
  const codeOpt = await new Promise((resolve) => {
    require("fs").readFile("." + "/" + filename, "utf8", (err, data) => {
      resolve(data);
    });
  });
  if (typeof codeOpt === "undefined") {
    console.log("Error: Could not read file: " + filename);
    return;
  }
  const code = codeOpt;
  const lexer = new Lexer(code);
  const tokens = lexer.tokenize();
  const parser = new SimpleParser();
  parser.initParserWithSource(tokens, code);
  const program = parser.parseProgram();
  if (parser.hasErrors()) {
    console.log("=== Parse Errors ===");
    for (let ei = 0; ei < parser.errors.length; ei++) {
      var err = parser.errors[ei];
      console.log(err);
    }
    console.log("");
  }
  console.log("Program with " + program.children.length + " statements:");
  console.log("");
  for (let idx = 0; idx < program.children.length; idx++) {
    var stmt = program.children[idx];
    ASTPrinter.printNode(stmt, 0);
  }
};
JSParserMain.runDemo = function () {
  const code =
    "// Variable declarations\r\nvar y = 'hello';\r\n\r\n// Function declaration\r\nfunction add(a, b) {\r\n    return a + b;\r\n}\r\n\r\n// While loop\r\nvar i = 0;\r\nwhile (i < 10) {\r\n    i = i + 1;\r\n}\r\n\r\n// Do-while loop\r\ndo {\r\n    i = i - 1;\r\n} while (i > 0);\r\n\r\n// For loop\r\nfor (var j = 0; j < 5; j = j + 1) {\r\n    x = x + j;\r\n}\r\n\r\n// Switch statement\r\nswitch (x) {\r\n    case 1:\r\n        y = 'one';\r\n        break;\r\n    case 2:\r\n        y = 'two';\r\n        break;\r\n    default:\r\n        y = 'other';\r\n}\r\n\r\n// Try-catch-finally\r\ntry {\r\n    throw 'error';\r\n} catch (e) {\r\n    y = e;\r\n} finally {\r\n    x = 0;\r\n}\r\n\r\n// If-else\r\nif (x > 100) {\r\n    y = 'big';\r\n} else {\r\n    y = 'small';\r\n}\r\n\r\nvar arr = [1, 2, 3];\r\nvar obj = { name: 'test', value: 42 };\r\n\r\n// Unary expressions\r\nvar negNum = -42;\r\nvar posNum = +5;\r\nvar notTrue = !true;\r\nvar notFalse = !false;\r\nvar doubleNot = !!x;\r\nvar negExpr = -(a + b);\r\n\r\n// Logical expressions\r\nvar andResult = true && false;\r\nvar orResult = true || false;\r\nvar complexLogic = (a > 0) && (b < 10) || (c == 5);\r\nvar shortCircuit = x && y && z;\r\nvar orChain = a || b || c;\r\n\r\n// Ternary expressions\r\nvar ternResult = x > 0 ? 'positive' : 'non-positive';\r\nvar nestedTern = a > b ? (b > c ? 'a>b>c' : 'a>b, b<=c') : 'a<=b';\r\nvar ternInExpr = 1 + (x ? 2 : 3);\r\n\r\n// Operator precedence tests\r\nvar prec1 = 1 + 2 * 3;\r\nvar prec2 = (1 + 2) * 3;\r\nvar prec3 = 1 + 2 + 3 + 4;\r\nvar prec4 = 2 * 3 + 4 * 5;\r\nvar prec5 = 1 < 2 && 3 > 1;\r\nvar prec6 = !x && y || z;\r\nvar prec7 = a == b && c != d;\r\nvar prec8 = -x + y * -z;\r\n\r\n// Comparison operators\r\nvar cmp1 = a == b;\r\nvar cmp2 = a != b;\r\nvar cmp3 = a < b;\r\nvar cmp4 = a <= b;\r\nvar cmp5 = a > b;\r\nvar cmp6 = a >= b;\r\n\r\n// === ES6 Features ===\r\n\r\n// let and const\r\nlet count = 0;\r\nconst PI = 3.14159;\r\n\r\n// Arrow functions\r\nconst add = (a, b) => a + b;\r\nconst double = x => x * 2;\r\nconst greet = (name) => {\r\n    return 'Hello, ' + name;\r\n};\r\nconst multiLine = (a, b) => {\r\n    let sum = a + b;\r\n    return sum * 2;\r\n};\r\n\r\n// Template literals\r\nlet name = 'World';\r\nlet greeting = `Hello, ${name}!`;\r\nlet multi = `Line 1\r\nLine 2`;\r\n\r\n// Class syntax\r\nclass Animal {\r\n    constructor(name) {\r\n        this.name = name;\r\n    }\r\n    \r\n    speak() {\r\n        return this.name + ' makes a sound';\r\n    }\r\n    \r\n    static create(name) {\r\n        return new Animal(name);\r\n    }\r\n}\r\n\r\nclass Dog extends Animal {\r\n    constructor(name, breed) {\r\n        super(name);\r\n        this.breed = breed;\r\n    }\r\n    \r\n    speak() {\r\n        return this.name + ' barks';\r\n    }\r\n}\r\n\r\n// Generator functions\r\nfunction* numberGenerator() {\r\n    yield 1;\r\n    yield 2;\r\n    yield 3;\r\n}\r\n\r\nfunction* delegateGenerator() {\r\n    yield* numberGenerator();\r\n    yield 4;\r\n}\r\n\r\n// Async/await\r\nasync function fetchData() {\r\n    const response = await fetch('/api/data');\r\n    const data = await response.json();\r\n    return data;\r\n}\r\n\r\nasync function processItems(items) {\r\n    for (const item of items) {\r\n        await processItem(item);\r\n    }\r\n}\r\n\r\n// Async arrow functions\r\nconst asyncArrow = async (x) => {\r\n    const result = await doSomething(x);\r\n    return result * 2;\r\n};\r\n\r\nconst asyncFetch = async (url) => await fetch(url);\r\n\r\n// Async generator (ES2018)\r\nasync function* asyncGenerator() {\r\n    yield await fetch('/api/1');\r\n    yield await fetch('/api/2');\r\n}\r\n\r\n// === for...of and for...in loops ===\r\n\r\n// For-of loop\r\nfor (const item of items) {\r\n    console.log(item);\r\n}\r\n\r\n// For-in loop\r\nfor (const key in obj) {\r\n    console.log(key);\r\n}\r\n\r\n// For-of with array destructuring\r\nfor (const [index, value] of entries) {\r\n    console.log(index, value);\r\n}\r\n\r\n// === Spread operator ===\r\n\r\n// Array spread\r\nconst arr1 = [1, 2, 3];\r\nconst arr2 = [...arr1, 4, 5];\r\nconst combined = [...arr1, ...arr2];\r\n\r\n// Object spread\r\nconst obj1 = { a: 1, b: 2 };\r\nconst obj2 = { ...obj1, c: 3 };\r\nconst merged = { ...obj1, ...obj2 };\r\n\r\n// Spread in function call\r\nconsole.log(...args);\r\n\r\n// === Rest parameters ===\r\n\r\nfunction sum(...numbers) {\r\n    return numbers.reduce((a, b) => a + b);\r\n}\r\n\r\nfunction firstAndRest(first, ...rest) {\r\n    return { first, rest };\r\n}\r\n\r\n// === Destructuring ===\r\n\r\n// Array destructuring\r\nconst [x, y, z] = [1, 2, 3];\r\nconst [first, ...others] = arr1;\r\nlet [a, b] = [b, a];\r\n\r\n// Object destructuring\r\nconst { name, age } = person;\r\nconst { x: newX, y: newY } = point;\r\nconst { a: { b: nested } } = deep;\r\n\r\n// Destructuring with default (parsed as identifier for now)\r\nconst { foo, bar } = obj;\r\n\r\n// Nested destructuring\r\nconst { user: { name: userName } } = data;\r\nconst [{ id }, { id: id2 }] = items;\r\n\r\n// Shorthand properties\r\nconst shorthand = { x, y, z };\r\n";
  console.log("=== JavaScript ES6 Parser ===");
  console.log("");
  console.log("Input:");
  console.log(code);
  console.log("");
  const lexer = new Lexer(code);
  const tokens = lexer.tokenize();
  console.log("--- Tokens: " + tokens.length + " ---");
  console.log("");
  const parser = new SimpleParser();
  parser.initParserWithSource(tokens, code);
  const program = parser.parseProgram();
  if (parser.hasErrors()) {
    console.log("=== Parse Errors ===");
    for (let ei = 0; ei < parser.errors.length; ei++) {
      var err = parser.errors[ei];
      console.log(err);
    }
    console.log("");
  }
  console.log("Program with " + program.children.length + " statements:");
  console.log("");
  console.log("--- AST ---");
  for (let idx = 0; idx < program.children.length; idx++) {
    var stmt = program.children[idx];
    ASTPrinter.printNode(stmt, 0);
  }
  console.log("");
  console.log("--- Pretty Printed Output ---");
  const printer = new JSPrinter();
  const output = printer.print(program);
  console.log(output);
};
/* static JavaSript main routine at the end of the JS file */
async function __js_main() {
  const argCnt = process.argv.length - 2;
  if (argCnt == 0) {
    JSParserMain.showHelp();
    return;
  }
  let inputFile = "";
  let outputFile = "";
  let runDefault = false;
  let showAst = false;
  let i = 0;
  while (i < argCnt) {
    const arg = process.argv[2 + i];
    if (arg == "--help" || arg == "-h") {
      JSParserMain.showHelp();
      return;
    }
    if (arg == "-d") {
      runDefault = true;
      i = i + 1;
    } else {
      if (arg == "-i") {
        i = i + 1;
        if (i < argCnt) {
          inputFile = process.argv[2 + i];
        }
        i = i + 1;
      } else {
        if (arg == "-o") {
          i = i + 1;
          if (i < argCnt) {
            outputFile = process.argv[2 + i];
          }
          i = i + 1;
        } else {
          if (arg == "--ast") {
            showAst = true;
            i = i + 1;
          } else {
            i = i + 1;
          }
        }
      }
    }
  }
  if (runDefault) {
    JSParserMain.runDemo();
    return;
  }
  if (inputFile.length > 0) {
    if (outputFile.length > 0) {
      await JSParserMain.processFile(inputFile, outputFile);
    } else {
      await JSParserMain.parseFile(inputFile);
    }
    return;
  }
  JSParserMain.showHelp();
}

module.exports = {
  __js_main,
  JSParserMain,
  JSPrinter,
  SimpleParser,
  Lexer,
  Token,
  ASTPrinter,
};
