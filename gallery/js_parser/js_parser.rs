#![allow(unused_parens)]
#![allow(unused_mut)]
#![allow(unused_variables)]
#![allow(non_snake_case)]
#![allow(dead_code)]

#[derive(Clone)]
struct Token { 
  tokenType : String, 
  value : String, 
  line : i64, 
  col : i64, 
  start : i64, 
  end : i64, 
}
impl Token { 
  
  pub fn new() ->  Token {
    let mut me = Token { 
      tokenType:"".to_string(), 
      value:"".to_string(), 
      line:0, 
      col:0, 
      start:0, 
      end:0, 
    };
    return me;
  }
}
#[derive(Clone)]
struct Lexer { 
  source : String, 
  pos : i64, 
  line : i64, 
  col : i64, 
  __len : i64, 
}
impl Lexer { 
  
  pub fn new(src : String) ->  Lexer {
    let mut me = Lexer { 
      source:"".to_string(), 
      pos:0, 
      line:1, 
      col:1, 
      len:0, 
    };
    me.source = src;
    me.__len = src.len() as i64;
    return me;
  }
  fn peek(&mut self, ) -> String {
    if  self.pos >= self.__len {
      return "".to_string().clone();
    }
    return self.source.chars().nth(self.pos as usize).map(|c| c.to_string()).unwrap_or_default().clone();
  }
  fn peekAt(&mut self, offset : i64) -> String {
    let idx : i64 = self.pos + offset;
    if  idx >= self.__len {
      return "".to_string().clone();
    }
    return self.source.chars().nth(idx as usize).map(|c| c.to_string()).unwrap_or_default().clone();
  }
  fn advance(&mut self, ) -> String {
    if  self.pos >= self.__len {
      return "".to_string().clone();
    }
    let ch : String = self.source.chars().nth(self.pos as usize).map(|c| c.to_string()).unwrap_or_default();
    self.pos = self.pos + 1;
    if  ch == "\n".to_string() {
      self.line = self.line + 1;
      self.col = 1;
    } else {
      self.col = self.col + 1;
    }
    return ch.clone();
  }
  fn isDigit(&mut self, ch : String) -> bool {
    if  ch == "0".to_string() {
      return true;
    }
    if  ch == "1".to_string() {
      return true;
    }
    if  ch == "2".to_string() {
      return true;
    }
    if  ch == "3".to_string() {
      return true;
    }
    if  ch == "4".to_string() {
      return true;
    }
    if  ch == "5".to_string() {
      return true;
    }
    if  ch == "6".to_string() {
      return true;
    }
    if  ch == "7".to_string() {
      return true;
    }
    if  ch == "8".to_string() {
      return true;
    }
    if  ch == "9".to_string() {
      return true;
    }
    return false;
  }
  fn isAlpha(&mut self, ch : String) -> bool {
    if  (ch.len() as i64) == 0 {
      return false;
    }
    let code : i64 = self.source.chars().nth(self.pos as usize).unwrap_or('\0') as i64;
    if  code >= 97 {
      if  code <= 122 {
        return true;
      }
    }
    if  code >= 65 {
      if  code <= 90 {
        return true;
      }
    }
    if  ch == "_".to_string() {
      return true;
    }
    if  ch == "$".to_string() {
      return true;
    }
    return false;
  }
  fn isAlphaNumCh(&mut self, ch : String) -> bool {
    if  self.isDigit(ch) {
      return true;
    }
    if  ch == "_".to_string() {
      return true;
    }
    if  ch == "$".to_string() {
      return true;
    }
    if  (ch.len() as i64) == 0 {
      return false;
    }
    let code : i64 = self.source.chars().nth(self.pos as usize).unwrap_or('\0') as i64;
    if  code >= 97 {
      if  code <= 122 {
        return true;
      }
    }
    if  code >= 65 {
      if  code <= 90 {
        return true;
      }
    }
    return false;
  }
  fn isWhitespace(&mut self, ch : String) -> bool {
    if  ch == " ".to_string() {
      return true;
    }
    if  ch == "\t".to_string() {
      return true;
    }
    if  ch == "\n".to_string() {
      return true;
    }
    if  ch == "\r".to_string() {
      return true;
    }
    return false;
  }
  fn skipWhitespace(&mut self, ) -> () {
    while self.pos < self.__len {
      let ch : String = self.peek();
      if  self.isWhitespace(ch) {
        self.advance();
      } else {
        return;
      }
    }
  }
  fn readLineComment(&mut self, ) -> Token {
    let startPos : i64 = self.pos;
    let startLine : i64 = self.line;
    let startCol : i64 = self.col;
    self.advance();
    self.advance();
    let mut value : String = "".to_string();
    while self.pos < self.__len {
      let ch : String = self.peek();
      if  ch == "\n".to_string() {
        return self.makeToken("LineComment".to_string(), value, startPos, startLine, startCol).clone();
      }
      value = format!("{}{}", value, self.advance());
    }
    return self.makeToken("LineComment".to_string(), value, startPos, startLine, startCol).clone();
  }
  fn readBlockComment(&mut self, ) -> Token {
    let startPos : i64 = self.pos;
    let startLine : i64 = self.line;
    let startCol : i64 = self.col;
    self.advance();
    self.advance();
    let mut value : String = "".to_string();
    let mut isJSDoc : bool = false;
    if  self.peek() == "*".to_string() {
      let nextCh : String = self.peekAt(1);
      if  nextCh != "/".to_string() {
        isJSDoc = true;
      }
    }
    while self.pos < self.__len {
      let ch : String = self.peek();
      if  ch == "*".to_string() {
        if  self.peekAt(1) == "/".to_string() {
          self.advance();
          self.advance();
          if  isJSDoc {
            return self.makeToken("JSDocComment".to_string(), value, startPos, startLine, startCol).clone();
          }
          return self.makeToken("BlockComment".to_string(), value, startPos, startLine, startCol).clone();
        }
      }
      value = format!("{}{}", value, self.advance());
    }
    if  isJSDoc {
      return self.makeToken("JSDocComment".to_string(), value, startPos, startLine, startCol).clone();
    }
    return self.makeToken("BlockComment".to_string(), value, startPos, startLine, startCol).clone();
  }
  fn makeToken(&mut self, tokType : String, value : String, startPos : i64, startLine : i64, startCol : i64) -> Token {
    let mut tok : Token = Token::new();
    tok.tokenType = tokType;
    tok.value = value;
    tok.start = startPos;
    tok.end = self.pos;
    tok.line = startLine;
    tok.col = startCol;
    return tok.clone();
  }
  fn readString(&mut self, quote : String) -> Token {
    let startPos : i64 = self.pos;
    let startLine : i64 = self.line;
    let startCol : i64 = self.col;
    self.advance();
    let mut value : String = "".to_string();
    while self.pos < self.__len {
      let ch : String = self.peek();
      if  ch == quote {
        self.advance();
        return self.makeToken("String".to_string(), value, startPos, startLine, startCol).clone();
      }
      if  ch == "\\".to_string() {
        self.advance();
        let esc : String = self.advance();
        if  esc == "n".to_string() {
          value = format!("{}{}", value, "\n".to_string());
        } else {
          if  esc == "t".to_string() {
            value = format!("{}{}", value, "\t".to_string());
          } else {
            if  esc == "r".to_string() {
              value = format!("{}{}", value, "\r".to_string());
            } else {
              if  esc == "\\".to_string() {
                value = format!("{}{}", value, "\\".to_string());
              } else {
                if  esc == quote {
                  value = format!("{}{}", value, quote);
                } else {
                  value = format!("{}{}", value, esc);
                }
              }
            }
          }
        }
      } else {
        value = format!("{}{}", value, self.advance());
      }
    }
    return self.makeToken("String".to_string(), value, startPos, startLine, startCol).clone();
  }
  fn readTemplateLiteral(&mut self, ) -> Token {
    let startPos : i64 = self.pos;
    let startLine : i64 = self.line;
    let startCol : i64 = self.col;
    self.advance();
    let mut value : String = "".to_string();
    let mut hasExpressions : bool = false;
    while self.pos < self.__len {
      let ch : String = self.peek();
      if  ch == "`".to_string() {
        self.advance();
        if  hasExpressions {
          return self.makeToken("TemplateLiteral".to_string(), value, startPos, startLine, startCol).clone();
        } else {
          return self.makeToken("TemplateLiteral".to_string(), value, startPos, startLine, startCol).clone();
        }
      }
      if  ch == "\\".to_string() {
        self.advance();
        let esc : String = self.advance();
        if  esc == "n".to_string() {
          value = format!("{}{}", value, "\n".to_string());
        }
        if  esc == "t".to_string() {
          value = format!("{}{}", value, "\t".to_string());
        }
        if  esc == "r".to_string() {
          value = format!("{}{}", value, "\r".to_string());
        }
        if  esc == "\\".to_string() {
          value = format!("{}{}", value, "\\".to_string());
        }
        if  esc == "`".to_string() {
          value = format!("{}{}", value, "`".to_string());
        }
        if  esc == "$".to_string() {
          value = format!("{}{}", value, "$".to_string());
        }
      } else {
        if  ch == "$".to_string() {
          if  self.peekAt(1) == "{".to_string() {
            hasExpressions = true;
            value = format!("{}{}", value, self.advance());
            value = format!("{}{}", value, self.advance());
          } else {
            value = format!("{}{}", value, self.advance());
          }
        } else {
          value = format!("{}{}", value, self.advance());
        }
      }
    }
    return self.makeToken("TemplateLiteral".to_string(), value, startPos, startLine, startCol).clone();
  }
  fn readNumber(&mut self, ) -> Token {
    let startPos : i64 = self.pos;
    let startLine : i64 = self.line;
    let startCol : i64 = self.col;
    let mut value : String = "".to_string();
    while self.pos < self.__len {
      let ch : String = self.peek();
      if  self.isDigit(ch) {
        value = format!("{}{}", value, self.advance());
      } else {
        if  ch == ".".to_string() {
          value = format!("{}{}", value, self.advance());
        } else {
          return self.makeToken("Number".to_string(), value, startPos, startLine, startCol).clone();
        }
      }
    }
    return self.makeToken("Number".to_string(), value, startPos, startLine, startCol).clone();
  }
  fn readIdentifier(&mut self, ) -> Token {
    let startPos : i64 = self.pos;
    let startLine : i64 = self.line;
    let startCol : i64 = self.col;
    let mut value : String = "".to_string();
    while self.pos < self.__len {
      let ch : String = self.peek();
      if  self.isAlphaNumCh(ch) {
        value = format!("{}{}", value, self.advance());
      } else {
        return self.makeToken(self.identType(value), value, startPos, startLine, startCol).clone();
      }
    }
    return self.makeToken(self.identType(value), value, startPos, startLine, startCol).clone();
  }
  fn identType(&mut self, value : String) -> String {
    if  value == "var".to_string() {
      return "Keyword".to_string().clone();
    }
    if  value == "let".to_string() {
      return "Keyword".to_string().clone();
    }
    if  value == "const".to_string() {
      return "Keyword".to_string().clone();
    }
    if  value == "function".to_string() {
      return "Keyword".to_string().clone();
    }
    if  value == "return".to_string() {
      return "Keyword".to_string().clone();
    }
    if  value == "if".to_string() {
      return "Keyword".to_string().clone();
    }
    if  value == "else".to_string() {
      return "Keyword".to_string().clone();
    }
    if  value == "while".to_string() {
      return "Keyword".to_string().clone();
    }
    if  value == "for".to_string() {
      return "Keyword".to_string().clone();
    }
    if  value == "in".to_string() {
      return "Keyword".to_string().clone();
    }
    if  value == "of".to_string() {
      return "Keyword".to_string().clone();
    }
    if  value == "switch".to_string() {
      return "Keyword".to_string().clone();
    }
    if  value == "case".to_string() {
      return "Keyword".to_string().clone();
    }
    if  value == "default".to_string() {
      return "Keyword".to_string().clone();
    }
    if  value == "break".to_string() {
      return "Keyword".to_string().clone();
    }
    if  value == "continue".to_string() {
      return "Keyword".to_string().clone();
    }
    if  value == "try".to_string() {
      return "Keyword".to_string().clone();
    }
    if  value == "catch".to_string() {
      return "Keyword".to_string().clone();
    }
    if  value == "finally".to_string() {
      return "Keyword".to_string().clone();
    }
    if  value == "throw".to_string() {
      return "Keyword".to_string().clone();
    }
    if  value == "new".to_string() {
      return "Keyword".to_string().clone();
    }
    if  value == "typeof".to_string() {
      return "Keyword".to_string().clone();
    }
    if  value == "instanceof".to_string() {
      return "Keyword".to_string().clone();
    }
    if  value == "this".to_string() {
      return "Keyword".to_string().clone();
    }
    if  value == "class".to_string() {
      return "Keyword".to_string().clone();
    }
    if  value == "extends".to_string() {
      return "Keyword".to_string().clone();
    }
    if  value == "static".to_string() {
      return "Keyword".to_string().clone();
    }
    if  value == "get".to_string() {
      return "Keyword".to_string().clone();
    }
    if  value == "set".to_string() {
      return "Keyword".to_string().clone();
    }
    if  value == "super".to_string() {
      return "Keyword".to_string().clone();
    }
    if  value == "async".to_string() {
      return "Keyword".to_string().clone();
    }
    if  value == "await".to_string() {
      return "Keyword".to_string().clone();
    }
    if  value == "yield".to_string() {
      return "Keyword".to_string().clone();
    }
    if  value == "import".to_string() {
      return "Keyword".to_string().clone();
    }
    if  value == "export".to_string() {
      return "Keyword".to_string().clone();
    }
    if  value == "from".to_string() {
      return "Keyword".to_string().clone();
    }
    if  value == "as".to_string() {
      return "Keyword".to_string().clone();
    }
    if  value == "true".to_string() {
      return "Boolean".to_string().clone();
    }
    if  value == "false".to_string() {
      return "Boolean".to_string().clone();
    }
    if  value == "null".to_string() {
      return "Null".to_string().clone();
    }
    return "Identifier".to_string().clone();
  }
  fn nextToken(&mut self, ) -> Token {
    self.skipWhitespace();
    if  self.pos >= self.__len {
      return self.makeToken("EOF".to_string(), "".to_string(), self.pos, self.line, self.col).clone();
    }
    let ch : String = self.peek();
    let startPos : i64 = self.pos;
    let startLine : i64 = self.line;
    let startCol : i64 = self.col;
    if  ch == "/".to_string() {
      let next : String = self.peekAt(1);
      if  next == "/".to_string() {
        return self.readLineComment().clone();
      }
      if  next == "*".to_string() {
        return self.readBlockComment().clone();
      }
    }
    if  ch == "\"".to_string() {
      return self.readString("\"".to_string()).clone();
    }
    if  ch == "'".to_string() {
      return self.readString("'".to_string()).clone();
    }
    if  ch == "`".to_string() {
      return self.readTemplateLiteral().clone();
    }
    if  self.isDigit(ch) {
      return self.readNumber().clone();
    }
    if  self.isAlpha(ch) {
      return self.readIdentifier().clone();
    }
    let next_1 : String = self.peekAt(1);
    if  ch == "=".to_string() {
      if  next_1 == "=".to_string() {
        if  self.peekAt(2) == "=".to_string() {
          self.advance();
          self.advance();
          self.advance();
          return self.makeToken("Punctuator".to_string(), "===".to_string(), startPos, startLine, startCol).clone();
        }
      }
    }
    if  ch == "!".to_string() {
      if  next_1 == "=".to_string() {
        if  self.peekAt(2) == "=".to_string() {
          self.advance();
          self.advance();
          self.advance();
          return self.makeToken("Punctuator".to_string(), "!==".to_string(), startPos, startLine, startCol).clone();
        }
      }
    }
    if  ch == "=".to_string() {
      if  next_1 == ">".to_string() {
        self.advance();
        self.advance();
        return self.makeToken("Punctuator".to_string(), "=>".to_string(), startPos, startLine, startCol).clone();
      }
    }
    if  ch == "=".to_string() {
      if  next_1 == "=".to_string() {
        self.advance();
        self.advance();
        return self.makeToken("Punctuator".to_string(), "==".to_string(), startPos, startLine, startCol).clone();
      }
    }
    if  ch == "!".to_string() {
      if  next_1 == "=".to_string() {
        self.advance();
        self.advance();
        return self.makeToken("Punctuator".to_string(), "!=".to_string(), startPos, startLine, startCol).clone();
      }
    }
    if  ch == "<".to_string() {
      if  next_1 == "=".to_string() {
        self.advance();
        self.advance();
        return self.makeToken("Punctuator".to_string(), "<=".to_string(), startPos, startLine, startCol).clone();
      }
    }
    if  ch == ">".to_string() {
      if  next_1 == "=".to_string() {
        self.advance();
        self.advance();
        return self.makeToken("Punctuator".to_string(), ">=".to_string(), startPos, startLine, startCol).clone();
      }
    }
    if  ch == "&".to_string() {
      if  next_1 == "&".to_string() {
        self.advance();
        self.advance();
        return self.makeToken("Punctuator".to_string(), "&&".to_string(), startPos, startLine, startCol).clone();
      }
    }
    if  ch == "|".to_string() {
      if  next_1 == "|".to_string() {
        self.advance();
        self.advance();
        return self.makeToken("Punctuator".to_string(), "||".to_string(), startPos, startLine, startCol).clone();
      }
    }
    if  ch == "?".to_string() {
      if  next_1 == "?".to_string() {
        self.advance();
        self.advance();
        return self.makeToken("Punctuator".to_string(), "??".to_string(), startPos, startLine, startCol).clone();
      }
      if  next_1 == ".".to_string() {
        self.advance();
        self.advance();
        return self.makeToken("Punctuator".to_string(), "?.".to_string(), startPos, startLine, startCol).clone();
      }
    }
    if  ch == "+".to_string() {
      if  next_1 == "+".to_string() {
        self.advance();
        self.advance();
        return self.makeToken("Punctuator".to_string(), "++".to_string(), startPos, startLine, startCol).clone();
      }
    }
    if  ch == "-".to_string() {
      if  next_1 == "-".to_string() {
        self.advance();
        self.advance();
        return self.makeToken("Punctuator".to_string(), "--".to_string(), startPos, startLine, startCol).clone();
      }
    }
    if  ch == ".".to_string() {
      if  next_1 == ".".to_string() {
        if  self.peekAt(2) == ".".to_string() {
          self.advance();
          self.advance();
          self.advance();
          return self.makeToken("Punctuator".to_string(), "...".to_string(), startPos, startLine, startCol).clone();
        }
      }
    }
    self.advance();
    return self.makeToken("Punctuator".to_string(), ch, startPos, startLine, startCol).clone();
  }
  fn readRegexLiteral(&mut self, ) -> Token {
    let startPos : i64 = self.pos;
    let startLine : i64 = self.line;
    let startCol : i64 = self.col;
    self.advance();
    let mut pattern : String = "".to_string();
    let mut inCharClass : bool = false;
    while self.pos < self.__len {
      let ch : String = self.peek();
      if  ch == "[".to_string() {
        inCharClass = true;
        pattern = format!("{}{}", pattern, self.advance());
      } else {
        if  ch == "]".to_string() {
          inCharClass = false;
          pattern = format!("{}{}", pattern, self.advance());
        } else {
          if  ch == "\\".to_string() {
            pattern = format!("{}{}", pattern, self.advance());
            if  self.pos < self.__len {
              pattern = format!("{}{}", pattern, self.advance());
            }
          } else {
            if  (ch == "/".to_string()) && (inCharClass == false) {
              self.advance();
              break;
            } else {
              if  (ch == "\n".to_string()) || (ch == "\r".to_string()) {
                return self.makeToken("RegexLiteral".to_string(), pattern, startPos, startLine, startCol).clone();
              } else {
                pattern = format!("{}{}", pattern, self.advance());
              }
            }
          }
        }
      }
    }
    let mut flags : String = "".to_string();
    while self.pos < self.__len {
      let ch_1 : String = self.peek();
      if  (((((ch_1 == "g".to_string()) || (ch_1 == "i".to_string())) || (ch_1 == "m".to_string())) || (ch_1 == "s".to_string())) || (ch_1 == "u".to_string())) || (ch_1 == "y".to_string()) {
        flags = format!("{}{}", flags, self.advance());
      } else {
        break;
      }
    }
    let fullValue : String = format!("{}{}", (format!("{}{}", pattern, "/".to_string())), flags);
    return self.makeToken("RegexLiteral".to_string(), fullValue, startPos, startLine, startCol).clone();
  }
  fn tokenize(&mut self, ) -> Vec<Token> {
    let mut tokens : Vec<Token> = Vec::new();
    while true {
      let mut tok : Token = self.nextToken();
      tokens.push(tok);
      if  tok.tokenType == "EOF".to_string() {
        return tokens;
      }
    }
    return tokens;
  }
}
#[derive(Clone)]
struct JSNode { 
  nodeType : String, 
  start : i64, 
  end : i64, 
  line : i64, 
  col : i64, 
  strValue : String, 
  strValue2 : String, 
  children : Vec<JSNode>, 
  left : Option<JSNode>, 
  right : Option<JSNode>, 
  test : Option<JSNode>, 
  body : Option<JSNode>, 
  alternate : Option<JSNode>, 
  leadingComments : Vec<JSNode>, 
  trailingComment : Option<JSNode>, 
}
impl JSNode { 
  
  pub fn new() ->  JSNode {
    let mut me = JSNode { 
      nodeType:"".to_string(), 
      start:0, 
      end:0, 
      line:0, 
      col:0, 
      strValue:"".to_string(), 
      strValue2:"".to_string(), 
      children: Vec::new(), 
      leadingComments: Vec::new(), 
    };
    return me;
  }
}
#[derive(Clone)]
struct SimpleParser { 
  tokens : Vec<Token>, 
  pos : i64, 
  currentToken : Option<Token>, 
  errors : Vec<String>, 
  pendingComments : Vec<JSNode>, 
  source : String, 
  lexer : Option<Lexer>, 
}
impl SimpleParser { 
  
