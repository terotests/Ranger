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
      __len:0, 
    };
    me.source = src.clone();
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
    if  (ch == "\n".to_string()) || (ch == "\r\n".to_string()) {
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
    if  self.isDigit(ch.clone()) {
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
    if  ch == "\r\n".to_string() {
      return true;
    }
    return false;
  }
  fn skipWhitespace(&mut self, ) -> () {
    while self.pos < self.__len {
      let ch : String = self.peek();
      if  self.isWhitespace(ch.clone()) {
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
        return self.makeToken("LineComment".to_string(), value.clone(), startPos, startLine, startCol).clone();
      }
      if  ch == "\r\n".to_string() {
        return self.makeToken("LineComment".to_string(), value.clone(), startPos, startLine, startCol).clone();
      }
      value = format!("{}{}", value, self.advance());
    }
    return self.makeToken("LineComment".to_string(), value.clone(), startPos, startLine, startCol).clone();
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
            return self.makeToken("JSDocComment".to_string(), value.clone(), startPos, startLine, startCol).clone();
          }
          return self.makeToken("BlockComment".to_string(), value.clone(), startPos, startLine, startCol).clone();
        }
      }
      value = format!("{}{}", value, self.advance());
    }
    if  isJSDoc {
      return self.makeToken("JSDocComment".to_string(), value.clone(), startPos, startLine, startCol).clone();
    }
    return self.makeToken("BlockComment".to_string(), value.clone(), startPos, startLine, startCol).clone();
  }
  fn makeToken(&mut self, tokType : String, value : String, startPos : i64, startLine : i64, startCol : i64) -> Token {
    let mut tok : Token = Token::new();
    tok.tokenType = tokType.clone();
    tok.value = value.clone();
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
        return self.makeToken("String".to_string(), value.clone(), startPos, startLine, startCol).clone();
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
    return self.makeToken("String".to_string(), value.clone(), startPos, startLine, startCol).clone();
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
          return self.makeToken("TemplateLiteral".to_string(), value.clone(), startPos, startLine, startCol).clone();
        } else {
          return self.makeToken("TemplateLiteral".to_string(), value.clone(), startPos, startLine, startCol).clone();
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
    return self.makeToken("TemplateLiteral".to_string(), value.clone(), startPos, startLine, startCol).clone();
  }
  fn readNumber(&mut self, ) -> Token {
    let startPos : i64 = self.pos;
    let startLine : i64 = self.line;
    let startCol : i64 = self.col;
    let mut value : String = "".to_string();
    while self.pos < self.__len {
      let ch : String = self.peek();
      if  self.isDigit(ch.clone()) {
        value = format!("{}{}", value, self.advance());
      } else {
        if  ch == ".".to_string() {
          value = format!("{}{}", value, self.advance());
        } else {
          return self.makeToken("Number".to_string(), value.clone(), startPos, startLine, startCol).clone();
        }
      }
    }
    return self.makeToken("Number".to_string(), value.clone(), startPos, startLine, startCol).clone();
  }
  fn readIdentifier(&mut self, ) -> Token {
    let startPos : i64 = self.pos;
    let startLine : i64 = self.line;
    let startCol : i64 = self.col;
    let mut value : String = "".to_string();
    while self.pos < self.__len {
      let ch : String = self.peek();
      if  self.isAlphaNumCh(ch.clone()) {
        value = format!("{}{}", value, self.advance());
      } else {
        let _tmp_1 = self.identType(value.clone());
        return self.makeToken(_tmp_1, value.clone(), startPos, startLine, startCol).clone();
      }
    }
    let _tmp_1 = self.identType(value.clone());
    return self.makeToken(_tmp_1, value.clone(), startPos, startLine, startCol).clone();
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
    if  self.isDigit(ch.clone()) {
      return self.readNumber().clone();
    }
    if  self.isAlpha(ch.clone()) {
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
    return self.makeToken("Punctuator".to_string(), ch.clone(), startPos, startLine, startCol).clone();
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
              if  ((ch == "\n".to_string()) || (ch == "\r".to_string())) || (ch == "\r\n".to_string()) {
                return self.makeToken("RegexLiteral".to_string(), pattern.clone(), startPos, startLine, startCol).clone();
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
    return self.makeToken("RegexLiteral".to_string(), fullValue.clone(), startPos, startLine, startCol).clone();
  }
  fn tokenize(&mut self, ) -> Vec<Token> {
    let mut tokens : Vec<Token> = Vec::new();
    while true {
      let mut tok : Token = self.nextToken();
      tokens.push(tok.clone());
      if  tok.tokenType == "EOF".to_string() {
        return tokens;
      }
    }
    return tokens;
  }
}
#[derive(Clone)]
struct Position { 
  line : i64, 
  column : i64, 
}
impl Position { 
  
  pub fn new() ->  Position {
    let mut me = Position { 
      line:1, 
      column:0, 
    };
    return me;
  }
}
#[derive(Clone)]
struct SourceLocation { 
  start : Option<Position>, 
  end : Option<Position>, 
}
impl SourceLocation { 
  
  pub fn new() ->  SourceLocation {
    let mut me = SourceLocation { 
      start: None, 
      end: None, 
    };
    return me;
  }
}
#[derive(Clone)]
struct JSNode { 
  r#type : String, 
  loc : Option<SourceLocation>, 
  start : i64, 
  end : i64, 
  line : i64, 
  col : i64, 
  name : String, 
  raw : String, 
  regexPattern : String, 
  regexFlags : String, 
  operator : String, 
  prefix : bool, 
  left : Option<Box<JSNode>>, 
  right : Option<Box<JSNode>>, 
  argument : Option<Box<JSNode>>, 
  test : Option<Box<JSNode>>, 
  consequent : Option<Box<JSNode>>, 
  alternate : Option<Box<JSNode>>, 
  id : Option<Box<JSNode>>, 
  params : Vec<JSNode>, 
  body : Option<Box<JSNode>>, 
  generator : bool, 
  r#async : bool, 
  expression : bool, 
  declarations : Vec<JSNode>, 
  kind : String, 
  init : Option<Box<JSNode>>, 
  superClass : Option<Box<JSNode>>, 
  object : Option<Box<JSNode>>, 
  property : Option<Box<JSNode>>, 
  computed : bool, 
  optional : bool, 
  callee : Option<Box<JSNode>>, 
  arguments : Vec<JSNode>, 
  elements : Vec<JSNode>, 
  properties : Vec<JSNode>, 
  key : Option<Box<JSNode>>, 
  method : bool, 
  shorthand : bool, 
  update : Option<Box<JSNode>>, 
  discriminant : Option<Box<JSNode>>, 
  cases : Vec<JSNode>, 
  consequentStatements : Vec<JSNode>, 
  block : Option<Box<JSNode>>, 
  handler : Option<Box<JSNode>>, 
  finalizer : Option<Box<JSNode>>, 
  param : Option<Box<JSNode>>, 
  source : Option<Box<JSNode>>, 
  specifiers : Vec<JSNode>, 
  imported : Option<Box<JSNode>>, 
  local : Option<Box<JSNode>>, 
  exported : Option<Box<JSNode>>, 
  declaration : Option<Box<JSNode>>, 
  quasis : Vec<JSNode>, 
  expressions : Vec<JSNode>, 
  tail : bool, 
  cooked : String, 
  sourceType : String, 
  r#static : bool, 
  delegate : bool, 
  children : Vec<JSNode>, 
  leadingComments : Vec<JSNode>, 
  trailingComments : Vec<JSNode>, 
}
impl JSNode { 
  
  pub fn new() ->  JSNode {
    let mut me = JSNode { 
      r#type:"".to_string(), 
      loc: None, 
      start:0, 
      end:0, 
      line:0, 
      col:0, 
      name:"".to_string(), 
      raw:"".to_string(), 
      regexPattern:"".to_string(), 
      regexFlags:"".to_string(), 
      operator:"".to_string(), 
      prefix:false, 
      left: None, 
      right: None, 
      argument: None, 
      test: None, 
      consequent: None, 
      alternate: None, 
      id: None, 
      params: Vec::new(), 
      body: None, 
      generator:false, 
      r#async:false, 
      expression:false, 
      declarations: Vec::new(), 
      kind:"".to_string(), 
      init: None, 
      superClass: None, 
      object: None, 
      property: None, 
      computed:false, 
      optional:false, 
      callee: None, 
      arguments: Vec::new(), 
      elements: Vec::new(), 
      properties: Vec::new(), 
      key: None, 
      method:false, 
      shorthand:false, 
      update: None, 
      discriminant: None, 
      cases: Vec::new(), 
      consequentStatements: Vec::new(), 
      block: None, 
      handler: None, 
      finalizer: None, 
      param: None, 
      source: None, 
      specifiers: Vec::new(), 
      imported: None, 
      local: None, 
      exported: None, 
      declaration: None, 
      quasis: Vec::new(), 
      expressions: Vec::new(), 
      tail:false, 
      cooked:"".to_string(), 
      sourceType:"".to_string(), 
      r#static:false, 
      delegate:false, 
      children: Vec::new(), 
      leadingComments: Vec::new(), 
      trailingComments: Vec::new(), 
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
      currentToken: None, 
      errors: Vec::new(), 
      pendingComments: Vec::new(), 
      source:"".to_string(), 
      lexer: None, 
    };
    return me;
  }
  fn initParser(&mut self, mut toks : Vec<Token>) -> () {
    self.tokens = toks.clone();
    self.pos = 0;
    if  ((toks.len() as i64)) > 0 {
      self.currentToken = Some(toks[0 as usize].clone());
    }
    self.skipComments();
  }
  fn initParserWithSource(&mut self, mut toks : Vec<Token>, src : String) -> () {
    self.tokens = toks.clone();
    self.source = src.clone();
    self.lexer = Some(Lexer::new(src.clone()));
    self.pos = 0;
    if  ((toks.len() as i64)) > 0 {
      self.currentToken = Some(toks[0 as usize].clone());
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
      commentNode.r#type = tok.tokenType.clone();
      commentNode.raw = tok.value.clone();
      commentNode.line = tok.line;
      commentNode.col = tok.col;
      commentNode.start = tok.start;
      commentNode.end = tok.end;
      self.pendingComments.push(commentNode.clone());
      self.advanceRaw();
    }
  }
  fn advanceRaw(&mut self, ) -> () {
    self.pos = self.pos + 1;
    if  self.pos < ((self.tokens.len() as i64)) {
      self.currentToken = Some(self.tokens[self.pos as usize].clone());
    } else {
      let mut eof : Token = Token::new();
      eof.tokenType = "EOF".to_string();
      eof.value = "".to_string();
      self.currentToken = Some(eof.clone());
    }
  }
  fn collectComments(&mut self, ) -> Vec<JSNode> {
    let mut comments : Vec<JSNode> = Vec::new();
    for i in 0..self.pendingComments.len() {
      let mut c = self.pendingComments[i as usize].clone();
      comments.push(c.clone());
    }
    let mut empty : Vec<JSNode> = Vec::new();
    self.pendingComments = empty.clone();
    return comments;
  }
  fn attachComments(&mut self, mut node : JSNode) -> () {
    let mut comments : Vec<JSNode> = self.collectComments();
    for i in 0..comments.len() {
      let mut c = comments[i as usize].clone();
      node.leadingComments.push(c.clone());
    }
  }
  fn peek(&mut self, ) -> Token {
    return self.currentToken.clone().unwrap().clone();
  }
  fn peekType(&mut self, ) -> String {
    if  self.currentToken.is_none() {
      return "EOF".to_string().clone();
    }
    let mut tok : Token = self.currentToken.clone().unwrap();
    return tok.tokenType.clone();
  }
  fn peekValue(&mut self, ) -> String {
    if  self.currentToken.is_none() {
      return "".to_string().clone();
    }
    let mut tok : Token = self.currentToken.clone().unwrap();
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
      self.addError(err.clone());
    }
    self.advance();
    return tok.clone();
  }
  fn expectValue(&mut self, expectedValue : String) -> Token {
    let mut tok : Token = self.peek();
    if  tok.value != expectedValue {
      let err : String = format!("{}{}", (format!("{}{}", (format!("{}{}", (format!("{}{}", (format!("{}{}", ([(format!("{}{}", (["Parse error at line ".to_string() , (tok.line.to_string()) ].join("")), ":".to_string())) , (tok.col.to_string()) ].join("")), ": expected '".to_string())), expectedValue)), "' but got '".to_string())), tok.value)), "'".to_string());
      self.addError(err.clone());
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
    return ((self.errors.len() as i64)) > 0;
  }
  fn parseRegexLiteral(&mut self, ) -> JSNode {
    let mut tok : Token = self.peek();
    let startPos : i64 = tok.start;
    let startLine : i64 = tok.line;
    let startCol : i64 = tok.col;
    if  self.lexer.is_none() {
      let mut err : JSNode = JSNode::new();
      err.r#type = "Identifier".to_string();
      err.name = "regex_error".to_string();
      self.advance();
      return err.clone();
    }
    let mut lex : Lexer = self.lexer.clone().unwrap();
    lex.pos = startPos;
    lex.line = startLine;
    lex.col = startCol;
    let mut regexTok : Token = lex.readRegexLiteral();
    let fullValue : String = regexTok.value.clone();
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
      pattern = fullValue.clone();
    }
    let mut regex : JSNode = JSNode::new();
    regex.r#type = "Literal".to_string();
    regex.raw = fullValue.clone();
    regex.regexPattern = pattern.clone();
    regex.regexFlags = flags.clone();
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
    prog.r#type = "Program".to_string();
    while self.isAtEnd() == false {
      let mut stmt : JSNode = self.parseStatement();
      prog.children.push(stmt.clone());
    }
    return prog.clone();
  }
  fn parseStatement(&mut self, ) -> JSNode {
    let mut comments : Vec<JSNode> = self.collectComments();
    let tokVal : String = self.peekValue();
    let mut stmt : Option<JSNode> = None;
    if  tokVal == "var".to_string() {
      stmt = Some(self.parseVarDecl());
    }
    if  (stmt.is_none()) && (tokVal == "let".to_string()) {
      stmt = Some(self.parseLetDecl());
    }
    if  (stmt.is_none()) && (tokVal == "const".to_string()) {
      stmt = Some(self.parseConstDecl());
    }
    if  (stmt.is_none()) && (tokVal == "function".to_string()) {
      stmt = Some(self.parseFuncDecl());
    }
    if  (stmt.is_none()) && (tokVal == "async".to_string()) {
      stmt = Some(self.parseAsyncFuncDecl());
    }
    if  (stmt.is_none()) && (tokVal == "class".to_string()) {
      stmt = Some(self.parseClass());
    }
    if  (stmt.is_none()) && (tokVal == "import".to_string()) {
      stmt = Some(self.parseImport());
    }
    if  (stmt.is_none()) && (tokVal == "export".to_string()) {
      stmt = Some(self.parseExport());
    }
    if  (stmt.is_none()) && (tokVal == "return".to_string()) {
      stmt = Some(self.parseReturn());
    }
    if  (stmt.is_none()) && (tokVal == "if".to_string()) {
      stmt = Some(self.parseIf());
    }
    if  (stmt.is_none()) && (tokVal == "while".to_string()) {
      stmt = Some(self.parseWhile());
    }
    if  (stmt.is_none()) && (tokVal == "do".to_string()) {
      stmt = Some(self.parseDoWhile());
    }
    if  (stmt.is_none()) && (tokVal == "for".to_string()) {
      stmt = Some(self.parseFor());
    }
    if  (stmt.is_none()) && (tokVal == "switch".to_string()) {
      stmt = Some(self.parseSwitch());
    }
    if  (stmt.is_none()) && (tokVal == "try".to_string()) {
      stmt = Some(self.parseTry());
    }
    if  (stmt.is_none()) && (tokVal == "throw".to_string()) {
      stmt = Some(self.parseThrow());
    }
    if  (stmt.is_none()) && (tokVal == "break".to_string()) {
      stmt = Some(self.parseBreak());
    }
    if  (stmt.is_none()) && (tokVal == "continue".to_string()) {
      stmt = Some(self.parseContinue());
    }
    if  (stmt.is_none()) && (tokVal == "{".to_string()) {
      stmt = Some(self.parseBlock());
    }
    if  (stmt.is_none()) && (tokVal == ";".to_string()) {
      self.advance();
      let mut empty : JSNode = JSNode::new();
      empty.r#type = "EmptyStatement".to_string();
      stmt = Some(empty.clone());
    }
    if  stmt.is_none() {
      stmt = Some(self.parseExprStmt());
    }
    let mut result : JSNode = stmt.unwrap();
    for i in 0..comments.len() {
      let mut c = comments[i as usize].clone();
      result.leadingComments.push(c.clone());
    }
    return result.clone();
  }
  fn parseVarDecl(&mut self, ) -> JSNode {
    let mut decl : JSNode = JSNode::new();
    decl.r#type = "VariableDeclaration".to_string();
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
      declarator.r#type = "VariableDeclarator".to_string();
      let mut idTok : Token = self.expect("Identifier".to_string());
      let mut id : JSNode = JSNode::new();
      id.r#type = "Identifier".to_string();
      id.name = idTok.value.clone();
      id.start = idTok.start;
      id.line = idTok.line;
      id.col = idTok.col;
      declarator.id = Some(Box::new(id.clone()));
      declarator.start = idTok.start;
      declarator.line = idTok.line;
      declarator.col = idTok.col;
      if  self.matchValue("=".to_string()) {
        self.advance();
        let mut initExpr : JSNode = self.parseAssignment();
        declarator.init = Some(Box::new(initExpr.clone()));
      }
      decl.children.push(declarator.clone());
    }
    if  self.matchValue(";".to_string()) {
      self.advance();
    }
    return decl.clone();
  }
  fn parseLetDecl(&mut self, ) -> JSNode {
    let mut decl : JSNode = JSNode::new();
    decl.r#type = "VariableDeclaration".to_string();
    decl.kind = "let".to_string();
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
      declarator.r#type = "VariableDeclarator".to_string();
      let mut declTok : Token = self.peek();
      declarator.start = declTok.start;
      declarator.line = declTok.line;
      declarator.col = declTok.col;
      if  self.matchValue("[".to_string()) {
        let mut pattern : JSNode = self.parseArrayPattern();
        declarator.id = Some(Box::new(pattern.clone()));
      } else {
        if  self.matchValue("{".to_string()) {
          let mut pattern_1 : JSNode = self.parseObjectPattern();
          declarator.id = Some(Box::new(pattern_1.clone()));
        } else {
          let mut idTok : Token = self.expect("Identifier".to_string());
          let mut id : JSNode = JSNode::new();
          id.r#type = "Identifier".to_string();
          id.name = idTok.value.clone();
          id.start = idTok.start;
          id.line = idTok.line;
          id.col = idTok.col;
          declarator.id = Some(Box::new(id.clone()));
        }
      }
      if  self.matchValue("=".to_string()) {
        self.advance();
        let mut initExpr : JSNode = self.parseAssignment();
        declarator.init = Some(Box::new(initExpr.clone()));
      }
      decl.children.push(declarator.clone());
    }
    if  self.matchValue(";".to_string()) {
      self.advance();
    }
    return decl.clone();
  }
  fn parseConstDecl(&mut self, ) -> JSNode {
    let mut decl : JSNode = JSNode::new();
    decl.r#type = "VariableDeclaration".to_string();
    decl.kind = "const".to_string();
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
      declarator.r#type = "VariableDeclarator".to_string();
      let mut declTok : Token = self.peek();
      declarator.start = declTok.start;
      declarator.line = declTok.line;
      declarator.col = declTok.col;
      if  self.matchValue("[".to_string()) {
        let mut pattern : JSNode = self.parseArrayPattern();
        declarator.id = Some(Box::new(pattern.clone()));
      } else {
        if  self.matchValue("{".to_string()) {
          let mut pattern_1 : JSNode = self.parseObjectPattern();
          declarator.id = Some(Box::new(pattern_1.clone()));
        } else {
          let mut idTok : Token = self.expect("Identifier".to_string());
          let mut id : JSNode = JSNode::new();
          id.r#type = "Identifier".to_string();
          id.name = idTok.value.clone();
          id.start = idTok.start;
          id.line = idTok.line;
          id.col = idTok.col;
          declarator.id = Some(Box::new(id.clone()));
        }
      }
      if  self.matchValue("=".to_string()) {
        self.advance();
        let mut initExpr : JSNode = self.parseAssignment();
        declarator.init = Some(Box::new(initExpr.clone()));
      }
      decl.children.push(declarator.clone());
    }
    if  self.matchValue(";".to_string()) {
      self.advance();
    }
    return decl.clone();
  }
  fn parseFuncDecl(&mut self, ) -> JSNode {
    let mut _func : JSNode = JSNode::new();
    _func.r#type = "FunctionDeclaration".to_string();
    let mut startTok : Token = self.peek();
    _func.start = startTok.start;
    _func.line = startTok.line;
    _func.col = startTok.col;
    self.expectValue("function".to_string());
    if  self.matchValue("*".to_string()) {
      _func.generator = true;
      self.advance();
    }
    let mut idTok : Token = self.expect("Identifier".to_string());
    _func.name = idTok.value.clone();
    self.expectValue("(".to_string());
    while (self.matchValue(")".to_string()) == false) && (self.isAtEnd() == false) {
      if  ((_func.children.len() as i64)) > 0 {
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
        rest.r#type = "RestElement".to_string();
        rest.name = paramTok.value.clone();
        rest.start = restTok.start;
        rest.line = restTok.line;
        rest.col = restTok.col;
        let mut argNode : JSNode = JSNode::new();
        argNode.r#type = "Identifier".to_string();
        argNode.name = paramTok.value.clone();
        argNode.start = paramTok.start;
        argNode.line = paramTok.line;
        argNode.col = paramTok.col;
        rest.argument = Some(Box::new(argNode.clone()));
        _func.children.push(rest.clone());
      } else {
        if  self.matchValue("[".to_string()) {
          let mut pattern : JSNode = self.parseArrayPattern();
          if  self.matchValue("=".to_string()) {
            self.advance();
            let mut defaultVal : JSNode = self.parseAssignment();
            let mut assignPat : JSNode = JSNode::new();
            assignPat.r#type = "AssignmentPattern".to_string();
            assignPat.left = Some(Box::new(pattern.clone()));
            assignPat.right = Some(Box::new(defaultVal.clone()));
            assignPat.start = pattern.start;
            assignPat.line = pattern.line;
            assignPat.col = pattern.col;
            _func.children.push(assignPat.clone());
          } else {
            _func.children.push(pattern.clone());
          }
        } else {
          if  self.matchValue("{".to_string()) {
            let mut pattern_1 : JSNode = self.parseObjectPattern();
            if  self.matchValue("=".to_string()) {
              self.advance();
              let mut defaultVal_1 : JSNode = self.parseAssignment();
              let mut assignPat_1 : JSNode = JSNode::new();
              assignPat_1.r#type = "AssignmentPattern".to_string();
              assignPat_1.left = Some(Box::new(pattern_1.clone()));
              assignPat_1.right = Some(Box::new(defaultVal_1.clone()));
              assignPat_1.start = pattern_1.start;
              assignPat_1.line = pattern_1.line;
              assignPat_1.col = pattern_1.col;
              _func.children.push(assignPat_1.clone());
            } else {
              _func.children.push(pattern_1.clone());
            }
          } else {
            let mut paramTok_1 : Token = self.expect("Identifier".to_string());
            let mut param : JSNode = JSNode::new();
            param.r#type = "Identifier".to_string();
            param.name = paramTok_1.value.clone();
            param.start = paramTok_1.start;
            param.line = paramTok_1.line;
            param.col = paramTok_1.col;
            if  self.matchValue("=".to_string()) {
              self.advance();
              let mut defaultVal_2 : JSNode = self.parseAssignment();
              let mut assignPat_2 : JSNode = JSNode::new();
              assignPat_2.r#type = "AssignmentPattern".to_string();
              assignPat_2.left = Some(Box::new(param.clone()));
              assignPat_2.right = Some(Box::new(defaultVal_2.clone()));
              assignPat_2.start = param.start;
              assignPat_2.line = param.line;
              assignPat_2.col = param.col;
              _func.children.push(assignPat_2.clone());
            } else {
              _func.children.push(param.clone());
            }
          }
        }
      }
    }
    self.expectValue(")".to_string());
    let mut body : JSNode = self.parseBlock();
    _func.body = Some(Box::new(body.clone()));
    return _func.clone();
  }
  fn parseFunctionExpression(&mut self, ) -> JSNode {
    let mut _func : JSNode = JSNode::new();
    _func.r#type = "FunctionExpression".to_string();
    let mut startTok : Token = self.peek();
    _func.start = startTok.start;
    _func.line = startTok.line;
    _func.col = startTok.col;
    self.expectValue("function".to_string());
    if  self.matchValue("*".to_string()) {
      _func.generator = true;
      self.advance();
    }
    if  self.matchType("Identifier".to_string()) {
      let mut idTok : Token = self.expect("Identifier".to_string());
      _func.name = idTok.value.clone();
    }
    self.expectValue("(".to_string());
    while (self.matchValue(")".to_string()) == false) && (self.isAtEnd() == false) {
      if  ((_func.children.len() as i64)) > 0 {
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
        rest.r#type = "RestElement".to_string();
        rest.name = paramTok.value.clone();
        rest.start = restTok.start;
        rest.line = restTok.line;
        rest.col = restTok.col;
        let mut argNode : JSNode = JSNode::new();
        argNode.r#type = "Identifier".to_string();
        argNode.name = paramTok.value.clone();
        argNode.start = paramTok.start;
        argNode.line = paramTok.line;
        argNode.col = paramTok.col;
        rest.argument = Some(Box::new(argNode.clone()));
        _func.children.push(rest.clone());
      } else {
        if  self.matchValue("[".to_string()) {
          let mut pattern : JSNode = self.parseArrayPattern();
          if  self.matchValue("=".to_string()) {
            self.advance();
            let mut defaultVal : JSNode = self.parseAssignment();
            let mut assignPat : JSNode = JSNode::new();
            assignPat.r#type = "AssignmentPattern".to_string();
            assignPat.left = Some(Box::new(pattern.clone()));
            assignPat.right = Some(Box::new(defaultVal.clone()));
            assignPat.start = pattern.start;
            assignPat.line = pattern.line;
            assignPat.col = pattern.col;
            _func.children.push(assignPat.clone());
          } else {
            _func.children.push(pattern.clone());
          }
        } else {
          if  self.matchValue("{".to_string()) {
            let mut pattern_1 : JSNode = self.parseObjectPattern();
            if  self.matchValue("=".to_string()) {
              self.advance();
              let mut defaultVal_1 : JSNode = self.parseAssignment();
              let mut assignPat_1 : JSNode = JSNode::new();
              assignPat_1.r#type = "AssignmentPattern".to_string();
              assignPat_1.left = Some(Box::new(pattern_1.clone()));
              assignPat_1.right = Some(Box::new(defaultVal_1.clone()));
              assignPat_1.start = pattern_1.start;
              assignPat_1.line = pattern_1.line;
              assignPat_1.col = pattern_1.col;
              _func.children.push(assignPat_1.clone());
            } else {
              _func.children.push(pattern_1.clone());
            }
          } else {
            let mut paramTok_1 : Token = self.expect("Identifier".to_string());
            let mut param : JSNode = JSNode::new();
            param.r#type = "Identifier".to_string();
            param.name = paramTok_1.value.clone();
            param.start = paramTok_1.start;
            param.line = paramTok_1.line;
            param.col = paramTok_1.col;
            if  self.matchValue("=".to_string()) {
              self.advance();
              let mut defaultVal_2 : JSNode = self.parseAssignment();
              let mut assignPat_2 : JSNode = JSNode::new();
              assignPat_2.r#type = "AssignmentPattern".to_string();
              assignPat_2.left = Some(Box::new(param.clone()));
              assignPat_2.right = Some(Box::new(defaultVal_2.clone()));
              assignPat_2.start = param.start;
              assignPat_2.line = param.line;
              assignPat_2.col = param.col;
              _func.children.push(assignPat_2.clone());
            } else {
              _func.children.push(param.clone());
            }
          }
        }
      }
    }
    self.expectValue(")".to_string());
    let mut body : JSNode = self.parseBlock();
    _func.body = Some(Box::new(body.clone()));
    return _func.clone();
  }
  fn parseAsyncFuncDecl(&mut self, ) -> JSNode {
    let mut _func : JSNode = JSNode::new();
    _func.r#type = "FunctionDeclaration".to_string();
    let mut startTok : Token = self.peek();
    _func.start = startTok.start;
    _func.line = startTok.line;
    _func.col = startTok.col;
    _func.r#async = true;
    self.expectValue("async".to_string());
    self.expectValue("function".to_string());
    if  self.matchValue("*".to_string()) {
      _func.r#async = true;
      _func.generator = true;
      self.advance();
    }
    let mut idTok : Token = self.expect("Identifier".to_string());
    _func.name = idTok.value.clone();
    self.expectValue("(".to_string());
    while (self.matchValue(")".to_string()) == false) && (self.isAtEnd() == false) {
      if  ((_func.children.len() as i64)) > 0 {
        self.expectValue(",".to_string());
      }
      if  self.matchValue(")".to_string()) || self.isAtEnd() {
        break;
      }
      let mut paramTok : Token = self.expect("Identifier".to_string());
      let mut param : JSNode = JSNode::new();
      param.r#type = "Identifier".to_string();
      param.name = paramTok.value.clone();
      param.start = paramTok.start;
      param.line = paramTok.line;
      param.col = paramTok.col;
      _func.children.push(param.clone());
    }
    self.expectValue(")".to_string());
    let mut body : JSNode = self.parseBlock();
    _func.body = Some(Box::new(body.clone()));
    return _func.clone();
  }
  fn parseClass(&mut self, ) -> JSNode {
    let mut classNode : JSNode = JSNode::new();
    classNode.r#type = "ClassDeclaration".to_string();
    let mut startTok : Token = self.peek();
    classNode.start = startTok.start;
    classNode.line = startTok.line;
    classNode.col = startTok.col;
    self.expectValue("class".to_string());
    let mut idTok : Token = self.expect("Identifier".to_string());
    classNode.name = idTok.value.clone();
    if  self.matchValue("extends".to_string()) {
      self.advance();
      let mut superTok : Token = self.expect("Identifier".to_string());
      let mut superClassNode : JSNode = JSNode::new();
      superClassNode.r#type = "Identifier".to_string();
      superClassNode.name = superTok.value.clone();
      superClassNode.start = superTok.start;
      superClassNode.line = superTok.line;
      superClassNode.col = superTok.col;
      classNode.superClass = Some(Box::new(superClassNode.clone()));
    }
    let mut body : JSNode = JSNode::new();
    body.r#type = "ClassBody".to_string();
    let mut bodyStart : Token = self.peek();
    body.start = bodyStart.start;
    body.line = bodyStart.line;
    body.col = bodyStart.col;
    self.expectValue("{".to_string());
    while (self.matchValue("}".to_string()) == false) && (self.isAtEnd() == false) {
      let mut method : JSNode = self.parseClassMethod();
      body.children.push(method.clone());
    }
    self.expectValue("}".to_string());
    classNode.body = Some(Box::new(body.clone()));
    return classNode.clone();
  }
  fn parseClassMethod(&mut self, ) -> JSNode {
    let mut method : JSNode = JSNode::new();
    method.r#type = "MethodDefinition".to_string();
    let mut startTok : Token = self.peek();
    method.start = startTok.start;
    method.line = startTok.line;
    method.col = startTok.col;
    let mut isStatic : bool = false;
    if  self.matchValue("static".to_string()) {
      isStatic = true;
      method.r#static = true;
      self.advance();
    }
    let mut methodKind : String = "method".to_string();
    if  self.matchValue("get".to_string()) {
      let nextTok : String = self.peekAt(1);
      if  nextTok != "(".to_string() {
        methodKind = "get".to_string();
        self.advance();
      }
    }
    if  self.matchValue("set".to_string()) {
      let nextTok_1 : String = self.peekAt(1);
      if  nextTok_1 != "(".to_string() {
        methodKind = "set".to_string();
        self.advance();
      }
    }
    let mut nameTok : Token = self.expect("Identifier".to_string());
    let mut keyNode : JSNode = JSNode::new();
    keyNode.r#type = "Identifier".to_string();
    keyNode.name = nameTok.value.clone();
    keyNode.start = nameTok.start;
    keyNode.line = nameTok.line;
    keyNode.col = nameTok.col;
    method.key = Some(Box::new(keyNode.clone()));
    if  nameTok.value == "constructor".to_string() {
      methodKind = "constructor".to_string();
    }
    method.kind = methodKind.clone();
    let mut _func : JSNode = JSNode::new();
    _func.r#type = "FunctionExpression".to_string();
    _func.start = nameTok.start;
    _func.line = nameTok.line;
    _func.col = nameTok.col;
    self.expectValue("(".to_string());
    while (self.matchValue(")".to_string()) == false) && (self.isAtEnd() == false) {
      if  ((_func.children.len() as i64)) > 0 {
        self.expectValue(",".to_string());
      }
      if  self.matchValue(")".to_string()) || self.isAtEnd() {
        break;
      }
      let mut paramTok : Token = self.expect("Identifier".to_string());
      let mut param : JSNode = JSNode::new();
      param.r#type = "Identifier".to_string();
      param.name = paramTok.value.clone();
      param.start = paramTok.start;
      param.line = paramTok.line;
      param.col = paramTok.col;
      _func.children.push(param.clone());
    }
    self.expectValue(")".to_string());
    let mut funcBody : JSNode = self.parseBlock();
    _func.body = Some(Box::new(funcBody.clone()));
    method.body = Some(Box::new(_func.clone()));
    return method.clone();
  }
  fn peekAt(&mut self, offset : i64) -> String {
    let targetPos : i64 = self.pos + offset;
    if  targetPos >= ((self.tokens.len() as i64)) {
      return "".to_string().clone();
    }
    let mut tok : Token = self.tokens[targetPos as usize].clone();
    return tok.value.clone();
  }
  fn parseImport(&mut self, ) -> JSNode {
    let mut importNode : JSNode = JSNode::new();
    importNode.r#type = "ImportDeclaration".to_string();
    let mut startTok : Token = self.peek();
    importNode.start = startTok.start;
    importNode.line = startTok.line;
    importNode.col = startTok.col;
    self.expectValue("import".to_string());
    if  self.matchType("String".to_string()) {
      let mut sourceTok : Token = self.peek();
      self.advance();
      let mut source_1 : JSNode = JSNode::new();
      source_1.r#type = "Literal".to_string();
      source_1.raw = sourceTok.value.clone();
      source_1.start = sourceTok.start;
      source_1.line = sourceTok.line;
      source_1.col = sourceTok.col;
      importNode.right = Some(Box::new(source_1.clone()));
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
      specifier.r#type = "ImportNamespaceSpecifier".to_string();
      specifier.name = localTok.value.clone();
      specifier.start = localTok.start;
      specifier.line = localTok.line;
      specifier.col = localTok.col;
      importNode.children.push(specifier.clone());
      self.expectValue("from".to_string());
      let mut sourceTok_1 : Token = self.expect("String".to_string());
      let mut source_2 : JSNode = JSNode::new();
      source_2.r#type = "Literal".to_string();
      source_2.raw = sourceTok_1.value.clone();
      source_2.start = sourceTok_1.start;
      source_2.line = sourceTok_1.line;
      source_2.col = sourceTok_1.col;
      importNode.right = Some(Box::new(source_2.clone()));
      if  self.matchValue(";".to_string()) {
        self.advance();
      }
      return importNode.clone();
    }
    if  self.matchType("Identifier".to_string()) {
      let mut defaultTok : Token = self.expect("Identifier".to_string());
      let mut defaultSpec : JSNode = JSNode::new();
      defaultSpec.r#type = "ImportDefaultSpecifier".to_string();
      let mut localNode : JSNode = JSNode::new();
      localNode.r#type = "Identifier".to_string();
      localNode.name = defaultTok.value.clone();
      localNode.start = defaultTok.start;
      localNode.line = defaultTok.line;
      localNode.col = defaultTok.col;
      defaultSpec.local = Some(Box::new(localNode.clone()));
      defaultSpec.start = defaultTok.start;
      defaultSpec.line = defaultTok.line;
      defaultSpec.col = defaultTok.col;
      importNode.children.push(defaultSpec.clone());
      if  self.matchValue(",".to_string()) {
        self.advance();
        if  self.matchValue("*".to_string()) {
          self.advance();
          self.expectValue("as".to_string());
          let mut localTok2 : Token = self.expect("Identifier".to_string());
          let mut nsSpec : JSNode = JSNode::new();
          nsSpec.r#type = "ImportNamespaceSpecifier".to_string();
          let mut nsLocal : JSNode = JSNode::new();
          nsLocal.r#type = "Identifier".to_string();
          nsLocal.name = localTok2.value.clone();
          nsLocal.start = localTok2.start;
          nsLocal.line = localTok2.line;
          nsLocal.col = localTok2.col;
          nsSpec.local = Some(Box::new(nsLocal.clone()));
          nsSpec.start = localTok2.start;
          nsSpec.line = localTok2.line;
          nsSpec.col = localTok2.col;
          importNode.children.push(nsSpec.clone());
        } else {
          self.parseImportSpecifiers(importNode.clone());
        }
      }
      self.expectValue("from".to_string());
    } else {
      if  self.matchValue("{".to_string()) {
        self.parseImportSpecifiers(importNode.clone());
        self.expectValue("from".to_string());
      }
    }
    let mut sourceTok_2 : Token = self.expect("String".to_string());
    let mut source_3 : JSNode = JSNode::new();
    source_3.r#type = "Literal".to_string();
    source_3.raw = sourceTok_2.value.clone();
    source_3.start = sourceTok_2.start;
    source_3.line = sourceTok_2.line;
    source_3.col = sourceTok_2.col;
    importNode.right = Some(Box::new(source_3.clone()));
    if  self.matchValue(";".to_string()) {
      self.advance();
    }
    return importNode.clone();
  }
  fn parseImportSpecifiers(&mut self, mut importNode : JSNode) -> () {
    self.expectValue("{".to_string());
    while (self.matchValue("}".to_string()) == false) && (self.isAtEnd() == false) {
      if  ((importNode.children.len() as i64)) > 0 {
        if  self.matchValue(",".to_string()) {
          self.advance();
        }
      }
      if  self.matchValue("}".to_string()) || self.isAtEnd() {
        break;
      }
      let mut specifier : JSNode = JSNode::new();
      specifier.r#type = "ImportSpecifier".to_string();
      let mut importedTok : Token = self.expect("Identifier".to_string());
      let mut importedNode : JSNode = JSNode::new();
      importedNode.r#type = "Identifier".to_string();
      importedNode.name = importedTok.value.clone();
      importedNode.start = importedTok.start;
      importedNode.line = importedTok.line;
      importedNode.col = importedTok.col;
      specifier.imported = Some(Box::new(importedNode.clone()));
      specifier.start = importedTok.start;
      specifier.line = importedTok.line;
      specifier.col = importedTok.col;
      if  self.matchValue("as".to_string()) {
        self.advance();
        let mut localTok : Token = self.expect("Identifier".to_string());
        let mut localNode : JSNode = JSNode::new();
        localNode.r#type = "Identifier".to_string();
        localNode.name = localTok.value.clone();
        localNode.start = localTok.start;
        localNode.line = localTok.line;
        localNode.col = localTok.col;
        specifier.local = Some(Box::new(localNode.clone()));
      } else {
        specifier.local = Some(Box::new(importedNode.clone()));
      }
      importNode.children.push(specifier.clone());
    }
    self.expectValue("}".to_string());
  }
  fn parseExport(&mut self, ) -> JSNode {
    let mut exportNode : JSNode = JSNode::new();
    exportNode.r#type = "ExportNamedDeclaration".to_string();
    let mut startTok : Token = self.peek();
    exportNode.start = startTok.start;
    exportNode.line = startTok.line;
    exportNode.col = startTok.col;
    self.expectValue("export".to_string());
    if  self.matchValue("default".to_string()) {
      exportNode.r#type = "ExportDefaultDeclaration".to_string();
      self.advance();
      if  self.matchValue("function".to_string()) {
        let mut _func : JSNode = self.parseFuncDecl();
        exportNode.left = Some(Box::new(_func.clone()));
      } else {
        if  self.matchValue("async".to_string()) {
          let mut func_1 : JSNode = self.parseAsyncFuncDecl();
          exportNode.left = Some(Box::new(func_1.clone()));
        } else {
          if  self.matchValue("class".to_string()) {
            let mut cls : JSNode = self.parseClass();
            exportNode.left = Some(Box::new(cls.clone()));
          } else {
            let mut expr : JSNode = self.parseAssignment();
            exportNode.left = Some(Box::new(expr.clone()));
            if  self.matchValue(";".to_string()) {
              self.advance();
            }
          }
        }
      }
      return exportNode.clone();
    }
    if  self.matchValue("*".to_string()) {
      exportNode.r#type = "ExportAllDeclaration".to_string();
      self.advance();
      if  self.matchValue("as".to_string()) {
        self.advance();
        let mut exportedTok : Token = self.expect("Identifier".to_string());
        exportNode.name = exportedTok.value.clone();
      }
      self.expectValue("from".to_string());
      let mut sourceTok : Token = self.expect("String".to_string());
      let mut source_1 : JSNode = JSNode::new();
      source_1.r#type = "Literal".to_string();
      source_1.raw = sourceTok.value.clone();
      source_1.start = sourceTok.start;
      source_1.line = sourceTok.line;
      source_1.col = sourceTok.col;
      exportNode.right = Some(Box::new(source_1.clone()));
      if  self.matchValue(";".to_string()) {
        self.advance();
      }
      return exportNode.clone();
    }
    if  self.matchValue("{".to_string()) {
      self.parseExportSpecifiers(exportNode.clone());
      if  self.matchValue("from".to_string()) {
        self.advance();
        let mut sourceTok_1 : Token = self.expect("String".to_string());
        let mut source_2 : JSNode = JSNode::new();
        source_2.r#type = "Literal".to_string();
        source_2.raw = sourceTok_1.value.clone();
        source_2.start = sourceTok_1.start;
        source_2.line = sourceTok_1.line;
        source_2.col = sourceTok_1.col;
        exportNode.right = Some(Box::new(source_2.clone()));
      }
      if  self.matchValue(";".to_string()) {
        self.advance();
      }
      return exportNode.clone();
    }
    if  self.matchValue("const".to_string()) {
      let mut decl : JSNode = self.parseConstDecl();
      exportNode.left = Some(Box::new(decl.clone()));
      return exportNode.clone();
    }
    if  self.matchValue("let".to_string()) {
      let mut decl_1 : JSNode = self.parseLetDecl();
      exportNode.left = Some(Box::new(decl_1.clone()));
      return exportNode.clone();
    }
    if  self.matchValue("var".to_string()) {
      let mut decl_2 : JSNode = self.parseVarDecl();
      exportNode.left = Some(Box::new(decl_2.clone()));
      return exportNode.clone();
    }
    if  self.matchValue("function".to_string()) {
      let mut func_2 : JSNode = self.parseFuncDecl();
      exportNode.left = Some(Box::new(func_2.clone()));
      return exportNode.clone();
    }
    if  self.matchValue("async".to_string()) {
      let mut func_3 : JSNode = self.parseAsyncFuncDecl();
      exportNode.left = Some(Box::new(func_3.clone()));
      return exportNode.clone();
    }
    if  self.matchValue("class".to_string()) {
      let mut cls_1 : JSNode = self.parseClass();
      exportNode.left = Some(Box::new(cls_1.clone()));
      return exportNode.clone();
    }
    let mut expr_1 : JSNode = self.parseExprStmt();
    exportNode.left = Some(Box::new(expr_1.clone()));
    return exportNode.clone();
  }
  fn parseExportSpecifiers(&mut self, mut exportNode : JSNode) -> () {
    self.expectValue("{".to_string());
    while (self.matchValue("}".to_string()) == false) && (self.isAtEnd() == false) {
      let numChildren : i64 = (exportNode.children.len() as i64);
      if  numChildren > 0 {
        if  self.matchValue(",".to_string()) {
          self.advance();
        }
      }
      if  self.matchValue("}".to_string()) || self.isAtEnd() {
        break;
      }
      let mut specifier : JSNode = JSNode::new();
      specifier.r#type = "ExportSpecifier".to_string();
      let mut localTok : Token = self.peek();
      if  self.matchType("Identifier".to_string()) || self.matchValue("default".to_string()) {
        self.advance();
        let mut localNode : JSNode = JSNode::new();
        localNode.r#type = "Identifier".to_string();
        localNode.name = localTok.value.clone();
        localNode.start = localTok.start;
        localNode.line = localTok.line;
        localNode.col = localTok.col;
        specifier.local = Some(Box::new(localNode.clone()));
        specifier.start = localTok.start;
        specifier.line = localTok.line;
        specifier.col = localTok.col;
      } else {
        let err : String = format!("{}{}", (format!("{}{}", ([(format!("{}{}", (["Parse error at line ".to_string() , (localTok.line.to_string()) ].join("")), ":".to_string())) , (localTok.col.to_string()) ].join("")), ": expected Identifier but got ".to_string())), localTok.tokenType);
        self.addError(err.clone());
        self.advance();
      }
      if  self.matchValue("as".to_string()) {
        self.advance();
        let mut exportedTok : Token = self.expect("Identifier".to_string());
        let mut exportedNode : JSNode = JSNode::new();
        exportedNode.r#type = "Identifier".to_string();
        exportedNode.name = exportedTok.value.clone();
        exportedNode.start = exportedTok.start;
        exportedNode.line = exportedTok.line;
        exportedNode.col = exportedTok.col;
        specifier.exported = Some(Box::new(exportedNode.clone()));
      } else {
        specifier.exported = specifier.local.clone();
      }
      exportNode.children.push(specifier.clone());
    }
    self.expectValue("}".to_string());
  }
  fn parseBlock(&mut self, ) -> JSNode {
    let mut block : JSNode = JSNode::new();
    block.r#type = "BlockStatement".to_string();
    let mut startTok : Token = self.peek();
    block.start = startTok.start;
    block.line = startTok.line;
    block.col = startTok.col;
    self.expectValue("{".to_string());
    while (self.matchValue("}".to_string()) == false) && (self.isAtEnd() == false) {
      let mut stmt : JSNode = self.parseStatement();
      block.children.push(stmt.clone());
    }
    self.expectValue("}".to_string());
    return block.clone();
  }
  fn parseReturn(&mut self, ) -> JSNode {
    let mut ret : JSNode = JSNode::new();
    ret.r#type = "ReturnStatement".to_string();
    let mut startTok : Token = self.peek();
    ret.start = startTok.start;
    ret.line = startTok.line;
    ret.col = startTok.col;
    self.expectValue("return".to_string());
    if  (self.matchValue(";".to_string()) == false) && (self.isAtEnd() == false) {
      let mut arg : JSNode = self.parseExpr();
      ret.left = Some(Box::new(arg.clone()));
    }
    if  self.matchValue(";".to_string()) {
      self.advance();
    }
    return ret.clone();
  }
  fn parseIf(&mut self, ) -> JSNode {
    let mut ifStmt : JSNode = JSNode::new();
    ifStmt.r#type = "IfStatement".to_string();
    let mut startTok : Token = self.peek();
    ifStmt.start = startTok.start;
    ifStmt.line = startTok.line;
    ifStmt.col = startTok.col;
    self.expectValue("if".to_string());
    self.expectValue("(".to_string());
    let mut test : JSNode = self.parseExpr();
    ifStmt.test = Some(Box::new(test.clone()));
    self.expectValue(")".to_string());
    let mut consequent : JSNode = self.parseStatement();
    ifStmt.body = Some(Box::new(consequent.clone()));
    if  self.matchValue("else".to_string()) {
      self.advance();
      let mut alt : JSNode = self.parseStatement();
      ifStmt.alternate = Some(Box::new(alt.clone()));
    }
    return ifStmt.clone();
  }
  fn parseWhile(&mut self, ) -> JSNode {
    let mut whileStmt : JSNode = JSNode::new();
    whileStmt.r#type = "WhileStatement".to_string();
    let mut startTok : Token = self.peek();
    whileStmt.start = startTok.start;
    whileStmt.line = startTok.line;
    whileStmt.col = startTok.col;
    self.expectValue("while".to_string());
    self.expectValue("(".to_string());
    let mut test : JSNode = self.parseExpr();
    whileStmt.test = Some(Box::new(test.clone()));
    self.expectValue(")".to_string());
    let mut body : JSNode = self.parseStatement();
    whileStmt.body = Some(Box::new(body.clone()));
    return whileStmt.clone();
  }
  fn parseDoWhile(&mut self, ) -> JSNode {
    let mut doWhileStmt : JSNode = JSNode::new();
    doWhileStmt.r#type = "DoWhileStatement".to_string();
    let mut startTok : Token = self.peek();
    doWhileStmt.start = startTok.start;
    doWhileStmt.line = startTok.line;
    doWhileStmt.col = startTok.col;
    self.expectValue("do".to_string());
    let mut body : JSNode = self.parseStatement();
    doWhileStmt.body = Some(Box::new(body.clone()));
    self.expectValue("while".to_string());
    self.expectValue("(".to_string());
    let mut test : JSNode = self.parseExpr();
    doWhileStmt.test = Some(Box::new(test.clone()));
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
    let mut leftNode : Option<JSNode> = None;
    if  self.matchValue(";".to_string()) == false {
      if  (self.matchValue("var".to_string()) || self.matchValue("let".to_string())) || self.matchValue("const".to_string()) {
        let keyword : String = self.peekValue();
        self.advance();
        let mut declarator : JSNode = JSNode::new();
        declarator.r#type = "VariableDeclarator".to_string();
        let mut declTok : Token = self.peek();
        declarator.start = declTok.start;
        declarator.line = declTok.line;
        declarator.col = declTok.col;
        if  self.matchValue("[".to_string()) {
          let mut pattern : JSNode = self.parseArrayPattern();
          declarator.id = Some(Box::new(pattern.clone()));
        } else {
          if  self.matchValue("{".to_string()) {
            let mut pattern_1 : JSNode = self.parseObjectPattern();
            declarator.id = Some(Box::new(pattern_1.clone()));
          } else {
            let mut idTok : Token = self.expect("Identifier".to_string());
            let mut id : JSNode = JSNode::new();
            id.r#type = "Identifier".to_string();
            id.name = idTok.value.clone();
            id.start = idTok.start;
            id.line = idTok.line;
            id.col = idTok.col;
            declarator.id = Some(Box::new(id.clone()));
          }
        }
        if  self.matchValue("of".to_string()) {
          isForOf = true;
          self.advance();
          let mut varDecl : JSNode = JSNode::new();
          varDecl.r#type = "VariableDeclaration".to_string();
          varDecl.kind = keyword.clone();
          varDecl.start = declTok.start;
          varDecl.line = declTok.line;
          varDecl.col = declTok.col;
          varDecl.children.push(declarator.clone());
          leftNode = Some(varDecl.clone());
        } else {
          if  self.matchValue("in".to_string()) {
            isForIn = true;
            self.advance();
            let mut varDecl_1 : JSNode = JSNode::new();
            varDecl_1.r#type = "VariableDeclaration".to_string();
            varDecl_1.kind = keyword.clone();
            varDecl_1.start = declTok.start;
            varDecl_1.line = declTok.line;
            varDecl_1.col = declTok.col;
            varDecl_1.children.push(declarator.clone());
            leftNode = Some(varDecl_1.clone());
          } else {
            if  self.matchValue("=".to_string()) {
              self.advance();
              let mut initVal : JSNode = self.parseAssignment();
              declarator.init = Some(Box::new(initVal.clone()));
            }
            let mut varDecl_2 : JSNode = JSNode::new();
            varDecl_2.r#type = "VariableDeclaration".to_string();
            varDecl_2.kind = keyword.clone();
            varDecl_2.start = declTok.start;
            varDecl_2.line = declTok.line;
            varDecl_2.col = declTok.col;
            varDecl_2.children.push(declarator.clone());
            leftNode = Some(varDecl_2.clone());
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
          leftNode = Some(initExpr.clone());
        } else {
          if  self.matchValue("in".to_string()) {
            isForIn = true;
            self.advance();
            leftNode = Some(initExpr.clone());
          } else {
            leftNode = Some(initExpr.clone());
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
      forStmt.r#type = "ForOfStatement".to_string();
      forStmt.left = Some(Box::new(leftNode.unwrap().clone()));
      let mut rightExpr : JSNode = self.parseExpr();
      forStmt.right = Some(Box::new(rightExpr.clone()));
      self.expectValue(")".to_string());
      let mut body : JSNode = self.parseStatement();
      forStmt.body = Some(Box::new(body.clone()));
      return forStmt.clone();
    }
    if  isForIn {
      forStmt.r#type = "ForInStatement".to_string();
      forStmt.left = Some(Box::new(leftNode.unwrap().clone()));
      let mut rightExpr_1 : JSNode = self.parseExpr();
      forStmt.right = Some(Box::new(rightExpr_1.clone()));
      self.expectValue(")".to_string());
      let mut body_1 : JSNode = self.parseStatement();
      forStmt.body = Some(Box::new(body_1.clone()));
      return forStmt.clone();
    }
    forStmt.r#type = "ForStatement".to_string();
    if  leftNode.is_some() {
      forStmt.left = Some(Box::new(leftNode.unwrap().clone()));
    }
    if  self.matchValue(";".to_string()) == false {
      let mut test : JSNode = self.parseExpr();
      forStmt.test = Some(Box::new(test.clone()));
    }
    if  self.matchValue(";".to_string()) {
      self.advance();
    }
    if  self.matchValue(")".to_string()) == false {
      let mut update : JSNode = self.parseExpr();
      forStmt.right = Some(Box::new(update.clone()));
    }
    self.expectValue(")".to_string());
    let mut body_2 : JSNode = self.parseStatement();
    forStmt.body = Some(Box::new(body_2.clone()));
    return forStmt.clone();
  }
  fn parseSwitch(&mut self, ) -> JSNode {
    let mut switchStmt : JSNode = JSNode::new();
    switchStmt.r#type = "SwitchStatement".to_string();
    let mut startTok : Token = self.peek();
    switchStmt.start = startTok.start;
    switchStmt.line = startTok.line;
    switchStmt.col = startTok.col;
    self.expectValue("switch".to_string());
    self.expectValue("(".to_string());
    let mut discriminant : JSNode = self.parseExpr();
    switchStmt.test = Some(Box::new(discriminant.clone()));
    self.expectValue(")".to_string());
    self.expectValue("{".to_string());
    while (self.matchValue("}".to_string()) == false) && (self.isAtEnd() == false) {
      let mut caseNode : JSNode = JSNode::new();
      if  self.matchValue("case".to_string()) {
        caseNode.r#type = "SwitchCase".to_string();
        let mut caseTok : Token = self.peek();
        caseNode.start = caseTok.start;
        caseNode.line = caseTok.line;
        caseNode.col = caseTok.col;
        self.advance();
        let mut testExpr : JSNode = self.parseExpr();
        caseNode.test = Some(Box::new(testExpr.clone()));
        self.expectValue(":".to_string());
        while (((self.matchValue("case".to_string()) == false) && (self.matchValue("default".to_string()) == false)) && (self.matchValue("}".to_string()) == false)) && (self.isAtEnd() == false) {
          let mut stmt : JSNode = self.parseStatement();
          caseNode.children.push(stmt.clone());
        }
        switchStmt.children.push(caseNode.clone());
      } else {
        if  self.matchValue("default".to_string()) {
          caseNode.r#type = "SwitchCase".to_string();
          caseNode.name = "default".to_string();
          let mut defTok : Token = self.peek();
          caseNode.start = defTok.start;
          caseNode.line = defTok.line;
          caseNode.col = defTok.col;
          self.advance();
          self.expectValue(":".to_string());
          while ((self.matchValue("case".to_string()) == false) && (self.matchValue("}".to_string()) == false)) && (self.isAtEnd() == false) {
            let mut stmt_1 : JSNode = self.parseStatement();
            caseNode.children.push(stmt_1.clone());
          }
          switchStmt.children.push(caseNode.clone());
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
    tryStmt.r#type = "TryStatement".to_string();
    let mut startTok : Token = self.peek();
    tryStmt.start = startTok.start;
    tryStmt.line = startTok.line;
    tryStmt.col = startTok.col;
    self.expectValue("try".to_string());
    let mut block : JSNode = self.parseBlock();
    tryStmt.body = Some(Box::new(block.clone()));
    if  self.matchValue("catch".to_string()) {
      let mut catchNode : JSNode = JSNode::new();
      catchNode.r#type = "CatchClause".to_string();
      let mut catchTok : Token = self.peek();
      catchNode.start = catchTok.start;
      catchNode.line = catchTok.line;
      catchNode.col = catchTok.col;
      self.advance();
      self.expectValue("(".to_string());
      let mut paramTok : Token = self.expect("Identifier".to_string());
      catchNode.name = paramTok.value.clone();
      self.expectValue(")".to_string());
      let mut catchBody : JSNode = self.parseBlock();
      catchNode.body = Some(Box::new(catchBody.clone()));
      tryStmt.left = Some(Box::new(catchNode.clone()));
    }
    if  self.matchValue("finally".to_string()) {
      self.advance();
      let mut finallyBlock : JSNode = self.parseBlock();
      tryStmt.right = Some(Box::new(finallyBlock.clone()));
    }
    return tryStmt.clone();
  }
  fn parseThrow(&mut self, ) -> JSNode {
    let mut throwStmt : JSNode = JSNode::new();
    throwStmt.r#type = "ThrowStatement".to_string();
    let mut startTok : Token = self.peek();
    throwStmt.start = startTok.start;
    throwStmt.line = startTok.line;
    throwStmt.col = startTok.col;
    self.expectValue("throw".to_string());
    let mut arg : JSNode = self.parseExpr();
    throwStmt.left = Some(Box::new(arg.clone()));
    if  self.matchValue(";".to_string()) {
      self.advance();
    }
    return throwStmt.clone();
  }
  fn parseBreak(&mut self, ) -> JSNode {
    let mut breakStmt : JSNode = JSNode::new();
    breakStmt.r#type = "BreakStatement".to_string();
    let mut startTok : Token = self.peek();
    breakStmt.start = startTok.start;
    breakStmt.line = startTok.line;
    breakStmt.col = startTok.col;
    self.expectValue("break".to_string());
    if  self.matchType("Identifier".to_string()) {
      let mut labelTok : Token = self.peek();
      breakStmt.name = labelTok.value.clone();
      self.advance();
    }
    if  self.matchValue(";".to_string()) {
      self.advance();
    }
    return breakStmt.clone();
  }
  fn parseContinue(&mut self, ) -> JSNode {
    let mut contStmt : JSNode = JSNode::new();
    contStmt.r#type = "ContinueStatement".to_string();
    let mut startTok : Token = self.peek();
    contStmt.start = startTok.start;
    contStmt.line = startTok.line;
    contStmt.col = startTok.col;
    self.expectValue("continue".to_string());
    if  self.matchType("Identifier".to_string()) {
      let mut labelTok : Token = self.peek();
      contStmt.name = labelTok.value.clone();
      self.advance();
    }
    if  self.matchValue(";".to_string()) {
      self.advance();
    }
    return contStmt.clone();
  }
  fn parseExprStmt(&mut self, ) -> JSNode {
    let mut stmt : JSNode = JSNode::new();
    stmt.r#type = "ExpressionStatement".to_string();
    let mut startTok : Token = self.peek();
    stmt.start = startTok.start;
    stmt.line = startTok.line;
    stmt.col = startTok.col;
    let mut expr : JSNode = self.parseExpr();
    stmt.left = Some(Box::new(expr.clone()));
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
    if  (((((((((((((((tokVal == "=".to_string()) || (tokVal == "+=".to_string())) || (tokVal == "-=".to_string())) || (tokVal == "*=".to_string())) || (tokVal == "/=".to_string())) || (tokVal == "%=".to_string())) || (tokVal == "**=".to_string())) || (tokVal == "<<=".to_string())) || (tokVal == ">>=".to_string())) || (tokVal == ">>>=".to_string())) || (tokVal == "&=".to_string())) || (tokVal == "^=".to_string())) || (tokVal == "|=".to_string())) || (tokVal == "&&=".to_string())) || (tokVal == "||=".to_string())) || (tokVal == "??=".to_string()) {
      let mut opTok : Token = self.peek();
      self.advance();
      let mut right : JSNode = self.parseAssignment();
      let mut assign : JSNode = JSNode::new();
      assign.r#type = "AssignmentExpression".to_string();
      assign.operator = opTok.value.clone();
      assign.left = Some(Box::new(left.clone()));
      assign.right = Some(Box::new(right.clone()));
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
      ternary.r#type = "ConditionalExpression".to_string();
      ternary.left = Some(Box::new(condition.clone()));
      ternary.body = Some(Box::new(consequent.clone()));
      ternary.right = Some(Box::new(alternate.clone()));
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
      binary.r#type = "LogicalExpression".to_string();
      binary.operator = opTok.value.clone();
      binary.left = Some(Box::new(left.clone()));
      binary.right = Some(Box::new(right.clone()));
      binary.start = left.start;
      binary.line = left.line;
      binary.col = left.col;
      left = binary.clone();
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
      binary.r#type = "LogicalExpression".to_string();
      binary.operator = opTok.value.clone();
      binary.left = Some(Box::new(left.clone()));
      binary.right = Some(Box::new(right.clone()));
      binary.start = left.start;
      binary.line = left.line;
      binary.col = left.col;
      left = binary.clone();
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
      binary.r#type = "LogicalExpression".to_string();
      binary.operator = opTok.value.clone();
      binary.left = Some(Box::new(left.clone()));
      binary.right = Some(Box::new(right.clone()));
      binary.start = left.start;
      binary.line = left.line;
      binary.col = left.col;
      left = binary.clone();
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
      binary.r#type = "BinaryExpression".to_string();
      binary.operator = opTok.value.clone();
      binary.left = Some(Box::new(left.clone()));
      binary.right = Some(Box::new(right.clone()));
      binary.start = left.start;
      binary.line = left.line;
      binary.col = left.col;
      left = binary.clone();
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
      binary.r#type = "BinaryExpression".to_string();
      binary.operator = opTok.value.clone();
      binary.left = Some(Box::new(left.clone()));
      binary.right = Some(Box::new(right.clone()));
      binary.start = left.start;
      binary.line = left.line;
      binary.col = left.col;
      left = binary.clone();
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
      binary.r#type = "BinaryExpression".to_string();
      binary.operator = opTok.value.clone();
      binary.left = Some(Box::new(left.clone()));
      binary.right = Some(Box::new(right.clone()));
      binary.start = left.start;
      binary.line = left.line;
      binary.col = left.col;
      left = binary.clone();
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
      binary.r#type = "BinaryExpression".to_string();
      binary.operator = opTok.value.clone();
      binary.left = Some(Box::new(left.clone()));
      binary.right = Some(Box::new(right.clone()));
      binary.start = left.start;
      binary.line = left.line;
      binary.col = left.col;
      left = binary.clone();
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
        unary.r#type = "UnaryExpression".to_string();
        unary.operator = opTok.value.clone();
        unary.left = Some(Box::new(arg.clone()));
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
      unary_1.r#type = "UnaryExpression".to_string();
      unary_1.operator = opTok_1.value.clone();
      unary_1.left = Some(Box::new(arg_1.clone()));
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
      update.r#type = "UpdateExpression".to_string();
      update.operator = opTok_2.value.clone();
      update.prefix = true;
      update.left = Some(Box::new(arg_2.clone()));
      update.start = opTok_2.start;
      update.line = opTok_2.line;
      update.col = opTok_2.col;
      return update.clone();
    }
    if  tokVal == "yield".to_string() {
      let mut yieldTok : Token = self.peek();
      self.advance();
      let mut yieldExpr : JSNode = JSNode::new();
      yieldExpr.r#type = "YieldExpression".to_string();
      yieldExpr.start = yieldTok.start;
      yieldExpr.line = yieldTok.line;
      yieldExpr.col = yieldTok.col;
      if  self.matchValue("*".to_string()) {
        yieldExpr.delegate = true;
        self.advance();
      }
      let nextVal : String = self.peekValue();
      if  (((nextVal != ";".to_string()) && (nextVal != "}".to_string())) && (nextVal != ",".to_string())) && (nextVal != ")".to_string()) {
        let mut arg_3 : JSNode = self.parseAssignment();
        yieldExpr.left = Some(Box::new(arg_3.clone()));
      }
      return yieldExpr.clone();
    }
    if  tokVal == "await".to_string() {
      let mut awaitTok : Token = self.peek();
      self.advance();
      let mut arg_4 : JSNode = self.parseUnary();
      let mut awaitExpr : JSNode = JSNode::new();
      awaitExpr.r#type = "AwaitExpression".to_string();
      awaitExpr.left = Some(Box::new(arg_4.clone()));
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
        update.r#type = "UpdateExpression".to_string();
        update.operator = opTok.value.clone();
        update.prefix = false;
        update.left = Some(Box::new(object.clone()));
        update.start = object.start;
        update.line = object.line;
        update.col = object.col;
        object = update.clone();
      } else {
        if  tokVal == "?.".to_string() {
          self.advance();
          let nextTokVal : String = self.peekValue();
          if  nextTokVal == "(".to_string() {
            self.advance();
            let mut call : JSNode = JSNode::new();
            call.r#type = "OptionalCallExpression".to_string();
            call.left = Some(Box::new(object.clone()));
            call.start = object.start;
            call.line = object.line;
            call.col = object.col;
            while (self.matchValue(")".to_string()) == false) && (self.isAtEnd() == false) {
              if  ((call.children.len() as i64)) > 0 {
                self.expectValue(",".to_string());
              }
              if  self.matchValue(")".to_string()) || self.isAtEnd() {
                break;
              }
              let mut arg : JSNode = self.parseAssignment();
              call.children.push(arg.clone());
            }
            self.expectValue(")".to_string());
            object = call.clone();
          } else {
            if  nextTokVal == "[".to_string() {
              self.advance();
              let mut propExpr : JSNode = self.parseExpr();
              self.expectValue("]".to_string());
              let mut member : JSNode = JSNode::new();
              member.r#type = "OptionalMemberExpression".to_string();
              member.left = Some(Box::new(object.clone()));
              member.right = Some(Box::new(propExpr.clone()));
              member.computed = true;
              member.start = object.start;
              member.line = object.line;
              member.col = object.col;
              object = member.clone();
            } else {
              let mut propTok : Token = self.expect("Identifier".to_string());
              let mut member_1 : JSNode = JSNode::new();
              member_1.r#type = "OptionalMemberExpression".to_string();
              member_1.left = Some(Box::new(object.clone()));
              member_1.name = propTok.value.clone();
              member_1.computed = false;
              member_1.start = object.start;
              member_1.line = object.line;
              member_1.col = object.col;
              object = member_1.clone();
            }
          }
        } else {
          if  tokVal == ".".to_string() {
            self.advance();
            let mut propTok_1 : Token = self.expect("Identifier".to_string());
            let mut member_2 : JSNode = JSNode::new();
            member_2.r#type = "MemberExpression".to_string();
            member_2.left = Some(Box::new(object.clone()));
            member_2.name = propTok_1.value.clone();
            member_2.computed = false;
            member_2.start = object.start;
            member_2.line = object.line;
            member_2.col = object.col;
            object = member_2.clone();
          } else {
            if  tokVal == "[".to_string() {
              self.advance();
              let mut propExpr_1 : JSNode = self.parseExpr();
              self.expectValue("]".to_string());
              let mut member_3 : JSNode = JSNode::new();
              member_3.r#type = "MemberExpression".to_string();
              member_3.left = Some(Box::new(object.clone()));
              member_3.right = Some(Box::new(propExpr_1.clone()));
              member_3.computed = true;
              member_3.start = object.start;
              member_3.line = object.line;
              member_3.col = object.col;
              object = member_3.clone();
            } else {
              if  tokVal == "(".to_string() {
                self.advance();
                let mut call_1 : JSNode = JSNode::new();
                call_1.r#type = "CallExpression".to_string();
                call_1.left = Some(Box::new(object.clone()));
                call_1.start = object.start;
                call_1.line = object.line;
                call_1.col = object.col;
                while (self.matchValue(")".to_string()) == false) && (self.isAtEnd() == false) {
                  if  ((call_1.children.len() as i64)) > 0 {
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
                    spread.r#type = "SpreadElement".to_string();
                    spread.left = Some(Box::new(spreadArg.clone()));
                    spread.start = spreadTok.start;
                    spread.line = spreadTok.line;
                    spread.col = spreadTok.col;
                    call_1.children.push(spread.clone());
                  } else {
                    let mut arg_1 : JSNode = self.parseAssignment();
                    call_1.children.push(arg_1.clone());
                  }
                }
                self.expectValue(")".to_string());
                object = call_1.clone();
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
    newExpr.r#type = "NewExpression".to_string();
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
        member.r#type = "MemberExpression".to_string();
        member.left = Some(Box::new(callee.clone()));
        member.name = propTok.value.clone();
        member.computed = false;
        member.start = callee.start;
        member.line = callee.line;
        member.col = callee.col;
        callee = member.clone();
      } else {
        cont = false;
      }
    }
    newExpr.left = Some(Box::new(callee.clone()));
    if  self.matchValue("(".to_string()) {
      self.advance();
      while (self.matchValue(")".to_string()) == false) && (self.isAtEnd() == false) {
        if  ((newExpr.children.len() as i64)) > 0 {
          self.expectValue(",".to_string());
        }
        if  self.matchValue(")".to_string()) || self.isAtEnd() {
          break;
        }
        let mut arg : JSNode = self.parseAssignment();
        newExpr.children.push(arg.clone());
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
      id.r#type = "Identifier".to_string();
      id.name = tok.value.clone();
      id.start = tok.start;
      id.end = tok.end;
      id.line = tok.line;
      id.col = tok.col;
      return id.clone();
    }
    if  tokType == "Number".to_string() {
      self.advance();
      let mut lit : JSNode = JSNode::new();
      lit.r#type = "Literal".to_string();
      lit.raw = tok.value.clone();
      lit.start = tok.start;
      lit.end = tok.end;
      lit.line = tok.line;
      lit.col = tok.col;
      return lit.clone();
    }
    if  tokType == "String".to_string() {
      self.advance();
      let mut lit_1 : JSNode = JSNode::new();
      lit_1.r#type = "Literal".to_string();
      lit_1.raw = tok.value.clone();
      lit_1.start = tok.start;
      lit_1.end = tok.end;
      lit_1.line = tok.line;
      lit_1.col = tok.col;
      return lit_1.clone();
    }
    if  (tokVal == "true".to_string()) || (tokVal == "false".to_string()) {
      self.advance();
      let mut lit_2 : JSNode = JSNode::new();
      lit_2.r#type = "Literal".to_string();
      lit_2.raw = tok.value.clone();
      lit_2.start = tok.start;
      lit_2.end = tok.end;
      lit_2.line = tok.line;
      lit_2.col = tok.col;
      return lit_2.clone();
    }
    if  tokVal == "null".to_string() {
      self.advance();
      let mut lit_3 : JSNode = JSNode::new();
      lit_3.r#type = "Literal".to_string();
      lit_3.raw = "null".to_string();
      lit_3.start = tok.start;
      lit_3.end = tok.end;
      lit_3.line = tok.line;
      lit_3.col = tok.col;
      return lit_3.clone();
    }
    if  tokType == "TemplateLiteral".to_string() {
      self.advance();
      let mut tmpl : JSNode = JSNode::new();
      tmpl.r#type = "TemplateLiteral".to_string();
      tmpl.raw = tok.value.clone();
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
    fallback.r#type = "Identifier".to_string();
    fallback.name = tok.value.clone();
    fallback.start = tok.start;
    fallback.end = tok.end;
    fallback.line = tok.line;
    fallback.col = tok.col;
    return fallback.clone();
  }
  fn parseArray(&mut self, ) -> JSNode {
    let mut arr : JSNode = JSNode::new();
    arr.r#type = "ArrayExpression".to_string();
    let mut startTok : Token = self.peek();
    arr.start = startTok.start;
    arr.line = startTok.line;
    arr.col = startTok.col;
    self.expectValue("[".to_string());
    while (self.matchValue("]".to_string()) == false) && (self.isAtEnd() == false) {
      if  ((arr.children.len() as i64)) > 0 {
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
        spread.r#type = "SpreadElement".to_string();
        spread.left = Some(Box::new(arg.clone()));
        spread.start = spreadTok.start;
        spread.line = spreadTok.line;
        spread.col = spreadTok.col;
        arr.children.push(spread.clone());
      } else {
        let mut elem : JSNode = self.parseAssignment();
        arr.children.push(elem.clone());
      }
    }
    self.expectValue("]".to_string());
    return arr.clone();
  }
  fn parseObject(&mut self, ) -> JSNode {
    let mut obj : JSNode = JSNode::new();
    obj.r#type = "ObjectExpression".to_string();
    let mut startTok : Token = self.peek();
    obj.start = startTok.start;
    obj.line = startTok.line;
    obj.col = startTok.col;
    self.expectValue("{".to_string());
    while (self.matchValue("}".to_string()) == false) && (self.isAtEnd() == false) {
      if  ((obj.children.len() as i64)) > 0 {
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
        spread.r#type = "SpreadElement".to_string();
        spread.left = Some(Box::new(arg.clone()));
        spread.start = spreadTok.start;
        spread.line = spreadTok.line;
        spread.col = spreadTok.col;
        obj.children.push(spread.clone());
      } else {
        let mut prop : JSNode = JSNode::new();
        prop.r#type = "Property".to_string();
        let mut keyTok : Token = self.peek();
        let keyType : String = self.peekType();
        if  self.matchValue("[".to_string()) {
          self.advance();
          let mut keyExpr : JSNode = self.parseAssignment();
          self.expectValue("]".to_string());
          self.expectValue(":".to_string());
          let mut val : JSNode = self.parseAssignment();
          prop.right = Some(Box::new(keyExpr.clone()));
          prop.left = Some(Box::new(val.clone()));
          prop.computed = true;
          prop.start = keyTok.start;
          prop.line = keyTok.line;
          prop.col = keyTok.col;
          obj.children.push(prop.clone());
        } else {
          if  ((keyType == "Identifier".to_string()) || (keyType == "String".to_string())) || (keyType == "Number".to_string()) {
            self.advance();
            prop.name = keyTok.value.clone();
            prop.start = keyTok.start;
            prop.line = keyTok.line;
            prop.col = keyTok.col;
            if  self.matchValue(":".to_string()) {
              self.expectValue(":".to_string());
              let mut val_1 : JSNode = self.parseAssignment();
              prop.left = Some(Box::new(val_1.clone()));
            } else {
              let mut id : JSNode = JSNode::new();
              id.r#type = "Identifier".to_string();
              id.name = keyTok.value.clone();
              id.start = keyTok.start;
              id.line = keyTok.line;
              id.col = keyTok.col;
              prop.left = Some(Box::new(id.clone()));
              prop.shorthand = true;
            }
            obj.children.push(prop.clone());
          } else {
            let err : String = format!("{}{}", (format!("{}{}", (format!("{}{}", ([(format!("{}{}", (["Parse error at line ".to_string() , (keyTok.line.to_string()) ].join("")), ":".to_string())) , (keyTok.col.to_string()) ].join("")), ": unexpected token '".to_string())), keyTok.value)), "' in object literal".to_string());
            self.addError(err.clone());
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
    pattern.r#type = "ArrayPattern".to_string();
    let mut startTok : Token = self.peek();
    pattern.start = startTok.start;
    pattern.line = startTok.line;
    pattern.col = startTok.col;
    self.expectValue("[".to_string());
    while (self.matchValue("]".to_string()) == false) && (self.isAtEnd() == false) {
      if  ((pattern.children.len() as i64)) > 0 {
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
        rest.r#type = "RestElement".to_string();
        rest.name = idTok.value.clone();
        rest.start = restTok.start;
        rest.line = restTok.line;
        rest.col = restTok.col;
        pattern.children.push(rest.clone());
      } else {
        if  self.matchValue("[".to_string()) {
          let mut nested : JSNode = self.parseArrayPattern();
          pattern.children.push(nested.clone());
        } else {
          if  self.matchValue("{".to_string()) {
            let mut nested_1 : JSNode = self.parseObjectPattern();
            pattern.children.push(nested_1.clone());
          } else {
            let mut idTok_1 : Token = self.expect("Identifier".to_string());
            let mut id : JSNode = JSNode::new();
            id.r#type = "Identifier".to_string();
            id.name = idTok_1.value.clone();
            id.start = idTok_1.start;
            id.line = idTok_1.line;
            id.col = idTok_1.col;
            pattern.children.push(id.clone());
          }
        }
      }
    }
    self.expectValue("]".to_string());
    return pattern.clone();
  }
  fn parseObjectPattern(&mut self, ) -> JSNode {
    let mut pattern : JSNode = JSNode::new();
    pattern.r#type = "ObjectPattern".to_string();
    let mut startTok : Token = self.peek();
    pattern.start = startTok.start;
    pattern.line = startTok.line;
    pattern.col = startTok.col;
    self.expectValue("{".to_string());
    while (self.matchValue("}".to_string()) == false) && (self.isAtEnd() == false) {
      if  ((pattern.children.len() as i64)) > 0 {
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
        rest.r#type = "RestElement".to_string();
        rest.name = idTok.value.clone();
        rest.start = restTok.start;
        rest.line = restTok.line;
        rest.col = restTok.col;
        pattern.children.push(rest.clone());
      } else {
        let mut prop : JSNode = JSNode::new();
        prop.r#type = "Property".to_string();
        let mut keyTok : Token = self.expect("Identifier".to_string());
        prop.name = keyTok.value.clone();
        prop.start = keyTok.start;
        prop.line = keyTok.line;
        prop.col = keyTok.col;
        if  self.matchValue(":".to_string()) {
          self.advance();
          if  self.matchValue("[".to_string()) {
            let mut nested : JSNode = self.parseArrayPattern();
            prop.left = Some(Box::new(nested.clone()));
          } else {
            if  self.matchValue("{".to_string()) {
              let mut nested_1 : JSNode = self.parseObjectPattern();
              prop.left = Some(Box::new(nested_1.clone()));
            } else {
              let mut idTok2 : Token = self.expect("Identifier".to_string());
              let mut id : JSNode = JSNode::new();
              id.r#type = "Identifier".to_string();
              id.name = idTok2.value.clone();
              id.start = idTok2.start;
              id.line = idTok2.line;
              id.col = idTok2.col;
              prop.left = Some(Box::new(id.clone()));
            }
          }
        } else {
          let mut id_1 : JSNode = JSNode::new();
          id_1.r#type = "Identifier".to_string();
          id_1.name = keyTok.value.clone();
          id_1.start = keyTok.start;
          id_1.line = keyTok.line;
          id_1.col = keyTok.col;
          prop.left = Some(Box::new(id_1.clone()));
          prop.shorthand = true;
        }
        pattern.children.push(prop.clone());
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
    arrow.r#type = "ArrowFunctionExpression".to_string();
    let mut startTok : Token = self.peek();
    arrow.start = startTok.start;
    arrow.line = startTok.line;
    arrow.col = startTok.col;
    if  self.matchValue("(".to_string()) {
      self.advance();
      while (self.matchValue(")".to_string()) == false) && (self.isAtEnd() == false) {
        if  ((arrow.children.len() as i64)) > 0 {
          self.expectValue(",".to_string());
        }
        if  self.matchValue(")".to_string()) || self.isAtEnd() {
          break;
        }
        let mut paramTok : Token = self.expect("Identifier".to_string());
        let mut param : JSNode = JSNode::new();
        param.r#type = "Identifier".to_string();
        param.name = paramTok.value.clone();
        param.start = paramTok.start;
        param.line = paramTok.line;
        param.col = paramTok.col;
        arrow.children.push(param.clone());
      }
      self.expectValue(")".to_string());
    } else {
      let mut paramTok_1 : Token = self.expect("Identifier".to_string());
      let mut param_1 : JSNode = JSNode::new();
      param_1.r#type = "Identifier".to_string();
      param_1.name = paramTok_1.value.clone();
      param_1.start = paramTok_1.start;
      param_1.line = paramTok_1.line;
      param_1.col = paramTok_1.col;
      arrow.children.push(param_1.clone());
    }
    self.expectValue("=>".to_string());
    if  self.matchValue("{".to_string()) {
      let mut body : JSNode = self.parseBlock();
      arrow.body = Some(Box::new(body.clone()));
    } else {
      let mut expr : JSNode = self.parseAssignment();
      arrow.body = Some(Box::new(expr.clone()));
    }
    return arrow.clone();
  }
  fn parseAsyncArrowFunction(&mut self, ) -> JSNode {
    let mut arrow : JSNode = JSNode::new();
    arrow.r#type = "ArrowFunctionExpression".to_string();
    arrow.r#async = true;
    let mut startTok : Token = self.peek();
    arrow.start = startTok.start;
    arrow.line = startTok.line;
    arrow.col = startTok.col;
    self.expectValue("async".to_string());
    if  self.matchValue("(".to_string()) {
      self.advance();
      while (self.matchValue(")".to_string()) == false) && (self.isAtEnd() == false) {
        if  ((arrow.children.len() as i64)) > 0 {
          self.expectValue(",".to_string());
        }
        if  self.matchValue(")".to_string()) || self.isAtEnd() {
          break;
        }
        let mut paramTok : Token = self.expect("Identifier".to_string());
        let mut param : JSNode = JSNode::new();
        param.r#type = "Identifier".to_string();
        param.name = paramTok.value.clone();
        param.start = paramTok.start;
        param.line = paramTok.line;
        param.col = paramTok.col;
        arrow.children.push(param.clone());
      }
      self.expectValue(")".to_string());
    } else {
      let mut paramTok_1 : Token = self.expect("Identifier".to_string());
      let mut param_1 : JSNode = JSNode::new();
      param_1.r#type = "Identifier".to_string();
      param_1.name = paramTok_1.value.clone();
      param_1.start = paramTok_1.start;
      param_1.line = paramTok_1.line;
      param_1.col = paramTok_1.col;
      arrow.children.push(param_1.clone());
    }
    self.expectValue("=>".to_string());
    if  self.matchValue("{".to_string()) {
      let mut body : JSNode = self.parseBlock();
      arrow.body = Some(Box::new(body.clone()));
    } else {
      let mut expr : JSNode = self.parseAssignment();
      arrow.body = Some(Box::new(expr.clone()));
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
  pub fn printNode(mut node : JSNode, depth : i64) -> () {
    let mut indent : String = "".to_string();
    let mut i : i64 = 0;
    while i < depth {
      indent = format!("{}{}", indent, "  ".to_string());
      i = i + 1;
    }
    let numComments : i64 = (node.leadingComments.len() as i64);
    if  numComments > 0 {
      for ci in 0..node.leadingComments.len() {
        let mut comment = node.leadingComments[ci as usize].clone();
        let commentType : String = comment.r#type.clone();
        let mut preview : String = comment.raw.clone();
        if  (preview.len() as i64) > 40 {
          preview = format!("{}{}", (preview.chars().skip(0 as usize).take((40 - 0) as usize).collect::<String>()), "...".to_string());
        }
        println!( "{}", format!("{}{}", (format!("{}{}", (format!("{}{}", indent, commentType)), ": ".to_string())), preview) );
      }
    }
    let nodeType : String = node.r#type.clone();
    let loc : String = format!("{}{}", ([(format!("{}{}", (["[".to_string() , (node.line.to_string()) ].join("")), ":".to_string())) , (node.col.to_string()) ].join("")), "]".to_string());
    if  nodeType == "VariableDeclaration".to_string() {
      let kind : String = node.name.clone();
      if  (kind.len() as i64) > 0 {
        println!( "{}", format!("{}{}", (format!("{}{}", (format!("{}{}", (format!("{}{}", indent, "VariableDeclaration (".to_string())), kind)), ") ".to_string())), loc) );
      } else {
        println!( "{}", format!("{}{}", (format!("{}{}", indent, "VariableDeclaration ".to_string())), loc) );
      }
      for ci_1 in 0..node.children.len() {
        let mut child = node.children[ci_1 as usize].clone();
        ASTPrinter::printNode(child.clone(), depth + 1);
      }
      return;
    }
    if  nodeType == "VariableDeclarator".to_string() {
      if  node.left.is_some() {
        let mut id : JSNode = (*node.left.clone().unwrap());
        let idType : String = id.r#type.clone();
        if  idType == "Identifier".to_string() {
          println!( "{}", format!("{}{}", (format!("{}{}", (format!("{}{}", (format!("{}{}", indent, "VariableDeclarator: ".to_string())), id.name)), " ".to_string())), loc) );
        } else {
          println!( "{}", format!("{}{}", (format!("{}{}", indent, "VariableDeclarator ".to_string())), loc) );
          println!( "{}", format!("{}{}", indent, "  pattern:".to_string()) );
          ASTPrinter::printNode(id.clone(), depth + 2);
        }
      } else {
        println!( "{}", format!("{}{}", (format!("{}{}", indent, "VariableDeclarator ".to_string())), loc) );
      }
      if  node.right.is_some() {
        ASTPrinter::printNode((*node.right.clone().unwrap()), depth + 1);
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
        params = format!("{}{}", params, p.name);
      }
      let mut prefix : String = "".to_string();
      if  node.r#async {
        if  node.generator {
          prefix = "async function* ".to_string();
        } else {
          prefix = "async ".to_string();
        }
      } else {
        if  node.generator {
          prefix = "function* ".to_string();
        }
      }
      if  (prefix.len() as i64) > 0 {
        println!( "{}", format!("{}{}", (format!("{}{}", (format!("{}{}", (format!("{}{}", (format!("{}{}", (format!("{}{}", (format!("{}{}", indent, "FunctionDeclaration: ".to_string())), prefix)), node.name)), "(".to_string())), params)), ") ".to_string())), loc) );
      } else {
        println!( "{}", format!("{}{}", (format!("{}{}", (format!("{}{}", (format!("{}{}", (format!("{}{}", (format!("{}{}", indent, "FunctionDeclaration: ".to_string())), node.name)), "(".to_string())), params)), ") ".to_string())), loc) );
      }
      if  node.body.is_some() {
        ASTPrinter::printNode((*node.body.clone().unwrap()), depth + 1);
      }
      return;
    }
    if  nodeType == "ClassDeclaration".to_string() {
      let mut output : String = format!("{}{}", (format!("{}{}", indent, "ClassDeclaration: ".to_string())), node.name);
      if  node.left.is_some() {
        let mut superClass : JSNode = (*node.left.clone().unwrap());
        output = format!("{}{}", (format!("{}{}", output, " extends ".to_string())), superClass.name);
      }
      println!( "{}", format!("{}{}", (format!("{}{}", output, " ".to_string())), loc) );
      if  node.body.is_some() {
        ASTPrinter::printNode((*node.body.clone().unwrap()), depth + 1);
      }
      return;
    }
    if  nodeType == "ClassBody".to_string() {
      println!( "{}", format!("{}{}", (format!("{}{}", indent, "ClassBody ".to_string())), loc) );
      for mi in 0..node.children.len() {
        let mut method = node.children[mi as usize].clone();
        ASTPrinter::printNode(method.clone(), depth + 1);
      }
      return;
    }
    if  nodeType == "MethodDefinition".to_string() {
      let mut staticStr : String = "".to_string();
      if  node.r#static {
        staticStr = "static ".to_string();
      }
      println!( "{}", format!("{}{}", (format!("{}{}", (format!("{}{}", (format!("{}{}", (format!("{}{}", indent, "MethodDefinition: ".to_string())), staticStr)), node.name)), " ".to_string())), loc) );
      if  node.body.is_some() {
        ASTPrinter::printNode((*node.body.clone().unwrap()), depth + 1);
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
        params_1 = format!("{}{}", params_1, p_1.name);
      }
      let mut asyncStr : String = "".to_string();
      if  node.r#async {
        asyncStr = "async ".to_string();
      }
      println!( "{}", format!("{}{}", (format!("{}{}", (format!("{}{}", (format!("{}{}", (format!("{}{}", (format!("{}{}", indent, "ArrowFunctionExpression: ".to_string())), asyncStr)), "(".to_string())), params_1)), ") => ".to_string())), loc) );
      if  node.body.is_some() {
        ASTPrinter::printNode((*node.body.clone().unwrap()), depth + 1);
      }
      return;
    }
    if  nodeType == "YieldExpression".to_string() {
      let mut delegateStr : String = "".to_string();
      if  node.name == "delegate".to_string() {
        delegateStr = "*".to_string();
      }
      println!( "{}", format!("{}{}", (format!("{}{}", (format!("{}{}", (format!("{}{}", indent, "YieldExpression".to_string())), delegateStr)), " ".to_string())), loc) );
      if  node.left.is_some() {
        ASTPrinter::printNode((*node.left.clone().unwrap()), depth + 1);
      }
      return;
    }
    if  nodeType == "AwaitExpression".to_string() {
      println!( "{}", format!("{}{}", (format!("{}{}", indent, "AwaitExpression ".to_string())), loc) );
      if  node.left.is_some() {
        ASTPrinter::printNode((*node.left.clone().unwrap()), depth + 1);
      }
      return;
    }
    if  nodeType == "TemplateLiteral".to_string() {
      println!( "{}", format!("{}{}", (format!("{}{}", (format!("{}{}", (format!("{}{}", indent, "TemplateLiteral: `".to_string())), node.name)), "` ".to_string())), loc) );
      return;
    }
    if  nodeType == "BlockStatement".to_string() {
      println!( "{}", format!("{}{}", (format!("{}{}", indent, "BlockStatement ".to_string())), loc) );
      for ci_2 in 0..node.children.len() {
        let mut child_1 = node.children[ci_2 as usize].clone();
        ASTPrinter::printNode(child_1.clone(), depth + 1);
      }
      return;
    }
    if  nodeType == "ReturnStatement".to_string() {
      println!( "{}", format!("{}{}", (format!("{}{}", indent, "ReturnStatement ".to_string())), loc) );
      if  node.left.is_some() {
        ASTPrinter::printNode((*node.left.clone().unwrap()), depth + 1);
      }
      return;
    }
    if  nodeType == "IfStatement".to_string() {
      println!( "{}", format!("{}{}", (format!("{}{}", indent, "IfStatement ".to_string())), loc) );
      println!( "{}", format!("{}{}", indent, "  test:".to_string()) );
      if  node.test.is_some() {
        ASTPrinter::printNode((*node.test.clone().unwrap()), depth + 2);
      }
      println!( "{}", format!("{}{}", indent, "  consequent:".to_string()) );
      if  node.body.is_some() {
        ASTPrinter::printNode((*node.body.clone().unwrap()), depth + 2);
      }
      if  node.alternate.is_some() {
        println!( "{}", format!("{}{}", indent, "  alternate:".to_string()) );
        ASTPrinter::printNode((*node.alternate.clone().unwrap()), depth + 2);
      }
      return;
    }
    if  nodeType == "ExpressionStatement".to_string() {
      println!( "{}", format!("{}{}", (format!("{}{}", indent, "ExpressionStatement ".to_string())), loc) );
      if  node.left.is_some() {
        ASTPrinter::printNode((*node.left.clone().unwrap()), depth + 1);
      }
      return;
    }
    if  nodeType == "AssignmentExpression".to_string() {
      println!( "{}", format!("{}{}", (format!("{}{}", (format!("{}{}", (format!("{}{}", indent, "AssignmentExpression: ".to_string())), node.name)), " ".to_string())), loc) );
      if  node.left.is_some() {
        println!( "{}", format!("{}{}", indent, "  left:".to_string()) );
        ASTPrinter::printNode((*node.left.clone().unwrap()), depth + 2);
      }
      if  node.right.is_some() {
        println!( "{}", format!("{}{}", indent, "  right:".to_string()) );
        ASTPrinter::printNode((*node.right.clone().unwrap()), depth + 2);
      }
      return;
    }
    if  (nodeType == "BinaryExpression".to_string()) || (nodeType == "LogicalExpression".to_string()) {
      println!( "{}", format!("{}{}", (format!("{}{}", (format!("{}{}", (format!("{}{}", (format!("{}{}", indent, nodeType)), ": ".to_string())), node.name)), " ".to_string())), loc) );
      if  node.left.is_some() {
        println!( "{}", format!("{}{}", indent, "  left:".to_string()) );
        ASTPrinter::printNode((*node.left.clone().unwrap()), depth + 2);
      }
      if  node.right.is_some() {
        println!( "{}", format!("{}{}", indent, "  right:".to_string()) );
        ASTPrinter::printNode((*node.right.clone().unwrap()), depth + 2);
      }
      return;
    }
    if  nodeType == "UnaryExpression".to_string() {
      println!( "{}", format!("{}{}", (format!("{}{}", (format!("{}{}", (format!("{}{}", indent, "UnaryExpression: ".to_string())), node.name)), " ".to_string())), loc) );
      if  node.left.is_some() {
        ASTPrinter::printNode((*node.left.clone().unwrap()), depth + 1);
      }
      return;
    }
    if  nodeType == "UpdateExpression".to_string() {
      let mut prefix_1 : String = "".to_string();
      if  node.prefix {
        prefix_1 = "prefix ".to_string();
      } else {
        prefix_1 = "postfix ".to_string();
      }
      println!( "{}", format!("{}{}", (format!("{}{}", (format!("{}{}", (format!("{}{}", (format!("{}{}", indent, "UpdateExpression: ".to_string())), prefix_1)), node.name)), " ".to_string())), loc) );
      if  node.left.is_some() {
        ASTPrinter::printNode((*node.left.clone().unwrap()), depth + 1);
      }
      return;
    }
    if  nodeType == "NewExpression".to_string() {
      println!( "{}", format!("{}{}", (format!("{}{}", indent, "NewExpression ".to_string())), loc) );
      println!( "{}", format!("{}{}", indent, "  callee:".to_string()) );
      if  node.left.is_some() {
        ASTPrinter::printNode((*node.left.clone().unwrap()), depth + 2);
      }
      if  ((node.children.len() as i64)) > 0 {
        println!( "{}", format!("{}{}", indent, "  arguments:".to_string()) );
        for ai in 0..node.children.len() {
          let mut arg = node.children[ai as usize].clone();
          ASTPrinter::printNode(arg.clone(), depth + 2);
        }
      }
      return;
    }
    if  nodeType == "ConditionalExpression".to_string() {
      println!( "{}", format!("{}{}", (format!("{}{}", indent, "ConditionalExpression ".to_string())), loc) );
      println!( "{}", format!("{}{}", indent, "  test:".to_string()) );
      if  node.left.is_some() {
        ASTPrinter::printNode((*node.left.clone().unwrap()), depth + 2);
      }
      println!( "{}", format!("{}{}", indent, "  consequent:".to_string()) );
      if  node.body.is_some() {
        ASTPrinter::printNode((*node.body.clone().unwrap()), depth + 2);
      }
      println!( "{}", format!("{}{}", indent, "  alternate:".to_string()) );
      if  node.right.is_some() {
        ASTPrinter::printNode((*node.right.clone().unwrap()), depth + 2);
      }
      return;
    }
    if  nodeType == "CallExpression".to_string() {
      println!( "{}", format!("{}{}", (format!("{}{}", indent, "CallExpression ".to_string())), loc) );
      if  node.left.is_some() {
        println!( "{}", format!("{}{}", indent, "  callee:".to_string()) );
        ASTPrinter::printNode((*node.left.clone().unwrap()), depth + 2);
      }
      if  ((node.children.len() as i64)) > 0 {
        println!( "{}", format!("{}{}", indent, "  arguments:".to_string()) );
        for ai_1 in 0..node.children.len() {
          let mut arg_1 = node.children[ai_1 as usize].clone();
          ASTPrinter::printNode(arg_1.clone(), depth + 2);
        }
      }
      return;
    }
    if  nodeType == "MemberExpression".to_string() {
      if  node.computed == false {
        println!( "{}", format!("{}{}", (format!("{}{}", (format!("{}{}", (format!("{}{}", indent, "MemberExpression: .".to_string())), node.name)), " ".to_string())), loc) );
      } else {
        println!( "{}", format!("{}{}", (format!("{}{}", indent, "MemberExpression: [computed] ".to_string())), loc) );
      }
      if  node.left.is_some() {
        ASTPrinter::printNode((*node.left.clone().unwrap()), depth + 1);
      }
      if  node.right.is_some() {
        ASTPrinter::printNode((*node.right.clone().unwrap()), depth + 1);
      }
      return;
    }
    if  nodeType == "Identifier".to_string() {
      println!( "{}", format!("{}{}", (format!("{}{}", (format!("{}{}", (format!("{}{}", indent, "Identifier: ".to_string())), node.name)), " ".to_string())), loc) );
      return;
    }
    if  nodeType == "Literal".to_string() {
      println!( "{}", format!("{}{}", (format!("{}{}", (format!("{}{}", (format!("{}{}", (format!("{}{}", (format!("{}{}", indent, "Literal: ".to_string())), node.name)), " (".to_string())), node.raw)), ") ".to_string())), loc) );
      return;
    }
    if  nodeType == "ArrayExpression".to_string() {
      println!( "{}", format!("{}{}", (format!("{}{}", indent, "ArrayExpression ".to_string())), loc) );
      for ei in 0..node.children.len() {
        let mut elem = node.children[ei as usize].clone();
        ASTPrinter::printNode(elem.clone(), depth + 1);
      }
      return;
    }
    if  nodeType == "ObjectExpression".to_string() {
      println!( "{}", format!("{}{}", (format!("{}{}", indent, "ObjectExpression ".to_string())), loc) );
      for pi_2 in 0..node.children.len() {
        let mut prop = node.children[pi_2 as usize].clone();
        ASTPrinter::printNode(prop.clone(), depth + 1);
      }
      return;
    }
    if  nodeType == "Property".to_string() {
      let mut shorthand : String = "".to_string();
      if  node.shorthand {
        shorthand = " (shorthand)".to_string();
      }
      println!( "{}", format!("{}{}", (format!("{}{}", (format!("{}{}", (format!("{}{}", (format!("{}{}", indent, "Property: ".to_string())), node.name)), shorthand)), " ".to_string())), loc) );
      if  node.left.is_some() {
        ASTPrinter::printNode((*node.left.clone().unwrap()), depth + 1);
      }
      return;
    }
    if  nodeType == "ArrayPattern".to_string() {
      println!( "{}", format!("{}{}", (format!("{}{}", indent, "ArrayPattern ".to_string())), loc) );
      for ei_1 in 0..node.children.len() {
        let mut elem_1 = node.children[ei_1 as usize].clone();
        ASTPrinter::printNode(elem_1.clone(), depth + 1);
      }
      return;
    }
    if  nodeType == "ObjectPattern".to_string() {
      println!( "{}", format!("{}{}", (format!("{}{}", indent, "ObjectPattern ".to_string())), loc) );
      for pi_3 in 0..node.children.len() {
        let mut prop_1 = node.children[pi_3 as usize].clone();
        ASTPrinter::printNode(prop_1.clone(), depth + 1);
      }
      return;
    }
    if  nodeType == "SpreadElement".to_string() {
      println!( "{}", format!("{}{}", (format!("{}{}", indent, "SpreadElement ".to_string())), loc) );
      if  node.left.is_some() {
        ASTPrinter::printNode((*node.left.clone().unwrap()), depth + 1);
      }
      return;
    }
    if  nodeType == "RestElement".to_string() {
      println!( "{}", format!("{}{}", (format!("{}{}", (format!("{}{}", (format!("{}{}", indent, "RestElement: ...".to_string())), node.name)), " ".to_string())), loc) );
      return;
    }
    if  nodeType == "WhileStatement".to_string() {
      println!( "{}", format!("{}{}", (format!("{}{}", indent, "WhileStatement ".to_string())), loc) );
      println!( "{}", format!("{}{}", indent, "  test:".to_string()) );
      if  node.test.is_some() {
        ASTPrinter::printNode((*node.test.clone().unwrap()), depth + 2);
      }
      println!( "{}", format!("{}{}", indent, "  body:".to_string()) );
      if  node.body.is_some() {
        ASTPrinter::printNode((*node.body.clone().unwrap()), depth + 2);
      }
      return;
    }
    if  nodeType == "DoWhileStatement".to_string() {
      println!( "{}", format!("{}{}", (format!("{}{}", indent, "DoWhileStatement ".to_string())), loc) );
      println!( "{}", format!("{}{}", indent, "  body:".to_string()) );
      if  node.body.is_some() {
        ASTPrinter::printNode((*node.body.clone().unwrap()), depth + 2);
      }
      println!( "{}", format!("{}{}", indent, "  test:".to_string()) );
      if  node.test.is_some() {
        ASTPrinter::printNode((*node.test.clone().unwrap()), depth + 2);
      }
      return;
    }
    if  nodeType == "ForStatement".to_string() {
      println!( "{}", format!("{}{}", (format!("{}{}", indent, "ForStatement ".to_string())), loc) );
      if  node.left.is_some() {
        println!( "{}", format!("{}{}", indent, "  init:".to_string()) );
        ASTPrinter::printNode((*node.left.clone().unwrap()), depth + 2);
      }
      if  node.test.is_some() {
        println!( "{}", format!("{}{}", indent, "  test:".to_string()) );
        ASTPrinter::printNode((*node.test.clone().unwrap()), depth + 2);
      }
      if  node.right.is_some() {
        println!( "{}", format!("{}{}", indent, "  update:".to_string()) );
        ASTPrinter::printNode((*node.right.clone().unwrap()), depth + 2);
      }
      println!( "{}", format!("{}{}", indent, "  body:".to_string()) );
      if  node.body.is_some() {
        ASTPrinter::printNode((*node.body.clone().unwrap()), depth + 2);
      }
      return;
    }
    if  nodeType == "ForOfStatement".to_string() {
      println!( "{}", format!("{}{}", (format!("{}{}", indent, "ForOfStatement ".to_string())), loc) );
      if  node.left.is_some() {
        println!( "{}", format!("{}{}", indent, "  left:".to_string()) );
        ASTPrinter::printNode((*node.left.clone().unwrap()), depth + 2);
      }
      if  node.right.is_some() {
        println!( "{}", format!("{}{}", indent, "  right:".to_string()) );
        ASTPrinter::printNode((*node.right.clone().unwrap()), depth + 2);
      }
      println!( "{}", format!("{}{}", indent, "  body:".to_string()) );
      if  node.body.is_some() {
        ASTPrinter::printNode((*node.body.clone().unwrap()), depth + 2);
      }
      return;
    }
    if  nodeType == "ForInStatement".to_string() {
      println!( "{}", format!("{}{}", (format!("{}{}", indent, "ForInStatement ".to_string())), loc) );
      if  node.left.is_some() {
        println!( "{}", format!("{}{}", indent, "  left:".to_string()) );
        ASTPrinter::printNode((*node.left.clone().unwrap()), depth + 2);
      }
      if  node.right.is_some() {
        println!( "{}", format!("{}{}", indent, "  right:".to_string()) );
        ASTPrinter::printNode((*node.right.clone().unwrap()), depth + 2);
      }
      println!( "{}", format!("{}{}", indent, "  body:".to_string()) );
      if  node.body.is_some() {
        ASTPrinter::printNode((*node.body.clone().unwrap()), depth + 2);
      }
      return;
    }
    if  nodeType == "SwitchStatement".to_string() {
      println!( "{}", format!("{}{}", (format!("{}{}", indent, "SwitchStatement ".to_string())), loc) );
      println!( "{}", format!("{}{}", indent, "  discriminant:".to_string()) );
      if  node.test.is_some() {
        ASTPrinter::printNode((*node.test.clone().unwrap()), depth + 2);
      }
      println!( "{}", format!("{}{}", indent, "  cases:".to_string()) );
      for ci_3 in 0..node.children.len() {
        let mut caseNode = node.children[ci_3 as usize].clone();
        ASTPrinter::printNode(caseNode.clone(), depth + 2);
      }
      return;
    }
    if  nodeType == "SwitchCase".to_string() {
      if  node.name == "default".to_string() {
        println!( "{}", format!("{}{}", (format!("{}{}", indent, "SwitchCase: default ".to_string())), loc) );
      } else {
        println!( "{}", format!("{}{}", (format!("{}{}", indent, "SwitchCase ".to_string())), loc) );
        if  node.test.is_some() {
          println!( "{}", format!("{}{}", indent, "  test:".to_string()) );
          ASTPrinter::printNode((*node.test.clone().unwrap()), depth + 2);
        }
      }
      if  ((node.children.len() as i64)) > 0 {
        println!( "{}", format!("{}{}", indent, "  consequent:".to_string()) );
        for si in 0..node.children.len() {
          let mut stmt = node.children[si as usize].clone();
          ASTPrinter::printNode(stmt.clone(), depth + 2);
        }
      }
      return;
    }
    if  nodeType == "TryStatement".to_string() {
      println!( "{}", format!("{}{}", (format!("{}{}", indent, "TryStatement ".to_string())), loc) );
      println!( "{}", format!("{}{}", indent, "  block:".to_string()) );
      if  node.body.is_some() {
        ASTPrinter::printNode((*node.body.clone().unwrap()), depth + 2);
      }
      if  node.left.is_some() {
        println!( "{}", format!("{}{}", indent, "  handler:".to_string()) );
        ASTPrinter::printNode((*node.left.clone().unwrap()), depth + 2);
      }
      if  node.right.is_some() {
        println!( "{}", format!("{}{}", indent, "  finalizer:".to_string()) );
        ASTPrinter::printNode((*node.right.clone().unwrap()), depth + 2);
      }
      return;
    }
    if  nodeType == "CatchClause".to_string() {
      println!( "{}", format!("{}{}", (format!("{}{}", (format!("{}{}", (format!("{}{}", indent, "CatchClause: ".to_string())), node.name)), " ".to_string())), loc) );
      if  node.body.is_some() {
        ASTPrinter::printNode((*node.body.clone().unwrap()), depth + 1);
      }
      return;
    }
    if  nodeType == "ThrowStatement".to_string() {
      println!( "{}", format!("{}{}", (format!("{}{}", indent, "ThrowStatement ".to_string())), loc) );
      if  node.left.is_some() {
        ASTPrinter::printNode((*node.left.clone().unwrap()), depth + 1);
      }
      return;
    }
    if  nodeType == "BreakStatement".to_string() {
      if  (node.name.len() as i64) > 0 {
        println!( "{}", format!("{}{}", (format!("{}{}", (format!("{}{}", (format!("{}{}", indent, "BreakStatement: ".to_string())), node.name)), " ".to_string())), loc) );
      } else {
        println!( "{}", format!("{}{}", (format!("{}{}", indent, "BreakStatement ".to_string())), loc) );
      }
      return;
    }
    if  nodeType == "ContinueStatement".to_string() {
      if  (node.name.len() as i64) > 0 {
        println!( "{}", format!("{}{}", (format!("{}{}", (format!("{}{}", (format!("{}{}", indent, "ContinueStatement: ".to_string())), node.name)), " ".to_string())), loc) );
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
    let ind : String = self.getIndent();
    self.output = format!("{}{}", (format!("{}{}", (format!("{}{}", self.output, ind)), text)), "\n".to_string());
  }
  fn emitIndent(&mut self, ) -> () {
    let ind : String = self.getIndent();
    self.output = format!("{}{}", self.output, ind);
  }
  fn indent(&mut self, ) -> () {
    self.indentLevel = self.indentLevel + 1;
  }
  fn dedent(&mut self, ) -> () {
    self.indentLevel = self.indentLevel - 1;
  }
  fn printLeadingComments(&mut self, mut node : JSNode) -> () {
    let numComments : i64 = (node.leadingComments.len() as i64);
    if  numComments == 0 {
      return;
    }
    for i in 0..node.leadingComments.len() {
      let mut comment = node.leadingComments[i as usize].clone();
      self.printComment(comment.clone());
    }
  }
  fn printComment(&mut self, mut comment : JSNode) -> () {
    let commentType : String = comment.r#type.clone();
    let value : String = comment.raw.clone();
    if  commentType == "LineComment".to_string() {
      self.emitLine(format!("{}{}", "//".to_string(), value));
      return;
    }
    if  commentType == "BlockComment".to_string() {
      self.emitLine(format!("{}{}", (format!("{}{}", "/*".to_string(), value)), "*/".to_string()));
      return;
    }
    if  commentType == "JSDocComment".to_string() {
      self.printJSDocComment(value.clone());
      return;
    }
  }
  fn printJSDocComment(&mut self, value : String) -> () {
    self.emitLine(format!("{}{}", (format!("{}{}", "/*".to_string(), value)), "*/".to_string()));
  }
  fn print(&mut self, mut node : JSNode) -> String {
    self.output = "".to_string();
    self.indentLevel = 0;
    self.printNode(node.clone());
    return self.output.clone();
  }
  fn printNode(&mut self, mut node : JSNode) -> () {
    let nodeType : String = node.r#type.clone();
    if  nodeType == "Program".to_string() {
      self.printProgram(node.clone());
      return;
    }
    if  nodeType == "VariableDeclaration".to_string() {
      self.printVariableDeclaration(node.clone());
      return;
    }
    if  nodeType == "FunctionDeclaration".to_string() {
      self.printFunctionDeclaration(node.clone());
      return;
    }
    if  nodeType == "ClassDeclaration".to_string() {
      self.printClassDeclaration(node.clone());
      return;
    }
    if  nodeType == "ImportDeclaration".to_string() {
      self.printImportDeclaration(node.clone());
      return;
    }
    if  nodeType == "ExportNamedDeclaration".to_string() {
      self.printExportNamedDeclaration(node.clone());
      return;
    }
    if  nodeType == "ExportDefaultDeclaration".to_string() {
      self.printExportDefaultDeclaration(node.clone());
      return;
    }
    if  nodeType == "ExportAllDeclaration".to_string() {
      self.printExportAllDeclaration(node.clone());
      return;
    }
    if  nodeType == "BlockStatement".to_string() {
      self.printBlockStatement(node.clone());
      return;
    }
    if  nodeType == "ExpressionStatement".to_string() {
      self.printExpressionStatement(node.clone());
      return;
    }
    if  nodeType == "ReturnStatement".to_string() {
      self.printReturnStatement(node.clone());
      return;
    }
    if  nodeType == "IfStatement".to_string() {
      self.printIfStatement(node.clone());
      return;
    }
    if  nodeType == "WhileStatement".to_string() {
      self.printWhileStatement(node.clone());
      return;
    }
    if  nodeType == "DoWhileStatement".to_string() {
      self.printDoWhileStatement(node.clone());
      return;
    }
    if  nodeType == "ForStatement".to_string() {
      self.printForStatement(node.clone());
      return;
    }
    if  nodeType == "ForOfStatement".to_string() {
      self.printForOfStatement(node.clone());
      return;
    }
    if  nodeType == "ForInStatement".to_string() {
      self.printForInStatement(node.clone());
      return;
    }
    if  nodeType == "SwitchStatement".to_string() {
      self.printSwitchStatement(node.clone());
      return;
    }
    if  nodeType == "TryStatement".to_string() {
      self.printTryStatement(node.clone());
      return;
    }
    if  nodeType == "ThrowStatement".to_string() {
      self.printThrowStatement(node.clone());
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
      self.emit(node.name.clone());
      return;
    }
    if  nodeType == "Literal".to_string() {
      self.printLiteral(node.clone());
      return;
    }
    if  nodeType == "TemplateLiteral".to_string() {
      self.emit(format!("{}{}", (format!("{}{}", "`".to_string(), node.name)), "`".to_string()));
      return;
    }
    if  nodeType == "RegexLiteral".to_string() {
      self.emit(format!("{}{}", (format!("{}{}", (format!("{}{}", "/".to_string(), node.name)), "/".to_string())), node.kind));
      return;
    }
    if  nodeType == "ArrayExpression".to_string() {
      self.printArrayExpression(node.clone());
      return;
    }
    if  nodeType == "ObjectExpression".to_string() {
      self.printObjectExpression(node.clone());
      return;
    }
    if  nodeType == "BinaryExpression".to_string() {
      self.printBinaryExpression(node.clone());
      return;
    }
    if  nodeType == "LogicalExpression".to_string() {
      self.printBinaryExpression(node.clone());
      return;
    }
    if  nodeType == "UnaryExpression".to_string() {
      self.printUnaryExpression(node.clone());
      return;
    }
    if  nodeType == "UpdateExpression".to_string() {
      self.printUpdateExpression(node.clone());
      return;
    }
    if  nodeType == "AssignmentExpression".to_string() {
      self.printAssignmentExpression(node.clone());
      return;
    }
    if  nodeType == "ConditionalExpression".to_string() {
      self.printConditionalExpression(node.clone());
      return;
    }
    if  nodeType == "CallExpression".to_string() {
      self.printCallExpression(node.clone());
      return;
    }
    if  nodeType == "OptionalCallExpression".to_string() {
      self.printOptionalCallExpression(node.clone());
      return;
    }
    if  nodeType == "MemberExpression".to_string() {
      self.printMemberExpression(node.clone());
      return;
    }
    if  nodeType == "OptionalMemberExpression".to_string() {
      self.printOptionalMemberExpression(node.clone());
      return;
    }
    if  nodeType == "NewExpression".to_string() {
      self.printNewExpression(node.clone());
      return;
    }
    if  nodeType == "ArrowFunctionExpression".to_string() {
      self.printArrowFunction(node.clone());
      return;
    }
    if  nodeType == "FunctionExpression".to_string() {
      self.printFunctionExpression(node.clone());
      return;
    }
    if  nodeType == "YieldExpression".to_string() {
      self.printYieldExpression(node.clone());
      return;
    }
    if  nodeType == "AwaitExpression".to_string() {
      self.printAwaitExpression(node.clone());
      return;
    }
    if  nodeType == "SpreadElement".to_string() {
      self.printSpreadElement(node.clone());
      return;
    }
    if  nodeType == "RestElement".to_string() {
      self.emit(format!("{}{}", "...".to_string(), node.name));
      return;
    }
    if  nodeType == "ArrayPattern".to_string() {
      self.printArrayPattern(node.clone());
      return;
    }
    if  nodeType == "ObjectPattern".to_string() {
      self.printObjectPattern(node.clone());
      return;
    }
    self.emit(format!("{}{}", (format!("{}{}", "/* unknown: ".to_string(), nodeType)), " */".to_string()));
  }
  fn printProgram(&mut self, mut node : JSNode) -> () {
    for idx in 0..node.children.len() {
      let mut stmt = node.children[idx as usize].clone();
      self.printStatement(stmt.clone());
    }
  }
  fn printStatement(&mut self, mut node : JSNode) -> () {
    self.printLeadingComments(node.clone());
    let nodeType : String = node.r#type.clone();
    if  nodeType == "BlockStatement".to_string() {
      self.printBlockStatement(node.clone());
      return;
    }
    if  (((((((((nodeType == "FunctionDeclaration".to_string()) || (nodeType == "ClassDeclaration".to_string())) || (nodeType == "IfStatement".to_string())) || (nodeType == "WhileStatement".to_string())) || (nodeType == "DoWhileStatement".to_string())) || (nodeType == "ForStatement".to_string())) || (nodeType == "ForOfStatement".to_string())) || (nodeType == "ForInStatement".to_string())) || (nodeType == "SwitchStatement".to_string())) || (nodeType == "TryStatement".to_string()) {
      self.emitIndent();
      self.printNode(node.clone());
      self.emit("\n".to_string());
      return;
    }
    self.emitIndent();
    self.printNode(node.clone());
    self.emit(";\n".to_string());
  }
  fn printVariableDeclaration(&mut self, mut node : JSNode) -> () {
    let mut kind : String = node.name.clone();
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
      self.printVariableDeclarator(decl.clone());
    }
  }
  fn printVariableDeclarator(&mut self, mut node : JSNode) -> () {
    if  node.left.is_some() {
      let mut left : JSNode = (*node.left.clone().unwrap());
      self.printNode(left.clone());
    }
    if  node.right.is_some() {
      self.emit(" = ".to_string());
      self.printNode((*node.right.clone().unwrap()));
    }
  }
  fn printFunctionDeclaration(&mut self, mut node : JSNode) -> () {
    let kind : String = node.kind.clone();
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
    self.emit(format!("{}{}", (format!("{}{}", " ".to_string(), node.name)), "(".to_string()));
    self.printParams(node.children);
    self.emit(") ".to_string());
    if  node.body.is_some() {
      self.printNode((*node.body.clone().unwrap()));
    }
  }
  fn printParams(&mut self, mut params : Vec<JSNode>) -> () {
    let mut first : bool = true;
    for idx in 0..params.len() {
      let mut p = params[idx as usize].clone();
      if  first == false {
        self.emit(", ".to_string());
      }
      first = false;
      self.printNode(p.clone());
    }
  }
  fn printClassDeclaration(&mut self, mut node : JSNode) -> () {
    self.emit(format!("{}{}", "class ".to_string(), node.name));
    if  node.left.is_some() {
      let mut superClass : JSNode = (*node.left.clone().unwrap());
      self.emit(format!("{}{}", " extends ".to_string(), superClass.name));
    }
    self.emit(" ".to_string());
    if  node.body.is_some() {
      self.printClassBody((*node.body.clone().unwrap()));
    }
  }
  fn printClassBody(&mut self, mut node : JSNode) -> () {
    self.emit("{\n".to_string());
    self.indent();
    for idx in 0..node.children.len() {
      let mut method = node.children[idx as usize].clone();
      self.printMethodDefinition(method.clone());
    }
    self.dedent();
    self.emitIndent();
    self.emit("}".to_string());
  }
  fn printMethodDefinition(&mut self, mut node : JSNode) -> () {
    self.emitIndent();
    if  node.kind == "static".to_string() {
      self.emit("static ".to_string());
    }
    self.emit(format!("{}{}", node.name, "(".to_string()));
    if  node.body.is_some() {
      let mut _func : JSNode = (*node.body.clone().unwrap());
      self.printParams(_func.children);
    }
    self.emit(") ".to_string());
    if  node.body.is_some() {
      let mut func_1 : JSNode = (*node.body.clone().unwrap());
      if  func_1.body.is_some() {
        self.printNode((*func_1.body.clone().unwrap()));
      }
    }
    self.emit("\n".to_string());
  }
  fn printBlockStatement(&mut self, mut node : JSNode) -> () {
    self.emit("{\n".to_string());
    self.indent();
    for idx in 0..node.children.len() {
      let mut stmt = node.children[idx as usize].clone();
      self.printStatement(stmt.clone());
    }
    self.dedent();
    self.emitIndent();
    self.emit("}".to_string());
  }
  fn printExpressionStatement(&mut self, mut node : JSNode) -> () {
    if  node.left.is_some() {
      self.printNode((*node.left.clone().unwrap()));
    }
  }
  fn printReturnStatement(&mut self, mut node : JSNode) -> () {
    self.emit("return".to_string());
    if  node.left.is_some() {
      self.emit(" ".to_string());
      self.printNode((*node.left.clone().unwrap()));
    }
  }
  fn printIfStatement(&mut self, mut node : JSNode) -> () {
    self.emit("if (".to_string());
    if  node.test.is_some() {
      self.printNode((*node.test.clone().unwrap()));
    }
    self.emit(") ".to_string());
    if  node.body.is_some() {
      self.printNode((*node.body.clone().unwrap()));
    }
    if  node.alternate.is_some() {
      self.emit(" else ".to_string());
      self.printNode((*node.alternate.clone().unwrap()));
    }
  }
  fn printWhileStatement(&mut self, mut node : JSNode) -> () {
    self.emit("while (".to_string());
    if  node.test.is_some() {
      self.printNode((*node.test.clone().unwrap()));
    }
    self.emit(") ".to_string());
    if  node.body.is_some() {
      self.printNode((*node.body.clone().unwrap()));
    }
  }
  fn printDoWhileStatement(&mut self, mut node : JSNode) -> () {
    self.emit("do ".to_string());
    if  node.body.is_some() {
      self.printNode((*node.body.clone().unwrap()));
    }
    self.emit(" while (".to_string());
    if  node.test.is_some() {
      self.printNode((*node.test.clone().unwrap()));
    }
    self.emit(")".to_string());
  }
  fn printForStatement(&mut self, mut node : JSNode) -> () {
    self.emit("for (".to_string());
    if  node.left.is_some() {
      self.printNode((*node.left.clone().unwrap()));
    }
    self.emit("; ".to_string());
    if  node.test.is_some() {
      self.printNode((*node.test.clone().unwrap()));
    }
    self.emit("; ".to_string());
    if  node.right.is_some() {
      self.printNode((*node.right.clone().unwrap()));
    }
    self.emit(") ".to_string());
    if  node.body.is_some() {
      self.printNode((*node.body.clone().unwrap()));
    }
  }
  fn printForOfStatement(&mut self, mut node : JSNode) -> () {
    self.emit("for (".to_string());
    if  node.left.is_some() {
      self.printNode((*node.left.clone().unwrap()));
    }
    self.emit(" of ".to_string());
    if  node.right.is_some() {
      self.printNode((*node.right.clone().unwrap()));
    }
    self.emit(") ".to_string());
    if  node.body.is_some() {
      self.printNode((*node.body.clone().unwrap()));
    }
  }
  fn printForInStatement(&mut self, mut node : JSNode) -> () {
    self.emit("for (".to_string());
    if  node.left.is_some() {
      self.printNode((*node.left.clone().unwrap()));
    }
    self.emit(" in ".to_string());
    if  node.right.is_some() {
      self.printNode((*node.right.clone().unwrap()));
    }
    self.emit(") ".to_string());
    if  node.body.is_some() {
      self.printNode((*node.body.clone().unwrap()));
    }
  }
  fn printSwitchStatement(&mut self, mut node : JSNode) -> () {
    self.emit("switch (".to_string());
    if  node.test.is_some() {
      self.printNode((*node.test.clone().unwrap()));
    }
    self.emit(") {\n".to_string());
    self.indent();
    for idx in 0..node.children.len() {
      let mut caseNode = node.children[idx as usize].clone();
      self.printSwitchCase(caseNode.clone());
    }
    self.dedent();
    self.emitIndent();
    self.emit("}".to_string());
  }
  fn printSwitchCase(&mut self, mut node : JSNode) -> () {
    if  node.name == "default".to_string() {
      self.emitLine("default:".to_string());
    } else {
      self.emitIndent();
      self.emit("case ".to_string());
      if  node.test.is_some() {
        self.printNode((*node.test.clone().unwrap()));
      }
      self.emit(":\n".to_string());
    }
    self.indent();
    for idx in 0..node.children.len() {
      let mut stmt = node.children[idx as usize].clone();
      self.printStatement(stmt.clone());
    }
    self.dedent();
  }
  fn printTryStatement(&mut self, mut node : JSNode) -> () {
    self.emit("try ".to_string());
    if  node.body.is_some() {
      self.printNode((*node.body.clone().unwrap()));
    }
    if  node.left.is_some() {
      let mut catchClause : JSNode = (*node.left.clone().unwrap());
      self.emit(format!("{}{}", (format!("{}{}", " catch (".to_string(), catchClause.name)), ") ".to_string()));
      if  catchClause.body.is_some() {
        self.printNode((*catchClause.body.clone().unwrap()));
      }
    }
    if  node.right.is_some() {
      self.emit(" finally ".to_string());
      self.printNode((*node.right.clone().unwrap()));
    }
  }
  fn printThrowStatement(&mut self, mut node : JSNode) -> () {
    self.emit("throw ".to_string());
    if  node.left.is_some() {
      self.printNode((*node.left.clone().unwrap()));
    }
  }
  fn printLiteral(&mut self, mut node : JSNode) -> () {
    let litType : String = node.kind.clone();
    if  litType == "string".to_string() {
      self.emit(format!("{}{}", (format!("{}{}", "'".to_string(), node.name)), "'".to_string()));
    } else {
      self.emit(node.name.clone());
    }
  }
  fn printArrayExpression(&mut self, mut node : JSNode) -> () {
    self.emit("[".to_string());
    let mut first : bool = true;
    for idx in 0..node.children.len() {
      let mut elem = node.children[idx as usize].clone();
      if  first == false {
        self.emit(", ".to_string());
      }
      first = false;
      self.printNode(elem.clone());
    }
    self.emit("]".to_string());
  }
  fn printObjectExpression(&mut self, mut node : JSNode) -> () {
    if  ((node.children.len() as i64)) == 0 {
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
      self.printProperty(prop.clone());
    }
    self.emit(" }".to_string());
  }
  fn printProperty(&mut self, mut node : JSNode) -> () {
    let nodeType : String = node.r#type.clone();
    if  nodeType == "SpreadElement".to_string() {
      self.printSpreadElement(node.clone());
      return;
    }
    if  node.kind == "shorthand".to_string() {
      self.emit(node.name.clone());
      return;
    }
    if  node.kind == "computed".to_string() {
      self.emit("[".to_string());
      if  node.right.is_some() {
        self.printNode((*node.right.clone().unwrap()));
      }
      self.emit("]: ".to_string());
      if  node.left.is_some() {
        self.printNode((*node.left.clone().unwrap()));
      }
      return;
    }
    self.emit(format!("{}{}", node.name, ": ".to_string()));
    if  node.left.is_some() {
      self.printNode((*node.left.clone().unwrap()));
    }
  }
  fn printBinaryExpression(&mut self, mut node : JSNode) -> () {
    self.emit("(".to_string());
    if  node.left.is_some() {
      self.printNode((*node.left.clone().unwrap()));
    }
    self.emit(format!("{}{}", (format!("{}{}", " ".to_string(), node.name)), " ".to_string()));
    if  node.right.is_some() {
      self.printNode((*node.right.clone().unwrap()));
    }
    self.emit(")".to_string());
  }
  fn printUnaryExpression(&mut self, mut node : JSNode) -> () {
    let op : String = node.name.clone();
    self.emit(op.clone());
    if  op == "typeof".to_string() {
      self.emit(" ".to_string());
    }
    if  node.left.is_some() {
      self.printNode((*node.left.clone().unwrap()));
    }
  }
  fn printUpdateExpression(&mut self, mut node : JSNode) -> () {
    let op : String = node.name.clone();
    let isPrefix : bool = node.kind == "prefix".to_string();
    if  isPrefix {
      self.emit(op.clone());
    }
    if  node.left.is_some() {
      self.printNode((*node.left.clone().unwrap()));
    }
    if  isPrefix == false {
      self.emit(op.clone());
    }
  }
  fn printAssignmentExpression(&mut self, mut node : JSNode) -> () {
    if  node.left.is_some() {
      self.printNode((*node.left.clone().unwrap()));
    }
    self.emit(format!("{}{}", (format!("{}{}", " ".to_string(), node.name)), " ".to_string()));
    if  node.right.is_some() {
      self.printNode((*node.right.clone().unwrap()));
    }
  }
  fn printConditionalExpression(&mut self, mut node : JSNode) -> () {
    if  node.left.is_some() {
      self.printNode((*node.left.clone().unwrap()));
    }
    self.emit(" ? ".to_string());
    if  node.body.is_some() {
      self.printNode((*node.body.clone().unwrap()));
    }
    self.emit(" : ".to_string());
    if  node.right.is_some() {
      self.printNode((*node.right.clone().unwrap()));
    }
  }
  fn printCallExpression(&mut self, mut node : JSNode) -> () {
    if  node.left.is_some() {
      self.printNode((*node.left.clone().unwrap()));
    }
    self.emit("(".to_string());
    let mut first : bool = true;
    for idx in 0..node.children.len() {
      let mut arg = node.children[idx as usize].clone();
      if  first == false {
        self.emit(", ".to_string());
      }
      first = false;
      self.printNode(arg.clone());
    }
    self.emit(")".to_string());
  }
  fn printMemberExpression(&mut self, mut node : JSNode) -> () {
    if  node.left.is_some() {
      self.printNode((*node.left.clone().unwrap()));
    }
    let accessType : String = node.kind.clone();
    if  accessType == "bracket".to_string() {
      self.emit("[".to_string());
      if  node.right.is_some() {
        self.printNode((*node.right.clone().unwrap()));
      }
      self.emit("]".to_string());
    } else {
      self.emit(format!("{}{}", ".".to_string(), node.name));
    }
  }
  fn printOptionalMemberExpression(&mut self, mut node : JSNode) -> () {
    if  node.left.is_some() {
      self.printNode((*node.left.clone().unwrap()));
    }
    let accessType : String = node.kind.clone();
    if  accessType == "bracket".to_string() {
      self.emit("?.[".to_string());
      if  node.right.is_some() {
        self.printNode((*node.right.clone().unwrap()));
      }
      self.emit("]".to_string());
    } else {
      self.emit(format!("{}{}", "?.".to_string(), node.name));
    }
  }
  fn printOptionalCallExpression(&mut self, mut node : JSNode) -> () {
    if  node.left.is_some() {
      self.printNode((*node.left.clone().unwrap()));
    }
    self.emit("?.(".to_string());
    let mut first : bool = true;
    for idx in 0..node.children.len() {
      let mut arg = node.children[idx as usize].clone();
      if  first == false {
        self.emit(", ".to_string());
      }
      first = false;
      self.printNode(arg.clone());
    }
    self.emit(")".to_string());
  }
  fn printImportDeclaration(&mut self, mut node : JSNode) -> () {
    self.emit("import ".to_string());
    let numSpecifiers : i64 = (node.children.len() as i64);
    if  numSpecifiers == 0 {
      if  node.right.is_some() {
        let mut source : JSNode = (*node.right.clone().unwrap());
        self.emit(format!("{}{}", (format!("{}{}", "\"".to_string(), source.raw)), "\"".to_string()));
      }
      return;
    }
    let mut hasDefault : bool = false;
    let mut hasNamespace : bool = false;
    let mut hasNamed : bool = false;
    for idx in 0..node.children.len() {
      let mut spec = node.children[idx as usize].clone();
      if  spec.r#type == "ImportDefaultSpecifier".to_string() {
        hasDefault = true;
      }
      if  spec.r#type == "ImportNamespaceSpecifier".to_string() {
        hasNamespace = true;
      }
      if  spec.r#type == "ImportSpecifier".to_string() {
        hasNamed = true;
      }
    }
    let mut printedSomething : bool = false;
    for idx_1 in 0..node.children.len() {
      let mut spec_1 = node.children[idx_1 as usize].clone();
      if  spec_1.r#type == "ImportDefaultSpecifier".to_string() {
        self.emit(spec_1.name.clone());
        printedSomething = true;
      }
    }
    for idx_2 in 0..node.children.len() {
      let mut spec_2 = node.children[idx_2 as usize].clone();
      if  spec_2.r#type == "ImportNamespaceSpecifier".to_string() {
        if  printedSomething {
          self.emit(", ".to_string());
        }
        self.emit(format!("{}{}", "* as ".to_string(), spec_2.name));
        printedSomething = true;
      }
    }
    if  hasNamed {
      if  printedSomething {
        self.emit(", ".to_string());
      }
      self.emit("{ ".to_string());
      let mut firstNamed : bool = true;
      for idx_3 in 0..node.children.len() {
        let mut spec_3 = node.children[idx_3 as usize].clone();
        if  spec_3.r#type == "ImportSpecifier".to_string() {
          if  firstNamed == false {
            self.emit(", ".to_string());
          }
          firstNamed = false;
          self.emit(spec_3.name.clone());
          if  (spec_3.kind.len() as i64) > 0 {
            self.emit(format!("{}{}", " as ".to_string(), spec_3.kind));
          }
        }
      }
      self.emit(" }".to_string());
    }
    self.emit(" from ".to_string());
    if  node.right.is_some() {
      let mut source_1 : JSNode = (*node.right.clone().unwrap());
      self.emit(format!("{}{}", (format!("{}{}", "\"".to_string(), source_1.raw)), "\"".to_string()));
    }
  }
  fn printExportNamedDeclaration(&mut self, mut node : JSNode) -> () {
    self.emit("export ".to_string());
    let numSpecifiers : i64 = (node.children.len() as i64);
    if  numSpecifiers > 0 {
      self.emit("{ ".to_string());
      let mut first : bool = true;
      for idx in 0..node.children.len() {
        let mut spec = node.children[idx as usize].clone();
        if  first == false {
          self.emit(", ".to_string());
        }
        first = false;
        self.emit(spec.name.clone());
        if  (spec.kind.len() as i64) > 0 {
          self.emit(format!("{}{}", " as ".to_string(), spec.kind));
        }
      }
      self.emit(" }".to_string());
      if  node.right.is_some() {
        let mut source : JSNode = (*node.right.clone().unwrap());
        self.emit(format!("{}{}", (format!("{}{}", " from \"".to_string(), source.raw)), "\"".to_string()));
      }
      return;
    }
    if  node.left.is_some() {
      self.printNode((*node.left.clone().unwrap()));
    }
  }
  fn printExportDefaultDeclaration(&mut self, mut node : JSNode) -> () {
    self.emit("export default ".to_string());
    if  node.left.is_some() {
      self.printNode((*node.left.clone().unwrap()));
    }
  }
  fn printExportAllDeclaration(&mut self, mut node : JSNode) -> () {
    self.emit("export *".to_string());
    if  (node.name.len() as i64) > 0 {
      self.emit(format!("{}{}", " as ".to_string(), node.name));
    }
    self.emit(" from ".to_string());
    if  node.right.is_some() {
      let mut source : JSNode = (*node.right.clone().unwrap());
      self.emit(format!("{}{}", (format!("{}{}", "\"".to_string(), source.raw)), "\"".to_string()));
    }
  }
  fn printNewExpression(&mut self, mut node : JSNode) -> () {
    self.emit("new ".to_string());
    if  node.left.is_some() {
      self.printNode((*node.left.clone().unwrap()));
    }
    self.emit("(".to_string());
    let mut first : bool = true;
    for idx in 0..node.children.len() {
      let mut arg = node.children[idx as usize].clone();
      if  first == false {
        self.emit(", ".to_string());
      }
      first = false;
      self.printNode(arg.clone());
    }
    self.emit(")".to_string());
  }
  fn printArrowFunction(&mut self, mut node : JSNode) -> () {
    if  node.kind == "async".to_string() {
      self.emit("async ".to_string());
    }
    let paramCount : i64 = (node.children.len() as i64);
    if  paramCount == 1 {
      let mut firstParam : JSNode = node.children[0 as usize].clone();
      if  firstParam.r#type == "Identifier".to_string() {
        self.emit(firstParam.name.clone());
      } else {
        self.emit("(".to_string());
        self.printNode(firstParam.clone());
        self.emit(")".to_string());
      }
    } else {
      self.emit("(".to_string());
      self.printParams(node.children);
      self.emit(")".to_string());
    }
    self.emit(" => ".to_string());
    if  node.body.is_some() {
      let mut body : JSNode = (*node.body.clone().unwrap());
      if  body.r#type == "BlockStatement".to_string() {
        self.printNode(body.clone());
      } else {
        self.printNode(body.clone());
      }
    }
  }
  fn printFunctionExpression(&mut self, mut node : JSNode) -> () {
    self.emit("function(".to_string());
    self.printParams(node.children);
    self.emit(") ".to_string());
    if  node.body.is_some() {
      self.printNode((*node.body.clone().unwrap()));
    }
  }
  fn printYieldExpression(&mut self, mut node : JSNode) -> () {
    self.emit("yield".to_string());
    if  node.name == "delegate".to_string() {
      self.emit("*".to_string());
    }
    if  node.left.is_some() {
      self.emit(" ".to_string());
      self.printNode((*node.left.clone().unwrap()));
    }
  }
  fn printAwaitExpression(&mut self, mut node : JSNode) -> () {
    self.emit("await ".to_string());
    if  node.left.is_some() {
      self.printNode((*node.left.clone().unwrap()));
    }
  }
  fn printSpreadElement(&mut self, mut node : JSNode) -> () {
    self.emit("...".to_string());
    if  node.left.is_some() {
      self.printNode((*node.left.clone().unwrap()));
    }
  }
  fn printArrayPattern(&mut self, mut node : JSNode) -> () {
    self.emit("[".to_string());
    let mut first : bool = true;
    for idx in 0..node.children.len() {
      let mut elem = node.children[idx as usize].clone();
      if  first == false {
        self.emit(", ".to_string());
      }
      first = false;
      self.printNode(elem.clone());
    }
    self.emit("]".to_string());
  }
  fn printObjectPattern(&mut self, mut node : JSNode) -> () {
    self.emit("{ ".to_string());
    let mut first : bool = true;
    for idx in 0..node.children.len() {
      let mut prop = node.children[idx as usize].clone();
      if  first == false {
        self.emit(", ".to_string());
      }
      first = false;
      let propType : String = prop.r#type.clone();
      if  propType == "RestElement".to_string() {
        self.emit(format!("{}{}", "...".to_string(), prop.name));
      } else {
        if  prop.kind == "shorthand".to_string() {
          self.emit(prop.name.clone());
        } else {
          self.emit(format!("{}{}", prop.name, ": ".to_string()));
          if  prop.left.is_some() {
            self.printNode((*prop.left.clone().unwrap()));
          }
        }
      }
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
    if  codeOpt.is_none() {
      println!( "{}", format!("{}{}", "Error: Could not read file: ".to_string(), inputFile) );
      return;
    }
    let code : String = codeOpt.unwrap();
    let mut lexer : Lexer = Lexer::new(code.clone());
    let mut tokens : Vec<Token> = lexer.tokenize();
    let mut parser : SimpleParser = SimpleParser::new();
    parser.initParserWithSource(tokens, code.clone());
    let mut program : JSNode = parser.parseProgram();
    if  parser.hasErrors() {
      println!( "{}", "=== Parse Errors ===".to_string() );
      for ei in 0..parser.errors.len() {
        let mut err = parser.errors[ei as usize].clone();
        println!( "{}", err );
      }
      println!( "{}", "".to_string() );
    }
    let mut printer : JSPrinter = JSPrinter::new();
    let stmtCount : i64 = (program.children.len() as i64);
    let output : String = (printer).print(program);
    r_write_file(&".".to_string(), &outputFile, &output);
    println!( "{}", format!("{}{}", (format!("{}{}", (format!("{}{}", "Parsed ".to_string(), inputFile)), " -> ".to_string())), outputFile) );
    println!( "{}", format!("{}{}", (["  ".to_string() , (stmtCount.to_string()) ].join("")), " statements processed".to_string()) );
  }
  pub fn parseFile(filename : String) -> () {
    let codeOpt : Option<String> = r_read_file(&".".to_string(), &filename);
    if  codeOpt.is_none() {
      println!( "{}", format!("{}{}", "Error: Could not read file: ".to_string(), filename) );
      return;
    }
    let code : String = codeOpt.unwrap();
    let mut lexer : Lexer = Lexer::new(code.clone());
    let mut tokens : Vec<Token> = lexer.tokenize();
    let mut parser : SimpleParser = SimpleParser::new();
    parser.initParserWithSource(tokens, code.clone());
    let mut program : JSNode = parser.parseProgram();
    if  parser.hasErrors() {
      println!( "{}", "=== Parse Errors ===".to_string() );
      for ei in 0..parser.errors.len() {
        let mut err = parser.errors[ei as usize].clone();
        println!( "{}", err );
      }
      println!( "{}", "".to_string() );
    }
    println!( "{}", format!("{}{}", (["Program with ".to_string() , (((program.children.len() as i64)).to_string()) ].join("")), " statements:".to_string()) );
    println!( "{}", "".to_string() );
    for idx in 0..program.children.len() {
      let mut stmt = program.children[idx as usize].clone();
      ASTPrinter::printNode(stmt.clone(), 0);
    }
  }
  pub fn runDemo() -> () {
    let code : String = "// Variable declarations\r\nvar y = 'hello';\r\n\r\n// Function declaration\r\nfunction add(a, b) {\r\n    return a + b;\r\n}\r\n\r\n// While loop\r\nvar i = 0;\r\nwhile (i < 10) {\r\n    i = i + 1;\r\n}\r\n\r\n// Do-while loop\r\ndo {\r\n    i = i - 1;\r\n} while (i > 0);\r\n\r\n// For loop\r\nfor (var j = 0; j < 5; j = j + 1) {\r\n    x = x + j;\r\n}\r\n\r\n// Switch statement\r\nswitch (x) {\r\n    case 1:\r\n        y = 'one';\r\n        break;\r\n    case 2:\r\n        y = 'two';\r\n        break;\r\n    default:\r\n        y = 'other';\r\n}\r\n\r\n// Try-catch-finally\r\ntry {\r\n    throw 'error';\r\n} catch (e) {\r\n    y = e;\r\n} finally {\r\n    x = 0;\r\n}\r\n\r\n// If-else\r\nif (x > 100) {\r\n    y = 'big';\r\n} else {\r\n    y = 'small';\r\n}\r\n\r\nvar arr = [1, 2, 3];\r\nvar obj = { name: 'test', value: 42 };\r\n\r\n// Unary expressions\r\nvar negNum = -42;\r\nvar posNum = +5;\r\nvar notTrue = !true;\r\nvar notFalse = !false;\r\nvar doubleNot = !!x;\r\nvar negExpr = -(a + b);\r\n\r\n// Logical expressions\r\nvar andResult = true && false;\r\nvar orResult = true || false;\r\nvar complexLogic = (a > 0) && (b < 10) || (c == 5);\r\nvar shortCircuit = x && y && z;\r\nvar orChain = a || b || c;\r\n\r\n// Ternary expressions\r\nvar ternResult = x > 0 ? 'positive' : 'non-positive';\r\nvar nestedTern = a > b ? (b > c ? 'a>b>c' : 'a>b, b<=c') : 'a<=b';\r\nvar ternInExpr = 1 + (x ? 2 : 3);\r\n\r\n// Operator precedence tests\r\nvar prec1 = 1 + 2 * 3;\r\nvar prec2 = (1 + 2) * 3;\r\nvar prec3 = 1 + 2 + 3 + 4;\r\nvar prec4 = 2 * 3 + 4 * 5;\r\nvar prec5 = 1 < 2 && 3 > 1;\r\nvar prec6 = !x && y || z;\r\nvar prec7 = a == b && c != d;\r\nvar prec8 = -x + y * -z;\r\n\r\n// Comparison operators\r\nvar cmp1 = a == b;\r\nvar cmp2 = a != b;\r\nvar cmp3 = a < b;\r\nvar cmp4 = a <= b;\r\nvar cmp5 = a > b;\r\nvar cmp6 = a >= b;\r\n\r\n// === ES6 Features ===\r\n\r\n// let and const\r\nlet count = 0;\r\nconst PI = 3.14159;\r\n\r\n// Arrow functions\r\nconst add = (a, b) => a + b;\r\nconst double = x => x * 2;\r\nconst greet = (name) => {\r\n    return 'Hello, ' + name;\r\n};\r\nconst multiLine = (a, b) => {\r\n    let sum = a + b;\r\n    return sum * 2;\r\n};\r\n\r\n// Template literals\r\nlet name = 'World';\r\nlet greeting = `Hello, ${name}!`;\r\nlet multi = `Line 1\r\nLine 2`;\r\n\r\n// Class syntax\r\nclass Animal {\r\n    constructor(name) {\r\n        this.name = name;\r\n    }\r\n    \r\n    speak() {\r\n        return this.name + ' makes a sound';\r\n    }\r\n    \r\n    static create(name) {\r\n        return new Animal(name);\r\n    }\r\n}\r\n\r\nclass Dog extends Animal {\r\n    constructor(name, breed) {\r\n        super(name);\r\n        this.breed = breed;\r\n    }\r\n    \r\n    speak() {\r\n        return this.name + ' barks';\r\n    }\r\n}\r\n\r\n// Generator functions\r\nfunction* numberGenerator() {\r\n    yield 1;\r\n    yield 2;\r\n    yield 3;\r\n}\r\n\r\nfunction* delegateGenerator() {\r\n    yield* numberGenerator();\r\n    yield 4;\r\n}\r\n\r\n// Async/await\r\nasync function fetchData() {\r\n    const response = await fetch('/api/data');\r\n    const data = await response.json();\r\n    return data;\r\n}\r\n\r\nasync function processItems(items) {\r\n    for (const item of items) {\r\n        await processItem(item);\r\n    }\r\n}\r\n\r\n// Async arrow functions\r\nconst asyncArrow = async (x) => {\r\n    const result = await doSomething(x);\r\n    return result * 2;\r\n};\r\n\r\nconst asyncFetch = async (url) => await fetch(url);\r\n\r\n// Async generator (ES2018)\r\nasync function* asyncGenerator() {\r\n    yield await fetch('/api/1');\r\n    yield await fetch('/api/2');\r\n}\r\n\r\n// === for...of and for...in loops ===\r\n\r\n// For-of loop\r\nfor (const item of items) {\r\n    console.log(item);\r\n}\r\n\r\n// For-in loop\r\nfor (const key in obj) {\r\n    console.log(key);\r\n}\r\n\r\n// For-of with array destructuring\r\nfor (const [index, value] of entries) {\r\n    console.log(index, value);\r\n}\r\n\r\n// === Spread operator ===\r\n\r\n// Array spread\r\nconst arr1 = [1, 2, 3];\r\nconst arr2 = [...arr1, 4, 5];\r\nconst combined = [...arr1, ...arr2];\r\n\r\n// Object spread\r\nconst obj1 = { a: 1, b: 2 };\r\nconst obj2 = { ...obj1, c: 3 };\r\nconst merged = { ...obj1, ...obj2 };\r\n\r\n// Spread in function call\r\nconsole.log(...args);\r\n\r\n// === Rest parameters ===\r\n\r\nfunction sum(...numbers) {\r\n    return numbers.reduce((a, b) => a + b);\r\n}\r\n\r\nfunction firstAndRest(first, ...rest) {\r\n    return { first, rest };\r\n}\r\n\r\n// === Destructuring ===\r\n\r\n// Array destructuring\r\nconst [x, y, z] = [1, 2, 3];\r\nconst [first, ...others] = arr1;\r\nlet [a, b] = [b, a];\r\n\r\n// Object destructuring\r\nconst { name, age } = person;\r\nconst { x: newX, y: newY } = point;\r\nconst { a: { b: nested } } = deep;\r\n\r\n// Destructuring with default (parsed as identifier for now)\r\nconst { foo, bar } = obj;\r\n\r\n// Nested destructuring\r\nconst { user: { name: userName } } = data;\r\nconst [{ id }, { id: id2 }] = items;\r\n\r\n// Shorthand properties\r\nconst shorthand = { x, y, z };\r\n".to_string();
    println!( "{}", "=== JavaScript ES6 Parser ===".to_string() );
    println!( "{}", "".to_string() );
    println!( "{}", "Input:".to_string() );
    println!( "{}", code );
    println!( "{}", "".to_string() );
    let mut lexer : Lexer = Lexer::new(code.clone());
    let mut tokens : Vec<Token> = lexer.tokenize();
    println!( "{}", format!("{}{}", (["--- Tokens: ".to_string() , (((tokens.len() as i64)).to_string()) ].join("")), " ---".to_string()) );
    println!( "{}", "".to_string() );
    let mut parser : SimpleParser = SimpleParser::new();
    parser.initParserWithSource(tokens, code.clone());
    let mut program : JSNode = parser.parseProgram();
    if  parser.hasErrors() {
      println!( "{}", "=== Parse Errors ===".to_string() );
      for ei in 0..parser.errors.len() {
        let mut err = parser.errors[ei as usize].clone();
        println!( "{}", err );
      }
      println!( "{}", "".to_string() );
    }
    println!( "{}", format!("{}{}", (["Program with ".to_string() , (((program.children.len() as i64)).to_string()) ].join("")), " statements:".to_string()) );
    println!( "{}", "".to_string() );
    println!( "{}", "--- AST ---".to_string() );
    for idx in 0..program.children.len() {
      let mut stmt = program.children[idx as usize].clone();
      ASTPrinter::printNode(stmt.clone(), 0);
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
      JSParserMain::processFile(inputFile.clone(), outputFile.clone());
    } else {
      JSParserMain::parseFile(inputFile.clone());
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

