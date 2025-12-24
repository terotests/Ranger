package main
import (
  "fmt"
  "strings"
  "strconv"
  "os"
  "path/filepath"
  "encoding/base64"
  "net/http"
  "log"
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


func r_file_mtime(pathName string, fileName string) int64 {
    info, err := os.Stat(pathName + "/" + fileName)
    if err != nil {
        return 0
    }
    return info.ModTime().Unix()
}

// SSEClient represents a Server-Sent Events client connection
type SSEClient struct {
  Writer      http.ResponseWriter
  Flusher     http.Flusher
  Request     *http.Request
  IsConnected bool
  done        chan bool
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
    this.skipIgnoredTokens();
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
  this.skipIgnoredTokens();
}
func (this *TSParserSimple) skipIgnoredTokens () () {
  for this.pos < (int64(len(this.tokens))) {
    var tok *Token= this.peek();
    var tokType string= tok.tokenType;
    if  (tokType == "LineComment") || (tokType == "BlockComment") {
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
        return
      }
    } else {
      return
    }
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
type EVGGradientStop struct { 
  percentage float64 `json:"percentage"` 
  color *EVGColor `json:"color"` 
}

func CreateNew_EVGGradientStop() *EVGGradientStop {
  me := new(EVGGradientStop)
  me.percentage = 0.0
  me.color = CreateNew_EVGColor()
  return me;
}
func EVGGradientStop_static_create(pct float64, col *EVGColor) *EVGGradientStop {
  var stop *EVGGradientStop= CreateNew_EVGGradientStop();
  stop.percentage = pct; 
  stop.color = col; 
  return stop
}
type EVGGradient struct { 
  isSet bool `json:"isSet"` 
  isLinear bool `json:"isLinear"` 
  angle float64 `json:"angle"` 
  stops []*EVGGradientStop `json:"stops"` 
}

func CreateNew_EVGGradient() *EVGGradient {
  me := new(EVGGradient)
  me.isSet = false
  me.isLinear = true
  me.angle = 0.0
  me.stops = make([]*EVGGradientStop,0)
  var s []*EVGGradientStop = make([]*EVGGradientStop, 0);
  me.stops = s; 
  return me;
}
func EVGGradient_static_parse(gradStr string) *EVGGradient {
  var grad *EVGGradient= CreateNew_EVGGradient();
  var __len int64= int64(len([]rune(gradStr)));
  if  __len == int64(0) {
    return grad
  }
  var linearIdx int64= int64(strings.Index(gradStr, "linear-gradient"));
  var radialIdx int64= int64(strings.Index(gradStr, "radial-gradient"));
  if  linearIdx >= int64(0) {
    grad.isLinear = true; 
    grad.isSet = true; 
  }
  if  radialIdx >= int64(0) {
    grad.isLinear = false; 
    grad.isSet = true; 
  }
  if  grad.isSet == false {
    return grad
  }
  if  grad.isLinear {
    var degIdx int64= int64(strings.Index(gradStr, "deg"));
    if  degIdx > int64(0) {
      var startIdx int64= int64(strings.Index(gradStr, "("));
      if  startIdx >= int64(0) {
        var angleStr string= string([]rune(gradStr)[(startIdx + int64(1)):degIdx]);
        var angleVal *GoNullable = new(GoNullable); 
        angleVal = r_str_2_d64((strings.TrimSpace(angleStr)));
        if ( angleVal.has_value) {
          grad.angle = angleVal.value.(float64); 
        }
      }
    }
  }
  var colors []*EVGColor = make([]*EVGColor, 0);
  var i int64= int64(0);
  for i < __len {
    var ch int64= int64([]rune(gradStr)[i]);
    if  ch == int64(35) {
      var colorStart int64= i;
      var colorEnd int64= i + int64(1);
      for colorEnd < __len {
        var c int64= int64([]rune(gradStr)[colorEnd]);
        var isHex bool= false;
        if  (c >= int64(48)) && (c <= int64(57)) {
          isHex = true; 
        }
        if  (c >= int64(65)) && (c <= int64(70)) {
          isHex = true; 
        }
        if  (c >= int64(97)) && (c <= int64(102)) {
          isHex = true; 
        }
        if  isHex {
          colorEnd = colorEnd + int64(1); 
        } else {
          break;
        }
      }
      var colorStr string= string([]rune(gradStr)[colorStart:colorEnd]);
      var parsedColor *EVGColor= EVGColor_static_parseHex(colorStr);
      if  parsedColor.isSet {
        colors = append(colors,parsedColor); 
      }
      i = colorEnd; 
    } else {
      i = i + int64(1); 
    }
  }
  var numColors int64= int64(len(colors));
  if  numColors > int64(0) {
    var colorIdx int64= int64(0);
    for colorIdx < numColors {
      var pct float64= 0.0;
      if  numColors > int64(1) {
        pct = (float64( colorIdx )) / (float64( (numColors - int64(1)) )); 
      }
      var col *EVGColor= colors[colorIdx];
      grad.addStop(pct, col);
      colorIdx = colorIdx + int64(1); 
    }
  }
  return grad
}
func (this *EVGGradient) getStartColor () *EVGColor {
  if  (int64(len(this.stops))) > int64(0) {
    var stop *EVGGradientStop= this.stops[int64(0)];
    return stop.color
  }
  return EVGColor_static_noColor()
}
func (this *EVGGradient) getEndColor () *EVGColor {
  var __len int64= int64(len(this.stops));
  if  __len > int64(0) {
    var stop *EVGGradientStop= this.stops[(__len - int64(1))];
    return stop.color
  }
  return EVGColor_static_noColor()
}
func (this *EVGGradient) getStopCount () int64 {
  return int64(len(this.stops))
}
func (this *EVGGradient) getStop (index int64) *EVGGradientStop {
  return this.stops[index]
}
func (this *EVGGradient) addStop (percentage float64, color *EVGColor) () {
  var stop *EVGGradientStop= EVGGradientStop_static_create(percentage, color);
  this.stops = append(this.stops,stop); 
}
func (this *EVGGradient) toCSSString () string {
  if  this.isSet == false {
    return ""
  }
  var result string= "";
  if  this.isLinear {
    result = ("linear-gradient(" + (strconv.FormatFloat(this.angle,'f', 6, 64))) + "deg"; 
  } else {
    result = "radial-gradient(circle"; 
  }
  var numStops int64= int64(len(this.stops));
  var i int64= int64(0);
  for i < numStops {
    var stop *EVGGradientStop= this.stops[i];
    result = (result + ", ") + stop.color.toCSSString(); 
    i = i + int64(1); 
  }
  result = result + ")"; 
  return result
}
type EVGElement struct { 
  id string `json:"id"` 
  tagName string `json:"tagName"` 
  elementType int64 `json:"elementType"` 
  format string `json:"format"` 
  orientation string `json:"orientation"` 
  pageWidth float64 `json:"pageWidth"` 
  pageHeight float64 `json:"pageHeight"` 
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
  display string `json:"display"` 
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
  alt string `json:"alt"` 
  imageViewBox string /**  unused  **/  `json:"imageViewBox"` 
  imageViewBoxX float64 `json:"imageViewBoxX"` 
  imageViewBoxY float64 `json:"imageViewBoxY"` 
  imageViewBoxW float64 `json:"imageViewBoxW"` 
  imageViewBoxH float64 `json:"imageViewBoxH"` 
  imageViewBoxSet bool `json:"imageViewBoxSet"` 
  objectFit string `json:"objectFit"` 
  sourceWidth float64 `json:"sourceWidth"` 
  sourceHeight float64 `json:"sourceHeight"` 
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
  backgroundGradient string `json:"backgroundGradient"` 
  gradient *EVGGradient `json:"gradient"` 
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
  me.format = ""
  me.orientation = ""
  me.pageWidth = 0.0
  me.pageHeight = 0.0
  me.children = make([]*EVGElement,0)
  me.opacity = 1.0
  me.direction = "row"
  me.align = "left"
  me.verticalAlign = "top"
  me.isInline = false
  me.lineBreak = false
  me.overflow = "visible"
  me.fontFamily = "Noto Sans"
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
  me.imageViewBox = ""
  me.imageViewBoxX = 0.0
  me.imageViewBoxY = 0.0
  me.imageViewBoxW = 1.0
  me.imageViewBoxH = 1.0
  me.imageViewBoxSet = false
  me.objectFit = "cover"
  me.sourceWidth = 0.0
  me.sourceHeight = 0.0
  me.svgPath = ""
  me.viewBox = ""
  me.strokeWidth = 0.0
  me.clipPath = ""
  me.className = ""
  me.imageQuality = int64(0)
  me.maxImageSize = int64(0)
  me.rotate = 0.0
  me.scale = 1.0
  me.backgroundGradient = ""
  me.gradient = CreateNew_EVGGradient()
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
func (this *EVGElement) resolveBookFormat () () {
  var w float64= 595.0;
  var h float64= 842.0;
  if  this.format == "a4" {
    w = 595.0; 
    h = 842.0; 
  }
  if  this.format == "letter" {
    w = 612.0; 
    h = 792.0; 
  }
  if  this.format == "trade-5x8" {
    w = 360.0; 
    h = 576.0; 
  }
  if  this.format == "trade-6x9" {
    w = 432.0; 
    h = 648.0; 
  }
  if  this.format == "trade-8x10" {
    w = 576.0; 
    h = 720.0; 
  }
  if  this.format == "mini-square" {
    w = 360.0; 
    h = 360.0; 
  }
  if  this.format == "small-square" {
    w = 504.0; 
    h = 504.0; 
  }
  if  this.format == "standard-portrait" {
    w = 576.0; 
    h = 720.0; 
  }
  if  this.format == "standard-landscape" {
    w = 720.0; 
    h = 576.0; 
  }
  if  this.format == "large-landscape" {
    w = 936.0; 
    h = 792.0; 
  }
  if  this.format == "large-square" {
    w = 864.0; 
    h = 864.0; 
  }
  if  this.format == "magazine" {
    w = 612.0; 
    h = 792.0; 
  }
  if  this.orientation == "landscape" {
    if  w < h {
      var temp float64= w;
      w = h; 
      h = temp; 
    }
  }
  if  this.orientation == "portrait" {
    if  w > h {
      var temp_1 float64= w;
      w = h; 
      h = temp_1; 
    }
  }
  if  this.pageWidth > 0.0 {
    w = this.pageWidth; 
  }
  if  this.pageHeight > 0.0 {
    h = this.pageHeight; 
  }
  this.pageWidth = w; 
  this.pageHeight = h; 
}
func (this *EVGElement) inheritProperties (parentEl *EVGElement) () {
  if  this.fontFamily == "Noto Sans" {
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
  if  name == "format" {
    this.format = strings.ToLower(value); 
    return
  }
  if  name == "orientation" {
    this.orientation = strings.ToLower(value); 
    return
  }
  if  name == "pageWidth" {
    var pw *GoNullable = new(GoNullable); 
    pw = r_str_2_d64(value);
    if ( pw.has_value) {
      this.pageWidth = pw.value.(float64); 
    }
    return
  }
  if  name == "pageHeight" {
    var ph *GoNullable = new(GoNullable); 
    ph = r_str_2_d64(value);
    if ( ph.has_value) {
      this.pageHeight = ph.value.(float64); 
    }
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
  if  (name == "background-gradient") || (name == "backgroundGradient") {
    this.backgroundGradient = value; 
    this.gradient = EVGGradient_static_parse(value); 
    return
  }
  if  name == "background" {
    if  (strings.Contains(value, "linear-gradient")) || (strings.Contains(value, "radial-gradient")) {
      this.backgroundGradient = value; 
      this.gradient = EVGGradient_static_parse(value); 
    } else {
      this.backgroundColor.value = EVGColor_static_parse(value);
      this.backgroundColor.has_value = true; /* detected as non-optional */
    }
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
  var ap []string = make([]string, 0);
  me.assetPaths = ap; 
  me.primitives = append(me.primitives,"View"); 
  me.primitives = append(me.primitives,"Label"); 
  me.primitives = append(me.primitives,"Print"); 
  me.primitives = append(me.primitives,"Section"); 
  me.primitives = append(me.primitives,"Page"); 
  me.primitives = append(me.primitives,"Image"); 
  me.primitives = append(me.primitives,"Path"); 
  me.primitives = append(me.primitives,"Spacer"); 
  me.primitives = append(me.primitives,"Divider"); 
  me.primitives = append(me.primitives,"Layer"); 
  me.primitives = append(me.primitives,"div"); 
  me.primitives = append(me.primitives,"span"); 
  me.primitives = append(me.primitives,"p"); 
  me.primitives = append(me.primitives,"h1"); 
  me.primitives = append(me.primitives,"h2"); 
  me.primitives = append(me.primitives,"h3"); 
  me.primitives = append(me.primitives,"img"); 
  me.primitives = append(me.primitives,"path"); 
  me.primitives = append(me.primitives,"layer"); 
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
  if  tagName == "Print" {
    element.resolveBookFormat();
    if  element.pageWidth > 0.0 {
      this.pageWidth = element.pageWidth; 
    }
    if  element.pageHeight > 0.0 {
      this.pageHeight = element.pageHeight; 
    }
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
  if  jsxTag == "Layer" {
    return "layer"
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
  if  jsxTag == "layer" {
    return "layer"
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
  if  (element.tagName == "Page") || (element.tagName == "page") {
    if  element.width.value.(*EVGUnit).isSet == false {
      width = this.pageWidth; 
    }
    if  element.height.value.(*EVGUnit).isSet == false {
      height = this.pageHeight; 
      autoHeight = false; 
    }
  }
  if  element.height.value.(*EVGUnit).isSet {
    height = element.height.value.(*EVGUnit).pixels; 
    autoHeight = false; 
  }
  if  ((element.tagName == "image") || (element.tagName == "Image")) || (element.tagName == "img") {
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
      if  child.tagName == "layer" {
        child.unitsResolved = false; 
        child.resolveUnits(parent.calculatedWidth, parent.calculatedHeight);
        child.calculatedWidth = parent.calculatedWidth; 
        child.calculatedHeight = parent.calculatedHeight; 
        child.calculatedInnerWidth = child.box.value.(*EVGBox).getInnerWidth(child.calculatedWidth); 
        child.calculatedInnerHeight = child.box.value.(*EVGBox).getInnerHeight(child.calculatedHeight); 
        child.height.value.(*EVGUnit).isSet = true; 
        child.height.value.(*EVGUnit).pixels = child.calculatedHeight; 
        this.layoutAbsolute(child, parent.calculatedWidth, parent.calculatedHeight);
        child.calculatedX = child.calculatedX + parent.calculatedX; 
        child.calculatedY = child.calculatedY + parent.calculatedY; 
      } else {
        this.layoutAbsolute(child, innerWidth, innerHeight);
        child.calculatedX = child.calculatedX + startX; 
        child.calculatedY = child.calculatedY + startY; 
      }
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
type ImageInfo struct { 
  path string `json:"path"` 
  width int64 `json:"width"` 
  height int64 `json:"height"` 
  loaded bool `json:"loaded"` 
  error string `json:"error"` 
}

func CreateNew_ImageInfo() *ImageInfo {
  me := new(ImageInfo)
  me.path = ""
  me.width = int64(0)
  me.height = int64(0)
  me.loaded = false
  me.error = ""
  return me;
}
type EVGResourceLoader struct { 
  basePath string `json:"basePath"` 
  imageCache []*ImageInfo `json:"imageCache"` 
  metadataParser *GoNullable `json:"metadataParser"` 
  debug bool `json:"debug"` 
}

func CreateNew_EVGResourceLoader() *EVGResourceLoader {
  me := new(EVGResourceLoader)
  me.basePath = "./"
  me.imageCache = make([]*ImageInfo,0)
  me.debug = false
  me.metadataParser = new(GoNullable);
  var cache []*ImageInfo = make([]*ImageInfo, 0);
  me.imageCache = cache; 
  var mp *JPEGMetadataParser= CreateNew_JPEGMetadataParser();
  me.metadataParser.value = mp;
  me.metadataParser.has_value = true; /* detected as non-optional */
  return me;
}
func (this *EVGResourceLoader) setBasePath (path string) () {
  this.basePath = path; 
}
func (this *EVGResourceLoader) loadResources (root *EVGElement) () {
  fmt.Println( "ResourceLoader: Starting resource loading..." )
  this.processElement(root);
  fmt.Println( ("ResourceLoader: Loaded " + (strconv.FormatInt((int64(len(this.imageCache))), 10))) + " images" )
}
func (this *EVGResourceLoader) processElement (el *EVGElement) () {
  fmt.Println( (("ResourceLoader: processElement tagName=" + el.tagName) + " src=") + el.src )
  if  ((el.tagName == "Image") || (el.tagName == "image")) || (el.tagName == "img") {
    if  (int64(len([]rune(el.src)))) > int64(0) {
      fmt.Println( "ResourceLoader: Found image: " + el.src )
      this.loadImageMetadata(el);
    }
  }
  if  el.elementType == int64(2) {
    if  (int64(len([]rune(el.src)))) > int64(0) {
      fmt.Println( "ResourceLoader: Found image by elementType: " + el.src )
      this.loadImageMetadata(el);
    }
  }
  var i int64= int64(0);
  for i < (int64(len(el.children))) {
    var child *EVGElement= el.children[i];
    this.processElement(child);
    i = i + int64(1); 
  }
}
func (this *EVGResourceLoader) loadImageMetadata (el *EVGElement) () {
  var imgPath string= el.src;
  var cached *ImageInfo= this.getCachedImage(imgPath);
  if  cached.loaded {
    el.sourceWidth = float64( cached.width ); 
    el.sourceHeight = float64( cached.height ); 
    if  this.debug {
      fmt.Println( ((((("ResourceLoader: Cache hit for " + imgPath) + " (") + (strconv.FormatInt(cached.width, 10))) + "x") + (strconv.FormatInt(cached.height, 10))) + ")" )
    }
    return
  }
  var dirPath string= "";
  var fileName string= "";
  var lastSlash int64= int64(strings.LastIndex(imgPath, "/"));
  var lastBackslash int64= int64(strings.LastIndex(imgPath, "\\"));
  var lastSep int64= lastSlash;
  if  lastBackslash > lastSep {
    lastSep = lastBackslash; 
  }
  if  lastSep >= int64(0) {
    dirPath = string([]rune(imgPath)[int64(0):(lastSep + int64(1))]); 
    fileName = string([]rune(imgPath)[(lastSep + int64(1)):(int64(len([]rune(imgPath))))]); 
  } else {
    dirPath = ""; 
    fileName = imgPath; 
  }
  var fullDirPath string= dirPath;
  if  (int64(strings.Index(imgPath, "/"))) != int64(0) {
    if  (int64(strings.Index(dirPath, "./"))) == int64(0) {
      if  this.basePath == "./" {
        fullDirPath = dirPath; 
      } else {
        fullDirPath = this.basePath + (string([]rune(dirPath)[int64(2):(int64(len([]rune(dirPath))))])); 
      }
    } else {
      fullDirPath = this.basePath + dirPath; 
    }
  }
  fmt.Println( ("ResourceLoader: Loading " + fullDirPath) + fileName )
  var meta *JPEGMetadataInfo= this.metadataParser.value.(*JPEGMetadataParser).parseMetadata(fullDirPath, fileName);
  if  meta.isValid == false {
    var altDirPath string= "";
    if  (int64(strings.Index(dirPath, "./"))) == int64(0) {
      altDirPath = "./assets/" + (string([]rune(dirPath)[int64(2):(int64(len([]rune(dirPath))))])); 
    } else {
      altDirPath = "./assets/" + dirPath; 
    }
    fmt.Println( ("ResourceLoader: Trying alternative path: " + altDirPath) + fileName )
    meta = this.metadataParser.value.(*JPEGMetadataParser).parseMetadata(altDirPath, fileName); 
  }
  if  meta.isValid == false {
    fmt.Println( ((("ResourceLoader: ERROR - " + meta.errorMessage) + ": ") + fullDirPath) + fileName )
    var errInfo *ImageInfo= CreateNew_ImageInfo();
    errInfo.path = imgPath; 
    errInfo.loaded = true; 
    errInfo.error = meta.errorMessage; 
    this.imageCache = append(this.imageCache,errInfo); 
    return
  }
  var imgWidth int64= meta.width;
  var imgHeight int64= meta.height;
  if  (((meta.orientation == int64(5)) || (meta.orientation == int64(6))) || (meta.orientation == int64(7))) || (meta.orientation == int64(8)) {
    imgWidth = meta.height; 
    imgHeight = meta.width; 
  }
  el.sourceWidth = float64( imgWidth ); 
  el.sourceHeight = float64( imgHeight ); 
  if  this.debug {
    fmt.Println( ((((("ResourceLoader: Loaded " + imgPath) + " (") + (strconv.FormatInt(imgWidth, 10))) + "x") + (strconv.FormatInt(imgHeight, 10))) + ")" )
  }
  var info *ImageInfo= CreateNew_ImageInfo();
  info.path = imgPath; 
  info.width = imgWidth; 
  info.height = imgHeight; 
  info.loaded = true; 
  this.imageCache = append(this.imageCache,info); 
}
func (this *EVGResourceLoader) getCachedImage (path string) *ImageInfo {
  var i int64= int64(0);
  for i < (int64(len(this.imageCache))) {
    var info *ImageInfo= this.imageCache[i];
    if  info.path == path {
      return info
    }
    i = i + int64(1); 
  }
  var empty *ImageInfo= CreateNew_ImageInfo();
  return empty
}
func (this *EVGResourceLoader) clearCache () () {
  var empty []*ImageInfo = make([]*ImageInfo, 0);
  this.imageCache = empty; 
}
type EVGHTMLRenderer struct { 
  layout *GoNullable `json:"layout"` 
  measurer *GoNullable `json:"measurer"` 
  resourceLoader *GoNullable `json:"resourceLoader"` 
  pageWidth float64 `json:"pageWidth"` 
  pageHeight float64 `json:"pageHeight"` 
  debug bool `json:"debug"` 
  indentLevel int64 /**  unused  **/  `json:"indentLevel"` 
  indentString string `json:"indentString"` 
  usedFontFamilies []string `json:"usedFontFamilies"` 
  fontBasePath string `json:"fontBasePath"` 
  imageBasePath string `json:"imageBasePath"` 
  outputMode string /**  unused  **/  `json:"outputMode"` 
  prettyPrint bool `json:"prettyPrint"` 
  elementCounter int64 `json:"elementCounter"` 
  title string `json:"title"` 
  baseDir string `json:"baseDir"` 
  embedAssets bool `json:"embedAssets"` 
  imageServerUrl string /**  unused  **/  `json:"imageServerUrl"` 
  foundSections []*EVGElement `json:"foundSections"` 
  foundPages []*EVGElement `json:"foundPages"` 
}

func CreateNew_EVGHTMLRenderer() *EVGHTMLRenderer {
  me := new(EVGHTMLRenderer)
  me.pageWidth = 595.0
  me.pageHeight = 842.0
  me.debug = false
  me.indentLevel = int64(0)
  me.indentString = "  "
  me.usedFontFamilies = make([]string,0)
  me.fontBasePath = "./fonts/"
  me.imageBasePath = "./"
  me.outputMode = "inline"
  me.prettyPrint = true
  me.elementCounter = int64(0)
  me.title = "EVG Preview"
  me.baseDir = "./"
  me.embedAssets = false
  me.imageServerUrl = ""
  me.foundSections = make([]*EVGElement,0)
  me.foundPages = make([]*EVGElement,0)
  me.layout = new(GoNullable);
  me.measurer = new(GoNullable);
  me.resourceLoader = new(GoNullable);
  var lay *EVGLayout= CreateNew_EVGLayout();
  me.layout.value = lay;
  me.layout.has_value = true; /* detected as non-optional */
  var m_1 *SimpleTextMeasurer= CreateNew_SimpleTextMeasurer();
  me.measurer.value = m_1;
  me.measurer.has_value = true; /* detected as non-optional */
  var rl *EVGResourceLoader= CreateNew_EVGResourceLoader();
  me.resourceLoader.value = rl;
  me.resourceLoader.has_value = true; /* detected as non-optional */
  var uf []string = make([]string, 0);
  me.usedFontFamilies = uf; 
  var fs []*EVGElement = make([]*EVGElement, 0);
  me.foundSections = fs; 
  var fp []*EVGElement = make([]*EVGElement, 0);
  me.foundPages = fp; 
  return me;
}
func (this *EVGHTMLRenderer) setPageSize (width float64, height float64) () {
  this.pageWidth = width; 
  this.pageHeight = height; 
  this.layout.value.(*EVGLayout).setPageSize(width, height);
}
func (this *EVGHTMLRenderer) setMeasurer (m IFACE_EVGTextMeasurer) () {
  this.measurer.value = m;
  this.measurer.has_value = true; /* detected as non-optional */
  this.layout.value.(*EVGLayout).setMeasurer(m);
}
func (this *EVGHTMLRenderer) setDebug (enabled bool) () {
  this.layout.value.(*EVGLayout).debug = enabled; 
  this.debug = enabled; 
  this.resourceLoader.value.(*EVGResourceLoader).debug = enabled; 
}
func (this *EVGHTMLRenderer) setFontBasePath (path string) () {
  this.fontBasePath = path; 
}
func (this *EVGHTMLRenderer) setImageBasePath (path string) () {
  this.imageBasePath = path; 
}
func (this *EVGHTMLRenderer) setTitle (t string) () {
  this.title = t; 
}
func (this *EVGHTMLRenderer) setBaseDir (dir string) () {
  this.baseDir = dir; 
  this.imageBasePath = dir; 
}
func (this *EVGHTMLRenderer) setEmbedAssets (embed bool) () {
  this.embedAssets = embed; 
}
func (this *EVGHTMLRenderer) resolveImagePath (src string) string {
  var imgSrc string= src;
  if  (int64(len([]rune(src)))) > int64(2) {
    var prefix string= string([]rune(src)[int64(0):int64(2)]);
    if  prefix == "./" {
      imgSrc = string([]rune(src)[int64(2):(int64(len([]rune(src))))]); 
    }
  }
  return imgSrc
}
func (this *EVGHTMLRenderer) render (root *EVGElement) string {
  this.elementCounter = int64(0); 
  var uf []string = make([]string, 0);
  this.usedFontFamilies = uf; 
  this.resourceLoader.value.(*EVGResourceLoader).setBasePath(this.baseDir);
  this.resourceLoader.value.(*EVGResourceLoader).loadResources(root);
  this.layout.value.(*EVGLayout).layout(root);
  this.collectFonts(root);
  var html string= "";
  html = html + "<!DOCTYPE html>\n"; 
  html = html + "<html>\n"; 
  html = html + "<head>\n"; 
  html = html + "  <meta charset=\"UTF-8\">\n"; 
  html = html + "  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n"; 
  html = ((html + "  <title>") + this.title) + "</title>\n"; 
  html = html + this.generateStyleBlock(); 
  html = html + "</head>\n"; 
  html = html + "<body>\n"; 
  html = html + "  <div class=\"evg-page-container\">\n"; 
  html = html + this.renderElement(root, int64(2)); 
  html = html + "  </div>\n"; 
  html = html + "</body>\n"; 
  html = html + "</html>\n"; 
  return html
}
func (this *EVGHTMLRenderer) renderPage (root *EVGElement, pageNum int64) string {
  this.elementCounter = int64(0); 
  this.resourceLoader.value.(*EVGResourceLoader).setBasePath(this.baseDir);
  this.resourceLoader.value.(*EVGResourceLoader).loadResources(root);
  this.layout.value.(*EVGLayout).layout(root);
  var html string= "";
  html = html + this.renderElementForPage(root, pageNum, int64(1)); 
  return html
}
func (this *EVGHTMLRenderer) generateStyleBlock () string {
  var css string= "  <style>\n";
  css = css + "    * { margin: 0; padding: 0; box-sizing: border-box; }\n"; 
  css = css + "    body { \n"; 
  css = css + "      background: #b0b0b0; \n"; 
  css = css + "      padding: 40px; \n"; 
  css = css + "      min-height: 100vh;\n"; 
  css = css + "      display: flex;\n"; 
  css = css + "      justify-content: center;\n"; 
  css = css + "    }\n"; 
  var i int64= int64(0);
  for i < (int64(len(this.usedFontFamilies))) {
    var fontFamily string= this.usedFontFamilies[i];
    css = css + this.generateFontFace(fontFamily); 
    i = i + int64(1); 
  }
  css = css + "    .evg-page-container {\n"; 
  css = ((css + "      width: ") + (strconv.FormatInt((int64(this.pageWidth)), 10))) + "px;\n"; 
  css = ((css + "      height: ") + (strconv.FormatInt((int64(this.pageHeight)), 10))) + "px;\n"; 
  css = css + "      background: white;\n"; 
  css = css + "      box-shadow: 0 4px 20px rgba(0,0,0,0.3), 0 0 0 1px rgba(0,0,0,0.1);\n"; 
  css = css + "      position: relative;\n"; 
  css = css + "      overflow: hidden;\n"; 
  css = css + "      flex-shrink: 0;\n"; 
  css = css + "    }\n"; 
  css = css + "    .evg-page {\n"; 
  css = css + "      background: white;\n"; 
  css = css + "      box-shadow: 0 2px 10px rgba(0,0,0,0.2);\n"; 
  css = css + "      margin: 0 auto 20px auto;\n"; 
  css = css + "      position: relative;\n"; 
  css = css + "      overflow: hidden;\n"; 
  css = css + "    }\n"; 
  css = css + "    .evg-view { position: relative; }\n"; 
  css = css + "    .evg-label { display: block; }\n"; 
  css = css + "    .evg-image { display: block; }\n"; 
  css = css + "  </style>\n"; 
  return css
}
func (this *EVGHTMLRenderer) generateFontFace (fontFamily string) string {
  var fileName string= this.fontFamilyToFileName(fontFamily);
  var fontPath string= this.fontBasePath;
  var css string= "";
  css = css + "    @font-face {\n"; 
  css = ((css + "      font-family: '") + fontFamily) + "';\n"; 
  var canEmbed bool= false;
  if  this.embedAssets {
    if  (int64(strings.Index(fileName, "/"))) >= int64(0) {
      canEmbed = true; 
    }
  }
  if  canEmbed {
    var resolvedPath string= this.resolveImagePath(fileName);
    var buf []byte= func() []byte { d, _ := os.ReadFile(filepath.Join(fontPath, resolvedPath)); return d }();
    var __len int64= int64(len(buf));
    if  __len > int64(0) {
      var base64 string= base64.StdEncoding.EncodeToString(buf);
      css = ((css + "      src: url('data:font/ttf;base64,") + base64) + "');\n"; 
    } else {
      css = (((css + "      src: url('") + fontPath) + fileName) + "');\n"; 
    }
  } else {
    css = (((css + "      src: url('") + fontPath) + fileName) + "');\n"; 
  }
  css = css + "    }\n"; 
  return css
}
func (this *EVGHTMLRenderer) fontFamilyToFileName (fontFamily string) string {
  if  fontFamily == "Noto Sans" {
    return "Noto_Sans/NotoSans-Regular.ttf"
  }
  if  fontFamily == "Noto Sans Bold" {
    return "Noto_Sans/NotoSans-Bold.ttf"
  }
  if  fontFamily == "Helvetica" {
    return "Helvetica/Helvetica.ttf"
  }
  if  fontFamily == "Amatic SC" {
    return "Amatic_SC/AmaticSC-Regular.ttf"
  }
  if  fontFamily == "Amatic SC Bold" {
    return "Amatic_SC/AmaticSC-Bold.ttf"
  }
  if  fontFamily == "Gloria Hallelujah" {
    return "Gloria_Hallelujah/GloriaHallelujah.ttf"
  }
  if  fontFamily == "Josefin Slab" {
    return "Josefin_Slab/JosefinSlab-Regular.ttf"
  }
  if  fontFamily == "Josefin Slab Bold" {
    return "Josefin_Slab/JosefinSlab-Bold.ttf"
  }
  if  fontFamily == "Katibeh" {
    return "Katibeh/Katibeh-Regular.ttf"
  }
  if  fontFamily == "Alike Angular" {
    return "Alike_Angular/AlikeAngular-Regular.ttf"
  }
  var result string= "";
  var i int64= int64(0);
  for i < (int64(len([]rune(fontFamily)))) {
    var ch string= string([]rune(fontFamily)[i:(i + int64(1))]);
    if  ch != " " {
      result = result + ch; 
    }
    i = i + int64(1); 
  }
  return result + ".ttf"
}
func (this *EVGHTMLRenderer) renderElement (el *EVGElement, depth int64) string {
  return this.renderElementWithParent(el, depth, 0.0, 0.0)
}
func (this *EVGHTMLRenderer) renderElementWithParent (el *EVGElement, depth int64, parentX float64, parentY float64) string {
  this.elementCounter = this.elementCounter + int64(1); 
  var elementId string= "evg-" + (strconv.FormatInt(this.elementCounter, 10));
  if  (el.tagName == "Print") || (el.tagName == "print") {
    return this.renderPrint(el, depth)
  }
  if  (el.tagName == "Section") || (el.tagName == "section") {
    return this.renderSection(el, depth)
  }
  if  (el.tagName == "Page") || (el.tagName == "page") {
    return this.renderPage_Element(el, depth)
  }
  if  ((el.tagName == "View") || (el.tagName == "div")) || (el.tagName == "layer") {
    return this.renderViewWithParent(el, elementId, depth, parentX, parentY)
  }
  if  ((el.tagName == "Label") || (el.tagName == "span")) || (el.tagName == "text") {
    return this.renderLabelWithParent(el, elementId, depth, parentX, parentY)
  }
  if  ((el.tagName == "Image") || (el.tagName == "img")) || (el.tagName == "image") {
    return this.renderImageWithParent(el, elementId, depth, parentX, parentY)
  }
  if  (el.tagName == "Path") || (el.tagName == "path") {
    return this.renderPathWithParent(el, elementId, depth, parentX, parentY)
  }
  if  (el.tagName == "Rect") || (el.tagName == "rect") {
    return this.renderViewWithParent(el, elementId, depth, parentX, parentY)
  }
  return this.renderViewWithParent(el, elementId, depth, parentX, parentY)
}
func (this *EVGHTMLRenderer) renderElementForPage (el *EVGElement, pageNum int64, depth int64) string {
  if  el.calculatedPage != pageNum {
    var childHtml string= "";
    var i int64= int64(0);
    for i < (int64(len(el.children))) {
      var child *EVGElement= el.children[i];
      childHtml = childHtml + this.renderElementForPage(child, pageNum, depth); 
      i = i + int64(1); 
    }
    return childHtml
  }
  return this.renderElement(el, depth)
}
func (this *EVGHTMLRenderer) renderPrint (el *EVGElement, depth int64) string {
  if  el.pageWidth > 0.0 {
    this.pageWidth = el.pageWidth; 
  }
  if  el.pageHeight > 0.0 {
    this.pageHeight = el.pageHeight; 
  }
  var html string= "";
  html = (html + this.indent(depth)) + "<div class=\"evg-document\">\n"; 
  var i int64= int64(0);
  for i < (int64(len(el.children))) {
    var child *EVGElement= el.children[i];
    html = html + this.renderElement(child, (depth + int64(1))); 
    i = i + int64(1); 
  }
  html = (html + this.indent(depth)) + "</div>\n"; 
  return html
}
func (this *EVGHTMLRenderer) renderSection (el *EVGElement, depth int64) string {
  var html string= "";
  html = (html + this.indent(depth)) + "<div class=\"evg-section\">\n"; 
  var i int64= int64(0);
  for i < (int64(len(el.children))) {
    var child *EVGElement= el.children[i];
    html = html + this.renderElement(child, (depth + int64(1))); 
    i = i + int64(1); 
  }
  html = (html + this.indent(depth)) + "</div>\n"; 
  return html
}
func (this *EVGHTMLRenderer) renderPage_Element (el *EVGElement, depth int64) string {
  var w float64= el.calculatedWidth;
  var h float64= el.calculatedHeight;
  if  w <= 0.0 {
    w = this.pageWidth; 
  }
  if  h <= 0.0 {
    h = this.pageHeight; 
  }
  var html string= "";
  html = (html + this.indent(depth)) + "<div class=\"evg-page\" style=\""; 
  html = ((html + "width: ") + this.formatPx(w)) + "; "; 
  html = ((html + "height: ") + this.formatPx(h)) + "; "; 
  var pt float64= this.getResolvedPadding(el, "top");
  var pr float64= this.getResolvedPadding(el, "right");
  var pb float64= this.getResolvedPadding(el, "bottom");
  var pl float64= this.getResolvedPadding(el, "left");
  if  (((pt > 0.0) || (pr > 0.0)) || (pb > 0.0)) || (pl > 0.0) {
    html = ((((((((html + "padding: ") + this.formatPx(pt)) + " ") + this.formatPx(pr)) + " ") + this.formatPx(pb)) + " ") + this.formatPx(pl)) + "; "; 
  }
  html = html + "\">\n"; 
  var i int64= int64(0);
  for i < (int64(len(el.children))) {
    var child *EVGElement= el.children[i];
    html = html + this.renderElementWithParent(child, (depth + int64(1)), el.calculatedX, el.calculatedY); 
    i = i + int64(1); 
  }
  html = (html + this.indent(depth)) + "</div>\n"; 
  return html
}
func (this *EVGHTMLRenderer) renderView (el *EVGElement, elementId string, depth int64) string {
  return this.renderViewWithParent(el, elementId, depth, 0.0, 0.0)
}
func (this *EVGHTMLRenderer) renderViewWithParent (el *EVGElement, elementId string, depth int64, parentX float64, parentY float64) string {
  var html string= "";
  html = (html + this.indent(depth)) + "<div"; 
  if  (int64(len([]rune(el.id)))) > int64(0) {
    html = ((html + " id=\"") + el.id) + "\""; 
  }
  if  el.tagName == "layer" {
    html = html + " class=\"evg-layer\""; 
  } else {
    html = html + " class=\"evg-view\""; 
  }
  var relX float64= el.calculatedX - parentX;
  var relY float64= el.calculatedY - parentY;
  html = html + " style=\""; 
  html = html + this.generateViewStylesRelative(el, relX, relY); 
  html = html + "\""; 
  html = html + ">\n"; 
  var i int64= int64(0);
  for i < (int64(len(el.children))) {
    var child *EVGElement= el.children[i];
    html = html + this.renderElementWithParent(child, (depth + int64(1)), el.calculatedX, el.calculatedY); 
    i = i + int64(1); 
  }
  html = (html + this.indent(depth)) + "</div>\n"; 
  return html
}
func (this *EVGHTMLRenderer) generateViewStylesRelative (el *EVGElement, relX float64, relY float64) string {
  var css string= "";
  if  el.tagName == "layer" {
    css = css + "position: absolute; "; 
    css = css + "inset: 0; "; 
    css = css + "pointer-events: none; "; 
  } else {
    css = css + "position: absolute; "; 
    css = ((css + "left: ") + this.formatPx(relX)) + "; "; 
    css = ((css + "top: ") + this.formatPx(relY)) + "; "; 
    if  el.calculatedWidth > 0.0 {
      css = ((css + "width: ") + this.formatPx(el.calculatedWidth)) + "; "; 
    }
    if  el.calculatedHeight > 0.0 {
      css = ((css + "height: ") + this.formatPx(el.calculatedHeight)) + "; "; 
    }
  }
  if  el.display == "flex" {
    css = css + "display: flex; "; 
    css = ((css + "flex-direction: ") + el.flexDirection) + "; "; 
    if  (int64(len([]rune(el.justifyContent)))) > int64(0) {
      css = ((css + "justify-content: ") + el.justifyContent) + "; "; 
    }
    if  (int64(len([]rune(el.alignItems)))) > int64(0) {
      css = ((css + "align-items: ") + el.alignItems) + "; "; 
    }
    if  el.gap.value.(*EVGUnit).isSet {
      css = ((css + "gap: ") + this.formatPx(el.gap.value.(*EVGUnit).pixels)) + "; "; 
    }
  }
  if  (int64(len([]rune(el.backgroundGradient)))) > int64(0) {
    css = ((css + "background: ") + el.backgroundGradient) + "; "; 
  } else {
    if  el.backgroundColor.value.(*EVGColor).isSet {
      css = ((css + "background-color: ") + el.backgroundColor.value.(*EVGColor).toCSSString()) + "; "; 
    }
  }
  var bw float64= 0.0;
  if  el.box.value.(*EVGBox).borderWidth.value.(*EVGUnit).isSet {
    bw = el.box.value.(*EVGBox).borderWidth.value.(*EVGUnit).pixels; 
  }
  if  bw > 0.0 {
    css = ((css + "border-width: ") + this.formatPx(bw)) + "; "; 
    css = css + "border-style: solid; "; 
    if  el.box.value.(*EVGBox).borderColor.value.(*EVGColor).isSet {
      css = ((css + "border-color: ") + el.box.value.(*EVGBox).borderColor.value.(*EVGColor).toCSSString()) + "; "; 
    }
  }
  if  el.box.value.(*EVGBox).borderRadius.value.(*EVGUnit).isSet {
    css = ((css + "border-radius: ") + this.formatPx(el.box.value.(*EVGBox).borderRadius.value.(*EVGUnit).pixels)) + "; "; 
  }
  var pt float64= this.getResolvedPadding(el, "top");
  var pr float64= this.getResolvedPadding(el, "right");
  var pb float64= this.getResolvedPadding(el, "bottom");
  var pl float64= this.getResolvedPadding(el, "left");
  if  (((pt > 0.0) || (pr > 0.0)) || (pb > 0.0)) || (pl > 0.0) {
    css = ((((((((css + "padding: ") + this.formatPx(pt)) + " ") + this.formatPx(pr)) + " ") + this.formatPx(pb)) + " ") + this.formatPx(pl)) + "; "; 
  }
  var mt float64= this.getResolvedMargin(el, "top");
  var mr float64= this.getResolvedMargin(el, "right");
  var mb float64= this.getResolvedMargin(el, "bottom");
  var ml float64= this.getResolvedMargin(el, "left");
  if  (((mt > 0.0) || (mr > 0.0)) || (mb > 0.0)) || (ml > 0.0) {
    css = ((((((((css + "margin: ") + this.formatPx(mt)) + " ") + this.formatPx(mr)) + " ") + this.formatPx(mb)) + " ") + this.formatPx(ml)) + "; "; 
  }
  if  el.overflow == "hidden" {
    css = css + "overflow: hidden; "; 
  }
  if  el.opacity < 1.0 {
    css = ((css + "opacity: ") + (strconv.FormatFloat(el.opacity,'f', 6, 64))) + "; "; 
  }
  css = css + this.generateBoxShadow(el); 
  return css
}
func (this *EVGHTMLRenderer) generateBoxShadow (el *EVGElement) string {
  if  el.shadowRadius.value.(*EVGUnit).isSet == false {
    if  el.shadowColor.value.(*EVGColor).isSet == false {
      return ""
    }
  }
  var css string= "";
  var offsetX float64= 0.0;
  var offsetY float64= 0.0;
  if  el.shadowOffsetX.value.(*EVGUnit).isSet {
    offsetX = el.shadowOffsetX.value.(*EVGUnit).pixels; 
  }
  if  el.shadowOffsetY.value.(*EVGUnit).isSet {
    offsetY = el.shadowOffsetY.value.(*EVGUnit).pixels; 
  }
  var blur float64= 0.0;
  if  el.shadowRadius.value.(*EVGUnit).isSet {
    blur = el.shadowRadius.value.(*EVGUnit).pixels; 
  }
  var shadowColorStr string= "rgba(0, 0, 0, 0.5)";
  if  el.shadowColor.value.(*EVGColor).isSet {
    shadowColorStr = el.shadowColor.value.(*EVGColor).toCSSString(); 
  }
  css = ((((((((css + "box-shadow: ") + this.formatPx(offsetX)) + " ") + this.formatPx(offsetY)) + " ") + this.formatPx(blur)) + " ") + shadowColorStr) + "; "; 
  return css
}
func (this *EVGHTMLRenderer) renderLabel (el *EVGElement, elementId string, depth int64) string {
  return this.renderLabelWithParent(el, elementId, depth, 0.0, 0.0)
}
func (this *EVGHTMLRenderer) renderLabelWithParent (el *EVGElement, elementId string, depth int64, parentX float64, parentY float64) string {
  var html string= "";
  html = (html + this.indent(depth)) + "<span"; 
  if  (int64(len([]rune(el.id)))) > int64(0) {
    html = ((html + " id=\"") + el.id) + "\""; 
  }
  html = html + " class=\"evg-label\""; 
  var relX float64= el.calculatedX - parentX;
  var relY float64= el.calculatedY - parentY;
  html = html + " style=\""; 
  html = html + this.generateLabelStylesRelative(el, relX, relY); 
  html = html + "\""; 
  html = html + ">"; 
  html = html + this.escapeHtml(el.textContent); 
  var i int64= int64(0);
  for i < (int64(len(el.children))) {
    var child *EVGElement= el.children[i];
    html = html + this.renderElementWithParent(child, (depth + int64(1)), el.calculatedX, el.calculatedY); 
    i = i + int64(1); 
  }
  html = html + "</span>\n"; 
  return html
}
func (this *EVGHTMLRenderer) generateLabelStylesRelative (el *EVGElement, relX float64, relY float64) string {
  var css string= "";
  css = css + "position: absolute; "; 
  css = ((css + "left: ") + this.formatPx(relX)) + "; "; 
  css = ((css + "top: ") + this.formatPx(relY)) + "; "; 
  if  (int64(len([]rune(el.fontFamily)))) > int64(0) {
    css = ((css + "font-family: '") + el.fontFamily) + "', sans-serif; "; 
  }
  if  el.fontSize.value.(*EVGUnit).isSet {
    css = ((css + "font-size: ") + this.formatPx(el.fontSize.value.(*EVGUnit).pixels)) + "; "; 
  }
  if  (int64(len([]rune(el.fontWeight)))) > int64(0) {
    css = ((css + "font-weight: ") + el.fontWeight) + "; "; 
  }
  if  el.color.value.(*EVGColor).isSet {
    css = ((css + "color: ") + el.color.value.(*EVGColor).toCSSString()) + "; "; 
  }
  if  (int64(len([]rune(el.textAlign)))) > int64(0) {
    css = ((css + "text-align: ") + el.textAlign) + "; "; 
  }
  if  el.lineHeight > 0.0 {
    css = ((css + "line-height: ") + (strconv.FormatFloat(el.lineHeight,'f', 6, 64))) + "; "; 
  }
  if  el.calculatedWidth > 0.0 {
    css = ((css + "width: ") + this.formatPx(el.calculatedWidth)) + "; "; 
  }
  css = css + this.generateTextShadow(el); 
  return css
}
func (this *EVGHTMLRenderer) generateTextShadow (el *EVGElement) string {
  if  el.shadowRadius.value.(*EVGUnit).isSet == false {
    if  el.shadowColor.value.(*EVGColor).isSet == false {
      return ""
    }
  }
  var css string= "";
  var offsetX float64= 0.0;
  var offsetY float64= 0.0;
  if  el.shadowOffsetX.value.(*EVGUnit).isSet {
    offsetX = el.shadowOffsetX.value.(*EVGUnit).pixels; 
  }
  if  el.shadowOffsetY.value.(*EVGUnit).isSet {
    offsetY = el.shadowOffsetY.value.(*EVGUnit).pixels; 
  }
  var blur float64= 0.0;
  if  el.shadowRadius.value.(*EVGUnit).isSet {
    blur = el.shadowRadius.value.(*EVGUnit).pixels; 
  }
  var shadowColorStr string= "rgba(0, 0, 0, 0.5)";
  if  el.shadowColor.value.(*EVGColor).isSet {
    shadowColorStr = el.shadowColor.value.(*EVGColor).toCSSString(); 
  }
  css = ((((((((css + "text-shadow: ") + this.formatPx(offsetX)) + " ") + this.formatPx(offsetY)) + " ") + this.formatPx(blur)) + " ") + shadowColorStr) + "; "; 
  return css
}
func (this *EVGHTMLRenderer) renderImage (el *EVGElement, elementId string, depth int64) string {
  return this.renderImageWithParent(el, elementId, depth, 0.0, 0.0)
}
func (this *EVGHTMLRenderer) renderImageWithParent (el *EVGElement, elementId string, depth int64, parentX float64, parentY float64) string {
  var html string= "";
  var relX float64= el.calculatedX - parentX;
  var relY float64= el.calculatedY - parentY;
  if  el.imageViewBoxSet {
    return this.renderImageWithViewBox(el, elementId, depth, relX, relY)
  }
  var containerW float64= el.calculatedWidth;
  var containerH float64= el.calculatedHeight;
  var parentAvailableH float64= el.parent.value.(*EVGElement).calculatedHeight;
  if  el.parent.value.(*EVGElement).box.value.(*EVGBox).paddingTopPx > 0.0 {
    parentAvailableH = (parentAvailableH - el.parent.value.(*EVGElement).box.value.(*EVGBox).paddingTopPx) - el.parent.value.(*EVGElement).box.value.(*EVGBox).paddingBottomPx; 
  }
  if  (((containerH <= 0.0) && (containerW > 0.0)) && (el.sourceWidth > 0.0)) && (el.sourceHeight > 0.0) {
    var imageAspect float64= el.sourceWidth / el.sourceHeight;
    containerH = containerW / imageAspect; 
    if  this.debug {
      fmt.Println( "Image: calculated containerH from aspect ratio: " + (strconv.FormatFloat(containerH,'f', 6, 64)) )
    }
  }
  if  (parentAvailableH > 0.0) && (containerH > parentAvailableH) {
    if  this.debug {
      fmt.Println( (("Image: clipping containerH from " + (strconv.FormatFloat(containerH,'f', 6, 64))) + " to parent height ") + (strconv.FormatFloat(parentAvailableH,'f', 6, 64)) )
    }
    containerH = parentAvailableH; 
  }
  html = (html + this.indent(depth)) + "<div"; 
  if  (int64(len([]rune(el.id)))) > int64(0) {
    html = ((html + " id=\"") + el.id) + "\""; 
  }
  html = html + " class=\"evg-image-container\" style=\""; 
  html = html + "position: absolute; "; 
  html = ((html + "left: ") + this.formatPx(relX)) + "; "; 
  html = ((html + "top: ") + this.formatPx(relY)) + "; "; 
  if  containerW > 0.0 {
    html = ((html + "width: ") + this.formatPx(containerW)) + "; "; 
  }
  if  containerH > 0.0 {
    html = ((html + "height: ") + this.formatPx(containerH)) + "; "; 
  }
  html = html + "overflow: hidden; "; 
  if  el.box.value.(*EVGBox).borderRadius.value.(*EVGUnit).isSet {
    html = ((html + "border-radius: ") + this.formatPx(el.box.value.(*EVGBox).borderRadius.value.(*EVGUnit).pixels)) + "; "; 
  }
  html = html + "\">\n"; 
  var imgW float64= el.sourceWidth;
  var imgH float64= el.sourceHeight;
  if  imgW <= 0.0 {
    imgW = containerW; 
  }
  if  imgH <= 0.0 {
    imgH = containerH; 
  }
  var containerRatio float64= 1.0;
  var imageRatio float64= 1.0;
  if  containerH > 0.0 {
    containerRatio = containerW / containerH; 
  }
  if  imgH > 0.0 {
    imageRatio = imgW / imgH; 
  }
  var scaledW float64= containerW;
  var scaledH float64= containerH;
  var offsetX float64= 0.0;
  var offsetY float64= 0.0;
  var fitMode string= el.objectFit;
  if  (int64(len([]rune(fitMode)))) == int64(0) {
    fitMode = "cover"; 
  }
  if  fitMode == "cover" {
    if  imageRatio > containerRatio {
      scaledH = containerH; 
      scaledW = containerH * imageRatio; 
      offsetX = (containerW - scaledW) / 2.0; 
      offsetY = 0.0; 
    } else {
      scaledW = containerW; 
      scaledH = containerW / imageRatio; 
      offsetX = 0.0; 
      offsetY = (containerH - scaledH) / 2.0; 
    }
  }
  if  fitMode == "contain" {
    if  imageRatio > containerRatio {
      scaledW = containerW; 
      scaledH = containerW / imageRatio; 
      offsetX = 0.0; 
      offsetY = (containerH - scaledH) / 2.0; 
    } else {
      scaledH = containerH; 
      scaledW = containerH * imageRatio; 
      offsetX = (containerW - scaledW) / 2.0; 
      offsetY = 0.0; 
    }
  }
  if  fitMode == "fill" {
    scaledW = containerW; 
    scaledH = containerH; 
    offsetX = 0.0; 
    offsetY = 0.0; 
  }
  html = (html + this.indent((depth + int64(1)))) + "<img"; 
  html = html + " class=\"evg-image\""; 
  var imgSrc string= el.src;
  if  (int64(len([]rune(imgSrc)))) > int64(0) {
    if  this.embedAssets {
      var dataUri string= this.getImageDataUri(imgSrc);
      if  (int64(len([]rune(dataUri)))) > int64(0) {
        html = ((html + " src=\"") + dataUri) + "\""; 
      } else {
        html = ((html + " src=\"") + this.transformImagePath(imgSrc)) + "\""; 
      }
    } else {
      html = ((html + " src=\"") + this.transformImagePath(imgSrc)) + "\""; 
    }
  }
  if  (int64(len([]rune(el.alt)))) > int64(0) {
    html = ((html + " alt=\"") + this.escapeHtml(el.alt)) + "\""; 
  } else {
    html = html + " alt=\"\""; 
  }
  html = html + " style=\""; 
  html = html + "position: absolute; "; 
  html = ((html + "left: ") + this.formatPx(offsetX)) + "; "; 
  html = ((html + "top: ") + this.formatPx(offsetY)) + "; "; 
  html = ((html + "width: ") + this.formatPx(scaledW)) + "; "; 
  html = ((html + "height: ") + this.formatPx(scaledH)) + "; "; 
  html = html + "display: block; "; 
  html = html + "\">\n"; 
  html = (html + this.indent(depth)) + "</div>\n"; 
  return html
}
func (this *EVGHTMLRenderer) renderImageWithViewBox (el *EVGElement, elementId string, depth int64, relX float64, relY float64) string {
  var html string= "";
  var scaleX float64= 1.0;
  var scaleY float64= 1.0;
  if  el.imageViewBoxW > 0.0 {
    scaleX = 1.0 / el.imageViewBoxW; 
  }
  if  el.imageViewBoxH > 0.0 {
    scaleY = 1.0 / el.imageViewBoxH; 
  }
  var scale float64= scaleX;
  if  scaleY > scaleX {
    scale = scaleY; 
  }
  var offsetXPercent float64= (el.imageViewBoxX * scale) * 100.0;
  var offsetYPercent float64= (el.imageViewBoxY * scale) * 100.0;
  html = (html + this.indent(depth)) + "<div class=\"evg-image-crop\" style=\""; 
  html = html + "position: absolute; "; 
  html = ((html + "left: ") + this.formatPx(relX)) + "; "; 
  html = ((html + "top: ") + this.formatPx(relY)) + "; "; 
  if  el.calculatedWidth > 0.0 {
    html = ((html + "width: ") + this.formatPx(el.calculatedWidth)) + "; "; 
  }
  if  el.calculatedHeight > 0.0 {
    html = ((html + "height: ") + this.formatPx(el.calculatedHeight)) + "; "; 
  }
  html = html + "overflow: hidden; "; 
  if  el.box.value.(*EVGBox).borderRadius.value.(*EVGUnit).isSet {
    html = ((html + "border-radius: ") + this.formatPx(el.box.value.(*EVGBox).borderRadius.value.(*EVGUnit).pixels)) + "; "; 
  }
  html = html + "\">\n"; 
  html = (html + this.indent((depth + int64(1)))) + "<img"; 
  html = html + " class=\"evg-image\""; 
  var imgSrc string= el.src;
  if  (int64(len([]rune(imgSrc)))) > int64(0) {
    if  this.embedAssets {
      var dataUri string= this.getImageDataUri(imgSrc);
      if  (int64(len([]rune(dataUri)))) > int64(0) {
        html = ((html + " src=\"") + dataUri) + "\""; 
      } else {
        html = ((html + " src=\"") + this.transformImagePath(imgSrc)) + "\""; 
      }
    } else {
      html = ((html + " src=\"") + this.transformImagePath(imgSrc)) + "\""; 
    }
  }
  html = html + " alt=\"\""; 
  html = html + " style=\""; 
  html = html + "position: absolute; "; 
  html = ((html + "width: ") + (strconv.FormatFloat((scale * 100.0),'f', 6, 64))) + "%; "; 
  html = ((html + "height: ") + (strconv.FormatFloat((scale * 100.0),'f', 6, 64))) + "%; "; 
  html = ((html + "left: -") + (strconv.FormatFloat(offsetXPercent,'f', 6, 64))) + "%; "; 
  html = ((html + "top: -") + (strconv.FormatFloat(offsetYPercent,'f', 6, 64))) + "%; "; 
  html = html + "object-fit: cover; "; 
  html = html + "\">\n"; 
  html = (html + this.indent(depth)) + "</div>\n"; 
  return html
}
func (this *EVGHTMLRenderer) generateImageStylesRelative (el *EVGElement, relX float64, relY float64) string {
  var css string= "";
  css = css + "position: absolute; "; 
  css = ((css + "left: ") + this.formatPx(relX)) + "; "; 
  css = ((css + "top: ") + this.formatPx(relY)) + "; "; 
  if  el.calculatedWidth > 0.0 {
    css = ((css + "width: ") + this.formatPx(el.calculatedWidth)) + "; "; 
  }
  if  el.calculatedHeight > 0.0 {
    css = ((css + "height: ") + this.formatPx(el.calculatedHeight)) + "; "; 
  }
  if  (int64(len([]rune(el.objectFit)))) > int64(0) {
    css = ((css + "object-fit: ") + el.objectFit) + "; "; 
  } else {
    css = css + "object-fit: cover; "; 
  }
  if  el.imageViewBoxSet {
    var posX float64= el.imageViewBoxX * 100.0;
    var posY float64= el.imageViewBoxY * 100.0;
    css = ((((css + "object-position: ") + (strconv.FormatFloat(posX,'f', 6, 64))) + "% ") + (strconv.FormatFloat(posY,'f', 6, 64))) + "%; "; 
  }
  if  el.box.value.(*EVGBox).borderRadius.value.(*EVGUnit).isSet {
    css = ((css + "border-radius: ") + this.formatPx(el.box.value.(*EVGBox).borderRadius.value.(*EVGUnit).pixels)) + "; "; 
  }
  return css
}
func (this *EVGHTMLRenderer) renderPath (el *EVGElement, elementId string, depth int64) string {
  return this.renderPathWithParent(el, elementId, depth, 0.0, 0.0)
}
func (this *EVGHTMLRenderer) renderPathWithParent (el *EVGElement, elementId string, depth int64, parentX float64, parentY float64) string {
  var html string= "";
  var w float64= el.calculatedWidth;
  var h float64= el.calculatedHeight;
  if  w <= 0.0 {
    w = 24.0; 
  }
  if  h <= 0.0 {
    h = 24.0; 
  }
  var relX float64= el.calculatedX - parentX;
  var relY float64= el.calculatedY - parentY;
  html = (html + this.indent(depth)) + "<svg"; 
  if  (int64(len([]rune(el.id)))) > int64(0) {
    html = ((html + " id=\"") + el.id) + "\""; 
  }
  html = html + " class=\"evg-path\""; 
  html = ((html + " width=\"") + (strconv.FormatFloat(w,'f', 6, 64))) + "\""; 
  html = ((html + " height=\"") + (strconv.FormatFloat(h,'f', 6, 64))) + "\""; 
  if  (int64(len([]rune(el.viewBox)))) > int64(0) {
    html = ((html + " viewBox=\"") + el.viewBox) + "\""; 
  }
  html = html + " style=\""; 
  html = html + "position: absolute; "; 
  html = ((html + "left: ") + this.formatPx(relX)) + "; "; 
  html = ((html + "top: ") + this.formatPx(relY)) + "; "; 
  html = html + "\""; 
  html = html + ">\n"; 
  html = (((html + this.indent((depth + int64(1)))) + "<path d=\"") + el.svgPath) + "\""; 
  if  el.fillColor.value.(*EVGColor).isSet {
    html = ((html + " fill=\"") + el.fillColor.value.(*EVGColor).toCSSString()) + "\""; 
  } else {
    if  el.backgroundColor.value.(*EVGColor).isSet {
      html = ((html + " fill=\"") + el.backgroundColor.value.(*EVGColor).toCSSString()) + "\""; 
    } else {
      html = html + " fill=\"currentColor\""; 
    }
  }
  if  el.strokeColor.value.(*EVGColor).isSet {
    html = ((html + " stroke=\"") + el.strokeColor.value.(*EVGColor).toCSSString()) + "\""; 
    if  el.strokeWidth > 0.0 {
      html = ((html + " stroke-width=\"") + (strconv.FormatFloat(el.strokeWidth,'f', 6, 64))) + "\""; 
    }
  }
  html = html + "/>\n"; 
  html = (html + this.indent(depth)) + "</svg>\n"; 
  return html
}
func (this *EVGHTMLRenderer) renderRect (el *EVGElement, elementId string, depth int64) string {
  return this.renderView(el, elementId, depth)
}
func (this *EVGHTMLRenderer) indent (depth int64) string {
  if  this.prettyPrint == false {
    return ""
  }
  var result string= "";
  var i int64= int64(0);
  for i < depth {
    result = result + this.indentString; 
    i = i + int64(1); 
  }
  return result
}
func (this *EVGHTMLRenderer) formatPx (value float64) string {
  var intVal int64= int64(value);
  var diff float64= value - (float64( intVal ));
  if  (diff < 0.01) && (diff > -0.01) {
    return (strconv.FormatInt(intVal, 10)) + "px"
  }
  return (strconv.FormatFloat(value,'f', 6, 64)) + "px"
}
func (this *EVGHTMLRenderer) escapeHtml (text string) string {
  var result string= "";
  var i int64= int64(0);
  for i < (int64(len([]rune(text)))) {
    var ch string= string([]rune(text)[i:(i + int64(1))]);
    if  ch == "<" {
      result = result + "&lt;"; 
    } else {
      if  ch == ">" {
        result = result + "&gt;"; 
      } else {
        if  ch == "&" {
          result = result + "&amp;"; 
        } else {
          if  ch == "\"" {
            result = result + "&quot;"; 
          } else {
            result = result + ch; 
          }
        }
      }
    }
    i = i + int64(1); 
  }
  return result
}
func (this *EVGHTMLRenderer) getMimeType (filename string) string {
  var lower string= strings.ToLower(filename);
  if  (int64(strings.Index(lower, ".jpg"))) >= int64(0) {
    return "image/jpeg"
  }
  if  (int64(strings.Index(lower, ".jpeg"))) >= int64(0) {
    return "image/jpeg"
  }
  return ""
}
func (this *EVGHTMLRenderer) getImageDataUri (imagePath string) string {
  var mimeType string= this.getMimeType(imagePath);
  if  (int64(len([]rune(mimeType)))) == int64(0) {
    return ""
  }
  var basePath string= this.baseDir;
  var resolvedPath string= this.resolveImagePath(imagePath);
  var buf []byte= func() []byte { d, _ := os.ReadFile(filepath.Join(basePath, resolvedPath)); return d }();
  var __len int64= int64(len(buf));
  if  __len == int64(0) {
    return ""
  }
  var base64 string= base64.StdEncoding.EncodeToString(buf);
  return (("data:" + mimeType) + ";base64,") + base64
}
func (this *EVGHTMLRenderer) getResolvedPadding (el *EVGElement, side string) float64 {
  if  side == "top" {
    if  el.box.value.(*EVGBox).paddingTop.value.(*EVGUnit).isSet {
      return el.box.value.(*EVGBox).paddingTop.value.(*EVGUnit).pixels
    }
  }
  if  side == "right" {
    if  el.box.value.(*EVGBox).paddingRight.value.(*EVGUnit).isSet {
      return el.box.value.(*EVGBox).paddingRight.value.(*EVGUnit).pixels
    }
  }
  if  side == "bottom" {
    if  el.box.value.(*EVGBox).paddingBottom.value.(*EVGUnit).isSet {
      return el.box.value.(*EVGBox).paddingBottom.value.(*EVGUnit).pixels
    }
  }
  if  side == "left" {
    if  el.box.value.(*EVGBox).paddingLeft.value.(*EVGUnit).isSet {
      return el.box.value.(*EVGBox).paddingLeft.value.(*EVGUnit).pixels
    }
  }
  return 0.0
}
func (this *EVGHTMLRenderer) getResolvedMargin (el *EVGElement, side string) float64 {
  if  side == "top" {
    if  el.box.value.(*EVGBox).marginTop.value.(*EVGUnit).isSet {
      return el.box.value.(*EVGBox).marginTop.value.(*EVGUnit).pixels
    }
  }
  if  side == "right" {
    if  el.box.value.(*EVGBox).marginRight.value.(*EVGUnit).isSet {
      return el.box.value.(*EVGBox).marginRight.value.(*EVGUnit).pixels
    }
  }
  if  side == "bottom" {
    if  el.box.value.(*EVGBox).marginBottom.value.(*EVGUnit).isSet {
      return el.box.value.(*EVGBox).marginBottom.value.(*EVGUnit).pixels
    }
  }
  if  side == "left" {
    if  el.box.value.(*EVGBox).marginLeft.value.(*EVGUnit).isSet {
      return el.box.value.(*EVGBox).marginLeft.value.(*EVGUnit).pixels
    }
  }
  return 0.0
}
func (this *EVGHTMLRenderer) findPageElementsRecursive (el *EVGElement) () {
  if  (el.tagName == "page") || (el.tagName == "Page") {
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
func (this *EVGHTMLRenderer) findSectionElementsRecursive (el *EVGElement) () {
  var i int64= int64(0);
  var childCount int64= el.getChildCount();
  for i < childCount {
    var child *EVGElement= el.getChild(i);
    if  (child.tagName == "section") || (child.tagName == "Section") {
      this.foundSections = append(this.foundSections,child); 
    }
    i = i + int64(1); 
  }
}
func (this *EVGHTMLRenderer) getSectionPageWidth (section *EVGElement) float64 {
  if  section.width.value.(*EVGUnit).isSet {
    return section.width.value.(*EVGUnit).pixels
  }
  return this.pageWidth
}
func (this *EVGHTMLRenderer) getSectionPageHeight (section *EVGElement) float64 {
  if  section.height.value.(*EVGUnit).isSet {
    return section.height.value.(*EVGUnit).pixels
  }
  return this.pageHeight
}
func (this *EVGHTMLRenderer) getSectionMargin (section *EVGElement) float64 {
  var m *GoNullable = new(GoNullable); 
  m.value = section.box.value.(*EVGBox).marginTop.value;
  m.has_value = section.box.value.(*EVGBox).marginTop.has_value;
  if  m.value.(*EVGUnit).isSet {
    return m.value.(*EVGUnit).pixels
  }
  return 0.0
}
func (this *EVGHTMLRenderer) renderContent (root *EVGElement) string {
  this.elementCounter = int64(0); 
  var uf []string = make([]string, 0);
  this.usedFontFamilies = uf; 
  this.resourceLoader.value.(*EVGResourceLoader).setBasePath(this.baseDir);
  this.resourceLoader.value.(*EVGResourceLoader).loadResources(root);
  var isMultiPage bool= false;
  if  (((root.tagName == "Print") || (root.tagName == "print")) || (root.tagName == "Section")) || (root.tagName == "section") {
    isMultiPage = true; 
  }
  if  isMultiPage {
    var emptyArr []*EVGElement = make([]*EVGElement, 0);
    this.foundSections = emptyArr; 
    this.findSectionElementsRecursive(root);
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
        var contentWidth float64= sectionWidth - (sectionMargin * 2.0);
        var contentHeight float64= sectionHeight - (sectionMargin * 2.0);
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
        pi = pi + int64(1); 
      }
      si = si + int64(1); 
    }
    if  (int64(len(this.foundSections))) == int64(0) {
      this.layout.value.(*EVGLayout).layout(root);
    }
  } else {
    this.layout.value.(*EVGLayout).layout(root);
  }
  this.collectFonts(root);
  var result string= "";
  if  isMultiPage {
    result = this.renderElement(root, int64(0)); 
  } else {
    result = "<div class=\"evg-page-container\">\n"; 
    result = result + this.renderElement(root, int64(1)); 
    result = result + "</div>\n"; 
  }
  return result
}
func (this *EVGHTMLRenderer) getUsedFonts () []string {
  return this.usedFontFamilies
}
func (this *EVGHTMLRenderer) generateServerFontFaceCSS (serverUrl string) string {
  var css string= "";
  var i int64= int64(0);
  for i < (int64(len(this.usedFontFamilies))) {
    var fontFamily string= this.usedFontFamilies[i];
    var fontFileName string= this.fontFamilyToFileName(fontFamily);
    css = css + "@font-face {\n"; 
    css = ((css + "    font-family: '") + fontFamily) + "';\n"; 
    css = ((((css + "    src: url('") + serverUrl) + "/assets/fonts/") + fontFileName) + "') format('truetype');\n"; 
    css = css + "    font-weight: 400;\n"; 
    css = css + "    font-style: normal;\n"; 
    css = css + "}\n"; 
    i = i + int64(1); 
  }
  return css
}
func (this *EVGHTMLRenderer) transformImagePath (imgSrc string) string {
  if  (int64(len([]rune(imgSrc)))) >= int64(10) {
    var prefix string= string([]rune(imgSrc)[int64(0):int64(10)]);
    if  prefix == "../assets/" {
      var relativePath string= string([]rune(imgSrc)[int64(10):(int64(len([]rune(imgSrc))))]);
      return this.imageBasePath + relativePath
    }
  }
  return this.imageBasePath + imgSrc
}
func (this *EVGHTMLRenderer) setImageServer (serverUrl string) () {
  this.imageBasePath = serverUrl + "/assets/"; 
}
func (this *EVGHTMLRenderer) generateShellHTML (serverUrl string) string {
  var html string= "";
  html = html + "<!DOCTYPE html>\n"; 
  html = html + "<html>\n"; 
  html = html + "<head>\n"; 
  html = html + "    <meta charset=\"UTF-8\">\n"; 
  html = html + "    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n"; 
  html = ((html + "    <title>") + this.title) + " - Live Preview</title>\n"; 
  html = html + "    <style>\n"; 
  html = html + "        * { margin: 0; padding: 0; box-sizing: border-box; }\n"; 
  html = html + "        body {\n"; 
  html = html + "            background: #b0b0b0;\n"; 
  html = html + "            padding: 40px;\n"; 
  html = html + "            min-height: 100vh;\n"; 
  html = html + "        }\n"; 
  html = html + "        /* Document container - centers pages */\n"; 
  html = html + "        .evg-document-container {\n"; 
  html = html + "            display: flex;\n"; 
  html = html + "            flex-direction: column;\n"; 
  html = html + "            align-items: center;\n"; 
  html = html + "            gap: 40px;\n"; 
  html = html + "        }\n"; 
  html = html + "        /* Page wrapper for single-page content */\n"; 
  html = html + "        .evg-page-container {\n"; 
  html = ((html + "            width: ") + (strconv.FormatInt((int64(this.pageWidth)), 10))) + "px;\n"; 
  html = ((html + "            min-height: ") + (strconv.FormatInt((int64(this.pageHeight)), 10))) + "px;\n"; 
  html = html + "            background: white;\n"; 
  html = html + "            box-shadow: 0 4px 20px rgba(0,0,0,0.3), 0 0 0 1px rgba(0,0,0,0.1);\n"; 
  html = html + "            position: relative;\n"; 
  html = html + "            overflow: hidden;\n"; 
  html = html + "            flex-shrink: 0;\n"; 
  html = html + "        }\n"; 
  html = html + "        /* Individual pages in multi-page docs */\n"; 
  html = html + "        .evg-page {\n"; 
  html = ((html + "            width: ") + (strconv.FormatInt((int64(this.pageWidth)), 10))) + "px;\n"; 
  html = ((html + "            height: ") + (strconv.FormatInt((int64(this.pageHeight)), 10))) + "px;\n"; 
  html = html + "            background: white;\n"; 
  html = html + "            box-shadow: 0 4px 20px rgba(0,0,0,0.3), 0 0 0 1px rgba(0,0,0,0.1);\n"; 
  html = html + "            position: relative;\n"; 
  html = html + "            overflow: hidden;\n"; 
  html = html + "            flex-shrink: 0;\n"; 
  html = html + "        }\n"; 
  html = html + "        /* Section groups pages */\n"; 
  html = html + "        .evg-section {\n"; 
  html = html + "            display: flex;\n"; 
  html = html + "            flex-direction: column;\n"; 
  html = html + "            align-items: center;\n"; 
  html = html + "            gap: 40px;\n"; 
  html = html + "        }\n"; 
  html = html + "        /* Document wrapper */\n"; 
  html = html + "        .evg-document {\n"; 
  html = html + "            display: flex;\n"; 
  html = html + "            flex-direction: column;\n"; 
  html = html + "            align-items: center;\n"; 
  html = html + "            gap: 40px;\n"; 
  html = html + "        }\n"; 
  html = html + "        /* Book spread view - two pages side by side */\n"; 
  html = html + "        .evg-spread {\n"; 
  html = html + "            display: flex;\n"; 
  html = html + "            flex-direction: row;\n"; 
  html = html + "            gap: 4px;\n"; 
  html = html + "            background: #888;\n"; 
  html = html + "            padding: 4px;\n"; 
  html = html + "            border-radius: 2px;\n"; 
  html = html + "            box-shadow: 0 8px 30px rgba(0,0,0,0.4);\n"; 
  html = html + "        }\n"; 
  html = html + "        .evg-spread .evg-page {\n"; 
  html = html + "            box-shadow: none;\n"; 
  html = html + "        }\n"; 
  html = html + "        /* Cover page - single centered */\n"; 
  html = html + "        .evg-cover {\n"; 
  html = html + "            box-shadow: 0 8px 30px rgba(0,0,0,0.4);\n"; 
  html = html + "        }\n"; 
  html = html + "        /* Page number labels */\n"; 
  html = html + "        .evg-page-label {\n"; 
  html = html + "            position: absolute;\n"; 
  html = html + "            bottom: -25px;\n"; 
  html = html + "            left: 50%;\n"; 
  html = html + "            transform: translateX(-50%);\n"; 
  html = html + "            font-family: system-ui, sans-serif;\n"; 
  html = html + "            font-size: 12px;\n"; 
  html = html + "            color: #666;\n"; 
  html = html + "        }\n"; 
  html = html + "        .evg-status {\n"; 
  html = html + "            position: fixed;\n"; 
  html = html + "            bottom: 10px;\n"; 
  html = html + "            right: 10px;\n"; 
  html = html + "            padding: 5px 10px;\n"; 
  html = html + "            background: #333;\n"; 
  html = html + "            color: #0f0;\n"; 
  html = html + "            font-family: monospace;\n"; 
  html = html + "            font-size: 12px;\n"; 
  html = html + "            border-radius: 4px;\n"; 
  html = html + "            opacity: 0.8;\n"; 
  html = html + "        }\n"; 
  html = html + "        .evg-view { position: relative; }\n"; 
  html = html + "        .evg-label { display: block; }\n"; 
  html = html + "        .evg-image { display: block; }\n"; 
  html = html + "    </style>\n"; 
  html = html + "    <style id=\"evg-fonts\">\n"; 
  html = html + "        /* Font faces loaded dynamically */\n"; 
  html = html + "    </style>\n"; 
  html = html + "</head>\n"; 
  html = html + "<body>\n"; 
  html = html + "    <div class=\"evg-document-container\" id=\"evg-content\">\n"; 
  html = html + "        <div class=\"evg-page-container\" style=\"padding: 20px; color: #666;\">Loading...</div>\n"; 
  html = html + "    </div>\n"; 
  html = html + "    <div class=\"evg-status\" id=\"evg-status\">Connecting...</div>\n"; 
  html = html + "    <script>\n"; 
  html = ((html + "        const serverUrl = '") + serverUrl) + "';\n"; 
  html = html + "        const contentEl = document.getElementById('evg-content');\n"; 
  html = html + "        const statusEl = document.getElementById('evg-status');\n"; 
  html = html + "        const fontsEl = document.getElementById('evg-fonts');\n"; 
  html = html + "        \n"; 
  html = html + "        // Arrange pages as book spreads: cover alone, then pairs\n"; 
  html = html + "        function arrangeAsBookSpreads() {\n"; 
  html = html + "            const pages = Array.from(contentEl.querySelectorAll('.evg-page'));\n"; 
  html = html + "            if (pages.length === 0) return;\n"; 
  html = html + "            \n"; 
  html = html + "            // Find the section or document container\n"; 
  html = html + "            const section = contentEl.querySelector('.evg-section') || contentEl.querySelector('.evg-document') || contentEl;\n"; 
  html = html + "            \n"; 
  html = html + "            // Clear the section\n"; 
  html = html + "            section.innerHTML = '';\n"; 
  html = html + "            \n"; 
  html = html + "            // First page is cover - show alone\n"; 
  html = html + "            const cover = pages[0];\n"; 
  html = html + "            cover.classList.add('evg-cover');\n"; 
  html = html + "            const coverWrapper = document.createElement('div');\n"; 
  html = html + "            coverWrapper.style.position = 'relative';\n"; 
  html = html + "            coverWrapper.style.marginBottom = '20px';\n"; 
  html = html + "            coverWrapper.appendChild(cover);\n"; 
  html = html + "            const coverLabel = document.createElement('div');\n"; 
  html = html + "            coverLabel.className = 'evg-page-label';\n"; 
  html = html + "            coverLabel.textContent = 'Kansi';\n"; 
  html = html + "            coverWrapper.appendChild(coverLabel);\n"; 
  html = html + "            section.appendChild(coverWrapper);\n"; 
  html = html + "            \n"; 
  html = html + "            // Remaining pages in pairs (spreads)\n"; 
  html = html + "            for (let i = 1; i < pages.length; i += 2) {\n"; 
  html = html + "                const spread = document.createElement('div');\n"; 
  html = html + "                spread.className = 'evg-spread';\n"; 
  html = html + "                spread.style.position = 'relative';\n"; 
  html = html + "                spread.style.marginBottom = '20px';\n"; 
  html = html + "                \n"; 
  html = html + "                // Left page\n"; 
  html = html + "                spread.appendChild(pages[i]);\n"; 
  html = html + "                \n"; 
  html = html + "                // Right page (if exists)\n"; 
  html = html + "                if (i + 1 < pages.length) {\n"; 
  html = html + "                    spread.appendChild(pages[i + 1]);\n"; 
  html = html + "                }\n"; 
  html = html + "                \n"; 
  html = html + "                // Add spread label\n"; 
  html = html + "                const spreadLabel = document.createElement('div');\n"; 
  html = html + "                spreadLabel.className = 'evg-page-label';\n"; 
  html = html + "                if (i + 1 < pages.length) {\n"; 
  html = html + "                    spreadLabel.textContent = 'Sivut ' + (i + 1) + '-' + (i + 2);\n"; 
  html = html + "                } else {\n"; 
  html = html + "                    spreadLabel.textContent = 'Sivu ' + (i + 1) + ' (takakansi)';\n"; 
  html = html + "                }\n"; 
  html = html + "                spread.appendChild(spreadLabel);\n"; 
  html = html + "                \n"; 
  html = html + "                section.appendChild(spread);\n"; 
  html = html + "            }\n"; 
  html = html + "        }\n"; 
  html = html + "        \n"; 
  html = html + "        // Load content from server\n"; 
  html = html + "        async function loadContent() {\n"; 
  html = html + "            try {\n"; 
  html = html + "                const response = await fetch(serverUrl + '/content');\n"; 
  html = html + "                const html = await response.text();\n"; 
  html = html + "                contentEl.innerHTML = html;\n"; 
  html = html + "                arrangeAsBookSpreads();\n"; 
  html = html + "                statusEl.textContent = 'Connected';\n"; 
  html = html + "                statusEl.style.color = '#0f0';\n"; 
  html = html + "            } catch (err) {\n"; 
  html = html + "                statusEl.textContent = 'Error: ' + err.message;\n"; 
  html = html + "                statusEl.style.color = '#f00';\n"; 
  html = html + "            }\n"; 
  html = html + "        }\n"; 
  html = html + "        \n"; 
  html = html + "        // Load fonts CSS\n"; 
  html = html + "        async function loadFonts() {\n"; 
  html = html + "            try {\n"; 
  html = html + "                const response = await fetch(serverUrl + '/fonts.css');\n"; 
  html = html + "                const css = await response.text();\n"; 
  html = html + "                fontsEl.textContent = css;\n"; 
  html = html + "            } catch (err) {\n"; 
  html = html + "                console.error('Failed to load fonts:', err);\n"; 
  html = html + "            }\n"; 
  html = html + "        }\n"; 
  html = html + "        \n"; 
  html = html + "        // Set up SSE for live updates\n"; 
  html = html + "        function connectSSE() {\n"; 
  html = html + "            const evtSource = new EventSource(serverUrl + '/events');\n"; 
  html = html + "            \n"; 
  html = html + "            evtSource.addEventListener('update', function(e) {\n"; 
  html = html + "                console.log('EVG: Content updated');\n"; 
  html = html + "                loadContent();\n"; 
  html = html + "            });\n"; 
  html = html + "            \n"; 
  html = html + "            evtSource.addEventListener('fonts', function(e) {\n"; 
  html = html + "                console.log('EVG: Fonts updated');\n"; 
  html = html + "                loadFonts();\n"; 
  html = html + "            });\n"; 
  html = html + "            \n"; 
  html = html + "            evtSource.onopen = function() {\n"; 
  html = html + "                console.log('EVG: Connected to preview server');\n"; 
  html = html + "                statusEl.textContent = 'Connected';\n"; 
  html = html + "                statusEl.style.color = '#0f0';\n"; 
  html = html + "            };\n"; 
  html = html + "            \n"; 
  html = html + "            evtSource.onerror = function() {\n"; 
  html = html + "                statusEl.textContent = 'Disconnected';\n"; 
  html = html + "                statusEl.style.color = '#f00';\n"; 
  html = html + "            };\n"; 
  html = html + "        }\n"; 
  html = html + "        \n"; 
  html = html + "        // Initialize\n"; 
  html = html + "        loadFonts();\n"; 
  html = html + "        loadContent();\n"; 
  html = html + "        connectSSE();\n"; 
  html = html + "    </script>\n"; 
  html = html + "</body>\n"; 
  html = html + "</html>\n"; 
  return html
}
func (this *EVGHTMLRenderer) collectFonts (el *EVGElement) () {
  if  (int64(len([]rune(el.fontFamily)))) > int64(0) {
    var found bool= false;
    var i int64= int64(0);
    for i < (int64(len(this.usedFontFamilies))) {
      if  (this.usedFontFamilies[i]) == el.fontFamily {
        found = true; 
      }
      i = i + int64(1); 
    }
    if  found == false {
      this.usedFontFamilies = append(this.usedFontFamilies,el.fontFamily); 
    }
  }
  var j int64= int64(0);
  for j < (int64(len(el.children))) {
    var child *EVGElement= el.children[j];
    this.collectFonts(child);
    j = j + int64(1); 
  }
}
type EVGPreviewServer struct { 
  inputFile string `json:"inputFile"` 
  inputDir string `json:"inputDir"` 
  inputFileName string `json:"inputFileName"` 
  assetPaths string `json:"assetPaths"` 
  pageWidth float64 `json:"pageWidth"` 
  pageHeight float64 `json:"pageHeight"` 
  port int64 `json:"port"` 
  title string `json:"title"` 
  serverUrl string `json:"serverUrl"` 
  cachedShellHTML string `json:"cachedShellHTML"` 
  cachedContentHTML string `json:"cachedContentHTML"` 
  cachedFontsCSS string `json:"cachedFontsCSS"` 
  lastModTime int64 `json:"lastModTime"` 
}

func CreateNew_EVGPreviewServer() *EVGPreviewServer {
  me := new(EVGPreviewServer)
  me.inputFile = ""
  me.inputDir = ""
  me.inputFileName = ""
  me.assetPaths = ""
  me.pageWidth = 595.0
  me.pageHeight = 842.0
  me.port = int64(3000)
  me.title = "EVG Preview"
  me.serverUrl = ""
  me.cachedShellHTML = ""
  me.cachedContentHTML = ""
  me.cachedFontsCSS = ""
  me.lastModTime = int64(0)
  return me;
}
func (this *EVGPreviewServer) initialize (tsxFile string, serverPort int64, assets string) () {
  this.inputFile = tsxFile; 
  this.port = serverPort; 
  this.assetPaths = assets; 
  this.serverUrl = "http://localhost:" + (strconv.FormatInt(this.port, 10)); 
  var lastSlash int64= int64(strings.LastIndex(this.inputFile, "/"));
  var lastBackslash int64= int64(strings.LastIndex(this.inputFile, "\\"));
  var lastSep int64= lastSlash;
  if  lastBackslash > lastSep {
    lastSep = lastBackslash; 
  }
  if  lastSep >= int64(0) {
    this.inputDir = string([]rune(this.inputFile)[int64(0):(lastSep + int64(1))]); 
    this.inputFileName = string([]rune(this.inputFile)[(lastSep + int64(1)):(int64(len([]rune(this.inputFile))))]); 
  } else {
    this.inputDir = "./"; 
    this.inputFileName = this.inputFile; 
  }
  this.title = this.inputFileName; 
  this.reloadContent();
}
func (this *EVGPreviewServer) reloadContent () () {
  fmt.Println( "Parsing TSX file: " + this.inputFile )
  var engine *ComponentEngine= CreateNew_ComponentEngine();
  engine.pageWidth = this.pageWidth; 
  engine.pageHeight = this.pageHeight; 
  if  (int64(len([]rune(this.assetPaths)))) > int64(0) {
    engine.setAssetPaths(this.assetPaths);
  }
  var root *EVGElement= engine.parseFile(this.inputDir, this.inputFileName);
  if  root.tagName == "" {
    fmt.Println( "Error: Failed to parse TSX file" )
    this.cachedContentHTML = "<div style='color:red;padding:20px;'>Error: Failed to parse TSX file</div>"; 
    return
  }
  fmt.Println( ((("Parsed: <" + root.tagName) + "> with ") + (strconv.FormatInt(root.getChildCount(), 10))) + " children" )
  var useWidth float64= this.pageWidth;
  var useHeight float64= this.pageHeight;
  if  root.pageWidth > 0.0 {
    useWidth = root.pageWidth; 
    fmt.Println( ("Using book format width: " + (strconv.FormatFloat(root.pageWidth,'f', 6, 64))) + " pts" )
  }
  if  root.pageHeight > 0.0 {
    useHeight = root.pageHeight; 
    fmt.Println( ("Using book format height: " + (strconv.FormatFloat(root.pageHeight,'f', 6, 64))) + " pts" )
  }
  var renderer *EVGHTMLRenderer= CreateNew_EVGHTMLRenderer();
  renderer.setPageSize(useWidth, useHeight);
  renderer.setTitle(this.title);
  renderer.setBaseDir(this.inputDir);
  renderer.setFontBasePath(this.inputDir + "../assets/fonts/");
  renderer.setImageServer(this.serverUrl);
  this.cachedContentHTML = renderer.renderContent(root); 
  this.cachedShellHTML = renderer.generateShellHTML(this.serverUrl); 
  this.cachedFontsCSS = renderer.generateServerFontFaceCSS(this.serverUrl); 
  fmt.Println( ("Content rendered: " + (strconv.FormatInt((int64(len([]rune(this.cachedContentHTML)))), 10))) + " bytes" )
}
func (this *EVGPreviewServer) handleIndex (req *http.Request, res http.ResponseWriter) () {
  res.Header().Set("Content-Type", "text/html; charset=utf-8")
  res.WriteHeader(int(int64(200)))
  res.Write([]byte(this.cachedShellHTML))
}
func (this *EVGPreviewServer) handleContent (req *http.Request, res http.ResponseWriter) () {
  this.reloadContent();
  res.Header().Set("Content-Type", "text/html; charset=utf-8")
  res.Header().Set("Cache-Control", "no-cache")
  res.WriteHeader(int(int64(200)))
  res.Write([]byte(this.cachedContentHTML))
}
func (this *EVGPreviewServer) handleFontsCSS (req *http.Request, res http.ResponseWriter) () {
  res.Header().Set("Content-Type", "text/css; charset=utf-8")
  res.Header().Set("Cache-Control", "no-cache")
  res.WriteHeader(int(int64(200)))
  res.Write([]byte(this.cachedFontsCSS))
}
func (this *EVGPreviewServer) handleAssets (req *http.Request, res http.ResponseWriter) () {
  var path string= req.URL.Path;
  var assetPath string= string([]rune(path)[int64(8):(int64(len([]rune(path))))]);
  fmt.Println( "Asset request: " + assetPath )
  var fullPath string= "./assets/" + assetPath;
  fmt.Println( "  Trying: " + fullPath )
  var fileData []byte= func() []byte { d, _ := os.ReadFile(filepath.Join("", fullPath)); return d }();
  if  (int64(len(fileData))) == int64(0) {
    fmt.Println( "  Not found, trying alternative path..." )
    fullPath = (this.inputDir + "../assets/") + assetPath; 
    fmt.Println( "  Trying: " + fullPath )
    fileData = func() []byte { d, _ := os.ReadFile(filepath.Join("", fullPath)); return d }(); 
  }
  if  (int64(len(fileData))) == int64(0) {
    fmt.Println( "  NOT FOUND: " + assetPath )
    res.Header().Set("Content-Type", "text/plain")
    res.WriteHeader(int(int64(404)))
    res.Write([]byte("Asset not found: " + assetPath))
    return
  }
  fmt.Println( "  SUCCESS: Serving asset from " + fullPath )
  var ext string= "";
  var lastDot int64= int64(strings.LastIndex(assetPath, "."));
  if  lastDot >= int64(0) {
    ext = strings.ToLower((string([]rune(assetPath)[(lastDot + int64(1)):(int64(len([]rune(assetPath))))]))); 
  }
  var contentType string= "application/octet-stream";
  if  ext == "jpg" {
    contentType = "image/jpeg"; 
  }
  if  ext == "jpeg" {
    contentType = "image/jpeg"; 
  }
  if  ext == "png" {
    contentType = "image/png"; 
  }
  if  ext == "gif" {
    contentType = "image/gif"; 
  }
  if  ext == "svg" {
    contentType = "image/svg+xml"; 
  }
  if  ext == "webp" {
    contentType = "image/webp"; 
  }
  if  ext == "woff2" {
    contentType = "font/woff2"; 
  }
  if  ext == "woff" {
    contentType = "font/woff"; 
  }
  if  ext == "ttf" {
    contentType = "font/ttf"; 
  }
  if  ext == "otf" {
    contentType = "font/otf"; 
  }
  res.Header().Set("Content-Type", contentType)
  res.Header().Set("Cache-Control", "max-age=3600")
  res.WriteHeader(int(int64(200)))
  res.Write(fileData)
}
func (this *EVGPreviewServer) handleFonts (req *http.Request, res http.ResponseWriter) () {
  var path string= req.URL.Path;
  var fontPath string= string([]rune(path)[int64(7):(int64(len([]rune(path))))]);
  var fullPath string= this.inputDir + fontPath;
  fmt.Println( "Serving font: " + fullPath )
  var fileData []byte= func() []byte { d, _ := os.ReadFile(filepath.Join("", fullPath)); return d }();
  var ext string= "";
  var lastDot int64= int64(strings.LastIndex(fontPath, "."));
  if  lastDot >= int64(0) {
    ext = strings.ToLower((string([]rune(fontPath)[(lastDot + int64(1)):(int64(len([]rune(fontPath))))]))); 
  }
  var contentType string= "application/octet-stream";
  if  ext == "woff2" {
    contentType = "font/woff2"; 
  }
  if  ext == "woff" {
    contentType = "font/woff"; 
  }
  if  ext == "ttf" {
    contentType = "font/ttf"; 
  }
  if  ext == "otf" {
    contentType = "font/otf"; 
  }
  res.Header().Set("Content-Type", contentType)
  res.Header().Set("Cache-Control", "max-age=3600")
  res.WriteHeader(int(int64(200)))
  res.Write(fileData)
}
func (this *EVGPreviewServer) handleEvents (client *SSEClient) () {
  fmt.Println( "SSE client connected - watching for changes" )
  fmt.Fprintf(client.Writer, "event: %s\ndata: %s\n\n", "connected", "EVG Preview Server")
  client.Flusher.Flush()
  var currentModTime int64= r_file_mtime(this.inputDir, this.inputFileName);
  this.lastModTime = currentModTime; 
  var connected bool= client.IsConnected;
  for connected {
    currentModTime = r_file_mtime(this.inputDir, this.inputFileName); 
    if  currentModTime > this.lastModTime {
      fmt.Println( "File changed - sending update" )
      this.lastModTime = currentModTime; 
      fmt.Fprintf(client.Writer, "event: %s\ndata: %s\n\n", "update", "File modified")
      client.Flusher.Flush()
    }
    connected = client.IsConnected; 
  }
  fmt.Println( "SSE client disconnected" )
}
func main() {
  var argCount int64= int64( len( os.Args) - 1 );
  var showHelp bool= false;
  if  argCount >= int64(1) {
    var firstArg string= os.Args[int64(0) + 1];
    if  (firstArg == "--help") || (firstArg == "-h") {
      showHelp = true; 
    }
  }
  if  (argCount < int64(1)) || showHelp {
    fmt.Println( "EVG Preview Server - Live TSX Preview with Component Support" )
    fmt.Println( "" )
    fmt.Println( "Usage: evg_preview_server <input.tsx> [port] [options]" )
    fmt.Println( "" )
    fmt.Println( "DESCRIPTION:" )
    fmt.Println( "  Starts a live preview server for TSX documents." )
    fmt.Println( "  Changes to the file automatically refresh the browser." )
    fmt.Println( "" )
    fmt.Println( "ARGUMENTS:" )
    fmt.Println( "  input.tsx   TSX file to preview (required)" )
    fmt.Println( "  port        Server port (default: 3000)" )
    fmt.Println( "" )
    fmt.Println( "OPTIONS:" )
    fmt.Println( "  --assets=PATHS   Semicolon-separated paths for imports" )
    fmt.Println( "                   Default: ../components;../assets (relative to input)" )
    fmt.Println( "" )
    fmt.Println( "DEFAULT FOLDER STRUCTURE:" )
    fmt.Println( "  The server expects this structure (can be overridden with --assets):" )
    fmt.Println( "" )
    fmt.Println( "    project/" )
    fmt.Println( "    ├── examples/" )
    fmt.Println( "    │   └── document.tsx      <- Run server here" )
    fmt.Println( "    ├── components/" )
    fmt.Println( "    │   └── PhotoLayouts.tsx  <- Component imports" )
    fmt.Println( "    └── assets/" )
    fmt.Println( "        ├── fonts/            <- Font files" )
    fmt.Println( "        │   └── Helvetica/Helvetica.ttf" )
    fmt.Println( "        └── images/           <- Image files" )
    fmt.Println( "            └── photo.jpg" )
    fmt.Println( "" )
    fmt.Println( "EXAMPLES:" )
    fmt.Println( "  # Basic usage (from examples folder)" )
    fmt.Println( "  cd gallery/pdf_writer && ./bin/evg_preview_server examples/test_gallery.tsx 3006" )
    fmt.Println( "" )
    fmt.Println( "  # With custom port" )
    fmt.Println( "  ./bin/evg_preview_server examples/document.tsx 8080" )
    fmt.Println( "" )
    fmt.Println( "  # With explicit asset paths" )
    fmt.Println( "  ./bin/evg_preview_server my_doc.tsx 3000 --assets=./components;./fonts" )
    fmt.Println( "" )
    fmt.Println( "  Then open http://localhost:<port> in your browser." )
    return
  }
  var inputFile string= os.Args[int64(0) + 1];
  var port int64= int64(3000);
  var assetPaths string= "";
  var i int64= int64(1);
  for i < argCount {
    var arg string= os.Args[i + 1];
    if  (int64(strings.Index(arg, "--assets="))) == int64(0) {
      assetPaths = string([]rune(arg)[int64(9):(int64(len([]rune(arg))))]); 
    } else {
      var portVal *GoNullable = new(GoNullable); 
      portVal = r_str_2_i64(arg);
      if ( portVal.has_value) {
        port = portVal.value.(int64); 
      }
    }
    i = i + int64(1); 
  }
  if  (int64(len([]rune(assetPaths)))) == int64(0) {
    var lastSlash int64= int64(strings.LastIndex(inputFile, "/"));
    if  lastSlash >= int64(0) {
      var baseDir string= string([]rune(inputFile)[int64(0):lastSlash]);
      assetPaths = ((baseDir + "/../components;") + baseDir) + "/../assets"; 
    }
  }
  fmt.Println( "" )
  fmt.Println( "╔═══════════════════════════════════════════════════════════╗" )
  fmt.Println( "║     EVG Preview Server - Live Preview with Components     ║" )
  fmt.Println( "╚═══════════════════════════════════════════════════════════╝" )
  fmt.Println( "" )
  fmt.Println( "  File: " + inputFile )
  fmt.Println( "  Port: " + (strconv.FormatInt(port, 10)) )
  fmt.Println( "  Assets: " + assetPaths )
  fmt.Println( "  Live reload: enabled" )
  fmt.Println( "" )
  var server *EVGPreviewServer= CreateNew_EVGPreviewServer();
  server.initialize(inputFile, port, assetPaths);
  fmt.Println( "" )
  fmt.Println( "Starting server at http://localhost:" + (strconv.FormatInt(port, 10)) )
  fmt.Println( "Watching for file changes..." )
  fmt.Println( "Press Ctrl+C to stop" )
  fmt.Println( "" )
  // HTTP Server setup for EVGPreviewServer
  mux := http.NewServeMux()
  mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
    if r.Method != "GET" {
      http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
      return
    }
    server.handleIndex(r, w)
  })
  mux.HandleFunc("/content", func(w http.ResponseWriter, r *http.Request) {
    if r.Method != "GET" {
      http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
      return
    }
    server.handleContent(r, w)
  })
  mux.HandleFunc("/fonts.css", func(w http.ResponseWriter, r *http.Request) {
    if r.Method != "GET" {
      http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
      return
    }
    server.handleFontsCSS(r, w)
  })
  mux.HandleFunc("/assets/", func(w http.ResponseWriter, r *http.Request) {
    if r.Method != "GET" {
      http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
      return
    }
    server.handleAssets(r, w)
  })
  mux.HandleFunc("/fonts/", func(w http.ResponseWriter, r *http.Request) {
    if r.Method != "GET" {
      http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
      return
    }
    server.handleFonts(r, w)
  })
  mux.HandleFunc("/events", func(w http.ResponseWriter, r *http.Request) {
    flusher, ok := w.(http.Flusher)
    if !ok {
      http.Error(w, "SSE not supported", http.StatusInternalServerError)
      return
    }
    w.Header().Set("Content-Type", "text/event-stream")
    w.Header().Set("Cache-Control", "no-cache")
    w.Header().Set("Connection", "keep-alive")
    w.Header().Set("Access-Control-Allow-Origin", "*")
    client := &SSEClient{
      Writer:      w,
      Flusher:     flusher,
      Request:     r,
      IsConnected: true,
      done:        make(chan bool),
    }
    server.handleEvents(client)
  })
  addr := fmt.Sprintf(":%d", port)
  fmt.Printf("Server starting on http://localhost%s\n", addr)
  log.Fatal(http.ListenAndServe(addr, mux))
}