  pub fn new() ->  SimpleParser {
    let mut me = SimpleParser { 
      tokens: Vec::new(), 
      pos:0, 
      errors: Vec::new(), 
      pendingComments: Vec::new(), 
      source:"".to_string(), 
    };
    return me;
  }
  fn initParser(&mut self, toks : Vec<Token>) -> () {
    self.tokens = toks;
    self.pos = 0;
    if  (toks.len()) > 0 {
      self.currentToken = toks[0 as usize].clone();
    }
    self.skipComments();
  }
  fn initParserWithSource(&mut self, toks : Vec<Token>, src : String) -> () {
    self.tokens = toks;
    self.source = src;
    self.lexer = Lexer::new(src);
    self.pos = 0;
    if  (toks.len()) > 0 {
      self.currentToken = toks[0 as usize].clone();
    }
    self.skipComments();
  }
  fn isCommentToken(&mut self, ) -> bool {
    let t : String = self.peekType();
    if  t == "LineComment".to_string() {
      return true;
    }
    if  t == "BlockComment".to_string() {
      return true;
    }
    if  t == "JSDocComment".to_string() {
      return true;
    }
    return false;
  }
  fn skipComments(&mut self, ) -> () {
    while self.isCommentToken() {
      let mut tok : Token = self.peek();
      let mut commentNode : JSNode = JSNode::new();
      commentNode.nodeType = tok.tokenType;
      commentNode.strValue = tok.value;
      commentNode.line = tok.line;
      commentNode.col = tok.col;
      commentNode.start = tok.start;
      commentNode.end = tok.end;
      self.pendingComments.push(commentNode);
      self.advanceRaw();
    }
  }
  fn advanceRaw(&mut self, ) -> () {
    self.pos = self.pos + 1;
    if  self.pos < (self.tokens.len()) {
      self.currentToken = self.tokens[self.pos as usize].clone();
    } else {
      let mut eof : Token = Token::new();
      eof.tokenType = "EOF".to_string();
      eof.value = "".to_string();
      self.currentToken = eof;
    }
  }
  fn collectComments(&mut self, ) -> Vec<JSNode> {
    let mut comments : Vec<JSNode> = Vec::new();
    for i in 0..self.pendingComments.len() {
      let mut c = self.pendingComments[i as usize].clone();
      comments.push(c);
      self.pendingComments[i as usize] = c;
    }
    let mut empty : Vec<JSNode> = Vec::new();
    self.pendingComments = empty;
    return comments;
  }
  fn attachComments(&mut self, node : JSNode) -> () {
    let mut comments : Vec<JSNode> = self.collectComments();
    for i in 0..comments.len() {
      let mut c = comments[i as usize].clone();
      node.leadingComments.push(c);
      comments[i as usize] = c;
    }
  }
  fn peek(&mut self, ) -> Token {
    return self.currentToken.unwrap().clone();
  }
  fn peekType(&mut self, ) -> String {
    if  self.currentToken.is_null() {
      return "EOF".to_string().clone();
    }
    let mut tok : Token = self.currentToken.unwrap();
    return tok.tokenType.clone();
  }
  fn peekValue(&mut self, ) -> String {
    if  self.currentToken.is_null() {
      return "".to_string().clone();
    }
    let mut tok : Token = self.currentToken.unwrap();
    return tok.value.clone();
  }
  fn advance(&mut self, ) -> () {
    self.advanceRaw();
    self.skipComments();
  }
  fn addError(&mut self, msg : String) -> () {
    self.errors.push(msg);
  }
  fn expect(&mut self, expectedType : String) -> Token {
    let mut tok : Token = self.peek();
    if  tok.tokenType != expectedType {
      let err : String = format!("{}{}", (format!("{}{}", (format!("{}{}", (format!("{}{}", ([(format!("{}{}", (["Parse error at line ".to_string() , (tok.line.to_string()) ].join("")), ":".to_string())) , (tok.col.to_string()) ].join("")), ": expected ".to_string())), expectedType)), " but got ".to_string())), tok.tokenType);
      self.addError(err);
    }
    self.advance();
    return tok.clone();
  }
  fn expectValue(&mut self, expectedValue : String) -> Token {
    let mut tok : Token = self.peek();
    if  tok.value != expectedValue {
      let err : String = format!("{}{}", (format!("{}{}", (format!("{}{}", (format!("{}{}", (format!("{}{}", ([(format!("{}{}", (["Parse error at line ".to_string() , (tok.line.to_string()) ].join("")), ":".to_string())) , (tok.col.to_string()) ].join("")), ": expected '".to_string())), expectedValue)), "' but got '".to_string())), tok.value)), "'".to_string());
      self.addError(err);
    }
    self.advance();
    return tok.clone();
  }
  fn isAtEnd(&mut self, ) -> bool {
    let t : String = self.peekType();
    return t == "EOF".to_string();
  }
  fn matchType(&mut self, tokenType : String) -> bool {
    let t : String = self.peekType();
    return t == tokenType;
  }
  fn matchValue(&mut self, value : String) -> bool {
    let v : String = self.peekValue();
    return v == value;
  }
  fn hasErrors(&mut self, ) -> bool {
    return (self.errors.len()) > 0;
  }
  fn parseRegexLiteral(&mut self, ) -> JSNode {
    let mut tok : Token = self.peek();
    let startPos : i64 = tok.start;
    let startLine : i64 = tok.line;
    let startCol : i64 = tok.col;
    if  self.lexer.is_null() {
      let mut err : JSNode = JSNode::new();
      err.nodeType = "Identifier".to_string();
      err.strValue = "regex_error".to_string();
      self.advance();
      return err.clone();
    }
    let mut lex : Lexer = self.lexer.unwrap();
    lex.pos = startPos;
    lex.line = startLine;
    lex.col = startCol;
    let mut regexTok : Token = lex.readRegexLiteral();
    let fullValue : String = regexTok.value;
    let mut pattern : String = "".to_string();
    let mut flags : String = "".to_string();
    let mut lastSlash : i64 = -1;
    let mut i : i64 = 0;
    while i < (fullValue.len() as i64) {
      let ch : String = fullValue.chars().nth(i as usize).map(|c| c.to_string()).unwrap_or_default();
      if  ch == "/".to_string() {
        lastSlash = i;
      }
      i = i + 1;
    }
    if  lastSlash >= 0 {
      pattern = fullValue.chars().skip(0 as usize).take((lastSlash - 0) as usize).collect::<String>();
      flags = fullValue.chars().skip((lastSlash + 1) as usize).take(((fullValue.len() as i64) - (lastSlash + 1)) as usize).collect::<String>();
    } else {
      pattern = fullValue;
    }
    let mut regex : JSNode = JSNode::new();
    regex.nodeType = "RegexLiteral".to_string();
    regex.strValue = pattern;
    regex.strValue2 = flags;
    regex.start = startPos;
    regex.end = lex.pos;
    regex.line = startLine;
    regex.col = startCol;
    self.advance();
    while self.isAtEnd() == false {
      let mut nextTok : Token = self.peek();
      if  nextTok.start < lex.pos {
        self.advance();
      } else {
        break;
      }
    }
    return regex.clone();
  }
  fn parseProgram(&mut self, ) -> JSNode {
    let mut prog : JSNode = JSNode::new();
    prog.nodeType = "Program".to_string();
    while self.isAtEnd() == false {
      let mut stmt : JSNode = self.parseStatement();
      prog.children.push(stmt);
    }
    return prog.clone();
  }
  fn parseStatement(&mut self, ) -> JSNode {
    let mut comments : Vec<JSNode> = self.collectComments();
    let tokVal : String = self.peekValue();
    let mut stmt : Option<JSNode>;
    if  tokVal == "var".to_string() {
      stmt = self.parseVarDecl();
    }
    if  (stmt.is_null()) && (tokVal == "let".to_string()) {
      stmt = self.parseLetDecl();
    }
    if  (stmt.is_null()) && (tokVal == "const".to_string()) {
      stmt = self.parseConstDecl();
    }
    if  (stmt.is_null()) && (tokVal == "function".to_string()) {
      stmt = self.parseFuncDecl();
    }
    if  (stmt.is_null()) && (tokVal == "async".to_string()) {
      stmt = self.parseAsyncFuncDecl();
    }
    if  (stmt.is_null()) && (tokVal == "class".to_string()) {
      stmt = self.parseClass();
    }
    if  (stmt.is_null()) && (tokVal == "import".to_string()) {
      stmt = self.parseImport();
    }
    if  (stmt.is_null()) && (tokVal == "export".to_string()) {
      stmt = self.parseExport();
    }
    if  (stmt.is_null()) && (tokVal == "return".to_string()) {
      stmt = self.parseReturn();
    }
    if  (stmt.is_null()) && (tokVal == "if".to_string()) {
      stmt = self.parseIf();
    }
    if  (stmt.is_null()) && (tokVal == "while".to_string()) {
      stmt = self.parseWhile();
    }
    if  (stmt.is_null()) && (tokVal == "do".to_string()) {
      stmt = self.parseDoWhile();
    }
    if  (stmt.is_null()) && (tokVal == "for".to_string()) {
      stmt = self.parseFor();
    }
    if  (stmt.is_null()) && (tokVal == "switch".to_string()) {
      stmt = self.parseSwitch();
    }
    if  (stmt.is_null()) && (tokVal == "try".to_string()) {
      stmt = self.parseTry();
    }
    if  (stmt.is_null()) && (tokVal == "throw".to_string()) {
      stmt = self.parseThrow();
    }
    if  (stmt.is_null()) && (tokVal == "break".to_string()) {
      stmt = self.parseBreak();
    }
    if  (stmt.is_null()) && (tokVal == "continue".to_string()) {
      stmt = self.parseContinue();
    }
    if  (stmt.is_null()) && (tokVal == "{".to_string()) {
      stmt = self.parseBlock();
    }
    if  (stmt.is_null()) && (tokVal == ";".to_string()) {
      self.advance();
      let mut empty : JSNode = JSNode::new();
      empty.nodeType = "EmptyStatement".to_string();
      stmt = empty;
    }
    if  stmt.is_null() {
      stmt = self.parseExprStmt();
    }
    let mut result : JSNode = stmt.unwrap();
    for i in 0..comments.len() {
      let mut c = comments[i as usize].clone();
      result.leadingComments.push(c);
      comments[i as usize] = c;
    }
    return result.clone();
  }
  fn parseVarDecl(&mut self, ) -> JSNode {
    let mut decl : JSNode = JSNode::new();
    decl.nodeType = "VariableDeclaration".to_string();
    let mut startTok : Token = self.peek();
    decl.start = startTok.start;
    decl.line = startTok.line;
    decl.col = startTok.col;
    self.expectValue("var".to_string());
    let mut first : bool = true;
    while first || self.matchValue(",".to_string()) {
      if  first == false {
        self.advance();
      }
      first = false;
      let mut declarator : JSNode = JSNode::new();
      declarator.nodeType = "VariableDeclarator".to_string();
      let mut idTok : Token = self.expect("Identifier".to_string());
      let mut id : JSNode = JSNode::new();
      id.nodeType = "Identifier".to_string();
      id.strValue = idTok.value;
      id.start = idTok.start;
      id.line = idTok.line;
      id.col = idTok.col;
      declarator.left = id;
      declarator.start = idTok.start;
      declarator.line = idTok.line;
      declarator.col = idTok.col;
      if  self.matchValue("=".to_string()) {
        self.advance();
        let mut initExpr : JSNode = self.parseAssignment();
        declarator.right = initExpr;
      }
      decl.children.push(declarator);
    }
    if  self.matchValue(";".to_string()) {
      self.advance();
    }
    return decl.clone();
  }
  fn parseLetDecl(&mut self, ) -> JSNode {
    let mut decl : JSNode = JSNode::new();
    decl.nodeType = "VariableDeclaration".to_string();
    decl.strValue = "let".to_string();
    let mut startTok : Token = self.peek();
    decl.start = startTok.start;
    decl.line = startTok.line;
    decl.col = startTok.col;
    self.expectValue("let".to_string());
    let mut first : bool = true;
    while first || self.matchValue(",".to_string()) {
      if  first == false {
        self.advance();
      }
      first = false;
      let mut declarator : JSNode = JSNode::new();
      declarator.nodeType = "VariableDeclarator".to_string();
      let mut declTok : Token = self.peek();
      declarator.start = declTok.start;
      declarator.line = declTok.line;
      declarator.col = declTok.col;
      if  self.matchValue("[".to_string()) {
        let mut pattern : JSNode = self.parseArrayPattern();
        declarator.left = pattern;
      } else {
        if  self.matchValue("{".to_string()) {
          let mut pattern_1 : JSNode = self.parseObjectPattern();
          declarator.left = pattern_1;
        } else {
          let mut idTok : Token = self.expect("Identifier".to_string());
          let mut id : JSNode = JSNode::new();
          id.nodeType = "Identifier".to_string();
          id.strValue = idTok.value;
          id.start = idTok.start;
          id.line = idTok.line;
          id.col = idTok.col;
          declarator.left = id;
        }
      }
      if  self.matchValue("=".to_string()) {
        self.advance();
        let mut initExpr : JSNode = self.parseAssignment();
        declarator.right = initExpr;
      }
      decl.children.push(declarator);
    }
    if  self.matchValue(";".to_string()) {
      self.advance();
    }
    return decl.clone();
  }
  fn parseConstDecl(&mut self, ) -> JSNode {
    let mut decl : JSNode = JSNode::new();
    decl.nodeType = "VariableDeclaration".to_string();
    decl.strValue = "const".to_string();
    let mut startTok : Token = self.peek();
    decl.start = startTok.start;
    decl.line = startTok.line;
    decl.col = startTok.col;
    self.expectValue("const".to_string());
    let mut first : bool = true;
    while first || self.matchValue(",".to_string()) {
      if  first == false {
        self.advance();
      }
      first = false;
      let mut declarator : JSNode = JSNode::new();
      declarator.nodeType = "VariableDeclarator".to_string();
      let mut declTok : Token = self.peek();
      declarator.start = declTok.start;
      declarator.line = declTok.line;
      declarator.col = declTok.col;
      if  self.matchValue("[".to_string()) {
        let mut pattern : JSNode = self.parseArrayPattern();
        declarator.left = pattern;
      } else {
        if  self.matchValue("{".to_string()) {
          let mut pattern_1 : JSNode = self.parseObjectPattern();
          declarator.left = pattern_1;
        } else {
          let mut idTok : Token = self.expect("Identifier".to_string());
          let mut id : JSNode = JSNode::new();
          id.nodeType = "Identifier".to_string();
          id.strValue = idTok.value;
          id.start = idTok.start;
          id.line = idTok.line;
          id.col = idTok.col;
          declarator.left = id;
        }
      }
      if  self.matchValue("=".to_string()) {
        self.advance();
        let mut initExpr : JSNode = self.parseAssignment();
        declarator.right = initExpr;
      }
      decl.children.push(declarator);
    }
    if  self.matchValue(";".to_string()) {
      self.advance();
    }
    return decl.clone();
  }
  fn parseFuncDecl(&mut self, ) -> JSNode {
    let mut func : JSNode = JSNode::new();
    func.nodeType = "FunctionDeclaration".to_string();
    let mut startTok : Token = self.peek();
    func.start = startTok.start;
    func.line = startTok.line;
    func.col = startTok.col;
    self.expectValue("function".to_string());
    if  self.matchValue("*".to_string()) {
      func.strValue2 = "generator".to_string();
      self.advance();
    }
    let mut idTok : Token = self.expect("Identifier".to_string());
    func.strValue = idTok.value;
    self.expectValue("(".to_string());
    while (self.matchValue(")".to_string()) == false) && (self.isAtEnd() == false) {
      if  (func.children.len()) > 0 {
        self.expectValue(",".to_string());
      }
      if  self.matchValue(")".to_string()) || self.isAtEnd() {
        break;
      }
      if  self.matchValue("...".to_string()) {
        let mut restTok : Token = self.peek();
        self.advance();
        let mut paramTok : Token = self.expect("Identifier".to_string());
        let mut rest : JSNode = JSNode::new();
        rest.nodeType = "RestElement".to_string();
        rest.strValue = paramTok.value;
        rest.start = restTok.start;
        rest.line = restTok.line;
        rest.col = restTok.col;
        func.children.push(rest);
      } else {
        if  self.matchValue("[".to_string()) {
          let mut pattern : JSNode = self.parseArrayPattern();
          func.children.push(pattern);
        } else {
          if  self.matchValue("{".to_string()) {
            let mut pattern_1 : JSNode = self.parseObjectPattern();
            func.children.push(pattern_1);
          } else {
            let mut paramTok_1 : Token = self.expect("Identifier".to_string());
            let mut param : JSNode = JSNode::new();
            param.nodeType = "Identifier".to_string();
            param.strValue = paramTok_1.value;
            param.start = paramTok_1.start;
            param.line = paramTok_1.line;
            param.col = paramTok_1.col;
            func.children.push(param);
          }
        }
      }
    }
    self.expectValue(")".to_string());
    let mut body : JSNode = self.parseBlock();
    func.body = body;
    return func.clone();
  }
  fn parseFunctionExpression(&mut self, ) -> JSNode {
    let mut func : JSNode = JSNode::new();
    func.nodeType = "FunctionExpression".to_string();
    let mut startTok : Token = self.peek();
    func.start = startTok.start;
    func.line = startTok.line;
    func.col = startTok.col;
    self.expectValue("function".to_string());
    if  self.matchValue("*".to_string()) {
      func.strValue2 = "generator".to_string();
      self.advance();
    }
    if  self.matchType("Identifier".to_string()) {
      let mut idTok : Token = self.expect("Identifier".to_string());
      func.strValue = idTok.value;
    }
    self.expectValue("(".to_string());
    while (self.matchValue(")".to_string()) == false) && (self.isAtEnd() == false) {
      if  (func.children.len()) > 0 {
        self.expectValue(",".to_string());
      }
      if  self.matchValue(")".to_string()) || self.isAtEnd() {
        break;
      }
      if  self.matchValue("...".to_string()) {
        let mut restTok : Token = self.peek();
        self.advance();
        let mut paramTok : Token = self.expect("Identifier".to_string());
        let mut rest : JSNode = JSNode::new();
        rest.nodeType = "RestElement".to_string();
        rest.strValue = paramTok.value;
        rest.start = restTok.start;
        rest.line = restTok.line;
        rest.col = restTok.col;
        func.children.push(rest);
      } else {
        if  self.matchValue("[".to_string()) {
          let mut pattern : JSNode = self.parseArrayPattern();
          func.children.push(pattern);
        } else {
          if  self.matchValue("{".to_string()) {
            let mut pattern_1 : JSNode = self.parseObjectPattern();
            func.children.push(pattern_1);
          } else {
            let mut paramTok_1 : Token = self.expect("Identifier".to_string());
            let mut param : JSNode = JSNode::new();
            param.nodeType = "Identifier".to_string();
            param.strValue = paramTok_1.value;
            param.start = paramTok_1.start;
            param.line = paramTok_1.line;
            param.col = paramTok_1.col;
            func.children.push(param);
          }
        }
      }
    }
    self.expectValue(")".to_string());
    let mut body : JSNode = self.parseBlock();
    func.body = body;
    return func.clone();
  }
  fn parseAsyncFuncDecl(&mut self, ) -> JSNode {
    let mut func : JSNode = JSNode::new();
    func.nodeType = "FunctionDeclaration".to_string();
    let mut startTok : Token = self.peek();
    func.start = startTok.start;
    func.line = startTok.line;
    func.col = startTok.col;
    func.strValue2 = "async".to_string();
    self.expectValue("async".to_string());
    self.expectValue("function".to_string());
    if  self.matchValue("*".to_string()) {
      func.strValue2 = "async-generator".to_string();
      self.advance();
    }
    let mut idTok : Token = self.expect("Identifier".to_string());
    func.strValue = idTok.value;
    self.expectValue("(".to_string());
    while (self.matchValue(")".to_string()) == false) && (self.isAtEnd() == false) {
      if  (func.children.len()) > 0 {
        self.expectValue(",".to_string());
      }
      if  self.matchValue(")".to_string()) || self.isAtEnd() {
        break;
      }
      let mut paramTok : Token = self.expect("Identifier".to_string());
      let mut param : JSNode = JSNode::new();
      param.nodeType = "Identifier".to_string();
      param.strValue = paramTok.value;
      param.start = paramTok.start;
      param.line = paramTok.line;
      param.col = paramTok.col;
      func.children.push(param);
    }
    self.expectValue(")".to_string());
    let mut body : JSNode = self.parseBlock();
    func.body = body;
    return func.clone();
  }
  fn parseClass(&mut self, ) -> JSNode {
    let mut classNode : JSNode = JSNode::new();
    classNode.nodeType = "ClassDeclaration".to_string();
    let mut startTok : Token = self.peek();
    classNode.start = startTok.start;
    classNode.line = startTok.line;
    classNode.col = startTok.col;
    self.expectValue("class".to_string());
    let mut idTok : Token = self.expect("Identifier".to_string());
    classNode.strValue = idTok.value;
    if  self.matchValue("extends".to_string()) {
      self.advance();
      let mut superTok : Token = self.expect("Identifier".to_string());
      let mut superClass : JSNode = JSNode::new();
      superClass.nodeType = "Identifier".to_string();
      superClass.strValue = superTok.value;
      superClass.start = superTok.start;
      superClass.line = superTok.line;
      superClass.col = superTok.col;
      classNode.left = superClass;
    }
    let mut body : JSNode = JSNode::new();
    body.nodeType = "ClassBody".to_string();
    let mut bodyStart : Token = self.peek();
    body.start = bodyStart.start;
    body.line = bodyStart.line;
    body.col = bodyStart.col;
    self.expectValue("{".to_string());
    while (self.matchValue("}".to_string()) == false) && (self.isAtEnd() == false) {
      let mut method : JSNode = self.parseClassMethod();
      body.children.push(method);
    }
    self.expectValue("}".to_string());
    classNode.body = body;
    return classNode.clone();
  }
  fn parseClassMethod(&mut self, ) -> JSNode {
    let mut method : JSNode = JSNode::new();
    method.nodeType = "MethodDefinition".to_string();
    let mut startTok : Token = self.peek();
    method.start = startTok.start;
    method.line = startTok.line;
    method.col = startTok.col;
    let mut isStatic : bool = false;
    if  self.matchValue("static".to_string()) {
      isStatic = true;
      method.strValue2 = "static".to_string();
      self.advance();
    }
    let mut kind : String = "method".to_string();
    if  self.matchValue("get".to_string()) {
      let nextTok : String = self.peekAt(1);
      if  nextTok != "(".to_string() {
        kind = "get".to_string();
        self.advance();
      }
    }
    if  self.matchValue("set".to_string()) {
      let nextTok_1 : String = self.peekAt(1);
      if  nextTok_1 != "(".to_string() {
        kind = "set".to_string();
        self.advance();
      }
    }
    let mut nameTok : Token = self.expect("Identifier".to_string());
    method.strValue = nameTok.value;
    if  nameTok.value == "constructor".to_string() {
      kind = "constructor".to_string();
    }
    let mut func : JSNode = JSNode::new();
    func.nodeType = "FunctionExpression".to_string();
    func.start = nameTok.start;
    func.line = nameTok.line;
    func.col = nameTok.col;
    self.expectValue("(".to_string());
    while (self.matchValue(")".to_string()) == false) && (self.isAtEnd() == false) {
      if  (func.children.len()) > 0 {
        self.expectValue(",".to_string());
      }
      if  self.matchValue(")".to_string()) || self.isAtEnd() {
        break;
      }
      let mut paramTok : Token = self.expect("Identifier".to_string());
      let mut param : JSNode = JSNode::new();
      param.nodeType = "Identifier".to_string();
      param.strValue = paramTok.value;
      param.start = paramTok.start;
      param.line = paramTok.line;
      param.col = paramTok.col;
      func.children.push(param);
    }
    self.expectValue(")".to_string());
    let mut funcBody : JSNode = self.parseBlock();
    func.body = funcBody;
    method.body = func;
    return method.clone();
  }
  fn peekAt(&mut self, offset : i64) -> String {
    let targetPos : i64 = self.pos + offset;
    if  targetPos >= (self.tokens.len()) {
      return "".to_string().clone();
    }
    let mut tok : Token = self.tokens[targetPos as usize].clone();
    return tok.value.clone();
  }
  fn parseImport(&mut self, ) -> JSNode {
    let mut importNode : JSNode = JSNode::new();
    importNode.nodeType = "ImportDeclaration".to_string();
    let mut startTok : Token = self.peek();
    importNode.start = startTok.start;
    importNode.line = startTok.line;
    importNode.col = startTok.col;
    self.expectValue("import".to_string());
    if  self.matchType("String".to_string()) {
      let mut sourceTok : Token = self.peek();
      self.advance();
      let mut source_1 : JSNode = JSNode::new();
      source_1.nodeType = "Literal".to_string();
      source_1.strValue = sourceTok.value;
      source_1.strValue2 = "string".to_string();
      source_1.start = sourceTok.start;
      source_1.line = sourceTok.line;
      source_1.col = sourceTok.col;
      importNode.right = source_1;
      if  self.matchValue(";".to_string()) {
        self.advance();
      }
      return importNode.clone();
    }
    if  self.matchValue("*".to_string()) {
      self.advance();
      self.expectValue("as".to_string());
      let mut localTok : Token = self.expect("Identifier".to_string());
      let mut specifier : JSNode = JSNode::new();
      specifier.nodeType = "ImportNamespaceSpecifier".to_string();
      specifier.strValue = localTok.value;
      specifier.start = localTok.start;
      specifier.line = localTok.line;
      specifier.col = localTok.col;
      importNode.children.push(specifier);
      self.expectValue("from".to_string());
      let mut sourceTok_1 : Token = self.expect("String".to_string());
      let mut source_2 : JSNode = JSNode::new();
      source_2.nodeType = "Literal".to_string();
      source_2.strValue = sourceTok_1.value;
      source_2.strValue2 = "string".to_string();
      source_2.start = sourceTok_1.start;
      source_2.line = sourceTok_1.line;
      source_2.col = sourceTok_1.col;
      importNode.right = source_2;
      if  self.matchValue(";".to_string()) {
        self.advance();
      }
      return importNode.clone();
    }
    if  self.matchType("Identifier".to_string()) {
      let mut defaultTok : Token = self.expect("Identifier".to_string());
      let mut defaultSpec : JSNode = JSNode::new();
      defaultSpec.nodeType = "ImportDefaultSpecifier".to_string();
      defaultSpec.strValue = defaultTok.value;
      defaultSpec.start = defaultTok.start;
      defaultSpec.line = defaultTok.line;
      defaultSpec.col = defaultTok.col;
      importNode.children.push(defaultSpec);
      if  self.matchValue(",".to_string()) {
        self.advance();
        if  self.matchValue("*".to_string()) {
          self.advance();
          self.expectValue("as".to_string());
          let mut localTok_1 : Token = self.expect("Identifier".to_string());
          let mut nsSpec : JSNode = JSNode::new();
          nsSpec.nodeType = "ImportNamespaceSpecifier".to_string();
          nsSpec.strValue = localTok_1.value;
          nsSpec.start = localTok_1.start;
          nsSpec.line = localTok_1.line;
          nsSpec.col = localTok_1.col;
          importNode.children.push(nsSpec);
        } else {
          self.parseImportSpecifiers(importNode);
        }
      }
      self.expectValue("from".to_string());
    } else {
      if  self.matchValue("{".to_string()) {
        self.parseImportSpecifiers(importNode);
        self.expectValue("from".to_string());
      }
    }
    let mut sourceTok_2 : Token = self.expect("String".to_string());
    let mut source_3 : JSNode = JSNode::new();
    source_3.nodeType = "Literal".to_string();
    source_3.strValue = sourceTok_2.value;
    source_3.strValue2 = "string".to_string();
    source_3.start = sourceTok_2.start;
    source_3.line = sourceTok_2.line;
    source_3.col = sourceTok_2.col;
    importNode.right = source_3;
    if  self.matchValue(";".to_string()) {
      self.advance();
    }
    return importNode.clone();
  }
  fn parseImportSpecifiers(&mut self, importNode : JSNode) -> () {
    self.expectValue("{".to_string());
    while (self.matchValue("}".to_string()) == false) && (self.isAtEnd() == false) {
      if  (importNode.children.len()) > 0 {
        if  self.matchValue(",".to_string()) {
          self.advance();
        }
      }
      if  self.matchValue("}".to_string()) || self.isAtEnd() {
        break;
      }
      let mut specifier : JSNode = JSNode::new();
      specifier.nodeType = "ImportSpecifier".to_string();
      let mut importedTok : Token = self.expect("Identifier".to_string());
      specifier.strValue = importedTok.value;
      specifier.start = importedTok.start;
      specifier.line = importedTok.line;
      specifier.col = importedTok.col;
      if  self.matchValue("as".to_string()) {
        self.advance();
        let mut localTok : Token = self.expect("Identifier".to_string());
        specifier.strValue2 = localTok.value;
      }
      importNode.children.push(specifier);
    }
    self.expectValue("}".to_string());
  }
  fn parseExport(&mut self, ) -> JSNode {
    let mut exportNode : JSNode = JSNode::new();
    exportNode.nodeType = "ExportNamedDeclaration".to_string();
    let mut startTok : Token = self.peek();
    exportNode.start = startTok.start;
    exportNode.line = startTok.line;
    exportNode.col = startTok.col;
    self.expectValue("export".to_string());
    if  self.matchValue("default".to_string()) {
      exportNode.nodeType = "ExportDefaultDeclaration".to_string();
      self.advance();
      if  self.matchValue("function".to_string()) {
        let mut func : JSNode = self.parseFuncDecl();
        exportNode.left = func;
      } else {
        if  self.matchValue("async".to_string()) {
          let mut func_1 : JSNode = self.parseAsyncFuncDecl();
          exportNode.left = func_1;
        } else {
          if  self.matchValue("class".to_string()) {
            let mut cls : JSNode = self.parseClass();
            exportNode.left = cls;
          } else {
            let mut expr : JSNode = self.parseAssignment();
            exportNode.left = expr;
            if  self.matchValue(";".to_string()) {
              self.advance();
            }
          }
        }
      }
      return exportNode.clone();
    }
    if  self.matchValue("*".to_string()) {
      exportNode.nodeType = "ExportAllDeclaration".to_string();
      self.advance();
      if  self.matchValue("as".to_string()) {
        self.advance();
        let mut exportedTok : Token = self.expect("Identifier".to_string());
        exportNode.strValue = exportedTok.value;
      }
      self.expectValue("from".to_string());
      let mut sourceTok : Token = self.expect("String".to_string());
      let mut source_1 : JSNode = JSNode::new();
      source_1.nodeType = "Literal".to_string();
      source_1.strValue = sourceTok.value;
      source_1.strValue2 = "string".to_string();
      source_1.start = sourceTok.start;
      source_1.line = sourceTok.line;
      source_1.col = sourceTok.col;
      exportNode.right = source_1;
      if  self.matchValue(";".to_string()) {
        self.advance();
      }
      return exportNode.clone();
    }
    if  self.matchValue("{".to_string()) {
      self.parseExportSpecifiers(exportNode);
      if  self.matchValue("from".to_string()) {
        self.advance();
        let mut sourceTok_1 : Token = self.expect("String".to_string());
        let mut source_2 : JSNode = JSNode::new();
        source_2.nodeType = "Literal".to_string();
        source_2.strValue = sourceTok_1.value;
        source_2.strValue2 = "string".to_string();
        source_2.start = sourceTok_1.start;
        source_2.line = sourceTok_1.line;
        source_2.col = sourceTok_1.col;
        exportNode.right = source_2;
      }
      if  self.matchValue(";".to_string()) {
        self.advance();
      }
      return exportNode.clone();
    }
    if  self.matchValue("const".to_string()) {
      let mut decl : JSNode = self.parseConstDecl();
      exportNode.left = decl;
      return exportNode.clone();
    }
    if  self.matchValue("let".to_string()) {
      let mut decl_1 : JSNode = self.parseLetDecl();
      exportNode.left = decl_1;
      return exportNode.clone();
    }
    if  self.matchValue("var".to_string()) {
      let mut decl_2 : JSNode = self.parseVarDecl();
      exportNode.left = decl_2;
      return exportNode.clone();
    }
    if  self.matchValue("function".to_string()) {
      let mut func_2 : JSNode = self.parseFuncDecl();
      exportNode.left = func_2;
      return exportNode.clone();
    }
    if  self.matchValue("async".to_string()) {
      let mut func_3 : JSNode = self.parseAsyncFuncDecl();
      exportNode.left = func_3;
      return exportNode.clone();
    }
    if  self.matchValue("class".to_string()) {
      let mut cls_1 : JSNode = self.parseClass();
      exportNode.left = cls_1;
      return exportNode.clone();
    }
    let mut expr_1 : JSNode = self.parseExprStmt();
    exportNode.left = expr_1;
    return exportNode.clone();
  }
  fn parseExportSpecifiers(&mut self, exportNode : JSNode) -> () {
    self.expectValue("{".to_string());
    while (self.matchValue("}".to_string()) == false) && (self.isAtEnd() == false) {
      let numChildren : i64 = exportNode.children.len();
      if  numChildren > 0 {
        if  self.matchValue(",".to_string()) {
          self.advance();
        }
      }
      if  self.matchValue("}".to_string()) || self.isAtEnd() {
        break;
      }
      let mut specifier : JSNode = JSNode::new();
      specifier.nodeType = "ExportSpecifier".to_string();
      let mut localTok : Token = self.peek();
      if  self.matchType("Identifier".to_string()) || self.matchValue("default".to_string()) {
        self.advance();
        specifier.strValue = localTok.value;
        specifier.start = localTok.start;
        specifier.line = localTok.line;
        specifier.col = localTok.col;
      } else {
        let err : String = format!("{}{}", (format!("{}{}", ([(format!("{}{}", (["Parse error at line ".to_string() , (localTok.line.to_string()) ].join("")), ":".to_string())) , (localTok.col.to_string()) ].join("")), ": expected Identifier but got ".to_string())), localTok.tokenType);
        self.addError(err);
        self.advance();
      }
      if  self.matchValue("as".to_string()) {
        self.advance();
        let mut exportedTok : Token = self.expect("Identifier".to_string());
        specifier.strValue2 = exportedTok.value;
      }
      exportNode.children.push(specifier);
    }
    self.expectValue("}".to_string());
  }
  fn parseBlock(&mut self, ) -> JSNode {
    let mut block : JSNode = JSNode::new();
    block.nodeType = "BlockStatement".to_string();
    let mut startTok : Token = self.peek();
    block.start = startTok.start;
    block.line = startTok.line;
    block.col = startTok.col;
    self.expectValue("{".to_string());
    while (self.matchValue("}".to_string()) == false) && (self.isAtEnd() == false) {
      let mut stmt : JSNode = self.parseStatement();
      block.children.push(stmt);
    }
    self.expectValue("}".to_string());
    return block.clone();
  }
  fn parseReturn(&mut self, ) -> JSNode {
    let mut ret : JSNode = JSNode::new();
    ret.nodeType = "ReturnStatement".to_string();
    let mut startTok : Token = self.peek();
    ret.start = startTok.start;
    ret.line = startTok.line;
    ret.col = startTok.col;
    self.expectValue("return".to_string());
    if  (self.matchValue(";".to_string()) == false) && (self.isAtEnd() == false) {
      let mut arg : JSNode = self.parseExpr();
      ret.left = arg;
    }
    if  self.matchValue(";".to_string()) {
      self.advance();
    }
    return ret.clone();
  }
  fn parseIf(&mut self, ) -> JSNode {
    let mut ifStmt : JSNode = JSNode::new();
    ifStmt.nodeType = "IfStatement".to_string();
    let mut startTok : Token = self.peek();
    ifStmt.start = startTok.start;
    ifStmt.line = startTok.line;
    ifStmt.col = startTok.col;
    self.expectValue("if".to_string());
    self.expectValue("(".to_string());
    let mut test : JSNode = self.parseExpr();
    ifStmt.test = test;
    self.expectValue(")".to_string());
    let mut consequent : JSNode = self.parseStatement();
    ifStmt.body = consequent;
    if  self.matchValue("else".to_string()) {
      self.advance();
      let mut alt : JSNode = self.parseStatement();
      ifStmt.alternate = alt;
    }
    return ifStmt.clone();
  }
  fn parseWhile(&mut self, ) -> JSNode {
    let mut whileStmt : JSNode = JSNode::new();
    whileStmt.nodeType = "WhileStatement".to_string();
    let mut startTok : Token = self.peek();
    whileStmt.start = startTok.start;
    whileStmt.line = startTok.line;
    whileStmt.col = startTok.col;
    self.expectValue("while".to_string());
    self.expectValue("(".to_string());
    let mut test : JSNode = self.parseExpr();
    whileStmt.test = test;
    self.expectValue(")".to_string());
    let mut body : JSNode = self.parseStatement();
    whileStmt.body = body;
    return whileStmt.clone();
  }
  fn parseDoWhile(&mut self, ) -> JSNode {
    let mut doWhileStmt : JSNode = JSNode::new();
    doWhileStmt.nodeType = "DoWhileStatement".to_string();
    let mut startTok : Token = self.peek();
    doWhileStmt.start = startTok.start;
    doWhileStmt.line = startTok.line;
    doWhileStmt.col = startTok.col;
    self.expectValue("do".to_string());
    let mut body : JSNode = self.parseStatement();
    doWhileStmt.body = body;
    self.expectValue("while".to_string());
    self.expectValue("(".to_string());
    let mut test : JSNode = self.parseExpr();
    doWhileStmt.test = test;
    self.expectValue(")".to_string());
    if  self.matchValue(";".to_string()) {
      self.advance();
    }
    return doWhileStmt.clone();
  }
  fn parseFor(&mut self, ) -> JSNode {
    let mut forStmt : JSNode = JSNode::new();
    let mut startTok : Token = self.peek();
    forStmt.start = startTok.start;
    forStmt.line = startTok.line;
    forStmt.col = startTok.col;
    self.expectValue("for".to_string());
    self.expectValue("(".to_string());
    let mut isForOf : bool = false;
    let mut isForIn : bool = false;
    let mut leftNode : Option<JSNode>;
    if  self.matchValue(";".to_string()) == false {
      if  (self.matchValue("var".to_string()) || self.matchValue("let".to_string())) || self.matchValue("const".to_string()) {
        let keyword : String = self.peekValue();
        self.advance();
        let mut declarator : JSNode = JSNode::new();
        declarator.nodeType = "VariableDeclarator".to_string();
        let mut declTok : Token = self.peek();
        declarator.start = declTok.start;
        declarator.line = declTok.line;
        declarator.col = declTok.col;
        if  self.matchValue("[".to_string()) {
          let mut pattern : JSNode = self.parseArrayPattern();
          declarator.left = pattern;
        } else {
          if  self.matchValue("{".to_string()) {
            let mut pattern_1 : JSNode = self.parseObjectPattern();
            declarator.left = pattern_1;
          } else {
            let mut idTok : Token = self.expect("Identifier".to_string());
            let mut id : JSNode = JSNode::new();
            id.nodeType = "Identifier".to_string();
            id.strValue = idTok.value;
            id.start = idTok.start;
            id.line = idTok.line;
            id.col = idTok.col;
            declarator.left = id;
          }
        }
        if  self.matchValue("of".to_string()) {
          isForOf = true;
          self.advance();
          let mut varDecl : JSNode = JSNode::new();
          varDecl.nodeType = "VariableDeclaration".to_string();
          varDecl.strValue = keyword;
          varDecl.start = declTok.start;
          varDecl.line = declTok.line;
          varDecl.col = declTok.col;
          varDecl.children.push(declarator);
          leftNode = varDecl;
        } else {
          if  self.matchValue("in".to_string()) {
            isForIn = true;
            self.advance();
            let mut varDecl_1 : JSNode = JSNode::new();
            varDecl_1.nodeType = "VariableDeclaration".to_string();
            varDecl_1.strValue = keyword;
            varDecl_1.start = declTok.start;
            varDecl_1.line = declTok.line;
            varDecl_1.col = declTok.col;
            varDecl_1.children.push(declarator);
            leftNode = varDecl_1;
          } else {
            if  self.matchValue("=".to_string()) {
              self.advance();
              let mut initVal : JSNode = self.parseAssignment();
              declarator.right = initVal;
            }
            let mut varDecl_2 : JSNode = JSNode::new();
            varDecl_2.nodeType = "VariableDeclaration".to_string();
            varDecl_2.strValue = keyword;
            varDecl_2.start = declTok.start;
            varDecl_2.line = declTok.line;
            varDecl_2.col = declTok.col;
            varDecl_2.children.push(declarator);
            leftNode = varDecl_2;
            if  self.matchValue(";".to_string()) {
              self.advance();
            }
          }
        }
      } else {
        let mut initExpr : JSNode = self.parseExpr();
        if  self.matchValue("of".to_string()) {
          isForOf = true;
          self.advance();
          leftNode = initExpr;
        } else {
          if  self.matchValue("in".to_string()) {
            isForIn = true;
            self.advance();
            leftNode = initExpr;
          } else {
            leftNode = initExpr;
            if  self.matchValue(";".to_string()) {
              self.advance();
            }
          }
        }
      }
    } else {
      self.advance();
    }
    if  isForOf {
      forStmt.nodeType = "ForOfStatement".to_string();
      forStmt.left = leftNode.unwrap();
      let mut rightExpr : JSNode = self.parseExpr();
      forStmt.right = rightExpr;
      self.expectValue(")".to_string());
      let mut body : JSNode = self.parseStatement();
      forStmt.body = body;
      return forStmt.clone();
    }
    if  isForIn {
      forStmt.nodeType = "ForInStatement".to_string();
      forStmt.left = leftNode.unwrap();
      let mut rightExpr_1 : JSNode = self.parseExpr();
      forStmt.right = rightExpr_1;
      self.expectValue(")".to_string());
      let mut body_1 : JSNode = self.parseStatement();
      forStmt.body = body_1;
      return forStmt.clone();
    }
    forStmt.nodeType = "ForStatement".to_string();
    if  leftNode.is_some() {
      forStmt.left = leftNode.unwrap();
    }
    if  self.matchValue(";".to_string()) == false {
      let mut test : JSNode = self.parseExpr();
      forStmt.test = test;
    }
    if  self.matchValue(";".to_string()) {
      self.advance();
    }
    if  self.matchValue(")".to_string()) == false {
      let mut update : JSNode = self.parseExpr();
      forStmt.right = update;
    }
    self.expectValue(")".to_string());
    let mut body_2 : JSNode = self.parseStatement();
    forStmt.body = body_2;
    return forStmt.clone();
  }
  fn parseSwitch(&mut self, ) -> JSNode {
    let mut switchStmt : JSNode = JSNode::new();
    switchStmt.nodeType = "SwitchStatement".to_string();
    let mut startTok : Token = self.peek();
    switchStmt.start = startTok.start;
    switchStmt.line = startTok.line;
    switchStmt.col = startTok.col;
    self.expectValue("switch".to_string());
    self.expectValue("(".to_string());
    let mut discriminant : JSNode = self.parseExpr();
    switchStmt.test = discriminant;
    self.expectValue(")".to_string());
    self.expectValue("{".to_string());
    while (self.matchValue("}".to_string()) == false) && (self.isAtEnd() == false) {
      let mut caseNode : JSNode = JSNode::new();
      if  self.matchValue("case".to_string()) {
        caseNode.nodeType = "SwitchCase".to_string();
        let mut caseTok : Token = self.peek();
        caseNode.start = caseTok.start;
        caseNode.line = caseTok.line;
        caseNode.col = caseTok.col;
        self.advance();
        let mut testExpr : JSNode = self.parseExpr();
        caseNode.test = testExpr;
        self.expectValue(":".to_string());
        while (((self.matchValue("case".to_string()) == false) && (self.matchValue("default".to_string()) == false)) && (self.matchValue("}".to_string()) == false)) && (self.isAtEnd() == false) {
          let mut stmt : JSNode = self.parseStatement();
          caseNode.children.push(stmt);
        }
        switchStmt.children.push(caseNode);
      } else {
        if  self.matchValue("default".to_string()) {
          caseNode.nodeType = "SwitchCase".to_string();
          caseNode.strValue = "default".to_string();
          let mut defTok : Token = self.peek();
          caseNode.start = defTok.start;
          caseNode.line = defTok.line;
          caseNode.col = defTok.col;
          self.advance();
          self.expectValue(":".to_string());
          while ((self.matchValue("case".to_string()) == false) && (self.matchValue("}".to_string()) == false)) && (self.isAtEnd() == false) {
            let mut stmt_1 : JSNode = self.parseStatement();
            caseNode.children.push(stmt_1);
          }
          switchStmt.children.push(caseNode);
        } else {
          self.advance();
        }
      }
    }
    self.expectValue("}".to_string());
    return switchStmt.clone();
  }
  fn parseTry(&mut self, ) -> JSNode {
    let mut tryStmt : JSNode = JSNode::new();
    tryStmt.nodeType = "TryStatement".to_string();
    let mut startTok : Token = self.peek();
    tryStmt.start = startTok.start;
    tryStmt.line = startTok.line;
    tryStmt.col = startTok.col;
    self.expectValue("try".to_string());
    let mut block : JSNode = self.parseBlock();
    tryStmt.body = block;
    if  self.matchValue("catch".to_string()) {
      let mut catchNode : JSNode = JSNode::new();
      catchNode.nodeType = "CatchClause".to_string();
      let mut catchTok : Token = self.peek();
      catchNode.start = catchTok.start;
      catchNode.line = catchTok.line;
      catchNode.col = catchTok.col;
      self.advance();
      self.expectValue("(".to_string());
      let mut paramTok : Token = self.expect("Identifier".to_string());
      catchNode.strValue = paramTok.value;
      self.expectValue(")".to_string());
      let mut catchBody : JSNode = self.parseBlock();
      catchNode.body = catchBody;
      tryStmt.left = catchNode;
    }
    if  self.matchValue("finally".to_string()) {
      self.advance();
      let mut finallyBlock : JSNode = self.parseBlock();
      tryStmt.right = finallyBlock;
    }
    return tryStmt.clone();
  }
  fn parseThrow(&mut self, ) -> JSNode {
    let mut throwStmt : JSNode = JSNode::new();
    throwStmt.nodeType = "ThrowStatement".to_string();
    let mut startTok : Token = self.peek();
    throwStmt.start = startTok.start;
    throwStmt.line = startTok.line;
    throwStmt.col = startTok.col;
    self.expectValue("throw".to_string());
    let mut arg : JSNode = self.parseExpr();
    throwStmt.left = arg;
    if  self.matchValue(";".to_string()) {
      self.advance();
    }
    return throwStmt.clone();
  }
  fn parseBreak(&mut self, ) -> JSNode {
    let mut breakStmt : JSNode = JSNode::new();
    breakStmt.nodeType = "BreakStatement".to_string();
    let mut startTok : Token = self.peek();
    breakStmt.start = startTok.start;
    breakStmt.line = startTok.line;
    breakStmt.col = startTok.col;
    self.expectValue("break".to_string());
    if  self.matchType("Identifier".to_string()) {
      let mut labelTok : Token = self.peek();
      breakStmt.strValue = labelTok.value;
      self.advance();
    }
    if  self.matchValue(";".to_string()) {
      self.advance();
    }
    return breakStmt.clone();
  }
  fn parseContinue(&mut self, ) -> JSNode {
    let mut contStmt : JSNode = JSNode::new();
    contStmt.nodeType = "ContinueStatement".to_string();
    let mut startTok : Token = self.peek();
    contStmt.start = startTok.start;
    contStmt.line = startTok.line;
    contStmt.col = startTok.col;
    self.expectValue("continue".to_string());
    if  self.matchType("Identifier".to_string()) {
      let mut labelTok : Token = self.peek();
      contStmt.strValue = labelTok.value;
      self.advance();
    }
    if  self.matchValue(";".to_string()) {
      self.advance();
    }
    return contStmt.clone();
  }
  fn parseExprStmt(&mut self, ) -> JSNode {
    let mut stmt : JSNode = JSNode::new();
    stmt.nodeType = "ExpressionStatement".to_string();
    let mut startTok : Token = self.peek();
    stmt.start = startTok.start;
    stmt.line = startTok.line;
    stmt.col = startTok.col;
    let mut expr : JSNode = self.parseExpr();
    stmt.left = expr;
    if  self.matchValue(";".to_string()) {
      self.advance();
    }
    return stmt.clone();
  }
  fn parseExpr(&mut self, ) -> JSNode {
    return self.parseAssignment().clone();
  }
  fn parseAssignment(&mut self, ) -> JSNode {
    let mut left : JSNode = self.parseTernary();
    let tokVal : String = self.peekValue();
    if  tokVal == "=".to_string() {
      let mut opTok : Token = self.peek();
      self.advance();
      let mut right : JSNode = self.parseAssignment();
      let mut assign : JSNode = JSNode::new();
      assign.nodeType = "AssignmentExpression".to_string();
      assign.strValue = opTok.value;
      assign.left = left;
      assign.right = right;
      assign.start = left.start;
      assign.line = left.line;
      assign.col = left.col;
      return assign.clone();
    }
    return left.clone();
  }
  fn parseTernary(&mut self, ) -> JSNode {
    let mut condition : JSNode = self.parseLogicalOr();
    if  self.matchValue("?".to_string()) {
      self.advance();
      let mut consequent : JSNode = self.parseAssignment();
      self.expectValue(":".to_string());
      let mut alternate : JSNode = self.parseAssignment();
      let mut ternary : JSNode = JSNode::new();
      ternary.nodeType = "ConditionalExpression".to_string();
      ternary.left = condition;
      ternary.body = consequent;
      ternary.right = alternate;
      ternary.start = condition.start;
      ternary.line = condition.line;
      ternary.col = condition.col;
      return ternary.clone();
    }
    return condition.clone();
  }
  fn parseLogicalOr(&mut self, ) -> JSNode {
    let mut left : JSNode = self.parseNullishCoalescing();
    while self.matchValue("||".to_string()) {
      let mut opTok : Token = self.peek();
      self.advance();
      let mut right : JSNode = self.parseNullishCoalescing();
      let mut binary : JSNode = JSNode::new();
      binary.nodeType = "LogicalExpression".to_string();
      binary.strValue = opTok.value;
      binary.left = left;
      binary.right = right;
      binary.start = left.start;
      binary.line = left.line;
      binary.col = left.col;
      left = binary;
    }
    return left.clone();
  }
  fn parseNullishCoalescing(&mut self, ) -> JSNode {
    let mut left : JSNode = self.parseLogicalAnd();
    while self.matchValue("??".to_string()) {
      let mut opTok : Token = self.peek();
      self.advance();
      let mut right : JSNode = self.parseLogicalAnd();
      let mut binary : JSNode = JSNode::new();
      binary.nodeType = "LogicalExpression".to_string();
      binary.strValue = opTok.value;
      binary.left = left;
      binary.right = right;
      binary.start = left.start;
      binary.line = left.line;
      binary.col = left.col;
      left = binary;
    }
    return left.clone();
  }
  fn parseLogicalAnd(&mut self, ) -> JSNode {
    let mut left : JSNode = self.parseEquality();
    while self.matchValue("&&".to_string()) {
      let mut opTok : Token = self.peek();
      self.advance();
      let mut right : JSNode = self.parseEquality();
      let mut binary : JSNode = JSNode::new();
      binary.nodeType = "LogicalExpression".to_string();
      binary.strValue = opTok.value;
      binary.left = left;
      binary.right = right;
      binary.start = left.start;
      binary.line = left.line;
      binary.col = left.col;
      left = binary;
    }
    return left.clone();
  }
  fn parseEquality(&mut self, ) -> JSNode {
    let mut left : JSNode = self.parseComparison();
    let mut tokVal : String = self.peekValue();
    while (((tokVal == "==".to_string()) || (tokVal == "!=".to_string())) || (tokVal == "===".to_string())) || (tokVal == "!==".to_string()) {
      let mut opTok : Token = self.peek();
      self.advance();
      let mut right : JSNode = self.parseComparison();
      let mut binary : JSNode = JSNode::new();
      binary.nodeType = "BinaryExpression".to_string();
      binary.strValue = opTok.value;
      binary.left = left;
      binary.right = right;
      binary.start = left.start;
      binary.line = left.line;
      binary.col = left.col;
      left = binary;
      tokVal = self.peekValue();
    }
    return left.clone();
  }
  fn parseComparison(&mut self, ) -> JSNode {
    let mut left : JSNode = self.parseAdditive();
    let mut tokVal : String = self.peekValue();
    while (((tokVal == "<".to_string()) || (tokVal == ">".to_string())) || (tokVal == "<=".to_string())) || (tokVal == ">=".to_string()) {
      let mut opTok : Token = self.peek();
      self.advance();
      let mut right : JSNode = self.parseAdditive();
      let mut binary : JSNode = JSNode::new();
      binary.nodeType = "BinaryExpression".to_string();
      binary.strValue = opTok.value;
      binary.left = left;
      binary.right = right;
      binary.start = left.start;
      binary.line = left.line;
      binary.col = left.col;
      left = binary;
      tokVal = self.peekValue();
    }
    return left.clone();
  }
  fn parseAdditive(&mut self, ) -> JSNode {
    let mut left : JSNode = self.parseMultiplicative();
    let mut tokVal : String = self.peekValue();
    while (tokVal == "+".to_string()) || (tokVal == "-".to_string()) {
      let mut opTok : Token = self.peek();
      self.advance();
      let mut right : JSNode = self.parseMultiplicative();
      let mut binary : JSNode = JSNode::new();
      binary.nodeType = "BinaryExpression".to_string();
      binary.strValue = opTok.value;
      binary.left = left;
      binary.right = right;
      binary.start = left.start;
      binary.line = left.line;
      binary.col = left.col;
      left = binary;
      tokVal = self.peekValue();
    }
    return left.clone();
  }
  fn parseMultiplicative(&mut self, ) -> JSNode {
    let mut left : JSNode = self.parseUnary();
    let mut tokVal : String = self.peekValue();
    while ((tokVal == "*".to_string()) || (tokVal == "/".to_string())) || (tokVal == "%".to_string()) {
      let mut opTok : Token = self.peek();
      self.advance();
      let mut right : JSNode = self.parseUnary();
      let mut binary : JSNode = JSNode::new();
      binary.nodeType = "BinaryExpression".to_string();
      binary.strValue = opTok.value;
      binary.left = left;
      binary.right = right;
      binary.start = left.start;
      binary.line = left.line;
      binary.col = left.col;
      left = binary;
      tokVal = self.peekValue();
    }
    return left.clone();
  }
  fn parseUnary(&mut self, ) -> JSNode {
    let tokType : String = self.peekType();
    let tokVal : String = self.peekValue();
    if  tokType == "Punctuator".to_string() {
      if  ((tokVal == "!".to_string()) || (tokVal == "-".to_string())) || (tokVal == "+".to_string()) {
        let mut opTok : Token = self.peek();
        self.advance();
        let mut arg : JSNode = self.parseUnary();
        let mut unary : JSNode = JSNode::new();
        unary.nodeType = "UnaryExpression".to_string();
        unary.strValue = opTok.value;
        unary.left = arg;
        unary.start = opTok.start;
        unary.line = opTok.line;
        unary.col = opTok.col;
        return unary.clone();
      }
    }
    if  (tokType == "Keyword".to_string()) && (tokVal == "typeof".to_string()) {
      let mut opTok_1 : Token = self.peek();
      self.advance();
      let mut arg_1 : JSNode = self.parseUnary();
      let mut unary_1 : JSNode = JSNode::new();
      unary_1.nodeType = "UnaryExpression".to_string();
      unary_1.strValue = opTok_1.value;
      unary_1.left = arg_1;
      unary_1.start = opTok_1.start;
      unary_1.line = opTok_1.line;
      unary_1.col = opTok_1.col;
      return unary_1.clone();
    }
    if  (tokType == "Punctuator".to_string()) && ((tokVal == "++".to_string()) || (tokVal == "--".to_string())) {
      let mut opTok_2 : Token = self.peek();
      self.advance();
      let mut arg_2 : JSNode = self.parseUnary();
      let mut update : JSNode = JSNode::new();
      update.nodeType = "UpdateExpression".to_string();
      update.strValue = opTok_2.value;
      update.strValue2 = "prefix".to_string();
      update.left = arg_2;
      update.start = opTok_2.start;
      update.line = opTok_2.line;
      update.col = opTok_2.col;
      return update.clone();
    }
    if  tokVal == "yield".to_string() {
      let mut yieldTok : Token = self.peek();
      self.advance();
      let mut yieldExpr : JSNode = JSNode::new();
      yieldExpr.nodeType = "YieldExpression".to_string();
      yieldExpr.start = yieldTok.start;
      yieldExpr.line = yieldTok.line;
      yieldExpr.col = yieldTok.col;
      if  self.matchValue("*".to_string()) {
        yieldExpr.strValue = "delegate".to_string();
        self.advance();
      }
      let nextVal : String = self.peekValue();
      if  (((nextVal != ";".to_string()) && (nextVal != "}".to_string())) && (nextVal != ",".to_string())) && (nextVal != ")".to_string()) {
        let mut arg_3 : JSNode = self.parseAssignment();
        yieldExpr.left = arg_3;
      }
      return yieldExpr.clone();
    }
    if  tokVal == "await".to_string() {
      let mut awaitTok : Token = self.peek();
      self.advance();
      let mut arg_4 : JSNode = self.parseUnary();
      let mut awaitExpr : JSNode = JSNode::new();
      awaitExpr.nodeType = "AwaitExpression".to_string();
      awaitExpr.left = arg_4;
      awaitExpr.start = awaitTok.start;
      awaitExpr.line = awaitTok.line;
      awaitExpr.col = awaitTok.col;
      return awaitExpr.clone();
    }
    return self.parseCallMember().clone();
  }
  fn parseCallMember(&mut self, ) -> JSNode {
    if  self.matchValue("new".to_string()) {
      return self.parseNewExpression().clone();
    }
    let mut object : JSNode = self.parsePrimary();
    let mut cont : bool = true;
    while cont {
      let tokVal : String = self.peekValue();
      if  (tokVal == "++".to_string()) || (tokVal == "--".to_string()) {
        let mut opTok : Token = self.peek();
        self.advance();
        let mut update : JSNode = JSNode::new();
        update.nodeType = "UpdateExpression".to_string();
        update.strValue = opTok.value;
        update.strValue2 = "postfix".to_string();
        update.left = object;
        update.start = object.start;
        update.line = object.line;
        update.col = object.col;
        object = update;
      } else {
        if  tokVal == "?.".to_string() {
          self.advance();
          let nextTokVal : String = self.peekValue();
          if  nextTokVal == "(".to_string() {
            self.advance();
            let mut call : JSNode = JSNode::new();
            call.nodeType = "OptionalCallExpression".to_string();
            call.left = object;
            call.start = object.start;
            call.line = object.line;
            call.col = object.col;
            while (self.matchValue(")".to_string()) == false) && (self.isAtEnd() == false) {
              if  (call.children.len()) > 0 {
                self.expectValue(",".to_string());
              }
              if  self.matchValue(")".to_string()) || self.isAtEnd() {
                break;
              }
              let mut arg : JSNode = self.parseAssignment();
              call.children.push(arg);
            }
            self.expectValue(")".to_string());
            object = call;
          } else {
            if  nextTokVal == "[".to_string() {
              self.advance();
              let mut propExpr : JSNode = self.parseExpr();
              self.expectValue("]".to_string());
              let mut member : JSNode = JSNode::new();
              member.nodeType = "OptionalMemberExpression".to_string();
              member.left = object;
              member.right = propExpr;
              member.strValue2 = "bracket".to_string();
              member.start = object.start;
              member.line = object.line;
              member.col = object.col;
              object = member;
            } else {
              let mut propTok : Token = self.expect("Identifier".to_string());
              let mut member_1 : JSNode = JSNode::new();
              member_1.nodeType = "OptionalMemberExpression".to_string();
              member_1.left = object;
              member_1.strValue = propTok.value;
              member_1.strValue2 = "dot".to_string();
              member_1.start = object.start;
              member_1.line = object.line;
              member_1.col = object.col;
              object = member_1;
            }
          }
        } else {
          if  tokVal == ".".to_string() {
            self.advance();
            let mut propTok_1 : Token = self.expect("Identifier".to_string());
            let mut member_2 : JSNode = JSNode::new();
            member_2.nodeType = "MemberExpression".to_string();
            member_2.left = object;
            member_2.strValue = propTok_1.value;
            member_2.strValue2 = "dot".to_string();
            member_2.start = object.start;
            member_2.line = object.line;
            member_2.col = object.col;
            object = member_2;
          } else {
            if  tokVal == "[".to_string() {
              self.advance();
              let mut propExpr_1 : JSNode = self.parseExpr();
              self.expectValue("]".to_string());
              let mut member_3 : JSNode = JSNode::new();
              member_3.nodeType = "MemberExpression".to_string();
              member_3.left = object;
              member_3.right = propExpr_1;
              member_3.strValue2 = "bracket".to_string();
              member_3.start = object.start;
              member_3.line = object.line;
              member_3.col = object.col;
              object = member_3;
            } else {
              if  tokVal == "(".to_string() {
                self.advance();
                let mut call_1 : JSNode = JSNode::new();
                call_1.nodeType = "CallExpression".to_string();
                call_1.left = object;
                call_1.start = object.start;
                call_1.line = object.line;
                call_1.col = object.col;
                while (self.matchValue(")".to_string()) == false) && (self.isAtEnd() == false) {
                  if  (call_1.children.len()) > 0 {
                    self.expectValue(",".to_string());
                  }
                  if  self.matchValue(")".to_string()) || self.isAtEnd() {
                    break;
                  }
                  if  self.matchValue("...".to_string()) {
                    let mut spreadTok : Token = self.peek();
                    self.advance();
                    let mut spreadArg : JSNode = self.parseAssignment();
                    let mut spread : JSNode = JSNode::new();
                    spread.nodeType = "SpreadElement".to_string();
                    spread.left = spreadArg;
                    spread.start = spreadTok.start;
                    spread.line = spreadTok.line;
                    spread.col = spreadTok.col;
                    call_1.children.push(spread);
                  } else {
                    let mut arg_1 : JSNode = self.parseAssignment();
                    call_1.children.push(arg_1);
                  }
                }
                self.expectValue(")".to_string());
                object = call_1;
              } else {
                cont = false;
              }
            }
          }
        }
      }
    }
    return object.clone();
  }
  fn parseNewExpression(&mut self, ) -> JSNode {
    let mut newExpr : JSNode = JSNode::new();
    newExpr.nodeType = "NewExpression".to_string();
    let mut startTok : Token = self.peek();
    newExpr.start = startTok.start;
    newExpr.line = startTok.line;
    newExpr.col = startTok.col;
    self.expectValue("new".to_string());
    let mut callee : JSNode = self.parsePrimary();
    let mut cont : bool = true;
    while cont {
      let tokVal : String = self.peekValue();
      if  tokVal == ".".to_string() {
        self.advance();
        let mut propTok : Token = self.expect("Identifier".to_string());
        let mut member : JSNode = JSNode::new();
        member.nodeType = "MemberExpression".to_string();
        member.left = callee;
        member.strValue = propTok.value;
        member.strValue2 = "dot".to_string();
        member.start = callee.start;
        member.line = callee.line;
        member.col = callee.col;
        callee = member;
      } else {
        cont = false;
      }
    }
    newExpr.left = callee;
    if  self.matchValue("(".to_string()) {
      self.advance();
      while (self.matchValue(")".to_string()) == false) && (self.isAtEnd() == false) {
        if  (newExpr.children.len()) > 0 {
          self.expectValue(",".to_string());
        }
        if  self.matchValue(")".to_string()) || self.isAtEnd() {
          break;
        }
        let mut arg : JSNode = self.parseAssignment();
        newExpr.children.push(arg);
      }
      self.expectValue(")".to_string());
    }
    return newExpr.clone();
  }
  fn parsePrimary(&mut self, ) -> JSNode {
    let tokType : String = self.peekType();
    let tokVal : String = self.peekValue();
    let mut tok : Token = self.peek();
    if  tokVal == "async".to_string() {
      let nextVal : String = self.peekAt(1);
      let nextNext : String = self.peekAt(2);
      if  (nextVal == "(".to_string()) || (nextNext == "=>".to_string()) {
        return self.parseAsyncArrowFunction().clone();
      }
    }
    if  tokType == "Identifier".to_string() {
      let nextVal_1 : String = self.peekAt(1);
      if  nextVal_1 == "=>".to_string() {
        return self.parseArrowFunction().clone();
      }
      self.advance();
      let mut id : JSNode = JSNode::new();
      id.nodeType = "Identifier".to_string();
      id.strValue = tok.value;
      id.start = tok.start;
      id.end = tok.end;
      id.line = tok.line;
      id.col = tok.col;
      return id.clone();
    }
    if  tokType == "Number".to_string() {
      self.advance();
      let mut lit : JSNode = JSNode::new();
      lit.nodeType = "Literal".to_string();
      lit.strValue = tok.value;
      lit.strValue2 = "number".to_string();
      lit.start = tok.start;
      lit.end = tok.end;
      lit.line = tok.line;
      lit.col = tok.col;
      return lit.clone();
    }
    if  tokType == "String".to_string() {
      self.advance();
      let mut lit_1 : JSNode = JSNode::new();
      lit_1.nodeType = "Literal".to_string();
      lit_1.strValue = tok.value;
      lit_1.strValue2 = "string".to_string();
      lit_1.start = tok.start;
      lit_1.end = tok.end;
      lit_1.line = tok.line;
      lit_1.col = tok.col;
      return lit_1.clone();
    }
    if  (tokVal == "true".to_string()) || (tokVal == "false".to_string()) {
      self.advance();
      let mut lit_2 : JSNode = JSNode::new();
      lit_2.nodeType = "Literal".to_string();
      lit_2.strValue = tok.value;
      lit_2.strValue2 = "boolean".to_string();
      lit_2.start = tok.start;
      lit_2.end = tok.end;
      lit_2.line = tok.line;
      lit_2.col = tok.col;
      return lit_2.clone();
    }
    if  tokVal == "null".to_string() {
      self.advance();
      let mut lit_3 : JSNode = JSNode::new();
      lit_3.nodeType = "Literal".to_string();
      lit_3.strValue = "null".to_string();
      lit_3.strValue2 = "null".to_string();
      lit_3.start = tok.start;
      lit_3.end = tok.end;
      lit_3.line = tok.line;
      lit_3.col = tok.col;
      return lit_3.clone();
    }
    if  tokType == "TemplateLiteral".to_string() {
      self.advance();
      let mut tmpl : JSNode = JSNode::new();
      tmpl.nodeType = "TemplateLiteral".to_string();
      tmpl.strValue = tok.value;
      tmpl.start = tok.start;
      tmpl.end = tok.end;
      tmpl.line = tok.line;
      tmpl.col = tok.col;
      return tmpl.clone();
    }
    if  tokVal == "(".to_string() {
      if  self.isArrowFunction() {
        return self.parseArrowFunction().clone();
      }
      self.advance();
      let mut expr : JSNode = self.parseExpr();
      self.expectValue(")".to_string());
      return expr.clone();
    }
    if  tokVal == "[".to_string() {
      return self.parseArray().clone();
    }
    if  tokVal == "{".to_string() {
      return self.parseObject().clone();
    }
    if  tokVal == "/".to_string() {
      return self.parseRegexLiteral().clone();
    }
    if  tokVal == "function".to_string() {
      return self.parseFunctionExpression().clone();
    }
    self.advance();
    let mut fallback : JSNode = JSNode::new();
    fallback.nodeType = "Identifier".to_string();
    fallback.strValue = tok.value;
    fallback.start = tok.start;
    fallback.end = tok.end;
    fallback.line = tok.line;
    fallback.col = tok.col;
    return fallback.clone();
  }
  fn parseArray(&mut self, ) -> JSNode {
    let mut arr : JSNode = JSNode::new();
    arr.nodeType = "ArrayExpression".to_string();
    let mut startTok : Token = self.peek();
    arr.start = startTok.start;
    arr.line = startTok.line;
    arr.col = startTok.col;
    self.expectValue("[".to_string());
    while (self.matchValue("]".to_string()) == false) && (self.isAtEnd() == false) {
      if  (arr.children.len()) > 0 {
        self.expectValue(",".to_string());
      }
      if  self.matchValue("]".to_string()) || self.isAtEnd() {
        break;
      }
      if  self.matchValue("...".to_string()) {
        let mut spreadTok : Token = self.peek();
        self.advance();
        let mut arg : JSNode = self.parseAssignment();
        let mut spread : JSNode = JSNode::new();
        spread.nodeType = "SpreadElement".to_string();
        spread.left = arg;
        spread.start = spreadTok.start;
        spread.line = spreadTok.line;
        spread.col = spreadTok.col;
        arr.children.push(spread);
      } else {
        let mut elem : JSNode = self.parseAssignment();
        arr.children.push(elem);
      }
    }
    self.expectValue("]".to_string());
    return arr.clone();
  }
  fn parseObject(&mut self, ) -> JSNode {
    let mut obj : JSNode = JSNode::new();
    obj.nodeType = "ObjectExpression".to_string();
    let mut startTok : Token = self.peek();
    obj.start = startTok.start;
    obj.line = startTok.line;
    obj.col = startTok.col;
    self.expectValue("{".to_string());
    while (self.matchValue("}".to_string()) == false) && (self.isAtEnd() == false) {
      if  (obj.children.len()) > 0 {
        self.expectValue(",".to_string());
      }
      if  self.matchValue("}".to_string()) || self.isAtEnd() {
        break;
      }
      if  self.matchValue("...".to_string()) {
        let mut spreadTok : Token = self.peek();
        self.advance();
        let mut arg : JSNode = self.parseAssignment();
        let mut spread : JSNode = JSNode::new();
        spread.nodeType = "SpreadElement".to_string();
        spread.left = arg;
        spread.start = spreadTok.start;
        spread.line = spreadTok.line;
        spread.col = spreadTok.col;
        obj.children.push(spread);
      } else {
        let mut prop : JSNode = JSNode::new();
        prop.nodeType = "Property".to_string();
        let mut keyTok : Token = self.peek();
        let keyType : String = self.peekType();
        if  self.matchValue("[".to_string()) {
          self.advance();
          let mut keyExpr : JSNode = self.parseAssignment();
          self.expectValue("]".to_string());
          self.expectValue(":".to_string());
          let mut val : JSNode = self.parseAssignment();
          prop.right = keyExpr;
          prop.left = val;
          prop.strValue2 = "computed".to_string();
          prop.start = keyTok.start;
          prop.line = keyTok.line;
          prop.col = keyTok.col;
          obj.children.push(prop);
        } else {
          if  ((keyType == "Identifier".to_string()) || (keyType == "String".to_string())) || (keyType == "Number".to_string()) {
            self.advance();
            prop.strValue = keyTok.value;
            prop.start = keyTok.start;
            prop.line = keyTok.line;
            prop.col = keyTok.col;
            if  self.matchValue(":".to_string()) {
              self.expectValue(":".to_string());
              let mut val_1 : JSNode = self.parseAssignment();
              prop.left = val_1;
            } else {
              let mut id : JSNode = JSNode::new();
              id.nodeType = "Identifier".to_string();
              id.strValue = keyTok.value;
              id.start = keyTok.start;
              id.line = keyTok.line;
              id.col = keyTok.col;
              prop.left = id;
              prop.strValue2 = "shorthand".to_string();
            }
            obj.children.push(prop);
          } else {
            let err : String = format!("{}{}", (format!("{}{}", (format!("{}{}", ([(format!("{}{}", (["Parse error at line ".to_string() , (keyTok.line.to_string()) ].join("")), ":".to_string())) , (keyTok.col.to_string()) ].join("")), ": unexpected token '".to_string())), keyTok.value)), "' in object literal".to_string());
            self.addError(err);
            self.advance();
          }
        }
      }
    }
    self.expectValue("}".to_string());
    return obj.clone();
  }
  fn parseArrayPattern(&mut self, ) -> JSNode {
    let mut pattern : JSNode = JSNode::new();
    pattern.nodeType = "ArrayPattern".to_string();
    let mut startTok : Token = self.peek();
    pattern.start = startTok.start;
    pattern.line = startTok.line;
    pattern.col = startTok.col;
    self.expectValue("[".to_string());
    while (self.matchValue("]".to_string()) == false) && (self.isAtEnd() == false) {
      if  (pattern.children.len()) > 0 {
        self.expectValue(",".to_string());
      }
      if  self.matchValue("]".to_string()) || self.isAtEnd() {
        break;
      }
      if  self.matchValue("...".to_string()) {
        let mut restTok : Token = self.peek();
        self.advance();
        let mut idTok : Token = self.expect("Identifier".to_string());
        let mut rest : JSNode = JSNode::new();
        rest.nodeType = "RestElement".to_string();
        rest.strValue = idTok.value;
        rest.start = restTok.start;
        rest.line = restTok.line;
        rest.col = restTok.col;
        pattern.children.push(rest);
      } else {
        if  self.matchValue("[".to_string()) {
          let mut nested : JSNode = self.parseArrayPattern();
          pattern.children.push(nested);
        } else {
          if  self.matchValue("{".to_string()) {
            let mut nested_1 : JSNode = self.parseObjectPattern();
            pattern.children.push(nested_1);
          } else {
            let mut idTok_1 : Token = self.expect("Identifier".to_string());
            let mut id : JSNode = JSNode::new();
            id.nodeType = "Identifier".to_string();
            id.strValue = idTok_1.value;
            id.start = idTok_1.start;
            id.line = idTok_1.line;
            id.col = idTok_1.col;
            pattern.children.push(id);
          }
        }
      }
    }
    self.expectValue("]".to_string());
    return pattern.clone();
  }
  fn parseObjectPattern(&mut self, ) -> JSNode {
    let mut pattern : JSNode = JSNode::new();
    pattern.nodeType = "ObjectPattern".to_string();
    let mut startTok : Token = self.peek();
    pattern.start = startTok.start;
    pattern.line = startTok.line;
    pattern.col = startTok.col;
    self.expectValue("{".to_string());
    while (self.matchValue("}".to_string()) == false) && (self.isAtEnd() == false) {
      if  (pattern.children.len()) > 0 {
        self.expectValue(",".to_string());
      }
      if  self.matchValue("}".to_string()) || self.isAtEnd() {
        break;
      }
      if  self.matchValue("...".to_string()) {
        let mut restTok : Token = self.peek();
        self.advance();
        let mut idTok : Token = self.expect("Identifier".to_string());
        let mut rest : JSNode = JSNode::new();
        rest.nodeType = "RestElement".to_string();
        rest.strValue = idTok.value;
        rest.start = restTok.start;
        rest.line = restTok.line;
        rest.col = restTok.col;
        pattern.children.push(rest);
      } else {
        let mut prop : JSNode = JSNode::new();
        prop.nodeType = "Property".to_string();
        let mut keyTok : Token = self.expect("Identifier".to_string());
        prop.strValue = keyTok.value;
        prop.start = keyTok.start;
        prop.line = keyTok.line;
        prop.col = keyTok.col;
        if  self.matchValue(":".to_string()) {
          self.advance();
          if  self.matchValue("[".to_string()) {
            let mut nested : JSNode = self.parseArrayPattern();
            prop.left = nested;
          } else {
            if  self.matchValue("{".to_string()) {
              let mut nested_1 : JSNode = self.parseObjectPattern();
              prop.left = nested_1;
            } else {
              let mut idTok2 : Token = self.expect("Identifier".to_string());
              let mut id : JSNode = JSNode::new();
              id.nodeType = "Identifier".to_string();
              id.strValue = idTok2.value;
              id.start = idTok2.start;
              id.line = idTok2.line;
              id.col = idTok2.col;
              prop.left = id;
            }
          }
        } else {
          let mut id_1 : JSNode = JSNode::new();
          id_1.nodeType = "Identifier".to_string();
          id_1.strValue = keyTok.value;
          id_1.start = keyTok.start;
          id_1.line = keyTok.line;
          id_1.col = keyTok.col;
          prop.left = id_1;
          prop.strValue2 = "shorthand".to_string();
        }
        pattern.children.push(prop);
      }
    }
    self.expectValue("}".to_string());
    return pattern.clone();
  }
  fn isArrowFunction(&mut self, ) -> bool {
    if  self.matchValue("(".to_string()) == false {
      return false;
    }
    let mut depth : i64 = 1;
    let mut scanPos : i64 = 1;
    while depth > 0 {
      let scanVal : String = self.peekAt(scanPos);
      if  scanVal == "".to_string() {
        return false;
      }
      if  scanVal == "(".to_string() {
        depth = depth + 1;
      }
      if  scanVal == ")".to_string() {
        depth = depth - 1;
      }
      scanPos = scanPos + 1;
    }
    let afterParen : String = self.peekAt(scanPos);
    return afterParen == "=>".to_string();
  }
  fn parseArrowFunction(&mut self, ) -> JSNode {
    let mut arrow : JSNode = JSNode::new();
    arrow.nodeType = "ArrowFunctionExpression".to_string();
    let mut startTok : Token = self.peek();
    arrow.start = startTok.start;
    arrow.line = startTok.line;
    arrow.col = startTok.col;
    if  self.matchValue("(".to_string()) {
      self.advance();
      while (self.matchValue(")".to_string()) == false) && (self.isAtEnd() == false) {
        if  (arrow.children.len()) > 0 {
          self.expectValue(",".to_string());
        }
        if  self.matchValue(")".to_string()) || self.isAtEnd() {
          break;
        }
        let mut paramTok : Token = self.expect("Identifier".to_string());
        let mut param : JSNode = JSNode::new();
        param.nodeType = "Identifier".to_string();
        param.strValue = paramTok.value;
        param.start = paramTok.start;
        param.line = paramTok.line;
        param.col = paramTok.col;
        arrow.children.push(param);
      }
      self.expectValue(")".to_string());
    } else {
      let mut paramTok_1 : Token = self.expect("Identifier".to_string());
      let mut param_1 : JSNode = JSNode::new();
      param_1.nodeType = "Identifier".to_string();
      param_1.strValue = paramTok_1.value;
      param_1.start = paramTok_1.start;
      param_1.line = paramTok_1.line;
      param_1.col = paramTok_1.col;
      arrow.children.push(param_1);
    }
    self.expectValue("=>".to_string());
    if  self.matchValue("{".to_string()) {
      let mut body : JSNode = self.parseBlock();
      arrow.body = body;
    } else {
      let mut expr : JSNode = self.parseAssignment();
      arrow.body = expr;
    }
    return arrow.clone();
  }
  fn parseAsyncArrowFunction(&mut self, ) -> JSNode {
    let mut arrow : JSNode = JSNode::new();
    arrow.nodeType = "ArrowFunctionExpression".to_string();
    arrow.strValue2 = "async".to_string();
    let mut startTok : Token = self.peek();
    arrow.start = startTok.start;
    arrow.line = startTok.line;
    arrow.col = startTok.col;
    self.expectValue("async".to_string());
    if  self.matchValue("(".to_string()) {
      self.advance();
      while (self.matchValue(")".to_string()) == false) && (self.isAtEnd() == false) {
        if  (arrow.children.len()) > 0 {
          self.expectValue(",".to_string());
        }
        if  self.matchValue(")".to_string()) || self.isAtEnd() {
          break;
        }
        let mut paramTok : Token = self.expect("Identifier".to_string());
        let mut param : JSNode = JSNode::new();
        param.nodeType = "Identifier".to_string();
        param.strValue = paramTok.value;
        param.start = paramTok.start;
        param.line = paramTok.line;
        param.col = paramTok.col;
        arrow.children.push(param);
      }
      self.expectValue(")".to_string());
    } else {
      let mut paramTok_1 : Token = self.expect("Identifier".to_string());
      let mut param_1 : JSNode = JSNode::new();
      param_1.nodeType = "Identifier".to_string();
      param_1.strValue = paramTok_1.value;
      param_1.start = paramTok_1.start;
      param_1.line = paramTok_1.line;
      param_1.col = paramTok_1.col;
      arrow.children.push(param_1);
    }
    self.expectValue("=>".to_string());
    if  self.matchValue("{".to_string()) {
      let mut body : JSNode = self.parseBlock();
      arrow.body = body;
    } else {
      let mut expr : JSNode = self.parseAssignment();
      arrow.body = expr;
    }
    return arrow.clone();
  }
}
#[derive(Clone)]
struct ASTPrinter { 
}
impl ASTPrinter { 
  
