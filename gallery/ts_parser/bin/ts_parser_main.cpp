#include  <memory>
#include  "variant.hpp"
#include  <string>
#include  <vector>
#include  <iostream>
#include  <fstream>

// define classes here to avoid compiler errors
class Token;
class TSLexer;
class TSNode;
class TSParserSimple;
class TSParserMain;

typedef mpark::variant<std::shared_ptr<Token>, std::shared_ptr<TSLexer>, std::shared_ptr<TSNode>, std::shared_ptr<TSParserSimple>, std::shared_ptr<TSParserMain>, int, std::string, bool, double>  r_union_Any;

std::string r_utf8_char_at(const std::string& str, int pos_i)
{
    unsigned int pos ((unsigned int)pos_i);
    unsigned int c, i, ix, q;
    for (q=0, i=0, ix=str.length(); i < ix; i++, q++)
    {
        if (q==pos){
            c = (unsigned char) str[i];
            int char_len = 1;
            if(c<=127) char_len = 1;
            else if ((c & 0xE0) == 0xC0) char_len = 2;
            else if ((c & 0xF0) == 0xE0) char_len = 3;
            else if ((c & 0xF8) == 0xF0) char_len = 4;
            else return "";
            return str.substr(i, char_len);
        }
        c = (unsigned char) str[i];
        if(c<=127) i+=0;
        else if ((c & 0xE0) == 0xC0) i+=1;
        else if ((c & 0xF0) == 0xE0) i+=2;
        else if ((c & 0xF8) == 0xF0) i+=3;
        else return "";
    }
    return "";
}


std::string  r_cpp_readFile(std::string path, std::string filename)
{
  std::ifstream ifs(path + "/" + filename);
  std::string content( (std::istreambuf_iterator<char>(ifs) ),
                       (std::istreambuf_iterator<char>()    ) );
  return content;
}


// header definitions
class Token : public std::enable_shared_from_this<Token>  { 
  public :
    std::string tokenType;
    std::string value;
    int line;
    int col;
    int start;
    int end;
    /* class constructor */ 
    Token( );
};
class TSLexer : public std::enable_shared_from_this<TSLexer>  { 
  public :
    std::string source;
    int pos;
    int line;
    int col;
    int __len;
    /* class constructor */ 
    TSLexer( std::string src  );
    /* instance methods */ 
    std::string peek();
    std::string peekAt( int offset );
    std::string advance();
    bool isDigit( std::string ch );
    bool isAlpha( std::string ch );
    bool isAlphaNumCh( std::string ch );
    bool isWhitespace( std::string ch );
    void skipWhitespace();
    std::shared_ptr<Token> makeToken( std::string tokType , std::string value , int startPos , int startLine , int startCol );
    std::shared_ptr<Token> readLineComment();
    std::shared_ptr<Token> readBlockComment();
    std::shared_ptr<Token> readString( std::string quote );
    std::shared_ptr<Token> readTemplateLiteral();
    std::shared_ptr<Token> readNumber();
    std::shared_ptr<Token> readIdentifier();
    std::string identType( std::string value );
    std::shared_ptr<Token> nextToken();
    std::vector<std::shared_ptr<Token>> tokenize();
};
class TSNode : public std::enable_shared_from_this<TSNode>  { 
  public :
    std::string nodeType;
    int start;
    int end;
    int line;
    int col;
    std::string name;
    std::string value;
    std::string kind;
    bool optional;
    bool readonly;
    std::vector<std::shared_ptr<TSNode>> children;
    std::vector<std::shared_ptr<TSNode>> params;
    std::vector<std::shared_ptr<TSNode>> decorators;
    std::shared_ptr<TSNode> left;
    std::shared_ptr<TSNode> right;
    std::shared_ptr<TSNode> body;
    std::shared_ptr<TSNode> init;
    std::shared_ptr<TSNode> typeAnnotation;
    /* class constructor */ 
    TSNode( );
};
class TSParserSimple : public std::enable_shared_from_this<TSParserSimple>  { 
  public :
    std::vector<std::shared_ptr<Token>> tokens;
    int pos;
    std::shared_ptr<Token> currentToken;
    bool quiet;
    bool tsxMode;
    /* class constructor */ 
    TSParserSimple( );
    /* instance methods */ 
    void initParser( std::vector<std::shared_ptr<Token>> toks );
    void setQuiet( bool q );
    void setTsxMode( bool enabled );
    std::shared_ptr<Token> peek();
    std::string peekType();
    std::string peekValue();
    void advance();
    std::shared_ptr<Token> expect( std::string expectedType );
    std::shared_ptr<Token> expectValue( std::string expectedValue );
    bool isAtEnd();
    bool matchType( std::string tokenType );
    bool matchValue( std::string value );
    std::shared_ptr<TSNode> parseProgram();
    std::shared_ptr<TSNode> parseStatement();
    std::string peekNextValue();
    std::shared_ptr<TSNode> parseReturn();
    std::shared_ptr<TSNode> parseImport();
    std::shared_ptr<TSNode> parseExport();
    std::shared_ptr<TSNode> parseInterface();
    std::shared_ptr<TSNode> parseInterfaceBody();
    std::vector<std::shared_ptr<TSNode>> parseTypeParams();
    std::shared_ptr<TSNode> parsePropertySig();
    std::shared_ptr<TSNode> parseTypeAlias();
    std::shared_ptr<TSNode> parseDecorator();
    std::shared_ptr<TSNode> parseClass();
    std::shared_ptr<TSNode> parseClassBody();
    std::shared_ptr<TSNode> parseClassMember();
    std::shared_ptr<TSNode> parseConstructorParam();
    std::shared_ptr<TSNode> parseEnum();
    std::shared_ptr<TSNode> parseNamespace();
    std::shared_ptr<TSNode> parseDeclare();
    std::shared_ptr<TSNode> parseIfStatement();
    std::shared_ptr<TSNode> parseWhileStatement();
    std::shared_ptr<TSNode> parseDoWhileStatement();
    std::shared_ptr<TSNode> parseThrow();
    std::shared_ptr<TSNode> parseForStatement();
    std::shared_ptr<TSNode> parseSwitchStatement();
    std::shared_ptr<TSNode> parseTryStatement();
    std::shared_ptr<TSNode> parseVarDecl();
    std::shared_ptr<TSNode> parseFuncDecl();
    std::shared_ptr<TSNode> parseParam();
    std::shared_ptr<TSNode> parseBlock();
    std::shared_ptr<TSNode> parseExprStmt();
    std::shared_ptr<TSNode> parseTypeAnnotation();
    std::shared_ptr<TSNode> parseType();
    std::shared_ptr<TSNode> parseConditionalType();
    std::shared_ptr<TSNode> parseUnionType();
    std::shared_ptr<TSNode> parseIntersectionType();
    std::shared_ptr<TSNode> parseArrayType();
    bool checkNext( std::string value );
    std::shared_ptr<TSNode> parsePrimaryType();
    std::shared_ptr<TSNode> parseTypeRef();
    std::shared_ptr<TSNode> parseTupleType();
    std::shared_ptr<TSNode> parseParenOrFunctionType();
    std::shared_ptr<TSNode> parseFunctionType( int startPos , int startLine , int startCol );
    std::shared_ptr<TSNode> parseTypeLiteral();
    std::shared_ptr<TSNode> parseTypeLiteralMember();
    std::shared_ptr<TSNode> parseMappedType( bool isReadonly , std::string readonlyMod , std::string paramName , int startPos , int startLine , int startCol );
    std::shared_ptr<TSNode> parseIndexSignatureRest( bool isReadonly , std::shared_ptr<Token> paramTok , int startPos , int startLine , int startCol );
    std::shared_ptr<TSNode> parseMethodSignature( std::string methodName , bool isOptional , int startPos , int startLine , int startCol );
    std::shared_ptr<TSNode> parseExpr();
    std::shared_ptr<TSNode> parseAssign();
    std::shared_ptr<TSNode> parseNullishCoalescing();
    std::shared_ptr<TSNode> parseBinary();
    std::shared_ptr<TSNode> parseUnary();
    std::shared_ptr<TSNode> parsePostfix();
    std::shared_ptr<TSNode> parsePrimary();
    std::shared_ptr<TSNode> parseTemplateLiteral();
    std::shared_ptr<TSNode> parseArrayLiteral();
    std::shared_ptr<TSNode> parseObjectLiteral();
    std::shared_ptr<TSNode> parseParenOrArrow();
    std::shared_ptr<TSNode> parseArrowFunction();
    std::shared_ptr<TSNode> parseNewExpression();
    std::string peekNextType();
    std::shared_ptr<TSNode> parseJSXElement();
    std::shared_ptr<TSNode> parseJSXOpeningElement();
    std::shared_ptr<TSNode> parseJSXClosingElement();
    std::shared_ptr<TSNode> parseJSXElementName();
    std::shared_ptr<TSNode> parseJSXAttribute();
    std::shared_ptr<TSNode> parseJSXExpressionContainer();
    std::shared_ptr<TSNode> parseJSXText();
    std::shared_ptr<TSNode> parseJSXFragment();
};
class TSParserMain : public std::enable_shared_from_this<TSParserMain>  { 
  public :
    /* class constructor */ 
    TSParserMain( );
    /* static methods */ 
    static void m();
    static void showHelp();
    static void listDeclarations( std::string filename , bool showInterfaces , bool showTypes , bool showFunctions );
    static void listInterfaces( std::shared_ptr<TSNode> program );
    static void listTypeAliases( std::shared_ptr<TSNode> program );
    static void listFunctions( std::shared_ptr<TSNode> program );
    static std::string getTypeName( std::shared_ptr<TSNode> typeNode );
    static void parseFile( std::string filename , bool showTokens );
    static void runDemo();
    static void printNode( std::shared_ptr<TSNode> node , int depth );
};

