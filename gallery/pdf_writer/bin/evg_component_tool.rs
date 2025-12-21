#![allow(unused_parens)]
#![allow(unused_mut)]
#![allow(unused_variables)]
#![allow(non_snake_case)]
#![allow(dead_code)]

use std::rc::Rc;
use std::rc::Weak;
use std::cell::RefCell;

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
  fn isDigit(ch : String) -> bool {
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
    if  TSLexer::isDigit(ch.clone()) {
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
  fn isWhitespace(ch : String) -> bool {
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
      if  TSLexer::isWhitespace(ch.clone()) {
        self.advance();
      } else {
        return;
      }
    };
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
      value = [&*value, &*self.advance()].concat();
    };
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
      value = [&*value, &*self.advance()].concat();
    };
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
          value = [&*value, &*"\n".to_string()].concat();
        } else {
          if  esc == "t".to_string() {
            value = [&*value, &*"\t".to_string()].concat();
          } else {
            if  esc == "r".to_string() {
              value = [&*value, &*"\r".to_string()].concat();
            } else {
              if  esc == "\\".to_string() {
                value = [&*value, &*"\\".to_string()].concat();
              } else {
                if  esc == quote {
                  value = [&*value, &*quote].concat();
                } else {
                  value = [&*value, &*esc].concat();
                }
              }
            }
          }
        }
      } else {
        value = [&*value, &*self.advance()].concat();
      }
    };
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
          value = [&*value, &*"\n".to_string()].concat();
        } else {
          if  esc == "t".to_string() {
            value = [&*value, &*"\t".to_string()].concat();
          } else {
            if  esc == "`".to_string() {
              value = [&*value, &*"`".to_string()].concat();
            } else {
              if  esc == "$".to_string() {
                value = [&*value, &*"$".to_string()].concat();
              } else {
                value = [&*value, &*esc].concat();
              }
            }
          }
        }
      } else {
        value = [&*value, &*self.advance()].concat();
      }
    };
    return self.makeToken("Template".to_string(), value.clone(), startPos, startLine, startCol).clone();
  }
  fn readNumber(&mut self, ) -> Token {
    let startPos : i64 = self.pos;
    let startLine : i64 = self.line;
    let startCol : i64 = self.col;
    let mut value : String = "".to_string();
    while self.pos < self.__len {
      let ch : String = self.peek();
      if  TSLexer::isDigit(ch.clone()) {
        value = [&*value, &*self.advance()].concat();
      } else {
        if  ch == "_".to_string() {
          value = [&*value, &*self.advance()].concat();
        } else {
          if  ch == ".".to_string() {
            value = [&*value, &*self.advance()].concat();
          } else {
            if  ch == "n".to_string() {
              value = [&*value, &*self.advance()].concat();
              return self.makeToken("BigInt".to_string(), value.clone(), startPos, startLine, startCol).clone();
            }
            return self.makeToken("Number".to_string(), value.clone(), startPos, startLine, startCol).clone();
          }
        }
      }
    };
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
        value = [&*value, &*self.advance()].concat();
      } else {
        let _tmp_1 = TSLexer::identType(value.clone());
        return self.makeToken(_tmp_1, value.clone(), startPos, startLine, startCol).clone();
      }
    };
    let _tmp_1 = TSLexer::identType(value.clone());
    return self.makeToken(_tmp_1, value.clone(), startPos, startLine, startCol).clone();
  }
  fn identType(value : String) -> String {
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
    if  TSLexer::isDigit(ch.clone()) {
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
        if  self.peek() == "=".to_string() {
          self.advance();
          return self.makeToken("Punctuator".to_string(), "&&=".to_string(), startPos, startLine, startCol).clone();
        }
        return self.makeToken("Punctuator".to_string(), "&&".to_string(), startPos, startLine, startCol).clone();
      }
    }
    if  ch == "|".to_string() {
      if  next_1 == "|".to_string() {
        self.advance();
        self.advance();
        if  self.peek() == "=".to_string() {
          self.advance();
          return self.makeToken("Punctuator".to_string(), "||=".to_string(), startPos, startLine, startCol).clone();
        }
        return self.makeToken("Punctuator".to_string(), "||".to_string(), startPos, startLine, startCol).clone();
      }
    }
    if  ch == "?".to_string() {
      if  next_1 == "?".to_string() {
        self.advance();
        self.advance();
        if  self.peek() == "=".to_string() {
          self.advance();
          return self.makeToken("Punctuator".to_string(), "??=".to_string(), startPos, startLine, startCol).clone();
        }
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
    if  ch == "*".to_string() {
      if  next_1 == "*".to_string() {
        self.advance();
        self.advance();
        return self.makeToken("Punctuator".to_string(), "**".to_string(), startPos, startLine, startCol).clone();
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
        return tokens.clone();
      }
    };
    return tokens.clone();
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
  shorthand : bool, 
  computed : bool, 
  method : bool, 
  generator : bool, 
  r#async : bool, 
  delegate : bool, 
  r#await : bool, 
  children : Vec<TSNode>, 
  params : Vec<TSNode>, 
  decorators : Vec<TSNode>, 
  left : Option<Box<TSNode>>, 
  right : Option<Box<TSNode>>, 
  body : Option<Box<TSNode>>, 
  init : Option<Box<TSNode>>, 
  typeAnnotation : Option<Box<TSNode>>, 
  test : Option<Box<TSNode>>, 
  consequent : Option<Box<TSNode>>, 
  alternate : Option<Box<TSNode>>, 
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
      shorthand:false, 
      computed:false, 
      method:false, 
      generator:false, 
      r#async:false, 
      delegate:false, 
      r#await:false, 
      children: Vec::new(), 
      params: Vec::new(), 
      decorators: Vec::new(), 
      left: None, 
      right: None, 
      body: None, 
      init: None, 
      typeAnnotation: None, 
      test: None, 
      consequent: None, 
      alternate: None, 
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
  fn initParser(&mut self, toks : &Vec<Token>) -> () {
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
        println!( "{}", [&*([&*([&*"Parse error: expected ".to_string(), &*expectedType].concat()), &*" but got ".to_string()].concat()), &*tok.tokenType].concat() );
      }
    }
    self.advance();
    return tok.clone();
  }
  fn expectValue(&mut self, expectedValue : String) -> Token {
    let mut tok : Token = self.peek();
    if  tok.value != expectedValue {
      if  self.quiet == false {
        println!( "{}", [&*([&*([&*([&*"Parse error: expected '".to_string(), &*expectedValue].concat()), &*"' but got '".to_string()].concat()), &*tok.value].concat()), &*"'".to_string()].concat() );
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
    };
    return prog.clone();
  }
  fn parseStatement(&mut self, ) -> TSNode {
    let tokVal : String = self.peekValue();
    if  tokVal == "@".to_string() {
      let mut decorators : Vec<TSNode> = Vec::new();
      while self.matchValue("@".to_string()) {
        let mut dec : TSNode = self.parseDecorator();
        decorators.push(dec.clone());
      };
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
      return self.parseFuncDecl(false).clone();
    }
    if  tokVal == "async".to_string() {
      let nextVal_2 : String = self.peekNextValue();
      if  nextVal_2 == "function".to_string() {
        self.advance();
        return self.parseFuncDecl(true).clone();
      }
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
    let tokType : String = self.peekType();
    if  tokType == "Identifier".to_string() {
      let nextVal_3 : String = self.peekNextValue();
      if  nextVal_3 == ":".to_string() {
        return self.parseLabeledStatement().clone();
      }
    }
    return self.parseExprStmt().clone();
  }
  fn parseLabeledStatement(&mut self, ) -> TSNode {
    let mut node : TSNode = TSNode::new();
    node.nodeType = "LabeledStatement".to_string();
    let mut startTok : Token = self.peek();
    node.start = startTok.start;
    node.line = startTok.line;
    node.col = startTok.col;
    let mut labelTok : Token = self.expect("Identifier".to_string());
    node.name = labelTok.value.clone();
    self.expectValue(":".to_string());
    let mut body : TSNode = self.parseStatement();
    node.body = Some(Box::new(body.clone()));
    return node.clone();
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
      };
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
          };
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
      };
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
      };
      for i in 0..extendsList.len() {
        let mut ext = extendsList[i as usize].clone();
        let mut wrapper : TSNode = TSNode::new();
        wrapper.nodeType = "TSExpressionWithTypeArguments".to_string();
        wrapper.left = Some(Box::new(ext.clone()));
        node.children.push(wrapper.clone());
      };
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
    };
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
    };
    self.expectValue(">".to_string());
    return params.clone();
  }
  fn parsePropertySig(&mut self, ) -> TSNode {
    let mut startTok : Token = self.peek();
    let startPos : i64 = startTok.start;
    let startLine : i64 = startTok.line;
    let startCol : i64 = startTok.col;
    let mut isReadonly : bool = false;
    if  self.matchValue("readonly".to_string()) {
      isReadonly = true;
      self.advance();
    }
    if  self.matchValue("[".to_string()) {
      self.advance();
      let mut paramTok : Token = self.expect("Identifier".to_string());
      return self.parseIndexSignatureRest(isReadonly, paramTok.clone(), startPos, startLine, startCol).clone();
    }
    if  self.matchValue("(".to_string()) {
      return self.parseCallSignature(startPos, startLine, startCol).clone();
    }
    if  self.matchValue("new".to_string()) {
      return self.parseConstructSignature(startPos, startLine, startCol).clone();
    }
    let mut prop : TSNode = TSNode::new();
    prop.nodeType = "TSPropertySignature".to_string();
    prop.start = startPos;
    prop.line = startLine;
    prop.col = startCol;
    prop.readonly = isReadonly;
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
  fn parseCallSignature(&mut self, startPos : i64, startLine : i64, startCol : i64) -> TSNode {
    let mut sig : TSNode = TSNode::new();
    sig.nodeType = "TSCallSignatureDeclaration".to_string();
    sig.start = startPos;
    sig.line = startLine;
    sig.col = startCol;
    if  self.matchValue("<".to_string()) {
      let mut typeParams : Vec<TSNode> = self.parseTypeParams();
      sig.params = typeParams.clone();
    }
    self.expectValue("(".to_string());
    while (self.matchValue(")".to_string()) == false) && (self.isAtEnd() == false) {
      if  ((sig.children.len() as i64)) > 0 {
        self.expectValue(",".to_string());
      }
      let mut param : TSNode = self.parseParam();
      sig.children.push(param.clone());
    };
    self.expectValue(")".to_string());
    if  self.matchValue(":".to_string()) {
      let mut typeAnnot : TSNode = self.parseTypeAnnotation();
      sig.typeAnnotation = Some(Box::new(typeAnnot.clone()));
    }
    return sig.clone();
  }
  fn parseConstructSignature(&mut self, startPos : i64, startLine : i64, startCol : i64) -> TSNode {
    let mut sig : TSNode = TSNode::new();
    sig.nodeType = "TSConstructSignatureDeclaration".to_string();
    sig.start = startPos;
    sig.line = startLine;
    sig.col = startCol;
    self.expectValue("new".to_string());
    if  self.matchValue("<".to_string()) {
      let mut typeParams : Vec<TSNode> = self.parseTypeParams();
      sig.params = typeParams.clone();
    }
    self.expectValue("(".to_string());
    while (self.matchValue(")".to_string()) == false) && (self.isAtEnd() == false) {
      if  ((sig.children.len() as i64)) > 0 {
        self.expectValue(",".to_string());
      }
      let mut param : TSNode = self.parseParam();
      sig.children.push(param.clone());
    };
    self.expectValue(")".to_string());
    if  self.matchValue(":".to_string()) {
      let mut typeAnnot : TSNode = self.parseTypeAnnotation();
      sig.typeAnnotation = Some(Box::new(typeAnnot.clone()));
    }
    return sig.clone();
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
      };
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
    };
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
    };
    if  ((decorators.len() as i64)) > 0 {
      member.decorators = decorators.clone();
    }
    let mut isStatic : bool = false;
    let mut isAbstract : bool = false;
    let mut isReadonly : bool = false;
    let mut isAsync : bool = false;
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
        if  self.matchValue("{".to_string()) {
          member.nodeType = "StaticBlock".to_string();
          member.body = Some(Box::new(self.parseBlock().clone()));
          member.start = startTok.start;
          member.line = startTok.line;
          member.col = startTok.col;
          return member.clone();
        }
      }
      if  tokVal == "abstract".to_string() {
        isAbstract = true;
        self.advance();
      }
      if  tokVal == "readonly".to_string() {
        isReadonly = true;
        self.advance();
      }
      if  tokVal == "async".to_string() {
        isAsync = true;
        self.advance();
      }
      let newTokVal : String = self.peekValue();
      if  ((((((newTokVal != "public".to_string()) && (newTokVal != "private".to_string())) && (newTokVal != "protected".to_string())) && (newTokVal != "static".to_string())) && (newTokVal != "abstract".to_string())) && (newTokVal != "readonly".to_string())) && (newTokVal != "async".to_string()) {
        keepParsing = false;
      }
    };
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
      };
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
      if  isAsync {
        member.r#async = true;
      }
      self.expectValue("(".to_string());
      while (self.matchValue(")".to_string()) == false) && (self.isAtEnd() == false) {
        if  ((member.params.len() as i64)) > 0 {
          self.expectValue(",".to_string());
        }
        let mut param_1 : TSNode = self.parseParam();
        member.params.push(param_1.clone());
      };
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
    };
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
    };
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
      };
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
    let mut isAwait : bool = false;
    if  self.matchValue("await".to_string()) {
      self.advance();
      isAwait = true;
    }
    self.expectValue("(".to_string());
    let tokVal : String = self.peekValue();
    if  ((tokVal == "let".to_string()) || (tokVal == "const".to_string())) || (tokVal == "var".to_string()) {
      let kind : String = tokVal.clone();
      self.advance();
      let mut varName : Token = self.expect("Identifier".to_string());
      let nextVal : String = self.peekValue();
      if  nextVal == "of".to_string() {
        node.nodeType = "ForOfStatement".to_string();
        node.r#await = isAwait;
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
      };
      node.children.push(caseNode.clone());
    };
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
    let nextVal : String = self.peekValue();
    if  nextVal == "{".to_string() {
      let mut pattern : TSNode = self.parseObjectPattern();
      declarator.left = Some(Box::new(pattern.clone()));
      declarator.start = pattern.start;
      declarator.line = pattern.line;
      declarator.col = pattern.col;
    } else {
      if  nextVal == "[".to_string() {
        let mut pattern_1 : TSNode = self.parseArrayPattern();
        declarator.left = Some(Box::new(pattern_1.clone()));
        declarator.start = pattern_1.start;
        declarator.line = pattern_1.line;
        declarator.col = pattern_1.col;
      } else {
        let mut nameTok : Token = self.expect("Identifier".to_string());
        declarator.name = nameTok.value.clone();
        declarator.start = nameTok.start;
        declarator.line = nameTok.line;
        declarator.col = nameTok.col;
      }
    }
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
  fn parseObjectPattern(&mut self, ) -> TSNode {
    let mut node : TSNode = TSNode::new();
    node.nodeType = "ObjectPattern".to_string();
    let mut startTok : Token = self.peek();
    node.start = startTok.start;
    node.line = startTok.line;
    node.col = startTok.col;
    self.expectValue("{".to_string());
    while (self.matchValue("}".to_string()) == false) && (self.isAtEnd() == false) {
      if  ((node.children.len() as i64)) > 0 {
        self.expectValue(",".to_string());
        if  self.matchValue("}".to_string()) {
          break;
        }
      }
      if  self.matchValue("...".to_string()) {
        self.advance();
        let mut restProp : TSNode = TSNode::new();
        restProp.nodeType = "RestElement".to_string();
        let mut restName : Token = self.expect("Identifier".to_string());
        restProp.name = restName.value.clone();
        node.children.push(restProp.clone());
      } else {
        let mut prop : TSNode = TSNode::new();
        prop.nodeType = "Property".to_string();
        let mut keyTok : Token = self.expect("Identifier".to_string());
        prop.name = keyTok.value.clone();
        if  self.matchValue(":".to_string()) {
          self.advance();
          let mut valueTok : Token = self.expect("Identifier".to_string());
          let mut valueId : TSNode = TSNode::new();
          valueId.nodeType = "Identifier".to_string();
          valueId.name = valueTok.value.clone();
          prop.right = Some(Box::new(valueId.clone()));
        } else {
          prop.shorthand = true;
        }
        if  self.matchValue("=".to_string()) {
          self.advance();
          let mut defaultExpr : TSNode = self.parseExpr();
          prop.init = Some(Box::new(defaultExpr.clone()));
          prop.left = Some(Box::new(defaultExpr.clone()));
        }
        node.children.push(prop.clone());
      }
    };
    self.expectValue("}".to_string());
    return node.clone();
  }
  fn parseArrayPattern(&mut self, ) -> TSNode {
    let mut node : TSNode = TSNode::new();
    node.nodeType = "ArrayPattern".to_string();
    let mut startTok : Token = self.peek();
    node.start = startTok.start;
    node.line = startTok.line;
    node.col = startTok.col;
    self.expectValue("[".to_string());
    while (self.matchValue("]".to_string()) == false) && (self.isAtEnd() == false) {
      if  ((node.children.len() as i64)) > 0 {
        self.expectValue(",".to_string());
        if  self.matchValue("]".to_string()) {
          break;
        }
      }
      if  self.matchValue(",".to_string()) {
        let mut hole : TSNode = TSNode::new();
        hole.nodeType = "Elision".to_string();
        node.children.push(hole.clone());
      } else {
        if  self.matchValue("...".to_string()) {
          self.advance();
          let mut restElem : TSNode = TSNode::new();
          restElem.nodeType = "RestElement".to_string();
          let mut restName : Token = self.expect("Identifier".to_string());
          restElem.name = restName.value.clone();
          node.children.push(restElem.clone());
        } else {
          let mut elem : TSNode = TSNode::new();
          let mut elemTok : Token = self.expect("Identifier".to_string());
          elem.nodeType = "Identifier".to_string();
          elem.name = elemTok.value.clone();
          if  self.matchValue("=".to_string()) {
            self.advance();
            let mut defaultExpr : TSNode = self.parseExpr();
            let mut assignPat : TSNode = TSNode::new();
            assignPat.nodeType = "AssignmentPattern".to_string();
            assignPat.left = Some(Box::new(elem.clone()));
            assignPat.right = Some(Box::new(defaultExpr.clone()));
            node.children.push(assignPat.clone());
          } else {
            node.children.push(elem.clone());
          }
        }
      }
    };
    self.expectValue("]".to_string());
    return node.clone();
  }
  fn parseFuncDecl(&mut self, isAsync : bool) -> TSNode {
    let mut node : TSNode = TSNode::new();
    node.nodeType = "FunctionDeclaration".to_string();
    let mut startTok : Token = self.peek();
    node.start = startTok.start;
    node.line = startTok.line;
    node.col = startTok.col;
    if  isAsync {
      node.r#async = true;
    }
    self.expectValue("function".to_string());
    if  self.matchValue("*".to_string()) {
      self.advance();
      node.generator = true;
    }
    let mut nameTok : Token = self.expect("Identifier".to_string());
    node.name = nameTok.value.clone();
    if  self.matchValue("<".to_string()) {
      let mut typeParams : Vec<TSNode> = self.parseTypeParams();
      for i in 0..typeParams.len() {
        let mut tp = typeParams[i as usize].clone();
        node.children.push(tp.clone());
      };
    }
    self.expectValue("(".to_string());
    while (self.matchValue(")".to_string()) == false) && (self.isAtEnd() == false) {
      if  ((node.params.len() as i64)) > 0 {
        self.expectValue(",".to_string());
      }
      let mut param : TSNode = self.parseParam();
      node.params.push(param.clone());
    };
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
    let mut decorators : Vec<TSNode> = Vec::new();
    while self.matchValue("@".to_string()) {
      let mut dec : TSNode = self.parseDecorator();
      decorators.push(dec.clone());
    };
    let mut isRest : bool = false;
    if  self.matchValue("...".to_string()) {
      self.advance();
      isRest = true;
    }
    if  self.matchValue("{".to_string()) {
      let mut pattern : TSNode = self.parseObjectPattern();
      for i in 0..decorators.len() {
        let mut d = decorators[i as usize].clone();
        pattern.decorators.push(d.clone());
      };
      if  isRest {
        let mut restElem : TSNode = TSNode::new();
        restElem.nodeType = "RestElement".to_string();
        restElem.left = Some(Box::new(pattern.clone()));
        return restElem.clone();
      }
      return pattern.clone();
    }
    if  self.matchValue("[".to_string()) {
      let mut pattern_1 : TSNode = self.parseArrayPattern();
      for i_1 in 0..decorators.len() {
        let mut d_1 = decorators[i_1 as usize].clone();
        pattern_1.decorators.push(d_1.clone());
      };
      if  isRest {
        let mut restElem_1 : TSNode = TSNode::new();
        restElem_1.nodeType = "RestElement".to_string();
        restElem_1.left = Some(Box::new(pattern_1.clone()));
        return restElem_1.clone();
      }
      return pattern_1.clone();
    }
    let mut param : TSNode = TSNode::new();
    if  isRest {
      param.nodeType = "RestElement".to_string();
      param.kind = "rest".to_string();
    } else {
      param.nodeType = "Parameter".to_string();
    }
    for i_2 in 0..decorators.len() {
      let mut d_2 = decorators[i_2 as usize].clone();
      param.decorators.push(d_2.clone());
    };
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
    if  self.matchValue("=".to_string()) {
      self.advance();
      param.init = Some(Box::new(self.parseExpr().clone()));
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
    };
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
    let nextVal : String = self.peekValue();
    if  nextVal == "asserts".to_string() {
      let mut assertsTok : Token = self.peek();
      self.advance();
      let mut predicate : TSNode = TSNode::new();
      predicate.nodeType = "TSTypePredicate".to_string();
      predicate.start = assertsTok.start;
      predicate.line = assertsTok.line;
      predicate.col = assertsTok.col;
      predicate.value = "asserts".to_string();
      let mut paramTok : Token = self.expect("Identifier".to_string());
      predicate.name = paramTok.value.clone();
      if  self.matchValue("is".to_string()) {
        self.advance();
        let mut assertType : TSNode = self.parseType();
        predicate.typeAnnotation = Some(Box::new(assertType.clone()));
      }
      annot.typeAnnotation = Some(Box::new(predicate.clone()));
      return annot.clone();
    }
    if  self.matchType("Identifier".to_string()) {
      let savedPos : i64 = self.pos;
      let mut savedTok : Token = self.currentToken.clone().unwrap();
      let mut paramTok_1 : Token = self.peek();
      self.advance();
      if  self.matchValue("is".to_string()) {
        self.advance();
        let mut predicate_1 : TSNode = TSNode::new();
        predicate_1.nodeType = "TSTypePredicate".to_string();
        predicate_1.start = paramTok_1.start;
        predicate_1.line = paramTok_1.line;
        predicate_1.col = paramTok_1.col;
        predicate_1.name = paramTok_1.value.clone();
        let mut typeExpr : TSNode = self.parseType();
        predicate_1.typeAnnotation = Some(Box::new(typeExpr.clone()));
        annot.typeAnnotation = Some(Box::new(predicate_1.clone()));
        return annot.clone();
      }
      self.pos = savedPos;
      self.currentToken = Some(savedTok.clone());
    }
    let mut typeExpr_1 : TSNode = self.parseType();
    annot.typeAnnotation = Some(Box::new(typeExpr_1.clone()));
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
      };
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
      };
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
    };
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
    if  tokVal == "new".to_string() {
      return self.parseConstructorType().clone();
    }
    if  tokVal == "import".to_string() {
      return self.parseImportType().clone();
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
      println!( "{}", [&*"Unknown type: ".to_string(), &*tokVal].concat() );
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
      };
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
        let mut restTok : Token = self.peek();
        self.advance();
        let mut restName : String = "".to_string();
        if  self.matchType("Identifier".to_string()) {
          let savedPos : i64 = self.pos;
          let mut savedTok : Token = self.currentToken.clone().unwrap();
          let mut nameTok : Token = self.peek();
          self.advance();
          if  self.matchValue(":".to_string()) {
            restName = nameTok.value.clone();
            self.advance();
          } else {
            self.pos = savedPos;
            self.currentToken = Some(savedTok.clone());
          }
        }
        let mut innerType : TSNode = self.parseType();
        let mut restType : TSNode = TSNode::new();
        restType.nodeType = "TSRestType".to_string();
        restType.start = restTok.start;
        restType.line = restTok.line;
        restType.col = restTok.col;
        restType.typeAnnotation = Some(Box::new(innerType.clone()));
        if  restName != "".to_string() {
          restType.name = restName.clone();
        }
        tuple.children.push(restType.clone());
      } else {
        let mut isNamed : bool = false;
        let mut elemName : String = "".to_string();
        let mut elemOptional : bool = false;
        let mut elemStart : Token = self.peek();
        if  self.matchType("Identifier".to_string()) {
          let savedPos_1 : i64 = self.pos;
          let mut savedTok_1 : Token = self.currentToken.clone().unwrap();
          let mut nameTok_1 : Token = self.peek();
          self.advance();
          if  self.matchValue("?".to_string()) {
            self.advance();
            elemOptional = true;
          }
          if  self.matchValue(":".to_string()) {
            isNamed = true;
            elemName = nameTok_1.value.clone();
            self.advance();
          } else {
            self.pos = savedPos_1;
            self.currentToken = Some(savedTok_1.clone());
            elemOptional = false;
          }
        }
        let mut elemType : TSNode = self.parseType();
        if  isNamed {
          let mut namedElem : TSNode = TSNode::new();
          namedElem.nodeType = "TSNamedTupleMember".to_string();
          namedElem.start = elemStart.start;
          namedElem.line = elemStart.line;
          namedElem.col = elemStart.col;
          namedElem.name = elemName.clone();
          namedElem.optional = elemOptional;
          namedElem.typeAnnotation = Some(Box::new(elemType.clone()));
          tuple.children.push(namedElem.clone());
        } else {
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
    };
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
        // unused:  let savedPos2 : i64 = self.pos;
        // unused:  let mut savedToken2 : Token = self.currentToken.clone().unwrap();
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
        };
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
    };
    self.expectValue(")".to_string());
    if  self.matchValue("=>".to_string()) {
      self.advance();
      let mut returnType : TSNode = self.parseType();
      funcType.typeAnnotation = Some(Box::new(returnType.clone()));
    }
    return funcType.clone();
  }
  fn parseConstructorType(&mut self, ) -> TSNode {
    let mut ctorType : TSNode = TSNode::new();
    ctorType.nodeType = "TSConstructorType".to_string();
    let mut startTok : Token = self.peek();
    ctorType.start = startTok.start;
    ctorType.line = startTok.line;
    ctorType.col = startTok.col;
    self.expectValue("new".to_string());
    if  self.matchValue("<".to_string()) {
      let mut typeParams : Vec<TSNode> = self.parseTypeParams();
      ctorType.children = typeParams.clone();
    }
    self.expectValue("(".to_string());
    while (self.matchValue(")".to_string()) == false) && (self.isAtEnd() == false) {
      if  ((ctorType.params.len() as i64)) > 0 {
        self.expectValue(",".to_string());
      }
      let mut param : TSNode = self.parseParam();
      ctorType.params.push(param.clone());
    };
    self.expectValue(")".to_string());
    if  self.matchValue("=>".to_string()) {
      self.advance();
      let mut returnType : TSNode = self.parseType();
      ctorType.typeAnnotation = Some(Box::new(returnType.clone()));
    }
    return ctorType.clone();
  }
  fn parseImportType(&mut self, ) -> TSNode {
    let mut importType : TSNode = TSNode::new();
    importType.nodeType = "TSImportType".to_string();
    let mut startTok : Token = self.peek();
    importType.start = startTok.start;
    importType.line = startTok.line;
    importType.col = startTok.col;
    self.expectValue("import".to_string());
    self.expectValue("(".to_string());
    let mut sourceTok : Token = self.expect("String".to_string());
    importType.value = sourceTok.value.clone();
    self.expectValue(")".to_string());
    if  self.matchValue(".".to_string()) {
      self.advance();
      let mut memberTok : Token = self.expect("Identifier".to_string());
      importType.name = memberTok.value.clone();
      if  self.matchValue("<".to_string()) {
        self.advance();
        while (self.matchValue(">".to_string()) == false) && (self.isAtEnd() == false) {
          if  ((importType.params.len() as i64)) > 0 {
            self.expectValue(",".to_string());
          }
          let mut typeArg : TSNode = self.parseType();
          importType.params.push(typeArg.clone());
        };
        self.expectValue(">".to_string());
      }
    }
    return importType.clone();
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
    };
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
    };
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
    let tokVal : String = self.peekValue();
    if  tokVal == "=".to_string() {
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
    if  ((tokVal == "&&=".to_string()) || (tokVal == "||=".to_string())) || (tokVal == "??=".to_string()) {
      self.advance();
      let mut right_1 : TSNode = self.parseAssign();
      let mut assign_1 : TSNode = TSNode::new();
      assign_1.nodeType = "AssignmentExpression".to_string();
      assign_1.value = tokVal.clone();
      assign_1.left = Some(Box::new(left.clone()));
      assign_1.right = Some(Box::new(right_1.clone()));
      assign_1.start = left.start;
      assign_1.line = left.line;
      assign_1.col = left.col;
      return assign_1.clone();
    }
    return left.clone();
  }
  fn parseNullishCoalescing(&mut self, ) -> TSNode {
    let mut left : TSNode = self.parseTernary();
    while self.matchValue("??".to_string()) {
      self.advance();
      let mut right : TSNode = self.parseTernary();
      let mut nullish : TSNode = TSNode::new();
      nullish.nodeType = "LogicalExpression".to_string();
      nullish.value = "??".to_string();
      nullish.left = Some(Box::new(left.clone()));
      nullish.right = Some(Box::new(right.clone()));
      nullish.start = left.start;
      nullish.line = left.line;
      nullish.col = left.col;
      left = nullish.clone();
    };
    return left.clone();
  }
  fn parseTernary(&mut self, ) -> TSNode {
    let mut testExpr : TSNode = self.parseLogicalOr();
    if  self.matchValue("?".to_string()) {
      self.advance();
      let mut consequentExpr : TSNode = self.parseAssign();
      if  self.matchValue(":".to_string()) {
        self.advance();
        let mut alternateExpr : TSNode = self.parseAssign();
        let mut cond : TSNode = TSNode::new();
        cond.nodeType = "ConditionalExpression".to_string();
        cond.start = testExpr.start;
        cond.line = testExpr.line;
        cond.col = testExpr.col;
        cond.left = Some(Box::new(testExpr.clone()));
        cond.test = Some(Box::new(testExpr.clone()));
        cond.consequent = Some(Box::new(consequentExpr.clone()));
        cond.alternate = Some(Box::new(alternateExpr.clone()));
        return cond.clone();
      }
    }
    return testExpr.clone();
  }
  fn parseLogicalOr(&mut self, ) -> TSNode {
    let mut left : TSNode = self.parseLogicalAnd();
    while self.matchValue("||".to_string()) {
      self.advance();
      let mut right : TSNode = self.parseLogicalAnd();
      let mut expr : TSNode = TSNode::new();
      expr.nodeType = "BinaryExpression".to_string();
      expr.value = "||".to_string();
      expr.left = Some(Box::new(left.clone()));
      expr.right = Some(Box::new(right.clone()));
      expr.start = left.start;
      expr.line = left.line;
      expr.col = left.col;
      left = expr.clone();
    };
    return left.clone();
  }
  fn parseLogicalAnd(&mut self, ) -> TSNode {
    let mut left : TSNode = self.parseEquality();
    while self.matchValue("&&".to_string()) {
      self.advance();
      let mut right : TSNode = self.parseEquality();
      let mut expr : TSNode = TSNode::new();
      expr.nodeType = "BinaryExpression".to_string();
      expr.value = "&&".to_string();
      expr.left = Some(Box::new(left.clone()));
      expr.right = Some(Box::new(right.clone()));
      expr.start = left.start;
      expr.line = left.line;
      expr.col = left.col;
      left = expr.clone();
    };
    return left.clone();
  }
  fn parseEquality(&mut self, ) -> TSNode {
    let mut left : TSNode = self.parseComparison();
    let mut tokVal : String = self.peekValue();
    while (((tokVal == "==".to_string()) || (tokVal == "!=".to_string())) || (tokVal == "===".to_string())) || (tokVal == "!==".to_string()) {
      let mut opTok : Token = self.peek();
      self.advance();
      let mut right : TSNode = self.parseComparison();
      let mut expr : TSNode = TSNode::new();
      expr.nodeType = "BinaryExpression".to_string();
      expr.value = opTok.value.clone();
      expr.left = Some(Box::new(left.clone()));
      expr.right = Some(Box::new(right.clone()));
      expr.start = left.start;
      expr.line = left.line;
      expr.col = left.col;
      left = expr.clone();
      tokVal = self.peekValue();
    };
    return left.clone();
  }
  fn parseComparison(&mut self, ) -> TSNode {
    let mut left : TSNode = self.parseAdditive();
    let mut tokVal : String = self.peekValue();
    while (((tokVal == "<".to_string()) || (tokVal == ">".to_string())) || (tokVal == "<=".to_string())) || (tokVal == ">=".to_string()) {
      if  tokVal == "<".to_string() {
        if  self.tsxMode == true {
          if  left.nodeType == "Identifier".to_string() {
            if  TSParserSimple::startsWithLowerCase(left.name.clone()) {
              if  self.looksLikeGenericCall() {
                return left.clone();
              }
            }
          }
        }
      }
      let mut opTok : Token = self.peek();
      self.advance();
      let mut right : TSNode = self.parseAdditive();
      let mut expr : TSNode = TSNode::new();
      expr.nodeType = "BinaryExpression".to_string();
      expr.value = opTok.value.clone();
      expr.left = Some(Box::new(left.clone()));
      expr.right = Some(Box::new(right.clone()));
      expr.start = left.start;
      expr.line = left.line;
      expr.col = left.col;
      left = expr.clone();
      tokVal = self.peekValue();
    };
    return left.clone();
  }
  fn parseAdditive(&mut self, ) -> TSNode {
    let mut left : TSNode = self.parseMultiplicative();
    let mut tokVal : String = self.peekValue();
    while (tokVal == "+".to_string()) || (tokVal == "-".to_string()) {
      let mut opTok : Token = self.peek();
      self.advance();
      let mut right : TSNode = self.parseMultiplicative();
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
    };
    return left.clone();
  }
  fn parseMultiplicative(&mut self, ) -> TSNode {
    let mut left : TSNode = self.parseUnary();
    let mut tokVal : String = self.peekValue();
    while (((tokVal == "*".to_string()) || (tokVal == "/".to_string())) || (tokVal == "%".to_string())) || (tokVal == "**".to_string()) {
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
    };
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
    if  tokVal == "yield".to_string() {
      let mut yieldTok : Token = self.peek();
      self.advance();
      let mut yieldExpr : TSNode = TSNode::new();
      yieldExpr.nodeType = "YieldExpression".to_string();
      yieldExpr.start = yieldTok.start;
      yieldExpr.line = yieldTok.line;
      yieldExpr.col = yieldTok.col;
      if  self.matchValue("*".to_string()) {
        self.advance();
        yieldExpr.delegate = true;
      }
      let nextVal : String = self.peekValue();
      if  (((nextVal != ";".to_string()) && (nextVal != "}".to_string())) && (nextVal != ",".to_string())) && (nextVal != ")".to_string()) {
        yieldExpr.left = Some(Box::new(self.parseAssign().clone()));
      }
      return yieldExpr.clone();
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
      if  self.tsxMode == true {
        let peekNext : String = self.peekNextValue();
        let peekNextT : String = self.peekNextType();
        if  peekNext == ">".to_string() {
          return self.parsePostfix().clone();
        }
        if  peekNextT == "Identifier".to_string() {
          let peekTwoAhead : String = self.peekAheadValue(2);
          if  peekTwoAhead != "extends".to_string() {
            return self.parsePostfix().clone();
          }
        }
      }
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
      let mut tokVal : String = self.peekValue();
      if  tokVal == "<".to_string() {
        let mut shouldParseAsGenericCall : bool = false;
        if  self.tsxMode == false {
          // unused:  let next1 : String = self.peekAheadValue(1);
          let next2 : String = self.peekAheadValue(2);
          if  ((next2 == ">".to_string()) || (next2 == ",".to_string())) || (next2 == "extends".to_string()) {
            shouldParseAsGenericCall = true;
          }
        } else {
          if  expr.nodeType == "Identifier".to_string() {
            if  TSParserSimple::startsWithLowerCase(expr.name.clone()) {
              if  self.looksLikeGenericCall() {
                shouldParseAsGenericCall = true;
              }
            }
          }
          if  expr.nodeType == "MemberExpression".to_string() {
            if  self.looksLikeGenericCall() {
              shouldParseAsGenericCall = true;
            }
          }
        }
        if  shouldParseAsGenericCall {
          self.advance();
          let mut call : TSNode = TSNode::new();
          call.nodeType = "CallExpression".to_string();
          call.left = Some(Box::new(expr.clone()));
          call.start = expr.start;
          call.line = expr.line;
          call.col = expr.col;
          while (self.matchValue(">".to_string()) == false) && (self.isAtEnd() == false) {
            if  ((call.params.len() as i64)) > 0 {
              self.expectValue(",".to_string());
            }
            let mut typeArg : TSNode = self.parseType();
            call.params.push(typeArg.clone());
          };
          self.expectValue(">".to_string());
          if  self.matchValue("(".to_string()) {
            self.advance();
            while (self.matchValue(")".to_string()) == false) && (self.isAtEnd() == false) {
              if  ((call.children.len() as i64)) > 0 {
                self.expectValue(",".to_string());
              }
              if  self.matchValue("...".to_string()) {
                self.advance();
                let mut spreadArg : TSNode = self.parseExpr();
                let mut spread : TSNode = TSNode::new();
                spread.nodeType = "SpreadElement".to_string();
                spread.left = Some(Box::new(spreadArg.clone()));
                call.children.push(spread.clone());
              } else {
                let mut arg : TSNode = self.parseExpr();
                call.children.push(arg.clone());
              }
            };
            self.expectValue(")".to_string());
            expr = call.clone();
          }
        }
      }
      tokVal = self.peekValue();
      if  tokVal == "(".to_string() {
        self.advance();
        let mut call_1 : TSNode = TSNode::new();
        call_1.nodeType = "CallExpression".to_string();
        call_1.left = Some(Box::new(expr.clone()));
        call_1.start = expr.start;
        call_1.line = expr.line;
        call_1.col = expr.col;
        while (self.matchValue(")".to_string()) == false) && (self.isAtEnd() == false) {
          if  ((call_1.children.len() as i64)) > 0 {
            self.expectValue(",".to_string());
          }
          if  self.matchValue("...".to_string()) {
            self.advance();
            let mut spreadArg_1 : TSNode = self.parseExpr();
            let mut spread_1 : TSNode = TSNode::new();
            spread_1.nodeType = "SpreadElement".to_string();
            spread_1.left = Some(Box::new(spreadArg_1.clone()));
            call_1.children.push(spread_1.clone());
          } else {
            let mut arg_1 : TSNode = self.parseExpr();
            call_1.children.push(arg_1.clone());
          }
        };
        self.expectValue(")".to_string());
        expr = call_1.clone();
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
            let mut arg_2 : TSNode = self.parseExpr();
            optCall.children.push(arg_2.clone());
          };
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
      let tokType : String = self.peekType();
      if  tokType == "Template".to_string() {
        let mut quasi : TSNode = self.parseTemplateLiteral();
        let mut tagged : TSNode = TSNode::new();
        tagged.nodeType = "TaggedTemplateExpression".to_string();
        tagged.left = Some(Box::new(expr.clone()));
        tagged.right = Some(Box::new(quasi.clone()));
        tagged.start = expr.start;
        tagged.line = expr.line;
        tagged.col = expr.col;
        expr = tagged.clone();
      }
      let newTokVal : String = self.peekValue();
      let newTokType : String = self.peekType();
      if  (((((((newTokVal != "(".to_string()) && (newTokVal != ".".to_string())) && (newTokVal != "?.".to_string())) && (newTokVal != "[".to_string())) && (newTokVal != "!".to_string())) && (newTokVal != "as".to_string())) && (newTokVal != "satisfies".to_string())) && (newTokType != "Template".to_string()) {
        keepParsing = false;
      }
    };
    return expr.clone();
  }
  fn parsePrimary(&mut self, ) -> TSNode {
    let tokType : String = self.peekType();
    let tokVal : String = self.peekValue();
    let mut tok : Token = self.peek();
    if  (tokType == "Identifier".to_string()) || (tokType == "TSType".to_string()) {
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
    if  tokType == "BigInt".to_string() {
      self.advance();
      let mut bigint : TSNode = TSNode::new();
      bigint.nodeType = "BigIntLiteral".to_string();
      bigint.value = tok.value.clone();
      bigint.start = tok.start;
      bigint.end = tok.end;
      bigint.line = tok.line;
      bigint.col = tok.col;
      return bigint.clone();
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
        let peekTwoAhead : String = self.peekAheadValue(2);
        if  peekTwoAhead != "extends".to_string() {
          return self.parseJSXElement().clone();
        }
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
    if  tokVal == "import".to_string() {
      let mut importTok : Token = self.peek();
      self.advance();
      if  self.matchValue(".".to_string()) {
        self.advance();
        if  self.matchValue("meta".to_string()) {
          self.advance();
          let mut metaProp : TSNode = TSNode::new();
          metaProp.nodeType = "MetaProperty".to_string();
          metaProp.name = "import".to_string();
          metaProp.value = "meta".to_string();
          metaProp.start = importTok.start;
          metaProp.line = importTok.line;
          metaProp.col = importTok.col;
          return metaProp.clone();
        }
      }
      if  self.matchValue("(".to_string()) {
        self.advance();
        let mut source : TSNode = self.parseExpr();
        self.expectValue(")".to_string());
        let mut importExpr : TSNode = TSNode::new();
        importExpr.nodeType = "ImportExpression".to_string();
        importExpr.left = Some(Box::new(source.clone()));
        importExpr.start = importTok.start;
        importExpr.line = importTok.line;
        importExpr.col = importTok.col;
        return importExpr.clone();
      }
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
      println!( "{}", [&*"Unexpected token: ".to_string(), &*tokVal].concat() );
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
    };
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
        let mut isComputed : bool = false;
        let mut isMethod : bool = false;
        let mut isGetter : bool = false;
        let mut isSetter : bool = false;
        let mut currVal : String = self.peekValue();
        let mut nextType : String = self.peekNextType();
        let mut nextVal : String = self.peekNextValue();
        if  currVal == "async".to_string() {
          if  ((nextType == "Identifier".to_string()) || (nextVal == "[".to_string())) || (nextVal == "(".to_string()) {
            self.advance();
            prop.r#async = true;
            currVal = self.peekValue();
            nextType = self.peekNextType();
            nextVal = self.peekNextValue();
          }
        }
        if  currVal == "get".to_string() {
          if  (nextType == "Identifier".to_string()) || (nextVal == "[".to_string()) {
            self.advance();
            isGetter = true;
            prop.kind = "get".to_string();
          }
        }
        if  currVal == "set".to_string() {
          if  (nextType == "Identifier".to_string()) || (nextVal == "[".to_string()) {
            self.advance();
            isSetter = true;
            prop.kind = "set".to_string();
          }
        }
        let mut keyTok : Token = self.peek();
        if  self.matchValue("[".to_string()) {
          self.advance();
          let mut keyExpr : TSNode = self.parseExpr();
          self.expectValue("]".to_string());
          prop.right = Some(Box::new(keyExpr.clone()));
          isComputed = true;
          prop.computed = true;
        }
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
        if  self.matchValue("(".to_string()) {
          isMethod = true;
          prop.method = true;
          let mut fnNode : TSNode = TSNode::new();
          fnNode.nodeType = "FunctionExpression".to_string();
          self.advance();
          while (self.matchValue(")".to_string()) == false) && (self.isAtEnd() == false) {
            if  ((fnNode.params.len() as i64)) > 0 {
              self.expectValue(",".to_string());
            }
            fnNode.params.push(self.parseParam());
          };
          self.expectValue(")".to_string());
          if  self.matchValue(":".to_string()) {
            self.advance();
            fnNode.typeAnnotation = Some(Box::new(self.parseType().clone()));
          }
          if  self.matchValue("{".to_string()) {
            fnNode.body = Some(Box::new(self.parseBlock().clone()));
          }
          prop.left = Some(Box::new(fnNode.clone()));
          if  (isGetter == false) && (isSetter == false) {
            prop.kind = "init".to_string();
          }
        }
        if  isMethod == false {
          if  self.matchValue(":".to_string()) {
            self.advance();
            let mut valueExpr : TSNode = self.parseExpr();
            prop.left = Some(Box::new(valueExpr.clone()));
            prop.kind = "init".to_string();
          } else {
            if  isComputed == false {
              let mut shorthandVal : TSNode = TSNode::new();
              shorthandVal.nodeType = "Identifier".to_string();
              shorthandVal.name = prop.name.clone();
              prop.left = Some(Box::new(shorthandVal.clone()));
              prop.shorthand = true;
              prop.kind = "init".to_string();
            }
          }
        }
        node.children.push(prop.clone());
      }
      if  self.matchValue(",".to_string()) {
        self.advance();
      }
    };
    self.expectValue("}".to_string());
    return node.clone();
  }
  fn parseParenOrArrow(&mut self, ) -> TSNode {
    // unused:  let mut startTok : Token = self.peek();
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
    };
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
      };
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
    if  self.matchValue(".".to_string()) {
      self.advance();
      if  self.matchValue("target".to_string()) {
        self.advance();
        node.nodeType = "MetaProperty".to_string();
        node.name = "new".to_string();
        node.value = "target".to_string();
        return node.clone();
      }
    }
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
      };
    }
    if  self.matchValue("(".to_string()) {
      self.advance();
      while (self.matchValue(")".to_string()) == false) && (self.isAtEnd() == false) {
        if  ((node.children.len() as i64)) > 0 {
          self.expectValue(",".to_string());
        }
        let mut arg : TSNode = self.parseExpr();
        node.children.push(arg.clone());
      };
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
  fn peekAheadValue(&mut self, offset : i64) -> String {
    let aheadPos : i64 = self.pos + offset;
    if  aheadPos < ((self.tokens.len() as i64)) {
      let mut tok : Token = self.tokens[aheadPos as usize].clone();
      return tok.value.clone();
    }
    return "".to_string().clone();
  }
  fn startsWithLowerCase(s : String) -> bool {
    if  (s.len() as i64) == 0 {
      return false;
    }
    let code : i64 = s.chars().nth(0 as usize).unwrap_or('\0') as i64;
    if  (code >= 97) && (code <= 122) {
      return true;
    }
    return false;
  }
  fn looksLikeGenericCall(&mut self, ) -> bool {
    let mut depth : i64 = 1;
    let mut offset : i64 = 1;
    let maxLookahead : i64 = 20;
    while (depth > 0) && (offset < maxLookahead) {
      let ahead : String = self.peekAheadValue(offset);
      if  ahead == "".to_string() {
        return false;
      }
      if  ahead == "<".to_string() {
        depth = depth + 1;
      }
      if  ahead == ">".to_string() {
        depth = depth - 1;
      }
      if  (((ahead == "{".to_string()) || (ahead == "}".to_string())) || (ahead == ";".to_string())) || (ahead == "=>".to_string()) {
        return false;
      }
      offset = offset + 1;
    };
    if  depth == 0 {
      let afterClose : String = self.peekAheadValue(offset);
      if  afterClose == "(".to_string() {
        return true;
      }
    }
    return false;
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
    // unused:  let tagName : String = opening.name.clone();
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
    };
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
    };
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
      namePart = [&*([&*namePart, &*".".to_string()].concat()), &*nextTok.value].concat();
      self.advance();
      node.nodeType = "JSXMemberExpression".to_string();
    };
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
    };
    self.expectValue("<".to_string());
    self.expectValue("/".to_string());
    self.expectValue(">".to_string());
    return node.clone();
  }
}
#[derive(Clone)]
struct EVGUnit { 
  value : f64, 
  unitType : i64, 
  isSet : bool, 
  pixels : f64, 
}
impl EVGUnit { 
  
  pub fn new() ->  EVGUnit {
    let mut me = EVGUnit { 
      value:0_f64, 
      unitType:0, 
      isSet:false, 
      pixels:0_f64, 
    };
    me.value = 0_f64;
    me.unitType = 0;
    me.isSet = false;
    me.pixels = 0_f64;
    return me;
  }
  pub fn create(val : f64, uType : i64) -> EVGUnit {
    let mut unit : EVGUnit = EVGUnit::new();
    unit.value = val;
    unit.unitType = uType;
    unit.isSet = true;
    return unit.clone();
  }
  pub fn px(val : f64) -> EVGUnit {
    return EVGUnit::create(val, 0).clone();
  }
  pub fn percent(val : f64) -> EVGUnit {
    return EVGUnit::create(val, 1).clone();
  }
  pub fn em(val : f64) -> EVGUnit {
    return EVGUnit::create(val, 2).clone();
  }
  pub fn heightPercent(val : f64) -> EVGUnit {
    return EVGUnit::create(val, 3).clone();
  }
  pub fn fill() -> EVGUnit {
    return EVGUnit::create(100_f64, 4).clone();
  }
  pub fn unset() -> EVGUnit {
    let mut unit : EVGUnit = EVGUnit::new();
    unit.isSet = false;
    return unit.clone();
  }
  pub fn parse(str : String) -> EVGUnit {
    let mut unit : EVGUnit = EVGUnit::new();
    let trimmed : String = str.trim().to_string();
    let __len : i64 = trimmed.len() as i64;
    if  __len == 0 {
      return unit.clone();
    }
    if  trimmed == "fill".to_string() {
      unit.value = 100_f64;
      unit.unitType = 4;
      unit.isSet = true;
      return unit.clone();
    }
    let lastChar : i64 = trimmed.chars().nth((__len - 1) as usize).unwrap_or('\0') as i64;
    if  lastChar == 37 {
      let numStr : String = trimmed.chars().skip(0 as usize).take(((__len - 1) - 0) as usize).collect::<String>();
      let numVal : Option<f64> = numStr.parse::<f64>().ok();
      unit.value = numVal.unwrap();
      unit.unitType = 1;
      unit.isSet = true;
      return unit.clone();
    }
    if  __len >= 2 {
      let suffix : String = trimmed.chars().skip((__len - 2) as usize).take((__len - (__len - 2)) as usize).collect::<String>();
      if  suffix == "em".to_string() {
        let numStr_1 : String = trimmed.chars().skip(0 as usize).take(((__len - 2) - 0) as usize).collect::<String>();
        let numVal_1 : Option<f64> = numStr_1.parse::<f64>().ok();
        unit.value = numVal_1.unwrap();
        unit.unitType = 2;
        unit.isSet = true;
        return unit.clone();
      }
      if  suffix == "px".to_string() {
        let numStr_2 : String = trimmed.chars().skip(0 as usize).take(((__len - 2) - 0) as usize).collect::<String>();
        let numVal_2 : Option<f64> = numStr_2.parse::<f64>().ok();
        unit.value = numVal_2.unwrap();
        unit.pixels = unit.value;
        unit.unitType = 0;
        unit.isSet = true;
        return unit.clone();
      }
      if  suffix == "hp".to_string() {
        let numStr_3 : String = trimmed.chars().skip(0 as usize).take(((__len - 2) - 0) as usize).collect::<String>();
        let numVal_3 : Option<f64> = numStr_3.parse::<f64>().ok();
        unit.value = numVal_3.unwrap();
        unit.unitType = 3;
        unit.isSet = true;
        return unit.clone();
      }
    }
    let numVal_4 : Option<f64> = trimmed.parse::<f64>().ok();
    unit.value = numVal_4.unwrap();
    unit.pixels = unit.value;
    unit.unitType = 0;
    unit.isSet = true;
    return unit.clone();
  }
  fn resolve(&mut self, parentSize : f64, fontSize : f64) -> () {
    if  self.isSet == false {
      self.pixels = 0_f64;
      return;
    }
    if  self.unitType == 0 {
      self.pixels = self.value;
      return;
    }
    if  self.unitType == 1 {
      self.pixels = (parentSize * self.value) / 100_f64;
      return;
    }
    if  self.unitType == 2 {
      self.pixels = fontSize * self.value;
      return;
    }
    if  self.unitType == 3 {
      self.pixels = (parentSize * self.value) / 100_f64;
      return;
    }
    if  self.unitType == 4 {
      self.pixels = parentSize;
      return;
    }
    self.pixels = self.value;
  }
  fn resolveForHeight(&mut self, parentWidth : f64, parentHeight : f64, fontSize : f64) -> () {
    if  self.isSet == false {
      self.pixels = 0_f64;
      return;
    }
    if  self.unitType == 3 {
      self.pixels = (parentHeight * self.value) / 100_f64;
      return;
    }
    if  self.unitType == 1 {
      self.pixels = (parentHeight * self.value) / 100_f64;
      return;
    }
    self.resolve(parentWidth, fontSize);
  }
  fn resolveWithHeight(&mut self, parentWidth : f64, parentHeight : f64, fontSize : f64) -> () {
    if  self.isSet == false {
      self.pixels = 0_f64;
      return;
    }
    if  self.unitType == 3 {
      self.pixels = (parentHeight * self.value) / 100_f64;
      return;
    }
    self.resolve(parentWidth, fontSize);
  }
  fn isPixels(&mut self, ) -> bool {
    return self.unitType == 0;
  }
  fn isPercent(&mut self, ) -> bool {
    return self.unitType == 1;
  }
  fn isEm(&mut self, ) -> bool {
    return self.unitType == 2;
  }
  fn isHeightPercent(&mut self, ) -> bool {
    return self.unitType == 3;
  }
  fn isFill(&mut self, ) -> bool {
    return self.unitType == 4;
  }
  fn toString(&mut self, ) -> String {
    if  self.isSet == false {
      return "unset".to_string().clone();
    }
    if  self.unitType == 0 {
      return [&*(self.value.to_string()), &*"px".to_string()].concat().clone();
    }
    if  self.unitType == 1 {
      return [&*(self.value.to_string()), &*"%".to_string()].concat().clone();
    }
    if  self.unitType == 2 {
      return [&*(self.value.to_string()), &*"em".to_string()].concat().clone();
    }
    if  self.unitType == 3 {
      return [&*(self.value.to_string()), &*"hp".to_string()].concat().clone();
    }
    if  self.unitType == 4 {
      return "fill".to_string().clone();
    }
    return self.value.to_string().clone();
  }
}
#[derive(Clone)]
struct EVGColor { 
  r : f64, 
  g : f64, 
  b : f64, 
  a : f64, 
  isSet : bool, 
}
impl EVGColor { 
  
  pub fn new() ->  EVGColor {
    let mut me = EVGColor { 
      r:0_f64, 
      g:0_f64, 
      b:0_f64, 
      a:1_f64, 
      isSet:true, 
    };
    me.r = 0_f64;
    me.g = 0_f64;
    me.b = 0_f64;
    me.a = 1_f64;
    me.isSet = true;
    return me;
  }
  pub fn create(red : f64, green : f64, blue : f64, alpha : f64) -> EVGColor {
    let mut c : EVGColor = EVGColor::new();
    c.r = red;
    c.g = green;
    c.b = blue;
    c.a = alpha;
    c.isSet = true;
    return c.clone();
  }
  pub fn rgb(red : i64, green : i64, blue : i64) -> EVGColor {
    return EVGColor::create(((red as f64)), ((green as f64)), ((blue as f64)), 1_f64).clone();
  }
  pub fn rgba(red : i64, green : i64, blue : i64, alpha : f64) -> EVGColor {
    return EVGColor::create(((red as f64)), ((green as f64)), ((blue as f64)), alpha).clone();
  }
  pub fn noColor() -> EVGColor {
    let mut c : EVGColor = EVGColor::new();
    c.isSet = false;
    return c.clone();
  }
  pub fn black() -> EVGColor {
    return EVGColor::rgb(0, 0, 0).clone();
  }
  pub fn white() -> EVGColor {
    return EVGColor::rgb(255, 255, 255).clone();
  }
  pub fn transparent() -> EVGColor {
    return EVGColor::rgba(0, 0, 0, 0_f64).clone();
  }
  pub fn hexDigit(ch : i64) -> i64 {
    if  (ch >= 48) && (ch <= 57) {
      return ch - 48;
    }
    if  (ch >= 65) && (ch <= 70) {
      return (ch - 65) + 10;
    }
    if  (ch >= 97) && (ch <= 102) {
      return (ch - 97) + 10;
    }
    return 0;
  }
  pub fn parseHex(hex : String) -> EVGColor {
    let mut c : EVGColor = EVGColor::new();
    let mut __len : i64 = hex.len() as i64;
    let mut start : i64 = 0;
    if  __len > 0 {
      let firstChar : i64 = hex.chars().nth(0 as usize).unwrap_or('\0') as i64;
      if  firstChar == 35 {
        start = 1;
        __len = __len - 1;
      }
    }
    if  __len == 3 {
      let r1 : i64 = EVGColor::hexDigit((hex.chars().nth(start as usize).unwrap_or('\0') as i64));
      let g1 : i64 = EVGColor::hexDigit((hex.chars().nth((start + 1) as usize).unwrap_or('\0') as i64));
      let b1 : i64 = EVGColor::hexDigit((hex.chars().nth((start + 2) as usize).unwrap_or('\0') as i64));
      c.r = (((r1 * 16) + r1) as f64);
      c.g = (((g1 * 16) + g1) as f64);
      c.b = (((b1 * 16) + b1) as f64);
      c.a = 1_f64;
      c.isSet = true;
      return c.clone();
    }
    if  __len == 6 {
      let r1_1 : i64 = EVGColor::hexDigit((hex.chars().nth(start as usize).unwrap_or('\0') as i64));
      let r2 : i64 = EVGColor::hexDigit((hex.chars().nth((start + 1) as usize).unwrap_or('\0') as i64));
      let g1_1 : i64 = EVGColor::hexDigit((hex.chars().nth((start + 2) as usize).unwrap_or('\0') as i64));
      let g2 : i64 = EVGColor::hexDigit((hex.chars().nth((start + 3) as usize).unwrap_or('\0') as i64));
      let b1_1 : i64 = EVGColor::hexDigit((hex.chars().nth((start + 4) as usize).unwrap_or('\0') as i64));
      let b2 : i64 = EVGColor::hexDigit((hex.chars().nth((start + 5) as usize).unwrap_or('\0') as i64));
      c.r = (((r1_1 * 16) + r2) as f64);
      c.g = (((g1_1 * 16) + g2) as f64);
      c.b = (((b1_1 * 16) + b2) as f64);
      c.a = 1_f64;
      c.isSet = true;
      return c.clone();
    }
    if  __len == 8 {
      let r1_2 : i64 = EVGColor::hexDigit((hex.chars().nth(start as usize).unwrap_or('\0') as i64));
      let r2_1 : i64 = EVGColor::hexDigit((hex.chars().nth((start + 1) as usize).unwrap_or('\0') as i64));
      let g1_2 : i64 = EVGColor::hexDigit((hex.chars().nth((start + 2) as usize).unwrap_or('\0') as i64));
      let g2_1 : i64 = EVGColor::hexDigit((hex.chars().nth((start + 3) as usize).unwrap_or('\0') as i64));
      let b1_2 : i64 = EVGColor::hexDigit((hex.chars().nth((start + 4) as usize).unwrap_or('\0') as i64));
      let b2_1 : i64 = EVGColor::hexDigit((hex.chars().nth((start + 5) as usize).unwrap_or('\0') as i64));
      let a1 : i64 = EVGColor::hexDigit((hex.chars().nth((start + 6) as usize).unwrap_or('\0') as i64));
      let a2 : i64 = EVGColor::hexDigit((hex.chars().nth((start + 7) as usize).unwrap_or('\0') as i64));
      c.r = (((r1_2 * 16) + r2_1) as f64);
      c.g = (((g1_2 * 16) + g2_1) as f64);
      c.b = (((b1_2 * 16) + b2_1) as f64);
      c.a = ((((a1 * 16) + a2) as f64)) / 255_f64;
      c.isSet = true;
      return c.clone();
    }
    c.isSet = false;
    return c.clone();
  }
  pub fn hue2rgb(p : f64, q : f64, tt : f64) -> f64 {
    let mut t : f64 = tt;
    if  t < 0_f64 {
      t = t + 1_f64;
    }
    if  t > 1_f64 {
      t = t - 1_f64;
    }
    if  t < (1_f64 / 6_f64) {
      return p + (((q - p) * 6_f64) * t);
    }
    if  t < (1_f64 / 2_f64) {
      return q;
    }
    if  t < (2_f64 / 3_f64) {
      return p + (((q - p) * ((2_f64 / 3_f64) - t)) * 6_f64);
    }
    return p;
  }
  pub fn hslToRgb(h : f64, s : f64, l : f64) -> EVGColor {
    let mut c : EVGColor = EVGColor::new();
    let hNorm : f64 = h / 360_f64;
    let sNorm : f64 = s / 100_f64;
    let lNorm : f64 = l / 100_f64;
    if  sNorm == 0_f64 {
      let gray : f64 = lNorm * 255_f64;
      c.r = gray;
      c.g = gray;
      c.b = gray;
    } else {
      let mut q : f64 = 0_f64;
      if  lNorm < 0.5_f64 {
        q = lNorm * (1_f64 + sNorm);
      } else {
        q = (lNorm + sNorm) - (lNorm * sNorm);
      }
      let p : f64 = (2_f64 * lNorm) - q;
      c.r = EVGColor::hue2rgb(p, q, (hNorm + (1_f64 / 3_f64))) * 255_f64;
      c.g = EVGColor::hue2rgb(p, q, hNorm) * 255_f64;
      c.b = EVGColor::hue2rgb(p, q, (hNorm - (1_f64 / 3_f64))) * 255_f64;
    }
    c.a = 1_f64;
    c.isSet = true;
    return c.clone();
  }
  pub fn parseNumber(str : String) -> f64 {
    let val : Option<f64> = (str.trim().to_string()).parse::<f64>().ok();
    return val.unwrap();
  }
  pub fn parse(str : String) -> EVGColor {
    let trimmed : String = str.trim().to_string();
    let __len : i64 = trimmed.len() as i64;
    if  __len == 0 {
      return EVGColor::noColor().clone();
    }
    let firstChar : i64 = trimmed.chars().nth(0 as usize).unwrap_or('\0') as i64;
    if  firstChar == 35 {
      return EVGColor::parseHex(trimmed.clone()).clone();
    }
    if  __len >= 4 {
      let prefix : String = trimmed.chars().skip(0 as usize).take((4 - 0) as usize).collect::<String>();
      if  prefix == "rgba".to_string() {
        return EVGColor::parseRgba(trimmed.clone()).clone();
      }
      let prefix3 : String = trimmed.chars().skip(0 as usize).take((3 - 0) as usize).collect::<String>();
      if  prefix3 == "rgb".to_string() {
        return EVGColor::parseRgb(trimmed.clone()).clone();
      }
      if  prefix3 == "hsl".to_string() {
        return EVGColor::parseHsl(trimmed.clone()).clone();
      }
    }
    return EVGColor::parseNamed(trimmed.clone()).clone();
  }
  pub fn parseRgb(str : String) -> EVGColor {
    let mut c : EVGColor = EVGColor::new();
    let __len : i64 = str.len() as i64;
    let mut start : i64 = 0;
    let mut i : i64 = 0;
    while i < __len {
      let ch : i64 = str.chars().nth(i as usize).unwrap_or('\0') as i64;
      if  ch == 40 {
        start = i + 1;
      }
      i = i + 1;
    };
    let mut end : i64 = __len - 1;
    i = __len - 1;
    while i >= 0 {
      let ch_1 : i64 = str.chars().nth(i as usize).unwrap_or('\0') as i64;
      if  ch_1 == 41 {
        end = i;
      }
      i = i - 1;
    };
    let content : String = str.chars().skip(start as usize).take((end - start) as usize).collect::<String>();
    let mut parts : Vec<String> = Vec::new();
    let mut current : String = "".to_string();
    i = 0;
    let contentLen : i64 = content.len() as i64;
    while i < contentLen {
      let ch_2 : i64 = content.chars().nth(i as usize).unwrap_or('\0') as i64;
      if  (ch_2 == 44) || (ch_2 == 32) {
        let trimPart : String = current.trim().to_string();
        if  (trimPart.len() as i64) > 0 {
          parts.push(trimPart.clone());
        }
        current = "".to_string();
      } else {
        current = [&*current, &*((char::from_u32(ch_2 as u32).unwrap_or('\0').to_string()))].concat();
      }
      i = i + 1;
    };
    let trimPart_1 : String = current.trim().to_string();
    if  (trimPart_1.len() as i64) > 0 {
      parts.push(trimPart_1.clone());
    }
    if  ((parts.len() as i64)) >= 3 {
      c.r = EVGColor::parseNumber((parts[0 as usize].clone()));
      c.g = EVGColor::parseNumber((parts[1 as usize].clone()));
      c.b = EVGColor::parseNumber((parts[2 as usize].clone()));
      c.a = 1_f64;
      c.isSet = true;
    }
    return c.clone();
  }
  pub fn parseRgba(str : String) -> EVGColor {
    let mut c : EVGColor = EVGColor::parseRgb(str.clone());
    let __len : i64 = str.len() as i64;
    let mut start : i64 = 0;
    let mut end : i64 = __len - 1;
    let mut i : i64 = 0;
    while i < __len {
      let ch : i64 = str.chars().nth(i as usize).unwrap_or('\0') as i64;
      if  ch == 40 {
        start = i + 1;
      }
      if  ch == 41 {
        end = i;
      }
      i = i + 1;
    };
    let content : String = str.chars().skip(start as usize).take((end - start) as usize).collect::<String>();
    let mut parts : Vec<String> = Vec::new();
    let mut current : String = "".to_string();
    i = 0;
    let contentLen : i64 = content.len() as i64;
    while i < contentLen {
      let ch_1 : i64 = content.chars().nth(i as usize).unwrap_or('\0') as i64;
      if  (ch_1 == 44) || (ch_1 == 32) {
        let trimPart : String = current.trim().to_string();
        if  (trimPart.len() as i64) > 0 {
          parts.push(trimPart.clone());
        }
        current = "".to_string();
      } else {
        current = [&*current, &*((char::from_u32(ch_1 as u32).unwrap_or('\0').to_string()))].concat();
      }
      i = i + 1;
    };
    let trimPart_1 : String = current.trim().to_string();
    if  (trimPart_1.len() as i64) > 0 {
      parts.push(trimPart_1.clone());
    }
    if  ((parts.len() as i64)) >= 4 {
      c.r = EVGColor::parseNumber((parts[0 as usize].clone()));
      c.g = EVGColor::parseNumber((parts[1 as usize].clone()));
      c.b = EVGColor::parseNumber((parts[2 as usize].clone()));
      c.a = EVGColor::parseNumber((parts[3 as usize].clone()));
      c.isSet = true;
    }
    return c.clone();
  }
  pub fn parseHsl(str : String) -> EVGColor {
    let __len : i64 = str.len() as i64;
    let mut start : i64 = 0;
    let mut end : i64 = __len - 1;
    let mut i : i64 = 0;
    while i < __len {
      let ch : i64 = str.chars().nth(i as usize).unwrap_or('\0') as i64;
      if  ch == 40 {
        start = i + 1;
      }
      if  ch == 41 {
        end = i;
      }
      i = i + 1;
    };
    let content : String = str.chars().skip(start as usize).take((end - start) as usize).collect::<String>();
    let mut parts : Vec<String> = Vec::new();
    let mut current : String = "".to_string();
    i = 0;
    let contentLen : i64 = content.len() as i64;
    while i < contentLen {
      let ch_1 : i64 = content.chars().nth(i as usize).unwrap_or('\0') as i64;
      if  (ch_1 == 44) || (ch_1 == 32) {
        let trimPart : String = current.trim().to_string();
        if  (trimPart.len() as i64) > 0 {
          parts.push(trimPart.clone());
        }
        current = "".to_string();
      } else {
        current = [&*current, &*((char::from_u32(ch_1 as u32).unwrap_or('\0').to_string()))].concat();
      }
      i = i + 1;
    };
    let trimPart_1 : String = current.trim().to_string();
    if  (trimPart_1.len() as i64) > 0 {
      parts.push(trimPart_1.clone());
    }
    if  ((parts.len() as i64)) >= 3 {
      let h : f64 = EVGColor::parseNumber((parts[0 as usize].clone()));
      let s : f64 = EVGColor::parseNumber((parts[1 as usize].clone()));
      let l : f64 = EVGColor::parseNumber((parts[2 as usize].clone()));
      let mut c : EVGColor = EVGColor::hslToRgb(h, s, l);
      if  ((parts.len() as i64)) >= 4 {
        c.a = EVGColor::parseNumber((parts[3 as usize].clone()));
      }
      return c.clone();
    }
    return EVGColor::noColor().clone();
  }
  pub fn parseNamed(name : String) -> EVGColor {
    let mut lower : String = "".to_string();
    let __len : i64 = name.len() as i64;
    let mut i : i64 = 0;
    while i < __len {
      let ch : i64 = name.chars().nth(i as usize).unwrap_or('\0') as i64;
      if  (ch >= 65) && (ch <= 90) {
        lower = [&*lower, &*((char::from_u32((ch + 32) as u32).unwrap_or('\0').to_string()))].concat();
      } else {
        lower = [&*lower, &*((char::from_u32(ch as u32).unwrap_or('\0').to_string()))].concat();
      }
      i = i + 1;
    };
    if  lower == "black".to_string() {
      return EVGColor::rgb(0, 0, 0).clone();
    }
    if  lower == "white".to_string() {
      return EVGColor::rgb(255, 255, 255).clone();
    }
    if  lower == "red".to_string() {
      return EVGColor::rgb(255, 0, 0).clone();
    }
    if  lower == "green".to_string() {
      return EVGColor::rgb(0, 128, 0).clone();
    }
    if  lower == "blue".to_string() {
      return EVGColor::rgb(0, 0, 255).clone();
    }
    if  lower == "yellow".to_string() {
      return EVGColor::rgb(255, 255, 0).clone();
    }
    if  lower == "cyan".to_string() {
      return EVGColor::rgb(0, 255, 255).clone();
    }
    if  lower == "magenta".to_string() {
      return EVGColor::rgb(255, 0, 255).clone();
    }
    if  lower == "gray".to_string() {
      return EVGColor::rgb(128, 128, 128).clone();
    }
    if  lower == "grey".to_string() {
      return EVGColor::rgb(128, 128, 128).clone();
    }
    if  lower == "orange".to_string() {
      return EVGColor::rgb(255, 165, 0).clone();
    }
    if  lower == "purple".to_string() {
      return EVGColor::rgb(128, 0, 128).clone();
    }
    if  lower == "pink".to_string() {
      return EVGColor::rgb(255, 192, 203).clone();
    }
    if  lower == "brown".to_string() {
      return EVGColor::rgb(165, 42, 42).clone();
    }
    if  lower == "transparent".to_string() {
      return EVGColor::transparent().clone();
    }
    if  lower == "none".to_string() {
      return EVGColor::noColor().clone();
    }
    return EVGColor::noColor().clone();
  }
  fn red(&mut self, ) -> i64 {
    if  self.r > 255_f64 {
      return 255;
    }
    if  self.r < 0_f64 {
      return 0;
    }
    return self.r as i64 ;
  }
  fn green(&mut self, ) -> i64 {
    if  self.g > 255_f64 {
      return 255;
    }
    if  self.g < 0_f64 {
      return 0;
    }
    return self.g as i64 ;
  }
  fn blue(&mut self, ) -> i64 {
    if  self.b > 255_f64 {
      return 255;
    }
    if  self.b < 0_f64 {
      return 0;
    }
    return self.b as i64 ;
  }
  fn alpha(&mut self, ) -> f64 {
    if  self.a < 0_f64 {
      return 0_f64;
    }
    if  self.a > 1_f64 {
      return 1_f64;
    }
    return self.a;
  }
  fn toCSSString(&mut self, ) -> String {
    if  self.isSet == false {
      return "none".to_string().clone();
    }
    if  self.a < 1_f64 {
      return [&*([&*([&*([&*([&*([&*([&*([&*"rgba(".to_string(), &*(self.red().to_string())].concat()), &*",".to_string()].concat()), &*(self.green().to_string())].concat()), &*",".to_string()].concat()), &*(self.blue().to_string())].concat()), &*",".to_string()].concat()), &*(self.alpha().to_string())].concat()), &*")".to_string()].concat().clone();
    }
    return [&*([&*([&*([&*([&*([&*"rgb(".to_string(), &*(self.red().to_string())].concat()), &*",".to_string()].concat()), &*(self.green().to_string())].concat()), &*",".to_string()].concat()), &*(self.blue().to_string())].concat()), &*")".to_string()].concat().clone();
  }
  fn toHexString(&mut self, ) -> String {
    if  self.isSet == false {
      return "none".to_string().clone();
    }
    let hexChars : String = "0123456789ABCDEF".to_string();
    let rH : i64 = self.red();
    let gH : i64 = self.green();
    let bH : i64 = self.blue();
    let r1D : f64 = ((rH as f64)) / 16_f64;
    let r1 : i64 = r1D as i64 ;
    let r2 : i64 = rH % 16;
    let g1D : f64 = ((gH as f64)) / 16_f64;
    let g1 : i64 = g1D as i64 ;
    let g2 : i64 = gH % 16;
    let b1D : f64 = ((bH as f64)) / 16_f64;
    let b1 : i64 = b1D as i64 ;
    let b2 : i64 = bH % 16;
    return [&*([&*([&*([&*([&*([&*"#".to_string(), &*((char::from_u32((hexChars.chars().nth(r1 as usize).unwrap_or('\0') as i64) as u32).unwrap_or('\0').to_string()))].concat()), &*((char::from_u32((hexChars.chars().nth(r2 as usize).unwrap_or('\0') as i64) as u32).unwrap_or('\0').to_string()))].concat()), &*((char::from_u32((hexChars.chars().nth(g1 as usize).unwrap_or('\0') as i64) as u32).unwrap_or('\0').to_string()))].concat()), &*((char::from_u32((hexChars.chars().nth(g2 as usize).unwrap_or('\0') as i64) as u32).unwrap_or('\0').to_string()))].concat()), &*((char::from_u32((hexChars.chars().nth(b1 as usize).unwrap_or('\0') as i64) as u32).unwrap_or('\0').to_string()))].concat()), &*((char::from_u32((hexChars.chars().nth(b2 as usize).unwrap_or('\0') as i64) as u32).unwrap_or('\0').to_string()))].concat().clone();
  }
  fn toPDFColorString(&mut self, ) -> String {
    if  self.isSet == false {
      return "".to_string().clone();
    }
    let rN : f64 = self.r / 255_f64;
    let gN : f64 = self.g / 255_f64;
    let bN : f64 = self.b / 255_f64;
    return [&*([&*([&*([&*(rN.to_string()), &*" ".to_string()].concat()), &*(gN.to_string())].concat()), &*" ".to_string()].concat()), &*(bN.to_string())].concat().clone();
  }
  fn withAlpha(&mut self, newAlpha : f64) -> EVGColor {
    return EVGColor::create(self.r, self.g, self.b, newAlpha).clone();
  }
  fn lighten(&mut self, amount : f64) -> EVGColor {
    let newR : f64 = self.r + ((255_f64 - self.r) * amount);
    let newG : f64 = self.g + ((255_f64 - self.g) * amount);
    let newB : f64 = self.b + ((255_f64 - self.b) * amount);
    return EVGColor::create(newR, newG, newB, self.a).clone();
  }
  fn darken(&mut self, amount : f64) -> EVGColor {
    let newR : f64 = self.r * (1_f64 - amount);
    let newG : f64 = self.g * (1_f64 - amount);
    let newB : f64 = self.b * (1_f64 - amount);
    return EVGColor::create(newR, newG, newB, self.a).clone();
  }
}
#[derive(Clone)]
struct EVGBox { 
  marginTop : Option<EVGUnit>, 
  marginRight : Option<EVGUnit>, 
  marginBottom : Option<EVGUnit>, 
  marginLeft : Option<EVGUnit>, 
  paddingTop : Option<EVGUnit>, 
  paddingRight : Option<EVGUnit>, 
  paddingBottom : Option<EVGUnit>, 
  paddingLeft : Option<EVGUnit>, 
  borderWidth : Option<EVGUnit>, 
  borderColor : Option<EVGColor>, 
  borderRadius : Option<EVGUnit>, 
  marginTopPx : f64, 
  marginRightPx : f64, 
  marginBottomPx : f64, 
  marginLeftPx : f64, 
  paddingTopPx : f64, 
  paddingRightPx : f64, 
  paddingBottomPx : f64, 
  paddingLeftPx : f64, 
  borderWidthPx : f64, 
  borderRadiusPx : f64, 
}
impl EVGBox { 
  
  pub fn new() ->  EVGBox {
    let mut me = EVGBox { 
      marginTop: None, 
      marginRight: None, 
      marginBottom: None, 
      marginLeft: None, 
      paddingTop: None, 
      paddingRight: None, 
      paddingBottom: None, 
      paddingLeft: None, 
      borderWidth: None, 
      borderColor: None, 
      borderRadius: None, 
      marginTopPx:0_f64, 
      marginRightPx:0_f64, 
      marginBottomPx:0_f64, 
      marginLeftPx:0_f64, 
      paddingTopPx:0_f64, 
      paddingRightPx:0_f64, 
      paddingBottomPx:0_f64, 
      paddingLeftPx:0_f64, 
      borderWidthPx:0_f64, 
      borderRadiusPx:0_f64, 
    };
    me.marginTop = Some(EVGUnit::unset());
    me.marginRight = Some(EVGUnit::unset());
    me.marginBottom = Some(EVGUnit::unset());
    me.marginLeft = Some(EVGUnit::unset());
    me.paddingTop = Some(EVGUnit::unset());
    me.paddingRight = Some(EVGUnit::unset());
    me.paddingBottom = Some(EVGUnit::unset());
    me.paddingLeft = Some(EVGUnit::unset());
    me.borderWidth = Some(EVGUnit::unset());
    me.borderColor = Some(EVGColor::noColor());
    me.borderRadius = Some(EVGUnit::unset());
    return me;
  }
  fn setMargin(&mut self, mut all : EVGUnit) -> () {
    self.marginTop = Some(all.clone());
    self.marginRight = Some(all.clone());
    self.marginBottom = Some(all.clone());
    self.marginLeft = Some(all.clone());
  }
  fn setMarginValues(&mut self, mut top : EVGUnit, mut right : EVGUnit, mut bottom : EVGUnit, mut left : EVGUnit) -> () {
    self.marginTop = Some(top.clone());
    self.marginRight = Some(right.clone());
    self.marginBottom = Some(bottom.clone());
    self.marginLeft = Some(left.clone());
  }
  fn setPadding(&mut self, mut all : EVGUnit) -> () {
    self.paddingTop = Some(all.clone());
    self.paddingRight = Some(all.clone());
    self.paddingBottom = Some(all.clone());
    self.paddingLeft = Some(all.clone());
  }
  fn setPaddingValues(&mut self, mut top : EVGUnit, mut right : EVGUnit, mut bottom : EVGUnit, mut left : EVGUnit) -> () {
    self.paddingTop = Some(top.clone());
    self.paddingRight = Some(right.clone());
    self.paddingBottom = Some(bottom.clone());
    self.paddingLeft = Some(left.clone());
  }
  fn resolveUnits(&mut self, parentWidth : f64, parentHeight : f64, fontSize : f64) -> () {
    self.marginTop.as_mut().unwrap().resolve(parentHeight, fontSize);
    self.marginTopPx = self.marginTop.as_mut().unwrap().pixels;
    self.marginRight.as_mut().unwrap().resolve(parentWidth, fontSize);
    self.marginRightPx = self.marginRight.as_mut().unwrap().pixels;
    self.marginBottom.as_mut().unwrap().resolve(parentHeight, fontSize);
    self.marginBottomPx = self.marginBottom.as_mut().unwrap().pixels;
    self.marginLeft.as_mut().unwrap().resolve(parentWidth, fontSize);
    self.marginLeftPx = self.marginLeft.as_mut().unwrap().pixels;
    self.paddingTop.as_mut().unwrap().resolve(parentHeight, fontSize);
    self.paddingTopPx = self.paddingTop.as_mut().unwrap().pixels;
    self.paddingRight.as_mut().unwrap().resolve(parentWidth, fontSize);
    self.paddingRightPx = self.paddingRight.as_mut().unwrap().pixels;
    self.paddingBottom.as_mut().unwrap().resolve(parentHeight, fontSize);
    self.paddingBottomPx = self.paddingBottom.as_mut().unwrap().pixels;
    self.paddingLeft.as_mut().unwrap().resolve(parentWidth, fontSize);
    self.paddingLeftPx = self.paddingLeft.as_mut().unwrap().pixels;
    self.borderWidth.as_mut().unwrap().resolve(parentWidth, fontSize);
    self.borderWidthPx = self.borderWidth.as_mut().unwrap().pixels;
    let mut smallerDim : f64 = parentWidth;
    if  parentHeight < parentWidth {
      smallerDim = parentHeight;
    }
    self.borderRadius.as_mut().unwrap().resolve(smallerDim, fontSize);
    self.borderRadiusPx = self.borderRadius.as_mut().unwrap().pixels;
  }
  fn getInnerWidth(&mut self, outerWidth : f64) -> f64 {
    return ((outerWidth - self.paddingLeftPx) - self.paddingRightPx) - (self.borderWidthPx * 2_f64);
  }
  fn getInnerHeight(&mut self, outerHeight : f64) -> f64 {
    return ((outerHeight - self.paddingTopPx) - self.paddingBottomPx) - (self.borderWidthPx * 2_f64);
  }
  fn getTotalWidth(&mut self, contentWidth : f64) -> f64 {
    return ((((contentWidth + self.marginLeftPx) + self.marginRightPx) + self.paddingLeftPx) + self.paddingRightPx) + (self.borderWidthPx * 2_f64);
  }
  fn getTotalHeight(&mut self, contentHeight : f64) -> f64 {
    return ((((contentHeight + self.marginTopPx) + self.marginBottomPx) + self.paddingTopPx) + self.paddingBottomPx) + (self.borderWidthPx * 2_f64);
  }
  fn getContentX(&mut self, elementX : f64) -> f64 {
    return ((elementX + self.marginLeftPx) + self.borderWidthPx) + self.paddingLeftPx;
  }
  fn getContentY(&mut self, elementY : f64) -> f64 {
    return ((elementY + self.marginTopPx) + self.borderWidthPx) + self.paddingTopPx;
  }
  fn getHorizontalSpace(&mut self, ) -> f64 {
    return (((self.marginLeftPx + self.marginRightPx) + self.paddingLeftPx) + self.paddingRightPx) + (self.borderWidthPx * 2_f64);
  }
  fn getVerticalSpace(&mut self, ) -> f64 {
    return (((self.marginTopPx + self.marginBottomPx) + self.paddingTopPx) + self.paddingBottomPx) + (self.borderWidthPx * 2_f64);
  }
  fn getMarginHorizontal(&mut self, ) -> f64 {
    return self.marginLeftPx + self.marginRightPx;
  }
  fn getMarginVertical(&mut self, ) -> f64 {
    return self.marginTopPx + self.marginBottomPx;
  }
  fn getPaddingHorizontal(&mut self, ) -> f64 {
    return self.paddingLeftPx + self.paddingRightPx;
  }
  fn getPaddingVertical(&mut self, ) -> f64 {
    return self.paddingTopPx + self.paddingBottomPx;
  }
  fn toString(&mut self, ) -> String {
    return [&*([&*([&*([&*([&*([&*([&*([&*([&*([&*([&*([&*([&*([&*([&*([&*([&*([&*"Box[margin:".to_string(), &*(self.marginTopPx.to_string())].concat()), &*"/".to_string()].concat()), &*(self.marginRightPx.to_string())].concat()), &*"/".to_string()].concat()), &*(self.marginBottomPx.to_string())].concat()), &*"/".to_string()].concat()), &*(self.marginLeftPx.to_string())].concat()), &*" padding:".to_string()].concat()), &*(self.paddingTopPx.to_string())].concat()), &*"/".to_string()].concat()), &*(self.paddingRightPx.to_string())].concat()), &*"/".to_string()].concat()), &*(self.paddingBottomPx.to_string())].concat()), &*"/".to_string()].concat()), &*(self.paddingLeftPx.to_string())].concat()), &*" border:".to_string()].concat()), &*(self.borderWidthPx.to_string())].concat()), &*"]".to_string()].concat().clone();
  }
}
#[derive(Clone)]
struct EVGElement { 
  id : String, 
  tagName : String, 
  elementType : i64, 
  parent : Option<Box<EVGElement>>, 
  children : Vec<EVGElement>, 
  width : Option<EVGUnit>, 
  height : Option<EVGUnit>, 
  minWidth : Option<EVGUnit>, 
  minHeight : Option<EVGUnit>, 
  maxWidth : Option<EVGUnit>, 
  maxHeight : Option<EVGUnit>, 
  left : Option<EVGUnit>, 
  top : Option<EVGUnit>, 
  right : Option<EVGUnit>, 
  bottom : Option<EVGUnit>, 
  x : Option<EVGUnit>, 
  y : Option<EVGUnit>, 
  r#box : Option<EVGBox>, 
  backgroundColor : Option<EVGColor>, 
  opacity : f64, 
  direction : String, 
  align : String, 
  verticalAlign : String, 
  isInline : bool, 
  lineBreak : bool, 
  overflow : String, 
  fontSize : Option<EVGUnit>, 
  fontFamily : String, 
  fontWeight : String, 
  lineHeight : f64, 
  textAlign : String, 
  color : Option<EVGColor>, 
  textContent : String, 
  display : String, 
  flex : f64, 
  flexDirection : String, 
  justifyContent : String, 
  alignItems : String, 
  gap : Option<EVGUnit>, 
  position : String, 
  marginTop : Option<EVGUnit>, 
  marginRight : Option<EVGUnit>, 
  marginBottom : Option<EVGUnit>, 
  marginLeft : Option<EVGUnit>, 
  paddingTop : Option<EVGUnit>, 
  paddingRight : Option<EVGUnit>, 
  paddingBottom : Option<EVGUnit>, 
  paddingLeft : Option<EVGUnit>, 
  borderWidth : Option<EVGUnit>, 
  borderTopWidth : Option<EVGUnit>, 
  borderRightWidth : Option<EVGUnit>, 
  borderBottomWidth : Option<EVGUnit>, 
  borderLeftWidth : Option<EVGUnit>, 
  borderColor : Option<EVGColor>, 
  borderRadius : Option<EVGUnit>, 
  src : String, 
  alt : String, 
  svgPath : String, 
  viewBox : String, 
  fillColor : Option<EVGColor>, 
  strokeColor : Option<EVGColor>, 
  strokeWidth : f64, 
  clipPath : String, 
  className : String, 
  imageQuality : i64, 
  maxImageSize : i64, 
  rotate : f64, 
  scale : f64, 
  shadowRadius : Option<EVGUnit>, 
  shadowColor : Option<EVGColor>, 
  shadowOffsetX : Option<EVGUnit>, 
  shadowOffsetY : Option<EVGUnit>, 
  calculatedX : f64, 
  calculatedY : f64, 
  calculatedWidth : f64, 
  calculatedHeight : f64, 
  calculatedInnerWidth : f64, 
  calculatedInnerHeight : f64, 
  calculatedFlexWidth : f64, 
  calculatedPage : i64, 
  isAbsolute : bool, 
  isLayoutComplete : bool, 
  unitsResolved : bool, 
  inheritedFontSize : f64, 
}
impl EVGElement { 
  
  pub fn new() ->  EVGElement {
    let mut me = EVGElement { 
      id:"".to_string(), 
      tagName:"div".to_string(), 
      elementType:0, 
      parent: None, 
      children: Vec::new(), 
      width: None, 
      height: None, 
      minWidth: None, 
      minHeight: None, 
      maxWidth: None, 
      maxHeight: None, 
      left: None, 
      top: None, 
      right: None, 
      bottom: None, 
      x: None, 
      y: None, 
      r#box: None, 
      backgroundColor: None, 
      opacity:1_f64, 
      direction:"row".to_string(), 
      align:"left".to_string(), 
      verticalAlign:"top".to_string(), 
      isInline:false, 
      lineBreak:false, 
      overflow:"visible".to_string(), 
      fontSize: None, 
      fontFamily:"Helvetica".to_string(), 
      fontWeight:"normal".to_string(), 
      lineHeight:1.2_f64, 
      textAlign:"left".to_string(), 
      color: None, 
      textContent:"".to_string(), 
      display:"block".to_string(), 
      flex:0_f64, 
      flexDirection:"column".to_string(), 
      justifyContent:"flex-start".to_string(), 
      alignItems:"flex-start".to_string(), 
      gap: None, 
      position:"relative".to_string(), 
      marginTop: None, 
      marginRight: None, 
      marginBottom: None, 
      marginLeft: None, 
      paddingTop: None, 
      paddingRight: None, 
      paddingBottom: None, 
      paddingLeft: None, 
      borderWidth: None, 
      borderTopWidth: None, 
      borderRightWidth: None, 
      borderBottomWidth: None, 
      borderLeftWidth: None, 
      borderColor: None, 
      borderRadius: None, 
      src:"".to_string(), 
      alt:"".to_string(), 
      svgPath:"".to_string(), 
      viewBox:"".to_string(), 
      fillColor: None, 
      strokeColor: None, 
      strokeWidth:0_f64, 
      clipPath:"".to_string(), 
      className:"".to_string(), 
      imageQuality:0, 
      maxImageSize:0, 
      rotate:0_f64, 
      scale:1_f64, 
      shadowRadius: None, 
      shadowColor: None, 
      shadowOffsetX: None, 
      shadowOffsetY: None, 
      calculatedX:0_f64, 
      calculatedY:0_f64, 
      calculatedWidth:0_f64, 
      calculatedHeight:0_f64, 
      calculatedInnerWidth:0_f64, 
      calculatedInnerHeight:0_f64, 
      calculatedFlexWidth:0_f64, 
      calculatedPage:0, 
      isAbsolute:false, 
      isLayoutComplete:false, 
      unitsResolved:false, 
      inheritedFontSize:14_f64, 
    };
    me.tagName = "div".to_string();
    me.elementType = 0;
    me.width = Some(EVGUnit::unset());
    me.height = Some(EVGUnit::unset());
    me.minWidth = Some(EVGUnit::unset());
    me.minHeight = Some(EVGUnit::unset());
    me.maxWidth = Some(EVGUnit::unset());
    me.maxHeight = Some(EVGUnit::unset());
    me.left = Some(EVGUnit::unset());
    me.top = Some(EVGUnit::unset());
    me.right = Some(EVGUnit::unset());
    me.bottom = Some(EVGUnit::unset());
    me.x = Some(EVGUnit::unset());
    me.y = Some(EVGUnit::unset());
    let mut newBox : EVGBox = EVGBox::new();
    me.r#box = Some(newBox.clone());
    me.backgroundColor = Some(EVGColor::noColor());
    me.color = Some(EVGColor::black());
    me.fontSize = Some(EVGUnit::px(14_f64));
    me.shadowRadius = Some(EVGUnit::unset());
    me.shadowColor = Some(EVGColor::noColor());
    me.shadowOffsetX = Some(EVGUnit::unset());
    me.shadowOffsetY = Some(EVGUnit::unset());
    me.fillColor = Some(EVGColor::noColor());
    me.strokeColor = Some(EVGColor::noColor());
    return me;
  }
  pub fn createDiv() -> EVGElement {
    let mut el : EVGElement = EVGElement::new();
    el.tagName = "div".to_string();
    el.elementType = 0;
    return el.clone();
  }
  pub fn createSpan() -> EVGElement {
    let mut el : EVGElement = EVGElement::new();
    el.tagName = "span".to_string();
    el.elementType = 1;
    return el.clone();
  }
  pub fn createImg() -> EVGElement {
    let mut el : EVGElement = EVGElement::new();
    el.tagName = "img".to_string();
    el.elementType = 2;
    return el.clone();
  }
  pub fn createPath() -> EVGElement {
    let mut el : EVGElement = EVGElement::new();
    el.tagName = "path".to_string();
    el.elementType = 3;
    return el.clone();
  }
  fn addChild(&mut self, mut child : &mut EVGElement) -> () {
    child.parent = Some(Box::new(self.clone()));
    self.children.push(child.clone());
  }
  fn resetLayoutState(&mut self, ) -> () {
    self.unitsResolved = false;
    self.calculatedX = 0_f64;
    self.calculatedY = 0_f64;
    self.calculatedWidth = 0_f64;
    self.calculatedHeight = 0_f64;
    let mut i : i64 = 0;
    while i < ((self.children.len() as i64)) {
      let mut child : EVGElement = self.children[i as usize].clone();
      child.resetLayoutState();
      i = i + 1;
    };
  }
  fn getChildCount(&mut self, ) -> i64 {
    return (self.children.len() as i64);
  }
  fn getChild(&mut self, index : i64) -> EVGElement {
    return self.children[index as usize].clone().clone();
  }
  fn hasParent(&mut self, ) -> bool {
    if self.parent.is_some() {
      return true;
    }
    return false;
  }
  fn isContainer(&mut self, ) -> bool {
    return self.elementType == 0;
  }
  fn isText(&mut self, ) -> bool {
    return self.elementType == 1;
  }
  fn isImage(&mut self, ) -> bool {
    return self.elementType == 2;
  }
  fn isPath(&mut self, ) -> bool {
    return self.elementType == 3;
  }
  fn hasAbsolutePosition(&mut self, ) -> bool {
    if  self.left.as_mut().unwrap().isSet {
      return true;
    }
    if  self.top.as_mut().unwrap().isSet {
      return true;
    }
    if  self.right.as_mut().unwrap().isSet {
      return true;
    }
    if  self.bottom.as_mut().unwrap().isSet {
      return true;
    }
    if  self.x.as_mut().unwrap().isSet {
      return true;
    }
    if  self.y.as_mut().unwrap().isSet {
      return true;
    }
    return false;
  }
  fn inheritProperties(&mut self, mut parentEl : EVGElement) -> () {
    if  self.fontFamily == "Helvetica".to_string() {
      self.fontFamily = parentEl.fontFamily.clone();
    }
    if  self.color.as_mut().unwrap().isSet == false {
      self.color = parentEl.color.clone();
    }
    self.inheritedFontSize = parentEl.inheritedFontSize;
    if  self.fontSize.as_mut().unwrap().isSet {
      let __arg_0 = self.inheritedFontSize.clone();
      let __arg_1 = self.inheritedFontSize.clone();
      self.fontSize.as_mut().unwrap().resolve(__arg_0, __arg_1);
      self.inheritedFontSize = self.fontSize.as_mut().unwrap().pixels;
    }
  }
  fn resolveUnits(&mut self, parentWidth : f64, parentHeight : f64) -> () {
    if  self.unitsResolved {
      return;
    }
    self.unitsResolved = true;
    let fs : f64 = self.inheritedFontSize;
    self.width.as_mut().unwrap().resolveWithHeight(parentWidth, parentHeight, fs);
    self.height.as_mut().unwrap().resolveForHeight(parentWidth, parentHeight, fs);
    self.minWidth.as_mut().unwrap().resolve(parentWidth, fs);
    self.minHeight.as_mut().unwrap().resolve(parentHeight, fs);
    self.maxWidth.as_mut().unwrap().resolve(parentWidth, fs);
    self.maxHeight.as_mut().unwrap().resolve(parentHeight, fs);
    self.left.as_mut().unwrap().resolve(parentWidth, fs);
    self.top.as_mut().unwrap().resolve(parentHeight, fs);
    self.right.as_mut().unwrap().resolve(parentWidth, fs);
    self.bottom.as_mut().unwrap().resolve(parentHeight, fs);
    self.x.as_mut().unwrap().resolve(parentWidth, fs);
    self.y.as_mut().unwrap().resolve(parentHeight, fs);
    self.r#box.as_mut().unwrap().resolveUnits(parentWidth, parentHeight, fs);
    self.shadowRadius.as_mut().unwrap().resolve(parentWidth, fs);
    self.shadowOffsetX.as_mut().unwrap().resolve(parentWidth, fs);
    self.shadowOffsetY.as_mut().unwrap().resolve(parentHeight, fs);
    self.isAbsolute = self.hasAbsolutePosition();
  }
  fn setAttribute(&mut self, name : String, value : String) -> () {
    if  name == "id".to_string() {
      self.id = value.clone();
      return;
    }
    if  name == "width".to_string() {
      self.width = Some(EVGUnit::parse(value.clone()));
      return;
    }
    if  name == "height".to_string() {
      self.height = Some(EVGUnit::parse(value.clone()));
      return;
    }
    if  (name == "min-width".to_string()) || (name == "minWidth".to_string()) {
      self.minWidth = Some(EVGUnit::parse(value.clone()));
      return;
    }
    if  (name == "min-height".to_string()) || (name == "minHeight".to_string()) {
      self.minHeight = Some(EVGUnit::parse(value.clone()));
      return;
    }
    if  (name == "max-width".to_string()) || (name == "maxWidth".to_string()) {
      self.maxWidth = Some(EVGUnit::parse(value.clone()));
      return;
    }
    if  (name == "max-height".to_string()) || (name == "maxHeight".to_string()) {
      self.maxHeight = Some(EVGUnit::parse(value.clone()));
      return;
    }
    if  name == "left".to_string() {
      self.left = Some(EVGUnit::parse(value.clone()));
      return;
    }
    if  name == "top".to_string() {
      self.top = Some(EVGUnit::parse(value.clone()));
      return;
    }
    if  name == "right".to_string() {
      self.right = Some(EVGUnit::parse(value.clone()));
      return;
    }
    if  name == "bottom".to_string() {
      self.bottom = Some(EVGUnit::parse(value.clone()));
      return;
    }
    if  name == "x".to_string() {
      self.x = Some(EVGUnit::parse(value.clone()));
      return;
    }
    if  name == "y".to_string() {
      self.y = Some(EVGUnit::parse(value.clone()));
      return;
    }
    if  name == "margin".to_string() {
      let __arg_0 = EVGUnit::parse(value.clone()).clone();
      self.r#box.as_mut().unwrap().setMargin(__arg_0);
      return;
    }
    if  (name == "margin-left".to_string()) || (name == "marginLeft".to_string()) {
      self.r#box.as_mut().unwrap().marginLeft = Some(EVGUnit::parse(value.clone()));
      return;
    }
    if  (name == "margin-right".to_string()) || (name == "marginRight".to_string()) {
      self.r#box.as_mut().unwrap().marginRight = Some(EVGUnit::parse(value.clone()));
      return;
    }
    if  (name == "margin-top".to_string()) || (name == "marginTop".to_string()) {
      self.r#box.as_mut().unwrap().marginTop = Some(EVGUnit::parse(value.clone()));
      return;
    }
    if  (name == "margin-bottom".to_string()) || (name == "marginBottom".to_string()) {
      self.r#box.as_mut().unwrap().marginBottom = Some(EVGUnit::parse(value.clone()));
      return;
    }
    if  name == "padding".to_string() {
      let __arg_0 = EVGUnit::parse(value.clone()).clone();
      self.r#box.as_mut().unwrap().setPadding(__arg_0);
      return;
    }
    if  (name == "padding-left".to_string()) || (name == "paddingLeft".to_string()) {
      self.r#box.as_mut().unwrap().paddingLeft = Some(EVGUnit::parse(value.clone()));
      return;
    }
    if  (name == "padding-right".to_string()) || (name == "paddingRight".to_string()) {
      self.r#box.as_mut().unwrap().paddingRight = Some(EVGUnit::parse(value.clone()));
      return;
    }
    if  (name == "padding-top".to_string()) || (name == "paddingTop".to_string()) {
      self.r#box.as_mut().unwrap().paddingTop = Some(EVGUnit::parse(value.clone()));
      return;
    }
    if  (name == "padding-bottom".to_string()) || (name == "paddingBottom".to_string()) {
      self.r#box.as_mut().unwrap().paddingBottom = Some(EVGUnit::parse(value.clone()));
      return;
    }
    if  (name == "border-width".to_string()) || (name == "borderWidth".to_string()) {
      self.r#box.as_mut().unwrap().borderWidth = Some(EVGUnit::parse(value.clone()));
      return;
    }
    if  (name == "border-color".to_string()) || (name == "borderColor".to_string()) {
      self.r#box.as_mut().unwrap().borderColor = Some(EVGColor::parse(value.clone()));
      return;
    }
    if  (name == "border-radius".to_string()) || (name == "borderRadius".to_string()) {
      self.r#box.as_mut().unwrap().borderRadius = Some(EVGUnit::parse(value.clone()));
      return;
    }
    if  (name == "background-color".to_string()) || (name == "backgroundColor".to_string()) {
      self.backgroundColor = Some(EVGColor::parse(value.clone()));
      return;
    }
    if  name == "color".to_string() {
      self.color = Some(EVGColor::parse(value.clone()));
      return;
    }
    if  name == "opacity".to_string() {
      let val : Option<f64> = value.parse::<f64>().ok();
      self.opacity = val.unwrap();
      return;
    }
    if  name == "direction".to_string() {
      self.direction = value.clone();
      return;
    }
    if  name == "align".to_string() {
      self.align = value.clone();
      return;
    }
    if  (name == "vertical-align".to_string()) || (name == "verticalAlign".to_string()) {
      self.verticalAlign = value.clone();
      return;
    }
    if  name == "inline".to_string() {
      self.isInline = value == "true".to_string();
      return;
    }
    if  (name == "line-break".to_string()) || (name == "lineBreak".to_string()) {
      self.lineBreak = value == "true".to_string();
      return;
    }
    if  name == "overflow".to_string() {
      self.overflow = value.clone();
      return;
    }
    if  (name == "flex-direction".to_string()) || (name == "flexDirection".to_string()) {
      self.flexDirection = value.clone();
      return;
    }
    if  name == "flex".to_string() {
      let val_1 : Option<f64> = value.parse::<f64>().ok();
      if val_1.is_some() {
        self.flex = val_1.unwrap();
      }
      return;
    }
    if  name == "gap".to_string() {
      self.gap = Some(EVGUnit::parse(value.clone()));
      return;
    }
    if  (name == "justify-content".to_string()) || (name == "justifyContent".to_string()) {
      self.justifyContent = value.clone();
      return;
    }
    if  (name == "align-items".to_string()) || (name == "alignItems".to_string()) {
      self.alignItems = value.clone();
      return;
    }
    if  (name == "font-size".to_string()) || (name == "fontSize".to_string()) {
      self.fontSize = Some(EVGUnit::parse(value.clone()));
      return;
    }
    if  (name == "font-family".to_string()) || (name == "fontFamily".to_string()) {
      self.fontFamily = value.clone();
      return;
    }
    if  (name == "font-weight".to_string()) || (name == "fontWeight".to_string()) {
      self.fontWeight = value.clone();
      return;
    }
    if  (name == "text-align".to_string()) || (name == "textAlign".to_string()) {
      self.textAlign = value.clone();
      return;
    }
    if  (name == "line-height".to_string()) || (name == "lineHeight".to_string()) {
      let val_2 : Option<f64> = value.parse::<f64>().ok();
      if val_2.is_some() {
        self.lineHeight = val_2.unwrap();
      }
      return;
    }
    if  name == "rotate".to_string() {
      let val_3 : Option<f64> = value.parse::<f64>().ok();
      self.rotate = val_3.unwrap();
      return;
    }
    if  name == "scale".to_string() {
      let val_4 : Option<f64> = value.parse::<f64>().ok();
      self.scale = val_4.unwrap();
      return;
    }
    if  (name == "shadow-radius".to_string()) || (name == "shadowRadius".to_string()) {
      self.shadowRadius = Some(EVGUnit::parse(value.clone()));
      return;
    }
    if  (name == "shadow-color".to_string()) || (name == "shadowColor".to_string()) {
      self.shadowColor = Some(EVGColor::parse(value.clone()));
      return;
    }
    if  (name == "shadow-offset-x".to_string()) || (name == "shadowOffsetX".to_string()) {
      self.shadowOffsetX = Some(EVGUnit::parse(value.clone()));
      return;
    }
    if  (name == "shadow-offset-y".to_string()) || (name == "shadowOffsetY".to_string()) {
      self.shadowOffsetY = Some(EVGUnit::parse(value.clone()));
      return;
    }
    if  (name == "clip-path".to_string()) || (name == "clipPath".to_string()) {
      self.clipPath = value.clone();
      return;
    }
    if  name == "imageQuality".to_string() {
      let val_5 : Option<i64> = value.parse::<i64>().ok();
      if val_5.is_some() {
        self.imageQuality = val_5.unwrap();
      }
      return;
    }
    if  name == "maxImageSize".to_string() {
      let val_6 : Option<i64> = value.parse::<i64>().ok();
      if val_6.is_some() {
        self.maxImageSize = val_6.unwrap();
      }
      return;
    }
    if  (name == "d".to_string()) || (name == "svgPath".to_string()) {
      self.svgPath = value.clone();
      return;
    }
    if  name == "viewBox".to_string() {
      self.viewBox = value.clone();
      return;
    }
    if  name == "fill".to_string() {
      self.fillColor = Some(EVGColor::parse(value.clone()));
      return;
    }
    if  name == "stroke".to_string() {
      self.strokeColor = Some(EVGColor::parse(value.clone()));
      return;
    }
    if  (name == "stroke-width".to_string()) || (name == "strokeWidth".to_string()) {
      let val_7 : Option<f64> = value.parse::<f64>().ok();
      if val_7.is_some() {
        self.strokeWidth = val_7.unwrap();
      }
      return;
    }
  }
  fn getCalculatedBounds(&mut self, ) -> String {
    return [&*([&*([&*([&*([&*([&*([&*"(".to_string(), &*(self.calculatedX.to_string())].concat()), &*", ".to_string()].concat()), &*(self.calculatedY.to_string())].concat()), &*") ".to_string()].concat()), &*(self.calculatedWidth.to_string())].concat()), &*"x".to_string()].concat()), &*(self.calculatedHeight.to_string())].concat().clone();
  }
  fn toString(&mut self, ) -> String {
    return [&*([&*([&*([&*([&*([&*"<".to_string(), &*self.tagName].concat()), &*" id=\"".to_string()].concat()), &*self.id].concat()), &*"\" ".to_string()].concat()), &*self.getCalculatedBounds()].concat()), &*">".to_string()].concat().clone();
  }
}
#[derive(Clone)]
struct BufferChunk { 
  data : Vec<u8>, 
  used : i64, 
  capacity : i64, 
  next : Option<Box<BufferChunk>>, 
}
impl BufferChunk { 
  
  pub fn new(size : i64) ->  BufferChunk {
    let mut me = BufferChunk { 
      data:vec![0u8; 0 as usize], 
      used:0, 
      capacity:0, 
      next: None, 
    };
    me.data = vec![0u8; size as usize];
    me.capacity = size;
    me.used = 0;
    return me;
  }
  fn remaining(&mut self, ) -> i64 {
    return self.capacity - self.used;
  }
  fn isFull(&mut self, ) -> bool {
    return self.used >= self.capacity;
  }
}
#[derive(Clone)]
struct GrowableBuffer { 
  firstChunk : BufferChunk, 
  currentChunk : BufferChunk, 
  chunkSize : i64, 
  totalSize : i64, 
}
impl GrowableBuffer { 
  
  pub fn new() ->  GrowableBuffer {
    let mut me = GrowableBuffer { 
      firstChunk:BufferChunk::new(4096), 
      currentChunk:BufferChunk::new(4096), 
      chunkSize:4096, 
      totalSize:0, 
    };
    let mut chunk : BufferChunk = BufferChunk::new(me.chunkSize);
    me.firstChunk = chunk.clone();
    me.currentChunk = chunk.clone();
    return me;
  }
  fn setChunkSize(&mut self, size : i64) -> () {
    self.chunkSize = size;
  }
  fn allocateNewChunk(&mut self, ) -> () {
    let mut newChunk : BufferChunk = BufferChunk::new(self.chunkSize);
    self.currentChunk.next = Some(Box::new(newChunk.clone()));
    self.currentChunk = newChunk.clone();
  }
  fn writeByte(&mut self, b : i64) -> () {
    if  self.currentChunk.isFull() {
      self.allocateNewChunk();
    }
    let pos : i64 = self.currentChunk.used;
    self.currentChunk.data[(pos) as usize] = b as u8;
    self.currentChunk.used = pos + 1;
    self.totalSize = self.totalSize + 1;
  }
  fn writeBytes(&mut self, src : &Vec<u8>, srcOffset : i64, length : i64) -> () {
    let mut i : i64 = 0;
    while i < length {
      let b : i64 = src[((srcOffset + i)) as usize] as i64;
      self.writeByte(b);
      i = i + 1;
    };
  }
  fn writeBuffer(&mut self, src : &Vec<u8>) -> () {
    let __len : i64 = src.len() as i64;
    self.writeBytes(&src, 0, __len);
  }
  fn writeString(&mut self, s : String) -> () {
    let __len : i64 = s.len() as i64;
    let mut i : i64 = 0;
    while i < __len {
      let ch : i64 = s.chars().nth(i as usize).unwrap_or('\0') as i64;
      self.writeByte(ch);
      i = i + 1;
    };
  }
  fn writeInt16BE(&mut self, value : i64) -> () {
    let highD : f64 = (value as f64) / (256 as f64);
    let high : i64 = highD as i64 ;
    let low : i64 = value - (high * 256);
    self.writeByte(high);
    self.writeByte(low);
  }
  fn writeInt32BE(&mut self, value : i64) -> () {
    let b1D : f64 = (value as f64) / (16777216 as f64);
    let b1 : i64 = b1D as i64 ;
    let rem1 : i64 = value - (b1 * 16777216);
    let b2D : f64 = (rem1 as f64) / (65536 as f64);
    let b2 : i64 = b2D as i64 ;
    let rem2 : i64 = rem1 - (b2 * 65536);
    let b3D : f64 = (rem2 as f64) / (256 as f64);
    let b3 : i64 = b3D as i64 ;
    let b4 : i64 = rem2 - (b3 * 256);
    self.writeByte(b1);
    self.writeByte(b2);
    self.writeByte(b3);
    self.writeByte(b4);
  }
  fn size(&mut self, ) -> i64 {
    return self.totalSize;
  }
  fn toBuffer(&mut self, ) -> Vec<u8> {
    let allocSize : i64 = self.totalSize;
    let mut result : Vec<u8> = vec![0u8; allocSize as usize];
    let mut pos : i64 = 0;
    let mut chunk : BufferChunk = self.firstChunk.clone();
    let mut done : bool = false;
    while done == false {
      let chunkUsed : i64 = chunk.used;
      let mut i : i64 = 0;
      while i < chunkUsed {
        let b : i64 = chunk.data[(i) as usize] as i64;
        result[(pos) as usize] = b as u8;
        pos = pos + 1;
        i = i + 1;
      };
      if  chunk.next.is_none() {
        done = true;
      } else {
        chunk = (*chunk.next.clone().unwrap());
      }
    };
    return result;
  }
  fn toString(&mut self, ) -> String {
    let mut result : String = "".to_string();
    let mut chunk : BufferChunk = self.firstChunk.clone();
    let mut done : bool = false;
    while done == false {
      let chunkUsed : i64 = chunk.used;
      let mut i : i64 = 0;
      while i < chunkUsed {
        let b : i64 = chunk.data[(i) as usize] as i64;
        result = [&*result, &*((char::from_u32(b as u32).unwrap_or('\0').to_string()))].concat();
        i = i + 1;
      };
      if  chunk.next.is_none() {
        done = true;
      } else {
        chunk = (*chunk.next.clone().unwrap());
      }
    };
    return result.clone();
  }
  fn clear(&mut self, ) -> () {
    let mut chunk : BufferChunk = BufferChunk::new(self.chunkSize);
    self.firstChunk = chunk.clone();
    self.currentChunk = chunk.clone();
    self.totalSize = 0;
  }
}
#[derive(Clone)]
struct JPEGImage { 
  width : i64, 
  height : i64, 
  colorComponents : i64, 
  bitsPerComponent : i64, 
  imageData : Option<Vec<u8>>, 
  isValid : bool, 
  errorMessage : String, 
}
impl JPEGImage { 
  
  pub fn new() ->  JPEGImage {
    let mut me = JPEGImage { 
      width:0, 
      height:0, 
      colorComponents:3, 
      bitsPerComponent:8, 
      imageData: None, 
      isValid:false, 
      errorMessage:"".to_string(), 
    };
    return me;
  }
}
#[derive(Clone)]
struct JPEGReader { 
}
impl JPEGReader { 
  
  pub fn new() ->  JPEGReader {
    let mut me = JPEGReader { 
    };
    return me;
  }
  fn readUint16BE(data : &Vec<u8>, offset : i64) -> i64 {
    let high : i64 = data[(offset) as usize] as i64;
    let low : i64 = data[((offset + 1)) as usize] as i64;
    return (high * 256) + low;
  }
  fn readJPEG(&mut self, dirPath : String, fileName : String) -> JPEGImage {
    let mut result : JPEGImage = JPEGImage::new();
    let mut data : Vec<u8> = std::fs::read(format!("{}/{}", dirPath, fileName)).unwrap_or_default();
    let dataLen : i64 = data.len() as i64;
    if  dataLen < 4 {
      result.errorMessage = "File too small to be a valid JPEG".to_string();
      return result.clone();
    }
    let marker1 : i64 = data[(0) as usize] as i64;
    let marker2 : i64 = data[(1) as usize] as i64;
    if  (marker1 != 255) || (marker2 != 216) {
      result.errorMessage = "Invalid JPEG signature - expected FFD8".to_string();
      return result.clone();
    }
    let mut pos : i64 = 2;
    let mut foundSOF : bool = false;
    while (pos < (dataLen - 2)) && (foundSOF == false) {
      let m1 : i64 = data[(pos) as usize] as i64;
      if  m1 != 255 {
        pos = pos + 1;
      } else {
        let m2 : i64 = data[((pos + 1)) as usize] as i64;
        if  m2 == 255 {
          pos = pos + 1;
        } else {
          if  m2 == 0 {
            pos = pos + 2;
          } else {
            if  ((m2 == 192) || (m2 == 193)) || (m2 == 194) {
              if  (pos + 9) < dataLen {
                result.bitsPerComponent = data[((pos + 4)) as usize] as i64;
                result.height = JPEGReader::readUint16BE(&data, (pos + 5));
                result.width = JPEGReader::readUint16BE(&data, (pos + 7));
                result.colorComponents = data[((pos + 9)) as usize] as i64;
                foundSOF = true;
              }
            } else {
              if  m2 == 217 {
                pos = dataLen;
              } else {
                if  m2 == 218 {
                  pos = dataLen;
                } else {
                  if  (pos + 4) < dataLen {
                    let segLen : i64 = JPEGReader::readUint16BE(&data, (pos + 2));
                    pos = (pos + 2) + segLen;
                  } else {
                    pos = dataLen;
                  }
                }
              }
            }
          }
        }
      }
    };
    if  foundSOF == false {
      result.errorMessage = "Could not find SOF marker in JPEG".to_string();
      return result.clone();
    }
    result.imageData = Some(data);
    result.isValid = true;
    return result.clone();
  }
  fn getImageInfo(&mut self, mut img : JPEGImage) -> String {
    if  img.isValid == false {
      return [&*"Invalid JPEG: ".to_string(), &*img.errorMessage].concat().clone();
    }
    return [&*([&*([&*([&*([&*([&*([&*([&*"JPEG: ".to_string(), &*(img.width.to_string())].concat()), &*"x".to_string()].concat()), &*(img.height.to_string())].concat()), &*" pixels, ".to_string()].concat()), &*(img.colorComponents.to_string())].concat()), &*" components, ".to_string()].concat()), &*(img.bitsPerComponent.to_string())].concat()), &*" bits".to_string()].concat().clone();
  }
}
#[derive(Clone)]
struct ExifTag { 
  tagId : i64, 
  tagName : String, 
  tagValue : String, 
  dataType : i64, 
}
impl ExifTag { 
  
  pub fn new() ->  ExifTag {
    let mut me = ExifTag { 
      tagId:0, 
      tagName:"".to_string(), 
      tagValue:"".to_string(), 
      dataType:0, 
    };
    return me;
  }
}
#[derive(Clone)]
struct JPEGMetadataInfo { 
  isValid : bool, 
  errorMessage : String, 
  hasJFIF : bool, 
  jfifVersion : String, 
  densityUnits : i64, 
  xDensity : i64, 
  yDensity : i64, 
  width : i64, 
  height : i64, 
  colorComponents : i64, 
  bitsPerComponent : i64, 
  hasExif : bool, 
  cameraMake : String, 
  cameraModel : String, 
  software : String, 
  dateTime : String, 
  dateTimeOriginal : String, 
  exposureTime : String, 
  fNumber : String, 
  isoSpeed : String, 
  focalLength : String, 
  flash : String, 
  orientation : i64, 
  xResolution : String, 
  yResolution : String, 
  resolutionUnit : i64, 
  hasGPS : bool, 
  gpsLatitude : String, 
  gpsLongitude : String, 
  gpsAltitude : String, 
  gpsLatitudeRef : String, 
  gpsLongitudeRef : String, 
  hasComment : bool, 
  comment : String, 
  exifTags : Vec<ExifTag>, 
}
impl JPEGMetadataInfo { 
  
  pub fn new() ->  JPEGMetadataInfo {
    let mut me = JPEGMetadataInfo { 
      isValid:false, 
      errorMessage:"".to_string(), 
      hasJFIF:false, 
      jfifVersion:"".to_string(), 
      densityUnits:0, 
      xDensity:0, 
      yDensity:0, 
      width:0, 
      height:0, 
      colorComponents:0, 
      bitsPerComponent:0, 
      hasExif:false, 
      cameraMake:"".to_string(), 
      cameraModel:"".to_string(), 
      software:"".to_string(), 
      dateTime:"".to_string(), 
      dateTimeOriginal:"".to_string(), 
      exposureTime:"".to_string(), 
      fNumber:"".to_string(), 
      isoSpeed:"".to_string(), 
      focalLength:"".to_string(), 
      flash:"".to_string(), 
      orientation:1, 
      xResolution:"".to_string(), 
      yResolution:"".to_string(), 
      resolutionUnit:0, 
      hasGPS:false, 
      gpsLatitude:"".to_string(), 
      gpsLongitude:"".to_string(), 
      gpsAltitude:"".to_string(), 
      gpsLatitudeRef:"".to_string(), 
      gpsLongitudeRef:"".to_string(), 
      hasComment:false, 
      comment:"".to_string(), 
      exifTags: Vec::new(), 
    };
    return me;
  }
}
#[derive(Clone)]
struct JPEGMetadataParser { 
  data : Vec<u8>, 
  dataLen : i64, 
  littleEndian : bool, 
}
impl JPEGMetadataParser { 
  
  pub fn new() ->  JPEGMetadataParser {
    let mut me = JPEGMetadataParser { 
      data:vec![0u8; 0 as usize], 
      dataLen:0, 
      littleEndian:false, 
    };
    return me;
  }
  fn readUint16BE(&mut self, offset : i64) -> i64 {
    let high : i64 = self.data[(offset) as usize] as i64;
    let low : i64 = self.data[((offset + 1)) as usize] as i64;
    return (high * 256) + low;
  }
  fn readUint16(&mut self, offset : i64) -> i64 {
    let mut result : i64 = 0;
    if  self.littleEndian {
      let low : i64 = self.data[(offset) as usize] as i64;
      let high : i64 = self.data[((offset + 1)) as usize] as i64;
      result = (high * 256) + low;
    } else {
      let high_1 : i64 = self.data[(offset) as usize] as i64;
      let low_1 : i64 = self.data[((offset + 1)) as usize] as i64;
      result = (high_1 * 256) + low_1;
    }
    return result;
  }
  fn readUint32(&mut self, offset : i64) -> i64 {
    let mut result : i64 = 0;
    if  self.littleEndian {
      let b0 : i64 = self.data[(offset) as usize] as i64;
      let b1 : i64 = self.data[((offset + 1)) as usize] as i64;
      let b2 : i64 = self.data[((offset + 2)) as usize] as i64;
      let b3 : i64 = self.data[((offset + 3)) as usize] as i64;
      result = (((b3 * 16777216) + (b2 * 65536)) + (b1 * 256)) + b0;
    } else {
      let b0_1 : i64 = self.data[(offset) as usize] as i64;
      let b1_1 : i64 = self.data[((offset + 1)) as usize] as i64;
      let b2_1 : i64 = self.data[((offset + 2)) as usize] as i64;
      let b3_1 : i64 = self.data[((offset + 3)) as usize] as i64;
      result = (((b0_1 * 16777216) + (b1_1 * 65536)) + (b2_1 * 256)) + b3_1;
    }
    return result;
  }
  fn readString(&mut self, offset : i64, length : i64) -> String {
    let mut result : String = "".to_string();
    let mut i : i64 = 0;
    while i < length {
      let b : i64 = self.data[((offset + i)) as usize] as i64;
      if  b == 0 {
        return result.clone();
      }
      result = [&*result, &*((char::from_u32(b as u32).unwrap_or('\0').to_string()))].concat();
      i = i + 1;
    };
    return result.clone();
  }
  fn getTagName(tagId : i64, ifdType : i64) -> String {
    if  ifdType == 2 {
      if  tagId == 0 {
        return "GPSVersionID".to_string().clone();
      }
      if  tagId == 1 {
        return "GPSLatitudeRef".to_string().clone();
      }
      if  tagId == 2 {
        return "GPSLatitude".to_string().clone();
      }
      if  tagId == 3 {
        return "GPSLongitudeRef".to_string().clone();
      }
      if  tagId == 4 {
        return "GPSLongitude".to_string().clone();
      }
      if  tagId == 5 {
        return "GPSAltitudeRef".to_string().clone();
      }
      if  tagId == 6 {
        return "GPSAltitude".to_string().clone();
      }
      return [&*"GPS_".to_string(), &*(tagId.to_string())].concat().clone();
    }
    if  tagId == 256 {
      return "ImageWidth".to_string().clone();
    }
    if  tagId == 257 {
      return "ImageHeight".to_string().clone();
    }
    if  tagId == 258 {
      return "BitsPerSample".to_string().clone();
    }
    if  tagId == 259 {
      return "Compression".to_string().clone();
    }
    if  tagId == 262 {
      return "PhotometricInterpretation".to_string().clone();
    }
    if  tagId == 270 {
      return "ImageDescription".to_string().clone();
    }
    if  tagId == 271 {
      return "Make".to_string().clone();
    }
    if  tagId == 272 {
      return "Model".to_string().clone();
    }
    if  tagId == 274 {
      return "Orientation".to_string().clone();
    }
    if  tagId == 282 {
      return "XResolution".to_string().clone();
    }
    if  tagId == 283 {
      return "YResolution".to_string().clone();
    }
    if  tagId == 296 {
      return "ResolutionUnit".to_string().clone();
    }
    if  tagId == 305 {
      return "Software".to_string().clone();
    }
    if  tagId == 306 {
      return "DateTime".to_string().clone();
    }
    if  tagId == 315 {
      return "Artist".to_string().clone();
    }
    if  tagId == 33432 {
      return "Copyright".to_string().clone();
    }
    if  tagId == 33434 {
      return "ExposureTime".to_string().clone();
    }
    if  tagId == 33437 {
      return "FNumber".to_string().clone();
    }
    if  tagId == 34850 {
      return "ExposureProgram".to_string().clone();
    }
    if  tagId == 34855 {
      return "ISOSpeedRatings".to_string().clone();
    }
    if  tagId == 36864 {
      return "ExifVersion".to_string().clone();
    }
    if  tagId == 36867 {
      return "DateTimeOriginal".to_string().clone();
    }
    if  tagId == 36868 {
      return "DateTimeDigitized".to_string().clone();
    }
    if  tagId == 37377 {
      return "ShutterSpeedValue".to_string().clone();
    }
    if  tagId == 37378 {
      return "ApertureValue".to_string().clone();
    }
    if  tagId == 37380 {
      return "ExposureBiasValue".to_string().clone();
    }
    if  tagId == 37381 {
      return "MaxApertureValue".to_string().clone();
    }
    if  tagId == 37383 {
      return "MeteringMode".to_string().clone();
    }
    if  tagId == 37384 {
      return "LightSource".to_string().clone();
    }
    if  tagId == 37385 {
      return "Flash".to_string().clone();
    }
    if  tagId == 37386 {
      return "FocalLength".to_string().clone();
    }
    if  tagId == 37500 {
      return "MakerNote".to_string().clone();
    }
    if  tagId == 37510 {
      return "UserComment".to_string().clone();
    }
    if  tagId == 40960 {
      return "FlashpixVersion".to_string().clone();
    }
    if  tagId == 40961 {
      return "ColorSpace".to_string().clone();
    }
    if  tagId == 40962 {
      return "PixelXDimension".to_string().clone();
    }
    if  tagId == 40963 {
      return "PixelYDimension".to_string().clone();
    }
    if  tagId == 41486 {
      return "FocalPlaneXResolution".to_string().clone();
    }
    if  tagId == 41487 {
      return "FocalPlaneYResolution".to_string().clone();
    }
    if  tagId == 41488 {
      return "FocalPlaneResolutionUnit".to_string().clone();
    }
    if  tagId == 41495 {
      return "SensingMethod".to_string().clone();
    }
    if  tagId == 41728 {
      return "FileSource".to_string().clone();
    }
    if  tagId == 41729 {
      return "SceneType".to_string().clone();
    }
    if  tagId == 41985 {
      return "CustomRendered".to_string().clone();
    }
    if  tagId == 41986 {
      return "ExposureMode".to_string().clone();
    }
    if  tagId == 41987 {
      return "WhiteBalance".to_string().clone();
    }
    if  tagId == 41988 {
      return "DigitalZoomRatio".to_string().clone();
    }
    if  tagId == 41989 {
      return "FocalLengthIn35mmFilm".to_string().clone();
    }
    if  tagId == 41990 {
      return "SceneCaptureType".to_string().clone();
    }
    if  tagId == 34665 {
      return "ExifIFDPointer".to_string().clone();
    }
    if  tagId == 34853 {
      return "GPSInfoIFDPointer".to_string().clone();
    }
    return [&*"Tag_".to_string(), &*(tagId.to_string())].concat().clone();
  }
  fn formatRational(&mut self, offset : i64) -> String {
    let numerator : i64 = self.readUint32(offset);
    let denominator : i64 = self.readUint32((offset + 4));
    if  denominator == 0 {
      return numerator.to_string().clone();
    }
    if  denominator == 1 {
      return numerator.to_string().clone();
    }
    return [&*([&*(numerator.to_string()), &*"/".to_string()].concat()), &*(denominator.to_string())].concat().clone();
  }
  fn formatGPSCoordinate(&mut self, offset : i64, r#ref : String) -> String {
    let degNum : i64 = self.readUint32(offset);
    let degDen : i64 = self.readUint32((offset + 4));
    let minNum : i64 = self.readUint32((offset + 8));
    let minDen : i64 = self.readUint32((offset + 12));
    let secNum : i64 = self.readUint32((offset + 16));
    let secDen : i64 = self.readUint32((offset + 20));
    let mut degrees : i64 = 0;
    if  degDen > 0 {
      let mut tempDeg : i64 = degNum;
      while tempDeg >= degDen {
        tempDeg = tempDeg - degDen;
        degrees = degrees + 1;
      };
    }
    let mut minutes : i64 = 0;
    if  minDen > 0 {
      let mut tempMin : i64 = minNum;
      while tempMin >= minDen {
        tempMin = tempMin - minDen;
        minutes = minutes + 1;
      };
    }
    let mut seconds : String = "0".to_string();
    if  secDen > 0 {
      let mut secWhole : i64 = 0;
      let mut tempSec : i64 = secNum;
      while tempSec >= secDen {
        tempSec = tempSec - secDen;
        secWhole = secWhole + 1;
      };
      let secRem : i64 = tempSec;
      if  secRem > 0 {
        let mut decPartTemp : i64 = secRem * 100;
        let mut decPart : i64 = 0;
        while decPartTemp >= secDen {
          decPartTemp = decPartTemp - secDen;
          decPart = decPart + 1;
        };
        if  decPart < 10 {
          seconds = [&*([&*(secWhole.to_string()), &*".0".to_string()].concat()), &*(decPart.to_string())].concat();
        } else {
          seconds = [&*([&*(secWhole.to_string()), &*".".to_string()].concat()), &*(decPart.to_string())].concat();
        }
      } else {
        seconds = secWhole.to_string();
      }
    }
    return [&*([&*([&*([&*([&*([&*(degrees.to_string()), &*"° ".to_string()].concat()), &*(minutes.to_string())].concat()), &*"' ".to_string()].concat()), &*seconds].concat()), &*"\" ".to_string()].concat()), &*r#ref].concat().clone();
  }
  fn parseIFD(&mut self, mut info : &mut JPEGMetadataInfo, tiffStart : i64, ifdOffset : i64, ifdType : i64) -> () {
    let mut pos : i64 = tiffStart + ifdOffset;
    if  (pos + 2) > self.dataLen {
      return;
    }
    let numEntries : i64 = self.readUint16(pos);
    pos = pos + 2;
    let mut i : i64 = 0;
    while i < numEntries {
      if  (pos + 12) > self.dataLen {
        return;
      }
      let tagId : i64 = self.readUint16(pos);
      let dataType : i64 = self.readUint16((pos + 2));
      let numValues : i64 = self.readUint32((pos + 4));
      let mut valueOffset : i64 = pos + 8;
      let mut dataSize : i64 = 0;
      if  dataType == 1 {
        dataSize = numValues;
      }
      if  dataType == 2 {
        dataSize = numValues;
      }
      if  dataType == 3 {
        dataSize = numValues * 2;
      }
      if  dataType == 4 {
        dataSize = numValues * 4;
      }
      if  dataType == 5 {
        dataSize = numValues * 8;
      }
      if  dataType == 7 {
        dataSize = numValues;
      }
      if  dataType == 9 {
        dataSize = numValues * 4;
      }
      if  dataType == 10 {
        dataSize = numValues * 8;
      }
      if  dataSize > 4 {
        valueOffset = tiffStart + self.readUint32((pos + 8));
      }
      let tagName : String = JPEGMetadataParser::getTagName(tagId, ifdType);
      let mut tagValue : String = "".to_string();
      if  dataType == 2 {
        tagValue = self.readString(valueOffset, numValues);
      }
      if  dataType == 3 {
        if  dataSize <= 4 {
          tagValue = self.readUint16((pos + 8)).to_string();
        } else {
          tagValue = self.readUint16(valueOffset).to_string();
        }
      }
      if  dataType == 4 {
        if  dataSize <= 4 {
          tagValue = self.readUint32((pos + 8)).to_string();
        } else {
          tagValue = self.readUint32(valueOffset).to_string();
        }
      }
      if  dataType == 5 {
        tagValue = self.formatRational(valueOffset);
      }
      let mut tag : ExifTag = ExifTag::new();
      tag.tagId = tagId;
      tag.tagName = tagName.clone();
      tag.tagValue = tagValue.clone();
      tag.dataType = dataType;
      info.exifTags.push(tag.clone());
      if  tagId == 271 {
        info.cameraMake = tagValue.clone();
      }
      if  tagId == 272 {
        info.cameraModel = tagValue.clone();
      }
      if  tagId == 305 {
        info.software = tagValue.clone();
      }
      if  tagId == 306 {
        info.dateTime = tagValue.clone();
      }
      if  tagId == 274 {
        info.orientation = self.readUint16((pos + 8));
      }
      if  tagId == 282 {
        info.xResolution = tagValue.clone();
      }
      if  tagId == 283 {
        info.yResolution = tagValue.clone();
      }
      if  tagId == 296 {
        info.resolutionUnit = self.readUint16((pos + 8));
      }
      if  tagId == 36867 {
        info.dateTimeOriginal = tagValue.clone();
      }
      if  tagId == 33434 {
        info.exposureTime = tagValue.clone();
      }
      if  tagId == 33437 {
        info.fNumber = tagValue.clone();
      }
      if  tagId == 34855 {
        info.isoSpeed = tagValue.clone();
      }
      if  tagId == 37386 {
        info.focalLength = tagValue.clone();
      }
      if  tagId == 37385 {
        let flashVal : i64 = self.readUint16((pos + 8));
        if  (flashVal % 2) == 1 {
          info.flash = "Fired".to_string();
        } else {
          info.flash = "Did not fire".to_string();
        }
      }
      if  tagId == 34665 {
        let exifOffset : i64 = self.readUint32((pos + 8));
        self.parseIFD(&mut info, tiffStart, exifOffset, 1);
      }
      if  tagId == 34853 {
        info.hasGPS = true;
        let gpsOffset : i64 = self.readUint32((pos + 8));
        self.parseIFD(&mut info, tiffStart, gpsOffset, 2);
      }
      if  ifdType == 2 {
        if  tagId == 1 {
          info.gpsLatitudeRef = tagValue.clone();
        }
        if  tagId == 2 {
          info.gpsLatitude = self.formatGPSCoordinate(valueOffset, info.gpsLatitudeRef.clone());
        }
        if  tagId == 3 {
          info.gpsLongitudeRef = tagValue.clone();
        }
        if  tagId == 4 {
          info.gpsLongitude = self.formatGPSCoordinate(valueOffset, info.gpsLongitudeRef.clone());
        }
        if  tagId == 6 {
          let altNum : i64 = self.readUint32(valueOffset);
          let altDen : i64 = self.readUint32((valueOffset + 4));
          if  altDen > 0 {
            let mut altWhole : i64 = 0;
            let mut tempAlt : i64 = altNum;
            while tempAlt >= altDen {
              tempAlt = tempAlt - altDen;
              altWhole = altWhole + 1;
            };
            let altRem : i64 = tempAlt;
            if  altRem > 0 {
              let mut altDecTemp : i64 = altRem * 10;
              let mut altDec : i64 = 0;
              while altDecTemp >= altDen {
                altDecTemp = altDecTemp - altDen;
                altDec = altDec + 1;
              };
              info.gpsAltitude = [&*([&*([&*(altWhole.to_string()), &*".".to_string()].concat()), &*(altDec.to_string())].concat()), &*" m".to_string()].concat();
            } else {
              info.gpsAltitude = [&*(altWhole.to_string()), &*" m".to_string()].concat();
            }
          } else {
            info.gpsAltitude = [&*(altNum.to_string()), &*" m".to_string()].concat();
          }
        }
      }
      pos = pos + 12;
      i = i + 1;
    };
  }
  fn parseExif(&mut self, mut info : &mut JPEGMetadataInfo, appStart : i64, appLen : i64) -> () {
    let header : String = self.readString(appStart, 4);
    if  header != "Exif".to_string() {
      return;
    }
    info.hasExif = true;
    let tiffStart : i64 = appStart + 6;
    let byteOrder0 : i64 = self.data[(tiffStart) as usize] as i64;
    let byteOrder1 : i64 = self.data[((tiffStart + 1)) as usize] as i64;
    if  (byteOrder0 == 73) && (byteOrder1 == 73) {
      self.littleEndian = true;
    } else {
      if  (byteOrder0 == 77) && (byteOrder1 == 77) {
        self.littleEndian = false;
      } else {
        return;
      }
    }
    let magic : i64 = self.readUint16((tiffStart + 2));
    if  magic != 42 {
      return;
    }
    let ifd0Offset : i64 = self.readUint32((tiffStart + 4));
    self.parseIFD(&mut info, tiffStart, ifd0Offset, 0);
  }
  fn parseJFIF(&mut self, mut info : &mut JPEGMetadataInfo, appStart : i64, appLen : i64) -> () {
    let header : String = self.readString(appStart, 4);
    if  header != "JFIF".to_string() {
      return;
    }
    info.hasJFIF = true;
    let verMajor : i64 = self.data[((appStart + 5)) as usize] as i64;
    let verMinor : i64 = self.data[((appStart + 6)) as usize] as i64;
    info.jfifVersion = [&*([&*(verMajor.to_string()), &*".".to_string()].concat()), &*(verMinor.to_string())].concat();
    info.densityUnits = self.data[((appStart + 7)) as usize] as i64;
    info.xDensity = self.readUint16BE((appStart + 8));
    info.yDensity = self.readUint16BE((appStart + 10));
  }
  fn parseComment(&mut self, mut info : &mut JPEGMetadataInfo, appStart : i64, appLen : i64) -> () {
    info.hasComment = true;
    info.comment = self.readString(appStart, appLen);
  }
  fn parseMetadata(&mut self, dirPath : String, fileName : String) -> JPEGMetadataInfo {
    let mut info : JPEGMetadataInfo = JPEGMetadataInfo::new();
    self.data = std::fs::read(format!("{}/{}", dirPath, fileName)).unwrap_or_default();
    self.dataLen = self.data.len() as i64;
    if  self.dataLen < 4 {
      info.errorMessage = "File too small".to_string();
      return info.clone();
    }
    let m1 : i64 = self.data[(0) as usize] as i64;
    let m2 : i64 = self.data[(1) as usize] as i64;
    if  (m1 != 255) || (m2 != 216) {
      info.errorMessage = "Not a valid JPEG file".to_string();
      return info.clone();
    }
    info.isValid = true;
    let mut pos : i64 = 2;
    while pos < self.dataLen {
      let marker1 : i64 = self.data[(pos) as usize] as i64;
      if  marker1 != 255 {
        pos = pos + 1;
        continue;
      }
      let marker2 : i64 = self.data[((pos + 1)) as usize] as i64;
      if  marker2 == 255 {
        pos = pos + 1;
        continue;
      }
      if  (marker2 == 216) || (marker2 == 217) {
        pos = pos + 2;
        continue;
      }
      if  (marker2 >= 208) && (marker2 <= 215) {
        pos = pos + 2;
        continue;
      }
      if  (pos + 4) > self.dataLen {
        return info.clone();
      }
      let segLen : i64 = self.readUint16BE((pos + 2));
      let segStart : i64 = pos + 4;
      if  marker2 == 224 {
        self.parseJFIF(&mut info, segStart, segLen - 2);
      }
      if  marker2 == 225 {
        self.parseExif(&mut info, segStart, segLen - 2);
      }
      if  marker2 == 254 {
        self.parseComment(&mut info, segStart, segLen - 2);
      }
      if  (marker2 == 192) || (marker2 == 194) {
        if  (pos + 9) < self.dataLen {
          info.bitsPerComponent = self.data[((pos + 4)) as usize] as i64;
          info.height = self.readUint16BE((pos + 5));
          info.width = self.readUint16BE((pos + 7));
          info.colorComponents = self.data[((pos + 9)) as usize] as i64;
        }
      }
      if  marker2 == 218 {
        return info.clone();
      }
      if  marker2 == 217 {
        return info.clone();
      }
      pos = (pos + 2) + segLen;
    };
    return info.clone();
  }
  fn formatMetadata(&mut self, mut info : JPEGMetadataInfo) -> String {
    let mut out : GrowableBuffer = GrowableBuffer::new();
    out.writeString("=== JPEG Metadata ===\n\n".to_string());
    if  info.isValid == false {
      out.writeString([&*([&*"Error: ".to_string(), &*info.errorMessage].concat()), &*"\n".to_string()].concat());
      return (out).toString().clone();
    }
    out.writeString("--- Image Info ---\n".to_string());
    out.writeString([&*([&*([&*([&*"  Dimensions: ".to_string(), &*(info.width.to_string())].concat()), &*" x ".to_string()].concat()), &*(info.height.to_string())].concat()), &*"\n".to_string()].concat());
    out.writeString([&*([&*"  Color Components: ".to_string(), &*(info.colorComponents.to_string())].concat()), &*"\n".to_string()].concat());
    out.writeString([&*([&*"  Bits per Component: ".to_string(), &*(info.bitsPerComponent.to_string())].concat()), &*"\n".to_string()].concat());
    if  info.hasJFIF {
      out.writeString("\n--- JFIF Info ---\n".to_string());
      out.writeString([&*([&*"  Version: ".to_string(), &*info.jfifVersion].concat()), &*"\n".to_string()].concat());
      let mut densityStr : String = "No units (aspect ratio)".to_string();
      if  info.densityUnits == 1 {
        densityStr = "pixels/inch".to_string();
      }
      if  info.densityUnits == 2 {
        densityStr = "pixels/cm".to_string();
      }
      out.writeString([&*([&*([&*([&*([&*([&*"  Density: ".to_string(), &*(info.xDensity.to_string())].concat()), &*" x ".to_string()].concat()), &*(info.yDensity.to_string())].concat()), &*" ".to_string()].concat()), &*densityStr].concat()), &*"\n".to_string()].concat());
    }
    if  info.hasExif {
      out.writeString("\n--- EXIF Info ---\n".to_string());
      if  (info.cameraMake.len() as i64) > 0 {
        out.writeString([&*([&*"  Camera Make: ".to_string(), &*info.cameraMake].concat()), &*"\n".to_string()].concat());
      }
      if  (info.cameraModel.len() as i64) > 0 {
        out.writeString([&*([&*"  Camera Model: ".to_string(), &*info.cameraModel].concat()), &*"\n".to_string()].concat());
      }
      if  (info.software.len() as i64) > 0 {
        out.writeString([&*([&*"  Software: ".to_string(), &*info.software].concat()), &*"\n".to_string()].concat());
      }
      if  (info.dateTimeOriginal.len() as i64) > 0 {
        out.writeString([&*([&*"  Date/Time Original: ".to_string(), &*info.dateTimeOriginal].concat()), &*"\n".to_string()].concat());
      } else {
        if  (info.dateTime.len() as i64) > 0 {
          out.writeString([&*([&*"  Date/Time: ".to_string(), &*info.dateTime].concat()), &*"\n".to_string()].concat());
        }
      }
      if  (info.exposureTime.len() as i64) > 0 {
        out.writeString([&*([&*"  Exposure Time: ".to_string(), &*info.exposureTime].concat()), &*" sec\n".to_string()].concat());
      }
      if  (info.fNumber.len() as i64) > 0 {
        out.writeString([&*([&*"  F-Number: f/".to_string(), &*info.fNumber].concat()), &*"\n".to_string()].concat());
      }
      if  (info.isoSpeed.len() as i64) > 0 {
        out.writeString([&*([&*"  ISO Speed: ".to_string(), &*info.isoSpeed].concat()), &*"\n".to_string()].concat());
      }
      if  (info.focalLength.len() as i64) > 0 {
        out.writeString([&*([&*"  Focal Length: ".to_string(), &*info.focalLength].concat()), &*" mm\n".to_string()].concat());
      }
      if  (info.flash.len() as i64) > 0 {
        out.writeString([&*([&*"  Flash: ".to_string(), &*info.flash].concat()), &*"\n".to_string()].concat());
      }
      let mut orientStr : String = "Normal".to_string();
      if  info.orientation == 2 {
        orientStr = "Flip horizontal".to_string();
      }
      if  info.orientation == 3 {
        orientStr = "Rotate 180".to_string();
      }
      if  info.orientation == 4 {
        orientStr = "Flip vertical".to_string();
      }
      if  info.orientation == 5 {
        orientStr = "Transpose".to_string();
      }
      if  info.orientation == 6 {
        orientStr = "Rotate 90 CW".to_string();
      }
      if  info.orientation == 7 {
        orientStr = "Transverse".to_string();
      }
      if  info.orientation == 8 {
        orientStr = "Rotate 270 CW".to_string();
      }
      out.writeString([&*([&*"  Orientation: ".to_string(), &*orientStr].concat()), &*"\n".to_string()].concat());
    }
    if  info.hasGPS {
      out.writeString("\n--- GPS Info ---\n".to_string());
      if  (info.gpsLatitude.len() as i64) > 0 {
        out.writeString([&*([&*"  Latitude: ".to_string(), &*info.gpsLatitude].concat()), &*"\n".to_string()].concat());
      }
      if  (info.gpsLongitude.len() as i64) > 0 {
        out.writeString([&*([&*"  Longitude: ".to_string(), &*info.gpsLongitude].concat()), &*"\n".to_string()].concat());
      }
      if  (info.gpsAltitude.len() as i64) > 0 {
        out.writeString([&*([&*"  Altitude: ".to_string(), &*info.gpsAltitude].concat()), &*"\n".to_string()].concat());
      }
    }
    if  info.hasComment {
      out.writeString("\n--- Comment ---\n".to_string());
      out.writeString([&*([&*"  ".to_string(), &*info.comment].concat()), &*"\n".to_string()].concat());
    }
    let tagCount : i64 = (info.exifTags.len() as i64);
    if  tagCount > 0 {
      out.writeString([&*([&*"\n--- All EXIF Tags (".to_string(), &*(tagCount.to_string())].concat()), &*") ---\n".to_string()].concat());
      for idx in 0..info.exifTags.len() {
        let mut tag = info.exifTags[idx as usize].clone();
        out.writeString([&*([&*"  ".to_string(), &*tag.tagName].concat()), &*" (0x".to_string()].concat());
        let mut tagHex : String = "".to_string();
        let tid : i64 = tag.tagId;
        let hexChars : String = "0123456789ABCDEF".to_string();
        let h3D : f64 = (tid as f64) / (4096 as f64);
        let h3 : i64 = h3D as i64 ;
        let r3 : i64 = tid - (h3 * 4096);
        let h2D : f64 = (r3 as f64) / (256 as f64);
        let h2 : i64 = h2D as i64 ;
        let r2 : i64 = r3 - (h2 * 256);
        let h1D : f64 = (r2 as f64) / (16 as f64);
        let h1 : i64 = h1D as i64 ;
        let h0 : i64 = r2 - (h1 * 16);
        tagHex = [&*([&*([&*(hexChars.chars().skip(h3 as usize).take(((h3 + 1) - h3) as usize).collect::<String>()), &*(hexChars.chars().skip(h2 as usize).take(((h2 + 1) - h2) as usize).collect::<String>())].concat()), &*(hexChars.chars().skip(h1 as usize).take(((h1 + 1) - h1) as usize).collect::<String>())].concat()), &*(hexChars.chars().skip(h0 as usize).take(((h0 + 1) - h0) as usize).collect::<String>())].concat();
        out.writeString([&*([&*([&*tagHex, &*"): ".to_string()].concat()), &*tag.tagValue].concat()), &*"\n".to_string()].concat());
      };
    }
    return (out).toString().clone();
  }
}
#[derive(Clone)]
struct JPEGMetadataMain { 
}
impl JPEGMetadataMain { 
  
  pub fn new() ->  JPEGMetadataMain {
    let mut me = JPEGMetadataMain { 
    };
    return me;
  }
}
#[derive(Clone)]
struct PDFWriter { 
  nextObjNum : i64, 
  pdfBuffer : Option<GrowableBuffer>, 
  objectOffsets : Vec<i64>, 
  jpegReader : Option<JPEGReader>, 
  metadataParser : Option<JPEGMetadataParser>, 
  imageObjNum : i64, 
  lastImageMetadata : Option<JPEGMetadataInfo>, 
}
impl PDFWriter { 
  
  pub fn new() ->  PDFWriter {
    let mut me = PDFWriter { 
      nextObjNum:1, 
      pdfBuffer: None, 
      objectOffsets: Vec::new(), 
      jpegReader: None, 
      metadataParser: None, 
      imageObjNum:0, 
      lastImageMetadata: None, 
    };
    let mut buf : GrowableBuffer = GrowableBuffer::new();
    me.pdfBuffer = Some(buf.clone());
    let mut reader : JPEGReader = JPEGReader::new();
    me.jpegReader = Some(reader.clone());
    let mut parser : JPEGMetadataParser = JPEGMetadataParser::new();
    me.metadataParser = Some(parser.clone());
    return me;
  }
  fn writeObject(&mut self, content : String) -> () {
    let mut buf : GrowableBuffer = self.pdfBuffer.clone().unwrap();
    self.objectOffsets.push((buf).size());
    buf.writeString([&*(self.nextObjNum.to_string()), &*" 0 obj\n".to_string()].concat());
    buf.writeString(content.clone());
    buf.writeString("\nendobj\n\n".to_string());
    self.nextObjNum = self.nextObjNum + 1;
  }
  fn writeObjectGetNum(&mut self, content : String) -> i64 {
    let objNum : i64 = self.nextObjNum;
    self.writeObject(content.clone());
    return objNum;
  }
  fn writeImageObject(&mut self, header : String, imageData : &Vec<u8>, footer : String) -> i64 {
    let mut buf : GrowableBuffer = self.pdfBuffer.clone().unwrap();
    self.objectOffsets.push((buf).size());
    buf.writeString([&*(self.nextObjNum.to_string()), &*" 0 obj\n".to_string()].concat());
    buf.writeString(header.clone());
    buf.writeBuffer(&imageData);
    buf.writeString(footer.clone());
    buf.writeString("\nendobj\n\n".to_string());
    let objNum : i64 = self.nextObjNum;
    self.nextObjNum = self.nextObjNum + 1;
    return objNum;
  }
  fn addJPEGImage(&mut self, dirPath : String, fileName : String) -> i64 {
    let mut reader : JPEGReader = self.jpegReader.clone().unwrap();
    let mut img : JPEGImage = reader.readJPEG(dirPath.clone(), fileName.clone());
    if  img.isValid == false {
      println!( "{}", [&*"Error loading image: ".to_string(), &*img.errorMessage].concat() );
      return 0;
    }
    println!( "{}", reader.getImageInfo(img.clone()) );
    let mut parser : JPEGMetadataParser = self.metadataParser.clone().unwrap();
    let mut meta : JPEGMetadataInfo = parser.parseMetadata(dirPath.clone(), fileName.clone());
    self.lastImageMetadata = Some(meta.clone());
    let mut colorSpace : String = "/DeviceRGB".to_string();
    if  img.colorComponents == 1 {
      colorSpace = "/DeviceGray".to_string();
    }
    if  img.colorComponents == 4 {
      colorSpace = "/DeviceCMYK".to_string();
    }
    let mut imgData : Vec<u8> = img.imageData.clone().unwrap();
    let dataLen : i64 = imgData.len() as i64;
    let mut imgHeader : String = "<< /Type /XObject /Subtype /Image".to_string();
    imgHeader = [&*([&*imgHeader, &*" /Width ".to_string()].concat()), &*(img.width.to_string())].concat();
    imgHeader = [&*([&*imgHeader, &*" /Height ".to_string()].concat()), &*(img.height.to_string())].concat();
    imgHeader = [&*([&*imgHeader, &*" /ColorSpace ".to_string()].concat()), &*colorSpace].concat();
    imgHeader = [&*([&*imgHeader, &*" /BitsPerComponent ".to_string()].concat()), &*(img.bitsPerComponent.to_string())].concat();
    imgHeader = [&*imgHeader, &*" /Filter /DCTDecode".to_string()].concat();
    imgHeader = [&*([&*imgHeader, &*" /Length ".to_string()].concat()), &*(dataLen.to_string())].concat();
    imgHeader = [&*imgHeader, &*" >>\nstream\n".to_string()].concat();
    let imgFooter : String = "\nendstream".to_string();
    self.imageObjNum = self.writeImageObject(imgHeader.clone(), &imgData, imgFooter.clone());
    return self.imageObjNum;
  }
  fn escapeText(text : String) -> String {
    let mut result : String = "".to_string();
    let __len : i64 = text.len() as i64;
    let mut i : i64 = 0;
    while i < __len {
      let ch : i64 = text.chars().nth(i as usize).unwrap_or('\0') as i64;
      if  ch == 40 {
        result = [&*result, &*"\\(".to_string()].concat();
      } else {
        if  ch == 41 {
          result = [&*result, &*"\\)".to_string()].concat();
        } else {
          if  ch == 92 {
            result = [&*result, &*"\\\\".to_string()].concat();
          } else {
            result = [&*result, &*((char::from_u32(ch as u32).unwrap_or('\0').to_string()))].concat();
          }
        }
      }
      i = i + 1;
    };
    return result.clone();
  }
  fn createHelloWorldPDF(&mut self, message : String) -> Vec<u8> {
    return self.createPDFWithImage(message.clone(), "".to_string(), "".to_string());
  }
  fn createPDFWithImage(&mut self, message : String, imageDirPath : String, imageFileName : String) -> Vec<u8> {
    self.nextObjNum = 1;
    let mut buf : GrowableBuffer = self.pdfBuffer.clone().unwrap();
    (buf).clear();
    self.imageObjNum = 0;
    buf.writeString("%PDF-1.4\n".to_string());
    buf.writeByte(37);
    buf.writeByte(226);
    buf.writeByte(227);
    buf.writeByte(207);
    buf.writeByte(211);
    buf.writeByte(10);
    let mut hasImage : bool = (imageFileName.len() as i64) > 0;
    if  hasImage {
      let imgNum : i64 = self.addJPEGImage(imageDirPath.clone(), imageFileName.clone());
      if  imgNum == 0 {
        hasImage = false;
      }
    }
    // unused:  let catalogObjNum : i64 = self.nextObjNum;
    let pagesObjNum : i64 = self.nextObjNum + 1;
    self.writeObject([&*([&*"<< /Type /Catalog /Pages ".to_string(), &*(pagesObjNum.to_string())].concat()), &*" 0 R >>".to_string()].concat());
    let pageObjNum : i64 = self.nextObjNum + 1;
    self.writeObject([&*([&*"<< /Type /Pages /Kids [".to_string(), &*(pageObjNum.to_string())].concat()), &*" 0 R] /Count 1 >>".to_string()].concat());
    let contentObjNum : i64 = self.nextObjNum + 1;
    let fontObjNum : i64 = self.nextObjNum + 2;
    let mut resourcesStr : String = [&*([&*"<< /Font << /F1 ".to_string(), &*(fontObjNum.to_string())].concat()), &*" 0 R >>".to_string()].concat();
    if  hasImage {
      resourcesStr = [&*([&*([&*resourcesStr, &*" /XObject << /Img1 ".to_string()].concat()), &*(self.imageObjNum.to_string())].concat()), &*" 0 R >>".to_string()].concat();
    }
    resourcesStr = [&*resourcesStr, &*" >>".to_string()].concat();
    self.writeObject([&*([&*([&*([&*([&*([&*"<< /Type /Page /Parent ".to_string(), &*(pagesObjNum.to_string())].concat()), &*" 0 R /MediaBox [0 0 612 792] /Contents ".to_string()].concat()), &*(contentObjNum.to_string())].concat()), &*" 0 R /Resources ".to_string()].concat()), &*resourcesStr].concat()), &*" >>".to_string()].concat());
    let mut streamBuf : GrowableBuffer = GrowableBuffer::new();
    if  hasImage {
      streamBuf.writeString("q\n".to_string());
      streamBuf.writeString("150 0 0 150 400 600 cm\n".to_string());
      streamBuf.writeString("/Img1 Do\n".to_string());
      streamBuf.writeString("Q\n".to_string());
    }
    streamBuf.writeString("q\n".to_string());
    streamBuf.writeString("1 0 0 RG\n".to_string());
    streamBuf.writeString("1 0.8 0.8 rg\n".to_string());
    streamBuf.writeString("2 w\n".to_string());
    streamBuf.writeString("100 650 80 60 re\n".to_string());
    streamBuf.writeString("B\n".to_string());
    streamBuf.writeString("Q\n".to_string());
    streamBuf.writeString("q\n".to_string());
    streamBuf.writeString("0 0 1 RG\n".to_string());
    streamBuf.writeString("0.8 0.8 1 rg\n".to_string());
    streamBuf.writeString("2 w\n".to_string());
    streamBuf.writeString("220 650 m\n".to_string());
    streamBuf.writeString("280 650 l\n".to_string());
    streamBuf.writeString("250 710 l\n".to_string());
    streamBuf.writeString("h\n".to_string());
    streamBuf.writeString("B\n".to_string());
    streamBuf.writeString("Q\n".to_string());
    streamBuf.writeString("q\n".to_string());
    streamBuf.writeString("0 0.5 0 RG\n".to_string());
    streamBuf.writeString("0.8 1 0.8 rg\n".to_string());
    streamBuf.writeString("2 w\n".to_string());
    let cx : i64 = 370;
    let cy : i64 = 680;
    let r : i64 = 30;
    let k : i64 = 17;
    streamBuf.writeString([&*([&*([&*((cx + r).to_string()), &*" ".to_string()].concat()), &*(cy.to_string())].concat()), &*" m\n".to_string()].concat());
    streamBuf.writeString([&*([&*([&*([&*([&*([&*([&*([&*([&*([&*([&*((cx + r).to_string()), &*" ".to_string()].concat()), &*((cy + k).to_string())].concat()), &*" ".to_string()].concat()), &*((cx + k).to_string())].concat()), &*" ".to_string()].concat()), &*((cy + r).to_string())].concat()), &*" ".to_string()].concat()), &*(cx.to_string())].concat()), &*" ".to_string()].concat()), &*((cy + r).to_string())].concat()), &*" c\n".to_string()].concat());
    streamBuf.writeString([&*([&*([&*([&*([&*([&*([&*([&*([&*([&*([&*((cx - k).to_string()), &*" ".to_string()].concat()), &*((cy + r).to_string())].concat()), &*" ".to_string()].concat()), &*((cx - r).to_string())].concat()), &*" ".to_string()].concat()), &*((cy + k).to_string())].concat()), &*" ".to_string()].concat()), &*((cx - r).to_string())].concat()), &*" ".to_string()].concat()), &*(cy.to_string())].concat()), &*" c\n".to_string()].concat());
    streamBuf.writeString([&*([&*([&*([&*([&*([&*([&*([&*([&*([&*([&*((cx - r).to_string()), &*" ".to_string()].concat()), &*((cy - k).to_string())].concat()), &*" ".to_string()].concat()), &*((cx - k).to_string())].concat()), &*" ".to_string()].concat()), &*((cy - r).to_string())].concat()), &*" ".to_string()].concat()), &*(cx.to_string())].concat()), &*" ".to_string()].concat()), &*((cy - r).to_string())].concat()), &*" c\n".to_string()].concat());
    streamBuf.writeString([&*([&*([&*([&*([&*([&*([&*([&*([&*([&*([&*((cx + k).to_string()), &*" ".to_string()].concat()), &*((cy - r).to_string())].concat()), &*" ".to_string()].concat()), &*((cx + r).to_string())].concat()), &*" ".to_string()].concat()), &*((cy - k).to_string())].concat()), &*" ".to_string()].concat()), &*((cx + r).to_string())].concat()), &*" ".to_string()].concat()), &*(cy.to_string())].concat()), &*" c\n".to_string()].concat());
    streamBuf.writeString("B\n".to_string());
    streamBuf.writeString("Q\n".to_string());
    streamBuf.writeString("q\n".to_string());
    streamBuf.writeString("0.8 0 0.2 RG\n".to_string());
    streamBuf.writeString("1 0.4 0.5 rg\n".to_string());
    streamBuf.writeString("2 w\n".to_string());
    streamBuf.writeString("140 480 m\n".to_string());
    streamBuf.writeString("90 510 80 560 110 580 c\n".to_string());
    streamBuf.writeString("130 595 140 580 140 565 c\n".to_string());
    streamBuf.writeString("140 580 150 595 170 580 c\n".to_string());
    streamBuf.writeString("200 560 190 510 140 480 c\n".to_string());
    streamBuf.writeString("h\n".to_string());
    streamBuf.writeString("B\n".to_string());
    streamBuf.writeString("Q\n".to_string());
    streamBuf.writeString("q\n".to_string());
    streamBuf.writeString("0 0.5 0.8 RG\n".to_string());
    streamBuf.writeString("2 w\n".to_string());
    let sx : i64 = 300;
    let sy : i64 = 530;
    let arm : i64 = 50;
    streamBuf.writeString([&*([&*([&*(sx.to_string()), &*" ".to_string()].concat()), &*(sy.to_string())].concat()), &*" m\n".to_string()].concat());
    streamBuf.writeString([&*([&*([&*(sx.to_string()), &*" ".to_string()].concat()), &*((sy + arm).to_string())].concat()), &*" l\n".to_string()].concat());
    streamBuf.writeString([&*([&*([&*(sx.to_string()), &*" ".to_string()].concat()), &*(sy.to_string())].concat()), &*" m\n".to_string()].concat());
    streamBuf.writeString([&*([&*([&*((sx + 43).to_string()), &*" ".to_string()].concat()), &*((sy + 25).to_string())].concat()), &*" l\n".to_string()].concat());
    streamBuf.writeString([&*([&*([&*(sx.to_string()), &*" ".to_string()].concat()), &*(sy.to_string())].concat()), &*" m\n".to_string()].concat());
    streamBuf.writeString([&*([&*([&*((sx + 43).to_string()), &*" ".to_string()].concat()), &*((sy - 25).to_string())].concat()), &*" l\n".to_string()].concat());
    streamBuf.writeString([&*([&*([&*(sx.to_string()), &*" ".to_string()].concat()), &*(sy.to_string())].concat()), &*" m\n".to_string()].concat());
    streamBuf.writeString([&*([&*([&*(sx.to_string()), &*" ".to_string()].concat()), &*((sy - arm).to_string())].concat()), &*" l\n".to_string()].concat());
    streamBuf.writeString([&*([&*([&*(sx.to_string()), &*" ".to_string()].concat()), &*(sy.to_string())].concat()), &*" m\n".to_string()].concat());
    streamBuf.writeString([&*([&*([&*((sx - 43).to_string()), &*" ".to_string()].concat()), &*((sy - 25).to_string())].concat()), &*" l\n".to_string()].concat());
    streamBuf.writeString([&*([&*([&*(sx.to_string()), &*" ".to_string()].concat()), &*(sy.to_string())].concat()), &*" m\n".to_string()].concat());
    streamBuf.writeString([&*([&*([&*((sx - 43).to_string()), &*" ".to_string()].concat()), &*((sy + 25).to_string())].concat()), &*" l\n".to_string()].concat());
    streamBuf.writeString([&*([&*([&*((sx - 10).to_string()), &*" ".to_string()].concat()), &*(((sy + arm) - 10).to_string())].concat()), &*" m\n".to_string()].concat());
    streamBuf.writeString([&*([&*([&*(sx.to_string()), &*" ".to_string()].concat()), &*((sy + arm).to_string())].concat()), &*" l\n".to_string()].concat());
    streamBuf.writeString([&*([&*([&*((sx + 10).to_string()), &*" ".to_string()].concat()), &*(((sy + arm) - 10).to_string())].concat()), &*" l\n".to_string()].concat());
    streamBuf.writeString([&*([&*([&*((sx - 10).to_string()), &*" ".to_string()].concat()), &*(((sy - arm) + 10).to_string())].concat()), &*" m\n".to_string()].concat());
    streamBuf.writeString([&*([&*([&*(sx.to_string()), &*" ".to_string()].concat()), &*((sy - arm).to_string())].concat()), &*" l\n".to_string()].concat());
    streamBuf.writeString([&*([&*([&*((sx + 10).to_string()), &*" ".to_string()].concat()), &*(((sy - arm) + 10).to_string())].concat()), &*" l\n".to_string()].concat());
    streamBuf.writeString("S\n".to_string());
    streamBuf.writeString("Q\n".to_string());
    streamBuf.writeString("q\n".to_string());
    streamBuf.writeString("0.8 0.6 0 RG\n".to_string());
    streamBuf.writeString("1 0.9 0.3 rg\n".to_string());
    streamBuf.writeString("2 w\n".to_string());
    streamBuf.writeString("460 575 m\n".to_string());
    streamBuf.writeString("472 545 l\n".to_string());
    streamBuf.writeString("505 545 l\n".to_string());
    streamBuf.writeString("478 522 l\n".to_string());
    streamBuf.writeString("488 490 l\n".to_string());
    streamBuf.writeString("460 508 l\n".to_string());
    streamBuf.writeString("432 490 l\n".to_string());
    streamBuf.writeString("442 522 l\n".to_string());
    streamBuf.writeString("415 545 l\n".to_string());
    streamBuf.writeString("448 545 l\n".to_string());
    streamBuf.writeString("h\n".to_string());
    streamBuf.writeString("B\n".to_string());
    streamBuf.writeString("Q\n".to_string());
    streamBuf.writeString("q\n".to_string());
    streamBuf.writeString("0.5 0.5 0.5 RG\n".to_string());
    streamBuf.writeString("1 w\n".to_string());
    streamBuf.writeString("50 450 m\n".to_string());
    streamBuf.writeString("562 450 l\n".to_string());
    streamBuf.writeString("S\n".to_string());
    streamBuf.writeString("Q\n".to_string());
    streamBuf.writeString("q\n".to_string());
    streamBuf.writeString("0.6 0 0.6 RG\n".to_string());
    streamBuf.writeString("3 w\n".to_string());
    streamBuf.writeString("50 400 m\n".to_string());
    streamBuf.writeString("150 450 200 350 300 400 c\n".to_string());
    streamBuf.writeString("400 450 450 350 550 400 c\n".to_string());
    streamBuf.writeString("S\n".to_string());
    streamBuf.writeString("Q\n".to_string());
    streamBuf.writeString("BT\n".to_string());
    streamBuf.writeString("/F1 36 Tf\n".to_string());
    streamBuf.writeString("100 320 Td\n".to_string());
    streamBuf.writeString([&*([&*"(".to_string(), &*PDFWriter::escapeText(message.clone())].concat()), &*") Tj\n".to_string()].concat());
    streamBuf.writeString("ET\n".to_string());
    streamBuf.writeString("BT\n".to_string());
    streamBuf.writeString("/F1 14 Tf\n".to_string());
    streamBuf.writeString("100 280 Td\n".to_string());
    streamBuf.writeString("(Generated by Ranger PDF Writer) Tj\n".to_string());
    streamBuf.writeString("ET\n".to_string());
    streamBuf.writeString("BT\n/F1 10 Tf\n100 630 Td\n(Rectangle) Tj\nET\n".to_string());
    streamBuf.writeString("BT\n/F1 10 Tf\n225 630 Td\n(Triangle) Tj\nET\n".to_string());
    streamBuf.writeString("BT\n/F1 10 Tf\n355 630 Td\n(Circle) Tj\nET\n".to_string());
    streamBuf.writeString("BT\n/F1 10 Tf\n125 465 Td\n(Heart) Tj\nET\n".to_string());
    streamBuf.writeString("BT\n/F1 10 Tf\n275 465 Td\n(Snowflake) Tj\nET\n".to_string());
    streamBuf.writeString("BT\n/F1 10 Tf\n445 465 Td\n(Star) Tj\nET\n".to_string());
    if  hasImage {
      streamBuf.writeString("BT\n/F1 10 Tf\n400 585 Td\n(JPEG Image) Tj\nET\n".to_string());
      if  self.lastImageMetadata.is_some() {
        let mut meta : JPEGMetadataInfo = self.lastImageMetadata.clone().unwrap();
        let mut metaY : i64 = 240;
        streamBuf.writeString([&*([&*"BT\n/F1 12 Tf\n400 ".to_string(), &*(metaY.to_string())].concat()), &*" Td\n(Image Metadata:) Tj\nET\n".to_string()].concat());
        metaY = metaY - 14;
        streamBuf.writeString([&*([&*([&*([&*([&*([&*"BT\n/F1 9 Tf\n400 ".to_string(), &*(metaY.to_string())].concat()), &*" Td\n(Size: ".to_string()].concat()), &*(meta.width.to_string())].concat()), &*" x ".to_string()].concat()), &*(meta.height.to_string())].concat()), &*") Tj\nET\n".to_string()].concat());
        metaY = metaY - 12;
        if  meta.hasExif {
          if  (meta.cameraMake.len() as i64) > 0 {
            streamBuf.writeString([&*([&*([&*([&*"BT\n/F1 9 Tf\n400 ".to_string(), &*(metaY.to_string())].concat()), &*" Td\n(Make: ".to_string()].concat()), &*PDFWriter::escapeText(meta.cameraMake.clone())].concat()), &*") Tj\nET\n".to_string()].concat());
            metaY = metaY - 12;
          }
          if  (meta.cameraModel.len() as i64) > 0 {
            streamBuf.writeString([&*([&*([&*([&*"BT\n/F1 9 Tf\n400 ".to_string(), &*(metaY.to_string())].concat()), &*" Td\n(Model: ".to_string()].concat()), &*PDFWriter::escapeText(meta.cameraModel.clone())].concat()), &*") Tj\nET\n".to_string()].concat());
            metaY = metaY - 12;
          }
          if  (meta.dateTimeOriginal.len() as i64) > 0 {
            streamBuf.writeString([&*([&*([&*([&*"BT\n/F1 9 Tf\n400 ".to_string(), &*(metaY.to_string())].concat()), &*" Td\n(Date: ".to_string()].concat()), &*PDFWriter::escapeText(meta.dateTimeOriginal.clone())].concat()), &*") Tj\nET\n".to_string()].concat());
            metaY = metaY - 12;
          }
          if  (meta.exposureTime.len() as i64) > 0 {
            streamBuf.writeString([&*([&*([&*([&*"BT\n/F1 9 Tf\n400 ".to_string(), &*(metaY.to_string())].concat()), &*" Td\n(Exposure: ".to_string()].concat()), &*meta.exposureTime].concat()), &*" sec) Tj\nET\n".to_string()].concat());
            metaY = metaY - 12;
          }
          if  (meta.fNumber.len() as i64) > 0 {
            streamBuf.writeString([&*([&*([&*([&*"BT\n/F1 9 Tf\n400 ".to_string(), &*(metaY.to_string())].concat()), &*" Td\n(Aperture: f/".to_string()].concat()), &*meta.fNumber].concat()), &*") Tj\nET\n".to_string()].concat());
            metaY = metaY - 12;
          }
          if  (meta.isoSpeed.len() as i64) > 0 {
            streamBuf.writeString([&*([&*([&*([&*"BT\n/F1 9 Tf\n400 ".to_string(), &*(metaY.to_string())].concat()), &*" Td\n(ISO: ".to_string()].concat()), &*meta.isoSpeed].concat()), &*") Tj\nET\n".to_string()].concat());
            metaY = metaY - 12;
          }
          if  (meta.focalLength.len() as i64) > 0 {
            streamBuf.writeString([&*([&*([&*([&*"BT\n/F1 9 Tf\n400 ".to_string(), &*(metaY.to_string())].concat()), &*" Td\n(Focal Length: ".to_string()].concat()), &*meta.focalLength].concat()), &*" mm) Tj\nET\n".to_string()].concat());
            metaY = metaY - 12;
          }
          if  (meta.flash.len() as i64) > 0 {
            streamBuf.writeString([&*([&*([&*([&*"BT\n/F1 9 Tf\n400 ".to_string(), &*(metaY.to_string())].concat()), &*" Td\n(Flash: ".to_string()].concat()), &*meta.flash].concat()), &*") Tj\nET\n".to_string()].concat());
            metaY = metaY - 12;
          }
        }
        if  meta.hasGPS {
          streamBuf.writeString([&*([&*"BT\n/F1 9 Tf\n400 ".to_string(), &*(metaY.to_string())].concat()), &*" Td\n(--- GPS Data ---) Tj\nET\n".to_string()].concat());
          metaY = metaY - 12;
          if  (meta.gpsLatitude.len() as i64) > 0 {
            streamBuf.writeString([&*([&*([&*([&*"BT\n/F1 9 Tf\n400 ".to_string(), &*(metaY.to_string())].concat()), &*" Td\n(Latitude: ".to_string()].concat()), &*meta.gpsLatitude].concat()), &*") Tj\nET\n".to_string()].concat());
            metaY = metaY - 12;
          }
          if  (meta.gpsLongitude.len() as i64) > 0 {
            streamBuf.writeString([&*([&*([&*([&*"BT\n/F1 9 Tf\n400 ".to_string(), &*(metaY.to_string())].concat()), &*" Td\n(Longitude: ".to_string()].concat()), &*meta.gpsLongitude].concat()), &*") Tj\nET\n".to_string()].concat());
            metaY = metaY - 12;
          }
          if  (meta.gpsAltitude.len() as i64) > 0 {
            streamBuf.writeString([&*([&*([&*([&*"BT\n/F1 9 Tf\n400 ".to_string(), &*(metaY.to_string())].concat()), &*" Td\n(Altitude: ".to_string()].concat()), &*meta.gpsAltitude].concat()), &*") Tj\nET\n".to_string()].concat());
            metaY = metaY - 12;
          }
        }
      }
    }
    let streamLen : i64 = (streamBuf).size();
    let streamContent : String = (streamBuf).toString();
    self.writeObject([&*([&*([&*([&*"<< /Length ".to_string(), &*(streamLen.to_string())].concat()), &*" >>\nstream\n".to_string()].concat()), &*streamContent].concat()), &*"endstream".to_string()].concat());
    self.writeObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>".to_string());
    let mut rootObjNum : i64 = 1;
    if  hasImage {
      rootObjNum = 2;
    }
    let xrefOffset : i64 = (buf).size();
    buf.writeString("xref\n".to_string());
    buf.writeString([&*([&*"0 ".to_string(), &*(self.nextObjNum.to_string())].concat()), &*"\n".to_string()].concat());
    buf.writeString("0000000000 65535 f \n".to_string());
    for i in 0..self.objectOffsets.len() {
      let mut offset = self.objectOffsets[i as usize].clone();
      let mut offsetStr : String = offset.to_string();
      while (offsetStr.len() as i64) < 10 {
        offsetStr = [&*"0".to_string(), &*offsetStr].concat();
      };
      buf.writeString([&*offsetStr, &*" 00000 n \n".to_string()].concat());
    };
    buf.writeString("trailer\n".to_string());
    buf.writeString([&*([&*([&*([&*"<< /Size ".to_string(), &*(self.nextObjNum.to_string())].concat()), &*" /Root ".to_string()].concat()), &*(rootObjNum.to_string())].concat()), &*" 0 R >>\n".to_string()].concat());
    buf.writeString("startxref\n".to_string());
    buf.writeString([&*(xrefOffset.to_string()), &*"\n".to_string()].concat());
    buf.writeString("%%EOF\n".to_string());
    return buf.toBuffer();
  }
  fn savePDF(&mut self, path : String, filename : String, message : String) -> () {
    let mut pdfContent : Vec<u8> = self.createHelloWorldPDF(message.clone());
    std::fs::write(format!("{}/{}", path, filename), &pdfContent).unwrap();
    println!( "{}", [&*([&*([&*"PDF saved to ".to_string(), &*path].concat()), &*"/".to_string()].concat()), &*filename].concat() );
  }
  fn savePDFWithImage(&mut self, path : String, filename : String, message : String, imageDirPath : String, imageFileName : String) -> () {
    let mut pdfContent : Vec<u8> = self.createPDFWithImage(message.clone(), imageDirPath.clone(), imageFileName.clone());
    std::fs::write(format!("{}/{}", path, filename), &pdfContent).unwrap();
    println!( "{}", [&*([&*([&*"PDF saved to ".to_string(), &*path].concat()), &*"/".to_string()].concat()), &*filename].concat() );
  }
}
#[derive(Clone)]
struct Main { 
}
impl Main { 
  
  pub fn new() ->  Main {
    let mut me = Main { 
    };
    return me;
  }
}
#[derive(Clone)]
struct EVGTextMetrics { 
  width : f64, 
  height : f64, 
  ascent : f64, 
  descent : f64, 
  lineHeight : f64, 
}
impl EVGTextMetrics { 
  
  pub fn new() ->  EVGTextMetrics {
    let mut me = EVGTextMetrics { 
      width:0_f64, 
      height:0_f64, 
      ascent:0_f64, 
      descent:0_f64, 
      lineHeight:0_f64, 
    };
    me.width = 0_f64;
    me.height = 0_f64;
    me.ascent = 0_f64;
    me.descent = 0_f64;
    me.lineHeight = 0_f64;
    return me;
  }
  pub fn create(w : f64, h : f64) -> EVGTextMetrics {
    let mut m : EVGTextMetrics = EVGTextMetrics::new();
    m.width = w;
    m.height = h;
    return m.clone();
  }
}
#[derive(Clone)]
struct EVGTextMeasurer { 
}
impl EVGTextMeasurer { 
  
  pub fn new() ->  EVGTextMeasurer {
    let mut me = EVGTextMeasurer { 
    };
    return me;
  }
  fn measureText(&mut self, text : String, fontFamily : String, fontSize : f64) -> EVGTextMetrics {
    let avgCharWidth : f64 = fontSize * 0.55_f64;
    let textLen : i64 = text.len() as i64;
    let width : f64 = ((textLen as f64)) * avgCharWidth;
    let lineHeight : f64 = fontSize * 1.2_f64;
    let mut metrics : EVGTextMetrics = EVGTextMetrics::new();
    metrics.width = width;
    metrics.height = lineHeight;
    metrics.ascent = fontSize * 0.8_f64;
    metrics.descent = fontSize * 0.2_f64;
    metrics.lineHeight = lineHeight;
    return metrics.clone();
  }
  fn measureTextWidth(&mut self, text : String, fontFamily : String, fontSize : f64) -> f64 {
    let mut metrics : EVGTextMetrics = self.measureText(text.clone(), fontFamily.clone(), fontSize);
    return metrics.width;
  }
  fn getLineHeight(fontFamily : String, fontSize : f64) -> f64 {
    return fontSize * 1.2_f64;
  }
  fn measureChar(ch : i64, fontFamily : String, fontSize : f64) -> f64 {
    if  ch == 32 {
      return fontSize * 0.3_f64;
    }
    if  ((((ch == 105) || (ch == 108)) || (ch == 106)) || (ch == 116)) || (ch == 102) {
      return fontSize * 0.3_f64;
    }
    if  (ch == 109) || (ch == 119) {
      return fontSize * 0.8_f64;
    }
    if  (ch == 77) || (ch == 87) {
      return fontSize * 0.9_f64;
    }
    if  ch == 73 {
      return fontSize * 0.35_f64;
    }
    return fontSize * 0.55_f64;
  }
  fn wrapText(&mut self, text : String, fontFamily : String, fontSize : f64, maxWidth : f64) -> Vec<String> {
    let mut lines : Vec<String> = Vec::new();
    let mut currentLine : String = "".to_string();
    let mut currentWidth : f64 = 0_f64;
    let mut wordStart : i64 = 0;
    let textLen : i64 = text.len() as i64;
    let mut i : i64 = 0;
    while i <= textLen {
      let mut ch : i64 = 0;
      let isEnd : bool = i == textLen;
      if  isEnd == false {
        ch = text.chars().nth(i as usize).unwrap_or('\0') as i64;
      }
      let mut isWordEnd : bool = false;
      if  isEnd {
        isWordEnd = true;
      }
      if  ch == 32 {
        isWordEnd = true;
      }
      if  ch == 10 {
        isWordEnd = true;
      }
      if  isWordEnd {
        let mut word : String = "".to_string();
        if  i > wordStart {
          word = text.chars().skip(wordStart as usize).take((i - wordStart) as usize).collect::<String>();
        }
        let wordWidth : f64 = self.measureTextWidth(word.clone(), fontFamily.clone(), fontSize);
        let mut spaceWidth : f64 = 0_f64;
        if  (currentLine.len() as i64) > 0 {
          spaceWidth = self.measureTextWidth(" ".to_string(), fontFamily.clone(), fontSize);
        }
        if  ((currentWidth + spaceWidth) + wordWidth) <= maxWidth {
          if  (currentLine.len() as i64) > 0 {
            currentLine = [&*currentLine, &*" ".to_string()].concat();
            currentWidth = currentWidth + spaceWidth;
          }
          currentLine = [&*currentLine, &*word].concat();
          currentWidth = currentWidth + wordWidth;
        } else {
          if  (currentLine.len() as i64) > 0 {
            lines.push(currentLine.clone());
          }
          currentLine = word.clone();
          currentWidth = wordWidth;
        }
        if  ch == 10 {
          lines.push(currentLine.clone());
          currentLine = "".to_string();
          currentWidth = 0_f64;
        }
        wordStart = i + 1;
      }
      i = i + 1;
    };
    if  (currentLine.len() as i64) > 0 {
      lines.push(currentLine.clone());
    }
    return lines.clone();
  }
}

pub trait EVGTextMeasurerTrait {
  fn measureText(&mut self, text : String, fontFamily : String, fontSize : f64) -> EVGTextMetrics;
  fn measureTextWidth(&mut self, text : String, fontFamily : String, fontSize : f64) -> f64;
  fn getLineHeight(&mut self, fontFamily : String, fontSize : f64) -> f64;
  fn measureChar(&mut self, ch : i64, fontFamily : String, fontSize : f64) -> f64;
  fn wrapText(&mut self, text : String, fontFamily : String, fontSize : f64, maxWidth : f64) -> Vec<String>;
}
impl EVGTextMeasurerTrait for EVGTextMeasurer {
  fn measureText(&mut self, text : String, fontFamily : String, fontSize : f64) -> EVGTextMetrics {
    EVGTextMeasurer::measureText(self, text, fontFamily, fontSize)
  }
  fn measureTextWidth(&mut self, text : String, fontFamily : String, fontSize : f64) -> f64 {
    EVGTextMeasurer::measureTextWidth(self, text, fontFamily, fontSize)
  }
  fn getLineHeight(&mut self, fontFamily : String, fontSize : f64) -> f64 {
    EVGTextMeasurer::getLineHeight(fontFamily, fontSize)
  }
  fn measureChar(&mut self, ch : i64, fontFamily : String, fontSize : f64) -> f64 {
    EVGTextMeasurer::measureChar(ch, fontFamily, fontSize)
  }
  fn wrapText(&mut self, text : String, fontFamily : String, fontSize : f64, maxWidth : f64) -> Vec<String> {
    EVGTextMeasurer::wrapText(self, text, fontFamily, fontSize, maxWidth)
  }
}
#[derive(Clone)]
struct SimpleTextMeasurer { 
  charWidthRatio : f64, 
}
impl SimpleTextMeasurer { 
  
  pub fn new() ->  SimpleTextMeasurer {
    let mut me = SimpleTextMeasurer { 
      charWidthRatio:0.55_f64, 
    };
    return me;
  }
  fn setCharWidthRatio(&mut self, ratio : f64) -> () {
    self.charWidthRatio = ratio;
  }
  fn measureText(&mut self, text : String, fontFamily : String, fontSize : f64) -> EVGTextMetrics {
    let textLen : i64 = text.len() as i64;
    let mut width : f64 = 0_f64;
    let mut i : i64 = 0;
    while i < textLen {
      let ch : i64 = text.chars().nth(i as usize).unwrap_or('\0') as i64;
      width = width + EVGTextMeasurer::measureChar(ch, fontFamily.clone(), fontSize);
      i = i + 1;
    };
    let lineHeight : f64 = fontSize * 1.2_f64;
    let mut metrics : EVGTextMetrics = EVGTextMetrics::new();
    metrics.width = width;
    metrics.height = lineHeight;
    metrics.ascent = fontSize * 0.8_f64;
    metrics.descent = fontSize * 0.2_f64;
    metrics.lineHeight = lineHeight;
    return metrics.clone();
  }
}
impl SimpleTextMeasurer {
  // Inherited methods from parent class EVGTextMeasurer
  fn measureTextWidth(&mut self, text : String, fontFamily : String, fontSize : f64) -> f64 {
    let mut metrics : EVGTextMetrics = self.measureText(text.clone(), fontFamily.clone(), fontSize);
    return metrics.width;
  }
  fn getLineHeight(fontFamily : String, fontSize : f64) -> f64 {
    return fontSize * 1.2_f64;
  }
  fn measureChar(ch : i64, fontFamily : String, fontSize : f64) -> f64 {
    if  ch == 32 {
      return fontSize * 0.3_f64;
    }
    if  ((((ch == 105) || (ch == 108)) || (ch == 106)) || (ch == 116)) || (ch == 102) {
      return fontSize * 0.3_f64;
    }
    if  (ch == 109) || (ch == 119) {
      return fontSize * 0.8_f64;
    }
    if  (ch == 77) || (ch == 87) {
      return fontSize * 0.9_f64;
    }
    if  ch == 73 {
      return fontSize * 0.35_f64;
    }
    return fontSize * 0.55_f64;
  }
  fn wrapText(&mut self, text : String, fontFamily : String, fontSize : f64, maxWidth : f64) -> Vec<String> {
    let mut lines : Vec<String> = Vec::new();
    let mut currentLine : String = "".to_string();
    let mut currentWidth : f64 = 0_f64;
    let mut wordStart : i64 = 0;
    let textLen : i64 = text.len() as i64;
    let mut i : i64 = 0;
    while i <= textLen {
      let mut ch : i64 = 0;
      let isEnd : bool = i == textLen;
      if  isEnd == false {
        ch = text.chars().nth(i as usize).unwrap_or('\0') as i64;
      }
      let mut isWordEnd : bool = false;
      if  isEnd {
        isWordEnd = true;
      }
      if  ch == 32 {
        isWordEnd = true;
      }
      if  ch == 10 {
        isWordEnd = true;
      }
      if  isWordEnd {
        let mut word : String = "".to_string();
        if  i > wordStart {
          word = text.chars().skip(wordStart as usize).take((i - wordStart) as usize).collect::<String>();
        }
        let wordWidth : f64 = self.measureTextWidth(word.clone(), fontFamily.clone(), fontSize);
        let mut spaceWidth : f64 = 0_f64;
        if  (currentLine.len() as i64) > 0 {
          spaceWidth = self.measureTextWidth(" ".to_string(), fontFamily.clone(), fontSize);
        }
        if  ((currentWidth + spaceWidth) + wordWidth) <= maxWidth {
          if  (currentLine.len() as i64) > 0 {
            currentLine = [&*currentLine, &*" ".to_string()].concat();
            currentWidth = currentWidth + spaceWidth;
          }
          currentLine = [&*currentLine, &*word].concat();
          currentWidth = currentWidth + wordWidth;
        } else {
          if  (currentLine.len() as i64) > 0 {
            lines.push(currentLine.clone());
          }
          currentLine = word.clone();
          currentWidth = wordWidth;
        }
        if  ch == 10 {
          lines.push(currentLine.clone());
          currentLine = "".to_string();
          currentWidth = 0_f64;
        }
        wordStart = i + 1;
      }
      i = i + 1;
    };
    if  (currentLine.len() as i64) > 0 {
      lines.push(currentLine.clone());
    }
    return lines.clone();
  }
}
impl EVGTextMeasurerTrait for SimpleTextMeasurer {
  fn measureText(&mut self, text : String, fontFamily : String, fontSize : f64) -> EVGTextMetrics {
    SimpleTextMeasurer::measureText(self, text, fontFamily, fontSize)
  }
  fn measureTextWidth(&mut self, text : String, fontFamily : String, fontSize : f64) -> f64 {
    SimpleTextMeasurer::measureTextWidth(self, text, fontFamily, fontSize)
  }
  fn getLineHeight(&mut self, fontFamily : String, fontSize : f64) -> f64 {
    SimpleTextMeasurer::getLineHeight(fontFamily, fontSize)
  }
  fn measureChar(&mut self, ch : i64, fontFamily : String, fontSize : f64) -> f64 {
    SimpleTextMeasurer::measureChar(ch, fontFamily, fontSize)
  }
  fn wrapText(&mut self, text : String, fontFamily : String, fontSize : f64, maxWidth : f64) -> Vec<String> {
    SimpleTextMeasurer::wrapText(self, text, fontFamily, fontSize, maxWidth)
  }
}
#[derive(Clone)]
struct EVGImageDimensions { 
  width : i64, 
  height : i64, 
  aspectRatio : f64, 
  isValid : bool, 
}
impl EVGImageDimensions { 
  
  pub fn new() ->  EVGImageDimensions {
    let mut me = EVGImageDimensions { 
      width:0, 
      height:0, 
      aspectRatio:1_f64, 
      isValid:false, 
    };
    me.width = 0;
    me.height = 0;
    me.aspectRatio = 1_f64;
    me.isValid = false;
    return me;
  }
  pub fn create(w : i64, h : i64) -> EVGImageDimensions {
    let mut d : EVGImageDimensions = EVGImageDimensions::new();
    d.width = w;
    d.height = h;
    if  h > 0 {
      d.aspectRatio = ((w as f64)) / ((h as f64));
    }
    d.isValid = true;
    return d.clone();
  }
}
#[derive(Clone)]
struct EVGImageMeasurer { 
}
impl EVGImageMeasurer { 
  
  pub fn new() ->  EVGImageMeasurer {
    let mut me = EVGImageMeasurer { 
    };
    return me;
  }
  fn getImageDimensions(src : String) -> EVGImageDimensions {
    let mut dims : EVGImageDimensions = EVGImageDimensions::new();
    return dims.clone();
  }
  fn calculateHeightForWidth(&mut self, src : String, targetWidth : f64) -> f64 {
    let mut dims : EVGImageDimensions = EVGImageMeasurer::getImageDimensions(src.clone());
    if  dims.isValid {
      return targetWidth / dims.aspectRatio;
    }
    return targetWidth;
  }
  fn calculateWidthForHeight(&mut self, src : String, targetHeight : f64) -> f64 {
    let mut dims : EVGImageDimensions = EVGImageMeasurer::getImageDimensions(src.clone());
    if  dims.isValid {
      return targetHeight * dims.aspectRatio;
    }
    return targetHeight;
  }
  fn calculateFitDimensions(&mut self, src : String, maxWidth : f64, maxHeight : f64) -> EVGImageDimensions {
    let mut dims : EVGImageDimensions = EVGImageMeasurer::getImageDimensions(src.clone());
    if  dims.isValid == false {
      return EVGImageDimensions::create((maxWidth as i64 ), (maxHeight as i64 )).clone();
    }
    let scaleW : f64 = maxWidth / ((dims.width as f64));
    let scaleH : f64 = maxHeight / ((dims.height as f64));
    let mut scale : f64 = scaleW;
    if  scaleH < scaleW {
      scale = scaleH;
    }
    let newW : i64 = (((dims.width as f64)) * scale) as i64 ;
    let newH : i64 = (((dims.height as f64)) * scale) as i64 ;
    return EVGImageDimensions::create(newW, newH).clone();
  }
}

pub trait EVGImageMeasurerTrait {
  fn getImageDimensions(&mut self, src : String) -> EVGImageDimensions;
  fn calculateHeightForWidth(&mut self, src : String, targetWidth : f64) -> f64;
  fn calculateWidthForHeight(&mut self, src : String, targetHeight : f64) -> f64;
  fn calculateFitDimensions(&mut self, src : String, maxWidth : f64, maxHeight : f64) -> EVGImageDimensions;
}
impl EVGImageMeasurerTrait for EVGImageMeasurer {
  fn getImageDimensions(&mut self, src : String) -> EVGImageDimensions {
    EVGImageMeasurer::getImageDimensions(src)
  }
  fn calculateHeightForWidth(&mut self, src : String, targetWidth : f64) -> f64 {
    EVGImageMeasurer::calculateHeightForWidth(self, src, targetWidth)
  }
  fn calculateWidthForHeight(&mut self, src : String, targetHeight : f64) -> f64 {
    EVGImageMeasurer::calculateWidthForHeight(self, src, targetHeight)
  }
  fn calculateFitDimensions(&mut self, src : String, maxWidth : f64, maxHeight : f64) -> EVGImageDimensions {
    EVGImageMeasurer::calculateFitDimensions(self, src, maxWidth, maxHeight)
  }
}
#[derive(Clone)]
struct SimpleImageMeasurer { 
}
impl SimpleImageMeasurer { 
  
  pub fn new() ->  SimpleImageMeasurer {
    let mut me = SimpleImageMeasurer { 
    };
    return me;
  }
}
impl SimpleImageMeasurer {
  // Inherited methods from parent class EVGImageMeasurer
  fn getImageDimensions(src : String) -> EVGImageDimensions {
    let mut dims : EVGImageDimensions = EVGImageDimensions::new();
    return dims.clone();
  }
  fn calculateHeightForWidth(&mut self, src : String, targetWidth : f64) -> f64 {
    let mut dims : EVGImageDimensions = EVGImageMeasurer::getImageDimensions(src.clone());
    if  dims.isValid {
      return targetWidth / dims.aspectRatio;
    }
    return targetWidth;
  }
  fn calculateWidthForHeight(&mut self, src : String, targetHeight : f64) -> f64 {
    let mut dims : EVGImageDimensions = EVGImageMeasurer::getImageDimensions(src.clone());
    if  dims.isValid {
      return targetHeight * dims.aspectRatio;
    }
    return targetHeight;
  }
  fn calculateFitDimensions(&mut self, src : String, maxWidth : f64, maxHeight : f64) -> EVGImageDimensions {
    let mut dims : EVGImageDimensions = EVGImageMeasurer::getImageDimensions(src.clone());
    if  dims.isValid == false {
      return EVGImageDimensions::create((maxWidth as i64 ), (maxHeight as i64 )).clone();
    }
    let scaleW : f64 = maxWidth / ((dims.width as f64));
    let scaleH : f64 = maxHeight / ((dims.height as f64));
    let mut scale : f64 = scaleW;
    if  scaleH < scaleW {
      scale = scaleH;
    }
    let newW : i64 = (((dims.width as f64)) * scale) as i64 ;
    let newH : i64 = (((dims.height as f64)) * scale) as i64 ;
    return EVGImageDimensions::create(newW, newH).clone();
  }
}
impl EVGImageMeasurerTrait for SimpleImageMeasurer {
  fn getImageDimensions(&mut self, src : String) -> EVGImageDimensions {
    SimpleImageMeasurer::getImageDimensions(src)
  }
  fn calculateHeightForWidth(&mut self, src : String, targetWidth : f64) -> f64 {
    SimpleImageMeasurer::calculateHeightForWidth(self, src, targetWidth)
  }
  fn calculateWidthForHeight(&mut self, src : String, targetHeight : f64) -> f64 {
    SimpleImageMeasurer::calculateWidthForHeight(self, src, targetHeight)
  }
  fn calculateFitDimensions(&mut self, src : String, maxWidth : f64, maxHeight : f64) -> EVGImageDimensions {
    SimpleImageMeasurer::calculateFitDimensions(self, src, maxWidth, maxHeight)
  }
}
// Cannot derive Clone due to trait object fields
struct EVGLayout { 
  measurer : Option<Rc<RefCell<dyn EVGTextMeasurerTrait>>>, 
  imageMeasurer : Option<Rc<RefCell<dyn EVGImageMeasurerTrait>>>, 
  pageWidth : f64, 
  pageHeight : f64, 
  currentPage : i64, 
  debug : bool, 
}
impl EVGLayout { 
  
  pub fn new() ->  EVGLayout {
    let mut me = EVGLayout { 
      measurer: None, 
      imageMeasurer: None, 
      pageWidth:612_f64, 
      pageHeight:792_f64, 
      currentPage:0, 
      debug:false, 
    };
    let mut m : SimpleTextMeasurer = SimpleTextMeasurer::new();
    me.measurer = Some(Rc::new(RefCell::new(m.clone())));
    let mut im : SimpleImageMeasurer = SimpleImageMeasurer::new();
    me.imageMeasurer = Some(Rc::new(RefCell::new(im.clone())));
    return me;
  }
  fn setMeasurer(&mut self, mut m : Rc<RefCell<dyn EVGTextMeasurerTrait>>) -> () {
    self.measurer = Some(m.clone());
  }
  fn setImageMeasurer(&mut self, mut m : Rc<RefCell<dyn EVGImageMeasurerTrait>>) -> () {
    self.imageMeasurer = Some(m.clone());
  }
  fn setPageSize(&mut self, w : f64, h : f64) -> () {
    self.pageWidth = w;
    self.pageHeight = h;
  }
  fn setDebug(&mut self, d : bool) -> () {
    self.debug = d;
  }
  fn log(&mut self, msg : String) -> () {
    if  self.debug {
      println!( "{}", msg );
    }
  }
  fn layout(&mut self, mut root : &mut EVGElement) -> () {
    self.log("EVGLayout: Starting layout".to_string());
    self.currentPage = 0;
    if  root.width.as_mut().unwrap().isSet == false {
      root.width = Some(EVGUnit::px(self.pageWidth));
    }
    if  root.height.as_mut().unwrap().isSet == false {
      root.height = Some(EVGUnit::px(self.pageHeight));
    }
    let __arg_0 = self.pageWidth.clone();
    let __arg_1 = self.pageHeight.clone();
    self.layoutElement(&mut root, 0_f64, 0_f64, __arg_0, __arg_1);
    self.log("EVGLayout: Layout complete".to_string());
  }
  fn layoutElement(&mut self, mut element : &mut EVGElement, parentX : f64, parentY : f64, parentWidth : f64, parentHeight : f64) -> () {
    element.resolveUnits(parentWidth, parentHeight);
    let mut width : f64 = parentWidth;
    if  element.width.as_mut().unwrap().isSet {
      width = element.width.as_mut().unwrap().pixels;
    }
    let mut height : f64 = 0_f64;
    let mut autoHeight : bool = true;
    if  element.height.as_mut().unwrap().isSet {
      height = element.height.as_mut().unwrap().pixels;
      autoHeight = false;
    }
    if  element.tagName == "image".to_string() {
      let imgSrc : String = element.src.clone();
      if  (imgSrc.len() as i64) > 0 {
        let mut dims : EVGImageDimensions = EVGImageMeasurer::getImageDimensions(imgSrc.clone());
        if  dims.isValid {
          if  element.width.as_mut().unwrap().isSet && (element.height.as_mut().unwrap().isSet == false) {
            height = width / dims.aspectRatio;
            autoHeight = false;
            let __arg_0 = [&*([&*([&*"  Image aspect ratio: ".to_string(), &*(dims.aspectRatio.to_string())].concat()), &*" -> height=".to_string()].concat()), &*(height.to_string())].concat().clone();
            self.log(__arg_0);
          }
          if  (element.width.as_mut().unwrap().isSet == false) && element.height.as_mut().unwrap().isSet {
            width = height * dims.aspectRatio;
            let __arg_0 = [&*([&*([&*"  Image aspect ratio: ".to_string(), &*(dims.aspectRatio.to_string())].concat()), &*" -> width=".to_string()].concat()), &*(width.to_string())].concat().clone();
            self.log(__arg_0);
          }
          if  (element.width.as_mut().unwrap().isSet == false) && (element.height.as_mut().unwrap().isSet == false) {
            width = (dims.width as f64);
            height = (dims.height as f64);
            if  width > parentWidth {
              let scale : f64 = parentWidth / width;
              width = parentWidth;
              height = height * scale;
            }
            autoHeight = false;
            self.log([&*([&*([&*"  Image natural size: ".to_string(), &*(width.to_string())].concat()), &*"x".to_string()].concat()), &*(height.to_string())].concat());
          }
        }
      }
    }
    if  element.minWidth.as_mut().unwrap().isSet {
      if  width < element.minWidth.as_mut().unwrap().pixels {
        width = element.minWidth.as_mut().unwrap().pixels;
      }
    }
    if  element.maxWidth.as_mut().unwrap().isSet {
      if  width > element.maxWidth.as_mut().unwrap().pixels {
        width = element.maxWidth.as_mut().unwrap().pixels;
      }
    }
    element.calculatedWidth = width;
    element.calculatedInnerWidth = element.r#box.as_mut().unwrap().getInnerWidth(width);
    if  autoHeight == false {
      element.calculatedHeight = height;
      element.calculatedInnerHeight = element.r#box.as_mut().unwrap().getInnerHeight(height);
    }
    if  element.isAbsolute {
      self.layoutAbsolute(&mut element, parentWidth, parentHeight);
    }
    let childCount : i64 = element.getChildCount();
    let mut contentHeight : f64 = 0_f64;
    if  childCount > 0 {
      contentHeight = self.layoutChildren(&mut element);
    } else {
      if  (element.tagName == "text".to_string()) || (element.tagName == "span".to_string()) {
        let mut fontSize : f64 = element.inheritedFontSize;
        if  element.fontSize.as_mut().unwrap().isSet {
          fontSize = element.fontSize.as_mut().unwrap().pixels;
        }
        if  fontSize <= 0_f64 {
          fontSize = 14_f64;
        }
        let mut lineHeightFactor : f64 = element.lineHeight;
        if  lineHeightFactor <= 0_f64 {
          lineHeightFactor = 1.2_f64;
        }
        let lineSpacing : f64 = fontSize * lineHeightFactor;
        let textContent : String = element.textContent.clone();
        let availableWidth : f64 = (width - element.r#box.as_mut().unwrap().paddingLeftPx) - element.r#box.as_mut().unwrap().paddingRightPx;
        let lineCount : i64 = self.estimateLineCount(textContent.clone(), availableWidth, fontSize);
        contentHeight = lineSpacing * ((lineCount as f64));
      }
    }
    if  autoHeight {
      height = ((contentHeight + element.r#box.as_mut().unwrap().paddingTopPx) + element.r#box.as_mut().unwrap().paddingBottomPx) + (element.r#box.as_mut().unwrap().borderWidthPx * 2_f64);
    }
    if  element.minHeight.as_mut().unwrap().isSet {
      if  height < element.minHeight.as_mut().unwrap().pixels {
        height = element.minHeight.as_mut().unwrap().pixels;
      }
    }
    if  element.maxHeight.as_mut().unwrap().isSet {
      if  height > element.maxHeight.as_mut().unwrap().pixels {
        height = element.maxHeight.as_mut().unwrap().pixels;
      }
    }
    element.calculatedHeight = height;
    element.calculatedInnerHeight = element.r#box.as_mut().unwrap().getInnerHeight(height);
    element.calculatedPage = self.currentPage;
    element.isLayoutComplete = true;
    let __arg_0 = [&*([&*([&*([&*([&*([&*([&*([&*([&*([&*([&*"  Laid out ".to_string(), &*element.tagName].concat()), &*" id=".to_string()].concat()), &*element.id].concat()), &*" at (".to_string()].concat()), &*(element.calculatedX.to_string())].concat()), &*",".to_string()].concat()), &*(element.calculatedY.to_string())].concat()), &*") size=".to_string()].concat()), &*(width.to_string())].concat()), &*"x".to_string()].concat()), &*(height.to_string())].concat().clone();
    self.log(__arg_0);
  }
  fn layoutChildren(&mut self, mut parent : &mut EVGElement) -> f64 {
    let childCount : i64 = parent.getChildCount();
    if  childCount == 0 {
      return 0_f64;
    }
    let innerWidth : f64 = parent.calculatedInnerWidth;
    let innerHeight : f64 = parent.calculatedInnerHeight;
    let startX : f64 = ((parent.calculatedX + parent.r#box.as_mut().unwrap().marginLeftPx) + parent.r#box.as_mut().unwrap().borderWidthPx) + parent.r#box.as_mut().unwrap().paddingLeftPx;
    let startY : f64 = ((parent.calculatedY + parent.r#box.as_mut().unwrap().marginTopPx) + parent.r#box.as_mut().unwrap().borderWidthPx) + parent.r#box.as_mut().unwrap().paddingTopPx;
    let mut currentX : f64 = startX;
    let mut currentY : f64 = startY;
    let mut rowHeight : f64 = 0_f64;
    let mut rowElements : Vec<EVGElement> = Vec::new();
    let mut totalHeight : f64 = 0_f64;
    let isColumn : bool = parent.flexDirection == "column".to_string();
    if  isColumn == false {
      let mut fixedWidth : f64 = 0_f64;
      let mut totalFlex : f64 = 0_f64;
      let mut j : i64 = 0;
      while j < childCount {
        let mut c : EVGElement = parent.getChild(j);
        c.resolveUnits(innerWidth, innerHeight);
        if  c.width.as_mut().unwrap().isSet {
          fixedWidth = ((fixedWidth + c.width.as_mut().unwrap().pixels) + c.r#box.as_mut().unwrap().marginLeftPx) + c.r#box.as_mut().unwrap().marginRightPx;
        } else {
          if  c.flex > 0_f64 {
            totalFlex = totalFlex + c.flex;
            fixedWidth = (fixedWidth + c.r#box.as_mut().unwrap().marginLeftPx) + c.r#box.as_mut().unwrap().marginRightPx;
          } else {
            fixedWidth = ((fixedWidth + innerWidth) + c.r#box.as_mut().unwrap().marginLeftPx) + c.r#box.as_mut().unwrap().marginRightPx;
          }
        }
        j = j + 1;
      };
      let mut availableForFlex : f64 = innerWidth - fixedWidth;
      if  availableForFlex < 0_f64 {
        availableForFlex = 0_f64;
      }
      if  totalFlex > 0_f64 {
        j = 0;
        while j < childCount {
          let mut c_1 : EVGElement = parent.getChild(j);
          if  (c_1.width.as_mut().unwrap().isSet == false) && (c_1.flex > 0_f64) {
            let flexWidth : f64 = (availableForFlex * c_1.flex) / totalFlex;
            c_1.calculatedFlexWidth = flexWidth;
          }
          j = j + 1;
        };
      }
    }
    let mut i : i64 = 0;
    while i < childCount {
      let mut child : EVGElement = parent.getChild(i);
      child.inheritProperties(parent.clone());
      child.resolveUnits(innerWidth, innerHeight);
      if  child.isAbsolute {
        self.layoutAbsolute(&mut child, innerWidth, innerHeight);
        child.calculatedX = child.calculatedX + startX;
        child.calculatedY = child.calculatedY + startY;
        if  child.getChildCount() > 0 {
          self.layoutChildren(&mut child);
        }
        i = i + 1;
        continue;
      }
      let mut childWidth : f64 = innerWidth;
      if  child.width.as_mut().unwrap().isSet {
        childWidth = child.width.as_mut().unwrap().pixels;
      } else {
        if  child.calculatedFlexWidth > 0_f64 {
          childWidth = child.calculatedFlexWidth;
        }
      }
      let childTotalWidth : f64 = (childWidth + child.r#box.as_mut().unwrap().marginLeftPx) + child.r#box.as_mut().unwrap().marginRightPx;
      if  isColumn == false {
        let availableWidth : f64 = (startX + innerWidth) - currentX;
        if  (childTotalWidth > availableWidth) && (((rowElements.len() as i64)) > 0) {
          self.alignRow(&rowElements, parent.clone(), rowHeight, startX, innerWidth);
          currentY = currentY + rowHeight;
          totalHeight = totalHeight + rowHeight;
          currentX = startX;
          rowHeight = 0_f64;
        }
      }
      child.calculatedX = currentX + child.r#box.as_mut().unwrap().marginLeftPx;
      child.calculatedY = currentY + child.r#box.as_mut().unwrap().marginTopPx;
      let __arg_0 = child.calculatedX.clone();
      let __arg_1 = child.calculatedY.clone();
      self.layoutElement(&mut child, __arg_0, __arg_1, childWidth, innerHeight);
      let childHeight : f64 = child.calculatedHeight;
      let childTotalHeight : f64 = (childHeight + child.r#box.as_mut().unwrap().marginTopPx) + child.r#box.as_mut().unwrap().marginBottomPx;
      if  isColumn {
        currentY = currentY + childTotalHeight;
        totalHeight = totalHeight + childTotalHeight;
      } else {
        currentX = currentX + childTotalWidth;
        rowElements.push(child.clone());
        if  childTotalHeight > rowHeight {
          rowHeight = childTotalHeight;
        }
      }
      if  child.lineBreak {
        if  isColumn == false {
          self.alignRow(&rowElements, parent.clone(), rowHeight, startX, innerWidth);
          currentY = currentY + rowHeight;
          totalHeight = totalHeight + rowHeight;
          currentX = startX;
          rowHeight = 0_f64;
        }
      }
      i = i + 1;
    };
    if  (isColumn == false) && (((rowElements.len() as i64)) > 0) {
      self.alignRow(&rowElements, parent.clone(), rowHeight, startX, innerWidth);
      totalHeight = totalHeight + rowHeight;
    }
    return totalHeight;
  }
  fn alignRow(&mut self, rowElements : &Vec<EVGElement>, mut parent : EVGElement, rowHeight : f64, startX : f64, innerWidth : f64) -> () {
    let elementCount : i64 = (rowElements.len() as i64);
    if  elementCount == 0 {
      return;
    }
    let mut rowWidth : f64 = 0_f64;
    let mut i : i64 = 0;
    while i < elementCount {
      let mut el : EVGElement = rowElements[i as usize].clone();
      rowWidth = ((rowWidth + el.calculatedWidth) + el.r#box.as_mut().unwrap().marginLeftPx) + el.r#box.as_mut().unwrap().marginRightPx;
      i = i + 1;
    };
    let mut offsetX : f64 = 0_f64;
    if  parent.align == "center".to_string() {
      offsetX = (innerWidth - rowWidth) / 2_f64;
    }
    if  parent.align == "right".to_string() {
      offsetX = innerWidth - rowWidth;
    }
    let mut effectiveRowHeight : f64 = rowHeight;
    if  parent.height.as_mut().unwrap().isSet {
      let parentInnerHeight : f64 = parent.calculatedInnerHeight;
      if  parentInnerHeight > rowHeight {
        effectiveRowHeight = parentInnerHeight;
      }
    }
    i = 0;
    while i < elementCount {
      let mut el_1 : EVGElement = rowElements[i as usize].clone();
      if  offsetX != 0_f64 {
        el_1.calculatedX = el_1.calculatedX + offsetX;
      }
      let childTotalHeight : f64 = (el_1.calculatedHeight + el_1.r#box.as_mut().unwrap().marginTopPx) + el_1.r#box.as_mut().unwrap().marginBottomPx;
      let mut offsetY : f64 = 0_f64;
      if  parent.verticalAlign == "center".to_string() {
        offsetY = (effectiveRowHeight - childTotalHeight) / 2_f64;
      }
      if  parent.verticalAlign == "bottom".to_string() {
        offsetY = effectiveRowHeight - childTotalHeight;
      }
      if  offsetY != 0_f64 {
        el_1.calculatedY = el_1.calculatedY + offsetY;
      }
      i = i + 1;
    };
  }
  fn layoutAbsolute(&mut self, mut element : &mut EVGElement, parentWidth : f64, parentHeight : f64) -> () {
    if  element.left.as_mut().unwrap().isSet {
      element.calculatedX = element.left.as_mut().unwrap().pixels + element.r#box.as_mut().unwrap().marginLeftPx;
    } else {
      if  element.x.as_mut().unwrap().isSet {
        element.calculatedX = element.x.as_mut().unwrap().pixels + element.r#box.as_mut().unwrap().marginLeftPx;
      } else {
        if  element.right.as_mut().unwrap().isSet {
          let mut width : f64 = element.calculatedWidth;
          if  width == 0_f64 {
            if  element.width.as_mut().unwrap().isSet {
              width = element.width.as_mut().unwrap().pixels;
            }
          }
          element.calculatedX = ((parentWidth - element.right.as_mut().unwrap().pixels) - width) - element.r#box.as_mut().unwrap().marginRightPx;
        }
      }
    }
    if  element.top.as_mut().unwrap().isSet {
      element.calculatedY = element.top.as_mut().unwrap().pixels + element.r#box.as_mut().unwrap().marginTopPx;
    } else {
      if  element.y.as_mut().unwrap().isSet {
        element.calculatedY = element.y.as_mut().unwrap().pixels + element.r#box.as_mut().unwrap().marginTopPx;
      } else {
        if  element.bottom.as_mut().unwrap().isSet {
          let mut height : f64 = element.calculatedHeight;
          if  height == 0_f64 {
            if  element.height.as_mut().unwrap().isSet {
              height = element.height.as_mut().unwrap().pixels;
            }
          }
          element.calculatedY = ((parentHeight - element.bottom.as_mut().unwrap().pixels) - height) - element.r#box.as_mut().unwrap().marginBottomPx;
        }
      }
    }
  }
  fn printLayout(&mut self, mut element : &mut EVGElement, indent : i64) -> () {
    let mut indentStr : String = "".to_string();
    let mut i : i64 = 0;
    while i < indent {
      indentStr = [&*indentStr, &*"  ".to_string()].concat();
      i = i + 1;
    };
    println!( "{}", [&*([&*([&*([&*([&*([&*([&*([&*([&*([&*([&*indentStr, &*element.tagName].concat()), &*" id=\"".to_string()].concat()), &*element.id].concat()), &*"\" (".to_string()].concat()), &*(element.calculatedX.to_string())].concat()), &*", ".to_string()].concat()), &*(element.calculatedY.to_string())].concat()), &*") ".to_string()].concat()), &*(element.calculatedWidth.to_string())].concat()), &*"x".to_string()].concat()), &*(element.calculatedHeight.to_string())].concat() );
    let childCount : i64 = element.getChildCount();
    i = 0;
    while i < childCount {
      let mut child : EVGElement = element.getChild(i);
      self.printLayout(&mut child, indent + 1);
      i = i + 1;
    };
  }
  fn estimateLineCount(&mut self, text : String, maxWidth : f64, fontSize : f64) -> i64 {
    if  (text.len() as i64) == 0 {
      return 1;
    }
    if  maxWidth <= 0_f64 {
      return 1;
    }
    let mut words : Vec<String> = text.split(&*" ".to_string()).map(|s| s.to_string()).collect::<Vec<String>>();
    let mut lineCount : i64 = 1;
    let mut currentLineWidth : f64 = 0_f64;
    let spaceWidth : f64 = fontSize * 0.3_f64;
    let mut i : i64 = 0;
    while i < ((words.len() as i64)) {
      let word : String = words[i as usize].clone();
      let wordWidth : f64 = self.measurer.as_ref().unwrap().borrow_mut().measureTextWidth(word.clone(), "Helvetica".to_string(), fontSize);
      if  currentLineWidth == 0_f64 {
        currentLineWidth = wordWidth;
      } else {
        let testWidth : f64 = (currentLineWidth + spaceWidth) + wordWidth;
        if  testWidth > maxWidth {
          lineCount = lineCount + 1;
          currentLineWidth = wordWidth;
        } else {
          currentLineWidth = testWidth;
        }
      }
      i = i + 1;
    };
    return lineCount;
  }
}
#[derive(Clone)]
struct PathCommand { 
  r#type : String, 
  x : f64, 
  y : f64, 
  x1 : f64, 
  y1 : f64, 
  x2 : f64, 
  y2 : f64, 
  rx : f64, 
  ry : f64, 
  rotation : f64, 
  largeArc : bool, 
  sweep : bool, 
}
impl PathCommand { 
  
  pub fn new() ->  PathCommand {
    let mut me = PathCommand { 
      r#type:"".to_string(), 
      x:0_f64, 
      y:0_f64, 
      x1:0_f64, 
      y1:0_f64, 
      x2:0_f64, 
      y2:0_f64, 
      rx:0_f64, 
      ry:0_f64, 
      rotation:0_f64, 
      largeArc:false, 
      sweep:false, 
    };
    return me;
  }
}
#[derive(Clone)]
struct PathBounds { 
  minX : f64, 
  minY : f64, 
  maxX : f64, 
  maxY : f64, 
  width : f64, 
  height : f64, 
}
impl PathBounds { 
  
  pub fn new() ->  PathBounds {
    let mut me = PathBounds { 
      minX:0_f64, 
      minY:0_f64, 
      maxX:0_f64, 
      maxY:0_f64, 
      width:0_f64, 
      height:0_f64, 
    };
    return me;
  }
}
#[derive(Clone)]
struct SVGPathParser { 
  pathData : String, 
  i : i64, 
  __len : i64, 
  currentX : f64, 
  currentY : f64, 
  startX : f64, 
  startY : f64, 
  commands : Vec<PathCommand>, 
  bounds : Option<PathBounds>, 
}
impl SVGPathParser { 
  
  pub fn new() ->  SVGPathParser {
    let mut me = SVGPathParser { 
      pathData:"".to_string(), 
      i:0, 
      __len:0, 
      currentX:0_f64, 
      currentY:0_f64, 
      startX:0_f64, 
      startY:0_f64, 
      commands: Vec::new(), 
      bounds: None, 
    };
    let mut emptyCommands : Vec<PathCommand> = Vec::new();
    me.commands = emptyCommands.clone();
    me.bounds = Some(PathBounds::new());
    return me;
  }
  fn parse(&mut self, data : String) -> () {
    self.pathData = data.clone();
    self.i = 0;
    self.__len = data.len() as i64;
    self.currentX = 0_f64;
    self.currentY = 0_f64;
    self.startX = 0_f64;
    self.startY = 0_f64;
    let mut emptyCommands : Vec<PathCommand> = Vec::new();
    self.commands = emptyCommands.clone();
    while self.i < self.__len {
      self.skipWhitespace();
      if  self.i >= self.__len {
        break;
      }
      let ch : i64 = self.pathData.chars().nth(self.i as usize).unwrap_or('\0') as i64;
      let chInt : i64 = ch;
      if  ((chInt >= 65) && (chInt <= 90)) || ((chInt >= 97) && (chInt <= 122)) {
        self.parseCommand(ch);
      } else {
        self.i = self.i + 1;
      }
    };
    self.calculateBounds();
  }
  fn skipWhitespace(&mut self, ) -> () {
    while self.i < self.__len {
      let ch : i64 = self.pathData.chars().nth(self.i as usize).unwrap_or('\0') as i64;
      let chInt : i64 = ch;
      if  ((((chInt == 32) || (chInt == 9)) || (chInt == 10)) || (chInt == 13)) || (chInt == 44) {
        self.i = self.i + 1;
      } else {
        break;
      }
    };
  }
  fn parseNumber(&mut self, ) -> f64 {
    self.skipWhitespace();
    let start : i64 = self.i;
    let ch : i64 = self.pathData.chars().nth(self.i as usize).unwrap_or('\0') as i64;
    let chInt : i64 = ch;
    if  (chInt == 45) || (chInt == 43) {
      self.i = self.i + 1;
    }
    while self.i < self.__len {
      let ch2 : i64 = self.pathData.chars().nth(self.i as usize).unwrap_or('\0') as i64;
      let chInt2 : i64 = ch2;
      if  (chInt2 >= 48) && (chInt2 <= 57) {
        self.i = self.i + 1;
      } else {
        break;
      }
    };
    if  self.i < self.__len {
      let ch3 : i64 = self.pathData.chars().nth(self.i as usize).unwrap_or('\0') as i64;
      let chInt3 : i64 = ch3;
      if  chInt3 == 46 {
        self.i = self.i + 1;
        while self.i < self.__len {
          let ch4 : i64 = self.pathData.chars().nth(self.i as usize).unwrap_or('\0') as i64;
          let chInt4 : i64 = ch4;
          if  (chInt4 >= 48) && (chInt4 <= 57) {
            self.i = self.i + 1;
          } else {
            break;
          }
        };
      }
    }
    if  self.i < self.__len {
      let ch5 : i64 = self.pathData.chars().nth(self.i as usize).unwrap_or('\0') as i64;
      let chInt5 : i64 = ch5;
      if  (chInt5 == 101) || (chInt5 == 69) {
        self.i = self.i + 1;
        if  self.i < self.__len {
          let ch6 : i64 = self.pathData.chars().nth(self.i as usize).unwrap_or('\0') as i64;
          let chInt6 : i64 = ch6;
          if  (chInt6 == 45) || (chInt6 == 43) {
            self.i = self.i + 1;
          }
        }
        while self.i < self.__len {
          let ch7 : i64 = self.pathData.chars().nth(self.i as usize).unwrap_or('\0') as i64;
          let chInt7 : i64 = ch7;
          if  (chInt7 >= 48) && (chInt7 <= 57) {
            self.i = self.i + 1;
          } else {
            break;
          }
        };
      }
    }
    let numStr : String = self.pathData.chars().skip(start as usize).take((self.i - start) as usize).collect::<String>();
    let result : f64 = (numStr.parse::<f64>().ok()).unwrap();
    return result;
  }
  fn parseCommand(&mut self, cmd : i64) -> () {
    let cmdInt : i64 = cmd;
    // unused:  let cmdStr : String = (char::from_u32(cmdInt as u32).unwrap_or('\0').to_string());
    self.i = self.i + 1;
    if  (cmdInt == 77) || (cmdInt == 109) {
      let mut x : f64 = self.parseNumber();
      let mut y : f64 = self.parseNumber();
      if  cmdInt == 109 {
        x = self.currentX + x;
        y = self.currentY + y;
      }
      let mut pathCmd : PathCommand = PathCommand::new();
      pathCmd.r#type = "M".to_string();
      pathCmd.x = x;
      pathCmd.y = y;
      self.commands.push(pathCmd.clone());
      self.currentX = x;
      self.currentY = y;
      self.startX = x;
      self.startY = y;
      return;
    }
    if  (cmdInt == 76) || (cmdInt == 108) {
      let mut x_1 : f64 = self.parseNumber();
      let mut y_1 : f64 = self.parseNumber();
      if  cmdInt == 108 {
        x_1 = self.currentX + x_1;
        y_1 = self.currentY + y_1;
      }
      let mut pathCmd_1 : PathCommand = PathCommand::new();
      pathCmd_1.r#type = "L".to_string();
      pathCmd_1.x = x_1;
      pathCmd_1.y = y_1;
      self.commands.push(pathCmd_1.clone());
      self.currentX = x_1;
      self.currentY = y_1;
      return;
    }
    if  (cmdInt == 72) || (cmdInt == 104) {
      let mut x_2 : f64 = self.parseNumber();
      if  cmdInt == 104 {
        x_2 = self.currentX + x_2;
      }
      let mut pathCmd_2 : PathCommand = PathCommand::new();
      pathCmd_2.r#type = "L".to_string();
      pathCmd_2.x = x_2;
      pathCmd_2.y = self.currentY;
      self.commands.push(pathCmd_2.clone());
      self.currentX = x_2;
      return;
    }
    if  (cmdInt == 86) || (cmdInt == 118) {
      let mut y_2 : f64 = self.parseNumber();
      if  cmdInt == 118 {
        y_2 = self.currentY + y_2;
      }
      let mut pathCmd_3 : PathCommand = PathCommand::new();
      pathCmd_3.r#type = "L".to_string();
      pathCmd_3.x = self.currentX;
      pathCmd_3.y = y_2;
      self.commands.push(pathCmd_3.clone());
      self.currentY = y_2;
      return;
    }
    if  (cmdInt == 67) || (cmdInt == 99) {
      let mut x1 : f64 = self.parseNumber();
      let mut y1 : f64 = self.parseNumber();
      let mut x2 : f64 = self.parseNumber();
      let mut y2 : f64 = self.parseNumber();
      let mut x_3 : f64 = self.parseNumber();
      let mut y_3 : f64 = self.parseNumber();
      if  cmdInt == 99 {
        x1 = self.currentX + x1;
        y1 = self.currentY + y1;
        x2 = self.currentX + x2;
        y2 = self.currentY + y2;
        x_3 = self.currentX + x_3;
        y_3 = self.currentY + y_3;
      }
      let mut pathCmd_4 : PathCommand = PathCommand::new();
      pathCmd_4.r#type = "C".to_string();
      pathCmd_4.x1 = x1;
      pathCmd_4.y1 = y1;
      pathCmd_4.x2 = x2;
      pathCmd_4.y2 = y2;
      pathCmd_4.x = x_3;
      pathCmd_4.y = y_3;
      self.commands.push(pathCmd_4.clone());
      self.currentX = x_3;
      self.currentY = y_3;
      return;
    }
    if  (cmdInt == 81) || (cmdInt == 113) {
      let mut x1_1 : f64 = self.parseNumber();
      let mut y1_1 : f64 = self.parseNumber();
      let mut x_4 : f64 = self.parseNumber();
      let mut y_4 : f64 = self.parseNumber();
      if  cmdInt == 113 {
        x1_1 = self.currentX + x1_1;
        y1_1 = self.currentY + y1_1;
        x_4 = self.currentX + x_4;
        y_4 = self.currentY + y_4;
      }
      let mut pathCmd_5 : PathCommand = PathCommand::new();
      pathCmd_5.r#type = "Q".to_string();
      pathCmd_5.x1 = x1_1;
      pathCmd_5.y1 = y1_1;
      pathCmd_5.x = x_4;
      pathCmd_5.y = y_4;
      self.commands.push(pathCmd_5.clone());
      self.currentX = x_4;
      self.currentY = y_4;
      return;
    }
    if  (cmdInt == 90) || (cmdInt == 122) {
      let mut pathCmd_6 : PathCommand = PathCommand::new();
      pathCmd_6.r#type = "Z".to_string();
      self.commands.push(pathCmd_6.clone());
      self.currentX = self.startX;
      self.currentY = self.startY;
      return;
    }
  }
  fn calculateBounds(&mut self, ) -> () {
    if  ((self.commands.len() as i64)) == 0 {
      return;
    }
    let mut minX : f64 = 999999_f64;
    let mut minY : f64 = 999999_f64;
    let mut maxX : f64 = -999999_f64;
    let mut maxY : f64 = -999999_f64;
    let mut i_1 : i64 = 0;
    while i_1 < ((self.commands.len() as i64)) {
      let mut cmd : PathCommand = self.commands[i_1 as usize].clone();
      if  (cmd.r#type == "M".to_string()) || (cmd.r#type == "L".to_string()) {
        if  cmd.x < minX {
          minX = cmd.x;
        }
        if  cmd.x > maxX {
          maxX = cmd.x;
        }
        if  cmd.y < minY {
          minY = cmd.y;
        }
        if  cmd.y > maxY {
          maxY = cmd.y;
        }
      }
      if  cmd.r#type == "C".to_string() {
        if  cmd.x1 < minX {
          minX = cmd.x1;
        }
        if  cmd.x1 > maxX {
          maxX = cmd.x1;
        }
        if  cmd.y1 < minY {
          minY = cmd.y1;
        }
        if  cmd.y1 > maxY {
          maxY = cmd.y1;
        }
        if  cmd.x2 < minX {
          minX = cmd.x2;
        }
        if  cmd.x2 > maxX {
          maxX = cmd.x2;
        }
        if  cmd.y2 < minY {
          minY = cmd.y2;
        }
        if  cmd.y2 > maxY {
          maxY = cmd.y2;
        }
        if  cmd.x < minX {
          minX = cmd.x;
        }
        if  cmd.x > maxX {
          maxX = cmd.x;
        }
        if  cmd.y < minY {
          minY = cmd.y;
        }
        if  cmd.y > maxY {
          maxY = cmd.y;
        }
      }
      if  cmd.r#type == "Q".to_string() {
        if  cmd.x1 < minX {
          minX = cmd.x1;
        }
        if  cmd.x1 > maxX {
          maxX = cmd.x1;
        }
        if  cmd.y1 < minY {
          minY = cmd.y1;
        }
        if  cmd.y1 > maxY {
          maxY = cmd.y1;
        }
        if  cmd.x < minX {
          minX = cmd.x;
        }
        if  cmd.x > maxX {
          maxX = cmd.x;
        }
        if  cmd.y < minY {
          minY = cmd.y;
        }
        if  cmd.y > maxY {
          maxY = cmd.y;
        }
      }
      i_1 = i_1 + 1;
    };
    self.bounds.as_mut().unwrap().minX = minX;
    self.bounds.as_mut().unwrap().minY = minY;
    self.bounds.as_mut().unwrap().maxX = maxX;
    self.bounds.as_mut().unwrap().maxY = maxY;
    self.bounds.as_mut().unwrap().width = maxX - minX;
    self.bounds.as_mut().unwrap().height = maxY - minY;
  }
  fn getBounds(&mut self, ) -> PathBounds {
    let mut result : PathBounds = self.bounds.clone().unwrap();
    return result.clone();
  }
  fn getCommands(&mut self, ) -> Vec<PathCommand> {
    return self.commands.clone();
  }
  fn getScaledCommands(&mut self, targetWidth : f64, targetHeight : f64) -> Vec<PathCommand> {
    let mut scaleX : f64 = 1_f64;
    let mut scaleY : f64 = 1_f64;
    if  self.bounds.as_mut().unwrap().width > 0_f64 {
      scaleX = targetWidth / self.bounds.as_mut().unwrap().width;
    }
    if  self.bounds.as_mut().unwrap().height > 0_f64 {
      scaleY = targetHeight / self.bounds.as_mut().unwrap().height;
    }
    let mut scaled : Vec<PathCommand> = Vec::new();
    let mut i_1 : i64 = 0;
    while i_1 < ((self.commands.len() as i64)) {
      let mut cmd : PathCommand = self.commands[i_1 as usize].clone();
      let mut newCmd : PathCommand = PathCommand::new();
      newCmd.r#type = cmd.r#type.clone();
      if  (cmd.r#type == "M".to_string()) || (cmd.r#type == "L".to_string()) {
        newCmd.x = (cmd.x - self.bounds.as_mut().unwrap().minX) * scaleX;
        newCmd.y = (cmd.y - self.bounds.as_mut().unwrap().minY) * scaleY;
      }
      if  cmd.r#type == "C".to_string() {
        newCmd.x1 = (cmd.x1 - self.bounds.as_mut().unwrap().minX) * scaleX;
        newCmd.y1 = (cmd.y1 - self.bounds.as_mut().unwrap().minY) * scaleY;
        newCmd.x2 = (cmd.x2 - self.bounds.as_mut().unwrap().minX) * scaleX;
        newCmd.y2 = (cmd.y2 - self.bounds.as_mut().unwrap().minY) * scaleY;
        newCmd.x = (cmd.x - self.bounds.as_mut().unwrap().minX) * scaleX;
        newCmd.y = (cmd.y - self.bounds.as_mut().unwrap().minY) * scaleY;
      }
      if  cmd.r#type == "Q".to_string() {
        newCmd.x1 = (cmd.x1 - self.bounds.as_mut().unwrap().minX) * scaleX;
        newCmd.y1 = (cmd.y1 - self.bounds.as_mut().unwrap().minY) * scaleY;
        newCmd.x = (cmd.x - self.bounds.as_mut().unwrap().minX) * scaleX;
        newCmd.y = (cmd.y - self.bounds.as_mut().unwrap().minY) * scaleY;
      }
      scaled.push(newCmd.clone());
      i_1 = i_1 + 1;
    };
    return scaled.clone();
  }
}
#[derive(Clone)]
struct TTFTableRecord { 
  tag : String, 
  checksum : i64, 
  offset : i64, 
  length : i64, 
}
impl TTFTableRecord { 
  
  pub fn new() ->  TTFTableRecord {
    let mut me = TTFTableRecord { 
      tag:"".to_string(), 
      checksum:0, 
      offset:0, 
      length:0, 
    };
    return me;
  }
}
#[derive(Clone)]
struct TTFGlyphMetrics { 
  advanceWidth : i64, 
  leftSideBearing : i64, 
}
impl TTFGlyphMetrics { 
  
  pub fn new() ->  TTFGlyphMetrics {
    let mut me = TTFGlyphMetrics { 
      advanceWidth:0, 
      leftSideBearing:0, 
    };
    return me;
  }
}
#[derive(Clone)]
struct TrueTypeFont { 
  fontData : Vec<u8>, 
  fontPath : String, 
  fontFamily : String, 
  fontStyle : String, 
  sfntVersion : i64, 
  numTables : i64, 
  searchRange : i64, 
  entrySelector : i64, 
  rangeShift : i64, 
  tables : Vec<TTFTableRecord>, 
  unitsPerEm : i64, 
  xMin : i64, 
  yMin : i64, 
  xMax : i64, 
  yMax : i64, 
  indexToLocFormat : i64, 
  ascender : i64, 
  descender : i64, 
  lineGap : i64, 
  numberOfHMetrics : i64, 
  numGlyphs : i64, 
  cmapFormat : i64, 
  cmapOffset : i64, 
  glyphWidths : Vec<i64>, 
  defaultWidth : i64, 
  charWidths : Vec<i64>, 
  charWidthsLoaded : bool, 
}
impl TrueTypeFont { 
  
  pub fn new() ->  TrueTypeFont {
    let mut me = TrueTypeFont { 
      fontData:vec![0u8; 0 as usize], 
      fontPath:"".to_string(), 
      fontFamily:"".to_string(), 
      fontStyle:"Regular".to_string(), 
      sfntVersion:0, 
      numTables:0, 
      searchRange:0, 
      entrySelector:0, 
      rangeShift:0, 
      tables: Vec::new(), 
      unitsPerEm:1000, 
      xMin:0, 
      yMin:0, 
      xMax:0, 
      yMax:0, 
      indexToLocFormat:0, 
      ascender:0, 
      descender:0, 
      lineGap:0, 
      numberOfHMetrics:0, 
      numGlyphs:0, 
      cmapFormat:0, 
      cmapOffset:0, 
      glyphWidths: Vec::new(), 
      defaultWidth:500, 
      charWidths: Vec::new(), 
      charWidthsLoaded:false, 
    };
    let mut t : Vec<TTFTableRecord> = Vec::new();
    me.tables = t.clone();
    let mut gw : Vec<i64> = Vec::new();
    me.glyphWidths = gw.clone();
    let mut cw : Vec<i64> = Vec::new();
    me.charWidths = cw.clone();
    return me;
  }
  fn loadFromFile(&mut self, path : String) -> bool {
    self.fontPath = path.clone();
    let mut lastSlash : i64 = -1;
    let mut i : i64 = 0;
    while i < (path.len() as i64) {
      let ch : i64 = path.chars().nth(i as usize).unwrap_or('\0') as i64;
      if  (ch == 47) || (ch == 92) {
        lastSlash = i;
      }
      i = i + 1;
    };
    let mut dirPath : String = ".".to_string();
    let mut fileName : String = path.clone();
    if  lastSlash >= 0 {
      dirPath = path.chars().skip(0 as usize).take((lastSlash - 0) as usize).collect::<String>();
      fileName = path.chars().skip((lastSlash + 1) as usize).take(((path.len() as i64) - (lastSlash + 1)) as usize).collect::<String>();
    }
    if  (std::path::Path::new(&format!("{}/{}", dirPath, fileName)).exists()) == false {
      return false;
    }
    self.fontData = std::fs::read(format!("{}/{}", dirPath, fileName)).unwrap_or_default();
    if  (self.fontData.len() as i64) == 0 {
      println!( "{}", [&*"TrueTypeFont: Failed to load ".to_string(), &*path].concat() );
      return false;
    }
    if  self.parseOffsetTable() == false {
      return false;
    }
    if  self.parseTableDirectory() == false {
      return false;
    }
    self.parseHeadTable();
    self.parseHheaTable();
    self.parseMaxpTable();
    self.parseCmapTable();
    self.parseHmtxTable();
    self.parseNameTable();
    self.buildCharWidthCache();
    return true;
  }
  fn parseOffsetTable(&mut self, ) -> bool {
    if  (self.fontData.len() as i64) < 12 {
      return false;
    }
    self.sfntVersion = self.readUInt32(0);
    self.numTables = self.readUInt16(4);
    self.searchRange = self.readUInt16(6);
    self.entrySelector = self.readUInt16(8);
    self.rangeShift = self.readUInt16(10);
    return true;
  }
  fn parseTableDirectory(&mut self, ) -> bool {
    let mut offset : i64 = 12;
    let mut i : i64 = 0;
    while i < self.numTables {
      let mut record : TTFTableRecord = TTFTableRecord::new();
      record.tag = self.readTag(offset);
      record.checksum = self.readUInt32((offset + 4));
      record.offset = self.readUInt32((offset + 8));
      record.length = self.readUInt32((offset + 12));
      self.tables.push(record.clone());
      offset = offset + 16;
      i = i + 1;
    };
    return true;
  }
  fn findTable(&mut self, tag : String) -> TTFTableRecord {
    let mut i : i64 = 0;
    while i < ((self.tables.len() as i64)) {
      let mut t : TTFTableRecord = self.tables[i as usize].clone();
      if  t.tag == tag {
        return t.clone();
      }
      i = i + 1;
    };
    let mut empty : TTFTableRecord = TTFTableRecord::new();
    return empty.clone();
  }
  fn parseHeadTable(&mut self, ) -> () {
    let mut table : TTFTableRecord = self.findTable("head".to_string());
    if  table.offset == 0 {
      return;
    }
    let off : i64 = table.offset;
    self.unitsPerEm = self.readUInt16((off + 18));
    self.xMin = self.readInt16((off + 36));
    self.yMin = self.readInt16((off + 38));
    self.xMax = self.readInt16((off + 40));
    self.yMax = self.readInt16((off + 42));
    self.indexToLocFormat = self.readInt16((off + 50));
  }
  fn parseHheaTable(&mut self, ) -> () {
    let mut table : TTFTableRecord = self.findTable("hhea".to_string());
    if  table.offset == 0 {
      return;
    }
    let off : i64 = table.offset;
    self.ascender = self.readInt16((off + 4));
    self.descender = self.readInt16((off + 6));
    self.lineGap = self.readInt16((off + 8));
    self.numberOfHMetrics = self.readUInt16((off + 34));
  }
  fn parseMaxpTable(&mut self, ) -> () {
    let mut table : TTFTableRecord = self.findTable("maxp".to_string());
    if  table.offset == 0 {
      return;
    }
    let off : i64 = table.offset;
    self.numGlyphs = self.readUInt16((off + 4));
  }
  fn parseCmapTable(&mut self, ) -> () {
    let mut table : TTFTableRecord = self.findTable("cmap".to_string());
    if  table.offset == 0 {
      return;
    }
    let off : i64 = table.offset;
    let numSubtables : i64 = self.readUInt16((off + 2));
    let mut i : i64 = 0;
    let mut subtableOffset : i64 = 0;
    while i < numSubtables {
      let recordOff : i64 = (off + 4) + (i * 8);
      let platformID : i64 = self.readUInt16(recordOff);
      let encodingID : i64 = self.readUInt16((recordOff + 2));
      let subOff : i64 = self.readUInt32((recordOff + 4));
      if  (platformID == 3) && (encodingID == 1) {
        subtableOffset = subOff;
      }
      if  (platformID == 0) && (subtableOffset == 0) {
        subtableOffset = subOff;
      }
      i = i + 1;
    };
    if  subtableOffset > 0 {
      self.cmapOffset = off + subtableOffset;
      self.cmapFormat = self.readUInt16(self.cmapOffset);
    }
  }
  fn parseHmtxTable(&mut self, ) -> () {
    let mut table : TTFTableRecord = self.findTable("hmtx".to_string());
    if  table.offset == 0 {
      return;
    }
    let off : i64 = table.offset;
    let mut i : i64 = 0;
    while i < self.numberOfHMetrics {
      let advanceWidth : i64 = self.readUInt16((off + (i * 4)));
      self.glyphWidths.push(advanceWidth);
      i = i + 1;
    };
    if  self.numberOfHMetrics > 0 {
      self.defaultWidth = self.glyphWidths[(self.numberOfHMetrics - 1) as usize].clone();
    }
  }
  fn parseNameTable(&mut self, ) -> () {
    let mut table : TTFTableRecord = self.findTable("name".to_string());
    if  table.offset == 0 {
      return;
    }
    let off : i64 = table.offset;
    let count : i64 = self.readUInt16((off + 2));
    let stringOffset : i64 = self.readUInt16((off + 4));
    let mut i : i64 = 0;
    while i < count {
      let recordOff : i64 = (off + 6) + (i * 12);
      let platformID : i64 = self.readUInt16(recordOff);
      // unused:  let encodingID : i64 = self.readUInt16((recordOff + 2));
      // unused:  let languageID : i64 = self.readUInt16((recordOff + 4));
      let nameID : i64 = self.readUInt16((recordOff + 6));
      let length : i64 = self.readUInt16((recordOff + 8));
      let strOffset : i64 = self.readUInt16((recordOff + 10));
      if  (nameID == 1) && (platformID == 3) {
        let strOff : i64 = (off + stringOffset) + strOffset;
        self.fontFamily = self.readUnicodeString(strOff, length);
      }
      if  ((nameID == 1) && (platformID == 1)) && ((self.fontFamily.len() as i64) == 0) {
        let strOff_1 : i64 = (off + stringOffset) + strOffset;
        self.fontFamily = self.readAsciiString(strOff_1, length);
      }
      if  (nameID == 2) && (platformID == 3) {
        let strOff_2 : i64 = (off + stringOffset) + strOffset;
        self.fontStyle = self.readUnicodeString(strOff_2, length);
      }
      if  ((nameID == 2) && (platformID == 1)) && ((self.fontStyle.len() as i64) == 0) {
        let strOff_3 : i64 = (off + stringOffset) + strOffset;
        self.fontStyle = self.readAsciiString(strOff_3, length);
      }
      i = i + 1;
    };
  }
  fn getGlyphIndex(&mut self, charCode : i64) -> i64 {
    if  self.cmapOffset == 0 {
      return 0;
    }
    if  self.cmapFormat == 4 {
      return self.getGlyphIndexFormat4(charCode);
    }
    if  self.cmapFormat == 0 {
      if  charCode < 256 {
        return self.readUInt8(((self.cmapOffset + 6) + charCode));
      }
    }
    if  self.cmapFormat == 6 {
      let firstCode : i64 = self.readUInt16((self.cmapOffset + 6));
      let entryCount : i64 = self.readUInt16((self.cmapOffset + 8));
      if  (charCode >= firstCode) && (charCode < (firstCode + entryCount)) {
        return self.readUInt16(((self.cmapOffset + 10) + ((charCode - firstCode) * 2)));
      }
    }
    return 0;
  }
  fn getGlyphIndexFormat4(&mut self, charCode : i64) -> i64 {
    let off : i64 = self.cmapOffset;
    let segCountX2 : i64 = self.readUInt16((off + 6));
    let segCountD : f64 = ((segCountX2 as f64)) / 2_f64;
    let segCount : i64 = segCountD as i64 ;
    let endCodesOff : i64 = off + 14;
    let startCodesOff : i64 = (endCodesOff + segCountX2) + 2;
    let idDeltaOff : i64 = startCodesOff + segCountX2;
    let idRangeOffsetOff : i64 = idDeltaOff + segCountX2;
    let mut i : i64 = 0;
    while i < segCount {
      let endCode : i64 = self.readUInt16((endCodesOff + (i * 2)));
      let startCode : i64 = self.readUInt16((startCodesOff + (i * 2)));
      if  (charCode >= startCode) && (charCode <= endCode) {
        let idDelta : i64 = self.readInt16((idDeltaOff + (i * 2)));
        let idRangeOffset : i64 = self.readUInt16((idRangeOffsetOff + (i * 2)));
        if  idRangeOffset == 0 {
          return (charCode + idDelta) % 65536;
        } else {
          let glyphIdOff : i64 = ((idRangeOffsetOff + (i * 2)) + idRangeOffset) + ((charCode - startCode) * 2);
          let glyphId : i64 = self.readUInt16(glyphIdOff);
          if  glyphId != 0 {
            return (glyphId + idDelta) % 65536;
          }
        }
      }
      i = i + 1;
    };
    return 0;
  }
  fn getGlyphWidth(&mut self, glyphIndex : i64) -> i64 {
    if  glyphIndex < ((self.glyphWidths.len() as i64)) {
      return self.glyphWidths[glyphIndex as usize].clone();
    }
    return self.defaultWidth;
  }
  fn buildCharWidthCache(&mut self, ) -> () {
    let mut i : i64 = 0;
    while i < 256 {
      let glyphIdx : i64 = self.getGlyphIndex(i);
      let width : i64 = self.getGlyphWidth(glyphIdx);
      self.charWidths.push(width);
      i = i + 1;
    };
    self.charWidthsLoaded = true;
  }
  fn getCharWidth(&mut self, charCode : i64) -> i64 {
    if  self.charWidthsLoaded && (charCode < 256) {
      return self.charWidths[charCode as usize].clone();
    }
    let glyphIdx : i64 = self.getGlyphIndex(charCode);
    return self.getGlyphWidth(glyphIdx);
  }
  fn getCharWidthPoints(&mut self, charCode : i64, fontSize : f64) -> f64 {
    let fontUnits : i64 = self.getCharWidth(charCode);
    return (((fontUnits as f64)) * fontSize) / ((self.unitsPerEm as f64));
  }
  fn measureText(&mut self, text : String, fontSize : f64) -> f64 {
    let mut width : f64 = 0_f64;
    let __len : i64 = text.len() as i64;
    let mut i : i64 = 0;
    while i < __len {
      let ch : i64 = text.chars().nth(i as usize).unwrap_or('\0') as i64;
      width = width + self.getCharWidthPoints(ch, fontSize);
      i = i + 1;
    };
    return width;
  }
  fn getAscender(&mut self, fontSize : f64) -> f64 {
    return (((self.ascender as f64)) * fontSize) / ((self.unitsPerEm as f64));
  }
  fn getDescender(&mut self, fontSize : f64) -> f64 {
    return (((self.descender as f64)) * fontSize) / ((self.unitsPerEm as f64));
  }
  fn getLineHeight(&mut self, fontSize : f64) -> f64 {
    let asc : f64 = self.getAscender(fontSize);
    let desc : f64 = self.getDescender(fontSize);
    let gap : f64 = (((self.lineGap as f64)) * fontSize) / ((self.unitsPerEm as f64));
    return (asc - desc) + gap;
  }
  fn getFontData(&mut self, ) -> Vec<u8> {
    return self.fontData.clone();
  }
  fn getPostScriptName(&mut self, ) -> String {
    let name : String = self.fontFamily.clone();
    let mut result : String = "".to_string();
    let mut i : i64 = 0;
    while i < (name.len() as i64) {
      let ch : i64 = name.chars().nth(i as usize).unwrap_or('\0') as i64;
      if  ch != 32 {
        result = [&*result, &*((char::from_u32(ch as u32).unwrap_or('\0').to_string()))].concat();
      }
      i = i + 1;
    };
    if  (result.len() as i64) == 0 {
      return "CustomFont".to_string().clone();
    }
    return result.clone();
  }
  fn readUInt8(&mut self, offset : i64) -> i64 {
    return self.fontData[(offset) as usize] as i64;
  }
  fn readUInt16(&mut self, offset : i64) -> i64 {
    let b1 : i64 = self.fontData[(offset) as usize] as i64;
    let b2 : i64 = self.fontData[((offset + 1)) as usize] as i64;
    return (b1 * 256) + b2;
  }
  fn readInt16(&mut self, offset : i64) -> i64 {
    let val : i64 = self.readUInt16(offset);
    if  val >= 32768 {
      return val - 65536;
    }
    return val;
  }
  fn readUInt32(&mut self, offset : i64) -> i64 {
    let b1 : i64 = self.fontData[(offset) as usize] as i64;
    let b2 : i64 = self.fontData[((offset + 1)) as usize] as i64;
    let b3 : i64 = self.fontData[((offset + 2)) as usize] as i64;
    let b4 : i64 = self.fontData[((offset + 3)) as usize] as i64;
    let result : i64 = (((((b1 * 256) + b2) * 256) + b3) * 256) + b4;
    return result;
  }
  fn readTag(&mut self, offset : i64) -> String {
    let mut result : String = "".to_string();
    let mut i : i64 = 0;
    while i < 4 {
      let ch : i64 = self.fontData[((offset + i)) as usize] as i64;
      result = [&*result, &*((char::from_u32(ch as u32).unwrap_or('\0').to_string()))].concat();
      i = i + 1;
    };
    return result.clone();
  }
  fn readAsciiString(&mut self, offset : i64, length : i64) -> String {
    let mut result : String = "".to_string();
    let mut i : i64 = 0;
    while i < length {
      let ch : i64 = self.fontData[((offset + i)) as usize] as i64;
      if  ch > 0 {
        result = [&*result, &*((char::from_u32(ch as u32).unwrap_or('\0').to_string()))].concat();
      }
      i = i + 1;
    };
    return result.clone();
  }
  fn readUnicodeString(&mut self, offset : i64, length : i64) -> String {
    let mut result : String = "".to_string();
    let mut i : i64 = 0;
    while i < length {
      let ch : i64 = self.readUInt16((offset + i));
      if  (ch > 0) && (ch < 128) {
        result = [&*result, &*((char::from_u32(ch as u32).unwrap_or('\0').to_string()))].concat();
      }
      i = i + 2;
    };
    return result.clone();
  }
  fn printInfo(&mut self, ) -> () {
    println!( "{}", [&*([&*([&*"Font: ".to_string(), &*self.fontFamily].concat()), &*" ".to_string()].concat()), &*self.fontStyle].concat() );
    println!( "{}", [&*"  Units per EM: ".to_string(), &*(self.unitsPerEm.to_string())].concat() );
    println!( "{}", [&*"  Ascender: ".to_string(), &*(self.ascender.to_string())].concat() );
    println!( "{}", [&*"  Descender: ".to_string(), &*(self.descender.to_string())].concat() );
    println!( "{}", [&*"  Line gap: ".to_string(), &*(self.lineGap.to_string())].concat() );
    println!( "{}", [&*"  Num glyphs: ".to_string(), &*(self.numGlyphs.to_string())].concat() );
    println!( "{}", [&*"  Num hMetrics: ".to_string(), &*(self.numberOfHMetrics.to_string())].concat() );
    println!( "{}", [&*"  Tables: ".to_string(), &*(((self.tables.len() as i64)).to_string())].concat() );
  }
}
#[derive(Clone)]
struct FontManager { 
  fonts : Vec<TrueTypeFont>, 
  fontNames : Vec<String>, 
  fontsDirectory : String, 
  fontsDirectories : Vec<String>, 
  defaultFont : TrueTypeFont, 
  hasDefaultFont : bool, 
}
impl FontManager { 
  
  pub fn new() ->  FontManager {
    let mut me = FontManager { 
      fonts: Vec::new(), 
      fontNames: Vec::new(), 
      fontsDirectory:"./Fonts".to_string(), 
      fontsDirectories: Vec::new(), 
      defaultFont:TrueTypeFont::new(), 
      hasDefaultFont:false, 
    };
    let mut f : Vec<TrueTypeFont> = Vec::new();
    me.fonts = f.clone();
    let mut n : Vec<String> = Vec::new();
    me.fontNames = n.clone();
    let mut fd : Vec<String> = Vec::new();
    me.fontsDirectories = fd.clone();
    return me;
  }
  fn setFontsDirectory(&mut self, path : String) -> () {
    self.fontsDirectory = path.clone();
  }
  fn getFontCount(&mut self, ) -> i64 {
    return (self.fonts.len() as i64);
  }
  fn addFontsDirectory(&mut self, path : String) -> () {
    self.fontsDirectories.push(path.clone());
  }
  fn setFontsDirectories(&mut self, paths : String) -> () {
    let mut start : i64 = 0;
    let mut i : i64 = 0;
    let __len : i64 = paths.len() as i64;
    while i <= __len {
      let mut ch : String = "".to_string();
      if  i < __len {
        ch = paths.chars().skip(i as usize).take(((i + 1) - i) as usize).collect::<String>();
      }
      if  (ch == ";".to_string()) || (i == __len) {
        if  i > start {
          let part : String = paths.chars().skip(start as usize).take((i - start) as usize).collect::<String>();
          self.fontsDirectories.push(part.clone());
          println!( "{}", [&*"FontManager: Added fonts directory: ".to_string(), &*part].concat() );
        }
        start = i + 1;
      }
      i = i + 1;
    };
    if  ((self.fontsDirectories.len() as i64)) > 0 {
      self.fontsDirectory = self.fontsDirectories[0 as usize].clone();
    }
  }
  fn loadFont(&mut self, relativePath : String) -> bool {
    let mut i : i64 = 0;
    while i < ((self.fontsDirectories.len() as i64)) {
      let dir : String = self.fontsDirectories[i as usize].clone();
      let fullPath : String = [&*([&*dir, &*"/".to_string()].concat()), &*relativePath].concat();
      let mut font : TrueTypeFont = TrueTypeFont::new();
      if  font.loadFromFile(fullPath.clone()) == true {
        self.fonts.push(font.clone());
        self.fontNames.push(font.fontFamily.clone());
        if  self.hasDefaultFont == false {
          self.defaultFont = font.clone();
          self.hasDefaultFont = true;
        }
        println!( "{}", [&*([&*([&*([&*([&*"FontManager: Loaded font '".to_string(), &*font.fontFamily].concat()), &*"' (".to_string()].concat()), &*font.fontStyle].concat()), &*") from ".to_string()].concat()), &*fullPath].concat() );
        return true;
      }
      i = i + 1;
    };
    let fullPath_1 : String = [&*([&*self.fontsDirectory, &*"/".to_string()].concat()), &*relativePath].concat();
    let mut font_1 : TrueTypeFont = TrueTypeFont::new();
    if  font_1.loadFromFile(fullPath_1.clone()) == false {
      println!( "{}", [&*"FontManager: Failed to load font: ".to_string(), &*relativePath].concat() );
      return false;
    }
    self.fonts.push(font_1.clone());
    self.fontNames.push(font_1.fontFamily.clone());
    if  self.hasDefaultFont == false {
      self.defaultFont = font_1.clone();
      self.hasDefaultFont = true;
    }
    println!( "{}", [&*([&*([&*([&*"FontManager: Loaded font '".to_string(), &*font_1.fontFamily].concat()), &*"' (".to_string()].concat()), &*font_1.fontStyle].concat()), &*")".to_string()].concat() );
    return true;
  }
  fn loadFontFamily(&mut self, familyDir : String) -> () {
    self.loadFont([&*([&*([&*familyDir, &*"/".to_string()].concat()), &*familyDir].concat()), &*"-Regular.ttf".to_string()].concat());
  }
  fn getFont(&mut self, fontFamily : String) -> TrueTypeFont {
    let mut i : i64 = 0;
    while i < ((self.fonts.len() as i64)) {
      let mut f : TrueTypeFont = self.fonts[i as usize].clone();
      if  f.fontFamily == fontFamily {
        return f.clone();
      }
      i = i + 1;
    };
    i = 0;
    while i < ((self.fonts.len() as i64)) {
      let mut f_1 : TrueTypeFont = self.fonts[i as usize].clone();
      if  ((f_1.fontFamily.find(&*fontFamily).map(|i| i as i64).unwrap_or(-1))) >= 0 {
        return f_1.clone();
      }
      i = i + 1;
    };
    return self.defaultFont.clone();
  }
  fn measureText(&mut self, text : String, fontFamily : String, fontSize : f64) -> f64 {
    let mut font : TrueTypeFont = self.getFont(fontFamily.clone());
    if  font.unitsPerEm > 0 {
      return font.measureText(text.clone(), fontSize);
    }
    return ((((text.len() as i64) as f64)) * fontSize) * 0.5_f64;
  }
  fn getLineHeight(&mut self, fontFamily : String, fontSize : f64) -> f64 {
    let mut font : TrueTypeFont = self.getFont(fontFamily.clone());
    if  font.unitsPerEm > 0 {
      return font.getLineHeight(fontSize);
    }
    return fontSize * 1.2_f64;
  }
  fn getAscender(&mut self, fontFamily : String, fontSize : f64) -> f64 {
    let mut font : TrueTypeFont = self.getFont(fontFamily.clone());
    if  font.unitsPerEm > 0 {
      return font.getAscender(fontSize);
    }
    return fontSize * 0.8_f64;
  }
  fn getDescender(&mut self, fontFamily : String, fontSize : f64) -> f64 {
    let mut font : TrueTypeFont = self.getFont(fontFamily.clone());
    if  font.unitsPerEm > 0 {
      return font.getDescender(fontSize);
    }
    return fontSize * -0.2_f64;
  }
  fn getFontData(&mut self, fontFamily : String) -> Vec<u8> {
    let mut font : TrueTypeFont = self.getFont(fontFamily.clone());
    return font.getFontData();
  }
  fn getPostScriptName(&mut self, fontFamily : String) -> String {
    let mut font : TrueTypeFont = self.getFont(fontFamily.clone());
    return font.getPostScriptName().clone();
  }
  fn printLoadedFonts(&mut self, ) -> () {
    println!( "{}", [&*([&*"FontManager: ".to_string(), &*(((self.fonts.len() as i64)).to_string())].concat()), &*" fonts loaded:".to_string()].concat() );
    let mut i : i64 = 0;
    while i < ((self.fonts.len() as i64)) {
      let mut f : TrueTypeFont = self.fonts[i as usize].clone();
      println!( "{}", [&*([&*([&*([&*"  - ".to_string(), &*f.fontFamily].concat()), &*" (".to_string()].concat()), &*f.fontStyle].concat()), &*")".to_string()].concat() );
      i = i + 1;
    };
  }
}
#[derive(Clone)]
struct TTFTextMeasurer { 
  fontManager : Option<RefCell<FontManager>>, 
}
impl TTFTextMeasurer { 
  
  pub fn new(fm : FontManager) ->  TTFTextMeasurer {
    let mut me = TTFTextMeasurer { 
      fontManager: None, 
    };
    me.fontManager = Some(RefCell::new(fm.clone()));
    return me;
  }
  fn measureText(&mut self, text : String, fontFamily : String, fontSize : f64) -> EVGTextMetrics {
    let width : f64 = self.fontManager.as_ref().unwrap().borrow_mut().measureText(text.clone(), fontFamily.clone(), fontSize);
    let lineHeight : f64 = self.fontManager.as_ref().unwrap().borrow_mut().getLineHeight(fontFamily.clone(), fontSize);
    let ascent : f64 = self.fontManager.as_ref().unwrap().borrow_mut().getAscender(fontFamily.clone(), fontSize);
    let descent : f64 = self.fontManager.as_ref().unwrap().borrow_mut().getDescender(fontFamily.clone(), fontSize);
    let mut metrics : EVGTextMetrics = EVGTextMetrics::new();
    metrics.width = width;
    metrics.height = lineHeight;
    metrics.ascent = ascent;
    metrics.descent = descent;
    metrics.lineHeight = lineHeight;
    return metrics.clone();
  }
  fn measureTextWidth(&mut self, text : String, fontFamily : String, fontSize : f64) -> f64 {
    return self.fontManager.as_ref().unwrap().borrow_mut().measureText(text.clone(), fontFamily.clone(), fontSize);
  }
  fn getLineHeight(&mut self, fontFamily : String, fontSize : f64) -> f64 {
    return self.fontManager.as_ref().unwrap().borrow_mut().getLineHeight(fontFamily.clone(), fontSize);
  }
  fn measureChar(&mut self, ch : i64, fontFamily : String, fontSize : f64) -> f64 {
    let mut font : TrueTypeFont = self.fontManager.as_ref().unwrap().borrow_mut().getFont(fontFamily.clone());
    if  font.unitsPerEm > 0 {
      return font.getCharWidthPoints(ch, fontSize);
    }
    return fontSize * 0.5_f64;
  }
}
impl TTFTextMeasurer {
  // Inherited methods from parent class EVGTextMeasurer
  fn wrapText(&mut self, text : String, fontFamily : String, fontSize : f64, maxWidth : f64) -> Vec<String> {
    let mut lines : Vec<String> = Vec::new();
    let mut currentLine : String = "".to_string();
    let mut currentWidth : f64 = 0_f64;
    let mut wordStart : i64 = 0;
    let textLen : i64 = text.len() as i64;
    let mut i : i64 = 0;
    while i <= textLen {
      let mut ch : i64 = 0;
      let isEnd : bool = i == textLen;
      if  isEnd == false {
        ch = text.chars().nth(i as usize).unwrap_or('\0') as i64;
      }
      let mut isWordEnd : bool = false;
      if  isEnd {
        isWordEnd = true;
      }
      if  ch == 32 {
        isWordEnd = true;
      }
      if  ch == 10 {
        isWordEnd = true;
      }
      if  isWordEnd {
        let mut word : String = "".to_string();
        if  i > wordStart {
          word = text.chars().skip(wordStart as usize).take((i - wordStart) as usize).collect::<String>();
        }
        let wordWidth : f64 = self.measureTextWidth(word.clone(), fontFamily.clone(), fontSize);
        let mut spaceWidth : f64 = 0_f64;
        if  (currentLine.len() as i64) > 0 {
          spaceWidth = self.measureTextWidth(" ".to_string(), fontFamily.clone(), fontSize);
        }
        if  ((currentWidth + spaceWidth) + wordWidth) <= maxWidth {
          if  (currentLine.len() as i64) > 0 {
            currentLine = [&*currentLine, &*" ".to_string()].concat();
            currentWidth = currentWidth + spaceWidth;
          }
          currentLine = [&*currentLine, &*word].concat();
          currentWidth = currentWidth + wordWidth;
        } else {
          if  (currentLine.len() as i64) > 0 {
            lines.push(currentLine.clone());
          }
          currentLine = word.clone();
          currentWidth = wordWidth;
        }
        if  ch == 10 {
          lines.push(currentLine.clone());
          currentLine = "".to_string();
          currentWidth = 0_f64;
        }
        wordStart = i + 1;
      }
      i = i + 1;
    };
    if  (currentLine.len() as i64) > 0 {
      lines.push(currentLine.clone());
    }
    return lines.clone();
  }
}
impl EVGTextMeasurerTrait for TTFTextMeasurer {
  fn measureText(&mut self, text : String, fontFamily : String, fontSize : f64) -> EVGTextMetrics {
    TTFTextMeasurer::measureText(self, text, fontFamily, fontSize)
  }
  fn measureTextWidth(&mut self, text : String, fontFamily : String, fontSize : f64) -> f64 {
    TTFTextMeasurer::measureTextWidth(self, text, fontFamily, fontSize)
  }
  fn getLineHeight(&mut self, fontFamily : String, fontSize : f64) -> f64 {
    TTFTextMeasurer::getLineHeight(self, fontFamily, fontSize)
  }
  fn measureChar(&mut self, ch : i64, fontFamily : String, fontSize : f64) -> f64 {
    TTFTextMeasurer::measureChar(self, ch, fontFamily, fontSize)
  }
  fn wrapText(&mut self, text : String, fontFamily : String, fontSize : f64, maxWidth : f64) -> Vec<String> {
    TTFTextMeasurer::wrapText(self, text, fontFamily, fontSize, maxWidth)
  }
}
#[derive(Clone)]
struct BitReader { 
  data : Vec<u8>, 
  dataStart : i64, 
  dataEnd : i64, 
  bytePos : i64, 
  bitPos : i64, 
  currentByte : i64, 
  eof : bool, 
}
impl BitReader { 
  
  pub fn new() ->  BitReader {
    let mut me = BitReader { 
      data:vec![0u8; 0 as usize], 
      dataStart:0, 
      dataEnd:0, 
      bytePos:0, 
      bitPos:0, 
      currentByte:0, 
      eof:false, 
    };
    return me;
  }
  fn init(&mut self, buf : &Vec<u8>, startPos : i64, length : i64) -> () {
    self.data = buf;
    self.dataStart = startPos;
    self.dataEnd = startPos + length;
    self.bytePos = startPos;
    self.bitPos = 0;
    self.currentByte = 0;
    self.eof = false;
  }
  fn loadNextByte(&mut self, ) -> () {
    if  self.bytePos >= self.dataEnd {
      self.eof = true;
      self.currentByte = 0;
      self.bitPos = 8;
      return;
    }
    self.currentByte = self.data[(self.bytePos) as usize] as i64;
    self.bytePos = self.bytePos + 1;
    if  self.currentByte == 255 {
      if  self.bytePos < self.dataEnd {
        let nextByte : i64 = self.data[(self.bytePos) as usize] as i64;
        if  nextByte == 0 {
          self.bytePos = self.bytePos + 1;
        } else {
          if  (nextByte >= 208) && (nextByte <= 215) {
            self.bytePos = self.bytePos + 1;
            self.loadNextByte();
            return;
          }
          if  nextByte == 255 {
            self.bytePos = self.bytePos + 1;
            self.loadNextByte();
            return;
          }
        }
      }
    }
    self.bitPos = 8;
  }
  fn readBit(&mut self, ) -> i64 {
    if  self.bitPos == 0 {
      self.loadNextByte();
    }
    if  self.eof {
      return 0;
    }
    self.bitPos = self.bitPos - 1;
    let bit : i64 = (((((self.currentByte) >> (self.bitPos)))) & (1));
    return bit;
  }
  fn readBits(&mut self, count : i64) -> i64 {
    let mut result : i64 = 0;
    let mut i : i64 = 0;
    while i < count {
      result = (((((result) << (1)))) | (self.readBit()));
      i = i + 1;
    };
    return result;
  }
  fn peekBits(&mut self, count : i64) -> i64 {
    let savedBytePos : i64 = self.bytePos;
    let savedBitPos : i64 = self.bitPos;
    let savedCurrentByte : i64 = self.currentByte;
    let savedEof : bool = self.eof;
    let result : i64 = self.readBits(count);
    self.bytePos = savedBytePos;
    self.bitPos = savedBitPos;
    self.currentByte = savedCurrentByte;
    self.eof = savedEof;
    return result;
  }
  fn alignToByte(&mut self, ) -> () {
    self.bitPos = 0;
  }
  fn getBytePosition(&mut self, ) -> i64 {
    return self.bytePos;
  }
  fn isEOF(&mut self, ) -> bool {
    return self.eof;
  }
  fn receiveExtend(&mut self, length : i64) -> i64 {
    if  length == 0 {
      return 0;
    }
    let mut value : i64 = self.readBits(length);
    let threshold : i64 = ((1) << ((length - 1)));
    if  value < threshold {
      value = value - ((((threshold) << (1))) - 1);
    }
    return value;
  }
}
#[derive(Clone)]
struct HuffmanTable { 
  bits : Vec<i64>, 
  values : Vec<i64>, 
  maxCode : Vec<i64>, 
  minCode : Vec<i64>, 
  valPtr : Vec<i64>, 
  tableClass : i64, 
  tableId : i64, 
}
impl HuffmanTable { 
  
  pub fn new() ->  HuffmanTable {
    let mut me = HuffmanTable { 
      bits:vec![0i64; 16 as usize], 
      values: Vec::new(), 
      maxCode:vec![0i64; 16 as usize], 
      minCode:vec![0i64; 16 as usize], 
      valPtr:vec![0i64; 16 as usize], 
      tableClass:0, 
      tableId:0, 
    };
    let mut i : i64 = 0;
    while i < 16 {
      me.bits[(i) as usize] = 0;
      me.maxCode[(i) as usize] = -1;
      me.minCode[(i) as usize] = 0;
      me.valPtr[(i) as usize] = 0;
      i = i + 1;
    };
    return me;
  }
  fn build(&mut self, ) -> () {
    let mut code : i64 = 0;
    let mut valueIdx : i64 = 0;
    let mut i : i64 = 0;
    while i < 16 {
      let count : i64 = self.bits[(i) as usize];
      if  count > 0 {
        self.minCode[(i) as usize] = code;
        self.valPtr[(i) as usize] = valueIdx;
        valueIdx = valueIdx + count;
        code = code + count;
        self.maxCode[(i) as usize] = code - 1;
      } else {
        self.maxCode[(i) as usize] = -1;
        self.minCode[(i) as usize] = 0;
        self.valPtr[(i) as usize] = valueIdx;
      }
      code = ((code) << (1));
      i = i + 1;
    };
  }
  fn decode(&mut self, mut reader : &mut BitReader) -> i64 {
    let mut code : i64 = 0;
    let mut length : i64 = 0;
    while length < 16 {
      let bit : i64 = reader.readBit();
      code = (((((code) << (1)))) | (bit));
      let maxC : i64 = self.maxCode[(length) as usize];
      if  maxC >= 0 {
        if  code <= maxC {
          let minC : i64 = self.minCode[(length) as usize];
          let ptr : i64 = self.valPtr[(length) as usize];
          let idx : i64 = ptr + (code - minC);
          return self.values[idx as usize].clone();
        }
      }
      length = length + 1;
    };
    println!( "{}", "Huffman decode error: code not found".to_string() );
    return 0;
  }
  fn resetArrays(&mut self, ) -> () {
    let mut i : i64 = 0;
    while i < 16 {
      self.bits[(i) as usize] = 0;
      self.maxCode[(i) as usize] = -1;
      self.minCode[(i) as usize] = 0;
      self.valPtr[(i) as usize] = 0;
      i = i + 1;
    };
  }
}
#[derive(Clone)]
struct HuffmanDecoder { 
  dcTable0 : HuffmanTable, 
  dcTable1 : HuffmanTable, 
  acTable0 : HuffmanTable, 
  acTable1 : HuffmanTable, 
}
impl HuffmanDecoder { 
  
  pub fn new() ->  HuffmanDecoder {
    let mut me = HuffmanDecoder { 
      dcTable0:HuffmanTable::new(), 
      dcTable1:HuffmanTable::new(), 
      acTable0:HuffmanTable::new(), 
      acTable1:HuffmanTable::new(), 
    };
    return me;
  }
  fn getDCTable(&mut self, id : i64) -> HuffmanTable {
    if  id == 0 {
      return self.dcTable0.clone();
    }
    return self.dcTable1.clone();
  }
  fn getACTable(&mut self, id : i64) -> HuffmanTable {
    if  id == 0 {
      return self.acTable0.clone();
    }
    return self.acTable1.clone();
  }
  fn parseDHT(&mut self, data : &Vec<u8>, mut pos : i64, length : i64) -> () {
    let endPos : i64 = pos + length;
    while pos < endPos {
      let tableInfo : i64 = data[(pos) as usize] as i64;
      pos = pos + 1;
      let tableClass : i64 = ((tableInfo) >> (4));
      let tableId : i64 = ((tableInfo) & (15));
      let mut table : HuffmanTable = self.getDCTable(tableId);
      if  tableClass == 1 {
        table = self.getACTable(tableId);
      }
      table.tableClass = tableClass;
      table.tableId = tableId;
      table.resetArrays();
      let mut totalSymbols : i64 = 0;
      let mut i : i64 = 0;
      while i < 16 {
        let count : i64 = data[(pos) as usize] as i64;
        table.bits[(i) as usize] = count;
        totalSymbols = totalSymbols + count;
        pos = pos + 1;
        i = i + 1;
      };
      i = 0;
      while i < totalSymbols {
        table.values.push(data[(pos) as usize] as i64);
        pos = pos + 1;
        i = i + 1;
      };
      table.build();
      let mut classStr : String = "DC".to_string();
      if  tableClass == 1 {
        classStr = "AC".to_string();
      }
      println!( "{}", [&*([&*([&*([&*([&*"  Huffman table ".to_string(), &*classStr].concat()), &*(tableId.to_string())].concat()), &*": ".to_string()].concat()), &*(totalSymbols.to_string())].concat()), &*" symbols".to_string()].concat() );
    };
  }
}
#[derive(Clone)]
struct IDCT { 
  cosTable : Vec<i64>, 
  zigzagMap : Vec<i64>, 
}
impl IDCT { 
  
  pub fn new() ->  IDCT {
    let mut me = IDCT { 
      cosTable:vec![0i64; 64 as usize], 
      zigzagMap:vec![0i64; 64 as usize], 
    };
    me.cosTable[(0) as usize] = 1024;
    me.cosTable[(1) as usize] = 1004;
    me.cosTable[(2) as usize] = 946;
    me.cosTable[(3) as usize] = 851;
    me.cosTable[(4) as usize] = 724;
    me.cosTable[(5) as usize] = 569;
    me.cosTable[(6) as usize] = 392;
    me.cosTable[(7) as usize] = 200;
    me.cosTable[(8) as usize] = 1024;
    me.cosTable[(9) as usize] = 851;
    me.cosTable[(10) as usize] = 392;
    me.cosTable[(11) as usize] = -200;
    me.cosTable[(12) as usize] = -724;
    me.cosTable[(13) as usize] = -1004;
    me.cosTable[(14) as usize] = -946;
    me.cosTable[(15) as usize] = -569;
    me.cosTable[(16) as usize] = 1024;
    me.cosTable[(17) as usize] = 569;
    me.cosTable[(18) as usize] = -392;
    me.cosTable[(19) as usize] = -1004;
    me.cosTable[(20) as usize] = -724;
    me.cosTable[(21) as usize] = 200;
    me.cosTable[(22) as usize] = 946;
    me.cosTable[(23) as usize] = 851;
    me.cosTable[(24) as usize] = 1024;
    me.cosTable[(25) as usize] = 200;
    me.cosTable[(26) as usize] = -946;
    me.cosTable[(27) as usize] = -569;
    me.cosTable[(28) as usize] = 724;
    me.cosTable[(29) as usize] = 851;
    me.cosTable[(30) as usize] = -392;
    me.cosTable[(31) as usize] = -1004;
    me.cosTable[(32) as usize] = 1024;
    me.cosTable[(33) as usize] = -200;
    me.cosTable[(34) as usize] = -946;
    me.cosTable[(35) as usize] = 569;
    me.cosTable[(36) as usize] = 724;
    me.cosTable[(37) as usize] = -851;
    me.cosTable[(38) as usize] = -392;
    me.cosTable[(39) as usize] = 1004;
    me.cosTable[(40) as usize] = 1024;
    me.cosTable[(41) as usize] = -569;
    me.cosTable[(42) as usize] = -392;
    me.cosTable[(43) as usize] = 1004;
    me.cosTable[(44) as usize] = -724;
    me.cosTable[(45) as usize] = -200;
    me.cosTable[(46) as usize] = 946;
    me.cosTable[(47) as usize] = -851;
    me.cosTable[(48) as usize] = 1024;
    me.cosTable[(49) as usize] = -851;
    me.cosTable[(50) as usize] = 392;
    me.cosTable[(51) as usize] = 200;
    me.cosTable[(52) as usize] = -724;
    me.cosTable[(53) as usize] = 1004;
    me.cosTable[(54) as usize] = -946;
    me.cosTable[(55) as usize] = 569;
    me.cosTable[(56) as usize] = 1024;
    me.cosTable[(57) as usize] = -1004;
    me.cosTable[(58) as usize] = 946;
    me.cosTable[(59) as usize] = -851;
    me.cosTable[(60) as usize] = 724;
    me.cosTable[(61) as usize] = -569;
    me.cosTable[(62) as usize] = 392;
    me.cosTable[(63) as usize] = -200;
    me.zigzagMap[(0) as usize] = 0;
    me.zigzagMap[(1) as usize] = 1;
    me.zigzagMap[(2) as usize] = 8;
    me.zigzagMap[(3) as usize] = 16;
    me.zigzagMap[(4) as usize] = 9;
    me.zigzagMap[(5) as usize] = 2;
    me.zigzagMap[(6) as usize] = 3;
    me.zigzagMap[(7) as usize] = 10;
    me.zigzagMap[(8) as usize] = 17;
    me.zigzagMap[(9) as usize] = 24;
    me.zigzagMap[(10) as usize] = 32;
    me.zigzagMap[(11) as usize] = 25;
    me.zigzagMap[(12) as usize] = 18;
    me.zigzagMap[(13) as usize] = 11;
    me.zigzagMap[(14) as usize] = 4;
    me.zigzagMap[(15) as usize] = 5;
    me.zigzagMap[(16) as usize] = 12;
    me.zigzagMap[(17) as usize] = 19;
    me.zigzagMap[(18) as usize] = 26;
    me.zigzagMap[(19) as usize] = 33;
    me.zigzagMap[(20) as usize] = 40;
    me.zigzagMap[(21) as usize] = 48;
    me.zigzagMap[(22) as usize] = 41;
    me.zigzagMap[(23) as usize] = 34;
    me.zigzagMap[(24) as usize] = 27;
    me.zigzagMap[(25) as usize] = 20;
    me.zigzagMap[(26) as usize] = 13;
    me.zigzagMap[(27) as usize] = 6;
    me.zigzagMap[(28) as usize] = 7;
    me.zigzagMap[(29) as usize] = 14;
    me.zigzagMap[(30) as usize] = 21;
    me.zigzagMap[(31) as usize] = 28;
    me.zigzagMap[(32) as usize] = 35;
    me.zigzagMap[(33) as usize] = 42;
    me.zigzagMap[(34) as usize] = 49;
    me.zigzagMap[(35) as usize] = 56;
    me.zigzagMap[(36) as usize] = 57;
    me.zigzagMap[(37) as usize] = 50;
    me.zigzagMap[(38) as usize] = 43;
    me.zigzagMap[(39) as usize] = 36;
    me.zigzagMap[(40) as usize] = 29;
    me.zigzagMap[(41) as usize] = 22;
    me.zigzagMap[(42) as usize] = 15;
    me.zigzagMap[(43) as usize] = 23;
    me.zigzagMap[(44) as usize] = 30;
    me.zigzagMap[(45) as usize] = 37;
    me.zigzagMap[(46) as usize] = 44;
    me.zigzagMap[(47) as usize] = 51;
    me.zigzagMap[(48) as usize] = 58;
    me.zigzagMap[(49) as usize] = 59;
    me.zigzagMap[(50) as usize] = 52;
    me.zigzagMap[(51) as usize] = 45;
    me.zigzagMap[(52) as usize] = 38;
    me.zigzagMap[(53) as usize] = 31;
    me.zigzagMap[(54) as usize] = 39;
    me.zigzagMap[(55) as usize] = 46;
    me.zigzagMap[(56) as usize] = 53;
    me.zigzagMap[(57) as usize] = 60;
    me.zigzagMap[(58) as usize] = 61;
    me.zigzagMap[(59) as usize] = 54;
    me.zigzagMap[(60) as usize] = 47;
    me.zigzagMap[(61) as usize] = 55;
    me.zigzagMap[(62) as usize] = 62;
    me.zigzagMap[(63) as usize] = 63;
    return me;
  }
  fn dezigzag(&mut self, zigzag : &Vec<i64>) -> Vec<i64> {
    let mut block : Vec<i64> = vec![0i64; 64 as usize];
    let mut i : i64 = 0;
    while i < 64 {
      let pos : i64 = self.zigzagMap[(i) as usize];
      let val : i64 = zigzag[(i) as usize];
      block[(pos) as usize] = val;
      i = i + 1;
    };
    return block;
  }
  fn idct1d(&mut self, input : &Vec<i64>, startIdx : i64, stride : i64, mut output : &mut Vec<i64>, outIdx : i64, outStride : i64) -> () {
    let mut x : i64 = 0;
    while x < 8 {
      let mut sum : i64 = 0;
      let mut u : i64 = 0;
      while u < 8 {
        let coeff : i64 = input[((startIdx + (u * stride))) as usize];
        if  coeff != 0 {
          let cosVal : i64 = self.cosTable[(((x * 8) + u)) as usize];
          let mut contrib : i64 = coeff * cosVal;
          if  u == 0 {
            contrib = (((contrib * 724)) >> (10));
          }
          sum = sum + contrib;
        }
        u = u + 1;
      };
      output[(outIdx + (x * outStride)) as usize] = ((sum) >> (11));
      x = x + 1;
    };
  }
  fn transform(&mut self, block : &Vec<i64>, mut output : &mut Vec<i64>) -> () {
    let mut temp : Vec<i64> = vec![0i64; 64 as usize];
    let mut row : i64 = 0;
    while row < 8 {
      let rowStart : i64 = row * 8;
      self.idct1d(&block, rowStart, 1, &mut temp, rowStart, 1);
      row = row + 1;
    };
    let mut col : i64 = 0;
    while col < 8 {
      self.idct1d(&temp, col, 8, &mut output, col, 8);
      col = col + 1;
    };
    let mut i : i64 = 0;
    while i < 64 {
      let mut val : i64 = (output[(i) as usize]) + 128;
      if  val < 0 {
        val = 0;
      }
      if  val > 255 {
        val = 255;
      }
      output[(i) as usize] = val;
      i = i + 1;
    };
  }
  fn transformFast(&mut self, coeffs : &Vec<i64>, mut output : &mut Vec<i64>) -> () {
    self.transform(&coeffs, &mut output);
  }
}
#[derive(Clone)]
struct Color { 
  r : i64, 
  g : i64, 
  b : i64, 
  a : i64, 
}
impl Color { 
  
  pub fn new() ->  Color {
    let mut me = Color { 
      r:0, 
      g:0, 
      b:0, 
      a:255, 
    };
    return me;
  }
  fn setRGB(&mut self, red : i64, green : i64, blue : i64) -> () {
    self.r = red;
    self.g = green;
    self.b = blue;
    self.a = 255;
  }
  fn setRGBA(&mut self, red : i64, green : i64, blue : i64, alpha : i64) -> () {
    self.r = red;
    self.g = green;
    self.b = blue;
    self.a = alpha;
  }
  fn clamp(val : i64) -> i64 {
    if  val < 0 {
      return 0;
    }
    if  val > 255 {
      return 255;
    }
    return val;
  }
  fn set(&mut self, red : i64, green : i64, blue : i64) -> () {
    self.r = Color::clamp(red);
    self.g = Color::clamp(green);
    self.b = Color::clamp(blue);
  }
  fn grayscale(&mut self, ) -> i64 {
    return (((((self.r * 77) + (self.g * 150)) + (self.b * 29))) >> (8));
  }
  fn toGrayscale(&mut self, ) -> () {
    let gray : i64 = self.grayscale();
    self.r = gray;
    self.g = gray;
    self.b = gray;
  }
  fn invert(&mut self, ) -> () {
    self.r = 255 - self.r;
    self.g = 255 - self.g;
    self.b = 255 - self.b;
  }
  fn adjustBrightness(&mut self, amount : i64) -> () {
    self.r = Color::clamp((self.r + amount));
    self.g = Color::clamp((self.g + amount));
    self.b = Color::clamp((self.b + amount));
  }
}
#[derive(Clone)]
struct ImageBuffer { 
  width : i64, 
  height : i64, 
  pixels : Vec<u8>, 
}
impl ImageBuffer { 
  
  pub fn new() ->  ImageBuffer {
    let mut me = ImageBuffer { 
      width:0, 
      height:0, 
      pixels:vec![0u8; 0 as usize], 
    };
    return me;
  }
  fn init(&mut self, w : i64, h : i64) -> () {
    self.width = w;
    self.height = h;
    let size : i64 = (w * h) * 4;
    self.pixels = vec![0u8; size as usize];
    self.fill(255, 255, 255, 255);
  }
  fn getPixelOffset(&mut self, x : i64, y : i64) -> i64 {
    return ((y * self.width) + x) * 4;
  }
  fn isValidCoord(&mut self, x : i64, y : i64) -> bool {
    if  x < 0 {
      return false;
    }
    if  y < 0 {
      return false;
    }
    if  x >= self.width {
      return false;
    }
    if  y >= self.height {
      return false;
    }
    return true;
  }
  fn getPixel(&mut self, x : i64, y : i64) -> Color {
    let mut c : Color = Color::new();
    if  self.isValidCoord(x, y) {
      let off : i64 = self.getPixelOffset(x, y);
      c.r = self.pixels[(off) as usize] as i64;
      c.g = self.pixels[((off + 1)) as usize] as i64;
      c.b = self.pixels[((off + 2)) as usize] as i64;
      c.a = self.pixels[((off + 3)) as usize] as i64;
    }
    return c.clone();
  }
  fn setPixel(&mut self, x : i64, y : i64, mut c : Color) -> () {
    if  self.isValidCoord(x, y) {
      let off : i64 = self.getPixelOffset(x, y);
      self.pixels[(off) as usize] = c.r as u8;
      self.pixels[(off + 1) as usize] = c.g as u8;
      self.pixels[(off + 2) as usize] = c.b as u8;
      self.pixels[(off + 3) as usize] = c.a as u8;
    }
  }
  fn setPixelRGB(&mut self, x : i64, y : i64, r : i64, g : i64, b : i64) -> () {
    if  self.isValidCoord(x, y) {
      let off : i64 = self.getPixelOffset(x, y);
      self.pixels[(off) as usize] = r as u8;
      self.pixels[(off + 1) as usize] = g as u8;
      self.pixels[(off + 2) as usize] = b as u8;
      self.pixels[(off + 3) as usize] = 255 as u8;
    }
  }
  fn fill(&mut self, r : i64, g : i64, b : i64, a : i64) -> () {
    let size : i64 = (self.width * self.height) * 4;
    let mut i : i64 = 0;
    while i < size {
      self.pixels[(i) as usize] = r as u8;
      self.pixels[(i + 1) as usize] = g as u8;
      self.pixels[(i + 2) as usize] = b as u8;
      self.pixels[(i + 3) as usize] = a as u8;
      i = i + 4;
    };
  }
  fn fillRect(&mut self, x : i64, y : i64, w : i64, h : i64, mut c : Color) -> () {
    let endX : i64 = x + w;
    let endY : i64 = y + h;
    let mut py : i64 = y;
    while py < endY {
      let mut px : i64 = x;
      while px < endX {
        self.setPixel(px, py, c.clone());
        px = px + 1;
      };
      py = py + 1;
    };
  }
  fn invert(&mut self, ) -> () {
    let size : i64 = self.width * self.height;
    let mut i : i64 = 0;
    while i < size {
      let off : i64 = i * 4;
      let r : i64 = self.pixels[(off) as usize] as i64;
      let g : i64 = self.pixels[((off + 1)) as usize] as i64;
      let b : i64 = self.pixels[((off + 2)) as usize] as i64;
      self.pixels[(off) as usize] = 255 - r as u8;
      self.pixels[(off + 1) as usize] = 255 - g as u8;
      self.pixels[(off + 2) as usize] = 255 - b as u8;
      i = i + 1;
    };
  }
  fn grayscale(&mut self, ) -> () {
    let size : i64 = self.width * self.height;
    let mut i : i64 = 0;
    while i < size {
      let off : i64 = i * 4;
      let r : i64 = self.pixels[(off) as usize] as i64;
      let g : i64 = self.pixels[((off + 1)) as usize] as i64;
      let b : i64 = self.pixels[((off + 2)) as usize] as i64;
      let gray : i64 = (((((r * 77) + (g * 150)) + (b * 29))) >> (8));
      self.pixels[(off) as usize] = gray as u8;
      self.pixels[(off + 1) as usize] = gray as u8;
      self.pixels[(off + 2) as usize] = gray as u8;
      i = i + 1;
    };
  }
  fn adjustBrightness(&mut self, amount : i64) -> () {
    let size : i64 = self.width * self.height;
    let mut i : i64 = 0;
    while i < size {
      let off : i64 = i * 4;
      let mut r : i64 = self.pixels[(off) as usize] as i64;
      let mut g : i64 = self.pixels[((off + 1)) as usize] as i64;
      let mut b : i64 = self.pixels[((off + 2)) as usize] as i64;
      r = r + amount;
      g = g + amount;
      b = b + amount;
      if  r < 0 {
        r = 0;
      }
      if  r > 255 {
        r = 255;
      }
      if  g < 0 {
        g = 0;
      }
      if  g > 255 {
        g = 255;
      }
      if  b < 0 {
        b = 0;
      }
      if  b > 255 {
        b = 255;
      }
      self.pixels[(off) as usize] = r as u8;
      self.pixels[(off + 1) as usize] = g as u8;
      self.pixels[(off + 2) as usize] = b as u8;
      i = i + 1;
    };
  }
  fn threshold(&mut self, level : i64) -> () {
    let size : i64 = self.width * self.height;
    let mut i : i64 = 0;
    while i < size {
      let off : i64 = i * 4;
      let r : i64 = self.pixels[(off) as usize] as i64;
      let g : i64 = self.pixels[((off + 1)) as usize] as i64;
      let b : i64 = self.pixels[((off + 2)) as usize] as i64;
      let gray : i64 = (((((r * 77) + (g * 150)) + (b * 29))) >> (8));
      let mut val : i64 = 0;
      if  gray >= level {
        val = 255;
      }
      self.pixels[(off) as usize] = val as u8;
      self.pixels[(off + 1) as usize] = val as u8;
      self.pixels[(off + 2) as usize] = val as u8;
      i = i + 1;
    };
  }
  fn sepia(&mut self, ) -> () {
    let size : i64 = self.width * self.height;
    let mut i : i64 = 0;
    while i < size {
      let off : i64 = i * 4;
      let r : i64 = self.pixels[(off) as usize] as i64;
      let g : i64 = self.pixels[((off + 1)) as usize] as i64;
      let b : i64 = self.pixels[((off + 2)) as usize] as i64;
      let mut newR : i64 = (((((r * 101) + (g * 197)) + (b * 48))) >> (8));
      let mut newG : i64 = (((((r * 89) + (g * 175)) + (b * 43))) >> (8));
      let mut newB : i64 = (((((r * 70) + (g * 137)) + (b * 33))) >> (8));
      if  newR > 255 {
        newR = 255;
      }
      if  newG > 255 {
        newG = 255;
      }
      if  newB > 255 {
        newB = 255;
      }
      self.pixels[(off) as usize] = newR as u8;
      self.pixels[(off + 1) as usize] = newG as u8;
      self.pixels[(off + 2) as usize] = newB as u8;
      i = i + 1;
    };
  }
  fn flipHorizontal(&mut self, ) -> () {
    let mut y : i64 = 0;
    while y < self.height {
      let mut x : i64 = 0;
      let halfW : i64 = ((self.width) >> (1));
      while x < halfW {
        let x2 : i64 = (self.width - 1) - x;
        let off1 : i64 = self.getPixelOffset(x, y);
        let off2 : i64 = self.getPixelOffset(x2, y);
        let r1 : i64 = self.pixels[(off1) as usize] as i64;
        let g1 : i64 = self.pixels[((off1 + 1)) as usize] as i64;
        let b1 : i64 = self.pixels[((off1 + 2)) as usize] as i64;
        let a1 : i64 = self.pixels[((off1 + 3)) as usize] as i64;
        let r2 : i64 = self.pixels[(off2) as usize] as i64;
        let g2 : i64 = self.pixels[((off2 + 1)) as usize] as i64;
        let b2 : i64 = self.pixels[((off2 + 2)) as usize] as i64;
        let a2 : i64 = self.pixels[((off2 + 3)) as usize] as i64;
        self.pixels[(off1) as usize] = r2 as u8;
        self.pixels[(off1 + 1) as usize] = g2 as u8;
        self.pixels[(off1 + 2) as usize] = b2 as u8;
        self.pixels[(off1 + 3) as usize] = a2 as u8;
        self.pixels[(off2) as usize] = r1 as u8;
        self.pixels[(off2 + 1) as usize] = g1 as u8;
        self.pixels[(off2 + 2) as usize] = b1 as u8;
        self.pixels[(off2 + 3) as usize] = a1 as u8;
        x = x + 1;
      };
      y = y + 1;
    };
  }
  fn flipVertical(&mut self, ) -> () {
    let mut y : i64 = 0;
    let halfH : i64 = ((self.height) >> (1));
    while y < halfH {
      let y2 : i64 = (self.height - 1) - y;
      let mut x : i64 = 0;
      while x < self.width {
        let off1 : i64 = self.getPixelOffset(x, y);
        let off2 : i64 = self.getPixelOffset(x, y2);
        let r1 : i64 = self.pixels[(off1) as usize] as i64;
        let g1 : i64 = self.pixels[((off1 + 1)) as usize] as i64;
        let b1 : i64 = self.pixels[((off1 + 2)) as usize] as i64;
        let a1 : i64 = self.pixels[((off1 + 3)) as usize] as i64;
        let r2 : i64 = self.pixels[(off2) as usize] as i64;
        let g2 : i64 = self.pixels[((off2 + 1)) as usize] as i64;
        let b2 : i64 = self.pixels[((off2 + 2)) as usize] as i64;
        let a2 : i64 = self.pixels[((off2 + 3)) as usize] as i64;
        self.pixels[(off1) as usize] = r2 as u8;
        self.pixels[(off1 + 1) as usize] = g2 as u8;
        self.pixels[(off1 + 2) as usize] = b2 as u8;
        self.pixels[(off1 + 3) as usize] = a2 as u8;
        self.pixels[(off2) as usize] = r1 as u8;
        self.pixels[(off2 + 1) as usize] = g1 as u8;
        self.pixels[(off2 + 2) as usize] = b1 as u8;
        self.pixels[(off2 + 3) as usize] = a1 as u8;
        x = x + 1;
      };
      y = y + 1;
    };
  }
  fn drawLine(&mut self, x1 : i64, y1 : i64, x2 : i64, y2 : i64, mut c : Color) -> () {
    let mut dx : i64 = x2 - x1;
    let mut dy : i64 = y2 - y1;
    if  dx < 0 {
      dx = 0 - dx;
    }
    if  dy < 0 {
      dy = 0 - dy;
    }
    let mut sx : i64 = 1;
    if  x1 > x2 {
      sx = -1;
    }
    let mut sy : i64 = 1;
    if  y1 > y2 {
      sy = -1;
    }
    let mut err : i64 = dx - dy;
    let mut x : i64 = x1;
    let mut y : i64 = y1;
    let mut done : bool = false;
    while done == false {
      self.setPixel(x, y, c.clone());
      if  (x == x2) && (y == y2) {
        done = true;
      } else {
        let e2 : i64 = err * 2;
        if  e2 > (0 - dy) {
          err = err - dy;
          x = x + sx;
        }
        if  e2 < dx {
          err = err + dx;
          y = y + sy;
        }
      }
    };
  }
  fn drawRect(&mut self, x : i64, y : i64, w : i64, h : i64, mut c : Color) -> () {
    self.drawLine(x, y, (x + w) - 1, y, c.clone());
    self.drawLine((x + w) - 1, y, (x + w) - 1, (y + h) - 1, c.clone());
    self.drawLine((x + w) - 1, (y + h) - 1, x, (y + h) - 1, c.clone());
    self.drawLine(x, (y + h) - 1, x, y, c.clone());
  }
  fn scale(&mut self, factor : i64) -> ImageBuffer {
    let newW : i64 = self.width * factor;
    let newH : i64 = self.height * factor;
    return self.scaleToSize(newW, newH).clone();
  }
  fn scaleToSize(&mut self, newW : i64, newH : i64) -> ImageBuffer {
    let mut result : ImageBuffer = ImageBuffer::new();
    result.init(newW, newH);
    let scaleX : f64 = ((self.width as f64)) / ((newW as f64));
    let scaleY : f64 = ((self.height as f64)) / ((newH as f64));
    let mut destY : i64 = 0;
    while destY < newH {
      let srcYf : f64 = ((destY as f64)) * scaleY;
      let srcY0 : i64 = srcYf as i64 ;
      let mut srcY1 : i64 = srcY0 + 1;
      if  srcY1 >= self.height {
        srcY1 = self.height - 1;
      }
      let fy : f64 = srcYf - ((srcY0 as f64));
      let mut destX : i64 = 0;
      while destX < newW {
        let srcXf : f64 = ((destX as f64)) * scaleX;
        let srcX0 : i64 = srcXf as i64 ;
        let mut srcX1 : i64 = srcX0 + 1;
        if  srcX1 >= self.width {
          srcX1 = self.width - 1;
        }
        let fx : f64 = srcXf - ((srcX0 as f64));
        let off00 : i64 = ((srcY0 * self.width) + srcX0) * 4;
        let off01 : i64 = ((srcY0 * self.width) + srcX1) * 4;
        let off10 : i64 = ((srcY1 * self.width) + srcX0) * 4;
        let off11 : i64 = ((srcY1 * self.width) + srcX1) * 4;
        let r : i64 = ImageBuffer::bilinear((self.pixels[(off00) as usize] as i64), (self.pixels[(off01) as usize] as i64), (self.pixels[(off10) as usize] as i64), (self.pixels[(off11) as usize] as i64), fx, fy);
        let g : i64 = ImageBuffer::bilinear((self.pixels[((off00 + 1)) as usize] as i64), (self.pixels[((off01 + 1)) as usize] as i64), (self.pixels[((off10 + 1)) as usize] as i64), (self.pixels[((off11 + 1)) as usize] as i64), fx, fy);
        let b : i64 = ImageBuffer::bilinear((self.pixels[((off00 + 2)) as usize] as i64), (self.pixels[((off01 + 2)) as usize] as i64), (self.pixels[((off10 + 2)) as usize] as i64), (self.pixels[((off11 + 2)) as usize] as i64), fx, fy);
        let a : i64 = ImageBuffer::bilinear((self.pixels[((off00 + 3)) as usize] as i64), (self.pixels[((off01 + 3)) as usize] as i64), (self.pixels[((off10 + 3)) as usize] as i64), (self.pixels[((off11 + 3)) as usize] as i64), fx, fy);
        let destOff : i64 = ((destY * newW) + destX) * 4;
        result.pixels[(destOff) as usize] = r as u8;
        result.pixels[(destOff + 1) as usize] = g as u8;
        result.pixels[(destOff + 2) as usize] = b as u8;
        result.pixels[(destOff + 3) as usize] = a as u8;
        destX = destX + 1;
      };
      destY = destY + 1;
    };
    return result.clone();
  }
  fn bilinear(v00 : i64, v01 : i64, v10 : i64, v11 : i64, fx : f64, fy : f64) -> i64 {
    let top : f64 = (((v00 as f64)) * (1_f64 - fx)) + (((v01 as f64)) * fx);
    let bottom : f64 = (((v10 as f64)) * (1_f64 - fx)) + (((v11 as f64)) * fx);
    let result : f64 = (top * (1_f64 - fy)) + (bottom * fy);
    return result as i64 ;
  }
  fn rotate90CW(&mut self, ) -> ImageBuffer {
    let mut result : ImageBuffer = ImageBuffer::new();
    result.init(self.height, self.width);
    let mut y : i64 = 0;
    while y < self.height {
      let mut x : i64 = 0;
      while x < self.width {
        let newX : i64 = (self.height - 1) - y;
        let newY : i64 = x;
        let srcOff : i64 = ((y * self.width) + x) * 4;
        let destOff : i64 = ((newY * self.height) + newX) * 4;
        result.pixels[(destOff) as usize] = self.pixels[(srcOff) as usize] as i64 as u8;
        result.pixels[(destOff + 1) as usize] = self.pixels[((srcOff + 1)) as usize] as i64 as u8;
        result.pixels[(destOff + 2) as usize] = self.pixels[((srcOff + 2)) as usize] as i64 as u8;
        result.pixels[(destOff + 3) as usize] = self.pixels[((srcOff + 3)) as usize] as i64 as u8;
        x = x + 1;
      };
      y = y + 1;
    };
    return result.clone();
  }
  fn rotate180(&mut self, ) -> ImageBuffer {
    let mut result : ImageBuffer = ImageBuffer::new();
    result.init(self.width, self.height);
    let mut y : i64 = 0;
    while y < self.height {
      let mut x : i64 = 0;
      while x < self.width {
        let newX : i64 = (self.width - 1) - x;
        let newY : i64 = (self.height - 1) - y;
        let srcOff : i64 = ((y * self.width) + x) * 4;
        let destOff : i64 = ((newY * self.width) + newX) * 4;
        result.pixels[(destOff) as usize] = self.pixels[(srcOff) as usize] as i64 as u8;
        result.pixels[(destOff + 1) as usize] = self.pixels[((srcOff + 1)) as usize] as i64 as u8;
        result.pixels[(destOff + 2) as usize] = self.pixels[((srcOff + 2)) as usize] as i64 as u8;
        result.pixels[(destOff + 3) as usize] = self.pixels[((srcOff + 3)) as usize] as i64 as u8;
        x = x + 1;
      };
      y = y + 1;
    };
    return result.clone();
  }
  fn rotate270CW(&mut self, ) -> ImageBuffer {
    let mut result : ImageBuffer = ImageBuffer::new();
    result.init(self.height, self.width);
    let mut y : i64 = 0;
    while y < self.height {
      let mut x : i64 = 0;
      while x < self.width {
        let newX : i64 = y;
        let newY : i64 = (self.width - 1) - x;
        let srcOff : i64 = ((y * self.width) + x) * 4;
        let destOff : i64 = ((newY * self.height) + newX) * 4;
        result.pixels[(destOff) as usize] = self.pixels[(srcOff) as usize] as i64 as u8;
        result.pixels[(destOff + 1) as usize] = self.pixels[((srcOff + 1)) as usize] as i64 as u8;
        result.pixels[(destOff + 2) as usize] = self.pixels[((srcOff + 2)) as usize] as i64 as u8;
        result.pixels[(destOff + 3) as usize] = self.pixels[((srcOff + 3)) as usize] as i64 as u8;
        x = x + 1;
      };
      y = y + 1;
    };
    return result.clone();
  }
  fn transpose(&mut self, ) -> ImageBuffer {
    let mut result : ImageBuffer = ImageBuffer::new();
    result.init(self.height, self.width);
    let mut y : i64 = 0;
    while y < self.height {
      let mut x : i64 = 0;
      while x < self.width {
        let srcOff : i64 = ((y * self.width) + x) * 4;
        let destOff : i64 = ((x * self.height) + y) * 4;
        result.pixels[(destOff) as usize] = self.pixels[(srcOff) as usize] as i64 as u8;
        result.pixels[(destOff + 1) as usize] = self.pixels[((srcOff + 1)) as usize] as i64 as u8;
        result.pixels[(destOff + 2) as usize] = self.pixels[((srcOff + 2)) as usize] as i64 as u8;
        result.pixels[(destOff + 3) as usize] = self.pixels[((srcOff + 3)) as usize] as i64 as u8;
        x = x + 1;
      };
      y = y + 1;
    };
    return result.clone();
  }
  fn transverse(&mut self, ) -> ImageBuffer {
    let mut result : ImageBuffer = ImageBuffer::new();
    result.init(self.height, self.width);
    let mut y : i64 = 0;
    while y < self.height {
      let mut x : i64 = 0;
      while x < self.width {
        let newX : i64 = (self.height - 1) - y;
        let newY : i64 = (self.width - 1) - x;
        let srcOff : i64 = ((y * self.width) + x) * 4;
        let destOff : i64 = ((newY * self.height) + newX) * 4;
        result.pixels[(destOff) as usize] = self.pixels[(srcOff) as usize] as i64 as u8;
        result.pixels[(destOff + 1) as usize] = self.pixels[((srcOff + 1)) as usize] as i64 as u8;
        result.pixels[(destOff + 2) as usize] = self.pixels[((srcOff + 2)) as usize] as i64 as u8;
        result.pixels[(destOff + 3) as usize] = self.pixels[((srcOff + 3)) as usize] as i64 as u8;
        x = x + 1;
      };
      y = y + 1;
    };
    return result.clone();
  }
  fn applyExifOrientation(&mut self, orientation : i64) -> ImageBuffer {
    if  orientation == 1 {
      return self.scale(1).clone();
    }
    if  orientation == 2 {
      let mut result : ImageBuffer = ImageBuffer::new();
      result.init(self.width, self.height);
      let mut y : i64 = 0;
      while y < self.height {
        let mut x : i64 = 0;
        while x < self.width {
          let srcOff : i64 = ((y * self.width) + x) * 4;
          let destOff : i64 = ((y * self.width) + ((self.width - 1) - x)) * 4;
          result.pixels[(destOff) as usize] = self.pixels[(srcOff) as usize] as i64 as u8;
          result.pixels[(destOff + 1) as usize] = self.pixels[((srcOff + 1)) as usize] as i64 as u8;
          result.pixels[(destOff + 2) as usize] = self.pixels[((srcOff + 2)) as usize] as i64 as u8;
          result.pixels[(destOff + 3) as usize] = self.pixels[((srcOff + 3)) as usize] as i64 as u8;
          x = x + 1;
        };
        y = y + 1;
      };
      return result.clone();
    }
    if  orientation == 3 {
      return self.rotate180().clone();
    }
    if  orientation == 4 {
      let mut result_1 : ImageBuffer = ImageBuffer::new();
      result_1.init(self.width, self.height);
      let mut y_1 : i64 = 0;
      while y_1 < self.height {
        let mut x_1 : i64 = 0;
        while x_1 < self.width {
          let srcOff_1 : i64 = ((y_1 * self.width) + x_1) * 4;
          let destOff_1 : i64 = ((((self.height - 1) - y_1) * self.width) + x_1) * 4;
          result_1.pixels[(destOff_1) as usize] = self.pixels[(srcOff_1) as usize] as i64 as u8;
          result_1.pixels[(destOff_1 + 1) as usize] = self.pixels[((srcOff_1 + 1)) as usize] as i64 as u8;
          result_1.pixels[(destOff_1 + 2) as usize] = self.pixels[((srcOff_1 + 2)) as usize] as i64 as u8;
          result_1.pixels[(destOff_1 + 3) as usize] = self.pixels[((srcOff_1 + 3)) as usize] as i64 as u8;
          x_1 = x_1 + 1;
        };
        y_1 = y_1 + 1;
      };
      return result_1.clone();
    }
    if  orientation == 5 {
      return self.transpose().clone();
    }
    if  orientation == 6 {
      return self.rotate90CW().clone();
    }
    if  orientation == 7 {
      return self.transverse().clone();
    }
    if  orientation == 8 {
      return self.rotate270CW().clone();
    }
    return self.scale(1).clone();
  }
}
#[derive(Clone)]
struct PPMImage { 
}
impl PPMImage { 
  
  pub fn new() ->  PPMImage {
    let mut me = PPMImage { 
    };
    return me;
  }
  fn parseNumber(data : &Vec<u8>, startPos : i64, mut endPos : &mut Vec<i64>) -> i64 {
    let __len : i64 = data.len() as i64;
    let mut pos : i64 = startPos;
    let mut skipping : bool = true;
    while skipping && (pos < __len) {
      let ch : i64 = data[(pos) as usize] as i64;
      if  (((ch == 32) || (ch == 10)) || (ch == 13)) || (ch == 9) {
        pos = pos + 1;
      } else {
        skipping = false;
      }
    };
    let mut value : i64 = 0;
    let mut parsing : bool = true;
    while parsing && (pos < __len) {
      let ch_1 : i64 = data[(pos) as usize] as i64;
      if  (ch_1 >= 48) && (ch_1 <= 57) {
        value = (value * 10) + (ch_1 - 48);
        pos = pos + 1;
      } else {
        parsing = false;
      }
    };
    endPos[0 as usize] = pos;
    return value;
  }
  fn skipToNextLine(data : &Vec<u8>, mut pos : i64) -> i64 {
    let __len : i64 = data.len() as i64;
    while pos < __len {
      let ch : i64 = data[(pos) as usize] as i64;
      pos = pos + 1;
      if  ch == 10 {
        return pos;
      }
    };
    return pos;
  }
  fn load(&mut self, dirPath : String, fileName : String) -> ImageBuffer {
    let mut data : Vec<u8> = std::fs::read(format!("{}/{}", dirPath, fileName)).unwrap_or_default();
    let __len : i64 = data.len() as i64;
    if  __len < 10 {
      println!( "{}", [&*"Error: File too small: ".to_string(), &*fileName].concat() );
      let mut errImg : ImageBuffer = ImageBuffer::new();
      errImg.init(1, 1);
      return errImg.clone();
    }
    let m1 : i64 = data[(0) as usize] as i64;
    let m2 : i64 = data[(1) as usize] as i64;
    if  (m1 != 80) || ((m2 != 54) && (m2 != 51)) {
      println!( "{}", [&*"Error: Not a PPM file (P3 or P6): ".to_string(), &*fileName].concat() );
      let mut errImg_1 : ImageBuffer = ImageBuffer::new();
      errImg_1.init(1, 1);
      return errImg_1.clone();
    }
    let isBinary : bool = m2 == 54;
    let mut pos : i64 = 2;
    let mut endPos : Vec<i64> = Vec::new();
    endPos.push(0);
    let mut skippingComments : bool = true;
    while skippingComments && (pos < __len) {
      let ch : i64 = data[(pos) as usize] as i64;
      if  (((ch == 32) || (ch == 10)) || (ch == 13)) || (ch == 9) {
        pos = pos + 1;
      } else {
        if  ch == 35 {
          pos = PPMImage::skipToNextLine(&data, pos);
        } else {
          skippingComments = false;
        }
      }
    };
    let width : i64 = PPMImage::parseNumber(&data, pos, &mut endPos);
    pos = endPos[0 as usize].clone();
    let height : i64 = PPMImage::parseNumber(&data, pos, &mut endPos);
    pos = endPos[0 as usize].clone();
    let maxVal : i64 = PPMImage::parseNumber(&data, pos, &mut endPos);
    pos = endPos[0 as usize].clone();
    if  pos < __len {
      pos = pos + 1;
    }
    println!( "{}", [&*([&*([&*([&*([&*"Loading PPM: ".to_string(), &*(width.to_string())].concat()), &*"x".to_string()].concat()), &*(height.to_string())].concat()), &*", maxval=".to_string()].concat()), &*(maxVal.to_string())].concat() );
    let mut img : ImageBuffer = ImageBuffer::new();
    img.init(width, height);
    if  isBinary {
      let mut y : i64 = 0;
      while y < height {
        let mut x : i64 = 0;
        while x < width {
          if  (pos + 2) < __len {
            let r : i64 = data[(pos) as usize] as i64;
            let g : i64 = data[((pos + 1)) as usize] as i64;
            let b : i64 = data[((pos + 2)) as usize] as i64;
            img.setPixelRGB(x, y, r, g, b);
            pos = pos + 3;
          }
          x = x + 1;
        };
        y = y + 1;
      };
    } else {
      let mut y_1 : i64 = 0;
      while y_1 < height {
        let mut x_1 : i64 = 0;
        while x_1 < width {
          let r_1 : i64 = PPMImage::parseNumber(&data, pos, &mut endPos);
          pos = endPos[0 as usize].clone();
          let g_1 : i64 = PPMImage::parseNumber(&data, pos, &mut endPos);
          pos = endPos[0 as usize].clone();
          let b_1 : i64 = PPMImage::parseNumber(&data, pos, &mut endPos);
          pos = endPos[0 as usize].clone();
          img.setPixelRGB(x_1, y_1, r_1, g_1, b_1);
          x_1 = x_1 + 1;
        };
        y_1 = y_1 + 1;
      };
    }
    return img.clone();
  }
  fn save(&mut self, mut img : &mut ImageBuffer, dirPath : String, fileName : String) -> () {
    let mut buf : GrowableBuffer = GrowableBuffer::new();
    buf.writeString("P6\n".to_string());
    buf.writeString([&*([&*([&*(img.width.to_string()), &*" ".to_string()].concat()), &*(img.height.to_string())].concat()), &*"\n".to_string()].concat());
    buf.writeString("255\n".to_string());
    let mut y : i64 = 0;
    while y < img.height {
      let mut x : i64 = 0;
      while x < img.width {
        let mut c : Color = img.getPixel(x, y);
        buf.writeByte(c.r);
        buf.writeByte(c.g);
        buf.writeByte(c.b);
        x = x + 1;
      };
      y = y + 1;
    };
    let mut data : Vec<u8> = buf.toBuffer();
    std::fs::write(format!("{}/{}", dirPath, fileName), &data).unwrap();
    println!( "{}", [&*([&*([&*"Saved PPM: ".to_string(), &*dirPath].concat()), &*"/".to_string()].concat()), &*fileName].concat() );
  }
  fn saveP3(&mut self, mut img : &mut ImageBuffer, dirPath : String, fileName : String) -> () {
    let mut buf : GrowableBuffer = GrowableBuffer::new();
    buf.writeString("P3\n".to_string());
    buf.writeString("# Created by Ranger ImageEditor\n".to_string());
    buf.writeString([&*([&*([&*(img.width.to_string()), &*" ".to_string()].concat()), &*(img.height.to_string())].concat()), &*"\n".to_string()].concat());
    buf.writeString("255\n".to_string());
    let mut y : i64 = 0;
    while y < img.height {
      let mut x : i64 = 0;
      while x < img.width {
        let mut c : Color = img.getPixel(x, y);
        buf.writeString([&*([&*([&*([&*(c.r.to_string()), &*" ".to_string()].concat()), &*(c.g.to_string())].concat()), &*" ".to_string()].concat()), &*(c.b.to_string())].concat());
        if  x < (img.width - 1) {
          buf.writeString("  ".to_string());
        }
        x = x + 1;
      };
      buf.writeString("\n".to_string());
      y = y + 1;
    };
    let mut data : Vec<u8> = buf.toBuffer();
    std::fs::write(format!("{}/{}", dirPath, fileName), &data).unwrap();
    println!( "{}", [&*([&*([&*"Saved PPM (ASCII): ".to_string(), &*dirPath].concat()), &*"/".to_string()].concat()), &*fileName].concat() );
  }
}
#[derive(Clone)]
struct JPEGComponent { 
  id : i64, 
  hSamp : i64, 
  vSamp : i64, 
  quantTableId : i64, 
  dcTableId : i64, 
  acTableId : i64, 
  prevDC : i64, 
}
impl JPEGComponent { 
  
  pub fn new() ->  JPEGComponent {
    let mut me = JPEGComponent { 
      id:0, 
      hSamp:1, 
      vSamp:1, 
      quantTableId:0, 
      dcTableId:0, 
      acTableId:0, 
      prevDC:0, 
    };
    return me;
  }
}
#[derive(Clone)]
struct QuantizationTable { 
  values : Vec<i64>, 
  id : i64, 
}
impl QuantizationTable { 
  
  pub fn new() ->  QuantizationTable {
    let mut me = QuantizationTable { 
      values: Vec::new(), 
      id:0, 
    };
    let mut i_1 : i64 = 0;
    while i_1 < 64 {
      me.values.push(1);
      i_1 = i_1 + 1;
    };
    return me;
  }
}
#[derive(Clone)]
struct JPEGDecoder { 
  data : Vec<u8>, 
  dataLen : i64, 
  width : i64, 
  height : i64, 
  numComponents : i64, 
  precision : i64, 
  components : Vec<JPEGComponent>, 
  quantTables : Vec<QuantizationTable>, 
  huffman : Option<HuffmanDecoder>, 
  idct : Option<IDCT>, 
  scanDataStart : i64, 
  scanDataLen : i64, 
  mcuWidth : i64, 
  mcuHeight : i64, 
  mcusPerRow : i64, 
  mcusPerCol : i64, 
  maxHSamp : i64, 
  maxVSamp : i64, 
  restartInterval : i64, 
}
impl JPEGDecoder { 
  
  pub fn new() ->  JPEGDecoder {
    let mut me = JPEGDecoder { 
      data:vec![0u8; 0 as usize], 
      dataLen:0, 
      width:0, 
      height:0, 
      numComponents:0, 
      precision:8, 
      components: Vec::new(), 
      quantTables: Vec::new(), 
      huffman: None, 
      idct: None, 
      scanDataStart:0, 
      scanDataLen:0, 
      mcuWidth:8, 
      mcuHeight:8, 
      mcusPerRow:0, 
      mcusPerCol:0, 
      maxHSamp:1, 
      maxVSamp:1, 
      restartInterval:0, 
    };
    me.huffman = Some(HuffmanDecoder::new());
    me.idct = Some(IDCT::new());
    let mut i_2 : i64 = 0;
    while i_2 < 4 {
      me.quantTables.push(QuantizationTable::new());
      i_2 = i_2 + 1;
    };
    return me;
  }
  fn readUint16BE(&mut self, pos : i64) -> i64 {
    let high : i64 = self.data[(pos) as usize] as i64;
    let low : i64 = self.data[((pos + 1)) as usize] as i64;
    return (high * 256) + low;
  }
  fn parseSOF(&mut self, pos : i64, length : i64) -> () {
    self.precision = self.data[(pos) as usize] as i64;
    self.height = self.readUint16BE((pos + 1));
    self.width = self.readUint16BE((pos + 3));
    self.numComponents = self.data[((pos + 5)) as usize] as i64;
    println!( "{}", [&*([&*([&*([&*([&*([&*"  Image: ".to_string(), &*(self.width.to_string())].concat()), &*"x".to_string()].concat()), &*(self.height.to_string())].concat()), &*", ".to_string()].concat()), &*(self.numComponents.to_string())].concat()), &*" components".to_string()].concat() );
    self.maxHSamp = 1;
    self.maxVSamp = 1;
    let mut i : i64 = 0;
    let mut offset : i64 = pos + 6;
    while i < self.numComponents {
      let mut comp : JPEGComponent = JPEGComponent::new();
      comp.id = self.data[(offset) as usize] as i64;
      let sampling : i64 = self.data[((offset + 1)) as usize] as i64;
      comp.hSamp = ((sampling) >> (4));
      comp.vSamp = ((sampling) & (15));
      comp.quantTableId = self.data[((offset + 2)) as usize] as i64;
      if  comp.hSamp > self.maxHSamp {
        self.maxHSamp = comp.hSamp;
      }
      if  comp.vSamp > self.maxVSamp {
        self.maxVSamp = comp.vSamp;
      }
      self.components.push(comp.clone());
      println!( "{}", [&*([&*([&*([&*([&*([&*([&*"    Component ".to_string(), &*(comp.id.to_string())].concat()), &*": ".to_string()].concat()), &*(comp.hSamp.to_string())].concat()), &*"x".to_string()].concat()), &*(comp.vSamp.to_string())].concat()), &*" sampling, quant table ".to_string()].concat()), &*(comp.quantTableId.to_string())].concat() );
      offset = offset + 3;
      i = i + 1;
    };
    self.mcuWidth = self.maxHSamp * 8;
    self.mcuHeight = self.maxVSamp * 8;
    self.mcusPerRow = ((((self.width + self.mcuWidth) - 1) as f64) / (self.mcuWidth as f64)) as i64 ;
    self.mcusPerCol = ((((self.height + self.mcuHeight) - 1) as f64) / (self.mcuHeight as f64)) as i64 ;
    println!( "{}", [&*([&*([&*([&*([&*([&*([&*"  MCU size: ".to_string(), &*(self.mcuWidth.to_string())].concat()), &*"x".to_string()].concat()), &*(self.mcuHeight.to_string())].concat()), &*", grid: ".to_string()].concat()), &*(self.mcusPerRow.to_string())].concat()), &*"x".to_string()].concat()), &*(self.mcusPerCol.to_string())].concat() );
  }
  fn parseDQT(&mut self, mut pos : i64, length : i64) -> () {
    let endPos : i64 = pos + length;
    while pos < endPos {
      let info : i64 = self.data[(pos) as usize] as i64;
      pos = pos + 1;
      let precision_1 : i64 = ((info) >> (4));
      let tableId : i64 = ((info) & (15));
      let mut table : QuantizationTable = self.quantTables[tableId as usize].clone();
      table.id = tableId;
      let mut i : i64 = 0;
      while i < 64 {
        if  precision_1 == 0 {
          table.values.push(self.data[(pos) as usize] as i64);
          pos = pos + 1;
        } else {
          table.values.push(self.readUint16BE(pos));
          pos = pos + 2;
        }
        i = i + 1;
      };
      println!( "{}", [&*([&*([&*([&*"  Quantization table ".to_string(), &*(tableId.to_string())].concat()), &*" (".to_string()].concat()), &*((precision_1 + 1).to_string())].concat()), &*"-byte values)".to_string()].concat() );
    };
  }
  fn parseSOS(&mut self, mut pos : i64, length : i64) -> () {
    let numScanComponents : i64 = self.data[(pos) as usize] as i64;
    pos = pos + 1;
    let mut i : i64 = 0;
    while i < numScanComponents {
      let compId : i64 = self.data[(pos) as usize] as i64;
      let tableSelect : i64 = self.data[((pos + 1)) as usize] as i64;
      pos = pos + 2;
      let mut j : i64 = 0;
      while j < self.numComponents {
        let mut comp : JPEGComponent = self.components[j as usize].clone();
        if  comp.id == compId {
          comp.dcTableId = ((tableSelect) >> (4));
          comp.acTableId = ((tableSelect) & (15));
          println!( "{}", [&*([&*([&*([&*([&*"    Component ".to_string(), &*(compId.to_string())].concat()), &*": DC table ".to_string()].concat()), &*(comp.dcTableId.to_string())].concat()), &*", AC table ".to_string()].concat()), &*(comp.acTableId.to_string())].concat() );
        }
        j = j + 1;
      };
      i = i + 1;
    };
    pos = pos + 3;
    self.scanDataStart = pos;
    let mut searchPos : i64 = pos;
    while searchPos < (self.dataLen - 1) {
      let b : i64 = self.data[(searchPos) as usize] as i64;
      if  b == 255 {
        let nextB : i64 = self.data[((searchPos + 1)) as usize] as i64;
        if  (nextB != 0) && (nextB != 255) {
          if  (nextB >= 208) && (nextB <= 215) {
            searchPos = searchPos + 2;
            continue;
          }
          self.scanDataLen = searchPos - self.scanDataStart;
          return;
        }
      }
      searchPos = searchPos + 1;
    };
    self.scanDataLen = self.dataLen - self.scanDataStart;
  }
  fn parseMarkers(&mut self, ) -> bool {
    let mut pos : i64 = 0;
    if  self.dataLen < 2 {
      println!( "{}", "Error: File too small".to_string() );
      return false;
    }
    let m1 : i64 = self.data[(0) as usize] as i64;
    let m2 : i64 = self.data[(1) as usize] as i64;
    if  (m1 != 255) || (m2 != 216) {
      println!( "{}", "Error: Not a JPEG file (missing SOI)".to_string() );
      return false;
    }
    pos = 2;
    println!( "{}", "Parsing JPEG markers...".to_string() );
    while pos < (self.dataLen - 1) {
      let marker1 : i64 = self.data[(pos) as usize] as i64;
      if  marker1 != 255 {
        pos = pos + 1;
        continue;
      }
      let marker2 : i64 = self.data[((pos + 1)) as usize] as i64;
      if  marker2 == 255 {
        pos = pos + 1;
        continue;
      }
      if  marker2 == 0 {
        pos = pos + 2;
        continue;
      }
      if  marker2 == 216 {
        pos = pos + 2;
        continue;
      }
      if  marker2 == 217 {
        println!( "{}", "  End of Image".to_string() );
        return true;
      }
      if  (marker2 >= 208) && (marker2 <= 215) {
        pos = pos + 2;
        continue;
      }
      if  (pos + 4) > self.dataLen {
        return true;
      }
      let markerLen : i64 = self.readUint16BE((pos + 2));
      let dataStart : i64 = pos + 4;
      let markerDataLen : i64 = markerLen - 2;
      if  marker2 == 192 {
        println!( "{}", "  SOF0 (Baseline DCT)".to_string() );
        self.parseSOF(dataStart, markerDataLen);
      }
      if  marker2 == 193 {
        println!( "{}", "  SOF1 (Extended Sequential DCT)".to_string() );
        self.parseSOF(dataStart, markerDataLen);
      }
      if  marker2 == 194 {
        println!( "{}", "  SOF2 (Progressive DCT) - NOT SUPPORTED".to_string() );
        return false;
      }
      if  marker2 == 196 {
        println!( "{}", "  DHT (Huffman Tables)".to_string() );
        let __arg_0 = self.data.clone();
        self.huffman.as_mut().unwrap().parseDHT(&__arg_0, dataStart, markerDataLen);
      }
      if  marker2 == 219 {
        println!( "{}", "  DQT (Quantization Tables)".to_string() );
        self.parseDQT(dataStart, markerDataLen);
      }
      if  marker2 == 221 {
        self.restartInterval = self.readUint16BE(dataStart);
        println!( "{}", [&*([&*"  DRI (Restart Interval: ".to_string(), &*(self.restartInterval.to_string())].concat()), &*")".to_string()].concat() );
      }
      if  marker2 == 218 {
        println!( "{}", "  SOS (Start of Scan)".to_string() );
        self.parseSOS(dataStart, markerDataLen);
        pos = self.scanDataStart + self.scanDataLen;
        continue;
      }
      if  marker2 == 224 {
        println!( "{}", "  APP0 (JFIF)".to_string() );
      }
      if  marker2 == 225 {
        println!( "{}", "  APP1 (EXIF)".to_string() );
      }
      if  marker2 == 254 {
        println!( "{}", "  COM (Comment)".to_string() );
      }
      pos = (pos + 2) + markerLen;
    };
    return true;
  }
  fn decodeBlock(&mut self, mut reader : &mut BitReader, mut comp : &mut JPEGComponent, mut quantTable : QuantizationTable) -> Vec<i64> {
    let mut coeffs : Vec<i64> = vec![0i64; 64 as usize];
    coeffs[0 as usize..64 as usize].fill(0);
    let mut dcTable : HuffmanTable = self.huffman.as_mut().unwrap().getDCTable(comp.dcTableId);
    let dcCategory : i64 = dcTable.decode(&mut reader);
    let dcDiff : i64 = reader.receiveExtend(dcCategory);
    let dcValue : i64 = comp.prevDC + dcDiff;
    comp.prevDC = dcValue;
    let dcQuant : i64 = quantTable.values[0 as usize].clone();
    coeffs[(0) as usize] = dcValue * dcQuant;
    let mut acTable : HuffmanTable = self.huffman.as_mut().unwrap().getACTable(comp.acTableId);
    let mut k : i64 = 1;
    while k < 64 {
      let acSymbol : i64 = acTable.decode(&mut reader);
      if  acSymbol == 0 {
        k = 64;
      } else {
        let runLength : i64 = ((acSymbol) >> (4));
        let acCategory : i64 = ((acSymbol) & (15));
        if  acSymbol == 240 {
          k = k + 16;
        } else {
          k = k + runLength;
          if  k < 64 {
            let acValue : i64 = reader.receiveExtend(acCategory);
            let acQuant : i64 = quantTable.values[k as usize].clone();
            coeffs[(k) as usize] = acValue * acQuant;
            k = k + 1;
          }
        }
      }
    };
    return coeffs;
  }
  fn decode(&mut self, dirPath : String, fileName : String) -> ImageBuffer {
    self.data = std::fs::read(format!("{}/{}", dirPath, fileName)).unwrap_or_default();
    self.dataLen = self.data.len() as i64;
    println!( "{}", [&*([&*([&*([&*"Decoding JPEG: ".to_string(), &*fileName].concat()), &*" (".to_string()].concat()), &*(self.dataLen.to_string())].concat()), &*" bytes)".to_string()].concat() );
    let ok : bool = self.parseMarkers();
    if  ok == false {
      println!( "{}", "Error parsing JPEG markers".to_string() );
      let mut errImg : ImageBuffer = ImageBuffer::new();
      errImg.init(1, 1);
      return errImg.clone();
    }
    if  (self.width == 0) || (self.height == 0) {
      println!( "{}", "Error: Invalid image dimensions".to_string() );
      let mut errImg_1 : ImageBuffer = ImageBuffer::new();
      errImg_1.init(1, 1);
      return errImg_1.clone();
    }
    println!( "{}", [&*([&*"Decoding ".to_string(), &*(self.scanDataLen.to_string())].concat()), &*" bytes of scan data...".to_string()].concat() );
    let mut img : ImageBuffer = ImageBuffer::new();
    img.init(self.width, self.height);
    let mut reader : BitReader = BitReader::new();
    reader.init(&self.data, self.scanDataStart, self.scanDataLen);
    let mut c : i64 = 0;
    while c < self.numComponents {
      let mut comp : JPEGComponent = self.components[c as usize].clone();
      comp.prevDC = 0;
      c = c + 1;
    };
    let mut yBlocksData : Vec<i64> = Vec::new();
    let mut yBlockCount : i64 = 0;
    let mut cbBlock : Vec<i64> = Vec::new();
    let mut crBlock : Vec<i64> = Vec::new();
    let mut mcuCount : i64 = 0;
    let mut mcuY : i64 = 0;
    while mcuY < self.mcusPerCol {
      let mut mcuX : i64 = 0;
      while mcuX < self.mcusPerRow {
        if  ((self.restartInterval > 0) && (mcuCount > 0)) && ((mcuCount % self.restartInterval) == 0) {
          c = 0;
          while c < self.numComponents {
            let mut compRst : JPEGComponent = self.components[c as usize].clone();
            compRst.prevDC = 0;
            c = c + 1;
          };
          reader.alignToByte();
        }
        yBlockCount = 0;
        let mut compIdx : i64 = 0;
        while compIdx < self.numComponents {
          let mut comp_1 : JPEGComponent = self.components[compIdx as usize].clone();
          let mut quantTable : QuantizationTable = self.quantTables[comp_1.quantTableId as usize].clone();
          let mut blockV : i64 = 0;
          while blockV < comp_1.vSamp {
            let mut blockH : i64 = 0;
            while blockH < comp_1.hSamp {
              let mut coeffs : Vec<i64> = self.decodeBlock(&mut reader, &mut comp_1, quantTable.clone());
              let mut blockPixels : Vec<i64> = vec![0i64; 64 as usize];
              blockPixels[0 as usize..64 as usize].fill(0);
              let mut tempBlock : Vec<i64> = self.idct.as_mut().unwrap().dezigzag(&coeffs);
              self.idct.as_mut().unwrap().transform(&tempBlock, &mut blockPixels);
              if  compIdx == 0 {
                let mut bi : i64 = 0;
                while bi < 64 {
                  yBlocksData.push(blockPixels[(bi) as usize]);
                  bi = bi + 1;
                };
                yBlockCount = yBlockCount + 1;
              }
              if  compIdx == 1 {
                let mut bi_1 : i64 = 0;
                while bi_1 < 64 {
                  cbBlock.push(blockPixels[(bi_1) as usize]);
                  bi_1 = bi_1 + 1;
                };
              }
              if  compIdx == 2 {
                let mut bi_2 : i64 = 0;
                while bi_2 < 64 {
                  crBlock.push(blockPixels[(bi_2) as usize]);
                  bi_2 = bi_2 + 1;
                };
              }
              blockH = blockH + 1;
            };
            blockV = blockV + 1;
          };
          compIdx = compIdx + 1;
        };
        self.writeMCU(&mut img, mcuX, mcuY, &yBlocksData, yBlockCount, &cbBlock, &crBlock);
        mcuX = mcuX + 1;
        mcuCount = mcuCount + 1;
      };
      mcuY = mcuY + 1;
      if  (mcuY % 10) == 0 {
        println!( "{}", [&*([&*([&*"  Row ".to_string(), &*(mcuY.to_string())].concat()), &*"/".to_string()].concat()), &*(self.mcusPerCol.to_string())].concat() );
      }
    };
    println!( "{}", "Decode complete!".to_string() );
    return img.clone();
  }
  fn writeMCU(&mut self, mut img : &mut ImageBuffer, mcuX : i64, mcuY : i64, yBlocksData : &Vec<i64>, yBlockCount : i64, cbBlock : &Vec<i64>, crBlock : &Vec<i64>) -> () {
    let baseX : i64 = mcuX * self.mcuWidth;
    let baseY : i64 = mcuY * self.mcuHeight;
    // unused:  let mut comp0 : JPEGComponent = self.components[0 as usize].clone();
    if  (self.maxHSamp == 1) && (self.maxVSamp == 1) {
      let mut py : i64 = 0;
      while py < 8 {
        let mut px : i64 = 0;
        while px < 8 {
          let imgX : i64 = baseX + px;
          let imgY : i64 = baseY + py;
          if  (imgX < self.width) && (imgY < self.height) {
            let idx : i64 = (py * 8) + px;
            let y : i64 = yBlocksData[idx as usize].clone();
            let mut cb : i64 = 128;
            let mut cr : i64 = 128;
            if  self.numComponents >= 3 {
              cb = cbBlock[idx as usize].clone();
              cr = crBlock[idx as usize].clone();
            }
            let mut r : i64 = y + ((((359 * (cr - 128))) >> (8)));
            let mut g : i64 = (y - ((((88 * (cb - 128))) >> (8)))) - ((((183 * (cr - 128))) >> (8)));
            let mut b : i64 = y + ((((454 * (cb - 128))) >> (8)));
            if  r < 0 {
              r = 0;
            }
            if  r > 255 {
              r = 255;
            }
            if  g < 0 {
              g = 0;
            }
            if  g > 255 {
              g = 255;
            }
            if  b < 0 {
              b = 0;
            }
            if  b > 255 {
              b = 255;
            }
            img.setPixelRGB(imgX, imgY, r, g, b);
          }
          px = px + 1;
        };
        py = py + 1;
      };
      return;
    }
    if  (self.maxHSamp == 2) && (self.maxVSamp == 2) {
      let mut blockIdx : i64 = 0;
      let mut blockY : i64 = 0;
      while blockY < 2 {
        let mut blockX : i64 = 0;
        while blockX < 2 {
          let yBlockOffset : i64 = blockIdx * 64;
          let mut py_1 : i64 = 0;
          while py_1 < 8 {
            let mut px_1 : i64 = 0;
            while px_1 < 8 {
              let imgX_1 : i64 = (baseX + (blockX * 8)) + px_1;
              let imgY_1 : i64 = (baseY + (blockY * 8)) + py_1;
              if  (imgX_1 < self.width) && (imgY_1 < self.height) {
                let yIdx : i64 = (yBlockOffset + (py_1 * 8)) + px_1;
                let y_1 : i64 = yBlocksData[yIdx as usize].clone();
                let chromaX : i64 = (blockX * 4) + (((px_1) >> (1)));
                let chromaY : i64 = (blockY * 4) + (((py_1) >> (1)));
                let chromaIdx : i64 = (chromaY * 8) + chromaX;
                let mut cb_1 : i64 = 128;
                let mut cr_1 : i64 = 128;
                if  self.numComponents >= 3 {
                  cb_1 = cbBlock[chromaIdx as usize].clone();
                  cr_1 = crBlock[chromaIdx as usize].clone();
                }
                let mut r_1 : i64 = y_1 + ((((359 * (cr_1 - 128))) >> (8)));
                let mut g_1 : i64 = (y_1 - ((((88 * (cb_1 - 128))) >> (8)))) - ((((183 * (cr_1 - 128))) >> (8)));
                let mut b_1 : i64 = y_1 + ((((454 * (cb_1 - 128))) >> (8)));
                if  r_1 < 0 {
                  r_1 = 0;
                }
                if  r_1 > 255 {
                  r_1 = 255;
                }
                if  g_1 < 0 {
                  g_1 = 0;
                }
                if  g_1 > 255 {
                  g_1 = 255;
                }
                if  b_1 < 0 {
                  b_1 = 0;
                }
                if  b_1 > 255 {
                  b_1 = 255;
                }
                img.setPixelRGB(imgX_1, imgY_1, r_1, g_1, b_1);
              }
              px_1 = px_1 + 1;
            };
            py_1 = py_1 + 1;
          };
          blockIdx = blockIdx + 1;
          blockX = blockX + 1;
        };
        blockY = blockY + 1;
      };
      return;
    }
    if  (self.maxHSamp == 2) && (self.maxVSamp == 1) {
      let mut blockX_1 : i64 = 0;
      while blockX_1 < 2 {
        let yBlockOffset_1 : i64 = blockX_1 * 64;
        let mut py_2 : i64 = 0;
        while py_2 < 8 {
          let mut px_2 : i64 = 0;
          while px_2 < 8 {
            let imgX_2 : i64 = (baseX + (blockX_1 * 8)) + px_2;
            let imgY_2 : i64 = baseY + py_2;
            if  (imgX_2 < self.width) && (imgY_2 < self.height) {
              let yIdx_1 : i64 = (yBlockOffset_1 + (py_2 * 8)) + px_2;
              let y_2 : i64 = yBlocksData[yIdx_1 as usize].clone();
              let chromaX_1 : i64 = (blockX_1 * 4) + (((px_2) >> (1)));
              let chromaY_1 : i64 = py_2;
              let chromaIdx_1 : i64 = (chromaY_1 * 8) + chromaX_1;
              let mut cb_2 : i64 = 128;
              let mut cr_2 : i64 = 128;
              if  self.numComponents >= 3 {
                cb_2 = cbBlock[chromaIdx_1 as usize].clone();
                cr_2 = crBlock[chromaIdx_1 as usize].clone();
              }
              let mut r_2 : i64 = y_2 + ((((359 * (cr_2 - 128))) >> (8)));
              let mut g_2 : i64 = (y_2 - ((((88 * (cb_2 - 128))) >> (8)))) - ((((183 * (cr_2 - 128))) >> (8)));
              let mut b_2 : i64 = y_2 + ((((454 * (cb_2 - 128))) >> (8)));
              if  r_2 < 0 {
                r_2 = 0;
              }
              if  r_2 > 255 {
                r_2 = 255;
              }
              if  g_2 < 0 {
                g_2 = 0;
              }
              if  g_2 > 255 {
                g_2 = 255;
              }
              if  b_2 < 0 {
                b_2 = 0;
              }
              if  b_2 > 255 {
                b_2 = 255;
              }
              img.setPixelRGB(imgX_2, imgY_2, r_2, g_2, b_2);
            }
            px_2 = px_2 + 1;
          };
          py_2 = py_2 + 1;
        };
        blockX_1 = blockX_1 + 1;
      };
      return;
    }
    if  yBlockCount > 0 {
      let mut py_3 : i64 = 0;
      while py_3 < 8 {
        let mut px_3 : i64 = 0;
        while px_3 < 8 {
          let imgX_3 : i64 = baseX + px_3;
          let imgY_3 : i64 = baseY + py_3;
          if  (imgX_3 < self.width) && (imgY_3 < self.height) {
            let y_3 : i64 = yBlocksData[((py_3 * 8) + px_3) as usize].clone();
            img.setPixelRGB(imgX_3, imgY_3, y_3, y_3, y_3);
          }
          px_3 = px_3 + 1;
        };
        py_3 = py_3 + 1;
      };
    }
  }
}
#[derive(Clone)]
struct FDCT { 
  cosTable : Vec<i64>, 
  zigzagOrder : Vec<i64>, 
}
impl FDCT { 
  
  pub fn new() ->  FDCT {
    let mut me = FDCT { 
      cosTable:vec![0i64; 64 as usize], 
      zigzagOrder:vec![0i64; 64 as usize], 
    };
    me.cosTable[(0) as usize] = 1024;
    me.cosTable[(1) as usize] = 1004;
    me.cosTable[(2) as usize] = 946;
    me.cosTable[(3) as usize] = 851;
    me.cosTable[(4) as usize] = 724;
    me.cosTable[(5) as usize] = 569;
    me.cosTable[(6) as usize] = 392;
    me.cosTable[(7) as usize] = 200;
    me.cosTable[(8) as usize] = 1024;
    me.cosTable[(9) as usize] = 851;
    me.cosTable[(10) as usize] = 392;
    me.cosTable[(11) as usize] = -200;
    me.cosTable[(12) as usize] = -724;
    me.cosTable[(13) as usize] = -1004;
    me.cosTable[(14) as usize] = -946;
    me.cosTable[(15) as usize] = -569;
    me.cosTable[(16) as usize] = 1024;
    me.cosTable[(17) as usize] = 569;
    me.cosTable[(18) as usize] = -392;
    me.cosTable[(19) as usize] = -1004;
    me.cosTable[(20) as usize] = -724;
    me.cosTable[(21) as usize] = 200;
    me.cosTable[(22) as usize] = 946;
    me.cosTable[(23) as usize] = 851;
    me.cosTable[(24) as usize] = 1024;
    me.cosTable[(25) as usize] = 200;
    me.cosTable[(26) as usize] = -946;
    me.cosTable[(27) as usize] = -569;
    me.cosTable[(28) as usize] = 724;
    me.cosTable[(29) as usize] = 851;
    me.cosTable[(30) as usize] = -392;
    me.cosTable[(31) as usize] = -1004;
    me.cosTable[(32) as usize] = 1024;
    me.cosTable[(33) as usize] = -200;
    me.cosTable[(34) as usize] = -946;
    me.cosTable[(35) as usize] = 569;
    me.cosTable[(36) as usize] = 724;
    me.cosTable[(37) as usize] = -851;
    me.cosTable[(38) as usize] = -392;
    me.cosTable[(39) as usize] = 1004;
    me.cosTable[(40) as usize] = 1024;
    me.cosTable[(41) as usize] = -569;
    me.cosTable[(42) as usize] = -392;
    me.cosTable[(43) as usize] = 1004;
    me.cosTable[(44) as usize] = -724;
    me.cosTable[(45) as usize] = -200;
    me.cosTable[(46) as usize] = 946;
    me.cosTable[(47) as usize] = -851;
    me.cosTable[(48) as usize] = 1024;
    me.cosTable[(49) as usize] = -851;
    me.cosTable[(50) as usize] = 392;
    me.cosTable[(51) as usize] = 200;
    me.cosTable[(52) as usize] = -724;
    me.cosTable[(53) as usize] = 1004;
    me.cosTable[(54) as usize] = -946;
    me.cosTable[(55) as usize] = 569;
    me.cosTable[(56) as usize] = 1024;
    me.cosTable[(57) as usize] = -1004;
    me.cosTable[(58) as usize] = 946;
    me.cosTable[(59) as usize] = -851;
    me.cosTable[(60) as usize] = 724;
    me.cosTable[(61) as usize] = -569;
    me.cosTable[(62) as usize] = 392;
    me.cosTable[(63) as usize] = -200;
    me.zigzagOrder[(0) as usize] = 0;
    me.zigzagOrder[(1) as usize] = 1;
    me.zigzagOrder[(2) as usize] = 8;
    me.zigzagOrder[(3) as usize] = 16;
    me.zigzagOrder[(4) as usize] = 9;
    me.zigzagOrder[(5) as usize] = 2;
    me.zigzagOrder[(6) as usize] = 3;
    me.zigzagOrder[(7) as usize] = 10;
    me.zigzagOrder[(8) as usize] = 17;
    me.zigzagOrder[(9) as usize] = 24;
    me.zigzagOrder[(10) as usize] = 32;
    me.zigzagOrder[(11) as usize] = 25;
    me.zigzagOrder[(12) as usize] = 18;
    me.zigzagOrder[(13) as usize] = 11;
    me.zigzagOrder[(14) as usize] = 4;
    me.zigzagOrder[(15) as usize] = 5;
    me.zigzagOrder[(16) as usize] = 12;
    me.zigzagOrder[(17) as usize] = 19;
    me.zigzagOrder[(18) as usize] = 26;
    me.zigzagOrder[(19) as usize] = 33;
    me.zigzagOrder[(20) as usize] = 40;
    me.zigzagOrder[(21) as usize] = 48;
    me.zigzagOrder[(22) as usize] = 41;
    me.zigzagOrder[(23) as usize] = 34;
    me.zigzagOrder[(24) as usize] = 27;
    me.zigzagOrder[(25) as usize] = 20;
    me.zigzagOrder[(26) as usize] = 13;
    me.zigzagOrder[(27) as usize] = 6;
    me.zigzagOrder[(28) as usize] = 7;
    me.zigzagOrder[(29) as usize] = 14;
    me.zigzagOrder[(30) as usize] = 21;
    me.zigzagOrder[(31) as usize] = 28;
    me.zigzagOrder[(32) as usize] = 35;
    me.zigzagOrder[(33) as usize] = 42;
    me.zigzagOrder[(34) as usize] = 49;
    me.zigzagOrder[(35) as usize] = 56;
    me.zigzagOrder[(36) as usize] = 57;
    me.zigzagOrder[(37) as usize] = 50;
    me.zigzagOrder[(38) as usize] = 43;
    me.zigzagOrder[(39) as usize] = 36;
    me.zigzagOrder[(40) as usize] = 29;
    me.zigzagOrder[(41) as usize] = 22;
    me.zigzagOrder[(42) as usize] = 15;
    me.zigzagOrder[(43) as usize] = 23;
    me.zigzagOrder[(44) as usize] = 30;
    me.zigzagOrder[(45) as usize] = 37;
    me.zigzagOrder[(46) as usize] = 44;
    me.zigzagOrder[(47) as usize] = 51;
    me.zigzagOrder[(48) as usize] = 58;
    me.zigzagOrder[(49) as usize] = 59;
    me.zigzagOrder[(50) as usize] = 52;
    me.zigzagOrder[(51) as usize] = 45;
    me.zigzagOrder[(52) as usize] = 38;
    me.zigzagOrder[(53) as usize] = 31;
    me.zigzagOrder[(54) as usize] = 39;
    me.zigzagOrder[(55) as usize] = 46;
    me.zigzagOrder[(56) as usize] = 53;
    me.zigzagOrder[(57) as usize] = 60;
    me.zigzagOrder[(58) as usize] = 61;
    me.zigzagOrder[(59) as usize] = 54;
    me.zigzagOrder[(60) as usize] = 47;
    me.zigzagOrder[(61) as usize] = 55;
    me.zigzagOrder[(62) as usize] = 62;
    me.zigzagOrder[(63) as usize] = 63;
    return me;
  }
  fn dct1d(&mut self, input : &Vec<i64>, startIdx : i64, stride : i64, mut output : &mut Vec<i64>, outIdx : i64, outStride : i64) -> () {
    let mut u : i64 = 0;
    while u < 8 {
      let mut sum : i64 = 0;
      let mut x : i64 = 0;
      while x < 8 {
        let pixel : i64 = input[((startIdx + (x * stride))) as usize];
        let cosVal : i64 = self.cosTable[(((x * 8) + u)) as usize];
        sum = sum + (pixel * cosVal);
        x = x + 1;
      };
      if  u == 0 {
        sum = (((sum * 724)) >> (10));
      }
      output[(outIdx + (u * outStride)) as usize] = ((sum) >> (11));
      u = u + 1;
    };
  }
  fn transform(&mut self, pixels : &Vec<i64>) -> Vec<i64> {
    let mut shifted : Vec<i64> = vec![0i64; 64 as usize];
    let mut i : i64 = 0;
    while i < 64 {
      shifted[(i) as usize] = (pixels[(i) as usize]) - 128;
      i = i + 1;
    };
    let mut temp : Vec<i64> = vec![0i64; 64 as usize];
    let mut row : i64 = 0;
    while row < 8 {
      let rowStart : i64 = row * 8;
      self.dct1d(&shifted, rowStart, 1, &mut temp, rowStart, 1);
      row = row + 1;
    };
    let mut coeffs : Vec<i64> = vec![0i64; 64 as usize];
    let mut col : i64 = 0;
    while col < 8 {
      self.dct1d(&temp, col, 8, &mut coeffs, col, 8);
      col = col + 1;
    };
    return coeffs;
  }
  fn zigzag(&mut self, block : &Vec<i64>) -> Vec<i64> {
    let mut zigzagOut : Vec<i64> = vec![0i64; 64 as usize];
    let mut i : i64 = 0;
    while i < 64 {
      let pos : i64 = self.zigzagOrder[(i) as usize];
      zigzagOut[(i) as usize] = block[(pos) as usize];
      i = i + 1;
    };
    return zigzagOut;
  }
}
#[derive(Clone)]
struct BitWriter { 
  buffer : GrowableBuffer, 
  bitBuffer : i64, 
  bitCount : i64, 
}
impl BitWriter { 
  
  pub fn new() ->  BitWriter {
    let mut me = BitWriter { 
      buffer:GrowableBuffer::new(), 
      bitBuffer:0, 
      bitCount:0, 
    };
    return me;
  }
  fn writeBit(&mut self, bit : i64) -> () {
    self.bitBuffer = ((self.bitBuffer) << (1));
    self.bitBuffer = ((self.bitBuffer) | ((((bit) & (1)))));
    self.bitCount = self.bitCount + 1;
    if  self.bitCount == 8 {
      self.flushByte();
    }
  }
  fn writeBits(&mut self, value : i64, numBits : i64) -> () {
    let mut i : i64 = numBits - 1;
    while i >= 0 {
      let bit : i64 = (((((value) >> (i)))) & (1));
      self.writeBit(bit);
      i = i - 1;
    };
  }
  fn flushByte(&mut self, ) -> () {
    if  self.bitCount > 0 {
      while self.bitCount < 8 {
        self.bitBuffer = ((self.bitBuffer) << (1));
        self.bitBuffer = ((self.bitBuffer) | (1));
        self.bitCount = self.bitCount + 1;
      };
      let __arg_0 = self.bitBuffer.clone();
      self.buffer.writeByte(__arg_0);
      if  self.bitBuffer == 255 {
        self.buffer.writeByte(0);
      }
      self.bitBuffer = 0;
      self.bitCount = 0;
    }
  }
  fn writeByte(&mut self, b : i64) -> () {
    self.flushByte();
    self.buffer.writeByte(b);
  }
  fn writeWord(&mut self, w : i64) -> () {
    self.writeByte(((w) >> (8)));
    self.writeByte(((w) & (255)));
  }
  fn getBuffer(&mut self, ) -> Vec<u8> {
    self.flushByte();
    return self.buffer.toBuffer();
  }
  fn getLength(&mut self, ) -> i64 {
    return (self.buffer).size();
  }
}
#[derive(Clone)]
struct JPEGEncoder { 
  fdct : Option<FDCT>, 
  quality : i64, 
  yQuantTable : Vec<i64>, 
  cQuantTable : Vec<i64>, 
  stdYQuant : Vec<i64>, 
  stdCQuant : Vec<i64>, 
  dcYBits : Vec<i64>, 
  dcYValues : Vec<i64>, 
  acYBits : Vec<i64>, 
  acYValues : Vec<i64>, 
  dcCBits : Vec<i64>, 
  dcCValues : Vec<i64>, 
  acCBits : Vec<i64>, 
  acCValues : Vec<i64>, 
  dcYCodes : Vec<i64>, 
  dcYLengths : Vec<i64>, 
  acYCodes : Vec<i64>, 
  acYLengths : Vec<i64>, 
  dcCCodes : Vec<i64>, 
  dcCLengths : Vec<i64>, 
  acCCodes : Vec<i64>, 
  acCLengths : Vec<i64>, 
  prevDCY : i64, 
  prevDCCb : i64, 
  prevDCCr : i64, 
}
impl JPEGEncoder { 
  
  pub fn new() ->  JPEGEncoder {
    let mut me = JPEGEncoder { 
      fdct: None, 
      quality:75, 
      yQuantTable: Vec::new(), 
      cQuantTable: Vec::new(), 
      stdYQuant: Vec::new(), 
      stdCQuant: Vec::new(), 
      dcYBits: Vec::new(), 
      dcYValues: Vec::new(), 
      acYBits: Vec::new(), 
      acYValues: Vec::new(), 
      dcCBits: Vec::new(), 
      dcCValues: Vec::new(), 
      acCBits: Vec::new(), 
      acCValues: Vec::new(), 
      dcYCodes: Vec::new(), 
      dcYLengths: Vec::new(), 
      acYCodes: Vec::new(), 
      acYLengths: Vec::new(), 
      dcCCodes: Vec::new(), 
      dcCLengths: Vec::new(), 
      acCCodes: Vec::new(), 
      acCLengths: Vec::new(), 
      prevDCY:0, 
      prevDCCb:0, 
      prevDCCr:0, 
    };
    me.fdct = Some(FDCT::new());
    me.initQuantTables();
    me.initHuffmanTables();
    return me;
  }
  fn initQuantTables(&mut self, ) -> () {
    self.stdYQuant.push(16);
    self.stdYQuant.push(11);
    self.stdYQuant.push(10);
    self.stdYQuant.push(16);
    self.stdYQuant.push(24);
    self.stdYQuant.push(40);
    self.stdYQuant.push(51);
    self.stdYQuant.push(61);
    self.stdYQuant.push(12);
    self.stdYQuant.push(12);
    self.stdYQuant.push(14);
    self.stdYQuant.push(19);
    self.stdYQuant.push(26);
    self.stdYQuant.push(58);
    self.stdYQuant.push(60);
    self.stdYQuant.push(55);
    self.stdYQuant.push(14);
    self.stdYQuant.push(13);
    self.stdYQuant.push(16);
    self.stdYQuant.push(24);
    self.stdYQuant.push(40);
    self.stdYQuant.push(57);
    self.stdYQuant.push(69);
    self.stdYQuant.push(56);
    self.stdYQuant.push(14);
    self.stdYQuant.push(17);
    self.stdYQuant.push(22);
    self.stdYQuant.push(29);
    self.stdYQuant.push(51);
    self.stdYQuant.push(87);
    self.stdYQuant.push(80);
    self.stdYQuant.push(62);
    self.stdYQuant.push(18);
    self.stdYQuant.push(22);
    self.stdYQuant.push(37);
    self.stdYQuant.push(56);
    self.stdYQuant.push(68);
    self.stdYQuant.push(109);
    self.stdYQuant.push(103);
    self.stdYQuant.push(77);
    self.stdYQuant.push(24);
    self.stdYQuant.push(35);
    self.stdYQuant.push(55);
    self.stdYQuant.push(64);
    self.stdYQuant.push(81);
    self.stdYQuant.push(104);
    self.stdYQuant.push(113);
    self.stdYQuant.push(92);
    self.stdYQuant.push(49);
    self.stdYQuant.push(64);
    self.stdYQuant.push(78);
    self.stdYQuant.push(87);
    self.stdYQuant.push(103);
    self.stdYQuant.push(121);
    self.stdYQuant.push(120);
    self.stdYQuant.push(101);
    self.stdYQuant.push(72);
    self.stdYQuant.push(92);
    self.stdYQuant.push(95);
    self.stdYQuant.push(98);
    self.stdYQuant.push(112);
    self.stdYQuant.push(100);
    self.stdYQuant.push(103);
    self.stdYQuant.push(99);
    self.stdCQuant.push(17);
    self.stdCQuant.push(18);
    self.stdCQuant.push(24);
    self.stdCQuant.push(47);
    self.stdCQuant.push(99);
    self.stdCQuant.push(99);
    self.stdCQuant.push(99);
    self.stdCQuant.push(99);
    self.stdCQuant.push(18);
    self.stdCQuant.push(21);
    self.stdCQuant.push(26);
    self.stdCQuant.push(66);
    self.stdCQuant.push(99);
    self.stdCQuant.push(99);
    self.stdCQuant.push(99);
    self.stdCQuant.push(99);
    self.stdCQuant.push(24);
    self.stdCQuant.push(26);
    self.stdCQuant.push(56);
    self.stdCQuant.push(99);
    self.stdCQuant.push(99);
    self.stdCQuant.push(99);
    self.stdCQuant.push(99);
    self.stdCQuant.push(99);
    self.stdCQuant.push(47);
    self.stdCQuant.push(66);
    self.stdCQuant.push(99);
    self.stdCQuant.push(99);
    self.stdCQuant.push(99);
    self.stdCQuant.push(99);
    self.stdCQuant.push(99);
    self.stdCQuant.push(99);
    self.stdCQuant.push(99);
    self.stdCQuant.push(99);
    self.stdCQuant.push(99);
    self.stdCQuant.push(99);
    self.stdCQuant.push(99);
    self.stdCQuant.push(99);
    self.stdCQuant.push(99);
    self.stdCQuant.push(99);
    self.stdCQuant.push(99);
    self.stdCQuant.push(99);
    self.stdCQuant.push(99);
    self.stdCQuant.push(99);
    self.stdCQuant.push(99);
    self.stdCQuant.push(99);
    self.stdCQuant.push(99);
    self.stdCQuant.push(99);
    self.stdCQuant.push(99);
    self.stdCQuant.push(99);
    self.stdCQuant.push(99);
    self.stdCQuant.push(99);
    self.stdCQuant.push(99);
    self.stdCQuant.push(99);
    self.stdCQuant.push(99);
    self.stdCQuant.push(99);
    self.stdCQuant.push(99);
    self.stdCQuant.push(99);
    self.stdCQuant.push(99);
    self.stdCQuant.push(99);
    self.stdCQuant.push(99);
    self.stdCQuant.push(99);
    self.stdCQuant.push(99);
    self.stdCQuant.push(99);
    let __arg_0 = self.quality.clone();
    self.scaleQuantTables(__arg_0);
  }
  fn scaleQuantTables(&mut self, q : i64) -> () {
    let mut scale : i64 = 0;
    if  q < 50 {
      scale = ((5000 as f64) / (q as f64)) as i64 ;
    } else {
      scale = 200 - (q * 2);
    }
    let mut i : i64 = 0;
    while i < 64 {
      let mut yVal : i64 = (((((self.stdYQuant[i as usize].clone()) * scale) + 50) as f64) / (100 as f64)) as i64 ;
      if  yVal < 1 {
        yVal = 1;
      }
      if  yVal > 255 {
        yVal = 255;
      }
      self.yQuantTable.push(yVal.clone());
      let mut cVal : i64 = (((((self.stdCQuant[i as usize].clone()) * scale) + 50) as f64) / (100 as f64)) as i64 ;
      if  cVal < 1 {
        cVal = 1;
      }
      if  cVal > 255 {
        cVal = 255;
      }
      self.cQuantTable.push(cVal.clone());
      i = i + 1;
    };
  }
  fn initHuffmanTables(&mut self, ) -> () {
    self.dcYBits.push(0);
    self.dcYBits.push(1);
    self.dcYBits.push(5);
    self.dcYBits.push(1);
    self.dcYBits.push(1);
    self.dcYBits.push(1);
    self.dcYBits.push(1);
    self.dcYBits.push(1);
    self.dcYBits.push(1);
    self.dcYBits.push(0);
    self.dcYBits.push(0);
    self.dcYBits.push(0);
    self.dcYBits.push(0);
    self.dcYBits.push(0);
    self.dcYBits.push(0);
    self.dcYBits.push(0);
    self.dcYValues.push(0);
    self.dcYValues.push(1);
    self.dcYValues.push(2);
    self.dcYValues.push(3);
    self.dcYValues.push(4);
    self.dcYValues.push(5);
    self.dcYValues.push(6);
    self.dcYValues.push(7);
    self.dcYValues.push(8);
    self.dcYValues.push(9);
    self.dcYValues.push(10);
    self.dcYValues.push(11);
    self.acYBits.push(0);
    self.acYBits.push(2);
    self.acYBits.push(1);
    self.acYBits.push(3);
    self.acYBits.push(3);
    self.acYBits.push(2);
    self.acYBits.push(4);
    self.acYBits.push(3);
    self.acYBits.push(5);
    self.acYBits.push(5);
    self.acYBits.push(4);
    self.acYBits.push(4);
    self.acYBits.push(0);
    self.acYBits.push(0);
    self.acYBits.push(1);
    self.acYBits.push(125);
    self.acYValues.push(1);
    self.acYValues.push(2);
    self.acYValues.push(3);
    self.acYValues.push(0);
    self.acYValues.push(4);
    self.acYValues.push(17);
    self.acYValues.push(5);
    self.acYValues.push(18);
    self.acYValues.push(33);
    self.acYValues.push(49);
    self.acYValues.push(65);
    self.acYValues.push(6);
    self.acYValues.push(19);
    self.acYValues.push(81);
    self.acYValues.push(97);
    self.acYValues.push(7);
    self.acYValues.push(34);
    self.acYValues.push(113);
    self.acYValues.push(20);
    self.acYValues.push(50);
    self.acYValues.push(129);
    self.acYValues.push(145);
    self.acYValues.push(161);
    self.acYValues.push(8);
    self.acYValues.push(35);
    self.acYValues.push(66);
    self.acYValues.push(177);
    self.acYValues.push(193);
    self.acYValues.push(21);
    self.acYValues.push(82);
    self.acYValues.push(209);
    self.acYValues.push(240);
    self.acYValues.push(36);
    self.acYValues.push(51);
    self.acYValues.push(98);
    self.acYValues.push(114);
    self.acYValues.push(130);
    self.acYValues.push(9);
    self.acYValues.push(10);
    self.acYValues.push(22);
    self.acYValues.push(23);
    self.acYValues.push(24);
    self.acYValues.push(25);
    self.acYValues.push(26);
    self.acYValues.push(37);
    self.acYValues.push(38);
    self.acYValues.push(39);
    self.acYValues.push(40);
    self.acYValues.push(41);
    self.acYValues.push(42);
    self.acYValues.push(52);
    self.acYValues.push(53);
    self.acYValues.push(54);
    self.acYValues.push(55);
    self.acYValues.push(56);
    self.acYValues.push(57);
    self.acYValues.push(58);
    self.acYValues.push(67);
    self.acYValues.push(68);
    self.acYValues.push(69);
    self.acYValues.push(70);
    self.acYValues.push(71);
    self.acYValues.push(72);
    self.acYValues.push(73);
    self.acYValues.push(74);
    self.acYValues.push(83);
    self.acYValues.push(84);
    self.acYValues.push(85);
    self.acYValues.push(86);
    self.acYValues.push(87);
    self.acYValues.push(88);
    self.acYValues.push(89);
    self.acYValues.push(90);
    self.acYValues.push(99);
    self.acYValues.push(100);
    self.acYValues.push(101);
    self.acYValues.push(102);
    self.acYValues.push(103);
    self.acYValues.push(104);
    self.acYValues.push(105);
    self.acYValues.push(106);
    self.acYValues.push(115);
    self.acYValues.push(116);
    self.acYValues.push(117);
    self.acYValues.push(118);
    self.acYValues.push(119);
    self.acYValues.push(120);
    self.acYValues.push(121);
    self.acYValues.push(122);
    self.acYValues.push(131);
    self.acYValues.push(132);
    self.acYValues.push(133);
    self.acYValues.push(134);
    self.acYValues.push(135);
    self.acYValues.push(136);
    self.acYValues.push(137);
    self.acYValues.push(138);
    self.acYValues.push(146);
    self.acYValues.push(147);
    self.acYValues.push(148);
    self.acYValues.push(149);
    self.acYValues.push(150);
    self.acYValues.push(151);
    self.acYValues.push(152);
    self.acYValues.push(153);
    self.acYValues.push(154);
    self.acYValues.push(162);
    self.acYValues.push(163);
    self.acYValues.push(164);
    self.acYValues.push(165);
    self.acYValues.push(166);
    self.acYValues.push(167);
    self.acYValues.push(168);
    self.acYValues.push(169);
    self.acYValues.push(170);
    self.acYValues.push(178);
    self.acYValues.push(179);
    self.acYValues.push(180);
    self.acYValues.push(181);
    self.acYValues.push(182);
    self.acYValues.push(183);
    self.acYValues.push(184);
    self.acYValues.push(185);
    self.acYValues.push(186);
    self.acYValues.push(194);
    self.acYValues.push(195);
    self.acYValues.push(196);
    self.acYValues.push(197);
    self.acYValues.push(198);
    self.acYValues.push(199);
    self.acYValues.push(200);
    self.acYValues.push(201);
    self.acYValues.push(202);
    self.acYValues.push(210);
    self.acYValues.push(211);
    self.acYValues.push(212);
    self.acYValues.push(213);
    self.acYValues.push(214);
    self.acYValues.push(215);
    self.acYValues.push(216);
    self.acYValues.push(217);
    self.acYValues.push(218);
    self.acYValues.push(225);
    self.acYValues.push(226);
    self.acYValues.push(227);
    self.acYValues.push(228);
    self.acYValues.push(229);
    self.acYValues.push(230);
    self.acYValues.push(231);
    self.acYValues.push(232);
    self.acYValues.push(233);
    self.acYValues.push(234);
    self.acYValues.push(241);
    self.acYValues.push(242);
    self.acYValues.push(243);
    self.acYValues.push(244);
    self.acYValues.push(245);
    self.acYValues.push(246);
    self.acYValues.push(247);
    self.acYValues.push(248);
    self.acYValues.push(249);
    self.acYValues.push(250);
    self.dcCBits.push(0);
    self.dcCBits.push(3);
    self.dcCBits.push(1);
    self.dcCBits.push(1);
    self.dcCBits.push(1);
    self.dcCBits.push(1);
    self.dcCBits.push(1);
    self.dcCBits.push(1);
    self.dcCBits.push(1);
    self.dcCBits.push(1);
    self.dcCBits.push(1);
    self.dcCBits.push(0);
    self.dcCBits.push(0);
    self.dcCBits.push(0);
    self.dcCBits.push(0);
    self.dcCBits.push(0);
    self.dcCValues.push(0);
    self.dcCValues.push(1);
    self.dcCValues.push(2);
    self.dcCValues.push(3);
    self.dcCValues.push(4);
    self.dcCValues.push(5);
    self.dcCValues.push(6);
    self.dcCValues.push(7);
    self.dcCValues.push(8);
    self.dcCValues.push(9);
    self.dcCValues.push(10);
    self.dcCValues.push(11);
    self.acCBits.push(0);
    self.acCBits.push(2);
    self.acCBits.push(1);
    self.acCBits.push(2);
    self.acCBits.push(4);
    self.acCBits.push(4);
    self.acCBits.push(3);
    self.acCBits.push(4);
    self.acCBits.push(7);
    self.acCBits.push(5);
    self.acCBits.push(4);
    self.acCBits.push(4);
    self.acCBits.push(0);
    self.acCBits.push(1);
    self.acCBits.push(2);
    self.acCBits.push(119);
    self.acCValues.push(0);
    self.acCValues.push(1);
    self.acCValues.push(2);
    self.acCValues.push(3);
    self.acCValues.push(17);
    self.acCValues.push(4);
    self.acCValues.push(5);
    self.acCValues.push(33);
    self.acCValues.push(49);
    self.acCValues.push(6);
    self.acCValues.push(18);
    self.acCValues.push(65);
    self.acCValues.push(81);
    self.acCValues.push(7);
    self.acCValues.push(97);
    self.acCValues.push(113);
    self.acCValues.push(19);
    self.acCValues.push(34);
    self.acCValues.push(50);
    self.acCValues.push(129);
    self.acCValues.push(8);
    self.acCValues.push(20);
    self.acCValues.push(66);
    self.acCValues.push(145);
    self.acCValues.push(161);
    self.acCValues.push(177);
    self.acCValues.push(193);
    self.acCValues.push(9);
    self.acCValues.push(35);
    self.acCValues.push(51);
    self.acCValues.push(82);
    self.acCValues.push(240);
    self.acCValues.push(21);
    self.acCValues.push(98);
    self.acCValues.push(114);
    self.acCValues.push(209);
    self.acCValues.push(10);
    self.acCValues.push(22);
    self.acCValues.push(36);
    self.acCValues.push(52);
    self.acCValues.push(225);
    self.acCValues.push(37);
    self.acCValues.push(241);
    self.acCValues.push(23);
    self.acCValues.push(24);
    self.acCValues.push(25);
    self.acCValues.push(26);
    self.acCValues.push(38);
    self.acCValues.push(39);
    self.acCValues.push(40);
    self.acCValues.push(41);
    self.acCValues.push(42);
    self.acCValues.push(53);
    self.acCValues.push(54);
    self.acCValues.push(55);
    self.acCValues.push(56);
    self.acCValues.push(57);
    self.acCValues.push(58);
    self.acCValues.push(67);
    self.acCValues.push(68);
    self.acCValues.push(69);
    self.acCValues.push(70);
    self.acCValues.push(71);
    self.acCValues.push(72);
    self.acCValues.push(73);
    self.acCValues.push(74);
    self.acCValues.push(83);
    self.acCValues.push(84);
    self.acCValues.push(85);
    self.acCValues.push(86);
    self.acCValues.push(87);
    self.acCValues.push(88);
    self.acCValues.push(89);
    self.acCValues.push(90);
    self.acCValues.push(99);
    self.acCValues.push(100);
    self.acCValues.push(101);
    self.acCValues.push(102);
    self.acCValues.push(103);
    self.acCValues.push(104);
    self.acCValues.push(105);
    self.acCValues.push(106);
    self.acCValues.push(115);
    self.acCValues.push(116);
    self.acCValues.push(117);
    self.acCValues.push(118);
    self.acCValues.push(119);
    self.acCValues.push(120);
    self.acCValues.push(121);
    self.acCValues.push(122);
    self.acCValues.push(130);
    self.acCValues.push(131);
    self.acCValues.push(132);
    self.acCValues.push(133);
    self.acCValues.push(134);
    self.acCValues.push(135);
    self.acCValues.push(136);
    self.acCValues.push(137);
    self.acCValues.push(138);
    self.acCValues.push(146);
    self.acCValues.push(147);
    self.acCValues.push(148);
    self.acCValues.push(149);
    self.acCValues.push(150);
    self.acCValues.push(151);
    self.acCValues.push(152);
    self.acCValues.push(153);
    self.acCValues.push(154);
    self.acCValues.push(162);
    self.acCValues.push(163);
    self.acCValues.push(164);
    self.acCValues.push(165);
    self.acCValues.push(166);
    self.acCValues.push(167);
    self.acCValues.push(168);
    self.acCValues.push(169);
    self.acCValues.push(170);
    self.acCValues.push(178);
    self.acCValues.push(179);
    self.acCValues.push(180);
    self.acCValues.push(181);
    self.acCValues.push(182);
    self.acCValues.push(183);
    self.acCValues.push(184);
    self.acCValues.push(185);
    self.acCValues.push(186);
    self.acCValues.push(194);
    self.acCValues.push(195);
    self.acCValues.push(196);
    self.acCValues.push(197);
    self.acCValues.push(198);
    self.acCValues.push(199);
    self.acCValues.push(200);
    self.acCValues.push(201);
    self.acCValues.push(202);
    self.acCValues.push(210);
    self.acCValues.push(211);
    self.acCValues.push(212);
    self.acCValues.push(213);
    self.acCValues.push(214);
    self.acCValues.push(215);
    self.acCValues.push(216);
    self.acCValues.push(217);
    self.acCValues.push(218);
    self.acCValues.push(226);
    self.acCValues.push(227);
    self.acCValues.push(228);
    self.acCValues.push(229);
    self.acCValues.push(230);
    self.acCValues.push(231);
    self.acCValues.push(232);
    self.acCValues.push(233);
    self.acCValues.push(234);
    self.acCValues.push(242);
    self.acCValues.push(243);
    self.acCValues.push(244);
    self.acCValues.push(245);
    self.acCValues.push(246);
    self.acCValues.push(247);
    self.acCValues.push(248);
    self.acCValues.push(249);
    self.acCValues.push(250);
    let mut i : i64 = 0;
    while i < 256 {
      self.dcYCodes.push(0);
      self.dcYLengths.push(0);
      self.acYCodes.push(0);
      self.acYLengths.push(0);
      self.dcCCodes.push(0);
      self.dcCLengths.push(0);
      self.acCCodes.push(0);
      self.acCLengths.push(0);
      i = i + 1;
    };
    let __arg_0 = self.dcYBits.clone();
    let __arg_1 = self.dcYValues.clone();
    let mut __arg_2 = self.dcYCodes.clone();
    let mut __arg_3 = self.dcYLengths.clone();
    JPEGEncoder::buildHuffmanCodes(&__arg_0, &__arg_1, &mut __arg_2, &mut __arg_3);
    let __arg_0 = self.acYBits.clone();
    let __arg_1 = self.acYValues.clone();
    let mut __arg_2 = self.acYCodes.clone();
    let mut __arg_3 = self.acYLengths.clone();
    JPEGEncoder::buildHuffmanCodes(&__arg_0, &__arg_1, &mut __arg_2, &mut __arg_3);
    let __arg_0 = self.dcCBits.clone();
    let __arg_1 = self.dcCValues.clone();
    let mut __arg_2 = self.dcCCodes.clone();
    let mut __arg_3 = self.dcCLengths.clone();
    JPEGEncoder::buildHuffmanCodes(&__arg_0, &__arg_1, &mut __arg_2, &mut __arg_3);
    let __arg_0 = self.acCBits.clone();
    let __arg_1 = self.acCValues.clone();
    let mut __arg_2 = self.acCCodes.clone();
    let mut __arg_3 = self.acCLengths.clone();
    JPEGEncoder::buildHuffmanCodes(&__arg_0, &__arg_1, &mut __arg_2, &mut __arg_3);
  }
  fn buildHuffmanCodes(bits : &Vec<i64>, values : &Vec<i64>, mut codes : &mut Vec<i64>, mut lengths : &mut Vec<i64>) -> () {
    let mut code : i64 = 0;
    let mut valueIdx : i64 = 0;
    let mut bitLen : i64 = 1;
    while bitLen <= 16 {
      let count : i64 = bits[(bitLen - 1) as usize].clone();
      let mut j : i64 = 0;
      while j < count {
        let symbol : i64 = values[valueIdx as usize].clone();
        codes[symbol as usize] = code;
        lengths[symbol as usize] = bitLen;
        code = code + 1;
        valueIdx = valueIdx + 1;
        j = j + 1;
      };
      code = ((code) << (1));
      bitLen = bitLen + 1;
    };
  }
  fn getCategory(mut value : i64) -> i64 {
    if  value < 0 {
      value = 0 - value;
    }
    if  value == 0 {
      return 0;
    }
    let mut cat : i64 = 0;
    while value > 0 {
      cat = cat + 1;
      value = ((value) >> (1));
    };
    return cat;
  }
  fn encodeNumber(value : i64, category : i64) -> i64 {
    if  value < 0 {
      return value + ((((1) << (category))) - 1);
    }
    return value;
  }
  fn encodeBlock(&mut self, mut writer : &mut BitWriter, coeffs : &Vec<i64>, quantTable : &Vec<i64>, dcCodes : &Vec<i64>, dcLengths : &Vec<i64>, acCodes : &Vec<i64>, acLengths : &Vec<i64>, prevDC : i64) -> () {
    let mut quantized : Vec<i64> = vec![0i64; 64 as usize];
    let mut i : i64 = 0;
    while i < 64 {
      let q : i64 = quantTable[i as usize].clone();
      let c : i64 = coeffs[(i) as usize];
      let mut qVal : i64 = 0;
      if  c >= 0 {
        qVal = (((c + (((q) >> (1)))) as f64) / (q as f64)) as i64 ;
      } else {
        qVal = (((c - (((q) >> (1)))) as f64) / (q as f64)) as i64 ;
      }
      quantized[(i) as usize] = qVal;
      i = i + 1;
    };
    let mut zigzagged : Vec<i64> = self.fdct.as_mut().unwrap().zigzag(&quantized);
    let dc : i64 = zigzagged[(0) as usize];
    let dcDiff : i64 = dc - prevDC;
    let dcCat : i64 = JPEGEncoder::getCategory(dcDiff);
    let dcCode : i64 = dcCodes[dcCat as usize].clone();
    let dcLen : i64 = dcLengths[dcCat as usize].clone();
    writer.writeBits(dcCode, dcLen);
    if  dcCat > 0 {
      let dcVal : i64 = JPEGEncoder::encodeNumber(dcDiff, dcCat);
      writer.writeBits(dcVal, dcCat);
    }
    let mut zeroRun : i64 = 0;
    let mut k : i64 = 1;
    while k < 64 {
      let ac : i64 = zigzagged[(k) as usize];
      if  ac == 0 {
        zeroRun = zeroRun + 1;
      } else {
        while zeroRun >= 16 {
          let zrlCode : i64 = acCodes[240 as usize].clone();
          let zrlLen : i64 = acLengths[240 as usize].clone();
          writer.writeBits(zrlCode, zrlLen);
          zeroRun = zeroRun - 16;
        };
        let acCat : i64 = JPEGEncoder::getCategory(ac);
        let runCat : i64 = (((((zeroRun) << (4)))) | (acCat));
        let acHuffCode : i64 = acCodes[runCat as usize].clone();
        let acHuffLen : i64 = acLengths[runCat as usize].clone();
        writer.writeBits(acHuffCode, acHuffLen);
        let acVal : i64 = JPEGEncoder::encodeNumber(ac, acCat);
        writer.writeBits(acVal, acCat);
        zeroRun = 0;
      }
      k = k + 1;
    };
    if  zeroRun > 0 {
      let eobCode : i64 = acCodes[0 as usize].clone();
      let eobLen : i64 = acLengths[0 as usize].clone();
      writer.writeBits(eobCode, eobLen);
    }
  }
  fn rgbToYCbCr(r : i64, g : i64, b : i64, mut yOut : &mut Vec<i64>, mut cbOut : &mut Vec<i64>, mut crOut : &mut Vec<i64>) -> () {
    let mut y : i64 = (((((77 * r) + (150 * g)) + (29 * b))) >> (8));
    let mut cb : i64 = ((((((0 - (43 * r)) - (85 * g)) + (128 * b))) >> (8))) + 128;
    let mut cr : i64 = ((((((128 * r) - (107 * g)) - (21 * b))) >> (8))) + 128;
    if  y < 0 {
      y = 0;
    }
    if  y > 255 {
      y = 255;
    }
    if  cb < 0 {
      cb = 0;
    }
    if  cb > 255 {
      cb = 255;
    }
    if  cr < 0 {
      cr = 0;
    }
    if  cr > 255 {
      cr = 255;
    }
    yOut.push(y.clone());
    cbOut.push(cb.clone());
    crOut.push(cr.clone());
  }
  fn extractBlock(&mut self, mut img : &mut ImageBuffer, blockX : i64, blockY : i64, channel : i64) -> Vec<i64> {
    let mut output : Vec<i64> = vec![0i64; 64 as usize];
    let mut idx : i64 = 0;
    let mut py : i64 = 0;
    while py < 8 {
      let mut px : i64 = 0;
      while px < 8 {
        let mut imgX : i64 = blockX + px;
        let mut imgY : i64 = blockY + py;
        if  imgX >= img.width {
          imgX = img.width - 1;
        }
        if  imgY >= img.height {
          imgY = img.height - 1;
        }
        let mut c : Color = img.getPixel(imgX, imgY);
        let y : i64 = (((((77 * c.r) + (150 * c.g)) + (29 * c.b))) >> (8));
        let cb : i64 = ((((((0 - (43 * c.r)) - (85 * c.g)) + (128 * c.b))) >> (8))) + 128;
        let cr : i64 = ((((((128 * c.r) - (107 * c.g)) - (21 * c.b))) >> (8))) + 128;
        if  channel == 0 {
          output[(idx) as usize] = y;
        }
        if  channel == 1 {
          output[(idx) as usize] = cb;
        }
        if  channel == 2 {
          output[(idx) as usize] = cr;
        }
        idx = idx + 1;
        px = px + 1;
      };
      py = py + 1;
    };
    return output;
  }
  fn writeMarkers(&mut self, mut writer : &mut BitWriter, width : i64, height : i64) -> () {
    writer.writeByte(255);
    writer.writeByte(216);
    writer.writeByte(255);
    writer.writeByte(224);
    writer.writeWord(16);
    writer.writeByte(74);
    writer.writeByte(70);
    writer.writeByte(73);
    writer.writeByte(70);
    writer.writeByte(0);
    writer.writeByte(1);
    writer.writeByte(1);
    writer.writeByte(0);
    writer.writeWord(1);
    writer.writeWord(1);
    writer.writeByte(0);
    writer.writeByte(0);
    writer.writeByte(255);
    writer.writeByte(219);
    writer.writeWord(67);
    writer.writeByte(0);
    let mut i : i64 = 0;
    while i < 64 {
      writer.writeByte(self.yQuantTable[(self.fdct.as_mut().unwrap().zigzagOrder[(i) as usize]) as usize].clone());
      i = i + 1;
    };
    writer.writeByte(255);
    writer.writeByte(219);
    writer.writeWord(67);
    writer.writeByte(1);
    i = 0;
    while i < 64 {
      writer.writeByte(self.cQuantTable[(self.fdct.as_mut().unwrap().zigzagOrder[(i) as usize]) as usize].clone());
      i = i + 1;
    };
    writer.writeByte(255);
    writer.writeByte(192);
    writer.writeWord(17);
    writer.writeByte(8);
    writer.writeWord(height);
    writer.writeWord(width);
    writer.writeByte(3);
    writer.writeByte(1);
    writer.writeByte(17);
    writer.writeByte(0);
    writer.writeByte(2);
    writer.writeByte(17);
    writer.writeByte(1);
    writer.writeByte(3);
    writer.writeByte(17);
    writer.writeByte(1);
    writer.writeByte(255);
    writer.writeByte(196);
    writer.writeWord(31);
    writer.writeByte(0);
    i = 0;
    while i < 16 {
      writer.writeByte(self.dcYBits[i as usize].clone());
      i = i + 1;
    };
    i = 0;
    while i < 12 {
      writer.writeByte(self.dcYValues[i as usize].clone());
      i = i + 1;
    };
    writer.writeByte(255);
    writer.writeByte(196);
    writer.writeWord(181);
    writer.writeByte(16);
    i = 0;
    while i < 16 {
      writer.writeByte(self.acYBits[i as usize].clone());
      i = i + 1;
    };
    i = 0;
    while i < 162 {
      writer.writeByte(self.acYValues[i as usize].clone());
      i = i + 1;
    };
    writer.writeByte(255);
    writer.writeByte(196);
    writer.writeWord(31);
    writer.writeByte(1);
    i = 0;
    while i < 16 {
      writer.writeByte(self.dcCBits[i as usize].clone());
      i = i + 1;
    };
    i = 0;
    while i < 12 {
      writer.writeByte(self.dcCValues[i as usize].clone());
      i = i + 1;
    };
    writer.writeByte(255);
    writer.writeByte(196);
    writer.writeWord(181);
    writer.writeByte(17);
    i = 0;
    while i < 16 {
      writer.writeByte(self.acCBits[i as usize].clone());
      i = i + 1;
    };
    i = 0;
    while i < 162 {
      writer.writeByte(self.acCValues[i as usize].clone());
      i = i + 1;
    };
    writer.writeByte(255);
    writer.writeByte(218);
    writer.writeWord(12);
    writer.writeByte(3);
    writer.writeByte(1);
    writer.writeByte(0);
    writer.writeByte(2);
    writer.writeByte(17);
    writer.writeByte(3);
    writer.writeByte(17);
    writer.writeByte(0);
    writer.writeByte(63);
    writer.writeByte(0);
  }
  fn encodeToBuffer(&mut self, mut img : &mut ImageBuffer) -> Vec<u8> {
    let mut writer : BitWriter = BitWriter::new();
    let __arg_0 = img.width.clone();
    let __arg_1 = img.height.clone();
    self.writeMarkers(&mut writer, __arg_0, __arg_1);
    let mcuWidth : i64 = (((img.width + 7) as f64) / (8 as f64)) as i64 ;
    let mcuHeight : i64 = (((img.height + 7) as f64) / (8 as f64)) as i64 ;
    self.prevDCY = 0;
    self.prevDCCb = 0;
    self.prevDCCr = 0;
    let mut mcuY : i64 = 0;
    while mcuY < mcuHeight {
      let mut mcuX : i64 = 0;
      while mcuX < mcuWidth {
        let blockX : i64 = mcuX * 8;
        let blockY : i64 = mcuY * 8;
        let mut yBlock : Vec<i64> = self.extractBlock(&mut img, blockX, blockY, 0);
        let mut yCoeffs : Vec<i64> = self.fdct.as_mut().unwrap().transform(&yBlock);
        let __arg_0 = self.yQuantTable.clone();
        let __arg_1 = self.dcYCodes.clone();
        let __arg_2 = self.dcYLengths.clone();
        let __arg_3 = self.acYCodes.clone();
        let __arg_4 = self.acYLengths.clone();
        let __arg_5 = self.prevDCY.clone();
        self.encodeBlock(&mut writer, yCoeffs, &__arg_0, &__arg_1, &__arg_2, &__arg_3, &__arg_4, __arg_5);
        let mut yZig : Vec<i64> = self.fdct.as_mut().unwrap().zigzag(&yCoeffs);
        let yQ : i64 = self.yQuantTable[0 as usize].clone();
        let yDC : i64 = yZig[(0) as usize];
        if  yDC >= 0 {
          self.prevDCY = (((yDC + (((yQ) >> (1)))) as f64) / (yQ as f64)) as i64 ;
        } else {
          self.prevDCY = (((yDC - (((yQ) >> (1)))) as f64) / (yQ as f64)) as i64 ;
        }
        let mut cbBlock : Vec<i64> = self.extractBlock(&mut img, blockX, blockY, 1);
        let mut cbCoeffs : Vec<i64> = self.fdct.as_mut().unwrap().transform(&cbBlock);
        let __arg_0 = self.cQuantTable.clone();
        let __arg_1 = self.dcCCodes.clone();
        let __arg_2 = self.dcCLengths.clone();
        let __arg_3 = self.acCCodes.clone();
        let __arg_4 = self.acCLengths.clone();
        let __arg_5 = self.prevDCCb.clone();
        self.encodeBlock(&mut writer, cbCoeffs, &__arg_0, &__arg_1, &__arg_2, &__arg_3, &__arg_4, __arg_5);
        let mut cbZig : Vec<i64> = self.fdct.as_mut().unwrap().zigzag(&cbCoeffs);
        let cbQ : i64 = self.cQuantTable[0 as usize].clone();
        let cbDC : i64 = cbZig[(0) as usize];
        if  cbDC >= 0 {
          self.prevDCCb = (((cbDC + (((cbQ) >> (1)))) as f64) / (cbQ as f64)) as i64 ;
        } else {
          self.prevDCCb = (((cbDC - (((cbQ) >> (1)))) as f64) / (cbQ as f64)) as i64 ;
        }
        let mut crBlock : Vec<i64> = self.extractBlock(&mut img, blockX, blockY, 2);
        let mut crCoeffs : Vec<i64> = self.fdct.as_mut().unwrap().transform(&crBlock);
        let __arg_0 = self.cQuantTable.clone();
        let __arg_1 = self.dcCCodes.clone();
        let __arg_2 = self.dcCLengths.clone();
        let __arg_3 = self.acCCodes.clone();
        let __arg_4 = self.acCLengths.clone();
        let __arg_5 = self.prevDCCr.clone();
        self.encodeBlock(&mut writer, crCoeffs, &__arg_0, &__arg_1, &__arg_2, &__arg_3, &__arg_4, __arg_5);
        let mut crZig : Vec<i64> = self.fdct.as_mut().unwrap().zigzag(&crCoeffs);
        let crQ : i64 = self.cQuantTable[0 as usize].clone();
        let crDC : i64 = crZig[(0) as usize];
        if  crDC >= 0 {
          self.prevDCCr = (((crDC + (((crQ) >> (1)))) as f64) / (crQ as f64)) as i64 ;
        } else {
          self.prevDCCr = (((crDC - (((crQ) >> (1)))) as f64) / (crQ as f64)) as i64 ;
        }
        mcuX = mcuX + 1;
      };
      mcuY = mcuY + 1;
    };
    writer.flushByte();
    let mut outBuf : Vec<u8> = writer.getBuffer();
    let outLen : i64 = writer.getLength();
    let mut finalBuf : Vec<u8> = vec![0u8; (outLen + 2) as usize];
    let mut i : i64 = 0;
    while i < outLen {
      finalBuf[(i) as usize] = outBuf[(i) as usize] as i64 as u8;
      i = i + 1;
    };
    finalBuf[(outLen) as usize] = 255 as u8;
    finalBuf[(outLen + 1) as usize] = 217 as u8;
    return finalBuf;
  }
  fn encode(&mut self, mut img : &mut ImageBuffer, dirPath : String, fileName : String) -> () {
    println!( "{}", [&*"Encoding JPEG: ".to_string(), &*fileName].concat() );
    println!( "{}", [&*([&*([&*"  Image size: ".to_string(), &*(img.width.to_string())].concat()), &*"x".to_string()].concat()), &*(img.height.to_string())].concat() );
    let mut writer : BitWriter = BitWriter::new();
    let __arg_0 = img.width.clone();
    let __arg_1 = img.height.clone();
    self.writeMarkers(&mut writer, __arg_0, __arg_1);
    let mcuWidth : i64 = (((img.width + 7) as f64) / (8 as f64)) as i64 ;
    let mcuHeight : i64 = (((img.height + 7) as f64) / (8 as f64)) as i64 ;
    println!( "{}", [&*([&*([&*"  MCU grid: ".to_string(), &*(mcuWidth.to_string())].concat()), &*"x".to_string()].concat()), &*(mcuHeight.to_string())].concat() );
    self.prevDCY = 0;
    self.prevDCCb = 0;
    self.prevDCCr = 0;
    let mut mcuY : i64 = 0;
    while mcuY < mcuHeight {
      let mut mcuX : i64 = 0;
      while mcuX < mcuWidth {
        let blockX : i64 = mcuX * 8;
        let blockY : i64 = mcuY * 8;
        let mut yBlock : Vec<i64> = self.extractBlock(&mut img, blockX, blockY, 0);
        let mut yCoeffs : Vec<i64> = self.fdct.as_mut().unwrap().transform(&yBlock);
        let __arg_0 = self.yQuantTable.clone();
        let __arg_1 = self.dcYCodes.clone();
        let __arg_2 = self.dcYLengths.clone();
        let __arg_3 = self.acYCodes.clone();
        let __arg_4 = self.acYLengths.clone();
        let __arg_5 = self.prevDCY.clone();
        self.encodeBlock(&mut writer, yCoeffs, &__arg_0, &__arg_1, &__arg_2, &__arg_3, &__arg_4, __arg_5);
        let mut yZig : Vec<i64> = self.fdct.as_mut().unwrap().zigzag(&yCoeffs);
        let yQ : i64 = self.yQuantTable[0 as usize].clone();
        let yDC : i64 = yZig[(0) as usize];
        if  yDC >= 0 {
          self.prevDCY = (((yDC + (((yQ) >> (1)))) as f64) / (yQ as f64)) as i64 ;
        } else {
          self.prevDCY = (((yDC - (((yQ) >> (1)))) as f64) / (yQ as f64)) as i64 ;
        }
        let mut cbBlock : Vec<i64> = self.extractBlock(&mut img, blockX, blockY, 1);
        let mut cbCoeffs : Vec<i64> = self.fdct.as_mut().unwrap().transform(&cbBlock);
        let __arg_0 = self.cQuantTable.clone();
        let __arg_1 = self.dcCCodes.clone();
        let __arg_2 = self.dcCLengths.clone();
        let __arg_3 = self.acCCodes.clone();
        let __arg_4 = self.acCLengths.clone();
        let __arg_5 = self.prevDCCb.clone();
        self.encodeBlock(&mut writer, cbCoeffs, &__arg_0, &__arg_1, &__arg_2, &__arg_3, &__arg_4, __arg_5);
        let mut cbZig : Vec<i64> = self.fdct.as_mut().unwrap().zigzag(&cbCoeffs);
        let cbQ : i64 = self.cQuantTable[0 as usize].clone();
        let cbDC : i64 = cbZig[(0) as usize];
        if  cbDC >= 0 {
          self.prevDCCb = (((cbDC + (((cbQ) >> (1)))) as f64) / (cbQ as f64)) as i64 ;
        } else {
          self.prevDCCb = (((cbDC - (((cbQ) >> (1)))) as f64) / (cbQ as f64)) as i64 ;
        }
        let mut crBlock : Vec<i64> = self.extractBlock(&mut img, blockX, blockY, 2);
        let mut crCoeffs : Vec<i64> = self.fdct.as_mut().unwrap().transform(&crBlock);
        let __arg_0 = self.cQuantTable.clone();
        let __arg_1 = self.dcCCodes.clone();
        let __arg_2 = self.dcCLengths.clone();
        let __arg_3 = self.acCCodes.clone();
        let __arg_4 = self.acCLengths.clone();
        let __arg_5 = self.prevDCCr.clone();
        self.encodeBlock(&mut writer, crCoeffs, &__arg_0, &__arg_1, &__arg_2, &__arg_3, &__arg_4, __arg_5);
        let mut crZig : Vec<i64> = self.fdct.as_mut().unwrap().zigzag(&crCoeffs);
        let crQ : i64 = self.cQuantTable[0 as usize].clone();
        let crDC : i64 = crZig[(0) as usize];
        if  crDC >= 0 {
          self.prevDCCr = (((crDC + (((crQ) >> (1)))) as f64) / (crQ as f64)) as i64 ;
        } else {
          self.prevDCCr = (((crDC - (((crQ) >> (1)))) as f64) / (crQ as f64)) as i64 ;
        }
        mcuX = mcuX + 1;
      };
      mcuY = mcuY + 1;
    };
    writer.flushByte();
    let mut outBuf : Vec<u8> = writer.getBuffer();
    let outLen : i64 = writer.getLength();
    let mut finalBuf : Vec<u8> = vec![0u8; (outLen + 2) as usize];
    let mut i : i64 = 0;
    while i < outLen {
      finalBuf[(i) as usize] = outBuf[(i) as usize] as i64 as u8;
      i = i + 1;
    };
    finalBuf[(outLen) as usize] = 255 as u8;
    finalBuf[(outLen + 1) as usize] = 217 as u8;
    std::fs::write(format!("{}/{}", dirPath, fileName), &finalBuf).unwrap();
    println!( "{}", [&*([&*"  Encoded size: ".to_string(), &*((outLen + 2).to_string())].concat()), &*" bytes".to_string()].concat() );
    println!( "{}", [&*([&*([&*"  Saved: ".to_string(), &*dirPath].concat()), &*"/".to_string()].concat()), &*fileName].concat() );
  }
  fn setQuality(&mut self, q : i64) -> () {
    self.quality = q;
    self.scaleQuantTables(q);
  }
}
#[derive(Clone)]
struct EmbeddedFont { 
  name : String, 
  fontObjNum : i64, 
  fontDescObjNum : i64, 
  fontFileObjNum : i64, 
  pdfName : String, 
  ttfFont : Option<TrueTypeFont>, 
}
impl EmbeddedFont { 
  
  pub fn new(n : String, pn : String, font : TrueTypeFont) ->  EmbeddedFont {
    let mut me = EmbeddedFont { 
      name:"".to_string(), 
      fontObjNum:0, 
      fontDescObjNum:0, 
      fontFileObjNum:0, 
      pdfName:"".to_string(), 
      ttfFont: None, 
    };
    me.name = n.clone();
    me.pdfName = pn.clone();
    me.ttfFont = Some(font.clone());
    return me;
  }
}
#[derive(Clone)]
struct EmbeddedImage { 
  src : String, 
  objNum : i64, 
  width : i64, 
  height : i64, 
  orientation : i64, 
  pdfName : String, 
}
impl EmbeddedImage { 
  
  pub fn new(s : String) ->  EmbeddedImage {
    let mut me = EmbeddedImage { 
      src:"".to_string(), 
      objNum:0, 
      width:0, 
      height:0, 
      orientation:1, 
      pdfName:"".to_string(), 
    };
    me.src = s.clone();
    return me;
  }
}
#[derive(Clone)]
struct PDFImageMeasurer { 
  renderer : Option<Weak<RefCell<EVGPDFRenderer>>>, 
}
impl PDFImageMeasurer { 
  
  pub fn new() ->  PDFImageMeasurer {
    let mut me = PDFImageMeasurer { 
      renderer: None, 
    };
    return me;
  }
  fn setRenderer(&mut self, mut r : Rc<RefCell<EVGPDFRenderer>>) -> () {
    self.renderer = Some(Rc::downgrade(&r));
  }
  fn getImageDimensions(&mut self, src : String) -> EVGImageDimensions {
    if  self.renderer.is_some() {
      return ((self.renderer.clone().unwrap().upgrade().unwrap().borrow_mut())).loadImageDimensions(src).clone();
    }
    let mut dims : EVGImageDimensions = EVGImageDimensions::new();
    return dims.clone();
  }
}
impl PDFImageMeasurer {
  // Inherited methods from parent class EVGImageMeasurer
  fn calculateHeightForWidth(&mut self, src : String, targetWidth : f64) -> f64 {
    let mut dims : EVGImageDimensions = EVGImageMeasurer::getImageDimensions(src.clone());
    if  dims.isValid {
      return targetWidth / dims.aspectRatio;
    }
    return targetWidth;
  }
  fn calculateWidthForHeight(&mut self, src : String, targetHeight : f64) -> f64 {
    let mut dims : EVGImageDimensions = EVGImageMeasurer::getImageDimensions(src.clone());
    if  dims.isValid {
      return targetHeight * dims.aspectRatio;
    }
    return targetHeight;
  }
  fn calculateFitDimensions(&mut self, src : String, maxWidth : f64, maxHeight : f64) -> EVGImageDimensions {
    let mut dims : EVGImageDimensions = EVGImageMeasurer::getImageDimensions(src.clone());
    if  dims.isValid == false {
      return EVGImageDimensions::create((maxWidth as i64 ), (maxHeight as i64 )).clone();
    }
    let scaleW : f64 = maxWidth / ((dims.width as f64));
    let scaleH : f64 = maxHeight / ((dims.height as f64));
    let mut scale : f64 = scaleW;
    if  scaleH < scaleW {
      scale = scaleH;
    }
    let newW : i64 = (((dims.width as f64)) * scale) as i64 ;
    let newH : i64 = (((dims.height as f64)) * scale) as i64 ;
    return EVGImageDimensions::create(newW, newH).clone();
  }
}
impl EVGImageMeasurerTrait for PDFImageMeasurer {
  fn getImageDimensions(&mut self, src : String) -> EVGImageDimensions {
    PDFImageMeasurer::getImageDimensions(self, src)
  }
  fn calculateHeightForWidth(&mut self, src : String, targetWidth : f64) -> f64 {
    PDFImageMeasurer::calculateHeightForWidth(self, src, targetWidth)
  }
  fn calculateWidthForHeight(&mut self, src : String, targetHeight : f64) -> f64 {
    PDFImageMeasurer::calculateWidthForHeight(self, src, targetHeight)
  }
  fn calculateFitDimensions(&mut self, src : String, maxWidth : f64, maxHeight : f64) -> EVGImageDimensions {
    PDFImageMeasurer::calculateFitDimensions(self, src, maxWidth, maxHeight)
  }
}
// Cannot derive Clone due to trait object fields
struct EVGPDFRenderer { 
  imageMeasurer : Option<PDFImageMeasurer>, 
  writer : Option<PDFWriter>, 
  layout : Option<EVGLayout>, 
  measurer : Option<Rc<RefCell<dyn EVGTextMeasurerTrait>>>, 
  streamBuffer : Option<GrowableBuffer>, 
  pageWidth : f64, 
  pageHeight : f64, 
  nextObjNum : i64, 
  fontObjNum : i64, 
  pagesObjNum : i64, 
  contentObjNums : Vec<i64>, 
  pageCount : i64, 
  debug : bool, 
  fontManager : FontManager, 
  embeddedFonts : Vec<EmbeddedFont>, 
  usedFontNames : Vec<String>, 
  embeddedImages : Vec<EmbeddedImage>, 
  jpegReader : JPEGReader, 
  jpegDecoder : JPEGDecoder, 
  jpegEncoder : JPEGEncoder, 
  metadataParser : JPEGMetadataParser, 
  baseDir : String, 
  assetPaths : Vec<String>, 
  maxImageWidth : i64, 
  maxImageHeight : i64, 
  jpegQuality : i64, 
  imageDimensionsCache : Vec<EVGImageDimensions>, 
  imageDimensionsCacheKeys : Vec<String>, 
  foundSections : Vec<EVGElement>, 
  foundPages : Vec<EVGElement>, 
}
impl EVGPDFRenderer { 
  
  pub fn new() ->  EVGPDFRenderer {
    let mut me = EVGPDFRenderer { 
      imageMeasurer: None, 
      writer: None, 
      layout: None, 
      measurer: None, 
      streamBuffer: None, 
      pageWidth:595_f64, 
      pageHeight:842_f64, 
      nextObjNum:1, 
      fontObjNum:0, 
      pagesObjNum:0, 
      contentObjNums: Vec::new(), 
      pageCount:1, 
      debug:false, 
      fontManager:FontManager::new(), 
      embeddedFonts: Vec::new(), 
      usedFontNames: Vec::new(), 
      embeddedImages: Vec::new(), 
      jpegReader:JPEGReader::new(), 
      jpegDecoder:JPEGDecoder::new(), 
      jpegEncoder:JPEGEncoder::new(), 
      metadataParser:JPEGMetadataParser::new(), 
      baseDir:"./".to_string(), 
      assetPaths: Vec::new(), 
      maxImageWidth:800, 
      maxImageHeight:800, 
      jpegQuality:75, 
      imageDimensionsCache: Vec::new(), 
      imageDimensionsCacheKeys: Vec::new(), 
      foundSections: Vec::new(), 
      foundPages: Vec::new(), 
    };
    let mut w : PDFWriter = PDFWriter::new();
    me.writer = Some(w.clone());
    let mut lay : EVGLayout = EVGLayout::new();
    me.layout = Some(lay);
    let mut m_1 : SimpleTextMeasurer = SimpleTextMeasurer::new();
    me.measurer = Some(Rc::new(RefCell::new(m_1.clone())));
    let mut buf_1 : GrowableBuffer = GrowableBuffer::new();
    me.streamBuffer = Some(buf_1.clone());
    let mut ef : Vec<EmbeddedFont> = Vec::new();
    me.embeddedFonts = ef.clone();
    let mut uf : Vec<String> = Vec::new();
    me.usedFontNames = uf.clone();
    let mut ei : Vec<EmbeddedImage> = Vec::new();
    me.embeddedImages = ei.clone();
    let mut idc : Vec<EVGImageDimensions> = Vec::new();
    me.imageDimensionsCache = idc.clone();
    let mut idck : Vec<String> = Vec::new();
    me.imageDimensionsCacheKeys = idck.clone();
    let mut ap : Vec<String> = Vec::new();
    me.assetPaths = ap.clone();
    let mut fs : Vec<EVGElement> = Vec::new();
    me.foundSections = fs.clone();
    let mut fp : Vec<EVGElement> = Vec::new();
    me.foundPages = fp.clone();
    let mut imgMeasurer : PDFImageMeasurer = PDFImageMeasurer::new();
    me.imageMeasurer = Some(imgMeasurer.clone());
    return me;
  }
  fn init(&mut self, mut selfRc : Rc<RefCell<EVGPDFRenderer>>) -> () {
    let mut imgM : PDFImageMeasurer = self.imageMeasurer.clone().unwrap();
    imgM.setRenderer(selfRc.clone());
    self.layout.as_mut().unwrap().setImageMeasurer(Rc::new(RefCell::new(imgM.clone())));
  }
  fn setPageSize(&mut self, width : f64, height : f64) -> () {
    self.pageWidth = width;
    self.pageHeight = height;
    self.layout.as_mut().unwrap().setPageSize(width, height);
  }
  fn setBaseDir(&mut self, dir : String) -> () {
    self.baseDir = dir.clone();
  }
  fn setAssetPaths(&mut self, paths : String) -> () {
    let mut start : i64 = 0;
    let mut i : i64 = 0;
    let __len : i64 = paths.len() as i64;
    while i <= __len {
      let mut ch : String = "".to_string();
      if  i < __len {
        ch = paths.chars().skip(i as usize).take(((i + 1) - i) as usize).collect::<String>();
      }
      if  (ch == ";".to_string()) || (i == __len) {
        if  i > start {
          let part : String = paths.chars().skip(start as usize).take((i - start) as usize).collect::<String>();
          self.assetPaths.push(part.clone());
          println!( "{}", [&*"EVGPDFRenderer: Added asset path: ".to_string(), &*part].concat() );
        }
        start = i + 1;
      }
      i = i + 1;
    };
  }
  fn resolveImagePath(&mut self, src : String) -> String {
    let mut imgSrc : String = src.clone();
    if  (src.len() as i64) > 2 {
      let prefix : String = src.chars().skip(0 as usize).take((2 - 0) as usize).collect::<String>();
      if  prefix == "./".to_string() {
        imgSrc = src.chars().skip(2 as usize).take(((src.len() as i64) - 2) as usize).collect::<String>();
      }
    }
    let fullPath : String = [&*self.baseDir, &*imgSrc].concat();
    return fullPath.clone();
  }
  fn setMeasurer(&mut self, mut m : Rc<RefCell<dyn EVGTextMeasurerTrait>>) -> () {
    self.measurer = Some(m.clone());
    self.layout.as_mut().unwrap().setMeasurer(m.clone());
  }
  fn setFontManager(&mut self, mut fm : FontManager) -> () {
    self.fontManager = fm.clone();
  }
  fn setDebug(&mut self, enabled : bool) -> () {
    self.layout.as_mut().unwrap().debug = enabled;
    self.debug = enabled;
  }
  fn loadImageDimensions(&mut self, src : String) -> EVGImageDimensions {
    let mut i : i64 = 0;
    while i < ((self.imageDimensionsCacheKeys.len() as i64)) {
      let key : String = self.imageDimensionsCacheKeys[i as usize].clone();
      if  key == src {
        return self.imageDimensionsCache[i as usize].clone().clone();
      }
      i = i + 1;
    };
    let mut dims : EVGImageDimensions = EVGImageDimensions::new();
    let mut imgDir : String = "".to_string();
    let mut imgFile : String = "".to_string();
    let mut imgSrc : String = src.clone();
    if  (src.len() as i64) > 2 {
      let prefix : String = src.chars().skip(0 as usize).take((2 - 0) as usize).collect::<String>();
      if  prefix == "./".to_string() {
        imgSrc = src.chars().skip(2 as usize).take(((src.len() as i64) - 2) as usize).collect::<String>();
      }
    }
    let lastSlash : i64 = (imgSrc.rfind(&*"/".to_string()).map(|i| i as i64).unwrap_or(-1));
    let lastBackslash : i64 = (imgSrc.rfind(&*"\\".to_string()).map(|i| i as i64).unwrap_or(-1));
    let mut lastSep : i64 = lastSlash;
    if  lastBackslash > lastSep {
      lastSep = lastBackslash;
    }
    if  lastSep >= 0 {
      imgDir = [&*self.baseDir, &*(imgSrc.chars().skip(0 as usize).take(((lastSep + 1) - 0) as usize).collect::<String>())].concat();
      imgFile = imgSrc.chars().skip((lastSep + 1) as usize).take(((imgSrc.len() as i64) - (lastSep + 1)) as usize).collect::<String>();
    } else {
      imgDir = self.baseDir.clone();
      imgFile = imgSrc.clone();
    }
    let mut reader : JPEGReader = JPEGReader::new();
    let mut jpegImage : JPEGImage = reader.readJPEG(imgDir.clone(), imgFile.clone());
    if  jpegImage.isValid {
      let mut metaInfo : JPEGMetadataInfo = self.metadataParser.parseMetadata(imgDir.clone(), imgFile.clone());
      let orientation : i64 = metaInfo.orientation;
      let mut imgW : i64 = jpegImage.width;
      let mut imgH : i64 = jpegImage.height;
      if  (((orientation == 5) || (orientation == 6)) || (orientation == 7)) || (orientation == 8) {
        let tmp : i64 = imgW;
        imgW = imgH;
        imgH = tmp;
      }
      dims = EVGImageDimensions::create(imgW, imgH);
      println!( "{}", [&*([&*([&*([&*([&*([&*([&*([&*"Image dimensions: ".to_string(), &*src].concat()), &*" = ".to_string()].concat()), &*(imgW.to_string())].concat()), &*"x".to_string()].concat()), &*(imgH.to_string())].concat()), &*" (orientation=".to_string()].concat()), &*(orientation.to_string())].concat()), &*")".to_string()].concat() );
    }
    self.imageDimensionsCacheKeys.push(src.clone());
    self.imageDimensionsCache.push(dims.clone());
    return dims.clone();
  }
  fn getPdfFontName(&mut self, fontFamily : String) -> String {
    let mut i : i64 = 0;
    while i < ((self.usedFontNames.len() as i64)) {
      let name : String = self.usedFontNames[i as usize].clone();
      if  name == fontFamily {
        return [&*"/F".to_string(), &*((i + 1).to_string())].concat().clone();
      }
      i = i + 1;
    };
    self.usedFontNames.push(fontFamily.clone());
    return [&*"/F".to_string(), &*(((self.usedFontNames.len() as i64)).to_string())].concat().clone();
  }
  fn render(&mut self, mut root : &mut EVGElement) -> Vec<u8> {
    if  root.tagName == "print".to_string() {
      return self.renderMultiPageToPDF(&mut root);
    }
    self.layout.as_mut().unwrap().layout(&mut root);
    return self.renderToPDF(&mut root);
  }
  fn findPageElementsRecursive(&mut self, mut el : &mut EVGElement) -> () {
    if  el.tagName == "page".to_string() {
      self.foundPages.push(el.clone());
    }
    let mut i : i64 = 0;
    let childCount : i64 = el.getChildCount();
    while i < childCount {
      let mut child : EVGElement = el.getChild(i);
      self.findPageElementsRecursive(&mut child);
      i = i + 1;
    };
  }
  fn findSectionElementsRecursive(&mut self, mut el : &mut EVGElement) -> () {
    let mut i : i64 = 0;
    let childCount : i64 = el.getChildCount();
    while i < childCount {
      let mut child : EVGElement = el.getChild(i);
      if  child.tagName == "section".to_string() {
        self.foundSections.push(child.clone());
      }
      i = i + 1;
    };
  }
  fn getSectionPageWidth(&mut self, mut section : EVGElement) -> f64 {
    if  section.width.as_mut().unwrap().isSet {
      return section.width.as_mut().unwrap().pixels;
    }
    return 595_f64;
  }
  fn getSectionPageHeight(&mut self, mut section : EVGElement) -> f64 {
    if  section.height.as_mut().unwrap().isSet {
      return section.height.as_mut().unwrap().pixels;
    }
    return 842_f64;
  }
  fn getSectionMargin(&mut self, mut section : EVGElement) -> f64 {
    let mut m : EVGUnit = section.r#box.as_mut().unwrap().marginTop.clone().unwrap().clone();
    if  m.isSet {
      return m.pixels;
    }
    return 40_f64;
  }
  fn renderMultiPageToPDF(&mut self, mut root : &mut EVGElement) -> Vec<u8> {
    let mut pdf : GrowableBuffer = GrowableBuffer::new();
    self.nextObjNum = 1;
    if  root.imageQuality > 0 {
      self.jpegQuality = root.imageQuality;
      println!( "{}", [&*"Image quality: ".to_string(), &*(self.jpegQuality.to_string())].concat() );
    }
    if  root.maxImageSize > 0 {
      self.maxImageWidth = root.maxImageSize;
      self.maxImageHeight = root.maxImageSize;
      println!( "{}", [&*([&*"Max image size: ".to_string(), &*(self.maxImageWidth.to_string())].concat()), &*"px".to_string()].concat() );
    }
    pdf.writeString("%PDF-1.5\n".to_string());
    pdf.writeByte(37);
    pdf.writeByte(226);
    pdf.writeByte(227);
    pdf.writeByte(207);
    pdf.writeByte(211);
    pdf.writeByte(10);
    let mut objectOffsets : Vec<i64> = Vec::new();
    let mut emptyArr : Vec<EVGElement> = Vec::new();
    self.foundSections = emptyArr.clone();
    self.findSectionElementsRecursive(&mut root);
    let mut allPages : Vec<EVGElement> = Vec::new();
    let mut allPageWidths : Vec<f64> = Vec::new();
    let mut allPageHeights : Vec<f64> = Vec::new();
    let mut allPageMargins : Vec<f64> = Vec::new();
    let mut si : i64 = 0;
    while si < ((self.foundSections.len() as i64)) {
      let mut section : EVGElement = self.foundSections[si as usize].clone();
      let sectionWidth : f64 = self.getSectionPageWidth(section.clone());
      let sectionHeight : f64 = self.getSectionPageHeight(section.clone());
      let sectionMargin : f64 = self.getSectionMargin(section.clone());
      let mut emptyPages : Vec<EVGElement> = Vec::new();
      self.foundPages = emptyPages.clone();
      self.findPageElementsRecursive(&mut section);
      let mut pi : i64 = 0;
      while pi < ((self.foundPages.len() as i64)) {
        let mut pg : EVGElement = self.foundPages[pi as usize].clone();
        allPages.push(pg.clone());
        allPageWidths.push(sectionWidth.clone());
        allPageHeights.push(sectionHeight.clone());
        allPageMargins.push(sectionMargin.clone());
        let contentWidth : f64 = sectionWidth - (sectionMargin * 2_f64);
        let contentHeight : f64 = sectionHeight - (sectionMargin * 2_f64);
        println!( "{}", [&*([&*([&*([&*([&*"Page ".to_string(), &*((pi + 1).to_string())].concat()), &*" content size: ".to_string()].concat()), &*(contentWidth.to_string())].concat()), &*" x ".to_string()].concat()), &*(contentHeight.to_string())].concat() );
        self.layout.as_mut().unwrap().pageWidth = contentWidth;
        self.layout.as_mut().unwrap().pageHeight = contentHeight;
        pg.resetLayoutState();
        pg.width.as_mut().unwrap().pixels = contentWidth;
        pg.width.as_mut().unwrap().value = contentWidth;
        pg.width.as_mut().unwrap().unitType = 0;
        pg.width.as_mut().unwrap().isSet = true;
        pg.height.as_mut().unwrap().pixels = contentHeight;
        pg.height.as_mut().unwrap().value = contentHeight;
        pg.height.as_mut().unwrap().unitType = 0;
        pg.height.as_mut().unwrap().isSet = true;
        self.layout.as_mut().unwrap().layout(&mut pg);
        println!( "{}", [&*([&*([&*"  After layout: pg.calculatedWidth=".to_string(), &*(pg.calculatedWidth.to_string())].concat()), &*" pg.calculatedHeight=".to_string()].concat()), &*(pg.calculatedHeight.to_string())].concat() );
        if  pg.getChildCount() > 0 {
          let mut firstChild : EVGElement = pg.getChild(0);
          println!( "{}", [&*([&*([&*"  First child: w=".to_string(), &*(firstChild.calculatedWidth.to_string())].concat()), &*" h=".to_string()].concat()), &*(firstChild.calculatedHeight.to_string())].concat() );
        }
        pi = pi + 1;
      };
      si = si + 1;
    };
    if  ((allPages.len() as i64)) == 0 {
      self.layout.as_mut().unwrap().layout(&mut root);
      allPages.push(root.clone());
      allPageWidths.push(self.pageWidth.clone());
      allPageHeights.push(self.pageHeight.clone());
      allPageMargins.push(0_f64);
    }
    let numPages : i64 = (allPages.len() as i64);
    println!( "{}", [&*([&*"Rendering ".to_string(), &*(numPages.to_string())].concat()), &*" pages".to_string()].concat() );
    let mut contentDataList : Vec<Vec<u8>> = Vec::new();
    let mut pgi : i64 = 0;
    while pgi < numPages {
      let mut pg_1 : EVGElement = allPages[pgi as usize].clone();
      // unused:  let pgWidth : f64 = allPageWidths[pgi as usize].clone();
      let pgHeight : f64 = allPageHeights[pgi as usize].clone();
      let pgMargin : f64 = allPageMargins[pgi as usize].clone();
      self.pageHeight = pgHeight;
      self.streamBuffer.as_mut().unwrap().clear();
      self.renderElement(&mut pg_1, pgMargin, pgMargin);
      let mut contentData : Vec<u8> = self.streamBuffer.as_mut().unwrap().toBuffer();
      contentDataList.push(contentData.clone());
      println!( "{}", [&*([&*([&*([&*"  Page ".to_string(), &*((pgi + 1).to_string())].concat()), &*": ".to_string()].concat()), &*((contentData.len() as i64).to_string())].concat()), &*" bytes".to_string()].concat() );
      pgi = pgi + 1;
    };
    let mut fontObjNums : Vec<i64> = Vec::new();
    let mut fi : i64 = 0;
    while fi < ((self.usedFontNames.len() as i64)) {
      let fontName : String = self.usedFontNames[fi as usize].clone();
      let mut ttfFont : TrueTypeFont = self.fontManager.getFont(fontName.clone());
      if  ttfFont.unitsPerEm > 0 {
        let mut fontFileData : Vec<u8> = ttfFont.getFontData();
        let fontFileLen : i64 = fontFileData.len() as i64;
        objectOffsets.push((pdf).size());
        pdf.writeString([&*(self.nextObjNum.to_string()), &*" 0 obj\n".to_string()].concat());
        pdf.writeString([&*([&*([&*([&*"<< /Length ".to_string(), &*(fontFileLen.to_string())].concat()), &*" /Length1 ".to_string()].concat()), &*(fontFileLen.to_string())].concat()), &*" >>\n".to_string()].concat());
        pdf.writeString("stream\n".to_string());
        pdf.writeBuffer(&fontFileData);
        pdf.writeString("\nendstream\n".to_string());
        pdf.writeString("endobj\n\n".to_string());
        let fontFileObjNum : i64 = self.nextObjNum;
        self.nextObjNum = self.nextObjNum + 1;
        objectOffsets.push((pdf).size());
        pdf.writeString([&*(self.nextObjNum.to_string()), &*" 0 obj\n".to_string()].concat());
        pdf.writeString("<< /Type /FontDescriptor".to_string());
        pdf.writeString([&*" /FontName /".to_string(), &*EVGPDFRenderer::sanitizeFontName(ttfFont.fontFamily.clone())].concat());
        pdf.writeString(" /Flags 32".to_string());
        pdf.writeString([&*([&*([&*([&*" /FontBBox [0 ".to_string(), &*(ttfFont.descender.to_string())].concat()), &*" 1000 ".to_string()].concat()), &*(ttfFont.ascender.to_string())].concat()), &*"]".to_string()].concat());
        pdf.writeString(" /ItalicAngle 0".to_string());
        pdf.writeString([&*" /Ascent ".to_string(), &*(ttfFont.ascender.to_string())].concat());
        pdf.writeString([&*" /Descent ".to_string(), &*(ttfFont.descender.to_string())].concat());
        pdf.writeString([&*" /CapHeight ".to_string(), &*(ttfFont.ascender.to_string())].concat());
        pdf.writeString(" /StemV 80".to_string());
        pdf.writeString([&*([&*" /FontFile2 ".to_string(), &*(fontFileObjNum.to_string())].concat()), &*" 0 R".to_string()].concat());
        pdf.writeString(" >>\n".to_string());
        pdf.writeString("endobj\n\n".to_string());
        let fontDescObjNum : i64 = self.nextObjNum;
        self.nextObjNum = self.nextObjNum + 1;
        objectOffsets.push((pdf).size());
        pdf.writeString([&*(self.nextObjNum.to_string()), &*" 0 obj\n".to_string()].concat());
        let mut toUnicodeStream : String = "/CIDInit /ProcSet findresource begin\n12 dict begin\nbegincmap\n/CIDSystemInfo << /Registry (Adobe) /Ordering (UCS) /Supplement 0 >> def\n/CMapName /Adobe-Identity-UCS def\n/CMapType 2 def\n1 begincodespacerange\n<00> <FF>\nendcodespacerange\n".to_string();
        toUnicodeStream = [&*toUnicodeStream, &*"2 beginbfrange\n<20> <7E> <0020>\n<A0> <FF> <00A0>\nendbfrange\n".to_string()].concat();
        toUnicodeStream = [&*toUnicodeStream, &*"endcmap\nCMapName currentdict /CMap defineresource pop\nend\nend".to_string()].concat();
        let toUnicodeLen : i64 = toUnicodeStream.len() as i64;
        pdf.writeString([&*([&*"<< /Length ".to_string(), &*(toUnicodeLen.to_string())].concat()), &*" >>\n".to_string()].concat());
        pdf.writeString("stream\n".to_string());
        pdf.writeString(toUnicodeStream.clone());
        pdf.writeString("\nendstream\n".to_string());
        pdf.writeString("endobj\n\n".to_string());
        let toUnicodeObjNum : i64 = self.nextObjNum;
        self.nextObjNum = self.nextObjNum + 1;
        objectOffsets.push((pdf).size());
        pdf.writeString([&*(self.nextObjNum.to_string()), &*" 0 obj\n".to_string()].concat());
        pdf.writeString("<< /Type /Font".to_string());
        pdf.writeString(" /Subtype /TrueType".to_string());
        pdf.writeString([&*" /BaseFont /".to_string(), &*EVGPDFRenderer::sanitizeFontName(ttfFont.fontFamily.clone())].concat());
        pdf.writeString(" /FirstChar 32".to_string());
        pdf.writeString(" /LastChar 255".to_string());
        pdf.writeString(" /Widths [".to_string());
        let mut ch : i64 = 32;
        while ch <= 255 {
          let cw : i64 = ttfFont.getCharWidth(ch);
          let scaledWd : f64 = (((cw as f64)) * 1000_f64) / ((ttfFont.unitsPerEm as f64));
          let scaledW : i64 = scaledWd as i64 ;
          pdf.writeString(scaledW.to_string());
          if  ch < 255 {
            pdf.writeString(" ".to_string());
          }
          ch = ch + 1;
        };
        pdf.writeString("]".to_string());
        pdf.writeString([&*([&*" /FontDescriptor ".to_string(), &*(fontDescObjNum.to_string())].concat()), &*" 0 R".to_string()].concat());
        pdf.writeString(" /Encoding /WinAnsiEncoding".to_string());
        pdf.writeString([&*([&*" /ToUnicode ".to_string(), &*(toUnicodeObjNum.to_string())].concat()), &*" 0 R".to_string()].concat());
        pdf.writeString(" >>\n".to_string());
        pdf.writeString("endobj\n\n".to_string());
        fontObjNums.push(self.nextObjNum.clone());
        self.nextObjNum = self.nextObjNum + 1;
      } else {
        objectOffsets.push((pdf).size());
        pdf.writeString([&*(self.nextObjNum.to_string()), &*" 0 obj\n".to_string()].concat());
        pdf.writeString("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\n".to_string());
        pdf.writeString("endobj\n\n".to_string());
        fontObjNums.push(self.nextObjNum.clone());
        self.nextObjNum = self.nextObjNum + 1;
      }
      fi = fi + 1;
    };
    if  ((fontObjNums.len() as i64)) == 0 {
      objectOffsets.push((pdf).size());
      pdf.writeString([&*(self.nextObjNum.to_string()), &*" 0 obj\n".to_string()].concat());
      pdf.writeString("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\n".to_string());
      pdf.writeString("endobj\n\n".to_string());
      fontObjNums.push(self.nextObjNum.clone());
      self.nextObjNum = self.nextObjNum + 1;
    }
    let mut imgIdx : i64 = 0;
    while imgIdx < ((self.embeddedImages.len() as i64)) {
      let mut embImg : EmbeddedImage = self.embeddedImages[imgIdx as usize].clone();
      let mut imgSrc : String = embImg.src.clone();
      let mut imgDir : String = self.baseDir.clone();
      let mut imgFile : String = imgSrc.clone();
      if  (imgSrc.len() as i64) > 2 {
        let prefix : String = imgSrc.chars().skip(0 as usize).take((2 - 0) as usize).collect::<String>();
        if  prefix == "./".to_string() {
          imgSrc = imgSrc.chars().skip(2 as usize).take(((imgSrc.len() as i64) - 2) as usize).collect::<String>();
        }
      }
      let lastSlash : i64 = (imgSrc.rfind(&*"/".to_string()).map(|i| i as i64).unwrap_or(-1));
      let lastBackslash : i64 = (imgSrc.rfind(&*"\\".to_string()).map(|i| i as i64).unwrap_or(-1));
      let mut lastSep : i64 = lastSlash;
      if  lastBackslash > lastSep {
        lastSep = lastBackslash;
      }
      if  lastSep >= 0 {
        imgDir = [&*self.baseDir, &*(imgSrc.chars().skip(0 as usize).take(((lastSep + 1) - 0) as usize).collect::<String>())].concat();
        imgFile = imgSrc.chars().skip((lastSep + 1) as usize).take(((imgSrc.len() as i64) - (lastSep + 1)) as usize).collect::<String>();
      } else {
        imgDir = self.baseDir.clone();
        imgFile = imgSrc.clone();
      }
      println!( "{}", [&*([&*([&*"Loading image: dir=".to_string(), &*imgDir].concat()), &*" file=".to_string()].concat()), &*imgFile].concat() );
      let mut metaInfo : JPEGMetadataInfo = self.metadataParser.parseMetadata(imgDir.clone(), imgFile.clone());
      embImg.orientation = metaInfo.orientation;
      let mut imgBuffer : ImageBuffer = self.jpegDecoder.decode(imgDir.clone(), imgFile.clone());
      if  (imgBuffer.width > 1) && (imgBuffer.height > 1) {
        if  metaInfo.orientation > 1 {
          println!( "{}", [&*"  Applying EXIF orientation: ".to_string(), &*(metaInfo.orientation.to_string())].concat() );
          imgBuffer = imgBuffer.applyExifOrientation(metaInfo.orientation);
        }
        let origW : i64 = imgBuffer.width;
        let origH : i64 = imgBuffer.height;
        let mut newW : i64 = origW;
        let mut newH : i64 = origH;
        if  (origW > self.maxImageWidth) || (origH > self.maxImageHeight) {
          let scaleW : f64 = ((self.maxImageWidth as f64)) / ((origW as f64));
          let scaleH : f64 = ((self.maxImageHeight as f64)) / ((origH as f64));
          let mut scale : f64 = scaleW;
          if  scaleH < scaleW {
            scale = scaleH;
          }
          newW = (((origW as f64)) * scale) as i64 ;
          newH = (((origH as f64)) * scale) as i64 ;
          println!( "{}", [&*([&*([&*([&*([&*([&*([&*"  Resizing from ".to_string(), &*(origW.to_string())].concat()), &*"x".to_string()].concat()), &*(origH.to_string())].concat()), &*" to ".to_string()].concat()), &*(newW.to_string())].concat()), &*"x".to_string()].concat()), &*(newH.to_string())].concat() );
          imgBuffer = imgBuffer.scaleToSize(newW, newH);
        }
        let __arg_0 = self.jpegQuality.clone();
        self.jpegEncoder.setQuality(__arg_0);
        let mut encodedData : Vec<u8> = self.jpegEncoder.encodeToBuffer(&mut imgBuffer);
        let encodedLen : i64 = encodedData.len() as i64;
        embImg.width = newW;
        embImg.height = newH;
        objectOffsets.push((pdf).size());
        pdf.writeString([&*(self.nextObjNum.to_string()), &*" 0 obj\n".to_string()].concat());
        pdf.writeString("<< /Type /XObject".to_string());
        pdf.writeString(" /Subtype /Image".to_string());
        pdf.writeString([&*" /Width ".to_string(), &*(newW.to_string())].concat());
        pdf.writeString([&*" /Height ".to_string(), &*(newH.to_string())].concat());
        pdf.writeString(" /ColorSpace /DeviceRGB".to_string());
        pdf.writeString(" /BitsPerComponent 8".to_string());
        pdf.writeString(" /Filter /DCTDecode".to_string());
        pdf.writeString([&*" /Length ".to_string(), &*(encodedLen.to_string())].concat());
        pdf.writeString(" >>\n".to_string());
        pdf.writeString("stream\n".to_string());
        pdf.writeBuffer(&encodedData);
        pdf.writeString("\nendstream\n".to_string());
        pdf.writeString("endobj\n\n".to_string());
        embImg.objNum = self.nextObjNum;
        embImg.pdfName = [&*"/Im".to_string(), &*((imgIdx + 1).to_string())].concat();
        self.nextObjNum = self.nextObjNum + 1;
        println!( "{}", [&*([&*([&*([&*([&*([&*"Embedded image: ".to_string(), &*embImg.src].concat()), &*" (".to_string()].concat()), &*(newW.to_string())].concat()), &*"x".to_string()].concat()), &*(newH.to_string())].concat()), &*")".to_string()].concat() );
      } else {
        println!( "{}", [&*"Failed to decode image: ".to_string(), &*embImg.src].concat() );
      }
      imgIdx = imgIdx + 1;
    };
    let mut contentObjNumList : Vec<i64> = Vec::new();
    let mut ci : i64 = 0;
    while ci < numPages {
      let mut contentData_1 : Vec<u8> = contentDataList[ci as usize].clone();
      let contentLen : i64 = contentData_1.len() as i64;
      objectOffsets.push((pdf).size());
      pdf.writeString([&*(self.nextObjNum.to_string()), &*" 0 obj\n".to_string()].concat());
      pdf.writeString([&*([&*"<< /Length ".to_string(), &*(contentLen.to_string())].concat()), &*" >>\n".to_string()].concat());
      pdf.writeString("stream\n".to_string());
      pdf.writeBuffer(&contentData_1);
      pdf.writeString("\nendstream\n".to_string());
      pdf.writeString("endobj\n\n".to_string());
      contentObjNumList.push(self.nextObjNum.clone());
      self.nextObjNum = self.nextObjNum + 1;
      ci = ci + 1;
    };
    let mut pageObjNumList : Vec<i64> = Vec::new();
    let pagesRefNum : i64 = self.nextObjNum + numPages;
    let mut pi2 : i64 = 0;
    while pi2 < numPages {
      let pgWidth_1 : f64 = allPageWidths[pi2 as usize].clone();
      let pgHeight_1 : f64 = allPageHeights[pi2 as usize].clone();
      let contentObjN : i64 = contentObjNumList[pi2 as usize].clone();
      objectOffsets.push((pdf).size());
      pdf.writeString([&*(self.nextObjNum.to_string()), &*" 0 obj\n".to_string()].concat());
      pdf.writeString([&*([&*"<< /Type /Page /Parent ".to_string(), &*(pagesRefNum.to_string())].concat()), &*" 0 R".to_string()].concat());
      pdf.writeString([&*([&*([&*([&*" /MediaBox [0 0 ".to_string(), &*EVGPDFRenderer::formatNum(pgWidth_1)].concat()), &*" ".to_string()].concat()), &*EVGPDFRenderer::formatNum(pgHeight_1)].concat()), &*"]".to_string()].concat());
      pdf.writeString([&*([&*" /Contents ".to_string(), &*(contentObjN.to_string())].concat()), &*" 0 R".to_string()].concat());
      pdf.writeString(" /Resources <<".to_string());
      pdf.writeString(" /Font <<".to_string());
      let mut ffi : i64 = 0;
      while ffi < ((fontObjNums.len() as i64)) {
        let fontObjN : i64 = fontObjNums[ffi as usize].clone();
        pdf.writeString([&*([&*([&*([&*" /F".to_string(), &*((ffi + 1).to_string())].concat()), &*" ".to_string()].concat()), &*(fontObjN.to_string())].concat()), &*" 0 R".to_string()].concat());
        ffi = ffi + 1;
      };
      pdf.writeString(" >>".to_string());
      if  ((self.embeddedImages.len() as i64)) > 0 {
        pdf.writeString(" /XObject <<".to_string());
        let mut ii : i64 = 0;
        while ii < ((self.embeddedImages.len() as i64)) {
          let mut embImg_1 : EmbeddedImage = self.embeddedImages[ii as usize].clone();
          if  embImg_1.objNum > 0 {
            pdf.writeString([&*([&*([&*([&*" /Im".to_string(), &*((ii + 1).to_string())].concat()), &*" ".to_string()].concat()), &*(embImg_1.objNum.to_string())].concat()), &*" 0 R".to_string()].concat());
          }
          ii = ii + 1;
        };
        pdf.writeString(" >>".to_string());
      }
      pdf.writeString(" >> >>\n".to_string());
      pdf.writeString("endobj\n\n".to_string());
      pageObjNumList.push(self.nextObjNum.clone());
      self.nextObjNum = self.nextObjNum + 1;
      pi2 = pi2 + 1;
    };
    objectOffsets.push((pdf).size());
    pdf.writeString([&*(self.nextObjNum.to_string()), &*" 0 obj\n".to_string()].concat());
    pdf.writeString("<< /Type /Pages /Kids [".to_string());
    let mut ki : i64 = 0;
    while ki < numPages {
      let pageObjN : i64 = pageObjNumList[ki as usize].clone();
      pdf.writeString([&*(pageObjN.to_string()), &*" 0 R".to_string()].concat());
      if  ki < (numPages - 1) {
        pdf.writeString(" ".to_string());
      }
      ki = ki + 1;
    };
    pdf.writeString([&*([&*"] /Count ".to_string(), &*(numPages.to_string())].concat()), &*" >>\n".to_string()].concat());
    pdf.writeString("endobj\n\n".to_string());
    self.pagesObjNum = self.nextObjNum;
    self.nextObjNum = self.nextObjNum + 1;
    objectOffsets.push((pdf).size());
    pdf.writeString([&*(self.nextObjNum.to_string()), &*" 0 obj\n".to_string()].concat());
    pdf.writeString([&*([&*"<< /Type /Catalog /Pages ".to_string(), &*(self.pagesObjNum.to_string())].concat()), &*" 0 R >>\n".to_string()].concat());
    pdf.writeString("endobj\n\n".to_string());
    let catalogObjNum : i64 = self.nextObjNum;
    self.nextObjNum = self.nextObjNum + 1;
    let xrefOffset : i64 = (pdf).size();
    pdf.writeString("xref\n".to_string());
    pdf.writeString([&*([&*"0 ".to_string(), &*(self.nextObjNum.to_string())].concat()), &*"\n".to_string()].concat());
    pdf.writeString("0000000000 65535 f \n".to_string());
    let mut xi : i64 = 0;
    while xi < ((objectOffsets.len() as i64)) {
      let offset : i64 = objectOffsets[xi as usize].clone();
      pdf.writeString([&*EVGPDFRenderer::padLeft((offset.to_string()), 10, "0".to_string()), &*" 00000 n \n".to_string()].concat());
      xi = xi + 1;
    };
    pdf.writeString("trailer\n".to_string());
    pdf.writeString([&*([&*([&*([&*"<< /Size ".to_string(), &*(self.nextObjNum.to_string())].concat()), &*" /Root ".to_string()].concat()), &*(catalogObjNum.to_string())].concat()), &*" 0 R >>\n".to_string()].concat());
    pdf.writeString("startxref\n".to_string());
    pdf.writeString([&*(xrefOffset.to_string()), &*"\n".to_string()].concat());
    pdf.writeString("%%EOF\n".to_string());
    return pdf.toBuffer();
  }
  fn renderToPDF(&mut self, mut root : &mut EVGElement) -> Vec<u8> {
    let mut pdf : GrowableBuffer = GrowableBuffer::new();
    self.nextObjNum = 1;
    pdf.writeString("%PDF-1.5\n".to_string());
    pdf.writeByte(37);
    pdf.writeByte(226);
    pdf.writeByte(227);
    pdf.writeByte(207);
    pdf.writeByte(211);
    pdf.writeByte(10);
    let mut objectOffsets : Vec<i64> = Vec::new();
    self.streamBuffer.as_mut().unwrap().clear();
    self.renderElement(&mut root, 0_f64, 0_f64);
    let mut contentData : Vec<u8> = self.streamBuffer.as_mut().unwrap().toBuffer();
    let contentLen : i64 = contentData.len() as i64;
    let mut fontObjNums : Vec<i64> = Vec::new();
    let mut i : i64 = 0;
    while i < ((self.usedFontNames.len() as i64)) {
      let fontName : String = self.usedFontNames[i as usize].clone();
      let mut ttfFont : TrueTypeFont = self.fontManager.getFont(fontName.clone());
      if  ttfFont.unitsPerEm > 0 {
        let mut fontFileData : Vec<u8> = ttfFont.getFontData();
        let fontFileLen : i64 = fontFileData.len() as i64;
        objectOffsets.push((pdf).size());
        pdf.writeString([&*(self.nextObjNum.to_string()), &*" 0 obj\n".to_string()].concat());
        pdf.writeString([&*([&*([&*([&*"<< /Length ".to_string(), &*(fontFileLen.to_string())].concat()), &*" /Length1 ".to_string()].concat()), &*(fontFileLen.to_string())].concat()), &*" >>\n".to_string()].concat());
        pdf.writeString("stream\n".to_string());
        pdf.writeBuffer(&fontFileData);
        pdf.writeString("\nendstream\n".to_string());
        pdf.writeString("endobj\n\n".to_string());
        let fontFileObjNum : i64 = self.nextObjNum;
        self.nextObjNum = self.nextObjNum + 1;
        objectOffsets.push((pdf).size());
        pdf.writeString([&*(self.nextObjNum.to_string()), &*" 0 obj\n".to_string()].concat());
        pdf.writeString("<< /Type /FontDescriptor".to_string());
        pdf.writeString([&*" /FontName /".to_string(), &*EVGPDFRenderer::sanitizeFontName(ttfFont.fontFamily.clone())].concat());
        pdf.writeString(" /Flags 32".to_string());
        pdf.writeString([&*([&*([&*([&*" /FontBBox [0 ".to_string(), &*(ttfFont.descender.to_string())].concat()), &*" 1000 ".to_string()].concat()), &*(ttfFont.ascender.to_string())].concat()), &*"]".to_string()].concat());
        pdf.writeString(" /ItalicAngle 0".to_string());
        pdf.writeString([&*" /Ascent ".to_string(), &*(ttfFont.ascender.to_string())].concat());
        pdf.writeString([&*" /Descent ".to_string(), &*(ttfFont.descender.to_string())].concat());
        pdf.writeString([&*" /CapHeight ".to_string(), &*(ttfFont.ascender.to_string())].concat());
        pdf.writeString(" /StemV 80".to_string());
        pdf.writeString([&*([&*" /FontFile2 ".to_string(), &*(fontFileObjNum.to_string())].concat()), &*" 0 R".to_string()].concat());
        pdf.writeString(" >>\n".to_string());
        pdf.writeString("endobj\n\n".to_string());
        let fontDescObjNum : i64 = self.nextObjNum;
        self.nextObjNum = self.nextObjNum + 1;
        objectOffsets.push((pdf).size());
        pdf.writeString([&*(self.nextObjNum.to_string()), &*" 0 obj\n".to_string()].concat());
        let mut toUnicodeStream : String = "/CIDInit /ProcSet findresource begin\n12 dict begin\nbegincmap\n/CIDSystemInfo << /Registry (Adobe) /Ordering (UCS) /Supplement 0 >> def\n/CMapName /Adobe-Identity-UCS def\n/CMapType 2 def\n1 begincodespacerange\n<00> <FF>\nendcodespacerange\n".to_string();
        toUnicodeStream = [&*toUnicodeStream, &*"2 beginbfrange\n<20> <7E> <0020>\n<A0> <FF> <00A0>\nendbfrange\n".to_string()].concat();
        toUnicodeStream = [&*toUnicodeStream, &*"endcmap\nCMapName currentdict /CMap defineresource pop\nend\nend".to_string()].concat();
        let toUnicodeLen : i64 = toUnicodeStream.len() as i64;
        pdf.writeString([&*([&*"<< /Length ".to_string(), &*(toUnicodeLen.to_string())].concat()), &*" >>\n".to_string()].concat());
        pdf.writeString("stream\n".to_string());
        pdf.writeString(toUnicodeStream.clone());
        pdf.writeString("\nendstream\n".to_string());
        pdf.writeString("endobj\n\n".to_string());
        let toUnicodeObjNum : i64 = self.nextObjNum;
        self.nextObjNum = self.nextObjNum + 1;
        objectOffsets.push((pdf).size());
        pdf.writeString([&*(self.nextObjNum.to_string()), &*" 0 obj\n".to_string()].concat());
        pdf.writeString("<< /Type /Font".to_string());
        pdf.writeString(" /Subtype /TrueType".to_string());
        pdf.writeString([&*" /BaseFont /".to_string(), &*EVGPDFRenderer::sanitizeFontName(ttfFont.fontFamily.clone())].concat());
        pdf.writeString(" /FirstChar 32".to_string());
        pdf.writeString(" /LastChar 255".to_string());
        pdf.writeString(" /Widths [".to_string());
        let mut ch : i64 = 32;
        while ch <= 255 {
          let w : i64 = ttfFont.getCharWidth(ch);
          let scaledWd : f64 = (((w as f64)) * 1000_f64) / ((ttfFont.unitsPerEm as f64));
          let scaledW : i64 = scaledWd as i64 ;
          pdf.writeString(scaledW.to_string());
          if  ch < 255 {
            pdf.writeString(" ".to_string());
          }
          ch = ch + 1;
        };
        pdf.writeString("]".to_string());
        pdf.writeString([&*([&*" /FontDescriptor ".to_string(), &*(fontDescObjNum.to_string())].concat()), &*" 0 R".to_string()].concat());
        pdf.writeString(" /Encoding /WinAnsiEncoding".to_string());
        pdf.writeString([&*([&*" /ToUnicode ".to_string(), &*(toUnicodeObjNum.to_string())].concat()), &*" 0 R".to_string()].concat());
        pdf.writeString(" >>\n".to_string());
        pdf.writeString("endobj\n\n".to_string());
        fontObjNums.push(self.nextObjNum.clone());
        self.nextObjNum = self.nextObjNum + 1;
      } else {
        objectOffsets.push((pdf).size());
        pdf.writeString([&*(self.nextObjNum.to_string()), &*" 0 obj\n".to_string()].concat());
        pdf.writeString("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\n".to_string());
        pdf.writeString("endobj\n\n".to_string());
        fontObjNums.push(self.nextObjNum.clone());
        self.nextObjNum = self.nextObjNum + 1;
      }
      i = i + 1;
    };
    if  ((fontObjNums.len() as i64)) == 0 {
      objectOffsets.push((pdf).size());
      pdf.writeString([&*(self.nextObjNum.to_string()), &*" 0 obj\n".to_string()].concat());
      pdf.writeString("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\n".to_string());
      pdf.writeString("endobj\n\n".to_string());
      fontObjNums.push(self.nextObjNum.clone());
      self.nextObjNum = self.nextObjNum + 1;
    }
    let mut imgIdx : i64 = 0;
    while imgIdx < ((self.embeddedImages.len() as i64)) {
      let mut embImg : EmbeddedImage = self.embeddedImages[imgIdx as usize].clone();
      let mut imgSrc : String = embImg.src.clone();
      let mut imgDir : String = self.baseDir.clone();
      let mut imgFile : String = imgSrc.clone();
      if  (imgSrc.len() as i64) > 2 {
        let prefix : String = imgSrc.chars().skip(0 as usize).take((2 - 0) as usize).collect::<String>();
        if  prefix == "./".to_string() {
          imgSrc = imgSrc.chars().skip(2 as usize).take(((imgSrc.len() as i64) - 2) as usize).collect::<String>();
        }
      }
      let lastSlash : i64 = (imgSrc.rfind(&*"/".to_string()).map(|i| i as i64).unwrap_or(-1));
      let lastBackslash : i64 = (imgSrc.rfind(&*"\\".to_string()).map(|i| i as i64).unwrap_or(-1));
      let mut lastSep : i64 = lastSlash;
      if  lastBackslash > lastSep {
        lastSep = lastBackslash;
      }
      if  lastSep >= 0 {
        imgDir = [&*self.baseDir, &*(imgSrc.chars().skip(0 as usize).take(((lastSep + 1) - 0) as usize).collect::<String>())].concat();
        imgFile = imgSrc.chars().skip((lastSep + 1) as usize).take(((imgSrc.len() as i64) - (lastSep + 1)) as usize).collect::<String>();
      } else {
        imgDir = self.baseDir.clone();
        imgFile = imgSrc.clone();
      }
      println!( "{}", [&*([&*([&*"Loading image: dir=".to_string(), &*imgDir].concat()), &*" file=".to_string()].concat()), &*imgFile].concat() );
      let mut metaInfo : JPEGMetadataInfo = self.metadataParser.parseMetadata(imgDir.clone(), imgFile.clone());
      embImg.orientation = metaInfo.orientation;
      let mut imgBuffer : ImageBuffer = self.jpegDecoder.decode(imgDir.clone(), imgFile.clone());
      if  (imgBuffer.width > 1) && (imgBuffer.height > 1) {
        if  metaInfo.orientation > 1 {
          println!( "{}", [&*"  Applying EXIF orientation: ".to_string(), &*(metaInfo.orientation.to_string())].concat() );
          imgBuffer = imgBuffer.applyExifOrientation(metaInfo.orientation);
        }
        let origW : i64 = imgBuffer.width;
        let origH : i64 = imgBuffer.height;
        let mut newW : i64 = origW;
        let mut newH : i64 = origH;
        if  (origW > self.maxImageWidth) || (origH > self.maxImageHeight) {
          let scaleW : f64 = ((self.maxImageWidth as f64)) / ((origW as f64));
          let scaleH : f64 = ((self.maxImageHeight as f64)) / ((origH as f64));
          let mut scale : f64 = scaleW;
          if  scaleH < scaleW {
            scale = scaleH;
          }
          newW = (((origW as f64)) * scale) as i64 ;
          newH = (((origH as f64)) * scale) as i64 ;
          println!( "{}", [&*([&*([&*([&*([&*([&*([&*"  Resizing from ".to_string(), &*(origW.to_string())].concat()), &*"x".to_string()].concat()), &*(origH.to_string())].concat()), &*" to ".to_string()].concat()), &*(newW.to_string())].concat()), &*"x".to_string()].concat()), &*(newH.to_string())].concat() );
          imgBuffer = imgBuffer.scaleToSize(newW, newH);
        }
        let __arg_0 = self.jpegQuality.clone();
        self.jpegEncoder.setQuality(__arg_0);
        let mut encodedData : Vec<u8> = self.jpegEncoder.encodeToBuffer(&mut imgBuffer);
        let encodedLen : i64 = encodedData.len() as i64;
        embImg.width = newW;
        embImg.height = newH;
        objectOffsets.push((pdf).size());
        pdf.writeString([&*(self.nextObjNum.to_string()), &*" 0 obj\n".to_string()].concat());
        pdf.writeString("<< /Type /XObject".to_string());
        pdf.writeString(" /Subtype /Image".to_string());
        pdf.writeString([&*" /Width ".to_string(), &*(newW.to_string())].concat());
        pdf.writeString([&*" /Height ".to_string(), &*(newH.to_string())].concat());
        pdf.writeString(" /ColorSpace /DeviceRGB".to_string());
        pdf.writeString(" /BitsPerComponent 8".to_string());
        pdf.writeString(" /Filter /DCTDecode".to_string());
        pdf.writeString([&*" /Length ".to_string(), &*(encodedLen.to_string())].concat());
        pdf.writeString(" >>\n".to_string());
        pdf.writeString("stream\n".to_string());
        pdf.writeBuffer(&encodedData);
        pdf.writeString("\nendstream\n".to_string());
        pdf.writeString("endobj\n\n".to_string());
        embImg.objNum = self.nextObjNum;
        embImg.pdfName = [&*"/Im".to_string(), &*((imgIdx + 1).to_string())].concat();
        self.nextObjNum = self.nextObjNum + 1;
        println!( "{}", [&*([&*([&*([&*([&*([&*([&*([&*"Embedded image: ".to_string(), &*imgSrc].concat()), &*" (resized to ".to_string()].concat()), &*(newW.to_string())].concat()), &*"x".to_string()].concat()), &*(newH.to_string())].concat()), &*", ".to_string()].concat()), &*(encodedLen.to_string())].concat()), &*" bytes)".to_string()].concat() );
      } else {
        println!( "{}", [&*"Failed to decode image: ".to_string(), &*imgSrc].concat() );
      }
      imgIdx = imgIdx + 1;
    };
    objectOffsets.push((pdf).size());
    pdf.writeString([&*(self.nextObjNum.to_string()), &*" 0 obj\n".to_string()].concat());
    pdf.writeString([&*([&*"<< /Length ".to_string(), &*(contentLen.to_string())].concat()), &*" >>\n".to_string()].concat());
    pdf.writeString("stream\n".to_string());
    pdf.writeBuffer(&contentData);
    pdf.writeString("\nendstream\n".to_string());
    pdf.writeString("endobj\n\n".to_string());
    let contentObjNum : i64 = self.nextObjNum;
    self.nextObjNum = self.nextObjNum + 1;
    objectOffsets.push((pdf).size());
    pdf.writeString([&*(self.nextObjNum.to_string()), &*" 0 obj\n".to_string()].concat());
    let pagesRef : i64 = self.nextObjNum + 1;
    pdf.writeString([&*([&*"<< /Type /Page /Parent ".to_string(), &*(pagesRef.to_string())].concat()), &*" 0 R".to_string()].concat());
    pdf.writeString([&*([&*([&*([&*" /MediaBox [0 0 ".to_string(), &*EVGPDFRenderer::formatNum(self.pageWidth)].concat()), &*" ".to_string()].concat()), &*EVGPDFRenderer::formatNum(self.pageHeight)].concat()), &*"]".to_string()].concat());
    pdf.writeString([&*([&*" /Contents ".to_string(), &*(contentObjNum.to_string())].concat()), &*" 0 R".to_string()].concat());
    pdf.writeString(" /Resources <<".to_string());
    pdf.writeString(" /Font <<".to_string());
    let mut fi : i64 = 0;
    while fi < ((fontObjNums.len() as i64)) {
      let fontObjN : i64 = fontObjNums[fi as usize].clone();
      pdf.writeString([&*([&*([&*([&*" /F".to_string(), &*((fi + 1).to_string())].concat()), &*" ".to_string()].concat()), &*(fontObjN.to_string())].concat()), &*" 0 R".to_string()].concat());
      fi = fi + 1;
    };
    pdf.writeString(" >>".to_string());
    if  ((self.embeddedImages.len() as i64)) > 0 {
      pdf.writeString(" /XObject <<".to_string());
      let mut ii : i64 = 0;
      while ii < ((self.embeddedImages.len() as i64)) {
        let mut embImg_1 : EmbeddedImage = self.embeddedImages[ii as usize].clone();
        if  embImg_1.objNum > 0 {
          pdf.writeString([&*([&*([&*([&*" /Im".to_string(), &*((ii + 1).to_string())].concat()), &*" ".to_string()].concat()), &*(embImg_1.objNum.to_string())].concat()), &*" 0 R".to_string()].concat());
        }
        ii = ii + 1;
      };
      pdf.writeString(" >>".to_string());
    }
    pdf.writeString(" >> >>\n".to_string());
    pdf.writeString("endobj\n\n".to_string());
    let pageObjNum : i64 = self.nextObjNum;
    self.nextObjNum = self.nextObjNum + 1;
    objectOffsets.push((pdf).size());
    pdf.writeString([&*(self.nextObjNum.to_string()), &*" 0 obj\n".to_string()].concat());
    pdf.writeString([&*([&*"<< /Type /Pages /Kids [".to_string(), &*(pageObjNum.to_string())].concat()), &*" 0 R] /Count 1 >>\n".to_string()].concat());
    pdf.writeString("endobj\n\n".to_string());
    self.pagesObjNum = self.nextObjNum;
    self.nextObjNum = self.nextObjNum + 1;
    objectOffsets.push((pdf).size());
    pdf.writeString([&*(self.nextObjNum.to_string()), &*" 0 obj\n".to_string()].concat());
    pdf.writeString([&*([&*"<< /Type /Catalog /Pages ".to_string(), &*(self.pagesObjNum.to_string())].concat()), &*" 0 R >>\n".to_string()].concat());
    pdf.writeString("endobj\n\n".to_string());
    let catalogObjNum : i64 = self.nextObjNum;
    self.nextObjNum = self.nextObjNum + 1;
    let xrefOffset : i64 = (pdf).size();
    pdf.writeString("xref\n".to_string());
    pdf.writeString([&*([&*"0 ".to_string(), &*(self.nextObjNum.to_string())].concat()), &*"\n".to_string()].concat());
    pdf.writeString("0000000000 65535 f \n".to_string());
    let mut i_2 : i64 = 0;
    while i_2 < ((objectOffsets.len() as i64)) {
      let offset : i64 = objectOffsets[i_2 as usize].clone();
      pdf.writeString([&*EVGPDFRenderer::padLeft((offset.to_string()), 10, "0".to_string()), &*" 00000 n \n".to_string()].concat());
      i_2 = i_2 + 1;
    };
    pdf.writeString("trailer\n".to_string());
    pdf.writeString([&*([&*([&*([&*"<< /Size ".to_string(), &*(self.nextObjNum.to_string())].concat()), &*" /Root ".to_string()].concat()), &*(catalogObjNum.to_string())].concat()), &*" 0 R >>\n".to_string()].concat());
    pdf.writeString("startxref\n".to_string());
    pdf.writeString([&*(xrefOffset.to_string()), &*"\n".to_string()].concat());
    pdf.writeString("%%EOF\n".to_string());
    return pdf.toBuffer();
  }
  fn renderElement(&mut self, mut el : &mut EVGElement, offsetX : f64, offsetY : f64) -> () {
    let x : f64 = el.calculatedX + offsetX;
    let y : f64 = el.calculatedY + offsetY;
    let w : f64 = el.calculatedWidth;
    let h : f64 = el.calculatedHeight;
    let pdfY : f64 = (self.pageHeight - y) - h;
    let mut hasClipPath : bool = false;
    if  (el.clipPath.len() as i64) > 0 {
      hasClipPath = true;
      self.streamBuffer.as_mut().unwrap().writeString("q\n".to_string());
      let __arg_0 = el.clipPath.clone();
      self.applyClipPath(__arg_0, x, pdfY, w, h);
    }
    let mut bgColor : EVGColor = el.backgroundColor.clone().unwrap();
    if  self.debug {
      println!( "{}", [&*([&*([&*([&*([&*"  bg check: ".to_string(), &*el.tagName].concat()), &*" isSet=".to_string()].concat()), &*((bgColor.isSet.to_string()))].concat()), &*" r=".to_string()].concat()), &*(bgColor.r.to_string())].concat() );
    }
    if  bgColor.isSet {
      self.renderBackground(x, pdfY, w, h, bgColor.clone());
    }
    self.renderBorder(el.clone(), x, pdfY, w, h);
    if  el.tagName == "text".to_string() {
      self.renderText(&mut el, x, pdfY, w, h);
    }
    if  el.tagName == "divider".to_string() {
      self.renderDivider(el.clone(), x, pdfY, w, h);
    }
    if  el.tagName == "image".to_string() {
      self.renderImage(el.clone(), x, pdfY, w, h);
    }
    if  el.tagName == "path".to_string() {
      self.renderPath(el.clone(), x, pdfY, w, h);
    }
    let mut i : i64 = 0;
    let childCount : i64 = el.getChildCount();
    while i < childCount {
      let mut child : EVGElement = el.getChild(i);
      self.renderElement(&mut child, offsetX, offsetY);
      i = i + 1;
    };
    if  hasClipPath {
      self.streamBuffer.as_mut().unwrap().writeString("Q\n".to_string());
    }
  }
  fn getImagePdfName(&mut self, src : String) -> String {
    let mut i : i64 = 0;
    while i < ((self.embeddedImages.len() as i64)) {
      let mut embImg : EmbeddedImage = self.embeddedImages[i as usize].clone();
      if  embImg.src == src {
        return [&*"/Im".to_string(), &*((i + 1).to_string())].concat().clone();
      }
      i = i + 1;
    };
    let mut newImg : EmbeddedImage = EmbeddedImage::new(src.clone());
    self.embeddedImages.push(newImg.clone());
    return [&*"/Im".to_string(), &*(((self.embeddedImages.len() as i64)).to_string())].concat().clone();
  }
  fn renderImage(&mut self, mut el : EVGElement, x : f64, y : f64, w : f64, h : f64) -> () {
    let src : String = el.src.clone();
    if  (src.len() as i64) == 0 {
      return;
    }
    let imgName : String = self.getImagePdfName(src.clone());
    self.streamBuffer.as_mut().unwrap().writeString("q\n".to_string());
    let __arg_0 = [&*([&*([&*([&*([&*([&*([&*EVGPDFRenderer::formatNum(w), &*" 0 0 ".to_string()].concat()), &*EVGPDFRenderer::formatNum(h)].concat()), &*" ".to_string()].concat()), &*EVGPDFRenderer::formatNum(x)].concat()), &*" ".to_string()].concat()), &*EVGPDFRenderer::formatNum(y)].concat()), &*" cm\n".to_string()].concat().clone();
    self.streamBuffer.as_mut().unwrap().writeString(__arg_0);
    self.streamBuffer.as_mut().unwrap().writeString([&*imgName, &*" Do\n".to_string()].concat());
    self.streamBuffer.as_mut().unwrap().writeString("Q\n".to_string());
  }
  fn renderPath(&mut self, mut el : EVGElement, x : f64, y : f64, w : f64, h : f64) -> () {
    let pathData : String = el.svgPath.clone();
    if  (pathData.len() as i64) == 0 {
      return;
    }
    let mut parser : SVGPathParser = SVGPathParser::new();
    parser.parse(pathData.clone());
    let mut commands : Vec<PathCommand> = parser.getScaledCommands(w, h);
    let mut fillColor : EVGColor = el.fillColor.clone().unwrap().clone();
    let mut strokeColor : EVGColor = el.strokeColor.clone().unwrap().clone();
    if  fillColor.isSet == false {
      fillColor = el.backgroundColor.clone().unwrap();
    }
    self.streamBuffer.as_mut().unwrap().writeString("q\n".to_string());
    let __arg_0 = [&*([&*([&*([&*"1 0 0 1 ".to_string(), &*EVGPDFRenderer::formatNum(x)].concat()), &*" ".to_string()].concat()), &*EVGPDFRenderer::formatNum(y)].concat()), &*" cm\n".to_string()].concat().clone();
    self.streamBuffer.as_mut().unwrap().writeString(__arg_0);
    let __arg_0 = [&*([&*"1 0 0 -1 0 ".to_string(), &*EVGPDFRenderer::formatNum(h)].concat()), &*" cm\n".to_string()].concat().clone();
    self.streamBuffer.as_mut().unwrap().writeString(__arg_0);
    let mut i : i64 = 0;
    while i < ((commands.len() as i64)) {
      let mut cmd : PathCommand = commands[i as usize].clone();
      if  cmd.r#type == "M".to_string() {
        let __arg_0 = [&*([&*([&*EVGPDFRenderer::formatNum(cmd.x), &*" ".to_string()].concat()), &*EVGPDFRenderer::formatNum(cmd.y)].concat()), &*" m\n".to_string()].concat().clone();
        self.streamBuffer.as_mut().unwrap().writeString(__arg_0);
      }
      if  cmd.r#type == "L".to_string() {
        let __arg_0 = [&*([&*([&*EVGPDFRenderer::formatNum(cmd.x), &*" ".to_string()].concat()), &*EVGPDFRenderer::formatNum(cmd.y)].concat()), &*" l\n".to_string()].concat().clone();
        self.streamBuffer.as_mut().unwrap().writeString(__arg_0);
      }
      if  cmd.r#type == "C".to_string() {
        let __arg_0 = [&*([&*([&*([&*([&*([&*([&*([&*([&*([&*([&*EVGPDFRenderer::formatNum(cmd.x1), &*" ".to_string()].concat()), &*EVGPDFRenderer::formatNum(cmd.y1)].concat()), &*" ".to_string()].concat()), &*EVGPDFRenderer::formatNum(cmd.x2)].concat()), &*" ".to_string()].concat()), &*EVGPDFRenderer::formatNum(cmd.y2)].concat()), &*" ".to_string()].concat()), &*EVGPDFRenderer::formatNum(cmd.x)].concat()), &*" ".to_string()].concat()), &*EVGPDFRenderer::formatNum(cmd.y)].concat()), &*" c\n".to_string()].concat().clone();
        self.streamBuffer.as_mut().unwrap().writeString(__arg_0);
      }
      if  cmd.r#type == "Q".to_string() {
        let __arg_0 = [&*([&*([&*([&*([&*([&*([&*([&*([&*([&*([&*EVGPDFRenderer::formatNum(cmd.x1), &*" ".to_string()].concat()), &*EVGPDFRenderer::formatNum(cmd.y1)].concat()), &*" ".to_string()].concat()), &*EVGPDFRenderer::formatNum(cmd.x1)].concat()), &*" ".to_string()].concat()), &*EVGPDFRenderer::formatNum(cmd.y1)].concat()), &*" ".to_string()].concat()), &*EVGPDFRenderer::formatNum(cmd.x)].concat()), &*" ".to_string()].concat()), &*EVGPDFRenderer::formatNum(cmd.y)].concat()), &*" c\n".to_string()].concat().clone();
        self.streamBuffer.as_mut().unwrap().writeString(__arg_0);
      }
      if  cmd.r#type == "Z".to_string() {
        self.streamBuffer.as_mut().unwrap().writeString("h\n".to_string());
      }
      i = i + 1;
    };
    if  fillColor.isSet && strokeColor.isSet {
      let r : f64 = fillColor.r / 255_f64;
      let g : f64 = fillColor.g / 255_f64;
      let b : f64 = fillColor.b / 255_f64;
      let __arg_0 = [&*([&*([&*([&*([&*EVGPDFRenderer::formatNum(r), &*" ".to_string()].concat()), &*EVGPDFRenderer::formatNum(g)].concat()), &*" ".to_string()].concat()), &*EVGPDFRenderer::formatNum(b)].concat()), &*" rg\n".to_string()].concat().clone();
      self.streamBuffer.as_mut().unwrap().writeString(__arg_0);
      let sr : f64 = strokeColor.r / 255_f64;
      let sg : f64 = strokeColor.g / 255_f64;
      let sb : f64 = strokeColor.b / 255_f64;
      let __arg_0 = [&*([&*([&*([&*([&*EVGPDFRenderer::formatNum(sr), &*" ".to_string()].concat()), &*EVGPDFRenderer::formatNum(sg)].concat()), &*" ".to_string()].concat()), &*EVGPDFRenderer::formatNum(sb)].concat()), &*" RG\n".to_string()].concat().clone();
      self.streamBuffer.as_mut().unwrap().writeString(__arg_0);
      if  el.strokeWidth > 0_f64 {
        let __arg_0 = [&*EVGPDFRenderer::formatNum(el.strokeWidth), &*" w\n".to_string()].concat().clone();
        self.streamBuffer.as_mut().unwrap().writeString(__arg_0);
      }
      self.streamBuffer.as_mut().unwrap().writeString("B\n".to_string());
    } else {
      if  fillColor.isSet {
        let r_1 : f64 = fillColor.r / 255_f64;
        let g_1 : f64 = fillColor.g / 255_f64;
        let b_1 : f64 = fillColor.b / 255_f64;
        let __arg_0 = [&*([&*([&*([&*([&*EVGPDFRenderer::formatNum(r_1), &*" ".to_string()].concat()), &*EVGPDFRenderer::formatNum(g_1)].concat()), &*" ".to_string()].concat()), &*EVGPDFRenderer::formatNum(b_1)].concat()), &*" rg\n".to_string()].concat().clone();
        self.streamBuffer.as_mut().unwrap().writeString(__arg_0);
        self.streamBuffer.as_mut().unwrap().writeString("f\n".to_string());
      } else {
        if  strokeColor.isSet {
          let sr_1 : f64 = strokeColor.r / 255_f64;
          let sg_1 : f64 = strokeColor.g / 255_f64;
          let sb_1 : f64 = strokeColor.b / 255_f64;
          let __arg_0 = [&*([&*([&*([&*([&*EVGPDFRenderer::formatNum(sr_1), &*" ".to_string()].concat()), &*EVGPDFRenderer::formatNum(sg_1)].concat()), &*" ".to_string()].concat()), &*EVGPDFRenderer::formatNum(sb_1)].concat()), &*" RG\n".to_string()].concat().clone();
          self.streamBuffer.as_mut().unwrap().writeString(__arg_0);
          if  el.strokeWidth > 0_f64 {
            let __arg_0 = [&*EVGPDFRenderer::formatNum(el.strokeWidth), &*" w\n".to_string()].concat().clone();
            self.streamBuffer.as_mut().unwrap().writeString(__arg_0);
          }
          self.streamBuffer.as_mut().unwrap().writeString("S\n".to_string());
        }
      }
    }
    self.streamBuffer.as_mut().unwrap().writeString("Q\n".to_string());
  }
  fn applyClipPath(&mut self, pathData : String, x : f64, y : f64, w : f64, h : f64) -> () {
    let mut parser : SVGPathParser = SVGPathParser::new();
    parser.parse(pathData.clone());
    let mut commands : Vec<PathCommand> = parser.getScaledCommands(w, h);
    let mut i : i64 = 0;
    while i < ((commands.len() as i64)) {
      let mut cmd : PathCommand = commands[i as usize].clone();
      let px : f64 = x + cmd.x;
      let py : f64 = (y + h) - cmd.y;
      let px1 : f64 = x + cmd.x1;
      let py1 : f64 = (y + h) - cmd.y1;
      let px2 : f64 = x + cmd.x2;
      let py2 : f64 = (y + h) - cmd.y2;
      if  cmd.r#type == "M".to_string() {
        let __arg_0 = [&*([&*([&*EVGPDFRenderer::formatNum(px), &*" ".to_string()].concat()), &*EVGPDFRenderer::formatNum(py)].concat()), &*" m\n".to_string()].concat().clone();
        self.streamBuffer.as_mut().unwrap().writeString(__arg_0);
      }
      if  cmd.r#type == "L".to_string() {
        let __arg_0 = [&*([&*([&*EVGPDFRenderer::formatNum(px), &*" ".to_string()].concat()), &*EVGPDFRenderer::formatNum(py)].concat()), &*" l\n".to_string()].concat().clone();
        self.streamBuffer.as_mut().unwrap().writeString(__arg_0);
      }
      if  cmd.r#type == "C".to_string() {
        let __arg_0 = [&*([&*([&*([&*([&*([&*([&*([&*([&*([&*([&*EVGPDFRenderer::formatNum(px1), &*" ".to_string()].concat()), &*EVGPDFRenderer::formatNum(py1)].concat()), &*" ".to_string()].concat()), &*EVGPDFRenderer::formatNum(px2)].concat()), &*" ".to_string()].concat()), &*EVGPDFRenderer::formatNum(py2)].concat()), &*" ".to_string()].concat()), &*EVGPDFRenderer::formatNum(px)].concat()), &*" ".to_string()].concat()), &*EVGPDFRenderer::formatNum(py)].concat()), &*" c\n".to_string()].concat().clone();
        self.streamBuffer.as_mut().unwrap().writeString(__arg_0);
      }
      if  cmd.r#type == "Q".to_string() {
        let __arg_0 = [&*([&*([&*([&*([&*([&*([&*([&*([&*([&*([&*EVGPDFRenderer::formatNum(px1), &*" ".to_string()].concat()), &*EVGPDFRenderer::formatNum(py1)].concat()), &*" ".to_string()].concat()), &*EVGPDFRenderer::formatNum(px1)].concat()), &*" ".to_string()].concat()), &*EVGPDFRenderer::formatNum(py1)].concat()), &*" ".to_string()].concat()), &*EVGPDFRenderer::formatNum(px)].concat()), &*" ".to_string()].concat()), &*EVGPDFRenderer::formatNum(py)].concat()), &*" c\n".to_string()].concat().clone();
        self.streamBuffer.as_mut().unwrap().writeString(__arg_0);
      }
      if  cmd.r#type == "Z".to_string() {
        self.streamBuffer.as_mut().unwrap().writeString("h\n".to_string());
      }
      i = i + 1;
    };
    self.streamBuffer.as_mut().unwrap().writeString("W n\n".to_string());
  }
  fn renderBackground(&mut self, x : f64, y : f64, w : f64, h : f64, mut color : EVGColor) -> () {
    self.streamBuffer.as_mut().unwrap().writeString("q\n".to_string());
    let r : f64 = color.r / 255_f64;
    let g : f64 = color.g / 255_f64;
    let b : f64 = color.b / 255_f64;
    let __arg_0 = [&*([&*([&*([&*([&*EVGPDFRenderer::formatNum(r), &*" ".to_string()].concat()), &*EVGPDFRenderer::formatNum(g)].concat()), &*" ".to_string()].concat()), &*EVGPDFRenderer::formatNum(b)].concat()), &*" rg\n".to_string()].concat().clone();
    self.streamBuffer.as_mut().unwrap().writeString(__arg_0);
    let __arg_0 = [&*([&*([&*([&*([&*([&*([&*EVGPDFRenderer::formatNum(x), &*" ".to_string()].concat()), &*EVGPDFRenderer::formatNum(y)].concat()), &*" ".to_string()].concat()), &*EVGPDFRenderer::formatNum(w)].concat()), &*" ".to_string()].concat()), &*EVGPDFRenderer::formatNum(h)].concat()), &*" re\n".to_string()].concat().clone();
    self.streamBuffer.as_mut().unwrap().writeString(__arg_0);
    self.streamBuffer.as_mut().unwrap().writeString("f\n".to_string());
    self.streamBuffer.as_mut().unwrap().writeString("Q\n".to_string());
  }
  fn renderBorder(&mut self, mut el : EVGElement, x : f64, y : f64, w : f64, h : f64) -> () {
    let borderWidth : f64 = el.r#box.as_mut().unwrap().borderWidth.as_mut().unwrap().pixels;
    if  borderWidth <= 0_f64 {
      return;
    }
    let mut borderColor : EVGColor = el.r#box.as_mut().unwrap().borderColor.clone().unwrap();
    if  borderColor.isSet == false {
      borderColor = EVGColor::black();
    }
    self.streamBuffer.as_mut().unwrap().writeString("q\n".to_string());
    let r : f64 = borderColor.r / 255_f64;
    let g : f64 = borderColor.g / 255_f64;
    let b : f64 = borderColor.b / 255_f64;
    let __arg_0 = [&*([&*([&*([&*([&*EVGPDFRenderer::formatNum(r), &*" ".to_string()].concat()), &*EVGPDFRenderer::formatNum(g)].concat()), &*" ".to_string()].concat()), &*EVGPDFRenderer::formatNum(b)].concat()), &*" RG\n".to_string()].concat().clone();
    self.streamBuffer.as_mut().unwrap().writeString(__arg_0);
    let __arg_0 = [&*EVGPDFRenderer::formatNum(borderWidth), &*" w\n".to_string()].concat().clone();
    self.streamBuffer.as_mut().unwrap().writeString(__arg_0);
    let __arg_0 = [&*([&*([&*([&*([&*([&*([&*EVGPDFRenderer::formatNum(x), &*" ".to_string()].concat()), &*EVGPDFRenderer::formatNum(y)].concat()), &*" ".to_string()].concat()), &*EVGPDFRenderer::formatNum(w)].concat()), &*" ".to_string()].concat()), &*EVGPDFRenderer::formatNum(h)].concat()), &*" re\n".to_string()].concat().clone();
    self.streamBuffer.as_mut().unwrap().writeString(__arg_0);
    self.streamBuffer.as_mut().unwrap().writeString("S\n".to_string());
    self.streamBuffer.as_mut().unwrap().writeString("Q\n".to_string());
  }
  fn renderText(&mut self, mut el : &mut EVGElement, x : f64, y : f64, w : f64, h : f64) -> () {
    let text : String = self.getTextContent(&mut el);
    if  (text.len() as i64) == 0 {
      return;
    }
    let mut fontSize : f64 = 14_f64;
    if  el.fontSize.as_mut().unwrap().isSet {
      fontSize = el.fontSize.as_mut().unwrap().pixels;
    }
    let mut color : EVGColor = el.color.clone().unwrap().clone();
    if  color.isSet == false {
      color = EVGColor::black();
    }
    let mut lineHeight : f64 = el.lineHeight;
    if  lineHeight <= 0_f64 {
      lineHeight = 1.2_f64;
    }
    let lineSpacing : f64 = fontSize * lineHeight;
    let mut fontFamily : String = el.fontFamily.clone();
    if  (fontFamily.len() as i64) == 0 {
      fontFamily = "Helvetica".to_string();
    }
    let mut lines : Vec<String> = self.wrapText(text.clone(), w, fontSize, fontFamily.clone());
    let fontName : String = self.getPdfFontName(fontFamily.clone());
    let mut lineY : f64 = (y + h) - fontSize;
    let mut i : i64 = 0;
    while i < ((lines.len() as i64)) {
      let line : String = lines[i as usize].clone();
      self.streamBuffer.as_mut().unwrap().writeString("BT\n".to_string());
      let __arg_0 = [&*([&*([&*fontName, &*" ".to_string()].concat()), &*EVGPDFRenderer::formatNum(fontSize)].concat()), &*" Tf\n".to_string()].concat().clone();
      self.streamBuffer.as_mut().unwrap().writeString(__arg_0);
      let r : f64 = color.r / 255_f64;
      let g : f64 = color.g / 255_f64;
      let b : f64 = color.b / 255_f64;
      let __arg_0 = [&*([&*([&*([&*([&*EVGPDFRenderer::formatNum(r), &*" ".to_string()].concat()), &*EVGPDFRenderer::formatNum(g)].concat()), &*" ".to_string()].concat()), &*EVGPDFRenderer::formatNum(b)].concat()), &*" rg\n".to_string()].concat().clone();
      self.streamBuffer.as_mut().unwrap().writeString(__arg_0);
      let mut textX : f64 = x;
      if  el.textAlign == "center".to_string() {
        let textWidth : f64 = self.measurer.as_ref().unwrap().borrow_mut().measureTextWidth(line.clone(), fontFamily.clone(), fontSize);
        textX = x + ((w - textWidth) / 2_f64);
      }
      if  el.textAlign == "right".to_string() {
        let textWidth_1 : f64 = self.measurer.as_ref().unwrap().borrow_mut().measureTextWidth(line.clone(), fontFamily.clone(), fontSize);
        textX = (x + w) - textWidth_1;
      }
      let __arg_0 = [&*([&*([&*EVGPDFRenderer::formatNum(textX), &*" ".to_string()].concat()), &*EVGPDFRenderer::formatNum(lineY)].concat()), &*" Td\n".to_string()].concat().clone();
      self.streamBuffer.as_mut().unwrap().writeString(__arg_0);
      let __arg_0 = [&*([&*"(".to_string(), &*EVGPDFRenderer::escapeText(line.clone())].concat()), &*") Tj\n".to_string()].concat().clone();
      self.streamBuffer.as_mut().unwrap().writeString(__arg_0);
      self.streamBuffer.as_mut().unwrap().writeString("ET\n".to_string());
      lineY = lineY - lineSpacing;
      i = i + 1;
    };
  }
  fn wrapText(&mut self, text : String, maxWidth : f64, fontSize : f64, fontFamily : String) -> Vec<String> {
    let mut lines : Vec<String> = Vec::new();
    let mut words : Vec<String> = text.split(&*" ".to_string()).map(|s| s.to_string()).collect::<Vec<String>>();
    let mut currentLine : String = "".to_string();
    let mut i : i64 = 0;
    while i < ((words.len() as i64)) {
      let word : String = words[i as usize].clone();
      let mut testLine : String = "".to_string();
      if  (currentLine.len() as i64) == 0 {
        testLine = word.clone();
      } else {
        testLine = [&*([&*currentLine, &*" ".to_string()].concat()), &*word].concat();
      }
      let testWidth : f64 = self.measurer.as_ref().unwrap().borrow_mut().measureTextWidth(testLine.clone(), fontFamily.clone(), fontSize);
      if  (testWidth > maxWidth) && ((currentLine.len() as i64) > 0) {
        lines.push(currentLine.clone());
        currentLine = word.clone();
      } else {
        currentLine = testLine.clone();
      }
      i = i + 1;
    };
    if  (currentLine.len() as i64) > 0 {
      lines.push(currentLine.clone());
    }
    return lines.clone();
  }
  fn renderDivider(&mut self, mut el : EVGElement, x : f64, y : f64, w : f64, h : f64) -> () {
    let mut color : EVGColor = el.color.clone().unwrap().clone();
    if  color.isSet == false {
      color = EVGColor::rgb(200, 200, 200);
    }
    let lineY : f64 = y + (h / 2_f64);
    self.streamBuffer.as_mut().unwrap().writeString("q\n".to_string());
    let r : f64 = color.r / 255_f64;
    let g : f64 = color.g / 255_f64;
    let b : f64 = color.b / 255_f64;
    let __arg_0 = [&*([&*([&*([&*([&*EVGPDFRenderer::formatNum(r), &*" ".to_string()].concat()), &*EVGPDFRenderer::formatNum(g)].concat()), &*" ".to_string()].concat()), &*EVGPDFRenderer::formatNum(b)].concat()), &*" RG\n".to_string()].concat().clone();
    self.streamBuffer.as_mut().unwrap().writeString(__arg_0);
    self.streamBuffer.as_mut().unwrap().writeString("1 w\n".to_string());
    let __arg_0 = [&*([&*([&*EVGPDFRenderer::formatNum(x), &*" ".to_string()].concat()), &*EVGPDFRenderer::formatNum(lineY)].concat()), &*" m\n".to_string()].concat().clone();
    self.streamBuffer.as_mut().unwrap().writeString(__arg_0);
    let __arg_0 = [&*([&*([&*EVGPDFRenderer::formatNum((x + w)), &*" ".to_string()].concat()), &*EVGPDFRenderer::formatNum(lineY)].concat()), &*" l\n".to_string()].concat().clone();
    self.streamBuffer.as_mut().unwrap().writeString(__arg_0);
    self.streamBuffer.as_mut().unwrap().writeString("S\n".to_string());
    self.streamBuffer.as_mut().unwrap().writeString("Q\n".to_string());
  }
  fn getTextContent(&mut self, mut el : &mut EVGElement) -> String {
    if  (el.textContent.len() as i64) > 0 {
      return el.textContent.clone();
    }
    let mut result : String = "".to_string();
    let mut i : i64 = 0;
    let childCount : i64 = el.getChildCount();
    while i < childCount {
      let mut child : EVGElement = el.getChild(i);
      if  child.tagName == "text".to_string() {
        let childText : String = child.textContent.clone();
        if  (childText.len() as i64) > 0 {
          if  (result.len() as i64) > 0 {
            let lastChar : i64 = result.chars().nth(((result.len() as i64) - 1) as usize).unwrap_or('\0') as i64;
            let firstChar : i64 = childText.chars().nth(0 as usize).unwrap_or('\0') as i64;
            if  (lastChar != 32) && (firstChar != 32) {
              result = [&*result, &*" ".to_string()].concat();
            }
          }
          result = [&*result, &*childText].concat();
        }
      }
      i = i + 1;
    };
    return result.clone();
  }
  fn estimateTextWidth(&mut self, text : String, fontSize : f64) -> f64 {
    return self.measurer.as_ref().unwrap().borrow_mut().measureTextWidth(text.clone(), "Helvetica".to_string(), fontSize);
  }
  fn escapeText(text : String) -> String {
    let mut result : String = "".to_string();
    let __len : i64 = text.len() as i64;
    let mut i : i64 = 0;
    while i < __len {
      let ch : i64 = text.chars().nth(i as usize).unwrap_or('\0') as i64;
      if  ch == 40 {
        result = [&*result, &*"\\(".to_string()].concat();
      } else {
        if  ch == 41 {
          result = [&*result, &*"\\)".to_string()].concat();
        } else {
          if  ch == 92 {
            result = [&*result, &*"\\\\".to_string()].concat();
          } else {
            if  ch < 32 {
              result = [&*result, &*" ".to_string()].concat();
            } else {
              if  ch <= 255 {
                result = [&*result, &*((char::from_u32(ch as u32).unwrap_or('\0').to_string()))].concat();
              } else {
                if  ch == 9733 {
                  result = [&*result, &*"*".to_string()].concat();
                } else {
                  if  ch == 9734 {
                    result = [&*result, &*"*".to_string()].concat();
                  } else {
                    if  ch == 9829 {
                      result = [&*result, &*((char::from_u32(183 as u32).unwrap_or('\0').to_string()))].concat();
                    } else {
                      if  ch == 9825 {
                        result = [&*result, &*((char::from_u32(183 as u32).unwrap_or('\0').to_string()))].concat();
                      } else {
                        if  ch == 10003 {
                          result = [&*result, &*"v".to_string()].concat();
                        } else {
                          if  ch == 10007 {
                            result = [&*result, &*"x".to_string()].concat();
                          } else {
                            if  ch == 8226 {
                              result = [&*result, &*((char::from_u32(149 as u32).unwrap_or('\0').to_string()))].concat();
                            } else {
                              if  ch == 8594 {
                                result = [&*result, &*"->".to_string()].concat();
                              } else {
                                if  ch == 8592 {
                                  result = [&*result, &*"<-".to_string()].concat();
                                } else {
                                  result = [&*result, &*"?".to_string()].concat();
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
      i = i + 1;
    };
    return result.clone();
  }
  fn formatNum(n : f64) -> String {
    let result : String = n.to_string();
    return result.clone();
  }
  fn padLeft(s : String, __len : i64, padChar : String) -> String {
    let mut result : String = s;
    while (result.len() as i64) < __len {
      result = [&*padChar, &*result].concat();
    };
    return result.clone();
  }
  fn sanitizeFontName(name : String) -> String {
    let mut result : String = "".to_string();
    let __len : i64 = name.len() as i64;
    let mut i : i64 = 0;
    while i < __len {
      let ch : i64 = name.chars().nth(i as usize).unwrap_or('\0') as i64;
      if  (((ch >= 65) && (ch <= 90)) || ((ch >= 97) && (ch <= 122))) || ((ch >= 48) && (ch <= 57)) {
        result = [&*result, &*((char::from_u32(ch as u32).unwrap_or('\0').to_string()))].concat();
      }
      i = i + 1;
    };
    return result.clone();
  }
}
#[derive(Clone)]
struct EvalValue { 
  valueType : i64, 
  numberValue : f64, 
  stringValue : String, 
  boolValue : bool, 
  arrayValue : Vec<EvalValue>, 
  objectKeys : Vec<String>, 
  objectValues : Vec<EvalValue>, 
  functionName : String, 
  functionBody : String, 
  evgElement : Option<EVGElement>, 
}
impl EvalValue { 
  
  pub fn new() ->  EvalValue {
    let mut me = EvalValue { 
      valueType:0, 
      numberValue:0_f64, 
      stringValue:"".to_string(), 
      boolValue:false, 
      arrayValue: Vec::new(), 
      objectKeys: Vec::new(), 
      objectValues: Vec::new(), 
      functionName:"".to_string(), 
      functionBody:"".to_string(), 
      evgElement: None, 
    };
    return me;
  }
  pub fn null() -> EvalValue {
    let mut v : EvalValue = EvalValue::new();
    v.valueType = 0;
    return v.clone();
  }
  pub fn number(n : f64) -> EvalValue {
    let mut v : EvalValue = EvalValue::new();
    v.valueType = 1;
    v.numberValue = n;
    return v.clone();
  }
  pub fn fromInt(n : i64) -> EvalValue {
    let mut v : EvalValue = EvalValue::new();
    v.valueType = 1;
    v.numberValue = (n as f64);
    return v.clone();
  }
  pub fn string(s : String) -> EvalValue {
    let mut v : EvalValue = EvalValue::new();
    v.valueType = 2;
    v.stringValue = s.clone();
    return v.clone();
  }
  pub fn boolean(b : bool) -> EvalValue {
    let mut v : EvalValue = EvalValue::new();
    v.valueType = 3;
    v.boolValue = b;
    return v.clone();
  }
  pub fn array(mut items : Vec<EvalValue>) -> EvalValue {
    let mut v : EvalValue = EvalValue::new();
    v.valueType = 4;
    v.arrayValue = items.clone();
    return v.clone();
  }
  pub fn object(mut keys : Vec<String>, mut values : Vec<EvalValue>) -> EvalValue {
    let mut v : EvalValue = EvalValue::new();
    v.valueType = 5;
    v.objectKeys = keys.clone();
    v.objectValues = values.clone();
    return v.clone();
  }
  pub fn element(mut el : EVGElement) -> EvalValue {
    let mut v : EvalValue = EvalValue::new();
    v.valueType = 7;
    v.evgElement = Some(el.clone());
    return v.clone();
  }
  fn isNull(&mut self, ) -> bool {
    return self.valueType == 0;
  }
  fn isNumber(&mut self, ) -> bool {
    return self.valueType == 1;
  }
  fn isString(&mut self, ) -> bool {
    return self.valueType == 2;
  }
  fn isBoolean(&mut self, ) -> bool {
    return self.valueType == 3;
  }
  fn isArray(&mut self, ) -> bool {
    return self.valueType == 4;
  }
  fn isObject(&mut self, ) -> bool {
    return self.valueType == 5;
  }
  fn isFunction(&mut self, ) -> bool {
    return self.valueType == 6;
  }
  fn isElement(&mut self, ) -> bool {
    return self.valueType == 7;
  }
  fn toNumber(&mut self, ) -> f64 {
    if  self.valueType == 1 {
      return self.numberValue;
    }
    if  self.valueType == 2 {
      let parsed : Option<f64> = self.stringValue.parse::<f64>().ok();
      return parsed.unwrap();
    }
    if  self.valueType == 3 {
      if  self.boolValue {
        return 1_f64;
      }
      return 0_f64;
    }
    return 0_f64;
  }
  fn toString(&mut self, ) -> String {
    if  self.valueType == 0 {
      return "null".to_string().clone();
    }
    if  self.valueType == 1 {
      let s : String = self.numberValue.to_string();
      let intVal : i64 = self.numberValue as i64 ;
      if  ((intVal as f64)) == self.numberValue {
        return intVal.to_string().clone();
      }
      return s.clone();
    }
    if  self.valueType == 2 {
      return self.stringValue.clone();
    }
    if  self.valueType == 3 {
      if  self.boolValue {
        return "true".to_string().clone();
      }
      return "false".to_string().clone();
    }
    if  self.valueType == 4 {
      let mut result : String = "[".to_string();
      let mut i : i64 = 0;
      while i < ((self.arrayValue.len() as i64)) {
        if  i > 0 {
          result = [&*result, &*", ".to_string()].concat();
        }
        let mut item : EvalValue = self.arrayValue[i as usize].clone();
        let itemStr : String = (item).toString();
        result = [&*result, &*itemStr].concat();
        i = i + 1;
      };
      return [&*result, &*"]".to_string()].concat().clone();
    }
    if  self.valueType == 5 {
      let mut result_1 : String = "{".to_string();
      let mut i_1 : i64 = 0;
      while i_1 < ((self.objectKeys.len() as i64)) {
        if  i_1 > 0 {
          result_1 = [&*result_1, &*", ".to_string()].concat();
        }
        let key : String = self.objectKeys[i_1 as usize].clone();
        let mut val : EvalValue = self.objectValues[i_1 as usize].clone();
        let valStr : String = (val).toString();
        result_1 = [&*([&*([&*result_1, &*key].concat()), &*": ".to_string()].concat()), &*valStr].concat();
        i_1 = i_1 + 1;
      };
      return [&*result_1, &*"}".to_string()].concat().clone();
    }
    if  self.valueType == 6 {
      return [&*([&*"[Function: ".to_string(), &*self.functionName].concat()), &*"]".to_string()].concat().clone();
    }
    if  self.valueType == 7 {
      if self.evgElement.is_some() {
        let mut el : EVGElement = self.evgElement.clone().unwrap();
        return [&*([&*"[EVGElement: ".to_string(), &*el.tagName].concat()), &*"]".to_string()].concat().clone();
      }
      return "[EVGElement: null]".to_string().clone();
    }
    return "undefined".to_string().clone();
  }
  fn toBool(&mut self, ) -> bool {
    if  self.valueType == 0 {
      return false;
    }
    if  self.valueType == 1 {
      return self.numberValue != 0_f64;
    }
    if  self.valueType == 2 {
      return (self.stringValue.len() as i64) > 0;
    }
    if  self.valueType == 3 {
      return self.boolValue;
    }
    if  self.valueType == 4 {
      return true;
    }
    if  self.valueType == 5 {
      return true;
    }
    if  self.valueType == 6 {
      return true;
    }
    if  self.valueType == 7 {
      return true;
    }
    return false;
  }
  fn getMember(&mut self, key : String) -> EvalValue {
    if  self.valueType == 5 {
      let mut i : i64 = 0;
      while i < ((self.objectKeys.len() as i64)) {
        if  (self.objectKeys[i as usize].clone()) == key {
          return self.objectValues[i as usize].clone().clone();
        }
        i = i + 1;
      };
    }
    if  self.valueType == 4 {
      if  key == "length".to_string() {
        return EvalValue::fromInt(((self.arrayValue.len() as i64))).clone();
      }
    }
    if  self.valueType == 2 {
      if  key == "length".to_string() {
        return EvalValue::fromInt((self.stringValue.len() as i64)).clone();
      }
    }
    return EvalValue::null().clone();
  }
  fn getIndex(&mut self, index : i64) -> EvalValue {
    if  self.valueType == 4 {
      if  (index >= 0) && (index < ((self.arrayValue.len() as i64))) {
        return self.arrayValue[index as usize].clone().clone();
      }
    }
    if  self.valueType == 2 {
      if  (index >= 0) && (index < (self.stringValue.len() as i64)) {
        let charStr : String = self.stringValue.chars().skip(index as usize).take(((index + 1) - index) as usize).collect::<String>();
        return EvalValue::string(charStr.clone()).clone();
      }
    }
    return EvalValue::null().clone();
  }
  fn equals(&mut self, mut other : EvalValue) -> bool {
    if  self.valueType != other.valueType {
      return false;
    }
    if  self.valueType == 0 {
      return true;
    }
    if  self.valueType == 1 {
      return self.numberValue == other.numberValue;
    }
    if  self.valueType == 2 {
      return self.stringValue == other.stringValue;
    }
    if  self.valueType == 3 {
      return self.boolValue == other.boolValue;
    }
    return false;
  }
}
#[derive(Clone)]
struct ImportedSymbol { 
  name : String, 
  originalName : String, 
  sourcePath : String, 
  symbolType : String, 
  functionNode : Option<TSNode>, 
}
impl ImportedSymbol { 
  
  pub fn new() ->  ImportedSymbol {
    let mut me = ImportedSymbol { 
      name:"".to_string(), 
      originalName:"".to_string(), 
      sourcePath:"".to_string(), 
      symbolType:"".to_string(), 
      functionNode: None, 
    };
    return me;
  }
}
#[derive(Clone)]
struct EvalContext { 
  variables : Vec<String>, 
  values : Vec<EvalValue>, 
  parent : Option<Box<EvalContext>>, 
}
impl EvalContext { 
  
  pub fn new() ->  EvalContext {
    let mut me = EvalContext { 
      variables: Vec::new(), 
      values: Vec::new(), 
      parent: None, 
    };
    let mut v : Vec<String> = Vec::new();
    me.variables = v.clone();
    let mut vl : Vec<EvalValue> = Vec::new();
    me.values = vl.clone();
    return me;
  }
  fn define(&mut self, name : String, mut value : EvalValue) -> () {
    let mut i : i64 = 0;
    while i < ((self.variables.len() as i64)) {
      if  (self.variables[i as usize].clone()) == name {
        self.values[i as usize] = value;
        return;
      }
      i = i + 1;
    };
    self.variables.push(name.clone());
    self.values.push(value.clone());
  }
  fn lookup(&mut self, name : String) -> EvalValue {
    let mut i : i64 = 0;
    while i < ((self.variables.len() as i64)) {
      if  (self.variables[i as usize].clone()) == name {
        return self.values[i as usize].clone().clone();
      }
      i = i + 1;
    };
    if self.parent.is_some() {
      let mut p : EvalContext = (*self.parent.clone().unwrap());
      return p.lookup(name.clone()).clone();
    }
    return EvalValue::null().clone();
  }
  fn has(&mut self, name : String) -> bool {
    let mut i : i64 = 0;
    while i < ((self.variables.len() as i64)) {
      if  (self.variables[i as usize].clone()) == name {
        return true;
      }
      i = i + 1;
    };
    if self.parent.is_some() {
      let mut p : EvalContext = (*self.parent.clone().unwrap());
      return (p).has(name);
    }
    return false;
  }
  fn createChild(&mut self, ) -> EvalContext {
    let mut child : EvalContext = EvalContext::new();
    child.parent = Some(Box::new(self.clone()));
    return child.clone();
  }
}
#[derive(Clone)]
struct ComponentEngine { 
  parser : Option<TSParserSimple>, 
  source : String, 
  basePath : String, 
  assetPaths : Vec<String>, 
  pageWidth : f64, 
  pageHeight : f64, 
  imports : Vec<ImportedSymbol>, 
  localComponents : Vec<ImportedSymbol>, 
  context : Option<EvalContext>, 
  primitives : Vec<String>, 
}
impl ComponentEngine { 
  
  pub fn new() ->  ComponentEngine {
    let mut me = ComponentEngine { 
      parser: None, 
      source:"".to_string(), 
      basePath:"./".to_string(), 
      assetPaths: Vec::new(), 
      pageWidth:595_f64, 
      pageHeight:842_f64, 
      imports: Vec::new(), 
      localComponents: Vec::new(), 
      context: None, 
      primitives: Vec::new(), 
    };
    let mut p : TSParserSimple = TSParserSimple::new();
    me.parser = Some(p.clone());
    me.parser.as_mut().unwrap().tsxMode = true;
    let mut imp : Vec<ImportedSymbol> = Vec::new();
    me.imports = imp.clone();
    let mut loc : Vec<ImportedSymbol> = Vec::new();
    me.localComponents = loc.clone();
    let mut ctx : EvalContext = EvalContext::new();
    me.context = Some(ctx.clone());
    let mut prim : Vec<String> = Vec::new();
    me.primitives = prim.clone();
    let mut ap_1 : Vec<String> = Vec::new();
    me.assetPaths = ap_1.clone();
    me.primitives.push("View".to_string().to_string());
    me.primitives.push("Label".to_string().to_string());
    me.primitives.push("Print".to_string().to_string());
    me.primitives.push("Section".to_string().to_string());
    me.primitives.push("Page".to_string().to_string());
    me.primitives.push("Image".to_string().to_string());
    me.primitives.push("Path".to_string().to_string());
    me.primitives.push("Spacer".to_string().to_string());
    me.primitives.push("Divider".to_string().to_string());
    me.primitives.push("div".to_string().to_string());
    me.primitives.push("span".to_string().to_string());
    me.primitives.push("p".to_string().to_string());
    me.primitives.push("h1".to_string().to_string());
    me.primitives.push("h2".to_string().to_string());
    me.primitives.push("h3".to_string().to_string());
    me.primitives.push("img".to_string().to_string());
    me.primitives.push("path".to_string().to_string());
    return me;
  }
  fn setAssetPaths(&mut self, paths : String) -> () {
    let mut start : i64 = 0;
    let mut i : i64 = 0;
    let __len : i64 = paths.len() as i64;
    while i <= __len {
      let mut ch : String = "".to_string();
      if  i < __len {
        ch = paths.chars().skip(i as usize).take(((i + 1) - i) as usize).collect::<String>();
      }
      if  (ch == ";".to_string()) || (i == __len) {
        if  i > start {
          let part : String = paths.chars().skip(start as usize).take((i - start) as usize).collect::<String>();
          self.assetPaths.push(part.clone());
          println!( "{}", [&*"ComponentEngine: Added asset path: ".to_string(), &*part].concat() );
        }
        start = i + 1;
      }
      i = i + 1;
    };
  }
  fn resolveComponentPath(&mut self, relativePath : String) -> String {
    let fullPath : String = [&*self.basePath, &*relativePath].concat();
    let mut i : i64 = 0;
    while i < ((self.assetPaths.len() as i64)) {
      // unused:  let assetDir : String = self.assetPaths[i as usize].clone();
      i = i + 1;
    };
    return fullPath.clone();
  }
  fn parseFile(&mut self, dirPath : String, fileName : String) -> EVGElement {
    self.basePath = dirPath.clone();
    let mut fileContent : Vec<u8> = std::fs::read(format!("{}/{}", dirPath, fileName)).unwrap_or_default();
    let src : String = String::from_utf8_lossy(&fileContent).to_string();
    return self.parse(src.clone()).clone();
  }
  fn parse(&mut self, src : String) -> EVGElement {
    self.source = src.clone();
    let mut lexer : TSLexer = TSLexer::new(src.clone());
    let mut tokens : Vec<Token> = lexer.tokenize();
    self.parser.as_mut().unwrap().initParser(&tokens);
    self.parser.as_mut().unwrap().tsxMode = true;
    let mut ast : TSNode = self.parser.as_mut().unwrap().parseProgram();
    self.processImports(ast.clone());
    self.registerComponents(ast.clone());
    self.processVariables(ast.clone());
    let mut renderFn : TSNode = self.findRenderFunction(ast.clone());
    if  renderFn.nodeType == "".to_string() {
      println!( "{}", "Error: No render() function found".to_string() );
      let mut empty : EVGElement = EVGElement::new();
      return empty.clone();
    }
    return self.evaluateFunction(renderFn.clone()).clone();
  }
  fn processImports(&mut self, mut ast : TSNode) -> () {
    let mut i : i64 = 0;
    while i < ((ast.children.len() as i64)) {
      let mut node : TSNode = ast.children[i as usize].clone();
      if  node.nodeType == "ImportDeclaration".to_string() {
        self.processImportDeclaration(node.clone());
      }
      i = i + 1;
    };
  }
  fn processImportDeclaration(&mut self, mut node : TSNode) -> () {
    let mut modulePath : String = "".to_string();
    if node.left.is_some() {
      let mut srcNode : TSNode = (*node.left.clone().unwrap());
      modulePath = ComponentEngine::unquote(srcNode.value.clone());
    }
    if  (modulePath.len() as i64) == 0 {
      return;
    }
    if  ((modulePath.find(&*"evg_types".to_string()).map(|i| i as i64).unwrap_or(-1))) >= 0 {
      return;
    }
    if  ((modulePath.find(&*"evg_".to_string()).map(|i| i as i64).unwrap_or(-1))) >= 0 {
      return;
    }
    let mut importedNames : Vec<String> = Vec::new();
    let mut j : i64 = 0;
    while j < ((node.children.len() as i64)) {
      let mut spec : TSNode = node.children[j as usize].clone();
      if  spec.nodeType == "ImportSpecifier".to_string() {
        importedNames.push(spec.name.clone());
      }
      if  spec.nodeType == "ImportDefaultSpecifier".to_string() {
        importedNames.push(spec.name.clone());
      }
      j = j + 1;
    };
    let fullPath : String = ComponentEngine::resolveModulePath(modulePath.clone());
    if  (fullPath.len() as i64) == 0 {
      return;
    }
    let dirPath : String = self.basePath.clone();
    println!( "{}", [&*([&*"Loading import: ".to_string(), &*dirPath].concat()), &*fullPath].concat() );
    let mut fileContent : Vec<u8> = std::fs::read(format!("{}/{}", dirPath, fullPath)).unwrap_or_default();
    let src : String = String::from_utf8_lossy(&fileContent).to_string();
    if  (src.len() as i64) == 0 {
      println!( "{}", "".to_string() );
      println!( "{}", [&*([&*"ERROR: Could not load component module: ".to_string(), &*dirPath].concat()), &*fullPath].concat() );
      println!( "{}", "".to_string() );
      println!( "{}", "Please ensure the imported file exists. You may need to:".to_string() );
      println!( "{}", "  1. Check that the import path is correct in your TSX file".to_string() );
      println!( "{}", "  2. Make sure the component file exists in one of your asset paths:".to_string() );
      let mut pathIdx : i64 = 0;
      while pathIdx < ((self.assetPaths.len() as i64)) {
        println!( "{}", [&*"     - ".to_string(), &*(self.assetPaths[pathIdx as usize].clone())].concat() );
        pathIdx = pathIdx + 1;
      };
      println!( "{}", "".to_string() );
      return;
    }
    let mut lexer : TSLexer = TSLexer::new(src.clone());
    let mut tokens : Vec<Token> = lexer.tokenize();
    let mut importParser : TSParserSimple = TSParserSimple::new();
    importParser.initParser(&tokens);
    importParser.tsxMode = true;
    let mut importAst : TSNode = importParser.parseProgram();
    let mut k : i64 = 0;
    while k < ((importAst.children.len() as i64)) {
      let mut stmt : TSNode = importAst.children[k as usize].clone();
      if  stmt.nodeType == "ExportNamedDeclaration".to_string() {
        if stmt.left.is_some() {
          let mut declNode : TSNode = (*stmt.left.clone().unwrap());
          if  declNode.nodeType == "FunctionDeclaration".to_string() {
            let fnName : String = declNode.name.clone();
            if  ComponentEngine::isInList(fnName.clone(), &importedNames) {
              let mut sym : ImportedSymbol = ImportedSymbol::new();
              sym.name = fnName.clone();
              sym.originalName = fnName.clone();
              sym.sourcePath = fullPath.clone();
              sym.symbolType = "component".to_string();
              sym.functionNode = Some(declNode.clone());
              self.localComponents.push(sym.clone());
              println!( "{}", [&*([&*([&*"Imported component: ".to_string(), &*fnName].concat()), &*" from ".to_string()].concat()), &*fullPath].concat() );
            }
          }
        }
      }
      if  stmt.nodeType == "FunctionDeclaration".to_string() {
        let fnName_1 : String = stmt.name.clone();
        if  ComponentEngine::isInList(fnName_1.clone(), &importedNames) {
          let mut sym_1 : ImportedSymbol = ImportedSymbol::new();
          sym_1.name = fnName_1.clone();
          sym_1.originalName = fnName_1.clone();
          sym_1.sourcePath = fullPath.clone();
          sym_1.symbolType = "component".to_string();
          sym_1.functionNode = Some(stmt.clone());
          self.localComponents.push(sym_1.clone());
          println!( "{}", [&*([&*([&*"Imported component: ".to_string(), &*fnName_1].concat()), &*" from ".to_string()].concat()), &*fullPath].concat() );
        }
      }
      k = k + 1;
    };
  }
  fn resolveModulePath(modulePath : String) -> String {
    if  ((modulePath.find(&*"./".to_string()).map(|i| i as i64).unwrap_or(-1))) == 0 {
      let mut path : String = modulePath.chars().skip(2 as usize).take(((modulePath.len() as i64) - 2) as usize).collect::<String>();
      if  (path.len() as i64) == 0 {
        return "".to_string().clone();
      }
      if  ((path.find(&*".tsx".to_string()).map(|i| i as i64).unwrap_or(-1))) < 0 {
        if  ((path.find(&*".ts".to_string()).map(|i| i as i64).unwrap_or(-1))) < 0 {
          path = [&*path, &*".tsx".to_string()].concat();
        }
      }
      return path.clone();
    }
    if  ((modulePath.find(&*".tsx".to_string()).map(|i| i as i64).unwrap_or(-1))) < 0 {
      if  ((modulePath.find(&*".ts".to_string()).map(|i| i as i64).unwrap_or(-1))) < 0 {
        return [&*modulePath, &*".tsx".to_string()].concat().clone();
      }
    }
    return modulePath.clone();
  }
  fn isInList(name : String, list : &Vec<String>) -> bool {
    let mut i : i64 = 0;
    while i < ((list.len() as i64)) {
      if  (list[i as usize].clone()) == name {
        return true;
      }
      i = i + 1;
    };
    return false;
  }
  fn registerComponents(&mut self, mut ast : TSNode) -> () {
    let mut i : i64 = 0;
    while i < ((ast.children.len() as i64)) {
      let mut node : TSNode = ast.children[i as usize].clone();
      if  node.nodeType == "FunctionDeclaration".to_string() {
        if  node.name != "render".to_string() {
          let mut sym : ImportedSymbol = ImportedSymbol::new();
          sym.name = node.name.clone();
          sym.originalName = node.name.clone();
          sym.symbolType = "component".to_string();
          sym.functionNode = Some(node.clone());
          self.localComponents.push(sym.clone());
          println!( "{}", [&*"Registered local component: ".to_string(), &*node.name].concat() );
        }
      }
      i = i + 1;
    };
  }
  fn findRenderFunction(&mut self, mut ast : TSNode) -> TSNode {
    let mut empty : TSNode = TSNode::new();
    let mut i : i64 = 0;
    while i < ((ast.children.len() as i64)) {
      let mut node : TSNode = ast.children[i as usize].clone();
      if  node.nodeType == "FunctionDeclaration".to_string() {
        if  node.name == "render".to_string() {
          return node.clone();
        }
      }
      i = i + 1;
    };
    return empty.clone();
  }
  fn processVariables(&mut self, mut ast : TSNode) -> () {
    let mut i : i64 = 0;
    while i < ((ast.children.len() as i64)) {
      let mut node : TSNode = ast.children[i as usize].clone();
      if  node.nodeType == "VariableDeclaration".to_string() {
        self.processVariableDeclaration(node.clone());
      }
      i = i + 1;
    };
  }
  fn processVariableDeclaration(&mut self, mut node : TSNode) -> () {
    let mut i : i64 = 0;
    while i < ((node.children.len() as i64)) {
      let mut decl : TSNode = node.children[i as usize].clone();
      if  decl.nodeType == "VariableDeclarator".to_string() {
        let varName : String = decl.name.clone();
        if decl.init.is_some() {
          let mut initNode : TSNode = (*decl.init.clone().unwrap());
          let mut value : EvalValue = self.evaluateExpr(initNode.clone());
          self.context.as_mut().unwrap().define(varName.clone(), value.clone());
          println!( "{}", [&*([&*([&*"Defined variable: ".to_string(), &*varName].concat()), &*" = ".to_string()].concat()), &*(value).toString()].concat() );
        }
      }
      i = i + 1;
    };
  }
  fn evaluateFunction(&mut self, mut fnNode : TSNode) -> EVGElement {
    let mut savedContext : EvalContext = self.context.clone().unwrap().clone();
    self.context = Some(self.context.as_mut().unwrap().createChild());
    let mut body : TSNode = self.getFunctionBody(fnNode.clone());
    let mut result : EVGElement = self.evaluateFunctionBody(body.clone());
    self.context = Some(savedContext.clone());
    return result.clone();
  }
  fn evaluateFunctionWithProps(&mut self, mut fnNode : TSNode, mut props : &mut EvalValue) -> EVGElement {
    let mut savedContext : EvalContext = self.context.clone().unwrap().clone();
    self.context = Some(self.context.as_mut().unwrap().createChild());
    self.bindFunctionParams(fnNode.clone(), &mut props);
    let mut body : TSNode = self.getFunctionBody(fnNode.clone());
    let mut result : EVGElement = self.evaluateFunctionBody(body.clone());
    self.context = Some(savedContext.clone());
    return result.clone();
  }
  fn bindFunctionParams(&mut self, mut fnNode : TSNode, mut props : &mut EvalValue) -> () {
    let mut i : i64 = 0;
    while i < ((fnNode.params.len() as i64)) {
      let mut param : TSNode = fnNode.params[i as usize].clone();
      if  param.nodeType == "ObjectPattern".to_string() {
        self.bindObjectPattern(param.clone(), &mut props);
      }
      if  param.nodeType == "Parameter".to_string() {
        let __arg_0 = param.name.clone();
        self.context.as_mut().unwrap().define(__arg_0, props.clone());
      }
      if  param.nodeType == "Identifier".to_string() {
        let __arg_0 = param.name.clone();
        self.context.as_mut().unwrap().define(__arg_0, props.clone());
      }
      i = i + 1;
    };
  }
  fn bindObjectPattern(&mut self, mut pattern : TSNode, mut props : &mut EvalValue) -> () {
    let mut i : i64 = 0;
    while i < ((pattern.children.len() as i64)) {
      let mut prop : TSNode = pattern.children[i as usize].clone();
      if  prop.nodeType == "Property".to_string() {
        let propName : String = prop.name.clone();
        let mut propValue : EvalValue = props.getMember(propName.clone());
        if  propValue.isNull() {
          if prop.init.is_some() {
            let mut initNode : TSNode = (*prop.init.clone().unwrap());
            propValue = self.evaluateExpr(initNode.clone());
          }
        }
        self.context.as_mut().unwrap().define(propName.clone(), propValue.clone());
      }
      i = i + 1;
    };
  }
  fn getFunctionBody(&mut self, mut fnNode : TSNode) -> TSNode {
    if fnNode.body.is_some() {
      return (*fnNode.body.clone().unwrap()).clone();
    }
    let mut empty : TSNode = TSNode::new();
    return empty.clone();
  }
  fn evaluateFunctionBody(&mut self, mut body : TSNode) -> EVGElement {
    let mut empty : EVGElement = EVGElement::new();
    let mut i : i64 = 0;
    while i < ((body.children.len() as i64)) {
      let mut stmt : TSNode = body.children[i as usize].clone();
      if  stmt.nodeType == "VariableDeclaration".to_string() {
        self.processVariableDeclaration(stmt.clone());
      }
      if  stmt.nodeType == "ReturnStatement".to_string() {
        if stmt.left.is_some() {
          let mut returnExpr : TSNode = (*stmt.left.clone().unwrap());
          return self.evaluateJSX(returnExpr.clone()).clone();
        }
      }
      i = i + 1;
    };
    if  (body.nodeType == "JSXElement".to_string()) || (body.nodeType == "JSXFragment".to_string()) {
      return self.evaluateJSX(body.clone()).clone();
    }
    return empty.clone();
  }
  fn evaluateJSX(&mut self, mut node : TSNode) -> EVGElement {
    let mut element : EVGElement = EVGElement::new();
    if  node.nodeType == "JSXElement".to_string() {
      return self.evaluateJSXElement(node.clone()).clone();
    }
    if  node.nodeType == "JSXFragment".to_string() {
      element.tagName = "div".to_string();
      self.evaluateChildren(&mut element, node.clone());
      return element.clone();
    }
    if  node.nodeType == "ParenthesizedExpression".to_string() {
      if node.left.is_some() {
        let mut inner : TSNode = (*node.left.clone().unwrap());
        return self.evaluateJSX(inner.clone()).clone();
      }
    }
    return element.clone();
  }
  fn evaluateJSXElement(&mut self, mut jsxNode : TSNode) -> EVGElement {
    let mut tagName : String = "".to_string();
    if jsxNode.left.is_some() {
      let mut openingEl : TSNode = (*jsxNode.left.clone().unwrap());
      tagName = openingEl.name.clone();
    }
    if  self.isComponent(tagName.clone()) {
      return self.expandComponent(tagName.clone(), jsxNode.clone()).clone();
    }
    let mut element : EVGElement = EVGElement::new();
    element.tagName = ComponentEngine::mapTagName(tagName.clone());
    if jsxNode.left.is_some() {
      let mut openingEl_1 : TSNode = (*jsxNode.left.clone().unwrap());
      self.evaluateAttributes(&mut element, openingEl_1.clone());
    }
    if  ((tagName == "Label".to_string()) || (tagName == "span".to_string())) || (tagName == "text".to_string()) {
      element.textContent = self.evaluateTextContent(jsxNode.clone());
    } else {
      self.evaluateChildren(&mut element, jsxNode.clone());
    }
    return element.clone();
  }
  fn isComponent(&mut self, name : String) -> bool {
    if  (name.len() as i64) == 0 {
      return false;
    }
    let mut i : i64 = 0;
    while i < ((self.primitives.len() as i64)) {
      if  (self.primitives[i as usize].clone()) == name {
        return false;
      }
      i = i + 1;
    };
    let firstChar : i64 = name.chars().nth(0 as usize).unwrap_or('\0') as i64;
    if  (firstChar >= 65) && (firstChar <= 90) {
      return true;
    }
    return false;
  }
  fn expandComponent(&mut self, name : String, mut jsxNode : TSNode) -> EVGElement {
    let mut i : i64 = 0;
    while i < ((self.localComponents.len() as i64)) {
      let mut sym : ImportedSymbol = self.localComponents[i as usize].clone();
      if  sym.name == name {
        let mut props : EvalValue = self.evaluateProps(jsxNode.clone());
        if sym.functionNode.is_some() {
          let mut fnNode : TSNode = sym.functionNode.clone().unwrap();
          return self.evaluateFunctionWithProps(fnNode.clone(), &mut props).clone();
        }
      }
      i = i + 1;
    };
    println!( "{}", [&*"Warning: Unknown component: ".to_string(), &*name].concat() );
    let mut empty : EVGElement = EVGElement::new();
    empty.tagName = "div".to_string();
    return empty.clone();
  }
  fn evaluateProps(&mut self, mut jsxNode : TSNode) -> EvalValue {
    let mut keys : Vec<String> = Vec::new();
    let mut values : Vec<EvalValue> = Vec::new();
    if jsxNode.left.is_some() {
      let mut openingEl : TSNode = (*jsxNode.left.clone().unwrap());
      let mut i : i64 = 0;
      while i < ((openingEl.children.len() as i64)) {
        let mut attr : TSNode = openingEl.children[i as usize].clone();
        if  attr.nodeType == "JSXAttribute".to_string() {
          let attrName : String = attr.name.clone();
          let mut attrValue : EvalValue = self.evaluateAttributeValue(attr.clone());
          keys.push(attrName.clone());
          values.push(attrValue.clone());
        }
        i = i + 1;
      };
    }
    let mut hasExplicitChildren : bool = false;
    let mut ci : i64 = 0;
    while ci < ((keys.len() as i64)) {
      if  (keys[ci as usize].clone()) == "children".to_string() {
        hasExplicitChildren = true;
      }
      ci = ci + 1;
    };
    if  hasExplicitChildren == false {
      let mut childElements : Vec<EvalValue> = self.collectChildElements(jsxNode.clone());
      if  ((childElements.len() as i64)) > 0 {
        keys.push("children".to_string().to_string());
        if  ((childElements.len() as i64)) == 1 {
          values.push(childElements[0 as usize].clone());
        } else {
          values.push(EvalValue::array(childElements.clone()));
        }
      }
    }
    return EvalValue::object(keys.clone(), values.clone()).clone();
  }
  fn collectChildElements(&mut self, mut jsxNode : TSNode) -> Vec<EvalValue> {
    let mut results : Vec<EvalValue> = Vec::new();
    let mut i : i64 = 0;
    while i < ((jsxNode.children.len() as i64)) {
      let mut child : TSNode = jsxNode.children[i as usize].clone();
      if  child.nodeType == "JSXElement".to_string() {
        let mut el : EVGElement = self.evaluateJSXElement(child.clone());
        if  (el.tagName.len() as i64) > 0 {
          results.push(EvalValue::element(el.clone()));
        }
      }
      if  child.nodeType == "JSXText".to_string() {
        let text : String = ComponentEngine::trimText(child.value.clone());
        if  (text.len() as i64) > 0 {
          let mut textEl : EVGElement = EVGElement::new();
          textEl.tagName = "text".to_string();
          textEl.textContent = text.clone();
          results.push(EvalValue::element(textEl.clone()));
        }
      }
      if  child.nodeType == "JSXExpressionContainer".to_string() {
        if child.left.is_some() {
          let mut exprNode : TSNode = (*child.left.clone().unwrap());
          let mut exprValue : EvalValue = self.evaluateExpr(exprNode.clone());
          if  exprValue.isElement() {
            results.push(exprValue.clone());
          }
          if  (exprValue).isArray() {
            let mut ai : i64 = 0;
            while ai < ((exprValue.arrayValue.len() as i64)) {
              let mut arrItem : EvalValue = exprValue.arrayValue[ai as usize].clone();
              if  arrItem.isElement() {
                results.push(arrItem.clone());
              }
              ai = ai + 1;
            };
          }
        }
      }
      i = i + 1;
    };
    return results.clone();
  }
  fn evaluateAttributeValue(&mut self, mut attr : TSNode) -> EvalValue {
    if attr.right.is_some() {
      let mut rightNode : TSNode = (*attr.right.clone().unwrap());
      if  rightNode.nodeType == "StringLiteral".to_string() {
        return EvalValue::string(ComponentEngine::unquote(rightNode.value.clone())).clone();
      }
      if  rightNode.nodeType == "JSXExpressionContainer".to_string() {
        if rightNode.left.is_some() {
          let mut exprNode : TSNode = (*rightNode.left.clone().unwrap());
          return self.evaluateExpr(exprNode.clone()).clone();
        }
      }
    }
    return EvalValue::boolean(true).clone();
  }
  fn evaluateAttributes(&mut self, mut element : &mut EVGElement, mut openingNode : TSNode) -> () {
    let mut i : i64 = 0;
    while i < ((openingNode.children.len() as i64)) {
      let mut attr : TSNode = openingNode.children[i as usize].clone();
      if  attr.nodeType == "JSXAttribute".to_string() {
        let rawAttrName : String = attr.name.clone();
        let mut attrValue : EvalValue = self.evaluateAttributeValue(attr.clone());
        let strValue : String = (attrValue).toString();
        self.applyAttribute(&mut element, rawAttrName.clone(), strValue.clone());
      }
      i = i + 1;
    };
  }
  fn applyAttribute(&mut self, mut element : &mut EVGElement, rawName : String, strValue : String) -> () {
    if  rawName == "id".to_string() {
      element.id = strValue.clone();
      return;
    }
    if  rawName == "className".to_string() {
      element.className = strValue.clone();
      return;
    }
    if  rawName == "src".to_string() {
      element.src = strValue.clone();
      return;
    }
    element.setAttribute(rawName.clone(), strValue.clone());
  }
  fn evaluateTextContent(&mut self, mut jsxNode : TSNode) -> String {
    let mut result : String = "".to_string();
    let mut i : i64 = 0;
    while i < ((jsxNode.children.len() as i64)) {
      let mut child : TSNode = jsxNode.children[i as usize].clone();
      if  child.nodeType == "JSXText".to_string() {
        let rawText : String = child.value.clone();
        if  (rawText.len() as i64) > 0 {
          result = self.smartJoinText(result.clone(), rawText.clone());
        }
      }
      if  child.nodeType == "JSXExpressionContainer".to_string() {
        if child.left.is_some() {
          let mut exprNode : TSNode = (*child.left.clone().unwrap());
          let mut exprValue : EvalValue = self.evaluateExpr(exprNode.clone());
          let exprStr : String = (exprValue).toString();
          result = self.smartJoinText(result.clone(), exprStr.clone());
        }
      }
      i = i + 1;
    };
    let normalizedText : String = ComponentEngine::normalizeWhitespace(result.clone());
    let trimmedText : String = ComponentEngine::trimText(normalizedText.clone());
    return trimmedText.clone();
  }
  fn evaluateChildren(&mut self, mut element : &mut EVGElement, mut jsxNode : TSNode) -> () {
    let mut i : i64 = 0;
    let mut accumulatedText : String = "".to_string();
    while i < ((jsxNode.children.len() as i64)) {
      let mut child : TSNode = jsxNode.children[i as usize].clone();
      if  child.nodeType == "JSXText".to_string() {
        accumulatedText = self.smartJoinText(accumulatedText.clone(), child.value.clone());
        i = i + 1;
        continue;
      }
      if  (accumulatedText.len() as i64) > 0 {
        let normalizedText : String = ComponentEngine::normalizeWhitespace(accumulatedText.clone());
        let text : String = ComponentEngine::trimText(normalizedText.clone());
        if  (text.len() as i64) > 0 {
          let mut textEl : EVGElement = EVGElement::new();
          textEl.tagName = "text".to_string();
          textEl.textContent = text.clone();
          element.addChild(&mut textEl);
        }
        accumulatedText = "".to_string();
      }
      if  child.nodeType == "JSXElement".to_string() {
        let mut childEl : EVGElement = self.evaluateJSXElement(child.clone());
        if  (childEl.tagName.len() as i64) > 0 {
          element.addChild(&mut childEl);
        }
      }
      if  child.nodeType == "JSXExpressionContainer".to_string() {
        self.evaluateExpressionChild(&mut element, child.clone());
      }
      if  child.nodeType == "JSXFragment".to_string() {
        self.evaluateChildren(&mut element, child.clone());
      }
      i = i + 1;
    };
    if  (accumulatedText.len() as i64) > 0 {
      let normalizedText_1 : String = ComponentEngine::normalizeWhitespace(accumulatedText.clone());
      let text_1 : String = ComponentEngine::trimText(normalizedText_1.clone());
      if  (text_1.len() as i64) > 0 {
        let mut textEl_1 : EVGElement = EVGElement::new();
        textEl_1.tagName = "text".to_string();
        textEl_1.textContent = text_1.clone();
        element.addChild(&mut textEl_1);
      }
    }
  }
  fn evaluateExpressionChild(&mut self, mut element : &mut EVGElement, mut exprContainer : TSNode) -> () {
    if exprContainer.left.is_some() {
      let mut exprNode : TSNode = (*exprContainer.left.clone().unwrap());
      if  exprNode.nodeType == "CallExpression".to_string() {
        self.evaluateArrayMapChild(&mut element, exprNode.clone());
        return;
      }
      if  exprNode.nodeType == "ConditionalExpression".to_string() {
        self.evaluateTernaryChild(&mut element, exprNode.clone());
        return;
      }
      if  exprNode.nodeType == "BinaryExpression".to_string() {
        if  exprNode.value == "&&".to_string() {
          self.evaluateAndChild(&mut element, exprNode.clone());
          return;
        }
      }
      let mut value : EvalValue = self.evaluateExpr(exprNode.clone());
      if  value.isElement() {
        if value.evgElement.is_some() {
          let mut childEl : EVGElement = value.evgElement.clone().unwrap();
          if  (childEl.tagName.len() as i64) > 0 {
            element.addChild(&mut childEl);
          }
        }
        return;
      }
      if  (value).isArray() {
        let mut ai : i64 = 0;
        while ai < ((value.arrayValue.len() as i64)) {
          let mut arrItem : EvalValue = value.arrayValue[ai as usize].clone();
          if  arrItem.isElement() {
            if arrItem.evgElement.is_some() {
              let mut arrChildEl : EVGElement = arrItem.evgElement.clone().unwrap();
              if  (arrChildEl.tagName.len() as i64) > 0 {
                element.addChild(&mut arrChildEl);
              }
            }
          }
          ai = ai + 1;
        };
        return;
      }
      let isStr : bool = value.isString();
      let isNum : bool = value.isNumber();
      if  isStr || isNum {
        let mut textEl : EVGElement = EVGElement::new();
        textEl.tagName = "text".to_string();
        textEl.textContent = (value).toString();
        element.addChild(&mut textEl);
      }
    }
  }
  fn evaluateArrayMapChild(&mut self, mut element : &mut EVGElement, mut callNode : TSNode) -> () {
    if callNode.left.is_some() {
      let mut calleeNode : TSNode = (*callNode.left.clone().unwrap());
      if  calleeNode.nodeType == "MemberExpression".to_string() {
        let methodName : String = calleeNode.name.clone();
        if  methodName == "map".to_string() {
          if calleeNode.left.is_some() {
            let mut arrayExpr : TSNode = (*calleeNode.left.clone().unwrap());
            let mut arrayValue : EvalValue = self.evaluateExpr(arrayExpr.clone());
            if  (arrayValue).isArray() {
              if  ((callNode.children.len() as i64)) > 0 {
                let mut callback : TSNode = callNode.children[0 as usize].clone();
                let mut i : i64 = 0;
                while i < ((arrayValue.arrayValue.len() as i64)) {
                  let mut item : EvalValue = arrayValue.arrayValue[i as usize].clone();
                  let mut savedContext : EvalContext = self.context.clone().unwrap().clone();
                  self.context = Some(self.context.as_mut().unwrap().createChild());
                  self.bindMapCallback(callback.clone(), item.clone(), i);
                  let mut resultEl : EVGElement = self.evaluateMapCallbackBody(callback.clone());
                  if  (resultEl.tagName.len() as i64) > 0 {
                    element.addChild(&mut resultEl);
                  }
                  self.context = Some(savedContext.clone());
                  i = i + 1;
                };
              }
            }
          }
        }
      }
    }
  }
  fn bindMapCallback(&mut self, mut callback : TSNode, mut item : EvalValue, index : i64) -> () {
    if  callback.nodeType == "ArrowFunctionExpression".to_string() {
      if  ((callback.params.len() as i64)) > 0 {
        let mut param : TSNode = callback.params[0 as usize].clone();
        let paramName : String = param.name.clone();
        self.context.as_mut().unwrap().define(paramName.clone(), item.clone());
      }
      if  ((callback.params.len() as i64)) > 1 {
        let mut indexParam : TSNode = callback.params[1 as usize].clone();
        let __arg_0 = indexParam.name.clone();
        let __arg_1 = EvalValue::fromInt(index).clone();
        self.context.as_mut().unwrap().define(__arg_0, __arg_1);
      }
    }
  }
  fn evaluateMapCallbackBody(&mut self, mut callback : TSNode) -> EVGElement {
    let mut empty : EVGElement = EVGElement::new();
    if  callback.nodeType == "ArrowFunctionExpression".to_string() {
      if callback.body.is_some() {
        let mut body : TSNode = (*callback.body.clone().unwrap());
        if  (body.nodeType == "JSXElement".to_string()) || (body.nodeType == "JSXFragment".to_string()) {
          return self.evaluateJSX(body.clone()).clone();
        }
        if  body.nodeType == "BlockStatement".to_string() {
          return self.evaluateFunctionBody(body.clone()).clone();
        }
      }
    }
    return empty.clone();
  }
  fn evaluateTernaryChild(&mut self, mut element : &mut EVGElement, mut node : TSNode) -> () {
    if node.test.is_some() {
      let mut testExpr : TSNode = (*node.test.clone().unwrap());
      let mut testValue : EvalValue = self.evaluateExpr(testExpr.clone());
      if  testValue.toBool() {
        if node.consequent.is_some() {
          let mut conseqNode : TSNode = (*node.consequent.clone().unwrap());
          if  (conseqNode.nodeType == "JSXElement".to_string()) || (conseqNode.nodeType == "JSXFragment".to_string()) {
            let mut childEl : EVGElement = self.evaluateJSX(conseqNode.clone());
            if  (childEl.tagName.len() as i64) > 0 {
              element.addChild(&mut childEl);
            }
          }
        }
      } else {
        if node.alternate.is_some() {
          let mut altNode : TSNode = (*node.alternate.clone().unwrap());
          if  (altNode.nodeType == "JSXElement".to_string()) || (altNode.nodeType == "JSXFragment".to_string()) {
            let mut childEl_1 : EVGElement = self.evaluateJSX(altNode.clone());
            if  (childEl_1.tagName.len() as i64) > 0 {
              element.addChild(&mut childEl_1);
            }
          }
        }
      }
    }
  }
  fn evaluateAndChild(&mut self, mut element : &mut EVGElement, mut node : TSNode) -> () {
    if node.left.is_some() {
      let mut leftExpr : TSNode = (*node.left.clone().unwrap());
      let mut leftValue : EvalValue = self.evaluateExpr(leftExpr.clone());
      if  leftValue.toBool() {
        if node.right.is_some() {
          let mut rightNode : TSNode = (*node.right.clone().unwrap());
          if  (rightNode.nodeType == "JSXElement".to_string()) || (rightNode.nodeType == "JSXFragment".to_string()) {
            let mut childEl : EVGElement = self.evaluateJSX(rightNode.clone());
            if  (childEl.tagName.len() as i64) > 0 {
              element.addChild(&mut childEl);
            }
          }
        }
      }
    }
  }
  fn evaluateExpr(&mut self, mut node : TSNode) -> EvalValue {
    if  node.nodeType == "NumericLiteral".to_string() {
      let numVal : Option<f64> = node.value.parse::<f64>().ok();
      if numVal.is_some() {
        return EvalValue::number((numVal.unwrap())).clone();
      }
      return EvalValue::number(0_f64).clone();
    }
    if  node.nodeType == "StringLiteral".to_string() {
      return EvalValue::string(ComponentEngine::unquote(node.value.clone())).clone();
    }
    if  node.nodeType == "TemplateLiteral".to_string() {
      let mut templateText : String = "".to_string();
      let mut ti : i64 = 0;
      while ti < ((node.children.len() as i64)) {
        let mut templateChild : TSNode = node.children[ti as usize].clone();
        if  templateChild.nodeType == "TemplateElement".to_string() {
          templateText = [&*templateText, &*templateChild.value].concat();
        }
        ti = ti + 1;
      };
      return EvalValue::string(templateText.clone()).clone();
    }
    if  node.nodeType == "BooleanLiteral".to_string() {
      return EvalValue::boolean((node.value == "true".to_string())).clone();
    }
    if  node.nodeType == "NullLiteral".to_string() {
      return EvalValue::null().clone();
    }
    if  node.nodeType == "Identifier".to_string() {
      return self.context.as_mut().unwrap().lookup(node.name.clone()).clone();
    }
    if  node.nodeType == "BinaryExpression".to_string() {
      return self.evaluateBinaryExpr(node.clone()).clone();
    }
    if  node.nodeType == "UnaryExpression".to_string() {
      return self.evaluateUnaryExpr(node.clone()).clone();
    }
    if  node.nodeType == "ConditionalExpression".to_string() {
      return self.evaluateConditionalExpr(node.clone()).clone();
    }
    if  node.nodeType == "MemberExpression".to_string() {
      return self.evaluateMemberExpr(node.clone()).clone();
    }
    if  node.nodeType == "ArrayExpression".to_string() {
      return self.evaluateArrayExpr(node.clone()).clone();
    }
    if  node.nodeType == "ObjectExpression".to_string() {
      return self.evaluateObjectExpr(node.clone()).clone();
    }
    if  node.nodeType == "ParenthesizedExpression".to_string() {
      if node.left.is_some() {
        let mut inner : TSNode = (*node.left.clone().unwrap());
        return self.evaluateExpr(inner.clone()).clone();
      }
    }
    if  node.nodeType == "JSXElement".to_string() {
      let mut el : EVGElement = self.evaluateJSXElement(node.clone());
      return EvalValue::element(el.clone()).clone();
    }
    if  node.nodeType == "JSXFragment".to_string() {
      let mut el_1 : EVGElement = EVGElement::new();
      el_1.tagName = "div".to_string();
      self.evaluateChildren(&mut el_1, node.clone());
      return EvalValue::element(el_1.clone()).clone();
    }
    return EvalValue::null().clone();
  }
  fn evaluateBinaryExpr(&mut self, mut node : TSNode) -> EvalValue {
    let op : String = node.value.clone();
    if  op == "&&".to_string() {
      if node.left.is_some() {
        let mut leftExpr : TSNode = (*node.left.clone().unwrap());
        let mut left : EvalValue = self.evaluateExpr(leftExpr.clone());
        if  left.toBool() == false {
          return left.clone();
        }
        if node.right.is_some() {
          let mut rightExpr : TSNode = (*node.right.clone().unwrap());
          return self.evaluateExpr(rightExpr.clone()).clone();
        }
      }
    }
    if  op == "||".to_string() {
      if node.left.is_some() {
        let mut leftExpr_1 : TSNode = (*node.left.clone().unwrap());
        let mut left_1 : EvalValue = self.evaluateExpr(leftExpr_1.clone());
        if  left_1.toBool() {
          return left_1.clone();
        }
        if node.right.is_some() {
          let mut rightExpr_1 : TSNode = (*node.right.clone().unwrap());
          return self.evaluateExpr(rightExpr_1.clone()).clone();
        }
      }
    }
    let mut left_2 : EvalValue = EvalValue::null();
    let mut right : EvalValue = EvalValue::null();
    if node.left.is_some() {
      let mut leftExpr_2 : TSNode = (*node.left.clone().unwrap());
      left_2 = self.evaluateExpr(leftExpr_2.clone());
    }
    if node.right.is_some() {
      let mut rightExpr_2 : TSNode = (*node.right.clone().unwrap());
      right = self.evaluateExpr(rightExpr_2.clone());
    }
    if  op == "+".to_string() {
      let isLeftStr : bool = left_2.isString();
      let isRightStr : bool = right.isString();
      if  isLeftStr || isRightStr {
        return EvalValue::string(([&*(left_2).toString(), &*(right).toString()].concat())).clone();
      }
      return EvalValue::number((left_2.toNumber() + right.toNumber())).clone();
    }
    if  op == "-".to_string() {
      return EvalValue::number((left_2.toNumber() - right.toNumber())).clone();
    }
    if  op == "*".to_string() {
      return EvalValue::number((left_2.toNumber() * right.toNumber())).clone();
    }
    if  op == "/".to_string() {
      let rightNum : f64 = right.toNumber();
      if  rightNum != 0_f64 {
        return EvalValue::number((left_2.toNumber() / rightNum)).clone();
      }
      return EvalValue::number(0_f64).clone();
    }
    if  op == "%".to_string() {
      let leftInt : i64 = left_2.toNumber() as i64 ;
      let rightInt : i64 = right.toNumber() as i64 ;
      if  rightInt != 0 {
        return EvalValue::fromInt((leftInt % rightInt)).clone();
      }
      return EvalValue::number(0_f64).clone();
    }
    if  op == "<".to_string() {
      return EvalValue::boolean((left_2.toNumber() < right.toNumber())).clone();
    }
    if  op == ">".to_string() {
      return EvalValue::boolean((left_2.toNumber() > right.toNumber())).clone();
    }
    if  op == "<=".to_string() {
      return EvalValue::boolean((left_2.toNumber() <= right.toNumber())).clone();
    }
    if  op == ">=".to_string() {
      return EvalValue::boolean((left_2.toNumber() >= right.toNumber())).clone();
    }
    if  (op == "==".to_string()) || (op == "===".to_string()) {
      return EvalValue::boolean(left_2.equals(right.clone())).clone();
    }
    if  (op == "!=".to_string()) || (op == "!==".to_string()) {
      return EvalValue::boolean((left_2.equals(right.clone()) == false)).clone();
    }
    return EvalValue::null().clone();
  }
  fn evaluateUnaryExpr(&mut self, mut node : TSNode) -> EvalValue {
    let op : String = node.value.clone();
    if node.left.is_some() {
      let mut argExpr : TSNode = (*node.left.clone().unwrap());
      let mut arg : EvalValue = self.evaluateExpr(argExpr.clone());
      if  op == "!".to_string() {
        return EvalValue::boolean((arg.toBool() == false)).clone();
      }
      if  op == "-".to_string() {
        return EvalValue::number((0_f64 - arg.toNumber())).clone();
      }
      if  op == "+".to_string() {
        return EvalValue::number(arg.toNumber()).clone();
      }
    }
    return EvalValue::null().clone();
  }
  fn evaluateConditionalExpr(&mut self, mut node : TSNode) -> EvalValue {
    if node.test.is_some() {
      let mut testExpr : TSNode = (*node.test.clone().unwrap());
      let mut test : EvalValue = self.evaluateExpr(testExpr.clone());
      if  test.toBool() {
        if node.consequent.is_some() {
          let mut conseqNode : TSNode = (*node.consequent.clone().unwrap());
          return self.evaluateExpr(conseqNode.clone()).clone();
        }
      } else {
        if node.alternate.is_some() {
          let mut altNode : TSNode = (*node.alternate.clone().unwrap());
          return self.evaluateExpr(altNode.clone()).clone();
        }
      }
    }
    return EvalValue::null().clone();
  }
  fn evaluateMemberExpr(&mut self, mut node : TSNode) -> EvalValue {
    if node.left.is_some() {
      let mut leftExpr : TSNode = (*node.left.clone().unwrap());
      let mut obj : EvalValue = self.evaluateExpr(leftExpr.clone());
      let propName : String = node.name.clone();
      if  node.computed {
        if node.right.is_some() {
          let mut indexExpr : TSNode = (*node.right.clone().unwrap());
          let mut indexVal : EvalValue = self.evaluateExpr(indexExpr.clone());
          if  indexVal.isNumber() {
            let idx : i64 = indexVal.toNumber() as i64 ;
            return obj.getIndex(idx).clone();
          }
          if  indexVal.isString() {
            return obj.getMember(indexVal.stringValue.clone()).clone();
          }
        }
      }
      return obj.getMember(propName.clone()).clone();
    }
    return EvalValue::null().clone();
  }
  fn evaluateArrayExpr(&mut self, mut node : TSNode) -> EvalValue {
    let mut items : Vec<EvalValue> = Vec::new();
    let mut i : i64 = 0;
    while i < ((node.children.len() as i64)) {
      let mut elem : TSNode = node.children[i as usize].clone();
      let mut value : EvalValue = self.evaluateExpr(elem.clone());
      items.push(value.clone());
      i = i + 1;
    };
    return EvalValue::array(items.clone()).clone();
  }
  fn evaluateObjectExpr(&mut self, mut node : TSNode) -> EvalValue {
    let mut keys : Vec<String> = Vec::new();
    let mut values : Vec<EvalValue> = Vec::new();
    let mut i : i64 = 0;
    while i < ((node.children.len() as i64)) {
      let mut prop : TSNode = node.children[i as usize].clone();
      if  prop.nodeType == "Property".to_string() {
        let key : String = prop.name.clone();
        keys.push(key.clone());
        if prop.left.is_some() {
          let mut valueNode : TSNode = (*prop.left.clone().unwrap());
          values.push(self.evaluateExpr(valueNode.clone()));
        } else {
          values.push(EvalValue::null());
        }
      }
      i = i + 1;
    };
    return EvalValue::object(keys.clone(), values.clone()).clone();
  }
  fn mapTagName(jsxTag : String) -> String {
    if  jsxTag == "Print".to_string() {
      return "print".to_string().clone();
    }
    if  jsxTag == "Section".to_string() {
      return "section".to_string().clone();
    }
    if  jsxTag == "Page".to_string() {
      return "page".to_string().clone();
    }
    if  jsxTag == "View".to_string() {
      return "div".to_string().clone();
    }
    if  jsxTag == "Label".to_string() {
      return "text".to_string().clone();
    }
    if  jsxTag == "Image".to_string() {
      return "image".to_string().clone();
    }
    if  jsxTag == "Path".to_string() {
      return "path".to_string().clone();
    }
    if  jsxTag == "Spacer".to_string() {
      return "spacer".to_string().clone();
    }
    if  jsxTag == "Divider".to_string() {
      return "divider".to_string().clone();
    }
    if  jsxTag == "div".to_string() {
      return "div".to_string().clone();
    }
    if  jsxTag == "span".to_string() {
      return "text".to_string().clone();
    }
    if  jsxTag == "img".to_string() {
      return "image".to_string().clone();
    }
    if  jsxTag == "path".to_string() {
      return "path".to_string().clone();
    }
    return "div".to_string().clone();
  }
  fn trimText(text : String) -> String {
    let mut result : String = "".to_string();
    let mut started : bool = false;
    let mut i : i64 = 0;
    let __len : i64 = text.len() as i64;
    while i < __len {
      let c : i64 = text.chars().nth(i as usize).unwrap_or('\0') as i64;
      let isWhitespace : bool = (((c == 32) || (c == 9)) || (c == 10)) || (c == 13);
      if  started {
        result = [&*result, &*((char::from_u32(c as u32).unwrap_or('\0').to_string()))].concat();
      } else {
        if  isWhitespace == false {
          started = true;
          result = (char::from_u32(c as u32).unwrap_or('\0').to_string());
        }
      }
      i = i + 1;
    };
    let mut trimLen : i64 = result.len() as i64;
    while trimLen > 0 {
      let lastC : i64 = result.chars().nth((trimLen - 1) as usize).unwrap_or('\0') as i64;
      if  (((lastC == 32) || (lastC == 9)) || (lastC == 10)) || (lastC == 13) {
        result = result.chars().skip(0 as usize).take(((trimLen - 1) - 0) as usize).collect::<String>();
        trimLen = trimLen - 1;
      } else {
        trimLen = 0;
      }
    };
    return result.clone();
  }
  fn normalizeWhitespace(text : String) -> String {
    let mut result : String = "".to_string();
    let mut lastWasSpace : bool = false;
    let mut i : i64 = 0;
    let __len : i64 = text.len() as i64;
    while i < __len {
      let c : i64 = text.chars().nth(i as usize).unwrap_or('\0') as i64;
      let isWhitespace : bool = (((c == 32) || (c == 9)) || (c == 10)) || (c == 13);
      if  isWhitespace {
        if  lastWasSpace == false {
          result = [&*result, &*" ".to_string()].concat();
          lastWasSpace = true;
        }
      } else {
        result = [&*result, &*((char::from_u32(c as u32).unwrap_or('\0').to_string()))].concat();
        lastWasSpace = false;
      }
      i = i + 1;
    };
    return result.clone();
  }
  fn startsWithPunctuation(s : String) -> bool {
    if  (s.len() as i64) == 0 {
      return false;
    }
    let first : i64 = s.chars().nth(0 as usize).unwrap_or('\0') as i64;
    if  (((((first == 44) || (first == 46)) || (first == 33)) || (first == 63)) || (first == 58)) || (first == 59) {
      return true;
    }
    if  ((first == 41) || (first == 93)) || (first == 125) {
      return true;
    }
    if  ((first == 39) || (first == 34)) || (first == 45) {
      return true;
    }
    return false;
  }
  fn endsWithOpenPunctuation(s : String) -> bool {
    let __len : i64 = s.len() as i64;
    if  __len == 0 {
      return false;
    }
    let last : i64 = s.chars().nth((__len - 1) as usize).unwrap_or('\0') as i64;
    if  (((last == 40) || (last == 91)) || (last == 123)) || (last == 45) {
      return true;
    }
    return false;
  }
  fn smartJoinText(&mut self, existing : String, newText : String) -> String {
    if  (existing.len() as i64) == 0 {
      return newText.clone();
    }
    if  (newText.len() as i64) == 0 {
      return existing.clone();
    }
    if  ComponentEngine::startsWithPunctuation(newText.clone()) {
      return [&*existing, &*newText].concat().clone();
    }
    if  ComponentEngine::endsWithOpenPunctuation(existing.clone()) {
      return [&*existing, &*newText].concat().clone();
    }
    return [&*([&*existing, &*" ".to_string()].concat()), &*newText].concat().clone();
  }
  fn unquote(s : String) -> String {
    let __len : i64 = s.len() as i64;
    if  __len < 2 {
      return s.clone();
    }
    let first : i64 = s.chars().nth(0 as usize).unwrap_or('\0') as i64;
    let last : i64 = s.chars().nth((__len - 1) as usize).unwrap_or('\0') as i64;
    if  ((first == 34) || (first == 39)) && (first == last) {
      return s.chars().skip(1 as usize).take(((__len - 1) - 1) as usize).collect::<String>().clone();
    }
    return s.clone();
  }
}
#[derive(Clone)]
struct EVGComponentTool { 
  pageWidth : f64, 
  pageHeight : f64, 
  inputPath : String, 
  outputPath : String, 
  fontsDir : String, 
  assetPaths : String, 
  fontManager : FontManager, 
}
impl EVGComponentTool { 
  
  pub fn new() ->  EVGComponentTool {
    let mut me = EVGComponentTool { 
      pageWidth:595_f64, 
      pageHeight:842_f64, 
      inputPath:"".to_string(), 
      outputPath:"".to_string(), 
      fontsDir:"./Fonts".to_string(), 
      assetPaths:"".to_string(), 
      fontManager:FontManager::new(), 
    };
    return me;
  }
  fn main(&mut self, args : &Vec<String>) -> () {
    println!( "{}", "EVG Component Tool v1.0 - PDF Generator with TSX Components".to_string() );
    println!( "{}", "============================================================".to_string() );
    if  ((args.len() as i64)) < 3 {
      println!( "{}", "Usage: evg_component_tool <input.tsx> <output.pdf> [--assets=path1;path2;...]".to_string() );
      println!( "{}", "".to_string() );
      println!( "{}", "Options:".to_string() );
      println!( "{}", "  --assets=PATHS  Semicolon-separated list of asset directories".to_string() );
      println!( "{}", "                  Used for fonts, components, and images".to_string() );
      println!( "{}", "".to_string() );
      println!( "{}", "Example:".to_string() );
      println!( "{}", "  evg_component_tool test.tsx output.pdf --assets=./Fonts;./components".to_string() );
      return;
    }
    self.inputPath = args[1 as usize].clone();
    self.outputPath = args[2 as usize].clone();
    let mut i : i64 = 3;
    while i < ((args.len() as i64)) {
      let arg : String = args[i as usize].clone();
      if  ((arg.find(&*"--assets=".to_string()).map(|i| i as i64).unwrap_or(-1))) == 0 {
        self.assetPaths = arg.chars().skip(9 as usize).take(((arg.len() as i64) - 9) as usize).collect::<String>();
        println!( "{}", [&*"Asset paths: ".to_string(), &*self.assetPaths].concat() );
      }
      i = i + 1;
    };
    if  (self.assetPaths.len() as i64) == 0 {
      println!( "{}", "".to_string() );
      println!( "{}", "ERROR: Missing required --assets argument".to_string() );
      println!( "{}", "".to_string() );
      println!( "{}", "The --assets argument is required to specify where fonts and components are located.".to_string() );
      println!( "{}", "".to_string() );
      println!( "{}", "Usage: evg_component_tool <input.tsx> <output.pdf> --assets=path1;path2;...".to_string() );
      println!( "{}", "".to_string() );
      println!( "{}", "Example:".to_string() );
      println!( "{}", "  evg_component_tool test.tsx output.pdf --assets=./Fonts;./components".to_string() );
      return;
    }
    println!( "{}", [&*"Input:  ".to_string(), &*self.inputPath].concat() );
    println!( "{}", [&*"Output: ".to_string(), &*self.outputPath].concat() );
    println!( "{}", "".to_string() );
    let basePath : String = EVGComponentTool::getDirectory(self.inputPath.clone());
    let fileName : String = EVGComponentTool::getFileName(self.inputPath.clone());
    println!( "{}", [&*"Base path: ".to_string(), &*basePath].concat() );
    println!( "{}", [&*"File name: ".to_string(), &*fileName].concat() );
    println!( "{}", "".to_string() );
    self.initFonts();
    if  self.fontManager.getFontCount() == 0 {
      println!( "{}", "".to_string() );
      println!( "{}", "ERROR: No fonts were loaded!".to_string() );
      println!( "{}", "".to_string() );
      println!( "{}", "Please check that your --assets path contains a fonts directory with .ttf files.".to_string() );
      println!( "{}", "Expected structure: <assets-path>/Open_Sans/OpenSans-Regular.ttf".to_string() );
      println!( "{}", "".to_string() );
      println!( "{}", [&*"Current asset paths: ".to_string(), &*self.assetPaths].concat() );
      return;
    }
    let mut engine : ComponentEngine = ComponentEngine::new();
    engine.pageWidth = self.pageWidth;
    engine.pageHeight = self.pageHeight;
    if  (self.assetPaths.len() as i64) > 0 {
      engine.setAssetPaths(self.assetPaths.clone());
    }
    println!( "{}", "Parsing TSX with components...".to_string() );
    let mut evgRoot : EVGElement = engine.parseFile(basePath.clone(), fileName.clone());
    if  (evgRoot.tagName.len() as i64) == 0 {
      println!( "{}", "Error: Failed to generate EVG tree".to_string() );
      return;
    }
    println!( "{}", "EVG tree generated successfully".to_string() );
    println!( "{}", "".to_string() );
    println!( "{}", "EVG Tree Structure:".to_string() );
    println!( "{}", "-------------------".to_string() );
    self.printEVGTree(evgRoot.clone(), 0);
    println!( "{}", "".to_string() );
    println!( "{}", "Rendering to PDF...".to_string() );
    let mut renderer : Rc<RefCell<EVGPDFRenderer>> = Rc::new(RefCell::new(EVGPDFRenderer::new()));
    renderer.borrow_mut().init(renderer.clone());
    renderer.borrow_mut().setPageSize(self.pageWidth, self.pageHeight);
    renderer.borrow_mut().setFontManager(self.fontManager.clone());
    renderer.borrow_mut().setBaseDir(basePath.clone());
    if  (self.assetPaths.len() as i64) > 0 {
      renderer.borrow_mut().setAssetPaths(self.assetPaths.clone());
    }
    let mut ttfMeasurer : TTFTextMeasurer = TTFTextMeasurer::new(self.fontManager.clone());
    renderer.borrow_mut().setMeasurer(Rc::new(RefCell::new(ttfMeasurer.clone())));
    let mut pdfBuffer : Vec<u8> = renderer.borrow_mut().render(&mut evgRoot);
    let outputDir : String = EVGComponentTool::getDirectory(self.outputPath.clone());
    let outputFileName : String = EVGComponentTool::getFileName(self.outputPath.clone());
    std::fs::write(format!("{}/{}", outputDir, outputFileName), &pdfBuffer).unwrap();
    println!( "{}", [&*"PDF generated successfully: ".to_string(), &*self.outputPath].concat() );
  }
  fn printEVGTree(&mut self, mut el : EVGElement, depth : i64) -> () {
    let mut indent : String = "".to_string();
    let mut i : i64 = 0;
    while i < depth {
      indent = [&*indent, &*"  ".to_string()].concat();
      i = i + 1;
    };
    let mut info : String = [&*([&*indent, &*"<".to_string()].concat()), &*el.tagName].concat();
    if  (el.id.len() as i64) > 0 {
      info = [&*([&*([&*info, &*" id=\"".to_string()].concat()), &*el.id].concat()), &*"\"".to_string()].concat();
    }
    if  (el.textContent.len() as i64) > 0 {
      if  (el.textContent.len() as i64) > 30 {
        info = [&*([&*([&*info, &*" text=\"".to_string()].concat()), &*(el.textContent.chars().skip(0 as usize).take((30 - 0) as usize).collect::<String>())].concat()), &*"...\"".to_string()].concat();
      } else {
        info = [&*([&*([&*info, &*" text=\"".to_string()].concat()), &*el.textContent].concat()), &*"\"".to_string()].concat();
      }
    }
    info = [&*([&*([&*([&*([&*([&*([&*([&*info, &*"> pos=(".to_string()].concat()), &*(el.calculatedX.to_string())].concat()), &*",".to_string()].concat()), &*(el.calculatedY.to_string())].concat()), &*") size=".to_string()].concat()), &*(el.calculatedWidth.to_string())].concat()), &*"x".to_string()].concat()), &*(el.calculatedHeight.to_string())].concat();
    println!( "{}", info );
    i = 0;
    while i < ((el.children.len() as i64)) {
      let mut child : EVGElement = el.children[i as usize].clone();
      self.printEVGTree(child.clone(), depth + 1);
      i = i + 1;
    };
  }
  fn initFonts(&mut self, ) -> () {
    println!( "{}", "Loading fonts...".to_string() );
    if  (self.assetPaths.len() as i64) > 0 {
      let __arg_0 = self.assetPaths.clone();
      self.fontManager.setFontsDirectories(__arg_0);
    } else {
      let __arg_0 = self.fontsDir.clone();
      self.fontManager.setFontsDirectory(__arg_0);
    }
    self.fontManager.loadFont("Open_Sans/OpenSans-Regular.ttf".to_string());
    self.fontManager.loadFont("Open_Sans/OpenSans-Bold.ttf".to_string());
    self.fontManager.loadFont("Helvetica/Helvetica.ttf".to_string());
    self.fontManager.loadFont("Noto_Sans/NotoSans-Regular.ttf".to_string());
    self.fontManager.loadFont("Noto_Sans/NotoSans-Bold.ttf".to_string());
    self.fontManager.loadFont("Cinzel/Cinzel-Regular.ttf".to_string());
    self.fontManager.loadFont("Josefin_Sans/JosefinSans-Regular.ttf".to_string());
    self.fontManager.loadFont("Gloria_Hallelujah/GloriaHallelujah.ttf".to_string());
    self.fontManager.loadFont("Great_Vibes/GreatVibes-Regular.ttf".to_string());
    self.fontManager.loadFont("Kaushan_Script/KaushanScript-Regular.ttf".to_string());
  }
  fn getDirectory(path : String) -> String {
    let mut lastSlash : i64 = -1;
    let mut i : i64 = 0;
    let __len : i64 = path.len() as i64;
    while i < __len {
      let ch : String = path.chars().skip(i as usize).take(((i + 1) - i) as usize).collect::<String>();
      if  (ch == "/".to_string()) || (ch == "\\".to_string()) {
        lastSlash = i;
      }
      i = i + 1;
    };
    if  lastSlash >= 0 {
      return path.chars().skip(0 as usize).take(((lastSlash + 1) - 0) as usize).collect::<String>().clone();
    }
    return "./".to_string().clone();
  }
  fn getFileName(path : String) -> String {
    let mut lastSlash : i64 = -1;
    let mut i : i64 = 0;
    let __len : i64 = path.len() as i64;
    while i < __len {
      let ch : String = path.chars().skip(i as usize).take(((i + 1) - i) as usize).collect::<String>();
      if  (ch == "/".to_string()) || (ch == "\\".to_string()) {
        lastSlash = i;
      }
      i = i + 1;
    };
    if  lastSlash >= 0 {
      return path.chars().skip((lastSlash + 1) as usize).take((__len - (lastSlash + 1)) as usize).collect::<String>().clone();
    }
    return path.clone();
  }
}
fn main() {
  let mut tool : EVGComponentTool = EVGComponentTool::new();
  let argCount : i64 = (std::env::args().len() as i64 - 1);
  if  argCount < 2 {
    println!( "{}", "Usage: evg_component_tool <input.tsx> <output.pdf>".to_string() );
    return;
  }
  let mut args : Vec<String> = Vec::new();
  args.push("evg_component_tool".to_string().to_string());
  let mut i : i64 = 0;
  while i < argCount {
    args.push(std::env::args().nth((i + 1) as usize).unwrap_or_default());
    i = i + 1;
  };
  tool.main(&args);
}
