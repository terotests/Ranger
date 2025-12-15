#include  <memory>
#include  "variant.hpp"
#include  <string>
#include  <vector>
#include  <iostream>
#include  <fstream>

// define classes here to avoid compiler errors
class Token;
class Lexer;
class Position;
class SourceLocation;
class JSNode;
class SimpleParser;
class ASTPrinter;
class JSPrinter;
class JSParserMain;

typedef mpark::variant<std::shared_ptr<Token>, std::shared_ptr<Lexer>, std::shared_ptr<Position>, std::shared_ptr<SourceLocation>, std::shared_ptr<JSNode>, std::shared_ptr<SimpleParser>, std::shared_ptr<ASTPrinter>, std::shared_ptr<JSPrinter>, std::shared_ptr<JSParserMain>, int, std::string, bool, double>  r_union_Any;

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


std::string r_utf8_substr(const std::string& str, int start_i, int leng_i)
{
    unsigned int start ((unsigned int)start_i);
    unsigned int leng ((unsigned int)leng_i);
    if (leng==0) { return ""; }
    unsigned int c, i, ix, q, min= (unsigned int) std::string::npos, max=(unsigned int)std::string::npos;
    for (q=0, i=0, ix=str.length(); i < ix; i++, q++)
    {
        if (q==start){ min=i; }
        if (q<=start+leng || leng==std::string::npos){ max=i; }
        c = (unsigned char) str[i];
        if(c<=127) i+=0;
        else if ((c & 0xE0) == 0xC0) i+=1;
        else if ((c & 0xF0) == 0xE0) i+=2;
        else if ((c & 0xF8) == 0xF0) i+=3;
        else return ""; //invalid utf8
    }
    if (q<=start+leng || leng==std::string::npos){ max=i; }
    if (min==std::string::npos || max==std::string::npos) { return ""; }
    return str.substr(min, max - min);
}


std::string  r_cpp_readFile(std::string path, std::string filename)
{
  std::ifstream ifs(path + "/" + filename);
  std::string content( (std::istreambuf_iterator<char>(ifs) ),
                       (std::istreambuf_iterator<char>()    ) );
  return content;
}


