package main
import (
  "fmt"
  "io/ioutil"
  "strings"
  "strconv"
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
  me.__len = int64(len(src)); 
  return me;
}
func (this *TSLexer) peek () string {
  if  this.pos >= this.__len {
    return ""
  }
  return this.source[this.pos: (this.pos + 1)]
}
func (this *TSLexer) peekAt (offset int64) string {
  var idx int64= this.pos + offset;
  if  idx >= this.__len {
    return ""
  }
  return this.source[idx: (idx + 1)]
}
func (this *TSLexer) advance () string {
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
      if  ch == "." {
        value = value + this.advance(); 
      } else {
        return this.makeToken("Number", value, startPos, startLine, startCol)
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
  children []*TSNode `json:"children"` 
  params []*TSNode `json:"params"` 
  decorators []*TSNode `json:"decorators"` 
  left *GoNullable `json:"left"` 
  right *GoNullable `json:"right"` 
  body *GoNullable `json:"body"` 
  init *GoNullable `json:"init"` 
  typeAnnotation *GoNullable `json:"typeAnnotation"` 
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
  me.children = make([]*TSNode,0)
  me.params = make([]*TSNode,0)
  me.decorators = make([]*TSNode,0)
  me.left = new(GoNullable);
  me.right = new(GoNullable);
  me.body = new(GoNullable);
  me.init = new(GoNullable);
  me.typeAnnotation = new(GoNullable);
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
    return this.parseFuncDecl()
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
  return this.parseExprStmt()
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
  var prop *TSNode= CreateNew_TSNode();
  prop.nodeType = "TSPropertySignature"; 
  var startTok *Token= this.peek();
  prop.start = startTok.start; 
  prop.line = startTok.line; 
  prop.col = startTok.col; 
  if  this.matchValue("readonly") {
    prop.readonly = true; 
    this.advance();
  }
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
    }
    if  tokVal == "abstract" {
      isAbstract = true; 
      this.advance();
    }
    if  tokVal == "readonly" {
      isReadonly = true; 
      this.advance();
    }
    var newTokVal string= this.peekValue();
    if  (((((newTokVal != "public") && (newTokVal != "private")) && (newTokVal != "protected")) && (newTokVal != "static")) && (newTokVal != "abstract")) && (newTokVal != "readonly") {
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
  this.expectValue("(");
  var tokVal string= this.peekValue();
  if  ((tokVal == "let") || (tokVal == "const")) || (tokVal == "var") {
    var kind string= tokVal;
    this.advance();
    var varName *Token= this.expect("Identifier");
    var nextVal string= this.peekValue();
    if  nextVal == "of" {
      node.nodeType = "ForOfStatement"; 
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
  var nameTok *Token= this.expect("Identifier");
  declarator.name = nameTok.value; 
  declarator.start = nameTok.start; 
  declarator.line = nameTok.line; 
  declarator.col = nameTok.col; 
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
func (this *TSParserSimple) parseFuncDecl () *TSNode {
  var node *TSNode= CreateNew_TSNode();
  node.nodeType = "FunctionDeclaration"; 
  var startTok *Token= this.peek();
  node.start = startTok.start; 
  node.line = startTok.line; 
  node.col = startTok.col; 
  this.expectValue("function");
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
  var param *TSNode= CreateNew_TSNode();
  param.nodeType = "Parameter"; 
  for this.matchValue("@") {
    var dec *TSNode= this.parseDecorator();
    param.decorators = append(param.decorators,dec); 
  }
  if  this.matchValue("...") {
    this.advance();
    param.nodeType = "RestElement"; 
    param.kind = "rest"; 
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
  var typeExpr *TSNode= this.parseType();
  annot.typeAnnotation.value = typeExpr;
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
      this.advance();
      var innerType *TSNode= this.parseType();
      var restType *TSNode= CreateNew_TSNode();
      restType.nodeType = "TSRestType"; 
      restType.start = innerType.start; 
      restType.line = innerType.line; 
      restType.col = innerType.col; 
      restType.typeAnnotation.value = innerType;
      restType.typeAnnotation.has_value = true; /* detected as non-optional */
      tuple.children = append(tuple.children,restType); 
    } else {
      var elemType *TSNode= this.parseType();
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
  if  this.matchValue("=") {
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
  return left
}
func (this *TSParserSimple) parseNullishCoalescing () *TSNode {
  var left *TSNode= this.parseBinary();
  for this.matchValue("??") {
    this.advance();
    var right *TSNode= this.parseBinary();
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
func (this *TSParserSimple) parseBinary () *TSNode {
  var left *TSNode= this.parseUnary();
  var tokVal string= this.peekValue();
  for (((((((tokVal == "+") || (tokVal == "-")) || (tokVal == "*")) || (tokVal == "/")) || (tokVal == "===")) || (tokVal == "!==")) || (tokVal == "<")) || (tokVal == ">") {
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
    if  tokVal == "(" {
      this.advance();
      var call *TSNode= CreateNew_TSNode();
      call.nodeType = "CallExpression"; 
      call.left.value = expr;
      call.left.has_value = true; /* detected as non-optional */
      call.start = expr.start; 
      call.line = expr.line; 
      call.col = expr.col; 
      for (this.matchValue(")") == false) && (this.isAtEnd() == false) {
        if  (int64(len(call.children))) > int64(0) {
          this.expectValue(",");
        }
        var arg *TSNode= this.parseExpr();
        call.children = append(call.children,arg); 
      }
      this.expectValue(")");
      expr = call; 
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
          var arg_1 *TSNode= this.parseExpr();
          optCall.children = append(optCall.children,arg_1); 
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
    var newTokVal string= this.peekValue();
    if  ((((((newTokVal != "(") && (newTokVal != ".")) && (newTokVal != "?.")) && (newTokVal != "[")) && (newTokVal != "!")) && (newTokVal != "as")) && (newTokVal != "satisfies") {
      keepParsing = false; 
    }
  }
  return expr
}
func (this *TSParserSimple) parsePrimary () *TSNode {
  var tokType string= this.peekType();
  var tokVal string= this.peekValue();
  var tok *Token= this.peek();
  if  tokType == "Identifier" {
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
      return this.parseJSXElement()
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
      var keyTok *Token= this.peek();
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
      if  this.matchValue(":") {
        this.advance();
        var valueExpr *TSNode= this.parseExpr();
        prop.left.value = valueExpr;
        prop.left.has_value = true; /* detected as non-optional */
      } else {
        var shorthandVal *TSNode= CreateNew_TSNode();
        shorthandVal.nodeType = "Identifier"; 
        shorthandVal.name = prop.name; 
        prop.left.value = shorthandVal;
        prop.left.has_value = true; /* detected as non-optional */
        prop.kind = "shorthand"; 
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
type TSParserMain struct { 
}

func CreateNew_TSParserMain() *TSParserMain {
  me := new(TSParserMain)
  return me;
}
func TSParserMain_static_showHelp() () {
  fmt.Println( "TypeScript Parser" )
  fmt.Println( "" )
  fmt.Println( "Usage: node ts_parser_main.js [options]" )
  fmt.Println( "" )
  fmt.Println( "Options:" )
  fmt.Println( "  -h, --help          Show this help message" )
  fmt.Println( "  -d                  Run built-in demo/test suite" )
  fmt.Println( "  -i <file>           Input TypeScript file to parse" )
  fmt.Println( "  --tokens            Show tokens in addition to AST" )
  fmt.Println( "  --show-interfaces   List all interfaces in the file" )
  fmt.Println( "  --show-types        List all type aliases in the file" )
  fmt.Println( "  --show-functions    List all functions in the file" )
  fmt.Println( "" )
  fmt.Println( "Examples:" )
  fmt.Println( "  node ts_parser_main.js -d                              Run the demo" )
  fmt.Println( "  node ts_parser_main.js -i script.ts                    Parse and show AST" )
  fmt.Println( "  node ts_parser_main.js -i script.ts --tokens           Also show tokens" )
  fmt.Println( "  node ts_parser_main.js -i script.ts --show-interfaces  List interfaces" )
}
func TSParserMain_static_listDeclarations(filename string, showInterfaces bool, showTypes bool, showFunctions bool) () {
  var codeOpt *GoNullable = new(GoNullable); 
  codeOpt = r_io_read_file(".", filename);
  if  !codeOpt.has_value  {
    fmt.Println( "Error: Could not read file: " + filename )
    return
  }
  var code string= codeOpt.value.(string);
  var lexer *TSLexer= CreateNew_TSLexer(code);
  var tokens []*Token= lexer.tokenize();
  var parser *TSParserSimple= CreateNew_TSParserSimple();
  parser.initParser(tokens);
  parser.setQuiet(true);
  var program *TSNode= parser.parseProgram();
  if  showInterfaces {
    fmt.Println( ("=== Interfaces in " + filename) + " ===" )
    fmt.Println( "" )
    TSParserMain_static_listInterfaces(program);
    fmt.Println( "" )
  }
  if  showTypes {
    fmt.Println( ("=== Type Aliases in " + filename) + " ===" )
    fmt.Println( "" )
    TSParserMain_static_listTypeAliases(program);
    fmt.Println( "" )
  }
  if  showFunctions {
    fmt.Println( ("=== Functions in " + filename) + " ===" )
    fmt.Println( "" )
    TSParserMain_static_listFunctions(program);
    fmt.Println( "" )
  }
}
func TSParserMain_static_listInterfaces(program *TSNode) () {
  var count int64= int64(0);
  var idx int64 = 0;  
  for ; idx < int64(len(program.children)) ; idx++ {
    stmt := program.children[idx];
    if  stmt.nodeType == "TSInterfaceDeclaration" {
      count = count + int64(1); 
      var line string= strings.Join([]string{ "",strconv.FormatInt(stmt.line, 10) }, "");
      var props int64= int64(0);
      if  stmt.body.has_value {
        var body *TSNode= stmt.body.value.(*TSNode);
        props = int64(len(body.children)); 
      }
      fmt.Println( (((strings.Join([]string{ (("  " + stmt.name) + " ("),strconv.FormatInt(props, 10) }, "")) + " properties) [line ") + line) + "]" )
      if  stmt.body.has_value {
        var bodyNode *TSNode= stmt.body.value.(*TSNode);
        var mi int64 = 0;  
        for ; mi < int64(len(bodyNode.children)) ; mi++ {
          member := bodyNode.children[mi];
          if  member.nodeType == "TSPropertySignature" {
            var propInfo string= "    - " + member.name;
            if  member.optional {
              propInfo = propInfo + "?"; 
            }
            if  member.readonly {
              propInfo = "    - readonly " + member.name; 
              if  member.optional {
                propInfo = propInfo + "?"; 
              }
            }
            if  member.typeAnnotation.has_value {
              var typeNode *TSNode= member.typeAnnotation.value.(*TSNode);
              if  typeNode.typeAnnotation.has_value {
                var innerType *TSNode= typeNode.typeAnnotation.value.(*TSNode);
                propInfo = (propInfo + ": ") + TSParserMain_static_getTypeName(innerType); 
              }
            }
            fmt.Println( propInfo )
          }
        }
      }
    }
  }
  fmt.Println( "" )
  fmt.Println( (strings.Join([]string{ "Total: ",strconv.FormatInt(count, 10) }, "")) + " interface(s)" )
}
func TSParserMain_static_listTypeAliases(program *TSNode) () {
  var count int64= int64(0);
  var idx int64 = 0;  
  for ; idx < int64(len(program.children)) ; idx++ {
    stmt := program.children[idx];
    if  stmt.nodeType == "TSTypeAliasDeclaration" {
      count = count + int64(1); 
      var line string= strings.Join([]string{ "",strconv.FormatInt(stmt.line, 10) }, "");
      var typeInfo string= "  " + stmt.name;
      if  stmt.typeAnnotation.has_value {
        var typeNode *TSNode= stmt.typeAnnotation.value.(*TSNode);
        typeInfo = (typeInfo + " = ") + TSParserMain_static_getTypeName(typeNode); 
      }
      typeInfo = ((typeInfo + " [line ") + line) + "]"; 
      fmt.Println( typeInfo )
    }
  }
  fmt.Println( "" )
  fmt.Println( (strings.Join([]string{ "Total: ",strconv.FormatInt(count, 10) }, "")) + " type alias(es)" )
}
func TSParserMain_static_listFunctions(program *TSNode) () {
  var count int64= int64(0);
  var idx int64 = 0;  
  for ; idx < int64(len(program.children)) ; idx++ {
    stmt := program.children[idx];
    if  stmt.nodeType == "FunctionDeclaration" {
      count = count + int64(1); 
      var line string= strings.Join([]string{ "",strconv.FormatInt(stmt.line, 10) }, "");
      var funcInfo string= ("  " + stmt.name) + "(";
      /** unused:  paramCount*/
      var pi int64= int64(0);
      var paramIdx int64 = 0;  
      for ; paramIdx < int64(len(stmt.params)) ; paramIdx++ {
        param := stmt.params[paramIdx];
        if  pi > int64(0) {
          funcInfo = funcInfo + ", "; 
        }
        funcInfo = funcInfo + param.name; 
        if  param.optional {
          funcInfo = funcInfo + "?"; 
        }
        if  param.typeAnnotation.has_value {
          var paramType *TSNode= param.typeAnnotation.value.(*TSNode);
          if  paramType.typeAnnotation.has_value {
            var innerType *TSNode= paramType.typeAnnotation.value.(*TSNode);
            funcInfo = (funcInfo + ": ") + TSParserMain_static_getTypeName(innerType); 
          }
        }
        pi = pi + int64(1); 
      }
      funcInfo = funcInfo + ")"; 
      if  stmt.typeAnnotation.has_value {
        var retType *TSNode= stmt.typeAnnotation.value.(*TSNode);
        if  retType.typeAnnotation.has_value {
          var innerRet *TSNode= retType.typeAnnotation.value.(*TSNode);
          funcInfo = (funcInfo + ": ") + TSParserMain_static_getTypeName(innerRet); 
        }
      }
      funcInfo = ((funcInfo + " [line ") + line) + "]"; 
      fmt.Println( funcInfo )
    }
  }
  fmt.Println( "" )
  fmt.Println( (strings.Join([]string{ "Total: ",strconv.FormatInt(count, 10) }, "")) + " function(s)" )
}
func TSParserMain_static_getTypeName(typeNode *TSNode) string {
  var nodeType string= typeNode.nodeType;
  if  nodeType == "TSStringKeyword" {
    return "string"
  }
  if  nodeType == "TSNumberKeyword" {
    return "number"
  }
  if  nodeType == "TSBooleanKeyword" {
    return "boolean"
  }
  if  nodeType == "TSAnyKeyword" {
    return "any"
  }
  if  nodeType == "TSVoidKeyword" {
    return "void"
  }
  if  nodeType == "TSNullKeyword" {
    return "null"
  }
  if  nodeType == "TSUndefinedKeyword" {
    return "undefined"
  }
  if  nodeType == "TSTypeReference" {
    var result string= typeNode.name;
    if  (int64(len(typeNode.params))) > int64(0) {
      result = result + "<"; 
      var gi int64= int64(0);
      var gpIdx int64 = 0;  
      for ; gpIdx < int64(len(typeNode.params)) ; gpIdx++ {
        gp := typeNode.params[gpIdx];
        if  gi > int64(0) {
          result = result + ", "; 
        }
        result = result + TSParserMain_static_getTypeName(gp); 
        gi = gi + int64(1); 
      }
      result = result + ">"; 
    }
    return result
  }
  if  nodeType == "TSUnionType" {
    var result_1 string= "";
    var ui int64= int64(0);
    var utIdx int64 = 0;  
    for ; utIdx < int64(len(typeNode.children)) ; utIdx++ {
      ut := typeNode.children[utIdx];
      if  ui > int64(0) {
        result_1 = result_1 + " | "; 
      }
      result_1 = result_1 + TSParserMain_static_getTypeName(ut); 
      ui = ui + int64(1); 
    }
    return result_1
  }
  return nodeType
}
func TSParserMain_static_parseFile(filename string, showTokens bool) () {
  var codeOpt *GoNullable = new(GoNullable); 
  codeOpt = r_io_read_file(".", filename);
  if  !codeOpt.has_value  {
    fmt.Println( "Error: Could not read file: " + filename )
    return
  }
  var code string= codeOpt.value.(string);
  fmt.Println( ("=== Parsing: " + filename) + " ===" )
  fmt.Println( "" )
  var lexer *TSLexer= CreateNew_TSLexer(code);
  var tokens []*Token= lexer.tokenize();
  if  showTokens {
    fmt.Println( "--- Tokens ---" )
    var ti int64 = 0;  
    for ; ti < int64(len(tokens)) ; ti++ {
      tok := tokens[ti];
      var output string= ((tok.tokenType + ": '") + tok.value) + "'";
      fmt.Println( output )
    }
    fmt.Println( "" )
  }
  var parser *TSParserSimple= CreateNew_TSParserSimple();
  parser.initParser(tokens);
  var program *TSNode= parser.parseProgram();
  fmt.Println( "--- AST ---" )
  fmt.Println( (strings.Join([]string{ "Program with ",strconv.FormatInt((int64(len(program.children))), 10) }, "")) + " statements:" )
  fmt.Println( "" )
  var idx int64 = 0;  
  for ; idx < int64(len(program.children)) ; idx++ {
    stmt := program.children[idx];
    TSParserMain_static_printNode(stmt, int64(0));
  }
}
func TSParserMain_static_runDemo() () {
  var code string= "\r\ninterface Person {\r\n  readonly id: number;\r\n  name: string;\r\n  age?: number;\r\n}\r\n\r\ntype ID = string | number;\r\n\r\ntype Result = Person | null;\r\n\r\nlet count: number = 42;\r\n\r\nconst message: string = 'hello';\r\n\r\nfunction greet(name: string, age?: number): string {\r\n  return name;\r\n}\r\n\r\nlet data: Array<string>;\r\n";
  fmt.Println( "=== TypeScript Parser Demo ===" )
  fmt.Println( "" )
  fmt.Println( "Input:" )
  fmt.Println( code )
  fmt.Println( "" )
  fmt.Println( "--- Tokens ---" )
  var lexer *TSLexer= CreateNew_TSLexer(code);
  var tokens []*Token= lexer.tokenize();
  var i int64 = 0;  
  for ; i < int64(len(tokens)) ; i++ {
    tok := tokens[i];
    var output string= ((tok.tokenType + ": '") + tok.value) + "'";
    fmt.Println( output )
  }
  fmt.Println( "" )
  fmt.Println( "--- AST ---" )
  var parser *TSParserSimple= CreateNew_TSParserSimple();
  parser.initParser(tokens);
  var program *TSNode= parser.parseProgram();
  fmt.Println( (strings.Join([]string{ "Program with ",strconv.FormatInt((int64(len(program.children))), 10) }, "")) + " statements:" )
  fmt.Println( "" )
  var idx int64 = 0;  
  for ; idx < int64(len(program.children)) ; idx++ {
    stmt := program.children[idx];
    TSParserMain_static_printNode(stmt, int64(0));
  }
}
func TSParserMain_static_printNode(node *TSNode, depth int64) () {
  var indent string= "";
  var i int64= int64(0);
  for i < depth {
    indent = indent + "  "; 
    i = i + int64(1); 
  }
  var nodeType string= node.nodeType;
  var loc string= (strings.Join([]string{ ((strings.Join([]string{ "[",strconv.FormatInt(node.line, 10) }, "")) + ":"),strconv.FormatInt(node.col, 10) }, "")) + "]";
  if  nodeType == "TSInterfaceDeclaration" {
    fmt.Println( (((indent + "TSInterfaceDeclaration: ") + node.name) + " ") + loc )
    if  node.body.has_value {
      TSParserMain_static_printNode(node.body.value.(*TSNode), depth + int64(1));
    }
    return
  }
  if  nodeType == "TSInterfaceBody" {
    fmt.Println( (indent + "TSInterfaceBody ") + loc )
    var mi int64 = 0;  
    for ; mi < int64(len(node.children)) ; mi++ {
      member := node.children[mi];
      TSParserMain_static_printNode(member, depth + int64(1));
    }
    return
  }
  if  nodeType == "TSPropertySignature" {
    var modifiers string= "";
    if  node.readonly {
      modifiers = "readonly "; 
    }
    if  node.optional {
      modifiers = modifiers + "optional "; 
    }
    fmt.Println( ((((indent + "TSPropertySignature: ") + modifiers) + node.name) + " ") + loc )
    if  node.typeAnnotation.has_value {
      TSParserMain_static_printNode(node.typeAnnotation.value.(*TSNode), depth + int64(1));
    }
    return
  }
  if  nodeType == "TSTypeAliasDeclaration" {
    fmt.Println( (((indent + "TSTypeAliasDeclaration: ") + node.name) + " ") + loc )
    if  node.typeAnnotation.has_value {
      TSParserMain_static_printNode(node.typeAnnotation.value.(*TSNode), depth + int64(1));
    }
    return
  }
  if  nodeType == "TSTypeAnnotation" {
    fmt.Println( (indent + "TSTypeAnnotation ") + loc )
    if  node.typeAnnotation.has_value {
      TSParserMain_static_printNode(node.typeAnnotation.value.(*TSNode), depth + int64(1));
    }
    return
  }
  if  nodeType == "TSUnionType" {
    fmt.Println( (indent + "TSUnionType ") + loc )
    var ti int64 = 0;  
    for ; ti < int64(len(node.children)) ; ti++ {
      typeNode := node.children[ti];
      TSParserMain_static_printNode(typeNode, depth + int64(1));
    }
    return
  }
  if  nodeType == "TSTypeReference" {
    fmt.Println( (((indent + "TSTypeReference: ") + node.name) + " ") + loc )
    var pi int64 = 0;  
    for ; pi < int64(len(node.params)) ; pi++ {
      param := node.params[pi];
      TSParserMain_static_printNode(param, depth + int64(1));
    }
    return
  }
  if  nodeType == "TSArrayType" {
    fmt.Println( (indent + "TSArrayType ") + loc )
    if  node.left.has_value {
      TSParserMain_static_printNode(node.left.value.(*TSNode), depth + int64(1));
    }
    return
  }
  if  nodeType == "TSStringKeyword" {
    fmt.Println( (indent + "TSStringKeyword ") + loc )
    return
  }
  if  nodeType == "TSNumberKeyword" {
    fmt.Println( (indent + "TSNumberKeyword ") + loc )
    return
  }
  if  nodeType == "TSBooleanKeyword" {
    fmt.Println( (indent + "TSBooleanKeyword ") + loc )
    return
  }
  if  nodeType == "TSAnyKeyword" {
    fmt.Println( (indent + "TSAnyKeyword ") + loc )
    return
  }
  if  nodeType == "TSNullKeyword" {
    fmt.Println( (indent + "TSNullKeyword ") + loc )
    return
  }
  if  nodeType == "TSVoidKeyword" {
    fmt.Println( (indent + "TSVoidKeyword ") + loc )
    return
  }
  if  nodeType == "VariableDeclaration" {
    fmt.Println( (((indent + "VariableDeclaration (") + node.kind) + ") ") + loc )
    var di int64 = 0;  
    for ; di < int64(len(node.children)) ; di++ {
      declarator := node.children[di];
      TSParserMain_static_printNode(declarator, depth + int64(1));
    }
    return
  }
  if  nodeType == "VariableDeclarator" {
    fmt.Println( (((indent + "VariableDeclarator: ") + node.name) + " ") + loc )
    if  node.typeAnnotation.has_value {
      TSParserMain_static_printNode(node.typeAnnotation.value.(*TSNode), depth + int64(1));
    }
    if  node.init.has_value {
      fmt.Println( indent + "  init:" )
      TSParserMain_static_printNode(node.init.value.(*TSNode), depth + int64(2));
    }
    return
  }
  if  nodeType == "FunctionDeclaration" {
    var paramNames string= "";
    var pi_1 int64 = 0;  
    for ; pi_1 < int64(len(node.params)) ; pi_1++ {
      p := node.params[pi_1];
      if  pi_1 > int64(0) {
        paramNames = paramNames + ", "; 
      }
      paramNames = paramNames + p.name; 
      if  p.optional {
        paramNames = paramNames + "?"; 
      }
    }
    fmt.Println( (((((indent + "FunctionDeclaration: ") + node.name) + "(") + paramNames) + ") ") + loc )
    if  node.typeAnnotation.has_value {
      fmt.Println( indent + "  returnType:" )
      TSParserMain_static_printNode(node.typeAnnotation.value.(*TSNode), depth + int64(2));
    }
    if  node.body.has_value {
      TSParserMain_static_printNode(node.body.value.(*TSNode), depth + int64(1));
    }
    return
  }
  if  nodeType == "BlockStatement" {
    fmt.Println( (indent + "BlockStatement ") + loc )
    var si int64 = 0;  
    for ; si < int64(len(node.children)) ; si++ {
      stmt := node.children[si];
      TSParserMain_static_printNode(stmt, depth + int64(1));
    }
    return
  }
  if  nodeType == "ExpressionStatement" {
    fmt.Println( (indent + "ExpressionStatement ") + loc )
    if  node.left.has_value {
      TSParserMain_static_printNode(node.left.value.(*TSNode), depth + int64(1));
    }
    return
  }
  if  nodeType == "ReturnStatement" {
    fmt.Println( (indent + "ReturnStatement ") + loc )
    if  node.left.has_value {
      TSParserMain_static_printNode(node.left.value.(*TSNode), depth + int64(1));
    }
    return
  }
  if  nodeType == "Identifier" {
    fmt.Println( (((indent + "Identifier: ") + node.name) + " ") + loc )
    return
  }
  if  nodeType == "NumericLiteral" {
    fmt.Println( (((indent + "NumericLiteral: ") + node.value) + " ") + loc )
    return
  }
  if  nodeType == "StringLiteral" {
    fmt.Println( (((indent + "StringLiteral: ") + node.value) + " ") + loc )
    return
  }
  fmt.Println( ((indent + nodeType) + " ") + loc )
}
func main() {
  var argCnt int64= int64( len( os.Args) - 1 );
  if  argCnt == int64(0) {
    TSParserMain_static_showHelp();
    return
  }
  var inputFile string= "";
  var runDefault bool= false;
  var showTokens bool= false;
  var showInterfaces bool= false;
  var showTypes bool= false;
  var showFunctions bool= false;
  var i int64= int64(0);
  for i < argCnt {
    var arg string= os.Args[i + 1];
    if  (arg == "--help") || (arg == "-h") {
      TSParserMain_static_showHelp();
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
        if  arg == "--tokens" {
          showTokens = true; 
          i = i + int64(1); 
        } else {
          if  arg == "--show-interfaces" {
            showInterfaces = true; 
            i = i + int64(1); 
          } else {
            if  arg == "--show-types" {
              showTypes = true; 
              i = i + int64(1); 
            } else {
              if  arg == "--show-functions" {
                showFunctions = true; 
                i = i + int64(1); 
              } else {
                i = i + int64(1); 
              }
            }
          }
        }
      }
    }
  }
  if  runDefault {
    TSParserMain_static_runDemo();
    return
  }
  if  (int64(len(inputFile))) > int64(0) {
    if  (showInterfaces || showTypes) || showFunctions {
      TSParserMain_static_listDeclarations(inputFile, showInterfaces, showTypes, showFunctions);
      return
    }
    TSParserMain_static_parseFile(inputFile, showTokens);
    return
  }
  TSParserMain_static_showHelp();
}
