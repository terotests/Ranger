#include  <memory>
#include  "variant.hpp"
#include  <string>
#include  <vector>
#include  <iostream>

// define classes here to avoid compiler errors
class Token;
class Lexer;
class TestLexer;

typedef mpark::variant<std::shared_ptr<Token>, std::shared_ptr<Lexer>, std::shared_ptr<TestLexer>, int, std::string, bool, double>  r_union_Any;

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
class TestLexer : public std::enable_shared_from_this<TestLexer>  { 
  public :
    /* class constructor */ 
    TestLexer( );
    /* static methods */ 
    static void m();
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
  return r_utf8_substr(source, pos, 1);
}
std::string  Lexer::peekAt( int offset ) {
  int idx = pos + offset;
  if ( idx >= __len ) {
    return std::string("");
  }
  return r_utf8_substr(source, idx, 1);
}
std::string  Lexer::advance() {
  if ( pos >= __len ) {
    return std::string("");
  }
  std::string ch = r_utf8_substr(source, pos, 1);
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
TestLexer::TestLexer( ) {
}
int main(int argc, char* argv[]) {
  __g_argc = argc;
  __g_argv = argv;
  std::string code = std::string("var x = 1;");
  std::cout << std::string("Testing lexer with: ") + code << std::endl;
  std::shared_ptr<Lexer> lexer =  std::make_shared<Lexer>(code);
  std::vector<std::shared_ptr<Token>> tokens = lexer->tokenize();
  std::cout << std::string("Token count: ") + (std::to_string(((int)(tokens.size())))) << std::endl;
  for ( int i = 0; i != (int)(tokens.size()); i++) {
    std::shared_ptr<Token> tok = tokens.at(i);
    std::cout << (((((std::to_string(i)) + std::string(": ")) + tok->tokenType) + std::string(" = '")) + tok->value) + std::string("'") << std::endl;
  }
  return 0;
}