  pub fn new() ->  ASTPrinter {
    let mut me = ASTPrinter { 
    };
    return me;
  }
  pub fn printNode(node : JSNode, depth : i64) -> () {
    let mut indent : String = "".to_string();
    let mut i : i64 = 0;
    while i < depth {
      indent = format!("{}{}", indent, "  ".to_string());
      i = i + 1;
    }
    let numComments : i64 = node.leadingComments.len();
    if  numComments > 0 {
      for ci in 0..node.leadingComments.len() {
        let mut comment = node.leadingComments[ci as usize].clone();
        let commentType : String = comment.nodeType;
        let mut preview : String = comment.strValue;
        if  (preview.len() as i64) > 40 {
          preview = format!("{}{}", (preview.chars().skip(0 as usize).take((40 - 0) as usize).collect::<String>()), "...".to_string());
        }
        println!( "{}", format!("{}{}", (format!("{}{}", (format!("{}{}", indent, commentType)), ": ".to_string())), preview) );
        node.leadingComments[ci as usize] = comment;
      }
    }
    let nodeType : String = node.nodeType;
    let loc : String = format!("{}{}", ([(format!("{}{}", (["[".to_string() , (node.line.to_string()) ].join("")), ":".to_string())) , (node.col.to_string()) ].join("")), "]".to_string());
    if  nodeType == "VariableDeclaration".to_string() {
      let kind : String = node.strValue;
      if  (kind.len() as i64) > 0 {
        println!( "{}", format!("{}{}", (format!("{}{}", (format!("{}{}", (format!("{}{}", indent, "VariableDeclaration (".to_string())), kind)), ") ".to_string())), loc) );
      } else {
        println!( "{}", format!("{}{}", (format!("{}{}", indent, "VariableDeclaration ".to_string())), loc) );
      }
      for ci_1 in 0..node.children.len() {
        let mut child = node.children[ci_1 as usize].clone();
        ASTPrinter::printNode(child, depth + 1);
        node.children[ci_1 as usize] = child;
      }
      return;
    }
    if  nodeType == "VariableDeclarator".to_string() {
      if  node.left.is_some() {
        let mut id : JSNode = node.left.unwrap();
        let idType : String = id.nodeType;
        if  idType == "Identifier".to_string() {
          println!( "{}", format!("{}{}", (format!("{}{}", (format!("{}{}", (format!("{}{}", indent, "VariableDeclarator: ".to_string())), id.strValue)), " ".to_string())), loc) );
        } else {
          println!( "{}", format!("{}{}", (format!("{}{}", indent, "VariableDeclarator ".to_string())), loc) );
          println!( "{}", format!("{}{}", indent, "  pattern:".to_string()) );
          ASTPrinter::printNode(id, depth + 2);
        }
      } else {
        println!( "{}", format!("{}{}", (format!("{}{}", indent, "VariableDeclarator ".to_string())), loc) );
      }
      if  node.right.is_some() {
        ASTPrinter::printNode(node.right.unwrap(), depth + 1);
      }
      return;
    }
    if  nodeType == "FunctionDeclaration".to_string() {
      let mut params : String = "".to_string();
      for pi in 0..node.children.len() {
        let mut p = node.children[pi as usize].clone();
        if  pi > 0 {
          params = format!("{}{}", params, ", ".to_string());
        }
        params = format!("{}{}", params, p.strValue);
        node.children[pi as usize] = p;
      }
      let kind_1 : String = node.strValue2;
      let mut prefix : String = "".to_string();
      if  kind_1 == "async".to_string() {
        prefix = "async ".to_string();
      }
      if  kind_1 == "generator".to_string() {
        prefix = "function* ".to_string();
      }
      if  kind_1 == "async-generator".to_string() {
        prefix = "async function* ".to_string();
      }
      if  (prefix.len() as i64) > 0 {
        println!( "{}", format!("{}{}", (format!("{}{}", (format!("{}{}", (format!("{}{}", (format!("{}{}", (format!("{}{}", (format!("{}{}", indent, "FunctionDeclaration: ".to_string())), prefix)), node.strValue)), "(".to_string())), params)), ") ".to_string())), loc) );
      } else {
        println!( "{}", format!("{}{}", (format!("{}{}", (format!("{}{}", (format!("{}{}", (format!("{}{}", (format!("{}{}", indent, "FunctionDeclaration: ".to_string())), node.strValue)), "(".to_string())), params)), ") ".to_string())), loc) );
      }
      if  node.body.is_some() {
        ASTPrinter::printNode(node.body.unwrap(), depth + 1);
      }
      return;
    }
    if  nodeType == "ClassDeclaration".to_string() {
      let mut output : String = format!("{}{}", (format!("{}{}", indent, "ClassDeclaration: ".to_string())), node.strValue);
      if  node.left.is_some() {
        let mut superClass : JSNode = node.left.unwrap();
        output = format!("{}{}", (format!("{}{}", output, " extends ".to_string())), superClass.strValue);
      }
      println!( "{}", format!("{}{}", (format!("{}{}", output, " ".to_string())), loc) );
      if  node.body.is_some() {
        ASTPrinter::printNode(node.body.unwrap(), depth + 1);
      }
      return;
    }
    if  nodeType == "ClassBody".to_string() {
      println!( "{}", format!("{}{}", (format!("{}{}", indent, "ClassBody ".to_string())), loc) );
      for mi in 0..node.children.len() {
        let mut method = node.children[mi as usize].clone();
        ASTPrinter::printNode(method, depth + 1);
        node.children[mi as usize] = method;
      }
      return;
    }
    if  nodeType == "MethodDefinition".to_string() {
      let mut staticStr : String = "".to_string();
      if  node.strValue2 == "static".to_string() {
        staticStr = "static ".to_string();
      }
      println!( "{}", format!("{}{}", (format!("{}{}", (format!("{}{}", (format!("{}{}", (format!("{}{}", indent, "MethodDefinition: ".to_string())), staticStr)), node.strValue)), " ".to_string())), loc) );
      if  node.body.is_some() {
        ASTPrinter::printNode(node.body.unwrap(), depth + 1);
      }
      return;
    }
    if  nodeType == "ArrowFunctionExpression".to_string() {
      let mut params_1 : String = "".to_string();
      for pi_1 in 0..node.children.len() {
        let mut p_1 = node.children[pi_1 as usize].clone();
        if  pi_1 > 0 {
          params_1 = format!("{}{}", params_1, ", ".to_string());
        }
        params_1 = format!("{}{}", params_1, p_1.strValue);
        node.children[pi_1 as usize] = p_1;
      }
      let mut asyncStr : String = "".to_string();
      if  node.strValue2 == "async".to_string() {
        asyncStr = "async ".to_string();
      }
      println!( "{}", format!("{}{}", (format!("{}{}", (format!("{}{}", (format!("{}{}", (format!("{}{}", (format!("{}{}", indent, "ArrowFunctionExpression: ".to_string())), asyncStr)), "(".to_string())), params_1)), ") => ".to_string())), loc) );
      if  node.body.is_some() {
        ASTPrinter::printNode(node.body.unwrap(), depth + 1);
      }
      return;
    }
    if  nodeType == "YieldExpression".to_string() {
      let mut delegateStr : String = "".to_string();
      if  node.strValue == "delegate".to_string() {
        delegateStr = "*".to_string();
      }
      println!( "{}", format!("{}{}", (format!("{}{}", (format!("{}{}", (format!("{}{}", indent, "YieldExpression".to_string())), delegateStr)), " ".to_string())), loc) );
      if  node.left.is_some() {
        ASTPrinter::printNode(node.left.unwrap(), depth + 1);
      }
      return;
    }
    if  nodeType == "AwaitExpression".to_string() {
      println!( "{}", format!("{}{}", (format!("{}{}", indent, "AwaitExpression ".to_string())), loc) );
      if  node.left.is_some() {
        ASTPrinter::printNode(node.left.unwrap(), depth + 1);
      }
      return;
    }
    if  nodeType == "TemplateLiteral".to_string() {
      println!( "{}", format!("{}{}", (format!("{}{}", (format!("{}{}", (format!("{}{}", indent, "TemplateLiteral: `".to_string())), node.strValue)), "` ".to_string())), loc) );
      return;
    }
    if  nodeType == "BlockStatement".to_string() {
      println!( "{}", format!("{}{}", (format!("{}{}", indent, "BlockStatement ".to_string())), loc) );
      for ci_2 in 0..node.children.len() {
        let mut child_1 = node.children[ci_2 as usize].clone();
        ASTPrinter::printNode(child_1, depth + 1);
        node.children[ci_2 as usize] = child_1;
      }
      return;
    }
    if  nodeType == "ReturnStatement".to_string() {
      println!( "{}", format!("{}{}", (format!("{}{}", indent, "ReturnStatement ".to_string())), loc) );
      if  node.left.is_some() {
        ASTPrinter::printNode(node.left.unwrap(), depth + 1);
      }
      return;
    }
    if  nodeType == "IfStatement".to_string() {
      println!( "{}", format!("{}{}", (format!("{}{}", indent, "IfStatement ".to_string())), loc) );
      println!( "{}", format!("{}{}", indent, "  test:".to_string()) );
      if  node.test.is_some() {
        ASTPrinter::printNode(node.test.unwrap(), depth + 2);
      }
      println!( "{}", format!("{}{}", indent, "  consequent:".to_string()) );
      if  node.body.is_some() {
        ASTPrinter::printNode(node.body.unwrap(), depth + 2);
      }
      if  node.alternate.is_some() {
        println!( "{}", format!("{}{}", indent, "  alternate:".to_string()) );
        ASTPrinter::printNode(node.alternate.unwrap(), depth + 2);
      }
      return;
    }
    if  nodeType == "ExpressionStatement".to_string() {
      println!( "{}", format!("{}{}", (format!("{}{}", indent, "ExpressionStatement ".to_string())), loc) );
      if  node.left.is_some() {
        ASTPrinter::printNode(node.left.unwrap(), depth + 1);
      }
      return;
    }
    if  nodeType == "AssignmentExpression".to_string() {
      println!( "{}", format!("{}{}", (format!("{}{}", (format!("{}{}", (format!("{}{}", indent, "AssignmentExpression: ".to_string())), node.strValue)), " ".to_string())), loc) );
      if  node.left.is_some() {
        println!( "{}", format!("{}{}", indent, "  left:".to_string()) );
        ASTPrinter::printNode(node.left.unwrap(), depth + 2);
      }
      if  node.right.is_some() {
        println!( "{}", format!("{}{}", indent, "  right:".to_string()) );
        ASTPrinter::printNode(node.right.unwrap(), depth + 2);
      }
      return;
    }
    if  (nodeType == "BinaryExpression".to_string()) || (nodeType == "LogicalExpression".to_string()) {
      println!( "{}", format!("{}{}", (format!("{}{}", (format!("{}{}", (format!("{}{}", (format!("{}{}", indent, nodeType)), ": ".to_string())), node.strValue)), " ".to_string())), loc) );
      if  node.left.is_some() {
        println!( "{}", format!("{}{}", indent, "  left:".to_string()) );
        ASTPrinter::printNode(node.left.unwrap(), depth + 2);
      }
      if  node.right.is_some() {
        println!( "{}", format!("{}{}", indent, "  right:".to_string()) );
        ASTPrinter::printNode(node.right.unwrap(), depth + 2);
      }
      return;
    }
    if  nodeType == "UnaryExpression".to_string() {
      println!( "{}", format!("{}{}", (format!("{}{}", (format!("{}{}", (format!("{}{}", indent, "UnaryExpression: ".to_string())), node.strValue)), " ".to_string())), loc) );
      if  node.left.is_some() {
        ASTPrinter::printNode(node.left.unwrap(), depth + 1);
      }
      return;
    }
    if  nodeType == "UpdateExpression".to_string() {
      let mut prefix_1 : String = "".to_string();
      if  node.strValue2 == "prefix".to_string() {
        prefix_1 = "prefix ".to_string();
      } else {
        prefix_1 = "postfix ".to_string();
      }
      println!( "{}", format!("{}{}", (format!("{}{}", (format!("{}{}", (format!("{}{}", (format!("{}{}", indent, "UpdateExpression: ".to_string())), prefix_1)), node.strValue)), " ".to_string())), loc) );
      if  node.left.is_some() {
        ASTPrinter::printNode(node.left.unwrap(), depth + 1);
      }
      return;
    }
    if  nodeType == "NewExpression".to_string() {
      println!( "{}", format!("{}{}", (format!("{}{}", indent, "NewExpression ".to_string())), loc) );
      println!( "{}", format!("{}{}", indent, "  callee:".to_string()) );
      if  node.left.is_some() {
        ASTPrinter::printNode(node.left.unwrap(), depth + 2);
      }
      if  (node.children.len()) > 0 {
        println!( "{}", format!("{}{}", indent, "  arguments:".to_string()) );
        for ai in 0..node.children.len() {
          let mut arg = node.children[ai as usize].clone();
          ASTPrinter::printNode(arg, depth + 2);
          node.children[ai as usize] = arg;
        }
      }
      return;
    }
    if  nodeType == "ConditionalExpression".to_string() {
      println!( "{}", format!("{}{}", (format!("{}{}", indent, "ConditionalExpression ".to_string())), loc) );
      println!( "{}", format!("{}{}", indent, "  test:".to_string()) );
      if  node.left.is_some() {
        ASTPrinter::printNode(node.left.unwrap(), depth + 2);
      }
      println!( "{}", format!("{}{}", indent, "  consequent:".to_string()) );
      if  node.body.is_some() {
        ASTPrinter::printNode(node.body.unwrap(), depth + 2);
      }
      println!( "{}", format!("{}{}", indent, "  alternate:".to_string()) );
      if  node.right.is_some() {
        ASTPrinter::printNode(node.right.unwrap(), depth + 2);
      }
      return;
    }
    if  nodeType == "CallExpression".to_string() {
      println!( "{}", format!("{}{}", (format!("{}{}", indent, "CallExpression ".to_string())), loc) );
      if  node.left.is_some() {
        println!( "{}", format!("{}{}", indent, "  callee:".to_string()) );
        ASTPrinter::printNode(node.left.unwrap(), depth + 2);
      }
      if  (node.children.len()) > 0 {
        println!( "{}", format!("{}{}", indent, "  arguments:".to_string()) );
        for ai_1 in 0..node.children.len() {
          let mut arg_1 = node.children[ai_1 as usize].clone();
          ASTPrinter::printNode(arg_1, depth + 2);
          node.children[ai_1 as usize] = arg_1;
        }
      }
      return;
    }
    if  nodeType == "MemberExpression".to_string() {
      if  node.strValue2 == "dot".to_string() {
        println!( "{}", format!("{}{}", (format!("{}{}", (format!("{}{}", (format!("{}{}", indent, "MemberExpression: .".to_string())), node.strValue)), " ".to_string())), loc) );
      } else {
        println!( "{}", format!("{}{}", (format!("{}{}", indent, "MemberExpression: [computed] ".to_string())), loc) );
      }
      if  node.left.is_some() {
        ASTPrinter::printNode(node.left.unwrap(), depth + 1);
      }
      if  node.right.is_some() {
        ASTPrinter::printNode(node.right.unwrap(), depth + 1);
      }
      return;
    }
    if  nodeType == "Identifier".to_string() {
      println!( "{}", format!("{}{}", (format!("{}{}", (format!("{}{}", (format!("{}{}", indent, "Identifier: ".to_string())), node.strValue)), " ".to_string())), loc) );
      return;
    }
    if  nodeType == "Literal".to_string() {
      println!( "{}", format!("{}{}", (format!("{}{}", (format!("{}{}", (format!("{}{}", (format!("{}{}", (format!("{}{}", indent, "Literal: ".to_string())), node.strValue)), " (".to_string())), node.strValue2)), ") ".to_string())), loc) );
      return;
    }
    if  nodeType == "ArrayExpression".to_string() {
      println!( "{}", format!("{}{}", (format!("{}{}", indent, "ArrayExpression ".to_string())), loc) );
      for ei in 0..node.children.len() {
        let mut elem = node.children[ei as usize].clone();
        ASTPrinter::printNode(elem, depth + 1);
        node.children[ei as usize] = elem;
      }
      return;
    }
    if  nodeType == "ObjectExpression".to_string() {
      println!( "{}", format!("{}{}", (format!("{}{}", indent, "ObjectExpression ".to_string())), loc) );
      for pi_2 in 0..node.children.len() {
        let mut prop = node.children[pi_2 as usize].clone();
        ASTPrinter::printNode(prop, depth + 1);
        node.children[pi_2 as usize] = prop;
      }
      return;
    }
    if  nodeType == "Property".to_string() {
      let mut shorthand : String = "".to_string();
      if  node.strValue2 == "shorthand".to_string() {
        shorthand = " (shorthand)".to_string();
      }
      println!( "{}", format!("{}{}", (format!("{}{}", (format!("{}{}", (format!("{}{}", (format!("{}{}", indent, "Property: ".to_string())), node.strValue)), shorthand)), " ".to_string())), loc) );
      if  node.left.is_some() {
        ASTPrinter::printNode(node.left.unwrap(), depth + 1);
      }
      return;
    }
    if  nodeType == "ArrayPattern".to_string() {
      println!( "{}", format!("{}{}", (format!("{}{}", indent, "ArrayPattern ".to_string())), loc) );
      for ei_1 in 0..node.children.len() {
        let mut elem_1 = node.children[ei_1 as usize].clone();
        ASTPrinter::printNode(elem_1, depth + 1);
        node.children[ei_1 as usize] = elem_1;
      }
      return;
    }
    if  nodeType == "ObjectPattern".to_string() {
      println!( "{}", format!("{}{}", (format!("{}{}", indent, "ObjectPattern ".to_string())), loc) );
      for pi_3 in 0..node.children.len() {
        let mut prop_1 = node.children[pi_3 as usize].clone();
        ASTPrinter::printNode(prop_1, depth + 1);
        node.children[pi_3 as usize] = prop_1;
      }
      return;
    }
    if  nodeType == "SpreadElement".to_string() {
      println!( "{}", format!("{}{}", (format!("{}{}", indent, "SpreadElement ".to_string())), loc) );
      if  node.left.is_some() {
        ASTPrinter::printNode(node.left.unwrap(), depth + 1);
      }
      return;
    }
    if  nodeType == "RestElement".to_string() {
      println!( "{}", format!("{}{}", (format!("{}{}", (format!("{}{}", (format!("{}{}", indent, "RestElement: ...".to_string())), node.strValue)), " ".to_string())), loc) );
      return;
    }
    if  nodeType == "WhileStatement".to_string() {
      println!( "{}", format!("{}{}", (format!("{}{}", indent, "WhileStatement ".to_string())), loc) );
      println!( "{}", format!("{}{}", indent, "  test:".to_string()) );
      if  node.test.is_some() {
        ASTPrinter::printNode(node.test.unwrap(), depth + 2);
      }
      println!( "{}", format!("{}{}", indent, "  body:".to_string()) );
      if  node.body.is_some() {
        ASTPrinter::printNode(node.body.unwrap(), depth + 2);
      }
      return;
    }
    if  nodeType == "DoWhileStatement".to_string() {
      println!( "{}", format!("{}{}", (format!("{}{}", indent, "DoWhileStatement ".to_string())), loc) );
      println!( "{}", format!("{}{}", indent, "  body:".to_string()) );
      if  node.body.is_some() {
        ASTPrinter::printNode(node.body.unwrap(), depth + 2);
      }
      println!( "{}", format!("{}{}", indent, "  test:".to_string()) );
      if  node.test.is_some() {
        ASTPrinter::printNode(node.test.unwrap(), depth + 2);
      }
      return;
    }
    if  nodeType == "ForStatement".to_string() {
      println!( "{}", format!("{}{}", (format!("{}{}", indent, "ForStatement ".to_string())), loc) );
      if  node.left.is_some() {
        println!( "{}", format!("{}{}", indent, "  init:".to_string()) );
        ASTPrinter::printNode(node.left.unwrap(), depth + 2);
      }
      if  node.test.is_some() {
        println!( "{}", format!("{}{}", indent, "  test:".to_string()) );
        ASTPrinter::printNode(node.test.unwrap(), depth + 2);
      }
      if  node.right.is_some() {
        println!( "{}", format!("{}{}", indent, "  update:".to_string()) );
        ASTPrinter::printNode(node.right.unwrap(), depth + 2);
      }
      println!( "{}", format!("{}{}", indent, "  body:".to_string()) );
      if  node.body.is_some() {
        ASTPrinter::printNode(node.body.unwrap(), depth + 2);
      }
      return;
    }
    if  nodeType == "ForOfStatement".to_string() {
      println!( "{}", format!("{}{}", (format!("{}{}", indent, "ForOfStatement ".to_string())), loc) );
      if  node.left.is_some() {
        println!( "{}", format!("{}{}", indent, "  left:".to_string()) );
        ASTPrinter::printNode(node.left.unwrap(), depth + 2);
      }
      if  node.right.is_some() {
        println!( "{}", format!("{}{}", indent, "  right:".to_string()) );
        ASTPrinter::printNode(node.right.unwrap(), depth + 2);
      }
      println!( "{}", format!("{}{}", indent, "  body:".to_string()) );
      if  node.body.is_some() {
        ASTPrinter::printNode(node.body.unwrap(), depth + 2);
      }
      return;
    }
    if  nodeType == "ForInStatement".to_string() {
      println!( "{}", format!("{}{}", (format!("{}{}", indent, "ForInStatement ".to_string())), loc) );
      if  node.left.is_some() {
        println!( "{}", format!("{}{}", indent, "  left:".to_string()) );
        ASTPrinter::printNode(node.left.unwrap(), depth + 2);
      }
      if  node.right.is_some() {
        println!( "{}", format!("{}{}", indent, "  right:".to_string()) );
        ASTPrinter::printNode(node.right.unwrap(), depth + 2);
      }
      println!( "{}", format!("{}{}", indent, "  body:".to_string()) );
      if  node.body.is_some() {
        ASTPrinter::printNode(node.body.unwrap(), depth + 2);
      }
      return;
    }
    if  nodeType == "SwitchStatement".to_string() {
      println!( "{}", format!("{}{}", (format!("{}{}", indent, "SwitchStatement ".to_string())), loc) );
      println!( "{}", format!("{}{}", indent, "  discriminant:".to_string()) );
      if  node.test.is_some() {
        ASTPrinter::printNode(node.test.unwrap(), depth + 2);
      }
      println!( "{}", format!("{}{}", indent, "  cases:".to_string()) );
      for ci_3 in 0..node.children.len() {
        let mut caseNode = node.children[ci_3 as usize].clone();
        ASTPrinter::printNode(caseNode, depth + 2);
        node.children[ci_3 as usize] = caseNode;
      }
      return;
    }
    if  nodeType == "SwitchCase".to_string() {
      if  node.strValue == "default".to_string() {
        println!( "{}", format!("{}{}", (format!("{}{}", indent, "SwitchCase: default ".to_string())), loc) );
      } else {
        println!( "{}", format!("{}{}", (format!("{}{}", indent, "SwitchCase ".to_string())), loc) );
        if  node.test.is_some() {
          println!( "{}", format!("{}{}", indent, "  test:".to_string()) );
          ASTPrinter::printNode(node.test.unwrap(), depth + 2);
        }
      }
      if  (node.children.len()) > 0 {
        println!( "{}", format!("{}{}", indent, "  consequent:".to_string()) );
        for si in 0..node.children.len() {
          let mut stmt = node.children[si as usize].clone();
          ASTPrinter::printNode(stmt, depth + 2);
          node.children[si as usize] = stmt;
        }
      }
      return;
    }
    if  nodeType == "TryStatement".to_string() {
      println!( "{}", format!("{}{}", (format!("{}{}", indent, "TryStatement ".to_string())), loc) );
      println!( "{}", format!("{}{}", indent, "  block:".to_string()) );
      if  node.body.is_some() {
        ASTPrinter::printNode(node.body.unwrap(), depth + 2);
      }
      if  node.left.is_some() {
        println!( "{}", format!("{}{}", indent, "  handler:".to_string()) );
        ASTPrinter::printNode(node.left.unwrap(), depth + 2);
      }
      if  node.right.is_some() {
        println!( "{}", format!("{}{}", indent, "  finalizer:".to_string()) );
        ASTPrinter::printNode(node.right.unwrap(), depth + 2);
      }
      return;
    }
    if  nodeType == "CatchClause".to_string() {
      println!( "{}", format!("{}{}", (format!("{}{}", (format!("{}{}", (format!("{}{}", indent, "CatchClause: ".to_string())), node.strValue)), " ".to_string())), loc) );
      if  node.body.is_some() {
        ASTPrinter::printNode(node.body.unwrap(), depth + 1);
      }
      return;
    }
    if  nodeType == "ThrowStatement".to_string() {
      println!( "{}", format!("{}{}", (format!("{}{}", indent, "ThrowStatement ".to_string())), loc) );
      if  node.left.is_some() {
        ASTPrinter::printNode(node.left.unwrap(), depth + 1);
      }
      return;
    }
    if  nodeType == "BreakStatement".to_string() {
      if  (node.strValue.len() as i64) > 0 {
        println!( "{}", format!("{}{}", (format!("{}{}", (format!("{}{}", (format!("{}{}", indent, "BreakStatement: ".to_string())), node.strValue)), " ".to_string())), loc) );
      } else {
        println!( "{}", format!("{}{}", (format!("{}{}", indent, "BreakStatement ".to_string())), loc) );
      }
      return;
    }
    if  nodeType == "ContinueStatement".to_string() {
      if  (node.strValue.len() as i64) > 0 {
        println!( "{}", format!("{}{}", (format!("{}{}", (format!("{}{}", (format!("{}{}", indent, "ContinueStatement: ".to_string())), node.strValue)), " ".to_string())), loc) );
      } else {
        println!( "{}", format!("{}{}", (format!("{}{}", indent, "ContinueStatement ".to_string())), loc) );
      }
      return;
    }
    println!( "{}", format!("{}{}", (format!("{}{}", (format!("{}{}", indent, nodeType)), " ".to_string())), loc) );
  }
}
#[derive(Clone)]
struct JSPrinter { 
  indentLevel : i64, 
  indentStr : String, 
  output : String, 
}
impl JSPrinter { 
  
