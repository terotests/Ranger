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
func ==(l: Lexer, r: Lexer) -> Bool {
  return l === r
}
class Lexer : Equatable  { 
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
    var isJSDoc : Bool = false
    if ( self.peek() == "*" ) {
      let nextCh : String = self.peekAt(offset : 1)
      if ( nextCh != "/" ) {
        isJSDoc = true;
      }
    }
    while (self.pos < self.__len) {
      let ch : String = self.peek()
      if ( ch == "*" ) {
        if ( self.peekAt(offset : 1) == "/" ) {
          _ = self.advance()
          _ = self.advance()
          if ( isJSDoc ) {
            return self.makeToken(tokType : "JSDocComment", value : value, startPos : startPos, startLine : startLine, startCol : startCol);
          }
          return self.makeToken(tokType : "BlockComment", value : value, startPos : startPos, startLine : startLine, startCol : startCol);
        }
      }
      value = value + self.advance();
    }
    if ( isJSDoc ) {
      return self.makeToken(tokType : "JSDocComment", value : value, startPos : startPos, startLine : startLine, startCol : startCol);
    }
    return self.makeToken(tokType : "BlockComment", value : value, startPos : startPos, startLine : startLine, startCol : startCol);
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
    var hasExpressions : Bool = false
    while (self.pos < self.__len) {
      let ch : String = self.peek()
      if ( ch == "`" ) {
        _ = self.advance()
        if ( hasExpressions ) {
          return self.makeToken(tokType : "TemplateLiteral", value : value, startPos : startPos, startLine : startLine, startCol : startCol);
        } else {
          return self.makeToken(tokType : "TemplateLiteral", value : value, startPos : startPos, startLine : startLine, startCol : startCol);
        }
      }
      if ( ch == "\\" ) {
        _ = self.advance()
        let esc : String = self.advance()
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
          if ( self.peekAt(offset : 1) == "{" ) {
            hasExpressions = true;
            value = value + self.advance();
            value = value + self.advance();
          } else {
            value = value + self.advance();
          }
        } else {
          value = value + self.advance();
        }
      }
    }
    return self.makeToken(tokType : "TemplateLiteral", value : value, startPos : startPos, startLine : startLine, startCol : startCol);
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
  func readRegexLiteral() -> Token {
    let startPos : Int = self.pos
    let startLine : Int = self.line
    let startCol : Int = self.col
    _ = self.advance()
    var pattern : String = ""
    var inCharClass : Bool = false
    while (self.pos < self.__len) {
      let ch : String = self.peek()
      if ( ch == "[" ) {
        inCharClass = true;
        pattern = pattern + self.advance();
      } else {
        if ( ch == "]" ) {
          inCharClass = false;
          pattern = pattern + self.advance();
        } else {
          if ( ch == "\\" ) {
            pattern = pattern + self.advance();
            if ( self.pos < self.__len ) {
              pattern = pattern + self.advance();
            }
          } else {
            if ( (ch == "/") && (inCharClass == false) ) {
              _ = self.advance()
              break;
            } else {
              if ( ((ch == "\n") || (ch == "\r")) || (ch == "\r\n") ) {
                return self.makeToken(tokType : "RegexLiteral", value : pattern, startPos : startPos, startLine : startLine, startCol : startCol);
              } else {
                pattern = pattern + self.advance();
              }
            }
          }
        }
      }
    }
    var flags : String = ""
    while (self.pos < self.__len) {
      let ch_1 : String = self.peek()
      if ( (((((ch_1 == "g") || (ch_1 == "i")) || (ch_1 == "m")) || (ch_1 == "s")) || (ch_1 == "u")) || (ch_1 == "y") ) {
        flags = flags + self.advance();
      } else {
        break;
      }
    }
    let fullValue : String = (pattern + "/") + flags
    return self.makeToken(tokType : "RegexLiteral", value : fullValue, startPos : startPos, startLine : startLine, startCol : startCol);
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
func ==(l: Position, r: Position) -> Bool {
  return l === r
}
class Position : Equatable  { 
  var line : Int = 1     /** note: unused */
  var column : Int = 0     /** note: unused */
}
func ==(l: SourceLocation, r: SourceLocation) -> Bool {
  return l === r
}
class SourceLocation : Equatable  { 
  var start : Position?     /** note: unused */
  var end : Position?     /** note: unused */
}
func ==(l: JSNode, r: JSNode) -> Bool {
  return l === r
}
class JSNode : Equatable  { 
  var type : String = ""
  var loc : SourceLocation?     /** note: unused */
  var start : Int = 0
  var end : Int = 0
  var line : Int = 0
  var col : Int = 0
  var name : String = ""
  var raw : String = ""
  var regexPattern : String = ""
  var regexFlags : String = ""
  var _operator : String = ""
  var prefix : Bool = false
  var left : JSNode?
  var right : JSNode?
  var argument : JSNode?
  var test : JSNode?
  var consequent : JSNode?     /** note: unused */
  var alternate : JSNode?
  var id : JSNode?
  var params : [JSNode] = [JSNode]()     /** note: unused */
  var body : JSNode?
  var generator : Bool = false
  var async : Bool = false
  var expression : Bool = false     /** note: unused */
  var declarations : [JSNode] = [JSNode]()     /** note: unused */
  var kind : String = ""
  var _init : JSNode?
  var superClass : JSNode?
  var object : JSNode?     /** note: unused */
  var property : JSNode?     /** note: unused */
  var computed : Bool = false
  var optional : Bool = false     /** note: unused */
  var callee : JSNode?     /** note: unused */
  var arguments : [JSNode] = [JSNode]()     /** note: unused */
  var elements : [JSNode] = [JSNode]()     /** note: unused */
  var properties : [JSNode] = [JSNode]()     /** note: unused */
  var key : JSNode?
  var method : Bool = false     /** note: unused */
  var shorthand : Bool = false
  var update : JSNode?     /** note: unused */
  var discriminant : JSNode?     /** note: unused */
  var cases : [JSNode] = [JSNode]()     /** note: unused */
  var consequentStatements : [JSNode] = [JSNode]()     /** note: unused */
  var block : JSNode?     /** note: unused */
  var handler : JSNode?     /** note: unused */
  var finalizer : JSNode?     /** note: unused */
  var param : JSNode?     /** note: unused */
  var source : JSNode?     /** note: unused */
  var specifiers : [JSNode] = [JSNode]()     /** note: unused */
  var imported : JSNode?
  var local : JSNode?
  var exported : JSNode?
  var declaration : JSNode?     /** note: unused */
  var quasis : [JSNode] = [JSNode]()     /** note: unused */
  var expressions : [JSNode] = [JSNode]()     /** note: unused */
  var tail : Bool = false     /** note: unused */
  var cooked : String = ""     /** note: unused */
  var sourceType : String = ""     /** note: unused */
  var _static : Bool = false
  var delegate : Bool = false
  var children : [JSNode] = [JSNode]()
  var leadingComments : [JSNode] = [JSNode]()
  var trailingComments : [JSNode] = [JSNode]()     /** note: unused */
}
func ==(l: SimpleParser, r: SimpleParser) -> Bool {
  return l === r
}
class SimpleParser : Equatable  { 
  var tokens : [Token] = [Token]()
  var pos : Int = 0
  var currentToken : Token?
  var errors : [String] = [String]()
  var pendingComments : [JSNode] = [JSNode]()
  var source : String = ""
  var lexer : Lexer?
  func initParser(toks : [Token]) -> Void {
    self.tokens = toks;
    self.pos = 0;
    if ( (toks.count) > 0 ) {
      self.currentToken = toks[0];
    }
    self.skipComments()
  }
  func initParserWithSource(toks : [Token], src : String) -> Void {
    self.tokens = toks;
    self.source = src;
    self.lexer = Lexer(src : src);
    self.pos = 0;
    if ( (toks.count) > 0 ) {
      self.currentToken = toks[0];
    }
    self.skipComments()
  }
  func isCommentToken() -> Bool {
    let t : String = self.peekType()
    if ( t == "LineComment" ) {
      return true;
    }
    if ( t == "BlockComment" ) {
      return true;
    }
    if ( t == "JSDocComment" ) {
      return true;
    }
    return false;
  }
  func skipComments() -> Void {
    while (self.isCommentToken()) {
      let tok : Token = self.peek()
      let commentNode : JSNode = JSNode()
      commentNode.type = tok.tokenType;
      commentNode.raw = tok.value;
      commentNode.line = tok.line;
      commentNode.col = tok.col;
      commentNode.start = tok.start;
      commentNode.end = tok.end;
      self.pendingComments.append(commentNode)
      self.advanceRaw()
    }
  }
  func advanceRaw() -> Void {
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
  func collectComments() -> [JSNode] {
    var comments : [JSNode] = [JSNode]()
    for (i, c) in self.pendingComments.enumerated() {
      comments.append(c)
    }
    let empty : [JSNode] = [JSNode]()
    self.pendingComments = empty;
    return comments;
  }
  func attachComments(node : JSNode) -> Void {
    let comments : [JSNode] = self.collectComments()
    for (i, c) in comments.enumerated() {
      node.leadingComments.append(c)
    }
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
    self.advanceRaw()
    self.skipComments()
  }
  func addError(msg : String) -> Void {
    self.errors.append(msg)
  }
  func expect(expectedType : String) -> Token {
    let tok : Token = self.peek()
    if ( tok.tokenType != expectedType ) {
      let err : String = (((((("Parse error at line " + String(tok.line)) + ":") + String(tok.col)) + ": expected ") + expectedType) + " but got ") + tok.tokenType
      self.addError(msg : err)
    }
    self.advance()
    return tok;
  }
  func expectValue(expectedValue : String) -> Token {
    let tok : Token = self.peek()
    if ( tok.value != expectedValue ) {
      let err : String = ((((((("Parse error at line " + String(tok.line)) + ":") + String(tok.col)) + ": expected '") + expectedValue) + "' but got '") + tok.value) + "'"
      self.addError(msg : err)
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
  func hasErrors() -> Bool {
    return (self.errors.count) > 0;
  }
  func parseRegexLiteral() -> JSNode {
    let tok : Token = self.peek()
    let startPos : Int = tok.start
    let startLine : Int = tok.line
    let startCol : Int = tok.col
    if ( self.lexer == nil ) {
      let err : JSNode = JSNode()
      err.type = "Identifier";
      err.name = "regex_error";
      self.advance()
      return err;
    }
    let lex : Lexer = self.lexer!
    lex.pos = startPos;
    lex.line = startLine;
    lex.col = startCol;
    let regexTok : Token = lex.readRegexLiteral()
    let fullValue : String = regexTok.value
    var pattern : String = ""
    var flags : String = ""
    var lastSlash : Int = -1
    var i : Int = 0
    while (i < (fullValue.count)) {
      let ch : String = String(fullValue[fullValue.index(fullValue.startIndex, offsetBy:i)])
      if ( ch == "/" ) {
        lastSlash = i;
      }
      i = i + 1;
    }
    if ( lastSlash >= 0 ) {
      pattern = String(fullValue[fullValue.index(fullValue.startIndex, offsetBy:0)..<fullValue.index(fullValue.startIndex, offsetBy:lastSlash)]);
      flags = String(fullValue[fullValue.index(fullValue.startIndex, offsetBy:(lastSlash + 1))..<fullValue.index(fullValue.startIndex, offsetBy:(fullValue.count))]);
    } else {
      pattern = fullValue;
    }
    let regex : JSNode = JSNode()
    regex.type = "Literal";
    regex.raw = fullValue;
    regex.regexPattern = pattern;
    regex.regexFlags = flags;
    regex.start = startPos;
    regex.end = lex.pos;
    regex.line = startLine;
    regex.col = startCol;
    self.advance()
    while (self.isAtEnd() == false) {
      let nextTok : Token = self.peek()
      if ( nextTok.start < lex.pos ) {
        self.advance()
      } else {
        break;
      }
    }
    return regex;
  }
  func parseProgram() -> JSNode {
    let prog : JSNode = JSNode()
    prog.type = "Program";
    while (self.isAtEnd() == false) {
      let stmt : JSNode = self.parseStatement()
      prog.children.append(stmt)
    }
    return prog;
  }
  func parseStatement() -> JSNode {
    let comments : [JSNode] = self.collectComments()
    let tokVal : String = self.peekValue()
    var stmt : JSNode?
    if ( tokVal == "var" ) {
      stmt = self.parseVarDecl();
    }
    if ( (stmt == nil) && (tokVal == "let") ) {
      stmt = self.parseLetDecl();
    }
    if ( (stmt == nil) && (tokVal == "const") ) {
      stmt = self.parseConstDecl();
    }
    if ( (stmt == nil) && (tokVal == "function") ) {
      stmt = self.parseFuncDecl();
    }
    if ( (stmt == nil) && (tokVal == "async") ) {
      stmt = self.parseAsyncFuncDecl();
    }
    if ( (stmt == nil) && (tokVal == "class") ) {
      stmt = self.parseClass();
    }
    if ( (stmt == nil) && (tokVal == "import") ) {
      stmt = self.parseImport();
    }
    if ( (stmt == nil) && (tokVal == "export") ) {
      stmt = self.parseExport();
    }
    if ( (stmt == nil) && (tokVal == "return") ) {
      stmt = self.parseReturn();
    }
    if ( (stmt == nil) && (tokVal == "if") ) {
      stmt = self.parseIf();
    }
    if ( (stmt == nil) && (tokVal == "while") ) {
      stmt = self.parseWhile();
    }
    if ( (stmt == nil) && (tokVal == "do") ) {
      stmt = self.parseDoWhile();
    }
    if ( (stmt == nil) && (tokVal == "for") ) {
      stmt = self.parseFor();
    }
    if ( (stmt == nil) && (tokVal == "switch") ) {
      stmt = self.parseSwitch();
    }
    if ( (stmt == nil) && (tokVal == "try") ) {
      stmt = self.parseTry();
    }
    if ( (stmt == nil) && (tokVal == "throw") ) {
      stmt = self.parseThrow();
    }
    if ( (stmt == nil) && (tokVal == "break") ) {
      stmt = self.parseBreak();
    }
    if ( (stmt == nil) && (tokVal == "continue") ) {
      stmt = self.parseContinue();
    }
    if ( (stmt == nil) && (tokVal == "{") ) {
      stmt = self.parseBlock();
    }
    if ( (stmt == nil) && (tokVal == ";") ) {
      self.advance()
      let empty : JSNode = JSNode()
      empty.type = "EmptyStatement";
      stmt = empty;
    }
    if ( stmt == nil ) {
      stmt = self.parseExprStmt();
    }
    let result : JSNode = stmt!
    for (i, c) in comments.enumerated() {
      result.leadingComments.append(c)
    }
    return result;
  }
  func parseVarDecl() -> JSNode {
    let decl : JSNode = JSNode()
    decl.type = "VariableDeclaration";
    let startTok : Token = self.peek()
    decl.start = startTok.start;
    decl.line = startTok.line;
    decl.col = startTok.col;
    _ = self.expectValue(expectedValue : "var")
    var first : Bool = true
    while (first || self.matchValue(value : ",")) {
      if ( first == false ) {
        self.advance()
      }
      first = false;
      let declarator : JSNode = JSNode()
      declarator.type = "VariableDeclarator";
      let idTok : Token = self.expect(expectedType : "Identifier")
      let id : JSNode = JSNode()
      id.type = "Identifier";
      id.name = idTok.value;
      id.start = idTok.start;
      id.line = idTok.line;
      id.col = idTok.col;
      declarator.id = id;
      declarator.start = idTok.start;
      declarator.line = idTok.line;
      declarator.col = idTok.col;
      if ( self.matchValue(value : "=") ) {
        self.advance()
        let initExpr : JSNode = self.parseAssignment()
        declarator._init = initExpr;
      }
      decl.children.append(declarator)
    }
    if ( self.matchValue(value : ";") ) {
      self.advance()
    }
    return decl;
  }
  func parseLetDecl() -> JSNode {
    let decl : JSNode = JSNode()
    decl.type = "VariableDeclaration";
    decl.kind = "let";
    let startTok : Token = self.peek()
    decl.start = startTok.start;
    decl.line = startTok.line;
    decl.col = startTok.col;
    _ = self.expectValue(expectedValue : "let")
    var first : Bool = true
    while (first || self.matchValue(value : ",")) {
      if ( first == false ) {
        self.advance()
      }
      first = false;
      let declarator : JSNode = JSNode()
      declarator.type = "VariableDeclarator";
      let declTok : Token = self.peek()
      declarator.start = declTok.start;
      declarator.line = declTok.line;
      declarator.col = declTok.col;
      if ( self.matchValue(value : "[") ) {
        let pattern : JSNode = self.parseArrayPattern()
        declarator.id = pattern;
      } else {
        if ( self.matchValue(value : "{") ) {
          let pattern_1 : JSNode = self.parseObjectPattern()
          declarator.id = pattern_1;
        } else {
          let idTok : Token = self.expect(expectedType : "Identifier")
          let id : JSNode = JSNode()
          id.type = "Identifier";
          id.name = idTok.value;
          id.start = idTok.start;
          id.line = idTok.line;
          id.col = idTok.col;
          declarator.id = id;
        }
      }
      if ( self.matchValue(value : "=") ) {
        self.advance()
        let initExpr : JSNode = self.parseAssignment()
        declarator._init = initExpr;
      }
      decl.children.append(declarator)
    }
    if ( self.matchValue(value : ";") ) {
      self.advance()
    }
    return decl;
  }
  func parseConstDecl() -> JSNode {
    let decl : JSNode = JSNode()
    decl.type = "VariableDeclaration";
    decl.kind = "const";
    let startTok : Token = self.peek()
    decl.start = startTok.start;
    decl.line = startTok.line;
    decl.col = startTok.col;
    _ = self.expectValue(expectedValue : "const")
    var first : Bool = true
    while (first || self.matchValue(value : ",")) {
      if ( first == false ) {
        self.advance()
      }
      first = false;
      let declarator : JSNode = JSNode()
      declarator.type = "VariableDeclarator";
      let declTok : Token = self.peek()
      declarator.start = declTok.start;
      declarator.line = declTok.line;
      declarator.col = declTok.col;
      if ( self.matchValue(value : "[") ) {
        let pattern : JSNode = self.parseArrayPattern()
        declarator.id = pattern;
      } else {
        if ( self.matchValue(value : "{") ) {
          let pattern_1 : JSNode = self.parseObjectPattern()
          declarator.id = pattern_1;
        } else {
          let idTok : Token = self.expect(expectedType : "Identifier")
          let id : JSNode = JSNode()
          id.type = "Identifier";
          id.name = idTok.value;
          id.start = idTok.start;
          id.line = idTok.line;
          id.col = idTok.col;
          declarator.id = id;
        }
      }
      if ( self.matchValue(value : "=") ) {
        self.advance()
        let initExpr : JSNode = self.parseAssignment()
        declarator._init = initExpr;
      }
      decl.children.append(declarator)
    }
    if ( self.matchValue(value : ";") ) {
      self.advance()
    }
    return decl;
  }
  func parseFuncDecl() -> JSNode {
    let _func : JSNode = JSNode()
    _func.type = "FunctionDeclaration";
    let startTok : Token = self.peek()
    _func.start = startTok.start;
    _func.line = startTok.line;
    _func.col = startTok.col;
    _ = self.expectValue(expectedValue : "function")
    if ( self.matchValue(value : "*") ) {
      _func.generator = true;
      self.advance()
    }
    let idTok : Token = self.expect(expectedType : "Identifier")
    _func.name = idTok.value;
    _ = self.expectValue(expectedValue : "(")
    while ((self.matchValue(value : ")") == false) && (self.isAtEnd() == false)) {
      if ( (_func.children.count) > 0 ) {
        _ = self.expectValue(expectedValue : ",")
      }
      if ( self.matchValue(value : ")") || self.isAtEnd() ) {
        break;
      }
      if ( self.matchValue(value : "...") ) {
        let restTok : Token = self.peek()
        self.advance()
        let paramTok : Token = self.expect(expectedType : "Identifier")
        let rest : JSNode = JSNode()
        rest.type = "RestElement";
        rest.name = paramTok.value;
        rest.start = restTok.start;
        rest.line = restTok.line;
        rest.col = restTok.col;
        let argNode : JSNode = JSNode()
        argNode.type = "Identifier";
        argNode.name = paramTok.value;
        argNode.start = paramTok.start;
        argNode.line = paramTok.line;
        argNode.col = paramTok.col;
        rest.argument = argNode;
        _func.children.append(rest)
      } else {
        if ( self.matchValue(value : "[") ) {
          let pattern : JSNode = self.parseArrayPattern()
          if ( self.matchValue(value : "=") ) {
            self.advance()
            let defaultVal : JSNode = self.parseAssignment()
            let assignPat : JSNode = JSNode()
            assignPat.type = "AssignmentPattern";
            assignPat.left = pattern;
            assignPat.right = defaultVal;
            assignPat.start = pattern.start;
            assignPat.line = pattern.line;
            assignPat.col = pattern.col;
            _func.children.append(assignPat)
          } else {
            _func.children.append(pattern)
          }
        } else {
          if ( self.matchValue(value : "{") ) {
            let pattern_1 : JSNode = self.parseObjectPattern()
            if ( self.matchValue(value : "=") ) {
              self.advance()
              let defaultVal_1 : JSNode = self.parseAssignment()
              let assignPat_1 : JSNode = JSNode()
              assignPat_1.type = "AssignmentPattern";
              assignPat_1.left = pattern_1;
              assignPat_1.right = defaultVal_1;
              assignPat_1.start = pattern_1.start;
              assignPat_1.line = pattern_1.line;
              assignPat_1.col = pattern_1.col;
              _func.children.append(assignPat_1)
            } else {
              _func.children.append(pattern_1)
            }
          } else {
            let paramTok_1 : Token = self.expect(expectedType : "Identifier")
            let param : JSNode = JSNode()
            param.type = "Identifier";
            param.name = paramTok_1.value;
            param.start = paramTok_1.start;
            param.line = paramTok_1.line;
            param.col = paramTok_1.col;
            if ( self.matchValue(value : "=") ) {
              self.advance()
              let defaultVal_2 : JSNode = self.parseAssignment()
              let assignPat_2 : JSNode = JSNode()
              assignPat_2.type = "AssignmentPattern";
              assignPat_2.left = param;
              assignPat_2.right = defaultVal_2;
              assignPat_2.start = param.start;
              assignPat_2.line = param.line;
              assignPat_2.col = param.col;
              _func.children.append(assignPat_2)
            } else {
              _func.children.append(param)
            }
          }
        }
      }
    }
    _ = self.expectValue(expectedValue : ")")
    let body : JSNode = self.parseBlock()
    _func.body = body;
    return _func;
  }
  func parseFunctionExpression() -> JSNode {
    let _func : JSNode = JSNode()
    _func.type = "FunctionExpression";
    let startTok : Token = self.peek()
    _func.start = startTok.start;
    _func.line = startTok.line;
    _func.col = startTok.col;
    _ = self.expectValue(expectedValue : "function")
    if ( self.matchValue(value : "*") ) {
      _func.generator = true;
      self.advance()
    }
    if ( self.matchType(tokenType : "Identifier") ) {
      let idTok : Token = self.expect(expectedType : "Identifier")
      _func.name = idTok.value;
    }
    _ = self.expectValue(expectedValue : "(")
    while ((self.matchValue(value : ")") == false) && (self.isAtEnd() == false)) {
      if ( (_func.children.count) > 0 ) {
        _ = self.expectValue(expectedValue : ",")
      }
      if ( self.matchValue(value : ")") || self.isAtEnd() ) {
        break;
      }
      if ( self.matchValue(value : "...") ) {
        let restTok : Token = self.peek()
        self.advance()
        let paramTok : Token = self.expect(expectedType : "Identifier")
        let rest : JSNode = JSNode()
        rest.type = "RestElement";
        rest.name = paramTok.value;
        rest.start = restTok.start;
        rest.line = restTok.line;
        rest.col = restTok.col;
        let argNode : JSNode = JSNode()
        argNode.type = "Identifier";
        argNode.name = paramTok.value;
        argNode.start = paramTok.start;
        argNode.line = paramTok.line;
        argNode.col = paramTok.col;
        rest.argument = argNode;
        _func.children.append(rest)
      } else {
        if ( self.matchValue(value : "[") ) {
          let pattern : JSNode = self.parseArrayPattern()
          if ( self.matchValue(value : "=") ) {
            self.advance()
            let defaultVal : JSNode = self.parseAssignment()
            let assignPat : JSNode = JSNode()
            assignPat.type = "AssignmentPattern";
            assignPat.left = pattern;
            assignPat.right = defaultVal;
            assignPat.start = pattern.start;
            assignPat.line = pattern.line;
            assignPat.col = pattern.col;
            _func.children.append(assignPat)
          } else {
            _func.children.append(pattern)
          }
        } else {
          if ( self.matchValue(value : "{") ) {
            let pattern_1 : JSNode = self.parseObjectPattern()
            if ( self.matchValue(value : "=") ) {
              self.advance()
              let defaultVal_1 : JSNode = self.parseAssignment()
              let assignPat_1 : JSNode = JSNode()
              assignPat_1.type = "AssignmentPattern";
              assignPat_1.left = pattern_1;
              assignPat_1.right = defaultVal_1;
              assignPat_1.start = pattern_1.start;
              assignPat_1.line = pattern_1.line;
              assignPat_1.col = pattern_1.col;
              _func.children.append(assignPat_1)
            } else {
              _func.children.append(pattern_1)
            }
          } else {
            let paramTok_1 : Token = self.expect(expectedType : "Identifier")
            let param : JSNode = JSNode()
            param.type = "Identifier";
            param.name = paramTok_1.value;
            param.start = paramTok_1.start;
            param.line = paramTok_1.line;
            param.col = paramTok_1.col;
            if ( self.matchValue(value : "=") ) {
              self.advance()
              let defaultVal_2 : JSNode = self.parseAssignment()
              let assignPat_2 : JSNode = JSNode()
              assignPat_2.type = "AssignmentPattern";
              assignPat_2.left = param;
              assignPat_2.right = defaultVal_2;
              assignPat_2.start = param.start;
              assignPat_2.line = param.line;
              assignPat_2.col = param.col;
              _func.children.append(assignPat_2)
            } else {
              _func.children.append(param)
            }
          }
        }
      }
    }
    _ = self.expectValue(expectedValue : ")")
    let body : JSNode = self.parseBlock()
    _func.body = body;
    return _func;
  }
  func parseAsyncFuncDecl() -> JSNode {
    let _func : JSNode = JSNode()
    _func.type = "FunctionDeclaration";
    let startTok : Token = self.peek()
    _func.start = startTok.start;
    _func.line = startTok.line;
    _func.col = startTok.col;
    _func.async = true;
    _ = self.expectValue(expectedValue : "async")
    _ = self.expectValue(expectedValue : "function")
    if ( self.matchValue(value : "*") ) {
      _func.async = true;
      _func.generator = true;
      self.advance()
    }
    let idTok : Token = self.expect(expectedType : "Identifier")
    _func.name = idTok.value;
    _ = self.expectValue(expectedValue : "(")
    while ((self.matchValue(value : ")") == false) && (self.isAtEnd() == false)) {
      if ( (_func.children.count) > 0 ) {
        _ = self.expectValue(expectedValue : ",")
      }
      if ( self.matchValue(value : ")") || self.isAtEnd() ) {
        break;
      }
      let paramTok : Token = self.expect(expectedType : "Identifier")
      let param : JSNode = JSNode()
      param.type = "Identifier";
      param.name = paramTok.value;
      param.start = paramTok.start;
      param.line = paramTok.line;
      param.col = paramTok.col;
      _func.children.append(param)
    }
    _ = self.expectValue(expectedValue : ")")
    let body : JSNode = self.parseBlock()
    _func.body = body;
    return _func;
  }
  func parseClass() -> JSNode {
    let classNode : JSNode = JSNode()
    classNode.type = "ClassDeclaration";
    let startTok : Token = self.peek()
    classNode.start = startTok.start;
    classNode.line = startTok.line;
    classNode.col = startTok.col;
    _ = self.expectValue(expectedValue : "class")
    let idTok : Token = self.expect(expectedType : "Identifier")
    classNode.name = idTok.value;
    if ( self.matchValue(value : "extends") ) {
      self.advance()
      let superTok : Token = self.expect(expectedType : "Identifier")
      let superClassNode : JSNode = JSNode()
      superClassNode.type = "Identifier";
      superClassNode.name = superTok.value;
      superClassNode.start = superTok.start;
      superClassNode.line = superTok.line;
      superClassNode.col = superTok.col;
      classNode.superClass = superClassNode;
    }
    let body : JSNode = JSNode()
    body.type = "ClassBody";
    let bodyStart : Token = self.peek()
    body.start = bodyStart.start;
    body.line = bodyStart.line;
    body.col = bodyStart.col;
    _ = self.expectValue(expectedValue : "{")
    while ((self.matchValue(value : "}") == false) && (self.isAtEnd() == false)) {
      let method : JSNode = self.parseClassMethod()
      body.children.append(method)
    }
    _ = self.expectValue(expectedValue : "}")
    classNode.body = body;
    return classNode;
  }
  func parseClassMethod() -> JSNode {
    let method : JSNode = JSNode()
    method.type = "MethodDefinition";
    let startTok : Token = self.peek()
    method.start = startTok.start;
    method.line = startTok.line;
    method.col = startTok.col;
    var isStatic : Bool = false
    if ( self.matchValue(value : "static") ) {
      isStatic = true;
      method._static = true;
      self.advance()
    }
    var methodKind : String = "method"
    if ( self.matchValue(value : "get") ) {
      let nextTok : String = self.peekAt(offset : 1)
      if ( nextTok != "(" ) {
        methodKind = "get";
        self.advance()
      }
    }
    if ( self.matchValue(value : "set") ) {
      let nextTok_1 : String = self.peekAt(offset : 1)
      if ( nextTok_1 != "(" ) {
        methodKind = "set";
        self.advance()
      }
    }
    let nameTok : Token = self.expect(expectedType : "Identifier")
    let keyNode : JSNode = JSNode()
    keyNode.type = "Identifier";
    keyNode.name = nameTok.value;
    keyNode.start = nameTok.start;
    keyNode.line = nameTok.line;
    keyNode.col = nameTok.col;
    method.key = keyNode;
    if ( nameTok.value == "constructor" ) {
      methodKind = "constructor";
    }
    method.kind = methodKind;
    let _func : JSNode = JSNode()
    _func.type = "FunctionExpression";
    _func.start = nameTok.start;
    _func.line = nameTok.line;
    _func.col = nameTok.col;
    _ = self.expectValue(expectedValue : "(")
    while ((self.matchValue(value : ")") == false) && (self.isAtEnd() == false)) {
      if ( (_func.children.count) > 0 ) {
        _ = self.expectValue(expectedValue : ",")
      }
      if ( self.matchValue(value : ")") || self.isAtEnd() ) {
        break;
      }
      let paramTok : Token = self.expect(expectedType : "Identifier")
      let param : JSNode = JSNode()
      param.type = "Identifier";
      param.name = paramTok.value;
      param.start = paramTok.start;
      param.line = paramTok.line;
      param.col = paramTok.col;
      _func.children.append(param)
    }
    _ = self.expectValue(expectedValue : ")")
    let funcBody : JSNode = self.parseBlock()
    _func.body = funcBody;
    method.body = _func;
    return method;
  }
  func peekAt(offset : Int) -> String {
    let targetPos : Int = self.pos + offset
    if ( targetPos >= (self.tokens.count) ) {
      return "";
    }
    let tok : Token = self.tokens[targetPos]
    return tok.value;
  }
  func parseImport() -> JSNode {
    let importNode : JSNode = JSNode()
    importNode.type = "ImportDeclaration";
    let startTok : Token = self.peek()
    importNode.start = startTok.start;
    importNode.line = startTok.line;
    importNode.col = startTok.col;
    _ = self.expectValue(expectedValue : "import")
    if ( self.matchType(tokenType : "String") ) {
      let sourceTok : Token = self.peek()
      self.advance()
      let source_1 : JSNode = JSNode()
      source_1.type = "Literal";
      source_1.raw = sourceTok.value;
      source_1.start = sourceTok.start;
      source_1.line = sourceTok.line;
      source_1.col = sourceTok.col;
      importNode.right = source_1;
      if ( self.matchValue(value : ";") ) {
        self.advance()
      }
      return importNode;
    }
    if ( self.matchValue(value : "*") ) {
      self.advance()
      _ = self.expectValue(expectedValue : "as")
      let localTok : Token = self.expect(expectedType : "Identifier")
      let specifier : JSNode = JSNode()
      specifier.type = "ImportNamespaceSpecifier";
      specifier.name = localTok.value;
      specifier.start = localTok.start;
      specifier.line = localTok.line;
      specifier.col = localTok.col;
      importNode.children.append(specifier)
      _ = self.expectValue(expectedValue : "from")
      let sourceTok_1 : Token = self.expect(expectedType : "String")
      let source_2 : JSNode = JSNode()
      source_2.type = "Literal";
      source_2.raw = sourceTok_1.value;
      source_2.start = sourceTok_1.start;
      source_2.line = sourceTok_1.line;
      source_2.col = sourceTok_1.col;
      importNode.right = source_2;
      if ( self.matchValue(value : ";") ) {
        self.advance()
      }
      return importNode;
    }
    if ( self.matchType(tokenType : "Identifier") ) {
      let defaultTok : Token = self.expect(expectedType : "Identifier")
      let defaultSpec : JSNode = JSNode()
      defaultSpec.type = "ImportDefaultSpecifier";
      let localNode : JSNode = JSNode()
      localNode.type = "Identifier";
      localNode.name = defaultTok.value;
      localNode.start = defaultTok.start;
      localNode.line = defaultTok.line;
      localNode.col = defaultTok.col;
      defaultSpec.local = localNode;
      defaultSpec.start = defaultTok.start;
      defaultSpec.line = defaultTok.line;
      defaultSpec.col = defaultTok.col;
      importNode.children.append(defaultSpec)
      if ( self.matchValue(value : ",") ) {
        self.advance()
        if ( self.matchValue(value : "*") ) {
          self.advance()
          _ = self.expectValue(expectedValue : "as")
          let localTok2 : Token = self.expect(expectedType : "Identifier")
          let nsSpec : JSNode = JSNode()
          nsSpec.type = "ImportNamespaceSpecifier";
          let nsLocal : JSNode = JSNode()
          nsLocal.type = "Identifier";
          nsLocal.name = localTok2.value;
          nsLocal.start = localTok2.start;
          nsLocal.line = localTok2.line;
          nsLocal.col = localTok2.col;
          nsSpec.local = nsLocal;
          nsSpec.start = localTok2.start;
          nsSpec.line = localTok2.line;
          nsSpec.col = localTok2.col;
          importNode.children.append(nsSpec)
        } else {
          self.parseImportSpecifiers(importNode : importNode)
        }
      }
      _ = self.expectValue(expectedValue : "from")
    } else {
      if ( self.matchValue(value : "{") ) {
        self.parseImportSpecifiers(importNode : importNode)
        _ = self.expectValue(expectedValue : "from")
      }
    }
    let sourceTok_2 : Token = self.expect(expectedType : "String")
    let source_3 : JSNode = JSNode()
    source_3.type = "Literal";
    source_3.raw = sourceTok_2.value;
    source_3.start = sourceTok_2.start;
    source_3.line = sourceTok_2.line;
    source_3.col = sourceTok_2.col;
    importNode.right = source_3;
    if ( self.matchValue(value : ";") ) {
      self.advance()
    }
    return importNode;
  }
  func parseImportSpecifiers(importNode : JSNode) -> Void {
    _ = self.expectValue(expectedValue : "{")
    while ((self.matchValue(value : "}") == false) && (self.isAtEnd() == false)) {
      if ( (importNode.children.count) > 0 ) {
        if ( self.matchValue(value : ",") ) {
          self.advance()
        }
      }
      if ( self.matchValue(value : "}") || self.isAtEnd() ) {
        break;
      }
      let specifier : JSNode = JSNode()
      specifier.type = "ImportSpecifier";
      let importedTok : Token = self.expect(expectedType : "Identifier")
      let importedNode : JSNode = JSNode()
      importedNode.type = "Identifier";
      importedNode.name = importedTok.value;
      importedNode.start = importedTok.start;
      importedNode.line = importedTok.line;
      importedNode.col = importedTok.col;
      specifier.imported = importedNode;
      specifier.start = importedTok.start;
      specifier.line = importedTok.line;
      specifier.col = importedTok.col;
      if ( self.matchValue(value : "as") ) {
        self.advance()
        let localTok : Token = self.expect(expectedType : "Identifier")
        let localNode : JSNode = JSNode()
        localNode.type = "Identifier";
        localNode.name = localTok.value;
        localNode.start = localTok.start;
        localNode.line = localTok.line;
        localNode.col = localTok.col;
        specifier.local = localNode;
      } else {
        specifier.local = importedNode;
      }
      importNode.children.append(specifier)
    }
    _ = self.expectValue(expectedValue : "}")
  }
  func parseExport() -> JSNode {
    let exportNode : JSNode = JSNode()
    exportNode.type = "ExportNamedDeclaration";
    let startTok : Token = self.peek()
    exportNode.start = startTok.start;
    exportNode.line = startTok.line;
    exportNode.col = startTok.col;
    _ = self.expectValue(expectedValue : "export")
    if ( self.matchValue(value : "default") ) {
      exportNode.type = "ExportDefaultDeclaration";
      self.advance()
      if ( self.matchValue(value : "function") ) {
        let _func : JSNode = self.parseFuncDecl()
        exportNode.left = _func;
      } else {
        if ( self.matchValue(value : "async") ) {
          let func_1 : JSNode = self.parseAsyncFuncDecl()
          exportNode.left = func_1;
        } else {
          if ( self.matchValue(value : "class") ) {
            let cls : JSNode = self.parseClass()
            exportNode.left = cls;
          } else {
            let expr : JSNode = self.parseAssignment()
            exportNode.left = expr;
            if ( self.matchValue(value : ";") ) {
              self.advance()
            }
          }
        }
      }
      return exportNode;
    }
    if ( self.matchValue(value : "*") ) {
      exportNode.type = "ExportAllDeclaration";
      self.advance()
      if ( self.matchValue(value : "as") ) {
        self.advance()
        let exportedTok : Token = self.expect(expectedType : "Identifier")
        exportNode.name = exportedTok.value;
      }
      _ = self.expectValue(expectedValue : "from")
      let sourceTok : Token = self.expect(expectedType : "String")
      let source_1 : JSNode = JSNode()
      source_1.type = "Literal";
      source_1.raw = sourceTok.value;
      source_1.start = sourceTok.start;
      source_1.line = sourceTok.line;
      source_1.col = sourceTok.col;
      exportNode.right = source_1;
      if ( self.matchValue(value : ";") ) {
        self.advance()
      }
      return exportNode;
    }
    if ( self.matchValue(value : "{") ) {
      self.parseExportSpecifiers(exportNode : exportNode)
      if ( self.matchValue(value : "from") ) {
        self.advance()
        let sourceTok_1 : Token = self.expect(expectedType : "String")
        let source_2 : JSNode = JSNode()
        source_2.type = "Literal";
        source_2.raw = sourceTok_1.value;
        source_2.start = sourceTok_1.start;
        source_2.line = sourceTok_1.line;
        source_2.col = sourceTok_1.col;
        exportNode.right = source_2;
      }
      if ( self.matchValue(value : ";") ) {
        self.advance()
      }
      return exportNode;
    }
    if ( self.matchValue(value : "const") ) {
      let decl : JSNode = self.parseConstDecl()
      exportNode.left = decl;
      return exportNode;
    }
    if ( self.matchValue(value : "let") ) {
      let decl_1 : JSNode = self.parseLetDecl()
      exportNode.left = decl_1;
      return exportNode;
    }
    if ( self.matchValue(value : "var") ) {
      let decl_2 : JSNode = self.parseVarDecl()
      exportNode.left = decl_2;
      return exportNode;
    }
    if ( self.matchValue(value : "function") ) {
      let func_2 : JSNode = self.parseFuncDecl()
      exportNode.left = func_2;
      return exportNode;
    }
    if ( self.matchValue(value : "async") ) {
      let func_3 : JSNode = self.parseAsyncFuncDecl()
      exportNode.left = func_3;
      return exportNode;
    }
    if ( self.matchValue(value : "class") ) {
      let cls_1 : JSNode = self.parseClass()
      exportNode.left = cls_1;
      return exportNode;
    }
    let expr_1 : JSNode = self.parseExprStmt()
    exportNode.left = expr_1;
    return exportNode;
  }
  func parseExportSpecifiers(exportNode : JSNode) -> Void {
    _ = self.expectValue(expectedValue : "{")
    while ((self.matchValue(value : "}") == false) && (self.isAtEnd() == false)) {
      let numChildren : Int = exportNode.children.count
      if ( numChildren > 0 ) {
        if ( self.matchValue(value : ",") ) {
          self.advance()
        }
      }
      if ( self.matchValue(value : "}") || self.isAtEnd() ) {
        break;
      }
      let specifier : JSNode = JSNode()
      specifier.type = "ExportSpecifier";
      let localTok : Token = self.peek()
      if ( self.matchType(tokenType : "Identifier") || self.matchValue(value : "default") ) {
        self.advance()
        let localNode : JSNode = JSNode()
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
        let err : String = (((("Parse error at line " + String(localTok.line)) + ":") + String(localTok.col)) + ": expected Identifier but got ") + localTok.tokenType
        self.addError(msg : err)
        self.advance()
      }
      if ( self.matchValue(value : "as") ) {
        self.advance()
        let exportedTok : Token = self.expect(expectedType : "Identifier")
        let exportedNode : JSNode = JSNode()
        exportedNode.type = "Identifier";
        exportedNode.name = exportedTok.value;
        exportedNode.start = exportedTok.start;
        exportedNode.line = exportedTok.line;
        exportedNode.col = exportedTok.col;
        specifier.exported = exportedNode;
      } else {
        specifier.exported = specifier.local;
      }
      exportNode.children.append(specifier)
    }
    _ = self.expectValue(expectedValue : "}")
  }
  func parseBlock() -> JSNode {
    let block : JSNode = JSNode()
    block.type = "BlockStatement";
    let startTok : Token = self.peek()
    block.start = startTok.start;
    block.line = startTok.line;
    block.col = startTok.col;
    _ = self.expectValue(expectedValue : "{")
    while ((self.matchValue(value : "}") == false) && (self.isAtEnd() == false)) {
      let stmt : JSNode = self.parseStatement()
      block.children.append(stmt)
    }
    _ = self.expectValue(expectedValue : "}")
    return block;
  }
  func parseReturn() -> JSNode {
    let ret : JSNode = JSNode()
    ret.type = "ReturnStatement";
    let startTok : Token = self.peek()
    ret.start = startTok.start;
    ret.line = startTok.line;
    ret.col = startTok.col;
    _ = self.expectValue(expectedValue : "return")
    if ( (self.matchValue(value : ";") == false) && (self.isAtEnd() == false) ) {
      let arg : JSNode = self.parseExpr()
      ret.left = arg;
    }
    if ( self.matchValue(value : ";") ) {
      self.advance()
    }
    return ret;
  }
  func parseIf() -> JSNode {
    let ifStmt : JSNode = JSNode()
    ifStmt.type = "IfStatement";
    let startTok : Token = self.peek()
    ifStmt.start = startTok.start;
    ifStmt.line = startTok.line;
    ifStmt.col = startTok.col;
    _ = self.expectValue(expectedValue : "if")
    _ = self.expectValue(expectedValue : "(")
    let test : JSNode = self.parseExpr()
    ifStmt.test = test;
    _ = self.expectValue(expectedValue : ")")
    let consequent : JSNode = self.parseStatement()
    ifStmt.body = consequent;
    if ( self.matchValue(value : "else") ) {
      self.advance()
      let alt : JSNode = self.parseStatement()
      ifStmt.alternate = alt;
    }
    return ifStmt;
  }
  func parseWhile() -> JSNode {
    let whileStmt : JSNode = JSNode()
    whileStmt.type = "WhileStatement";
    let startTok : Token = self.peek()
    whileStmt.start = startTok.start;
    whileStmt.line = startTok.line;
    whileStmt.col = startTok.col;
    _ = self.expectValue(expectedValue : "while")
    _ = self.expectValue(expectedValue : "(")
    let test : JSNode = self.parseExpr()
    whileStmt.test = test;
    _ = self.expectValue(expectedValue : ")")
    let body : JSNode = self.parseStatement()
    whileStmt.body = body;
    return whileStmt;
  }
  func parseDoWhile() -> JSNode {
    let doWhileStmt : JSNode = JSNode()
    doWhileStmt.type = "DoWhileStatement";
    let startTok : Token = self.peek()
    doWhileStmt.start = startTok.start;
    doWhileStmt.line = startTok.line;
    doWhileStmt.col = startTok.col;
    _ = self.expectValue(expectedValue : "do")
    let body : JSNode = self.parseStatement()
    doWhileStmt.body = body;
    _ = self.expectValue(expectedValue : "while")
    _ = self.expectValue(expectedValue : "(")
    let test : JSNode = self.parseExpr()
    doWhileStmt.test = test;
    _ = self.expectValue(expectedValue : ")")
    if ( self.matchValue(value : ";") ) {
      self.advance()
    }
    return doWhileStmt;
  }
  func parseFor() -> JSNode {
    let forStmt : JSNode = JSNode()
    let startTok : Token = self.peek()
    forStmt.start = startTok.start;
    forStmt.line = startTok.line;
    forStmt.col = startTok.col;
    _ = self.expectValue(expectedValue : "for")
    _ = self.expectValue(expectedValue : "(")
    var isForOf : Bool = false
    var isForIn : Bool = false
    var leftNode : JSNode?
    if ( self.matchValue(value : ";") == false ) {
      if ( (self.matchValue(value : "var") || self.matchValue(value : "let")) || self.matchValue(value : "const") ) {
        let keyword : String = self.peekValue()
        self.advance()
        let declarator : JSNode = JSNode()
        declarator.type = "VariableDeclarator";
        let declTok : Token = self.peek()
        declarator.start = declTok.start;
        declarator.line = declTok.line;
        declarator.col = declTok.col;
        if ( self.matchValue(value : "[") ) {
          let pattern : JSNode = self.parseArrayPattern()
          declarator.id = pattern;
        } else {
          if ( self.matchValue(value : "{") ) {
            let pattern_1 : JSNode = self.parseObjectPattern()
            declarator.id = pattern_1;
          } else {
            let idTok : Token = self.expect(expectedType : "Identifier")
            let id : JSNode = JSNode()
            id.type = "Identifier";
            id.name = idTok.value;
            id.start = idTok.start;
            id.line = idTok.line;
            id.col = idTok.col;
            declarator.id = id;
          }
        }
        if ( self.matchValue(value : "of") ) {
          isForOf = true;
          self.advance()
          let varDecl : JSNode = JSNode()
          varDecl.type = "VariableDeclaration";
          varDecl.kind = keyword;
          varDecl.start = declTok.start;
          varDecl.line = declTok.line;
          varDecl.col = declTok.col;
          varDecl.children.append(declarator)
          leftNode = varDecl;
        } else {
          if ( self.matchValue(value : "in") ) {
            isForIn = true;
            self.advance()
            let varDecl_1 : JSNode = JSNode()
            varDecl_1.type = "VariableDeclaration";
            varDecl_1.kind = keyword;
            varDecl_1.start = declTok.start;
            varDecl_1.line = declTok.line;
            varDecl_1.col = declTok.col;
            varDecl_1.children.append(declarator)
            leftNode = varDecl_1;
          } else {
            if ( self.matchValue(value : "=") ) {
              self.advance()
              let initVal : JSNode = self.parseAssignment()
              declarator._init = initVal;
            }
            let varDecl_2 : JSNode = JSNode()
            varDecl_2.type = "VariableDeclaration";
            varDecl_2.kind = keyword;
            varDecl_2.start = declTok.start;
            varDecl_2.line = declTok.line;
            varDecl_2.col = declTok.col;
            varDecl_2.children.append(declarator)
            leftNode = varDecl_2;
            if ( self.matchValue(value : ";") ) {
              self.advance()
            }
          }
        }
      } else {
        let initExpr : JSNode = self.parseExpr()
        if ( self.matchValue(value : "of") ) {
          isForOf = true;
          self.advance()
          leftNode = initExpr;
        } else {
          if ( self.matchValue(value : "in") ) {
            isForIn = true;
            self.advance()
            leftNode = initExpr;
          } else {
            leftNode = initExpr;
            if ( self.matchValue(value : ";") ) {
              self.advance()
            }
          }
        }
      }
    } else {
      self.advance()
    }
    if ( isForOf ) {
      forStmt.type = "ForOfStatement";
      forStmt.left = leftNode!;
      let rightExpr : JSNode = self.parseExpr()
      forStmt.right = rightExpr;
      _ = self.expectValue(expectedValue : ")")
      let body : JSNode = self.parseStatement()
      forStmt.body = body;
      return forStmt;
    }
    if ( isForIn ) {
      forStmt.type = "ForInStatement";
      forStmt.left = leftNode!;
      let rightExpr_1 : JSNode = self.parseExpr()
      forStmt.right = rightExpr_1;
      _ = self.expectValue(expectedValue : ")")
      let body_1 : JSNode = self.parseStatement()
      forStmt.body = body_1;
      return forStmt;
    }
    forStmt.type = "ForStatement";
    if ( leftNode != nil  ) {
      forStmt.left = leftNode!;
    }
    if ( self.matchValue(value : ";") == false ) {
      let test : JSNode = self.parseExpr()
      forStmt.test = test;
    }
    if ( self.matchValue(value : ";") ) {
      self.advance()
    }
    if ( self.matchValue(value : ")") == false ) {
      let update : JSNode = self.parseExpr()
      forStmt.right = update;
    }
    _ = self.expectValue(expectedValue : ")")
    let body_2 : JSNode = self.parseStatement()
    forStmt.body = body_2;
    return forStmt;
  }
  func parseSwitch() -> JSNode {
    let switchStmt : JSNode = JSNode()
    switchStmt.type = "SwitchStatement";
    let startTok : Token = self.peek()
    switchStmt.start = startTok.start;
    switchStmt.line = startTok.line;
    switchStmt.col = startTok.col;
    _ = self.expectValue(expectedValue : "switch")
    _ = self.expectValue(expectedValue : "(")
    let discriminant : JSNode = self.parseExpr()
    switchStmt.test = discriminant;
    _ = self.expectValue(expectedValue : ")")
    _ = self.expectValue(expectedValue : "{")
    while ((self.matchValue(value : "}") == false) && (self.isAtEnd() == false)) {
      let caseNode : JSNode = JSNode()
      if ( self.matchValue(value : "case") ) {
        caseNode.type = "SwitchCase";
        let caseTok : Token = self.peek()
        caseNode.start = caseTok.start;
        caseNode.line = caseTok.line;
        caseNode.col = caseTok.col;
        self.advance()
        let testExpr : JSNode = self.parseExpr()
        caseNode.test = testExpr;
        _ = self.expectValue(expectedValue : ":")
        while ((((self.matchValue(value : "case") == false) && (self.matchValue(value : "default") == false)) && (self.matchValue(value : "}") == false)) && (self.isAtEnd() == false)) {
          let stmt : JSNode = self.parseStatement()
          caseNode.children.append(stmt)
        }
        switchStmt.children.append(caseNode)
      } else {
        if ( self.matchValue(value : "default") ) {
          caseNode.type = "SwitchCase";
          caseNode.name = "default";
          let defTok : Token = self.peek()
          caseNode.start = defTok.start;
          caseNode.line = defTok.line;
          caseNode.col = defTok.col;
          self.advance()
          _ = self.expectValue(expectedValue : ":")
          while (((self.matchValue(value : "case") == false) && (self.matchValue(value : "}") == false)) && (self.isAtEnd() == false)) {
            let stmt_1 : JSNode = self.parseStatement()
            caseNode.children.append(stmt_1)
          }
          switchStmt.children.append(caseNode)
        } else {
          self.advance()
        }
      }
    }
    _ = self.expectValue(expectedValue : "}")
    return switchStmt;
  }
  func parseTry() -> JSNode {
    let tryStmt : JSNode = JSNode()
    tryStmt.type = "TryStatement";
    let startTok : Token = self.peek()
    tryStmt.start = startTok.start;
    tryStmt.line = startTok.line;
    tryStmt.col = startTok.col;
    _ = self.expectValue(expectedValue : "try")
    let block : JSNode = self.parseBlock()
    tryStmt.body = block;
    if ( self.matchValue(value : "catch") ) {
      let catchNode : JSNode = JSNode()
      catchNode.type = "CatchClause";
      let catchTok : Token = self.peek()
      catchNode.start = catchTok.start;
      catchNode.line = catchTok.line;
      catchNode.col = catchTok.col;
      self.advance()
      _ = self.expectValue(expectedValue : "(")
      let paramTok : Token = self.expect(expectedType : "Identifier")
      catchNode.name = paramTok.value;
      _ = self.expectValue(expectedValue : ")")
      let catchBody : JSNode = self.parseBlock()
      catchNode.body = catchBody;
      tryStmt.left = catchNode;
    }
    if ( self.matchValue(value : "finally") ) {
      self.advance()
      let finallyBlock : JSNode = self.parseBlock()
      tryStmt.right = finallyBlock;
    }
    return tryStmt;
  }
  func parseThrow() -> JSNode {
    let throwStmt : JSNode = JSNode()
    throwStmt.type = "ThrowStatement";
    let startTok : Token = self.peek()
    throwStmt.start = startTok.start;
    throwStmt.line = startTok.line;
    throwStmt.col = startTok.col;
    _ = self.expectValue(expectedValue : "throw")
    let arg : JSNode = self.parseExpr()
    throwStmt.left = arg;
    if ( self.matchValue(value : ";") ) {
      self.advance()
    }
    return throwStmt;
  }
  func parseBreak() -> JSNode {
    let breakStmt : JSNode = JSNode()
    breakStmt.type = "BreakStatement";
    let startTok : Token = self.peek()
    breakStmt.start = startTok.start;
    breakStmt.line = startTok.line;
    breakStmt.col = startTok.col;
    _ = self.expectValue(expectedValue : "break")
    if ( self.matchType(tokenType : "Identifier") ) {
      let labelTok : Token = self.peek()
      breakStmt.name = labelTok.value;
      self.advance()
    }
    if ( self.matchValue(value : ";") ) {
      self.advance()
    }
    return breakStmt;
  }
  func parseContinue() -> JSNode {
    let contStmt : JSNode = JSNode()
    contStmt.type = "ContinueStatement";
    let startTok : Token = self.peek()
    contStmt.start = startTok.start;
    contStmt.line = startTok.line;
    contStmt.col = startTok.col;
    _ = self.expectValue(expectedValue : "continue")
    if ( self.matchType(tokenType : "Identifier") ) {
      let labelTok : Token = self.peek()
      contStmt.name = labelTok.value;
      self.advance()
    }
    if ( self.matchValue(value : ";") ) {
      self.advance()
    }
    return contStmt;
  }
  func parseExprStmt() -> JSNode {
    let stmt : JSNode = JSNode()
    stmt.type = "ExpressionStatement";
    let startTok : Token = self.peek()
    stmt.start = startTok.start;
    stmt.line = startTok.line;
    stmt.col = startTok.col;
    let expr : JSNode = self.parseExpr()
    stmt.left = expr;
    if ( self.matchValue(value : ";") ) {
      self.advance()
    }
    return stmt;
  }
  func parseExpr() -> JSNode {
    return self.parseAssignment();
  }
  func parseAssignment() -> JSNode {
    let left : JSNode = self.parseTernary()
    let tokVal : String = self.peekValue()
    if ( (((((((((((((((tokVal == "=") || (tokVal == "+=")) || (tokVal == "-=")) || (tokVal == "*=")) || (tokVal == "/=")) || (tokVal == "%=")) || (tokVal == "**=")) || (tokVal == "<<=")) || (tokVal == ">>=")) || (tokVal == ">>>=")) || (tokVal == "&=")) || (tokVal == "^=")) || (tokVal == "|=")) || (tokVal == "&&=")) || (tokVal == "||=")) || (tokVal == "??=") ) {
      let opTok : Token = self.peek()
      self.advance()
      let right : JSNode = self.parseAssignment()
      let assign : JSNode = JSNode()
      assign.type = "AssignmentExpression";
      assign._operator = opTok.value;
      assign.left = left;
      assign.right = right;
      assign.start = left.start;
      assign.line = left.line;
      assign.col = left.col;
      return assign;
    }
    return left;
  }
  func parseTernary() -> JSNode {
    let condition : JSNode = self.parseLogicalOr()
    if ( self.matchValue(value : "?") ) {
      self.advance()
      let consequent : JSNode = self.parseAssignment()
      _ = self.expectValue(expectedValue : ":")
      let alternate : JSNode = self.parseAssignment()
      let ternary : JSNode = JSNode()
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
  func parseLogicalOr() -> JSNode {
    var left : JSNode = self.parseNullishCoalescing()
    while (self.matchValue(value : "||")) {
      let opTok : Token = self.peek()
      self.advance()
      let right : JSNode = self.parseNullishCoalescing()
      let binary : JSNode = JSNode()
      binary.type = "LogicalExpression";
      binary._operator = opTok.value;
      binary.left = left;
      binary.right = right;
      binary.start = left.start;
      binary.line = left.line;
      binary.col = left.col;
      left = binary;
    }
    return left;
  }
  func parseNullishCoalescing() -> JSNode {
    var left : JSNode = self.parseLogicalAnd()
    while (self.matchValue(value : "??")) {
      let opTok : Token = self.peek()
      self.advance()
      let right : JSNode = self.parseLogicalAnd()
      let binary : JSNode = JSNode()
      binary.type = "LogicalExpression";
      binary._operator = opTok.value;
      binary.left = left;
      binary.right = right;
      binary.start = left.start;
      binary.line = left.line;
      binary.col = left.col;
      left = binary;
    }
    return left;
  }
  func parseLogicalAnd() -> JSNode {
    var left : JSNode = self.parseEquality()
    while (self.matchValue(value : "&&")) {
      let opTok : Token = self.peek()
      self.advance()
      let right : JSNode = self.parseEquality()
      let binary : JSNode = JSNode()
      binary.type = "LogicalExpression";
      binary._operator = opTok.value;
      binary.left = left;
      binary.right = right;
      binary.start = left.start;
      binary.line = left.line;
      binary.col = left.col;
      left = binary;
    }
    return left;
  }
  func parseEquality() -> JSNode {
    var left : JSNode = self.parseComparison()
    var tokVal : String = self.peekValue()
    while ((((tokVal == "==") || (tokVal == "!=")) || (tokVal == "===")) || (tokVal == "!==")) {
      let opTok : Token = self.peek()
      self.advance()
      let right : JSNode = self.parseComparison()
      let binary : JSNode = JSNode()
      binary.type = "BinaryExpression";
      binary._operator = opTok.value;
      binary.left = left;
      binary.right = right;
      binary.start = left.start;
      binary.line = left.line;
      binary.col = left.col;
      left = binary;
      tokVal = self.peekValue();
    }
    return left;
  }
  func parseComparison() -> JSNode {
    var left : JSNode = self.parseAdditive()
    var tokVal : String = self.peekValue()
    while ((((tokVal == "<") || (tokVal == ">")) || (tokVal == "<=")) || (tokVal == ">=")) {
      let opTok : Token = self.peek()
      self.advance()
      let right : JSNode = self.parseAdditive()
      let binary : JSNode = JSNode()
      binary.type = "BinaryExpression";
      binary._operator = opTok.value;
      binary.left = left;
      binary.right = right;
      binary.start = left.start;
      binary.line = left.line;
      binary.col = left.col;
      left = binary;
      tokVal = self.peekValue();
    }
    return left;
  }
  func parseAdditive() -> JSNode {
    var left : JSNode = self.parseMultiplicative()
    var tokVal : String = self.peekValue()
    while ((tokVal == "+") || (tokVal == "-")) {
      let opTok : Token = self.peek()
      self.advance()
      let right : JSNode = self.parseMultiplicative()
      let binary : JSNode = JSNode()
      binary.type = "BinaryExpression";
      binary._operator = opTok.value;
      binary.left = left;
      binary.right = right;
      binary.start = left.start;
      binary.line = left.line;
      binary.col = left.col;
      left = binary;
      tokVal = self.peekValue();
    }
    return left;
  }
  func parseMultiplicative() -> JSNode {
    var left : JSNode = self.parseUnary()
    var tokVal : String = self.peekValue()
    while (((tokVal == "*") || (tokVal == "/")) || (tokVal == "%")) {
      let opTok : Token = self.peek()
      self.advance()
      let right : JSNode = self.parseUnary()
      let binary : JSNode = JSNode()
      binary.type = "BinaryExpression";
      binary._operator = opTok.value;
      binary.left = left;
      binary.right = right;
      binary.start = left.start;
      binary.line = left.line;
      binary.col = left.col;
      left = binary;
      tokVal = self.peekValue();
    }
    return left;
  }
  func parseUnary() -> JSNode {
    let tokType : String = self.peekType()
    let tokVal : String = self.peekValue()
    if ( tokType == "Punctuator" ) {
      if ( ((tokVal == "!") || (tokVal == "-")) || (tokVal == "+") ) {
        let opTok : Token = self.peek()
        self.advance()
        let arg : JSNode = self.parseUnary()
        let unary : JSNode = JSNode()
        unary.type = "UnaryExpression";
        unary._operator = opTok.value;
        unary.left = arg;
        unary.start = opTok.start;
        unary.line = opTok.line;
        unary.col = opTok.col;
        return unary;
      }
    }
    if ( (tokType == "Keyword") && (tokVal == "typeof") ) {
      let opTok_1 : Token = self.peek()
      self.advance()
      let arg_1 : JSNode = self.parseUnary()
      let unary_1 : JSNode = JSNode()
      unary_1.type = "UnaryExpression";
      unary_1._operator = opTok_1.value;
      unary_1.left = arg_1;
      unary_1.start = opTok_1.start;
      unary_1.line = opTok_1.line;
      unary_1.col = opTok_1.col;
      return unary_1;
    }
    if ( (tokType == "Punctuator") && ((tokVal == "++") || (tokVal == "--")) ) {
      let opTok_2 : Token = self.peek()
      self.advance()
      let arg_2 : JSNode = self.parseUnary()
      let update : JSNode = JSNode()
      update.type = "UpdateExpression";
      update._operator = opTok_2.value;
      update.prefix = true;
      update.left = arg_2;
      update.start = opTok_2.start;
      update.line = opTok_2.line;
      update.col = opTok_2.col;
      return update;
    }
    if ( tokVal == "yield" ) {
      let yieldTok : Token = self.peek()
      self.advance()
      let yieldExpr : JSNode = JSNode()
      yieldExpr.type = "YieldExpression";
      yieldExpr.start = yieldTok.start;
      yieldExpr.line = yieldTok.line;
      yieldExpr.col = yieldTok.col;
      if ( self.matchValue(value : "*") ) {
        yieldExpr.delegate = true;
        self.advance()
      }
      let nextVal : String = self.peekValue()
      if ( (((nextVal != ";") && (nextVal != "}")) && (nextVal != ",")) && (nextVal != ")") ) {
        let arg_3 : JSNode = self.parseAssignment()
        yieldExpr.left = arg_3;
      }
      return yieldExpr;
    }
    if ( tokVal == "await" ) {
      let awaitTok : Token = self.peek()
      self.advance()
      let arg_4 : JSNode = self.parseUnary()
      let awaitExpr : JSNode = JSNode()
      awaitExpr.type = "AwaitExpression";
      awaitExpr.left = arg_4;
      awaitExpr.start = awaitTok.start;
      awaitExpr.line = awaitTok.line;
      awaitExpr.col = awaitTok.col;
      return awaitExpr;
    }
    return self.parseCallMember();
  }
  func parseCallMember() -> JSNode {
    if ( self.matchValue(value : "new") ) {
      return self.parseNewExpression();
    }
    var object : JSNode = self.parsePrimary()
    var cont : Bool = true
    while (cont) {
      let tokVal : String = self.peekValue()
      if ( (tokVal == "++") || (tokVal == "--") ) {
        let opTok : Token = self.peek()
        self.advance()
        let update : JSNode = JSNode()
        update.type = "UpdateExpression";
        update._operator = opTok.value;
        update.prefix = false;
        update.left = object;
        update.start = object.start;
        update.line = object.line;
        update.col = object.col;
        object = update;
      } else {
        if ( tokVal == "?." ) {
          self.advance()
          let nextTokVal : String = self.peekValue()
          if ( nextTokVal == "(" ) {
            self.advance()
            let call : JSNode = JSNode()
            call.type = "OptionalCallExpression";
            call.left = object;
            call.start = object.start;
            call.line = object.line;
            call.col = object.col;
            while ((self.matchValue(value : ")") == false) && (self.isAtEnd() == false)) {
              if ( (call.children.count) > 0 ) {
                _ = self.expectValue(expectedValue : ",")
              }
              if ( self.matchValue(value : ")") || self.isAtEnd() ) {
                break;
              }
              let arg : JSNode = self.parseAssignment()
              call.children.append(arg)
            }
            _ = self.expectValue(expectedValue : ")")
            object = call;
          } else {
            if ( nextTokVal == "[" ) {
              self.advance()
              let propExpr : JSNode = self.parseExpr()
              _ = self.expectValue(expectedValue : "]")
              let member : JSNode = JSNode()
              member.type = "OptionalMemberExpression";
              member.left = object;
              member.right = propExpr;
              member.computed = true;
              member.start = object.start;
              member.line = object.line;
              member.col = object.col;
              object = member;
            } else {
              let propTok : Token = self.expect(expectedType : "Identifier")
              let member_1 : JSNode = JSNode()
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
          if ( tokVal == "." ) {
            self.advance()
            let propTok_1 : Token = self.expect(expectedType : "Identifier")
            let member_2 : JSNode = JSNode()
            member_2.type = "MemberExpression";
            member_2.left = object;
            member_2.name = propTok_1.value;
            member_2.computed = false;
            member_2.start = object.start;
            member_2.line = object.line;
            member_2.col = object.col;
            object = member_2;
          } else {
            if ( tokVal == "[" ) {
              self.advance()
              let propExpr_1 : JSNode = self.parseExpr()
              _ = self.expectValue(expectedValue : "]")
              let member_3 : JSNode = JSNode()
              member_3.type = "MemberExpression";
              member_3.left = object;
              member_3.right = propExpr_1;
              member_3.computed = true;
              member_3.start = object.start;
              member_3.line = object.line;
              member_3.col = object.col;
              object = member_3;
            } else {
              if ( tokVal == "(" ) {
                self.advance()
                let call_1 : JSNode = JSNode()
                call_1.type = "CallExpression";
                call_1.left = object;
                call_1.start = object.start;
                call_1.line = object.line;
                call_1.col = object.col;
                while ((self.matchValue(value : ")") == false) && (self.isAtEnd() == false)) {
                  if ( (call_1.children.count) > 0 ) {
                    _ = self.expectValue(expectedValue : ",")
                  }
                  if ( self.matchValue(value : ")") || self.isAtEnd() ) {
                    break;
                  }
                  if ( self.matchValue(value : "...") ) {
                    let spreadTok : Token = self.peek()
                    self.advance()
                    let spreadArg : JSNode = self.parseAssignment()
                    let spread : JSNode = JSNode()
                    spread.type = "SpreadElement";
                    spread.left = spreadArg;
                    spread.start = spreadTok.start;
                    spread.line = spreadTok.line;
                    spread.col = spreadTok.col;
                    call_1.children.append(spread)
                  } else {
                    let arg_1 : JSNode = self.parseAssignment()
                    call_1.children.append(arg_1)
                  }
                }
                _ = self.expectValue(expectedValue : ")")
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
  func parseNewExpression() -> JSNode {
    let newExpr : JSNode = JSNode()
    newExpr.type = "NewExpression";
    let startTok : Token = self.peek()
    newExpr.start = startTok.start;
    newExpr.line = startTok.line;
    newExpr.col = startTok.col;
    _ = self.expectValue(expectedValue : "new")
    var callee : JSNode = self.parsePrimary()
    var cont : Bool = true
    while (cont) {
      let tokVal : String = self.peekValue()
      if ( tokVal == "." ) {
        self.advance()
        let propTok : Token = self.expect(expectedType : "Identifier")
        let member : JSNode = JSNode()
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
    if ( self.matchValue(value : "(") ) {
      self.advance()
      while ((self.matchValue(value : ")") == false) && (self.isAtEnd() == false)) {
        if ( (newExpr.children.count) > 0 ) {
          _ = self.expectValue(expectedValue : ",")
        }
        if ( self.matchValue(value : ")") || self.isAtEnd() ) {
          break;
        }
        let arg : JSNode = self.parseAssignment()
        newExpr.children.append(arg)
      }
      _ = self.expectValue(expectedValue : ")")
    }
    return newExpr;
  }
  func parsePrimary() -> JSNode {
    let tokType : String = self.peekType()
    let tokVal : String = self.peekValue()
    let tok : Token = self.peek()
    if ( tokVal == "async" ) {
      let nextVal : String = self.peekAt(offset : 1)
      let nextNext : String = self.peekAt(offset : 2)
      if ( (nextVal == "(") || (nextNext == "=>") ) {
        return self.parseAsyncArrowFunction();
      }
    }
    if ( tokType == "Identifier" ) {
      let nextVal_1 : String = self.peekAt(offset : 1)
      if ( nextVal_1 == "=>" ) {
        return self.parseArrowFunction();
      }
      self.advance()
      let id : JSNode = JSNode()
      id.type = "Identifier";
      id.name = tok.value;
      id.start = tok.start;
      id.end = tok.end;
      id.line = tok.line;
      id.col = tok.col;
      return id;
    }
    if ( tokType == "Number" ) {
      self.advance()
      let lit : JSNode = JSNode()
      lit.type = "Literal";
      lit.raw = tok.value;
      lit.start = tok.start;
      lit.end = tok.end;
      lit.line = tok.line;
      lit.col = tok.col;
      return lit;
    }
    if ( tokType == "String" ) {
      self.advance()
      let lit_1 : JSNode = JSNode()
      lit_1.type = "Literal";
      lit_1.raw = tok.value;
      lit_1.kind = "string";
      lit_1.start = tok.start;
      lit_1.end = tok.end;
      lit_1.line = tok.line;
      lit_1.col = tok.col;
      return lit_1;
    }
    if ( (tokVal == "true") || (tokVal == "false") ) {
      self.advance()
      let lit_2 : JSNode = JSNode()
      lit_2.type = "Literal";
      lit_2.raw = tok.value;
      lit_2.start = tok.start;
      lit_2.end = tok.end;
      lit_2.line = tok.line;
      lit_2.col = tok.col;
      return lit_2;
    }
    if ( tokVal == "null" ) {
      self.advance()
      let lit_3 : JSNode = JSNode()
      lit_3.type = "Literal";
      lit_3.raw = "null";
      lit_3.start = tok.start;
      lit_3.end = tok.end;
      lit_3.line = tok.line;
      lit_3.col = tok.col;
      return lit_3;
    }
    if ( tokType == "TemplateLiteral" ) {
      self.advance()
      let tmpl : JSNode = JSNode()
      tmpl.type = "TemplateLiteral";
      tmpl.raw = tok.value;
      tmpl.start = tok.start;
      tmpl.end = tok.end;
      tmpl.line = tok.line;
      tmpl.col = tok.col;
      return tmpl;
    }
    if ( tokVal == "(" ) {
      if ( self.isArrowFunction() ) {
        return self.parseArrowFunction();
      }
      self.advance()
      let expr : JSNode = self.parseExpr()
      _ = self.expectValue(expectedValue : ")")
      return expr;
    }
    if ( tokVal == "[" ) {
      return self.parseArray();
    }
    if ( tokVal == "{" ) {
      return self.parseObject();
    }
    if ( tokVal == "/" ) {
      return self.parseRegexLiteral();
    }
    if ( tokVal == "function" ) {
      return self.parseFunctionExpression();
    }
    self.advance()
    let fallback : JSNode = JSNode()
    fallback.type = "Identifier";
    fallback.name = tok.value;
    fallback.start = tok.start;
    fallback.end = tok.end;
    fallback.line = tok.line;
    fallback.col = tok.col;
    return fallback;
  }
  func parseArray() -> JSNode {
    let arr : JSNode = JSNode()
    arr.type = "ArrayExpression";
    let startTok : Token = self.peek()
    arr.start = startTok.start;
    arr.line = startTok.line;
    arr.col = startTok.col;
    _ = self.expectValue(expectedValue : "[")
    while ((self.matchValue(value : "]") == false) && (self.isAtEnd() == false)) {
      if ( (arr.children.count) > 0 ) {
        _ = self.expectValue(expectedValue : ",")
      }
      if ( self.matchValue(value : "]") || self.isAtEnd() ) {
        break;
      }
      if ( self.matchValue(value : "...") ) {
        let spreadTok : Token = self.peek()
        self.advance()
        let arg : JSNode = self.parseAssignment()
        let spread : JSNode = JSNode()
        spread.type = "SpreadElement";
        spread.left = arg;
        spread.start = spreadTok.start;
        spread.line = spreadTok.line;
        spread.col = spreadTok.col;
        arr.children.append(spread)
      } else {
        let elem : JSNode = self.parseAssignment()
        arr.children.append(elem)
      }
    }
    _ = self.expectValue(expectedValue : "]")
    return arr;
  }
  func parseObject() -> JSNode {
    let obj : JSNode = JSNode()
    obj.type = "ObjectExpression";
    let startTok : Token = self.peek()
    obj.start = startTok.start;
    obj.line = startTok.line;
    obj.col = startTok.col;
    _ = self.expectValue(expectedValue : "{")
    while ((self.matchValue(value : "}") == false) && (self.isAtEnd() == false)) {
      if ( (obj.children.count) > 0 ) {
        _ = self.expectValue(expectedValue : ",")
      }
      if ( self.matchValue(value : "}") || self.isAtEnd() ) {
        break;
      }
      if ( self.matchValue(value : "...") ) {
        let spreadTok : Token = self.peek()
        self.advance()
        let arg : JSNode = self.parseAssignment()
        let spread : JSNode = JSNode()
        spread.type = "SpreadElement";
        spread.left = arg;
        spread.start = spreadTok.start;
        spread.line = spreadTok.line;
        spread.col = spreadTok.col;
        obj.children.append(spread)
      } else {
        let prop : JSNode = JSNode()
        prop.type = "Property";
        let keyTok : Token = self.peek()
        let keyType : String = self.peekType()
        if ( self.matchValue(value : "[") ) {
          self.advance()
          let keyExpr : JSNode = self.parseAssignment()
          _ = self.expectValue(expectedValue : "]")
          _ = self.expectValue(expectedValue : ":")
          let val : JSNode = self.parseAssignment()
          prop.right = keyExpr;
          prop.left = val;
          prop.computed = true;
          prop.start = keyTok.start;
          prop.line = keyTok.line;
          prop.col = keyTok.col;
          obj.children.append(prop)
        } else {
          if ( ((keyType == "Identifier") || (keyType == "String")) || (keyType == "Number") ) {
            self.advance()
            prop.name = keyTok.value;
            prop.start = keyTok.start;
            prop.line = keyTok.line;
            prop.col = keyTok.col;
            if ( self.matchValue(value : ":") ) {
              _ = self.expectValue(expectedValue : ":")
              let val_1 : JSNode = self.parseAssignment()
              prop.left = val_1;
            } else {
              let id : JSNode = JSNode()
              id.type = "Identifier";
              id.name = keyTok.value;
              id.start = keyTok.start;
              id.line = keyTok.line;
              id.col = keyTok.col;
              prop.left = id;
              prop.shorthand = true;
            }
            obj.children.append(prop)
          } else {
            let err : String = ((((("Parse error at line " + String(keyTok.line)) + ":") + String(keyTok.col)) + ": unexpected token '") + keyTok.value) + "' in object literal"
            self.addError(msg : err)
            self.advance()
          }
        }
      }
    }
    _ = self.expectValue(expectedValue : "}")
    return obj;
  }
  func parseArrayPattern() -> JSNode {
    let pattern : JSNode = JSNode()
    pattern.type = "ArrayPattern";
    let startTok : Token = self.peek()
    pattern.start = startTok.start;
    pattern.line = startTok.line;
    pattern.col = startTok.col;
    _ = self.expectValue(expectedValue : "[")
    while ((self.matchValue(value : "]") == false) && (self.isAtEnd() == false)) {
      if ( (pattern.children.count) > 0 ) {
        _ = self.expectValue(expectedValue : ",")
      }
      if ( self.matchValue(value : "]") || self.isAtEnd() ) {
        break;
      }
      if ( self.matchValue(value : "...") ) {
        let restTok : Token = self.peek()
        self.advance()
        let idTok : Token = self.expect(expectedType : "Identifier")
        let rest : JSNode = JSNode()
        rest.type = "RestElement";
        rest.name = idTok.value;
        rest.start = restTok.start;
        rest.line = restTok.line;
        rest.col = restTok.col;
        pattern.children.append(rest)
      } else {
        if ( self.matchValue(value : "[") ) {
          let nested : JSNode = self.parseArrayPattern()
          pattern.children.append(nested)
        } else {
          if ( self.matchValue(value : "{") ) {
            let nested_1 : JSNode = self.parseObjectPattern()
            pattern.children.append(nested_1)
          } else {
            let idTok_1 : Token = self.expect(expectedType : "Identifier")
            let id : JSNode = JSNode()
            id.type = "Identifier";
            id.name = idTok_1.value;
            id.start = idTok_1.start;
            id.line = idTok_1.line;
            id.col = idTok_1.col;
            pattern.children.append(id)
          }
        }
      }
    }
    _ = self.expectValue(expectedValue : "]")
    return pattern;
  }
  func parseObjectPattern() -> JSNode {
    let pattern : JSNode = JSNode()
    pattern.type = "ObjectPattern";
    let startTok : Token = self.peek()
    pattern.start = startTok.start;
    pattern.line = startTok.line;
    pattern.col = startTok.col;
    _ = self.expectValue(expectedValue : "{")
    while ((self.matchValue(value : "}") == false) && (self.isAtEnd() == false)) {
      if ( (pattern.children.count) > 0 ) {
        _ = self.expectValue(expectedValue : ",")
      }
      if ( self.matchValue(value : "}") || self.isAtEnd() ) {
        break;
      }
      if ( self.matchValue(value : "...") ) {
        let restTok : Token = self.peek()
        self.advance()
        let idTok : Token = self.expect(expectedType : "Identifier")
        let rest : JSNode = JSNode()
        rest.type = "RestElement";
        rest.name = idTok.value;
        rest.start = restTok.start;
        rest.line = restTok.line;
        rest.col = restTok.col;
        pattern.children.append(rest)
      } else {
        let prop : JSNode = JSNode()
        prop.type = "Property";
        let keyTok : Token = self.expect(expectedType : "Identifier")
        prop.name = keyTok.value;
        prop.start = keyTok.start;
        prop.line = keyTok.line;
        prop.col = keyTok.col;
        if ( self.matchValue(value : ":") ) {
          self.advance()
          if ( self.matchValue(value : "[") ) {
            let nested : JSNode = self.parseArrayPattern()
            prop.left = nested;
          } else {
            if ( self.matchValue(value : "{") ) {
              let nested_1 : JSNode = self.parseObjectPattern()
              prop.left = nested_1;
            } else {
              let idTok2 : Token = self.expect(expectedType : "Identifier")
              let id : JSNode = JSNode()
              id.type = "Identifier";
              id.name = idTok2.value;
              id.start = idTok2.start;
              id.line = idTok2.line;
              id.col = idTok2.col;
              prop.left = id;
            }
          }
        } else {
          let id_1 : JSNode = JSNode()
          id_1.type = "Identifier";
          id_1.name = keyTok.value;
          id_1.start = keyTok.start;
          id_1.line = keyTok.line;
          id_1.col = keyTok.col;
          prop.left = id_1;
          prop.shorthand = true;
        }
        pattern.children.append(prop)
      }
    }
    _ = self.expectValue(expectedValue : "}")
    return pattern;
  }
  func isArrowFunction() -> Bool {
    if ( self.matchValue(value : "(") == false ) {
      return false;
    }
    var depth : Int = 1
    var scanPos : Int = 1
    while (depth > 0) {
      let scanVal : String = self.peekAt(offset : scanPos)
      if ( scanVal == "" ) {
        return false;
      }
      if ( scanVal == "(" ) {
        depth = depth + 1;
      }
      if ( scanVal == ")" ) {
        depth = depth - 1;
      }
      scanPos = scanPos + 1;
    }
    let afterParen : String = self.peekAt(offset : scanPos)
    return afterParen == "=>";
  }
  func parseArrowFunction() -> JSNode {
    let arrow : JSNode = JSNode()
    arrow.type = "ArrowFunctionExpression";
    let startTok : Token = self.peek()
    arrow.start = startTok.start;
    arrow.line = startTok.line;
    arrow.col = startTok.col;
    if ( self.matchValue(value : "(") ) {
      self.advance()
      while ((self.matchValue(value : ")") == false) && (self.isAtEnd() == false)) {
        if ( (arrow.children.count) > 0 ) {
          _ = self.expectValue(expectedValue : ",")
        }
        if ( self.matchValue(value : ")") || self.isAtEnd() ) {
          break;
        }
        let paramTok : Token = self.expect(expectedType : "Identifier")
        let param : JSNode = JSNode()
        param.type = "Identifier";
        param.name = paramTok.value;
        param.start = paramTok.start;
        param.line = paramTok.line;
        param.col = paramTok.col;
        arrow.children.append(param)
      }
      _ = self.expectValue(expectedValue : ")")
    } else {
      let paramTok_1 : Token = self.expect(expectedType : "Identifier")
      let param_1 : JSNode = JSNode()
      param_1.type = "Identifier";
      param_1.name = paramTok_1.value;
      param_1.start = paramTok_1.start;
      param_1.line = paramTok_1.line;
      param_1.col = paramTok_1.col;
      arrow.children.append(param_1)
    }
    _ = self.expectValue(expectedValue : "=>")
    if ( self.matchValue(value : "{") ) {
      let body : JSNode = self.parseBlock()
      arrow.body = body;
    } else {
      let expr : JSNode = self.parseAssignment()
      arrow.body = expr;
    }
    return arrow;
  }
  func parseAsyncArrowFunction() -> JSNode {
    let arrow : JSNode = JSNode()
    arrow.type = "ArrowFunctionExpression";
    arrow.async = true;
    let startTok : Token = self.peek()
    arrow.start = startTok.start;
    arrow.line = startTok.line;
    arrow.col = startTok.col;
    _ = self.expectValue(expectedValue : "async")
    if ( self.matchValue(value : "(") ) {
      self.advance()
      while ((self.matchValue(value : ")") == false) && (self.isAtEnd() == false)) {
        if ( (arrow.children.count) > 0 ) {
          _ = self.expectValue(expectedValue : ",")
        }
        if ( self.matchValue(value : ")") || self.isAtEnd() ) {
          break;
        }
        let paramTok : Token = self.expect(expectedType : "Identifier")
        let param : JSNode = JSNode()
        param.type = "Identifier";
        param.name = paramTok.value;
        param.start = paramTok.start;
        param.line = paramTok.line;
        param.col = paramTok.col;
        arrow.children.append(param)
      }
      _ = self.expectValue(expectedValue : ")")
    } else {
      let paramTok_1 : Token = self.expect(expectedType : "Identifier")
      let param_1 : JSNode = JSNode()
      param_1.type = "Identifier";
      param_1.name = paramTok_1.value;
      param_1.start = paramTok_1.start;
      param_1.line = paramTok_1.line;
      param_1.col = paramTok_1.col;
      arrow.children.append(param_1)
    }
    _ = self.expectValue(expectedValue : "=>")
    if ( self.matchValue(value : "{") ) {
      let body : JSNode = self.parseBlock()
      arrow.body = body;
    } else {
      let expr : JSNode = self.parseAssignment()
      arrow.body = expr;
    }
    return arrow;
  }
}
func ==(l: ASTPrinter, r: ASTPrinter) -> Bool {
  return l === r
}
class ASTPrinter : Equatable  { 
  class func printNode(node : JSNode, depth : Int) -> Void {
    var indent : String = ""
    var i : Int = 0
    while (i < depth) {
      indent = indent + "  ";
      i = i + 1;
    }
    let numComments : Int = node.leadingComments.count
    if ( numComments > 0 ) {
      for (ci, comment) in node.leadingComments.enumerated() {
        let commentType : String = comment.type
        var preview : String = comment.raw
        if ( (preview.count) > 40 ) {
          preview = (String(preview[preview.index(preview.startIndex, offsetBy:0)..<preview.index(preview.startIndex, offsetBy:40)])) + "...";
        }
        print(((indent + commentType) + ": ") + preview)
      }
    }
    let nodeType : String = node.type
    let loc : String = ((("[" + String(node.line)) + ":") + String(node.col)) + "]"
    if ( nodeType == "VariableDeclaration" ) {
      let kind : String = node.name
      if ( (kind.count) > 0 ) {
        print((((indent + "VariableDeclaration (") + kind) + ") ") + loc)
      } else {
        print((indent + "VariableDeclaration ") + loc)
      }
      for (ci_1, child) in node.children.enumerated() {
        ASTPrinter.printNode(node : child, depth : depth + 1)
      }
      return;
    }
    if ( nodeType == "VariableDeclarator" ) {
      if ( node.left != nil  ) {
        let id : JSNode = node.left!
        let idType : String = id.type
        if ( idType == "Identifier" ) {
          print((((indent + "VariableDeclarator: ") + id.name) + " ") + loc)
        } else {
          print((indent + "VariableDeclarator ") + loc)
          print(indent + "  pattern:")
          ASTPrinter.printNode(node : id, depth : depth + 2)
        }
      } else {
        print((indent + "VariableDeclarator ") + loc)
      }
      if ( node.right != nil  ) {
        ASTPrinter.printNode(node : node.right!, depth : depth + 1)
      }
      return;
    }
    if ( nodeType == "FunctionDeclaration" ) {
      var params : String = ""
      for (pi, p) in node.children.enumerated() {
        if ( pi > 0 ) {
          params = params + ", ";
        }
        params = params + p.name;
      }
      var prefix : String = ""
      if ( node.async ) {
        if ( node.generator ) {
          prefix = "async function* ";
        } else {
          prefix = "async ";
        }
      } else {
        if ( node.generator ) {
          prefix = "function* ";
        }
      }
      if ( (prefix.count) > 0 ) {
        print(((((((indent + "FunctionDeclaration: ") + prefix) + node.name) + "(") + params) + ") ") + loc)
      } else {
        print((((((indent + "FunctionDeclaration: ") + node.name) + "(") + params) + ") ") + loc)
      }
      if ( node.body != nil  ) {
        ASTPrinter.printNode(node : node.body!, depth : depth + 1)
      }
      return;
    }
    if ( nodeType == "ClassDeclaration" ) {
      var output : String = (indent + "ClassDeclaration: ") + node.name
      if ( node.left != nil  ) {
        let superClass : JSNode = node.left!
        output = (output + " extends ") + superClass.name;
      }
      print((output + " ") + loc)
      if ( node.body != nil  ) {
        ASTPrinter.printNode(node : node.body!, depth : depth + 1)
      }
      return;
    }
    if ( nodeType == "ClassBody" ) {
      print((indent + "ClassBody ") + loc)
      for (mi, method) in node.children.enumerated() {
        ASTPrinter.printNode(node : method, depth : depth + 1)
      }
      return;
    }
    if ( nodeType == "MethodDefinition" ) {
      var staticStr : String = ""
      if ( node._static ) {
        staticStr = "static ";
      }
      print(((((indent + "MethodDefinition: ") + staticStr) + node.name) + " ") + loc)
      if ( node.body != nil  ) {
        ASTPrinter.printNode(node : node.body!, depth : depth + 1)
      }
      return;
    }
    if ( nodeType == "ArrowFunctionExpression" ) {
      var params_1 : String = ""
      for (pi_1, p_1) in node.children.enumerated() {
        if ( pi_1 > 0 ) {
          params_1 = params_1 + ", ";
        }
        params_1 = params_1 + p_1.name;
      }
      var asyncStr : String = ""
      if ( node.async ) {
        asyncStr = "async ";
      }
      print((((((indent + "ArrowFunctionExpression: ") + asyncStr) + "(") + params_1) + ") => ") + loc)
      if ( node.body != nil  ) {
        ASTPrinter.printNode(node : node.body!, depth : depth + 1)
      }
      return;
    }
    if ( nodeType == "YieldExpression" ) {
      var delegateStr : String = ""
      if ( node.name == "delegate" ) {
        delegateStr = "*";
      }
      print((((indent + "YieldExpression") + delegateStr) + " ") + loc)
      if ( node.left != nil  ) {
        ASTPrinter.printNode(node : node.left!, depth : depth + 1)
      }
      return;
    }
    if ( nodeType == "AwaitExpression" ) {
      print((indent + "AwaitExpression ") + loc)
      if ( node.left != nil  ) {
        ASTPrinter.printNode(node : node.left!, depth : depth + 1)
      }
      return;
    }
    if ( nodeType == "TemplateLiteral" ) {
      print((((indent + "TemplateLiteral: `") + node.name) + "` ") + loc)
      return;
    }
    if ( nodeType == "BlockStatement" ) {
      print((indent + "BlockStatement ") + loc)
      for (ci_2, child_1) in node.children.enumerated() {
        ASTPrinter.printNode(node : child_1, depth : depth + 1)
      }
      return;
    }
    if ( nodeType == "ReturnStatement" ) {
      print((indent + "ReturnStatement ") + loc)
      if ( node.left != nil  ) {
        ASTPrinter.printNode(node : node.left!, depth : depth + 1)
      }
      return;
    }
    if ( nodeType == "IfStatement" ) {
      print((indent + "IfStatement ") + loc)
      print(indent + "  test:")
      if ( node.test != nil  ) {
        ASTPrinter.printNode(node : node.test!, depth : depth + 2)
      }
      print(indent + "  consequent:")
      if ( node.body != nil  ) {
        ASTPrinter.printNode(node : node.body!, depth : depth + 2)
      }
      if ( node.alternate != nil  ) {
        print(indent + "  alternate:")
        ASTPrinter.printNode(node : node.alternate!, depth : depth + 2)
      }
      return;
    }
    if ( nodeType == "ExpressionStatement" ) {
      print((indent + "ExpressionStatement ") + loc)
      if ( node.left != nil  ) {
        ASTPrinter.printNode(node : node.left!, depth : depth + 1)
      }
      return;
    }
    if ( nodeType == "AssignmentExpression" ) {
      print((((indent + "AssignmentExpression: ") + node.name) + " ") + loc)
      if ( node.left != nil  ) {
        print(indent + "  left:")
        ASTPrinter.printNode(node : node.left!, depth : depth + 2)
      }
      if ( node.right != nil  ) {
        print(indent + "  right:")
        ASTPrinter.printNode(node : node.right!, depth : depth + 2)
      }
      return;
    }
    if ( (nodeType == "BinaryExpression") || (nodeType == "LogicalExpression") ) {
      print(((((indent + nodeType) + ": ") + node.name) + " ") + loc)
      if ( node.left != nil  ) {
        print(indent + "  left:")
        ASTPrinter.printNode(node : node.left!, depth : depth + 2)
      }
      if ( node.right != nil  ) {
        print(indent + "  right:")
        ASTPrinter.printNode(node : node.right!, depth : depth + 2)
      }
      return;
    }
    if ( nodeType == "UnaryExpression" ) {
      print((((indent + "UnaryExpression: ") + node.name) + " ") + loc)
      if ( node.left != nil  ) {
        ASTPrinter.printNode(node : node.left!, depth : depth + 1)
      }
      return;
    }
    if ( nodeType == "UpdateExpression" ) {
      var prefix_1 : String = ""
      if ( node.prefix ) {
        prefix_1 = "prefix ";
      } else {
        prefix_1 = "postfix ";
      }
      print(((((indent + "UpdateExpression: ") + prefix_1) + node.name) + " ") + loc)
      if ( node.left != nil  ) {
        ASTPrinter.printNode(node : node.left!, depth : depth + 1)
      }
      return;
    }
    if ( nodeType == "NewExpression" ) {
      print((indent + "NewExpression ") + loc)
      print(indent + "  callee:")
      if ( node.left != nil  ) {
        ASTPrinter.printNode(node : node.left!, depth : depth + 2)
      }
      if ( (node.children.count) > 0 ) {
        print(indent + "  arguments:")
        for (ai, arg) in node.children.enumerated() {
          ASTPrinter.printNode(node : arg, depth : depth + 2)
        }
      }
      return;
    }
    if ( nodeType == "ConditionalExpression" ) {
      print((indent + "ConditionalExpression ") + loc)
      print(indent + "  test:")
      if ( node.left != nil  ) {
        ASTPrinter.printNode(node : node.left!, depth : depth + 2)
      }
      print(indent + "  consequent:")
      if ( node.body != nil  ) {
        ASTPrinter.printNode(node : node.body!, depth : depth + 2)
      }
      print(indent + "  alternate:")
      if ( node.right != nil  ) {
        ASTPrinter.printNode(node : node.right!, depth : depth + 2)
      }
      return;
    }
    if ( nodeType == "CallExpression" ) {
      print((indent + "CallExpression ") + loc)
      if ( node.left != nil  ) {
        print(indent + "  callee:")
        ASTPrinter.printNode(node : node.left!, depth : depth + 2)
      }
      if ( (node.children.count) > 0 ) {
        print(indent + "  arguments:")
        for (ai_1, arg_1) in node.children.enumerated() {
          ASTPrinter.printNode(node : arg_1, depth : depth + 2)
        }
      }
      return;
    }
    if ( nodeType == "MemberExpression" ) {
      if ( node.computed == false ) {
        print((((indent + "MemberExpression: .") + node.name) + " ") + loc)
      } else {
        print((indent + "MemberExpression: [computed] ") + loc)
      }
      if ( node.left != nil  ) {
        ASTPrinter.printNode(node : node.left!, depth : depth + 1)
      }
      if ( node.right != nil  ) {
        ASTPrinter.printNode(node : node.right!, depth : depth + 1)
      }
      return;
    }
    if ( nodeType == "Identifier" ) {
      print((((indent + "Identifier: ") + node.name) + " ") + loc)
      return;
    }
    if ( nodeType == "Literal" ) {
      print((((((indent + "Literal: ") + node.name) + " (") + node.raw) + ") ") + loc)
      return;
    }
    if ( nodeType == "ArrayExpression" ) {
      print((indent + "ArrayExpression ") + loc)
      for (ei, elem) in node.children.enumerated() {
        ASTPrinter.printNode(node : elem, depth : depth + 1)
      }
      return;
    }
    if ( nodeType == "ObjectExpression" ) {
      print((indent + "ObjectExpression ") + loc)
      for (pi_2, prop) in node.children.enumerated() {
        ASTPrinter.printNode(node : prop, depth : depth + 1)
      }
      return;
    }
    if ( nodeType == "Property" ) {
      var shorthand : String = ""
      if ( node.shorthand ) {
        shorthand = " (shorthand)";
      }
      print(((((indent + "Property: ") + node.name) + shorthand) + " ") + loc)
      if ( node.left != nil  ) {
        ASTPrinter.printNode(node : node.left!, depth : depth + 1)
      }
      return;
    }
    if ( nodeType == "ArrayPattern" ) {
      print((indent + "ArrayPattern ") + loc)
      for (ei_1, elem_1) in node.children.enumerated() {
        ASTPrinter.printNode(node : elem_1, depth : depth + 1)
      }
      return;
    }
    if ( nodeType == "ObjectPattern" ) {
      print((indent + "ObjectPattern ") + loc)
      for (pi_3, prop_1) in node.children.enumerated() {
        ASTPrinter.printNode(node : prop_1, depth : depth + 1)
      }
      return;
    }
    if ( nodeType == "SpreadElement" ) {
      print((indent + "SpreadElement ") + loc)
      if ( node.left != nil  ) {
        ASTPrinter.printNode(node : node.left!, depth : depth + 1)
      }
      return;
    }
    if ( nodeType == "RestElement" ) {
      print((((indent + "RestElement: ...") + node.name) + " ") + loc)
      return;
    }
    if ( nodeType == "WhileStatement" ) {
      print((indent + "WhileStatement ") + loc)
      print(indent + "  test:")
      if ( node.test != nil  ) {
        ASTPrinter.printNode(node : node.test!, depth : depth + 2)
      }
      print(indent + "  body:")
      if ( node.body != nil  ) {
        ASTPrinter.printNode(node : node.body!, depth : depth + 2)
      }
      return;
    }
    if ( nodeType == "DoWhileStatement" ) {
      print((indent + "DoWhileStatement ") + loc)
      print(indent + "  body:")
      if ( node.body != nil  ) {
        ASTPrinter.printNode(node : node.body!, depth : depth + 2)
      }
      print(indent + "  test:")
      if ( node.test != nil  ) {
        ASTPrinter.printNode(node : node.test!, depth : depth + 2)
      }
      return;
    }
    if ( nodeType == "ForStatement" ) {
      print((indent + "ForStatement ") + loc)
      if ( node.left != nil  ) {
        print(indent + "  init:")
        ASTPrinter.printNode(node : node.left!, depth : depth + 2)
      }
      if ( node.test != nil  ) {
        print(indent + "  test:")
        ASTPrinter.printNode(node : node.test!, depth : depth + 2)
      }
      if ( node.right != nil  ) {
        print(indent + "  update:")
        ASTPrinter.printNode(node : node.right!, depth : depth + 2)
      }
      print(indent + "  body:")
      if ( node.body != nil  ) {
        ASTPrinter.printNode(node : node.body!, depth : depth + 2)
      }
      return;
    }
    if ( nodeType == "ForOfStatement" ) {
      print((indent + "ForOfStatement ") + loc)
      if ( node.left != nil  ) {
        print(indent + "  left:")
        ASTPrinter.printNode(node : node.left!, depth : depth + 2)
      }
      if ( node.right != nil  ) {
        print(indent + "  right:")
        ASTPrinter.printNode(node : node.right!, depth : depth + 2)
      }
      print(indent + "  body:")
      if ( node.body != nil  ) {
        ASTPrinter.printNode(node : node.body!, depth : depth + 2)
      }
      return;
    }
    if ( nodeType == "ForInStatement" ) {
      print((indent + "ForInStatement ") + loc)
      if ( node.left != nil  ) {
        print(indent + "  left:")
        ASTPrinter.printNode(node : node.left!, depth : depth + 2)
      }
      if ( node.right != nil  ) {
        print(indent + "  right:")
        ASTPrinter.printNode(node : node.right!, depth : depth + 2)
      }
      print(indent + "  body:")
      if ( node.body != nil  ) {
        ASTPrinter.printNode(node : node.body!, depth : depth + 2)
      }
      return;
    }
    if ( nodeType == "SwitchStatement" ) {
      print((indent + "SwitchStatement ") + loc)
      print(indent + "  discriminant:")
      if ( node.test != nil  ) {
        ASTPrinter.printNode(node : node.test!, depth : depth + 2)
      }
      print(indent + "  cases:")
      for (ci_3, caseNode) in node.children.enumerated() {
        ASTPrinter.printNode(node : caseNode, depth : depth + 2)
      }
      return;
    }
    if ( nodeType == "SwitchCase" ) {
      if ( node.name == "default" ) {
        print((indent + "SwitchCase: default ") + loc)
      } else {
        print((indent + "SwitchCase ") + loc)
        if ( node.test != nil  ) {
          print(indent + "  test:")
          ASTPrinter.printNode(node : node.test!, depth : depth + 2)
        }
      }
      if ( (node.children.count) > 0 ) {
        print(indent + "  consequent:")
        for (si, stmt) in node.children.enumerated() {
          ASTPrinter.printNode(node : stmt, depth : depth + 2)
        }
      }
      return;
    }
    if ( nodeType == "TryStatement" ) {
      print((indent + "TryStatement ") + loc)
      print(indent + "  block:")
      if ( node.body != nil  ) {
        ASTPrinter.printNode(node : node.body!, depth : depth + 2)
      }
      if ( node.left != nil  ) {
        print(indent + "  handler:")
        ASTPrinter.printNode(node : node.left!, depth : depth + 2)
      }
      if ( node.right != nil  ) {
        print(indent + "  finalizer:")
        ASTPrinter.printNode(node : node.right!, depth : depth + 2)
      }
      return;
    }
    if ( nodeType == "CatchClause" ) {
      print((((indent + "CatchClause: ") + node.name) + " ") + loc)
      if ( node.body != nil  ) {
        ASTPrinter.printNode(node : node.body!, depth : depth + 1)
      }
      return;
    }
    if ( nodeType == "ThrowStatement" ) {
      print((indent + "ThrowStatement ") + loc)
      if ( node.left != nil  ) {
        ASTPrinter.printNode(node : node.left!, depth : depth + 1)
      }
      return;
    }
    if ( nodeType == "BreakStatement" ) {
      if ( (node.name.count) > 0 ) {
        print((((indent + "BreakStatement: ") + node.name) + " ") + loc)
      } else {
        print((indent + "BreakStatement ") + loc)
      }
      return;
    }
    if ( nodeType == "ContinueStatement" ) {
      if ( (node.name.count) > 0 ) {
        print((((indent + "ContinueStatement: ") + node.name) + " ") + loc)
      } else {
        print((indent + "ContinueStatement ") + loc)
      }
      return;
    }
    print(((indent + nodeType) + " ") + loc)
  }
}
func ==(l: JSPrinter, r: JSPrinter) -> Bool {
  return l === r
}
class JSPrinter : Equatable  { 
  var indentLevel : Int = 0
  var indentStr : String = "  "
  var output : String = ""
  func getIndent() -> String {
    var result : String = ""
    var i : Int = 0
    while (i < self.indentLevel) {
      result = result + self.indentStr;
      i = i + 1;
    }
    return result;
  }
  func emit(text : String) -> Void {
    self.output = self.output + text;
  }
  func emitLine(text : String) -> Void {
    let ind : String = self.getIndent()
    self.output = ((self.output + ind) + text) + "\n";
  }
  func emitIndent() -> Void {
    let ind : String = self.getIndent()
    self.output = self.output + ind;
  }
  func indent() -> Void {
    self.indentLevel = self.indentLevel + 1;
  }
  func dedent() -> Void {
    self.indentLevel = self.indentLevel - 1;
  }
  func printLeadingComments(node : JSNode) -> Void {
    let numComments : Int = node.leadingComments.count
    if ( numComments == 0 ) {
      return;
    }
    for (i, comment) in node.leadingComments.enumerated() {
      self.printComment(comment : comment)
    }
  }
  func printComment(comment : JSNode) -> Void {
    let commentType : String = comment.type
    let value : String = comment.raw
    if ( commentType == "LineComment" ) {
      self.emitLine(text : "//" + value)
      return;
    }
    if ( commentType == "BlockComment" ) {
      self.emitLine(text : ("/*" + value) + "*/")
      return;
    }
    if ( commentType == "JSDocComment" ) {
      self.printJSDocComment(value : value)
      return;
    }
  }
  func printJSDocComment(value : String) -> Void {
    self.emitLine(text : ("/*" + value) + "*/")
  }
  func print(node : JSNode) -> String {
    self.output = "";
    self.indentLevel = 0;
    self.printNode(node : node)
    return self.output;
  }
  func printNode(node : JSNode) -> Void {
    let nodeType : String = node.type
    if ( nodeType == "Program" ) {
      self.printProgram(node : node)
      return;
    }
    if ( nodeType == "VariableDeclaration" ) {
      self.printVariableDeclaration(node : node)
      return;
    }
    if ( nodeType == "FunctionDeclaration" ) {
      self.printFunctionDeclaration(node : node)
      return;
    }
    if ( nodeType == "ClassDeclaration" ) {
      self.printClassDeclaration(node : node)
      return;
    }
    if ( nodeType == "ImportDeclaration" ) {
      self.printImportDeclaration(node : node)
      return;
    }
    if ( nodeType == "ExportNamedDeclaration" ) {
      self.printExportNamedDeclaration(node : node)
      return;
    }
    if ( nodeType == "ExportDefaultDeclaration" ) {
      self.printExportDefaultDeclaration(node : node)
      return;
    }
    if ( nodeType == "ExportAllDeclaration" ) {
      self.printExportAllDeclaration(node : node)
      return;
    }
    if ( nodeType == "BlockStatement" ) {
      self.printBlockStatement(node : node)
      return;
    }
    if ( nodeType == "ExpressionStatement" ) {
      self.printExpressionStatement(node : node)
      return;
    }
    if ( nodeType == "ReturnStatement" ) {
      self.printReturnStatement(node : node)
      return;
    }
    if ( nodeType == "IfStatement" ) {
      self.printIfStatement(node : node)
      return;
    }
    if ( nodeType == "WhileStatement" ) {
      self.printWhileStatement(node : node)
      return;
    }
    if ( nodeType == "DoWhileStatement" ) {
      self.printDoWhileStatement(node : node)
      return;
    }
    if ( nodeType == "ForStatement" ) {
      self.printForStatement(node : node)
      return;
    }
    if ( nodeType == "ForOfStatement" ) {
      self.printForOfStatement(node : node)
      return;
    }
    if ( nodeType == "ForInStatement" ) {
      self.printForInStatement(node : node)
      return;
    }
    if ( nodeType == "SwitchStatement" ) {
      self.printSwitchStatement(node : node)
      return;
    }
    if ( nodeType == "TryStatement" ) {
      self.printTryStatement(node : node)
      return;
    }
    if ( nodeType == "ThrowStatement" ) {
      self.printThrowStatement(node : node)
      return;
    }
    if ( nodeType == "BreakStatement" ) {
      self.emit(text : "break")
      return;
    }
    if ( nodeType == "ContinueStatement" ) {
      self.emit(text : "continue")
      return;
    }
    if ( nodeType == "EmptyStatement" ) {
      return;
    }
    if ( nodeType == "Identifier" ) {
      self.emit(text : node.name)
      return;
    }
    if ( nodeType == "Literal" ) {
      self.printLiteral(node : node)
      return;
    }
    if ( nodeType == "TemplateLiteral" ) {
      self.emit(text : ("`" + node.raw) + "`")
      return;
    }
    if ( nodeType == "RegexLiteral" ) {
      self.emit(text : (("/" + node.name) + "/") + node.kind)
      return;
    }
    if ( nodeType == "ArrayExpression" ) {
      self.printArrayExpression(node : node)
      return;
    }
    if ( nodeType == "ObjectExpression" ) {
      self.printObjectExpression(node : node)
      return;
    }
    if ( nodeType == "BinaryExpression" ) {
      self.printBinaryExpression(node : node)
      return;
    }
    if ( nodeType == "LogicalExpression" ) {
      self.printBinaryExpression(node : node)
      return;
    }
    if ( nodeType == "UnaryExpression" ) {
      self.printUnaryExpression(node : node)
      return;
    }
    if ( nodeType == "UpdateExpression" ) {
      self.printUpdateExpression(node : node)
      return;
    }
    if ( nodeType == "AssignmentExpression" ) {
      self.printAssignmentExpression(node : node)
      return;
    }
    if ( nodeType == "ConditionalExpression" ) {
      self.printConditionalExpression(node : node)
      return;
    }
    if ( nodeType == "CallExpression" ) {
      self.printCallExpression(node : node)
      return;
    }
    if ( nodeType == "OptionalCallExpression" ) {
      self.printOptionalCallExpression(node : node)
      return;
    }
    if ( nodeType == "MemberExpression" ) {
      self.printMemberExpression(node : node)
      return;
    }
    if ( nodeType == "OptionalMemberExpression" ) {
      self.printOptionalMemberExpression(node : node)
      return;
    }
    if ( nodeType == "NewExpression" ) {
      self.printNewExpression(node : node)
      return;
    }
    if ( nodeType == "ArrowFunctionExpression" ) {
      self.printArrowFunction(node : node)
      return;
    }
    if ( nodeType == "FunctionExpression" ) {
      self.printFunctionExpression(node : node)
      return;
    }
    if ( nodeType == "YieldExpression" ) {
      self.printYieldExpression(node : node)
      return;
    }
    if ( nodeType == "AwaitExpression" ) {
      self.printAwaitExpression(node : node)
      return;
    }
    if ( nodeType == "SpreadElement" ) {
      self.printSpreadElement(node : node)
      return;
    }
    if ( nodeType == "RestElement" ) {
      self.emit(text : "..." + node.name)
      return;
    }
    if ( nodeType == "ArrayPattern" ) {
      self.printArrayPattern(node : node)
      return;
    }
    if ( nodeType == "ObjectPattern" ) {
      self.printObjectPattern(node : node)
      return;
    }
    self.emit(text : ("/* unknown: " + nodeType) + " */")
  }
  func printProgram(node : JSNode) -> Void {
    for (idx, stmt) in node.children.enumerated() {
      self.printStatement(node : stmt)
    }
  }
  func printStatement(node : JSNode) -> Void {
    self.printLeadingComments(node : node)
    let nodeType : String = node.type
    if ( nodeType == "BlockStatement" ) {
      self.printBlockStatement(node : node)
      return;
    }
    if ( (((((((((nodeType == "FunctionDeclaration") || (nodeType == "ClassDeclaration")) || (nodeType == "IfStatement")) || (nodeType == "WhileStatement")) || (nodeType == "DoWhileStatement")) || (nodeType == "ForStatement")) || (nodeType == "ForOfStatement")) || (nodeType == "ForInStatement")) || (nodeType == "SwitchStatement")) || (nodeType == "TryStatement") ) {
      self.emitIndent()
      self.printNode(node : node)
      self.emit(text : "\n")
      return;
    }
    self.emitIndent()
    self.printNode(node : node)
    self.emit(text : ";\n")
  }
  func printVariableDeclaration(node : JSNode) -> Void {
    var kind : String = node.kind
    if ( (kind.count) == 0 ) {
      kind = "var";
    }
    self.emit(text : kind + " ")
    var first : Bool = true
    for (idx, decl) in node.children.enumerated() {
      if ( first == false ) {
        self.emit(text : ", ")
      }
      first = false;
      self.printVariableDeclarator(node : decl)
    }
  }
  func printVariableDeclarator(node : JSNode) -> Void {
    if ( node.id != nil  ) {
      let id : JSNode = node.id!
      self.printNode(node : id)
    }
    if ( node._init != nil  ) {
      self.emit(text : " = ")
      self.printNode(node : node._init!)
    }
  }
  func printFunctionDeclaration(node : JSNode) -> Void {
    if ( node.async ) {
      self.emit(text : "async ")
    }
    self.emit(text : "function")
    if ( node.generator ) {
      self.emit(text : "*")
    }
    self.emit(text : (" " + node.name) + "(")
    self.printParams(params : node.children)
    self.emit(text : ") ")
    if ( node.body != nil  ) {
      self.printNode(node : node.body!)
    }
  }
  func printParams(params : [JSNode]) -> Void {
    var first : Bool = true
    for (idx, p) in params.enumerated() {
      if ( first == false ) {
        self.emit(text : ", ")
      }
      first = false;
      self.printNode(node : p)
    }
  }
  func printClassDeclaration(node : JSNode) -> Void {
    self.emit(text : "class " + node.name)
    if ( node.superClass != nil  ) {
      let sc : JSNode = node.superClass!
      self.emit(text : " extends " + sc.name)
    }
    self.emit(text : " ")
    if ( node.body != nil  ) {
      self.printClassBody(node : node.body!)
    }
  }
  func printClassBody(node : JSNode) -> Void {
    self.emit(text : "{\n")
    self.indent()
    for (idx, method) in node.children.enumerated() {
      self.printMethodDefinition(node : method)
    }
    self.dedent()
    self.emitIndent()
    self.emit(text : "}")
  }
  func printMethodDefinition(node : JSNode) -> Void {
    self.emitIndent()
    if ( node._static ) {
      self.emit(text : "static ")
    }
    if ( node.key != nil  ) {
      let keyNode : JSNode = node.key!
      self.emit(text : keyNode.name + "(")
    } else {
      self.emit(text : "(")
    }
    if ( node.body != nil  ) {
      let _func : JSNode = node.body!
      self.printParams(params : _func.children)
    }
    self.emit(text : ") ")
    if ( node.body != nil  ) {
      let func_1 : JSNode = node.body!
      if ( func_1.body != nil  ) {
        self.printNode(node : func_1.body!)
      }
    }
    self.emit(text : "\n")
  }
  func printBlockStatement(node : JSNode) -> Void {
    self.emit(text : "{\n")
    self.indent()
    for (idx, stmt) in node.children.enumerated() {
      self.printStatement(node : stmt)
    }
    self.dedent()
    self.emitIndent()
    self.emit(text : "}")
  }
  func printExpressionStatement(node : JSNode) -> Void {
    if ( node.left != nil  ) {
      self.printNode(node : node.left!)
    }
  }
  func printReturnStatement(node : JSNode) -> Void {
    self.emit(text : "return")
    if ( node.left != nil  ) {
      self.emit(text : " ")
      self.printNode(node : node.left!)
    }
  }
  func printIfStatement(node : JSNode) -> Void {
    self.emit(text : "if (")
    if ( node.test != nil  ) {
      self.printNode(node : node.test!)
    }
    self.emit(text : ") ")
    if ( node.body != nil  ) {
      self.printNode(node : node.body!)
    }
    if ( node.alternate != nil  ) {
      self.emit(text : " else ")
      self.printNode(node : node.alternate!)
    }
  }
  func printWhileStatement(node : JSNode) -> Void {
    self.emit(text : "while (")
    if ( node.test != nil  ) {
      self.printNode(node : node.test!)
    }
    self.emit(text : ") ")
    if ( node.body != nil  ) {
      self.printNode(node : node.body!)
    }
  }
  func printDoWhileStatement(node : JSNode) -> Void {
    self.emit(text : "do ")
    if ( node.body != nil  ) {
      self.printNode(node : node.body!)
    }
    self.emit(text : " while (")
    if ( node.test != nil  ) {
      self.printNode(node : node.test!)
    }
    self.emit(text : ")")
  }
  func printForStatement(node : JSNode) -> Void {
    self.emit(text : "for (")
    if ( node.left != nil  ) {
      self.printNode(node : node.left!)
    }
    self.emit(text : "; ")
    if ( node.test != nil  ) {
      self.printNode(node : node.test!)
    }
    self.emit(text : "; ")
    if ( node.right != nil  ) {
      self.printNode(node : node.right!)
    }
    self.emit(text : ") ")
    if ( node.body != nil  ) {
      self.printNode(node : node.body!)
    }
  }
  func printForOfStatement(node : JSNode) -> Void {
    self.emit(text : "for (")
    if ( node.left != nil  ) {
      self.printNode(node : node.left!)
    }
    self.emit(text : " of ")
    if ( node.right != nil  ) {
      self.printNode(node : node.right!)
    }
    self.emit(text : ") ")
    if ( node.body != nil  ) {
      self.printNode(node : node.body!)
    }
  }
  func printForInStatement(node : JSNode) -> Void {
    self.emit(text : "for (")
    if ( node.left != nil  ) {
      self.printNode(node : node.left!)
    }
    self.emit(text : " in ")
    if ( node.right != nil  ) {
      self.printNode(node : node.right!)
    }
    self.emit(text : ") ")
    if ( node.body != nil  ) {
      self.printNode(node : node.body!)
    }
  }
  func printSwitchStatement(node : JSNode) -> Void {
    self.emit(text : "switch (")
    if ( node.test != nil  ) {
      self.printNode(node : node.test!)
    }
    self.emit(text : ") {\n")
    self.indent()
    for (idx, caseNode) in node.children.enumerated() {
      self.printSwitchCase(node : caseNode)
    }
    self.dedent()
    self.emitIndent()
    self.emit(text : "}")
  }
  func printSwitchCase(node : JSNode) -> Void {
    if ( node.name == "default" ) {
      self.emitLine(text : "default:")
    } else {
      self.emitIndent()
      self.emit(text : "case ")
      if ( node.test != nil  ) {
        self.printNode(node : node.test!)
      }
      self.emit(text : ":\n")
    }
    self.indent()
    for (idx, stmt) in node.children.enumerated() {
      self.printStatement(node : stmt)
    }
    self.dedent()
  }
  func printTryStatement(node : JSNode) -> Void {
    self.emit(text : "try ")
    if ( node.body != nil  ) {
      self.printNode(node : node.body!)
    }
    if ( node.left != nil  ) {
      let catchClause : JSNode = node.left!
      self.emit(text : (" catch (" + catchClause.name) + ") ")
      if ( catchClause.body != nil  ) {
        self.printNode(node : catchClause.body!)
      }
    }
    if ( node.right != nil  ) {
      self.emit(text : " finally ")
      self.printNode(node : node.right!)
    }
  }
  func printThrowStatement(node : JSNode) -> Void {
    self.emit(text : "throw ")
    if ( node.left != nil  ) {
      self.printNode(node : node.left!)
    }
  }
  func printLiteral(node : JSNode) -> Void {
    let value : String = node.raw
    if ( node.kind == "string" ) {
      self.emit(text : ("'" + value) + "'")
    } else {
      self.emit(text : value)
    }
  }
  func printArrayExpression(node : JSNode) -> Void {
    self.emit(text : "[")
    var first : Bool = true
    for (idx, elem) in node.children.enumerated() {
      if ( first == false ) {
        self.emit(text : ", ")
      }
      first = false;
      self.printNode(node : elem)
    }
    self.emit(text : "]")
  }
  func printObjectExpression(node : JSNode) -> Void {
    if ( (node.children.count) == 0 ) {
      self.emit(text : "{}")
      return;
    }
    self.emit(text : "{ ")
    var first : Bool = true
    for (idx, prop) in node.children.enumerated() {
      if ( first == false ) {
        self.emit(text : ", ")
      }
      first = false;
      self.printProperty(node : prop)
    }
    self.emit(text : " }")
  }
  func printProperty(node : JSNode) -> Void {
    let nodeType : String = node.type
    if ( nodeType == "SpreadElement" ) {
      self.printSpreadElement(node : node)
      return;
    }
    if ( node.shorthand ) {
      self.emit(text : node.name)
      return;
    }
    if ( node.computed ) {
      self.emit(text : "[")
      if ( node.right != nil  ) {
        self.printNode(node : node.right!)
      }
      self.emit(text : "]: ")
      if ( node.left != nil  ) {
        self.printNode(node : node.left!)
      }
      return;
    }
    self.emit(text : node.name + ": ")
    if ( node.left != nil  ) {
      self.printNode(node : node.left!)
    }
  }
  func printBinaryExpression(node : JSNode) -> Void {
    self.emit(text : "(")
    if ( node.left != nil  ) {
      self.printNode(node : node.left!)
    }
    self.emit(text : (" " + node._operator) + " ")
    if ( node.right != nil  ) {
      self.printNode(node : node.right!)
    }
    self.emit(text : ")")
  }
  func printUnaryExpression(node : JSNode) -> Void {
    let op : String = node._operator
    self.emit(text : op)
    if ( op == "typeof" ) {
      self.emit(text : " ")
    }
    if ( node.left != nil  ) {
      self.printNode(node : node.left!)
    }
  }
  func printUpdateExpression(node : JSNode) -> Void {
    let op : String = node._operator
    let isPrefix : Bool = node.prefix
    if ( isPrefix ) {
      self.emit(text : op)
    }
    if ( node.left != nil  ) {
      self.printNode(node : node.left!)
    }
    if ( isPrefix == false ) {
      self.emit(text : op)
    }
  }
  func printAssignmentExpression(node : JSNode) -> Void {
    if ( node.left != nil  ) {
      self.printNode(node : node.left!)
    }
    self.emit(text : (" " + node._operator) + " ")
    if ( node.right != nil  ) {
      self.printNode(node : node.right!)
    }
  }
  func printConditionalExpression(node : JSNode) -> Void {
    if ( node.left != nil  ) {
      self.printNode(node : node.left!)
    }
    self.emit(text : " ? ")
    if ( node.body != nil  ) {
      self.printNode(node : node.body!)
    }
    self.emit(text : " : ")
    if ( node.right != nil  ) {
      self.printNode(node : node.right!)
    }
  }
  func printCallExpression(node : JSNode) -> Void {
    if ( node.left != nil  ) {
      self.printNode(node : node.left!)
    }
    self.emit(text : "(")
    var first : Bool = true
    for (idx, arg) in node.children.enumerated() {
      if ( first == false ) {
        self.emit(text : ", ")
      }
      first = false;
      self.printNode(node : arg)
    }
    self.emit(text : ")")
  }
  func printMemberExpression(node : JSNode) -> Void {
    if ( node.left != nil  ) {
      self.printNode(node : node.left!)
    }
    if ( node.computed ) {
      self.emit(text : "[")
      if ( node.right != nil  ) {
        self.printNode(node : node.right!)
      }
      self.emit(text : "]")
    } else {
      self.emit(text : "." + node.name)
    }
  }
  func printOptionalMemberExpression(node : JSNode) -> Void {
    if ( node.left != nil  ) {
      self.printNode(node : node.left!)
    }
    if ( node.computed ) {
      self.emit(text : "?.[")
      if ( node.right != nil  ) {
        self.printNode(node : node.right!)
      }
      self.emit(text : "]")
    } else {
      self.emit(text : "?." + node.name)
    }
  }
  func printOptionalCallExpression(node : JSNode) -> Void {
    if ( node.left != nil  ) {
      self.printNode(node : node.left!)
    }
    self.emit(text : "?.(")
    var first : Bool = true
    for (idx, arg) in node.children.enumerated() {
      if ( first == false ) {
        self.emit(text : ", ")
      }
      first = false;
      self.printNode(node : arg)
    }
    self.emit(text : ")")
  }
  func printImportDeclaration(node : JSNode) -> Void {
    self.emit(text : "import ")
    let numSpecifiers : Int = node.children.count
    if ( numSpecifiers == 0 ) {
      if ( node.right != nil  ) {
        let source : JSNode = node.right!
        self.emit(text : ("\"" + source.raw) + "\"")
      }
      return;
    }
    var hasDefault : Bool = false
    var hasNamespace : Bool = false
    var hasNamed : Bool = false
    for (idx, spec) in node.children.enumerated() {
      if ( spec.type == "ImportDefaultSpecifier" ) {
        hasDefault = true;
      }
      if ( spec.type == "ImportNamespaceSpecifier" ) {
        hasNamespace = true;
      }
      if ( spec.type == "ImportSpecifier" ) {
        hasNamed = true;
      }
    }
    var printedSomething : Bool = false
    for (idx_1, spec_1) in node.children.enumerated() {
      if ( spec_1.type == "ImportDefaultSpecifier" ) {
        self.emit(text : spec_1.name)
        printedSomething = true;
      }
    }
    for (idx_2, spec_2) in node.children.enumerated() {
      if ( spec_2.type == "ImportNamespaceSpecifier" ) {
        if ( printedSomething ) {
          self.emit(text : ", ")
        }
        self.emit(text : "* as " + spec_2.name)
        printedSomething = true;
      }
    }
    if ( hasNamed ) {
      if ( printedSomething ) {
        self.emit(text : ", ")
      }
      self.emit(text : "{ ")
      var firstNamed : Bool = true
      for (idx_3, spec_3) in node.children.enumerated() {
        if ( spec_3.type == "ImportSpecifier" ) {
          if ( firstNamed == false ) {
            self.emit(text : ", ")
          }
          firstNamed = false;
          self.emit(text : spec_3.name)
          if ( (spec_3.kind.count) > 0 ) {
            self.emit(text : " as " + spec_3.kind)
          }
        }
      }
      self.emit(text : " }")
    }
    self.emit(text : " from ")
    if ( node.right != nil  ) {
      let source_1 : JSNode = node.right!
      self.emit(text : ("\"" + source_1.raw) + "\"")
    }
  }
  func printExportNamedDeclaration(node : JSNode) -> Void {
    self.emit(text : "export ")
    let numSpecifiers : Int = node.children.count
    if ( numSpecifiers > 0 ) {
      self.emit(text : "{ ")
      var first : Bool = true
      for (idx, spec) in node.children.enumerated() {
        if ( first == false ) {
          self.emit(text : ", ")
        }
        first = false;
        self.emit(text : spec.name)
        if ( (spec.kind.count) > 0 ) {
          self.emit(text : " as " + spec.kind)
        }
      }
      self.emit(text : " }")
      if ( node.right != nil  ) {
        let source : JSNode = node.right!
        self.emit(text : (" from \"" + source.raw) + "\"")
      }
      return;
    }
    if ( node.left != nil  ) {
      self.printNode(node : node.left!)
    }
  }
  func printExportDefaultDeclaration(node : JSNode) -> Void {
    self.emit(text : "export default ")
    if ( node.left != nil  ) {
      self.printNode(node : node.left!)
    }
  }
  func printExportAllDeclaration(node : JSNode) -> Void {
    self.emit(text : "export *")
    if ( (node.name.count) > 0 ) {
      self.emit(text : " as " + node.name)
    }
    self.emit(text : " from ")
    if ( node.right != nil  ) {
      let source : JSNode = node.right!
      self.emit(text : ("\"" + source.raw) + "\"")
    }
  }
  func printNewExpression(node : JSNode) -> Void {
    self.emit(text : "new ")
    if ( node.left != nil  ) {
      self.printNode(node : node.left!)
    }
    self.emit(text : "(")
    var first : Bool = true
    for (idx, arg) in node.children.enumerated() {
      if ( first == false ) {
        self.emit(text : ", ")
      }
      first = false;
      self.printNode(node : arg)
    }
    self.emit(text : ")")
  }
  func printArrowFunction(node : JSNode) -> Void {
    if ( node.async ) {
      self.emit(text : "async ")
    }
    let paramCount : Int = node.children.count
    if ( paramCount == 1 ) {
      let firstParam : JSNode = node.children[0]
      if ( firstParam.type == "Identifier" ) {
        self.emit(text : firstParam.name)
      } else {
        self.emit(text : "(")
        self.printNode(node : firstParam)
        self.emit(text : ")")
      }
    } else {
      self.emit(text : "(")
      self.printParams(params : node.children)
      self.emit(text : ")")
    }
    self.emit(text : " => ")
    if ( node.body != nil  ) {
      let body : JSNode = node.body!
      if ( body.type == "BlockStatement" ) {
        self.printNode(node : body)
      } else {
        self.printNode(node : body)
      }
    }
  }
  func printFunctionExpression(node : JSNode) -> Void {
    self.emit(text : "function(")
    self.printParams(params : node.children)
    self.emit(text : ") ")
    if ( node.body != nil  ) {
      self.printNode(node : node.body!)
    }
  }
  func printYieldExpression(node : JSNode) -> Void {
    self.emit(text : "yield")
    if ( node.name == "delegate" ) {
      self.emit(text : "*")
    }
    if ( node.left != nil  ) {
      self.emit(text : " ")
      self.printNode(node : node.left!)
    }
  }
  func printAwaitExpression(node : JSNode) -> Void {
    self.emit(text : "await ")
    if ( node.left != nil  ) {
      self.printNode(node : node.left!)
    }
  }
  func printSpreadElement(node : JSNode) -> Void {
    self.emit(text : "...")
    if ( node.left != nil  ) {
      self.printNode(node : node.left!)
    }
  }
  func printArrayPattern(node : JSNode) -> Void {
    self.emit(text : "[")
    var first : Bool = true
    for (idx, elem) in node.children.enumerated() {
      if ( first == false ) {
        self.emit(text : ", ")
      }
      first = false;
      self.printNode(node : elem)
    }
    self.emit(text : "]")
  }
  func printObjectPattern(node : JSNode) -> Void {
    self.emit(text : "{ ")
    var first : Bool = true
    for (idx, prop) in node.children.enumerated() {
      if ( first == false ) {
        self.emit(text : ", ")
      }
      first = false;
      let propType : String = prop.type
      if ( propType == "RestElement" ) {
        self.emit(text : "..." + prop.name)
      } else {
        if ( prop.shorthand ) {
          self.emit(text : prop.name)
        } else {
          self.emit(text : prop.name + ": ")
          if ( prop.left != nil  ) {
            self.printNode(node : prop.left!)
          }
        }
      }
    }
    self.emit(text : " }")
  }
}
func ==(l: JSParserMain, r: JSParserMain) -> Bool {
  return l === r
}
class JSParserMain : Equatable  { 
  class func showHelp() -> Void {
    print("JavaScript ES6 Parser and Pretty Printer")
    print("")
    print("Usage: node js_parser.js [options]")
    print("")
    print("Options:")
    print("  -h, --help     Show this help message")
    print("  -d             Run built-in demo/test suite")
    print("  -i <file>      Input JavaScript file to parse")
    print("  -o <file>      Output file for pretty-printed JavaScript")
    print("  --ast          Show AST instead of pretty-printed output (with -i)")
    print("")
    print("Examples:")
    print("  node js_parser.js -d                        Run the demo")
    print("  node js_parser.js -i script.js              Parse and show AST")
    print("  node js_parser.js -i script.js -o out.js    Parse and pretty-print to file")
    print("  node js_parser.js -i src/app.js -o dist/app.js")
  }
  class func processFile(inputFile : String, outputFile : String) -> Void {
    let codeOpt : String? = r_read_file(dirName: "." + "/" + inputFile) 
    if ( codeOpt == nil ) {
      print("Error: Could not read file: " + inputFile)
      return;
    }
    let code : String = codeOpt!
    let lexer : Lexer = Lexer(src : code)
    let tokens : [Token] = lexer.tokenize()
    let parser : SimpleParser = SimpleParser()
    parser.initParserWithSource(toks : tokens, src : code)
    let program : JSNode = parser.parseProgram()
    if ( parser.hasErrors() ) {
      print("=== Parse Errors ===")
      for (ei, err) in parser.errors.enumerated() {
        print(err)
      }
      print("")
    }
    let printer : JSPrinter = JSPrinter()
    let stmtCount : Int = program.children.count
    let output : String = (printer).print(node : program)
    r_write_file(dirName: "." + "/" + outputFile, dataToWrite: output) 
    print((("Parsed " + inputFile) + " -> ") + outputFile)
    print(("  " + String(stmtCount)) + " statements processed")
  }
  class func parseFile(filename : String) -> Void {
    let codeOpt : String? = r_read_file(dirName: "." + "/" + filename) 
    if ( codeOpt == nil ) {
      print("Error: Could not read file: " + filename)
      return;
    }
    let code : String = codeOpt!
    let lexer : Lexer = Lexer(src : code)
    let tokens : [Token] = lexer.tokenize()
    let parser : SimpleParser = SimpleParser()
    parser.initParserWithSource(toks : tokens, src : code)
    let program : JSNode = parser.parseProgram()
    if ( parser.hasErrors() ) {
      print("=== Parse Errors ===")
      for (ei, err) in parser.errors.enumerated() {
        print(err)
      }
      print("")
    }
    print(("Program with " + String((program.children.count))) + " statements:")
    print("")
    for (idx, stmt) in program.children.enumerated() {
      ASTPrinter.printNode(node : stmt, depth : 0)
    }
  }
  class func runDemo() -> Void {
    let code : String = "// Variable declarations\r\nvar y = 'hello';\r\n\r\n// Function declaration\r\nfunction add(a, b) {\r\n    return a + b;\r\n}\r\n\r\n// While loop\r\nvar i = 0;\r\nwhile (i < 10) {\r\n    i = i + 1;\r\n}\r\n\r\n// Do-while loop\r\ndo {\r\n    i = i - 1;\r\n} while (i > 0);\r\n\r\n// For loop\r\nfor (var j = 0; j < 5; j = j + 1) {\r\n    x = x + j;\r\n}\r\n\r\n// Switch statement\r\nswitch (x) {\r\n    case 1:\r\n        y = 'one';\r\n        break;\r\n    case 2:\r\n        y = 'two';\r\n        break;\r\n    default:\r\n        y = 'other';\r\n}\r\n\r\n// Try-catch-finally\r\ntry {\r\n    throw 'error';\r\n} catch (e) {\r\n    y = e;\r\n} finally {\r\n    x = 0;\r\n}\r\n\r\n// If-else\r\nif (x > 100) {\r\n    y = 'big';\r\n} else {\r\n    y = 'small';\r\n}\r\n\r\nvar arr = [1, 2, 3];\r\nvar obj = { name: 'test', value: 42 };\r\n\r\n// Unary expressions\r\nvar negNum = -42;\r\nvar posNum = +5;\r\nvar notTrue = !true;\r\nvar notFalse = !false;\r\nvar doubleNot = !!x;\r\nvar negExpr = -(a + b);\r\n\r\n// Logical expressions\r\nvar andResult = true && false;\r\nvar orResult = true || false;\r\nvar complexLogic = (a > 0) && (b < 10) || (c == 5);\r\nvar shortCircuit = x && y && z;\r\nvar orChain = a || b || c;\r\n\r\n// Ternary expressions\r\nvar ternResult = x > 0 ? 'positive' : 'non-positive';\r\nvar nestedTern = a > b ? (b > c ? 'a>b>c' : 'a>b, b<=c') : 'a<=b';\r\nvar ternInExpr = 1 + (x ? 2 : 3);\r\n\r\n// Operator precedence tests\r\nvar prec1 = 1 + 2 * 3;\r\nvar prec2 = (1 + 2) * 3;\r\nvar prec3 = 1 + 2 + 3 + 4;\r\nvar prec4 = 2 * 3 + 4 * 5;\r\nvar prec5 = 1 < 2 && 3 > 1;\r\nvar prec6 = !x && y || z;\r\nvar prec7 = a == b && c != d;\r\nvar prec8 = -x + y * -z;\r\n\r\n// Comparison operators\r\nvar cmp1 = a == b;\r\nvar cmp2 = a != b;\r\nvar cmp3 = a < b;\r\nvar cmp4 = a <= b;\r\nvar cmp5 = a > b;\r\nvar cmp6 = a >= b;\r\n\r\n// === ES6 Features ===\r\n\r\n// let and const\r\nlet count = 0;\r\nconst PI = 3.14159;\r\n\r\n// Arrow functions\r\nconst add = (a, b) => a + b;\r\nconst double = x => x * 2;\r\nconst greet = (name) => {\r\n    return 'Hello, ' + name;\r\n};\r\nconst multiLine = (a, b) => {\r\n    let sum = a + b;\r\n    return sum * 2;\r\n};\r\n\r\n// Template literals\r\nlet name = 'World';\r\nlet greeting = `Hello, ${name}!`;\r\nlet multi = `Line 1\r\nLine 2`;\r\n\r\n// Class syntax\r\nclass Animal {\r\n    constructor(name) {\r\n        this.name = name;\r\n    }\r\n    \r\n    speak() {\r\n        return this.name + ' makes a sound';\r\n    }\r\n    \r\n    static create(name) {\r\n        return new Animal(name);\r\n    }\r\n}\r\n\r\nclass Dog extends Animal {\r\n    constructor(name, breed) {\r\n        super(name);\r\n        this.breed = breed;\r\n    }\r\n    \r\n    speak() {\r\n        return this.name + ' barks';\r\n    }\r\n}\r\n\r\n// Generator functions\r\nfunction* numberGenerator() {\r\n    yield 1;\r\n    yield 2;\r\n    yield 3;\r\n}\r\n\r\nfunction* delegateGenerator() {\r\n    yield* numberGenerator();\r\n    yield 4;\r\n}\r\n\r\n// Async/await\r\nasync function fetchData() {\r\n    const response = await fetch('/api/data');\r\n    const data = await response.json();\r\n    return data;\r\n}\r\n\r\nasync function processItems(items) {\r\n    for (const item of items) {\r\n        await processItem(item);\r\n    }\r\n}\r\n\r\n// Async arrow functions\r\nconst asyncArrow = async (x) => {\r\n    const result = await doSomething(x);\r\n    return result * 2;\r\n};\r\n\r\nconst asyncFetch = async (url) => await fetch(url);\r\n\r\n// Async generator (ES2018)\r\nasync function* asyncGenerator() {\r\n    yield await fetch('/api/1');\r\n    yield await fetch('/api/2');\r\n}\r\n\r\n// === for...of and for...in loops ===\r\n\r\n// For-of loop\r\nfor (const item of items) {\r\n    console.log(item);\r\n}\r\n\r\n// For-in loop\r\nfor (const key in obj) {\r\n    console.log(key);\r\n}\r\n\r\n// For-of with array destructuring\r\nfor (const [index, value] of entries) {\r\n    console.log(index, value);\r\n}\r\n\r\n// === Spread operator ===\r\n\r\n// Array spread\r\nconst arr1 = [1, 2, 3];\r\nconst arr2 = [...arr1, 4, 5];\r\nconst combined = [...arr1, ...arr2];\r\n\r\n// Object spread\r\nconst obj1 = { a: 1, b: 2 };\r\nconst obj2 = { ...obj1, c: 3 };\r\nconst merged = { ...obj1, ...obj2 };\r\n\r\n// Spread in function call\r\nconsole.log(...args);\r\n\r\n// === Rest parameters ===\r\n\r\nfunction sum(...numbers) {\r\n    return numbers.reduce((a, b) => a + b);\r\n}\r\n\r\nfunction firstAndRest(first, ...rest) {\r\n    return { first, rest };\r\n}\r\n\r\n// === Destructuring ===\r\n\r\n// Array destructuring\r\nconst [x, y, z] = [1, 2, 3];\r\nconst [first, ...others] = arr1;\r\nlet [a, b] = [b, a];\r\n\r\n// Object destructuring\r\nconst { name, age } = person;\r\nconst { x: newX, y: newY } = point;\r\nconst { a: { b: nested } } = deep;\r\n\r\n// Destructuring with default (parsed as identifier for now)\r\nconst { foo, bar } = obj;\r\n\r\n// Nested destructuring\r\nconst { user: { name: userName } } = data;\r\nconst [{ id }, { id: id2 }] = items;\r\n\r\n// Shorthand properties\r\nconst shorthand = { x, y, z };\r\n"
    print("=== JavaScript ES6 Parser ===")
    print("")
    print("Input:")
    print(code)
    print("")
    let lexer : Lexer = Lexer(src : code)
    let tokens : [Token] = lexer.tokenize()
    print(("--- Tokens: " + String((tokens.count))) + " ---")
    print("")
    let parser : SimpleParser = SimpleParser()
    parser.initParserWithSource(toks : tokens, src : code)
    let program : JSNode = parser.parseProgram()
    if ( parser.hasErrors() ) {
      print("=== Parse Errors ===")
      for (ei, err) in parser.errors.enumerated() {
        print(err)
      }
      print("")
    }
    print(("Program with " + String((program.children.count))) + " statements:")
    print("")
    print("--- AST ---")
    for (idx, stmt) in program.children.enumerated() {
      ASTPrinter.printNode(node : stmt, depth : 0)
    }
    print("")
    print("--- Pretty Printed Output ---")
    let printer : JSPrinter = JSPrinter()
    let output : String = (printer).print(node : program)
    print(output)
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


func r_write_file ( dirName:String, dataToWrite:String ) {
    do {
        let fileManager = FileManager.default
        let url = URL(fileURLWithPath: fileManager.currentDirectoryPath)
        let path = url.appendingPathComponent(dirName)
        try dataToWrite.write(to:path, atomically: false, encoding: .utf8)
    } catch {

    }
}

// Main entry point
func main() {
  let argCnt : Int = CommandLine.arguments.count - 1
  if ( argCnt == 0 ) {
    JSParserMain.showHelp()
    return;
  }
  var inputFile : String = ""
  var outputFile : String = ""
  var runDefault : Bool = false
  var showAst : Bool = false
  var i : Int = 0
  while (i < argCnt) {
    let arg : String = CommandLine.arguments[i + 1]
    if ( (arg == "--help") || (arg == "-h") ) {
      JSParserMain.showHelp()
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
        if ( arg == "-o" ) {
          i = i + 1;
          if ( i < argCnt ) {
            outputFile = CommandLine.arguments[i + 1];
          }
          i = i + 1;
        } else {
          if ( arg == "--ast" ) {
            showAst = true;
            i = i + 1;
          } else {
            i = i + 1;
          }
        }
      }
    }
  }
  if ( runDefault ) {
    JSParserMain.runDemo()
    return;
  }
  if ( (inputFile.count) > 0 ) {
    if ( (outputFile.count) > 0 ) {
      JSParserMain.processFile(inputFile : inputFile, outputFile : outputFile)
    } else {
      JSParserMain.parseFile(filename : inputFile)
    }
    return;
  }
  JSParserMain.showHelp()
}
main()
