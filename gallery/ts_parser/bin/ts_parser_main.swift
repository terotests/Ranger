import Foundation
func ==(l: Token, r: Token) -> Bool {
  return l === r
}
class Token : Equatable  { 
  var tokenType : String = ""
  var value : String = ""
  var line : Int = 0
  var col : Int = 0
  var start : Int = 0
  var end : Int = 0
}
func ==(l: TSLexer, r: TSLexer) -> Bool {
  return l === r
}
class TSLexer : Equatable  { 
  var source : String = ""
  var pos : Int = 0
  var line : Int = 1
  var col : Int = 1
  var __len : Int = 0
  init(src : String ) {
    self.source = src;
    self.__len = src.count;
  }
  func peek() -> String {
    if ( self.pos >= self.__len ) {
      return "";
    }
    return String(self.source[self.source.index(self.source.startIndex, offsetBy:self.pos)]);
  }
  func peekAt(offset : Int) -> String {
    let idx : Int = self.pos + offset
    if ( idx >= self.__len ) {
      return "";
    }
    return String(self.source[self.source.index(self.source.startIndex, offsetBy:idx)]);
  }
  func advance() -> String {
    if ( self.pos >= self.__len ) {
      return "";
    }
    let ch : String = String(self.source[self.source.index(self.source.startIndex, offsetBy:self.pos)])
    self.pos = self.pos + 1;
    if ( (ch == "\n") || (ch == "\r\n") ) {
      self.line = self.line + 1;
      self.col = 1;
    } else {
      self.col = self.col + 1;
    }
    return ch;
  }
  func isDigit(ch : String) -> Bool {
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
  }
  func isAlpha(ch : String) -> Bool {
    if ( (ch.count) == 0 ) {
      return false;
    }
    let code : Int = Int(self.source[self.source.index(self.source.startIndex, offsetBy: self.pos)].asciiValue ?? 0)
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
  }
  func isAlphaNumCh(ch : String) -> Bool {
    if ( self.isDigit(ch : ch) ) {
      return true;
    }
    if ( ch == "_" ) {
      return true;
    }
    if ( ch == "$" ) {
      return true;
    }
    if ( (ch.count) == 0 ) {
      return false;
    }
    let code : Int = Int(self.source[self.source.index(self.source.startIndex, offsetBy: self.pos)].asciiValue ?? 0)
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
  }
  func isWhitespace(ch : String) -> Bool {
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
  }
  func skipWhitespace() -> Void {
    while (self.pos < self.__len) {
      let ch : String = self.peek()
      if ( self.isWhitespace(ch : ch) ) {
        _ = self.advance()
      } else {
        return;
      }
    }
  }
  func makeToken(tokType : String, value : String, startPos : Int, startLine : Int, startCol : Int) -> Token {
    let tok : Token = Token()
    tok.tokenType = tokType;
    tok.value = value;
    tok.start = startPos;
    tok.end = self.pos;
    tok.line = startLine;
    tok.col = startCol;
    return tok;
  }
  func readLineComment() -> Token {
    let startPos : Int = self.pos
    let startLine : Int = self.line
    let startCol : Int = self.col
    _ = self.advance()
    _ = self.advance()
    var value : String = ""
    while (self.pos < self.__len) {
      let ch : String = self.peek()
      if ( ch == "\n" ) {
        return self.makeToken(tokType : "LineComment", value : value, startPos : startPos, startLine : startLine, startCol : startCol);
      }
      if ( ch == "\r\n" ) {
        return self.makeToken(tokType : "LineComment", value : value, startPos : startPos, startLine : startLine, startCol : startCol);
      }
      value = value + self.advance();
    }
    return self.makeToken(tokType : "LineComment", value : value, startPos : startPos, startLine : startLine, startCol : startCol);
  }
  func readBlockComment() -> Token {
    let startPos : Int = self.pos
    let startLine : Int = self.line
    let startCol : Int = self.col
    _ = self.advance()
    _ = self.advance()
    var value : String = ""
    while (self.pos < self.__len) {
      let ch : String = self.peek()
      if ( ch == "*" ) {
        if ( self.peekAt(offset : 1) == "/" ) {
          _ = self.advance()
          _ = self.advance()
          return self.makeToken(tokType : "BlockComment", value : value, startPos : startPos, startLine : startLine, startCol : startCol);
        }
      }
      value = value + self.advance();
    }
    return self.makeToken(tokType : "BlockComment", value : value, startPos : startPos, startLine : startLine, startCol : startCol);
  }
  func readString(quote : String) -> Token {
    let startPos : Int = self.pos
    let startLine : Int = self.line
    let startCol : Int = self.col
    _ = self.advance()
    var value : String = ""
    while (self.pos < self.__len) {
      let ch : String = self.peek()
      if ( ch == quote ) {
        _ = self.advance()
        return self.makeToken(tokType : "String", value : value, startPos : startPos, startLine : startLine, startCol : startCol);
      }
      if ( ch == "\\" ) {
        _ = self.advance()
        let esc : String = self.advance()
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
        value = value + self.advance();
      }
    }
    return self.makeToken(tokType : "String", value : value, startPos : startPos, startLine : startLine, startCol : startCol);
  }
  func readTemplateLiteral() -> Token {
    let startPos : Int = self.pos
    let startLine : Int = self.line
    let startCol : Int = self.col
    _ = self.advance()
    var value : String = ""
    while (self.pos < self.__len) {
      let ch : String = self.peek()
      if ( ch == "`" ) {
        _ = self.advance()
        return self.makeToken(tokType : "Template", value : value, startPos : startPos, startLine : startLine, startCol : startCol);
      }
      if ( ch == "\\" ) {
        _ = self.advance()
        let esc : String = self.advance()
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
        value = value + self.advance();
      }
    }
    return self.makeToken(tokType : "Template", value : value, startPos : startPos, startLine : startLine, startCol : startCol);
  }
  func readNumber() -> Token {
    let startPos : Int = self.pos
    let startLine : Int = self.line
    let startCol : Int = self.col
    var value : String = ""
    while (self.pos < self.__len) {
      let ch : String = self.peek()
      if ( self.isDigit(ch : ch) ) {
        value = value + self.advance();
      } else {
        if ( ch == "." ) {
          value = value + self.advance();
        } else {
          return self.makeToken(tokType : "Number", value : value, startPos : startPos, startLine : startLine, startCol : startCol);
        }
      }
    }
    return self.makeToken(tokType : "Number", value : value, startPos : startPos, startLine : startLine, startCol : startCol);
  }
  func readIdentifier() -> Token {
    let startPos : Int = self.pos
    let startLine : Int = self.line
    let startCol : Int = self.col
    var value : String = ""
    while (self.pos < self.__len) {
      let ch : String = self.peek()
      if ( self.isAlphaNumCh(ch : ch) ) {
        value = value + self.advance();
      } else {
        return self.makeToken(tokType : self.identType(value : value), value : value, startPos : startPos, startLine : startLine, startCol : startCol);
      }
    }
    return self.makeToken(tokType : self.identType(value : value), value : value, startPos : startPos, startLine : startLine, startCol : startCol);
  }
  func identType(value : String) -> String {
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
  }
  func nextToken() -> Token {
    self.skipWhitespace()
    if ( self.pos >= self.__len ) {
      return self.makeToken(tokType : "EOF", value : "", startPos : self.pos, startLine : self.line, startCol : self.col);
    }
    let ch : String = self.peek()
    let startPos : Int = self.pos
    let startLine : Int = self.line
    let startCol : Int = self.col
    if ( ch == "/" ) {
      let next : String = self.peekAt(offset : 1)
      if ( next == "/" ) {
        return self.readLineComment();
      }
      if ( next == "*" ) {
        return self.readBlockComment();
      }
    }
    if ( ch == "\"" ) {
      return self.readString(quote : "\"");
    }
    if ( ch == "'" ) {
      return self.readString(quote : "'");
    }
    if ( ch == "`" ) {
      return self.readTemplateLiteral();
    }
    if ( self.isDigit(ch : ch) ) {
      return self.readNumber();
    }
    if ( self.isAlpha(ch : ch) ) {
      return self.readIdentifier();
    }
    let next_1 : String = self.peekAt(offset : 1)
    if ( ch == "=" ) {
      if ( next_1 == "=" ) {
        if ( self.peekAt(offset : 2) == "=" ) {
          _ = self.advance()
          _ = self.advance()
          _ = self.advance()
          return self.makeToken(tokType : "Punctuator", value : "===", startPos : startPos, startLine : startLine, startCol : startCol);
        }
      }
    }
    if ( ch == "!" ) {
      if ( next_1 == "=" ) {
        if ( self.peekAt(offset : 2) == "=" ) {
          _ = self.advance()
          _ = self.advance()
          _ = self.advance()
          return self.makeToken(tokType : "Punctuator", value : "!==", startPos : startPos, startLine : startLine, startCol : startCol);
        }
      }
    }
    if ( ch == "=" ) {
      if ( next_1 == ">" ) {
        _ = self.advance()
        _ = self.advance()
        return self.makeToken(tokType : "Punctuator", value : "=>", startPos : startPos, startLine : startLine, startCol : startCol);
      }
    }
    if ( ch == "=" ) {
      if ( next_1 == "=" ) {
        _ = self.advance()
        _ = self.advance()
        return self.makeToken(tokType : "Punctuator", value : "==", startPos : startPos, startLine : startLine, startCol : startCol);
      }
    }
    if ( ch == "!" ) {
      if ( next_1 == "=" ) {
        _ = self.advance()
        _ = self.advance()
        return self.makeToken(tokType : "Punctuator", value : "!=", startPos : startPos, startLine : startLine, startCol : startCol);
      }
    }
    if ( ch == "<" ) {
      if ( next_1 == "=" ) {
        _ = self.advance()
        _ = self.advance()
        return self.makeToken(tokType : "Punctuator", value : "<=", startPos : startPos, startLine : startLine, startCol : startCol);
      }
    }
    if ( ch == ">" ) {
      if ( next_1 == "=" ) {
        _ = self.advance()
        _ = self.advance()
        return self.makeToken(tokType : "Punctuator", value : ">=", startPos : startPos, startLine : startLine, startCol : startCol);
      }
    }
    if ( ch == "&" ) {
      if ( next_1 == "&" ) {
        _ = self.advance()
        _ = self.advance()
        return self.makeToken(tokType : "Punctuator", value : "&&", startPos : startPos, startLine : startLine, startCol : startCol);
      }
    }
    if ( ch == "|" ) {
      if ( next_1 == "|" ) {
        _ = self.advance()
        _ = self.advance()
        return self.makeToken(tokType : "Punctuator", value : "||", startPos : startPos, startLine : startLine, startCol : startCol);
      }
    }
    if ( ch == "?" ) {
      if ( next_1 == "?" ) {
        _ = self.advance()
        _ = self.advance()
        return self.makeToken(tokType : "Punctuator", value : "??", startPos : startPos, startLine : startLine, startCol : startCol);
      }
      if ( next_1 == "." ) {
        _ = self.advance()
        _ = self.advance()
        return self.makeToken(tokType : "Punctuator", value : "?.", startPos : startPos, startLine : startLine, startCol : startCol);
      }
    }
    if ( ch == "+" ) {
      if ( next_1 == "+" ) {
        _ = self.advance()
        _ = self.advance()
        return self.makeToken(tokType : "Punctuator", value : "++", startPos : startPos, startLine : startLine, startCol : startCol);
      }
    }
    if ( ch == "-" ) {
      if ( next_1 == "-" ) {
        _ = self.advance()
        _ = self.advance()
        return self.makeToken(tokType : "Punctuator", value : "--", startPos : startPos, startLine : startLine, startCol : startCol);
      }
    }
    if ( ch == "." ) {
      if ( next_1 == "." ) {
        if ( self.peekAt(offset : 2) == "." ) {
          _ = self.advance()
          _ = self.advance()
          _ = self.advance()
          return self.makeToken(tokType : "Punctuator", value : "...", startPos : startPos, startLine : startLine, startCol : startCol);
        }
      }
    }
    _ = self.advance()
    return self.makeToken(tokType : "Punctuator", value : ch, startPos : startPos, startLine : startLine, startCol : startCol);
  }
  func tokenize() -> [Token] {
    var tokens : [Token] = [Token]()
    while (true) {
      let tok : Token = self.nextToken()
      tokens.append(tok)
      if ( tok.tokenType == "EOF" ) {
        return tokens;
      }
    }
    return tokens;
  }
}
func ==(l: TSNode, r: TSNode) -> Bool {
  return l === r
}
class TSNode : Equatable  { 
  var nodeType : String = ""
  var start : Int = 0
  var end : Int = 0
  var line : Int = 0
  var col : Int = 0
  var name : String = ""
  var value : String = ""
  var kind : String = ""
  var optional : Bool = false
  var readonly : Bool = false
  var children : [TSNode] = [TSNode]()
  var params : [TSNode] = [TSNode]()
  var decorators : [TSNode] = [TSNode]()
  var left : TSNode?
  var right : TSNode?
  var body : TSNode?
  var _init : TSNode?
  var typeAnnotation : TSNode?
}
func ==(l: TSParserSimple, r: TSParserSimple) -> Bool {
  return l === r
}
class TSParserSimple : Equatable  { 
  var tokens : [Token] = [Token]()
  var pos : Int = 0
  var currentToken : Token?
  var quiet : Bool = false
  var tsxMode : Bool = false
  func initParser(toks : [Token]) -> Void {
    self.tokens = toks;
    self.pos = 0;
    self.quiet = false;
    if ( (toks.count) > 0 ) {
      self.currentToken = toks[0];
    }
  }
  func setQuiet(q : Bool) -> Void {
    self.quiet = q;
  }
  func setTsxMode(enabled : Bool) -> Void {
    self.tsxMode = enabled;
  }
  func peek() -> Token {
    return self.currentToken!;
  }
  func peekType() -> String {
    if ( self.currentToken == nil ) {
      return "EOF";
    }
    let tok : Token = self.currentToken!
    return tok.tokenType;
  }
  func peekValue() -> String {
    if ( self.currentToken == nil ) {
      return "";
    }
    let tok : Token = self.currentToken!
    return tok.value;
  }
  func advance() -> Void {
    self.pos = self.pos + 1;
    if ( self.pos < (self.tokens.count) ) {
      self.currentToken = self.tokens[self.pos];
    } else {
      let eof : Token = Token()
      eof.tokenType = "EOF";
      eof.value = "";
      self.currentToken = eof;
    }
  }
  func expect(expectedType : String) -> Token {
    let tok : Token = self.peek()
    if ( tok.tokenType != expectedType ) {
      if ( self.quiet == false ) {
        print((("Parse error: expected " + expectedType) + " but got ") + tok.tokenType)
      }
    }
    self.advance()
    return tok;
  }
  func expectValue(expectedValue : String) -> Token {
    let tok : Token = self.peek()
    if ( tok.value != expectedValue ) {
      if ( self.quiet == false ) {
        print(((("Parse error: expected '" + expectedValue) + "' but got '") + tok.value) + "'")
      }
    }
    self.advance()
    return tok;
  }
  func isAtEnd() -> Bool {
    let t : String = self.peekType()
    return t == "EOF";
  }
  func matchType(tokenType : String) -> Bool {
    let t : String = self.peekType()
    return t == tokenType;
  }
  func matchValue(value : String) -> Bool {
    let v : String = self.peekValue()
    return v == value;
  }
  func parseProgram() -> TSNode {
    let prog : TSNode = TSNode()
    prog.nodeType = "Program";
    while (self.isAtEnd() == false) {
      let stmt : TSNode = self.parseStatement()
      prog.children.append(stmt)
    }
    return prog;
  }
  func parseStatement() -> TSNode {
    let tokVal : String = self.peekValue()
    if ( tokVal == "@" ) {
      var decorators : [TSNode] = [TSNode]()
      while (self.matchValue(value : "@")) {
        let dec : TSNode = self.parseDecorator()
        decorators.append(dec)
      }
      let decorated : TSNode = self.parseStatement()
      decorated.decorators = decorators;
      return decorated;
    }
    if ( tokVal == "declare" ) {
      return self.parseDeclare();
    }
    if ( tokVal == "import" ) {
      return self.parseImport();
    }
    if ( tokVal == "export" ) {
      return self.parseExport();
    }
    if ( tokVal == "interface" ) {
      return self.parseInterface();
    }
    if ( tokVal == "type" ) {
      return self.parseTypeAlias();
    }
    if ( tokVal == "class" ) {
      return self.parseClass();
    }
    if ( tokVal == "abstract" ) {
      let nextVal : String = self.peekNextValue()
      if ( nextVal == "class" ) {
        return self.parseClass();
      }
    }
    if ( tokVal == "enum" ) {
      return self.parseEnum();
    }
    if ( tokVal == "namespace" ) {
      return self.parseNamespace();
    }
    if ( tokVal == "const" ) {
      let nextVal_1 : String = self.peekNextValue()
      if ( nextVal_1 == "enum" ) {
        return self.parseEnum();
      }
    }
    if ( (tokVal == "let") || (tokVal == "const") ) {
      return self.parseVarDecl();
    }
    if ( tokVal == "function" ) {
      return self.parseFuncDecl();
    }
    if ( tokVal == "return" ) {
      return self.parseReturn();
    }
    if ( tokVal == "throw" ) {
      return self.parseThrow();
    }
    if ( tokVal == "if" ) {
      return self.parseIfStatement();
    }
    if ( tokVal == "while" ) {
      return self.parseWhileStatement();
    }
    if ( tokVal == "do" ) {
      return self.parseDoWhileStatement();
    }
    if ( tokVal == "for" ) {
      return self.parseForStatement();
    }
    if ( tokVal == "switch" ) {
      return self.parseSwitchStatement();
    }
    if ( tokVal == "try" ) {
      return self.parseTryStatement();
    }
    if ( tokVal == "{" ) {
      return self.parseBlock();
    }
    if ( tokVal == ";" ) {
      self.advance()
      let empty : TSNode = TSNode()
      empty.nodeType = "EmptyStatement";
      return empty;
    }
    return self.parseExprStmt();
  }
  func peekNextValue() -> String {
    let nextPos : Int = self.pos + 1
    if ( nextPos < (self.tokens.count) ) {
      let nextTok : Token = self.tokens[nextPos]
      return nextTok.value;
    }
    return "";
  }
  func parseReturn() -> TSNode {
    let node : TSNode = TSNode()
    node.nodeType = "ReturnStatement";
    let startTok : Token = self.peek()
    node.start = startTok.start;
    node.line = startTok.line;
    node.col = startTok.col;
    _ = self.expectValue(expectedValue : "return")
    let v : String = self.peekValue()
    if ( (v != ";") && (self.isAtEnd() == false) ) {
      let arg : TSNode = self.parseExpr()
      node.left = arg;
    }
    if ( self.matchValue(value : ";") ) {
      self.advance()
    }
    return node;
  }
  func parseImport() -> TSNode {
    let node : TSNode = TSNode()
    node.nodeType = "ImportDeclaration";
    let startTok : Token = self.peek()
    node.start = startTok.start;
    node.line = startTok.line;
    node.col = startTok.col;
    _ = self.expectValue(expectedValue : "import")
    if ( self.matchValue(value : "type") ) {
      self.advance()
      node.kind = "type";
    }
    let v : String = self.peekValue()
    if ( v == "{" ) {
      self.advance()
      var specifiers : [TSNode] = [TSNode]()
      while ((self.matchValue(value : "}") == false) && (self.isAtEnd() == false)) {
        let spec : TSNode = TSNode()
        spec.nodeType = "ImportSpecifier";
        if ( self.matchValue(value : "type") ) {
          self.advance()
          spec.kind = "type";
        }
        let importedName : Token = self.expect(expectedType : "Identifier")
        spec.name = importedName.value;
        if ( self.matchValue(value : "as") ) {
          self.advance()
          let localName : Token = self.expect(expectedType : "Identifier")
          spec.value = localName.value;
        } else {
          spec.value = importedName.value;
        }
        specifiers.append(spec)
        if ( self.matchValue(value : ",") ) {
          self.advance()
        }
      }
      _ = self.expectValue(expectedValue : "}")
      node.children = specifiers;
    }
    if ( v == "*" ) {
      self.advance()
      _ = self.expectValue(expectedValue : "as")
      let namespaceName : Token = self.expect(expectedType : "Identifier")
      let nsSpec : TSNode = TSNode()
      nsSpec.nodeType = "ImportNamespaceSpecifier";
      nsSpec.name = namespaceName.value;
      node.children.append(nsSpec)
    }
    if ( self.matchType(tokenType : "Identifier") ) {
      let defaultSpec : TSNode = TSNode()
      defaultSpec.nodeType = "ImportDefaultSpecifier";
      let defaultName : Token = self.expect(expectedType : "Identifier")
      defaultSpec.name = defaultName.value;
      node.children.append(defaultSpec)
      if ( self.matchValue(value : ",") ) {
        self.advance()
        if ( self.matchValue(value : "{") ) {
          self.advance()
          while ((self.matchValue(value : "}") == false) && (self.isAtEnd() == false)) {
            let spec_1 : TSNode = TSNode()
            spec_1.nodeType = "ImportSpecifier";
            let importedName_1 : Token = self.expect(expectedType : "Identifier")
            spec_1.name = importedName_1.value;
            if ( self.matchValue(value : "as") ) {
              self.advance()
              let localName_1 : Token = self.expect(expectedType : "Identifier")
              spec_1.value = localName_1.value;
            } else {
              spec_1.value = importedName_1.value;
            }
            node.children.append(spec_1)
            if ( self.matchValue(value : ",") ) {
              self.advance()
            }
          }
          _ = self.expectValue(expectedValue : "}")
        }
      }
    }
    if ( self.matchValue(value : "from") ) {
      self.advance()
      let sourceStr : Token = self.expect(expectedType : "String")
      let source : TSNode = TSNode()
      source.nodeType = "StringLiteral";
      source.value = sourceStr.value;
      node.left = source;
    }
    if ( self.matchValue(value : ";") ) {
      self.advance()
    }
    return node;
  }
  func parseExport() -> TSNode {
    let node : TSNode = TSNode()
    node.nodeType = "ExportNamedDeclaration";
    let startTok : Token = self.peek()
    node.start = startTok.start;
    node.line = startTok.line;
    node.col = startTok.col;
    _ = self.expectValue(expectedValue : "export")
    if ( self.matchValue(value : "type") ) {
      let nextV : String = self.peekNextValue()
      if ( nextV == "{" ) {
        self.advance()
        node.kind = "type";
      }
    }
    let v : String = self.peekValue()
    if ( v == "default" ) {
      node.nodeType = "ExportDefaultDeclaration";
      self.advance()
      let nextVal : String = self.peekValue()
      if ( ((nextVal == "class") || (nextVal == "function")) || (nextVal == "interface") ) {
        let decl : TSNode = self.parseStatement()
        node.left = decl;
      } else {
        let expr : TSNode = self.parseExpr()
        node.left = expr;
      }
      if ( self.matchValue(value : ";") ) {
        self.advance()
      }
      return node;
    }
    if ( v == "{" ) {
      self.advance()
      var specifiers : [TSNode] = [TSNode]()
      while ((self.matchValue(value : "}") == false) && (self.isAtEnd() == false)) {
        let spec : TSNode = TSNode()
        spec.nodeType = "ExportSpecifier";
        let localName : Token = self.expect(expectedType : "Identifier")
        spec.name = localName.value;
        if ( self.matchValue(value : "as") ) {
          self.advance()
          let exportedName : Token = self.expect(expectedType : "Identifier")
          spec.value = exportedName.value;
        } else {
          spec.value = localName.value;
        }
        specifiers.append(spec)
        if ( self.matchValue(value : ",") ) {
          self.advance()
        }
      }
      _ = self.expectValue(expectedValue : "}")
      node.children = specifiers;
      if ( self.matchValue(value : "from") ) {
        self.advance()
        let sourceStr : Token = self.expect(expectedType : "String")
        let source : TSNode = TSNode()
        source.nodeType = "StringLiteral";
        source.value = sourceStr.value;
        node.left = source;
      }
      if ( self.matchValue(value : ";") ) {
        self.advance()
      }
      return node;
    }
    if ( v == "*" ) {
      node.nodeType = "ExportAllDeclaration";
      self.advance()
      if ( self.matchValue(value : "as") ) {
        self.advance()
        let exportName : Token = self.expect(expectedType : "Identifier")
        node.name = exportName.value;
      }
      _ = self.expectValue(expectedValue : "from")
      let sourceStr_1 : Token = self.expect(expectedType : "String")
      let source_1 : TSNode = TSNode()
      source_1.nodeType = "StringLiteral";
      source_1.value = sourceStr_1.value;
      node.left = source_1;
      if ( self.matchValue(value : ";") ) {
        self.advance()
      }
      return node;
    }
    if ( (((((((v == "function") || (v == "class")) || (v == "interface")) || (v == "type")) || (v == "const")) || (v == "let")) || (v == "enum")) || (v == "abstract") ) {
      let decl_1 : TSNode = self.parseStatement()
      node.left = decl_1;
      return node;
    }
    if ( v == "async" ) {
      let decl_2 : TSNode = self.parseStatement()
      node.left = decl_2;
      return node;
    }
    return node;
  }
  func parseInterface() -> TSNode {
    let node : TSNode = TSNode()
    node.nodeType = "TSInterfaceDeclaration";
    let startTok : Token = self.peek()
    node.start = startTok.start;
    node.line = startTok.line;
    node.col = startTok.col;
    _ = self.expectValue(expectedValue : "interface")
    let nameTok : Token = self.expect(expectedType : "Identifier")
    node.name = nameTok.value;
    if ( self.matchValue(value : "<") ) {
      let typeParams : [TSNode] = self.parseTypeParams()
      node.params = typeParams;
    }
    if ( self.matchValue(value : "extends") ) {
      self.advance()
      var extendsList : [TSNode] = [TSNode]()
      let extendsType : TSNode = self.parseType()
      extendsList.append(extendsType)
      while (self.matchValue(value : ",")) {
        self.advance()
        let nextType : TSNode = self.parseType()
        extendsList.append(nextType)
      }
      for (i, ext) in extendsList.enumerated() {
        let wrapper : TSNode = TSNode()
        wrapper.nodeType = "TSExpressionWithTypeArguments";
        wrapper.left = ext;
        node.children.append(wrapper)
      }
    }
    let body : TSNode = self.parseInterfaceBody()
    node.body = body;
    return node;
  }
  func parseInterfaceBody() -> TSNode {
    let body : TSNode = TSNode()
    body.nodeType = "TSInterfaceBody";
    let startTok : Token = self.peek()
    body.start = startTok.start;
    body.line = startTok.line;
    body.col = startTok.col;
    _ = self.expectValue(expectedValue : "{")
    while ((self.matchValue(value : "}") == false) && (self.isAtEnd() == false)) {
      let prop : TSNode = self.parsePropertySig()
      body.children.append(prop)
      if ( self.matchValue(value : ";") || self.matchValue(value : ",") ) {
        self.advance()
      }
    }
    _ = self.expectValue(expectedValue : "}")
    return body;
  }
  func parseTypeParams() -> [TSNode] {
    var params : [TSNode] = [TSNode]()
    _ = self.expectValue(expectedValue : "<")
    while ((self.matchValue(value : ">") == false) && (self.isAtEnd() == false)) {
      if ( (params.count) > 0 ) {
        _ = self.expectValue(expectedValue : ",")
      }
      let param : TSNode = TSNode()
      param.nodeType = "TSTypeParameter";
      let nameTok : Token = self.expect(expectedType : "Identifier")
      param.name = nameTok.value;
      param.start = nameTok.start;
      param.line = nameTok.line;
      param.col = nameTok.col;
      if ( self.matchValue(value : "extends") ) {
        self.advance()
        let constraint : TSNode = self.parseType()
        param.typeAnnotation = constraint;
      }
      if ( self.matchValue(value : "=") ) {
        self.advance()
        let defaultType : TSNode = self.parseType()
        param._init = defaultType;
      }
      params.append(param)
    }
    _ = self.expectValue(expectedValue : ">")
    return params;
  }
  func parsePropertySig() -> TSNode {
    let prop : TSNode = TSNode()
    prop.nodeType = "TSPropertySignature";
    let startTok : Token = self.peek()
    prop.start = startTok.start;
    prop.line = startTok.line;
    prop.col = startTok.col;
    if ( self.matchValue(value : "readonly") ) {
      prop.readonly = true;
      self.advance()
    }
    let nameTok : Token = self.expect(expectedType : "Identifier")
    prop.name = nameTok.value;
    if ( self.matchValue(value : "?") ) {
      prop.optional = true;
      self.advance()
    }
    if ( self.matchValue(value : ":") ) {
      let typeAnnot : TSNode = self.parseTypeAnnotation()
      prop.typeAnnotation = typeAnnot;
    }
    return prop;
  }
  func parseTypeAlias() -> TSNode {
    let node : TSNode = TSNode()
    node.nodeType = "TSTypeAliasDeclaration";
    let startTok : Token = self.peek()
    node.start = startTok.start;
    node.line = startTok.line;
    node.col = startTok.col;
    _ = self.expectValue(expectedValue : "type")
    let nameTok : Token = self.expect(expectedType : "Identifier")
    node.name = nameTok.value;
    if ( self.matchValue(value : "<") ) {
      let typeParams : [TSNode] = self.parseTypeParams()
      node.params = typeParams;
    }
    _ = self.expectValue(expectedValue : "=")
    let typeExpr : TSNode = self.parseType()
    node.typeAnnotation = typeExpr;
    if ( self.matchValue(value : ";") ) {
      self.advance()
    }
    return node;
  }
  func parseDecorator() -> TSNode {
    let node : TSNode = TSNode()
    node.nodeType = "Decorator";
    let startTok : Token = self.peek()
    node.start = startTok.start;
    node.line = startTok.line;
    node.col = startTok.col;
    _ = self.expectValue(expectedValue : "@")
    let expr : TSNode = self.parsePostfix()
    node.left = expr;
    return node;
  }
  func parseClass() -> TSNode {
    let node : TSNode = TSNode()
    node.nodeType = "ClassDeclaration";
    let startTok : Token = self.peek()
    node.start = startTok.start;
    node.line = startTok.line;
    node.col = startTok.col;
    if ( self.matchValue(value : "abstract") ) {
      node.kind = "abstract";
      self.advance()
    }
    _ = self.expectValue(expectedValue : "class")
    let nameTok : Token = self.expect(expectedType : "Identifier")
    node.name = nameTok.value;
    if ( self.matchValue(value : "<") ) {
      let typeParams : [TSNode] = self.parseTypeParams()
      node.params = typeParams;
    }
    if ( self.matchValue(value : "extends") ) {
      self.advance()
      let superClass : TSNode = self.parseType()
      let extendsNode : TSNode = TSNode()
      extendsNode.nodeType = "TSExpressionWithTypeArguments";
      extendsNode.left = superClass;
      node.left = extendsNode;
    }
    if ( self.matchValue(value : "implements") ) {
      self.advance()
      let impl : TSNode = self.parseType()
      let implNode : TSNode = TSNode()
      implNode.nodeType = "TSExpressionWithTypeArguments";
      implNode.left = impl;
      node.children.append(implNode)
      while (self.matchValue(value : ",")) {
        self.advance()
        let nextImpl : TSNode = self.parseType()
        let nextImplNode : TSNode = TSNode()
        nextImplNode.nodeType = "TSExpressionWithTypeArguments";
        nextImplNode.left = nextImpl;
        node.children.append(nextImplNode)
      }
    }
    let body : TSNode = self.parseClassBody()
    node.body = body;
    return node;
  }
  func parseClassBody() -> TSNode {
    let body : TSNode = TSNode()
    body.nodeType = "ClassBody";
    let startTok : Token = self.peek()
    body.start = startTok.start;
    body.line = startTok.line;
    body.col = startTok.col;
    _ = self.expectValue(expectedValue : "{")
    while ((self.matchValue(value : "}") == false) && (self.isAtEnd() == false)) {
      let member : TSNode = self.parseClassMember()
      body.children.append(member)
      if ( self.matchValue(value : ";") ) {
        self.advance()
      }
    }
    _ = self.expectValue(expectedValue : "}")
    return body;
  }
  func parseClassMember() -> TSNode {
    let member : TSNode = TSNode()
    let startTok : Token = self.peek()
    member.start = startTok.start;
    member.line = startTok.line;
    member.col = startTok.col;
    var decorators : [TSNode] = [TSNode]()
    while (self.matchValue(value : "@")) {
      let dec : TSNode = self.parseDecorator()
      decorators.append(dec)
    }
    if ( (decorators.count) > 0 ) {
      member.decorators = decorators;
    }
    var isStatic : Bool = false
    var isAbstract : Bool = false
    var isReadonly : Bool = false
    var accessibility : String = ""
    var keepParsing : Bool = true
    while (keepParsing) {
      let tokVal : String = self.peekValue()
      if ( tokVal == "public" ) {
        accessibility = "public";
        self.advance()
      }
      if ( tokVal == "private" ) {
        accessibility = "private";
        self.advance()
      }
      if ( tokVal == "protected" ) {
        accessibility = "protected";
        self.advance()
      }
      if ( tokVal == "static" ) {
        isStatic = true;
        self.advance()
      }
      if ( tokVal == "abstract" ) {
        isAbstract = true;
        self.advance()
      }
      if ( tokVal == "readonly" ) {
        isReadonly = true;
        self.advance()
      }
      let newTokVal : String = self.peekValue()
      if ( (((((newTokVal != "public") && (newTokVal != "private")) && (newTokVal != "protected")) && (newTokVal != "static")) && (newTokVal != "abstract")) && (newTokVal != "readonly") ) {
        keepParsing = false;
      }
    }
    if ( self.matchValue(value : "constructor") ) {
      member.nodeType = "MethodDefinition";
      member.kind = "constructor";
      self.advance()
      _ = self.expectValue(expectedValue : "(")
      while ((self.matchValue(value : ")") == false) && (self.isAtEnd() == false)) {
        if ( (member.params.count) > 0 ) {
          _ = self.expectValue(expectedValue : ",")
        }
        let param : TSNode = self.parseConstructorParam()
        member.params.append(param)
      }
      _ = self.expectValue(expectedValue : ")")
      if ( self.matchValue(value : "{") ) {
        let bodyNode : TSNode = self.parseBlock()
        member.body = bodyNode;
      }
      return member;
    }
    let nameTok : Token = self.expect(expectedType : "Identifier")
    member.name = nameTok.value;
    if ( accessibility != "" ) {
      member.kind = accessibility;
    }
    member.readonly = isReadonly;
    if ( self.matchValue(value : "?") ) {
      member.optional = true;
      self.advance()
    }
    if ( self.matchValue(value : "(") ) {
      member.nodeType = "MethodDefinition";
      if ( isStatic ) {
        member.kind = "static";
      }
      if ( isAbstract ) {
        member.kind = "abstract";
      }
      _ = self.expectValue(expectedValue : "(")
      while ((self.matchValue(value : ")") == false) && (self.isAtEnd() == false)) {
        if ( (member.params.count) > 0 ) {
          _ = self.expectValue(expectedValue : ",")
        }
        let param_1 : TSNode = self.parseParam()
        member.params.append(param_1)
      }
      _ = self.expectValue(expectedValue : ")")
      if ( self.matchValue(value : ":") ) {
        let returnType : TSNode = self.parseTypeAnnotation()
        member.typeAnnotation = returnType;
      }
      if ( self.matchValue(value : "{") ) {
        let bodyNode_1 : TSNode = self.parseBlock()
        member.body = bodyNode_1;
      }
    } else {
      member.nodeType = "PropertyDefinition";
      if ( isStatic ) {
        member.kind = "static";
      }
      if ( self.matchValue(value : ":") ) {
        let typeAnnot : TSNode = self.parseTypeAnnotation()
        member.typeAnnotation = typeAnnot;
      }
      if ( self.matchValue(value : "=") ) {
        self.advance()
        let initExpr : TSNode = self.parseExpr()
        member._init = initExpr;
      }
    }
    return member;
  }
  func parseConstructorParam() -> TSNode {
    let param : TSNode = TSNode()
    param.nodeType = "Parameter";
    let startTok : Token = self.peek()
    param.start = startTok.start;
    param.line = startTok.line;
    param.col = startTok.col;
    let tokVal : String = self.peekValue()
    if ( (((tokVal == "public") || (tokVal == "private")) || (tokVal == "protected")) || (tokVal == "readonly") ) {
      param.kind = tokVal;
      self.advance()
      let nextVal : String = self.peekValue()
      if ( nextVal == "readonly" ) {
        param.readonly = true;
        self.advance()
      }
    }
    let nameTok : Token = self.expect(expectedType : "Identifier")
    param.name = nameTok.value;
    if ( self.matchValue(value : "?") ) {
      param.optional = true;
      self.advance()
    }
    if ( self.matchValue(value : ":") ) {
      let typeAnnot : TSNode = self.parseTypeAnnotation()
      param.typeAnnotation = typeAnnot;
    }
    if ( self.matchValue(value : "=") ) {
      self.advance()
      let defaultVal : TSNode = self.parseExpr()
      param._init = defaultVal;
    }
    return param;
  }
  func parseEnum() -> TSNode {
    let node : TSNode = TSNode()
    node.nodeType = "TSEnumDeclaration";
    let startTok : Token = self.peek()
    node.start = startTok.start;
    node.line = startTok.line;
    node.col = startTok.col;
    if ( self.matchValue(value : "const") ) {
      node.kind = "const";
      self.advance()
    }
    _ = self.expectValue(expectedValue : "enum")
    let nameTok : Token = self.expect(expectedType : "Identifier")
    node.name = nameTok.value;
    _ = self.expectValue(expectedValue : "{")
    while ((self.matchValue(value : "}") == false) && (self.isAtEnd() == false)) {
      let member : TSNode = TSNode()
      member.nodeType = "TSEnumMember";
      let memberTok : Token = self.expect(expectedType : "Identifier")
      member.name = memberTok.value;
      member.start = memberTok.start;
      member.line = memberTok.line;
      member.col = memberTok.col;
      if ( self.matchValue(value : "=") ) {
        self.advance()
        let initVal : TSNode = self.parseExpr()
        member._init = initVal;
      }
      node.children.append(member)
      if ( self.matchValue(value : ",") ) {
        self.advance()
      }
    }
    _ = self.expectValue(expectedValue : "}")
    return node;
  }
  func parseNamespace() -> TSNode {
    let node : TSNode = TSNode()
    node.nodeType = "TSModuleDeclaration";
    let startTok : Token = self.peek()
    node.start = startTok.start;
    node.line = startTok.line;
    node.col = startTok.col;
    _ = self.expectValue(expectedValue : "namespace")
    let nameTok : Token = self.expect(expectedType : "Identifier")
    node.name = nameTok.value;
    _ = self.expectValue(expectedValue : "{")
    let body : TSNode = TSNode()
    body.nodeType = "TSModuleBlock";
    while ((self.matchValue(value : "}") == false) && (self.isAtEnd() == false)) {
      let stmt : TSNode = self.parseStatement()
      body.children.append(stmt)
    }
    _ = self.expectValue(expectedValue : "}")
    node.body = body;
    return node;
  }
  func parseDeclare() -> TSNode {
    let startTok : Token = self.peek()
    _ = self.expectValue(expectedValue : "declare")
    let nextVal : String = self.peekValue()
    if ( nextVal == "module" ) {
      let node : TSNode = TSNode()
      node.nodeType = "TSModuleDeclaration";
      node.start = startTok.start;
      node.line = startTok.line;
      node.col = startTok.col;
      node.kind = "declare";
      self.advance()
      let nameTok : Token = self.peek()
      if ( self.matchType(tokenType : "String") ) {
        self.advance()
        node.name = nameTok.value;
      } else {
        self.advance()
        node.name = nameTok.value;
      }
      _ = self.expectValue(expectedValue : "{")
      let body : TSNode = TSNode()
      body.nodeType = "TSModuleBlock";
      while ((self.matchValue(value : "}") == false) && (self.isAtEnd() == false)) {
        let stmt : TSNode = self.parseStatement()
        body.children.append(stmt)
      }
      _ = self.expectValue(expectedValue : "}")
      node.body = body;
      return node;
    }
    let node_1 : TSNode = self.parseStatement()
    node_1.kind = "declare";
    return node_1;
  }
  func parseIfStatement() -> TSNode {
    let node : TSNode = TSNode()
    node.nodeType = "IfStatement";
    let startTok : Token = self.peek()
    node.start = startTok.start;
    node.line = startTok.line;
    node.col = startTok.col;
    _ = self.expectValue(expectedValue : "if")
    _ = self.expectValue(expectedValue : "(")
    let test : TSNode = self.parseExpr()
    node.left = test;
    _ = self.expectValue(expectedValue : ")")
    let consequent : TSNode = self.parseStatement()
    node.body = consequent;
    if ( self.matchValue(value : "else") ) {
      self.advance()
      let alternate : TSNode = self.parseStatement()
      node.right = alternate;
    }
    return node;
  }
  func parseWhileStatement() -> TSNode {
    let node : TSNode = TSNode()
    node.nodeType = "WhileStatement";
    let startTok : Token = self.peek()
    node.start = startTok.start;
    node.line = startTok.line;
    node.col = startTok.col;
    _ = self.expectValue(expectedValue : "while")
    _ = self.expectValue(expectedValue : "(")
    let test : TSNode = self.parseExpr()
    node.left = test;
    _ = self.expectValue(expectedValue : ")")
    let body : TSNode = self.parseStatement()
    node.body = body;
    return node;
  }
  func parseDoWhileStatement() -> TSNode {
    let node : TSNode = TSNode()
    node.nodeType = "DoWhileStatement";
    let startTok : Token = self.peek()
    node.start = startTok.start;
    node.line = startTok.line;
    node.col = startTok.col;
    _ = self.expectValue(expectedValue : "do")
    let body : TSNode = self.parseStatement()
    node.body = body;
    _ = self.expectValue(expectedValue : "while")
    _ = self.expectValue(expectedValue : "(")
    let test : TSNode = self.parseExpr()
    node.left = test;
    _ = self.expectValue(expectedValue : ")")
    if ( self.matchValue(value : ";") ) {
      self.advance()
    }
    return node;
  }
  func parseThrow() -> TSNode {
    let node : TSNode = TSNode()
    node.nodeType = "ThrowStatement";
    let startTok : Token = self.peek()
    node.start = startTok.start;
    node.line = startTok.line;
    node.col = startTok.col;
    _ = self.expectValue(expectedValue : "throw")
    let arg : TSNode = self.parseExpr()
    node.left = arg;
    if ( self.matchValue(value : ";") ) {
      self.advance()
    }
    return node;
  }
  func parseForStatement() -> TSNode {
    let node : TSNode = TSNode()
    let startTok : Token = self.peek()
    node.start = startTok.start;
    node.line = startTok.line;
    node.col = startTok.col;
    _ = self.expectValue(expectedValue : "for")
    _ = self.expectValue(expectedValue : "(")
    let tokVal : String = self.peekValue()
    if ( ((tokVal == "let") || (tokVal == "const")) || (tokVal == "var") ) {
      let kind : String = tokVal
      self.advance()
      let varName : Token = self.expect(expectedType : "Identifier")
      let nextVal : String = self.peekValue()
      if ( nextVal == "of" ) {
        node.nodeType = "ForOfStatement";
        self.advance()
        let left : TSNode = TSNode()
        left.nodeType = "VariableDeclaration";
        left.kind = kind;
        let declarator : TSNode = TSNode()
        declarator.nodeType = "VariableDeclarator";
        declarator.name = varName.value;
        left.children.append(declarator)
        node.left = left;
        let right : TSNode = self.parseExpr()
        node.right = right;
        _ = self.expectValue(expectedValue : ")")
        let body : TSNode = self.parseStatement()
        node.body = body;
        return node;
      }
      if ( nextVal == "in" ) {
        node.nodeType = "ForInStatement";
        self.advance()
        let left_1 : TSNode = TSNode()
        left_1.nodeType = "VariableDeclaration";
        left_1.kind = kind;
        let declarator_1 : TSNode = TSNode()
        declarator_1.nodeType = "VariableDeclarator";
        declarator_1.name = varName.value;
        left_1.children.append(declarator_1)
        node.left = left_1;
        let right_1 : TSNode = self.parseExpr()
        node.right = right_1;
        _ = self.expectValue(expectedValue : ")")
        let body_1 : TSNode = self.parseStatement()
        node.body = body_1;
        return node;
      }
      node.nodeType = "ForStatement";
      let initDecl : TSNode = TSNode()
      initDecl.nodeType = "VariableDeclaration";
      initDecl.kind = kind;
      let declarator_2 : TSNode = TSNode()
      declarator_2.nodeType = "VariableDeclarator";
      declarator_2.name = varName.value;
      if ( self.matchValue(value : ":") ) {
        let typeAnnot : TSNode = self.parseTypeAnnotation()
        declarator_2.typeAnnotation = typeAnnot;
      }
      if ( self.matchValue(value : "=") ) {
        self.advance()
        let initVal : TSNode = self.parseExpr()
        declarator_2._init = initVal;
      }
      initDecl.children.append(declarator_2)
      node._init = initDecl;
    } else {
      node.nodeType = "ForStatement";
      if ( self.matchValue(value : ";") == false ) {
        let initExpr : TSNode = self.parseExpr()
        node._init = initExpr;
      }
    }
    _ = self.expectValue(expectedValue : ";")
    if ( self.matchValue(value : ";") == false ) {
      let test : TSNode = self.parseExpr()
      node.left = test;
    }
    _ = self.expectValue(expectedValue : ";")
    if ( self.matchValue(value : ")") == false ) {
      let update : TSNode = self.parseExpr()
      node.right = update;
    }
    _ = self.expectValue(expectedValue : ")")
    let body_2 : TSNode = self.parseStatement()
    node.body = body_2;
    return node;
  }
  func parseSwitchStatement() -> TSNode {
    let node : TSNode = TSNode()
    node.nodeType = "SwitchStatement";
    let startTok : Token = self.peek()
    node.start = startTok.start;
    node.line = startTok.line;
    node.col = startTok.col;
    _ = self.expectValue(expectedValue : "switch")
    _ = self.expectValue(expectedValue : "(")
    let discriminant : TSNode = self.parseExpr()
    node.left = discriminant;
    _ = self.expectValue(expectedValue : ")")
    _ = self.expectValue(expectedValue : "{")
    while ((self.matchValue(value : "}") == false) && (self.isAtEnd() == false)) {
      let caseNode : TSNode = TSNode()
      if ( self.matchValue(value : "case") ) {
        caseNode.nodeType = "SwitchCase";
        self.advance()
        let test : TSNode = self.parseExpr()
        caseNode.left = test;
        _ = self.expectValue(expectedValue : ":")
      }
      if ( self.matchValue(value : "default") ) {
        caseNode.nodeType = "SwitchCase";
        caseNode.kind = "default";
        self.advance()
        _ = self.expectValue(expectedValue : ":")
      }
      while ((((self.matchValue(value : "case") == false) && (self.matchValue(value : "default") == false)) && (self.matchValue(value : "}") == false)) && (self.isAtEnd() == false)) {
        if ( self.matchValue(value : "break") ) {
          let breakNode : TSNode = TSNode()
          breakNode.nodeType = "BreakStatement";
          self.advance()
          if ( self.matchValue(value : ";") ) {
            self.advance()
          }
          caseNode.children.append(breakNode)
        } else {
          let stmt : TSNode = self.parseStatement()
          caseNode.children.append(stmt)
        }
      }
      node.children.append(caseNode)
    }
    _ = self.expectValue(expectedValue : "}")
    return node;
  }
  func parseTryStatement() -> TSNode {
    let node : TSNode = TSNode()
    node.nodeType = "TryStatement";
    let startTok : Token = self.peek()
    node.start = startTok.start;
    node.line = startTok.line;
    node.col = startTok.col;
    _ = self.expectValue(expectedValue : "try")
    let tryBlock : TSNode = self.parseBlock()
    node.body = tryBlock;
    if ( self.matchValue(value : "catch") ) {
      let catchNode : TSNode = TSNode()
      catchNode.nodeType = "CatchClause";
      self.advance()
      if ( self.matchValue(value : "(") ) {
        self.advance()
        let param : Token = self.expect(expectedType : "Identifier")
        catchNode.name = param.value;
        if ( self.matchValue(value : ":") ) {
          let typeAnnot : TSNode = self.parseTypeAnnotation()
          catchNode.typeAnnotation = typeAnnot;
        }
        _ = self.expectValue(expectedValue : ")")
      }
      let catchBlock : TSNode = self.parseBlock()
      catchNode.body = catchBlock;
      node.left = catchNode;
    }
    if ( self.matchValue(value : "finally") ) {
      self.advance()
      let finallyBlock : TSNode = self.parseBlock()
      node.right = finallyBlock;
    }
    return node;
  }
  func parseVarDecl() -> TSNode {
    let node : TSNode = TSNode()
    node.nodeType = "VariableDeclaration";
    let startTok : Token = self.peek()
    node.start = startTok.start;
    node.line = startTok.line;
    node.col = startTok.col;
    node.kind = startTok.value;
    self.advance()
    let declarator : TSNode = TSNode()
    declarator.nodeType = "VariableDeclarator";
    let nameTok : Token = self.expect(expectedType : "Identifier")
    declarator.name = nameTok.value;
    declarator.start = nameTok.start;
    declarator.line = nameTok.line;
    declarator.col = nameTok.col;
    if ( self.matchValue(value : ":") ) {
      let typeAnnot : TSNode = self.parseTypeAnnotation()
      declarator.typeAnnotation = typeAnnot;
    }
    if ( self.matchValue(value : "=") ) {
      self.advance()
      let initExpr : TSNode = self.parseExpr()
      declarator._init = initExpr;
    }
    node.children.append(declarator)
    if ( self.matchValue(value : ";") ) {
      self.advance()
    }
    return node;
  }
  func parseFuncDecl() -> TSNode {
    let node : TSNode = TSNode()
    node.nodeType = "FunctionDeclaration";
    let startTok : Token = self.peek()
    node.start = startTok.start;
    node.line = startTok.line;
    node.col = startTok.col;
    _ = self.expectValue(expectedValue : "function")
    let nameTok : Token = self.expect(expectedType : "Identifier")
    node.name = nameTok.value;
    if ( self.matchValue(value : "<") ) {
      let typeParams : [TSNode] = self.parseTypeParams()
      for (i, tp) in typeParams.enumerated() {
        node.children.append(tp)
      }
    }
    _ = self.expectValue(expectedValue : "(")
    while ((self.matchValue(value : ")") == false) && (self.isAtEnd() == false)) {
      if ( (node.params.count) > 0 ) {
        _ = self.expectValue(expectedValue : ",")
      }
      let param : TSNode = self.parseParam()
      node.params.append(param)
    }
    _ = self.expectValue(expectedValue : ")")
    if ( self.matchValue(value : ":") ) {
      let returnType : TSNode = self.parseTypeAnnotation()
      node.typeAnnotation = returnType;
    }
    let body : TSNode = self.parseBlock()
    node.body = body;
    return node;
  }
  func parseParam() -> TSNode {
    let param : TSNode = TSNode()
    param.nodeType = "Parameter";
    while (self.matchValue(value : "@")) {
      let dec : TSNode = self.parseDecorator()
      param.decorators.append(dec)
    }
    if ( self.matchValue(value : "...") ) {
      self.advance()
      param.nodeType = "RestElement";
      param.kind = "rest";
    }
    let nameTok : Token = self.expect(expectedType : "Identifier")
    param.name = nameTok.value;
    param.start = nameTok.start;
    param.line = nameTok.line;
    param.col = nameTok.col;
    if ( self.matchValue(value : "?") ) {
      param.optional = true;
      self.advance()
    }
    if ( self.matchValue(value : ":") ) {
      let typeAnnot : TSNode = self.parseTypeAnnotation()
      param.typeAnnotation = typeAnnot;
    }
    return param;
  }
  func parseBlock() -> TSNode {
    let block : TSNode = TSNode()
    block.nodeType = "BlockStatement";
    let startTok : Token = self.peek()
    block.start = startTok.start;
    block.line = startTok.line;
    block.col = startTok.col;
    _ = self.expectValue(expectedValue : "{")
    while ((self.matchValue(value : "}") == false) && (self.isAtEnd() == false)) {
      let stmt : TSNode = self.parseStatement()
      block.children.append(stmt)
    }
    _ = self.expectValue(expectedValue : "}")
    return block;
  }
  func parseExprStmt() -> TSNode {
    let stmt : TSNode = TSNode()
    stmt.nodeType = "ExpressionStatement";
    let startTok : Token = self.peek()
    stmt.start = startTok.start;
    stmt.line = startTok.line;
    stmt.col = startTok.col;
    let expr : TSNode = self.parseExpr()
    stmt.left = expr;
    if ( self.matchValue(value : ";") ) {
      self.advance()
    }
    return stmt;
  }
  func parseTypeAnnotation() -> TSNode {
    let annot : TSNode = TSNode()
    annot.nodeType = "TSTypeAnnotation";
    let startTok : Token = self.peek()
    annot.start = startTok.start;
    annot.line = startTok.line;
    annot.col = startTok.col;
    _ = self.expectValue(expectedValue : ":")
    let typeExpr : TSNode = self.parseType()
    annot.typeAnnotation = typeExpr;
    return annot;
  }
  func parseType() -> TSNode {
    return self.parseConditionalType();
  }
  func parseConditionalType() -> TSNode {
    let checkType : TSNode = self.parseUnionType()
    if ( self.matchValue(value : "extends") ) {
      self.advance()
      let extendsType : TSNode = self.parseUnionType()
      if ( self.matchValue(value : "?") ) {
        self.advance()
        let conditional : TSNode = TSNode()
        conditional.nodeType = "TSConditionalType";
        conditional.start = checkType.start;
        conditional.line = checkType.line;
        conditional.col = checkType.col;
        conditional.left = checkType;
        conditional.params.append(extendsType)
        conditional.body = self.parseUnionType();
        _ = self.expectValue(expectedValue : ":")
        conditional.right = self.parseUnionType();
        return conditional;
      }
      return checkType;
    }
    return checkType;
  }
  func parseUnionType() -> TSNode {
    let left : TSNode = self.parseIntersectionType()
    if ( self.matchValue(value : "|") ) {
      let union : TSNode = TSNode()
      union.nodeType = "TSUnionType";
      union.start = left.start;
      union.line = left.line;
      union.col = left.col;
      union.children.append(left)
      while (self.matchValue(value : "|")) {
        self.advance()
        let right : TSNode = self.parseIntersectionType()
        union.children.append(right)
      }
      return union;
    }
    return left;
  }
  func parseIntersectionType() -> TSNode {
    let left : TSNode = self.parseArrayType()
    if ( self.matchValue(value : "&") ) {
      let intersection : TSNode = TSNode()
      intersection.nodeType = "TSIntersectionType";
      intersection.start = left.start;
      intersection.line = left.line;
      intersection.col = left.col;
      intersection.children.append(left)
      while (self.matchValue(value : "&")) {
        self.advance()
        let right : TSNode = self.parseArrayType()
        intersection.children.append(right)
      }
      return intersection;
    }
    return left;
  }
  func parseArrayType() -> TSNode {
    var elemType : TSNode = self.parsePrimaryType()
    while (self.matchValue(value : "[")) {
      if ( self.checkNext(value : "]") ) {
        self.advance()
        self.advance()
        let arrayType : TSNode = TSNode()
        arrayType.nodeType = "TSArrayType";
        arrayType.start = elemType.start;
        arrayType.line = elemType.line;
        arrayType.col = elemType.col;
        arrayType.left = elemType;
        elemType = arrayType;
      } else {
        self.advance()
        let indexType : TSNode = self.parseType()
        _ = self.expectValue(expectedValue : "]")
        let indexedAccess : TSNode = TSNode()
        indexedAccess.nodeType = "TSIndexedAccessType";
        indexedAccess.start = elemType.start;
        indexedAccess.line = elemType.line;
        indexedAccess.col = elemType.col;
        indexedAccess.left = elemType;
        indexedAccess.right = indexType;
        elemType = indexedAccess;
      }
    }
    return elemType;
  }
  func checkNext(value : String) -> Bool {
    let nextPos : Int = self.pos + 1
    if ( nextPos < (self.tokens.count) ) {
      let nextTok : Token = self.tokens[nextPos]
      let v : String = nextTok.value
      return v == value;
    }
    return false;
  }
  func parsePrimaryType() -> TSNode {
    let tokVal : String = self.peekValue()
    let tok : Token = self.peek()
    if ( tokVal == "keyof" ) {
      self.advance()
      let operand : TSNode = self.parsePrimaryType()
      let node : TSNode = TSNode()
      node.nodeType = "TSTypeOperator";
      node.value = "keyof";
      node.start = tok.start;
      node.line = tok.line;
      node.col = tok.col;
      node.typeAnnotation = operand;
      return node;
    }
    if ( tokVal == "typeof" ) {
      self.advance()
      let operand_1 : TSNode = self.parsePrimaryType()
      let node_1 : TSNode = TSNode()
      node_1.nodeType = "TSTypeQuery";
      node_1.value = "typeof";
      node_1.start = tok.start;
      node_1.line = tok.line;
      node_1.col = tok.col;
      node_1.typeAnnotation = operand_1;
      return node_1;
    }
    if ( tokVal == "infer" ) {
      self.advance()
      let paramTok : Token = self.expect(expectedType : "Identifier")
      let node_2 : TSNode = TSNode()
      node_2.nodeType = "TSInferType";
      node_2.start = tok.start;
      node_2.line = tok.line;
      node_2.col = tok.col;
      let typeParam : TSNode = TSNode()
      typeParam.nodeType = "TSTypeParameter";
      typeParam.name = paramTok.value;
      node_2.typeAnnotation = typeParam;
      return node_2;
    }
    if ( tokVal == "string" ) {
      self.advance()
      let node_3 : TSNode = TSNode()
      node_3.nodeType = "TSStringKeyword";
      node_3.start = tok.start;
      node_3.end = tok.end;
      node_3.line = tok.line;
      node_3.col = tok.col;
      return node_3;
    }
    if ( tokVal == "number" ) {
      self.advance()
      let node_4 : TSNode = TSNode()
      node_4.nodeType = "TSNumberKeyword";
      node_4.start = tok.start;
      node_4.end = tok.end;
      node_4.line = tok.line;
      node_4.col = tok.col;
      return node_4;
    }
    if ( tokVal == "boolean" ) {
      self.advance()
      let node_5 : TSNode = TSNode()
      node_5.nodeType = "TSBooleanKeyword";
      node_5.start = tok.start;
      node_5.end = tok.end;
      node_5.line = tok.line;
      node_5.col = tok.col;
      return node_5;
    }
    if ( tokVal == "any" ) {
      self.advance()
      let node_6 : TSNode = TSNode()
      node_6.nodeType = "TSAnyKeyword";
      node_6.start = tok.start;
      node_6.end = tok.end;
      node_6.line = tok.line;
      node_6.col = tok.col;
      return node_6;
    }
    if ( tokVal == "unknown" ) {
      self.advance()
      let node_7 : TSNode = TSNode()
      node_7.nodeType = "TSUnknownKeyword";
      node_7.start = tok.start;
      node_7.end = tok.end;
      node_7.line = tok.line;
      node_7.col = tok.col;
      return node_7;
    }
    if ( tokVal == "void" ) {
      self.advance()
      let node_8 : TSNode = TSNode()
      node_8.nodeType = "TSVoidKeyword";
      node_8.start = tok.start;
      node_8.end = tok.end;
      node_8.line = tok.line;
      node_8.col = tok.col;
      return node_8;
    }
    if ( tokVal == "null" ) {
      self.advance()
      let node_9 : TSNode = TSNode()
      node_9.nodeType = "TSNullKeyword";
      node_9.start = tok.start;
      node_9.end = tok.end;
      node_9.line = tok.line;
      node_9.col = tok.col;
      return node_9;
    }
    if ( tokVal == "never" ) {
      self.advance()
      let node_10 : TSNode = TSNode()
      node_10.nodeType = "TSNeverKeyword";
      node_10.start = tok.start;
      node_10.end = tok.end;
      node_10.line = tok.line;
      node_10.col = tok.col;
      return node_10;
    }
    if ( tokVal == "undefined" ) {
      self.advance()
      let node_11 : TSNode = TSNode()
      node_11.nodeType = "TSUndefinedKeyword";
      node_11.start = tok.start;
      node_11.end = tok.end;
      node_11.line = tok.line;
      node_11.col = tok.col;
      return node_11;
    }
    let tokType : String = self.peekType()
    if ( tokType == "Identifier" ) {
      return self.parseTypeRef();
    }
    if ( tokType == "String" ) {
      self.advance()
      let node_12 : TSNode = TSNode()
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
      self.advance()
      let node_13 : TSNode = TSNode()
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
      self.advance()
      let node_14 : TSNode = TSNode()
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
      self.advance()
      let node_15 : TSNode = TSNode()
      node_15.nodeType = "TSTemplateLiteralType";
      node_15.start = tok.start;
      node_15.end = tok.end;
      node_15.line = tok.line;
      node_15.col = tok.col;
      node_15.value = tok.value;
      return node_15;
    }
    if ( tokVal == "(" ) {
      return self.parseParenOrFunctionType();
    }
    if ( tokVal == "[" ) {
      return self.parseTupleType();
    }
    if ( tokVal == "{" ) {
      return self.parseTypeLiteral();
    }
    if ( self.quiet == false ) {
      print("Unknown type: " + tokVal)
    }
    self.advance()
    let errNode : TSNode = TSNode()
    errNode.nodeType = "TSAnyKeyword";
    return errNode;
  }
  func parseTypeRef() -> TSNode {
    let ref : TSNode = TSNode()
    ref.nodeType = "TSTypeReference";
    let tok : Token = self.peek()
    ref.start = tok.start;
    ref.line = tok.line;
    ref.col = tok.col;
    let nameTok : Token = self.expect(expectedType : "Identifier")
    ref.name = nameTok.value;
    if ( self.matchValue(value : "<") ) {
      self.advance()
      while ((self.matchValue(value : ">") == false) && (self.isAtEnd() == false)) {
        if ( (ref.params.count) > 0 ) {
          _ = self.expectValue(expectedValue : ",")
        }
        let typeArg : TSNode = self.parseType()
        ref.params.append(typeArg)
      }
      _ = self.expectValue(expectedValue : ">")
    }
    return ref;
  }
  func parseTupleType() -> TSNode {
    let tuple : TSNode = TSNode()
    tuple.nodeType = "TSTupleType";
    let startTok : Token = self.peek()
    tuple.start = startTok.start;
    tuple.line = startTok.line;
    tuple.col = startTok.col;
    _ = self.expectValue(expectedValue : "[")
    while ((self.matchValue(value : "]") == false) && (self.isAtEnd() == false)) {
      if ( (tuple.children.count) > 0 ) {
        _ = self.expectValue(expectedValue : ",")
      }
      if ( self.matchValue(value : "...") ) {
        self.advance()
        let innerType : TSNode = self.parseType()
        let restType : TSNode = TSNode()
        restType.nodeType = "TSRestType";
        restType.start = innerType.start;
        restType.line = innerType.line;
        restType.col = innerType.col;
        restType.typeAnnotation = innerType;
        tuple.children.append(restType)
      } else {
        let elemType : TSNode = self.parseType()
        if ( self.matchValue(value : "?") ) {
          self.advance()
          let optType : TSNode = TSNode()
          optType.nodeType = "TSOptionalType";
          optType.start = elemType.start;
          optType.line = elemType.line;
          optType.col = elemType.col;
          optType.typeAnnotation = elemType;
          tuple.children.append(optType)
        } else {
          tuple.children.append(elemType)
        }
      }
    }
    _ = self.expectValue(expectedValue : "]")
    return tuple;
  }
  func parseParenOrFunctionType() -> TSNode {
    let startTok : Token = self.peek()
    let startPos : Int = startTok.start
    let startLine : Int = startTok.line
    let startCol : Int = startTok.col
    _ = self.expectValue(expectedValue : "(")
    if ( self.matchValue(value : ")") ) {
      self.advance()
      if ( self.matchValue(value : "=>") ) {
        self.advance()
        let returnType : TSNode = self.parseType()
        let funcType : TSNode = TSNode()
        funcType.nodeType = "TSFunctionType";
        funcType.start = startPos;
        funcType.line = startLine;
        funcType.col = startCol;
        funcType.typeAnnotation = returnType;
        return funcType;
      }
      let voidNode : TSNode = TSNode()
      voidNode.nodeType = "TSVoidKeyword";
      return voidNode;
    }
    let isIdentifier : Bool = self.matchType(tokenType : "Identifier")
    if ( isIdentifier ) {
      let savedPos : Int = self.pos
      let savedToken : Token = self.currentToken!
      self.advance()
      if ( self.matchValue(value : ":") || self.matchValue(value : "?") ) {
        self.pos = savedPos;
        self.currentToken = savedToken;
        return self.parseFunctionType(startPos : startPos, startLine : startLine, startCol : startCol);
      }
      if ( self.matchValue(value : ",") ) {
        /** unused:  let savedPos2 : Int = self.pos   **/ 
        /** unused:  let savedToken2 : Token = self.currentToken!   **/ 
        var depth : Int = 1
        while ((depth > 0) && (self.isAtEnd() == false)) {
          if ( self.matchValue(value : "(") ) {
            depth = depth + 1;
          }
          if ( self.matchValue(value : ")") ) {
            depth = depth - 1;
          }
          if ( depth > 0 ) {
            self.advance()
          }
        }
        if ( self.matchValue(value : ")") ) {
          self.advance()
          if ( self.matchValue(value : "=>") ) {
            self.pos = savedPos;
            self.currentToken = savedToken;
            return self.parseFunctionType(startPos : startPos, startLine : startLine, startCol : startCol);
          }
        }
        self.pos = savedPos;
        self.currentToken = savedToken;
      }
      self.pos = savedPos;
      self.currentToken = savedToken;
    }
    let innerType : TSNode = self.parseType()
    _ = self.expectValue(expectedValue : ")")
    if ( self.matchValue(value : "=>") ) {
      self.advance()
      let returnType_1 : TSNode = self.parseType()
      let funcType_1 : TSNode = TSNode()
      funcType_1.nodeType = "TSFunctionType";
      funcType_1.start = startPos;
      funcType_1.line = startLine;
      funcType_1.col = startCol;
      funcType_1.typeAnnotation = returnType_1;
      return funcType_1;
    }
    return innerType;
  }
  func parseFunctionType(startPos : Int, startLine : Int, startCol : Int) -> TSNode {
    let funcType : TSNode = TSNode()
    funcType.nodeType = "TSFunctionType";
    funcType.start = startPos;
    funcType.line = startLine;
    funcType.col = startCol;
    while ((self.matchValue(value : ")") == false) && (self.isAtEnd() == false)) {
      if ( (funcType.params.count) > 0 ) {
        _ = self.expectValue(expectedValue : ",")
      }
      let param : TSNode = TSNode()
      param.nodeType = "Parameter";
      let nameTok : Token = self.expect(expectedType : "Identifier")
      param.name = nameTok.value;
      param.start = nameTok.start;
      param.line = nameTok.line;
      param.col = nameTok.col;
      if ( self.matchValue(value : "?") ) {
        param.optional = true;
        self.advance()
      }
      if ( self.matchValue(value : ":") ) {
        let typeAnnot : TSNode = self.parseTypeAnnotation()
        param.typeAnnotation = typeAnnot;
      }
      funcType.params.append(param)
    }
    _ = self.expectValue(expectedValue : ")")
    if ( self.matchValue(value : "=>") ) {
      self.advance()
      let returnType : TSNode = self.parseType()
      funcType.typeAnnotation = returnType;
    }
    return funcType;
  }
  func parseTypeLiteral() -> TSNode {
    let literal : TSNode = TSNode()
    literal.nodeType = "TSTypeLiteral";
    let startTok : Token = self.peek()
    literal.start = startTok.start;
    literal.line = startTok.line;
    literal.col = startTok.col;
    _ = self.expectValue(expectedValue : "{")
    while ((self.matchValue(value : "}") == false) && (self.isAtEnd() == false)) {
      let member : TSNode = self.parseTypeLiteralMember()
      literal.children.append(member)
      if ( self.matchValue(value : ";") || self.matchValue(value : ",") ) {
        self.advance()
      }
    }
    _ = self.expectValue(expectedValue : "}")
    return literal;
  }
  func parseTypeLiteralMember() -> TSNode {
    let startTok : Token = self.peek()
    let startPos : Int = startTok.start
    let startLine : Int = startTok.line
    let startCol : Int = startTok.col
    var isReadonly : Bool = false
    if ( self.matchValue(value : "readonly") ) {
      isReadonly = true;
      self.advance()
    }
    var readonlyModifier : String = ""
    if ( self.matchValue(value : "+") || self.matchValue(value : "-") ) {
      readonlyModifier = self.peekValue();
      self.advance()
      if ( self.matchValue(value : "readonly") ) {
        isReadonly = true;
        self.advance()
      }
    }
    if ( self.matchValue(value : "[") ) {
      self.advance()
      let paramName : Token = self.expect(expectedType : "Identifier")
      if ( self.matchValue(value : "in") ) {
        return self.parseMappedType(isReadonly : isReadonly, readonlyMod : readonlyModifier, paramName : paramName.value, startPos : startPos, startLine : startLine, startCol : startCol);
      }
      return self.parseIndexSignatureRest(isReadonly : isReadonly, paramTok : paramName, startPos : startPos, startLine : startLine, startCol : startCol);
    }
    let nameTok : Token = self.expect(expectedType : "Identifier")
    let memberName : String = nameTok.value
    var isOptional : Bool = false
    if ( self.matchValue(value : "?") ) {
      isOptional = true;
      self.advance()
    }
    if ( self.matchValue(value : "(") ) {
      return self.parseMethodSignature(methodName : memberName, isOptional : isOptional, startPos : startPos, startLine : startLine, startCol : startCol);
    }
    let prop : TSNode = TSNode()
    prop.nodeType = "TSPropertySignature";
    prop.start = startPos;
    prop.line = startLine;
    prop.col = startCol;
    prop.name = memberName;
    prop.readonly = isReadonly;
    prop.optional = isOptional;
    if ( self.matchValue(value : ":") ) {
      let typeAnnot : TSNode = self.parseTypeAnnotation()
      prop.typeAnnotation = typeAnnot;
    }
    return prop;
  }
  func parseMappedType(isReadonly : Bool, readonlyMod : String, paramName : String, startPos : Int, startLine : Int, startCol : Int) -> TSNode {
    let mapped : TSNode = TSNode()
    mapped.nodeType = "TSMappedType";
    mapped.start = startPos;
    mapped.line = startLine;
    mapped.col = startCol;
    mapped.readonly = isReadonly;
    if ( readonlyMod != "" ) {
      mapped.kind = readonlyMod;
    }
    _ = self.expectValue(expectedValue : "in")
    let typeParam : TSNode = TSNode()
    typeParam.nodeType = "TSTypeParameter";
    typeParam.name = paramName;
    let constraint : TSNode = self.parseType()
    typeParam.typeAnnotation = constraint;
    mapped.params.append(typeParam)
    if ( self.matchValue(value : "as") ) {
      self.advance()
      let nameType : TSNode = self.parseType()
      mapped.right = nameType;
    }
    _ = self.expectValue(expectedValue : "]")
    var optionalMod : String = ""
    if ( self.matchValue(value : "+") || self.matchValue(value : "-") ) {
      optionalMod = self.peekValue();
      self.advance()
    }
    if ( self.matchValue(value : "?") ) {
      mapped.optional = true;
      if ( optionalMod != "" ) {
        mapped.value = optionalMod;
      }
      self.advance()
    }
    if ( self.matchValue(value : ":") ) {
      self.advance()
      let valueType : TSNode = self.parseType()
      mapped.typeAnnotation = valueType;
    }
    return mapped;
  }
  func parseIndexSignatureRest(isReadonly : Bool, paramTok : Token, startPos : Int, startLine : Int, startCol : Int) -> TSNode {
    let indexSig : TSNode = TSNode()
    indexSig.nodeType = "TSIndexSignature";
    indexSig.start = startPos;
    indexSig.line = startLine;
    indexSig.col = startCol;
    indexSig.readonly = isReadonly;
    let param : TSNode = TSNode()
    param.nodeType = "Parameter";
    param.name = paramTok.value;
    param.start = paramTok.start;
    param.line = paramTok.line;
    param.col = paramTok.col;
    if ( self.matchValue(value : ":") ) {
      let typeAnnot : TSNode = self.parseTypeAnnotation()
      param.typeAnnotation = typeAnnot;
    }
    indexSig.params.append(param)
    _ = self.expectValue(expectedValue : "]")
    if ( self.matchValue(value : ":") ) {
      let typeAnnot_1 : TSNode = self.parseTypeAnnotation()
      indexSig.typeAnnotation = typeAnnot_1;
    }
    return indexSig;
  }
  func parseMethodSignature(methodName : String, isOptional : Bool, startPos : Int, startLine : Int, startCol : Int) -> TSNode {
    let method : TSNode = TSNode()
    method.nodeType = "TSMethodSignature";
    method.start = startPos;
    method.line = startLine;
    method.col = startCol;
    method.name = methodName;
    method.optional = isOptional;
    _ = self.expectValue(expectedValue : "(")
    while ((self.matchValue(value : ")") == false) && (self.isAtEnd() == false)) {
      if ( (method.params.count) > 0 ) {
        _ = self.expectValue(expectedValue : ",")
      }
      let param : TSNode = self.parseParam()
      method.params.append(param)
    }
    _ = self.expectValue(expectedValue : ")")
    if ( self.matchValue(value : ":") ) {
      let returnType : TSNode = self.parseTypeAnnotation()
      method.typeAnnotation = returnType;
    }
    return method;
  }
  func parseExpr() -> TSNode {
    return self.parseAssign();
  }
  func parseAssign() -> TSNode {
    let left : TSNode = self.parseNullishCoalescing()
    if ( self.matchValue(value : "=") ) {
      self.advance()
      let right : TSNode = self.parseAssign()
      let assign : TSNode = TSNode()
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
  }
  func parseNullishCoalescing() -> TSNode {
    var left : TSNode = self.parseBinary()
    while (self.matchValue(value : "??")) {
      self.advance()
      let right : TSNode = self.parseBinary()
      let nullish : TSNode = TSNode()
      nullish.nodeType = "LogicalExpression";
      nullish.value = "??";
      nullish.left = left;
      nullish.right = right;
      nullish.start = left.start;
      nullish.line = left.line;
      nullish.col = left.col;
      left = nullish;
    }
    return left;
  }
  func parseBinary() -> TSNode {
    var left : TSNode = self.parseUnary()
    var tokVal : String = self.peekValue()
    while ((((((((tokVal == "+") || (tokVal == "-")) || (tokVal == "*")) || (tokVal == "/")) || (tokVal == "===")) || (tokVal == "!==")) || (tokVal == "<")) || (tokVal == ">")) {
      let opTok : Token = self.peek()
      self.advance()
      let right : TSNode = self.parseUnary()
      let binExpr : TSNode = TSNode()
      binExpr.nodeType = "BinaryExpression";
      binExpr.value = opTok.value;
      binExpr.left = left;
      binExpr.right = right;
      binExpr.start = left.start;
      binExpr.line = left.line;
      binExpr.col = left.col;
      left = binExpr;
      tokVal = self.peekValue();
    }
    return left;
  }
  func parseUnary() -> TSNode {
    let tokVal : String = self.peekValue()
    if ( (tokVal == "!") || (tokVal == "-") ) {
      let opTok : Token = self.peek()
      self.advance()
      let arg : TSNode = self.parseUnary()
      let unary : TSNode = TSNode()
      unary.nodeType = "UnaryExpression";
      unary.value = opTok.value;
      unary.left = arg;
      unary.start = opTok.start;
      unary.line = opTok.line;
      unary.col = opTok.col;
      return unary;
    }
    if ( tokVal == "await" ) {
      let awaitTok : Token = self.peek()
      self.advance()
      let arg_1 : TSNode = self.parseUnary()
      let awaitExpr : TSNode = TSNode()
      awaitExpr.nodeType = "AwaitExpression";
      awaitExpr.left = arg_1;
      awaitExpr.start = awaitTok.start;
      awaitExpr.line = awaitTok.line;
      awaitExpr.col = awaitTok.col;
      return awaitExpr;
    }
    if ( tokVal == "<" ) {
      let startTok : Token = self.peek()
      self.advance()
      let nextType : String = self.peekType()
      if ( ((nextType == "Identifier") || (nextType == "Keyword")) || (nextType == "TSType") ) {
        let typeNode : TSNode = self.parseType()
        if ( self.matchValue(value : ">") ) {
          self.advance()
          let arg_2 : TSNode = self.parseUnary()
          let assertion : TSNode = TSNode()
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
    return self.parsePostfix();
  }
  func parsePostfix() -> TSNode {
    var expr : TSNode = self.parsePrimary()
    var keepParsing : Bool = true
    while (keepParsing) {
      let tokVal : String = self.peekValue()
      if ( tokVal == "(" ) {
        self.advance()
        let call : TSNode = TSNode()
        call.nodeType = "CallExpression";
        call.left = expr;
        call.start = expr.start;
        call.line = expr.line;
        call.col = expr.col;
        while ((self.matchValue(value : ")") == false) && (self.isAtEnd() == false)) {
          if ( (call.children.count) > 0 ) {
            _ = self.expectValue(expectedValue : ",")
          }
          let arg : TSNode = self.parseExpr()
          call.children.append(arg)
        }
        _ = self.expectValue(expectedValue : ")")
        expr = call;
      }
      if ( tokVal == "." ) {
        self.advance()
        let propTok : Token = self.expect(expectedType : "Identifier")
        let member : TSNode = TSNode()
        member.nodeType = "MemberExpression";
        member.left = expr;
        member.name = propTok.value;
        member.start = expr.start;
        member.line = expr.line;
        member.col = expr.col;
        expr = member;
      }
      if ( tokVal == "?." ) {
        self.advance()
        let nextTokVal : String = self.peekValue()
        if ( nextTokVal == "(" ) {
          self.advance()
          let optCall : TSNode = TSNode()
          optCall.nodeType = "OptionalCallExpression";
          optCall.optional = true;
          optCall.left = expr;
          optCall.start = expr.start;
          optCall.line = expr.line;
          optCall.col = expr.col;
          while ((self.matchValue(value : ")") == false) && (self.isAtEnd() == false)) {
            if ( (optCall.children.count) > 0 ) {
              _ = self.expectValue(expectedValue : ",")
            }
            let arg_1 : TSNode = self.parseExpr()
            optCall.children.append(arg_1)
          }
          _ = self.expectValue(expectedValue : ")")
          expr = optCall;
        }
        if ( nextTokVal == "[" ) {
          self.advance()
          let indexExpr : TSNode = self.parseExpr()
          _ = self.expectValue(expectedValue : "]")
          let optIndex : TSNode = TSNode()
          optIndex.nodeType = "OptionalMemberExpression";
          optIndex.optional = true;
          optIndex.left = expr;
          optIndex.right = indexExpr;
          optIndex.start = expr.start;
          optIndex.line = expr.line;
          optIndex.col = expr.col;
          expr = optIndex;
        }
        if ( self.matchType(tokenType : "Identifier") ) {
          let propTok_1 : Token = self.expect(expectedType : "Identifier")
          let optMember : TSNode = TSNode()
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
        self.advance()
        let indexExpr_1 : TSNode = self.parseExpr()
        _ = self.expectValue(expectedValue : "]")
        let computed : TSNode = TSNode()
        computed.nodeType = "MemberExpression";
        computed.left = expr;
        computed.right = indexExpr_1;
        computed.start = expr.start;
        computed.line = expr.line;
        computed.col = expr.col;
        expr = computed;
      }
      if ( tokVal == "!" ) {
        let tok : Token = self.peek()
        self.advance()
        let nonNull : TSNode = TSNode()
        nonNull.nodeType = "TSNonNullExpression";
        nonNull.left = expr;
        nonNull.start = expr.start;
        nonNull.line = expr.line;
        nonNull.col = tok.col;
        expr = nonNull;
      }
      if ( tokVal == "as" ) {
        self.advance()
        let asType : TSNode = self.parseType()
        let assertion : TSNode = TSNode()
        assertion.nodeType = "TSAsExpression";
        assertion.left = expr;
        assertion.typeAnnotation = asType;
        assertion.start = expr.start;
        assertion.line = expr.line;
        assertion.col = expr.col;
        expr = assertion;
      }
      if ( tokVal == "satisfies" ) {
        self.advance()
        let satisfiesType : TSNode = self.parseType()
        let satisfiesExpr : TSNode = TSNode()
        satisfiesExpr.nodeType = "TSSatisfiesExpression";
        satisfiesExpr.left = expr;
        satisfiesExpr.typeAnnotation = satisfiesType;
        satisfiesExpr.start = expr.start;
        satisfiesExpr.line = expr.line;
        satisfiesExpr.col = expr.col;
        expr = satisfiesExpr;
      }
      let newTokVal : String = self.peekValue()
      if ( ((((((newTokVal != "(") && (newTokVal != ".")) && (newTokVal != "?.")) && (newTokVal != "[")) && (newTokVal != "!")) && (newTokVal != "as")) && (newTokVal != "satisfies") ) {
        keepParsing = false;
      }
    }
    return expr;
  }
  func parsePrimary() -> TSNode {
    let tokType : String = self.peekType()
    let tokVal : String = self.peekValue()
    let tok : Token = self.peek()
    if ( tokType == "Identifier" ) {
      self.advance()
      let id : TSNode = TSNode()
      id.nodeType = "Identifier";
      id.name = tok.value;
      id.start = tok.start;
      id.end = tok.end;
      id.line = tok.line;
      id.col = tok.col;
      return id;
    }
    if ( tokType == "Number" ) {
      self.advance()
      let num : TSNode = TSNode()
      num.nodeType = "NumericLiteral";
      num.value = tok.value;
      num.start = tok.start;
      num.end = tok.end;
      num.line = tok.line;
      num.col = tok.col;
      return num;
    }
    if ( tokType == "String" ) {
      self.advance()
      let str : TSNode = TSNode()
      str.nodeType = "StringLiteral";
      str.value = tok.value;
      str.start = tok.start;
      str.end = tok.end;
      str.line = tok.line;
      str.col = tok.col;
      return str;
    }
    if ( tokType == "Template" ) {
      return self.parseTemplateLiteral();
    }
    if ( (tokVal == "true") || (tokVal == "false") ) {
      self.advance()
      let bool : TSNode = TSNode()
      bool.nodeType = "BooleanLiteral";
      bool.value = tokVal;
      bool.start = tok.start;
      bool.end = tok.end;
      bool.line = tok.line;
      bool.col = tok.col;
      return bool;
    }
    if ( tokVal == "null" ) {
      self.advance()
      let nullLit : TSNode = TSNode()
      nullLit.nodeType = "NullLiteral";
      nullLit.start = tok.start;
      nullLit.end = tok.end;
      nullLit.line = tok.line;
      nullLit.col = tok.col;
      return nullLit;
    }
    if ( tokVal == "undefined" ) {
      self.advance()
      let undefId : TSNode = TSNode()
      undefId.nodeType = "Identifier";
      undefId.name = "undefined";
      undefId.start = tok.start;
      undefId.end = tok.end;
      undefId.line = tok.line;
      undefId.col = tok.col;
      return undefId;
    }
    if ( tokVal == "[" ) {
      return self.parseArrayLiteral();
    }
    if ( tokVal == "{" ) {
      return self.parseObjectLiteral();
    }
    if ( (self.tsxMode == true) && (tokVal == "<") ) {
      let nextType : String = self.peekNextType()
      let nextVal : String = self.peekNextValue()
      if ( nextVal == ">" ) {
        return self.parseJSXFragment();
      }
      if ( (nextType == "Identifier") || (nextType == "Keyword") ) {
        return self.parseJSXElement();
      }
    }
    if ( tokVal == "(" ) {
      return self.parseParenOrArrow();
    }
    if ( tokVal == "async" ) {
      let nextVal_1 : String = self.peekNextValue()
      let nextType_1 : String = self.peekNextType()
      if ( (nextVal_1 == "(") || (nextType_1 == "Identifier") ) {
        return self.parseArrowFunction();
      }
    }
    if ( tokVal == "new" ) {
      return self.parseNewExpression();
    }
    if ( tokVal == "this" ) {
      self.advance()
      let thisExpr : TSNode = TSNode()
      thisExpr.nodeType = "ThisExpression";
      thisExpr.start = tok.start;
      thisExpr.end = tok.end;
      thisExpr.line = tok.line;
      thisExpr.col = tok.col;
      return thisExpr;
    }
    if ( self.quiet == false ) {
      print("Unexpected token: " + tokVal)
    }
    self.advance()
    let errId : TSNode = TSNode()
    errId.nodeType = "Identifier";
    errId.name = "error";
    return errId;
  }
  func parseTemplateLiteral() -> TSNode {
    let node : TSNode = TSNode()
    node.nodeType = "TemplateLiteral";
    let tok : Token = self.peek()
    node.start = tok.start;
    node.line = tok.line;
    node.col = tok.col;
    self.advance()
    let quasi : TSNode = TSNode()
    quasi.nodeType = "TemplateElement";
    quasi.value = tok.value;
    node.children.append(quasi)
    return node;
  }
  func parseArrayLiteral() -> TSNode {
    let node : TSNode = TSNode()
    node.nodeType = "ArrayExpression";
    let tok : Token = self.peek()
    node.start = tok.start;
    node.line = tok.line;
    node.col = tok.col;
    _ = self.expectValue(expectedValue : "[")
    while ((self.matchValue(value : "]") == false) && (self.isAtEnd() == false)) {
      if ( self.matchValue(value : "...") ) {
        self.advance()
        let spreadArg : TSNode = self.parseExpr()
        let spread : TSNode = TSNode()
        spread.nodeType = "SpreadElement";
        spread.left = spreadArg;
        node.children.append(spread)
      } else {
        if ( self.matchValue(value : ",") ) {
        } else {
          let elem : TSNode = self.parseExpr()
          node.children.append(elem)
        }
      }
      if ( self.matchValue(value : ",") ) {
        self.advance()
      }
    }
    _ = self.expectValue(expectedValue : "]")
    return node;
  }
  func parseObjectLiteral() -> TSNode {
    let node : TSNode = TSNode()
    node.nodeType = "ObjectExpression";
    let tok : Token = self.peek()
    node.start = tok.start;
    node.line = tok.line;
    node.col = tok.col;
    _ = self.expectValue(expectedValue : "{")
    while ((self.matchValue(value : "}") == false) && (self.isAtEnd() == false)) {
      if ( self.matchValue(value : "...") ) {
        self.advance()
        let spreadArg : TSNode = self.parseExpr()
        let spread : TSNode = TSNode()
        spread.nodeType = "SpreadElement";
        spread.left = spreadArg;
        node.children.append(spread)
      } else {
        let prop : TSNode = TSNode()
        prop.nodeType = "Property";
        let keyTok : Token = self.peek()
        if ( self.matchType(tokenType : "Identifier") ) {
          prop.name = keyTok.value;
          self.advance()
        }
        if ( self.matchType(tokenType : "String") ) {
          prop.name = keyTok.value;
          self.advance()
        }
        if ( self.matchType(tokenType : "Number") ) {
          prop.name = keyTok.value;
          self.advance()
        }
        if ( self.matchValue(value : ":") ) {
          self.advance()
          let valueExpr : TSNode = self.parseExpr()
          prop.left = valueExpr;
        } else {
          let shorthandVal : TSNode = TSNode()
          shorthandVal.nodeType = "Identifier";
          shorthandVal.name = prop.name;
          prop.left = shorthandVal;
          prop.kind = "shorthand";
        }
        node.children.append(prop)
      }
      if ( self.matchValue(value : ",") ) {
        self.advance()
      }
    }
    _ = self.expectValue(expectedValue : "}")
    return node;
  }
  func parseParenOrArrow() -> TSNode {
    /** unused:  let startTok : Token = self.peek()   **/ 
    let savedPos : Int = self.pos
    let savedTok : Token = self.currentToken!
    self.advance()
    var parenDepth : Int = 1
    while ((parenDepth > 0) && (self.isAtEnd() == false)) {
      let v : String = self.peekValue()
      if ( v == "(" ) {
        parenDepth = parenDepth + 1;
      }
      if ( v == ")" ) {
        parenDepth = parenDepth - 1;
      }
      if ( parenDepth > 0 ) {
        self.advance()
      }
    }
    if ( self.matchValue(value : ")") == false ) {
      self.pos = savedPos;
      self.currentToken = savedTok;
      self.advance()
      let expr : TSNode = self.parseExpr()
      _ = self.expectValue(expectedValue : ")")
      return expr;
    }
    self.advance()
    if ( self.matchValue(value : ":") ) {
      self.advance()
      _ = self.parseType()
    }
    if ( self.matchValue(value : "=>") ) {
      self.pos = savedPos;
      self.currentToken = savedTok;
      return self.parseArrowFunction();
    }
    self.pos = savedPos;
    self.currentToken = savedTok;
    self.advance()
    let expr_1 : TSNode = self.parseExpr()
    _ = self.expectValue(expectedValue : ")")
    return expr_1;
  }
  func parseArrowFunction() -> TSNode {
    let node : TSNode = TSNode()
    node.nodeType = "ArrowFunctionExpression";
    let startTok : Token = self.peek()
    node.start = startTok.start;
    node.line = startTok.line;
    node.col = startTok.col;
    if ( self.matchValue(value : "async") ) {
      self.advance()
      node.kind = "async";
    }
    if ( self.matchValue(value : "(") ) {
      self.advance()
      while ((self.matchValue(value : ")") == false) && (self.isAtEnd() == false)) {
        if ( (node.params.count) > 0 ) {
          _ = self.expectValue(expectedValue : ",")
        }
        let param : TSNode = self.parseParam()
        node.params.append(param)
      }
      _ = self.expectValue(expectedValue : ")")
    } else {
      let paramTok : Token = self.expect(expectedType : "Identifier")
      let param_1 : TSNode = TSNode()
      param_1.nodeType = "Parameter";
      param_1.name = paramTok.value;
      node.params.append(param_1)
    }
    if ( self.matchValue(value : ":") ) {
      self.advance()
      let retType : TSNode = self.parseType()
      node.typeAnnotation = retType;
    }
    _ = self.expectValue(expectedValue : "=>")
    if ( self.matchValue(value : "{") ) {
      let body : TSNode = self.parseBlock()
      node.body = body;
    } else {
      let body_1 : TSNode = self.parseExpr()
      node.body = body_1;
    }
    return node;
  }
  func parseNewExpression() -> TSNode {
    let node : TSNode = TSNode()
    node.nodeType = "NewExpression";
    let tok : Token = self.peek()
    node.start = tok.start;
    node.line = tok.line;
    node.col = tok.col;
    _ = self.expectValue(expectedValue : "new")
    let callee : TSNode = self.parsePrimary()
    node.left = callee;
    if ( self.matchValue(value : "<") ) {
      var depth : Int = 1
      self.advance()
      while ((depth > 0) && (self.isAtEnd() == false)) {
        let v : String = self.peekValue()
        if ( v == "<" ) {
          depth = depth + 1;
        }
        if ( v == ">" ) {
          depth = depth - 1;
        }
        self.advance()
      }
    }
    if ( self.matchValue(value : "(") ) {
      self.advance()
      while ((self.matchValue(value : ")") == false) && (self.isAtEnd() == false)) {
        if ( (node.children.count) > 0 ) {
          _ = self.expectValue(expectedValue : ",")
        }
        let arg : TSNode = self.parseExpr()
        node.children.append(arg)
      }
      _ = self.expectValue(expectedValue : ")")
    }
    return node;
  }
  func peekNextType() -> String {
    let nextPos : Int = self.pos + 1
    if ( nextPos < (self.tokens.count) ) {
      let nextTok : Token = self.tokens[nextPos]
      return nextTok.tokenType;
    }
    return "EOF";
  }
  func parseJSXElement() -> TSNode {
    let node : TSNode = TSNode()
    node.nodeType = "JSXElement";
    let tok : Token = self.peek()
    node.start = tok.start;
    node.line = tok.line;
    node.col = tok.col;
    let opening : TSNode = self.parseJSXOpeningElement()
    node.left = opening;
    if ( opening.kind == "self-closing" ) {
      node.nodeType = "JSXElement";
      return node;
    }
    /** unused:  let tagName : String = opening.name   **/ 
    while (self.isAtEnd() == false) {
      let v : String = self.peekValue()
      if ( v == "<" ) {
        let nextVal : String = self.peekNextValue()
        if ( nextVal == "/" ) {
          break;
        }
        let child : TSNode = self.parseJSXElement()
        node.children.append(child)
      } else {
        if ( v == "{" ) {
          let exprChild : TSNode = self.parseJSXExpressionContainer()
          node.children.append(exprChild)
        } else {
          let t : String = self.peekType()
          if ( ((t != "EOF") && (v != "<")) && (v != "{") ) {
            let textChild : TSNode = self.parseJSXText()
            node.children.append(textChild)
          } else {
            break;
          }
        }
      }
    }
    let closing : TSNode = self.parseJSXClosingElement()
    node.right = closing;
    return node;
  }
  func parseJSXOpeningElement() -> TSNode {
    let node : TSNode = TSNode()
    node.nodeType = "JSXOpeningElement";
    let tok : Token = self.peek()
    node.start = tok.start;
    node.line = tok.line;
    node.col = tok.col;
    _ = self.expectValue(expectedValue : "<")
    let tagName : TSNode = self.parseJSXElementName()
    node.name = tagName.name;
    node.left = tagName;
    while (self.isAtEnd() == false) {
      let v : String = self.peekValue()
      if ( (v == ">") || (v == "/") ) {
        break;
      }
      let attr : TSNode = self.parseJSXAttribute()
      node.children.append(attr)
    }
    if ( self.matchValue(value : "/") ) {
      self.advance()
      node.kind = "self-closing";
    }
    _ = self.expectValue(expectedValue : ">")
    return node;
  }
  func parseJSXClosingElement() -> TSNode {
    let node : TSNode = TSNode()
    node.nodeType = "JSXClosingElement";
    let tok : Token = self.peek()
    node.start = tok.start;
    node.line = tok.line;
    node.col = tok.col;
    _ = self.expectValue(expectedValue : "<")
    _ = self.expectValue(expectedValue : "/")
    let tagName : TSNode = self.parseJSXElementName()
    node.name = tagName.name;
    node.left = tagName;
    _ = self.expectValue(expectedValue : ">")
    return node;
  }
  func parseJSXElementName() -> TSNode {
    let node : TSNode = TSNode()
    node.nodeType = "JSXIdentifier";
    let tok : Token = self.peek()
    node.start = tok.start;
    node.line = tok.line;
    node.col = tok.col;
    var namePart : String = tok.value
    self.advance()
    while (self.matchValue(value : ".")) {
      self.advance()
      let nextTok : Token = self.peek()
      namePart = (namePart + ".") + nextTok.value;
      self.advance()
      node.nodeType = "JSXMemberExpression";
    }
    node.name = namePart;
    return node;
  }
  func parseJSXAttribute() -> TSNode {
    let node : TSNode = TSNode()
    node.nodeType = "JSXAttribute";
    let tok : Token = self.peek()
    node.start = tok.start;
    node.line = tok.line;
    node.col = tok.col;
    if ( self.matchValue(value : "{") ) {
      self.advance()
      if ( self.matchValue(value : "...") ) {
        self.advance()
        node.nodeType = "JSXSpreadAttribute";
        let arg : TSNode = self.parseExpr()
        node.left = arg;
        _ = self.expectValue(expectedValue : "}")
        return node;
      }
    }
    let attrName : String = tok.value
    node.name = attrName;
    self.advance()
    if ( self.matchValue(value : "=") ) {
      self.advance()
      let valTok : String = self.peekValue()
      if ( valTok == "{" ) {
        let exprValue : TSNode = self.parseJSXExpressionContainer()
        node.right = exprValue;
      } else {
        let strTok : Token = self.peek()
        let strNode : TSNode = TSNode()
        strNode.nodeType = "StringLiteral";
        strNode.value = strTok.value;
        strNode.start = strTok.start;
        strNode.end = strTok.end;
        strNode.line = strTok.line;
        strNode.col = strTok.col;
        self.advance()
        node.right = strNode;
      }
    }
    return node;
  }
  func parseJSXExpressionContainer() -> TSNode {
    let node : TSNode = TSNode()
    node.nodeType = "JSXExpressionContainer";
    let tok : Token = self.peek()
    node.start = tok.start;
    node.line = tok.line;
    node.col = tok.col;
    _ = self.expectValue(expectedValue : "{")
    if ( self.matchValue(value : "}") ) {
      let empty : TSNode = TSNode()
      empty.nodeType = "JSXEmptyExpression";
      node.left = empty;
    } else {
      let expr : TSNode = self.parseExpr()
      node.left = expr;
    }
    _ = self.expectValue(expectedValue : "}")
    return node;
  }
  func parseJSXText() -> TSNode {
    let node : TSNode = TSNode()
    node.nodeType = "JSXText";
    let tok : Token = self.peek()
    node.start = tok.start;
    node.line = tok.line;
    node.col = tok.col;
    node.value = tok.value;
    self.advance()
    return node;
  }
  func parseJSXFragment() -> TSNode {
    let node : TSNode = TSNode()
    node.nodeType = "JSXFragment";
    let tok : Token = self.peek()
    node.start = tok.start;
    node.line = tok.line;
    node.col = tok.col;
    _ = self.expectValue(expectedValue : "<")
    _ = self.expectValue(expectedValue : ">")
    while (self.isAtEnd() == false) {
      let v : String = self.peekValue()
      if ( v == "<" ) {
        let nextVal : String = self.peekNextValue()
        if ( nextVal == "/" ) {
          break;
        }
        let child : TSNode = self.parseJSXElement()
        node.children.append(child)
      } else {
        if ( v == "{" ) {
          let exprChild : TSNode = self.parseJSXExpressionContainer()
          node.children.append(exprChild)
        } else {
          let t : String = self.peekType()
          if ( ((t != "EOF") && (v != "<")) && (v != "{") ) {
            let textChild : TSNode = self.parseJSXText()
            node.children.append(textChild)
          } else {
            break;
          }
        }
      }
    }
    _ = self.expectValue(expectedValue : "<")
    _ = self.expectValue(expectedValue : "/")
    _ = self.expectValue(expectedValue : ">")
    return node;
  }
}
func ==(l: TSParserMain, r: TSParserMain) -> Bool {
  return l === r
}
class TSParserMain : Equatable  { 
  class func showHelp() -> Void {
    print("TypeScript Parser")
    print("")
    print("Usage: node ts_parser_main.js [options]")
    print("")
    print("Options:")
    print("  -h, --help          Show this help message")
    print("  -d                  Run built-in demo/test suite")
    print("  -i <file>           Input TypeScript file to parse")
    print("  --tokens            Show tokens in addition to AST")
    print("  --show-interfaces   List all interfaces in the file")
    print("  --show-types        List all type aliases in the file")
    print("  --show-functions    List all functions in the file")
    print("")
    print("Examples:")
    print("  node ts_parser_main.js -d                              Run the demo")
    print("  node ts_parser_main.js -i script.ts                    Parse and show AST")
    print("  node ts_parser_main.js -i script.ts --tokens           Also show tokens")
    print("  node ts_parser_main.js -i script.ts --show-interfaces  List interfaces")
  }
  class func listDeclarations(filename : String, showInterfaces : Bool, showTypes : Bool, showFunctions : Bool) -> Void {
    let codeOpt : String? = r_read_file(dirName: "." + "/" + filename) 
    if ( codeOpt == nil ) {
      print("Error: Could not read file: " + filename)
      return;
    }
    let code : String = codeOpt!
    let lexer : TSLexer = TSLexer(src : code)
    let tokens : [Token] = lexer.tokenize()
    let parser : TSParserSimple = TSParserSimple()
    parser.initParser(toks : tokens)
    parser.setQuiet(q : true)
    let program : TSNode = parser.parseProgram()
    if ( showInterfaces ) {
      print(("=== Interfaces in " + filename) + " ===")
      print("")
      TSParserMain.listInterfaces(program : program)
      print("")
    }
    if ( showTypes ) {
      print(("=== Type Aliases in " + filename) + " ===")
      print("")
      TSParserMain.listTypeAliases(program : program)
      print("")
    }
    if ( showFunctions ) {
      print(("=== Functions in " + filename) + " ===")
      print("")
      TSParserMain.listFunctions(program : program)
      print("")
    }
  }
  class func listInterfaces(program : TSNode) -> Void {
    var count : Int = 0
    for (idx, stmt) in program.children.enumerated() {
      if ( stmt.nodeType == "TSInterfaceDeclaration" ) {
        count = count + 1;
        let line : String = "" + String(stmt.line)
        var props : Int = 0
        if ( stmt.body != nil  ) {
          let body : TSNode = stmt.body!
          props = body.children.count;
        }
        print(((((("  " + stmt.name) + " (") + String(props)) + " properties) [line ") + line) + "]")
        if ( stmt.body != nil  ) {
          let bodyNode : TSNode = stmt.body!
          for (mi, member) in bodyNode.children.enumerated() {
            if ( member.nodeType == "TSPropertySignature" ) {
              var propInfo : String = "    - " + member.name
              if ( member.optional ) {
                propInfo = propInfo + "?";
              }
              if ( member.readonly ) {
                propInfo = "    - readonly " + member.name;
                if ( member.optional ) {
                  propInfo = propInfo + "?";
                }
              }
              if ( member.typeAnnotation != nil  ) {
                let typeNode : TSNode = member.typeAnnotation!
                if ( typeNode.typeAnnotation != nil  ) {
                  let innerType : TSNode = typeNode.typeAnnotation!
                  propInfo = (propInfo + ": ") + TSParserMain.getTypeName(typeNode : innerType);
                }
              }
              print(propInfo)
            }
          }
        }
      }
    }
    print("")
    print(("Total: " + String(count)) + " interface(s)")
  }
  class func listTypeAliases(program : TSNode) -> Void {
    var count : Int = 0
    for (idx, stmt) in program.children.enumerated() {
      if ( stmt.nodeType == "TSTypeAliasDeclaration" ) {
        count = count + 1;
        let line : String = "" + String(stmt.line)
        var typeInfo : String = "  " + stmt.name
        if ( stmt.typeAnnotation != nil  ) {
          let typeNode : TSNode = stmt.typeAnnotation!
          typeInfo = (typeInfo + " = ") + TSParserMain.getTypeName(typeNode : typeNode);
        }
        typeInfo = ((typeInfo + " [line ") + line) + "]";
        print(typeInfo)
      }
    }
    print("")
    print(("Total: " + String(count)) + " type alias(es)")
  }
  class func listFunctions(program : TSNode) -> Void {
    var count : Int = 0
    for (idx, stmt) in program.children.enumerated() {
      if ( stmt.nodeType == "FunctionDeclaration" ) {
        count = count + 1;
        let line : String = "" + String(stmt.line)
        var funcInfo : String = ("  " + stmt.name) + "("
        /** unused:  let paramCount : Int = stmt.params.count   **/ 
        var pi : Int = 0
        for (paramIdx, param) in stmt.params.enumerated() {
          if ( pi > 0 ) {
            funcInfo = funcInfo + ", ";
          }
          funcInfo = funcInfo + param.name;
          if ( param.optional ) {
            funcInfo = funcInfo + "?";
          }
          if ( param.typeAnnotation != nil  ) {
            let paramType : TSNode = param.typeAnnotation!
            if ( paramType.typeAnnotation != nil  ) {
              let innerType : TSNode = paramType.typeAnnotation!
              funcInfo = (funcInfo + ": ") + TSParserMain.getTypeName(typeNode : innerType);
            }
          }
          pi = pi + 1;
        }
        funcInfo = funcInfo + ")";
        if ( stmt.typeAnnotation != nil  ) {
          let retType : TSNode = stmt.typeAnnotation!
          if ( retType.typeAnnotation != nil  ) {
            let innerRet : TSNode = retType.typeAnnotation!
            funcInfo = (funcInfo + ": ") + TSParserMain.getTypeName(typeNode : innerRet);
          }
        }
        funcInfo = ((funcInfo + " [line ") + line) + "]";
        print(funcInfo)
      }
    }
    print("")
    print(("Total: " + String(count)) + " function(s)")
  }
  class func getTypeName(typeNode : TSNode) -> String {
    let nodeType : String = typeNode.nodeType
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
      var result : String = typeNode.name
      if ( (typeNode.params.count) > 0 ) {
        result = result + "<";
        var gi : Int = 0
        for (gpIdx, gp) in typeNode.params.enumerated() {
          if ( gi > 0 ) {
            result = result + ", ";
          }
          result = result + TSParserMain.getTypeName(typeNode : gp);
          gi = gi + 1;
        }
        result = result + ">";
      }
      return result;
    }
    if ( nodeType == "TSUnionType" ) {
      var result_1 : String = ""
      var ui : Int = 0
      for (utIdx, ut) in typeNode.children.enumerated() {
        if ( ui > 0 ) {
          result_1 = result_1 + " | ";
        }
        result_1 = result_1 + TSParserMain.getTypeName(typeNode : ut);
        ui = ui + 1;
      }
      return result_1;
    }
    return nodeType;
  }
  class func parseFile(filename : String, showTokens : Bool) -> Void {
    let codeOpt : String? = r_read_file(dirName: "." + "/" + filename) 
    if ( codeOpt == nil ) {
      print("Error: Could not read file: " + filename)
      return;
    }
    let code : String = codeOpt!
    print(("=== Parsing: " + filename) + " ===")
    print("")
    let lexer : TSLexer = TSLexer(src : code)
    let tokens : [Token] = lexer.tokenize()
    if ( showTokens ) {
      print("--- Tokens ---")
      for (ti, tok) in tokens.enumerated() {
        let output : String = ((tok.tokenType + ": '") + tok.value) + "'"
        print(output)
      }
      print("")
    }
    let parser : TSParserSimple = TSParserSimple()
    parser.initParser(toks : tokens)
    let program : TSNode = parser.parseProgram()
    print("--- AST ---")
    print(("Program with " + String((program.children.count))) + " statements:")
    print("")
    for (idx, stmt) in program.children.enumerated() {
      TSParserMain.printNode(node : stmt, depth : 0)
    }
  }
  class func runDemo() -> Void {
    let code : String = "\r\ninterface Person {\r\n  readonly id: number;\r\n  name: string;\r\n  age?: number;\r\n}\r\n\r\ntype ID = string | number;\r\n\r\ntype Result = Person | null;\r\n\r\nlet count: number = 42;\r\n\r\nconst message: string = 'hello';\r\n\r\nfunction greet(name: string, age?: number): string {\r\n  return name;\r\n}\r\n\r\nlet data: Array<string>;\r\n"
    print("=== TypeScript Parser Demo ===")
    print("")
    print("Input:")
    print(code)
    print("")
    print("--- Tokens ---")
    let lexer : TSLexer = TSLexer(src : code)
    let tokens : [Token] = lexer.tokenize()
    for (i, tok) in tokens.enumerated() {
      let output : String = ((tok.tokenType + ": '") + tok.value) + "'"
      print(output)
    }
    print("")
    print("--- AST ---")
    let parser : TSParserSimple = TSParserSimple()
    parser.initParser(toks : tokens)
    let program : TSNode = parser.parseProgram()
    print(("Program with " + String((program.children.count))) + " statements:")
    print("")
    for (idx, stmt) in program.children.enumerated() {
      TSParserMain.printNode(node : stmt, depth : 0)
    }
  }
  class func printNode(node : TSNode, depth : Int) -> Void {
    var indent : String = ""
    var i : Int = 0
    while (i < depth) {
      indent = indent + "  ";
      i = i + 1;
    }
    let nodeType : String = node.nodeType
    let loc : String = ((("[" + String(node.line)) + ":") + String(node.col)) + "]"
    if ( nodeType == "TSInterfaceDeclaration" ) {
      print((((indent + "TSInterfaceDeclaration: ") + node.name) + " ") + loc)
      if ( node.body != nil  ) {
        TSParserMain.printNode(node : node.body!, depth : depth + 1)
      }
      return;
    }
    if ( nodeType == "TSInterfaceBody" ) {
      print((indent + "TSInterfaceBody ") + loc)
      for (mi, member) in node.children.enumerated() {
        TSParserMain.printNode(node : member, depth : depth + 1)
      }
      return;
    }
    if ( nodeType == "TSPropertySignature" ) {
      var modifiers : String = ""
      if ( node.readonly ) {
        modifiers = "readonly ";
      }
      if ( node.optional ) {
        modifiers = modifiers + "optional ";
      }
      print(((((indent + "TSPropertySignature: ") + modifiers) + node.name) + " ") + loc)
      if ( node.typeAnnotation != nil  ) {
        TSParserMain.printNode(node : node.typeAnnotation!, depth : depth + 1)
      }
      return;
    }
    if ( nodeType == "TSTypeAliasDeclaration" ) {
      print((((indent + "TSTypeAliasDeclaration: ") + node.name) + " ") + loc)
      if ( node.typeAnnotation != nil  ) {
        TSParserMain.printNode(node : node.typeAnnotation!, depth : depth + 1)
      }
      return;
    }
    if ( nodeType == "TSTypeAnnotation" ) {
      print((indent + "TSTypeAnnotation ") + loc)
      if ( node.typeAnnotation != nil  ) {
        TSParserMain.printNode(node : node.typeAnnotation!, depth : depth + 1)
      }
      return;
    }
    if ( nodeType == "TSUnionType" ) {
      print((indent + "TSUnionType ") + loc)
      for (ti, typeNode) in node.children.enumerated() {
        TSParserMain.printNode(node : typeNode, depth : depth + 1)
      }
      return;
    }
    if ( nodeType == "TSTypeReference" ) {
      print((((indent + "TSTypeReference: ") + node.name) + " ") + loc)
      for (pi, param) in node.params.enumerated() {
        TSParserMain.printNode(node : param, depth : depth + 1)
      }
      return;
    }
    if ( nodeType == "TSArrayType" ) {
      print((indent + "TSArrayType ") + loc)
      if ( node.left != nil  ) {
        TSParserMain.printNode(node : node.left!, depth : depth + 1)
      }
      return;
    }
    if ( nodeType == "TSStringKeyword" ) {
      print((indent + "TSStringKeyword ") + loc)
      return;
    }
    if ( nodeType == "TSNumberKeyword" ) {
      print((indent + "TSNumberKeyword ") + loc)
      return;
    }
    if ( nodeType == "TSBooleanKeyword" ) {
      print((indent + "TSBooleanKeyword ") + loc)
      return;
    }
    if ( nodeType == "TSAnyKeyword" ) {
      print((indent + "TSAnyKeyword ") + loc)
      return;
    }
    if ( nodeType == "TSNullKeyword" ) {
      print((indent + "TSNullKeyword ") + loc)
      return;
    }
    if ( nodeType == "TSVoidKeyword" ) {
      print((indent + "TSVoidKeyword ") + loc)
      return;
    }
    if ( nodeType == "VariableDeclaration" ) {
      print((((indent + "VariableDeclaration (") + node.kind) + ") ") + loc)
      for (di, declarator) in node.children.enumerated() {
        TSParserMain.printNode(node : declarator, depth : depth + 1)
      }
      return;
    }
    if ( nodeType == "VariableDeclarator" ) {
      print((((indent + "VariableDeclarator: ") + node.name) + " ") + loc)
      if ( node.typeAnnotation != nil  ) {
        TSParserMain.printNode(node : node.typeAnnotation!, depth : depth + 1)
      }
      if ( node._init != nil  ) {
        print(indent + "  init:")
        TSParserMain.printNode(node : node._init!, depth : depth + 2)
      }
      return;
    }
    if ( nodeType == "FunctionDeclaration" ) {
      var paramNames : String = ""
      for (pi_1, p) in node.params.enumerated() {
        if ( pi_1 > 0 ) {
          paramNames = paramNames + ", ";
        }
        paramNames = paramNames + p.name;
        if ( p.optional ) {
          paramNames = paramNames + "?";
        }
      }
      print((((((indent + "FunctionDeclaration: ") + node.name) + "(") + paramNames) + ") ") + loc)
      if ( node.typeAnnotation != nil  ) {
        print(indent + "  returnType:")
        TSParserMain.printNode(node : node.typeAnnotation!, depth : depth + 2)
      }
      if ( node.body != nil  ) {
        TSParserMain.printNode(node : node.body!, depth : depth + 1)
      }
      return;
    }
    if ( nodeType == "BlockStatement" ) {
      print((indent + "BlockStatement ") + loc)
      for (si, stmt) in node.children.enumerated() {
        TSParserMain.printNode(node : stmt, depth : depth + 1)
      }
      return;
    }
    if ( nodeType == "ExpressionStatement" ) {
      print((indent + "ExpressionStatement ") + loc)
      if ( node.left != nil  ) {
        TSParserMain.printNode(node : node.left!, depth : depth + 1)
      }
      return;
    }
    if ( nodeType == "ReturnStatement" ) {
      print((indent + "ReturnStatement ") + loc)
      if ( node.left != nil  ) {
        TSParserMain.printNode(node : node.left!, depth : depth + 1)
      }
      return;
    }
    if ( nodeType == "Identifier" ) {
      print((((indent + "Identifier: ") + node.name) + " ") + loc)
      return;
    }
    if ( nodeType == "NumericLiteral" ) {
      print((((indent + "NumericLiteral: ") + node.value) + " ") + loc)
      return;
    }
    if ( nodeType == "StringLiteral" ) {
      print((((indent + "StringLiteral: ") + node.value) + " ") + loc)
      return;
    }
    print(((indent + nodeType) + " ") + loc)
  }
}

func r_read_file ( dirName:String ) -> String? {
    let res: String?
    do {
        res = try String(contentsOfFile:dirName, encoding: .utf8)
    } catch let error {
        print("Error reading file: \(dirName)")
        print("Error: \(error.localizedDescription)")
        res = nil
    }
    return res
}

// Main entry point
@main
struct Main {
  static func main() {
    let argCnt : Int = CommandLine.arguments.count - 1
    if ( argCnt == 0 ) {
      TSParserMain.showHelp()
      return;
    }
    var inputFile : String = ""
    var runDefault : Bool = false
    var showTokens : Bool = false
    var showInterfaces : Bool = false
    var showTypes : Bool = false
    var showFunctions : Bool = false
    var i : Int = 0
    while (i < argCnt) {
      let arg : String = CommandLine.arguments[i + 1]
      if ( (arg == "--help") || (arg == "-h") ) {
        TSParserMain.showHelp()
        return;
      }
      if ( arg == "-d" ) {
        runDefault = true;
        i = i + 1;
      } else {
        if ( arg == "-i" ) {
          i = i + 1;
          if ( i < argCnt ) {
            inputFile = CommandLine.arguments[i + 1];
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
    }
    if ( runDefault ) {
      TSParserMain.runDemo()
      return;
    }
    if ( (inputFile.count) > 0 ) {
      if ( (showInterfaces || showTypes) || showFunctions ) {
        TSParserMain.listDeclarations(filename : inputFile, showInterfaces : showInterfaces, showTypes : showTypes, showFunctions : showFunctions)
        return;
      }
      TSParserMain.parseFile(filename : inputFile, showTokens : showTokens)
      return;
    }
    TSParserMain.showHelp()
  }
}
