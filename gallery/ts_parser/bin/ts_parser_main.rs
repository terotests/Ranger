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
}
impl TSParserSimple { 
  
  pub fn new() ->  TSParserSimple {
    let mut me = TSParserSimple { 
      tokens: Vec::new(), 
      pos:0, 
      currentToken: None, 
      quiet:false, 
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
    if  tokVal == "interface".to_string() {
      return self.parseInterface().clone();
    }
    if  tokVal == "type".to_string() {
      return self.parseTypeAlias().clone();
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
    self.expectValue("=".to_string());
    let mut typeExpr : TSNode = self.parseType();
    node.typeAnnotation = Some(Box::new(typeExpr.clone()));
    if  self.matchValue(";".to_string()) {
      self.advance();
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
    self.expectValue("(".to_string());
    while self.matchValue(")".to_string()) == false {
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
    return self.parseUnionType().clone();
  }
  fn parseUnionType(&mut self, ) -> TSNode {
    let mut left : TSNode = self.parseArrayType();
    if  self.matchValue("|".to_string()) {
      let mut r#union : TSNode = TSNode::new();
      r#union.nodeType = "TSUnionType".to_string();
      r#union.start = left.start;
      r#union.line = left.line;
      r#union.col = left.col;
      r#union.children.push(left.clone());
      while self.matchValue("|".to_string()) {
        self.advance();
        let mut right : TSNode = self.parseArrayType();
        r#union.children.push(right.clone());
      }
      return r#union.clone();
    }
    return left.clone();
  }
  fn parseArrayType(&mut self, ) -> TSNode {
    let mut elemType : TSNode = self.parsePrimaryType();
    while self.matchValue("[".to_string()) && self.checkNext("]".to_string()) {
      self.advance();
      self.advance();
      let mut arrayType : TSNode = TSNode::new();
      arrayType.nodeType = "TSArrayType".to_string();
      arrayType.start = elemType.start;
      arrayType.line = elemType.line;
      arrayType.col = elemType.col;
      arrayType.left = Some(Box::new(elemType.clone()));
      elemType = arrayType.clone();
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
    if  tokVal == "string".to_string() {
      self.advance();
      let mut node : TSNode = TSNode::new();
      node.nodeType = "TSStringKeyword".to_string();
      node.start = tok.start;
      node.end = tok.end;
      node.line = tok.line;
      node.col = tok.col;
      return node.clone();
    }
    if  tokVal == "number".to_string() {
      self.advance();
      let mut node_1 : TSNode = TSNode::new();
      node_1.nodeType = "TSNumberKeyword".to_string();
      node_1.start = tok.start;
      node_1.end = tok.end;
      node_1.line = tok.line;
      node_1.col = tok.col;
      return node_1.clone();
    }
    if  tokVal == "boolean".to_string() {
      self.advance();
      let mut node_2 : TSNode = TSNode::new();
      node_2.nodeType = "TSBooleanKeyword".to_string();
      node_2.start = tok.start;
      node_2.end = tok.end;
      node_2.line = tok.line;
      node_2.col = tok.col;
      return node_2.clone();
    }
    if  tokVal == "any".to_string() {
      self.advance();
      let mut node_3 : TSNode = TSNode::new();
      node_3.nodeType = "TSAnyKeyword".to_string();
      node_3.start = tok.start;
      node_3.end = tok.end;
      node_3.line = tok.line;
      node_3.col = tok.col;
      return node_3.clone();
    }
    if  tokVal == "unknown".to_string() {
      self.advance();
      let mut node_4 : TSNode = TSNode::new();
      node_4.nodeType = "TSUnknownKeyword".to_string();
      node_4.start = tok.start;
      node_4.end = tok.end;
      node_4.line = tok.line;
      node_4.col = tok.col;
      return node_4.clone();
    }
    if  tokVal == "void".to_string() {
      self.advance();
      let mut node_5 : TSNode = TSNode::new();
      node_5.nodeType = "TSVoidKeyword".to_string();
      node_5.start = tok.start;
      node_5.end = tok.end;
      node_5.line = tok.line;
      node_5.col = tok.col;
      return node_5.clone();
    }
    if  tokVal == "null".to_string() {
      self.advance();
      let mut node_6 : TSNode = TSNode::new();
      node_6.nodeType = "TSNullKeyword".to_string();
      node_6.start = tok.start;
      node_6.end = tok.end;
      node_6.line = tok.line;
      node_6.col = tok.col;
      return node_6.clone();
    }
    let tokType : String = self.peekType();
    if  tokType == "Identifier".to_string() {
      return self.parseTypeRef().clone();
    }
    if  tokVal == "(".to_string() {
      self.advance();
      let mut innerType : TSNode = self.parseType();
      self.expectValue(")".to_string());
      return innerType.clone();
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
      while self.matchValue(">".to_string()) == false {
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
  fn parseExpr(&mut self, ) -> TSNode {
    return self.parseAssign().clone();
  }
  fn parseAssign(&mut self, ) -> TSNode {
    let mut left : TSNode = self.parseBinary();
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
    return self.parseCall().clone();
  }
  fn parseCall(&mut self, ) -> TSNode {
    let mut callee : TSNode = self.parsePrimary();
    while self.matchValue("(".to_string()) {
      self.advance();
      let mut call : TSNode = TSNode::new();
      call.nodeType = "CallExpression".to_string();
      call.left = Some(Box::new(callee.clone()));
      call.start = callee.start;
      call.line = callee.line;
      call.col = callee.col;
      while self.matchValue(")".to_string()) == false {
        if  ((call.children.len() as i64)) > 0 {
          self.expectValue(",".to_string());
        }
        let mut arg : TSNode = self.parseExpr();
        call.children.push(arg.clone());
      }
      self.expectValue(")".to_string());
      callee = call.clone();
    }
    return callee.clone();
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
    if  tokVal == "(".to_string() {
      self.advance();
      let mut expr : TSNode = self.parseExpr();
      self.expectValue(")".to_string());
      return expr.clone();
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

