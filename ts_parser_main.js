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
      return this.parseFuncDecl();
    }
    if ( tokVal == "return" ) {
      return this.parseReturn();
    }
    if ( tokVal == "if" ) {
      return this.parseIfStatement();
    }
    if ( tokVal == "while" ) {
      return this.parseWhileStatement();
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
    return this.parseExprStmt();
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
      for ( let ext_1 = 0; ext_1 < extendsList.length; ext_1++) {
        var ext = extendsList[ext_1];
        const wrapper = new TSNode();
        wrapper.nodeType = "TSExpressionWithTypeArguments";
        wrapper.left = ext_1;
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
    let isStatic = false;
    let isAbstract = false;
    let isReadonly = false;
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
      }
      if ( tokVal == "abstract" ) {
        isAbstract = true;
        this.advance();
      }
      if ( tokVal == "readonly" ) {
        isReadonly = true;
        this.advance();
      }
      const newTokVal = this.peekValue();
      if ( (((((newTokVal != "public") && (newTokVal != "private")) && (newTokVal != "protected")) && (newTokVal != "static")) && (newTokVal != "abstract")) && (newTokVal != "readonly") ) {
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
  parseForStatement () {
    const node = new TSNode();
    const startTok = this.peek();
    node.start = startTok.start;
    node.line = startTok.line;
    node.col = startTok.col;
    this.expectValue("for");
    this.expectValue("(");
    const tokVal = this.peekValue();
    if ( ((tokVal == "let") || (tokVal == "const")) || (tokVal == "var") ) {
      const kind = tokVal;
      this.advance();
      const varName = this.expect("Identifier");
      const nextVal = this.peekValue();
      if ( nextVal == "of" ) {
        node.nodeType = "ForOfStatement";
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
        this.advance();
        const innerType = this.parseType();
        const restType = new TSNode();
        restType.nodeType = "TSRestType";
        restType.start = innerType.start;
        restType.line = innerType.line;
        restType.col = innerType.col;
        restType.typeAnnotation = innerType;
        tuple.children.push(restType);
      } else {
        const elemType = this.parseType();
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
        /** unused:  const savedPos2 = this.pos   **/ 
        /** unused:  const savedToken2 = this.currentToken   **/ 
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
  parseNullishCoalescing () {
    let left = this.parseBinary();
    while (this.matchValue("??")) {
      this.advance();
      const right = this.parseBinary();
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
    return this.parsePostfix();
  };
  parsePostfix () {
    let expr = this.parsePrimary();
    let keepParsing = true;
    while (keepParsing) {
      const tokVal = this.peekValue();
      if ( tokVal == "(" ) {
        this.advance();
        const call = new TSNode();
        call.nodeType = "CallExpression";
        call.left = expr;
        call.start = expr.start;
        call.line = expr.line;
        call.col = expr.col;
        while (this.matchValue(")") == false) {
          if ( (call.children.length) > 0 ) {
            this.expectValue(",");
          }
          const arg = this.parseExpr();
          call.children.push(arg);
        };
        this.expectValue(")");
        expr = call;
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
          while (this.matchValue(")") == false) {
            if ( (optCall.children.length) > 0 ) {
              this.expectValue(",");
            }
            const arg_1 = this.parseExpr();
            optCall.children.push(arg_1);
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
        const nextTokVal_1 = this.peekValue();
        if ( (((nextTokVal_1 == ".") || (nextTokVal_1 == "[")) || (nextTokVal_1 == "(")) || (nextTokVal_1 == "?.") ) {
          const nonNull = new TSNode();
          nonNull.nodeType = "TSNonNullExpression";
          nonNull.left = expr;
          nonNull.start = expr.start;
          nonNull.line = expr.line;
          nonNull.col = tok.col;
          expr = nonNull;
        } else {
          this.pos = this.pos - 1;
          this.currentToken = tok;
          keepParsing = false;
        }
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
      const newTokVal = this.peekValue();
      if ( (((((newTokVal != "(") && (newTokVal != ".")) && (newTokVal != "?.")) && (newTokVal != "[")) && (newTokVal != "!")) && (newTokVal != "as") ) {
        keepParsing = false;
      }
    };
    return expr;
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