int __g_argc;
char **__g_argv;
Token::Token( ) {
  this->tokenType = std::string("");
  this->value = std::string("");
  this->line = 0;
  this->col = 0;
  this->start = 0;
  this->end = 0;
}
TSLexer::TSLexer( std::string src  ) {
  this->source = std::string("");
  this->pos = 0;
  this->line = 1;
  this->col = 1;
  this->__len = 0;
  source = src;
  __len = (int)(src.length());
}
std::string  TSLexer::peek() {
  if ( pos >= __len ) {
    return std::string("");
  }
  return r_utf8_char_at(source, pos);
}
std::string  TSLexer::peekAt( int offset ) {
  int idx = pos + offset;
  if ( idx >= __len ) {
    return std::string("");
  }
  return r_utf8_char_at(source, idx);
}
std::string  TSLexer::advance() {
  if ( pos >= __len ) {
    return std::string("");
  }
  std::string ch = r_utf8_char_at(source, pos);
  pos = pos + 1;
  if ( (ch == std::string("\n")) || (ch == std::string("\r\n")) ) {
    line = line + 1;
    col = 1;
  } else {
    col = col + 1;
  }
  return ch;
}
bool  TSLexer::isDigit( std::string ch ) {
  if ( ch == std::string("0") ) {
    return true;
  }
  if ( ch == std::string("1") ) {
    return true;
  }
  if ( ch == std::string("2") ) {
    return true;
  }
  if ( ch == std::string("3") ) {
    return true;
  }
  if ( ch == std::string("4") ) {
    return true;
  }
  if ( ch == std::string("5") ) {
    return true;
  }
  if ( ch == std::string("6") ) {
    return true;
  }
  if ( ch == std::string("7") ) {
    return true;
  }
  if ( ch == std::string("8") ) {
    return true;
  }
  if ( ch == std::string("9") ) {
    return true;
  }
  return false;
}
bool  TSLexer::isAlpha( std::string ch ) {
  if ( ((int)(ch.length())) == 0 ) {
    return false;
  }
  int code = source.at(pos);
  if ( code >= 97 ) {
    if ( code <= 122 ) {
      return true;
    }
  }
  if ( code >= 65 ) {
    if ( code <= 90 ) {
      return true;
    }
  }
  if ( ch == std::string("_") ) {
    return true;
  }
  if ( ch == std::string("$") ) {
    return true;
  }
  return false;
}
bool  TSLexer::isAlphaNumCh( std::string ch ) {
  if ( this->isDigit(ch) ) {
    return true;
  }
  if ( ch == std::string("_") ) {
    return true;
  }
  if ( ch == std::string("$") ) {
    return true;
  }
  if ( ((int)(ch.length())) == 0 ) {
    return false;
  }
  int code = source.at(pos);
  if ( code >= 97 ) {
    if ( code <= 122 ) {
      return true;
    }
  }
  if ( code >= 65 ) {
    if ( code <= 90 ) {
      return true;
    }
  }
  return false;
}
bool  TSLexer::isWhitespace( std::string ch ) {
  if ( ch == std::string(" ") ) {
    return true;
  }
  if ( ch == std::string("\t") ) {
    return true;
  }
  if ( ch == std::string("\n") ) {
    return true;
  }
  if ( ch == std::string("\r") ) {
    return true;
  }
  if ( ch == std::string("\r\n") ) {
    return true;
  }
  return false;
}
void  TSLexer::skipWhitespace() {
  while (pos < __len) {
    std::string ch = this->peek();
    if ( this->isWhitespace(ch) ) {
      this->advance();
    } else {
      return;
    }
  }
}
std::shared_ptr<Token>  TSLexer::makeToken( std::string tokType , std::string value , int startPos , int startLine , int startCol ) {
  std::shared_ptr<Token> tok =  std::make_shared<Token>();
  tok->tokenType = tokType;
  tok->value = value;
  tok->start = startPos;
  tok->end = pos;
  tok->line = startLine;
  tok->col = startCol;
  return tok;
}
std::shared_ptr<Token>  TSLexer::readLineComment() {
  int startPos = pos;
  int startLine = line;
  int startCol = col;
  this->advance();
  this->advance();
  std::string value = std::string("");
  while (pos < __len) {
    std::string ch = this->peek();
    if ( ch == std::string("\n") ) {
      return this->makeToken(std::string("LineComment"), value, startPos, startLine, startCol);
    }
    if ( ch == std::string("\r\n") ) {
      return this->makeToken(std::string("LineComment"), value, startPos, startLine, startCol);
    }
    value = value + this->advance();
  }
  return this->makeToken(std::string("LineComment"), value, startPos, startLine, startCol);
}
std::shared_ptr<Token>  TSLexer::readBlockComment() {
  int startPos = pos;
  int startLine = line;
  int startCol = col;
  this->advance();
  this->advance();
  std::string value = std::string("");
  while (pos < __len) {
    std::string ch = this->peek();
    if ( ch == std::string("*") ) {
      if ( this->peekAt(1) == std::string("/") ) {
        this->advance();
        this->advance();
        return this->makeToken(std::string("BlockComment"), value, startPos, startLine, startCol);
      }
    }
    value = value + this->advance();
  }
  return this->makeToken(std::string("BlockComment"), value, startPos, startLine, startCol);
}
std::shared_ptr<Token>  TSLexer::readString( std::string quote ) {
  int startPos = pos;
  int startLine = line;
  int startCol = col;
  this->advance();
  std::string value = std::string("");
  while (pos < __len) {
    std::string ch = this->peek();
    if ( ch == quote ) {
      this->advance();
      return this->makeToken(std::string("String"), value, startPos, startLine, startCol);
    }
    if ( ch == std::string("\\") ) {
      this->advance();
      std::string esc = this->advance();
      if ( esc == std::string("n") ) {
        value = value + std::string("\n");
      } else {
        if ( esc == std::string("t") ) {
          value = value + std::string("\t");
        } else {
          if ( esc == std::string("r") ) {
            value = value + std::string("\r");
          } else {
            if ( esc == std::string("\\") ) {
              value = value + std::string("\\");
            } else {
              if ( esc == quote ) {
                value = value + quote;
              } else {
                value = value + esc;
              }
            }
          }
        }
      }
    } else {
      value = value + this->advance();
    }
  }
  return this->makeToken(std::string("String"), value, startPos, startLine, startCol);
}
std::shared_ptr<Token>  TSLexer::readTemplateLiteral() {
  int startPos = pos;
  int startLine = line;
  int startCol = col;
  this->advance();
  std::string value = std::string("");
  while (pos < __len) {
    std::string ch = this->peek();
    if ( ch == std::string("`") ) {
      this->advance();
      return this->makeToken(std::string("Template"), value, startPos, startLine, startCol);
    }
    if ( ch == std::string("\\") ) {
      this->advance();
      std::string esc = this->advance();
      if ( esc == std::string("n") ) {
        value = value + std::string("\n");
      } else {
        if ( esc == std::string("t") ) {
          value = value + std::string("\t");
        } else {
          if ( esc == std::string("`") ) {
            value = value + std::string("`");
          } else {
            if ( esc == std::string("$") ) {
              value = value + std::string("$");
            } else {
              value = value + esc;
            }
          }
        }
      }
    } else {
      value = value + this->advance();
    }
  }
  return this->makeToken(std::string("Template"), value, startPos, startLine, startCol);
}
std::shared_ptr<Token>  TSLexer::readNumber() {
  int startPos = pos;
  int startLine = line;
  int startCol = col;
  std::string value = std::string("");
  while (pos < __len) {
    std::string ch = this->peek();
    if ( this->isDigit(ch) ) {
      value = value + this->advance();
    } else {
      if ( ch == std::string(".") ) {
        value = value + this->advance();
      } else {
        return this->makeToken(std::string("Number"), value, startPos, startLine, startCol);
      }
    }
  }
  return this->makeToken(std::string("Number"), value, startPos, startLine, startCol);
}
std::shared_ptr<Token>  TSLexer::readIdentifier() {
  int startPos = pos;
  int startLine = line;
  int startCol = col;
  std::string value = std::string("");
  while (pos < __len) {
    std::string ch = this->peek();
    if ( this->isAlphaNumCh(ch) ) {
      value = value + this->advance();
    } else {
      return this->makeToken(this->identType(value), value, startPos, startLine, startCol);
    }
  }
  return this->makeToken(this->identType(value), value, startPos, startLine, startCol);
}
std::string  TSLexer::identType( std::string value ) {
  if ( value == std::string("var") ) {
    return std::string("Keyword");
  }
  if ( value == std::string("let") ) {
    return std::string("Keyword");
  }
  if ( value == std::string("const") ) {
    return std::string("Keyword");
  }
  if ( value == std::string("function") ) {
    return std::string("Keyword");
  }
  if ( value == std::string("return") ) {
    return std::string("Keyword");
  }
  if ( value == std::string("if") ) {
    return std::string("Keyword");
  }
  if ( value == std::string("else") ) {
    return std::string("Keyword");
  }
  if ( value == std::string("while") ) {
    return std::string("Keyword");
  }
  if ( value == std::string("for") ) {
    return std::string("Keyword");
  }
  if ( value == std::string("in") ) {
    return std::string("Keyword");
  }
  if ( value == std::string("of") ) {
    return std::string("Keyword");
  }
  if ( value == std::string("switch") ) {
    return std::string("Keyword");
  }
  if ( value == std::string("case") ) {
    return std::string("Keyword");
  }
  if ( value == std::string("default") ) {
    return std::string("Keyword");
  }
  if ( value == std::string("break") ) {
    return std::string("Keyword");
  }
  if ( value == std::string("continue") ) {
    return std::string("Keyword");
  }
  if ( value == std::string("try") ) {
    return std::string("Keyword");
  }
  if ( value == std::string("catch") ) {
    return std::string("Keyword");
  }
  if ( value == std::string("finally") ) {
    return std::string("Keyword");
  }
  if ( value == std::string("throw") ) {
    return std::string("Keyword");
  }
  if ( value == std::string("new") ) {
    return std::string("Keyword");
  }
  if ( value == std::string("typeof") ) {
    return std::string("Keyword");
  }
  if ( value == std::string("instanceof") ) {
    return std::string("Keyword");
  }
  if ( value == std::string("this") ) {
    return std::string("Keyword");
  }
  if ( value == std::string("class") ) {
    return std::string("Keyword");
  }
  if ( value == std::string("extends") ) {
    return std::string("Keyword");
  }
  if ( value == std::string("static") ) {
    return std::string("Keyword");
  }
  if ( value == std::string("get") ) {
    return std::string("Keyword");
  }
  if ( value == std::string("set") ) {
    return std::string("Keyword");
  }
  if ( value == std::string("super") ) {
    return std::string("Keyword");
  }
  if ( value == std::string("async") ) {
    return std::string("Keyword");
  }
  if ( value == std::string("await") ) {
    return std::string("Keyword");
  }
  if ( value == std::string("yield") ) {
    return std::string("Keyword");
  }
  if ( value == std::string("import") ) {
    return std::string("Keyword");
  }
  if ( value == std::string("export") ) {
    return std::string("Keyword");
  }
  if ( value == std::string("from") ) {
    return std::string("Keyword");
  }
  if ( value == std::string("as") ) {
    return std::string("Keyword");
  }
  if ( value == std::string("delete") ) {
    return std::string("Keyword");
  }
  if ( value == std::string("void") ) {
    return std::string("Keyword");
  }
  if ( value == std::string("type") ) {
    return std::string("TSKeyword");
  }
  if ( value == std::string("interface") ) {
    return std::string("TSKeyword");
  }
  if ( value == std::string("namespace") ) {
    return std::string("TSKeyword");
  }
  if ( value == std::string("module") ) {
    return std::string("TSKeyword");
  }
  if ( value == std::string("declare") ) {
    return std::string("TSKeyword");
  }
  if ( value == std::string("readonly") ) {
    return std::string("TSKeyword");
  }
  if ( value == std::string("abstract") ) {
    return std::string("TSKeyword");
  }
  if ( value == std::string("implements") ) {
    return std::string("TSKeyword");
  }
  if ( value == std::string("private") ) {
    return std::string("TSKeyword");
  }
  if ( value == std::string("protected") ) {
    return std::string("TSKeyword");
  }
  if ( value == std::string("public") ) {
    return std::string("TSKeyword");
  }
  if ( value == std::string("override") ) {
    return std::string("TSKeyword");
  }
  if ( value == std::string("is") ) {
    return std::string("TSKeyword");
  }
  if ( value == std::string("keyof") ) {
    return std::string("TSKeyword");
  }
  if ( value == std::string("infer") ) {
    return std::string("TSKeyword");
  }
  if ( value == std::string("asserts") ) {
    return std::string("TSKeyword");
  }
  if ( value == std::string("satisfies") ) {
    return std::string("TSKeyword");
  }
  if ( value == std::string("string") ) {
    return std::string("TSType");
  }
  if ( value == std::string("number") ) {
    return std::string("TSType");
  }
  if ( value == std::string("boolean") ) {
    return std::string("TSType");
  }
  if ( value == std::string("any") ) {
    return std::string("TSType");
  }
  if ( value == std::string("unknown") ) {
    return std::string("TSType");
  }
  if ( value == std::string("never") ) {
    return std::string("TSType");
  }
  if ( value == std::string("undefined") ) {
    return std::string("TSType");
  }
  if ( value == std::string("object") ) {
    return std::string("TSType");
  }
  if ( value == std::string("symbol") ) {
    return std::string("TSType");
  }
  if ( value == std::string("bigint") ) {
    return std::string("TSType");
  }
  if ( value == std::string("true") ) {
    return std::string("Boolean");
  }
  if ( value == std::string("false") ) {
    return std::string("Boolean");
  }
  if ( value == std::string("null") ) {
    return std::string("Null");
  }
  return std::string("Identifier");
}
std::shared_ptr<Token>  TSLexer::nextToken() {
  this->skipWhitespace();
  if ( pos >= __len ) {
    return this->makeToken(std::string("EOF"), std::string(""), pos, line, col);
  }
  std::string ch = this->peek();
  int startPos = pos;
  int startLine = line;
  int startCol = col;
  if ( ch == std::string("/") ) {
    std::string next = this->peekAt(1);
    if ( next == std::string("/") ) {
      return this->readLineComment();
    }
    if ( next == std::string("*") ) {
      return this->readBlockComment();
    }
  }
  if ( ch == std::string("\"") ) {
    return this->readString(std::string("\""));
  }
  if ( ch == std::string("'") ) {
    return this->readString(std::string("'"));
  }
  if ( ch == std::string("`") ) {
    return this->readTemplateLiteral();
  }
  if ( this->isDigit(ch) ) {
    return this->readNumber();
  }
  if ( this->isAlpha(ch) ) {
    return this->readIdentifier();
  }
  std::string next_1 = this->peekAt(1);
  if ( ch == std::string("=") ) {
    if ( next_1 == std::string("=") ) {
      if ( this->peekAt(2) == std::string("=") ) {
        this->advance();
        this->advance();
        this->advance();
        return this->makeToken(std::string("Punctuator"), std::string("==="), startPos, startLine, startCol);
      }
    }
  }
  if ( ch == std::string("!") ) {
    if ( next_1 == std::string("=") ) {
      if ( this->peekAt(2) == std::string("=") ) {
        this->advance();
        this->advance();
        this->advance();
        return this->makeToken(std::string("Punctuator"), std::string("!=="), startPos, startLine, startCol);
      }
    }
  }
  if ( ch == std::string("=") ) {
    if ( next_1 == std::string(">") ) {
      this->advance();
      this->advance();
      return this->makeToken(std::string("Punctuator"), std::string("=>"), startPos, startLine, startCol);
    }
  }
  if ( ch == std::string("=") ) {
    if ( next_1 == std::string("=") ) {
      this->advance();
      this->advance();
      return this->makeToken(std::string("Punctuator"), std::string("=="), startPos, startLine, startCol);
    }
  }
  if ( ch == std::string("!") ) {
    if ( next_1 == std::string("=") ) {
      this->advance();
      this->advance();
      return this->makeToken(std::string("Punctuator"), std::string("!="), startPos, startLine, startCol);
    }
  }
  if ( ch == std::string("<") ) {
    if ( next_1 == std::string("=") ) {
      this->advance();
      this->advance();
      return this->makeToken(std::string("Punctuator"), std::string("<="), startPos, startLine, startCol);
    }
  }
  if ( ch == std::string(">") ) {
    if ( next_1 == std::string("=") ) {
      this->advance();
      this->advance();
      return this->makeToken(std::string("Punctuator"), std::string(">="), startPos, startLine, startCol);
    }
  }
  if ( ch == std::string("&") ) {
    if ( next_1 == std::string("&") ) {
      this->advance();
      this->advance();
      return this->makeToken(std::string("Punctuator"), std::string("&&"), startPos, startLine, startCol);
    }
  }
  if ( ch == std::string("|") ) {
    if ( next_1 == std::string("|") ) {
      this->advance();
      this->advance();
      return this->makeToken(std::string("Punctuator"), std::string("||"), startPos, startLine, startCol);
    }
  }
  if ( ch == std::string("?") ) {
    if ( next_1 == std::string("?") ) {
      this->advance();
      this->advance();
      return this->makeToken(std::string("Punctuator"), std::string("??"), startPos, startLine, startCol);
    }
    if ( next_1 == std::string(".") ) {
      this->advance();
      this->advance();
      return this->makeToken(std::string("Punctuator"), std::string("?."), startPos, startLine, startCol);
    }
  }
  if ( ch == std::string("+") ) {
    if ( next_1 == std::string("+") ) {
      this->advance();
      this->advance();
      return this->makeToken(std::string("Punctuator"), std::string("++"), startPos, startLine, startCol);
    }
  }
  if ( ch == std::string("-") ) {
    if ( next_1 == std::string("-") ) {
      this->advance();
      this->advance();
      return this->makeToken(std::string("Punctuator"), std::string("--"), startPos, startLine, startCol);
    }
  }
  if ( ch == std::string(".") ) {
    if ( next_1 == std::string(".") ) {
      if ( this->peekAt(2) == std::string(".") ) {
        this->advance();
        this->advance();
        this->advance();
        return this->makeToken(std::string("Punctuator"), std::string("..."), startPos, startLine, startCol);
      }
    }
  }
  this->advance();
  return this->makeToken(std::string("Punctuator"), ch, startPos, startLine, startCol);
}
std::vector<std::shared_ptr<Token>>  TSLexer::tokenize() {
  std::vector<std::shared_ptr<Token>> tokens;
  while (true) {
    std::shared_ptr<Token> tok = this->nextToken();
    tokens.push_back( tok  );
    if ( tok->tokenType == std::string("EOF") ) {
      return tokens;
    }
  }
  return tokens;
}
TSNode::TSNode( ) {
  this->nodeType = std::string("");
  this->start = 0;
  this->end = 0;
  this->line = 0;
  this->col = 0;
  this->name = std::string("");
  this->value = std::string("");
  this->kind = std::string("");
  this->optional = false;
  this->readonly = false;
}
TSParserSimple::TSParserSimple( ) {
  this->pos = 0;
  this->quiet = false;
  this->tsxMode = false;
}
void  TSParserSimple::initParser( std::vector<std::shared_ptr<Token>> toks ) {
  this->tokens = toks;
  this->pos = 0;
  this->quiet = false;
  if ( ((int)(toks.size())) > 0 ) {
    this->currentToken  = toks.at(0);
  }
}
void  TSParserSimple::setQuiet( bool q ) {
  this->quiet = q;
}
void  TSParserSimple::setTsxMode( bool enabled ) {
  this->tsxMode = enabled;
}
std::shared_ptr<Token>  TSParserSimple::peek() {
  return this->currentToken;
}
std::string  TSParserSimple::peekType() {
  if ( this->currentToken == NULL ) {
    return std::string("EOF");
  }
  std::shared_ptr<Token> tok = this->currentToken;
  return tok->tokenType;
}
std::string  TSParserSimple::peekValue() {
  if ( this->currentToken == NULL ) {
    return std::string("");
  }
  std::shared_ptr<Token> tok = this->currentToken;
  return tok->value;
}
void  TSParserSimple::advance() {
  this->pos = this->pos + 1;
  if ( this->pos < ((int)(this->tokens.size())) ) {
    this->currentToken  = this->tokens.at(this->pos);
  } else {
    std::shared_ptr<Token> eof =  std::make_shared<Token>();
    eof->tokenType = std::string("EOF");
    eof->value = std::string("");
    this->currentToken  = eof;
  }
}
std::shared_ptr<Token>  TSParserSimple::expect( std::string expectedType ) {
  std::shared_ptr<Token> tok = this->peek();
  if ( tok->tokenType != expectedType ) {
    if ( this->quiet == false ) {
      std::cout << ((std::string("Parse error: expected ") + expectedType) + std::string(" but got ")) + tok->tokenType << std::endl;
    }
  }
  this->advance();
  return tok;
}
std::shared_ptr<Token>  TSParserSimple::expectValue( std::string expectedValue ) {
  std::shared_ptr<Token> tok = this->peek();
  if ( tok->value != expectedValue ) {
    if ( this->quiet == false ) {
      std::cout << (((std::string("Parse error: expected '") + expectedValue) + std::string("' but got '")) + tok->value) + std::string("'") << std::endl;
    }
  }
  this->advance();
  return tok;
}
bool  TSParserSimple::isAtEnd() {
  std::string t = this->peekType();
  return t == std::string("EOF");
}
bool  TSParserSimple::matchType( std::string tokenType ) {
  std::string t = this->peekType();
  return t == tokenType;
}
bool  TSParserSimple::matchValue( std::string value ) {
  std::string v = this->peekValue();
  return v == value;
}
std::shared_ptr<TSNode>  TSParserSimple::parseProgram() {
  std::shared_ptr<TSNode> prog =  std::make_shared<TSNode>();
  prog->nodeType = std::string("Program");
  while (this->isAtEnd() == false) {
    std::shared_ptr<TSNode> stmt = this->parseStatement();
    prog->children.push_back( stmt  );
  }
  return prog;
}
std::shared_ptr<TSNode>  TSParserSimple::parseStatement() {
  std::string tokVal = this->peekValue();
  if ( tokVal == std::string("@") ) {
    std::vector<std::shared_ptr<TSNode>> decorators;
    while (this->matchValue(std::string("@"))) {
      std::shared_ptr<TSNode> dec = this->parseDecorator();
      decorators.push_back( dec  );
    }
    std::shared_ptr<TSNode> decorated = this->parseStatement();
    decorated->decorators = decorators;
    return decorated;
  }
  if ( tokVal == std::string("declare") ) {
    return this->parseDeclare();
  }
  if ( tokVal == std::string("import") ) {
    return this->parseImport();
  }
  if ( tokVal == std::string("export") ) {
    return this->parseExport();
  }
  if ( tokVal == std::string("interface") ) {
    return this->parseInterface();
  }
  if ( tokVal == std::string("type") ) {
    return this->parseTypeAlias();
  }
  if ( tokVal == std::string("class") ) {
    return this->parseClass();
  }
  if ( tokVal == std::string("abstract") ) {
    std::string nextVal = this->peekNextValue();
    if ( nextVal == std::string("class") ) {
      return this->parseClass();
    }
  }
  if ( tokVal == std::string("enum") ) {
    return this->parseEnum();
  }
  if ( tokVal == std::string("namespace") ) {
    return this->parseNamespace();
  }
  if ( tokVal == std::string("const") ) {
    std::string nextVal_1 = this->peekNextValue();
    if ( nextVal_1 == std::string("enum") ) {
      return this->parseEnum();
    }
  }
  if ( (tokVal == std::string("let")) || (tokVal == std::string("const")) ) {
    return this->parseVarDecl();
  }
  if ( tokVal == std::string("function") ) {
    return this->parseFuncDecl();
  }
  if ( tokVal == std::string("return") ) {
    return this->parseReturn();
  }
  if ( tokVal == std::string("throw") ) {
    return this->parseThrow();
  }
  if ( tokVal == std::string("if") ) {
    return this->parseIfStatement();
  }
  if ( tokVal == std::string("while") ) {
    return this->parseWhileStatement();
  }
  if ( tokVal == std::string("do") ) {
    return this->parseDoWhileStatement();
  }
  if ( tokVal == std::string("for") ) {
    return this->parseForStatement();
  }
  if ( tokVal == std::string("switch") ) {
    return this->parseSwitchStatement();
  }
  if ( tokVal == std::string("try") ) {
    return this->parseTryStatement();
  }
  if ( tokVal == std::string("{") ) {
    return this->parseBlock();
  }
  if ( tokVal == std::string(";") ) {
    this->advance();
    std::shared_ptr<TSNode> empty =  std::make_shared<TSNode>();
    empty->nodeType = std::string("EmptyStatement");
    return empty;
  }
  return this->parseExprStmt();
}
std::string  TSParserSimple::peekNextValue() {
  int nextPos = this->pos + 1;
  if ( nextPos < ((int)(this->tokens.size())) ) {
    std::shared_ptr<Token> nextTok = this->tokens.at(nextPos);
    return nextTok->value;
  }
  return std::string("");
}
std::shared_ptr<TSNode>  TSParserSimple::parseReturn() {
  std::shared_ptr<TSNode> node =  std::make_shared<TSNode>();
  node->nodeType = std::string("ReturnStatement");
  std::shared_ptr<Token> startTok = this->peek();
  node->start = startTok->start;
  node->line = startTok->line;
  node->col = startTok->col;
  this->expectValue(std::string("return"));
  std::string v = this->peekValue();
  if ( (v != std::string(";")) && (this->isAtEnd() == false) ) {
    std::shared_ptr<TSNode> arg = this->parseExpr();
    node->left  = arg;
  }
  if ( this->matchValue(std::string(";")) ) {
    this->advance();
  }
  return node;
}
std::shared_ptr<TSNode>  TSParserSimple::parseImport() {
  std::shared_ptr<TSNode> node =  std::make_shared<TSNode>();
  node->nodeType = std::string("ImportDeclaration");
  std::shared_ptr<Token> startTok = this->peek();
  node->start = startTok->start;
  node->line = startTok->line;
  node->col = startTok->col;
  this->expectValue(std::string("import"));
  if ( this->matchValue(std::string("type")) ) {
    this->advance();
    node->kind = std::string("type");
  }
  std::string v = this->peekValue();
  if ( v == std::string("{") ) {
    this->advance();
    std::vector<std::shared_ptr<TSNode>> specifiers;
    while ((this->matchValue(std::string("}")) == false) && (this->isAtEnd() == false)) {
      std::shared_ptr<TSNode> spec =  std::make_shared<TSNode>();
      spec->nodeType = std::string("ImportSpecifier");
      if ( this->matchValue(std::string("type")) ) {
        this->advance();
        spec->kind = std::string("type");
      }
      std::shared_ptr<Token> importedName = this->expect(std::string("Identifier"));
      spec->name = importedName->value;
      if ( this->matchValue(std::string("as")) ) {
        this->advance();
        std::shared_ptr<Token> localName = this->expect(std::string("Identifier"));
        spec->value = localName->value;
      } else {
        spec->value = importedName->value;
      }
      specifiers.push_back( spec  );
      if ( this->matchValue(std::string(",")) ) {
        this->advance();
      }
    }
    this->expectValue(std::string("}"));
    node->children = specifiers;
  }
  if ( v == std::string("*") ) {
    this->advance();
    this->expectValue(std::string("as"));
    std::shared_ptr<Token> namespaceName = this->expect(std::string("Identifier"));
    std::shared_ptr<TSNode> nsSpec =  std::make_shared<TSNode>();
    nsSpec->nodeType = std::string("ImportNamespaceSpecifier");
    nsSpec->name = namespaceName->value;
    node->children.push_back( nsSpec  );
  }
  if ( this->matchType(std::string("Identifier")) ) {
    std::shared_ptr<TSNode> defaultSpec =  std::make_shared<TSNode>();
    defaultSpec->nodeType = std::string("ImportDefaultSpecifier");
    std::shared_ptr<Token> defaultName = this->expect(std::string("Identifier"));
    defaultSpec->name = defaultName->value;
    node->children.push_back( defaultSpec  );
    if ( this->matchValue(std::string(",")) ) {
      this->advance();
      if ( this->matchValue(std::string("{")) ) {
        this->advance();
        while ((this->matchValue(std::string("}")) == false) && (this->isAtEnd() == false)) {
          std::shared_ptr<TSNode> spec_1 =  std::make_shared<TSNode>();
          spec_1->nodeType = std::string("ImportSpecifier");
          std::shared_ptr<Token> importedName_1 = this->expect(std::string("Identifier"));
          spec_1->name = importedName_1->value;
          if ( this->matchValue(std::string("as")) ) {
            this->advance();
            std::shared_ptr<Token> localName_1 = this->expect(std::string("Identifier"));
            spec_1->value = localName_1->value;
          } else {
            spec_1->value = importedName_1->value;
          }
          node->children.push_back( spec_1  );
          if ( this->matchValue(std::string(",")) ) {
            this->advance();
          }
        }
        this->expectValue(std::string("}"));
      }
    }
  }
  if ( this->matchValue(std::string("from")) ) {
    this->advance();
    std::shared_ptr<Token> sourceStr = this->expect(std::string("String"));
    std::shared_ptr<TSNode> source =  std::make_shared<TSNode>();
    source->nodeType = std::string("StringLiteral");
    source->value = sourceStr->value;
    node->left  = source;
  }
  if ( this->matchValue(std::string(";")) ) {
    this->advance();
  }
  return node;
}
std::shared_ptr<TSNode>  TSParserSimple::parseExport() {
  std::shared_ptr<TSNode> node =  std::make_shared<TSNode>();
  node->nodeType = std::string("ExportNamedDeclaration");
  std::shared_ptr<Token> startTok = this->peek();
  node->start = startTok->start;
  node->line = startTok->line;
  node->col = startTok->col;
  this->expectValue(std::string("export"));
  if ( this->matchValue(std::string("type")) ) {
    std::string nextV = this->peekNextValue();
    if ( nextV == std::string("{") ) {
      this->advance();
      node->kind = std::string("type");
    }
  }
  std::string v = this->peekValue();
  if ( v == std::string("default") ) {
    node->nodeType = std::string("ExportDefaultDeclaration");
    this->advance();
    std::string nextVal = this->peekValue();
    if ( ((nextVal == std::string("class")) || (nextVal == std::string("function"))) || (nextVal == std::string("interface")) ) {
      std::shared_ptr<TSNode> decl = this->parseStatement();
      node->left  = decl;
    } else {
      std::shared_ptr<TSNode> expr = this->parseExpr();
      node->left  = expr;
    }
    if ( this->matchValue(std::string(";")) ) {
      this->advance();
    }
    return node;
  }
  if ( v == std::string("{") ) {
    this->advance();
    std::vector<std::shared_ptr<TSNode>> specifiers;
    while ((this->matchValue(std::string("}")) == false) && (this->isAtEnd() == false)) {
      std::shared_ptr<TSNode> spec =  std::make_shared<TSNode>();
      spec->nodeType = std::string("ExportSpecifier");
      std::shared_ptr<Token> localName = this->expect(std::string("Identifier"));
      spec->name = localName->value;
      if ( this->matchValue(std::string("as")) ) {
        this->advance();
        std::shared_ptr<Token> exportedName = this->expect(std::string("Identifier"));
        spec->value = exportedName->value;
      } else {
        spec->value = localName->value;
      }
      specifiers.push_back( spec  );
      if ( this->matchValue(std::string(",")) ) {
        this->advance();
      }
    }
    this->expectValue(std::string("}"));
    node->children = specifiers;
    if ( this->matchValue(std::string("from")) ) {
      this->advance();
      std::shared_ptr<Token> sourceStr = this->expect(std::string("String"));
      std::shared_ptr<TSNode> source =  std::make_shared<TSNode>();
      source->nodeType = std::string("StringLiteral");
      source->value = sourceStr->value;
      node->left  = source;
    }
    if ( this->matchValue(std::string(";")) ) {
      this->advance();
    }
    return node;
  }
  if ( v == std::string("*") ) {
    node->nodeType = std::string("ExportAllDeclaration");
    this->advance();
    if ( this->matchValue(std::string("as")) ) {
      this->advance();
      std::shared_ptr<Token> exportName = this->expect(std::string("Identifier"));
      node->name = exportName->value;
    }
    this->expectValue(std::string("from"));
    std::shared_ptr<Token> sourceStr_1 = this->expect(std::string("String"));
    std::shared_ptr<TSNode> source_1 =  std::make_shared<TSNode>();
    source_1->nodeType = std::string("StringLiteral");
    source_1->value = sourceStr_1->value;
    node->left  = source_1;
    if ( this->matchValue(std::string(";")) ) {
      this->advance();
    }
    return node;
  }
  if ( (((((((v == std::string("function")) || (v == std::string("class"))) || (v == std::string("interface"))) || (v == std::string("type"))) || (v == std::string("const"))) || (v == std::string("let"))) || (v == std::string("enum"))) || (v == std::string("abstract")) ) {
    std::shared_ptr<TSNode> decl_1 = this->parseStatement();
    node->left  = decl_1;
    return node;
  }
  if ( v == std::string("async") ) {
    std::shared_ptr<TSNode> decl_2 = this->parseStatement();
    node->left  = decl_2;
    return node;
  }
  return node;
}
std::shared_ptr<TSNode>  TSParserSimple::parseInterface() {
  std::shared_ptr<TSNode> node =  std::make_shared<TSNode>();
  node->nodeType = std::string("TSInterfaceDeclaration");
  std::shared_ptr<Token> startTok = this->peek();
  node->start = startTok->start;
  node->line = startTok->line;
  node->col = startTok->col;
  this->expectValue(std::string("interface"));
  std::shared_ptr<Token> nameTok = this->expect(std::string("Identifier"));
  node->name = nameTok->value;
  if ( this->matchValue(std::string("<")) ) {
    std::vector<std::shared_ptr<TSNode>> typeParams = this->parseTypeParams();
    node->params = typeParams;
  }
  if ( this->matchValue(std::string("extends")) ) {
    this->advance();
    std::vector<std::shared_ptr<TSNode>> extendsList;
    std::shared_ptr<TSNode> extendsType = this->parseType();
    extendsList.push_back( extendsType  );
    while (this->matchValue(std::string(","))) {
      this->advance();
      std::shared_ptr<TSNode> nextType = this->parseType();
      extendsList.push_back( nextType  );
    }
    for ( int ext_1 = 0; ext_1 != (int)(extendsList.size()); ext_1++) {
      std::shared_ptr<TSNode> ext = extendsList.at(ext_1);
      std::shared_ptr<TSNode> wrapper =  std::make_shared<TSNode>();
      wrapper->nodeType = std::string("TSExpressionWithTypeArguments");
      wrapper->left  = ext_1;
      node->children.push_back( wrapper  );
    }
  }
  std::shared_ptr<TSNode> body = this->parseInterfaceBody();
  node->body  = body;
  return node;
}
std::shared_ptr<TSNode>  TSParserSimple::parseInterfaceBody() {
  std::shared_ptr<TSNode> body =  std::make_shared<TSNode>();
  body->nodeType = std::string("TSInterfaceBody");
  std::shared_ptr<Token> startTok = this->peek();
  body->start = startTok->start;
  body->line = startTok->line;
  body->col = startTok->col;
  this->expectValue(std::string("{"));
  while ((this->matchValue(std::string("}")) == false) && (this->isAtEnd() == false)) {
    std::shared_ptr<TSNode> prop = this->parsePropertySig();
    body->children.push_back( prop  );
    if ( this->matchValue(std::string(";")) || this->matchValue(std::string(",")) ) {
      this->advance();
    }
  }
  this->expectValue(std::string("}"));
  return body;
}
std::vector<std::shared_ptr<TSNode>>  TSParserSimple::parseTypeParams() {
  std::vector<std::shared_ptr<TSNode>> params;
  this->expectValue(std::string("<"));
  while ((this->matchValue(std::string(">")) == false) && (this->isAtEnd() == false)) {
    if ( ((int)(params.size())) > 0 ) {
      this->expectValue(std::string(","));
    }
    std::shared_ptr<TSNode> param =  std::make_shared<TSNode>();
    param->nodeType = std::string("TSTypeParameter");
    std::shared_ptr<Token> nameTok = this->expect(std::string("Identifier"));
    param->name = nameTok->value;
    param->start = nameTok->start;
    param->line = nameTok->line;
    param->col = nameTok->col;
    if ( this->matchValue(std::string("extends")) ) {
      this->advance();
      std::shared_ptr<TSNode> constraint = this->parseType();
      param->typeAnnotation  = constraint;
    }
    if ( this->matchValue(std::string("=")) ) {
      this->advance();
      std::shared_ptr<TSNode> defaultType = this->parseType();
      param->init  = defaultType;
    }
    params.push_back( param  );
  }
  this->expectValue(std::string(">"));
  return params;
}
std::shared_ptr<TSNode>  TSParserSimple::parsePropertySig() {
  std::shared_ptr<TSNode> prop =  std::make_shared<TSNode>();
  prop->nodeType = std::string("TSPropertySignature");
  std::shared_ptr<Token> startTok = this->peek();
  prop->start = startTok->start;
  prop->line = startTok->line;
  prop->col = startTok->col;
  if ( this->matchValue(std::string("readonly")) ) {
    prop->readonly = true;
    this->advance();
  }
  std::shared_ptr<Token> nameTok = this->expect(std::string("Identifier"));
  prop->name = nameTok->value;
  if ( this->matchValue(std::string("?")) ) {
    prop->optional = true;
    this->advance();
  }
  if ( this->matchValue(std::string(":")) ) {
    std::shared_ptr<TSNode> typeAnnot = this->parseTypeAnnotation();
    prop->typeAnnotation  = typeAnnot;
  }
  return prop;
}
std::shared_ptr<TSNode>  TSParserSimple::parseTypeAlias() {
  std::shared_ptr<TSNode> node =  std::make_shared<TSNode>();
  node->nodeType = std::string("TSTypeAliasDeclaration");
  std::shared_ptr<Token> startTok = this->peek();
  node->start = startTok->start;
  node->line = startTok->line;
  node->col = startTok->col;
  this->expectValue(std::string("type"));
  std::shared_ptr<Token> nameTok = this->expect(std::string("Identifier"));
  node->name = nameTok->value;
  if ( this->matchValue(std::string("<")) ) {
    std::vector<std::shared_ptr<TSNode>> typeParams = this->parseTypeParams();
    node->params = typeParams;
  }
  this->expectValue(std::string("="));
  std::shared_ptr<TSNode> typeExpr = this->parseType();
  node->typeAnnotation  = typeExpr;
  if ( this->matchValue(std::string(";")) ) {
    this->advance();
  }
  return node;
}
std::shared_ptr<TSNode>  TSParserSimple::parseDecorator() {
  std::shared_ptr<TSNode> node =  std::make_shared<TSNode>();
  node->nodeType = std::string("Decorator");
  std::shared_ptr<Token> startTok = this->peek();
  node->start = startTok->start;
  node->line = startTok->line;
  node->col = startTok->col;
  this->expectValue(std::string("@"));
  std::shared_ptr<TSNode> expr = this->parsePostfix();
  node->left  = expr;
  return node;
}
std::shared_ptr<TSNode>  TSParserSimple::parseClass() {
  std::shared_ptr<TSNode> node =  std::make_shared<TSNode>();
  node->nodeType = std::string("ClassDeclaration");
  std::shared_ptr<Token> startTok = this->peek();
  node->start = startTok->start;
  node->line = startTok->line;
  node->col = startTok->col;
  if ( this->matchValue(std::string("abstract")) ) {
    node->kind = std::string("abstract");
    this->advance();
  }
  this->expectValue(std::string("class"));
  std::shared_ptr<Token> nameTok = this->expect(std::string("Identifier"));
  node->name = nameTok->value;
  if ( this->matchValue(std::string("<")) ) {
    std::vector<std::shared_ptr<TSNode>> typeParams = this->parseTypeParams();
    node->params = typeParams;
  }
  if ( this->matchValue(std::string("extends")) ) {
    this->advance();
    std::shared_ptr<TSNode> superClass = this->parseType();
    std::shared_ptr<TSNode> extendsNode =  std::make_shared<TSNode>();
    extendsNode->nodeType = std::string("TSExpressionWithTypeArguments");
    extendsNode->left  = superClass;
    node->left  = extendsNode;
  }
  if ( this->matchValue(std::string("implements")) ) {
    this->advance();
    std::shared_ptr<TSNode> impl = this->parseType();
    std::shared_ptr<TSNode> implNode =  std::make_shared<TSNode>();
    implNode->nodeType = std::string("TSExpressionWithTypeArguments");
    implNode->left  = impl;
    node->children.push_back( implNode  );
    while (this->matchValue(std::string(","))) {
      this->advance();
      std::shared_ptr<TSNode> nextImpl = this->parseType();
      std::shared_ptr<TSNode> nextImplNode =  std::make_shared<TSNode>();
      nextImplNode->nodeType = std::string("TSExpressionWithTypeArguments");
      nextImplNode->left  = nextImpl;
      node->children.push_back( nextImplNode  );
    }
  }
  std::shared_ptr<TSNode> body = this->parseClassBody();
  node->body  = body;
  return node;
}
std::shared_ptr<TSNode>  TSParserSimple::parseClassBody() {
  std::shared_ptr<TSNode> body =  std::make_shared<TSNode>();
  body->nodeType = std::string("ClassBody");
  std::shared_ptr<Token> startTok = this->peek();
  body->start = startTok->start;
  body->line = startTok->line;
  body->col = startTok->col;
  this->expectValue(std::string("{"));
  while ((this->matchValue(std::string("}")) == false) && (this->isAtEnd() == false)) {
    std::shared_ptr<TSNode> member = this->parseClassMember();
    body->children.push_back( member  );
    if ( this->matchValue(std::string(";")) ) {
      this->advance();
    }
  }
  this->expectValue(std::string("}"));
  return body;
}
std::shared_ptr<TSNode>  TSParserSimple::parseClassMember() {
  std::shared_ptr<TSNode> member =  std::make_shared<TSNode>();
  std::shared_ptr<Token> startTok = this->peek();
  member->start = startTok->start;
  member->line = startTok->line;
  member->col = startTok->col;
  std::vector<std::shared_ptr<TSNode>> decorators;
  while (this->matchValue(std::string("@"))) {
    std::shared_ptr<TSNode> dec = this->parseDecorator();
    decorators.push_back( dec  );
  }
  if ( ((int)(decorators.size())) > 0 ) {
    member->decorators = decorators;
  }
  bool isStatic = false;
  bool isAbstract = false;
  bool isReadonly = false;
  std::string accessibility = std::string("");
  bool keepParsing = true;
  while (keepParsing) {
    std::string tokVal = this->peekValue();
    if ( tokVal == std::string("public") ) {
      accessibility = std::string("public");
      this->advance();
    }
    if ( tokVal == std::string("private") ) {
      accessibility = std::string("private");
      this->advance();
    }
    if ( tokVal == std::string("protected") ) {
      accessibility = std::string("protected");
      this->advance();
    }
    if ( tokVal == std::string("static") ) {
      isStatic = true;
      this->advance();
    }
    if ( tokVal == std::string("abstract") ) {
      isAbstract = true;
      this->advance();
    }
    if ( tokVal == std::string("readonly") ) {
      isReadonly = true;
      this->advance();
    }
    std::string newTokVal = this->peekValue();
    if ( (((((newTokVal != std::string("public")) && (newTokVal != std::string("private"))) && (newTokVal != std::string("protected"))) && (newTokVal != std::string("static"))) && (newTokVal != std::string("abstract"))) && (newTokVal != std::string("readonly")) ) {
      keepParsing = false;
    }
  }
  if ( this->matchValue(std::string("constructor")) ) {
    member->nodeType = std::string("MethodDefinition");
    member->kind = std::string("constructor");
    this->advance();
    this->expectValue(std::string("("));
    while ((this->matchValue(std::string(")")) == false) && (this->isAtEnd() == false)) {
      if ( ((int)(member->params.size())) > 0 ) {
        this->expectValue(std::string(","));
      }
      std::shared_ptr<TSNode> param = this->parseConstructorParam();
      member->params.push_back( param  );
    }
    this->expectValue(std::string(")"));
    if ( this->matchValue(std::string("{")) ) {
      std::shared_ptr<TSNode> bodyNode = this->parseBlock();
      member->body  = bodyNode;
    }
    return member;
  }
  std::shared_ptr<Token> nameTok = this->expect(std::string("Identifier"));
  member->name = nameTok->value;
  if ( accessibility != std::string("") ) {
    member->kind = accessibility;
  }
  member->readonly = isReadonly;
  if ( this->matchValue(std::string("?")) ) {
    member->optional = true;
    this->advance();
  }
  if ( this->matchValue(std::string("(")) ) {
    member->nodeType = std::string("MethodDefinition");
    if ( isStatic ) {
      member->kind = std::string("static");
    }
    if ( isAbstract ) {
      member->kind = std::string("abstract");
    }
    this->expectValue(std::string("("));
    while ((this->matchValue(std::string(")")) == false) && (this->isAtEnd() == false)) {
      if ( ((int)(member->params.size())) > 0 ) {
        this->expectValue(std::string(","));
      }
      std::shared_ptr<TSNode> param_1 = this->parseParam();
      member->params.push_back( param_1  );
    }
    this->expectValue(std::string(")"));
    if ( this->matchValue(std::string(":")) ) {
      std::shared_ptr<TSNode> returnType = this->parseTypeAnnotation();
      member->typeAnnotation  = returnType;
    }
    if ( this->matchValue(std::string("{")) ) {
      std::shared_ptr<TSNode> bodyNode_1 = this->parseBlock();
      member->body  = bodyNode_1;
    }
  } else {
    member->nodeType = std::string("PropertyDefinition");
    if ( isStatic ) {
      member->kind = std::string("static");
    }
    if ( this->matchValue(std::string(":")) ) {
      std::shared_ptr<TSNode> typeAnnot = this->parseTypeAnnotation();
      member->typeAnnotation  = typeAnnot;
    }
    if ( this->matchValue(std::string("=")) ) {
      this->advance();
      std::shared_ptr<TSNode> initExpr = this->parseExpr();
      member->init  = initExpr;
    }
  }
  return member;
}
std::shared_ptr<TSNode>  TSParserSimple::parseConstructorParam() {
  std::shared_ptr<TSNode> param =  std::make_shared<TSNode>();
  param->nodeType = std::string("Parameter");
  std::shared_ptr<Token> startTok = this->peek();
  param->start = startTok->start;
  param->line = startTok->line;
  param->col = startTok->col;
  std::string tokVal = this->peekValue();
  if ( (((tokVal == std::string("public")) || (tokVal == std::string("private"))) || (tokVal == std::string("protected"))) || (tokVal == std::string("readonly")) ) {
    param->kind = tokVal;
    this->advance();
    std::string nextVal = this->peekValue();
    if ( nextVal == std::string("readonly") ) {
      param->readonly = true;
      this->advance();
    }
  }
  std::shared_ptr<Token> nameTok = this->expect(std::string("Identifier"));
  param->name = nameTok->value;
  if ( this->matchValue(std::string("?")) ) {
    param->optional = true;
    this->advance();
  }
  if ( this->matchValue(std::string(":")) ) {
    std::shared_ptr<TSNode> typeAnnot = this->parseTypeAnnotation();
    param->typeAnnotation  = typeAnnot;
  }
  if ( this->matchValue(std::string("=")) ) {
    this->advance();
    std::shared_ptr<TSNode> defaultVal = this->parseExpr();
    param->init  = defaultVal;
  }
  return param;
}
std::shared_ptr<TSNode>  TSParserSimple::parseEnum() {
  std::shared_ptr<TSNode> node =  std::make_shared<TSNode>();
  node->nodeType = std::string("TSEnumDeclaration");
  std::shared_ptr<Token> startTok = this->peek();
  node->start = startTok->start;
  node->line = startTok->line;
  node->col = startTok->col;
  if ( this->matchValue(std::string("const")) ) {
    node->kind = std::string("const");
    this->advance();
  }
  this->expectValue(std::string("enum"));
  std::shared_ptr<Token> nameTok = this->expect(std::string("Identifier"));
  node->name = nameTok->value;
  this->expectValue(std::string("{"));
  while ((this->matchValue(std::string("}")) == false) && (this->isAtEnd() == false)) {
    std::shared_ptr<TSNode> member =  std::make_shared<TSNode>();
    member->nodeType = std::string("TSEnumMember");
    std::shared_ptr<Token> memberTok = this->expect(std::string("Identifier"));
    member->name = memberTok->value;
    member->start = memberTok->start;
    member->line = memberTok->line;
    member->col = memberTok->col;
    if ( this->matchValue(std::string("=")) ) {
      this->advance();
      std::shared_ptr<TSNode> initVal = this->parseExpr();
      member->init  = initVal;
    }
    node->children.push_back( member  );
    if ( this->matchValue(std::string(",")) ) {
      this->advance();
    }
  }
  this->expectValue(std::string("}"));
  return node;
}
std::shared_ptr<TSNode>  TSParserSimple::parseNamespace() {
  std::shared_ptr<TSNode> node =  std::make_shared<TSNode>();
  node->nodeType = std::string("TSModuleDeclaration");
  std::shared_ptr<Token> startTok = this->peek();
  node->start = startTok->start;
  node->line = startTok->line;
  node->col = startTok->col;
  this->expectValue(std::string("namespace"));
  std::shared_ptr<Token> nameTok = this->expect(std::string("Identifier"));
  node->name = nameTok->value;
  this->expectValue(std::string("{"));
  std::shared_ptr<TSNode> body =  std::make_shared<TSNode>();
  body->nodeType = std::string("TSModuleBlock");
  while ((this->matchValue(std::string("}")) == false) && (this->isAtEnd() == false)) {
    std::shared_ptr<TSNode> stmt = this->parseStatement();
    body->children.push_back( stmt  );
  }
  this->expectValue(std::string("}"));
  node->body  = body;
  return node;
}
std::shared_ptr<TSNode>  TSParserSimple::parseDeclare() {
  std::shared_ptr<Token> startTok = this->peek();
  this->expectValue(std::string("declare"));
  std::string nextVal = this->peekValue();
  if ( nextVal == std::string("module") ) {
    std::shared_ptr<TSNode> node =  std::make_shared<TSNode>();
    node->nodeType = std::string("TSModuleDeclaration");
    node->start = startTok->start;
    node->line = startTok->line;
    node->col = startTok->col;
    node->kind = std::string("declare");
    this->advance();
    std::shared_ptr<Token> nameTok = this->peek();
    if ( this->matchType(std::string("String")) ) {
      this->advance();
      node->name = nameTok->value;
    } else {
      this->advance();
      node->name = nameTok->value;
    }
    this->expectValue(std::string("{"));
    std::shared_ptr<TSNode> body =  std::make_shared<TSNode>();
    body->nodeType = std::string("TSModuleBlock");
    while ((this->matchValue(std::string("}")) == false) && (this->isAtEnd() == false)) {
      std::shared_ptr<TSNode> stmt = this->parseStatement();
      body->children.push_back( stmt  );
    }
    this->expectValue(std::string("}"));
    node->body  = body;
    return node;
  }
  std::shared_ptr<TSNode> node_1 = this->parseStatement();
  node_1->kind = std::string("declare");
  return node_1;
}
std::shared_ptr<TSNode>  TSParserSimple::parseIfStatement() {
  std::shared_ptr<TSNode> node =  std::make_shared<TSNode>();
  node->nodeType = std::string("IfStatement");
  std::shared_ptr<Token> startTok = this->peek();
  node->start = startTok->start;
  node->line = startTok->line;
  node->col = startTok->col;
  this->expectValue(std::string("if"));
  this->expectValue(std::string("("));
  std::shared_ptr<TSNode> test = this->parseExpr();
  node->left  = test;
  this->expectValue(std::string(")"));
  std::shared_ptr<TSNode> consequent = this->parseStatement();
  node->body  = consequent;
  if ( this->matchValue(std::string("else")) ) {
    this->advance();
    std::shared_ptr<TSNode> alternate = this->parseStatement();
    node->right  = alternate;
  }
  return node;
}
std::shared_ptr<TSNode>  TSParserSimple::parseWhileStatement() {
  std::shared_ptr<TSNode> node =  std::make_shared<TSNode>();
  node->nodeType = std::string("WhileStatement");
  std::shared_ptr<Token> startTok = this->peek();
  node->start = startTok->start;
  node->line = startTok->line;
  node->col = startTok->col;
  this->expectValue(std::string("while"));
  this->expectValue(std::string("("));
  std::shared_ptr<TSNode> test = this->parseExpr();
  node->left  = test;
  this->expectValue(std::string(")"));
  std::shared_ptr<TSNode> body = this->parseStatement();
  node->body  = body;
  return node;
}
std::shared_ptr<TSNode>  TSParserSimple::parseDoWhileStatement() {
  std::shared_ptr<TSNode> node =  std::make_shared<TSNode>();
  node->nodeType = std::string("DoWhileStatement");
  std::shared_ptr<Token> startTok = this->peek();
  node->start = startTok->start;
  node->line = startTok->line;
  node->col = startTok->col;
  this->expectValue(std::string("do"));
  std::shared_ptr<TSNode> body = this->parseStatement();
  node->body  = body;
  this->expectValue(std::string("while"));
  this->expectValue(std::string("("));
  std::shared_ptr<TSNode> test = this->parseExpr();
  node->left  = test;
  this->expectValue(std::string(")"));
  if ( this->matchValue(std::string(";")) ) {
    this->advance();
  }
  return node;
}
std::shared_ptr<TSNode>  TSParserSimple::parseThrow() {
  std::shared_ptr<TSNode> node =  std::make_shared<TSNode>();
  node->nodeType = std::string("ThrowStatement");
  std::shared_ptr<Token> startTok = this->peek();
  node->start = startTok->start;
  node->line = startTok->line;
  node->col = startTok->col;
  this->expectValue(std::string("throw"));
  std::shared_ptr<TSNode> arg = this->parseExpr();
  node->left  = arg;
  if ( this->matchValue(std::string(";")) ) {
    this->advance();
  }
  return node;
}
std::shared_ptr<TSNode>  TSParserSimple::parseForStatement() {
  std::shared_ptr<TSNode> node =  std::make_shared<TSNode>();
  std::shared_ptr<Token> startTok = this->peek();
  node->start = startTok->start;
  node->line = startTok->line;
  node->col = startTok->col;
  this->expectValue(std::string("for"));
  this->expectValue(std::string("("));
  std::string tokVal = this->peekValue();
  if ( ((tokVal == std::string("let")) || (tokVal == std::string("const"))) || (tokVal == std::string("var")) ) {
    std::string kind = tokVal;
    this->advance();
    std::shared_ptr<Token> varName = this->expect(std::string("Identifier"));
    std::string nextVal = this->peekValue();
    if ( nextVal == std::string("of") ) {
      node->nodeType = std::string("ForOfStatement");
      this->advance();
      std::shared_ptr<TSNode> left =  std::make_shared<TSNode>();
      left->nodeType = std::string("VariableDeclaration");
      left->kind = kind;
      std::shared_ptr<TSNode> declarator =  std::make_shared<TSNode>();
      declarator->nodeType = std::string("VariableDeclarator");
      declarator->name = varName->value;
      left->children.push_back( declarator  );
      node->left  = left;
      std::shared_ptr<TSNode> right = this->parseExpr();
      node->right  = right;
      this->expectValue(std::string(")"));
      std::shared_ptr<TSNode> body = this->parseStatement();
      node->body  = body;
      return node;
    }
    if ( nextVal == std::string("in") ) {
      node->nodeType = std::string("ForInStatement");
      this->advance();
      std::shared_ptr<TSNode> left_1 =  std::make_shared<TSNode>();
      left_1->nodeType = std::string("VariableDeclaration");
      left_1->kind = kind;
      std::shared_ptr<TSNode> declarator_1 =  std::make_shared<TSNode>();
      declarator_1->nodeType = std::string("VariableDeclarator");
      declarator_1->name = varName->value;
      left_1->children.push_back( declarator_1  );
      node->left  = left_1;
      std::shared_ptr<TSNode> right_1 = this->parseExpr();
      node->right  = right_1;
      this->expectValue(std::string(")"));
      std::shared_ptr<TSNode> body_1 = this->parseStatement();
      node->body  = body_1;
      return node;
    }
    node->nodeType = std::string("ForStatement");
    std::shared_ptr<TSNode> initDecl =  std::make_shared<TSNode>();
    initDecl->nodeType = std::string("VariableDeclaration");
    initDecl->kind = kind;
    std::shared_ptr<TSNode> declarator_2 =  std::make_shared<TSNode>();
    declarator_2->nodeType = std::string("VariableDeclarator");
    declarator_2->name = varName->value;
    if ( this->matchValue(std::string(":")) ) {
      std::shared_ptr<TSNode> typeAnnot = this->parseTypeAnnotation();
      declarator_2->typeAnnotation  = typeAnnot;
    }
    if ( this->matchValue(std::string("=")) ) {
      this->advance();
      std::shared_ptr<TSNode> initVal = this->parseExpr();
      declarator_2->init  = initVal;
    }
    initDecl->children.push_back( declarator_2  );
    node->init  = initDecl;
  } else {
    node->nodeType = std::string("ForStatement");
    if ( this->matchValue(std::string(";")) == false ) {
      std::shared_ptr<TSNode> initExpr = this->parseExpr();
      node->init  = initExpr;
    }
  }
  this->expectValue(std::string(";"));
  if ( this->matchValue(std::string(";")) == false ) {
    std::shared_ptr<TSNode> test = this->parseExpr();
    node->left  = test;
  }
  this->expectValue(std::string(";"));
  if ( this->matchValue(std::string(")")) == false ) {
    std::shared_ptr<TSNode> update = this->parseExpr();
    node->right  = update;
  }
  this->expectValue(std::string(")"));
  std::shared_ptr<TSNode> body_2 = this->parseStatement();
  node->body  = body_2;
  return node;
}
std::shared_ptr<TSNode>  TSParserSimple::parseSwitchStatement() {
  std::shared_ptr<TSNode> node =  std::make_shared<TSNode>();
  node->nodeType = std::string("SwitchStatement");
  std::shared_ptr<Token> startTok = this->peek();
  node->start = startTok->start;
  node->line = startTok->line;
  node->col = startTok->col;
  this->expectValue(std::string("switch"));
  this->expectValue(std::string("("));
  std::shared_ptr<TSNode> discriminant = this->parseExpr();
  node->left  = discriminant;
  this->expectValue(std::string(")"));
  this->expectValue(std::string("{"));
  while ((this->matchValue(std::string("}")) == false) && (this->isAtEnd() == false)) {
    std::shared_ptr<TSNode> caseNode =  std::make_shared<TSNode>();
    if ( this->matchValue(std::string("case")) ) {
      caseNode->nodeType = std::string("SwitchCase");
      this->advance();
      std::shared_ptr<TSNode> test = this->parseExpr();
      caseNode->left  = test;
      this->expectValue(std::string(":"));
    }
    if ( this->matchValue(std::string("default")) ) {
      caseNode->nodeType = std::string("SwitchCase");
      caseNode->kind = std::string("default");
      this->advance();
      this->expectValue(std::string(":"));
    }
    while ((((this->matchValue(std::string("case")) == false) && (this->matchValue(std::string("default")) == false)) && (this->matchValue(std::string("}")) == false)) && (this->isAtEnd() == false)) {
      if ( this->matchValue(std::string("break")) ) {
        std::shared_ptr<TSNode> breakNode =  std::make_shared<TSNode>();
        breakNode->nodeType = std::string("BreakStatement");
        this->advance();
        if ( this->matchValue(std::string(";")) ) {
          this->advance();
        }
        caseNode->children.push_back( breakNode  );
      } else {
        std::shared_ptr<TSNode> stmt = this->parseStatement();
        caseNode->children.push_back( stmt  );
      }
    }
    node->children.push_back( caseNode  );
  }
  this->expectValue(std::string("}"));
  return node;
}
std::shared_ptr<TSNode>  TSParserSimple::parseTryStatement() {
  std::shared_ptr<TSNode> node =  std::make_shared<TSNode>();
  node->nodeType = std::string("TryStatement");
  std::shared_ptr<Token> startTok = this->peek();
  node->start = startTok->start;
  node->line = startTok->line;
  node->col = startTok->col;
  this->expectValue(std::string("try"));
  std::shared_ptr<TSNode> tryBlock = this->parseBlock();
  node->body  = tryBlock;
  if ( this->matchValue(std::string("catch")) ) {
    std::shared_ptr<TSNode> catchNode =  std::make_shared<TSNode>();
    catchNode->nodeType = std::string("CatchClause");
    this->advance();
    if ( this->matchValue(std::string("(")) ) {
      this->advance();
      std::shared_ptr<Token> param = this->expect(std::string("Identifier"));
      catchNode->name = param->value;
      if ( this->matchValue(std::string(":")) ) {
        std::shared_ptr<TSNode> typeAnnot = this->parseTypeAnnotation();
        catchNode->typeAnnotation  = typeAnnot;
      }
      this->expectValue(std::string(")"));
    }
    std::shared_ptr<TSNode> catchBlock = this->parseBlock();
    catchNode->body  = catchBlock;
    node->left  = catchNode;
  }
  if ( this->matchValue(std::string("finally")) ) {
    this->advance();
    std::shared_ptr<TSNode> finallyBlock = this->parseBlock();
    node->right  = finallyBlock;
  }
  return node;
}
std::shared_ptr<TSNode>  TSParserSimple::parseVarDecl() {
  std::shared_ptr<TSNode> node =  std::make_shared<TSNode>();
  node->nodeType = std::string("VariableDeclaration");
  std::shared_ptr<Token> startTok = this->peek();
  node->start = startTok->start;
  node->line = startTok->line;
  node->col = startTok->col;
  node->kind = startTok->value;
  this->advance();
  std::shared_ptr<TSNode> declarator =  std::make_shared<TSNode>();
  declarator->nodeType = std::string("VariableDeclarator");
  std::shared_ptr<Token> nameTok = this->expect(std::string("Identifier"));
  declarator->name = nameTok->value;
  declarator->start = nameTok->start;
  declarator->line = nameTok->line;
  declarator->col = nameTok->col;
  if ( this->matchValue(std::string(":")) ) {
    std::shared_ptr<TSNode> typeAnnot = this->parseTypeAnnotation();
    declarator->typeAnnotation  = typeAnnot;
  }
  if ( this->matchValue(std::string("=")) ) {
    this->advance();
    std::shared_ptr<TSNode> initExpr = this->parseExpr();
    declarator->init  = initExpr;
  }
  node->children.push_back( declarator  );
  if ( this->matchValue(std::string(";")) ) {
    this->advance();
  }
  return node;
}
std::shared_ptr<TSNode>  TSParserSimple::parseFuncDecl() {
  std::shared_ptr<TSNode> node =  std::make_shared<TSNode>();
  node->nodeType = std::string("FunctionDeclaration");
  std::shared_ptr<Token> startTok = this->peek();
  node->start = startTok->start;
  node->line = startTok->line;
  node->col = startTok->col;
  this->expectValue(std::string("function"));
  std::shared_ptr<Token> nameTok = this->expect(std::string("Identifier"));
  node->name = nameTok->value;
  if ( this->matchValue(std::string("<")) ) {
    std::vector<std::shared_ptr<TSNode>> typeParams = this->parseTypeParams();
    for ( int i = 0; i != (int)(typeParams.size()); i++) {
      std::shared_ptr<TSNode> tp = typeParams.at(i);
      node->children.push_back( tp  );
    }
  }
  this->expectValue(std::string("("));
  while ((this->matchValue(std::string(")")) == false) && (this->isAtEnd() == false)) {
    if ( ((int)(node->params.size())) > 0 ) {
      this->expectValue(std::string(","));
    }
    std::shared_ptr<TSNode> param = this->parseParam();
    node->params.push_back( param  );
  }
  this->expectValue(std::string(")"));
  if ( this->matchValue(std::string(":")) ) {
    std::shared_ptr<TSNode> returnType = this->parseTypeAnnotation();
    node->typeAnnotation  = returnType;
  }
  std::shared_ptr<TSNode> body = this->parseBlock();
  node->body  = body;
  return node;
}
std::shared_ptr<TSNode>  TSParserSimple::parseParam() {
  std::shared_ptr<TSNode> param =  std::make_shared<TSNode>();
  param->nodeType = std::string("Parameter");
  while (this->matchValue(std::string("@"))) {
    std::shared_ptr<TSNode> dec = this->parseDecorator();
    param->decorators.push_back( dec  );
  }
  if ( this->matchValue(std::string("...")) ) {
    this->advance();
    param->nodeType = std::string("RestElement");
    param->kind = std::string("rest");
  }
  std::shared_ptr<Token> nameTok = this->expect(std::string("Identifier"));
  param->name = nameTok->value;
  param->start = nameTok->start;
  param->line = nameTok->line;
  param->col = nameTok->col;
  if ( this->matchValue(std::string("?")) ) {
    param->optional = true;
    this->advance();
  }
  if ( this->matchValue(std::string(":")) ) {
    std::shared_ptr<TSNode> typeAnnot = this->parseTypeAnnotation();
    param->typeAnnotation  = typeAnnot;
  }
  return param;
}
std::shared_ptr<TSNode>  TSParserSimple::parseBlock() {
  std::shared_ptr<TSNode> block =  std::make_shared<TSNode>();
  block->nodeType = std::string("BlockStatement");
  std::shared_ptr<Token> startTok = this->peek();
  block->start = startTok->start;
  block->line = startTok->line;
  block->col = startTok->col;
  this->expectValue(std::string("{"));
  while ((this->matchValue(std::string("}")) == false) && (this->isAtEnd() == false)) {
    std::shared_ptr<TSNode> stmt = this->parseStatement();
    block->children.push_back( stmt  );
  }
  this->expectValue(std::string("}"));
  return block;
}
std::shared_ptr<TSNode>  TSParserSimple::parseExprStmt() {
  std::shared_ptr<TSNode> stmt =  std::make_shared<TSNode>();
  stmt->nodeType = std::string("ExpressionStatement");
  std::shared_ptr<Token> startTok = this->peek();
  stmt->start = startTok->start;
  stmt->line = startTok->line;
  stmt->col = startTok->col;
  std::shared_ptr<TSNode> expr = this->parseExpr();
  stmt->left  = expr;
  if ( this->matchValue(std::string(";")) ) {
    this->advance();
  }
  return stmt;
}
std::shared_ptr<TSNode>  TSParserSimple::parseTypeAnnotation() {
  std::shared_ptr<TSNode> annot =  std::make_shared<TSNode>();
  annot->nodeType = std::string("TSTypeAnnotation");
  std::shared_ptr<Token> startTok = this->peek();
  annot->start = startTok->start;
  annot->line = startTok->line;
  annot->col = startTok->col;
  this->expectValue(std::string(":"));
  std::shared_ptr<TSNode> typeExpr = this->parseType();
  annot->typeAnnotation  = typeExpr;
  return annot;
}
std::shared_ptr<TSNode>  TSParserSimple::parseType() {
  return this->parseConditionalType();
}
std::shared_ptr<TSNode>  TSParserSimple::parseConditionalType() {
  std::shared_ptr<TSNode> checkType = this->parseUnionType();
  if ( this->matchValue(std::string("extends")) ) {
    this->advance();
    std::shared_ptr<TSNode> extendsType = this->parseUnionType();
    if ( this->matchValue(std::string("?")) ) {
      this->advance();
      std::shared_ptr<TSNode> conditional =  std::make_shared<TSNode>();
      conditional->nodeType = std::string("TSConditionalType");
      conditional->start = checkType->start;
      conditional->line = checkType->line;
      conditional->col = checkType->col;
      conditional->left  = checkType;
      conditional->params.push_back( extendsType  );
      conditional->body  = this->parseUnionType();
      this->expectValue(std::string(":"));
      conditional->right  = this->parseUnionType();
      return conditional;
    }
    return checkType;
  }
  return checkType;
}
std::shared_ptr<TSNode>  TSParserSimple::parseUnionType() {
  std::shared_ptr<TSNode> left = this->parseIntersectionType();
  if ( this->matchValue(std::string("|")) ) {
    std::shared_ptr<TSNode> _union =  std::make_shared<TSNode>();
    _union->nodeType = std::string("TSUnionType");
    _union->start = left->start;
    _union->line = left->line;
    _union->col = left->col;
    _union->children.push_back( left  );
    while (this->matchValue(std::string("|"))) {
      this->advance();
      std::shared_ptr<TSNode> right = this->parseIntersectionType();
      _union->children.push_back( right  );
    }
    return _union;
  }
  return left;
}
std::shared_ptr<TSNode>  TSParserSimple::parseIntersectionType() {
  std::shared_ptr<TSNode> left = this->parseArrayType();
  if ( this->matchValue(std::string("&")) ) {
    std::shared_ptr<TSNode> intersection =  std::make_shared<TSNode>();
    intersection->nodeType = std::string("TSIntersectionType");
    intersection->start = left->start;
    intersection->line = left->line;
    intersection->col = left->col;
    intersection->children.push_back( left  );
    while (this->matchValue(std::string("&"))) {
      this->advance();
      std::shared_ptr<TSNode> right = this->parseArrayType();
      intersection->children.push_back( right  );
    }
    return intersection;
  }
  return left;
}
std::shared_ptr<TSNode>  TSParserSimple::parseArrayType() {
  std::shared_ptr<TSNode> elemType = this->parsePrimaryType();
  while (this->matchValue(std::string("["))) {
    if ( this->checkNext(std::string("]")) ) {
      this->advance();
      this->advance();
      std::shared_ptr<TSNode> arrayType =  std::make_shared<TSNode>();
      arrayType->nodeType = std::string("TSArrayType");
      arrayType->start = elemType->start;
      arrayType->line = elemType->line;
      arrayType->col = elemType->col;
      arrayType->left  = elemType;
      elemType = arrayType;
    } else {
      this->advance();
      std::shared_ptr<TSNode> indexType = this->parseType();
      this->expectValue(std::string("]"));
      std::shared_ptr<TSNode> indexedAccess =  std::make_shared<TSNode>();
      indexedAccess->nodeType = std::string("TSIndexedAccessType");
      indexedAccess->start = elemType->start;
      indexedAccess->line = elemType->line;
      indexedAccess->col = elemType->col;
      indexedAccess->left  = elemType;
      indexedAccess->right  = indexType;
      elemType = indexedAccess;
    }
  }
  return elemType;
}
bool  TSParserSimple::checkNext( std::string value ) {
  int nextPos = this->pos + 1;
  if ( nextPos < ((int)(this->tokens.size())) ) {
    std::shared_ptr<Token> nextTok = this->tokens.at(nextPos);
    std::string v = nextTok->value;
    return v == value;
  }
  return false;
}
std::shared_ptr<TSNode>  TSParserSimple::parsePrimaryType() {
  std::string tokVal = this->peekValue();
  std::shared_ptr<Token> tok = this->peek();
  if ( tokVal == std::string("keyof") ) {
    this->advance();
    std::shared_ptr<TSNode> operand = this->parsePrimaryType();
    std::shared_ptr<TSNode> node =  std::make_shared<TSNode>();
    node->nodeType = std::string("TSTypeOperator");
    node->value = std::string("keyof");
    node->start = tok->start;
    node->line = tok->line;
    node->col = tok->col;
    node->typeAnnotation  = operand;
    return node;
  }
  if ( tokVal == std::string("typeof") ) {
    this->advance();
    std::shared_ptr<TSNode> operand_1 = this->parsePrimaryType();
    std::shared_ptr<TSNode> node_1 =  std::make_shared<TSNode>();
    node_1->nodeType = std::string("TSTypeQuery");
    node_1->value = std::string("typeof");
    node_1->start = tok->start;
    node_1->line = tok->line;
    node_1->col = tok->col;
    node_1->typeAnnotation  = operand_1;
    return node_1;
  }
  if ( tokVal == std::string("infer") ) {
    this->advance();
    std::shared_ptr<Token> paramTok = this->expect(std::string("Identifier"));
    std::shared_ptr<TSNode> node_2 =  std::make_shared<TSNode>();
    node_2->nodeType = std::string("TSInferType");
    node_2->start = tok->start;
    node_2->line = tok->line;
    node_2->col = tok->col;
    std::shared_ptr<TSNode> typeParam =  std::make_shared<TSNode>();
    typeParam->nodeType = std::string("TSTypeParameter");
    typeParam->name = paramTok->value;
    node_2->typeAnnotation  = typeParam;
    return node_2;
  }
  if ( tokVal == std::string("string") ) {
    this->advance();
    std::shared_ptr<TSNode> node_3 =  std::make_shared<TSNode>();
    node_3->nodeType = std::string("TSStringKeyword");
    node_3->start = tok->start;
    node_3->end = tok->end;
    node_3->line = tok->line;
    node_3->col = tok->col;
    return node_3;
  }
  if ( tokVal == std::string("number") ) {
    this->advance();
    std::shared_ptr<TSNode> node_4 =  std::make_shared<TSNode>();
    node_4->nodeType = std::string("TSNumberKeyword");
    node_4->start = tok->start;
    node_4->end = tok->end;
    node_4->line = tok->line;
    node_4->col = tok->col;
    return node_4;
  }
  if ( tokVal == std::string("boolean") ) {
    this->advance();
    std::shared_ptr<TSNode> node_5 =  std::make_shared<TSNode>();
    node_5->nodeType = std::string("TSBooleanKeyword");
    node_5->start = tok->start;
    node_5->end = tok->end;
    node_5->line = tok->line;
    node_5->col = tok->col;
    return node_5;
  }
  if ( tokVal == std::string("any") ) {
    this->advance();
    std::shared_ptr<TSNode> node_6 =  std::make_shared<TSNode>();
    node_6->nodeType = std::string("TSAnyKeyword");
    node_6->start = tok->start;
    node_6->end = tok->end;
    node_6->line = tok->line;
    node_6->col = tok->col;
    return node_6;
  }
  if ( tokVal == std::string("unknown") ) {
    this->advance();
    std::shared_ptr<TSNode> node_7 =  std::make_shared<TSNode>();
    node_7->nodeType = std::string("TSUnknownKeyword");
    node_7->start = tok->start;
    node_7->end = tok->end;
    node_7->line = tok->line;
    node_7->col = tok->col;
    return node_7;
  }
  if ( tokVal == std::string("void") ) {
    this->advance();
    std::shared_ptr<TSNode> node_8 =  std::make_shared<TSNode>();
    node_8->nodeType = std::string("TSVoidKeyword");
    node_8->start = tok->start;
    node_8->end = tok->end;
    node_8->line = tok->line;
    node_8->col = tok->col;
    return node_8;
  }
  if ( tokVal == std::string("null") ) {
    this->advance();
    std::shared_ptr<TSNode> node_9 =  std::make_shared<TSNode>();
    node_9->nodeType = std::string("TSNullKeyword");
    node_9->start = tok->start;
    node_9->end = tok->end;
    node_9->line = tok->line;
    node_9->col = tok->col;
    return node_9;
  }
  if ( tokVal == std::string("never") ) {
    this->advance();
    std::shared_ptr<TSNode> node_10 =  std::make_shared<TSNode>();
    node_10->nodeType = std::string("TSNeverKeyword");
    node_10->start = tok->start;
    node_10->end = tok->end;
    node_10->line = tok->line;
    node_10->col = tok->col;
    return node_10;
  }
  if ( tokVal == std::string("undefined") ) {
    this->advance();
    std::shared_ptr<TSNode> node_11 =  std::make_shared<TSNode>();
    node_11->nodeType = std::string("TSUndefinedKeyword");
    node_11->start = tok->start;
    node_11->end = tok->end;
    node_11->line = tok->line;
    node_11->col = tok->col;
    return node_11;
  }
  std::string tokType = this->peekType();
  if ( tokType == std::string("Identifier") ) {
    return this->parseTypeRef();
  }
  if ( tokType == std::string("String") ) {
    this->advance();
    std::shared_ptr<TSNode> node_12 =  std::make_shared<TSNode>();
    node_12->nodeType = std::string("TSLiteralType");
    node_12->start = tok->start;
    node_12->end = tok->end;
    node_12->line = tok->line;
    node_12->col = tok->col;
    node_12->value = tok->value;
    node_12->kind = std::string("string");
    return node_12;
  }
  if ( tokType == std::string("Number") ) {
    this->advance();
    std::shared_ptr<TSNode> node_13 =  std::make_shared<TSNode>();
    node_13->nodeType = std::string("TSLiteralType");
    node_13->start = tok->start;
    node_13->end = tok->end;
    node_13->line = tok->line;
    node_13->col = tok->col;
    node_13->value = tok->value;
    node_13->kind = std::string("number");
    return node_13;
  }
  if ( (tokVal == std::string("true")) || (tokVal == std::string("false")) ) {
    this->advance();
    std::shared_ptr<TSNode> node_14 =  std::make_shared<TSNode>();
    node_14->nodeType = std::string("TSLiteralType");
    node_14->start = tok->start;
    node_14->end = tok->end;
    node_14->line = tok->line;
    node_14->col = tok->col;
    node_14->value = tokVal;
    node_14->kind = std::string("boolean");
    return node_14;
  }
  if ( tokType == std::string("Template") ) {
    this->advance();
    std::shared_ptr<TSNode> node_15 =  std::make_shared<TSNode>();
    node_15->nodeType = std::string("TSTemplateLiteralType");
    node_15->start = tok->start;
    node_15->end = tok->end;
    node_15->line = tok->line;
    node_15->col = tok->col;
    node_15->value = tok->value;
    return node_15;
  }
  if ( tokVal == std::string("(") ) {
    return this->parseParenOrFunctionType();
  }
  if ( tokVal == std::string("[") ) {
    return this->parseTupleType();
  }
  if ( tokVal == std::string("{") ) {
    return this->parseTypeLiteral();
  }
  if ( this->quiet == false ) {
    std::cout << std::string("Unknown type: ") + tokVal << std::endl;
  }
  this->advance();
  std::shared_ptr<TSNode> errNode =  std::make_shared<TSNode>();
  errNode->nodeType = std::string("TSAnyKeyword");
  return errNode;
}
std::shared_ptr<TSNode>  TSParserSimple::parseTypeRef() {
  std::shared_ptr<TSNode> _ref =  std::make_shared<TSNode>();
  _ref->nodeType = std::string("TSTypeReference");
  std::shared_ptr<Token> tok = this->peek();
  _ref->start = tok->start;
  _ref->line = tok->line;
  _ref->col = tok->col;
  std::shared_ptr<Token> nameTok = this->expect(std::string("Identifier"));
  _ref->name = nameTok->value;
  if ( this->matchValue(std::string("<")) ) {
    this->advance();
    while ((this->matchValue(std::string(">")) == false) && (this->isAtEnd() == false)) {
      if ( ((int)(_ref->params.size())) > 0 ) {
        this->expectValue(std::string(","));
      }
      std::shared_ptr<TSNode> typeArg = this->parseType();
      _ref->params.push_back( typeArg  );
    }
    this->expectValue(std::string(">"));
  }
  return _ref;
}
std::shared_ptr<TSNode>  TSParserSimple::parseTupleType() {
  std::shared_ptr<TSNode> tuple =  std::make_shared<TSNode>();
  tuple->nodeType = std::string("TSTupleType");
  std::shared_ptr<Token> startTok = this->peek();
  tuple->start = startTok->start;
  tuple->line = startTok->line;
  tuple->col = startTok->col;
  this->expectValue(std::string("["));
  while ((this->matchValue(std::string("]")) == false) && (this->isAtEnd() == false)) {
    if ( ((int)(tuple->children.size())) > 0 ) {
      this->expectValue(std::string(","));
    }
    if ( this->matchValue(std::string("...")) ) {
      this->advance();
      std::shared_ptr<TSNode> innerType = this->parseType();
      std::shared_ptr<TSNode> restType =  std::make_shared<TSNode>();
      restType->nodeType = std::string("TSRestType");
      restType->start = innerType->start;
      restType->line = innerType->line;
      restType->col = innerType->col;
      restType->typeAnnotation  = innerType;
      tuple->children.push_back( restType  );
    } else {
      std::shared_ptr<TSNode> elemType = this->parseType();
      if ( this->matchValue(std::string("?")) ) {
        this->advance();
        std::shared_ptr<TSNode> optType =  std::make_shared<TSNode>();
        optType->nodeType = std::string("TSOptionalType");
        optType->start = elemType->start;
        optType->line = elemType->line;
        optType->col = elemType->col;
        optType->typeAnnotation  = elemType;
        tuple->children.push_back( optType  );
      } else {
        tuple->children.push_back( elemType  );
      }
    }
  }
  this->expectValue(std::string("]"));
  return tuple;
}
std::shared_ptr<TSNode>  TSParserSimple::parseParenOrFunctionType() {
  std::shared_ptr<Token> startTok = this->peek();
  int startPos = startTok->start;
  int startLine = startTok->line;
  int startCol = startTok->col;
  this->expectValue(std::string("("));
  if ( this->matchValue(std::string(")")) ) {
    this->advance();
    if ( this->matchValue(std::string("=>")) ) {
      this->advance();
      std::shared_ptr<TSNode> returnType = this->parseType();
      std::shared_ptr<TSNode> funcType =  std::make_shared<TSNode>();
      funcType->nodeType = std::string("TSFunctionType");
      funcType->start = startPos;
      funcType->line = startLine;
      funcType->col = startCol;
      funcType->typeAnnotation  = returnType;
      return funcType;
    }
    std::shared_ptr<TSNode> voidNode =  std::make_shared<TSNode>();
    voidNode->nodeType = std::string("TSVoidKeyword");
    return voidNode;
  }
  bool isIdentifier = this->matchType(std::string("Identifier"));
  if ( isIdentifier ) {
    int savedPos = this->pos;
    std::shared_ptr<Token> savedToken = this->currentToken;
    this->advance();
    if ( this->matchValue(std::string(":")) || this->matchValue(std::string("?")) ) {
      this->pos = savedPos;
      this->currentToken  = savedToken;
      return this->parseFunctionType(startPos, startLine, startCol);
    }
    if ( this->matchValue(std::string(",")) ) {
      /** unused:  int savedPos2 = this->pos   **/ ;
      /** unused:  std::shared_ptr<Token> savedToken2 = this->currentToken   **/ ;
      int depth = 1;
      while ((depth > 0) && (this->isAtEnd() == false)) {
        if ( this->matchValue(std::string("(")) ) {
          depth = depth + 1;
        }
        if ( this->matchValue(std::string(")")) ) {
          depth = depth - 1;
        }
        if ( depth > 0 ) {
          this->advance();
        }
      }
      if ( this->matchValue(std::string(")")) ) {
        this->advance();
        if ( this->matchValue(std::string("=>")) ) {
          this->pos = savedPos;
          this->currentToken  = savedToken;
          return this->parseFunctionType(startPos, startLine, startCol);
        }
      }
      this->pos = savedPos;
      this->currentToken  = savedToken;
    }
    this->pos = savedPos;
    this->currentToken  = savedToken;
  }
  std::shared_ptr<TSNode> innerType = this->parseType();
  this->expectValue(std::string(")"));
  if ( this->matchValue(std::string("=>")) ) {
    this->advance();
    std::shared_ptr<TSNode> returnType_1 = this->parseType();
    std::shared_ptr<TSNode> funcType_1 =  std::make_shared<TSNode>();
    funcType_1->nodeType = std::string("TSFunctionType");
    funcType_1->start = startPos;
    funcType_1->line = startLine;
    funcType_1->col = startCol;
    funcType_1->typeAnnotation  = returnType_1;
    return funcType_1;
  }
  return innerType;
}
std::shared_ptr<TSNode>  TSParserSimple::parseFunctionType( int startPos , int startLine , int startCol ) {
  std::shared_ptr<TSNode> funcType =  std::make_shared<TSNode>();
  funcType->nodeType = std::string("TSFunctionType");
  funcType->start = startPos;
  funcType->line = startLine;
  funcType->col = startCol;
  while ((this->matchValue(std::string(")")) == false) && (this->isAtEnd() == false)) {
    if ( ((int)(funcType->params.size())) > 0 ) {
      this->expectValue(std::string(","));
    }
    std::shared_ptr<TSNode> param =  std::make_shared<TSNode>();
    param->nodeType = std::string("Parameter");
    std::shared_ptr<Token> nameTok = this->expect(std::string("Identifier"));
    param->name = nameTok->value;
    param->start = nameTok->start;
    param->line = nameTok->line;
    param->col = nameTok->col;
    if ( this->matchValue(std::string("?")) ) {
      param->optional = true;
      this->advance();
    }
    if ( this->matchValue(std::string(":")) ) {
      std::shared_ptr<TSNode> typeAnnot = this->parseTypeAnnotation();
      param->typeAnnotation  = typeAnnot;
    }
    funcType->params.push_back( param  );
  }
  this->expectValue(std::string(")"));
  if ( this->matchValue(std::string("=>")) ) {
    this->advance();
    std::shared_ptr<TSNode> returnType = this->parseType();
    funcType->typeAnnotation  = returnType;
  }
  return funcType;
}
std::shared_ptr<TSNode>  TSParserSimple::parseTypeLiteral() {
  std::shared_ptr<TSNode> literal =  std::make_shared<TSNode>();
  literal->nodeType = std::string("TSTypeLiteral");
  std::shared_ptr<Token> startTok = this->peek();
  literal->start = startTok->start;
  literal->line = startTok->line;
  literal->col = startTok->col;
  this->expectValue(std::string("{"));
  while ((this->matchValue(std::string("}")) == false) && (this->isAtEnd() == false)) {
    std::shared_ptr<TSNode> member = this->parseTypeLiteralMember();
    literal->children.push_back( member  );
    if ( this->matchValue(std::string(";")) || this->matchValue(std::string(",")) ) {
      this->advance();
    }
  }
  this->expectValue(std::string("}"));
  return literal;
}
std::shared_ptr<TSNode>  TSParserSimple::parseTypeLiteralMember() {
  std::shared_ptr<Token> startTok = this->peek();
  int startPos = startTok->start;
  int startLine = startTok->line;
  int startCol = startTok->col;
  bool isReadonly = false;
  if ( this->matchValue(std::string("readonly")) ) {
    isReadonly = true;
    this->advance();
  }
  std::string readonlyModifier = std::string("");
  if ( this->matchValue(std::string("+")) || this->matchValue(std::string("-")) ) {
    readonlyModifier = this->peekValue();
    this->advance();
    if ( this->matchValue(std::string("readonly")) ) {
      isReadonly = true;
      this->advance();
    }
  }
  if ( this->matchValue(std::string("[")) ) {
    this->advance();
    std::shared_ptr<Token> paramName = this->expect(std::string("Identifier"));
    if ( this->matchValue(std::string("in")) ) {
      return this->parseMappedType(isReadonly, readonlyModifier, paramName->value, startPos, startLine, startCol);
    }
    return this->parseIndexSignatureRest(isReadonly, paramName, startPos, startLine, startCol);
  }
  std::shared_ptr<Token> nameTok = this->expect(std::string("Identifier"));
  std::string memberName = nameTok->value;
  bool isOptional = false;
  if ( this->matchValue(std::string("?")) ) {
    isOptional = true;
    this->advance();
  }
  if ( this->matchValue(std::string("(")) ) {
    return this->parseMethodSignature(memberName, isOptional, startPos, startLine, startCol);
  }
  std::shared_ptr<TSNode> prop =  std::make_shared<TSNode>();
  prop->nodeType = std::string("TSPropertySignature");
  prop->start = startPos;
  prop->line = startLine;
  prop->col = startCol;
  prop->name = memberName;
  prop->readonly = isReadonly;
  prop->optional = isOptional;
  if ( this->matchValue(std::string(":")) ) {
    std::shared_ptr<TSNode> typeAnnot = this->parseTypeAnnotation();
    prop->typeAnnotation  = typeAnnot;
  }
  return prop;
}
std::shared_ptr<TSNode>  TSParserSimple::parseMappedType( bool isReadonly , std::string readonlyMod , std::string paramName , int startPos , int startLine , int startCol ) {
  std::shared_ptr<TSNode> mapped =  std::make_shared<TSNode>();
  mapped->nodeType = std::string("TSMappedType");
  mapped->start = startPos;
  mapped->line = startLine;
  mapped->col = startCol;
  mapped->readonly = isReadonly;
  if ( readonlyMod != std::string("") ) {
    mapped->kind = readonlyMod;
  }
  this->expectValue(std::string("in"));
  std::shared_ptr<TSNode> typeParam =  std::make_shared<TSNode>();
  typeParam->nodeType = std::string("TSTypeParameter");
  typeParam->name = paramName;
  std::shared_ptr<TSNode> constraint = this->parseType();
  typeParam->typeAnnotation  = constraint;
  mapped->params.push_back( typeParam  );
  if ( this->matchValue(std::string("as")) ) {
    this->advance();
    std::shared_ptr<TSNode> nameType = this->parseType();
    mapped->right  = nameType;
  }
  this->expectValue(std::string("]"));
  std::string optionalMod = std::string("");
  if ( this->matchValue(std::string("+")) || this->matchValue(std::string("-")) ) {
    optionalMod = this->peekValue();
    this->advance();
  }
  if ( this->matchValue(std::string("?")) ) {
    mapped->optional = true;
    if ( optionalMod != std::string("") ) {
      mapped->value = optionalMod;
    }
    this->advance();
  }
  if ( this->matchValue(std::string(":")) ) {
    this->advance();
    std::shared_ptr<TSNode> valueType = this->parseType();
    mapped->typeAnnotation  = valueType;
  }
  return mapped;
}
std::shared_ptr<TSNode>  TSParserSimple::parseIndexSignatureRest( bool isReadonly , std::shared_ptr<Token> paramTok , int startPos , int startLine , int startCol ) {
  std::shared_ptr<TSNode> indexSig =  std::make_shared<TSNode>();
  indexSig->nodeType = std::string("TSIndexSignature");
  indexSig->start = startPos;
  indexSig->line = startLine;
  indexSig->col = startCol;
  indexSig->readonly = isReadonly;
  std::shared_ptr<TSNode> param =  std::make_shared<TSNode>();
  param->nodeType = std::string("Parameter");
  param->name = paramTok->value;
  param->start = paramTok->start;
  param->line = paramTok->line;
  param->col = paramTok->col;
  if ( this->matchValue(std::string(":")) ) {
    std::shared_ptr<TSNode> typeAnnot = this->parseTypeAnnotation();
    param->typeAnnotation  = typeAnnot;
  }
  indexSig->params.push_back( param  );
  this->expectValue(std::string("]"));
  if ( this->matchValue(std::string(":")) ) {
    std::shared_ptr<TSNode> typeAnnot_1 = this->parseTypeAnnotation();
    indexSig->typeAnnotation  = typeAnnot_1;
  }
  return indexSig;
}
std::shared_ptr<TSNode>  TSParserSimple::parseMethodSignature( std::string methodName , bool isOptional , int startPos , int startLine , int startCol ) {
  std::shared_ptr<TSNode> method =  std::make_shared<TSNode>();
  method->nodeType = std::string("TSMethodSignature");
  method->start = startPos;
  method->line = startLine;
  method->col = startCol;
  method->name = methodName;
  method->optional = isOptional;
  this->expectValue(std::string("("));
  while ((this->matchValue(std::string(")")) == false) && (this->isAtEnd() == false)) {
    if ( ((int)(method->params.size())) > 0 ) {
      this->expectValue(std::string(","));
    }
    std::shared_ptr<TSNode> param = this->parseParam();
    method->params.push_back( param  );
  }
  this->expectValue(std::string(")"));
  if ( this->matchValue(std::string(":")) ) {
    std::shared_ptr<TSNode> returnType = this->parseTypeAnnotation();
    method->typeAnnotation  = returnType;
  }
  return method;
}
std::shared_ptr<TSNode>  TSParserSimple::parseExpr() {
  return this->parseAssign();
}
std::shared_ptr<TSNode>  TSParserSimple::parseAssign() {
  std::shared_ptr<TSNode> left = this->parseNullishCoalescing();
  if ( this->matchValue(std::string("=")) ) {
    this->advance();
    std::shared_ptr<TSNode> right = this->parseAssign();
    std::shared_ptr<TSNode> assign =  std::make_shared<TSNode>();
    assign->nodeType = std::string("AssignmentExpression");
    assign->value = std::string("=");
    assign->left  = left;
    assign->right  = right;
    assign->start = left->start;
    assign->line = left->line;
    assign->col = left->col;
    return assign;
  }
  return left;
}
std::shared_ptr<TSNode>  TSParserSimple::parseNullishCoalescing() {
  std::shared_ptr<TSNode> left = this->parseBinary();
  while (this->matchValue(std::string("??"))) {
    this->advance();
    std::shared_ptr<TSNode> right = this->parseBinary();
    std::shared_ptr<TSNode> nullish =  std::make_shared<TSNode>();
    nullish->nodeType = std::string("LogicalExpression");
    nullish->value = std::string("??");
    nullish->left  = left;
    nullish->right  = right;
    nullish->start = left->start;
    nullish->line = left->line;
    nullish->col = left->col;
    left = nullish;
  }
  return left;
}
std::shared_ptr<TSNode>  TSParserSimple::parseBinary() {
  std::shared_ptr<TSNode> left = this->parseUnary();
  std::string tokVal = this->peekValue();
  while ((((((((tokVal == std::string("+")) || (tokVal == std::string("-"))) || (tokVal == std::string("*"))) || (tokVal == std::string("/"))) || (tokVal == std::string("==="))) || (tokVal == std::string("!=="))) || (tokVal == std::string("<"))) || (tokVal == std::string(">"))) {
    std::shared_ptr<Token> opTok = this->peek();
    this->advance();
    std::shared_ptr<TSNode> right = this->parseUnary();
    std::shared_ptr<TSNode> binExpr =  std::make_shared<TSNode>();
    binExpr->nodeType = std::string("BinaryExpression");
    binExpr->value = opTok->value;
    binExpr->left  = left;
    binExpr->right  = right;
    binExpr->start = left->start;
    binExpr->line = left->line;
    binExpr->col = left->col;
    left = binExpr;
    tokVal = this->peekValue();
  }
  return left;
}
std::shared_ptr<TSNode>  TSParserSimple::parseUnary() {
  std::string tokVal = this->peekValue();
  if ( (tokVal == std::string("!")) || (tokVal == std::string("-")) ) {
    std::shared_ptr<Token> opTok = this->peek();
    this->advance();
    std::shared_ptr<TSNode> arg = this->parseUnary();
    std::shared_ptr<TSNode> unary =  std::make_shared<TSNode>();
    unary->nodeType = std::string("UnaryExpression");
    unary->value = opTok->value;
    unary->left  = arg;
    unary->start = opTok->start;
    unary->line = opTok->line;
    unary->col = opTok->col;
    return unary;
  }
  if ( tokVal == std::string("await") ) {
    std::shared_ptr<Token> awaitTok = this->peek();
    this->advance();
    std::shared_ptr<TSNode> arg_1 = this->parseUnary();
    std::shared_ptr<TSNode> awaitExpr =  std::make_shared<TSNode>();
    awaitExpr->nodeType = std::string("AwaitExpression");
    awaitExpr->left  = arg_1;
    awaitExpr->start = awaitTok->start;
    awaitExpr->line = awaitTok->line;
    awaitExpr->col = awaitTok->col;
    return awaitExpr;
  }
  if ( tokVal == std::string("<") ) {
    std::shared_ptr<Token> startTok = this->peek();
    this->advance();
    std::string nextType = this->peekType();
    if ( ((nextType == std::string("Identifier")) || (nextType == std::string("Keyword"))) || (nextType == std::string("TSType")) ) {
      std::shared_ptr<TSNode> typeNode = this->parseType();
      if ( this->matchValue(std::string(">")) ) {
        this->advance();
        std::shared_ptr<TSNode> arg_2 = this->parseUnary();
        std::shared_ptr<TSNode> assertion =  std::make_shared<TSNode>();
        assertion->nodeType = std::string("TSTypeAssertion");
        assertion->typeAnnotation  = typeNode;
        assertion->left  = arg_2;
        assertion->start = startTok->start;
        assertion->line = startTok->line;
        assertion->col = startTok->col;
        return assertion;
      }
    }
  }
  return this->parsePostfix();
}
std::shared_ptr<TSNode>  TSParserSimple::parsePostfix() {
  std::shared_ptr<TSNode> expr = this->parsePrimary();
  bool keepParsing = true;
  while (keepParsing) {
    std::string tokVal = this->peekValue();
    if ( tokVal == std::string("(") ) {
      this->advance();
      std::shared_ptr<TSNode> call =  std::make_shared<TSNode>();
      call->nodeType = std::string("CallExpression");
      call->left  = expr;
      call->start = expr->start;
      call->line = expr->line;
      call->col = expr->col;
      while ((this->matchValue(std::string(")")) == false) && (this->isAtEnd() == false)) {
        if ( ((int)(call->children.size())) > 0 ) {
          this->expectValue(std::string(","));
        }
        std::shared_ptr<TSNode> arg = this->parseExpr();
        call->children.push_back( arg  );
      }
      this->expectValue(std::string(")"));
      expr = call;
    }
    if ( tokVal == std::string(".") ) {
      this->advance();
      std::shared_ptr<Token> propTok = this->expect(std::string("Identifier"));
      std::shared_ptr<TSNode> member =  std::make_shared<TSNode>();
      member->nodeType = std::string("MemberExpression");
      member->left  = expr;
      member->name = propTok->value;
      member->start = expr->start;
      member->line = expr->line;
      member->col = expr->col;
      expr = member;
    }
    if ( tokVal == std::string("?.") ) {
      this->advance();
      std::string nextTokVal = this->peekValue();
      if ( nextTokVal == std::string("(") ) {
        this->advance();
        std::shared_ptr<TSNode> optCall =  std::make_shared<TSNode>();
        optCall->nodeType = std::string("OptionalCallExpression");
        optCall->optional = true;
        optCall->left  = expr;
        optCall->start = expr->start;
        optCall->line = expr->line;
        optCall->col = expr->col;
        while ((this->matchValue(std::string(")")) == false) && (this->isAtEnd() == false)) {
          if ( ((int)(optCall->children.size())) > 0 ) {
            this->expectValue(std::string(","));
          }
          std::shared_ptr<TSNode> arg_1 = this->parseExpr();
          optCall->children.push_back( arg_1  );
        }
        this->expectValue(std::string(")"));
        expr = optCall;
      }
      if ( nextTokVal == std::string("[") ) {
        this->advance();
        std::shared_ptr<TSNode> indexExpr = this->parseExpr();
        this->expectValue(std::string("]"));
        std::shared_ptr<TSNode> optIndex =  std::make_shared<TSNode>();
        optIndex->nodeType = std::string("OptionalMemberExpression");
        optIndex->optional = true;
        optIndex->left  = expr;
        optIndex->right  = indexExpr;
        optIndex->start = expr->start;
        optIndex->line = expr->line;
        optIndex->col = expr->col;
        expr = optIndex;
      }
      if ( this->matchType(std::string("Identifier")) ) {
        std::shared_ptr<Token> propTok_1 = this->expect(std::string("Identifier"));
        std::shared_ptr<TSNode> optMember =  std::make_shared<TSNode>();
        optMember->nodeType = std::string("OptionalMemberExpression");
        optMember->optional = true;
        optMember->left  = expr;
        optMember->name = propTok_1->value;
        optMember->start = expr->start;
        optMember->line = expr->line;
        optMember->col = expr->col;
        expr = optMember;
      }
    }
    if ( tokVal == std::string("[") ) {
      this->advance();
      std::shared_ptr<TSNode> indexExpr_1 = this->parseExpr();
      this->expectValue(std::string("]"));
      std::shared_ptr<TSNode> computed =  std::make_shared<TSNode>();
      computed->nodeType = std::string("MemberExpression");
      computed->left  = expr;
      computed->right  = indexExpr_1;
      computed->start = expr->start;
      computed->line = expr->line;
      computed->col = expr->col;
      expr = computed;
    }
    if ( tokVal == std::string("!") ) {
      std::shared_ptr<Token> tok = this->peek();
      this->advance();
      std::shared_ptr<TSNode> nonNull =  std::make_shared<TSNode>();
      nonNull->nodeType = std::string("TSNonNullExpression");
      nonNull->left  = expr;
      nonNull->start = expr->start;
      nonNull->line = expr->line;
      nonNull->col = tok->col;
      expr = nonNull;
    }
    if ( tokVal == std::string("as") ) {
      this->advance();
      std::shared_ptr<TSNode> asType = this->parseType();
      std::shared_ptr<TSNode> assertion =  std::make_shared<TSNode>();
      assertion->nodeType = std::string("TSAsExpression");
      assertion->left  = expr;
      assertion->typeAnnotation  = asType;
      assertion->start = expr->start;
      assertion->line = expr->line;
      assertion->col = expr->col;
      expr = assertion;
    }
    if ( tokVal == std::string("satisfies") ) {
      this->advance();
      std::shared_ptr<TSNode> satisfiesType = this->parseType();
      std::shared_ptr<TSNode> satisfiesExpr =  std::make_shared<TSNode>();
      satisfiesExpr->nodeType = std::string("TSSatisfiesExpression");
      satisfiesExpr->left  = expr;
      satisfiesExpr->typeAnnotation  = satisfiesType;
      satisfiesExpr->start = expr->start;
      satisfiesExpr->line = expr->line;
      satisfiesExpr->col = expr->col;
      expr = satisfiesExpr;
    }
    std::string newTokVal = this->peekValue();
    if ( ((((((newTokVal != std::string("(")) && (newTokVal != std::string("."))) && (newTokVal != std::string("?."))) && (newTokVal != std::string("["))) && (newTokVal != std::string("!"))) && (newTokVal != std::string("as"))) && (newTokVal != std::string("satisfies")) ) {
      keepParsing = false;
    }
  }
  return expr;
}
std::shared_ptr<TSNode>  TSParserSimple::parsePrimary() {
  std::string tokType = this->peekType();
  std::string tokVal = this->peekValue();
  std::shared_ptr<Token> tok = this->peek();
  if ( tokType == std::string("Identifier") ) {
    this->advance();
    std::shared_ptr<TSNode> id =  std::make_shared<TSNode>();
    id->nodeType = std::string("Identifier");
    id->name = tok->value;
    id->start = tok->start;
    id->end = tok->end;
    id->line = tok->line;
    id->col = tok->col;
    return id;
  }
  if ( tokType == std::string("Number") ) {
    this->advance();
    std::shared_ptr<TSNode> num =  std::make_shared<TSNode>();
    num->nodeType = std::string("NumericLiteral");
    num->value = tok->value;
    num->start = tok->start;
    num->end = tok->end;
    num->line = tok->line;
    num->col = tok->col;
    return num;
  }
  if ( tokType == std::string("String") ) {
    this->advance();
    std::shared_ptr<TSNode> str =  std::make_shared<TSNode>();
    str->nodeType = std::string("StringLiteral");
    str->value = tok->value;
    str->start = tok->start;
    str->end = tok->end;
    str->line = tok->line;
    str->col = tok->col;
    return str;
  }
  if ( tokType == std::string("Template") ) {
    return this->parseTemplateLiteral();
  }
  if ( (tokVal == std::string("true")) || (tokVal == std::string("false")) ) {
    this->advance();
    std::shared_ptr<TSNode> _bool =  std::make_shared<TSNode>();
    _bool->nodeType = std::string("BooleanLiteral");
    _bool->value = tokVal;
    _bool->start = tok->start;
    _bool->end = tok->end;
    _bool->line = tok->line;
    _bool->col = tok->col;
    return _bool;
  }
  if ( tokVal == std::string("null") ) {
    this->advance();
    std::shared_ptr<TSNode> nullLit =  std::make_shared<TSNode>();
    nullLit->nodeType = std::string("NullLiteral");
    nullLit->start = tok->start;
    nullLit->end = tok->end;
    nullLit->line = tok->line;
    nullLit->col = tok->col;
    return nullLit;
  }
  if ( tokVal == std::string("undefined") ) {
    this->advance();
    std::shared_ptr<TSNode> undefId =  std::make_shared<TSNode>();
    undefId->nodeType = std::string("Identifier");
    undefId->name = std::string("undefined");
    undefId->start = tok->start;
    undefId->end = tok->end;
    undefId->line = tok->line;
    undefId->col = tok->col;
    return undefId;
  }
  if ( tokVal == std::string("[") ) {
    return this->parseArrayLiteral();
  }
  if ( tokVal == std::string("{") ) {
    return this->parseObjectLiteral();
  }
  if ( (this->tsxMode == true) && (tokVal == std::string("<")) ) {
    std::string nextType = this->peekNextType();
    std::string nextVal = this->peekNextValue();
    if ( nextVal == std::string(">") ) {
      return this->parseJSXFragment();
    }
    if ( (nextType == std::string("Identifier")) || (nextType == std::string("Keyword")) ) {
      return this->parseJSXElement();
    }
  }
  if ( tokVal == std::string("(") ) {
    return this->parseParenOrArrow();
  }
  if ( tokVal == std::string("async") ) {
    std::string nextVal_1 = this->peekNextValue();
    std::string nextType_1 = this->peekNextType();
    if ( (nextVal_1 == std::string("(")) || (nextType_1 == std::string("Identifier")) ) {
      return this->parseArrowFunction();
    }
  }
  if ( tokVal == std::string("new") ) {
    return this->parseNewExpression();
  }
  if ( tokVal == std::string("this") ) {
    this->advance();
    std::shared_ptr<TSNode> thisExpr =  std::make_shared<TSNode>();
    thisExpr->nodeType = std::string("ThisExpression");
    thisExpr->start = tok->start;
    thisExpr->end = tok->end;
    thisExpr->line = tok->line;
    thisExpr->col = tok->col;
    return thisExpr;
  }
  if ( this->quiet == false ) {
    std::cout << std::string("Unexpected token: ") + tokVal << std::endl;
  }
  this->advance();
  std::shared_ptr<TSNode> errId =  std::make_shared<TSNode>();
  errId->nodeType = std::string("Identifier");
  errId->name = std::string("error");
  return errId;
}
std::shared_ptr<TSNode>  TSParserSimple::parseTemplateLiteral() {
  std::shared_ptr<TSNode> node =  std::make_shared<TSNode>();
  node->nodeType = std::string("TemplateLiteral");
  std::shared_ptr<Token> tok = this->peek();
  node->start = tok->start;
  node->line = tok->line;
  node->col = tok->col;
  this->advance();
  std::shared_ptr<TSNode> quasi =  std::make_shared<TSNode>();
  quasi->nodeType = std::string("TemplateElement");
  quasi->value = tok->value;
  node->children.push_back( quasi  );
  return node;
}
std::shared_ptr<TSNode>  TSParserSimple::parseArrayLiteral() {
  std::shared_ptr<TSNode> node =  std::make_shared<TSNode>();
  node->nodeType = std::string("ArrayExpression");
  std::shared_ptr<Token> tok = this->peek();
  node->start = tok->start;
  node->line = tok->line;
  node->col = tok->col;
  this->expectValue(std::string("["));
  while ((this->matchValue(std::string("]")) == false) && (this->isAtEnd() == false)) {
    if ( this->matchValue(std::string("...")) ) {
      this->advance();
      std::shared_ptr<TSNode> spreadArg = this->parseExpr();
      std::shared_ptr<TSNode> spread =  std::make_shared<TSNode>();
      spread->nodeType = std::string("SpreadElement");
      spread->left  = spreadArg;
      node->children.push_back( spread  );
    } else {
      if ( this->matchValue(std::string(",")) ) {
      } else {
        std::shared_ptr<TSNode> elem = this->parseExpr();
        node->children.push_back( elem  );
      }
    }
    if ( this->matchValue(std::string(",")) ) {
      this->advance();
    }
  }
  this->expectValue(std::string("]"));
  return node;
}
std::shared_ptr<TSNode>  TSParserSimple::parseObjectLiteral() {
  std::shared_ptr<TSNode> node =  std::make_shared<TSNode>();
  node->nodeType = std::string("ObjectExpression");
  std::shared_ptr<Token> tok = this->peek();
  node->start = tok->start;
  node->line = tok->line;
  node->col = tok->col;
  this->expectValue(std::string("{"));
  while ((this->matchValue(std::string("}")) == false) && (this->isAtEnd() == false)) {
    if ( this->matchValue(std::string("...")) ) {
      this->advance();
      std::shared_ptr<TSNode> spreadArg = this->parseExpr();
      std::shared_ptr<TSNode> spread =  std::make_shared<TSNode>();
      spread->nodeType = std::string("SpreadElement");
      spread->left  = spreadArg;
      node->children.push_back( spread  );
    } else {
      std::shared_ptr<TSNode> prop =  std::make_shared<TSNode>();
      prop->nodeType = std::string("Property");
      std::shared_ptr<Token> keyTok = this->peek();
      if ( this->matchType(std::string("Identifier")) ) {
        prop->name = keyTok->value;
        this->advance();
      }
      if ( this->matchType(std::string("String")) ) {
        prop->name = keyTok->value;
        this->advance();
      }
      if ( this->matchType(std::string("Number")) ) {
        prop->name = keyTok->value;
        this->advance();
      }
      if ( this->matchValue(std::string(":")) ) {
        this->advance();
        std::shared_ptr<TSNode> valueExpr = this->parseExpr();
        prop->left  = valueExpr;
      } else {
        std::shared_ptr<TSNode> shorthandVal =  std::make_shared<TSNode>();
        shorthandVal->nodeType = std::string("Identifier");
        shorthandVal->name = prop->name;
        prop->left  = shorthandVal;
        prop->kind = std::string("shorthand");
      }
      node->children.push_back( prop  );
    }
    if ( this->matchValue(std::string(",")) ) {
      this->advance();
    }
  }
  this->expectValue(std::string("}"));
  return node;
}
std::shared_ptr<TSNode>  TSParserSimple::parseParenOrArrow() {
  /** unused:  std::shared_ptr<Token> startTok = this->peek()   **/ ;
  int savedPos = this->pos;
  std::shared_ptr<Token> savedTok = this->currentToken;
  this->advance();
  int parenDepth = 1;
  while ((parenDepth > 0) && (this->isAtEnd() == false)) {
    std::string v = this->peekValue();
    if ( v == std::string("(") ) {
      parenDepth = parenDepth + 1;
    }
    if ( v == std::string(")") ) {
      parenDepth = parenDepth - 1;
    }
    if ( parenDepth > 0 ) {
      this->advance();
    }
  }
  if ( this->matchValue(std::string(")")) == false ) {
    this->pos = savedPos;
    this->currentToken  = savedTok;
    this->advance();
    std::shared_ptr<TSNode> expr = this->parseExpr();
    this->expectValue(std::string(")"));
    return expr;
  }
  this->advance();
  if ( this->matchValue(std::string(":")) ) {
    this->advance();
    this->parseType();
  }
  if ( this->matchValue(std::string("=>")) ) {
    this->pos = savedPos;
    this->currentToken  = savedTok;
    return this->parseArrowFunction();
  }
  this->pos = savedPos;
  this->currentToken  = savedTok;
  this->advance();
  std::shared_ptr<TSNode> expr_1 = this->parseExpr();
  this->expectValue(std::string(")"));
  return expr_1;
}
std::shared_ptr<TSNode>  TSParserSimple::parseArrowFunction() {
  std::shared_ptr<TSNode> node =  std::make_shared<TSNode>();
  node->nodeType = std::string("ArrowFunctionExpression");
  std::shared_ptr<Token> startTok = this->peek();
  node->start = startTok->start;
  node->line = startTok->line;
  node->col = startTok->col;
  if ( this->matchValue(std::string("async")) ) {
    this->advance();
    node->kind = std::string("async");
  }
  if ( this->matchValue(std::string("(")) ) {
    this->advance();
    while ((this->matchValue(std::string(")")) == false) && (this->isAtEnd() == false)) {
      if ( ((int)(node->params.size())) > 0 ) {
        this->expectValue(std::string(","));
      }
      std::shared_ptr<TSNode> param = this->parseParam();
      node->params.push_back( param  );
    }
    this->expectValue(std::string(")"));
  } else {
    std::shared_ptr<Token> paramTok = this->expect(std::string("Identifier"));
    std::shared_ptr<TSNode> param_1 =  std::make_shared<TSNode>();
    param_1->nodeType = std::string("Parameter");
    param_1->name = paramTok->value;
    node->params.push_back( param_1  );
  }
  if ( this->matchValue(std::string(":")) ) {
    this->advance();
    std::shared_ptr<TSNode> retType = this->parseType();
    node->typeAnnotation  = retType;
  }
  this->expectValue(std::string("=>"));
  if ( this->matchValue(std::string("{")) ) {
    std::shared_ptr<TSNode> body = this->parseBlock();
    node->body  = body;
  } else {
    std::shared_ptr<TSNode> body_1 = this->parseExpr();
    node->body  = body_1;
  }
  return node;
}
std::shared_ptr<TSNode>  TSParserSimple::parseNewExpression() {
  std::shared_ptr<TSNode> node =  std::make_shared<TSNode>();
  node->nodeType = std::string("NewExpression");
  std::shared_ptr<Token> tok = this->peek();
  node->start = tok->start;
  node->line = tok->line;
  node->col = tok->col;
  this->expectValue(std::string("new"));
  std::shared_ptr<TSNode> callee = this->parsePrimary();
  node->left  = callee;
  if ( this->matchValue(std::string("<")) ) {
    int depth = 1;
    this->advance();
    while ((depth > 0) && (this->isAtEnd() == false)) {
      std::string v = this->peekValue();
      if ( v == std::string("<") ) {
        depth = depth + 1;
      }
      if ( v == std::string(">") ) {
        depth = depth - 1;
      }
      this->advance();
    }
  }
  if ( this->matchValue(std::string("(")) ) {
    this->advance();
    while ((this->matchValue(std::string(")")) == false) && (this->isAtEnd() == false)) {
      if ( ((int)(node->children.size())) > 0 ) {
        this->expectValue(std::string(","));
      }
      std::shared_ptr<TSNode> arg = this->parseExpr();
      node->children.push_back( arg  );
    }
    this->expectValue(std::string(")"));
  }
  return node;
}
std::string  TSParserSimple::peekNextType() {
  int nextPos = this->pos + 1;
  if ( nextPos < ((int)(this->tokens.size())) ) {
    std::shared_ptr<Token> nextTok = this->tokens.at(nextPos);
    return nextTok->tokenType;
  }
  return std::string("EOF");
}
std::shared_ptr<TSNode>  TSParserSimple::parseJSXElement() {
  std::shared_ptr<TSNode> node =  std::make_shared<TSNode>();
  node->nodeType = std::string("JSXElement");
  std::shared_ptr<Token> tok = this->peek();
  node->start = tok->start;
  node->line = tok->line;
  node->col = tok->col;
  std::shared_ptr<TSNode> opening = this->parseJSXOpeningElement();
  node->left  = opening;
  if ( opening->kind == std::string("self-closing") ) {
    node->nodeType = std::string("JSXElement");
    return node;
  }
  /** unused:  std::string tagName = opening->name   **/ ;
  while (this->isAtEnd() == false) {
    std::string v = this->peekValue();
    if ( v == std::string("<") ) {
      std::string nextVal = this->peekNextValue();
      if ( nextVal == std::string("/") ) {
        break;
      }
      std::shared_ptr<TSNode> child = this->parseJSXElement();
      node->children.push_back( child  );
    } else {
      if ( v == std::string("{") ) {
        std::shared_ptr<TSNode> exprChild = this->parseJSXExpressionContainer();
        node->children.push_back( exprChild  );
      } else {
        std::string t = this->peekType();
        if ( ((t != std::string("EOF")) && (v != std::string("<"))) && (v != std::string("{")) ) {
          std::shared_ptr<TSNode> textChild = this->parseJSXText();
          node->children.push_back( textChild  );
        } else {
          break;
        }
      }
    }
  }
  std::shared_ptr<TSNode> closing = this->parseJSXClosingElement();
  node->right  = closing;
  return node;
}
std::shared_ptr<TSNode>  TSParserSimple::parseJSXOpeningElement() {
  std::shared_ptr<TSNode> node =  std::make_shared<TSNode>();
  node->nodeType = std::string("JSXOpeningElement");
  std::shared_ptr<Token> tok = this->peek();
  node->start = tok->start;
  node->line = tok->line;
  node->col = tok->col;
  this->expectValue(std::string("<"));
  std::shared_ptr<TSNode> tagName = this->parseJSXElementName();
  node->name = tagName->name;
  node->left  = tagName;
  while (this->isAtEnd() == false) {
    std::string v = this->peekValue();
    if ( (v == std::string(">")) || (v == std::string("/")) ) {
      break;
    }
    std::shared_ptr<TSNode> attr = this->parseJSXAttribute();
    node->children.push_back( attr  );
  }
  if ( this->matchValue(std::string("/")) ) {
    this->advance();
    node->kind = std::string("self-closing");
  }
  this->expectValue(std::string(">"));
  return node;
}
std::shared_ptr<TSNode>  TSParserSimple::parseJSXClosingElement() {
  std::shared_ptr<TSNode> node =  std::make_shared<TSNode>();
  node->nodeType = std::string("JSXClosingElement");
  std::shared_ptr<Token> tok = this->peek();
  node->start = tok->start;
  node->line = tok->line;
  node->col = tok->col;
  this->expectValue(std::string("<"));
  this->expectValue(std::string("/"));
  std::shared_ptr<TSNode> tagName = this->parseJSXElementName();
  node->name = tagName->name;
  node->left  = tagName;
  this->expectValue(std::string(">"));
  return node;
}
std::shared_ptr<TSNode>  TSParserSimple::parseJSXElementName() {
  std::shared_ptr<TSNode> node =  std::make_shared<TSNode>();
  node->nodeType = std::string("JSXIdentifier");
  std::shared_ptr<Token> tok = this->peek();
  node->start = tok->start;
  node->line = tok->line;
  node->col = tok->col;
  std::string namePart = tok->value;
  this->advance();
  while (this->matchValue(std::string("."))) {
    this->advance();
    std::shared_ptr<Token> nextTok = this->peek();
    namePart = (namePart + std::string(".")) + nextTok->value;
    this->advance();
    node->nodeType = std::string("JSXMemberExpression");
  }
  node->name = namePart;
  return node;
}
std::shared_ptr<TSNode>  TSParserSimple::parseJSXAttribute() {
  std::shared_ptr<TSNode> node =  std::make_shared<TSNode>();
  node->nodeType = std::string("JSXAttribute");
  std::shared_ptr<Token> tok = this->peek();
  node->start = tok->start;
  node->line = tok->line;
  node->col = tok->col;
  if ( this->matchValue(std::string("{")) ) {
    this->advance();
    if ( this->matchValue(std::string("...")) ) {
      this->advance();
      node->nodeType = std::string("JSXSpreadAttribute");
      std::shared_ptr<TSNode> arg = this->parseExpr();
      node->left  = arg;
      this->expectValue(std::string("}"));
      return node;
    }
  }
  std::string attrName = tok->value;
  node->name = attrName;
  this->advance();
  if ( this->matchValue(std::string("=")) ) {
    this->advance();
    std::string valTok = this->peekValue();
    if ( valTok == std::string("{") ) {
      std::shared_ptr<TSNode> exprValue = this->parseJSXExpressionContainer();
      node->right  = exprValue;
    } else {
      std::shared_ptr<Token> strTok = this->peek();
      std::shared_ptr<TSNode> strNode =  std::make_shared<TSNode>();
      strNode->nodeType = std::string("StringLiteral");
      strNode->value = strTok->value;
      strNode->start = strTok->start;
      strNode->end = strTok->end;
      strNode->line = strTok->line;
      strNode->col = strTok->col;
      this->advance();
      node->right  = strNode;
    }
  }
  return node;
}
std::shared_ptr<TSNode>  TSParserSimple::parseJSXExpressionContainer() {
  std::shared_ptr<TSNode> node =  std::make_shared<TSNode>();
  node->nodeType = std::string("JSXExpressionContainer");
  std::shared_ptr<Token> tok = this->peek();
  node->start = tok->start;
  node->line = tok->line;
  node->col = tok->col;
  this->expectValue(std::string("{"));
  if ( this->matchValue(std::string("}")) ) {
    std::shared_ptr<TSNode> empty =  std::make_shared<TSNode>();
    empty->nodeType = std::string("JSXEmptyExpression");
    node->left  = empty;
  } else {
    std::shared_ptr<TSNode> expr = this->parseExpr();
    node->left  = expr;
  }
  this->expectValue(std::string("}"));
  return node;
}
std::shared_ptr<TSNode>  TSParserSimple::parseJSXText() {
  std::shared_ptr<TSNode> node =  std::make_shared<TSNode>();
  node->nodeType = std::string("JSXText");
  std::shared_ptr<Token> tok = this->peek();
  node->start = tok->start;
  node->line = tok->line;
  node->col = tok->col;
  node->value = tok->value;
  this->advance();
  return node;
}
std::shared_ptr<TSNode>  TSParserSimple::parseJSXFragment() {
  std::shared_ptr<TSNode> node =  std::make_shared<TSNode>();
  node->nodeType = std::string("JSXFragment");
  std::shared_ptr<Token> tok = this->peek();
  node->start = tok->start;
  node->line = tok->line;
  node->col = tok->col;
  this->expectValue(std::string("<"));
  this->expectValue(std::string(">"));
  while (this->isAtEnd() == false) {
    std::string v = this->peekValue();
    if ( v == std::string("<") ) {
      std::string nextVal = this->peekNextValue();
      if ( nextVal == std::string("/") ) {
        break;
      }
      std::shared_ptr<TSNode> child = this->parseJSXElement();
      node->children.push_back( child  );
    } else {
      if ( v == std::string("{") ) {
        std::shared_ptr<TSNode> exprChild = this->parseJSXExpressionContainer();
        node->children.push_back( exprChild  );
      } else {
        std::string t = this->peekType();
        if ( ((t != std::string("EOF")) && (v != std::string("<"))) && (v != std::string("{")) ) {
          std::shared_ptr<TSNode> textChild = this->parseJSXText();
          node->children.push_back( textChild  );
        } else {
          break;
        }
      }
    }
  }
  this->expectValue(std::string("<"));
  this->expectValue(std::string("/"));
  this->expectValue(std::string(">"));
  return node;
}
TSParserMain::TSParserMain( ) {
}
void  TSParserMain::showHelp() {
  std::cout << std::string("TypeScript Parser") << std::endl;
  std::cout << std::string("") << std::endl;
  std::cout << std::string("Usage: node ts_parser_main.js [options]") << std::endl;
  std::cout << std::string("") << std::endl;
  std::cout << std::string("Options:") << std::endl;
  std::cout << std::string("  -h, --help          Show this help message") << std::endl;
  std::cout << std::string("  -d                  Run built-in demo/test suite") << std::endl;
  std::cout << std::string("  -i <file>           Input TypeScript file to parse") << std::endl;
  std::cout << std::string("  --tokens            Show tokens in addition to AST") << std::endl;
  std::cout << std::string("  --show-interfaces   List all interfaces in the file") << std::endl;
  std::cout << std::string("  --show-types        List all type aliases in the file") << std::endl;
  std::cout << std::string("  --show-functions    List all functions in the file") << std::endl;
  std::cout << std::string("") << std::endl;
  std::cout << std::string("Examples:") << std::endl;
  std::cout << std::string("  node ts_parser_main.js -d                              Run the demo") << std::endl;
  std::cout << std::string("  node ts_parser_main.js -i script.ts                    Parse and show AST") << std::endl;
  std::cout << std::string("  node ts_parser_main.js -i script.ts --tokens           Also show tokens") << std::endl;
  std::cout << std::string("  node ts_parser_main.js -i script.ts --show-interfaces  List interfaces") << std::endl;
}
void  TSParserMain::listDeclarations( std::string filename , bool showInterfaces , bool showTypes , bool showFunctions ) {
  std::string codeOpt = r_cpp_readFile( std::string(".") , filename);
  if ( codeOpt.empty() ) {
    std::cout << std::string("Error: Could not read file: ") + filename << std::endl;
    return;
  }
  std::string code = codeOpt;
  std::shared_ptr<TSLexer> lexer =  std::make_shared<TSLexer>(code);
  std::vector<std::shared_ptr<Token>> tokens = lexer->tokenize();
  std::shared_ptr<TSParserSimple> parser =  std::make_shared<TSParserSimple>();
  parser->initParser(tokens);
  parser->setQuiet(true);
  std::shared_ptr<TSNode> program = parser->parseProgram();
  if ( showInterfaces ) {
    std::cout << (std::string("=== Interfaces in ") + filename) + std::string(" ===") << std::endl;
    std::cout << std::string("") << std::endl;
    TSParserMain::listInterfaces(program);
    std::cout << std::string("") << std::endl;
  }
  if ( showTypes ) {
    std::cout << (std::string("=== Type Aliases in ") + filename) + std::string(" ===") << std::endl;
    std::cout << std::string("") << std::endl;
    TSParserMain::listTypeAliases(program);
    std::cout << std::string("") << std::endl;
  }
  if ( showFunctions ) {
    std::cout << (std::string("=== Functions in ") + filename) + std::string(" ===") << std::endl;
    std::cout << std::string("") << std::endl;
    TSParserMain::listFunctions(program);
    std::cout << std::string("") << std::endl;
  }
}
void  TSParserMain::listInterfaces( std::shared_ptr<TSNode> program ) {
  int count = 0;
  for ( int idx = 0; idx != (int)(program->children.size()); idx++) {
    std::shared_ptr<TSNode> stmt = program->children.at(idx);
    if ( stmt->nodeType == std::string("TSInterfaceDeclaration") ) {
      count = count + 1;
      std::string line = std::string("") + std::to_string(stmt->line);
      int props = 0;
      if ( stmt->body != NULL  ) {
        std::shared_ptr<TSNode> body = stmt->body;
        props = (int)(body->children.size());
      }
      std::cout << (((((std::string("  ") + stmt->name) + std::string(" (")) + std::to_string(props)) + std::string(" properties) [line ")) + line) + std::string("]") << std::endl;
      if ( stmt->body != NULL  ) {
        std::shared_ptr<TSNode> bodyNode = stmt->body;
        for ( int mi = 0; mi != (int)(bodyNode->children.size()); mi++) {
          std::shared_ptr<TSNode> member = bodyNode->children.at(mi);
          if ( member->nodeType == std::string("TSPropertySignature") ) {
            std::string propInfo = std::string("    - ") + member->name;
            if ( member->optional ) {
              propInfo = propInfo + std::string("?");
            }
            if ( member->readonly ) {
              propInfo = std::string("    - readonly ") + member->name;
              if ( member->optional ) {
                propInfo = propInfo + std::string("?");
              }
            }
            if ( member->typeAnnotation != NULL  ) {
              std::shared_ptr<TSNode> typeNode = member->typeAnnotation;
              if ( typeNode->typeAnnotation != NULL  ) {
                std::shared_ptr<TSNode> innerType = typeNode->typeAnnotation;
                propInfo = (propInfo + std::string(": ")) + TSParserMain::getTypeName(innerType);
              }
            }
            std::cout << propInfo << std::endl;
          }
        }
      }
    }
  }
  std::cout << std::string("") << std::endl;
  std::cout << (std::string("Total: ") + std::to_string(count)) + std::string(" interface(s)") << std::endl;
}
void  TSParserMain::listTypeAliases( std::shared_ptr<TSNode> program ) {
  int count = 0;
  for ( int idx = 0; idx != (int)(program->children.size()); idx++) {
    std::shared_ptr<TSNode> stmt = program->children.at(idx);
    if ( stmt->nodeType == std::string("TSTypeAliasDeclaration") ) {
      count = count + 1;
      std::string line = std::string("") + std::to_string(stmt->line);
      std::string typeInfo = std::string("  ") + stmt->name;
      if ( stmt->typeAnnotation != NULL  ) {
        std::shared_ptr<TSNode> typeNode = stmt->typeAnnotation;
        typeInfo = (typeInfo + std::string(" = ")) + TSParserMain::getTypeName(typeNode);
      }
      typeInfo = ((typeInfo + std::string(" [line ")) + line) + std::string("]");
      std::cout << typeInfo << std::endl;
    }
  }
  std::cout << std::string("") << std::endl;
  std::cout << (std::string("Total: ") + std::to_string(count)) + std::string(" type alias(es)") << std::endl;
}
void  TSParserMain::listFunctions( std::shared_ptr<TSNode> program ) {
  int count = 0;
  for ( int idx = 0; idx != (int)(program->children.size()); idx++) {
    std::shared_ptr<TSNode> stmt = program->children.at(idx);
    if ( stmt->nodeType == std::string("FunctionDeclaration") ) {
      count = count + 1;
      std::string line = std::string("") + std::to_string(stmt->line);
      std::string funcInfo = (std::string("  ") + stmt->name) + std::string("(");
      /** unused:  int paramCount = (int)(stmt->params.size())   **/ ;
      int pi = 0;
      for ( int paramIdx = 0; paramIdx != (int)(stmt->params.size()); paramIdx++) {
        std::shared_ptr<TSNode> param = stmt->params.at(paramIdx);
        if ( pi > 0 ) {
          funcInfo = funcInfo + std::string(", ");
        }
        funcInfo = funcInfo + param->name;
        if ( param->optional ) {
          funcInfo = funcInfo + std::string("?");
        }
        if ( param->typeAnnotation != NULL  ) {
          std::shared_ptr<TSNode> paramType = param->typeAnnotation;
          if ( paramType->typeAnnotation != NULL  ) {
            std::shared_ptr<TSNode> innerType = paramType->typeAnnotation;
            funcInfo = (funcInfo + std::string(": ")) + TSParserMain::getTypeName(innerType);
          }
        }
        pi = pi + 1;
      }
      funcInfo = funcInfo + std::string(")");
      if ( stmt->typeAnnotation != NULL  ) {
        std::shared_ptr<TSNode> retType = stmt->typeAnnotation;
        if ( retType->typeAnnotation != NULL  ) {
          std::shared_ptr<TSNode> innerRet = retType->typeAnnotation;
          funcInfo = (funcInfo + std::string(": ")) + TSParserMain::getTypeName(innerRet);
        }
      }
      funcInfo = ((funcInfo + std::string(" [line ")) + line) + std::string("]");
      std::cout << funcInfo << std::endl;
    }
  }
  std::cout << std::string("") << std::endl;
  std::cout << (std::string("Total: ") + std::to_string(count)) + std::string(" function(s)") << std::endl;
}
std::string  TSParserMain::getTypeName( std::shared_ptr<TSNode> typeNode ) {
  std::string nodeType = typeNode->nodeType;
  if ( nodeType == std::string("TSStringKeyword") ) {
    return std::string("string");
  }
  if ( nodeType == std::string("TSNumberKeyword") ) {
    return std::string("number");
  }
  if ( nodeType == std::string("TSBooleanKeyword") ) {
    return std::string("boolean");
  }
  if ( nodeType == std::string("TSAnyKeyword") ) {
    return std::string("any");
  }
  if ( nodeType == std::string("TSVoidKeyword") ) {
    return std::string("void");
  }
  if ( nodeType == std::string("TSNullKeyword") ) {
    return std::string("null");
  }
  if ( nodeType == std::string("TSUndefinedKeyword") ) {
    return std::string("undefined");
  }
  if ( nodeType == std::string("TSTypeReference") ) {
    std::string result = typeNode->name;
    if ( ((int)(typeNode->params.size())) > 0 ) {
      result = result + std::string("<");
      int gi = 0;
      for ( int gpIdx = 0; gpIdx != (int)(typeNode->params.size()); gpIdx++) {
        std::shared_ptr<TSNode> gp = typeNode->params.at(gpIdx);
        if ( gi > 0 ) {
          result = result + std::string(", ");
        }
        result = result + TSParserMain::getTypeName(gp);
        gi = gi + 1;
      }
      result = result + std::string(">");
    }
    return result;
  }
  if ( nodeType == std::string("TSUnionType") ) {
    std::string result_1 = std::string("");
    int ui = 0;
    for ( int utIdx = 0; utIdx != (int)(typeNode->children.size()); utIdx++) {
      std::shared_ptr<TSNode> ut = typeNode->children.at(utIdx);
      if ( ui > 0 ) {
        result_1 = result_1 + std::string(" | ");
      }
      result_1 = result_1 + TSParserMain::getTypeName(ut);
      ui = ui + 1;
    }
    return result_1;
  }
  return nodeType;
}
void  TSParserMain::parseFile( std::string filename , bool showTokens ) {
  std::string codeOpt = r_cpp_readFile( std::string(".") , filename);
  if ( codeOpt.empty() ) {
    std::cout << std::string("Error: Could not read file: ") + filename << std::endl;
    return;
  }
  std::string code = codeOpt;
  std::cout << (std::string("=== Parsing: ") + filename) + std::string(" ===") << std::endl;
  std::cout << std::string("") << std::endl;
  std::shared_ptr<TSLexer> lexer =  std::make_shared<TSLexer>(code);
  std::vector<std::shared_ptr<Token>> tokens = lexer->tokenize();
  if ( showTokens ) {
    std::cout << std::string("--- Tokens ---") << std::endl;
    for ( int ti = 0; ti != (int)(tokens.size()); ti++) {
      std::shared_ptr<Token> tok = tokens.at(ti);
      std::string output = ((tok->tokenType + std::string(": '")) + tok->value) + std::string("'");
      std::cout << output << std::endl;
    }
    std::cout << std::string("") << std::endl;
  }
  std::shared_ptr<TSParserSimple> parser =  std::make_shared<TSParserSimple>();
  parser->initParser(tokens);
  std::shared_ptr<TSNode> program = parser->parseProgram();
  std::cout << std::string("--- AST ---") << std::endl;
  std::cout << (std::string("Program with ") + std::to_string(((int)(program->children.size())))) + std::string(" statements:") << std::endl;
  std::cout << std::string("") << std::endl;
  for ( int idx = 0; idx != (int)(program->children.size()); idx++) {
    std::shared_ptr<TSNode> stmt = program->children.at(idx);
    TSParserMain::printNode(stmt, 0);
  }
}
void  TSParserMain::runDemo() {
  std::string code = std::string("\r\ninterface Person {\r\n  readonly id: number;\r\n  name: string;\r\n  age?: number;\r\n}\r\n\r\ntype ID = string | number;\r\n\r\ntype Result = Person | null;\r\n\r\nlet count: number = 42;\r\n\r\nconst message: string = 'hello';\r\n\r\nfunction greet(name: string, age?: number): string {\r\n  return name;\r\n}\r\n\r\nlet data: Array<string>;\r\n");
  std::cout << std::string("=== TypeScript Parser Demo ===") << std::endl;
  std::cout << std::string("") << std::endl;
  std::cout << std::string("Input:") << std::endl;
  std::cout << code << std::endl;
  std::cout << std::string("") << std::endl;
  std::cout << std::string("--- Tokens ---") << std::endl;
  std::shared_ptr<TSLexer> lexer =  std::make_shared<TSLexer>(code);
  std::vector<std::shared_ptr<Token>> tokens = lexer->tokenize();
  for ( int i = 0; i != (int)(tokens.size()); i++) {
    std::shared_ptr<Token> tok = tokens.at(i);
    std::string output = ((tok->tokenType + std::string(": '")) + tok->value) + std::string("'");
    std::cout << output << std::endl;
  }
  std::cout << std::string("") << std::endl;
  std::cout << std::string("--- AST ---") << std::endl;
  std::shared_ptr<TSParserSimple> parser =  std::make_shared<TSParserSimple>();
  parser->initParser(tokens);
  std::shared_ptr<TSNode> program = parser->parseProgram();
  std::cout << (std::string("Program with ") + std::to_string(((int)(program->children.size())))) + std::string(" statements:") << std::endl;
  std::cout << std::string("") << std::endl;
  for ( int idx = 0; idx != (int)(program->children.size()); idx++) {
    std::shared_ptr<TSNode> stmt = program->children.at(idx);
    TSParserMain::printNode(stmt, 0);
  }
}
void  TSParserMain::printNode( std::shared_ptr<TSNode> node , int depth ) {
  std::string indent = std::string("");
  int i = 0;
  while (i < depth) {
    indent = indent + std::string("  ");
    i = i + 1;
  }
  std::string nodeType = node->nodeType;
  std::string loc = (((std::string("[") + std::to_string(node->line)) + std::string(":")) + std::to_string(node->col)) + std::string("]");
  if ( nodeType == std::string("TSInterfaceDeclaration") ) {
    std::cout << (((indent + std::string("TSInterfaceDeclaration: ")) + node->name) + std::string(" ")) + loc << std::endl;
    if ( node->body != NULL  ) {
      TSParserMain::printNode(node->body, depth + 1);
    }
    return;
  }
  if ( nodeType == std::string("TSInterfaceBody") ) {
    std::cout << (indent + std::string("TSInterfaceBody ")) + loc << std::endl;
    for ( int mi = 0; mi != (int)(node->children.size()); mi++) {
      std::shared_ptr<TSNode> member = node->children.at(mi);
      TSParserMain::printNode(member, depth + 1);
    }
    return;
  }
  if ( nodeType == std::string("TSPropertySignature") ) {
    std::string modifiers = std::string("");
    if ( node->readonly ) {
      modifiers = std::string("readonly ");
    }
    if ( node->optional ) {
      modifiers = modifiers + std::string("optional ");
    }
    std::cout << ((((indent + std::string("TSPropertySignature: ")) + modifiers) + node->name) + std::string(" ")) + loc << std::endl;
    if ( node->typeAnnotation != NULL  ) {
      TSParserMain::printNode(node->typeAnnotation, depth + 1);
    }
    return;
  }
  if ( nodeType == std::string("TSTypeAliasDeclaration") ) {
    std::cout << (((indent + std::string("TSTypeAliasDeclaration: ")) + node->name) + std::string(" ")) + loc << std::endl;
    if ( node->typeAnnotation != NULL  ) {
      TSParserMain::printNode(node->typeAnnotation, depth + 1);
    }
    return;
  }
  if ( nodeType == std::string("TSTypeAnnotation") ) {
    std::cout << (indent + std::string("TSTypeAnnotation ")) + loc << std::endl;
    if ( node->typeAnnotation != NULL  ) {
      TSParserMain::printNode(node->typeAnnotation, depth + 1);
    }
    return;
  }
  if ( nodeType == std::string("TSUnionType") ) {
    std::cout << (indent + std::string("TSUnionType ")) + loc << std::endl;
    for ( int ti = 0; ti != (int)(node->children.size()); ti++) {
      std::shared_ptr<TSNode> typeNode = node->children.at(ti);
      TSParserMain::printNode(typeNode, depth + 1);
    }
    return;
  }
  if ( nodeType == std::string("TSTypeReference") ) {
    std::cout << (((indent + std::string("TSTypeReference: ")) + node->name) + std::string(" ")) + loc << std::endl;
    for ( int pi = 0; pi != (int)(node->params.size()); pi++) {
      std::shared_ptr<TSNode> param = node->params.at(pi);
      TSParserMain::printNode(param, depth + 1);
    }
    return;
  }
  if ( nodeType == std::string("TSArrayType") ) {
    std::cout << (indent + std::string("TSArrayType ")) + loc << std::endl;
    if ( node->left != NULL  ) {
      TSParserMain::printNode(node->left, depth + 1);
    }
    return;
  }
  if ( nodeType == std::string("TSStringKeyword") ) {
    std::cout << (indent + std::string("TSStringKeyword ")) + loc << std::endl;
    return;
  }
  if ( nodeType == std::string("TSNumberKeyword") ) {
    std::cout << (indent + std::string("TSNumberKeyword ")) + loc << std::endl;
    return;
  }
  if ( nodeType == std::string("TSBooleanKeyword") ) {
    std::cout << (indent + std::string("TSBooleanKeyword ")) + loc << std::endl;
    return;
  }
  if ( nodeType == std::string("TSAnyKeyword") ) {
    std::cout << (indent + std::string("TSAnyKeyword ")) + loc << std::endl;
    return;
  }
  if ( nodeType == std::string("TSNullKeyword") ) {
    std::cout << (indent + std::string("TSNullKeyword ")) + loc << std::endl;
    return;
  }
  if ( nodeType == std::string("TSVoidKeyword") ) {
    std::cout << (indent + std::string("TSVoidKeyword ")) + loc << std::endl;
    return;
  }
  if ( nodeType == std::string("VariableDeclaration") ) {
    std::cout << (((indent + std::string("VariableDeclaration (")) + node->kind) + std::string(") ")) + loc << std::endl;
    for ( int di = 0; di != (int)(node->children.size()); di++) {
      std::shared_ptr<TSNode> declarator = node->children.at(di);
      TSParserMain::printNode(declarator, depth + 1);
    }
    return;
  }
  if ( nodeType == std::string("VariableDeclarator") ) {
    std::cout << (((indent + std::string("VariableDeclarator: ")) + node->name) + std::string(" ")) + loc << std::endl;
    if ( node->typeAnnotation != NULL  ) {
      TSParserMain::printNode(node->typeAnnotation, depth + 1);
    }
    if ( node->init != NULL  ) {
      std::cout << indent + std::string("  init:") << std::endl;
      TSParserMain::printNode(node->init, depth + 2);
    }
    return;
  }
  if ( nodeType == std::string("FunctionDeclaration") ) {
    std::string paramNames = std::string("");
    for ( int pi_1 = 0; pi_1 != (int)(node->params.size()); pi_1++) {
      std::shared_ptr<TSNode> p = node->params.at(pi_1);
      if ( pi_1 > 0 ) {
        paramNames = paramNames + std::string(", ");
      }
      paramNames = paramNames + p->name;
      if ( p->optional ) {
        paramNames = paramNames + std::string("?");
      }
    }
    std::cout << (((((indent + std::string("FunctionDeclaration: ")) + node->name) + std::string("(")) + paramNames) + std::string(") ")) + loc << std::endl;
    if ( node->typeAnnotation != NULL  ) {
      std::cout << indent + std::string("  returnType:") << std::endl;
      TSParserMain::printNode(node->typeAnnotation, depth + 2);
    }
    if ( node->body != NULL  ) {
      TSParserMain::printNode(node->body, depth + 1);
    }
    return;
  }
  if ( nodeType == std::string("BlockStatement") ) {
    std::cout << (indent + std::string("BlockStatement ")) + loc << std::endl;
    for ( int si = 0; si != (int)(node->children.size()); si++) {
      std::shared_ptr<TSNode> stmt = node->children.at(si);
      TSParserMain::printNode(stmt, depth + 1);
    }
    return;
  }
  if ( nodeType == std::string("ExpressionStatement") ) {
    std::cout << (indent + std::string("ExpressionStatement ")) + loc << std::endl;
    if ( node->left != NULL  ) {
      TSParserMain::printNode(node->left, depth + 1);
    }
    return;
  }
  if ( nodeType == std::string("ReturnStatement") ) {
    std::cout << (indent + std::string("ReturnStatement ")) + loc << std::endl;
    if ( node->left != NULL  ) {
      TSParserMain::printNode(node->left, depth + 1);
    }
    return;
  }
  if ( nodeType == std::string("Identifier") ) {
    std::cout << (((indent + std::string("Identifier: ")) + node->name) + std::string(" ")) + loc << std::endl;
    return;
  }
  if ( nodeType == std::string("NumericLiteral") ) {
    std::cout << (((indent + std::string("NumericLiteral: ")) + node->value) + std::string(" ")) + loc << std::endl;
    return;
  }
  if ( nodeType == std::string("StringLiteral") ) {
    std::cout << (((indent + std::string("StringLiteral: ")) + node->value) + std::string(" ")) + loc << std::endl;
    return;
  }
  std::cout << ((indent + nodeType) + std::string(" ")) + loc << std::endl;
}
int main(int argc, char* argv[]) {
  __g_argc = argc;
  __g_argv = argv;
  int argCnt = __g_argc - 1;
  if ( argCnt == 0 ) {
    TSParserMain::showHelp();
    return 0;
  }
  std::string inputFile = std::string("");
  bool runDefault = false;
  bool showTokens = false;
  bool showInterfaces = false;
  bool showTypes = false;
  bool showFunctions = false;
  int i = 0;
  while (i < argCnt) {
    std::string arg = std::string(__g_argv[i + 1]);
    if ( (arg == std::string("--help")) || (arg == std::string("-h")) ) {
      TSParserMain::showHelp();
      return 0;
    }
    if ( arg == std::string("-d") ) {
      runDefault = true;
      i = i + 1;
    } else {
      if ( arg == std::string("-i") ) {
        i = i + 1;
        if ( i < argCnt ) {
          inputFile = std::string(__g_argv[i + 1]);
        }
        i = i + 1;
      } else {
        if ( arg == std::string("--tokens") ) {
          showTokens = true;
          i = i + 1;
        } else {
          if ( arg == std::string("--show-interfaces") ) {
            showInterfaces = true;
            i = i + 1;
          } else {
            if ( arg == std::string("--show-types") ) {
              showTypes = true;
              i = i + 1;
            } else {
              if ( arg == std::string("--show-functions") ) {
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
  if ( runDefault ) {
    TSParserMain::runDemo();
    return 0;
  }
  if ( ((int)(inputFile.length())) > 0 ) {
    if ( (showInterfaces || showTypes) || showFunctions ) {
      TSParserMain::listDeclarations(inputFile, showInterfaces, showTypes, showFunctions);
      return 0;
    }
    TSParserMain::parseFile(inputFile, showTokens);
    return 0;
  }
  TSParserMain::showHelp();
  return 0;
}
