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
struct TSLexer { 
  source : String, 
  pos : i64, 
  line : i64, 
  col : i64, 
  __len : i64, 
}
impl TSLexer { 
  
  pub fn new(src : String) ->  TSLexer {
    let mut me = TSLexer { 
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
    while self.pos < self.__len {
      let ch : String = self.peek();
      if  ch == "*".to_string() {
        if  self.peekAt(1) == "/".to_string() {
          self.advance();
          self.advance();
          return self.makeToken("BlockComment".to_string(), value.clone(), startPos, startLine, startCol).clone();
        }
      }
      value = format!("{}{}", value, self.advance());
    }
    return self.makeToken("BlockComment".to_string(), value.clone(), startPos, startLine, startCol).clone();
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
    while self.pos < self.__len {
      let ch : String = self.peek();
      if  ch == "`".to_string() {
        self.advance();
        return self.makeToken("Template".to_string(), value.clone(), startPos, startLine, startCol).clone();
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
            if  esc == "`".to_string() {
              value = format!("{}{}", value, "`".to_string());
            } else {
              if  esc == "$".to_string() {
                value = format!("{}{}", value, "$".to_string());
              } else {
                value = format!("{}{}", value, esc);
              }
            }
          }
        }
      } else {
        value = format!("{}{}", value, self.advance());
      }
    }
    return self.makeToken("Template".to_string(), value.clone(), startPos, startLine, startCol).clone();
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
    if  value == "delete".to_string() {
      return "Keyword".to_string().clone();
    }
    if  value == "void".to_string() {
      return "Keyword".to_string().clone();
    }
    if  value == "type".to_string() {
      return "TSKeyword".to_string().clone();
    }
    if  value == "interface".to_string() {
      return "TSKeyword".to_string().clone();
    }
    if  value == "namespace".to_string() {
      return "TSKeyword".to_string().clone();
    }
    if  value == "module".to_string() {
      return "TSKeyword".to_string().clone();
    }
    if  value == "declare".to_string() {
      return "TSKeyword".to_string().clone();
    }
    if  value == "readonly".to_string() {
      return "TSKeyword".to_string().clone();
    }
    if  value == "abstract".to_string() {
      return "TSKeyword".to_string().clone();
    }
    if  value == "implements".to_string() {
      return "TSKeyword".to_string().clone();
    }
    if  value == "private".to_string() {
      return "TSKeyword".to_string().clone();
    }
    if  value == "protected".to_string() {
      return "TSKeyword".to_string().clone();
    }
    if  value == "public".to_string() {
      return "TSKeyword".to_string().clone();
    }
    if  value == "override".to_string() {
      return "TSKeyword".to_string().clone();
    }
    if  value == "is".to_string() {
      return "TSKeyword".to_string().clone();
    }
    if  value == "keyof".to_string() {
      return "TSKeyword".to_string().clone();
    }
    if  value == "infer".to_string() {
      return "TSKeyword".to_string().clone();
    }
    if  value == "asserts".to_string() {
      return "TSKeyword".to_string().clone();
    }
    if  value == "satisfies".to_string() {
      return "TSKeyword".to_string().clone();
    }
    if  value == "string".to_string() {
      return "TSType".to_string().clone();
    }
    if  value == "number".to_string() {
      return "TSType".to_string().clone();
    }
    if  value == "boolean".to_string() {
      return "TSType".to_string().clone();
    }
    if  value == "any".to_string() {
      return "TSType".to_string().clone();
    }
    if  value == "unknown".to_string() {
      return "TSType".to_string().clone();
    }
    if  value == "never".to_string() {
      return "TSType".to_string().clone();
    }
    if  value == "undefined".to_string() {
      return "TSType".to_string().clone();
    }
    if  value == "object".to_string() {
      return "TSType".to_string().clone();
    }
    if  value == "symbol".to_string() {
      return "TSType".to_string().clone();
    }
    if  value == "bigint".to_string() {
      return "TSType".to_string().clone();
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
struct TSNode { 
  nodeType : String, 
  start : i64, 
  end : i64, 
  line : i64, 
  col : i64, 
  name : String, 
  value : String, 
  kind : String, 
  optional : bool, 
  readonly : bool, 
  children : Vec<TSNode>, 
  params : Vec<TSNode>, 
  decorators : Vec<TSNode>, 
  left : Option<Box<TSNode>>, 
  right : Option<Box<TSNode>>, 
  body : Option<Box<TSNode>>, 
  init : Option<Box<TSNode>>, 
  typeAnnotation : Option<Box<TSNode>>, 
}
impl TSNode { 
  
  pub fn new() ->  TSNode {
    let mut me = TSNode { 
      nodeType:"".to_string(), 
      start:0, 
      end:0, 
      line:0, 
      col:0, 
      name:"".to_string(), 
      value:"".to_string(), 
      kind:"".to_string(), 
      optional:false, 
      readonly:false, 
      children: Vec::new(), 
      params: Vec::new(), 
      decorators: Vec::new(), 
      left: None, 
      right: None, 
      body: None, 
      init: None, 
      typeAnnotation: None, 
    };
    return me;
  }
}
#[derive(Clone)]
struct TSParserSimple { 
  tokens : Vec<Token>, 
  pos : i64, 
  currentToken : Option<Token>, 
  quiet : bool, 
  tsxMode : bool, 
}
impl TSParserSimple { 
  
  pub fn new() ->  TSParserSimple {
    let mut me = TSParserSimple { 
      tokens: Vec::new(), 
      pos:0, 
      currentToken: None, 
      quiet:false, 
      tsxMode:false, 
    };
    return me;
  }
  fn initParser(&mut self, mut toks : Vec<Token>) -> () {
    self.tokens = toks.clone();
    self.pos = 0;
    self.quiet = false;
    if  ((toks.len() as i64)) > 0 {
      self.currentToken = Some(toks[0 as usize].clone());
    }
  }
  fn setQuiet(&mut self, q : bool) -> () {
    self.quiet = q;
  }
  fn setTsxMode(&mut self, enabled : bool) -> () {
    self.tsxMode = enabled;
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
  fn expect(&mut self, expectedType : String) -> Token {
    let mut tok : Token = self.peek();
    if  tok.tokenType != expectedType {
      if  self.quiet == false {
        println!( "{}", format!("{}{}", (format!("{}{}", (format!("{}{}", "Parse error: expected ".to_string(), expectedType)), " but got ".to_string())), tok.tokenType) );
      }
    }
    self.advance();
    return tok.clone();
  }
  fn expectValue(&mut self, expectedValue : String) -> Token {
    let mut tok : Token = self.peek();
    if  tok.value != expectedValue {
      if  self.quiet == false {
        println!( "{}", format!("{}{}", (format!("{}{}", (format!("{}{}", (format!("{}{}", "Parse error: expected '".to_string(), expectedValue)), "' but got '".to_string())), tok.value)), "'".to_string()) );
      }
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
  fn parseProgram(&mut self, ) -> TSNode {
    let mut prog : TSNode = TSNode::new();
    prog.nodeType = "Program".to_string();
    while self.isAtEnd() == false {
      let mut stmt : TSNode = self.parseStatement();
      prog.children.push(stmt.clone());
    }
    return prog.clone();
  }
  fn parseStatement(&mut self, ) -> TSNode {
    let tokVal : String = self.peekValue();
    if  tokVal == "@".to_string() {
      let mut decorators : Vec<TSNode> = Vec::new();
      while self.matchValue("@".to_string()) {
        let mut dec : TSNode = self.parseDecorator();
        decorators.push(dec.clone());
      }
      let mut decorated : TSNode = self.parseStatement();
      decorated.decorators = decorators.clone();
      return decorated.clone();
    }
    if  tokVal == "declare".to_string() {
      return self.parseDeclare().clone();
    }
    if  tokVal == "import".to_string() {
      return self.parseImport().clone();
    }
    if  tokVal == "export".to_string() {
      return self.parseExport().clone();
    }
    if  tokVal == "interface".to_string() {
      return self.parseInterface().clone();
    }
    if  tokVal == "type".to_string() {
      return self.parseTypeAlias().clone();
    }
    if  tokVal == "class".to_string() {
      return self.parseClass().clone();
    }
    if  tokVal == "abstract".to_string() {
      let nextVal : String = self.peekNextValue();
      if  nextVal == "class".to_string() {
        return self.parseClass().clone();
      }
    }
    if  tokVal == "enum".to_string() {
      return self.parseEnum().clone();
    }
    if  tokVal == "namespace".to_string() {
      return self.parseNamespace().clone();
    }
    if  tokVal == "const".to_string() {
      let nextVal_1 : String = self.peekNextValue();
      if  nextVal_1 == "enum".to_string() {
        return self.parseEnum().clone();
      }
    }
    if  (tokVal == "let".to_string()) || (tokVal == "const".to_string()) {
      return self.parseVarDecl().clone();
    }
    if  tokVal == "function".to_string() {
      return self.parseFuncDecl().clone();
    }
    if  tokVal == "return".to_string() {
      return self.parseReturn().clone();
    }
    if  tokVal == "throw".to_string() {
      return self.parseThrow().clone();
    }
    if  tokVal == "if".to_string() {
      return self.parseIfStatement().clone();
    }
    if  tokVal == "while".to_string() {
      return self.parseWhileStatement().clone();
    }
    if  tokVal == "do".to_string() {
      return self.parseDoWhileStatement().clone();
    }
    if  tokVal == "for".to_string() {
      return self.parseForStatement().clone();
    }
    if  tokVal == "switch".to_string() {
      return self.parseSwitchStatement().clone();
    }
    if  tokVal == "try".to_string() {
      return self.parseTryStatement().clone();
    }
    if  tokVal == "{".to_string() {
      return self.parseBlock().clone();
    }
    if  tokVal == ";".to_string() {
      self.advance();
      let mut empty : TSNode = TSNode::new();
      empty.nodeType = "EmptyStatement".to_string();
      return empty.clone();
    }
    return self.parseExprStmt().clone();
  }
  fn peekNextValue(&mut self, ) -> String {
    let nextPos : i64 = self.pos + 1;
    if  nextPos < ((self.tokens.len() as i64)) {
      let mut nextTok : Token = self.tokens[nextPos as usize].clone();
      return nextTok.value.clone();
    }
    return "".to_string().clone();
  }
  fn parseReturn(&mut self, ) -> TSNode {
    let mut node : TSNode = TSNode::new();
    node.nodeType = "ReturnStatement".to_string();
    let mut startTok : Token = self.peek();
    node.start = startTok.start;
    node.line = startTok.line;
    node.col = startTok.col;
    self.expectValue("return".to_string());
    let v : String = self.peekValue();
    if  (v != ";".to_string()) && (self.isAtEnd() == false) {
      let mut arg : TSNode = self.parseExpr();
      node.left = Some(Box::new(arg.clone()));
    }
    if  self.matchValue(";".to_string()) {
      self.advance();
    }
    return node.clone();
  }
  fn parseImport(&mut self, ) -> TSNode {
    let mut node : TSNode = TSNode::new();
    node.nodeType = "ImportDeclaration".to_string();
    let mut startTok : Token = self.peek();
    node.start = startTok.start;
    node.line = startTok.line;
    node.col = startTok.col;
    self.expectValue("import".to_string());
    if  self.matchValue("type".to_string()) {
      self.advance();
      node.kind = "type".to_string();
    }
    let v : String = self.peekValue();
    if  v == "{".to_string() {
      self.advance();
      let mut specifiers : Vec<TSNode> = Vec::new();
      while (self.matchValue("}".to_string()) == false) && (self.isAtEnd() == false) {
        let mut spec : TSNode = TSNode::new();
        spec.nodeType = "ImportSpecifier".to_string();
        if  self.matchValue("type".to_string()) {
          self.advance();
          spec.kind = "type".to_string();
        }
        let mut importedName : Token = self.expect("Identifier".to_string());
        spec.name = importedName.value.clone();
        if  self.matchValue("as".to_string()) {
          self.advance();
          let mut localName : Token = self.expect("Identifier".to_string());
          spec.value = localName.value.clone();
        } else {
          spec.value = importedName.value.clone();
        }
        specifiers.push(spec.clone());
        if  self.matchValue(",".to_string()) {
          self.advance();
        }
      }
      self.expectValue("}".to_string());
      node.children = specifiers.clone();
    }
    if  v == "*".to_string() {
      self.advance();
      self.expectValue("as".to_string());
      let mut namespaceName : Token = self.expect("Identifier".to_string());
      let mut nsSpec : TSNode = TSNode::new();
      nsSpec.nodeType = "ImportNamespaceSpecifier".to_string();
      nsSpec.name = namespaceName.value.clone();
      node.children.push(nsSpec.clone());
    }
    if  self.matchType("Identifier".to_string()) {
      let mut defaultSpec : TSNode = TSNode::new();
      defaultSpec.nodeType = "ImportDefaultSpecifier".to_string();
      let mut defaultName : Token = self.expect("Identifier".to_string());
      defaultSpec.name = defaultName.value.clone();
      node.children.push(defaultSpec.clone());
      if  self.matchValue(",".to_string()) {
        self.advance();
        if  self.matchValue("{".to_string()) {
          self.advance();
          while (self.matchValue("}".to_string()) == false) && (self.isAtEnd() == false) {
            let mut spec_1 : TSNode = TSNode::new();
            spec_1.nodeType = "ImportSpecifier".to_string();
            let mut importedName_1 : Token = self.expect("Identifier".to_string());
            spec_1.name = importedName_1.value.clone();
            if  self.matchValue("as".to_string()) {
              self.advance();
              let mut localName_1 : Token = self.expect("Identifier".to_string());
              spec_1.value = localName_1.value.clone();
            } else {
              spec_1.value = importedName_1.value.clone();
            }
            node.children.push(spec_1.clone());
            if  self.matchValue(",".to_string()) {
              self.advance();
            }
          }
          self.expectValue("}".to_string());
        }
      }
    }
    if  self.matchValue("from".to_string()) {
      self.advance();
      let mut sourceStr : Token = self.expect("String".to_string());
      let mut source : TSNode = TSNode::new();
      source.nodeType = "StringLiteral".to_string();
      source.value = sourceStr.value.clone();
      node.left = Some(Box::new(source.clone()));
    }
    if  self.matchValue(";".to_string()) {
      self.advance();
    }
    return node.clone();
  }
  fn parseExport(&mut self, ) -> TSNode {
    let mut node : TSNode = TSNode::new();
    node.nodeType = "ExportNamedDeclaration".to_string();
    let mut startTok : Token = self.peek();
    node.start = startTok.start;
    node.line = startTok.line;
    node.col = startTok.col;
    self.expectValue("export".to_string());
    if  self.matchValue("type".to_string()) {
      let nextV : String = self.peekNextValue();
      if  nextV == "{".to_string() {
        self.advance();
        node.kind = "type".to_string();
      }
    }
    let v : String = self.peekValue();
    if  v == "default".to_string() {
      node.nodeType = "ExportDefaultDeclaration".to_string();
      self.advance();
      let nextVal : String = self.peekValue();
      if  ((nextVal == "class".to_string()) || (nextVal == "function".to_string())) || (nextVal == "interface".to_string()) {
        let mut decl : TSNode = self.parseStatement();
        node.left = Some(Box::new(decl.clone()));
      } else {
        let mut expr : TSNode = self.parseExpr();
        node.left = Some(Box::new(expr.clone()));
      }
      if  self.matchValue(";".to_string()) {
        self.advance();
      }
      return node.clone();
    }
    if  v == "{".to_string() {
      self.advance();
      let mut specifiers : Vec<TSNode> = Vec::new();
      while (self.matchValue("}".to_string()) == false) && (self.isAtEnd() == false) {
        let mut spec : TSNode = TSNode::new();
        spec.nodeType = "ExportSpecifier".to_string();
        let mut localName : Token = self.expect("Identifier".to_string());
        spec.name = localName.value.clone();
        if  self.matchValue("as".to_string()) {
          self.advance();
          let mut exportedName : Token = self.expect("Identifier".to_string());
          spec.value = exportedName.value.clone();
        } else {
          spec.value = localName.value.clone();
        }
        specifiers.push(spec.clone());
        if  self.matchValue(",".to_string()) {
          self.advance();
        }
      }
      self.expectValue("}".to_string());
      node.children = specifiers.clone();
      if  self.matchValue("from".to_string()) {
        self.advance();
        let mut sourceStr : Token = self.expect("String".to_string());
        let mut source : TSNode = TSNode::new();
        source.nodeType = "StringLiteral".to_string();
        source.value = sourceStr.value.clone();
        node.left = Some(Box::new(source.clone()));
      }
      if  self.matchValue(";".to_string()) {
        self.advance();
      }
      return node.clone();
    }
    if  v == "*".to_string() {
      node.nodeType = "ExportAllDeclaration".to_string();
      self.advance();
      if  self.matchValue("as".to_string()) {
        self.advance();
        let mut exportName : Token = self.expect("Identifier".to_string());
        node.name = exportName.value.clone();
      }
      self.expectValue("from".to_string());
      let mut sourceStr_1 : Token = self.expect("String".to_string());
      let mut source_1 : TSNode = TSNode::new();
      source_1.nodeType = "StringLiteral".to_string();
      source_1.value = sourceStr_1.value.clone();
      node.left = Some(Box::new(source_1.clone()));
      if  self.matchValue(";".to_string()) {
        self.advance();
      }
      return node.clone();
    }
    if  (((((((v == "function".to_string()) || (v == "class".to_string())) || (v == "interface".to_string())) || (v == "type".to_string())) || (v == "const".to_string())) || (v == "let".to_string())) || (v == "enum".to_string())) || (v == "abstract".to_string()) {
      let mut decl_1 : TSNode = self.parseStatement();
      node.left = Some(Box::new(decl_1.clone()));
      return node.clone();
    }
    if  v == "async".to_string() {
      let mut decl_2 : TSNode = self.parseStatement();
      node.left = Some(Box::new(decl_2.clone()));
      return node.clone();
    }
    return node.clone();
  }
  fn parseInterface(&mut self, ) -> TSNode {
    let mut node : TSNode = TSNode::new();
    node.nodeType = "TSInterfaceDeclaration".to_string();
    let mut startTok : Token = self.peek();
    node.start = startTok.start;
    node.line = startTok.line;
    node.col = startTok.col;
    self.expectValue("interface".to_string());
    let mut nameTok : Token = self.expect("Identifier".to_string());
    node.name = nameTok.value.clone();
    if  self.matchValue("<".to_string()) {
      let mut typeParams : Vec<TSNode> = self.parseTypeParams();
      node.params = typeParams.clone();
    }
    if  self.matchValue("extends".to_string()) {
      self.advance();
      let mut extendsList : Vec<TSNode> = Vec::new();
      let mut extendsType : TSNode = self.parseType();
      extendsList.push(extendsType.clone());
      while self.matchValue(",".to_string()) {
        self.advance();
        let mut nextType : TSNode = self.parseType();
        extendsList.push(nextType.clone());
      }
      for i in 0..extendsList.len() {
        let mut ext = extendsList[i as usize].clone();
        let mut wrapper : TSNode = TSNode::new();
        wrapper.nodeType = "TSExpressionWithTypeArguments".to_string();
        wrapper.left = Some(Box::new(ext.clone()));
        node.children.push(wrapper.clone());
      }
    }
    let mut body : TSNode = self.parseInterfaceBody();
    node.body = Some(Box::new(body.clone()));
    return node.clone();
  }
  fn parseInterfaceBody(&mut self, ) -> TSNode {
    let mut body : TSNode = TSNode::new();
    body.nodeType = "TSInterfaceBody".to_string();
    let mut startTok : Token = self.peek();
    body.start = startTok.start;
    body.line = startTok.line;
    body.col = startTok.col;
    self.expectValue("{".to_string());
    while (self.matchValue("}".to_string()) == false) && (self.isAtEnd() == false) {
      let mut prop : TSNode = self.parsePropertySig();
      body.children.push(prop.clone());
      if  self.matchValue(";".to_string()) || self.matchValue(",".to_string()) {
        self.advance();
      }
    }
    self.expectValue("}".to_string());
    return body.clone();
  }
  fn parseTypeParams(&mut self, ) -> Vec<TSNode> {
    let mut params : Vec<TSNode> = Vec::new();
    self.expectValue("<".to_string());
    while (self.matchValue(">".to_string()) == false) && (self.isAtEnd() == false) {
      if  ((params.len() as i64)) > 0 {
        self.expectValue(",".to_string());
      }
      let mut param : TSNode = TSNode::new();
      param.nodeType = "TSTypeParameter".to_string();
      let mut nameTok : Token = self.expect("Identifier".to_string());
      param.name = nameTok.value.clone();
      param.start = nameTok.start;
      param.line = nameTok.line;
      param.col = nameTok.col;
      if  self.matchValue("extends".to_string()) {
        self.advance();
        let mut constraint : TSNode = self.parseType();
        param.typeAnnotation = Some(Box::new(constraint.clone()));
      }
      if  self.matchValue("=".to_string()) {
        self.advance();
        let mut defaultType : TSNode = self.parseType();
        param.init = Some(Box::new(defaultType.clone()));
      }
      params.push(param.clone());
    }
    self.expectValue(">".to_string());
    return params;
  }
  fn parsePropertySig(&mut self, ) -> TSNode {
    let mut prop : TSNode = TSNode::new();
    prop.nodeType = "TSPropertySignature".to_string();
    let mut startTok : Token = self.peek();
    prop.start = startTok.start;
    prop.line = startTok.line;
    prop.col = startTok.col;
    if  self.matchValue("readonly".to_string()) {
      prop.readonly = true;
      self.advance();
    }
    let mut nameTok : Token = self.expect("Identifier".to_string());
    prop.name = nameTok.value.clone();
    if  self.matchValue("?".to_string()) {
      prop.optional = true;
      self.advance();
    }
    if  self.matchValue(":".to_string()) {
      let mut typeAnnot : TSNode = self.parseTypeAnnotation();
      prop.typeAnnotation = Some(Box::new(typeAnnot.clone()));
    }
    return prop.clone();
  }
  fn parseTypeAlias(&mut self, ) -> TSNode {
    let mut node : TSNode = TSNode::new();
    node.nodeType = "TSTypeAliasDeclaration".to_string();
    let mut startTok : Token = self.peek();
    node.start = startTok.start;
    node.line = startTok.line;
    node.col = startTok.col;
    self.expectValue("type".to_string());
    let mut nameTok : Token = self.expect("Identifier".to_string());
    node.name = nameTok.value.clone();
    if  self.matchValue("<".to_string()) {
      let mut typeParams : Vec<TSNode> = self.parseTypeParams();
      node.params = typeParams.clone();
    }
    self.expectValue("=".to_string());
    let mut typeExpr : TSNode = self.parseType();
    node.typeAnnotation = Some(Box::new(typeExpr.clone()));
    if  self.matchValue(";".to_string()) {
      self.advance();
    }
    return node.clone();
  }
  fn parseDecorator(&mut self, ) -> TSNode {
    let mut node : TSNode = TSNode::new();
    node.nodeType = "Decorator".to_string();
    let mut startTok : Token = self.peek();
    node.start = startTok.start;
    node.line = startTok.line;
    node.col = startTok.col;
    self.expectValue("@".to_string());
    let mut expr : TSNode = self.parsePostfix();
    node.left = Some(Box::new(expr.clone()));
    return node.clone();
  }
  fn parseClass(&mut self, ) -> TSNode {
    let mut node : TSNode = TSNode::new();
    node.nodeType = "ClassDeclaration".to_string();
    let mut startTok : Token = self.peek();
    node.start = startTok.start;
    node.line = startTok.line;
    node.col = startTok.col;
    if  self.matchValue("abstract".to_string()) {
      node.kind = "abstract".to_string();
      self.advance();
    }
    self.expectValue("class".to_string());
    let mut nameTok : Token = self.expect("Identifier".to_string());
    node.name = nameTok.value.clone();
    if  self.matchValue("<".to_string()) {
      let mut typeParams : Vec<TSNode> = self.parseTypeParams();
      node.params = typeParams.clone();
    }
    if  self.matchValue("extends".to_string()) {
      self.advance();
      let mut superClass : TSNode = self.parseType();
      let mut extendsNode : TSNode = TSNode::new();
      extendsNode.nodeType = "TSExpressionWithTypeArguments".to_string();
      extendsNode.left = Some(Box::new(superClass.clone()));
      node.left = Some(Box::new(extendsNode.clone()));
    }
    if  self.matchValue("implements".to_string()) {
      self.advance();
      let mut r#impl : TSNode = self.parseType();
      let mut implNode : TSNode = TSNode::new();
      implNode.nodeType = "TSExpressionWithTypeArguments".to_string();
      implNode.left = Some(Box::new(r#impl.clone()));
      node.children.push(implNode.clone());
      while self.matchValue(",".to_string()) {
        self.advance();
        let mut nextImpl : TSNode = self.parseType();
        let mut nextImplNode : TSNode = TSNode::new();
        nextImplNode.nodeType = "TSExpressionWithTypeArguments".to_string();
        nextImplNode.left = Some(Box::new(nextImpl.clone()));
        node.children.push(nextImplNode.clone());
      }
    }
    let mut body : TSNode = self.parseClassBody();
    node.body = Some(Box::new(body.clone()));
    return node.clone();
  }
  fn parseClassBody(&mut self, ) -> TSNode {
    let mut body : TSNode = TSNode::new();
    body.nodeType = "ClassBody".to_string();
    let mut startTok : Token = self.peek();
    body.start = startTok.start;
    body.line = startTok.line;
    body.col = startTok.col;
    self.expectValue("{".to_string());
    while (self.matchValue("}".to_string()) == false) && (self.isAtEnd() == false) {
      let mut member : TSNode = self.parseClassMember();
      body.children.push(member.clone());
      if  self.matchValue(";".to_string()) {
        self.advance();
      }
    }
    self.expectValue("}".to_string());
    return body.clone();
  }
  fn parseClassMember(&mut self, ) -> TSNode {
    let mut member : TSNode = TSNode::new();
    let mut startTok : Token = self.peek();
    member.start = startTok.start;
    member.line = startTok.line;
    member.col = startTok.col;
    let mut decorators : Vec<TSNode> = Vec::new();
    while self.matchValue("@".to_string()) {
      let mut dec : TSNode = self.parseDecorator();
      decorators.push(dec.clone());
    }
    if  ((decorators.len() as i64)) > 0 {
      member.decorators = decorators.clone();
    }
    let mut isStatic : bool = false;
    let mut isAbstract : bool = false;
    let mut isReadonly : bool = false;
    let mut accessibility : String = "".to_string();
    let mut keepParsing : bool = true;
    while keepParsing {
      let tokVal : String = self.peekValue();
      if  tokVal == "public".to_string() {
        accessibility = "public".to_string();
        self.advance();
      }
      if  tokVal == "private".to_string() {
        accessibility = "private".to_string();
        self.advance();
      }
      if  tokVal == "protected".to_string() {
        accessibility = "protected".to_string();
        self.advance();
      }
      if  tokVal == "static".to_string() {
        isStatic = true;
        self.advance();
      }
      if  tokVal == "abstract".to_string() {
        isAbstract = true;
        self.advance();
      }
      if  tokVal == "readonly".to_string() {
        isReadonly = true;
        self.advance();
      }
      let newTokVal : String = self.peekValue();
      if  (((((newTokVal != "public".to_string()) && (newTokVal != "private".to_string())) && (newTokVal != "protected".to_string())) && (newTokVal != "static".to_string())) && (newTokVal != "abstract".to_string())) && (newTokVal != "readonly".to_string()) {
        keepParsing = false;
      }
    }
    if  self.matchValue("constructor".to_string()) {
      member.nodeType = "MethodDefinition".to_string();
      member.kind = "constructor".to_string();
      self.advance();
      self.expectValue("(".to_string());
      while (self.matchValue(")".to_string()) == false) && (self.isAtEnd() == false) {
        if  ((member.params.len() as i64)) > 0 {
          self.expectValue(",".to_string());
        }
        let mut param : TSNode = self.parseConstructorParam();
        member.params.push(param.clone());
      }
      self.expectValue(")".to_string());
      if  self.matchValue("{".to_string()) {
        let mut bodyNode : TSNode = self.parseBlock();
        member.body = Some(Box::new(bodyNode.clone()));
      }
      return member.clone();
    }
    let mut nameTok : Token = self.expect("Identifier".to_string());
    member.name = nameTok.value.clone();
    if  accessibility != "".to_string() {
      member.kind = accessibility.clone();
    }
    member.readonly = isReadonly;
    if  self.matchValue("?".to_string()) {
      member.optional = true;
      self.advance();
    }
    if  self.matchValue("(".to_string()) {
      member.nodeType = "MethodDefinition".to_string();
      if  isStatic {
        member.kind = "static".to_string();
      }
      if  isAbstract {
        member.kind = "abstract".to_string();
      }
      self.expectValue("(".to_string());
      while (self.matchValue(")".to_string()) == false) && (self.isAtEnd() == false) {
        if  ((member.params.len() as i64)) > 0 {
          self.expectValue(",".to_string());
        }
        let mut param_1 : TSNode = self.parseParam();
        member.params.push(param_1.clone());
      }
      self.expectValue(")".to_string());
      if  self.matchValue(":".to_string()) {
        let mut returnType : TSNode = self.parseTypeAnnotation();
        member.typeAnnotation = Some(Box::new(returnType.clone()));
      }
      if  self.matchValue("{".to_string()) {
        let mut bodyNode_1 : TSNode = self.parseBlock();
        member.body = Some(Box::new(bodyNode_1.clone()));
      }
    } else {
      member.nodeType = "PropertyDefinition".to_string();
      if  isStatic {
        member.kind = "static".to_string();
      }
      if  self.matchValue(":".to_string()) {
        let mut typeAnnot : TSNode = self.parseTypeAnnotation();
        member.typeAnnotation = Some(Box::new(typeAnnot.clone()));
      }
      if  self.matchValue("=".to_string()) {
        self.advance();
        let mut initExpr : TSNode = self.parseExpr();
        member.init = Some(Box::new(initExpr.clone()));
      }
    }
    return member.clone();
  }
  fn parseConstructorParam(&mut self, ) -> TSNode {
    let mut param : TSNode = TSNode::new();
    param.nodeType = "Parameter".to_string();
    let mut startTok : Token = self.peek();
    param.start = startTok.start;
    param.line = startTok.line;
    param.col = startTok.col;
    let tokVal : String = self.peekValue();
    if  (((tokVal == "public".to_string()) || (tokVal == "private".to_string())) || (tokVal == "protected".to_string())) || (tokVal == "readonly".to_string()) {
      param.kind = tokVal.clone();
      self.advance();
      let nextVal : String = self.peekValue();
      if  nextVal == "readonly".to_string() {
        param.readonly = true;
        self.advance();
      }
    }
    let mut nameTok : Token = self.expect("Identifier".to_string());
    param.name = nameTok.value.clone();
    if  self.matchValue("?".to_string()) {
      param.optional = true;
      self.advance();
    }
    if  self.matchValue(":".to_string()) {
      let mut typeAnnot : TSNode = self.parseTypeAnnotation();
      param.typeAnnotation = Some(Box::new(typeAnnot.clone()));
    }
    if  self.matchValue("=".to_string()) {
      self.advance();
      let mut defaultVal : TSNode = self.parseExpr();
      param.init = Some(Box::new(defaultVal.clone()));
    }
    return param.clone();
  }
  fn parseEnum(&mut self, ) -> TSNode {
    let mut node : TSNode = TSNode::new();
    node.nodeType = "TSEnumDeclaration".to_string();
    let mut startTok : Token = self.peek();
    node.start = startTok.start;
    node.line = startTok.line;
    node.col = startTok.col;
    if  self.matchValue("const".to_string()) {
      node.kind = "const".to_string();
      self.advance();
    }
    self.expectValue("enum".to_string());
    let mut nameTok : Token = self.expect("Identifier".to_string());
    node.name = nameTok.value.clone();
    self.expectValue("{".to_string());
    while (self.matchValue("}".to_string()) == false) && (self.isAtEnd() == false) {
      let mut member : TSNode = TSNode::new();
      member.nodeType = "TSEnumMember".to_string();
      let mut memberTok : Token = self.expect("Identifier".to_string());
      member.name = memberTok.value.clone();
      member.start = memberTok.start;
      member.line = memberTok.line;
      member.col = memberTok.col;
      if  self.matchValue("=".to_string()) {
        self.advance();
        let mut initVal : TSNode = self.parseExpr();
        member.init = Some(Box::new(initVal.clone()));
      }
      node.children.push(member.clone());
      if  self.matchValue(",".to_string()) {
        self.advance();
      }
    }
    self.expectValue("}".to_string());
    return node.clone();
  }
  fn parseNamespace(&mut self, ) -> TSNode {
    let mut node : TSNode = TSNode::new();
    node.nodeType = "TSModuleDeclaration".to_string();
    let mut startTok : Token = self.peek();
    node.start = startTok.start;
    node.line = startTok.line;
    node.col = startTok.col;
    self.expectValue("namespace".to_string());
    let mut nameTok : Token = self.expect("Identifier".to_string());
    node.name = nameTok.value.clone();
    self.expectValue("{".to_string());
    let mut body : TSNode = TSNode::new();
    body.nodeType = "TSModuleBlock".to_string();
    while (self.matchValue("}".to_string()) == false) && (self.isAtEnd() == false) {
      let mut stmt : TSNode = self.parseStatement();
      body.children.push(stmt.clone());
    }
    self.expectValue("}".to_string());
    node.body = Some(Box::new(body.clone()));
    return node.clone();
  }
  fn parseDeclare(&mut self, ) -> TSNode {
    let mut startTok : Token = self.peek();
    self.expectValue("declare".to_string());
    let nextVal : String = self.peekValue();
    if  nextVal == "module".to_string() {
      let mut node : TSNode = TSNode::new();
      node.nodeType = "TSModuleDeclaration".to_string();
      node.start = startTok.start;
      node.line = startTok.line;
      node.col = startTok.col;
      node.kind = "declare".to_string();
      self.advance();
      let mut nameTok : Token = self.peek();
      if  self.matchType("String".to_string()) {
        self.advance();
        node.name = nameTok.value.clone();
      } else {
        self.advance();
        node.name = nameTok.value.clone();
      }
      self.expectValue("{".to_string());
      let mut body : TSNode = TSNode::new();
      body.nodeType = "TSModuleBlock".to_string();
      while (self.matchValue("}".to_string()) == false) && (self.isAtEnd() == false) {
        let mut stmt : TSNode = self.parseStatement();
        body.children.push(stmt.clone());
      }
      self.expectValue("}".to_string());
      node.body = Some(Box::new(body.clone()));
      return node.clone();
    }
    let mut node_1 : TSNode = self.parseStatement();
    node_1.kind = "declare".to_string();
    return node_1.clone();
  }
  fn parseIfStatement(&mut self, ) -> TSNode {
    let mut node : TSNode = TSNode::new();
    node.nodeType = "IfStatement".to_string();
    let mut startTok : Token = self.peek();
    node.start = startTok.start;
    node.line = startTok.line;
    node.col = startTok.col;
    self.expectValue("if".to_string());
    self.expectValue("(".to_string());
    let mut test : TSNode = self.parseExpr();
    node.left = Some(Box::new(test.clone()));
    self.expectValue(")".to_string());
    let mut consequent : TSNode = self.parseStatement();
    node.body = Some(Box::new(consequent.clone()));
    if  self.matchValue("else".to_string()) {
      self.advance();
      let mut alternate : TSNode = self.parseStatement();
      node.right = Some(Box::new(alternate.clone()));
    }
    return node.clone();
  }
  fn parseWhileStatement(&mut self, ) -> TSNode {
    let mut node : TSNode = TSNode::new();
    node.nodeType = "WhileStatement".to_string();
    let mut startTok : Token = self.peek();
    node.start = startTok.start;
    node.line = startTok.line;
    node.col = startTok.col;
    self.expectValue("while".to_string());
    self.expectValue("(".to_string());
    let mut test : TSNode = self.parseExpr();
    node.left = Some(Box::new(test.clone()));
    self.expectValue(")".to_string());
    let mut body : TSNode = self.parseStatement();
    node.body = Some(Box::new(body.clone()));
    return node.clone();
  }
  fn parseDoWhileStatement(&mut self, ) -> TSNode {
    let mut node : TSNode = TSNode::new();
    node.nodeType = "DoWhileStatement".to_string();
    let mut startTok : Token = self.peek();
    node.start = startTok.start;
    node.line = startTok.line;
    node.col = startTok.col;
    self.expectValue("do".to_string());
    let mut body : TSNode = self.parseStatement();
    node.body = Some(Box::new(body.clone()));
    self.expectValue("while".to_string());
    self.expectValue("(".to_string());
    let mut test : TSNode = self.parseExpr();
    node.left = Some(Box::new(test.clone()));
    self.expectValue(")".to_string());
    if  self.matchValue(";".to_string()) {
      self.advance();
    }
    return node.clone();
  }
  fn parseThrow(&mut self, ) -> TSNode {
    let mut node : TSNode = TSNode::new();
    node.nodeType = "ThrowStatement".to_string();
    let mut startTok : Token = self.peek();
    node.start = startTok.start;
    node.line = startTok.line;
    node.col = startTok.col;
    self.expectValue("throw".to_string());
    let mut arg : TSNode = self.parseExpr();
    node.left = Some(Box::new(arg.clone()));
    if  self.matchValue(";".to_string()) {
      self.advance();
    }
    return node.clone();
  }
  fn parseForStatement(&mut self, ) -> TSNode {
    let mut node : TSNode = TSNode::new();
    let mut startTok : Token = self.peek();
    node.start = startTok.start;
    node.line = startTok.line;
    node.col = startTok.col;
    self.expectValue("for".to_string());
    self.expectValue("(".to_string());
    let tokVal : String = self.peekValue();
    if  ((tokVal == "let".to_string()) || (tokVal == "const".to_string())) || (tokVal == "var".to_string()) {
      let kind : String = tokVal;
      self.advance();
      let mut varName : Token = self.expect("Identifier".to_string());
      let nextVal : String = self.peekValue();
      if  nextVal == "of".to_string() {
        node.nodeType = "ForOfStatement".to_string();
        self.advance();
        let mut left : TSNode = TSNode::new();
        left.nodeType = "VariableDeclaration".to_string();
        left.kind = kind.clone();
        let mut declarator : TSNode = TSNode::new();
        declarator.nodeType = "VariableDeclarator".to_string();
        declarator.name = varName.value.clone();
        left.children.push(declarator.clone());
        node.left = Some(Box::new(left.clone()));
        let mut right : TSNode = self.parseExpr();
        node.right = Some(Box::new(right.clone()));
        self.expectValue(")".to_string());
        let mut body : TSNode = self.parseStatement();
        node.body = Some(Box::new(body.clone()));
        return node.clone();
      }
      if  nextVal == "in".to_string() {
        node.nodeType = "ForInStatement".to_string();
        self.advance();
        let mut left_1 : TSNode = TSNode::new();
        left_1.nodeType = "VariableDeclaration".to_string();
        left_1.kind = kind.clone();
        let mut declarator_1 : TSNode = TSNode::new();
        declarator_1.nodeType = "VariableDeclarator".to_string();
        declarator_1.name = varName.value.clone();
        left_1.children.push(declarator_1.clone());
        node.left = Some(Box::new(left_1.clone()));
        let mut right_1 : TSNode = self.parseExpr();
        node.right = Some(Box::new(right_1.clone()));
        self.expectValue(")".to_string());
        let mut body_1 : TSNode = self.parseStatement();
        node.body = Some(Box::new(body_1.clone()));
        return node.clone();
      }
      node.nodeType = "ForStatement".to_string();
      let mut initDecl : TSNode = TSNode::new();
      initDecl.nodeType = "VariableDeclaration".to_string();
      initDecl.kind = kind.clone();
      let mut declarator_2 : TSNode = TSNode::new();
      declarator_2.nodeType = "VariableDeclarator".to_string();
      declarator_2.name = varName.value.clone();
      if  self.matchValue(":".to_string()) {
        let mut typeAnnot : TSNode = self.parseTypeAnnotation();
        declarator_2.typeAnnotation = Some(Box::new(typeAnnot.clone()));
      }
      if  self.matchValue("=".to_string()) {
        self.advance();
        let mut initVal : TSNode = self.parseExpr();
        declarator_2.init = Some(Box::new(initVal.clone()));
      }
      initDecl.children.push(declarator_2.clone());
      node.init = Some(Box::new(initDecl.clone()));
    } else {
      node.nodeType = "ForStatement".to_string();
      if  self.matchValue(";".to_string()) == false {
        let mut initExpr : TSNode = self.parseExpr();
        node.init = Some(Box::new(initExpr.clone()));
      }
    }
    self.expectValue(";".to_string());
    if  self.matchValue(";".to_string()) == false {
      let mut test : TSNode = self.parseExpr();
      node.left = Some(Box::new(test.clone()));
    }
    self.expectValue(";".to_string());
    if  self.matchValue(")".to_string()) == false {
      let mut update : TSNode = self.parseExpr();
      node.right = Some(Box::new(update.clone()));
    }
    self.expectValue(")".to_string());
    let mut body_2 : TSNode = self.parseStatement();
    node.body = Some(Box::new(body_2.clone()));
    return node.clone();
  }
  fn parseSwitchStatement(&mut self, ) -> TSNode {
    let mut node : TSNode = TSNode::new();
    node.nodeType = "SwitchStatement".to_string();
    let mut startTok : Token = self.peek();
    node.start = startTok.start;
    node.line = startTok.line;
    node.col = startTok.col;
    self.expectValue("switch".to_string());
    self.expectValue("(".to_string());
    let mut discriminant : TSNode = self.parseExpr();
    node.left = Some(Box::new(discriminant.clone()));
    self.expectValue(")".to_string());
    self.expectValue("{".to_string());
    while (self.matchValue("}".to_string()) == false) && (self.isAtEnd() == false) {
      let mut caseNode : TSNode = TSNode::new();
      if  self.matchValue("case".to_string()) {
        caseNode.nodeType = "SwitchCase".to_string();
        self.advance();
        let mut test : TSNode = self.parseExpr();
        caseNode.left = Some(Box::new(test.clone()));
        self.expectValue(":".to_string());
      }
      if  self.matchValue("default".to_string()) {
        caseNode.nodeType = "SwitchCase".to_string();
        caseNode.kind = "default".to_string();
        self.advance();
        self.expectValue(":".to_string());
      }
      while (((self.matchValue("case".to_string()) == false) && (self.matchValue("default".to_string()) == false)) && (self.matchValue("}".to_string()) == false)) && (self.isAtEnd() == false) {
        if  self.matchValue("break".to_string()) {
          let mut breakNode : TSNode = TSNode::new();
          breakNode.nodeType = "BreakStatement".to_string();
          self.advance();
          if  self.matchValue(";".to_string()) {
            self.advance();
          }
          caseNode.children.push(breakNode.clone());
        } else {
          let mut stmt : TSNode = self.parseStatement();
          caseNode.children.push(stmt.clone());
        }
      }
      node.children.push(caseNode.clone());
    }
    self.expectValue("}".to_string());
    return node.clone();
  }
  fn parseTryStatement(&mut self, ) -> TSNode {
    let mut node : TSNode = TSNode::new();
    node.nodeType = "TryStatement".to_string();
    let mut startTok : Token = self.peek();
    node.start = startTok.start;
    node.line = startTok.line;
    node.col = startTok.col;
    self.expectValue("try".to_string());
    let mut tryBlock : TSNode = self.parseBlock();
    node.body = Some(Box::new(tryBlock.clone()));
    if  self.matchValue("catch".to_string()) {
      let mut catchNode : TSNode = TSNode::new();
      catchNode.nodeType = "CatchClause".to_string();
      self.advance();
      if  self.matchValue("(".to_string()) {
        self.advance();
        let mut param : Token = self.expect("Identifier".to_string());
        catchNode.name = param.value.clone();
        if  self.matchValue(":".to_string()) {
          let mut typeAnnot : TSNode = self.parseTypeAnnotation();
          catchNode.typeAnnotation = Some(Box::new(typeAnnot.clone()));
        }
        self.expectValue(")".to_string());
      }
      let mut catchBlock : TSNode = self.parseBlock();
      catchNode.body = Some(Box::new(catchBlock.clone()));
      node.left = Some(Box::new(catchNode.clone()));
    }
    if  self.matchValue("finally".to_string()) {
      self.advance();
      let mut finallyBlock : TSNode = self.parseBlock();
      node.right = Some(Box::new(finallyBlock.clone()));
    }
    return node.clone();
  }
  fn parseVarDecl(&mut self, ) -> TSNode {
    let mut node : TSNode = TSNode::new();
    node.nodeType = "VariableDeclaration".to_string();
    let mut startTok : Token = self.peek();
    node.start = startTok.start;
    node.line = startTok.line;
    node.col = startTok.col;
    node.kind = startTok.value.clone();
    self.advance();
    let mut declarator : TSNode = TSNode::new();
    declarator.nodeType = "VariableDeclarator".to_string();
    let mut nameTok : Token = self.expect("Identifier".to_string());
    declarator.name = nameTok.value.clone();
    declarator.start = nameTok.start;
    declarator.line = nameTok.line;
    declarator.col = nameTok.col;
    if  self.matchValue(":".to_string()) {
      let mut typeAnnot : TSNode = self.parseTypeAnnotation();
      declarator.typeAnnotation = Some(Box::new(typeAnnot.clone()));
    }
    if  self.matchValue("=".to_string()) {
      self.advance();
      let mut initExpr : TSNode = self.parseExpr();
      declarator.init = Some(Box::new(initExpr.clone()));
    }
    node.children.push(declarator.clone());
    if  self.matchValue(";".to_string()) {
      self.advance();
    }
    return node.clone();
  }
  fn parseFuncDecl(&mut self, ) -> TSNode {
    let mut node : TSNode = TSNode::new();
    node.nodeType = "FunctionDeclaration".to_string();
    let mut startTok : Token = self.peek();
    node.start = startTok.start;
    node.line = startTok.line;
    node.col = startTok.col;
    self.expectValue("function".to_string());
    let mut nameTok : Token = self.expect("Identifier".to_string());
    node.name = nameTok.value.clone();
    if  self.matchValue("<".to_string()) {
      let mut typeParams : Vec<TSNode> = self.parseTypeParams();
      for i in 0..typeParams.len() {
        let mut tp = typeParams[i as usize].clone();
        node.children.push(tp.clone());
      }
    }
    self.expectValue("(".to_string());
    while (self.matchValue(")".to_string()) == false) && (self.isAtEnd() == false) {
      if  ((node.params.len() as i64)) > 0 {
        self.expectValue(",".to_string());
      }
      let mut param : TSNode = self.parseParam();
      node.params.push(param.clone());
    }
    self.expectValue(")".to_string());
    if  self.matchValue(":".to_string()) {
      let mut returnType : TSNode = self.parseTypeAnnotation();
      node.typeAnnotation = Some(Box::new(returnType.clone()));
    }
    let mut body : TSNode = self.parseBlock();
    node.body = Some(Box::new(body.clone()));
    return node.clone();
  }
  fn parseParam(&mut self, ) -> TSNode {
    let mut param : TSNode = TSNode::new();
    param.nodeType = "Parameter".to_string();
    while self.matchValue("@".to_string()) {
      let mut dec : TSNode = self.parseDecorator();
      param.decorators.push(dec.clone());
    }
    if  self.matchValue("...".to_string()) {
      self.advance();
      param.nodeType = "RestElement".to_string();
      param.kind = "rest".to_string();
    }
    let mut nameTok : Token = self.expect("Identifier".to_string());
    param.name = nameTok.value.clone();
    param.start = nameTok.start;
    param.line = nameTok.line;
    param.col = nameTok.col;
    if  self.matchValue("?".to_string()) {
      param.optional = true;
      self.advance();
    }
    if  self.matchValue(":".to_string()) {
      let mut typeAnnot : TSNode = self.parseTypeAnnotation();
      param.typeAnnotation = Some(Box::new(typeAnnot.clone()));
    }
    return param.clone();
  }
  fn parseBlock(&mut self, ) -> TSNode {
    let mut block : TSNode = TSNode::new();
    block.nodeType = "BlockStatement".to_string();
    let mut startTok : Token = self.peek();
    block.start = startTok.start;
    block.line = startTok.line;
    block.col = startTok.col;
    self.expectValue("{".to_string());
    while (self.matchValue("}".to_string()) == false) && (self.isAtEnd() == false) {
      let mut stmt : TSNode = self.parseStatement();
      block.children.push(stmt.clone());
    }
    self.expectValue("}".to_string());
    return block.clone();
  }
  fn parseExprStmt(&mut self, ) -> TSNode {
    let mut stmt : TSNode = TSNode::new();
    stmt.nodeType = "ExpressionStatement".to_string();
    let mut startTok : Token = self.peek();
    stmt.start = startTok.start;
    stmt.line = startTok.line;
    stmt.col = startTok.col;
    let mut expr : TSNode = self.parseExpr();
    stmt.left = Some(Box::new(expr.clone()));
    if  self.matchValue(";".to_string()) {
      self.advance();
    }
    return stmt.clone();
  }
  fn parseTypeAnnotation(&mut self, ) -> TSNode {
    let mut annot : TSNode = TSNode::new();
    annot.nodeType = "TSTypeAnnotation".to_string();
    let mut startTok : Token = self.peek();
    annot.start = startTok.start;
    annot.line = startTok.line;
    annot.col = startTok.col;
    self.expectValue(":".to_string());
    let mut typeExpr : TSNode = self.parseType();
    annot.typeAnnotation = Some(Box::new(typeExpr.clone()));
    return annot.clone();
  }
  fn parseType(&mut self, ) -> TSNode {
    return self.parseConditionalType().clone();
  }
  fn parseConditionalType(&mut self, ) -> TSNode {
    let mut checkType : TSNode = self.parseUnionType();
    if  self.matchValue("extends".to_string()) {
      self.advance();
      let mut extendsType : TSNode = self.parseUnionType();
      if  self.matchValue("?".to_string()) {
        self.advance();
        let mut conditional : TSNode = TSNode::new();
        conditional.nodeType = "TSConditionalType".to_string();
        conditional.start = checkType.start;
        conditional.line = checkType.line;
        conditional.col = checkType.col;
        conditional.left = Some(Box::new(checkType.clone()));
        conditional.params.push(extendsType.clone());
        conditional.body = Some(Box::new(self.parseUnionType().clone()));
        self.expectValue(":".to_string());
        conditional.right = Some(Box::new(self.parseUnionType().clone()));
        return conditional.clone();
      }
      return checkType.clone();
    }
    return checkType.clone();
  }
  fn parseUnionType(&mut self, ) -> TSNode {
    let mut left : TSNode = self.parseIntersectionType();
    if  self.matchValue("|".to_string()) {
      let mut r#union : TSNode = TSNode::new();
      r#union.nodeType = "TSUnionType".to_string();
      r#union.start = left.start;
      r#union.line = left.line;
      r#union.col = left.col;
      r#union.children.push(left.clone());
      while self.matchValue("|".to_string()) {
        self.advance();
        let mut right : TSNode = self.parseIntersectionType();
        r#union.children.push(right.clone());
      }
      return r#union.clone();
    }
    return left.clone();
  }
  fn parseIntersectionType(&mut self, ) -> TSNode {
    let mut left : TSNode = self.parseArrayType();
    if  self.matchValue("&".to_string()) {
      let mut intersection : TSNode = TSNode::new();
      intersection.nodeType = "TSIntersectionType".to_string();
      intersection.start = left.start;
      intersection.line = left.line;
      intersection.col = left.col;
      intersection.children.push(left.clone());
      while self.matchValue("&".to_string()) {
        self.advance();
        let mut right : TSNode = self.parseArrayType();
        intersection.children.push(right.clone());
      }
      return intersection.clone();
    }
    return left.clone();
  }
  fn parseArrayType(&mut self, ) -> TSNode {
    let mut elemType : TSNode = self.parsePrimaryType();
    while self.matchValue("[".to_string()) {
      if  self.checkNext("]".to_string()) {
        self.advance();
        self.advance();
        let mut arrayType : TSNode = TSNode::new();
        arrayType.nodeType = "TSArrayType".to_string();
        arrayType.start = elemType.start;
        arrayType.line = elemType.line;
        arrayType.col = elemType.col;
        arrayType.left = Some(Box::new(elemType.clone()));
        elemType = arrayType.clone();
      } else {
        self.advance();
        let mut indexType : TSNode = self.parseType();
        self.expectValue("]".to_string());
        let mut indexedAccess : TSNode = TSNode::new();
        indexedAccess.nodeType = "TSIndexedAccessType".to_string();
        indexedAccess.start = elemType.start;
        indexedAccess.line = elemType.line;
        indexedAccess.col = elemType.col;
        indexedAccess.left = Some(Box::new(elemType.clone()));
        indexedAccess.right = Some(Box::new(indexType.clone()));
        elemType = indexedAccess.clone();
      }
    }
    return elemType.clone();
  }
  fn checkNext(&mut self, value : String) -> bool {
    let nextPos : i64 = self.pos + 1;
    if  nextPos < ((self.tokens.len() as i64)) {
      let mut nextTok : Token = self.tokens[nextPos as usize].clone();
      let v : String = nextTok.value.clone();
      return v == value;
    }
    return false;
  }
  fn parsePrimaryType(&mut self, ) -> TSNode {
    let tokVal : String = self.peekValue();
    let mut tok : Token = self.peek();
    if  tokVal == "keyof".to_string() {
      self.advance();
      let mut operand : TSNode = self.parsePrimaryType();
      let mut node : TSNode = TSNode::new();
      node.nodeType = "TSTypeOperator".to_string();
      node.value = "keyof".to_string();
      node.start = tok.start;
      node.line = tok.line;
      node.col = tok.col;
      node.typeAnnotation = Some(Box::new(operand.clone()));
      return node.clone();
    }
    if  tokVal == "typeof".to_string() {
      self.advance();
      let mut operand_1 : TSNode = self.parsePrimaryType();
      let mut node_1 : TSNode = TSNode::new();
      node_1.nodeType = "TSTypeQuery".to_string();
      node_1.value = "typeof".to_string();
      node_1.start = tok.start;
      node_1.line = tok.line;
      node_1.col = tok.col;
      node_1.typeAnnotation = Some(Box::new(operand_1.clone()));
      return node_1.clone();
    }
    if  tokVal == "infer".to_string() {
      self.advance();
      let mut paramTok : Token = self.expect("Identifier".to_string());
      let mut node_2 : TSNode = TSNode::new();
      node_2.nodeType = "TSInferType".to_string();
      node_2.start = tok.start;
      node_2.line = tok.line;
      node_2.col = tok.col;
      let mut typeParam : TSNode = TSNode::new();
      typeParam.nodeType = "TSTypeParameter".to_string();
      typeParam.name = paramTok.value.clone();
      node_2.typeAnnotation = Some(Box::new(typeParam.clone()));
      return node_2.clone();
    }
    if  tokVal == "string".to_string() {
      self.advance();
      let mut node_3 : TSNode = TSNode::new();
      node_3.nodeType = "TSStringKeyword".to_string();
      node_3.start = tok.start;
      node_3.end = tok.end;
      node_3.line = tok.line;
      node_3.col = tok.col;
      return node_3.clone();
    }
    if  tokVal == "number".to_string() {
      self.advance();
      let mut node_4 : TSNode = TSNode::new();
      node_4.nodeType = "TSNumberKeyword".to_string();
      node_4.start = tok.start;
      node_4.end = tok.end;
      node_4.line = tok.line;
      node_4.col = tok.col;
      return node_4.clone();
    }
    if  tokVal == "boolean".to_string() {
      self.advance();
      let mut node_5 : TSNode = TSNode::new();
      node_5.nodeType = "TSBooleanKeyword".to_string();
      node_5.start = tok.start;
      node_5.end = tok.end;
      node_5.line = tok.line;
      node_5.col = tok.col;
      return node_5.clone();
    }
    if  tokVal == "any".to_string() {
      self.advance();
      let mut node_6 : TSNode = TSNode::new();
      node_6.nodeType = "TSAnyKeyword".to_string();
      node_6.start = tok.start;
      node_6.end = tok.end;
      node_6.line = tok.line;
      node_6.col = tok.col;
      return node_6.clone();
    }
    if  tokVal == "unknown".to_string() {
      self.advance();
      let mut node_7 : TSNode = TSNode::new();
      node_7.nodeType = "TSUnknownKeyword".to_string();
      node_7.start = tok.start;
      node_7.end = tok.end;
      node_7.line = tok.line;
      node_7.col = tok.col;
      return node_7.clone();
    }
    if  tokVal == "void".to_string() {
      self.advance();
      let mut node_8 : TSNode = TSNode::new();
      node_8.nodeType = "TSVoidKeyword".to_string();
      node_8.start = tok.start;
      node_8.end = tok.end;
      node_8.line = tok.line;
      node_8.col = tok.col;
      return node_8.clone();
    }
    if  tokVal == "null".to_string() {
      self.advance();
      let mut node_9 : TSNode = TSNode::new();
      node_9.nodeType = "TSNullKeyword".to_string();
      node_9.start = tok.start;
      node_9.end = tok.end;
      node_9.line = tok.line;
      node_9.col = tok.col;
      return node_9.clone();
    }
    if  tokVal == "never".to_string() {
      self.advance();
      let mut node_10 : TSNode = TSNode::new();
      node_10.nodeType = "TSNeverKeyword".to_string();
      node_10.start = tok.start;
      node_10.end = tok.end;
      node_10.line = tok.line;
      node_10.col = tok.col;
      return node_10.clone();
    }
    if  tokVal == "undefined".to_string() {
      self.advance();
      let mut node_11 : TSNode = TSNode::new();
      node_11.nodeType = "TSUndefinedKeyword".to_string();
      node_11.start = tok.start;
      node_11.end = tok.end;
      node_11.line = tok.line;
      node_11.col = tok.col;
      return node_11.clone();
    }
    let tokType : String = self.peekType();
    if  tokType == "Identifier".to_string() {
      return self.parseTypeRef().clone();
    }
    if  tokType == "String".to_string() {
      self.advance();
      let mut node_12 : TSNode = TSNode::new();
      node_12.nodeType = "TSLiteralType".to_string();
      node_12.start = tok.start;
      node_12.end = tok.end;
      node_12.line = tok.line;
      node_12.col = tok.col;
      node_12.value = tok.value.clone();
      node_12.kind = "string".to_string();
      return node_12.clone();
    }
    if  tokType == "Number".to_string() {
      self.advance();
      let mut node_13 : TSNode = TSNode::new();
      node_13.nodeType = "TSLiteralType".to_string();
      node_13.start = tok.start;
      node_13.end = tok.end;
      node_13.line = tok.line;
      node_13.col = tok.col;
      node_13.value = tok.value.clone();
      node_13.kind = "number".to_string();
      return node_13.clone();
    }
    if  (tokVal == "true".to_string()) || (tokVal == "false".to_string()) {
      self.advance();
      let mut node_14 : TSNode = TSNode::new();
      node_14.nodeType = "TSLiteralType".to_string();
      node_14.start = tok.start;
      node_14.end = tok.end;
      node_14.line = tok.line;
      node_14.col = tok.col;
      node_14.value = tokVal.clone();
      node_14.kind = "boolean".to_string();
      return node_14.clone();
    }
    if  tokType == "Template".to_string() {
      self.advance();
      let mut node_15 : TSNode = TSNode::new();
      node_15.nodeType = "TSTemplateLiteralType".to_string();
      node_15.start = tok.start;
      node_15.end = tok.end;
      node_15.line = tok.line;
      node_15.col = tok.col;
      node_15.value = tok.value.clone();
      return node_15.clone();
    }
    if  tokVal == "(".to_string() {
      return self.parseParenOrFunctionType().clone();
    }
    if  tokVal == "[".to_string() {
      return self.parseTupleType().clone();
    }
    if  tokVal == "{".to_string() {
      return self.parseTypeLiteral().clone();
    }
    if  self.quiet == false {
      println!( "{}", format!("{}{}", "Unknown type: ".to_string(), tokVal) );
    }
    self.advance();
    let mut errNode : TSNode = TSNode::new();
    errNode.nodeType = "TSAnyKeyword".to_string();
    return errNode.clone();
  }
  fn parseTypeRef(&mut self, ) -> TSNode {
    let mut r#ref : TSNode = TSNode::new();
    r#ref.nodeType = "TSTypeReference".to_string();
    let mut tok : Token = self.peek();
    r#ref.start = tok.start;
    r#ref.line = tok.line;
    r#ref.col = tok.col;
    let mut nameTok : Token = self.expect("Identifier".to_string());
    r#ref.name = nameTok.value.clone();
    if  self.matchValue("<".to_string()) {
      self.advance();
      while (self.matchValue(">".to_string()) == false) && (self.isAtEnd() == false) {
        if  ((r#ref.params.len() as i64)) > 0 {
          self.expectValue(",".to_string());
        }
        let mut typeArg : TSNode = self.parseType();
        r#ref.params.push(typeArg.clone());
      }
      self.expectValue(">".to_string());
    }
    return r#ref.clone();
  }
  fn parseTupleType(&mut self, ) -> TSNode {
    let mut tuple : TSNode = TSNode::new();
    tuple.nodeType = "TSTupleType".to_string();
    let mut startTok : Token = self.peek();
    tuple.start = startTok.start;
    tuple.line = startTok.line;
    tuple.col = startTok.col;
    self.expectValue("[".to_string());
    while (self.matchValue("]".to_string()) == false) && (self.isAtEnd() == false) {
      if  ((tuple.children.len() as i64)) > 0 {
        self.expectValue(",".to_string());
      }
      if  self.matchValue("...".to_string()) {
        self.advance();
        let mut innerType : TSNode = self.parseType();
        let mut restType : TSNode = TSNode::new();
        restType.nodeType = "TSRestType".to_string();
        restType.start = innerType.start;
        restType.line = innerType.line;
        restType.col = innerType.col;
        restType.typeAnnotation = Some(Box::new(innerType.clone()));
        tuple.children.push(restType.clone());
      } else {
        let mut elemType : TSNode = self.parseType();
        if  self.matchValue("?".to_string()) {
          self.advance();
          let mut optType : TSNode = TSNode::new();
          optType.nodeType = "TSOptionalType".to_string();
          optType.start = elemType.start;
          optType.line = elemType.line;
          optType.col = elemType.col;
          optType.typeAnnotation = Some(Box::new(elemType.clone()));
          tuple.children.push(optType.clone());
        } else {
          tuple.children.push(elemType.clone());
        }
      }
    }
    self.expectValue("]".to_string());
    return tuple.clone();
  }
  fn parseParenOrFunctionType(&mut self, ) -> TSNode {
    let mut startTok : Token = self.peek();
    let startPos : i64 = startTok.start;
    let startLine : i64 = startTok.line;
    let startCol : i64 = startTok.col;
    self.expectValue("(".to_string());
    if  self.matchValue(")".to_string()) {
      self.advance();
      if  self.matchValue("=>".to_string()) {
        self.advance();
        let mut returnType : TSNode = self.parseType();
        let mut funcType : TSNode = TSNode::new();
        funcType.nodeType = "TSFunctionType".to_string();
        funcType.start = startPos;
        funcType.line = startLine;
        funcType.col = startCol;
        funcType.typeAnnotation = Some(Box::new(returnType.clone()));
        return funcType.clone();
      }
      let mut voidNode : TSNode = TSNode::new();
      voidNode.nodeType = "TSVoidKeyword".to_string();
      return voidNode.clone();
    }
    let isIdentifier : bool = self.matchType("Identifier".to_string());
    if  isIdentifier {
      let savedPos : i64 = self.pos;
      let mut savedToken : Token = self.currentToken.clone().unwrap();
      self.advance();
      if  self.matchValue(":".to_string()) || self.matchValue("?".to_string()) {
        self.pos = savedPos;
        self.currentToken = Some(savedToken.clone());
        return self.parseFunctionType(startPos, startLine, startCol).clone();
      }
      if  self.matchValue(",".to_string()) {
        /** unused:  let savedPos2 : i64 = self.pos;   **/ 
        /** unused:  let mut savedToken2 : Token = self.currentToken.clone().unwrap();   **/ 
        let mut depth : i64 = 1;
        while (depth > 0) && (self.isAtEnd() == false) {
          if  self.matchValue("(".to_string()) {
            depth = depth + 1;
          }
          if  self.matchValue(")".to_string()) {
            depth = depth - 1;
          }
          if  depth > 0 {
            self.advance();
          }
        }
        if  self.matchValue(")".to_string()) {
          self.advance();
          if  self.matchValue("=>".to_string()) {
            self.pos = savedPos;
            self.currentToken = Some(savedToken.clone());
            return self.parseFunctionType(startPos, startLine, startCol).clone();
          }
        }
        self.pos = savedPos;
        self.currentToken = Some(savedToken.clone());
      }
      self.pos = savedPos;
      self.currentToken = Some(savedToken.clone());
    }
    let mut innerType : TSNode = self.parseType();
    self.expectValue(")".to_string());
    if  self.matchValue("=>".to_string()) {
      self.advance();
      let mut returnType_1 : TSNode = self.parseType();
      let mut funcType_1 : TSNode = TSNode::new();
      funcType_1.nodeType = "TSFunctionType".to_string();
      funcType_1.start = startPos;
      funcType_1.line = startLine;
      funcType_1.col = startCol;
      funcType_1.typeAnnotation = Some(Box::new(returnType_1.clone()));
      return funcType_1.clone();
    }
    return innerType.clone();
  }
  fn parseFunctionType(&mut self, startPos : i64, startLine : i64, startCol : i64) -> TSNode {
    let mut funcType : TSNode = TSNode::new();
    funcType.nodeType = "TSFunctionType".to_string();
    funcType.start = startPos;
    funcType.line = startLine;
    funcType.col = startCol;
    while (self.matchValue(")".to_string()) == false) && (self.isAtEnd() == false) {
      if  ((funcType.params.len() as i64)) > 0 {
        self.expectValue(",".to_string());
      }
      let mut param : TSNode = TSNode::new();
      param.nodeType = "Parameter".to_string();
      let mut nameTok : Token = self.expect("Identifier".to_string());
      param.name = nameTok.value.clone();
      param.start = nameTok.start;
      param.line = nameTok.line;
      param.col = nameTok.col;
      if  self.matchValue("?".to_string()) {
        param.optional = true;
        self.advance();
      }
      if  self.matchValue(":".to_string()) {
        let mut typeAnnot : TSNode = self.parseTypeAnnotation();
        param.typeAnnotation = Some(Box::new(typeAnnot.clone()));
      }
      funcType.params.push(param.clone());
    }
    self.expectValue(")".to_string());
    if  self.matchValue("=>".to_string()) {
      self.advance();
      let mut returnType : TSNode = self.parseType();
      funcType.typeAnnotation = Some(Box::new(returnType.clone()));
    }
    return funcType.clone();
  }
  fn parseTypeLiteral(&mut self, ) -> TSNode {
    let mut literal : TSNode = TSNode::new();
    literal.nodeType = "TSTypeLiteral".to_string();
    let mut startTok : Token = self.peek();
    literal.start = startTok.start;
    literal.line = startTok.line;
    literal.col = startTok.col;
    self.expectValue("{".to_string());
    while (self.matchValue("}".to_string()) == false) && (self.isAtEnd() == false) {
      let mut member : TSNode = self.parseTypeLiteralMember();
      literal.children.push(member.clone());
      if  self.matchValue(";".to_string()) || self.matchValue(",".to_string()) {
        self.advance();
      }
    }
    self.expectValue("}".to_string());
    return literal.clone();
  }
  fn parseTypeLiteralMember(&mut self, ) -> TSNode {
    let mut startTok : Token = self.peek();
    let startPos : i64 = startTok.start;
    let startLine : i64 = startTok.line;
    let startCol : i64 = startTok.col;
    let mut isReadonly : bool = false;
    if  self.matchValue("readonly".to_string()) {
      isReadonly = true;
      self.advance();
    }
    let mut readonlyModifier : String = "".to_string();
    if  self.matchValue("+".to_string()) || self.matchValue("-".to_string()) {
      readonlyModifier = self.peekValue();
      self.advance();
      if  self.matchValue("readonly".to_string()) {
        isReadonly = true;
        self.advance();
      }
    }
    if  self.matchValue("[".to_string()) {
      self.advance();
      let mut paramName : Token = self.expect("Identifier".to_string());
      if  self.matchValue("in".to_string()) {
        return self.parseMappedType(isReadonly, readonlyModifier.clone(), paramName.value.clone(), startPos, startLine, startCol).clone();
      }
      return self.parseIndexSignatureRest(isReadonly, paramName.clone(), startPos, startLine, startCol).clone();
    }
    let mut nameTok : Token = self.expect("Identifier".to_string());
    let memberName : String = nameTok.value.clone();
    let mut isOptional : bool = false;
    if  self.matchValue("?".to_string()) {
      isOptional = true;
      self.advance();
    }
    if  self.matchValue("(".to_string()) {
      return self.parseMethodSignature(memberName.clone(), isOptional, startPos, startLine, startCol).clone();
    }
    let mut prop : TSNode = TSNode::new();
    prop.nodeType = "TSPropertySignature".to_string();
    prop.start = startPos;
    prop.line = startLine;
    prop.col = startCol;
    prop.name = memberName.clone();
    prop.readonly = isReadonly;
    prop.optional = isOptional;
    if  self.matchValue(":".to_string()) {
      let mut typeAnnot : TSNode = self.parseTypeAnnotation();
      prop.typeAnnotation = Some(Box::new(typeAnnot.clone()));
    }
    return prop.clone();
  }
  fn parseMappedType(&mut self, isReadonly : bool, readonlyMod : String, paramName : String, startPos : i64, startLine : i64, startCol : i64) -> TSNode {
    let mut mapped : TSNode = TSNode::new();
    mapped.nodeType = "TSMappedType".to_string();
    mapped.start = startPos;
    mapped.line = startLine;
    mapped.col = startCol;
    mapped.readonly = isReadonly;
    if  readonlyMod != "".to_string() {
      mapped.kind = readonlyMod.clone();
    }
    self.expectValue("in".to_string());
    let mut typeParam : TSNode = TSNode::new();
    typeParam.nodeType = "TSTypeParameter".to_string();
    typeParam.name = paramName.clone();
    let mut constraint : TSNode = self.parseType();
    typeParam.typeAnnotation = Some(Box::new(constraint.clone()));
    mapped.params.push(typeParam.clone());
    if  self.matchValue("as".to_string()) {
      self.advance();
      let mut nameType : TSNode = self.parseType();
      mapped.right = Some(Box::new(nameType.clone()));
    }
    self.expectValue("]".to_string());
    let mut optionalMod : String = "".to_string();
    if  self.matchValue("+".to_string()) || self.matchValue("-".to_string()) {
      optionalMod = self.peekValue();
      self.advance();
    }
    if  self.matchValue("?".to_string()) {
      mapped.optional = true;
      if  optionalMod != "".to_string() {
        mapped.value = optionalMod.clone();
      }
      self.advance();
    }
    if  self.matchValue(":".to_string()) {
      self.advance();
      let mut valueType : TSNode = self.parseType();
      mapped.typeAnnotation = Some(Box::new(valueType.clone()));
    }
    return mapped.clone();
  }
  fn parseIndexSignatureRest(&mut self, isReadonly : bool, mut paramTok : Token, startPos : i64, startLine : i64, startCol : i64) -> TSNode {
    let mut indexSig : TSNode = TSNode::new();
    indexSig.nodeType = "TSIndexSignature".to_string();
    indexSig.start = startPos;
    indexSig.line = startLine;
    indexSig.col = startCol;
    indexSig.readonly = isReadonly;
    let mut param : TSNode = TSNode::new();
    param.nodeType = "Parameter".to_string();
    param.name = paramTok.value.clone();
    param.start = paramTok.start;
    param.line = paramTok.line;
    param.col = paramTok.col;
    if  self.matchValue(":".to_string()) {
      let mut typeAnnot : TSNode = self.parseTypeAnnotation();
      param.typeAnnotation = Some(Box::new(typeAnnot.clone()));
    }
    indexSig.params.push(param.clone());
    self.expectValue("]".to_string());
    if  self.matchValue(":".to_string()) {
      let mut typeAnnot_1 : TSNode = self.parseTypeAnnotation();
      indexSig.typeAnnotation = Some(Box::new(typeAnnot_1.clone()));
    }
    return indexSig.clone();
  }
  fn parseMethodSignature(&mut self, methodName : String, isOptional : bool, startPos : i64, startLine : i64, startCol : i64) -> TSNode {
    let mut method : TSNode = TSNode::new();
    method.nodeType = "TSMethodSignature".to_string();
    method.start = startPos;
    method.line = startLine;
    method.col = startCol;
    method.name = methodName.clone();
    method.optional = isOptional;
    self.expectValue("(".to_string());
    while (self.matchValue(")".to_string()) == false) && (self.isAtEnd() == false) {
      if  ((method.params.len() as i64)) > 0 {
        self.expectValue(",".to_string());
      }
      let mut param : TSNode = self.parseParam();
      method.params.push(param.clone());
    }
    self.expectValue(")".to_string());
    if  self.matchValue(":".to_string()) {
      let mut returnType : TSNode = self.parseTypeAnnotation();
      method.typeAnnotation = Some(Box::new(returnType.clone()));
    }
    return method.clone();
  }
  fn parseExpr(&mut self, ) -> TSNode {
    return self.parseAssign().clone();
  }
  fn parseAssign(&mut self, ) -> TSNode {
    let mut left : TSNode = self.parseNullishCoalescing();
    if  self.matchValue("=".to_string()) {
      self.advance();
      let mut right : TSNode = self.parseAssign();
      let mut assign : TSNode = TSNode::new();
      assign.nodeType = "AssignmentExpression".to_string();
      assign.value = "=".to_string();
      assign.left = Some(Box::new(left.clone()));
      assign.right = Some(Box::new(right.clone()));
      assign.start = left.start;
      assign.line = left.line;
      assign.col = left.col;
      return assign.clone();
    }
    return left.clone();
  }
  fn parseNullishCoalescing(&mut self, ) -> TSNode {
    let mut left : TSNode = self.parseBinary();
    while self.matchValue("??".to_string()) {
      self.advance();
      let mut right : TSNode = self.parseBinary();
      let mut nullish : TSNode = TSNode::new();
      nullish.nodeType = "LogicalExpression".to_string();
      nullish.value = "??".to_string();
      nullish.left = Some(Box::new(left.clone()));
      nullish.right = Some(Box::new(right.clone()));
      nullish.start = left.start;
      nullish.line = left.line;
      nullish.col = left.col;
      left = nullish.clone();
    }
    return left.clone();
  }
  fn parseBinary(&mut self, ) -> TSNode {
    let mut left : TSNode = self.parseUnary();
    let mut tokVal : String = self.peekValue();
    while (((((((tokVal == "+".to_string()) || (tokVal == "-".to_string())) || (tokVal == "*".to_string())) || (tokVal == "/".to_string())) || (tokVal == "===".to_string())) || (tokVal == "!==".to_string())) || (tokVal == "<".to_string())) || (tokVal == ">".to_string()) {
      let mut opTok : Token = self.peek();
      self.advance();
      let mut right : TSNode = self.parseUnary();
      let mut binExpr : TSNode = TSNode::new();
      binExpr.nodeType = "BinaryExpression".to_string();
      binExpr.value = opTok.value.clone();
      binExpr.left = Some(Box::new(left.clone()));
      binExpr.right = Some(Box::new(right.clone()));
      binExpr.start = left.start;
      binExpr.line = left.line;
      binExpr.col = left.col;
      left = binExpr.clone();
      tokVal = self.peekValue();
    }
    return left.clone();
  }
  fn parseUnary(&mut self, ) -> TSNode {
    let tokVal : String = self.peekValue();
    if  (tokVal == "!".to_string()) || (tokVal == "-".to_string()) {
      let mut opTok : Token = self.peek();
      self.advance();
      let mut arg : TSNode = self.parseUnary();
      let mut unary : TSNode = TSNode::new();
      unary.nodeType = "UnaryExpression".to_string();
      unary.value = opTok.value.clone();
      unary.left = Some(Box::new(arg.clone()));
      unary.start = opTok.start;
      unary.line = opTok.line;
      unary.col = opTok.col;
      return unary.clone();
    }
    if  tokVal == "await".to_string() {
      let mut awaitTok : Token = self.peek();
      self.advance();
      let mut arg_1 : TSNode = self.parseUnary();
      let mut awaitExpr : TSNode = TSNode::new();
      awaitExpr.nodeType = "AwaitExpression".to_string();
      awaitExpr.left = Some(Box::new(arg_1.clone()));
      awaitExpr.start = awaitTok.start;
      awaitExpr.line = awaitTok.line;
      awaitExpr.col = awaitTok.col;
      return awaitExpr.clone();
    }
    if  tokVal == "<".to_string() {
      let mut startTok : Token = self.peek();
      self.advance();
      let nextType : String = self.peekType();
      if  ((nextType == "Identifier".to_string()) || (nextType == "Keyword".to_string())) || (nextType == "TSType".to_string()) {
        let mut typeNode : TSNode = self.parseType();
        if  self.matchValue(">".to_string()) {
          self.advance();
          let mut arg_2 : TSNode = self.parseUnary();
          let mut assertion : TSNode = TSNode::new();
          assertion.nodeType = "TSTypeAssertion".to_string();
          assertion.typeAnnotation = Some(Box::new(typeNode.clone()));
          assertion.left = Some(Box::new(arg_2.clone()));
          assertion.start = startTok.start;
          assertion.line = startTok.line;
          assertion.col = startTok.col;
          return assertion.clone();
        }
      }
    }
    return self.parsePostfix().clone();
  }
  fn parsePostfix(&mut self, ) -> TSNode {
    let mut expr : TSNode = self.parsePrimary();
    let mut keepParsing : bool = true;
    while keepParsing {
      let tokVal : String = self.peekValue();
      if  tokVal == "(".to_string() {
        self.advance();
        let mut call : TSNode = TSNode::new();
        call.nodeType = "CallExpression".to_string();
        call.left = Some(Box::new(expr.clone()));
        call.start = expr.start;
        call.line = expr.line;
        call.col = expr.col;
        while (self.matchValue(")".to_string()) == false) && (self.isAtEnd() == false) {
          if  ((call.children.len() as i64)) > 0 {
            self.expectValue(",".to_string());
          }
          let mut arg : TSNode = self.parseExpr();
          call.children.push(arg.clone());
        }
        self.expectValue(")".to_string());
        expr = call.clone();
      }
      if  tokVal == ".".to_string() {
        self.advance();
        let mut propTok : Token = self.expect("Identifier".to_string());
        let mut member : TSNode = TSNode::new();
        member.nodeType = "MemberExpression".to_string();
        member.left = Some(Box::new(expr.clone()));
        member.name = propTok.value.clone();
        member.start = expr.start;
        member.line = expr.line;
        member.col = expr.col;
        expr = member.clone();
      }
      if  tokVal == "?.".to_string() {
        self.advance();
        let nextTokVal : String = self.peekValue();
        if  nextTokVal == "(".to_string() {
          self.advance();
          let mut optCall : TSNode = TSNode::new();
          optCall.nodeType = "OptionalCallExpression".to_string();
          optCall.optional = true;
          optCall.left = Some(Box::new(expr.clone()));
          optCall.start = expr.start;
          optCall.line = expr.line;
          optCall.col = expr.col;
          while (self.matchValue(")".to_string()) == false) && (self.isAtEnd() == false) {
            if  ((optCall.children.len() as i64)) > 0 {
              self.expectValue(",".to_string());
            }
            let mut arg_1 : TSNode = self.parseExpr();
            optCall.children.push(arg_1.clone());
          }
          self.expectValue(")".to_string());
          expr = optCall.clone();
        }
        if  nextTokVal == "[".to_string() {
          self.advance();
          let mut indexExpr : TSNode = self.parseExpr();
          self.expectValue("]".to_string());
          let mut optIndex : TSNode = TSNode::new();
          optIndex.nodeType = "OptionalMemberExpression".to_string();
          optIndex.optional = true;
          optIndex.left = Some(Box::new(expr.clone()));
          optIndex.right = Some(Box::new(indexExpr.clone()));
          optIndex.start = expr.start;
          optIndex.line = expr.line;
          optIndex.col = expr.col;
          expr = optIndex.clone();
        }
        if  self.matchType("Identifier".to_string()) {
          let mut propTok_1 : Token = self.expect("Identifier".to_string());
          let mut optMember : TSNode = TSNode::new();
          optMember.nodeType = "OptionalMemberExpression".to_string();
          optMember.optional = true;
          optMember.left = Some(Box::new(expr.clone()));
          optMember.name = propTok_1.value.clone();
          optMember.start = expr.start;
          optMember.line = expr.line;
          optMember.col = expr.col;
          expr = optMember.clone();
        }
      }
      if  tokVal == "[".to_string() {
        self.advance();
        let mut indexExpr_1 : TSNode = self.parseExpr();
        self.expectValue("]".to_string());
        let mut computed : TSNode = TSNode::new();
        computed.nodeType = "MemberExpression".to_string();
        computed.left = Some(Box::new(expr.clone()));
        computed.right = Some(Box::new(indexExpr_1.clone()));
        computed.start = expr.start;
        computed.line = expr.line;
        computed.col = expr.col;
        expr = computed.clone();
      }
      if  tokVal == "!".to_string() {
        let mut tok : Token = self.peek();
        self.advance();
        let mut nonNull : TSNode = TSNode::new();
        nonNull.nodeType = "TSNonNullExpression".to_string();
        nonNull.left = Some(Box::new(expr.clone()));
        nonNull.start = expr.start;
        nonNull.line = expr.line;
        nonNull.col = tok.col;
        expr = nonNull.clone();
      }
      if  tokVal == "as".to_string() {
        self.advance();
        let mut asType : TSNode = self.parseType();
        let mut assertion : TSNode = TSNode::new();
        assertion.nodeType = "TSAsExpression".to_string();
        assertion.left = Some(Box::new(expr.clone()));
        assertion.typeAnnotation = Some(Box::new(asType.clone()));
        assertion.start = expr.start;
        assertion.line = expr.line;
        assertion.col = expr.col;
        expr = assertion.clone();
      }
      if  tokVal == "satisfies".to_string() {
        self.advance();
        let mut satisfiesType : TSNode = self.parseType();
        let mut satisfiesExpr : TSNode = TSNode::new();
        satisfiesExpr.nodeType = "TSSatisfiesExpression".to_string();
        satisfiesExpr.left = Some(Box::new(expr.clone()));
        satisfiesExpr.typeAnnotation = Some(Box::new(satisfiesType.clone()));
        satisfiesExpr.start = expr.start;
        satisfiesExpr.line = expr.line;
        satisfiesExpr.col = expr.col;
        expr = satisfiesExpr.clone();
      }
      let newTokVal : String = self.peekValue();
      if  ((((((newTokVal != "(".to_string()) && (newTokVal != ".".to_string())) && (newTokVal != "?.".to_string())) && (newTokVal != "[".to_string())) && (newTokVal != "!".to_string())) && (newTokVal != "as".to_string())) && (newTokVal != "satisfies".to_string()) {
        keepParsing = false;
      }
    }
    return expr.clone();
  }
  fn parsePrimary(&mut self, ) -> TSNode {
    let tokType : String = self.peekType();
    let tokVal : String = self.peekValue();
    let mut tok : Token = self.peek();
    if  tokType == "Identifier".to_string() {
      self.advance();
      let mut id : TSNode = TSNode::new();
      id.nodeType = "Identifier".to_string();
      id.name = tok.value.clone();
      id.start = tok.start;
      id.end = tok.end;
      id.line = tok.line;
      id.col = tok.col;
      return id.clone();
    }
    if  tokType == "Number".to_string() {
      self.advance();
      let mut num : TSNode = TSNode::new();
      num.nodeType = "NumericLiteral".to_string();
      num.value = tok.value.clone();
      num.start = tok.start;
      num.end = tok.end;
      num.line = tok.line;
      num.col = tok.col;
      return num.clone();
    }
    if  tokType == "String".to_string() {
      self.advance();
      let mut str : TSNode = TSNode::new();
      str.nodeType = "StringLiteral".to_string();
      str.value = tok.value.clone();
      str.start = tok.start;
      str.end = tok.end;
      str.line = tok.line;
      str.col = tok.col;
      return str.clone();
    }
    if  tokType == "Template".to_string() {
      return self.parseTemplateLiteral().clone();
    }
    if  (tokVal == "true".to_string()) || (tokVal == "false".to_string()) {
      self.advance();
      let mut r#bool : TSNode = TSNode::new();
      r#bool.nodeType = "BooleanLiteral".to_string();
      r#bool.value = tokVal.clone();
      r#bool.start = tok.start;
      r#bool.end = tok.end;
      r#bool.line = tok.line;
      r#bool.col = tok.col;
      return r#bool.clone();
    }
    if  tokVal == "null".to_string() {
      self.advance();
      let mut nullLit : TSNode = TSNode::new();
      nullLit.nodeType = "NullLiteral".to_string();
      nullLit.start = tok.start;
      nullLit.end = tok.end;
      nullLit.line = tok.line;
      nullLit.col = tok.col;
      return nullLit.clone();
    }
    if  tokVal == "undefined".to_string() {
      self.advance();
      let mut undefId : TSNode = TSNode::new();
      undefId.nodeType = "Identifier".to_string();
      undefId.name = "undefined".to_string();
      undefId.start = tok.start;
      undefId.end = tok.end;
      undefId.line = tok.line;
      undefId.col = tok.col;
      return undefId.clone();
    }
    if  tokVal == "[".to_string() {
      return self.parseArrayLiteral().clone();
    }
    if  tokVal == "{".to_string() {
      return self.parseObjectLiteral().clone();
    }
    if  (self.tsxMode == true) && (tokVal == "<".to_string()) {
      let nextType : String = self.peekNextType();
      let nextVal : String = self.peekNextValue();
      if  nextVal == ">".to_string() {
        return self.parseJSXFragment().clone();
      }
      if  (nextType == "Identifier".to_string()) || (nextType == "Keyword".to_string()) {
        return self.parseJSXElement().clone();
      }
    }
    if  tokVal == "(".to_string() {
      return self.parseParenOrArrow().clone();
    }
    if  tokVal == "async".to_string() {
      let nextVal_1 : String = self.peekNextValue();
      let nextType_1 : String = self.peekNextType();
      if  (nextVal_1 == "(".to_string()) || (nextType_1 == "Identifier".to_string()) {
        return self.parseArrowFunction().clone();
      }
    }
    if  tokVal == "new".to_string() {
      return self.parseNewExpression().clone();
    }
    if  tokVal == "this".to_string() {
      self.advance();
      let mut thisExpr : TSNode = TSNode::new();
      thisExpr.nodeType = "ThisExpression".to_string();
      thisExpr.start = tok.start;
      thisExpr.end = tok.end;
      thisExpr.line = tok.line;
      thisExpr.col = tok.col;
      return thisExpr.clone();
    }
    if  self.quiet == false {
      println!( "{}", format!("{}{}", "Unexpected token: ".to_string(), tokVal) );
    }
    self.advance();
    let mut errId : TSNode = TSNode::new();
    errId.nodeType = "Identifier".to_string();
    errId.name = "error".to_string();
    return errId.clone();
  }
  fn parseTemplateLiteral(&mut self, ) -> TSNode {
    let mut node : TSNode = TSNode::new();
    node.nodeType = "TemplateLiteral".to_string();
    let mut tok : Token = self.peek();
    node.start = tok.start;
    node.line = tok.line;
    node.col = tok.col;
    self.advance();
    let mut quasi : TSNode = TSNode::new();
    quasi.nodeType = "TemplateElement".to_string();
    quasi.value = tok.value.clone();
    node.children.push(quasi.clone());
    return node.clone();
  }
  fn parseArrayLiteral(&mut self, ) -> TSNode {
    let mut node : TSNode = TSNode::new();
    node.nodeType = "ArrayExpression".to_string();
    let mut tok : Token = self.peek();
    node.start = tok.start;
    node.line = tok.line;
    node.col = tok.col;
    self.expectValue("[".to_string());
    while (self.matchValue("]".to_string()) == false) && (self.isAtEnd() == false) {
      if  self.matchValue("...".to_string()) {
        self.advance();
        let mut spreadArg : TSNode = self.parseExpr();
        let mut spread : TSNode = TSNode::new();
        spread.nodeType = "SpreadElement".to_string();
        spread.left = Some(Box::new(spreadArg.clone()));
        node.children.push(spread.clone());
      } else {
        if  self.matchValue(",".to_string()) {
        } else {
          let mut elem : TSNode = self.parseExpr();
          node.children.push(elem.clone());
        }
      }
      if  self.matchValue(",".to_string()) {
        self.advance();
      }
    }
    self.expectValue("]".to_string());
    return node.clone();
  }
  fn parseObjectLiteral(&mut self, ) -> TSNode {
    let mut node : TSNode = TSNode::new();
    node.nodeType = "ObjectExpression".to_string();
    let mut tok : Token = self.peek();
    node.start = tok.start;
    node.line = tok.line;
    node.col = tok.col;
    self.expectValue("{".to_string());
    while (self.matchValue("}".to_string()) == false) && (self.isAtEnd() == false) {
      if  self.matchValue("...".to_string()) {
        self.advance();
        let mut spreadArg : TSNode = self.parseExpr();
        let mut spread : TSNode = TSNode::new();
        spread.nodeType = "SpreadElement".to_string();
        spread.left = Some(Box::new(spreadArg.clone()));
        node.children.push(spread.clone());
      } else {
        let mut prop : TSNode = TSNode::new();
        prop.nodeType = "Property".to_string();
        let mut keyTok : Token = self.peek();
        if  self.matchType("Identifier".to_string()) {
          prop.name = keyTok.value.clone();
          self.advance();
        }
        if  self.matchType("String".to_string()) {
          prop.name = keyTok.value.clone();
          self.advance();
        }
        if  self.matchType("Number".to_string()) {
          prop.name = keyTok.value.clone();
          self.advance();
        }
        if  self.matchValue(":".to_string()) {
          self.advance();
          let mut valueExpr : TSNode = self.parseExpr();
          prop.left = Some(Box::new(valueExpr.clone()));
        } else {
          let mut shorthandVal : TSNode = TSNode::new();
          shorthandVal.nodeType = "Identifier".to_string();
          shorthandVal.name = prop.name.clone();
          prop.left = Some(Box::new(shorthandVal.clone()));
          prop.kind = "shorthand".to_string();
        }
        node.children.push(prop.clone());
      }
      if  self.matchValue(",".to_string()) {
        self.advance();
      }
    }
    self.expectValue("}".to_string());
    return node.clone();
  }
  fn parseParenOrArrow(&mut self, ) -> TSNode {
    /** unused:  let mut startTok : Token = self.peek();   **/ 
    let savedPos : i64 = self.pos;
    let mut savedTok : Token = self.currentToken.clone().unwrap();
    self.advance();
    let mut parenDepth : i64 = 1;
    while (parenDepth > 0) && (self.isAtEnd() == false) {
      let v : String = self.peekValue();
      if  v == "(".to_string() {
        parenDepth = parenDepth + 1;
      }
      if  v == ")".to_string() {
        parenDepth = parenDepth - 1;
      }
      if  parenDepth > 0 {
        self.advance();
      }
    }
    if  self.matchValue(")".to_string()) == false {
      self.pos = savedPos;
      self.currentToken = Some(savedTok.clone());
      self.advance();
      let mut expr : TSNode = self.parseExpr();
      self.expectValue(")".to_string());
      return expr.clone();
    }
    self.advance();
    if  self.matchValue(":".to_string()) {
      self.advance();
      self.parseType();
    }
    if  self.matchValue("=>".to_string()) {
      self.pos = savedPos;
      self.currentToken = Some(savedTok.clone());
      return self.parseArrowFunction().clone();
    }
    self.pos = savedPos;
    self.currentToken = Some(savedTok.clone());
    self.advance();
    let mut expr_1 : TSNode = self.parseExpr();
    self.expectValue(")".to_string());
    return expr_1.clone();
  }
  fn parseArrowFunction(&mut self, ) -> TSNode {
    let mut node : TSNode = TSNode::new();
    node.nodeType = "ArrowFunctionExpression".to_string();
    let mut startTok : Token = self.peek();
    node.start = startTok.start;
    node.line = startTok.line;
    node.col = startTok.col;
    if  self.matchValue("async".to_string()) {
      self.advance();
      node.kind = "async".to_string();
    }
    if  self.matchValue("(".to_string()) {
      self.advance();
      while (self.matchValue(")".to_string()) == false) && (self.isAtEnd() == false) {
        if  ((node.params.len() as i64)) > 0 {
          self.expectValue(",".to_string());
        }
        let mut param : TSNode = self.parseParam();
        node.params.push(param.clone());
      }
      self.expectValue(")".to_string());
    } else {
      let mut paramTok : Token = self.expect("Identifier".to_string());
      let mut param_1 : TSNode = TSNode::new();
      param_1.nodeType = "Parameter".to_string();
      param_1.name = paramTok.value.clone();
      node.params.push(param_1.clone());
    }
    if  self.matchValue(":".to_string()) {
      self.advance();
      let mut retType : TSNode = self.parseType();
      node.typeAnnotation = Some(Box::new(retType.clone()));
    }
    self.expectValue("=>".to_string());
    if  self.matchValue("{".to_string()) {
      let mut body : TSNode = self.parseBlock();
      node.body = Some(Box::new(body.clone()));
    } else {
      let mut body_1 : TSNode = self.parseExpr();
      node.body = Some(Box::new(body_1.clone()));
    }
    return node.clone();
  }
  fn parseNewExpression(&mut self, ) -> TSNode {
    let mut node : TSNode = TSNode::new();
    node.nodeType = "NewExpression".to_string();
    let mut tok : Token = self.peek();
    node.start = tok.start;
    node.line = tok.line;
    node.col = tok.col;
    self.expectValue("new".to_string());
    let mut callee : TSNode = self.parsePrimary();
    node.left = Some(Box::new(callee.clone()));
    if  self.matchValue("<".to_string()) {
      let mut depth : i64 = 1;
      self.advance();
      while (depth > 0) && (self.isAtEnd() == false) {
        let v : String = self.peekValue();
        if  v == "<".to_string() {
          depth = depth + 1;
        }
        if  v == ">".to_string() {
          depth = depth - 1;
        }
        self.advance();
      }
    }
    if  self.matchValue("(".to_string()) {
      self.advance();
      while (self.matchValue(")".to_string()) == false) && (self.isAtEnd() == false) {
        if  ((node.children.len() as i64)) > 0 {
          self.expectValue(",".to_string());
        }
        let mut arg : TSNode = self.parseExpr();
        node.children.push(arg.clone());
      }
      self.expectValue(")".to_string());
    }
    return node.clone();
  }
  fn peekNextType(&mut self, ) -> String {
    let nextPos : i64 = self.pos + 1;
    if  nextPos < ((self.tokens.len() as i64)) {
      let mut nextTok : Token = self.tokens[nextPos as usize].clone();
      return nextTok.tokenType.clone();
    }
    return "EOF".to_string().clone();
  }
  fn parseJSXElement(&mut self, ) -> TSNode {
    let mut node : TSNode = TSNode::new();
    node.nodeType = "JSXElement".to_string();
    let mut tok : Token = self.peek();
    node.start = tok.start;
    node.line = tok.line;
    node.col = tok.col;
    let mut opening : TSNode = self.parseJSXOpeningElement();
    node.left = Some(Box::new(opening.clone()));
    if  opening.kind == "self-closing".to_string() {
      node.nodeType = "JSXElement".to_string();
      return node.clone();
    }
    /** unused:  let tagName : String = opening.name.clone();   **/ 
    while self.isAtEnd() == false {
      let v : String = self.peekValue();
      if  v == "<".to_string() {
        let nextVal : String = self.peekNextValue();
        if  nextVal == "/".to_string() {
          break;
        }
        let mut child : TSNode = self.parseJSXElement();
        node.children.push(child.clone());
      } else {
        if  v == "{".to_string() {
          let mut exprChild : TSNode = self.parseJSXExpressionContainer();
          node.children.push(exprChild.clone());
        } else {
          let t : String = self.peekType();
          if  ((t != "EOF".to_string()) && (v != "<".to_string())) && (v != "{".to_string()) {
            let mut textChild : TSNode = self.parseJSXText();
            node.children.push(textChild.clone());
          } else {
            break;
          }
        }
      }
    }
    let mut closing : TSNode = self.parseJSXClosingElement();
    node.right = Some(Box::new(closing.clone()));
    return node.clone();
  }
  fn parseJSXOpeningElement(&mut self, ) -> TSNode {
    let mut node : TSNode = TSNode::new();
    node.nodeType = "JSXOpeningElement".to_string();
    let mut tok : Token = self.peek();
    node.start = tok.start;
    node.line = tok.line;
    node.col = tok.col;
    self.expectValue("<".to_string());
    let mut tagName : TSNode = self.parseJSXElementName();
    node.name = tagName.name.clone();
    node.left = Some(Box::new(tagName.clone()));
    while self.isAtEnd() == false {
      let v : String = self.peekValue();
      if  (v == ">".to_string()) || (v == "/".to_string()) {
        break;
      }
      let mut attr : TSNode = self.parseJSXAttribute();
      node.children.push(attr.clone());
    }
    if  self.matchValue("/".to_string()) {
      self.advance();
      node.kind = "self-closing".to_string();
    }
    self.expectValue(">".to_string());
    return node.clone();
  }
  fn parseJSXClosingElement(&mut self, ) -> TSNode {
    let mut node : TSNode = TSNode::new();
    node.nodeType = "JSXClosingElement".to_string();
    let mut tok : Token = self.peek();
    node.start = tok.start;
    node.line = tok.line;
    node.col = tok.col;
    self.expectValue("<".to_string());
    self.expectValue("/".to_string());
    let mut tagName : TSNode = self.parseJSXElementName();
    node.name = tagName.name.clone();
    node.left = Some(Box::new(tagName.clone()));
    self.expectValue(">".to_string());
    return node.clone();
  }
  fn parseJSXElementName(&mut self, ) -> TSNode {
    let mut node : TSNode = TSNode::new();
    node.nodeType = "JSXIdentifier".to_string();
    let mut tok : Token = self.peek();
    node.start = tok.start;
    node.line = tok.line;
    node.col = tok.col;
    let mut namePart : String = tok.value.clone();
    self.advance();
    while self.matchValue(".".to_string()) {
      self.advance();
      let mut nextTok : Token = self.peek();
      namePart = format!("{}{}", (format!("{}{}", namePart, ".".to_string())), nextTok.value);
      self.advance();
      node.nodeType = "JSXMemberExpression".to_string();
    }
    node.name = namePart.clone();
    return node.clone();
  }
  fn parseJSXAttribute(&mut self, ) -> TSNode {
    let mut node : TSNode = TSNode::new();
    node.nodeType = "JSXAttribute".to_string();
    let mut tok : Token = self.peek();
    node.start = tok.start;
    node.line = tok.line;
    node.col = tok.col;
    if  self.matchValue("{".to_string()) {
      self.advance();
      if  self.matchValue("...".to_string()) {
        self.advance();
        node.nodeType = "JSXSpreadAttribute".to_string();
        let mut arg : TSNode = self.parseExpr();
        node.left = Some(Box::new(arg.clone()));
        self.expectValue("}".to_string());
        return node.clone();
      }
    }
    let attrName : String = tok.value.clone();
    node.name = attrName.clone();
    self.advance();
    if  self.matchValue("=".to_string()) {
      self.advance();
      let valTok : String = self.peekValue();
      if  valTok == "{".to_string() {
        let mut exprValue : TSNode = self.parseJSXExpressionContainer();
        node.right = Some(Box::new(exprValue.clone()));
      } else {
        let mut strTok : Token = self.peek();
        let mut strNode : TSNode = TSNode::new();
        strNode.nodeType = "StringLiteral".to_string();
        strNode.value = strTok.value.clone();
        strNode.start = strTok.start;
        strNode.end = strTok.end;
        strNode.line = strTok.line;
        strNode.col = strTok.col;
        self.advance();
        node.right = Some(Box::new(strNode.clone()));
      }
    }
    return node.clone();
  }
  fn parseJSXExpressionContainer(&mut self, ) -> TSNode {
    let mut node : TSNode = TSNode::new();
    node.nodeType = "JSXExpressionContainer".to_string();
    let mut tok : Token = self.peek();
    node.start = tok.start;
    node.line = tok.line;
    node.col = tok.col;
    self.expectValue("{".to_string());
    if  self.matchValue("}".to_string()) {
      let mut empty : TSNode = TSNode::new();
      empty.nodeType = "JSXEmptyExpression".to_string();
      node.left = Some(Box::new(empty.clone()));
    } else {
      let mut expr : TSNode = self.parseExpr();
      node.left = Some(Box::new(expr.clone()));
    }
    self.expectValue("}".to_string());
    return node.clone();
  }
  fn parseJSXText(&mut self, ) -> TSNode {
    let mut node : TSNode = TSNode::new();
    node.nodeType = "JSXText".to_string();
    let mut tok : Token = self.peek();
    node.start = tok.start;
    node.line = tok.line;
    node.col = tok.col;
    node.value = tok.value.clone();
    self.advance();
    return node.clone();
  }
  fn parseJSXFragment(&mut self, ) -> TSNode {
    let mut node : TSNode = TSNode::new();
    node.nodeType = "JSXFragment".to_string();
    let mut tok : Token = self.peek();
    node.start = tok.start;
    node.line = tok.line;
    node.col = tok.col;
    self.expectValue("<".to_string());
    self.expectValue(">".to_string());
    while self.isAtEnd() == false {
      let v : String = self.peekValue();
      if  v == "<".to_string() {
        let nextVal : String = self.peekNextValue();
        if  nextVal == "/".to_string() {
          break;
        }
        let mut child : TSNode = self.parseJSXElement();
        node.children.push(child.clone());
      } else {
        if  v == "{".to_string() {
          let mut exprChild : TSNode = self.parseJSXExpressionContainer();
          node.children.push(exprChild.clone());
        } else {
          let t : String = self.peekType();
          if  ((t != "EOF".to_string()) && (v != "<".to_string())) && (v != "{".to_string()) {
            let mut textChild : TSNode = self.parseJSXText();
            node.children.push(textChild.clone());
          } else {
            break;
          }
        }
      }
    }
    self.expectValue("<".to_string());
    self.expectValue("/".to_string());
    self.expectValue(">".to_string());
    return node.clone();
  }
}
#[derive(Clone)]
struct TSParserMain { 
}
impl TSParserMain { 
  
  pub fn new() ->  TSParserMain {
    let mut me = TSParserMain { 
    };
    return me;
  }
  pub fn showHelp() -> () {
    println!( "{}", "TypeScript Parser".to_string() );
    println!( "{}", "".to_string() );
    println!( "{}", "Usage: node ts_parser_main.js [options]".to_string() );
    println!( "{}", "".to_string() );
    println!( "{}", "Options:".to_string() );
    println!( "{}", "  -h, --help          Show this help message".to_string() );
    println!( "{}", "  -d                  Run built-in demo/test suite".to_string() );
    println!( "{}", "  -i <file>           Input TypeScript file to parse".to_string() );
    println!( "{}", "  --tokens            Show tokens in addition to AST".to_string() );
    println!( "{}", "  --show-interfaces   List all interfaces in the file".to_string() );
    println!( "{}", "  --show-types        List all type aliases in the file".to_string() );
    println!( "{}", "  --show-functions    List all functions in the file".to_string() );
    println!( "{}", "".to_string() );
    println!( "{}", "Examples:".to_string() );
    println!( "{}", "  node ts_parser_main.js -d                              Run the demo".to_string() );
    println!( "{}", "  node ts_parser_main.js -i script.ts                    Parse and show AST".to_string() );
    println!( "{}", "  node ts_parser_main.js -i script.ts --tokens           Also show tokens".to_string() );
    println!( "{}", "  node ts_parser_main.js -i script.ts --show-interfaces  List interfaces".to_string() );
  }
  pub fn listDeclarations(filename : String, showInterfaces : bool, showTypes : bool, showFunctions : bool) -> () {
    let codeOpt : Option<String> = r_read_file(&".".to_string(), &filename);
    if  codeOpt.is_none() {
      println!( "{}", format!("{}{}", "Error: Could not read file: ".to_string(), filename) );
      return;
    }
    let code : String = codeOpt.unwrap();
    let mut lexer : TSLexer = TSLexer::new(code.clone());
    let mut tokens : Vec<Token> = lexer.tokenize();
    let mut parser : TSParserSimple = TSParserSimple::new();
    parser.initParser(tokens);
    parser.setQuiet(true);
    let mut program : TSNode = parser.parseProgram();
    if  showInterfaces {
      println!( "{}", format!("{}{}", (format!("{}{}", "=== Interfaces in ".to_string(), filename)), " ===".to_string()) );
      println!( "{}", "".to_string() );
      TSParserMain::listInterfaces(program.clone());
      println!( "{}", "".to_string() );
    }
    if  showTypes {
      println!( "{}", format!("{}{}", (format!("{}{}", "=== Type Aliases in ".to_string(), filename)), " ===".to_string()) );
      println!( "{}", "".to_string() );
      TSParserMain::listTypeAliases(program.clone());
      println!( "{}", "".to_string() );
    }
    if  showFunctions {
      println!( "{}", format!("{}{}", (format!("{}{}", "=== Functions in ".to_string(), filename)), " ===".to_string()) );
      println!( "{}", "".to_string() );
      TSParserMain::listFunctions(program.clone());
      println!( "{}", "".to_string() );
    }
  }
  pub fn listInterfaces(mut program : TSNode) -> () {
    let mut count : i64 = 0;
    for idx in 0..program.children.len() {
      let mut stmt = program.children[idx as usize].clone();
      if  stmt.nodeType == "TSInterfaceDeclaration".to_string() {
        count = count + 1;
        let line : String = ["".to_string() , (stmt.line.to_string()) ].join("");
        let mut props : i64 = 0;
        if  stmt.body.is_some() {
          let mut body : TSNode = (*stmt.body.clone().unwrap());
          props = (body.children.len() as i64);
        }
        println!( "{}", format!("{}{}", (format!("{}{}", (format!("{}{}", ([(format!("{}{}", (format!("{}{}", "  ".to_string(), stmt.name)), " (".to_string())) , (props.to_string()) ].join("")), " properties) [line ".to_string())), line)), "]".to_string()) );
        if  stmt.body.is_some() {
          let mut bodyNode : TSNode = (*stmt.body.clone().unwrap());
          for mi in 0..bodyNode.children.len() {
            let mut member = bodyNode.children[mi as usize].clone();
            if  member.nodeType == "TSPropertySignature".to_string() {
              let mut propInfo : String = format!("{}{}", "    - ".to_string(), member.name);
              if  member.optional {
                propInfo = format!("{}{}", propInfo, "?".to_string());
              }
              if  member.readonly {
                propInfo = format!("{}{}", "    - readonly ".to_string(), member.name);
                if  member.optional {
                  propInfo = format!("{}{}", propInfo, "?".to_string());
                }
              }
              if  member.typeAnnotation.is_some() {
                let mut typeNode : TSNode = (*member.typeAnnotation.clone().unwrap());
                if  typeNode.typeAnnotation.is_some() {
                  let mut innerType : TSNode = (*typeNode.typeAnnotation.clone().unwrap());
                  propInfo = format!("{}{}", (format!("{}{}", propInfo, ": ".to_string())), TSParserMain::getTypeName(innerType.clone()));
                }
              }
              println!( "{}", propInfo );
            }
          }
        }
      }
    }
    println!( "{}", "".to_string() );
    println!( "{}", format!("{}{}", (["Total: ".to_string() , (count.to_string()) ].join("")), " interface(s)".to_string()) );
  }
  pub fn listTypeAliases(mut program : TSNode) -> () {
    let mut count : i64 = 0;
    for idx in 0..program.children.len() {
      let mut stmt = program.children[idx as usize].clone();
      if  stmt.nodeType == "TSTypeAliasDeclaration".to_string() {
        count = count + 1;
        let line : String = ["".to_string() , (stmt.line.to_string()) ].join("");
        let mut typeInfo : String = format!("{}{}", "  ".to_string(), stmt.name);
        if  stmt.typeAnnotation.is_some() {
          let mut typeNode : TSNode = (*stmt.typeAnnotation.clone().unwrap());
          typeInfo = format!("{}{}", (format!("{}{}", typeInfo, " = ".to_string())), TSParserMain::getTypeName(typeNode.clone()));
        }
        typeInfo = format!("{}{}", (format!("{}{}", (format!("{}{}", typeInfo, " [line ".to_string())), line)), "]".to_string());
        println!( "{}", typeInfo );
      }
    }
    println!( "{}", "".to_string() );
    println!( "{}", format!("{}{}", (["Total: ".to_string() , (count.to_string()) ].join("")), " type alias(es)".to_string()) );
  }
  pub fn listFunctions(mut program : TSNode) -> () {
    let mut count : i64 = 0;
    for idx in 0..program.children.len() {
      let mut stmt = program.children[idx as usize].clone();
      if  stmt.nodeType == "FunctionDeclaration".to_string() {
        count = count + 1;
        let line : String = ["".to_string() , (stmt.line.to_string()) ].join("");
        let mut funcInfo : String = format!("{}{}", (format!("{}{}", "  ".to_string(), stmt.name)), "(".to_string());
        /** unused:  let paramCount : i64 = (stmt.params.len() as i64);   **/ 
        let mut pi : i64 = 0;
        for paramIdx in 0..stmt.params.len() {
          let mut param = stmt.params[paramIdx as usize].clone();
          if  pi > 0 {
            funcInfo = format!("{}{}", funcInfo, ", ".to_string());
          }
          funcInfo = format!("{}{}", funcInfo, param.name);
          if  param.optional {
            funcInfo = format!("{}{}", funcInfo, "?".to_string());
          }
          if  param.typeAnnotation.is_some() {
            let mut paramType : TSNode = (*param.typeAnnotation.clone().unwrap());
            if  paramType.typeAnnotation.is_some() {
              let mut innerType : TSNode = (*paramType.typeAnnotation.clone().unwrap());
              funcInfo = format!("{}{}", (format!("{}{}", funcInfo, ": ".to_string())), TSParserMain::getTypeName(innerType.clone()));
            }
          }
          pi = pi + 1;
        }
        funcInfo = format!("{}{}", funcInfo, ")".to_string());
        if  stmt.typeAnnotation.is_some() {
          let mut retType : TSNode = (*stmt.typeAnnotation.clone().unwrap());
          if  retType.typeAnnotation.is_some() {
            let mut innerRet : TSNode = (*retType.typeAnnotation.clone().unwrap());
            funcInfo = format!("{}{}", (format!("{}{}", funcInfo, ": ".to_string())), TSParserMain::getTypeName(innerRet.clone()));
          }
        }
        funcInfo = format!("{}{}", (format!("{}{}", (format!("{}{}", funcInfo, " [line ".to_string())), line)), "]".to_string());
        println!( "{}", funcInfo );
      }
    }
    println!( "{}", "".to_string() );
    println!( "{}", format!("{}{}", (["Total: ".to_string() , (count.to_string()) ].join("")), " function(s)".to_string()) );
  }
  pub fn getTypeName(mut typeNode : TSNode) -> String {
    let nodeType : String = typeNode.nodeType.clone();
    if  nodeType == "TSStringKeyword".to_string() {
      return "string".to_string().clone();
    }
    if  nodeType == "TSNumberKeyword".to_string() {
      return "number".to_string().clone();
    }
    if  nodeType == "TSBooleanKeyword".to_string() {
      return "boolean".to_string().clone();
    }
    if  nodeType == "TSAnyKeyword".to_string() {
      return "any".to_string().clone();
    }
    if  nodeType == "TSVoidKeyword".to_string() {
      return "void".to_string().clone();
    }
    if  nodeType == "TSNullKeyword".to_string() {
      return "null".to_string().clone();
    }
    if  nodeType == "TSUndefinedKeyword".to_string() {
      return "undefined".to_string().clone();
    }
    if  nodeType == "TSTypeReference".to_string() {
      let mut result : String = typeNode.name.clone();
      if  ((typeNode.params.len() as i64)) > 0 {
        result = format!("{}{}", result, "<".to_string());
        let mut gi : i64 = 0;
        for gpIdx in 0..typeNode.params.len() {
          let mut gp = typeNode.params[gpIdx as usize].clone();
          if  gi > 0 {
            result = format!("{}{}", result, ", ".to_string());
          }
          result = format!("{}{}", result, TSParserMain::getTypeName(gp.clone()));
          gi = gi + 1;
        }
        result = format!("{}{}", result, ">".to_string());
      }
      return result.clone();
    }
    if  nodeType == "TSUnionType".to_string() {
      let mut result_1 : String = "".to_string();
      let mut ui : i64 = 0;
      for utIdx in 0..typeNode.children.len() {
        let mut ut = typeNode.children[utIdx as usize].clone();
        if  ui > 0 {
          result_1 = format!("{}{}", result_1, " | ".to_string());
        }
        result_1 = format!("{}{}", result_1, TSParserMain::getTypeName(ut.clone()));
        ui = ui + 1;
      }
      return result_1.clone();
    }
    return nodeType.clone();
  }
  pub fn parseFile(filename : String, showTokens : bool) -> () {
    let codeOpt : Option<String> = r_read_file(&".".to_string(), &filename);
    if  codeOpt.is_none() {
      println!( "{}", format!("{}{}", "Error: Could not read file: ".to_string(), filename) );
      return;
    }
    let code : String = codeOpt.unwrap();
    println!( "{}", format!("{}{}", (format!("{}{}", "=== Parsing: ".to_string(), filename)), " ===".to_string()) );
    println!( "{}", "".to_string() );
    let mut lexer : TSLexer = TSLexer::new(code.clone());
    let mut tokens : Vec<Token> = lexer.tokenize();
    if  showTokens {
      println!( "{}", "--- Tokens ---".to_string() );
      for ti in 0..tokens.len() {
        let mut tok = tokens[ti as usize].clone();
        let output : String = format!("{}{}", (format!("{}{}", (format!("{}{}", tok.tokenType, ": '".to_string())), tok.value)), "'".to_string());
        println!( "{}", output );
      }
      println!( "{}", "".to_string() );
    }
    let mut parser : TSParserSimple = TSParserSimple::new();
    parser.initParser(tokens);
    let mut program : TSNode = parser.parseProgram();
    println!( "{}", "--- AST ---".to_string() );
    println!( "{}", format!("{}{}", (["Program with ".to_string() , (((program.children.len() as i64)).to_string()) ].join("")), " statements:".to_string()) );
    println!( "{}", "".to_string() );
    for idx in 0..program.children.len() {
      let mut stmt = program.children[idx as usize].clone();
      TSParserMain::printNode(stmt.clone(), 0);
    }
  }
  pub fn runDemo() -> () {
    let code : String = "\r\ninterface Person {\r\n  readonly id: number;\r\n  name: string;\r\n  age?: number;\r\n}\r\n\r\ntype ID = string | number;\r\n\r\ntype Result = Person | null;\r\n\r\nlet count: number = 42;\r\n\r\nconst message: string = 'hello';\r\n\r\nfunction greet(name: string, age?: number): string {\r\n  return name;\r\n}\r\n\r\nlet data: Array<string>;\r\n".to_string();
    println!( "{}", "=== TypeScript Parser Demo ===".to_string() );
    println!( "{}", "".to_string() );
    println!( "{}", "Input:".to_string() );
    println!( "{}", code );
    println!( "{}", "".to_string() );
    println!( "{}", "--- Tokens ---".to_string() );
    let mut lexer : TSLexer = TSLexer::new(code.clone());
    let mut tokens : Vec<Token> = lexer.tokenize();
    for i in 0..tokens.len() {
      let mut tok = tokens[i as usize].clone();
      let output : String = format!("{}{}", (format!("{}{}", (format!("{}{}", tok.tokenType, ": '".to_string())), tok.value)), "'".to_string());
      println!( "{}", output );
    }
    println!( "{}", "".to_string() );
    println!( "{}", "--- AST ---".to_string() );
    let mut parser : TSParserSimple = TSParserSimple::new();
    parser.initParser(tokens);
    let mut program : TSNode = parser.parseProgram();
    println!( "{}", format!("{}{}", (["Program with ".to_string() , (((program.children.len() as i64)).to_string()) ].join("")), " statements:".to_string()) );
    println!( "{}", "".to_string() );
    for idx in 0..program.children.len() {
      let mut stmt = program.children[idx as usize].clone();
      TSParserMain::printNode(stmt.clone(), 0);
    }
  }
  pub fn printNode(mut node : TSNode, depth : i64) -> () {
    let mut indent : String = "".to_string();
    let mut i : i64 = 0;
    while i < depth {
      indent = format!("{}{}", indent, "  ".to_string());
      i = i + 1;
    }
    let nodeType : String = node.nodeType.clone();
    let loc : String = format!("{}{}", ([(format!("{}{}", (["[".to_string() , (node.line.to_string()) ].join("")), ":".to_string())) , (node.col.to_string()) ].join("")), "]".to_string());
    if  nodeType == "TSInterfaceDeclaration".to_string() {
      println!( "{}", format!("{}{}", (format!("{}{}", (format!("{}{}", (format!("{}{}", indent, "TSInterfaceDeclaration: ".to_string())), node.name)), " ".to_string())), loc) );
      if  node.body.is_some() {
        TSParserMain::printNode((*node.body.clone().unwrap()), depth + 1);
      }
      return;
    }
    if  nodeType == "TSInterfaceBody".to_string() {
      println!( "{}", format!("{}{}", (format!("{}{}", indent, "TSInterfaceBody ".to_string())), loc) );
      for mi in 0..node.children.len() {
        let mut member = node.children[mi as usize].clone();
        TSParserMain::printNode(member.clone(), depth + 1);
      }
      return;
    }
    if  nodeType == "TSPropertySignature".to_string() {
      let mut modifiers : String = "".to_string();
      if  node.readonly {
        modifiers = "readonly ".to_string();
      }
      if  node.optional {
        modifiers = format!("{}{}", modifiers, "optional ".to_string());
      }
      println!( "{}", format!("{}{}", (format!("{}{}", (format!("{}{}", (format!("{}{}", (format!("{}{}", indent, "TSPropertySignature: ".to_string())), modifiers)), node.name)), " ".to_string())), loc) );
      if  node.typeAnnotation.is_some() {
        TSParserMain::printNode((*node.typeAnnotation.clone().unwrap()), depth + 1);
      }
      return;
    }
    if  nodeType == "TSTypeAliasDeclaration".to_string() {
      println!( "{}", format!("{}{}", (format!("{}{}", (format!("{}{}", (format!("{}{}", indent, "TSTypeAliasDeclaration: ".to_string())), node.name)), " ".to_string())), loc) );
      if  node.typeAnnotation.is_some() {
        TSParserMain::printNode((*node.typeAnnotation.clone().unwrap()), depth + 1);
      }
      return;
    }
    if  nodeType == "TSTypeAnnotation".to_string() {
      println!( "{}", format!("{}{}", (format!("{}{}", indent, "TSTypeAnnotation ".to_string())), loc) );
      if  node.typeAnnotation.is_some() {
        TSParserMain::printNode((*node.typeAnnotation.clone().unwrap()), depth + 1);
      }
      return;
    }
    if  nodeType == "TSUnionType".to_string() {
      println!( "{}", format!("{}{}", (format!("{}{}", indent, "TSUnionType ".to_string())), loc) );
      for ti in 0..node.children.len() {
        let mut typeNode = node.children[ti as usize].clone();
        TSParserMain::printNode(typeNode.clone(), depth + 1);
      }
      return;
    }
    if  nodeType == "TSTypeReference".to_string() {
      println!( "{}", format!("{}{}", (format!("{}{}", (format!("{}{}", (format!("{}{}", indent, "TSTypeReference: ".to_string())), node.name)), " ".to_string())), loc) );
      for pi in 0..node.params.len() {
        let mut param = node.params[pi as usize].clone();
        TSParserMain::printNode(param.clone(), depth + 1);
      }
      return;
    }
    if  nodeType == "TSArrayType".to_string() {
      println!( "{}", format!("{}{}", (format!("{}{}", indent, "TSArrayType ".to_string())), loc) );
      if  node.left.is_some() {
        TSParserMain::printNode((*node.left.clone().unwrap()), depth + 1);
      }
      return;
    }
    if  nodeType == "TSStringKeyword".to_string() {
      println!( "{}", format!("{}{}", (format!("{}{}", indent, "TSStringKeyword ".to_string())), loc) );
      return;
    }
    if  nodeType == "TSNumberKeyword".to_string() {
      println!( "{}", format!("{}{}", (format!("{}{}", indent, "TSNumberKeyword ".to_string())), loc) );
      return;
    }
    if  nodeType == "TSBooleanKeyword".to_string() {
      println!( "{}", format!("{}{}", (format!("{}{}", indent, "TSBooleanKeyword ".to_string())), loc) );
      return;
    }
    if  nodeType == "TSAnyKeyword".to_string() {
      println!( "{}", format!("{}{}", (format!("{}{}", indent, "TSAnyKeyword ".to_string())), loc) );
      return;
    }
    if  nodeType == "TSNullKeyword".to_string() {
      println!( "{}", format!("{}{}", (format!("{}{}", indent, "TSNullKeyword ".to_string())), loc) );
      return;
    }
    if  nodeType == "TSVoidKeyword".to_string() {
      println!( "{}", format!("{}{}", (format!("{}{}", indent, "TSVoidKeyword ".to_string())), loc) );
      return;
    }
    if  nodeType == "VariableDeclaration".to_string() {
      println!( "{}", format!("{}{}", (format!("{}{}", (format!("{}{}", (format!("{}{}", indent, "VariableDeclaration (".to_string())), node.kind)), ") ".to_string())), loc) );
      for di in 0..node.children.len() {
        let mut declarator = node.children[di as usize].clone();
        TSParserMain::printNode(declarator.clone(), depth + 1);
      }
      return;
    }
    if  nodeType == "VariableDeclarator".to_string() {
      println!( "{}", format!("{}{}", (format!("{}{}", (format!("{}{}", (format!("{}{}", indent, "VariableDeclarator: ".to_string())), node.name)), " ".to_string())), loc) );
      if  node.typeAnnotation.is_some() {
        TSParserMain::printNode((*node.typeAnnotation.clone().unwrap()), depth + 1);
      }
      if  node.init.is_some() {
        println!( "{}", format!("{}{}", indent, "  init:".to_string()) );
        TSParserMain::printNode((*node.init.clone().unwrap()), depth + 2);
      }
      return;
    }
    if  nodeType == "FunctionDeclaration".to_string() {
      let mut paramNames : String = "".to_string();
      for pi_1 in 0..node.params.len() {
        let mut p = node.params[pi_1 as usize].clone();
        if  pi_1 > 0 {
          paramNames = format!("{}{}", paramNames, ", ".to_string());
        }
        paramNames = format!("{}{}", paramNames, p.name);
        if  p.optional {
          paramNames = format!("{}{}", paramNames, "?".to_string());
        }
      }
      println!( "{}", format!("{}{}", (format!("{}{}", (format!("{}{}", (format!("{}{}", (format!("{}{}", (format!("{}{}", indent, "FunctionDeclaration: ".to_string())), node.name)), "(".to_string())), paramNames)), ") ".to_string())), loc) );
      if  node.typeAnnotation.is_some() {
        println!( "{}", format!("{}{}", indent, "  returnType:".to_string()) );
        TSParserMain::printNode((*node.typeAnnotation.clone().unwrap()), depth + 2);
      }
      if  node.body.is_some() {
        TSParserMain::printNode((*node.body.clone().unwrap()), depth + 1);
      }
      return;
    }
    if  nodeType == "BlockStatement".to_string() {
      println!( "{}", format!("{}{}", (format!("{}{}", indent, "BlockStatement ".to_string())), loc) );
      for si in 0..node.children.len() {
        let mut stmt = node.children[si as usize].clone();
        TSParserMain::printNode(stmt.clone(), depth + 1);
      }
      return;
    }
    if  nodeType == "ExpressionStatement".to_string() {
      println!( "{}", format!("{}{}", (format!("{}{}", indent, "ExpressionStatement ".to_string())), loc) );
      if  node.left.is_some() {
        TSParserMain::printNode((*node.left.clone().unwrap()), depth + 1);
      }
      return;
    }
    if  nodeType == "ReturnStatement".to_string() {
      println!( "{}", format!("{}{}", (format!("{}{}", indent, "ReturnStatement ".to_string())), loc) );
      if  node.left.is_some() {
        TSParserMain::printNode((*node.left.clone().unwrap()), depth + 1);
      }
      return;
    }
    if  nodeType == "Identifier".to_string() {
      println!( "{}", format!("{}{}", (format!("{}{}", (format!("{}{}", (format!("{}{}", indent, "Identifier: ".to_string())), node.name)), " ".to_string())), loc) );
      return;
    }
    if  nodeType == "NumericLiteral".to_string() {
      println!( "{}", format!("{}{}", (format!("{}{}", (format!("{}{}", (format!("{}{}", indent, "NumericLiteral: ".to_string())), node.value)), " ".to_string())), loc) );
      return;
    }
    if  nodeType == "StringLiteral".to_string() {
      println!( "{}", format!("{}{}", (format!("{}{}", (format!("{}{}", (format!("{}{}", indent, "StringLiteral: ".to_string())), node.value)), " ".to_string())), loc) );
      return;
    }
    println!( "{}", format!("{}{}", (format!("{}{}", (format!("{}{}", indent, nodeType)), " ".to_string())), loc) );
  }
}
fn main() {
  let argCnt : i64 = (std::env::args().len() as i64 - 1);
  if  argCnt == 0 {
    TSParserMain::showHelp();
    return;
  }
  let mut inputFile : String = "".to_string();
  let mut runDefault : bool = false;
  let mut showTokens : bool = false;
  let mut showInterfaces : bool = false;
  let mut showTypes : bool = false;
  let mut showFunctions : bool = false;
  let mut i : i64 = 0;
  while i < argCnt {
    let arg : String = std::env::args().nth((i + 1) as usize).unwrap_or_default();
    if  (arg == "--help".to_string()) || (arg == "-h".to_string()) {
      TSParserMain::showHelp();
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
        if  arg == "--tokens".to_string() {
          showTokens = true;
          i = i + 1;
        } else {
          if  arg == "--show-interfaces".to_string() {
            showInterfaces = true;
            i = i + 1;
          } else {
            if  arg == "--show-types".to_string() {
              showTypes = true;
              i = i + 1;
            } else {
              if  arg == "--show-functions".to_string() {
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
  if  runDefault {
    TSParserMain::runDemo();
    return;
  }
  if  (inputFile.len() as i64) > 0 {
    if  (showInterfaces || showTypes) || showFunctions {
      TSParserMain::listDeclarations(inputFile.clone(), showInterfaces, showTypes, showFunctions);
      return;
    }
    TSParserMain::parseFile(inputFile.clone(), showTokens);
    return;
  }
  TSParserMain::showHelp();
}

fn r_read_file(path: &str, filename: &str) -> Option<String> {
    let full_path = format!("{}/{}", path, filename);
    std::fs::read_to_string(full_path).ok()
}

