#!/usr/bin/env node
class Token  {
  constructor() {
    this.type = "";
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
    if ( ch == "\n" ) {
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
  skipLineComment () {
    while (this.pos < this.__len) {
      const ch = this.advance();
      if ( ch == "\n" ) {
        return;
      }
    };
  };
  skipBlockComment () {
    while (this.pos < this.__len) {
      const ch = this.advance();
      if ( ch == "*" ) {
        if ( this.peek() == "/" ) {
          this.advance();
          return;
        }
      }
    };
  };
  makeToken (type, value, startPos, startLine, startCol) {
    const tok = new Token();
    tok.type = type;
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
        if ( esc == quote ) {
          value = value + quote;
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
        this.advance();
        this.advance();
        this.skipLineComment();
        return this.nextToken();
      }
      if ( next == "*" ) {
        this.advance();
        this.advance();
        this.skipBlockComment();
        return this.nextToken();
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
    this.advance();
    return this.makeToken("Punctuator", ch, startPos, startLine, startCol);
  };
  tokenize () {
    let tokens = [];
    while (true) {
      const tok = this.nextToken();
      tokens.push(tok);
      if ( tok.type == "EOF" ) {
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
    return tok.type;
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
      eof.type = "EOF";
      eof.value = "";
      this.currentToken = eof;
    }
  };
  expect (expectedType) {
    const tok = this.peek();
    if ( tok.type != expectedType ) {
      console.log((("Parse error: expected " + expectedType) + " but got ") + tok.type);
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
    const func = new JSNode();
    func.nodeType = "FunctionDeclaration";
    const startTok = this.peek();
    func.start = startTok.start;
    func.line = startTok.line;
    func.col = startTok.col;
    this.expectValue("function");
    const idTok = this.expect("Identifier");
    func.strValue = idTok.value;
    this.expectValue("(");
    while (this.matchValue(")") == false) {
      if ( (func.children.length) > 0 ) {
        this.expectValue(",");
      }
      const paramTok = this.expect("Identifier");
      const param = new JSNode();
      param.nodeType = "Identifier";
      param.strValue = paramTok.value;
      param.start = paramTok.start;
      param.line = paramTok.line;
      param.col = paramTok.col;
      func.children.push(param);
    };
    this.expectValue(")");
    const body = this.parseBlock();
    func.body = body;
    return func;
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
    const left = this.parseLogicalOr();
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
  console.log(((indent + nodeType) + " ") + loc);
};
/* static JavaSript main routine at the end of the JS file */
function __js_main() {
  const code = "var x = 123;\r\nvar y = 'hello';\r\nfunction add(a, b) {\r\n    return a + b;\r\n}\r\nvar result = add(1, 2);\r\nif (x > 100) {\r\n    y = 'big';\r\n} else {\r\n    y = 'small';\r\n}\r\nvar arr = [1, 2, 3];\r\nvar obj = { name: 'test', value: 42 };\r\n";
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