  pub fn new() ->  JSPrinter {
    let mut me = JSPrinter { 
      indentLevel:0, 
      indentStr:"  ".to_string(), 
      output:"".to_string(), 
    };
    return me;
  }
  fn getIndent(&mut self, ) -> String {
    let mut result : String = "".to_string();
    let mut i : i64 = 0;
    while i < self.indentLevel {
      result = format!("{}{}", result, self.indentStr);
      i = i + 1;
    }
    return result.clone();
  }
  fn emit(&mut self, text : String) -> () {
    self.output = format!("{}{}", self.output, text);
  }
  fn emitLine(&mut self, text : String) -> () {
    self.output = format!("{}{}", (format!("{}{}", (format!("{}{}", self.output, self.getIndent())), text)), "\n".to_string());
  }
  fn emitIndent(&mut self, ) -> () {
    self.output = format!("{}{}", self.output, self.getIndent());
  }
  fn indent(&mut self, ) -> () {
    self.indentLevel = self.indentLevel + 1;
  }
  fn dedent(&mut self, ) -> () {
    self.indentLevel = self.indentLevel - 1;
  }
  fn printLeadingComments(&mut self, node : JSNode) -> () {
    let numComments : i64 = node.leadingComments.len();
    if  numComments == 0 {
      return;
    }
    for i in 0..node.leadingComments.len() {
      let mut comment = node.leadingComments[i as usize].clone();
      self.printComment(comment);
      node.leadingComments[i as usize] = comment;
    }
  }
  fn printComment(&mut self, comment : JSNode) -> () {
    let commentType : String = comment.nodeType;
    let value : String = comment.strValue;
    if  commentType == "LineComment".to_string() {
      self.emitLine(format!("{}{}", "//".to_string(), value));
      return;
    }
    if  commentType == "BlockComment".to_string() {
      self.emitLine(format!("{}{}", (format!("{}{}", "/*".to_string(), value)), "*/".to_string()));
      return;
    }
    if  commentType == "JSDocComment".to_string() {
      self.printJSDocComment(value);
      return;
    }
  }
  fn printJSDocComment(&mut self, value : String) -> () {
    self.emitLine(format!("{}{}", (format!("{}{}", "/*".to_string(), value)), "*/".to_string()));
  }
  fn print(&mut self, node : JSNode) -> String {
    self.output = "".to_string();
    self.indentLevel = 0;
    self.printNode(node);
    return self.output.clone();
  }
  fn printNode(&mut self, node : JSNode) -> () {
    let nodeType : String = node.nodeType;
    if  nodeType == "Program".to_string() {
      self.printProgram(node);
      return;
    }
    if  nodeType == "VariableDeclaration".to_string() {
      self.printVariableDeclaration(node);
      return;
    }
    if  nodeType == "FunctionDeclaration".to_string() {
      self.printFunctionDeclaration(node);
      return;
    }
    if  nodeType == "ClassDeclaration".to_string() {
      self.printClassDeclaration(node);
      return;
    }
    if  nodeType == "ImportDeclaration".to_string() {
      self.printImportDeclaration(node);
      return;
    }
    if  nodeType == "ExportNamedDeclaration".to_string() {
      self.printExportNamedDeclaration(node);
      return;
    }
    if  nodeType == "ExportDefaultDeclaration".to_string() {
      self.printExportDefaultDeclaration(node);
      return;
    }
    if  nodeType == "ExportAllDeclaration".to_string() {
      self.printExportAllDeclaration(node);
      return;
    }
    if  nodeType == "BlockStatement".to_string() {
      self.printBlockStatement(node);
      return;
    }
    if  nodeType == "ExpressionStatement".to_string() {
      self.printExpressionStatement(node);
      return;
    }
    if  nodeType == "ReturnStatement".to_string() {
      self.printReturnStatement(node);
      return;
    }
    if  nodeType == "IfStatement".to_string() {
      self.printIfStatement(node);
      return;
    }
    if  nodeType == "WhileStatement".to_string() {
      self.printWhileStatement(node);
      return;
    }
    if  nodeType == "DoWhileStatement".to_string() {
      self.printDoWhileStatement(node);
      return;
    }
    if  nodeType == "ForStatement".to_string() {
      self.printForStatement(node);
      return;
    }
    if  nodeType == "ForOfStatement".to_string() {
      self.printForOfStatement(node);
      return;
    }
    if  nodeType == "ForInStatement".to_string() {
      self.printForInStatement(node);
      return;
    }
    if  nodeType == "SwitchStatement".to_string() {
      self.printSwitchStatement(node);
      return;
    }
    if  nodeType == "TryStatement".to_string() {
      self.printTryStatement(node);
      return;
    }
    if  nodeType == "ThrowStatement".to_string() {
      self.printThrowStatement(node);
      return;
    }
    if  nodeType == "BreakStatement".to_string() {
      self.emit("break".to_string());
      return;
    }
    if  nodeType == "ContinueStatement".to_string() {
      self.emit("continue".to_string());
      return;
    }
    if  nodeType == "EmptyStatement".to_string() {
      return;
    }
    if  nodeType == "Identifier".to_string() {
      self.emit(node.strValue);
      return;
    }
    if  nodeType == "Literal".to_string() {
      self.printLiteral(node);
      return;
    }
    if  nodeType == "TemplateLiteral".to_string() {
      self.emit(format!("{}{}", (format!("{}{}", "`".to_string(), node.strValue)), "`".to_string()));
      return;
    }
    if  nodeType == "RegexLiteral".to_string() {
      self.emit(format!("{}{}", (format!("{}{}", (format!("{}{}", "/".to_string(), node.strValue)), "/".to_string())), node.strValue2));
      return;
    }
    if  nodeType == "ArrayExpression".to_string() {
      self.printArrayExpression(node);
      return;
    }
    if  nodeType == "ObjectExpression".to_string() {
      self.printObjectExpression(node);
      return;
    }
    if  nodeType == "BinaryExpression".to_string() {
      self.printBinaryExpression(node);
      return;
    }
    if  nodeType == "LogicalExpression".to_string() {
      self.printBinaryExpression(node);
      return;
    }
    if  nodeType == "UnaryExpression".to_string() {
      self.printUnaryExpression(node);
      return;
    }
    if  nodeType == "UpdateExpression".to_string() {
      self.printUpdateExpression(node);
      return;
    }
    if  nodeType == "AssignmentExpression".to_string() {
      self.printAssignmentExpression(node);
      return;
    }
    if  nodeType == "ConditionalExpression".to_string() {
      self.printConditionalExpression(node);
      return;
    }
    if  nodeType == "CallExpression".to_string() {
      self.printCallExpression(node);
      return;
    }
    if  nodeType == "OptionalCallExpression".to_string() {
      self.printOptionalCallExpression(node);
      return;
    }
    if  nodeType == "MemberExpression".to_string() {
      self.printMemberExpression(node);
      return;
    }
    if  nodeType == "OptionalMemberExpression".to_string() {
      self.printOptionalMemberExpression(node);
      return;
    }
    if  nodeType == "NewExpression".to_string() {
      self.printNewExpression(node);
      return;
    }
    if  nodeType == "ArrowFunctionExpression".to_string() {
      self.printArrowFunction(node);
      return;
    }
    if  nodeType == "FunctionExpression".to_string() {
      self.printFunctionExpression(node);
      return;
    }
    if  nodeType == "YieldExpression".to_string() {
      self.printYieldExpression(node);
      return;
    }
    if  nodeType == "AwaitExpression".to_string() {
      self.printAwaitExpression(node);
      return;
    }
    if  nodeType == "SpreadElement".to_string() {
      self.printSpreadElement(node);
      return;
    }
    if  nodeType == "RestElement".to_string() {
      self.emit(format!("{}{}", "...".to_string(), node.strValue));
      return;
    }
    if  nodeType == "ArrayPattern".to_string() {
      self.printArrayPattern(node);
      return;
    }
    if  nodeType == "ObjectPattern".to_string() {
      self.printObjectPattern(node);
      return;
    }
    self.emit(format!("{}{}", (format!("{}{}", "/* unknown: ".to_string(), nodeType)), " */".to_string()));
  }
  fn printProgram(&mut self, node : JSNode) -> () {
    for idx in 0..node.children.len() {
      let mut stmt = node.children[idx as usize].clone();
      self.printStatement(stmt);
      node.children[idx as usize] = stmt;
    }
  }
  fn printStatement(&mut self, node : JSNode) -> () {
    self.printLeadingComments(node);
    let nodeType : String = node.nodeType;
    if  nodeType == "BlockStatement".to_string() {
      self.printBlockStatement(node);
      return;
    }
    if  (((((((((nodeType == "FunctionDeclaration".to_string()) || (nodeType == "ClassDeclaration".to_string())) || (nodeType == "IfStatement".to_string())) || (nodeType == "WhileStatement".to_string())) || (nodeType == "DoWhileStatement".to_string())) || (nodeType == "ForStatement".to_string())) || (nodeType == "ForOfStatement".to_string())) || (nodeType == "ForInStatement".to_string())) || (nodeType == "SwitchStatement".to_string())) || (nodeType == "TryStatement".to_string()) {
      self.emitIndent();
      self.printNode(node);
      self.emit("\n".to_string());
      return;
    }
    self.emitIndent();
    self.printNode(node);
    self.emit(";\n".to_string());
  }
  fn printVariableDeclaration(&mut self, node : JSNode) -> () {
    let mut kind : String = node.strValue;
    if  (kind.len() as i64) == 0 {
      kind = "var".to_string();
    }
    self.emit(format!("{}{}", kind, " ".to_string()));
    let mut first : bool = true;
    for idx in 0..node.children.len() {
      let mut decl = node.children[idx as usize].clone();
      if  first == false {
        self.emit(", ".to_string());
      }
      first = false;
      self.printVariableDeclarator(decl);
      node.children[idx as usize] = decl;
    }
  }
  fn printVariableDeclarator(&mut self, node : JSNode) -> () {
    if  node.left.is_some() {
      let mut left : JSNode = node.left.unwrap();
      self.printNode(left);
    }
    if  node.right.is_some() {
      self.emit(" = ".to_string());
      self.printNode(node.right.unwrap());
    }
  }
  fn printFunctionDeclaration(&mut self, node : JSNode) -> () {
    let kind : String = node.strValue2;
    if  kind == "async".to_string() {
      self.emit("async ".to_string());
    }
    if  kind == "async-generator".to_string() {
      self.emit("async ".to_string());
    }
    self.emit("function".to_string());
    if  (kind == "generator".to_string()) || (kind == "async-generator".to_string()) {
      self.emit("*".to_string());
    }
    self.emit(format!("{}{}", (format!("{}{}", " ".to_string(), node.strValue)), "(".to_string()));
    self.printParams(node.children);
    self.emit(") ".to_string());
    if  node.body.is_some() {
      self.printNode(node.body.unwrap());
    }
  }
  fn printParams(&mut self, params : Vec<JSNode>) -> () {
    let mut first : bool = true;
    for idx in 0..params.len() {
      let mut p = params[idx as usize].clone();
      if  first == false {
        self.emit(", ".to_string());
      }
      first = false;
      self.printNode(p);
      params[idx as usize] = p;
    }
  }
  fn printClassDeclaration(&mut self, node : JSNode) -> () {
    self.emit(format!("{}{}", "class ".to_string(), node.strValue));
    if  node.left.is_some() {
      let mut superClass : JSNode = node.left.unwrap();
      self.emit(format!("{}{}", " extends ".to_string(), superClass.strValue));
    }
    self.emit(" ".to_string());
    if  node.body.is_some() {
      self.printClassBody(node.body.unwrap());
    }
  }
  fn printClassBody(&mut self, node : JSNode) -> () {
    self.emit("{\n".to_string());
    self.indent();
    for idx in 0..node.children.len() {
      let mut method = node.children[idx as usize].clone();
      self.printMethodDefinition(method);
      node.children[idx as usize] = method;
    }
    self.dedent();
    self.emitIndent();
    self.emit("}".to_string());
  }
  fn printMethodDefinition(&mut self, node : JSNode) -> () {
    self.emitIndent();
    if  node.strValue2 == "static".to_string() {
      self.emit("static ".to_string());
    }
    self.emit(format!("{}{}", node.strValue, "(".to_string()));
    if  node.body.is_some() {
      let mut func : JSNode = node.body.unwrap();
      self.printParams(func.children);
    }
    self.emit(") ".to_string());
    if  node.body.is_some() {
      let mut func_1 : JSNode = node.body.unwrap();
      if  func_1.body.is_some() {
        self.printNode(func_1.body.unwrap());
      }
    }
    self.emit("\n".to_string());
  }
  fn printBlockStatement(&mut self, node : JSNode) -> () {
    self.emit("{\n".to_string());
    self.indent();
    for idx in 0..node.children.len() {
      let mut stmt = node.children[idx as usize].clone();
      self.printStatement(stmt);
      node.children[idx as usize] = stmt;
    }
    self.dedent();
    self.emitIndent();
    self.emit("}".to_string());
  }
  fn printExpressionStatement(&mut self, node : JSNode) -> () {
    if  node.left.is_some() {
      self.printNode(node.left.unwrap());
    }
  }
  fn printReturnStatement(&mut self, node : JSNode) -> () {
    self.emit("return".to_string());
    if  node.left.is_some() {
      self.emit(" ".to_string());
      self.printNode(node.left.unwrap());
    }
  }
  fn printIfStatement(&mut self, node : JSNode) -> () {
    self.emit("if (".to_string());
    if  node.test.is_some() {
      self.printNode(node.test.unwrap());
    }
    self.emit(") ".to_string());
    if  node.body.is_some() {
      self.printNode(node.body.unwrap());
    }
    if  node.alternate.is_some() {
      self.emit(" else ".to_string());
      self.printNode(node.alternate.unwrap());
    }
  }
  fn printWhileStatement(&mut self, node : JSNode) -> () {
    self.emit("while (".to_string());
    if  node.test.is_some() {
      self.printNode(node.test.unwrap());
    }
    self.emit(") ".to_string());
    if  node.body.is_some() {
      self.printNode(node.body.unwrap());
    }
  }
  fn printDoWhileStatement(&mut self, node : JSNode) -> () {
    self.emit("do ".to_string());
    if  node.body.is_some() {
      self.printNode(node.body.unwrap());
    }
    self.emit(" while (".to_string());
    if  node.test.is_some() {
      self.printNode(node.test.unwrap());
    }
    self.emit(")".to_string());
  }
  fn printForStatement(&mut self, node : JSNode) -> () {
    self.emit("for (".to_string());
    if  node.left.is_some() {
      self.printNode(node.left.unwrap());
    }
    self.emit("; ".to_string());
    if  node.test.is_some() {
      self.printNode(node.test.unwrap());
    }
    self.emit("; ".to_string());
    if  node.right.is_some() {
      self.printNode(node.right.unwrap());
    }
    self.emit(") ".to_string());
    if  node.body.is_some() {
      self.printNode(node.body.unwrap());
    }
  }
  fn printForOfStatement(&mut self, node : JSNode) -> () {
    self.emit("for (".to_string());
    if  node.left.is_some() {
      self.printNode(node.left.unwrap());
    }
    self.emit(" of ".to_string());
    if  node.right.is_some() {
      self.printNode(node.right.unwrap());
    }
    self.emit(") ".to_string());
    if  node.body.is_some() {
      self.printNode(node.body.unwrap());
    }
  }
  fn printForInStatement(&mut self, node : JSNode) -> () {
    self.emit("for (".to_string());
    if  node.left.is_some() {
      self.printNode(node.left.unwrap());
    }
    self.emit(" in ".to_string());
    if  node.right.is_some() {
      self.printNode(node.right.unwrap());
    }
    self.emit(") ".to_string());
    if  node.body.is_some() {
      self.printNode(node.body.unwrap());
    }
  }
  fn printSwitchStatement(&mut self, node : JSNode) -> () {
    self.emit("switch (".to_string());
    if  node.test.is_some() {
      self.printNode(node.test.unwrap());
    }
    self.emit(") {\n".to_string());
    self.indent();
    for idx in 0..node.children.len() {
      let mut caseNode = node.children[idx as usize].clone();
      self.printSwitchCase(caseNode);
      node.children[idx as usize] = caseNode;
    }
    self.dedent();
    self.emitIndent();
    self.emit("}".to_string());
  }
  fn printSwitchCase(&mut self, node : JSNode) -> () {
    if  node.strValue == "default".to_string() {
      self.emitLine("default:".to_string());
    } else {
      self.emitIndent();
      self.emit("case ".to_string());
      if  node.test.is_some() {
        self.printNode(node.test.unwrap());
      }
      self.emit(":\n".to_string());
    }
    self.indent();
    for idx in 0..node.children.len() {
      let mut stmt = node.children[idx as usize].clone();
      self.printStatement(stmt);
      node.children[idx as usize] = stmt;
    }
    self.dedent();
  }
  fn printTryStatement(&mut self, node : JSNode) -> () {
    self.emit("try ".to_string());
    if  node.body.is_some() {
      self.printNode(node.body.unwrap());
    }
    if  node.left.is_some() {
      let mut catchClause : JSNode = node.left.unwrap();
      self.emit(format!("{}{}", (format!("{}{}", " catch (".to_string(), catchClause.strValue)), ") ".to_string()));
      if  catchClause.body.is_some() {
        self.printNode(catchClause.body.unwrap());
      }
    }
    if  node.right.is_some() {
      self.emit(" finally ".to_string());
      self.printNode(node.right.unwrap());
    }
  }
  fn printThrowStatement(&mut self, node : JSNode) -> () {
    self.emit("throw ".to_string());
    if  node.left.is_some() {
      self.printNode(node.left.unwrap());
    }
  }
  fn printLiteral(&mut self, node : JSNode) -> () {
    let litType : String = node.strValue2;
    if  litType == "string".to_string() {
      self.emit(format!("{}{}", (format!("{}{}", "'".to_string(), node.strValue)), "'".to_string()));
    } else {
      self.emit(node.strValue);
    }
  }
  fn printArrayExpression(&mut self, node : JSNode) -> () {
    self.emit("[".to_string());
    let mut first : bool = true;
    for idx in 0..node.children.len() {
      let mut elem = node.children[idx as usize].clone();
      if  first == false {
        self.emit(", ".to_string());
      }
      first = false;
      self.printNode(elem);
      node.children[idx as usize] = elem;
    }
    self.emit("]".to_string());
  }
  fn printObjectExpression(&mut self, node : JSNode) -> () {
    if  (node.children.len()) == 0 {
      self.emit("{}".to_string());
      return;
    }
    self.emit("{ ".to_string());
    let mut first : bool = true;
    for idx in 0..node.children.len() {
      let mut prop = node.children[idx as usize].clone();
      if  first == false {
        self.emit(", ".to_string());
      }
      first = false;
      self.printProperty(prop);
      node.children[idx as usize] = prop;
    }
    self.emit(" }".to_string());
  }
  fn printProperty(&mut self, node : JSNode) -> () {
    let nodeType : String = node.nodeType;
    if  nodeType == "SpreadElement".to_string() {
      self.printSpreadElement(node);
      return;
    }
    if  node.strValue2 == "shorthand".to_string() {
      self.emit(node.strValue);
      return;
    }
    if  node.strValue2 == "computed".to_string() {
      self.emit("[".to_string());
      if  node.right.is_some() {
        self.printNode(node.right.unwrap());
      }
      self.emit("]: ".to_string());
      if  node.left.is_some() {
        self.printNode(node.left.unwrap());
      }
      return;
    }
    self.emit(format!("{}{}", node.strValue, ": ".to_string()));
    if  node.left.is_some() {
      self.printNode(node.left.unwrap());
    }
  }
  fn printBinaryExpression(&mut self, node : JSNode) -> () {
    self.emit("(".to_string());
    if  node.left.is_some() {
      self.printNode(node.left.unwrap());
    }
    self.emit(format!("{}{}", (format!("{}{}", " ".to_string(), node.strValue)), " ".to_string()));
    if  node.right.is_some() {
      self.printNode(node.right.unwrap());
    }
    self.emit(")".to_string());
  }
  fn printUnaryExpression(&mut self, node : JSNode) -> () {
    let op : String = node.strValue;
    self.emit(op);
    if  op == "typeof".to_string() {
      self.emit(" ".to_string());
    }
    if  node.left.is_some() {
      self.printNode(node.left.unwrap());
    }
  }
  fn printUpdateExpression(&mut self, node : JSNode) -> () {
    let op : String = node.strValue;
    let isPrefix : bool = node.strValue2 == "prefix".to_string();
    if  isPrefix {
      self.emit(op);
    }
    if  node.left.is_some() {
      self.printNode(node.left.unwrap());
    }
    if  isPrefix == false {
      self.emit(op);
    }
  }
  fn printAssignmentExpression(&mut self, node : JSNode) -> () {
    if  node.left.is_some() {
      self.printNode(node.left.unwrap());
    }
    self.emit(format!("{}{}", (format!("{}{}", " ".to_string(), node.strValue)), " ".to_string()));
    if  node.right.is_some() {
      self.printNode(node.right.unwrap());
    }
  }
  fn printConditionalExpression(&mut self, node : JSNode) -> () {
    if  node.left.is_some() {
      self.printNode(node.left.unwrap());
    }
    self.emit(" ? ".to_string());
    if  node.body.is_some() {
      self.printNode(node.body.unwrap());
    }
    self.emit(" : ".to_string());
    if  node.right.is_some() {
      self.printNode(node.right.unwrap());
    }
  }
  fn printCallExpression(&mut self, node : JSNode) -> () {
    if  node.left.is_some() {
      self.printNode(node.left.unwrap());
    }
    self.emit("(".to_string());
    let mut first : bool = true;
    for idx in 0..node.children.len() {
      let mut arg = node.children[idx as usize].clone();
      if  first == false {
        self.emit(", ".to_string());
      }
      first = false;
      self.printNode(arg);
      node.children[idx as usize] = arg;
    }
    self.emit(")".to_string());
  }
  fn printMemberExpression(&mut self, node : JSNode) -> () {
    if  node.left.is_some() {
      self.printNode(node.left.unwrap());
    }
    let accessType : String = node.strValue2;
    if  accessType == "bracket".to_string() {
      self.emit("[".to_string());
      if  node.right.is_some() {
        self.printNode(node.right.unwrap());
      }
      self.emit("]".to_string());
    } else {
      self.emit(format!("{}{}", ".".to_string(), node.strValue));
    }
  }
  fn printOptionalMemberExpression(&mut self, node : JSNode) -> () {
    if  node.left.is_some() {
      self.printNode(node.left.unwrap());
    }
    let accessType : String = node.strValue2;
    if  accessType == "bracket".to_string() {
      self.emit("?.[".to_string());
      if  node.right.is_some() {
        self.printNode(node.right.unwrap());
      }
      self.emit("]".to_string());
    } else {
      self.emit(format!("{}{}", "?.".to_string(), node.strValue));
    }
  }
  fn printOptionalCallExpression(&mut self, node : JSNode) -> () {
    if  node.left.is_some() {
      self.printNode(node.left.unwrap());
    }
    self.emit("?.(".to_string());
    let mut first : bool = true;
    for idx in 0..node.children.len() {
      let mut arg = node.children[idx as usize].clone();
      if  first == false {
        self.emit(", ".to_string());
      }
      first = false;
      self.printNode(arg);
      node.children[idx as usize] = arg;
    }
    self.emit(")".to_string());
  }
  fn printImportDeclaration(&mut self, node : JSNode) -> () {
    self.emit("import ".to_string());
    let numSpecifiers : i64 = node.children.len();
    if  numSpecifiers == 0 {
      if  node.right.is_some() {
        let mut source : JSNode = node.right.unwrap();
        self.emit(format!("{}{}", (format!("{}{}", "\"".to_string(), source.strValue)), "\"".to_string()));
      }
      return;
    }
    let mut hasDefault : bool = false;
    let mut hasNamespace : bool = false;
    let mut hasNamed : bool = false;
    for idx in 0..node.children.len() {
      let mut spec = node.children[idx as usize].clone();
      if  spec.nodeType == "ImportDefaultSpecifier".to_string() {
        hasDefault = true;
      }
      if  spec.nodeType == "ImportNamespaceSpecifier".to_string() {
        hasNamespace = true;
      }
      if  spec.nodeType == "ImportSpecifier".to_string() {
        hasNamed = true;
      }
      node.children[idx as usize] = spec;
    }
    let mut printedSomething : bool = false;
    for idx_1 in 0..node.children.len() {
      let mut spec_1 = node.children[idx_1 as usize].clone();
      if  spec_1.nodeType == "ImportDefaultSpecifier".to_string() {
        self.emit(spec_1.strValue);
        printedSomething = true;
      }
      node.children[idx_1 as usize] = spec_1;
    }
    for idx_2 in 0..node.children.len() {
      let mut spec_2 = node.children[idx_2 as usize].clone();
      if  spec_2.nodeType == "ImportNamespaceSpecifier".to_string() {
        if  printedSomething {
          self.emit(", ".to_string());
        }
        self.emit(format!("{}{}", "* as ".to_string(), spec_2.strValue));
        printedSomething = true;
      }
      node.children[idx_2 as usize] = spec_2;
    }
    if  hasNamed {
      if  printedSomething {
        self.emit(", ".to_string());
      }
      self.emit("{ ".to_string());
      let mut firstNamed : bool = true;
      for idx_3 in 0..node.children.len() {
        let mut spec_3 = node.children[idx_3 as usize].clone();
        if  spec_3.nodeType == "ImportSpecifier".to_string() {
          if  firstNamed == false {
            self.emit(", ".to_string());
          }
          firstNamed = false;
          self.emit(spec_3.strValue);
          if  (spec_3.strValue2.len() as i64) > 0 {
            self.emit(format!("{}{}", " as ".to_string(), spec_3.strValue2));
          }
        }
        node.children[idx_3 as usize] = spec_3;
      }
      self.emit(" }".to_string());
    }
    self.emit(" from ".to_string());
    if  node.right.is_some() {
      let mut source_1 : JSNode = node.right.unwrap();
      self.emit(format!("{}{}", (format!("{}{}", "\"".to_string(), source_1.strValue)), "\"".to_string()));
    }
  }
  fn printExportNamedDeclaration(&mut self, node : JSNode) -> () {
    self.emit("export ".to_string());
    let numSpecifiers : i64 = node.children.len();
    if  numSpecifiers > 0 {
      self.emit("{ ".to_string());
      let mut first : bool = true;
      for idx in 0..node.children.len() {
        let mut spec = node.children[idx as usize].clone();
        if  first == false {
          self.emit(", ".to_string());
        }
        first = false;
        self.emit(spec.strValue);
        if  (spec.strValue2.len() as i64) > 0 {
          self.emit(format!("{}{}", " as ".to_string(), spec.strValue2));
        }
        node.children[idx as usize] = spec;
      }
      self.emit(" }".to_string());
      if  node.right.is_some() {
        let mut source : JSNode = node.right.unwrap();
        self.emit(format!("{}{}", (format!("{}{}", " from \"".to_string(), source.strValue)), "\"".to_string()));
      }
      return;
    }
    if  node.left.is_some() {
      self.printNode(node.left.unwrap());
    }
  }
  fn printExportDefaultDeclaration(&mut self, node : JSNode) -> () {
    self.emit("export default ".to_string());
    if  node.left.is_some() {
      self.printNode(node.left.unwrap());
    }
  }
  fn printExportAllDeclaration(&mut self, node : JSNode) -> () {
    self.emit("export *".to_string());
    if  (node.strValue.len() as i64) > 0 {
      self.emit(format!("{}{}", " as ".to_string(), node.strValue));
    }
    self.emit(" from ".to_string());
    if  node.right.is_some() {
      let mut source : JSNode = node.right.unwrap();
      self.emit(format!("{}{}", (format!("{}{}", "\"".to_string(), source.strValue)), "\"".to_string()));
    }
  }
  fn printNewExpression(&mut self, node : JSNode) -> () {
    self.emit("new ".to_string());
    if  node.left.is_some() {
      self.printNode(node.left.unwrap());
    }
    self.emit("(".to_string());
    let mut first : bool = true;
    for idx in 0..node.children.len() {
      let mut arg = node.children[idx as usize].clone();
      if  first == false {
        self.emit(", ".to_string());
      }
      first = false;
      self.printNode(arg);
      node.children[idx as usize] = arg;
    }
    self.emit(")".to_string());
  }
  fn printArrowFunction(&mut self, node : JSNode) -> () {
    if  node.strValue2 == "async".to_string() {
      self.emit("async ".to_string());
    }
    let paramCount : i64 = node.children.len();
    if  paramCount == 1 {
      let mut firstParam : JSNode = node.children[0 as usize].clone();
      if  firstParam.nodeType == "Identifier".to_string() {
        self.emit(firstParam.strValue);
      } else {
        self.emit("(".to_string());
        self.printNode(firstParam);
        self.emit(")".to_string());
      }
    } else {
      self.emit("(".to_string());
      self.printParams(node.children);
      self.emit(")".to_string());
    }
    self.emit(" => ".to_string());
    if  node.body.is_some() {
      let mut body : JSNode = node.body.unwrap();
      if  body.nodeType == "BlockStatement".to_string() {
        self.printNode(body);
      } else {
        self.printNode(body);
      }
    }
  }
  fn printFunctionExpression(&mut self, node : JSNode) -> () {
    self.emit("function(".to_string());
    self.printParams(node.children);
    self.emit(") ".to_string());
    if  node.body.is_some() {
      self.printNode(node.body.unwrap());
    }
  }
  fn printYieldExpression(&mut self, node : JSNode) -> () {
    self.emit("yield".to_string());
    if  node.strValue == "delegate".to_string() {
      self.emit("*".to_string());
    }
    if  node.left.is_some() {
      self.emit(" ".to_string());
      self.printNode(node.left.unwrap());
    }
  }
  fn printAwaitExpression(&mut self, node : JSNode) -> () {
    self.emit("await ".to_string());
    if  node.left.is_some() {
      self.printNode(node.left.unwrap());
    }
  }
  fn printSpreadElement(&mut self, node : JSNode) -> () {
    self.emit("...".to_string());
    if  node.left.is_some() {
      self.printNode(node.left.unwrap());
    }
  }
  fn printArrayPattern(&mut self, node : JSNode) -> () {
    self.emit("[".to_string());
    let mut first : bool = true;
    for idx in 0..node.children.len() {
      let mut elem = node.children[idx as usize].clone();
      if  first == false {
        self.emit(", ".to_string());
      }
      first = false;
      self.printNode(elem);
      node.children[idx as usize] = elem;
    }
    self.emit("]".to_string());
  }
  fn printObjectPattern(&mut self, node : JSNode) -> () {
    self.emit("{ ".to_string());
    let mut first : bool = true;
    for idx in 0..node.children.len() {
      let mut prop = node.children[idx as usize].clone();
      if  first == false {
        self.emit(", ".to_string());
      }
      first = false;
      let propType : String = prop.nodeType;
      if  propType == "RestElement".to_string() {
        self.emit(format!("{}{}", "...".to_string(), prop.strValue));
      } else {
        if  prop.strValue2 == "shorthand".to_string() {
          self.emit(prop.strValue);
        } else {
          self.emit(format!("{}{}", prop.strValue, ": ".to_string()));
          if  prop.left.is_some() {
            self.printNode(prop.left.unwrap());
          }
        }
      }
      node.children[idx as usize] = prop;
    }
    self.emit(" }".to_string());
  }
}
#[derive(Clone)]
struct JSParserMain { 
}
impl JSParserMain { 
  
