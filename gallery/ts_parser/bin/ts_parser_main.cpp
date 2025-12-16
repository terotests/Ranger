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
    /* class constructor */ 
    TSParserSimple( );
    /* instance methods */ 
    void initParser( std::vector<std::shared_ptr<Token>> toks );
    void setQuiet( bool q );
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
    std::shared_ptr<TSNode> parseReturn();
    std::shared_ptr<TSNode> parseInterface();
    std::shared_ptr<TSNode> parseInterfaceBody();
    std::shared_ptr<TSNode> parsePropertySig();
    std::shared_ptr<TSNode> parseTypeAlias();
    std::shared_ptr<TSNode> parseVarDecl();
    std::shared_ptr<TSNode> parseFuncDecl();
    std::shared_ptr<TSNode> parseParam();
    std::shared_ptr<TSNode> parseBlock();
    std::shared_ptr<TSNode> parseExprStmt();
    std::shared_ptr<TSNode> parseTypeAnnotation();
    std::shared_ptr<TSNode> parseType();
    std::shared_ptr<TSNode> parseUnionType();
    std::shared_ptr<TSNode> parseArrayType();
    bool checkNext( std::string value );
    std::shared_ptr<TSNode> parsePrimaryType();
    std::shared_ptr<TSNode> parseTypeRef();
    std::shared_ptr<TSNode> parseExpr();
    std::shared_ptr<TSNode> parseAssign();
    std::shared_ptr<TSNode> parseBinary();
    std::shared_ptr<TSNode> parseUnary();
    std::shared_ptr<TSNode> parseCall();
    std::shared_ptr<TSNode> parsePrimary();
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
  if ( tokVal == std::string("interface") ) {
    return this->parseInterface();
  }
  if ( tokVal == std::string("type") ) {
    return this->parseTypeAlias();
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
  this->expectValue(std::string("="));
  std::shared_ptr<TSNode> typeExpr = this->parseType();
  node->typeAnnotation  = typeExpr;
  if ( this->matchValue(std::string(";")) ) {
    this->advance();
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
  this->expectValue(std::string("("));
  while (this->matchValue(std::string(")")) == false) {
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
  return this->parseUnionType();
}
std::shared_ptr<TSNode>  TSParserSimple::parseUnionType() {
  std::shared_ptr<TSNode> left = this->parseArrayType();
  if ( this->matchValue(std::string("|")) ) {
    std::shared_ptr<TSNode> _union =  std::make_shared<TSNode>();
    _union->nodeType = std::string("TSUnionType");
    _union->start = left->start;
    _union->line = left->line;
    _union->col = left->col;
    _union->children.push_back( left  );
    while (this->matchValue(std::string("|"))) {
      this->advance();
      std::shared_ptr<TSNode> right = this->parseArrayType();
      _union->children.push_back( right  );
    }
    return _union;
  }
  return left;
}
std::shared_ptr<TSNode>  TSParserSimple::parseArrayType() {
  std::shared_ptr<TSNode> elemType = this->parsePrimaryType();
  while (this->matchValue(std::string("[")) && this->checkNext(std::string("]"))) {
    this->advance();
    this->advance();
    std::shared_ptr<TSNode> arrayType =  std::make_shared<TSNode>();
    arrayType->nodeType = std::string("TSArrayType");
    arrayType->start = elemType->start;
    arrayType->line = elemType->line;
    arrayType->col = elemType->col;
    arrayType->left  = elemType;
    elemType = arrayType;
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
  if ( tokVal == std::string("string") ) {
    this->advance();
    std::shared_ptr<TSNode> node =  std::make_shared<TSNode>();
    node->nodeType = std::string("TSStringKeyword");
    node->start = tok->start;
    node->end = tok->end;
    node->line = tok->line;
    node->col = tok->col;
    return node;
  }
  if ( tokVal == std::string("number") ) {
    this->advance();
    std::shared_ptr<TSNode> node_1 =  std::make_shared<TSNode>();
    node_1->nodeType = std::string("TSNumberKeyword");
    node_1->start = tok->start;
    node_1->end = tok->end;
    node_1->line = tok->line;
    node_1->col = tok->col;
    return node_1;
  }
  if ( tokVal == std::string("boolean") ) {
    this->advance();
    std::shared_ptr<TSNode> node_2 =  std::make_shared<TSNode>();
    node_2->nodeType = std::string("TSBooleanKeyword");
    node_2->start = tok->start;
    node_2->end = tok->end;
    node_2->line = tok->line;
    node_2->col = tok->col;
    return node_2;
  }
  if ( tokVal == std::string("any") ) {
    this->advance();
    std::shared_ptr<TSNode> node_3 =  std::make_shared<TSNode>();
    node_3->nodeType = std::string("TSAnyKeyword");
    node_3->start = tok->start;
    node_3->end = tok->end;
    node_3->line = tok->line;
    node_3->col = tok->col;
    return node_3;
  }
  if ( tokVal == std::string("unknown") ) {
    this->advance();
    std::shared_ptr<TSNode> node_4 =  std::make_shared<TSNode>();
    node_4->nodeType = std::string("TSUnknownKeyword");
    node_4->start = tok->start;
    node_4->end = tok->end;
    node_4->line = tok->line;
    node_4->col = tok->col;
    return node_4;
  }
  if ( tokVal == std::string("void") ) {
    this->advance();
    std::shared_ptr<TSNode> node_5 =  std::make_shared<TSNode>();
    node_5->nodeType = std::string("TSVoidKeyword");
    node_5->start = tok->start;
    node_5->end = tok->end;
    node_5->line = tok->line;
    node_5->col = tok->col;
    return node_5;
  }
  if ( tokVal == std::string("null") ) {
    this->advance();
    std::shared_ptr<TSNode> node_6 =  std::make_shared<TSNode>();
    node_6->nodeType = std::string("TSNullKeyword");
    node_6->start = tok->start;
    node_6->end = tok->end;
    node_6->line = tok->line;
    node_6->col = tok->col;
    return node_6;
  }
  std::string tokType = this->peekType();
  if ( tokType == std::string("Identifier") ) {
    return this->parseTypeRef();
  }
  if ( tokVal == std::string("(") ) {
    this->advance();
    std::shared_ptr<TSNode> innerType = this->parseType();
    this->expectValue(std::string(")"));
    return innerType;
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
    while (this->matchValue(std::string(">")) == false) {
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
std::shared_ptr<TSNode>  TSParserSimple::parseExpr() {
  return this->parseAssign();
}
std::shared_ptr<TSNode>  TSParserSimple::parseAssign() {
  std::shared_ptr<TSNode> left = this->parseBinary();
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
  return this->parseCall();
}
std::shared_ptr<TSNode>  TSParserSimple::parseCall() {
  std::shared_ptr<TSNode> callee = this->parsePrimary();
  while (this->matchValue(std::string("("))) {
    this->advance();
    std::shared_ptr<TSNode> call =  std::make_shared<TSNode>();
    call->nodeType = std::string("CallExpression");
    call->left  = callee;
    call->start = callee->start;
    call->line = callee->line;
    call->col = callee->col;
    while (this->matchValue(std::string(")")) == false) {
      if ( ((int)(call->children.size())) > 0 ) {
        this->expectValue(std::string(","));
      }
      std::shared_ptr<TSNode> arg = this->parseExpr();
      call->children.push_back( arg  );
    }
    this->expectValue(std::string(")"));
    callee = call;
  }
  return callee;
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
  if ( tokVal == std::string("(") ) {
    this->advance();
    std::shared_ptr<TSNode> expr = this->parseExpr();
    this->expectValue(std::string(")"));
    return expr;
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