void  r_cpp_write_file(std::string path, std::string filename, std::string text)
{
  std::ofstream outputFile;
  outputFile.open(path + "/" + filename);
  outputFile << text;
  outputFile.close();
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
class Lexer : public std::enable_shared_from_this<Lexer>  { 
  public :
    std::string source;
    int pos;
    int line;
    int col;
    int __len;
    /* class constructor */ 
    Lexer( std::string src  );
    /* instance methods */ 
    std::string peek();
    std::string peekAt( int offset );
    std::string advance();
    bool isDigit( std::string ch );
    bool isAlpha( std::string ch );
    bool isAlphaNumCh( std::string ch );
    bool isWhitespace( std::string ch );
    void skipWhitespace();
    std::shared_ptr<Token> readLineComment();
    std::shared_ptr<Token> readBlockComment();
    std::shared_ptr<Token> makeToken( std::string tokType , std::string value , int startPos , int startLine , int startCol );
    std::shared_ptr<Token> readString( std::string quote );
    std::shared_ptr<Token> readTemplateLiteral();
    std::shared_ptr<Token> readNumber();
    std::shared_ptr<Token> readIdentifier();
    std::string identType( std::string value );
    std::shared_ptr<Token> nextToken();
    std::shared_ptr<Token> readRegexLiteral();
    std::vector<std::shared_ptr<Token>> tokenize();
};
class Position : public std::enable_shared_from_this<Position>  { 
  public :
    int line     /** note: unused */;
    int column     /** note: unused */;
    /* class constructor */ 
    Position( );
};
class SourceLocation : public std::enable_shared_from_this<SourceLocation>  { 
  public :
    std::shared_ptr<Position> start     /** note: unused */;
    std::shared_ptr<Position> end     /** note: unused */;
    /* class constructor */ 
    SourceLocation( );
};
class JSNode : public std::enable_shared_from_this<JSNode>  { 
  public :
    std::string type;
    std::shared_ptr<SourceLocation> loc     /** note: unused */;
    int start;
    int end;
    int line;
    int col;
    std::string name;
    std::string raw;
    std::string regexPattern;
    std::string regexFlags;
    std::string _operator;
    bool prefix;
    std::shared_ptr<JSNode> left;
    std::shared_ptr<JSNode> right;
    std::shared_ptr<JSNode> argument;
    std::shared_ptr<JSNode> test;
    std::shared_ptr<JSNode> consequent     /** note: unused */;
    std::shared_ptr<JSNode> alternate;
    std::shared_ptr<JSNode> id;
    std::vector<std::shared_ptr<JSNode>> params     /** note: unused */;
    std::shared_ptr<JSNode> body;
    bool generator;
    bool async;
    bool expression     /** note: unused */;
    std::vector<std::shared_ptr<JSNode>> declarations     /** note: unused */;
    std::string kind;
    std::shared_ptr<JSNode> init;
    std::shared_ptr<JSNode> superClass;
    std::shared_ptr<JSNode> object     /** note: unused */;
    std::shared_ptr<JSNode> property     /** note: unused */;
    bool computed;
    bool optional     /** note: unused */;
    std::shared_ptr<JSNode> callee     /** note: unused */;
    std::vector<std::shared_ptr<JSNode>> arguments     /** note: unused */;
    std::vector<std::shared_ptr<JSNode>> elements     /** note: unused */;
    std::vector<std::shared_ptr<JSNode>> properties     /** note: unused */;
    std::shared_ptr<JSNode> key;
    bool method     /** note: unused */;
    bool shorthand;
    std::shared_ptr<JSNode> update     /** note: unused */;
    std::shared_ptr<JSNode> discriminant     /** note: unused */;
    std::vector<std::shared_ptr<JSNode>> cases     /** note: unused */;
    std::vector<std::shared_ptr<JSNode>> consequentStatements     /** note: unused */;
    std::shared_ptr<JSNode> block     /** note: unused */;
    std::shared_ptr<JSNode> handler     /** note: unused */;
    std::shared_ptr<JSNode> finalizer     /** note: unused */;
    std::shared_ptr<JSNode> param     /** note: unused */;
    std::shared_ptr<JSNode> source     /** note: unused */;
    std::vector<std::shared_ptr<JSNode>> specifiers     /** note: unused */;
    std::shared_ptr<JSNode> imported;
    std::shared_ptr<JSNode> local;
    std::shared_ptr<JSNode> exported;
    std::shared_ptr<JSNode> declaration     /** note: unused */;
    std::vector<std::shared_ptr<JSNode>> quasis     /** note: unused */;
    std::vector<std::shared_ptr<JSNode>> expressions     /** note: unused */;
    bool tail     /** note: unused */;
    std::string cooked     /** note: unused */;
    std::string sourceType     /** note: unused */;
    bool _static;
    bool delegate;
    std::vector<std::shared_ptr<JSNode>> children;
    std::vector<std::shared_ptr<JSNode>> leadingComments;
    std::vector<std::shared_ptr<JSNode>> trailingComments     /** note: unused */;
    /* class constructor */ 
    JSNode( );
};
class SimpleParser : public std::enable_shared_from_this<SimpleParser>  { 
  public :
    std::vector<std::shared_ptr<Token>> tokens;
    int pos;
    std::shared_ptr<Token> currentToken;
    std::vector<std::string> errors;
    std::vector<std::shared_ptr<JSNode>> pendingComments;
    std::string source;
    std::shared_ptr<Lexer> lexer;
    /* class constructor */ 
    SimpleParser( );
    /* instance methods */ 
    void initParser( std::vector<std::shared_ptr<Token>> toks );
    void initParserWithSource( std::vector<std::shared_ptr<Token>> toks , std::string src );
    bool isCommentToken();
    void skipComments();
    void advanceRaw();
    std::vector<std::shared_ptr<JSNode>> collectComments();
    void attachComments( std::shared_ptr<JSNode> node );
    std::shared_ptr<Token> peek();
    std::string peekType();
    std::string peekValue();
    void advance();
    void addError( std::string msg );
    std::shared_ptr<Token> expect( std::string expectedType );
    std::shared_ptr<Token> expectValue( std::string expectedValue );
    bool isAtEnd();
    bool matchType( std::string tokenType );
    bool matchValue( std::string value );
    bool hasErrors();
    std::shared_ptr<JSNode> parseRegexLiteral();
    std::shared_ptr<JSNode> parseProgram();
    std::shared_ptr<JSNode> parseStatement();
    std::shared_ptr<JSNode> parseVarDecl();
    std::shared_ptr<JSNode> parseLetDecl();
    std::shared_ptr<JSNode> parseConstDecl();
    std::shared_ptr<JSNode> parseFuncDecl();
    std::shared_ptr<JSNode> parseFunctionExpression();
    std::shared_ptr<JSNode> parseAsyncFuncDecl();
    std::shared_ptr<JSNode> parseClass();
    std::shared_ptr<JSNode> parseClassMethod();
    std::string peekAt( int offset );
    std::shared_ptr<JSNode> parseImport();
    void parseImportSpecifiers( std::shared_ptr<JSNode> importNode );
    std::shared_ptr<JSNode> parseExport();
    void parseExportSpecifiers( std::shared_ptr<JSNode> exportNode );
    std::shared_ptr<JSNode> parseBlock();
    std::shared_ptr<JSNode> parseReturn();
    std::shared_ptr<JSNode> parseIf();
    std::shared_ptr<JSNode> parseWhile();
    std::shared_ptr<JSNode> parseDoWhile();
    std::shared_ptr<JSNode> parseFor();
    std::shared_ptr<JSNode> parseSwitch();
    std::shared_ptr<JSNode> parseTry();
    std::shared_ptr<JSNode> parseThrow();
    std::shared_ptr<JSNode> parseBreak();
    std::shared_ptr<JSNode> parseContinue();
    std::shared_ptr<JSNode> parseExprStmt();
    std::shared_ptr<JSNode> parseExpr();
    std::shared_ptr<JSNode> parseAssignment();
    std::shared_ptr<JSNode> parseTernary();
    std::shared_ptr<JSNode> parseLogicalOr();
    std::shared_ptr<JSNode> parseNullishCoalescing();
    std::shared_ptr<JSNode> parseLogicalAnd();
    std::shared_ptr<JSNode> parseEquality();
    std::shared_ptr<JSNode> parseComparison();
    std::shared_ptr<JSNode> parseAdditive();
    std::shared_ptr<JSNode> parseMultiplicative();
    std::shared_ptr<JSNode> parseUnary();
    std::shared_ptr<JSNode> parseCallMember();
    std::shared_ptr<JSNode> parseNewExpression();
    std::shared_ptr<JSNode> parsePrimary();
    std::shared_ptr<JSNode> parseArray();
    std::shared_ptr<JSNode> parseObject();
    std::shared_ptr<JSNode> parseArrayPattern();
    std::shared_ptr<JSNode> parseObjectPattern();
    bool isArrowFunction();
    std::shared_ptr<JSNode> parseArrowFunction();
    std::shared_ptr<JSNode> parseAsyncArrowFunction();
};
class ASTPrinter : public std::enable_shared_from_this<ASTPrinter>  { 
  public :
    /* class constructor */ 
    ASTPrinter( );
    /* static methods */ 
    static void printNode( std::shared_ptr<JSNode> node , int depth );
};
class JSPrinter : public std::enable_shared_from_this<JSPrinter>  { 
  public :
    int indentLevel;
    std::string indentStr;
    std::string output;
    /* class constructor */ 
    JSPrinter( );
    /* instance methods */ 
    std::string getIndent();
    void emit( std::string text );
    void emitLine( std::string text );
    void emitIndent();
    void indent();
    void dedent();
    void printLeadingComments( std::shared_ptr<JSNode> node );
    void printComment( std::shared_ptr<JSNode> comment );
    void printJSDocComment( std::string value );
    std::string print( std::shared_ptr<JSNode> node );
    void printNode( std::shared_ptr<JSNode> node );
    void printProgram( std::shared_ptr<JSNode> node );
    void printStatement( std::shared_ptr<JSNode> node );
    void printVariableDeclaration( std::shared_ptr<JSNode> node );
    void printVariableDeclarator( std::shared_ptr<JSNode> node );
    void printFunctionDeclaration( std::shared_ptr<JSNode> node );
    void printParams( std::vector<std::shared_ptr<JSNode>> params );
    void printClassDeclaration( std::shared_ptr<JSNode> node );
    void printClassBody( std::shared_ptr<JSNode> node );
    void printMethodDefinition( std::shared_ptr<JSNode> node );
    void printBlockStatement( std::shared_ptr<JSNode> node );
    void printExpressionStatement( std::shared_ptr<JSNode> node );
    void printReturnStatement( std::shared_ptr<JSNode> node );
    void printIfStatement( std::shared_ptr<JSNode> node );
    void printWhileStatement( std::shared_ptr<JSNode> node );
    void printDoWhileStatement( std::shared_ptr<JSNode> node );
    void printForStatement( std::shared_ptr<JSNode> node );
    void printForOfStatement( std::shared_ptr<JSNode> node );
    void printForInStatement( std::shared_ptr<JSNode> node );
    void printSwitchStatement( std::shared_ptr<JSNode> node );
    void printSwitchCase( std::shared_ptr<JSNode> node );
    void printTryStatement( std::shared_ptr<JSNode> node );
    void printThrowStatement( std::shared_ptr<JSNode> node );
    void printLiteral( std::shared_ptr<JSNode> node );
    void printArrayExpression( std::shared_ptr<JSNode> node );
    void printObjectExpression( std::shared_ptr<JSNode> node );
    void printProperty( std::shared_ptr<JSNode> node );
    void printBinaryExpression( std::shared_ptr<JSNode> node );
    void printUnaryExpression( std::shared_ptr<JSNode> node );
    void printUpdateExpression( std::shared_ptr<JSNode> node );
    void printAssignmentExpression( std::shared_ptr<JSNode> node );
    void printConditionalExpression( std::shared_ptr<JSNode> node );
    void printCallExpression( std::shared_ptr<JSNode> node );
    void printMemberExpression( std::shared_ptr<JSNode> node );
    void printOptionalMemberExpression( std::shared_ptr<JSNode> node );
    void printOptionalCallExpression( std::shared_ptr<JSNode> node );
    void printImportDeclaration( std::shared_ptr<JSNode> node );
    void printExportNamedDeclaration( std::shared_ptr<JSNode> node );
    void printExportDefaultDeclaration( std::shared_ptr<JSNode> node );
    void printExportAllDeclaration( std::shared_ptr<JSNode> node );
    void printNewExpression( std::shared_ptr<JSNode> node );
    void printArrowFunction( std::shared_ptr<JSNode> node );
    void printFunctionExpression( std::shared_ptr<JSNode> node );
    void printYieldExpression( std::shared_ptr<JSNode> node );
    void printAwaitExpression( std::shared_ptr<JSNode> node );
    void printSpreadElement( std::shared_ptr<JSNode> node );
    void printArrayPattern( std::shared_ptr<JSNode> node );
    void printObjectPattern( std::shared_ptr<JSNode> node );
};
class JSParserMain : public std::enable_shared_from_this<JSParserMain>  { 
  public :
    /* class constructor */ 
    JSParserMain( );
    /* static methods */ 
    static void m();
    static void showHelp();
    static void processFile( std::string inputFile , std::string outputFile );
    static void parseFile( std::string filename );
    static void runDemo();
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
Lexer::Lexer( std::string src  ) {
  this->source = std::string("");
  this->pos = 0;
  this->line = 1;
  this->col = 1;
  this->__len = 0;
  source = src;
  __len = (int)(src.length());
}
std::string  Lexer::peek() {
  if ( pos >= __len ) {
    return std::string("");
  }
  return r_utf8_char_at(source, pos);
}
std::string  Lexer::peekAt( int offset ) {
  int idx = pos + offset;
  if ( idx >= __len ) {
    return std::string("");
  }
  return r_utf8_char_at(source, idx);
}
std::string  Lexer::advance() {
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
bool  Lexer::isDigit( std::string ch ) {
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
bool  Lexer::isAlpha( std::string ch ) {
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
bool  Lexer::isAlphaNumCh( std::string ch ) {
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
bool  Lexer::isWhitespace( std::string ch ) {
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
void  Lexer::skipWhitespace() {
  while (pos < __len) {
    std::string ch = this->peek();
    if ( this->isWhitespace(ch) ) {
      this->advance();
    } else {
      return;
    }
  }
}
std::shared_ptr<Token>  Lexer::readLineComment() {
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
std::shared_ptr<Token>  Lexer::readBlockComment() {
  int startPos = pos;
  int startLine = line;
  int startCol = col;
  this->advance();
  this->advance();
  std::string value = std::string("");
  bool isJSDoc = false;
  if ( this->peek() == std::string("*") ) {
    std::string nextCh = this->peekAt(1);
    if ( nextCh != std::string("/") ) {
      isJSDoc = true;
    }
  }
  while (pos < __len) {
    std::string ch = this->peek();
    if ( ch == std::string("*") ) {
      if ( this->peekAt(1) == std::string("/") ) {
        this->advance();
        this->advance();
        if ( isJSDoc ) {
          return this->makeToken(std::string("JSDocComment"), value, startPos, startLine, startCol);
        }
        return this->makeToken(std::string("BlockComment"), value, startPos, startLine, startCol);
      }
    }
    value = value + this->advance();
  }
  if ( isJSDoc ) {
    return this->makeToken(std::string("JSDocComment"), value, startPos, startLine, startCol);
  }
  return this->makeToken(std::string("BlockComment"), value, startPos, startLine, startCol);
}
std::shared_ptr<Token>  Lexer::makeToken( std::string tokType , std::string value , int startPos , int startLine , int startCol ) {
  std::shared_ptr<Token> tok =  std::make_shared<Token>();
  tok->tokenType = tokType;
  tok->value = value;
  tok->start = startPos;
  tok->end = pos;
  tok->line = startLine;
  tok->col = startCol;
  return tok;
}
std::shared_ptr<Token>  Lexer::readString( std::string quote ) {
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
std::shared_ptr<Token>  Lexer::readTemplateLiteral() {
  int startPos = pos;
  int startLine = line;
  int startCol = col;
  this->advance();
  std::string value = std::string("");
  bool hasExpressions = false;
  while (pos < __len) {
    std::string ch = this->peek();
    if ( ch == std::string("`") ) {
      this->advance();
      if ( hasExpressions ) {
        return this->makeToken(std::string("TemplateLiteral"), value, startPos, startLine, startCol);
      } else {
        return this->makeToken(std::string("TemplateLiteral"), value, startPos, startLine, startCol);
      }
    }
    if ( ch == std::string("\\") ) {
      this->advance();
      std::string esc = this->advance();
      if ( esc == std::string("n") ) {
        value = value + std::string("\n");
      }
      if ( esc == std::string("t") ) {
        value = value + std::string("\t");
      }
      if ( esc == std::string("r") ) {
        value = value + std::string("\r");
      }
      if ( esc == std::string("\\") ) {
        value = value + std::string("\\");
      }
      if ( esc == std::string("`") ) {
        value = value + std::string("`");
      }
      if ( esc == std::string("$") ) {
        value = value + std::string("$");
      }
    } else {
      if ( ch == std::string("$") ) {
        if ( this->peekAt(1) == std::string("{") ) {
          hasExpressions = true;
          value = value + this->advance();
          value = value + this->advance();
        } else {
          value = value + this->advance();
        }
      } else {
        value = value + this->advance();
      }
    }
  }
  return this->makeToken(std::string("TemplateLiteral"), value, startPos, startLine, startCol);
}
std::shared_ptr<Token>  Lexer::readNumber() {
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
std::shared_ptr<Token>  Lexer::readIdentifier() {
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
std::string  Lexer::identType( std::string value ) {
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
std::shared_ptr<Token>  Lexer::nextToken() {
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
std::shared_ptr<Token>  Lexer::readRegexLiteral() {
  int startPos = pos;
  int startLine = line;
  int startCol = col;
  this->advance();
  std::string pattern = std::string("");
  bool inCharClass = false;
  while (pos < __len) {
    std::string ch = this->peek();
    if ( ch == std::string("[") ) {
      inCharClass = true;
      pattern = pattern + this->advance();
    } else {
      if ( ch == std::string("]") ) {
        inCharClass = false;
        pattern = pattern + this->advance();
      } else {
        if ( ch == std::string("\\") ) {
          pattern = pattern + this->advance();
          if ( pos < __len ) {
            pattern = pattern + this->advance();
          }
        } else {
          if ( (ch == std::string("/")) && (inCharClass == false) ) {
            this->advance();
            break;
          } else {
            if ( ((ch == std::string("\n")) || (ch == std::string("\r"))) || (ch == std::string("\r\n")) ) {
              return this->makeToken(std::string("RegexLiteral"), pattern, startPos, startLine, startCol);
            } else {
              pattern = pattern + this->advance();
            }
          }
        }
      }
    }
  }
  std::string flags = std::string("");
  while (pos < __len) {
    std::string ch_1 = this->peek();
    if ( (((((ch_1 == std::string("g")) || (ch_1 == std::string("i"))) || (ch_1 == std::string("m"))) || (ch_1 == std::string("s"))) || (ch_1 == std::string("u"))) || (ch_1 == std::string("y")) ) {
      flags = flags + this->advance();
    } else {
      break;
    }
  }
  std::string fullValue = (pattern + std::string("/")) + flags;
  return this->makeToken(std::string("RegexLiteral"), fullValue, startPos, startLine, startCol);
}
std::vector<std::shared_ptr<Token>>  Lexer::tokenize() {
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
Position::Position( ) {
  this->line = 1;
  this->column = 0;
}
SourceLocation::SourceLocation( ) {
}
JSNode::JSNode( ) {
  this->type = std::string("");
  this->start = 0;
  this->end = 0;
  this->line = 0;
  this->col = 0;
  this->name = std::string("");
  this->raw = std::string("");
  this->regexPattern = std::string("");
  this->regexFlags = std::string("");
  this->_operator = std::string("");
  this->prefix = false;
  this->generator = false;
  this->async = false;
  this->expression = false;
  this->kind = std::string("");
  this->computed = false;
  this->optional = false;
  this->method = false;
  this->shorthand = false;
  this->tail = false;
  this->cooked = std::string("");
  this->sourceType = std::string("");
  this->_static = false;
  this->delegate = false;
}
SimpleParser::SimpleParser( ) {
  this->pos = 0;
  this->source = std::string("");
}
void  SimpleParser::initParser( std::vector<std::shared_ptr<Token>> toks ) {
  this->tokens = toks;
  this->pos = 0;
  if ( ((int)(toks.size())) > 0 ) {
    this->currentToken  = toks.at(0);
  }
  this->skipComments();
}
void  SimpleParser::initParserWithSource( std::vector<std::shared_ptr<Token>> toks , std::string src ) {
  this->tokens = toks;
  this->source = src;
  this->lexer  =  std::make_shared<Lexer>(src);
  this->pos = 0;
  if ( ((int)(toks.size())) > 0 ) {
    this->currentToken  = toks.at(0);
  }
  this->skipComments();
}
bool  SimpleParser::isCommentToken() {
  std::string t = this->peekType();
  if ( t == std::string("LineComment") ) {
    return true;
  }
  if ( t == std::string("BlockComment") ) {
    return true;
  }
  if ( t == std::string("JSDocComment") ) {
    return true;
  }
  return false;
}
void  SimpleParser::skipComments() {
  while (this->isCommentToken()) {
    std::shared_ptr<Token> tok = this->peek();
    std::shared_ptr<JSNode> commentNode =  std::make_shared<JSNode>();
    commentNode->type = tok->tokenType;
    commentNode->raw = tok->value;
    commentNode->line = tok->line;
    commentNode->col = tok->col;
    commentNode->start = tok->start;
    commentNode->end = tok->end;
    this->pendingComments.push_back( commentNode  );
    this->advanceRaw();
  }
}
void  SimpleParser::advanceRaw() {
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
std::vector<std::shared_ptr<JSNode>>  SimpleParser::collectComments() {
  std::vector<std::shared_ptr<JSNode>> comments;
  for ( int i = 0; i != (int)(this->pendingComments.size()); i++) {
    std::shared_ptr<JSNode> c = this->pendingComments.at(i);
    comments.push_back( c  );
  }
  std::vector<std::shared_ptr<JSNode>> empty;
  this->pendingComments = empty;
  return comments;
}
void  SimpleParser::attachComments( std::shared_ptr<JSNode> node ) {
  std::vector<std::shared_ptr<JSNode>> comments = this->collectComments();
  for ( int i = 0; i != (int)(comments.size()); i++) {
    std::shared_ptr<JSNode> c = comments.at(i);
    node->leadingComments.push_back( c  );
  }
}
std::shared_ptr<Token>  SimpleParser::peek() {
  return this->currentToken;
}
std::string  SimpleParser::peekType() {
  if ( this->currentToken == NULL ) {
    return std::string("EOF");
  }
  std::shared_ptr<Token> tok = this->currentToken;
  return tok->tokenType;
}
std::string  SimpleParser::peekValue() {
  if ( this->currentToken == NULL ) {
    return std::string("");
  }
  std::shared_ptr<Token> tok = this->currentToken;
  return tok->value;
}
void  SimpleParser::advance() {
  this->advanceRaw();
  this->skipComments();
}
void  SimpleParser::addError( std::string msg ) {
  this->errors.push_back( msg  );
}
std::shared_ptr<Token>  SimpleParser::expect( std::string expectedType ) {
  std::shared_ptr<Token> tok = this->peek();
  if ( tok->tokenType != expectedType ) {
    std::string err = ((((((std::string("Parse error at line ") + std::to_string(tok->line)) + std::string(":")) + std::to_string(tok->col)) + std::string(": expected ")) + expectedType) + std::string(" but got ")) + tok->tokenType;
    this->addError(err);
  }
  this->advance();
  return tok;
}
std::shared_ptr<Token>  SimpleParser::expectValue( std::string expectedValue ) {
  std::shared_ptr<Token> tok = this->peek();
  if ( tok->value != expectedValue ) {
    std::string err = (((((((std::string("Parse error at line ") + std::to_string(tok->line)) + std::string(":")) + std::to_string(tok->col)) + std::string(": expected '")) + expectedValue) + std::string("' but got '")) + tok->value) + std::string("'");
    this->addError(err);
  }
  this->advance();
  return tok;
}
bool  SimpleParser::isAtEnd() {
  std::string t = this->peekType();
  return t == std::string("EOF");
}
bool  SimpleParser::matchType( std::string tokenType ) {
  std::string t = this->peekType();
  return t == tokenType;
}
bool  SimpleParser::matchValue( std::string value ) {
  std::string v = this->peekValue();
  return v == value;
}
bool  SimpleParser::hasErrors() {
  return ((int)(this->errors.size())) > 0;
}
std::shared_ptr<JSNode>  SimpleParser::parseRegexLiteral() {
  std::shared_ptr<Token> tok = this->peek();
  int startPos = tok->start;
  int startLine = tok->line;
  int startCol = tok->col;
  if ( this->lexer == NULL ) {
    std::shared_ptr<JSNode> err =  std::make_shared<JSNode>();
    err->type = std::string("Identifier");
    err->name = std::string("regex_error");
    this->advance();
    return err;
  }
  std::shared_ptr<Lexer> lex = this->lexer;
  lex->pos = startPos;
  lex->line = startLine;
  lex->col = startCol;
  std::shared_ptr<Token> regexTok = lex->readRegexLiteral();
  std::string fullValue = regexTok->value;
  std::string pattern = std::string("");
  std::string flags = std::string("");
  int lastSlash = -1;
  int i = 0;
  while (i < ((int)(fullValue.length()))) {
    std::string ch = r_utf8_char_at(fullValue, i);
    if ( ch == std::string("/") ) {
      lastSlash = i;
    }
    i = i + 1;
  }
  if ( lastSlash >= 0 ) {
    pattern = r_utf8_substr(fullValue, 0, lastSlash - 0);
    flags = r_utf8_substr(fullValue, (lastSlash + 1), ((int)(fullValue.length())) - (lastSlash + 1));
  } else {
    pattern = fullValue;
  }
  std::shared_ptr<JSNode> regex =  std::make_shared<JSNode>();
  regex->type = std::string("Literal");
  regex->raw = fullValue;
  regex->regexPattern = pattern;
  regex->regexFlags = flags;
  regex->start = startPos;
  regex->end = lex->pos;
  regex->line = startLine;
  regex->col = startCol;
  this->advance();
  while (this->isAtEnd() == false) {
    std::shared_ptr<Token> nextTok = this->peek();
    if ( nextTok->start < lex->pos ) {
      this->advance();
    } else {
      break;
    }
  }
  return regex;
}
std::shared_ptr<JSNode>  SimpleParser::parseProgram() {
  std::shared_ptr<JSNode> prog =  std::make_shared<JSNode>();
  prog->type = std::string("Program");
  while (this->isAtEnd() == false) {
    std::shared_ptr<JSNode> stmt = this->parseStatement();
    prog->children.push_back( stmt  );
  }
  return prog;
}
std::shared_ptr<JSNode>  SimpleParser::parseStatement() {
  std::vector<std::shared_ptr<JSNode>> comments = this->collectComments();
  std::string tokVal = this->peekValue();
  std::shared_ptr<JSNode> stmt;
  if ( tokVal == std::string("var") ) {
    stmt  = this->parseVarDecl();
  }
  if ( (stmt == NULL) && (tokVal == std::string("let")) ) {
    stmt  = this->parseLetDecl();
  }
  if ( (stmt == NULL) && (tokVal == std::string("const")) ) {
    stmt  = this->parseConstDecl();
  }
  if ( (stmt == NULL) && (tokVal == std::string("function")) ) {
    stmt  = this->parseFuncDecl();
  }
  if ( (stmt == NULL) && (tokVal == std::string("async")) ) {
    stmt  = this->parseAsyncFuncDecl();
  }
  if ( (stmt == NULL) && (tokVal == std::string("class")) ) {
    stmt  = this->parseClass();
  }
  if ( (stmt == NULL) && (tokVal == std::string("import")) ) {
    stmt  = this->parseImport();
  }
  if ( (stmt == NULL) && (tokVal == std::string("export")) ) {
    stmt  = this->parseExport();
  }
  if ( (stmt == NULL) && (tokVal == std::string("return")) ) {
    stmt  = this->parseReturn();
  }
  if ( (stmt == NULL) && (tokVal == std::string("if")) ) {
    stmt  = this->parseIf();
  }
  if ( (stmt == NULL) && (tokVal == std::string("while")) ) {
    stmt  = this->parseWhile();
  }
  if ( (stmt == NULL) && (tokVal == std::string("do")) ) {
    stmt  = this->parseDoWhile();
  }
  if ( (stmt == NULL) && (tokVal == std::string("for")) ) {
    stmt  = this->parseFor();
  }
  if ( (stmt == NULL) && (tokVal == std::string("switch")) ) {
    stmt  = this->parseSwitch();
  }
  if ( (stmt == NULL) && (tokVal == std::string("try")) ) {
    stmt  = this->parseTry();
  }
  if ( (stmt == NULL) && (tokVal == std::string("throw")) ) {
    stmt  = this->parseThrow();
  }
  if ( (stmt == NULL) && (tokVal == std::string("break")) ) {
    stmt  = this->parseBreak();
  }
  if ( (stmt == NULL) && (tokVal == std::string("continue")) ) {
    stmt  = this->parseContinue();
  }
  if ( (stmt == NULL) && (tokVal == std::string("{")) ) {
    stmt  = this->parseBlock();
  }
  if ( (stmt == NULL) && (tokVal == std::string(";")) ) {
    this->advance();
    std::shared_ptr<JSNode> empty =  std::make_shared<JSNode>();
    empty->type = std::string("EmptyStatement");
    stmt  = empty;
  }
  if ( stmt == NULL ) {
    stmt  = this->parseExprStmt();
  }
  std::shared_ptr<JSNode> result = stmt;
  for ( int i = 0; i != (int)(comments.size()); i++) {
    std::shared_ptr<JSNode> c = comments.at(i);
    result->leadingComments.push_back( c  );
  }
  return result;
}
std::shared_ptr<JSNode>  SimpleParser::parseVarDecl() {
  std::shared_ptr<JSNode> decl =  std::make_shared<JSNode>();
  decl->type = std::string("VariableDeclaration");
  std::shared_ptr<Token> startTok = this->peek();
  decl->start = startTok->start;
  decl->line = startTok->line;
  decl->col = startTok->col;
  this->expectValue(std::string("var"));
  bool first = true;
  while (first || this->matchValue(std::string(","))) {
    if ( first == false ) {
      this->advance();
    }
    first = false;
    std::shared_ptr<JSNode> declarator =  std::make_shared<JSNode>();
    declarator->type = std::string("VariableDeclarator");
    std::shared_ptr<Token> idTok = this->expect(std::string("Identifier"));
    std::shared_ptr<JSNode> id =  std::make_shared<JSNode>();
    id->type = std::string("Identifier");
    id->name = idTok->value;
    id->start = idTok->start;
    id->line = idTok->line;
    id->col = idTok->col;
    declarator->id  = id;
    declarator->start = idTok->start;
    declarator->line = idTok->line;
    declarator->col = idTok->col;
    if ( this->matchValue(std::string("=")) ) {
      this->advance();
      std::shared_ptr<JSNode> initExpr = this->parseAssignment();
      declarator->init  = initExpr;
    }
    decl->children.push_back( declarator  );
  }
  if ( this->matchValue(std::string(";")) ) {
    this->advance();
  }
  return decl;
}
std::shared_ptr<JSNode>  SimpleParser::parseLetDecl() {
  std::shared_ptr<JSNode> decl =  std::make_shared<JSNode>();
  decl->type = std::string("VariableDeclaration");
  decl->kind = std::string("let");
  std::shared_ptr<Token> startTok = this->peek();
  decl->start = startTok->start;
  decl->line = startTok->line;
  decl->col = startTok->col;
  this->expectValue(std::string("let"));
  bool first = true;
  while (first || this->matchValue(std::string(","))) {
    if ( first == false ) {
      this->advance();
    }
    first = false;
    std::shared_ptr<JSNode> declarator =  std::make_shared<JSNode>();
    declarator->type = std::string("VariableDeclarator");
    std::shared_ptr<Token> declTok = this->peek();
    declarator->start = declTok->start;
    declarator->line = declTok->line;
    declarator->col = declTok->col;
    if ( this->matchValue(std::string("[")) ) {
      std::shared_ptr<JSNode> pattern = this->parseArrayPattern();
      declarator->id  = pattern;
    } else {
      if ( this->matchValue(std::string("{")) ) {
        std::shared_ptr<JSNode> pattern_1 = this->parseObjectPattern();
        declarator->id  = pattern_1;
      } else {
        std::shared_ptr<Token> idTok = this->expect(std::string("Identifier"));
        std::shared_ptr<JSNode> id =  std::make_shared<JSNode>();
        id->type = std::string("Identifier");
        id->name = idTok->value;
        id->start = idTok->start;
        id->line = idTok->line;
        id->col = idTok->col;
        declarator->id  = id;
      }
    }
    if ( this->matchValue(std::string("=")) ) {
      this->advance();
      std::shared_ptr<JSNode> initExpr = this->parseAssignment();
      declarator->init  = initExpr;
    }
    decl->children.push_back( declarator  );
  }
  if ( this->matchValue(std::string(";")) ) {
    this->advance();
  }
  return decl;
}
std::shared_ptr<JSNode>  SimpleParser::parseConstDecl() {
  std::shared_ptr<JSNode> decl =  std::make_shared<JSNode>();
  decl->type = std::string("VariableDeclaration");
  decl->kind = std::string("const");
  std::shared_ptr<Token> startTok = this->peek();
  decl->start = startTok->start;
  decl->line = startTok->line;
  decl->col = startTok->col;
  this->expectValue(std::string("const"));
  bool first = true;
  while (first || this->matchValue(std::string(","))) {
    if ( first == false ) {
      this->advance();
    }
    first = false;
    std::shared_ptr<JSNode> declarator =  std::make_shared<JSNode>();
    declarator->type = std::string("VariableDeclarator");
    std::shared_ptr<Token> declTok = this->peek();
    declarator->start = declTok->start;
    declarator->line = declTok->line;
    declarator->col = declTok->col;
    if ( this->matchValue(std::string("[")) ) {
      std::shared_ptr<JSNode> pattern = this->parseArrayPattern();
      declarator->id  = pattern;
    } else {
      if ( this->matchValue(std::string("{")) ) {
        std::shared_ptr<JSNode> pattern_1 = this->parseObjectPattern();
        declarator->id  = pattern_1;
      } else {
        std::shared_ptr<Token> idTok = this->expect(std::string("Identifier"));
        std::shared_ptr<JSNode> id =  std::make_shared<JSNode>();
        id->type = std::string("Identifier");
        id->name = idTok->value;
        id->start = idTok->start;
        id->line = idTok->line;
        id->col = idTok->col;
        declarator->id  = id;
      }
    }
    if ( this->matchValue(std::string("=")) ) {
      this->advance();
      std::shared_ptr<JSNode> initExpr = this->parseAssignment();
      declarator->init  = initExpr;
    }
    decl->children.push_back( declarator  );
  }
  if ( this->matchValue(std::string(";")) ) {
    this->advance();
  }
  return decl;
}
std::shared_ptr<JSNode>  SimpleParser::parseFuncDecl() {
  std::shared_ptr<JSNode> _func =  std::make_shared<JSNode>();
  _func->type = std::string("FunctionDeclaration");
  std::shared_ptr<Token> startTok = this->peek();
  _func->start = startTok->start;
  _func->line = startTok->line;
  _func->col = startTok->col;
  this->expectValue(std::string("function"));
  if ( this->matchValue(std::string("*")) ) {
    _func->generator = true;
    this->advance();
  }
  std::shared_ptr<Token> idTok = this->expect(std::string("Identifier"));
  _func->name = idTok->value;
  this->expectValue(std::string("("));
  while ((this->matchValue(std::string(")")) == false) && (this->isAtEnd() == false)) {
    if ( ((int)(_func->children.size())) > 0 ) {
      this->expectValue(std::string(","));
    }
    if ( this->matchValue(std::string(")")) || this->isAtEnd() ) {
      break;
    }
    if ( this->matchValue(std::string("...")) ) {
      std::shared_ptr<Token> restTok = this->peek();
      this->advance();
      std::shared_ptr<Token> paramTok = this->expect(std::string("Identifier"));
      std::shared_ptr<JSNode> rest =  std::make_shared<JSNode>();
      rest->type = std::string("RestElement");
      rest->name = paramTok->value;
      rest->start = restTok->start;
      rest->line = restTok->line;
      rest->col = restTok->col;
      std::shared_ptr<JSNode> argNode =  std::make_shared<JSNode>();
      argNode->type = std::string("Identifier");
      argNode->name = paramTok->value;
      argNode->start = paramTok->start;
      argNode->line = paramTok->line;
      argNode->col = paramTok->col;
      rest->argument  = argNode;
      _func->children.push_back( rest  );
    } else {
      if ( this->matchValue(std::string("[")) ) {
        std::shared_ptr<JSNode> pattern = this->parseArrayPattern();
        if ( this->matchValue(std::string("=")) ) {
          this->advance();
          std::shared_ptr<JSNode> defaultVal = this->parseAssignment();
          std::shared_ptr<JSNode> assignPat =  std::make_shared<JSNode>();
          assignPat->type = std::string("AssignmentPattern");
          assignPat->left  = pattern;
          assignPat->right  = defaultVal;
          assignPat->start = pattern->start;
          assignPat->line = pattern->line;
          assignPat->col = pattern->col;
          _func->children.push_back( assignPat  );
        } else {
          _func->children.push_back( pattern  );
        }
      } else {
        if ( this->matchValue(std::string("{")) ) {
          std::shared_ptr<JSNode> pattern_1 = this->parseObjectPattern();
          if ( this->matchValue(std::string("=")) ) {
            this->advance();
            std::shared_ptr<JSNode> defaultVal_1 = this->parseAssignment();
            std::shared_ptr<JSNode> assignPat_1 =  std::make_shared<JSNode>();
            assignPat_1->type = std::string("AssignmentPattern");
            assignPat_1->left  = pattern_1;
            assignPat_1->right  = defaultVal_1;
            assignPat_1->start = pattern_1->start;
            assignPat_1->line = pattern_1->line;
            assignPat_1->col = pattern_1->col;
            _func->children.push_back( assignPat_1  );
          } else {
            _func->children.push_back( pattern_1  );
          }
        } else {
          std::shared_ptr<Token> paramTok_1 = this->expect(std::string("Identifier"));
          std::shared_ptr<JSNode> param =  std::make_shared<JSNode>();
          param->type = std::string("Identifier");
          param->name = paramTok_1->value;
          param->start = paramTok_1->start;
          param->line = paramTok_1->line;
          param->col = paramTok_1->col;
          if ( this->matchValue(std::string("=")) ) {
            this->advance();
            std::shared_ptr<JSNode> defaultVal_2 = this->parseAssignment();
            std::shared_ptr<JSNode> assignPat_2 =  std::make_shared<JSNode>();
            assignPat_2->type = std::string("AssignmentPattern");
            assignPat_2->left  = param;
            assignPat_2->right  = defaultVal_2;
            assignPat_2->start = param->start;
            assignPat_2->line = param->line;
            assignPat_2->col = param->col;
            _func->children.push_back( assignPat_2  );
          } else {
            _func->children.push_back( param  );
          }
        }
      }
    }
  }
  this->expectValue(std::string(")"));
  std::shared_ptr<JSNode> body = this->parseBlock();
  _func->body  = body;
  return _func;
}
std::shared_ptr<JSNode>  SimpleParser::parseFunctionExpression() {
  std::shared_ptr<JSNode> _func =  std::make_shared<JSNode>();
  _func->type = std::string("FunctionExpression");
  std::shared_ptr<Token> startTok = this->peek();
  _func->start = startTok->start;
  _func->line = startTok->line;
  _func->col = startTok->col;
  this->expectValue(std::string("function"));
  if ( this->matchValue(std::string("*")) ) {
    _func->generator = true;
    this->advance();
  }
  if ( this->matchType(std::string("Identifier")) ) {
    std::shared_ptr<Token> idTok = this->expect(std::string("Identifier"));
    _func->name = idTok->value;
  }
  this->expectValue(std::string("("));
  while ((this->matchValue(std::string(")")) == false) && (this->isAtEnd() == false)) {
    if ( ((int)(_func->children.size())) > 0 ) {
      this->expectValue(std::string(","));
    }
    if ( this->matchValue(std::string(")")) || this->isAtEnd() ) {
      break;
    }
    if ( this->matchValue(std::string("...")) ) {
      std::shared_ptr<Token> restTok = this->peek();
      this->advance();
      std::shared_ptr<Token> paramTok = this->expect(std::string("Identifier"));
      std::shared_ptr<JSNode> rest =  std::make_shared<JSNode>();
      rest->type = std::string("RestElement");
      rest->name = paramTok->value;
      rest->start = restTok->start;
      rest->line = restTok->line;
      rest->col = restTok->col;
      std::shared_ptr<JSNode> argNode =  std::make_shared<JSNode>();
      argNode->type = std::string("Identifier");
      argNode->name = paramTok->value;
      argNode->start = paramTok->start;
      argNode->line = paramTok->line;
      argNode->col = paramTok->col;
      rest->argument  = argNode;
      _func->children.push_back( rest  );
    } else {
      if ( this->matchValue(std::string("[")) ) {
        std::shared_ptr<JSNode> pattern = this->parseArrayPattern();
        if ( this->matchValue(std::string("=")) ) {
          this->advance();
          std::shared_ptr<JSNode> defaultVal = this->parseAssignment();
          std::shared_ptr<JSNode> assignPat =  std::make_shared<JSNode>();
          assignPat->type = std::string("AssignmentPattern");
          assignPat->left  = pattern;
          assignPat->right  = defaultVal;
          assignPat->start = pattern->start;
          assignPat->line = pattern->line;
          assignPat->col = pattern->col;
          _func->children.push_back( assignPat  );
        } else {
          _func->children.push_back( pattern  );
        }
      } else {
        if ( this->matchValue(std::string("{")) ) {
          std::shared_ptr<JSNode> pattern_1 = this->parseObjectPattern();
          if ( this->matchValue(std::string("=")) ) {
            this->advance();
            std::shared_ptr<JSNode> defaultVal_1 = this->parseAssignment();
            std::shared_ptr<JSNode> assignPat_1 =  std::make_shared<JSNode>();
            assignPat_1->type = std::string("AssignmentPattern");
            assignPat_1->left  = pattern_1;
            assignPat_1->right  = defaultVal_1;
            assignPat_1->start = pattern_1->start;
            assignPat_1->line = pattern_1->line;
            assignPat_1->col = pattern_1->col;
            _func->children.push_back( assignPat_1  );
          } else {
            _func->children.push_back( pattern_1  );
          }
        } else {
          std::shared_ptr<Token> paramTok_1 = this->expect(std::string("Identifier"));
          std::shared_ptr<JSNode> param =  std::make_shared<JSNode>();
          param->type = std::string("Identifier");
          param->name = paramTok_1->value;
          param->start = paramTok_1->start;
          param->line = paramTok_1->line;
          param->col = paramTok_1->col;
          if ( this->matchValue(std::string("=")) ) {
            this->advance();
            std::shared_ptr<JSNode> defaultVal_2 = this->parseAssignment();
            std::shared_ptr<JSNode> assignPat_2 =  std::make_shared<JSNode>();
            assignPat_2->type = std::string("AssignmentPattern");
            assignPat_2->left  = param;
            assignPat_2->right  = defaultVal_2;
            assignPat_2->start = param->start;
            assignPat_2->line = param->line;
            assignPat_2->col = param->col;
            _func->children.push_back( assignPat_2  );
          } else {
            _func->children.push_back( param  );
          }
        }
      }
    }
  }
  this->expectValue(std::string(")"));
  std::shared_ptr<JSNode> body = this->parseBlock();
  _func->body  = body;
  return _func;
}
std::shared_ptr<JSNode>  SimpleParser::parseAsyncFuncDecl() {
  std::shared_ptr<JSNode> _func =  std::make_shared<JSNode>();
  _func->type = std::string("FunctionDeclaration");
  std::shared_ptr<Token> startTok = this->peek();
  _func->start = startTok->start;
  _func->line = startTok->line;
  _func->col = startTok->col;
  _func->async = true;
  this->expectValue(std::string("async"));
  this->expectValue(std::string("function"));
  if ( this->matchValue(std::string("*")) ) {
    _func->async = true;
    _func->generator = true;
    this->advance();
  }
  std::shared_ptr<Token> idTok = this->expect(std::string("Identifier"));
  _func->name = idTok->value;
  this->expectValue(std::string("("));
  while ((this->matchValue(std::string(")")) == false) && (this->isAtEnd() == false)) {
    if ( ((int)(_func->children.size())) > 0 ) {
      this->expectValue(std::string(","));
    }
    if ( this->matchValue(std::string(")")) || this->isAtEnd() ) {
      break;
    }
    std::shared_ptr<Token> paramTok = this->expect(std::string("Identifier"));
    std::shared_ptr<JSNode> param =  std::make_shared<JSNode>();
    param->type = std::string("Identifier");
    param->name = paramTok->value;
    param->start = paramTok->start;
    param->line = paramTok->line;
    param->col = paramTok->col;
    _func->children.push_back( param  );
  }
  this->expectValue(std::string(")"));
  std::shared_ptr<JSNode> body = this->parseBlock();
  _func->body  = body;
  return _func;
}
std::shared_ptr<JSNode>  SimpleParser::parseClass() {
  std::shared_ptr<JSNode> classNode =  std::make_shared<JSNode>();
  classNode->type = std::string("ClassDeclaration");
  std::shared_ptr<Token> startTok = this->peek();
  classNode->start = startTok->start;
  classNode->line = startTok->line;
  classNode->col = startTok->col;
  this->expectValue(std::string("class"));
  std::shared_ptr<Token> idTok = this->expect(std::string("Identifier"));
  classNode->name = idTok->value;
  if ( this->matchValue(std::string("extends")) ) {
    this->advance();
    std::shared_ptr<Token> superTok = this->expect(std::string("Identifier"));
    std::shared_ptr<JSNode> superClassNode =  std::make_shared<JSNode>();
    superClassNode->type = std::string("Identifier");
    superClassNode->name = superTok->value;
    superClassNode->start = superTok->start;
    superClassNode->line = superTok->line;
    superClassNode->col = superTok->col;
    classNode->superClass  = superClassNode;
  }
  std::shared_ptr<JSNode> body =  std::make_shared<JSNode>();
  body->type = std::string("ClassBody");
  std::shared_ptr<Token> bodyStart = this->peek();
  body->start = bodyStart->start;
  body->line = bodyStart->line;
  body->col = bodyStart->col;
  this->expectValue(std::string("{"));
  while ((this->matchValue(std::string("}")) == false) && (this->isAtEnd() == false)) {
    std::shared_ptr<JSNode> method = this->parseClassMethod();
    body->children.push_back( method  );
  }
  this->expectValue(std::string("}"));
  classNode->body  = body;
  return classNode;
}
std::shared_ptr<JSNode>  SimpleParser::parseClassMethod() {
  std::shared_ptr<JSNode> method =  std::make_shared<JSNode>();
  method->type = std::string("MethodDefinition");
  std::shared_ptr<Token> startTok = this->peek();
  method->start = startTok->start;
  method->line = startTok->line;
  method->col = startTok->col;
  bool isStatic = false;
  if ( this->matchValue(std::string("static")) ) {
    isStatic = true;
    method->_static = true;
    this->advance();
  }
  std::string methodKind = std::string("method");
  if ( this->matchValue(std::string("get")) ) {
    std::string nextTok = this->peekAt(1);
    if ( nextTok != std::string("(") ) {
      methodKind = std::string("get");
      this->advance();
    }
  }
  if ( this->matchValue(std::string("set")) ) {
    std::string nextTok_1 = this->peekAt(1);
    if ( nextTok_1 != std::string("(") ) {
      methodKind = std::string("set");
      this->advance();
    }
  }
  std::shared_ptr<Token> nameTok = this->expect(std::string("Identifier"));
  std::shared_ptr<JSNode> keyNode =  std::make_shared<JSNode>();
  keyNode->type = std::string("Identifier");
  keyNode->name = nameTok->value;
  keyNode->start = nameTok->start;
  keyNode->line = nameTok->line;
  keyNode->col = nameTok->col;
  method->key  = keyNode;
  if ( nameTok->value == std::string("constructor") ) {
    methodKind = std::string("constructor");
  }
  method->kind = methodKind;
  std::shared_ptr<JSNode> _func =  std::make_shared<JSNode>();
  _func->type = std::string("FunctionExpression");
  _func->start = nameTok->start;
  _func->line = nameTok->line;
  _func->col = nameTok->col;
  this->expectValue(std::string("("));
  while ((this->matchValue(std::string(")")) == false) && (this->isAtEnd() == false)) {
    if ( ((int)(_func->children.size())) > 0 ) {
      this->expectValue(std::string(","));
    }
    if ( this->matchValue(std::string(")")) || this->isAtEnd() ) {
      break;
    }
    std::shared_ptr<Token> paramTok = this->expect(std::string("Identifier"));
    std::shared_ptr<JSNode> param =  std::make_shared<JSNode>();
    param->type = std::string("Identifier");
    param->name = paramTok->value;
    param->start = paramTok->start;
    param->line = paramTok->line;
    param->col = paramTok->col;
    _func->children.push_back( param  );
  }
  this->expectValue(std::string(")"));
  std::shared_ptr<JSNode> funcBody = this->parseBlock();
  _func->body  = funcBody;
  method->body  = _func;
  return method;
}
std::string  SimpleParser::peekAt( int offset ) {
  int targetPos = this->pos + offset;
  if ( targetPos >= ((int)(this->tokens.size())) ) {
    return std::string("");
  }
  std::shared_ptr<Token> tok = this->tokens.at(targetPos);
  return tok->value;
}
std::shared_ptr<JSNode>  SimpleParser::parseImport() {
  std::shared_ptr<JSNode> importNode =  std::make_shared<JSNode>();
  importNode->type = std::string("ImportDeclaration");
  std::shared_ptr<Token> startTok = this->peek();
  importNode->start = startTok->start;
  importNode->line = startTok->line;
  importNode->col = startTok->col;
  this->expectValue(std::string("import"));
  if ( this->matchType(std::string("String")) ) {
    std::shared_ptr<Token> sourceTok = this->peek();
    this->advance();
    std::shared_ptr<JSNode> source_1 =  std::make_shared<JSNode>();
    source_1->type = std::string("Literal");
    source_1->raw = sourceTok->value;
    source_1->start = sourceTok->start;
    source_1->line = sourceTok->line;
    source_1->col = sourceTok->col;
    importNode->right  = source_1;
    if ( this->matchValue(std::string(";")) ) {
      this->advance();
    }
    return importNode;
  }
  if ( this->matchValue(std::string("*")) ) {
    this->advance();
    this->expectValue(std::string("as"));
    std::shared_ptr<Token> localTok = this->expect(std::string("Identifier"));
    std::shared_ptr<JSNode> specifier =  std::make_shared<JSNode>();
    specifier->type = std::string("ImportNamespaceSpecifier");
    specifier->name = localTok->value;
    specifier->start = localTok->start;
    specifier->line = localTok->line;
    specifier->col = localTok->col;
    importNode->children.push_back( specifier  );
    this->expectValue(std::string("from"));
    std::shared_ptr<Token> sourceTok_1 = this->expect(std::string("String"));
    std::shared_ptr<JSNode> source_2 =  std::make_shared<JSNode>();
    source_2->type = std::string("Literal");
    source_2->raw = sourceTok_1->value;
    source_2->start = sourceTok_1->start;
    source_2->line = sourceTok_1->line;
    source_2->col = sourceTok_1->col;
    importNode->right  = source_2;
    if ( this->matchValue(std::string(";")) ) {
      this->advance();
    }
    return importNode;
  }
  if ( this->matchType(std::string("Identifier")) ) {
    std::shared_ptr<Token> defaultTok = this->expect(std::string("Identifier"));
    std::shared_ptr<JSNode> defaultSpec =  std::make_shared<JSNode>();
    defaultSpec->type = std::string("ImportDefaultSpecifier");
    std::shared_ptr<JSNode> localNode =  std::make_shared<JSNode>();
    localNode->type = std::string("Identifier");
    localNode->name = defaultTok->value;
    localNode->start = defaultTok->start;
    localNode->line = defaultTok->line;
    localNode->col = defaultTok->col;
    defaultSpec->local  = localNode;
    defaultSpec->start = defaultTok->start;
    defaultSpec->line = defaultTok->line;
    defaultSpec->col = defaultTok->col;
    importNode->children.push_back( defaultSpec  );
    if ( this->matchValue(std::string(",")) ) {
      this->advance();
      if ( this->matchValue(std::string("*")) ) {
        this->advance();
        this->expectValue(std::string("as"));
        std::shared_ptr<Token> localTok2 = this->expect(std::string("Identifier"));
        std::shared_ptr<JSNode> nsSpec =  std::make_shared<JSNode>();
        nsSpec->type = std::string("ImportNamespaceSpecifier");
        std::shared_ptr<JSNode> nsLocal =  std::make_shared<JSNode>();
        nsLocal->type = std::string("Identifier");
        nsLocal->name = localTok2->value;
        nsLocal->start = localTok2->start;
        nsLocal->line = localTok2->line;
        nsLocal->col = localTok2->col;
        nsSpec->local  = nsLocal;
        nsSpec->start = localTok2->start;
        nsSpec->line = localTok2->line;
        nsSpec->col = localTok2->col;
        importNode->children.push_back( nsSpec  );
      } else {
        this->parseImportSpecifiers(importNode);
      }
    }
    this->expectValue(std::string("from"));
  } else {
    if ( this->matchValue(std::string("{")) ) {
      this->parseImportSpecifiers(importNode);
      this->expectValue(std::string("from"));
    }
  }
  std::shared_ptr<Token> sourceTok_2 = this->expect(std::string("String"));
  std::shared_ptr<JSNode> source_3 =  std::make_shared<JSNode>();
  source_3->type = std::string("Literal");
  source_3->raw = sourceTok_2->value;
  source_3->start = sourceTok_2->start;
  source_3->line = sourceTok_2->line;
  source_3->col = sourceTok_2->col;
  importNode->right  = source_3;
  if ( this->matchValue(std::string(";")) ) {
    this->advance();
  }
  return importNode;
}
void  SimpleParser::parseImportSpecifiers( std::shared_ptr<JSNode> importNode ) {
  this->expectValue(std::string("{"));
  while ((this->matchValue(std::string("}")) == false) && (this->isAtEnd() == false)) {
    if ( ((int)(importNode->children.size())) > 0 ) {
      if ( this->matchValue(std::string(",")) ) {
        this->advance();
      }
    }
    if ( this->matchValue(std::string("}")) || this->isAtEnd() ) {
      break;
    }
    std::shared_ptr<JSNode> specifier =  std::make_shared<JSNode>();
    specifier->type = std::string("ImportSpecifier");
    std::shared_ptr<Token> importedTok = this->expect(std::string("Identifier"));
    std::shared_ptr<JSNode> importedNode =  std::make_shared<JSNode>();
    importedNode->type = std::string("Identifier");
    importedNode->name = importedTok->value;
    importedNode->start = importedTok->start;
    importedNode->line = importedTok->line;
    importedNode->col = importedTok->col;
    specifier->imported  = importedNode;
    specifier->start = importedTok->start;
    specifier->line = importedTok->line;
    specifier->col = importedTok->col;
    if ( this->matchValue(std::string("as")) ) {
      this->advance();
      std::shared_ptr<Token> localTok = this->expect(std::string("Identifier"));
      std::shared_ptr<JSNode> localNode =  std::make_shared<JSNode>();
      localNode->type = std::string("Identifier");
      localNode->name = localTok->value;
      localNode->start = localTok->start;
      localNode->line = localTok->line;
      localNode->col = localTok->col;
      specifier->local  = localNode;
    } else {
      specifier->local  = importedNode;
    }
    importNode->children.push_back( specifier  );
  }
  this->expectValue(std::string("}"));
}
std::shared_ptr<JSNode>  SimpleParser::parseExport() {
  std::shared_ptr<JSNode> exportNode =  std::make_shared<JSNode>();
  exportNode->type = std::string("ExportNamedDeclaration");
  std::shared_ptr<Token> startTok = this->peek();
  exportNode->start = startTok->start;
  exportNode->line = startTok->line;
  exportNode->col = startTok->col;
  this->expectValue(std::string("export"));
  if ( this->matchValue(std::string("default")) ) {
    exportNode->type = std::string("ExportDefaultDeclaration");
    this->advance();
    if ( this->matchValue(std::string("function")) ) {
      std::shared_ptr<JSNode> _func = this->parseFuncDecl();
      exportNode->left  = _func;
    } else {
      if ( this->matchValue(std::string("async")) ) {
        std::shared_ptr<JSNode> func_1 = this->parseAsyncFuncDecl();
        exportNode->left  = func_1;
      } else {
        if ( this->matchValue(std::string("class")) ) {
          std::shared_ptr<JSNode> cls = this->parseClass();
          exportNode->left  = cls;
        } else {
          std::shared_ptr<JSNode> expr = this->parseAssignment();
          exportNode->left  = expr;
          if ( this->matchValue(std::string(";")) ) {
            this->advance();
          }
        }
      }
    }
    return exportNode;
  }
  if ( this->matchValue(std::string("*")) ) {
    exportNode->type = std::string("ExportAllDeclaration");
    this->advance();
    if ( this->matchValue(std::string("as")) ) {
      this->advance();
      std::shared_ptr<Token> exportedTok = this->expect(std::string("Identifier"));
      exportNode->name = exportedTok->value;
    }
    this->expectValue(std::string("from"));
    std::shared_ptr<Token> sourceTok = this->expect(std::string("String"));
    std::shared_ptr<JSNode> source_1 =  std::make_shared<JSNode>();
    source_1->type = std::string("Literal");
    source_1->raw = sourceTok->value;
    source_1->start = sourceTok->start;
    source_1->line = sourceTok->line;
    source_1->col = sourceTok->col;
    exportNode->right  = source_1;
    if ( this->matchValue(std::string(";")) ) {
      this->advance();
    }
    return exportNode;
  }
  if ( this->matchValue(std::string("{")) ) {
    this->parseExportSpecifiers(exportNode);
    if ( this->matchValue(std::string("from")) ) {
      this->advance();
      std::shared_ptr<Token> sourceTok_1 = this->expect(std::string("String"));
      std::shared_ptr<JSNode> source_2 =  std::make_shared<JSNode>();
      source_2->type = std::string("Literal");
      source_2->raw = sourceTok_1->value;
      source_2->start = sourceTok_1->start;
      source_2->line = sourceTok_1->line;
      source_2->col = sourceTok_1->col;
      exportNode->right  = source_2;
    }
    if ( this->matchValue(std::string(";")) ) {
      this->advance();
    }
    return exportNode;
  }
  if ( this->matchValue(std::string("const")) ) {
    std::shared_ptr<JSNode> decl = this->parseConstDecl();
    exportNode->left  = decl;
    return exportNode;
  }
  if ( this->matchValue(std::string("let")) ) {
    std::shared_ptr<JSNode> decl_1 = this->parseLetDecl();
    exportNode->left  = decl_1;
    return exportNode;
  }
  if ( this->matchValue(std::string("var")) ) {
    std::shared_ptr<JSNode> decl_2 = this->parseVarDecl();
    exportNode->left  = decl_2;
    return exportNode;
  }
  if ( this->matchValue(std::string("function")) ) {
    std::shared_ptr<JSNode> func_2 = this->parseFuncDecl();
    exportNode->left  = func_2;
    return exportNode;
  }
  if ( this->matchValue(std::string("async")) ) {
    std::shared_ptr<JSNode> func_3 = this->parseAsyncFuncDecl();
    exportNode->left  = func_3;
    return exportNode;
  }
  if ( this->matchValue(std::string("class")) ) {
    std::shared_ptr<JSNode> cls_1 = this->parseClass();
    exportNode->left  = cls_1;
    return exportNode;
  }
  std::shared_ptr<JSNode> expr_1 = this->parseExprStmt();
  exportNode->left  = expr_1;
  return exportNode;
}
void  SimpleParser::parseExportSpecifiers( std::shared_ptr<JSNode> exportNode ) {
  this->expectValue(std::string("{"));
  while ((this->matchValue(std::string("}")) == false) && (this->isAtEnd() == false)) {
    int numChildren = (int)(exportNode->children.size());
    if ( numChildren > 0 ) {
      if ( this->matchValue(std::string(",")) ) {
        this->advance();
      }
    }
    if ( this->matchValue(std::string("}")) || this->isAtEnd() ) {
      break;
    }
    std::shared_ptr<JSNode> specifier =  std::make_shared<JSNode>();
    specifier->type = std::string("ExportSpecifier");
    std::shared_ptr<Token> localTok = this->peek();
    if ( this->matchType(std::string("Identifier")) || this->matchValue(std::string("default")) ) {
      this->advance();
      std::shared_ptr<JSNode> localNode =  std::make_shared<JSNode>();
      localNode->type = std::string("Identifier");
      localNode->name = localTok->value;
      localNode->start = localTok->start;
      localNode->line = localTok->line;
      localNode->col = localTok->col;
      specifier->local  = localNode;
      specifier->start = localTok->start;
      specifier->line = localTok->line;
      specifier->col = localTok->col;
    } else {
      std::string err = ((((std::string("Parse error at line ") + std::to_string(localTok->line)) + std::string(":")) + std::to_string(localTok->col)) + std::string(": expected Identifier but got ")) + localTok->tokenType;
      this->addError(err);
      this->advance();
    }
    if ( this->matchValue(std::string("as")) ) {
      this->advance();
      std::shared_ptr<Token> exportedTok = this->expect(std::string("Identifier"));
      std::shared_ptr<JSNode> exportedNode =  std::make_shared<JSNode>();
      exportedNode->type = std::string("Identifier");
      exportedNode->name = exportedTok->value;
      exportedNode->start = exportedTok->start;
      exportedNode->line = exportedTok->line;
      exportedNode->col = exportedTok->col;
      specifier->exported  = exportedNode;
    } else {
      specifier->exported  = specifier->local;
    }
    exportNode->children.push_back( specifier  );
  }
  this->expectValue(std::string("}"));
}
std::shared_ptr<JSNode>  SimpleParser::parseBlock() {
  std::shared_ptr<JSNode> block =  std::make_shared<JSNode>();
  block->type = std::string("BlockStatement");
  std::shared_ptr<Token> startTok = this->peek();
  block->start = startTok->start;
  block->line = startTok->line;
  block->col = startTok->col;
  this->expectValue(std::string("{"));
  while ((this->matchValue(std::string("}")) == false) && (this->isAtEnd() == false)) {
    std::shared_ptr<JSNode> stmt = this->parseStatement();
    block->children.push_back( stmt  );
  }
  this->expectValue(std::string("}"));
  return block;
}
std::shared_ptr<JSNode>  SimpleParser::parseReturn() {
  std::shared_ptr<JSNode> ret =  std::make_shared<JSNode>();
  ret->type = std::string("ReturnStatement");
  std::shared_ptr<Token> startTok = this->peek();
  ret->start = startTok->start;
  ret->line = startTok->line;
  ret->col = startTok->col;
  this->expectValue(std::string("return"));
  if ( (this->matchValue(std::string(";")) == false) && (this->isAtEnd() == false) ) {
    std::shared_ptr<JSNode> arg = this->parseExpr();
    ret->left  = arg;
  }
  if ( this->matchValue(std::string(";")) ) {
    this->advance();
  }
  return ret;
}
std::shared_ptr<JSNode>  SimpleParser::parseIf() {
  std::shared_ptr<JSNode> ifStmt =  std::make_shared<JSNode>();
  ifStmt->type = std::string("IfStatement");
  std::shared_ptr<Token> startTok = this->peek();
  ifStmt->start = startTok->start;
  ifStmt->line = startTok->line;
  ifStmt->col = startTok->col;
  this->expectValue(std::string("if"));
  this->expectValue(std::string("("));
  std::shared_ptr<JSNode> test = this->parseExpr();
  ifStmt->test  = test;
  this->expectValue(std::string(")"));
  std::shared_ptr<JSNode> consequent = this->parseStatement();
  ifStmt->body  = consequent;
  if ( this->matchValue(std::string("else")) ) {
    this->advance();
    std::shared_ptr<JSNode> alt = this->parseStatement();
    ifStmt->alternate  = alt;
  }
  return ifStmt;
}
std::shared_ptr<JSNode>  SimpleParser::parseWhile() {
  std::shared_ptr<JSNode> whileStmt =  std::make_shared<JSNode>();
  whileStmt->type = std::string("WhileStatement");
  std::shared_ptr<Token> startTok = this->peek();
  whileStmt->start = startTok->start;
  whileStmt->line = startTok->line;
  whileStmt->col = startTok->col;
  this->expectValue(std::string("while"));
  this->expectValue(std::string("("));
  std::shared_ptr<JSNode> test = this->parseExpr();
  whileStmt->test  = test;
  this->expectValue(std::string(")"));
  std::shared_ptr<JSNode> body = this->parseStatement();
  whileStmt->body  = body;
  return whileStmt;
}
std::shared_ptr<JSNode>  SimpleParser::parseDoWhile() {
  std::shared_ptr<JSNode> doWhileStmt =  std::make_shared<JSNode>();
  doWhileStmt->type = std::string("DoWhileStatement");
  std::shared_ptr<Token> startTok = this->peek();
  doWhileStmt->start = startTok->start;
  doWhileStmt->line = startTok->line;
  doWhileStmt->col = startTok->col;
  this->expectValue(std::string("do"));
  std::shared_ptr<JSNode> body = this->parseStatement();
  doWhileStmt->body  = body;
  this->expectValue(std::string("while"));
  this->expectValue(std::string("("));
  std::shared_ptr<JSNode> test = this->parseExpr();
  doWhileStmt->test  = test;
  this->expectValue(std::string(")"));
  if ( this->matchValue(std::string(";")) ) {
    this->advance();
  }
  return doWhileStmt;
}
std::shared_ptr<JSNode>  SimpleParser::parseFor() {
  std::shared_ptr<JSNode> forStmt =  std::make_shared<JSNode>();
  std::shared_ptr<Token> startTok = this->peek();
  forStmt->start = startTok->start;
  forStmt->line = startTok->line;
  forStmt->col = startTok->col;
  this->expectValue(std::string("for"));
  this->expectValue(std::string("("));
  bool isForOf = false;
  bool isForIn = false;
  std::shared_ptr<JSNode> leftNode;
  if ( this->matchValue(std::string(";")) == false ) {
    if ( (this->matchValue(std::string("var")) || this->matchValue(std::string("let"))) || this->matchValue(std::string("const")) ) {
      std::string keyword = this->peekValue();
      this->advance();
      std::shared_ptr<JSNode> declarator =  std::make_shared<JSNode>();
      declarator->type = std::string("VariableDeclarator");
      std::shared_ptr<Token> declTok = this->peek();
      declarator->start = declTok->start;
      declarator->line = declTok->line;
      declarator->col = declTok->col;
      if ( this->matchValue(std::string("[")) ) {
        std::shared_ptr<JSNode> pattern = this->parseArrayPattern();
        declarator->id  = pattern;
      } else {
        if ( this->matchValue(std::string("{")) ) {
          std::shared_ptr<JSNode> pattern_1 = this->parseObjectPattern();
          declarator->id  = pattern_1;
        } else {
          std::shared_ptr<Token> idTok = this->expect(std::string("Identifier"));
          std::shared_ptr<JSNode> id =  std::make_shared<JSNode>();
          id->type = std::string("Identifier");
          id->name = idTok->value;
          id->start = idTok->start;
          id->line = idTok->line;
          id->col = idTok->col;
          declarator->id  = id;
        }
      }
      if ( this->matchValue(std::string("of")) ) {
        isForOf = true;
        this->advance();
        std::shared_ptr<JSNode> varDecl =  std::make_shared<JSNode>();
        varDecl->type = std::string("VariableDeclaration");
        varDecl->kind = keyword;
        varDecl->start = declTok->start;
        varDecl->line = declTok->line;
        varDecl->col = declTok->col;
        varDecl->children.push_back( declarator  );
        leftNode  = varDecl;
      } else {
        if ( this->matchValue(std::string("in")) ) {
          isForIn = true;
          this->advance();
          std::shared_ptr<JSNode> varDecl_1 =  std::make_shared<JSNode>();
          varDecl_1->type = std::string("VariableDeclaration");
          varDecl_1->kind = keyword;
          varDecl_1->start = declTok->start;
          varDecl_1->line = declTok->line;
          varDecl_1->col = declTok->col;
          varDecl_1->children.push_back( declarator  );
          leftNode  = varDecl_1;
        } else {
          if ( this->matchValue(std::string("=")) ) {
            this->advance();
            std::shared_ptr<JSNode> initVal = this->parseAssignment();
            declarator->init  = initVal;
          }
          std::shared_ptr<JSNode> varDecl_2 =  std::make_shared<JSNode>();
          varDecl_2->type = std::string("VariableDeclaration");
          varDecl_2->kind = keyword;
          varDecl_2->start = declTok->start;
          varDecl_2->line = declTok->line;
          varDecl_2->col = declTok->col;
          varDecl_2->children.push_back( declarator  );
          leftNode  = varDecl_2;
          if ( this->matchValue(std::string(";")) ) {
            this->advance();
          }
        }
      }
    } else {
      std::shared_ptr<JSNode> initExpr = this->parseExpr();
      if ( this->matchValue(std::string("of")) ) {
        isForOf = true;
        this->advance();
        leftNode  = initExpr;
      } else {
        if ( this->matchValue(std::string("in")) ) {
          isForIn = true;
          this->advance();
          leftNode  = initExpr;
        } else {
          leftNode  = initExpr;
          if ( this->matchValue(std::string(";")) ) {
            this->advance();
          }
        }
      }
    }
  } else {
    this->advance();
  }
  if ( isForOf ) {
    forStmt->type = std::string("ForOfStatement");
    forStmt->left  = leftNode;
    std::shared_ptr<JSNode> rightExpr = this->parseExpr();
    forStmt->right  = rightExpr;
    this->expectValue(std::string(")"));
    std::shared_ptr<JSNode> body = this->parseStatement();
    forStmt->body  = body;
    return forStmt;
  }
  if ( isForIn ) {
    forStmt->type = std::string("ForInStatement");
    forStmt->left  = leftNode;
    std::shared_ptr<JSNode> rightExpr_1 = this->parseExpr();
    forStmt->right  = rightExpr_1;
    this->expectValue(std::string(")"));
    std::shared_ptr<JSNode> body_1 = this->parseStatement();
    forStmt->body  = body_1;
    return forStmt;
  }
  forStmt->type = std::string("ForStatement");
  if ( leftNode != NULL  ) {
    forStmt->left  = leftNode;
  }
  if ( this->matchValue(std::string(";")) == false ) {
    std::shared_ptr<JSNode> test = this->parseExpr();
    forStmt->test  = test;
  }
  if ( this->matchValue(std::string(";")) ) {
    this->advance();
  }
  if ( this->matchValue(std::string(")")) == false ) {
    std::shared_ptr<JSNode> update = this->parseExpr();
    forStmt->right  = update;
  }
  this->expectValue(std::string(")"));
  std::shared_ptr<JSNode> body_2 = this->parseStatement();
  forStmt->body  = body_2;
  return forStmt;
}
std::shared_ptr<JSNode>  SimpleParser::parseSwitch() {
  std::shared_ptr<JSNode> switchStmt =  std::make_shared<JSNode>();
  switchStmt->type = std::string("SwitchStatement");
  std::shared_ptr<Token> startTok = this->peek();
  switchStmt->start = startTok->start;
  switchStmt->line = startTok->line;
  switchStmt->col = startTok->col;
  this->expectValue(std::string("switch"));
  this->expectValue(std::string("("));
  std::shared_ptr<JSNode> discriminant = this->parseExpr();
  switchStmt->test  = discriminant;
  this->expectValue(std::string(")"));
  this->expectValue(std::string("{"));
  while ((this->matchValue(std::string("}")) == false) && (this->isAtEnd() == false)) {
    std::shared_ptr<JSNode> caseNode =  std::make_shared<JSNode>();
    if ( this->matchValue(std::string("case")) ) {
      caseNode->type = std::string("SwitchCase");
      std::shared_ptr<Token> caseTok = this->peek();
      caseNode->start = caseTok->start;
      caseNode->line = caseTok->line;
      caseNode->col = caseTok->col;
      this->advance();
      std::shared_ptr<JSNode> testExpr = this->parseExpr();
      caseNode->test  = testExpr;
      this->expectValue(std::string(":"));
      while ((((this->matchValue(std::string("case")) == false) && (this->matchValue(std::string("default")) == false)) && (this->matchValue(std::string("}")) == false)) && (this->isAtEnd() == false)) {
        std::shared_ptr<JSNode> stmt = this->parseStatement();
        caseNode->children.push_back( stmt  );
      }
      switchStmt->children.push_back( caseNode  );
    } else {
      if ( this->matchValue(std::string("default")) ) {
        caseNode->type = std::string("SwitchCase");
        caseNode->name = std::string("default");
        std::shared_ptr<Token> defTok = this->peek();
        caseNode->start = defTok->start;
        caseNode->line = defTok->line;
        caseNode->col = defTok->col;
        this->advance();
        this->expectValue(std::string(":"));
        while (((this->matchValue(std::string("case")) == false) && (this->matchValue(std::string("}")) == false)) && (this->isAtEnd() == false)) {
          std::shared_ptr<JSNode> stmt_1 = this->parseStatement();
          caseNode->children.push_back( stmt_1  );
        }
        switchStmt->children.push_back( caseNode  );
      } else {
        this->advance();
      }
    }
  }
  this->expectValue(std::string("}"));
  return switchStmt;
}
std::shared_ptr<JSNode>  SimpleParser::parseTry() {
  std::shared_ptr<JSNode> tryStmt =  std::make_shared<JSNode>();
  tryStmt->type = std::string("TryStatement");
  std::shared_ptr<Token> startTok = this->peek();
  tryStmt->start = startTok->start;
  tryStmt->line = startTok->line;
  tryStmt->col = startTok->col;
  this->expectValue(std::string("try"));
  std::shared_ptr<JSNode> block = this->parseBlock();
  tryStmt->body  = block;
  if ( this->matchValue(std::string("catch")) ) {
    std::shared_ptr<JSNode> catchNode =  std::make_shared<JSNode>();
    catchNode->type = std::string("CatchClause");
    std::shared_ptr<Token> catchTok = this->peek();
    catchNode->start = catchTok->start;
    catchNode->line = catchTok->line;
    catchNode->col = catchTok->col;
    this->advance();
    this->expectValue(std::string("("));
    std::shared_ptr<Token> paramTok = this->expect(std::string("Identifier"));
    catchNode->name = paramTok->value;
    this->expectValue(std::string(")"));
    std::shared_ptr<JSNode> catchBody = this->parseBlock();
    catchNode->body  = catchBody;
    tryStmt->left  = catchNode;
  }
  if ( this->matchValue(std::string("finally")) ) {
    this->advance();
    std::shared_ptr<JSNode> finallyBlock = this->parseBlock();
    tryStmt->right  = finallyBlock;
  }
  return tryStmt;
}
std::shared_ptr<JSNode>  SimpleParser::parseThrow() {
  std::shared_ptr<JSNode> throwStmt =  std::make_shared<JSNode>();
  throwStmt->type = std::string("ThrowStatement");
  std::shared_ptr<Token> startTok = this->peek();
  throwStmt->start = startTok->start;
  throwStmt->line = startTok->line;
  throwStmt->col = startTok->col;
  this->expectValue(std::string("throw"));
  std::shared_ptr<JSNode> arg = this->parseExpr();
  throwStmt->left  = arg;
  if ( this->matchValue(std::string(";")) ) {
    this->advance();
  }
  return throwStmt;
}
std::shared_ptr<JSNode>  SimpleParser::parseBreak() {
  std::shared_ptr<JSNode> breakStmt =  std::make_shared<JSNode>();
  breakStmt->type = std::string("BreakStatement");
  std::shared_ptr<Token> startTok = this->peek();
  breakStmt->start = startTok->start;
  breakStmt->line = startTok->line;
  breakStmt->col = startTok->col;
  this->expectValue(std::string("break"));
  if ( this->matchType(std::string("Identifier")) ) {
    std::shared_ptr<Token> labelTok = this->peek();
    breakStmt->name = labelTok->value;
    this->advance();
  }
  if ( this->matchValue(std::string(";")) ) {
    this->advance();
  }
  return breakStmt;
}
std::shared_ptr<JSNode>  SimpleParser::parseContinue() {
  std::shared_ptr<JSNode> contStmt =  std::make_shared<JSNode>();
  contStmt->type = std::string("ContinueStatement");
  std::shared_ptr<Token> startTok = this->peek();
  contStmt->start = startTok->start;
  contStmt->line = startTok->line;
  contStmt->col = startTok->col;
  this->expectValue(std::string("continue"));
  if ( this->matchType(std::string("Identifier")) ) {
    std::shared_ptr<Token> labelTok = this->peek();
    contStmt->name = labelTok->value;
    this->advance();
  }
  if ( this->matchValue(std::string(";")) ) {
    this->advance();
  }
  return contStmt;
}
std::shared_ptr<JSNode>  SimpleParser::parseExprStmt() {
  std::shared_ptr<JSNode> stmt =  std::make_shared<JSNode>();
  stmt->type = std::string("ExpressionStatement");
  std::shared_ptr<Token> startTok = this->peek();
  stmt->start = startTok->start;
  stmt->line = startTok->line;
  stmt->col = startTok->col;
  std::shared_ptr<JSNode> expr = this->parseExpr();
  stmt->left  = expr;
  if ( this->matchValue(std::string(";")) ) {
    this->advance();
  }
  return stmt;
}
std::shared_ptr<JSNode>  SimpleParser::parseExpr() {
  return this->parseAssignment();
}
std::shared_ptr<JSNode>  SimpleParser::parseAssignment() {
  std::shared_ptr<JSNode> left = this->parseTernary();
  std::string tokVal = this->peekValue();
  if ( (((((((((((((((tokVal == std::string("=")) || (tokVal == std::string("+="))) || (tokVal == std::string("-="))) || (tokVal == std::string("*="))) || (tokVal == std::string("/="))) || (tokVal == std::string("%="))) || (tokVal == std::string("**="))) || (tokVal == std::string("<<="))) || (tokVal == std::string(">>="))) || (tokVal == std::string(">>>="))) || (tokVal == std::string("&="))) || (tokVal == std::string("^="))) || (tokVal == std::string("|="))) || (tokVal == std::string("&&="))) || (tokVal == std::string("||="))) || (tokVal == std::string("??=")) ) {
    std::shared_ptr<Token> opTok = this->peek();
    this->advance();
    std::shared_ptr<JSNode> right = this->parseAssignment();
    std::shared_ptr<JSNode> assign =  std::make_shared<JSNode>();
    assign->type = std::string("AssignmentExpression");
    assign->_operator = opTok->value;
    assign->left  = left;
    assign->right  = right;
    assign->start = left->start;
    assign->line = left->line;
    assign->col = left->col;
    return assign;
  }
  return left;
}
std::shared_ptr<JSNode>  SimpleParser::parseTernary() {
  std::shared_ptr<JSNode> condition = this->parseLogicalOr();
  if ( this->matchValue(std::string("?")) ) {
    this->advance();
    std::shared_ptr<JSNode> consequent = this->parseAssignment();
    this->expectValue(std::string(":"));
    std::shared_ptr<JSNode> alternate = this->parseAssignment();
    std::shared_ptr<JSNode> ternary =  std::make_shared<JSNode>();
    ternary->type = std::string("ConditionalExpression");
    ternary->left  = condition;
    ternary->body  = consequent;
    ternary->right  = alternate;
    ternary->start = condition->start;
    ternary->line = condition->line;
    ternary->col = condition->col;
    return ternary;
  }
  return condition;
}
std::shared_ptr<JSNode>  SimpleParser::parseLogicalOr() {
  std::shared_ptr<JSNode> left = this->parseNullishCoalescing();
  while (this->matchValue(std::string("||"))) {
    std::shared_ptr<Token> opTok = this->peek();
    this->advance();
    std::shared_ptr<JSNode> right = this->parseNullishCoalescing();
    std::shared_ptr<JSNode> binary =  std::make_shared<JSNode>();
    binary->type = std::string("LogicalExpression");
    binary->_operator = opTok->value;
    binary->left  = left;
    binary->right  = right;
    binary->start = left->start;
    binary->line = left->line;
    binary->col = left->col;
    left = binary;
  }
  return left;
}
std::shared_ptr<JSNode>  SimpleParser::parseNullishCoalescing() {
  std::shared_ptr<JSNode> left = this->parseLogicalAnd();
  while (this->matchValue(std::string("??"))) {
    std::shared_ptr<Token> opTok = this->peek();
    this->advance();
    std::shared_ptr<JSNode> right = this->parseLogicalAnd();
    std::shared_ptr<JSNode> binary =  std::make_shared<JSNode>();
    binary->type = std::string("LogicalExpression");
    binary->_operator = opTok->value;
    binary->left  = left;
    binary->right  = right;
    binary->start = left->start;
    binary->line = left->line;
    binary->col = left->col;
    left = binary;
  }
  return left;
}
std::shared_ptr<JSNode>  SimpleParser::parseLogicalAnd() {
  std::shared_ptr<JSNode> left = this->parseEquality();
  while (this->matchValue(std::string("&&"))) {
    std::shared_ptr<Token> opTok = this->peek();
    this->advance();
    std::shared_ptr<JSNode> right = this->parseEquality();
    std::shared_ptr<JSNode> binary =  std::make_shared<JSNode>();
    binary->type = std::string("LogicalExpression");
    binary->_operator = opTok->value;
    binary->left  = left;
    binary->right  = right;
    binary->start = left->start;
    binary->line = left->line;
    binary->col = left->col;
    left = binary;
  }
  return left;
}
std::shared_ptr<JSNode>  SimpleParser::parseEquality() {
  std::shared_ptr<JSNode> left = this->parseComparison();
  std::string tokVal = this->peekValue();
  while ((((tokVal == std::string("==")) || (tokVal == std::string("!="))) || (tokVal == std::string("==="))) || (tokVal == std::string("!=="))) {
    std::shared_ptr<Token> opTok = this->peek();
    this->advance();
    std::shared_ptr<JSNode> right = this->parseComparison();
    std::shared_ptr<JSNode> binary =  std::make_shared<JSNode>();
    binary->type = std::string("BinaryExpression");
    binary->_operator = opTok->value;
    binary->left  = left;
    binary->right  = right;
    binary->start = left->start;
    binary->line = left->line;
    binary->col = left->col;
    left = binary;
    tokVal = this->peekValue();
  }
  return left;
}
std::shared_ptr<JSNode>  SimpleParser::parseComparison() {
  std::shared_ptr<JSNode> left = this->parseAdditive();
  std::string tokVal = this->peekValue();
  while ((((tokVal == std::string("<")) || (tokVal == std::string(">"))) || (tokVal == std::string("<="))) || (tokVal == std::string(">="))) {
    std::shared_ptr<Token> opTok = this->peek();
    this->advance();
    std::shared_ptr<JSNode> right = this->parseAdditive();
    std::shared_ptr<JSNode> binary =  std::make_shared<JSNode>();
    binary->type = std::string("BinaryExpression");
    binary->_operator = opTok->value;
    binary->left  = left;
    binary->right  = right;
    binary->start = left->start;
    binary->line = left->line;
    binary->col = left->col;
    left = binary;
    tokVal = this->peekValue();
  }
  return left;
}
std::shared_ptr<JSNode>  SimpleParser::parseAdditive() {
  std::shared_ptr<JSNode> left = this->parseMultiplicative();
  std::string tokVal = this->peekValue();
  while ((tokVal == std::string("+")) || (tokVal == std::string("-"))) {
    std::shared_ptr<Token> opTok = this->peek();
    this->advance();
    std::shared_ptr<JSNode> right = this->parseMultiplicative();
    std::shared_ptr<JSNode> binary =  std::make_shared<JSNode>();
    binary->type = std::string("BinaryExpression");
    binary->_operator = opTok->value;
    binary->left  = left;
    binary->right  = right;
    binary->start = left->start;
    binary->line = left->line;
    binary->col = left->col;
    left = binary;
    tokVal = this->peekValue();
  }
  return left;
}
std::shared_ptr<JSNode>  SimpleParser::parseMultiplicative() {
  std::shared_ptr<JSNode> left = this->parseUnary();
  std::string tokVal = this->peekValue();
  while (((tokVal == std::string("*")) || (tokVal == std::string("/"))) || (tokVal == std::string("%"))) {
    std::shared_ptr<Token> opTok = this->peek();
    this->advance();
    std::shared_ptr<JSNode> right = this->parseUnary();
    std::shared_ptr<JSNode> binary =  std::make_shared<JSNode>();
    binary->type = std::string("BinaryExpression");
    binary->_operator = opTok->value;
    binary->left  = left;
    binary->right  = right;
    binary->start = left->start;
    binary->line = left->line;
    binary->col = left->col;
    left = binary;
    tokVal = this->peekValue();
  }
  return left;
}
std::shared_ptr<JSNode>  SimpleParser::parseUnary() {
  std::string tokType = this->peekType();
  std::string tokVal = this->peekValue();
  if ( tokType == std::string("Punctuator") ) {
    if ( ((tokVal == std::string("!")) || (tokVal == std::string("-"))) || (tokVal == std::string("+")) ) {
      std::shared_ptr<Token> opTok = this->peek();
      this->advance();
      std::shared_ptr<JSNode> arg = this->parseUnary();
      std::shared_ptr<JSNode> unary =  std::make_shared<JSNode>();
      unary->type = std::string("UnaryExpression");
      unary->_operator = opTok->value;
      unary->left  = arg;
      unary->start = opTok->start;
      unary->line = opTok->line;
      unary->col = opTok->col;
      return unary;
    }
  }
  if ( (tokType == std::string("Keyword")) && (tokVal == std::string("typeof")) ) {
    std::shared_ptr<Token> opTok_1 = this->peek();
    this->advance();
    std::shared_ptr<JSNode> arg_1 = this->parseUnary();
    std::shared_ptr<JSNode> unary_1 =  std::make_shared<JSNode>();
    unary_1->type = std::string("UnaryExpression");
    unary_1->_operator = opTok_1->value;
    unary_1->left  = arg_1;
    unary_1->start = opTok_1->start;
    unary_1->line = opTok_1->line;
    unary_1->col = opTok_1->col;
    return unary_1;
  }
  if ( (tokType == std::string("Punctuator")) && ((tokVal == std::string("++")) || (tokVal == std::string("--"))) ) {
    std::shared_ptr<Token> opTok_2 = this->peek();
    this->advance();
    std::shared_ptr<JSNode> arg_2 = this->parseUnary();
    std::shared_ptr<JSNode> update =  std::make_shared<JSNode>();
    update->type = std::string("UpdateExpression");
    update->_operator = opTok_2->value;
    update->prefix = true;
    update->left  = arg_2;
    update->start = opTok_2->start;
    update->line = opTok_2->line;
    update->col = opTok_2->col;
    return update;
  }
  if ( tokVal == std::string("yield") ) {
    std::shared_ptr<Token> yieldTok = this->peek();
    this->advance();
    std::shared_ptr<JSNode> yieldExpr =  std::make_shared<JSNode>();
    yieldExpr->type = std::string("YieldExpression");
    yieldExpr->start = yieldTok->start;
    yieldExpr->line = yieldTok->line;
    yieldExpr->col = yieldTok->col;
    if ( this->matchValue(std::string("*")) ) {
      yieldExpr->delegate = true;
      this->advance();
    }
    std::string nextVal = this->peekValue();
    if ( (((nextVal != std::string(";")) && (nextVal != std::string("}"))) && (nextVal != std::string(","))) && (nextVal != std::string(")")) ) {
      std::shared_ptr<JSNode> arg_3 = this->parseAssignment();
      yieldExpr->left  = arg_3;
    }
    return yieldExpr;
  }
  if ( tokVal == std::string("await") ) {
    std::shared_ptr<Token> awaitTok = this->peek();
    this->advance();
    std::shared_ptr<JSNode> arg_4 = this->parseUnary();
    std::shared_ptr<JSNode> awaitExpr =  std::make_shared<JSNode>();
    awaitExpr->type = std::string("AwaitExpression");
    awaitExpr->left  = arg_4;
    awaitExpr->start = awaitTok->start;
    awaitExpr->line = awaitTok->line;
    awaitExpr->col = awaitTok->col;
    return awaitExpr;
  }
  return this->parseCallMember();
}
std::shared_ptr<JSNode>  SimpleParser::parseCallMember() {
  if ( this->matchValue(std::string("new")) ) {
    return this->parseNewExpression();
  }
  std::shared_ptr<JSNode> object = this->parsePrimary();
  bool cont = true;
  while (cont) {
    std::string tokVal = this->peekValue();
    if ( (tokVal == std::string("++")) || (tokVal == std::string("--")) ) {
      std::shared_ptr<Token> opTok = this->peek();
      this->advance();
      std::shared_ptr<JSNode> update =  std::make_shared<JSNode>();
      update->type = std::string("UpdateExpression");
      update->_operator = opTok->value;
      update->prefix = false;
      update->left  = object;
      update->start = object->start;
      update->line = object->line;
      update->col = object->col;
      object = update;
    } else {
      if ( tokVal == std::string("?.") ) {
        this->advance();
        std::string nextTokVal = this->peekValue();
        if ( nextTokVal == std::string("(") ) {
          this->advance();
          std::shared_ptr<JSNode> call =  std::make_shared<JSNode>();
          call->type = std::string("OptionalCallExpression");
          call->left  = object;
          call->start = object->start;
          call->line = object->line;
          call->col = object->col;
          while ((this->matchValue(std::string(")")) == false) && (this->isAtEnd() == false)) {
            if ( ((int)(call->children.size())) > 0 ) {
              this->expectValue(std::string(","));
            }
            if ( this->matchValue(std::string(")")) || this->isAtEnd() ) {
              break;
            }
            std::shared_ptr<JSNode> arg = this->parseAssignment();
            call->children.push_back( arg  );
          }
          this->expectValue(std::string(")"));
          object = call;
        } else {
          if ( nextTokVal == std::string("[") ) {
            this->advance();
            std::shared_ptr<JSNode> propExpr = this->parseExpr();
            this->expectValue(std::string("]"));
            std::shared_ptr<JSNode> member =  std::make_shared<JSNode>();
            member->type = std::string("OptionalMemberExpression");
            member->left  = object;
            member->right  = propExpr;
            member->computed = true;
            member->start = object->start;
            member->line = object->line;
            member->col = object->col;
            object = member;
          } else {
            std::shared_ptr<Token> propTok = this->expect(std::string("Identifier"));
            std::shared_ptr<JSNode> member_1 =  std::make_shared<JSNode>();
            member_1->type = std::string("OptionalMemberExpression");
            member_1->left  = object;
            member_1->name = propTok->value;
            member_1->computed = false;
            member_1->start = object->start;
            member_1->line = object->line;
            member_1->col = object->col;
            object = member_1;
          }
        }
      } else {
        if ( tokVal == std::string(".") ) {
          this->advance();
          std::shared_ptr<Token> propTok_1 = this->expect(std::string("Identifier"));
          std::shared_ptr<JSNode> member_2 =  std::make_shared<JSNode>();
          member_2->type = std::string("MemberExpression");
          member_2->left  = object;
          member_2->name = propTok_1->value;
          member_2->computed = false;
          member_2->start = object->start;
          member_2->line = object->line;
          member_2->col = object->col;
          object = member_2;
        } else {
          if ( tokVal == std::string("[") ) {
            this->advance();
            std::shared_ptr<JSNode> propExpr_1 = this->parseExpr();
            this->expectValue(std::string("]"));
            std::shared_ptr<JSNode> member_3 =  std::make_shared<JSNode>();
            member_3->type = std::string("MemberExpression");
            member_3->left  = object;
            member_3->right  = propExpr_1;
            member_3->computed = true;
            member_3->start = object->start;
            member_3->line = object->line;
            member_3->col = object->col;
            object = member_3;
          } else {
            if ( tokVal == std::string("(") ) {
              this->advance();
              std::shared_ptr<JSNode> call_1 =  std::make_shared<JSNode>();
              call_1->type = std::string("CallExpression");
              call_1->left  = object;
              call_1->start = object->start;
              call_1->line = object->line;
              call_1->col = object->col;
              while ((this->matchValue(std::string(")")) == false) && (this->isAtEnd() == false)) {
                if ( ((int)(call_1->children.size())) > 0 ) {
                  this->expectValue(std::string(","));
                }
                if ( this->matchValue(std::string(")")) || this->isAtEnd() ) {
                  break;
                }
                if ( this->matchValue(std::string("...")) ) {
                  std::shared_ptr<Token> spreadTok = this->peek();
                  this->advance();
                  std::shared_ptr<JSNode> spreadArg = this->parseAssignment();
                  std::shared_ptr<JSNode> spread =  std::make_shared<JSNode>();
                  spread->type = std::string("SpreadElement");
                  spread->left  = spreadArg;
                  spread->start = spreadTok->start;
                  spread->line = spreadTok->line;
                  spread->col = spreadTok->col;
                  call_1->children.push_back( spread  );
                } else {
                  std::shared_ptr<JSNode> arg_1 = this->parseAssignment();
                  call_1->children.push_back( arg_1  );
                }
              }
              this->expectValue(std::string(")"));
              object = call_1;
            } else {
              cont = false;
            }
          }
        }
      }
    }
  }
  return object;
}
std::shared_ptr<JSNode>  SimpleParser::parseNewExpression() {
  std::shared_ptr<JSNode> newExpr =  std::make_shared<JSNode>();
  newExpr->type = std::string("NewExpression");
  std::shared_ptr<Token> startTok = this->peek();
  newExpr->start = startTok->start;
  newExpr->line = startTok->line;
  newExpr->col = startTok->col;
  this->expectValue(std::string("new"));
  std::shared_ptr<JSNode> callee = this->parsePrimary();
  bool cont = true;
  while (cont) {
    std::string tokVal = this->peekValue();
    if ( tokVal == std::string(".") ) {
      this->advance();
      std::shared_ptr<Token> propTok = this->expect(std::string("Identifier"));
      std::shared_ptr<JSNode> member =  std::make_shared<JSNode>();
      member->type = std::string("MemberExpression");
      member->left  = callee;
      member->name = propTok->value;
      member->computed = false;
      member->start = callee->start;
      member->line = callee->line;
      member->col = callee->col;
      callee = member;
    } else {
      cont = false;
    }
  }
  newExpr->left  = callee;
  if ( this->matchValue(std::string("(")) ) {
    this->advance();
    while ((this->matchValue(std::string(")")) == false) && (this->isAtEnd() == false)) {
      if ( ((int)(newExpr->children.size())) > 0 ) {
        this->expectValue(std::string(","));
      }
      if ( this->matchValue(std::string(")")) || this->isAtEnd() ) {
        break;
      }
      std::shared_ptr<JSNode> arg = this->parseAssignment();
      newExpr->children.push_back( arg  );
    }
    this->expectValue(std::string(")"));
  }
  return newExpr;
}
std::shared_ptr<JSNode>  SimpleParser::parsePrimary() {
  std::string tokType = this->peekType();
  std::string tokVal = this->peekValue();
  std::shared_ptr<Token> tok = this->peek();
  if ( tokVal == std::string("async") ) {
    std::string nextVal = this->peekAt(1);
    std::string nextNext = this->peekAt(2);
    if ( (nextVal == std::string("(")) || (nextNext == std::string("=>")) ) {
      return this->parseAsyncArrowFunction();
    }
  }
  if ( tokType == std::string("Identifier") ) {
    std::string nextVal_1 = this->peekAt(1);
    if ( nextVal_1 == std::string("=>") ) {
      return this->parseArrowFunction();
    }
    this->advance();
    std::shared_ptr<JSNode> id =  std::make_shared<JSNode>();
    id->type = std::string("Identifier");
    id->name = tok->value;
    id->start = tok->start;
    id->end = tok->end;
    id->line = tok->line;
    id->col = tok->col;
    return id;
  }
  if ( tokType == std::string("Number") ) {
    this->advance();
    std::shared_ptr<JSNode> lit =  std::make_shared<JSNode>();
    lit->type = std::string("Literal");
    lit->raw = tok->value;
    lit->start = tok->start;
    lit->end = tok->end;
    lit->line = tok->line;
    lit->col = tok->col;
    return lit;
  }
  if ( tokType == std::string("String") ) {
    this->advance();
    std::shared_ptr<JSNode> lit_1 =  std::make_shared<JSNode>();
    lit_1->type = std::string("Literal");
    lit_1->raw = tok->value;
    lit_1->kind = std::string("string");
    lit_1->start = tok->start;
    lit_1->end = tok->end;
    lit_1->line = tok->line;
    lit_1->col = tok->col;
    return lit_1;
  }
  if ( (tokVal == std::string("true")) || (tokVal == std::string("false")) ) {
    this->advance();
    std::shared_ptr<JSNode> lit_2 =  std::make_shared<JSNode>();
    lit_2->type = std::string("Literal");
    lit_2->raw = tok->value;
    lit_2->start = tok->start;
    lit_2->end = tok->end;
    lit_2->line = tok->line;
    lit_2->col = tok->col;
    return lit_2;
  }
  if ( tokVal == std::string("null") ) {
    this->advance();
    std::shared_ptr<JSNode> lit_3 =  std::make_shared<JSNode>();
    lit_3->type = std::string("Literal");
    lit_3->raw = std::string("null");
    lit_3->start = tok->start;
    lit_3->end = tok->end;
    lit_3->line = tok->line;
    lit_3->col = tok->col;
    return lit_3;
  }
  if ( tokType == std::string("TemplateLiteral") ) {
    this->advance();
    std::shared_ptr<JSNode> tmpl =  std::make_shared<JSNode>();
    tmpl->type = std::string("TemplateLiteral");
    tmpl->raw = tok->value;
    tmpl->start = tok->start;
    tmpl->end = tok->end;
    tmpl->line = tok->line;
    tmpl->col = tok->col;
    return tmpl;
  }
  if ( tokVal == std::string("(") ) {
    if ( this->isArrowFunction() ) {
      return this->parseArrowFunction();
    }
    this->advance();
    std::shared_ptr<JSNode> expr = this->parseExpr();
    this->expectValue(std::string(")"));
    return expr;
  }
  if ( tokVal == std::string("[") ) {
    return this->parseArray();
  }
  if ( tokVal == std::string("{") ) {
    return this->parseObject();
  }
  if ( tokVal == std::string("/") ) {
    return this->parseRegexLiteral();
  }
  if ( tokVal == std::string("function") ) {
    return this->parseFunctionExpression();
  }
  this->advance();
  std::shared_ptr<JSNode> fallback =  std::make_shared<JSNode>();
  fallback->type = std::string("Identifier");
  fallback->name = tok->value;
  fallback->start = tok->start;
  fallback->end = tok->end;
  fallback->line = tok->line;
  fallback->col = tok->col;
  return fallback;
}
std::shared_ptr<JSNode>  SimpleParser::parseArray() {
  std::shared_ptr<JSNode> arr =  std::make_shared<JSNode>();
  arr->type = std::string("ArrayExpression");
  std::shared_ptr<Token> startTok = this->peek();
  arr->start = startTok->start;
  arr->line = startTok->line;
  arr->col = startTok->col;
  this->expectValue(std::string("["));
  while ((this->matchValue(std::string("]")) == false) && (this->isAtEnd() == false)) {
    if ( ((int)(arr->children.size())) > 0 ) {
      this->expectValue(std::string(","));
    }
    if ( this->matchValue(std::string("]")) || this->isAtEnd() ) {
      break;
    }
    if ( this->matchValue(std::string("...")) ) {
      std::shared_ptr<Token> spreadTok = this->peek();
      this->advance();
      std::shared_ptr<JSNode> arg = this->parseAssignment();
      std::shared_ptr<JSNode> spread =  std::make_shared<JSNode>();
      spread->type = std::string("SpreadElement");
      spread->left  = arg;
      spread->start = spreadTok->start;
      spread->line = spreadTok->line;
      spread->col = spreadTok->col;
      arr->children.push_back( spread  );
    } else {
      std::shared_ptr<JSNode> elem = this->parseAssignment();
      arr->children.push_back( elem  );
    }
  }
  this->expectValue(std::string("]"));
  return arr;
}
std::shared_ptr<JSNode>  SimpleParser::parseObject() {
  std::shared_ptr<JSNode> obj =  std::make_shared<JSNode>();
  obj->type = std::string("ObjectExpression");
  std::shared_ptr<Token> startTok = this->peek();
  obj->start = startTok->start;
  obj->line = startTok->line;
  obj->col = startTok->col;
  this->expectValue(std::string("{"));
  while ((this->matchValue(std::string("}")) == false) && (this->isAtEnd() == false)) {
    if ( ((int)(obj->children.size())) > 0 ) {
      this->expectValue(std::string(","));
    }
    if ( this->matchValue(std::string("}")) || this->isAtEnd() ) {
      break;
    }
    if ( this->matchValue(std::string("...")) ) {
      std::shared_ptr<Token> spreadTok = this->peek();
      this->advance();
      std::shared_ptr<JSNode> arg = this->parseAssignment();
      std::shared_ptr<JSNode> spread =  std::make_shared<JSNode>();
      spread->type = std::string("SpreadElement");
      spread->left  = arg;
      spread->start = spreadTok->start;
      spread->line = spreadTok->line;
      spread->col = spreadTok->col;
      obj->children.push_back( spread  );
    } else {
      std::shared_ptr<JSNode> prop =  std::make_shared<JSNode>();
      prop->type = std::string("Property");
      std::shared_ptr<Token> keyTok = this->peek();
      std::string keyType = this->peekType();
      if ( this->matchValue(std::string("[")) ) {
        this->advance();
        std::shared_ptr<JSNode> keyExpr = this->parseAssignment();
        this->expectValue(std::string("]"));
        this->expectValue(std::string(":"));
        std::shared_ptr<JSNode> val = this->parseAssignment();
        prop->right  = keyExpr;
        prop->left  = val;
        prop->computed = true;
        prop->start = keyTok->start;
        prop->line = keyTok->line;
        prop->col = keyTok->col;
        obj->children.push_back( prop  );
      } else {
        if ( ((keyType == std::string("Identifier")) || (keyType == std::string("String"))) || (keyType == std::string("Number")) ) {
          this->advance();
          prop->name = keyTok->value;
          prop->start = keyTok->start;
          prop->line = keyTok->line;
          prop->col = keyTok->col;
          if ( this->matchValue(std::string(":")) ) {
            this->expectValue(std::string(":"));
            std::shared_ptr<JSNode> val_1 = this->parseAssignment();
            prop->left  = val_1;
          } else {
            std::shared_ptr<JSNode> id =  std::make_shared<JSNode>();
            id->type = std::string("Identifier");
            id->name = keyTok->value;
            id->start = keyTok->start;
            id->line = keyTok->line;
            id->col = keyTok->col;
            prop->left  = id;
            prop->shorthand = true;
          }
          obj->children.push_back( prop  );
        } else {
          std::string err = (((((std::string("Parse error at line ") + std::to_string(keyTok->line)) + std::string(":")) + std::to_string(keyTok->col)) + std::string(": unexpected token '")) + keyTok->value) + std::string("' in object literal");
          this->addError(err);
          this->advance();
        }
      }
    }
  }
  this->expectValue(std::string("}"));
  return obj;
}
std::shared_ptr<JSNode>  SimpleParser::parseArrayPattern() {
  std::shared_ptr<JSNode> pattern =  std::make_shared<JSNode>();
  pattern->type = std::string("ArrayPattern");
  std::shared_ptr<Token> startTok = this->peek();
  pattern->start = startTok->start;
  pattern->line = startTok->line;
  pattern->col = startTok->col;
  this->expectValue(std::string("["));
  while ((this->matchValue(std::string("]")) == false) && (this->isAtEnd() == false)) {
    if ( ((int)(pattern->children.size())) > 0 ) {
      this->expectValue(std::string(","));
    }
    if ( this->matchValue(std::string("]")) || this->isAtEnd() ) {
      break;
    }
    if ( this->matchValue(std::string("...")) ) {
      std::shared_ptr<Token> restTok = this->peek();
      this->advance();
      std::shared_ptr<Token> idTok = this->expect(std::string("Identifier"));
      std::shared_ptr<JSNode> rest =  std::make_shared<JSNode>();
      rest->type = std::string("RestElement");
      rest->name = idTok->value;
      rest->start = restTok->start;
      rest->line = restTok->line;
      rest->col = restTok->col;
      pattern->children.push_back( rest  );
    } else {
      if ( this->matchValue(std::string("[")) ) {
        std::shared_ptr<JSNode> nested = this->parseArrayPattern();
        pattern->children.push_back( nested  );
      } else {
        if ( this->matchValue(std::string("{")) ) {
          std::shared_ptr<JSNode> nested_1 = this->parseObjectPattern();
          pattern->children.push_back( nested_1  );
        } else {
          std::shared_ptr<Token> idTok_1 = this->expect(std::string("Identifier"));
          std::shared_ptr<JSNode> id =  std::make_shared<JSNode>();
          id->type = std::string("Identifier");
          id->name = idTok_1->value;
          id->start = idTok_1->start;
          id->line = idTok_1->line;
          id->col = idTok_1->col;
          pattern->children.push_back( id  );
        }
      }
    }
  }
  this->expectValue(std::string("]"));
  return pattern;
}
std::shared_ptr<JSNode>  SimpleParser::parseObjectPattern() {
  std::shared_ptr<JSNode> pattern =  std::make_shared<JSNode>();
  pattern->type = std::string("ObjectPattern");
  std::shared_ptr<Token> startTok = this->peek();
  pattern->start = startTok->start;
  pattern->line = startTok->line;
  pattern->col = startTok->col;
  this->expectValue(std::string("{"));
  while ((this->matchValue(std::string("}")) == false) && (this->isAtEnd() == false)) {
    if ( ((int)(pattern->children.size())) > 0 ) {
      this->expectValue(std::string(","));
    }
    if ( this->matchValue(std::string("}")) || this->isAtEnd() ) {
      break;
    }
    if ( this->matchValue(std::string("...")) ) {
      std::shared_ptr<Token> restTok = this->peek();
      this->advance();
      std::shared_ptr<Token> idTok = this->expect(std::string("Identifier"));
      std::shared_ptr<JSNode> rest =  std::make_shared<JSNode>();
      rest->type = std::string("RestElement");
      rest->name = idTok->value;
      rest->start = restTok->start;
      rest->line = restTok->line;
      rest->col = restTok->col;
      pattern->children.push_back( rest  );
    } else {
      std::shared_ptr<JSNode> prop =  std::make_shared<JSNode>();
      prop->type = std::string("Property");
      std::shared_ptr<Token> keyTok = this->expect(std::string("Identifier"));
      prop->name = keyTok->value;
      prop->start = keyTok->start;
      prop->line = keyTok->line;
      prop->col = keyTok->col;
      if ( this->matchValue(std::string(":")) ) {
        this->advance();
        if ( this->matchValue(std::string("[")) ) {
          std::shared_ptr<JSNode> nested = this->parseArrayPattern();
          prop->left  = nested;
        } else {
          if ( this->matchValue(std::string("{")) ) {
            std::shared_ptr<JSNode> nested_1 = this->parseObjectPattern();
            prop->left  = nested_1;
          } else {
            std::shared_ptr<Token> idTok2 = this->expect(std::string("Identifier"));
            std::shared_ptr<JSNode> id =  std::make_shared<JSNode>();
            id->type = std::string("Identifier");
            id->name = idTok2->value;
            id->start = idTok2->start;
            id->line = idTok2->line;
            id->col = idTok2->col;
            prop->left  = id;
          }
        }
      } else {
        std::shared_ptr<JSNode> id_1 =  std::make_shared<JSNode>();
        id_1->type = std::string("Identifier");
        id_1->name = keyTok->value;
        id_1->start = keyTok->start;
        id_1->line = keyTok->line;
        id_1->col = keyTok->col;
        prop->left  = id_1;
        prop->shorthand = true;
      }
      pattern->children.push_back( prop  );
    }
  }
  this->expectValue(std::string("}"));
  return pattern;
}
bool  SimpleParser::isArrowFunction() {
  if ( this->matchValue(std::string("(")) == false ) {
    return false;
  }
  int depth = 1;
  int scanPos = 1;
  while (depth > 0) {
    std::string scanVal = this->peekAt(scanPos);
    if ( scanVal == std::string("") ) {
      return false;
    }
    if ( scanVal == std::string("(") ) {
      depth = depth + 1;
    }
    if ( scanVal == std::string(")") ) {
      depth = depth - 1;
    }
    scanPos = scanPos + 1;
  }
  std::string afterParen = this->peekAt(scanPos);
  return afterParen == std::string("=>");
}
std::shared_ptr<JSNode>  SimpleParser::parseArrowFunction() {
  std::shared_ptr<JSNode> arrow =  std::make_shared<JSNode>();
  arrow->type = std::string("ArrowFunctionExpression");
  std::shared_ptr<Token> startTok = this->peek();
  arrow->start = startTok->start;
  arrow->line = startTok->line;
  arrow->col = startTok->col;
  if ( this->matchValue(std::string("(")) ) {
    this->advance();
    while ((this->matchValue(std::string(")")) == false) && (this->isAtEnd() == false)) {
      if ( ((int)(arrow->children.size())) > 0 ) {
        this->expectValue(std::string(","));
      }
      if ( this->matchValue(std::string(")")) || this->isAtEnd() ) {
        break;
      }
      std::shared_ptr<Token> paramTok = this->expect(std::string("Identifier"));
      std::shared_ptr<JSNode> param =  std::make_shared<JSNode>();
      param->type = std::string("Identifier");
      param->name = paramTok->value;
      param->start = paramTok->start;
      param->line = paramTok->line;
      param->col = paramTok->col;
      arrow->children.push_back( param  );
    }
    this->expectValue(std::string(")"));
  } else {
    std::shared_ptr<Token> paramTok_1 = this->expect(std::string("Identifier"));
    std::shared_ptr<JSNode> param_1 =  std::make_shared<JSNode>();
    param_1->type = std::string("Identifier");
    param_1->name = paramTok_1->value;
    param_1->start = paramTok_1->start;
    param_1->line = paramTok_1->line;
    param_1->col = paramTok_1->col;
    arrow->children.push_back( param_1  );
  }
  this->expectValue(std::string("=>"));
  if ( this->matchValue(std::string("{")) ) {
    std::shared_ptr<JSNode> body = this->parseBlock();
    arrow->body  = body;
  } else {
    std::shared_ptr<JSNode> expr = this->parseAssignment();
    arrow->body  = expr;
  }
  return arrow;
}
std::shared_ptr<JSNode>  SimpleParser::parseAsyncArrowFunction() {
  std::shared_ptr<JSNode> arrow =  std::make_shared<JSNode>();
  arrow->type = std::string("ArrowFunctionExpression");
  arrow->async = true;
  std::shared_ptr<Token> startTok = this->peek();
  arrow->start = startTok->start;
  arrow->line = startTok->line;
  arrow->col = startTok->col;
  this->expectValue(std::string("async"));
  if ( this->matchValue(std::string("(")) ) {
    this->advance();
    while ((this->matchValue(std::string(")")) == false) && (this->isAtEnd() == false)) {
      if ( ((int)(arrow->children.size())) > 0 ) {
        this->expectValue(std::string(","));
      }
      if ( this->matchValue(std::string(")")) || this->isAtEnd() ) {
        break;
      }
      std::shared_ptr<Token> paramTok = this->expect(std::string("Identifier"));
      std::shared_ptr<JSNode> param =  std::make_shared<JSNode>();
      param->type = std::string("Identifier");
      param->name = paramTok->value;
      param->start = paramTok->start;
      param->line = paramTok->line;
      param->col = paramTok->col;
      arrow->children.push_back( param  );
    }
    this->expectValue(std::string(")"));
  } else {
    std::shared_ptr<Token> paramTok_1 = this->expect(std::string("Identifier"));
    std::shared_ptr<JSNode> param_1 =  std::make_shared<JSNode>();
    param_1->type = std::string("Identifier");
    param_1->name = paramTok_1->value;
    param_1->start = paramTok_1->start;
    param_1->line = paramTok_1->line;
    param_1->col = paramTok_1->col;
    arrow->children.push_back( param_1  );
  }
  this->expectValue(std::string("=>"));
  if ( this->matchValue(std::string("{")) ) {
    std::shared_ptr<JSNode> body = this->parseBlock();
    arrow->body  = body;
  } else {
    std::shared_ptr<JSNode> expr = this->parseAssignment();
    arrow->body  = expr;
  }
  return arrow;
}
ASTPrinter::ASTPrinter( ) {
}
void  ASTPrinter::printNode( std::shared_ptr<JSNode> node , int depth ) {
  std::string indent = std::string("");
  int i = 0;
  while (i < depth) {
    indent = indent + std::string("  ");
    i = i + 1;
  }
  int numComments = (int)(node->leadingComments.size());
  if ( numComments > 0 ) {
    for ( int ci = 0; ci != (int)(node->leadingComments.size()); ci++) {
      std::shared_ptr<JSNode> comment = node->leadingComments.at(ci);
      std::string commentType = comment->type;
      std::string preview = comment->raw;
      if ( ((int)(preview.length())) > 40 ) {
        preview = (r_utf8_substr(preview, 0, 40 - 0)) + std::string("...");
      }
      std::cout << ((indent + commentType) + std::string(": ")) + preview << std::endl;
    }
  }
  std::string nodeType = node->type;
  std::string loc = (((std::string("[") + std::to_string(node->line)) + std::string(":")) + std::to_string(node->col)) + std::string("]");
  if ( nodeType == std::string("VariableDeclaration") ) {
    std::string kind = node->name;
    if ( ((int)(kind.length())) > 0 ) {
      std::cout << (((indent + std::string("VariableDeclaration (")) + kind) + std::string(") ")) + loc << std::endl;
    } else {
      std::cout << (indent + std::string("VariableDeclaration ")) + loc << std::endl;
    }
    for ( int ci_1 = 0; ci_1 != (int)(node->children.size()); ci_1++) {
      std::shared_ptr<JSNode> child = node->children.at(ci_1);
      ASTPrinter::printNode(child, depth + 1);
    }
    return;
  }
  if ( nodeType == std::string("VariableDeclarator") ) {
    if ( node->left != NULL  ) {
      std::shared_ptr<JSNode> id = node->left;
      std::string idType = id->type;
      if ( idType == std::string("Identifier") ) {
        std::cout << (((indent + std::string("VariableDeclarator: ")) + id->name) + std::string(" ")) + loc << std::endl;
      } else {
        std::cout << (indent + std::string("VariableDeclarator ")) + loc << std::endl;
        std::cout << indent + std::string("  pattern:") << std::endl;
        ASTPrinter::printNode(id, depth + 2);
      }
    } else {
      std::cout << (indent + std::string("VariableDeclarator ")) + loc << std::endl;
    }
    if ( node->right != NULL  ) {
      ASTPrinter::printNode(node->right, depth + 1);
    }
    return;
  }
  if ( nodeType == std::string("FunctionDeclaration") ) {
    std::string params = std::string("");
    for ( int pi = 0; pi != (int)(node->children.size()); pi++) {
      std::shared_ptr<JSNode> p = node->children.at(pi);
      if ( pi > 0 ) {
        params = params + std::string(", ");
      }
      params = params + p->name;
    }
    std::string prefix = std::string("");
    if ( node->async ) {
      if ( node->generator ) {
        prefix = std::string("async function* ");
      } else {
        prefix = std::string("async ");
      }
    } else {
      if ( node->generator ) {
        prefix = std::string("function* ");
      }
    }
    if ( ((int)(prefix.length())) > 0 ) {
      std::cout << ((((((indent + std::string("FunctionDeclaration: ")) + prefix) + node->name) + std::string("(")) + params) + std::string(") ")) + loc << std::endl;
    } else {
      std::cout << (((((indent + std::string("FunctionDeclaration: ")) + node->name) + std::string("(")) + params) + std::string(") ")) + loc << std::endl;
    }
    if ( node->body != NULL  ) {
      ASTPrinter::printNode(node->body, depth + 1);
    }
    return;
  }
  if ( nodeType == std::string("ClassDeclaration") ) {
    std::string output = (indent + std::string("ClassDeclaration: ")) + node->name;
    if ( node->left != NULL  ) {
      std::shared_ptr<JSNode> superClass = node->left;
      output = (output + std::string(" extends ")) + superClass->name;
    }
    std::cout << (output + std::string(" ")) + loc << std::endl;
    if ( node->body != NULL  ) {
      ASTPrinter::printNode(node->body, depth + 1);
    }
    return;
  }
  if ( nodeType == std::string("ClassBody") ) {
    std::cout << (indent + std::string("ClassBody ")) + loc << std::endl;
    for ( int mi = 0; mi != (int)(node->children.size()); mi++) {
      std::shared_ptr<JSNode> method = node->children.at(mi);
      ASTPrinter::printNode(method, depth + 1);
    }
    return;
  }
  if ( nodeType == std::string("MethodDefinition") ) {
    std::string staticStr = std::string("");
    if ( node->_static ) {
      staticStr = std::string("static ");
    }
    std::cout << ((((indent + std::string("MethodDefinition: ")) + staticStr) + node->name) + std::string(" ")) + loc << std::endl;
    if ( node->body != NULL  ) {
      ASTPrinter::printNode(node->body, depth + 1);
    }
    return;
  }
  if ( nodeType == std::string("ArrowFunctionExpression") ) {
    std::string params_1 = std::string("");
    for ( int pi_1 = 0; pi_1 != (int)(node->children.size()); pi_1++) {
      std::shared_ptr<JSNode> p_1 = node->children.at(pi_1);
      if ( pi_1 > 0 ) {
        params_1 = params_1 + std::string(", ");
      }
      params_1 = params_1 + p_1->name;
    }
    std::string asyncStr = std::string("");
    if ( node->async ) {
      asyncStr = std::string("async ");
    }
    std::cout << (((((indent + std::string("ArrowFunctionExpression: ")) + asyncStr) + std::string("(")) + params_1) + std::string(") => ")) + loc << std::endl;
    if ( node->body != NULL  ) {
      ASTPrinter::printNode(node->body, depth + 1);
    }
    return;
  }
  if ( nodeType == std::string("YieldExpression") ) {
    std::string delegateStr = std::string("");
    if ( node->name == std::string("delegate") ) {
      delegateStr = std::string("*");
    }
    std::cout << (((indent + std::string("YieldExpression")) + delegateStr) + std::string(" ")) + loc << std::endl;
    if ( node->left != NULL  ) {
      ASTPrinter::printNode(node->left, depth + 1);
    }
    return;
  }
  if ( nodeType == std::string("AwaitExpression") ) {
    std::cout << (indent + std::string("AwaitExpression ")) + loc << std::endl;
    if ( node->left != NULL  ) {
      ASTPrinter::printNode(node->left, depth + 1);
    }
    return;
  }
  if ( nodeType == std::string("TemplateLiteral") ) {
    std::cout << (((indent + std::string("TemplateLiteral: `")) + node->name) + std::string("` ")) + loc << std::endl;
    return;
  }
  if ( nodeType == std::string("BlockStatement") ) {
    std::cout << (indent + std::string("BlockStatement ")) + loc << std::endl;
    for ( int ci_2 = 0; ci_2 != (int)(node->children.size()); ci_2++) {
      std::shared_ptr<JSNode> child_1 = node->children.at(ci_2);
      ASTPrinter::printNode(child_1, depth + 1);
    }
    return;
  }
  if ( nodeType == std::string("ReturnStatement") ) {
    std::cout << (indent + std::string("ReturnStatement ")) + loc << std::endl;
    if ( node->left != NULL  ) {
      ASTPrinter::printNode(node->left, depth + 1);
    }
    return;
  }
  if ( nodeType == std::string("IfStatement") ) {
    std::cout << (indent + std::string("IfStatement ")) + loc << std::endl;
    std::cout << indent + std::string("  test:") << std::endl;
    if ( node->test != NULL  ) {
      ASTPrinter::printNode(node->test, depth + 2);
    }
    std::cout << indent + std::string("  consequent:") << std::endl;
    if ( node->body != NULL  ) {
      ASTPrinter::printNode(node->body, depth + 2);
    }
    if ( node->alternate != NULL  ) {
      std::cout << indent + std::string("  alternate:") << std::endl;
      ASTPrinter::printNode(node->alternate, depth + 2);
    }
    return;
  }
  if ( nodeType == std::string("ExpressionStatement") ) {
    std::cout << (indent + std::string("ExpressionStatement ")) + loc << std::endl;
    if ( node->left != NULL  ) {
      ASTPrinter::printNode(node->left, depth + 1);
    }
    return;
  }
  if ( nodeType == std::string("AssignmentExpression") ) {
    std::cout << (((indent + std::string("AssignmentExpression: ")) + node->name) + std::string(" ")) + loc << std::endl;
    if ( node->left != NULL  ) {
      std::cout << indent + std::string("  left:") << std::endl;
      ASTPrinter::printNode(node->left, depth + 2);
    }
    if ( node->right != NULL  ) {
      std::cout << indent + std::string("  right:") << std::endl;
      ASTPrinter::printNode(node->right, depth + 2);
    }
    return;
  }
  if ( (nodeType == std::string("BinaryExpression")) || (nodeType == std::string("LogicalExpression")) ) {
    std::cout << ((((indent + nodeType) + std::string(": ")) + node->name) + std::string(" ")) + loc << std::endl;
    if ( node->left != NULL  ) {
      std::cout << indent + std::string("  left:") << std::endl;
      ASTPrinter::printNode(node->left, depth + 2);
    }
    if ( node->right != NULL  ) {
      std::cout << indent + std::string("  right:") << std::endl;
      ASTPrinter::printNode(node->right, depth + 2);
    }
    return;
  }
  if ( nodeType == std::string("UnaryExpression") ) {
    std::cout << (((indent + std::string("UnaryExpression: ")) + node->name) + std::string(" ")) + loc << std::endl;
    if ( node->left != NULL  ) {
      ASTPrinter::printNode(node->left, depth + 1);
    }
    return;
  }
  if ( nodeType == std::string("UpdateExpression") ) {
    std::string prefix_1 = std::string("");
    if ( node->prefix ) {
      prefix_1 = std::string("prefix ");
    } else {
      prefix_1 = std::string("postfix ");
    }
    std::cout << ((((indent + std::string("UpdateExpression: ")) + prefix_1) + node->name) + std::string(" ")) + loc << std::endl;
    if ( node->left != NULL  ) {
      ASTPrinter::printNode(node->left, depth + 1);
    }
    return;
  }
  if ( nodeType == std::string("NewExpression") ) {
    std::cout << (indent + std::string("NewExpression ")) + loc << std::endl;
    std::cout << indent + std::string("  callee:") << std::endl;
    if ( node->left != NULL  ) {
      ASTPrinter::printNode(node->left, depth + 2);
    }
    if ( ((int)(node->children.size())) > 0 ) {
      std::cout << indent + std::string("  arguments:") << std::endl;
      for ( int ai = 0; ai != (int)(node->children.size()); ai++) {
        std::shared_ptr<JSNode> arg = node->children.at(ai);
        ASTPrinter::printNode(arg, depth + 2);
      }
    }
    return;
  }
  if ( nodeType == std::string("ConditionalExpression") ) {
    std::cout << (indent + std::string("ConditionalExpression ")) + loc << std::endl;
    std::cout << indent + std::string("  test:") << std::endl;
    if ( node->left != NULL  ) {
      ASTPrinter::printNode(node->left, depth + 2);
    }
    std::cout << indent + std::string("  consequent:") << std::endl;
    if ( node->body != NULL  ) {
      ASTPrinter::printNode(node->body, depth + 2);
    }
    std::cout << indent + std::string("  alternate:") << std::endl;
    if ( node->right != NULL  ) {
      ASTPrinter::printNode(node->right, depth + 2);
    }
    return;
  }
  if ( nodeType == std::string("CallExpression") ) {
    std::cout << (indent + std::string("CallExpression ")) + loc << std::endl;
    if ( node->left != NULL  ) {
      std::cout << indent + std::string("  callee:") << std::endl;
      ASTPrinter::printNode(node->left, depth + 2);
    }
    if ( ((int)(node->children.size())) > 0 ) {
      std::cout << indent + std::string("  arguments:") << std::endl;
      for ( int ai_1 = 0; ai_1 != (int)(node->children.size()); ai_1++) {
        std::shared_ptr<JSNode> arg_1 = node->children.at(ai_1);
        ASTPrinter::printNode(arg_1, depth + 2);
      }
    }
    return;
  }
  if ( nodeType == std::string("MemberExpression") ) {
    if ( node->computed == false ) {
      std::cout << (((indent + std::string("MemberExpression: .")) + node->name) + std::string(" ")) + loc << std::endl;
    } else {
      std::cout << (indent + std::string("MemberExpression: [computed] ")) + loc << std::endl;
    }
    if ( node->left != NULL  ) {
      ASTPrinter::printNode(node->left, depth + 1);
    }
    if ( node->right != NULL  ) {
      ASTPrinter::printNode(node->right, depth + 1);
    }
    return;
  }
  if ( nodeType == std::string("Identifier") ) {
    std::cout << (((indent + std::string("Identifier: ")) + node->name) + std::string(" ")) + loc << std::endl;
    return;
  }
  if ( nodeType == std::string("Literal") ) {
    std::cout << (((((indent + std::string("Literal: ")) + node->name) + std::string(" (")) + node->raw) + std::string(") ")) + loc << std::endl;
    return;
  }
  if ( nodeType == std::string("ArrayExpression") ) {
    std::cout << (indent + std::string("ArrayExpression ")) + loc << std::endl;
    for ( int ei = 0; ei != (int)(node->children.size()); ei++) {
      std::shared_ptr<JSNode> elem = node->children.at(ei);
      ASTPrinter::printNode(elem, depth + 1);
    }
    return;
  }
  if ( nodeType == std::string("ObjectExpression") ) {
    std::cout << (indent + std::string("ObjectExpression ")) + loc << std::endl;
    for ( int pi_2 = 0; pi_2 != (int)(node->children.size()); pi_2++) {
      std::shared_ptr<JSNode> prop = node->children.at(pi_2);
      ASTPrinter::printNode(prop, depth + 1);
    }
    return;
  }
  if ( nodeType == std::string("Property") ) {
    std::string shorthand = std::string("");
    if ( node->shorthand ) {
      shorthand = std::string(" (shorthand)");
    }
    std::cout << ((((indent + std::string("Property: ")) + node->name) + shorthand) + std::string(" ")) + loc << std::endl;
    if ( node->left != NULL  ) {
      ASTPrinter::printNode(node->left, depth + 1);
    }
    return;
  }
  if ( nodeType == std::string("ArrayPattern") ) {
    std::cout << (indent + std::string("ArrayPattern ")) + loc << std::endl;
    for ( int ei_1 = 0; ei_1 != (int)(node->children.size()); ei_1++) {
      std::shared_ptr<JSNode> elem_1 = node->children.at(ei_1);
      ASTPrinter::printNode(elem_1, depth + 1);
    }
    return;
  }
  if ( nodeType == std::string("ObjectPattern") ) {
    std::cout << (indent + std::string("ObjectPattern ")) + loc << std::endl;
    for ( int pi_3 = 0; pi_3 != (int)(node->children.size()); pi_3++) {
      std::shared_ptr<JSNode> prop_1 = node->children.at(pi_3);
      ASTPrinter::printNode(prop_1, depth + 1);
    }
    return;
  }
  if ( nodeType == std::string("SpreadElement") ) {
    std::cout << (indent + std::string("SpreadElement ")) + loc << std::endl;
    if ( node->left != NULL  ) {
      ASTPrinter::printNode(node->left, depth + 1);
    }
    return;
  }
  if ( nodeType == std::string("RestElement") ) {
    std::cout << (((indent + std::string("RestElement: ...")) + node->name) + std::string(" ")) + loc << std::endl;
    return;
  }
  if ( nodeType == std::string("WhileStatement") ) {
    std::cout << (indent + std::string("WhileStatement ")) + loc << std::endl;
    std::cout << indent + std::string("  test:") << std::endl;
    if ( node->test != NULL  ) {
      ASTPrinter::printNode(node->test, depth + 2);
    }
    std::cout << indent + std::string("  body:") << std::endl;
    if ( node->body != NULL  ) {
      ASTPrinter::printNode(node->body, depth + 2);
    }
    return;
  }
  if ( nodeType == std::string("DoWhileStatement") ) {
    std::cout << (indent + std::string("DoWhileStatement ")) + loc << std::endl;
    std::cout << indent + std::string("  body:") << std::endl;
    if ( node->body != NULL  ) {
      ASTPrinter::printNode(node->body, depth + 2);
    }
    std::cout << indent + std::string("  test:") << std::endl;
    if ( node->test != NULL  ) {
      ASTPrinter::printNode(node->test, depth + 2);
    }
    return;
  }
  if ( nodeType == std::string("ForStatement") ) {
    std::cout << (indent + std::string("ForStatement ")) + loc << std::endl;
    if ( node->left != NULL  ) {
      std::cout << indent + std::string("  init:") << std::endl;
      ASTPrinter::printNode(node->left, depth + 2);
    }
    if ( node->test != NULL  ) {
      std::cout << indent + std::string("  test:") << std::endl;
      ASTPrinter::printNode(node->test, depth + 2);
    }
    if ( node->right != NULL  ) {
      std::cout << indent + std::string("  update:") << std::endl;
      ASTPrinter::printNode(node->right, depth + 2);
    }
    std::cout << indent + std::string("  body:") << std::endl;
    if ( node->body != NULL  ) {
      ASTPrinter::printNode(node->body, depth + 2);
    }
    return;
  }
  if ( nodeType == std::string("ForOfStatement") ) {
    std::cout << (indent + std::string("ForOfStatement ")) + loc << std::endl;
    if ( node->left != NULL  ) {
      std::cout << indent + std::string("  left:") << std::endl;
      ASTPrinter::printNode(node->left, depth + 2);
    }
    if ( node->right != NULL  ) {
      std::cout << indent + std::string("  right:") << std::endl;
      ASTPrinter::printNode(node->right, depth + 2);
    }
    std::cout << indent + std::string("  body:") << std::endl;
    if ( node->body != NULL  ) {
      ASTPrinter::printNode(node->body, depth + 2);
    }
    return;
  }
  if ( nodeType == std::string("ForInStatement") ) {
    std::cout << (indent + std::string("ForInStatement ")) + loc << std::endl;
    if ( node->left != NULL  ) {
      std::cout << indent + std::string("  left:") << std::endl;
      ASTPrinter::printNode(node->left, depth + 2);
    }
    if ( node->right != NULL  ) {
      std::cout << indent + std::string("  right:") << std::endl;
      ASTPrinter::printNode(node->right, depth + 2);
    }
    std::cout << indent + std::string("  body:") << std::endl;
    if ( node->body != NULL  ) {
      ASTPrinter::printNode(node->body, depth + 2);
    }
    return;
  }
  if ( nodeType == std::string("SwitchStatement") ) {
    std::cout << (indent + std::string("SwitchStatement ")) + loc << std::endl;
    std::cout << indent + std::string("  discriminant:") << std::endl;
    if ( node->test != NULL  ) {
      ASTPrinter::printNode(node->test, depth + 2);
    }
    std::cout << indent + std::string("  cases:") << std::endl;
    for ( int ci_3 = 0; ci_3 != (int)(node->children.size()); ci_3++) {
      std::shared_ptr<JSNode> caseNode = node->children.at(ci_3);
      ASTPrinter::printNode(caseNode, depth + 2);
    }
    return;
  }
  if ( nodeType == std::string("SwitchCase") ) {
    if ( node->name == std::string("default") ) {
      std::cout << (indent + std::string("SwitchCase: default ")) + loc << std::endl;
    } else {
      std::cout << (indent + std::string("SwitchCase ")) + loc << std::endl;
      if ( node->test != NULL  ) {
        std::cout << indent + std::string("  test:") << std::endl;
        ASTPrinter::printNode(node->test, depth + 2);
      }
    }
    if ( ((int)(node->children.size())) > 0 ) {
      std::cout << indent + std::string("  consequent:") << std::endl;
      for ( int si = 0; si != (int)(node->children.size()); si++) {
        std::shared_ptr<JSNode> stmt = node->children.at(si);
        ASTPrinter::printNode(stmt, depth + 2);
      }
    }
    return;
  }
  if ( nodeType == std::string("TryStatement") ) {
    std::cout << (indent + std::string("TryStatement ")) + loc << std::endl;
    std::cout << indent + std::string("  block:") << std::endl;
    if ( node->body != NULL  ) {
      ASTPrinter::printNode(node->body, depth + 2);
    }
    if ( node->left != NULL  ) {
      std::cout << indent + std::string("  handler:") << std::endl;
      ASTPrinter::printNode(node->left, depth + 2);
    }
    if ( node->right != NULL  ) {
      std::cout << indent + std::string("  finalizer:") << std::endl;
      ASTPrinter::printNode(node->right, depth + 2);
    }
    return;
  }
  if ( nodeType == std::string("CatchClause") ) {
    std::cout << (((indent + std::string("CatchClause: ")) + node->name) + std::string(" ")) + loc << std::endl;
    if ( node->body != NULL  ) {
      ASTPrinter::printNode(node->body, depth + 1);
    }
    return;
  }
  if ( nodeType == std::string("ThrowStatement") ) {
    std::cout << (indent + std::string("ThrowStatement ")) + loc << std::endl;
    if ( node->left != NULL  ) {
      ASTPrinter::printNode(node->left, depth + 1);
    }
    return;
  }
  if ( nodeType == std::string("BreakStatement") ) {
    if ( ((int)(node->name.length())) > 0 ) {
      std::cout << (((indent + std::string("BreakStatement: ")) + node->name) + std::string(" ")) + loc << std::endl;
    } else {
      std::cout << (indent + std::string("BreakStatement ")) + loc << std::endl;
    }
    return;
  }
  if ( nodeType == std::string("ContinueStatement") ) {
    if ( ((int)(node->name.length())) > 0 ) {
      std::cout << (((indent + std::string("ContinueStatement: ")) + node->name) + std::string(" ")) + loc << std::endl;
    } else {
      std::cout << (indent + std::string("ContinueStatement ")) + loc << std::endl;
    }
    return;
  }
  std::cout << ((indent + nodeType) + std::string(" ")) + loc << std::endl;
}
JSPrinter::JSPrinter( ) {
  this->indentLevel = 0;
  this->indentStr = std::string("  ");
  this->output = std::string("");
}
std::string  JSPrinter::getIndent() {
  std::string result = std::string("");
  int i = 0;
  while (i < this->indentLevel) {
    result = result + this->indentStr;
    i = i + 1;
  }
  return result;
}
void  JSPrinter::emit( std::string text ) {
  this->output = this->output + text;
}
void  JSPrinter::emitLine( std::string text ) {
  std::string ind = this->getIndent();
  this->output = ((this->output + ind) + text) + std::string("\n");
}
void  JSPrinter::emitIndent() {
  std::string ind = this->getIndent();
  this->output = this->output + ind;
}
void  JSPrinter::indent() {
  this->indentLevel = this->indentLevel + 1;
}
void  JSPrinter::dedent() {
  this->indentLevel = this->indentLevel - 1;
}
void  JSPrinter::printLeadingComments( std::shared_ptr<JSNode> node ) {
  int numComments = (int)(node->leadingComments.size());
  if ( numComments == 0 ) {
    return;
  }
  for ( int i = 0; i != (int)(node->leadingComments.size()); i++) {
    std::shared_ptr<JSNode> comment = node->leadingComments.at(i);
    this->printComment(comment);
  }
}
void  JSPrinter::printComment( std::shared_ptr<JSNode> comment ) {
  std::string commentType = comment->type;
  std::string value = comment->raw;
  if ( commentType == std::string("LineComment") ) {
    this->emitLine(std::string("//") + value);
    return;
  }
  if ( commentType == std::string("BlockComment") ) {
    this->emitLine((std::string("/*") + value) + std::string("*/"));
    return;
  }
  if ( commentType == std::string("JSDocComment") ) {
    this->printJSDocComment(value);
    return;
  }
}
void  JSPrinter::printJSDocComment( std::string value ) {
  this->emitLine((std::string("/*") + value) + std::string("*/"));
}
std::string  JSPrinter::print( std::shared_ptr<JSNode> node ) {
  this->output = std::string("");
  this->indentLevel = 0;
  this->printNode(node);
  return this->output;
}
void  JSPrinter::printNode( std::shared_ptr<JSNode> node ) {
  std::string nodeType = node->type;
  if ( nodeType == std::string("Program") ) {
    this->printProgram(node);
    return;
  }
  if ( nodeType == std::string("VariableDeclaration") ) {
    this->printVariableDeclaration(node);
    return;
  }
  if ( nodeType == std::string("FunctionDeclaration") ) {
    this->printFunctionDeclaration(node);
    return;
  }
  if ( nodeType == std::string("ClassDeclaration") ) {
    this->printClassDeclaration(node);
    return;
  }
  if ( nodeType == std::string("ImportDeclaration") ) {
    this->printImportDeclaration(node);
    return;
  }
  if ( nodeType == std::string("ExportNamedDeclaration") ) {
    this->printExportNamedDeclaration(node);
    return;
  }
  if ( nodeType == std::string("ExportDefaultDeclaration") ) {
    this->printExportDefaultDeclaration(node);
    return;
  }
  if ( nodeType == std::string("ExportAllDeclaration") ) {
    this->printExportAllDeclaration(node);
    return;
  }
  if ( nodeType == std::string("BlockStatement") ) {
    this->printBlockStatement(node);
    return;
  }
  if ( nodeType == std::string("ExpressionStatement") ) {
    this->printExpressionStatement(node);
    return;
  }
  if ( nodeType == std::string("ReturnStatement") ) {
    this->printReturnStatement(node);
    return;
  }
  if ( nodeType == std::string("IfStatement") ) {
    this->printIfStatement(node);
    return;
  }
  if ( nodeType == std::string("WhileStatement") ) {
    this->printWhileStatement(node);
    return;
  }
  if ( nodeType == std::string("DoWhileStatement") ) {
    this->printDoWhileStatement(node);
    return;
  }
  if ( nodeType == std::string("ForStatement") ) {
    this->printForStatement(node);
    return;
  }
  if ( nodeType == std::string("ForOfStatement") ) {
    this->printForOfStatement(node);
    return;
  }
  if ( nodeType == std::string("ForInStatement") ) {
    this->printForInStatement(node);
    return;
  }
  if ( nodeType == std::string("SwitchStatement") ) {
    this->printSwitchStatement(node);
    return;
  }
  if ( nodeType == std::string("TryStatement") ) {
    this->printTryStatement(node);
    return;
  }
  if ( nodeType == std::string("ThrowStatement") ) {
    this->printThrowStatement(node);
    return;
  }
  if ( nodeType == std::string("BreakStatement") ) {
    this->emit(std::string("break"));
    return;
  }
  if ( nodeType == std::string("ContinueStatement") ) {
    this->emit(std::string("continue"));
    return;
  }
  if ( nodeType == std::string("EmptyStatement") ) {
    return;
  }
  if ( nodeType == std::string("Identifier") ) {
    this->emit(node->name);
    return;
  }
  if ( nodeType == std::string("Literal") ) {
    this->printLiteral(node);
    return;
  }
  if ( nodeType == std::string("TemplateLiteral") ) {
    this->emit((std::string("`") + node->raw) + std::string("`"));
    return;
  }
  if ( nodeType == std::string("RegexLiteral") ) {
    this->emit(((std::string("/") + node->name) + std::string("/")) + node->kind);
    return;
  }
  if ( nodeType == std::string("ArrayExpression") ) {
    this->printArrayExpression(node);
    return;
  }
  if ( nodeType == std::string("ObjectExpression") ) {
    this->printObjectExpression(node);
    return;
  }
  if ( nodeType == std::string("BinaryExpression") ) {
    this->printBinaryExpression(node);
    return;
  }
  if ( nodeType == std::string("LogicalExpression") ) {
    this->printBinaryExpression(node);
    return;
  }
  if ( nodeType == std::string("UnaryExpression") ) {
    this->printUnaryExpression(node);
    return;
  }
  if ( nodeType == std::string("UpdateExpression") ) {
    this->printUpdateExpression(node);
    return;
  }
  if ( nodeType == std::string("AssignmentExpression") ) {
    this->printAssignmentExpression(node);
    return;
  }
  if ( nodeType == std::string("ConditionalExpression") ) {
    this->printConditionalExpression(node);
    return;
  }
  if ( nodeType == std::string("CallExpression") ) {
    this->printCallExpression(node);
    return;
  }
  if ( nodeType == std::string("OptionalCallExpression") ) {
    this->printOptionalCallExpression(node);
    return;
  }
  if ( nodeType == std::string("MemberExpression") ) {
    this->printMemberExpression(node);
    return;
  }
  if ( nodeType == std::string("OptionalMemberExpression") ) {
    this->printOptionalMemberExpression(node);
    return;
  }
  if ( nodeType == std::string("NewExpression") ) {
    this->printNewExpression(node);
    return;
  }
  if ( nodeType == std::string("ArrowFunctionExpression") ) {
    this->printArrowFunction(node);
    return;
  }
  if ( nodeType == std::string("FunctionExpression") ) {
    this->printFunctionExpression(node);
    return;
  }
  if ( nodeType == std::string("YieldExpression") ) {
    this->printYieldExpression(node);
    return;
  }
  if ( nodeType == std::string("AwaitExpression") ) {
    this->printAwaitExpression(node);
    return;
  }
  if ( nodeType == std::string("SpreadElement") ) {
    this->printSpreadElement(node);
    return;
  }
  if ( nodeType == std::string("RestElement") ) {
    this->emit(std::string("...") + node->name);
    return;
  }
  if ( nodeType == std::string("ArrayPattern") ) {
    this->printArrayPattern(node);
    return;
  }
  if ( nodeType == std::string("ObjectPattern") ) {
    this->printObjectPattern(node);
    return;
  }
  this->emit((std::string("/* unknown: ") + nodeType) + std::string(" */"));
}
void  JSPrinter::printProgram( std::shared_ptr<JSNode> node ) {
  for ( int idx = 0; idx != (int)(node->children.size()); idx++) {
    std::shared_ptr<JSNode> stmt = node->children.at(idx);
    this->printStatement(stmt);
  }
}
void  JSPrinter::printStatement( std::shared_ptr<JSNode> node ) {
  this->printLeadingComments(node);
  std::string nodeType = node->type;
  if ( nodeType == std::string("BlockStatement") ) {
    this->printBlockStatement(node);
    return;
  }
  if ( (((((((((nodeType == std::string("FunctionDeclaration")) || (nodeType == std::string("ClassDeclaration"))) || (nodeType == std::string("IfStatement"))) || (nodeType == std::string("WhileStatement"))) || (nodeType == std::string("DoWhileStatement"))) || (nodeType == std::string("ForStatement"))) || (nodeType == std::string("ForOfStatement"))) || (nodeType == std::string("ForInStatement"))) || (nodeType == std::string("SwitchStatement"))) || (nodeType == std::string("TryStatement")) ) {
    this->emitIndent();
    this->printNode(node);
    this->emit(std::string("\n"));
    return;
  }
  this->emitIndent();
  this->printNode(node);
  this->emit(std::string(";\n"));
}
void  JSPrinter::printVariableDeclaration( std::shared_ptr<JSNode> node ) {
  std::string kind = node->kind;
  if ( ((int)(kind.length())) == 0 ) {
    kind = std::string("var");
  }
  this->emit(kind + std::string(" "));
  bool first = true;
  for ( int idx = 0; idx != (int)(node->children.size()); idx++) {
    std::shared_ptr<JSNode> decl = node->children.at(idx);
    if ( first == false ) {
      this->emit(std::string(", "));
    }
    first = false;
    this->printVariableDeclarator(decl);
  }
}
void  JSPrinter::printVariableDeclarator( std::shared_ptr<JSNode> node ) {
  if ( node->id != NULL  ) {
    std::shared_ptr<JSNode> id = node->id;
    this->printNode(id);
  }
  if ( node->init != NULL  ) {
    this->emit(std::string(" = "));
    this->printNode(node->init);
  }
}
void  JSPrinter::printFunctionDeclaration( std::shared_ptr<JSNode> node ) {
  if ( node->async ) {
    this->emit(std::string("async "));
  }
  this->emit(std::string("function"));
  if ( node->generator ) {
    this->emit(std::string("*"));
  }
  this->emit((std::string(" ") + node->name) + std::string("("));
  this->printParams(node->children);
  this->emit(std::string(") "));
  if ( node->body != NULL  ) {
    this->printNode(node->body);
  }
}
void  JSPrinter::printParams( std::vector<std::shared_ptr<JSNode>> params ) {
  bool first = true;
  for ( int idx = 0; idx != (int)(params.size()); idx++) {
    std::shared_ptr<JSNode> p = params.at(idx);
    if ( first == false ) {
      this->emit(std::string(", "));
    }
    first = false;
    this->printNode(p);
  }
}
void  JSPrinter::printClassDeclaration( std::shared_ptr<JSNode> node ) {
  this->emit(std::string("class ") + node->name);
  if ( node->superClass != NULL  ) {
    std::shared_ptr<JSNode> sc = node->superClass;
    this->emit(std::string(" extends ") + sc->name);
  }
  this->emit(std::string(" "));
  if ( node->body != NULL  ) {
    this->printClassBody(node->body);
  }
}
void  JSPrinter::printClassBody( std::shared_ptr<JSNode> node ) {
  this->emit(std::string("{\n"));
  this->indent();
  for ( int idx = 0; idx != (int)(node->children.size()); idx++) {
    std::shared_ptr<JSNode> method = node->children.at(idx);
    this->printMethodDefinition(method);
  }
  this->dedent();
  this->emitIndent();
  this->emit(std::string("}"));
}
void  JSPrinter::printMethodDefinition( std::shared_ptr<JSNode> node ) {
  this->emitIndent();
  if ( node->_static ) {
    this->emit(std::string("static "));
  }
  if ( node->key != NULL  ) {
    std::shared_ptr<JSNode> keyNode = node->key;
    this->emit(keyNode->name + std::string("("));
  } else {
    this->emit(std::string("("));
  }
  if ( node->body != NULL  ) {
    std::shared_ptr<JSNode> _func = node->body;
    this->printParams(_func->children);
  }
  this->emit(std::string(") "));
  if ( node->body != NULL  ) {
    std::shared_ptr<JSNode> func_1 = node->body;
    if ( func_1->body != NULL  ) {
      this->printNode(func_1->body);
    }
  }
  this->emit(std::string("\n"));
}
void  JSPrinter::printBlockStatement( std::shared_ptr<JSNode> node ) {
  this->emit(std::string("{\n"));
  this->indent();
  for ( int idx = 0; idx != (int)(node->children.size()); idx++) {
    std::shared_ptr<JSNode> stmt = node->children.at(idx);
    this->printStatement(stmt);
  }
  this->dedent();
  this->emitIndent();
  this->emit(std::string("}"));
}
void  JSPrinter::printExpressionStatement( std::shared_ptr<JSNode> node ) {
  if ( node->left != NULL  ) {
    this->printNode(node->left);
  }
}
void  JSPrinter::printReturnStatement( std::shared_ptr<JSNode> node ) {
  this->emit(std::string("return"));
  if ( node->left != NULL  ) {
    this->emit(std::string(" "));
    this->printNode(node->left);
  }
}
void  JSPrinter::printIfStatement( std::shared_ptr<JSNode> node ) {
  this->emit(std::string("if ("));
  if ( node->test != NULL  ) {
    this->printNode(node->test);
  }
  this->emit(std::string(") "));
  if ( node->body != NULL  ) {
    this->printNode(node->body);
  }
  if ( node->alternate != NULL  ) {
    this->emit(std::string(" else "));
    this->printNode(node->alternate);
  }
}
void  JSPrinter::printWhileStatement( std::shared_ptr<JSNode> node ) {
  this->emit(std::string("while ("));
  if ( node->test != NULL  ) {
    this->printNode(node->test);
  }
  this->emit(std::string(") "));
  if ( node->body != NULL  ) {
    this->printNode(node->body);
  }
}
void  JSPrinter::printDoWhileStatement( std::shared_ptr<JSNode> node ) {
  this->emit(std::string("do "));
  if ( node->body != NULL  ) {
    this->printNode(node->body);
  }
  this->emit(std::string(" while ("));
  if ( node->test != NULL  ) {
    this->printNode(node->test);
  }
  this->emit(std::string(")"));
}
void  JSPrinter::printForStatement( std::shared_ptr<JSNode> node ) {
  this->emit(std::string("for ("));
  if ( node->left != NULL  ) {
    this->printNode(node->left);
  }
  this->emit(std::string("; "));
  if ( node->test != NULL  ) {
    this->printNode(node->test);
  }
  this->emit(std::string("; "));
  if ( node->right != NULL  ) {
    this->printNode(node->right);
  }
  this->emit(std::string(") "));
  if ( node->body != NULL  ) {
    this->printNode(node->body);
  }
}
void  JSPrinter::printForOfStatement( std::shared_ptr<JSNode> node ) {
  this->emit(std::string("for ("));
  if ( node->left != NULL  ) {
    this->printNode(node->left);
  }
  this->emit(std::string(" of "));
  if ( node->right != NULL  ) {
    this->printNode(node->right);
  }
  this->emit(std::string(") "));
  if ( node->body != NULL  ) {
    this->printNode(node->body);
  }
}
void  JSPrinter::printForInStatement( std::shared_ptr<JSNode> node ) {
  this->emit(std::string("for ("));
  if ( node->left != NULL  ) {
    this->printNode(node->left);
  }
  this->emit(std::string(" in "));
  if ( node->right != NULL  ) {
    this->printNode(node->right);
  }
  this->emit(std::string(") "));
  if ( node->body != NULL  ) {
    this->printNode(node->body);
  }
}
void  JSPrinter::printSwitchStatement( std::shared_ptr<JSNode> node ) {
  this->emit(std::string("switch ("));
  if ( node->test != NULL  ) {
    this->printNode(node->test);
  }
  this->emit(std::string(") {\n"));
  this->indent();
  for ( int idx = 0; idx != (int)(node->children.size()); idx++) {
    std::shared_ptr<JSNode> caseNode = node->children.at(idx);
    this->printSwitchCase(caseNode);
  }
  this->dedent();
  this->emitIndent();
  this->emit(std::string("}"));
}
void  JSPrinter::printSwitchCase( std::shared_ptr<JSNode> node ) {
  if ( node->name == std::string("default") ) {
    this->emitLine(std::string("default:"));
  } else {
    this->emitIndent();
    this->emit(std::string("case "));
    if ( node->test != NULL  ) {
      this->printNode(node->test);
    }
    this->emit(std::string(":\n"));
  }
  this->indent();
  for ( int idx = 0; idx != (int)(node->children.size()); idx++) {
    std::shared_ptr<JSNode> stmt = node->children.at(idx);
    this->printStatement(stmt);
  }
  this->dedent();
}
void  JSPrinter::printTryStatement( std::shared_ptr<JSNode> node ) {
  this->emit(std::string("try "));
  if ( node->body != NULL  ) {
    this->printNode(node->body);
  }
  if ( node->left != NULL  ) {
    std::shared_ptr<JSNode> catchClause = node->left;
    this->emit((std::string(" catch (") + catchClause->name) + std::string(") "));
    if ( catchClause->body != NULL  ) {
      this->printNode(catchClause->body);
    }
  }
  if ( node->right != NULL  ) {
    this->emit(std::string(" finally "));
    this->printNode(node->right);
  }
}
void  JSPrinter::printThrowStatement( std::shared_ptr<JSNode> node ) {
  this->emit(std::string("throw "));
  if ( node->left != NULL  ) {
    this->printNode(node->left);
  }
}
void  JSPrinter::printLiteral( std::shared_ptr<JSNode> node ) {
  std::string value = node->raw;
  if ( node->kind == std::string("string") ) {
    this->emit((std::string("'") + value) + std::string("'"));
  } else {
    this->emit(value);
  }
}
void  JSPrinter::printArrayExpression( std::shared_ptr<JSNode> node ) {
  this->emit(std::string("["));
  bool first = true;
  for ( int idx = 0; idx != (int)(node->children.size()); idx++) {
    std::shared_ptr<JSNode> elem = node->children.at(idx);
    if ( first == false ) {
      this->emit(std::string(", "));
    }
    first = false;
    this->printNode(elem);
  }
  this->emit(std::string("]"));
}
void  JSPrinter::printObjectExpression( std::shared_ptr<JSNode> node ) {
  if ( ((int)(node->children.size())) == 0 ) {
    this->emit(std::string("{}"));
    return;
  }
  this->emit(std::string("{ "));
  bool first = true;
  for ( int idx = 0; idx != (int)(node->children.size()); idx++) {
    std::shared_ptr<JSNode> prop = node->children.at(idx);
    if ( first == false ) {
      this->emit(std::string(", "));
    }
    first = false;
    this->printProperty(prop);
  }
  this->emit(std::string(" }"));
}
void  JSPrinter::printProperty( std::shared_ptr<JSNode> node ) {
  std::string nodeType = node->type;
  if ( nodeType == std::string("SpreadElement") ) {
    this->printSpreadElement(node);
    return;
  }
  if ( node->shorthand ) {
    this->emit(node->name);
    return;
  }
  if ( node->computed ) {
    this->emit(std::string("["));
    if ( node->right != NULL  ) {
      this->printNode(node->right);
    }
    this->emit(std::string("]: "));
    if ( node->left != NULL  ) {
      this->printNode(node->left);
    }
    return;
  }
  this->emit(node->name + std::string(": "));
  if ( node->left != NULL  ) {
    this->printNode(node->left);
  }
}
void  JSPrinter::printBinaryExpression( std::shared_ptr<JSNode> node ) {
  this->emit(std::string("("));
  if ( node->left != NULL  ) {
    this->printNode(node->left);
  }
  this->emit((std::string(" ") + node->_operator) + std::string(" "));
  if ( node->right != NULL  ) {
    this->printNode(node->right);
  }
  this->emit(std::string(")"));
}
void  JSPrinter::printUnaryExpression( std::shared_ptr<JSNode> node ) {
  std::string op = node->_operator;
  this->emit(op);
  if ( op == std::string("typeof") ) {
    this->emit(std::string(" "));
  }
  if ( node->left != NULL  ) {
    this->printNode(node->left);
  }
}
void  JSPrinter::printUpdateExpression( std::shared_ptr<JSNode> node ) {
  std::string op = node->_operator;
  bool isPrefix = node->prefix;
  if ( isPrefix ) {
    this->emit(op);
  }
  if ( node->left != NULL  ) {
    this->printNode(node->left);
  }
  if ( isPrefix == false ) {
    this->emit(op);
  }
}
void  JSPrinter::printAssignmentExpression( std::shared_ptr<JSNode> node ) {
  if ( node->left != NULL  ) {
    this->printNode(node->left);
  }
  this->emit((std::string(" ") + node->_operator) + std::string(" "));
  if ( node->right != NULL  ) {
    this->printNode(node->right);
  }
}
void  JSPrinter::printConditionalExpression( std::shared_ptr<JSNode> node ) {
  if ( node->left != NULL  ) {
    this->printNode(node->left);
  }
  this->emit(std::string(" ? "));
  if ( node->body != NULL  ) {
    this->printNode(node->body);
  }
  this->emit(std::string(" : "));
  if ( node->right != NULL  ) {
    this->printNode(node->right);
  }
}
void  JSPrinter::printCallExpression( std::shared_ptr<JSNode> node ) {
  if ( node->left != NULL  ) {
    this->printNode(node->left);
  }
  this->emit(std::string("("));
  bool first = true;
  for ( int idx = 0; idx != (int)(node->children.size()); idx++) {
    std::shared_ptr<JSNode> arg = node->children.at(idx);
    if ( first == false ) {
      this->emit(std::string(", "));
    }
    first = false;
    this->printNode(arg);
  }
  this->emit(std::string(")"));
}
void  JSPrinter::printMemberExpression( std::shared_ptr<JSNode> node ) {
  if ( node->left != NULL  ) {
    this->printNode(node->left);
  }
  if ( node->computed ) {
    this->emit(std::string("["));
    if ( node->right != NULL  ) {
      this->printNode(node->right);
    }
    this->emit(std::string("]"));
  } else {
    this->emit(std::string(".") + node->name);
  }
}
void  JSPrinter::printOptionalMemberExpression( std::shared_ptr<JSNode> node ) {
  if ( node->left != NULL  ) {
    this->printNode(node->left);
  }
  if ( node->computed ) {
    this->emit(std::string("?.["));
    if ( node->right != NULL  ) {
      this->printNode(node->right);
    }
    this->emit(std::string("]"));
  } else {
    this->emit(std::string("?.") + node->name);
  }
}
void  JSPrinter::printOptionalCallExpression( std::shared_ptr<JSNode> node ) {
  if ( node->left != NULL  ) {
    this->printNode(node->left);
  }
  this->emit(std::string("?.("));
  bool first = true;
  for ( int idx = 0; idx != (int)(node->children.size()); idx++) {
    std::shared_ptr<JSNode> arg = node->children.at(idx);
    if ( first == false ) {
      this->emit(std::string(", "));
    }
    first = false;
    this->printNode(arg);
  }
  this->emit(std::string(")"));
}
void  JSPrinter::printImportDeclaration( std::shared_ptr<JSNode> node ) {
  this->emit(std::string("import "));
  int numSpecifiers = (int)(node->children.size());
  if ( numSpecifiers == 0 ) {
    if ( node->right != NULL  ) {
      std::shared_ptr<JSNode> source = node->right;
      this->emit((std::string("\"") + source->raw) + std::string("\""));
    }
    return;
  }
  bool hasDefault = false;
  bool hasNamespace = false;
  bool hasNamed = false;
  for ( int idx = 0; idx != (int)(node->children.size()); idx++) {
    std::shared_ptr<JSNode> spec = node->children.at(idx);
    if ( spec->type == std::string("ImportDefaultSpecifier") ) {
      hasDefault = true;
    }
    if ( spec->type == std::string("ImportNamespaceSpecifier") ) {
      hasNamespace = true;
    }
    if ( spec->type == std::string("ImportSpecifier") ) {
      hasNamed = true;
    }
  }
  bool printedSomething = false;
  for ( int idx_1 = 0; idx_1 != (int)(node->children.size()); idx_1++) {
    std::shared_ptr<JSNode> spec_1 = node->children.at(idx_1);
    if ( spec_1->type == std::string("ImportDefaultSpecifier") ) {
      this->emit(spec_1->name);
      printedSomething = true;
    }
  }
  for ( int idx_2 = 0; idx_2 != (int)(node->children.size()); idx_2++) {
    std::shared_ptr<JSNode> spec_2 = node->children.at(idx_2);
    if ( spec_2->type == std::string("ImportNamespaceSpecifier") ) {
      if ( printedSomething ) {
        this->emit(std::string(", "));
      }
      this->emit(std::string("* as ") + spec_2->name);
      printedSomething = true;
    }
  }
  if ( hasNamed ) {
    if ( printedSomething ) {
      this->emit(std::string(", "));
    }
    this->emit(std::string("{ "));
    bool firstNamed = true;
    for ( int idx_3 = 0; idx_3 != (int)(node->children.size()); idx_3++) {
      std::shared_ptr<JSNode> spec_3 = node->children.at(idx_3);
      if ( spec_3->type == std::string("ImportSpecifier") ) {
        if ( firstNamed == false ) {
          this->emit(std::string(", "));
        }
        firstNamed = false;
        this->emit(spec_3->name);
        if ( ((int)(spec_3->kind.length())) > 0 ) {
          this->emit(std::string(" as ") + spec_3->kind);
        }
      }
    }
    this->emit(std::string(" }"));
  }
  this->emit(std::string(" from "));
  if ( node->right != NULL  ) {
    std::shared_ptr<JSNode> source_1 = node->right;
    this->emit((std::string("\"") + source_1->raw) + std::string("\""));
  }
}
void  JSPrinter::printExportNamedDeclaration( std::shared_ptr<JSNode> node ) {
  this->emit(std::string("export "));
  int numSpecifiers = (int)(node->children.size());
  if ( numSpecifiers > 0 ) {
    this->emit(std::string("{ "));
    bool first = true;
    for ( int idx = 0; idx != (int)(node->children.size()); idx++) {
      std::shared_ptr<JSNode> spec = node->children.at(idx);
      if ( first == false ) {
        this->emit(std::string(", "));
      }
      first = false;
      this->emit(spec->name);
      if ( ((int)(spec->kind.length())) > 0 ) {
        this->emit(std::string(" as ") + spec->kind);
      }
    }
    this->emit(std::string(" }"));
    if ( node->right != NULL  ) {
      std::shared_ptr<JSNode> source = node->right;
      this->emit((std::string(" from \"") + source->raw) + std::string("\""));
    }
    return;
  }
  if ( node->left != NULL  ) {
    this->printNode(node->left);
  }
}
void  JSPrinter::printExportDefaultDeclaration( std::shared_ptr<JSNode> node ) {
  this->emit(std::string("export default "));
  if ( node->left != NULL  ) {
    this->printNode(node->left);
  }
}
void  JSPrinter::printExportAllDeclaration( std::shared_ptr<JSNode> node ) {
  this->emit(std::string("export *"));
  if ( ((int)(node->name.length())) > 0 ) {
    this->emit(std::string(" as ") + node->name);
  }
  this->emit(std::string(" from "));
  if ( node->right != NULL  ) {
    std::shared_ptr<JSNode> source = node->right;
    this->emit((std::string("\"") + source->raw) + std::string("\""));
  }
}
void  JSPrinter::printNewExpression( std::shared_ptr<JSNode> node ) {
  this->emit(std::string("new "));
  if ( node->left != NULL  ) {
    this->printNode(node->left);
  }
  this->emit(std::string("("));
  bool first = true;
  for ( int idx = 0; idx != (int)(node->children.size()); idx++) {
    std::shared_ptr<JSNode> arg = node->children.at(idx);
    if ( first == false ) {
      this->emit(std::string(", "));
    }
    first = false;
    this->printNode(arg);
  }
  this->emit(std::string(")"));
}
void  JSPrinter::printArrowFunction( std::shared_ptr<JSNode> node ) {
  if ( node->async ) {
    this->emit(std::string("async "));
  }
  int paramCount = (int)(node->children.size());
  if ( paramCount == 1 ) {
    std::shared_ptr<JSNode> firstParam = node->children.at(0);
    if ( firstParam->type == std::string("Identifier") ) {
      this->emit(firstParam->name);
    } else {
      this->emit(std::string("("));
      this->printNode(firstParam);
      this->emit(std::string(")"));
    }
  } else {
    this->emit(std::string("("));
    this->printParams(node->children);
    this->emit(std::string(")"));
  }
  this->emit(std::string(" => "));
  if ( node->body != NULL  ) {
    std::shared_ptr<JSNode> body = node->body;
    if ( body->type == std::string("BlockStatement") ) {
      this->printNode(body);
    } else {
      this->printNode(body);
    }
  }
}
void  JSPrinter::printFunctionExpression( std::shared_ptr<JSNode> node ) {
  this->emit(std::string("function("));
  this->printParams(node->children);
  this->emit(std::string(") "));
  if ( node->body != NULL  ) {
    this->printNode(node->body);
  }
}
void  JSPrinter::printYieldExpression( std::shared_ptr<JSNode> node ) {
  this->emit(std::string("yield"));
  if ( node->name == std::string("delegate") ) {
    this->emit(std::string("*"));
  }
  if ( node->left != NULL  ) {
    this->emit(std::string(" "));
    this->printNode(node->left);
  }
}
void  JSPrinter::printAwaitExpression( std::shared_ptr<JSNode> node ) {
  this->emit(std::string("await "));
  if ( node->left != NULL  ) {
    this->printNode(node->left);
  }
}
void  JSPrinter::printSpreadElement( std::shared_ptr<JSNode> node ) {
  this->emit(std::string("..."));
  if ( node->left != NULL  ) {
    this->printNode(node->left);
  }
}
void  JSPrinter::printArrayPattern( std::shared_ptr<JSNode> node ) {
  this->emit(std::string("["));
  bool first = true;
  for ( int idx = 0; idx != (int)(node->children.size()); idx++) {
    std::shared_ptr<JSNode> elem = node->children.at(idx);
    if ( first == false ) {
      this->emit(std::string(", "));
    }
    first = false;
    this->printNode(elem);
  }
  this->emit(std::string("]"));
}
void  JSPrinter::printObjectPattern( std::shared_ptr<JSNode> node ) {
  this->emit(std::string("{ "));
  bool first = true;
  for ( int idx = 0; idx != (int)(node->children.size()); idx++) {
    std::shared_ptr<JSNode> prop = node->children.at(idx);
    if ( first == false ) {
      this->emit(std::string(", "));
    }
    first = false;
    std::string propType = prop->type;
    if ( propType == std::string("RestElement") ) {
      this->emit(std::string("...") + prop->name);
    } else {
      if ( prop->shorthand ) {
        this->emit(prop->name);
      } else {
        this->emit(prop->name + std::string(": "));
        if ( prop->left != NULL  ) {
          this->printNode(prop->left);
        }
      }
    }
  }
  this->emit(std::string(" }"));
}
JSParserMain::JSParserMain( ) {
}
void  JSParserMain::showHelp() {
  std::cout << std::string("JavaScript ES6 Parser and Pretty Printer") << std::endl;
  std::cout << std::string("") << std::endl;
  std::cout << std::string("Usage: node js_parser.js [options]") << std::endl;
  std::cout << std::string("") << std::endl;
  std::cout << std::string("Options:") << std::endl;
  std::cout << std::string("  -h, --help     Show this help message") << std::endl;
  std::cout << std::string("  -d             Run built-in demo/test suite") << std::endl;
  std::cout << std::string("  -i <file>      Input JavaScript file to parse") << std::endl;
  std::cout << std::string("  -o <file>      Output file for pretty-printed JavaScript") << std::endl;
  std::cout << std::string("  --ast          Show AST instead of pretty-printed output (with -i)") << std::endl;
  std::cout << std::string("") << std::endl;
  std::cout << std::string("Examples:") << std::endl;
  std::cout << std::string("  node js_parser.js -d                        Run the demo") << std::endl;
  std::cout << std::string("  node js_parser.js -i script.js              Parse and show AST") << std::endl;
  std::cout << std::string("  node js_parser.js -i script.js -o out.js    Parse and pretty-print to file") << std::endl;
  std::cout << std::string("  node js_parser.js -i src/app.js -o dist/app.js") << std::endl;
}
void  JSParserMain::processFile( std::string inputFile , std::string outputFile ) {
  std::string codeOpt = r_cpp_readFile( std::string(".") , inputFile);
  if ( codeOpt.empty() ) {
    std::cout << std::string("Error: Could not read file: ") + inputFile << std::endl;
    return;
  }
  std::string code = codeOpt;
  std::shared_ptr<Lexer> lexer =  std::make_shared<Lexer>(code);
  std::vector<std::shared_ptr<Token>> tokens = lexer->tokenize();
  std::shared_ptr<SimpleParser> parser =  std::make_shared<SimpleParser>();
  parser->initParserWithSource(tokens, code);
  std::shared_ptr<JSNode> program = parser->parseProgram();
  if ( parser->hasErrors() ) {
    std::cout << std::string("=== Parse Errors ===") << std::endl;
    for ( int ei = 0; ei != (int)(parser->errors.size()); ei++) {
      std::string err = parser->errors.at(ei);
      std::cout << err << std::endl;
    }
    std::cout << std::string("") << std::endl;
  }
  std::shared_ptr<JSPrinter> printer =  std::make_shared<JSPrinter>();
  int stmtCount = (int)(program->children.size());
  std::string output = (printer)->print(program);
  r_cpp_write_file( std::string(".") , outputFile , output  );
  std::cout << ((std::string("Parsed ") + inputFile) + std::string(" -> ")) + outputFile << std::endl;
  std::cout << (std::string("  ") + std::to_string(stmtCount)) + std::string(" statements processed") << std::endl;
}
void  JSParserMain::parseFile( std::string filename ) {
  std::string codeOpt = r_cpp_readFile( std::string(".") , filename);
  if ( codeOpt.empty() ) {
    std::cout << std::string("Error: Could not read file: ") + filename << std::endl;
    return;
  }
  std::string code = codeOpt;
  std::shared_ptr<Lexer> lexer =  std::make_shared<Lexer>(code);
  std::vector<std::shared_ptr<Token>> tokens = lexer->tokenize();
  std::shared_ptr<SimpleParser> parser =  std::make_shared<SimpleParser>();
  parser->initParserWithSource(tokens, code);
  std::shared_ptr<JSNode> program = parser->parseProgram();
  if ( parser->hasErrors() ) {
    std::cout << std::string("=== Parse Errors ===") << std::endl;
    for ( int ei = 0; ei != (int)(parser->errors.size()); ei++) {
      std::string err = parser->errors.at(ei);
      std::cout << err << std::endl;
    }
    std::cout << std::string("") << std::endl;
  }
  std::cout << (std::string("Program with ") + std::to_string(((int)(program->children.size())))) + std::string(" statements:") << std::endl;
  std::cout << std::string("") << std::endl;
  for ( int idx = 0; idx != (int)(program->children.size()); idx++) {
    std::shared_ptr<JSNode> stmt = program->children.at(idx);
    ASTPrinter::printNode(stmt, 0);
  }
}
void  JSParserMain::runDemo() {
  std::string code = std::string("// Variable declarations\r\nvar y = 'hello';\r\n\r\n// Function declaration\r\nfunction add(a, b) {\r\n    return a + b;\r\n}\r\n\r\n// While loop\r\nvar i = 0;\r\nwhile (i < 10) {\r\n    i = i + 1;\r\n}\r\n\r\n// Do-while loop\r\ndo {\r\n    i = i - 1;\r\n} while (i > 0);\r\n\r\n// For loop\r\nfor (var j = 0; j < 5; j = j + 1) {\r\n    x = x + j;\r\n}\r\n\r\n// Switch statement\r\nswitch (x) {\r\n    case 1:\r\n        y = 'one';\r\n        break;\r\n    case 2:\r\n        y = 'two';\r\n        break;\r\n    default:\r\n        y = 'other';\r\n}\r\n\r\n// Try-catch-finally\r\ntry {\r\n    throw 'error';\r\n} catch (e) {\r\n    y = e;\r\n} finally {\r\n    x = 0;\r\n}\r\n\r\n// If-else\r\nif (x > 100) {\r\n    y = 'big';\r\n} else {\r\n    y = 'small';\r\n}\r\n\r\nvar arr = [1, 2, 3];\r\nvar obj = { name: 'test', value: 42 };\r\n\r\n// Unary expressions\r\nvar negNum = -42;\r\nvar posNum = +5;\r\nvar notTrue = !true;\r\nvar notFalse = !false;\r\nvar doubleNot = !!x;\r\nvar negExpr = -(a + b);\r\n\r\n// Logical expressions\r\nvar andResult = true && false;\r\nvar orResult = true || false;\r\nvar complexLogic = (a > 0) && (b < 10) || (c == 5);\r\nvar shortCircuit = x && y && z;\r\nvar orChain = a || b || c;\r\n\r\n// Ternary expressions\r\nvar ternResult = x > 0 ? 'positive' : 'non-positive';\r\nvar nestedTern = a > b ? (b > c ? 'a>b>c' : 'a>b, b<=c') : 'a<=b';\r\nvar ternInExpr = 1 + (x ? 2 : 3);\r\n\r\n// Operator precedence tests\r\nvar prec1 = 1 + 2 * 3;\r\nvar prec2 = (1 + 2) * 3;\r\nvar prec3 = 1 + 2 + 3 + 4;\r\nvar prec4 = 2 * 3 + 4 * 5;\r\nvar prec5 = 1 < 2 && 3 > 1;\r\nvar prec6 = !x && y || z;\r\nvar prec7 = a == b && c != d;\r\nvar prec8 = -x + y * -z;\r\n\r\n// Comparison operators\r\nvar cmp1 = a == b;\r\nvar cmp2 = a != b;\r\nvar cmp3 = a < b;\r\nvar cmp4 = a <= b;\r\nvar cmp5 = a > b;\r\nvar cmp6 = a >= b;\r\n\r\n// === ES6 Features ===\r\n\r\n// let and const\r\nlet count = 0;\r\nconst PI = 3.14159;\r\n\r\n// Arrow functions\r\nconst add = (a, b) => a + b;\r\nconst double = x => x * 2;\r\nconst greet = (name) => {\r\n    return 'Hello, ' + name;\r\n};\r\nconst multiLine = (a, b) => {\r\n    let sum = a + b;\r\n    return sum * 2;\r\n};\r\n\r\n// Template literals\r\nlet name = 'World';\r\nlet greeting = `Hello, ${name}!`;\r\nlet multi = `Line 1\r\nLine 2`;\r\n\r\n// Class syntax\r\nclass Animal {\r\n    constructor(name) {\r\n        this.name = name;\r\n    }\r\n    \r\n    speak() {\r\n        return this.name + ' makes a sound';\r\n    }\r\n    \r\n    static create(name) {\r\n        return new Animal(name);\r\n    }\r\n}\r\n\r\nclass Dog extends Animal {\r\n    constructor(name, breed) {\r\n        super(name);\r\n        this.breed = breed;\r\n    }\r\n    \r\n    speak() {\r\n        return this.name + ' barks';\r\n    }\r\n}\r\n\r\n// Generator functions\r\nfunction* numberGenerator() {\r\n    yield 1;\r\n    yield 2;\r\n    yield 3;\r\n}\r\n\r\nfunction* delegateGenerator() {\r\n    yield* numberGenerator();\r\n    yield 4;\r\n}\r\n\r\n// Async/await\r\nasync function fetchData() {\r\n    const response = await fetch('/api/data');\r\n    const data = await response.json();\r\n    return data;\r\n}\r\n\r\nasync function processItems(items) {\r\n    for (const item of items) {\r\n        await processItem(item);\r\n    }\r\n}\r\n\r\n// Async arrow functions\r\nconst asyncArrow = async (x) => {\r\n    const result = await doSomething(x);\r\n    return result * 2;\r\n};\r\n\r\nconst asyncFetch = async (url) => await fetch(url);\r\n\r\n// Async generator (ES2018)\r\nasync function* asyncGenerator() {\r\n    yield await fetch('/api/1');\r\n    yield await fetch('/api/2');\r\n}\r\n\r\n// === for...of and for...in loops ===\r\n\r\n// For-of loop\r\nfor (const item of items) {\r\n    console.log(item);\r\n}\r\n\r\n// For-in loop\r\nfor (const key in obj) {\r\n    console.log(key);\r\n}\r\n\r\n// For-of with array destructuring\r\nfor (const [index, value] of entries) {\r\n    console.log(index, value);\r\n}\r\n\r\n// === Spread operator ===\r\n\r\n// Array spread\r\nconst arr1 = [1, 2, 3];\r\nconst arr2 = [...arr1, 4, 5];\r\nconst combined = [...arr1, ...arr2];\r\n\r\n// Object spread\r\nconst obj1 = { a: 1, b: 2 };\r\nconst obj2 = { ...obj1, c: 3 };\r\nconst merged = { ...obj1, ...obj2 };\r\n\r\n// Spread in function call\r\nconsole.log(...args);\r\n\r\n// === Rest parameters ===\r\n\r\nfunction sum(...numbers) {\r\n    return numbers.reduce((a, b) => a + b);\r\n}\r\n\r\nfunction firstAndRest(first, ...rest) {\r\n    return { first, rest };\r\n}\r\n\r\n// === Destructuring ===\r\n\r\n// Array destructuring\r\nconst [x, y, z] = [1, 2, 3];\r\nconst [first, ...others] = arr1;\r\nlet [a, b] = [b, a];\r\n\r\n// Object destructuring\r\nconst { name, age } = person;\r\nconst { x: newX, y: newY } = point;\r\nconst { a: { b: nested } } = deep;\r\n\r\n// Destructuring with default (parsed as identifier for now)\r\nconst { foo, bar } = obj;\r\n\r\n// Nested destructuring\r\nconst { user: { name: userName } } = data;\r\nconst [{ id }, { id: id2 }] = items;\r\n\r\n// Shorthand properties\r\nconst shorthand = { x, y, z };\r\n");
  std::cout << std::string("=== JavaScript ES6 Parser ===") << std::endl;
  std::cout << std::string("") << std::endl;
  std::cout << std::string("Input:") << std::endl;
  std::cout << code << std::endl;
  std::cout << std::string("") << std::endl;
  std::shared_ptr<Lexer> lexer =  std::make_shared<Lexer>(code);
  std::vector<std::shared_ptr<Token>> tokens = lexer->tokenize();
  std::cout << (std::string("--- Tokens: ") + std::to_string(((int)(tokens.size())))) + std::string(" ---") << std::endl;
  std::cout << std::string("") << std::endl;
  std::shared_ptr<SimpleParser> parser =  std::make_shared<SimpleParser>();
  parser->initParserWithSource(tokens, code);
  std::shared_ptr<JSNode> program = parser->parseProgram();
  if ( parser->hasErrors() ) {
    std::cout << std::string("=== Parse Errors ===") << std::endl;
    for ( int ei = 0; ei != (int)(parser->errors.size()); ei++) {
      std::string err = parser->errors.at(ei);
      std::cout << err << std::endl;
    }
    std::cout << std::string("") << std::endl;
  }
  std::cout << (std::string("Program with ") + std::to_string(((int)(program->children.size())))) + std::string(" statements:") << std::endl;
  std::cout << std::string("") << std::endl;
  std::cout << std::string("--- AST ---") << std::endl;
  for ( int idx = 0; idx != (int)(program->children.size()); idx++) {
    std::shared_ptr<JSNode> stmt = program->children.at(idx);
    ASTPrinter::printNode(stmt, 0);
  }
  std::cout << std::string("") << std::endl;
  std::cout << std::string("--- Pretty Printed Output ---") << std::endl;
  std::shared_ptr<JSPrinter> printer =  std::make_shared<JSPrinter>();
  std::string output = (printer)->print(program);
  std::cout << output << std::endl;
}
int main(int argc, char* argv[]) {
  __g_argc = argc;
  __g_argv = argv;
  int argCnt = __g_argc - 1;
  if ( argCnt == 0 ) {
    JSParserMain::showHelp();
    return 0;
  }
  std::string inputFile = std::string("");
  std::string outputFile = std::string("");
  bool runDefault = false;
  bool showAst = false;
  int i = 0;
  while (i < argCnt) {
    std::string arg = std::string(__g_argv[i + 1]);
    if ( (arg == std::string("--help")) || (arg == std::string("-h")) ) {
      JSParserMain::showHelp();
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
        if ( arg == std::string("-o") ) {
          i = i + 1;
          if ( i < argCnt ) {
            outputFile = std::string(__g_argv[i + 1]);
          }
          i = i + 1;
        } else {
          if ( arg == std::string("--ast") ) {
            showAst = true;
            i = i + 1;
          } else {
            i = i + 1;
          }
        }
      }
    }
  }
  if ( runDefault ) {
    JSParserMain::runDemo();
    return 0;
  }
  if ( ((int)(inputFile.length())) > 0 ) {
    if ( ((int)(outputFile.length())) > 0 ) {
      JSParserMain::processFile(inputFile, outputFile);
    } else {
      JSParserMain::parseFile(inputFile);
    }
    return 0;
  }
  JSParserMain::showHelp();
  return 0;
}
