package main
import (
  "strings"
  "strconv"
  "fmt"
  "io/ioutil"
  "os"
)

type GoNullable struct {
  value interface{}
  has_value bool
}



// polyfill for reading files
func r_io_read_file( path string , fileName string ) *GoNullable {
   res := new(GoNullable);
   if v, err := ioutil.ReadFile(path + "/" + fileName); err == nil {
     res.has_value = true
     res.value = string(v)
   } else {
     res.has_value = false
   }
   return res
}


func r_write_text_file(pathName string, fileName string, txtData string)  {
    f, e := os.Create(pathName + "/" + fileName)
    if e != nil {
        panic(e)
    }
    defer f.Close()

    _ , err := f.WriteString(txtData)
    if err != nil {
        panic(err)
    }
    f.Sync()
}

type Token struct { 
  tokenType string `json:"tokenType"` 
  value string `json:"value"` 
  line int64 `json:"line"` 
  col int64 `json:"col"` 
  start int64 `json:"start"` 
  end int64 `json:"end"` 
}

func CreateNew_Token() *Token {
  me := new(Token)
  me.tokenType = ""
  me.value = ""
  me.line = int64(0)
  me.col = int64(0)
  me.start = int64(0)
  me.end = int64(0)
  return me;
}
type Lexer struct { 
  source string `json:"source"` 
  pos int64 `json:"pos"` 
  line int64 `json:"line"` 
  col int64 `json:"col"` 
  __len int64 `json:"len"` 
}