  pub fn new() ->  JSParserMain {
    let mut me = JSParserMain { 
    };
    return me;
  }
  pub fn showHelp() -> () {
    println!( "{}", "JavaScript ES6 Parser and Pretty Printer".to_string() );
    println!( "{}", "".to_string() );
    println!( "{}", "Usage: node js_parser.js [options]".to_string() );
    println!( "{}", "".to_string() );
    println!( "{}", "Options:".to_string() );
    println!( "{}", "  -h, --help     Show this help message".to_string() );
    println!( "{}", "  -d             Run built-in demo/test suite".to_string() );
    println!( "{}", "  -i <file>      Input JavaScript file to parse".to_string() );
    println!( "{}", "  -o <file>      Output file for pretty-printed JavaScript".to_string() );
    println!( "{}", "  --ast          Show AST instead of pretty-printed output (with -i)".to_string() );
    println!( "{}", "".to_string() );
    println!( "{}", "Examples:".to_string() );
    println!( "{}", "  node js_parser.js -d                        Run the demo".to_string() );
    println!( "{}", "  node js_parser.js -i script.js              Parse and show AST".to_string() );
    println!( "{}", "  node js_parser.js -i script.js -o out.js    Parse and pretty-print to file".to_string() );
    println!( "{}", "  node js_parser.js -i src/app.js -o dist/app.js".to_string() );
  }
  pub fn processFile(inputFile : String, outputFile : String) -> () {
    let codeOpt : Option<String> = r_read_file(&".".to_string(), &inputFile);
    if  codeOpt.is_null() {
      println!( "{}", format!("{}{}", "Error: Could not read file: ".to_string(), inputFile) );
      return;
    }
    let code : String = codeOpt.unwrap();
    let mut lexer : Lexer = Lexer::new(code);
    let mut tokens : Vec<Token> = lexer.tokenize();
    let mut parser : SimpleParser = SimpleParser::new();
    parser.initParserWithSource(tokens, code);
    let mut program : JSNode = parser.parseProgram();
    if  parser.hasErrors() {
      println!( "{}", "=== Parse Errors ===".to_string() );
      for ei in 0..parser.errors.len() {
        let mut err = parser.errors[ei as usize].clone();
        println!( "{}", err );
        parser.errors[ei as usize] = err;
      }
      println!( "{}", "".to_string() );
    }
    let mut printer : JSPrinter = JSPrinter::new();
    let output : String = (printer).print(program);
    r_write_file(&".".to_string(), &outputFile, &output)
    println!( "{}", format!("{}{}", (format!("{}{}", (format!("{}{}", "Parsed ".to_string(), inputFile)), " -> ".to_string())), outputFile) );
    println!( "{}", format!("{}{}", (["  ".to_string() , ((program.children.len()).to_string()) ].join("")), " statements processed".to_string()) );
  }
  pub fn parseFile(filename : String) -> () {
    let codeOpt : Option<String> = r_read_file(&".".to_string(), &filename);
    if  codeOpt.is_null() {
      println!( "{}", format!("{}{}", "Error: Could not read file: ".to_string(), filename) );
      return;
    }
    let code : String = codeOpt.unwrap();
    let mut lexer : Lexer = Lexer::new(code);
    let mut tokens : Vec<Token> = lexer.tokenize();
    let mut parser : SimpleParser = SimpleParser::new();
    parser.initParserWithSource(tokens, code);
    let mut program : JSNode = parser.parseProgram();
    if  parser.hasErrors() {
      println!( "{}", "=== Parse Errors ===".to_string() );
      for ei in 0..parser.errors.len() {
        let mut err = parser.errors[ei as usize].clone();
        println!( "{}", err );
        parser.errors[ei as usize] = err;
      }
      println!( "{}", "".to_string() );
    }
    println!( "{}", format!("{}{}", (["Program with ".to_string() , ((program.children.len()).to_string()) ].join("")), " statements:".to_string()) );
    println!( "{}", "".to_string() );
    for idx in 0..program.children.len() {
      let mut stmt = program.children[idx as usize].clone();
      ASTPrinter::printNode(stmt, 0);
      program.children[idx as usize] = stmt;
    }
  }
  pub fn runDemo() -> () {
    let code : String = "// Variable declarations\r\nvar y = 'hello';\r\n\r\n// Function declaration\r\nfunction add(a, b) {\r\n    return a + b;\r\n}\r\n\r\n// While loop\r\nvar i = 0;\r\nwhile (i < 10) {\r\n    i = i + 1;\r\n}\r\n\r\n// Do-while loop\r\ndo {\r\n    i = i - 1;\r\n} while (i > 0);\r\n\r\n// For loop\r\nfor (var j = 0; j < 5; j = j + 1) {\r\n    x = x + j;\r\n}\r\n\r\n// Switch statement\r\nswitch (x) {\r\n    case 1:\r\n        y = 'one';\r\n        break;\r\n    case 2:\r\n        y = 'two';\r\n        break;\r\n    default:\r\n        y = 'other';\r\n}\r\n\r\n// Try-catch-finally\r\ntry {\r\n    throw 'error';\r\n} catch (e) {\r\n    y = e;\r\n} finally {\r\n    x = 0;\r\n}\r\n\r\n// If-else\r\nif (x > 100) {\r\n    y = 'big';\r\n} else {\r\n    y = 'small';\r\n}\r\n\r\nvar arr = [1, 2, 3];\r\nvar obj = { name: 'test', value: 42 };\r\n\r\n// Unary expressions\r\nvar negNum = -42;\r\nvar posNum = +5;\r\nvar notTrue = !true;\r\nvar notFalse = !false;\r\nvar doubleNot = !!x;\r\nvar negExpr = -(a + b);\r\n\r\n// Logical expressions\r\nvar andResult = true && false;\r\nvar orResult = true || false;\r\nvar complexLogic = (a > 0) && (b < 10) || (c == 5);\r\nvar shortCircuit = x && y && z;\r\nvar orChain = a || b || c;\r\n\r\n// Ternary expressions\r\nvar ternResult = x > 0 ? 'positive' : 'non-positive';\r\nvar nestedTern = a > b ? (b > c ? 'a>b>c' : 'a>b, b<=c') : 'a<=b';\r\nvar ternInExpr = 1 + (x ? 2 : 3);\r\n\r\n// Operator precedence tests\r\nvar prec1 = 1 + 2 * 3;\r\nvar prec2 = (1 + 2) * 3;\r\nvar prec3 = 1 + 2 + 3 + 4;\r\nvar prec4 = 2 * 3 + 4 * 5;\r\nvar prec5 = 1 < 2 && 3 > 1;\r\nvar prec6 = !x && y || z;\r\nvar prec7 = a == b && c != d;\r\nvar prec8 = -x + y * -z;\r\n\r\n// Comparison operators\r\nvar cmp1 = a == b;\r\nvar cmp2 = a != b;\r\nvar cmp3 = a < b;\r\nvar cmp4 = a <= b;\r\nvar cmp5 = a > b;\r\nvar cmp6 = a >= b;\r\n\r\n// === ES6 Features ===\r\n\r\n// let and const\r\nlet count = 0;\r\nconst PI = 3.14159;\r\n\r\n// Arrow functions\r\nconst add = (a, b) => a + b;\r\nconst double = x => x * 2;\r\nconst greet = (name) => {\r\n    return 'Hello, ' + name;\r\n};\r\nconst multiLine = (a, b) => {\r\n    let sum = a + b;\r\n    return sum * 2;\r\n};\r\n\r\n// Template literals\r\nlet name = 'World';\r\nlet greeting = `Hello, ${name}!`;\r\nlet multi = `Line 1\r\nLine 2`;\r\n\r\n// Class syntax\r\nclass Animal {\r\n    constructor(name) {\r\n        this.name = name;\r\n    }\r\n    \r\n    speak() {\r\n        return this.name + ' makes a sound';\r\n    }\r\n    \r\n    static create(name) {\r\n        return new Animal(name);\r\n    }\r\n}\r\n\r\nclass Dog extends Animal {\r\n    constructor(name, breed) {\r\n        super(name);\r\n        this.breed = breed;\r\n    }\r\n    \r\n    speak() {\r\n        return this.name + ' barks';\r\n    }\r\n}\r\n\r\n// Generator functions\r\nfunction* numberGenerator() {\r\n    yield 1;\r\n    yield 2;\r\n    yield 3;\r\n}\r\n\r\nfunction* delegateGenerator() {\r\n    yield* numberGenerator();\r\n    yield 4;\r\n}\r\n\r\n// Async/await\r\nasync function fetchData() {\r\n    const response = await fetch('/api/data');\r\n    const data = await response.json();\r\n    return data;\r\n}\r\n\r\nasync function processItems(items) {\r\n    for (const item of items) {\r\n        await processItem(item);\r\n    }\r\n}\r\n\r\n// Async arrow functions\r\nconst asyncArrow = async (x) => {\r\n    const result = await doSomething(x);\r\n    return result * 2;\r\n};\r\n\r\nconst asyncFetch = async (url) => await fetch(url);\r\n\r\n// Async generator (ES2018)\r\nasync function* asyncGenerator() {\r\n    yield await fetch('/api/1');\r\n    yield await fetch('/api/2');\r\n}\r\n\r\n// === for...of and for...in loops ===\r\n\r\n// For-of loop\r\nfor (const item of items) {\r\n    console.log(item);\r\n}\r\n\r\n// For-in loop\r\nfor (const key in obj) {\r\n    console.log(key);\r\n}\r\n\r\n// For-of with array destructuring\r\nfor (const [index, value] of entries) {\r\n    console.log(index, value);\r\n}\r\n\r\n// === Spread operator ===\r\n\r\n// Array spread\r\nconst arr1 = [1, 2, 3];\r\nconst arr2 = [...arr1, 4, 5];\r\nconst combined = [...arr1, ...arr2];\r\n\r\n// Object spread\r\nconst obj1 = { a: 1, b: 2 };\r\nconst obj2 = { ...obj1, c: 3 };\r\nconst merged = { ...obj1, ...obj2 };\r\n\r\n// Spread in function call\r\nconsole.log(...args);\r\n\r\n// === Rest parameters ===\r\n\r\nfunction sum(...numbers) {\r\n    return numbers.reduce((a, b) => a + b);\r\n}\r\n\r\nfunction firstAndRest(first, ...rest) {\r\n    return { first, rest };\r\n}\r\n\r\n// === Destructuring ===\r\n\r\n// Array destructuring\r\nconst [x, y, z] = [1, 2, 3];\r\nconst [first, ...others] = arr1;\r\nlet [a, b] = [b, a];\r\n\r\n// Object destructuring\r\nconst { name, age } = person;\r\nconst { x: newX, y: newY } = point;\r\nconst { a: { b: nested } } = deep;\r\n\r\n// Destructuring with default (parsed as identifier for now)\r\nconst { foo, bar } = obj;\r\n\r\n// Nested destructuring\r\nconst { user: { name: userName } } = data;\r\nconst [{ id }, { id: id2 }] = items;\r\n\r\n// Shorthand properties\r\nconst shorthand = { x, y, z };\r\n".to_string();
    println!( "{}", "=== JavaScript ES6 Parser ===".to_string() );
    println!( "{}", "".to_string() );
    println!( "{}", "Input:".to_string() );
    println!( "{}", code );
    println!( "{}", "".to_string() );
    let mut lexer : Lexer = Lexer::new(code);
    let mut tokens : Vec<Token> = lexer.tokenize();
    println!( "{}", format!("{}{}", (["--- Tokens: ".to_string() , ((tokens.len()).to_string()) ].join("")), " ---".to_string()) );
    println!( "{}", "".to_string() );
    let mut parser : SimpleParser = SimpleParser::new();
    parser.initParserWithSource(tokens, code);
    let mut program : JSNode = parser.parseProgram();
    if  parser.hasErrors() {
      println!( "{}", "=== Parse Errors ===".to_string() );
      for ei in 0..parser.errors.len() {
        let mut err = parser.errors[ei as usize].clone();
        println!( "{}", err );
        parser.errors[ei as usize] = err;
      }
      println!( "{}", "".to_string() );
    }
    println!( "{}", format!("{}{}", (["Program with ".to_string() , ((program.children.len()).to_string()) ].join("")), " statements:".to_string()) );
    println!( "{}", "".to_string() );
    println!( "{}", "--- AST ---".to_string() );
    for idx in 0..program.children.len() {
      let mut stmt = program.children[idx as usize].clone();
      ASTPrinter::printNode(stmt, 0);
      program.children[idx as usize] = stmt;
    }
    println!( "{}", "".to_string() );
    println!( "{}", "--- Pretty Printed Output ---".to_string() );
    let mut printer : JSPrinter = JSPrinter::new();
    let output : String = (printer).print(program);
    println!( "{}", output );
  }
}
fn main() {
  let argCnt : i64 = (std::env::args().len() as i64 - 1);
  if  argCnt == 0 {
    JSParserMain::showHelp();
    return;
  }
  let mut inputFile : String = "".to_string();
  let mut outputFile : String = "".to_string();
  let mut runDefault : bool = false;
  let mut showAst : bool = false;
  let mut i : i64 = 0;
  while i < argCnt {
    let arg : String = std::env::args().nth((i + 1) as usize).unwrap_or_default();
    if  (arg == "--help".to_string()) || (arg == "-h".to_string()) {
      JSParserMain::showHelp();
      return;
    }
    if  arg == "-d".to_string() {
      runDefault = true;
      i = i + 1;
    } else {
      if  arg == "-i".to_string() {
        i = i + 1;
        if  i < argCnt {
          inputFile = std::env::args().nth((i + 1) as usize).unwrap_or_default();
        }
        i = i + 1;
      } else {
        if  arg == "-o".to_string() {
          i = i + 1;
          if  i < argCnt {
            outputFile = std::env::args().nth((i + 1) as usize).unwrap_or_default();
          }
          i = i + 1;
        } else {
          if  arg == "--ast".to_string() {
            showAst = true;
            i = i + 1;
          } else {
            i = i + 1;
          }
        }
      }
    }
  }
  if  runDefault {
    JSParserMain::runDemo();
    return;
  }
  if  (inputFile.len() as i64) > 0 {
    if  (outputFile.len() as i64) > 0 {
      JSParserMain::processFile(inputFile, outputFile);
    } else {
      JSParserMain::parseFile(inputFile);
    }
    return;
  }
  JSParserMain::showHelp();
}

fn r_read_file(path: &str, filename: &str) -> Option<String> {
    let full_path = format!("{}/{}", path, filename);
    std::fs::read_to_string(full_path).ok()
}


fn r_write_file(path: &str, filename: &str, data: &str) {
    let full_path = format!("{}/{}", path, filename);
    let _ = std::fs::write(full_path, data);
}

