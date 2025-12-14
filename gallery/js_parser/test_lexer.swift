// Quick test of Lexer

class Token {
  var tokenType: String = ""
  var value: String = ""
  var start: Int = 0
  var end: Int = 0
  var line: Int = 0
  var col: Int = 0
}

class Lexer {
  var source : String = ""
  var pos : Int = 0
  var line : Int = 1
  var col : Int = 1
  var __len : Int = 0

  init(src : String ) {
    self.source = src
    self.__len = src.count
    print("Lexer init: source length = \(self.__len)")
    print("Source: [\(src)]")
  }

  func peek() -> String {
    if ( self.pos >= self.__len ) {
      return ""
    }
    return String(self.source[self.source.index(self.source.startIndex, offsetBy:self.pos)])
  }

  func advance() -> String {
    if ( self.pos >= self.__len ) {
      return ""
    }
    let ch : String = String(self.source[self.source.index(self.source.startIndex, offsetBy:self.pos)])
    self.pos = self.pos + 1
    if ( ch == "\n" ) {
      self.line = self.line + 1
      self.col = 1
    } else {
      self.col = self.col + 1
    }
    return ch
  }

  func isWhitespace(ch : String) -> Bool {
    if ( ch == " " ) { return true }
    if ( ch == "\t" ) { return true }
    if ( ch == "\n" ) { return true }
    if ( ch == "\r" ) { return true }
    return false
  }

  func skipWhitespace() -> Void {
    while (self.pos < self.__len) {
      let ch : String = self.peek()
      if ( self.isWhitespace(ch : ch) ) {
        _ = self.advance()
      } else {
        return
      }
    }
  }

  func isDigit(ch : String) -> Bool {
    return ch >= "0" && ch <= "9"
  }

  func isAlpha(ch : String) -> Bool {
    if ( ch.count == 0 ) { return false }
    let code : Int = Int(self.source[self.source.index(self.source.startIndex, offsetBy: self.pos)].asciiValue ?? 0)
    print("isAlpha ch=[\(ch)] pos=\(self.pos) code=\(code)")
    if ( code >= 97 && code <= 122 ) { return true }
    if ( code >= 65 && code <= 90 ) { return true }
    if ( ch == "_" ) { return true }
    if ( ch == "$" ) { return true }
    return false
  }

  func readIdentifier() -> Token {
    let startPos = self.pos
    var value = ""
    while (self.pos < self.__len) {
      let ch = self.peek()
      if (self.isDigit(ch: ch) || self.isAlpha(ch: ch)) {
        value = value + self.advance()
      } else {
        break
      }
    }
    let tok = Token()
    tok.tokenType = "Identifier"
    tok.value = value
    tok.start = startPos
    tok.end = self.pos
    return tok
  }

  func nextToken() -> Token {
    self.skipWhitespace()
    print("nextToken at pos=\(self.pos), len=\(self.__len)")
    if ( self.pos >= self.__len ) {
      let tok = Token()
      tok.tokenType = "EOF"
      return tok
    }
    let ch = self.peek()
    print("  ch = [\(ch)]")
    if (self.isAlpha(ch: ch)) {
      return self.readIdentifier()
    }
    // Single char punctuator
    _ = self.advance()
    let tok = Token()
    tok.tokenType = "Punctuator"
    tok.value = ch
    return tok
  }
}

let src = "var x"
let lexer = Lexer(src: src)
print("Testing: [\(src)]")
var tokens: [Token] = []
for i in 0..<10 {
  let tok = lexer.nextToken()
  print("Token \(i): \(tok.tokenType) = [\(tok.value)]")
  tokens.append(tok)
  if tok.tokenType == "EOF" { break }
}
print("Total tokens: \(tokens.count)")