func CreateNew_Lexer(src string) *Lexer {
  me := new(Lexer)
  me.source = ""
  me.pos = int64(0)
  me.line = int64(1)
  me.col = int64(1)
  me.__len = int64(0)
  me.source = src; 
  me.__len = int64(len(src)); 
  return me;
}
func (this *Lexer) peek () string {
  if  this.pos >= this.__len {
    return ""
  }
  return this.source[this.pos: (this.pos + 1)]
}
func (this *Lexer) peekAt (offset int64) string {
  var idx int64= this.pos + offset;
  if  idx >= this.__len {
    return ""
  }
  return this.source[idx: (idx + 1)]
}
func (this *Lexer) advance () string {
  if  this.pos >= this.__len {
    return ""
  }
  var ch string= this.source[this.pos: (this.pos + 1)];
  this.pos = this.pos + int64(1); 
  if  (ch == "\n") || (ch == "\r\n") {
    this.line = this.line + int64(1); 
    this.col = int64(1); 
  } else {
    this.col = this.col + int64(1); 
  }
  return ch
}
func (this *Lexer) isDigit (ch string) bool {
  if  ch == "0" {
    return true
  }
  if  ch == "1" {
    return true
  }
  if  ch == "2" {
    return true
  }
  if  ch == "3" {
    return true
  }
  if  ch == "4" {
    return true
  }
  if  ch == "5" {
    return true
  }
  if  ch == "6" {
    return true
  }
  if  ch == "7" {
    return true
  }
  if  ch == "8" {
    return true
  }
  if  ch == "9" {
    return true
  }
  return false
}
func (this *Lexer) isAlpha (ch string) bool {
  if  (int64(len(ch))) == int64(0) {
    return false
  }
  var code int64= int64(this.source[this.pos]);
  if  code >= int64(97) {
    if  code <= int64(122) {
      return true
    }
  }
  if  code >= int64(65) {
    if  code <= int64(90) {
      return true
    }
  }
  if  ch == "_" {
    return true
  }
  if  ch == "$" {
    return true
  }
  return false
}
func (this *Lexer) isAlphaNumCh (ch string) bool {
  if  this.isDigit(ch) {
    return true
  }
  if  ch == "_" {
    return true
  }
  if  ch == "$" {
    return true
  }
  if  (int64(len(ch))) == int64(0) {
    return false
  }
  var code int64= int64(this.source[this.pos]);
  if  code >= int64(97) {
    if  code <= int64(122) {
      return true
    }
  }
  if  code >= int64(65) {
    if  code <= int64(90) {
      return true
    }
  }
  return false
}
func (this *Lexer) isWhitespace (ch string) bool {
  if  ch == " " {
    return true
  }
  if  ch == "\t" {
    return true
  }
  if  ch == "\n" {
    return true
  }
  if  ch == "\r" {
    return true
  }
  if  ch == "\r\n" {
    return true
  }
  return false
}
func (this *Lexer) skipWhitespace () () {
  for this.pos < this.__len {
    var ch string= this.peek();
    if  this.isWhitespace(ch) {
      this.advance();
    } else {
      return
    }
  }
}
func (this *Lexer) readLineComment () *Token {
  var startPos int64= this.pos;
  var startLine int64= this.line;
  var startCol int64= this.col;
  this.advance();
  this.advance();
  var value string= "";
  for this.pos < this.__len {
    var ch string= this.peek();
    if  ch == "\n" {
      return this.makeToken("LineComment", value, startPos, startLine, startCol)
    }
    if  ch == "\r\n" {
      return this.makeToken("LineComment", value, startPos, startLine, startCol)
    }
    value = value + this.advance(); 
  }
  return this.makeToken("LineComment", value, startPos, startLine, startCol)
}
func (this *Lexer) readBlockComment () *Token {
  var startPos int64= this.pos;
  var startLine int64= this.line;
  var startCol int64= this.col;
  this.advance();
  this.advance();
  var value string= "";
  var isJSDoc bool= false;
  if  this.peek() == "*" {
    var nextCh string= this.peekAt(int64(1));
    if  nextCh != "/" {
      isJSDoc = true; 
    }
  }
  for this.pos < this.__len {
    var ch string= this.peek();
    if  ch == "*" {
      if  this.peekAt(int64(1)) == "/" {
        this.advance();
        this.advance();
        if  isJSDoc {
          return this.makeToken("JSDocComment", value, startPos, startLine, startCol)
        }
        return this.makeToken("BlockComment", value, startPos, startLine, startCol)
      }
    }
    value = value + this.advance(); 
  }
  if  isJSDoc {
    return this.makeToken("JSDocComment", value, startPos, startLine, startCol)
  }
  return this.makeToken("BlockComment", value, startPos, startLine, startCol)
}
func (this *Lexer) makeToken (tokType string, value string, startPos int64, startLine int64, startCol int64) *Token {
  var tok *Token= CreateNew_Token();
  tok.tokenType = tokType; 
  tok.value = value; 
  tok.start = startPos; 
  tok.end = this.pos; 
  tok.line = startLine; 
  tok.col = startCol; 
  return tok
}
func (this *Lexer) readString (quote string) *Token {
  var startPos int64= this.pos;
  var startLine int64= this.line;
  var startCol int64= this.col;
  this.advance();
  var value string= "";
  for this.pos < this.__len {
    var ch string= this.peek();
    if  ch == quote {
      this.advance();
      return this.makeToken("String", value, startPos, startLine, startCol)
    }
    if  ch == "\\" {
      this.advance();
      var esc string= this.advance();
      if  esc == "n" {
        value = value + "\n"; 
      } else {
        if  esc == "t" {
          value = value + "\t"; 
        } else {
          if  esc == "r" {
            value = value + "\r"; 
          } else {
            if  esc == "\\" {
              value = value + "\\"; 
            } else {
              if  esc == quote {
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
  }
  return this.makeToken("String", value, startPos, startLine, startCol)
}
func (this *Lexer) readTemplateLiteral () *Token {
  var startPos int64= this.pos;
  var startLine int64= this.line;
  var startCol int64= this.col;
  this.advance();
  var value string= "";
  var hasExpressions bool= false;
  for this.pos < this.__len {
    var ch string= this.peek();
    if  ch == "`" {
      this.advance();
      if  hasExpressions {
        return this.makeToken("TemplateLiteral", value, startPos, startLine, startCol)
      } else {
        return this.makeToken("TemplateLiteral", value, startPos, startLine, startCol)
      }
    }
    if  ch == "\\" {
      this.advance();
      var esc string= this.advance();
      if  esc == "n" {
        value = value + "\n"; 
      }
      if  esc == "t" {
        value = value + "\t"; 
      }
      if  esc == "r" {
        value = value + "\r"; 
      }
      if  esc == "\\" {
        value = value + "\\"; 
      }
      if  esc == "`" {
        value = value + "`"; 
      }
      if  esc == "$" {
        value = value + "$"; 
      }
    } else {
      if  ch == "$" {
        if  this.peekAt(int64(1)) == "{" {
          hasExpressions = true; 
          value = value + this.advance(); 
          value = value + this.advance(); 
        } else {
          value = value + this.advance(); 
        }
      } else {
        value = value + this.advance(); 
      }
    }
  }
  return this.makeToken("TemplateLiteral", value, startPos, startLine, startCol)
}
func (this *Lexer) readNumber () *Token {
  var startPos int64= this.pos;
  var startLine int64= this.line;
  var startCol int64= this.col;
  var value string= "";
  for this.pos < this.__len {
    var ch string= this.peek();
    if  this.isDigit(ch) {
      value = value + this.advance(); 
    } else {
      if  ch == "." {
        value = value + this.advance(); 
      } else {
        return this.makeToken("Number", value, startPos, startLine, startCol)
      }
    }
  }
  return this.makeToken("Number", value, startPos, startLine, startCol)
}
func (this *Lexer) readIdentifier () *Token {
  var startPos int64= this.pos;
  var startLine int64= this.line;
  var startCol int64= this.col;
  var value string= "";
  for this.pos < this.__len {
    var ch string= this.peek();
    if  this.isAlphaNumCh(ch) {
      value = value + this.advance(); 
    } else {
      return this.makeToken(this.identType(value), value, startPos, startLine, startCol)
    }
  }
  return this.makeToken(this.identType(value), value, startPos, startLine, startCol)
}
func (this *Lexer) identType (value string) string {
  if  value == "var" {
    return "Keyword"
  }
  if  value == "let" {
    return "Keyword"
  }
  if  value == "const" {
    return "Keyword"
  }
  if  value == "function" {
    return "Keyword"
  }
  if  value == "return" {
    return "Keyword"
  }
  if  value == "if" {
    return "Keyword"
  }
  if  value == "else" {
    return "Keyword"
  }
  if  value == "while" {
    return "Keyword"
  }
  if  value == "for" {
    return "Keyword"
  }
  if  value == "in" {
    return "Keyword"
  }
  if  value == "of" {
    return "Keyword"
  }
  if  value == "switch" {
    return "Keyword"
  }
  if  value == "case" {
    return "Keyword"
  }
  if  value == "default" {
    return "Keyword"
  }
  if  value == "break" {
    return "Keyword"
  }
  if  value == "continue" {
    return "Keyword"
  }
  if  value == "try" {
    return "Keyword"
  }
  if  value == "catch" {
    return "Keyword"
  }
  if  value == "finally" {
    return "Keyword"
  }
  if  value == "throw" {
    return "Keyword"
  }
  if  value == "new" {
    return "Keyword"
  }
  if  value == "typeof" {
    return "Keyword"
  }
  if  value == "instanceof" {
    return "Keyword"
  }
  if  value == "this" {
    return "Keyword"
  }
  if  value == "class" {
    return "Keyword"
  }
  if  value == "extends" {
    return "Keyword"
  }
  if  value == "static" {
    return "Keyword"
  }
  if  value == "get" {
    return "Keyword"
  }
  if  value == "set" {
    return "Keyword"
  }
  if  value == "super" {
    return "Keyword"
  }
  if  value == "async" {
    return "Keyword"
  }
  if  value == "await" {
    return "Keyword"
  }
  if  value == "yield" {
    return "Keyword"
  }
  if  value == "import" {
    return "Keyword"
  }
  if  value == "export" {
    return "Keyword"
  }
  if  value == "from" {
    return "Keyword"
  }
  if  value == "as" {
    return "Keyword"
  }
  if  value == "true" {
    return "Boolean"
  }
  if  value == "false" {
    return "Boolean"
  }
  if  value == "null" {
    return "Null"
  }
  return "Identifier"
}
func (this *Lexer) nextToken () *Token {
  this.skipWhitespace();
  if  this.pos >= this.__len {
    return this.makeToken("EOF", "", this.pos, this.line, this.col)
  }
  var ch string= this.peek();
  var startPos int64= this.pos;
  var startLine int64= this.line;
  var startCol int64= this.col;
  if  ch == "/" {
    var next string= this.peekAt(int64(1));
    if  next == "/" {
      return this.readLineComment()
    }
    if  next == "*" {
      return this.readBlockComment()
    }
  }
  if  ch == "\"" {
    return this.readString("\"")
  }
  if  ch == "'" {
    return this.readString("'")
  }
  if  ch == "`" {
    return this.readTemplateLiteral()
  }
  if  this.isDigit(ch) {
    return this.readNumber()
  }
  if  this.isAlpha(ch) {
    return this.readIdentifier()
  }
  var next_1 string= this.peekAt(int64(1));
  if  ch == "=" {
    if  next_1 == "=" {
      if  this.peekAt(int64(2)) == "=" {
        this.advance();
        this.advance();
        this.advance();
        return this.makeToken("Punctuator", "===", startPos, startLine, startCol)
      }
    }
  }
  if  ch == "!" {
    if  next_1 == "=" {
      if  this.peekAt(int64(2)) == "=" {
        this.advance();
        this.advance();
        this.advance();
        return this.makeToken("Punctuator", "!==", startPos, startLine, startCol)
      }
    }
  }
  if  ch == "=" {
    if  next_1 == ">" {
      this.advance();
      this.advance();
      return this.makeToken("Punctuator", "=>", startPos, startLine, startCol)
    }
  }
  if  ch == "=" {
    if  next_1 == "=" {
      this.advance();
      this.advance();
      return this.makeToken("Punctuator", "==", startPos, startLine, startCol)
    }
  }
  if  ch == "!" {
    if  next_1 == "=" {
      this.advance();
      this.advance();
      return this.makeToken("Punctuator", "!=", startPos, startLine, startCol)
    }
  }
  if  ch == "<" {
    if  next_1 == "=" {
      this.advance();
      this.advance();
      return this.makeToken("Punctuator", "<=", startPos, startLine, startCol)
    }
  }
  if  ch == ">" {
    if  next_1 == "=" {
      this.advance();
      this.advance();
      return this.makeToken("Punctuator", ">=", startPos, startLine, startCol)
    }
  }
  if  ch == "&" {
    if  next_1 == "&" {
      this.advance();
      this.advance();
      return this.makeToken("Punctuator", "&&", startPos, startLine, startCol)
    }
  }
  if  ch == "|" {
    if  next_1 == "|" {
      this.advance();
      this.advance();
      return this.makeToken("Punctuator", "||", startPos, startLine, startCol)
    }
  }
  if  ch == "?" {
    if  next_1 == "?" {
      this.advance();
      this.advance();
      return this.makeToken("Punctuator", "??", startPos, startLine, startCol)
    }
    if  next_1 == "." {
      this.advance();
      this.advance();
      return this.makeToken("Punctuator", "?.", startPos, startLine, startCol)
    }
  }
  if  ch == "+" {
    if  next_1 == "+" {
      this.advance();
      this.advance();
      return this.makeToken("Punctuator", "++", startPos, startLine, startCol)
    }
  }
  if  ch == "-" {
    if  next_1 == "-" {
      this.advance();
      this.advance();
      return this.makeToken("Punctuator", "--", startPos, startLine, startCol)
    }
  }
  if  ch == "." {
    if  next_1 == "." {
      if  this.peekAt(int64(2)) == "." {
        this.advance();
        this.advance();
        this.advance();
        return this.makeToken("Punctuator", "...", startPos, startLine, startCol)
      }
    }
  }
  this.advance();
  return this.makeToken("Punctuator", ch, startPos, startLine, startCol)
}
func (this *Lexer) readRegexLiteral () *Token {
  var startPos int64= this.pos;
  var startLine int64= this.line;
  var startCol int64= this.col;
  this.advance();
  var pattern string= "";
  var inCharClass bool= false;
  for this.pos < this.__len {
    var ch string= this.peek();
    if  ch == "[" {
      inCharClass = true; 
      pattern = pattern + this.advance(); 
    } else {
      if  ch == "]" {
        inCharClass = false; 
        pattern = pattern + this.advance(); 
      } else {
        if  ch == "\\" {
          pattern = pattern + this.advance(); 
          if  this.pos < this.__len {
            pattern = pattern + this.advance(); 
          }
        } else {
          if  (ch == "/") && (inCharClass == false) {
            this.advance();
            break;
          } else {
            if  ((ch == "\n") || (ch == "\r")) || (ch == "\r\n") {
              return this.makeToken("RegexLiteral", pattern, startPos, startLine, startCol)
            } else {
              pattern = pattern + this.advance(); 
            }
          }
        }
      }
    }
  }
  var flags string= "";
  for this.pos < this.__len {
    var ch_1 string= this.peek();
    if  (((((ch_1 == "g") || (ch_1 == "i")) || (ch_1 == "m")) || (ch_1 == "s")) || (ch_1 == "u")) || (ch_1 == "y") {
      flags = flags + this.advance(); 
    } else {
      break;
    }
  }
  var fullValue string= (pattern + "/") + flags;
  return this.makeToken("RegexLiteral", fullValue, startPos, startLine, startCol)
}
func (this *Lexer) tokenize () []*Token {
  var tokens []*Token = make([]*Token, 0);
  for true {
    var tok *Token= this.nextToken();
    tokens = append(tokens,tok); 
    if  tok.tokenType == "EOF" {
      return tokens
    }
  }
  return tokens
}
type Position struct { 
  line int64 /**  unused  **/  `json:"line"` 
  column int64 /**  unused  **/  `json:"column"` 
}

func CreateNew_Position() *Position {
  me := new(Position)
  me.line = int64(1)
  me.column = int64(0)
  return me;
}
type SourceLocation struct { 
  start *GoNullable /**  unused  **/  `json:"start"` 
  end *GoNullable /**  unused  **/  `json:"end"` 
}

func CreateNew_SourceLocation() *SourceLocation {
  me := new(SourceLocation)
  me.start = new(GoNullable);
  me.end = new(GoNullable);
  return me;
}
type JSNode struct { 
  _type string `json:"type"` 
  loc *GoNullable /**  unused  **/  `json:"loc"` 
  start int64 `json:"start"` 
  end int64 `json:"end"` 
  line int64 `json:"line"` 
  col int64 `json:"col"` 
  name string `json:"name"` 
  raw string `json:"raw"` 
  regexPattern string `json:"regexPattern"` 
  regexFlags string `json:"regexFlags"` 
  operator string `json:"operator"` 
  prefix bool `json:"prefix"` 
  left *GoNullable `json:"left"` 
  right *GoNullable `json:"right"` 
  argument *GoNullable `json:"argument"` 
  test *GoNullable `json:"test"` 
  consequent *GoNullable /**  unused  **/  `json:"consequent"` 
  alternate *GoNullable `json:"alternate"` 
  id *GoNullable `json:"id"` 
  params []*JSNode /**  unused  **/  `json:"params"` 
  body *GoNullable `json:"body"` 
  generator bool `json:"generator"` 
  async bool `json:"async"` 
  expression bool /**  unused  **/  `json:"expression"` 
  declarations []*JSNode /**  unused  **/  `json:"declarations"` 
  kind string `json:"kind"` 
  init *GoNullable `json:"init"` 
  superClass *GoNullable `json:"superClass"` 
  object *GoNullable /**  unused  **/  `json:"object"` 
  property *GoNullable /**  unused  **/  `json:"property"` 
  computed bool `json:"computed"` 
  optional bool /**  unused  **/  `json:"optional"` 
  callee *GoNullable /**  unused  **/  `json:"callee"` 
  arguments []*JSNode /**  unused  **/  `json:"arguments"` 
  elements []*JSNode /**  unused  **/  `json:"elements"` 
  properties []*JSNode /**  unused  **/  `json:"properties"` 
  key *GoNullable `json:"key"` 
  method bool /**  unused  **/  `json:"method"` 
  shorthand bool `json:"shorthand"` 
  update *GoNullable /**  unused  **/  `json:"update"` 
  discriminant *GoNullable /**  unused  **/  `json:"discriminant"` 
  cases []*JSNode /**  unused  **/  `json:"cases"` 
  consequentStatements []*JSNode /**  unused  **/  `json:"consequentStatements"` 
  block *GoNullable /**  unused  **/  `json:"block"` 
  handler *GoNullable /**  unused  **/  `json:"handler"` 
  finalizer *GoNullable /**  unused  **/  `json:"finalizer"` 
  param *GoNullable /**  unused  **/  `json:"param"` 
  source *GoNullable /**  unused  **/  `json:"source"` 
  specifiers []*JSNode /**  unused  **/  `json:"specifiers"` 
  imported *GoNullable `json:"imported"` 
  local *GoNullable `json:"local"` 
  exported *GoNullable `json:"exported"` 
  declaration *GoNullable /**  unused  **/  `json:"declaration"` 
  quasis []*JSNode /**  unused  **/  `json:"quasis"` 
  expressions []*JSNode /**  unused  **/  `json:"expressions"` 
  tail bool /**  unused  **/  `json:"tail"` 
  cooked string /**  unused  **/  `json:"cooked"` 
  sourceType string /**  unused  **/  `json:"sourceType"` 
  static bool `json:"static"` 
  delegate bool `json:"delegate"` 
  children []*JSNode `json:"children"` 
  leadingComments []*JSNode `json:"leadingComments"` 
  trailingComments []*JSNode /**  unused  **/  `json:"trailingComments"` 
}

func CreateNew_JSNode() *JSNode {
  me := new(JSNode)
  me._type = ""
  me.start = int64(0)
  me.end = int64(0)
  me.line = int64(0)
  me.col = int64(0)
  me.name = ""
  me.raw = ""
  me.regexPattern = ""
  me.regexFlags = ""
  me.operator = ""
  me.prefix = false
  me.params = make([]*JSNode,0)
  me.generator = false
  me.async = false
  me.expression = false
  me.declarations = make([]*JSNode,0)
  me.kind = ""
  me.computed = false
  me.optional = false
  me.arguments = make([]*JSNode,0)
  me.elements = make([]*JSNode,0)
  me.properties = make([]*JSNode,0)
  me.method = false
  me.shorthand = false
  me.cases = make([]*JSNode,0)
  me.consequentStatements = make([]*JSNode,0)
  me.specifiers = make([]*JSNode,0)
  me.quasis = make([]*JSNode,0)
  me.expressions = make([]*JSNode,0)
  me.tail = false
  me.cooked = ""
  me.sourceType = ""
  me.static = false
  me.delegate = false
  me.children = make([]*JSNode,0)
  me.leadingComments = make([]*JSNode,0)
  me.trailingComments = make([]*JSNode,0)
  me.loc = new(GoNullable);
  me.left = new(GoNullable);
  me.right = new(GoNullable);
  me.argument = new(GoNullable);
  me.test = new(GoNullable);
  me.consequent = new(GoNullable);
  me.alternate = new(GoNullable);
  me.id = new(GoNullable);
  me.body = new(GoNullable);
  me.init = new(GoNullable);
  me.superClass = new(GoNullable);
  me.object = new(GoNullable);
  me.property = new(GoNullable);
  me.callee = new(GoNullable);
  me.key = new(GoNullable);
  me.update = new(GoNullable);
  me.discriminant = new(GoNullable);
  me.block = new(GoNullable);
  me.handler = new(GoNullable);
  me.finalizer = new(GoNullable);
  me.param = new(GoNullable);
  me.source = new(GoNullable);
  me.imported = new(GoNullable);
  me.local = new(GoNullable);
  me.exported = new(GoNullable);
  me.declaration = new(GoNullable);
  return me;
}
type SimpleParser struct { 
  tokens []*Token `json:"tokens"` 
  pos int64 `json:"pos"` 
  currentToken *GoNullable `json:"currentToken"` 
  errors []string `json:"errors"` 
  pendingComments []*JSNode `json:"pendingComments"` 
  source string `json:"source"` 
  lexer *GoNullable `json:"lexer"` 
}

func CreateNew_SimpleParser() *SimpleParser {
  me := new(SimpleParser)
  me.tokens = make([]*Token,0)
  me.pos = int64(0)
  me.errors = make([]string,0)
  me.pendingComments = make([]*JSNode,0)
  me.source = ""
  me.currentToken = new(GoNullable);
  me.lexer = new(GoNullable);
  return me;
}
func (this *SimpleParser) initParser (toks []*Token) () {
  this.tokens = toks; 
  this.pos = int64(0); 
  if  (int64(len(toks))) > int64(0) {
    this.currentToken.value = toks[int64(0)];
    this.currentToken.has_value = true; /* detected as non-optional */
  }
  this.skipComments();
}
func (this *SimpleParser) initParserWithSource (toks []*Token, src string) () {
  this.tokens = toks; 
  this.source = src; 
  this.lexer.value = CreateNew_Lexer(src);
  this.lexer.has_value = true; /* detected as non-optional */
  this.pos = int64(0); 
  if  (int64(len(toks))) > int64(0) {
    this.currentToken.value = toks[int64(0)];
    this.currentToken.has_value = true; /* detected as non-optional */
  }
  this.skipComments();
}
func (this *SimpleParser) isCommentToken () bool {
  var t string= this.peekType();
  if  t == "LineComment" {
    return true
  }
  if  t == "BlockComment" {
    return true
  }
  if  t == "JSDocComment" {
    return true
  }
  return false
}
func (this *SimpleParser) skipComments () () {
  for this.isCommentToken() {
    var tok *Token= this.peek();
    var commentNode *JSNode= CreateNew_JSNode();
    commentNode._type = tok.tokenType; 
    commentNode.raw = tok.value; 
    commentNode.line = tok.line; 
    commentNode.col = tok.col; 
    commentNode.start = tok.start; 
    commentNode.end = tok.end; 
    this.pendingComments = append(this.pendingComments,commentNode); 
    this.advanceRaw();
  }
}
func (this *SimpleParser) advanceRaw () () {
  this.pos = this.pos + int64(1); 
  if  this.pos < (int64(len(this.tokens))) {
    this.currentToken.value = this.tokens[this.pos];
    this.currentToken.has_value = true; /* detected as non-optional */
  } else {
    var eof *Token= CreateNew_Token();
    eof.tokenType = "EOF"; 
    eof.value = ""; 
    this.currentToken.value = eof;
    this.currentToken.has_value = true; /* detected as non-optional */
  }
}
func (this *SimpleParser) collectComments () []*JSNode {
  var comments []*JSNode = make([]*JSNode, 0);
  var i int64 = 0;  
  for ; i < int64(len(this.pendingComments)) ; i++ {
    c := this.pendingComments[i];
    comments = append(comments,c); 
  }
  var empty []*JSNode = make([]*JSNode, 0);
  this.pendingComments = empty; 
  return comments
}
func (this *SimpleParser) attachComments (node *JSNode) () {
  var comments []*JSNode= this.collectComments();
  var i int64 = 0;  
  for ; i < int64(len(comments)) ; i++ {
    c := comments[i];
    node.leadingComments = append(node.leadingComments,c); 
  }
}
func (this *SimpleParser) peek () *Token {
  return this.currentToken.value.(*Token)
}
func (this *SimpleParser) peekType () string {
  if  !this.currentToken.has_value  {
    return "EOF"
  }
  var tok *Token= this.currentToken.value.(*Token);
  return tok.tokenType
}
func (this *SimpleParser) peekValue () string {
  if  !this.currentToken.has_value  {
    return ""
  }
  var tok *Token= this.currentToken.value.(*Token);
  return tok.value
}
func (this *SimpleParser) advance () () {
  this.advanceRaw();
  this.skipComments();
}
func (this *SimpleParser) addError (msg string) () {
  this.errors = append(this.errors,msg); 
}
func (this *SimpleParser) expect (expectedType string) *Token {
  var tok *Token= this.peek();
  if  tok.tokenType != expectedType {
    var err string= ((((strings.Join([]string{ ((strings.Join([]string{ "Parse error at line ",strconv.FormatInt(tok.line, 10) }, "")) + ":"),strconv.FormatInt(tok.col, 10) }, "")) + ": expected ") + expectedType) + " but got ") + tok.tokenType;
    this.addError(err);
  }
  this.advance();
  return tok
}
func (this *SimpleParser) expectValue (expectedValue string) *Token {
  var tok *Token= this.peek();
  if  tok.value != expectedValue {
    var err string= (((((strings.Join([]string{ ((strings.Join([]string{ "Parse error at line ",strconv.FormatInt(tok.line, 10) }, "")) + ":"),strconv.FormatInt(tok.col, 10) }, "")) + ": expected '") + expectedValue) + "' but got '") + tok.value) + "'";
    this.addError(err);
  }
  this.advance();
  return tok
}
func (this *SimpleParser) isAtEnd () bool {
  var t string= this.peekType();
  return t == "EOF"
}
func (this *SimpleParser) matchType (tokenType string) bool {
  var t string= this.peekType();
  return t == tokenType
}
func (this *SimpleParser) matchValue (value string) bool {
  var v string= this.peekValue();
  return v == value
}
func (this *SimpleParser) hasErrors () bool {
  return (int64(len(this.errors))) > int64(0)
}
func (this *SimpleParser) parseRegexLiteral () *JSNode {
  var tok *Token= this.peek();
  var startPos int64= tok.start;
  var startLine int64= tok.line;
  var startCol int64= tok.col;
  if  !this.lexer.has_value  {
    var err *JSNode= CreateNew_JSNode();
    err._type = "Identifier"; 
    err.name = "regex_error"; 
    this.advance();
    return err
  }
  var lex *Lexer= this.lexer.value.(*Lexer);
  lex.pos = startPos; 
  lex.line = startLine; 
  lex.col = startCol; 
  var regexTok *Token= lex.readRegexLiteral();
  var fullValue string= regexTok.value;
  var pattern string= "";
  var flags string= "";
  var lastSlash int64= int64(-1);
  var i int64= int64(0);
  for i < (int64(len(fullValue))) {
    var ch string= fullValue[i: (i + 1)];
    if  ch == "/" {
      lastSlash = i; 
    }
    i = i + int64(1); 
  }
  if  lastSlash >= int64(0) {
    pattern = fullValue[int64(0):lastSlash]; 
    flags = fullValue[(lastSlash + int64(1)):(int64(len(fullValue)))]; 
  } else {
    pattern = fullValue; 
  }
  var regex *JSNode= CreateNew_JSNode();
  regex._type = "Literal"; 
  regex.raw = fullValue; 
  regex.regexPattern = pattern; 
  regex.regexFlags = flags; 
  regex.start = startPos; 
  regex.end = lex.pos; 
  regex.line = startLine; 
  regex.col = startCol; 
  this.advance();
  for this.isAtEnd() == false {
    var nextTok *Token= this.peek();
    if  nextTok.start < lex.pos {
      this.advance();
    } else {
      break;
    }
  }
  return regex
}
func (this *SimpleParser) parseProgram () *JSNode {
  var prog *JSNode= CreateNew_JSNode();
  prog._type = "Program"; 
  for this.isAtEnd() == false {
    var stmt *JSNode= this.parseStatement();
    prog.children = append(prog.children,stmt); 
  }
  return prog
}
func (this *SimpleParser) parseStatement () *JSNode {
  var comments []*JSNode= this.collectComments();
  var tokVal string= this.peekValue();
  var stmt *GoNullable = new(GoNullable); 
  if  tokVal == "var" {
    stmt.value = this.parseVarDecl();
    stmt.has_value = true; /* detected as non-optional */
  }
  if  (!stmt.has_value ) && (tokVal == "let") {
    stmt.value = this.parseLetDecl();
    stmt.has_value = true; /* detected as non-optional */
  }
  if  (!stmt.has_value ) && (tokVal == "const") {
    stmt.value = this.parseConstDecl();
    stmt.has_value = true; /* detected as non-optional */
  }
  if  (!stmt.has_value ) && (tokVal == "function") {
    stmt.value = this.parseFuncDecl();
    stmt.has_value = true; /* detected as non-optional */
  }
  if  (!stmt.has_value ) && (tokVal == "async") {
    stmt.value = this.parseAsyncFuncDecl();
    stmt.has_value = true; /* detected as non-optional */
  }
  if  (!stmt.has_value ) && (tokVal == "class") {
    stmt.value = this.parseClass();
    stmt.has_value = true; /* detected as non-optional */
  }
  if  (!stmt.has_value ) && (tokVal == "import") {
    stmt.value = this.parseImport();
    stmt.has_value = true; /* detected as non-optional */
  }
  if  (!stmt.has_value ) && (tokVal == "export") {
    stmt.value = this.parseExport();
    stmt.has_value = true; /* detected as non-optional */
  }
  if  (!stmt.has_value ) && (tokVal == "return") {
    stmt.value = this.parseReturn();
    stmt.has_value = true; /* detected as non-optional */
  }
  if  (!stmt.has_value ) && (tokVal == "if") {
    stmt.value = this.parseIf();
    stmt.has_value = true; /* detected as non-optional */
  }
  if  (!stmt.has_value ) && (tokVal == "while") {
    stmt.value = this.parseWhile();
    stmt.has_value = true; /* detected as non-optional */
  }
  if  (!stmt.has_value ) && (tokVal == "do") {
    stmt.value = this.parseDoWhile();
    stmt.has_value = true; /* detected as non-optional */
  }
  if  (!stmt.has_value ) && (tokVal == "for") {
    stmt.value = this.parseFor();
    stmt.has_value = true; /* detected as non-optional */
  }
  if  (!stmt.has_value ) && (tokVal == "switch") {
    stmt.value = this.parseSwitch();
    stmt.has_value = true; /* detected as non-optional */
  }
  if  (!stmt.has_value ) && (tokVal == "try") {
    stmt.value = this.parseTry();
    stmt.has_value = true; /* detected as non-optional */
  }
  if  (!stmt.has_value ) && (tokVal == "throw") {
    stmt.value = this.parseThrow();
    stmt.has_value = true; /* detected as non-optional */
  }
  if  (!stmt.has_value ) && (tokVal == "break") {
    stmt.value = this.parseBreak();
    stmt.has_value = true; /* detected as non-optional */
  }
  if  (!stmt.has_value ) && (tokVal == "continue") {
    stmt.value = this.parseContinue();
    stmt.has_value = true; /* detected as non-optional */
  }
  if  (!stmt.has_value ) && (tokVal == "{") {
    stmt.value = this.parseBlock();
    stmt.has_value = true; /* detected as non-optional */
  }
  if  (!stmt.has_value ) && (tokVal == ";") {
    this.advance();
    var empty *JSNode= CreateNew_JSNode();
    empty._type = "EmptyStatement"; 
    stmt.value = empty;
    stmt.has_value = true; /* detected as non-optional */
  }
  if  !stmt.has_value  {
    stmt.value = this.parseExprStmt();
    stmt.has_value = true; /* detected as non-optional */
  }
  var result *JSNode= stmt.value.(*JSNode);
  var i int64 = 0;  
  for ; i < int64(len(comments)) ; i++ {
    c := comments[i];
    result.leadingComments = append(result.leadingComments,c); 
  }
  return result
}
func (this *SimpleParser) parseVarDecl () *JSNode {
  var decl *JSNode= CreateNew_JSNode();
  decl._type = "VariableDeclaration"; 
  var startTok *Token= this.peek();
  decl.start = startTok.start; 
  decl.line = startTok.line; 
  decl.col = startTok.col; 
  this.expectValue("var");
  var first bool= true;
  for first || this.matchValue(",") {
    if  first == false {
      this.advance();
    }
    first = false; 
    var declarator *JSNode= CreateNew_JSNode();
    declarator._type = "VariableDeclarator"; 
    var idTok *Token= this.expect("Identifier");
    var id *JSNode= CreateNew_JSNode();
    id._type = "Identifier"; 
    id.name = idTok.value; 
    id.start = idTok.start; 
    id.line = idTok.line; 
    id.col = idTok.col; 
    declarator.id.value = id;
    declarator.id.has_value = true; /* detected as non-optional */
    declarator.start = idTok.start; 
    declarator.line = idTok.line; 
    declarator.col = idTok.col; 
    if  this.matchValue("=") {
      this.advance();
      var initExpr *JSNode= this.parseAssignment();
      declarator.init.value = initExpr;
      declarator.init.has_value = true; /* detected as non-optional */
    }
    decl.children = append(decl.children,declarator); 
  }
  if  this.matchValue(";") {
    this.advance();
  }
  return decl
}
func (this *SimpleParser) parseLetDecl () *JSNode {
  var decl *JSNode= CreateNew_JSNode();
  decl._type = "VariableDeclaration"; 
  decl.kind = "let"; 
  var startTok *Token= this.peek();
  decl.start = startTok.start; 
  decl.line = startTok.line; 
  decl.col = startTok.col; 
  this.expectValue("let");
  var first bool= true;
  for first || this.matchValue(",") {
    if  first == false {
      this.advance();
    }
    first = false; 
    var declarator *JSNode= CreateNew_JSNode();
    declarator._type = "VariableDeclarator"; 
    var declTok *Token= this.peek();
    declarator.start = declTok.start; 
    declarator.line = declTok.line; 
    declarator.col = declTok.col; 
    if  this.matchValue("[") {
      var pattern *JSNode= this.parseArrayPattern();
      declarator.id.value = pattern;
      declarator.id.has_value = true; /* detected as non-optional */
    } else {
      if  this.matchValue("{") {
        var pattern_1 *JSNode= this.parseObjectPattern();
        declarator.id.value = pattern_1;
        declarator.id.has_value = true; /* detected as non-optional */
      } else {
        var idTok *Token= this.expect("Identifier");
        var id *JSNode= CreateNew_JSNode();
        id._type = "Identifier"; 
        id.name = idTok.value; 
        id.start = idTok.start; 
        id.line = idTok.line; 
        id.col = idTok.col; 
        declarator.id.value = id;
        declarator.id.has_value = true; /* detected as non-optional */
      }
    }
    if  this.matchValue("=") {
      this.advance();
      var initExpr *JSNode= this.parseAssignment();
      declarator.init.value = initExpr;
      declarator.init.has_value = true; /* detected as non-optional */
    }
    decl.children = append(decl.children,declarator); 
  }
  if  this.matchValue(";") {
    this.advance();
  }
  return decl
}
func (this *SimpleParser) parseConstDecl () *JSNode {
  var decl *JSNode= CreateNew_JSNode();
  decl._type = "VariableDeclaration"; 
  decl.kind = "const"; 
  var startTok *Token= this.peek();
  decl.start = startTok.start; 
  decl.line = startTok.line; 
  decl.col = startTok.col; 
  this.expectValue("const");
  var first bool= true;
  for first || this.matchValue(",") {
    if  first == false {
      this.advance();
    }
    first = false; 
    var declarator *JSNode= CreateNew_JSNode();
    declarator._type = "VariableDeclarator"; 
    var declTok *Token= this.peek();
    declarator.start = declTok.start; 
    declarator.line = declTok.line; 
    declarator.col = declTok.col; 
    if  this.matchValue("[") {
      var pattern *JSNode= this.parseArrayPattern();
      declarator.id.value = pattern;
      declarator.id.has_value = true; /* detected as non-optional */
    } else {
      if  this.matchValue("{") {
        var pattern_1 *JSNode= this.parseObjectPattern();
        declarator.id.value = pattern_1;
        declarator.id.has_value = true; /* detected as non-optional */
      } else {
        var idTok *Token= this.expect("Identifier");
        var id *JSNode= CreateNew_JSNode();
        id._type = "Identifier"; 
        id.name = idTok.value; 
        id.start = idTok.start; 
        id.line = idTok.line; 
        id.col = idTok.col; 
        declarator.id.value = id;
        declarator.id.has_value = true; /* detected as non-optional */
      }
    }
    if  this.matchValue("=") {
      this.advance();
      var initExpr *JSNode= this.parseAssignment();
      declarator.init.value = initExpr;
      declarator.init.has_value = true; /* detected as non-optional */
    }
    decl.children = append(decl.children,declarator); 
  }
  if  this.matchValue(";") {
    this.advance();
  }
  return decl
}
func (this *SimpleParser) parseFuncDecl () *JSNode {
  var _func *JSNode= CreateNew_JSNode();
  _func._type = "FunctionDeclaration"; 
  var startTok *Token= this.peek();
  _func.start = startTok.start; 
  _func.line = startTok.line; 
  _func.col = startTok.col; 
  this.expectValue("function");
  if  this.matchValue("*") {
    _func.generator = true; 
    this.advance();
  }
  var idTok *Token= this.expect("Identifier");
  _func.name = idTok.value; 
  this.expectValue("(");
  for (this.matchValue(")") == false) && (this.isAtEnd() == false) {
    if  (int64(len(_func.children))) > int64(0) {
      this.expectValue(",");
    }
    if  this.matchValue(")") || this.isAtEnd() {
      break;
    }
    if  this.matchValue("...") {
      var restTok *Token= this.peek();
      this.advance();
      var paramTok *Token= this.expect("Identifier");
      var rest *JSNode= CreateNew_JSNode();
      rest._type = "RestElement"; 
      rest.name = paramTok.value; 
      rest.start = restTok.start; 
      rest.line = restTok.line; 
      rest.col = restTok.col; 
      var argNode *JSNode= CreateNew_JSNode();
      argNode._type = "Identifier"; 
      argNode.name = paramTok.value; 
      argNode.start = paramTok.start; 
      argNode.line = paramTok.line; 
      argNode.col = paramTok.col; 
      rest.argument.value = argNode;
      rest.argument.has_value = true; /* detected as non-optional */
      _func.children = append(_func.children,rest); 
    } else {
      if  this.matchValue("[") {
        var pattern *JSNode= this.parseArrayPattern();
        if  this.matchValue("=") {
          this.advance();
          var defaultVal *JSNode= this.parseAssignment();
          var assignPat *JSNode= CreateNew_JSNode();
          assignPat._type = "AssignmentPattern"; 
          assignPat.left.value = pattern;
          assignPat.left.has_value = true; /* detected as non-optional */
          assignPat.right.value = defaultVal;
          assignPat.right.has_value = true; /* detected as non-optional */
          assignPat.start = pattern.start; 
          assignPat.line = pattern.line; 
          assignPat.col = pattern.col; 
          _func.children = append(_func.children,assignPat); 
        } else {
          _func.children = append(_func.children,pattern); 
        }
      } else {
        if  this.matchValue("{") {
          var pattern_1 *JSNode= this.parseObjectPattern();
          if  this.matchValue("=") {
            this.advance();
            var defaultVal_1 *JSNode= this.parseAssignment();
            var assignPat_1 *JSNode= CreateNew_JSNode();
            assignPat_1._type = "AssignmentPattern"; 
            assignPat_1.left.value = pattern_1;
            assignPat_1.left.has_value = true; /* detected as non-optional */
            assignPat_1.right.value = defaultVal_1;
            assignPat_1.right.has_value = true; /* detected as non-optional */
            assignPat_1.start = pattern_1.start; 
            assignPat_1.line = pattern_1.line; 
            assignPat_1.col = pattern_1.col; 
            _func.children = append(_func.children,assignPat_1); 
          } else {
            _func.children = append(_func.children,pattern_1); 
          }
        } else {
          var paramTok_1 *Token= this.expect("Identifier");
          var param *JSNode= CreateNew_JSNode();
          param._type = "Identifier"; 
          param.name = paramTok_1.value; 
          param.start = paramTok_1.start; 
          param.line = paramTok_1.line; 
          param.col = paramTok_1.col; 
          if  this.matchValue("=") {
            this.advance();
            var defaultVal_2 *JSNode= this.parseAssignment();
            var assignPat_2 *JSNode= CreateNew_JSNode();
            assignPat_2._type = "AssignmentPattern"; 
            assignPat_2.left.value = param;
            assignPat_2.left.has_value = true; /* detected as non-optional */
            assignPat_2.right.value = defaultVal_2;
            assignPat_2.right.has_value = true; /* detected as non-optional */
            assignPat_2.start = param.start; 
            assignPat_2.line = param.line; 
            assignPat_2.col = param.col; 
            _func.children = append(_func.children,assignPat_2); 
          } else {
            _func.children = append(_func.children,param); 
          }
        }
      }
    }
  }
  this.expectValue(")");
  var body *JSNode= this.parseBlock();
  _func.body.value = body;
  _func.body.has_value = true; /* detected as non-optional */
  return _func
}
func (this *SimpleParser) parseFunctionExpression () *JSNode {
  var _func *JSNode= CreateNew_JSNode();
  _func._type = "FunctionExpression"; 
  var startTok *Token= this.peek();
  _func.start = startTok.start; 
  _func.line = startTok.line; 
  _func.col = startTok.col; 
  this.expectValue("function");
  if  this.matchValue("*") {
    _func.generator = true; 
    this.advance();
  }
  if  this.matchType("Identifier") {
    var idTok *Token= this.expect("Identifier");
    _func.name = idTok.value; 
  }
  this.expectValue("(");
  for (this.matchValue(")") == false) && (this.isAtEnd() == false) {
    if  (int64(len(_func.children))) > int64(0) {
      this.expectValue(",");
    }
    if  this.matchValue(")") || this.isAtEnd() {
      break;
    }
    if  this.matchValue("...") {
      var restTok *Token= this.peek();
      this.advance();
      var paramTok *Token= this.expect("Identifier");
      var rest *JSNode= CreateNew_JSNode();
      rest._type = "RestElement"; 
      rest.name = paramTok.value; 
      rest.start = restTok.start; 
      rest.line = restTok.line; 
      rest.col = restTok.col; 
      var argNode *JSNode= CreateNew_JSNode();
      argNode._type = "Identifier"; 
      argNode.name = paramTok.value; 
      argNode.start = paramTok.start; 
      argNode.line = paramTok.line; 
      argNode.col = paramTok.col; 
      rest.argument.value = argNode;
      rest.argument.has_value = true; /* detected as non-optional */
      _func.children = append(_func.children,rest); 
    } else {
      if  this.matchValue("[") {
        var pattern *JSNode= this.parseArrayPattern();
        if  this.matchValue("=") {
          this.advance();
          var defaultVal *JSNode= this.parseAssignment();
          var assignPat *JSNode= CreateNew_JSNode();
          assignPat._type = "AssignmentPattern"; 
          assignPat.left.value = pattern;
          assignPat.left.has_value = true; /* detected as non-optional */
          assignPat.right.value = defaultVal;
          assignPat.right.has_value = true; /* detected as non-optional */
          assignPat.start = pattern.start; 
          assignPat.line = pattern.line; 
          assignPat.col = pattern.col; 
          _func.children = append(_func.children,assignPat); 
        } else {
          _func.children = append(_func.children,pattern); 
        }
      } else {
        if  this.matchValue("{") {
          var pattern_1 *JSNode= this.parseObjectPattern();
          if  this.matchValue("=") {
            this.advance();
            var defaultVal_1 *JSNode= this.parseAssignment();
            var assignPat_1 *JSNode= CreateNew_JSNode();
            assignPat_1._type = "AssignmentPattern"; 
            assignPat_1.left.value = pattern_1;
            assignPat_1.left.has_value = true; /* detected as non-optional */
            assignPat_1.right.value = defaultVal_1;
            assignPat_1.right.has_value = true; /* detected as non-optional */
            assignPat_1.start = pattern_1.start; 
            assignPat_1.line = pattern_1.line; 
            assignPat_1.col = pattern_1.col; 
            _func.children = append(_func.children,assignPat_1); 
          } else {
            _func.children = append(_func.children,pattern_1); 
          }
        } else {
          var paramTok_1 *Token= this.expect("Identifier");
          var param *JSNode= CreateNew_JSNode();
          param._type = "Identifier"; 
          param.name = paramTok_1.value; 
          param.start = paramTok_1.start; 
          param.line = paramTok_1.line; 
          param.col = paramTok_1.col; 
          if  this.matchValue("=") {
            this.advance();
            var defaultVal_2 *JSNode= this.parseAssignment();
            var assignPat_2 *JSNode= CreateNew_JSNode();
            assignPat_2._type = "AssignmentPattern"; 
            assignPat_2.left.value = param;
            assignPat_2.left.has_value = true; /* detected as non-optional */
            assignPat_2.right.value = defaultVal_2;
            assignPat_2.right.has_value = true; /* detected as non-optional */
            assignPat_2.start = param.start; 
            assignPat_2.line = param.line; 
            assignPat_2.col = param.col; 
            _func.children = append(_func.children,assignPat_2); 
          } else {
            _func.children = append(_func.children,param); 
          }
        }
      }
    }
  }
  this.expectValue(")");
  var body *JSNode= this.parseBlock();
  _func.body.value = body;
  _func.body.has_value = true; /* detected as non-optional */
  return _func
}
func (this *SimpleParser) parseAsyncFuncDecl () *JSNode {
  var _func *JSNode= CreateNew_JSNode();
  _func._type = "FunctionDeclaration"; 
  var startTok *Token= this.peek();
  _func.start = startTok.start; 
  _func.line = startTok.line; 
  _func.col = startTok.col; 
  _func.async = true; 
  this.expectValue("async");
  this.expectValue("function");
  if  this.matchValue("*") {
    _func.async = true; 
    _func.generator = true; 
    this.advance();
  }
  var idTok *Token= this.expect("Identifier");
  _func.name = idTok.value; 
  this.expectValue("(");
  for (this.matchValue(")") == false) && (this.isAtEnd() == false) {
    if  (int64(len(_func.children))) > int64(0) {
      this.expectValue(",");
    }
    if  this.matchValue(")") || this.isAtEnd() {
      break;
    }
    var paramTok *Token= this.expect("Identifier");
    var param *JSNode= CreateNew_JSNode();
    param._type = "Identifier"; 
    param.name = paramTok.value; 
    param.start = paramTok.start; 
    param.line = paramTok.line; 
    param.col = paramTok.col; 
    _func.children = append(_func.children,param); 
  }
  this.expectValue(")");
  var body *JSNode= this.parseBlock();
  _func.body.value = body;
  _func.body.has_value = true; /* detected as non-optional */
  return _func
}
func (this *SimpleParser) parseClass () *JSNode {
  var classNode *JSNode= CreateNew_JSNode();
  classNode._type = "ClassDeclaration"; 
  var startTok *Token= this.peek();
  classNode.start = startTok.start; 
  classNode.line = startTok.line; 
  classNode.col = startTok.col; 
  this.expectValue("class");
  var idTok *Token= this.expect("Identifier");
  classNode.name = idTok.value; 
  if  this.matchValue("extends") {
    this.advance();
    var superTok *Token= this.expect("Identifier");
    var superClassNode *JSNode= CreateNew_JSNode();
    superClassNode._type = "Identifier"; 
    superClassNode.name = superTok.value; 
    superClassNode.start = superTok.start; 
    superClassNode.line = superTok.line; 
    superClassNode.col = superTok.col; 
    classNode.superClass.value = superClassNode;
    classNode.superClass.has_value = true; /* detected as non-optional */
  }
  var body *JSNode= CreateNew_JSNode();
  body._type = "ClassBody"; 
  var bodyStart *Token= this.peek();
  body.start = bodyStart.start; 
  body.line = bodyStart.line; 
  body.col = bodyStart.col; 
  this.expectValue("{");
  for (this.matchValue("}") == false) && (this.isAtEnd() == false) {
    var method *JSNode= this.parseClassMethod();
    body.children = append(body.children,method); 
  }
  this.expectValue("}");
  classNode.body.value = body;
  classNode.body.has_value = true; /* detected as non-optional */
  return classNode
}
func (this *SimpleParser) parseClassMethod () *JSNode {
  var method *JSNode= CreateNew_JSNode();
  method._type = "MethodDefinition"; 
  var startTok *Token= this.peek();
  method.start = startTok.start; 
  method.line = startTok.line; 
  method.col = startTok.col; 
  var isStatic bool= false;
  if  this.matchValue("static") {
    isStatic = true; 
    method.static = true; 
    this.advance();
  }
  var methodKind string= "method";
  if  this.matchValue("get") {
    var nextTok string= this.peekAt(int64(1));
    if  nextTok != "(" {
      methodKind = "get"; 
      this.advance();
    }
  }
  if  this.matchValue("set") {
    var nextTok_1 string= this.peekAt(int64(1));
    if  nextTok_1 != "(" {
      methodKind = "set"; 
      this.advance();
    }
  }
  var nameTok *Token= this.expect("Identifier");
  var keyNode *JSNode= CreateNew_JSNode();
  keyNode._type = "Identifier"; 
  keyNode.name = nameTok.value; 
  keyNode.start = nameTok.start; 
  keyNode.line = nameTok.line; 
  keyNode.col = nameTok.col; 
  method.key.value = keyNode;
  method.key.has_value = true; /* detected as non-optional */
  if  nameTok.value == "constructor" {
    methodKind = "constructor"; 
  }
  method.kind = methodKind; 
  var _func *JSNode= CreateNew_JSNode();
  _func._type = "FunctionExpression"; 
  _func.start = nameTok.start; 
  _func.line = nameTok.line; 
  _func.col = nameTok.col; 
  this.expectValue("(");
  for (this.matchValue(")") == false) && (this.isAtEnd() == false) {
    if  (int64(len(_func.children))) > int64(0) {
      this.expectValue(",");
    }
    if  this.matchValue(")") || this.isAtEnd() {
      break;
    }
    var paramTok *Token= this.expect("Identifier");
    var param *JSNode= CreateNew_JSNode();
    param._type = "Identifier"; 
    param.name = paramTok.value; 
    param.start = paramTok.start; 
    param.line = paramTok.line; 
    param.col = paramTok.col; 
    _func.children = append(_func.children,param); 
  }
  this.expectValue(")");
  var funcBody *JSNode= this.parseBlock();
  _func.body.value = funcBody;
  _func.body.has_value = true; /* detected as non-optional */
  method.body.value = _func;
  method.body.has_value = true; /* detected as non-optional */
  return method
}
func (this *SimpleParser) peekAt (offset int64) string {
  var targetPos int64= this.pos + offset;
  if  targetPos >= (int64(len(this.tokens))) {
    return ""
  }
  var tok *Token= this.tokens[targetPos];
  return tok.value
}
func (this *SimpleParser) parseImport () *JSNode {
  var importNode *JSNode= CreateNew_JSNode();
  importNode._type = "ImportDeclaration"; 
  var startTok *Token= this.peek();
  importNode.start = startTok.start; 
  importNode.line = startTok.line; 
  importNode.col = startTok.col; 
  this.expectValue("import");
  if  this.matchType("String") {
    var sourceTok *Token= this.peek();
    this.advance();
    var source_1 *JSNode= CreateNew_JSNode();
    source_1._type = "Literal"; 
    source_1.raw = sourceTok.value; 
    source_1.start = sourceTok.start; 
    source_1.line = sourceTok.line; 
    source_1.col = sourceTok.col; 
    importNode.right.value = source_1;
    importNode.right.has_value = true; /* detected as non-optional */
    if  this.matchValue(";") {
      this.advance();
    }
    return importNode
  }
  if  this.matchValue("*") {
    this.advance();
    this.expectValue("as");
    var localTok *Token= this.expect("Identifier");
    var specifier *JSNode= CreateNew_JSNode();
    specifier._type = "ImportNamespaceSpecifier"; 
    specifier.name = localTok.value; 
    specifier.start = localTok.start; 
    specifier.line = localTok.line; 
    specifier.col = localTok.col; 
    importNode.children = append(importNode.children,specifier); 
    this.expectValue("from");
    var sourceTok_1 *Token= this.expect("String");
    var source_2 *JSNode= CreateNew_JSNode();
    source_2._type = "Literal"; 
    source_2.raw = sourceTok_1.value; 
    source_2.start = sourceTok_1.start; 
    source_2.line = sourceTok_1.line; 
    source_2.col = sourceTok_1.col; 
    importNode.right.value = source_2;
    importNode.right.has_value = true; /* detected as non-optional */
    if  this.matchValue(";") {
      this.advance();
    }
    return importNode
  }
  if  this.matchType("Identifier") {
    var defaultTok *Token= this.expect("Identifier");
    var defaultSpec *JSNode= CreateNew_JSNode();
    defaultSpec._type = "ImportDefaultSpecifier"; 
    var localNode *JSNode= CreateNew_JSNode();
    localNode._type = "Identifier"; 
    localNode.name = defaultTok.value; 
    localNode.start = defaultTok.start; 
    localNode.line = defaultTok.line; 
    localNode.col = defaultTok.col; 
    defaultSpec.local.value = localNode;
    defaultSpec.local.has_value = true; /* detected as non-optional */
    defaultSpec.start = defaultTok.start; 
    defaultSpec.line = defaultTok.line; 
    defaultSpec.col = defaultTok.col; 
    importNode.children = append(importNode.children,defaultSpec); 
    if  this.matchValue(",") {
      this.advance();
      if  this.matchValue("*") {
        this.advance();
        this.expectValue("as");
        var localTok2 *Token= this.expect("Identifier");
        var nsSpec *JSNode= CreateNew_JSNode();
        nsSpec._type = "ImportNamespaceSpecifier"; 
        var nsLocal *JSNode= CreateNew_JSNode();
        nsLocal._type = "Identifier"; 
        nsLocal.name = localTok2.value; 
        nsLocal.start = localTok2.start; 
        nsLocal.line = localTok2.line; 
        nsLocal.col = localTok2.col; 
        nsSpec.local.value = nsLocal;
        nsSpec.local.has_value = true; /* detected as non-optional */
        nsSpec.start = localTok2.start; 
        nsSpec.line = localTok2.line; 
        nsSpec.col = localTok2.col; 
        importNode.children = append(importNode.children,nsSpec); 
      } else {
        this.parseImportSpecifiers(importNode);
      }
    }
    this.expectValue("from");
  } else {
    if  this.matchValue("{") {
      this.parseImportSpecifiers(importNode);
      this.expectValue("from");
    }
  }
  var sourceTok_2 *Token= this.expect("String");
  var source_3 *JSNode= CreateNew_JSNode();
  source_3._type = "Literal"; 
  source_3.raw = sourceTok_2.value; 
  source_3.start = sourceTok_2.start; 
  source_3.line = sourceTok_2.line; 
  source_3.col = sourceTok_2.col; 
  importNode.right.value = source_3;
  importNode.right.has_value = true; /* detected as non-optional */
  if  this.matchValue(";") {
    this.advance();
  }
  return importNode
}
func (this *SimpleParser) parseImportSpecifiers (importNode *JSNode) () {
  this.expectValue("{");
  for (this.matchValue("}") == false) && (this.isAtEnd() == false) {
    if  (int64(len(importNode.children))) > int64(0) {
      if  this.matchValue(",") {
        this.advance();
      }
    }
    if  this.matchValue("}") || this.isAtEnd() {
      break;
    }
    var specifier *JSNode= CreateNew_JSNode();
    specifier._type = "ImportSpecifier"; 
    var importedTok *Token= this.expect("Identifier");
    var importedNode *JSNode= CreateNew_JSNode();
    importedNode._type = "Identifier"; 
    importedNode.name = importedTok.value; 
    importedNode.start = importedTok.start; 
    importedNode.line = importedTok.line; 
    importedNode.col = importedTok.col; 
    specifier.imported.value = importedNode;
    specifier.imported.has_value = true; /* detected as non-optional */
    specifier.start = importedTok.start; 
    specifier.line = importedTok.line; 
    specifier.col = importedTok.col; 
    if  this.matchValue("as") {
      this.advance();
      var localTok *Token= this.expect("Identifier");
      var localNode *JSNode= CreateNew_JSNode();
      localNode._type = "Identifier"; 
      localNode.name = localTok.value; 
      localNode.start = localTok.start; 
      localNode.line = localTok.line; 
      localNode.col = localTok.col; 
      specifier.local.value = localNode;
      specifier.local.has_value = true; /* detected as non-optional */
    } else {
      specifier.local.value = importedNode;
      specifier.local.has_value = true; /* detected as non-optional */
    }
    importNode.children = append(importNode.children,specifier); 
  }
  this.expectValue("}");
}
func (this *SimpleParser) parseExport () *JSNode {
  var exportNode *JSNode= CreateNew_JSNode();
  exportNode._type = "ExportNamedDeclaration"; 
  var startTok *Token= this.peek();
  exportNode.start = startTok.start; 
  exportNode.line = startTok.line; 
  exportNode.col = startTok.col; 
  this.expectValue("export");
  if  this.matchValue("default") {
    exportNode._type = "ExportDefaultDeclaration"; 
    this.advance();
    if  this.matchValue("function") {
      var _func *JSNode= this.parseFuncDecl();
      exportNode.left.value = _func;
      exportNode.left.has_value = true; /* detected as non-optional */
    } else {
      if  this.matchValue("async") {
        var func_1 *JSNode= this.parseAsyncFuncDecl();
        exportNode.left.value = func_1;
        exportNode.left.has_value = true; /* detected as non-optional */
      } else {
        if  this.matchValue("class") {
          var cls *JSNode= this.parseClass();
          exportNode.left.value = cls;
          exportNode.left.has_value = true; /* detected as non-optional */
        } else {
          var expr *JSNode= this.parseAssignment();
          exportNode.left.value = expr;
          exportNode.left.has_value = true; /* detected as non-optional */
          if  this.matchValue(";") {
            this.advance();
          }
        }
      }
    }
    return exportNode
  }
  if  this.matchValue("*") {
    exportNode._type = "ExportAllDeclaration"; 
    this.advance();
    if  this.matchValue("as") {
      this.advance();
      var exportedTok *Token= this.expect("Identifier");
      exportNode.name = exportedTok.value; 
    }
    this.expectValue("from");
    var sourceTok *Token= this.expect("String");
    var source_1 *JSNode= CreateNew_JSNode();
    source_1._type = "Literal"; 
    source_1.raw = sourceTok.value; 
    source_1.start = sourceTok.start; 
    source_1.line = sourceTok.line; 
    source_1.col = sourceTok.col; 
    exportNode.right.value = source_1;
    exportNode.right.has_value = true; /* detected as non-optional */
    if  this.matchValue(";") {
      this.advance();
    }
    return exportNode
  }
  if  this.matchValue("{") {
    this.parseExportSpecifiers(exportNode);
    if  this.matchValue("from") {
      this.advance();
      var sourceTok_1 *Token= this.expect("String");
      var source_2 *JSNode= CreateNew_JSNode();
      source_2._type = "Literal"; 
      source_2.raw = sourceTok_1.value; 
      source_2.start = sourceTok_1.start; 
      source_2.line = sourceTok_1.line; 
      source_2.col = sourceTok_1.col; 
      exportNode.right.value = source_2;
      exportNode.right.has_value = true; /* detected as non-optional */
    }
    if  this.matchValue(";") {
      this.advance();
    }
    return exportNode
  }
  if  this.matchValue("const") {
    var decl *JSNode= this.parseConstDecl();
    exportNode.left.value = decl;
    exportNode.left.has_value = true; /* detected as non-optional */
    return exportNode
  }
  if  this.matchValue("let") {
    var decl_1 *JSNode= this.parseLetDecl();
    exportNode.left.value = decl_1;
    exportNode.left.has_value = true; /* detected as non-optional */
    return exportNode
  }
  if  this.matchValue("var") {
    var decl_2 *JSNode= this.parseVarDecl();
    exportNode.left.value = decl_2;
    exportNode.left.has_value = true; /* detected as non-optional */
    return exportNode
  }
  if  this.matchValue("function") {
    var func_2 *JSNode= this.parseFuncDecl();
    exportNode.left.value = func_2;
    exportNode.left.has_value = true; /* detected as non-optional */
    return exportNode
  }
  if  this.matchValue("async") {
    var func_3 *JSNode= this.parseAsyncFuncDecl();
    exportNode.left.value = func_3;
    exportNode.left.has_value = true; /* detected as non-optional */
    return exportNode
  }
  if  this.matchValue("class") {
    var cls_1 *JSNode= this.parseClass();
    exportNode.left.value = cls_1;
    exportNode.left.has_value = true; /* detected as non-optional */
    return exportNode
  }
  var expr_1 *JSNode= this.parseExprStmt();
  exportNode.left.value = expr_1;
  exportNode.left.has_value = true; /* detected as non-optional */
  return exportNode
}
func (this *SimpleParser) parseExportSpecifiers (exportNode *JSNode) () {
  this.expectValue("{");
  for (this.matchValue("}") == false) && (this.isAtEnd() == false) {
    var numChildren int64= int64(len(exportNode.children));
    if  numChildren > int64(0) {
      if  this.matchValue(",") {
        this.advance();
      }
    }
    if  this.matchValue("}") || this.isAtEnd() {
      break;
    }
    var specifier *JSNode= CreateNew_JSNode();
    specifier._type = "ExportSpecifier"; 
    var localTok *Token= this.peek();
    if  this.matchType("Identifier") || this.matchValue("default") {
      this.advance();
      var localNode *JSNode= CreateNew_JSNode();
      localNode._type = "Identifier"; 
      localNode.name = localTok.value; 
      localNode.start = localTok.start; 
      localNode.line = localTok.line; 
      localNode.col = localTok.col; 
      specifier.local.value = localNode;
      specifier.local.has_value = true; /* detected as non-optional */
      specifier.start = localTok.start; 
      specifier.line = localTok.line; 
      specifier.col = localTok.col; 
    } else {
      var err string= ((strings.Join([]string{ ((strings.Join([]string{ "Parse error at line ",strconv.FormatInt(localTok.line, 10) }, "")) + ":"),strconv.FormatInt(localTok.col, 10) }, "")) + ": expected Identifier but got ") + localTok.tokenType;
      this.addError(err);
      this.advance();
    }
    if  this.matchValue("as") {
      this.advance();
      var exportedTok *Token= this.expect("Identifier");
      var exportedNode *JSNode= CreateNew_JSNode();
      exportedNode._type = "Identifier"; 
      exportedNode.name = exportedTok.value; 
      exportedNode.start = exportedTok.start; 
      exportedNode.line = exportedTok.line; 
      exportedNode.col = exportedTok.col; 
      specifier.exported.value = exportedNode;
      specifier.exported.has_value = true; /* detected as non-optional */
    } else {
      specifier.exported.value = specifier.local.value;
      specifier.exported.has_value = false; 
      if specifier.exported.value != nil {
        specifier.exported.has_value = true
      }
    }
    exportNode.children = append(exportNode.children,specifier); 
  }
  this.expectValue("}");
}
func (this *SimpleParser) parseBlock () *JSNode {
  var block *JSNode= CreateNew_JSNode();
  block._type = "BlockStatement"; 
  var startTok *Token= this.peek();
  block.start = startTok.start; 
  block.line = startTok.line; 
  block.col = startTok.col; 
  this.expectValue("{");
  for (this.matchValue("}") == false) && (this.isAtEnd() == false) {
    var stmt *JSNode= this.parseStatement();
    block.children = append(block.children,stmt); 
  }
  this.expectValue("}");
  return block
}
func (this *SimpleParser) parseReturn () *JSNode {
  var ret *JSNode= CreateNew_JSNode();
  ret._type = "ReturnStatement"; 
  var startTok *Token= this.peek();
  ret.start = startTok.start; 
  ret.line = startTok.line; 
  ret.col = startTok.col; 
  this.expectValue("return");
  if  (this.matchValue(";") == false) && (this.isAtEnd() == false) {
    var arg *JSNode= this.parseExpr();
    ret.left.value = arg;
    ret.left.has_value = true; /* detected as non-optional */
  }
  if  this.matchValue(";") {
    this.advance();
  }
  return ret
}
func (this *SimpleParser) parseIf () *JSNode {
  var ifStmt *JSNode= CreateNew_JSNode();
  ifStmt._type = "IfStatement"; 
  var startTok *Token= this.peek();
  ifStmt.start = startTok.start; 
  ifStmt.line = startTok.line; 
  ifStmt.col = startTok.col; 
  this.expectValue("if");
  this.expectValue("(");
  var test *JSNode= this.parseExpr();
  ifStmt.test.value = test;
  ifStmt.test.has_value = true; /* detected as non-optional */
  this.expectValue(")");
  var consequent *JSNode= this.parseStatement();
  ifStmt.body.value = consequent;
  ifStmt.body.has_value = true; /* detected as non-optional */
  if  this.matchValue("else") {
    this.advance();
    var alt *JSNode= this.parseStatement();
    ifStmt.alternate.value = alt;
    ifStmt.alternate.has_value = true; /* detected as non-optional */
  }
  return ifStmt
}
func (this *SimpleParser) parseWhile () *JSNode {
  var whileStmt *JSNode= CreateNew_JSNode();
  whileStmt._type = "WhileStatement"; 
  var startTok *Token= this.peek();
  whileStmt.start = startTok.start; 
  whileStmt.line = startTok.line; 
  whileStmt.col = startTok.col; 
  this.expectValue("while");
  this.expectValue("(");
  var test *JSNode= this.parseExpr();
  whileStmt.test.value = test;
  whileStmt.test.has_value = true; /* detected as non-optional */
  this.expectValue(")");
  var body *JSNode= this.parseStatement();
  whileStmt.body.value = body;
  whileStmt.body.has_value = true; /* detected as non-optional */
  return whileStmt
}
func (this *SimpleParser) parseDoWhile () *JSNode {
  var doWhileStmt *JSNode= CreateNew_JSNode();
  doWhileStmt._type = "DoWhileStatement"; 
  var startTok *Token= this.peek();
  doWhileStmt.start = startTok.start; 
  doWhileStmt.line = startTok.line; 
  doWhileStmt.col = startTok.col; 
  this.expectValue("do");
  var body *JSNode= this.parseStatement();
  doWhileStmt.body.value = body;
  doWhileStmt.body.has_value = true; /* detected as non-optional */
  this.expectValue("while");
  this.expectValue("(");
  var test *JSNode= this.parseExpr();
  doWhileStmt.test.value = test;
  doWhileStmt.test.has_value = true; /* detected as non-optional */
  this.expectValue(")");
  if  this.matchValue(";") {
    this.advance();
  }
  return doWhileStmt
}
func (this *SimpleParser) parseFor () *JSNode {
  var forStmt *JSNode= CreateNew_JSNode();
  var startTok *Token= this.peek();
  forStmt.start = startTok.start; 
  forStmt.line = startTok.line; 
  forStmt.col = startTok.col; 
  this.expectValue("for");
  this.expectValue("(");
  var isForOf bool= false;
  var isForIn bool= false;
  var leftNode *GoNullable = new(GoNullable); 
  if  this.matchValue(";") == false {
    if  (this.matchValue("var") || this.matchValue("let")) || this.matchValue("const") {
      var keyword string= this.peekValue();
      this.advance();
      var declarator *JSNode= CreateNew_JSNode();
      declarator._type = "VariableDeclarator"; 
      var declTok *Token= this.peek();
      declarator.start = declTok.start; 
      declarator.line = declTok.line; 
      declarator.col = declTok.col; 
      if  this.matchValue("[") {
        var pattern *JSNode= this.parseArrayPattern();
        declarator.id.value = pattern;
        declarator.id.has_value = true; /* detected as non-optional */
      } else {
        if  this.matchValue("{") {
          var pattern_1 *JSNode= this.parseObjectPattern();
          declarator.id.value = pattern_1;
          declarator.id.has_value = true; /* detected as non-optional */
        } else {
          var idTok *Token= this.expect("Identifier");
          var id *JSNode= CreateNew_JSNode();
          id._type = "Identifier"; 
          id.name = idTok.value; 
          id.start = idTok.start; 
          id.line = idTok.line; 
          id.col = idTok.col; 
          declarator.id.value = id;
          declarator.id.has_value = true; /* detected as non-optional */
        }
      }
      if  this.matchValue("of") {
        isForOf = true; 
        this.advance();
        var varDecl *JSNode= CreateNew_JSNode();
        varDecl._type = "VariableDeclaration"; 
        varDecl.kind = keyword; 
        varDecl.start = declTok.start; 
        varDecl.line = declTok.line; 
        varDecl.col = declTok.col; 
        varDecl.children = append(varDecl.children,declarator); 
        leftNode.value = varDecl;
        leftNode.has_value = true; /* detected as non-optional */
      } else {
        if  this.matchValue("in") {
          isForIn = true; 
          this.advance();
          var varDecl_1 *JSNode= CreateNew_JSNode();
          varDecl_1._type = "VariableDeclaration"; 
          varDecl_1.kind = keyword; 
          varDecl_1.start = declTok.start; 
          varDecl_1.line = declTok.line; 
          varDecl_1.col = declTok.col; 
          varDecl_1.children = append(varDecl_1.children,declarator); 
          leftNode.value = varDecl_1;
          leftNode.has_value = true; /* detected as non-optional */
        } else {
          if  this.matchValue("=") {
            this.advance();
            var initVal *JSNode= this.parseAssignment();
            declarator.init.value = initVal;
            declarator.init.has_value = true; /* detected as non-optional */
          }
          var varDecl_2 *JSNode= CreateNew_JSNode();
          varDecl_2._type = "VariableDeclaration"; 
          varDecl_2.kind = keyword; 
          varDecl_2.start = declTok.start; 
          varDecl_2.line = declTok.line; 
          varDecl_2.col = declTok.col; 
          varDecl_2.children = append(varDecl_2.children,declarator); 
          leftNode.value = varDecl_2;
          leftNode.has_value = true; /* detected as non-optional */
          if  this.matchValue(";") {
            this.advance();
          }
        }
      }
    } else {
      var initExpr *JSNode= this.parseExpr();
      if  this.matchValue("of") {
        isForOf = true; 
        this.advance();
        leftNode.value = initExpr;
        leftNode.has_value = true; /* detected as non-optional */
      } else {
        if  this.matchValue("in") {
          isForIn = true; 
          this.advance();
          leftNode.value = initExpr;
          leftNode.has_value = true; /* detected as non-optional */
        } else {
          leftNode.value = initExpr;
          leftNode.has_value = true; /* detected as non-optional */
          if  this.matchValue(";") {
            this.advance();
          }
        }
      }
    }
  } else {
    this.advance();
  }
  if  isForOf {
    forStmt._type = "ForOfStatement"; 
    forStmt.left.value = leftNode.value.(*JSNode);
    forStmt.left.has_value = true; /* detected as non-optional */
    var rightExpr *JSNode= this.parseExpr();
    forStmt.right.value = rightExpr;
    forStmt.right.has_value = true; /* detected as non-optional */
    this.expectValue(")");
    var body *JSNode= this.parseStatement();
    forStmt.body.value = body;
    forStmt.body.has_value = true; /* detected as non-optional */
    return forStmt
  }
  if  isForIn {
    forStmt._type = "ForInStatement"; 
    forStmt.left.value = leftNode.value.(*JSNode);
    forStmt.left.has_value = true; /* detected as non-optional */
    var rightExpr_1 *JSNode= this.parseExpr();
    forStmt.right.value = rightExpr_1;
    forStmt.right.has_value = true; /* detected as non-optional */
    this.expectValue(")");
    var body_1 *JSNode= this.parseStatement();
    forStmt.body.value = body_1;
    forStmt.body.has_value = true; /* detected as non-optional */
    return forStmt
  }
  forStmt._type = "ForStatement"; 
  if  leftNode.has_value {
    forStmt.left.value = leftNode.value.(*JSNode);
    forStmt.left.has_value = true; /* detected as non-optional */
  }
  if  this.matchValue(";") == false {
    var test *JSNode= this.parseExpr();
    forStmt.test.value = test;
    forStmt.test.has_value = true; /* detected as non-optional */
  }
  if  this.matchValue(";") {
    this.advance();
  }
  if  this.matchValue(")") == false {
    var update *JSNode= this.parseExpr();
    forStmt.right.value = update;
    forStmt.right.has_value = true; /* detected as non-optional */
  }
  this.expectValue(")");
  var body_2 *JSNode= this.parseStatement();
  forStmt.body.value = body_2;
  forStmt.body.has_value = true; /* detected as non-optional */
  return forStmt
}
func (this *SimpleParser) parseSwitch () *JSNode {
  var switchStmt *JSNode= CreateNew_JSNode();
  switchStmt._type = "SwitchStatement"; 
  var startTok *Token= this.peek();
  switchStmt.start = startTok.start; 
  switchStmt.line = startTok.line; 
  switchStmt.col = startTok.col; 
  this.expectValue("switch");
  this.expectValue("(");
  var discriminant *JSNode= this.parseExpr();
  switchStmt.test.value = discriminant;
  switchStmt.test.has_value = true; /* detected as non-optional */
  this.expectValue(")");
  this.expectValue("{");
  for (this.matchValue("}") == false) && (this.isAtEnd() == false) {
    var caseNode *JSNode= CreateNew_JSNode();
    if  this.matchValue("case") {
      caseNode._type = "SwitchCase"; 
      var caseTok *Token= this.peek();
      caseNode.start = caseTok.start; 
      caseNode.line = caseTok.line; 
      caseNode.col = caseTok.col; 
      this.advance();
      var testExpr *JSNode= this.parseExpr();
      caseNode.test.value = testExpr;
      caseNode.test.has_value = true; /* detected as non-optional */
      this.expectValue(":");
      for (((this.matchValue("case") == false) && (this.matchValue("default") == false)) && (this.matchValue("}") == false)) && (this.isAtEnd() == false) {
        var stmt *JSNode= this.parseStatement();
        caseNode.children = append(caseNode.children,stmt); 
      }
      switchStmt.children = append(switchStmt.children,caseNode); 
    } else {
      if  this.matchValue("default") {
        caseNode._type = "SwitchCase"; 
        caseNode.name = "default"; 
        var defTok *Token= this.peek();
        caseNode.start = defTok.start; 
        caseNode.line = defTok.line; 
        caseNode.col = defTok.col; 
        this.advance();
        this.expectValue(":");
        for ((this.matchValue("case") == false) && (this.matchValue("}") == false)) && (this.isAtEnd() == false) {
          var stmt_1 *JSNode= this.parseStatement();
          caseNode.children = append(caseNode.children,stmt_1); 
        }
        switchStmt.children = append(switchStmt.children,caseNode); 
      } else {
        this.advance();
      }
    }
  }
  this.expectValue("}");
  return switchStmt
}
func (this *SimpleParser) parseTry () *JSNode {
  var tryStmt *JSNode= CreateNew_JSNode();
  tryStmt._type = "TryStatement"; 
  var startTok *Token= this.peek();
  tryStmt.start = startTok.start; 
  tryStmt.line = startTok.line; 
  tryStmt.col = startTok.col; 
  this.expectValue("try");
  var block *JSNode= this.parseBlock();
  tryStmt.body.value = block;
  tryStmt.body.has_value = true; /* detected as non-optional */
  if  this.matchValue("catch") {
    var catchNode *JSNode= CreateNew_JSNode();
    catchNode._type = "CatchClause"; 
    var catchTok *Token= this.peek();
    catchNode.start = catchTok.start; 
    catchNode.line = catchTok.line; 
    catchNode.col = catchTok.col; 
    this.advance();
    this.expectValue("(");
    var paramTok *Token= this.expect("Identifier");
    catchNode.name = paramTok.value; 
    this.expectValue(")");
    var catchBody *JSNode= this.parseBlock();
    catchNode.body.value = catchBody;
    catchNode.body.has_value = true; /* detected as non-optional */
    tryStmt.left.value = catchNode;
    tryStmt.left.has_value = true; /* detected as non-optional */
  }
  if  this.matchValue("finally") {
    this.advance();
    var finallyBlock *JSNode= this.parseBlock();
    tryStmt.right.value = finallyBlock;
    tryStmt.right.has_value = true; /* detected as non-optional */
  }
  return tryStmt
}
func (this *SimpleParser) parseThrow () *JSNode {
  var throwStmt *JSNode= CreateNew_JSNode();
  throwStmt._type = "ThrowStatement"; 
  var startTok *Token= this.peek();
  throwStmt.start = startTok.start; 
  throwStmt.line = startTok.line; 
  throwStmt.col = startTok.col; 
  this.expectValue("throw");
  var arg *JSNode= this.parseExpr();
  throwStmt.left.value = arg;
  throwStmt.left.has_value = true; /* detected as non-optional */
  if  this.matchValue(";") {
    this.advance();
  }
  return throwStmt
}
func (this *SimpleParser) parseBreak () *JSNode {
  var breakStmt *JSNode= CreateNew_JSNode();
  breakStmt._type = "BreakStatement"; 
  var startTok *Token= this.peek();
  breakStmt.start = startTok.start; 
  breakStmt.line = startTok.line; 
  breakStmt.col = startTok.col; 
  this.expectValue("break");
  if  this.matchType("Identifier") {
    var labelTok *Token= this.peek();
    breakStmt.name = labelTok.value; 
    this.advance();
  }
  if  this.matchValue(";") {
    this.advance();
  }
  return breakStmt
}
func (this *SimpleParser) parseContinue () *JSNode {
  var contStmt *JSNode= CreateNew_JSNode();
  contStmt._type = "ContinueStatement"; 
  var startTok *Token= this.peek();
  contStmt.start = startTok.start; 
  contStmt.line = startTok.line; 
  contStmt.col = startTok.col; 
  this.expectValue("continue");
  if  this.matchType("Identifier") {
    var labelTok *Token= this.peek();
    contStmt.name = labelTok.value; 
    this.advance();
  }
  if  this.matchValue(";") {
    this.advance();
  }
  return contStmt
}
func (this *SimpleParser) parseExprStmt () *JSNode {
  var stmt *JSNode= CreateNew_JSNode();
  stmt._type = "ExpressionStatement"; 
  var startTok *Token= this.peek();
  stmt.start = startTok.start; 
  stmt.line = startTok.line; 
  stmt.col = startTok.col; 
  var expr *JSNode= this.parseExpr();
  stmt.left.value = expr;
  stmt.left.has_value = true; /* detected as non-optional */
  if  this.matchValue(";") {
    this.advance();
  }
  return stmt
}
func (this *SimpleParser) parseExpr () *JSNode {
  return this.parseAssignment()
}
func (this *SimpleParser) parseAssignment () *JSNode {
  var left *JSNode= this.parseTernary();
  var tokVal string= this.peekValue();
  if  (((((((((((((((tokVal == "=") || (tokVal == "+=")) || (tokVal == "-=")) || (tokVal == "*=")) || (tokVal == "/=")) || (tokVal == "%=")) || (tokVal == "**=")) || (tokVal == "<<=")) || (tokVal == ">>=")) || (tokVal == ">>>=")) || (tokVal == "&=")) || (tokVal == "^=")) || (tokVal == "|=")) || (tokVal == "&&=")) || (tokVal == "||=")) || (tokVal == "??=") {
    var opTok *Token= this.peek();
    this.advance();
    var right *JSNode= this.parseAssignment();
    var assign *JSNode= CreateNew_JSNode();
    assign._type = "AssignmentExpression"; 
    assign.operator = opTok.value; 
    assign.left.value = left;
    assign.left.has_value = true; /* detected as non-optional */
    assign.right.value = right;
    assign.right.has_value = true; /* detected as non-optional */
    assign.start = left.start; 
    assign.line = left.line; 
    assign.col = left.col; 
    return assign
  }
  return left
}
func (this *SimpleParser) parseTernary () *JSNode {
  var condition *JSNode= this.parseLogicalOr();
  if  this.matchValue("?") {
    this.advance();
    var consequent *JSNode= this.parseAssignment();
    this.expectValue(":");
    var alternate *JSNode= this.parseAssignment();
    var ternary *JSNode= CreateNew_JSNode();
    ternary._type = "ConditionalExpression"; 
    ternary.left.value = condition;
    ternary.left.has_value = true; /* detected as non-optional */
    ternary.body.value = consequent;
    ternary.body.has_value = true; /* detected as non-optional */
    ternary.right.value = alternate;
    ternary.right.has_value = true; /* detected as non-optional */
    ternary.start = condition.start; 
    ternary.line = condition.line; 
    ternary.col = condition.col; 
    return ternary
  }
  return condition
}
func (this *SimpleParser) parseLogicalOr () *JSNode {
  var left *JSNode= this.parseNullishCoalescing();
  for this.matchValue("||") {
    var opTok *Token= this.peek();
    this.advance();
    var right *JSNode= this.parseNullishCoalescing();
    var binary *JSNode= CreateNew_JSNode();
    binary._type = "LogicalExpression"; 
    binary.operator = opTok.value; 
    binary.left.value = left;
    binary.left.has_value = true; /* detected as non-optional */
    binary.right.value = right;
    binary.right.has_value = true; /* detected as non-optional */
    binary.start = left.start; 
    binary.line = left.line; 
    binary.col = left.col; 
    left = binary; 
  }
  return left
}
func (this *SimpleParser) parseNullishCoalescing () *JSNode {
  var left *JSNode= this.parseLogicalAnd();
  for this.matchValue("??") {
    var opTok *Token= this.peek();
    this.advance();
    var right *JSNode= this.parseLogicalAnd();
    var binary *JSNode= CreateNew_JSNode();
    binary._type = "LogicalExpression"; 
    binary.operator = opTok.value; 
    binary.left.value = left;
    binary.left.has_value = true; /* detected as non-optional */
    binary.right.value = right;
    binary.right.has_value = true; /* detected as non-optional */
    binary.start = left.start; 
    binary.line = left.line; 
    binary.col = left.col; 
    left = binary; 
  }
  return left
}
func (this *SimpleParser) parseLogicalAnd () *JSNode {
  var left *JSNode= this.parseEquality();
  for this.matchValue("&&") {
    var opTok *Token= this.peek();
    this.advance();
    var right *JSNode= this.parseEquality();
    var binary *JSNode= CreateNew_JSNode();
    binary._type = "LogicalExpression"; 
    binary.operator = opTok.value; 
    binary.left.value = left;
    binary.left.has_value = true; /* detected as non-optional */
    binary.right.value = right;
    binary.right.has_value = true; /* detected as non-optional */
    binary.start = left.start; 
    binary.line = left.line; 
    binary.col = left.col; 
    left = binary; 
  }
  return left
}
func (this *SimpleParser) parseEquality () *JSNode {
  var left *JSNode= this.parseComparison();
  var tokVal string= this.peekValue();
  for (((tokVal == "==") || (tokVal == "!=")) || (tokVal == "===")) || (tokVal == "!==") {
    var opTok *Token= this.peek();
    this.advance();
    var right *JSNode= this.parseComparison();
    var binary *JSNode= CreateNew_JSNode();
    binary._type = "BinaryExpression"; 
    binary.operator = opTok.value; 
    binary.left.value = left;
    binary.left.has_value = true; /* detected as non-optional */
    binary.right.value = right;
    binary.right.has_value = true; /* detected as non-optional */
    binary.start = left.start; 
    binary.line = left.line; 
    binary.col = left.col; 
    left = binary; 
    tokVal = this.peekValue(); 
  }
  return left
}
func (this *SimpleParser) parseComparison () *JSNode {
  var left *JSNode= this.parseAdditive();
  var tokVal string= this.peekValue();
  for (((tokVal == "<") || (tokVal == ">")) || (tokVal == "<=")) || (tokVal == ">=") {
    var opTok *Token= this.peek();
    this.advance();
    var right *JSNode= this.parseAdditive();
    var binary *JSNode= CreateNew_JSNode();
    binary._type = "BinaryExpression"; 
    binary.operator = opTok.value; 
    binary.left.value = left;
    binary.left.has_value = true; /* detected as non-optional */
    binary.right.value = right;
    binary.right.has_value = true; /* detected as non-optional */
    binary.start = left.start; 
    binary.line = left.line; 
    binary.col = left.col; 
    left = binary; 
    tokVal = this.peekValue(); 
  }
  return left
}
func (this *SimpleParser) parseAdditive () *JSNode {
  var left *JSNode= this.parseMultiplicative();
  var tokVal string= this.peekValue();
  for (tokVal == "+") || (tokVal == "-") {
    var opTok *Token= this.peek();
    this.advance();
    var right *JSNode= this.parseMultiplicative();
    var binary *JSNode= CreateNew_JSNode();
    binary._type = "BinaryExpression"; 
    binary.operator = opTok.value; 
    binary.left.value = left;
    binary.left.has_value = true; /* detected as non-optional */
    binary.right.value = right;
    binary.right.has_value = true; /* detected as non-optional */
    binary.start = left.start; 
    binary.line = left.line; 
    binary.col = left.col; 
    left = binary; 
    tokVal = this.peekValue(); 
  }
  return left
}
func (this *SimpleParser) parseMultiplicative () *JSNode {
  var left *JSNode= this.parseUnary();
  var tokVal string= this.peekValue();
  for ((tokVal == "*") || (tokVal == "/")) || (tokVal == "%") {
    var opTok *Token= this.peek();
    this.advance();
    var right *JSNode= this.parseUnary();
    var binary *JSNode= CreateNew_JSNode();
    binary._type = "BinaryExpression"; 
    binary.operator = opTok.value; 
    binary.left.value = left;
    binary.left.has_value = true; /* detected as non-optional */
    binary.right.value = right;
    binary.right.has_value = true; /* detected as non-optional */
    binary.start = left.start; 
    binary.line = left.line; 
    binary.col = left.col; 
    left = binary; 
    tokVal = this.peekValue(); 
  }
  return left
}
func (this *SimpleParser) parseUnary () *JSNode {
  var tokType string= this.peekType();
  var tokVal string= this.peekValue();
  if  tokType == "Punctuator" {
    if  ((tokVal == "!") || (tokVal == "-")) || (tokVal == "+") {
      var opTok *Token= this.peek();
      this.advance();
      var arg *JSNode= this.parseUnary();
      var unary *JSNode= CreateNew_JSNode();
      unary._type = "UnaryExpression"; 
      unary.operator = opTok.value; 
      unary.left.value = arg;
      unary.left.has_value = true; /* detected as non-optional */
      unary.start = opTok.start; 
      unary.line = opTok.line; 
      unary.col = opTok.col; 
      return unary
    }
  }
  if  (tokType == "Keyword") && (tokVal == "typeof") {
    var opTok_1 *Token= this.peek();
    this.advance();
    var arg_1 *JSNode= this.parseUnary();
    var unary_1 *JSNode= CreateNew_JSNode();
    unary_1._type = "UnaryExpression"; 
    unary_1.operator = opTok_1.value; 
    unary_1.left.value = arg_1;
    unary_1.left.has_value = true; /* detected as non-optional */
    unary_1.start = opTok_1.start; 
    unary_1.line = opTok_1.line; 
    unary_1.col = opTok_1.col; 
    return unary_1
  }
  if  (tokType == "Punctuator") && ((tokVal == "++") || (tokVal == "--")) {
    var opTok_2 *Token= this.peek();
    this.advance();
    var arg_2 *JSNode= this.parseUnary();
    var update *JSNode= CreateNew_JSNode();
    update._type = "UpdateExpression"; 
    update.operator = opTok_2.value; 
    update.prefix = true; 
    update.left.value = arg_2;
    update.left.has_value = true; /* detected as non-optional */
    update.start = opTok_2.start; 
    update.line = opTok_2.line; 
    update.col = opTok_2.col; 
    return update
  }
  if  tokVal == "yield" {
    var yieldTok *Token= this.peek();
    this.advance();
    var yieldExpr *JSNode= CreateNew_JSNode();
    yieldExpr._type = "YieldExpression"; 
    yieldExpr.start = yieldTok.start; 
    yieldExpr.line = yieldTok.line; 
    yieldExpr.col = yieldTok.col; 
    if  this.matchValue("*") {
      yieldExpr.delegate = true; 
      this.advance();
    }
    var nextVal string= this.peekValue();
    if  (((nextVal != ";") && (nextVal != "}")) && (nextVal != ",")) && (nextVal != ")") {
      var arg_3 *JSNode= this.parseAssignment();
      yieldExpr.left.value = arg_3;
      yieldExpr.left.has_value = true; /* detected as non-optional */
    }
    return yieldExpr
  }
  if  tokVal == "await" {
    var awaitTok *Token= this.peek();
    this.advance();
    var arg_4 *JSNode= this.parseUnary();
    var awaitExpr *JSNode= CreateNew_JSNode();
    awaitExpr._type = "AwaitExpression"; 
    awaitExpr.left.value = arg_4;
    awaitExpr.left.has_value = true; /* detected as non-optional */
    awaitExpr.start = awaitTok.start; 
    awaitExpr.line = awaitTok.line; 
    awaitExpr.col = awaitTok.col; 
    return awaitExpr
  }
  return this.parseCallMember()
}
func (this *SimpleParser) parseCallMember () *JSNode {
  if  this.matchValue("new") {
    return this.parseNewExpression()
  }
  var object *JSNode= this.parsePrimary();
  var cont bool= true;
  for cont {
    var tokVal string= this.peekValue();
    if  (tokVal == "++") || (tokVal == "--") {
      var opTok *Token= this.peek();
      this.advance();
      var update *JSNode= CreateNew_JSNode();
      update._type = "UpdateExpression"; 
      update.operator = opTok.value; 
      update.prefix = false; 
      update.left.value = object;
      update.left.has_value = true; /* detected as non-optional */
      update.start = object.start; 
      update.line = object.line; 
      update.col = object.col; 
      object = update; 
    } else {
      if  tokVal == "?." {
        this.advance();
        var nextTokVal string= this.peekValue();
        if  nextTokVal == "(" {
          this.advance();
          var call *JSNode= CreateNew_JSNode();
          call._type = "OptionalCallExpression"; 
          call.left.value = object;
          call.left.has_value = true; /* detected as non-optional */
          call.start = object.start; 
          call.line = object.line; 
          call.col = object.col; 
          for (this.matchValue(")") == false) && (this.isAtEnd() == false) {
            if  (int64(len(call.children))) > int64(0) {
              this.expectValue(",");
            }
            if  this.matchValue(")") || this.isAtEnd() {
              break;
            }
            var arg *JSNode= this.parseAssignment();
            call.children = append(call.children,arg); 
          }
          this.expectValue(")");
          object = call; 
        } else {
          if  nextTokVal == "[" {
            this.advance();
            var propExpr *JSNode= this.parseExpr();
            this.expectValue("]");
            var member *JSNode= CreateNew_JSNode();
            member._type = "OptionalMemberExpression"; 
            member.left.value = object;
            member.left.has_value = true; /* detected as non-optional */
            member.right.value = propExpr;
            member.right.has_value = true; /* detected as non-optional */
            member.computed = true; 
            member.start = object.start; 
            member.line = object.line; 
            member.col = object.col; 
            object = member; 
          } else {
            var propTok *Token= this.expect("Identifier");
            var member_1 *JSNode= CreateNew_JSNode();
            member_1._type = "OptionalMemberExpression"; 
            member_1.left.value = object;
            member_1.left.has_value = true; /* detected as non-optional */
            member_1.name = propTok.value; 
            member_1.computed = false; 
            member_1.start = object.start; 
            member_1.line = object.line; 
            member_1.col = object.col; 
            object = member_1; 
          }
        }
      } else {
        if  tokVal == "." {
          this.advance();
          var propTok_1 *Token= this.expect("Identifier");
          var member_2 *JSNode= CreateNew_JSNode();
          member_2._type = "MemberExpression"; 
          member_2.left.value = object;
          member_2.left.has_value = true; /* detected as non-optional */
          member_2.name = propTok_1.value; 
          member_2.computed = false; 
          member_2.start = object.start; 
          member_2.line = object.line; 
          member_2.col = object.col; 
          object = member_2; 
        } else {
          if  tokVal == "[" {
            this.advance();
            var propExpr_1 *JSNode= this.parseExpr();
            this.expectValue("]");
            var member_3 *JSNode= CreateNew_JSNode();
            member_3._type = "MemberExpression"; 
            member_3.left.value = object;
            member_3.left.has_value = true; /* detected as non-optional */
            member_3.right.value = propExpr_1;
            member_3.right.has_value = true; /* detected as non-optional */
            member_3.computed = true; 
            member_3.start = object.start; 
            member_3.line = object.line; 
            member_3.col = object.col; 
            object = member_3; 
          } else {
            if  tokVal == "(" {
              this.advance();
              var call_1 *JSNode= CreateNew_JSNode();
              call_1._type = "CallExpression"; 
              call_1.left.value = object;
              call_1.left.has_value = true; /* detected as non-optional */
              call_1.start = object.start; 
              call_1.line = object.line; 
              call_1.col = object.col; 
              for (this.matchValue(")") == false) && (this.isAtEnd() == false) {
                if  (int64(len(call_1.children))) > int64(0) {
                  this.expectValue(",");
                }
                if  this.matchValue(")") || this.isAtEnd() {
                  break;
                }
                if  this.matchValue("...") {
                  var spreadTok *Token= this.peek();
                  this.advance();
                  var spreadArg *JSNode= this.parseAssignment();
                  var spread *JSNode= CreateNew_JSNode();
                  spread._type = "SpreadElement"; 
                  spread.left.value = spreadArg;
                  spread.left.has_value = true; /* detected as non-optional */
                  spread.start = spreadTok.start; 
                  spread.line = spreadTok.line; 
                  spread.col = spreadTok.col; 
                  call_1.children = append(call_1.children,spread); 
                } else {
                  var arg_1 *JSNode= this.parseAssignment();
                  call_1.children = append(call_1.children,arg_1); 
                }
              }
              this.expectValue(")");
              object = call_1; 
            } else {
              cont = false; 
            }
          }
        }
      }
    }
  }
  return object
}
func (this *SimpleParser) parseNewExpression () *JSNode {
  var newExpr *JSNode= CreateNew_JSNode();
  newExpr._type = "NewExpression"; 
  var startTok *Token= this.peek();
  newExpr.start = startTok.start; 
  newExpr.line = startTok.line; 
  newExpr.col = startTok.col; 
  this.expectValue("new");
  var callee *JSNode= this.parsePrimary();
  var cont bool= true;
  for cont {
    var tokVal string= this.peekValue();
    if  tokVal == "." {
      this.advance();
      var propTok *Token= this.expect("Identifier");
      var member *JSNode= CreateNew_JSNode();
      member._type = "MemberExpression"; 
      member.left.value = callee;
      member.left.has_value = true; /* detected as non-optional */
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
  newExpr.left.value = callee;
  newExpr.left.has_value = true; /* detected as non-optional */
  if  this.matchValue("(") {
    this.advance();
    for (this.matchValue(")") == false) && (this.isAtEnd() == false) {
      if  (int64(len(newExpr.children))) > int64(0) {
        this.expectValue(",");
      }
      if  this.matchValue(")") || this.isAtEnd() {
        break;
      }
      var arg *JSNode= this.parseAssignment();
      newExpr.children = append(newExpr.children,arg); 
    }
    this.expectValue(")");
  }
  return newExpr
}
func (this *SimpleParser) parsePrimary () *JSNode {
  var tokType string= this.peekType();
  var tokVal string= this.peekValue();
  var tok *Token= this.peek();
  if  tokVal == "async" {
    var nextVal string= this.peekAt(int64(1));
    var nextNext string= this.peekAt(int64(2));
    if  (nextVal == "(") || (nextNext == "=>") {
      return this.parseAsyncArrowFunction()
    }
  }
  if  tokType == "Identifier" {
    var nextVal_1 string= this.peekAt(int64(1));
    if  nextVal_1 == "=>" {
      return this.parseArrowFunction()
    }
    this.advance();
    var id *JSNode= CreateNew_JSNode();
    id._type = "Identifier"; 
    id.name = tok.value; 
    id.start = tok.start; 
    id.end = tok.end; 
    id.line = tok.line; 
    id.col = tok.col; 
    return id
  }
  if  tokType == "Number" {
    this.advance();
    var lit *JSNode= CreateNew_JSNode();
    lit._type = "Literal"; 
    lit.raw = tok.value; 
    lit.start = tok.start; 
    lit.end = tok.end; 
    lit.line = tok.line; 
    lit.col = tok.col; 
    return lit
  }
  if  tokType == "String" {
    this.advance();
    var lit_1 *JSNode= CreateNew_JSNode();
    lit_1._type = "Literal"; 
    lit_1.raw = tok.value; 
    lit_1.start = tok.start; 
    lit_1.end = tok.end; 
    lit_1.line = tok.line; 
    lit_1.col = tok.col; 
    return lit_1
  }
  if  (tokVal == "true") || (tokVal == "false") {
    this.advance();
    var lit_2 *JSNode= CreateNew_JSNode();
    lit_2._type = "Literal"; 
    lit_2.raw = tok.value; 
    lit_2.start = tok.start; 
    lit_2.end = tok.end; 
    lit_2.line = tok.line; 
    lit_2.col = tok.col; 
    return lit_2
  }
  if  tokVal == "null" {
    this.advance();
    var lit_3 *JSNode= CreateNew_JSNode();
    lit_3._type = "Literal"; 
    lit_3.raw = "null"; 
    lit_3.start = tok.start; 
    lit_3.end = tok.end; 
    lit_3.line = tok.line; 
    lit_3.col = tok.col; 
    return lit_3
  }
  if  tokType == "TemplateLiteral" {
    this.advance();
    var tmpl *JSNode= CreateNew_JSNode();
    tmpl._type = "TemplateLiteral"; 
    tmpl.raw = tok.value; 
    tmpl.start = tok.start; 
    tmpl.end = tok.end; 
    tmpl.line = tok.line; 
    tmpl.col = tok.col; 
    return tmpl
  }
  if  tokVal == "(" {
    if  this.isArrowFunction() {
      return this.parseArrowFunction()
    }
    this.advance();
    var expr *JSNode= this.parseExpr();
    this.expectValue(")");
    return expr
  }
  if  tokVal == "[" {
    return this.parseArray()
  }
  if  tokVal == "{" {
    return this.parseObject()
  }
  if  tokVal == "/" {
    return this.parseRegexLiteral()
  }
  if  tokVal == "function" {
    return this.parseFunctionExpression()
  }
  this.advance();
  var fallback *JSNode= CreateNew_JSNode();
  fallback._type = "Identifier"; 
  fallback.name = tok.value; 
  fallback.start = tok.start; 
  fallback.end = tok.end; 
  fallback.line = tok.line; 
  fallback.col = tok.col; 
  return fallback
}
func (this *SimpleParser) parseArray () *JSNode {
  var arr *JSNode= CreateNew_JSNode();
  arr._type = "ArrayExpression"; 
  var startTok *Token= this.peek();
  arr.start = startTok.start; 
  arr.line = startTok.line; 
  arr.col = startTok.col; 
  this.expectValue("[");
  for (this.matchValue("]") == false) && (this.isAtEnd() == false) {
    if  (int64(len(arr.children))) > int64(0) {
      this.expectValue(",");
    }
    if  this.matchValue("]") || this.isAtEnd() {
      break;
    }
    if  this.matchValue("...") {
      var spreadTok *Token= this.peek();
      this.advance();
      var arg *JSNode= this.parseAssignment();
      var spread *JSNode= CreateNew_JSNode();
      spread._type = "SpreadElement"; 
      spread.left.value = arg;
      spread.left.has_value = true; /* detected as non-optional */
      spread.start = spreadTok.start; 
      spread.line = spreadTok.line; 
      spread.col = spreadTok.col; 
      arr.children = append(arr.children,spread); 
    } else {
      var elem *JSNode= this.parseAssignment();
      arr.children = append(arr.children,elem); 
    }
  }
  this.expectValue("]");
  return arr
}
func (this *SimpleParser) parseObject () *JSNode {
  var obj *JSNode= CreateNew_JSNode();
  obj._type = "ObjectExpression"; 
  var startTok *Token= this.peek();
  obj.start = startTok.start; 
  obj.line = startTok.line; 
  obj.col = startTok.col; 
  this.expectValue("{");
  for (this.matchValue("}") == false) && (this.isAtEnd() == false) {
    if  (int64(len(obj.children))) > int64(0) {
      this.expectValue(",");
    }
    if  this.matchValue("}") || this.isAtEnd() {
      break;
    }
    if  this.matchValue("...") {
      var spreadTok *Token= this.peek();
      this.advance();
      var arg *JSNode= this.parseAssignment();
      var spread *JSNode= CreateNew_JSNode();
      spread._type = "SpreadElement"; 
      spread.left.value = arg;
      spread.left.has_value = true; /* detected as non-optional */
      spread.start = spreadTok.start; 
      spread.line = spreadTok.line; 
      spread.col = spreadTok.col; 
      obj.children = append(obj.children,spread); 
    } else {
      var prop *JSNode= CreateNew_JSNode();
      prop._type = "Property"; 
      var keyTok *Token= this.peek();
      var keyType string= this.peekType();
      if  this.matchValue("[") {
        this.advance();
        var keyExpr *JSNode= this.parseAssignment();
        this.expectValue("]");
        this.expectValue(":");
        var val *JSNode= this.parseAssignment();
        prop.right.value = keyExpr;
        prop.right.has_value = true; /* detected as non-optional */
        prop.left.value = val;
        prop.left.has_value = true; /* detected as non-optional */
        prop.computed = true; 
        prop.start = keyTok.start; 
        prop.line = keyTok.line; 
        prop.col = keyTok.col; 
        obj.children = append(obj.children,prop); 
      } else {
        if  ((keyType == "Identifier") || (keyType == "String")) || (keyType == "Number") {
          this.advance();
          prop.name = keyTok.value; 
          prop.start = keyTok.start; 
          prop.line = keyTok.line; 
          prop.col = keyTok.col; 
          if  this.matchValue(":") {
            this.expectValue(":");
            var val_1 *JSNode= this.parseAssignment();
            prop.left.value = val_1;
            prop.left.has_value = true; /* detected as non-optional */
          } else {
            var id *JSNode= CreateNew_JSNode();
            id._type = "Identifier"; 
            id.name = keyTok.value; 
            id.start = keyTok.start; 
            id.line = keyTok.line; 
            id.col = keyTok.col; 
            prop.left.value = id;
            prop.left.has_value = true; /* detected as non-optional */
            prop.shorthand = true; 
          }
          obj.children = append(obj.children,prop); 
        } else {
          var err string= (((strings.Join([]string{ ((strings.Join([]string{ "Parse error at line ",strconv.FormatInt(keyTok.line, 10) }, "")) + ":"),strconv.FormatInt(keyTok.col, 10) }, "")) + ": unexpected token '") + keyTok.value) + "' in object literal";
          this.addError(err);
          this.advance();
        }
      }
    }
  }
  this.expectValue("}");
  return obj
}
func (this *SimpleParser) parseArrayPattern () *JSNode {
  var pattern *JSNode= CreateNew_JSNode();
  pattern._type = "ArrayPattern"; 
  var startTok *Token= this.peek();
  pattern.start = startTok.start; 
  pattern.line = startTok.line; 
  pattern.col = startTok.col; 
  this.expectValue("[");
  for (this.matchValue("]") == false) && (this.isAtEnd() == false) {
    if  (int64(len(pattern.children))) > int64(0) {
      this.expectValue(",");
    }
    if  this.matchValue("]") || this.isAtEnd() {
      break;
    }
    if  this.matchValue("...") {
      var restTok *Token= this.peek();
      this.advance();
      var idTok *Token= this.expect("Identifier");
      var rest *JSNode= CreateNew_JSNode();
      rest._type = "RestElement"; 
      rest.name = idTok.value; 
      rest.start = restTok.start; 
      rest.line = restTok.line; 
      rest.col = restTok.col; 
      pattern.children = append(pattern.children,rest); 
    } else {
      if  this.matchValue("[") {
        var nested *JSNode= this.parseArrayPattern();
        pattern.children = append(pattern.children,nested); 
      } else {
        if  this.matchValue("{") {
          var nested_1 *JSNode= this.parseObjectPattern();
          pattern.children = append(pattern.children,nested_1); 
        } else {
          var idTok_1 *Token= this.expect("Identifier");
          var id *JSNode= CreateNew_JSNode();
          id._type = "Identifier"; 
          id.name = idTok_1.value; 
          id.start = idTok_1.start; 
          id.line = idTok_1.line; 
          id.col = idTok_1.col; 
          pattern.children = append(pattern.children,id); 
        }
      }
    }
  }
  this.expectValue("]");
  return pattern
}
func (this *SimpleParser) parseObjectPattern () *JSNode {
  var pattern *JSNode= CreateNew_JSNode();
  pattern._type = "ObjectPattern"; 
  var startTok *Token= this.peek();
  pattern.start = startTok.start; 
  pattern.line = startTok.line; 
  pattern.col = startTok.col; 
  this.expectValue("{");
  for (this.matchValue("}") == false) && (this.isAtEnd() == false) {
    if  (int64(len(pattern.children))) > int64(0) {
      this.expectValue(",");
    }
    if  this.matchValue("}") || this.isAtEnd() {
      break;
    }
    if  this.matchValue("...") {
      var restTok *Token= this.peek();
      this.advance();
      var idTok *Token= this.expect("Identifier");
      var rest *JSNode= CreateNew_JSNode();
      rest._type = "RestElement"; 
      rest.name = idTok.value; 
      rest.start = restTok.start; 
      rest.line = restTok.line; 
      rest.col = restTok.col; 
      pattern.children = append(pattern.children,rest); 
    } else {
      var prop *JSNode= CreateNew_JSNode();
      prop._type = "Property"; 
      var keyTok *Token= this.expect("Identifier");
      prop.name = keyTok.value; 
      prop.start = keyTok.start; 
      prop.line = keyTok.line; 
      prop.col = keyTok.col; 
      if  this.matchValue(":") {
        this.advance();
        if  this.matchValue("[") {
          var nested *JSNode= this.parseArrayPattern();
          prop.left.value = nested;
          prop.left.has_value = true; /* detected as non-optional */
        } else {
          if  this.matchValue("{") {
            var nested_1 *JSNode= this.parseObjectPattern();
            prop.left.value = nested_1;
            prop.left.has_value = true; /* detected as non-optional */
          } else {
            var idTok2 *Token= this.expect("Identifier");
            var id *JSNode= CreateNew_JSNode();
            id._type = "Identifier"; 
            id.name = idTok2.value; 
            id.start = idTok2.start; 
            id.line = idTok2.line; 
            id.col = idTok2.col; 
            prop.left.value = id;
            prop.left.has_value = true; /* detected as non-optional */
          }
        }
      } else {
        var id_1 *JSNode= CreateNew_JSNode();
        id_1._type = "Identifier"; 
        id_1.name = keyTok.value; 
        id_1.start = keyTok.start; 
        id_1.line = keyTok.line; 
        id_1.col = keyTok.col; 
        prop.left.value = id_1;
        prop.left.has_value = true; /* detected as non-optional */
        prop.shorthand = true; 
      }
      pattern.children = append(pattern.children,prop); 
    }
  }
  this.expectValue("}");
  return pattern
}
func (this *SimpleParser) isArrowFunction () bool {
  if  this.matchValue("(") == false {
    return false
  }
  var depth int64= int64(1);
  var scanPos int64= int64(1);
  for depth > int64(0) {
    var scanVal string= this.peekAt(scanPos);
    if  scanVal == "" {
      return false
    }
    if  scanVal == "(" {
      depth = depth + int64(1); 
    }
    if  scanVal == ")" {
      depth = depth - int64(1); 
    }
    scanPos = scanPos + int64(1); 
  }
  var afterParen string= this.peekAt(scanPos);
  return afterParen == "=>"
}
func (this *SimpleParser) parseArrowFunction () *JSNode {
  var arrow *JSNode= CreateNew_JSNode();
  arrow._type = "ArrowFunctionExpression"; 
  var startTok *Token= this.peek();
  arrow.start = startTok.start; 
  arrow.line = startTok.line; 
  arrow.col = startTok.col; 
  if  this.matchValue("(") {
    this.advance();
    for (this.matchValue(")") == false) && (this.isAtEnd() == false) {
      if  (int64(len(arrow.children))) > int64(0) {
        this.expectValue(",");
      }
      if  this.matchValue(")") || this.isAtEnd() {
        break;
      }
      var paramTok *Token= this.expect("Identifier");
      var param *JSNode= CreateNew_JSNode();
      param._type = "Identifier"; 
      param.name = paramTok.value; 
      param.start = paramTok.start; 
      param.line = paramTok.line; 
      param.col = paramTok.col; 
      arrow.children = append(arrow.children,param); 
    }
    this.expectValue(")");
  } else {
    var paramTok_1 *Token= this.expect("Identifier");
    var param_1 *JSNode= CreateNew_JSNode();
    param_1._type = "Identifier"; 
    param_1.name = paramTok_1.value; 
    param_1.start = paramTok_1.start; 
    param_1.line = paramTok_1.line; 
    param_1.col = paramTok_1.col; 
    arrow.children = append(arrow.children,param_1); 
  }
  this.expectValue("=>");
  if  this.matchValue("{") {
    var body *JSNode= this.parseBlock();
    arrow.body.value = body;
    arrow.body.has_value = true; /* detected as non-optional */
  } else {
    var expr *JSNode= this.parseAssignment();
    arrow.body.value = expr;
    arrow.body.has_value = true; /* detected as non-optional */
  }
  return arrow
}
func (this *SimpleParser) parseAsyncArrowFunction () *JSNode {
  var arrow *JSNode= CreateNew_JSNode();
  arrow._type = "ArrowFunctionExpression"; 
  arrow.async = true; 
  var startTok *Token= this.peek();
  arrow.start = startTok.start; 
  arrow.line = startTok.line; 
  arrow.col = startTok.col; 
  this.expectValue("async");
  if  this.matchValue("(") {
    this.advance();
    for (this.matchValue(")") == false) && (this.isAtEnd() == false) {
      if  (int64(len(arrow.children))) > int64(0) {
        this.expectValue(",");
      }
      if  this.matchValue(")") || this.isAtEnd() {
        break;
      }
      var paramTok *Token= this.expect("Identifier");
      var param *JSNode= CreateNew_JSNode();
      param._type = "Identifier"; 
      param.name = paramTok.value; 
      param.start = paramTok.start; 
      param.line = paramTok.line; 
      param.col = paramTok.col; 
      arrow.children = append(arrow.children,param); 
    }
    this.expectValue(")");
  } else {
    var paramTok_1 *Token= this.expect("Identifier");
    var param_1 *JSNode= CreateNew_JSNode();
    param_1._type = "Identifier"; 
    param_1.name = paramTok_1.value; 
    param_1.start = paramTok_1.start; 
    param_1.line = paramTok_1.line; 
    param_1.col = paramTok_1.col; 
    arrow.children = append(arrow.children,param_1); 
  }
  this.expectValue("=>");
  if  this.matchValue("{") {
    var body *JSNode= this.parseBlock();
    arrow.body.value = body;
    arrow.body.has_value = true; /* detected as non-optional */
  } else {
    var expr *JSNode= this.parseAssignment();
    arrow.body.value = expr;
    arrow.body.has_value = true; /* detected as non-optional */
  }
  return arrow
}
type ASTPrinter struct { 
}

func CreateNew_ASTPrinter() *ASTPrinter {
  me := new(ASTPrinter)
  return me;
}
func ASTPrinter_static_printNode(node *JSNode, depth int64) () {
  var indent string= "";
  var i int64= int64(0);
  for i < depth {
    indent = indent + "  "; 
    i = i + int64(1); 
  }
  var numComments int64= int64(len(node.leadingComments));
  if  numComments > int64(0) {
    var ci int64 = 0;  
    for ; ci < int64(len(node.leadingComments)) ; ci++ {
      comment := node.leadingComments[ci];
      var commentType string= comment._type;
      var preview string= comment.raw;
      if  (int64(len(preview))) > int64(40) {
        preview = (preview[int64(0):int64(40)]) + "..."; 
      }
      fmt.Println( ((indent + commentType) + ": ") + preview )
    }
  }
  var nodeType string= node._type;
  var loc string= (strings.Join([]string{ ((strings.Join([]string{ "[",strconv.FormatInt(node.line, 10) }, "")) + ":"),strconv.FormatInt(node.col, 10) }, "")) + "]";
  if  nodeType == "VariableDeclaration" {
    var kind string= node.name;
    if  (int64(len(kind))) > int64(0) {
      fmt.Println( (((indent + "VariableDeclaration (") + kind) + ") ") + loc )
    } else {
      fmt.Println( (indent + "VariableDeclaration ") + loc )
    }
    var ci_1 int64 = 0;  
    for ; ci_1 < int64(len(node.children)) ; ci_1++ {
      child := node.children[ci_1];
      ASTPrinter_static_printNode(child, depth + int64(1));
    }
    return
  }
  if  nodeType == "VariableDeclarator" {
    if  node.left.has_value {
      var id *JSNode= node.left.value.(*JSNode);
      var idType string= id._type;
      if  idType == "Identifier" {
        fmt.Println( (((indent + "VariableDeclarator: ") + id.name) + " ") + loc )
      } else {
        fmt.Println( (indent + "VariableDeclarator ") + loc )
        fmt.Println( indent + "  pattern:" )
        ASTPrinter_static_printNode(id, depth + int64(2));
      }
    } else {
      fmt.Println( (indent + "VariableDeclarator ") + loc )
    }
    if  node.right.has_value {
      ASTPrinter_static_printNode(node.right.value.(*JSNode), depth + int64(1));
    }
    return
  }
  if  nodeType == "FunctionDeclaration" {
    var params string= "";
    var pi int64 = 0;  
    for ; pi < int64(len(node.children)) ; pi++ {
      p := node.children[pi];
      if  pi > int64(0) {
        params = params + ", "; 
      }
      params = params + p.name; 
    }
    var prefix string= "";
    if  node.async {
      if  node.generator {
        prefix = "async function* "; 
      } else {
        prefix = "async "; 
      }
    } else {
      if  node.generator {
        prefix = "function* "; 
      }
    }
    if  (int64(len(prefix))) > int64(0) {
      fmt.Println( ((((((indent + "FunctionDeclaration: ") + prefix) + node.name) + "(") + params) + ") ") + loc )
    } else {
      fmt.Println( (((((indent + "FunctionDeclaration: ") + node.name) + "(") + params) + ") ") + loc )
    }
    if  node.body.has_value {
      ASTPrinter_static_printNode(node.body.value.(*JSNode), depth + int64(1));
    }
    return
  }
  if  nodeType == "ClassDeclaration" {
    var output string= (indent + "ClassDeclaration: ") + node.name;
    if  node.left.has_value {
      var superClass *JSNode= node.left.value.(*JSNode);
      output = (output + " extends ") + superClass.name; 
    }
    fmt.Println( (output + " ") + loc )
    if  node.body.has_value {
      ASTPrinter_static_printNode(node.body.value.(*JSNode), depth + int64(1));
    }
    return
  }
  if  nodeType == "ClassBody" {
    fmt.Println( (indent + "ClassBody ") + loc )
    var mi int64 = 0;  
    for ; mi < int64(len(node.children)) ; mi++ {
      method := node.children[mi];
      ASTPrinter_static_printNode(method, depth + int64(1));
    }
    return
  }
  if  nodeType == "MethodDefinition" {
    var staticStr string= "";
    if  node.static {
      staticStr = "static "; 
    }
    fmt.Println( ((((indent + "MethodDefinition: ") + staticStr) + node.name) + " ") + loc )
    if  node.body.has_value {
      ASTPrinter_static_printNode(node.body.value.(*JSNode), depth + int64(1));
    }
    return
  }
  if  nodeType == "ArrowFunctionExpression" {
    var params_1 string= "";
    var pi_1 int64 = 0;  
    for ; pi_1 < int64(len(node.children)) ; pi_1++ {
      p_1 := node.children[pi_1];
      if  pi_1 > int64(0) {
        params_1 = params_1 + ", "; 
      }
      params_1 = params_1 + p_1.name; 
    }
    var asyncStr string= "";
    if  node.async {
      asyncStr = "async "; 
    }
    fmt.Println( (((((indent + "ArrowFunctionExpression: ") + asyncStr) + "(") + params_1) + ") => ") + loc )
    if  node.body.has_value {
      ASTPrinter_static_printNode(node.body.value.(*JSNode), depth + int64(1));
    }
    return
  }
  if  nodeType == "YieldExpression" {
    var delegateStr string= "";
    if  node.name == "delegate" {
      delegateStr = "*"; 
    }
    fmt.Println( (((indent + "YieldExpression") + delegateStr) + " ") + loc )
    if  node.left.has_value {
      ASTPrinter_static_printNode(node.left.value.(*JSNode), depth + int64(1));
    }
    return
  }
  if  nodeType == "AwaitExpression" {
    fmt.Println( (indent + "AwaitExpression ") + loc )
    if  node.left.has_value {
      ASTPrinter_static_printNode(node.left.value.(*JSNode), depth + int64(1));
    }
    return
  }
  if  nodeType == "TemplateLiteral" {
    fmt.Println( (((indent + "TemplateLiteral: `") + node.name) + "` ") + loc )
    return
  }
  if  nodeType == "BlockStatement" {
    fmt.Println( (indent + "BlockStatement ") + loc )
    var ci_2 int64 = 0;  
    for ; ci_2 < int64(len(node.children)) ; ci_2++ {
      child_1 := node.children[ci_2];
      ASTPrinter_static_printNode(child_1, depth + int64(1));
    }
    return
  }
  if  nodeType == "ReturnStatement" {
    fmt.Println( (indent + "ReturnStatement ") + loc )
    if  node.left.has_value {
      ASTPrinter_static_printNode(node.left.value.(*JSNode), depth + int64(1));
    }
    return
  }
  if  nodeType == "IfStatement" {
    fmt.Println( (indent + "IfStatement ") + loc )
    fmt.Println( indent + "  test:" )
    if  node.test.has_value {
      ASTPrinter_static_printNode(node.test.value.(*JSNode), depth + int64(2));
    }
    fmt.Println( indent + "  consequent:" )
    if  node.body.has_value {
      ASTPrinter_static_printNode(node.body.value.(*JSNode), depth + int64(2));
    }
    if  node.alternate.has_value {
      fmt.Println( indent + "  alternate:" )
      ASTPrinter_static_printNode(node.alternate.value.(*JSNode), depth + int64(2));
    }
    return
  }
  if  nodeType == "ExpressionStatement" {
    fmt.Println( (indent + "ExpressionStatement ") + loc )
    if  node.left.has_value {
      ASTPrinter_static_printNode(node.left.value.(*JSNode), depth + int64(1));
    }
    return
  }
  if  nodeType == "AssignmentExpression" {
    fmt.Println( (((indent + "AssignmentExpression: ") + node.name) + " ") + loc )
    if  node.left.has_value {
      fmt.Println( indent + "  left:" )
      ASTPrinter_static_printNode(node.left.value.(*JSNode), depth + int64(2));
    }
    if  node.right.has_value {
      fmt.Println( indent + "  right:" )
      ASTPrinter_static_printNode(node.right.value.(*JSNode), depth + int64(2));
    }
    return
  }
  if  (nodeType == "BinaryExpression") || (nodeType == "LogicalExpression") {
    fmt.Println( ((((indent + nodeType) + ": ") + node.name) + " ") + loc )
    if  node.left.has_value {
      fmt.Println( indent + "  left:" )
      ASTPrinter_static_printNode(node.left.value.(*JSNode), depth + int64(2));
    }
    if  node.right.has_value {
      fmt.Println( indent + "  right:" )
      ASTPrinter_static_printNode(node.right.value.(*JSNode), depth + int64(2));
    }
    return
  }
  if  nodeType == "UnaryExpression" {
    fmt.Println( (((indent + "UnaryExpression: ") + node.name) + " ") + loc )
    if  node.left.has_value {
      ASTPrinter_static_printNode(node.left.value.(*JSNode), depth + int64(1));
    }
    return
  }
  if  nodeType == "UpdateExpression" {
    var prefix_1 string= "";
    if  node.prefix {
      prefix_1 = "prefix "; 
    } else {
      prefix_1 = "postfix "; 
    }
    fmt.Println( ((((indent + "UpdateExpression: ") + prefix_1) + node.name) + " ") + loc )
    if  node.left.has_value {
      ASTPrinter_static_printNode(node.left.value.(*JSNode), depth + int64(1));
    }
    return
  }
  if  nodeType == "NewExpression" {
    fmt.Println( (indent + "NewExpression ") + loc )
    fmt.Println( indent + "  callee:" )
    if  node.left.has_value {
      ASTPrinter_static_printNode(node.left.value.(*JSNode), depth + int64(2));
    }
    if  (int64(len(node.children))) > int64(0) {
      fmt.Println( indent + "  arguments:" )
      var ai int64 = 0;  
      for ; ai < int64(len(node.children)) ; ai++ {
        arg := node.children[ai];
        ASTPrinter_static_printNode(arg, depth + int64(2));
      }
    }
    return
  }
  if  nodeType == "ConditionalExpression" {
    fmt.Println( (indent + "ConditionalExpression ") + loc )
    fmt.Println( indent + "  test:" )
    if  node.left.has_value {
      ASTPrinter_static_printNode(node.left.value.(*JSNode), depth + int64(2));
    }
    fmt.Println( indent + "  consequent:" )
    if  node.body.has_value {
      ASTPrinter_static_printNode(node.body.value.(*JSNode), depth + int64(2));
    }
    fmt.Println( indent + "  alternate:" )
    if  node.right.has_value {
      ASTPrinter_static_printNode(node.right.value.(*JSNode), depth + int64(2));
    }
    return
  }
  if  nodeType == "CallExpression" {
    fmt.Println( (indent + "CallExpression ") + loc )
    if  node.left.has_value {
      fmt.Println( indent + "  callee:" )
      ASTPrinter_static_printNode(node.left.value.(*JSNode), depth + int64(2));
    }
    if  (int64(len(node.children))) > int64(0) {
      fmt.Println( indent + "  arguments:" )
      var ai_1 int64 = 0;  
      for ; ai_1 < int64(len(node.children)) ; ai_1++ {
        arg_1 := node.children[ai_1];
        ASTPrinter_static_printNode(arg_1, depth + int64(2));
      }
    }
    return
  }
  if  nodeType == "MemberExpression" {
    if  node.computed == false {
      fmt.Println( (((indent + "MemberExpression: .") + node.name) + " ") + loc )
    } else {
      fmt.Println( (indent + "MemberExpression: [computed] ") + loc )
    }
    if  node.left.has_value {
      ASTPrinter_static_printNode(node.left.value.(*JSNode), depth + int64(1));
    }
    if  node.right.has_value {
      ASTPrinter_static_printNode(node.right.value.(*JSNode), depth + int64(1));
    }
    return
  }
  if  nodeType == "Identifier" {
    fmt.Println( (((indent + "Identifier: ") + node.name) + " ") + loc )
    return
  }
  if  nodeType == "Literal" {
    fmt.Println( (((((indent + "Literal: ") + node.name) + " (") + node.raw) + ") ") + loc )
    return
  }
  if  nodeType == "ArrayExpression" {
    fmt.Println( (indent + "ArrayExpression ") + loc )
    var ei int64 = 0;  
    for ; ei < int64(len(node.children)) ; ei++ {
      elem := node.children[ei];
      ASTPrinter_static_printNode(elem, depth + int64(1));
    }
    return
  }
  if  nodeType == "ObjectExpression" {
    fmt.Println( (indent + "ObjectExpression ") + loc )
    var pi_2 int64 = 0;  
    for ; pi_2 < int64(len(node.children)) ; pi_2++ {
      prop := node.children[pi_2];
      ASTPrinter_static_printNode(prop, depth + int64(1));
    }
    return
  }
  if  nodeType == "Property" {
    var shorthand string= "";
    if  node.shorthand {
      shorthand = " (shorthand)"; 
    }
    fmt.Println( ((((indent + "Property: ") + node.name) + shorthand) + " ") + loc )
    if  node.left.has_value {
      ASTPrinter_static_printNode(node.left.value.(*JSNode), depth + int64(1));
    }
    return
  }
  if  nodeType == "ArrayPattern" {
    fmt.Println( (indent + "ArrayPattern ") + loc )
    var ei_1 int64 = 0;  
    for ; ei_1 < int64(len(node.children)) ; ei_1++ {
      elem_1 := node.children[ei_1];
      ASTPrinter_static_printNode(elem_1, depth + int64(1));
    }
    return
  }
  if  nodeType == "ObjectPattern" {
    fmt.Println( (indent + "ObjectPattern ") + loc )
    var pi_3 int64 = 0;  
    for ; pi_3 < int64(len(node.children)) ; pi_3++ {
      prop_1 := node.children[pi_3];
      ASTPrinter_static_printNode(prop_1, depth + int64(1));
    }
    return
  }
  if  nodeType == "SpreadElement" {
    fmt.Println( (indent + "SpreadElement ") + loc )
    if  node.left.has_value {
      ASTPrinter_static_printNode(node.left.value.(*JSNode), depth + int64(1));
    }
    return
  }
  if  nodeType == "RestElement" {
    fmt.Println( (((indent + "RestElement: ...") + node.name) + " ") + loc )
    return
  }
  if  nodeType == "WhileStatement" {
    fmt.Println( (indent + "WhileStatement ") + loc )
    fmt.Println( indent + "  test:" )
    if  node.test.has_value {
      ASTPrinter_static_printNode(node.test.value.(*JSNode), depth + int64(2));
    }
    fmt.Println( indent + "  body:" )
    if  node.body.has_value {
      ASTPrinter_static_printNode(node.body.value.(*JSNode), depth + int64(2));
    }
    return
  }
  if  nodeType == "DoWhileStatement" {
    fmt.Println( (indent + "DoWhileStatement ") + loc )
    fmt.Println( indent + "  body:" )
    if  node.body.has_value {
      ASTPrinter_static_printNode(node.body.value.(*JSNode), depth + int64(2));
    }
    fmt.Println( indent + "  test:" )
    if  node.test.has_value {
      ASTPrinter_static_printNode(node.test.value.(*JSNode), depth + int64(2));
    }
    return
  }
  if  nodeType == "ForStatement" {
    fmt.Println( (indent + "ForStatement ") + loc )
    if  node.left.has_value {
      fmt.Println( indent + "  init:" )
      ASTPrinter_static_printNode(node.left.value.(*JSNode), depth + int64(2));
    }
    if  node.test.has_value {
      fmt.Println( indent + "  test:" )
      ASTPrinter_static_printNode(node.test.value.(*JSNode), depth + int64(2));
    }
    if  node.right.has_value {
      fmt.Println( indent + "  update:" )
      ASTPrinter_static_printNode(node.right.value.(*JSNode), depth + int64(2));
    }
    fmt.Println( indent + "  body:" )
    if  node.body.has_value {
      ASTPrinter_static_printNode(node.body.value.(*JSNode), depth + int64(2));
    }
    return
  }
  if  nodeType == "ForOfStatement" {
    fmt.Println( (indent + "ForOfStatement ") + loc )
    if  node.left.has_value {
      fmt.Println( indent + "  left:" )
      ASTPrinter_static_printNode(node.left.value.(*JSNode), depth + int64(2));
    }
    if  node.right.has_value {
      fmt.Println( indent + "  right:" )
      ASTPrinter_static_printNode(node.right.value.(*JSNode), depth + int64(2));
    }
    fmt.Println( indent + "  body:" )
    if  node.body.has_value {
      ASTPrinter_static_printNode(node.body.value.(*JSNode), depth + int64(2));
    }
    return
  }
  if  nodeType == "ForInStatement" {
    fmt.Println( (indent + "ForInStatement ") + loc )
    if  node.left.has_value {
      fmt.Println( indent + "  left:" )
      ASTPrinter_static_printNode(node.left.value.(*JSNode), depth + int64(2));
    }
    if  node.right.has_value {
      fmt.Println( indent + "  right:" )
      ASTPrinter_static_printNode(node.right.value.(*JSNode), depth + int64(2));
    }
    fmt.Println( indent + "  body:" )
    if  node.body.has_value {
      ASTPrinter_static_printNode(node.body.value.(*JSNode), depth + int64(2));
    }
    return
  }
  if  nodeType == "SwitchStatement" {
    fmt.Println( (indent + "SwitchStatement ") + loc )
    fmt.Println( indent + "  discriminant:" )
    if  node.test.has_value {
      ASTPrinter_static_printNode(node.test.value.(*JSNode), depth + int64(2));
    }
    fmt.Println( indent + "  cases:" )
    var ci_3 int64 = 0;  
    for ; ci_3 < int64(len(node.children)) ; ci_3++ {
      caseNode := node.children[ci_3];
      ASTPrinter_static_printNode(caseNode, depth + int64(2));
    }
    return
  }
  if  nodeType == "SwitchCase" {
    if  node.name == "default" {
      fmt.Println( (indent + "SwitchCase: default ") + loc )
    } else {
      fmt.Println( (indent + "SwitchCase ") + loc )
      if  node.test.has_value {
        fmt.Println( indent + "  test:" )
        ASTPrinter_static_printNode(node.test.value.(*JSNode), depth + int64(2));
      }
    }
    if  (int64(len(node.children))) > int64(0) {
      fmt.Println( indent + "  consequent:" )
      var si int64 = 0;  
      for ; si < int64(len(node.children)) ; si++ {
        stmt := node.children[si];
        ASTPrinter_static_printNode(stmt, depth + int64(2));
      }
    }
    return
  }
  if  nodeType == "TryStatement" {
    fmt.Println( (indent + "TryStatement ") + loc )
    fmt.Println( indent + "  block:" )
    if  node.body.has_value {
      ASTPrinter_static_printNode(node.body.value.(*JSNode), depth + int64(2));
    }
    if  node.left.has_value {
      fmt.Println( indent + "  handler:" )
      ASTPrinter_static_printNode(node.left.value.(*JSNode), depth + int64(2));
    }
    if  node.right.has_value {
      fmt.Println( indent + "  finalizer:" )
      ASTPrinter_static_printNode(node.right.value.(*JSNode), depth + int64(2));
    }
    return
  }
  if  nodeType == "CatchClause" {
    fmt.Println( (((indent + "CatchClause: ") + node.name) + " ") + loc )
    if  node.body.has_value {
      ASTPrinter_static_printNode(node.body.value.(*JSNode), depth + int64(1));
    }
    return
  }
  if  nodeType == "ThrowStatement" {
    fmt.Println( (indent + "ThrowStatement ") + loc )
    if  node.left.has_value {
      ASTPrinter_static_printNode(node.left.value.(*JSNode), depth + int64(1));
    }
    return
  }
  if  nodeType == "BreakStatement" {
    if  (int64(len(node.name))) > int64(0) {
      fmt.Println( (((indent + "BreakStatement: ") + node.name) + " ") + loc )
    } else {
      fmt.Println( (indent + "BreakStatement ") + loc )
    }
    return
  }
  if  nodeType == "ContinueStatement" {
    if  (int64(len(node.name))) > int64(0) {
      fmt.Println( (((indent + "ContinueStatement: ") + node.name) + " ") + loc )
    } else {
      fmt.Println( (indent + "ContinueStatement ") + loc )
    }
    return
  }
  fmt.Println( ((indent + nodeType) + " ") + loc )
}
type JSPrinter struct { 
  indentLevel int64 `json:"indentLevel"` 
  indentStr string `json:"indentStr"` 
  output string `json:"output"` 
}

func CreateNew_JSPrinter() *JSPrinter {
  me := new(JSPrinter)
  me.indentLevel = int64(0)
  me.indentStr = "  "
  me.output = ""
  return me;
}
func (this *JSPrinter) getIndent () string {
  var result string= "";
  var i int64= int64(0);
  for i < this.indentLevel {
    result = result + this.indentStr; 
    i = i + int64(1); 
  }
  return result
}
func (this *JSPrinter) emit (text string) () {
  this.output = this.output + text; 
}
func (this *JSPrinter) emitLine (text string) () {
  this.output = ((this.output + this.getIndent()) + text) + "\n"; 
}
func (this *JSPrinter) emitIndent () () {
  this.output = this.output + this.getIndent(); 
}
func (this *JSPrinter) indent () () {
  this.indentLevel = this.indentLevel + int64(1); 
}
func (this *JSPrinter) dedent () () {
  this.indentLevel = this.indentLevel - int64(1); 
}
func (this *JSPrinter) printLeadingComments (node *JSNode) () {
  var numComments int64= int64(len(node.leadingComments));
  if  numComments == int64(0) {
    return
  }
  var i int64 = 0;  
  for ; i < int64(len(node.leadingComments)) ; i++ {
    comment := node.leadingComments[i];
    this.printComment(comment);
  }
}
func (this *JSPrinter) printComment (comment *JSNode) () {
  var commentType string= comment._type;
  var value string= comment.raw;
  if  commentType == "LineComment" {
    this.emitLine("//" + value);
    return
  }
  if  commentType == "BlockComment" {
    this.emitLine(("/*" + value) + "*/");
    return
  }
  if  commentType == "JSDocComment" {
    this.printJSDocComment(value);
    return
  }
}
func (this *JSPrinter) printJSDocComment (value string) () {
  this.emitLine(("/*" + value) + "*/");
}
func (this *JSPrinter) print (node *JSNode) string {
  this.output = ""; 
  this.indentLevel = int64(0); 
  this.printNode(node);
  return this.output
}
func (this *JSPrinter) printNode (node *JSNode) () {
  var nodeType string= node._type;
  if  nodeType == "Program" {
    this.printProgram(node);
    return
  }
  if  nodeType == "VariableDeclaration" {
    this.printVariableDeclaration(node);
    return
  }
  if  nodeType == "FunctionDeclaration" {
    this.printFunctionDeclaration(node);
    return
  }
  if  nodeType == "ClassDeclaration" {
    this.printClassDeclaration(node);
    return
  }
  if  nodeType == "ImportDeclaration" {
    this.printImportDeclaration(node);
    return
  }
  if  nodeType == "ExportNamedDeclaration" {
    this.printExportNamedDeclaration(node);
    return
  }
  if  nodeType == "ExportDefaultDeclaration" {
    this.printExportDefaultDeclaration(node);
    return
  }
  if  nodeType == "ExportAllDeclaration" {
    this.printExportAllDeclaration(node);
    return
  }
  if  nodeType == "BlockStatement" {
    this.printBlockStatement(node);
    return
  }
  if  nodeType == "ExpressionStatement" {
    this.printExpressionStatement(node);
    return
  }
  if  nodeType == "ReturnStatement" {
    this.printReturnStatement(node);
    return
  }
  if  nodeType == "IfStatement" {
    this.printIfStatement(node);
    return
  }
  if  nodeType == "WhileStatement" {
    this.printWhileStatement(node);
    return
  }
  if  nodeType == "DoWhileStatement" {
    this.printDoWhileStatement(node);
    return
  }
  if  nodeType == "ForStatement" {
    this.printForStatement(node);
    return
  }
  if  nodeType == "ForOfStatement" {
    this.printForOfStatement(node);
    return
  }
  if  nodeType == "ForInStatement" {
    this.printForInStatement(node);
    return
  }
  if  nodeType == "SwitchStatement" {
    this.printSwitchStatement(node);
    return
  }
  if  nodeType == "TryStatement" {
    this.printTryStatement(node);
    return
  }
  if  nodeType == "ThrowStatement" {
    this.printThrowStatement(node);
    return
  }
  if  nodeType == "BreakStatement" {
    this.emit("break");
    return
  }
  if  nodeType == "ContinueStatement" {
    this.emit("continue");
    return
  }
  if  nodeType == "EmptyStatement" {
    return
  }
  if  nodeType == "Identifier" {
    this.emit(node.name);
    return
  }
  if  nodeType == "Literal" {
    this.printLiteral(node);
    return
  }
  if  nodeType == "TemplateLiteral" {
    this.emit(("`" + node.name) + "`");
    return
  }
  if  nodeType == "RegexLiteral" {
    this.emit((("/" + node.name) + "/") + node.kind);
    return
  }
  if  nodeType == "ArrayExpression" {
    this.printArrayExpression(node);
    return
  }
  if  nodeType == "ObjectExpression" {
    this.printObjectExpression(node);
    return
  }
  if  nodeType == "BinaryExpression" {
    this.printBinaryExpression(node);
    return
  }
  if  nodeType == "LogicalExpression" {
    this.printBinaryExpression(node);
    return
  }
  if  nodeType == "UnaryExpression" {
    this.printUnaryExpression(node);
    return
  }
  if  nodeType == "UpdateExpression" {
    this.printUpdateExpression(node);
    return
  }
  if  nodeType == "AssignmentExpression" {
    this.printAssignmentExpression(node);
    return
  }
  if  nodeType == "ConditionalExpression" {
    this.printConditionalExpression(node);
    return
  }
  if  nodeType == "CallExpression" {
    this.printCallExpression(node);
    return
  }
  if  nodeType == "OptionalCallExpression" {
    this.printOptionalCallExpression(node);
    return
  }
  if  nodeType == "MemberExpression" {
    this.printMemberExpression(node);
    return
  }
  if  nodeType == "OptionalMemberExpression" {
    this.printOptionalMemberExpression(node);
    return
  }
  if  nodeType == "NewExpression" {
    this.printNewExpression(node);
    return
  }
  if  nodeType == "ArrowFunctionExpression" {
    this.printArrowFunction(node);
    return
  }
  if  nodeType == "FunctionExpression" {
    this.printFunctionExpression(node);
    return
  }
  if  nodeType == "YieldExpression" {
    this.printYieldExpression(node);
    return
  }
  if  nodeType == "AwaitExpression" {
    this.printAwaitExpression(node);
    return
  }
  if  nodeType == "SpreadElement" {
    this.printSpreadElement(node);
    return
  }
  if  nodeType == "RestElement" {
    this.emit("..." + node.name);
    return
  }
  if  nodeType == "ArrayPattern" {
    this.printArrayPattern(node);
    return
  }
  if  nodeType == "ObjectPattern" {
    this.printObjectPattern(node);
    return
  }
  this.emit(("/* unknown: " + nodeType) + " */");
}
func (this *JSPrinter) printProgram (node *JSNode) () {
  var idx int64 = 0;  
  for ; idx < int64(len(node.children)) ; idx++ {
    stmt := node.children[idx];
    this.printStatement(stmt);
  }
}
func (this *JSPrinter) printStatement (node *JSNode) () {
  this.printLeadingComments(node);
  var nodeType string= node._type;
  if  nodeType == "BlockStatement" {
    this.printBlockStatement(node);
    return
  }
  if  (((((((((nodeType == "FunctionDeclaration") || (nodeType == "ClassDeclaration")) || (nodeType == "IfStatement")) || (nodeType == "WhileStatement")) || (nodeType == "DoWhileStatement")) || (nodeType == "ForStatement")) || (nodeType == "ForOfStatement")) || (nodeType == "ForInStatement")) || (nodeType == "SwitchStatement")) || (nodeType == "TryStatement") {
    this.emitIndent();
    this.printNode(node);
    this.emit("\n");
    return
  }
  this.emitIndent();
  this.printNode(node);
  this.emit(";\n");
}
func (this *JSPrinter) printVariableDeclaration (node *JSNode) () {
  var kind string= node.name;
  if  (int64(len(kind))) == int64(0) {
    kind = "var"; 
  }
  this.emit(kind + " ");
  var first bool= true;
  var idx int64 = 0;  
  for ; idx < int64(len(node.children)) ; idx++ {
    decl := node.children[idx];
    if  first == false {
      this.emit(", ");
    }
    first = false; 
    this.printVariableDeclarator(decl);
  }
}
func (this *JSPrinter) printVariableDeclarator (node *JSNode) () {
  if  node.left.has_value {
    var left *JSNode= node.left.value.(*JSNode);
    this.printNode(left);
  }
  if  node.right.has_value {
    this.emit(" = ");
    this.printNode(node.right.value.(*JSNode));
  }
}
func (this *JSPrinter) printFunctionDeclaration (node *JSNode) () {
  var kind string= node.kind;
  if  kind == "async" {
    this.emit("async ");
  }
  if  kind == "async-generator" {
    this.emit("async ");
  }
  this.emit("function");
  if  (kind == "generator") || (kind == "async-generator") {
    this.emit("*");
  }
  this.emit((" " + node.name) + "(");
  this.printParams(node.children);
  this.emit(") ");
  if  node.body.has_value {
    this.printNode(node.body.value.(*JSNode));
  }
}
func (this *JSPrinter) printParams (params []*JSNode) () {
  var first bool= true;
  var idx int64 = 0;  
  for ; idx < int64(len(params)) ; idx++ {
    p := params[idx];
    if  first == false {
      this.emit(", ");
    }
    first = false; 
    this.printNode(p);
  }
}
func (this *JSPrinter) printClassDeclaration (node *JSNode) () {
  this.emit("class " + node.name);
  if  node.left.has_value {
    var superClass *JSNode= node.left.value.(*JSNode);
    this.emit(" extends " + superClass.name);
  }
  this.emit(" ");
  if  node.body.has_value {
    this.printClassBody(node.body.value.(*JSNode));
  }
}
func (this *JSPrinter) printClassBody (node *JSNode) () {
  this.emit("{\n");
  this.indent();
  var idx int64 = 0;  
  for ; idx < int64(len(node.children)) ; idx++ {
    method := node.children[idx];
    this.printMethodDefinition(method);
  }
  this.dedent();
  this.emitIndent();
  this.emit("}");
}
func (this *JSPrinter) printMethodDefinition (node *JSNode) () {
  this.emitIndent();
  if  node.kind == "static" {
    this.emit("static ");
  }
  this.emit(node.name + "(");
  if  node.body.has_value {
    var _func *JSNode= node.body.value.(*JSNode);
    this.printParams(_func.children);
  }
  this.emit(") ");
  if  node.body.has_value {
    var func_1 *JSNode= node.body.value.(*JSNode);
    if  func_1.body.has_value {
      this.printNode(func_1.body.value.(*JSNode));
    }
  }
  this.emit("\n");
}
func (this *JSPrinter) printBlockStatement (node *JSNode) () {
  this.emit("{\n");
  this.indent();
  var idx int64 = 0;  
  for ; idx < int64(len(node.children)) ; idx++ {
    stmt := node.children[idx];
    this.printStatement(stmt);
  }
  this.dedent();
  this.emitIndent();
  this.emit("}");
}
func (this *JSPrinter) printExpressionStatement (node *JSNode) () {
  if  node.left.has_value {
    this.printNode(node.left.value.(*JSNode));
  }
}
func (this *JSPrinter) printReturnStatement (node *JSNode) () {
  this.emit("return");
  if  node.left.has_value {
    this.emit(" ");
    this.printNode(node.left.value.(*JSNode));
  }
}
func (this *JSPrinter) printIfStatement (node *JSNode) () {
  this.emit("if (");
  if  node.test.has_value {
    this.printNode(node.test.value.(*JSNode));
  }
  this.emit(") ");
  if  node.body.has_value {
    this.printNode(node.body.value.(*JSNode));
  }
  if  node.alternate.has_value {
    this.emit(" else ");
    this.printNode(node.alternate.value.(*JSNode));
  }
}
func (this *JSPrinter) printWhileStatement (node *JSNode) () {
  this.emit("while (");
  if  node.test.has_value {
    this.printNode(node.test.value.(*JSNode));
  }
  this.emit(") ");
  if  node.body.has_value {
    this.printNode(node.body.value.(*JSNode));
  }
}
func (this *JSPrinter) printDoWhileStatement (node *JSNode) () {
  this.emit("do ");
  if  node.body.has_value {
    this.printNode(node.body.value.(*JSNode));
  }
  this.emit(" while (");
  if  node.test.has_value {
    this.printNode(node.test.value.(*JSNode));
  }
  this.emit(")");
}
func (this *JSPrinter) printForStatement (node *JSNode) () {
  this.emit("for (");
  if  node.left.has_value {
    this.printNode(node.left.value.(*JSNode));
  }
  this.emit("; ");
  if  node.test.has_value {
    this.printNode(node.test.value.(*JSNode));
  }
  this.emit("; ");
  if  node.right.has_value {
    this.printNode(node.right.value.(*JSNode));
  }
  this.emit(") ");
  if  node.body.has_value {
    this.printNode(node.body.value.(*JSNode));
  }
}
func (this *JSPrinter) printForOfStatement (node *JSNode) () {
  this.emit("for (");
  if  node.left.has_value {
    this.printNode(node.left.value.(*JSNode));
  }
  this.emit(" of ");
  if  node.right.has_value {
    this.printNode(node.right.value.(*JSNode));
  }
  this.emit(") ");
  if  node.body.has_value {
    this.printNode(node.body.value.(*JSNode));
  }
}
func (this *JSPrinter) printForInStatement (node *JSNode) () {
  this.emit("for (");
  if  node.left.has_value {
    this.printNode(node.left.value.(*JSNode));
  }
  this.emit(" in ");
  if  node.right.has_value {
    this.printNode(node.right.value.(*JSNode));
  }
  this.emit(") ");
  if  node.body.has_value {
    this.printNode(node.body.value.(*JSNode));
  }
}
func (this *JSPrinter) printSwitchStatement (node *JSNode) () {
  this.emit("switch (");
  if  node.test.has_value {
    this.printNode(node.test.value.(*JSNode));
  }
  this.emit(") {\n");
  this.indent();
  var idx int64 = 0;  
  for ; idx < int64(len(node.children)) ; idx++ {
    caseNode := node.children[idx];
    this.printSwitchCase(caseNode);
  }
  this.dedent();
  this.emitIndent();
  this.emit("}");
}
func (this *JSPrinter) printSwitchCase (node *JSNode) () {
  if  node.name == "default" {
    this.emitLine("default:");
  } else {
    this.emitIndent();
    this.emit("case ");
    if  node.test.has_value {
      this.printNode(node.test.value.(*JSNode));
    }
    this.emit(":\n");
  }
  this.indent();
  var idx int64 = 0;  
  for ; idx < int64(len(node.children)) ; idx++ {
    stmt := node.children[idx];
    this.printStatement(stmt);
  }
  this.dedent();
}
func (this *JSPrinter) printTryStatement (node *JSNode) () {
  this.emit("try ");
  if  node.body.has_value {
    this.printNode(node.body.value.(*JSNode));
  }
  if  node.left.has_value {
    var catchClause *JSNode= node.left.value.(*JSNode);
    this.emit((" catch (" + catchClause.name) + ") ");
    if  catchClause.body.has_value {
      this.printNode(catchClause.body.value.(*JSNode));
    }
  }
  if  node.right.has_value {
    this.emit(" finally ");
    this.printNode(node.right.value.(*JSNode));
  }
}
func (this *JSPrinter) printThrowStatement (node *JSNode) () {
  this.emit("throw ");
  if  node.left.has_value {
    this.printNode(node.left.value.(*JSNode));
  }
}
func (this *JSPrinter) printLiteral (node *JSNode) () {
  var litType string= node.kind;
  if  litType == "string" {
    this.emit(("'" + node.name) + "'");
  } else {
    this.emit(node.name);
  }
}
func (this *JSPrinter) printArrayExpression (node *JSNode) () {
  this.emit("[");
  var first bool= true;
  var idx int64 = 0;  
  for ; idx < int64(len(node.children)) ; idx++ {
    elem := node.children[idx];
    if  first == false {
      this.emit(", ");
    }
    first = false; 
    this.printNode(elem);
  }
  this.emit("]");
}
func (this *JSPrinter) printObjectExpression (node *JSNode) () {
  if  (int64(len(node.children))) == int64(0) {
    this.emit("{}");
    return
  }
  this.emit("{ ");
  var first bool= true;
  var idx int64 = 0;  
  for ; idx < int64(len(node.children)) ; idx++ {
    prop := node.children[idx];
    if  first == false {
      this.emit(", ");
    }
    first = false; 
    this.printProperty(prop);
  }
  this.emit(" }");
}
func (this *JSPrinter) printProperty (node *JSNode) () {
  var nodeType string= node._type;
  if  nodeType == "SpreadElement" {
    this.printSpreadElement(node);
    return
  }
  if  node.kind == "shorthand" {
    this.emit(node.name);
    return
  }
  if  node.kind == "computed" {
    this.emit("[");
    if  node.right.has_value {
      this.printNode(node.right.value.(*JSNode));
    }
    this.emit("]: ");
    if  node.left.has_value {
      this.printNode(node.left.value.(*JSNode));
    }
    return
  }
  this.emit(node.name + ": ");
  if  node.left.has_value {
    this.printNode(node.left.value.(*JSNode));
  }
}
func (this *JSPrinter) printBinaryExpression (node *JSNode) () {
  this.emit("(");
  if  node.left.has_value {
    this.printNode(node.left.value.(*JSNode));
  }
  this.emit((" " + node.name) + " ");
  if  node.right.has_value {
    this.printNode(node.right.value.(*JSNode));
  }
  this.emit(")");
}
func (this *JSPrinter) printUnaryExpression (node *JSNode) () {
  var op string= node.name;
  this.emit(op);
  if  op == "typeof" {
    this.emit(" ");
  }
  if  node.left.has_value {
    this.printNode(node.left.value.(*JSNode));
  }
}
func (this *JSPrinter) printUpdateExpression (node *JSNode) () {
  var op string= node.name;
  var isPrefix bool= node.kind == "prefix";
  if  isPrefix {
    this.emit(op);
  }
  if  node.left.has_value {
    this.printNode(node.left.value.(*JSNode));
  }
  if  isPrefix == false {
    this.emit(op);
  }
}
func (this *JSPrinter) printAssignmentExpression (node *JSNode) () {
  if  node.left.has_value {
    this.printNode(node.left.value.(*JSNode));
  }
  this.emit((" " + node.name) + " ");
  if  node.right.has_value {
    this.printNode(node.right.value.(*JSNode));
  }
}
func (this *JSPrinter) printConditionalExpression (node *JSNode) () {
  if  node.left.has_value {
    this.printNode(node.left.value.(*JSNode));
  }
  this.emit(" ? ");
  if  node.body.has_value {
    this.printNode(node.body.value.(*JSNode));
  }
  this.emit(" : ");
  if  node.right.has_value {
    this.printNode(node.right.value.(*JSNode));
  }
}
func (this *JSPrinter) printCallExpression (node *JSNode) () {
  if  node.left.has_value {
    this.printNode(node.left.value.(*JSNode));
  }
  this.emit("(");
  var first bool= true;
  var idx int64 = 0;  
  for ; idx < int64(len(node.children)) ; idx++ {
    arg := node.children[idx];
    if  first == false {
      this.emit(", ");
    }
    first = false; 
    this.printNode(arg);
  }
  this.emit(")");
}
func (this *JSPrinter) printMemberExpression (node *JSNode) () {
  if  node.left.has_value {
    this.printNode(node.left.value.(*JSNode));
  }
  var accessType string= node.kind;
  if  accessType == "bracket" {
    this.emit("[");
    if  node.right.has_value {
      this.printNode(node.right.value.(*JSNode));
    }
    this.emit("]");
  } else {
    this.emit("." + node.name);
  }
}
func (this *JSPrinter) printOptionalMemberExpression (node *JSNode) () {
  if  node.left.has_value {
    this.printNode(node.left.value.(*JSNode));
  }
  var accessType string= node.kind;
  if  accessType == "bracket" {
    this.emit("?.[");
    if  node.right.has_value {
      this.printNode(node.right.value.(*JSNode));
    }
    this.emit("]");
  } else {
    this.emit("?." + node.name);
  }
}
func (this *JSPrinter) printOptionalCallExpression (node *JSNode) () {
  if  node.left.has_value {
    this.printNode(node.left.value.(*JSNode));
  }
  this.emit("?.(");
  var first bool= true;
  var idx int64 = 0;  
  for ; idx < int64(len(node.children)) ; idx++ {
    arg := node.children[idx];
    if  first == false {
      this.emit(", ");
    }
    first = false; 
    this.printNode(arg);
  }
  this.emit(")");
}
func (this *JSPrinter) printImportDeclaration (node *JSNode) () {
  this.emit("import ");
  var numSpecifiers int64= int64(len(node.children));
  if  numSpecifiers == int64(0) {
    if  node.right.has_value {
      var source *JSNode= node.right.value.(*JSNode);
      this.emit(("\"" + source.raw) + "\"");
    }
    return
  }
  var hasDefault bool= false;
  var hasNamespace bool= false;
  var hasNamed bool= false;
  var idx int64 = 0;  
  for ; idx < int64(len(node.children)) ; idx++ {
    spec := node.children[idx];
    if  spec._type == "ImportDefaultSpecifier" {
      hasDefault = true; 
    }
    if  spec._type == "ImportNamespaceSpecifier" {
      hasNamespace = true; 
    }
    if  spec._type == "ImportSpecifier" {
      hasNamed = true; 
    }
  }
  var printedSomething bool= false;
  var idx_1 int64 = 0;  
  for ; idx_1 < int64(len(node.children)) ; idx_1++ {
    spec_1 := node.children[idx_1];
    if  spec_1._type == "ImportDefaultSpecifier" {
      this.emit(spec_1.name);
      printedSomething = true; 
    }
  }
  var idx_2 int64 = 0;  
  for ; idx_2 < int64(len(node.children)) ; idx_2++ {
    spec_2 := node.children[idx_2];
    if  spec_2._type == "ImportNamespaceSpecifier" {
      if  printedSomething {
        this.emit(", ");
      }
      this.emit("* as " + spec_2.name);
      printedSomething = true; 
    }
  }
  if  hasNamed {
    if  printedSomething {
      this.emit(", ");
    }
    this.emit("{ ");
    var firstNamed bool= true;
    var idx_3 int64 = 0;  
    for ; idx_3 < int64(len(node.children)) ; idx_3++ {
      spec_3 := node.children[idx_3];
      if  spec_3._type == "ImportSpecifier" {
        if  firstNamed == false {
          this.emit(", ");
        }
        firstNamed = false; 
        this.emit(spec_3.name);
        if  (int64(len(spec_3.kind))) > int64(0) {
          this.emit(" as " + spec_3.kind);
        }
      }
    }
    this.emit(" }");
  }
  this.emit(" from ");
  if  node.right.has_value {
    var source_1 *JSNode= node.right.value.(*JSNode);
    this.emit(("\"" + source_1.raw) + "\"");
  }
}
func (this *JSPrinter) printExportNamedDeclaration (node *JSNode) () {
  this.emit("export ");
  var numSpecifiers int64= int64(len(node.children));
  if  numSpecifiers > int64(0) {
    this.emit("{ ");
    var first bool= true;
    var idx int64 = 0;  
    for ; idx < int64(len(node.children)) ; idx++ {
      spec := node.children[idx];
      if  first == false {
        this.emit(", ");
      }
      first = false; 
      this.emit(spec.name);
      if  (int64(len(spec.kind))) > int64(0) {
        this.emit(" as " + spec.kind);
      }
    }
    this.emit(" }");
    if  node.right.has_value {
      var source *JSNode= node.right.value.(*JSNode);
      this.emit((" from \"" + source.raw) + "\"");
    }
    return
  }
  if  node.left.has_value {
    this.printNode(node.left.value.(*JSNode));
  }
}
func (this *JSPrinter) printExportDefaultDeclaration (node *JSNode) () {
  this.emit("export default ");
  if  node.left.has_value {
    this.printNode(node.left.value.(*JSNode));
  }
}
func (this *JSPrinter) printExportAllDeclaration (node *JSNode) () {
  this.emit("export *");
  if  (int64(len(node.name))) > int64(0) {
    this.emit(" as " + node.name);
  }
  this.emit(" from ");
  if  node.right.has_value {
    var source *JSNode= node.right.value.(*JSNode);
    this.emit(("\"" + source.raw) + "\"");
  }
}
func (this *JSPrinter) printNewExpression (node *JSNode) () {
  this.emit("new ");
  if  node.left.has_value {
    this.printNode(node.left.value.(*JSNode));
  }
  this.emit("(");
  var first bool= true;
  var idx int64 = 0;  
  for ; idx < int64(len(node.children)) ; idx++ {
    arg := node.children[idx];
    if  first == false {
      this.emit(", ");
    }
    first = false; 
    this.printNode(arg);
  }
  this.emit(")");
}
func (this *JSPrinter) printArrowFunction (node *JSNode) () {
  if  node.kind == "async" {
    this.emit("async ");
  }
  var paramCount int64= int64(len(node.children));
  if  paramCount == int64(1) {
    var firstParam *JSNode= node.children[int64(0)];
    if  firstParam._type == "Identifier" {
      this.emit(firstParam.name);
    } else {
      this.emit("(");
      this.printNode(firstParam);
      this.emit(")");
    }
  } else {
    this.emit("(");
    this.printParams(node.children);
    this.emit(")");
  }
  this.emit(" => ");
  if  node.body.has_value {
    var body *JSNode= node.body.value.(*JSNode);
    if  body._type == "BlockStatement" {
      this.printNode(body);
    } else {
      this.printNode(body);
    }
  }
}
func (this *JSPrinter) printFunctionExpression (node *JSNode) () {
  this.emit("function(");
  this.printParams(node.children);
  this.emit(") ");
  if  node.body.has_value {
    this.printNode(node.body.value.(*JSNode));
  }
}
func (this *JSPrinter) printYieldExpression (node *JSNode) () {
  this.emit("yield");
  if  node.name == "delegate" {
    this.emit("*");
  }
  if  node.left.has_value {
    this.emit(" ");
    this.printNode(node.left.value.(*JSNode));
  }
}
func (this *JSPrinter) printAwaitExpression (node *JSNode) () {
  this.emit("await ");
  if  node.left.has_value {
    this.printNode(node.left.value.(*JSNode));
  }
}
func (this *JSPrinter) printSpreadElement (node *JSNode) () {
  this.emit("...");
  if  node.left.has_value {
    this.printNode(node.left.value.(*JSNode));
  }
}
func (this *JSPrinter) printArrayPattern (node *JSNode) () {
  this.emit("[");
  var first bool= true;
  var idx int64 = 0;  
  for ; idx < int64(len(node.children)) ; idx++ {
    elem := node.children[idx];
    if  first == false {
      this.emit(", ");
    }
    first = false; 
    this.printNode(elem);
  }
  this.emit("]");
}
func (this *JSPrinter) printObjectPattern (node *JSNode) () {
  this.emit("{ ");
  var first bool= true;
  var idx int64 = 0;  
  for ; idx < int64(len(node.children)) ; idx++ {
    prop := node.children[idx];
    if  first == false {
      this.emit(", ");
    }
    first = false; 
    var propType string= prop._type;
    if  propType == "RestElement" {
      this.emit("..." + prop.name);
    } else {
      if  prop.kind == "shorthand" {
        this.emit(prop.name);
      } else {
        this.emit(prop.name + ": ");
        if  prop.left.has_value {
          this.printNode(prop.left.value.(*JSNode));
        }
      }
    }
  }
  this.emit(" }");
}
type JSParserMain struct { 
}

func CreateNew_JSParserMain() *JSParserMain {
  me := new(JSParserMain)
  return me;
}
func JSParserMain_static_showHelp() () {
  fmt.Println( "JavaScript ES6 Parser and Pretty Printer" )
  fmt.Println( "" )
  fmt.Println( "Usage: node js_parser.js [options]" )
  fmt.Println( "" )
  fmt.Println( "Options:" )
  fmt.Println( "  -h, --help     Show this help message" )
  fmt.Println( "  -d             Run built-in demo/test suite" )
  fmt.Println( "  -i <file>      Input JavaScript file to parse" )
  fmt.Println( "  -o <file>      Output file for pretty-printed JavaScript" )
  fmt.Println( "  --ast          Show AST instead of pretty-printed output (with -i)" )
  fmt.Println( "" )
  fmt.Println( "Examples:" )
  fmt.Println( "  node js_parser.js -d                        Run the demo" )
  fmt.Println( "  node js_parser.js -i script.js              Parse and show AST" )
  fmt.Println( "  node js_parser.js -i script.js -o out.js    Parse and pretty-print to file" )
  fmt.Println( "  node js_parser.js -i src/app.js -o dist/app.js" )
}
func JSParserMain_static_processFile(inputFile string, outputFile string) () {
  var codeOpt *GoNullable = new(GoNullable); 
  codeOpt = r_io_read_file(".", inputFile);
  if  !codeOpt.has_value  {
    fmt.Println( "Error: Could not read file: " + inputFile )
    return
  }
  var code string= codeOpt.value.(string);
  var lexer *Lexer= CreateNew_Lexer(code);
  var tokens []*Token= lexer.tokenize();
  var parser *SimpleParser= CreateNew_SimpleParser();
  parser.initParserWithSource(tokens, code);
  var program *JSNode= parser.parseProgram();
  if  parser.hasErrors() {
    fmt.Println( "=== Parse Errors ===" )
    var ei int64 = 0;  
    for ; ei < int64(len(parser.errors)) ; ei++ {
      err := parser.errors[ei];
      fmt.Println( err )
    }
    fmt.Println( "" )
  }
  var printer *JSPrinter= CreateNew_JSPrinter();
  var output string= (printer).print(program);
  r_write_text_file(".", outputFile, output)
  fmt.Println( (("Parsed " + inputFile) + " -> ") + outputFile )
  fmt.Println( (strings.Join([]string{ "  ",strconv.FormatInt((int64(len(program.children))), 10) }, "")) + " statements processed" )
}
func JSParserMain_static_parseFile(filename string) () {
  var codeOpt *GoNullable = new(GoNullable); 
  codeOpt = r_io_read_file(".", filename);
  if  !codeOpt.has_value  {
    fmt.Println( "Error: Could not read file: " + filename )
    return
  }
  var code string= codeOpt.value.(string);
  var lexer *Lexer= CreateNew_Lexer(code);
  var tokens []*Token= lexer.tokenize();
  var parser *SimpleParser= CreateNew_SimpleParser();
  parser.initParserWithSource(tokens, code);
  var program *JSNode= parser.parseProgram();
  if  parser.hasErrors() {
    fmt.Println( "=== Parse Errors ===" )
    var ei int64 = 0;  
    for ; ei < int64(len(parser.errors)) ; ei++ {
      err := parser.errors[ei];
      fmt.Println( err )
    }
    fmt.Println( "" )
  }
  fmt.Println( (strings.Join([]string{ "Program with ",strconv.FormatInt((int64(len(program.children))), 10) }, "")) + " statements:" )
  fmt.Println( "" )
  var idx int64 = 0;  
  for ; idx < int64(len(program.children)) ; idx++ {
    stmt := program.children[idx];
    ASTPrinter_static_printNode(stmt, int64(0));
  }
}
func JSParserMain_static_runDemo() () {
  var code string= "// Variable declarations\r\nvar y = 'hello';\r\n\r\n// Function declaration\r\nfunction add(a, b) {\r\n    return a + b;\r\n}\r\n\r\n// While loop\r\nvar i = 0;\r\nwhile (i < 10) {\r\n    i = i + 1;\r\n}\r\n\r\n// Do-while loop\r\ndo {\r\n    i = i - 1;\r\n} while (i > 0);\r\n\r\n// For loop\r\nfor (var j = 0; j < 5; j = j + 1) {\r\n    x = x + j;\r\n}\r\n\r\n// Switch statement\r\nswitch (x) {\r\n    case 1:\r\n        y = 'one';\r\n        break;\r\n    case 2:\r\n        y = 'two';\r\n        break;\r\n    default:\r\n        y = 'other';\r\n}\r\n\r\n// Try-catch-finally\r\ntry {\r\n    throw 'error';\r\n} catch (e) {\r\n    y = e;\r\n} finally {\r\n    x = 0;\r\n}\r\n\r\n// If-else\r\nif (x > 100) {\r\n    y = 'big';\r\n} else {\r\n    y = 'small';\r\n}\r\n\r\nvar arr = [1, 2, 3];\r\nvar obj = { name: 'test', value: 42 };\r\n\r\n// Unary expressions\r\nvar negNum = -42;\r\nvar posNum = +5;\r\nvar notTrue = !true;\r\nvar notFalse = !false;\r\nvar doubleNot = !!x;\r\nvar negExpr = -(a + b);\r\n\r\n// Logical expressions\r\nvar andResult = true && false;\r\nvar orResult = true || false;\r\nvar complexLogic = (a > 0) && (b < 10) || (c == 5);\r\nvar shortCircuit = x && y && z;\r\nvar orChain = a || b || c;\r\n\r\n// Ternary expressions\r\nvar ternResult = x > 0 ? 'positive' : 'non-positive';\r\nvar nestedTern = a > b ? (b > c ? 'a>b>c' : 'a>b, b<=c') : 'a<=b';\r\nvar ternInExpr = 1 + (x ? 2 : 3);\r\n\r\n// Operator precedence tests\r\nvar prec1 = 1 + 2 * 3;\r\nvar prec2 = (1 + 2) * 3;\r\nvar prec3 = 1 + 2 + 3 + 4;\r\nvar prec4 = 2 * 3 + 4 * 5;\r\nvar prec5 = 1 < 2 && 3 > 1;\r\nvar prec6 = !x && y || z;\r\nvar prec7 = a == b && c != d;\r\nvar prec8 = -x + y * -z;\r\n\r\n// Comparison operators\r\nvar cmp1 = a == b;\r\nvar cmp2 = a != b;\r\nvar cmp3 = a < b;\r\nvar cmp4 = a <= b;\r\nvar cmp5 = a > b;\r\nvar cmp6 = a >= b;\r\n\r\n// === ES6 Features ===\r\n\r\n// let and const\r\nlet count = 0;\r\nconst PI = 3.14159;\r\n\r\n// Arrow functions\r\nconst add = (a, b) => a + b;\r\nconst double = x => x * 2;\r\nconst greet = (name) => {\r\n    return 'Hello, ' + name;\r\n};\r\nconst multiLine = (a, b) => {\r\n    let sum = a + b;\r\n    return sum * 2;\r\n};\r\n\r\n// Template literals\r\nlet name = 'World';\r\nlet greeting = `Hello, ${name}!`;\r\nlet multi = `Line 1\r\nLine 2`;\r\n\r\n// Class syntax\r\nclass Animal {\r\n    constructor(name) {\r\n        this.name = name;\r\n    }\r\n    \r\n    speak() {\r\n        return this.name + ' makes a sound';\r\n    }\r\n    \r\n    static create(name) {\r\n        return new Animal(name);\r\n    }\r\n}\r\n\r\nclass Dog extends Animal {\r\n    constructor(name, breed) {\r\n        super(name);\r\n        this.breed = breed;\r\n    }\r\n    \r\n    speak() {\r\n        return this.name + ' barks';\r\n    }\r\n}\r\n\r\n// Generator functions\r\nfunction* numberGenerator() {\r\n    yield 1;\r\n    yield 2;\r\n    yield 3;\r\n}\r\n\r\nfunction* delegateGenerator() {\r\n    yield* numberGenerator();\r\n    yield 4;\r\n}\r\n\r\n// Async/await\r\nasync function fetchData() {\r\n    const response = await fetch('/api/data');\r\n    const data = await response.json();\r\n    return data;\r\n}\r\n\r\nasync function processItems(items) {\r\n    for (const item of items) {\r\n        await processItem(item);\r\n    }\r\n}\r\n\r\n// Async arrow functions\r\nconst asyncArrow = async (x) => {\r\n    const result = await doSomething(x);\r\n    return result * 2;\r\n};\r\n\r\nconst asyncFetch = async (url) => await fetch(url);\r\n\r\n// Async generator (ES2018)\r\nasync function* asyncGenerator() {\r\n    yield await fetch('/api/1');\r\n    yield await fetch('/api/2');\r\n}\r\n\r\n// === for...of and for...in loops ===\r\n\r\n// For-of loop\r\nfor (const item of items) {\r\n    console.log(item);\r\n}\r\n\r\n// For-in loop\r\nfor (const key in obj) {\r\n    console.log(key);\r\n}\r\n\r\n// For-of with array destructuring\r\nfor (const [index, value] of entries) {\r\n    console.log(index, value);\r\n}\r\n\r\n// === Spread operator ===\r\n\r\n// Array spread\r\nconst arr1 = [1, 2, 3];\r\nconst arr2 = [...arr1, 4, 5];\r\nconst combined = [...arr1, ...arr2];\r\n\r\n// Object spread\r\nconst obj1 = { a: 1, b: 2 };\r\nconst obj2 = { ...obj1, c: 3 };\r\nconst merged = { ...obj1, ...obj2 };\r\n\r\n// Spread in function call\r\nconsole.log(...args);\r\n\r\n// === Rest parameters ===\r\n\r\nfunction sum(...numbers) {\r\n    return numbers.reduce((a, b) => a + b);\r\n}\r\n\r\nfunction firstAndRest(first, ...rest) {\r\n    return { first, rest };\r\n}\r\n\r\n// === Destructuring ===\r\n\r\n// Array destructuring\r\nconst [x, y, z] = [1, 2, 3];\r\nconst [first, ...others] = arr1;\r\nlet [a, b] = [b, a];\r\n\r\n// Object destructuring\r\nconst { name, age } = person;\r\nconst { x: newX, y: newY } = point;\r\nconst { a: { b: nested } } = deep;\r\n\r\n// Destructuring with default (parsed as identifier for now)\r\nconst { foo, bar } = obj;\r\n\r\n// Nested destructuring\r\nconst { user: { name: userName } } = data;\r\nconst [{ id }, { id: id2 }] = items;\r\n\r\n// Shorthand properties\r\nconst shorthand = { x, y, z };\r\n";
  fmt.Println( "=== JavaScript ES6 Parser ===" )
  fmt.Println( "" )
  fmt.Println( "Input:" )
  fmt.Println( code )
  fmt.Println( "" )
  var lexer *Lexer= CreateNew_Lexer(code);
  var tokens []*Token= lexer.tokenize();
  fmt.Println( (strings.Join([]string{ "--- Tokens: ",strconv.FormatInt((int64(len(tokens))), 10) }, "")) + " ---" )
  fmt.Println( "" )
  var parser *SimpleParser= CreateNew_SimpleParser();
  parser.initParserWithSource(tokens, code);
  var program *JSNode= parser.parseProgram();
  if  parser.hasErrors() {
    fmt.Println( "=== Parse Errors ===" )
    var ei int64 = 0;  
    for ; ei < int64(len(parser.errors)) ; ei++ {
      err := parser.errors[ei];
      fmt.Println( err )
    }
    fmt.Println( "" )
  }
  fmt.Println( (strings.Join([]string{ "Program with ",strconv.FormatInt((int64(len(program.children))), 10) }, "")) + " statements:" )
  fmt.Println( "" )
  fmt.Println( "--- AST ---" )
  var idx int64 = 0;  
  for ; idx < int64(len(program.children)) ; idx++ {
    stmt := program.children[idx];
    ASTPrinter_static_printNode(stmt, int64(0));
  }
  fmt.Println( "" )
  fmt.Println( "--- Pretty Printed Output ---" )
  var printer *JSPrinter= CreateNew_JSPrinter();
  var output string= (printer).print(program);
  fmt.Println( output )
}
func main() {
  var argCnt int64= int64( len( os.Args) - 1 );
  if  argCnt == int64(0) {
    JSParserMain_static_showHelp();
    return
  }
  var inputFile string= "";
  var outputFile string= "";
  var runDefault bool= false;
  var showAst bool= false;
  var i int64= int64(0);
  for i < argCnt {
    var arg string= os.Args[i + 1];
    if  (arg == "--help") || (arg == "-h") {
      JSParserMain_static_showHelp();
      return
    }
    if  arg == "-d" {
      runDefault = true; 
      i = i + int64(1); 
    } else {
      if  arg == "-i" {
        i = i + int64(1); 
        if  i < argCnt {
          inputFile = os.Args[i + 1]; 
        }
        i = i + int64(1); 
      } else {
        if  arg == "-o" {
          i = i + int64(1); 
          if  i < argCnt {
            outputFile = os.Args[i + 1]; 
          }
          i = i + int64(1); 
        } else {
          if  arg == "--ast" {
            showAst = true; 
            i = i + int64(1); 
          } else {
            i = i + int64(1); 
          }
        }
      }
    }
  }
  if  runDefault {
    JSParserMain_static_runDemo();
    return
  }
  if  (int64(len(inputFile))) > int64(0) {
    if  (int64(len(outputFile))) > int64(0) {
      JSParserMain_static_processFile(inputFile, outputFile);
    } else {
      JSParserMain_static_parseFile(inputFile);
    }
    return
  }
  JSParserMain_static_showHelp();
}
