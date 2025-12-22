package main
import (
  "fmt"
  "strings"
  "strconv"
  "os"
  "path/filepath"
  "math"
)

type GoNullable struct {
  value interface{}
  has_value bool
}

func r_str_2_d64(s string) *GoNullable {
   res := new(GoNullable);
   if v, err := strconv.ParseFloat(s, 64); err == nil {
     res.has_value = true
     res.value = v
   } else {
     res.has_value = false
   }
   return res
}

func r_str_2_i64(s string) *GoNullable {
   res := new(GoNullable);
   if v, err := strconv.ParseInt(s, 10, 64); err == nil {
     res.has_value = true
     res.value = v
   } else {
     res.has_value = false
   }
   return res
}


func r_file_exists(pathName string, fileName string) bool {
    if _, err := os.Stat(pathName + "/" + fileName); os.IsNotExist(err) {
        return false
    }
    return true
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
type TSLexer struct { 
  source string `json:"source"` 
  pos int64 `json:"pos"` 
  line int64 `json:"line"` 
  col int64 `json:"col"` 
  __len int64 `json:"len"` 
}

func CreateNew_TSLexer(src string) *TSLexer {
  me := new(TSLexer)
  me.source = ""
  me.pos = int64(0)
  me.line = int64(1)
  me.col = int64(1)
  me.__len = int64(0)
  me.source = src; 
  me.__len = int64(len([]rune(src))); 
  return me;
}
func (this *TSLexer) peek () string {
  if  this.pos >= this.__len {
    return ""
  }
  return string([]rune(this.source)[this.pos])
}
func (this *TSLexer) peekAt (offset int64) string {
  var idx int64= this.pos + offset;
  if  idx >= this.__len {
    return ""
  }
  return string([]rune(this.source)[idx])
}
func (this *TSLexer) advance () string {
  if  this.pos >= this.__len {
    return ""
  }
  var ch string= string([]rune(this.source)[this.pos]);
  this.pos = this.pos + int64(1); 
  if  (ch == "\n") || (ch == "\r\n") {
    this.line = this.line + int64(1); 
    this.col = int64(1); 
  } else {
    this.col = this.col + int64(1); 
  }
  return ch
}
func (this *TSLexer) isDigit (ch string) bool {
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
func (this *TSLexer) isAlpha (ch string) bool {
  if  (int64(len([]rune(ch)))) == int64(0) {
    return false
  }
  var code int64= int64([]rune(this.source)[this.pos]);
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
  if  code > int64(127) {
    return true
  }
  return false
}
func (this *TSLexer) isAlphaNumCh (ch string) bool {
  if  this.isDigit(ch) {
    return true
  }
  if  ch == "_" {
    return true
  }
  if  ch == "$" {
    return true
  }
  if  (int64(len([]rune(ch)))) == int64(0) {
    return false
  }
  var code int64= int64([]rune(this.source)[this.pos]);
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
  if  code > int64(127) {
    return true
  }
  return false
}
func (this *TSLexer) isWhitespace (ch string) bool {
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
func (this *TSLexer) skipWhitespace () () {
  for this.pos < this.__len {
    var ch string= this.peek();
    if  this.isWhitespace(ch) {
      this.advance();
    } else {
      return
    }
  }
}
func (this *TSLexer) makeToken (tokType string, value string, startPos int64, startLine int64, startCol int64) *Token {
  var tok *Token= CreateNew_Token();
  tok.tokenType = tokType; 
  tok.value = value; 
  tok.start = startPos; 
  tok.end = this.pos; 
  tok.line = startLine; 
  tok.col = startCol; 
  return tok
}
func (this *TSLexer) readLineComment () *Token {
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
func (this *TSLexer) readBlockComment () *Token {
  var startPos int64= this.pos;
  var startLine int64= this.line;
  var startCol int64= this.col;
  this.advance();
  this.advance();
  var value string= "";
  for this.pos < this.__len {
    var ch string= this.peek();
    if  ch == "*" {
      if  this.peekAt(int64(1)) == "/" {
        this.advance();
        this.advance();
        return this.makeToken("BlockComment", value, startPos, startLine, startCol)
      }
    }
    value = value + this.advance(); 
  }
  return this.makeToken("BlockComment", value, startPos, startLine, startCol)
}
func (this *TSLexer) readString (quote string) *Token {
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
func (this *TSLexer) readTemplateLiteral () *Token {
  var startPos int64= this.pos;
  var startLine int64= this.line;
  var startCol int64= this.col;
  this.advance();
  var value string= "";
  for this.pos < this.__len {
    var ch string= this.peek();
    if  ch == "`" {
      this.advance();
      return this.makeToken("Template", value, startPos, startLine, startCol)
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
          if  esc == "`" {
            value = value + "`"; 
          } else {
            if  esc == "$" {
              value = value + "$"; 
            } else {
              value = value + esc; 
            }
          }
        }
      }
    } else {
      value = value + this.advance(); 
    }
  }
  return this.makeToken("Template", value, startPos, startLine, startCol)
}
func (this *TSLexer) readNumber () *Token {
  var startPos int64= this.pos;
  var startLine int64= this.line;
  var startCol int64= this.col;
  var value string= "";
  for this.pos < this.__len {
    var ch string= this.peek();
    if  this.isDigit(ch) {
      value = value + this.advance(); 
    } else {
      if  ch == "_" {
        value = value + this.advance(); 
      } else {
        if  ch == "." {
          value = value + this.advance(); 
        } else {
          if  ch == "n" {
            value = value + this.advance(); 
            return this.makeToken("BigInt", value, startPos, startLine, startCol)
          }
          return this.makeToken("Number", value, startPos, startLine, startCol)
        }
      }
    }
  }
  return this.makeToken("Number", value, startPos, startLine, startCol)
}
func (this *TSLexer) readIdentifier () *Token {
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
func (this *TSLexer) identType (value string) string {
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
  if  value == "delete" {
    return "Keyword"
  }
  if  value == "void" {
    return "Keyword"
  }
  if  value == "type" {
    return "TSKeyword"
  }
  if  value == "interface" {
    return "TSKeyword"
  }
  if  value == "namespace" {
    return "TSKeyword"
  }
  if  value == "module" {
    return "TSKeyword"
  }
  if  value == "declare" {
    return "TSKeyword"
  }
  if  value == "readonly" {
    return "TSKeyword"
  }
  if  value == "abstract" {
    return "TSKeyword"
  }
  if  value == "implements" {
    return "TSKeyword"
  }
  if  value == "private" {
    return "TSKeyword"
  }
  if  value == "protected" {
    return "TSKeyword"
  }
  if  value == "public" {
    return "TSKeyword"
  }
  if  value == "override" {
    return "TSKeyword"
  }
  if  value == "is" {
    return "TSKeyword"
  }
  if  value == "keyof" {
    return "TSKeyword"
  }
  if  value == "infer" {
    return "TSKeyword"
  }
  if  value == "asserts" {
    return "TSKeyword"
  }
  if  value == "satisfies" {
    return "TSKeyword"
  }
  if  value == "string" {
    return "TSType"
  }
  if  value == "number" {
    return "TSType"
  }
  if  value == "boolean" {
    return "TSType"
  }
  if  value == "any" {
    return "TSType"
  }
  if  value == "unknown" {
    return "TSType"
  }
  if  value == "never" {
    return "TSType"
  }
  if  value == "undefined" {
    return "TSType"
  }
  if  value == "object" {
    return "TSType"
  }
  if  value == "symbol" {
    return "TSType"
  }
  if  value == "bigint" {
    return "TSType"
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
func (this *TSLexer) nextToken () *Token {
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
      if  this.peek() == "=" {
        this.advance();
        return this.makeToken("Punctuator", "&&=", startPos, startLine, startCol)
      }
      return this.makeToken("Punctuator", "&&", startPos, startLine, startCol)
    }
  }
  if  ch == "|" {
    if  next_1 == "|" {
      this.advance();
      this.advance();
      if  this.peek() == "=" {
        this.advance();
        return this.makeToken("Punctuator", "||=", startPos, startLine, startCol)
      }
      return this.makeToken("Punctuator", "||", startPos, startLine, startCol)
    }
  }
  if  ch == "?" {
    if  next_1 == "?" {
      this.advance();
      this.advance();
      if  this.peek() == "=" {
        this.advance();
        return this.makeToken("Punctuator", "??=", startPos, startLine, startCol)
      }
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
  if  ch == "*" {
    if  next_1 == "*" {
      this.advance();
      this.advance();
      return this.makeToken("Punctuator", "**", startPos, startLine, startCol)
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
func (this *TSLexer) tokenize () []*Token {
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
type TSNode struct { 
  nodeType string `json:"nodeType"` 
  start int64 `json:"start"` 
  end int64 `json:"end"` 
  line int64 `json:"line"` 
  col int64 `json:"col"` 
  name string `json:"name"` 
  value string `json:"value"` 
  kind string `json:"kind"` 
  optional bool `json:"optional"` 
  readonly bool `json:"readonly"` 
  shorthand bool `json:"shorthand"` 
  computed bool `json:"computed"` 
  method bool `json:"method"` 
  generator bool `json:"generator"` 
  async bool `json:"async"` 
  delegate bool `json:"delegate"` 
  await bool `json:"await"` 
  children []*TSNode `json:"children"` 
  params []*TSNode `json:"params"` 
  decorators []*TSNode `json:"decorators"` 
  left *GoNullable `json:"left"` 
  right *GoNullable `json:"right"` 
  body *GoNullable `json:"body"` 
  init *GoNullable `json:"init"` 
  typeAnnotation *GoNullable `json:"typeAnnotation"` 
  test *GoNullable `json:"test"` 
  consequent *GoNullable `json:"consequent"` 
  alternate *GoNullable `json:"alternate"` 
}

func CreateNew_TSNode() *TSNode {
  me := new(TSNode)
  me.nodeType = ""
  me.start = int64(0)
  me.end = int64(0)
  me.line = int64(0)
  me.col = int64(0)
  me.name = ""
  me.value = ""
  me.kind = ""
  me.optional = false
  me.readonly = false
  me.shorthand = false
  me.computed = false
  me.method = false
  me.generator = false
  me.async = false
  me.delegate = false
  me.await = false
  me.children = make([]*TSNode,0)
  me.params = make([]*TSNode,0)
  me.decorators = make([]*TSNode,0)
  me.left = new(GoNullable);
  me.right = new(GoNullable);
  me.body = new(GoNullable);
  me.init = new(GoNullable);
  me.typeAnnotation = new(GoNullable);
  me.test = new(GoNullable);
  me.consequent = new(GoNullable);
  me.alternate = new(GoNullable);
  return me;
}
type TSParserSimple struct { 
  tokens []*Token `json:"tokens"` 
  pos int64 `json:"pos"` 
  currentToken *GoNullable `json:"currentToken"` 
  quiet bool `json:"quiet"` 
  tsxMode bool `json:"tsxMode"` 
}

func CreateNew_TSParserSimple() *TSParserSimple {
  me := new(TSParserSimple)
  me.tokens = make([]*Token,0)
  me.pos = int64(0)
  me.quiet = false
  me.tsxMode = false
  me.currentToken = new(GoNullable);
  return me;
}
func (this *TSParserSimple) initParser (toks []*Token) () {
  this.tokens = toks; 
  this.pos = int64(0); 
  this.quiet = false; 
  if  (int64(len(toks))) > int64(0) {
    this.currentToken.value = toks[int64(0)];
    this.currentToken.has_value = true; /* detected as non-optional */
  }
}
func (this *TSParserSimple) setQuiet (q bool) () {
  this.quiet = q; 
}
func (this *TSParserSimple) setTsxMode (enabled bool) () {
  this.tsxMode = enabled; 
}
func (this *TSParserSimple) peek () *Token {
  return this.currentToken.value.(*Token)
}
func (this *TSParserSimple) peekType () string {
  if  !this.currentToken.has_value  {
    return "EOF"
  }
  var tok *Token= this.currentToken.value.(*Token);
  return tok.tokenType
}
func (this *TSParserSimple) peekValue () string {
  if  !this.currentToken.has_value  {
    return ""
  }
  var tok *Token= this.currentToken.value.(*Token);
  return tok.value
}
func (this *TSParserSimple) advance () () {
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
func (this *TSParserSimple) expect (expectedType string) *Token {
  var tok *Token= this.peek();
  if  tok.tokenType != expectedType {
    if  this.quiet == false {
      fmt.Println( (("Parse error: expected " + expectedType) + " but got ") + tok.tokenType )
    }
  }
  this.advance();
  return tok
}
func (this *TSParserSimple) expectValue (expectedValue string) *Token {
  var tok *Token= this.peek();
  if  tok.value != expectedValue {
    if  this.quiet == false {
      fmt.Println( ((("Parse error: expected '" + expectedValue) + "' but got '") + tok.value) + "'" )
    }
  }
  this.advance();
  return tok
}
func (this *TSParserSimple) isAtEnd () bool {
  var t string= this.peekType();
  return t == "EOF"
}
func (this *TSParserSimple) matchType (tokenType string) bool {
  var t string= this.peekType();
  return t == tokenType
}
func (this *TSParserSimple) matchValue (value string) bool {
  var v string= this.peekValue();
  return v == value
}
func (this *TSParserSimple) parseProgram () *TSNode {
  var prog *TSNode= CreateNew_TSNode();
  prog.nodeType = "Program"; 
  for this.isAtEnd() == false {
    var stmt *TSNode= this.parseStatement();
    prog.children = append(prog.children,stmt); 
  }
  return prog
}
func (this *TSParserSimple) parseStatement () *TSNode {
  var tokVal string= this.peekValue();
  if  tokVal == "@" {
    var decorators []*TSNode = make([]*TSNode, 0);
    for this.matchValue("@") {
      var dec *TSNode= this.parseDecorator();
      decorators = append(decorators,dec); 
    }
    var decorated *TSNode= this.parseStatement();
    decorated.decorators = decorators; 
    return decorated
  }
  if  tokVal == "declare" {
    return this.parseDeclare()
  }
  if  tokVal == "import" {
    return this.parseImport()
  }
  if  tokVal == "export" {
    return this.parseExport()
  }
  if  tokVal == "interface" {
    return this.parseInterface()
  }
  if  tokVal == "type" {
    return this.parseTypeAlias()
  }
  if  tokVal == "class" {
    return this.parseClass()
  }
  if  tokVal == "abstract" {
    var nextVal string= this.peekNextValue();
    if  nextVal == "class" {
      return this.parseClass()
    }
  }
  if  tokVal == "enum" {
    return this.parseEnum()
  }
  if  tokVal == "namespace" {
    return this.parseNamespace()
  }
  if  tokVal == "const" {
    var nextVal_1 string= this.peekNextValue();
    if  nextVal_1 == "enum" {
      return this.parseEnum()
    }
  }
  if  (tokVal == "let") || (tokVal == "const") {
    return this.parseVarDecl()
  }
  if  tokVal == "function" {
    return this.parseFuncDecl(false)
  }
  if  tokVal == "async" {
    var nextVal_2 string= this.peekNextValue();
    if  nextVal_2 == "function" {
      this.advance();
      return this.parseFuncDecl(true)
    }
  }
  if  tokVal == "return" {
    return this.parseReturn()
  }
  if  tokVal == "throw" {
    return this.parseThrow()
  }
  if  tokVal == "if" {
    return this.parseIfStatement()
  }
  if  tokVal == "while" {
    return this.parseWhileStatement()
  }
  if  tokVal == "do" {
    return this.parseDoWhileStatement()
  }
  if  tokVal == "for" {
    return this.parseForStatement()
  }
  if  tokVal == "switch" {
    return this.parseSwitchStatement()
  }
  if  tokVal == "try" {
    return this.parseTryStatement()
  }
  if  tokVal == "{" {
    return this.parseBlock()
  }
  if  tokVal == ";" {
    this.advance();
    var empty *TSNode= CreateNew_TSNode();
    empty.nodeType = "EmptyStatement"; 
    return empty
  }
  var tokType string= this.peekType();
  if  tokType == "Identifier" {
    var nextVal_3 string= this.peekNextValue();
    if  nextVal_3 == ":" {
      return this.parseLabeledStatement()
    }
  }
  return this.parseExprStmt()
}
func (this *TSParserSimple) parseLabeledStatement () *TSNode {
  var node *TSNode= CreateNew_TSNode();
  node.nodeType = "LabeledStatement"; 
  var startTok *Token= this.peek();
  node.start = startTok.start; 
  node.line = startTok.line; 
  node.col = startTok.col; 
  var labelTok *Token= this.expect("Identifier");
  node.name = labelTok.value; 
  this.expectValue(":");
  var body *TSNode= this.parseStatement();
  node.body.value = body;
  node.body.has_value = true; /* detected as non-optional */
  return node
}
func (this *TSParserSimple) peekNextValue () string {
  var nextPos int64= this.pos + int64(1);
  if  nextPos < (int64(len(this.tokens))) {
    var nextTok *Token= this.tokens[nextPos];
    return nextTok.value
  }
  return ""
}
func (this *TSParserSimple) parseReturn () *TSNode {
  var node *TSNode= CreateNew_TSNode();
  node.nodeType = "ReturnStatement"; 
  var startTok *Token= this.peek();
  node.start = startTok.start; 
  node.line = startTok.line; 
  node.col = startTok.col; 
  this.expectValue("return");
  var v string= this.peekValue();
  if  (v != ";") && (this.isAtEnd() == false) {
    var arg *TSNode= this.parseExpr();
    node.left.value = arg;
    node.left.has_value = true; /* detected as non-optional */
  }
  if  this.matchValue(";") {
    this.advance();
  }
  return node
}
func (this *TSParserSimple) parseImport () *TSNode {
  var node *TSNode= CreateNew_TSNode();
  node.nodeType = "ImportDeclaration"; 
  var startTok *Token= this.peek();
  node.start = startTok.start; 
  node.line = startTok.line; 
  node.col = startTok.col; 
  this.expectValue("import");
  if  this.matchValue("type") {
    this.advance();
    node.kind = "type"; 
  }
  var v string= this.peekValue();
  if  v == "{" {
    this.advance();
    var specifiers []*TSNode = make([]*TSNode, 0);
    for (this.matchValue("}") == false) && (this.isAtEnd() == false) {
      var spec *TSNode= CreateNew_TSNode();
      spec.nodeType = "ImportSpecifier"; 
      if  this.matchValue("type") {
        this.advance();
        spec.kind = "type"; 
      }
      var importedName *Token= this.expect("Identifier");
      spec.name = importedName.value; 
      if  this.matchValue("as") {
        this.advance();
        var localName *Token= this.expect("Identifier");
        spec.value = localName.value; 
      } else {
        spec.value = importedName.value; 
      }
      specifiers = append(specifiers,spec); 
      if  this.matchValue(",") {
        this.advance();
      }
    }
    this.expectValue("}");
    node.children = specifiers; 
  }
  if  v == "*" {
    this.advance();
    this.expectValue("as");
    var namespaceName *Token= this.expect("Identifier");
    var nsSpec *TSNode= CreateNew_TSNode();
    nsSpec.nodeType = "ImportNamespaceSpecifier"; 
    nsSpec.name = namespaceName.value; 
    node.children = append(node.children,nsSpec); 
  }
  if  this.matchType("Identifier") {
    var defaultSpec *TSNode= CreateNew_TSNode();
    defaultSpec.nodeType = "ImportDefaultSpecifier"; 
    var defaultName *Token= this.expect("Identifier");
    defaultSpec.name = defaultName.value; 
    node.children = append(node.children,defaultSpec); 
    if  this.matchValue(",") {
      this.advance();
      if  this.matchValue("{") {
        this.advance();
        for (this.matchValue("}") == false) && (this.isAtEnd() == false) {
          var spec_1 *TSNode= CreateNew_TSNode();
          spec_1.nodeType = "ImportSpecifier"; 
          var importedName_1 *Token= this.expect("Identifier");
          spec_1.name = importedName_1.value; 
          if  this.matchValue("as") {
            this.advance();
            var localName_1 *Token= this.expect("Identifier");
            spec_1.value = localName_1.value; 
          } else {
            spec_1.value = importedName_1.value; 
          }
          node.children = append(node.children,spec_1); 
          if  this.matchValue(",") {
            this.advance();
          }
        }
        this.expectValue("}");
      }
    }
  }
  if  this.matchValue("from") {
    this.advance();
    var sourceStr *Token= this.expect("String");
    var source *TSNode= CreateNew_TSNode();
    source.nodeType = "StringLiteral"; 
    source.value = sourceStr.value; 
    node.left.value = source;
    node.left.has_value = true; /* detected as non-optional */
  }
  if  this.matchValue(";") {
    this.advance();
  }
  return node
}
func (this *TSParserSimple) parseExport () *TSNode {
  var node *TSNode= CreateNew_TSNode();
  node.nodeType = "ExportNamedDeclaration"; 
  var startTok *Token= this.peek();
  node.start = startTok.start; 
  node.line = startTok.line; 
  node.col = startTok.col; 
  this.expectValue("export");
  if  this.matchValue("type") {
    var nextV string= this.peekNextValue();
    if  nextV == "{" {
      this.advance();
      node.kind = "type"; 
    }
  }
  var v string= this.peekValue();
  if  v == "default" {
    node.nodeType = "ExportDefaultDeclaration"; 
    this.advance();
    var nextVal string= this.peekValue();
    if  ((nextVal == "class") || (nextVal == "function")) || (nextVal == "interface") {
      var decl *TSNode= this.parseStatement();
      node.left.value = decl;
      node.left.has_value = true; /* detected as non-optional */
    } else {
      var expr *TSNode= this.parseExpr();
      node.left.value = expr;
      node.left.has_value = true; /* detected as non-optional */
    }
    if  this.matchValue(";") {
      this.advance();
    }
    return node
  }
  if  v == "{" {
    this.advance();
    var specifiers []*TSNode = make([]*TSNode, 0);
    for (this.matchValue("}") == false) && (this.isAtEnd() == false) {
      var spec *TSNode= CreateNew_TSNode();
      spec.nodeType = "ExportSpecifier"; 
      var localName *Token= this.expect("Identifier");
      spec.name = localName.value; 
      if  this.matchValue("as") {
        this.advance();
        var exportedName *Token= this.expect("Identifier");
        spec.value = exportedName.value; 
      } else {
        spec.value = localName.value; 
      }
      specifiers = append(specifiers,spec); 
      if  this.matchValue(",") {
        this.advance();
      }
    }
    this.expectValue("}");
    node.children = specifiers; 
    if  this.matchValue("from") {
      this.advance();
      var sourceStr *Token= this.expect("String");
      var source *TSNode= CreateNew_TSNode();
      source.nodeType = "StringLiteral"; 
      source.value = sourceStr.value; 
      node.left.value = source;
      node.left.has_value = true; /* detected as non-optional */
    }
    if  this.matchValue(";") {
      this.advance();
    }
    return node
  }
  if  v == "*" {
    node.nodeType = "ExportAllDeclaration"; 
    this.advance();
    if  this.matchValue("as") {
      this.advance();
      var exportName *Token= this.expect("Identifier");
      node.name = exportName.value; 
    }
    this.expectValue("from");
    var sourceStr_1 *Token= this.expect("String");
    var source_1 *TSNode= CreateNew_TSNode();
    source_1.nodeType = "StringLiteral"; 
    source_1.value = sourceStr_1.value; 
    node.left.value = source_1;
    node.left.has_value = true; /* detected as non-optional */
    if  this.matchValue(";") {
      this.advance();
    }
    return node
  }
  if  (((((((v == "function") || (v == "class")) || (v == "interface")) || (v == "type")) || (v == "const")) || (v == "let")) || (v == "enum")) || (v == "abstract") {
    var decl_1 *TSNode= this.parseStatement();
    node.left.value = decl_1;
    node.left.has_value = true; /* detected as non-optional */
    return node
  }
  if  v == "async" {
    var decl_2 *TSNode= this.parseStatement();
    node.left.value = decl_2;
    node.left.has_value = true; /* detected as non-optional */
    return node
  }
  return node
}
func (this *TSParserSimple) parseInterface () *TSNode {
  var node *TSNode= CreateNew_TSNode();
  node.nodeType = "TSInterfaceDeclaration"; 
  var startTok *Token= this.peek();
  node.start = startTok.start; 
  node.line = startTok.line; 
  node.col = startTok.col; 
  this.expectValue("interface");
  var nameTok *Token= this.expect("Identifier");
  node.name = nameTok.value; 
  if  this.matchValue("<") {
    var typeParams []*TSNode= this.parseTypeParams();
    node.params = typeParams; 
  }
  if  this.matchValue("extends") {
    this.advance();
    var extendsList []*TSNode = make([]*TSNode, 0);
    var extendsType *TSNode= this.parseType();
    extendsList = append(extendsList,extendsType); 
    for this.matchValue(",") {
      this.advance();
      var nextType *TSNode= this.parseType();
      extendsList = append(extendsList,nextType); 
    }
    var i int64 = 0;  
    for ; i < int64(len(extendsList)) ; i++ {
      ext := extendsList[i];
      var wrapper *TSNode= CreateNew_TSNode();
      wrapper.nodeType = "TSExpressionWithTypeArguments"; 
      wrapper.left.value = ext;
      wrapper.left.has_value = true; /* detected as non-optional */
      node.children = append(node.children,wrapper); 
    }
  }
  var body *TSNode= this.parseInterfaceBody();
  node.body.value = body;
  node.body.has_value = true; /* detected as non-optional */
  return node
}
func (this *TSParserSimple) parseInterfaceBody () *TSNode {
  var body *TSNode= CreateNew_TSNode();
  body.nodeType = "TSInterfaceBody"; 
  var startTok *Token= this.peek();
  body.start = startTok.start; 
  body.line = startTok.line; 
  body.col = startTok.col; 
  this.expectValue("{");
  for (this.matchValue("}") == false) && (this.isAtEnd() == false) {
    var prop *TSNode= this.parsePropertySig();
    body.children = append(body.children,prop); 
    if  this.matchValue(";") || this.matchValue(",") {
      this.advance();
    }
  }
  this.expectValue("}");
  return body
}
func (this *TSParserSimple) parseTypeParams () []*TSNode {
  var params []*TSNode = make([]*TSNode, 0);
  this.expectValue("<");
  for (this.matchValue(">") == false) && (this.isAtEnd() == false) {
    if  (int64(len(params))) > int64(0) {
      this.expectValue(",");
    }
    var param *TSNode= CreateNew_TSNode();
    param.nodeType = "TSTypeParameter"; 
    var nameTok *Token= this.expect("Identifier");
    param.name = nameTok.value; 
    param.start = nameTok.start; 
    param.line = nameTok.line; 
    param.col = nameTok.col; 
    if  this.matchValue("extends") {
      this.advance();
      var constraint *TSNode= this.parseType();
      param.typeAnnotation.value = constraint;
      param.typeAnnotation.has_value = true; /* detected as non-optional */
    }
    if  this.matchValue("=") {
      this.advance();
      var defaultType *TSNode= this.parseType();
      param.init.value = defaultType;
      param.init.has_value = true; /* detected as non-optional */
    }
    params = append(params,param); 
  }
  this.expectValue(">");
  return params
}
func (this *TSParserSimple) parsePropertySig () *TSNode {
  var startTok *Token= this.peek();
  var startPos int64= startTok.start;
  var startLine int64= startTok.line;
  var startCol int64= startTok.col;
  var isReadonly bool= false;
  if  this.matchValue("readonly") {
    isReadonly = true; 
    this.advance();
  }
  if  this.matchValue("[") {
    this.advance();
    var paramTok *Token= this.expect("Identifier");
    return this.parseIndexSignatureRest(isReadonly, paramTok, startPos, startLine, startCol)
  }
  if  this.matchValue("(") {
    return this.parseCallSignature(startPos, startLine, startCol)
  }
  if  this.matchValue("new") {
    return this.parseConstructSignature(startPos, startLine, startCol)
  }
  var prop *TSNode= CreateNew_TSNode();
  prop.nodeType = "TSPropertySignature"; 
  prop.start = startPos; 
  prop.line = startLine; 
  prop.col = startCol; 
  prop.readonly = isReadonly; 
  var nameTok *Token= this.expect("Identifier");
  prop.name = nameTok.value; 
  if  this.matchValue("?") {
    prop.optional = true; 
    this.advance();
  }
  if  this.matchValue(":") {
    var typeAnnot *TSNode= this.parseTypeAnnotation();
    prop.typeAnnotation.value = typeAnnot;
    prop.typeAnnotation.has_value = true; /* detected as non-optional */
  }
  return prop
}
func (this *TSParserSimple) parseCallSignature (startPos int64, startLine int64, startCol int64) *TSNode {
  var sig *TSNode= CreateNew_TSNode();
  sig.nodeType = "TSCallSignatureDeclaration"; 
  sig.start = startPos; 
  sig.line = startLine; 
  sig.col = startCol; 
  if  this.matchValue("<") {
    var typeParams []*TSNode= this.parseTypeParams();
    sig.params = typeParams; 
  }
  this.expectValue("(");
  for (this.matchValue(")") == false) && (this.isAtEnd() == false) {
    if  (int64(len(sig.children))) > int64(0) {
      this.expectValue(",");
    }
    var param *TSNode= this.parseParam();
    sig.children = append(sig.children,param); 
  }
  this.expectValue(")");
  if  this.matchValue(":") {
    var typeAnnot *TSNode= this.parseTypeAnnotation();
    sig.typeAnnotation.value = typeAnnot;
    sig.typeAnnotation.has_value = true; /* detected as non-optional */
  }
  return sig
}
func (this *TSParserSimple) parseConstructSignature (startPos int64, startLine int64, startCol int64) *TSNode {
  var sig *TSNode= CreateNew_TSNode();
  sig.nodeType = "TSConstructSignatureDeclaration"; 
  sig.start = startPos; 
  sig.line = startLine; 
  sig.col = startCol; 
  this.expectValue("new");
  if  this.matchValue("<") {
    var typeParams []*TSNode= this.parseTypeParams();
    sig.params = typeParams; 
  }
  this.expectValue("(");
  for (this.matchValue(")") == false) && (this.isAtEnd() == false) {
    if  (int64(len(sig.children))) > int64(0) {
      this.expectValue(",");
    }
    var param *TSNode= this.parseParam();
    sig.children = append(sig.children,param); 
  }
  this.expectValue(")");
  if  this.matchValue(":") {
    var typeAnnot *TSNode= this.parseTypeAnnotation();
    sig.typeAnnotation.value = typeAnnot;
    sig.typeAnnotation.has_value = true; /* detected as non-optional */
  }
  return sig
}
func (this *TSParserSimple) parseTypeAlias () *TSNode {
  var node *TSNode= CreateNew_TSNode();
  node.nodeType = "TSTypeAliasDeclaration"; 
  var startTok *Token= this.peek();
  node.start = startTok.start; 
  node.line = startTok.line; 
  node.col = startTok.col; 
  this.expectValue("type");
  var nameTok *Token= this.expect("Identifier");
  node.name = nameTok.value; 
  if  this.matchValue("<") {
    var typeParams []*TSNode= this.parseTypeParams();
    node.params = typeParams; 
  }
  this.expectValue("=");
  var typeExpr *TSNode= this.parseType();
  node.typeAnnotation.value = typeExpr;
  node.typeAnnotation.has_value = true; /* detected as non-optional */
  if  this.matchValue(";") {
    this.advance();
  }
  return node
}
func (this *TSParserSimple) parseDecorator () *TSNode {
  var node *TSNode= CreateNew_TSNode();
  node.nodeType = "Decorator"; 
  var startTok *Token= this.peek();
  node.start = startTok.start; 
  node.line = startTok.line; 
  node.col = startTok.col; 
  this.expectValue("@");
  var expr *TSNode= this.parsePostfix();
  node.left.value = expr;
  node.left.has_value = true; /* detected as non-optional */
  return node
}
func (this *TSParserSimple) parseClass () *TSNode {
  var node *TSNode= CreateNew_TSNode();
  node.nodeType = "ClassDeclaration"; 
  var startTok *Token= this.peek();
  node.start = startTok.start; 
  node.line = startTok.line; 
  node.col = startTok.col; 
  if  this.matchValue("abstract") {
    node.kind = "abstract"; 
    this.advance();
  }
  this.expectValue("class");
  var nameTok *Token= this.expect("Identifier");
  node.name = nameTok.value; 
  if  this.matchValue("<") {
    var typeParams []*TSNode= this.parseTypeParams();
    node.params = typeParams; 
  }
  if  this.matchValue("extends") {
    this.advance();
    var superClass *TSNode= this.parseType();
    var extendsNode *TSNode= CreateNew_TSNode();
    extendsNode.nodeType = "TSExpressionWithTypeArguments"; 
    extendsNode.left.value = superClass;
    extendsNode.left.has_value = true; /* detected as non-optional */
    node.left.value = extendsNode;
    node.left.has_value = true; /* detected as non-optional */
  }
  if  this.matchValue("implements") {
    this.advance();
    var impl *TSNode= this.parseType();
    var implNode *TSNode= CreateNew_TSNode();
    implNode.nodeType = "TSExpressionWithTypeArguments"; 
    implNode.left.value = impl;
    implNode.left.has_value = true; /* detected as non-optional */
    node.children = append(node.children,implNode); 
    for this.matchValue(",") {
      this.advance();
      var nextImpl *TSNode= this.parseType();
      var nextImplNode *TSNode= CreateNew_TSNode();
      nextImplNode.nodeType = "TSExpressionWithTypeArguments"; 
      nextImplNode.left.value = nextImpl;
      nextImplNode.left.has_value = true; /* detected as non-optional */
      node.children = append(node.children,nextImplNode); 
    }
  }
  var body *TSNode= this.parseClassBody();
  node.body.value = body;
  node.body.has_value = true; /* detected as non-optional */
  return node
}
func (this *TSParserSimple) parseClassBody () *TSNode {
  var body *TSNode= CreateNew_TSNode();
  body.nodeType = "ClassBody"; 
  var startTok *Token= this.peek();
  body.start = startTok.start; 
  body.line = startTok.line; 
  body.col = startTok.col; 
  this.expectValue("{");
  for (this.matchValue("}") == false) && (this.isAtEnd() == false) {
    var member *TSNode= this.parseClassMember();
    body.children = append(body.children,member); 
    if  this.matchValue(";") {
      this.advance();
    }
  }
  this.expectValue("}");
  return body
}
func (this *TSParserSimple) parseClassMember () *TSNode {
  var member *TSNode= CreateNew_TSNode();
  var startTok *Token= this.peek();
  member.start = startTok.start; 
  member.line = startTok.line; 
  member.col = startTok.col; 
  var decorators []*TSNode = make([]*TSNode, 0);
  for this.matchValue("@") {
    var dec *TSNode= this.parseDecorator();
    decorators = append(decorators,dec); 
  }
  if  (int64(len(decorators))) > int64(0) {
    member.decorators = decorators; 
  }
  var isStatic bool= false;
  var isAbstract bool= false;
  var isReadonly bool= false;
  var isAsync bool= false;
  var accessibility string= "";
  var keepParsing bool= true;
  for keepParsing {
    var tokVal string= this.peekValue();
    if  tokVal == "public" {
      accessibility = "public"; 
      this.advance();
    }
    if  tokVal == "private" {
      accessibility = "private"; 
      this.advance();
    }
    if  tokVal == "protected" {
      accessibility = "protected"; 
      this.advance();
    }
    if  tokVal == "static" {
      isStatic = true; 
      this.advance();
      if  this.matchValue("{") {
        member.nodeType = "StaticBlock"; 
        member.body.value = this.parseBlock();
        member.body.has_value = true; /* detected as non-optional */
        member.start = startTok.start; 
        member.line = startTok.line; 
        member.col = startTok.col; 
        return member
      }
    }
    if  tokVal == "abstract" {
      isAbstract = true; 
      this.advance();
    }
    if  tokVal == "readonly" {
      isReadonly = true; 
      this.advance();
    }
    if  tokVal == "async" {
      isAsync = true; 
      this.advance();
    }
    var newTokVal string= this.peekValue();
    if  ((((((newTokVal != "public") && (newTokVal != "private")) && (newTokVal != "protected")) && (newTokVal != "static")) && (newTokVal != "abstract")) && (newTokVal != "readonly")) && (newTokVal != "async") {
      keepParsing = false; 
    }
  }
  if  this.matchValue("constructor") {
    member.nodeType = "MethodDefinition"; 
    member.kind = "constructor"; 
    this.advance();
    this.expectValue("(");
    for (this.matchValue(")") == false) && (this.isAtEnd() == false) {
      if  (int64(len(member.params))) > int64(0) {
        this.expectValue(",");
      }
      var param *TSNode= this.parseConstructorParam();
      member.params = append(member.params,param); 
    }
    this.expectValue(")");
    if  this.matchValue("{") {
      var bodyNode *TSNode= this.parseBlock();
      member.body.value = bodyNode;
      member.body.has_value = true; /* detected as non-optional */
    }
    return member
  }
  var nameTok *Token= this.expect("Identifier");
  member.name = nameTok.value; 
  if  accessibility != "" {
    member.kind = accessibility; 
  }
  member.readonly = isReadonly; 
  if  this.matchValue("?") {
    member.optional = true; 
    this.advance();
  }
  if  this.matchValue("(") {
    member.nodeType = "MethodDefinition"; 
    if  isStatic {
      member.kind = "static"; 
    }
    if  isAbstract {
      member.kind = "abstract"; 
    }
    if  isAsync {
      member.async = true; 
    }
    this.expectValue("(");
    for (this.matchValue(")") == false) && (this.isAtEnd() == false) {
      if  (int64(len(member.params))) > int64(0) {
        this.expectValue(",");
      }
      var param_1 *TSNode= this.parseParam();
      member.params = append(member.params,param_1); 
    }
    this.expectValue(")");
    if  this.matchValue(":") {
      var returnType *TSNode= this.parseTypeAnnotation();
      member.typeAnnotation.value = returnType;
      member.typeAnnotation.has_value = true; /* detected as non-optional */
    }
    if  this.matchValue("{") {
      var bodyNode_1 *TSNode= this.parseBlock();
      member.body.value = bodyNode_1;
      member.body.has_value = true; /* detected as non-optional */
    }
  } else {
    member.nodeType = "PropertyDefinition"; 
    if  isStatic {
      member.kind = "static"; 
    }
    if  this.matchValue(":") {
      var typeAnnot *TSNode= this.parseTypeAnnotation();
      member.typeAnnotation.value = typeAnnot;
      member.typeAnnotation.has_value = true; /* detected as non-optional */
    }
    if  this.matchValue("=") {
      this.advance();
      var initExpr *TSNode= this.parseExpr();
      member.init.value = initExpr;
      member.init.has_value = true; /* detected as non-optional */
    }
  }
  return member
}
func (this *TSParserSimple) parseConstructorParam () *TSNode {
  var param *TSNode= CreateNew_TSNode();
  param.nodeType = "Parameter"; 
  var startTok *Token= this.peek();
  param.start = startTok.start; 
  param.line = startTok.line; 
  param.col = startTok.col; 
  var tokVal string= this.peekValue();
  if  (((tokVal == "public") || (tokVal == "private")) || (tokVal == "protected")) || (tokVal == "readonly") {
    param.kind = tokVal; 
    this.advance();
    var nextVal string= this.peekValue();
    if  nextVal == "readonly" {
      param.readonly = true; 
      this.advance();
    }
  }
  var nameTok *Token= this.expect("Identifier");
  param.name = nameTok.value; 
  if  this.matchValue("?") {
    param.optional = true; 
    this.advance();
  }
  if  this.matchValue(":") {
    var typeAnnot *TSNode= this.parseTypeAnnotation();
    param.typeAnnotation.value = typeAnnot;
    param.typeAnnotation.has_value = true; /* detected as non-optional */
  }
  if  this.matchValue("=") {
    this.advance();
    var defaultVal *TSNode= this.parseExpr();
    param.init.value = defaultVal;
    param.init.has_value = true; /* detected as non-optional */
  }
  return param
}
func (this *TSParserSimple) parseEnum () *TSNode {
  var node *TSNode= CreateNew_TSNode();
  node.nodeType = "TSEnumDeclaration"; 
  var startTok *Token= this.peek();
  node.start = startTok.start; 
  node.line = startTok.line; 
  node.col = startTok.col; 
  if  this.matchValue("const") {
    node.kind = "const"; 
    this.advance();
  }
  this.expectValue("enum");
  var nameTok *Token= this.expect("Identifier");
  node.name = nameTok.value; 
  this.expectValue("{");
  for (this.matchValue("}") == false) && (this.isAtEnd() == false) {
    var member *TSNode= CreateNew_TSNode();
    member.nodeType = "TSEnumMember"; 
    var memberTok *Token= this.expect("Identifier");
    member.name = memberTok.value; 
    member.start = memberTok.start; 
    member.line = memberTok.line; 
    member.col = memberTok.col; 
    if  this.matchValue("=") {
      this.advance();
      var initVal *TSNode= this.parseExpr();
      member.init.value = initVal;
      member.init.has_value = true; /* detected as non-optional */
    }
    node.children = append(node.children,member); 
    if  this.matchValue(",") {
      this.advance();
    }
  }
  this.expectValue("}");
  return node
}
func (this *TSParserSimple) parseNamespace () *TSNode {
  var node *TSNode= CreateNew_TSNode();
  node.nodeType = "TSModuleDeclaration"; 
  var startTok *Token= this.peek();
  node.start = startTok.start; 
  node.line = startTok.line; 
  node.col = startTok.col; 
  this.expectValue("namespace");
  var nameTok *Token= this.expect("Identifier");
  node.name = nameTok.value; 
  this.expectValue("{");
  var body *TSNode= CreateNew_TSNode();
  body.nodeType = "TSModuleBlock"; 
  for (this.matchValue("}") == false) && (this.isAtEnd() == false) {
    var stmt *TSNode= this.parseStatement();
    body.children = append(body.children,stmt); 
  }
  this.expectValue("}");
  node.body.value = body;
  node.body.has_value = true; /* detected as non-optional */
  return node
}
func (this *TSParserSimple) parseDeclare () *TSNode {
  var startTok *Token= this.peek();
  this.expectValue("declare");
  var nextVal string= this.peekValue();
  if  nextVal == "module" {
    var node *TSNode= CreateNew_TSNode();
    node.nodeType = "TSModuleDeclaration"; 
    node.start = startTok.start; 
    node.line = startTok.line; 
    node.col = startTok.col; 
    node.kind = "declare"; 
    this.advance();
    var nameTok *Token= this.peek();
    if  this.matchType("String") {
      this.advance();
      node.name = nameTok.value; 
    } else {
      this.advance();
      node.name = nameTok.value; 
    }
    this.expectValue("{");
    var body *TSNode= CreateNew_TSNode();
    body.nodeType = "TSModuleBlock"; 
    for (this.matchValue("}") == false) && (this.isAtEnd() == false) {
      var stmt *TSNode= this.parseStatement();
      body.children = append(body.children,stmt); 
    }
    this.expectValue("}");
    node.body.value = body;
    node.body.has_value = true; /* detected as non-optional */
    return node
  }
  var node_1 *TSNode= this.parseStatement();
  node_1.kind = "declare"; 
  return node_1
}
func (this *TSParserSimple) parseIfStatement () *TSNode {
  var node *TSNode= CreateNew_TSNode();
  node.nodeType = "IfStatement"; 
  var startTok *Token= this.peek();
  node.start = startTok.start; 
  node.line = startTok.line; 
  node.col = startTok.col; 
  this.expectValue("if");
  this.expectValue("(");
  var test *TSNode= this.parseExpr();
  node.left.value = test;
  node.left.has_value = true; /* detected as non-optional */
  this.expectValue(")");
  var consequent *TSNode= this.parseStatement();
  node.body.value = consequent;
  node.body.has_value = true; /* detected as non-optional */
  if  this.matchValue("else") {
    this.advance();
    var alternate *TSNode= this.parseStatement();
    node.right.value = alternate;
    node.right.has_value = true; /* detected as non-optional */
  }
  return node
}
func (this *TSParserSimple) parseWhileStatement () *TSNode {
  var node *TSNode= CreateNew_TSNode();
  node.nodeType = "WhileStatement"; 
  var startTok *Token= this.peek();
  node.start = startTok.start; 
  node.line = startTok.line; 
  node.col = startTok.col; 
  this.expectValue("while");
  this.expectValue("(");
  var test *TSNode= this.parseExpr();
  node.left.value = test;
  node.left.has_value = true; /* detected as non-optional */
  this.expectValue(")");
  var body *TSNode= this.parseStatement();
  node.body.value = body;
  node.body.has_value = true; /* detected as non-optional */
  return node
}
func (this *TSParserSimple) parseDoWhileStatement () *TSNode {
  var node *TSNode= CreateNew_TSNode();
  node.nodeType = "DoWhileStatement"; 
  var startTok *Token= this.peek();
  node.start = startTok.start; 
  node.line = startTok.line; 
  node.col = startTok.col; 
  this.expectValue("do");
  var body *TSNode= this.parseStatement();
  node.body.value = body;
  node.body.has_value = true; /* detected as non-optional */
  this.expectValue("while");
  this.expectValue("(");
  var test *TSNode= this.parseExpr();
  node.left.value = test;
  node.left.has_value = true; /* detected as non-optional */
  this.expectValue(")");
  if  this.matchValue(";") {
    this.advance();
  }
  return node
}
func (this *TSParserSimple) parseThrow () *TSNode {
  var node *TSNode= CreateNew_TSNode();
  node.nodeType = "ThrowStatement"; 
  var startTok *Token= this.peek();
  node.start = startTok.start; 
  node.line = startTok.line; 
  node.col = startTok.col; 
  this.expectValue("throw");
  var arg *TSNode= this.parseExpr();
  node.left.value = arg;
  node.left.has_value = true; /* detected as non-optional */
  if  this.matchValue(";") {
    this.advance();
  }
  return node
}
func (this *TSParserSimple) parseForStatement () *TSNode {
  var node *TSNode= CreateNew_TSNode();
  var startTok *Token= this.peek();
  node.start = startTok.start; 
  node.line = startTok.line; 
  node.col = startTok.col; 
  this.expectValue("for");
  var isAwait bool= false;
  if  this.matchValue("await") {
    this.advance();
    isAwait = true; 
  }
  this.expectValue("(");
  var tokVal string= this.peekValue();
  if  ((tokVal == "let") || (tokVal == "const")) || (tokVal == "var") {
    var kind string= tokVal;
    this.advance();
    var varName *Token= this.expect("Identifier");
    var nextVal string= this.peekValue();
    if  nextVal == "of" {
      node.nodeType = "ForOfStatement"; 
      node.await = isAwait; 
      this.advance();
      var left *TSNode= CreateNew_TSNode();
      left.nodeType = "VariableDeclaration"; 
      left.kind = kind; 
      var declarator *TSNode= CreateNew_TSNode();
      declarator.nodeType = "VariableDeclarator"; 
      declarator.name = varName.value; 
      left.children = append(left.children,declarator); 
      node.left.value = left;
      node.left.has_value = true; /* detected as non-optional */
      var right *TSNode= this.parseExpr();
      node.right.value = right;
      node.right.has_value = true; /* detected as non-optional */
      this.expectValue(")");
      var body *TSNode= this.parseStatement();
      node.body.value = body;
      node.body.has_value = true; /* detected as non-optional */
      return node
    }
    if  nextVal == "in" {
      node.nodeType = "ForInStatement"; 
      this.advance();
      var left_1 *TSNode= CreateNew_TSNode();
      left_1.nodeType = "VariableDeclaration"; 
      left_1.kind = kind; 
      var declarator_1 *TSNode= CreateNew_TSNode();
      declarator_1.nodeType = "VariableDeclarator"; 
      declarator_1.name = varName.value; 
      left_1.children = append(left_1.children,declarator_1); 
      node.left.value = left_1;
      node.left.has_value = true; /* detected as non-optional */
      var right_1 *TSNode= this.parseExpr();
      node.right.value = right_1;
      node.right.has_value = true; /* detected as non-optional */
      this.expectValue(")");
      var body_1 *TSNode= this.parseStatement();
      node.body.value = body_1;
      node.body.has_value = true; /* detected as non-optional */
      return node
    }
    node.nodeType = "ForStatement"; 
    var initDecl *TSNode= CreateNew_TSNode();
    initDecl.nodeType = "VariableDeclaration"; 
    initDecl.kind = kind; 
    var declarator_2 *TSNode= CreateNew_TSNode();
    declarator_2.nodeType = "VariableDeclarator"; 
    declarator_2.name = varName.value; 
    if  this.matchValue(":") {
      var typeAnnot *TSNode= this.parseTypeAnnotation();
      declarator_2.typeAnnotation.value = typeAnnot;
      declarator_2.typeAnnotation.has_value = true; /* detected as non-optional */
    }
    if  this.matchValue("=") {
      this.advance();
      var initVal *TSNode= this.parseExpr();
      declarator_2.init.value = initVal;
      declarator_2.init.has_value = true; /* detected as non-optional */
    }
    initDecl.children = append(initDecl.children,declarator_2); 
    node.init.value = initDecl;
    node.init.has_value = true; /* detected as non-optional */
  } else {
    node.nodeType = "ForStatement"; 
    if  this.matchValue(";") == false {
      var initExpr *TSNode= this.parseExpr();
      node.init.value = initExpr;
      node.init.has_value = true; /* detected as non-optional */
    }
  }
  this.expectValue(";");
  if  this.matchValue(";") == false {
    var test *TSNode= this.parseExpr();
    node.left.value = test;
    node.left.has_value = true; /* detected as non-optional */
  }
  this.expectValue(";");
  if  this.matchValue(")") == false {
    var update *TSNode= this.parseExpr();
    node.right.value = update;
    node.right.has_value = true; /* detected as non-optional */
  }
  this.expectValue(")");
  var body_2 *TSNode= this.parseStatement();
  node.body.value = body_2;
  node.body.has_value = true; /* detected as non-optional */
  return node
}
func (this *TSParserSimple) parseSwitchStatement () *TSNode {
  var node *TSNode= CreateNew_TSNode();
  node.nodeType = "SwitchStatement"; 
  var startTok *Token= this.peek();
  node.start = startTok.start; 
  node.line = startTok.line; 
  node.col = startTok.col; 
  this.expectValue("switch");
  this.expectValue("(");
  var discriminant *TSNode= this.parseExpr();
  node.left.value = discriminant;
  node.left.has_value = true; /* detected as non-optional */
  this.expectValue(")");
  this.expectValue("{");
  for (this.matchValue("}") == false) && (this.isAtEnd() == false) {
    var caseNode *TSNode= CreateNew_TSNode();
    if  this.matchValue("case") {
      caseNode.nodeType = "SwitchCase"; 
      this.advance();
      var test *TSNode= this.parseExpr();
      caseNode.left.value = test;
      caseNode.left.has_value = true; /* detected as non-optional */
      this.expectValue(":");
    }
    if  this.matchValue("default") {
      caseNode.nodeType = "SwitchCase"; 
      caseNode.kind = "default"; 
      this.advance();
      this.expectValue(":");
    }
    for (((this.matchValue("case") == false) && (this.matchValue("default") == false)) && (this.matchValue("}") == false)) && (this.isAtEnd() == false) {
      if  this.matchValue("break") {
        var breakNode *TSNode= CreateNew_TSNode();
        breakNode.nodeType = "BreakStatement"; 
        this.advance();
        if  this.matchValue(";") {
          this.advance();
        }
        caseNode.children = append(caseNode.children,breakNode); 
      } else {
        var stmt *TSNode= this.parseStatement();
        caseNode.children = append(caseNode.children,stmt); 
      }
    }
    node.children = append(node.children,caseNode); 
  }
  this.expectValue("}");
  return node
}
func (this *TSParserSimple) parseTryStatement () *TSNode {
  var node *TSNode= CreateNew_TSNode();
  node.nodeType = "TryStatement"; 
  var startTok *Token= this.peek();
  node.start = startTok.start; 
  node.line = startTok.line; 
  node.col = startTok.col; 
  this.expectValue("try");
  var tryBlock *TSNode= this.parseBlock();
  node.body.value = tryBlock;
  node.body.has_value = true; /* detected as non-optional */
  if  this.matchValue("catch") {
    var catchNode *TSNode= CreateNew_TSNode();
    catchNode.nodeType = "CatchClause"; 
    this.advance();
    if  this.matchValue("(") {
      this.advance();
      var param *Token= this.expect("Identifier");
      catchNode.name = param.value; 
      if  this.matchValue(":") {
        var typeAnnot *TSNode= this.parseTypeAnnotation();
        catchNode.typeAnnotation.value = typeAnnot;
        catchNode.typeAnnotation.has_value = true; /* detected as non-optional */
      }
      this.expectValue(")");
    }
    var catchBlock *TSNode= this.parseBlock();
    catchNode.body.value = catchBlock;
    catchNode.body.has_value = true; /* detected as non-optional */
    node.left.value = catchNode;
    node.left.has_value = true; /* detected as non-optional */
  }
  if  this.matchValue("finally") {
    this.advance();
    var finallyBlock *TSNode= this.parseBlock();
    node.right.value = finallyBlock;
    node.right.has_value = true; /* detected as non-optional */
  }
  return node
}
func (this *TSParserSimple) parseVarDecl () *TSNode {
  var node *TSNode= CreateNew_TSNode();
  node.nodeType = "VariableDeclaration"; 
  var startTok *Token= this.peek();
  node.start = startTok.start; 
  node.line = startTok.line; 
  node.col = startTok.col; 
  node.kind = startTok.value; 
  this.advance();
  var declarator *TSNode= CreateNew_TSNode();
  declarator.nodeType = "VariableDeclarator"; 
  var nextVal string= this.peekValue();
  if  nextVal == "{" {
    var pattern *TSNode= this.parseObjectPattern();
    declarator.left.value = pattern;
    declarator.left.has_value = true; /* detected as non-optional */
    declarator.start = pattern.start; 
    declarator.line = pattern.line; 
    declarator.col = pattern.col; 
  } else {
    if  nextVal == "[" {
      var pattern_1 *TSNode= this.parseArrayPattern();
      declarator.left.value = pattern_1;
      declarator.left.has_value = true; /* detected as non-optional */
      declarator.start = pattern_1.start; 
      declarator.line = pattern_1.line; 
      declarator.col = pattern_1.col; 
    } else {
      var nameTok *Token= this.expect("Identifier");
      declarator.name = nameTok.value; 
      declarator.start = nameTok.start; 
      declarator.line = nameTok.line; 
      declarator.col = nameTok.col; 
    }
  }
  if  this.matchValue(":") {
    var typeAnnot *TSNode= this.parseTypeAnnotation();
    declarator.typeAnnotation.value = typeAnnot;
    declarator.typeAnnotation.has_value = true; /* detected as non-optional */
  }
  if  this.matchValue("=") {
    this.advance();
    var initExpr *TSNode= this.parseExpr();
    declarator.init.value = initExpr;
    declarator.init.has_value = true; /* detected as non-optional */
  }
  node.children = append(node.children,declarator); 
  if  this.matchValue(";") {
    this.advance();
  }
  return node
}
func (this *TSParserSimple) parseObjectPattern () *TSNode {
  var node *TSNode= CreateNew_TSNode();
  node.nodeType = "ObjectPattern"; 
  var startTok *Token= this.peek();
  node.start = startTok.start; 
  node.line = startTok.line; 
  node.col = startTok.col; 
  this.expectValue("{");
  for (this.matchValue("}") == false) && (this.isAtEnd() == false) {
    if  (int64(len(node.children))) > int64(0) {
      this.expectValue(",");
      if  this.matchValue("}") {
        break;
      }
    }
    if  this.matchValue("...") {
      this.advance();
      var restProp *TSNode= CreateNew_TSNode();
      restProp.nodeType = "RestElement"; 
      var restName *Token= this.expect("Identifier");
      restProp.name = restName.value; 
      node.children = append(node.children,restProp); 
    } else {
      var prop *TSNode= CreateNew_TSNode();
      prop.nodeType = "Property"; 
      var keyTok *Token= this.expect("Identifier");
      prop.name = keyTok.value; 
      if  this.matchValue(":") {
        this.advance();
        var valueTok *Token= this.expect("Identifier");
        var valueId *TSNode= CreateNew_TSNode();
        valueId.nodeType = "Identifier"; 
        valueId.name = valueTok.value; 
        prop.right.value = valueId;
        prop.right.has_value = true; /* detected as non-optional */
      } else {
        prop.shorthand = true; 
      }
      if  this.matchValue("=") {
        this.advance();
        var defaultExpr *TSNode= this.parseExpr();
        prop.init.value = defaultExpr;
        prop.init.has_value = true; /* detected as non-optional */
        prop.left.value = defaultExpr;
        prop.left.has_value = true; /* detected as non-optional */
      }
      node.children = append(node.children,prop); 
    }
  }
  this.expectValue("}");
  return node
}
func (this *TSParserSimple) parseArrayPattern () *TSNode {
  var node *TSNode= CreateNew_TSNode();
  node.nodeType = "ArrayPattern"; 
  var startTok *Token= this.peek();
  node.start = startTok.start; 
  node.line = startTok.line; 
  node.col = startTok.col; 
  this.expectValue("[");
  for (this.matchValue("]") == false) && (this.isAtEnd() == false) {
    if  (int64(len(node.children))) > int64(0) {
      this.expectValue(",");
      if  this.matchValue("]") {
        break;
      }
    }
    if  this.matchValue(",") {
      var hole *TSNode= CreateNew_TSNode();
      hole.nodeType = "Elision"; 
      node.children = append(node.children,hole); 
    } else {
      if  this.matchValue("...") {
        this.advance();
        var restElem *TSNode= CreateNew_TSNode();
        restElem.nodeType = "RestElement"; 
        var restName *Token= this.expect("Identifier");
        restElem.name = restName.value; 
        node.children = append(node.children,restElem); 
      } else {
        var elem *TSNode= CreateNew_TSNode();
        var elemTok *Token= this.expect("Identifier");
        elem.nodeType = "Identifier"; 
        elem.name = elemTok.value; 
        if  this.matchValue("=") {
          this.advance();
          var defaultExpr *TSNode= this.parseExpr();
          var assignPat *TSNode= CreateNew_TSNode();
          assignPat.nodeType = "AssignmentPattern"; 
          assignPat.left.value = elem;
          assignPat.left.has_value = true; /* detected as non-optional */
          assignPat.right.value = defaultExpr;
          assignPat.right.has_value = true; /* detected as non-optional */
          node.children = append(node.children,assignPat); 
        } else {
          node.children = append(node.children,elem); 
        }
      }
    }
  }
  this.expectValue("]");
  return node
}
func (this *TSParserSimple) parseFuncDecl (isAsync bool) *TSNode {
  var node *TSNode= CreateNew_TSNode();
  node.nodeType = "FunctionDeclaration"; 
  var startTok *Token= this.peek();
  node.start = startTok.start; 
  node.line = startTok.line; 
  node.col = startTok.col; 
  if  isAsync {
    node.async = true; 
  }
  this.expectValue("function");
  if  this.matchValue("*") {
    this.advance();
    node.generator = true; 
  }
  var nameTok *Token= this.expect("Identifier");
  node.name = nameTok.value; 
  if  this.matchValue("<") {
    var typeParams []*TSNode= this.parseTypeParams();
    var i int64 = 0;  
    for ; i < int64(len(typeParams)) ; i++ {
      tp := typeParams[i];
      node.children = append(node.children,tp); 
    }
  }
  this.expectValue("(");
  for (this.matchValue(")") == false) && (this.isAtEnd() == false) {
    if  (int64(len(node.params))) > int64(0) {
      this.expectValue(",");
    }
    var param *TSNode= this.parseParam();
    node.params = append(node.params,param); 
  }
  this.expectValue(")");
  if  this.matchValue(":") {
    var returnType *TSNode= this.parseTypeAnnotation();
    node.typeAnnotation.value = returnType;
    node.typeAnnotation.has_value = true; /* detected as non-optional */
  }
  var body *TSNode= this.parseBlock();
  node.body.value = body;
  node.body.has_value = true; /* detected as non-optional */
  return node
}
func (this *TSParserSimple) parseParam () *TSNode {
  var decorators []*TSNode = make([]*TSNode, 0);
  for this.matchValue("@") {
    var dec *TSNode= this.parseDecorator();
    decorators = append(decorators,dec); 
  }
  var isRest bool= false;
  if  this.matchValue("...") {
    this.advance();
    isRest = true; 
  }
  if  this.matchValue("{") {
    var pattern *TSNode= this.parseObjectPattern();
    var i int64 = 0;  
    for ; i < int64(len(decorators)) ; i++ {
      d := decorators[i];
      pattern.decorators = append(pattern.decorators,d); 
    }
    if  isRest {
      var restElem *TSNode= CreateNew_TSNode();
      restElem.nodeType = "RestElement"; 
      restElem.left.value = pattern;
      restElem.left.has_value = true; /* detected as non-optional */
      return restElem
    }
    return pattern
  }
  if  this.matchValue("[") {
    var pattern_1 *TSNode= this.parseArrayPattern();
    var i_1 int64 = 0;  
    for ; i_1 < int64(len(decorators)) ; i_1++ {
      d_1 := decorators[i_1];
      pattern_1.decorators = append(pattern_1.decorators,d_1); 
    }
    if  isRest {
      var restElem_1 *TSNode= CreateNew_TSNode();
      restElem_1.nodeType = "RestElement"; 
      restElem_1.left.value = pattern_1;
      restElem_1.left.has_value = true; /* detected as non-optional */
      return restElem_1
    }
    return pattern_1
  }
  var param *TSNode= CreateNew_TSNode();
  if  isRest {
    param.nodeType = "RestElement"; 
    param.kind = "rest"; 
  } else {
    param.nodeType = "Parameter"; 
  }
  var i_2 int64 = 0;  
  for ; i_2 < int64(len(decorators)) ; i_2++ {
    d_2 := decorators[i_2];
    param.decorators = append(param.decorators,d_2); 
  }
  var nameTok *Token= this.expect("Identifier");
  param.name = nameTok.value; 
  param.start = nameTok.start; 
  param.line = nameTok.line; 
  param.col = nameTok.col; 
  if  this.matchValue("?") {
    param.optional = true; 
    this.advance();
  }
  if  this.matchValue(":") {
    var typeAnnot *TSNode= this.parseTypeAnnotation();
    param.typeAnnotation.value = typeAnnot;
    param.typeAnnotation.has_value = true; /* detected as non-optional */
  }
  if  this.matchValue("=") {
    this.advance();
    param.init.value = this.parseExpr();
    param.init.has_value = true; /* detected as non-optional */
  }
  return param
}
func (this *TSParserSimple) parseBlock () *TSNode {
  var block *TSNode= CreateNew_TSNode();
  block.nodeType = "BlockStatement"; 
  var startTok *Token= this.peek();
  block.start = startTok.start; 
  block.line = startTok.line; 
  block.col = startTok.col; 
  this.expectValue("{");
  for (this.matchValue("}") == false) && (this.isAtEnd() == false) {
    var stmt *TSNode= this.parseStatement();
    block.children = append(block.children,stmt); 
  }
  this.expectValue("}");
  return block
}
func (this *TSParserSimple) parseExprStmt () *TSNode {
  var stmt *TSNode= CreateNew_TSNode();
  stmt.nodeType = "ExpressionStatement"; 
  var startTok *Token= this.peek();
  stmt.start = startTok.start; 
  stmt.line = startTok.line; 
  stmt.col = startTok.col; 
  var expr *TSNode= this.parseExpr();
  stmt.left.value = expr;
  stmt.left.has_value = true; /* detected as non-optional */
  if  this.matchValue(";") {
    this.advance();
  }
  return stmt
}
func (this *TSParserSimple) parseTypeAnnotation () *TSNode {
  var annot *TSNode= CreateNew_TSNode();
  annot.nodeType = "TSTypeAnnotation"; 
  var startTok *Token= this.peek();
  annot.start = startTok.start; 
  annot.line = startTok.line; 
  annot.col = startTok.col; 
  this.expectValue(":");
  var nextVal string= this.peekValue();
  if  nextVal == "asserts" {
    var assertsTok *Token= this.peek();
    this.advance();
    var predicate *TSNode= CreateNew_TSNode();
    predicate.nodeType = "TSTypePredicate"; 
    predicate.start = assertsTok.start; 
    predicate.line = assertsTok.line; 
    predicate.col = assertsTok.col; 
    predicate.value = "asserts"; 
    var paramTok *Token= this.expect("Identifier");
    predicate.name = paramTok.value; 
    if  this.matchValue("is") {
      this.advance();
      var assertType *TSNode= this.parseType();
      predicate.typeAnnotation.value = assertType;
      predicate.typeAnnotation.has_value = true; /* detected as non-optional */
    }
    annot.typeAnnotation.value = predicate;
    annot.typeAnnotation.has_value = true; /* detected as non-optional */
    return annot
  }
  if  this.matchType("Identifier") {
    var savedPos int64= this.pos;
    var savedTok *Token= this.currentToken.value.(*Token);
    var paramTok_1 *Token= this.peek();
    this.advance();
    if  this.matchValue("is") {
      this.advance();
      var predicate_1 *TSNode= CreateNew_TSNode();
      predicate_1.nodeType = "TSTypePredicate"; 
      predicate_1.start = paramTok_1.start; 
      predicate_1.line = paramTok_1.line; 
      predicate_1.col = paramTok_1.col; 
      predicate_1.name = paramTok_1.value; 
      var typeExpr *TSNode= this.parseType();
      predicate_1.typeAnnotation.value = typeExpr;
      predicate_1.typeAnnotation.has_value = true; /* detected as non-optional */
      annot.typeAnnotation.value = predicate_1;
      annot.typeAnnotation.has_value = true; /* detected as non-optional */
      return annot
    }
    this.pos = savedPos; 
    this.currentToken.value = savedTok;
    this.currentToken.has_value = true; /* detected as non-optional */
  }
  var typeExpr_1 *TSNode= this.parseType();
  annot.typeAnnotation.value = typeExpr_1;
  annot.typeAnnotation.has_value = true; /* detected as non-optional */
  return annot
}
func (this *TSParserSimple) parseType () *TSNode {
  return this.parseConditionalType()
}
func (this *TSParserSimple) parseConditionalType () *TSNode {
  var checkType *TSNode= this.parseUnionType();
  if  this.matchValue("extends") {
    this.advance();
    var extendsType *TSNode= this.parseUnionType();
    if  this.matchValue("?") {
      this.advance();
      var conditional *TSNode= CreateNew_TSNode();
      conditional.nodeType = "TSConditionalType"; 
      conditional.start = checkType.start; 
      conditional.line = checkType.line; 
      conditional.col = checkType.col; 
      conditional.left.value = checkType;
      conditional.left.has_value = true; /* detected as non-optional */
      conditional.params = append(conditional.params,extendsType); 
      conditional.body.value = this.parseUnionType();
      conditional.body.has_value = true; /* detected as non-optional */
      this.expectValue(":");
      conditional.right.value = this.parseUnionType();
      conditional.right.has_value = true; /* detected as non-optional */
      return conditional
    }
    return checkType
  }
  return checkType
}
func (this *TSParserSimple) parseUnionType () *TSNode {
  var left *TSNode= this.parseIntersectionType();
  if  this.matchValue("|") {
    var union *TSNode= CreateNew_TSNode();
    union.nodeType = "TSUnionType"; 
    union.start = left.start; 
    union.line = left.line; 
    union.col = left.col; 
    union.children = append(union.children,left); 
    for this.matchValue("|") {
      this.advance();
      var right *TSNode= this.parseIntersectionType();
      union.children = append(union.children,right); 
    }
    return union
  }
  return left
}
func (this *TSParserSimple) parseIntersectionType () *TSNode {
  var left *TSNode= this.parseArrayType();
  if  this.matchValue("&") {
    var intersection *TSNode= CreateNew_TSNode();
    intersection.nodeType = "TSIntersectionType"; 
    intersection.start = left.start; 
    intersection.line = left.line; 
    intersection.col = left.col; 
    intersection.children = append(intersection.children,left); 
    for this.matchValue("&") {
      this.advance();
      var right *TSNode= this.parseArrayType();
      intersection.children = append(intersection.children,right); 
    }
    return intersection
  }
  return left
}
func (this *TSParserSimple) parseArrayType () *TSNode {
  var elemType *TSNode= this.parsePrimaryType();
  for this.matchValue("[") {
    if  this.checkNext("]") {
      this.advance();
      this.advance();
      var arrayType *TSNode= CreateNew_TSNode();
      arrayType.nodeType = "TSArrayType"; 
      arrayType.start = elemType.start; 
      arrayType.line = elemType.line; 
      arrayType.col = elemType.col; 
      arrayType.left.value = elemType;
      arrayType.left.has_value = true; /* detected as non-optional */
      elemType = arrayType; 
    } else {
      this.advance();
      var indexType *TSNode= this.parseType();
      this.expectValue("]");
      var indexedAccess *TSNode= CreateNew_TSNode();
      indexedAccess.nodeType = "TSIndexedAccessType"; 
      indexedAccess.start = elemType.start; 
      indexedAccess.line = elemType.line; 
      indexedAccess.col = elemType.col; 
      indexedAccess.left.value = elemType;
      indexedAccess.left.has_value = true; /* detected as non-optional */
      indexedAccess.right.value = indexType;
      indexedAccess.right.has_value = true; /* detected as non-optional */
      elemType = indexedAccess; 
    }
  }
  return elemType
}
func (this *TSParserSimple) checkNext (value string) bool {
  var nextPos int64= this.pos + int64(1);
  if  nextPos < (int64(len(this.tokens))) {
    var nextTok *Token= this.tokens[nextPos];
    var v string= nextTok.value;
    return v == value
  }
  return false
}
func (this *TSParserSimple) parsePrimaryType () *TSNode {
  var tokVal string= this.peekValue();
  var tok *Token= this.peek();
  if  tokVal == "keyof" {
    this.advance();
    var operand *TSNode= this.parsePrimaryType();
    var node *TSNode= CreateNew_TSNode();
    node.nodeType = "TSTypeOperator"; 
    node.value = "keyof"; 
    node.start = tok.start; 
    node.line = tok.line; 
    node.col = tok.col; 
    node.typeAnnotation.value = operand;
    node.typeAnnotation.has_value = true; /* detected as non-optional */
    return node
  }
  if  tokVal == "typeof" {
    this.advance();
    var operand_1 *TSNode= this.parsePrimaryType();
    var node_1 *TSNode= CreateNew_TSNode();
    node_1.nodeType = "TSTypeQuery"; 
    node_1.value = "typeof"; 
    node_1.start = tok.start; 
    node_1.line = tok.line; 
    node_1.col = tok.col; 
    node_1.typeAnnotation.value = operand_1;
    node_1.typeAnnotation.has_value = true; /* detected as non-optional */
    return node_1
  }
  if  tokVal == "infer" {
    this.advance();
    var paramTok *Token= this.expect("Identifier");
    var node_2 *TSNode= CreateNew_TSNode();
    node_2.nodeType = "TSInferType"; 
    node_2.start = tok.start; 
    node_2.line = tok.line; 
    node_2.col = tok.col; 
    var typeParam *TSNode= CreateNew_TSNode();
    typeParam.nodeType = "TSTypeParameter"; 
    typeParam.name = paramTok.value; 
    node_2.typeAnnotation.value = typeParam;
    node_2.typeAnnotation.has_value = true; /* detected as non-optional */
    return node_2
  }
  if  tokVal == "string" {
    this.advance();
    var node_3 *TSNode= CreateNew_TSNode();
    node_3.nodeType = "TSStringKeyword"; 
    node_3.start = tok.start; 
    node_3.end = tok.end; 
    node_3.line = tok.line; 
    node_3.col = tok.col; 
    return node_3
  }
  if  tokVal == "number" {
    this.advance();
    var node_4 *TSNode= CreateNew_TSNode();
    node_4.nodeType = "TSNumberKeyword"; 
    node_4.start = tok.start; 
    node_4.end = tok.end; 
    node_4.line = tok.line; 
    node_4.col = tok.col; 
    return node_4
  }
  if  tokVal == "boolean" {
    this.advance();
    var node_5 *TSNode= CreateNew_TSNode();
    node_5.nodeType = "TSBooleanKeyword"; 
    node_5.start = tok.start; 
    node_5.end = tok.end; 
    node_5.line = tok.line; 
    node_5.col = tok.col; 
    return node_5
  }
  if  tokVal == "any" {
    this.advance();
    var node_6 *TSNode= CreateNew_TSNode();
    node_6.nodeType = "TSAnyKeyword"; 
    node_6.start = tok.start; 
    node_6.end = tok.end; 
    node_6.line = tok.line; 
    node_6.col = tok.col; 
    return node_6
  }
  if  tokVal == "unknown" {
    this.advance();
    var node_7 *TSNode= CreateNew_TSNode();
    node_7.nodeType = "TSUnknownKeyword"; 
    node_7.start = tok.start; 
    node_7.end = tok.end; 
    node_7.line = tok.line; 
    node_7.col = tok.col; 
    return node_7
  }
  if  tokVal == "void" {
    this.advance();
    var node_8 *TSNode= CreateNew_TSNode();
    node_8.nodeType = "TSVoidKeyword"; 
    node_8.start = tok.start; 
    node_8.end = tok.end; 
    node_8.line = tok.line; 
    node_8.col = tok.col; 
    return node_8
  }
  if  tokVal == "null" {
    this.advance();
    var node_9 *TSNode= CreateNew_TSNode();
    node_9.nodeType = "TSNullKeyword"; 
    node_9.start = tok.start; 
    node_9.end = tok.end; 
    node_9.line = tok.line; 
    node_9.col = tok.col; 
    return node_9
  }
  if  tokVal == "never" {
    this.advance();
    var node_10 *TSNode= CreateNew_TSNode();
    node_10.nodeType = "TSNeverKeyword"; 
    node_10.start = tok.start; 
    node_10.end = tok.end; 
    node_10.line = tok.line; 
    node_10.col = tok.col; 
    return node_10
  }
  if  tokVal == "undefined" {
    this.advance();
    var node_11 *TSNode= CreateNew_TSNode();
    node_11.nodeType = "TSUndefinedKeyword"; 
    node_11.start = tok.start; 
    node_11.end = tok.end; 
    node_11.line = tok.line; 
    node_11.col = tok.col; 
    return node_11
  }
  var tokType string= this.peekType();
  if  tokType == "Identifier" {
    return this.parseTypeRef()
  }
  if  tokType == "String" {
    this.advance();
    var node_12 *TSNode= CreateNew_TSNode();
    node_12.nodeType = "TSLiteralType"; 
    node_12.start = tok.start; 
    node_12.end = tok.end; 
    node_12.line = tok.line; 
    node_12.col = tok.col; 
    node_12.value = tok.value; 
    node_12.kind = "string"; 
    return node_12
  }
  if  tokType == "Number" {
    this.advance();
    var node_13 *TSNode= CreateNew_TSNode();
    node_13.nodeType = "TSLiteralType"; 
    node_13.start = tok.start; 
    node_13.end = tok.end; 
    node_13.line = tok.line; 
    node_13.col = tok.col; 
    node_13.value = tok.value; 
    node_13.kind = "number"; 
    return node_13
  }
  if  (tokVal == "true") || (tokVal == "false") {
    this.advance();
    var node_14 *TSNode= CreateNew_TSNode();
    node_14.nodeType = "TSLiteralType"; 
    node_14.start = tok.start; 
    node_14.end = tok.end; 
    node_14.line = tok.line; 
    node_14.col = tok.col; 
    node_14.value = tokVal; 
    node_14.kind = "boolean"; 
    return node_14
  }
  if  tokType == "Template" {
    this.advance();
    var node_15 *TSNode= CreateNew_TSNode();
    node_15.nodeType = "TSTemplateLiteralType"; 
    node_15.start = tok.start; 
    node_15.end = tok.end; 
    node_15.line = tok.line; 
    node_15.col = tok.col; 
    node_15.value = tok.value; 
    return node_15
  }
  if  tokVal == "new" {
    return this.parseConstructorType()
  }
  if  tokVal == "import" {
    return this.parseImportType()
  }
  if  tokVal == "(" {
    return this.parseParenOrFunctionType()
  }
  if  tokVal == "[" {
    return this.parseTupleType()
  }
  if  tokVal == "{" {
    return this.parseTypeLiteral()
  }
  if  this.quiet == false {
    fmt.Println( "Unknown type: " + tokVal )
  }
  this.advance();
  var errNode *TSNode= CreateNew_TSNode();
  errNode.nodeType = "TSAnyKeyword"; 
  return errNode
}
func (this *TSParserSimple) parseTypeRef () *TSNode {
  var ref *TSNode= CreateNew_TSNode();
  ref.nodeType = "TSTypeReference"; 
  var tok *Token= this.peek();
  ref.start = tok.start; 
  ref.line = tok.line; 
  ref.col = tok.col; 
  var nameTok *Token= this.expect("Identifier");
  ref.name = nameTok.value; 
  if  this.matchValue("<") {
    this.advance();
    for (this.matchValue(">") == false) && (this.isAtEnd() == false) {
      if  (int64(len(ref.params))) > int64(0) {
        this.expectValue(",");
      }
      var typeArg *TSNode= this.parseType();
      ref.params = append(ref.params,typeArg); 
    }
    this.expectValue(">");
  }
  return ref
}
func (this *TSParserSimple) parseTupleType () *TSNode {
  var tuple *TSNode= CreateNew_TSNode();
  tuple.nodeType = "TSTupleType"; 
  var startTok *Token= this.peek();
  tuple.start = startTok.start; 
  tuple.line = startTok.line; 
  tuple.col = startTok.col; 
  this.expectValue("[");
  for (this.matchValue("]") == false) && (this.isAtEnd() == false) {
    if  (int64(len(tuple.children))) > int64(0) {
      this.expectValue(",");
    }
    if  this.matchValue("...") {
      var restTok *Token= this.peek();
      this.advance();
      var restName string= "";
      if  this.matchType("Identifier") {
        var savedPos int64= this.pos;
        var savedTok *Token= this.currentToken.value.(*Token);
        var nameTok *Token= this.peek();
        this.advance();
        if  this.matchValue(":") {
          restName = nameTok.value; 
          this.advance();
        } else {
          this.pos = savedPos; 
          this.currentToken.value = savedTok;
          this.currentToken.has_value = true; /* detected as non-optional */
        }
      }
      var innerType *TSNode= this.parseType();
      var restType *TSNode= CreateNew_TSNode();
      restType.nodeType = "TSRestType"; 
      restType.start = restTok.start; 
      restType.line = restTok.line; 
      restType.col = restTok.col; 
      restType.typeAnnotation.value = innerType;
      restType.typeAnnotation.has_value = true; /* detected as non-optional */
      if  restName != "" {
        restType.name = restName; 
      }
      tuple.children = append(tuple.children,restType); 
    } else {
      var isNamed bool= false;
      var elemName string= "";
      var elemOptional bool= false;
      var elemStart *Token= this.peek();
      if  this.matchType("Identifier") {
        var savedPos_1 int64= this.pos;
        var savedTok_1 *Token= this.currentToken.value.(*Token);
        var nameTok_1 *Token= this.peek();
        this.advance();
        if  this.matchValue("?") {
          this.advance();
          elemOptional = true; 
        }
        if  this.matchValue(":") {
          isNamed = true; 
          elemName = nameTok_1.value; 
          this.advance();
        } else {
          this.pos = savedPos_1; 
          this.currentToken.value = savedTok_1;
          this.currentToken.has_value = true; /* detected as non-optional */
          elemOptional = false; 
        }
      }
      var elemType *TSNode= this.parseType();
      if  isNamed {
        var namedElem *TSNode= CreateNew_TSNode();
        namedElem.nodeType = "TSNamedTupleMember"; 
        namedElem.start = elemStart.start; 
        namedElem.line = elemStart.line; 
        namedElem.col = elemStart.col; 
        namedElem.name = elemName; 
        namedElem.optional = elemOptional; 
        namedElem.typeAnnotation.value = elemType;
        namedElem.typeAnnotation.has_value = true; /* detected as non-optional */
        tuple.children = append(tuple.children,namedElem); 
      } else {
        if  this.matchValue("?") {
          this.advance();
          var optType *TSNode= CreateNew_TSNode();
          optType.nodeType = "TSOptionalType"; 
          optType.start = elemType.start; 
          optType.line = elemType.line; 
          optType.col = elemType.col; 
          optType.typeAnnotation.value = elemType;
          optType.typeAnnotation.has_value = true; /* detected as non-optional */
          tuple.children = append(tuple.children,optType); 
        } else {
          tuple.children = append(tuple.children,elemType); 
        }
      }
    }
  }
  this.expectValue("]");
  return tuple
}
func (this *TSParserSimple) parseParenOrFunctionType () *TSNode {
  var startTok *Token= this.peek();
  var startPos int64= startTok.start;
  var startLine int64= startTok.line;
  var startCol int64= startTok.col;
  this.expectValue("(");
  if  this.matchValue(")") {
    this.advance();
    if  this.matchValue("=>") {
      this.advance();
      var returnType *TSNode= this.parseType();
      var funcType *TSNode= CreateNew_TSNode();
      funcType.nodeType = "TSFunctionType"; 
      funcType.start = startPos; 
      funcType.line = startLine; 
      funcType.col = startCol; 
      funcType.typeAnnotation.value = returnType;
      funcType.typeAnnotation.has_value = true; /* detected as non-optional */
      return funcType
    }
    var voidNode *TSNode= CreateNew_TSNode();
    voidNode.nodeType = "TSVoidKeyword"; 
    return voidNode
  }
  var isIdentifier bool= this.matchType("Identifier");
  if  isIdentifier {
    var savedPos int64= this.pos;
    var savedToken *Token= this.currentToken.value.(*Token);
    this.advance();
    if  this.matchValue(":") || this.matchValue("?") {
      this.pos = savedPos; 
      this.currentToken.value = savedToken;
      this.currentToken.has_value = true; /* detected as non-optional */
      return this.parseFunctionType(startPos, startLine, startCol)
    }
    if  this.matchValue(",") {
      /** unused:  savedPos2*/
      /** unused:  savedToken2*/
      var depth int64= int64(1);
      for (depth > int64(0)) && (this.isAtEnd() == false) {
        if  this.matchValue("(") {
          depth = depth + int64(1); 
        }
        if  this.matchValue(")") {
          depth = depth - int64(1); 
        }
        if  depth > int64(0) {
          this.advance();
        }
      }
      if  this.matchValue(")") {
        this.advance();
        if  this.matchValue("=>") {
          this.pos = savedPos; 
          this.currentToken.value = savedToken;
          this.currentToken.has_value = true; /* detected as non-optional */
          return this.parseFunctionType(startPos, startLine, startCol)
        }
      }
      this.pos = savedPos; 
      this.currentToken.value = savedToken;
      this.currentToken.has_value = true; /* detected as non-optional */
    }
    this.pos = savedPos; 
    this.currentToken.value = savedToken;
    this.currentToken.has_value = true; /* detected as non-optional */
  }
  var innerType *TSNode= this.parseType();
  this.expectValue(")");
  if  this.matchValue("=>") {
    this.advance();
    var returnType_1 *TSNode= this.parseType();
    var funcType_1 *TSNode= CreateNew_TSNode();
    funcType_1.nodeType = "TSFunctionType"; 
    funcType_1.start = startPos; 
    funcType_1.line = startLine; 
    funcType_1.col = startCol; 
    funcType_1.typeAnnotation.value = returnType_1;
    funcType_1.typeAnnotation.has_value = true; /* detected as non-optional */
    return funcType_1
  }
  return innerType
}
func (this *TSParserSimple) parseFunctionType (startPos int64, startLine int64, startCol int64) *TSNode {
  var funcType *TSNode= CreateNew_TSNode();
  funcType.nodeType = "TSFunctionType"; 
  funcType.start = startPos; 
  funcType.line = startLine; 
  funcType.col = startCol; 
  for (this.matchValue(")") == false) && (this.isAtEnd() == false) {
    if  (int64(len(funcType.params))) > int64(0) {
      this.expectValue(",");
    }
    var param *TSNode= CreateNew_TSNode();
    param.nodeType = "Parameter"; 
    var nameTok *Token= this.expect("Identifier");
    param.name = nameTok.value; 
    param.start = nameTok.start; 
    param.line = nameTok.line; 
    param.col = nameTok.col; 
    if  this.matchValue("?") {
      param.optional = true; 
      this.advance();
    }
    if  this.matchValue(":") {
      var typeAnnot *TSNode= this.parseTypeAnnotation();
      param.typeAnnotation.value = typeAnnot;
      param.typeAnnotation.has_value = true; /* detected as non-optional */
    }
    funcType.params = append(funcType.params,param); 
  }
  this.expectValue(")");
  if  this.matchValue("=>") {
    this.advance();
    var returnType *TSNode= this.parseType();
    funcType.typeAnnotation.value = returnType;
    funcType.typeAnnotation.has_value = true; /* detected as non-optional */
  }
  return funcType
}
func (this *TSParserSimple) parseConstructorType () *TSNode {
  var ctorType *TSNode= CreateNew_TSNode();
  ctorType.nodeType = "TSConstructorType"; 
  var startTok *Token= this.peek();
  ctorType.start = startTok.start; 
  ctorType.line = startTok.line; 
  ctorType.col = startTok.col; 
  this.expectValue("new");
  if  this.matchValue("<") {
    var typeParams []*TSNode= this.parseTypeParams();
    ctorType.children = typeParams; 
  }
  this.expectValue("(");
  for (this.matchValue(")") == false) && (this.isAtEnd() == false) {
    if  (int64(len(ctorType.params))) > int64(0) {
      this.expectValue(",");
    }
    var param *TSNode= this.parseParam();
    ctorType.params = append(ctorType.params,param); 
  }
  this.expectValue(")");
  if  this.matchValue("=>") {
    this.advance();
    var returnType *TSNode= this.parseType();
    ctorType.typeAnnotation.value = returnType;
    ctorType.typeAnnotation.has_value = true; /* detected as non-optional */
  }
  return ctorType
}
func (this *TSParserSimple) parseImportType () *TSNode {
  var importType *TSNode= CreateNew_TSNode();
  importType.nodeType = "TSImportType"; 
  var startTok *Token= this.peek();
  importType.start = startTok.start; 
  importType.line = startTok.line; 
  importType.col = startTok.col; 
  this.expectValue("import");
  this.expectValue("(");
  var sourceTok *Token= this.expect("String");
  importType.value = sourceTok.value; 
  this.expectValue(")");
  if  this.matchValue(".") {
    this.advance();
    var memberTok *Token= this.expect("Identifier");
    importType.name = memberTok.value; 
    if  this.matchValue("<") {
      this.advance();
      for (this.matchValue(">") == false) && (this.isAtEnd() == false) {
        if  (int64(len(importType.params))) > int64(0) {
          this.expectValue(",");
        }
        var typeArg *TSNode= this.parseType();
        importType.params = append(importType.params,typeArg); 
      }
      this.expectValue(">");
    }
  }
  return importType
}
func (this *TSParserSimple) parseTypeLiteral () *TSNode {
  var literal *TSNode= CreateNew_TSNode();
  literal.nodeType = "TSTypeLiteral"; 
  var startTok *Token= this.peek();
  literal.start = startTok.start; 
  literal.line = startTok.line; 
  literal.col = startTok.col; 
  this.expectValue("{");
  for (this.matchValue("}") == false) && (this.isAtEnd() == false) {
    var member *TSNode= this.parseTypeLiteralMember();
    literal.children = append(literal.children,member); 
    if  this.matchValue(";") || this.matchValue(",") {
      this.advance();
    }
  }
  this.expectValue("}");
  return literal
}
func (this *TSParserSimple) parseTypeLiteralMember () *TSNode {
  var startTok *Token= this.peek();
  var startPos int64= startTok.start;
  var startLine int64= startTok.line;
  var startCol int64= startTok.col;
  var isReadonly bool= false;
  if  this.matchValue("readonly") {
    isReadonly = true; 
    this.advance();
  }
  var readonlyModifier string= "";
  if  this.matchValue("+") || this.matchValue("-") {
    readonlyModifier = this.peekValue(); 
    this.advance();
    if  this.matchValue("readonly") {
      isReadonly = true; 
      this.advance();
    }
  }
  if  this.matchValue("[") {
    this.advance();
    var paramName *Token= this.expect("Identifier");
    if  this.matchValue("in") {
      return this.parseMappedType(isReadonly, readonlyModifier, paramName.value, startPos, startLine, startCol)
    }
    return this.parseIndexSignatureRest(isReadonly, paramName, startPos, startLine, startCol)
  }
  var nameTok *Token= this.expect("Identifier");
  var memberName string= nameTok.value;
  var isOptional bool= false;
  if  this.matchValue("?") {
    isOptional = true; 
    this.advance();
  }
  if  this.matchValue("(") {
    return this.parseMethodSignature(memberName, isOptional, startPos, startLine, startCol)
  }
  var prop *TSNode= CreateNew_TSNode();
  prop.nodeType = "TSPropertySignature"; 
  prop.start = startPos; 
  prop.line = startLine; 
  prop.col = startCol; 
  prop.name = memberName; 
  prop.readonly = isReadonly; 
  prop.optional = isOptional; 
  if  this.matchValue(":") {
    var typeAnnot *TSNode= this.parseTypeAnnotation();
    prop.typeAnnotation.value = typeAnnot;
    prop.typeAnnotation.has_value = true; /* detected as non-optional */
  }
  return prop
}
func (this *TSParserSimple) parseMappedType (isReadonly bool, readonlyMod string, paramName string, startPos int64, startLine int64, startCol int64) *TSNode {
  var mapped *TSNode= CreateNew_TSNode();
  mapped.nodeType = "TSMappedType"; 
  mapped.start = startPos; 
  mapped.line = startLine; 
  mapped.col = startCol; 
  mapped.readonly = isReadonly; 
  if  readonlyMod != "" {
    mapped.kind = readonlyMod; 
  }
  this.expectValue("in");
  var typeParam *TSNode= CreateNew_TSNode();
  typeParam.nodeType = "TSTypeParameter"; 
  typeParam.name = paramName; 
  var constraint *TSNode= this.parseType();
  typeParam.typeAnnotation.value = constraint;
  typeParam.typeAnnotation.has_value = true; /* detected as non-optional */
  mapped.params = append(mapped.params,typeParam); 
  if  this.matchValue("as") {
    this.advance();
    var nameType *TSNode= this.parseType();
    mapped.right.value = nameType;
    mapped.right.has_value = true; /* detected as non-optional */
  }
  this.expectValue("]");
  var optionalMod string= "";
  if  this.matchValue("+") || this.matchValue("-") {
    optionalMod = this.peekValue(); 
    this.advance();
  }
  if  this.matchValue("?") {
    mapped.optional = true; 
    if  optionalMod != "" {
      mapped.value = optionalMod; 
    }
    this.advance();
  }
  if  this.matchValue(":") {
    this.advance();
    var valueType *TSNode= this.parseType();
    mapped.typeAnnotation.value = valueType;
    mapped.typeAnnotation.has_value = true; /* detected as non-optional */
  }
  return mapped
}
func (this *TSParserSimple) parseIndexSignatureRest (isReadonly bool, paramTok *Token, startPos int64, startLine int64, startCol int64) *TSNode {
  var indexSig *TSNode= CreateNew_TSNode();
  indexSig.nodeType = "TSIndexSignature"; 
  indexSig.start = startPos; 
  indexSig.line = startLine; 
  indexSig.col = startCol; 
  indexSig.readonly = isReadonly; 
  var param *TSNode= CreateNew_TSNode();
  param.nodeType = "Parameter"; 
  param.name = paramTok.value; 
  param.start = paramTok.start; 
  param.line = paramTok.line; 
  param.col = paramTok.col; 
  if  this.matchValue(":") {
    var typeAnnot *TSNode= this.parseTypeAnnotation();
    param.typeAnnotation.value = typeAnnot;
    param.typeAnnotation.has_value = true; /* detected as non-optional */
  }
  indexSig.params = append(indexSig.params,param); 
  this.expectValue("]");
  if  this.matchValue(":") {
    var typeAnnot_1 *TSNode= this.parseTypeAnnotation();
    indexSig.typeAnnotation.value = typeAnnot_1;
    indexSig.typeAnnotation.has_value = true; /* detected as non-optional */
  }
  return indexSig
}
func (this *TSParserSimple) parseMethodSignature (methodName string, isOptional bool, startPos int64, startLine int64, startCol int64) *TSNode {
  var method *TSNode= CreateNew_TSNode();
  method.nodeType = "TSMethodSignature"; 
  method.start = startPos; 
  method.line = startLine; 
  method.col = startCol; 
  method.name = methodName; 
  method.optional = isOptional; 
  this.expectValue("(");
  for (this.matchValue(")") == false) && (this.isAtEnd() == false) {
    if  (int64(len(method.params))) > int64(0) {
      this.expectValue(",");
    }
    var param *TSNode= this.parseParam();
    method.params = append(method.params,param); 
  }
  this.expectValue(")");
  if  this.matchValue(":") {
    var returnType *TSNode= this.parseTypeAnnotation();
    method.typeAnnotation.value = returnType;
    method.typeAnnotation.has_value = true; /* detected as non-optional */
  }
  return method
}
func (this *TSParserSimple) parseExpr () *TSNode {
  return this.parseAssign()
}
func (this *TSParserSimple) parseAssign () *TSNode {
  var left *TSNode= this.parseNullishCoalescing();
  var tokVal string= this.peekValue();
  if  tokVal == "=" {
    this.advance();
    var right *TSNode= this.parseAssign();
    var assign *TSNode= CreateNew_TSNode();
    assign.nodeType = "AssignmentExpression"; 
    assign.value = "="; 
    assign.left.value = left;
    assign.left.has_value = true; /* detected as non-optional */
    assign.right.value = right;
    assign.right.has_value = true; /* detected as non-optional */
    assign.start = left.start; 
    assign.line = left.line; 
    assign.col = left.col; 
    return assign
  }
  if  ((tokVal == "&&=") || (tokVal == "||=")) || (tokVal == "??=") {
    this.advance();
    var right_1 *TSNode= this.parseAssign();
    var assign_1 *TSNode= CreateNew_TSNode();
    assign_1.nodeType = "AssignmentExpression"; 
    assign_1.value = tokVal; 
    assign_1.left.value = left;
    assign_1.left.has_value = true; /* detected as non-optional */
    assign_1.right.value = right_1;
    assign_1.right.has_value = true; /* detected as non-optional */
    assign_1.start = left.start; 
    assign_1.line = left.line; 
    assign_1.col = left.col; 
    return assign_1
  }
  return left
}
func (this *TSParserSimple) parseNullishCoalescing () *TSNode {
  var left *TSNode= this.parseTernary();
  for this.matchValue("??") {
    this.advance();
    var right *TSNode= this.parseTernary();
    var nullish *TSNode= CreateNew_TSNode();
    nullish.nodeType = "LogicalExpression"; 
    nullish.value = "??"; 
    nullish.left.value = left;
    nullish.left.has_value = true; /* detected as non-optional */
    nullish.right.value = right;
    nullish.right.has_value = true; /* detected as non-optional */
    nullish.start = left.start; 
    nullish.line = left.line; 
    nullish.col = left.col; 
    left = nullish; 
  }
  return left
}
func (this *TSParserSimple) parseTernary () *TSNode {
  var testExpr *TSNode= this.parseLogicalOr();
  if  this.matchValue("?") {
    this.advance();
    var consequentExpr *TSNode= this.parseAssign();
    if  this.matchValue(":") {
      this.advance();
      var alternateExpr *TSNode= this.parseAssign();
      var cond *TSNode= CreateNew_TSNode();
      cond.nodeType = "ConditionalExpression"; 
      cond.start = testExpr.start; 
      cond.line = testExpr.line; 
      cond.col = testExpr.col; 
      cond.left.value = testExpr;
      cond.left.has_value = true; /* detected as non-optional */
      cond.test.value = testExpr;
      cond.test.has_value = true; /* detected as non-optional */
      cond.consequent.value = consequentExpr;
      cond.consequent.has_value = true; /* detected as non-optional */
      cond.alternate.value = alternateExpr;
      cond.alternate.has_value = true; /* detected as non-optional */
      return cond
    }
  }
  return testExpr
}
func (this *TSParserSimple) parseLogicalOr () *TSNode {
  var left *TSNode= this.parseLogicalAnd();
  for this.matchValue("||") {
    this.advance();
    var right *TSNode= this.parseLogicalAnd();
    var expr *TSNode= CreateNew_TSNode();
    expr.nodeType = "BinaryExpression"; 
    expr.value = "||"; 
    expr.left.value = left;
    expr.left.has_value = true; /* detected as non-optional */
    expr.right.value = right;
    expr.right.has_value = true; /* detected as non-optional */
    expr.start = left.start; 
    expr.line = left.line; 
    expr.col = left.col; 
    left = expr; 
  }
  return left
}
func (this *TSParserSimple) parseLogicalAnd () *TSNode {
  var left *TSNode= this.parseEquality();
  for this.matchValue("&&") {
    this.advance();
    var right *TSNode= this.parseEquality();
    var expr *TSNode= CreateNew_TSNode();
    expr.nodeType = "BinaryExpression"; 
    expr.value = "&&"; 
    expr.left.value = left;
    expr.left.has_value = true; /* detected as non-optional */
    expr.right.value = right;
    expr.right.has_value = true; /* detected as non-optional */
    expr.start = left.start; 
    expr.line = left.line; 
    expr.col = left.col; 
    left = expr; 
  }
  return left
}
func (this *TSParserSimple) parseEquality () *TSNode {
  var left *TSNode= this.parseComparison();
  var tokVal string= this.peekValue();
  for (((tokVal == "==") || (tokVal == "!=")) || (tokVal == "===")) || (tokVal == "!==") {
    var opTok *Token= this.peek();
    this.advance();
    var right *TSNode= this.parseComparison();
    var expr *TSNode= CreateNew_TSNode();
    expr.nodeType = "BinaryExpression"; 
    expr.value = opTok.value; 
    expr.left.value = left;
    expr.left.has_value = true; /* detected as non-optional */
    expr.right.value = right;
    expr.right.has_value = true; /* detected as non-optional */
    expr.start = left.start; 
    expr.line = left.line; 
    expr.col = left.col; 
    left = expr; 
    tokVal = this.peekValue(); 
  }
  return left
}
func (this *TSParserSimple) parseComparison () *TSNode {
  var left *TSNode= this.parseAdditive();
  var tokVal string= this.peekValue();
  for (((tokVal == "<") || (tokVal == ">")) || (tokVal == "<=")) || (tokVal == ">=") {
    if  tokVal == "<" {
      if  this.tsxMode == true {
        if  left.nodeType == "Identifier" {
          if  this.startsWithLowerCase(left.name) {
            if  this.looksLikeGenericCall() {
              return left
            }
          }
        }
      }
    }
    var opTok *Token= this.peek();
    this.advance();
    var right *TSNode= this.parseAdditive();
    var expr *TSNode= CreateNew_TSNode();
    expr.nodeType = "BinaryExpression"; 
    expr.value = opTok.value; 
    expr.left.value = left;
    expr.left.has_value = true; /* detected as non-optional */
    expr.right.value = right;
    expr.right.has_value = true; /* detected as non-optional */
    expr.start = left.start; 
    expr.line = left.line; 
    expr.col = left.col; 
    left = expr; 
    tokVal = this.peekValue(); 
  }
  return left
}
func (this *TSParserSimple) parseAdditive () *TSNode {
  var left *TSNode= this.parseMultiplicative();
  var tokVal string= this.peekValue();
  for (tokVal == "+") || (tokVal == "-") {
    var opTok *Token= this.peek();
    this.advance();
    var right *TSNode= this.parseMultiplicative();
    var binExpr *TSNode= CreateNew_TSNode();
    binExpr.nodeType = "BinaryExpression"; 
    binExpr.value = opTok.value; 
    binExpr.left.value = left;
    binExpr.left.has_value = true; /* detected as non-optional */
    binExpr.right.value = right;
    binExpr.right.has_value = true; /* detected as non-optional */
    binExpr.start = left.start; 
    binExpr.line = left.line; 
    binExpr.col = left.col; 
    left = binExpr; 
    tokVal = this.peekValue(); 
  }
  return left
}
func (this *TSParserSimple) parseMultiplicative () *TSNode {
  var left *TSNode= this.parseUnary();
  var tokVal string= this.peekValue();
  for (((tokVal == "*") || (tokVal == "/")) || (tokVal == "%")) || (tokVal == "**") {
    var opTok *Token= this.peek();
    this.advance();
    var right *TSNode= this.parseUnary();
    var binExpr *TSNode= CreateNew_TSNode();
    binExpr.nodeType = "BinaryExpression"; 
    binExpr.value = opTok.value; 
    binExpr.left.value = left;
    binExpr.left.has_value = true; /* detected as non-optional */
    binExpr.right.value = right;
    binExpr.right.has_value = true; /* detected as non-optional */
    binExpr.start = left.start; 
    binExpr.line = left.line; 
    binExpr.col = left.col; 
    left = binExpr; 
    tokVal = this.peekValue(); 
  }
  return left
}
func (this *TSParserSimple) parseUnary () *TSNode {
  var tokVal string= this.peekValue();
  if  (tokVal == "!") || (tokVal == "-") {
    var opTok *Token= this.peek();
    this.advance();
    var arg *TSNode= this.parseUnary();
    var unary *TSNode= CreateNew_TSNode();
    unary.nodeType = "UnaryExpression"; 
    unary.value = opTok.value; 
    unary.left.value = arg;
    unary.left.has_value = true; /* detected as non-optional */
    unary.start = opTok.start; 
    unary.line = opTok.line; 
    unary.col = opTok.col; 
    return unary
  }
  if  tokVal == "yield" {
    var yieldTok *Token= this.peek();
    this.advance();
    var yieldExpr *TSNode= CreateNew_TSNode();
    yieldExpr.nodeType = "YieldExpression"; 
    yieldExpr.start = yieldTok.start; 
    yieldExpr.line = yieldTok.line; 
    yieldExpr.col = yieldTok.col; 
    if  this.matchValue("*") {
      this.advance();
      yieldExpr.delegate = true; 
    }
    var nextVal string= this.peekValue();
    if  (((nextVal != ";") && (nextVal != "}")) && (nextVal != ",")) && (nextVal != ")") {
      yieldExpr.left.value = this.parseAssign();
      yieldExpr.left.has_value = true; /* detected as non-optional */
    }
    return yieldExpr
  }
  if  tokVal == "await" {
    var awaitTok *Token= this.peek();
    this.advance();
    var arg_1 *TSNode= this.parseUnary();
    var awaitExpr *TSNode= CreateNew_TSNode();
    awaitExpr.nodeType = "AwaitExpression"; 
    awaitExpr.left.value = arg_1;
    awaitExpr.left.has_value = true; /* detected as non-optional */
    awaitExpr.start = awaitTok.start; 
    awaitExpr.line = awaitTok.line; 
    awaitExpr.col = awaitTok.col; 
    return awaitExpr
  }
  if  tokVal == "<" {
    if  this.tsxMode == true {
      var peekNext string= this.peekNextValue();
      var peekNextT string= this.peekNextType();
      if  peekNext == ">" {
        return this.parsePostfix()
      }
      if  peekNextT == "Identifier" {
        var peekTwoAhead string= this.peekAheadValue(int64(2));
        if  peekTwoAhead != "extends" {
          return this.parsePostfix()
        }
      }
    }
    var startTok *Token= this.peek();
    this.advance();
    var nextType string= this.peekType();
    if  ((nextType == "Identifier") || (nextType == "Keyword")) || (nextType == "TSType") {
      var typeNode *TSNode= this.parseType();
      if  this.matchValue(">") {
        this.advance();
        var arg_2 *TSNode= this.parseUnary();
        var assertion *TSNode= CreateNew_TSNode();
        assertion.nodeType = "TSTypeAssertion"; 
        assertion.typeAnnotation.value = typeNode;
        assertion.typeAnnotation.has_value = true; /* detected as non-optional */
        assertion.left.value = arg_2;
        assertion.left.has_value = true; /* detected as non-optional */
        assertion.start = startTok.start; 
        assertion.line = startTok.line; 
        assertion.col = startTok.col; 
        return assertion
      }
    }
  }
  return this.parsePostfix()
}
func (this *TSParserSimple) parsePostfix () *TSNode {
  var expr *TSNode= this.parsePrimary();
  var keepParsing bool= true;
  for keepParsing {
    var tokVal string= this.peekValue();
    if  tokVal == "<" {
      var shouldParseAsGenericCall bool= false;
      if  this.tsxMode == false {
        /** unused:  next1*/
        var next2 string= this.peekAheadValue(int64(2));
        if  ((next2 == ">") || (next2 == ",")) || (next2 == "extends") {
          shouldParseAsGenericCall = true; 
        }
      } else {
        if  expr.nodeType == "Identifier" {
          if  this.startsWithLowerCase(expr.name) {
            if  this.looksLikeGenericCall() {
              shouldParseAsGenericCall = true; 
            }
          }
        }
        if  expr.nodeType == "MemberExpression" {
          if  this.looksLikeGenericCall() {
            shouldParseAsGenericCall = true; 
          }
        }
      }
      if  shouldParseAsGenericCall {
        this.advance();
        var call *TSNode= CreateNew_TSNode();
        call.nodeType = "CallExpression"; 
        call.left.value = expr;
        call.left.has_value = true; /* detected as non-optional */
        call.start = expr.start; 
        call.line = expr.line; 
        call.col = expr.col; 
        for (this.matchValue(">") == false) && (this.isAtEnd() == false) {
          if  (int64(len(call.params))) > int64(0) {
            this.expectValue(",");
          }
          var typeArg *TSNode= this.parseType();
          call.params = append(call.params,typeArg); 
        }
        this.expectValue(">");
        if  this.matchValue("(") {
          this.advance();
          for (this.matchValue(")") == false) && (this.isAtEnd() == false) {
            if  (int64(len(call.children))) > int64(0) {
              this.expectValue(",");
            }
            if  this.matchValue("...") {
              this.advance();
              var spreadArg *TSNode= this.parseExpr();
              var spread *TSNode= CreateNew_TSNode();
              spread.nodeType = "SpreadElement"; 
              spread.left.value = spreadArg;
              spread.left.has_value = true; /* detected as non-optional */
              call.children = append(call.children,spread); 
            } else {
              var arg *TSNode= this.parseExpr();
              call.children = append(call.children,arg); 
            }
          }
          this.expectValue(")");
          expr = call; 
        }
      }
    }
    tokVal = this.peekValue(); 
    if  tokVal == "(" {
      this.advance();
      var call_1 *TSNode= CreateNew_TSNode();
      call_1.nodeType = "CallExpression"; 
      call_1.left.value = expr;
      call_1.left.has_value = true; /* detected as non-optional */
      call_1.start = expr.start; 
      call_1.line = expr.line; 
      call_1.col = expr.col; 
      for (this.matchValue(")") == false) && (this.isAtEnd() == false) {
        if  (int64(len(call_1.children))) > int64(0) {
          this.expectValue(",");
        }
        if  this.matchValue("...") {
          this.advance();
          var spreadArg_1 *TSNode= this.parseExpr();
          var spread_1 *TSNode= CreateNew_TSNode();
          spread_1.nodeType = "SpreadElement"; 
          spread_1.left.value = spreadArg_1;
          spread_1.left.has_value = true; /* detected as non-optional */
          call_1.children = append(call_1.children,spread_1); 
        } else {
          var arg_1 *TSNode= this.parseExpr();
          call_1.children = append(call_1.children,arg_1); 
        }
      }
      this.expectValue(")");
      expr = call_1; 
    }
    if  tokVal == "." {
      this.advance();
      var propTok *Token= this.expect("Identifier");
      var member *TSNode= CreateNew_TSNode();
      member.nodeType = "MemberExpression"; 
      member.left.value = expr;
      member.left.has_value = true; /* detected as non-optional */
      member.name = propTok.value; 
      member.start = expr.start; 
      member.line = expr.line; 
      member.col = expr.col; 
      expr = member; 
    }
    if  tokVal == "?." {
      this.advance();
      var nextTokVal string= this.peekValue();
      if  nextTokVal == "(" {
        this.advance();
        var optCall *TSNode= CreateNew_TSNode();
        optCall.nodeType = "OptionalCallExpression"; 
        optCall.optional = true; 
        optCall.left.value = expr;
        optCall.left.has_value = true; /* detected as non-optional */
        optCall.start = expr.start; 
        optCall.line = expr.line; 
        optCall.col = expr.col; 
        for (this.matchValue(")") == false) && (this.isAtEnd() == false) {
          if  (int64(len(optCall.children))) > int64(0) {
            this.expectValue(",");
          }
          var arg_2 *TSNode= this.parseExpr();
          optCall.children = append(optCall.children,arg_2); 
        }
        this.expectValue(")");
        expr = optCall; 
      }
      if  nextTokVal == "[" {
        this.advance();
        var indexExpr *TSNode= this.parseExpr();
        this.expectValue("]");
        var optIndex *TSNode= CreateNew_TSNode();
        optIndex.nodeType = "OptionalMemberExpression"; 
        optIndex.optional = true; 
        optIndex.left.value = expr;
        optIndex.left.has_value = true; /* detected as non-optional */
        optIndex.right.value = indexExpr;
        optIndex.right.has_value = true; /* detected as non-optional */
        optIndex.start = expr.start; 
        optIndex.line = expr.line; 
        optIndex.col = expr.col; 
        expr = optIndex; 
      }
      if  this.matchType("Identifier") {
        var propTok_1 *Token= this.expect("Identifier");
        var optMember *TSNode= CreateNew_TSNode();
        optMember.nodeType = "OptionalMemberExpression"; 
        optMember.optional = true; 
        optMember.left.value = expr;
        optMember.left.has_value = true; /* detected as non-optional */
        optMember.name = propTok_1.value; 
        optMember.start = expr.start; 
        optMember.line = expr.line; 
        optMember.col = expr.col; 
        expr = optMember; 
      }
    }
    if  tokVal == "[" {
      this.advance();
      var indexExpr_1 *TSNode= this.parseExpr();
      this.expectValue("]");
      var computed *TSNode= CreateNew_TSNode();
      computed.nodeType = "MemberExpression"; 
      computed.left.value = expr;
      computed.left.has_value = true; /* detected as non-optional */
      computed.right.value = indexExpr_1;
      computed.right.has_value = true; /* detected as non-optional */
      computed.start = expr.start; 
      computed.line = expr.line; 
      computed.col = expr.col; 
      expr = computed; 
    }
    if  tokVal == "!" {
      var tok *Token= this.peek();
      this.advance();
      var nonNull *TSNode= CreateNew_TSNode();
      nonNull.nodeType = "TSNonNullExpression"; 
      nonNull.left.value = expr;
      nonNull.left.has_value = true; /* detected as non-optional */
      nonNull.start = expr.start; 
      nonNull.line = expr.line; 
      nonNull.col = tok.col; 
      expr = nonNull; 
    }
    if  tokVal == "as" {
      this.advance();
      var asType *TSNode= this.parseType();
      var assertion *TSNode= CreateNew_TSNode();
      assertion.nodeType = "TSAsExpression"; 
      assertion.left.value = expr;
      assertion.left.has_value = true; /* detected as non-optional */
      assertion.typeAnnotation.value = asType;
      assertion.typeAnnotation.has_value = true; /* detected as non-optional */
      assertion.start = expr.start; 
      assertion.line = expr.line; 
      assertion.col = expr.col; 
      expr = assertion; 
    }
    if  tokVal == "satisfies" {
      this.advance();
      var satisfiesType *TSNode= this.parseType();
      var satisfiesExpr *TSNode= CreateNew_TSNode();
      satisfiesExpr.nodeType = "TSSatisfiesExpression"; 
      satisfiesExpr.left.value = expr;
      satisfiesExpr.left.has_value = true; /* detected as non-optional */
      satisfiesExpr.typeAnnotation.value = satisfiesType;
      satisfiesExpr.typeAnnotation.has_value = true; /* detected as non-optional */
      satisfiesExpr.start = expr.start; 
      satisfiesExpr.line = expr.line; 
      satisfiesExpr.col = expr.col; 
      expr = satisfiesExpr; 
    }
    var tokType string= this.peekType();
    if  tokType == "Template" {
      var quasi *TSNode= this.parseTemplateLiteral();
      var tagged *TSNode= CreateNew_TSNode();
      tagged.nodeType = "TaggedTemplateExpression"; 
      tagged.left.value = expr;
      tagged.left.has_value = true; /* detected as non-optional */
      tagged.right.value = quasi;
      tagged.right.has_value = true; /* detected as non-optional */
      tagged.start = expr.start; 
      tagged.line = expr.line; 
      tagged.col = expr.col; 
      expr = tagged; 
    }
    var newTokVal string= this.peekValue();
    var newTokType string= this.peekType();
    if  (((((((newTokVal != "(") && (newTokVal != ".")) && (newTokVal != "?.")) && (newTokVal != "[")) && (newTokVal != "!")) && (newTokVal != "as")) && (newTokVal != "satisfies")) && (newTokType != "Template") {
      keepParsing = false; 
    }
  }
  return expr
}
func (this *TSParserSimple) parsePrimary () *TSNode {
  var tokType string= this.peekType();
  var tokVal string= this.peekValue();
  var tok *Token= this.peek();
  if  (tokType == "Identifier") || (tokType == "TSType") {
    this.advance();
    var id *TSNode= CreateNew_TSNode();
    id.nodeType = "Identifier"; 
    id.name = tok.value; 
    id.start = tok.start; 
    id.end = tok.end; 
    id.line = tok.line; 
    id.col = tok.col; 
    return id
  }
  if  tokType == "Number" {
    this.advance();
    var num *TSNode= CreateNew_TSNode();
    num.nodeType = "NumericLiteral"; 
    num.value = tok.value; 
    num.start = tok.start; 
    num.end = tok.end; 
    num.line = tok.line; 
    num.col = tok.col; 
    return num
  }
  if  tokType == "BigInt" {
    this.advance();
    var bigint *TSNode= CreateNew_TSNode();
    bigint.nodeType = "BigIntLiteral"; 
    bigint.value = tok.value; 
    bigint.start = tok.start; 
    bigint.end = tok.end; 
    bigint.line = tok.line; 
    bigint.col = tok.col; 
    return bigint
  }
  if  tokType == "String" {
    this.advance();
    var str *TSNode= CreateNew_TSNode();
    str.nodeType = "StringLiteral"; 
    str.value = tok.value; 
    str.start = tok.start; 
    str.end = tok.end; 
    str.line = tok.line; 
    str.col = tok.col; 
    return str
  }
  if  tokType == "Template" {
    return this.parseTemplateLiteral()
  }
  if  (tokVal == "true") || (tokVal == "false") {
    this.advance();
    var bool *TSNode= CreateNew_TSNode();
    bool.nodeType = "BooleanLiteral"; 
    bool.value = tokVal; 
    bool.start = tok.start; 
    bool.end = tok.end; 
    bool.line = tok.line; 
    bool.col = tok.col; 
    return bool
  }
  if  tokVal == "null" {
    this.advance();
    var nullLit *TSNode= CreateNew_TSNode();
    nullLit.nodeType = "NullLiteral"; 
    nullLit.start = tok.start; 
    nullLit.end = tok.end; 
    nullLit.line = tok.line; 
    nullLit.col = tok.col; 
    return nullLit
  }
  if  tokVal == "undefined" {
    this.advance();
    var undefId *TSNode= CreateNew_TSNode();
    undefId.nodeType = "Identifier"; 
    undefId.name = "undefined"; 
    undefId.start = tok.start; 
    undefId.end = tok.end; 
    undefId.line = tok.line; 
    undefId.col = tok.col; 
    return undefId
  }
  if  tokVal == "[" {
    return this.parseArrayLiteral()
  }
  if  tokVal == "{" {
    return this.parseObjectLiteral()
  }
  if  (this.tsxMode == true) && (tokVal == "<") {
    var nextType string= this.peekNextType();
    var nextVal string= this.peekNextValue();
    if  nextVal == ">" {
      return this.parseJSXFragment()
    }
    if  (nextType == "Identifier") || (nextType == "Keyword") {
      var peekTwoAhead string= this.peekAheadValue(int64(2));
      if  peekTwoAhead != "extends" {
        return this.parseJSXElement()
      }
    }
  }
  if  tokVal == "(" {
    return this.parseParenOrArrow()
  }
  if  tokVal == "async" {
    var nextVal_1 string= this.peekNextValue();
    var nextType_1 string= this.peekNextType();
    if  (nextVal_1 == "(") || (nextType_1 == "Identifier") {
      return this.parseArrowFunction()
    }
  }
  if  tokVal == "new" {
    return this.parseNewExpression()
  }
  if  tokVal == "import" {
    var importTok *Token= this.peek();
    this.advance();
    if  this.matchValue(".") {
      this.advance();
      if  this.matchValue("meta") {
        this.advance();
        var metaProp *TSNode= CreateNew_TSNode();
        metaProp.nodeType = "MetaProperty"; 
        metaProp.name = "import"; 
        metaProp.value = "meta"; 
        metaProp.start = importTok.start; 
        metaProp.line = importTok.line; 
        metaProp.col = importTok.col; 
        return metaProp
      }
    }
    if  this.matchValue("(") {
      this.advance();
      var source *TSNode= this.parseExpr();
      this.expectValue(")");
      var importExpr *TSNode= CreateNew_TSNode();
      importExpr.nodeType = "ImportExpression"; 
      importExpr.left.value = source;
      importExpr.left.has_value = true; /* detected as non-optional */
      importExpr.start = importTok.start; 
      importExpr.line = importTok.line; 
      importExpr.col = importTok.col; 
      return importExpr
    }
  }
  if  tokVal == "this" {
    this.advance();
    var thisExpr *TSNode= CreateNew_TSNode();
    thisExpr.nodeType = "ThisExpression"; 
    thisExpr.start = tok.start; 
    thisExpr.end = tok.end; 
    thisExpr.line = tok.line; 
    thisExpr.col = tok.col; 
    return thisExpr
  }
  if  this.quiet == false {
    fmt.Println( "Unexpected token: " + tokVal )
  }
  this.advance();
  var errId *TSNode= CreateNew_TSNode();
  errId.nodeType = "Identifier"; 
  errId.name = "error"; 
  return errId
}
func (this *TSParserSimple) parseTemplateLiteral () *TSNode {
  var node *TSNode= CreateNew_TSNode();
  node.nodeType = "TemplateLiteral"; 
  var tok *Token= this.peek();
  node.start = tok.start; 
  node.line = tok.line; 
  node.col = tok.col; 
  this.advance();
  var quasi *TSNode= CreateNew_TSNode();
  quasi.nodeType = "TemplateElement"; 
  quasi.value = tok.value; 
  node.children = append(node.children,quasi); 
  return node
}
func (this *TSParserSimple) parseArrayLiteral () *TSNode {
  var node *TSNode= CreateNew_TSNode();
  node.nodeType = "ArrayExpression"; 
  var tok *Token= this.peek();
  node.start = tok.start; 
  node.line = tok.line; 
  node.col = tok.col; 
  this.expectValue("[");
  for (this.matchValue("]") == false) && (this.isAtEnd() == false) {
    if  this.matchValue("...") {
      this.advance();
      var spreadArg *TSNode= this.parseExpr();
      var spread *TSNode= CreateNew_TSNode();
      spread.nodeType = "SpreadElement"; 
      spread.left.value = spreadArg;
      spread.left.has_value = true; /* detected as non-optional */
      node.children = append(node.children,spread); 
    } else {
      if  this.matchValue(",") {
      } else {
        var elem *TSNode= this.parseExpr();
        node.children = append(node.children,elem); 
      }
    }
    if  this.matchValue(",") {
      this.advance();
    }
  }
  this.expectValue("]");
  return node
}
func (this *TSParserSimple) parseObjectLiteral () *TSNode {
  var node *TSNode= CreateNew_TSNode();
  node.nodeType = "ObjectExpression"; 
  var tok *Token= this.peek();
  node.start = tok.start; 
  node.line = tok.line; 
  node.col = tok.col; 
  this.expectValue("{");
  for (this.matchValue("}") == false) && (this.isAtEnd() == false) {
    if  this.matchValue("...") {
      this.advance();
      var spreadArg *TSNode= this.parseExpr();
      var spread *TSNode= CreateNew_TSNode();
      spread.nodeType = "SpreadElement"; 
      spread.left.value = spreadArg;
      spread.left.has_value = true; /* detected as non-optional */
      node.children = append(node.children,spread); 
    } else {
      var prop *TSNode= CreateNew_TSNode();
      prop.nodeType = "Property"; 
      var isComputed bool= false;
      var isMethod bool= false;
      var isGetter bool= false;
      var isSetter bool= false;
      var currVal string= this.peekValue();
      var nextType string= this.peekNextType();
      var nextVal string= this.peekNextValue();
      if  currVal == "async" {
        if  ((nextType == "Identifier") || (nextVal == "[")) || (nextVal == "(") {
          this.advance();
          prop.async = true; 
          currVal = this.peekValue(); 
          nextType = this.peekNextType(); 
          nextVal = this.peekNextValue(); 
        }
      }
      if  currVal == "get" {
        if  (nextType == "Identifier") || (nextVal == "[") {
          this.advance();
          isGetter = true; 
          prop.kind = "get"; 
        }
      }
      if  currVal == "set" {
        if  (nextType == "Identifier") || (nextVal == "[") {
          this.advance();
          isSetter = true; 
          prop.kind = "set"; 
        }
      }
      var keyTok *Token= this.peek();
      if  this.matchValue("[") {
        this.advance();
        var keyExpr *TSNode= this.parseExpr();
        this.expectValue("]");
        prop.right.value = keyExpr;
        prop.right.has_value = true; /* detected as non-optional */
        isComputed = true; 
        prop.computed = true; 
      }
      if  this.matchType("Identifier") {
        prop.name = keyTok.value; 
        this.advance();
      }
      if  this.matchType("String") {
        prop.name = keyTok.value; 
        this.advance();
      }
      if  this.matchType("Number") {
        prop.name = keyTok.value; 
        this.advance();
      }
      if  this.matchValue("(") {
        isMethod = true; 
        prop.method = true; 
        var fnNode *TSNode= CreateNew_TSNode();
        fnNode.nodeType = "FunctionExpression"; 
        this.advance();
        for (this.matchValue(")") == false) && (this.isAtEnd() == false) {
          if  (int64(len(fnNode.params))) > int64(0) {
            this.expectValue(",");
          }
          fnNode.params = append(fnNode.params,this.parseParam()); 
        }
        this.expectValue(")");
        if  this.matchValue(":") {
          this.advance();
          fnNode.typeAnnotation.value = this.parseType();
          fnNode.typeAnnotation.has_value = true; /* detected as non-optional */
        }
        if  this.matchValue("{") {
          fnNode.body.value = this.parseBlock();
          fnNode.body.has_value = true; /* detected as non-optional */
        }
        prop.left.value = fnNode;
        prop.left.has_value = true; /* detected as non-optional */
        if  (isGetter == false) && (isSetter == false) {
          prop.kind = "init"; 
        }
      }
      if  isMethod == false {
        if  this.matchValue(":") {
          this.advance();
          var valueExpr *TSNode= this.parseExpr();
          prop.left.value = valueExpr;
          prop.left.has_value = true; /* detected as non-optional */
          prop.kind = "init"; 
        } else {
          if  isComputed == false {
            var shorthandVal *TSNode= CreateNew_TSNode();
            shorthandVal.nodeType = "Identifier"; 
            shorthandVal.name = prop.name; 
            prop.left.value = shorthandVal;
            prop.left.has_value = true; /* detected as non-optional */
            prop.shorthand = true; 
            prop.kind = "init"; 
          }
        }
      }
      node.children = append(node.children,prop); 
    }
    if  this.matchValue(",") {
      this.advance();
    }
  }
  this.expectValue("}");
  return node
}
func (this *TSParserSimple) parseParenOrArrow () *TSNode {
  /** unused:  startTok*/
  var savedPos int64= this.pos;
  var savedTok *Token= this.currentToken.value.(*Token);
  this.advance();
  var parenDepth int64= int64(1);
  for (parenDepth > int64(0)) && (this.isAtEnd() == false) {
    var v string= this.peekValue();
    if  v == "(" {
      parenDepth = parenDepth + int64(1); 
    }
    if  v == ")" {
      parenDepth = parenDepth - int64(1); 
    }
    if  parenDepth > int64(0) {
      this.advance();
    }
  }
  if  this.matchValue(")") == false {
    this.pos = savedPos; 
    this.currentToken.value = savedTok;
    this.currentToken.has_value = true; /* detected as non-optional */
    this.advance();
    var expr *TSNode= this.parseExpr();
    this.expectValue(")");
    return expr
  }
  this.advance();
  if  this.matchValue(":") {
    this.advance();
    this.parseType();
  }
  if  this.matchValue("=>") {
    this.pos = savedPos; 
    this.currentToken.value = savedTok;
    this.currentToken.has_value = true; /* detected as non-optional */
    return this.parseArrowFunction()
  }
  this.pos = savedPos; 
  this.currentToken.value = savedTok;
  this.currentToken.has_value = true; /* detected as non-optional */
  this.advance();
  var expr_1 *TSNode= this.parseExpr();
  this.expectValue(")");
  return expr_1
}
func (this *TSParserSimple) parseArrowFunction () *TSNode {
  var node *TSNode= CreateNew_TSNode();
  node.nodeType = "ArrowFunctionExpression"; 
  var startTok *Token= this.peek();
  node.start = startTok.start; 
  node.line = startTok.line; 
  node.col = startTok.col; 
  if  this.matchValue("async") {
    this.advance();
    node.kind = "async"; 
  }
  if  this.matchValue("(") {
    this.advance();
    for (this.matchValue(")") == false) && (this.isAtEnd() == false) {
      if  (int64(len(node.params))) > int64(0) {
        this.expectValue(",");
      }
      var param *TSNode= this.parseParam();
      node.params = append(node.params,param); 
    }
    this.expectValue(")");
  } else {
    var paramTok *Token= this.expect("Identifier");
    var param_1 *TSNode= CreateNew_TSNode();
    param_1.nodeType = "Parameter"; 
    param_1.name = paramTok.value; 
    node.params = append(node.params,param_1); 
  }
  if  this.matchValue(":") {
    this.advance();
    var retType *TSNode= this.parseType();
    node.typeAnnotation.value = retType;
    node.typeAnnotation.has_value = true; /* detected as non-optional */
  }
  this.expectValue("=>");
  if  this.matchValue("{") {
    var body *TSNode= this.parseBlock();
    node.body.value = body;
    node.body.has_value = true; /* detected as non-optional */
  } else {
    var body_1 *TSNode= this.parseExpr();
    node.body.value = body_1;
    node.body.has_value = true; /* detected as non-optional */
  }
  return node
}
func (this *TSParserSimple) parseNewExpression () *TSNode {
  var node *TSNode= CreateNew_TSNode();
  node.nodeType = "NewExpression"; 
  var tok *Token= this.peek();
  node.start = tok.start; 
  node.line = tok.line; 
  node.col = tok.col; 
  this.expectValue("new");
  if  this.matchValue(".") {
    this.advance();
    if  this.matchValue("target") {
      this.advance();
      node.nodeType = "MetaProperty"; 
      node.name = "new"; 
      node.value = "target"; 
      return node
    }
  }
  var callee *TSNode= this.parsePrimary();
  node.left.value = callee;
  node.left.has_value = true; /* detected as non-optional */
  if  this.matchValue("<") {
    var depth int64= int64(1);
    this.advance();
    for (depth > int64(0)) && (this.isAtEnd() == false) {
      var v string= this.peekValue();
      if  v == "<" {
        depth = depth + int64(1); 
      }
      if  v == ">" {
        depth = depth - int64(1); 
      }
      this.advance();
    }
  }
  if  this.matchValue("(") {
    this.advance();
    for (this.matchValue(")") == false) && (this.isAtEnd() == false) {
      if  (int64(len(node.children))) > int64(0) {
        this.expectValue(",");
      }
      var arg *TSNode= this.parseExpr();
      node.children = append(node.children,arg); 
    }
    this.expectValue(")");
  }
  return node
}
func (this *TSParserSimple) peekNextType () string {
  var nextPos int64= this.pos + int64(1);
  if  nextPos < (int64(len(this.tokens))) {
    var nextTok *Token= this.tokens[nextPos];
    return nextTok.tokenType
  }
  return "EOF"
}
func (this *TSParserSimple) peekAheadValue (offset int64) string {
  var aheadPos int64= this.pos + offset;
  if  aheadPos < (int64(len(this.tokens))) {
    var tok *Token= this.tokens[aheadPos];
    return tok.value
  }
  return ""
}
func (this *TSParserSimple) startsWithLowerCase (s string) bool {
  if  (int64(len([]rune(s)))) == int64(0) {
    return false
  }
  var code int64= int64([]rune(s)[int64(0)]);
  if  (code >= int64(97)) && (code <= int64(122)) {
    return true
  }
  return false
}
func (this *TSParserSimple) looksLikeGenericCall () bool {
  var depth int64= int64(1);
  var offset int64= int64(1);
  var maxLookahead int64= int64(20);
  for (depth > int64(0)) && (offset < maxLookahead) {
    var ahead string= this.peekAheadValue(offset);
    if  ahead == "" {
      return false
    }
    if  ahead == "<" {
      depth = depth + int64(1); 
    }
    if  ahead == ">" {
      depth = depth - int64(1); 
    }
    if  (((ahead == "{") || (ahead == "}")) || (ahead == ";")) || (ahead == "=>") {
      return false
    }
    offset = offset + int64(1); 
  }
  if  depth == int64(0) {
    var afterClose string= this.peekAheadValue(offset);
    if  afterClose == "(" {
      return true
    }
  }
  return false
}
func (this *TSParserSimple) parseJSXElement () *TSNode {
  var node *TSNode= CreateNew_TSNode();
  node.nodeType = "JSXElement"; 
  var tok *Token= this.peek();
  node.start = tok.start; 
  node.line = tok.line; 
  node.col = tok.col; 
  var opening *TSNode= this.parseJSXOpeningElement();
  node.left.value = opening;
  node.left.has_value = true; /* detected as non-optional */
  if  opening.kind == "self-closing" {
    node.nodeType = "JSXElement"; 
    return node
  }
  /** unused:  tagName*/
  for this.isAtEnd() == false {
    var v string= this.peekValue();
    if  v == "<" {
      var nextVal string= this.peekNextValue();
      if  nextVal == "/" {
        break;
      }
      var child *TSNode= this.parseJSXElement();
      node.children = append(node.children,child); 
    } else {
      if  v == "{" {
        var exprChild *TSNode= this.parseJSXExpressionContainer();
        node.children = append(node.children,exprChild); 
      } else {
        var t string= this.peekType();
        if  ((t != "EOF") && (v != "<")) && (v != "{") {
          var textChild *TSNode= this.parseJSXText();
          node.children = append(node.children,textChild); 
        } else {
          break;
        }
      }
    }
  }
  var closing *TSNode= this.parseJSXClosingElement();
  node.right.value = closing;
  node.right.has_value = true; /* detected as non-optional */
  return node
}
func (this *TSParserSimple) parseJSXOpeningElement () *TSNode {
  var node *TSNode= CreateNew_TSNode();
  node.nodeType = "JSXOpeningElement"; 
  var tok *Token= this.peek();
  node.start = tok.start; 
  node.line = tok.line; 
  node.col = tok.col; 
  this.expectValue("<");
  var tagName *TSNode= this.parseJSXElementName();
  node.name = tagName.name; 
  node.left.value = tagName;
  node.left.has_value = true; /* detected as non-optional */
  for this.isAtEnd() == false {
    var v string= this.peekValue();
    if  (v == ">") || (v == "/") {
      break;
    }
    var attr *TSNode= this.parseJSXAttribute();
    node.children = append(node.children,attr); 
  }
  if  this.matchValue("/") {
    this.advance();
    node.kind = "self-closing"; 
  }
  this.expectValue(">");
  return node
}
func (this *TSParserSimple) parseJSXClosingElement () *TSNode {
  var node *TSNode= CreateNew_TSNode();
  node.nodeType = "JSXClosingElement"; 
  var tok *Token= this.peek();
  node.start = tok.start; 
  node.line = tok.line; 
  node.col = tok.col; 
  this.expectValue("<");
  this.expectValue("/");
  var tagName *TSNode= this.parseJSXElementName();
  node.name = tagName.name; 
  node.left.value = tagName;
  node.left.has_value = true; /* detected as non-optional */
  this.expectValue(">");
  return node
}
func (this *TSParserSimple) parseJSXElementName () *TSNode {
  var node *TSNode= CreateNew_TSNode();
  node.nodeType = "JSXIdentifier"; 
  var tok *Token= this.peek();
  node.start = tok.start; 
  node.line = tok.line; 
  node.col = tok.col; 
  var namePart string= tok.value;
  this.advance();
  for this.matchValue(".") {
    this.advance();
    var nextTok *Token= this.peek();
    namePart = (namePart + ".") + nextTok.value; 
    this.advance();
    node.nodeType = "JSXMemberExpression"; 
  }
  node.name = namePart; 
  return node
}
func (this *TSParserSimple) parseJSXAttribute () *TSNode {
  var node *TSNode= CreateNew_TSNode();
  node.nodeType = "JSXAttribute"; 
  var tok *Token= this.peek();
  node.start = tok.start; 
  node.line = tok.line; 
  node.col = tok.col; 
  if  this.matchValue("{") {
    this.advance();
    if  this.matchValue("...") {
      this.advance();
      node.nodeType = "JSXSpreadAttribute"; 
      var arg *TSNode= this.parseExpr();
      node.left.value = arg;
      node.left.has_value = true; /* detected as non-optional */
      this.expectValue("}");
      return node
    }
  }
  var attrName string= tok.value;
  node.name = attrName; 
  this.advance();
  if  this.matchValue("=") {
    this.advance();
    var valTok string= this.peekValue();
    if  valTok == "{" {
      var exprValue *TSNode= this.parseJSXExpressionContainer();
      node.right.value = exprValue;
      node.right.has_value = true; /* detected as non-optional */
    } else {
      var strTok *Token= this.peek();
      var strNode *TSNode= CreateNew_TSNode();
      strNode.nodeType = "StringLiteral"; 
      strNode.value = strTok.value; 
      strNode.start = strTok.start; 
      strNode.end = strTok.end; 
      strNode.line = strTok.line; 
      strNode.col = strTok.col; 
      this.advance();
      node.right.value = strNode;
      node.right.has_value = true; /* detected as non-optional */
    }
  }
  return node
}
func (this *TSParserSimple) parseJSXExpressionContainer () *TSNode {
  var node *TSNode= CreateNew_TSNode();
  node.nodeType = "JSXExpressionContainer"; 
  var tok *Token= this.peek();
  node.start = tok.start; 
  node.line = tok.line; 
  node.col = tok.col; 
  this.expectValue("{");
  if  this.matchValue("}") {
    var empty *TSNode= CreateNew_TSNode();
    empty.nodeType = "JSXEmptyExpression"; 
    node.left.value = empty;
    node.left.has_value = true; /* detected as non-optional */
  } else {
    var expr *TSNode= this.parseExpr();
    node.left.value = expr;
    node.left.has_value = true; /* detected as non-optional */
  }
  this.expectValue("}");
  return node
}
func (this *TSParserSimple) parseJSXText () *TSNode {
  var node *TSNode= CreateNew_TSNode();
  node.nodeType = "JSXText"; 
  var tok *Token= this.peek();
  node.start = tok.start; 
  node.line = tok.line; 
  node.col = tok.col; 
  node.value = tok.value; 
  this.advance();
  return node
}
func (this *TSParserSimple) parseJSXFragment () *TSNode {
  var node *TSNode= CreateNew_TSNode();
  node.nodeType = "JSXFragment"; 
  var tok *Token= this.peek();
  node.start = tok.start; 
  node.line = tok.line; 
  node.col = tok.col; 
  this.expectValue("<");
  this.expectValue(">");
  for this.isAtEnd() == false {
    var v string= this.peekValue();
    if  v == "<" {
      var nextVal string= this.peekNextValue();
      if  nextVal == "/" {
        break;
      }
      var child *TSNode= this.parseJSXElement();
      node.children = append(node.children,child); 
    } else {
      if  v == "{" {
        var exprChild *TSNode= this.parseJSXExpressionContainer();
        node.children = append(node.children,exprChild); 
      } else {
        var t string= this.peekType();
        if  ((t != "EOF") && (v != "<")) && (v != "{") {
          var textChild *TSNode= this.parseJSXText();
          node.children = append(node.children,textChild); 
        } else {
          break;
        }
      }
    }
  }
  this.expectValue("<");
  this.expectValue("/");
  this.expectValue(">");
  return node
}
type EVGUnit struct { 
  value float64 `json:"value"` 
  unitType int64 `json:"unitType"` 
  isSet bool `json:"isSet"` 
  pixels float64 `json:"pixels"` 
}

func CreateNew_EVGUnit() *EVGUnit {
  me := new(EVGUnit)
  me.value = 0.0
  me.unitType = int64(0)
  me.isSet = false
  me.pixels = 0.0
  me.value = 0.0; 
  me.unitType = int64(0); 
  me.isSet = false; 
  me.pixels = 0.0; 
  return me;
}
func EVGUnit_static_create(val float64, uType int64) *EVGUnit {
  var unit *EVGUnit= CreateNew_EVGUnit();
  unit.value = val; 
  unit.unitType = uType; 
  unit.isSet = true; 
  return unit
}
func EVGUnit_static_px(val float64) *EVGUnit {
  return EVGUnit_static_create(val, int64(0))
}
func EVGUnit_static_percent(val float64) *EVGUnit {
  return EVGUnit_static_create(val, int64(1))
}
func EVGUnit_static_em(val float64) *EVGUnit {
  return EVGUnit_static_create(val, int64(2))
}
func EVGUnit_static_heightPercent(val float64) *EVGUnit {
  return EVGUnit_static_create(val, int64(3))
}
func EVGUnit_static_fill() *EVGUnit {
  return EVGUnit_static_create(100.0, int64(4))
}
func EVGUnit_static_unset() *EVGUnit {
  var unit *EVGUnit= CreateNew_EVGUnit();
  unit.isSet = false; 
  return unit
}
func EVGUnit_static_parse(str string) *EVGUnit {
  var unit *EVGUnit= CreateNew_EVGUnit();
  var trimmed string= strings.TrimSpace(str);
  var __len int64= int64(len([]rune(trimmed)));
  if  __len == int64(0) {
    return unit
  }
  if  trimmed == "fill" {
    unit.value = 100.0; 
    unit.unitType = int64(4); 
    unit.isSet = true; 
    return unit
  }
  var lastChar int64= int64([]rune(trimmed)[(__len - int64(1))]);
  if  lastChar == int64(37) {
    var numStr string= string([]rune(trimmed)[int64(0):(__len - int64(1))]);
    var numVal *GoNullable = new(GoNullable); 
    numVal = r_str_2_d64(numStr);
    unit.value = numVal.value.(float64); 
    unit.unitType = int64(1); 
    unit.isSet = true; 
    return unit
  }
  if  __len >= int64(2) {
    var suffix string= string([]rune(trimmed)[(__len - int64(2)):__len]);
    if  suffix == "em" {
      var numStr_1 string= string([]rune(trimmed)[int64(0):(__len - int64(2))]);
      var numVal_1 *GoNullable = new(GoNullable); 
      numVal_1 = r_str_2_d64(numStr_1);
      unit.value = numVal_1.value.(float64); 
      unit.unitType = int64(2); 
      unit.isSet = true; 
      return unit
    }
    if  suffix == "px" {
      var numStr_2 string= string([]rune(trimmed)[int64(0):(__len - int64(2))]);
      var numVal_2 *GoNullable = new(GoNullable); 
      numVal_2 = r_str_2_d64(numStr_2);
      unit.value = numVal_2.value.(float64); 
      unit.pixels = unit.value; 
      unit.unitType = int64(0); 
      unit.isSet = true; 
      return unit
    }
    if  suffix == "hp" {
      var numStr_3 string= string([]rune(trimmed)[int64(0):(__len - int64(2))]);
      var numVal_3 *GoNullable = new(GoNullable); 
      numVal_3 = r_str_2_d64(numStr_3);
      unit.value = numVal_3.value.(float64); 
      unit.unitType = int64(3); 
      unit.isSet = true; 
      return unit
    }
  }
  var numVal_4 *GoNullable = new(GoNullable); 
  numVal_4 = r_str_2_d64(trimmed);
  unit.value = numVal_4.value.(float64); 
  unit.pixels = unit.value; 
  unit.unitType = int64(0); 
  unit.isSet = true; 
  return unit
}
func (this *EVGUnit) resolve (parentSize float64, fontSize float64) () {
  if  this.isSet == false {
    this.pixels = 0.0; 
    return
  }
  if  this.unitType == int64(0) {
    this.pixels = this.value; 
    return
  }
  if  this.unitType == int64(1) {
    this.pixels = (parentSize * this.value) / 100.0; 
    return
  }
  if  this.unitType == int64(2) {
    this.pixels = fontSize * this.value; 
    return
  }
  if  this.unitType == int64(3) {
    this.pixels = (parentSize * this.value) / 100.0; 
    return
  }
  if  this.unitType == int64(4) {
    this.pixels = parentSize; 
    return
  }
  this.pixels = this.value; 
}
func (this *EVGUnit) resolveForHeight (parentWidth float64, parentHeight float64, fontSize float64) () {
  if  this.isSet == false {
    this.pixels = 0.0; 
    return
  }
  if  this.unitType == int64(3) {
    this.pixels = (parentHeight * this.value) / 100.0; 
    return
  }
  if  this.unitType == int64(1) {
    this.pixels = (parentHeight * this.value) / 100.0; 
    return
  }
  this.resolve(parentWidth, fontSize);
}
func (this *EVGUnit) resolveWithHeight (parentWidth float64, parentHeight float64, fontSize float64) () {
  if  this.isSet == false {
    this.pixels = 0.0; 
    return
  }
  if  this.unitType == int64(3) {
    this.pixels = (parentHeight * this.value) / 100.0; 
    return
  }
  this.resolve(parentWidth, fontSize);
}
func (this *EVGUnit) isPixels () bool {
  return this.unitType == int64(0)
}
func (this *EVGUnit) isPercent () bool {
  return this.unitType == int64(1)
}
func (this *EVGUnit) isEm () bool {
  return this.unitType == int64(2)
}
func (this *EVGUnit) isHeightPercent () bool {
  return this.unitType == int64(3)
}
func (this *EVGUnit) isFill () bool {
  return this.unitType == int64(4)
}
func (this *EVGUnit) toString () string {
  if  this.isSet == false {
    return "unset"
  }
  if  this.unitType == int64(0) {
    return (strconv.FormatFloat(this.value,'f', 6, 64)) + "px"
  }
  if  this.unitType == int64(1) {
    return (strconv.FormatFloat(this.value,'f', 6, 64)) + "%"
  }
  if  this.unitType == int64(2) {
    return (strconv.FormatFloat(this.value,'f', 6, 64)) + "em"
  }
  if  this.unitType == int64(3) {
    return (strconv.FormatFloat(this.value,'f', 6, 64)) + "hp"
  }
  if  this.unitType == int64(4) {
    return "fill"
  }
  return strconv.FormatFloat(this.value,'f', 6, 64)
}
type EVGColor struct { 
  r float64 `json:"r"` 
  g float64 `json:"g"` 
  b float64 `json:"b"` 
  a float64 `json:"a"` 
  isSet bool `json:"isSet"` 
}

func CreateNew_EVGColor() *EVGColor {
  me := new(EVGColor)
  me.r = 0.0
  me.g = 0.0
  me.b = 0.0
  me.a = 1.0
  me.isSet = true
  me.r = 0.0; 
  me.g = 0.0; 
  me.b = 0.0; 
  me.a = 1.0; 
  me.isSet = true; 
  return me;
}
func EVGColor_static_create(red float64, green float64, blue float64, alpha float64) *EVGColor {
  var c *EVGColor= CreateNew_EVGColor();
  c.r = red; 
  c.g = green; 
  c.b = blue; 
  c.a = alpha; 
  c.isSet = true; 
  return c
}
func EVGColor_static_rgb(red int64, green int64, blue int64) *EVGColor {
  return EVGColor_static_create((float64( red )), (float64( green )), (float64( blue )), 1.0)
}
func EVGColor_static_rgba(red int64, green int64, blue int64, alpha float64) *EVGColor {
  return EVGColor_static_create((float64( red )), (float64( green )), (float64( blue )), alpha)
}
func EVGColor_static_noColor() *EVGColor {
  var c *EVGColor= CreateNew_EVGColor();
  c.isSet = false; 
  return c
}
func EVGColor_static_black() *EVGColor {
  return EVGColor_static_rgb(int64(0), int64(0), int64(0))
}
func EVGColor_static_white() *EVGColor {
  return EVGColor_static_rgb(int64(255), int64(255), int64(255))
}
func EVGColor_static_transparent() *EVGColor {
  return EVGColor_static_rgba(int64(0), int64(0), int64(0), 0.0)
}
func EVGColor_static_hexDigit(ch int64) int64 {
  if  (ch >= int64(48)) && (ch <= int64(57)) {
    return ch - int64(48)
  }
  if  (ch >= int64(65)) && (ch <= int64(70)) {
    return (ch - int64(65)) + int64(10)
  }
  if  (ch >= int64(97)) && (ch <= int64(102)) {
    return (ch - int64(97)) + int64(10)
  }
  return int64(0)
}
func EVGColor_static_parseHex(hex string) *EVGColor {
  var c *EVGColor= CreateNew_EVGColor();
  var __len int64= int64(len([]rune(hex)));
  var start int64= int64(0);
  if  __len > int64(0) {
    var firstChar int64= int64([]rune(hex)[int64(0)]);
    if  firstChar == int64(35) {
      start = int64(1); 
      __len = __len - int64(1); 
    }
  }
  if  __len == int64(3) {
    var r1 int64= EVGColor_static_hexDigit((int64([]rune(hex)[start])));
    var g1 int64= EVGColor_static_hexDigit((int64([]rune(hex)[(start + int64(1))])));
    var b1 int64= EVGColor_static_hexDigit((int64([]rune(hex)[(start + int64(2))])));
    c.r = float64( ((r1 * int64(16)) + r1) ); 
    c.g = float64( ((g1 * int64(16)) + g1) ); 
    c.b = float64( ((b1 * int64(16)) + b1) ); 
    c.a = 1.0; 
    c.isSet = true; 
    return c
  }
  if  __len == int64(6) {
    var r1_1 int64= EVGColor_static_hexDigit((int64([]rune(hex)[start])));
    var r2 int64= EVGColor_static_hexDigit((int64([]rune(hex)[(start + int64(1))])));
    var g1_1 int64= EVGColor_static_hexDigit((int64([]rune(hex)[(start + int64(2))])));
    var g2 int64= EVGColor_static_hexDigit((int64([]rune(hex)[(start + int64(3))])));
    var b1_1 int64= EVGColor_static_hexDigit((int64([]rune(hex)[(start + int64(4))])));
    var b2 int64= EVGColor_static_hexDigit((int64([]rune(hex)[(start + int64(5))])));
    c.r = float64( ((r1_1 * int64(16)) + r2) ); 
    c.g = float64( ((g1_1 * int64(16)) + g2) ); 
    c.b = float64( ((b1_1 * int64(16)) + b2) ); 
    c.a = 1.0; 
    c.isSet = true; 
    return c
  }
  if  __len == int64(8) {
    var r1_2 int64= EVGColor_static_hexDigit((int64([]rune(hex)[start])));
    var r2_1 int64= EVGColor_static_hexDigit((int64([]rune(hex)[(start + int64(1))])));
    var g1_2 int64= EVGColor_static_hexDigit((int64([]rune(hex)[(start + int64(2))])));
    var g2_1 int64= EVGColor_static_hexDigit((int64([]rune(hex)[(start + int64(3))])));
    var b1_2 int64= EVGColor_static_hexDigit((int64([]rune(hex)[(start + int64(4))])));
    var b2_1 int64= EVGColor_static_hexDigit((int64([]rune(hex)[(start + int64(5))])));
    var a1 int64= EVGColor_static_hexDigit((int64([]rune(hex)[(start + int64(6))])));
    var a2 int64= EVGColor_static_hexDigit((int64([]rune(hex)[(start + int64(7))])));
    c.r = float64( ((r1_2 * int64(16)) + r2_1) ); 
    c.g = float64( ((g1_2 * int64(16)) + g2_1) ); 
    c.b = float64( ((b1_2 * int64(16)) + b2_1) ); 
    c.a = (float64( ((a1 * int64(16)) + a2) )) / 255.0; 
    c.isSet = true; 
    return c
  }
  c.isSet = false; 
  return c
}
func EVGColor_static_hue2rgb(p float64, q float64, tt float64) float64 {
  var t float64= tt;
  if  t < 0.0 {
    t = t + 1.0; 
  }
  if  t > 1.0 {
    t = t - 1.0; 
  }
  if  t < (1.0 / 6.0) {
    return p + (((q - p) * 6.0) * t)
  }
  if  t < (1.0 / 2.0) {
    return q
  }
  if  t < (2.0 / 3.0) {
    return p + (((q - p) * ((2.0 / 3.0) - t)) * 6.0)
  }
  return p
}
func EVGColor_static_hslToRgb(h float64, s float64, l float64) *EVGColor {
  var c *EVGColor= CreateNew_EVGColor();
  var hNorm float64= h / 360.0;
  var sNorm float64= s / 100.0;
  var lNorm float64= l / 100.0;
  if  sNorm == 0.0 {
    var gray float64= lNorm * 255.0;
    c.r = gray; 
    c.g = gray; 
    c.b = gray; 
  } else {
    var q float64= 0.0;
    if  lNorm < 0.5 {
      q = lNorm * (1.0 + sNorm); 
    } else {
      q = (lNorm + sNorm) - (lNorm * sNorm); 
    }
    var p float64= (2.0 * lNorm) - q;
    c.r = EVGColor_static_hue2rgb(p, q, (hNorm + (1.0 / 3.0))) * 255.0; 
    c.g = EVGColor_static_hue2rgb(p, q, hNorm) * 255.0; 
    c.b = EVGColor_static_hue2rgb(p, q, (hNorm - (1.0 / 3.0))) * 255.0; 
  }
  c.a = 1.0; 
  c.isSet = true; 
  return c
}
func EVGColor_static_parseNumber(str string) float64 {
  var val *GoNullable = new(GoNullable); 
  val = r_str_2_d64((strings.TrimSpace(str)));
  return val.value.(float64)
}
func EVGColor_static_parse(str string) *EVGColor {
  var trimmed string= strings.TrimSpace(str);
  var __len int64= int64(len([]rune(trimmed)));
  if  __len == int64(0) {
    return EVGColor_static_noColor()
  }
  var firstChar int64= int64([]rune(trimmed)[int64(0)]);
  if  firstChar == int64(35) {
    return EVGColor_static_parseHex(trimmed)
  }
  if  __len >= int64(4) {
    var prefix string= string([]rune(trimmed)[int64(0):int64(4)]);
    if  prefix == "rgba" {
      return EVGColor_static_parseRgba(trimmed)
    }
    var prefix3 string= string([]rune(trimmed)[int64(0):int64(3)]);
    if  prefix3 == "rgb" {
      return EVGColor_static_parseRgb(trimmed)
    }
    if  prefix3 == "hsl" {
      return EVGColor_static_parseHsl(trimmed)
    }
  }
  return EVGColor_static_parseNamed(trimmed)
}
func EVGColor_static_parseRgb(str string) *EVGColor {
  var c *EVGColor= CreateNew_EVGColor();
  var __len int64= int64(len([]rune(str)));
  var start int64= int64(0);
  var i int64= int64(0);
  for i < __len {
    var ch int64= int64([]rune(str)[i]);
    if  ch == int64(40) {
      start = i + int64(1); 
    }
    i = i + int64(1); 
  }
  var end int64= __len - int64(1);
  i = __len - int64(1); 
  for i >= int64(0) {
    var ch_1 int64= int64([]rune(str)[i]);
    if  ch_1 == int64(41) {
      end = i; 
    }
    i = i - int64(1); 
  }
  var content string= string([]rune(str)[start:end]);
  var parts []string = make([]string, 0);
  var current string= "";
  i = int64(0); 
  var contentLen int64= int64(len([]rune(content)));
  for i < contentLen {
    var ch_2 int64= int64([]rune(content)[i]);
    if  (ch_2 == int64(44)) || (ch_2 == int64(32)) {
      var trimPart string= strings.TrimSpace(current);
      if  (int64(len([]rune(trimPart)))) > int64(0) {
        parts = append(parts,trimPart); 
      }
      current = ""; 
    } else {
      current = current + (string([]rune{rune(ch_2)})); 
    }
    i = i + int64(1); 
  }
  var trimPart_1 string= strings.TrimSpace(current);
  if  (int64(len([]rune(trimPart_1)))) > int64(0) {
    parts = append(parts,trimPart_1); 
  }
  if  (int64(len(parts))) >= int64(3) {
    c.r = EVGColor_static_parseNumber((parts[int64(0)])); 
    c.g = EVGColor_static_parseNumber((parts[int64(1)])); 
    c.b = EVGColor_static_parseNumber((parts[int64(2)])); 
    c.a = 1.0; 
    c.isSet = true; 
  }
  return c
}
func EVGColor_static_parseRgba(str string) *EVGColor {
  var c *EVGColor= EVGColor_static_parseRgb(str);
  var __len int64= int64(len([]rune(str)));
  var start int64= int64(0);
  var end int64= __len - int64(1);
  var i int64= int64(0);
  for i < __len {
    var ch int64= int64([]rune(str)[i]);
    if  ch == int64(40) {
      start = i + int64(1); 
    }
    if  ch == int64(41) {
      end = i; 
    }
    i = i + int64(1); 
  }
  var content string= string([]rune(str)[start:end]);
  var parts []string = make([]string, 0);
  var current string= "";
  i = int64(0); 
  var contentLen int64= int64(len([]rune(content)));
  for i < contentLen {
    var ch_1 int64= int64([]rune(content)[i]);
    if  (ch_1 == int64(44)) || (ch_1 == int64(32)) {
      var trimPart string= strings.TrimSpace(current);
      if  (int64(len([]rune(trimPart)))) > int64(0) {
        parts = append(parts,trimPart); 
      }
      current = ""; 
    } else {
      current = current + (string([]rune{rune(ch_1)})); 
    }
    i = i + int64(1); 
  }
  var trimPart_1 string= strings.TrimSpace(current);
  if  (int64(len([]rune(trimPart_1)))) > int64(0) {
    parts = append(parts,trimPart_1); 
  }
  if  (int64(len(parts))) >= int64(4) {
    c.r = EVGColor_static_parseNumber((parts[int64(0)])); 
    c.g = EVGColor_static_parseNumber((parts[int64(1)])); 
    c.b = EVGColor_static_parseNumber((parts[int64(2)])); 
    c.a = EVGColor_static_parseNumber((parts[int64(3)])); 
    c.isSet = true; 
  }
  return c
}
func EVGColor_static_parseHsl(str string) *EVGColor {
  var __len int64= int64(len([]rune(str)));
  var start int64= int64(0);
  var end int64= __len - int64(1);
  var i int64= int64(0);
  for i < __len {
    var ch int64= int64([]rune(str)[i]);
    if  ch == int64(40) {
      start = i + int64(1); 
    }
    if  ch == int64(41) {
      end = i; 
    }
    i = i + int64(1); 
  }
  var content string= string([]rune(str)[start:end]);
  var parts []string = make([]string, 0);
  var current string= "";
  i = int64(0); 
  var contentLen int64= int64(len([]rune(content)));
  for i < contentLen {
    var ch_1 int64= int64([]rune(content)[i]);
    if  (ch_1 == int64(44)) || (ch_1 == int64(32)) {
      var trimPart string= strings.TrimSpace(current);
      if  (int64(len([]rune(trimPart)))) > int64(0) {
        parts = append(parts,trimPart); 
      }
      current = ""; 
    } else {
      current = current + (string([]rune{rune(ch_1)})); 
    }
    i = i + int64(1); 
  }
  var trimPart_1 string= strings.TrimSpace(current);
  if  (int64(len([]rune(trimPart_1)))) > int64(0) {
    parts = append(parts,trimPart_1); 
  }
  if  (int64(len(parts))) >= int64(3) {
    var h float64= EVGColor_static_parseNumber((parts[int64(0)]));
    var s float64= EVGColor_static_parseNumber((parts[int64(1)]));
    var l float64= EVGColor_static_parseNumber((parts[int64(2)]));
    var c *EVGColor= EVGColor_static_hslToRgb(h, s, l);
    if  (int64(len(parts))) >= int64(4) {
      c.a = EVGColor_static_parseNumber((parts[int64(3)])); 
    }
    return c
  }
  return EVGColor_static_noColor()
}
func EVGColor_static_parseNamed(name string) *EVGColor {
  var lower string= "";
  var __len int64= int64(len([]rune(name)));
  var i int64= int64(0);
  for i < __len {
    var ch int64= int64([]rune(name)[i]);
    if  (ch >= int64(65)) && (ch <= int64(90)) {
      lower = lower + (string([]rune{rune((ch + int64(32)))})); 
    } else {
      lower = lower + (string([]rune{rune(ch)})); 
    }
    i = i + int64(1); 
  }
  if  lower == "black" {
    return EVGColor_static_rgb(int64(0), int64(0), int64(0))
  }
  if  lower == "white" {
    return EVGColor_static_rgb(int64(255), int64(255), int64(255))
  }
  if  lower == "red" {
    return EVGColor_static_rgb(int64(255), int64(0), int64(0))
  }
  if  lower == "green" {
    return EVGColor_static_rgb(int64(0), int64(128), int64(0))
  }
  if  lower == "blue" {
    return EVGColor_static_rgb(int64(0), int64(0), int64(255))
  }
  if  lower == "yellow" {
    return EVGColor_static_rgb(int64(255), int64(255), int64(0))
  }
  if  lower == "cyan" {
    return EVGColor_static_rgb(int64(0), int64(255), int64(255))
  }
  if  lower == "magenta" {
    return EVGColor_static_rgb(int64(255), int64(0), int64(255))
  }
  if  lower == "gray" {
    return EVGColor_static_rgb(int64(128), int64(128), int64(128))
  }
  if  lower == "grey" {
    return EVGColor_static_rgb(int64(128), int64(128), int64(128))
  }
  if  lower == "orange" {
    return EVGColor_static_rgb(int64(255), int64(165), int64(0))
  }
  if  lower == "purple" {
    return EVGColor_static_rgb(int64(128), int64(0), int64(128))
  }
  if  lower == "pink" {
    return EVGColor_static_rgb(int64(255), int64(192), int64(203))
  }
  if  lower == "brown" {
    return EVGColor_static_rgb(int64(165), int64(42), int64(42))
  }
  if  lower == "transparent" {
    return EVGColor_static_transparent()
  }
  if  lower == "none" {
    return EVGColor_static_noColor()
  }
  return EVGColor_static_noColor()
}
func (this *EVGColor) red () int64 {
  if  this.r > 255.0 {
    return int64(255)
  }
  if  this.r < 0.0 {
    return int64(0)
  }
  return int64(this.r)
}
func (this *EVGColor) green () int64 {
  if  this.g > 255.0 {
    return int64(255)
  }
  if  this.g < 0.0 {
    return int64(0)
  }
  return int64(this.g)
}
func (this *EVGColor) blue () int64 {
  if  this.b > 255.0 {
    return int64(255)
  }
  if  this.b < 0.0 {
    return int64(0)
  }
  return int64(this.b)
}
func (this *EVGColor) alpha () float64 {
  if  this.a < 0.0 {
    return 0.0
  }
  if  this.a > 1.0 {
    return 1.0
  }
  return this.a
}
func (this *EVGColor) toCSSString () string {
  if  this.isSet == false {
    return "none"
  }
  if  this.a < 1.0 {
    return ((((((("rgba(" + (strconv.FormatInt(this.red(), 10))) + ",") + (strconv.FormatInt(this.green(), 10))) + ",") + (strconv.FormatInt(this.blue(), 10))) + ",") + (strconv.FormatFloat(this.alpha(),'f', 6, 64))) + ")"
  }
  return ((((("rgb(" + (strconv.FormatInt(this.red(), 10))) + ",") + (strconv.FormatInt(this.green(), 10))) + ",") + (strconv.FormatInt(this.blue(), 10))) + ")"
}
func (this *EVGColor) toHexString () string {
  if  this.isSet == false {
    return "none"
  }
  var hexChars string= "0123456789ABCDEF";
  var rH int64= this.red();
  var gH int64= this.green();
  var bH int64= this.blue();
  var r1D float64= (float64( rH )) / 16.0;
  var r1 int64= int64(r1D);
  var r2 int64= rH % int64(16);
  var g1D float64= (float64( gH )) / 16.0;
  var g1 int64= int64(g1D);
  var g2 int64= gH % int64(16);
  var b1D float64= (float64( bH )) / 16.0;
  var b1 int64= int64(b1D);
  var b2 int64= bH % int64(16);
  return ((((("#" + (string([]rune{rune((int64([]rune(hexChars)[r1])))}))) + (string([]rune{rune((int64([]rune(hexChars)[r2])))}))) + (string([]rune{rune((int64([]rune(hexChars)[g1])))}))) + (string([]rune{rune((int64([]rune(hexChars)[g2])))}))) + (string([]rune{rune((int64([]rune(hexChars)[b1])))}))) + (string([]rune{rune((int64([]rune(hexChars)[b2])))}))
}
func (this *EVGColor) toPDFColorString () string {
  if  this.isSet == false {
    return ""
  }
  var rN float64= this.r / 255.0;
  var gN float64= this.g / 255.0;
  var bN float64= this.b / 255.0;
  return ((((strconv.FormatFloat(rN,'f', 6, 64)) + " ") + (strconv.FormatFloat(gN,'f', 6, 64))) + " ") + (strconv.FormatFloat(bN,'f', 6, 64))
}
func (this *EVGColor) withAlpha (newAlpha float64) *EVGColor {
  return EVGColor_static_create(this.r, this.g, this.b, newAlpha)
}
func (this *EVGColor) lighten (amount float64) *EVGColor {
  var newR float64= this.r + ((255.0 - this.r) * amount);
  var newG float64= this.g + ((255.0 - this.g) * amount);
  var newB float64= this.b + ((255.0 - this.b) * amount);
  return EVGColor_static_create(newR, newG, newB, this.a)
}
func (this *EVGColor) darken (amount float64) *EVGColor {
  var newR float64= this.r * (1.0 - amount);
  var newG float64= this.g * (1.0 - amount);
  var newB float64= this.b * (1.0 - amount);
  return EVGColor_static_create(newR, newG, newB, this.a)
}
type EVGBox struct { 
  marginTop *GoNullable `json:"marginTop"` 
  marginRight *GoNullable `json:"marginRight"` 
  marginBottom *GoNullable `json:"marginBottom"` 
  marginLeft *GoNullable `json:"marginLeft"` 
  paddingTop *GoNullable `json:"paddingTop"` 
  paddingRight *GoNullable `json:"paddingRight"` 
  paddingBottom *GoNullable `json:"paddingBottom"` 
  paddingLeft *GoNullable `json:"paddingLeft"` 
  borderWidth *GoNullable `json:"borderWidth"` 
  borderColor *GoNullable `json:"borderColor"` 
  borderRadius *GoNullable `json:"borderRadius"` 
  marginTopPx float64 `json:"marginTopPx"` 
  marginRightPx float64 `json:"marginRightPx"` 
  marginBottomPx float64 `json:"marginBottomPx"` 
  marginLeftPx float64 `json:"marginLeftPx"` 
  paddingTopPx float64 `json:"paddingTopPx"` 
  paddingRightPx float64 `json:"paddingRightPx"` 
  paddingBottomPx float64 `json:"paddingBottomPx"` 
  paddingLeftPx float64 `json:"paddingLeftPx"` 
  borderWidthPx float64 `json:"borderWidthPx"` 
  borderRadiusPx float64 `json:"borderRadiusPx"` 
}

func CreateNew_EVGBox() *EVGBox {
  me := new(EVGBox)
  me.marginTopPx = 0.0
  me.marginRightPx = 0.0
  me.marginBottomPx = 0.0
  me.marginLeftPx = 0.0
  me.paddingTopPx = 0.0
  me.paddingRightPx = 0.0
  me.paddingBottomPx = 0.0
  me.paddingLeftPx = 0.0
  me.borderWidthPx = 0.0
  me.borderRadiusPx = 0.0
  me.marginTop = new(GoNullable);
  me.marginRight = new(GoNullable);
  me.marginBottom = new(GoNullable);
  me.marginLeft = new(GoNullable);
  me.paddingTop = new(GoNullable);
  me.paddingRight = new(GoNullable);
  me.paddingBottom = new(GoNullable);
  me.paddingLeft = new(GoNullable);
  me.borderWidth = new(GoNullable);
  me.borderColor = new(GoNullable);
  me.borderRadius = new(GoNullable);
  me.marginTop.value = EVGUnit_static_unset();
  me.marginTop.has_value = true; /* detected as non-optional */
  me.marginRight.value = EVGUnit_static_unset();
  me.marginRight.has_value = true; /* detected as non-optional */
  me.marginBottom.value = EVGUnit_static_unset();
  me.marginBottom.has_value = true; /* detected as non-optional */
  me.marginLeft.value = EVGUnit_static_unset();
  me.marginLeft.has_value = true; /* detected as non-optional */
  me.paddingTop.value = EVGUnit_static_unset();
  me.paddingTop.has_value = true; /* detected as non-optional */
  me.paddingRight.value = EVGUnit_static_unset();
  me.paddingRight.has_value = true; /* detected as non-optional */
  me.paddingBottom.value = EVGUnit_static_unset();
  me.paddingBottom.has_value = true; /* detected as non-optional */
  me.paddingLeft.value = EVGUnit_static_unset();
  me.paddingLeft.has_value = true; /* detected as non-optional */
  me.borderWidth.value = EVGUnit_static_unset();
  me.borderWidth.has_value = true; /* detected as non-optional */
  me.borderColor.value = EVGColor_static_noColor();
  me.borderColor.has_value = true; /* detected as non-optional */
  me.borderRadius.value = EVGUnit_static_unset();
  me.borderRadius.has_value = true; /* detected as non-optional */
  return me;
}
func (this *EVGBox) setMargin (all *EVGUnit) () {
  this.marginTop.value = all;
  this.marginTop.has_value = true; /* detected as non-optional */
  this.marginRight.value = all;
  this.marginRight.has_value = true; /* detected as non-optional */
  this.marginBottom.value = all;
  this.marginBottom.has_value = true; /* detected as non-optional */
  this.marginLeft.value = all;
  this.marginLeft.has_value = true; /* detected as non-optional */
}
func (this *EVGBox) setMarginValues (top *EVGUnit, right *EVGUnit, bottom *EVGUnit, left *EVGUnit) () {
  this.marginTop.value = top;
  this.marginTop.has_value = true; /* detected as non-optional */
  this.marginRight.value = right;
  this.marginRight.has_value = true; /* detected as non-optional */
  this.marginBottom.value = bottom;
  this.marginBottom.has_value = true; /* detected as non-optional */
  this.marginLeft.value = left;
  this.marginLeft.has_value = true; /* detected as non-optional */
}
func (this *EVGBox) setPadding (all *EVGUnit) () {
  this.paddingTop.value = all;
  this.paddingTop.has_value = true; /* detected as non-optional */
  this.paddingRight.value = all;
  this.paddingRight.has_value = true; /* detected as non-optional */
  this.paddingBottom.value = all;
  this.paddingBottom.has_value = true; /* detected as non-optional */
  this.paddingLeft.value = all;
  this.paddingLeft.has_value = true; /* detected as non-optional */
}
func (this *EVGBox) setPaddingValues (top *EVGUnit, right *EVGUnit, bottom *EVGUnit, left *EVGUnit) () {
  this.paddingTop.value = top;
  this.paddingTop.has_value = true; /* detected as non-optional */
  this.paddingRight.value = right;
  this.paddingRight.has_value = true; /* detected as non-optional */
  this.paddingBottom.value = bottom;
  this.paddingBottom.has_value = true; /* detected as non-optional */
  this.paddingLeft.value = left;
  this.paddingLeft.has_value = true; /* detected as non-optional */
}
func (this *EVGBox) resolveUnits (parentWidth float64, parentHeight float64, fontSize float64) () {
  this.marginTop.value.(*EVGUnit).resolve(parentHeight, fontSize);
  this.marginTopPx = this.marginTop.value.(*EVGUnit).pixels; 
  this.marginRight.value.(*EVGUnit).resolve(parentWidth, fontSize);
  this.marginRightPx = this.marginRight.value.(*EVGUnit).pixels; 
  this.marginBottom.value.(*EVGUnit).resolve(parentHeight, fontSize);
  this.marginBottomPx = this.marginBottom.value.(*EVGUnit).pixels; 
  this.marginLeft.value.(*EVGUnit).resolve(parentWidth, fontSize);
  this.marginLeftPx = this.marginLeft.value.(*EVGUnit).pixels; 
  this.paddingTop.value.(*EVGUnit).resolve(parentHeight, fontSize);
  this.paddingTopPx = this.paddingTop.value.(*EVGUnit).pixels; 
  this.paddingRight.value.(*EVGUnit).resolve(parentWidth, fontSize);
  this.paddingRightPx = this.paddingRight.value.(*EVGUnit).pixels; 
  this.paddingBottom.value.(*EVGUnit).resolve(parentHeight, fontSize);
  this.paddingBottomPx = this.paddingBottom.value.(*EVGUnit).pixels; 
  this.paddingLeft.value.(*EVGUnit).resolve(parentWidth, fontSize);
  this.paddingLeftPx = this.paddingLeft.value.(*EVGUnit).pixels; 
  this.borderWidth.value.(*EVGUnit).resolve(parentWidth, fontSize);
  this.borderWidthPx = this.borderWidth.value.(*EVGUnit).pixels; 
  var smallerDim float64= parentWidth;
  if  parentHeight < parentWidth {
    smallerDim = parentHeight; 
  }
  this.borderRadius.value.(*EVGUnit).resolve(smallerDim, fontSize);
  this.borderRadiusPx = this.borderRadius.value.(*EVGUnit).pixels; 
}
func (this *EVGBox) getInnerWidth (outerWidth float64) float64 {
  return ((outerWidth - this.paddingLeftPx) - this.paddingRightPx) - (this.borderWidthPx * 2.0)
}
func (this *EVGBox) getInnerHeight (outerHeight float64) float64 {
  return ((outerHeight - this.paddingTopPx) - this.paddingBottomPx) - (this.borderWidthPx * 2.0)
}
func (this *EVGBox) getTotalWidth (contentWidth float64) float64 {
  return ((((contentWidth + this.marginLeftPx) + this.marginRightPx) + this.paddingLeftPx) + this.paddingRightPx) + (this.borderWidthPx * 2.0)
}
func (this *EVGBox) getTotalHeight (contentHeight float64) float64 {
  return ((((contentHeight + this.marginTopPx) + this.marginBottomPx) + this.paddingTopPx) + this.paddingBottomPx) + (this.borderWidthPx * 2.0)
}
func (this *EVGBox) getContentX (elementX float64) float64 {
  return ((elementX + this.marginLeftPx) + this.borderWidthPx) + this.paddingLeftPx
}
func (this *EVGBox) getContentY (elementY float64) float64 {
  return ((elementY + this.marginTopPx) + this.borderWidthPx) + this.paddingTopPx
}
func (this *EVGBox) getHorizontalSpace () float64 {
  return (((this.marginLeftPx + this.marginRightPx) + this.paddingLeftPx) + this.paddingRightPx) + (this.borderWidthPx * 2.0)
}
func (this *EVGBox) getVerticalSpace () float64 {
  return (((this.marginTopPx + this.marginBottomPx) + this.paddingTopPx) + this.paddingBottomPx) + (this.borderWidthPx * 2.0)
}
func (this *EVGBox) getMarginHorizontal () float64 {
  return this.marginLeftPx + this.marginRightPx
}
func (this *EVGBox) getMarginVertical () float64 {
  return this.marginTopPx + this.marginBottomPx
}
func (this *EVGBox) getPaddingHorizontal () float64 {
  return this.paddingLeftPx + this.paddingRightPx
}
func (this *EVGBox) getPaddingVertical () float64 {
  return this.paddingTopPx + this.paddingBottomPx
}
func (this *EVGBox) toString () string {
  return ((((((((((((((((("Box[margin:" + (strconv.FormatFloat(this.marginTopPx,'f', 6, 64))) + "/") + (strconv.FormatFloat(this.marginRightPx,'f', 6, 64))) + "/") + (strconv.FormatFloat(this.marginBottomPx,'f', 6, 64))) + "/") + (strconv.FormatFloat(this.marginLeftPx,'f', 6, 64))) + " padding:") + (strconv.FormatFloat(this.paddingTopPx,'f', 6, 64))) + "/") + (strconv.FormatFloat(this.paddingRightPx,'f', 6, 64))) + "/") + (strconv.FormatFloat(this.paddingBottomPx,'f', 6, 64))) + "/") + (strconv.FormatFloat(this.paddingLeftPx,'f', 6, 64))) + " border:") + (strconv.FormatFloat(this.borderWidthPx,'f', 6, 64))) + "]"
}
type EVGElement struct { 
  id string `json:"id"` 
  tagName string `json:"tagName"` 
  elementType int64 `json:"elementType"` 
  parent *GoNullable `json:"parent"` 
  children []*EVGElement `json:"children"` 
  width *GoNullable `json:"width"` 
  height *GoNullable `json:"height"` 
  minWidth *GoNullable `json:"minWidth"` 
  minHeight *GoNullable `json:"minHeight"` 
  maxWidth *GoNullable `json:"maxWidth"` 
  maxHeight *GoNullable `json:"maxHeight"` 
  left *GoNullable `json:"left"` 
  top *GoNullable `json:"top"` 
  right *GoNullable `json:"right"` 
  bottom *GoNullable `json:"bottom"` 
  x *GoNullable `json:"x"` 
  y *GoNullable `json:"y"` 
  box *GoNullable `json:"box"` 
  backgroundColor *GoNullable `json:"backgroundColor"` 
  opacity float64 `json:"opacity"` 
  direction string `json:"direction"` 
  align string `json:"align"` 
  verticalAlign string `json:"verticalAlign"` 
  isInline bool `json:"isInline"` 
  lineBreak bool `json:"lineBreak"` 
  overflow string `json:"overflow"` 
  fontSize *GoNullable `json:"fontSize"` 
  fontFamily string `json:"fontFamily"` 
  fontWeight string `json:"fontWeight"` 
  lineHeight float64 `json:"lineHeight"` 
  textAlign string `json:"textAlign"` 
  color *GoNullable `json:"color"` 
  textContent string `json:"textContent"` 
  display string /**  unused  **/  `json:"display"` 
  flex float64 `json:"flex"` 
  flexDirection string `json:"flexDirection"` 
  justifyContent string `json:"justifyContent"` 
  alignItems string `json:"alignItems"` 
  gap *GoNullable `json:"gap"` 
  position string /**  unused  **/  `json:"position"` 
  marginTop *GoNullable /**  unused  **/  `json:"marginTop"` 
  marginRight *GoNullable /**  unused  **/  `json:"marginRight"` 
  marginBottom *GoNullable /**  unused  **/  `json:"marginBottom"` 
  marginLeft *GoNullable /**  unused  **/  `json:"marginLeft"` 
  paddingTop *GoNullable /**  unused  **/  `json:"paddingTop"` 
  paddingRight *GoNullable /**  unused  **/  `json:"paddingRight"` 
  paddingBottom *GoNullable /**  unused  **/  `json:"paddingBottom"` 
  paddingLeft *GoNullable /**  unused  **/  `json:"paddingLeft"` 
  borderWidth *GoNullable /**  unused  **/  `json:"borderWidth"` 
  borderTopWidth *GoNullable /**  unused  **/  `json:"borderTopWidth"` 
  borderRightWidth *GoNullable /**  unused  **/  `json:"borderRightWidth"` 
  borderBottomWidth *GoNullable /**  unused  **/  `json:"borderBottomWidth"` 
  borderLeftWidth *GoNullable /**  unused  **/  `json:"borderLeftWidth"` 
  borderColor *GoNullable /**  unused  **/  `json:"borderColor"` 
  borderRadius *GoNullable /**  unused  **/  `json:"borderRadius"` 
  src string `json:"src"` 
  alt string /**  unused  **/  `json:"alt"` 
  svgPath string `json:"svgPath"` 
  viewBox string `json:"viewBox"` 
  fillColor *GoNullable `json:"fillColor"` 
  strokeColor *GoNullable `json:"strokeColor"` 
  strokeWidth float64 `json:"strokeWidth"` 
  clipPath string `json:"clipPath"` 
  className string `json:"className"` 
  imageQuality int64 `json:"imageQuality"` 
  maxImageSize int64 `json:"maxImageSize"` 
  rotate float64 `json:"rotate"` 
  scale float64 `json:"scale"` 
  shadowRadius *GoNullable `json:"shadowRadius"` 
  shadowColor *GoNullable `json:"shadowColor"` 
  shadowOffsetX *GoNullable `json:"shadowOffsetX"` 
  shadowOffsetY *GoNullable `json:"shadowOffsetY"` 
  calculatedX float64 `json:"calculatedX"` 
  calculatedY float64 `json:"calculatedY"` 
  calculatedWidth float64 `json:"calculatedWidth"` 
  calculatedHeight float64 `json:"calculatedHeight"` 
  calculatedInnerWidth float64 `json:"calculatedInnerWidth"` 
  calculatedInnerHeight float64 `json:"calculatedInnerHeight"` 
  calculatedFlexWidth float64 `json:"calculatedFlexWidth"` 
  calculatedPage int64 `json:"calculatedPage"` 
  isAbsolute bool `json:"isAbsolute"` 
  isLayoutComplete bool `json:"isLayoutComplete"` 
  unitsResolved bool `json:"unitsResolved"` 
  inheritedFontSize float64 `json:"inheritedFontSize"` 
}

func CreateNew_EVGElement() *EVGElement {
  me := new(EVGElement)
  me.id = ""
  me.tagName = "div"
  me.elementType = int64(0)
  me.children = make([]*EVGElement,0)
  me.opacity = 1.0
  me.direction = "row"
  me.align = "left"
  me.verticalAlign = "top"
  me.isInline = false
  me.lineBreak = false
  me.overflow = "visible"
  me.fontFamily = "Helvetica"
  me.fontWeight = "normal"
  me.lineHeight = 1.2
  me.textAlign = "left"
  me.textContent = ""
  me.display = "block"
  me.flex = 0.0
  me.flexDirection = "column"
  me.justifyContent = "flex-start"
  me.alignItems = "flex-start"
  me.position = "relative"
  me.src = ""
  me.alt = ""
  me.svgPath = ""
  me.viewBox = ""
  me.strokeWidth = 0.0
  me.clipPath = ""
  me.className = ""
  me.imageQuality = int64(0)
  me.maxImageSize = int64(0)
  me.rotate = 0.0
  me.scale = 1.0
  me.calculatedX = 0.0
  me.calculatedY = 0.0
  me.calculatedWidth = 0.0
  me.calculatedHeight = 0.0
  me.calculatedInnerWidth = 0.0
  me.calculatedInnerHeight = 0.0
  me.calculatedFlexWidth = 0.0
  me.calculatedPage = int64(0)
  me.isAbsolute = false
  me.isLayoutComplete = false
  me.unitsResolved = false
  me.inheritedFontSize = 14.0
  me.parent = new(GoNullable);
  me.width = new(GoNullable);
  me.height = new(GoNullable);
  me.minWidth = new(GoNullable);
  me.minHeight = new(GoNullable);
  me.maxWidth = new(GoNullable);
  me.maxHeight = new(GoNullable);
  me.left = new(GoNullable);
  me.top = new(GoNullable);
  me.right = new(GoNullable);
  me.bottom = new(GoNullable);
  me.x = new(GoNullable);
  me.y = new(GoNullable);
  me.box = new(GoNullable);
  me.backgroundColor = new(GoNullable);
  me.fontSize = new(GoNullable);
  me.color = new(GoNullable);
  me.gap = new(GoNullable);
  me.marginTop = new(GoNullable);
  me.marginRight = new(GoNullable);
  me.marginBottom = new(GoNullable);
  me.marginLeft = new(GoNullable);
  me.paddingTop = new(GoNullable);
  me.paddingRight = new(GoNullable);
  me.paddingBottom = new(GoNullable);
  me.paddingLeft = new(GoNullable);
  me.borderWidth = new(GoNullable);
  me.borderTopWidth = new(GoNullable);
  me.borderRightWidth = new(GoNullable);
  me.borderBottomWidth = new(GoNullable);
  me.borderLeftWidth = new(GoNullable);
  me.borderColor = new(GoNullable);
  me.borderRadius = new(GoNullable);
  me.fillColor = new(GoNullable);
  me.strokeColor = new(GoNullable);
  me.shadowRadius = new(GoNullable);
  me.shadowColor = new(GoNullable);
  me.shadowOffsetX = new(GoNullable);
  me.shadowOffsetY = new(GoNullable);
  me.tagName = "div"; 
  me.elementType = int64(0); 
  me.width.value = EVGUnit_static_unset();
  me.width.has_value = true; /* detected as non-optional */
  me.height.value = EVGUnit_static_unset();
  me.height.has_value = true; /* detected as non-optional */
  me.minWidth.value = EVGUnit_static_unset();
  me.minWidth.has_value = true; /* detected as non-optional */
  me.minHeight.value = EVGUnit_static_unset();
  me.minHeight.has_value = true; /* detected as non-optional */
  me.maxWidth.value = EVGUnit_static_unset();
  me.maxWidth.has_value = true; /* detected as non-optional */
  me.maxHeight.value = EVGUnit_static_unset();
  me.maxHeight.has_value = true; /* detected as non-optional */
  me.left.value = EVGUnit_static_unset();
  me.left.has_value = true; /* detected as non-optional */
  me.top.value = EVGUnit_static_unset();
  me.top.has_value = true; /* detected as non-optional */
  me.right.value = EVGUnit_static_unset();
  me.right.has_value = true; /* detected as non-optional */
  me.bottom.value = EVGUnit_static_unset();
  me.bottom.has_value = true; /* detected as non-optional */
  me.x.value = EVGUnit_static_unset();
  me.x.has_value = true; /* detected as non-optional */
  me.y.value = EVGUnit_static_unset();
  me.y.has_value = true; /* detected as non-optional */
  var newBox *EVGBox= CreateNew_EVGBox();
  me.box.value = newBox;
  me.box.has_value = true; /* detected as non-optional */
  me.backgroundColor.value = EVGColor_static_noColor();
  me.backgroundColor.has_value = true; /* detected as non-optional */
  me.color.value = EVGColor_static_black();
  me.color.has_value = true; /* detected as non-optional */
  me.fontSize.value = EVGUnit_static_px(14.0);
  me.fontSize.has_value = true; /* detected as non-optional */
  me.shadowRadius.value = EVGUnit_static_unset();
  me.shadowRadius.has_value = true; /* detected as non-optional */
  me.shadowColor.value = EVGColor_static_noColor();
  me.shadowColor.has_value = true; /* detected as non-optional */
  me.shadowOffsetX.value = EVGUnit_static_unset();
  me.shadowOffsetX.has_value = true; /* detected as non-optional */
  me.shadowOffsetY.value = EVGUnit_static_unset();
  me.shadowOffsetY.has_value = true; /* detected as non-optional */
  me.fillColor.value = EVGColor_static_noColor();
  me.fillColor.has_value = true; /* detected as non-optional */
  me.strokeColor.value = EVGColor_static_noColor();
  me.strokeColor.has_value = true; /* detected as non-optional */
  return me;
}
func EVGElement_static_createDiv() *EVGElement {
  var el *EVGElement= CreateNew_EVGElement();
  el.tagName = "div"; 
  el.elementType = int64(0); 
  return el
}
func EVGElement_static_createSpan() *EVGElement {
  var el *EVGElement= CreateNew_EVGElement();
  el.tagName = "span"; 
  el.elementType = int64(1); 
  return el
}
func EVGElement_static_createImg() *EVGElement {
  var el *EVGElement= CreateNew_EVGElement();
  el.tagName = "img"; 
  el.elementType = int64(2); 
  return el
}
func EVGElement_static_createPath() *EVGElement {
  var el *EVGElement= CreateNew_EVGElement();
  el.tagName = "path"; 
  el.elementType = int64(3); 
  return el
}
func (this *EVGElement) addChild (child *EVGElement) () {
  child.parent.value = this;
  child.parent.has_value = true; /* detected as non-optional */
  this.children = append(this.children,child); 
}
func (this *EVGElement) resetLayoutState () () {
  this.unitsResolved = false; 
  this.calculatedX = 0.0; 
  this.calculatedY = 0.0; 
  this.calculatedWidth = 0.0; 
  this.calculatedHeight = 0.0; 
  var i int64= int64(0);
  for i < (int64(len(this.children))) {
    var child *EVGElement= this.children[i];
    child.resetLayoutState();
    i = i + int64(1); 
  }
}
func (this *EVGElement) getChildCount () int64 {
  return int64(len(this.children))
}
func (this *EVGElement) getChild (index int64) *EVGElement {
  return this.children[index]
}
func (this *EVGElement) hasParent () bool {
  if ( this.parent.has_value) {
    return true
  }
  return false
}
func (this *EVGElement) isContainer () bool {
  return this.elementType == int64(0)
}
func (this *EVGElement) isText () bool {
  return this.elementType == int64(1)
}
func (this *EVGElement) isImage () bool {
  return this.elementType == int64(2)
}
func (this *EVGElement) isPath () bool {
  return this.elementType == int64(3)
}
func (this *EVGElement) hasAbsolutePosition () bool {
  if  this.left.value.(*EVGUnit).isSet {
    return true
  }
  if  this.top.value.(*EVGUnit).isSet {
    return true
  }
  if  this.right.value.(*EVGUnit).isSet {
    return true
  }
  if  this.bottom.value.(*EVGUnit).isSet {
    return true
  }
  if  this.x.value.(*EVGUnit).isSet {
    return true
  }
  if  this.y.value.(*EVGUnit).isSet {
    return true
  }
  return false
}
func (this *EVGElement) inheritProperties (parentEl *EVGElement) () {
  if  this.fontFamily == "Helvetica" {
    this.fontFamily = parentEl.fontFamily; 
  }
  if  this.color.value.(*EVGColor).isSet == false {
    this.color.value = parentEl.color.value;
    this.color.has_value = false; 
    if this.color.value != nil {
      this.color.has_value = true
    }
  }
  this.inheritedFontSize = parentEl.inheritedFontSize; 
  if  this.fontSize.value.(*EVGUnit).isSet {
    this.fontSize.value.(*EVGUnit).resolve(this.inheritedFontSize, this.inheritedFontSize);
    this.inheritedFontSize = this.fontSize.value.(*EVGUnit).pixels; 
  }
}
func (this *EVGElement) resolveUnits (parentWidth float64, parentHeight float64) () {
  if  this.unitsResolved {
    return
  }
  this.unitsResolved = true; 
  var fs float64= this.inheritedFontSize;
  this.width.value.(*EVGUnit).resolveWithHeight(parentWidth, parentHeight, fs);
  this.height.value.(*EVGUnit).resolveForHeight(parentWidth, parentHeight, fs);
  this.minWidth.value.(*EVGUnit).resolve(parentWidth, fs);
  this.minHeight.value.(*EVGUnit).resolve(parentHeight, fs);
  this.maxWidth.value.(*EVGUnit).resolve(parentWidth, fs);
  this.maxHeight.value.(*EVGUnit).resolve(parentHeight, fs);
  this.left.value.(*EVGUnit).resolve(parentWidth, fs);
  this.top.value.(*EVGUnit).resolve(parentHeight, fs);
  this.right.value.(*EVGUnit).resolve(parentWidth, fs);
  this.bottom.value.(*EVGUnit).resolve(parentHeight, fs);
  this.x.value.(*EVGUnit).resolve(parentWidth, fs);
  this.y.value.(*EVGUnit).resolve(parentHeight, fs);
  this.box.value.(*EVGBox).resolveUnits(parentWidth, parentHeight, fs);
  this.shadowRadius.value.(*EVGUnit).resolve(parentWidth, fs);
  this.shadowOffsetX.value.(*EVGUnit).resolve(parentWidth, fs);
  this.shadowOffsetY.value.(*EVGUnit).resolve(parentHeight, fs);
  this.isAbsolute = this.hasAbsolutePosition(); 
}
func (this *EVGElement) setAttribute (name string, value string) () {
  if  name == "id" {
    this.id = value; 
    return
  }
  if  name == "width" {
    this.width.value = EVGUnit_static_parse(value);
    this.width.has_value = true; /* detected as non-optional */
    return
  }
  if  name == "height" {
    this.height.value = EVGUnit_static_parse(value);
    this.height.has_value = true; /* detected as non-optional */
    return
  }
  if  (name == "min-width") || (name == "minWidth") {
    this.minWidth.value = EVGUnit_static_parse(value);
    this.minWidth.has_value = true; /* detected as non-optional */
    return
  }
  if  (name == "min-height") || (name == "minHeight") {
    this.minHeight.value = EVGUnit_static_parse(value);
    this.minHeight.has_value = true; /* detected as non-optional */
    return
  }
  if  (name == "max-width") || (name == "maxWidth") {
    this.maxWidth.value = EVGUnit_static_parse(value);
    this.maxWidth.has_value = true; /* detected as non-optional */
    return
  }
  if  (name == "max-height") || (name == "maxHeight") {
    this.maxHeight.value = EVGUnit_static_parse(value);
    this.maxHeight.has_value = true; /* detected as non-optional */
    return
  }
  if  name == "left" {
    this.left.value = EVGUnit_static_parse(value);
    this.left.has_value = true; /* detected as non-optional */
    return
  }
  if  name == "top" {
    this.top.value = EVGUnit_static_parse(value);
    this.top.has_value = true; /* detected as non-optional */
    return
  }
  if  name == "right" {
    this.right.value = EVGUnit_static_parse(value);
    this.right.has_value = true; /* detected as non-optional */
    return
  }
  if  name == "bottom" {
    this.bottom.value = EVGUnit_static_parse(value);
    this.bottom.has_value = true; /* detected as non-optional */
    return
  }
  if  name == "x" {
    this.x.value = EVGUnit_static_parse(value);
    this.x.has_value = true; /* detected as non-optional */
    return
  }
  if  name == "y" {
    this.y.value = EVGUnit_static_parse(value);
    this.y.has_value = true; /* detected as non-optional */
    return
  }
  if  name == "margin" {
    this.box.value.(*EVGBox).setMargin(EVGUnit_static_parse(value));
    return
  }
  if  (name == "margin-left") || (name == "marginLeft") {
    this.box.value.(*EVGBox).marginLeft.value = EVGUnit_static_parse(value);
    this.box.value.(*EVGBox).marginLeft.has_value = true; /* detected as non-optional */
    return
  }
  if  (name == "margin-right") || (name == "marginRight") {
    this.box.value.(*EVGBox).marginRight.value = EVGUnit_static_parse(value);
    this.box.value.(*EVGBox).marginRight.has_value = true; /* detected as non-optional */
    return
  }
  if  (name == "margin-top") || (name == "marginTop") {
    this.box.value.(*EVGBox).marginTop.value = EVGUnit_static_parse(value);
    this.box.value.(*EVGBox).marginTop.has_value = true; /* detected as non-optional */
    return
  }
  if  (name == "margin-bottom") || (name == "marginBottom") {
    this.box.value.(*EVGBox).marginBottom.value = EVGUnit_static_parse(value);
    this.box.value.(*EVGBox).marginBottom.has_value = true; /* detected as non-optional */
    return
  }
  if  name == "padding" {
    this.box.value.(*EVGBox).setPadding(EVGUnit_static_parse(value));
    return
  }
  if  (name == "padding-left") || (name == "paddingLeft") {
    this.box.value.(*EVGBox).paddingLeft.value = EVGUnit_static_parse(value);
    this.box.value.(*EVGBox).paddingLeft.has_value = true; /* detected as non-optional */
    return
  }
  if  (name == "padding-right") || (name == "paddingRight") {
    this.box.value.(*EVGBox).paddingRight.value = EVGUnit_static_parse(value);
    this.box.value.(*EVGBox).paddingRight.has_value = true; /* detected as non-optional */
    return
  }
  if  (name == "padding-top") || (name == "paddingTop") {
    this.box.value.(*EVGBox).paddingTop.value = EVGUnit_static_parse(value);
    this.box.value.(*EVGBox).paddingTop.has_value = true; /* detected as non-optional */
    return
  }
  if  (name == "padding-bottom") || (name == "paddingBottom") {
    this.box.value.(*EVGBox).paddingBottom.value = EVGUnit_static_parse(value);
    this.box.value.(*EVGBox).paddingBottom.has_value = true; /* detected as non-optional */
    return
  }
  if  (name == "border-width") || (name == "borderWidth") {
    this.box.value.(*EVGBox).borderWidth.value = EVGUnit_static_parse(value);
    this.box.value.(*EVGBox).borderWidth.has_value = true; /* detected as non-optional */
    return
  }
  if  (name == "border-color") || (name == "borderColor") {
    this.box.value.(*EVGBox).borderColor.value = EVGColor_static_parse(value);
    this.box.value.(*EVGBox).borderColor.has_value = true; /* detected as non-optional */
    return
  }
  if  (name == "border-radius") || (name == "borderRadius") {
    this.box.value.(*EVGBox).borderRadius.value = EVGUnit_static_parse(value);
    this.box.value.(*EVGBox).borderRadius.has_value = true; /* detected as non-optional */
    return
  }
  if  (name == "background-color") || (name == "backgroundColor") {
    this.backgroundColor.value = EVGColor_static_parse(value);
    this.backgroundColor.has_value = true; /* detected as non-optional */
    return
  }
  if  name == "color" {
    this.color.value = EVGColor_static_parse(value);
    this.color.has_value = true; /* detected as non-optional */
    return
  }
  if  name == "opacity" {
    var val *GoNullable = new(GoNullable); 
    val = r_str_2_d64(value);
    this.opacity = val.value.(float64); 
    return
  }
  if  name == "direction" {
    this.direction = value; 
    return
  }
  if  name == "align" {
    this.align = value; 
    return
  }
  if  (name == "vertical-align") || (name == "verticalAlign") {
    this.verticalAlign = value; 
    return
  }
  if  name == "inline" {
    this.isInline = value == "true"; 
    return
  }
  if  (name == "line-break") || (name == "lineBreak") {
    this.lineBreak = value == "true"; 
    return
  }
  if  name == "overflow" {
    this.overflow = value; 
    return
  }
  if  (name == "flex-direction") || (name == "flexDirection") {
    this.flexDirection = value; 
    return
  }
  if  name == "flex" {
    var val_1 *GoNullable = new(GoNullable); 
    val_1 = r_str_2_d64(value);
    if ( val_1.has_value) {
      this.flex = val_1.value.(float64); 
    }
    return
  }
  if  name == "gap" {
    this.gap.value = EVGUnit_static_parse(value);
    this.gap.has_value = true; /* detected as non-optional */
    return
  }
  if  (name == "justify-content") || (name == "justifyContent") {
    this.justifyContent = value; 
    return
  }
  if  (name == "align-items") || (name == "alignItems") {
    this.alignItems = value; 
    return
  }
  if  (name == "font-size") || (name == "fontSize") {
    this.fontSize.value = EVGUnit_static_parse(value);
    this.fontSize.has_value = true; /* detected as non-optional */
    return
  }
  if  (name == "font-family") || (name == "fontFamily") {
    this.fontFamily = value; 
    return
  }
  if  (name == "font-weight") || (name == "fontWeight") {
    this.fontWeight = value; 
    return
  }
  if  (name == "text-align") || (name == "textAlign") {
    this.textAlign = value; 
    return
  }
  if  (name == "line-height") || (name == "lineHeight") {
    var val_2 *GoNullable = new(GoNullable); 
    val_2 = r_str_2_d64(value);
    if ( val_2.has_value) {
      this.lineHeight = val_2.value.(float64); 
    }
    return
  }
  if  name == "rotate" {
    var val_3 *GoNullable = new(GoNullable); 
    val_3 = r_str_2_d64(value);
    this.rotate = val_3.value.(float64); 
    return
  }
  if  name == "scale" {
    var val_4 *GoNullable = new(GoNullable); 
    val_4 = r_str_2_d64(value);
    this.scale = val_4.value.(float64); 
    return
  }
  if  (name == "shadow-radius") || (name == "shadowRadius") {
    this.shadowRadius.value = EVGUnit_static_parse(value);
    this.shadowRadius.has_value = true; /* detected as non-optional */
    return
  }
  if  (name == "shadow-color") || (name == "shadowColor") {
    this.shadowColor.value = EVGColor_static_parse(value);
    this.shadowColor.has_value = true; /* detected as non-optional */
    return
  }
  if  (name == "shadow-offset-x") || (name == "shadowOffsetX") {
    this.shadowOffsetX.value = EVGUnit_static_parse(value);
    this.shadowOffsetX.has_value = true; /* detected as non-optional */
    return
  }
  if  (name == "shadow-offset-y") || (name == "shadowOffsetY") {
    this.shadowOffsetY.value = EVGUnit_static_parse(value);
    this.shadowOffsetY.has_value = true; /* detected as non-optional */
    return
  }
  if  (name == "clip-path") || (name == "clipPath") {
    this.clipPath = value; 
    return
  }
  if  name == "imageQuality" {
    var val_5 *GoNullable = new(GoNullable); 
    val_5 = r_str_2_i64(value);
    if ( val_5.has_value) {
      this.imageQuality = val_5.value.(int64); 
    }
    return
  }
  if  name == "maxImageSize" {
    var val_6 *GoNullable = new(GoNullable); 
    val_6 = r_str_2_i64(value);
    if ( val_6.has_value) {
      this.maxImageSize = val_6.value.(int64); 
    }
    return
  }
  if  (name == "d") || (name == "svgPath") {
    this.svgPath = value; 
    return
  }
  if  name == "viewBox" {
    this.viewBox = value; 
    return
  }
  if  name == "fill" {
    this.fillColor.value = EVGColor_static_parse(value);
    this.fillColor.has_value = true; /* detected as non-optional */
    return
  }
  if  name == "stroke" {
    this.strokeColor.value = EVGColor_static_parse(value);
    this.strokeColor.has_value = true; /* detected as non-optional */
    return
  }
  if  (name == "stroke-width") || (name == "strokeWidth") {
    var val_7 *GoNullable = new(GoNullable); 
    val_7 = r_str_2_d64(value);
    if ( val_7.has_value) {
      this.strokeWidth = val_7.value.(float64); 
    }
    return
  }
}
func (this *EVGElement) getCalculatedBounds () string {
  return (((((("(" + (strconv.FormatFloat(this.calculatedX,'f', 6, 64))) + ", ") + (strconv.FormatFloat(this.calculatedY,'f', 6, 64))) + ") ") + (strconv.FormatFloat(this.calculatedWidth,'f', 6, 64))) + "x") + (strconv.FormatFloat(this.calculatedHeight,'f', 6, 64))
}
func (this *EVGElement) toString () string {
  return ((((("<" + this.tagName) + " id=\"") + this.id) + "\" ") + this.getCalculatedBounds()) + ">"
}
type BufferChunk struct { 
  data []byte `json:"data"` 
  used int64 `json:"used"` 
  capacity int64 `json:"capacity"` 
  next *GoNullable `json:"next"` 
}

func CreateNew_BufferChunk(size int64) *BufferChunk {
  me := new(BufferChunk)
  me.data = 
  make([]byte, int64(0))
  
  me.used = int64(0)
  me.capacity = int64(0)
  me.next = new(GoNullable);
  me.data = make([]byte, size); 
  me.capacity = size; 
  me.used = int64(0); 
  return me;
}
func (this *BufferChunk) remaining () int64 {
  return this.capacity - this.used
}
func (this *BufferChunk) isFull () bool {
  return this.used >= this.capacity
}
type GrowableBuffer struct { 
  firstChunk *BufferChunk `json:"firstChunk"` 
  currentChunk *BufferChunk `json:"currentChunk"` 
  chunkSize int64 `json:"chunkSize"` 
  totalSize int64 `json:"totalSize"` 
}

func CreateNew_GrowableBuffer() *GrowableBuffer {
  me := new(GrowableBuffer)
  me.firstChunk = CreateNew_BufferChunk(int64(4096))
  me.currentChunk = CreateNew_BufferChunk(int64(4096))
  me.chunkSize = int64(4096)
  me.totalSize = int64(0)
  var chunk *BufferChunk= CreateNew_BufferChunk(me.chunkSize);
  me.firstChunk = chunk; 
  me.currentChunk = chunk; 
  return me;
}
func (this *GrowableBuffer) setChunkSize (size int64) () {
  this.chunkSize = size; 
}
func (this *GrowableBuffer) allocateNewChunk () () {
  var newChunk *BufferChunk= CreateNew_BufferChunk(this.chunkSize);
  this.currentChunk.next.value = newChunk;
  this.currentChunk.next.has_value = true; /* detected as non-optional */
  this.currentChunk = newChunk; 
}
func (this *GrowableBuffer) writeByte (b int64) () {
  if  this.currentChunk.isFull() {
    this.allocateNewChunk();
  }
  var pos int64= this.currentChunk.used;
  this.currentChunk.data[pos] = byte(b)
  this.currentChunk.used = pos + int64(1); 
  this.totalSize = this.totalSize + int64(1); 
}
func (this *GrowableBuffer) writeBytes (src []byte, srcOffset int64, length int64) () {
  var i int64= int64(0);
  for i < length {
    var b int64= int64(src[(srcOffset + i)]);
    this.writeByte(b);
    i = i + int64(1); 
  }
}
func (this *GrowableBuffer) writeBuffer (src []byte) () {
  var __len int64= int64(len(src));
  this.writeBytes(src, int64(0), __len);
}
func (this *GrowableBuffer) writeString (s string) () {
  var __len int64= int64(len([]rune(s)));
  var i int64= int64(0);
  for i < __len {
    var ch int64= int64([]rune(s)[i]);
    this.writeByte(ch);
    i = i + int64(1); 
  }
}
func (this *GrowableBuffer) writeInt16BE (value int64) () {
  var highD float64= float64(value) / float64(int64(256));
  var high int64= int64(highD);
  var low int64= value - (high * int64(256));
  this.writeByte(high);
  this.writeByte(low);
}
func (this *GrowableBuffer) writeInt32BE (value int64) () {
  var b1D float64= float64(value) / float64(int64(16777216));
  var b1 int64= int64(b1D);
  var rem1 int64= value - (b1 * int64(16777216));
  var b2D float64= float64(rem1) / float64(int64(65536));
  var b2 int64= int64(b2D);
  var rem2 int64= rem1 - (b2 * int64(65536));
  var b3D float64= float64(rem2) / float64(int64(256));
  var b3 int64= int64(b3D);
  var b4 int64= rem2 - (b3 * int64(256));
  this.writeByte(b1);
  this.writeByte(b2);
  this.writeByte(b3);
  this.writeByte(b4);
}
func (this *GrowableBuffer) size () int64 {
  return this.totalSize
}
func (this *GrowableBuffer) toBuffer () []byte {
  var allocSize int64= this.totalSize;
  var result []byte= make([]byte, allocSize);
  var pos int64= int64(0);
  var chunk *BufferChunk= this.firstChunk;
  var done bool= false;
  for done == false {
    var chunkUsed int64= chunk.used;
    var i int64= int64(0);
    for i < chunkUsed {
      var b int64= int64(chunk.data[i]);
      result[pos] = byte(b)
      pos = pos + int64(1); 
      i = i + int64(1); 
    }
    if  !chunk.next.has_value  {
      done = true; 
    } else {
      chunk = chunk.next.value.(*BufferChunk); 
    }
  }
  return result
}
func (this *GrowableBuffer) toString () string {
  var result string= "";
  var chunk *BufferChunk= this.firstChunk;
  var done bool= false;
  for done == false {
    var chunkUsed int64= chunk.used;
    var i int64= int64(0);
    for i < chunkUsed {
      var b int64= int64(chunk.data[i]);
      result = result + (string([]rune{rune(b)})); 
      i = i + int64(1); 
    }
    if  !chunk.next.has_value  {
      done = true; 
    } else {
      chunk = chunk.next.value.(*BufferChunk); 
    }
  }
  return result
}
func (this *GrowableBuffer) clear () () {
  var chunk *BufferChunk= CreateNew_BufferChunk(this.chunkSize);
  this.firstChunk = chunk; 
  this.currentChunk = chunk; 
  this.totalSize = int64(0); 
}
type JPEGImage struct { 
  width int64 `json:"width"` 
  height int64 `json:"height"` 
  colorComponents int64 `json:"colorComponents"` 
  bitsPerComponent int64 `json:"bitsPerComponent"` 
  imageData *GoNullable `json:"imageData"` 
  isValid bool `json:"isValid"` 
  errorMessage string `json:"errorMessage"` 
}

func CreateNew_JPEGImage() *JPEGImage {
  me := new(JPEGImage)
  me.width = int64(0)
  me.height = int64(0)
  me.colorComponents = int64(3)
  me.bitsPerComponent = int64(8)
  me.isValid = false
  me.errorMessage = ""
  me.imageData = new(GoNullable);
  return me;
}
type JPEGReader struct { 
}

func CreateNew_JPEGReader() *JPEGReader {
  me := new(JPEGReader)
  return me;
}
func (this *JPEGReader) readUint16BE (data []byte, offset int64) int64 {
  var high int64= int64(data[offset]);
  var low int64= int64(data[(offset + int64(1))]);
  return (high * int64(256)) + low
}
func (this *JPEGReader) readJPEG (dirPath string, fileName string) *JPEGImage {
  var result *JPEGImage= CreateNew_JPEGImage();
  var data []byte= func() []byte { d, _ := os.ReadFile(filepath.Join(dirPath, fileName)); return d }();
  var dataLen int64= int64(len(data));
  if  dataLen < int64(4) {
    result.errorMessage = "File too small to be a valid JPEG"; 
    return result
  }
  var marker1 int64= int64(data[int64(0)]);
  var marker2 int64= int64(data[int64(1)]);
  if  (marker1 != int64(255)) || (marker2 != int64(216)) {
    result.errorMessage = "Invalid JPEG signature - expected FFD8"; 
    return result
  }
  var pos int64= int64(2);
  var foundSOF bool= false;
  for (pos < (dataLen - int64(2))) && (foundSOF == false) {
    var m1 int64= int64(data[pos]);
    if  m1 != int64(255) {
      pos = pos + int64(1); 
    } else {
      var m2 int64= int64(data[(pos + int64(1))]);
      if  m2 == int64(255) {
        pos = pos + int64(1); 
      } else {
        if  m2 == int64(0) {
          pos = pos + int64(2); 
        } else {
          if  ((m2 == int64(192)) || (m2 == int64(193))) || (m2 == int64(194)) {
            if  (pos + int64(9)) < dataLen {
              result.bitsPerComponent = int64(data[(pos + int64(4))]); 
              result.height = this.readUint16BE(data, (pos + int64(5))); 
              result.width = this.readUint16BE(data, (pos + int64(7))); 
              result.colorComponents = int64(data[(pos + int64(9))]); 
              foundSOF = true; 
            }
          } else {
            if  m2 == int64(217) {
              pos = dataLen; 
            } else {
              if  m2 == int64(218) {
                pos = dataLen; 
              } else {
                if  (pos + int64(4)) < dataLen {
                  var segLen int64= this.readUint16BE(data, (pos + int64(2)));
                  pos = (pos + int64(2)) + segLen; 
                } else {
                  pos = dataLen; 
                }
              }
            }
          }
        }
      }
    }
  }
  if  foundSOF == false {
    result.errorMessage = "Could not find SOF marker in JPEG"; 
    return result
  }
  result.imageData.value = data;
  result.imageData.has_value = true; /* detected as non-optional */
  result.isValid = true; 
  return result
}
func (this *JPEGReader) getImageInfo (img *JPEGImage) string {
  if  img.isValid == false {
    return "Invalid JPEG: " + img.errorMessage
  }
  return ((((((("JPEG: " + (strconv.FormatInt(img.width, 10))) + "x") + (strconv.FormatInt(img.height, 10))) + " pixels, ") + (strconv.FormatInt(img.colorComponents, 10))) + " components, ") + (strconv.FormatInt(img.bitsPerComponent, 10))) + " bits"
}
type ExifTag struct { 
  tagId int64 `json:"tagId"` 
  tagName string `json:"tagName"` 
  tagValue string `json:"tagValue"` 
  dataType int64 `json:"dataType"` 
}

func CreateNew_ExifTag() *ExifTag {
  me := new(ExifTag)
  me.tagId = int64(0)
  me.tagName = ""
  me.tagValue = ""
  me.dataType = int64(0)
  return me;
}
type JPEGMetadataInfo struct { 
  isValid bool `json:"isValid"` 
  errorMessage string `json:"errorMessage"` 
  hasJFIF bool `json:"hasJFIF"` 
  jfifVersion string `json:"jfifVersion"` 
  densityUnits int64 `json:"densityUnits"` 
  xDensity int64 `json:"xDensity"` 
  yDensity int64 `json:"yDensity"` 
  width int64 `json:"width"` 
  height int64 `json:"height"` 
  colorComponents int64 `json:"colorComponents"` 
  bitsPerComponent int64 `json:"bitsPerComponent"` 
  hasExif bool `json:"hasExif"` 
  cameraMake string `json:"cameraMake"` 
  cameraModel string `json:"cameraModel"` 
  software string `json:"software"` 
  dateTime string `json:"dateTime"` 
  dateTimeOriginal string `json:"dateTimeOriginal"` 
  exposureTime string `json:"exposureTime"` 
  fNumber string `json:"fNumber"` 
  isoSpeed string `json:"isoSpeed"` 
  focalLength string `json:"focalLength"` 
  flash string `json:"flash"` 
  orientation int64 `json:"orientation"` 
  xResolution string `json:"xResolution"` 
  yResolution string `json:"yResolution"` 
  resolutionUnit int64 `json:"resolutionUnit"` 
  hasGPS bool `json:"hasGPS"` 
  gpsLatitude string `json:"gpsLatitude"` 
  gpsLongitude string `json:"gpsLongitude"` 
  gpsAltitude string `json:"gpsAltitude"` 
  gpsLatitudeRef string `json:"gpsLatitudeRef"` 
  gpsLongitudeRef string `json:"gpsLongitudeRef"` 
  hasComment bool `json:"hasComment"` 
  comment string `json:"comment"` 
  exifTags []*ExifTag `json:"exifTags"` 
}

func CreateNew_JPEGMetadataInfo() *JPEGMetadataInfo {
  me := new(JPEGMetadataInfo)
  me.isValid = false
  me.errorMessage = ""
  me.hasJFIF = false
  me.jfifVersion = ""
  me.densityUnits = int64(0)
  me.xDensity = int64(0)
  me.yDensity = int64(0)
  me.width = int64(0)
  me.height = int64(0)
  me.colorComponents = int64(0)
  me.bitsPerComponent = int64(0)
  me.hasExif = false
  me.cameraMake = ""
  me.cameraModel = ""
  me.software = ""
  me.dateTime = ""
  me.dateTimeOriginal = ""
  me.exposureTime = ""
  me.fNumber = ""
  me.isoSpeed = ""
  me.focalLength = ""
  me.flash = ""
  me.orientation = int64(1)
  me.xResolution = ""
  me.yResolution = ""
  me.resolutionUnit = int64(0)
  me.hasGPS = false
  me.gpsLatitude = ""
  me.gpsLongitude = ""
  me.gpsAltitude = ""
  me.gpsLatitudeRef = ""
  me.gpsLongitudeRef = ""
  me.hasComment = false
  me.comment = ""
  me.exifTags = make([]*ExifTag,0)
  return me;
}
type JPEGMetadataParser struct { 
  data []byte `json:"data"` 
  dataLen int64 `json:"dataLen"` 
  littleEndian bool `json:"littleEndian"` 
}

func CreateNew_JPEGMetadataParser() *JPEGMetadataParser {
  me := new(JPEGMetadataParser)
  me.data = 
  make([]byte, int64(0))
  
  me.dataLen = int64(0)
  me.littleEndian = false
  return me;
}
func (this *JPEGMetadataParser) readUint16BE (offset int64) int64 {
  var high int64= int64(this.data[offset]);
  var low int64= int64(this.data[(offset + int64(1))]);
  return (high * int64(256)) + low
}
func (this *JPEGMetadataParser) readUint16 (offset int64) int64 {
  var result int64= int64(0);
  if  this.littleEndian {
    var low int64= int64(this.data[offset]);
    var high int64= int64(this.data[(offset + int64(1))]);
    result = (high * int64(256)) + low; 
  } else {
    var high_1 int64= int64(this.data[offset]);
    var low_1 int64= int64(this.data[(offset + int64(1))]);
    result = (high_1 * int64(256)) + low_1; 
  }
  return result
}
func (this *JPEGMetadataParser) readUint32 (offset int64) int64 {
  var result int64= int64(0);
  if  this.littleEndian {
    var b0 int64= int64(this.data[offset]);
    var b1 int64= int64(this.data[(offset + int64(1))]);
    var b2 int64= int64(this.data[(offset + int64(2))]);
    var b3 int64= int64(this.data[(offset + int64(3))]);
    result = (((b3 * int64(16777216)) + (b2 * int64(65536))) + (b1 * int64(256))) + b0; 
  } else {
    var b0_1 int64= int64(this.data[offset]);
    var b1_1 int64= int64(this.data[(offset + int64(1))]);
    var b2_1 int64= int64(this.data[(offset + int64(2))]);
    var b3_1 int64= int64(this.data[(offset + int64(3))]);
    result = (((b0_1 * int64(16777216)) + (b1_1 * int64(65536))) + (b2_1 * int64(256))) + b3_1; 
  }
  return result
}
func (this *JPEGMetadataParser) readString (offset int64, length int64) string {
  var result string= "";
  var i int64= int64(0);
  for i < length {
    var b int64= int64(this.data[(offset + i)]);
    if  b == int64(0) {
      return result
    }
    result = result + (string([]rune{rune(b)})); 
    i = i + int64(1); 
  }
  return result
}
func (this *JPEGMetadataParser) getTagName (tagId int64, ifdType int64) string {
  if  ifdType == int64(2) {
    if  tagId == int64(0) {
      return "GPSVersionID"
    }
    if  tagId == int64(1) {
      return "GPSLatitudeRef"
    }
    if  tagId == int64(2) {
      return "GPSLatitude"
    }
    if  tagId == int64(3) {
      return "GPSLongitudeRef"
    }
    if  tagId == int64(4) {
      return "GPSLongitude"
    }
    if  tagId == int64(5) {
      return "GPSAltitudeRef"
    }
    if  tagId == int64(6) {
      return "GPSAltitude"
    }
    return "GPS_" + (strconv.FormatInt(tagId, 10))
  }
  if  tagId == int64(256) {
    return "ImageWidth"
  }
  if  tagId == int64(257) {
    return "ImageHeight"
  }
  if  tagId == int64(258) {
    return "BitsPerSample"
  }
  if  tagId == int64(259) {
    return "Compression"
  }
  if  tagId == int64(262) {
    return "PhotometricInterpretation"
  }
  if  tagId == int64(270) {
    return "ImageDescription"
  }
  if  tagId == int64(271) {
    return "Make"
  }
  if  tagId == int64(272) {
    return "Model"
  }
  if  tagId == int64(274) {
    return "Orientation"
  }
  if  tagId == int64(282) {
    return "XResolution"
  }
  if  tagId == int64(283) {
    return "YResolution"
  }
  if  tagId == int64(296) {
    return "ResolutionUnit"
  }
  if  tagId == int64(305) {
    return "Software"
  }
  if  tagId == int64(306) {
    return "DateTime"
  }
  if  tagId == int64(315) {
    return "Artist"
  }
  if  tagId == int64(33432) {
    return "Copyright"
  }
  if  tagId == int64(33434) {
    return "ExposureTime"
  }
  if  tagId == int64(33437) {
    return "FNumber"
  }
  if  tagId == int64(34850) {
    return "ExposureProgram"
  }
  if  tagId == int64(34855) {
    return "ISOSpeedRatings"
  }
  if  tagId == int64(36864) {
    return "ExifVersion"
  }
  if  tagId == int64(36867) {
    return "DateTimeOriginal"
  }
  if  tagId == int64(36868) {
    return "DateTimeDigitized"
  }
  if  tagId == int64(37377) {
    return "ShutterSpeedValue"
  }
  if  tagId == int64(37378) {
    return "ApertureValue"
  }
  if  tagId == int64(37380) {
    return "ExposureBiasValue"
  }
  if  tagId == int64(37381) {
    return "MaxApertureValue"
  }
  if  tagId == int64(37383) {
    return "MeteringMode"
  }
  if  tagId == int64(37384) {
    return "LightSource"
  }
  if  tagId == int64(37385) {
    return "Flash"
  }
  if  tagId == int64(37386) {
    return "FocalLength"
  }
  if  tagId == int64(37500) {
    return "MakerNote"
  }
  if  tagId == int64(37510) {
    return "UserComment"
  }
  if  tagId == int64(40960) {
    return "FlashpixVersion"
  }
  if  tagId == int64(40961) {
    return "ColorSpace"
  }
  if  tagId == int64(40962) {
    return "PixelXDimension"
  }
  if  tagId == int64(40963) {
    return "PixelYDimension"
  }
  if  tagId == int64(41486) {
    return "FocalPlaneXResolution"
  }
  if  tagId == int64(41487) {
    return "FocalPlaneYResolution"
  }
  if  tagId == int64(41488) {
    return "FocalPlaneResolutionUnit"
  }
  if  tagId == int64(41495) {
    return "SensingMethod"
  }
  if  tagId == int64(41728) {
    return "FileSource"
  }
  if  tagId == int64(41729) {
    return "SceneType"
  }
  if  tagId == int64(41985) {
    return "CustomRendered"
  }
  if  tagId == int64(41986) {
    return "ExposureMode"
  }
  if  tagId == int64(41987) {
    return "WhiteBalance"
  }
  if  tagId == int64(41988) {
    return "DigitalZoomRatio"
  }
  if  tagId == int64(41989) {
    return "FocalLengthIn35mmFilm"
  }
  if  tagId == int64(41990) {
    return "SceneCaptureType"
  }
  if  tagId == int64(34665) {
    return "ExifIFDPointer"
  }
  if  tagId == int64(34853) {
    return "GPSInfoIFDPointer"
  }
  return "Tag_" + (strconv.FormatInt(tagId, 10))
}
func (this *JPEGMetadataParser) formatRational (offset int64) string {
  var numerator int64= this.readUint32(offset);
  var denominator int64= this.readUint32((offset + int64(4)));
  if  denominator == int64(0) {
    return strconv.FormatInt(numerator, 10)
  }
  if  denominator == int64(1) {
    return strconv.FormatInt(numerator, 10)
  }
  return ((strconv.FormatInt(numerator, 10)) + "/") + (strconv.FormatInt(denominator, 10))
}
func (this *JPEGMetadataParser) formatGPSCoordinate (offset int64, ref string) string {
  var degNum int64= this.readUint32(offset);
  var degDen int64= this.readUint32((offset + int64(4)));
  var minNum int64= this.readUint32((offset + int64(8)));
  var minDen int64= this.readUint32((offset + int64(12)));
  var secNum int64= this.readUint32((offset + int64(16)));
  var secDen int64= this.readUint32((offset + int64(20)));
  var degrees int64= int64(0);
  if  degDen > int64(0) {
    var tempDeg int64= degNum;
    for tempDeg >= degDen {
      tempDeg = tempDeg - degDen; 
      degrees = degrees + int64(1); 
    }
  }
  var minutes int64= int64(0);
  if  minDen > int64(0) {
    var tempMin int64= minNum;
    for tempMin >= minDen {
      tempMin = tempMin - minDen; 
      minutes = minutes + int64(1); 
    }
  }
  var seconds string= "0";
  if  secDen > int64(0) {
    var secWhole int64= int64(0);
    var tempSec int64= secNum;
    for tempSec >= secDen {
      tempSec = tempSec - secDen; 
      secWhole = secWhole + int64(1); 
    }
    var secRem int64= tempSec;
    if  secRem > int64(0) {
      var decPartTemp int64= secRem * int64(100);
      var decPart int64= int64(0);
      for decPartTemp >= secDen {
        decPartTemp = decPartTemp - secDen; 
        decPart = decPart + int64(1); 
      }
      if  decPart < int64(10) {
        seconds = ((strconv.FormatInt(secWhole, 10)) + ".0") + (strconv.FormatInt(decPart, 10)); 
      } else {
        seconds = ((strconv.FormatInt(secWhole, 10)) + ".") + (strconv.FormatInt(decPart, 10)); 
      }
    } else {
      seconds = strconv.FormatInt(secWhole, 10); 
    }
  }
  return ((((((strconv.FormatInt(degrees, 10)) + "° ") + (strconv.FormatInt(minutes, 10))) + "' ") + seconds) + "\" ") + ref
}
func (this *JPEGMetadataParser) parseIFD (info *JPEGMetadataInfo, tiffStart int64, ifdOffset int64, ifdType int64) () {
  var pos int64= tiffStart + ifdOffset;
  if  (pos + int64(2)) > this.dataLen {
    return
  }
  var numEntries int64= this.readUint16(pos);
  pos = pos + int64(2); 
  var i int64= int64(0);
  for i < numEntries {
    if  (pos + int64(12)) > this.dataLen {
      return
    }
    var tagId int64= this.readUint16(pos);
    var dataType int64= this.readUint16((pos + int64(2)));
    var numValues int64= this.readUint32((pos + int64(4)));
    var valueOffset int64= pos + int64(8);
    var dataSize int64= int64(0);
    if  dataType == int64(1) {
      dataSize = numValues; 
    }
    if  dataType == int64(2) {
      dataSize = numValues; 
    }
    if  dataType == int64(3) {
      dataSize = numValues * int64(2); 
    }
    if  dataType == int64(4) {
      dataSize = numValues * int64(4); 
    }
    if  dataType == int64(5) {
      dataSize = numValues * int64(8); 
    }
    if  dataType == int64(7) {
      dataSize = numValues; 
    }
    if  dataType == int64(9) {
      dataSize = numValues * int64(4); 
    }
    if  dataType == int64(10) {
      dataSize = numValues * int64(8); 
    }
    if  dataSize > int64(4) {
      valueOffset = tiffStart + this.readUint32((pos + int64(8))); 
    }
    var tagName string= this.getTagName(tagId, ifdType);
    var tagValue string= "";
    if  dataType == int64(2) {
      tagValue = this.readString(valueOffset, numValues); 
    }
    if  dataType == int64(3) {
      if  dataSize <= int64(4) {
        tagValue = strconv.FormatInt(this.readUint16((pos + int64(8))), 10); 
      } else {
        tagValue = strconv.FormatInt(this.readUint16(valueOffset), 10); 
      }
    }
    if  dataType == int64(4) {
      if  dataSize <= int64(4) {
        tagValue = strconv.FormatInt(this.readUint32((pos + int64(8))), 10); 
      } else {
        tagValue = strconv.FormatInt(this.readUint32(valueOffset), 10); 
      }
    }
    if  dataType == int64(5) {
      tagValue = this.formatRational(valueOffset); 
    }
    var tag *ExifTag= CreateNew_ExifTag();
    tag.tagId = tagId; 
    tag.tagName = tagName; 
    tag.tagValue = tagValue; 
    tag.dataType = dataType; 
    info.exifTags = append(info.exifTags,tag); 
    if  tagId == int64(271) {
      info.cameraMake = tagValue; 
    }
    if  tagId == int64(272) {
      info.cameraModel = tagValue; 
    }
    if  tagId == int64(305) {
      info.software = tagValue; 
    }
    if  tagId == int64(306) {
      info.dateTime = tagValue; 
    }
    if  tagId == int64(274) {
      info.orientation = this.readUint16((pos + int64(8))); 
    }
    if  tagId == int64(282) {
      info.xResolution = tagValue; 
    }
    if  tagId == int64(283) {
      info.yResolution = tagValue; 
    }
    if  tagId == int64(296) {
      info.resolutionUnit = this.readUint16((pos + int64(8))); 
    }
    if  tagId == int64(36867) {
      info.dateTimeOriginal = tagValue; 
    }
    if  tagId == int64(33434) {
      info.exposureTime = tagValue; 
    }
    if  tagId == int64(33437) {
      info.fNumber = tagValue; 
    }
    if  tagId == int64(34855) {
      info.isoSpeed = tagValue; 
    }
    if  tagId == int64(37386) {
      info.focalLength = tagValue; 
    }
    if  tagId == int64(37385) {
      var flashVal int64= this.readUint16((pos + int64(8)));
      if  (flashVal % int64(2)) == int64(1) {
        info.flash = "Fired"; 
      } else {
        info.flash = "Did not fire"; 
      }
    }
    if  tagId == int64(34665) {
      var exifOffset int64= this.readUint32((pos + int64(8)));
      this.parseIFD(info, tiffStart, exifOffset, int64(1));
    }
    if  tagId == int64(34853) {
      info.hasGPS = true; 
      var gpsOffset int64= this.readUint32((pos + int64(8)));
      this.parseIFD(info, tiffStart, gpsOffset, int64(2));
    }
    if  ifdType == int64(2) {
      if  tagId == int64(1) {
        info.gpsLatitudeRef = tagValue; 
      }
      if  tagId == int64(2) {
        info.gpsLatitude = this.formatGPSCoordinate(valueOffset, info.gpsLatitudeRef); 
      }
      if  tagId == int64(3) {
        info.gpsLongitudeRef = tagValue; 
      }
      if  tagId == int64(4) {
        info.gpsLongitude = this.formatGPSCoordinate(valueOffset, info.gpsLongitudeRef); 
      }
      if  tagId == int64(6) {
        var altNum int64= this.readUint32(valueOffset);
        var altDen int64= this.readUint32((valueOffset + int64(4)));
        if  altDen > int64(0) {
          var altWhole int64= int64(0);
          var tempAlt int64= altNum;
          for tempAlt >= altDen {
            tempAlt = tempAlt - altDen; 
            altWhole = altWhole + int64(1); 
          }
          var altRem int64= tempAlt;
          if  altRem > int64(0) {
            var altDecTemp int64= altRem * int64(10);
            var altDec int64= int64(0);
            for altDecTemp >= altDen {
              altDecTemp = altDecTemp - altDen; 
              altDec = altDec + int64(1); 
            }
            info.gpsAltitude = (((strconv.FormatInt(altWhole, 10)) + ".") + (strconv.FormatInt(altDec, 10))) + " m"; 
          } else {
            info.gpsAltitude = (strconv.FormatInt(altWhole, 10)) + " m"; 
          }
        } else {
          info.gpsAltitude = (strconv.FormatInt(altNum, 10)) + " m"; 
        }
      }
    }
    pos = pos + int64(12); 
    i = i + int64(1); 
  }
}
func (this *JPEGMetadataParser) parseExif (info *JPEGMetadataInfo, appStart int64, appLen int64) () {
  var header string= this.readString(appStart, int64(4));
  if  header != "Exif" {
    return
  }
  info.hasExif = true; 
  var tiffStart int64= appStart + int64(6);
  var byteOrder0 int64= int64(this.data[tiffStart]);
  var byteOrder1 int64= int64(this.data[(tiffStart + int64(1))]);
  if  (byteOrder0 == int64(73)) && (byteOrder1 == int64(73)) {
    this.littleEndian = true; 
  } else {
    if  (byteOrder0 == int64(77)) && (byteOrder1 == int64(77)) {
      this.littleEndian = false; 
    } else {
      return
    }
  }
  var magic int64= this.readUint16((tiffStart + int64(2)));
  if  magic != int64(42) {
    return
  }
  var ifd0Offset int64= this.readUint32((tiffStart + int64(4)));
  this.parseIFD(info, tiffStart, ifd0Offset, int64(0));
}
func (this *JPEGMetadataParser) parseJFIF (info *JPEGMetadataInfo, appStart int64, appLen int64) () {
  var header string= this.readString(appStart, int64(4));
  if  header != "JFIF" {
    return
  }
  info.hasJFIF = true; 
  var verMajor int64= int64(this.data[(appStart + int64(5))]);
  var verMinor int64= int64(this.data[(appStart + int64(6))]);
  info.jfifVersion = ((strconv.FormatInt(verMajor, 10)) + ".") + (strconv.FormatInt(verMinor, 10)); 
  info.densityUnits = int64(this.data[(appStart + int64(7))]); 
  info.xDensity = this.readUint16BE((appStart + int64(8))); 
  info.yDensity = this.readUint16BE((appStart + int64(10))); 
}
func (this *JPEGMetadataParser) parseComment (info *JPEGMetadataInfo, appStart int64, appLen int64) () {
  info.hasComment = true; 
  info.comment = this.readString(appStart, appLen); 
}
func (this *JPEGMetadataParser) parseMetadata (dirPath string, fileName string) *JPEGMetadataInfo {
  var info *JPEGMetadataInfo= CreateNew_JPEGMetadataInfo();
  this.data = func() []byte { d, _ := os.ReadFile(filepath.Join(dirPath, fileName)); return d }(); 
  this.dataLen = int64(len(this.data)); 
  if  this.dataLen < int64(4) {
    info.errorMessage = "File too small"; 
    return info
  }
  var m1 int64= int64(this.data[int64(0)]);
  var m2 int64= int64(this.data[int64(1)]);
  if  (m1 != int64(255)) || (m2 != int64(216)) {
    info.errorMessage = "Not a valid JPEG file"; 
    return info
  }
  info.isValid = true; 
  var pos int64= int64(2);
  for pos < this.dataLen {
    var marker1 int64= int64(this.data[pos]);
    if  marker1 != int64(255) {
      pos = pos + int64(1); 
      continue;
    }
    var marker2 int64= int64(this.data[(pos + int64(1))]);
    if  marker2 == int64(255) {
      pos = pos + int64(1); 
      continue;
    }
    if  (marker2 == int64(216)) || (marker2 == int64(217)) {
      pos = pos + int64(2); 
      continue;
    }
    if  (marker2 >= int64(208)) && (marker2 <= int64(215)) {
      pos = pos + int64(2); 
      continue;
    }
    if  (pos + int64(4)) > this.dataLen {
      return info
    }
    var segLen int64= this.readUint16BE((pos + int64(2)));
    var segStart int64= pos + int64(4);
    if  marker2 == int64(224) {
      this.parseJFIF(info, segStart, segLen - int64(2));
    }
    if  marker2 == int64(225) {
      this.parseExif(info, segStart, segLen - int64(2));
    }
    if  marker2 == int64(254) {
      this.parseComment(info, segStart, segLen - int64(2));
    }
    if  (marker2 == int64(192)) || (marker2 == int64(194)) {
      if  (pos + int64(9)) < this.dataLen {
        info.bitsPerComponent = int64(this.data[(pos + int64(4))]); 
        info.height = this.readUint16BE((pos + int64(5))); 
        info.width = this.readUint16BE((pos + int64(7))); 
        info.colorComponents = int64(this.data[(pos + int64(9))]); 
      }
    }
    if  marker2 == int64(218) {
      return info
    }
    if  marker2 == int64(217) {
      return info
    }
    pos = (pos + int64(2)) + segLen; 
  }
  return info
}
func (this *JPEGMetadataParser) formatMetadata (info *JPEGMetadataInfo) string {
  var out *GrowableBuffer= CreateNew_GrowableBuffer();
  out.writeString("=== JPEG Metadata ===\n\n");
  if  info.isValid == false {
    out.writeString(("Error: " + info.errorMessage) + "\n");
    return (out).toString()
  }
  out.writeString("--- Image Info ---\n");
  out.writeString(((("  Dimensions: " + (strconv.FormatInt(info.width, 10))) + " x ") + (strconv.FormatInt(info.height, 10))) + "\n");
  out.writeString(("  Color Components: " + (strconv.FormatInt(info.colorComponents, 10))) + "\n");
  out.writeString(("  Bits per Component: " + (strconv.FormatInt(info.bitsPerComponent, 10))) + "\n");
  if  info.hasJFIF {
    out.writeString("\n--- JFIF Info ---\n");
    out.writeString(("  Version: " + info.jfifVersion) + "\n");
    var densityStr string= "No units (aspect ratio)";
    if  info.densityUnits == int64(1) {
      densityStr = "pixels/inch"; 
    }
    if  info.densityUnits == int64(2) {
      densityStr = "pixels/cm"; 
    }
    out.writeString(((((("  Density: " + (strconv.FormatInt(info.xDensity, 10))) + " x ") + (strconv.FormatInt(info.yDensity, 10))) + " ") + densityStr) + "\n");
  }
  if  info.hasExif {
    out.writeString("\n--- EXIF Info ---\n");
    if  (int64(len([]rune(info.cameraMake)))) > int64(0) {
      out.writeString(("  Camera Make: " + info.cameraMake) + "\n");
    }
    if  (int64(len([]rune(info.cameraModel)))) > int64(0) {
      out.writeString(("  Camera Model: " + info.cameraModel) + "\n");
    }
    if  (int64(len([]rune(info.software)))) > int64(0) {
      out.writeString(("  Software: " + info.software) + "\n");
    }
    if  (int64(len([]rune(info.dateTimeOriginal)))) > int64(0) {
      out.writeString(("  Date/Time Original: " + info.dateTimeOriginal) + "\n");
    } else {
      if  (int64(len([]rune(info.dateTime)))) > int64(0) {
        out.writeString(("  Date/Time: " + info.dateTime) + "\n");
      }
    }
    if  (int64(len([]rune(info.exposureTime)))) > int64(0) {
      out.writeString(("  Exposure Time: " + info.exposureTime) + " sec\n");
    }
    if  (int64(len([]rune(info.fNumber)))) > int64(0) {
      out.writeString(("  F-Number: f/" + info.fNumber) + "\n");
    }
    if  (int64(len([]rune(info.isoSpeed)))) > int64(0) {
      out.writeString(("  ISO Speed: " + info.isoSpeed) + "\n");
    }
    if  (int64(len([]rune(info.focalLength)))) > int64(0) {
      out.writeString(("  Focal Length: " + info.focalLength) + " mm\n");
    }
    if  (int64(len([]rune(info.flash)))) > int64(0) {
      out.writeString(("  Flash: " + info.flash) + "\n");
    }
    var orientStr string= "Normal";
    if  info.orientation == int64(2) {
      orientStr = "Flip horizontal"; 
    }
    if  info.orientation == int64(3) {
      orientStr = "Rotate 180"; 
    }
    if  info.orientation == int64(4) {
      orientStr = "Flip vertical"; 
    }
    if  info.orientation == int64(5) {
      orientStr = "Transpose"; 
    }
    if  info.orientation == int64(6) {
      orientStr = "Rotate 90 CW"; 
    }
    if  info.orientation == int64(7) {
      orientStr = "Transverse"; 
    }
    if  info.orientation == int64(8) {
      orientStr = "Rotate 270 CW"; 
    }
    out.writeString(("  Orientation: " + orientStr) + "\n");
  }
  if  info.hasGPS {
    out.writeString("\n--- GPS Info ---\n");
    if  (int64(len([]rune(info.gpsLatitude)))) > int64(0) {
      out.writeString(("  Latitude: " + info.gpsLatitude) + "\n");
    }
    if  (int64(len([]rune(info.gpsLongitude)))) > int64(0) {
      out.writeString(("  Longitude: " + info.gpsLongitude) + "\n");
    }
    if  (int64(len([]rune(info.gpsAltitude)))) > int64(0) {
      out.writeString(("  Altitude: " + info.gpsAltitude) + "\n");
    }
  }
  if  info.hasComment {
    out.writeString("\n--- Comment ---\n");
    out.writeString(("  " + info.comment) + "\n");
  }
  var tagCount int64= int64(len(info.exifTags));
  if  tagCount > int64(0) {
    out.writeString(("\n--- All EXIF Tags (" + (strconv.FormatInt(tagCount, 10))) + ") ---\n");
    var idx int64 = 0;  
    for ; idx < int64(len(info.exifTags)) ; idx++ {
      tag := info.exifTags[idx];
      out.writeString(("  " + tag.tagName) + " (0x");
      var tagHex string= "";
      var tid int64= tag.tagId;
      var hexChars string= "0123456789ABCDEF";
      var h3D float64= float64(tid) / float64(int64(4096));
      var h3 int64= int64(h3D);
      var r3 int64= tid - (h3 * int64(4096));
      var h2D float64= float64(r3) / float64(int64(256));
      var h2 int64= int64(h2D);
      var r2 int64= r3 - (h2 * int64(256));
      var h1D float64= float64(r2) / float64(int64(16));
      var h1 int64= int64(h1D);
      var h0 int64= r2 - (h1 * int64(16));
      tagHex = (((string([]rune(hexChars)[h3:(h3 + int64(1))])) + (string([]rune(hexChars)[h2:(h2 + int64(1))]))) + (string([]rune(hexChars)[h1:(h1 + int64(1))]))) + (string([]rune(hexChars)[h0:(h0 + int64(1))])); 
      out.writeString(((tagHex + "): ") + tag.tagValue) + "\n");
    }
  }
  return (out).toString()
}
type JPEGMetadataMain struct { 
}

func CreateNew_JPEGMetadataMain() *JPEGMetadataMain {
  me := new(JPEGMetadataMain)
  return me;
}
type PDFWriter struct { 
  nextObjNum int64 `json:"nextObjNum"` 
  pdfBuffer *GoNullable `json:"pdfBuffer"` 
  objectOffsets []int64 `json:"objectOffsets"` 
  jpegReader *GoNullable `json:"jpegReader"` 
  metadataParser *GoNullable `json:"metadataParser"` 
  imageObjNum int64 `json:"imageObjNum"` 
  lastImageMetadata *GoNullable `json:"lastImageMetadata"` 
}

func CreateNew_PDFWriter() *PDFWriter {
  me := new(PDFWriter)
  me.nextObjNum = int64(1)
  me.objectOffsets = make([]int64,0)
  me.imageObjNum = int64(0)
  me.pdfBuffer = new(GoNullable);
  me.jpegReader = new(GoNullable);
  me.metadataParser = new(GoNullable);
  me.lastImageMetadata = new(GoNullable);
  var buf *GrowableBuffer= CreateNew_GrowableBuffer();
  me.pdfBuffer.value = buf;
  me.pdfBuffer.has_value = true; /* detected as non-optional */
  var reader *JPEGReader= CreateNew_JPEGReader();
  me.jpegReader.value = reader;
  me.jpegReader.has_value = true; /* detected as non-optional */
  var parser *JPEGMetadataParser= CreateNew_JPEGMetadataParser();
  me.metadataParser.value = parser;
  me.metadataParser.has_value = true; /* detected as non-optional */
  return me;
}
func (this *PDFWriter) writeObject (content string) () {
  var buf *GrowableBuffer= this.pdfBuffer.value.(*GrowableBuffer);
  this.objectOffsets = append(this.objectOffsets,(buf).size()); 
  buf.writeString((strconv.FormatInt(this.nextObjNum, 10)) + " 0 obj\n");
  buf.writeString(content);
  buf.writeString("\nendobj\n\n");
  this.nextObjNum = this.nextObjNum + int64(1); 
}
func (this *PDFWriter) writeObjectGetNum (content string) int64 {
  var objNum int64= this.nextObjNum;
  this.writeObject(content);
  return objNum
}
func (this *PDFWriter) writeImageObject (header string, imageData []byte, footer string) int64 {
  var buf *GrowableBuffer= this.pdfBuffer.value.(*GrowableBuffer);
  this.objectOffsets = append(this.objectOffsets,(buf).size()); 
  buf.writeString((strconv.FormatInt(this.nextObjNum, 10)) + " 0 obj\n");
  buf.writeString(header);
  buf.writeBuffer(imageData);
  buf.writeString(footer);
  buf.writeString("\nendobj\n\n");
  var objNum int64= this.nextObjNum;
  this.nextObjNum = this.nextObjNum + int64(1); 
  return objNum
}
func (this *PDFWriter) addJPEGImage (dirPath string, fileName string) int64 {
  var reader *JPEGReader= this.jpegReader.value.(*JPEGReader);
  var img *JPEGImage= reader.readJPEG(dirPath, fileName);
  if  img.isValid == false {
    fmt.Println( "Error loading image: " + img.errorMessage )
    return int64(0)
  }
  fmt.Println( reader.getImageInfo(img) )
  var parser *JPEGMetadataParser= this.metadataParser.value.(*JPEGMetadataParser);
  var meta *JPEGMetadataInfo= parser.parseMetadata(dirPath, fileName);
  this.lastImageMetadata.value = meta;
  this.lastImageMetadata.has_value = true; /* detected as non-optional */
  var colorSpace string= "/DeviceRGB";
  if  img.colorComponents == int64(1) {
    colorSpace = "/DeviceGray"; 
  }
  if  img.colorComponents == int64(4) {
    colorSpace = "/DeviceCMYK"; 
  }
  var imgData []byte= img.imageData.value.([]byte);
  var dataLen int64= int64(len(imgData));
  var imgHeader string= "<< /Type /XObject /Subtype /Image";
  imgHeader = (imgHeader + " /Width ") + (strconv.FormatInt(img.width, 10)); 
  imgHeader = (imgHeader + " /Height ") + (strconv.FormatInt(img.height, 10)); 
  imgHeader = (imgHeader + " /ColorSpace ") + colorSpace; 
  imgHeader = (imgHeader + " /BitsPerComponent ") + (strconv.FormatInt(img.bitsPerComponent, 10)); 
  imgHeader = imgHeader + " /Filter /DCTDecode"; 
  imgHeader = (imgHeader + " /Length ") + (strconv.FormatInt(dataLen, 10)); 
  imgHeader = imgHeader + " >>\nstream\n"; 
  var imgFooter string= "\nendstream";
  this.imageObjNum = this.writeImageObject(imgHeader, imgData, imgFooter); 
  return this.imageObjNum
}
func (this *PDFWriter) toOctalEscape (ch int64) string {
  var d0 int64= ch % int64(8);
  var t1 int64= int64(math.Floor((float64(ch) / float64(int64(8)))));
  var d1 int64= t1 % int64(8);
  var d2 int64= int64(math.Floor((float64(t1) / float64(int64(8)))));
  return (("\\" + (strconv.FormatInt(d2, 10))) + (strconv.FormatInt(d1, 10))) + (strconv.FormatInt(d0, 10))
}
func (this *PDFWriter) escapeText (text string) string {
  var result string= "";
  var __len int64= int64(len([]rune(text)));
  var i int64= int64(0);
  for i < __len {
    var ch int64= int64([]rune(text)[i]);
    if  ch == int64(40) {
      result = result + "\\("; 
    } else {
      if  ch == int64(41) {
        result = result + "\\)"; 
      } else {
        if  ch == int64(92) {
          result = result + "\\\\"; 
        } else {
          if  ch < int64(128) {
            result = result + (string([]rune{rune(ch)})); 
          } else {
            if  ch <= int64(255) {
              result = result + this.toOctalEscape(ch); 
            } else {
              result = result + "?"; 
            }
          }
        }
      }
    }
    i = i + int64(1); 
  }
  return result
}
func (this *PDFWriter) createHelloWorldPDF (message string) []byte {
  return this.createPDFWithImage(message, "", "")
}
func (this *PDFWriter) createPDFWithImage (message string, imageDirPath string, imageFileName string) []byte {
  this.nextObjNum = int64(1); 
  var buf *GrowableBuffer= this.pdfBuffer.value.(*GrowableBuffer);
  (buf).clear();
  this.imageObjNum = int64(0); 
  this.objectOffsets = this.objectOffsets[:0]
  buf.writeString("%PDF-1.4\n");
  buf.writeByte(int64(37));
  buf.writeByte(int64(226));
  buf.writeByte(int64(227));
  buf.writeByte(int64(207));
  buf.writeByte(int64(211));
  buf.writeByte(int64(10));
  var hasImage bool= (int64(len([]rune(imageFileName)))) > int64(0);
  if  hasImage {
    var imgNum int64= this.addJPEGImage(imageDirPath, imageFileName);
    if  imgNum == int64(0) {
      hasImage = false; 
    }
  }
  /** unused:  catalogObjNum*/
  var pagesObjNum int64= this.nextObjNum + int64(1);
  this.writeObject(("<< /Type /Catalog /Pages " + (strconv.FormatInt(pagesObjNum, 10))) + " 0 R >>");
  var pageObjNum int64= this.nextObjNum + int64(1);
  this.writeObject(("<< /Type /Pages /Kids [" + (strconv.FormatInt(pageObjNum, 10))) + " 0 R] /Count 1 >>");
  var contentObjNum int64= this.nextObjNum + int64(1);
  var fontObjNum int64= this.nextObjNum + int64(2);
  var resourcesStr string= ("<< /Font << /F1 " + (strconv.FormatInt(fontObjNum, 10))) + " 0 R >>";
  if  hasImage {
    resourcesStr = ((resourcesStr + " /XObject << /Img1 ") + (strconv.FormatInt(this.imageObjNum, 10))) + " 0 R >>"; 
  }
  resourcesStr = resourcesStr + " >>"; 
  this.writeObject(((((("<< /Type /Page /Parent " + (strconv.FormatInt(pagesObjNum, 10))) + " 0 R /MediaBox [0 0 612 792] /Contents ") + (strconv.FormatInt(contentObjNum, 10))) + " 0 R /Resources ") + resourcesStr) + " >>");
  var streamBuf *GrowableBuffer= CreateNew_GrowableBuffer();
  if  hasImage {
    streamBuf.writeString("q\n");
    streamBuf.writeString("150 0 0 150 400 600 cm\n");
    streamBuf.writeString("/Img1 Do\n");
    streamBuf.writeString("Q\n");
  }
  streamBuf.writeString("q\n");
  streamBuf.writeString("1 0 0 RG\n");
  streamBuf.writeString("1 0.8 0.8 rg\n");
  streamBuf.writeString("2 w\n");
  streamBuf.writeString("100 650 80 60 re\n");
  streamBuf.writeString("B\n");
  streamBuf.writeString("Q\n");
  streamBuf.writeString("q\n");
  streamBuf.writeString("0 0 1 RG\n");
  streamBuf.writeString("0.8 0.8 1 rg\n");
  streamBuf.writeString("2 w\n");
  streamBuf.writeString("220 650 m\n");
  streamBuf.writeString("280 650 l\n");
  streamBuf.writeString("250 710 l\n");
  streamBuf.writeString("h\n");
  streamBuf.writeString("B\n");
  streamBuf.writeString("Q\n");
  streamBuf.writeString("q\n");
  streamBuf.writeString("0 0.5 0 RG\n");
  streamBuf.writeString("0.8 1 0.8 rg\n");
  streamBuf.writeString("2 w\n");
  var cx int64= int64(370);
  var cy int64= int64(680);
  var r int64= int64(30);
  var k int64= int64(17);
  streamBuf.writeString((((strconv.FormatInt((cx + r), 10)) + " ") + (strconv.FormatInt(cy, 10))) + " m\n");
  streamBuf.writeString((((((((((((strconv.FormatInt((cx + r), 10)) + " ") + (strconv.FormatInt((cy + k), 10))) + " ") + (strconv.FormatInt((cx + k), 10))) + " ") + (strconv.FormatInt((cy + r), 10))) + " ") + (strconv.FormatInt(cx, 10))) + " ") + (strconv.FormatInt((cy + r), 10))) + " c\n");
  streamBuf.writeString((((((((((((strconv.FormatInt((cx - k), 10)) + " ") + (strconv.FormatInt((cy + r), 10))) + " ") + (strconv.FormatInt((cx - r), 10))) + " ") + (strconv.FormatInt((cy + k), 10))) + " ") + (strconv.FormatInt((cx - r), 10))) + " ") + (strconv.FormatInt(cy, 10))) + " c\n");
  streamBuf.writeString((((((((((((strconv.FormatInt((cx - r), 10)) + " ") + (strconv.FormatInt((cy - k), 10))) + " ") + (strconv.FormatInt((cx - k), 10))) + " ") + (strconv.FormatInt((cy - r), 10))) + " ") + (strconv.FormatInt(cx, 10))) + " ") + (strconv.FormatInt((cy - r), 10))) + " c\n");
  streamBuf.writeString((((((((((((strconv.FormatInt((cx + k), 10)) + " ") + (strconv.FormatInt((cy - r), 10))) + " ") + (strconv.FormatInt((cx + r), 10))) + " ") + (strconv.FormatInt((cy - k), 10))) + " ") + (strconv.FormatInt((cx + r), 10))) + " ") + (strconv.FormatInt(cy, 10))) + " c\n");
  streamBuf.writeString("B\n");
  streamBuf.writeString("Q\n");
  streamBuf.writeString("q\n");
  streamBuf.writeString("0.8 0 0.2 RG\n");
  streamBuf.writeString("1 0.4 0.5 rg\n");
  streamBuf.writeString("2 w\n");
  streamBuf.writeString("140 480 m\n");
  streamBuf.writeString("90 510 80 560 110 580 c\n");
  streamBuf.writeString("130 595 140 580 140 565 c\n");
  streamBuf.writeString("140 580 150 595 170 580 c\n");
  streamBuf.writeString("200 560 190 510 140 480 c\n");
  streamBuf.writeString("h\n");
  streamBuf.writeString("B\n");
  streamBuf.writeString("Q\n");
  streamBuf.writeString("q\n");
  streamBuf.writeString("0 0.5 0.8 RG\n");
  streamBuf.writeString("2 w\n");
  var sx int64= int64(300);
  var sy int64= int64(530);
  var arm int64= int64(50);
  streamBuf.writeString((((strconv.FormatInt(sx, 10)) + " ") + (strconv.FormatInt(sy, 10))) + " m\n");
  streamBuf.writeString((((strconv.FormatInt(sx, 10)) + " ") + (strconv.FormatInt((sy + arm), 10))) + " l\n");
  streamBuf.writeString((((strconv.FormatInt(sx, 10)) + " ") + (strconv.FormatInt(sy, 10))) + " m\n");
  streamBuf.writeString((((strconv.FormatInt((sx + int64(43)), 10)) + " ") + (strconv.FormatInt((sy + int64(25)), 10))) + " l\n");
  streamBuf.writeString((((strconv.FormatInt(sx, 10)) + " ") + (strconv.FormatInt(sy, 10))) + " m\n");
  streamBuf.writeString((((strconv.FormatInt((sx + int64(43)), 10)) + " ") + (strconv.FormatInt((sy - int64(25)), 10))) + " l\n");
  streamBuf.writeString((((strconv.FormatInt(sx, 10)) + " ") + (strconv.FormatInt(sy, 10))) + " m\n");
  streamBuf.writeString((((strconv.FormatInt(sx, 10)) + " ") + (strconv.FormatInt((sy - arm), 10))) + " l\n");
  streamBuf.writeString((((strconv.FormatInt(sx, 10)) + " ") + (strconv.FormatInt(sy, 10))) + " m\n");
  streamBuf.writeString((((strconv.FormatInt((sx - int64(43)), 10)) + " ") + (strconv.FormatInt((sy - int64(25)), 10))) + " l\n");
  streamBuf.writeString((((strconv.FormatInt(sx, 10)) + " ") + (strconv.FormatInt(sy, 10))) + " m\n");
  streamBuf.writeString((((strconv.FormatInt((sx - int64(43)), 10)) + " ") + (strconv.FormatInt((sy + int64(25)), 10))) + " l\n");
  streamBuf.writeString((((strconv.FormatInt((sx - int64(10)), 10)) + " ") + (strconv.FormatInt(((sy + arm) - int64(10)), 10))) + " m\n");
  streamBuf.writeString((((strconv.FormatInt(sx, 10)) + " ") + (strconv.FormatInt((sy + arm), 10))) + " l\n");
  streamBuf.writeString((((strconv.FormatInt((sx + int64(10)), 10)) + " ") + (strconv.FormatInt(((sy + arm) - int64(10)), 10))) + " l\n");
  streamBuf.writeString((((strconv.FormatInt((sx - int64(10)), 10)) + " ") + (strconv.FormatInt(((sy - arm) + int64(10)), 10))) + " m\n");
  streamBuf.writeString((((strconv.FormatInt(sx, 10)) + " ") + (strconv.FormatInt((sy - arm), 10))) + " l\n");
  streamBuf.writeString((((strconv.FormatInt((sx + int64(10)), 10)) + " ") + (strconv.FormatInt(((sy - arm) + int64(10)), 10))) + " l\n");
  streamBuf.writeString("S\n");
  streamBuf.writeString("Q\n");
  streamBuf.writeString("q\n");
  streamBuf.writeString("0.8 0.6 0 RG\n");
  streamBuf.writeString("1 0.9 0.3 rg\n");
  streamBuf.writeString("2 w\n");
  streamBuf.writeString("460 575 m\n");
  streamBuf.writeString("472 545 l\n");
  streamBuf.writeString("505 545 l\n");
  streamBuf.writeString("478 522 l\n");
  streamBuf.writeString("488 490 l\n");
  streamBuf.writeString("460 508 l\n");
  streamBuf.writeString("432 490 l\n");
  streamBuf.writeString("442 522 l\n");
  streamBuf.writeString("415 545 l\n");
  streamBuf.writeString("448 545 l\n");
  streamBuf.writeString("h\n");
  streamBuf.writeString("B\n");
  streamBuf.writeString("Q\n");
  streamBuf.writeString("q\n");
  streamBuf.writeString("0.5 0.5 0.5 RG\n");
  streamBuf.writeString("1 w\n");
  streamBuf.writeString("50 450 m\n");
  streamBuf.writeString("562 450 l\n");
  streamBuf.writeString("S\n");
  streamBuf.writeString("Q\n");
  streamBuf.writeString("q\n");
  streamBuf.writeString("0.6 0 0.6 RG\n");
  streamBuf.writeString("3 w\n");
  streamBuf.writeString("50 400 m\n");
  streamBuf.writeString("150 450 200 350 300 400 c\n");
  streamBuf.writeString("400 450 450 350 550 400 c\n");
  streamBuf.writeString("S\n");
  streamBuf.writeString("Q\n");
  streamBuf.writeString("BT\n");
  streamBuf.writeString("/F1 36 Tf\n");
  streamBuf.writeString("100 320 Td\n");
  streamBuf.writeString(("(" + this.escapeText(message)) + ") Tj\n");
  streamBuf.writeString("ET\n");
  streamBuf.writeString("BT\n");
  streamBuf.writeString("/F1 14 Tf\n");
  streamBuf.writeString("100 280 Td\n");
  streamBuf.writeString("(Generated by Ranger PDF Writer) Tj\n");
  streamBuf.writeString("ET\n");
  streamBuf.writeString("BT\n/F1 10 Tf\n100 630 Td\n(Rectangle) Tj\nET\n");
  streamBuf.writeString("BT\n/F1 10 Tf\n225 630 Td\n(Triangle) Tj\nET\n");
  streamBuf.writeString("BT\n/F1 10 Tf\n355 630 Td\n(Circle) Tj\nET\n");
  streamBuf.writeString("BT\n/F1 10 Tf\n125 465 Td\n(Heart) Tj\nET\n");
  streamBuf.writeString("BT\n/F1 10 Tf\n275 465 Td\n(Snowflake) Tj\nET\n");
  streamBuf.writeString("BT\n/F1 10 Tf\n445 465 Td\n(Star) Tj\nET\n");
  if  hasImage {
    streamBuf.writeString("BT\n/F1 10 Tf\n400 585 Td\n(JPEG Image) Tj\nET\n");
    if  this.lastImageMetadata.has_value {
      var meta *JPEGMetadataInfo= this.lastImageMetadata.value.(*JPEGMetadataInfo);
      var metaY int64= int64(240);
      streamBuf.writeString(("BT\n/F1 12 Tf\n400 " + (strconv.FormatInt(metaY, 10))) + " Td\n(Image Metadata:) Tj\nET\n");
      metaY = metaY - int64(14); 
      streamBuf.writeString(((((("BT\n/F1 9 Tf\n400 " + (strconv.FormatInt(metaY, 10))) + " Td\n(Size: ") + (strconv.FormatInt(meta.width, 10))) + " x ") + (strconv.FormatInt(meta.height, 10))) + ") Tj\nET\n");
      metaY = metaY - int64(12); 
      if  meta.hasExif {
        if  (int64(len([]rune(meta.cameraMake)))) > int64(0) {
          streamBuf.writeString(((("BT\n/F1 9 Tf\n400 " + (strconv.FormatInt(metaY, 10))) + " Td\n(Make: ") + this.escapeText(meta.cameraMake)) + ") Tj\nET\n");
          metaY = metaY - int64(12); 
        }
        if  (int64(len([]rune(meta.cameraModel)))) > int64(0) {
          streamBuf.writeString(((("BT\n/F1 9 Tf\n400 " + (strconv.FormatInt(metaY, 10))) + " Td\n(Model: ") + this.escapeText(meta.cameraModel)) + ") Tj\nET\n");
          metaY = metaY - int64(12); 
        }
        if  (int64(len([]rune(meta.dateTimeOriginal)))) > int64(0) {
          streamBuf.writeString(((("BT\n/F1 9 Tf\n400 " + (strconv.FormatInt(metaY, 10))) + " Td\n(Date: ") + this.escapeText(meta.dateTimeOriginal)) + ") Tj\nET\n");
          metaY = metaY - int64(12); 
        }
        if  (int64(len([]rune(meta.exposureTime)))) > int64(0) {
          streamBuf.writeString(((("BT\n/F1 9 Tf\n400 " + (strconv.FormatInt(metaY, 10))) + " Td\n(Exposure: ") + meta.exposureTime) + " sec) Tj\nET\n");
          metaY = metaY - int64(12); 
        }
        if  (int64(len([]rune(meta.fNumber)))) > int64(0) {
          streamBuf.writeString(((("BT\n/F1 9 Tf\n400 " + (strconv.FormatInt(metaY, 10))) + " Td\n(Aperture: f/") + meta.fNumber) + ") Tj\nET\n");
          metaY = metaY - int64(12); 
        }
        if  (int64(len([]rune(meta.isoSpeed)))) > int64(0) {
          streamBuf.writeString(((("BT\n/F1 9 Tf\n400 " + (strconv.FormatInt(metaY, 10))) + " Td\n(ISO: ") + meta.isoSpeed) + ") Tj\nET\n");
          metaY = metaY - int64(12); 
        }
        if  (int64(len([]rune(meta.focalLength)))) > int64(0) {
          streamBuf.writeString(((("BT\n/F1 9 Tf\n400 " + (strconv.FormatInt(metaY, 10))) + " Td\n(Focal Length: ") + meta.focalLength) + " mm) Tj\nET\n");
          metaY = metaY - int64(12); 
        }
        if  (int64(len([]rune(meta.flash)))) > int64(0) {
          streamBuf.writeString(((("BT\n/F1 9 Tf\n400 " + (strconv.FormatInt(metaY, 10))) + " Td\n(Flash: ") + meta.flash) + ") Tj\nET\n");
          metaY = metaY - int64(12); 
        }
      }
      if  meta.hasGPS {
        streamBuf.writeString(("BT\n/F1 9 Tf\n400 " + (strconv.FormatInt(metaY, 10))) + " Td\n(--- GPS Data ---) Tj\nET\n");
        metaY = metaY - int64(12); 
        if  (int64(len([]rune(meta.gpsLatitude)))) > int64(0) {
          streamBuf.writeString(((("BT\n/F1 9 Tf\n400 " + (strconv.FormatInt(metaY, 10))) + " Td\n(Latitude: ") + meta.gpsLatitude) + ") Tj\nET\n");
          metaY = metaY - int64(12); 
        }
        if  (int64(len([]rune(meta.gpsLongitude)))) > int64(0) {
          streamBuf.writeString(((("BT\n/F1 9 Tf\n400 " + (strconv.FormatInt(metaY, 10))) + " Td\n(Longitude: ") + meta.gpsLongitude) + ") Tj\nET\n");
          metaY = metaY - int64(12); 
        }
        if  (int64(len([]rune(meta.gpsAltitude)))) > int64(0) {
          streamBuf.writeString(((("BT\n/F1 9 Tf\n400 " + (strconv.FormatInt(metaY, 10))) + " Td\n(Altitude: ") + meta.gpsAltitude) + ") Tj\nET\n");
          metaY = metaY - int64(12); 
        }
      }
    }
  }
  var streamLen int64= (streamBuf).size();
  var streamContent string= (streamBuf).toString();
  this.writeObject(((("<< /Length " + (strconv.FormatInt(streamLen, 10))) + " >>\nstream\n") + streamContent) + "endstream");
  this.writeObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
  var rootObjNum int64= int64(1);
  if  hasImage {
    rootObjNum = int64(2); 
  }
  var xrefOffset int64= (buf).size();
  buf.writeString("xref\n");
  buf.writeString(("0 " + (strconv.FormatInt(this.nextObjNum, 10))) + "\n");
  buf.writeString("0000000000 65535 f \n");
  var i int64 = 0;  
  for ; i < int64(len(this.objectOffsets)) ; i++ {
    offset := this.objectOffsets[i];
    var offsetStr string= strconv.FormatInt(offset, 10);
    for (int64(len([]rune(offsetStr)))) < int64(10) {
      offsetStr = "0" + offsetStr; 
    }
    buf.writeString(offsetStr + " 00000 n \n");
  }
  buf.writeString("trailer\n");
  buf.writeString(((("<< /Size " + (strconv.FormatInt(this.nextObjNum, 10))) + " /Root ") + (strconv.FormatInt(rootObjNum, 10))) + " 0 R >>\n");
  buf.writeString("startxref\n");
  buf.writeString((strconv.FormatInt(xrefOffset, 10)) + "\n");
  buf.writeString("%%EOF\n");
  return buf.toBuffer()
}
func (this *PDFWriter) savePDF (path string, filename string, message string) () {
  var pdfContent []byte= this.createHelloWorldPDF(message);
  os.WriteFile(path + "/" + filename, pdfContent, 0644)
  fmt.Println( (("PDF saved to " + path) + "/") + filename )
}
func (this *PDFWriter) savePDFWithImage (path string, filename string, message string, imageDirPath string, imageFileName string) () {
  var pdfContent []byte= this.createPDFWithImage(message, imageDirPath, imageFileName);
  os.WriteFile(path + "/" + filename, pdfContent, 0644)
  fmt.Println( (("PDF saved to " + path) + "/") + filename )
}
type Main struct { 
}

func CreateNew_Main() *Main {
  me := new(Main)
  return me;
}
type EVGTextMetrics struct { 
  width float64 `json:"width"` 
  height float64 `json:"height"` 
  ascent float64 `json:"ascent"` 
  descent float64 `json:"descent"` 
  lineHeight float64 `json:"lineHeight"` 
}

func CreateNew_EVGTextMetrics() *EVGTextMetrics {
  me := new(EVGTextMetrics)
  me.width = 0.0
  me.height = 0.0
  me.ascent = 0.0
  me.descent = 0.0
  me.lineHeight = 0.0
  me.width = 0.0; 
  me.height = 0.0; 
  me.ascent = 0.0; 
  me.descent = 0.0; 
  me.lineHeight = 0.0; 
  return me;
}
func EVGTextMetrics_static_create(w float64, h float64) *EVGTextMetrics {
  var m *EVGTextMetrics= CreateNew_EVGTextMetrics();
  m.width = w; 
  m.height = h; 
  return m
}
type EVGTextMeasurer struct { 
}
type IFACE_EVGTextMeasurer interface { 
  measureText(text string, fontFamily string, fontSize float64) *EVGTextMetrics
  measureTextWidth(text string, fontFamily string, fontSize float64) float64
  getLineHeight(fontFamily string, fontSize float64) float64
  measureChar(ch int64, fontFamily string, fontSize float64) float64
  wrapText(text string, fontFamily string, fontSize float64, maxWidth float64) []string
}

func CreateNew_EVGTextMeasurer() *EVGTextMeasurer {
  me := new(EVGTextMeasurer)
  return me;
}
func (this *EVGTextMeasurer) measureText (text string, fontFamily string, fontSize float64) *EVGTextMetrics {
  var avgCharWidth float64= fontSize * 0.55;
  var textLen int64= int64(len([]rune(text)));
  var width float64= (float64( textLen )) * avgCharWidth;
  var lineHeight float64= fontSize * 1.2;
  var metrics *EVGTextMetrics= CreateNew_EVGTextMetrics();
  metrics.width = width; 
  metrics.height = lineHeight; 
  metrics.ascent = fontSize * 0.8; 
  metrics.descent = fontSize * 0.2; 
  metrics.lineHeight = lineHeight; 
  return metrics
}
func (this *EVGTextMeasurer) measureTextWidth (text string, fontFamily string, fontSize float64) float64 {
  var metrics *EVGTextMetrics= this.measureText(text, fontFamily, fontSize);
  return metrics.width
}
func (this *EVGTextMeasurer) getLineHeight (fontFamily string, fontSize float64) float64 {
  return fontSize * 1.2
}
func (this *EVGTextMeasurer) measureChar (ch int64, fontFamily string, fontSize float64) float64 {
  if  ch == int64(32) {
    return fontSize * 0.3
  }
  if  ((((ch == int64(105)) || (ch == int64(108))) || (ch == int64(106))) || (ch == int64(116))) || (ch == int64(102)) {
    return fontSize * 0.3
  }
  if  (ch == int64(109)) || (ch == int64(119)) {
    return fontSize * 0.8
  }
  if  (ch == int64(77)) || (ch == int64(87)) {
    return fontSize * 0.9
  }
  if  ch == int64(73) {
    return fontSize * 0.35
  }
  return fontSize * 0.55
}
func (this *EVGTextMeasurer) wrapText (text string, fontFamily string, fontSize float64, maxWidth float64) []string {
  var lines []string = make([]string, 0);
  var currentLine string= "";
  var currentWidth float64= 0.0;
  var wordStart int64= int64(0);
  var textLen int64= int64(len([]rune(text)));
  var i int64= int64(0);
  for i <= textLen {
    var ch int64= int64(0);
    var isEnd bool= i == textLen;
    if  isEnd == false {
      ch = int64([]rune(text)[i]); 
    }
    var isWordEnd bool= false;
    if  isEnd {
      isWordEnd = true; 
    }
    if  ch == int64(32) {
      isWordEnd = true; 
    }
    if  ch == int64(10) {
      isWordEnd = true; 
    }
    if  isWordEnd {
      var word string= "";
      if  i > wordStart {
        word = string([]rune(text)[wordStart:i]); 
      }
      var wordWidth float64= this.measureTextWidth(word, fontFamily, fontSize);
      var spaceWidth float64= 0.0;
      if  (int64(len([]rune(currentLine)))) > int64(0) {
        spaceWidth = this.measureTextWidth(" ", fontFamily, fontSize); 
      }
      if  ((currentWidth + spaceWidth) + wordWidth) <= maxWidth {
        if  (int64(len([]rune(currentLine)))) > int64(0) {
          currentLine = currentLine + " "; 
          currentWidth = currentWidth + spaceWidth; 
        }
        currentLine = currentLine + word; 
        currentWidth = currentWidth + wordWidth; 
      } else {
        if  (int64(len([]rune(currentLine)))) > int64(0) {
          lines = append(lines,currentLine); 
        }
        currentLine = word; 
        currentWidth = wordWidth; 
      }
      if  ch == int64(10) {
        lines = append(lines,currentLine); 
        currentLine = ""; 
        currentWidth = 0.0; 
      }
      wordStart = i + int64(1); 
    }
    i = i + int64(1); 
  }
  if  (int64(len([]rune(currentLine)))) > int64(0) {
    lines = append(lines,currentLine); 
  }
  return lines
}
type SimpleTextMeasurer struct { 
  charWidthRatio float64 `json:"charWidthRatio"` 
  // inherited from parent class EVGTextMeasurer
}
type IFACE_SimpleTextMeasurer interface { 
  Get_charWidthRatio() float64
  Set_charWidthRatio(value float64) 
  setCharWidthRatio(ratio float64) ()
  measureText(text string, fontFamily string, fontSize float64) *EVGTextMetrics
}

func CreateNew_SimpleTextMeasurer() *SimpleTextMeasurer {
  me := new(SimpleTextMeasurer)
  me.charWidthRatio = 0.55
  return me;
}
func (this *SimpleTextMeasurer) setCharWidthRatio (ratio float64) () {
  this.charWidthRatio = ratio; 
}
func (this *SimpleTextMeasurer) measureText (text string, fontFamily string, fontSize float64) *EVGTextMetrics {
  var textLen int64= int64(len([]rune(text)));
  var width float64= 0.0;
  var i int64= int64(0);
  for i < textLen {
    var ch int64= int64([]rune(text)[i]);
    width = width + this.measureChar(ch, fontFamily, fontSize); 
    i = i + int64(1); 
  }
  var lineHeight float64= fontSize * 1.2;
  var metrics *EVGTextMetrics= CreateNew_EVGTextMetrics();
  metrics.width = width; 
  metrics.height = lineHeight; 
  metrics.ascent = fontSize * 0.8; 
  metrics.descent = fontSize * 0.2; 
  metrics.lineHeight = lineHeight; 
  return metrics
}
// inherited methods from parent class EVGTextMeasurer
func (this *SimpleTextMeasurer) measureTextWidth (text string, fontFamily string, fontSize float64) float64 {
  var metrics *EVGTextMetrics= this.measureText(text, fontFamily, fontSize);
  return metrics.width
}
func (this *SimpleTextMeasurer) getLineHeight (fontFamily string, fontSize float64) float64 {
  return fontSize * 1.2
}
func (this *SimpleTextMeasurer) measureChar (ch int64, fontFamily string, fontSize float64) float64 {
  if  ch == int64(32) {
    return fontSize * 0.3
  }
  if  ((((ch == int64(105)) || (ch == int64(108))) || (ch == int64(106))) || (ch == int64(116))) || (ch == int64(102)) {
    return fontSize * 0.3
  }
  if  (ch == int64(109)) || (ch == int64(119)) {
    return fontSize * 0.8
  }
  if  (ch == int64(77)) || (ch == int64(87)) {
    return fontSize * 0.9
  }
  if  ch == int64(73) {
    return fontSize * 0.35
  }
  return fontSize * 0.55
}
func (this *SimpleTextMeasurer) wrapText (text string, fontFamily string, fontSize float64, maxWidth float64) []string {
  var lines []string = make([]string, 0);
  var currentLine string= "";
  var currentWidth float64= 0.0;
  var wordStart int64= int64(0);
  var textLen int64= int64(len([]rune(text)));
  var i int64= int64(0);
  for i <= textLen {
    var ch int64= int64(0);
    var isEnd bool= i == textLen;
    if  isEnd == false {
      ch = int64([]rune(text)[i]); 
    }
    var isWordEnd bool= false;
    if  isEnd {
      isWordEnd = true; 
    }
    if  ch == int64(32) {
      isWordEnd = true; 
    }
    if  ch == int64(10) {
      isWordEnd = true; 
    }
    if  isWordEnd {
      var word string= "";
      if  i > wordStart {
        word = string([]rune(text)[wordStart:i]); 
      }
      var wordWidth float64= this.measureTextWidth(word, fontFamily, fontSize);
      var spaceWidth float64= 0.0;
      if  (int64(len([]rune(currentLine)))) > int64(0) {
        spaceWidth = this.measureTextWidth(" ", fontFamily, fontSize); 
      }
      if  ((currentWidth + spaceWidth) + wordWidth) <= maxWidth {
        if  (int64(len([]rune(currentLine)))) > int64(0) {
          currentLine = currentLine + " "; 
          currentWidth = currentWidth + spaceWidth; 
        }
        currentLine = currentLine + word; 
        currentWidth = currentWidth + wordWidth; 
      } else {
        if  (int64(len([]rune(currentLine)))) > int64(0) {
          lines = append(lines,currentLine); 
        }
        currentLine = word; 
        currentWidth = wordWidth; 
      }
      if  ch == int64(10) {
        lines = append(lines,currentLine); 
        currentLine = ""; 
        currentWidth = 0.0; 
      }
      wordStart = i + int64(1); 
    }
    i = i + int64(1); 
  }
  if  (int64(len([]rune(currentLine)))) > int64(0) {
    lines = append(lines,currentLine); 
  }
  return lines
}
// getter for variable charWidthRatio
func (this *SimpleTextMeasurer) Get_charWidthRatio() float64 {
  return this.charWidthRatio
}
// setter for variable charWidthRatio
func (this *SimpleTextMeasurer) Set_charWidthRatio( value float64)  {
  this.charWidthRatio = value 
}
// inherited getters and setters from the parent class EVGTextMeasurer
type EVGImageDimensions struct { 
  width int64 `json:"width"` 
  height int64 `json:"height"` 
  aspectRatio float64 `json:"aspectRatio"` 
  isValid bool `json:"isValid"` 
}

func CreateNew_EVGImageDimensions() *EVGImageDimensions {
  me := new(EVGImageDimensions)
  me.width = int64(0)
  me.height = int64(0)
  me.aspectRatio = 1.0
  me.isValid = false
  me.width = int64(0); 
  me.height = int64(0); 
  me.aspectRatio = 1.0; 
  me.isValid = false; 
  return me;
}
func EVGImageDimensions_static_create(w int64, h int64) *EVGImageDimensions {
  var d *EVGImageDimensions= CreateNew_EVGImageDimensions();
  d.width = w; 
  d.height = h; 
  if  h > int64(0) {
    d.aspectRatio = (float64( w )) / (float64( h )); 
  }
  d.isValid = true; 
  return d
}
type EVGImageMeasurer struct { 
}
type IFACE_EVGImageMeasurer interface { 
  getImageDimensions(src string) *EVGImageDimensions
  calculateHeightForWidth(src string, targetWidth float64) float64
  calculateWidthForHeight(src string, targetHeight float64) float64
  calculateFitDimensions(src string, maxWidth float64, maxHeight float64) *EVGImageDimensions
}

func CreateNew_EVGImageMeasurer() *EVGImageMeasurer {
  me := new(EVGImageMeasurer)
  return me;
}
func (this *EVGImageMeasurer) getImageDimensions (src string) *EVGImageDimensions {
  var dims *EVGImageDimensions= CreateNew_EVGImageDimensions();
  return dims
}
func (this *EVGImageMeasurer) calculateHeightForWidth (src string, targetWidth float64) float64 {
  var dims *EVGImageDimensions= this.getImageDimensions(src);
  if  dims.isValid {
    return targetWidth / dims.aspectRatio
  }
  return targetWidth
}
func (this *EVGImageMeasurer) calculateWidthForHeight (src string, targetHeight float64) float64 {
  var dims *EVGImageDimensions= this.getImageDimensions(src);
  if  dims.isValid {
    return targetHeight * dims.aspectRatio
  }
  return targetHeight
}
func (this *EVGImageMeasurer) calculateFitDimensions (src string, maxWidth float64, maxHeight float64) *EVGImageDimensions {
  var dims *EVGImageDimensions= this.getImageDimensions(src);
  if  dims.isValid == false {
    return EVGImageDimensions_static_create((int64(maxWidth)), (int64(maxHeight)))
  }
  var scaleW float64= maxWidth / (float64( dims.width ));
  var scaleH float64= maxHeight / (float64( dims.height ));
  var scale float64= scaleW;
  if  scaleH < scaleW {
    scale = scaleH; 
  }
  var newW int64= int64(((float64( dims.width )) * scale));
  var newH int64= int64(((float64( dims.height )) * scale));
  return EVGImageDimensions_static_create(newW, newH)
}
type SimpleImageMeasurer struct { 
  // inherited from parent class EVGImageMeasurer
}
type IFACE_SimpleImageMeasurer interface { 
}

func CreateNew_SimpleImageMeasurer() *SimpleImageMeasurer {
  me := new(SimpleImageMeasurer)
  return me;
}
// inherited methods from parent class EVGImageMeasurer
func (this *SimpleImageMeasurer) getImageDimensions (src string) *EVGImageDimensions {
  var dims *EVGImageDimensions= CreateNew_EVGImageDimensions();
  return dims
}
func (this *SimpleImageMeasurer) calculateHeightForWidth (src string, targetWidth float64) float64 {
  var dims *EVGImageDimensions= this.getImageDimensions(src);
  if  dims.isValid {
    return targetWidth / dims.aspectRatio
  }
  return targetWidth
}
func (this *SimpleImageMeasurer) calculateWidthForHeight (src string, targetHeight float64) float64 {
  var dims *EVGImageDimensions= this.getImageDimensions(src);
  if  dims.isValid {
    return targetHeight * dims.aspectRatio
  }
  return targetHeight
}
func (this *SimpleImageMeasurer) calculateFitDimensions (src string, maxWidth float64, maxHeight float64) *EVGImageDimensions {
  var dims *EVGImageDimensions= this.getImageDimensions(src);
  if  dims.isValid == false {
    return EVGImageDimensions_static_create((int64(maxWidth)), (int64(maxHeight)))
  }
  var scaleW float64= maxWidth / (float64( dims.width ));
  var scaleH float64= maxHeight / (float64( dims.height ));
  var scale float64= scaleW;
  if  scaleH < scaleW {
    scale = scaleH; 
  }
  var newW int64= int64(((float64( dims.width )) * scale));
  var newH int64= int64(((float64( dims.height )) * scale));
  return EVGImageDimensions_static_create(newW, newH)
}
// inherited getters and setters from the parent class EVGImageMeasurer
type EVGLayout struct { 
  measurer *GoNullable `json:"measurer"` 
  imageMeasurer *GoNullable `json:"imageMeasurer"` 
  pageWidth float64 `json:"pageWidth"` 
  pageHeight float64 `json:"pageHeight"` 
  currentPage int64 `json:"currentPage"` 
  debug bool `json:"debug"` 
}

func CreateNew_EVGLayout() *EVGLayout {
  me := new(EVGLayout)
  me.pageWidth = 612.0
  me.pageHeight = 792.0
  me.currentPage = int64(0)
  me.debug = false
  me.measurer = new(GoNullable);
  me.imageMeasurer = new(GoNullable);
  var m *SimpleTextMeasurer= CreateNew_SimpleTextMeasurer();
  me.measurer.value = m;
  me.measurer.has_value = true; /* detected as non-optional */
  var im *SimpleImageMeasurer= CreateNew_SimpleImageMeasurer();
  me.imageMeasurer.value = im;
  me.imageMeasurer.has_value = true; /* detected as non-optional */
  return me;
}
func (this *EVGLayout) setMeasurer (m IFACE_EVGTextMeasurer) () {
  this.measurer.value = m;
  this.measurer.has_value = true; /* detected as non-optional */
}
func (this *EVGLayout) setImageMeasurer (m IFACE_EVGImageMeasurer) () {
  this.imageMeasurer.value = m;
  this.imageMeasurer.has_value = true; /* detected as non-optional */
}
func (this *EVGLayout) setPageSize (w float64, h float64) () {
  this.pageWidth = w; 
  this.pageHeight = h; 
}
func (this *EVGLayout) setDebug (d bool) () {
  this.debug = d; 
}
func (this *EVGLayout) log (msg string) () {
  if  this.debug {
    fmt.Println( msg )
  }
}
func (this *EVGLayout) layout (root *EVGElement) () {
  this.log("EVGLayout: Starting layout");
  this.currentPage = int64(0); 
  if  root.width.value.(*EVGUnit).isSet == false {
    root.width.value = EVGUnit_static_px(this.pageWidth);
    root.width.has_value = true; /* detected as non-optional */
  }
  if  root.height.value.(*EVGUnit).isSet == false {
    root.height.value = EVGUnit_static_px(this.pageHeight);
    root.height.has_value = true; /* detected as non-optional */
  }
  this.layoutElement(root, 0.0, 0.0, this.pageWidth, this.pageHeight);
  this.log("EVGLayout: Layout complete");
}
func (this *EVGLayout) layoutElement (element *EVGElement, parentX float64, parentY float64, parentWidth float64, parentHeight float64) () {
  element.resolveUnits(parentWidth, parentHeight);
  var width float64= parentWidth;
  if  element.width.value.(*EVGUnit).isSet {
    width = element.width.value.(*EVGUnit).pixels; 
  }
  var height float64= 0.0;
  var autoHeight bool= true;
  if  element.height.value.(*EVGUnit).isSet {
    height = element.height.value.(*EVGUnit).pixels; 
    autoHeight = false; 
  }
  if  element.tagName == "image" {
    var imgSrc string= element.src;
    if  (int64(len([]rune(imgSrc)))) > int64(0) {
      var dims *EVGImageDimensions= this.imageMeasurer.value.(IFACE_EVGImageMeasurer).getImageDimensions(imgSrc);
      if  dims.isValid {
        if  element.width.value.(*EVGUnit).isSet && (element.height.value.(*EVGUnit).isSet == false) {
          height = width / dims.aspectRatio; 
          autoHeight = false; 
          this.log((("  Image aspect ratio: " + (strconv.FormatFloat(dims.aspectRatio,'f', 6, 64))) + " -> height=") + (strconv.FormatFloat(height,'f', 6, 64)));
        }
        if  (element.width.value.(*EVGUnit).isSet == false) && element.height.value.(*EVGUnit).isSet {
          width = height * dims.aspectRatio; 
          this.log((("  Image aspect ratio: " + (strconv.FormatFloat(dims.aspectRatio,'f', 6, 64))) + " -> width=") + (strconv.FormatFloat(width,'f', 6, 64)));
        }
        if  (element.width.value.(*EVGUnit).isSet == false) && (element.height.value.(*EVGUnit).isSet == false) {
          width = float64( dims.width ); 
          height = float64( dims.height ); 
          if  width > parentWidth {
            var scale float64= parentWidth / width;
            width = parentWidth; 
            height = height * scale; 
          }
          autoHeight = false; 
          this.log((("  Image natural size: " + (strconv.FormatFloat(width,'f', 6, 64))) + "x") + (strconv.FormatFloat(height,'f', 6, 64)));
        }
      }
    }
  }
  if  element.minWidth.value.(*EVGUnit).isSet {
    if  width < element.minWidth.value.(*EVGUnit).pixels {
      width = element.minWidth.value.(*EVGUnit).pixels; 
    }
  }
  if  element.maxWidth.value.(*EVGUnit).isSet {
    if  width > element.maxWidth.value.(*EVGUnit).pixels {
      width = element.maxWidth.value.(*EVGUnit).pixels; 
    }
  }
  element.calculatedWidth = width; 
  element.calculatedInnerWidth = element.box.value.(*EVGBox).getInnerWidth(width); 
  if  autoHeight == false {
    element.calculatedHeight = height; 
    element.calculatedInnerHeight = element.box.value.(*EVGBox).getInnerHeight(height); 
  }
  if  element.isAbsolute {
    this.layoutAbsolute(element, parentWidth, parentHeight);
  }
  var childCount int64= element.getChildCount();
  var contentHeight float64= 0.0;
  if  childCount > int64(0) {
    contentHeight = this.layoutChildren(element); 
  } else {
    if  (element.tagName == "text") || (element.tagName == "span") {
      var fontSize float64= element.inheritedFontSize;
      if  element.fontSize.value.(*EVGUnit).isSet {
        fontSize = element.fontSize.value.(*EVGUnit).pixels; 
      }
      if  fontSize <= 0.0 {
        fontSize = 14.0; 
      }
      var lineHeightFactor float64= element.lineHeight;
      if  lineHeightFactor <= 0.0 {
        lineHeightFactor = 1.2; 
      }
      var lineSpacing float64= fontSize * lineHeightFactor;
      var textContent string= element.textContent;
      var availableWidth float64= (width - element.box.value.(*EVGBox).paddingLeftPx) - element.box.value.(*EVGBox).paddingRightPx;
      var lineCount int64= this.estimateLineCount(textContent, availableWidth, fontSize);
      contentHeight = lineSpacing * (float64( lineCount )); 
    }
  }
  if  autoHeight {
    height = ((contentHeight + element.box.value.(*EVGBox).paddingTopPx) + element.box.value.(*EVGBox).paddingBottomPx) + (element.box.value.(*EVGBox).borderWidthPx * 2.0); 
  }
  if  element.minHeight.value.(*EVGUnit).isSet {
    if  height < element.minHeight.value.(*EVGUnit).pixels {
      height = element.minHeight.value.(*EVGUnit).pixels; 
    }
  }
  if  element.maxHeight.value.(*EVGUnit).isSet {
    if  height > element.maxHeight.value.(*EVGUnit).pixels {
      height = element.maxHeight.value.(*EVGUnit).pixels; 
    }
  }
  element.calculatedHeight = height; 
  element.calculatedInnerHeight = element.box.value.(*EVGBox).getInnerHeight(height); 
  element.calculatedPage = this.currentPage; 
  element.isLayoutComplete = true; 
  this.log((((((((((("  Laid out " + element.tagName) + " id=") + element.id) + " at (") + (strconv.FormatFloat(element.calculatedX,'f', 6, 64))) + ",") + (strconv.FormatFloat(element.calculatedY,'f', 6, 64))) + ") size=") + (strconv.FormatFloat(width,'f', 6, 64))) + "x") + (strconv.FormatFloat(height,'f', 6, 64)));
}
func (this *EVGLayout) layoutChildren (parent *EVGElement) float64 {
  var childCount int64= parent.getChildCount();
  if  childCount == int64(0) {
    return 0.0
  }
  var innerWidth float64= parent.calculatedInnerWidth;
  var innerHeight float64= parent.calculatedInnerHeight;
  var startX float64= ((parent.calculatedX + parent.box.value.(*EVGBox).marginLeftPx) + parent.box.value.(*EVGBox).borderWidthPx) + parent.box.value.(*EVGBox).paddingLeftPx;
  var startY float64= ((parent.calculatedY + parent.box.value.(*EVGBox).marginTopPx) + parent.box.value.(*EVGBox).borderWidthPx) + parent.box.value.(*EVGBox).paddingTopPx;
  var currentX float64= startX;
  var currentY float64= startY;
  var rowHeight float64= 0.0;
  var rowElements []*EVGElement = make([]*EVGElement, 0);
  var totalHeight float64= 0.0;
  var isColumn bool= parent.flexDirection == "column";
  if  isColumn == false {
    var fixedWidth float64= 0.0;
    var totalFlex float64= 0.0;
    var j int64= int64(0);
    for j < childCount {
      var c *EVGElement= parent.getChild(j);
      c.resolveUnits(innerWidth, innerHeight);
      if  c.width.value.(*EVGUnit).isSet {
        fixedWidth = ((fixedWidth + c.width.value.(*EVGUnit).pixels) + c.box.value.(*EVGBox).marginLeftPx) + c.box.value.(*EVGBox).marginRightPx; 
      } else {
        if  c.flex > 0.0 {
          totalFlex = totalFlex + c.flex; 
          fixedWidth = (fixedWidth + c.box.value.(*EVGBox).marginLeftPx) + c.box.value.(*EVGBox).marginRightPx; 
        } else {
          fixedWidth = ((fixedWidth + innerWidth) + c.box.value.(*EVGBox).marginLeftPx) + c.box.value.(*EVGBox).marginRightPx; 
        }
      }
      j = j + int64(1); 
    }
    var availableForFlex float64= innerWidth - fixedWidth;
    if  availableForFlex < 0.0 {
      availableForFlex = 0.0; 
    }
    if  totalFlex > 0.0 {
      j = int64(0); 
      for j < childCount {
        var c_1 *EVGElement= parent.getChild(j);
        if  (c_1.width.value.(*EVGUnit).isSet == false) && (c_1.flex > 0.0) {
          var flexWidth float64= (availableForFlex * c_1.flex) / totalFlex;
          c_1.calculatedFlexWidth = flexWidth; 
        }
        j = j + int64(1); 
      }
    }
  }
  var i int64= int64(0);
  for i < childCount {
    var child *EVGElement= parent.getChild(i);
    child.inheritProperties(parent);
    child.resolveUnits(innerWidth, innerHeight);
    if  child.isAbsolute {
      this.layoutAbsolute(child, innerWidth, innerHeight);
      child.calculatedX = child.calculatedX + startX; 
      child.calculatedY = child.calculatedY + startY; 
      if  child.getChildCount() > int64(0) {
        this.layoutChildren(child);
      }
      i = i + int64(1); 
      continue;
    }
    var childWidth float64= innerWidth;
    if  child.width.value.(*EVGUnit).isSet {
      childWidth = child.width.value.(*EVGUnit).pixels; 
    } else {
      if  child.calculatedFlexWidth > 0.0 {
        childWidth = child.calculatedFlexWidth; 
      }
    }
    var childTotalWidth float64= (childWidth + child.box.value.(*EVGBox).marginLeftPx) + child.box.value.(*EVGBox).marginRightPx;
    if  isColumn == false {
      var availableWidth float64= (startX + innerWidth) - currentX;
      if  (childTotalWidth > availableWidth) && ((int64(len(rowElements))) > int64(0)) {
        this.alignRow(rowElements, parent, rowHeight, startX, innerWidth);
        currentY = currentY + rowHeight; 
        totalHeight = totalHeight + rowHeight; 
        currentX = startX; 
        rowHeight = 0.0; 
        rowElements = rowElements[:0]
      }
    }
    child.calculatedX = currentX + child.box.value.(*EVGBox).marginLeftPx; 
    child.calculatedY = currentY + child.box.value.(*EVGBox).marginTopPx; 
    this.layoutElement(child, child.calculatedX, child.calculatedY, childWidth, innerHeight);
    var childHeight float64= child.calculatedHeight;
    var childTotalHeight float64= (childHeight + child.box.value.(*EVGBox).marginTopPx) + child.box.value.(*EVGBox).marginBottomPx;
    if  isColumn {
      currentY = currentY + childTotalHeight; 
      totalHeight = totalHeight + childTotalHeight; 
    } else {
      currentX = currentX + childTotalWidth; 
      rowElements = append(rowElements,child); 
      if  childTotalHeight > rowHeight {
        rowHeight = childTotalHeight; 
      }
    }
    if  child.lineBreak {
      if  isColumn == false {
        this.alignRow(rowElements, parent, rowHeight, startX, innerWidth);
        currentY = currentY + rowHeight; 
        totalHeight = totalHeight + rowHeight; 
        currentX = startX; 
        rowHeight = 0.0; 
        rowElements = rowElements[:0]
      }
    }
    i = i + int64(1); 
  }
  if  (isColumn == false) && ((int64(len(rowElements))) > int64(0)) {
    this.alignRow(rowElements, parent, rowHeight, startX, innerWidth);
    totalHeight = totalHeight + rowHeight; 
  }
  return totalHeight
}
func (this *EVGLayout) alignRow (rowElements []*EVGElement, parent *EVGElement, rowHeight float64, startX float64, innerWidth float64) () {
  var elementCount int64= int64(len(rowElements));
  if  elementCount == int64(0) {
    return
  }
  var rowWidth float64= 0.0;
  var i int64= int64(0);
  for i < elementCount {
    var el *EVGElement= rowElements[i];
    rowWidth = ((rowWidth + el.calculatedWidth) + el.box.value.(*EVGBox).marginLeftPx) + el.box.value.(*EVGBox).marginRightPx; 
    i = i + int64(1); 
  }
  var offsetX float64= 0.0;
  if  parent.align == "center" {
    offsetX = (innerWidth - rowWidth) / 2.0; 
  }
  if  parent.align == "right" {
    offsetX = innerWidth - rowWidth; 
  }
  var effectiveRowHeight float64= rowHeight;
  if  parent.height.value.(*EVGUnit).isSet {
    var parentInnerHeight float64= parent.calculatedInnerHeight;
    if  parentInnerHeight > rowHeight {
      effectiveRowHeight = parentInnerHeight; 
    }
  }
  i = int64(0); 
  for i < elementCount {
    var el_1 *EVGElement= rowElements[i];
    if  offsetX != 0.0 {
      el_1.calculatedX = el_1.calculatedX + offsetX; 
    }
    var childTotalHeight float64= (el_1.calculatedHeight + el_1.box.value.(*EVGBox).marginTopPx) + el_1.box.value.(*EVGBox).marginBottomPx;
    var offsetY float64= 0.0;
    if  parent.verticalAlign == "center" {
      offsetY = (effectiveRowHeight - childTotalHeight) / 2.0; 
    }
    if  parent.verticalAlign == "bottom" {
      offsetY = effectiveRowHeight - childTotalHeight; 
    }
    if  offsetY != 0.0 {
      el_1.calculatedY = el_1.calculatedY + offsetY; 
    }
    i = i + int64(1); 
  }
}
func (this *EVGLayout) layoutAbsolute (element *EVGElement, parentWidth float64, parentHeight float64) () {
  if  element.left.value.(*EVGUnit).isSet {
    element.calculatedX = element.left.value.(*EVGUnit).pixels + element.box.value.(*EVGBox).marginLeftPx; 
  } else {
    if  element.x.value.(*EVGUnit).isSet {
      element.calculatedX = element.x.value.(*EVGUnit).pixels + element.box.value.(*EVGBox).marginLeftPx; 
    } else {
      if  element.right.value.(*EVGUnit).isSet {
        var width float64= element.calculatedWidth;
        if  width == 0.0 {
          if  element.width.value.(*EVGUnit).isSet {
            width = element.width.value.(*EVGUnit).pixels; 
          }
        }
        element.calculatedX = ((parentWidth - element.right.value.(*EVGUnit).pixels) - width) - element.box.value.(*EVGBox).marginRightPx; 
      }
    }
  }
  if  element.top.value.(*EVGUnit).isSet {
    element.calculatedY = element.top.value.(*EVGUnit).pixels + element.box.value.(*EVGBox).marginTopPx; 
  } else {
    if  element.y.value.(*EVGUnit).isSet {
      element.calculatedY = element.y.value.(*EVGUnit).pixels + element.box.value.(*EVGBox).marginTopPx; 
    } else {
      if  element.bottom.value.(*EVGUnit).isSet {
        var height float64= element.calculatedHeight;
        if  height == 0.0 {
          if  element.height.value.(*EVGUnit).isSet {
            height = element.height.value.(*EVGUnit).pixels; 
          }
        }
        element.calculatedY = ((parentHeight - element.bottom.value.(*EVGUnit).pixels) - height) - element.box.value.(*EVGBox).marginBottomPx; 
      }
    }
  }
}
func (this *EVGLayout) printLayout (element *EVGElement, indent int64) () {
  var indentStr string= "";
  var i int64= int64(0);
  for i < indent {
    indentStr = indentStr + "  "; 
    i = i + int64(1); 
  }
  fmt.Println( ((((((((((indentStr + element.tagName) + " id=\"") + element.id) + "\" (") + (strconv.FormatFloat(element.calculatedX,'f', 6, 64))) + ", ") + (strconv.FormatFloat(element.calculatedY,'f', 6, 64))) + ") ") + (strconv.FormatFloat(element.calculatedWidth,'f', 6, 64))) + "x") + (strconv.FormatFloat(element.calculatedHeight,'f', 6, 64)) )
  var childCount int64= element.getChildCount();
  i = int64(0); 
  for i < childCount {
    var child *EVGElement= element.getChild(i);
    this.printLayout(child, indent + int64(1));
    i = i + int64(1); 
  }
}
func (this *EVGLayout) estimateLineCount (text string, maxWidth float64, fontSize float64) int64 {
  if  (int64(len([]rune(text)))) == int64(0) {
    return int64(1)
  }
  if  maxWidth <= 0.0 {
    return int64(1)
  }
  var words []string= strings.Split(text, " ");
  var lineCount int64= int64(1);
  var currentLineWidth float64= 0.0;
  var spaceWidth float64= fontSize * 0.3;
  var i int64= int64(0);
  for i < (int64(len(words))) {
    var word string= words[i];
    var wordWidth float64= this.measurer.value.(IFACE_EVGTextMeasurer).measureTextWidth(word, "Helvetica", fontSize);
    if  currentLineWidth == 0.0 {
      currentLineWidth = wordWidth; 
    } else {
      var testWidth float64= (currentLineWidth + spaceWidth) + wordWidth;
      if  testWidth > maxWidth {
        lineCount = lineCount + int64(1); 
        currentLineWidth = wordWidth; 
      } else {
        currentLineWidth = testWidth; 
      }
    }
    i = i + int64(1); 
  }
  return lineCount
}
type PathCommand struct { 
  _type string `json:"type"` 
  x float64 `json:"x"` 
  y float64 `json:"y"` 
  x1 float64 `json:"x1"` 
  y1 float64 `json:"y1"` 
  x2 float64 `json:"x2"` 
  y2 float64 `json:"y2"` 
  rx float64 /**  unused  **/  `json:"rx"` 
  ry float64 /**  unused  **/  `json:"ry"` 
  rotation float64 /**  unused  **/  `json:"rotation"` 
  largeArc bool /**  unused  **/  `json:"largeArc"` 
  sweep bool /**  unused  **/  `json:"sweep"` 
}

func CreateNew_PathCommand() *PathCommand {
  me := new(PathCommand)
  me._type = ""
  me.x = 0.0
  me.y = 0.0
  me.x1 = 0.0
  me.y1 = 0.0
  me.x2 = 0.0
  me.y2 = 0.0
  me.rx = 0.0
  me.ry = 0.0
  me.rotation = 0.0
  me.largeArc = false
  me.sweep = false
  return me;
}
type PathBounds struct { 
  minX float64 `json:"minX"` 
  minY float64 `json:"minY"` 
  maxX float64 `json:"maxX"` 
  maxY float64 `json:"maxY"` 
  width float64 `json:"width"` 
  height float64 `json:"height"` 
}

func CreateNew_PathBounds() *PathBounds {
  me := new(PathBounds)
  me.minX = 0.0
  me.minY = 0.0
  me.maxX = 0.0
  me.maxY = 0.0
  me.width = 0.0
  me.height = 0.0
  return me;
}
type SVGPathParser struct { 
  pathData string `json:"pathData"` 
  i int64 `json:"i"` 
  __len int64 `json:"len"` 
  currentX float64 `json:"currentX"` 
  currentY float64 `json:"currentY"` 
  startX float64 `json:"startX"` 
  startY float64 `json:"startY"` 
  commands []*PathCommand `json:"commands"` 
  bounds *GoNullable `json:"bounds"` 
}

func CreateNew_SVGPathParser() *SVGPathParser {
  me := new(SVGPathParser)
  me.pathData = ""
  me.i = int64(0)
  me.__len = int64(0)
  me.currentX = 0.0
  me.currentY = 0.0
  me.startX = 0.0
  me.startY = 0.0
  me.commands = make([]*PathCommand,0)
  me.bounds = new(GoNullable);
  var emptyCommands []*PathCommand = make([]*PathCommand, 0);
  me.commands = emptyCommands; 
  me.bounds.value = CreateNew_PathBounds();
  me.bounds.has_value = true; /* detected as non-optional */
  return me;
}
func (this *SVGPathParser) parse (data string) () {
  this.pathData = data; 
  this.i = int64(0); 
  this.__len = int64(len([]rune(data))); 
  this.currentX = 0.0; 
  this.currentY = 0.0; 
  this.startX = 0.0; 
  this.startY = 0.0; 
  var emptyCommands []*PathCommand = make([]*PathCommand, 0);
  this.commands = emptyCommands; 
  for this.i < this.__len {
    this.skipWhitespace();
    if  this.i >= this.__len {
      break;
    }
    var ch byte= byte(int64([]rune(this.pathData)[this.i]));
    var chInt int64= int64(ch);
    if  ((chInt >= int64(65)) && (chInt <= int64(90))) || ((chInt >= int64(97)) && (chInt <= int64(122))) {
      this.parseCommand(ch);
    } else {
      this.i = this.i + int64(1); 
    }
  }
  this.calculateBounds();
}
func (this *SVGPathParser) skipWhitespace () () {
  for this.i < this.__len {
    var ch byte= byte(int64([]rune(this.pathData)[this.i]));
    var chInt int64= int64(ch);
    if  ((((chInt == int64(32)) || (chInt == int64(9))) || (chInt == int64(10))) || (chInt == int64(13))) || (chInt == int64(44)) {
      this.i = this.i + int64(1); 
    } else {
      break;
    }
  }
}
func (this *SVGPathParser) parseNumber () float64 {
  this.skipWhitespace();
  var start int64= this.i;
  var ch byte= byte(int64([]rune(this.pathData)[this.i]));
  var chInt int64= int64(ch);
  if  (chInt == int64(45)) || (chInt == int64(43)) {
    this.i = this.i + int64(1); 
  }
  for this.i < this.__len {
    var ch2 byte= byte(int64([]rune(this.pathData)[this.i]));
    var chInt2 int64= int64(ch2);
    if  (chInt2 >= int64(48)) && (chInt2 <= int64(57)) {
      this.i = this.i + int64(1); 
    } else {
      break;
    }
  }
  if  this.i < this.__len {
    var ch3 byte= byte(int64([]rune(this.pathData)[this.i]));
    var chInt3 int64= int64(ch3);
    if  chInt3 == int64(46) {
      this.i = this.i + int64(1); 
      for this.i < this.__len {
        var ch4 byte= byte(int64([]rune(this.pathData)[this.i]));
        var chInt4 int64= int64(ch4);
        if  (chInt4 >= int64(48)) && (chInt4 <= int64(57)) {
          this.i = this.i + int64(1); 
        } else {
          break;
        }
      }
    }
  }
  if  this.i < this.__len {
    var ch5 byte= byte(int64([]rune(this.pathData)[this.i]));
    var chInt5 int64= int64(ch5);
    if  (chInt5 == int64(101)) || (chInt5 == int64(69)) {
      this.i = this.i + int64(1); 
      if  this.i < this.__len {
        var ch6 byte= byte(int64([]rune(this.pathData)[this.i]));
        var chInt6 int64= int64(ch6);
        if  (chInt6 == int64(45)) || (chInt6 == int64(43)) {
          this.i = this.i + int64(1); 
        }
      }
      for this.i < this.__len {
        var ch7 byte= byte(int64([]rune(this.pathData)[this.i]));
        var chInt7 int64= int64(ch7);
        if  (chInt7 >= int64(48)) && (chInt7 <= int64(57)) {
          this.i = this.i + int64(1); 
        } else {
          break;
        }
      }
    }
  }
  var numStr string= string([]rune(this.pathData)[start:this.i]);
  var result float64= (r_str_2_d64(numStr)).value.(float64);
  return result
}
func (this *SVGPathParser) parseCommand (cmd byte) () {
  var cmdInt int64= int64(cmd);
  /** unused:  cmdStr*/
  this.i = this.i + int64(1); 
  if  (cmdInt == int64(77)) || (cmdInt == int64(109)) {
    var x float64= this.parseNumber();
    var y float64= this.parseNumber();
    if  cmdInt == int64(109) {
      x = this.currentX + x; 
      y = this.currentY + y; 
    }
    var pathCmd *PathCommand= CreateNew_PathCommand();
    pathCmd._type = "M"; 
    pathCmd.x = x; 
    pathCmd.y = y; 
    this.commands = append(this.commands,pathCmd); 
    this.currentX = x; 
    this.currentY = y; 
    this.startX = x; 
    this.startY = y; 
    return
  }
  if  (cmdInt == int64(76)) || (cmdInt == int64(108)) {
    var x_1 float64= this.parseNumber();
    var y_1 float64= this.parseNumber();
    if  cmdInt == int64(108) {
      x_1 = this.currentX + x_1; 
      y_1 = this.currentY + y_1; 
    }
    var pathCmd_1 *PathCommand= CreateNew_PathCommand();
    pathCmd_1._type = "L"; 
    pathCmd_1.x = x_1; 
    pathCmd_1.y = y_1; 
    this.commands = append(this.commands,pathCmd_1); 
    this.currentX = x_1; 
    this.currentY = y_1; 
    return
  }
  if  (cmdInt == int64(72)) || (cmdInt == int64(104)) {
    var x_2 float64= this.parseNumber();
    if  cmdInt == int64(104) {
      x_2 = this.currentX + x_2; 
    }
    var pathCmd_2 *PathCommand= CreateNew_PathCommand();
    pathCmd_2._type = "L"; 
    pathCmd_2.x = x_2; 
    pathCmd_2.y = this.currentY; 
    this.commands = append(this.commands,pathCmd_2); 
    this.currentX = x_2; 
    return
  }
  if  (cmdInt == int64(86)) || (cmdInt == int64(118)) {
    var y_2 float64= this.parseNumber();
    if  cmdInt == int64(118) {
      y_2 = this.currentY + y_2; 
    }
    var pathCmd_3 *PathCommand= CreateNew_PathCommand();
    pathCmd_3._type = "L"; 
    pathCmd_3.x = this.currentX; 
    pathCmd_3.y = y_2; 
    this.commands = append(this.commands,pathCmd_3); 
    this.currentY = y_2; 
    return
  }
  if  (cmdInt == int64(67)) || (cmdInt == int64(99)) {
    var x1 float64= this.parseNumber();
    var y1 float64= this.parseNumber();
    var x2 float64= this.parseNumber();
    var y2 float64= this.parseNumber();
    var x_3 float64= this.parseNumber();
    var y_3 float64= this.parseNumber();
    if  cmdInt == int64(99) {
      x1 = this.currentX + x1; 
      y1 = this.currentY + y1; 
      x2 = this.currentX + x2; 
      y2 = this.currentY + y2; 
      x_3 = this.currentX + x_3; 
      y_3 = this.currentY + y_3; 
    }
    var pathCmd_4 *PathCommand= CreateNew_PathCommand();
    pathCmd_4._type = "C"; 
    pathCmd_4.x1 = x1; 
    pathCmd_4.y1 = y1; 
    pathCmd_4.x2 = x2; 
    pathCmd_4.y2 = y2; 
    pathCmd_4.x = x_3; 
    pathCmd_4.y = y_3; 
    this.commands = append(this.commands,pathCmd_4); 
    this.currentX = x_3; 
    this.currentY = y_3; 
    return
  }
  if  (cmdInt == int64(81)) || (cmdInt == int64(113)) {
    var x1_1 float64= this.parseNumber();
    var y1_1 float64= this.parseNumber();
    var x_4 float64= this.parseNumber();
    var y_4 float64= this.parseNumber();
    if  cmdInt == int64(113) {
      x1_1 = this.currentX + x1_1; 
      y1_1 = this.currentY + y1_1; 
      x_4 = this.currentX + x_4; 
      y_4 = this.currentY + y_4; 
    }
    var pathCmd_5 *PathCommand= CreateNew_PathCommand();
    pathCmd_5._type = "Q"; 
    pathCmd_5.x1 = x1_1; 
    pathCmd_5.y1 = y1_1; 
    pathCmd_5.x = x_4; 
    pathCmd_5.y = y_4; 
    this.commands = append(this.commands,pathCmd_5); 
    this.currentX = x_4; 
    this.currentY = y_4; 
    return
  }
  if  (cmdInt == int64(90)) || (cmdInt == int64(122)) {
    var pathCmd_6 *PathCommand= CreateNew_PathCommand();
    pathCmd_6._type = "Z"; 
    this.commands = append(this.commands,pathCmd_6); 
    this.currentX = this.startX; 
    this.currentY = this.startY; 
    return
  }
}
func (this *SVGPathParser) calculateBounds () () {
  if  (int64(len(this.commands))) == int64(0) {
    return
  }
  var minX float64= 999999.0;
  var minY float64= 999999.0;
  var maxX float64= -999999.0;
  var maxY float64= -999999.0;
  var i_1 int64= int64(0);
  for i_1 < (int64(len(this.commands))) {
    var cmd *PathCommand= this.commands[i_1];
    if  (cmd._type == "M") || (cmd._type == "L") {
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
    if  cmd._type == "C" {
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
    if  cmd._type == "Q" {
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
    i_1 = i_1 + int64(1); 
  }
  this.bounds.value.(*PathBounds).minX = minX; 
  this.bounds.value.(*PathBounds).minY = minY; 
  this.bounds.value.(*PathBounds).maxX = maxX; 
  this.bounds.value.(*PathBounds).maxY = maxY; 
  this.bounds.value.(*PathBounds).width = maxX - minX; 
  this.bounds.value.(*PathBounds).height = maxY - minY; 
}
func (this *SVGPathParser) getBounds () *PathBounds {
  var result *PathBounds= this.bounds.value.(*PathBounds);
  return result
}
func (this *SVGPathParser) getCommands () []*PathCommand {
  return this.commands
}
func (this *SVGPathParser) getScaledCommands (targetWidth float64, targetHeight float64) []*PathCommand {
  var scaleX float64= 1.0;
  var scaleY float64= 1.0;
  if  this.bounds.value.(*PathBounds).width > 0.0 {
    scaleX = targetWidth / this.bounds.value.(*PathBounds).width; 
  }
  if  this.bounds.value.(*PathBounds).height > 0.0 {
    scaleY = targetHeight / this.bounds.value.(*PathBounds).height; 
  }
  var scaled []*PathCommand = make([]*PathCommand, 0);
  var i_1 int64= int64(0);
  for i_1 < (int64(len(this.commands))) {
    var cmd *PathCommand= this.commands[i_1];
    var newCmd *PathCommand= CreateNew_PathCommand();
    newCmd._type = cmd._type; 
    if  (cmd._type == "M") || (cmd._type == "L") {
      newCmd.x = (cmd.x - this.bounds.value.(*PathBounds).minX) * scaleX; 
      newCmd.y = (cmd.y - this.bounds.value.(*PathBounds).minY) * scaleY; 
    }
    if  cmd._type == "C" {
      newCmd.x1 = (cmd.x1 - this.bounds.value.(*PathBounds).minX) * scaleX; 
      newCmd.y1 = (cmd.y1 - this.bounds.value.(*PathBounds).minY) * scaleY; 
      newCmd.x2 = (cmd.x2 - this.bounds.value.(*PathBounds).minX) * scaleX; 
      newCmd.y2 = (cmd.y2 - this.bounds.value.(*PathBounds).minY) * scaleY; 
      newCmd.x = (cmd.x - this.bounds.value.(*PathBounds).minX) * scaleX; 
      newCmd.y = (cmd.y - this.bounds.value.(*PathBounds).minY) * scaleY; 
    }
    if  cmd._type == "Q" {
      newCmd.x1 = (cmd.x1 - this.bounds.value.(*PathBounds).minX) * scaleX; 
      newCmd.y1 = (cmd.y1 - this.bounds.value.(*PathBounds).minY) * scaleY; 
      newCmd.x = (cmd.x - this.bounds.value.(*PathBounds).minX) * scaleX; 
      newCmd.y = (cmd.y - this.bounds.value.(*PathBounds).minY) * scaleY; 
    }
    scaled = append(scaled,newCmd); 
    i_1 = i_1 + int64(1); 
  }
  return scaled
}
type TTFTableRecord struct { 
  tag string `json:"tag"` 
  checksum int64 `json:"checksum"` 
  offset int64 `json:"offset"` 
  length int64 `json:"length"` 
}

func CreateNew_TTFTableRecord() *TTFTableRecord {
  me := new(TTFTableRecord)
  me.tag = ""
  me.checksum = int64(0)
  me.offset = int64(0)
  me.length = int64(0)
  return me;
}
type TTFGlyphMetrics struct { 
  advanceWidth int64 /**  unused  **/  `json:"advanceWidth"` 
  leftSideBearing int64 /**  unused  **/  `json:"leftSideBearing"` 
}

func CreateNew_TTFGlyphMetrics() *TTFGlyphMetrics {
  me := new(TTFGlyphMetrics)
  me.advanceWidth = int64(0)
  me.leftSideBearing = int64(0)
  return me;
}
type TrueTypeFont struct { 
  fontData []byte `json:"fontData"` 
  fontPath string `json:"fontPath"` 
  fontFamily string `json:"fontFamily"` 
  fontStyle string `json:"fontStyle"` 
  sfntVersion int64 `json:"sfntVersion"` 
  numTables int64 `json:"numTables"` 
  searchRange int64 `json:"searchRange"` 
  entrySelector int64 `json:"entrySelector"` 
  rangeShift int64 `json:"rangeShift"` 
  tables []*TTFTableRecord `json:"tables"` 
  unitsPerEm int64 `json:"unitsPerEm"` 
  xMin int64 `json:"xMin"` 
  yMin int64 `json:"yMin"` 
  xMax int64 `json:"xMax"` 
  yMax int64 `json:"yMax"` 
  indexToLocFormat int64 `json:"indexToLocFormat"` 
  ascender int64 `json:"ascender"` 
  descender int64 `json:"descender"` 
  lineGap int64 `json:"lineGap"` 
  numberOfHMetrics int64 `json:"numberOfHMetrics"` 
  numGlyphs int64 `json:"numGlyphs"` 
  cmapFormat int64 `json:"cmapFormat"` 
  cmapOffset int64 `json:"cmapOffset"` 
  glyphWidths []int64 `json:"glyphWidths"` 
  defaultWidth int64 `json:"defaultWidth"` 
  charWidths []int64 `json:"charWidths"` 
  charWidthsLoaded bool `json:"charWidthsLoaded"` 
}

func CreateNew_TrueTypeFont() *TrueTypeFont {
  me := new(TrueTypeFont)
  me.fontData = 
  make([]byte, int64(0))
  
  me.fontPath = ""
  me.fontFamily = ""
  me.fontStyle = "Regular"
  me.sfntVersion = int64(0)
  me.numTables = int64(0)
  me.searchRange = int64(0)
  me.entrySelector = int64(0)
  me.rangeShift = int64(0)
  me.tables = make([]*TTFTableRecord,0)
  me.unitsPerEm = int64(1000)
  me.xMin = int64(0)
  me.yMin = int64(0)
  me.xMax = int64(0)
  me.yMax = int64(0)
  me.indexToLocFormat = int64(0)
  me.ascender = int64(0)
  me.descender = int64(0)
  me.lineGap = int64(0)
  me.numberOfHMetrics = int64(0)
  me.numGlyphs = int64(0)
  me.cmapFormat = int64(0)
  me.cmapOffset = int64(0)
  me.glyphWidths = make([]int64,0)
  me.defaultWidth = int64(500)
  me.charWidths = make([]int64,0)
  me.charWidthsLoaded = false
  var t []*TTFTableRecord = make([]*TTFTableRecord, 0);
  me.tables = t; 
  var gw []int64 = make([]int64, 0);
  me.glyphWidths = gw; 
  var cw []int64 = make([]int64, 0);
  me.charWidths = cw; 
  return me;
}
func (this *TrueTypeFont) loadFromFile (path string) bool {
  this.fontPath = path; 
  var lastSlash int64= int64(-1);
  var i int64= int64(0);
  for i < (int64(len([]rune(path)))) {
    var ch int64= int64([]rune(path)[i]);
    if  (ch == int64(47)) || (ch == int64(92)) {
      lastSlash = i; 
    }
    i = i + int64(1); 
  }
  var dirPath string= ".";
  var fileName string= path;
  if  lastSlash >= int64(0) {
    dirPath = string([]rune(path)[int64(0):lastSlash]); 
    fileName = string([]rune(path)[(lastSlash + int64(1)):(int64(len([]rune(path))))]); 
  }
  if  (r_file_exists(dirPath, fileName)) == false {
    return false
  }
  this.fontData = func() []byte { d, _ := os.ReadFile(filepath.Join(dirPath, fileName)); return d }(); 
  if  (int64(len(this.fontData))) == int64(0) {
    fmt.Println( "TrueTypeFont: Failed to load " + path )
    return false
  }
  if  this.parseOffsetTable() == false {
    return false
  }
  if  this.parseTableDirectory() == false {
    return false
  }
  this.parseHeadTable();
  this.parseHheaTable();
  this.parseMaxpTable();
  this.parseCmapTable();
  this.parseHmtxTable();
  this.parseNameTable();
  this.buildCharWidthCache();
  return true
}
func (this *TrueTypeFont) parseOffsetTable () bool {
  if  (int64(len(this.fontData))) < int64(12) {
    return false
  }
  this.sfntVersion = this.readUInt32(int64(0)); 
  this.numTables = this.readUInt16(int64(4)); 
  this.searchRange = this.readUInt16(int64(6)); 
  this.entrySelector = this.readUInt16(int64(8)); 
  this.rangeShift = this.readUInt16(int64(10)); 
  return true
}
func (this *TrueTypeFont) parseTableDirectory () bool {
  var offset int64= int64(12);
  var i int64= int64(0);
  for i < this.numTables {
    var record *TTFTableRecord= CreateNew_TTFTableRecord();
    record.tag = this.readTag(offset); 
    record.checksum = this.readUInt32((offset + int64(4))); 
    record.offset = this.readUInt32((offset + int64(8))); 
    record.length = this.readUInt32((offset + int64(12))); 
    this.tables = append(this.tables,record); 
    offset = offset + int64(16); 
    i = i + int64(1); 
  }
  return true
}
func (this *TrueTypeFont) findTable (tag string) *TTFTableRecord {
  var i int64= int64(0);
  for i < (int64(len(this.tables))) {
    var t *TTFTableRecord= this.tables[i];
    if  t.tag == tag {
      return t
    }
    i = i + int64(1); 
  }
  var empty *TTFTableRecord= CreateNew_TTFTableRecord();
  return empty
}
func (this *TrueTypeFont) parseHeadTable () () {
  var table *TTFTableRecord= this.findTable("head");
  if  table.offset == int64(0) {
    return
  }
  var off int64= table.offset;
  this.unitsPerEm = this.readUInt16((off + int64(18))); 
  this.xMin = this.readInt16((off + int64(36))); 
  this.yMin = this.readInt16((off + int64(38))); 
  this.xMax = this.readInt16((off + int64(40))); 
  this.yMax = this.readInt16((off + int64(42))); 
  this.indexToLocFormat = this.readInt16((off + int64(50))); 
}
func (this *TrueTypeFont) parseHheaTable () () {
  var table *TTFTableRecord= this.findTable("hhea");
  if  table.offset == int64(0) {
    return
  }
  var off int64= table.offset;
  this.ascender = this.readInt16((off + int64(4))); 
  this.descender = this.readInt16((off + int64(6))); 
  this.lineGap = this.readInt16((off + int64(8))); 
  this.numberOfHMetrics = this.readUInt16((off + int64(34))); 
}
func (this *TrueTypeFont) parseMaxpTable () () {
  var table *TTFTableRecord= this.findTable("maxp");
  if  table.offset == int64(0) {
    return
  }
  var off int64= table.offset;
  this.numGlyphs = this.readUInt16((off + int64(4))); 
}
func (this *TrueTypeFont) parseCmapTable () () {
  var table *TTFTableRecord= this.findTable("cmap");
  if  table.offset == int64(0) {
    return
  }
  var off int64= table.offset;
  var numSubtables int64= this.readUInt16((off + int64(2)));
  var i int64= int64(0);
  var subtableOffset int64= int64(0);
  for i < numSubtables {
    var recordOff int64= (off + int64(4)) + (i * int64(8));
    var platformID int64= this.readUInt16(recordOff);
    var encodingID int64= this.readUInt16((recordOff + int64(2)));
    var subOff int64= this.readUInt32((recordOff + int64(4)));
    if  (platformID == int64(3)) && (encodingID == int64(1)) {
      subtableOffset = subOff; 
    }
    if  (platformID == int64(0)) && (subtableOffset == int64(0)) {
      subtableOffset = subOff; 
    }
    i = i + int64(1); 
  }
  if  subtableOffset > int64(0) {
    this.cmapOffset = off + subtableOffset; 
    this.cmapFormat = this.readUInt16(this.cmapOffset); 
  }
}
func (this *TrueTypeFont) parseHmtxTable () () {
  var table *TTFTableRecord= this.findTable("hmtx");
  if  table.offset == int64(0) {
    return
  }
  var off int64= table.offset;
  var i int64= int64(0);
  for i < this.numberOfHMetrics {
    var advanceWidth int64= this.readUInt16((off + (i * int64(4))));
    this.glyphWidths = append(this.glyphWidths,advanceWidth); 
    i = i + int64(1); 
  }
  if  this.numberOfHMetrics > int64(0) {
    this.defaultWidth = this.glyphWidths[(this.numberOfHMetrics - int64(1))]; 
  }
}
func (this *TrueTypeFont) parseNameTable () () {
  var table *TTFTableRecord= this.findTable("name");
  if  table.offset == int64(0) {
    return
  }
  var off int64= table.offset;
  var count int64= this.readUInt16((off + int64(2)));
  var stringOffset int64= this.readUInt16((off + int64(4)));
  var i int64= int64(0);
  for i < count {
    var recordOff int64= (off + int64(6)) + (i * int64(12));
    var platformID int64= this.readUInt16(recordOff);
    /** unused:  encodingID*/
    /** unused:  languageID*/
    var nameID int64= this.readUInt16((recordOff + int64(6)));
    var length int64= this.readUInt16((recordOff + int64(8)));
    var strOffset int64= this.readUInt16((recordOff + int64(10)));
    if  (nameID == int64(1)) && (platformID == int64(3)) {
      var strOff int64= (off + stringOffset) + strOffset;
      this.fontFamily = this.readUnicodeString(strOff, length); 
    }
    if  ((nameID == int64(1)) && (platformID == int64(1))) && ((int64(len([]rune(this.fontFamily)))) == int64(0)) {
      var strOff_1 int64= (off + stringOffset) + strOffset;
      this.fontFamily = this.readAsciiString(strOff_1, length); 
    }
    if  (nameID == int64(2)) && (platformID == int64(3)) {
      var strOff_2 int64= (off + stringOffset) + strOffset;
      this.fontStyle = this.readUnicodeString(strOff_2, length); 
    }
    if  ((nameID == int64(2)) && (platformID == int64(1))) && ((int64(len([]rune(this.fontStyle)))) == int64(0)) {
      var strOff_3 int64= (off + stringOffset) + strOffset;
      this.fontStyle = this.readAsciiString(strOff_3, length); 
    }
    i = i + int64(1); 
  }
}
func (this *TrueTypeFont) getGlyphIndex (charCode int64) int64 {
  if  this.cmapOffset == int64(0) {
    return int64(0)
  }
  if  this.cmapFormat == int64(4) {
    return this.getGlyphIndexFormat4(charCode)
  }
  if  this.cmapFormat == int64(0) {
    if  charCode < int64(256) {
      return this.readUInt8(((this.cmapOffset + int64(6)) + charCode))
    }
  }
  if  this.cmapFormat == int64(6) {
    var firstCode int64= this.readUInt16((this.cmapOffset + int64(6)));
    var entryCount int64= this.readUInt16((this.cmapOffset + int64(8)));
    if  (charCode >= firstCode) && (charCode < (firstCode + entryCount)) {
      return this.readUInt16(((this.cmapOffset + int64(10)) + ((charCode - firstCode) * int64(2))))
    }
  }
  return int64(0)
}
func (this *TrueTypeFont) getGlyphIndexFormat4 (charCode int64) int64 {
  var off int64= this.cmapOffset;
  var segCountX2 int64= this.readUInt16((off + int64(6)));
  var segCountD float64= (float64( segCountX2 )) / 2.0;
  var segCount int64= int64(segCountD);
  var endCodesOff int64= off + int64(14);
  var startCodesOff int64= (endCodesOff + segCountX2) + int64(2);
  var idDeltaOff int64= startCodesOff + segCountX2;
  var idRangeOffsetOff int64= idDeltaOff + segCountX2;
  var i int64= int64(0);
  for i < segCount {
    var endCode int64= this.readUInt16((endCodesOff + (i * int64(2))));
    var startCode int64= this.readUInt16((startCodesOff + (i * int64(2))));
    if  (charCode >= startCode) && (charCode <= endCode) {
      var idDelta int64= this.readInt16((idDeltaOff + (i * int64(2))));
      var idRangeOffset int64= this.readUInt16((idRangeOffsetOff + (i * int64(2))));
      if  idRangeOffset == int64(0) {
        return (charCode + idDelta) % int64(65536)
      } else {
        var glyphIdOff int64= ((idRangeOffsetOff + (i * int64(2))) + idRangeOffset) + ((charCode - startCode) * int64(2));
        var glyphId int64= this.readUInt16(glyphIdOff);
        if  glyphId != int64(0) {
          return (glyphId + idDelta) % int64(65536)
        }
      }
    }
    i = i + int64(1); 
  }
  return int64(0)
}
func (this *TrueTypeFont) getGlyphWidth (glyphIndex int64) int64 {
  if  glyphIndex < (int64(len(this.glyphWidths))) {
    return this.glyphWidths[glyphIndex]
  }
  return this.defaultWidth
}
func (this *TrueTypeFont) buildCharWidthCache () () {
  var i int64= int64(0);
  for i < int64(256) {
    var glyphIdx int64= this.getGlyphIndex(i);
    var width int64= this.getGlyphWidth(glyphIdx);
    this.charWidths = append(this.charWidths,width); 
    i = i + int64(1); 
  }
  this.charWidthsLoaded = true; 
}
func (this *TrueTypeFont) getCharWidth (charCode int64) int64 {
  if  this.charWidthsLoaded && (charCode < int64(256)) {
    return this.charWidths[charCode]
  }
  var glyphIdx int64= this.getGlyphIndex(charCode);
  return this.getGlyphWidth(glyphIdx)
}
func (this *TrueTypeFont) getCharWidthPoints (charCode int64, fontSize float64) float64 {
  var fontUnits int64= this.getCharWidth(charCode);
  return ((float64( fontUnits )) * fontSize) / (float64( this.unitsPerEm ))
}
func (this *TrueTypeFont) measureText (text string, fontSize float64) float64 {
  var width float64= 0.0;
  var __len int64= int64(len([]rune(text)));
  var i int64= int64(0);
  for i < __len {
    var ch int64= int64([]rune(text)[i]);
    width = width + this.getCharWidthPoints(ch, fontSize); 
    i = i + int64(1); 
  }
  return width
}
func (this *TrueTypeFont) getAscender (fontSize float64) float64 {
  return ((float64( this.ascender )) * fontSize) / (float64( this.unitsPerEm ))
}
func (this *TrueTypeFont) getDescender (fontSize float64) float64 {
  return ((float64( this.descender )) * fontSize) / (float64( this.unitsPerEm ))
}
func (this *TrueTypeFont) getLineHeight (fontSize float64) float64 {
  var asc float64= this.getAscender(fontSize);
  var desc float64= this.getDescender(fontSize);
  var gap float64= ((float64( this.lineGap )) * fontSize) / (float64( this.unitsPerEm ));
  return (asc - desc) + gap
}
func (this *TrueTypeFont) getFontData () []byte {
  return this.fontData
}
func (this *TrueTypeFont) getPostScriptName () string {
  var name string= this.fontFamily;
  var result string= "";
  var i int64= int64(0);
  for i < (int64(len([]rune(name)))) {
    var ch int64= int64([]rune(name)[i]);
    if  ch != int64(32) {
      result = result + (string([]rune{rune(ch)})); 
    }
    i = i + int64(1); 
  }
  if  (int64(len([]rune(result)))) == int64(0) {
    return "CustomFont"
  }
  return result
}
func (this *TrueTypeFont) readUInt8 (offset int64) int64 {
  return int64(this.fontData[offset])
}
func (this *TrueTypeFont) readUInt16 (offset int64) int64 {
  var b1 int64= int64(this.fontData[offset]);
  var b2 int64= int64(this.fontData[(offset + int64(1))]);
  return (b1 * int64(256)) + b2
}
func (this *TrueTypeFont) readInt16 (offset int64) int64 {
  var val int64= this.readUInt16(offset);
  if  val >= int64(32768) {
    return val - int64(65536)
  }
  return val
}
func (this *TrueTypeFont) readUInt32 (offset int64) int64 {
  var b1 int64= int64(this.fontData[offset]);
  var b2 int64= int64(this.fontData[(offset + int64(1))]);
  var b3 int64= int64(this.fontData[(offset + int64(2))]);
  var b4 int64= int64(this.fontData[(offset + int64(3))]);
  var result int64= (((((b1 * int64(256)) + b2) * int64(256)) + b3) * int64(256)) + b4;
  return result
}
func (this *TrueTypeFont) readTag (offset int64) string {
  var result string= "";
  var i int64= int64(0);
  for i < int64(4) {
    var ch int64= int64(this.fontData[(offset + i)]);
    result = result + (string([]rune{rune(ch)})); 
    i = i + int64(1); 
  }
  return result
}
func (this *TrueTypeFont) readAsciiString (offset int64, length int64) string {
  var result string= "";
  var i int64= int64(0);
  for i < length {
    var ch int64= int64(this.fontData[(offset + i)]);
    if  ch > int64(0) {
      result = result + (string([]rune{rune(ch)})); 
    }
    i = i + int64(1); 
  }
  return result
}
func (this *TrueTypeFont) readUnicodeString (offset int64, length int64) string {
  var result string= "";
  var i int64= int64(0);
  for i < length {
    var ch int64= this.readUInt16((offset + i));
    if  (ch > int64(0)) && (ch < int64(128)) {
      result = result + (string([]rune{rune(ch)})); 
    }
    i = i + int64(2); 
  }
  return result
}
func (this *TrueTypeFont) printInfo () () {
  fmt.Println( (("Font: " + this.fontFamily) + " ") + this.fontStyle )
  fmt.Println( "  Units per EM: " + (strconv.FormatInt(this.unitsPerEm, 10)) )
  fmt.Println( "  Ascender: " + (strconv.FormatInt(this.ascender, 10)) )
  fmt.Println( "  Descender: " + (strconv.FormatInt(this.descender, 10)) )
  fmt.Println( "  Line gap: " + (strconv.FormatInt(this.lineGap, 10)) )
  fmt.Println( "  Num glyphs: " + (strconv.FormatInt(this.numGlyphs, 10)) )
  fmt.Println( "  Num hMetrics: " + (strconv.FormatInt(this.numberOfHMetrics, 10)) )
  fmt.Println( "  Tables: " + (strconv.FormatInt((int64(len(this.tables))), 10)) )
}
type FontManager struct { 
  fonts []*TrueTypeFont `json:"fonts"` 
  fontNames []string `json:"fontNames"` 
  fontsDirectory string `json:"fontsDirectory"` 
  fontsDirectories []string `json:"fontsDirectories"` 
  defaultFont *TrueTypeFont `json:"defaultFont"` 
  hasDefaultFont bool `json:"hasDefaultFont"` 
}

func CreateNew_FontManager() *FontManager {
  me := new(FontManager)
  me.fonts = make([]*TrueTypeFont,0)
  me.fontNames = make([]string,0)
  me.fontsDirectory = "./Fonts"
  me.fontsDirectories = make([]string,0)
  me.defaultFont = CreateNew_TrueTypeFont()
  me.hasDefaultFont = false
  var f []*TrueTypeFont = make([]*TrueTypeFont, 0);
  me.fonts = f; 
  var n []string = make([]string, 0);
  me.fontNames = n; 
  var fd []string = make([]string, 0);
  me.fontsDirectories = fd; 
  return me;
}
func (this *FontManager) setFontsDirectory (path string) () {
  this.fontsDirectory = path; 
}
func (this *FontManager) getFontCount () int64 {
  return int64(len(this.fonts))
}
func (this *FontManager) addFontsDirectory (path string) () {
  this.fontsDirectories = append(this.fontsDirectories,path); 
}
func (this *FontManager) setFontsDirectories (paths string) () {
  var start int64= int64(0);
  var i int64= int64(0);
  var __len int64= int64(len([]rune(paths)));
  for i <= __len {
    var ch string= "";
    if  i < __len {
      ch = string([]rune(paths)[i:(i + int64(1))]); 
    }
    if  (ch == ";") || (i == __len) {
      if  i > start {
        var part string= string([]rune(paths)[start:i]);
        this.fontsDirectories = append(this.fontsDirectories,part); 
        fmt.Println( "FontManager: Added fonts directory: " + part )
      }
      start = i + int64(1); 
    }
    i = i + int64(1); 
  }
  if  (int64(len(this.fontsDirectories))) > int64(0) {
    this.fontsDirectory = this.fontsDirectories[int64(0)]; 
  }
}
func (this *FontManager) loadFont (relativePath string) bool {
  var i int64= int64(0);
  for i < (int64(len(this.fontsDirectories))) {
    var dir string= this.fontsDirectories[i];
    var fullPath string= (dir + "/") + relativePath;
    var font *TrueTypeFont= CreateNew_TrueTypeFont();
    if  font.loadFromFile(fullPath) == true {
      this.fonts = append(this.fonts,font); 
      this.fontNames = append(this.fontNames,font.fontFamily); 
      if  this.hasDefaultFont == false {
        this.defaultFont = font; 
        this.hasDefaultFont = true; 
      }
      fmt.Println( (((("FontManager: Loaded font '" + font.fontFamily) + "' (") + font.fontStyle) + ") from ") + fullPath )
      return true
    }
    i = i + int64(1); 
  }
  var fullPath_1 string= (this.fontsDirectory + "/") + relativePath;
  var font_1 *TrueTypeFont= CreateNew_TrueTypeFont();
  if  font_1.loadFromFile(fullPath_1) == false {
    fmt.Println( "FontManager: Failed to load font: " + relativePath )
    return false
  }
  this.fonts = append(this.fonts,font_1); 
  this.fontNames = append(this.fontNames,font_1.fontFamily); 
  if  this.hasDefaultFont == false {
    this.defaultFont = font_1; 
    this.hasDefaultFont = true; 
  }
  fmt.Println( ((("FontManager: Loaded font '" + font_1.fontFamily) + "' (") + font_1.fontStyle) + ")" )
  return true
}
func (this *FontManager) loadFontFamily (familyDir string) () {
  this.loadFont(((familyDir + "/") + familyDir) + "-Regular.ttf");
}
func (this *FontManager) getFont (fontFamily string) *TrueTypeFont {
  var i int64= int64(0);
  for i < (int64(len(this.fonts))) {
    var f *TrueTypeFont= this.fonts[i];
    if  f.fontFamily == fontFamily {
      return f
    }
    i = i + int64(1); 
  }
  i = int64(0); 
  for i < (int64(len(this.fonts))) {
    var f_1 *TrueTypeFont= this.fonts[i];
    if  (int64(strings.Index(f_1.fontFamily, fontFamily))) >= int64(0) {
      return f_1
    }
    i = i + int64(1); 
  }
  return this.defaultFont
}
func (this *FontManager) measureText (text string, fontFamily string, fontSize float64) float64 {
  var font *TrueTypeFont= this.getFont(fontFamily);
  if  font.unitsPerEm > int64(0) {
    return font.measureText(text, fontSize)
  }
  return ((float64( (int64(len([]rune(text)))) )) * fontSize) * 0.5
}
func (this *FontManager) getLineHeight (fontFamily string, fontSize float64) float64 {
  var font *TrueTypeFont= this.getFont(fontFamily);
  if  font.unitsPerEm > int64(0) {
    return font.getLineHeight(fontSize)
  }
  return fontSize * 1.2
}
func (this *FontManager) getAscender (fontFamily string, fontSize float64) float64 {
  var font *TrueTypeFont= this.getFont(fontFamily);
  if  font.unitsPerEm > int64(0) {
    return font.getAscender(fontSize)
  }
  return fontSize * 0.8
}
func (this *FontManager) getDescender (fontFamily string, fontSize float64) float64 {
  var font *TrueTypeFont= this.getFont(fontFamily);
  if  font.unitsPerEm > int64(0) {
    return font.getDescender(fontSize)
  }
  return fontSize * -0.2
}
func (this *FontManager) getFontData (fontFamily string) []byte {
  var font *TrueTypeFont= this.getFont(fontFamily);
  return font.getFontData()
}
func (this *FontManager) getPostScriptName (fontFamily string) string {
  var font *TrueTypeFont= this.getFont(fontFamily);
  return font.getPostScriptName()
}
func (this *FontManager) printLoadedFonts () () {
  fmt.Println( ("FontManager: " + (strconv.FormatInt((int64(len(this.fonts))), 10))) + " fonts loaded:" )
  var i int64= int64(0);
  for i < (int64(len(this.fonts))) {
    var f *TrueTypeFont= this.fonts[i];
    fmt.Println( ((("  - " + f.fontFamily) + " (") + f.fontStyle) + ")" )
    i = i + int64(1); 
  }
}
type TTFTextMeasurer struct { 
  fontManager *GoNullable `json:"fontManager"` 
  // inherited from parent class EVGTextMeasurer
}
type IFACE_TTFTextMeasurer interface { 
  Get_fontManager() *GoNullable
  Set_fontManager(value *GoNullable) 
  measureText(text string, fontFamily string, fontSize float64) *EVGTextMetrics
  measureTextWidth(text string, fontFamily string, fontSize float64) float64
  getLineHeight(fontFamily string, fontSize float64) float64
  measureChar(ch int64, fontFamily string, fontSize float64) float64
}

func CreateNew_TTFTextMeasurer(fm *FontManager) *TTFTextMeasurer {
  me := new(TTFTextMeasurer)
  me.fontManager = new(GoNullable);
  me.fontManager.value = fm;
  me.fontManager.has_value = true; /* detected as non-optional */
  return me;
}
func (this *TTFTextMeasurer) measureText (text string, fontFamily string, fontSize float64) *EVGTextMetrics {
  var width float64= this.fontManager.value.(*FontManager).measureText(text, fontFamily, fontSize);
  var lineHeight float64= this.fontManager.value.(*FontManager).getLineHeight(fontFamily, fontSize);
  var ascent float64= this.fontManager.value.(*FontManager).getAscender(fontFamily, fontSize);
  var descent float64= this.fontManager.value.(*FontManager).getDescender(fontFamily, fontSize);
  var metrics *EVGTextMetrics= CreateNew_EVGTextMetrics();
  metrics.width = width; 
  metrics.height = lineHeight; 
  metrics.ascent = ascent; 
  metrics.descent = descent; 
  metrics.lineHeight = lineHeight; 
  return metrics
}
func (this *TTFTextMeasurer) measureTextWidth (text string, fontFamily string, fontSize float64) float64 {
  return this.fontManager.value.(*FontManager).measureText(text, fontFamily, fontSize)
}
func (this *TTFTextMeasurer) getLineHeight (fontFamily string, fontSize float64) float64 {
  return this.fontManager.value.(*FontManager).getLineHeight(fontFamily, fontSize)
}
func (this *TTFTextMeasurer) measureChar (ch int64, fontFamily string, fontSize float64) float64 {
  var font *TrueTypeFont= this.fontManager.value.(*FontManager).getFont(fontFamily);
  if  font.unitsPerEm > int64(0) {
    return font.getCharWidthPoints(ch, fontSize)
  }
  return fontSize * 0.5
}
// inherited methods from parent class EVGTextMeasurer
func (this *TTFTextMeasurer) wrapText (text string, fontFamily string, fontSize float64, maxWidth float64) []string {
  var lines []string = make([]string, 0);
  var currentLine string= "";
  var currentWidth float64= 0.0;
  var wordStart int64= int64(0);
  var textLen int64= int64(len([]rune(text)));
  var i int64= int64(0);
  for i <= textLen {
    var ch int64= int64(0);
    var isEnd bool= i == textLen;
    if  isEnd == false {
      ch = int64([]rune(text)[i]); 
    }
    var isWordEnd bool= false;
    if  isEnd {
      isWordEnd = true; 
    }
    if  ch == int64(32) {
      isWordEnd = true; 
    }
    if  ch == int64(10) {
      isWordEnd = true; 
    }
    if  isWordEnd {
      var word string= "";
      if  i > wordStart {
        word = string([]rune(text)[wordStart:i]); 
      }
      var wordWidth float64= this.measureTextWidth(word, fontFamily, fontSize);
      var spaceWidth float64= 0.0;
      if  (int64(len([]rune(currentLine)))) > int64(0) {
        spaceWidth = this.measureTextWidth(" ", fontFamily, fontSize); 
      }
      if  ((currentWidth + spaceWidth) + wordWidth) <= maxWidth {
        if  (int64(len([]rune(currentLine)))) > int64(0) {
          currentLine = currentLine + " "; 
          currentWidth = currentWidth + spaceWidth; 
        }
        currentLine = currentLine + word; 
        currentWidth = currentWidth + wordWidth; 
      } else {
        if  (int64(len([]rune(currentLine)))) > int64(0) {
          lines = append(lines,currentLine); 
        }
        currentLine = word; 
        currentWidth = wordWidth; 
      }
      if  ch == int64(10) {
        lines = append(lines,currentLine); 
        currentLine = ""; 
        currentWidth = 0.0; 
      }
      wordStart = i + int64(1); 
    }
    i = i + int64(1); 
  }
  if  (int64(len([]rune(currentLine)))) > int64(0) {
    lines = append(lines,currentLine); 
  }
  return lines
}
// getter for variable fontManager
func (this *TTFTextMeasurer) Get_fontManager() *GoNullable {
  return this.fontManager
}
// setter for variable fontManager
func (this *TTFTextMeasurer) Set_fontManager( value *GoNullable)  {
  this.fontManager = value 
}
// inherited getters and setters from the parent class EVGTextMeasurer
type BitReader struct { 
  data []byte `json:"data"` 
  dataStart int64 `json:"dataStart"` 
  dataEnd int64 `json:"dataEnd"` 
  bytePos int64 `json:"bytePos"` 
  bitPos int64 `json:"bitPos"` 
  currentByte int64 `json:"currentByte"` 
  eof bool `json:"eof"` 
}

func CreateNew_BitReader() *BitReader {
  me := new(BitReader)
  me.data = 
  make([]byte, int64(0))
  
  me.dataStart = int64(0)
  me.dataEnd = int64(0)
  me.bytePos = int64(0)
  me.bitPos = int64(0)
  me.currentByte = int64(0)
  me.eof = false
  return me;
}
func (this *BitReader) init (buf []byte, startPos int64, length int64) () {
  this.data = buf; 
  this.dataStart = startPos; 
  this.dataEnd = startPos + length; 
  this.bytePos = startPos; 
  this.bitPos = int64(0); 
  this.currentByte = int64(0); 
  this.eof = false; 
}
func (this *BitReader) loadNextByte () () {
  if  this.bytePos >= this.dataEnd {
    this.eof = true; 
    this.currentByte = int64(0); 
    this.bitPos = int64(8); 
    return
  }
  this.currentByte = int64(this.data[this.bytePos]); 
  this.bytePos = this.bytePos + int64(1); 
  if  this.currentByte == int64(255) {
    if  this.bytePos < this.dataEnd {
      var nextByte int64= int64(this.data[this.bytePos]);
      if  nextByte == int64(0) {
        this.bytePos = this.bytePos + int64(1); 
      } else {
        if  (nextByte >= int64(208)) && (nextByte <= int64(215)) {
          this.bytePos = this.bytePos + int64(1); 
          this.loadNextByte();
          return
        }
        if  nextByte == int64(255) {
          this.bytePos = this.bytePos + int64(1); 
          this.loadNextByte();
          return
        }
      }
    }
  }
  this.bitPos = int64(8); 
}
func (this *BitReader) readBit () int64 {
  if  this.bitPos == int64(0) {
    this.loadNextByte();
  }
  if  this.eof {
    return int64(0)
  }
  this.bitPos = this.bitPos - int64(1); 
  var bit int64= int64((int64(this.currentByte >> uint(this.bitPos))) & int64(1));
  return bit
}
func (this *BitReader) readBits (count int64) int64 {
  var result int64= int64(0);
  var i int64= int64(0);
  for i < count {
    result = int64((int64(result << uint(int64(1)))) | this.readBit()); 
    i = i + int64(1); 
  }
  return result
}
func (this *BitReader) peekBits (count int64) int64 {
  var savedBytePos int64= this.bytePos;
  var savedBitPos int64= this.bitPos;
  var savedCurrentByte int64= this.currentByte;
  var savedEof bool= this.eof;
  var result int64= this.readBits(count);
  this.bytePos = savedBytePos; 
  this.bitPos = savedBitPos; 
  this.currentByte = savedCurrentByte; 
  this.eof = savedEof; 
  return result
}
func (this *BitReader) alignToByte () () {
  this.bitPos = int64(0); 
}
func (this *BitReader) getBytePosition () int64 {
  return this.bytePos
}
func (this *BitReader) isEOF () bool {
  return this.eof
}
func (this *BitReader) receiveExtend (length int64) int64 {
  if  length == int64(0) {
    return int64(0)
  }
  var value int64= this.readBits(length);
  var threshold int64= int64(int64(1) << uint((length - int64(1))));
  if  value < threshold {
    value = value - ((int64(threshold << uint(int64(1)))) - int64(1)); 
  }
  return value
}
type HuffmanTable struct { 
  bits []int64 `json:"bits"` 
  values []int64 `json:"values"` 
  maxCode []int64 `json:"maxCode"` 
  minCode []int64 `json:"minCode"` 
  valPtr []int64 `json:"valPtr"` 
  tableClass int64 `json:"tableClass"` 
  tableId int64 `json:"tableId"` 
}

func CreateNew_HuffmanTable() *HuffmanTable {
  me := new(HuffmanTable)
  me.bits = 
  make([]int64, int64(16))
  
  me.values = make([]int64,0)
  me.maxCode = 
  make([]int64, int64(16))
  
  me.minCode = 
  make([]int64, int64(16))
  
  me.valPtr = 
  make([]int64, int64(16))
  
  me.tableClass = int64(0)
  me.tableId = int64(0)
  var i int64= int64(0);
  for i < int64(16) {
    me.bits[i] = int64(0)
    me.maxCode[i] = int64(-1)
    me.minCode[i] = int64(0)
    me.valPtr[i] = int64(0)
    i = i + int64(1); 
  }
  return me;
}
func (this *HuffmanTable) build () () {
  var code int64= int64(0);
  var valueIdx int64= int64(0);
  var i int64= int64(0);
  for i < int64(16) {
    var count int64= this.bits[i];
    if  count > int64(0) {
      this.minCode[i] = code
      this.valPtr[i] = valueIdx
      valueIdx = valueIdx + count; 
      code = code + count; 
      this.maxCode[i] = code - int64(1)
    } else {
      this.maxCode[i] = int64(-1)
      this.minCode[i] = int64(0)
      this.valPtr[i] = valueIdx
    }
    code = int64(code << uint(int64(1))); 
    i = i + int64(1); 
  }
}
func (this *HuffmanTable) decode (reader *BitReader) int64 {
  var code int64= int64(0);
  var length int64= int64(0);
  for length < int64(16) {
    var bit int64= reader.readBit();
    code = int64((int64(code << uint(int64(1)))) | bit); 
    var maxC int64= this.maxCode[length];
    if  maxC >= int64(0) {
      if  code <= maxC {
        var minC int64= this.minCode[length];
        var ptr int64= this.valPtr[length];
        var idx int64= ptr + (code - minC);
        return this.values[idx]
      }
    }
    length = length + int64(1); 
  }
  fmt.Println( "Huffman decode error: code not found" )
  return int64(0)
}
func (this *HuffmanTable) resetArrays () () {
  var i int64= int64(0);
  for i < int64(16) {
    this.bits[i] = int64(0)
    this.maxCode[i] = int64(-1)
    this.minCode[i] = int64(0)
    this.valPtr[i] = int64(0)
    i = i + int64(1); 
  }
  this.values = this.values[:0]
}
type HuffmanDecoder struct { 
  dcTable0 *HuffmanTable `json:"dcTable0"` 
  dcTable1 *HuffmanTable `json:"dcTable1"` 
  acTable0 *HuffmanTable `json:"acTable0"` 
  acTable1 *HuffmanTable `json:"acTable1"` 
}

func CreateNew_HuffmanDecoder() *HuffmanDecoder {
  me := new(HuffmanDecoder)
  me.dcTable0 = CreateNew_HuffmanTable()
  me.dcTable1 = CreateNew_HuffmanTable()
  me.acTable0 = CreateNew_HuffmanTable()
  me.acTable1 = CreateNew_HuffmanTable()
  return me;
}
func (this *HuffmanDecoder) getDCTable (id int64) *HuffmanTable {
  if  id == int64(0) {
    return this.dcTable0
  }
  return this.dcTable1
}
func (this *HuffmanDecoder) getACTable (id int64) *HuffmanTable {
  if  id == int64(0) {
    return this.acTable0
  }
  return this.acTable1
}
func (this *HuffmanDecoder) parseDHT (data []byte, pos int64, length int64) () {
  var endPos int64= pos + length;
  for pos < endPos {
    var tableInfo int64= int64(data[pos]);
    pos = pos + int64(1); 
    var tableClass int64= int64(tableInfo >> uint(int64(4)));
    var tableId int64= int64(tableInfo & int64(15));
    var table *HuffmanTable= this.getDCTable(tableId);
    if  tableClass == int64(1) {
      table = this.getACTable(tableId); 
    }
    table.tableClass = tableClass; 
    table.tableId = tableId; 
    table.resetArrays();
    var totalSymbols int64= int64(0);
    var i int64= int64(0);
    for i < int64(16) {
      var count int64= int64(data[pos]);
      table.bits[i] = count
      totalSymbols = totalSymbols + count; 
      pos = pos + int64(1); 
      i = i + int64(1); 
    }
    i = int64(0); 
    for i < totalSymbols {
      table.values = append(table.values,int64(data[pos])); 
      pos = pos + int64(1); 
      i = i + int64(1); 
    }
    table.build();
    var classStr string= "DC";
    if  tableClass == int64(1) {
      classStr = "AC"; 
    }
    fmt.Println( (((("  Huffman table " + classStr) + (strconv.FormatInt(tableId, 10))) + ": ") + (strconv.FormatInt(totalSymbols, 10))) + " symbols" )
  }
}
type IDCT struct { 
  cosTable []int64 `json:"cosTable"` 
  zigzagMap []int64 `json:"zigzagMap"` 
}

func CreateNew_IDCT() *IDCT {
  me := new(IDCT)
  me.cosTable = 
  make([]int64, int64(64))
  
  me.zigzagMap = 
  make([]int64, int64(64))
  
  me.cosTable[int64(0)] = int64(1024)
  me.cosTable[int64(1)] = int64(1004)
  me.cosTable[int64(2)] = int64(946)
  me.cosTable[int64(3)] = int64(851)
  me.cosTable[int64(4)] = int64(724)
  me.cosTable[int64(5)] = int64(569)
  me.cosTable[int64(6)] = int64(392)
  me.cosTable[int64(7)] = int64(200)
  me.cosTable[int64(8)] = int64(1024)
  me.cosTable[int64(9)] = int64(851)
  me.cosTable[int64(10)] = int64(392)
  me.cosTable[int64(11)] = int64(-200)
  me.cosTable[int64(12)] = int64(-724)
  me.cosTable[int64(13)] = int64(-1004)
  me.cosTable[int64(14)] = int64(-946)
  me.cosTable[int64(15)] = int64(-569)
  me.cosTable[int64(16)] = int64(1024)
  me.cosTable[int64(17)] = int64(569)
  me.cosTable[int64(18)] = int64(-392)
  me.cosTable[int64(19)] = int64(-1004)
  me.cosTable[int64(20)] = int64(-724)
  me.cosTable[int64(21)] = int64(200)
  me.cosTable[int64(22)] = int64(946)
  me.cosTable[int64(23)] = int64(851)
  me.cosTable[int64(24)] = int64(1024)
  me.cosTable[int64(25)] = int64(200)
  me.cosTable[int64(26)] = int64(-946)
  me.cosTable[int64(27)] = int64(-569)
  me.cosTable[int64(28)] = int64(724)
  me.cosTable[int64(29)] = int64(851)
  me.cosTable[int64(30)] = int64(-392)
  me.cosTable[int64(31)] = int64(-1004)
  me.cosTable[int64(32)] = int64(1024)
  me.cosTable[int64(33)] = int64(-200)
  me.cosTable[int64(34)] = int64(-946)
  me.cosTable[int64(35)] = int64(569)
  me.cosTable[int64(36)] = int64(724)
  me.cosTable[int64(37)] = int64(-851)
  me.cosTable[int64(38)] = int64(-392)
  me.cosTable[int64(39)] = int64(1004)
  me.cosTable[int64(40)] = int64(1024)
  me.cosTable[int64(41)] = int64(-569)
  me.cosTable[int64(42)] = int64(-392)
  me.cosTable[int64(43)] = int64(1004)
  me.cosTable[int64(44)] = int64(-724)
  me.cosTable[int64(45)] = int64(-200)
  me.cosTable[int64(46)] = int64(946)
  me.cosTable[int64(47)] = int64(-851)
  me.cosTable[int64(48)] = int64(1024)
  me.cosTable[int64(49)] = int64(-851)
  me.cosTable[int64(50)] = int64(392)
  me.cosTable[int64(51)] = int64(200)
  me.cosTable[int64(52)] = int64(-724)
  me.cosTable[int64(53)] = int64(1004)
  me.cosTable[int64(54)] = int64(-946)
  me.cosTable[int64(55)] = int64(569)
  me.cosTable[int64(56)] = int64(1024)
  me.cosTable[int64(57)] = int64(-1004)
  me.cosTable[int64(58)] = int64(946)
  me.cosTable[int64(59)] = int64(-851)
  me.cosTable[int64(60)] = int64(724)
  me.cosTable[int64(61)] = int64(-569)
  me.cosTable[int64(62)] = int64(392)
  me.cosTable[int64(63)] = int64(-200)
  me.zigzagMap[int64(0)] = int64(0)
  me.zigzagMap[int64(1)] = int64(1)
  me.zigzagMap[int64(2)] = int64(8)
  me.zigzagMap[int64(3)] = int64(16)
  me.zigzagMap[int64(4)] = int64(9)
  me.zigzagMap[int64(5)] = int64(2)
  me.zigzagMap[int64(6)] = int64(3)
  me.zigzagMap[int64(7)] = int64(10)
  me.zigzagMap[int64(8)] = int64(17)
  me.zigzagMap[int64(9)] = int64(24)
  me.zigzagMap[int64(10)] = int64(32)
  me.zigzagMap[int64(11)] = int64(25)
  me.zigzagMap[int64(12)] = int64(18)
  me.zigzagMap[int64(13)] = int64(11)
  me.zigzagMap[int64(14)] = int64(4)
  me.zigzagMap[int64(15)] = int64(5)
  me.zigzagMap[int64(16)] = int64(12)
  me.zigzagMap[int64(17)] = int64(19)
  me.zigzagMap[int64(18)] = int64(26)
  me.zigzagMap[int64(19)] = int64(33)
  me.zigzagMap[int64(20)] = int64(40)
  me.zigzagMap[int64(21)] = int64(48)
  me.zigzagMap[int64(22)] = int64(41)
  me.zigzagMap[int64(23)] = int64(34)
  me.zigzagMap[int64(24)] = int64(27)
  me.zigzagMap[int64(25)] = int64(20)
  me.zigzagMap[int64(26)] = int64(13)
  me.zigzagMap[int64(27)] = int64(6)
  me.zigzagMap[int64(28)] = int64(7)
  me.zigzagMap[int64(29)] = int64(14)
  me.zigzagMap[int64(30)] = int64(21)
  me.zigzagMap[int64(31)] = int64(28)
  me.zigzagMap[int64(32)] = int64(35)
  me.zigzagMap[int64(33)] = int64(42)
  me.zigzagMap[int64(34)] = int64(49)
  me.zigzagMap[int64(35)] = int64(56)
  me.zigzagMap[int64(36)] = int64(57)
  me.zigzagMap[int64(37)] = int64(50)
  me.zigzagMap[int64(38)] = int64(43)
  me.zigzagMap[int64(39)] = int64(36)
  me.zigzagMap[int64(40)] = int64(29)
  me.zigzagMap[int64(41)] = int64(22)
  me.zigzagMap[int64(42)] = int64(15)
  me.zigzagMap[int64(43)] = int64(23)
  me.zigzagMap[int64(44)] = int64(30)
  me.zigzagMap[int64(45)] = int64(37)
  me.zigzagMap[int64(46)] = int64(44)
  me.zigzagMap[int64(47)] = int64(51)
  me.zigzagMap[int64(48)] = int64(58)
  me.zigzagMap[int64(49)] = int64(59)
  me.zigzagMap[int64(50)] = int64(52)
  me.zigzagMap[int64(51)] = int64(45)
  me.zigzagMap[int64(52)] = int64(38)
  me.zigzagMap[int64(53)] = int64(31)
  me.zigzagMap[int64(54)] = int64(39)
  me.zigzagMap[int64(55)] = int64(46)
  me.zigzagMap[int64(56)] = int64(53)
  me.zigzagMap[int64(57)] = int64(60)
  me.zigzagMap[int64(58)] = int64(61)
  me.zigzagMap[int64(59)] = int64(54)
  me.zigzagMap[int64(60)] = int64(47)
  me.zigzagMap[int64(61)] = int64(55)
  me.zigzagMap[int64(62)] = int64(62)
  me.zigzagMap[int64(63)] = int64(63)
  return me;
}
func (this *IDCT) dezigzag (zigzag []int64) []int64 {
  var block []int64= make([]int64, int64(64));
  var i int64= int64(0);
  for i < int64(64) {
    var pos int64= this.zigzagMap[i];
    var val int64= zigzag[i];
    block[pos] = val
    i = i + int64(1); 
  }
  return block
}
func (this *IDCT) idct1d (input []int64, startIdx int64, stride int64, output []int64, outIdx int64, outStride int64) () {
  var x int64= int64(0);
  for x < int64(8) {
    var sum int64= int64(0);
    var u int64= int64(0);
    for u < int64(8) {
      var coeff int64= input[(startIdx + (u * stride))];
      if  coeff != int64(0) {
        var cosVal int64= this.cosTable[((x * int64(8)) + u)];
        var contrib int64= coeff * cosVal;
        if  u == int64(0) {
          contrib = int64((contrib * int64(724)) >> uint(int64(10))); 
        }
        sum = sum + contrib; 
      }
      u = u + int64(1); 
    }
    output[outIdx + (x * outStride)] = int64(sum >> uint(int64(11)))
    x = x + int64(1); 
  }
}
func (this *IDCT) transform (block []int64, output []int64) () {
  var temp []int64= make([]int64, int64(64));
  var row int64= int64(0);
  for row < int64(8) {
    var rowStart int64= row * int64(8);
    this.idct1d(block, rowStart, int64(1), temp, rowStart, int64(1));
    row = row + int64(1); 
  }
  var col int64= int64(0);
  for col < int64(8) {
    this.idct1d(temp, col, int64(8), output, col, int64(8));
    col = col + int64(1); 
  }
  var i int64= int64(0);
  for i < int64(64) {
    var val int64= (output[i]) + int64(128);
    if  val < int64(0) {
      val = int64(0); 
    }
    if  val > int64(255) {
      val = int64(255); 
    }
    output[i] = val
    i = i + int64(1); 
  }
}
func (this *IDCT) transformFast (coeffs []int64, output []int64) () {
  this.transform(coeffs, output);
}
type Color struct { 
  r int64 `json:"r"` 
  g int64 `json:"g"` 
  b int64 `json:"b"` 
  a int64 `json:"a"` 
}

func CreateNew_Color() *Color {
  me := new(Color)
  me.r = int64(0)
  me.g = int64(0)
  me.b = int64(0)
  me.a = int64(255)
  return me;
}
func (this *Color) setRGB (red int64, green int64, blue int64) () {
  this.r = red; 
  this.g = green; 
  this.b = blue; 
  this.a = int64(255); 
}
func (this *Color) setRGBA (red int64, green int64, blue int64, alpha int64) () {
  this.r = red; 
  this.g = green; 
  this.b = blue; 
  this.a = alpha; 
}
func (this *Color) clamp (val int64) int64 {
  if  val < int64(0) {
    return int64(0)
  }
  if  val > int64(255) {
    return int64(255)
  }
  return val
}
func (this *Color) set (red int64, green int64, blue int64) () {
  this.r = this.clamp(red); 
  this.g = this.clamp(green); 
  this.b = this.clamp(blue); 
}
func (this *Color) grayscale () int64 {
  return int64((((this.r * int64(77)) + (this.g * int64(150))) + (this.b * int64(29))) >> uint(int64(8)))
}
func (this *Color) toGrayscale () () {
  var gray int64= this.grayscale();
  this.r = gray; 
  this.g = gray; 
  this.b = gray; 
}
func (this *Color) invert () () {
  this.r = int64(255) - this.r; 
  this.g = int64(255) - this.g; 
  this.b = int64(255) - this.b; 
}
func (this *Color) adjustBrightness (amount int64) () {
  this.r = this.clamp((this.r + amount)); 
  this.g = this.clamp((this.g + amount)); 
  this.b = this.clamp((this.b + amount)); 
}
type ImageBuffer struct { 
  width int64 `json:"width"` 
  height int64 `json:"height"` 
  pixels []byte `json:"pixels"` 
}

func CreateNew_ImageBuffer() *ImageBuffer {
  me := new(ImageBuffer)
  me.width = int64(0)
  me.height = int64(0)
  me.pixels = 
  make([]byte, int64(0))
  
  return me;
}
func (this *ImageBuffer) init (w int64, h int64) () {
  this.width = w; 
  this.height = h; 
  var size int64= (w * h) * int64(4);
  this.pixels = make([]byte, size); 
  this.fill(int64(255), int64(255), int64(255), int64(255));
}
func (this *ImageBuffer) getPixelOffset (x int64, y int64) int64 {
  return ((y * this.width) + x) * int64(4)
}
func (this *ImageBuffer) isValidCoord (x int64, y int64) bool {
  if  x < int64(0) {
    return false
  }
  if  y < int64(0) {
    return false
  }
  if  x >= this.width {
    return false
  }
  if  y >= this.height {
    return false
  }
  return true
}
func (this *ImageBuffer) getPixel (x int64, y int64) *Color {
  var c *Color= CreateNew_Color();
  if  this.isValidCoord(x, y) {
    var off int64= this.getPixelOffset(x, y);
    c.r = int64(this.pixels[off]); 
    c.g = int64(this.pixels[(off + int64(1))]); 
    c.b = int64(this.pixels[(off + int64(2))]); 
    c.a = int64(this.pixels[(off + int64(3))]); 
  }
  return c
}
func (this *ImageBuffer) setPixel (x int64, y int64, c *Color) () {
  if  this.isValidCoord(x, y) {
    var off int64= this.getPixelOffset(x, y);
    this.pixels[off] = byte(c.r)
    this.pixels[off + int64(1)] = byte(c.g)
    this.pixels[off + int64(2)] = byte(c.b)
    this.pixels[off + int64(3)] = byte(c.a)
  }
}
func (this *ImageBuffer) setPixelRGB (x int64, y int64, r int64, g int64, b int64) () {
  if  this.isValidCoord(x, y) {
    var off int64= this.getPixelOffset(x, y);
    this.pixels[off] = byte(r)
    this.pixels[off + int64(1)] = byte(g)
    this.pixels[off + int64(2)] = byte(b)
    this.pixels[off + int64(3)] = byte(int64(255))
  }
}
func (this *ImageBuffer) fill (r int64, g int64, b int64, a int64) () {
  var size int64= (this.width * this.height) * int64(4);
  var i int64= int64(0);
  for i < size {
    this.pixels[i] = byte(r)
    this.pixels[i + int64(1)] = byte(g)
    this.pixels[i + int64(2)] = byte(b)
    this.pixels[i + int64(3)] = byte(a)
    i = i + int64(4); 
  }
}
func (this *ImageBuffer) fillRect (x int64, y int64, w int64, h int64, c *Color) () {
  var endX int64= x + w;
  var endY int64= y + h;
  var py int64= y;
  for py < endY {
    var px int64= x;
    for px < endX {
      this.setPixel(px, py, c);
      px = px + int64(1); 
    }
    py = py + int64(1); 
  }
}
func (this *ImageBuffer) invert () () {
  var size int64= this.width * this.height;
  var i int64= int64(0);
  for i < size {
    var off int64= i * int64(4);
    var r int64= int64(this.pixels[off]);
    var g int64= int64(this.pixels[(off + int64(1))]);
    var b int64= int64(this.pixels[(off + int64(2))]);
    this.pixels[off] = byte(int64(255) - r)
    this.pixels[off + int64(1)] = byte(int64(255) - g)
    this.pixels[off + int64(2)] = byte(int64(255) - b)
    i = i + int64(1); 
  }
}
func (this *ImageBuffer) grayscale () () {
  var size int64= this.width * this.height;
  var i int64= int64(0);
  for i < size {
    var off int64= i * int64(4);
    var r int64= int64(this.pixels[off]);
    var g int64= int64(this.pixels[(off + int64(1))]);
    var b int64= int64(this.pixels[(off + int64(2))]);
    var gray int64= int64((((r * int64(77)) + (g * int64(150))) + (b * int64(29))) >> uint(int64(8)));
    this.pixels[off] = byte(gray)
    this.pixels[off + int64(1)] = byte(gray)
    this.pixels[off + int64(2)] = byte(gray)
    i = i + int64(1); 
  }
}
func (this *ImageBuffer) adjustBrightness (amount int64) () {
  var size int64= this.width * this.height;
  var i int64= int64(0);
  for i < size {
    var off int64= i * int64(4);
    var r int64= int64(this.pixels[off]);
    var g int64= int64(this.pixels[(off + int64(1))]);
    var b int64= int64(this.pixels[(off + int64(2))]);
    r = r + amount; 
    g = g + amount; 
    b = b + amount; 
    if  r < int64(0) {
      r = int64(0); 
    }
    if  r > int64(255) {
      r = int64(255); 
    }
    if  g < int64(0) {
      g = int64(0); 
    }
    if  g > int64(255) {
      g = int64(255); 
    }
    if  b < int64(0) {
      b = int64(0); 
    }
    if  b > int64(255) {
      b = int64(255); 
    }
    this.pixels[off] = byte(r)
    this.pixels[off + int64(1)] = byte(g)
    this.pixels[off + int64(2)] = byte(b)
    i = i + int64(1); 
  }
}
func (this *ImageBuffer) threshold (level int64) () {
  var size int64= this.width * this.height;
  var i int64= int64(0);
  for i < size {
    var off int64= i * int64(4);
    var r int64= int64(this.pixels[off]);
    var g int64= int64(this.pixels[(off + int64(1))]);
    var b int64= int64(this.pixels[(off + int64(2))]);
    var gray int64= int64((((r * int64(77)) + (g * int64(150))) + (b * int64(29))) >> uint(int64(8)));
    var val int64= int64(0);
    if  gray >= level {
      val = int64(255); 
    }
    this.pixels[off] = byte(val)
    this.pixels[off + int64(1)] = byte(val)
    this.pixels[off + int64(2)] = byte(val)
    i = i + int64(1); 
  }
}
func (this *ImageBuffer) sepia () () {
  var size int64= this.width * this.height;
  var i int64= int64(0);
  for i < size {
    var off int64= i * int64(4);
    var r int64= int64(this.pixels[off]);
    var g int64= int64(this.pixels[(off + int64(1))]);
    var b int64= int64(this.pixels[(off + int64(2))]);
    var newR int64= int64((((r * int64(101)) + (g * int64(197))) + (b * int64(48))) >> uint(int64(8)));
    var newG int64= int64((((r * int64(89)) + (g * int64(175))) + (b * int64(43))) >> uint(int64(8)));
    var newB int64= int64((((r * int64(70)) + (g * int64(137))) + (b * int64(33))) >> uint(int64(8)));
    if  newR > int64(255) {
      newR = int64(255); 
    }
    if  newG > int64(255) {
      newG = int64(255); 
    }
    if  newB > int64(255) {
      newB = int64(255); 
    }
    this.pixels[off] = byte(newR)
    this.pixels[off + int64(1)] = byte(newG)
    this.pixels[off + int64(2)] = byte(newB)
    i = i + int64(1); 
  }
}
func (this *ImageBuffer) flipHorizontal () () {
  var y int64= int64(0);
  for y < this.height {
    var x int64= int64(0);
    var halfW int64= int64(this.width >> uint(int64(1)));
    for x < halfW {
      var x2 int64= (this.width - int64(1)) - x;
      var off1 int64= this.getPixelOffset(x, y);
      var off2 int64= this.getPixelOffset(x2, y);
      var r1 int64= int64(this.pixels[off1]);
      var g1 int64= int64(this.pixels[(off1 + int64(1))]);
      var b1 int64= int64(this.pixels[(off1 + int64(2))]);
      var a1 int64= int64(this.pixels[(off1 + int64(3))]);
      var r2 int64= int64(this.pixels[off2]);
      var g2 int64= int64(this.pixels[(off2 + int64(1))]);
      var b2 int64= int64(this.pixels[(off2 + int64(2))]);
      var a2 int64= int64(this.pixels[(off2 + int64(3))]);
      this.pixels[off1] = byte(r2)
      this.pixels[off1 + int64(1)] = byte(g2)
      this.pixels[off1 + int64(2)] = byte(b2)
      this.pixels[off1 + int64(3)] = byte(a2)
      this.pixels[off2] = byte(r1)
      this.pixels[off2 + int64(1)] = byte(g1)
      this.pixels[off2 + int64(2)] = byte(b1)
      this.pixels[off2 + int64(3)] = byte(a1)
      x = x + int64(1); 
    }
    y = y + int64(1); 
  }
}
func (this *ImageBuffer) flipVertical () () {
  var y int64= int64(0);
  var halfH int64= int64(this.height >> uint(int64(1)));
  for y < halfH {
    var y2 int64= (this.height - int64(1)) - y;
    var x int64= int64(0);
    for x < this.width {
      var off1 int64= this.getPixelOffset(x, y);
      var off2 int64= this.getPixelOffset(x, y2);
      var r1 int64= int64(this.pixels[off1]);
      var g1 int64= int64(this.pixels[(off1 + int64(1))]);
      var b1 int64= int64(this.pixels[(off1 + int64(2))]);
      var a1 int64= int64(this.pixels[(off1 + int64(3))]);
      var r2 int64= int64(this.pixels[off2]);
      var g2 int64= int64(this.pixels[(off2 + int64(1))]);
      var b2 int64= int64(this.pixels[(off2 + int64(2))]);
      var a2 int64= int64(this.pixels[(off2 + int64(3))]);
      this.pixels[off1] = byte(r2)
      this.pixels[off1 + int64(1)] = byte(g2)
      this.pixels[off1 + int64(2)] = byte(b2)
      this.pixels[off1 + int64(3)] = byte(a2)
      this.pixels[off2] = byte(r1)
      this.pixels[off2 + int64(1)] = byte(g1)
      this.pixels[off2 + int64(2)] = byte(b1)
      this.pixels[off2 + int64(3)] = byte(a1)
      x = x + int64(1); 
    }
    y = y + int64(1); 
  }
}
func (this *ImageBuffer) drawLine (x1 int64, y1 int64, x2 int64, y2 int64, c *Color) () {
  var dx int64= x2 - x1;
  var dy int64= y2 - y1;
  if  dx < int64(0) {
    dx = int64(0) - dx; 
  }
  if  dy < int64(0) {
    dy = int64(0) - dy; 
  }
  var sx int64= int64(1);
  if  x1 > x2 {
    sx = int64(-1); 
  }
  var sy int64= int64(1);
  if  y1 > y2 {
    sy = int64(-1); 
  }
  var err int64= dx - dy;
  var x int64= x1;
  var y int64= y1;
  var done bool= false;
  for done == false {
    this.setPixel(x, y, c);
    if  (x == x2) && (y == y2) {
      done = true; 
    } else {
      var e2 int64= err * int64(2);
      if  e2 > (int64(0) - dy) {
        err = err - dy; 
        x = x + sx; 
      }
      if  e2 < dx {
        err = err + dx; 
        y = y + sy; 
      }
    }
  }
}
func (this *ImageBuffer) drawRect (x int64, y int64, w int64, h int64, c *Color) () {
  this.drawLine(x, y, (x + w) - int64(1), y, c);
  this.drawLine((x + w) - int64(1), y, (x + w) - int64(1), (y + h) - int64(1), c);
  this.drawLine((x + w) - int64(1), (y + h) - int64(1), x, (y + h) - int64(1), c);
  this.drawLine(x, (y + h) - int64(1), x, y, c);
}
func (this *ImageBuffer) scale (factor int64) *ImageBuffer {
  var newW int64= this.width * factor;
  var newH int64= this.height * factor;
  return this.scaleToSize(newW, newH)
}
func (this *ImageBuffer) scaleToSize (newW int64, newH int64) *ImageBuffer {
  var result *ImageBuffer= CreateNew_ImageBuffer();
  result.init(newW, newH);
  var scaleX float64= (float64( this.width )) / (float64( newW ));
  var scaleY float64= (float64( this.height )) / (float64( newH ));
  var destY int64= int64(0);
  for destY < newH {
    var srcYf float64= (float64( destY )) * scaleY;
    var srcY0 int64= int64(srcYf);
    var srcY1 int64= srcY0 + int64(1);
    if  srcY1 >= this.height {
      srcY1 = this.height - int64(1); 
    }
    var fy float64= srcYf - (float64( srcY0 ));
    var destX int64= int64(0);
    for destX < newW {
      var srcXf float64= (float64( destX )) * scaleX;
      var srcX0 int64= int64(srcXf);
      var srcX1 int64= srcX0 + int64(1);
      if  srcX1 >= this.width {
        srcX1 = this.width - int64(1); 
      }
      var fx float64= srcXf - (float64( srcX0 ));
      var off00 int64= ((srcY0 * this.width) + srcX0) * int64(4);
      var off01 int64= ((srcY0 * this.width) + srcX1) * int64(4);
      var off10 int64= ((srcY1 * this.width) + srcX0) * int64(4);
      var off11 int64= ((srcY1 * this.width) + srcX1) * int64(4);
      var r int64= this.bilinear((int64(this.pixels[off00])), (int64(this.pixels[off01])), (int64(this.pixels[off10])), (int64(this.pixels[off11])), fx, fy);
      var g int64= this.bilinear((int64(this.pixels[(off00 + int64(1))])), (int64(this.pixels[(off01 + int64(1))])), (int64(this.pixels[(off10 + int64(1))])), (int64(this.pixels[(off11 + int64(1))])), fx, fy);
      var b int64= this.bilinear((int64(this.pixels[(off00 + int64(2))])), (int64(this.pixels[(off01 + int64(2))])), (int64(this.pixels[(off10 + int64(2))])), (int64(this.pixels[(off11 + int64(2))])), fx, fy);
      var a int64= this.bilinear((int64(this.pixels[(off00 + int64(3))])), (int64(this.pixels[(off01 + int64(3))])), (int64(this.pixels[(off10 + int64(3))])), (int64(this.pixels[(off11 + int64(3))])), fx, fy);
      var destOff int64= ((destY * newW) + destX) * int64(4);
      result.pixels[destOff] = byte(r)
      result.pixels[destOff + int64(1)] = byte(g)
      result.pixels[destOff + int64(2)] = byte(b)
      result.pixels[destOff + int64(3)] = byte(a)
      destX = destX + int64(1); 
    }
    destY = destY + int64(1); 
  }
  return result
}
func (this *ImageBuffer) bilinear (v00 int64, v01 int64, v10 int64, v11 int64, fx float64, fy float64) int64 {
  var top float64= ((float64( v00 )) * (1.0 - fx)) + ((float64( v01 )) * fx);
  var bottom float64= ((float64( v10 )) * (1.0 - fx)) + ((float64( v11 )) * fx);
  var result float64= (top * (1.0 - fy)) + (bottom * fy);
  return int64(result)
}
func (this *ImageBuffer) rotate90CW () *ImageBuffer {
  var result *ImageBuffer= CreateNew_ImageBuffer();
  result.init(this.height, this.width);
  var y int64= int64(0);
  for y < this.height {
    var x int64= int64(0);
    for x < this.width {
      var newX int64= (this.height - int64(1)) - y;
      var newY int64= x;
      var srcOff int64= ((y * this.width) + x) * int64(4);
      var destOff int64= ((newY * this.height) + newX) * int64(4);
      result.pixels[destOff] = byte(int64(this.pixels[srcOff]))
      result.pixels[destOff + int64(1)] = byte(int64(this.pixels[(srcOff + int64(1))]))
      result.pixels[destOff + int64(2)] = byte(int64(this.pixels[(srcOff + int64(2))]))
      result.pixels[destOff + int64(3)] = byte(int64(this.pixels[(srcOff + int64(3))]))
      x = x + int64(1); 
    }
    y = y + int64(1); 
  }
  return result
}
func (this *ImageBuffer) rotate180 () *ImageBuffer {
  var result *ImageBuffer= CreateNew_ImageBuffer();
  result.init(this.width, this.height);
  var y int64= int64(0);
  for y < this.height {
    var x int64= int64(0);
    for x < this.width {
      var newX int64= (this.width - int64(1)) - x;
      var newY int64= (this.height - int64(1)) - y;
      var srcOff int64= ((y * this.width) + x) * int64(4);
      var destOff int64= ((newY * this.width) + newX) * int64(4);
      result.pixels[destOff] = byte(int64(this.pixels[srcOff]))
      result.pixels[destOff + int64(1)] = byte(int64(this.pixels[(srcOff + int64(1))]))
      result.pixels[destOff + int64(2)] = byte(int64(this.pixels[(srcOff + int64(2))]))
      result.pixels[destOff + int64(3)] = byte(int64(this.pixels[(srcOff + int64(3))]))
      x = x + int64(1); 
    }
    y = y + int64(1); 
  }
  return result
}
func (this *ImageBuffer) rotate270CW () *ImageBuffer {
  var result *ImageBuffer= CreateNew_ImageBuffer();
  result.init(this.height, this.width);
  var y int64= int64(0);
  for y < this.height {
    var x int64= int64(0);
    for x < this.width {
      var newX int64= y;
      var newY int64= (this.width - int64(1)) - x;
      var srcOff int64= ((y * this.width) + x) * int64(4);
      var destOff int64= ((newY * this.height) + newX) * int64(4);
      result.pixels[destOff] = byte(int64(this.pixels[srcOff]))
      result.pixels[destOff + int64(1)] = byte(int64(this.pixels[(srcOff + int64(1))]))
      result.pixels[destOff + int64(2)] = byte(int64(this.pixels[(srcOff + int64(2))]))
      result.pixels[destOff + int64(3)] = byte(int64(this.pixels[(srcOff + int64(3))]))
      x = x + int64(1); 
    }
    y = y + int64(1); 
  }
  return result
}
func (this *ImageBuffer) transpose () *ImageBuffer {
  var result *ImageBuffer= CreateNew_ImageBuffer();
  result.init(this.height, this.width);
  var y int64= int64(0);
  for y < this.height {
    var x int64= int64(0);
    for x < this.width {
      var srcOff int64= ((y * this.width) + x) * int64(4);
      var destOff int64= ((x * this.height) + y) * int64(4);
      result.pixels[destOff] = byte(int64(this.pixels[srcOff]))
      result.pixels[destOff + int64(1)] = byte(int64(this.pixels[(srcOff + int64(1))]))
      result.pixels[destOff + int64(2)] = byte(int64(this.pixels[(srcOff + int64(2))]))
      result.pixels[destOff + int64(3)] = byte(int64(this.pixels[(srcOff + int64(3))]))
      x = x + int64(1); 
    }
    y = y + int64(1); 
  }
  return result
}
func (this *ImageBuffer) transverse () *ImageBuffer {
  var result *ImageBuffer= CreateNew_ImageBuffer();
  result.init(this.height, this.width);
  var y int64= int64(0);
  for y < this.height {
    var x int64= int64(0);
    for x < this.width {
      var newX int64= (this.height - int64(1)) - y;
      var newY int64= (this.width - int64(1)) - x;
      var srcOff int64= ((y * this.width) + x) * int64(4);
      var destOff int64= ((newY * this.height) + newX) * int64(4);
      result.pixels[destOff] = byte(int64(this.pixels[srcOff]))
      result.pixels[destOff + int64(1)] = byte(int64(this.pixels[(srcOff + int64(1))]))
      result.pixels[destOff + int64(2)] = byte(int64(this.pixels[(srcOff + int64(2))]))
      result.pixels[destOff + int64(3)] = byte(int64(this.pixels[(srcOff + int64(3))]))
      x = x + int64(1); 
    }
    y = y + int64(1); 
  }
  return result
}
func (this *ImageBuffer) applyExifOrientation (orientation int64) *ImageBuffer {
  if  orientation == int64(1) {
    return this.scale(int64(1))
  }
  if  orientation == int64(2) {
    var result *ImageBuffer= CreateNew_ImageBuffer();
    result.init(this.width, this.height);
    var y int64= int64(0);
    for y < this.height {
      var x int64= int64(0);
      for x < this.width {
        var srcOff int64= ((y * this.width) + x) * int64(4);
        var destOff int64= ((y * this.width) + ((this.width - int64(1)) - x)) * int64(4);
        result.pixels[destOff] = byte(int64(this.pixels[srcOff]))
        result.pixels[destOff + int64(1)] = byte(int64(this.pixels[(srcOff + int64(1))]))
        result.pixels[destOff + int64(2)] = byte(int64(this.pixels[(srcOff + int64(2))]))
        result.pixels[destOff + int64(3)] = byte(int64(this.pixels[(srcOff + int64(3))]))
        x = x + int64(1); 
      }
      y = y + int64(1); 
    }
    return result
  }
  if  orientation == int64(3) {
    return this.rotate180()
  }
  if  orientation == int64(4) {
    var result_1 *ImageBuffer= CreateNew_ImageBuffer();
    result_1.init(this.width, this.height);
    var y_1 int64= int64(0);
    for y_1 < this.height {
      var x_1 int64= int64(0);
      for x_1 < this.width {
        var srcOff_1 int64= ((y_1 * this.width) + x_1) * int64(4);
        var destOff_1 int64= ((((this.height - int64(1)) - y_1) * this.width) + x_1) * int64(4);
        result_1.pixels[destOff_1] = byte(int64(this.pixels[srcOff_1]))
        result_1.pixels[destOff_1 + int64(1)] = byte(int64(this.pixels[(srcOff_1 + int64(1))]))
        result_1.pixels[destOff_1 + int64(2)] = byte(int64(this.pixels[(srcOff_1 + int64(2))]))
        result_1.pixels[destOff_1 + int64(3)] = byte(int64(this.pixels[(srcOff_1 + int64(3))]))
        x_1 = x_1 + int64(1); 
      }
      y_1 = y_1 + int64(1); 
    }
    return result_1
  }
  if  orientation == int64(5) {
    return this.transpose()
  }
  if  orientation == int64(6) {
    return this.rotate90CW()
  }
  if  orientation == int64(7) {
    return this.transverse()
  }
  if  orientation == int64(8) {
    return this.rotate270CW()
  }
  return this.scale(int64(1))
}
type PPMImage struct { 
}

func CreateNew_PPMImage() *PPMImage {
  me := new(PPMImage)
  return me;
}
func (this *PPMImage) parseNumber (data []byte, startPos int64, endPos []int64) int64 {
  var __len int64= int64(len(data));
  var pos int64= startPos;
  var skipping bool= true;
  for skipping && (pos < __len) {
    var ch int64= int64(data[pos]);
    if  (((ch == int64(32)) || (ch == int64(10))) || (ch == int64(13))) || (ch == int64(9)) {
      pos = pos + int64(1); 
    } else {
      skipping = false; 
    }
  }
  var value int64= int64(0);
  var parsing bool= true;
  for parsing && (pos < __len) {
    var ch_1 int64= int64(data[pos]);
    if  (ch_1 >= int64(48)) && (ch_1 <= int64(57)) {
      value = (value * int64(10)) + (ch_1 - int64(48)); 
      pos = pos + int64(1); 
    } else {
      parsing = false; 
    }
  }
  endPos[int64(0)] = pos;
  return value
}
func (this *PPMImage) skipToNextLine (data []byte, pos int64) int64 {
  var __len int64= int64(len(data));
  for pos < __len {
    var ch int64= int64(data[pos]);
    pos = pos + int64(1); 
    if  ch == int64(10) {
      return pos
    }
  }
  return pos
}
func (this *PPMImage) load (dirPath string, fileName string) *ImageBuffer {
  var data []byte= func() []byte { d, _ := os.ReadFile(filepath.Join(dirPath, fileName)); return d }();
  var __len int64= int64(len(data));
  if  __len < int64(10) {
    fmt.Println( "Error: File too small: " + fileName )
    var errImg *ImageBuffer= CreateNew_ImageBuffer();
    errImg.init(int64(1), int64(1));
    return errImg
  }
  var m1 int64= int64(data[int64(0)]);
  var m2 int64= int64(data[int64(1)]);
  if  (m1 != int64(80)) || ((m2 != int64(54)) && (m2 != int64(51))) {
    fmt.Println( "Error: Not a PPM file (P3 or P6): " + fileName )
    var errImg_1 *ImageBuffer= CreateNew_ImageBuffer();
    errImg_1.init(int64(1), int64(1));
    return errImg_1
  }
  var isBinary bool= m2 == int64(54);
  var pos int64= int64(2);
  var endPos []int64 = make([]int64, 0);
  endPos = append(endPos,int64(0)); 
  var skippingComments bool= true;
  for skippingComments && (pos < __len) {
    var ch int64= int64(data[pos]);
    if  (((ch == int64(32)) || (ch == int64(10))) || (ch == int64(13))) || (ch == int64(9)) {
      pos = pos + int64(1); 
    } else {
      if  ch == int64(35) {
        pos = this.skipToNextLine(data, pos); 
      } else {
        skippingComments = false; 
      }
    }
  }
  var width int64= this.parseNumber(data, pos, endPos);
  pos = endPos[int64(0)]; 
  var height int64= this.parseNumber(data, pos, endPos);
  pos = endPos[int64(0)]; 
  var maxVal int64= this.parseNumber(data, pos, endPos);
  pos = endPos[int64(0)]; 
  if  pos < __len {
    pos = pos + int64(1); 
  }
  fmt.Println( (((("Loading PPM: " + (strconv.FormatInt(width, 10))) + "x") + (strconv.FormatInt(height, 10))) + ", maxval=") + (strconv.FormatInt(maxVal, 10)) )
  var img *ImageBuffer= CreateNew_ImageBuffer();
  img.init(width, height);
  if  isBinary {
    var y int64= int64(0);
    for y < height {
      var x int64= int64(0);
      for x < width {
        if  (pos + int64(2)) < __len {
          var r int64= int64(data[pos]);
          var g int64= int64(data[(pos + int64(1))]);
          var b int64= int64(data[(pos + int64(2))]);
          img.setPixelRGB(x, y, r, g, b);
          pos = pos + int64(3); 
        }
        x = x + int64(1); 
      }
      y = y + int64(1); 
    }
  } else {
    var y_1 int64= int64(0);
    for y_1 < height {
      var x_1 int64= int64(0);
      for x_1 < width {
        var r_1 int64= this.parseNumber(data, pos, endPos);
        pos = endPos[int64(0)]; 
        var g_1 int64= this.parseNumber(data, pos, endPos);
        pos = endPos[int64(0)]; 
        var b_1 int64= this.parseNumber(data, pos, endPos);
        pos = endPos[int64(0)]; 
        img.setPixelRGB(x_1, y_1, r_1, g_1, b_1);
        x_1 = x_1 + int64(1); 
      }
      y_1 = y_1 + int64(1); 
    }
  }
  return img
}
func (this *PPMImage) save (img *ImageBuffer, dirPath string, fileName string) () {
  var buf *GrowableBuffer= CreateNew_GrowableBuffer();
  buf.writeString("P6\n");
  buf.writeString((((strconv.FormatInt(img.width, 10)) + " ") + (strconv.FormatInt(img.height, 10))) + "\n");
  buf.writeString("255\n");
  var y int64= int64(0);
  for y < img.height {
    var x int64= int64(0);
    for x < img.width {
      var c *Color= img.getPixel(x, y);
      buf.writeByte(c.r);
      buf.writeByte(c.g);
      buf.writeByte(c.b);
      x = x + int64(1); 
    }
    y = y + int64(1); 
  }
  var data []byte= buf.toBuffer();
  os.WriteFile(dirPath + "/" + fileName, data, 0644)
  fmt.Println( (("Saved PPM: " + dirPath) + "/") + fileName )
}
func (this *PPMImage) saveP3 (img *ImageBuffer, dirPath string, fileName string) () {
  var buf *GrowableBuffer= CreateNew_GrowableBuffer();
  buf.writeString("P3\n");
  buf.writeString("# Created by Ranger ImageEditor\n");
  buf.writeString((((strconv.FormatInt(img.width, 10)) + " ") + (strconv.FormatInt(img.height, 10))) + "\n");
  buf.writeString("255\n");
  var y int64= int64(0);
  for y < img.height {
    var x int64= int64(0);
    for x < img.width {
      var c *Color= img.getPixel(x, y);
      buf.writeString(((((strconv.FormatInt(c.r, 10)) + " ") + (strconv.FormatInt(c.g, 10))) + " ") + (strconv.FormatInt(c.b, 10)));
      if  x < (img.width - int64(1)) {
        buf.writeString("  ");
      }
      x = x + int64(1); 
    }
    buf.writeString("\n");
    y = y + int64(1); 
  }
  var data []byte= buf.toBuffer();
  os.WriteFile(dirPath + "/" + fileName, data, 0644)
  fmt.Println( (("Saved PPM (ASCII): " + dirPath) + "/") + fileName )
}
type JPEGComponent struct { 
  id int64 `json:"id"` 
  hSamp int64 `json:"hSamp"` 
  vSamp int64 `json:"vSamp"` 
  quantTableId int64 `json:"quantTableId"` 
  dcTableId int64 `json:"dcTableId"` 
  acTableId int64 `json:"acTableId"` 
  prevDC int64 `json:"prevDC"` 
}

func CreateNew_JPEGComponent() *JPEGComponent {
  me := new(JPEGComponent)
  me.id = int64(0)
  me.hSamp = int64(1)
  me.vSamp = int64(1)
  me.quantTableId = int64(0)
  me.dcTableId = int64(0)
  me.acTableId = int64(0)
  me.prevDC = int64(0)
  return me;
}
type QuantizationTable struct { 
  values []int64 `json:"values"` 
  id int64 `json:"id"` 
}

func CreateNew_QuantizationTable() *QuantizationTable {
  me := new(QuantizationTable)
  me.values = make([]int64,0)
  me.id = int64(0)
  var i_1 int64= int64(0);
  for i_1 < int64(64) {
    me.values = append(me.values,int64(1)); 
    i_1 = i_1 + int64(1); 
  }
  return me;
}
type JPEGDecoder struct { 
  data []byte `json:"data"` 
  dataLen int64 `json:"dataLen"` 
  width int64 `json:"width"` 
  height int64 `json:"height"` 
  numComponents int64 `json:"numComponents"` 
  precision int64 `json:"precision"` 
  components []*JPEGComponent `json:"components"` 
  quantTables []*QuantizationTable `json:"quantTables"` 
  huffman *GoNullable `json:"huffman"` 
  idct *GoNullable `json:"idct"` 
  scanDataStart int64 `json:"scanDataStart"` 
  scanDataLen int64 `json:"scanDataLen"` 
  mcuWidth int64 `json:"mcuWidth"` 
  mcuHeight int64 `json:"mcuHeight"` 
  mcusPerRow int64 `json:"mcusPerRow"` 
  mcusPerCol int64 `json:"mcusPerCol"` 
  maxHSamp int64 `json:"maxHSamp"` 
  maxVSamp int64 `json:"maxVSamp"` 
  restartInterval int64 `json:"restartInterval"` 
}

func CreateNew_JPEGDecoder() *JPEGDecoder {
  me := new(JPEGDecoder)
  me.data = 
  make([]byte, int64(0))
  
  me.dataLen = int64(0)
  me.width = int64(0)
  me.height = int64(0)
  me.numComponents = int64(0)
  me.precision = int64(8)
  me.components = make([]*JPEGComponent,0)
  me.quantTables = make([]*QuantizationTable,0)
  me.scanDataStart = int64(0)
  me.scanDataLen = int64(0)
  me.mcuWidth = int64(8)
  me.mcuHeight = int64(8)
  me.mcusPerRow = int64(0)
  me.mcusPerCol = int64(0)
  me.maxHSamp = int64(1)
  me.maxVSamp = int64(1)
  me.restartInterval = int64(0)
  me.huffman = new(GoNullable);
  me.idct = new(GoNullable);
  me.huffman.value = CreateNew_HuffmanDecoder();
  me.huffman.has_value = true; /* detected as non-optional */
  me.idct.value = CreateNew_IDCT();
  me.idct.has_value = true; /* detected as non-optional */
  var i_2 int64= int64(0);
  for i_2 < int64(4) {
    me.quantTables = append(me.quantTables,CreateNew_QuantizationTable()); 
    i_2 = i_2 + int64(1); 
  }
  return me;
}
func (this *JPEGDecoder) readUint16BE (pos int64) int64 {
  var high int64= int64(this.data[pos]);
  var low int64= int64(this.data[(pos + int64(1))]);
  return (high * int64(256)) + low
}
func (this *JPEGDecoder) parseSOF (pos int64, length int64) () {
  this.precision = int64(this.data[pos]); 
  this.height = this.readUint16BE((pos + int64(1))); 
  this.width = this.readUint16BE((pos + int64(3))); 
  this.numComponents = int64(this.data[(pos + int64(5))]); 
  fmt.Println( ((((("  Image: " + (strconv.FormatInt(this.width, 10))) + "x") + (strconv.FormatInt(this.height, 10))) + ", ") + (strconv.FormatInt(this.numComponents, 10))) + " components" )
  this.components = this.components[:0]
  this.maxHSamp = int64(1); 
  this.maxVSamp = int64(1); 
  var i int64= int64(0);
  var offset int64= pos + int64(6);
  for i < this.numComponents {
    var comp *JPEGComponent= CreateNew_JPEGComponent();
    comp.id = int64(this.data[offset]); 
    var sampling int64= int64(this.data[(offset + int64(1))]);
    comp.hSamp = int64(sampling >> uint(int64(4))); 
    comp.vSamp = int64(sampling & int64(15)); 
    comp.quantTableId = int64(this.data[(offset + int64(2))]); 
    if  comp.hSamp > this.maxHSamp {
      this.maxHSamp = comp.hSamp; 
    }
    if  comp.vSamp > this.maxVSamp {
      this.maxVSamp = comp.vSamp; 
    }
    this.components = append(this.components,comp); 
    fmt.Println( (((((("    Component " + (strconv.FormatInt(comp.id, 10))) + ": ") + (strconv.FormatInt(comp.hSamp, 10))) + "x") + (strconv.FormatInt(comp.vSamp, 10))) + " sampling, quant table ") + (strconv.FormatInt(comp.quantTableId, 10)) )
    offset = offset + int64(3); 
    i = i + int64(1); 
  }
  this.mcuWidth = this.maxHSamp * int64(8); 
  this.mcuHeight = this.maxVSamp * int64(8); 
  this.mcusPerRow = int64((float64(((this.width + this.mcuWidth) - int64(1))) / float64(this.mcuWidth))); 
  this.mcusPerCol = int64((float64(((this.height + this.mcuHeight) - int64(1))) / float64(this.mcuHeight))); 
  fmt.Println( (((((("  MCU size: " + (strconv.FormatInt(this.mcuWidth, 10))) + "x") + (strconv.FormatInt(this.mcuHeight, 10))) + ", grid: ") + (strconv.FormatInt(this.mcusPerRow, 10))) + "x") + (strconv.FormatInt(this.mcusPerCol, 10)) )
}
func (this *JPEGDecoder) parseDQT (pos int64, length int64) () {
  var endPos int64= pos + length;
  for pos < endPos {
    var info int64= int64(this.data[pos]);
    pos = pos + int64(1); 
    var precision_1 int64= int64(info >> uint(int64(4)));
    var tableId int64= int64(info & int64(15));
    var table *QuantizationTable= this.quantTables[tableId];
    table.id = tableId; 
    table.values = table.values[:0]
    var i int64= int64(0);
    for i < int64(64) {
      if  precision_1 == int64(0) {
        table.values = append(table.values,int64(this.data[pos])); 
        pos = pos + int64(1); 
      } else {
        table.values = append(table.values,this.readUint16BE(pos)); 
        pos = pos + int64(2); 
      }
      i = i + int64(1); 
    }
    fmt.Println( ((("  Quantization table " + (strconv.FormatInt(tableId, 10))) + " (") + (strconv.FormatInt((precision_1 + int64(1)), 10))) + "-byte values)" )
  }
}
func (this *JPEGDecoder) parseSOS (pos int64, length int64) () {
  var numScanComponents int64= int64(this.data[pos]);
  pos = pos + int64(1); 
  var i int64= int64(0);
  for i < numScanComponents {
    var compId int64= int64(this.data[pos]);
    var tableSelect int64= int64(this.data[(pos + int64(1))]);
    pos = pos + int64(2); 
    var j int64= int64(0);
    for j < this.numComponents {
      var comp *JPEGComponent= this.components[j];
      if  comp.id == compId {
        comp.dcTableId = int64(tableSelect >> uint(int64(4))); 
        comp.acTableId = int64(tableSelect & int64(15)); 
        fmt.Println( (((("    Component " + (strconv.FormatInt(compId, 10))) + ": DC table ") + (strconv.FormatInt(comp.dcTableId, 10))) + ", AC table ") + (strconv.FormatInt(comp.acTableId, 10)) )
      }
      j = j + int64(1); 
    }
    i = i + int64(1); 
  }
  pos = pos + int64(3); 
  this.scanDataStart = pos; 
  var searchPos int64= pos;
  for searchPos < (this.dataLen - int64(1)) {
    var b int64= int64(this.data[searchPos]);
    if  b == int64(255) {
      var nextB int64= int64(this.data[(searchPos + int64(1))]);
      if  (nextB != int64(0)) && (nextB != int64(255)) {
        if  (nextB >= int64(208)) && (nextB <= int64(215)) {
          searchPos = searchPos + int64(2); 
          continue;
        }
        this.scanDataLen = searchPos - this.scanDataStart; 
        return
      }
    }
    searchPos = searchPos + int64(1); 
  }
  this.scanDataLen = this.dataLen - this.scanDataStart; 
}
func (this *JPEGDecoder) parseMarkers () bool {
  var pos int64= int64(0);
  if  this.dataLen < int64(2) {
    fmt.Println( "Error: File too small" )
    return false
  }
  var m1 int64= int64(this.data[int64(0)]);
  var m2 int64= int64(this.data[int64(1)]);
  if  (m1 != int64(255)) || (m2 != int64(216)) {
    fmt.Println( "Error: Not a JPEG file (missing SOI)" )
    return false
  }
  pos = int64(2); 
  fmt.Println( "Parsing JPEG markers..." )
  for pos < (this.dataLen - int64(1)) {
    var marker1 int64= int64(this.data[pos]);
    if  marker1 != int64(255) {
      pos = pos + int64(1); 
      continue;
    }
    var marker2 int64= int64(this.data[(pos + int64(1))]);
    if  marker2 == int64(255) {
      pos = pos + int64(1); 
      continue;
    }
    if  marker2 == int64(0) {
      pos = pos + int64(2); 
      continue;
    }
    if  marker2 == int64(216) {
      pos = pos + int64(2); 
      continue;
    }
    if  marker2 == int64(217) {
      fmt.Println( "  End of Image" )
      return true
    }
    if  (marker2 >= int64(208)) && (marker2 <= int64(215)) {
      pos = pos + int64(2); 
      continue;
    }
    if  (pos + int64(4)) > this.dataLen {
      return true
    }
    var markerLen int64= this.readUint16BE((pos + int64(2)));
    var dataStart int64= pos + int64(4);
    var markerDataLen int64= markerLen - int64(2);
    if  marker2 == int64(192) {
      fmt.Println( "  SOF0 (Baseline DCT)" )
      this.parseSOF(dataStart, markerDataLen);
    }
    if  marker2 == int64(193) {
      fmt.Println( "  SOF1 (Extended Sequential DCT)" )
      this.parseSOF(dataStart, markerDataLen);
    }
    if  marker2 == int64(194) {
      fmt.Println( "  SOF2 (Progressive DCT) - NOT SUPPORTED" )
      return false
    }
    if  marker2 == int64(196) {
      fmt.Println( "  DHT (Huffman Tables)" )
      this.huffman.value.(*HuffmanDecoder).parseDHT(this.data, dataStart, markerDataLen);
    }
    if  marker2 == int64(219) {
      fmt.Println( "  DQT (Quantization Tables)" )
      this.parseDQT(dataStart, markerDataLen);
    }
    if  marker2 == int64(221) {
      this.restartInterval = this.readUint16BE(dataStart); 
      fmt.Println( ("  DRI (Restart Interval: " + (strconv.FormatInt(this.restartInterval, 10))) + ")" )
    }
    if  marker2 == int64(218) {
      fmt.Println( "  SOS (Start of Scan)" )
      this.parseSOS(dataStart, markerDataLen);
      pos = this.scanDataStart + this.scanDataLen; 
      continue;
    }
    if  marker2 == int64(224) {
      fmt.Println( "  APP0 (JFIF)" )
    }
    if  marker2 == int64(225) {
      fmt.Println( "  APP1 (EXIF)" )
    }
    if  marker2 == int64(254) {
      fmt.Println( "  COM (Comment)" )
    }
    pos = (pos + int64(2)) + markerLen; 
  }
  return true
}
func (this *JPEGDecoder) decodeBlock (reader *BitReader, comp *JPEGComponent, quantTable *QuantizationTable) []int64 {
  var coeffs []int64= make([]int64, int64(64));
  for i := int64(0); i < int64(64); i++ { coeffs[i] = int64(0) }
  var dcTable *HuffmanTable= this.huffman.value.(*HuffmanDecoder).getDCTable(comp.dcTableId);
  var dcCategory int64= dcTable.decode(reader);
  var dcDiff int64= reader.receiveExtend(dcCategory);
  var dcValue int64= comp.prevDC + dcDiff;
  comp.prevDC = dcValue; 
  var dcQuant int64= quantTable.values[int64(0)];
  coeffs[int64(0)] = dcValue * dcQuant
  var acTable *HuffmanTable= this.huffman.value.(*HuffmanDecoder).getACTable(comp.acTableId);
  var k int64= int64(1);
  for k < int64(64) {
    var acSymbol int64= acTable.decode(reader);
    if  acSymbol == int64(0) {
      k = int64(64); 
    } else {
      var runLength int64= int64(acSymbol >> uint(int64(4)));
      var acCategory int64= int64(acSymbol & int64(15));
      if  acSymbol == int64(240) {
        k = k + int64(16); 
      } else {
        k = k + runLength; 
        if  k < int64(64) {
          var acValue int64= reader.receiveExtend(acCategory);
          var acQuant int64= quantTable.values[k];
          coeffs[k] = acValue * acQuant
          k = k + int64(1); 
        }
      }
    }
  }
  return coeffs
}
func (this *JPEGDecoder) decode (dirPath string, fileName string) *ImageBuffer {
  this.data = func() []byte { d, _ := os.ReadFile(filepath.Join(dirPath, fileName)); return d }(); 
  this.dataLen = int64(len(this.data)); 
  fmt.Println( ((("Decoding JPEG: " + fileName) + " (") + (strconv.FormatInt(this.dataLen, 10))) + " bytes)" )
  var ok bool= this.parseMarkers();
  if  ok == false {
    fmt.Println( "Error parsing JPEG markers" )
    var errImg *ImageBuffer= CreateNew_ImageBuffer();
    errImg.init(int64(1), int64(1));
    return errImg
  }
  if  (this.width == int64(0)) || (this.height == int64(0)) {
    fmt.Println( "Error: Invalid image dimensions" )
    var errImg_1 *ImageBuffer= CreateNew_ImageBuffer();
    errImg_1.init(int64(1), int64(1));
    return errImg_1
  }
  fmt.Println( ("Decoding " + (strconv.FormatInt(this.scanDataLen, 10))) + " bytes of scan data..." )
  var img *ImageBuffer= CreateNew_ImageBuffer();
  img.init(this.width, this.height);
  var reader *BitReader= CreateNew_BitReader();
  reader.init(this.data, this.scanDataStart, this.scanDataLen);
  var c int64= int64(0);
  for c < this.numComponents {
    var comp *JPEGComponent= this.components[c];
    comp.prevDC = int64(0); 
    c = c + int64(1); 
  }
  var yBlocksData []int64 = make([]int64, 0);
  var yBlockCount int64= int64(0);
  var cbBlock []int64 = make([]int64, 0);
  var crBlock []int64 = make([]int64, 0);
  var mcuCount int64= int64(0);
  var mcuY int64= int64(0);
  for mcuY < this.mcusPerCol {
    var mcuX int64= int64(0);
    for mcuX < this.mcusPerRow {
      if  ((this.restartInterval > int64(0)) && (mcuCount > int64(0))) && ((mcuCount % this.restartInterval) == int64(0)) {
        c = int64(0); 
        for c < this.numComponents {
          var compRst *JPEGComponent= this.components[c];
          compRst.prevDC = int64(0); 
          c = c + int64(1); 
        }
        reader.alignToByte();
      }
      yBlocksData = yBlocksData[:0]
      yBlockCount = int64(0); 
      var compIdx int64= int64(0);
      for compIdx < this.numComponents {
        var comp_1 *JPEGComponent= this.components[compIdx];
        var quantTable *QuantizationTable= this.quantTables[comp_1.quantTableId];
        var blockV int64= int64(0);
        for blockV < comp_1.vSamp {
          var blockH int64= int64(0);
          for blockH < comp_1.hSamp {
            var coeffs []int64= this.decodeBlock(reader, comp_1, quantTable);
            var blockPixels []int64= make([]int64, int64(64));
            for i := int64(0); i < int64(64); i++ { blockPixels[i] = int64(0) }
            var tempBlock []int64= this.idct.value.(*IDCT).dezigzag(coeffs);
            this.idct.value.(*IDCT).transform(tempBlock, blockPixels);
            if  compIdx == int64(0) {
              var bi int64= int64(0);
              for bi < int64(64) {
                yBlocksData = append(yBlocksData,blockPixels[bi]); 
                bi = bi + int64(1); 
              }
              yBlockCount = yBlockCount + int64(1); 
            }
            if  compIdx == int64(1) {
              cbBlock = cbBlock[:0]
              var bi_1 int64= int64(0);
              for bi_1 < int64(64) {
                cbBlock = append(cbBlock,blockPixels[bi_1]); 
                bi_1 = bi_1 + int64(1); 
              }
            }
            if  compIdx == int64(2) {
              crBlock = crBlock[:0]
              var bi_2 int64= int64(0);
              for bi_2 < int64(64) {
                crBlock = append(crBlock,blockPixels[bi_2]); 
                bi_2 = bi_2 + int64(1); 
              }
            }
            blockH = blockH + int64(1); 
          }
          blockV = blockV + int64(1); 
        }
        compIdx = compIdx + int64(1); 
      }
      this.writeMCU(img, mcuX, mcuY, yBlocksData, yBlockCount, cbBlock, crBlock);
      mcuX = mcuX + int64(1); 
      mcuCount = mcuCount + int64(1); 
    }
    mcuY = mcuY + int64(1); 
    if  (mcuY % int64(10)) == int64(0) {
      fmt.Println( (("  Row " + (strconv.FormatInt(mcuY, 10))) + "/") + (strconv.FormatInt(this.mcusPerCol, 10)) )
    }
  }
  fmt.Println( "Decode complete!" )
  return img
}
func (this *JPEGDecoder) writeMCU (img *ImageBuffer, mcuX int64, mcuY int64, yBlocksData []int64, yBlockCount int64, cbBlock []int64, crBlock []int64) () {
  var baseX int64= mcuX * this.mcuWidth;
  var baseY int64= mcuY * this.mcuHeight;
  /** unused:  comp0*/
  if  (this.maxHSamp == int64(1)) && (this.maxVSamp == int64(1)) {
    var py int64= int64(0);
    for py < int64(8) {
      var px int64= int64(0);
      for px < int64(8) {
        var imgX int64= baseX + px;
        var imgY int64= baseY + py;
        if  (imgX < this.width) && (imgY < this.height) {
          var idx int64= (py * int64(8)) + px;
          var y int64= yBlocksData[idx];
          var cb int64= int64(128);
          var cr int64= int64(128);
          if  this.numComponents >= int64(3) {
            cb = cbBlock[idx]; 
            cr = crBlock[idx]; 
          }
          var r int64= y + (int64((int64(359) * (cr - int64(128))) >> uint(int64(8))));
          var g int64= (y - (int64((int64(88) * (cb - int64(128))) >> uint(int64(8))))) - (int64((int64(183) * (cr - int64(128))) >> uint(int64(8))));
          var b int64= y + (int64((int64(454) * (cb - int64(128))) >> uint(int64(8))));
          if  r < int64(0) {
            r = int64(0); 
          }
          if  r > int64(255) {
            r = int64(255); 
          }
          if  g < int64(0) {
            g = int64(0); 
          }
          if  g > int64(255) {
            g = int64(255); 
          }
          if  b < int64(0) {
            b = int64(0); 
          }
          if  b > int64(255) {
            b = int64(255); 
          }
          img.setPixelRGB(imgX, imgY, r, g, b);
        }
        px = px + int64(1); 
      }
      py = py + int64(1); 
    }
    return
  }
  if  (this.maxHSamp == int64(2)) && (this.maxVSamp == int64(2)) {
    var blockIdx int64= int64(0);
    var blockY int64= int64(0);
    for blockY < int64(2) {
      var blockX int64= int64(0);
      for blockX < int64(2) {
        var yBlockOffset int64= blockIdx * int64(64);
        var py_1 int64= int64(0);
        for py_1 < int64(8) {
          var px_1 int64= int64(0);
          for px_1 < int64(8) {
            var imgX_1 int64= (baseX + (blockX * int64(8))) + px_1;
            var imgY_1 int64= (baseY + (blockY * int64(8))) + py_1;
            if  (imgX_1 < this.width) && (imgY_1 < this.height) {
              var yIdx int64= (yBlockOffset + (py_1 * int64(8))) + px_1;
              var y_1 int64= yBlocksData[yIdx];
              var chromaX int64= (blockX * int64(4)) + (int64(px_1 >> uint(int64(1))));
              var chromaY int64= (blockY * int64(4)) + (int64(py_1 >> uint(int64(1))));
              var chromaIdx int64= (chromaY * int64(8)) + chromaX;
              var cb_1 int64= int64(128);
              var cr_1 int64= int64(128);
              if  this.numComponents >= int64(3) {
                cb_1 = cbBlock[chromaIdx]; 
                cr_1 = crBlock[chromaIdx]; 
              }
              var r_1 int64= y_1 + (int64((int64(359) * (cr_1 - int64(128))) >> uint(int64(8))));
              var g_1 int64= (y_1 - (int64((int64(88) * (cb_1 - int64(128))) >> uint(int64(8))))) - (int64((int64(183) * (cr_1 - int64(128))) >> uint(int64(8))));
              var b_1 int64= y_1 + (int64((int64(454) * (cb_1 - int64(128))) >> uint(int64(8))));
              if  r_1 < int64(0) {
                r_1 = int64(0); 
              }
              if  r_1 > int64(255) {
                r_1 = int64(255); 
              }
              if  g_1 < int64(0) {
                g_1 = int64(0); 
              }
              if  g_1 > int64(255) {
                g_1 = int64(255); 
              }
              if  b_1 < int64(0) {
                b_1 = int64(0); 
              }
              if  b_1 > int64(255) {
                b_1 = int64(255); 
              }
              img.setPixelRGB(imgX_1, imgY_1, r_1, g_1, b_1);
            }
            px_1 = px_1 + int64(1); 
          }
          py_1 = py_1 + int64(1); 
        }
        blockIdx = blockIdx + int64(1); 
        blockX = blockX + int64(1); 
      }
      blockY = blockY + int64(1); 
    }
    return
  }
  if  (this.maxHSamp == int64(2)) && (this.maxVSamp == int64(1)) {
    var blockX_1 int64= int64(0);
    for blockX_1 < int64(2) {
      var yBlockOffset_1 int64= blockX_1 * int64(64);
      var py_2 int64= int64(0);
      for py_2 < int64(8) {
        var px_2 int64= int64(0);
        for px_2 < int64(8) {
          var imgX_2 int64= (baseX + (blockX_1 * int64(8))) + px_2;
          var imgY_2 int64= baseY + py_2;
          if  (imgX_2 < this.width) && (imgY_2 < this.height) {
            var yIdx_1 int64= (yBlockOffset_1 + (py_2 * int64(8))) + px_2;
            var y_2 int64= yBlocksData[yIdx_1];
            var chromaX_1 int64= (blockX_1 * int64(4)) + (int64(px_2 >> uint(int64(1))));
            var chromaY_1 int64= py_2;
            var chromaIdx_1 int64= (chromaY_1 * int64(8)) + chromaX_1;
            var cb_2 int64= int64(128);
            var cr_2 int64= int64(128);
            if  this.numComponents >= int64(3) {
              cb_2 = cbBlock[chromaIdx_1]; 
              cr_2 = crBlock[chromaIdx_1]; 
            }
            var r_2 int64= y_2 + (int64((int64(359) * (cr_2 - int64(128))) >> uint(int64(8))));
            var g_2 int64= (y_2 - (int64((int64(88) * (cb_2 - int64(128))) >> uint(int64(8))))) - (int64((int64(183) * (cr_2 - int64(128))) >> uint(int64(8))));
            var b_2 int64= y_2 + (int64((int64(454) * (cb_2 - int64(128))) >> uint(int64(8))));
            if  r_2 < int64(0) {
              r_2 = int64(0); 
            }
            if  r_2 > int64(255) {
              r_2 = int64(255); 
            }
            if  g_2 < int64(0) {
              g_2 = int64(0); 
            }
            if  g_2 > int64(255) {
              g_2 = int64(255); 
            }
            if  b_2 < int64(0) {
              b_2 = int64(0); 
            }
            if  b_2 > int64(255) {
              b_2 = int64(255); 
            }
            img.setPixelRGB(imgX_2, imgY_2, r_2, g_2, b_2);
          }
          px_2 = px_2 + int64(1); 
        }
        py_2 = py_2 + int64(1); 
      }
      blockX_1 = blockX_1 + int64(1); 
    }
    return
  }
  if  yBlockCount > int64(0) {
    var py_3 int64= int64(0);
    for py_3 < int64(8) {
      var px_3 int64= int64(0);
      for px_3 < int64(8) {
        var imgX_3 int64= baseX + px_3;
        var imgY_3 int64= baseY + py_3;
        if  (imgX_3 < this.width) && (imgY_3 < this.height) {
          var y_3 int64= yBlocksData[((py_3 * int64(8)) + px_3)];
          img.setPixelRGB(imgX_3, imgY_3, y_3, y_3, y_3);
        }
        px_3 = px_3 + int64(1); 
      }
      py_3 = py_3 + int64(1); 
    }
  }
}
type FDCT struct { 
  cosTable []int64 `json:"cosTable"` 
  zigzagOrder []int64 `json:"zigzagOrder"` 
}

func CreateNew_FDCT() *FDCT {
  me := new(FDCT)
  me.cosTable = 
  make([]int64, int64(64))
  
  me.zigzagOrder = 
  make([]int64, int64(64))
  
  me.cosTable[int64(0)] = int64(1024)
  me.cosTable[int64(1)] = int64(1004)
  me.cosTable[int64(2)] = int64(946)
  me.cosTable[int64(3)] = int64(851)
  me.cosTable[int64(4)] = int64(724)
  me.cosTable[int64(5)] = int64(569)
  me.cosTable[int64(6)] = int64(392)
  me.cosTable[int64(7)] = int64(200)
  me.cosTable[int64(8)] = int64(1024)
  me.cosTable[int64(9)] = int64(851)
  me.cosTable[int64(10)] = int64(392)
  me.cosTable[int64(11)] = int64(-200)
  me.cosTable[int64(12)] = int64(-724)
  me.cosTable[int64(13)] = int64(-1004)
  me.cosTable[int64(14)] = int64(-946)
  me.cosTable[int64(15)] = int64(-569)
  me.cosTable[int64(16)] = int64(1024)
  me.cosTable[int64(17)] = int64(569)
  me.cosTable[int64(18)] = int64(-392)
  me.cosTable[int64(19)] = int64(-1004)
  me.cosTable[int64(20)] = int64(-724)
  me.cosTable[int64(21)] = int64(200)
  me.cosTable[int64(22)] = int64(946)
  me.cosTable[int64(23)] = int64(851)
  me.cosTable[int64(24)] = int64(1024)
  me.cosTable[int64(25)] = int64(200)
  me.cosTable[int64(26)] = int64(-946)
  me.cosTable[int64(27)] = int64(-569)
  me.cosTable[int64(28)] = int64(724)
  me.cosTable[int64(29)] = int64(851)
  me.cosTable[int64(30)] = int64(-392)
  me.cosTable[int64(31)] = int64(-1004)
  me.cosTable[int64(32)] = int64(1024)
  me.cosTable[int64(33)] = int64(-200)
  me.cosTable[int64(34)] = int64(-946)
  me.cosTable[int64(35)] = int64(569)
  me.cosTable[int64(36)] = int64(724)
  me.cosTable[int64(37)] = int64(-851)
  me.cosTable[int64(38)] = int64(-392)
  me.cosTable[int64(39)] = int64(1004)
  me.cosTable[int64(40)] = int64(1024)
  me.cosTable[int64(41)] = int64(-569)
  me.cosTable[int64(42)] = int64(-392)
  me.cosTable[int64(43)] = int64(1004)
  me.cosTable[int64(44)] = int64(-724)
  me.cosTable[int64(45)] = int64(-200)
  me.cosTable[int64(46)] = int64(946)
  me.cosTable[int64(47)] = int64(-851)
  me.cosTable[int64(48)] = int64(1024)
  me.cosTable[int64(49)] = int64(-851)
  me.cosTable[int64(50)] = int64(392)
  me.cosTable[int64(51)] = int64(200)
  me.cosTable[int64(52)] = int64(-724)
  me.cosTable[int64(53)] = int64(1004)
  me.cosTable[int64(54)] = int64(-946)
  me.cosTable[int64(55)] = int64(569)
  me.cosTable[int64(56)] = int64(1024)
  me.cosTable[int64(57)] = int64(-1004)
  me.cosTable[int64(58)] = int64(946)
  me.cosTable[int64(59)] = int64(-851)
  me.cosTable[int64(60)] = int64(724)
  me.cosTable[int64(61)] = int64(-569)
  me.cosTable[int64(62)] = int64(392)
  me.cosTable[int64(63)] = int64(-200)
  me.zigzagOrder[int64(0)] = int64(0)
  me.zigzagOrder[int64(1)] = int64(1)
  me.zigzagOrder[int64(2)] = int64(8)
  me.zigzagOrder[int64(3)] = int64(16)
  me.zigzagOrder[int64(4)] = int64(9)
  me.zigzagOrder[int64(5)] = int64(2)
  me.zigzagOrder[int64(6)] = int64(3)
  me.zigzagOrder[int64(7)] = int64(10)
  me.zigzagOrder[int64(8)] = int64(17)
  me.zigzagOrder[int64(9)] = int64(24)
  me.zigzagOrder[int64(10)] = int64(32)
  me.zigzagOrder[int64(11)] = int64(25)
  me.zigzagOrder[int64(12)] = int64(18)
  me.zigzagOrder[int64(13)] = int64(11)
  me.zigzagOrder[int64(14)] = int64(4)
  me.zigzagOrder[int64(15)] = int64(5)
  me.zigzagOrder[int64(16)] = int64(12)
  me.zigzagOrder[int64(17)] = int64(19)
  me.zigzagOrder[int64(18)] = int64(26)
  me.zigzagOrder[int64(19)] = int64(33)
  me.zigzagOrder[int64(20)] = int64(40)
  me.zigzagOrder[int64(21)] = int64(48)
  me.zigzagOrder[int64(22)] = int64(41)
  me.zigzagOrder[int64(23)] = int64(34)
  me.zigzagOrder[int64(24)] = int64(27)
  me.zigzagOrder[int64(25)] = int64(20)
  me.zigzagOrder[int64(26)] = int64(13)
  me.zigzagOrder[int64(27)] = int64(6)
  me.zigzagOrder[int64(28)] = int64(7)
  me.zigzagOrder[int64(29)] = int64(14)
  me.zigzagOrder[int64(30)] = int64(21)
  me.zigzagOrder[int64(31)] = int64(28)
  me.zigzagOrder[int64(32)] = int64(35)
  me.zigzagOrder[int64(33)] = int64(42)
  me.zigzagOrder[int64(34)] = int64(49)
  me.zigzagOrder[int64(35)] = int64(56)
  me.zigzagOrder[int64(36)] = int64(57)
  me.zigzagOrder[int64(37)] = int64(50)
  me.zigzagOrder[int64(38)] = int64(43)
  me.zigzagOrder[int64(39)] = int64(36)
  me.zigzagOrder[int64(40)] = int64(29)
  me.zigzagOrder[int64(41)] = int64(22)
  me.zigzagOrder[int64(42)] = int64(15)
  me.zigzagOrder[int64(43)] = int64(23)
  me.zigzagOrder[int64(44)] = int64(30)
  me.zigzagOrder[int64(45)] = int64(37)
  me.zigzagOrder[int64(46)] = int64(44)
  me.zigzagOrder[int64(47)] = int64(51)
  me.zigzagOrder[int64(48)] = int64(58)
  me.zigzagOrder[int64(49)] = int64(59)
  me.zigzagOrder[int64(50)] = int64(52)
  me.zigzagOrder[int64(51)] = int64(45)
  me.zigzagOrder[int64(52)] = int64(38)
  me.zigzagOrder[int64(53)] = int64(31)
  me.zigzagOrder[int64(54)] = int64(39)
  me.zigzagOrder[int64(55)] = int64(46)
  me.zigzagOrder[int64(56)] = int64(53)
  me.zigzagOrder[int64(57)] = int64(60)
  me.zigzagOrder[int64(58)] = int64(61)
  me.zigzagOrder[int64(59)] = int64(54)
  me.zigzagOrder[int64(60)] = int64(47)
  me.zigzagOrder[int64(61)] = int64(55)
  me.zigzagOrder[int64(62)] = int64(62)
  me.zigzagOrder[int64(63)] = int64(63)
  return me;
}
func (this *FDCT) dct1d (input []int64, startIdx int64, stride int64, output []int64, outIdx int64, outStride int64) () {
  var u int64= int64(0);
  for u < int64(8) {
    var sum int64= int64(0);
    var x int64= int64(0);
    for x < int64(8) {
      var pixel int64= input[(startIdx + (x * stride))];
      var cosVal int64= this.cosTable[((x * int64(8)) + u)];
      sum = sum + (pixel * cosVal); 
      x = x + int64(1); 
    }
    if  u == int64(0) {
      sum = int64((sum * int64(724)) >> uint(int64(10))); 
    }
    output[outIdx + (u * outStride)] = int64(sum >> uint(int64(11)))
    u = u + int64(1); 
  }
}
func (this *FDCT) transform (pixels []int64) []int64 {
  var shifted []int64= make([]int64, int64(64));
  var i int64= int64(0);
  for i < int64(64) {
    shifted[i] = (pixels[i]) - int64(128)
    i = i + int64(1); 
  }
  var temp []int64= make([]int64, int64(64));
  var row int64= int64(0);
  for row < int64(8) {
    var rowStart int64= row * int64(8);
    this.dct1d(shifted, rowStart, int64(1), temp, rowStart, int64(1));
    row = row + int64(1); 
  }
  var coeffs []int64= make([]int64, int64(64));
  var col int64= int64(0);
  for col < int64(8) {
    this.dct1d(temp, col, int64(8), coeffs, col, int64(8));
    col = col + int64(1); 
  }
  return coeffs
}
func (this *FDCT) zigzag (block []int64) []int64 {
  var zigzagOut []int64= make([]int64, int64(64));
  var i int64= int64(0);
  for i < int64(64) {
    var pos int64= this.zigzagOrder[i];
    zigzagOut[i] = block[pos]
    i = i + int64(1); 
  }
  return zigzagOut
}
type BitWriter struct { 
  buffer *GrowableBuffer `json:"buffer"` 
  bitBuffer int64 `json:"bitBuffer"` 
  bitCount int64 `json:"bitCount"` 
}

func CreateNew_BitWriter() *BitWriter {
  me := new(BitWriter)
  me.buffer = CreateNew_GrowableBuffer()
  me.bitBuffer = int64(0)
  me.bitCount = int64(0)
  return me;
}
func (this *BitWriter) writeBit (bit int64) () {
  this.bitBuffer = int64(this.bitBuffer << uint(int64(1))); 
  this.bitBuffer = int64(this.bitBuffer | (int64(bit & int64(1)))); 
  this.bitCount = this.bitCount + int64(1); 
  if  this.bitCount == int64(8) {
    this.flushByte();
  }
}
func (this *BitWriter) writeBits (value int64, numBits int64) () {
  var i int64= numBits - int64(1);
  for i >= int64(0) {
    var bit int64= int64((int64(value >> uint(i))) & int64(1));
    this.writeBit(bit);
    i = i - int64(1); 
  }
}
func (this *BitWriter) flushByte () () {
  if  this.bitCount > int64(0) {
    for this.bitCount < int64(8) {
      this.bitBuffer = int64(this.bitBuffer << uint(int64(1))); 
      this.bitBuffer = int64(this.bitBuffer | int64(1)); 
      this.bitCount = this.bitCount + int64(1); 
    }
    this.buffer.writeByte(this.bitBuffer);
    if  this.bitBuffer == int64(255) {
      this.buffer.writeByte(int64(0));
    }
    this.bitBuffer = int64(0); 
    this.bitCount = int64(0); 
  }
}
func (this *BitWriter) writeByte (b int64) () {
  this.flushByte();
  this.buffer.writeByte(b);
}
func (this *BitWriter) writeWord (w int64) () {
  this.writeByte(int64(w >> uint(int64(8))));
  this.writeByte(int64(w & int64(255)));
}
func (this *BitWriter) getBuffer () []byte {
  this.flushByte();
  return this.buffer.toBuffer()
}
func (this *BitWriter) getLength () int64 {
  return (this.buffer).size()
}
type JPEGEncoder struct { 
  fdct *GoNullable `json:"fdct"` 
  quality int64 `json:"quality"` 
  yQuantTable []int64 `json:"yQuantTable"` 
  cQuantTable []int64 `json:"cQuantTable"` 
  stdYQuant []int64 `json:"stdYQuant"` 
  stdCQuant []int64 `json:"stdCQuant"` 
  dcYBits []int64 `json:"dcYBits"` 
  dcYValues []int64 `json:"dcYValues"` 
  acYBits []int64 `json:"acYBits"` 
  acYValues []int64 `json:"acYValues"` 
  dcCBits []int64 `json:"dcCBits"` 
  dcCValues []int64 `json:"dcCValues"` 
  acCBits []int64 `json:"acCBits"` 
  acCValues []int64 `json:"acCValues"` 
  dcYCodes []int64 `json:"dcYCodes"` 
  dcYLengths []int64 `json:"dcYLengths"` 
  acYCodes []int64 `json:"acYCodes"` 
  acYLengths []int64 `json:"acYLengths"` 
  dcCCodes []int64 `json:"dcCCodes"` 
  dcCLengths []int64 `json:"dcCLengths"` 
  acCCodes []int64 `json:"acCCodes"` 
  acCLengths []int64 `json:"acCLengths"` 
  prevDCY int64 `json:"prevDCY"` 
  prevDCCb int64 `json:"prevDCCb"` 
  prevDCCr int64 `json:"prevDCCr"` 
}

func CreateNew_JPEGEncoder() *JPEGEncoder {
  me := new(JPEGEncoder)
  me.quality = int64(75)
  me.yQuantTable = make([]int64,0)
  me.cQuantTable = make([]int64,0)
  me.stdYQuant = make([]int64,0)
  me.stdCQuant = make([]int64,0)
  me.dcYBits = make([]int64,0)
  me.dcYValues = make([]int64,0)
  me.acYBits = make([]int64,0)
  me.acYValues = make([]int64,0)
  me.dcCBits = make([]int64,0)
  me.dcCValues = make([]int64,0)
  me.acCBits = make([]int64,0)
  me.acCValues = make([]int64,0)
  me.dcYCodes = make([]int64,0)
  me.dcYLengths = make([]int64,0)
  me.acYCodes = make([]int64,0)
  me.acYLengths = make([]int64,0)
  me.dcCCodes = make([]int64,0)
  me.dcCLengths = make([]int64,0)
  me.acCCodes = make([]int64,0)
  me.acCLengths = make([]int64,0)
  me.prevDCY = int64(0)
  me.prevDCCb = int64(0)
  me.prevDCCr = int64(0)
  me.fdct = new(GoNullable);
  me.fdct.value = CreateNew_FDCT();
  me.fdct.has_value = true; /* detected as non-optional */
  me.initQuantTables();
  me.initHuffmanTables();
  return me;
}
func (this *JPEGEncoder) initQuantTables () () {
  this.stdYQuant = append(this.stdYQuant,int64(16)); 
  this.stdYQuant = append(this.stdYQuant,int64(11)); 
  this.stdYQuant = append(this.stdYQuant,int64(10)); 
  this.stdYQuant = append(this.stdYQuant,int64(16)); 
  this.stdYQuant = append(this.stdYQuant,int64(24)); 
  this.stdYQuant = append(this.stdYQuant,int64(40)); 
  this.stdYQuant = append(this.stdYQuant,int64(51)); 
  this.stdYQuant = append(this.stdYQuant,int64(61)); 
  this.stdYQuant = append(this.stdYQuant,int64(12)); 
  this.stdYQuant = append(this.stdYQuant,int64(12)); 
  this.stdYQuant = append(this.stdYQuant,int64(14)); 
  this.stdYQuant = append(this.stdYQuant,int64(19)); 
  this.stdYQuant = append(this.stdYQuant,int64(26)); 
  this.stdYQuant = append(this.stdYQuant,int64(58)); 
  this.stdYQuant = append(this.stdYQuant,int64(60)); 
  this.stdYQuant = append(this.stdYQuant,int64(55)); 
  this.stdYQuant = append(this.stdYQuant,int64(14)); 
  this.stdYQuant = append(this.stdYQuant,int64(13)); 
  this.stdYQuant = append(this.stdYQuant,int64(16)); 
  this.stdYQuant = append(this.stdYQuant,int64(24)); 
  this.stdYQuant = append(this.stdYQuant,int64(40)); 
  this.stdYQuant = append(this.stdYQuant,int64(57)); 
  this.stdYQuant = append(this.stdYQuant,int64(69)); 
  this.stdYQuant = append(this.stdYQuant,int64(56)); 
  this.stdYQuant = append(this.stdYQuant,int64(14)); 
  this.stdYQuant = append(this.stdYQuant,int64(17)); 
  this.stdYQuant = append(this.stdYQuant,int64(22)); 
  this.stdYQuant = append(this.stdYQuant,int64(29)); 
  this.stdYQuant = append(this.stdYQuant,int64(51)); 
  this.stdYQuant = append(this.stdYQuant,int64(87)); 
  this.stdYQuant = append(this.stdYQuant,int64(80)); 
  this.stdYQuant = append(this.stdYQuant,int64(62)); 
  this.stdYQuant = append(this.stdYQuant,int64(18)); 
  this.stdYQuant = append(this.stdYQuant,int64(22)); 
  this.stdYQuant = append(this.stdYQuant,int64(37)); 
  this.stdYQuant = append(this.stdYQuant,int64(56)); 
  this.stdYQuant = append(this.stdYQuant,int64(68)); 
  this.stdYQuant = append(this.stdYQuant,int64(109)); 
  this.stdYQuant = append(this.stdYQuant,int64(103)); 
  this.stdYQuant = append(this.stdYQuant,int64(77)); 
  this.stdYQuant = append(this.stdYQuant,int64(24)); 
  this.stdYQuant = append(this.stdYQuant,int64(35)); 
  this.stdYQuant = append(this.stdYQuant,int64(55)); 
  this.stdYQuant = append(this.stdYQuant,int64(64)); 
  this.stdYQuant = append(this.stdYQuant,int64(81)); 
  this.stdYQuant = append(this.stdYQuant,int64(104)); 
  this.stdYQuant = append(this.stdYQuant,int64(113)); 
  this.stdYQuant = append(this.stdYQuant,int64(92)); 
  this.stdYQuant = append(this.stdYQuant,int64(49)); 
  this.stdYQuant = append(this.stdYQuant,int64(64)); 
  this.stdYQuant = append(this.stdYQuant,int64(78)); 
  this.stdYQuant = append(this.stdYQuant,int64(87)); 
  this.stdYQuant = append(this.stdYQuant,int64(103)); 
  this.stdYQuant = append(this.stdYQuant,int64(121)); 
  this.stdYQuant = append(this.stdYQuant,int64(120)); 
  this.stdYQuant = append(this.stdYQuant,int64(101)); 
  this.stdYQuant = append(this.stdYQuant,int64(72)); 
  this.stdYQuant = append(this.stdYQuant,int64(92)); 
  this.stdYQuant = append(this.stdYQuant,int64(95)); 
  this.stdYQuant = append(this.stdYQuant,int64(98)); 
  this.stdYQuant = append(this.stdYQuant,int64(112)); 
  this.stdYQuant = append(this.stdYQuant,int64(100)); 
  this.stdYQuant = append(this.stdYQuant,int64(103)); 
  this.stdYQuant = append(this.stdYQuant,int64(99)); 
  this.stdCQuant = append(this.stdCQuant,int64(17)); 
  this.stdCQuant = append(this.stdCQuant,int64(18)); 
  this.stdCQuant = append(this.stdCQuant,int64(24)); 
  this.stdCQuant = append(this.stdCQuant,int64(47)); 
  this.stdCQuant = append(this.stdCQuant,int64(99)); 
  this.stdCQuant = append(this.stdCQuant,int64(99)); 
  this.stdCQuant = append(this.stdCQuant,int64(99)); 
  this.stdCQuant = append(this.stdCQuant,int64(99)); 
  this.stdCQuant = append(this.stdCQuant,int64(18)); 
  this.stdCQuant = append(this.stdCQuant,int64(21)); 
  this.stdCQuant = append(this.stdCQuant,int64(26)); 
  this.stdCQuant = append(this.stdCQuant,int64(66)); 
  this.stdCQuant = append(this.stdCQuant,int64(99)); 
  this.stdCQuant = append(this.stdCQuant,int64(99)); 
  this.stdCQuant = append(this.stdCQuant,int64(99)); 
  this.stdCQuant = append(this.stdCQuant,int64(99)); 
  this.stdCQuant = append(this.stdCQuant,int64(24)); 
  this.stdCQuant = append(this.stdCQuant,int64(26)); 
  this.stdCQuant = append(this.stdCQuant,int64(56)); 
  this.stdCQuant = append(this.stdCQuant,int64(99)); 
  this.stdCQuant = append(this.stdCQuant,int64(99)); 
  this.stdCQuant = append(this.stdCQuant,int64(99)); 
  this.stdCQuant = append(this.stdCQuant,int64(99)); 
  this.stdCQuant = append(this.stdCQuant,int64(99)); 
  this.stdCQuant = append(this.stdCQuant,int64(47)); 
  this.stdCQuant = append(this.stdCQuant,int64(66)); 
  this.stdCQuant = append(this.stdCQuant,int64(99)); 
  this.stdCQuant = append(this.stdCQuant,int64(99)); 
  this.stdCQuant = append(this.stdCQuant,int64(99)); 
  this.stdCQuant = append(this.stdCQuant,int64(99)); 
  this.stdCQuant = append(this.stdCQuant,int64(99)); 
  this.stdCQuant = append(this.stdCQuant,int64(99)); 
  this.stdCQuant = append(this.stdCQuant,int64(99)); 
  this.stdCQuant = append(this.stdCQuant,int64(99)); 
  this.stdCQuant = append(this.stdCQuant,int64(99)); 
  this.stdCQuant = append(this.stdCQuant,int64(99)); 
  this.stdCQuant = append(this.stdCQuant,int64(99)); 
  this.stdCQuant = append(this.stdCQuant,int64(99)); 
  this.stdCQuant = append(this.stdCQuant,int64(99)); 
  this.stdCQuant = append(this.stdCQuant,int64(99)); 
  this.stdCQuant = append(this.stdCQuant,int64(99)); 
  this.stdCQuant = append(this.stdCQuant,int64(99)); 
  this.stdCQuant = append(this.stdCQuant,int64(99)); 
  this.stdCQuant = append(this.stdCQuant,int64(99)); 
  this.stdCQuant = append(this.stdCQuant,int64(99)); 
  this.stdCQuant = append(this.stdCQuant,int64(99)); 
  this.stdCQuant = append(this.stdCQuant,int64(99)); 
  this.stdCQuant = append(this.stdCQuant,int64(99)); 
  this.stdCQuant = append(this.stdCQuant,int64(99)); 
  this.stdCQuant = append(this.stdCQuant,int64(99)); 
  this.stdCQuant = append(this.stdCQuant,int64(99)); 
  this.stdCQuant = append(this.stdCQuant,int64(99)); 
  this.stdCQuant = append(this.stdCQuant,int64(99)); 
  this.stdCQuant = append(this.stdCQuant,int64(99)); 
  this.stdCQuant = append(this.stdCQuant,int64(99)); 
  this.stdCQuant = append(this.stdCQuant,int64(99)); 
  this.stdCQuant = append(this.stdCQuant,int64(99)); 
  this.stdCQuant = append(this.stdCQuant,int64(99)); 
  this.stdCQuant = append(this.stdCQuant,int64(99)); 
  this.stdCQuant = append(this.stdCQuant,int64(99)); 
  this.stdCQuant = append(this.stdCQuant,int64(99)); 
  this.stdCQuant = append(this.stdCQuant,int64(99)); 
  this.stdCQuant = append(this.stdCQuant,int64(99)); 
  this.stdCQuant = append(this.stdCQuant,int64(99)); 
  this.scaleQuantTables(this.quality);
}
func (this *JPEGEncoder) scaleQuantTables (q int64) () {
  var scale int64= int64(0);
  if  q < int64(50) {
    scale = int64((float64(int64(5000)) / float64(q))); 
  } else {
    scale = int64(200) - (q * int64(2)); 
  }
  this.yQuantTable = this.yQuantTable[:0]
  this.cQuantTable = this.cQuantTable[:0]
  var i int64= int64(0);
  for i < int64(64) {
    var yVal int64= int64((float64((((this.stdYQuant[i]) * scale) + int64(50))) / float64(int64(100))));
    if  yVal < int64(1) {
      yVal = int64(1); 
    }
    if  yVal > int64(255) {
      yVal = int64(255); 
    }
    this.yQuantTable = append(this.yQuantTable,yVal); 
    var cVal int64= int64((float64((((this.stdCQuant[i]) * scale) + int64(50))) / float64(int64(100))));
    if  cVal < int64(1) {
      cVal = int64(1); 
    }
    if  cVal > int64(255) {
      cVal = int64(255); 
    }
    this.cQuantTable = append(this.cQuantTable,cVal); 
    i = i + int64(1); 
  }
}
func (this *JPEGEncoder) initHuffmanTables () () {
  this.dcYBits = append(this.dcYBits,int64(0)); 
  this.dcYBits = append(this.dcYBits,int64(1)); 
  this.dcYBits = append(this.dcYBits,int64(5)); 
  this.dcYBits = append(this.dcYBits,int64(1)); 
  this.dcYBits = append(this.dcYBits,int64(1)); 
  this.dcYBits = append(this.dcYBits,int64(1)); 
  this.dcYBits = append(this.dcYBits,int64(1)); 
  this.dcYBits = append(this.dcYBits,int64(1)); 
  this.dcYBits = append(this.dcYBits,int64(1)); 
  this.dcYBits = append(this.dcYBits,int64(0)); 
  this.dcYBits = append(this.dcYBits,int64(0)); 
  this.dcYBits = append(this.dcYBits,int64(0)); 
  this.dcYBits = append(this.dcYBits,int64(0)); 
  this.dcYBits = append(this.dcYBits,int64(0)); 
  this.dcYBits = append(this.dcYBits,int64(0)); 
  this.dcYBits = append(this.dcYBits,int64(0)); 
  this.dcYValues = append(this.dcYValues,int64(0)); 
  this.dcYValues = append(this.dcYValues,int64(1)); 
  this.dcYValues = append(this.dcYValues,int64(2)); 
  this.dcYValues = append(this.dcYValues,int64(3)); 
  this.dcYValues = append(this.dcYValues,int64(4)); 
  this.dcYValues = append(this.dcYValues,int64(5)); 
  this.dcYValues = append(this.dcYValues,int64(6)); 
  this.dcYValues = append(this.dcYValues,int64(7)); 
  this.dcYValues = append(this.dcYValues,int64(8)); 
  this.dcYValues = append(this.dcYValues,int64(9)); 
  this.dcYValues = append(this.dcYValues,int64(10)); 
  this.dcYValues = append(this.dcYValues,int64(11)); 
  this.acYBits = append(this.acYBits,int64(0)); 
  this.acYBits = append(this.acYBits,int64(2)); 
  this.acYBits = append(this.acYBits,int64(1)); 
  this.acYBits = append(this.acYBits,int64(3)); 
  this.acYBits = append(this.acYBits,int64(3)); 
  this.acYBits = append(this.acYBits,int64(2)); 
  this.acYBits = append(this.acYBits,int64(4)); 
  this.acYBits = append(this.acYBits,int64(3)); 
  this.acYBits = append(this.acYBits,int64(5)); 
  this.acYBits = append(this.acYBits,int64(5)); 
  this.acYBits = append(this.acYBits,int64(4)); 
  this.acYBits = append(this.acYBits,int64(4)); 
  this.acYBits = append(this.acYBits,int64(0)); 
  this.acYBits = append(this.acYBits,int64(0)); 
  this.acYBits = append(this.acYBits,int64(1)); 
  this.acYBits = append(this.acYBits,int64(125)); 
  this.acYValues = append(this.acYValues,int64(1)); 
  this.acYValues = append(this.acYValues,int64(2)); 
  this.acYValues = append(this.acYValues,int64(3)); 
  this.acYValues = append(this.acYValues,int64(0)); 
  this.acYValues = append(this.acYValues,int64(4)); 
  this.acYValues = append(this.acYValues,int64(17)); 
  this.acYValues = append(this.acYValues,int64(5)); 
  this.acYValues = append(this.acYValues,int64(18)); 
  this.acYValues = append(this.acYValues,int64(33)); 
  this.acYValues = append(this.acYValues,int64(49)); 
  this.acYValues = append(this.acYValues,int64(65)); 
  this.acYValues = append(this.acYValues,int64(6)); 
  this.acYValues = append(this.acYValues,int64(19)); 
  this.acYValues = append(this.acYValues,int64(81)); 
  this.acYValues = append(this.acYValues,int64(97)); 
  this.acYValues = append(this.acYValues,int64(7)); 
  this.acYValues = append(this.acYValues,int64(34)); 
  this.acYValues = append(this.acYValues,int64(113)); 
  this.acYValues = append(this.acYValues,int64(20)); 
  this.acYValues = append(this.acYValues,int64(50)); 
  this.acYValues = append(this.acYValues,int64(129)); 
  this.acYValues = append(this.acYValues,int64(145)); 
  this.acYValues = append(this.acYValues,int64(161)); 
  this.acYValues = append(this.acYValues,int64(8)); 
  this.acYValues = append(this.acYValues,int64(35)); 
  this.acYValues = append(this.acYValues,int64(66)); 
  this.acYValues = append(this.acYValues,int64(177)); 
  this.acYValues = append(this.acYValues,int64(193)); 
  this.acYValues = append(this.acYValues,int64(21)); 
  this.acYValues = append(this.acYValues,int64(82)); 
  this.acYValues = append(this.acYValues,int64(209)); 
  this.acYValues = append(this.acYValues,int64(240)); 
  this.acYValues = append(this.acYValues,int64(36)); 
  this.acYValues = append(this.acYValues,int64(51)); 
  this.acYValues = append(this.acYValues,int64(98)); 
  this.acYValues = append(this.acYValues,int64(114)); 
  this.acYValues = append(this.acYValues,int64(130)); 
  this.acYValues = append(this.acYValues,int64(9)); 
  this.acYValues = append(this.acYValues,int64(10)); 
  this.acYValues = append(this.acYValues,int64(22)); 
  this.acYValues = append(this.acYValues,int64(23)); 
  this.acYValues = append(this.acYValues,int64(24)); 
  this.acYValues = append(this.acYValues,int64(25)); 
  this.acYValues = append(this.acYValues,int64(26)); 
  this.acYValues = append(this.acYValues,int64(37)); 
  this.acYValues = append(this.acYValues,int64(38)); 
  this.acYValues = append(this.acYValues,int64(39)); 
  this.acYValues = append(this.acYValues,int64(40)); 
  this.acYValues = append(this.acYValues,int64(41)); 
  this.acYValues = append(this.acYValues,int64(42)); 
  this.acYValues = append(this.acYValues,int64(52)); 
  this.acYValues = append(this.acYValues,int64(53)); 
  this.acYValues = append(this.acYValues,int64(54)); 
  this.acYValues = append(this.acYValues,int64(55)); 
  this.acYValues = append(this.acYValues,int64(56)); 
  this.acYValues = append(this.acYValues,int64(57)); 
  this.acYValues = append(this.acYValues,int64(58)); 
  this.acYValues = append(this.acYValues,int64(67)); 
  this.acYValues = append(this.acYValues,int64(68)); 
  this.acYValues = append(this.acYValues,int64(69)); 
  this.acYValues = append(this.acYValues,int64(70)); 
  this.acYValues = append(this.acYValues,int64(71)); 
  this.acYValues = append(this.acYValues,int64(72)); 
  this.acYValues = append(this.acYValues,int64(73)); 
  this.acYValues = append(this.acYValues,int64(74)); 
  this.acYValues = append(this.acYValues,int64(83)); 
  this.acYValues = append(this.acYValues,int64(84)); 
  this.acYValues = append(this.acYValues,int64(85)); 
  this.acYValues = append(this.acYValues,int64(86)); 
  this.acYValues = append(this.acYValues,int64(87)); 
  this.acYValues = append(this.acYValues,int64(88)); 
  this.acYValues = append(this.acYValues,int64(89)); 
  this.acYValues = append(this.acYValues,int64(90)); 
  this.acYValues = append(this.acYValues,int64(99)); 
  this.acYValues = append(this.acYValues,int64(100)); 
  this.acYValues = append(this.acYValues,int64(101)); 
  this.acYValues = append(this.acYValues,int64(102)); 
  this.acYValues = append(this.acYValues,int64(103)); 
  this.acYValues = append(this.acYValues,int64(104)); 
  this.acYValues = append(this.acYValues,int64(105)); 
  this.acYValues = append(this.acYValues,int64(106)); 
  this.acYValues = append(this.acYValues,int64(115)); 
  this.acYValues = append(this.acYValues,int64(116)); 
  this.acYValues = append(this.acYValues,int64(117)); 
  this.acYValues = append(this.acYValues,int64(118)); 
  this.acYValues = append(this.acYValues,int64(119)); 
  this.acYValues = append(this.acYValues,int64(120)); 
  this.acYValues = append(this.acYValues,int64(121)); 
  this.acYValues = append(this.acYValues,int64(122)); 
  this.acYValues = append(this.acYValues,int64(131)); 
  this.acYValues = append(this.acYValues,int64(132)); 
  this.acYValues = append(this.acYValues,int64(133)); 
  this.acYValues = append(this.acYValues,int64(134)); 
  this.acYValues = append(this.acYValues,int64(135)); 
  this.acYValues = append(this.acYValues,int64(136)); 
  this.acYValues = append(this.acYValues,int64(137)); 
  this.acYValues = append(this.acYValues,int64(138)); 
  this.acYValues = append(this.acYValues,int64(146)); 
  this.acYValues = append(this.acYValues,int64(147)); 
  this.acYValues = append(this.acYValues,int64(148)); 
  this.acYValues = append(this.acYValues,int64(149)); 
  this.acYValues = append(this.acYValues,int64(150)); 
  this.acYValues = append(this.acYValues,int64(151)); 
  this.acYValues = append(this.acYValues,int64(152)); 
  this.acYValues = append(this.acYValues,int64(153)); 
  this.acYValues = append(this.acYValues,int64(154)); 
  this.acYValues = append(this.acYValues,int64(162)); 
  this.acYValues = append(this.acYValues,int64(163)); 
  this.acYValues = append(this.acYValues,int64(164)); 
  this.acYValues = append(this.acYValues,int64(165)); 
  this.acYValues = append(this.acYValues,int64(166)); 
  this.acYValues = append(this.acYValues,int64(167)); 
  this.acYValues = append(this.acYValues,int64(168)); 
  this.acYValues = append(this.acYValues,int64(169)); 
  this.acYValues = append(this.acYValues,int64(170)); 
  this.acYValues = append(this.acYValues,int64(178)); 
  this.acYValues = append(this.acYValues,int64(179)); 
  this.acYValues = append(this.acYValues,int64(180)); 
  this.acYValues = append(this.acYValues,int64(181)); 
  this.acYValues = append(this.acYValues,int64(182)); 
  this.acYValues = append(this.acYValues,int64(183)); 
  this.acYValues = append(this.acYValues,int64(184)); 
  this.acYValues = append(this.acYValues,int64(185)); 
  this.acYValues = append(this.acYValues,int64(186)); 
  this.acYValues = append(this.acYValues,int64(194)); 
  this.acYValues = append(this.acYValues,int64(195)); 
  this.acYValues = append(this.acYValues,int64(196)); 
  this.acYValues = append(this.acYValues,int64(197)); 
  this.acYValues = append(this.acYValues,int64(198)); 
  this.acYValues = append(this.acYValues,int64(199)); 
  this.acYValues = append(this.acYValues,int64(200)); 
  this.acYValues = append(this.acYValues,int64(201)); 
  this.acYValues = append(this.acYValues,int64(202)); 
  this.acYValues = append(this.acYValues,int64(210)); 
  this.acYValues = append(this.acYValues,int64(211)); 
  this.acYValues = append(this.acYValues,int64(212)); 
  this.acYValues = append(this.acYValues,int64(213)); 
  this.acYValues = append(this.acYValues,int64(214)); 
  this.acYValues = append(this.acYValues,int64(215)); 
  this.acYValues = append(this.acYValues,int64(216)); 
  this.acYValues = append(this.acYValues,int64(217)); 
  this.acYValues = append(this.acYValues,int64(218)); 
  this.acYValues = append(this.acYValues,int64(225)); 
  this.acYValues = append(this.acYValues,int64(226)); 
  this.acYValues = append(this.acYValues,int64(227)); 
  this.acYValues = append(this.acYValues,int64(228)); 
  this.acYValues = append(this.acYValues,int64(229)); 
  this.acYValues = append(this.acYValues,int64(230)); 
  this.acYValues = append(this.acYValues,int64(231)); 
  this.acYValues = append(this.acYValues,int64(232)); 
  this.acYValues = append(this.acYValues,int64(233)); 
  this.acYValues = append(this.acYValues,int64(234)); 
  this.acYValues = append(this.acYValues,int64(241)); 
  this.acYValues = append(this.acYValues,int64(242)); 
  this.acYValues = append(this.acYValues,int64(243)); 
  this.acYValues = append(this.acYValues,int64(244)); 
  this.acYValues = append(this.acYValues,int64(245)); 
  this.acYValues = append(this.acYValues,int64(246)); 
  this.acYValues = append(this.acYValues,int64(247)); 
  this.acYValues = append(this.acYValues,int64(248)); 
  this.acYValues = append(this.acYValues,int64(249)); 
  this.acYValues = append(this.acYValues,int64(250)); 
  this.dcCBits = append(this.dcCBits,int64(0)); 
  this.dcCBits = append(this.dcCBits,int64(3)); 
  this.dcCBits = append(this.dcCBits,int64(1)); 
  this.dcCBits = append(this.dcCBits,int64(1)); 
  this.dcCBits = append(this.dcCBits,int64(1)); 
  this.dcCBits = append(this.dcCBits,int64(1)); 
  this.dcCBits = append(this.dcCBits,int64(1)); 
  this.dcCBits = append(this.dcCBits,int64(1)); 
  this.dcCBits = append(this.dcCBits,int64(1)); 
  this.dcCBits = append(this.dcCBits,int64(1)); 
  this.dcCBits = append(this.dcCBits,int64(1)); 
  this.dcCBits = append(this.dcCBits,int64(0)); 
  this.dcCBits = append(this.dcCBits,int64(0)); 
  this.dcCBits = append(this.dcCBits,int64(0)); 
  this.dcCBits = append(this.dcCBits,int64(0)); 
  this.dcCBits = append(this.dcCBits,int64(0)); 
  this.dcCValues = append(this.dcCValues,int64(0)); 
  this.dcCValues = append(this.dcCValues,int64(1)); 
  this.dcCValues = append(this.dcCValues,int64(2)); 
  this.dcCValues = append(this.dcCValues,int64(3)); 
  this.dcCValues = append(this.dcCValues,int64(4)); 
  this.dcCValues = append(this.dcCValues,int64(5)); 
  this.dcCValues = append(this.dcCValues,int64(6)); 
  this.dcCValues = append(this.dcCValues,int64(7)); 
  this.dcCValues = append(this.dcCValues,int64(8)); 
  this.dcCValues = append(this.dcCValues,int64(9)); 
  this.dcCValues = append(this.dcCValues,int64(10)); 
  this.dcCValues = append(this.dcCValues,int64(11)); 
  this.acCBits = append(this.acCBits,int64(0)); 
  this.acCBits = append(this.acCBits,int64(2)); 
  this.acCBits = append(this.acCBits,int64(1)); 
  this.acCBits = append(this.acCBits,int64(2)); 
  this.acCBits = append(this.acCBits,int64(4)); 
  this.acCBits = append(this.acCBits,int64(4)); 
  this.acCBits = append(this.acCBits,int64(3)); 
  this.acCBits = append(this.acCBits,int64(4)); 
  this.acCBits = append(this.acCBits,int64(7)); 
  this.acCBits = append(this.acCBits,int64(5)); 
  this.acCBits = append(this.acCBits,int64(4)); 
  this.acCBits = append(this.acCBits,int64(4)); 
  this.acCBits = append(this.acCBits,int64(0)); 
  this.acCBits = append(this.acCBits,int64(1)); 
  this.acCBits = append(this.acCBits,int64(2)); 
  this.acCBits = append(this.acCBits,int64(119)); 
  this.acCValues = append(this.acCValues,int64(0)); 
  this.acCValues = append(this.acCValues,int64(1)); 
  this.acCValues = append(this.acCValues,int64(2)); 
  this.acCValues = append(this.acCValues,int64(3)); 
  this.acCValues = append(this.acCValues,int64(17)); 
  this.acCValues = append(this.acCValues,int64(4)); 
  this.acCValues = append(this.acCValues,int64(5)); 
  this.acCValues = append(this.acCValues,int64(33)); 
  this.acCValues = append(this.acCValues,int64(49)); 
  this.acCValues = append(this.acCValues,int64(6)); 
  this.acCValues = append(this.acCValues,int64(18)); 
  this.acCValues = append(this.acCValues,int64(65)); 
  this.acCValues = append(this.acCValues,int64(81)); 
  this.acCValues = append(this.acCValues,int64(7)); 
  this.acCValues = append(this.acCValues,int64(97)); 
  this.acCValues = append(this.acCValues,int64(113)); 
  this.acCValues = append(this.acCValues,int64(19)); 
  this.acCValues = append(this.acCValues,int64(34)); 
  this.acCValues = append(this.acCValues,int64(50)); 
  this.acCValues = append(this.acCValues,int64(129)); 
  this.acCValues = append(this.acCValues,int64(8)); 
  this.acCValues = append(this.acCValues,int64(20)); 
  this.acCValues = append(this.acCValues,int64(66)); 
  this.acCValues = append(this.acCValues,int64(145)); 
  this.acCValues = append(this.acCValues,int64(161)); 
  this.acCValues = append(this.acCValues,int64(177)); 
  this.acCValues = append(this.acCValues,int64(193)); 
  this.acCValues = append(this.acCValues,int64(9)); 
  this.acCValues = append(this.acCValues,int64(35)); 
  this.acCValues = append(this.acCValues,int64(51)); 
  this.acCValues = append(this.acCValues,int64(82)); 
  this.acCValues = append(this.acCValues,int64(240)); 
  this.acCValues = append(this.acCValues,int64(21)); 
  this.acCValues = append(this.acCValues,int64(98)); 
  this.acCValues = append(this.acCValues,int64(114)); 
  this.acCValues = append(this.acCValues,int64(209)); 
  this.acCValues = append(this.acCValues,int64(10)); 
  this.acCValues = append(this.acCValues,int64(22)); 
  this.acCValues = append(this.acCValues,int64(36)); 
  this.acCValues = append(this.acCValues,int64(52)); 
  this.acCValues = append(this.acCValues,int64(225)); 
  this.acCValues = append(this.acCValues,int64(37)); 
  this.acCValues = append(this.acCValues,int64(241)); 
  this.acCValues = append(this.acCValues,int64(23)); 
  this.acCValues = append(this.acCValues,int64(24)); 
  this.acCValues = append(this.acCValues,int64(25)); 
  this.acCValues = append(this.acCValues,int64(26)); 
  this.acCValues = append(this.acCValues,int64(38)); 
  this.acCValues = append(this.acCValues,int64(39)); 
  this.acCValues = append(this.acCValues,int64(40)); 
  this.acCValues = append(this.acCValues,int64(41)); 
  this.acCValues = append(this.acCValues,int64(42)); 
  this.acCValues = append(this.acCValues,int64(53)); 
  this.acCValues = append(this.acCValues,int64(54)); 
  this.acCValues = append(this.acCValues,int64(55)); 
  this.acCValues = append(this.acCValues,int64(56)); 
  this.acCValues = append(this.acCValues,int64(57)); 
  this.acCValues = append(this.acCValues,int64(58)); 
  this.acCValues = append(this.acCValues,int64(67)); 
  this.acCValues = append(this.acCValues,int64(68)); 
  this.acCValues = append(this.acCValues,int64(69)); 
  this.acCValues = append(this.acCValues,int64(70)); 
  this.acCValues = append(this.acCValues,int64(71)); 
  this.acCValues = append(this.acCValues,int64(72)); 
  this.acCValues = append(this.acCValues,int64(73)); 
  this.acCValues = append(this.acCValues,int64(74)); 
  this.acCValues = append(this.acCValues,int64(83)); 
  this.acCValues = append(this.acCValues,int64(84)); 
  this.acCValues = append(this.acCValues,int64(85)); 
  this.acCValues = append(this.acCValues,int64(86)); 
  this.acCValues = append(this.acCValues,int64(87)); 
  this.acCValues = append(this.acCValues,int64(88)); 
  this.acCValues = append(this.acCValues,int64(89)); 
  this.acCValues = append(this.acCValues,int64(90)); 
  this.acCValues = append(this.acCValues,int64(99)); 
  this.acCValues = append(this.acCValues,int64(100)); 
  this.acCValues = append(this.acCValues,int64(101)); 
  this.acCValues = append(this.acCValues,int64(102)); 
  this.acCValues = append(this.acCValues,int64(103)); 
  this.acCValues = append(this.acCValues,int64(104)); 
  this.acCValues = append(this.acCValues,int64(105)); 
  this.acCValues = append(this.acCValues,int64(106)); 
  this.acCValues = append(this.acCValues,int64(115)); 
  this.acCValues = append(this.acCValues,int64(116)); 
  this.acCValues = append(this.acCValues,int64(117)); 
  this.acCValues = append(this.acCValues,int64(118)); 
  this.acCValues = append(this.acCValues,int64(119)); 
  this.acCValues = append(this.acCValues,int64(120)); 
  this.acCValues = append(this.acCValues,int64(121)); 
  this.acCValues = append(this.acCValues,int64(122)); 
  this.acCValues = append(this.acCValues,int64(130)); 
  this.acCValues = append(this.acCValues,int64(131)); 
  this.acCValues = append(this.acCValues,int64(132)); 
  this.acCValues = append(this.acCValues,int64(133)); 
  this.acCValues = append(this.acCValues,int64(134)); 
  this.acCValues = append(this.acCValues,int64(135)); 
  this.acCValues = append(this.acCValues,int64(136)); 
  this.acCValues = append(this.acCValues,int64(137)); 
  this.acCValues = append(this.acCValues,int64(138)); 
  this.acCValues = append(this.acCValues,int64(146)); 
  this.acCValues = append(this.acCValues,int64(147)); 
  this.acCValues = append(this.acCValues,int64(148)); 
  this.acCValues = append(this.acCValues,int64(149)); 
  this.acCValues = append(this.acCValues,int64(150)); 
  this.acCValues = append(this.acCValues,int64(151)); 
  this.acCValues = append(this.acCValues,int64(152)); 
  this.acCValues = append(this.acCValues,int64(153)); 
  this.acCValues = append(this.acCValues,int64(154)); 
  this.acCValues = append(this.acCValues,int64(162)); 
  this.acCValues = append(this.acCValues,int64(163)); 
  this.acCValues = append(this.acCValues,int64(164)); 
  this.acCValues = append(this.acCValues,int64(165)); 
  this.acCValues = append(this.acCValues,int64(166)); 
  this.acCValues = append(this.acCValues,int64(167)); 
  this.acCValues = append(this.acCValues,int64(168)); 
  this.acCValues = append(this.acCValues,int64(169)); 
  this.acCValues = append(this.acCValues,int64(170)); 
  this.acCValues = append(this.acCValues,int64(178)); 
  this.acCValues = append(this.acCValues,int64(179)); 
  this.acCValues = append(this.acCValues,int64(180)); 
  this.acCValues = append(this.acCValues,int64(181)); 
  this.acCValues = append(this.acCValues,int64(182)); 
  this.acCValues = append(this.acCValues,int64(183)); 
  this.acCValues = append(this.acCValues,int64(184)); 
  this.acCValues = append(this.acCValues,int64(185)); 
  this.acCValues = append(this.acCValues,int64(186)); 
  this.acCValues = append(this.acCValues,int64(194)); 
  this.acCValues = append(this.acCValues,int64(195)); 
  this.acCValues = append(this.acCValues,int64(196)); 
  this.acCValues = append(this.acCValues,int64(197)); 
  this.acCValues = append(this.acCValues,int64(198)); 
  this.acCValues = append(this.acCValues,int64(199)); 
  this.acCValues = append(this.acCValues,int64(200)); 
  this.acCValues = append(this.acCValues,int64(201)); 
  this.acCValues = append(this.acCValues,int64(202)); 
  this.acCValues = append(this.acCValues,int64(210)); 
  this.acCValues = append(this.acCValues,int64(211)); 
  this.acCValues = append(this.acCValues,int64(212)); 
  this.acCValues = append(this.acCValues,int64(213)); 
  this.acCValues = append(this.acCValues,int64(214)); 
  this.acCValues = append(this.acCValues,int64(215)); 
  this.acCValues = append(this.acCValues,int64(216)); 
  this.acCValues = append(this.acCValues,int64(217)); 
  this.acCValues = append(this.acCValues,int64(218)); 
  this.acCValues = append(this.acCValues,int64(226)); 
  this.acCValues = append(this.acCValues,int64(227)); 
  this.acCValues = append(this.acCValues,int64(228)); 
  this.acCValues = append(this.acCValues,int64(229)); 
  this.acCValues = append(this.acCValues,int64(230)); 
  this.acCValues = append(this.acCValues,int64(231)); 
  this.acCValues = append(this.acCValues,int64(232)); 
  this.acCValues = append(this.acCValues,int64(233)); 
  this.acCValues = append(this.acCValues,int64(234)); 
  this.acCValues = append(this.acCValues,int64(242)); 
  this.acCValues = append(this.acCValues,int64(243)); 
  this.acCValues = append(this.acCValues,int64(244)); 
  this.acCValues = append(this.acCValues,int64(245)); 
  this.acCValues = append(this.acCValues,int64(246)); 
  this.acCValues = append(this.acCValues,int64(247)); 
  this.acCValues = append(this.acCValues,int64(248)); 
  this.acCValues = append(this.acCValues,int64(249)); 
  this.acCValues = append(this.acCValues,int64(250)); 
  var i int64= int64(0);
  for i < int64(256) {
    this.dcYCodes = append(this.dcYCodes,int64(0)); 
    this.dcYLengths = append(this.dcYLengths,int64(0)); 
    this.acYCodes = append(this.acYCodes,int64(0)); 
    this.acYLengths = append(this.acYLengths,int64(0)); 
    this.dcCCodes = append(this.dcCCodes,int64(0)); 
    this.dcCLengths = append(this.dcCLengths,int64(0)); 
    this.acCCodes = append(this.acCCodes,int64(0)); 
    this.acCLengths = append(this.acCLengths,int64(0)); 
    i = i + int64(1); 
  }
  this.buildHuffmanCodes(this.dcYBits, this.dcYValues, this.dcYCodes, this.dcYLengths);
  this.buildHuffmanCodes(this.acYBits, this.acYValues, this.acYCodes, this.acYLengths);
  this.buildHuffmanCodes(this.dcCBits, this.dcCValues, this.dcCCodes, this.dcCLengths);
  this.buildHuffmanCodes(this.acCBits, this.acCValues, this.acCCodes, this.acCLengths);
}
func (this *JPEGEncoder) buildHuffmanCodes (bits []int64, values []int64, codes []int64, lengths []int64) () {
  var code int64= int64(0);
  var valueIdx int64= int64(0);
  var bitLen int64= int64(1);
  for bitLen <= int64(16) {
    var count int64= bits[(bitLen - int64(1))];
    var j int64= int64(0);
    for j < count {
      var symbol int64= values[valueIdx];
      codes[symbol] = code;
      lengths[symbol] = bitLen;
      code = code + int64(1); 
      valueIdx = valueIdx + int64(1); 
      j = j + int64(1); 
    }
    code = int64(code << uint(int64(1))); 
    bitLen = bitLen + int64(1); 
  }
}
func (this *JPEGEncoder) getCategory (value int64) int64 {
  if  value < int64(0) {
    value = int64(0) - value; 
  }
  if  value == int64(0) {
    return int64(0)
  }
  var cat int64= int64(0);
  for value > int64(0) {
    cat = cat + int64(1); 
    value = int64(value >> uint(int64(1))); 
  }
  return cat
}
func (this *JPEGEncoder) encodeNumber (value int64, category int64) int64 {
  if  value < int64(0) {
    return value + ((int64(int64(1) << uint(category))) - int64(1))
  }
  return value
}
func (this *JPEGEncoder) encodeBlock (writer *BitWriter, coeffs []int64, quantTable []int64, dcCodes []int64, dcLengths []int64, acCodes []int64, acLengths []int64, prevDC int64) () {
  var quantized []int64= make([]int64, int64(64));
  var i int64= int64(0);
  for i < int64(64) {
    var q int64= quantTable[i];
    var c int64= coeffs[i];
    var qVal int64= int64(0);
    if  c >= int64(0) {
      qVal = int64((float64((c + (int64(q >> uint(int64(1)))))) / float64(q))); 
    } else {
      qVal = int64((float64((c - (int64(q >> uint(int64(1)))))) / float64(q))); 
    }
    quantized[i] = qVal
    i = i + int64(1); 
  }
  var zigzagged []int64= this.fdct.value.(*FDCT).zigzag(quantized);
  var dc int64= zigzagged[int64(0)];
  var dcDiff int64= dc - prevDC;
  var dcCat int64= this.getCategory(dcDiff);
  var dcCode int64= dcCodes[dcCat];
  var dcLen int64= dcLengths[dcCat];
  writer.writeBits(dcCode, dcLen);
  if  dcCat > int64(0) {
    var dcVal int64= this.encodeNumber(dcDiff, dcCat);
    writer.writeBits(dcVal, dcCat);
  }
  var zeroRun int64= int64(0);
  var k int64= int64(1);
  for k < int64(64) {
    var ac int64= zigzagged[k];
    if  ac == int64(0) {
      zeroRun = zeroRun + int64(1); 
    } else {
      for zeroRun >= int64(16) {
        var zrlCode int64= acCodes[int64(240)];
        var zrlLen int64= acLengths[int64(240)];
        writer.writeBits(zrlCode, zrlLen);
        zeroRun = zeroRun - int64(16); 
      }
      var acCat int64= this.getCategory(ac);
      var runCat int64= int64((int64(zeroRun << uint(int64(4)))) | acCat);
      var acHuffCode int64= acCodes[runCat];
      var acHuffLen int64= acLengths[runCat];
      writer.writeBits(acHuffCode, acHuffLen);
      var acVal int64= this.encodeNumber(ac, acCat);
      writer.writeBits(acVal, acCat);
      zeroRun = int64(0); 
    }
    k = k + int64(1); 
  }
  if  zeroRun > int64(0) {
    var eobCode int64= acCodes[int64(0)];
    var eobLen int64= acLengths[int64(0)];
    writer.writeBits(eobCode, eobLen);
  }
}
func (this *JPEGEncoder) rgbToYCbCr (r int64, g int64, b int64, yOut []int64, cbOut []int64, crOut []int64) () {
  var y int64= int64((((int64(77) * r) + (int64(150) * g)) + (int64(29) * b)) >> uint(int64(8)));
  var cb int64= (int64((((int64(0) - (int64(43) * r)) - (int64(85) * g)) + (int64(128) * b)) >> uint(int64(8)))) + int64(128);
  var cr int64= (int64((((int64(128) * r) - (int64(107) * g)) - (int64(21) * b)) >> uint(int64(8)))) + int64(128);
  if  y < int64(0) {
    y = int64(0); 
  }
  if  y > int64(255) {
    y = int64(255); 
  }
  if  cb < int64(0) {
    cb = int64(0); 
  }
  if  cb > int64(255) {
    cb = int64(255); 
  }
  if  cr < int64(0) {
    cr = int64(0); 
  }
  if  cr > int64(255) {
    cr = int64(255); 
  }
  yOut = append(yOut,y); 
  cbOut = append(cbOut,cb); 
  crOut = append(crOut,cr); 
}
func (this *JPEGEncoder) extractBlock (img *ImageBuffer, blockX int64, blockY int64, channel int64) []int64 {
  var output []int64= make([]int64, int64(64));
  var idx int64= int64(0);
  var py int64= int64(0);
  for py < int64(8) {
    var px int64= int64(0);
    for px < int64(8) {
      var imgX int64= blockX + px;
      var imgY int64= blockY + py;
      if  imgX >= img.width {
        imgX = img.width - int64(1); 
      }
      if  imgY >= img.height {
        imgY = img.height - int64(1); 
      }
      var c *Color= img.getPixel(imgX, imgY);
      var y int64= int64((((int64(77) * c.r) + (int64(150) * c.g)) + (int64(29) * c.b)) >> uint(int64(8)));
      var cb int64= (int64((((int64(0) - (int64(43) * c.r)) - (int64(85) * c.g)) + (int64(128) * c.b)) >> uint(int64(8)))) + int64(128);
      var cr int64= (int64((((int64(128) * c.r) - (int64(107) * c.g)) - (int64(21) * c.b)) >> uint(int64(8)))) + int64(128);
      if  channel == int64(0) {
        output[idx] = y
      }
      if  channel == int64(1) {
        output[idx] = cb
      }
      if  channel == int64(2) {
        output[idx] = cr
      }
      idx = idx + int64(1); 
      px = px + int64(1); 
    }
    py = py + int64(1); 
  }
  return output
}
func (this *JPEGEncoder) writeMarkers (writer *BitWriter, width int64, height int64) () {
  writer.writeByte(int64(255));
  writer.writeByte(int64(216));
  writer.writeByte(int64(255));
  writer.writeByte(int64(224));
  writer.writeWord(int64(16));
  writer.writeByte(int64(74));
  writer.writeByte(int64(70));
  writer.writeByte(int64(73));
  writer.writeByte(int64(70));
  writer.writeByte(int64(0));
  writer.writeByte(int64(1));
  writer.writeByte(int64(1));
  writer.writeByte(int64(0));
  writer.writeWord(int64(1));
  writer.writeWord(int64(1));
  writer.writeByte(int64(0));
  writer.writeByte(int64(0));
  writer.writeByte(int64(255));
  writer.writeByte(int64(219));
  writer.writeWord(int64(67));
  writer.writeByte(int64(0));
  var i int64= int64(0);
  for i < int64(64) {
    writer.writeByte(this.yQuantTable[(this.fdct.value.(*FDCT).zigzagOrder[i])]);
    i = i + int64(1); 
  }
  writer.writeByte(int64(255));
  writer.writeByte(int64(219));
  writer.writeWord(int64(67));
  writer.writeByte(int64(1));
  i = int64(0); 
  for i < int64(64) {
    writer.writeByte(this.cQuantTable[(this.fdct.value.(*FDCT).zigzagOrder[i])]);
    i = i + int64(1); 
  }
  writer.writeByte(int64(255));
  writer.writeByte(int64(192));
  writer.writeWord(int64(17));
  writer.writeByte(int64(8));
  writer.writeWord(height);
  writer.writeWord(width);
  writer.writeByte(int64(3));
  writer.writeByte(int64(1));
  writer.writeByte(int64(17));
  writer.writeByte(int64(0));
  writer.writeByte(int64(2));
  writer.writeByte(int64(17));
  writer.writeByte(int64(1));
  writer.writeByte(int64(3));
  writer.writeByte(int64(17));
  writer.writeByte(int64(1));
  writer.writeByte(int64(255));
  writer.writeByte(int64(196));
  writer.writeWord(int64(31));
  writer.writeByte(int64(0));
  i = int64(0); 
  for i < int64(16) {
    writer.writeByte(this.dcYBits[i]);
    i = i + int64(1); 
  }
  i = int64(0); 
  for i < int64(12) {
    writer.writeByte(this.dcYValues[i]);
    i = i + int64(1); 
  }
  writer.writeByte(int64(255));
  writer.writeByte(int64(196));
  writer.writeWord(int64(181));
  writer.writeByte(int64(16));
  i = int64(0); 
  for i < int64(16) {
    writer.writeByte(this.acYBits[i]);
    i = i + int64(1); 
  }
  i = int64(0); 
  for i < int64(162) {
    writer.writeByte(this.acYValues[i]);
    i = i + int64(1); 
  }
  writer.writeByte(int64(255));
  writer.writeByte(int64(196));
  writer.writeWord(int64(31));
  writer.writeByte(int64(1));
  i = int64(0); 
  for i < int64(16) {
    writer.writeByte(this.dcCBits[i]);
    i = i + int64(1); 
  }
  i = int64(0); 
  for i < int64(12) {
    writer.writeByte(this.dcCValues[i]);
    i = i + int64(1); 
  }
  writer.writeByte(int64(255));
  writer.writeByte(int64(196));
  writer.writeWord(int64(181));
  writer.writeByte(int64(17));
  i = int64(0); 
  for i < int64(16) {
    writer.writeByte(this.acCBits[i]);
    i = i + int64(1); 
  }
  i = int64(0); 
  for i < int64(162) {
    writer.writeByte(this.acCValues[i]);
    i = i + int64(1); 
  }
  writer.writeByte(int64(255));
  writer.writeByte(int64(218));
  writer.writeWord(int64(12));
  writer.writeByte(int64(3));
  writer.writeByte(int64(1));
  writer.writeByte(int64(0));
  writer.writeByte(int64(2));
  writer.writeByte(int64(17));
  writer.writeByte(int64(3));
  writer.writeByte(int64(17));
  writer.writeByte(int64(0));
  writer.writeByte(int64(63));
  writer.writeByte(int64(0));
}
func (this *JPEGEncoder) encodeToBuffer (img *ImageBuffer) []byte {
  var writer *BitWriter= CreateNew_BitWriter();
  this.writeMarkers(writer, img.width, img.height);
  var mcuWidth int64= int64((float64((img.width + int64(7))) / float64(int64(8))));
  var mcuHeight int64= int64((float64((img.height + int64(7))) / float64(int64(8))));
  this.prevDCY = int64(0); 
  this.prevDCCb = int64(0); 
  this.prevDCCr = int64(0); 
  var mcuY int64= int64(0);
  for mcuY < mcuHeight {
    var mcuX int64= int64(0);
    for mcuX < mcuWidth {
      var blockX int64= mcuX * int64(8);
      var blockY int64= mcuY * int64(8);
      var yBlock []int64= this.extractBlock(img, blockX, blockY, int64(0));
      var yCoeffs []int64= this.fdct.value.(*FDCT).transform(yBlock);
      this.encodeBlock(writer, yCoeffs, this.yQuantTable, this.dcYCodes, this.dcYLengths, this.acYCodes, this.acYLengths, this.prevDCY);
      var yZig []int64= this.fdct.value.(*FDCT).zigzag(yCoeffs);
      var yQ int64= this.yQuantTable[int64(0)];
      var yDC int64= yZig[int64(0)];
      if  yDC >= int64(0) {
        this.prevDCY = int64((float64((yDC + (int64(yQ >> uint(int64(1)))))) / float64(yQ))); 
      } else {
        this.prevDCY = int64((float64((yDC - (int64(yQ >> uint(int64(1)))))) / float64(yQ))); 
      }
      var cbBlock []int64= this.extractBlock(img, blockX, blockY, int64(1));
      var cbCoeffs []int64= this.fdct.value.(*FDCT).transform(cbBlock);
      this.encodeBlock(writer, cbCoeffs, this.cQuantTable, this.dcCCodes, this.dcCLengths, this.acCCodes, this.acCLengths, this.prevDCCb);
      var cbZig []int64= this.fdct.value.(*FDCT).zigzag(cbCoeffs);
      var cbQ int64= this.cQuantTable[int64(0)];
      var cbDC int64= cbZig[int64(0)];
      if  cbDC >= int64(0) {
        this.prevDCCb = int64((float64((cbDC + (int64(cbQ >> uint(int64(1)))))) / float64(cbQ))); 
      } else {
        this.prevDCCb = int64((float64((cbDC - (int64(cbQ >> uint(int64(1)))))) / float64(cbQ))); 
      }
      var crBlock []int64= this.extractBlock(img, blockX, blockY, int64(2));
      var crCoeffs []int64= this.fdct.value.(*FDCT).transform(crBlock);
      this.encodeBlock(writer, crCoeffs, this.cQuantTable, this.dcCCodes, this.dcCLengths, this.acCCodes, this.acCLengths, this.prevDCCr);
      var crZig []int64= this.fdct.value.(*FDCT).zigzag(crCoeffs);
      var crQ int64= this.cQuantTable[int64(0)];
      var crDC int64= crZig[int64(0)];
      if  crDC >= int64(0) {
        this.prevDCCr = int64((float64((crDC + (int64(crQ >> uint(int64(1)))))) / float64(crQ))); 
      } else {
        this.prevDCCr = int64((float64((crDC - (int64(crQ >> uint(int64(1)))))) / float64(crQ))); 
      }
      mcuX = mcuX + int64(1); 
    }
    mcuY = mcuY + int64(1); 
  }
  writer.flushByte();
  var outBuf []byte= writer.getBuffer();
  var outLen int64= writer.getLength();
  var finalBuf []byte= make([]byte, (outLen + int64(2)));
  var i int64= int64(0);
  for i < outLen {
    finalBuf[i] = byte(int64(outBuf[i]))
    i = i + int64(1); 
  }
  finalBuf[outLen] = byte(int64(255))
  finalBuf[outLen + int64(1)] = byte(int64(217))
  return finalBuf
}
func (this *JPEGEncoder) encode (img *ImageBuffer, dirPath string, fileName string) () {
  fmt.Println( "Encoding JPEG: " + fileName )
  fmt.Println( (("  Image size: " + (strconv.FormatInt(img.width, 10))) + "x") + (strconv.FormatInt(img.height, 10)) )
  var writer *BitWriter= CreateNew_BitWriter();
  this.writeMarkers(writer, img.width, img.height);
  var mcuWidth int64= int64((float64((img.width + int64(7))) / float64(int64(8))));
  var mcuHeight int64= int64((float64((img.height + int64(7))) / float64(int64(8))));
  fmt.Println( (("  MCU grid: " + (strconv.FormatInt(mcuWidth, 10))) + "x") + (strconv.FormatInt(mcuHeight, 10)) )
  this.prevDCY = int64(0); 
  this.prevDCCb = int64(0); 
  this.prevDCCr = int64(0); 
  var mcuY int64= int64(0);
  for mcuY < mcuHeight {
    var mcuX int64= int64(0);
    for mcuX < mcuWidth {
      var blockX int64= mcuX * int64(8);
      var blockY int64= mcuY * int64(8);
      var yBlock []int64= this.extractBlock(img, blockX, blockY, int64(0));
      var yCoeffs []int64= this.fdct.value.(*FDCT).transform(yBlock);
      this.encodeBlock(writer, yCoeffs, this.yQuantTable, this.dcYCodes, this.dcYLengths, this.acYCodes, this.acYLengths, this.prevDCY);
      var yZig []int64= this.fdct.value.(*FDCT).zigzag(yCoeffs);
      var yQ int64= this.yQuantTable[int64(0)];
      var yDC int64= yZig[int64(0)];
      if  yDC >= int64(0) {
        this.prevDCY = int64((float64((yDC + (int64(yQ >> uint(int64(1)))))) / float64(yQ))); 
      } else {
        this.prevDCY = int64((float64((yDC - (int64(yQ >> uint(int64(1)))))) / float64(yQ))); 
      }
      var cbBlock []int64= this.extractBlock(img, blockX, blockY, int64(1));
      var cbCoeffs []int64= this.fdct.value.(*FDCT).transform(cbBlock);
      this.encodeBlock(writer, cbCoeffs, this.cQuantTable, this.dcCCodes, this.dcCLengths, this.acCCodes, this.acCLengths, this.prevDCCb);
      var cbZig []int64= this.fdct.value.(*FDCT).zigzag(cbCoeffs);
      var cbQ int64= this.cQuantTable[int64(0)];
      var cbDC int64= cbZig[int64(0)];
      if  cbDC >= int64(0) {
        this.prevDCCb = int64((float64((cbDC + (int64(cbQ >> uint(int64(1)))))) / float64(cbQ))); 
      } else {
        this.prevDCCb = int64((float64((cbDC - (int64(cbQ >> uint(int64(1)))))) / float64(cbQ))); 
      }
      var crBlock []int64= this.extractBlock(img, blockX, blockY, int64(2));
      var crCoeffs []int64= this.fdct.value.(*FDCT).transform(crBlock);
      this.encodeBlock(writer, crCoeffs, this.cQuantTable, this.dcCCodes, this.dcCLengths, this.acCCodes, this.acCLengths, this.prevDCCr);
      var crZig []int64= this.fdct.value.(*FDCT).zigzag(crCoeffs);
      var crQ int64= this.cQuantTable[int64(0)];
      var crDC int64= crZig[int64(0)];
      if  crDC >= int64(0) {
        this.prevDCCr = int64((float64((crDC + (int64(crQ >> uint(int64(1)))))) / float64(crQ))); 
      } else {
        this.prevDCCr = int64((float64((crDC - (int64(crQ >> uint(int64(1)))))) / float64(crQ))); 
      }
      mcuX = mcuX + int64(1); 
    }
    mcuY = mcuY + int64(1); 
  }
  writer.flushByte();
  var outBuf []byte= writer.getBuffer();
  var outLen int64= writer.getLength();
  var finalBuf []byte= make([]byte, (outLen + int64(2)));
  var i int64= int64(0);
  for i < outLen {
    finalBuf[i] = byte(int64(outBuf[i]))
    i = i + int64(1); 
  }
  finalBuf[outLen] = byte(int64(255))
  finalBuf[outLen + int64(1)] = byte(int64(217))
  os.WriteFile(dirPath + "/" + fileName, finalBuf, 0644)
  fmt.Println( ("  Encoded size: " + (strconv.FormatInt((outLen + int64(2)), 10))) + " bytes" )
  fmt.Println( (("  Saved: " + dirPath) + "/") + fileName )
}
func (this *JPEGEncoder) setQuality (q int64) () {
  this.quality = q; 
  this.scaleQuantTables(q);
}
type EmbeddedFont struct { 
  name string `json:"name"` 
  fontObjNum int64 /**  unused  **/  `json:"fontObjNum"` 
  fontDescObjNum int64 /**  unused  **/  `json:"fontDescObjNum"` 
  fontFileObjNum int64 /**  unused  **/  `json:"fontFileObjNum"` 
  pdfName string `json:"pdfName"` 
  ttfFont *GoNullable `json:"ttfFont"` 
}

func CreateNew_EmbeddedFont(n string, pn string, font *TrueTypeFont) *EmbeddedFont {
  me := new(EmbeddedFont)
  me.name = ""
  me.fontObjNum = int64(0)
  me.fontDescObjNum = int64(0)
  me.fontFileObjNum = int64(0)
  me.pdfName = ""
  me.ttfFont = new(GoNullable);
  me.name = n; 
  me.pdfName = pn; 
  me.ttfFont.value = font;
  me.ttfFont.has_value = true; /* detected as non-optional */
  return me;
}
type EmbeddedImage struct { 
  src string `json:"src"` 
  objNum int64 `json:"objNum"` 
  width int64 `json:"width"` 
  height int64 `json:"height"` 
  orientation int64 `json:"orientation"` 
  pdfName string `json:"pdfName"` 
}

func CreateNew_EmbeddedImage(s string) *EmbeddedImage {
  me := new(EmbeddedImage)
  me.src = ""
  me.objNum = int64(0)
  me.width = int64(0)
  me.height = int64(0)
  me.orientation = int64(1)
  me.pdfName = ""
  me.src = s; 
  return me;
}
type PDFImageMeasurer struct { 
  renderer *GoNullable `json:"renderer"` 
  // inherited from parent class EVGImageMeasurer
}
type IFACE_PDFImageMeasurer interface { 
  Get_renderer() *GoNullable
  Set_renderer(value *GoNullable) 
  setRenderer(r *EVGPDFRenderer) ()
  getImageDimensions(src string) *EVGImageDimensions
}

func CreateNew_PDFImageMeasurer() *PDFImageMeasurer {
  me := new(PDFImageMeasurer)
  me.renderer = new(GoNullable);
  return me;
}
func (this *PDFImageMeasurer) setRenderer (r *EVGPDFRenderer) () {
  this.renderer.value = r;
  this.renderer.has_value = true; /* detected as non-optional */
}
func (this *PDFImageMeasurer) getImageDimensions (src string) *EVGImageDimensions {
  if  this.renderer.has_value {
    return ((this.renderer.value.(*EVGPDFRenderer))).loadImageDimensions(src)
  }
  var dims *EVGImageDimensions= CreateNew_EVGImageDimensions();
  return dims
}
// inherited methods from parent class EVGImageMeasurer
func (this *PDFImageMeasurer) calculateHeightForWidth (src string, targetWidth float64) float64 {
  var dims *EVGImageDimensions= this.getImageDimensions(src);
  if  dims.isValid {
    return targetWidth / dims.aspectRatio
  }
  return targetWidth
}
func (this *PDFImageMeasurer) calculateWidthForHeight (src string, targetHeight float64) float64 {
  var dims *EVGImageDimensions= this.getImageDimensions(src);
  if  dims.isValid {
    return targetHeight * dims.aspectRatio
  }
  return targetHeight
}
func (this *PDFImageMeasurer) calculateFitDimensions (src string, maxWidth float64, maxHeight float64) *EVGImageDimensions {
  var dims *EVGImageDimensions= this.getImageDimensions(src);
  if  dims.isValid == false {
    return EVGImageDimensions_static_create((int64(maxWidth)), (int64(maxHeight)))
  }
  var scaleW float64= maxWidth / (float64( dims.width ));
  var scaleH float64= maxHeight / (float64( dims.height ));
  var scale float64= scaleW;
  if  scaleH < scaleW {
    scale = scaleH; 
  }
  var newW int64= int64(((float64( dims.width )) * scale));
  var newH int64= int64(((float64( dims.height )) * scale));
  return EVGImageDimensions_static_create(newW, newH)
}
// getter for variable renderer
func (this *PDFImageMeasurer) Get_renderer() *GoNullable {
  return this.renderer
}
// setter for variable renderer
func (this *PDFImageMeasurer) Set_renderer( value *GoNullable)  {
  this.renderer = value 
}
// inherited getters and setters from the parent class EVGImageMeasurer
type EVGPDFRenderer struct { 
  imageMeasurer *GoNullable `json:"imageMeasurer"` 
  writer *GoNullable `json:"writer"` 
  layout *GoNullable `json:"layout"` 
  measurer *GoNullable `json:"measurer"` 
  streamBuffer *GoNullable `json:"streamBuffer"` 
  pageWidth float64 `json:"pageWidth"` 
  pageHeight float64 `json:"pageHeight"` 
  nextObjNum int64 `json:"nextObjNum"` 
  fontObjNum int64 /**  unused  **/  `json:"fontObjNum"` 
  pagesObjNum int64 `json:"pagesObjNum"` 
  contentObjNums []int64 `json:"contentObjNums"` 
  pageCount int64 /**  unused  **/  `json:"pageCount"` 
  debug bool `json:"debug"` 
  fontManager *FontManager `json:"fontManager"` 
  embeddedFonts []*EmbeddedFont `json:"embeddedFonts"` 
  usedFontNames []string `json:"usedFontNames"` 
  embeddedImages []*EmbeddedImage `json:"embeddedImages"` 
  jpegReader *JPEGReader /**  unused  **/  `json:"jpegReader"` 
  jpegDecoder *JPEGDecoder `json:"jpegDecoder"` 
  jpegEncoder *JPEGEncoder `json:"jpegEncoder"` 
  metadataParser *JPEGMetadataParser `json:"metadataParser"` 
  baseDir string `json:"baseDir"` 
  assetPaths []string `json:"assetPaths"` 
  maxImageWidth int64 `json:"maxImageWidth"` 
  maxImageHeight int64 `json:"maxImageHeight"` 
  jpegQuality int64 `json:"jpegQuality"` 
  imageDimensionsCache []*EVGImageDimensions `json:"imageDimensionsCache"` 
  imageDimensionsCacheKeys []string `json:"imageDimensionsCacheKeys"` 
  foundSections []*EVGElement `json:"foundSections"` 
  foundPages []*EVGElement `json:"foundPages"` 
}

func CreateNew_EVGPDFRenderer() *EVGPDFRenderer {
  me := new(EVGPDFRenderer)
  me.pageWidth = 595.0
  me.pageHeight = 842.0
  me.nextObjNum = int64(1)
  me.fontObjNum = int64(0)
  me.pagesObjNum = int64(0)
  me.contentObjNums = make([]int64,0)
  me.pageCount = int64(1)
  me.debug = false
  me.fontManager = CreateNew_FontManager()
  me.embeddedFonts = make([]*EmbeddedFont,0)
  me.usedFontNames = make([]string,0)
  me.embeddedImages = make([]*EmbeddedImage,0)
  me.jpegReader = CreateNew_JPEGReader()
  me.jpegDecoder = CreateNew_JPEGDecoder()
  me.jpegEncoder = CreateNew_JPEGEncoder()
  me.metadataParser = CreateNew_JPEGMetadataParser()
  me.baseDir = "./"
  me.assetPaths = make([]string,0)
  me.maxImageWidth = int64(800)
  me.maxImageHeight = int64(800)
  me.jpegQuality = int64(75)
  me.imageDimensionsCache = make([]*EVGImageDimensions,0)
  me.imageDimensionsCacheKeys = make([]string,0)
  me.foundSections = make([]*EVGElement,0)
  me.foundPages = make([]*EVGElement,0)
  me.imageMeasurer = new(GoNullable);
  me.writer = new(GoNullable);
  me.layout = new(GoNullable);
  me.measurer = new(GoNullable);
  me.streamBuffer = new(GoNullable);
  var w *PDFWriter= CreateNew_PDFWriter();
  me.writer.value = w;
  me.writer.has_value = true; /* detected as non-optional */
  var lay *EVGLayout= CreateNew_EVGLayout();
  me.layout.value = lay;
  me.layout.has_value = true; /* detected as non-optional */
  var m_1 *SimpleTextMeasurer= CreateNew_SimpleTextMeasurer();
  me.measurer.value = m_1;
  me.measurer.has_value = true; /* detected as non-optional */
  var buf_1 *GrowableBuffer= CreateNew_GrowableBuffer();
  me.streamBuffer.value = buf_1;
  me.streamBuffer.has_value = true; /* detected as non-optional */
  var ef []*EmbeddedFont = make([]*EmbeddedFont, 0);
  me.embeddedFonts = ef; 
  var uf []string = make([]string, 0);
  me.usedFontNames = uf; 
  var ei []*EmbeddedImage = make([]*EmbeddedImage, 0);
  me.embeddedImages = ei; 
  var idc []*EVGImageDimensions = make([]*EVGImageDimensions, 0);
  me.imageDimensionsCache = idc; 
  var idck []string = make([]string, 0);
  me.imageDimensionsCacheKeys = idck; 
  var ap []string = make([]string, 0);
  me.assetPaths = ap; 
  var fs []*EVGElement = make([]*EVGElement, 0);
  me.foundSections = fs; 
  var fp []*EVGElement = make([]*EVGElement, 0);
  me.foundPages = fp; 
  var imgMeasurer *PDFImageMeasurer= CreateNew_PDFImageMeasurer();
  me.imageMeasurer.value = imgMeasurer;
  me.imageMeasurer.has_value = true; /* detected as non-optional */
  return me;
}
func (this *EVGPDFRenderer) init (selfRc *EVGPDFRenderer) () {
  var imgM *PDFImageMeasurer= this.imageMeasurer.value.(*PDFImageMeasurer);
  imgM.setRenderer(selfRc);
  this.layout.value.(*EVGLayout).setImageMeasurer(imgM);
}
func (this *EVGPDFRenderer) setPageSize (width float64, height float64) () {
  this.pageWidth = width; 
  this.pageHeight = height; 
  this.layout.value.(*EVGLayout).setPageSize(width, height);
}
func (this *EVGPDFRenderer) setBaseDir (dir string) () {
  this.baseDir = dir; 
}
func (this *EVGPDFRenderer) setAssetPaths (paths string) () {
  var start int64= int64(0);
  var i int64= int64(0);
  var __len int64= int64(len([]rune(paths)));
  for i <= __len {
    var ch string= "";
    if  i < __len {
      ch = string([]rune(paths)[i:(i + int64(1))]); 
    }
    if  (ch == ";") || (i == __len) {
      if  i > start {
        var part string= string([]rune(paths)[start:i]);
        this.assetPaths = append(this.assetPaths,part); 
        fmt.Println( "EVGPDFRenderer: Added asset path: " + part )
      }
      start = i + int64(1); 
    }
    i = i + int64(1); 
  }
}
func (this *EVGPDFRenderer) resolveImagePath (src string) string {
  var imgSrc string= src;
  if  (int64(len([]rune(src)))) > int64(2) {
    var prefix string= string([]rune(src)[int64(0):int64(2)]);
    if  prefix == "./" {
      imgSrc = string([]rune(src)[int64(2):(int64(len([]rune(src))))]); 
    }
  }
  var fullPath string= this.baseDir + imgSrc;
  return fullPath
}
func (this *EVGPDFRenderer) setMeasurer (m IFACE_EVGTextMeasurer) () {
  this.measurer.value = m;
  this.measurer.has_value = true; /* detected as non-optional */
  this.layout.value.(*EVGLayout).setMeasurer(m);
}
func (this *EVGPDFRenderer) setFontManager (fm *FontManager) () {
  this.fontManager = fm; 
}
func (this *EVGPDFRenderer) setDebug (enabled bool) () {
  this.layout.value.(*EVGLayout).debug = enabled; 
  this.debug = enabled; 
}
func (this *EVGPDFRenderer) loadImageDimensions (src string) *EVGImageDimensions {
  var i int64= int64(0);
  for i < (int64(len(this.imageDimensionsCacheKeys))) {
    var key string= this.imageDimensionsCacheKeys[i];
    if  key == src {
      return this.imageDimensionsCache[i]
    }
    i = i + int64(1); 
  }
  var dims *EVGImageDimensions= CreateNew_EVGImageDimensions();
  var imgDir string= "";
  var imgFile string= "";
  var imgSrc string= src;
  if  (int64(len([]rune(src)))) > int64(2) {
    var prefix string= string([]rune(src)[int64(0):int64(2)]);
    if  prefix == "./" {
      imgSrc = string([]rune(src)[int64(2):(int64(len([]rune(src))))]); 
    }
  }
  var lastSlash int64= int64(strings.LastIndex(imgSrc, "/"));
  var lastBackslash int64= int64(strings.LastIndex(imgSrc, "\\"));
  var lastSep int64= lastSlash;
  if  lastBackslash > lastSep {
    lastSep = lastBackslash; 
  }
  if  lastSep >= int64(0) {
    imgDir = this.baseDir + (string([]rune(imgSrc)[int64(0):(lastSep + int64(1))])); 
    imgFile = string([]rune(imgSrc)[(lastSep + int64(1)):(int64(len([]rune(imgSrc))))]); 
  } else {
    imgDir = this.baseDir; 
    imgFile = imgSrc; 
  }
  var reader *JPEGReader= CreateNew_JPEGReader();
  var jpegImage *JPEGImage= reader.readJPEG(imgDir, imgFile);
  if  jpegImage.isValid {
    var metaInfo *JPEGMetadataInfo= this.metadataParser.parseMetadata(imgDir, imgFile);
    var orientation int64= metaInfo.orientation;
    var imgW int64= jpegImage.width;
    var imgH int64= jpegImage.height;
    if  (((orientation == int64(5)) || (orientation == int64(6))) || (orientation == int64(7))) || (orientation == int64(8)) {
      var tmp int64= imgW;
      imgW = imgH; 
      imgH = tmp; 
    }
    dims = EVGImageDimensions_static_create(imgW, imgH); 
    fmt.Println( ((((((("Image dimensions: " + src) + " = ") + (strconv.FormatInt(imgW, 10))) + "x") + (strconv.FormatInt(imgH, 10))) + " (orientation=") + (strconv.FormatInt(orientation, 10))) + ")" )
  }
  this.imageDimensionsCacheKeys = append(this.imageDimensionsCacheKeys,src); 
  this.imageDimensionsCache = append(this.imageDimensionsCache,dims); 
  return dims
}
func (this *EVGPDFRenderer) getPdfFontName (fontFamily string) string {
  var i int64= int64(0);
  for i < (int64(len(this.usedFontNames))) {
    var name string= this.usedFontNames[i];
    if  name == fontFamily {
      return "/F" + (strconv.FormatInt((i + int64(1)), 10))
    }
    i = i + int64(1); 
  }
  this.usedFontNames = append(this.usedFontNames,fontFamily); 
  return "/F" + (strconv.FormatInt((int64(len(this.usedFontNames))), 10))
}
func (this *EVGPDFRenderer) render (root *EVGElement) []byte {
  if  root.tagName == "print" {
    return this.renderMultiPageToPDF(root)
  }
  this.layout.value.(*EVGLayout).layout(root);
  return this.renderToPDF(root)
}
func (this *EVGPDFRenderer) findPageElementsRecursive (el *EVGElement) () {
  if  el.tagName == "page" {
    this.foundPages = append(this.foundPages,el); 
  }
  var i int64= int64(0);
  var childCount int64= el.getChildCount();
  for i < childCount {
    var child *EVGElement= el.getChild(i);
    this.findPageElementsRecursive(child);
    i = i + int64(1); 
  }
}
func (this *EVGPDFRenderer) findSectionElementsRecursive (el *EVGElement) () {
  var i int64= int64(0);
  var childCount int64= el.getChildCount();
  for i < childCount {
    var child *EVGElement= el.getChild(i);
    if  child.tagName == "section" {
      this.foundSections = append(this.foundSections,child); 
    }
    i = i + int64(1); 
  }
}
func (this *EVGPDFRenderer) getSectionPageWidth (section *EVGElement) float64 {
  if  section.width.value.(*EVGUnit).isSet {
    return section.width.value.(*EVGUnit).pixels
  }
  return 595.0
}
func (this *EVGPDFRenderer) getSectionPageHeight (section *EVGElement) float64 {
  if  section.height.value.(*EVGUnit).isSet {
    return section.height.value.(*EVGUnit).pixels
  }
  return 842.0
}
func (this *EVGPDFRenderer) getSectionMargin (section *EVGElement) float64 {
  var m *GoNullable = new(GoNullable); 
  m.value = section.box.value.(*EVGBox).marginTop.value;
  m.has_value = section.box.value.(*EVGBox).marginTop.has_value;
  if  m.value.(*EVGUnit).isSet {
    return m.value.(*EVGUnit).pixels
  }
  return 40.0
}
func (this *EVGPDFRenderer) renderMultiPageToPDF (root *EVGElement) []byte {
  var pdf *GrowableBuffer= CreateNew_GrowableBuffer();
  this.nextObjNum = int64(1); 
  this.contentObjNums = this.contentObjNums[:0]
  this.usedFontNames = this.usedFontNames[:0]
  this.embeddedFonts = this.embeddedFonts[:0]
  this.embeddedImages = this.embeddedImages[:0]
  if  root.imageQuality > int64(0) {
    this.jpegQuality = root.imageQuality; 
    fmt.Println( "Image quality: " + (strconv.FormatInt(this.jpegQuality, 10)) )
  }
  if  root.maxImageSize > int64(0) {
    this.maxImageWidth = root.maxImageSize; 
    this.maxImageHeight = root.maxImageSize; 
    fmt.Println( ("Max image size: " + (strconv.FormatInt(this.maxImageWidth, 10))) + "px" )
  }
  pdf.writeString("%PDF-1.5\n");
  pdf.writeByte(int64(37));
  pdf.writeByte(int64(226));
  pdf.writeByte(int64(227));
  pdf.writeByte(int64(207));
  pdf.writeByte(int64(211));
  pdf.writeByte(int64(10));
  var objectOffsets []int64 = make([]int64, 0);
  var emptyArr []*EVGElement = make([]*EVGElement, 0);
  this.foundSections = emptyArr; 
  this.findSectionElementsRecursive(root);
  var allPages []*EVGElement = make([]*EVGElement, 0);
  var allPageWidths []float64 = make([]float64, 0);
  var allPageHeights []float64 = make([]float64, 0);
  var allPageMargins []float64 = make([]float64, 0);
  var si int64= int64(0);
  for si < (int64(len(this.foundSections))) {
    var section *EVGElement= this.foundSections[si];
    var sectionWidth float64= this.getSectionPageWidth(section);
    var sectionHeight float64= this.getSectionPageHeight(section);
    var sectionMargin float64= this.getSectionMargin(section);
    var emptyPages []*EVGElement = make([]*EVGElement, 0);
    this.foundPages = emptyPages; 
    this.findPageElementsRecursive(section);
    var pi int64= int64(0);
    for pi < (int64(len(this.foundPages))) {
      var pg *EVGElement= this.foundPages[pi];
      allPages = append(allPages,pg); 
      allPageWidths = append(allPageWidths,sectionWidth); 
      allPageHeights = append(allPageHeights,sectionHeight); 
      allPageMargins = append(allPageMargins,sectionMargin); 
      var contentWidth float64= sectionWidth - (sectionMargin * 2.0);
      var contentHeight float64= sectionHeight - (sectionMargin * 2.0);
      fmt.Println( (((("Page " + (strconv.FormatInt((pi + int64(1)), 10))) + " content size: ") + (strconv.FormatFloat(contentWidth,'f', 6, 64))) + " x ") + (strconv.FormatFloat(contentHeight,'f', 6, 64)) )
      this.layout.value.(*EVGLayout).pageWidth = contentWidth; 
      this.layout.value.(*EVGLayout).pageHeight = contentHeight; 
      pg.resetLayoutState();
      pg.width.value.(*EVGUnit).pixels = contentWidth; 
      pg.width.value.(*EVGUnit).value = contentWidth; 
      pg.width.value.(*EVGUnit).unitType = int64(0); 
      pg.width.value.(*EVGUnit).isSet = true; 
      pg.height.value.(*EVGUnit).pixels = contentHeight; 
      pg.height.value.(*EVGUnit).value = contentHeight; 
      pg.height.value.(*EVGUnit).unitType = int64(0); 
      pg.height.value.(*EVGUnit).isSet = true; 
      this.layout.value.(*EVGLayout).layout(pg);
      fmt.Println( (("  After layout: pg.calculatedWidth=" + (strconv.FormatFloat(pg.calculatedWidth,'f', 6, 64))) + " pg.calculatedHeight=") + (strconv.FormatFloat(pg.calculatedHeight,'f', 6, 64)) )
      if  pg.getChildCount() > int64(0) {
        var firstChild *EVGElement= pg.getChild(int64(0));
        fmt.Println( (("  First child: w=" + (strconv.FormatFloat(firstChild.calculatedWidth,'f', 6, 64))) + " h=") + (strconv.FormatFloat(firstChild.calculatedHeight,'f', 6, 64)) )
      }
      pi = pi + int64(1); 
    }
    si = si + int64(1); 
  }
  if  (int64(len(allPages))) == int64(0) {
    this.layout.value.(*EVGLayout).layout(root);
    allPages = append(allPages,root); 
    allPageWidths = append(allPageWidths,this.pageWidth); 
    allPageHeights = append(allPageHeights,this.pageHeight); 
    allPageMargins = append(allPageMargins,0.0); 
  }
  var numPages int64= int64(len(allPages));
  fmt.Println( ("Rendering " + (strconv.FormatInt(numPages, 10))) + " pages" )
  var contentDataList [][]byte = make([][]byte, 0);
  var pgi int64= int64(0);
  for pgi < numPages {
    var pg_1 *EVGElement= allPages[pgi];
    /** unused:  pgWidth*/
    var pgHeight float64= allPageHeights[pgi];
    var pgMargin float64= allPageMargins[pgi];
    this.pageHeight = pgHeight; 
    (this.streamBuffer).value.(*GrowableBuffer).clear();
    this.renderElement(pg_1, pgMargin, pgMargin);
    var contentData []byte= this.streamBuffer.value.(*GrowableBuffer).toBuffer();
    contentDataList = append(contentDataList,contentData); 
    fmt.Println( ((("  Page " + (strconv.FormatInt((pgi + int64(1)), 10))) + ": ") + (strconv.FormatInt((int64(len(contentData))), 10))) + " bytes" )
    pgi = pgi + int64(1); 
  }
  var fontObjNums []int64 = make([]int64, 0);
  var fi int64= int64(0);
  for fi < (int64(len(this.usedFontNames))) {
    var fontName string= this.usedFontNames[fi];
    var ttfFont *TrueTypeFont= this.fontManager.getFont(fontName);
    if  ttfFont.unitsPerEm > int64(0) {
      var fontFileData []byte= ttfFont.getFontData();
      var fontFileLen int64= int64(len(fontFileData));
      objectOffsets = append(objectOffsets,(pdf).size()); 
      pdf.writeString((strconv.FormatInt(this.nextObjNum, 10)) + " 0 obj\n");
      pdf.writeString(((("<< /Length " + (strconv.FormatInt(fontFileLen, 10))) + " /Length1 ") + (strconv.FormatInt(fontFileLen, 10))) + " >>\n");
      pdf.writeString("stream\n");
      pdf.writeBuffer(fontFileData);
      pdf.writeString("\nendstream\n");
      pdf.writeString("endobj\n\n");
      var fontFileObjNum int64= this.nextObjNum;
      this.nextObjNum = this.nextObjNum + int64(1); 
      objectOffsets = append(objectOffsets,(pdf).size()); 
      pdf.writeString((strconv.FormatInt(this.nextObjNum, 10)) + " 0 obj\n");
      pdf.writeString("<< /Type /FontDescriptor");
      pdf.writeString(" /FontName /" + this.sanitizeFontName(ttfFont.fontFamily));
      pdf.writeString(" /Flags 32");
      pdf.writeString((((" /FontBBox [0 " + (strconv.FormatInt(ttfFont.descender, 10))) + " 1000 ") + (strconv.FormatInt(ttfFont.ascender, 10))) + "]");
      pdf.writeString(" /ItalicAngle 0");
      pdf.writeString(" /Ascent " + (strconv.FormatInt(ttfFont.ascender, 10)));
      pdf.writeString(" /Descent " + (strconv.FormatInt(ttfFont.descender, 10)));
      pdf.writeString(" /CapHeight " + (strconv.FormatInt(ttfFont.ascender, 10)));
      pdf.writeString(" /StemV 80");
      pdf.writeString((" /FontFile2 " + (strconv.FormatInt(fontFileObjNum, 10))) + " 0 R");
      pdf.writeString(" >>\n");
      pdf.writeString("endobj\n\n");
      var fontDescObjNum int64= this.nextObjNum;
      this.nextObjNum = this.nextObjNum + int64(1); 
      objectOffsets = append(objectOffsets,(pdf).size()); 
      pdf.writeString((strconv.FormatInt(this.nextObjNum, 10)) + " 0 obj\n");
      var toUnicodeStream string= "/CIDInit /ProcSet findresource begin\n12 dict begin\nbegincmap\n/CIDSystemInfo << /Registry (Adobe) /Ordering (UCS) /Supplement 0 >> def\n/CMapName /Adobe-Identity-UCS def\n/CMapType 2 def\n1 begincodespacerange\n<00> <FF>\nendcodespacerange\n";
      toUnicodeStream = toUnicodeStream + "2 beginbfrange\n<20> <7E> <0020>\n<A0> <FF> <00A0>\nendbfrange\n"; 
      toUnicodeStream = toUnicodeStream + "endcmap\nCMapName currentdict /CMap defineresource pop\nend\nend"; 
      var toUnicodeLen int64= int64(len([]rune(toUnicodeStream)));
      pdf.writeString(("<< /Length " + (strconv.FormatInt(toUnicodeLen, 10))) + " >>\n");
      pdf.writeString("stream\n");
      pdf.writeString(toUnicodeStream);
      pdf.writeString("\nendstream\n");
      pdf.writeString("endobj\n\n");
      var toUnicodeObjNum int64= this.nextObjNum;
      this.nextObjNum = this.nextObjNum + int64(1); 
      objectOffsets = append(objectOffsets,(pdf).size()); 
      pdf.writeString((strconv.FormatInt(this.nextObjNum, 10)) + " 0 obj\n");
      pdf.writeString("<< /Type /Font");
      pdf.writeString(" /Subtype /TrueType");
      pdf.writeString(" /BaseFont /" + this.sanitizeFontName(ttfFont.fontFamily));
      pdf.writeString(" /FirstChar 32");
      pdf.writeString(" /LastChar 255");
      pdf.writeString(" /Widths [");
      var ch int64= int64(32);
      for ch <= int64(255) {
        var cw int64= ttfFont.getCharWidth(ch);
        var scaledWd float64= ((float64( cw )) * 1000.0) / (float64( ttfFont.unitsPerEm ));
        var scaledW int64= int64(scaledWd);
        pdf.writeString(strconv.FormatInt(scaledW, 10));
        if  ch < int64(255) {
          pdf.writeString(" ");
        }
        ch = ch + int64(1); 
      }
      pdf.writeString("]");
      pdf.writeString((" /FontDescriptor " + (strconv.FormatInt(fontDescObjNum, 10))) + " 0 R");
      pdf.writeString(" /Encoding /WinAnsiEncoding");
      pdf.writeString((" /ToUnicode " + (strconv.FormatInt(toUnicodeObjNum, 10))) + " 0 R");
      pdf.writeString(" >>\n");
      pdf.writeString("endobj\n\n");
      fontObjNums = append(fontObjNums,this.nextObjNum); 
      this.nextObjNum = this.nextObjNum + int64(1); 
    } else {
      objectOffsets = append(objectOffsets,(pdf).size()); 
      pdf.writeString((strconv.FormatInt(this.nextObjNum, 10)) + " 0 obj\n");
      pdf.writeString("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\n");
      pdf.writeString("endobj\n\n");
      fontObjNums = append(fontObjNums,this.nextObjNum); 
      this.nextObjNum = this.nextObjNum + int64(1); 
    }
    fi = fi + int64(1); 
  }
  if  (int64(len(fontObjNums))) == int64(0) {
    objectOffsets = append(objectOffsets,(pdf).size()); 
    pdf.writeString((strconv.FormatInt(this.nextObjNum, 10)) + " 0 obj\n");
    pdf.writeString("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\n");
    pdf.writeString("endobj\n\n");
    fontObjNums = append(fontObjNums,this.nextObjNum); 
    this.nextObjNum = this.nextObjNum + int64(1); 
  }
  var imgIdx int64= int64(0);
  for imgIdx < (int64(len(this.embeddedImages))) {
    var embImg *EmbeddedImage= this.embeddedImages[imgIdx];
    var imgSrc string= embImg.src;
    var imgDir string= this.baseDir;
    var imgFile string= imgSrc;
    if  (int64(len([]rune(imgSrc)))) > int64(2) {
      var prefix string= string([]rune(imgSrc)[int64(0):int64(2)]);
      if  prefix == "./" {
        imgSrc = string([]rune(imgSrc)[int64(2):(int64(len([]rune(imgSrc))))]); 
      }
    }
    var lastSlash int64= int64(strings.LastIndex(imgSrc, "/"));
    var lastBackslash int64= int64(strings.LastIndex(imgSrc, "\\"));
    var lastSep int64= lastSlash;
    if  lastBackslash > lastSep {
      lastSep = lastBackslash; 
    }
    if  lastSep >= int64(0) {
      imgDir = this.baseDir + (string([]rune(imgSrc)[int64(0):(lastSep + int64(1))])); 
      imgFile = string([]rune(imgSrc)[(lastSep + int64(1)):(int64(len([]rune(imgSrc))))]); 
    } else {
      imgDir = this.baseDir; 
      imgFile = imgSrc; 
    }
    fmt.Println( (("Loading image: dir=" + imgDir) + " file=") + imgFile )
    var metaInfo *JPEGMetadataInfo= this.metadataParser.parseMetadata(imgDir, imgFile);
    embImg.orientation = metaInfo.orientation; 
    var imgBuffer *ImageBuffer= this.jpegDecoder.decode(imgDir, imgFile);
    if  (imgBuffer.width > int64(1)) && (imgBuffer.height > int64(1)) {
      if  metaInfo.orientation > int64(1) {
        fmt.Println( "  Applying EXIF orientation: " + (strconv.FormatInt(metaInfo.orientation, 10)) )
        imgBuffer = imgBuffer.applyExifOrientation(metaInfo.orientation); 
      }
      var origW int64= imgBuffer.width;
      var origH int64= imgBuffer.height;
      var newW int64= origW;
      var newH int64= origH;
      if  (origW > this.maxImageWidth) || (origH > this.maxImageHeight) {
        var scaleW float64= (float64( this.maxImageWidth )) / (float64( origW ));
        var scaleH float64= (float64( this.maxImageHeight )) / (float64( origH ));
        var scale float64= scaleW;
        if  scaleH < scaleW {
          scale = scaleH; 
        }
        newW = int64(((float64( origW )) * scale)); 
        newH = int64(((float64( origH )) * scale)); 
        fmt.Println( (((((("  Resizing from " + (strconv.FormatInt(origW, 10))) + "x") + (strconv.FormatInt(origH, 10))) + " to ") + (strconv.FormatInt(newW, 10))) + "x") + (strconv.FormatInt(newH, 10)) )
        imgBuffer = imgBuffer.scaleToSize(newW, newH); 
      }
      this.jpegEncoder.setQuality(this.jpegQuality);
      var encodedData []byte= this.jpegEncoder.encodeToBuffer(imgBuffer);
      var encodedLen int64= int64(len(encodedData));
      embImg.width = newW; 
      embImg.height = newH; 
      objectOffsets = append(objectOffsets,(pdf).size()); 
      pdf.writeString((strconv.FormatInt(this.nextObjNum, 10)) + " 0 obj\n");
      pdf.writeString("<< /Type /XObject");
      pdf.writeString(" /Subtype /Image");
      pdf.writeString(" /Width " + (strconv.FormatInt(newW, 10)));
      pdf.writeString(" /Height " + (strconv.FormatInt(newH, 10)));
      pdf.writeString(" /ColorSpace /DeviceRGB");
      pdf.writeString(" /BitsPerComponent 8");
      pdf.writeString(" /Filter /DCTDecode");
      pdf.writeString(" /Length " + (strconv.FormatInt(encodedLen, 10)));
      pdf.writeString(" >>\n");
      pdf.writeString("stream\n");
      pdf.writeBuffer(encodedData);
      pdf.writeString("\nendstream\n");
      pdf.writeString("endobj\n\n");
      embImg.objNum = this.nextObjNum; 
      embImg.pdfName = "/Im" + (strconv.FormatInt((imgIdx + int64(1)), 10)); 
      this.nextObjNum = this.nextObjNum + int64(1); 
      fmt.Println( ((((("Embedded image: " + embImg.src) + " (") + (strconv.FormatInt(newW, 10))) + "x") + (strconv.FormatInt(newH, 10))) + ")" )
    } else {
      fmt.Println( "Failed to decode image: " + embImg.src )
    }
    imgIdx = imgIdx + int64(1); 
  }
  var contentObjNumList []int64 = make([]int64, 0);
  var ci int64= int64(0);
  for ci < numPages {
    var contentData_1 []byte= contentDataList[ci];
    var contentLen int64= int64(len(contentData_1));
    objectOffsets = append(objectOffsets,(pdf).size()); 
    pdf.writeString((strconv.FormatInt(this.nextObjNum, 10)) + " 0 obj\n");
    pdf.writeString(("<< /Length " + (strconv.FormatInt(contentLen, 10))) + " >>\n");
    pdf.writeString("stream\n");
    pdf.writeBuffer(contentData_1);
    pdf.writeString("\nendstream\n");
    pdf.writeString("endobj\n\n");
    contentObjNumList = append(contentObjNumList,this.nextObjNum); 
    this.nextObjNum = this.nextObjNum + int64(1); 
    ci = ci + int64(1); 
  }
  var pageObjNumList []int64 = make([]int64, 0);
  var pagesRefNum int64= this.nextObjNum + numPages;
  var pi2 int64= int64(0);
  for pi2 < numPages {
    var pgWidth_1 float64= allPageWidths[pi2];
    var pgHeight_1 float64= allPageHeights[pi2];
    var contentObjN int64= contentObjNumList[pi2];
    objectOffsets = append(objectOffsets,(pdf).size()); 
    pdf.writeString((strconv.FormatInt(this.nextObjNum, 10)) + " 0 obj\n");
    pdf.writeString(("<< /Type /Page /Parent " + (strconv.FormatInt(pagesRefNum, 10))) + " 0 R");
    pdf.writeString((((" /MediaBox [0 0 " + this.formatNum(pgWidth_1)) + " ") + this.formatNum(pgHeight_1)) + "]");
    pdf.writeString((" /Contents " + (strconv.FormatInt(contentObjN, 10))) + " 0 R");
    pdf.writeString(" /Resources <<");
    pdf.writeString(" /Font <<");
    var ffi int64= int64(0);
    for ffi < (int64(len(fontObjNums))) {
      var fontObjN int64= fontObjNums[ffi];
      pdf.writeString((((" /F" + (strconv.FormatInt((ffi + int64(1)), 10))) + " ") + (strconv.FormatInt(fontObjN, 10))) + " 0 R");
      ffi = ffi + int64(1); 
    }
    pdf.writeString(" >>");
    if  (int64(len(this.embeddedImages))) > int64(0) {
      pdf.writeString(" /XObject <<");
      var ii int64= int64(0);
      for ii < (int64(len(this.embeddedImages))) {
        var embImg_1 *EmbeddedImage= this.embeddedImages[ii];
        if  embImg_1.objNum > int64(0) {
          pdf.writeString((((" /Im" + (strconv.FormatInt((ii + int64(1)), 10))) + " ") + (strconv.FormatInt(embImg_1.objNum, 10))) + " 0 R");
        }
        ii = ii + int64(1); 
      }
      pdf.writeString(" >>");
    }
    pdf.writeString(" >> >>\n");
    pdf.writeString("endobj\n\n");
    pageObjNumList = append(pageObjNumList,this.nextObjNum); 
    this.nextObjNum = this.nextObjNum + int64(1); 
    pi2 = pi2 + int64(1); 
  }
  objectOffsets = append(objectOffsets,(pdf).size()); 
  pdf.writeString((strconv.FormatInt(this.nextObjNum, 10)) + " 0 obj\n");
  pdf.writeString("<< /Type /Pages /Kids [");
  var ki int64= int64(0);
  for ki < numPages {
    var pageObjN int64= pageObjNumList[ki];
    pdf.writeString((strconv.FormatInt(pageObjN, 10)) + " 0 R");
    if  ki < (numPages - int64(1)) {
      pdf.writeString(" ");
    }
    ki = ki + int64(1); 
  }
  pdf.writeString(("] /Count " + (strconv.FormatInt(numPages, 10))) + " >>\n");
  pdf.writeString("endobj\n\n");
  this.pagesObjNum = this.nextObjNum; 
  this.nextObjNum = this.nextObjNum + int64(1); 
  objectOffsets = append(objectOffsets,(pdf).size()); 
  pdf.writeString((strconv.FormatInt(this.nextObjNum, 10)) + " 0 obj\n");
  pdf.writeString(("<< /Type /Catalog /Pages " + (strconv.FormatInt(this.pagesObjNum, 10))) + " 0 R >>\n");
  pdf.writeString("endobj\n\n");
  var catalogObjNum int64= this.nextObjNum;
  this.nextObjNum = this.nextObjNum + int64(1); 
  var xrefOffset int64= (pdf).size();
  pdf.writeString("xref\n");
  pdf.writeString(("0 " + (strconv.FormatInt(this.nextObjNum, 10))) + "\n");
  pdf.writeString("0000000000 65535 f \n");
  var xi int64= int64(0);
  for xi < (int64(len(objectOffsets))) {
    var offset int64= objectOffsets[xi];
    pdf.writeString(this.padLeft((strconv.FormatInt(offset, 10)), int64(10), "0") + " 00000 n \n");
    xi = xi + int64(1); 
  }
  pdf.writeString("trailer\n");
  pdf.writeString(((("<< /Size " + (strconv.FormatInt(this.nextObjNum, 10))) + " /Root ") + (strconv.FormatInt(catalogObjNum, 10))) + " 0 R >>\n");
  pdf.writeString("startxref\n");
  pdf.writeString((strconv.FormatInt(xrefOffset, 10)) + "\n");
  pdf.writeString("%%EOF\n");
  return pdf.toBuffer()
}
func (this *EVGPDFRenderer) renderToPDF (root *EVGElement) []byte {
  var pdf *GrowableBuffer= CreateNew_GrowableBuffer();
  this.nextObjNum = int64(1); 
  this.contentObjNums = this.contentObjNums[:0]
  this.usedFontNames = this.usedFontNames[:0]
  this.embeddedFonts = this.embeddedFonts[:0]
  this.embeddedImages = this.embeddedImages[:0]
  pdf.writeString("%PDF-1.5\n");
  pdf.writeByte(int64(37));
  pdf.writeByte(int64(226));
  pdf.writeByte(int64(227));
  pdf.writeByte(int64(207));
  pdf.writeByte(int64(211));
  pdf.writeByte(int64(10));
  var objectOffsets []int64 = make([]int64, 0);
  (this.streamBuffer).value.(*GrowableBuffer).clear();
  this.renderElement(root, 0.0, 0.0);
  var contentData []byte= this.streamBuffer.value.(*GrowableBuffer).toBuffer();
  var contentLen int64= int64(len(contentData));
  var fontObjNums []int64 = make([]int64, 0);
  var i int64= int64(0);
  for i < (int64(len(this.usedFontNames))) {
    var fontName string= this.usedFontNames[i];
    var ttfFont *TrueTypeFont= this.fontManager.getFont(fontName);
    if  ttfFont.unitsPerEm > int64(0) {
      var fontFileData []byte= ttfFont.getFontData();
      var fontFileLen int64= int64(len(fontFileData));
      objectOffsets = append(objectOffsets,(pdf).size()); 
      pdf.writeString((strconv.FormatInt(this.nextObjNum, 10)) + " 0 obj\n");
      pdf.writeString(((("<< /Length " + (strconv.FormatInt(fontFileLen, 10))) + " /Length1 ") + (strconv.FormatInt(fontFileLen, 10))) + " >>\n");
      pdf.writeString("stream\n");
      pdf.writeBuffer(fontFileData);
      pdf.writeString("\nendstream\n");
      pdf.writeString("endobj\n\n");
      var fontFileObjNum int64= this.nextObjNum;
      this.nextObjNum = this.nextObjNum + int64(1); 
      objectOffsets = append(objectOffsets,(pdf).size()); 
      pdf.writeString((strconv.FormatInt(this.nextObjNum, 10)) + " 0 obj\n");
      pdf.writeString("<< /Type /FontDescriptor");
      pdf.writeString(" /FontName /" + this.sanitizeFontName(ttfFont.fontFamily));
      pdf.writeString(" /Flags 32");
      pdf.writeString((((" /FontBBox [0 " + (strconv.FormatInt(ttfFont.descender, 10))) + " 1000 ") + (strconv.FormatInt(ttfFont.ascender, 10))) + "]");
      pdf.writeString(" /ItalicAngle 0");
      pdf.writeString(" /Ascent " + (strconv.FormatInt(ttfFont.ascender, 10)));
      pdf.writeString(" /Descent " + (strconv.FormatInt(ttfFont.descender, 10)));
      pdf.writeString(" /CapHeight " + (strconv.FormatInt(ttfFont.ascender, 10)));
      pdf.writeString(" /StemV 80");
      pdf.writeString((" /FontFile2 " + (strconv.FormatInt(fontFileObjNum, 10))) + " 0 R");
      pdf.writeString(" >>\n");
      pdf.writeString("endobj\n\n");
      var fontDescObjNum int64= this.nextObjNum;
      this.nextObjNum = this.nextObjNum + int64(1); 
      objectOffsets = append(objectOffsets,(pdf).size()); 
      pdf.writeString((strconv.FormatInt(this.nextObjNum, 10)) + " 0 obj\n");
      var toUnicodeStream string= "/CIDInit /ProcSet findresource begin\n12 dict begin\nbegincmap\n/CIDSystemInfo << /Registry (Adobe) /Ordering (UCS) /Supplement 0 >> def\n/CMapName /Adobe-Identity-UCS def\n/CMapType 2 def\n1 begincodespacerange\n<00> <FF>\nendcodespacerange\n";
      toUnicodeStream = toUnicodeStream + "2 beginbfrange\n<20> <7E> <0020>\n<A0> <FF> <00A0>\nendbfrange\n"; 
      toUnicodeStream = toUnicodeStream + "endcmap\nCMapName currentdict /CMap defineresource pop\nend\nend"; 
      var toUnicodeLen int64= int64(len([]rune(toUnicodeStream)));
      pdf.writeString(("<< /Length " + (strconv.FormatInt(toUnicodeLen, 10))) + " >>\n");
      pdf.writeString("stream\n");
      pdf.writeString(toUnicodeStream);
      pdf.writeString("\nendstream\n");
      pdf.writeString("endobj\n\n");
      var toUnicodeObjNum int64= this.nextObjNum;
      this.nextObjNum = this.nextObjNum + int64(1); 
      objectOffsets = append(objectOffsets,(pdf).size()); 
      pdf.writeString((strconv.FormatInt(this.nextObjNum, 10)) + " 0 obj\n");
      pdf.writeString("<< /Type /Font");
      pdf.writeString(" /Subtype /TrueType");
      pdf.writeString(" /BaseFont /" + this.sanitizeFontName(ttfFont.fontFamily));
      pdf.writeString(" /FirstChar 32");
      pdf.writeString(" /LastChar 255");
      pdf.writeString(" /Widths [");
      var ch int64= int64(32);
      for ch <= int64(255) {
        var w int64= ttfFont.getCharWidth(ch);
        var scaledWd float64= ((float64( w )) * 1000.0) / (float64( ttfFont.unitsPerEm ));
        var scaledW int64= int64(scaledWd);
        pdf.writeString(strconv.FormatInt(scaledW, 10));
        if  ch < int64(255) {
          pdf.writeString(" ");
        }
        ch = ch + int64(1); 
      }
      pdf.writeString("]");
      pdf.writeString((" /FontDescriptor " + (strconv.FormatInt(fontDescObjNum, 10))) + " 0 R");
      pdf.writeString(" /Encoding /WinAnsiEncoding");
      pdf.writeString((" /ToUnicode " + (strconv.FormatInt(toUnicodeObjNum, 10))) + " 0 R");
      pdf.writeString(" >>\n");
      pdf.writeString("endobj\n\n");
      fontObjNums = append(fontObjNums,this.nextObjNum); 
      this.nextObjNum = this.nextObjNum + int64(1); 
    } else {
      objectOffsets = append(objectOffsets,(pdf).size()); 
      pdf.writeString((strconv.FormatInt(this.nextObjNum, 10)) + " 0 obj\n");
      pdf.writeString("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\n");
      pdf.writeString("endobj\n\n");
      fontObjNums = append(fontObjNums,this.nextObjNum); 
      this.nextObjNum = this.nextObjNum + int64(1); 
    }
    i = i + int64(1); 
  }
  if  (int64(len(fontObjNums))) == int64(0) {
    objectOffsets = append(objectOffsets,(pdf).size()); 
    pdf.writeString((strconv.FormatInt(this.nextObjNum, 10)) + " 0 obj\n");
    pdf.writeString("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\n");
    pdf.writeString("endobj\n\n");
    fontObjNums = append(fontObjNums,this.nextObjNum); 
    this.nextObjNum = this.nextObjNum + int64(1); 
  }
  var imgIdx int64= int64(0);
  for imgIdx < (int64(len(this.embeddedImages))) {
    var embImg *EmbeddedImage= this.embeddedImages[imgIdx];
    var imgSrc string= embImg.src;
    var imgDir string= this.baseDir;
    var imgFile string= imgSrc;
    if  (int64(len([]rune(imgSrc)))) > int64(2) {
      var prefix string= string([]rune(imgSrc)[int64(0):int64(2)]);
      if  prefix == "./" {
        imgSrc = string([]rune(imgSrc)[int64(2):(int64(len([]rune(imgSrc))))]); 
      }
    }
    var lastSlash int64= int64(strings.LastIndex(imgSrc, "/"));
    var lastBackslash int64= int64(strings.LastIndex(imgSrc, "\\"));
    var lastSep int64= lastSlash;
    if  lastBackslash > lastSep {
      lastSep = lastBackslash; 
    }
    if  lastSep >= int64(0) {
      imgDir = this.baseDir + (string([]rune(imgSrc)[int64(0):(lastSep + int64(1))])); 
      imgFile = string([]rune(imgSrc)[(lastSep + int64(1)):(int64(len([]rune(imgSrc))))]); 
    } else {
      imgDir = this.baseDir; 
      imgFile = imgSrc; 
    }
    fmt.Println( (("Loading image: dir=" + imgDir) + " file=") + imgFile )
    var metaInfo *JPEGMetadataInfo= this.metadataParser.parseMetadata(imgDir, imgFile);
    embImg.orientation = metaInfo.orientation; 
    var imgBuffer *ImageBuffer= this.jpegDecoder.decode(imgDir, imgFile);
    if  (imgBuffer.width > int64(1)) && (imgBuffer.height > int64(1)) {
      if  metaInfo.orientation > int64(1) {
        fmt.Println( "  Applying EXIF orientation: " + (strconv.FormatInt(metaInfo.orientation, 10)) )
        imgBuffer = imgBuffer.applyExifOrientation(metaInfo.orientation); 
      }
      var origW int64= imgBuffer.width;
      var origH int64= imgBuffer.height;
      var newW int64= origW;
      var newH int64= origH;
      if  (origW > this.maxImageWidth) || (origH > this.maxImageHeight) {
        var scaleW float64= (float64( this.maxImageWidth )) / (float64( origW ));
        var scaleH float64= (float64( this.maxImageHeight )) / (float64( origH ));
        var scale float64= scaleW;
        if  scaleH < scaleW {
          scale = scaleH; 
        }
        newW = int64(((float64( origW )) * scale)); 
        newH = int64(((float64( origH )) * scale)); 
        fmt.Println( (((((("  Resizing from " + (strconv.FormatInt(origW, 10))) + "x") + (strconv.FormatInt(origH, 10))) + " to ") + (strconv.FormatInt(newW, 10))) + "x") + (strconv.FormatInt(newH, 10)) )
        imgBuffer = imgBuffer.scaleToSize(newW, newH); 
      }
      this.jpegEncoder.setQuality(this.jpegQuality);
      var encodedData []byte= this.jpegEncoder.encodeToBuffer(imgBuffer);
      var encodedLen int64= int64(len(encodedData));
      embImg.width = newW; 
      embImg.height = newH; 
      objectOffsets = append(objectOffsets,(pdf).size()); 
      pdf.writeString((strconv.FormatInt(this.nextObjNum, 10)) + " 0 obj\n");
      pdf.writeString("<< /Type /XObject");
      pdf.writeString(" /Subtype /Image");
      pdf.writeString(" /Width " + (strconv.FormatInt(newW, 10)));
      pdf.writeString(" /Height " + (strconv.FormatInt(newH, 10)));
      pdf.writeString(" /ColorSpace /DeviceRGB");
      pdf.writeString(" /BitsPerComponent 8");
      pdf.writeString(" /Filter /DCTDecode");
      pdf.writeString(" /Length " + (strconv.FormatInt(encodedLen, 10)));
      pdf.writeString(" >>\n");
      pdf.writeString("stream\n");
      pdf.writeBuffer(encodedData);
      pdf.writeString("\nendstream\n");
      pdf.writeString("endobj\n\n");
      embImg.objNum = this.nextObjNum; 
      embImg.pdfName = "/Im" + (strconv.FormatInt((imgIdx + int64(1)), 10)); 
      this.nextObjNum = this.nextObjNum + int64(1); 
      fmt.Println( ((((((("Embedded image: " + imgSrc) + " (resized to ") + (strconv.FormatInt(newW, 10))) + "x") + (strconv.FormatInt(newH, 10))) + ", ") + (strconv.FormatInt(encodedLen, 10))) + " bytes)" )
    } else {
      fmt.Println( "Failed to decode image: " + imgSrc )
    }
    imgIdx = imgIdx + int64(1); 
  }
  objectOffsets = append(objectOffsets,(pdf).size()); 
  pdf.writeString((strconv.FormatInt(this.nextObjNum, 10)) + " 0 obj\n");
  pdf.writeString(("<< /Length " + (strconv.FormatInt(contentLen, 10))) + " >>\n");
  pdf.writeString("stream\n");
  pdf.writeBuffer(contentData);
  pdf.writeString("\nendstream\n");
  pdf.writeString("endobj\n\n");
  var contentObjNum int64= this.nextObjNum;
  this.nextObjNum = this.nextObjNum + int64(1); 
  objectOffsets = append(objectOffsets,(pdf).size()); 
  pdf.writeString((strconv.FormatInt(this.nextObjNum, 10)) + " 0 obj\n");
  var pagesRef int64= this.nextObjNum + int64(1);
  pdf.writeString(("<< /Type /Page /Parent " + (strconv.FormatInt(pagesRef, 10))) + " 0 R");
  pdf.writeString((((" /MediaBox [0 0 " + this.formatNum(this.pageWidth)) + " ") + this.formatNum(this.pageHeight)) + "]");
  pdf.writeString((" /Contents " + (strconv.FormatInt(contentObjNum, 10))) + " 0 R");
  pdf.writeString(" /Resources <<");
  pdf.writeString(" /Font <<");
  var fi int64= int64(0);
  for fi < (int64(len(fontObjNums))) {
    var fontObjN int64= fontObjNums[fi];
    pdf.writeString((((" /F" + (strconv.FormatInt((fi + int64(1)), 10))) + " ") + (strconv.FormatInt(fontObjN, 10))) + " 0 R");
    fi = fi + int64(1); 
  }
  pdf.writeString(" >>");
  if  (int64(len(this.embeddedImages))) > int64(0) {
    pdf.writeString(" /XObject <<");
    var ii int64= int64(0);
    for ii < (int64(len(this.embeddedImages))) {
      var embImg_1 *EmbeddedImage= this.embeddedImages[ii];
      if  embImg_1.objNum > int64(0) {
        pdf.writeString((((" /Im" + (strconv.FormatInt((ii + int64(1)), 10))) + " ") + (strconv.FormatInt(embImg_1.objNum, 10))) + " 0 R");
      }
      ii = ii + int64(1); 
    }
    pdf.writeString(" >>");
  }
  pdf.writeString(" >> >>\n");
  pdf.writeString("endobj\n\n");
  var pageObjNum int64= this.nextObjNum;
  this.nextObjNum = this.nextObjNum + int64(1); 
  objectOffsets = append(objectOffsets,(pdf).size()); 
  pdf.writeString((strconv.FormatInt(this.nextObjNum, 10)) + " 0 obj\n");
  pdf.writeString(("<< /Type /Pages /Kids [" + (strconv.FormatInt(pageObjNum, 10))) + " 0 R] /Count 1 >>\n");
  pdf.writeString("endobj\n\n");
  this.pagesObjNum = this.nextObjNum; 
  this.nextObjNum = this.nextObjNum + int64(1); 
  objectOffsets = append(objectOffsets,(pdf).size()); 
  pdf.writeString((strconv.FormatInt(this.nextObjNum, 10)) + " 0 obj\n");
  pdf.writeString(("<< /Type /Catalog /Pages " + (strconv.FormatInt(this.pagesObjNum, 10))) + " 0 R >>\n");
  pdf.writeString("endobj\n\n");
  var catalogObjNum int64= this.nextObjNum;
  this.nextObjNum = this.nextObjNum + int64(1); 
  var xrefOffset int64= (pdf).size();
  pdf.writeString("xref\n");
  pdf.writeString(("0 " + (strconv.FormatInt(this.nextObjNum, 10))) + "\n");
  pdf.writeString("0000000000 65535 f \n");
  var i_2 int64= int64(0);
  for i_2 < (int64(len(objectOffsets))) {
    var offset int64= objectOffsets[i_2];
    pdf.writeString(this.padLeft((strconv.FormatInt(offset, 10)), int64(10), "0") + " 00000 n \n");
    i_2 = i_2 + int64(1); 
  }
  pdf.writeString("trailer\n");
  pdf.writeString(((("<< /Size " + (strconv.FormatInt(this.nextObjNum, 10))) + " /Root ") + (strconv.FormatInt(catalogObjNum, 10))) + " 0 R >>\n");
  pdf.writeString("startxref\n");
  pdf.writeString((strconv.FormatInt(xrefOffset, 10)) + "\n");
  pdf.writeString("%%EOF\n");
  return pdf.toBuffer()
}
func (this *EVGPDFRenderer) renderElement (el *EVGElement, offsetX float64, offsetY float64) () {
  var x float64= el.calculatedX + offsetX;
  var y float64= el.calculatedY + offsetY;
  var w float64= el.calculatedWidth;
  var h float64= el.calculatedHeight;
  var pdfY float64= (this.pageHeight - y) - h;
  var hasClipPath bool= false;
  if  (int64(len([]rune(el.clipPath)))) > int64(0) {
    hasClipPath = true; 
    this.streamBuffer.value.(*GrowableBuffer).writeString("q\n");
    this.applyClipPath(el.clipPath, x, pdfY, w, h);
  }
  var bgColor *EVGColor= el.backgroundColor.value.(*EVGColor);
  if  this.debug {
    fmt.Println( (((("  bg check: " + el.tagName) + " isSet=") + (strconv.FormatBool(bgColor.isSet))) + " r=") + (strconv.FormatFloat(bgColor.r,'f', 6, 64)) )
  }
  if  bgColor.isSet {
    this.renderBackground(x, pdfY, w, h, bgColor);
  }
  this.renderBorder(el, x, pdfY, w, h);
  if  el.tagName == "text" {
    this.renderText(el, x, pdfY, w, h);
  }
  if  el.tagName == "divider" {
    this.renderDivider(el, x, pdfY, w, h);
  }
  if  el.tagName == "image" {
    this.renderImage(el, x, pdfY, w, h);
  }
  if  el.tagName == "path" {
    this.renderPath(el, x, pdfY, w, h);
  }
  var i int64= int64(0);
  var childCount int64= el.getChildCount();
  for i < childCount {
    var child *EVGElement= el.getChild(i);
    this.renderElement(child, offsetX, offsetY);
    i = i + int64(1); 
  }
  if  hasClipPath {
    this.streamBuffer.value.(*GrowableBuffer).writeString("Q\n");
  }
}
func (this *EVGPDFRenderer) getImagePdfName (src string) string {
  var i int64= int64(0);
  for i < (int64(len(this.embeddedImages))) {
    var embImg *EmbeddedImage= this.embeddedImages[i];
    if  embImg.src == src {
      return "/Im" + (strconv.FormatInt((i + int64(1)), 10))
    }
    i = i + int64(1); 
  }
  var newImg *EmbeddedImage= CreateNew_EmbeddedImage(src);
  this.embeddedImages = append(this.embeddedImages,newImg); 
  return "/Im" + (strconv.FormatInt((int64(len(this.embeddedImages))), 10))
}
func (this *EVGPDFRenderer) renderImage (el *EVGElement, x float64, y float64, w float64, h float64) () {
  var src string= el.src;
  if  (int64(len([]rune(src)))) == int64(0) {
    return
  }
  var imgName string= this.getImagePdfName(src);
  this.streamBuffer.value.(*GrowableBuffer).writeString("q\n");
  this.streamBuffer.value.(*GrowableBuffer).writeString(((((((this.formatNum(w) + " 0 0 ") + this.formatNum(h)) + " ") + this.formatNum(x)) + " ") + this.formatNum(y)) + " cm\n");
  this.streamBuffer.value.(*GrowableBuffer).writeString(imgName + " Do\n");
  this.streamBuffer.value.(*GrowableBuffer).writeString("Q\n");
}
func (this *EVGPDFRenderer) renderPath (el *EVGElement, x float64, y float64, w float64, h float64) () {
  var pathData string= el.svgPath;
  if  (int64(len([]rune(pathData)))) == int64(0) {
    return
  }
  var parser *SVGPathParser= CreateNew_SVGPathParser();
  parser.parse(pathData);
  var commands []*PathCommand= parser.getScaledCommands(w, h);
  var fillColor *GoNullable = new(GoNullable); 
  fillColor.value = el.fillColor.value;
  fillColor.has_value = el.fillColor.has_value;
  var strokeColor *GoNullable = new(GoNullable); 
  strokeColor.value = el.strokeColor.value;
  strokeColor.has_value = el.strokeColor.has_value;
  if  fillColor.value.(*EVGColor).isSet == false {
    fillColor.value = el.backgroundColor.value;
    fillColor.has_value = false; 
    if fillColor.value != nil {
      fillColor.has_value = true
    }
  }
  this.streamBuffer.value.(*GrowableBuffer).writeString("q\n");
  this.streamBuffer.value.(*GrowableBuffer).writeString(((("1 0 0 1 " + this.formatNum(x)) + " ") + this.formatNum(y)) + " cm\n");
  this.streamBuffer.value.(*GrowableBuffer).writeString(("1 0 0 -1 0 " + this.formatNum(h)) + " cm\n");
  var i int64= int64(0);
  for i < (int64(len(commands))) {
    var cmd *PathCommand= commands[i];
    if  cmd._type == "M" {
      this.streamBuffer.value.(*GrowableBuffer).writeString(((this.formatNum(cmd.x) + " ") + this.formatNum(cmd.y)) + " m\n");
    }
    if  cmd._type == "L" {
      this.streamBuffer.value.(*GrowableBuffer).writeString(((this.formatNum(cmd.x) + " ") + this.formatNum(cmd.y)) + " l\n");
    }
    if  cmd._type == "C" {
      this.streamBuffer.value.(*GrowableBuffer).writeString(((((((((((this.formatNum(cmd.x1) + " ") + this.formatNum(cmd.y1)) + " ") + this.formatNum(cmd.x2)) + " ") + this.formatNum(cmd.y2)) + " ") + this.formatNum(cmd.x)) + " ") + this.formatNum(cmd.y)) + " c\n");
    }
    if  cmd._type == "Q" {
      this.streamBuffer.value.(*GrowableBuffer).writeString(((((((((((this.formatNum(cmd.x1) + " ") + this.formatNum(cmd.y1)) + " ") + this.formatNum(cmd.x1)) + " ") + this.formatNum(cmd.y1)) + " ") + this.formatNum(cmd.x)) + " ") + this.formatNum(cmd.y)) + " c\n");
    }
    if  cmd._type == "Z" {
      this.streamBuffer.value.(*GrowableBuffer).writeString("h\n");
    }
    i = i + int64(1); 
  }
  if  fillColor.value.(*EVGColor).isSet && strokeColor.value.(*EVGColor).isSet {
    var r float64= fillColor.value.(*EVGColor).r / 255.0;
    var g float64= fillColor.value.(*EVGColor).g / 255.0;
    var b float64= fillColor.value.(*EVGColor).b / 255.0;
    this.streamBuffer.value.(*GrowableBuffer).writeString(((((this.formatNum(r) + " ") + this.formatNum(g)) + " ") + this.formatNum(b)) + " rg\n");
    var sr float64= strokeColor.value.(*EVGColor).r / 255.0;
    var sg float64= strokeColor.value.(*EVGColor).g / 255.0;
    var sb float64= strokeColor.value.(*EVGColor).b / 255.0;
    this.streamBuffer.value.(*GrowableBuffer).writeString(((((this.formatNum(sr) + " ") + this.formatNum(sg)) + " ") + this.formatNum(sb)) + " RG\n");
    if  el.strokeWidth > 0.0 {
      this.streamBuffer.value.(*GrowableBuffer).writeString(this.formatNum(el.strokeWidth) + " w\n");
    }
    this.streamBuffer.value.(*GrowableBuffer).writeString("B\n");
  } else {
    if  fillColor.value.(*EVGColor).isSet {
      var r_1 float64= fillColor.value.(*EVGColor).r / 255.0;
      var g_1 float64= fillColor.value.(*EVGColor).g / 255.0;
      var b_1 float64= fillColor.value.(*EVGColor).b / 255.0;
      this.streamBuffer.value.(*GrowableBuffer).writeString(((((this.formatNum(r_1) + " ") + this.formatNum(g_1)) + " ") + this.formatNum(b_1)) + " rg\n");
      this.streamBuffer.value.(*GrowableBuffer).writeString("f\n");
    } else {
      if  strokeColor.value.(*EVGColor).isSet {
        var sr_1 float64= strokeColor.value.(*EVGColor).r / 255.0;
        var sg_1 float64= strokeColor.value.(*EVGColor).g / 255.0;
        var sb_1 float64= strokeColor.value.(*EVGColor).b / 255.0;
        this.streamBuffer.value.(*GrowableBuffer).writeString(((((this.formatNum(sr_1) + " ") + this.formatNum(sg_1)) + " ") + this.formatNum(sb_1)) + " RG\n");
        if  el.strokeWidth > 0.0 {
          this.streamBuffer.value.(*GrowableBuffer).writeString(this.formatNum(el.strokeWidth) + " w\n");
        }
        this.streamBuffer.value.(*GrowableBuffer).writeString("S\n");
      }
    }
  }
  this.streamBuffer.value.(*GrowableBuffer).writeString("Q\n");
}
func (this *EVGPDFRenderer) applyClipPath (pathData string, x float64, y float64, w float64, h float64) () {
  var parser *SVGPathParser= CreateNew_SVGPathParser();
  parser.parse(pathData);
  var commands []*PathCommand= parser.getScaledCommands(w, h);
  var i int64= int64(0);
  for i < (int64(len(commands))) {
    var cmd *PathCommand= commands[i];
    var px float64= x + cmd.x;
    var py float64= (y + h) - cmd.y;
    var px1 float64= x + cmd.x1;
    var py1 float64= (y + h) - cmd.y1;
    var px2 float64= x + cmd.x2;
    var py2 float64= (y + h) - cmd.y2;
    if  cmd._type == "M" {
      this.streamBuffer.value.(*GrowableBuffer).writeString(((this.formatNum(px) + " ") + this.formatNum(py)) + " m\n");
    }
    if  cmd._type == "L" {
      this.streamBuffer.value.(*GrowableBuffer).writeString(((this.formatNum(px) + " ") + this.formatNum(py)) + " l\n");
    }
    if  cmd._type == "C" {
      this.streamBuffer.value.(*GrowableBuffer).writeString(((((((((((this.formatNum(px1) + " ") + this.formatNum(py1)) + " ") + this.formatNum(px2)) + " ") + this.formatNum(py2)) + " ") + this.formatNum(px)) + " ") + this.formatNum(py)) + " c\n");
    }
    if  cmd._type == "Q" {
      this.streamBuffer.value.(*GrowableBuffer).writeString(((((((((((this.formatNum(px1) + " ") + this.formatNum(py1)) + " ") + this.formatNum(px1)) + " ") + this.formatNum(py1)) + " ") + this.formatNum(px)) + " ") + this.formatNum(py)) + " c\n");
    }
    if  cmd._type == "Z" {
      this.streamBuffer.value.(*GrowableBuffer).writeString("h\n");
    }
    i = i + int64(1); 
  }
  this.streamBuffer.value.(*GrowableBuffer).writeString("W n\n");
}
func (this *EVGPDFRenderer) renderBackground (x float64, y float64, w float64, h float64, color *EVGColor) () {
  this.streamBuffer.value.(*GrowableBuffer).writeString("q\n");
  var r float64= color.r / 255.0;
  var g float64= color.g / 255.0;
  var b float64= color.b / 255.0;
  this.streamBuffer.value.(*GrowableBuffer).writeString(((((this.formatNum(r) + " ") + this.formatNum(g)) + " ") + this.formatNum(b)) + " rg\n");
  this.streamBuffer.value.(*GrowableBuffer).writeString(((((((this.formatNum(x) + " ") + this.formatNum(y)) + " ") + this.formatNum(w)) + " ") + this.formatNum(h)) + " re\n");
  this.streamBuffer.value.(*GrowableBuffer).writeString("f\n");
  this.streamBuffer.value.(*GrowableBuffer).writeString("Q\n");
}
func (this *EVGPDFRenderer) renderBorder (el *EVGElement, x float64, y float64, w float64, h float64) () {
  var borderWidth float64= el.box.value.(*EVGBox).borderWidth.value.(*EVGUnit).pixels;
  if  borderWidth <= 0.0 {
    return
  }
  var borderColor *EVGColor= el.box.value.(*EVGBox).borderColor.value.(*EVGColor);
  if  borderColor.isSet == false {
    borderColor = EVGColor_static_black(); 
  }
  this.streamBuffer.value.(*GrowableBuffer).writeString("q\n");
  var r float64= borderColor.r / 255.0;
  var g float64= borderColor.g / 255.0;
  var b float64= borderColor.b / 255.0;
  this.streamBuffer.value.(*GrowableBuffer).writeString(((((this.formatNum(r) + " ") + this.formatNum(g)) + " ") + this.formatNum(b)) + " RG\n");
  this.streamBuffer.value.(*GrowableBuffer).writeString(this.formatNum(borderWidth) + " w\n");
  this.streamBuffer.value.(*GrowableBuffer).writeString(((((((this.formatNum(x) + " ") + this.formatNum(y)) + " ") + this.formatNum(w)) + " ") + this.formatNum(h)) + " re\n");
  this.streamBuffer.value.(*GrowableBuffer).writeString("S\n");
  this.streamBuffer.value.(*GrowableBuffer).writeString("Q\n");
}
func (this *EVGPDFRenderer) renderText (el *EVGElement, x float64, y float64, w float64, h float64) () {
  var text string= this.getTextContent(el);
  if  (int64(len([]rune(text)))) == int64(0) {
    return
  }
  var fontSize float64= 14.0;
  if  el.fontSize.value.(*EVGUnit).isSet {
    fontSize = el.fontSize.value.(*EVGUnit).pixels; 
  }
  var color *GoNullable = new(GoNullable); 
  color.value = el.color.value;
  color.has_value = el.color.has_value;
  if  color.value.(*EVGColor).isSet == false {
    color.value = EVGColor_static_black();
    color.has_value = true; /* detected as non-optional */
  }
  var lineHeight float64= el.lineHeight;
  if  lineHeight <= 0.0 {
    lineHeight = 1.2; 
  }
  var lineSpacing float64= fontSize * lineHeight;
  var fontFamily string= el.fontFamily;
  if  (int64(len([]rune(fontFamily)))) == int64(0) {
    fontFamily = "Helvetica"; 
  }
  var lines []string= this.wrapText(text, w, fontSize, fontFamily);
  var fontName string= this.getPdfFontName(fontFamily);
  var lineY float64= (y + h) - fontSize;
  var i int64= int64(0);
  for i < (int64(len(lines))) {
    var line string= lines[i];
    this.streamBuffer.value.(*GrowableBuffer).writeString("BT\n");
    this.streamBuffer.value.(*GrowableBuffer).writeString(((fontName + " ") + this.formatNum(fontSize)) + " Tf\n");
    var r float64= color.value.(*EVGColor).r / 255.0;
    var g float64= color.value.(*EVGColor).g / 255.0;
    var b float64= color.value.(*EVGColor).b / 255.0;
    this.streamBuffer.value.(*GrowableBuffer).writeString(((((this.formatNum(r) + " ") + this.formatNum(g)) + " ") + this.formatNum(b)) + " rg\n");
    var textX float64= x;
    if  el.textAlign == "center" {
      var textWidth float64= this.measurer.value.(IFACE_EVGTextMeasurer).measureTextWidth(line, fontFamily, fontSize);
      textX = x + ((w - textWidth) / 2.0); 
    }
    if  el.textAlign == "right" {
      var textWidth_1 float64= this.measurer.value.(IFACE_EVGTextMeasurer).measureTextWidth(line, fontFamily, fontSize);
      textX = (x + w) - textWidth_1; 
    }
    this.streamBuffer.value.(*GrowableBuffer).writeString(((this.formatNum(textX) + " ") + this.formatNum(lineY)) + " Td\n");
    this.streamBuffer.value.(*GrowableBuffer).writeString(("(" + this.escapeText(line)) + ") Tj\n");
    this.streamBuffer.value.(*GrowableBuffer).writeString("ET\n");
    lineY = lineY - lineSpacing; 
    i = i + int64(1); 
  }
}
func (this *EVGPDFRenderer) wrapText (text string, maxWidth float64, fontSize float64, fontFamily string) []string {
  var lines []string = make([]string, 0);
  var words []string= strings.Split(text, " ");
  var currentLine string= "";
  var i int64= int64(0);
  for i < (int64(len(words))) {
    var word string= words[i];
    var testLine string= "";
    if  (int64(len([]rune(currentLine)))) == int64(0) {
      testLine = word; 
    } else {
      testLine = (currentLine + " ") + word; 
    }
    var testWidth float64= this.measurer.value.(IFACE_EVGTextMeasurer).measureTextWidth(testLine, fontFamily, fontSize);
    if  (testWidth > maxWidth) && ((int64(len([]rune(currentLine)))) > int64(0)) {
      lines = append(lines,currentLine); 
      currentLine = word; 
    } else {
      currentLine = testLine; 
    }
    i = i + int64(1); 
  }
  if  (int64(len([]rune(currentLine)))) > int64(0) {
    lines = append(lines,currentLine); 
  }
  return lines
}
func (this *EVGPDFRenderer) renderDivider (el *EVGElement, x float64, y float64, w float64, h float64) () {
  var color *GoNullable = new(GoNullable); 
  color.value = el.color.value;
  color.has_value = el.color.has_value;
  if  color.value.(*EVGColor).isSet == false {
    color.value = EVGColor_static_rgb(int64(200), int64(200), int64(200));
    color.has_value = true; /* detected as non-optional */
  }
  var lineY float64= y + (h / 2.0);
  this.streamBuffer.value.(*GrowableBuffer).writeString("q\n");
  var r float64= color.value.(*EVGColor).r / 255.0;
  var g float64= color.value.(*EVGColor).g / 255.0;
  var b float64= color.value.(*EVGColor).b / 255.0;
  this.streamBuffer.value.(*GrowableBuffer).writeString(((((this.formatNum(r) + " ") + this.formatNum(g)) + " ") + this.formatNum(b)) + " RG\n");
  this.streamBuffer.value.(*GrowableBuffer).writeString("1 w\n");
  this.streamBuffer.value.(*GrowableBuffer).writeString(((this.formatNum(x) + " ") + this.formatNum(lineY)) + " m\n");
  this.streamBuffer.value.(*GrowableBuffer).writeString(((this.formatNum((x + w)) + " ") + this.formatNum(lineY)) + " l\n");
  this.streamBuffer.value.(*GrowableBuffer).writeString("S\n");
  this.streamBuffer.value.(*GrowableBuffer).writeString("Q\n");
}
func (this *EVGPDFRenderer) getTextContent (el *EVGElement) string {
  if  (int64(len([]rune(el.textContent)))) > int64(0) {
    return el.textContent
  }
  var result string= "";
  var i int64= int64(0);
  var childCount int64= el.getChildCount();
  for i < childCount {
    var child *EVGElement= el.getChild(i);
    if  child.tagName == "text" {
      var childText string= child.textContent;
      if  (int64(len([]rune(childText)))) > int64(0) {
        if  (int64(len([]rune(result)))) > int64(0) {
          var lastChar int64= int64([]rune(result)[((int64(len([]rune(result)))) - int64(1))]);
          var firstChar int64= int64([]rune(childText)[int64(0)]);
          if  (lastChar != int64(32)) && (firstChar != int64(32)) {
            result = result + " "; 
          }
        }
        result = result + childText; 
      }
    }
    i = i + int64(1); 
  }
  return result
}
func (this *EVGPDFRenderer) estimateTextWidth (text string, fontSize float64) float64 {
  return this.measurer.value.(IFACE_EVGTextMeasurer).measureTextWidth(text, "Helvetica", fontSize)
}
func (this *EVGPDFRenderer) toOctalEscape (ch int64) string {
  var d0 int64= ch % int64(8);
  var t1 int64= int64(math.Floor((float64(ch) / float64(int64(8)))));
  var d1 int64= t1 % int64(8);
  var d2 int64= int64(math.Floor((float64(t1) / float64(int64(8)))));
  return (("\\" + (strconv.FormatInt(d2, 10))) + (strconv.FormatInt(d1, 10))) + (strconv.FormatInt(d0, 10))
}
func (this *EVGPDFRenderer) escapeText (text string) string {
  var result string= "";
  var __len int64= int64(len([]rune(text)));
  var i int64= int64(0);
  for i < __len {
    var ch int64= int64([]rune(text)[i]);
    if  ch == int64(40) {
      result = result + "\\("; 
    } else {
      if  ch == int64(41) {
        result = result + "\\)"; 
      } else {
        if  ch == int64(92) {
          result = result + "\\\\"; 
        } else {
          if  ch < int64(32) {
            result = result + " "; 
          } else {
            if  ch < int64(128) {
              result = result + (string([]rune{rune(ch)})); 
            } else {
              if  ch <= int64(255) {
                result = result + this.toOctalEscape(ch); 
              } else {
                result = result + "?"; 
              }
            }
          }
        }
      }
    }
    i = i + int64(1); 
  }
  return result
}
func (this *EVGPDFRenderer) formatNum (n float64) string {
  var result string= strconv.FormatFloat(n,'f', 6, 64);
  return result
}
func (this *EVGPDFRenderer) padLeft (s string, __len int64, padChar string) string {
  var result string= s;
  for (int64(len([]rune(result)))) < __len {
    result = padChar + result; 
  }
  return result
}
func (this *EVGPDFRenderer) sanitizeFontName (name string) string {
  var result string= "";
  var __len int64= int64(len([]rune(name)));
  var i int64= int64(0);
  for i < __len {
    var ch int64= int64([]rune(name)[i]);
    if  (((ch >= int64(65)) && (ch <= int64(90))) || ((ch >= int64(97)) && (ch <= int64(122)))) || ((ch >= int64(48)) && (ch <= int64(57))) {
      result = result + (string([]rune{rune(ch)})); 
    }
    i = i + int64(1); 
  }
  return result
}
type EvalValue struct { 
  valueType int64 `json:"valueType"` 
  numberValue float64 `json:"numberValue"` 
  stringValue string `json:"stringValue"` 
  boolValue bool `json:"boolValue"` 
  arrayValue []*EvalValue `json:"arrayValue"` 
  objectKeys []string `json:"objectKeys"` 
  objectValues []*EvalValue `json:"objectValues"` 
  functionName string `json:"functionName"` 
  functionBody string /**  unused  **/  `json:"functionBody"` 
  evgElement *GoNullable `json:"evgElement"` 
}

func CreateNew_EvalValue() *EvalValue {
  me := new(EvalValue)
  me.valueType = int64(0)
  me.numberValue = 0.0
  me.stringValue = ""
  me.boolValue = false
  me.arrayValue = make([]*EvalValue,0)
  me.objectKeys = make([]string,0)
  me.objectValues = make([]*EvalValue,0)
  me.functionName = ""
  me.functionBody = ""
  me.evgElement = new(GoNullable);
  return me;
}
func EvalValue_static_null() *EvalValue {
  var v *EvalValue= CreateNew_EvalValue();
  v.valueType = int64(0); 
  return v
}
func EvalValue_static_number(n float64) *EvalValue {
  var v *EvalValue= CreateNew_EvalValue();
  v.valueType = int64(1); 
  v.numberValue = n; 
  return v
}
func EvalValue_static_fromInt(n int64) *EvalValue {
  var v *EvalValue= CreateNew_EvalValue();
  v.valueType = int64(1); 
  v.numberValue = float64( n ); 
  return v
}
func EvalValue_static_string(s string) *EvalValue {
  var v *EvalValue= CreateNew_EvalValue();
  v.valueType = int64(2); 
  v.stringValue = s; 
  return v
}
func EvalValue_static_boolean(b bool) *EvalValue {
  var v *EvalValue= CreateNew_EvalValue();
  v.valueType = int64(3); 
  v.boolValue = b; 
  return v
}
func EvalValue_static_array(items []*EvalValue) *EvalValue {
  var v *EvalValue= CreateNew_EvalValue();
  v.valueType = int64(4); 
  v.arrayValue = items; 
  return v
}
func EvalValue_static_object(keys []string, values []*EvalValue) *EvalValue {
  var v *EvalValue= CreateNew_EvalValue();
  v.valueType = int64(5); 
  v.objectKeys = keys; 
  v.objectValues = values; 
  return v
}
func EvalValue_static_element(el *EVGElement) *EvalValue {
  var v *EvalValue= CreateNew_EvalValue();
  v.valueType = int64(7); 
  v.evgElement.value = el;
  v.evgElement.has_value = true; /* detected as non-optional */
  return v
}
func (this *EvalValue) isNull () bool {
  return this.valueType == int64(0)
}
func (this *EvalValue) isNumber () bool {
  return this.valueType == int64(1)
}
func (this *EvalValue) isString () bool {
  return this.valueType == int64(2)
}
func (this *EvalValue) isBoolean () bool {
  return this.valueType == int64(3)
}
func (this *EvalValue) isArray () bool {
  return this.valueType == int64(4)
}
func (this *EvalValue) isObject () bool {
  return this.valueType == int64(5)
}
func (this *EvalValue) isFunction () bool {
  return this.valueType == int64(6)
}
func (this *EvalValue) isElement () bool {
  return this.valueType == int64(7)
}
func (this *EvalValue) toNumber () float64 {
  if  this.valueType == int64(1) {
    return this.numberValue
  }
  if  this.valueType == int64(2) {
    var parsed *GoNullable = new(GoNullable); 
    parsed = r_str_2_d64(this.stringValue);
    return parsed.value.(float64)
  }
  if  this.valueType == int64(3) {
    if  this.boolValue {
      return 1.0
    }
    return 0.0
  }
  return 0.0
}
func (this *EvalValue) toString () string {
  if  this.valueType == int64(0) {
    return "null"
  }
  if  this.valueType == int64(1) {
    var s string= strconv.FormatFloat(this.numberValue,'f', 6, 64);
    var intVal int64= int64(this.numberValue);
    if  (float64( intVal )) == this.numberValue {
      return strconv.FormatInt(intVal, 10)
    }
    return s
  }
  if  this.valueType == int64(2) {
    return this.stringValue
  }
  if  this.valueType == int64(3) {
    if  this.boolValue {
      return "true"
    }
    return "false"
  }
  if  this.valueType == int64(4) {
    var result string= "[";
    var i int64= int64(0);
    for i < (int64(len(this.arrayValue))) {
      if  i > int64(0) {
        result = result + ", "; 
      }
      var item *EvalValue= this.arrayValue[i];
      var itemStr string= (item).toString();
      result = result + itemStr; 
      i = i + int64(1); 
    }
    return result + "]"
  }
  if  this.valueType == int64(5) {
    var result_1 string= "{";
    var i_1 int64= int64(0);
    for i_1 < (int64(len(this.objectKeys))) {
      if  i_1 > int64(0) {
        result_1 = result_1 + ", "; 
      }
      var key string= this.objectKeys[i_1];
      var val *EvalValue= this.objectValues[i_1];
      var valStr string= (val).toString();
      result_1 = ((result_1 + key) + ": ") + valStr; 
      i_1 = i_1 + int64(1); 
    }
    return result_1 + "}"
  }
  if  this.valueType == int64(6) {
    return ("[Function: " + this.functionName) + "]"
  }
  if  this.valueType == int64(7) {
    if ( this.evgElement.has_value) {
      var el *EVGElement= this.evgElement.value.(*EVGElement);
      return ("[EVGElement: " + el.tagName) + "]"
    }
    return "[EVGElement: null]"
  }
  return "undefined"
}
func (this *EvalValue) toBool () bool {
  if  this.valueType == int64(0) {
    return false
  }
  if  this.valueType == int64(1) {
    return this.numberValue != 0.0
  }
  if  this.valueType == int64(2) {
    return (int64(len([]rune(this.stringValue)))) > int64(0)
  }
  if  this.valueType == int64(3) {
    return this.boolValue
  }
  if  this.valueType == int64(4) {
    return true
  }
  if  this.valueType == int64(5) {
    return true
  }
  if  this.valueType == int64(6) {
    return true
  }
  if  this.valueType == int64(7) {
    return true
  }
  return false
}
func (this *EvalValue) getMember (key string) *EvalValue {
  if  this.valueType == int64(5) {
    var i int64= int64(0);
    for i < (int64(len(this.objectKeys))) {
      if  (this.objectKeys[i]) == key {
        return this.objectValues[i]
      }
      i = i + int64(1); 
    }
  }
  if  this.valueType == int64(4) {
    if  key == "length" {
      return EvalValue_static_fromInt((int64(len(this.arrayValue))))
    }
  }
  if  this.valueType == int64(2) {
    if  key == "length" {
      return EvalValue_static_fromInt((int64(len([]rune(this.stringValue)))))
    }
  }
  return EvalValue_static_null()
}
func (this *EvalValue) getIndex (index int64) *EvalValue {
  if  this.valueType == int64(4) {
    if  (index >= int64(0)) && (index < (int64(len(this.arrayValue)))) {
      return this.arrayValue[index]
    }
  }
  if  this.valueType == int64(2) {
    if  (index >= int64(0)) && (index < (int64(len([]rune(this.stringValue))))) {
      var charStr string= string([]rune(this.stringValue)[index:(index + int64(1))]);
      return EvalValue_static_string(charStr)
    }
  }
  return EvalValue_static_null()
}
func (this *EvalValue) equals (other *EvalValue) bool {
  if  this.valueType != other.valueType {
    return false
  }
  if  this.valueType == int64(0) {
    return true
  }
  if  this.valueType == int64(1) {
    return this.numberValue == other.numberValue
  }
  if  this.valueType == int64(2) {
    return this.stringValue == other.stringValue
  }
  if  this.valueType == int64(3) {
    return this.boolValue == other.boolValue
  }
  return false
}
type ImportedSymbol struct { 
  name string `json:"name"` 
  originalName string `json:"originalName"` 
  sourcePath string `json:"sourcePath"` 
  symbolType string `json:"symbolType"` 
  functionNode *GoNullable `json:"functionNode"` 
}

func CreateNew_ImportedSymbol() *ImportedSymbol {
  me := new(ImportedSymbol)
  me.name = ""
  me.originalName = ""
  me.sourcePath = ""
  me.symbolType = ""
  me.functionNode = new(GoNullable);
  return me;
}
type EvalContext struct { 
  variables []string `json:"variables"` 
  values []*EvalValue `json:"values"` 
  parent *GoNullable `json:"parent"` 
}

func CreateNew_EvalContext() *EvalContext {
  me := new(EvalContext)
  me.variables = make([]string,0)
  me.values = make([]*EvalValue,0)
  me.parent = new(GoNullable);
  var v []string = make([]string, 0);
  me.variables = v; 
  var vl []*EvalValue = make([]*EvalValue, 0);
  me.values = vl; 
  return me;
}
func (this *EvalContext) define (name string, value *EvalValue) () {
  var i int64= int64(0);
  for i < (int64(len(this.variables))) {
    if  (this.variables[i]) == name {
      this.values[i] = value;
      return
    }
    i = i + int64(1); 
  }
  this.variables = append(this.variables,name); 
  this.values = append(this.values,value); 
}
func (this *EvalContext) lookup (name string) *EvalValue {
  var i int64= int64(0);
  for i < (int64(len(this.variables))) {
    if  (this.variables[i]) == name {
      return this.values[i]
    }
    i = i + int64(1); 
  }
  if ( this.parent.has_value) {
    var p *EvalContext= this.parent.value.(*EvalContext);
    return p.lookup(name)
  }
  return EvalValue_static_null()
}
func (this *EvalContext) has (name string) bool {
  var i int64= int64(0);
  for i < (int64(len(this.variables))) {
    if  (this.variables[i]) == name {
      return true
    }
    i = i + int64(1); 
  }
  if ( this.parent.has_value) {
    var p *EvalContext= this.parent.value.(*EvalContext);
    return (p).has(name)
  }
  return false
}
func (this *EvalContext) createChild () *EvalContext {
  var child *EvalContext= CreateNew_EvalContext();
  child.parent.value = this;
  child.parent.has_value = true; /* detected as non-optional */
  return child
}
type ComponentEngine struct { 
  parser *GoNullable `json:"parser"` 
  source string `json:"source"` 
  basePath string `json:"basePath"` 
  assetPaths []string `json:"assetPaths"` 
  pageWidth float64 `json:"pageWidth"` 
  pageHeight float64 `json:"pageHeight"` 
  imports []*ImportedSymbol `json:"imports"` 
  localComponents []*ImportedSymbol `json:"localComponents"` 
  context *GoNullable `json:"context"` 
  primitives []string `json:"primitives"` 
}

func CreateNew_ComponentEngine() *ComponentEngine {
  me := new(ComponentEngine)
  me.source = ""
  me.basePath = "./"
  me.assetPaths = make([]string,0)
  me.pageWidth = 595.0
  me.pageHeight = 842.0
  me.imports = make([]*ImportedSymbol,0)
  me.localComponents = make([]*ImportedSymbol,0)
  me.primitives = make([]string,0)
  me.parser = new(GoNullable);
  me.context = new(GoNullable);
  var p *TSParserSimple= CreateNew_TSParserSimple();
  me.parser.value = p;
  me.parser.has_value = true; /* detected as non-optional */
  me.parser.value.(*TSParserSimple).tsxMode = true; 
  var imp []*ImportedSymbol = make([]*ImportedSymbol, 0);
  me.imports = imp; 
  var loc []*ImportedSymbol = make([]*ImportedSymbol, 0);
  me.localComponents = loc; 
  var ctx *EvalContext= CreateNew_EvalContext();
  me.context.value = ctx;
  me.context.has_value = true; /* detected as non-optional */
  var prim []string = make([]string, 0);
  me.primitives = prim; 
  var ap_1 []string = make([]string, 0);
  me.assetPaths = ap_1; 
  me.primitives = append(me.primitives,"View"); 
  me.primitives = append(me.primitives,"Label"); 
  me.primitives = append(me.primitives,"Print"); 
  me.primitives = append(me.primitives,"Section"); 
  me.primitives = append(me.primitives,"Page"); 
  me.primitives = append(me.primitives,"Image"); 
  me.primitives = append(me.primitives,"Path"); 
  me.primitives = append(me.primitives,"Spacer"); 
  me.primitives = append(me.primitives,"Divider"); 
  me.primitives = append(me.primitives,"div"); 
  me.primitives = append(me.primitives,"span"); 
  me.primitives = append(me.primitives,"p"); 
  me.primitives = append(me.primitives,"h1"); 
  me.primitives = append(me.primitives,"h2"); 
  me.primitives = append(me.primitives,"h3"); 
  me.primitives = append(me.primitives,"img"); 
  me.primitives = append(me.primitives,"path"); 
  return me;
}
func (this *ComponentEngine) setAssetPaths (paths string) () {
  var start int64= int64(0);
  var i int64= int64(0);
  var __len int64= int64(len([]rune(paths)));
  for i <= __len {
    var ch string= "";
    if  i < __len {
      ch = string([]rune(paths)[i:(i + int64(1))]); 
    }
    if  (ch == ";") || (i == __len) {
      if  i > start {
        var part string= string([]rune(paths)[start:i]);
        this.assetPaths = append(this.assetPaths,part); 
        fmt.Println( "ComponentEngine: Added asset path: " + part )
      }
      start = i + int64(1); 
    }
    i = i + int64(1); 
  }
}
func (this *ComponentEngine) resolveComponentPath (relativePath string) string {
  var fullPath string= this.basePath + relativePath;
  var i int64= int64(0);
  for i < (int64(len(this.assetPaths))) {
    /** unused:  assetDir*/
    i = i + int64(1); 
  }
  return fullPath
}
func (this *ComponentEngine) parseFile (dirPath string, fileName string) *EVGElement {
  this.basePath = dirPath; 
  var fileContent []byte= func() []byte { d, _ := os.ReadFile(filepath.Join(dirPath, fileName)); return d }();
  var src string= string(fileContent);
  return this.parse(src)
}
func (this *ComponentEngine) parse (src string) *EVGElement {
  this.source = src; 
  var lexer *TSLexer= CreateNew_TSLexer(src);
  var tokens []*Token= lexer.tokenize();
  this.parser.value.(*TSParserSimple).initParser(tokens);
  this.parser.value.(*TSParserSimple).tsxMode = true; 
  var ast *TSNode= this.parser.value.(*TSParserSimple).parseProgram();
  this.processImports(ast);
  this.registerComponents(ast);
  this.processVariables(ast);
  var renderFn *TSNode= this.findRenderFunction(ast);
  if  renderFn.nodeType == "" {
    fmt.Println( "Error: No render() function found" )
    var empty *EVGElement= CreateNew_EVGElement();
    return empty
  }
  return this.evaluateFunction(renderFn)
}
func (this *ComponentEngine) processImports (ast *TSNode) () {
  var i int64= int64(0);
  for i < (int64(len(ast.children))) {
    var node *TSNode= ast.children[i];
    if  node.nodeType == "ImportDeclaration" {
      this.processImportDeclaration(node);
    }
    i = i + int64(1); 
  }
}
func (this *ComponentEngine) processImportDeclaration (node *TSNode) () {
  var modulePath string= "";
  if ( node.left.has_value) {
    var srcNode *TSNode= node.left.value.(*TSNode);
    modulePath = this.unquote(srcNode.value); 
  }
  if  (int64(len([]rune(modulePath)))) == int64(0) {
    return
  }
  if  (int64(strings.Index(modulePath, "evg_types"))) >= int64(0) {
    return
  }
  if  (int64(strings.Index(modulePath, "evg_"))) >= int64(0) {
    return
  }
  var importedNames []string = make([]string, 0);
  var j int64= int64(0);
  for j < (int64(len(node.children))) {
    var spec *TSNode= node.children[j];
    if  spec.nodeType == "ImportSpecifier" {
      importedNames = append(importedNames,spec.name); 
    }
    if  spec.nodeType == "ImportDefaultSpecifier" {
      importedNames = append(importedNames,spec.name); 
    }
    j = j + int64(1); 
  }
  var fullPath string= this.resolveModulePath(modulePath);
  if  (int64(len([]rune(fullPath)))) == int64(0) {
    return
  }
  var dirPath string= this.basePath;
  fmt.Println( ("Loading import: " + dirPath) + fullPath )
  var fileContent []byte= func() []byte { d, _ := os.ReadFile(filepath.Join(dirPath, fullPath)); return d }();
  var src string= string(fileContent);
  if  (int64(len([]rune(src)))) == int64(0) {
    fmt.Println( "" )
    fmt.Println( ("ERROR: Could not load component module: " + dirPath) + fullPath )
    fmt.Println( "" )
    fmt.Println( "Please ensure the imported file exists. You may need to:" )
    fmt.Println( "  1. Check that the import path is correct in your TSX file" )
    fmt.Println( "  2. Make sure the component file exists in one of your asset paths:" )
    var pathIdx int64= int64(0);
    for pathIdx < (int64(len(this.assetPaths))) {
      fmt.Println( "     - " + (this.assetPaths[pathIdx]) )
      pathIdx = pathIdx + int64(1); 
    }
    fmt.Println( "" )
    return
  }
  var lexer *TSLexer= CreateNew_TSLexer(src);
  var tokens []*Token= lexer.tokenize();
  var importParser *TSParserSimple= CreateNew_TSParserSimple();
  importParser.initParser(tokens);
  importParser.tsxMode = true; 
  var importAst *TSNode= importParser.parseProgram();
  var k int64= int64(0);
  for k < (int64(len(importAst.children))) {
    var stmt *TSNode= importAst.children[k];
    if  stmt.nodeType == "ExportNamedDeclaration" {
      if ( stmt.left.has_value) {
        var declNode *TSNode= stmt.left.value.(*TSNode);
        if  declNode.nodeType == "FunctionDeclaration" {
          var fnName string= declNode.name;
          if  this.isInList(fnName, importedNames) {
            var sym *ImportedSymbol= CreateNew_ImportedSymbol();
            sym.name = fnName; 
            sym.originalName = fnName; 
            sym.sourcePath = fullPath; 
            sym.symbolType = "component"; 
            sym.functionNode.value = declNode;
            sym.functionNode.has_value = true; /* detected as non-optional */
            this.localComponents = append(this.localComponents,sym); 
            fmt.Println( (("Imported component: " + fnName) + " from ") + fullPath )
          }
        }
      }
    }
    if  stmt.nodeType == "FunctionDeclaration" {
      var fnName_1 string= stmt.name;
      if  this.isInList(fnName_1, importedNames) {
        var sym_1 *ImportedSymbol= CreateNew_ImportedSymbol();
        sym_1.name = fnName_1; 
        sym_1.originalName = fnName_1; 
        sym_1.sourcePath = fullPath; 
        sym_1.symbolType = "component"; 
        sym_1.functionNode.value = stmt;
        sym_1.functionNode.has_value = true; /* detected as non-optional */
        this.localComponents = append(this.localComponents,sym_1); 
        fmt.Println( (("Imported component: " + fnName_1) + " from ") + fullPath )
      }
    }
    k = k + int64(1); 
  }
}
func (this *ComponentEngine) resolveModulePath (modulePath string) string {
  if  (int64(strings.Index(modulePath, "./"))) == int64(0) {
    var path string= string([]rune(modulePath)[int64(2):(int64(len([]rune(modulePath))))]);
    if  (int64(len([]rune(path)))) == int64(0) {
      return ""
    }
    if  (int64(strings.Index(path, ".tsx"))) < int64(0) {
      if  (int64(strings.Index(path, ".ts"))) < int64(0) {
        path = path + ".tsx"; 
      }
    }
    return path
  }
  if  (int64(strings.Index(modulePath, ".tsx"))) < int64(0) {
    if  (int64(strings.Index(modulePath, ".ts"))) < int64(0) {
      return modulePath + ".tsx"
    }
  }
  return modulePath
}
func (this *ComponentEngine) isInList (name string, list []string) bool {
  var i int64= int64(0);
  for i < (int64(len(list))) {
    if  (list[i]) == name {
      return true
    }
    i = i + int64(1); 
  }
  return false
}
func (this *ComponentEngine) registerComponents (ast *TSNode) () {
  var i int64= int64(0);
  for i < (int64(len(ast.children))) {
    var node *TSNode= ast.children[i];
    if  node.nodeType == "FunctionDeclaration" {
      if  node.name != "render" {
        var sym *ImportedSymbol= CreateNew_ImportedSymbol();
        sym.name = node.name; 
        sym.originalName = node.name; 
        sym.symbolType = "component"; 
        sym.functionNode.value = node;
        sym.functionNode.has_value = true; /* detected as non-optional */
        this.localComponents = append(this.localComponents,sym); 
        fmt.Println( "Registered local component: " + node.name )
      }
    }
    i = i + int64(1); 
  }
}
func (this *ComponentEngine) findRenderFunction (ast *TSNode) *TSNode {
  var empty *TSNode= CreateNew_TSNode();
  var i int64= int64(0);
  for i < (int64(len(ast.children))) {
    var node *TSNode= ast.children[i];
    if  node.nodeType == "FunctionDeclaration" {
      if  node.name == "render" {
        return node
      }
    }
    i = i + int64(1); 
  }
  return empty
}
func (this *ComponentEngine) processVariables (ast *TSNode) () {
  var i int64= int64(0);
  for i < (int64(len(ast.children))) {
    var node *TSNode= ast.children[i];
    if  node.nodeType == "VariableDeclaration" {
      this.processVariableDeclaration(node);
    }
    i = i + int64(1); 
  }
}
func (this *ComponentEngine) processVariableDeclaration (node *TSNode) () {
  var i int64= int64(0);
  for i < (int64(len(node.children))) {
    var decl *TSNode= node.children[i];
    if  decl.nodeType == "VariableDeclarator" {
      var varName string= decl.name;
      if ( decl.init.has_value) {
        var initNode *TSNode= decl.init.value.(*TSNode);
        var value *EvalValue= this.evaluateExpr(initNode);
        this.context.value.(*EvalContext).define(varName, value);
        fmt.Println( (("Defined variable: " + varName) + " = ") + (value).toString() )
      }
    }
    i = i + int64(1); 
  }
}
func (this *ComponentEngine) evaluateFunction (fnNode *TSNode) *EVGElement {
  var savedContext *GoNullable = new(GoNullable); 
  savedContext.value = this.context.value;
  savedContext.has_value = this.context.has_value;
  this.context.value = this.context.value.(*EvalContext).createChild();
  this.context.has_value = true; /* detected as non-optional */
  var body *TSNode= this.getFunctionBody(fnNode);
  var result *EVGElement= this.evaluateFunctionBody(body);
  this.context.value = savedContext.value;
  this.context.has_value = false; 
  if this.context.value != nil {
    this.context.has_value = true
  }
  return result
}
func (this *ComponentEngine) evaluateFunctionWithProps (fnNode *TSNode, props *EvalValue) *EVGElement {
  var savedContext *GoNullable = new(GoNullable); 
  savedContext.value = this.context.value;
  savedContext.has_value = this.context.has_value;
  this.context.value = this.context.value.(*EvalContext).createChild();
  this.context.has_value = true; /* detected as non-optional */
  this.bindFunctionParams(fnNode, props);
  var body *TSNode= this.getFunctionBody(fnNode);
  var result *EVGElement= this.evaluateFunctionBody(body);
  this.context.value = savedContext.value;
  this.context.has_value = false; 
  if this.context.value != nil {
    this.context.has_value = true
  }
  return result
}
func (this *ComponentEngine) bindFunctionParams (fnNode *TSNode, props *EvalValue) () {
  var i int64= int64(0);
  for i < (int64(len(fnNode.params))) {
    var param *TSNode= fnNode.params[i];
    if  param.nodeType == "ObjectPattern" {
      this.bindObjectPattern(param, props);
    }
    if  param.nodeType == "Parameter" {
      this.context.value.(*EvalContext).define(param.name, props);
    }
    if  param.nodeType == "Identifier" {
      this.context.value.(*EvalContext).define(param.name, props);
    }
    i = i + int64(1); 
  }
}
func (this *ComponentEngine) bindObjectPattern (pattern *TSNode, props *EvalValue) () {
  var i int64= int64(0);
  for i < (int64(len(pattern.children))) {
    var prop *TSNode= pattern.children[i];
    if  prop.nodeType == "Property" {
      var propName string= prop.name;
      var propValue *EvalValue= props.getMember(propName);
      if  propValue.isNull() {
        if ( prop.init.has_value) {
          var initNode *TSNode= prop.init.value.(*TSNode);
          propValue = this.evaluateExpr(initNode); 
        }
      }
      this.context.value.(*EvalContext).define(propName, propValue);
    }
    i = i + int64(1); 
  }
}
func (this *ComponentEngine) getFunctionBody (fnNode *TSNode) *TSNode {
  if ( fnNode.body.has_value) {
    return fnNode.body.value.(*TSNode)
  }
  var empty *TSNode= CreateNew_TSNode();
  return empty
}
func (this *ComponentEngine) evaluateFunctionBody (body *TSNode) *EVGElement {
  var empty *EVGElement= CreateNew_EVGElement();
  var i int64= int64(0);
  for i < (int64(len(body.children))) {
    var stmt *TSNode= body.children[i];
    if  stmt.nodeType == "VariableDeclaration" {
      this.processVariableDeclaration(stmt);
    }
    if  stmt.nodeType == "ReturnStatement" {
      if ( stmt.left.has_value) {
        var returnExpr *TSNode= stmt.left.value.(*TSNode);
        return this.evaluateJSX(returnExpr)
      }
    }
    i = i + int64(1); 
  }
  if  (body.nodeType == "JSXElement") || (body.nodeType == "JSXFragment") {
    return this.evaluateJSX(body)
  }
  return empty
}
func (this *ComponentEngine) evaluateJSX (node *TSNode) *EVGElement {
  var element *EVGElement= CreateNew_EVGElement();
  if  node.nodeType == "JSXElement" {
    return this.evaluateJSXElement(node)
  }
  if  node.nodeType == "JSXFragment" {
    element.tagName = "div"; 
    this.evaluateChildren(element, node);
    return element
  }
  if  node.nodeType == "ParenthesizedExpression" {
    if ( node.left.has_value) {
      var inner *TSNode= node.left.value.(*TSNode);
      return this.evaluateJSX(inner)
    }
  }
  return element
}
func (this *ComponentEngine) evaluateJSXElement (jsxNode *TSNode) *EVGElement {
  var tagName string= "";
  if ( jsxNode.left.has_value) {
    var openingEl *TSNode= jsxNode.left.value.(*TSNode);
    tagName = openingEl.name; 
  }
  if  this.isComponent(tagName) {
    return this.expandComponent(tagName, jsxNode)
  }
  var element *EVGElement= CreateNew_EVGElement();
  element.tagName = this.mapTagName(tagName); 
  if ( jsxNode.left.has_value) {
    var openingEl_1 *TSNode= jsxNode.left.value.(*TSNode);
    this.evaluateAttributes(element, openingEl_1);
  }
  if  ((tagName == "Label") || (tagName == "span")) || (tagName == "text") {
    element.textContent = this.evaluateTextContent(jsxNode); 
  } else {
    this.evaluateChildren(element, jsxNode);
  }
  return element
}
func (this *ComponentEngine) isComponent (name string) bool {
  if  (int64(len([]rune(name)))) == int64(0) {
    return false
  }
  var i int64= int64(0);
  for i < (int64(len(this.primitives))) {
    if  (this.primitives[i]) == name {
      return false
    }
    i = i + int64(1); 
  }
  var firstChar int64= int64([]rune(name)[int64(0)]);
  if  (firstChar >= int64(65)) && (firstChar <= int64(90)) {
    return true
  }
  return false
}
func (this *ComponentEngine) expandComponent (name string, jsxNode *TSNode) *EVGElement {
  var i int64= int64(0);
  for i < (int64(len(this.localComponents))) {
    var sym *ImportedSymbol= this.localComponents[i];
    if  sym.name == name {
      var props *EvalValue= this.evaluateProps(jsxNode);
      if ( sym.functionNode.has_value) {
        var fnNode *TSNode= sym.functionNode.value.(*TSNode);
        return this.evaluateFunctionWithProps(fnNode, props)
      }
    }
    i = i + int64(1); 
  }
  fmt.Println( "Warning: Unknown component: " + name )
  var empty *EVGElement= CreateNew_EVGElement();
  empty.tagName = "div"; 
  return empty
}
func (this *ComponentEngine) evaluateProps (jsxNode *TSNode) *EvalValue {
  var keys []string = make([]string, 0);
  var values []*EvalValue = make([]*EvalValue, 0);
  if ( jsxNode.left.has_value) {
    var openingEl *TSNode= jsxNode.left.value.(*TSNode);
    var i int64= int64(0);
    for i < (int64(len(openingEl.children))) {
      var attr *TSNode= openingEl.children[i];
      if  attr.nodeType == "JSXAttribute" {
        var attrName string= attr.name;
        var attrValue *EvalValue= this.evaluateAttributeValue(attr);
        keys = append(keys,attrName); 
        values = append(values,attrValue); 
      }
      i = i + int64(1); 
    }
  }
  var hasExplicitChildren bool= false;
  var ci int64= int64(0);
  for ci < (int64(len(keys))) {
    if  (keys[ci]) == "children" {
      hasExplicitChildren = true; 
    }
    ci = ci + int64(1); 
  }
  if  hasExplicitChildren == false {
    var childElements []*EvalValue= this.collectChildElements(jsxNode);
    if  (int64(len(childElements))) > int64(0) {
      keys = append(keys,"children"); 
      if  (int64(len(childElements))) == int64(1) {
        values = append(values,childElements[int64(0)]); 
      } else {
        values = append(values,EvalValue_static_array(childElements)); 
      }
    }
  }
  return EvalValue_static_object(keys, values)
}
func (this *ComponentEngine) collectChildElements (jsxNode *TSNode) []*EvalValue {
  var results []*EvalValue = make([]*EvalValue, 0);
  var i int64= int64(0);
  for i < (int64(len(jsxNode.children))) {
    var child *TSNode= jsxNode.children[i];
    if  child.nodeType == "JSXElement" {
      var el *EVGElement= this.evaluateJSXElement(child);
      if  (int64(len([]rune(el.tagName)))) > int64(0) {
        results = append(results,EvalValue_static_element(el)); 
      }
    }
    if  child.nodeType == "JSXText" {
      var text string= this.trimText(child.value);
      if  (int64(len([]rune(text)))) > int64(0) {
        var textEl *EVGElement= CreateNew_EVGElement();
        textEl.tagName = "text"; 
        textEl.textContent = text; 
        results = append(results,EvalValue_static_element(textEl)); 
      }
    }
    if  child.nodeType == "JSXExpressionContainer" {
      if ( child.left.has_value) {
        var exprNode *TSNode= child.left.value.(*TSNode);
        var exprValue *EvalValue= this.evaluateExpr(exprNode);
        if  exprValue.isElement() {
          results = append(results,exprValue); 
        }
        if  (exprValue).isArray() {
          var ai int64= int64(0);
          for ai < (int64(len(exprValue.arrayValue))) {
            var arrItem *EvalValue= exprValue.arrayValue[ai];
            if  arrItem.isElement() {
              results = append(results,arrItem); 
            }
            ai = ai + int64(1); 
          }
        }
      }
    }
    i = i + int64(1); 
  }
  return results
}
func (this *ComponentEngine) evaluateAttributeValue (attr *TSNode) *EvalValue {
  if ( attr.right.has_value) {
    var rightNode *TSNode= attr.right.value.(*TSNode);
    if  rightNode.nodeType == "StringLiteral" {
      return EvalValue_static_string(this.unquote(rightNode.value))
    }
    if  rightNode.nodeType == "JSXExpressionContainer" {
      if ( rightNode.left.has_value) {
        var exprNode *TSNode= rightNode.left.value.(*TSNode);
        return this.evaluateExpr(exprNode)
      }
    }
  }
  return EvalValue_static_boolean(true)
}
func (this *ComponentEngine) evaluateAttributes (element *EVGElement, openingNode *TSNode) () {
  var i int64= int64(0);
  for i < (int64(len(openingNode.children))) {
    var attr *TSNode= openingNode.children[i];
    if  attr.nodeType == "JSXAttribute" {
      var rawAttrName string= attr.name;
      var attrValue *EvalValue= this.evaluateAttributeValue(attr);
      var strValue string= (attrValue).toString();
      this.applyAttribute(element, rawAttrName, strValue);
    }
    i = i + int64(1); 
  }
}
func (this *ComponentEngine) applyAttribute (element *EVGElement, rawName string, strValue string) () {
  if  rawName == "id" {
    element.id = strValue; 
    return
  }
  if  rawName == "className" {
    element.className = strValue; 
    return
  }
  if  rawName == "src" {
    element.src = strValue; 
    return
  }
  element.setAttribute(rawName, strValue);
}
func (this *ComponentEngine) evaluateTextContent (jsxNode *TSNode) string {
  var result string= "";
  var i int64= int64(0);
  for i < (int64(len(jsxNode.children))) {
    var child *TSNode= jsxNode.children[i];
    if  child.nodeType == "JSXText" {
      var rawText string= child.value;
      if  (int64(len([]rune(rawText)))) > int64(0) {
        result = this.smartJoinText(result, rawText); 
      }
    }
    if  child.nodeType == "JSXExpressionContainer" {
      if ( child.left.has_value) {
        var exprNode *TSNode= child.left.value.(*TSNode);
        var exprValue *EvalValue= this.evaluateExpr(exprNode);
        var exprStr string= (exprValue).toString();
        result = this.smartJoinText(result, exprStr); 
      }
    }
    i = i + int64(1); 
  }
  var normalizedText string= this.normalizeWhitespace(result);
  var trimmedText string= this.trimText(normalizedText);
  return trimmedText
}
func (this *ComponentEngine) evaluateChildren (element *EVGElement, jsxNode *TSNode) () {
  var i int64= int64(0);
  var accumulatedText string= "";
  for i < (int64(len(jsxNode.children))) {
    var child *TSNode= jsxNode.children[i];
    if  child.nodeType == "JSXText" {
      accumulatedText = this.smartJoinText(accumulatedText, child.value); 
      i = i + int64(1); 
      continue;
    }
    if  (int64(len([]rune(accumulatedText)))) > int64(0) {
      var normalizedText string= this.normalizeWhitespace(accumulatedText);
      var text string= this.trimText(normalizedText);
      if  (int64(len([]rune(text)))) > int64(0) {
        var textEl *EVGElement= CreateNew_EVGElement();
        textEl.tagName = "text"; 
        textEl.textContent = text; 
        element.addChild(textEl);
      }
      accumulatedText = ""; 
    }
    if  child.nodeType == "JSXElement" {
      var childEl *EVGElement= this.evaluateJSXElement(child);
      if  (int64(len([]rune(childEl.tagName)))) > int64(0) {
        element.addChild(childEl);
      }
    }
    if  child.nodeType == "JSXExpressionContainer" {
      this.evaluateExpressionChild(element, child);
    }
    if  child.nodeType == "JSXFragment" {
      this.evaluateChildren(element, child);
    }
    i = i + int64(1); 
  }
  if  (int64(len([]rune(accumulatedText)))) > int64(0) {
    var normalizedText_1 string= this.normalizeWhitespace(accumulatedText);
    var text_1 string= this.trimText(normalizedText_1);
    if  (int64(len([]rune(text_1)))) > int64(0) {
      var textEl_1 *EVGElement= CreateNew_EVGElement();
      textEl_1.tagName = "text"; 
      textEl_1.textContent = text_1; 
      element.addChild(textEl_1);
    }
  }
}
func (this *ComponentEngine) evaluateExpressionChild (element *EVGElement, exprContainer *TSNode) () {
  if ( exprContainer.left.has_value) {
    var exprNode *TSNode= exprContainer.left.value.(*TSNode);
    if  exprNode.nodeType == "CallExpression" {
      this.evaluateArrayMapChild(element, exprNode);
      return
    }
    if  exprNode.nodeType == "ConditionalExpression" {
      this.evaluateTernaryChild(element, exprNode);
      return
    }
    if  exprNode.nodeType == "BinaryExpression" {
      if  exprNode.value == "&&" {
        this.evaluateAndChild(element, exprNode);
        return
      }
    }
    var value *EvalValue= this.evaluateExpr(exprNode);
    if  value.isElement() {
      if ( value.evgElement.has_value) {
        var childEl *EVGElement= value.evgElement.value.(*EVGElement);
        if  (int64(len([]rune(childEl.tagName)))) > int64(0) {
          element.addChild(childEl);
        }
      }
      return
    }
    if  (value).isArray() {
      var ai int64= int64(0);
      for ai < (int64(len(value.arrayValue))) {
        var arrItem *EvalValue= value.arrayValue[ai];
        if  arrItem.isElement() {
          if ( arrItem.evgElement.has_value) {
            var arrChildEl *EVGElement= arrItem.evgElement.value.(*EVGElement);
            if  (int64(len([]rune(arrChildEl.tagName)))) > int64(0) {
              element.addChild(arrChildEl);
            }
          }
        }
        ai = ai + int64(1); 
      }
      return
    }
    var isStr bool= value.isString();
    var isNum bool= value.isNumber();
    if  isStr || isNum {
      var textEl *EVGElement= CreateNew_EVGElement();
      textEl.tagName = "text"; 
      textEl.textContent = (value).toString(); 
      element.addChild(textEl);
    }
  }
}
func (this *ComponentEngine) evaluateArrayMapChild (element *EVGElement, callNode *TSNode) () {
  if ( callNode.left.has_value) {
    var calleeNode *TSNode= callNode.left.value.(*TSNode);
    if  calleeNode.nodeType == "MemberExpression" {
      var methodName string= calleeNode.name;
      if  methodName == "map" {
        if ( calleeNode.left.has_value) {
          var arrayExpr *TSNode= calleeNode.left.value.(*TSNode);
          var arrayValue *EvalValue= this.evaluateExpr(arrayExpr);
          if  (arrayValue).isArray() {
            if  (int64(len(callNode.children))) > int64(0) {
              var callback *TSNode= callNode.children[int64(0)];
              var i int64= int64(0);
              for i < (int64(len(arrayValue.arrayValue))) {
                var item *EvalValue= arrayValue.arrayValue[i];
                var savedContext *GoNullable = new(GoNullable); 
                savedContext.value = this.context.value;
                savedContext.has_value = this.context.has_value;
                this.context.value = this.context.value.(*EvalContext).createChild();
                this.context.has_value = true; /* detected as non-optional */
                this.bindMapCallback(callback, item, i);
                var resultEl *EVGElement= this.evaluateMapCallbackBody(callback);
                if  (int64(len([]rune(resultEl.tagName)))) > int64(0) {
                  element.addChild(resultEl);
                }
                this.context.value = savedContext.value;
                this.context.has_value = false; 
                if this.context.value != nil {
                  this.context.has_value = true
                }
                i = i + int64(1); 
              }
            }
          }
        }
      }
    }
  }
}
func (this *ComponentEngine) bindMapCallback (callback *TSNode, item *EvalValue, index int64) () {
  if  callback.nodeType == "ArrowFunctionExpression" {
    if  (int64(len(callback.params))) > int64(0) {
      var param *TSNode= callback.params[int64(0)];
      var paramName string= param.name;
      this.context.value.(*EvalContext).define(paramName, item);
    }
    if  (int64(len(callback.params))) > int64(1) {
      var indexParam *TSNode= callback.params[int64(1)];
      this.context.value.(*EvalContext).define(indexParam.name, EvalValue_static_fromInt(index));
    }
  }
}
func (this *ComponentEngine) evaluateMapCallbackBody (callback *TSNode) *EVGElement {
  var empty *EVGElement= CreateNew_EVGElement();
  if  callback.nodeType == "ArrowFunctionExpression" {
    if ( callback.body.has_value) {
      var body *TSNode= callback.body.value.(*TSNode);
      if  (body.nodeType == "JSXElement") || (body.nodeType == "JSXFragment") {
        return this.evaluateJSX(body)
      }
      if  body.nodeType == "BlockStatement" {
        return this.evaluateFunctionBody(body)
      }
    }
  }
  return empty
}
func (this *ComponentEngine) evaluateTernaryChild (element *EVGElement, node *TSNode) () {
  if ( node.test.has_value) {
    var testExpr *TSNode= node.test.value.(*TSNode);
    var testValue *EvalValue= this.evaluateExpr(testExpr);
    if  testValue.toBool() {
      if ( node.consequent.has_value) {
        var conseqNode *TSNode= node.consequent.value.(*TSNode);
        if  (conseqNode.nodeType == "JSXElement") || (conseqNode.nodeType == "JSXFragment") {
          var childEl *EVGElement= this.evaluateJSX(conseqNode);
          if  (int64(len([]rune(childEl.tagName)))) > int64(0) {
            element.addChild(childEl);
          }
        }
      }
    } else {
      if ( node.alternate.has_value) {
        var altNode *TSNode= node.alternate.value.(*TSNode);
        if  (altNode.nodeType == "JSXElement") || (altNode.nodeType == "JSXFragment") {
          var childEl_1 *EVGElement= this.evaluateJSX(altNode);
          if  (int64(len([]rune(childEl_1.tagName)))) > int64(0) {
            element.addChild(childEl_1);
          }
        }
      }
    }
  }
}
func (this *ComponentEngine) evaluateAndChild (element *EVGElement, node *TSNode) () {
  if ( node.left.has_value) {
    var leftExpr *TSNode= node.left.value.(*TSNode);
    var leftValue *EvalValue= this.evaluateExpr(leftExpr);
    if  leftValue.toBool() {
      if ( node.right.has_value) {
        var rightNode *TSNode= node.right.value.(*TSNode);
        if  (rightNode.nodeType == "JSXElement") || (rightNode.nodeType == "JSXFragment") {
          var childEl *EVGElement= this.evaluateJSX(rightNode);
          if  (int64(len([]rune(childEl.tagName)))) > int64(0) {
            element.addChild(childEl);
          }
        }
      }
    }
  }
}
func (this *ComponentEngine) evaluateExpr (node *TSNode) *EvalValue {
  if  node.nodeType == "NumericLiteral" {
    var numVal *GoNullable = new(GoNullable); 
    numVal = r_str_2_d64(node.value);
    if ( numVal.has_value) {
      return EvalValue_static_number((numVal.value.(float64)))
    }
    return EvalValue_static_number(0.0)
  }
  if  node.nodeType == "StringLiteral" {
    return EvalValue_static_string(this.unquote(node.value))
  }
  if  node.nodeType == "TemplateLiteral" {
    var templateText string= "";
    var ti int64= int64(0);
    for ti < (int64(len(node.children))) {
      var templateChild *TSNode= node.children[ti];
      if  templateChild.nodeType == "TemplateElement" {
        templateText = templateText + templateChild.value; 
      }
      ti = ti + int64(1); 
    }
    return EvalValue_static_string(templateText)
  }
  if  node.nodeType == "BooleanLiteral" {
    return EvalValue_static_boolean((node.value == "true"))
  }
  if  node.nodeType == "NullLiteral" {
    return EvalValue_static_null()
  }
  if  node.nodeType == "Identifier" {
    return this.context.value.(*EvalContext).lookup(node.name)
  }
  if  node.nodeType == "BinaryExpression" {
    return this.evaluateBinaryExpr(node)
  }
  if  node.nodeType == "UnaryExpression" {
    return this.evaluateUnaryExpr(node)
  }
  if  node.nodeType == "ConditionalExpression" {
    return this.evaluateConditionalExpr(node)
  }
  if  node.nodeType == "MemberExpression" {
    return this.evaluateMemberExpr(node)
  }
  if  node.nodeType == "ArrayExpression" {
    return this.evaluateArrayExpr(node)
  }
  if  node.nodeType == "ObjectExpression" {
    return this.evaluateObjectExpr(node)
  }
  if  node.nodeType == "ParenthesizedExpression" {
    if ( node.left.has_value) {
      var inner *TSNode= node.left.value.(*TSNode);
      return this.evaluateExpr(inner)
    }
  }
  if  node.nodeType == "JSXElement" {
    var el *EVGElement= this.evaluateJSXElement(node);
    return EvalValue_static_element(el)
  }
  if  node.nodeType == "JSXFragment" {
    var el_1 *EVGElement= CreateNew_EVGElement();
    el_1.tagName = "div"; 
    this.evaluateChildren(el_1, node);
    return EvalValue_static_element(el_1)
  }
  return EvalValue_static_null()
}
func (this *ComponentEngine) evaluateBinaryExpr (node *TSNode) *EvalValue {
  var op string= node.value;
  if  op == "&&" {
    if ( node.left.has_value) {
      var leftExpr *TSNode= node.left.value.(*TSNode);
      var left *EvalValue= this.evaluateExpr(leftExpr);
      if  left.toBool() == false {
        return left
      }
      if ( node.right.has_value) {
        var rightExpr *TSNode= node.right.value.(*TSNode);
        return this.evaluateExpr(rightExpr)
      }
    }
  }
  if  op == "||" {
    if ( node.left.has_value) {
      var leftExpr_1 *TSNode= node.left.value.(*TSNode);
      var left_1 *EvalValue= this.evaluateExpr(leftExpr_1);
      if  left_1.toBool() {
        return left_1
      }
      if ( node.right.has_value) {
        var rightExpr_1 *TSNode= node.right.value.(*TSNode);
        return this.evaluateExpr(rightExpr_1)
      }
    }
  }
  var left_2 *EvalValue= EvalValue_static_null();
  var right *EvalValue= EvalValue_static_null();
  if ( node.left.has_value) {
    var leftExpr_2 *TSNode= node.left.value.(*TSNode);
    left_2 = this.evaluateExpr(leftExpr_2); 
  }
  if ( node.right.has_value) {
    var rightExpr_2 *TSNode= node.right.value.(*TSNode);
    right = this.evaluateExpr(rightExpr_2); 
  }
  if  op == "+" {
    var isLeftStr bool= left_2.isString();
    var isRightStr bool= right.isString();
    if  isLeftStr || isRightStr {
      return EvalValue_static_string(((left_2).toString() + (right).toString()))
    }
    return EvalValue_static_number((left_2.toNumber() + right.toNumber()))
  }
  if  op == "-" {
    return EvalValue_static_number((left_2.toNumber() - right.toNumber()))
  }
  if  op == "*" {
    return EvalValue_static_number((left_2.toNumber() * right.toNumber()))
  }
  if  op == "/" {
    var rightNum float64= right.toNumber();
    if  rightNum != 0.0 {
      return EvalValue_static_number((left_2.toNumber() / rightNum))
    }
    return EvalValue_static_number(0.0)
  }
  if  op == "%" {
    var leftInt int64= int64(left_2.toNumber());
    var rightInt int64= int64(right.toNumber());
    if  rightInt != int64(0) {
      return EvalValue_static_fromInt((leftInt % rightInt))
    }
    return EvalValue_static_number(0.0)
  }
  if  op == "<" {
    return EvalValue_static_boolean((left_2.toNumber() < right.toNumber()))
  }
  if  op == ">" {
    return EvalValue_static_boolean((left_2.toNumber() > right.toNumber()))
  }
  if  op == "<=" {
    return EvalValue_static_boolean((left_2.toNumber() <= right.toNumber()))
  }
  if  op == ">=" {
    return EvalValue_static_boolean((left_2.toNumber() >= right.toNumber()))
  }
  if  (op == "==") || (op == "===") {
    return EvalValue_static_boolean(left_2.equals(right))
  }
  if  (op == "!=") || (op == "!==") {
    return EvalValue_static_boolean((left_2.equals(right) == false))
  }
  return EvalValue_static_null()
}
func (this *ComponentEngine) evaluateUnaryExpr (node *TSNode) *EvalValue {
  var op string= node.value;
  if ( node.left.has_value) {
    var argExpr *TSNode= node.left.value.(*TSNode);
    var arg *EvalValue= this.evaluateExpr(argExpr);
    if  op == "!" {
      return EvalValue_static_boolean((arg.toBool() == false))
    }
    if  op == "-" {
      return EvalValue_static_number((0.0 - arg.toNumber()))
    }
    if  op == "+" {
      return EvalValue_static_number(arg.toNumber())
    }
  }
  return EvalValue_static_null()
}
func (this *ComponentEngine) evaluateConditionalExpr (node *TSNode) *EvalValue {
  if ( node.test.has_value) {
    var testExpr *TSNode= node.test.value.(*TSNode);
    var test *EvalValue= this.evaluateExpr(testExpr);
    if  test.toBool() {
      if ( node.consequent.has_value) {
        var conseqNode *TSNode= node.consequent.value.(*TSNode);
        return this.evaluateExpr(conseqNode)
      }
    } else {
      if ( node.alternate.has_value) {
        var altNode *TSNode= node.alternate.value.(*TSNode);
        return this.evaluateExpr(altNode)
      }
    }
  }
  return EvalValue_static_null()
}
func (this *ComponentEngine) evaluateMemberExpr (node *TSNode) *EvalValue {
  if ( node.left.has_value) {
    var leftExpr *TSNode= node.left.value.(*TSNode);
    var obj *EvalValue= this.evaluateExpr(leftExpr);
    var propName string= node.name;
    if  node.computed {
      if ( node.right.has_value) {
        var indexExpr *TSNode= node.right.value.(*TSNode);
        var indexVal *EvalValue= this.evaluateExpr(indexExpr);
        if  indexVal.isNumber() {
          var idx int64= int64(indexVal.toNumber());
          return obj.getIndex(idx)
        }
        if  indexVal.isString() {
          return obj.getMember(indexVal.stringValue)
        }
      }
    }
    return obj.getMember(propName)
  }
  return EvalValue_static_null()
}
func (this *ComponentEngine) evaluateArrayExpr (node *TSNode) *EvalValue {
  var items []*EvalValue = make([]*EvalValue, 0);
  var i int64= int64(0);
  for i < (int64(len(node.children))) {
    var elem *TSNode= node.children[i];
    var value *EvalValue= this.evaluateExpr(elem);
    items = append(items,value); 
    i = i + int64(1); 
  }
  return EvalValue_static_array(items)
}
func (this *ComponentEngine) evaluateObjectExpr (node *TSNode) *EvalValue {
  var keys []string = make([]string, 0);
  var values []*EvalValue = make([]*EvalValue, 0);
  var i int64= int64(0);
  for i < (int64(len(node.children))) {
    var prop *TSNode= node.children[i];
    if  prop.nodeType == "Property" {
      var key string= prop.name;
      keys = append(keys,key); 
      if ( prop.left.has_value ) {
        var valueNode *TSNode= prop.left.value.(*TSNode);
        values = append(values,this.evaluateExpr(valueNode)); 
      } else {
        values = append(values,EvalValue_static_null()); 
      }
    }
    i = i + int64(1); 
  }
  return EvalValue_static_object(keys, values)
}
func (this *ComponentEngine) mapTagName (jsxTag string) string {
  if  jsxTag == "Print" {
    return "print"
  }
  if  jsxTag == "Section" {
    return "section"
  }
  if  jsxTag == "Page" {
    return "page"
  }
  if  jsxTag == "View" {
    return "div"
  }
  if  jsxTag == "Label" {
    return "text"
  }
  if  jsxTag == "Image" {
    return "image"
  }
  if  jsxTag == "Path" {
    return "path"
  }
  if  jsxTag == "Spacer" {
    return "spacer"
  }
  if  jsxTag == "Divider" {
    return "divider"
  }
  if  jsxTag == "div" {
    return "div"
  }
  if  jsxTag == "span" {
    return "text"
  }
  if  jsxTag == "img" {
    return "image"
  }
  if  jsxTag == "path" {
    return "path"
  }
  return "div"
}
func (this *ComponentEngine) trimText (text string) string {
  var result string= "";
  var started bool= false;
  var i int64= int64(0);
  var __len int64= int64(len([]rune(text)));
  for i < __len {
    var c int64= int64([]rune(text)[i]);
    var isWhitespace bool= (((c == int64(32)) || (c == int64(9))) || (c == int64(10))) || (c == int64(13));
    if  started {
      result = result + (string([]rune{rune(c)})); 
    } else {
      if  isWhitespace == false {
        started = true; 
        result = string([]rune{rune(c)}); 
      }
    }
    i = i + int64(1); 
  }
  var trimLen int64= int64(len([]rune(result)));
  for trimLen > int64(0) {
    var lastC int64= int64([]rune(result)[(trimLen - int64(1))]);
    if  (((lastC == int64(32)) || (lastC == int64(9))) || (lastC == int64(10))) || (lastC == int64(13)) {
      result = string([]rune(result)[int64(0):(trimLen - int64(1))]); 
      trimLen = trimLen - int64(1); 
    } else {
      trimLen = int64(0); 
    }
  }
  return result
}
func (this *ComponentEngine) normalizeWhitespace (text string) string {
  var result string= "";
  var lastWasSpace bool= false;
  var i int64= int64(0);
  var __len int64= int64(len([]rune(text)));
  for i < __len {
    var c int64= int64([]rune(text)[i]);
    var isWhitespace bool= (((c == int64(32)) || (c == int64(9))) || (c == int64(10))) || (c == int64(13));
    if  isWhitespace {
      if  lastWasSpace == false {
        result = result + " "; 
        lastWasSpace = true; 
      }
    } else {
      result = result + (string([]rune{rune(c)})); 
      lastWasSpace = false; 
    }
    i = i + int64(1); 
  }
  return result
}
func (this *ComponentEngine) startsWithPunctuation (s string) bool {
  if  (int64(len([]rune(s)))) == int64(0) {
    return false
  }
  var first int64= int64([]rune(s)[int64(0)]);
  if  (((((first == int64(44)) || (first == int64(46))) || (first == int64(33))) || (first == int64(63))) || (first == int64(58))) || (first == int64(59)) {
    return true
  }
  if  ((first == int64(41)) || (first == int64(93))) || (first == int64(125)) {
    return true
  }
  if  ((first == int64(39)) || (first == int64(34))) || (first == int64(45)) {
    return true
  }
  return false
}
func (this *ComponentEngine) endsWithOpenPunctuation (s string) bool {
  var __len int64= int64(len([]rune(s)));
  if  __len == int64(0) {
    return false
  }
  var last int64= int64([]rune(s)[(__len - int64(1))]);
  if  (((last == int64(40)) || (last == int64(91))) || (last == int64(123))) || (last == int64(45)) {
    return true
  }
  return false
}
func (this *ComponentEngine) smartJoinText (existing string, newText string) string {
  if  (int64(len([]rune(existing)))) == int64(0) {
    return newText
  }
  if  (int64(len([]rune(newText)))) == int64(0) {
    return existing
  }
  if  this.startsWithPunctuation(newText) {
    return existing + newText
  }
  if  this.endsWithOpenPunctuation(existing) {
    return existing + newText
  }
  return (existing + " ") + newText
}
func (this *ComponentEngine) unquote (s string) string {
  var __len int64= int64(len([]rune(s)));
  if  __len < int64(2) {
    return s
  }
  var first int64= int64([]rune(s)[int64(0)]);
  var last int64= int64([]rune(s)[(__len - int64(1))]);
  if  ((first == int64(34)) || (first == int64(39))) && (first == last) {
    return string([]rune(s)[int64(1):(__len - int64(1))])
  }
  return s
}
type EVGComponentTool struct { 
  pageWidth float64 `json:"pageWidth"` 
  pageHeight float64 `json:"pageHeight"` 
  inputPath string `json:"inputPath"` 
  outputPath string `json:"outputPath"` 
  fontsDir string `json:"fontsDir"` 
  assetPaths string `json:"assetPaths"` 
  fontManager *FontManager `json:"fontManager"` 
}

func CreateNew_EVGComponentTool() *EVGComponentTool {
  me := new(EVGComponentTool)
  me.pageWidth = 595.0
  me.pageHeight = 842.0
  me.inputPath = ""
  me.outputPath = ""
  me.fontsDir = "./Fonts"
  me.assetPaths = ""
  me.fontManager = CreateNew_FontManager()
  return me;
}
func (this *EVGComponentTool) main (args []string) () {
  fmt.Println( "EVG Component Tool v1.0 - PDF Generator with TSX Components" )
  fmt.Println( "============================================================" )
  if  (int64(len(args))) < int64(3) {
    fmt.Println( "Usage: evg_component_tool <input.tsx> <output.pdf> [--assets=path1;path2;...]" )
    fmt.Println( "" )
    fmt.Println( "Options:" )
    fmt.Println( "  --assets=PATHS  Semicolon-separated list of asset directories" )
    fmt.Println( "                  Used for fonts, components, and images" )
    fmt.Println( "" )
    fmt.Println( "Example:" )
    fmt.Println( "  evg_component_tool test.tsx output.pdf --assets=./Fonts;./components" )
    return
  }
  this.inputPath = args[int64(1)]; 
  this.outputPath = args[int64(2)]; 
  var i int64= int64(3);
  for i < (int64(len(args))) {
    var arg string= args[i];
    if  (int64(strings.Index(arg, "--assets="))) == int64(0) {
      this.assetPaths = string([]rune(arg)[int64(9):(int64(len([]rune(arg))))]); 
      fmt.Println( "Asset paths: " + this.assetPaths )
    }
    i = i + int64(1); 
  }
  if  (int64(len([]rune(this.assetPaths)))) == int64(0) {
    fmt.Println( "" )
    fmt.Println( "ERROR: Missing required --assets argument" )
    fmt.Println( "" )
    fmt.Println( "The --assets argument is required to specify where fonts and components are located." )
    fmt.Println( "" )
    fmt.Println( "Usage: evg_component_tool <input.tsx> <output.pdf> --assets=path1;path2;..." )
    fmt.Println( "" )
    fmt.Println( "Example:" )
    fmt.Println( "  evg_component_tool test.tsx output.pdf --assets=./Fonts;./components" )
    return
  }
  fmt.Println( "Input:  " + this.inputPath )
  fmt.Println( "Output: " + this.outputPath )
  fmt.Println( "" )
  var basePath string= this.getDirectory(this.inputPath);
  var fileName string= this.getFileName(this.inputPath);
  fmt.Println( "Base path: " + basePath )
  fmt.Println( "File name: " + fileName )
  fmt.Println( "" )
  this.initFonts();
  if  this.fontManager.getFontCount() == int64(0) {
    fmt.Println( "" )
    fmt.Println( "ERROR: No fonts were loaded!" )
    fmt.Println( "" )
    fmt.Println( "Please check that your --assets path contains a fonts directory with .ttf files." )
    fmt.Println( "Expected structure: <assets-path>/Open_Sans/OpenSans-Regular.ttf" )
    fmt.Println( "" )
    fmt.Println( "Current asset paths: " + this.assetPaths )
    return
  }
  var engine *ComponentEngine= CreateNew_ComponentEngine();
  engine.pageWidth = this.pageWidth; 
  engine.pageHeight = this.pageHeight; 
  if  (int64(len([]rune(this.assetPaths)))) > int64(0) {
    engine.setAssetPaths(this.assetPaths);
  }
  fmt.Println( "Parsing TSX with components..." )
  var evgRoot *EVGElement= engine.parseFile(basePath, fileName);
  if  (int64(len([]rune(evgRoot.tagName)))) == int64(0) {
    fmt.Println( "Error: Failed to generate EVG tree" )
    return
  }
  fmt.Println( "EVG tree generated successfully" )
  fmt.Println( "" )
  fmt.Println( "EVG Tree Structure:" )
  fmt.Println( "-------------------" )
  this.printEVGTree(evgRoot, int64(0));
  fmt.Println( "" )
  fmt.Println( "Rendering to PDF..." )
  var renderer *EVGPDFRenderer= CreateNew_EVGPDFRenderer();
  renderer.init(renderer);
  renderer.setPageSize(this.pageWidth, this.pageHeight);
  renderer.setFontManager(this.fontManager);
  renderer.setBaseDir(basePath);
  if  (int64(len([]rune(this.assetPaths)))) > int64(0) {
    renderer.setAssetPaths(this.assetPaths);
  }
  var ttfMeasurer *TTFTextMeasurer= CreateNew_TTFTextMeasurer(this.fontManager);
  renderer.setMeasurer(ttfMeasurer);
  var pdfBuffer []byte= renderer.render(evgRoot);
  var outputDir string= this.getDirectory(this.outputPath);
  var outputFileName string= this.getFileName(this.outputPath);
  os.WriteFile(outputDir + "/" + outputFileName, pdfBuffer, 0644)
  fmt.Println( "PDF generated successfully: " + this.outputPath )
}
func (this *EVGComponentTool) printEVGTree (el *EVGElement, depth int64) () {
  var indent string= "";
  var i int64= int64(0);
  for i < depth {
    indent = indent + "  "; 
    i = i + int64(1); 
  }
  var info string= (indent + "<") + el.tagName;
  if  (int64(len([]rune(el.id)))) > int64(0) {
    info = ((info + " id=\"") + el.id) + "\""; 
  }
  if  (int64(len([]rune(el.textContent)))) > int64(0) {
    if  (int64(len([]rune(el.textContent)))) > int64(30) {
      info = ((info + " text=\"") + (string([]rune(el.textContent)[int64(0):int64(30)]))) + "...\""; 
    } else {
      info = ((info + " text=\"") + el.textContent) + "\""; 
    }
  }
  info = (((((((info + "> pos=(") + (strconv.FormatFloat(el.calculatedX,'f', 6, 64))) + ",") + (strconv.FormatFloat(el.calculatedY,'f', 6, 64))) + ") size=") + (strconv.FormatFloat(el.calculatedWidth,'f', 6, 64))) + "x") + (strconv.FormatFloat(el.calculatedHeight,'f', 6, 64)); 
  fmt.Println( info )
  i = int64(0); 
  for i < (int64(len(el.children))) {
    var child *EVGElement= el.children[i];
    this.printEVGTree(child, depth + int64(1));
    i = i + int64(1); 
  }
}
func (this *EVGComponentTool) initFonts () () {
  fmt.Println( "Loading fonts..." )
  if  (int64(len([]rune(this.assetPaths)))) > int64(0) {
    this.fontManager.setFontsDirectories(this.assetPaths);
  } else {
    this.fontManager.setFontsDirectory(this.fontsDir);
  }
  this.fontManager.loadFont("Open_Sans/OpenSans-Regular.ttf");
  this.fontManager.loadFont("Open_Sans/OpenSans-Bold.ttf");
  this.fontManager.loadFont("Helvetica/Helvetica.ttf");
  this.fontManager.loadFont("Noto_Sans/NotoSans-Regular.ttf");
  this.fontManager.loadFont("Noto_Sans/NotoSans-Bold.ttf");
  this.fontManager.loadFont("Cinzel/Cinzel-Regular.ttf");
  this.fontManager.loadFont("Josefin_Sans/JosefinSans-Regular.ttf");
  this.fontManager.loadFont("Gloria_Hallelujah/GloriaHallelujah.ttf");
  this.fontManager.loadFont("Great_Vibes/GreatVibes-Regular.ttf");
  this.fontManager.loadFont("Kaushan_Script/KaushanScript-Regular.ttf");
}
func (this *EVGComponentTool) getDirectory (path string) string {
  var lastSlash int64= int64(-1);
  var i int64= int64(0);
  var __len int64= int64(len([]rune(path)));
  for i < __len {
    var ch string= string([]rune(path)[i:(i + int64(1))]);
    if  (ch == "/") || (ch == "\\") {
      lastSlash = i; 
    }
    i = i + int64(1); 
  }
  if  lastSlash >= int64(0) {
    return string([]rune(path)[int64(0):(lastSlash + int64(1))])
  }
  return "./"
}
func (this *EVGComponentTool) getFileName (path string) string {
  var lastSlash int64= int64(-1);
  var i int64= int64(0);
  var __len int64= int64(len([]rune(path)));
  for i < __len {
    var ch string= string([]rune(path)[i:(i + int64(1))]);
    if  (ch == "/") || (ch == "\\") {
      lastSlash = i; 
    }
    i = i + int64(1); 
  }
  if  lastSlash >= int64(0) {
    return string([]rune(path)[(lastSlash + int64(1)):__len])
  }
  return path
}
func main() {
  var tool *EVGComponentTool= CreateNew_EVGComponentTool();
  var argCount int64= int64( len( os.Args) - 1 );
  if  argCount < int64(2) {
    fmt.Println( "Usage: evg_component_tool <input.tsx> <output.pdf>" )
    return
  }
  var args []string = make([]string, 0);
  args = append(args,"evg_component_tool"); 
  var i int64= int64(0);
  for i < argCount {
    args = append(args,os.Args[i + 1]); 
    i = i + int64(1); 
  }
  tool.main(args);
}
