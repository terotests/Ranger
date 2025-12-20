#include  <memory>
#include  "variant.hpp"
#include  <string>
#include  <vector>
#include  <iostream>
#include  <cctype>
#include  <algorithm>
#include  <math.h>
#include  <cstdint>
#include  <fstream>
#include  <iterator>
#include  <sstream>
#include  <sys/stat.h>

// define classes here to avoid compiler errors
class Token;
class TSLexer;
class TSNode;
class TSParserSimple;
class EVGUnit;
class EVGColor;
class EVGBox;
class EVGElement;
class BufferChunk;
class GrowableBuffer;
class JPEGImage;
class JPEGReader;
class ExifTag;
class JPEGMetadataInfo;
class JPEGMetadataParser;
class JPEGMetadataMain;
class PDFWriter;
class Main;
class EVGTextMetrics;
class EVGTextMeasurer;
class SimpleTextMeasurer;
class EVGImageDimensions;
class EVGImageMeasurer;
class SimpleImageMeasurer;
class EVGLayout;
class PathCommand;
class PathBounds;
class SVGPathParser;
class TTFTableRecord;
class TTFGlyphMetrics;
class TrueTypeFont;
class FontManager;
class TTFTextMeasurer;
class BitReader;
class HuffmanTable;
class HuffmanDecoder;
class IDCT;
class Color;
class ImageBuffer;
class PPMImage;
class JPEGComponent;
class QuantizationTable;
class JPEGDecoder;
class FDCT;
class BitWriter;
class JPEGEncoder;
class EmbeddedFont;
class EmbeddedImage;
class EVGPDFRenderer;
class EvalValue;
class ImportedSymbol;
class EvalContext;
class ComponentEngine;
class EVGComponentTool;

typedef mpark::variant<std::shared_ptr<Token>, std::shared_ptr<TSLexer>, std::shared_ptr<TSNode>, std::shared_ptr<TSParserSimple>, std::shared_ptr<EVGUnit>, std::shared_ptr<EVGColor>, std::shared_ptr<EVGBox>, std::shared_ptr<EVGElement>, std::shared_ptr<BufferChunk>, std::shared_ptr<GrowableBuffer>, std::shared_ptr<JPEGImage>, std::shared_ptr<JPEGReader>, std::shared_ptr<ExifTag>, std::shared_ptr<JPEGMetadataInfo>, std::shared_ptr<JPEGMetadataParser>, std::shared_ptr<JPEGMetadataMain>, std::shared_ptr<PDFWriter>, std::shared_ptr<Main>, std::shared_ptr<EVGTextMetrics>, std::shared_ptr<EVGTextMeasurer>, std::shared_ptr<SimpleTextMeasurer>, std::shared_ptr<EVGImageDimensions>, std::shared_ptr<EVGImageMeasurer>, std::shared_ptr<SimpleImageMeasurer>, std::shared_ptr<EVGLayout>, std::shared_ptr<PathCommand>, std::shared_ptr<PathBounds>, std::shared_ptr<SVGPathParser>, std::shared_ptr<TTFTableRecord>, std::shared_ptr<TTFGlyphMetrics>, std::shared_ptr<TrueTypeFont>, std::shared_ptr<FontManager>, std::shared_ptr<TTFTextMeasurer>, std::shared_ptr<BitReader>, std::shared_ptr<HuffmanTable>, std::shared_ptr<HuffmanDecoder>, std::shared_ptr<IDCT>, std::shared_ptr<Color>, std::shared_ptr<ImageBuffer>, std::shared_ptr<PPMImage>, std::shared_ptr<JPEGComponent>, std::shared_ptr<QuantizationTable>, std::shared_ptr<JPEGDecoder>, std::shared_ptr<FDCT>, std::shared_ptr<BitWriter>, std::shared_ptr<JPEGEncoder>, std::shared_ptr<EmbeddedFont>, std::shared_ptr<EmbeddedImage>, std::shared_ptr<EVGPDFRenderer>, std::shared_ptr<EvalValue>, std::shared_ptr<ImportedSymbol>, std::shared_ptr<EvalContext>, std::shared_ptr<ComponentEngine>, std::shared_ptr<EVGComponentTool>, int, std::string, bool, double>  r_union_Any;

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


inline std::string  r_cpp_trim(std::string &s)
{
   auto wsfront=std::find_if_not(s.begin(),s.end(),[](int c){return std::isspace(c);});
   auto wsback=std::find_if_not(s.rbegin(),s.rend(),[](int c){return std::isspace(c);}).base();
   return (wsback<=wsfront ? std::string() : std::string(wsfront,wsback));
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


template <class T>
class r_optional_primitive {
  public:
    bool has_value;
    T value;
    r_optional_primitive<T> & operator=(const r_optional_primitive<T> & rhs) {
        has_value = rhs.has_value;
        value = rhs.value;
        return *this;
    }
    r_optional_primitive<T> & operator=(const T a_value) {
        has_value = true;
        value = a_value;
        return *this;
    }
};

r_optional_primitive<double> cpp_str_to_double(std::string s) {
    r_optional_primitive<double> result;
    try {
        result.value = std::stod(s);
        result.has_value = true;
    } catch (...) {

    }
    return result;
}
r_optional_primitive<int> cpp_str_to_int(std::string s) {
    r_optional_primitive<int> result;
    try {
        result.value = std::stoi(s);
        result.has_value = true;
    } catch (...) {

    }
    return result;
}

std::vector<uint8_t> r_buffer_read_file(const std::string& path, const std::string& filename) {
    std::ifstream file(path + "/" + filename, std::ios::binary);
    return std::vector<uint8_t>(std::istreambuf_iterator<char>(file), std::istreambuf_iterator<char>());
}


void r_buffer_write_file(const std::string& path, const std::string& filename, const std::vector<uint8_t>& data) {
    std::ofstream file(path + "/" + filename, std::ios::binary);
    file.write(reinterpret_cast<const char*>(data.data()), data.size());
}


std::vector<std::string> r_str_split(std::string data, std::string token) {
    std::vector<std::string> output;
    size_t pos = std::string::npos;
    if(token.length() == 0) {
        for(std::string::iterator it = data.begin(); it != data.end(); ++it) {
            output.push_back( std::string( it, it + 1) );
        }
        return output;
    }
    do
    {
        pos = data.find(token);
        output.push_back(data.substr(0, pos));
        if (std::string::npos != pos)
            data = data.substr(pos + token.size());
    } while (std::string::npos != pos);
    return output;
}


bool r_cpp_file_exists(std::string name)
{
  struct stat buffer;
  return (stat (name.c_str(), &buffer) == 0);
}


int r_string_index_of( std::string str, std::string key )  {
    auto n = str.find( key );
    if (n == std::string::npos) {
        return -1;
    }
    return n;
}


int r_string_last_index_of( std::string str, std::string key )  {
    auto n = str.rfind( key );
    if (n == std::string::npos) {
        return -1;
    }
    return n;
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
    bool shorthand;
    bool computed;
    bool method;
    bool generator;
    bool async;
    bool delegate;
    bool await;
    std::vector<std::shared_ptr<TSNode>> children;
    std::vector<std::shared_ptr<TSNode>> params;
    std::vector<std::shared_ptr<TSNode>> decorators;
    std::shared_ptr<TSNode> left;
    std::shared_ptr<TSNode> right;
    std::shared_ptr<TSNode> body;
    std::shared_ptr<TSNode> init;
    std::shared_ptr<TSNode> typeAnnotation;
    std::shared_ptr<TSNode> test;
    std::shared_ptr<TSNode> consequent;
    std::shared_ptr<TSNode> alternate;
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
    std::shared_ptr<TSNode> parseLabeledStatement();
    std::string peekNextValue();
    std::shared_ptr<TSNode> parseReturn();
    std::shared_ptr<TSNode> parseImport();
    std::shared_ptr<TSNode> parseExport();
    std::shared_ptr<TSNode> parseInterface();
    std::shared_ptr<TSNode> parseInterfaceBody();
    std::vector<std::shared_ptr<TSNode>> parseTypeParams();
    std::shared_ptr<TSNode> parsePropertySig();
    std::shared_ptr<TSNode> parseCallSignature( int startPos , int startLine , int startCol );
    std::shared_ptr<TSNode> parseConstructSignature( int startPos , int startLine , int startCol );
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
    std::shared_ptr<TSNode> parseObjectPattern();
    std::shared_ptr<TSNode> parseArrayPattern();
    std::shared_ptr<TSNode> parseFuncDecl( bool isAsync );
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
    std::shared_ptr<TSNode> parseConstructorType();
    std::shared_ptr<TSNode> parseImportType();
    std::shared_ptr<TSNode> parseTypeLiteral();
    std::shared_ptr<TSNode> parseTypeLiteralMember();
    std::shared_ptr<TSNode> parseMappedType( bool isReadonly , std::string readonlyMod , std::string paramName , int startPos , int startLine , int startCol );
    std::shared_ptr<TSNode> parseIndexSignatureRest( bool isReadonly , std::shared_ptr<Token> paramTok , int startPos , int startLine , int startCol );
    std::shared_ptr<TSNode> parseMethodSignature( std::string methodName , bool isOptional , int startPos , int startLine , int startCol );
    std::shared_ptr<TSNode> parseExpr();
    std::shared_ptr<TSNode> parseAssign();
    std::shared_ptr<TSNode> parseNullishCoalescing();
    std::shared_ptr<TSNode> parseTernary();
    std::shared_ptr<TSNode> parseLogicalOr();
    std::shared_ptr<TSNode> parseLogicalAnd();
    std::shared_ptr<TSNode> parseEquality();
    std::shared_ptr<TSNode> parseComparison();
    std::shared_ptr<TSNode> parseAdditive();
    std::shared_ptr<TSNode> parseMultiplicative();
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
    std::string peekAheadValue( int offset );
    bool startsWithLowerCase( std::string s );
    bool looksLikeGenericCall();
    std::shared_ptr<TSNode> parseJSXElement();
    std::shared_ptr<TSNode> parseJSXOpeningElement();
    std::shared_ptr<TSNode> parseJSXClosingElement();
    std::shared_ptr<TSNode> parseJSXElementName();
    std::shared_ptr<TSNode> parseJSXAttribute();
    std::shared_ptr<TSNode> parseJSXExpressionContainer();
    std::shared_ptr<TSNode> parseJSXText();
    std::shared_ptr<TSNode> parseJSXFragment();
};
class EVGUnit : public std::enable_shared_from_this<EVGUnit>  { 
  public :
    double value;
    int unitType;
    bool isSet;
    double pixels;
    /* class constructor */ 
    EVGUnit( );
    /* static methods */ 
    static std::shared_ptr<EVGUnit> create( double val , int uType );
    static std::shared_ptr<EVGUnit> px( double val );
    static std::shared_ptr<EVGUnit> percent( double val );
    static std::shared_ptr<EVGUnit> em( double val );
    static std::shared_ptr<EVGUnit> heightPercent( double val );
    static std::shared_ptr<EVGUnit> fill();
    static std::shared_ptr<EVGUnit> unset();
    static std::shared_ptr<EVGUnit> parse( std::string str );
    /* instance methods */ 
    void resolve( double parentSize , double fontSize );
    void resolveForHeight( double parentWidth , double parentHeight , double fontSize );
    void resolveWithHeight( double parentWidth , double parentHeight , double fontSize );
    bool isPixels();
    bool isPercent();
    bool isEm();
    bool isHeightPercent();
    bool isFill();
    std::string toString();
};
class EVGColor : public std::enable_shared_from_this<EVGColor>  { 
  public :
    double r;
    double g;
    double b;
    double a;
    bool isSet;
    /* class constructor */ 
    EVGColor( );
    /* static methods */ 
    static std::shared_ptr<EVGColor> create( double red , double green , double blue , double alpha );
    static std::shared_ptr<EVGColor> rgb( int red , int green , int blue );
    static std::shared_ptr<EVGColor> rgba( int red , int green , int blue , double alpha );
    static std::shared_ptr<EVGColor> noColor();
    static std::shared_ptr<EVGColor> black();
    static std::shared_ptr<EVGColor> white();
    static std::shared_ptr<EVGColor> transparent();
    static int hexDigit( int ch );
    static std::shared_ptr<EVGColor> parseHex( std::string hex );
    static double hue2rgb( double p , double q , double tt );
    static std::shared_ptr<EVGColor> hslToRgb( double h , double s , double l );
    static double parseNumber( std::string str );
    static std::shared_ptr<EVGColor> parse( std::string str );
    static std::shared_ptr<EVGColor> parseRgb( std::string str );
    static std::shared_ptr<EVGColor> parseRgba( std::string str );
    static std::shared_ptr<EVGColor> parseHsl( std::string str );
    static std::shared_ptr<EVGColor> parseNamed( std::string name );
    /* instance methods */ 
    int red();
    int green();
    int blue();
    double alpha();
    std::string toCSSString();
    std::string toHexString();
    std::string toPDFColorString();
    std::shared_ptr<EVGColor> withAlpha( double newAlpha );
    std::shared_ptr<EVGColor> lighten( double amount );
    std::shared_ptr<EVGColor> darken( double amount );
};
class EVGBox : public std::enable_shared_from_this<EVGBox>  { 
  public :
    std::shared_ptr<EVGUnit> marginTop;
    std::shared_ptr<EVGUnit> marginRight;
    std::shared_ptr<EVGUnit> marginBottom;
    std::shared_ptr<EVGUnit> marginLeft;
    std::shared_ptr<EVGUnit> paddingTop;
    std::shared_ptr<EVGUnit> paddingRight;
    std::shared_ptr<EVGUnit> paddingBottom;
    std::shared_ptr<EVGUnit> paddingLeft;
    std::shared_ptr<EVGUnit> borderWidth;
    std::shared_ptr<EVGColor> borderColor;
    std::shared_ptr<EVGUnit> borderRadius;
    double marginTopPx;
    double marginRightPx;
    double marginBottomPx;
    double marginLeftPx;
    double paddingTopPx;
    double paddingRightPx;
    double paddingBottomPx;
    double paddingLeftPx;
    double borderWidthPx;
    double borderRadiusPx;
    /* class constructor */ 
    EVGBox( );
    /* instance methods */ 
    void setMargin( std::shared_ptr<EVGUnit> all );
    void setMarginValues( std::shared_ptr<EVGUnit> top , std::shared_ptr<EVGUnit> right , std::shared_ptr<EVGUnit> bottom , std::shared_ptr<EVGUnit> left );
    void setPadding( std::shared_ptr<EVGUnit> all );
    void setPaddingValues( std::shared_ptr<EVGUnit> top , std::shared_ptr<EVGUnit> right , std::shared_ptr<EVGUnit> bottom , std::shared_ptr<EVGUnit> left );
    void resolveUnits( double parentWidth , double parentHeight , double fontSize );
    double getInnerWidth( double outerWidth );
    double getInnerHeight( double outerHeight );
    double getTotalWidth( double contentWidth );
    double getTotalHeight( double contentHeight );
    double getContentX( double elementX );
    double getContentY( double elementY );
    double getHorizontalSpace();
    double getVerticalSpace();
    double getMarginHorizontal();
    double getMarginVertical();
    double getPaddingHorizontal();
    double getPaddingVertical();
    std::string toString();
};
class EVGElement : public std::enable_shared_from_this<EVGElement>  { 
  public :
    std::string id;
    std::string tagName;
    int elementType;
    std::shared_ptr<EVGElement> parent;
    std::vector<std::shared_ptr<EVGElement>> children;
    std::shared_ptr<EVGUnit> width;
    std::shared_ptr<EVGUnit> height;
    std::shared_ptr<EVGUnit> minWidth;
    std::shared_ptr<EVGUnit> minHeight;
    std::shared_ptr<EVGUnit> maxWidth;
    std::shared_ptr<EVGUnit> maxHeight;
    std::shared_ptr<EVGUnit> left;
    std::shared_ptr<EVGUnit> top;
    std::shared_ptr<EVGUnit> right;
    std::shared_ptr<EVGUnit> bottom;
    std::shared_ptr<EVGUnit> x;
    std::shared_ptr<EVGUnit> y;
    std::shared_ptr<EVGBox> box;
    std::shared_ptr<EVGColor> backgroundColor;
    double opacity;
    std::string direction;
    std::string align;
    std::string verticalAlign;
    bool isInline;
    bool lineBreak;
    std::string overflow;
    std::shared_ptr<EVGUnit> fontSize;
    std::string fontFamily;
    std::string fontWeight;
    double lineHeight;
    std::string textAlign;
    std::shared_ptr<EVGColor> color;
    std::string textContent;
    std::string display     /** note: unused */;
    double flex;
    std::string flexDirection;
    std::string justifyContent;
    std::string alignItems;
    std::shared_ptr<EVGUnit> gap;
    std::string position     /** note: unused */;
    std::shared_ptr<EVGUnit> marginTop     /** note: unused */;
    std::shared_ptr<EVGUnit> marginRight     /** note: unused */;
    std::shared_ptr<EVGUnit> marginBottom     /** note: unused */;
    std::shared_ptr<EVGUnit> marginLeft     /** note: unused */;
    std::shared_ptr<EVGUnit> paddingTop     /** note: unused */;
    std::shared_ptr<EVGUnit> paddingRight     /** note: unused */;
    std::shared_ptr<EVGUnit> paddingBottom     /** note: unused */;
    std::shared_ptr<EVGUnit> paddingLeft     /** note: unused */;
    std::shared_ptr<EVGUnit> borderWidth     /** note: unused */;
    std::shared_ptr<EVGUnit> borderTopWidth     /** note: unused */;
    std::shared_ptr<EVGUnit> borderRightWidth     /** note: unused */;
    std::shared_ptr<EVGUnit> borderBottomWidth     /** note: unused */;
    std::shared_ptr<EVGUnit> borderLeftWidth     /** note: unused */;
    std::shared_ptr<EVGColor> borderColor     /** note: unused */;
    std::shared_ptr<EVGUnit> borderRadius     /** note: unused */;
    std::string src;
    std::string alt     /** note: unused */;
    std::string svgPath;
    std::string viewBox;
    std::shared_ptr<EVGColor> fillColor;
    std::shared_ptr<EVGColor> strokeColor;
    double strokeWidth;
    std::string clipPath;
    std::string className;
    int imageQuality;
    int maxImageSize;
    double rotate;
    double scale;
    std::shared_ptr<EVGUnit> shadowRadius;
    std::shared_ptr<EVGColor> shadowColor;
    std::shared_ptr<EVGUnit> shadowOffsetX;
    std::shared_ptr<EVGUnit> shadowOffsetY;
    double calculatedX;
    double calculatedY;
    double calculatedWidth;
    double calculatedHeight;
    double calculatedInnerWidth;
    double calculatedInnerHeight;
    double calculatedFlexWidth;
    int calculatedPage;
    bool isAbsolute;
    bool isLayoutComplete;
    bool unitsResolved;
    double inheritedFontSize;
    /* class constructor */ 
    EVGElement( );
    /* static methods */ 
    static std::shared_ptr<EVGElement> createDiv();
    static std::shared_ptr<EVGElement> createSpan();
    static std::shared_ptr<EVGElement> createImg();
    static std::shared_ptr<EVGElement> createPath();
    /* instance methods */ 
    void addChild( std::shared_ptr<EVGElement> child );
    void resetLayoutState();
    int getChildCount();
    std::shared_ptr<EVGElement> getChild( int index );
    bool hasParent();
    bool isContainer();
    bool isText();
    bool isImage();
    bool isPath();
    bool hasAbsolutePosition();
    void inheritProperties( std::shared_ptr<EVGElement> parentEl );
    void resolveUnits( double parentWidth , double parentHeight );
    void setAttribute( std::string name , std::string value );
    std::string getCalculatedBounds();
    std::string toString();
};
class BufferChunk : public std::enable_shared_from_this<BufferChunk>  { 
  public :
    std::vector<uint8_t> data;
    int used;
    int capacity;
    std::shared_ptr<BufferChunk> next;
    /* class constructor */ 
    BufferChunk( int size  );
    /* instance methods */ 
    int remaining();
    bool isFull();
};
class GrowableBuffer : public std::enable_shared_from_this<GrowableBuffer>  { 
  public :
    std::shared_ptr<BufferChunk> firstChunk;
    std::shared_ptr<BufferChunk> currentChunk;
    int chunkSize;
    int totalSize;
    /* class constructor */ 
    GrowableBuffer( );
    /* instance methods */ 
    void setChunkSize( int size );
    void allocateNewChunk();
    void writeByte( int b );
    void writeBytes( std::vector<uint8_t> src , int srcOffset , int length );
    void writeBuffer( std::vector<uint8_t> src );
    void writeString( std::string s );
    void writeInt16BE( int value );
    void writeInt32BE( int value );
    int size();
    std::vector<uint8_t> toBuffer();
    std::string toString();
    void clear();
};
class JPEGImage : public std::enable_shared_from_this<JPEGImage>  { 
  public :
    int width;
    int height;
    int colorComponents;
    int bitsPerComponent;
    std::vector<uint8_t> imageData;
    bool isValid;
    std::string errorMessage;
    /* class constructor */ 
    JPEGImage( );
};
class JPEGReader : public std::enable_shared_from_this<JPEGReader>  { 
  public :
    /* class constructor */ 
    JPEGReader( );
    /* instance methods */ 
    int readUint16BE( std::vector<uint8_t> data , int offset );
    std::shared_ptr<JPEGImage> readJPEG( std::string dirPath , std::string fileName );
    std::string getImageInfo( std::shared_ptr<JPEGImage> img );
};
class ExifTag : public std::enable_shared_from_this<ExifTag>  { 
  public :
    int tagId;
    std::string tagName;
    std::string tagValue;
    int dataType;
    /* class constructor */ 
    ExifTag( );
};
class JPEGMetadataInfo : public std::enable_shared_from_this<JPEGMetadataInfo>  { 
  public :
    bool isValid;
    std::string errorMessage;
    bool hasJFIF;
    std::string jfifVersion;
    int densityUnits;
    int xDensity;
    int yDensity;
    int width;
    int height;
    int colorComponents;
    int bitsPerComponent;
    bool hasExif;
    std::string cameraMake;
    std::string cameraModel;
    std::string software;
    std::string dateTime;
    std::string dateTimeOriginal;
    std::string exposureTime;
    std::string fNumber;
    std::string isoSpeed;
    std::string focalLength;
    std::string flash;
    int orientation;
    std::string xResolution;
    std::string yResolution;
    int resolutionUnit;
    bool hasGPS;
    std::string gpsLatitude;
    std::string gpsLongitude;
    std::string gpsAltitude;
    std::string gpsLatitudeRef;
    std::string gpsLongitudeRef;
    bool hasComment;
    std::string comment;
    std::vector<std::shared_ptr<ExifTag>> exifTags;
    /* class constructor */ 
    JPEGMetadataInfo( );
};
class JPEGMetadataParser : public std::enable_shared_from_this<JPEGMetadataParser>  { 
  public :
    std::vector<uint8_t> data;
    int dataLen;
    bool littleEndian;
    /* class constructor */ 
    JPEGMetadataParser( );
    /* instance methods */ 
    int readUint16BE( int offset );
    int readUint16( int offset );
    int readUint32( int offset );
    std::string readString( int offset , int length );
    std::string getTagName( int tagId , int ifdType );
    std::string formatRational( int offset );
    std::string formatGPSCoordinate( int offset , std::string _ref );
    void parseIFD( std::shared_ptr<JPEGMetadataInfo> info , int tiffStart , int ifdOffset , int ifdType );
    void parseExif( std::shared_ptr<JPEGMetadataInfo> info , int appStart , int appLen );
    void parseJFIF( std::shared_ptr<JPEGMetadataInfo> info , int appStart , int appLen );
    void parseComment( std::shared_ptr<JPEGMetadataInfo> info , int appStart , int appLen );
    std::shared_ptr<JPEGMetadataInfo> parseMetadata( std::string dirPath , std::string fileName );
    std::string formatMetadata( std::shared_ptr<JPEGMetadataInfo> info );
};
class JPEGMetadataMain : public std::enable_shared_from_this<JPEGMetadataMain>  { 
  public :
    /* class constructor */ 
    JPEGMetadataMain( );
    /* static methods */ 
    static void m();
};
class PDFWriter : public std::enable_shared_from_this<PDFWriter>  { 
  public :
    int nextObjNum;
    std::shared_ptr<GrowableBuffer> pdfBuffer;
    std::vector<int> objectOffsets;
    std::shared_ptr<JPEGReader> jpegReader;
    std::shared_ptr<JPEGMetadataParser> metadataParser;
    int imageObjNum;
    std::shared_ptr<JPEGMetadataInfo> lastImageMetadata;
    /* class constructor */ 
    PDFWriter( );
    /* instance methods */ 
    void writeObject( std::string content );
    int writeObjectGetNum( std::string content );
    int writeImageObject( std::string header , std::vector<uint8_t> imageData , std::string footer );
    int addJPEGImage( std::string dirPath , std::string fileName );
    std::string escapeText( std::string text );
    std::vector<uint8_t> createHelloWorldPDF( std::string message );
    std::vector<uint8_t> createPDFWithImage( std::string message , std::string imageDirPath , std::string imageFileName );
    void savePDF( std::string path , std::string filename , std::string message );
    void savePDFWithImage( std::string path , std::string filename , std::string message , std::string imageDirPath , std::string imageFileName );
};
class Main : public std::enable_shared_from_this<Main>  { 
  public :
    /* class constructor */ 
    Main( );
    /* static methods */ 
    static void m();
};
class EVGTextMetrics : public std::enable_shared_from_this<EVGTextMetrics>  { 
  public :
    double width;
    double height;
    double ascent;
    double descent;
    double lineHeight;
    /* class constructor */ 
    EVGTextMetrics( );
    /* static methods */ 
    static std::shared_ptr<EVGTextMetrics> create( double w , double h );
};
class EVGTextMeasurer : public std::enable_shared_from_this<EVGTextMeasurer>  { 
  public :
    /* class constructor */ 
    EVGTextMeasurer( );
    /* instance methods */ 
    virtual std::shared_ptr<EVGTextMetrics> measureText( std::string text , std::string fontFamily , double fontSize );
    virtual double measureTextWidth( std::string text , std::string fontFamily , double fontSize );
    virtual double getLineHeight( std::string fontFamily , double fontSize );
    virtual double measureChar( int ch , std::string fontFamily , double fontSize );
    virtual std::vector<std::string> wrapText( std::string text , std::string fontFamily , double fontSize , double maxWidth );
};
class SimpleTextMeasurer : public EVGTextMeasurer { 
  public :
    double charWidthRatio;
    /* class constructor */ 
    SimpleTextMeasurer( );
    /* instance methods */ 
    void setCharWidthRatio( double ratio );
    std::shared_ptr<EVGTextMetrics> measureText( std::string text , std::string fontFamily , double fontSize );
};
class EVGImageDimensions : public std::enable_shared_from_this<EVGImageDimensions>  { 
  public :
    int width;
    int height;
    double aspectRatio;
    bool isValid;
    /* class constructor */ 
    EVGImageDimensions( );
    /* static methods */ 
    static std::shared_ptr<EVGImageDimensions> create( int w , int h );
};
class EVGImageMeasurer : public std::enable_shared_from_this<EVGImageMeasurer>  { 
  public :
    /* class constructor */ 
    EVGImageMeasurer( );
    /* instance methods */ 
    virtual std::shared_ptr<EVGImageDimensions> getImageDimensions( std::string src );
    virtual double calculateHeightForWidth( std::string src , double targetWidth );
    virtual double calculateWidthForHeight( std::string src , double targetHeight );
    virtual std::shared_ptr<EVGImageDimensions> calculateFitDimensions( std::string src , double maxWidth , double maxHeight );
};
class SimpleImageMeasurer : public EVGImageMeasurer { 
  public :
    /* class constructor */ 
    SimpleImageMeasurer( );
};
class EVGLayout : public std::enable_shared_from_this<EVGLayout>  { 
  public :
    std::shared_ptr<EVGTextMeasurer> measurer;
    std::shared_ptr<EVGImageMeasurer> imageMeasurer;
    double pageWidth;
    double pageHeight;
    int currentPage;
    bool debug;
    /* class constructor */ 
    EVGLayout( );
    /* instance methods */ 
    void setMeasurer( std::shared_ptr<EVGTextMeasurer> m );
    void setImageMeasurer( std::shared_ptr<EVGImageMeasurer> m );
    void setPageSize( double w , double h );
    void setDebug( bool d );
    void log( std::string msg );
    void layout( std::shared_ptr<EVGElement> root );
    void layoutElement( std::shared_ptr<EVGElement> element , double parentX , double parentY , double parentWidth , double parentHeight );
    double layoutChildren( std::shared_ptr<EVGElement> parent );
    void alignRow( std::vector<std::shared_ptr<EVGElement>> rowElements , std::shared_ptr<EVGElement> parent , double rowHeight , double startX , double innerWidth );
    void layoutAbsolute( std::shared_ptr<EVGElement> element , double parentWidth , double parentHeight );
    void printLayout( std::shared_ptr<EVGElement> element , int indent );
    int estimateLineCount( std::string text , double maxWidth , double fontSize );
};
class PathCommand : public std::enable_shared_from_this<PathCommand>  { 
  public :
    std::string type;
    double x;
    double y;
    double x1;
    double y1;
    double x2;
    double y2;
    double rx     /** note: unused */;
    double ry     /** note: unused */;
    double rotation     /** note: unused */;
    bool largeArc     /** note: unused */;
    bool sweep     /** note: unused */;
    /* class constructor */ 
    PathCommand( );
};
class PathBounds : public std::enable_shared_from_this<PathBounds>  { 
  public :
    double minX;
    double minY;
    double maxX;
    double maxY;
    double width;
    double height;
    /* class constructor */ 
    PathBounds( );
};
class SVGPathParser : public std::enable_shared_from_this<SVGPathParser>  { 
  public :
    std::string pathData;
    int i;
    int __len;
    double currentX;
    double currentY;
    double startX;
    double startY;
    std::vector<std::shared_ptr<PathCommand>> commands;
    std::shared_ptr<PathBounds> bounds;
    /* class constructor */ 
    SVGPathParser( );
    /* instance methods */ 
    void parse( std::string data );
    void skipWhitespace();
    double parseNumber();
    void parseCommand( char cmd );
    void calculateBounds();
    std::shared_ptr<PathBounds> getBounds();
    std::vector<std::shared_ptr<PathCommand>> getCommands();
    std::vector<std::shared_ptr<PathCommand>> getScaledCommands( double targetWidth , double targetHeight );
};
class TTFTableRecord : public std::enable_shared_from_this<TTFTableRecord>  { 
  public :
    std::string tag;
    int checksum;
    int offset;
    int length;
    /* class constructor */ 
    TTFTableRecord( );
};
class TTFGlyphMetrics : public std::enable_shared_from_this<TTFGlyphMetrics>  { 
  public :
    int advanceWidth     /** note: unused */;
    int leftSideBearing     /** note: unused */;
    /* class constructor */ 
    TTFGlyphMetrics( );
};
class TrueTypeFont : public std::enable_shared_from_this<TrueTypeFont>  { 
  public :
    std::vector<uint8_t> fontData;
    std::string fontPath;
    std::string fontFamily;
    std::string fontStyle;
    int sfntVersion;
    int numTables;
    int searchRange;
    int entrySelector;
    int rangeShift;
    std::vector<std::shared_ptr<TTFTableRecord>> tables;
    int unitsPerEm;
    int xMin;
    int yMin;
    int xMax;
    int yMax;
    int indexToLocFormat;
    int ascender;
    int descender;
    int lineGap;
    int numberOfHMetrics;
    int numGlyphs;
    int cmapFormat;
    int cmapOffset;
    std::vector<int> glyphWidths;
    int defaultWidth;
    std::vector<int> charWidths;
    bool charWidthsLoaded;
    /* class constructor */ 
    TrueTypeFont( );
    /* instance methods */ 
    bool loadFromFile( std::string path );
    bool parseOffsetTable();
    bool parseTableDirectory();
    std::shared_ptr<TTFTableRecord> findTable( std::string tag );
    void parseHeadTable();
    void parseHheaTable();
    void parseMaxpTable();
    void parseCmapTable();
    void parseHmtxTable();
    void parseNameTable();
    int getGlyphIndex( int charCode );
    int getGlyphIndexFormat4( int charCode );
    int getGlyphWidth( int glyphIndex );
    void buildCharWidthCache();
    int getCharWidth( int charCode );
    double getCharWidthPoints( int charCode , double fontSize );
    double measureText( std::string text , double fontSize );
    double getAscender( double fontSize );
    double getDescender( double fontSize );
    double getLineHeight( double fontSize );
    std::vector<uint8_t> getFontData();
    std::string getPostScriptName();
    int readUInt8( int offset );
    int readUInt16( int offset );
    int readInt16( int offset );
    int readUInt32( int offset );
    std::string readTag( int offset );
    std::string readAsciiString( int offset , int length );
    std::string readUnicodeString( int offset , int length );
    void printInfo();
};
class FontManager : public std::enable_shared_from_this<FontManager>  { 
  public :
    std::vector<std::shared_ptr<TrueTypeFont>> fonts;
    std::vector<std::string> fontNames;
    std::string fontsDirectory;
    std::vector<std::string> fontsDirectories;
    std::shared_ptr<TrueTypeFont> defaultFont;
    bool hasDefaultFont;
    /* class constructor */ 
    FontManager( );
    /* instance methods */ 
    void setFontsDirectory( std::string path );
    int getFontCount();
    void addFontsDirectory( std::string path );
    void setFontsDirectories( std::string paths );
    bool loadFont( std::string relativePath );
    void loadFontFamily( std::string familyDir );
    std::shared_ptr<TrueTypeFont> getFont( std::string fontFamily );
    double measureText( std::string text , std::string fontFamily , double fontSize );
    double getLineHeight( std::string fontFamily , double fontSize );
    double getAscender( std::string fontFamily , double fontSize );
    double getDescender( std::string fontFamily , double fontSize );
    std::vector<uint8_t> getFontData( std::string fontFamily );
    std::string getPostScriptName( std::string fontFamily );
    void printLoadedFonts();
};
class TTFTextMeasurer : public EVGTextMeasurer { 
  public :
    std::shared_ptr<FontManager> fontManager;
    /* class constructor */ 
    TTFTextMeasurer( std::shared_ptr<FontManager> fm  );
    /* instance methods */ 
    std::shared_ptr<EVGTextMetrics> measureText( std::string text , std::string fontFamily , double fontSize );
    double measureTextWidth( std::string text , std::string fontFamily , double fontSize );
    double getLineHeight( std::string fontFamily , double fontSize );
    double measureChar( int ch , std::string fontFamily , double fontSize );
};
class BitReader : public std::enable_shared_from_this<BitReader>  { 
  public :
    std::vector<uint8_t> data;
    int dataStart;
    int dataEnd;
    int bytePos;
    int bitPos;
    int currentByte;
    bool eof;
    /* class constructor */ 
    BitReader( );
    /* instance methods */ 
    void init( std::vector<uint8_t> buf , int startPos , int length );
    void loadNextByte();
    int readBit();
    int readBits( int count );
    int peekBits( int count );
    void alignToByte();
    int getBytePosition();
    bool isEOF();
    int receiveExtend( int length );
};
class HuffmanTable : public std::enable_shared_from_this<HuffmanTable>  { 
  public :
    std::vector<int64_t> bits;
    std::vector<int> values;
    std::vector<int64_t> maxCode;
    std::vector<int64_t> minCode;
    std::vector<int64_t> valPtr;
    int tableClass;
    int tableId;
    /* class constructor */ 
    HuffmanTable( );
    /* instance methods */ 
    void build();
    int decode( std::shared_ptr<BitReader> reader );
    void resetArrays();
};
class HuffmanDecoder : public std::enable_shared_from_this<HuffmanDecoder>  { 
  public :
    std::shared_ptr<HuffmanTable> dcTable0;
    std::shared_ptr<HuffmanTable> dcTable1;
    std::shared_ptr<HuffmanTable> acTable0;
    std::shared_ptr<HuffmanTable> acTable1;
    /* class constructor */ 
    HuffmanDecoder( );
    /* instance methods */ 
    std::shared_ptr<HuffmanTable> getDCTable( int id );
    std::shared_ptr<HuffmanTable> getACTable( int id );
    void parseDHT( std::vector<uint8_t> data , int pos , int length );
};
class IDCT : public std::enable_shared_from_this<IDCT>  { 
  public :
    std::vector<int64_t> cosTable;
    std::vector<int64_t> zigzagMap;
    /* class constructor */ 
    IDCT( );
    /* instance methods */ 
    std::vector<int64_t> dezigzag( std::vector<int64_t> zigzag );
    void idct1d( std::vector<int64_t> input , int startIdx , int stride , std::vector<int64_t>& output , int outIdx , int outStride );
    void transform( std::vector<int64_t> block , std::vector<int64_t>& output );
    void transformFast( std::vector<int64_t> coeffs , std::vector<int64_t> output );
};
class Color : public std::enable_shared_from_this<Color>  { 
  public :
    int r;
    int g;
    int b;
    int a;
    /* class constructor */ 
    Color( );
    /* instance methods */ 
    void setRGB( int red , int green , int blue );
    void setRGBA( int red , int green , int blue , int alpha );
    int clamp( int val );
    void set( int red , int green , int blue );
    int grayscale();
    void toGrayscale();
    void invert();
    void adjustBrightness( int amount );
};
class ImageBuffer : public std::enable_shared_from_this<ImageBuffer>  { 
  public :
    int width;
    int height;
    std::vector<uint8_t> pixels;
    /* class constructor */ 
    ImageBuffer( );
    /* instance methods */ 
    void init( int w , int h );
    int getPixelOffset( int x , int y );
    bool isValidCoord( int x , int y );
    std::shared_ptr<Color> getPixel( int x , int y );
    void setPixel( int x , int y , std::shared_ptr<Color> c );
    void setPixelRGB( int x , int y , int r , int g , int b );
    void fill( int r , int g , int b , int a );
    void fillRect( int x , int y , int w , int h , std::shared_ptr<Color> c );
    void invert();
    void grayscale();
    void adjustBrightness( int amount );
    void threshold( int level );
    void sepia();
    void flipHorizontal();
    void flipVertical();
    void drawLine( int x1 , int y1 , int x2 , int y2 , std::shared_ptr<Color> c );
    void drawRect( int x , int y , int w , int h , std::shared_ptr<Color> c );
    std::shared_ptr<ImageBuffer> scale( int factor );
    std::shared_ptr<ImageBuffer> scaleToSize( int newW , int newH );
    int bilinear( int v00 , int v01 , int v10 , int v11 , double fx , double fy );
    std::shared_ptr<ImageBuffer> rotate90CW();
    std::shared_ptr<ImageBuffer> rotate180();
    std::shared_ptr<ImageBuffer> rotate270CW();
    std::shared_ptr<ImageBuffer> transpose();
    std::shared_ptr<ImageBuffer> transverse();
    std::shared_ptr<ImageBuffer> applyExifOrientation( int orientation );
};
class PPMImage : public std::enable_shared_from_this<PPMImage>  { 
  public :
    /* class constructor */ 
    PPMImage( );
    /* instance methods */ 
    int parseNumber( std::vector<uint8_t> data , int startPos , std::vector<int>& endPos );
    int skipToNextLine( std::vector<uint8_t> data , int pos );
    std::shared_ptr<ImageBuffer> load( std::string dirPath , std::string fileName );
    void save( std::shared_ptr<ImageBuffer> img , std::string dirPath , std::string fileName );
    void saveP3( std::shared_ptr<ImageBuffer> img , std::string dirPath , std::string fileName );
};
class JPEGComponent : public std::enable_shared_from_this<JPEGComponent>  { 
  public :
    int id;
    int hSamp;
    int vSamp;
    int quantTableId;
    int dcTableId;
    int acTableId;
    int prevDC;
    /* class constructor */ 
    JPEGComponent( );
};
class QuantizationTable : public std::enable_shared_from_this<QuantizationTable>  { 
  public :
    std::vector<int> values;
    int id;
    /* class constructor */ 
    QuantizationTable( );
};
class JPEGDecoder : public std::enable_shared_from_this<JPEGDecoder>  { 
  public :
    std::vector<uint8_t> data;
    int dataLen;
    int width;
    int height;
    int numComponents;
    int precision;
    std::vector<std::shared_ptr<JPEGComponent>> components;
    std::vector<std::shared_ptr<QuantizationTable>> quantTables;
    std::shared_ptr<HuffmanDecoder> huffman;
    std::shared_ptr<IDCT> idct;
    int scanDataStart;
    int scanDataLen;
    int mcuWidth;
    int mcuHeight;
    int mcusPerRow;
    int mcusPerCol;
    int maxHSamp;
    int maxVSamp;
    int restartInterval;
    /* class constructor */ 
    JPEGDecoder( );
    /* instance methods */ 
    int readUint16BE( int pos );
    void parseSOF( int pos , int length );
    void parseDQT( int pos , int length );
    void parseSOS( int pos , int length );
    bool parseMarkers();
    std::vector<int64_t> decodeBlock( std::shared_ptr<BitReader> reader , std::shared_ptr<JPEGComponent> comp , std::shared_ptr<QuantizationTable> quantTable );
    std::shared_ptr<ImageBuffer> decode( std::string dirPath , std::string fileName );
    void writeMCU( std::shared_ptr<ImageBuffer> img , int mcuX , int mcuY , std::vector<int> yBlocksData , int yBlockCount , std::vector<int> cbBlock , std::vector<int> crBlock );
};
class FDCT : public std::enable_shared_from_this<FDCT>  { 
  public :
    std::vector<int64_t> cosTable;
    std::vector<int64_t> zigzagOrder;
    /* class constructor */ 
    FDCT( );
    /* instance methods */ 
    void dct1d( std::vector<int64_t> input , int startIdx , int stride , std::vector<int64_t>& output , int outIdx , int outStride );
    std::vector<int64_t> transform( std::vector<int64_t> pixels );
    std::vector<int64_t> zigzag( std::vector<int64_t> block );
};
class BitWriter : public std::enable_shared_from_this<BitWriter>  { 
  public :
    std::shared_ptr<GrowableBuffer> buffer;
    int bitBuffer;
    int bitCount;
    /* class constructor */ 
    BitWriter( );
    /* instance methods */ 
    void writeBit( int bit );
    void writeBits( int value , int numBits );
    void flushByte();
    void writeByte( int b );
    void writeWord( int w );
    std::vector<uint8_t> getBuffer();
    int getLength();
};
class JPEGEncoder : public std::enable_shared_from_this<JPEGEncoder>  { 
  public :
    std::shared_ptr<FDCT> fdct;
    int quality;
    std::vector<int> yQuantTable;
    std::vector<int> cQuantTable;
    std::vector<int> stdYQuant;
    std::vector<int> stdCQuant;
    std::vector<int> dcYBits;
    std::vector<int> dcYValues;
    std::vector<int> acYBits;
    std::vector<int> acYValues;
    std::vector<int> dcCBits;
    std::vector<int> dcCValues;
    std::vector<int> acCBits;
    std::vector<int> acCValues;
    std::vector<int> dcYCodes;
    std::vector<int> dcYLengths;
    std::vector<int> acYCodes;
    std::vector<int> acYLengths;
    std::vector<int> dcCCodes;
    std::vector<int> dcCLengths;
    std::vector<int> acCCodes;
    std::vector<int> acCLengths;
    int prevDCY;
    int prevDCCb;
    int prevDCCr;
    /* class constructor */ 
    JPEGEncoder( );
    /* instance methods */ 
    void initQuantTables();
    void scaleQuantTables( int q );
    void initHuffmanTables();
    void buildHuffmanCodes( std::vector<int> bits , std::vector<int> values , std::vector<int>& codes , std::vector<int>& lengths );
    int getCategory( int value );
    int encodeNumber( int value , int category );
    void encodeBlock( std::shared_ptr<BitWriter> writer , std::vector<int64_t> coeffs , std::vector<int> quantTable , std::vector<int> dcCodes , std::vector<int> dcLengths , std::vector<int> acCodes , std::vector<int> acLengths , int prevDC );
    void rgbToYCbCr( int r , int g , int b , std::vector<int>& yOut , std::vector<int>& cbOut , std::vector<int>& crOut );
    std::vector<int64_t> extractBlock( std::shared_ptr<ImageBuffer> img , int blockX , int blockY , int channel );
    void writeMarkers( std::shared_ptr<BitWriter> writer , int width , int height );
    std::vector<uint8_t> encodeToBuffer( std::shared_ptr<ImageBuffer> img );
    void encode( std::shared_ptr<ImageBuffer> img , std::string dirPath , std::string fileName );
    void setQuality( int q );
};
class EmbeddedFont : public std::enable_shared_from_this<EmbeddedFont>  { 
  public :
    std::string name;
    int fontObjNum     /** note: unused */;
    int fontDescObjNum     /** note: unused */;
    int fontFileObjNum     /** note: unused */;
    std::string pdfName;
    std::shared_ptr<TrueTypeFont> ttfFont;
    /* class constructor */ 
    EmbeddedFont( std::string n , std::string pn , std::shared_ptr<TrueTypeFont> font  );
};
class EmbeddedImage : public std::enable_shared_from_this<EmbeddedImage>  { 
  public :
    std::string src;
    int objNum;
    int width;
    int height;
    int orientation;
    std::string pdfName;
    /* class constructor */ 
    EmbeddedImage( std::string s  );
};
class EVGPDFRenderer : public EVGImageMeasurer { 
  public :
    std::shared_ptr<PDFWriter> writer;
    std::shared_ptr<EVGLayout> layout;
    std::shared_ptr<EVGTextMeasurer> measurer;
    std::shared_ptr<GrowableBuffer> streamBuffer;
    double pageWidth;
    double pageHeight;
    int nextObjNum;
    int fontObjNum     /** note: unused */;
    int pagesObjNum;
    std::vector<int> contentObjNums;
    int pageCount     /** note: unused */;
    bool debug;
    std::shared_ptr<FontManager> fontManager;
    std::vector<std::shared_ptr<EmbeddedFont>> embeddedFonts;
    std::vector<std::string> usedFontNames;
    std::vector<std::shared_ptr<EmbeddedImage>> embeddedImages;
    std::shared_ptr<JPEGReader> jpegReader     /** note: unused */;
    std::shared_ptr<JPEGDecoder> jpegDecoder;
    std::shared_ptr<JPEGEncoder> jpegEncoder;
    std::shared_ptr<JPEGMetadataParser> metadataParser;
    std::string baseDir;
    std::vector<std::string> assetPaths;
    int maxImageWidth;
    int maxImageHeight;
    int jpegQuality;
    std::vector<std::shared_ptr<EVGImageDimensions>> imageDimensionsCache;
    std::vector<std::string> imageDimensionsCacheKeys;
    std::vector<std::shared_ptr<EVGElement>> foundSections;
    std::vector<std::shared_ptr<EVGElement>> foundPages;
    /* class constructor */ 
    EVGPDFRenderer( );
    /* instance methods */ 
    void init();
    void setPageSize( double width , double height );
    void setBaseDir( std::string dir );
    void setAssetPaths( std::string paths );
    std::string resolveImagePath( std::string src );
    void setMeasurer( std::shared_ptr<EVGTextMeasurer> m );
    void setFontManager( std::shared_ptr<FontManager> fm );
    void setDebug( bool enabled );
    std::shared_ptr<EVGImageDimensions> getImageDimensions( std::string src );
    std::string getPdfFontName( std::string fontFamily );
    std::vector<uint8_t> render( std::shared_ptr<EVGElement> root );
    void findPageElementsRecursive( std::shared_ptr<EVGElement> el );
    void findSectionElementsRecursive( std::shared_ptr<EVGElement> el );
    double getSectionPageWidth( std::shared_ptr<EVGElement> section );
    double getSectionPageHeight( std::shared_ptr<EVGElement> section );
    double getSectionMargin( std::shared_ptr<EVGElement> section );
    std::vector<uint8_t> renderMultiPageToPDF( std::shared_ptr<EVGElement> root );
    std::vector<uint8_t> renderToPDF( std::shared_ptr<EVGElement> root );
    void renderElement( std::shared_ptr<EVGElement> el , double offsetX , double offsetY );
    std::string getImagePdfName( std::string src );
    void renderImage( std::shared_ptr<EVGElement> el , double x , double y , double w , double h );
    void renderPath( std::shared_ptr<EVGElement> el , double x , double y , double w , double h );
    void applyClipPath( std::string pathData , double x , double y , double w , double h );
    void renderBackground( double x , double y , double w , double h , std::shared_ptr<EVGColor> color );
    void renderBorder( std::shared_ptr<EVGElement> el , double x , double y , double w , double h );
    void renderText( std::shared_ptr<EVGElement> el , double x , double y , double w , double h );
    std::vector<std::string> wrapText( std::string text , double maxWidth , double fontSize , std::string fontFamily );
    void renderDivider( std::shared_ptr<EVGElement> el , double x , double y , double w , double h );
    std::string getTextContent( std::shared_ptr<EVGElement> el );
    double estimateTextWidth( std::string text , double fontSize );
    std::string escapeText( std::string text );
    std::string formatNum( double n );
    std::string padLeft( std::string s , int __len , std::string padChar );
    std::string sanitizeFontName( std::string name );
};
class EvalValue : public std::enable_shared_from_this<EvalValue>  { 
  public :
    int valueType;
    double numberValue;
    std::string stringValue;
    bool boolValue;
    std::vector<std::shared_ptr<EvalValue>> arrayValue;
    std::vector<std::string> objectKeys;
    std::vector<std::shared_ptr<EvalValue>> objectValues;
    std::string functionName;
    std::string functionBody     /** note: unused */;
    std::shared_ptr<EVGElement> evgElement;
    /* class constructor */ 
    EvalValue( );
    /* static methods */ 
    static std::shared_ptr<EvalValue> null();
    static std::shared_ptr<EvalValue> number( double n );
    static std::shared_ptr<EvalValue> fromInt( int n );
    static std::shared_ptr<EvalValue> string( std::string s );
    static std::shared_ptr<EvalValue> boolean( bool b );
    static std::shared_ptr<EvalValue> array( std::vector<std::shared_ptr<EvalValue>> items );
    static std::shared_ptr<EvalValue> object( std::vector<std::string> keys , std::vector<std::shared_ptr<EvalValue>> values );
    static std::shared_ptr<EvalValue> element( std::shared_ptr<EVGElement> el );
    /* instance methods */ 
    bool isNull();
    bool isNumber();
    bool isString();
    bool isBoolean();
    bool isArray();
    bool isObject();
    bool isFunction();
    bool isElement();
    double toNumber();
    std::string toString();
    bool toBool();
    std::shared_ptr<EvalValue> getMember( std::string key );
    std::shared_ptr<EvalValue> getIndex( int index );
    bool equals( std::shared_ptr<EvalValue> other );
};
class ImportedSymbol : public std::enable_shared_from_this<ImportedSymbol>  { 
  public :
    std::string name;
    std::string originalName;
    std::string sourcePath;
    std::string symbolType;
    std::shared_ptr<TSNode> functionNode;
    /* class constructor */ 
    ImportedSymbol( );
};
class EvalContext : public std::enable_shared_from_this<EvalContext>  { 
  public :
    std::vector<std::string> variables;
    std::vector<std::shared_ptr<EvalValue>> values;
    std::shared_ptr<EvalContext> parent;
    /* class constructor */ 
    EvalContext( );
    /* instance methods */ 
    void define( std::string name , std::shared_ptr<EvalValue> value );
    std::shared_ptr<EvalValue> lookup( std::string name );
    bool has( std::string name );
    std::shared_ptr<EvalContext> createChild();
};
class ComponentEngine : public std::enable_shared_from_this<ComponentEngine>  { 
  public :
    std::shared_ptr<TSParserSimple> parser;
    std::string source;
    std::string basePath;
    std::vector<std::string> assetPaths;
    double pageWidth;
    double pageHeight;
    std::vector<std::shared_ptr<ImportedSymbol>> imports;
    std::vector<std::shared_ptr<ImportedSymbol>> localComponents;
    std::shared_ptr<EvalContext> context;
    std::vector<std::string> primitives;
    /* class constructor */ 
    ComponentEngine( );
    /* instance methods */ 
    void setAssetPaths( std::string paths );
    std::string resolveComponentPath( std::string relativePath );
    std::shared_ptr<EVGElement> parseFile( std::string dirPath , std::string fileName );
    std::shared_ptr<EVGElement> parse( std::string src );
    void processImports( std::shared_ptr<TSNode> ast );
    void processImportDeclaration( std::shared_ptr<TSNode> node );
    std::string resolveModulePath( std::string modulePath );
    bool isInList( std::string name , std::vector<std::string> list );
    void registerComponents( std::shared_ptr<TSNode> ast );
    std::shared_ptr<TSNode> findRenderFunction( std::shared_ptr<TSNode> ast );
    void processVariables( std::shared_ptr<TSNode> ast );
    void processVariableDeclaration( std::shared_ptr<TSNode> node );
    std::shared_ptr<EVGElement> evaluateFunction( std::shared_ptr<TSNode> fnNode );
    std::shared_ptr<EVGElement> evaluateFunctionWithProps( std::shared_ptr<TSNode> fnNode , std::shared_ptr<EvalValue> props );
    void bindFunctionParams( std::shared_ptr<TSNode> fnNode , std::shared_ptr<EvalValue> props );
    void bindObjectPattern( std::shared_ptr<TSNode> pattern , std::shared_ptr<EvalValue> props );
    std::shared_ptr<TSNode> getFunctionBody( std::shared_ptr<TSNode> fnNode );
    std::shared_ptr<EVGElement> evaluateFunctionBody( std::shared_ptr<TSNode> body );
    std::shared_ptr<EVGElement> evaluateJSX( std::shared_ptr<TSNode> node );
    std::shared_ptr<EVGElement> evaluateJSXElement( std::shared_ptr<TSNode> jsxNode );
    bool isComponent( std::string name );
    std::shared_ptr<EVGElement> expandComponent( std::string name , std::shared_ptr<TSNode> jsxNode );
    std::shared_ptr<EvalValue> evaluateProps( std::shared_ptr<TSNode> jsxNode );
    std::vector<std::shared_ptr<EvalValue>> collectChildElements( std::shared_ptr<TSNode> jsxNode );
    std::shared_ptr<EvalValue> evaluateAttributeValue( std::shared_ptr<TSNode> attr );
    void evaluateAttributes( std::shared_ptr<EVGElement> element , std::shared_ptr<TSNode> openingNode );
    void applyAttribute( std::shared_ptr<EVGElement> element , std::string rawName , std::string strValue );
    std::string evaluateTextContent( std::shared_ptr<TSNode> jsxNode );
    void evaluateChildren( std::shared_ptr<EVGElement> element , std::shared_ptr<TSNode> jsxNode );
    void evaluateExpressionChild( std::shared_ptr<EVGElement> element , std::shared_ptr<TSNode> exprContainer );
    void evaluateArrayMapChild( std::shared_ptr<EVGElement> element , std::shared_ptr<TSNode> callNode );
    void bindMapCallback( std::shared_ptr<TSNode> callback , std::shared_ptr<EvalValue> item , int index );
    std::shared_ptr<EVGElement> evaluateMapCallbackBody( std::shared_ptr<TSNode> callback );
    void evaluateTernaryChild( std::shared_ptr<EVGElement> element , std::shared_ptr<TSNode> node );
    void evaluateAndChild( std::shared_ptr<EVGElement> element , std::shared_ptr<TSNode> node );
    std::shared_ptr<EvalValue> evaluateExpr( std::shared_ptr<TSNode> node );
    std::shared_ptr<EvalValue> evaluateBinaryExpr( std::shared_ptr<TSNode> node );
    std::shared_ptr<EvalValue> evaluateUnaryExpr( std::shared_ptr<TSNode> node );
    std::shared_ptr<EvalValue> evaluateConditionalExpr( std::shared_ptr<TSNode> node );
    std::shared_ptr<EvalValue> evaluateMemberExpr( std::shared_ptr<TSNode> node );
    std::shared_ptr<EvalValue> evaluateArrayExpr( std::shared_ptr<TSNode> node );
    std::shared_ptr<EvalValue> evaluateObjectExpr( std::shared_ptr<TSNode> node );
    std::string mapTagName( std::string jsxTag );
    std::string trimText( std::string text );
    std::string normalizeWhitespace( std::string text );
    bool startsWithPunctuation( std::string s );
    bool endsWithOpenPunctuation( std::string s );
    std::string smartJoinText( std::string existing , std::string newText );
    std::string unquote( std::string s );
};
class EVGComponentTool : public std::enable_shared_from_this<EVGComponentTool>  { 
  public :
    double pageWidth;
    double pageHeight;
    std::string inputPath;
    std::string outputPath;
    std::string fontsDir;
    std::string assetPaths;
    std::shared_ptr<FontManager> fontManager;
    /* class constructor */ 
    EVGComponentTool( );
    /* static methods */ 
    static void m();
    /* instance methods */ 
    void main( std::vector<std::string> args );
    void printEVGTree( std::shared_ptr<EVGElement> el , int depth );
    void initFonts();
    std::string getDirectory( std::string path );
    std::string getFileName( std::string path );
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
  };
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
  };
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
  };
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
  };
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
  };
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
      if ( ch == std::string("_") ) {
        value = value + this->advance();
      } else {
        if ( ch == std::string(".") ) {
          value = value + this->advance();
        } else {
          if ( ch == std::string("n") ) {
            value = value + this->advance();
            return this->makeToken(std::string("BigInt"), value, startPos, startLine, startCol);
          }
          return this->makeToken(std::string("Number"), value, startPos, startLine, startCol);
        }
      }
    }
  };
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
  };
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
      if ( this->peek() == std::string("=") ) {
        this->advance();
        return this->makeToken(std::string("Punctuator"), std::string("&&="), startPos, startLine, startCol);
      }
      return this->makeToken(std::string("Punctuator"), std::string("&&"), startPos, startLine, startCol);
    }
  }
  if ( ch == std::string("|") ) {
    if ( next_1 == std::string("|") ) {
      this->advance();
      this->advance();
      if ( this->peek() == std::string("=") ) {
        this->advance();
        return this->makeToken(std::string("Punctuator"), std::string("||="), startPos, startLine, startCol);
      }
      return this->makeToken(std::string("Punctuator"), std::string("||"), startPos, startLine, startCol);
    }
  }
  if ( ch == std::string("?") ) {
    if ( next_1 == std::string("?") ) {
      this->advance();
      this->advance();
      if ( this->peek() == std::string("=") ) {
        this->advance();
        return this->makeToken(std::string("Punctuator"), std::string("??="), startPos, startLine, startCol);
      }
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
  if ( ch == std::string("*") ) {
    if ( next_1 == std::string("*") ) {
      this->advance();
      this->advance();
      return this->makeToken(std::string("Punctuator"), std::string("**"), startPos, startLine, startCol);
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
  };
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
  this->shorthand = false;
  this->computed = false;
  this->method = false;
  this->generator = false;
  this->async = false;
  this->delegate = false;
  this->await = false;
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
  };
  return prog;
}
std::shared_ptr<TSNode>  TSParserSimple::parseStatement() {
  std::string tokVal = this->peekValue();
  if ( tokVal == std::string("@") ) {
    std::vector<std::shared_ptr<TSNode>> decorators;
    while (this->matchValue(std::string("@"))) {
      std::shared_ptr<TSNode> dec = this->parseDecorator();
      decorators.push_back( dec  );
    };
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
    return this->parseFuncDecl(false);
  }
  if ( tokVal == std::string("async") ) {
    std::string nextVal_2 = this->peekNextValue();
    if ( nextVal_2 == std::string("function") ) {
      this->advance();
      return this->parseFuncDecl(true);
    }
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
  std::string tokType = this->peekType();
  if ( tokType == std::string("Identifier") ) {
    std::string nextVal_3 = this->peekNextValue();
    if ( nextVal_3 == std::string(":") ) {
      return this->parseLabeledStatement();
    }
  }
  return this->parseExprStmt();
}
std::shared_ptr<TSNode>  TSParserSimple::parseLabeledStatement() {
  std::shared_ptr<TSNode> node =  std::make_shared<TSNode>();
  node->nodeType = std::string("LabeledStatement");
  std::shared_ptr<Token> startTok = this->peek();
  node->start = startTok->start;
  node->line = startTok->line;
  node->col = startTok->col;
  std::shared_ptr<Token> labelTok = this->expect(std::string("Identifier"));
  node->name = labelTok->value;
  this->expectValue(std::string(":"));
  std::shared_ptr<TSNode> body = this->parseStatement();
  node->body  = body;
  return node;
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
    };
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
        };
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
    };
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
    };
    for ( int i = 0; i != (int)(extendsList.size()); i++) {
      std::shared_ptr<TSNode> ext = extendsList.at(i);
      std::shared_ptr<TSNode> wrapper =  std::make_shared<TSNode>();
      wrapper->nodeType = std::string("TSExpressionWithTypeArguments");
      wrapper->left  = ext;
      node->children.push_back( wrapper  );
    };
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
  };
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
  };
  this->expectValue(std::string(">"));
  return params;
}
std::shared_ptr<TSNode>  TSParserSimple::parsePropertySig() {
  std::shared_ptr<Token> startTok = this->peek();
  int startPos = startTok->start;
  int startLine = startTok->line;
  int startCol = startTok->col;
  bool isReadonly = false;
  if ( this->matchValue(std::string("readonly")) ) {
    isReadonly = true;
    this->advance();
  }
  if ( this->matchValue(std::string("[")) ) {
    this->advance();
    std::shared_ptr<Token> paramTok = this->expect(std::string("Identifier"));
    return this->parseIndexSignatureRest(isReadonly, paramTok, startPos, startLine, startCol);
  }
  if ( this->matchValue(std::string("(")) ) {
    return this->parseCallSignature(startPos, startLine, startCol);
  }
  if ( this->matchValue(std::string("new")) ) {
    return this->parseConstructSignature(startPos, startLine, startCol);
  }
  std::shared_ptr<TSNode> prop =  std::make_shared<TSNode>();
  prop->nodeType = std::string("TSPropertySignature");
  prop->start = startPos;
  prop->line = startLine;
  prop->col = startCol;
  prop->readonly = isReadonly;
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
std::shared_ptr<TSNode>  TSParserSimple::parseCallSignature( int startPos , int startLine , int startCol ) {
  std::shared_ptr<TSNode> sig =  std::make_shared<TSNode>();
  sig->nodeType = std::string("TSCallSignatureDeclaration");
  sig->start = startPos;
  sig->line = startLine;
  sig->col = startCol;
  if ( this->matchValue(std::string("<")) ) {
    std::vector<std::shared_ptr<TSNode>> typeParams = this->parseTypeParams();
    sig->params = typeParams;
  }
  this->expectValue(std::string("("));
  while ((this->matchValue(std::string(")")) == false) && (this->isAtEnd() == false)) {
    if ( ((int)(sig->children.size())) > 0 ) {
      this->expectValue(std::string(","));
    }
    std::shared_ptr<TSNode> param = this->parseParam();
    sig->children.push_back( param  );
  };
  this->expectValue(std::string(")"));
  if ( this->matchValue(std::string(":")) ) {
    std::shared_ptr<TSNode> typeAnnot = this->parseTypeAnnotation();
    sig->typeAnnotation  = typeAnnot;
  }
  return sig;
}
std::shared_ptr<TSNode>  TSParserSimple::parseConstructSignature( int startPos , int startLine , int startCol ) {
  std::shared_ptr<TSNode> sig =  std::make_shared<TSNode>();
  sig->nodeType = std::string("TSConstructSignatureDeclaration");
  sig->start = startPos;
  sig->line = startLine;
  sig->col = startCol;
  this->expectValue(std::string("new"));
  if ( this->matchValue(std::string("<")) ) {
    std::vector<std::shared_ptr<TSNode>> typeParams = this->parseTypeParams();
    sig->params = typeParams;
  }
  this->expectValue(std::string("("));
  while ((this->matchValue(std::string(")")) == false) && (this->isAtEnd() == false)) {
    if ( ((int)(sig->children.size())) > 0 ) {
      this->expectValue(std::string(","));
    }
    std::shared_ptr<TSNode> param = this->parseParam();
    sig->children.push_back( param  );
  };
  this->expectValue(std::string(")"));
  if ( this->matchValue(std::string(":")) ) {
    std::shared_ptr<TSNode> typeAnnot = this->parseTypeAnnotation();
    sig->typeAnnotation  = typeAnnot;
  }
  return sig;
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
    };
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
  };
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
  };
  if ( ((int)(decorators.size())) > 0 ) {
    member->decorators = decorators;
  }
  bool isStatic = false;
  bool isAbstract = false;
  bool isReadonly = false;
  bool isAsync = false;
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
      if ( this->matchValue(std::string("{")) ) {
        member->nodeType = std::string("StaticBlock");
        member->body  = this->parseBlock();
        member->start = startTok->start;
        member->line = startTok->line;
        member->col = startTok->col;
        return member;
      }
    }
    if ( tokVal == std::string("abstract") ) {
      isAbstract = true;
      this->advance();
    }
    if ( tokVal == std::string("readonly") ) {
      isReadonly = true;
      this->advance();
    }
    if ( tokVal == std::string("async") ) {
      isAsync = true;
      this->advance();
    }
    std::string newTokVal = this->peekValue();
    if ( ((((((newTokVal != std::string("public")) && (newTokVal != std::string("private"))) && (newTokVal != std::string("protected"))) && (newTokVal != std::string("static"))) && (newTokVal != std::string("abstract"))) && (newTokVal != std::string("readonly"))) && (newTokVal != std::string("async")) ) {
      keepParsing = false;
    }
  };
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
    };
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
    if ( isAsync ) {
      member->async = true;
    }
    this->expectValue(std::string("("));
    while ((this->matchValue(std::string(")")) == false) && (this->isAtEnd() == false)) {
      if ( ((int)(member->params.size())) > 0 ) {
        this->expectValue(std::string(","));
      }
      std::shared_ptr<TSNode> param_1 = this->parseParam();
      member->params.push_back( param_1  );
    };
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
  };
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
  };
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
    };
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
  bool isAwait = false;
  if ( this->matchValue(std::string("await")) ) {
    this->advance();
    isAwait = true;
  }
  this->expectValue(std::string("("));
  std::string tokVal = this->peekValue();
  if ( ((tokVal == std::string("let")) || (tokVal == std::string("const"))) || (tokVal == std::string("var")) ) {
    std::string kind = tokVal;
    this->advance();
    std::shared_ptr<Token> varName = this->expect(std::string("Identifier"));
    std::string nextVal = this->peekValue();
    if ( nextVal == std::string("of") ) {
      node->nodeType = std::string("ForOfStatement");
      node->await = isAwait;
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
    };
    node->children.push_back( caseNode  );
  };
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
  std::string nextVal = this->peekValue();
  if ( nextVal == std::string("{") ) {
    std::shared_ptr<TSNode> pattern = this->parseObjectPattern();
    declarator->left  = pattern;
    declarator->start = pattern->start;
    declarator->line = pattern->line;
    declarator->col = pattern->col;
  } else {
    if ( nextVal == std::string("[") ) {
      std::shared_ptr<TSNode> pattern_1 = this->parseArrayPattern();
      declarator->left  = pattern_1;
      declarator->start = pattern_1->start;
      declarator->line = pattern_1->line;
      declarator->col = pattern_1->col;
    } else {
      std::shared_ptr<Token> nameTok = this->expect(std::string("Identifier"));
      declarator->name = nameTok->value;
      declarator->start = nameTok->start;
      declarator->line = nameTok->line;
      declarator->col = nameTok->col;
    }
  }
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
std::shared_ptr<TSNode>  TSParserSimple::parseObjectPattern() {
  std::shared_ptr<TSNode> node =  std::make_shared<TSNode>();
  node->nodeType = std::string("ObjectPattern");
  std::shared_ptr<Token> startTok = this->peek();
  node->start = startTok->start;
  node->line = startTok->line;
  node->col = startTok->col;
  this->expectValue(std::string("{"));
  while ((this->matchValue(std::string("}")) == false) && (this->isAtEnd() == false)) {
    if ( ((int)(node->children.size())) > 0 ) {
      this->expectValue(std::string(","));
      if ( this->matchValue(std::string("}")) ) {
        break;
      }
    }
    if ( this->matchValue(std::string("...")) ) {
      this->advance();
      std::shared_ptr<TSNode> restProp =  std::make_shared<TSNode>();
      restProp->nodeType = std::string("RestElement");
      std::shared_ptr<Token> restName = this->expect(std::string("Identifier"));
      restProp->name = restName->value;
      node->children.push_back( restProp  );
    } else {
      std::shared_ptr<TSNode> prop =  std::make_shared<TSNode>();
      prop->nodeType = std::string("Property");
      std::shared_ptr<Token> keyTok = this->expect(std::string("Identifier"));
      prop->name = keyTok->value;
      if ( this->matchValue(std::string(":")) ) {
        this->advance();
        std::shared_ptr<Token> valueTok = this->expect(std::string("Identifier"));
        std::shared_ptr<TSNode> valueId =  std::make_shared<TSNode>();
        valueId->nodeType = std::string("Identifier");
        valueId->name = valueTok->value;
        prop->right  = valueId;
      } else {
        prop->shorthand = true;
      }
      if ( this->matchValue(std::string("=")) ) {
        this->advance();
        std::shared_ptr<TSNode> defaultExpr = this->parseExpr();
        prop->init  = defaultExpr;
        prop->left  = defaultExpr;
      }
      node->children.push_back( prop  );
    }
  };
  this->expectValue(std::string("}"));
  return node;
}
std::shared_ptr<TSNode>  TSParserSimple::parseArrayPattern() {
  std::shared_ptr<TSNode> node =  std::make_shared<TSNode>();
  node->nodeType = std::string("ArrayPattern");
  std::shared_ptr<Token> startTok = this->peek();
  node->start = startTok->start;
  node->line = startTok->line;
  node->col = startTok->col;
  this->expectValue(std::string("["));
  while ((this->matchValue(std::string("]")) == false) && (this->isAtEnd() == false)) {
    if ( ((int)(node->children.size())) > 0 ) {
      this->expectValue(std::string(","));
      if ( this->matchValue(std::string("]")) ) {
        break;
      }
    }
    if ( this->matchValue(std::string(",")) ) {
      std::shared_ptr<TSNode> hole =  std::make_shared<TSNode>();
      hole->nodeType = std::string("Elision");
      node->children.push_back( hole  );
    } else {
      if ( this->matchValue(std::string("...")) ) {
        this->advance();
        std::shared_ptr<TSNode> restElem =  std::make_shared<TSNode>();
        restElem->nodeType = std::string("RestElement");
        std::shared_ptr<Token> restName = this->expect(std::string("Identifier"));
        restElem->name = restName->value;
        node->children.push_back( restElem  );
      } else {
        std::shared_ptr<TSNode> elem =  std::make_shared<TSNode>();
        std::shared_ptr<Token> elemTok = this->expect(std::string("Identifier"));
        elem->nodeType = std::string("Identifier");
        elem->name = elemTok->value;
        if ( this->matchValue(std::string("=")) ) {
          this->advance();
          std::shared_ptr<TSNode> defaultExpr = this->parseExpr();
          std::shared_ptr<TSNode> assignPat =  std::make_shared<TSNode>();
          assignPat->nodeType = std::string("AssignmentPattern");
          assignPat->left  = elem;
          assignPat->right  = defaultExpr;
          node->children.push_back( assignPat  );
        } else {
          node->children.push_back( elem  );
        }
      }
    }
  };
  this->expectValue(std::string("]"));
  return node;
}
std::shared_ptr<TSNode>  TSParserSimple::parseFuncDecl( bool isAsync ) {
  std::shared_ptr<TSNode> node =  std::make_shared<TSNode>();
  node->nodeType = std::string("FunctionDeclaration");
  std::shared_ptr<Token> startTok = this->peek();
  node->start = startTok->start;
  node->line = startTok->line;
  node->col = startTok->col;
  if ( isAsync ) {
    node->async = true;
  }
  this->expectValue(std::string("function"));
  if ( this->matchValue(std::string("*")) ) {
    this->advance();
    node->generator = true;
  }
  std::shared_ptr<Token> nameTok = this->expect(std::string("Identifier"));
  node->name = nameTok->value;
  if ( this->matchValue(std::string("<")) ) {
    std::vector<std::shared_ptr<TSNode>> typeParams = this->parseTypeParams();
    for ( int i = 0; i != (int)(typeParams.size()); i++) {
      std::shared_ptr<TSNode> tp = typeParams.at(i);
      node->children.push_back( tp  );
    };
  }
  this->expectValue(std::string("("));
  while ((this->matchValue(std::string(")")) == false) && (this->isAtEnd() == false)) {
    if ( ((int)(node->params.size())) > 0 ) {
      this->expectValue(std::string(","));
    }
    std::shared_ptr<TSNode> param = this->parseParam();
    node->params.push_back( param  );
  };
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
  std::vector<std::shared_ptr<TSNode>> decorators;
  while (this->matchValue(std::string("@"))) {
    std::shared_ptr<TSNode> dec = this->parseDecorator();
    decorators.push_back( dec  );
  };
  bool isRest = false;
  if ( this->matchValue(std::string("...")) ) {
    this->advance();
    isRest = true;
  }
  if ( this->matchValue(std::string("{")) ) {
    std::shared_ptr<TSNode> pattern = this->parseObjectPattern();
    for ( int i = 0; i != (int)(decorators.size()); i++) {
      std::shared_ptr<TSNode> d = decorators.at(i);
      pattern->decorators.push_back( d  );
    };
    if ( isRest ) {
      std::shared_ptr<TSNode> restElem =  std::make_shared<TSNode>();
      restElem->nodeType = std::string("RestElement");
      restElem->left  = pattern;
      return restElem;
    }
    return pattern;
  }
  if ( this->matchValue(std::string("[")) ) {
    std::shared_ptr<TSNode> pattern_1 = this->parseArrayPattern();
    for ( int i_1 = 0; i_1 != (int)(decorators.size()); i_1++) {
      std::shared_ptr<TSNode> d_1 = decorators.at(i_1);
      pattern_1->decorators.push_back( d_1  );
    };
    if ( isRest ) {
      std::shared_ptr<TSNode> restElem_1 =  std::make_shared<TSNode>();
      restElem_1->nodeType = std::string("RestElement");
      restElem_1->left  = pattern_1;
      return restElem_1;
    }
    return pattern_1;
  }
  std::shared_ptr<TSNode> param =  std::make_shared<TSNode>();
  if ( isRest ) {
    param->nodeType = std::string("RestElement");
    param->kind = std::string("rest");
  } else {
    param->nodeType = std::string("Parameter");
  }
  for ( int i_2 = 0; i_2 != (int)(decorators.size()); i_2++) {
    std::shared_ptr<TSNode> d_2 = decorators.at(i_2);
    param->decorators.push_back( d_2  );
  };
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
  if ( this->matchValue(std::string("=")) ) {
    this->advance();
    param->init  = this->parseExpr();
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
  };
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
  std::string nextVal = this->peekValue();
  if ( nextVal == std::string("asserts") ) {
    std::shared_ptr<Token> assertsTok = this->peek();
    this->advance();
    std::shared_ptr<TSNode> predicate =  std::make_shared<TSNode>();
    predicate->nodeType = std::string("TSTypePredicate");
    predicate->start = assertsTok->start;
    predicate->line = assertsTok->line;
    predicate->col = assertsTok->col;
    predicate->value = std::string("asserts");
    std::shared_ptr<Token> paramTok = this->expect(std::string("Identifier"));
    predicate->name = paramTok->value;
    if ( this->matchValue(std::string("is")) ) {
      this->advance();
      std::shared_ptr<TSNode> assertType = this->parseType();
      predicate->typeAnnotation  = assertType;
    }
    annot->typeAnnotation  = predicate;
    return annot;
  }
  if ( this->matchType(std::string("Identifier")) ) {
    int savedPos = this->pos;
    std::shared_ptr<Token> savedTok = this->currentToken;
    std::shared_ptr<Token> paramTok_1 = this->peek();
    this->advance();
    if ( this->matchValue(std::string("is")) ) {
      this->advance();
      std::shared_ptr<TSNode> predicate_1 =  std::make_shared<TSNode>();
      predicate_1->nodeType = std::string("TSTypePredicate");
      predicate_1->start = paramTok_1->start;
      predicate_1->line = paramTok_1->line;
      predicate_1->col = paramTok_1->col;
      predicate_1->name = paramTok_1->value;
      std::shared_ptr<TSNode> typeExpr = this->parseType();
      predicate_1->typeAnnotation  = typeExpr;
      annot->typeAnnotation  = predicate_1;
      return annot;
    }
    this->pos = savedPos;
    this->currentToken  = savedTok;
  }
  std::shared_ptr<TSNode> typeExpr_1 = this->parseType();
  annot->typeAnnotation  = typeExpr_1;
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
    };
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
    };
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
  };
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
  if ( tokVal == std::string("new") ) {
    return this->parseConstructorType();
  }
  if ( tokVal == std::string("import") ) {
    return this->parseImportType();
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
    };
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
      std::shared_ptr<Token> restTok = this->peek();
      this->advance();
      std::string restName = std::string("");
      if ( this->matchType(std::string("Identifier")) ) {
        int savedPos = this->pos;
        std::shared_ptr<Token> savedTok = this->currentToken;
        std::shared_ptr<Token> nameTok = this->peek();
        this->advance();
        if ( this->matchValue(std::string(":")) ) {
          restName = nameTok->value;
          this->advance();
        } else {
          this->pos = savedPos;
          this->currentToken  = savedTok;
        }
      }
      std::shared_ptr<TSNode> innerType = this->parseType();
      std::shared_ptr<TSNode> restType =  std::make_shared<TSNode>();
      restType->nodeType = std::string("TSRestType");
      restType->start = restTok->start;
      restType->line = restTok->line;
      restType->col = restTok->col;
      restType->typeAnnotation  = innerType;
      if ( restName != std::string("") ) {
        restType->name = restName;
      }
      tuple->children.push_back( restType  );
    } else {
      bool isNamed = false;
      std::string elemName = std::string("");
      bool elemOptional = false;
      std::shared_ptr<Token> elemStart = this->peek();
      if ( this->matchType(std::string("Identifier")) ) {
        int savedPos_1 = this->pos;
        std::shared_ptr<Token> savedTok_1 = this->currentToken;
        std::shared_ptr<Token> nameTok_1 = this->peek();
        this->advance();
        if ( this->matchValue(std::string("?")) ) {
          this->advance();
          elemOptional = true;
        }
        if ( this->matchValue(std::string(":")) ) {
          isNamed = true;
          elemName = nameTok_1->value;
          this->advance();
        } else {
          this->pos = savedPos_1;
          this->currentToken  = savedTok_1;
          elemOptional = false;
        }
      }
      std::shared_ptr<TSNode> elemType = this->parseType();
      if ( isNamed ) {
        std::shared_ptr<TSNode> namedElem =  std::make_shared<TSNode>();
        namedElem->nodeType = std::string("TSNamedTupleMember");
        namedElem->start = elemStart->start;
        namedElem->line = elemStart->line;
        namedElem->col = elemStart->col;
        namedElem->name = elemName;
        namedElem->optional = elemOptional;
        namedElem->typeAnnotation  = elemType;
        tuple->children.push_back( namedElem  );
      } else {
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
  };
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
      };
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
  };
  this->expectValue(std::string(")"));
  if ( this->matchValue(std::string("=>")) ) {
    this->advance();
    std::shared_ptr<TSNode> returnType = this->parseType();
    funcType->typeAnnotation  = returnType;
  }
  return funcType;
}
std::shared_ptr<TSNode>  TSParserSimple::parseConstructorType() {
  std::shared_ptr<TSNode> ctorType =  std::make_shared<TSNode>();
  ctorType->nodeType = std::string("TSConstructorType");
  std::shared_ptr<Token> startTok = this->peek();
  ctorType->start = startTok->start;
  ctorType->line = startTok->line;
  ctorType->col = startTok->col;
  this->expectValue(std::string("new"));
  if ( this->matchValue(std::string("<")) ) {
    std::vector<std::shared_ptr<TSNode>> typeParams = this->parseTypeParams();
    ctorType->children = typeParams;
  }
  this->expectValue(std::string("("));
  while ((this->matchValue(std::string(")")) == false) && (this->isAtEnd() == false)) {
    if ( ((int)(ctorType->params.size())) > 0 ) {
      this->expectValue(std::string(","));
    }
    std::shared_ptr<TSNode> param = this->parseParam();
    ctorType->params.push_back( param  );
  };
  this->expectValue(std::string(")"));
  if ( this->matchValue(std::string("=>")) ) {
    this->advance();
    std::shared_ptr<TSNode> returnType = this->parseType();
    ctorType->typeAnnotation  = returnType;
  }
  return ctorType;
}
std::shared_ptr<TSNode>  TSParserSimple::parseImportType() {
  std::shared_ptr<TSNode> importType =  std::make_shared<TSNode>();
  importType->nodeType = std::string("TSImportType");
  std::shared_ptr<Token> startTok = this->peek();
  importType->start = startTok->start;
  importType->line = startTok->line;
  importType->col = startTok->col;
  this->expectValue(std::string("import"));
  this->expectValue(std::string("("));
  std::shared_ptr<Token> sourceTok = this->expect(std::string("String"));
  importType->value = sourceTok->value;
  this->expectValue(std::string(")"));
  if ( this->matchValue(std::string(".")) ) {
    this->advance();
    std::shared_ptr<Token> memberTok = this->expect(std::string("Identifier"));
    importType->name = memberTok->value;
    if ( this->matchValue(std::string("<")) ) {
      this->advance();
      while ((this->matchValue(std::string(">")) == false) && (this->isAtEnd() == false)) {
        if ( ((int)(importType->params.size())) > 0 ) {
          this->expectValue(std::string(","));
        }
        std::shared_ptr<TSNode> typeArg = this->parseType();
        importType->params.push_back( typeArg  );
      };
      this->expectValue(std::string(">"));
    }
  }
  return importType;
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
  };
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
  };
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
  std::string tokVal = this->peekValue();
  if ( tokVal == std::string("=") ) {
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
  if ( ((tokVal == std::string("&&=")) || (tokVal == std::string("||="))) || (tokVal == std::string("??=")) ) {
    this->advance();
    std::shared_ptr<TSNode> right_1 = this->parseAssign();
    std::shared_ptr<TSNode> assign_1 =  std::make_shared<TSNode>();
    assign_1->nodeType = std::string("AssignmentExpression");
    assign_1->value = tokVal;
    assign_1->left  = left;
    assign_1->right  = right_1;
    assign_1->start = left->start;
    assign_1->line = left->line;
    assign_1->col = left->col;
    return assign_1;
  }
  return left;
}
std::shared_ptr<TSNode>  TSParserSimple::parseNullishCoalescing() {
  std::shared_ptr<TSNode> left = this->parseTernary();
  while (this->matchValue(std::string("??"))) {
    this->advance();
    std::shared_ptr<TSNode> right = this->parseTernary();
    std::shared_ptr<TSNode> nullish =  std::make_shared<TSNode>();
    nullish->nodeType = std::string("LogicalExpression");
    nullish->value = std::string("??");
    nullish->left  = left;
    nullish->right  = right;
    nullish->start = left->start;
    nullish->line = left->line;
    nullish->col = left->col;
    left = nullish;
  };
  return left;
}
std::shared_ptr<TSNode>  TSParserSimple::parseTernary() {
  std::shared_ptr<TSNode> testExpr = this->parseLogicalOr();
  if ( this->matchValue(std::string("?")) ) {
    this->advance();
    std::shared_ptr<TSNode> consequentExpr = this->parseAssign();
    if ( this->matchValue(std::string(":")) ) {
      this->advance();
      std::shared_ptr<TSNode> alternateExpr = this->parseAssign();
      std::shared_ptr<TSNode> cond =  std::make_shared<TSNode>();
      cond->nodeType = std::string("ConditionalExpression");
      cond->start = testExpr->start;
      cond->line = testExpr->line;
      cond->col = testExpr->col;
      cond->left  = testExpr;
      cond->test  = testExpr;
      cond->consequent  = consequentExpr;
      cond->alternate  = alternateExpr;
      return cond;
    }
  }
  return testExpr;
}
std::shared_ptr<TSNode>  TSParserSimple::parseLogicalOr() {
  std::shared_ptr<TSNode> left = this->parseLogicalAnd();
  while (this->matchValue(std::string("||"))) {
    this->advance();
    std::shared_ptr<TSNode> right = this->parseLogicalAnd();
    std::shared_ptr<TSNode> expr =  std::make_shared<TSNode>();
    expr->nodeType = std::string("BinaryExpression");
    expr->value = std::string("||");
    expr->left  = left;
    expr->right  = right;
    expr->start = left->start;
    expr->line = left->line;
    expr->col = left->col;
    left = expr;
  };
  return left;
}
std::shared_ptr<TSNode>  TSParserSimple::parseLogicalAnd() {
  std::shared_ptr<TSNode> left = this->parseEquality();
  while (this->matchValue(std::string("&&"))) {
    this->advance();
    std::shared_ptr<TSNode> right = this->parseEquality();
    std::shared_ptr<TSNode> expr =  std::make_shared<TSNode>();
    expr->nodeType = std::string("BinaryExpression");
    expr->value = std::string("&&");
    expr->left  = left;
    expr->right  = right;
    expr->start = left->start;
    expr->line = left->line;
    expr->col = left->col;
    left = expr;
  };
  return left;
}
std::shared_ptr<TSNode>  TSParserSimple::parseEquality() {
  std::shared_ptr<TSNode> left = this->parseComparison();
  std::string tokVal = this->peekValue();
  while ((((tokVal == std::string("==")) || (tokVal == std::string("!="))) || (tokVal == std::string("==="))) || (tokVal == std::string("!=="))) {
    std::shared_ptr<Token> opTok = this->peek();
    this->advance();
    std::shared_ptr<TSNode> right = this->parseComparison();
    std::shared_ptr<TSNode> expr =  std::make_shared<TSNode>();
    expr->nodeType = std::string("BinaryExpression");
    expr->value = opTok->value;
    expr->left  = left;
    expr->right  = right;
    expr->start = left->start;
    expr->line = left->line;
    expr->col = left->col;
    left = expr;
    tokVal = this->peekValue();
  };
  return left;
}
std::shared_ptr<TSNode>  TSParserSimple::parseComparison() {
  std::shared_ptr<TSNode> left = this->parseAdditive();
  std::string tokVal = this->peekValue();
  while ((((tokVal == std::string("<")) || (tokVal == std::string(">"))) || (tokVal == std::string("<="))) || (tokVal == std::string(">="))) {
    if ( tokVal == std::string("<") ) {
      if ( this->tsxMode == true ) {
        if ( left->nodeType == std::string("Identifier") ) {
          if ( this->startsWithLowerCase(left->name) ) {
            if ( this->looksLikeGenericCall() ) {
              return left;
            }
          }
        }
      }
    }
    std::shared_ptr<Token> opTok = this->peek();
    this->advance();
    std::shared_ptr<TSNode> right = this->parseAdditive();
    std::shared_ptr<TSNode> expr =  std::make_shared<TSNode>();
    expr->nodeType = std::string("BinaryExpression");
    expr->value = opTok->value;
    expr->left  = left;
    expr->right  = right;
    expr->start = left->start;
    expr->line = left->line;
    expr->col = left->col;
    left = expr;
    tokVal = this->peekValue();
  };
  return left;
}
std::shared_ptr<TSNode>  TSParserSimple::parseAdditive() {
  std::shared_ptr<TSNode> left = this->parseMultiplicative();
  std::string tokVal = this->peekValue();
  while ((tokVal == std::string("+")) || (tokVal == std::string("-"))) {
    std::shared_ptr<Token> opTok = this->peek();
    this->advance();
    std::shared_ptr<TSNode> right = this->parseMultiplicative();
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
  };
  return left;
}
std::shared_ptr<TSNode>  TSParserSimple::parseMultiplicative() {
  std::shared_ptr<TSNode> left = this->parseUnary();
  std::string tokVal = this->peekValue();
  while ((((tokVal == std::string("*")) || (tokVal == std::string("/"))) || (tokVal == std::string("%"))) || (tokVal == std::string("**"))) {
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
  };
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
  if ( tokVal == std::string("yield") ) {
    std::shared_ptr<Token> yieldTok = this->peek();
    this->advance();
    std::shared_ptr<TSNode> yieldExpr =  std::make_shared<TSNode>();
    yieldExpr->nodeType = std::string("YieldExpression");
    yieldExpr->start = yieldTok->start;
    yieldExpr->line = yieldTok->line;
    yieldExpr->col = yieldTok->col;
    if ( this->matchValue(std::string("*")) ) {
      this->advance();
      yieldExpr->delegate = true;
    }
    std::string nextVal = this->peekValue();
    if ( (((nextVal != std::string(";")) && (nextVal != std::string("}"))) && (nextVal != std::string(","))) && (nextVal != std::string(")")) ) {
      yieldExpr->left  = this->parseAssign();
    }
    return yieldExpr;
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
    if ( this->tsxMode == true ) {
      std::string peekNext = this->peekNextValue();
      std::string peekNextT = this->peekNextType();
      if ( peekNext == std::string(">") ) {
        return this->parsePostfix();
      }
      if ( peekNextT == std::string("Identifier") ) {
        std::string peekTwoAhead = this->peekAheadValue(2);
        if ( peekTwoAhead != std::string("extends") ) {
          return this->parsePostfix();
        }
      }
    }
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
    if ( tokVal == std::string("<") ) {
      bool shouldParseAsGenericCall = false;
      if ( this->tsxMode == false ) {
        /** unused:  std::string next1 = this->peekAheadValue(1)   **/ ;
        std::string next2 = this->peekAheadValue(2);
        if ( ((next2 == std::string(">")) || (next2 == std::string(","))) || (next2 == std::string("extends")) ) {
          shouldParseAsGenericCall = true;
        }
      } else {
        if ( expr->nodeType == std::string("Identifier") ) {
          if ( this->startsWithLowerCase(expr->name) ) {
            if ( this->looksLikeGenericCall() ) {
              shouldParseAsGenericCall = true;
            }
          }
        }
        if ( expr->nodeType == std::string("MemberExpression") ) {
          if ( this->looksLikeGenericCall() ) {
            shouldParseAsGenericCall = true;
          }
        }
      }
      if ( shouldParseAsGenericCall ) {
        this->advance();
        std::shared_ptr<TSNode> call =  std::make_shared<TSNode>();
        call->nodeType = std::string("CallExpression");
        call->left  = expr;
        call->start = expr->start;
        call->line = expr->line;
        call->col = expr->col;
        while ((this->matchValue(std::string(">")) == false) && (this->isAtEnd() == false)) {
          if ( ((int)(call->params.size())) > 0 ) {
            this->expectValue(std::string(","));
          }
          std::shared_ptr<TSNode> typeArg = this->parseType();
          call->params.push_back( typeArg  );
        };
        this->expectValue(std::string(">"));
        if ( this->matchValue(std::string("(")) ) {
          this->advance();
          while ((this->matchValue(std::string(")")) == false) && (this->isAtEnd() == false)) {
            if ( ((int)(call->children.size())) > 0 ) {
              this->expectValue(std::string(","));
            }
            if ( this->matchValue(std::string("...")) ) {
              this->advance();
              std::shared_ptr<TSNode> spreadArg = this->parseExpr();
              std::shared_ptr<TSNode> spread =  std::make_shared<TSNode>();
              spread->nodeType = std::string("SpreadElement");
              spread->left  = spreadArg;
              call->children.push_back( spread  );
            } else {
              std::shared_ptr<TSNode> arg = this->parseExpr();
              call->children.push_back( arg  );
            }
          };
          this->expectValue(std::string(")"));
          expr = call;
        }
      }
    }
    tokVal = this->peekValue();
    if ( tokVal == std::string("(") ) {
      this->advance();
      std::shared_ptr<TSNode> call_1 =  std::make_shared<TSNode>();
      call_1->nodeType = std::string("CallExpression");
      call_1->left  = expr;
      call_1->start = expr->start;
      call_1->line = expr->line;
      call_1->col = expr->col;
      while ((this->matchValue(std::string(")")) == false) && (this->isAtEnd() == false)) {
        if ( ((int)(call_1->children.size())) > 0 ) {
          this->expectValue(std::string(","));
        }
        if ( this->matchValue(std::string("...")) ) {
          this->advance();
          std::shared_ptr<TSNode> spreadArg_1 = this->parseExpr();
          std::shared_ptr<TSNode> spread_1 =  std::make_shared<TSNode>();
          spread_1->nodeType = std::string("SpreadElement");
          spread_1->left  = spreadArg_1;
          call_1->children.push_back( spread_1  );
        } else {
          std::shared_ptr<TSNode> arg_1 = this->parseExpr();
          call_1->children.push_back( arg_1  );
        }
      };
      this->expectValue(std::string(")"));
      expr = call_1;
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
          std::shared_ptr<TSNode> arg_2 = this->parseExpr();
          optCall->children.push_back( arg_2  );
        };
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
    std::string tokType = this->peekType();
    if ( tokType == std::string("Template") ) {
      std::shared_ptr<TSNode> quasi = this->parseTemplateLiteral();
      std::shared_ptr<TSNode> tagged =  std::make_shared<TSNode>();
      tagged->nodeType = std::string("TaggedTemplateExpression");
      tagged->left  = expr;
      tagged->right  = quasi;
      tagged->start = expr->start;
      tagged->line = expr->line;
      tagged->col = expr->col;
      expr = tagged;
    }
    std::string newTokVal = this->peekValue();
    std::string newTokType = this->peekType();
    if ( (((((((newTokVal != std::string("(")) && (newTokVal != std::string("."))) && (newTokVal != std::string("?."))) && (newTokVal != std::string("["))) && (newTokVal != std::string("!"))) && (newTokVal != std::string("as"))) && (newTokVal != std::string("satisfies"))) && (newTokType != std::string("Template")) ) {
      keepParsing = false;
    }
  };
  return expr;
}
std::shared_ptr<TSNode>  TSParserSimple::parsePrimary() {
  std::string tokType = this->peekType();
  std::string tokVal = this->peekValue();
  std::shared_ptr<Token> tok = this->peek();
  if ( (tokType == std::string("Identifier")) || (tokType == std::string("TSType")) ) {
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
  if ( tokType == std::string("BigInt") ) {
    this->advance();
    std::shared_ptr<TSNode> bigint =  std::make_shared<TSNode>();
    bigint->nodeType = std::string("BigIntLiteral");
    bigint->value = tok->value;
    bigint->start = tok->start;
    bigint->end = tok->end;
    bigint->line = tok->line;
    bigint->col = tok->col;
    return bigint;
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
      std::string peekTwoAhead = this->peekAheadValue(2);
      if ( peekTwoAhead != std::string("extends") ) {
        return this->parseJSXElement();
      }
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
  if ( tokVal == std::string("import") ) {
    std::shared_ptr<Token> importTok = this->peek();
    this->advance();
    if ( this->matchValue(std::string(".")) ) {
      this->advance();
      if ( this->matchValue(std::string("meta")) ) {
        this->advance();
        std::shared_ptr<TSNode> metaProp =  std::make_shared<TSNode>();
        metaProp->nodeType = std::string("MetaProperty");
        metaProp->name = std::string("import");
        metaProp->value = std::string("meta");
        metaProp->start = importTok->start;
        metaProp->line = importTok->line;
        metaProp->col = importTok->col;
        return metaProp;
      }
    }
    if ( this->matchValue(std::string("(")) ) {
      this->advance();
      std::shared_ptr<TSNode> source = this->parseExpr();
      this->expectValue(std::string(")"));
      std::shared_ptr<TSNode> importExpr =  std::make_shared<TSNode>();
      importExpr->nodeType = std::string("ImportExpression");
      importExpr->left  = source;
      importExpr->start = importTok->start;
      importExpr->line = importTok->line;
      importExpr->col = importTok->col;
      return importExpr;
    }
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
  };
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
      bool isComputed = false;
      bool isMethod = false;
      bool isGetter = false;
      bool isSetter = false;
      std::string currVal = this->peekValue();
      std::string nextType = this->peekNextType();
      std::string nextVal = this->peekNextValue();
      if ( currVal == std::string("async") ) {
        if ( ((nextType == std::string("Identifier")) || (nextVal == std::string("["))) || (nextVal == std::string("(")) ) {
          this->advance();
          prop->async = true;
          currVal = this->peekValue();
          nextType = this->peekNextType();
          nextVal = this->peekNextValue();
        }
      }
      if ( currVal == std::string("get") ) {
        if ( (nextType == std::string("Identifier")) || (nextVal == std::string("[")) ) {
          this->advance();
          isGetter = true;
          prop->kind = std::string("get");
        }
      }
      if ( currVal == std::string("set") ) {
        if ( (nextType == std::string("Identifier")) || (nextVal == std::string("[")) ) {
          this->advance();
          isSetter = true;
          prop->kind = std::string("set");
        }
      }
      std::shared_ptr<Token> keyTok = this->peek();
      if ( this->matchValue(std::string("[")) ) {
        this->advance();
        std::shared_ptr<TSNode> keyExpr = this->parseExpr();
        this->expectValue(std::string("]"));
        prop->right  = keyExpr;
        isComputed = true;
        prop->computed = true;
      }
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
      if ( this->matchValue(std::string("(")) ) {
        isMethod = true;
        prop->method = true;
        std::shared_ptr<TSNode> fnNode =  std::make_shared<TSNode>();
        fnNode->nodeType = std::string("FunctionExpression");
        this->advance();
        while ((this->matchValue(std::string(")")) == false) && (this->isAtEnd() == false)) {
          if ( ((int)(fnNode->params.size())) > 0 ) {
            this->expectValue(std::string(","));
          }
          fnNode->params.push_back( this->parseParam()  );
        };
        this->expectValue(std::string(")"));
        if ( this->matchValue(std::string(":")) ) {
          this->advance();
          fnNode->typeAnnotation  = this->parseType();
        }
        if ( this->matchValue(std::string("{")) ) {
          fnNode->body  = this->parseBlock();
        }
        prop->left  = fnNode;
        if ( (isGetter == false) && (isSetter == false) ) {
          prop->kind = std::string("init");
        }
      }
      if ( isMethod == false ) {
        if ( this->matchValue(std::string(":")) ) {
          this->advance();
          std::shared_ptr<TSNode> valueExpr = this->parseExpr();
          prop->left  = valueExpr;
          prop->kind = std::string("init");
        } else {
          if ( isComputed == false ) {
            std::shared_ptr<TSNode> shorthandVal =  std::make_shared<TSNode>();
            shorthandVal->nodeType = std::string("Identifier");
            shorthandVal->name = prop->name;
            prop->left  = shorthandVal;
            prop->shorthand = true;
            prop->kind = std::string("init");
          }
        }
      }
      node->children.push_back( prop  );
    }
    if ( this->matchValue(std::string(",")) ) {
      this->advance();
    }
  };
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
  };
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
    };
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
  if ( this->matchValue(std::string(".")) ) {
    this->advance();
    if ( this->matchValue(std::string("target")) ) {
      this->advance();
      node->nodeType = std::string("MetaProperty");
      node->name = std::string("new");
      node->value = std::string("target");
      return node;
    }
  }
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
    };
  }
  if ( this->matchValue(std::string("(")) ) {
    this->advance();
    while ((this->matchValue(std::string(")")) == false) && (this->isAtEnd() == false)) {
      if ( ((int)(node->children.size())) > 0 ) {
        this->expectValue(std::string(","));
      }
      std::shared_ptr<TSNode> arg = this->parseExpr();
      node->children.push_back( arg  );
    };
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
std::string  TSParserSimple::peekAheadValue( int offset ) {
  int aheadPos = this->pos + offset;
  if ( aheadPos < ((int)(this->tokens.size())) ) {
    std::shared_ptr<Token> tok = this->tokens.at(aheadPos);
    return tok->value;
  }
  return std::string("");
}
bool  TSParserSimple::startsWithLowerCase( std::string s ) {
  if ( ((int)(s.length())) == 0 ) {
    return false;
  }
  int code = s.at(0);
  if ( (code >= 97) && (code <= 122) ) {
    return true;
  }
  return false;
}
bool  TSParserSimple::looksLikeGenericCall() {
  int depth = 1;
  int offset = 1;
  int maxLookahead = 20;
  while ((depth > 0) && (offset < maxLookahead)) {
    std::string ahead = this->peekAheadValue(offset);
    if ( ahead == std::string("") ) {
      return false;
    }
    if ( ahead == std::string("<") ) {
      depth = depth + 1;
    }
    if ( ahead == std::string(">") ) {
      depth = depth - 1;
    }
    if ( (((ahead == std::string("{")) || (ahead == std::string("}"))) || (ahead == std::string(";"))) || (ahead == std::string("=>")) ) {
      return false;
    }
    offset = offset + 1;
  };
  if ( depth == 0 ) {
    std::string afterClose = this->peekAheadValue(offset);
    if ( afterClose == std::string("(") ) {
      return true;
    }
  }
  return false;
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
  };
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
  };
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
  };
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
  };
  this->expectValue(std::string("<"));
  this->expectValue(std::string("/"));
  this->expectValue(std::string(">"));
  return node;
}
EVGUnit::EVGUnit( ) {
  this->value = 0;
  this->unitType = 0;
  this->isSet = false;
  this->pixels = 0;
  value = 0;
  unitType = 0;
  isSet = false;
  pixels = 0;
}
std::shared_ptr<EVGUnit>  EVGUnit::create( double val , int uType ) {
  std::shared_ptr<EVGUnit> unit =  std::make_shared<EVGUnit>();
  unit->value = val;
  unit->unitType = uType;
  unit->isSet = true;
  return unit;
}
std::shared_ptr<EVGUnit>  EVGUnit::px( double val ) {
  return EVGUnit::create(val, 0);
}
std::shared_ptr<EVGUnit>  EVGUnit::percent( double val ) {
  return EVGUnit::create(val, 1);
}
std::shared_ptr<EVGUnit>  EVGUnit::em( double val ) {
  return EVGUnit::create(val, 2);
}
std::shared_ptr<EVGUnit>  EVGUnit::heightPercent( double val ) {
  return EVGUnit::create(val, 3);
}
std::shared_ptr<EVGUnit>  EVGUnit::fill() {
  return EVGUnit::create(100, 4);
}
std::shared_ptr<EVGUnit>  EVGUnit::unset() {
  std::shared_ptr<EVGUnit> unit =  std::make_shared<EVGUnit>();
  unit->isSet = false;
  return unit;
}
std::shared_ptr<EVGUnit>  EVGUnit::parse( std::string str ) {
  std::shared_ptr<EVGUnit> unit =  std::make_shared<EVGUnit>();
  std::string trimmed = r_cpp_trim( str);
  int __len = (int)(trimmed.length());
  if ( __len == 0 ) {
    return unit;
  }
  if ( trimmed == std::string("fill") ) {
    unit->value = 100;
    unit->unitType = 4;
    unit->isSet = true;
    return unit;
  }
  int lastChar = trimmed.at((__len - 1));
  if ( lastChar == 37 ) {
    std::string numStr = r_utf8_substr(trimmed, 0, (__len - 1) - 0);
     r_optional_primitive<double>  numVal = cpp_str_to_double(numStr);
    unit->value = /*unwrap dbl*/numVal.value;
    unit->unitType = 1;
    unit->isSet = true;
    return unit;
  }
  if ( __len >= 2 ) {
    std::string suffix = r_utf8_substr(trimmed, (__len - 2), __len - (__len - 2));
    if ( suffix == std::string("em") ) {
      std::string numStr_1 = r_utf8_substr(trimmed, 0, (__len - 2) - 0);
       r_optional_primitive<double>  numVal_1 = cpp_str_to_double(numStr_1);
      unit->value = /*unwrap dbl*/numVal_1.value;
      unit->unitType = 2;
      unit->isSet = true;
      return unit;
    }
    if ( suffix == std::string("px") ) {
      std::string numStr_2 = r_utf8_substr(trimmed, 0, (__len - 2) - 0);
       r_optional_primitive<double>  numVal_2 = cpp_str_to_double(numStr_2);
      unit->value = /*unwrap dbl*/numVal_2.value;
      unit->pixels = unit->value;
      unit->unitType = 0;
      unit->isSet = true;
      return unit;
    }
    if ( suffix == std::string("hp") ) {
      std::string numStr_3 = r_utf8_substr(trimmed, 0, (__len - 2) - 0);
       r_optional_primitive<double>  numVal_3 = cpp_str_to_double(numStr_3);
      unit->value = /*unwrap dbl*/numVal_3.value;
      unit->unitType = 3;
      unit->isSet = true;
      return unit;
    }
  }
   r_optional_primitive<double>  numVal_4 = cpp_str_to_double(trimmed);
  unit->value = /*unwrap dbl*/numVal_4.value;
  unit->pixels = unit->value;
  unit->unitType = 0;
  unit->isSet = true;
  return unit;
}
void  EVGUnit::resolve( double parentSize , double fontSize ) {
  if ( isSet == false ) {
    pixels = 0;
    return;
  }
  if ( unitType == 0 ) {
    pixels = value;
    return;
  }
  if ( unitType == 1 ) {
    pixels = (parentSize * value) / 100;
    return;
  }
  if ( unitType == 2 ) {
    pixels = fontSize * value;
    return;
  }
  if ( unitType == 3 ) {
    pixels = (parentSize * value) / 100;
    return;
  }
  if ( unitType == 4 ) {
    pixels = parentSize;
    return;
  }
  pixels = value;
}
void  EVGUnit::resolveForHeight( double parentWidth , double parentHeight , double fontSize ) {
  if ( isSet == false ) {
    pixels = 0;
    return;
  }
  if ( unitType == 3 ) {
    pixels = (parentHeight * value) / 100;
    return;
  }
  if ( unitType == 1 ) {
    pixels = (parentHeight * value) / 100;
    return;
  }
  this->resolve(parentWidth, fontSize);
}
void  EVGUnit::resolveWithHeight( double parentWidth , double parentHeight , double fontSize ) {
  if ( isSet == false ) {
    pixels = 0;
    return;
  }
  if ( unitType == 3 ) {
    pixels = (parentHeight * value) / 100;
    return;
  }
  this->resolve(parentWidth, fontSize);
}
bool  EVGUnit::isPixels() {
  return unitType == 0;
}
bool  EVGUnit::isPercent() {
  return unitType == 1;
}
bool  EVGUnit::isEm() {
  return unitType == 2;
}
bool  EVGUnit::isHeightPercent() {
  return unitType == 3;
}
bool  EVGUnit::isFill() {
  return unitType == 4;
}
std::string  EVGUnit::toString() {
  if ( isSet == false ) {
    return std::string("unset");
  }
  if ( unitType == 0 ) {
    return (std::to_string(value)) + std::string("px");
  }
  if ( unitType == 1 ) {
    return (std::to_string(value)) + std::string("%");
  }
  if ( unitType == 2 ) {
    return (std::to_string(value)) + std::string("em");
  }
  if ( unitType == 3 ) {
    return (std::to_string(value)) + std::string("hp");
  }
  if ( unitType == 4 ) {
    return std::string("fill");
  }
  return std::to_string(value);
}
EVGColor::EVGColor( ) {
  this->r = 0;
  this->g = 0;
  this->b = 0;
  this->a = 1;
  this->isSet = true;
  r = 0;
  g = 0;
  b = 0;
  a = 1;
  isSet = true;
}
std::shared_ptr<EVGColor>  EVGColor::create( double red , double green , double blue , double alpha ) {
  std::shared_ptr<EVGColor> c =  std::make_shared<EVGColor>();
  c->r = red;
  c->g = green;
  c->b = blue;
  c->a = alpha;
  c->isSet = true;
  return c;
}
std::shared_ptr<EVGColor>  EVGColor::rgb( int red , int green , int blue ) {
  return EVGColor::create(((double)(red)), ((double)(green)), ((double)(blue)), 1);
}
std::shared_ptr<EVGColor>  EVGColor::rgba( int red , int green , int blue , double alpha ) {
  return EVGColor::create(((double)(red)), ((double)(green)), ((double)(blue)), alpha);
}
std::shared_ptr<EVGColor>  EVGColor::noColor() {
  std::shared_ptr<EVGColor> c =  std::make_shared<EVGColor>();
  c->isSet = false;
  return c;
}
std::shared_ptr<EVGColor>  EVGColor::black() {
  return EVGColor::rgb(0, 0, 0);
}
std::shared_ptr<EVGColor>  EVGColor::white() {
  return EVGColor::rgb(255, 255, 255);
}
std::shared_ptr<EVGColor>  EVGColor::transparent() {
  return EVGColor::rgba(0, 0, 0, 0);
}
int  EVGColor::hexDigit( int ch ) {
  if ( (ch >= 48) && (ch <= 57) ) {
    return ch - 48;
  }
  if ( (ch >= 65) && (ch <= 70) ) {
    return (ch - 65) + 10;
  }
  if ( (ch >= 97) && (ch <= 102) ) {
    return (ch - 97) + 10;
  }
  return 0;
}
std::shared_ptr<EVGColor>  EVGColor::parseHex( std::string hex ) {
  std::shared_ptr<EVGColor> c =  std::make_shared<EVGColor>();
  int __len = (int)(hex.length());
  int start = 0;
  if ( __len > 0 ) {
    int firstChar = hex.at(0);
    if ( firstChar == 35 ) {
      start = 1;
      __len = __len - 1;
    }
  }
  if ( __len == 3 ) {
    int r1 = EVGColor::hexDigit((hex.at(start)));
    int g1 = EVGColor::hexDigit((hex.at((start + 1))));
    int b1 = EVGColor::hexDigit((hex.at((start + 2))));
    c->r = (double)(((r1 * 16) + r1));
    c->g = (double)(((g1 * 16) + g1));
    c->b = (double)(((b1 * 16) + b1));
    c->a = 1;
    c->isSet = true;
    return c;
  }
  if ( __len == 6 ) {
    int r1_1 = EVGColor::hexDigit((hex.at(start)));
    int r2 = EVGColor::hexDigit((hex.at((start + 1))));
    int g1_1 = EVGColor::hexDigit((hex.at((start + 2))));
    int g2 = EVGColor::hexDigit((hex.at((start + 3))));
    int b1_1 = EVGColor::hexDigit((hex.at((start + 4))));
    int b2 = EVGColor::hexDigit((hex.at((start + 5))));
    c->r = (double)(((r1_1 * 16) + r2));
    c->g = (double)(((g1_1 * 16) + g2));
    c->b = (double)(((b1_1 * 16) + b2));
    c->a = 1;
    c->isSet = true;
    return c;
  }
  if ( __len == 8 ) {
    int r1_2 = EVGColor::hexDigit((hex.at(start)));
    int r2_1 = EVGColor::hexDigit((hex.at((start + 1))));
    int g1_2 = EVGColor::hexDigit((hex.at((start + 2))));
    int g2_1 = EVGColor::hexDigit((hex.at((start + 3))));
    int b1_2 = EVGColor::hexDigit((hex.at((start + 4))));
    int b2_1 = EVGColor::hexDigit((hex.at((start + 5))));
    int a1 = EVGColor::hexDigit((hex.at((start + 6))));
    int a2 = EVGColor::hexDigit((hex.at((start + 7))));
    c->r = (double)(((r1_2 * 16) + r2_1));
    c->g = (double)(((g1_2 * 16) + g2_1));
    c->b = (double)(((b1_2 * 16) + b2_1));
    c->a = ((double)(((a1 * 16) + a2))) / 255;
    c->isSet = true;
    return c;
  }
  c->isSet = false;
  return c;
}
double  EVGColor::hue2rgb( double p , double q , double tt ) {
  double t = tt;
  if ( t < 0 ) {
    t = t + 1;
  }
  if ( t > 1 ) {
    t = t - 1;
  }
  if ( t < (1 / 6) ) {
    return p + (((q - p) * 6) * t);
  }
  if ( t < (1 / 2) ) {
    return q;
  }
  if ( t < (2 / 3) ) {
    return p + (((q - p) * ((2 / 3) - t)) * 6);
  }
  return p;
}
std::shared_ptr<EVGColor>  EVGColor::hslToRgb( double h , double s , double l ) {
  std::shared_ptr<EVGColor> c =  std::make_shared<EVGColor>();
  double hNorm = h / 360;
  double sNorm = s / 100;
  double lNorm = l / 100;
  if ( sNorm == 0 ) {
    double gray = lNorm * 255;
    c->r = gray;
    c->g = gray;
    c->b = gray;
  } else {
    double q = 0;
    if ( lNorm < 0.5 ) {
      q = lNorm * (1 + sNorm);
    } else {
      q = (lNorm + sNorm) - (lNorm * sNorm);
    }
    double p = (2 * lNorm) - q;
    c->r = EVGColor::hue2rgb(p, q, (hNorm + (1 / 3))) * 255;
    c->g = EVGColor::hue2rgb(p, q, hNorm) * 255;
    c->b = EVGColor::hue2rgb(p, q, (hNorm - (1 / 3))) * 255;
  }
  c->a = 1;
  c->isSet = true;
  return c;
}
double  EVGColor::parseNumber( std::string str ) {
   r_optional_primitive<double>  val = cpp_str_to_double((r_cpp_trim( str)));
  return /*unwrap dbl*/val.value;
}
std::shared_ptr<EVGColor>  EVGColor::parse( std::string str ) {
  std::string trimmed = r_cpp_trim( str);
  int __len = (int)(trimmed.length());
  if ( __len == 0 ) {
    return EVGColor::noColor();
  }
  int firstChar = trimmed.at(0);
  if ( firstChar == 35 ) {
    return EVGColor::parseHex(trimmed);
  }
  if ( __len >= 4 ) {
    std::string prefix = r_utf8_substr(trimmed, 0, 4 - 0);
    if ( prefix == std::string("rgba") ) {
      return EVGColor::parseRgba(trimmed);
    }
    std::string prefix3 = r_utf8_substr(trimmed, 0, 3 - 0);
    if ( prefix3 == std::string("rgb") ) {
      return EVGColor::parseRgb(trimmed);
    }
    if ( prefix3 == std::string("hsl") ) {
      return EVGColor::parseHsl(trimmed);
    }
  }
  return EVGColor::parseNamed(trimmed);
}
std::shared_ptr<EVGColor>  EVGColor::parseRgb( std::string str ) {
  std::shared_ptr<EVGColor> c =  std::make_shared<EVGColor>();
  int __len = (int)(str.length());
  int start = 0;
  int i = 0;
  while (i < __len) {
    int ch = str.at(i);
    if ( ch == 40 ) {
      start = i + 1;
    }
    i = i + 1;
  };
  int end = __len - 1;
  i = __len - 1;
  while (i >= 0) {
    int ch_1 = str.at(i);
    if ( ch_1 == 41 ) {
      end = i;
    }
    i = i - 1;
  };
  std::string content = r_utf8_substr(str, start, end - start);
  std::vector<std::string> parts;
  std::string current = std::string("");
  i = 0;
  int contentLen = (int)(content.length());
  while (i < contentLen) {
    int ch_2 = content.at(i);
    if ( (ch_2 == 44) || (ch_2 == 32) ) {
      std::string trimPart = r_cpp_trim( current);
      if ( ((int)(trimPart.length())) > 0 ) {
        parts.push_back( trimPart  );
      }
      current = std::string("");
    } else {
      current = current + (std::string(1, char(ch_2)));
    }
    i = i + 1;
  };
  std::string trimPart_1 = r_cpp_trim( current);
  if ( ((int)(trimPart_1.length())) > 0 ) {
    parts.push_back( trimPart_1  );
  }
  if ( ((int)(parts.size())) >= 3 ) {
    c->r = EVGColor::parseNumber((parts.at(0)));
    c->g = EVGColor::parseNumber((parts.at(1)));
    c->b = EVGColor::parseNumber((parts.at(2)));
    c->a = 1;
    c->isSet = true;
  }
  return c;
}
std::shared_ptr<EVGColor>  EVGColor::parseRgba( std::string str ) {
  std::shared_ptr<EVGColor> c = EVGColor::parseRgb(str);
  int __len = (int)(str.length());
  int start = 0;
  int end = __len - 1;
  int i = 0;
  while (i < __len) {
    int ch = str.at(i);
    if ( ch == 40 ) {
      start = i + 1;
    }
    if ( ch == 41 ) {
      end = i;
    }
    i = i + 1;
  };
  std::string content = r_utf8_substr(str, start, end - start);
  std::vector<std::string> parts;
  std::string current = std::string("");
  i = 0;
  int contentLen = (int)(content.length());
  while (i < contentLen) {
    int ch_1 = content.at(i);
    if ( (ch_1 == 44) || (ch_1 == 32) ) {
      std::string trimPart = r_cpp_trim( current);
      if ( ((int)(trimPart.length())) > 0 ) {
        parts.push_back( trimPart  );
      }
      current = std::string("");
    } else {
      current = current + (std::string(1, char(ch_1)));
    }
    i = i + 1;
  };
  std::string trimPart_1 = r_cpp_trim( current);
  if ( ((int)(trimPart_1.length())) > 0 ) {
    parts.push_back( trimPart_1  );
  }
  if ( ((int)(parts.size())) >= 4 ) {
    c->r = EVGColor::parseNumber((parts.at(0)));
    c->g = EVGColor::parseNumber((parts.at(1)));
    c->b = EVGColor::parseNumber((parts.at(2)));
    c->a = EVGColor::parseNumber((parts.at(3)));
    c->isSet = true;
  }
  return c;
}
std::shared_ptr<EVGColor>  EVGColor::parseHsl( std::string str ) {
  int __len = (int)(str.length());
  int start = 0;
  int end = __len - 1;
  int i = 0;
  while (i < __len) {
    int ch = str.at(i);
    if ( ch == 40 ) {
      start = i + 1;
    }
    if ( ch == 41 ) {
      end = i;
    }
    i = i + 1;
  };
  std::string content = r_utf8_substr(str, start, end - start);
  std::vector<std::string> parts;
  std::string current = std::string("");
  i = 0;
  int contentLen = (int)(content.length());
  while (i < contentLen) {
    int ch_1 = content.at(i);
    if ( (ch_1 == 44) || (ch_1 == 32) ) {
      std::string trimPart = r_cpp_trim( current);
      if ( ((int)(trimPart.length())) > 0 ) {
        parts.push_back( trimPart  );
      }
      current = std::string("");
    } else {
      current = current + (std::string(1, char(ch_1)));
    }
    i = i + 1;
  };
  std::string trimPart_1 = r_cpp_trim( current);
  if ( ((int)(trimPart_1.length())) > 0 ) {
    parts.push_back( trimPart_1  );
  }
  if ( ((int)(parts.size())) >= 3 ) {
    double h = EVGColor::parseNumber((parts.at(0)));
    double s = EVGColor::parseNumber((parts.at(1)));
    double l = EVGColor::parseNumber((parts.at(2)));
    std::shared_ptr<EVGColor> c = EVGColor::hslToRgb(h, s, l);
    if ( ((int)(parts.size())) >= 4 ) {
      c->a = EVGColor::parseNumber((parts.at(3)));
    }
    return c;
  }
  return EVGColor::noColor();
}
std::shared_ptr<EVGColor>  EVGColor::parseNamed( std::string name ) {
  std::string lower = std::string("");
  int __len = (int)(name.length());
  int i = 0;
  while (i < __len) {
    int ch = name.at(i);
    if ( (ch >= 65) && (ch <= 90) ) {
      lower = lower + (std::string(1, char((ch + 32))));
    } else {
      lower = lower + (std::string(1, char(ch)));
    }
    i = i + 1;
  };
  if ( lower == std::string("black") ) {
    return EVGColor::rgb(0, 0, 0);
  }
  if ( lower == std::string("white") ) {
    return EVGColor::rgb(255, 255, 255);
  }
  if ( lower == std::string("red") ) {
    return EVGColor::rgb(255, 0, 0);
  }
  if ( lower == std::string("green") ) {
    return EVGColor::rgb(0, 128, 0);
  }
  if ( lower == std::string("blue") ) {
    return EVGColor::rgb(0, 0, 255);
  }
  if ( lower == std::string("yellow") ) {
    return EVGColor::rgb(255, 255, 0);
  }
  if ( lower == std::string("cyan") ) {
    return EVGColor::rgb(0, 255, 255);
  }
  if ( lower == std::string("magenta") ) {
    return EVGColor::rgb(255, 0, 255);
  }
  if ( lower == std::string("gray") ) {
    return EVGColor::rgb(128, 128, 128);
  }
  if ( lower == std::string("grey") ) {
    return EVGColor::rgb(128, 128, 128);
  }
  if ( lower == std::string("orange") ) {
    return EVGColor::rgb(255, 165, 0);
  }
  if ( lower == std::string("purple") ) {
    return EVGColor::rgb(128, 0, 128);
  }
  if ( lower == std::string("pink") ) {
    return EVGColor::rgb(255, 192, 203);
  }
  if ( lower == std::string("brown") ) {
    return EVGColor::rgb(165, 42, 42);
  }
  if ( lower == std::string("transparent") ) {
    return EVGColor::transparent();
  }
  if ( lower == std::string("none") ) {
    return EVGColor::noColor();
  }
  return EVGColor::noColor();
}
int  EVGColor::red() {
  if ( r > 255 ) {
    return 255;
  }
  if ( r < 0 ) {
    return 0;
  }
  return (int)floor( r);
}
int  EVGColor::green() {
  if ( g > 255 ) {
    return 255;
  }
  if ( g < 0 ) {
    return 0;
  }
  return (int)floor( g);
}
int  EVGColor::blue() {
  if ( b > 255 ) {
    return 255;
  }
  if ( b < 0 ) {
    return 0;
  }
  return (int)floor( b);
}
double  EVGColor::alpha() {
  if ( a < 0 ) {
    return 0;
  }
  if ( a > 1 ) {
    return 1;
  }
  return a;
}
std::string  EVGColor::toCSSString() {
  if ( isSet == false ) {
    return std::string("none");
  }
  if ( a < 1 ) {
    return (((((((std::string("rgba(") + (std::to_string(this->red()))) + std::string(",")) + (std::to_string(this->green()))) + std::string(",")) + (std::to_string(this->blue()))) + std::string(",")) + (std::to_string(this->alpha()))) + std::string(")");
  }
  return (((((std::string("rgb(") + (std::to_string(this->red()))) + std::string(",")) + (std::to_string(this->green()))) + std::string(",")) + (std::to_string(this->blue()))) + std::string(")");
}
std::string  EVGColor::toHexString() {
  if ( isSet == false ) {
    return std::string("none");
  }
  std::string hexChars = std::string("0123456789ABCDEF");
  int rH = this->red();
  int gH = this->green();
  int bH = this->blue();
  double r1D = ((double)(rH)) / 16;
  int r1 = (int)floor( r1D);
  int r2 = rH % 16;
  double g1D = ((double)(gH)) / 16;
  int g1 = (int)floor( g1D);
  int g2 = gH % 16;
  double b1D = ((double)(bH)) / 16;
  int b1 = (int)floor( b1D);
  int b2 = bH % 16;
  return (((((std::string("#") + (std::string(1, char((hexChars.at(r1)))))) + (std::string(1, char((hexChars.at(r2)))))) + (std::string(1, char((hexChars.at(g1)))))) + (std::string(1, char((hexChars.at(g2)))))) + (std::string(1, char((hexChars.at(b1)))))) + (std::string(1, char((hexChars.at(b2)))));
}
std::string  EVGColor::toPDFColorString() {
  if ( isSet == false ) {
    return std::string("");
  }
  double rN = r / 255;
  double gN = g / 255;
  double bN = b / 255;
  return ((((std::to_string(rN)) + std::string(" ")) + (std::to_string(gN))) + std::string(" ")) + (std::to_string(bN));
}
std::shared_ptr<EVGColor>  EVGColor::withAlpha( double newAlpha ) {
  return EVGColor::create(r, g, b, newAlpha);
}
std::shared_ptr<EVGColor>  EVGColor::lighten( double amount ) {
  double newR = r + ((255 - r) * amount);
  double newG = g + ((255 - g) * amount);
  double newB = b + ((255 - b) * amount);
  return EVGColor::create(newR, newG, newB, a);
}
std::shared_ptr<EVGColor>  EVGColor::darken( double amount ) {
  double newR = r * (1 - amount);
  double newG = g * (1 - amount);
  double newB = b * (1 - amount);
  return EVGColor::create(newR, newG, newB, a);
}
EVGBox::EVGBox( ) {
  this->marginTopPx = 0;
  this->marginRightPx = 0;
  this->marginBottomPx = 0;
  this->marginLeftPx = 0;
  this->paddingTopPx = 0;
  this->paddingRightPx = 0;
  this->paddingBottomPx = 0;
  this->paddingLeftPx = 0;
  this->borderWidthPx = 0;
  this->borderRadiusPx = 0;
  marginTop  = EVGUnit::unset();
  marginRight  = EVGUnit::unset();
  marginBottom  = EVGUnit::unset();
  marginLeft  = EVGUnit::unset();
  paddingTop  = EVGUnit::unset();
  paddingRight  = EVGUnit::unset();
  paddingBottom  = EVGUnit::unset();
  paddingLeft  = EVGUnit::unset();
  borderWidth  = EVGUnit::unset();
  borderColor  = EVGColor::noColor();
  borderRadius  = EVGUnit::unset();
}
void  EVGBox::setMargin( std::shared_ptr<EVGUnit> all ) {
  marginTop  = all;
  marginRight  = all;
  marginBottom  = all;
  marginLeft  = all;
}
void  EVGBox::setMarginValues( std::shared_ptr<EVGUnit> top , std::shared_ptr<EVGUnit> right , std::shared_ptr<EVGUnit> bottom , std::shared_ptr<EVGUnit> left ) {
  marginTop  = top;
  marginRight  = right;
  marginBottom  = bottom;
  marginLeft  = left;
}
void  EVGBox::setPadding( std::shared_ptr<EVGUnit> all ) {
  paddingTop  = all;
  paddingRight  = all;
  paddingBottom  = all;
  paddingLeft  = all;
}
void  EVGBox::setPaddingValues( std::shared_ptr<EVGUnit> top , std::shared_ptr<EVGUnit> right , std::shared_ptr<EVGUnit> bottom , std::shared_ptr<EVGUnit> left ) {
  paddingTop  = top;
  paddingRight  = right;
  paddingBottom  = bottom;
  paddingLeft  = left;
}
void  EVGBox::resolveUnits( double parentWidth , double parentHeight , double fontSize ) {
  marginTop->resolve(parentHeight, fontSize);
  marginTopPx = marginTop->pixels;
  marginRight->resolve(parentWidth, fontSize);
  marginRightPx = marginRight->pixels;
  marginBottom->resolve(parentHeight, fontSize);
  marginBottomPx = marginBottom->pixels;
  marginLeft->resolve(parentWidth, fontSize);
  marginLeftPx = marginLeft->pixels;
  paddingTop->resolve(parentHeight, fontSize);
  paddingTopPx = paddingTop->pixels;
  paddingRight->resolve(parentWidth, fontSize);
  paddingRightPx = paddingRight->pixels;
  paddingBottom->resolve(parentHeight, fontSize);
  paddingBottomPx = paddingBottom->pixels;
  paddingLeft->resolve(parentWidth, fontSize);
  paddingLeftPx = paddingLeft->pixels;
  borderWidth->resolve(parentWidth, fontSize);
  borderWidthPx = borderWidth->pixels;
  double smallerDim = parentWidth;
  if ( parentHeight < parentWidth ) {
    smallerDim = parentHeight;
  }
  borderRadius->resolve(smallerDim, fontSize);
  borderRadiusPx = borderRadius->pixels;
}
double  EVGBox::getInnerWidth( double outerWidth ) {
  return ((outerWidth - paddingLeftPx) - paddingRightPx) - (borderWidthPx * 2);
}
double  EVGBox::getInnerHeight( double outerHeight ) {
  return ((outerHeight - paddingTopPx) - paddingBottomPx) - (borderWidthPx * 2);
}
double  EVGBox::getTotalWidth( double contentWidth ) {
  return ((((contentWidth + marginLeftPx) + marginRightPx) + paddingLeftPx) + paddingRightPx) + (borderWidthPx * 2);
}
double  EVGBox::getTotalHeight( double contentHeight ) {
  return ((((contentHeight + marginTopPx) + marginBottomPx) + paddingTopPx) + paddingBottomPx) + (borderWidthPx * 2);
}
double  EVGBox::getContentX( double elementX ) {
  return ((elementX + marginLeftPx) + borderWidthPx) + paddingLeftPx;
}
double  EVGBox::getContentY( double elementY ) {
  return ((elementY + marginTopPx) + borderWidthPx) + paddingTopPx;
}
double  EVGBox::getHorizontalSpace() {
  return (((marginLeftPx + marginRightPx) + paddingLeftPx) + paddingRightPx) + (borderWidthPx * 2);
}
double  EVGBox::getVerticalSpace() {
  return (((marginTopPx + marginBottomPx) + paddingTopPx) + paddingBottomPx) + (borderWidthPx * 2);
}
double  EVGBox::getMarginHorizontal() {
  return marginLeftPx + marginRightPx;
}
double  EVGBox::getMarginVertical() {
  return marginTopPx + marginBottomPx;
}
double  EVGBox::getPaddingHorizontal() {
  return paddingLeftPx + paddingRightPx;
}
double  EVGBox::getPaddingVertical() {
  return paddingTopPx + paddingBottomPx;
}
std::string  EVGBox::toString() {
  return (((((((((((((((((std::string("Box[margin:") + (std::to_string(marginTopPx))) + std::string("/")) + (std::to_string(marginRightPx))) + std::string("/")) + (std::to_string(marginBottomPx))) + std::string("/")) + (std::to_string(marginLeftPx))) + std::string(" padding:")) + (std::to_string(paddingTopPx))) + std::string("/")) + (std::to_string(paddingRightPx))) + std::string("/")) + (std::to_string(paddingBottomPx))) + std::string("/")) + (std::to_string(paddingLeftPx))) + std::string(" border:")) + (std::to_string(borderWidthPx))) + std::string("]");
}
EVGElement::EVGElement( ) {
  this->id = std::string("");
  this->tagName = std::string("div");
  this->elementType = 0;
  this->opacity = 1;
  this->direction = std::string("row");
  this->align = std::string("left");
  this->verticalAlign = std::string("top");
  this->isInline = false;
  this->lineBreak = false;
  this->overflow = std::string("visible");
  this->fontFamily = std::string("Helvetica");
  this->fontWeight = std::string("normal");
  this->lineHeight = 1.2;
  this->textAlign = std::string("left");
  this->textContent = std::string("");
  this->display = std::string("block");
  this->flex = 0;
  this->flexDirection = std::string("column");
  this->justifyContent = std::string("flex-start");
  this->alignItems = std::string("flex-start");
  this->position = std::string("relative");
  this->src = std::string("");
  this->alt = std::string("");
  this->svgPath = std::string("");
  this->viewBox = std::string("");
  this->strokeWidth = 0;
  this->clipPath = std::string("");
  this->className = std::string("");
  this->imageQuality = 0;
  this->maxImageSize = 0;
  this->rotate = 0;
  this->scale = 1;
  this->calculatedX = 0;
  this->calculatedY = 0;
  this->calculatedWidth = 0;
  this->calculatedHeight = 0;
  this->calculatedInnerWidth = 0;
  this->calculatedInnerHeight = 0;
  this->calculatedFlexWidth = 0;
  this->calculatedPage = 0;
  this->isAbsolute = false;
  this->isLayoutComplete = false;
  this->unitsResolved = false;
  this->inheritedFontSize = 14;
  tagName = std::string("div");
  elementType = 0;
  width  = EVGUnit::unset();
  height  = EVGUnit::unset();
  minWidth  = EVGUnit::unset();
  minHeight  = EVGUnit::unset();
  maxWidth  = EVGUnit::unset();
  maxHeight  = EVGUnit::unset();
  left  = EVGUnit::unset();
  top  = EVGUnit::unset();
  right  = EVGUnit::unset();
  bottom  = EVGUnit::unset();
  x  = EVGUnit::unset();
  y  = EVGUnit::unset();
  std::shared_ptr<EVGBox> newBox =  std::make_shared<EVGBox>();
  box  = newBox;
  backgroundColor  = EVGColor::noColor();
  color  = EVGColor::black();
  fontSize  = EVGUnit::px(14);
  shadowRadius  = EVGUnit::unset();
  shadowColor  = EVGColor::noColor();
  shadowOffsetX  = EVGUnit::unset();
  shadowOffsetY  = EVGUnit::unset();
  fillColor  = EVGColor::noColor();
  strokeColor  = EVGColor::noColor();
}
std::shared_ptr<EVGElement>  EVGElement::createDiv() {
  std::shared_ptr<EVGElement> el =  std::make_shared<EVGElement>();
  el->tagName = std::string("div");
  el->elementType = 0;
  return el;
}
std::shared_ptr<EVGElement>  EVGElement::createSpan() {
  std::shared_ptr<EVGElement> el =  std::make_shared<EVGElement>();
  el->tagName = std::string("span");
  el->elementType = 1;
  return el;
}
std::shared_ptr<EVGElement>  EVGElement::createImg() {
  std::shared_ptr<EVGElement> el =  std::make_shared<EVGElement>();
  el->tagName = std::string("img");
  el->elementType = 2;
  return el;
}
std::shared_ptr<EVGElement>  EVGElement::createPath() {
  std::shared_ptr<EVGElement> el =  std::make_shared<EVGElement>();
  el->tagName = std::string("path");
  el->elementType = 3;
  return el;
}
void  EVGElement::addChild( std::shared_ptr<EVGElement> child ) {
  child->parent  = shared_from_this();
  children.push_back( child  );
}
void  EVGElement::resetLayoutState() {
  unitsResolved = false;
  calculatedX = 0;
  calculatedY = 0;
  calculatedWidth = 0;
  calculatedHeight = 0;
  int i = 0;
  while (i < ((int)(children.size()))) {
    std::shared_ptr<EVGElement> child = children.at(i);
    child->resetLayoutState();
    i = i + 1;
  };
}
int  EVGElement::getChildCount() {
  return (int)(children.size());
}
std::shared_ptr<EVGElement>  EVGElement::getChild( int index ) {
  return children.at(index);
}
bool  EVGElement::hasParent() {
  if ( parent != NULL ) {
    return true;
  }
  return false;
}
bool  EVGElement::isContainer() {
  return elementType == 0;
}
bool  EVGElement::isText() {
  return elementType == 1;
}
bool  EVGElement::isImage() {
  return elementType == 2;
}
bool  EVGElement::isPath() {
  return elementType == 3;
}
bool  EVGElement::hasAbsolutePosition() {
  if ( left->isSet ) {
    return true;
  }
  if ( top->isSet ) {
    return true;
  }
  if ( right->isSet ) {
    return true;
  }
  if ( bottom->isSet ) {
    return true;
  }
  if ( x->isSet ) {
    return true;
  }
  if ( y->isSet ) {
    return true;
  }
  return false;
}
void  EVGElement::inheritProperties( std::shared_ptr<EVGElement> parentEl ) {
  if ( fontFamily == std::string("Helvetica") ) {
    fontFamily = parentEl->fontFamily;
  }
  if ( color->isSet == false ) {
    color  = parentEl->color;
  }
  inheritedFontSize = parentEl->inheritedFontSize;
  if ( fontSize->isSet ) {
    fontSize->resolve(inheritedFontSize, inheritedFontSize);
    inheritedFontSize = fontSize->pixels;
  }
}
void  EVGElement::resolveUnits( double parentWidth , double parentHeight ) {
  if ( unitsResolved ) {
    return;
  }
  unitsResolved = true;
  double fs = inheritedFontSize;
  width->resolveWithHeight(parentWidth, parentHeight, fs);
  height->resolveForHeight(parentWidth, parentHeight, fs);
  minWidth->resolve(parentWidth, fs);
  minHeight->resolve(parentHeight, fs);
  maxWidth->resolve(parentWidth, fs);
  maxHeight->resolve(parentHeight, fs);
  left->resolve(parentWidth, fs);
  top->resolve(parentHeight, fs);
  right->resolve(parentWidth, fs);
  bottom->resolve(parentHeight, fs);
  x->resolve(parentWidth, fs);
  y->resolve(parentHeight, fs);
  box->resolveUnits(parentWidth, parentHeight, fs);
  shadowRadius->resolve(parentWidth, fs);
  shadowOffsetX->resolve(parentWidth, fs);
  shadowOffsetY->resolve(parentHeight, fs);
  isAbsolute = this->hasAbsolutePosition();
}
void  EVGElement::setAttribute( std::string name , std::string value ) {
  if ( name == std::string("id") ) {
    id = value;
    return;
  }
  if ( name == std::string("width") ) {
    width  = EVGUnit::parse(value);
    return;
  }
  if ( name == std::string("height") ) {
    height  = EVGUnit::parse(value);
    return;
  }
  if ( (name == std::string("min-width")) || (name == std::string("minWidth")) ) {
    minWidth  = EVGUnit::parse(value);
    return;
  }
  if ( (name == std::string("min-height")) || (name == std::string("minHeight")) ) {
    minHeight  = EVGUnit::parse(value);
    return;
  }
  if ( (name == std::string("max-width")) || (name == std::string("maxWidth")) ) {
    maxWidth  = EVGUnit::parse(value);
    return;
  }
  if ( (name == std::string("max-height")) || (name == std::string("maxHeight")) ) {
    maxHeight  = EVGUnit::parse(value);
    return;
  }
  if ( name == std::string("left") ) {
    left  = EVGUnit::parse(value);
    return;
  }
  if ( name == std::string("top") ) {
    top  = EVGUnit::parse(value);
    return;
  }
  if ( name == std::string("right") ) {
    right  = EVGUnit::parse(value);
    return;
  }
  if ( name == std::string("bottom") ) {
    bottom  = EVGUnit::parse(value);
    return;
  }
  if ( name == std::string("x") ) {
    x  = EVGUnit::parse(value);
    return;
  }
  if ( name == std::string("y") ) {
    y  = EVGUnit::parse(value);
    return;
  }
  if ( name == std::string("margin") ) {
    box->setMargin(EVGUnit::parse(value));
    return;
  }
  if ( (name == std::string("margin-left")) || (name == std::string("marginLeft")) ) {
    box->marginLeft  = EVGUnit::parse(value);
    return;
  }
  if ( (name == std::string("margin-right")) || (name == std::string("marginRight")) ) {
    box->marginRight  = EVGUnit::parse(value);
    return;
  }
  if ( (name == std::string("margin-top")) || (name == std::string("marginTop")) ) {
    box->marginTop  = EVGUnit::parse(value);
    return;
  }
  if ( (name == std::string("margin-bottom")) || (name == std::string("marginBottom")) ) {
    box->marginBottom  = EVGUnit::parse(value);
    return;
  }
  if ( name == std::string("padding") ) {
    box->setPadding(EVGUnit::parse(value));
    return;
  }
  if ( (name == std::string("padding-left")) || (name == std::string("paddingLeft")) ) {
    box->paddingLeft  = EVGUnit::parse(value);
    return;
  }
  if ( (name == std::string("padding-right")) || (name == std::string("paddingRight")) ) {
    box->paddingRight  = EVGUnit::parse(value);
    return;
  }
  if ( (name == std::string("padding-top")) || (name == std::string("paddingTop")) ) {
    box->paddingTop  = EVGUnit::parse(value);
    return;
  }
  if ( (name == std::string("padding-bottom")) || (name == std::string("paddingBottom")) ) {
    box->paddingBottom  = EVGUnit::parse(value);
    return;
  }
  if ( (name == std::string("border-width")) || (name == std::string("borderWidth")) ) {
    box->borderWidth  = EVGUnit::parse(value);
    return;
  }
  if ( (name == std::string("border-color")) || (name == std::string("borderColor")) ) {
    box->borderColor  = EVGColor::parse(value);
    return;
  }
  if ( (name == std::string("border-radius")) || (name == std::string("borderRadius")) ) {
    box->borderRadius  = EVGUnit::parse(value);
    return;
  }
  if ( (name == std::string("background-color")) || (name == std::string("backgroundColor")) ) {
    backgroundColor  = EVGColor::parse(value);
    return;
  }
  if ( name == std::string("color") ) {
    color  = EVGColor::parse(value);
    return;
  }
  if ( name == std::string("opacity") ) {
     r_optional_primitive<double>  val = cpp_str_to_double(value);
    opacity = /*unwrap dbl*/val.value;
    return;
  }
  if ( name == std::string("direction") ) {
    direction = value;
    return;
  }
  if ( name == std::string("align") ) {
    align = value;
    return;
  }
  if ( (name == std::string("vertical-align")) || (name == std::string("verticalAlign")) ) {
    verticalAlign = value;
    return;
  }
  if ( name == std::string("inline") ) {
    isInline = value == std::string("true");
    return;
  }
  if ( (name == std::string("line-break")) || (name == std::string("lineBreak")) ) {
    lineBreak = value == std::string("true");
    return;
  }
  if ( name == std::string("overflow") ) {
    overflow = value;
    return;
  }
  if ( (name == std::string("flex-direction")) || (name == std::string("flexDirection")) ) {
    flexDirection = value;
    return;
  }
  if ( name == std::string("flex") ) {
     r_optional_primitive<double>  val_1 = cpp_str_to_double(value);
    if ( val_1.has_value ) {
      flex = /*unwrap dbl*/val_1.value;
    }
    return;
  }
  if ( name == std::string("gap") ) {
    gap  = EVGUnit::parse(value);
    return;
  }
  if ( (name == std::string("justify-content")) || (name == std::string("justifyContent")) ) {
    justifyContent = value;
    return;
  }
  if ( (name == std::string("align-items")) || (name == std::string("alignItems")) ) {
    alignItems = value;
    return;
  }
  if ( (name == std::string("font-size")) || (name == std::string("fontSize")) ) {
    fontSize  = EVGUnit::parse(value);
    return;
  }
  if ( (name == std::string("font-family")) || (name == std::string("fontFamily")) ) {
    fontFamily = value;
    return;
  }
  if ( (name == std::string("font-weight")) || (name == std::string("fontWeight")) ) {
    fontWeight = value;
    return;
  }
  if ( (name == std::string("text-align")) || (name == std::string("textAlign")) ) {
    textAlign = value;
    return;
  }
  if ( (name == std::string("line-height")) || (name == std::string("lineHeight")) ) {
     r_optional_primitive<double>  val_2 = cpp_str_to_double(value);
    if ( val_2.has_value ) {
      lineHeight = /*unwrap dbl*/val_2.value;
    }
    return;
  }
  if ( name == std::string("rotate") ) {
     r_optional_primitive<double>  val_3 = cpp_str_to_double(value);
    rotate = /*unwrap dbl*/val_3.value;
    return;
  }
  if ( name == std::string("scale") ) {
     r_optional_primitive<double>  val_4 = cpp_str_to_double(value);
    scale = /*unwrap dbl*/val_4.value;
    return;
  }
  if ( (name == std::string("shadow-radius")) || (name == std::string("shadowRadius")) ) {
    shadowRadius  = EVGUnit::parse(value);
    return;
  }
  if ( (name == std::string("shadow-color")) || (name == std::string("shadowColor")) ) {
    shadowColor  = EVGColor::parse(value);
    return;
  }
  if ( (name == std::string("shadow-offset-x")) || (name == std::string("shadowOffsetX")) ) {
    shadowOffsetX  = EVGUnit::parse(value);
    return;
  }
  if ( (name == std::string("shadow-offset-y")) || (name == std::string("shadowOffsetY")) ) {
    shadowOffsetY  = EVGUnit::parse(value);
    return;
  }
  if ( (name == std::string("clip-path")) || (name == std::string("clipPath")) ) {
    clipPath = value;
    return;
  }
  if ( name == std::string("imageQuality") ) {
     r_optional_primitive<int>  val_5 = cpp_str_to_int(value);
    if ( val_5.has_value ) {
      imageQuality = /*unwrap int*/val_5.value;
    }
    return;
  }
  if ( name == std::string("maxImageSize") ) {
     r_optional_primitive<int>  val_6 = cpp_str_to_int(value);
    if ( val_6.has_value ) {
      maxImageSize = /*unwrap int*/val_6.value;
    }
    return;
  }
  if ( (name == std::string("d")) || (name == std::string("svgPath")) ) {
    svgPath = value;
    return;
  }
  if ( name == std::string("viewBox") ) {
    viewBox = value;
    return;
  }
  if ( name == std::string("fill") ) {
    fillColor  = EVGColor::parse(value);
    return;
  }
  if ( name == std::string("stroke") ) {
    strokeColor  = EVGColor::parse(value);
    return;
  }
  if ( (name == std::string("stroke-width")) || (name == std::string("strokeWidth")) ) {
     r_optional_primitive<double>  val_7 = cpp_str_to_double(value);
    if ( val_7.has_value ) {
      strokeWidth = /*unwrap dbl*/val_7.value;
    }
    return;
  }
}
std::string  EVGElement::getCalculatedBounds() {
  return ((((((std::string("(") + (std::to_string(calculatedX))) + std::string(", ")) + (std::to_string(calculatedY))) + std::string(") ")) + (std::to_string(calculatedWidth))) + std::string("x")) + (std::to_string(calculatedHeight));
}
std::string  EVGElement::toString() {
  return (((((std::string("<") + tagName) + std::string(" id=\"")) + id) + std::string("\" ")) + this->getCalculatedBounds()) + std::string(">");
}
BufferChunk::BufferChunk( int size  ) {
  this->data = 
  std::vector<uint8_t>(0, 0);
  ;
  this->used = 0;
  this->capacity = 0;
  data = std::vector<uint8_t>(size, 0);
  capacity = size;
  used = 0;
}
int  BufferChunk::remaining() {
  return capacity - used;
}
bool  BufferChunk::isFull() {
  return used >= capacity;
}
GrowableBuffer::GrowableBuffer( ) {
  this->firstChunk =  std::make_shared<BufferChunk>(4096);
  this->currentChunk =  std::make_shared<BufferChunk>(4096);
  this->chunkSize = 4096;
  this->totalSize = 0;
  std::shared_ptr<BufferChunk> chunk =  std::make_shared<BufferChunk>(chunkSize);
  firstChunk = chunk;
  currentChunk = chunk;
}
void  GrowableBuffer::setChunkSize( int size ) {
  chunkSize = size;
}
void  GrowableBuffer::allocateNewChunk() {
  std::shared_ptr<BufferChunk> newChunk =  std::make_shared<BufferChunk>(chunkSize);
  currentChunk->next  = newChunk;
  currentChunk = newChunk;
}
void  GrowableBuffer::writeByte( int b ) {
  if ( currentChunk->isFull() ) {
    this->allocateNewChunk();
  }
  int pos = currentChunk->used;
  currentChunk->data[pos] = static_cast<uint8_t>(b);
  currentChunk->used = pos + 1;
  totalSize = totalSize + 1;
}
void  GrowableBuffer::writeBytes( std::vector<uint8_t> src , int srcOffset , int length ) {
  int i = 0;
  while (i < length) {
    int b = static_cast<int64_t>(src[(srcOffset + i)]);
    this->writeByte(b);
    i = i + 1;
  };
}
void  GrowableBuffer::writeBuffer( std::vector<uint8_t> src ) {
  int __len = static_cast<int64_t>(src.size());
  this->writeBytes(src, 0, __len);
}
void  GrowableBuffer::writeString( std::string s ) {
  int __len = (int)(s.length());
  int i = 0;
  while (i < __len) {
    int ch = s.at(i);
    this->writeByte(ch);
    i = i + 1;
  };
}
void  GrowableBuffer::writeInt16BE( int value ) {
  double highD = value / 256;
  int high = (int)floor( highD);
  int low = value - (high * 256);
  this->writeByte(high);
  this->writeByte(low);
}
void  GrowableBuffer::writeInt32BE( int value ) {
  double b1D = value / 16777216;
  int b1 = (int)floor( b1D);
  int rem1 = value - (b1 * 16777216);
  double b2D = rem1 / 65536;
  int b2 = (int)floor( b2D);
  int rem2 = rem1 - (b2 * 65536);
  double b3D = rem2 / 256;
  int b3 = (int)floor( b3D);
  int b4 = rem2 - (b3 * 256);
  this->writeByte(b1);
  this->writeByte(b2);
  this->writeByte(b3);
  this->writeByte(b4);
}
int  GrowableBuffer::size() {
  return totalSize;
}
std::vector<uint8_t>  GrowableBuffer::toBuffer() {
  int allocSize = totalSize;
  std::vector<uint8_t> result = std::vector<uint8_t>(allocSize, 0);
  int pos = 0;
  std::shared_ptr<BufferChunk> chunk = firstChunk;
  bool done = false;
  while (done == false) {
    int chunkUsed = chunk->used;
    int i = 0;
    while (i < chunkUsed) {
      int b = static_cast<int64_t>(chunk->data[i]);
      result[pos] = static_cast<uint8_t>(b);
      pos = pos + 1;
      i = i + 1;
    };
    if ( chunk->next == NULL ) {
      done = true;
    } else {
      chunk = chunk->next;
    }
  };
  return result;
}
std::string  GrowableBuffer::toString() {
  std::string result = std::string("");
  std::shared_ptr<BufferChunk> chunk = firstChunk;
  bool done = false;
  while (done == false) {
    int chunkUsed = chunk->used;
    int i = 0;
    while (i < chunkUsed) {
      int b = static_cast<int64_t>(chunk->data[i]);
      result = result + (std::string(1, char(b)));
      i = i + 1;
    };
    if ( chunk->next == NULL ) {
      done = true;
    } else {
      chunk = chunk->next;
    }
  };
  return result;
}
void  GrowableBuffer::clear() {
  std::shared_ptr<BufferChunk> chunk =  std::make_shared<BufferChunk>(chunkSize);
  firstChunk = chunk;
  currentChunk = chunk;
  totalSize = 0;
}
JPEGImage::JPEGImage( ) {
  this->width = 0;
  this->height = 0;
  this->colorComponents = 3;
  this->bitsPerComponent = 8;
  this->isValid = false;
  this->errorMessage = std::string("");
}
JPEGReader::JPEGReader( ) {
}
int  JPEGReader::readUint16BE( std::vector<uint8_t> data , int offset ) {
  int high = static_cast<int64_t>(data[offset]);
  int low = static_cast<int64_t>(data[(offset + 1)]);
  return (high * 256) + low;
}
std::shared_ptr<JPEGImage>  JPEGReader::readJPEG( std::string dirPath , std::string fileName ) {
  std::shared_ptr<JPEGImage> result =  std::make_shared<JPEGImage>();
  std::vector<uint8_t> data = r_buffer_read_file(dirPath, fileName);
  int dataLen = static_cast<int64_t>(data.size());
  if ( dataLen < 4 ) {
    result->errorMessage = std::string("File too small to be a valid JPEG");
    return result;
  }
  int marker1 = static_cast<int64_t>(data[0]);
  int marker2 = static_cast<int64_t>(data[1]);
  if ( (marker1 != 255) || (marker2 != 216) ) {
    result->errorMessage = std::string("Invalid JPEG signature - expected FFD8");
    return result;
  }
  int pos = 2;
  bool foundSOF = false;
  while ((pos < (dataLen - 2)) && (foundSOF == false)) {
    int m1 = static_cast<int64_t>(data[pos]);
    if ( m1 != 255 ) {
      pos = pos + 1;
    } else {
      int m2 = static_cast<int64_t>(data[(pos + 1)]);
      if ( m2 == 255 ) {
        pos = pos + 1;
      } else {
        if ( m2 == 0 ) {
          pos = pos + 2;
        } else {
          if ( ((m2 == 192) || (m2 == 193)) || (m2 == 194) ) {
            if ( (pos + 9) < dataLen ) {
              result->bitsPerComponent = static_cast<int64_t>(data[(pos + 4)]);
              result->height = this->readUint16BE(data, (pos + 5));
              result->width = this->readUint16BE(data, (pos + 7));
              result->colorComponents = static_cast<int64_t>(data[(pos + 9)]);
              foundSOF = true;
            }
          } else {
            if ( m2 == 217 ) {
              pos = dataLen;
            } else {
              if ( m2 == 218 ) {
                pos = dataLen;
              } else {
                if ( (pos + 4) < dataLen ) {
                  int segLen = this->readUint16BE(data, (pos + 2));
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
  if ( foundSOF == false ) {
    result->errorMessage = std::string("Could not find SOF marker in JPEG");
    return result;
  }
  result->imageData  = data;
  result->isValid = true;
  return result;
}
std::string  JPEGReader::getImageInfo( std::shared_ptr<JPEGImage> img ) {
  if ( img->isValid == false ) {
    return std::string("Invalid JPEG: ") + img->errorMessage;
  }
  return (((((((std::string("JPEG: ") + (std::to_string(img->width))) + std::string("x")) + (std::to_string(img->height))) + std::string(" pixels, ")) + (std::to_string(img->colorComponents))) + std::string(" components, ")) + (std::to_string(img->bitsPerComponent))) + std::string(" bits");
}
ExifTag::ExifTag( ) {
  this->tagId = 0;
  this->tagName = std::string("");
  this->tagValue = std::string("");
  this->dataType = 0;
}
JPEGMetadataInfo::JPEGMetadataInfo( ) {
  this->isValid = false;
  this->errorMessage = std::string("");
  this->hasJFIF = false;
  this->jfifVersion = std::string("");
  this->densityUnits = 0;
  this->xDensity = 0;
  this->yDensity = 0;
  this->width = 0;
  this->height = 0;
  this->colorComponents = 0;
  this->bitsPerComponent = 0;
  this->hasExif = false;
  this->cameraMake = std::string("");
  this->cameraModel = std::string("");
  this->software = std::string("");
  this->dateTime = std::string("");
  this->dateTimeOriginal = std::string("");
  this->exposureTime = std::string("");
  this->fNumber = std::string("");
  this->isoSpeed = std::string("");
  this->focalLength = std::string("");
  this->flash = std::string("");
  this->orientation = 1;
  this->xResolution = std::string("");
  this->yResolution = std::string("");
  this->resolutionUnit = 0;
  this->hasGPS = false;
  this->gpsLatitude = std::string("");
  this->gpsLongitude = std::string("");
  this->gpsAltitude = std::string("");
  this->gpsLatitudeRef = std::string("");
  this->gpsLongitudeRef = std::string("");
  this->hasComment = false;
  this->comment = std::string("");
}
JPEGMetadataParser::JPEGMetadataParser( ) {
  this->data = 
  std::vector<uint8_t>(0, 0);
  ;
  this->dataLen = 0;
  this->littleEndian = false;
}
int  JPEGMetadataParser::readUint16BE( int offset ) {
  int high = static_cast<int64_t>(data[offset]);
  int low = static_cast<int64_t>(data[(offset + 1)]);
  return (high * 256) + low;
}
int  JPEGMetadataParser::readUint16( int offset ) {
  int result = 0;
  if ( littleEndian ) {
    int low = static_cast<int64_t>(data[offset]);
    int high = static_cast<int64_t>(data[(offset + 1)]);
    result = (high * 256) + low;
  } else {
    int high_1 = static_cast<int64_t>(data[offset]);
    int low_1 = static_cast<int64_t>(data[(offset + 1)]);
    result = (high_1 * 256) + low_1;
  }
  return result;
}
int  JPEGMetadataParser::readUint32( int offset ) {
  int result = 0;
  if ( littleEndian ) {
    int b0 = static_cast<int64_t>(data[offset]);
    int b1 = static_cast<int64_t>(data[(offset + 1)]);
    int b2 = static_cast<int64_t>(data[(offset + 2)]);
    int b3 = static_cast<int64_t>(data[(offset + 3)]);
    result = (((b3 * 16777216) + (b2 * 65536)) + (b1 * 256)) + b0;
  } else {
    int b0_1 = static_cast<int64_t>(data[offset]);
    int b1_1 = static_cast<int64_t>(data[(offset + 1)]);
    int b2_1 = static_cast<int64_t>(data[(offset + 2)]);
    int b3_1 = static_cast<int64_t>(data[(offset + 3)]);
    result = (((b0_1 * 16777216) + (b1_1 * 65536)) + (b2_1 * 256)) + b3_1;
  }
  return result;
}
std::string  JPEGMetadataParser::readString( int offset , int length ) {
  std::string result = std::string("");
  int i = 0;
  while (i < length) {
    int b = static_cast<int64_t>(data[(offset + i)]);
    if ( b == 0 ) {
      return result;
    }
    result = result + (std::string(1, char(b)));
    i = i + 1;
  };
  return result;
}
std::string  JPEGMetadataParser::getTagName( int tagId , int ifdType ) {
  if ( ifdType == 2 ) {
    if ( tagId == 0 ) {
      return std::string("GPSVersionID");
    }
    if ( tagId == 1 ) {
      return std::string("GPSLatitudeRef");
    }
    if ( tagId == 2 ) {
      return std::string("GPSLatitude");
    }
    if ( tagId == 3 ) {
      return std::string("GPSLongitudeRef");
    }
    if ( tagId == 4 ) {
      return std::string("GPSLongitude");
    }
    if ( tagId == 5 ) {
      return std::string("GPSAltitudeRef");
    }
    if ( tagId == 6 ) {
      return std::string("GPSAltitude");
    }
    return std::string("GPS_") + (std::to_string(tagId));
  }
  if ( tagId == 256 ) {
    return std::string("ImageWidth");
  }
  if ( tagId == 257 ) {
    return std::string("ImageHeight");
  }
  if ( tagId == 258 ) {
    return std::string("BitsPerSample");
  }
  if ( tagId == 259 ) {
    return std::string("Compression");
  }
  if ( tagId == 262 ) {
    return std::string("PhotometricInterpretation");
  }
  if ( tagId == 270 ) {
    return std::string("ImageDescription");
  }
  if ( tagId == 271 ) {
    return std::string("Make");
  }
  if ( tagId == 272 ) {
    return std::string("Model");
  }
  if ( tagId == 274 ) {
    return std::string("Orientation");
  }
  if ( tagId == 282 ) {
    return std::string("XResolution");
  }
  if ( tagId == 283 ) {
    return std::string("YResolution");
  }
  if ( tagId == 296 ) {
    return std::string("ResolutionUnit");
  }
  if ( tagId == 305 ) {
    return std::string("Software");
  }
  if ( tagId == 306 ) {
    return std::string("DateTime");
  }
  if ( tagId == 315 ) {
    return std::string("Artist");
  }
  if ( tagId == 33432 ) {
    return std::string("Copyright");
  }
  if ( tagId == 33434 ) {
    return std::string("ExposureTime");
  }
  if ( tagId == 33437 ) {
    return std::string("FNumber");
  }
  if ( tagId == 34850 ) {
    return std::string("ExposureProgram");
  }
  if ( tagId == 34855 ) {
    return std::string("ISOSpeedRatings");
  }
  if ( tagId == 36864 ) {
    return std::string("ExifVersion");
  }
  if ( tagId == 36867 ) {
    return std::string("DateTimeOriginal");
  }
  if ( tagId == 36868 ) {
    return std::string("DateTimeDigitized");
  }
  if ( tagId == 37377 ) {
    return std::string("ShutterSpeedValue");
  }
  if ( tagId == 37378 ) {
    return std::string("ApertureValue");
  }
  if ( tagId == 37380 ) {
    return std::string("ExposureBiasValue");
  }
  if ( tagId == 37381 ) {
    return std::string("MaxApertureValue");
  }
  if ( tagId == 37383 ) {
    return std::string("MeteringMode");
  }
  if ( tagId == 37384 ) {
    return std::string("LightSource");
  }
  if ( tagId == 37385 ) {
    return std::string("Flash");
  }
  if ( tagId == 37386 ) {
    return std::string("FocalLength");
  }
  if ( tagId == 37500 ) {
    return std::string("MakerNote");
  }
  if ( tagId == 37510 ) {
    return std::string("UserComment");
  }
  if ( tagId == 40960 ) {
    return std::string("FlashpixVersion");
  }
  if ( tagId == 40961 ) {
    return std::string("ColorSpace");
  }
  if ( tagId == 40962 ) {
    return std::string("PixelXDimension");
  }
  if ( tagId == 40963 ) {
    return std::string("PixelYDimension");
  }
  if ( tagId == 41486 ) {
    return std::string("FocalPlaneXResolution");
  }
  if ( tagId == 41487 ) {
    return std::string("FocalPlaneYResolution");
  }
  if ( tagId == 41488 ) {
    return std::string("FocalPlaneResolutionUnit");
  }
  if ( tagId == 41495 ) {
    return std::string("SensingMethod");
  }
  if ( tagId == 41728 ) {
    return std::string("FileSource");
  }
  if ( tagId == 41729 ) {
    return std::string("SceneType");
  }
  if ( tagId == 41985 ) {
    return std::string("CustomRendered");
  }
  if ( tagId == 41986 ) {
    return std::string("ExposureMode");
  }
  if ( tagId == 41987 ) {
    return std::string("WhiteBalance");
  }
  if ( tagId == 41988 ) {
    return std::string("DigitalZoomRatio");
  }
  if ( tagId == 41989 ) {
    return std::string("FocalLengthIn35mmFilm");
  }
  if ( tagId == 41990 ) {
    return std::string("SceneCaptureType");
  }
  if ( tagId == 34665 ) {
    return std::string("ExifIFDPointer");
  }
  if ( tagId == 34853 ) {
    return std::string("GPSInfoIFDPointer");
  }
  return std::string("Tag_") + (std::to_string(tagId));
}
std::string  JPEGMetadataParser::formatRational( int offset ) {
  int numerator = this->readUint32(offset);
  int denominator = this->readUint32((offset + 4));
  if ( denominator == 0 ) {
    return std::to_string(numerator);
  }
  if ( denominator == 1 ) {
    return std::to_string(numerator);
  }
  return ((std::to_string(numerator)) + std::string("/")) + (std::to_string(denominator));
}
std::string  JPEGMetadataParser::formatGPSCoordinate( int offset , std::string _ref ) {
  int degNum = this->readUint32(offset);
  int degDen = this->readUint32((offset + 4));
  int minNum = this->readUint32((offset + 8));
  int minDen = this->readUint32((offset + 12));
  int secNum = this->readUint32((offset + 16));
  int secDen = this->readUint32((offset + 20));
  int degrees = 0;
  if ( degDen > 0 ) {
    int tempDeg = degNum;
    while (tempDeg >= degDen) {
      tempDeg = tempDeg - degDen;
      degrees = degrees + 1;
    };
  }
  int minutes = 0;
  if ( minDen > 0 ) {
    int tempMin = minNum;
    while (tempMin >= minDen) {
      tempMin = tempMin - minDen;
      minutes = minutes + 1;
    };
  }
  std::string seconds = std::string("0");
  if ( secDen > 0 ) {
    int secWhole = 0;
    int tempSec = secNum;
    while (tempSec >= secDen) {
      tempSec = tempSec - secDen;
      secWhole = secWhole + 1;
    };
    int secRem = tempSec;
    if ( secRem > 0 ) {
      int decPartTemp = secRem * 100;
      int decPart = 0;
      while (decPartTemp >= secDen) {
        decPartTemp = decPartTemp - secDen;
        decPart = decPart + 1;
      };
      if ( decPart < 10 ) {
        seconds = ((std::to_string(secWhole)) + std::string(".0")) + (std::to_string(decPart));
      } else {
        seconds = ((std::to_string(secWhole)) + std::string(".")) + (std::to_string(decPart));
      }
    } else {
      seconds = std::to_string(secWhole);
    }
  }
  return ((((((std::to_string(degrees)) + std::string("° ")) + (std::to_string(minutes))) + std::string("' ")) + seconds) + std::string("\" ")) + _ref;
}
void  JPEGMetadataParser::parseIFD( std::shared_ptr<JPEGMetadataInfo> info , int tiffStart , int ifdOffset , int ifdType ) {
  int pos = tiffStart + ifdOffset;
  if ( (pos + 2) > dataLen ) {
    return;
  }
  int numEntries = this->readUint16(pos);
  pos = pos + 2;
  int i = 0;
  while (i < numEntries) {
    if ( (pos + 12) > dataLen ) {
      return;
    }
    int tagId = this->readUint16(pos);
    int dataType = this->readUint16((pos + 2));
    int numValues = this->readUint32((pos + 4));
    int valueOffset = pos + 8;
    int dataSize = 0;
    if ( dataType == 1 ) {
      dataSize = numValues;
    }
    if ( dataType == 2 ) {
      dataSize = numValues;
    }
    if ( dataType == 3 ) {
      dataSize = numValues * 2;
    }
    if ( dataType == 4 ) {
      dataSize = numValues * 4;
    }
    if ( dataType == 5 ) {
      dataSize = numValues * 8;
    }
    if ( dataType == 7 ) {
      dataSize = numValues;
    }
    if ( dataType == 9 ) {
      dataSize = numValues * 4;
    }
    if ( dataType == 10 ) {
      dataSize = numValues * 8;
    }
    if ( dataSize > 4 ) {
      valueOffset = tiffStart + this->readUint32((pos + 8));
    }
    std::string tagName = this->getTagName(tagId, ifdType);
    std::string tagValue = std::string("");
    if ( dataType == 2 ) {
      tagValue = this->readString(valueOffset, numValues);
    }
    if ( dataType == 3 ) {
      if ( dataSize <= 4 ) {
        tagValue = std::to_string(this->readUint16((pos + 8)));
      } else {
        tagValue = std::to_string(this->readUint16(valueOffset));
      }
    }
    if ( dataType == 4 ) {
      if ( dataSize <= 4 ) {
        tagValue = std::to_string(this->readUint32((pos + 8)));
      } else {
        tagValue = std::to_string(this->readUint32(valueOffset));
      }
    }
    if ( dataType == 5 ) {
      tagValue = this->formatRational(valueOffset);
    }
    std::shared_ptr<ExifTag> tag =  std::make_shared<ExifTag>();
    tag->tagId = tagId;
    tag->tagName = tagName;
    tag->tagValue = tagValue;
    tag->dataType = dataType;
    info->exifTags.push_back( tag  );
    if ( tagId == 271 ) {
      info->cameraMake = tagValue;
    }
    if ( tagId == 272 ) {
      info->cameraModel = tagValue;
    }
    if ( tagId == 305 ) {
      info->software = tagValue;
    }
    if ( tagId == 306 ) {
      info->dateTime = tagValue;
    }
    if ( tagId == 274 ) {
      info->orientation = this->readUint16((pos + 8));
    }
    if ( tagId == 282 ) {
      info->xResolution = tagValue;
    }
    if ( tagId == 283 ) {
      info->yResolution = tagValue;
    }
    if ( tagId == 296 ) {
      info->resolutionUnit = this->readUint16((pos + 8));
    }
    if ( tagId == 36867 ) {
      info->dateTimeOriginal = tagValue;
    }
    if ( tagId == 33434 ) {
      info->exposureTime = tagValue;
    }
    if ( tagId == 33437 ) {
      info->fNumber = tagValue;
    }
    if ( tagId == 34855 ) {
      info->isoSpeed = tagValue;
    }
    if ( tagId == 37386 ) {
      info->focalLength = tagValue;
    }
    if ( tagId == 37385 ) {
      int flashVal = this->readUint16((pos + 8));
      if ( (flashVal % 2) == 1 ) {
        info->flash = std::string("Fired");
      } else {
        info->flash = std::string("Did not fire");
      }
    }
    if ( tagId == 34665 ) {
      int exifOffset = this->readUint32((pos + 8));
      this->parseIFD(info, tiffStart, exifOffset, 1);
    }
    if ( tagId == 34853 ) {
      info->hasGPS = true;
      int gpsOffset = this->readUint32((pos + 8));
      this->parseIFD(info, tiffStart, gpsOffset, 2);
    }
    if ( ifdType == 2 ) {
      if ( tagId == 1 ) {
        info->gpsLatitudeRef = tagValue;
      }
      if ( tagId == 2 ) {
        info->gpsLatitude = this->formatGPSCoordinate(valueOffset, info->gpsLatitudeRef);
      }
      if ( tagId == 3 ) {
        info->gpsLongitudeRef = tagValue;
      }
      if ( tagId == 4 ) {
        info->gpsLongitude = this->formatGPSCoordinate(valueOffset, info->gpsLongitudeRef);
      }
      if ( tagId == 6 ) {
        int altNum = this->readUint32(valueOffset);
        int altDen = this->readUint32((valueOffset + 4));
        if ( altDen > 0 ) {
          int altWhole = 0;
          int tempAlt = altNum;
          while (tempAlt >= altDen) {
            tempAlt = tempAlt - altDen;
            altWhole = altWhole + 1;
          };
          int altRem = tempAlt;
          if ( altRem > 0 ) {
            int altDecTemp = altRem * 10;
            int altDec = 0;
            while (altDecTemp >= altDen) {
              altDecTemp = altDecTemp - altDen;
              altDec = altDec + 1;
            };
            info->gpsAltitude = (((std::to_string(altWhole)) + std::string(".")) + (std::to_string(altDec))) + std::string(" m");
          } else {
            info->gpsAltitude = (std::to_string(altWhole)) + std::string(" m");
          }
        } else {
          info->gpsAltitude = (std::to_string(altNum)) + std::string(" m");
        }
      }
    }
    pos = pos + 12;
    i = i + 1;
  };
}
void  JPEGMetadataParser::parseExif( std::shared_ptr<JPEGMetadataInfo> info , int appStart , int appLen ) {
  std::string header = this->readString(appStart, 4);
  if ( header != std::string("Exif") ) {
    return;
  }
  info->hasExif = true;
  int tiffStart = appStart + 6;
  int byteOrder0 = static_cast<int64_t>(data[tiffStart]);
  int byteOrder1 = static_cast<int64_t>(data[(tiffStart + 1)]);
  if ( (byteOrder0 == 73) && (byteOrder1 == 73) ) {
    littleEndian = true;
  } else {
    if ( (byteOrder0 == 77) && (byteOrder1 == 77) ) {
      littleEndian = false;
    } else {
      return;
    }
  }
  int magic = this->readUint16((tiffStart + 2));
  if ( magic != 42 ) {
    return;
  }
  int ifd0Offset = this->readUint32((tiffStart + 4));
  this->parseIFD(info, tiffStart, ifd0Offset, 0);
}
void  JPEGMetadataParser::parseJFIF( std::shared_ptr<JPEGMetadataInfo> info , int appStart , int appLen ) {
  std::string header = this->readString(appStart, 4);
  if ( header != std::string("JFIF") ) {
    return;
  }
  info->hasJFIF = true;
  int verMajor = static_cast<int64_t>(data[(appStart + 5)]);
  int verMinor = static_cast<int64_t>(data[(appStart + 6)]);
  info->jfifVersion = ((std::to_string(verMajor)) + std::string(".")) + (std::to_string(verMinor));
  info->densityUnits = static_cast<int64_t>(data[(appStart + 7)]);
  info->xDensity = this->readUint16BE((appStart + 8));
  info->yDensity = this->readUint16BE((appStart + 10));
}
void  JPEGMetadataParser::parseComment( std::shared_ptr<JPEGMetadataInfo> info , int appStart , int appLen ) {
  info->hasComment = true;
  info->comment = this->readString(appStart, appLen);
}
std::shared_ptr<JPEGMetadataInfo>  JPEGMetadataParser::parseMetadata( std::string dirPath , std::string fileName ) {
  std::shared_ptr<JPEGMetadataInfo> info =  std::make_shared<JPEGMetadataInfo>();
  data = r_buffer_read_file(dirPath, fileName);
  dataLen = static_cast<int64_t>(data.size());
  if ( dataLen < 4 ) {
    info->errorMessage = std::string("File too small");
    return info;
  }
  int m1 = static_cast<int64_t>(data[0]);
  int m2 = static_cast<int64_t>(data[1]);
  if ( (m1 != 255) || (m2 != 216) ) {
    info->errorMessage = std::string("Not a valid JPEG file");
    return info;
  }
  info->isValid = true;
  int pos = 2;
  while (pos < dataLen) {
    int marker1 = static_cast<int64_t>(data[pos]);
    if ( marker1 != 255 ) {
      pos = pos + 1;
      continue;
    }
    int marker2 = static_cast<int64_t>(data[(pos + 1)]);
    if ( marker2 == 255 ) {
      pos = pos + 1;
      continue;
    }
    if ( (marker2 == 216) || (marker2 == 217) ) {
      pos = pos + 2;
      continue;
    }
    if ( (marker2 >= 208) && (marker2 <= 215) ) {
      pos = pos + 2;
      continue;
    }
    if ( (pos + 4) > dataLen ) {
      return info;
    }
    int segLen = this->readUint16BE((pos + 2));
    int segStart = pos + 4;
    if ( marker2 == 224 ) {
      this->parseJFIF(info, segStart, segLen - 2);
    }
    if ( marker2 == 225 ) {
      this->parseExif(info, segStart, segLen - 2);
    }
    if ( marker2 == 254 ) {
      this->parseComment(info, segStart, segLen - 2);
    }
    if ( (marker2 == 192) || (marker2 == 194) ) {
      if ( (pos + 9) < dataLen ) {
        info->bitsPerComponent = static_cast<int64_t>(data[(pos + 4)]);
        info->height = this->readUint16BE((pos + 5));
        info->width = this->readUint16BE((pos + 7));
        info->colorComponents = static_cast<int64_t>(data[(pos + 9)]);
      }
    }
    if ( marker2 == 218 ) {
      return info;
    }
    if ( marker2 == 217 ) {
      return info;
    }
    pos = (pos + 2) + segLen;
  };
  return info;
}
std::string  JPEGMetadataParser::formatMetadata( std::shared_ptr<JPEGMetadataInfo> info ) {
  std::shared_ptr<GrowableBuffer> out =  std::make_shared<GrowableBuffer>();
  out->writeString(std::string("=== JPEG Metadata ===\n\n"));
  if ( info->isValid == false ) {
    out->writeString((std::string("Error: ") + info->errorMessage) + std::string("\n"));
    return (out)->toString();
  }
  out->writeString(std::string("--- Image Info ---\n"));
  out->writeString((((std::string("  Dimensions: ") + (std::to_string(info->width))) + std::string(" x ")) + (std::to_string(info->height))) + std::string("\n"));
  out->writeString((std::string("  Color Components: ") + (std::to_string(info->colorComponents))) + std::string("\n"));
  out->writeString((std::string("  Bits per Component: ") + (std::to_string(info->bitsPerComponent))) + std::string("\n"));
  if ( info->hasJFIF ) {
    out->writeString(std::string("\n--- JFIF Info ---\n"));
    out->writeString((std::string("  Version: ") + info->jfifVersion) + std::string("\n"));
    std::string densityStr = std::string("No units (aspect ratio)");
    if ( info->densityUnits == 1 ) {
      densityStr = std::string("pixels/inch");
    }
    if ( info->densityUnits == 2 ) {
      densityStr = std::string("pixels/cm");
    }
    out->writeString((((((std::string("  Density: ") + (std::to_string(info->xDensity))) + std::string(" x ")) + (std::to_string(info->yDensity))) + std::string(" ")) + densityStr) + std::string("\n"));
  }
  if ( info->hasExif ) {
    out->writeString(std::string("\n--- EXIF Info ---\n"));
    if ( ((int)(info->cameraMake.length())) > 0 ) {
      out->writeString((std::string("  Camera Make: ") + info->cameraMake) + std::string("\n"));
    }
    if ( ((int)(info->cameraModel.length())) > 0 ) {
      out->writeString((std::string("  Camera Model: ") + info->cameraModel) + std::string("\n"));
    }
    if ( ((int)(info->software.length())) > 0 ) {
      out->writeString((std::string("  Software: ") + info->software) + std::string("\n"));
    }
    if ( ((int)(info->dateTimeOriginal.length())) > 0 ) {
      out->writeString((std::string("  Date/Time Original: ") + info->dateTimeOriginal) + std::string("\n"));
    } else {
      if ( ((int)(info->dateTime.length())) > 0 ) {
        out->writeString((std::string("  Date/Time: ") + info->dateTime) + std::string("\n"));
      }
    }
    if ( ((int)(info->exposureTime.length())) > 0 ) {
      out->writeString((std::string("  Exposure Time: ") + info->exposureTime) + std::string(" sec\n"));
    }
    if ( ((int)(info->fNumber.length())) > 0 ) {
      out->writeString((std::string("  F-Number: f/") + info->fNumber) + std::string("\n"));
    }
    if ( ((int)(info->isoSpeed.length())) > 0 ) {
      out->writeString((std::string("  ISO Speed: ") + info->isoSpeed) + std::string("\n"));
    }
    if ( ((int)(info->focalLength.length())) > 0 ) {
      out->writeString((std::string("  Focal Length: ") + info->focalLength) + std::string(" mm\n"));
    }
    if ( ((int)(info->flash.length())) > 0 ) {
      out->writeString((std::string("  Flash: ") + info->flash) + std::string("\n"));
    }
    std::string orientStr = std::string("Normal");
    if ( info->orientation == 2 ) {
      orientStr = std::string("Flip horizontal");
    }
    if ( info->orientation == 3 ) {
      orientStr = std::string("Rotate 180");
    }
    if ( info->orientation == 4 ) {
      orientStr = std::string("Flip vertical");
    }
    if ( info->orientation == 5 ) {
      orientStr = std::string("Transpose");
    }
    if ( info->orientation == 6 ) {
      orientStr = std::string("Rotate 90 CW");
    }
    if ( info->orientation == 7 ) {
      orientStr = std::string("Transverse");
    }
    if ( info->orientation == 8 ) {
      orientStr = std::string("Rotate 270 CW");
    }
    out->writeString((std::string("  Orientation: ") + orientStr) + std::string("\n"));
  }
  if ( info->hasGPS ) {
    out->writeString(std::string("\n--- GPS Info ---\n"));
    if ( ((int)(info->gpsLatitude.length())) > 0 ) {
      out->writeString((std::string("  Latitude: ") + info->gpsLatitude) + std::string("\n"));
    }
    if ( ((int)(info->gpsLongitude.length())) > 0 ) {
      out->writeString((std::string("  Longitude: ") + info->gpsLongitude) + std::string("\n"));
    }
    if ( ((int)(info->gpsAltitude.length())) > 0 ) {
      out->writeString((std::string("  Altitude: ") + info->gpsAltitude) + std::string("\n"));
    }
  }
  if ( info->hasComment ) {
    out->writeString(std::string("\n--- Comment ---\n"));
    out->writeString((std::string("  ") + info->comment) + std::string("\n"));
  }
  int tagCount = (int)(info->exifTags.size());
  if ( tagCount > 0 ) {
    out->writeString((std::string("\n--- All EXIF Tags (") + (std::to_string(tagCount))) + std::string(") ---\n"));
    for ( int idx = 0; idx != (int)(info->exifTags.size()); idx++) {
      std::shared_ptr<ExifTag> tag = info->exifTags.at(idx);
      out->writeString((std::string("  ") + tag->tagName) + std::string(" (0x"));
      std::string tagHex = std::string("");
      int tid = tag->tagId;
      std::string hexChars = std::string("0123456789ABCDEF");
      double h3D = tid / 4096;
      int h3 = (int)floor( h3D);
      int r3 = tid - (h3 * 4096);
      double h2D = r3 / 256;
      int h2 = (int)floor( h2D);
      int r2 = r3 - (h2 * 256);
      double h1D = r2 / 16;
      int h1 = (int)floor( h1D);
      int h0 = r2 - (h1 * 16);
      tagHex = (((r_utf8_substr(hexChars, h3, (h3 + 1) - h3)) + (r_utf8_substr(hexChars, h2, (h2 + 1) - h2))) + (r_utf8_substr(hexChars, h1, (h1 + 1) - h1))) + (r_utf8_substr(hexChars, h0, (h0 + 1) - h0));
      out->writeString(((tagHex + std::string("): ")) + tag->tagValue) + std::string("\n"));
    };
  }
  return (out)->toString();
}
JPEGMetadataMain::JPEGMetadataMain( ) {
}
PDFWriter::PDFWriter( ) {
  this->nextObjNum = 1;
  this->imageObjNum = 0;
  std::shared_ptr<GrowableBuffer> buf =  std::make_shared<GrowableBuffer>();
  pdfBuffer  = buf;
  std::shared_ptr<JPEGReader> reader =  std::make_shared<JPEGReader>();
  jpegReader  = reader;
  std::shared_ptr<JPEGMetadataParser> parser =  std::make_shared<JPEGMetadataParser>();
  metadataParser  = parser;
}
void  PDFWriter::writeObject( std::string content ) {
  std::shared_ptr<GrowableBuffer> buf = pdfBuffer;
  objectOffsets.push_back( (buf)->size()  );
  buf->writeString((std::to_string(nextObjNum)) + std::string(" 0 obj\n"));
  buf->writeString(content);
  buf->writeString(std::string("\nendobj\n\n"));
  nextObjNum = nextObjNum + 1;
}
int  PDFWriter::writeObjectGetNum( std::string content ) {
  int objNum = nextObjNum;
  this->writeObject(content);
  return objNum;
}
int  PDFWriter::writeImageObject( std::string header , std::vector<uint8_t> imageData , std::string footer ) {
  std::shared_ptr<GrowableBuffer> buf = pdfBuffer;
  objectOffsets.push_back( (buf)->size()  );
  buf->writeString((std::to_string(nextObjNum)) + std::string(" 0 obj\n"));
  buf->writeString(header);
  buf->writeBuffer(imageData);
  buf->writeString(footer);
  buf->writeString(std::string("\nendobj\n\n"));
  int objNum = nextObjNum;
  nextObjNum = nextObjNum + 1;
  return objNum;
}
int  PDFWriter::addJPEGImage( std::string dirPath , std::string fileName ) {
  std::shared_ptr<JPEGReader> reader = jpegReader;
  std::shared_ptr<JPEGImage> img = reader->readJPEG(dirPath, fileName);
  if ( img->isValid == false ) {
    std::cout << std::string("Error loading image: ") + img->errorMessage << std::endl;
    return 0;
  }
  std::cout << reader->getImageInfo(img) << std::endl;
  std::shared_ptr<JPEGMetadataParser> parser = metadataParser;
  std::shared_ptr<JPEGMetadataInfo> meta = parser->parseMetadata(dirPath, fileName);
  lastImageMetadata  = meta;
  std::string colorSpace = std::string("/DeviceRGB");
  if ( img->colorComponents == 1 ) {
    colorSpace = std::string("/DeviceGray");
  }
  if ( img->colorComponents == 4 ) {
    colorSpace = std::string("/DeviceCMYK");
  }
  std::vector<uint8_t> imgData = img->imageData;
  int dataLen = static_cast<int64_t>(imgData.size());
  std::string imgHeader = std::string("<< /Type /XObject /Subtype /Image");
  imgHeader = (imgHeader + std::string(" /Width ")) + (std::to_string(img->width));
  imgHeader = (imgHeader + std::string(" /Height ")) + (std::to_string(img->height));
  imgHeader = (imgHeader + std::string(" /ColorSpace ")) + colorSpace;
  imgHeader = (imgHeader + std::string(" /BitsPerComponent ")) + (std::to_string(img->bitsPerComponent));
  imgHeader = imgHeader + std::string(" /Filter /DCTDecode");
  imgHeader = (imgHeader + std::string(" /Length ")) + (std::to_string(dataLen));
  imgHeader = imgHeader + std::string(" >>\nstream\n");
  std::string imgFooter = std::string("\nendstream");
  imageObjNum = this->writeImageObject(imgHeader, imgData, imgFooter);
  return imageObjNum;
}
std::string  PDFWriter::escapeText( std::string text ) {
  std::string result = std::string("");
  int __len = (int)(text.length());
  int i = 0;
  while (i < __len) {
    int ch = text.at(i);
    if ( ch == 40 ) {
      result = result + std::string("\\(");
    } else {
      if ( ch == 41 ) {
        result = result + std::string("\\)");
      } else {
        if ( ch == 92 ) {
          result = result + std::string("\\\\");
        } else {
          result = result + (std::string(1, char(ch)));
        }
      }
    }
    i = i + 1;
  };
  return result;
}
std::vector<uint8_t>  PDFWriter::createHelloWorldPDF( std::string message ) {
  return this->createPDFWithImage(message, std::string(""), std::string(""));
}
std::vector<uint8_t>  PDFWriter::createPDFWithImage( std::string message , std::string imageDirPath , std::string imageFileName ) {
  nextObjNum = 1;
  std::shared_ptr<GrowableBuffer> buf = pdfBuffer;
  (buf)->clear();
  imageObjNum = 0;
  objectOffsets.clear();
  buf->writeString(std::string("%PDF-1.4\n"));
  buf->writeByte(37);
  buf->writeByte(226);
  buf->writeByte(227);
  buf->writeByte(207);
  buf->writeByte(211);
  buf->writeByte(10);
  bool hasImage = ((int)(imageFileName.length())) > 0;
  if ( hasImage ) {
    int imgNum = this->addJPEGImage(imageDirPath, imageFileName);
    if ( imgNum == 0 ) {
      hasImage = false;
    }
  }
  /** unused:  int catalogObjNum = nextObjNum   **/ ;
  int pagesObjNum = nextObjNum + 1;
  this->writeObject((std::string("<< /Type /Catalog /Pages ") + (std::to_string(pagesObjNum))) + std::string(" 0 R >>"));
  int pageObjNum = nextObjNum + 1;
  this->writeObject((std::string("<< /Type /Pages /Kids [") + (std::to_string(pageObjNum))) + std::string(" 0 R] /Count 1 >>"));
  int contentObjNum = nextObjNum + 1;
  int fontObjNum = nextObjNum + 2;
  std::string resourcesStr = (std::string("<< /Font << /F1 ") + (std::to_string(fontObjNum))) + std::string(" 0 R >>");
  if ( hasImage ) {
    resourcesStr = ((resourcesStr + std::string(" /XObject << /Img1 ")) + (std::to_string(imageObjNum))) + std::string(" 0 R >>");
  }
  resourcesStr = resourcesStr + std::string(" >>");
  this->writeObject((((((std::string("<< /Type /Page /Parent ") + (std::to_string(pagesObjNum))) + std::string(" 0 R /MediaBox [0 0 612 792] /Contents ")) + (std::to_string(contentObjNum))) + std::string(" 0 R /Resources ")) + resourcesStr) + std::string(" >>"));
  std::shared_ptr<GrowableBuffer> streamBuf =  std::make_shared<GrowableBuffer>();
  if ( hasImage ) {
    streamBuf->writeString(std::string("q\n"));
    streamBuf->writeString(std::string("150 0 0 150 400 600 cm\n"));
    streamBuf->writeString(std::string("/Img1 Do\n"));
    streamBuf->writeString(std::string("Q\n"));
  }
  streamBuf->writeString(std::string("q\n"));
  streamBuf->writeString(std::string("1 0 0 RG\n"));
  streamBuf->writeString(std::string("1 0.8 0.8 rg\n"));
  streamBuf->writeString(std::string("2 w\n"));
  streamBuf->writeString(std::string("100 650 80 60 re\n"));
  streamBuf->writeString(std::string("B\n"));
  streamBuf->writeString(std::string("Q\n"));
  streamBuf->writeString(std::string("q\n"));
  streamBuf->writeString(std::string("0 0 1 RG\n"));
  streamBuf->writeString(std::string("0.8 0.8 1 rg\n"));
  streamBuf->writeString(std::string("2 w\n"));
  streamBuf->writeString(std::string("220 650 m\n"));
  streamBuf->writeString(std::string("280 650 l\n"));
  streamBuf->writeString(std::string("250 710 l\n"));
  streamBuf->writeString(std::string("h\n"));
  streamBuf->writeString(std::string("B\n"));
  streamBuf->writeString(std::string("Q\n"));
  streamBuf->writeString(std::string("q\n"));
  streamBuf->writeString(std::string("0 0.5 0 RG\n"));
  streamBuf->writeString(std::string("0.8 1 0.8 rg\n"));
  streamBuf->writeString(std::string("2 w\n"));
  int cx = 370;
  int cy = 680;
  int r = 30;
  int k = 17;
  streamBuf->writeString((((std::to_string((cx + r))) + std::string(" ")) + (std::to_string(cy))) + std::string(" m\n"));
  streamBuf->writeString((((((((((((std::to_string((cx + r))) + std::string(" ")) + (std::to_string((cy + k)))) + std::string(" ")) + (std::to_string((cx + k)))) + std::string(" ")) + (std::to_string((cy + r)))) + std::string(" ")) + (std::to_string(cx))) + std::string(" ")) + (std::to_string((cy + r)))) + std::string(" c\n"));
  streamBuf->writeString((((((((((((std::to_string((cx - k))) + std::string(" ")) + (std::to_string((cy + r)))) + std::string(" ")) + (std::to_string((cx - r)))) + std::string(" ")) + (std::to_string((cy + k)))) + std::string(" ")) + (std::to_string((cx - r)))) + std::string(" ")) + (std::to_string(cy))) + std::string(" c\n"));
  streamBuf->writeString((((((((((((std::to_string((cx - r))) + std::string(" ")) + (std::to_string((cy - k)))) + std::string(" ")) + (std::to_string((cx - k)))) + std::string(" ")) + (std::to_string((cy - r)))) + std::string(" ")) + (std::to_string(cx))) + std::string(" ")) + (std::to_string((cy - r)))) + std::string(" c\n"));
  streamBuf->writeString((((((((((((std::to_string((cx + k))) + std::string(" ")) + (std::to_string((cy - r)))) + std::string(" ")) + (std::to_string((cx + r)))) + std::string(" ")) + (std::to_string((cy - k)))) + std::string(" ")) + (std::to_string((cx + r)))) + std::string(" ")) + (std::to_string(cy))) + std::string(" c\n"));
  streamBuf->writeString(std::string("B\n"));
  streamBuf->writeString(std::string("Q\n"));
  streamBuf->writeString(std::string("q\n"));
  streamBuf->writeString(std::string("0.8 0 0.2 RG\n"));
  streamBuf->writeString(std::string("1 0.4 0.5 rg\n"));
  streamBuf->writeString(std::string("2 w\n"));
  streamBuf->writeString(std::string("140 480 m\n"));
  streamBuf->writeString(std::string("90 510 80 560 110 580 c\n"));
  streamBuf->writeString(std::string("130 595 140 580 140 565 c\n"));
  streamBuf->writeString(std::string("140 580 150 595 170 580 c\n"));
  streamBuf->writeString(std::string("200 560 190 510 140 480 c\n"));
  streamBuf->writeString(std::string("h\n"));
  streamBuf->writeString(std::string("B\n"));
  streamBuf->writeString(std::string("Q\n"));
  streamBuf->writeString(std::string("q\n"));
  streamBuf->writeString(std::string("0 0.5 0.8 RG\n"));
  streamBuf->writeString(std::string("2 w\n"));
  int sx = 300;
  int sy = 530;
  int arm = 50;
  streamBuf->writeString((((std::to_string(sx)) + std::string(" ")) + (std::to_string(sy))) + std::string(" m\n"));
  streamBuf->writeString((((std::to_string(sx)) + std::string(" ")) + (std::to_string((sy + arm)))) + std::string(" l\n"));
  streamBuf->writeString((((std::to_string(sx)) + std::string(" ")) + (std::to_string(sy))) + std::string(" m\n"));
  streamBuf->writeString((((std::to_string((sx + 43))) + std::string(" ")) + (std::to_string((sy + 25)))) + std::string(" l\n"));
  streamBuf->writeString((((std::to_string(sx)) + std::string(" ")) + (std::to_string(sy))) + std::string(" m\n"));
  streamBuf->writeString((((std::to_string((sx + 43))) + std::string(" ")) + (std::to_string((sy - 25)))) + std::string(" l\n"));
  streamBuf->writeString((((std::to_string(sx)) + std::string(" ")) + (std::to_string(sy))) + std::string(" m\n"));
  streamBuf->writeString((((std::to_string(sx)) + std::string(" ")) + (std::to_string((sy - arm)))) + std::string(" l\n"));
  streamBuf->writeString((((std::to_string(sx)) + std::string(" ")) + (std::to_string(sy))) + std::string(" m\n"));
  streamBuf->writeString((((std::to_string((sx - 43))) + std::string(" ")) + (std::to_string((sy - 25)))) + std::string(" l\n"));
  streamBuf->writeString((((std::to_string(sx)) + std::string(" ")) + (std::to_string(sy))) + std::string(" m\n"));
  streamBuf->writeString((((std::to_string((sx - 43))) + std::string(" ")) + (std::to_string((sy + 25)))) + std::string(" l\n"));
  streamBuf->writeString((((std::to_string((sx - 10))) + std::string(" ")) + (std::to_string(((sy + arm) - 10)))) + std::string(" m\n"));
  streamBuf->writeString((((std::to_string(sx)) + std::string(" ")) + (std::to_string((sy + arm)))) + std::string(" l\n"));
  streamBuf->writeString((((std::to_string((sx + 10))) + std::string(" ")) + (std::to_string(((sy + arm) - 10)))) + std::string(" l\n"));
  streamBuf->writeString((((std::to_string((sx - 10))) + std::string(" ")) + (std::to_string(((sy - arm) + 10)))) + std::string(" m\n"));
  streamBuf->writeString((((std::to_string(sx)) + std::string(" ")) + (std::to_string((sy - arm)))) + std::string(" l\n"));
  streamBuf->writeString((((std::to_string((sx + 10))) + std::string(" ")) + (std::to_string(((sy - arm) + 10)))) + std::string(" l\n"));
  streamBuf->writeString(std::string("S\n"));
  streamBuf->writeString(std::string("Q\n"));
  streamBuf->writeString(std::string("q\n"));
  streamBuf->writeString(std::string("0.8 0.6 0 RG\n"));
  streamBuf->writeString(std::string("1 0.9 0.3 rg\n"));
  streamBuf->writeString(std::string("2 w\n"));
  streamBuf->writeString(std::string("460 575 m\n"));
  streamBuf->writeString(std::string("472 545 l\n"));
  streamBuf->writeString(std::string("505 545 l\n"));
  streamBuf->writeString(std::string("478 522 l\n"));
  streamBuf->writeString(std::string("488 490 l\n"));
  streamBuf->writeString(std::string("460 508 l\n"));
  streamBuf->writeString(std::string("432 490 l\n"));
  streamBuf->writeString(std::string("442 522 l\n"));
  streamBuf->writeString(std::string("415 545 l\n"));
  streamBuf->writeString(std::string("448 545 l\n"));
  streamBuf->writeString(std::string("h\n"));
  streamBuf->writeString(std::string("B\n"));
  streamBuf->writeString(std::string("Q\n"));
  streamBuf->writeString(std::string("q\n"));
  streamBuf->writeString(std::string("0.5 0.5 0.5 RG\n"));
  streamBuf->writeString(std::string("1 w\n"));
  streamBuf->writeString(std::string("50 450 m\n"));
  streamBuf->writeString(std::string("562 450 l\n"));
  streamBuf->writeString(std::string("S\n"));
  streamBuf->writeString(std::string("Q\n"));
  streamBuf->writeString(std::string("q\n"));
  streamBuf->writeString(std::string("0.6 0 0.6 RG\n"));
  streamBuf->writeString(std::string("3 w\n"));
  streamBuf->writeString(std::string("50 400 m\n"));
  streamBuf->writeString(std::string("150 450 200 350 300 400 c\n"));
  streamBuf->writeString(std::string("400 450 450 350 550 400 c\n"));
  streamBuf->writeString(std::string("S\n"));
  streamBuf->writeString(std::string("Q\n"));
  streamBuf->writeString(std::string("BT\n"));
  streamBuf->writeString(std::string("/F1 36 Tf\n"));
  streamBuf->writeString(std::string("100 320 Td\n"));
  streamBuf->writeString((std::string("(") + this->escapeText(message)) + std::string(") Tj\n"));
  streamBuf->writeString(std::string("ET\n"));
  streamBuf->writeString(std::string("BT\n"));
  streamBuf->writeString(std::string("/F1 14 Tf\n"));
  streamBuf->writeString(std::string("100 280 Td\n"));
  streamBuf->writeString(std::string("(Generated by Ranger PDF Writer) Tj\n"));
  streamBuf->writeString(std::string("ET\n"));
  streamBuf->writeString(std::string("BT\n/F1 10 Tf\n100 630 Td\n(Rectangle) Tj\nET\n"));
  streamBuf->writeString(std::string("BT\n/F1 10 Tf\n225 630 Td\n(Triangle) Tj\nET\n"));
  streamBuf->writeString(std::string("BT\n/F1 10 Tf\n355 630 Td\n(Circle) Tj\nET\n"));
  streamBuf->writeString(std::string("BT\n/F1 10 Tf\n125 465 Td\n(Heart) Tj\nET\n"));
  streamBuf->writeString(std::string("BT\n/F1 10 Tf\n275 465 Td\n(Snowflake) Tj\nET\n"));
  streamBuf->writeString(std::string("BT\n/F1 10 Tf\n445 465 Td\n(Star) Tj\nET\n"));
  if ( hasImage ) {
    streamBuf->writeString(std::string("BT\n/F1 10 Tf\n400 585 Td\n(JPEG Image) Tj\nET\n"));
    if ( lastImageMetadata != NULL  ) {
      std::shared_ptr<JPEGMetadataInfo> meta = lastImageMetadata;
      int metaY = 240;
      streamBuf->writeString((std::string("BT\n/F1 12 Tf\n400 ") + (std::to_string(metaY))) + std::string(" Td\n(Image Metadata:) Tj\nET\n"));
      metaY = metaY - 14;
      streamBuf->writeString((((((std::string("BT\n/F1 9 Tf\n400 ") + (std::to_string(metaY))) + std::string(" Td\n(Size: ")) + (std::to_string(meta->width))) + std::string(" x ")) + (std::to_string(meta->height))) + std::string(") Tj\nET\n"));
      metaY = metaY - 12;
      if ( meta->hasExif ) {
        if ( ((int)(meta->cameraMake.length())) > 0 ) {
          streamBuf->writeString((((std::string("BT\n/F1 9 Tf\n400 ") + (std::to_string(metaY))) + std::string(" Td\n(Make: ")) + this->escapeText(meta->cameraMake)) + std::string(") Tj\nET\n"));
          metaY = metaY - 12;
        }
        if ( ((int)(meta->cameraModel.length())) > 0 ) {
          streamBuf->writeString((((std::string("BT\n/F1 9 Tf\n400 ") + (std::to_string(metaY))) + std::string(" Td\n(Model: ")) + this->escapeText(meta->cameraModel)) + std::string(") Tj\nET\n"));
          metaY = metaY - 12;
        }
        if ( ((int)(meta->dateTimeOriginal.length())) > 0 ) {
          streamBuf->writeString((((std::string("BT\n/F1 9 Tf\n400 ") + (std::to_string(metaY))) + std::string(" Td\n(Date: ")) + this->escapeText(meta->dateTimeOriginal)) + std::string(") Tj\nET\n"));
          metaY = metaY - 12;
        }
        if ( ((int)(meta->exposureTime.length())) > 0 ) {
          streamBuf->writeString((((std::string("BT\n/F1 9 Tf\n400 ") + (std::to_string(metaY))) + std::string(" Td\n(Exposure: ")) + meta->exposureTime) + std::string(" sec) Tj\nET\n"));
          metaY = metaY - 12;
        }
        if ( ((int)(meta->fNumber.length())) > 0 ) {
          streamBuf->writeString((((std::string("BT\n/F1 9 Tf\n400 ") + (std::to_string(metaY))) + std::string(" Td\n(Aperture: f/")) + meta->fNumber) + std::string(") Tj\nET\n"));
          metaY = metaY - 12;
        }
        if ( ((int)(meta->isoSpeed.length())) > 0 ) {
          streamBuf->writeString((((std::string("BT\n/F1 9 Tf\n400 ") + (std::to_string(metaY))) + std::string(" Td\n(ISO: ")) + meta->isoSpeed) + std::string(") Tj\nET\n"));
          metaY = metaY - 12;
        }
        if ( ((int)(meta->focalLength.length())) > 0 ) {
          streamBuf->writeString((((std::string("BT\n/F1 9 Tf\n400 ") + (std::to_string(metaY))) + std::string(" Td\n(Focal Length: ")) + meta->focalLength) + std::string(" mm) Tj\nET\n"));
          metaY = metaY - 12;
        }
        if ( ((int)(meta->flash.length())) > 0 ) {
          streamBuf->writeString((((std::string("BT\n/F1 9 Tf\n400 ") + (std::to_string(metaY))) + std::string(" Td\n(Flash: ")) + meta->flash) + std::string(") Tj\nET\n"));
          metaY = metaY - 12;
        }
      }
      if ( meta->hasGPS ) {
        streamBuf->writeString((std::string("BT\n/F1 9 Tf\n400 ") + (std::to_string(metaY))) + std::string(" Td\n(--- GPS Data ---) Tj\nET\n"));
        metaY = metaY - 12;
        if ( ((int)(meta->gpsLatitude.length())) > 0 ) {
          streamBuf->writeString((((std::string("BT\n/F1 9 Tf\n400 ") + (std::to_string(metaY))) + std::string(" Td\n(Latitude: ")) + meta->gpsLatitude) + std::string(") Tj\nET\n"));
          metaY = metaY - 12;
        }
        if ( ((int)(meta->gpsLongitude.length())) > 0 ) {
          streamBuf->writeString((((std::string("BT\n/F1 9 Tf\n400 ") + (std::to_string(metaY))) + std::string(" Td\n(Longitude: ")) + meta->gpsLongitude) + std::string(") Tj\nET\n"));
          metaY = metaY - 12;
        }
        if ( ((int)(meta->gpsAltitude.length())) > 0 ) {
          streamBuf->writeString((((std::string("BT\n/F1 9 Tf\n400 ") + (std::to_string(metaY))) + std::string(" Td\n(Altitude: ")) + meta->gpsAltitude) + std::string(") Tj\nET\n"));
          metaY = metaY - 12;
        }
      }
    }
  }
  int streamLen = (streamBuf)->size();
  std::string streamContent = (streamBuf)->toString();
  this->writeObject((((std::string("<< /Length ") + (std::to_string(streamLen))) + std::string(" >>\nstream\n")) + streamContent) + std::string("endstream"));
  this->writeObject(std::string("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>"));
  int rootObjNum = 1;
  if ( hasImage ) {
    rootObjNum = 2;
  }
  int xrefOffset = (buf)->size();
  buf->writeString(std::string("xref\n"));
  buf->writeString((std::string("0 ") + (std::to_string(nextObjNum))) + std::string("\n"));
  buf->writeString(std::string("0000000000 65535 f \n"));
  for ( int i = 0; i != (int)(objectOffsets.size()); i++) {
    int offset = objectOffsets.at(i);
    std::string offsetStr = std::to_string(offset);
    while (((int)(offsetStr.length())) < 10) {
      offsetStr = std::string("0") + offsetStr;
    };
    buf->writeString(offsetStr + std::string(" 00000 n \n"));
  };
  buf->writeString(std::string("trailer\n"));
  buf->writeString((((std::string("<< /Size ") + (std::to_string(nextObjNum))) + std::string(" /Root ")) + (std::to_string(rootObjNum))) + std::string(" 0 R >>\n"));
  buf->writeString(std::string("startxref\n"));
  buf->writeString((std::to_string(xrefOffset)) + std::string("\n"));
  buf->writeString(std::string("%%EOF\n"));
  return buf->toBuffer();
}
void  PDFWriter::savePDF( std::string path , std::string filename , std::string message ) {
  std::vector<uint8_t> pdfContent = this->createHelloWorldPDF(message);
  r_buffer_write_file(path, filename, pdfContent);
  std::cout << ((std::string("PDF saved to ") + path) + std::string("/")) + filename << std::endl;
}
void  PDFWriter::savePDFWithImage( std::string path , std::string filename , std::string message , std::string imageDirPath , std::string imageFileName ) {
  std::vector<uint8_t> pdfContent = this->createPDFWithImage(message, imageDirPath, imageFileName);
  r_buffer_write_file(path, filename, pdfContent);
  std::cout << ((std::string("PDF saved to ") + path) + std::string("/")) + filename << std::endl;
}
Main::Main( ) {
}
EVGTextMetrics::EVGTextMetrics( ) {
  this->width = 0;
  this->height = 0;
  this->ascent = 0;
  this->descent = 0;
  this->lineHeight = 0;
  width = 0;
  height = 0;
  ascent = 0;
  descent = 0;
  lineHeight = 0;
}
std::shared_ptr<EVGTextMetrics>  EVGTextMetrics::create( double w , double h ) {
  std::shared_ptr<EVGTextMetrics> m =  std::make_shared<EVGTextMetrics>();
  m->width = w;
  m->height = h;
  return m;
}
EVGTextMeasurer::EVGTextMeasurer( ) {
}
std::shared_ptr<EVGTextMetrics>  EVGTextMeasurer::measureText( std::string text , std::string fontFamily , double fontSize ) {
  double avgCharWidth = fontSize * 0.55;
  int textLen = (int)(text.length());
  double width = ((double)(textLen)) * avgCharWidth;
  double lineHeight = fontSize * 1.2;
  std::shared_ptr<EVGTextMetrics> metrics =  std::make_shared<EVGTextMetrics>();
  metrics->width = width;
  metrics->height = lineHeight;
  metrics->ascent = fontSize * 0.8;
  metrics->descent = fontSize * 0.2;
  metrics->lineHeight = lineHeight;
  return metrics;
}
double  EVGTextMeasurer::measureTextWidth( std::string text , std::string fontFamily , double fontSize ) {
  std::shared_ptr<EVGTextMetrics> metrics = this->measureText(text, fontFamily, fontSize);
  return metrics->width;
}
double  EVGTextMeasurer::getLineHeight( std::string fontFamily , double fontSize ) {
  return fontSize * 1.2;
}
double  EVGTextMeasurer::measureChar( int ch , std::string fontFamily , double fontSize ) {
  if ( ch == 32 ) {
    return fontSize * 0.3;
  }
  if ( ((((ch == 105) || (ch == 108)) || (ch == 106)) || (ch == 116)) || (ch == 102) ) {
    return fontSize * 0.3;
  }
  if ( (ch == 109) || (ch == 119) ) {
    return fontSize * 0.8;
  }
  if ( (ch == 77) || (ch == 87) ) {
    return fontSize * 0.9;
  }
  if ( ch == 73 ) {
    return fontSize * 0.35;
  }
  return fontSize * 0.55;
}
std::vector<std::string>  EVGTextMeasurer::wrapText( std::string text , std::string fontFamily , double fontSize , double maxWidth ) {
  std::vector<std::string> lines;
  std::string currentLine = std::string("");
  double currentWidth = 0;
  int wordStart = 0;
  int textLen = (int)(text.length());
  int i = 0;
  while (i <= textLen) {
    int ch = 0;
    bool isEnd = i == textLen;
    if ( isEnd == false ) {
      ch = text.at(i);
    }
    bool isWordEnd = false;
    if ( isEnd ) {
      isWordEnd = true;
    }
    if ( ch == 32 ) {
      isWordEnd = true;
    }
    if ( ch == 10 ) {
      isWordEnd = true;
    }
    if ( isWordEnd ) {
      std::string word = std::string("");
      if ( i > wordStart ) {
        word = r_utf8_substr(text, wordStart, i - wordStart);
      }
      double wordWidth = this->measureTextWidth(word, fontFamily, fontSize);
      double spaceWidth = 0;
      if ( ((int)(currentLine.length())) > 0 ) {
        spaceWidth = this->measureTextWidth(std::string(" "), fontFamily, fontSize);
      }
      if ( ((currentWidth + spaceWidth) + wordWidth) <= maxWidth ) {
        if ( ((int)(currentLine.length())) > 0 ) {
          currentLine = currentLine + std::string(" ");
          currentWidth = currentWidth + spaceWidth;
        }
        currentLine = currentLine + word;
        currentWidth = currentWidth + wordWidth;
      } else {
        if ( ((int)(currentLine.length())) > 0 ) {
          lines.push_back( currentLine  );
        }
        currentLine = word;
        currentWidth = wordWidth;
      }
      if ( ch == 10 ) {
        lines.push_back( currentLine  );
        currentLine = std::string("");
        currentWidth = 0;
      }
      wordStart = i + 1;
    }
    i = i + 1;
  };
  if ( ((int)(currentLine.length())) > 0 ) {
    lines.push_back( currentLine  );
  }
  return lines;
}
SimpleTextMeasurer::SimpleTextMeasurer( ) {
  this->charWidthRatio = 0.55;
}
void  SimpleTextMeasurer::setCharWidthRatio( double ratio ) {
  charWidthRatio = ratio;
}
std::shared_ptr<EVGTextMetrics>  SimpleTextMeasurer::measureText( std::string text , std::string fontFamily , double fontSize ) {
  int textLen = (int)(text.length());
  double width = 0;
  int i = 0;
  while (i < textLen) {
    int ch = text.at(i);
    width = width + this->measureChar(ch, fontFamily, fontSize);
    i = i + 1;
  };
  double lineHeight = fontSize * 1.2;
  std::shared_ptr<EVGTextMetrics> metrics =  std::make_shared<EVGTextMetrics>();
  metrics->width = width;
  metrics->height = lineHeight;
  metrics->ascent = fontSize * 0.8;
  metrics->descent = fontSize * 0.2;
  metrics->lineHeight = lineHeight;
  return metrics;
}
EVGImageDimensions::EVGImageDimensions( ) {
  this->width = 0;
  this->height = 0;
  this->aspectRatio = 1;
  this->isValid = false;
  width = 0;
  height = 0;
  aspectRatio = 1;
  isValid = false;
}
std::shared_ptr<EVGImageDimensions>  EVGImageDimensions::create( int w , int h ) {
  std::shared_ptr<EVGImageDimensions> d =  std::make_shared<EVGImageDimensions>();
  d->width = w;
  d->height = h;
  if ( h > 0 ) {
    d->aspectRatio = ((double)(w)) / ((double)(h));
  }
  d->isValid = true;
  return d;
}
EVGImageMeasurer::EVGImageMeasurer( ) {
}
std::shared_ptr<EVGImageDimensions>  EVGImageMeasurer::getImageDimensions( std::string src ) {
  std::shared_ptr<EVGImageDimensions> dims =  std::make_shared<EVGImageDimensions>();
  return dims;
}
double  EVGImageMeasurer::calculateHeightForWidth( std::string src , double targetWidth ) {
  std::shared_ptr<EVGImageDimensions> dims = this->getImageDimensions(src);
  if ( dims->isValid ) {
    return targetWidth / dims->aspectRatio;
  }
  return targetWidth;
}
double  EVGImageMeasurer::calculateWidthForHeight( std::string src , double targetHeight ) {
  std::shared_ptr<EVGImageDimensions> dims = this->getImageDimensions(src);
  if ( dims->isValid ) {
    return targetHeight * dims->aspectRatio;
  }
  return targetHeight;
}
std::shared_ptr<EVGImageDimensions>  EVGImageMeasurer::calculateFitDimensions( std::string src , double maxWidth , double maxHeight ) {
  std::shared_ptr<EVGImageDimensions> dims = this->getImageDimensions(src);
  if ( dims->isValid == false ) {
    return EVGImageDimensions::create(((int)floor( maxWidth)), ((int)floor( maxHeight)));
  }
  double scaleW = maxWidth / ((double)(dims->width));
  double scaleH = maxHeight / ((double)(dims->height));
  double scale = scaleW;
  if ( scaleH < scaleW ) {
    scale = scaleH;
  }
  int newW = (int)floor( (((double)(dims->width)) * scale));
  int newH = (int)floor( (((double)(dims->height)) * scale));
  return EVGImageDimensions::create(newW, newH);
}
SimpleImageMeasurer::SimpleImageMeasurer( ) {
}
EVGLayout::EVGLayout( ) {
  this->pageWidth = 612;
  this->pageHeight = 792;
  this->currentPage = 0;
  this->debug = false;
  std::shared_ptr<SimpleTextMeasurer> m =  std::make_shared<SimpleTextMeasurer>();
  measurer  = m;
  std::shared_ptr<SimpleImageMeasurer> im =  std::make_shared<SimpleImageMeasurer>();
  imageMeasurer  = im;
}
void  EVGLayout::setMeasurer( std::shared_ptr<EVGTextMeasurer> m ) {
  measurer  = m;
}
void  EVGLayout::setImageMeasurer( std::shared_ptr<EVGImageMeasurer> m ) {
  imageMeasurer  = m;
}
void  EVGLayout::setPageSize( double w , double h ) {
  pageWidth = w;
  pageHeight = h;
}
void  EVGLayout::setDebug( bool d ) {
  debug = d;
}
void  EVGLayout::log( std::string msg ) {
  if ( debug ) {
    std::cout << msg << std::endl;
  }
}
void  EVGLayout::layout( std::shared_ptr<EVGElement> root ) {
  this->log(std::string("EVGLayout: Starting layout"));
  currentPage = 0;
  if ( root->width->isSet == false ) {
    root->width  = EVGUnit::px(pageWidth);
  }
  if ( root->height->isSet == false ) {
    root->height  = EVGUnit::px(pageHeight);
  }
  this->layoutElement(root, 0, 0, pageWidth, pageHeight);
  this->log(std::string("EVGLayout: Layout complete"));
}
void  EVGLayout::layoutElement( std::shared_ptr<EVGElement> element , double parentX , double parentY , double parentWidth , double parentHeight ) {
  element->resolveUnits(parentWidth, parentHeight);
  double width = parentWidth;
  if ( element->width->isSet ) {
    width = element->width->pixels;
  }
  double height = 0;
  bool autoHeight = true;
  if ( element->height->isSet ) {
    height = element->height->pixels;
    autoHeight = false;
  }
  if ( element->tagName == std::string("image") ) {
    std::string imgSrc = element->src;
    if ( ((int)(imgSrc.length())) > 0 ) {
      std::shared_ptr<EVGImageDimensions> dims = imageMeasurer->getImageDimensions(imgSrc);
      if ( dims->isValid ) {
        if ( element->width->isSet && (element->height->isSet == false) ) {
          height = width / dims->aspectRatio;
          autoHeight = false;
          this->log(((std::string("  Image aspect ratio: ") + (std::to_string(dims->aspectRatio))) + std::string(" -> height=")) + (std::to_string(height)));
        }
        if ( (element->width->isSet == false) && element->height->isSet ) {
          width = height * dims->aspectRatio;
          this->log(((std::string("  Image aspect ratio: ") + (std::to_string(dims->aspectRatio))) + std::string(" -> width=")) + (std::to_string(width)));
        }
        if ( (element->width->isSet == false) && (element->height->isSet == false) ) {
          width = (double)(dims->width);
          height = (double)(dims->height);
          if ( width > parentWidth ) {
            double scale = parentWidth / width;
            width = parentWidth;
            height = height * scale;
          }
          autoHeight = false;
          this->log(((std::string("  Image natural size: ") + (std::to_string(width))) + std::string("x")) + (std::to_string(height)));
        }
      }
    }
  }
  if ( element->minWidth->isSet ) {
    if ( width < element->minWidth->pixels ) {
      width = element->minWidth->pixels;
    }
  }
  if ( element->maxWidth->isSet ) {
    if ( width > element->maxWidth->pixels ) {
      width = element->maxWidth->pixels;
    }
  }
  element->calculatedWidth = width;
  element->calculatedInnerWidth = element->box->getInnerWidth(width);
  if ( autoHeight == false ) {
    element->calculatedHeight = height;
    element->calculatedInnerHeight = element->box->getInnerHeight(height);
  }
  if ( element->isAbsolute ) {
    this->layoutAbsolute(element, parentWidth, parentHeight);
  }
  int childCount = element->getChildCount();
  double contentHeight = 0;
  if ( childCount > 0 ) {
    contentHeight = this->layoutChildren(element);
  } else {
    if ( (element->tagName == std::string("text")) || (element->tagName == std::string("span")) ) {
      double fontSize = element->inheritedFontSize;
      if ( element->fontSize->isSet ) {
        fontSize = element->fontSize->pixels;
      }
      if ( fontSize <= 0 ) {
        fontSize = 14;
      }
      double lineHeightFactor = element->lineHeight;
      if ( lineHeightFactor <= 0 ) {
        lineHeightFactor = 1.2;
      }
      double lineSpacing = fontSize * lineHeightFactor;
      std::string textContent = element->textContent;
      double availableWidth = (width - element->box->paddingLeftPx) - element->box->paddingRightPx;
      int lineCount = this->estimateLineCount(textContent, availableWidth, fontSize);
      contentHeight = lineSpacing * ((double)(lineCount));
    }
  }
  if ( autoHeight ) {
    height = ((contentHeight + element->box->paddingTopPx) + element->box->paddingBottomPx) + (element->box->borderWidthPx * 2);
  }
  if ( element->minHeight->isSet ) {
    if ( height < element->minHeight->pixels ) {
      height = element->minHeight->pixels;
    }
  }
  if ( element->maxHeight->isSet ) {
    if ( height > element->maxHeight->pixels ) {
      height = element->maxHeight->pixels;
    }
  }
  element->calculatedHeight = height;
  element->calculatedInnerHeight = element->box->getInnerHeight(height);
  element->calculatedPage = currentPage;
  element->isLayoutComplete = true;
  this->log(((((((((((std::string("  Laid out ") + element->tagName) + std::string(" id=")) + element->id) + std::string(" at (")) + (std::to_string(element->calculatedX))) + std::string(",")) + (std::to_string(element->calculatedY))) + std::string(") size=")) + (std::to_string(width))) + std::string("x")) + (std::to_string(height)));
}
double  EVGLayout::layoutChildren( std::shared_ptr<EVGElement> parent ) {
  int childCount = parent->getChildCount();
  if ( childCount == 0 ) {
    return 0;
  }
  double innerWidth = parent->calculatedInnerWidth;
  double innerHeight = parent->calculatedInnerHeight;
  double startX = ((parent->calculatedX + parent->box->marginLeftPx) + parent->box->borderWidthPx) + parent->box->paddingLeftPx;
  double startY = ((parent->calculatedY + parent->box->marginTopPx) + parent->box->borderWidthPx) + parent->box->paddingTopPx;
  double currentX = startX;
  double currentY = startY;
  double rowHeight = 0;
  std::vector<std::shared_ptr<EVGElement>> rowElements;
  double totalHeight = 0;
  bool isColumn = parent->flexDirection == std::string("column");
  if ( isColumn == false ) {
    double fixedWidth = 0;
    double totalFlex = 0;
    int j = 0;
    while (j < childCount) {
      std::shared_ptr<EVGElement> c = parent->getChild(j);
      c->resolveUnits(innerWidth, innerHeight);
      if ( c->width->isSet ) {
        fixedWidth = ((fixedWidth + c->width->pixels) + c->box->marginLeftPx) + c->box->marginRightPx;
      } else {
        if ( c->flex > 0 ) {
          totalFlex = totalFlex + c->flex;
          fixedWidth = (fixedWidth + c->box->marginLeftPx) + c->box->marginRightPx;
        } else {
          fixedWidth = ((fixedWidth + innerWidth) + c->box->marginLeftPx) + c->box->marginRightPx;
        }
      }
      j = j + 1;
    };
    double availableForFlex = innerWidth - fixedWidth;
    if ( availableForFlex < 0 ) {
      availableForFlex = 0;
    }
    if ( totalFlex > 0 ) {
      j = 0;
      while (j < childCount) {
        std::shared_ptr<EVGElement> c_1 = parent->getChild(j);
        if ( (c_1->width->isSet == false) && (c_1->flex > 0) ) {
          double flexWidth = (availableForFlex * c_1->flex) / totalFlex;
          c_1->calculatedFlexWidth = flexWidth;
        }
        j = j + 1;
      };
    }
  }
  int i = 0;
  while (i < childCount) {
    std::shared_ptr<EVGElement> child = parent->getChild(i);
    child->inheritProperties(parent);
    child->resolveUnits(innerWidth, innerHeight);
    if ( child->isAbsolute ) {
      this->layoutAbsolute(child, innerWidth, innerHeight);
      child->calculatedX = child->calculatedX + startX;
      child->calculatedY = child->calculatedY + startY;
      if ( child->getChildCount() > 0 ) {
        this->layoutChildren(child);
      }
      i = i + 1;
      continue;
    }
    double childWidth = innerWidth;
    if ( child->width->isSet ) {
      childWidth = child->width->pixels;
    } else {
      if ( child->calculatedFlexWidth > 0 ) {
        childWidth = child->calculatedFlexWidth;
      }
    }
    double childTotalWidth = (childWidth + child->box->marginLeftPx) + child->box->marginRightPx;
    if ( isColumn == false ) {
      double availableWidth = (startX + innerWidth) - currentX;
      if ( (childTotalWidth > availableWidth) && (((int)(rowElements.size())) > 0) ) {
        this->alignRow(rowElements, parent, rowHeight, startX, innerWidth);
        currentY = currentY + rowHeight;
        totalHeight = totalHeight + rowHeight;
        currentX = startX;
        rowHeight = 0;
        rowElements.clear();
      }
    }
    child->calculatedX = currentX + child->box->marginLeftPx;
    child->calculatedY = currentY + child->box->marginTopPx;
    this->layoutElement(child, child->calculatedX, child->calculatedY, childWidth, innerHeight);
    double childHeight = child->calculatedHeight;
    double childTotalHeight = (childHeight + child->box->marginTopPx) + child->box->marginBottomPx;
    if ( isColumn ) {
      currentY = currentY + childTotalHeight;
      totalHeight = totalHeight + childTotalHeight;
    } else {
      currentX = currentX + childTotalWidth;
      rowElements.push_back( child  );
      if ( childTotalHeight > rowHeight ) {
        rowHeight = childTotalHeight;
      }
    }
    if ( child->lineBreak ) {
      if ( isColumn == false ) {
        this->alignRow(rowElements, parent, rowHeight, startX, innerWidth);
        currentY = currentY + rowHeight;
        totalHeight = totalHeight + rowHeight;
        currentX = startX;
        rowHeight = 0;
        rowElements.clear();
      }
    }
    i = i + 1;
  };
  if ( (isColumn == false) && (((int)(rowElements.size())) > 0) ) {
    this->alignRow(rowElements, parent, rowHeight, startX, innerWidth);
    totalHeight = totalHeight + rowHeight;
  }
  return totalHeight;
}
void  EVGLayout::alignRow( std::vector<std::shared_ptr<EVGElement>> rowElements , std::shared_ptr<EVGElement> parent , double rowHeight , double startX , double innerWidth ) {
  int elementCount = (int)(rowElements.size());
  if ( elementCount == 0 ) {
    return;
  }
  double rowWidth = 0;
  int i = 0;
  while (i < elementCount) {
    std::shared_ptr<EVGElement> el = rowElements.at(i);
    rowWidth = ((rowWidth + el->calculatedWidth) + el->box->marginLeftPx) + el->box->marginRightPx;
    i = i + 1;
  };
  double offsetX = 0;
  if ( parent->align == std::string("center") ) {
    offsetX = (innerWidth - rowWidth) / 2;
  }
  if ( parent->align == std::string("right") ) {
    offsetX = innerWidth - rowWidth;
  }
  double effectiveRowHeight = rowHeight;
  if ( parent->height->isSet ) {
    double parentInnerHeight = parent->calculatedInnerHeight;
    if ( parentInnerHeight > rowHeight ) {
      effectiveRowHeight = parentInnerHeight;
    }
  }
  i = 0;
  while (i < elementCount) {
    std::shared_ptr<EVGElement> el_1 = rowElements.at(i);
    if ( offsetX != 0 ) {
      el_1->calculatedX = el_1->calculatedX + offsetX;
    }
    double childTotalHeight = (el_1->calculatedHeight + el_1->box->marginTopPx) + el_1->box->marginBottomPx;
    double offsetY = 0;
    if ( parent->verticalAlign == std::string("center") ) {
      offsetY = (effectiveRowHeight - childTotalHeight) / 2;
    }
    if ( parent->verticalAlign == std::string("bottom") ) {
      offsetY = effectiveRowHeight - childTotalHeight;
    }
    if ( offsetY != 0 ) {
      el_1->calculatedY = el_1->calculatedY + offsetY;
    }
    i = i + 1;
  };
}
void  EVGLayout::layoutAbsolute( std::shared_ptr<EVGElement> element , double parentWidth , double parentHeight ) {
  if ( element->left->isSet ) {
    element->calculatedX = element->left->pixels + element->box->marginLeftPx;
  } else {
    if ( element->x->isSet ) {
      element->calculatedX = element->x->pixels + element->box->marginLeftPx;
    } else {
      if ( element->right->isSet ) {
        double width = element->calculatedWidth;
        if ( width == 0 ) {
          if ( element->width->isSet ) {
            width = element->width->pixels;
          }
        }
        element->calculatedX = ((parentWidth - element->right->pixels) - width) - element->box->marginRightPx;
      }
    }
  }
  if ( element->top->isSet ) {
    element->calculatedY = element->top->pixels + element->box->marginTopPx;
  } else {
    if ( element->y->isSet ) {
      element->calculatedY = element->y->pixels + element->box->marginTopPx;
    } else {
      if ( element->bottom->isSet ) {
        double height = element->calculatedHeight;
        if ( height == 0 ) {
          if ( element->height->isSet ) {
            height = element->height->pixels;
          }
        }
        element->calculatedY = ((parentHeight - element->bottom->pixels) - height) - element->box->marginBottomPx;
      }
    }
  }
}
void  EVGLayout::printLayout( std::shared_ptr<EVGElement> element , int indent ) {
  std::string indentStr = std::string("");
  int i = 0;
  while (i < indent) {
    indentStr = indentStr + std::string("  ");
    i = i + 1;
  };
  std::cout << ((((((((((indentStr + element->tagName) + std::string(" id=\"")) + element->id) + std::string("\" (")) + (std::to_string(element->calculatedX))) + std::string(", ")) + (std::to_string(element->calculatedY))) + std::string(") ")) + (std::to_string(element->calculatedWidth))) + std::string("x")) + (std::to_string(element->calculatedHeight)) << std::endl;
  int childCount = element->getChildCount();
  i = 0;
  while (i < childCount) {
    std::shared_ptr<EVGElement> child = element->getChild(i);
    this->printLayout(child, indent + 1);
    i = i + 1;
  };
}
int  EVGLayout::estimateLineCount( std::string text , double maxWidth , double fontSize ) {
  if ( ((int)(text.length())) == 0 ) {
    return 1;
  }
  if ( maxWidth <= 0 ) {
    return 1;
  }
  std::vector<std::string> words = r_str_split( text, std::string(" "));
  int lineCount = 1;
  double currentLineWidth = 0;
  double spaceWidth = fontSize * 0.3;
  int i = 0;
  while (i < ((int)(words.size()))) {
    std::string word = words.at(i);
    double wordWidth = measurer->measureTextWidth(word, std::string("Helvetica"), fontSize);
    if ( currentLineWidth == 0 ) {
      currentLineWidth = wordWidth;
    } else {
      double testWidth = (currentLineWidth + spaceWidth) + wordWidth;
      if ( testWidth > maxWidth ) {
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
PathCommand::PathCommand( ) {
  this->type = std::string("");
  this->x = 0;
  this->y = 0;
  this->x1 = 0;
  this->y1 = 0;
  this->x2 = 0;
  this->y2 = 0;
  this->rx = 0;
  this->ry = 0;
  this->rotation = 0;
  this->largeArc = false;
  this->sweep = false;
}
PathBounds::PathBounds( ) {
  this->minX = 0;
  this->minY = 0;
  this->maxX = 0;
  this->maxY = 0;
  this->width = 0;
  this->height = 0;
}
SVGPathParser::SVGPathParser( ) {
  this->pathData = std::string("");
  this->i = 0;
  this->__len = 0;
  this->currentX = 0;
  this->currentY = 0;
  this->startX = 0;
  this->startY = 0;
  std::vector<std::shared_ptr<PathCommand>> emptyCommands;
  commands = emptyCommands;
  bounds  =  std::make_shared<PathBounds>();
}
void  SVGPathParser::parse( std::string data ) {
  pathData = data;
  i = 0;
  __len = (int)(data.length());
  currentX = 0;
  currentY = 0;
  startX = 0;
  startY = 0;
  std::vector<std::shared_ptr<PathCommand>> emptyCommands;
  commands = emptyCommands;
  while (i < __len) {
    this->skipWhitespace();
    if ( i >= __len ) {
      break;
    }
    char ch = pathData.at(i);
    int chInt = ch;
    if ( ((chInt >= 65) && (chInt <= 90)) || ((chInt >= 97) && (chInt <= 122)) ) {
      this->parseCommand(ch);
    } else {
      i = i + 1;
    }
  };
  this->calculateBounds();
}
void  SVGPathParser::skipWhitespace() {
  while (i < __len) {
    char ch = pathData.at(i);
    int chInt = ch;
    if ( ((((chInt == 32) || (chInt == 9)) || (chInt == 10)) || (chInt == 13)) || (chInt == 44) ) {
      i = i + 1;
    } else {
      break;
    }
  };
}
double  SVGPathParser::parseNumber() {
  this->skipWhitespace();
  int start = i;
  char ch = pathData.at(i);
  int chInt = ch;
  if ( (chInt == 45) || (chInt == 43) ) {
    i = i + 1;
  }
  while (i < __len) {
    char ch2 = pathData.at(i);
    int chInt2 = ch2;
    if ( (chInt2 >= 48) && (chInt2 <= 57) ) {
      i = i + 1;
    } else {
      break;
    }
  };
  if ( i < __len ) {
    char ch3 = pathData.at(i);
    int chInt3 = ch3;
    if ( chInt3 == 46 ) {
      i = i + 1;
      while (i < __len) {
        char ch4 = pathData.at(i);
        int chInt4 = ch4;
        if ( (chInt4 >= 48) && (chInt4 <= 57) ) {
          i = i + 1;
        } else {
          break;
        }
      };
    }
  }
  if ( i < __len ) {
    char ch5 = pathData.at(i);
    int chInt5 = ch5;
    if ( (chInt5 == 101) || (chInt5 == 69) ) {
      i = i + 1;
      if ( i < __len ) {
        char ch6 = pathData.at(i);
        int chInt6 = ch6;
        if ( (chInt6 == 45) || (chInt6 == 43) ) {
          i = i + 1;
        }
      }
      while (i < __len) {
        char ch7 = pathData.at(i);
        int chInt7 = ch7;
        if ( (chInt7 >= 48) && (chInt7 <= 57) ) {
          i = i + 1;
        } else {
          break;
        }
      };
    }
  }
  std::string numStr = r_utf8_substr(pathData, start, i - start);
  double result = /*unwrap dbl*/(cpp_str_to_double(numStr)).value;
  return result;
}
void  SVGPathParser::parseCommand( char cmd ) {
  int cmdInt = cmd;
  /** unused:  std::string cmdStr = std::string(1, char(cmdInt))   **/ ;
  i = i + 1;
  if ( (cmdInt == 77) || (cmdInt == 109) ) {
    double x = this->parseNumber();
    double y = this->parseNumber();
    if ( cmdInt == 109 ) {
      x = currentX + x;
      y = currentY + y;
    }
    std::shared_ptr<PathCommand> pathCmd =  std::make_shared<PathCommand>();
    pathCmd->type = std::string("M");
    pathCmd->x = x;
    pathCmd->y = y;
    commands.push_back( pathCmd  );
    currentX = x;
    currentY = y;
    startX = x;
    startY = y;
    return;
  }
  if ( (cmdInt == 76) || (cmdInt == 108) ) {
    double x_1 = this->parseNumber();
    double y_1 = this->parseNumber();
    if ( cmdInt == 108 ) {
      x_1 = currentX + x_1;
      y_1 = currentY + y_1;
    }
    std::shared_ptr<PathCommand> pathCmd_1 =  std::make_shared<PathCommand>();
    pathCmd_1->type = std::string("L");
    pathCmd_1->x = x_1;
    pathCmd_1->y = y_1;
    commands.push_back( pathCmd_1  );
    currentX = x_1;
    currentY = y_1;
    return;
  }
  if ( (cmdInt == 72) || (cmdInt == 104) ) {
    double x_2 = this->parseNumber();
    if ( cmdInt == 104 ) {
      x_2 = currentX + x_2;
    }
    std::shared_ptr<PathCommand> pathCmd_2 =  std::make_shared<PathCommand>();
    pathCmd_2->type = std::string("L");
    pathCmd_2->x = x_2;
    pathCmd_2->y = currentY;
    commands.push_back( pathCmd_2  );
    currentX = x_2;
    return;
  }
  if ( (cmdInt == 86) || (cmdInt == 118) ) {
    double y_2 = this->parseNumber();
    if ( cmdInt == 118 ) {
      y_2 = currentY + y_2;
    }
    std::shared_ptr<PathCommand> pathCmd_3 =  std::make_shared<PathCommand>();
    pathCmd_3->type = std::string("L");
    pathCmd_3->x = currentX;
    pathCmd_3->y = y_2;
    commands.push_back( pathCmd_3  );
    currentY = y_2;
    return;
  }
  if ( (cmdInt == 67) || (cmdInt == 99) ) {
    double x1 = this->parseNumber();
    double y1 = this->parseNumber();
    double x2 = this->parseNumber();
    double y2 = this->parseNumber();
    double x_3 = this->parseNumber();
    double y_3 = this->parseNumber();
    if ( cmdInt == 99 ) {
      x1 = currentX + x1;
      y1 = currentY + y1;
      x2 = currentX + x2;
      y2 = currentY + y2;
      x_3 = currentX + x_3;
      y_3 = currentY + y_3;
    }
    std::shared_ptr<PathCommand> pathCmd_4 =  std::make_shared<PathCommand>();
    pathCmd_4->type = std::string("C");
    pathCmd_4->x1 = x1;
    pathCmd_4->y1 = y1;
    pathCmd_4->x2 = x2;
    pathCmd_4->y2 = y2;
    pathCmd_4->x = x_3;
    pathCmd_4->y = y_3;
    commands.push_back( pathCmd_4  );
    currentX = x_3;
    currentY = y_3;
    return;
  }
  if ( (cmdInt == 81) || (cmdInt == 113) ) {
    double x1_1 = this->parseNumber();
    double y1_1 = this->parseNumber();
    double x_4 = this->parseNumber();
    double y_4 = this->parseNumber();
    if ( cmdInt == 113 ) {
      x1_1 = currentX + x1_1;
      y1_1 = currentY + y1_1;
      x_4 = currentX + x_4;
      y_4 = currentY + y_4;
    }
    std::shared_ptr<PathCommand> pathCmd_5 =  std::make_shared<PathCommand>();
    pathCmd_5->type = std::string("Q");
    pathCmd_5->x1 = x1_1;
    pathCmd_5->y1 = y1_1;
    pathCmd_5->x = x_4;
    pathCmd_5->y = y_4;
    commands.push_back( pathCmd_5  );
    currentX = x_4;
    currentY = y_4;
    return;
  }
  if ( (cmdInt == 90) || (cmdInt == 122) ) {
    std::shared_ptr<PathCommand> pathCmd_6 =  std::make_shared<PathCommand>();
    pathCmd_6->type = std::string("Z");
    commands.push_back( pathCmd_6  );
    currentX = startX;
    currentY = startY;
    return;
  }
}
void  SVGPathParser::calculateBounds() {
  if ( ((int)(commands.size())) == 0 ) {
    return;
  }
  double minX = 999999;
  double minY = 999999;
  double maxX = -999999;
  double maxY = -999999;
  int i_1 = 0;
  while (i_1 < ((int)(commands.size()))) {
    std::shared_ptr<PathCommand> cmd = commands.at(i_1);
    if ( (cmd->type == std::string("M")) || (cmd->type == std::string("L")) ) {
      if ( cmd->x < minX ) {
        minX = cmd->x;
      }
      if ( cmd->x > maxX ) {
        maxX = cmd->x;
      }
      if ( cmd->y < minY ) {
        minY = cmd->y;
      }
      if ( cmd->y > maxY ) {
        maxY = cmd->y;
      }
    }
    if ( cmd->type == std::string("C") ) {
      if ( cmd->x1 < minX ) {
        minX = cmd->x1;
      }
      if ( cmd->x1 > maxX ) {
        maxX = cmd->x1;
      }
      if ( cmd->y1 < minY ) {
        minY = cmd->y1;
      }
      if ( cmd->y1 > maxY ) {
        maxY = cmd->y1;
      }
      if ( cmd->x2 < minX ) {
        minX = cmd->x2;
      }
      if ( cmd->x2 > maxX ) {
        maxX = cmd->x2;
      }
      if ( cmd->y2 < minY ) {
        minY = cmd->y2;
      }
      if ( cmd->y2 > maxY ) {
        maxY = cmd->y2;
      }
      if ( cmd->x < minX ) {
        minX = cmd->x;
      }
      if ( cmd->x > maxX ) {
        maxX = cmd->x;
      }
      if ( cmd->y < minY ) {
        minY = cmd->y;
      }
      if ( cmd->y > maxY ) {
        maxY = cmd->y;
      }
    }
    if ( cmd->type == std::string("Q") ) {
      if ( cmd->x1 < minX ) {
        minX = cmd->x1;
      }
      if ( cmd->x1 > maxX ) {
        maxX = cmd->x1;
      }
      if ( cmd->y1 < minY ) {
        minY = cmd->y1;
      }
      if ( cmd->y1 > maxY ) {
        maxY = cmd->y1;
      }
      if ( cmd->x < minX ) {
        minX = cmd->x;
      }
      if ( cmd->x > maxX ) {
        maxX = cmd->x;
      }
      if ( cmd->y < minY ) {
        minY = cmd->y;
      }
      if ( cmd->y > maxY ) {
        maxY = cmd->y;
      }
    }
    i_1 = i_1 + 1;
  };
  bounds->minX = minX;
  bounds->minY = minY;
  bounds->maxX = maxX;
  bounds->maxY = maxY;
  bounds->width = maxX - minX;
  bounds->height = maxY - minY;
}
std::shared_ptr<PathBounds>  SVGPathParser::getBounds() {
  std::shared_ptr<PathBounds> result = bounds;
  return result;
}
std::vector<std::shared_ptr<PathCommand>>  SVGPathParser::getCommands() {
  return commands;
}
std::vector<std::shared_ptr<PathCommand>>  SVGPathParser::getScaledCommands( double targetWidth , double targetHeight ) {
  double scaleX = 1;
  double scaleY = 1;
  if ( bounds->width > 0 ) {
    scaleX = targetWidth / bounds->width;
  }
  if ( bounds->height > 0 ) {
    scaleY = targetHeight / bounds->height;
  }
  std::vector<std::shared_ptr<PathCommand>> scaled;
  int i_1 = 0;
  while (i_1 < ((int)(commands.size()))) {
    std::shared_ptr<PathCommand> cmd = commands.at(i_1);
    std::shared_ptr<PathCommand> newCmd =  std::make_shared<PathCommand>();
    newCmd->type = cmd->type;
    if ( (cmd->type == std::string("M")) || (cmd->type == std::string("L")) ) {
      newCmd->x = (cmd->x - bounds->minX) * scaleX;
      newCmd->y = (cmd->y - bounds->minY) * scaleY;
    }
    if ( cmd->type == std::string("C") ) {
      newCmd->x1 = (cmd->x1 - bounds->minX) * scaleX;
      newCmd->y1 = (cmd->y1 - bounds->minY) * scaleY;
      newCmd->x2 = (cmd->x2 - bounds->minX) * scaleX;
      newCmd->y2 = (cmd->y2 - bounds->minY) * scaleY;
      newCmd->x = (cmd->x - bounds->minX) * scaleX;
      newCmd->y = (cmd->y - bounds->minY) * scaleY;
    }
    if ( cmd->type == std::string("Q") ) {
      newCmd->x1 = (cmd->x1 - bounds->minX) * scaleX;
      newCmd->y1 = (cmd->y1 - bounds->minY) * scaleY;
      newCmd->x = (cmd->x - bounds->minX) * scaleX;
      newCmd->y = (cmd->y - bounds->minY) * scaleY;
    }
    scaled.push_back( newCmd  );
    i_1 = i_1 + 1;
  };
  return scaled;
}
TTFTableRecord::TTFTableRecord( ) {
  this->tag = std::string("");
  this->checksum = 0;
  this->offset = 0;
  this->length = 0;
}
TTFGlyphMetrics::TTFGlyphMetrics( ) {
  this->advanceWidth = 0;
  this->leftSideBearing = 0;
}
TrueTypeFont::TrueTypeFont( ) {
  this->fontData = 
  std::vector<uint8_t>(0, 0);
  ;
  this->fontPath = std::string("");
  this->fontFamily = std::string("");
  this->fontStyle = std::string("Regular");
  this->sfntVersion = 0;
  this->numTables = 0;
  this->searchRange = 0;
  this->entrySelector = 0;
  this->rangeShift = 0;
  this->unitsPerEm = 1000;
  this->xMin = 0;
  this->yMin = 0;
  this->xMax = 0;
  this->yMax = 0;
  this->indexToLocFormat = 0;
  this->ascender = 0;
  this->descender = 0;
  this->lineGap = 0;
  this->numberOfHMetrics = 0;
  this->numGlyphs = 0;
  this->cmapFormat = 0;
  this->cmapOffset = 0;
  this->defaultWidth = 500;
  this->charWidthsLoaded = false;
  std::vector<std::shared_ptr<TTFTableRecord>> t;
  tables = t;
  std::vector<int> gw;
  glyphWidths = gw;
  std::vector<int> cw;
  charWidths = cw;
}
bool  TrueTypeFont::loadFromFile( std::string path ) {
  fontPath = path;
  int lastSlash = -1;
  int i = 0;
  while (i < ((int)(path.length()))) {
    int ch = path.at(i);
    if ( (ch == 47) || (ch == 92) ) {
      lastSlash = i;
    }
    i = i + 1;
  };
  std::string dirPath = std::string(".");
  std::string fileName = path;
  if ( lastSlash >= 0 ) {
    dirPath = r_utf8_substr(path, 0, lastSlash - 0);
    fileName = r_utf8_substr(path, (lastSlash + 1), ((int)(path.length())) - (lastSlash + 1));
  }
  if ( (r_cpp_file_exists( dirPath + std::string("/") + fileName)) == false ) {
    return false;
  }
  fontData = r_buffer_read_file(dirPath, fileName);
  if ( (static_cast<int64_t>(fontData.size())) == 0 ) {
    std::cout << std::string("TrueTypeFont: Failed to load ") + path << std::endl;
    return false;
  }
  if ( this->parseOffsetTable() == false ) {
    return false;
  }
  if ( this->parseTableDirectory() == false ) {
    return false;
  }
  this->parseHeadTable();
  this->parseHheaTable();
  this->parseMaxpTable();
  this->parseCmapTable();
  this->parseHmtxTable();
  this->parseNameTable();
  this->buildCharWidthCache();
  return true;
}
bool  TrueTypeFont::parseOffsetTable() {
  if ( (static_cast<int64_t>(fontData.size())) < 12 ) {
    return false;
  }
  sfntVersion = this->readUInt32(0);
  numTables = this->readUInt16(4);
  searchRange = this->readUInt16(6);
  entrySelector = this->readUInt16(8);
  rangeShift = this->readUInt16(10);
  return true;
}
bool  TrueTypeFont::parseTableDirectory() {
  int offset = 12;
  int i = 0;
  while (i < numTables) {
    std::shared_ptr<TTFTableRecord> record =  std::make_shared<TTFTableRecord>();
    record->tag = this->readTag(offset);
    record->checksum = this->readUInt32((offset + 4));
    record->offset = this->readUInt32((offset + 8));
    record->length = this->readUInt32((offset + 12));
    tables.push_back( record  );
    offset = offset + 16;
    i = i + 1;
  };
  return true;
}
std::shared_ptr<TTFTableRecord>  TrueTypeFont::findTable( std::string tag ) {
  int i = 0;
  while (i < ((int)(tables.size()))) {
    std::shared_ptr<TTFTableRecord> t = tables.at(i);
    if ( t->tag == tag ) {
      return t;
    }
    i = i + 1;
  };
  std::shared_ptr<TTFTableRecord> empty =  std::make_shared<TTFTableRecord>();
  return empty;
}
void  TrueTypeFont::parseHeadTable() {
  std::shared_ptr<TTFTableRecord> table = this->findTable(std::string("head"));
  if ( table->offset == 0 ) {
    return;
  }
  int off = table->offset;
  unitsPerEm = this->readUInt16((off + 18));
  xMin = this->readInt16((off + 36));
  yMin = this->readInt16((off + 38));
  xMax = this->readInt16((off + 40));
  yMax = this->readInt16((off + 42));
  indexToLocFormat = this->readInt16((off + 50));
}
void  TrueTypeFont::parseHheaTable() {
  std::shared_ptr<TTFTableRecord> table = this->findTable(std::string("hhea"));
  if ( table->offset == 0 ) {
    return;
  }
  int off = table->offset;
  ascender = this->readInt16((off + 4));
  descender = this->readInt16((off + 6));
  lineGap = this->readInt16((off + 8));
  numberOfHMetrics = this->readUInt16((off + 34));
}
void  TrueTypeFont::parseMaxpTable() {
  std::shared_ptr<TTFTableRecord> table = this->findTable(std::string("maxp"));
  if ( table->offset == 0 ) {
    return;
  }
  int off = table->offset;
  numGlyphs = this->readUInt16((off + 4));
}
void  TrueTypeFont::parseCmapTable() {
  std::shared_ptr<TTFTableRecord> table = this->findTable(std::string("cmap"));
  if ( table->offset == 0 ) {
    return;
  }
  int off = table->offset;
  int numSubtables = this->readUInt16((off + 2));
  int i = 0;
  int subtableOffset = 0;
  while (i < numSubtables) {
    int recordOff = (off + 4) + (i * 8);
    int platformID = this->readUInt16(recordOff);
    int encodingID = this->readUInt16((recordOff + 2));
    int subOff = this->readUInt32((recordOff + 4));
    if ( (platformID == 3) && (encodingID == 1) ) {
      subtableOffset = subOff;
    }
    if ( (platformID == 0) && (subtableOffset == 0) ) {
      subtableOffset = subOff;
    }
    i = i + 1;
  };
  if ( subtableOffset > 0 ) {
    cmapOffset = off + subtableOffset;
    cmapFormat = this->readUInt16(cmapOffset);
  }
}
void  TrueTypeFont::parseHmtxTable() {
  std::shared_ptr<TTFTableRecord> table = this->findTable(std::string("hmtx"));
  if ( table->offset == 0 ) {
    return;
  }
  int off = table->offset;
  int i = 0;
  while (i < numberOfHMetrics) {
    int advanceWidth = this->readUInt16((off + (i * 4)));
    glyphWidths.push_back( advanceWidth  );
    i = i + 1;
  };
  if ( numberOfHMetrics > 0 ) {
    defaultWidth = glyphWidths.at((numberOfHMetrics - 1));
  }
}
void  TrueTypeFont::parseNameTable() {
  std::shared_ptr<TTFTableRecord> table = this->findTable(std::string("name"));
  if ( table->offset == 0 ) {
    return;
  }
  int off = table->offset;
  int count = this->readUInt16((off + 2));
  int stringOffset = this->readUInt16((off + 4));
  int i = 0;
  while (i < count) {
    int recordOff = (off + 6) + (i * 12);
    int platformID = this->readUInt16(recordOff);
    /** unused:  int encodingID = this->readUInt16((recordOff + 2))   **/ ;
    /** unused:  int languageID = this->readUInt16((recordOff + 4))   **/ ;
    int nameID = this->readUInt16((recordOff + 6));
    int length = this->readUInt16((recordOff + 8));
    int strOffset = this->readUInt16((recordOff + 10));
    if ( (nameID == 1) && (platformID == 3) ) {
      int strOff = (off + stringOffset) + strOffset;
      fontFamily = this->readUnicodeString(strOff, length);
    }
    if ( ((nameID == 1) && (platformID == 1)) && (((int)(fontFamily.length())) == 0) ) {
      int strOff_1 = (off + stringOffset) + strOffset;
      fontFamily = this->readAsciiString(strOff_1, length);
    }
    if ( (nameID == 2) && (platformID == 3) ) {
      int strOff_2 = (off + stringOffset) + strOffset;
      fontStyle = this->readUnicodeString(strOff_2, length);
    }
    if ( ((nameID == 2) && (platformID == 1)) && (((int)(fontStyle.length())) == 0) ) {
      int strOff_3 = (off + stringOffset) + strOffset;
      fontStyle = this->readAsciiString(strOff_3, length);
    }
    i = i + 1;
  };
}
int  TrueTypeFont::getGlyphIndex( int charCode ) {
  if ( cmapOffset == 0 ) {
    return 0;
  }
  if ( cmapFormat == 4 ) {
    return this->getGlyphIndexFormat4(charCode);
  }
  if ( cmapFormat == 0 ) {
    if ( charCode < 256 ) {
      return this->readUInt8(((cmapOffset + 6) + charCode));
    }
  }
  if ( cmapFormat == 6 ) {
    int firstCode = this->readUInt16((cmapOffset + 6));
    int entryCount = this->readUInt16((cmapOffset + 8));
    if ( (charCode >= firstCode) && (charCode < (firstCode + entryCount)) ) {
      return this->readUInt16(((cmapOffset + 10) + ((charCode - firstCode) * 2)));
    }
  }
  return 0;
}
int  TrueTypeFont::getGlyphIndexFormat4( int charCode ) {
  int off = cmapOffset;
  int segCountX2 = this->readUInt16((off + 6));
  double segCountD = ((double)(segCountX2)) / 2;
  int segCount = (int)floor( segCountD);
  int endCodesOff = off + 14;
  int startCodesOff = (endCodesOff + segCountX2) + 2;
  int idDeltaOff = startCodesOff + segCountX2;
  int idRangeOffsetOff = idDeltaOff + segCountX2;
  int i = 0;
  while (i < segCount) {
    int endCode = this->readUInt16((endCodesOff + (i * 2)));
    int startCode = this->readUInt16((startCodesOff + (i * 2)));
    if ( (charCode >= startCode) && (charCode <= endCode) ) {
      int idDelta = this->readInt16((idDeltaOff + (i * 2)));
      int idRangeOffset = this->readUInt16((idRangeOffsetOff + (i * 2)));
      if ( idRangeOffset == 0 ) {
        return (charCode + idDelta) % 65536;
      } else {
        int glyphIdOff = ((idRangeOffsetOff + (i * 2)) + idRangeOffset) + ((charCode - startCode) * 2);
        int glyphId = this->readUInt16(glyphIdOff);
        if ( glyphId != 0 ) {
          return (glyphId + idDelta) % 65536;
        }
      }
    }
    i = i + 1;
  };
  return 0;
}
int  TrueTypeFont::getGlyphWidth( int glyphIndex ) {
  if ( glyphIndex < ((int)(glyphWidths.size())) ) {
    return glyphWidths.at(glyphIndex);
  }
  return defaultWidth;
}
void  TrueTypeFont::buildCharWidthCache() {
  int i = 0;
  while (i < 256) {
    int glyphIdx = this->getGlyphIndex(i);
    int width = this->getGlyphWidth(glyphIdx);
    charWidths.push_back( width  );
    i = i + 1;
  };
  charWidthsLoaded = true;
}
int  TrueTypeFont::getCharWidth( int charCode ) {
  if ( charWidthsLoaded && (charCode < 256) ) {
    return charWidths.at(charCode);
  }
  int glyphIdx = this->getGlyphIndex(charCode);
  return this->getGlyphWidth(glyphIdx);
}
double  TrueTypeFont::getCharWidthPoints( int charCode , double fontSize ) {
  int fontUnits = this->getCharWidth(charCode);
  return (((double)(fontUnits)) * fontSize) / ((double)(unitsPerEm));
}
double  TrueTypeFont::measureText( std::string text , double fontSize ) {
  double width = 0;
  int __len = (int)(text.length());
  int i = 0;
  while (i < __len) {
    int ch = text.at(i);
    width = width + this->getCharWidthPoints(ch, fontSize);
    i = i + 1;
  };
  return width;
}
double  TrueTypeFont::getAscender( double fontSize ) {
  return (((double)(ascender)) * fontSize) / ((double)(unitsPerEm));
}
double  TrueTypeFont::getDescender( double fontSize ) {
  return (((double)(descender)) * fontSize) / ((double)(unitsPerEm));
}
double  TrueTypeFont::getLineHeight( double fontSize ) {
  double asc = this->getAscender(fontSize);
  double desc = this->getDescender(fontSize);
  double gap = (((double)(lineGap)) * fontSize) / ((double)(unitsPerEm));
  return (asc - desc) + gap;
}
std::vector<uint8_t>  TrueTypeFont::getFontData() {
  return fontData;
}
std::string  TrueTypeFont::getPostScriptName() {
  std::string name = fontFamily;
  std::string result = std::string("");
  int i = 0;
  while (i < ((int)(name.length()))) {
    int ch = name.at(i);
    if ( ch != 32 ) {
      result = result + (std::string(1, char(ch)));
    }
    i = i + 1;
  };
  if ( ((int)(result.length())) == 0 ) {
    return std::string("CustomFont");
  }
  return result;
}
int  TrueTypeFont::readUInt8( int offset ) {
  return static_cast<int64_t>(fontData[offset]);
}
int  TrueTypeFont::readUInt16( int offset ) {
  int b1 = static_cast<int64_t>(fontData[offset]);
  int b2 = static_cast<int64_t>(fontData[(offset + 1)]);
  return (b1 * 256) + b2;
}
int  TrueTypeFont::readInt16( int offset ) {
  int val = this->readUInt16(offset);
  if ( val >= 32768 ) {
    return val - 65536;
  }
  return val;
}
int  TrueTypeFont::readUInt32( int offset ) {
  int b1 = static_cast<int64_t>(fontData[offset]);
  int b2 = static_cast<int64_t>(fontData[(offset + 1)]);
  int b3 = static_cast<int64_t>(fontData[(offset + 2)]);
  int b4 = static_cast<int64_t>(fontData[(offset + 3)]);
  int result = (((((b1 * 256) + b2) * 256) + b3) * 256) + b4;
  return result;
}
std::string  TrueTypeFont::readTag( int offset ) {
  std::string result = std::string("");
  int i = 0;
  while (i < 4) {
    int ch = static_cast<int64_t>(fontData[(offset + i)]);
    result = result + (std::string(1, char(ch)));
    i = i + 1;
  };
  return result;
}
std::string  TrueTypeFont::readAsciiString( int offset , int length ) {
  std::string result = std::string("");
  int i = 0;
  while (i < length) {
    int ch = static_cast<int64_t>(fontData[(offset + i)]);
    if ( ch > 0 ) {
      result = result + (std::string(1, char(ch)));
    }
    i = i + 1;
  };
  return result;
}
std::string  TrueTypeFont::readUnicodeString( int offset , int length ) {
  std::string result = std::string("");
  int i = 0;
  while (i < length) {
    int ch = this->readUInt16((offset + i));
    if ( (ch > 0) && (ch < 128) ) {
      result = result + (std::string(1, char(ch)));
    }
    i = i + 2;
  };
  return result;
}
void  TrueTypeFont::printInfo() {
  std::cout << ((std::string("Font: ") + fontFamily) + std::string(" ")) + fontStyle << std::endl;
  std::cout << std::string("  Units per EM: ") + (std::to_string(unitsPerEm)) << std::endl;
  std::cout << std::string("  Ascender: ") + (std::to_string(ascender)) << std::endl;
  std::cout << std::string("  Descender: ") + (std::to_string(descender)) << std::endl;
  std::cout << std::string("  Line gap: ") + (std::to_string(lineGap)) << std::endl;
  std::cout << std::string("  Num glyphs: ") + (std::to_string(numGlyphs)) << std::endl;
  std::cout << std::string("  Num hMetrics: ") + (std::to_string(numberOfHMetrics)) << std::endl;
  std::cout << std::string("  Tables: ") + (std::to_string(((int)(tables.size())))) << std::endl;
}
FontManager::FontManager( ) {
  this->fontsDirectory = std::string("./Fonts");
  this->defaultFont =  std::make_shared<TrueTypeFont>();
  this->hasDefaultFont = false;
  std::vector<std::shared_ptr<TrueTypeFont>> f;
  fonts = f;
  std::vector<std::string> n;
  fontNames = n;
  std::vector<std::string> fd;
  fontsDirectories = fd;
}
void  FontManager::setFontsDirectory( std::string path ) {
  fontsDirectory = path;
}
int  FontManager::getFontCount() {
  return (int)(fonts.size());
}
void  FontManager::addFontsDirectory( std::string path ) {
  fontsDirectories.push_back( path  );
}
void  FontManager::setFontsDirectories( std::string paths ) {
  int start = 0;
  int i = 0;
  int __len = (int)(paths.length());
  while (i <= __len) {
    std::string ch = std::string("");
    if ( i < __len ) {
      ch = r_utf8_substr(paths, i, (i + 1) - i);
    }
    if ( (ch == std::string(";")) || (i == __len) ) {
      if ( i > start ) {
        std::string part = r_utf8_substr(paths, start, i - start);
        fontsDirectories.push_back( part  );
        std::cout << std::string("FontManager: Added fonts directory: ") + part << std::endl;
      }
      start = i + 1;
    }
    i = i + 1;
  };
  if ( ((int)(fontsDirectories.size())) > 0 ) {
    fontsDirectory = fontsDirectories.at(0);
  }
}
bool  FontManager::loadFont( std::string relativePath ) {
  int i = 0;
  while (i < ((int)(fontsDirectories.size()))) {
    std::string dir = fontsDirectories.at(i);
    std::string fullPath = (dir + std::string("/")) + relativePath;
    std::shared_ptr<TrueTypeFont> font =  std::make_shared<TrueTypeFont>();
    if ( font->loadFromFile(fullPath) == true ) {
      fonts.push_back( font  );
      fontNames.push_back( font->fontFamily  );
      if ( hasDefaultFont == false ) {
        defaultFont = font;
        hasDefaultFont = true;
      }
      std::cout << ((((std::string("FontManager: Loaded font '") + font->fontFamily) + std::string("' (")) + font->fontStyle) + std::string(") from ")) + fullPath << std::endl;
      return true;
    }
    i = i + 1;
  };
  std::string fullPath_1 = (fontsDirectory + std::string("/")) + relativePath;
  std::shared_ptr<TrueTypeFont> font_1 =  std::make_shared<TrueTypeFont>();
  if ( font_1->loadFromFile(fullPath_1) == false ) {
    std::cout << std::string("FontManager: Failed to load font: ") + relativePath << std::endl;
    return false;
  }
  fonts.push_back( font_1  );
  fontNames.push_back( font_1->fontFamily  );
  if ( hasDefaultFont == false ) {
    defaultFont = font_1;
    hasDefaultFont = true;
  }
  std::cout << (((std::string("FontManager: Loaded font '") + font_1->fontFamily) + std::string("' (")) + font_1->fontStyle) + std::string(")") << std::endl;
  return true;
}
void  FontManager::loadFontFamily( std::string familyDir ) {
  this->loadFont(((familyDir + std::string("/")) + familyDir) + std::string("-Regular.ttf"));
}
std::shared_ptr<TrueTypeFont>  FontManager::getFont( std::string fontFamily ) {
  int i = 0;
  while (i < ((int)(fonts.size()))) {
    std::shared_ptr<TrueTypeFont> f = fonts.at(i);
    if ( f->fontFamily == fontFamily ) {
      return f;
    }
    i = i + 1;
  };
  i = 0;
  while (i < ((int)(fonts.size()))) {
    std::shared_ptr<TrueTypeFont> f_1 = fonts.at(i);
    if ( (r_string_index_of(f_1->fontFamily , fontFamily)) >= 0 ) {
      return f_1;
    }
    i = i + 1;
  };
  return defaultFont;
}
double  FontManager::measureText( std::string text , std::string fontFamily , double fontSize ) {
  std::shared_ptr<TrueTypeFont> font = this->getFont(fontFamily);
  if ( font->unitsPerEm > 0 ) {
    return font->measureText(text, fontSize);
  }
  return (((double)(((int)(text.length())))) * fontSize) * 0.5;
}
double  FontManager::getLineHeight( std::string fontFamily , double fontSize ) {
  std::shared_ptr<TrueTypeFont> font = this->getFont(fontFamily);
  if ( font->unitsPerEm > 0 ) {
    return font->getLineHeight(fontSize);
  }
  return fontSize * 1.2;
}
double  FontManager::getAscender( std::string fontFamily , double fontSize ) {
  std::shared_ptr<TrueTypeFont> font = this->getFont(fontFamily);
  if ( font->unitsPerEm > 0 ) {
    return font->getAscender(fontSize);
  }
  return fontSize * 0.8;
}
double  FontManager::getDescender( std::string fontFamily , double fontSize ) {
  std::shared_ptr<TrueTypeFont> font = this->getFont(fontFamily);
  if ( font->unitsPerEm > 0 ) {
    return font->getDescender(fontSize);
  }
  return fontSize * -0.2;
}
std::vector<uint8_t>  FontManager::getFontData( std::string fontFamily ) {
  std::shared_ptr<TrueTypeFont> font = this->getFont(fontFamily);
  return font->getFontData();
}
std::string  FontManager::getPostScriptName( std::string fontFamily ) {
  std::shared_ptr<TrueTypeFont> font = this->getFont(fontFamily);
  return font->getPostScriptName();
}
void  FontManager::printLoadedFonts() {
  std::cout << (std::string("FontManager: ") + (std::to_string(((int)(fonts.size()))))) + std::string(" fonts loaded:") << std::endl;
  int i = 0;
  while (i < ((int)(fonts.size()))) {
    std::shared_ptr<TrueTypeFont> f = fonts.at(i);
    std::cout << (((std::string("  - ") + f->fontFamily) + std::string(" (")) + f->fontStyle) + std::string(")") << std::endl;
    i = i + 1;
  };
}
TTFTextMeasurer::TTFTextMeasurer( std::shared_ptr<FontManager> fm  ) {
  fontManager  = fm;
}
std::shared_ptr<EVGTextMetrics>  TTFTextMeasurer::measureText( std::string text , std::string fontFamily , double fontSize ) {
  double width = fontManager->measureText(text, fontFamily, fontSize);
  double lineHeight = fontManager->getLineHeight(fontFamily, fontSize);
  double ascent = fontManager->getAscender(fontFamily, fontSize);
  double descent = fontManager->getDescender(fontFamily, fontSize);
  std::shared_ptr<EVGTextMetrics> metrics =  std::make_shared<EVGTextMetrics>();
  metrics->width = width;
  metrics->height = lineHeight;
  metrics->ascent = ascent;
  metrics->descent = descent;
  metrics->lineHeight = lineHeight;
  return metrics;
}
double  TTFTextMeasurer::measureTextWidth( std::string text , std::string fontFamily , double fontSize ) {
  return fontManager->measureText(text, fontFamily, fontSize);
}
double  TTFTextMeasurer::getLineHeight( std::string fontFamily , double fontSize ) {
  return fontManager->getLineHeight(fontFamily, fontSize);
}
double  TTFTextMeasurer::measureChar( int ch , std::string fontFamily , double fontSize ) {
  std::shared_ptr<TrueTypeFont> font = fontManager->getFont(fontFamily);
  if ( font->unitsPerEm > 0 ) {
    return font->getCharWidthPoints(ch, fontSize);
  }
  return fontSize * 0.5;
}
BitReader::BitReader( ) {
  this->data = 
  std::vector<uint8_t>(0, 0);
  ;
  this->dataStart = 0;
  this->dataEnd = 0;
  this->bytePos = 0;
  this->bitPos = 0;
  this->currentByte = 0;
  this->eof = false;
}
void  BitReader::init( std::vector<uint8_t> buf , int startPos , int length ) {
  data = buf;
  dataStart = startPos;
  dataEnd = startPos + length;
  bytePos = startPos;
  bitPos = 0;
  currentByte = 0;
  eof = false;
}
void  BitReader::loadNextByte() {
  if ( bytePos >= dataEnd ) {
    eof = true;
    currentByte = 0;
    bitPos = 8;
    return;
  }
  currentByte = static_cast<int64_t>(data[bytePos]);
  bytePos = bytePos + 1;
  if ( currentByte == 255 ) {
    if ( bytePos < dataEnd ) {
      int nextByte = static_cast<int64_t>(data[bytePos]);
      if ( nextByte == 0 ) {
        bytePos = bytePos + 1;
      } else {
        if ( (nextByte >= 208) && (nextByte <= 215) ) {
          bytePos = bytePos + 1;
          this->loadNextByte();
          return;
        }
        if ( nextByte == 255 ) {
          bytePos = bytePos + 1;
          this->loadNextByte();
          return;
        }
      }
    }
  }
  bitPos = 8;
}
int  BitReader::readBit() {
  if ( bitPos == 0 ) {
    this->loadNextByte();
  }
  if ( eof ) {
    return 0;
  }
  bitPos = bitPos - 1;
  int bit = (((((currentByte) >> (bitPos)))) & (1));
  return bit;
}
int  BitReader::readBits( int count ) {
  int result = 0;
  int i = 0;
  while (i < count) {
    result = (((((result) << (1)))) | (this->readBit()));
    i = i + 1;
  };
  return result;
}
int  BitReader::peekBits( int count ) {
  int savedBytePos = bytePos;
  int savedBitPos = bitPos;
  int savedCurrentByte = currentByte;
  bool savedEof = eof;
  int result = this->readBits(count);
  bytePos = savedBytePos;
  bitPos = savedBitPos;
  currentByte = savedCurrentByte;
  eof = savedEof;
  return result;
}
void  BitReader::alignToByte() {
  bitPos = 0;
}
int  BitReader::getBytePosition() {
  return bytePos;
}
bool  BitReader::isEOF() {
  return eof;
}
int  BitReader::receiveExtend( int length ) {
  if ( length == 0 ) {
    return 0;
  }
  int value = this->readBits(length);
  int threshold = ((1) << ((length - 1)));
  if ( value < threshold ) {
    value = value - ((((threshold) << (1))) - 1);
  }
  return value;
}
HuffmanTable::HuffmanTable( ) {
  this->bits = 
  std::vector<int64_t>(16, 0);
  ;
  this->maxCode = 
  std::vector<int64_t>(16, 0);
  ;
  this->minCode = 
  std::vector<int64_t>(16, 0);
  ;
  this->valPtr = 
  std::vector<int64_t>(16, 0);
  ;
  this->tableClass = 0;
  this->tableId = 0;
  int i = 0;
  while (i < 16) {
    bits[i] = 0;
    maxCode[i] = -1;
    minCode[i] = 0;
    valPtr[i] = 0;
    i = i + 1;
  };
}
void  HuffmanTable::build() {
  int code = 0;
  int valueIdx = 0;
  int i = 0;
  while (i < 16) {
    int count = bits[i];
    if ( count > 0 ) {
      minCode[i] = code;
      valPtr[i] = valueIdx;
      valueIdx = valueIdx + count;
      code = code + count;
      maxCode[i] = code - 1;
    } else {
      maxCode[i] = -1;
      minCode[i] = 0;
      valPtr[i] = valueIdx;
    }
    code = ((code) << (1));
    i = i + 1;
  };
}
int  HuffmanTable::decode( std::shared_ptr<BitReader> reader ) {
  int code = 0;
  int length = 0;
  while (length < 16) {
    int bit = reader->readBit();
    code = (((((code) << (1)))) | (bit));
    int maxC = maxCode[length];
    if ( maxC >= 0 ) {
      if ( code <= maxC ) {
        int minC = minCode[length];
        int ptr = valPtr[length];
        int idx = ptr + (code - minC);
        return values.at(idx);
      }
    }
    length = length + 1;
  };
  std::cout << std::string("Huffman decode error: code not found") << std::endl;
  return 0;
}
void  HuffmanTable::resetArrays() {
  int i = 0;
  while (i < 16) {
    bits[i] = 0;
    maxCode[i] = -1;
    minCode[i] = 0;
    valPtr[i] = 0;
    i = i + 1;
  };
  values.clear();
}
HuffmanDecoder::HuffmanDecoder( ) {
  this->dcTable0 =  std::make_shared<HuffmanTable>();
  this->dcTable1 =  std::make_shared<HuffmanTable>();
  this->acTable0 =  std::make_shared<HuffmanTable>();
  this->acTable1 =  std::make_shared<HuffmanTable>();
}
std::shared_ptr<HuffmanTable>  HuffmanDecoder::getDCTable( int id ) {
  if ( id == 0 ) {
    return dcTable0;
  }
  return dcTable1;
}
std::shared_ptr<HuffmanTable>  HuffmanDecoder::getACTable( int id ) {
  if ( id == 0 ) {
    return acTable0;
  }
  return acTable1;
}
void  HuffmanDecoder::parseDHT( std::vector<uint8_t> data , int pos , int length ) {
  int endPos = pos + length;
  while (pos < endPos) {
    int tableInfo = static_cast<int64_t>(data[pos]);
    pos = pos + 1;
    int tableClass = ((tableInfo) >> (4));
    int tableId = ((tableInfo) & (15));
    std::shared_ptr<HuffmanTable> table = this->getDCTable(tableId);
    if ( tableClass == 1 ) {
      table = this->getACTable(tableId);
    }
    table->tableClass = tableClass;
    table->tableId = tableId;
    table->resetArrays();
    int totalSymbols = 0;
    int i = 0;
    while (i < 16) {
      int count = static_cast<int64_t>(data[pos]);
      table->bits[i] = count;
      totalSymbols = totalSymbols + count;
      pos = pos + 1;
      i = i + 1;
    };
    i = 0;
    while (i < totalSymbols) {
      table->values.push_back( static_cast<int64_t>(data[pos])  );
      pos = pos + 1;
      i = i + 1;
    };
    table->build();
    std::string classStr = std::string("DC");
    if ( tableClass == 1 ) {
      classStr = std::string("AC");
    }
    std::cout << ((((std::string("  Huffman table ") + classStr) + (std::to_string(tableId))) + std::string(": ")) + (std::to_string(totalSymbols))) + std::string(" symbols") << std::endl;
  };
}
IDCT::IDCT( ) {
  this->cosTable = 
  std::vector<int64_t>(64, 0);
  ;
  this->zigzagMap = 
  std::vector<int64_t>(64, 0);
  ;
  cosTable[0] = 1024;
  cosTable[1] = 1004;
  cosTable[2] = 946;
  cosTable[3] = 851;
  cosTable[4] = 724;
  cosTable[5] = 569;
  cosTable[6] = 392;
  cosTable[7] = 200;
  cosTable[8] = 1024;
  cosTable[9] = 851;
  cosTable[10] = 392;
  cosTable[11] = -200;
  cosTable[12] = -724;
  cosTable[13] = -1004;
  cosTable[14] = -946;
  cosTable[15] = -569;
  cosTable[16] = 1024;
  cosTable[17] = 569;
  cosTable[18] = -392;
  cosTable[19] = -1004;
  cosTable[20] = -724;
  cosTable[21] = 200;
  cosTable[22] = 946;
  cosTable[23] = 851;
  cosTable[24] = 1024;
  cosTable[25] = 200;
  cosTable[26] = -946;
  cosTable[27] = -569;
  cosTable[28] = 724;
  cosTable[29] = 851;
  cosTable[30] = -392;
  cosTable[31] = -1004;
  cosTable[32] = 1024;
  cosTable[33] = -200;
  cosTable[34] = -946;
  cosTable[35] = 569;
  cosTable[36] = 724;
  cosTable[37] = -851;
  cosTable[38] = -392;
  cosTable[39] = 1004;
  cosTable[40] = 1024;
  cosTable[41] = -569;
  cosTable[42] = -392;
  cosTable[43] = 1004;
  cosTable[44] = -724;
  cosTable[45] = -200;
  cosTable[46] = 946;
  cosTable[47] = -851;
  cosTable[48] = 1024;
  cosTable[49] = -851;
  cosTable[50] = 392;
  cosTable[51] = 200;
  cosTable[52] = -724;
  cosTable[53] = 1004;
  cosTable[54] = -946;
  cosTable[55] = 569;
  cosTable[56] = 1024;
  cosTable[57] = -1004;
  cosTable[58] = 946;
  cosTable[59] = -851;
  cosTable[60] = 724;
  cosTable[61] = -569;
  cosTable[62] = 392;
  cosTable[63] = -200;
  zigzagMap[0] = 0;
  zigzagMap[1] = 1;
  zigzagMap[2] = 8;
  zigzagMap[3] = 16;
  zigzagMap[4] = 9;
  zigzagMap[5] = 2;
  zigzagMap[6] = 3;
  zigzagMap[7] = 10;
  zigzagMap[8] = 17;
  zigzagMap[9] = 24;
  zigzagMap[10] = 32;
  zigzagMap[11] = 25;
  zigzagMap[12] = 18;
  zigzagMap[13] = 11;
  zigzagMap[14] = 4;
  zigzagMap[15] = 5;
  zigzagMap[16] = 12;
  zigzagMap[17] = 19;
  zigzagMap[18] = 26;
  zigzagMap[19] = 33;
  zigzagMap[20] = 40;
  zigzagMap[21] = 48;
  zigzagMap[22] = 41;
  zigzagMap[23] = 34;
  zigzagMap[24] = 27;
  zigzagMap[25] = 20;
  zigzagMap[26] = 13;
  zigzagMap[27] = 6;
  zigzagMap[28] = 7;
  zigzagMap[29] = 14;
  zigzagMap[30] = 21;
  zigzagMap[31] = 28;
  zigzagMap[32] = 35;
  zigzagMap[33] = 42;
  zigzagMap[34] = 49;
  zigzagMap[35] = 56;
  zigzagMap[36] = 57;
  zigzagMap[37] = 50;
  zigzagMap[38] = 43;
  zigzagMap[39] = 36;
  zigzagMap[40] = 29;
  zigzagMap[41] = 22;
  zigzagMap[42] = 15;
  zigzagMap[43] = 23;
  zigzagMap[44] = 30;
  zigzagMap[45] = 37;
  zigzagMap[46] = 44;
  zigzagMap[47] = 51;
  zigzagMap[48] = 58;
  zigzagMap[49] = 59;
  zigzagMap[50] = 52;
  zigzagMap[51] = 45;
  zigzagMap[52] = 38;
  zigzagMap[53] = 31;
  zigzagMap[54] = 39;
  zigzagMap[55] = 46;
  zigzagMap[56] = 53;
  zigzagMap[57] = 60;
  zigzagMap[58] = 61;
  zigzagMap[59] = 54;
  zigzagMap[60] = 47;
  zigzagMap[61] = 55;
  zigzagMap[62] = 62;
  zigzagMap[63] = 63;
}
std::vector<int64_t>  IDCT::dezigzag( std::vector<int64_t> zigzag ) {
  std::vector<int64_t> block = std::vector<int64_t>(64, 0);
  int i = 0;
  while (i < 64) {
    int pos = zigzagMap[i];
    int val = zigzag[i];
    block[pos] = val;
    i = i + 1;
  };
  return block;
}
void  IDCT::idct1d( std::vector<int64_t> input , int startIdx , int stride , std::vector<int64_t>& output , int outIdx , int outStride ) {
  int x = 0;
  while (x < 8) {
    int sum = 0;
    int u = 0;
    while (u < 8) {
      int coeff = input[(startIdx + (u * stride))];
      if ( coeff != 0 ) {
        int cosVal = cosTable[((x * 8) + u)];
        int contrib = coeff * cosVal;
        if ( u == 0 ) {
          contrib = (((contrib * 724)) >> (10));
        }
        sum = sum + contrib;
      }
      u = u + 1;
    };
    output[outIdx + (x * outStride)] = ((sum) >> (11));
    x = x + 1;
  };
}
void  IDCT::transform( std::vector<int64_t> block , std::vector<int64_t>& output ) {
  std::vector<int64_t> temp = std::vector<int64_t>(64, 0);
  int row = 0;
  while (row < 8) {
    int rowStart = row * 8;
    this->idct1d(block, rowStart, 1, temp, rowStart, 1);
    row = row + 1;
  };
  int col = 0;
  while (col < 8) {
    this->idct1d(temp, col, 8, output, col, 8);
    col = col + 1;
  };
  int i = 0;
  while (i < 64) {
    int val = (output[i]) + 128;
    if ( val < 0 ) {
      val = 0;
    }
    if ( val > 255 ) {
      val = 255;
    }
    output[i] = val;
    i = i + 1;
  };
}
void  IDCT::transformFast( std::vector<int64_t> coeffs , std::vector<int64_t> output ) {
  this->transform(coeffs, output);
}
Color::Color( ) {
  this->r = 0;
  this->g = 0;
  this->b = 0;
  this->a = 255;
}
void  Color::setRGB( int red , int green , int blue ) {
  r = red;
  g = green;
  b = blue;
  a = 255;
}
void  Color::setRGBA( int red , int green , int blue , int alpha ) {
  r = red;
  g = green;
  b = blue;
  a = alpha;
}
int  Color::clamp( int val ) {
  if ( val < 0 ) {
    return 0;
  }
  if ( val > 255 ) {
    return 255;
  }
  return val;
}
void  Color::set( int red , int green , int blue ) {
  r = this->clamp(red);
  g = this->clamp(green);
  b = this->clamp(blue);
}
int  Color::grayscale() {
  return (((((r * 77) + (g * 150)) + (b * 29))) >> (8));
}
void  Color::toGrayscale() {
  int gray = this->grayscale();
  r = gray;
  g = gray;
  b = gray;
}
void  Color::invert() {
  r = 255 - r;
  g = 255 - g;
  b = 255 - b;
}
void  Color::adjustBrightness( int amount ) {
  r = this->clamp((r + amount));
  g = this->clamp((g + amount));
  b = this->clamp((b + amount));
}
ImageBuffer::ImageBuffer( ) {
  this->width = 0;
  this->height = 0;
  this->pixels = 
  std::vector<uint8_t>(0, 0);
  ;
}
void  ImageBuffer::init( int w , int h ) {
  width = w;
  height = h;
  int size = (w * h) * 4;
  pixels = std::vector<uint8_t>(size, 0);
  this->fill(255, 255, 255, 255);
}
int  ImageBuffer::getPixelOffset( int x , int y ) {
  return ((y * width) + x) * 4;
}
bool  ImageBuffer::isValidCoord( int x , int y ) {
  if ( x < 0 ) {
    return false;
  }
  if ( y < 0 ) {
    return false;
  }
  if ( x >= width ) {
    return false;
  }
  if ( y >= height ) {
    return false;
  }
  return true;
}
std::shared_ptr<Color>  ImageBuffer::getPixel( int x , int y ) {
  std::shared_ptr<Color> c =  std::make_shared<Color>();
  if ( this->isValidCoord(x, y) ) {
    int off = this->getPixelOffset(x, y);
    c->r = static_cast<int64_t>(pixels[off]);
    c->g = static_cast<int64_t>(pixels[(off + 1)]);
    c->b = static_cast<int64_t>(pixels[(off + 2)]);
    c->a = static_cast<int64_t>(pixels[(off + 3)]);
  }
  return c;
}
void  ImageBuffer::setPixel( int x , int y , std::shared_ptr<Color> c ) {
  if ( this->isValidCoord(x, y) ) {
    int off = this->getPixelOffset(x, y);
    pixels[off] = static_cast<uint8_t>(c->r);
    pixels[off + 1] = static_cast<uint8_t>(c->g);
    pixels[off + 2] = static_cast<uint8_t>(c->b);
    pixels[off + 3] = static_cast<uint8_t>(c->a);
  }
}
void  ImageBuffer::setPixelRGB( int x , int y , int r , int g , int b ) {
  if ( this->isValidCoord(x, y) ) {
    int off = this->getPixelOffset(x, y);
    pixels[off] = static_cast<uint8_t>(r);
    pixels[off + 1] = static_cast<uint8_t>(g);
    pixels[off + 2] = static_cast<uint8_t>(b);
    pixels[off + 3] = static_cast<uint8_t>(255);
  }
}
void  ImageBuffer::fill( int r , int g , int b , int a ) {
  int size = (width * height) * 4;
  int i = 0;
  while (i < size) {
    pixels[i] = static_cast<uint8_t>(r);
    pixels[i + 1] = static_cast<uint8_t>(g);
    pixels[i + 2] = static_cast<uint8_t>(b);
    pixels[i + 3] = static_cast<uint8_t>(a);
    i = i + 4;
  };
}
void  ImageBuffer::fillRect( int x , int y , int w , int h , std::shared_ptr<Color> c ) {
  int endX = x + w;
  int endY = y + h;
  int py = y;
  while (py < endY) {
    int px = x;
    while (px < endX) {
      this->setPixel(px, py, c);
      px = px + 1;
    };
    py = py + 1;
  };
}
void  ImageBuffer::invert() {
  int size = width * height;
  int i = 0;
  while (i < size) {
    int off = i * 4;
    int r = static_cast<int64_t>(pixels[off]);
    int g = static_cast<int64_t>(pixels[(off + 1)]);
    int b = static_cast<int64_t>(pixels[(off + 2)]);
    pixels[off] = static_cast<uint8_t>(255 - r);
    pixels[off + 1] = static_cast<uint8_t>(255 - g);
    pixels[off + 2] = static_cast<uint8_t>(255 - b);
    i = i + 1;
  };
}
void  ImageBuffer::grayscale() {
  int size = width * height;
  int i = 0;
  while (i < size) {
    int off = i * 4;
    int r = static_cast<int64_t>(pixels[off]);
    int g = static_cast<int64_t>(pixels[(off + 1)]);
    int b = static_cast<int64_t>(pixels[(off + 2)]);
    int gray = (((((r * 77) + (g * 150)) + (b * 29))) >> (8));
    pixels[off] = static_cast<uint8_t>(gray);
    pixels[off + 1] = static_cast<uint8_t>(gray);
    pixels[off + 2] = static_cast<uint8_t>(gray);
    i = i + 1;
  };
}
void  ImageBuffer::adjustBrightness( int amount ) {
  int size = width * height;
  int i = 0;
  while (i < size) {
    int off = i * 4;
    int r = static_cast<int64_t>(pixels[off]);
    int g = static_cast<int64_t>(pixels[(off + 1)]);
    int b = static_cast<int64_t>(pixels[(off + 2)]);
    r = r + amount;
    g = g + amount;
    b = b + amount;
    if ( r < 0 ) {
      r = 0;
    }
    if ( r > 255 ) {
      r = 255;
    }
    if ( g < 0 ) {
      g = 0;
    }
    if ( g > 255 ) {
      g = 255;
    }
    if ( b < 0 ) {
      b = 0;
    }
    if ( b > 255 ) {
      b = 255;
    }
    pixels[off] = static_cast<uint8_t>(r);
    pixels[off + 1] = static_cast<uint8_t>(g);
    pixels[off + 2] = static_cast<uint8_t>(b);
    i = i + 1;
  };
}
void  ImageBuffer::threshold( int level ) {
  int size = width * height;
  int i = 0;
  while (i < size) {
    int off = i * 4;
    int r = static_cast<int64_t>(pixels[off]);
    int g = static_cast<int64_t>(pixels[(off + 1)]);
    int b = static_cast<int64_t>(pixels[(off + 2)]);
    int gray = (((((r * 77) + (g * 150)) + (b * 29))) >> (8));
    int val = 0;
    if ( gray >= level ) {
      val = 255;
    }
    pixels[off] = static_cast<uint8_t>(val);
    pixels[off + 1] = static_cast<uint8_t>(val);
    pixels[off + 2] = static_cast<uint8_t>(val);
    i = i + 1;
  };
}
void  ImageBuffer::sepia() {
  int size = width * height;
  int i = 0;
  while (i < size) {
    int off = i * 4;
    int r = static_cast<int64_t>(pixels[off]);
    int g = static_cast<int64_t>(pixels[(off + 1)]);
    int b = static_cast<int64_t>(pixels[(off + 2)]);
    int newR = (((((r * 101) + (g * 197)) + (b * 48))) >> (8));
    int newG = (((((r * 89) + (g * 175)) + (b * 43))) >> (8));
    int newB = (((((r * 70) + (g * 137)) + (b * 33))) >> (8));
    if ( newR > 255 ) {
      newR = 255;
    }
    if ( newG > 255 ) {
      newG = 255;
    }
    if ( newB > 255 ) {
      newB = 255;
    }
    pixels[off] = static_cast<uint8_t>(newR);
    pixels[off + 1] = static_cast<uint8_t>(newG);
    pixels[off + 2] = static_cast<uint8_t>(newB);
    i = i + 1;
  };
}
void  ImageBuffer::flipHorizontal() {
  int y = 0;
  while (y < height) {
    int x = 0;
    int halfW = ((width) >> (1));
    while (x < halfW) {
      int x2 = (width - 1) - x;
      int off1 = this->getPixelOffset(x, y);
      int off2 = this->getPixelOffset(x2, y);
      int r1 = static_cast<int64_t>(pixels[off1]);
      int g1 = static_cast<int64_t>(pixels[(off1 + 1)]);
      int b1 = static_cast<int64_t>(pixels[(off1 + 2)]);
      int a1 = static_cast<int64_t>(pixels[(off1 + 3)]);
      int r2 = static_cast<int64_t>(pixels[off2]);
      int g2 = static_cast<int64_t>(pixels[(off2 + 1)]);
      int b2 = static_cast<int64_t>(pixels[(off2 + 2)]);
      int a2 = static_cast<int64_t>(pixels[(off2 + 3)]);
      pixels[off1] = static_cast<uint8_t>(r2);
      pixels[off1 + 1] = static_cast<uint8_t>(g2);
      pixels[off1 + 2] = static_cast<uint8_t>(b2);
      pixels[off1 + 3] = static_cast<uint8_t>(a2);
      pixels[off2] = static_cast<uint8_t>(r1);
      pixels[off2 + 1] = static_cast<uint8_t>(g1);
      pixels[off2 + 2] = static_cast<uint8_t>(b1);
      pixels[off2 + 3] = static_cast<uint8_t>(a1);
      x = x + 1;
    };
    y = y + 1;
  };
}
void  ImageBuffer::flipVertical() {
  int y = 0;
  int halfH = ((height) >> (1));
  while (y < halfH) {
    int y2 = (height - 1) - y;
    int x = 0;
    while (x < width) {
      int off1 = this->getPixelOffset(x, y);
      int off2 = this->getPixelOffset(x, y2);
      int r1 = static_cast<int64_t>(pixels[off1]);
      int g1 = static_cast<int64_t>(pixels[(off1 + 1)]);
      int b1 = static_cast<int64_t>(pixels[(off1 + 2)]);
      int a1 = static_cast<int64_t>(pixels[(off1 + 3)]);
      int r2 = static_cast<int64_t>(pixels[off2]);
      int g2 = static_cast<int64_t>(pixels[(off2 + 1)]);
      int b2 = static_cast<int64_t>(pixels[(off2 + 2)]);
      int a2 = static_cast<int64_t>(pixels[(off2 + 3)]);
      pixels[off1] = static_cast<uint8_t>(r2);
      pixels[off1 + 1] = static_cast<uint8_t>(g2);
      pixels[off1 + 2] = static_cast<uint8_t>(b2);
      pixels[off1 + 3] = static_cast<uint8_t>(a2);
      pixels[off2] = static_cast<uint8_t>(r1);
      pixels[off2 + 1] = static_cast<uint8_t>(g1);
      pixels[off2 + 2] = static_cast<uint8_t>(b1);
      pixels[off2 + 3] = static_cast<uint8_t>(a1);
      x = x + 1;
    };
    y = y + 1;
  };
}
void  ImageBuffer::drawLine( int x1 , int y1 , int x2 , int y2 , std::shared_ptr<Color> c ) {
  int dx = x2 - x1;
  int dy = y2 - y1;
  if ( dx < 0 ) {
    dx = 0 - dx;
  }
  if ( dy < 0 ) {
    dy = 0 - dy;
  }
  int sx = 1;
  if ( x1 > x2 ) {
    sx = -1;
  }
  int sy = 1;
  if ( y1 > y2 ) {
    sy = -1;
  }
  int err = dx - dy;
  int x = x1;
  int y = y1;
  bool done = false;
  while (done == false) {
    this->setPixel(x, y, c);
    if ( (x == x2) && (y == y2) ) {
      done = true;
    } else {
      int e2 = err * 2;
      if ( e2 > (0 - dy) ) {
        err = err - dy;
        x = x + sx;
      }
      if ( e2 < dx ) {
        err = err + dx;
        y = y + sy;
      }
    }
  };
}
void  ImageBuffer::drawRect( int x , int y , int w , int h , std::shared_ptr<Color> c ) {
  this->drawLine(x, y, (x + w) - 1, y, c);
  this->drawLine((x + w) - 1, y, (x + w) - 1, (y + h) - 1, c);
  this->drawLine((x + w) - 1, (y + h) - 1, x, (y + h) - 1, c);
  this->drawLine(x, (y + h) - 1, x, y, c);
}
std::shared_ptr<ImageBuffer>  ImageBuffer::scale( int factor ) {
  int newW = width * factor;
  int newH = height * factor;
  return this->scaleToSize(newW, newH);
}
std::shared_ptr<ImageBuffer>  ImageBuffer::scaleToSize( int newW , int newH ) {
  std::shared_ptr<ImageBuffer> result =  std::make_shared<ImageBuffer>();
  result->init(newW, newH);
  double scaleX = ((double)(width)) / ((double)(newW));
  double scaleY = ((double)(height)) / ((double)(newH));
  int destY = 0;
  while (destY < newH) {
    double srcYf = ((double)(destY)) * scaleY;
    int srcY0 = (int)floor( srcYf);
    int srcY1 = srcY0 + 1;
    if ( srcY1 >= height ) {
      srcY1 = height - 1;
    }
    double fy = srcYf - ((double)(srcY0));
    int destX = 0;
    while (destX < newW) {
      double srcXf = ((double)(destX)) * scaleX;
      int srcX0 = (int)floor( srcXf);
      int srcX1 = srcX0 + 1;
      if ( srcX1 >= width ) {
        srcX1 = width - 1;
      }
      double fx = srcXf - ((double)(srcX0));
      int off00 = ((srcY0 * width) + srcX0) * 4;
      int off01 = ((srcY0 * width) + srcX1) * 4;
      int off10 = ((srcY1 * width) + srcX0) * 4;
      int off11 = ((srcY1 * width) + srcX1) * 4;
      int r = this->bilinear((static_cast<int64_t>(pixels[off00])), (static_cast<int64_t>(pixels[off01])), (static_cast<int64_t>(pixels[off10])), (static_cast<int64_t>(pixels[off11])), fx, fy);
      int g = this->bilinear((static_cast<int64_t>(pixels[(off00 + 1)])), (static_cast<int64_t>(pixels[(off01 + 1)])), (static_cast<int64_t>(pixels[(off10 + 1)])), (static_cast<int64_t>(pixels[(off11 + 1)])), fx, fy);
      int b = this->bilinear((static_cast<int64_t>(pixels[(off00 + 2)])), (static_cast<int64_t>(pixels[(off01 + 2)])), (static_cast<int64_t>(pixels[(off10 + 2)])), (static_cast<int64_t>(pixels[(off11 + 2)])), fx, fy);
      int a = this->bilinear((static_cast<int64_t>(pixels[(off00 + 3)])), (static_cast<int64_t>(pixels[(off01 + 3)])), (static_cast<int64_t>(pixels[(off10 + 3)])), (static_cast<int64_t>(pixels[(off11 + 3)])), fx, fy);
      int destOff = ((destY * newW) + destX) * 4;
      result->pixels[destOff] = static_cast<uint8_t>(r);
      result->pixels[destOff + 1] = static_cast<uint8_t>(g);
      result->pixels[destOff + 2] = static_cast<uint8_t>(b);
      result->pixels[destOff + 3] = static_cast<uint8_t>(a);
      destX = destX + 1;
    };
    destY = destY + 1;
  };
  return result;
}
int  ImageBuffer::bilinear( int v00 , int v01 , int v10 , int v11 , double fx , double fy ) {
  double top = (((double)(v00)) * (1 - fx)) + (((double)(v01)) * fx);
  double bottom = (((double)(v10)) * (1 - fx)) + (((double)(v11)) * fx);
  double result = (top * (1 - fy)) + (bottom * fy);
  return (int)floor( result);
}
std::shared_ptr<ImageBuffer>  ImageBuffer::rotate90CW() {
  std::shared_ptr<ImageBuffer> result =  std::make_shared<ImageBuffer>();
  result->init(height, width);
  int y = 0;
  while (y < height) {
    int x = 0;
    while (x < width) {
      int newX = (height - 1) - y;
      int newY = x;
      int srcOff = ((y * width) + x) * 4;
      int destOff = ((newY * height) + newX) * 4;
      result->pixels[destOff] = static_cast<uint8_t>(static_cast<int64_t>(pixels[srcOff]));
      result->pixels[destOff + 1] = static_cast<uint8_t>(static_cast<int64_t>(pixels[(srcOff + 1)]));
      result->pixels[destOff + 2] = static_cast<uint8_t>(static_cast<int64_t>(pixels[(srcOff + 2)]));
      result->pixels[destOff + 3] = static_cast<uint8_t>(static_cast<int64_t>(pixels[(srcOff + 3)]));
      x = x + 1;
    };
    y = y + 1;
  };
  return result;
}
std::shared_ptr<ImageBuffer>  ImageBuffer::rotate180() {
  std::shared_ptr<ImageBuffer> result =  std::make_shared<ImageBuffer>();
  result->init(width, height);
  int y = 0;
  while (y < height) {
    int x = 0;
    while (x < width) {
      int newX = (width - 1) - x;
      int newY = (height - 1) - y;
      int srcOff = ((y * width) + x) * 4;
      int destOff = ((newY * width) + newX) * 4;
      result->pixels[destOff] = static_cast<uint8_t>(static_cast<int64_t>(pixels[srcOff]));
      result->pixels[destOff + 1] = static_cast<uint8_t>(static_cast<int64_t>(pixels[(srcOff + 1)]));
      result->pixels[destOff + 2] = static_cast<uint8_t>(static_cast<int64_t>(pixels[(srcOff + 2)]));
      result->pixels[destOff + 3] = static_cast<uint8_t>(static_cast<int64_t>(pixels[(srcOff + 3)]));
      x = x + 1;
    };
    y = y + 1;
  };
  return result;
}
std::shared_ptr<ImageBuffer>  ImageBuffer::rotate270CW() {
  std::shared_ptr<ImageBuffer> result =  std::make_shared<ImageBuffer>();
  result->init(height, width);
  int y = 0;
  while (y < height) {
    int x = 0;
    while (x < width) {
      int newX = y;
      int newY = (width - 1) - x;
      int srcOff = ((y * width) + x) * 4;
      int destOff = ((newY * height) + newX) * 4;
      result->pixels[destOff] = static_cast<uint8_t>(static_cast<int64_t>(pixels[srcOff]));
      result->pixels[destOff + 1] = static_cast<uint8_t>(static_cast<int64_t>(pixels[(srcOff + 1)]));
      result->pixels[destOff + 2] = static_cast<uint8_t>(static_cast<int64_t>(pixels[(srcOff + 2)]));
      result->pixels[destOff + 3] = static_cast<uint8_t>(static_cast<int64_t>(pixels[(srcOff + 3)]));
      x = x + 1;
    };
    y = y + 1;
  };
  return result;
}
std::shared_ptr<ImageBuffer>  ImageBuffer::transpose() {
  std::shared_ptr<ImageBuffer> result =  std::make_shared<ImageBuffer>();
  result->init(height, width);
  int y = 0;
  while (y < height) {
    int x = 0;
    while (x < width) {
      int srcOff = ((y * width) + x) * 4;
      int destOff = ((x * height) + y) * 4;
      result->pixels[destOff] = static_cast<uint8_t>(static_cast<int64_t>(pixels[srcOff]));
      result->pixels[destOff + 1] = static_cast<uint8_t>(static_cast<int64_t>(pixels[(srcOff + 1)]));
      result->pixels[destOff + 2] = static_cast<uint8_t>(static_cast<int64_t>(pixels[(srcOff + 2)]));
      result->pixels[destOff + 3] = static_cast<uint8_t>(static_cast<int64_t>(pixels[(srcOff + 3)]));
      x = x + 1;
    };
    y = y + 1;
  };
  return result;
}
std::shared_ptr<ImageBuffer>  ImageBuffer::transverse() {
  std::shared_ptr<ImageBuffer> result =  std::make_shared<ImageBuffer>();
  result->init(height, width);
  int y = 0;
  while (y < height) {
    int x = 0;
    while (x < width) {
      int newX = (height - 1) - y;
      int newY = (width - 1) - x;
      int srcOff = ((y * width) + x) * 4;
      int destOff = ((newY * height) + newX) * 4;
      result->pixels[destOff] = static_cast<uint8_t>(static_cast<int64_t>(pixels[srcOff]));
      result->pixels[destOff + 1] = static_cast<uint8_t>(static_cast<int64_t>(pixels[(srcOff + 1)]));
      result->pixels[destOff + 2] = static_cast<uint8_t>(static_cast<int64_t>(pixels[(srcOff + 2)]));
      result->pixels[destOff + 3] = static_cast<uint8_t>(static_cast<int64_t>(pixels[(srcOff + 3)]));
      x = x + 1;
    };
    y = y + 1;
  };
  return result;
}
std::shared_ptr<ImageBuffer>  ImageBuffer::applyExifOrientation( int orientation ) {
  if ( orientation == 1 ) {
    return this->scale(1);
  }
  if ( orientation == 2 ) {
    std::shared_ptr<ImageBuffer> result =  std::make_shared<ImageBuffer>();
    result->init(width, height);
    int y = 0;
    while (y < height) {
      int x = 0;
      while (x < width) {
        int srcOff = ((y * width) + x) * 4;
        int destOff = ((y * width) + ((width - 1) - x)) * 4;
        result->pixels[destOff] = static_cast<uint8_t>(static_cast<int64_t>(pixels[srcOff]));
        result->pixels[destOff + 1] = static_cast<uint8_t>(static_cast<int64_t>(pixels[(srcOff + 1)]));
        result->pixels[destOff + 2] = static_cast<uint8_t>(static_cast<int64_t>(pixels[(srcOff + 2)]));
        result->pixels[destOff + 3] = static_cast<uint8_t>(static_cast<int64_t>(pixels[(srcOff + 3)]));
        x = x + 1;
      };
      y = y + 1;
    };
    return result;
  }
  if ( orientation == 3 ) {
    return this->rotate180();
  }
  if ( orientation == 4 ) {
    std::shared_ptr<ImageBuffer> result_1 =  std::make_shared<ImageBuffer>();
    result_1->init(width, height);
    int y_1 = 0;
    while (y_1 < height) {
      int x_1 = 0;
      while (x_1 < width) {
        int srcOff_1 = ((y_1 * width) + x_1) * 4;
        int destOff_1 = ((((height - 1) - y_1) * width) + x_1) * 4;
        result_1->pixels[destOff_1] = static_cast<uint8_t>(static_cast<int64_t>(pixels[srcOff_1]));
        result_1->pixels[destOff_1 + 1] = static_cast<uint8_t>(static_cast<int64_t>(pixels[(srcOff_1 + 1)]));
        result_1->pixels[destOff_1 + 2] = static_cast<uint8_t>(static_cast<int64_t>(pixels[(srcOff_1 + 2)]));
        result_1->pixels[destOff_1 + 3] = static_cast<uint8_t>(static_cast<int64_t>(pixels[(srcOff_1 + 3)]));
        x_1 = x_1 + 1;
      };
      y_1 = y_1 + 1;
    };
    return result_1;
  }
  if ( orientation == 5 ) {
    return this->transpose();
  }
  if ( orientation == 6 ) {
    return this->rotate90CW();
  }
  if ( orientation == 7 ) {
    return this->transverse();
  }
  if ( orientation == 8 ) {
    return this->rotate270CW();
  }
  return this->scale(1);
}
PPMImage::PPMImage( ) {
}
int  PPMImage::parseNumber( std::vector<uint8_t> data , int startPos , std::vector<int>& endPos ) {
  int __len = static_cast<int64_t>(data.size());
  int pos = startPos;
  bool skipping = true;
  while (skipping && (pos < __len)) {
    int ch = static_cast<int64_t>(data[pos]);
    if ( (((ch == 32) || (ch == 10)) || (ch == 13)) || (ch == 9) ) {
      pos = pos + 1;
    } else {
      skipping = false;
    }
  };
  int value = 0;
  bool parsing = true;
  while (parsing && (pos < __len)) {
    int ch_1 = static_cast<int64_t>(data[pos]);
    if ( (ch_1 >= 48) && (ch_1 <= 57) ) {
      value = (value * 10) + (ch_1 - 48);
      pos = pos + 1;
    } else {
      parsing = false;
    }
  };
  endPos[0] = pos;
  return value;
}
int  PPMImage::skipToNextLine( std::vector<uint8_t> data , int pos ) {
  int __len = static_cast<int64_t>(data.size());
  while (pos < __len) {
    int ch = static_cast<int64_t>(data[pos]);
    pos = pos + 1;
    if ( ch == 10 ) {
      return pos;
    }
  };
  return pos;
}
std::shared_ptr<ImageBuffer>  PPMImage::load( std::string dirPath , std::string fileName ) {
  std::vector<uint8_t> data = r_buffer_read_file(dirPath, fileName);
  int __len = static_cast<int64_t>(data.size());
  if ( __len < 10 ) {
    std::cout << std::string("Error: File too small: ") + fileName << std::endl;
    std::shared_ptr<ImageBuffer> errImg =  std::make_shared<ImageBuffer>();
    errImg->init(1, 1);
    return errImg;
  }
  int m1 = static_cast<int64_t>(data[0]);
  int m2 = static_cast<int64_t>(data[1]);
  if ( (m1 != 80) || ((m2 != 54) && (m2 != 51)) ) {
    std::cout << std::string("Error: Not a PPM file (P3 or P6): ") + fileName << std::endl;
    std::shared_ptr<ImageBuffer> errImg_1 =  std::make_shared<ImageBuffer>();
    errImg_1->init(1, 1);
    return errImg_1;
  }
  bool isBinary = m2 == 54;
  int pos = 2;
  std::vector<int> endPos;
  endPos.push_back( 0  );
  bool skippingComments = true;
  while (skippingComments && (pos < __len)) {
    int ch = static_cast<int64_t>(data[pos]);
    if ( (((ch == 32) || (ch == 10)) || (ch == 13)) || (ch == 9) ) {
      pos = pos + 1;
    } else {
      if ( ch == 35 ) {
        pos = this->skipToNextLine(data, pos);
      } else {
        skippingComments = false;
      }
    }
  };
  int width = this->parseNumber(data, pos, endPos);
  pos = endPos.at(0);
  int height = this->parseNumber(data, pos, endPos);
  pos = endPos.at(0);
  int maxVal = this->parseNumber(data, pos, endPos);
  pos = endPos.at(0);
  if ( pos < __len ) {
    pos = pos + 1;
  }
  std::cout << ((((std::string("Loading PPM: ") + (std::to_string(width))) + std::string("x")) + (std::to_string(height))) + std::string(", maxval=")) + (std::to_string(maxVal)) << std::endl;
  std::shared_ptr<ImageBuffer> img =  std::make_shared<ImageBuffer>();
  img->init(width, height);
  if ( isBinary ) {
    int y = 0;
    while (y < height) {
      int x = 0;
      while (x < width) {
        if ( (pos + 2) < __len ) {
          int r = static_cast<int64_t>(data[pos]);
          int g = static_cast<int64_t>(data[(pos + 1)]);
          int b = static_cast<int64_t>(data[(pos + 2)]);
          img->setPixelRGB(x, y, r, g, b);
          pos = pos + 3;
        }
        x = x + 1;
      };
      y = y + 1;
    };
  } else {
    int y_1 = 0;
    while (y_1 < height) {
      int x_1 = 0;
      while (x_1 < width) {
        int r_1 = this->parseNumber(data, pos, endPos);
        pos = endPos.at(0);
        int g_1 = this->parseNumber(data, pos, endPos);
        pos = endPos.at(0);
        int b_1 = this->parseNumber(data, pos, endPos);
        pos = endPos.at(0);
        img->setPixelRGB(x_1, y_1, r_1, g_1, b_1);
        x_1 = x_1 + 1;
      };
      y_1 = y_1 + 1;
    };
  }
  return img;
}
void  PPMImage::save( std::shared_ptr<ImageBuffer> img , std::string dirPath , std::string fileName ) {
  std::shared_ptr<GrowableBuffer> buf =  std::make_shared<GrowableBuffer>();
  buf->writeString(std::string("P6\n"));
  buf->writeString((((std::to_string(img->width)) + std::string(" ")) + (std::to_string(img->height))) + std::string("\n"));
  buf->writeString(std::string("255\n"));
  int y = 0;
  while (y < img->height) {
    int x = 0;
    while (x < img->width) {
      std::shared_ptr<Color> c = img->getPixel(x, y);
      buf->writeByte(c->r);
      buf->writeByte(c->g);
      buf->writeByte(c->b);
      x = x + 1;
    };
    y = y + 1;
  };
  std::vector<uint8_t> data = buf->toBuffer();
  r_buffer_write_file(dirPath, fileName, data);
  std::cout << ((std::string("Saved PPM: ") + dirPath) + std::string("/")) + fileName << std::endl;
}
void  PPMImage::saveP3( std::shared_ptr<ImageBuffer> img , std::string dirPath , std::string fileName ) {
  std::shared_ptr<GrowableBuffer> buf =  std::make_shared<GrowableBuffer>();
  buf->writeString(std::string("P3\n"));
  buf->writeString(std::string("# Created by Ranger ImageEditor\n"));
  buf->writeString((((std::to_string(img->width)) + std::string(" ")) + (std::to_string(img->height))) + std::string("\n"));
  buf->writeString(std::string("255\n"));
  int y = 0;
  while (y < img->height) {
    int x = 0;
    while (x < img->width) {
      std::shared_ptr<Color> c = img->getPixel(x, y);
      buf->writeString(((((std::to_string(c->r)) + std::string(" ")) + (std::to_string(c->g))) + std::string(" ")) + (std::to_string(c->b)));
      if ( x < (img->width - 1) ) {
        buf->writeString(std::string("  "));
      }
      x = x + 1;
    };
    buf->writeString(std::string("\n"));
    y = y + 1;
  };
  std::vector<uint8_t> data = buf->toBuffer();
  r_buffer_write_file(dirPath, fileName, data);
  std::cout << ((std::string("Saved PPM (ASCII): ") + dirPath) + std::string("/")) + fileName << std::endl;
}
JPEGComponent::JPEGComponent( ) {
  this->id = 0;
  this->hSamp = 1;
  this->vSamp = 1;
  this->quantTableId = 0;
  this->dcTableId = 0;
  this->acTableId = 0;
  this->prevDC = 0;
}
QuantizationTable::QuantizationTable( ) {
  this->id = 0;
  int i_1 = 0;
  while (i_1 < 64) {
    values.push_back( 1  );
    i_1 = i_1 + 1;
  };
}
JPEGDecoder::JPEGDecoder( ) {
  this->data = 
  std::vector<uint8_t>(0, 0);
  ;
  this->dataLen = 0;
  this->width = 0;
  this->height = 0;
  this->numComponents = 0;
  this->precision = 8;
  this->scanDataStart = 0;
  this->scanDataLen = 0;
  this->mcuWidth = 8;
  this->mcuHeight = 8;
  this->mcusPerRow = 0;
  this->mcusPerCol = 0;
  this->maxHSamp = 1;
  this->maxVSamp = 1;
  this->restartInterval = 0;
  huffman  =  std::make_shared<HuffmanDecoder>();
  idct  =  std::make_shared<IDCT>();
  int i_2 = 0;
  while (i_2 < 4) {
    quantTables.push_back(  std::make_shared<QuantizationTable>()  );
    i_2 = i_2 + 1;
  };
}
int  JPEGDecoder::readUint16BE( int pos ) {
  int high = static_cast<int64_t>(data[pos]);
  int low = static_cast<int64_t>(data[(pos + 1)]);
  return (high * 256) + low;
}
void  JPEGDecoder::parseSOF( int pos , int length ) {
  precision = static_cast<int64_t>(data[pos]);
  height = this->readUint16BE((pos + 1));
  width = this->readUint16BE((pos + 3));
  numComponents = static_cast<int64_t>(data[(pos + 5)]);
  std::cout << (((((std::string("  Image: ") + (std::to_string(width))) + std::string("x")) + (std::to_string(height))) + std::string(", ")) + (std::to_string(numComponents))) + std::string(" components") << std::endl;
  components.clear();
  maxHSamp = 1;
  maxVSamp = 1;
  int i = 0;
  int offset = pos + 6;
  while (i < numComponents) {
    std::shared_ptr<JPEGComponent> comp =  std::make_shared<JPEGComponent>();
    comp->id = static_cast<int64_t>(data[offset]);
    int sampling = static_cast<int64_t>(data[(offset + 1)]);
    comp->hSamp = ((sampling) >> (4));
    comp->vSamp = ((sampling) & (15));
    comp->quantTableId = static_cast<int64_t>(data[(offset + 2)]);
    if ( comp->hSamp > maxHSamp ) {
      maxHSamp = comp->hSamp;
    }
    if ( comp->vSamp > maxVSamp ) {
      maxVSamp = comp->vSamp;
    }
    components.push_back( comp  );
    std::cout << ((((((std::string("    Component ") + (std::to_string(comp->id))) + std::string(": ")) + (std::to_string(comp->hSamp))) + std::string("x")) + (std::to_string(comp->vSamp))) + std::string(" sampling, quant table ")) + (std::to_string(comp->quantTableId)) << std::endl;
    offset = offset + 3;
    i = i + 1;
  };
  mcuWidth = maxHSamp * 8;
  mcuHeight = maxVSamp * 8;
  mcusPerRow = (int)floor( (((width + mcuWidth) - 1) / mcuWidth));
  mcusPerCol = (int)floor( (((height + mcuHeight) - 1) / mcuHeight));
  std::cout << ((((((std::string("  MCU size: ") + (std::to_string(mcuWidth))) + std::string("x")) + (std::to_string(mcuHeight))) + std::string(", grid: ")) + (std::to_string(mcusPerRow))) + std::string("x")) + (std::to_string(mcusPerCol)) << std::endl;
}
void  JPEGDecoder::parseDQT( int pos , int length ) {
  int endPos = pos + length;
  while (pos < endPos) {
    int info = static_cast<int64_t>(data[pos]);
    pos = pos + 1;
    int precision_1 = ((info) >> (4));
    int tableId = ((info) & (15));
    std::shared_ptr<QuantizationTable> table = quantTables.at(tableId);
    table->id = tableId;
    table->values.clear();
    int i = 0;
    while (i < 64) {
      if ( precision_1 == 0 ) {
        table->values.push_back( static_cast<int64_t>(data[pos])  );
        pos = pos + 1;
      } else {
        table->values.push_back( this->readUint16BE(pos)  );
        pos = pos + 2;
      }
      i = i + 1;
    };
    std::cout << (((std::string("  Quantization table ") + (std::to_string(tableId))) + std::string(" (")) + (std::to_string((precision_1 + 1)))) + std::string("-byte values)") << std::endl;
  };
}
void  JPEGDecoder::parseSOS( int pos , int length ) {
  int numScanComponents = static_cast<int64_t>(data[pos]);
  pos = pos + 1;
  int i = 0;
  while (i < numScanComponents) {
    int compId = static_cast<int64_t>(data[pos]);
    int tableSelect = static_cast<int64_t>(data[(pos + 1)]);
    pos = pos + 2;
    int j = 0;
    while (j < numComponents) {
      std::shared_ptr<JPEGComponent> comp = components.at(j);
      if ( comp->id == compId ) {
        comp->dcTableId = ((tableSelect) >> (4));
        comp->acTableId = ((tableSelect) & (15));
        std::cout << ((((std::string("    Component ") + (std::to_string(compId))) + std::string(": DC table ")) + (std::to_string(comp->dcTableId))) + std::string(", AC table ")) + (std::to_string(comp->acTableId)) << std::endl;
      }
      j = j + 1;
    };
    i = i + 1;
  };
  pos = pos + 3;
  scanDataStart = pos;
  int searchPos = pos;
  while (searchPos < (dataLen - 1)) {
    int b = static_cast<int64_t>(data[searchPos]);
    if ( b == 255 ) {
      int nextB = static_cast<int64_t>(data[(searchPos + 1)]);
      if ( (nextB != 0) && (nextB != 255) ) {
        if ( (nextB >= 208) && (nextB <= 215) ) {
          searchPos = searchPos + 2;
          continue;
        }
        scanDataLen = searchPos - scanDataStart;
        return;
      }
    }
    searchPos = searchPos + 1;
  };
  scanDataLen = dataLen - scanDataStart;
}
bool  JPEGDecoder::parseMarkers() {
  int pos = 0;
  if ( dataLen < 2 ) {
    std::cout << std::string("Error: File too small") << std::endl;
    return false;
  }
  int m1 = static_cast<int64_t>(data[0]);
  int m2 = static_cast<int64_t>(data[1]);
  if ( (m1 != 255) || (m2 != 216) ) {
    std::cout << std::string("Error: Not a JPEG file (missing SOI)") << std::endl;
    return false;
  }
  pos = 2;
  std::cout << std::string("Parsing JPEG markers...") << std::endl;
  while (pos < (dataLen - 1)) {
    int marker1 = static_cast<int64_t>(data[pos]);
    if ( marker1 != 255 ) {
      pos = pos + 1;
      continue;
    }
    int marker2 = static_cast<int64_t>(data[(pos + 1)]);
    if ( marker2 == 255 ) {
      pos = pos + 1;
      continue;
    }
    if ( marker2 == 0 ) {
      pos = pos + 2;
      continue;
    }
    if ( marker2 == 216 ) {
      pos = pos + 2;
      continue;
    }
    if ( marker2 == 217 ) {
      std::cout << std::string("  End of Image") << std::endl;
      return true;
    }
    if ( (marker2 >= 208) && (marker2 <= 215) ) {
      pos = pos + 2;
      continue;
    }
    if ( (pos + 4) > dataLen ) {
      return true;
    }
    int markerLen = this->readUint16BE((pos + 2));
    int dataStart = pos + 4;
    int markerDataLen = markerLen - 2;
    if ( marker2 == 192 ) {
      std::cout << std::string("  SOF0 (Baseline DCT)") << std::endl;
      this->parseSOF(dataStart, markerDataLen);
    }
    if ( marker2 == 193 ) {
      std::cout << std::string("  SOF1 (Extended Sequential DCT)") << std::endl;
      this->parseSOF(dataStart, markerDataLen);
    }
    if ( marker2 == 194 ) {
      std::cout << std::string("  SOF2 (Progressive DCT) - NOT SUPPORTED") << std::endl;
      return false;
    }
    if ( marker2 == 196 ) {
      std::cout << std::string("  DHT (Huffman Tables)") << std::endl;
      huffman->parseDHT(data, dataStart, markerDataLen);
    }
    if ( marker2 == 219 ) {
      std::cout << std::string("  DQT (Quantization Tables)") << std::endl;
      this->parseDQT(dataStart, markerDataLen);
    }
    if ( marker2 == 221 ) {
      restartInterval = this->readUint16BE(dataStart);
      std::cout << (std::string("  DRI (Restart Interval: ") + (std::to_string(restartInterval))) + std::string(")") << std::endl;
    }
    if ( marker2 == 218 ) {
      std::cout << std::string("  SOS (Start of Scan)") << std::endl;
      this->parseSOS(dataStart, markerDataLen);
      pos = scanDataStart + scanDataLen;
      continue;
    }
    if ( marker2 == 224 ) {
      std::cout << std::string("  APP0 (JFIF)") << std::endl;
    }
    if ( marker2 == 225 ) {
      std::cout << std::string("  APP1 (EXIF)") << std::endl;
    }
    if ( marker2 == 254 ) {
      std::cout << std::string("  COM (Comment)") << std::endl;
    }
    pos = (pos + 2) + markerLen;
  };
  return true;
}
std::vector<int64_t>  JPEGDecoder::decodeBlock( std::shared_ptr<BitReader> reader , std::shared_ptr<JPEGComponent> comp , std::shared_ptr<QuantizationTable> quantTable ) {
  std::vector<int64_t> coeffs = std::vector<int64_t>(64, 0);
  std::fill(coeffs.begin()+0, coeffs.begin()+64, 0);
  std::shared_ptr<HuffmanTable> dcTable = huffman->getDCTable(comp->dcTableId);
  int dcCategory = dcTable->decode(reader);
  int dcDiff = reader->receiveExtend(dcCategory);
  int dcValue = comp->prevDC + dcDiff;
  comp->prevDC = dcValue;
  int dcQuant = quantTable->values.at(0);
  coeffs[0] = dcValue * dcQuant;
  std::shared_ptr<HuffmanTable> acTable = huffman->getACTable(comp->acTableId);
  int k = 1;
  while (k < 64) {
    int acSymbol = acTable->decode(reader);
    if ( acSymbol == 0 ) {
      k = 64;
    } else {
      int runLength = ((acSymbol) >> (4));
      int acCategory = ((acSymbol) & (15));
      if ( acSymbol == 240 ) {
        k = k + 16;
      } else {
        k = k + runLength;
        if ( k < 64 ) {
          int acValue = reader->receiveExtend(acCategory);
          int acQuant = quantTable->values.at(k);
          coeffs[k] = acValue * acQuant;
          k = k + 1;
        }
      }
    }
  };
  return coeffs;
}
std::shared_ptr<ImageBuffer>  JPEGDecoder::decode( std::string dirPath , std::string fileName ) {
  data = r_buffer_read_file(dirPath, fileName);
  dataLen = static_cast<int64_t>(data.size());
  std::cout << (((std::string("Decoding JPEG: ") + fileName) + std::string(" (")) + (std::to_string(dataLen))) + std::string(" bytes)") << std::endl;
  bool ok = this->parseMarkers();
  if ( ok == false ) {
    std::cout << std::string("Error parsing JPEG markers") << std::endl;
    std::shared_ptr<ImageBuffer> errImg =  std::make_shared<ImageBuffer>();
    errImg->init(1, 1);
    return errImg;
  }
  if ( (width == 0) || (height == 0) ) {
    std::cout << std::string("Error: Invalid image dimensions") << std::endl;
    std::shared_ptr<ImageBuffer> errImg_1 =  std::make_shared<ImageBuffer>();
    errImg_1->init(1, 1);
    return errImg_1;
  }
  std::cout << (std::string("Decoding ") + (std::to_string(scanDataLen))) + std::string(" bytes of scan data...") << std::endl;
  std::shared_ptr<ImageBuffer> img =  std::make_shared<ImageBuffer>();
  img->init(width, height);
  std::shared_ptr<BitReader> reader =  std::make_shared<BitReader>();
  reader->init(data, scanDataStart, scanDataLen);
  int c = 0;
  while (c < numComponents) {
    std::shared_ptr<JPEGComponent> comp = components.at(c);
    comp->prevDC = 0;
    c = c + 1;
  };
  std::vector<int> yBlocksData;
  int yBlockCount = 0;
  std::vector<int> cbBlock;
  std::vector<int> crBlock;
  int mcuCount = 0;
  int mcuY = 0;
  while (mcuY < mcusPerCol) {
    int mcuX = 0;
    while (mcuX < mcusPerRow) {
      if ( ((restartInterval > 0) && (mcuCount > 0)) && ((mcuCount % restartInterval) == 0) ) {
        c = 0;
        while (c < numComponents) {
          std::shared_ptr<JPEGComponent> compRst = components.at(c);
          compRst->prevDC = 0;
          c = c + 1;
        };
        reader->alignToByte();
      }
      yBlocksData.clear();
      yBlockCount = 0;
      int compIdx = 0;
      while (compIdx < numComponents) {
        std::shared_ptr<JPEGComponent> comp_1 = components.at(compIdx);
        std::shared_ptr<QuantizationTable> quantTable = quantTables.at(comp_1->quantTableId);
        int blockV = 0;
        while (blockV < comp_1->vSamp) {
          int blockH = 0;
          while (blockH < comp_1->hSamp) {
            std::vector<int64_t> coeffs = this->decodeBlock(reader, comp_1, quantTable);
            std::vector<int64_t> blockPixels = std::vector<int64_t>(64, 0);
            std::fill(blockPixels.begin()+0, blockPixels.begin()+64, 0);
            std::vector<int64_t> tempBlock = idct->dezigzag(coeffs);
            idct->transform(tempBlock, blockPixels);
            if ( compIdx == 0 ) {
              int bi = 0;
              while (bi < 64) {
                yBlocksData.push_back( blockPixels[bi]  );
                bi = bi + 1;
              };
              yBlockCount = yBlockCount + 1;
            }
            if ( compIdx == 1 ) {
              cbBlock.clear();
              int bi_1 = 0;
              while (bi_1 < 64) {
                cbBlock.push_back( blockPixels[bi_1]  );
                bi_1 = bi_1 + 1;
              };
            }
            if ( compIdx == 2 ) {
              crBlock.clear();
              int bi_2 = 0;
              while (bi_2 < 64) {
                crBlock.push_back( blockPixels[bi_2]  );
                bi_2 = bi_2 + 1;
              };
            }
            blockH = blockH + 1;
          };
          blockV = blockV + 1;
        };
        compIdx = compIdx + 1;
      };
      this->writeMCU(img, mcuX, mcuY, yBlocksData, yBlockCount, cbBlock, crBlock);
      mcuX = mcuX + 1;
      mcuCount = mcuCount + 1;
    };
    mcuY = mcuY + 1;
    if ( (mcuY % 10) == 0 ) {
      std::cout << ((std::string("  Row ") + (std::to_string(mcuY))) + std::string("/")) + (std::to_string(mcusPerCol)) << std::endl;
    }
  };
  std::cout << std::string("Decode complete!") << std::endl;
  return img;
}
void  JPEGDecoder::writeMCU( std::shared_ptr<ImageBuffer> img , int mcuX , int mcuY , std::vector<int> yBlocksData , int yBlockCount , std::vector<int> cbBlock , std::vector<int> crBlock ) {
  int baseX = mcuX * mcuWidth;
  int baseY = mcuY * mcuHeight;
  /** unused:  std::shared_ptr<JPEGComponent> comp0 = components.at(0)   **/ ;
  if ( (maxHSamp == 1) && (maxVSamp == 1) ) {
    int py = 0;
    while (py < 8) {
      int px = 0;
      while (px < 8) {
        int imgX = baseX + px;
        int imgY = baseY + py;
        if ( (imgX < width) && (imgY < height) ) {
          int idx = (py * 8) + px;
          int y = yBlocksData.at(idx);
          int cb = 128;
          int cr = 128;
          if ( numComponents >= 3 ) {
            cb = cbBlock.at(idx);
            cr = crBlock.at(idx);
          }
          int r = y + ((((359 * (cr - 128))) >> (8)));
          int g = (y - ((((88 * (cb - 128))) >> (8)))) - ((((183 * (cr - 128))) >> (8)));
          int b = y + ((((454 * (cb - 128))) >> (8)));
          if ( r < 0 ) {
            r = 0;
          }
          if ( r > 255 ) {
            r = 255;
          }
          if ( g < 0 ) {
            g = 0;
          }
          if ( g > 255 ) {
            g = 255;
          }
          if ( b < 0 ) {
            b = 0;
          }
          if ( b > 255 ) {
            b = 255;
          }
          img->setPixelRGB(imgX, imgY, r, g, b);
        }
        px = px + 1;
      };
      py = py + 1;
    };
    return;
  }
  if ( (maxHSamp == 2) && (maxVSamp == 2) ) {
    int blockIdx = 0;
    int blockY = 0;
    while (blockY < 2) {
      int blockX = 0;
      while (blockX < 2) {
        int yBlockOffset = blockIdx * 64;
        int py_1 = 0;
        while (py_1 < 8) {
          int px_1 = 0;
          while (px_1 < 8) {
            int imgX_1 = (baseX + (blockX * 8)) + px_1;
            int imgY_1 = (baseY + (blockY * 8)) + py_1;
            if ( (imgX_1 < width) && (imgY_1 < height) ) {
              int yIdx = (yBlockOffset + (py_1 * 8)) + px_1;
              int y_1 = yBlocksData.at(yIdx);
              int chromaX = (blockX * 4) + (((px_1) >> (1)));
              int chromaY = (blockY * 4) + (((py_1) >> (1)));
              int chromaIdx = (chromaY * 8) + chromaX;
              int cb_1 = 128;
              int cr_1 = 128;
              if ( numComponents >= 3 ) {
                cb_1 = cbBlock.at(chromaIdx);
                cr_1 = crBlock.at(chromaIdx);
              }
              int r_1 = y_1 + ((((359 * (cr_1 - 128))) >> (8)));
              int g_1 = (y_1 - ((((88 * (cb_1 - 128))) >> (8)))) - ((((183 * (cr_1 - 128))) >> (8)));
              int b_1 = y_1 + ((((454 * (cb_1 - 128))) >> (8)));
              if ( r_1 < 0 ) {
                r_1 = 0;
              }
              if ( r_1 > 255 ) {
                r_1 = 255;
              }
              if ( g_1 < 0 ) {
                g_1 = 0;
              }
              if ( g_1 > 255 ) {
                g_1 = 255;
              }
              if ( b_1 < 0 ) {
                b_1 = 0;
              }
              if ( b_1 > 255 ) {
                b_1 = 255;
              }
              img->setPixelRGB(imgX_1, imgY_1, r_1, g_1, b_1);
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
  if ( (maxHSamp == 2) && (maxVSamp == 1) ) {
    int blockX_1 = 0;
    while (blockX_1 < 2) {
      int yBlockOffset_1 = blockX_1 * 64;
      int py_2 = 0;
      while (py_2 < 8) {
        int px_2 = 0;
        while (px_2 < 8) {
          int imgX_2 = (baseX + (blockX_1 * 8)) + px_2;
          int imgY_2 = baseY + py_2;
          if ( (imgX_2 < width) && (imgY_2 < height) ) {
            int yIdx_1 = (yBlockOffset_1 + (py_2 * 8)) + px_2;
            int y_2 = yBlocksData.at(yIdx_1);
            int chromaX_1 = (blockX_1 * 4) + (((px_2) >> (1)));
            int chromaY_1 = py_2;
            int chromaIdx_1 = (chromaY_1 * 8) + chromaX_1;
            int cb_2 = 128;
            int cr_2 = 128;
            if ( numComponents >= 3 ) {
              cb_2 = cbBlock.at(chromaIdx_1);
              cr_2 = crBlock.at(chromaIdx_1);
            }
            int r_2 = y_2 + ((((359 * (cr_2 - 128))) >> (8)));
            int g_2 = (y_2 - ((((88 * (cb_2 - 128))) >> (8)))) - ((((183 * (cr_2 - 128))) >> (8)));
            int b_2 = y_2 + ((((454 * (cb_2 - 128))) >> (8)));
            if ( r_2 < 0 ) {
              r_2 = 0;
            }
            if ( r_2 > 255 ) {
              r_2 = 255;
            }
            if ( g_2 < 0 ) {
              g_2 = 0;
            }
            if ( g_2 > 255 ) {
              g_2 = 255;
            }
            if ( b_2 < 0 ) {
              b_2 = 0;
            }
            if ( b_2 > 255 ) {
              b_2 = 255;
            }
            img->setPixelRGB(imgX_2, imgY_2, r_2, g_2, b_2);
          }
          px_2 = px_2 + 1;
        };
        py_2 = py_2 + 1;
      };
      blockX_1 = blockX_1 + 1;
    };
    return;
  }
  if ( yBlockCount > 0 ) {
    int py_3 = 0;
    while (py_3 < 8) {
      int px_3 = 0;
      while (px_3 < 8) {
        int imgX_3 = baseX + px_3;
        int imgY_3 = baseY + py_3;
        if ( (imgX_3 < width) && (imgY_3 < height) ) {
          int y_3 = yBlocksData.at(((py_3 * 8) + px_3));
          img->setPixelRGB(imgX_3, imgY_3, y_3, y_3, y_3);
        }
        px_3 = px_3 + 1;
      };
      py_3 = py_3 + 1;
    };
  }
}
FDCT::FDCT( ) {
  this->cosTable = 
  std::vector<int64_t>(64, 0);
  ;
  this->zigzagOrder = 
  std::vector<int64_t>(64, 0);
  ;
  cosTable[0] = 1024;
  cosTable[1] = 1004;
  cosTable[2] = 946;
  cosTable[3] = 851;
  cosTable[4] = 724;
  cosTable[5] = 569;
  cosTable[6] = 392;
  cosTable[7] = 200;
  cosTable[8] = 1024;
  cosTable[9] = 851;
  cosTable[10] = 392;
  cosTable[11] = -200;
  cosTable[12] = -724;
  cosTable[13] = -1004;
  cosTable[14] = -946;
  cosTable[15] = -569;
  cosTable[16] = 1024;
  cosTable[17] = 569;
  cosTable[18] = -392;
  cosTable[19] = -1004;
  cosTable[20] = -724;
  cosTable[21] = 200;
  cosTable[22] = 946;
  cosTable[23] = 851;
  cosTable[24] = 1024;
  cosTable[25] = 200;
  cosTable[26] = -946;
  cosTable[27] = -569;
  cosTable[28] = 724;
  cosTable[29] = 851;
  cosTable[30] = -392;
  cosTable[31] = -1004;
  cosTable[32] = 1024;
  cosTable[33] = -200;
  cosTable[34] = -946;
  cosTable[35] = 569;
  cosTable[36] = 724;
  cosTable[37] = -851;
  cosTable[38] = -392;
  cosTable[39] = 1004;
  cosTable[40] = 1024;
  cosTable[41] = -569;
  cosTable[42] = -392;
  cosTable[43] = 1004;
  cosTable[44] = -724;
  cosTable[45] = -200;
  cosTable[46] = 946;
  cosTable[47] = -851;
  cosTable[48] = 1024;
  cosTable[49] = -851;
  cosTable[50] = 392;
  cosTable[51] = 200;
  cosTable[52] = -724;
  cosTable[53] = 1004;
  cosTable[54] = -946;
  cosTable[55] = 569;
  cosTable[56] = 1024;
  cosTable[57] = -1004;
  cosTable[58] = 946;
  cosTable[59] = -851;
  cosTable[60] = 724;
  cosTable[61] = -569;
  cosTable[62] = 392;
  cosTable[63] = -200;
  zigzagOrder[0] = 0;
  zigzagOrder[1] = 1;
  zigzagOrder[2] = 8;
  zigzagOrder[3] = 16;
  zigzagOrder[4] = 9;
  zigzagOrder[5] = 2;
  zigzagOrder[6] = 3;
  zigzagOrder[7] = 10;
  zigzagOrder[8] = 17;
  zigzagOrder[9] = 24;
  zigzagOrder[10] = 32;
  zigzagOrder[11] = 25;
  zigzagOrder[12] = 18;
  zigzagOrder[13] = 11;
  zigzagOrder[14] = 4;
  zigzagOrder[15] = 5;
  zigzagOrder[16] = 12;
  zigzagOrder[17] = 19;
  zigzagOrder[18] = 26;
  zigzagOrder[19] = 33;
  zigzagOrder[20] = 40;
  zigzagOrder[21] = 48;
  zigzagOrder[22] = 41;
  zigzagOrder[23] = 34;
  zigzagOrder[24] = 27;
  zigzagOrder[25] = 20;
  zigzagOrder[26] = 13;
  zigzagOrder[27] = 6;
  zigzagOrder[28] = 7;
  zigzagOrder[29] = 14;
  zigzagOrder[30] = 21;
  zigzagOrder[31] = 28;
  zigzagOrder[32] = 35;
  zigzagOrder[33] = 42;
  zigzagOrder[34] = 49;
  zigzagOrder[35] = 56;
  zigzagOrder[36] = 57;
  zigzagOrder[37] = 50;
  zigzagOrder[38] = 43;
  zigzagOrder[39] = 36;
  zigzagOrder[40] = 29;
  zigzagOrder[41] = 22;
  zigzagOrder[42] = 15;
  zigzagOrder[43] = 23;
  zigzagOrder[44] = 30;
  zigzagOrder[45] = 37;
  zigzagOrder[46] = 44;
  zigzagOrder[47] = 51;
  zigzagOrder[48] = 58;
  zigzagOrder[49] = 59;
  zigzagOrder[50] = 52;
  zigzagOrder[51] = 45;
  zigzagOrder[52] = 38;
  zigzagOrder[53] = 31;
  zigzagOrder[54] = 39;
  zigzagOrder[55] = 46;
  zigzagOrder[56] = 53;
  zigzagOrder[57] = 60;
  zigzagOrder[58] = 61;
  zigzagOrder[59] = 54;
  zigzagOrder[60] = 47;
  zigzagOrder[61] = 55;
  zigzagOrder[62] = 62;
  zigzagOrder[63] = 63;
}
void  FDCT::dct1d( std::vector<int64_t> input , int startIdx , int stride , std::vector<int64_t>& output , int outIdx , int outStride ) {
  int u = 0;
  while (u < 8) {
    int sum = 0;
    int x = 0;
    while (x < 8) {
      int pixel = input[(startIdx + (x * stride))];
      int cosVal = cosTable[((x * 8) + u)];
      sum = sum + (pixel * cosVal);
      x = x + 1;
    };
    if ( u == 0 ) {
      sum = (((sum * 724)) >> (10));
    }
    output[outIdx + (u * outStride)] = ((sum) >> (11));
    u = u + 1;
  };
}
std::vector<int64_t>  FDCT::transform( std::vector<int64_t> pixels ) {
  std::vector<int64_t> shifted = std::vector<int64_t>(64, 0);
  int i = 0;
  while (i < 64) {
    shifted[i] = (pixels[i]) - 128;
    i = i + 1;
  };
  std::vector<int64_t> temp = std::vector<int64_t>(64, 0);
  int row = 0;
  while (row < 8) {
    int rowStart = row * 8;
    this->dct1d(shifted, rowStart, 1, temp, rowStart, 1);
    row = row + 1;
  };
  std::vector<int64_t> coeffs = std::vector<int64_t>(64, 0);
  int col = 0;
  while (col < 8) {
    this->dct1d(temp, col, 8, coeffs, col, 8);
    col = col + 1;
  };
  return coeffs;
}
std::vector<int64_t>  FDCT::zigzag( std::vector<int64_t> block ) {
  std::vector<int64_t> zigzagOut = std::vector<int64_t>(64, 0);
  int i = 0;
  while (i < 64) {
    int pos = zigzagOrder[i];
    zigzagOut[i] = block[pos];
    i = i + 1;
  };
  return zigzagOut;
}
BitWriter::BitWriter( ) {
  this->buffer =  std::make_shared<GrowableBuffer>();
  this->bitBuffer = 0;
  this->bitCount = 0;
}
void  BitWriter::writeBit( int bit ) {
  bitBuffer = ((bitBuffer) << (1));
  bitBuffer = ((bitBuffer) | ((((bit) & (1)))));
  bitCount = bitCount + 1;
  if ( bitCount == 8 ) {
    this->flushByte();
  }
}
void  BitWriter::writeBits( int value , int numBits ) {
  int i = numBits - 1;
  while (i >= 0) {
    int bit = (((((value) >> (i)))) & (1));
    this->writeBit(bit);
    i = i - 1;
  };
}
void  BitWriter::flushByte() {
  if ( bitCount > 0 ) {
    while (bitCount < 8) {
      bitBuffer = ((bitBuffer) << (1));
      bitBuffer = ((bitBuffer) | (1));
      bitCount = bitCount + 1;
    };
    buffer->writeByte(bitBuffer);
    if ( bitBuffer == 255 ) {
      buffer->writeByte(0);
    }
    bitBuffer = 0;
    bitCount = 0;
  }
}
void  BitWriter::writeByte( int b ) {
  this->flushByte();
  buffer->writeByte(b);
}
void  BitWriter::writeWord( int w ) {
  this->writeByte(((w) >> (8)));
  this->writeByte(((w) & (255)));
}
std::vector<uint8_t>  BitWriter::getBuffer() {
  this->flushByte();
  return buffer->toBuffer();
}
int  BitWriter::getLength() {
  return (buffer)->size();
}
JPEGEncoder::JPEGEncoder( ) {
  this->quality = 75;
  this->prevDCY = 0;
  this->prevDCCb = 0;
  this->prevDCCr = 0;
  fdct  =  std::make_shared<FDCT>();
  this->initQuantTables();
  this->initHuffmanTables();
}
void  JPEGEncoder::initQuantTables() {
  stdYQuant.push_back( 16  );
  stdYQuant.push_back( 11  );
  stdYQuant.push_back( 10  );
  stdYQuant.push_back( 16  );
  stdYQuant.push_back( 24  );
  stdYQuant.push_back( 40  );
  stdYQuant.push_back( 51  );
  stdYQuant.push_back( 61  );
  stdYQuant.push_back( 12  );
  stdYQuant.push_back( 12  );
  stdYQuant.push_back( 14  );
  stdYQuant.push_back( 19  );
  stdYQuant.push_back( 26  );
  stdYQuant.push_back( 58  );
  stdYQuant.push_back( 60  );
  stdYQuant.push_back( 55  );
  stdYQuant.push_back( 14  );
  stdYQuant.push_back( 13  );
  stdYQuant.push_back( 16  );
  stdYQuant.push_back( 24  );
  stdYQuant.push_back( 40  );
  stdYQuant.push_back( 57  );
  stdYQuant.push_back( 69  );
  stdYQuant.push_back( 56  );
  stdYQuant.push_back( 14  );
  stdYQuant.push_back( 17  );
  stdYQuant.push_back( 22  );
  stdYQuant.push_back( 29  );
  stdYQuant.push_back( 51  );
  stdYQuant.push_back( 87  );
  stdYQuant.push_back( 80  );
  stdYQuant.push_back( 62  );
  stdYQuant.push_back( 18  );
  stdYQuant.push_back( 22  );
  stdYQuant.push_back( 37  );
  stdYQuant.push_back( 56  );
  stdYQuant.push_back( 68  );
  stdYQuant.push_back( 109  );
  stdYQuant.push_back( 103  );
  stdYQuant.push_back( 77  );
  stdYQuant.push_back( 24  );
  stdYQuant.push_back( 35  );
  stdYQuant.push_back( 55  );
  stdYQuant.push_back( 64  );
  stdYQuant.push_back( 81  );
  stdYQuant.push_back( 104  );
  stdYQuant.push_back( 113  );
  stdYQuant.push_back( 92  );
  stdYQuant.push_back( 49  );
  stdYQuant.push_back( 64  );
  stdYQuant.push_back( 78  );
  stdYQuant.push_back( 87  );
  stdYQuant.push_back( 103  );
  stdYQuant.push_back( 121  );
  stdYQuant.push_back( 120  );
  stdYQuant.push_back( 101  );
  stdYQuant.push_back( 72  );
  stdYQuant.push_back( 92  );
  stdYQuant.push_back( 95  );
  stdYQuant.push_back( 98  );
  stdYQuant.push_back( 112  );
  stdYQuant.push_back( 100  );
  stdYQuant.push_back( 103  );
  stdYQuant.push_back( 99  );
  stdCQuant.push_back( 17  );
  stdCQuant.push_back( 18  );
  stdCQuant.push_back( 24  );
  stdCQuant.push_back( 47  );
  stdCQuant.push_back( 99  );
  stdCQuant.push_back( 99  );
  stdCQuant.push_back( 99  );
  stdCQuant.push_back( 99  );
  stdCQuant.push_back( 18  );
  stdCQuant.push_back( 21  );
  stdCQuant.push_back( 26  );
  stdCQuant.push_back( 66  );
  stdCQuant.push_back( 99  );
  stdCQuant.push_back( 99  );
  stdCQuant.push_back( 99  );
  stdCQuant.push_back( 99  );
  stdCQuant.push_back( 24  );
  stdCQuant.push_back( 26  );
  stdCQuant.push_back( 56  );
  stdCQuant.push_back( 99  );
  stdCQuant.push_back( 99  );
  stdCQuant.push_back( 99  );
  stdCQuant.push_back( 99  );
  stdCQuant.push_back( 99  );
  stdCQuant.push_back( 47  );
  stdCQuant.push_back( 66  );
  stdCQuant.push_back( 99  );
  stdCQuant.push_back( 99  );
  stdCQuant.push_back( 99  );
  stdCQuant.push_back( 99  );
  stdCQuant.push_back( 99  );
  stdCQuant.push_back( 99  );
  stdCQuant.push_back( 99  );
  stdCQuant.push_back( 99  );
  stdCQuant.push_back( 99  );
  stdCQuant.push_back( 99  );
  stdCQuant.push_back( 99  );
  stdCQuant.push_back( 99  );
  stdCQuant.push_back( 99  );
  stdCQuant.push_back( 99  );
  stdCQuant.push_back( 99  );
  stdCQuant.push_back( 99  );
  stdCQuant.push_back( 99  );
  stdCQuant.push_back( 99  );
  stdCQuant.push_back( 99  );
  stdCQuant.push_back( 99  );
  stdCQuant.push_back( 99  );
  stdCQuant.push_back( 99  );
  stdCQuant.push_back( 99  );
  stdCQuant.push_back( 99  );
  stdCQuant.push_back( 99  );
  stdCQuant.push_back( 99  );
  stdCQuant.push_back( 99  );
  stdCQuant.push_back( 99  );
  stdCQuant.push_back( 99  );
  stdCQuant.push_back( 99  );
  stdCQuant.push_back( 99  );
  stdCQuant.push_back( 99  );
  stdCQuant.push_back( 99  );
  stdCQuant.push_back( 99  );
  stdCQuant.push_back( 99  );
  stdCQuant.push_back( 99  );
  stdCQuant.push_back( 99  );
  stdCQuant.push_back( 99  );
  this->scaleQuantTables(quality);
}
void  JPEGEncoder::scaleQuantTables( int q ) {
  int scale = 0;
  if ( q < 50 ) {
    scale = (int)floor( (5000 / q));
  } else {
    scale = 200 - (q * 2);
  }
  yQuantTable.clear();
  cQuantTable.clear();
  int i = 0;
  while (i < 64) {
    int yVal = (int)floor( ((((stdYQuant.at(i)) * scale) + 50) / 100));
    if ( yVal < 1 ) {
      yVal = 1;
    }
    if ( yVal > 255 ) {
      yVal = 255;
    }
    yQuantTable.push_back( yVal  );
    int cVal = (int)floor( ((((stdCQuant.at(i)) * scale) + 50) / 100));
    if ( cVal < 1 ) {
      cVal = 1;
    }
    if ( cVal > 255 ) {
      cVal = 255;
    }
    cQuantTable.push_back( cVal  );
    i = i + 1;
  };
}
void  JPEGEncoder::initHuffmanTables() {
  dcYBits.push_back( 0  );
  dcYBits.push_back( 1  );
  dcYBits.push_back( 5  );
  dcYBits.push_back( 1  );
  dcYBits.push_back( 1  );
  dcYBits.push_back( 1  );
  dcYBits.push_back( 1  );
  dcYBits.push_back( 1  );
  dcYBits.push_back( 1  );
  dcYBits.push_back( 0  );
  dcYBits.push_back( 0  );
  dcYBits.push_back( 0  );
  dcYBits.push_back( 0  );
  dcYBits.push_back( 0  );
  dcYBits.push_back( 0  );
  dcYBits.push_back( 0  );
  dcYValues.push_back( 0  );
  dcYValues.push_back( 1  );
  dcYValues.push_back( 2  );
  dcYValues.push_back( 3  );
  dcYValues.push_back( 4  );
  dcYValues.push_back( 5  );
  dcYValues.push_back( 6  );
  dcYValues.push_back( 7  );
  dcYValues.push_back( 8  );
  dcYValues.push_back( 9  );
  dcYValues.push_back( 10  );
  dcYValues.push_back( 11  );
  acYBits.push_back( 0  );
  acYBits.push_back( 2  );
  acYBits.push_back( 1  );
  acYBits.push_back( 3  );
  acYBits.push_back( 3  );
  acYBits.push_back( 2  );
  acYBits.push_back( 4  );
  acYBits.push_back( 3  );
  acYBits.push_back( 5  );
  acYBits.push_back( 5  );
  acYBits.push_back( 4  );
  acYBits.push_back( 4  );
  acYBits.push_back( 0  );
  acYBits.push_back( 0  );
  acYBits.push_back( 1  );
  acYBits.push_back( 125  );
  acYValues.push_back( 1  );
  acYValues.push_back( 2  );
  acYValues.push_back( 3  );
  acYValues.push_back( 0  );
  acYValues.push_back( 4  );
  acYValues.push_back( 17  );
  acYValues.push_back( 5  );
  acYValues.push_back( 18  );
  acYValues.push_back( 33  );
  acYValues.push_back( 49  );
  acYValues.push_back( 65  );
  acYValues.push_back( 6  );
  acYValues.push_back( 19  );
  acYValues.push_back( 81  );
  acYValues.push_back( 97  );
  acYValues.push_back( 7  );
  acYValues.push_back( 34  );
  acYValues.push_back( 113  );
  acYValues.push_back( 20  );
  acYValues.push_back( 50  );
  acYValues.push_back( 129  );
  acYValues.push_back( 145  );
  acYValues.push_back( 161  );
  acYValues.push_back( 8  );
  acYValues.push_back( 35  );
  acYValues.push_back( 66  );
  acYValues.push_back( 177  );
  acYValues.push_back( 193  );
  acYValues.push_back( 21  );
  acYValues.push_back( 82  );
  acYValues.push_back( 209  );
  acYValues.push_back( 240  );
  acYValues.push_back( 36  );
  acYValues.push_back( 51  );
  acYValues.push_back( 98  );
  acYValues.push_back( 114  );
  acYValues.push_back( 130  );
  acYValues.push_back( 9  );
  acYValues.push_back( 10  );
  acYValues.push_back( 22  );
  acYValues.push_back( 23  );
  acYValues.push_back( 24  );
  acYValues.push_back( 25  );
  acYValues.push_back( 26  );
  acYValues.push_back( 37  );
  acYValues.push_back( 38  );
  acYValues.push_back( 39  );
  acYValues.push_back( 40  );
  acYValues.push_back( 41  );
  acYValues.push_back( 42  );
  acYValues.push_back( 52  );
  acYValues.push_back( 53  );
  acYValues.push_back( 54  );
  acYValues.push_back( 55  );
  acYValues.push_back( 56  );
  acYValues.push_back( 57  );
  acYValues.push_back( 58  );
  acYValues.push_back( 67  );
  acYValues.push_back( 68  );
  acYValues.push_back( 69  );
  acYValues.push_back( 70  );
  acYValues.push_back( 71  );
  acYValues.push_back( 72  );
  acYValues.push_back( 73  );
  acYValues.push_back( 74  );
  acYValues.push_back( 83  );
  acYValues.push_back( 84  );
  acYValues.push_back( 85  );
  acYValues.push_back( 86  );
  acYValues.push_back( 87  );
  acYValues.push_back( 88  );
  acYValues.push_back( 89  );
  acYValues.push_back( 90  );
  acYValues.push_back( 99  );
  acYValues.push_back( 100  );
  acYValues.push_back( 101  );
  acYValues.push_back( 102  );
  acYValues.push_back( 103  );
  acYValues.push_back( 104  );
  acYValues.push_back( 105  );
  acYValues.push_back( 106  );
  acYValues.push_back( 115  );
  acYValues.push_back( 116  );
  acYValues.push_back( 117  );
  acYValues.push_back( 118  );
  acYValues.push_back( 119  );
  acYValues.push_back( 120  );
  acYValues.push_back( 121  );
  acYValues.push_back( 122  );
  acYValues.push_back( 131  );
  acYValues.push_back( 132  );
  acYValues.push_back( 133  );
  acYValues.push_back( 134  );
  acYValues.push_back( 135  );
  acYValues.push_back( 136  );
  acYValues.push_back( 137  );
  acYValues.push_back( 138  );
  acYValues.push_back( 146  );
  acYValues.push_back( 147  );
  acYValues.push_back( 148  );
  acYValues.push_back( 149  );
  acYValues.push_back( 150  );
  acYValues.push_back( 151  );
  acYValues.push_back( 152  );
  acYValues.push_back( 153  );
  acYValues.push_back( 154  );
  acYValues.push_back( 162  );
  acYValues.push_back( 163  );
  acYValues.push_back( 164  );
  acYValues.push_back( 165  );
  acYValues.push_back( 166  );
  acYValues.push_back( 167  );
  acYValues.push_back( 168  );
  acYValues.push_back( 169  );
  acYValues.push_back( 170  );
  acYValues.push_back( 178  );
  acYValues.push_back( 179  );
  acYValues.push_back( 180  );
  acYValues.push_back( 181  );
  acYValues.push_back( 182  );
  acYValues.push_back( 183  );
  acYValues.push_back( 184  );
  acYValues.push_back( 185  );
  acYValues.push_back( 186  );
  acYValues.push_back( 194  );
  acYValues.push_back( 195  );
  acYValues.push_back( 196  );
  acYValues.push_back( 197  );
  acYValues.push_back( 198  );
  acYValues.push_back( 199  );
  acYValues.push_back( 200  );
  acYValues.push_back( 201  );
  acYValues.push_back( 202  );
  acYValues.push_back( 210  );
  acYValues.push_back( 211  );
  acYValues.push_back( 212  );
  acYValues.push_back( 213  );
  acYValues.push_back( 214  );
  acYValues.push_back( 215  );
  acYValues.push_back( 216  );
  acYValues.push_back( 217  );
  acYValues.push_back( 218  );
  acYValues.push_back( 225  );
  acYValues.push_back( 226  );
  acYValues.push_back( 227  );
  acYValues.push_back( 228  );
  acYValues.push_back( 229  );
  acYValues.push_back( 230  );
  acYValues.push_back( 231  );
  acYValues.push_back( 232  );
  acYValues.push_back( 233  );
  acYValues.push_back( 234  );
  acYValues.push_back( 241  );
  acYValues.push_back( 242  );
  acYValues.push_back( 243  );
  acYValues.push_back( 244  );
  acYValues.push_back( 245  );
  acYValues.push_back( 246  );
  acYValues.push_back( 247  );
  acYValues.push_back( 248  );
  acYValues.push_back( 249  );
  acYValues.push_back( 250  );
  dcCBits.push_back( 0  );
  dcCBits.push_back( 3  );
  dcCBits.push_back( 1  );
  dcCBits.push_back( 1  );
  dcCBits.push_back( 1  );
  dcCBits.push_back( 1  );
  dcCBits.push_back( 1  );
  dcCBits.push_back( 1  );
  dcCBits.push_back( 1  );
  dcCBits.push_back( 1  );
  dcCBits.push_back( 1  );
  dcCBits.push_back( 0  );
  dcCBits.push_back( 0  );
  dcCBits.push_back( 0  );
  dcCBits.push_back( 0  );
  dcCBits.push_back( 0  );
  dcCValues.push_back( 0  );
  dcCValues.push_back( 1  );
  dcCValues.push_back( 2  );
  dcCValues.push_back( 3  );
  dcCValues.push_back( 4  );
  dcCValues.push_back( 5  );
  dcCValues.push_back( 6  );
  dcCValues.push_back( 7  );
  dcCValues.push_back( 8  );
  dcCValues.push_back( 9  );
  dcCValues.push_back( 10  );
  dcCValues.push_back( 11  );
  acCBits.push_back( 0  );
  acCBits.push_back( 2  );
  acCBits.push_back( 1  );
  acCBits.push_back( 2  );
  acCBits.push_back( 4  );
  acCBits.push_back( 4  );
  acCBits.push_back( 3  );
  acCBits.push_back( 4  );
  acCBits.push_back( 7  );
  acCBits.push_back( 5  );
  acCBits.push_back( 4  );
  acCBits.push_back( 4  );
  acCBits.push_back( 0  );
  acCBits.push_back( 1  );
  acCBits.push_back( 2  );
  acCBits.push_back( 119  );
  acCValues.push_back( 0  );
  acCValues.push_back( 1  );
  acCValues.push_back( 2  );
  acCValues.push_back( 3  );
  acCValues.push_back( 17  );
  acCValues.push_back( 4  );
  acCValues.push_back( 5  );
  acCValues.push_back( 33  );
  acCValues.push_back( 49  );
  acCValues.push_back( 6  );
  acCValues.push_back( 18  );
  acCValues.push_back( 65  );
  acCValues.push_back( 81  );
  acCValues.push_back( 7  );
  acCValues.push_back( 97  );
  acCValues.push_back( 113  );
  acCValues.push_back( 19  );
  acCValues.push_back( 34  );
  acCValues.push_back( 50  );
  acCValues.push_back( 129  );
  acCValues.push_back( 8  );
  acCValues.push_back( 20  );
  acCValues.push_back( 66  );
  acCValues.push_back( 145  );
  acCValues.push_back( 161  );
  acCValues.push_back( 177  );
  acCValues.push_back( 193  );
  acCValues.push_back( 9  );
  acCValues.push_back( 35  );
  acCValues.push_back( 51  );
  acCValues.push_back( 82  );
  acCValues.push_back( 240  );
  acCValues.push_back( 21  );
  acCValues.push_back( 98  );
  acCValues.push_back( 114  );
  acCValues.push_back( 209  );
  acCValues.push_back( 10  );
  acCValues.push_back( 22  );
  acCValues.push_back( 36  );
  acCValues.push_back( 52  );
  acCValues.push_back( 225  );
  acCValues.push_back( 37  );
  acCValues.push_back( 241  );
  acCValues.push_back( 23  );
  acCValues.push_back( 24  );
  acCValues.push_back( 25  );
  acCValues.push_back( 26  );
  acCValues.push_back( 38  );
  acCValues.push_back( 39  );
  acCValues.push_back( 40  );
  acCValues.push_back( 41  );
  acCValues.push_back( 42  );
  acCValues.push_back( 53  );
  acCValues.push_back( 54  );
  acCValues.push_back( 55  );
  acCValues.push_back( 56  );
  acCValues.push_back( 57  );
  acCValues.push_back( 58  );
  acCValues.push_back( 67  );
  acCValues.push_back( 68  );
  acCValues.push_back( 69  );
  acCValues.push_back( 70  );
  acCValues.push_back( 71  );
  acCValues.push_back( 72  );
  acCValues.push_back( 73  );
  acCValues.push_back( 74  );
  acCValues.push_back( 83  );
  acCValues.push_back( 84  );
  acCValues.push_back( 85  );
  acCValues.push_back( 86  );
  acCValues.push_back( 87  );
  acCValues.push_back( 88  );
  acCValues.push_back( 89  );
  acCValues.push_back( 90  );
  acCValues.push_back( 99  );
  acCValues.push_back( 100  );
  acCValues.push_back( 101  );
  acCValues.push_back( 102  );
  acCValues.push_back( 103  );
  acCValues.push_back( 104  );
  acCValues.push_back( 105  );
  acCValues.push_back( 106  );
  acCValues.push_back( 115  );
  acCValues.push_back( 116  );
  acCValues.push_back( 117  );
  acCValues.push_back( 118  );
  acCValues.push_back( 119  );
  acCValues.push_back( 120  );
  acCValues.push_back( 121  );
  acCValues.push_back( 122  );
  acCValues.push_back( 130  );
  acCValues.push_back( 131  );
  acCValues.push_back( 132  );
  acCValues.push_back( 133  );
  acCValues.push_back( 134  );
  acCValues.push_back( 135  );
  acCValues.push_back( 136  );
  acCValues.push_back( 137  );
  acCValues.push_back( 138  );
  acCValues.push_back( 146  );
  acCValues.push_back( 147  );
  acCValues.push_back( 148  );
  acCValues.push_back( 149  );
  acCValues.push_back( 150  );
  acCValues.push_back( 151  );
  acCValues.push_back( 152  );
  acCValues.push_back( 153  );
  acCValues.push_back( 154  );
  acCValues.push_back( 162  );
  acCValues.push_back( 163  );
  acCValues.push_back( 164  );
  acCValues.push_back( 165  );
  acCValues.push_back( 166  );
  acCValues.push_back( 167  );
  acCValues.push_back( 168  );
  acCValues.push_back( 169  );
  acCValues.push_back( 170  );
  acCValues.push_back( 178  );
  acCValues.push_back( 179  );
  acCValues.push_back( 180  );
  acCValues.push_back( 181  );
  acCValues.push_back( 182  );
  acCValues.push_back( 183  );
  acCValues.push_back( 184  );
  acCValues.push_back( 185  );
  acCValues.push_back( 186  );
  acCValues.push_back( 194  );
  acCValues.push_back( 195  );
  acCValues.push_back( 196  );
  acCValues.push_back( 197  );
  acCValues.push_back( 198  );
  acCValues.push_back( 199  );
  acCValues.push_back( 200  );
  acCValues.push_back( 201  );
  acCValues.push_back( 202  );
  acCValues.push_back( 210  );
  acCValues.push_back( 211  );
  acCValues.push_back( 212  );
  acCValues.push_back( 213  );
  acCValues.push_back( 214  );
  acCValues.push_back( 215  );
  acCValues.push_back( 216  );
  acCValues.push_back( 217  );
  acCValues.push_back( 218  );
  acCValues.push_back( 226  );
  acCValues.push_back( 227  );
  acCValues.push_back( 228  );
  acCValues.push_back( 229  );
  acCValues.push_back( 230  );
  acCValues.push_back( 231  );
  acCValues.push_back( 232  );
  acCValues.push_back( 233  );
  acCValues.push_back( 234  );
  acCValues.push_back( 242  );
  acCValues.push_back( 243  );
  acCValues.push_back( 244  );
  acCValues.push_back( 245  );
  acCValues.push_back( 246  );
  acCValues.push_back( 247  );
  acCValues.push_back( 248  );
  acCValues.push_back( 249  );
  acCValues.push_back( 250  );
  int i = 0;
  while (i < 256) {
    dcYCodes.push_back( 0  );
    dcYLengths.push_back( 0  );
    acYCodes.push_back( 0  );
    acYLengths.push_back( 0  );
    dcCCodes.push_back( 0  );
    dcCLengths.push_back( 0  );
    acCCodes.push_back( 0  );
    acCLengths.push_back( 0  );
    i = i + 1;
  };
  this->buildHuffmanCodes(dcYBits, dcYValues, dcYCodes, dcYLengths);
  this->buildHuffmanCodes(acYBits, acYValues, acYCodes, acYLengths);
  this->buildHuffmanCodes(dcCBits, dcCValues, dcCCodes, dcCLengths);
  this->buildHuffmanCodes(acCBits, acCValues, acCCodes, acCLengths);
}
void  JPEGEncoder::buildHuffmanCodes( std::vector<int> bits , std::vector<int> values , std::vector<int>& codes , std::vector<int>& lengths ) {
  int code = 0;
  int valueIdx = 0;
  int bitLen = 1;
  while (bitLen <= 16) {
    int count = bits.at((bitLen - 1));
    int j = 0;
    while (j < count) {
      int symbol = values.at(valueIdx);
      codes[symbol] = code;
      lengths[symbol] = bitLen;
      code = code + 1;
      valueIdx = valueIdx + 1;
      j = j + 1;
    };
    code = ((code) << (1));
    bitLen = bitLen + 1;
  };
}
int  JPEGEncoder::getCategory( int value ) {
  if ( value < 0 ) {
    value = 0 - value;
  }
  if ( value == 0 ) {
    return 0;
  }
  int cat = 0;
  while (value > 0) {
    cat = cat + 1;
    value = ((value) >> (1));
  };
  return cat;
}
int  JPEGEncoder::encodeNumber( int value , int category ) {
  if ( value < 0 ) {
    return value + ((((1) << (category))) - 1);
  }
  return value;
}
void  JPEGEncoder::encodeBlock( std::shared_ptr<BitWriter> writer , std::vector<int64_t> coeffs , std::vector<int> quantTable , std::vector<int> dcCodes , std::vector<int> dcLengths , std::vector<int> acCodes , std::vector<int> acLengths , int prevDC ) {
  std::vector<int64_t> quantized = std::vector<int64_t>(64, 0);
  int i = 0;
  while (i < 64) {
    int q = quantTable.at(i);
    int c = coeffs[i];
    int qVal = 0;
    if ( c >= 0 ) {
      qVal = (int)floor( ((c + (((q) >> (1)))) / q));
    } else {
      qVal = (int)floor( ((c - (((q) >> (1)))) / q));
    }
    quantized[i] = qVal;
    i = i + 1;
  };
  std::vector<int64_t> zigzagged = fdct->zigzag(quantized);
  int dc = zigzagged[0];
  int dcDiff = dc - prevDC;
  int dcCat = this->getCategory(dcDiff);
  int dcCode = dcCodes.at(dcCat);
  int dcLen = dcLengths.at(dcCat);
  writer->writeBits(dcCode, dcLen);
  if ( dcCat > 0 ) {
    int dcVal = this->encodeNumber(dcDiff, dcCat);
    writer->writeBits(dcVal, dcCat);
  }
  int zeroRun = 0;
  int k = 1;
  while (k < 64) {
    int ac = zigzagged[k];
    if ( ac == 0 ) {
      zeroRun = zeroRun + 1;
    } else {
      while (zeroRun >= 16) {
        int zrlCode = acCodes.at(240);
        int zrlLen = acLengths.at(240);
        writer->writeBits(zrlCode, zrlLen);
        zeroRun = zeroRun - 16;
      };
      int acCat = this->getCategory(ac);
      int runCat = (((((zeroRun) << (4)))) | (acCat));
      int acHuffCode = acCodes.at(runCat);
      int acHuffLen = acLengths.at(runCat);
      writer->writeBits(acHuffCode, acHuffLen);
      int acVal = this->encodeNumber(ac, acCat);
      writer->writeBits(acVal, acCat);
      zeroRun = 0;
    }
    k = k + 1;
  };
  if ( zeroRun > 0 ) {
    int eobCode = acCodes.at(0);
    int eobLen = acLengths.at(0);
    writer->writeBits(eobCode, eobLen);
  }
}
void  JPEGEncoder::rgbToYCbCr( int r , int g , int b , std::vector<int>& yOut , std::vector<int>& cbOut , std::vector<int>& crOut ) {
  int y = (((((77 * r) + (150 * g)) + (29 * b))) >> (8));
  int cb = ((((((0 - (43 * r)) - (85 * g)) + (128 * b))) >> (8))) + 128;
  int cr = ((((((128 * r) - (107 * g)) - (21 * b))) >> (8))) + 128;
  if ( y < 0 ) {
    y = 0;
  }
  if ( y > 255 ) {
    y = 255;
  }
  if ( cb < 0 ) {
    cb = 0;
  }
  if ( cb > 255 ) {
    cb = 255;
  }
  if ( cr < 0 ) {
    cr = 0;
  }
  if ( cr > 255 ) {
    cr = 255;
  }
  yOut.push_back( y  );
  cbOut.push_back( cb  );
  crOut.push_back( cr  );
}
std::vector<int64_t>  JPEGEncoder::extractBlock( std::shared_ptr<ImageBuffer> img , int blockX , int blockY , int channel ) {
  std::vector<int64_t> output = std::vector<int64_t>(64, 0);
  int idx = 0;
  int py = 0;
  while (py < 8) {
    int px = 0;
    while (px < 8) {
      int imgX = blockX + px;
      int imgY = blockY + py;
      if ( imgX >= img->width ) {
        imgX = img->width - 1;
      }
      if ( imgY >= img->height ) {
        imgY = img->height - 1;
      }
      std::shared_ptr<Color> c = img->getPixel(imgX, imgY);
      int y = (((((77 * c->r) + (150 * c->g)) + (29 * c->b))) >> (8));
      int cb = ((((((0 - (43 * c->r)) - (85 * c->g)) + (128 * c->b))) >> (8))) + 128;
      int cr = ((((((128 * c->r) - (107 * c->g)) - (21 * c->b))) >> (8))) + 128;
      if ( channel == 0 ) {
        output[idx] = y;
      }
      if ( channel == 1 ) {
        output[idx] = cb;
      }
      if ( channel == 2 ) {
        output[idx] = cr;
      }
      idx = idx + 1;
      px = px + 1;
    };
    py = py + 1;
  };
  return output;
}
void  JPEGEncoder::writeMarkers( std::shared_ptr<BitWriter> writer , int width , int height ) {
  writer->writeByte(255);
  writer->writeByte(216);
  writer->writeByte(255);
  writer->writeByte(224);
  writer->writeWord(16);
  writer->writeByte(74);
  writer->writeByte(70);
  writer->writeByte(73);
  writer->writeByte(70);
  writer->writeByte(0);
  writer->writeByte(1);
  writer->writeByte(1);
  writer->writeByte(0);
  writer->writeWord(1);
  writer->writeWord(1);
  writer->writeByte(0);
  writer->writeByte(0);
  writer->writeByte(255);
  writer->writeByte(219);
  writer->writeWord(67);
  writer->writeByte(0);
  int i = 0;
  while (i < 64) {
    writer->writeByte(yQuantTable.at((fdct->zigzagOrder[i])));
    i = i + 1;
  };
  writer->writeByte(255);
  writer->writeByte(219);
  writer->writeWord(67);
  writer->writeByte(1);
  i = 0;
  while (i < 64) {
    writer->writeByte(cQuantTable.at((fdct->zigzagOrder[i])));
    i = i + 1;
  };
  writer->writeByte(255);
  writer->writeByte(192);
  writer->writeWord(17);
  writer->writeByte(8);
  writer->writeWord(height);
  writer->writeWord(width);
  writer->writeByte(3);
  writer->writeByte(1);
  writer->writeByte(17);
  writer->writeByte(0);
  writer->writeByte(2);
  writer->writeByte(17);
  writer->writeByte(1);
  writer->writeByte(3);
  writer->writeByte(17);
  writer->writeByte(1);
  writer->writeByte(255);
  writer->writeByte(196);
  writer->writeWord(31);
  writer->writeByte(0);
  i = 0;
  while (i < 16) {
    writer->writeByte(dcYBits.at(i));
    i = i + 1;
  };
  i = 0;
  while (i < 12) {
    writer->writeByte(dcYValues.at(i));
    i = i + 1;
  };
  writer->writeByte(255);
  writer->writeByte(196);
  writer->writeWord(181);
  writer->writeByte(16);
  i = 0;
  while (i < 16) {
    writer->writeByte(acYBits.at(i));
    i = i + 1;
  };
  i = 0;
  while (i < 162) {
    writer->writeByte(acYValues.at(i));
    i = i + 1;
  };
  writer->writeByte(255);
  writer->writeByte(196);
  writer->writeWord(31);
  writer->writeByte(1);
  i = 0;
  while (i < 16) {
    writer->writeByte(dcCBits.at(i));
    i = i + 1;
  };
  i = 0;
  while (i < 12) {
    writer->writeByte(dcCValues.at(i));
    i = i + 1;
  };
  writer->writeByte(255);
  writer->writeByte(196);
  writer->writeWord(181);
  writer->writeByte(17);
  i = 0;
  while (i < 16) {
    writer->writeByte(acCBits.at(i));
    i = i + 1;
  };
  i = 0;
  while (i < 162) {
    writer->writeByte(acCValues.at(i));
    i = i + 1;
  };
  writer->writeByte(255);
  writer->writeByte(218);
  writer->writeWord(12);
  writer->writeByte(3);
  writer->writeByte(1);
  writer->writeByte(0);
  writer->writeByte(2);
  writer->writeByte(17);
  writer->writeByte(3);
  writer->writeByte(17);
  writer->writeByte(0);
  writer->writeByte(63);
  writer->writeByte(0);
}
std::vector<uint8_t>  JPEGEncoder::encodeToBuffer( std::shared_ptr<ImageBuffer> img ) {
  std::shared_ptr<BitWriter> writer =  std::make_shared<BitWriter>();
  this->writeMarkers(writer, img->width, img->height);
  int mcuWidth = (int)floor( ((img->width + 7) / 8));
  int mcuHeight = (int)floor( ((img->height + 7) / 8));
  prevDCY = 0;
  prevDCCb = 0;
  prevDCCr = 0;
  int mcuY = 0;
  while (mcuY < mcuHeight) {
    int mcuX = 0;
    while (mcuX < mcuWidth) {
      int blockX = mcuX * 8;
      int blockY = mcuY * 8;
      std::vector<int64_t> yBlock = this->extractBlock(img, blockX, blockY, 0);
      std::vector<int64_t> yCoeffs = fdct->transform(yBlock);
      this->encodeBlock(writer, yCoeffs, yQuantTable, dcYCodes, dcYLengths, acYCodes, acYLengths, prevDCY);
      std::vector<int64_t> yZig = fdct->zigzag(yCoeffs);
      int yQ = yQuantTable.at(0);
      int yDC = yZig[0];
      if ( yDC >= 0 ) {
        prevDCY = (int)floor( ((yDC + (((yQ) >> (1)))) / yQ));
      } else {
        prevDCY = (int)floor( ((yDC - (((yQ) >> (1)))) / yQ));
      }
      std::vector<int64_t> cbBlock = this->extractBlock(img, blockX, blockY, 1);
      std::vector<int64_t> cbCoeffs = fdct->transform(cbBlock);
      this->encodeBlock(writer, cbCoeffs, cQuantTable, dcCCodes, dcCLengths, acCCodes, acCLengths, prevDCCb);
      std::vector<int64_t> cbZig = fdct->zigzag(cbCoeffs);
      int cbQ = cQuantTable.at(0);
      int cbDC = cbZig[0];
      if ( cbDC >= 0 ) {
        prevDCCb = (int)floor( ((cbDC + (((cbQ) >> (1)))) / cbQ));
      } else {
        prevDCCb = (int)floor( ((cbDC - (((cbQ) >> (1)))) / cbQ));
      }
      std::vector<int64_t> crBlock = this->extractBlock(img, blockX, blockY, 2);
      std::vector<int64_t> crCoeffs = fdct->transform(crBlock);
      this->encodeBlock(writer, crCoeffs, cQuantTable, dcCCodes, dcCLengths, acCCodes, acCLengths, prevDCCr);
      std::vector<int64_t> crZig = fdct->zigzag(crCoeffs);
      int crQ = cQuantTable.at(0);
      int crDC = crZig[0];
      if ( crDC >= 0 ) {
        prevDCCr = (int)floor( ((crDC + (((crQ) >> (1)))) / crQ));
      } else {
        prevDCCr = (int)floor( ((crDC - (((crQ) >> (1)))) / crQ));
      }
      mcuX = mcuX + 1;
    };
    mcuY = mcuY + 1;
  };
  writer->flushByte();
  std::vector<uint8_t> outBuf = writer->getBuffer();
  int outLen = writer->getLength();
  std::vector<uint8_t> finalBuf = std::vector<uint8_t>((outLen + 2), 0);
  int i = 0;
  while (i < outLen) {
    finalBuf[i] = static_cast<uint8_t>(static_cast<int64_t>(outBuf[i]));
    i = i + 1;
  };
  finalBuf[outLen] = static_cast<uint8_t>(255);
  finalBuf[outLen + 1] = static_cast<uint8_t>(217);
  return finalBuf;
}
void  JPEGEncoder::encode( std::shared_ptr<ImageBuffer> img , std::string dirPath , std::string fileName ) {
  std::cout << std::string("Encoding JPEG: ") + fileName << std::endl;
  std::cout << ((std::string("  Image size: ") + (std::to_string(img->width))) + std::string("x")) + (std::to_string(img->height)) << std::endl;
  std::shared_ptr<BitWriter> writer =  std::make_shared<BitWriter>();
  this->writeMarkers(writer, img->width, img->height);
  int mcuWidth = (int)floor( ((img->width + 7) / 8));
  int mcuHeight = (int)floor( ((img->height + 7) / 8));
  std::cout << ((std::string("  MCU grid: ") + (std::to_string(mcuWidth))) + std::string("x")) + (std::to_string(mcuHeight)) << std::endl;
  prevDCY = 0;
  prevDCCb = 0;
  prevDCCr = 0;
  int mcuY = 0;
  while (mcuY < mcuHeight) {
    int mcuX = 0;
    while (mcuX < mcuWidth) {
      int blockX = mcuX * 8;
      int blockY = mcuY * 8;
      std::vector<int64_t> yBlock = this->extractBlock(img, blockX, blockY, 0);
      std::vector<int64_t> yCoeffs = fdct->transform(yBlock);
      this->encodeBlock(writer, yCoeffs, yQuantTable, dcYCodes, dcYLengths, acYCodes, acYLengths, prevDCY);
      std::vector<int64_t> yZig = fdct->zigzag(yCoeffs);
      int yQ = yQuantTable.at(0);
      int yDC = yZig[0];
      if ( yDC >= 0 ) {
        prevDCY = (int)floor( ((yDC + (((yQ) >> (1)))) / yQ));
      } else {
        prevDCY = (int)floor( ((yDC - (((yQ) >> (1)))) / yQ));
      }
      std::vector<int64_t> cbBlock = this->extractBlock(img, blockX, blockY, 1);
      std::vector<int64_t> cbCoeffs = fdct->transform(cbBlock);
      this->encodeBlock(writer, cbCoeffs, cQuantTable, dcCCodes, dcCLengths, acCCodes, acCLengths, prevDCCb);
      std::vector<int64_t> cbZig = fdct->zigzag(cbCoeffs);
      int cbQ = cQuantTable.at(0);
      int cbDC = cbZig[0];
      if ( cbDC >= 0 ) {
        prevDCCb = (int)floor( ((cbDC + (((cbQ) >> (1)))) / cbQ));
      } else {
        prevDCCb = (int)floor( ((cbDC - (((cbQ) >> (1)))) / cbQ));
      }
      std::vector<int64_t> crBlock = this->extractBlock(img, blockX, blockY, 2);
      std::vector<int64_t> crCoeffs = fdct->transform(crBlock);
      this->encodeBlock(writer, crCoeffs, cQuantTable, dcCCodes, dcCLengths, acCCodes, acCLengths, prevDCCr);
      std::vector<int64_t> crZig = fdct->zigzag(crCoeffs);
      int crQ = cQuantTable.at(0);
      int crDC = crZig[0];
      if ( crDC >= 0 ) {
        prevDCCr = (int)floor( ((crDC + (((crQ) >> (1)))) / crQ));
      } else {
        prevDCCr = (int)floor( ((crDC - (((crQ) >> (1)))) / crQ));
      }
      mcuX = mcuX + 1;
    };
    mcuY = mcuY + 1;
  };
  writer->flushByte();
  std::vector<uint8_t> outBuf = writer->getBuffer();
  int outLen = writer->getLength();
  std::vector<uint8_t> finalBuf = std::vector<uint8_t>((outLen + 2), 0);
  int i = 0;
  while (i < outLen) {
    finalBuf[i] = static_cast<uint8_t>(static_cast<int64_t>(outBuf[i]));
    i = i + 1;
  };
  finalBuf[outLen] = static_cast<uint8_t>(255);
  finalBuf[outLen + 1] = static_cast<uint8_t>(217);
  r_buffer_write_file(dirPath, fileName, finalBuf);
  std::cout << (std::string("  Encoded size: ") + (std::to_string((outLen + 2)))) + std::string(" bytes") << std::endl;
  std::cout << ((std::string("  Saved: ") + dirPath) + std::string("/")) + fileName << std::endl;
}
void  JPEGEncoder::setQuality( int q ) {
  quality = q;
  this->scaleQuantTables(q);
}
EmbeddedFont::EmbeddedFont( std::string n , std::string pn , std::shared_ptr<TrueTypeFont> font  ) {
  this->name = std::string("");
  this->fontObjNum = 0;
  this->fontDescObjNum = 0;
  this->fontFileObjNum = 0;
  this->pdfName = std::string("");
  name = n;
  pdfName = pn;
  ttfFont  = font;
}
EmbeddedImage::EmbeddedImage( std::string s  ) {
  this->src = std::string("");
  this->objNum = 0;
  this->width = 0;
  this->height = 0;
  this->orientation = 1;
  this->pdfName = std::string("");
  src = s;
}
EVGPDFRenderer::EVGPDFRenderer( ) {
  this->pageWidth = 595;
  this->pageHeight = 842;
  this->nextObjNum = 1;
  this->fontObjNum = 0;
  this->pagesObjNum = 0;
  this->pageCount = 1;
  this->debug = false;
  this->fontManager =  std::make_shared<FontManager>();
  this->jpegReader =  std::make_shared<JPEGReader>();
  this->jpegDecoder =  std::make_shared<JPEGDecoder>();
  this->jpegEncoder =  std::make_shared<JPEGEncoder>();
  this->metadataParser =  std::make_shared<JPEGMetadataParser>();
  this->baseDir = std::string("./");
  this->maxImageWidth = 800;
  this->maxImageHeight = 800;
  this->jpegQuality = 75;
  std::shared_ptr<PDFWriter> w =  std::make_shared<PDFWriter>();
  writer  = w;
  std::shared_ptr<EVGLayout> lay =  std::make_shared<EVGLayout>();
  layout  = lay;
  std::shared_ptr<SimpleTextMeasurer> m_1 =  std::make_shared<SimpleTextMeasurer>();
  measurer  = m_1;
  std::shared_ptr<GrowableBuffer> buf_1 =  std::make_shared<GrowableBuffer>();
  streamBuffer  = buf_1;
  std::vector<std::shared_ptr<EmbeddedFont>> ef;
  embeddedFonts = ef;
  std::vector<std::string> uf;
  usedFontNames = uf;
  std::vector<std::shared_ptr<EmbeddedImage>> ei;
  embeddedImages = ei;
  std::vector<std::shared_ptr<EVGImageDimensions>> idc;
  imageDimensionsCache = idc;
  std::vector<std::string> idck;
  imageDimensionsCacheKeys = idck;
  std::vector<std::string> ap;
  assetPaths = ap;
  std::vector<std::shared_ptr<EVGElement>> fs;
  foundSections = fs;
  std::vector<std::shared_ptr<EVGElement>> fp;
  foundPages = fp;
}
void  EVGPDFRenderer::init() {
  layout->setImageMeasurer(std::dynamic_pointer_cast<EVGPDFRenderer>(shared_from_this()));
}
void  EVGPDFRenderer::setPageSize( double width , double height ) {
  pageWidth = width;
  pageHeight = height;
  layout->setPageSize(width, height);
}
void  EVGPDFRenderer::setBaseDir( std::string dir ) {
  baseDir = dir;
}
void  EVGPDFRenderer::setAssetPaths( std::string paths ) {
  int start = 0;
  int i = 0;
  int __len = (int)(paths.length());
  while (i <= __len) {
    std::string ch = std::string("");
    if ( i < __len ) {
      ch = r_utf8_substr(paths, i, (i + 1) - i);
    }
    if ( (ch == std::string(";")) || (i == __len) ) {
      if ( i > start ) {
        std::string part = r_utf8_substr(paths, start, i - start);
        assetPaths.push_back( part  );
        std::cout << std::string("EVGPDFRenderer: Added asset path: ") + part << std::endl;
      }
      start = i + 1;
    }
    i = i + 1;
  };
}
std::string  EVGPDFRenderer::resolveImagePath( std::string src ) {
  std::string imgSrc = src;
  if ( ((int)(src.length())) > 2 ) {
    std::string prefix = r_utf8_substr(src, 0, 2 - 0);
    if ( prefix == std::string("./") ) {
      imgSrc = r_utf8_substr(src, 2, ((int)(src.length())) - 2);
    }
  }
  std::string fullPath = baseDir + imgSrc;
  return fullPath;
}
void  EVGPDFRenderer::setMeasurer( std::shared_ptr<EVGTextMeasurer> m ) {
  measurer  = m;
  layout->setMeasurer(m);
}
void  EVGPDFRenderer::setFontManager( std::shared_ptr<FontManager> fm ) {
  fontManager = fm;
}
void  EVGPDFRenderer::setDebug( bool enabled ) {
  layout->debug = enabled;
  this->debug = enabled;
}
std::shared_ptr<EVGImageDimensions>  EVGPDFRenderer::getImageDimensions( std::string src ) {
  int i = 0;
  while (i < ((int)(imageDimensionsCacheKeys.size()))) {
    std::string key = imageDimensionsCacheKeys.at(i);
    if ( key == src ) {
      return imageDimensionsCache.at(i);
    }
    i = i + 1;
  };
  std::shared_ptr<EVGImageDimensions> dims =  std::make_shared<EVGImageDimensions>();
  std::string imgDir = std::string("");
  std::string imgFile = std::string("");
  std::string imgSrc = src;
  if ( ((int)(src.length())) > 2 ) {
    std::string prefix = r_utf8_substr(src, 0, 2 - 0);
    if ( prefix == std::string("./") ) {
      imgSrc = r_utf8_substr(src, 2, ((int)(src.length())) - 2);
    }
  }
  int lastSlash = r_string_last_index_of(imgSrc , std::string("/"));
  int lastBackslash = r_string_last_index_of(imgSrc , std::string("\\"));
  int lastSep = lastSlash;
  if ( lastBackslash > lastSep ) {
    lastSep = lastBackslash;
  }
  if ( lastSep >= 0 ) {
    imgDir = baseDir + (r_utf8_substr(imgSrc, 0, (lastSep + 1) - 0));
    imgFile = r_utf8_substr(imgSrc, (lastSep + 1), ((int)(imgSrc.length())) - (lastSep + 1));
  } else {
    imgDir = baseDir;
    imgFile = imgSrc;
  }
  std::shared_ptr<JPEGReader> reader =  std::make_shared<JPEGReader>();
  std::shared_ptr<JPEGImage> jpegImage = reader->readJPEG(imgDir, imgFile);
  if ( jpegImage->isValid ) {
    std::shared_ptr<JPEGMetadataInfo> metaInfo = metadataParser->parseMetadata(imgDir, imgFile);
    int orientation = metaInfo->orientation;
    int imgW = jpegImage->width;
    int imgH = jpegImage->height;
    if ( (((orientation == 5) || (orientation == 6)) || (orientation == 7)) || (orientation == 8) ) {
      int tmp = imgW;
      imgW = imgH;
      imgH = tmp;
    }
    dims = EVGImageDimensions::create(imgW, imgH);
    std::cout << (((((((std::string("Image dimensions: ") + src) + std::string(" = ")) + (std::to_string(imgW))) + std::string("x")) + (std::to_string(imgH))) + std::string(" (orientation=")) + (std::to_string(orientation))) + std::string(")") << std::endl;
  }
  imageDimensionsCacheKeys.push_back( src  );
  imageDimensionsCache.push_back( dims  );
  return dims;
}
std::string  EVGPDFRenderer::getPdfFontName( std::string fontFamily ) {
  int i = 0;
  while (i < ((int)(usedFontNames.size()))) {
    std::string name = usedFontNames.at(i);
    if ( name == fontFamily ) {
      return std::string("/F") + (std::to_string((i + 1)));
    }
    i = i + 1;
  };
  usedFontNames.push_back( fontFamily  );
  return std::string("/F") + (std::to_string(((int)(usedFontNames.size()))));
}
std::vector<uint8_t>  EVGPDFRenderer::render( std::shared_ptr<EVGElement> root ) {
  if ( root->tagName == std::string("print") ) {
    return this->renderMultiPageToPDF(root);
  }
  layout->layout(root);
  return this->renderToPDF(root);
}
void  EVGPDFRenderer::findPageElementsRecursive( std::shared_ptr<EVGElement> el ) {
  if ( el->tagName == std::string("page") ) {
    foundPages.push_back( el  );
  }
  int i = 0;
  int childCount = el->getChildCount();
  while (i < childCount) {
    std::shared_ptr<EVGElement> child = el->getChild(i);
    this->findPageElementsRecursive(child);
    i = i + 1;
  };
}
void  EVGPDFRenderer::findSectionElementsRecursive( std::shared_ptr<EVGElement> el ) {
  int i = 0;
  int childCount = el->getChildCount();
  while (i < childCount) {
    std::shared_ptr<EVGElement> child = el->getChild(i);
    if ( child->tagName == std::string("section") ) {
      foundSections.push_back( child  );
    }
    i = i + 1;
  };
}
double  EVGPDFRenderer::getSectionPageWidth( std::shared_ptr<EVGElement> section ) {
  if ( section->width->isSet ) {
    return section->width->pixels;
  }
  return 595;
}
double  EVGPDFRenderer::getSectionPageHeight( std::shared_ptr<EVGElement> section ) {
  if ( section->height->isSet ) {
    return section->height->pixels;
  }
  return 842;
}
double  EVGPDFRenderer::getSectionMargin( std::shared_ptr<EVGElement> section ) {
  std::shared_ptr<EVGUnit> m = section->box->marginTop;
  if ( m->isSet ) {
    return m->pixels;
  }
  return 40;
}
std::vector<uint8_t>  EVGPDFRenderer::renderMultiPageToPDF( std::shared_ptr<EVGElement> root ) {
  std::shared_ptr<GrowableBuffer> pdf =  std::make_shared<GrowableBuffer>();
  nextObjNum = 1;
  contentObjNums.clear();
  usedFontNames.clear();
  embeddedFonts.clear();
  embeddedImages.clear();
  if ( root->imageQuality > 0 ) {
    jpegQuality = root->imageQuality;
    std::cout << std::string("Image quality: ") + (std::to_string(jpegQuality)) << std::endl;
  }
  if ( root->maxImageSize > 0 ) {
    maxImageWidth = root->maxImageSize;
    maxImageHeight = root->maxImageSize;
    std::cout << (std::string("Max image size: ") + (std::to_string(maxImageWidth))) + std::string("px") << std::endl;
  }
  pdf->writeString(std::string("%PDF-1.5\n"));
  pdf->writeByte(37);
  pdf->writeByte(226);
  pdf->writeByte(227);
  pdf->writeByte(207);
  pdf->writeByte(211);
  pdf->writeByte(10);
  std::vector<int> objectOffsets;
  std::vector<std::shared_ptr<EVGElement>> emptyArr;
  foundSections = emptyArr;
  this->findSectionElementsRecursive(root);
  std::vector<std::shared_ptr<EVGElement>> allPages;
  std::vector<double> allPageWidths;
  std::vector<double> allPageHeights;
  std::vector<double> allPageMargins;
  int si = 0;
  while (si < ((int)(foundSections.size()))) {
    std::shared_ptr<EVGElement> section = foundSections.at(si);
    double sectionWidth = this->getSectionPageWidth(section);
    double sectionHeight = this->getSectionPageHeight(section);
    double sectionMargin = this->getSectionMargin(section);
    std::vector<std::shared_ptr<EVGElement>> emptyPages;
    foundPages = emptyPages;
    this->findPageElementsRecursive(section);
    int pi = 0;
    while (pi < ((int)(foundPages.size()))) {
      std::shared_ptr<EVGElement> pg = foundPages.at(pi);
      allPages.push_back( pg  );
      allPageWidths.push_back( sectionWidth  );
      allPageHeights.push_back( sectionHeight  );
      allPageMargins.push_back( sectionMargin  );
      double contentWidth = sectionWidth - (sectionMargin * 2);
      double contentHeight = sectionHeight - (sectionMargin * 2);
      std::cout << ((((std::string("Page ") + (std::to_string((pi + 1)))) + std::string(" content size: ")) + (std::to_string(contentWidth))) + std::string(" x ")) + (std::to_string(contentHeight)) << std::endl;
      layout->pageWidth = contentWidth;
      layout->pageHeight = contentHeight;
      pg->resetLayoutState();
      pg->width->pixels = contentWidth;
      pg->width->value = contentWidth;
      pg->width->unitType = 0;
      pg->width->isSet = true;
      pg->height->pixels = contentHeight;
      pg->height->value = contentHeight;
      pg->height->unitType = 0;
      pg->height->isSet = true;
      layout->layout(pg);
      std::cout << ((std::string("  After layout: pg.calculatedWidth=") + (std::to_string(pg->calculatedWidth))) + std::string(" pg.calculatedHeight=")) + (std::to_string(pg->calculatedHeight)) << std::endl;
      if ( pg->getChildCount() > 0 ) {
        std::shared_ptr<EVGElement> firstChild = pg->getChild(0);
        std::cout << ((std::string("  First child: w=") + (std::to_string(firstChild->calculatedWidth))) + std::string(" h=")) + (std::to_string(firstChild->calculatedHeight)) << std::endl;
      }
      pi = pi + 1;
    };
    si = si + 1;
  };
  if ( ((int)(allPages.size())) == 0 ) {
    layout->layout(root);
    allPages.push_back( root  );
    allPageWidths.push_back( pageWidth  );
    allPageHeights.push_back( pageHeight  );
    allPageMargins.push_back( 0  );
  }
  int numPages = (int)(allPages.size());
  std::cout << (std::string("Rendering ") + (std::to_string(numPages))) + std::string(" pages") << std::endl;
  std::vector<std::vector<uint8_t>> contentDataList;
  int pgi = 0;
  while (pgi < numPages) {
    std::shared_ptr<EVGElement> pg_1 = allPages.at(pgi);
    /** unused:  double pgWidth = allPageWidths.at(pgi)   **/ ;
    double pgHeight = allPageHeights.at(pgi);
    double pgMargin = allPageMargins.at(pgi);
    pageHeight = pgHeight;
    (streamBuffer)->clear();
    this->renderElement(pg_1, pgMargin, pgMargin);
    std::vector<uint8_t> contentData = streamBuffer->toBuffer();
    contentDataList.push_back( contentData  );
    std::cout << (((std::string("  Page ") + (std::to_string((pgi + 1)))) + std::string(": ")) + (std::to_string((static_cast<int64_t>(contentData.size()))))) + std::string(" bytes") << std::endl;
    pgi = pgi + 1;
  };
  std::vector<int> fontObjNums;
  int fi = 0;
  while (fi < ((int)(usedFontNames.size()))) {
    std::string fontName = usedFontNames.at(fi);
    std::shared_ptr<TrueTypeFont> ttfFont = fontManager->getFont(fontName);
    if ( ttfFont->unitsPerEm > 0 ) {
      std::vector<uint8_t> fontFileData = ttfFont->getFontData();
      int fontFileLen = static_cast<int64_t>(fontFileData.size());
      objectOffsets.push_back( (pdf)->size()  );
      pdf->writeString((std::to_string(nextObjNum)) + std::string(" 0 obj\n"));
      pdf->writeString((((std::string("<< /Length ") + (std::to_string(fontFileLen))) + std::string(" /Length1 ")) + (std::to_string(fontFileLen))) + std::string(" >>\n"));
      pdf->writeString(std::string("stream\n"));
      pdf->writeBuffer(fontFileData);
      pdf->writeString(std::string("\nendstream\n"));
      pdf->writeString(std::string("endobj\n\n"));
      int fontFileObjNum = nextObjNum;
      nextObjNum = nextObjNum + 1;
      objectOffsets.push_back( (pdf)->size()  );
      pdf->writeString((std::to_string(nextObjNum)) + std::string(" 0 obj\n"));
      pdf->writeString(std::string("<< /Type /FontDescriptor"));
      pdf->writeString(std::string(" /FontName /") + this->sanitizeFontName(ttfFont->fontFamily));
      pdf->writeString(std::string(" /Flags 32"));
      pdf->writeString((((std::string(" /FontBBox [0 ") + (std::to_string(ttfFont->descender))) + std::string(" 1000 ")) + (std::to_string(ttfFont->ascender))) + std::string("]"));
      pdf->writeString(std::string(" /ItalicAngle 0"));
      pdf->writeString(std::string(" /Ascent ") + (std::to_string(ttfFont->ascender)));
      pdf->writeString(std::string(" /Descent ") + (std::to_string(ttfFont->descender)));
      pdf->writeString(std::string(" /CapHeight ") + (std::to_string(ttfFont->ascender)));
      pdf->writeString(std::string(" /StemV 80"));
      pdf->writeString((std::string(" /FontFile2 ") + (std::to_string(fontFileObjNum))) + std::string(" 0 R"));
      pdf->writeString(std::string(" >>\n"));
      pdf->writeString(std::string("endobj\n\n"));
      int fontDescObjNum = nextObjNum;
      nextObjNum = nextObjNum + 1;
      objectOffsets.push_back( (pdf)->size()  );
      pdf->writeString((std::to_string(nextObjNum)) + std::string(" 0 obj\n"));
      std::string toUnicodeStream = std::string("/CIDInit /ProcSet findresource begin\n12 dict begin\nbegincmap\n/CIDSystemInfo << /Registry (Adobe) /Ordering (UCS) /Supplement 0 >> def\n/CMapName /Adobe-Identity-UCS def\n/CMapType 2 def\n1 begincodespacerange\n<00> <FF>\nendcodespacerange\n");
      toUnicodeStream = toUnicodeStream + std::string("2 beginbfrange\n<20> <7E> <0020>\n<A0> <FF> <00A0>\nendbfrange\n");
      toUnicodeStream = toUnicodeStream + std::string("endcmap\nCMapName currentdict /CMap defineresource pop\nend\nend");
      int toUnicodeLen = (int)(toUnicodeStream.length());
      pdf->writeString((std::string("<< /Length ") + (std::to_string(toUnicodeLen))) + std::string(" >>\n"));
      pdf->writeString(std::string("stream\n"));
      pdf->writeString(toUnicodeStream);
      pdf->writeString(std::string("\nendstream\n"));
      pdf->writeString(std::string("endobj\n\n"));
      int toUnicodeObjNum = nextObjNum;
      nextObjNum = nextObjNum + 1;
      objectOffsets.push_back( (pdf)->size()  );
      pdf->writeString((std::to_string(nextObjNum)) + std::string(" 0 obj\n"));
      pdf->writeString(std::string("<< /Type /Font"));
      pdf->writeString(std::string(" /Subtype /TrueType"));
      pdf->writeString(std::string(" /BaseFont /") + this->sanitizeFontName(ttfFont->fontFamily));
      pdf->writeString(std::string(" /FirstChar 32"));
      pdf->writeString(std::string(" /LastChar 255"));
      pdf->writeString(std::string(" /Widths ["));
      int ch = 32;
      while (ch <= 255) {
        int cw = ttfFont->getCharWidth(ch);
        double scaledWd = (((double)(cw)) * 1000) / ((double)(ttfFont->unitsPerEm));
        int scaledW = (int)floor( scaledWd);
        pdf->writeString(std::to_string(scaledW));
        if ( ch < 255 ) {
          pdf->writeString(std::string(" "));
        }
        ch = ch + 1;
      };
      pdf->writeString(std::string("]"));
      pdf->writeString((std::string(" /FontDescriptor ") + (std::to_string(fontDescObjNum))) + std::string(" 0 R"));
      pdf->writeString(std::string(" /Encoding /WinAnsiEncoding"));
      pdf->writeString((std::string(" /ToUnicode ") + (std::to_string(toUnicodeObjNum))) + std::string(" 0 R"));
      pdf->writeString(std::string(" >>\n"));
      pdf->writeString(std::string("endobj\n\n"));
      fontObjNums.push_back( nextObjNum  );
      nextObjNum = nextObjNum + 1;
    } else {
      objectOffsets.push_back( (pdf)->size()  );
      pdf->writeString((std::to_string(nextObjNum)) + std::string(" 0 obj\n"));
      pdf->writeString(std::string("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\n"));
      pdf->writeString(std::string("endobj\n\n"));
      fontObjNums.push_back( nextObjNum  );
      nextObjNum = nextObjNum + 1;
    }
    fi = fi + 1;
  };
  if ( ((int)(fontObjNums.size())) == 0 ) {
    objectOffsets.push_back( (pdf)->size()  );
    pdf->writeString((std::to_string(nextObjNum)) + std::string(" 0 obj\n"));
    pdf->writeString(std::string("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\n"));
    pdf->writeString(std::string("endobj\n\n"));
    fontObjNums.push_back( nextObjNum  );
    nextObjNum = nextObjNum + 1;
  }
  int imgIdx = 0;
  while (imgIdx < ((int)(embeddedImages.size()))) {
    std::shared_ptr<EmbeddedImage> embImg = embeddedImages.at(imgIdx);
    std::string imgSrc = embImg->src;
    std::string imgDir = baseDir;
    std::string imgFile = imgSrc;
    if ( ((int)(imgSrc.length())) > 2 ) {
      std::string prefix = r_utf8_substr(imgSrc, 0, 2 - 0);
      if ( prefix == std::string("./") ) {
        imgSrc = r_utf8_substr(imgSrc, 2, ((int)(imgSrc.length())) - 2);
      }
    }
    int lastSlash = r_string_last_index_of(imgSrc , std::string("/"));
    int lastBackslash = r_string_last_index_of(imgSrc , std::string("\\"));
    int lastSep = lastSlash;
    if ( lastBackslash > lastSep ) {
      lastSep = lastBackslash;
    }
    if ( lastSep >= 0 ) {
      imgDir = baseDir + (r_utf8_substr(imgSrc, 0, (lastSep + 1) - 0));
      imgFile = r_utf8_substr(imgSrc, (lastSep + 1), ((int)(imgSrc.length())) - (lastSep + 1));
    } else {
      imgDir = baseDir;
      imgFile = imgSrc;
    }
    std::cout << ((std::string("Loading image: dir=") + imgDir) + std::string(" file=")) + imgFile << std::endl;
    std::shared_ptr<JPEGMetadataInfo> metaInfo = metadataParser->parseMetadata(imgDir, imgFile);
    embImg->orientation = metaInfo->orientation;
    std::shared_ptr<ImageBuffer> imgBuffer = jpegDecoder->decode(imgDir, imgFile);
    if ( (imgBuffer->width > 1) && (imgBuffer->height > 1) ) {
      if ( metaInfo->orientation > 1 ) {
        std::cout << std::string("  Applying EXIF orientation: ") + (std::to_string(metaInfo->orientation)) << std::endl;
        imgBuffer = imgBuffer->applyExifOrientation(metaInfo->orientation);
      }
      int origW = imgBuffer->width;
      int origH = imgBuffer->height;
      int newW = origW;
      int newH = origH;
      if ( (origW > maxImageWidth) || (origH > maxImageHeight) ) {
        double scaleW = ((double)(maxImageWidth)) / ((double)(origW));
        double scaleH = ((double)(maxImageHeight)) / ((double)(origH));
        double scale = scaleW;
        if ( scaleH < scaleW ) {
          scale = scaleH;
        }
        newW = (int)floor( (((double)(origW)) * scale));
        newH = (int)floor( (((double)(origH)) * scale));
        std::cout << ((((((std::string("  Resizing from ") + (std::to_string(origW))) + std::string("x")) + (std::to_string(origH))) + std::string(" to ")) + (std::to_string(newW))) + std::string("x")) + (std::to_string(newH)) << std::endl;
        imgBuffer = imgBuffer->scaleToSize(newW, newH);
      }
      jpegEncoder->setQuality(jpegQuality);
      std::vector<uint8_t> encodedData = jpegEncoder->encodeToBuffer(imgBuffer);
      int encodedLen = static_cast<int64_t>(encodedData.size());
      embImg->width = newW;
      embImg->height = newH;
      objectOffsets.push_back( (pdf)->size()  );
      pdf->writeString((std::to_string(nextObjNum)) + std::string(" 0 obj\n"));
      pdf->writeString(std::string("<< /Type /XObject"));
      pdf->writeString(std::string(" /Subtype /Image"));
      pdf->writeString(std::string(" /Width ") + (std::to_string(newW)));
      pdf->writeString(std::string(" /Height ") + (std::to_string(newH)));
      pdf->writeString(std::string(" /ColorSpace /DeviceRGB"));
      pdf->writeString(std::string(" /BitsPerComponent 8"));
      pdf->writeString(std::string(" /Filter /DCTDecode"));
      pdf->writeString(std::string(" /Length ") + (std::to_string(encodedLen)));
      pdf->writeString(std::string(" >>\n"));
      pdf->writeString(std::string("stream\n"));
      pdf->writeBuffer(encodedData);
      pdf->writeString(std::string("\nendstream\n"));
      pdf->writeString(std::string("endobj\n\n"));
      embImg->objNum = nextObjNum;
      embImg->pdfName = std::string("/Im") + (std::to_string((imgIdx + 1)));
      nextObjNum = nextObjNum + 1;
      std::cout << (((((std::string("Embedded image: ") + embImg->src) + std::string(" (")) + (std::to_string(newW))) + std::string("x")) + (std::to_string(newH))) + std::string(")") << std::endl;
    } else {
      std::cout << std::string("Failed to decode image: ") + embImg->src << std::endl;
    }
    imgIdx = imgIdx + 1;
  };
  std::vector<int> contentObjNumList;
  int ci = 0;
  while (ci < numPages) {
    std::vector<uint8_t> contentData_1 = contentDataList.at(ci);
    int contentLen = static_cast<int64_t>(contentData_1.size());
    objectOffsets.push_back( (pdf)->size()  );
    pdf->writeString((std::to_string(nextObjNum)) + std::string(" 0 obj\n"));
    pdf->writeString((std::string("<< /Length ") + (std::to_string(contentLen))) + std::string(" >>\n"));
    pdf->writeString(std::string("stream\n"));
    pdf->writeBuffer(contentData_1);
    pdf->writeString(std::string("\nendstream\n"));
    pdf->writeString(std::string("endobj\n\n"));
    contentObjNumList.push_back( nextObjNum  );
    nextObjNum = nextObjNum + 1;
    ci = ci + 1;
  };
  std::vector<int> pageObjNumList;
  int pagesRefNum = nextObjNum + numPages;
  int pi2 = 0;
  while (pi2 < numPages) {
    double pgWidth_1 = allPageWidths.at(pi2);
    double pgHeight_1 = allPageHeights.at(pi2);
    int contentObjN = contentObjNumList.at(pi2);
    objectOffsets.push_back( (pdf)->size()  );
    pdf->writeString((std::to_string(nextObjNum)) + std::string(" 0 obj\n"));
    pdf->writeString((std::string("<< /Type /Page /Parent ") + (std::to_string(pagesRefNum))) + std::string(" 0 R"));
    pdf->writeString((((std::string(" /MediaBox [0 0 ") + this->formatNum(pgWidth_1)) + std::string(" ")) + this->formatNum(pgHeight_1)) + std::string("]"));
    pdf->writeString((std::string(" /Contents ") + (std::to_string(contentObjN))) + std::string(" 0 R"));
    pdf->writeString(std::string(" /Resources <<"));
    pdf->writeString(std::string(" /Font <<"));
    int ffi = 0;
    while (ffi < ((int)(fontObjNums.size()))) {
      int fontObjN = fontObjNums.at(ffi);
      pdf->writeString((((std::string(" /F") + (std::to_string((ffi + 1)))) + std::string(" ")) + (std::to_string(fontObjN))) + std::string(" 0 R"));
      ffi = ffi + 1;
    };
    pdf->writeString(std::string(" >>"));
    if ( ((int)(embeddedImages.size())) > 0 ) {
      pdf->writeString(std::string(" /XObject <<"));
      int ii = 0;
      while (ii < ((int)(embeddedImages.size()))) {
        std::shared_ptr<EmbeddedImage> embImg_1 = embeddedImages.at(ii);
        if ( embImg_1->objNum > 0 ) {
          pdf->writeString((((std::string(" /Im") + (std::to_string((ii + 1)))) + std::string(" ")) + (std::to_string(embImg_1->objNum))) + std::string(" 0 R"));
        }
        ii = ii + 1;
      };
      pdf->writeString(std::string(" >>"));
    }
    pdf->writeString(std::string(" >> >>\n"));
    pdf->writeString(std::string("endobj\n\n"));
    pageObjNumList.push_back( nextObjNum  );
    nextObjNum = nextObjNum + 1;
    pi2 = pi2 + 1;
  };
  objectOffsets.push_back( (pdf)->size()  );
  pdf->writeString((std::to_string(nextObjNum)) + std::string(" 0 obj\n"));
  pdf->writeString(std::string("<< /Type /Pages /Kids ["));
  int ki = 0;
  while (ki < numPages) {
    int pageObjN = pageObjNumList.at(ki);
    pdf->writeString((std::to_string(pageObjN)) + std::string(" 0 R"));
    if ( ki < (numPages - 1) ) {
      pdf->writeString(std::string(" "));
    }
    ki = ki + 1;
  };
  pdf->writeString((std::string("] /Count ") + (std::to_string(numPages))) + std::string(" >>\n"));
  pdf->writeString(std::string("endobj\n\n"));
  pagesObjNum = nextObjNum;
  nextObjNum = nextObjNum + 1;
  objectOffsets.push_back( (pdf)->size()  );
  pdf->writeString((std::to_string(nextObjNum)) + std::string(" 0 obj\n"));
  pdf->writeString((std::string("<< /Type /Catalog /Pages ") + (std::to_string(pagesObjNum))) + std::string(" 0 R >>\n"));
  pdf->writeString(std::string("endobj\n\n"));
  int catalogObjNum = nextObjNum;
  nextObjNum = nextObjNum + 1;
  int xrefOffset = (pdf)->size();
  pdf->writeString(std::string("xref\n"));
  pdf->writeString((std::string("0 ") + (std::to_string(nextObjNum))) + std::string("\n"));
  pdf->writeString(std::string("0000000000 65535 f \n"));
  int xi = 0;
  while (xi < ((int)(objectOffsets.size()))) {
    int offset = objectOffsets.at(xi);
    pdf->writeString(this->padLeft((std::to_string(offset)), 10, std::string("0")) + std::string(" 00000 n \n"));
    xi = xi + 1;
  };
  pdf->writeString(std::string("trailer\n"));
  pdf->writeString((((std::string("<< /Size ") + (std::to_string(nextObjNum))) + std::string(" /Root ")) + (std::to_string(catalogObjNum))) + std::string(" 0 R >>\n"));
  pdf->writeString(std::string("startxref\n"));
  pdf->writeString((std::to_string(xrefOffset)) + std::string("\n"));
  pdf->writeString(std::string("%%EOF\n"));
  return pdf->toBuffer();
}
std::vector<uint8_t>  EVGPDFRenderer::renderToPDF( std::shared_ptr<EVGElement> root ) {
  std::shared_ptr<GrowableBuffer> pdf =  std::make_shared<GrowableBuffer>();
  nextObjNum = 1;
  contentObjNums.clear();
  usedFontNames.clear();
  embeddedFonts.clear();
  embeddedImages.clear();
  pdf->writeString(std::string("%PDF-1.5\n"));
  pdf->writeByte(37);
  pdf->writeByte(226);
  pdf->writeByte(227);
  pdf->writeByte(207);
  pdf->writeByte(211);
  pdf->writeByte(10);
  std::vector<int> objectOffsets;
  (streamBuffer)->clear();
  this->renderElement(root, 0, 0);
  std::vector<uint8_t> contentData = streamBuffer->toBuffer();
  int contentLen = static_cast<int64_t>(contentData.size());
  std::vector<int> fontObjNums;
  int i = 0;
  while (i < ((int)(usedFontNames.size()))) {
    std::string fontName = usedFontNames.at(i);
    std::shared_ptr<TrueTypeFont> ttfFont = fontManager->getFont(fontName);
    if ( ttfFont->unitsPerEm > 0 ) {
      std::vector<uint8_t> fontFileData = ttfFont->getFontData();
      int fontFileLen = static_cast<int64_t>(fontFileData.size());
      objectOffsets.push_back( (pdf)->size()  );
      pdf->writeString((std::to_string(nextObjNum)) + std::string(" 0 obj\n"));
      pdf->writeString((((std::string("<< /Length ") + (std::to_string(fontFileLen))) + std::string(" /Length1 ")) + (std::to_string(fontFileLen))) + std::string(" >>\n"));
      pdf->writeString(std::string("stream\n"));
      pdf->writeBuffer(fontFileData);
      pdf->writeString(std::string("\nendstream\n"));
      pdf->writeString(std::string("endobj\n\n"));
      int fontFileObjNum = nextObjNum;
      nextObjNum = nextObjNum + 1;
      objectOffsets.push_back( (pdf)->size()  );
      pdf->writeString((std::to_string(nextObjNum)) + std::string(" 0 obj\n"));
      pdf->writeString(std::string("<< /Type /FontDescriptor"));
      pdf->writeString(std::string(" /FontName /") + this->sanitizeFontName(ttfFont->fontFamily));
      pdf->writeString(std::string(" /Flags 32"));
      pdf->writeString((((std::string(" /FontBBox [0 ") + (std::to_string(ttfFont->descender))) + std::string(" 1000 ")) + (std::to_string(ttfFont->ascender))) + std::string("]"));
      pdf->writeString(std::string(" /ItalicAngle 0"));
      pdf->writeString(std::string(" /Ascent ") + (std::to_string(ttfFont->ascender)));
      pdf->writeString(std::string(" /Descent ") + (std::to_string(ttfFont->descender)));
      pdf->writeString(std::string(" /CapHeight ") + (std::to_string(ttfFont->ascender)));
      pdf->writeString(std::string(" /StemV 80"));
      pdf->writeString((std::string(" /FontFile2 ") + (std::to_string(fontFileObjNum))) + std::string(" 0 R"));
      pdf->writeString(std::string(" >>\n"));
      pdf->writeString(std::string("endobj\n\n"));
      int fontDescObjNum = nextObjNum;
      nextObjNum = nextObjNum + 1;
      objectOffsets.push_back( (pdf)->size()  );
      pdf->writeString((std::to_string(nextObjNum)) + std::string(" 0 obj\n"));
      std::string toUnicodeStream = std::string("/CIDInit /ProcSet findresource begin\n12 dict begin\nbegincmap\n/CIDSystemInfo << /Registry (Adobe) /Ordering (UCS) /Supplement 0 >> def\n/CMapName /Adobe-Identity-UCS def\n/CMapType 2 def\n1 begincodespacerange\n<00> <FF>\nendcodespacerange\n");
      toUnicodeStream = toUnicodeStream + std::string("2 beginbfrange\n<20> <7E> <0020>\n<A0> <FF> <00A0>\nendbfrange\n");
      toUnicodeStream = toUnicodeStream + std::string("endcmap\nCMapName currentdict /CMap defineresource pop\nend\nend");
      int toUnicodeLen = (int)(toUnicodeStream.length());
      pdf->writeString((std::string("<< /Length ") + (std::to_string(toUnicodeLen))) + std::string(" >>\n"));
      pdf->writeString(std::string("stream\n"));
      pdf->writeString(toUnicodeStream);
      pdf->writeString(std::string("\nendstream\n"));
      pdf->writeString(std::string("endobj\n\n"));
      int toUnicodeObjNum = nextObjNum;
      nextObjNum = nextObjNum + 1;
      objectOffsets.push_back( (pdf)->size()  );
      pdf->writeString((std::to_string(nextObjNum)) + std::string(" 0 obj\n"));
      pdf->writeString(std::string("<< /Type /Font"));
      pdf->writeString(std::string(" /Subtype /TrueType"));
      pdf->writeString(std::string(" /BaseFont /") + this->sanitizeFontName(ttfFont->fontFamily));
      pdf->writeString(std::string(" /FirstChar 32"));
      pdf->writeString(std::string(" /LastChar 255"));
      pdf->writeString(std::string(" /Widths ["));
      int ch = 32;
      while (ch <= 255) {
        int w = ttfFont->getCharWidth(ch);
        double scaledWd = (((double)(w)) * 1000) / ((double)(ttfFont->unitsPerEm));
        int scaledW = (int)floor( scaledWd);
        pdf->writeString(std::to_string(scaledW));
        if ( ch < 255 ) {
          pdf->writeString(std::string(" "));
        }
        ch = ch + 1;
      };
      pdf->writeString(std::string("]"));
      pdf->writeString((std::string(" /FontDescriptor ") + (std::to_string(fontDescObjNum))) + std::string(" 0 R"));
      pdf->writeString(std::string(" /Encoding /WinAnsiEncoding"));
      pdf->writeString((std::string(" /ToUnicode ") + (std::to_string(toUnicodeObjNum))) + std::string(" 0 R"));
      pdf->writeString(std::string(" >>\n"));
      pdf->writeString(std::string("endobj\n\n"));
      fontObjNums.push_back( nextObjNum  );
      nextObjNum = nextObjNum + 1;
    } else {
      objectOffsets.push_back( (pdf)->size()  );
      pdf->writeString((std::to_string(nextObjNum)) + std::string(" 0 obj\n"));
      pdf->writeString(std::string("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\n"));
      pdf->writeString(std::string("endobj\n\n"));
      fontObjNums.push_back( nextObjNum  );
      nextObjNum = nextObjNum + 1;
    }
    i = i + 1;
  };
  if ( ((int)(fontObjNums.size())) == 0 ) {
    objectOffsets.push_back( (pdf)->size()  );
    pdf->writeString((std::to_string(nextObjNum)) + std::string(" 0 obj\n"));
    pdf->writeString(std::string("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\n"));
    pdf->writeString(std::string("endobj\n\n"));
    fontObjNums.push_back( nextObjNum  );
    nextObjNum = nextObjNum + 1;
  }
  int imgIdx = 0;
  while (imgIdx < ((int)(embeddedImages.size()))) {
    std::shared_ptr<EmbeddedImage> embImg = embeddedImages.at(imgIdx);
    std::string imgSrc = embImg->src;
    std::string imgDir = baseDir;
    std::string imgFile = imgSrc;
    if ( ((int)(imgSrc.length())) > 2 ) {
      std::string prefix = r_utf8_substr(imgSrc, 0, 2 - 0);
      if ( prefix == std::string("./") ) {
        imgSrc = r_utf8_substr(imgSrc, 2, ((int)(imgSrc.length())) - 2);
      }
    }
    int lastSlash = r_string_last_index_of(imgSrc , std::string("/"));
    int lastBackslash = r_string_last_index_of(imgSrc , std::string("\\"));
    int lastSep = lastSlash;
    if ( lastBackslash > lastSep ) {
      lastSep = lastBackslash;
    }
    if ( lastSep >= 0 ) {
      imgDir = baseDir + (r_utf8_substr(imgSrc, 0, (lastSep + 1) - 0));
      imgFile = r_utf8_substr(imgSrc, (lastSep + 1), ((int)(imgSrc.length())) - (lastSep + 1));
    } else {
      imgDir = baseDir;
      imgFile = imgSrc;
    }
    std::cout << ((std::string("Loading image: dir=") + imgDir) + std::string(" file=")) + imgFile << std::endl;
    std::shared_ptr<JPEGMetadataInfo> metaInfo = metadataParser->parseMetadata(imgDir, imgFile);
    embImg->orientation = metaInfo->orientation;
    std::shared_ptr<ImageBuffer> imgBuffer = jpegDecoder->decode(imgDir, imgFile);
    if ( (imgBuffer->width > 1) && (imgBuffer->height > 1) ) {
      if ( metaInfo->orientation > 1 ) {
        std::cout << std::string("  Applying EXIF orientation: ") + (std::to_string(metaInfo->orientation)) << std::endl;
        imgBuffer = imgBuffer->applyExifOrientation(metaInfo->orientation);
      }
      int origW = imgBuffer->width;
      int origH = imgBuffer->height;
      int newW = origW;
      int newH = origH;
      if ( (origW > maxImageWidth) || (origH > maxImageHeight) ) {
        double scaleW = ((double)(maxImageWidth)) / ((double)(origW));
        double scaleH = ((double)(maxImageHeight)) / ((double)(origH));
        double scale = scaleW;
        if ( scaleH < scaleW ) {
          scale = scaleH;
        }
        newW = (int)floor( (((double)(origW)) * scale));
        newH = (int)floor( (((double)(origH)) * scale));
        std::cout << ((((((std::string("  Resizing from ") + (std::to_string(origW))) + std::string("x")) + (std::to_string(origH))) + std::string(" to ")) + (std::to_string(newW))) + std::string("x")) + (std::to_string(newH)) << std::endl;
        imgBuffer = imgBuffer->scaleToSize(newW, newH);
      }
      jpegEncoder->setQuality(jpegQuality);
      std::vector<uint8_t> encodedData = jpegEncoder->encodeToBuffer(imgBuffer);
      int encodedLen = static_cast<int64_t>(encodedData.size());
      embImg->width = newW;
      embImg->height = newH;
      objectOffsets.push_back( (pdf)->size()  );
      pdf->writeString((std::to_string(nextObjNum)) + std::string(" 0 obj\n"));
      pdf->writeString(std::string("<< /Type /XObject"));
      pdf->writeString(std::string(" /Subtype /Image"));
      pdf->writeString(std::string(" /Width ") + (std::to_string(newW)));
      pdf->writeString(std::string(" /Height ") + (std::to_string(newH)));
      pdf->writeString(std::string(" /ColorSpace /DeviceRGB"));
      pdf->writeString(std::string(" /BitsPerComponent 8"));
      pdf->writeString(std::string(" /Filter /DCTDecode"));
      pdf->writeString(std::string(" /Length ") + (std::to_string(encodedLen)));
      pdf->writeString(std::string(" >>\n"));
      pdf->writeString(std::string("stream\n"));
      pdf->writeBuffer(encodedData);
      pdf->writeString(std::string("\nendstream\n"));
      pdf->writeString(std::string("endobj\n\n"));
      embImg->objNum = nextObjNum;
      embImg->pdfName = std::string("/Im") + (std::to_string((imgIdx + 1)));
      nextObjNum = nextObjNum + 1;
      std::cout << (((((((std::string("Embedded image: ") + imgSrc) + std::string(" (resized to ")) + (std::to_string(newW))) + std::string("x")) + (std::to_string(newH))) + std::string(", ")) + (std::to_string(encodedLen))) + std::string(" bytes)") << std::endl;
    } else {
      std::cout << std::string("Failed to decode image: ") + imgSrc << std::endl;
    }
    imgIdx = imgIdx + 1;
  };
  objectOffsets.push_back( (pdf)->size()  );
  pdf->writeString((std::to_string(nextObjNum)) + std::string(" 0 obj\n"));
  pdf->writeString((std::string("<< /Length ") + (std::to_string(contentLen))) + std::string(" >>\n"));
  pdf->writeString(std::string("stream\n"));
  pdf->writeBuffer(contentData);
  pdf->writeString(std::string("\nendstream\n"));
  pdf->writeString(std::string("endobj\n\n"));
  int contentObjNum = nextObjNum;
  nextObjNum = nextObjNum + 1;
  objectOffsets.push_back( (pdf)->size()  );
  pdf->writeString((std::to_string(nextObjNum)) + std::string(" 0 obj\n"));
  int pagesRef = nextObjNum + 1;
  pdf->writeString((std::string("<< /Type /Page /Parent ") + (std::to_string(pagesRef))) + std::string(" 0 R"));
  pdf->writeString((((std::string(" /MediaBox [0 0 ") + this->formatNum(pageWidth)) + std::string(" ")) + this->formatNum(pageHeight)) + std::string("]"));
  pdf->writeString((std::string(" /Contents ") + (std::to_string(contentObjNum))) + std::string(" 0 R"));
  pdf->writeString(std::string(" /Resources <<"));
  pdf->writeString(std::string(" /Font <<"));
  int fi = 0;
  while (fi < ((int)(fontObjNums.size()))) {
    int fontObjN = fontObjNums.at(fi);
    pdf->writeString((((std::string(" /F") + (std::to_string((fi + 1)))) + std::string(" ")) + (std::to_string(fontObjN))) + std::string(" 0 R"));
    fi = fi + 1;
  };
  pdf->writeString(std::string(" >>"));
  if ( ((int)(embeddedImages.size())) > 0 ) {
    pdf->writeString(std::string(" /XObject <<"));
    int ii = 0;
    while (ii < ((int)(embeddedImages.size()))) {
      std::shared_ptr<EmbeddedImage> embImg_1 = embeddedImages.at(ii);
      if ( embImg_1->objNum > 0 ) {
        pdf->writeString((((std::string(" /Im") + (std::to_string((ii + 1)))) + std::string(" ")) + (std::to_string(embImg_1->objNum))) + std::string(" 0 R"));
      }
      ii = ii + 1;
    };
    pdf->writeString(std::string(" >>"));
  }
  pdf->writeString(std::string(" >> >>\n"));
  pdf->writeString(std::string("endobj\n\n"));
  int pageObjNum = nextObjNum;
  nextObjNum = nextObjNum + 1;
  objectOffsets.push_back( (pdf)->size()  );
  pdf->writeString((std::to_string(nextObjNum)) + std::string(" 0 obj\n"));
  pdf->writeString((std::string("<< /Type /Pages /Kids [") + (std::to_string(pageObjNum))) + std::string(" 0 R] /Count 1 >>\n"));
  pdf->writeString(std::string("endobj\n\n"));
  pagesObjNum = nextObjNum;
  nextObjNum = nextObjNum + 1;
  objectOffsets.push_back( (pdf)->size()  );
  pdf->writeString((std::to_string(nextObjNum)) + std::string(" 0 obj\n"));
  pdf->writeString((std::string("<< /Type /Catalog /Pages ") + (std::to_string(pagesObjNum))) + std::string(" 0 R >>\n"));
  pdf->writeString(std::string("endobj\n\n"));
  int catalogObjNum = nextObjNum;
  nextObjNum = nextObjNum + 1;
  int xrefOffset = (pdf)->size();
  pdf->writeString(std::string("xref\n"));
  pdf->writeString((std::string("0 ") + (std::to_string(nextObjNum))) + std::string("\n"));
  pdf->writeString(std::string("0000000000 65535 f \n"));
  int i_2 = 0;
  while (i_2 < ((int)(objectOffsets.size()))) {
    int offset = objectOffsets.at(i_2);
    pdf->writeString(this->padLeft((std::to_string(offset)), 10, std::string("0")) + std::string(" 00000 n \n"));
    i_2 = i_2 + 1;
  };
  pdf->writeString(std::string("trailer\n"));
  pdf->writeString((((std::string("<< /Size ") + (std::to_string(nextObjNum))) + std::string(" /Root ")) + (std::to_string(catalogObjNum))) + std::string(" 0 R >>\n"));
  pdf->writeString(std::string("startxref\n"));
  pdf->writeString((std::to_string(xrefOffset)) + std::string("\n"));
  pdf->writeString(std::string("%%EOF\n"));
  return pdf->toBuffer();
}
void  EVGPDFRenderer::renderElement( std::shared_ptr<EVGElement> el , double offsetX , double offsetY ) {
  double x = el->calculatedX + offsetX;
  double y = el->calculatedY + offsetY;
  double w = el->calculatedWidth;
  double h = el->calculatedHeight;
  double pdfY = (pageHeight - y) - h;
  bool hasClipPath = false;
  if ( ((int)(el->clipPath.length())) > 0 ) {
    hasClipPath = true;
    streamBuffer->writeString(std::string("q\n"));
    this->applyClipPath(el->clipPath, x, pdfY, w, h);
  }
  std::shared_ptr<EVGColor> bgColor = el->backgroundColor;
  if ( this->debug ) {
    std::cout << ((((std::string("  bg check: ") + el->tagName) + std::string(" isSet=")) + ((bgColor->isSet ? "true" : "false"))) + std::string(" r=")) + (std::to_string(bgColor->r)) << std::endl;
  }
  if ( bgColor->isSet ) {
    this->renderBackground(x, pdfY, w, h, bgColor);
  }
  this->renderBorder(el, x, pdfY, w, h);
  if ( el->tagName == std::string("text") ) {
    this->renderText(el, x, pdfY, w, h);
  }
  if ( el->tagName == std::string("divider") ) {
    this->renderDivider(el, x, pdfY, w, h);
  }
  if ( el->tagName == std::string("image") ) {
    this->renderImage(el, x, pdfY, w, h);
  }
  if ( el->tagName == std::string("path") ) {
    this->renderPath(el, x, pdfY, w, h);
  }
  int i = 0;
  int childCount = el->getChildCount();
  while (i < childCount) {
    std::shared_ptr<EVGElement> child = el->getChild(i);
    this->renderElement(child, offsetX, offsetY);
    i = i + 1;
  };
  if ( hasClipPath ) {
    streamBuffer->writeString(std::string("Q\n"));
  }
}
std::string  EVGPDFRenderer::getImagePdfName( std::string src ) {
  int i = 0;
  while (i < ((int)(embeddedImages.size()))) {
    std::shared_ptr<EmbeddedImage> embImg = embeddedImages.at(i);
    if ( embImg->src == src ) {
      return std::string("/Im") + (std::to_string((i + 1)));
    }
    i = i + 1;
  };
  std::shared_ptr<EmbeddedImage> newImg =  std::make_shared<EmbeddedImage>(src);
  embeddedImages.push_back( newImg  );
  return std::string("/Im") + (std::to_string(((int)(embeddedImages.size()))));
}
void  EVGPDFRenderer::renderImage( std::shared_ptr<EVGElement> el , double x , double y , double w , double h ) {
  std::string src = el->src;
  if ( ((int)(src.length())) == 0 ) {
    return;
  }
  std::string imgName = this->getImagePdfName(src);
  streamBuffer->writeString(std::string("q\n"));
  streamBuffer->writeString(((((((this->formatNum(w) + std::string(" 0 0 ")) + this->formatNum(h)) + std::string(" ")) + this->formatNum(x)) + std::string(" ")) + this->formatNum(y)) + std::string(" cm\n"));
  streamBuffer->writeString(imgName + std::string(" Do\n"));
  streamBuffer->writeString(std::string("Q\n"));
}
void  EVGPDFRenderer::renderPath( std::shared_ptr<EVGElement> el , double x , double y , double w , double h ) {
  std::string pathData = el->svgPath;
  if ( ((int)(pathData.length())) == 0 ) {
    return;
  }
  std::shared_ptr<SVGPathParser> parser =  std::make_shared<SVGPathParser>();
  parser->parse(pathData);
  std::vector<std::shared_ptr<PathCommand>> commands = parser->getScaledCommands(w, h);
  std::shared_ptr<EVGColor> fillColor = el->fillColor;
  std::shared_ptr<EVGColor> strokeColor = el->strokeColor;
  if ( fillColor->isSet == false ) {
    fillColor  = el->backgroundColor;
  }
  streamBuffer->writeString(std::string("q\n"));
  streamBuffer->writeString((((std::string("1 0 0 1 ") + this->formatNum(x)) + std::string(" ")) + this->formatNum(y)) + std::string(" cm\n"));
  streamBuffer->writeString((std::string("1 0 0 -1 0 ") + this->formatNum(h)) + std::string(" cm\n"));
  int i = 0;
  while (i < ((int)(commands.size()))) {
    std::shared_ptr<PathCommand> cmd = commands.at(i);
    if ( cmd->type == std::string("M") ) {
      streamBuffer->writeString(((this->formatNum(cmd->x) + std::string(" ")) + this->formatNum(cmd->y)) + std::string(" m\n"));
    }
    if ( cmd->type == std::string("L") ) {
      streamBuffer->writeString(((this->formatNum(cmd->x) + std::string(" ")) + this->formatNum(cmd->y)) + std::string(" l\n"));
    }
    if ( cmd->type == std::string("C") ) {
      streamBuffer->writeString(((((((((((this->formatNum(cmd->x1) + std::string(" ")) + this->formatNum(cmd->y1)) + std::string(" ")) + this->formatNum(cmd->x2)) + std::string(" ")) + this->formatNum(cmd->y2)) + std::string(" ")) + this->formatNum(cmd->x)) + std::string(" ")) + this->formatNum(cmd->y)) + std::string(" c\n"));
    }
    if ( cmd->type == std::string("Q") ) {
      streamBuffer->writeString(((((((((((this->formatNum(cmd->x1) + std::string(" ")) + this->formatNum(cmd->y1)) + std::string(" ")) + this->formatNum(cmd->x1)) + std::string(" ")) + this->formatNum(cmd->y1)) + std::string(" ")) + this->formatNum(cmd->x)) + std::string(" ")) + this->formatNum(cmd->y)) + std::string(" c\n"));
    }
    if ( cmd->type == std::string("Z") ) {
      streamBuffer->writeString(std::string("h\n"));
    }
    i = i + 1;
  };
  if ( fillColor->isSet && strokeColor->isSet ) {
    double r = fillColor->r / 255;
    double g = fillColor->g / 255;
    double b = fillColor->b / 255;
    streamBuffer->writeString(((((this->formatNum(r) + std::string(" ")) + this->formatNum(g)) + std::string(" ")) + this->formatNum(b)) + std::string(" rg\n"));
    double sr = strokeColor->r / 255;
    double sg = strokeColor->g / 255;
    double sb = strokeColor->b / 255;
    streamBuffer->writeString(((((this->formatNum(sr) + std::string(" ")) + this->formatNum(sg)) + std::string(" ")) + this->formatNum(sb)) + std::string(" RG\n"));
    if ( el->strokeWidth > 0 ) {
      streamBuffer->writeString(this->formatNum(el->strokeWidth) + std::string(" w\n"));
    }
    streamBuffer->writeString(std::string("B\n"));
  } else {
    if ( fillColor->isSet ) {
      double r_1 = fillColor->r / 255;
      double g_1 = fillColor->g / 255;
      double b_1 = fillColor->b / 255;
      streamBuffer->writeString(((((this->formatNum(r_1) + std::string(" ")) + this->formatNum(g_1)) + std::string(" ")) + this->formatNum(b_1)) + std::string(" rg\n"));
      streamBuffer->writeString(std::string("f\n"));
    } else {
      if ( strokeColor->isSet ) {
        double sr_1 = strokeColor->r / 255;
        double sg_1 = strokeColor->g / 255;
        double sb_1 = strokeColor->b / 255;
        streamBuffer->writeString(((((this->formatNum(sr_1) + std::string(" ")) + this->formatNum(sg_1)) + std::string(" ")) + this->formatNum(sb_1)) + std::string(" RG\n"));
        if ( el->strokeWidth > 0 ) {
          streamBuffer->writeString(this->formatNum(el->strokeWidth) + std::string(" w\n"));
        }
        streamBuffer->writeString(std::string("S\n"));
      }
    }
  }
  streamBuffer->writeString(std::string("Q\n"));
}
void  EVGPDFRenderer::applyClipPath( std::string pathData , double x , double y , double w , double h ) {
  std::shared_ptr<SVGPathParser> parser =  std::make_shared<SVGPathParser>();
  parser->parse(pathData);
  std::vector<std::shared_ptr<PathCommand>> commands = parser->getScaledCommands(w, h);
  int i = 0;
  while (i < ((int)(commands.size()))) {
    std::shared_ptr<PathCommand> cmd = commands.at(i);
    double px = x + cmd->x;
    double py = (y + h) - cmd->y;
    double px1 = x + cmd->x1;
    double py1 = (y + h) - cmd->y1;
    double px2 = x + cmd->x2;
    double py2 = (y + h) - cmd->y2;
    if ( cmd->type == std::string("M") ) {
      streamBuffer->writeString(((this->formatNum(px) + std::string(" ")) + this->formatNum(py)) + std::string(" m\n"));
    }
    if ( cmd->type == std::string("L") ) {
      streamBuffer->writeString(((this->formatNum(px) + std::string(" ")) + this->formatNum(py)) + std::string(" l\n"));
    }
    if ( cmd->type == std::string("C") ) {
      streamBuffer->writeString(((((((((((this->formatNum(px1) + std::string(" ")) + this->formatNum(py1)) + std::string(" ")) + this->formatNum(px2)) + std::string(" ")) + this->formatNum(py2)) + std::string(" ")) + this->formatNum(px)) + std::string(" ")) + this->formatNum(py)) + std::string(" c\n"));
    }
    if ( cmd->type == std::string("Q") ) {
      streamBuffer->writeString(((((((((((this->formatNum(px1) + std::string(" ")) + this->formatNum(py1)) + std::string(" ")) + this->formatNum(px1)) + std::string(" ")) + this->formatNum(py1)) + std::string(" ")) + this->formatNum(px)) + std::string(" ")) + this->formatNum(py)) + std::string(" c\n"));
    }
    if ( cmd->type == std::string("Z") ) {
      streamBuffer->writeString(std::string("h\n"));
    }
    i = i + 1;
  };
  streamBuffer->writeString(std::string("W n\n"));
}
void  EVGPDFRenderer::renderBackground( double x , double y , double w , double h , std::shared_ptr<EVGColor> color ) {
  streamBuffer->writeString(std::string("q\n"));
  double r = color->r / 255;
  double g = color->g / 255;
  double b = color->b / 255;
  streamBuffer->writeString(((((this->formatNum(r) + std::string(" ")) + this->formatNum(g)) + std::string(" ")) + this->formatNum(b)) + std::string(" rg\n"));
  streamBuffer->writeString(((((((this->formatNum(x) + std::string(" ")) + this->formatNum(y)) + std::string(" ")) + this->formatNum(w)) + std::string(" ")) + this->formatNum(h)) + std::string(" re\n"));
  streamBuffer->writeString(std::string("f\n"));
  streamBuffer->writeString(std::string("Q\n"));
}
void  EVGPDFRenderer::renderBorder( std::shared_ptr<EVGElement> el , double x , double y , double w , double h ) {
  double borderWidth = el->box->borderWidth->pixels;
  if ( borderWidth <= 0 ) {
    return;
  }
  std::shared_ptr<EVGColor> borderColor = el->box->borderColor;
  if ( borderColor->isSet == false ) {
    borderColor = EVGColor::black();
  }
  streamBuffer->writeString(std::string("q\n"));
  double r = borderColor->r / 255;
  double g = borderColor->g / 255;
  double b = borderColor->b / 255;
  streamBuffer->writeString(((((this->formatNum(r) + std::string(" ")) + this->formatNum(g)) + std::string(" ")) + this->formatNum(b)) + std::string(" RG\n"));
  streamBuffer->writeString(this->formatNum(borderWidth) + std::string(" w\n"));
  streamBuffer->writeString(((((((this->formatNum(x) + std::string(" ")) + this->formatNum(y)) + std::string(" ")) + this->formatNum(w)) + std::string(" ")) + this->formatNum(h)) + std::string(" re\n"));
  streamBuffer->writeString(std::string("S\n"));
  streamBuffer->writeString(std::string("Q\n"));
}
void  EVGPDFRenderer::renderText( std::shared_ptr<EVGElement> el , double x , double y , double w , double h ) {
  std::string text = this->getTextContent(el);
  if ( ((int)(text.length())) == 0 ) {
    return;
  }
  double fontSize = 14;
  if ( el->fontSize->isSet ) {
    fontSize = el->fontSize->pixels;
  }
  std::shared_ptr<EVGColor> color = el->color;
  if ( color->isSet == false ) {
    color  = EVGColor::black();
  }
  double lineHeight = el->lineHeight;
  if ( lineHeight <= 0 ) {
    lineHeight = 1.2;
  }
  double lineSpacing = fontSize * lineHeight;
  std::string fontFamily = el->fontFamily;
  if ( ((int)(fontFamily.length())) == 0 ) {
    fontFamily = std::string("Helvetica");
  }
  std::vector<std::string> lines = this->wrapText(text, w, fontSize, fontFamily);
  std::string fontName = this->getPdfFontName(fontFamily);
  double lineY = (y + h) - fontSize;
  int i = 0;
  while (i < ((int)(lines.size()))) {
    std::string line = lines.at(i);
    streamBuffer->writeString(std::string("BT\n"));
    streamBuffer->writeString(((fontName + std::string(" ")) + this->formatNum(fontSize)) + std::string(" Tf\n"));
    double r = color->r / 255;
    double g = color->g / 255;
    double b = color->b / 255;
    streamBuffer->writeString(((((this->formatNum(r) + std::string(" ")) + this->formatNum(g)) + std::string(" ")) + this->formatNum(b)) + std::string(" rg\n"));
    double textX = x;
    if ( el->textAlign == std::string("center") ) {
      double textWidth = measurer->measureTextWidth(line, fontFamily, fontSize);
      textX = x + ((w - textWidth) / 2);
    }
    if ( el->textAlign == std::string("right") ) {
      double textWidth_1 = measurer->measureTextWidth(line, fontFamily, fontSize);
      textX = (x + w) - textWidth_1;
    }
    streamBuffer->writeString(((this->formatNum(textX) + std::string(" ")) + this->formatNum(lineY)) + std::string(" Td\n"));
    streamBuffer->writeString((std::string("(") + this->escapeText(line)) + std::string(") Tj\n"));
    streamBuffer->writeString(std::string("ET\n"));
    lineY = lineY - lineSpacing;
    i = i + 1;
  };
}
std::vector<std::string>  EVGPDFRenderer::wrapText( std::string text , double maxWidth , double fontSize , std::string fontFamily ) {
  std::vector<std::string> lines;
  std::vector<std::string> words = r_str_split( text, std::string(" "));
  std::string currentLine = std::string("");
  int i = 0;
  while (i < ((int)(words.size()))) {
    std::string word = words.at(i);
    std::string testLine = std::string("");
    if ( ((int)(currentLine.length())) == 0 ) {
      testLine = word;
    } else {
      testLine = (currentLine + std::string(" ")) + word;
    }
    double testWidth = measurer->measureTextWidth(testLine, fontFamily, fontSize);
    if ( (testWidth > maxWidth) && (((int)(currentLine.length())) > 0) ) {
      lines.push_back( currentLine  );
      currentLine = word;
    } else {
      currentLine = testLine;
    }
    i = i + 1;
  };
  if ( ((int)(currentLine.length())) > 0 ) {
    lines.push_back( currentLine  );
  }
  return lines;
}
void  EVGPDFRenderer::renderDivider( std::shared_ptr<EVGElement> el , double x , double y , double w , double h ) {
  std::shared_ptr<EVGColor> color = el->color;
  if ( color->isSet == false ) {
    color  = EVGColor::rgb(200, 200, 200);
  }
  double lineY = y + (h / 2);
  streamBuffer->writeString(std::string("q\n"));
  double r = color->r / 255;
  double g = color->g / 255;
  double b = color->b / 255;
  streamBuffer->writeString(((((this->formatNum(r) + std::string(" ")) + this->formatNum(g)) + std::string(" ")) + this->formatNum(b)) + std::string(" RG\n"));
  streamBuffer->writeString(std::string("1 w\n"));
  streamBuffer->writeString(((this->formatNum(x) + std::string(" ")) + this->formatNum(lineY)) + std::string(" m\n"));
  streamBuffer->writeString(((this->formatNum((x + w)) + std::string(" ")) + this->formatNum(lineY)) + std::string(" l\n"));
  streamBuffer->writeString(std::string("S\n"));
  streamBuffer->writeString(std::string("Q\n"));
}
std::string  EVGPDFRenderer::getTextContent( std::shared_ptr<EVGElement> el ) {
  if ( ((int)(el->textContent.length())) > 0 ) {
    return el->textContent;
  }
  std::string result = std::string("");
  int i = 0;
  int childCount = el->getChildCount();
  while (i < childCount) {
    std::shared_ptr<EVGElement> child = el->getChild(i);
    if ( child->tagName == std::string("text") ) {
      std::string childText = child->textContent;
      if ( ((int)(childText.length())) > 0 ) {
        if ( ((int)(result.length())) > 0 ) {
          int lastChar = result.at((((int)(result.length())) - 1));
          int firstChar = childText.at(0);
          if ( (lastChar != 32) && (firstChar != 32) ) {
            result = result + std::string(" ");
          }
        }
        result = result + childText;
      }
    }
    i = i + 1;
  };
  return result;
}
double  EVGPDFRenderer::estimateTextWidth( std::string text , double fontSize ) {
  return measurer->measureTextWidth(text, std::string("Helvetica"), fontSize);
}
std::string  EVGPDFRenderer::escapeText( std::string text ) {
  std::string result = std::string("");
  int __len = (int)(text.length());
  int i = 0;
  while (i < __len) {
    int ch = text.at(i);
    if ( ch == 40 ) {
      result = result + std::string("\\(");
    } else {
      if ( ch == 41 ) {
        result = result + std::string("\\)");
      } else {
        if ( ch == 92 ) {
          result = result + std::string("\\\\");
        } else {
          if ( ch < 32 ) {
            result = result + std::string(" ");
          } else {
            if ( ch <= 255 ) {
              result = result + (std::string(1, char(ch)));
            } else {
              if ( ch == 9733 ) {
                result = result + std::string("*");
              } else {
                if ( ch == 9734 ) {
                  result = result + std::string("*");
                } else {
                  if ( ch == 9829 ) {
                    result = result + (std::string(1, char(183)));
                  } else {
                    if ( ch == 9825 ) {
                      result = result + (std::string(1, char(183)));
                    } else {
                      if ( ch == 10003 ) {
                        result = result + std::string("v");
                      } else {
                        if ( ch == 10007 ) {
                          result = result + std::string("x");
                        } else {
                          if ( ch == 8226 ) {
                            result = result + (std::string(1, char(149)));
                          } else {
                            if ( ch == 8594 ) {
                              result = result + std::string("->");
                            } else {
                              if ( ch == 8592 ) {
                                result = result + std::string("<-");
                              } else {
                                result = result + std::string("?");
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
  return result;
}
std::string  EVGPDFRenderer::formatNum( double n ) {
  std::string result = std::to_string(n);
  return result;
}
std::string  EVGPDFRenderer::padLeft( std::string s , int __len , std::string padChar ) {
  std::string result = s;
  while (((int)(result.length())) < __len) {
    result = padChar + result;
  };
  return result;
}
std::string  EVGPDFRenderer::sanitizeFontName( std::string name ) {
  std::string result = std::string("");
  int __len = (int)(name.length());
  int i = 0;
  while (i < __len) {
    int ch = name.at(i);
    if ( (((ch >= 65) && (ch <= 90)) || ((ch >= 97) && (ch <= 122))) || ((ch >= 48) && (ch <= 57)) ) {
      result = result + (std::string(1, char(ch)));
    }
    i = i + 1;
  };
  return result;
}
EvalValue::EvalValue( ) {
  this->valueType = 0;
  this->numberValue = 0;
  this->stringValue = std::string("");
  this->boolValue = false;
  this->functionName = std::string("");
  this->functionBody = std::string("");
}
std::shared_ptr<EvalValue>  EvalValue::null() {
  std::shared_ptr<EvalValue> v =  std::make_shared<EvalValue>();
  v->valueType = 0;
  return v;
}
std::shared_ptr<EvalValue>  EvalValue::number( double n ) {
  std::shared_ptr<EvalValue> v =  std::make_shared<EvalValue>();
  v->valueType = 1;
  v->numberValue = n;
  return v;
}
std::shared_ptr<EvalValue>  EvalValue::fromInt( int n ) {
  std::shared_ptr<EvalValue> v =  std::make_shared<EvalValue>();
  v->valueType = 1;
  v->numberValue = (double)(n);
  return v;
}
std::shared_ptr<EvalValue>  EvalValue::string( std::string s ) {
  std::shared_ptr<EvalValue> v =  std::make_shared<EvalValue>();
  v->valueType = 2;
  v->stringValue = s;
  return v;
}
std::shared_ptr<EvalValue>  EvalValue::boolean( bool b ) {
  std::shared_ptr<EvalValue> v =  std::make_shared<EvalValue>();
  v->valueType = 3;
  v->boolValue = b;
  return v;
}
std::shared_ptr<EvalValue>  EvalValue::array( std::vector<std::shared_ptr<EvalValue>> items ) {
  std::shared_ptr<EvalValue> v =  std::make_shared<EvalValue>();
  v->valueType = 4;
  v->arrayValue = items;
  return v;
}
std::shared_ptr<EvalValue>  EvalValue::object( std::vector<std::string> keys , std::vector<std::shared_ptr<EvalValue>> values ) {
  std::shared_ptr<EvalValue> v =  std::make_shared<EvalValue>();
  v->valueType = 5;
  v->objectKeys = keys;
  v->objectValues = values;
  return v;
}
std::shared_ptr<EvalValue>  EvalValue::element( std::shared_ptr<EVGElement> el ) {
  std::shared_ptr<EvalValue> v =  std::make_shared<EvalValue>();
  v->valueType = 7;
  v->evgElement  = el;
  return v;
}
bool  EvalValue::isNull() {
  return valueType == 0;
}
bool  EvalValue::isNumber() {
  return valueType == 1;
}
bool  EvalValue::isString() {
  return valueType == 2;
}
bool  EvalValue::isBoolean() {
  return valueType == 3;
}
bool  EvalValue::isArray() {
  return valueType == 4;
}
bool  EvalValue::isObject() {
  return valueType == 5;
}
bool  EvalValue::isFunction() {
  return valueType == 6;
}
bool  EvalValue::isElement() {
  return valueType == 7;
}
double  EvalValue::toNumber() {
  if ( valueType == 1 ) {
    return numberValue;
  }
  if ( valueType == 2 ) {
     r_optional_primitive<double>  parsed = cpp_str_to_double(stringValue);
    return /*unwrap dbl*/parsed.value;
  }
  if ( valueType == 3 ) {
    if ( boolValue ) {
      return 1;
    }
    return 0;
  }
  return 0;
}
std::string  EvalValue::toString() {
  if ( valueType == 0 ) {
    return std::string("null");
  }
  if ( valueType == 1 ) {
    std::string s = std::to_string(numberValue);
    int intVal = (int)floor( numberValue);
    if ( ((double)(intVal)) == numberValue ) {
      return std::to_string(intVal);
    }
    return s;
  }
  if ( valueType == 2 ) {
    return stringValue;
  }
  if ( valueType == 3 ) {
    if ( boolValue ) {
      return std::string("true");
    }
    return std::string("false");
  }
  if ( valueType == 4 ) {
    std::string result = std::string("[");
    int i = 0;
    while (i < ((int)(arrayValue.size()))) {
      if ( i > 0 ) {
        result = result + std::string(", ");
      }
      std::shared_ptr<EvalValue> item = arrayValue.at(i);
      std::string itemStr = (item)->toString();
      result = result + itemStr;
      i = i + 1;
    };
    return result + std::string("]");
  }
  if ( valueType == 5 ) {
    std::string result_1 = std::string("{");
    int i_1 = 0;
    while (i_1 < ((int)(objectKeys.size()))) {
      if ( i_1 > 0 ) {
        result_1 = result_1 + std::string(", ");
      }
      std::string key = objectKeys.at(i_1);
      std::shared_ptr<EvalValue> val = objectValues.at(i_1);
      std::string valStr = (val)->toString();
      result_1 = ((result_1 + key) + std::string(": ")) + valStr;
      i_1 = i_1 + 1;
    };
    return result_1 + std::string("}");
  }
  if ( valueType == 6 ) {
    return (std::string("[Function: ") + functionName) + std::string("]");
  }
  if ( valueType == 7 ) {
    if ( evgElement != NULL ) {
      std::shared_ptr<EVGElement> el = evgElement;
      return (std::string("[EVGElement: ") + el->tagName) + std::string("]");
    }
    return std::string("[EVGElement: null]");
  }
  return std::string("undefined");
}
bool  EvalValue::toBool() {
  if ( valueType == 0 ) {
    return false;
  }
  if ( valueType == 1 ) {
    return numberValue != 0;
  }
  if ( valueType == 2 ) {
    return ((int)(stringValue.length())) > 0;
  }
  if ( valueType == 3 ) {
    return boolValue;
  }
  if ( valueType == 4 ) {
    return true;
  }
  if ( valueType == 5 ) {
    return true;
  }
  if ( valueType == 6 ) {
    return true;
  }
  if ( valueType == 7 ) {
    return true;
  }
  return false;
}
std::shared_ptr<EvalValue>  EvalValue::getMember( std::string key ) {
  if ( valueType == 5 ) {
    int i = 0;
    while (i < ((int)(objectKeys.size()))) {
      if ( (objectKeys.at(i)) == key ) {
        return objectValues.at(i);
      }
      i = i + 1;
    };
  }
  if ( valueType == 4 ) {
    if ( key == std::string("length") ) {
      return EvalValue::fromInt(((int)(arrayValue.size())));
    }
  }
  if ( valueType == 2 ) {
    if ( key == std::string("length") ) {
      return EvalValue::fromInt(((int)(stringValue.length())));
    }
  }
  return EvalValue::null();
}
std::shared_ptr<EvalValue>  EvalValue::getIndex( int index ) {
  if ( valueType == 4 ) {
    if ( (index >= 0) && (index < ((int)(arrayValue.size()))) ) {
      return arrayValue.at(index);
    }
  }
  if ( valueType == 2 ) {
    if ( (index >= 0) && (index < ((int)(stringValue.length()))) ) {
      std::string charStr = r_utf8_substr(stringValue, index, (index + 1) - index);
      return EvalValue::string(charStr);
    }
  }
  return EvalValue::null();
}
bool  EvalValue::equals( std::shared_ptr<EvalValue> other ) {
  if ( valueType != other->valueType ) {
    return false;
  }
  if ( valueType == 0 ) {
    return true;
  }
  if ( valueType == 1 ) {
    return numberValue == other->numberValue;
  }
  if ( valueType == 2 ) {
    return stringValue == other->stringValue;
  }
  if ( valueType == 3 ) {
    return boolValue == other->boolValue;
  }
  return false;
}
ImportedSymbol::ImportedSymbol( ) {
  this->name = std::string("");
  this->originalName = std::string("");
  this->sourcePath = std::string("");
  this->symbolType = std::string("");
}
EvalContext::EvalContext( ) {
  std::vector<std::string> v;
  variables = v;
  std::vector<std::shared_ptr<EvalValue>> vl;
  values = vl;
}
void  EvalContext::define( std::string name , std::shared_ptr<EvalValue> value ) {
  int i = 0;
  while (i < ((int)(variables.size()))) {
    if ( (variables.at(i)) == name ) {
      values[i] = value;
      return;
    }
    i = i + 1;
  };
  variables.push_back( name  );
  values.push_back( value  );
}
std::shared_ptr<EvalValue>  EvalContext::lookup( std::string name ) {
  int i = 0;
  while (i < ((int)(variables.size()))) {
    if ( (variables.at(i)) == name ) {
      return values.at(i);
    }
    i = i + 1;
  };
  if ( parent != NULL ) {
    std::shared_ptr<EvalContext> p = parent;
    return p->lookup(name);
  }
  return EvalValue::null();
}
bool  EvalContext::has( std::string name ) {
  int i = 0;
  while (i < ((int)(variables.size()))) {
    if ( (variables.at(i)) == name ) {
      return true;
    }
    i = i + 1;
  };
  if ( parent != NULL ) {
    std::shared_ptr<EvalContext> p = parent;
    return (p)->has(name);
  }
  return false;
}
std::shared_ptr<EvalContext>  EvalContext::createChild() {
  std::shared_ptr<EvalContext> child =  std::make_shared<EvalContext>();
  child->parent  = shared_from_this();
  return child;
}
ComponentEngine::ComponentEngine( ) {
  this->source = std::string("");
  this->basePath = std::string("./");
  this->pageWidth = 595;
  this->pageHeight = 842;
  std::shared_ptr<TSParserSimple> p =  std::make_shared<TSParserSimple>();
  parser  = p;
  parser->tsxMode = true;
  std::vector<std::shared_ptr<ImportedSymbol>> imp;
  imports = imp;
  std::vector<std::shared_ptr<ImportedSymbol>> loc;
  localComponents = loc;
  std::shared_ptr<EvalContext> ctx =  std::make_shared<EvalContext>();
  context  = ctx;
  std::vector<std::string> prim;
  primitives = prim;
  std::vector<std::string> ap_1;
  assetPaths = ap_1;
  primitives.push_back( std::string("View")  );
  primitives.push_back( std::string("Label")  );
  primitives.push_back( std::string("Print")  );
  primitives.push_back( std::string("Section")  );
  primitives.push_back( std::string("Page")  );
  primitives.push_back( std::string("Image")  );
  primitives.push_back( std::string("Path")  );
  primitives.push_back( std::string("Spacer")  );
  primitives.push_back( std::string("Divider")  );
  primitives.push_back( std::string("div")  );
  primitives.push_back( std::string("span")  );
  primitives.push_back( std::string("p")  );
  primitives.push_back( std::string("h1")  );
  primitives.push_back( std::string("h2")  );
  primitives.push_back( std::string("h3")  );
  primitives.push_back( std::string("img")  );
  primitives.push_back( std::string("path")  );
}
void  ComponentEngine::setAssetPaths( std::string paths ) {
  int start = 0;
  int i = 0;
  int __len = (int)(paths.length());
  while (i <= __len) {
    std::string ch = std::string("");
    if ( i < __len ) {
      ch = r_utf8_substr(paths, i, (i + 1) - i);
    }
    if ( (ch == std::string(";")) || (i == __len) ) {
      if ( i > start ) {
        std::string part = r_utf8_substr(paths, start, i - start);
        assetPaths.push_back( part  );
        std::cout << std::string("ComponentEngine: Added asset path: ") + part << std::endl;
      }
      start = i + 1;
    }
    i = i + 1;
  };
}
std::string  ComponentEngine::resolveComponentPath( std::string relativePath ) {
  std::string fullPath = basePath + relativePath;
  int i = 0;
  while (i < ((int)(assetPaths.size()))) {
    /** unused:  std::string assetDir = assetPaths.at(i)   **/ ;
    i = i + 1;
  };
  return fullPath;
}
std::shared_ptr<EVGElement>  ComponentEngine::parseFile( std::string dirPath , std::string fileName ) {
  basePath = dirPath;
  std::vector<uint8_t> fileContent = r_buffer_read_file(dirPath, fileName);
  std::string src = std::string(fileContent.begin(), fileContent.end());
  return this->parse(src);
}
std::shared_ptr<EVGElement>  ComponentEngine::parse( std::string src ) {
  source = src;
  std::shared_ptr<TSLexer> lexer =  std::make_shared<TSLexer>(src);
  std::vector<std::shared_ptr<Token>> tokens = lexer->tokenize();
  parser->initParser(tokens);
  parser->tsxMode = true;
  std::shared_ptr<TSNode> ast = parser->parseProgram();
  this->processImports(ast);
  this->registerComponents(ast);
  this->processVariables(ast);
  std::shared_ptr<TSNode> renderFn = this->findRenderFunction(ast);
  if ( renderFn->nodeType == std::string("") ) {
    std::cout << std::string("Error: No render() function found") << std::endl;
    std::shared_ptr<EVGElement> empty =  std::make_shared<EVGElement>();
    return empty;
  }
  return this->evaluateFunction(renderFn);
}
void  ComponentEngine::processImports( std::shared_ptr<TSNode> ast ) {
  int i = 0;
  while (i < ((int)(ast->children.size()))) {
    std::shared_ptr<TSNode> node = ast->children.at(i);
    if ( node->nodeType == std::string("ImportDeclaration") ) {
      this->processImportDeclaration(node);
    }
    i = i + 1;
  };
}
void  ComponentEngine::processImportDeclaration( std::shared_ptr<TSNode> node ) {
  std::string modulePath = std::string("");
  if ( node->left != NULL ) {
    std::shared_ptr<TSNode> srcNode = node->left;
    modulePath = this->unquote(srcNode->value);
  }
  if ( ((int)(modulePath.length())) == 0 ) {
    return;
  }
  if ( (r_string_index_of(modulePath , std::string("evg_types"))) >= 0 ) {
    return;
  }
  if ( (r_string_index_of(modulePath , std::string("evg_"))) >= 0 ) {
    return;
  }
  std::vector<std::string> importedNames;
  int j = 0;
  while (j < ((int)(node->children.size()))) {
    std::shared_ptr<TSNode> spec = node->children.at(j);
    if ( spec->nodeType == std::string("ImportSpecifier") ) {
      importedNames.push_back( spec->name  );
    }
    if ( spec->nodeType == std::string("ImportDefaultSpecifier") ) {
      importedNames.push_back( spec->name  );
    }
    j = j + 1;
  };
  std::string fullPath = this->resolveModulePath(modulePath);
  if ( ((int)(fullPath.length())) == 0 ) {
    return;
  }
  std::string dirPath = basePath;
  std::cout << (std::string("Loading import: ") + dirPath) + fullPath << std::endl;
  std::vector<uint8_t> fileContent = r_buffer_read_file(dirPath, fullPath);
  std::string src = std::string(fileContent.begin(), fileContent.end());
  if ( ((int)(src.length())) == 0 ) {
    std::cout << std::string("") << std::endl;
    std::cout << (std::string("ERROR: Could not load component module: ") + dirPath) + fullPath << std::endl;
    std::cout << std::string("") << std::endl;
    std::cout << std::string("Please ensure the imported file exists. You may need to:") << std::endl;
    std::cout << std::string("  1. Check that the import path is correct in your TSX file") << std::endl;
    std::cout << std::string("  2. Make sure the component file exists in one of your asset paths:") << std::endl;
    int pathIdx = 0;
    while (pathIdx < ((int)(assetPaths.size()))) {
      std::cout << std::string("     - ") + (assetPaths.at(pathIdx)) << std::endl;
      pathIdx = pathIdx + 1;
    };
    std::cout << std::string("") << std::endl;
    return;
  }
  std::shared_ptr<TSLexer> lexer =  std::make_shared<TSLexer>(src);
  std::vector<std::shared_ptr<Token>> tokens = lexer->tokenize();
  std::shared_ptr<TSParserSimple> importParser =  std::make_shared<TSParserSimple>();
  importParser->initParser(tokens);
  importParser->tsxMode = true;
  std::shared_ptr<TSNode> importAst = importParser->parseProgram();
  int k = 0;
  while (k < ((int)(importAst->children.size()))) {
    std::shared_ptr<TSNode> stmt = importAst->children.at(k);
    if ( stmt->nodeType == std::string("ExportNamedDeclaration") ) {
      if ( stmt->left != NULL ) {
        std::shared_ptr<TSNode> declNode = stmt->left;
        if ( declNode->nodeType == std::string("FunctionDeclaration") ) {
          std::string fnName = declNode->name;
          if ( this->isInList(fnName, importedNames) ) {
            std::shared_ptr<ImportedSymbol> sym =  std::make_shared<ImportedSymbol>();
            sym->name = fnName;
            sym->originalName = fnName;
            sym->sourcePath = fullPath;
            sym->symbolType = std::string("component");
            sym->functionNode  = declNode;
            localComponents.push_back( sym  );
            std::cout << ((std::string("Imported component: ") + fnName) + std::string(" from ")) + fullPath << std::endl;
          }
        }
      }
    }
    if ( stmt->nodeType == std::string("FunctionDeclaration") ) {
      std::string fnName_1 = stmt->name;
      if ( this->isInList(fnName_1, importedNames) ) {
        std::shared_ptr<ImportedSymbol> sym_1 =  std::make_shared<ImportedSymbol>();
        sym_1->name = fnName_1;
        sym_1->originalName = fnName_1;
        sym_1->sourcePath = fullPath;
        sym_1->symbolType = std::string("component");
        sym_1->functionNode  = stmt;
        localComponents.push_back( sym_1  );
        std::cout << ((std::string("Imported component: ") + fnName_1) + std::string(" from ")) + fullPath << std::endl;
      }
    }
    k = k + 1;
  };
}
std::string  ComponentEngine::resolveModulePath( std::string modulePath ) {
  if ( (r_string_index_of(modulePath , std::string("./"))) == 0 ) {
    std::string path = r_utf8_substr(modulePath, 2, ((int)(modulePath.length())) - 2);
    if ( ((int)(path.length())) == 0 ) {
      return std::string("");
    }
    if ( (r_string_index_of(path , std::string(".tsx"))) < 0 ) {
      if ( (r_string_index_of(path , std::string(".ts"))) < 0 ) {
        path = path + std::string(".tsx");
      }
    }
    return path;
  }
  if ( (r_string_index_of(modulePath , std::string(".tsx"))) < 0 ) {
    if ( (r_string_index_of(modulePath , std::string(".ts"))) < 0 ) {
      return modulePath + std::string(".tsx");
    }
  }
  return modulePath;
}
bool  ComponentEngine::isInList( std::string name , std::vector<std::string> list ) {
  int i = 0;
  while (i < ((int)(list.size()))) {
    if ( (list.at(i)) == name ) {
      return true;
    }
    i = i + 1;
  };
  return false;
}
void  ComponentEngine::registerComponents( std::shared_ptr<TSNode> ast ) {
  int i = 0;
  while (i < ((int)(ast->children.size()))) {
    std::shared_ptr<TSNode> node = ast->children.at(i);
    if ( node->nodeType == std::string("FunctionDeclaration") ) {
      if ( node->name != std::string("render") ) {
        std::shared_ptr<ImportedSymbol> sym =  std::make_shared<ImportedSymbol>();
        sym->name = node->name;
        sym->originalName = node->name;
        sym->symbolType = std::string("component");
        sym->functionNode  = node;
        localComponents.push_back( sym  );
        std::cout << std::string("Registered local component: ") + node->name << std::endl;
      }
    }
    i = i + 1;
  };
}
std::shared_ptr<TSNode>  ComponentEngine::findRenderFunction( std::shared_ptr<TSNode> ast ) {
  std::shared_ptr<TSNode> empty =  std::make_shared<TSNode>();
  int i = 0;
  while (i < ((int)(ast->children.size()))) {
    std::shared_ptr<TSNode> node = ast->children.at(i);
    if ( node->nodeType == std::string("FunctionDeclaration") ) {
      if ( node->name == std::string("render") ) {
        return node;
      }
    }
    i = i + 1;
  };
  return empty;
}
void  ComponentEngine::processVariables( std::shared_ptr<TSNode> ast ) {
  int i = 0;
  while (i < ((int)(ast->children.size()))) {
    std::shared_ptr<TSNode> node = ast->children.at(i);
    if ( node->nodeType == std::string("VariableDeclaration") ) {
      this->processVariableDeclaration(node);
    }
    i = i + 1;
  };
}
void  ComponentEngine::processVariableDeclaration( std::shared_ptr<TSNode> node ) {
  int i = 0;
  while (i < ((int)(node->children.size()))) {
    std::shared_ptr<TSNode> decl = node->children.at(i);
    if ( decl->nodeType == std::string("VariableDeclarator") ) {
      std::string varName = decl->name;
      if ( decl->init != NULL ) {
        std::shared_ptr<TSNode> initNode = decl->init;
        std::shared_ptr<EvalValue> value = this->evaluateExpr(initNode);
        context->define(varName, value);
        std::cout << ((std::string("Defined variable: ") + varName) + std::string(" = ")) + (value)->toString() << std::endl;
      }
    }
    i = i + 1;
  };
}
std::shared_ptr<EVGElement>  ComponentEngine::evaluateFunction( std::shared_ptr<TSNode> fnNode ) {
  std::shared_ptr<EvalContext> savedContext = context;
  context  = context->createChild();
  std::shared_ptr<TSNode> body = this->getFunctionBody(fnNode);
  std::shared_ptr<EVGElement> result = this->evaluateFunctionBody(body);
  context  = savedContext;
  return result;
}
std::shared_ptr<EVGElement>  ComponentEngine::evaluateFunctionWithProps( std::shared_ptr<TSNode> fnNode , std::shared_ptr<EvalValue> props ) {
  std::shared_ptr<EvalContext> savedContext = context;
  context  = context->createChild();
  this->bindFunctionParams(fnNode, props);
  std::shared_ptr<TSNode> body = this->getFunctionBody(fnNode);
  std::shared_ptr<EVGElement> result = this->evaluateFunctionBody(body);
  context  = savedContext;
  return result;
}
void  ComponentEngine::bindFunctionParams( std::shared_ptr<TSNode> fnNode , std::shared_ptr<EvalValue> props ) {
  int i = 0;
  while (i < ((int)(fnNode->params.size()))) {
    std::shared_ptr<TSNode> param = fnNode->params.at(i);
    if ( param->nodeType == std::string("ObjectPattern") ) {
      this->bindObjectPattern(param, props);
    }
    if ( param->nodeType == std::string("Parameter") ) {
      context->define(param->name, props);
    }
    if ( param->nodeType == std::string("Identifier") ) {
      context->define(param->name, props);
    }
    i = i + 1;
  };
}
void  ComponentEngine::bindObjectPattern( std::shared_ptr<TSNode> pattern , std::shared_ptr<EvalValue> props ) {
  int i = 0;
  while (i < ((int)(pattern->children.size()))) {
    std::shared_ptr<TSNode> prop = pattern->children.at(i);
    if ( prop->nodeType == std::string("Property") ) {
      std::string propName = prop->name;
      std::shared_ptr<EvalValue> propValue = props->getMember(propName);
      if ( propValue->isNull() ) {
        if ( prop->init != NULL ) {
          std::shared_ptr<TSNode> initNode = prop->init;
          propValue = this->evaluateExpr(initNode);
        }
      }
      context->define(propName, propValue);
    }
    i = i + 1;
  };
}
std::shared_ptr<TSNode>  ComponentEngine::getFunctionBody( std::shared_ptr<TSNode> fnNode ) {
  if ( fnNode->body != NULL ) {
    return fnNode->body;
  }
  std::shared_ptr<TSNode> empty =  std::make_shared<TSNode>();
  return empty;
}
std::shared_ptr<EVGElement>  ComponentEngine::evaluateFunctionBody( std::shared_ptr<TSNode> body ) {
  std::shared_ptr<EVGElement> empty =  std::make_shared<EVGElement>();
  int i = 0;
  while (i < ((int)(body->children.size()))) {
    std::shared_ptr<TSNode> stmt = body->children.at(i);
    if ( stmt->nodeType == std::string("VariableDeclaration") ) {
      this->processVariableDeclaration(stmt);
    }
    if ( stmt->nodeType == std::string("ReturnStatement") ) {
      if ( stmt->left != NULL ) {
        std::shared_ptr<TSNode> returnExpr = stmt->left;
        return this->evaluateJSX(returnExpr);
      }
    }
    i = i + 1;
  };
  if ( (body->nodeType == std::string("JSXElement")) || (body->nodeType == std::string("JSXFragment")) ) {
    return this->evaluateJSX(body);
  }
  return empty;
}
std::shared_ptr<EVGElement>  ComponentEngine::evaluateJSX( std::shared_ptr<TSNode> node ) {
  std::shared_ptr<EVGElement> element =  std::make_shared<EVGElement>();
  if ( node->nodeType == std::string("JSXElement") ) {
    return this->evaluateJSXElement(node);
  }
  if ( node->nodeType == std::string("JSXFragment") ) {
    element->tagName = std::string("div");
    this->evaluateChildren(element, node);
    return element;
  }
  if ( node->nodeType == std::string("ParenthesizedExpression") ) {
    if ( node->left != NULL ) {
      std::shared_ptr<TSNode> inner = node->left;
      return this->evaluateJSX(inner);
    }
  }
  return element;
}
std::shared_ptr<EVGElement>  ComponentEngine::evaluateJSXElement( std::shared_ptr<TSNode> jsxNode ) {
  std::string tagName = std::string("");
  if ( jsxNode->left != NULL ) {
    std::shared_ptr<TSNode> openingEl = jsxNode->left;
    tagName = openingEl->name;
  }
  if ( this->isComponent(tagName) ) {
    return this->expandComponent(tagName, jsxNode);
  }
  std::shared_ptr<EVGElement> element =  std::make_shared<EVGElement>();
  element->tagName = this->mapTagName(tagName);
  if ( jsxNode->left != NULL ) {
    std::shared_ptr<TSNode> openingEl_1 = jsxNode->left;
    this->evaluateAttributes(element, openingEl_1);
  }
  if ( ((tagName == std::string("Label")) || (tagName == std::string("span"))) || (tagName == std::string("text")) ) {
    element->textContent = this->evaluateTextContent(jsxNode);
  } else {
    this->evaluateChildren(element, jsxNode);
  }
  return element;
}
bool  ComponentEngine::isComponent( std::string name ) {
  if ( ((int)(name.length())) == 0 ) {
    return false;
  }
  int i = 0;
  while (i < ((int)(primitives.size()))) {
    if ( (primitives.at(i)) == name ) {
      return false;
    }
    i = i + 1;
  };
  int firstChar = name.at(0);
  if ( (firstChar >= 65) && (firstChar <= 90) ) {
    return true;
  }
  return false;
}
std::shared_ptr<EVGElement>  ComponentEngine::expandComponent( std::string name , std::shared_ptr<TSNode> jsxNode ) {
  int i = 0;
  while (i < ((int)(localComponents.size()))) {
    std::shared_ptr<ImportedSymbol> sym = localComponents.at(i);
    if ( sym->name == name ) {
      std::shared_ptr<EvalValue> props = this->evaluateProps(jsxNode);
      if ( sym->functionNode != NULL ) {
        std::shared_ptr<TSNode> fnNode = sym->functionNode;
        return this->evaluateFunctionWithProps(fnNode, props);
      }
    }
    i = i + 1;
  };
  std::cout << std::string("Warning: Unknown component: ") + name << std::endl;
  std::shared_ptr<EVGElement> empty =  std::make_shared<EVGElement>();
  empty->tagName = std::string("div");
  return empty;
}
std::shared_ptr<EvalValue>  ComponentEngine::evaluateProps( std::shared_ptr<TSNode> jsxNode ) {
  std::vector<std::string> keys;
  std::vector<std::shared_ptr<EvalValue>> values;
  if ( jsxNode->left != NULL ) {
    std::shared_ptr<TSNode> openingEl = jsxNode->left;
    int i = 0;
    while (i < ((int)(openingEl->children.size()))) {
      std::shared_ptr<TSNode> attr = openingEl->children.at(i);
      if ( attr->nodeType == std::string("JSXAttribute") ) {
        std::string attrName = attr->name;
        std::shared_ptr<EvalValue> attrValue = this->evaluateAttributeValue(attr);
        keys.push_back( attrName  );
        values.push_back( attrValue  );
      }
      i = i + 1;
    };
  }
  bool hasExplicitChildren = false;
  int ci = 0;
  while (ci < ((int)(keys.size()))) {
    if ( (keys.at(ci)) == std::string("children") ) {
      hasExplicitChildren = true;
    }
    ci = ci + 1;
  };
  if ( hasExplicitChildren == false ) {
    std::vector<std::shared_ptr<EvalValue>> childElements = this->collectChildElements(jsxNode);
    if ( ((int)(childElements.size())) > 0 ) {
      keys.push_back( std::string("children")  );
      if ( ((int)(childElements.size())) == 1 ) {
        values.push_back( childElements.at(0)  );
      } else {
        values.push_back( EvalValue::array(childElements)  );
      }
    }
  }
  return EvalValue::object(keys, values);
}
std::vector<std::shared_ptr<EvalValue>>  ComponentEngine::collectChildElements( std::shared_ptr<TSNode> jsxNode ) {
  std::vector<std::shared_ptr<EvalValue>> results;
  int i = 0;
  while (i < ((int)(jsxNode->children.size()))) {
    std::shared_ptr<TSNode> child = jsxNode->children.at(i);
    if ( child->nodeType == std::string("JSXElement") ) {
      std::shared_ptr<EVGElement> el = this->evaluateJSXElement(child);
      if ( ((int)(el->tagName.length())) > 0 ) {
        results.push_back( EvalValue::element(el)  );
      }
    }
    if ( child->nodeType == std::string("JSXText") ) {
      std::string text = this->trimText(child->value);
      if ( ((int)(text.length())) > 0 ) {
        std::shared_ptr<EVGElement> textEl =  std::make_shared<EVGElement>();
        textEl->tagName = std::string("text");
        textEl->textContent = text;
        results.push_back( EvalValue::element(textEl)  );
      }
    }
    if ( child->nodeType == std::string("JSXExpressionContainer") ) {
      if ( child->left != NULL ) {
        std::shared_ptr<TSNode> exprNode = child->left;
        std::shared_ptr<EvalValue> exprValue = this->evaluateExpr(exprNode);
        if ( exprValue->isElement() ) {
          results.push_back( exprValue  );
        }
        if ( (exprValue)->isArray() ) {
          int ai = 0;
          while (ai < ((int)(exprValue->arrayValue.size()))) {
            std::shared_ptr<EvalValue> arrItem = exprValue->arrayValue.at(ai);
            if ( arrItem->isElement() ) {
              results.push_back( arrItem  );
            }
            ai = ai + 1;
          };
        }
      }
    }
    i = i + 1;
  };
  return results;
}
std::shared_ptr<EvalValue>  ComponentEngine::evaluateAttributeValue( std::shared_ptr<TSNode> attr ) {
  if ( attr->right != NULL ) {
    std::shared_ptr<TSNode> rightNode = attr->right;
    if ( rightNode->nodeType == std::string("StringLiteral") ) {
      return EvalValue::string(this->unquote(rightNode->value));
    }
    if ( rightNode->nodeType == std::string("JSXExpressionContainer") ) {
      if ( rightNode->left != NULL ) {
        std::shared_ptr<TSNode> exprNode = rightNode->left;
        return this->evaluateExpr(exprNode);
      }
    }
  }
  return EvalValue::boolean(true);
}
void  ComponentEngine::evaluateAttributes( std::shared_ptr<EVGElement> element , std::shared_ptr<TSNode> openingNode ) {
  int i = 0;
  while (i < ((int)(openingNode->children.size()))) {
    std::shared_ptr<TSNode> attr = openingNode->children.at(i);
    if ( attr->nodeType == std::string("JSXAttribute") ) {
      std::string rawAttrName = attr->name;
      std::shared_ptr<EvalValue> attrValue = this->evaluateAttributeValue(attr);
      std::string strValue = (attrValue)->toString();
      this->applyAttribute(element, rawAttrName, strValue);
    }
    i = i + 1;
  };
}
void  ComponentEngine::applyAttribute( std::shared_ptr<EVGElement> element , std::string rawName , std::string strValue ) {
  if ( rawName == std::string("id") ) {
    element->id = strValue;
    return;
  }
  if ( rawName == std::string("className") ) {
    element->className = strValue;
    return;
  }
  if ( rawName == std::string("src") ) {
    element->src = strValue;
    return;
  }
  element->setAttribute(rawName, strValue);
}
std::string  ComponentEngine::evaluateTextContent( std::shared_ptr<TSNode> jsxNode ) {
  std::string result = std::string("");
  int i = 0;
  while (i < ((int)(jsxNode->children.size()))) {
    std::shared_ptr<TSNode> child = jsxNode->children.at(i);
    if ( child->nodeType == std::string("JSXText") ) {
      std::string rawText = child->value;
      if ( ((int)(rawText.length())) > 0 ) {
        result = this->smartJoinText(result, rawText);
      }
    }
    if ( child->nodeType == std::string("JSXExpressionContainer") ) {
      if ( child->left != NULL ) {
        std::shared_ptr<TSNode> exprNode = child->left;
        std::shared_ptr<EvalValue> exprValue = this->evaluateExpr(exprNode);
        std::string exprStr = (exprValue)->toString();
        result = this->smartJoinText(result, exprStr);
      }
    }
    i = i + 1;
  };
  std::string normalizedText = this->normalizeWhitespace(result);
  std::string trimmedText = this->trimText(normalizedText);
  return trimmedText;
}
void  ComponentEngine::evaluateChildren( std::shared_ptr<EVGElement> element , std::shared_ptr<TSNode> jsxNode ) {
  int i = 0;
  std::string accumulatedText = std::string("");
  while (i < ((int)(jsxNode->children.size()))) {
    std::shared_ptr<TSNode> child = jsxNode->children.at(i);
    if ( child->nodeType == std::string("JSXText") ) {
      accumulatedText = this->smartJoinText(accumulatedText, child->value);
      i = i + 1;
      continue;
    }
    if ( ((int)(accumulatedText.length())) > 0 ) {
      std::string normalizedText = this->normalizeWhitespace(accumulatedText);
      std::string text = this->trimText(normalizedText);
      if ( ((int)(text.length())) > 0 ) {
        std::shared_ptr<EVGElement> textEl =  std::make_shared<EVGElement>();
        textEl->tagName = std::string("text");
        textEl->textContent = text;
        element->addChild(textEl);
      }
      accumulatedText = std::string("");
    }
    if ( child->nodeType == std::string("JSXElement") ) {
      std::shared_ptr<EVGElement> childEl = this->evaluateJSXElement(child);
      if ( ((int)(childEl->tagName.length())) > 0 ) {
        element->addChild(childEl);
      }
    }
    if ( child->nodeType == std::string("JSXExpressionContainer") ) {
      this->evaluateExpressionChild(element, child);
    }
    if ( child->nodeType == std::string("JSXFragment") ) {
      this->evaluateChildren(element, child);
    }
    i = i + 1;
  };
  if ( ((int)(accumulatedText.length())) > 0 ) {
    std::string normalizedText_1 = this->normalizeWhitespace(accumulatedText);
    std::string text_1 = this->trimText(normalizedText_1);
    if ( ((int)(text_1.length())) > 0 ) {
      std::shared_ptr<EVGElement> textEl_1 =  std::make_shared<EVGElement>();
      textEl_1->tagName = std::string("text");
      textEl_1->textContent = text_1;
      element->addChild(textEl_1);
    }
  }
}
void  ComponentEngine::evaluateExpressionChild( std::shared_ptr<EVGElement> element , std::shared_ptr<TSNode> exprContainer ) {
  if ( exprContainer->left != NULL ) {
    std::shared_ptr<TSNode> exprNode = exprContainer->left;
    if ( exprNode->nodeType == std::string("CallExpression") ) {
      this->evaluateArrayMapChild(element, exprNode);
      return;
    }
    if ( exprNode->nodeType == std::string("ConditionalExpression") ) {
      this->evaluateTernaryChild(element, exprNode);
      return;
    }
    if ( exprNode->nodeType == std::string("BinaryExpression") ) {
      if ( exprNode->value == std::string("&&") ) {
        this->evaluateAndChild(element, exprNode);
        return;
      }
    }
    std::shared_ptr<EvalValue> value = this->evaluateExpr(exprNode);
    if ( value->isElement() ) {
      if ( value->evgElement != NULL ) {
        std::shared_ptr<EVGElement> childEl = value->evgElement;
        if ( ((int)(childEl->tagName.length())) > 0 ) {
          element->addChild(childEl);
        }
      }
      return;
    }
    if ( (value)->isArray() ) {
      int ai = 0;
      while (ai < ((int)(value->arrayValue.size()))) {
        std::shared_ptr<EvalValue> arrItem = value->arrayValue.at(ai);
        if ( arrItem->isElement() ) {
          if ( arrItem->evgElement != NULL ) {
            std::shared_ptr<EVGElement> arrChildEl = arrItem->evgElement;
            if ( ((int)(arrChildEl->tagName.length())) > 0 ) {
              element->addChild(arrChildEl);
            }
          }
        }
        ai = ai + 1;
      };
      return;
    }
    bool isStr = value->isString();
    bool isNum = value->isNumber();
    if ( isStr || isNum ) {
      std::shared_ptr<EVGElement> textEl =  std::make_shared<EVGElement>();
      textEl->tagName = std::string("text");
      textEl->textContent = (value)->toString();
      element->addChild(textEl);
    }
  }
}
void  ComponentEngine::evaluateArrayMapChild( std::shared_ptr<EVGElement> element , std::shared_ptr<TSNode> callNode ) {
  if ( callNode->left != NULL ) {
    std::shared_ptr<TSNode> calleeNode = callNode->left;
    if ( calleeNode->nodeType == std::string("MemberExpression") ) {
      std::string methodName = calleeNode->name;
      if ( methodName == std::string("map") ) {
        if ( calleeNode->left != NULL ) {
          std::shared_ptr<TSNode> arrayExpr = calleeNode->left;
          std::shared_ptr<EvalValue> arrayValue = this->evaluateExpr(arrayExpr);
          if ( (arrayValue)->isArray() ) {
            if ( ((int)(callNode->children.size())) > 0 ) {
              std::shared_ptr<TSNode> callback = callNode->children.at(0);
              int i = 0;
              while (i < ((int)(arrayValue->arrayValue.size()))) {
                std::shared_ptr<EvalValue> item = arrayValue->arrayValue.at(i);
                std::shared_ptr<EvalContext> savedContext = context;
                context  = context->createChild();
                this->bindMapCallback(callback, item, i);
                std::shared_ptr<EVGElement> resultEl = this->evaluateMapCallbackBody(callback);
                if ( ((int)(resultEl->tagName.length())) > 0 ) {
                  element->addChild(resultEl);
                }
                context  = savedContext;
                i = i + 1;
              };
            }
          }
        }
      }
    }
  }
}
void  ComponentEngine::bindMapCallback( std::shared_ptr<TSNode> callback , std::shared_ptr<EvalValue> item , int index ) {
  if ( callback->nodeType == std::string("ArrowFunctionExpression") ) {
    if ( ((int)(callback->params.size())) > 0 ) {
      std::shared_ptr<TSNode> param = callback->params.at(0);
      std::string paramName = param->name;
      context->define(paramName, item);
    }
    if ( ((int)(callback->params.size())) > 1 ) {
      std::shared_ptr<TSNode> indexParam = callback->params.at(1);
      context->define(indexParam->name, EvalValue::fromInt(index));
    }
  }
}
std::shared_ptr<EVGElement>  ComponentEngine::evaluateMapCallbackBody( std::shared_ptr<TSNode> callback ) {
  std::shared_ptr<EVGElement> empty =  std::make_shared<EVGElement>();
  if ( callback->nodeType == std::string("ArrowFunctionExpression") ) {
    if ( callback->body != NULL ) {
      std::shared_ptr<TSNode> body = callback->body;
      if ( (body->nodeType == std::string("JSXElement")) || (body->nodeType == std::string("JSXFragment")) ) {
        return this->evaluateJSX(body);
      }
      if ( body->nodeType == std::string("BlockStatement") ) {
        return this->evaluateFunctionBody(body);
      }
    }
  }
  return empty;
}
void  ComponentEngine::evaluateTernaryChild( std::shared_ptr<EVGElement> element , std::shared_ptr<TSNode> node ) {
  if ( node->test != NULL ) {
    std::shared_ptr<TSNode> testExpr = node->test;
    std::shared_ptr<EvalValue> testValue = this->evaluateExpr(testExpr);
    if ( testValue->toBool() ) {
      if ( node->consequent != NULL ) {
        std::shared_ptr<TSNode> conseqNode = node->consequent;
        if ( (conseqNode->nodeType == std::string("JSXElement")) || (conseqNode->nodeType == std::string("JSXFragment")) ) {
          std::shared_ptr<EVGElement> childEl = this->evaluateJSX(conseqNode);
          if ( ((int)(childEl->tagName.length())) > 0 ) {
            element->addChild(childEl);
          }
        }
      }
    } else {
      if ( node->alternate != NULL ) {
        std::shared_ptr<TSNode> altNode = node->alternate;
        if ( (altNode->nodeType == std::string("JSXElement")) || (altNode->nodeType == std::string("JSXFragment")) ) {
          std::shared_ptr<EVGElement> childEl_1 = this->evaluateJSX(altNode);
          if ( ((int)(childEl_1->tagName.length())) > 0 ) {
            element->addChild(childEl_1);
          }
        }
      }
    }
  }
}
void  ComponentEngine::evaluateAndChild( std::shared_ptr<EVGElement> element , std::shared_ptr<TSNode> node ) {
  if ( node->left != NULL ) {
    std::shared_ptr<TSNode> leftExpr = node->left;
    std::shared_ptr<EvalValue> leftValue = this->evaluateExpr(leftExpr);
    if ( leftValue->toBool() ) {
      if ( node->right != NULL ) {
        std::shared_ptr<TSNode> rightNode = node->right;
        if ( (rightNode->nodeType == std::string("JSXElement")) || (rightNode->nodeType == std::string("JSXFragment")) ) {
          std::shared_ptr<EVGElement> childEl = this->evaluateJSX(rightNode);
          if ( ((int)(childEl->tagName.length())) > 0 ) {
            element->addChild(childEl);
          }
        }
      }
    }
  }
}
std::shared_ptr<EvalValue>  ComponentEngine::evaluateExpr( std::shared_ptr<TSNode> node ) {
  if ( node->nodeType == std::string("NumericLiteral") ) {
     r_optional_primitive<double>  numVal = cpp_str_to_double(node->value);
    if ( numVal.has_value ) {
      return EvalValue::number((/*unwrap dbl*/numVal.value));
    }
    return EvalValue::number(0);
  }
  if ( node->nodeType == std::string("StringLiteral") ) {
    return EvalValue::string(this->unquote(node->value));
  }
  if ( node->nodeType == std::string("TemplateLiteral") ) {
    std::string templateText = std::string("");
    int ti = 0;
    while (ti < ((int)(node->children.size()))) {
      std::shared_ptr<TSNode> templateChild = node->children.at(ti);
      if ( templateChild->nodeType == std::string("TemplateElement") ) {
        templateText = templateText + templateChild->value;
      }
      ti = ti + 1;
    };
    return EvalValue::string(templateText);
  }
  if ( node->nodeType == std::string("BooleanLiteral") ) {
    return EvalValue::boolean((node->value == std::string("true")));
  }
  if ( node->nodeType == std::string("NullLiteral") ) {
    return EvalValue::null();
  }
  if ( node->nodeType == std::string("Identifier") ) {
    return context->lookup(node->name);
  }
  if ( node->nodeType == std::string("BinaryExpression") ) {
    return this->evaluateBinaryExpr(node);
  }
  if ( node->nodeType == std::string("UnaryExpression") ) {
    return this->evaluateUnaryExpr(node);
  }
  if ( node->nodeType == std::string("ConditionalExpression") ) {
    return this->evaluateConditionalExpr(node);
  }
  if ( node->nodeType == std::string("MemberExpression") ) {
    return this->evaluateMemberExpr(node);
  }
  if ( node->nodeType == std::string("ArrayExpression") ) {
    return this->evaluateArrayExpr(node);
  }
  if ( node->nodeType == std::string("ObjectExpression") ) {
    return this->evaluateObjectExpr(node);
  }
  if ( node->nodeType == std::string("ParenthesizedExpression") ) {
    if ( node->left != NULL ) {
      std::shared_ptr<TSNode> inner = node->left;
      return this->evaluateExpr(inner);
    }
  }
  if ( node->nodeType == std::string("JSXElement") ) {
    std::shared_ptr<EVGElement> el = this->evaluateJSXElement(node);
    return EvalValue::element(el);
  }
  if ( node->nodeType == std::string("JSXFragment") ) {
    std::shared_ptr<EVGElement> el_1 =  std::make_shared<EVGElement>();
    el_1->tagName = std::string("div");
    this->evaluateChildren(el_1, node);
    return EvalValue::element(el_1);
  }
  return EvalValue::null();
}
std::shared_ptr<EvalValue>  ComponentEngine::evaluateBinaryExpr( std::shared_ptr<TSNode> node ) {
  std::string op = node->value;
  if ( op == std::string("&&") ) {
    if ( node->left != NULL ) {
      std::shared_ptr<TSNode> leftExpr = node->left;
      std::shared_ptr<EvalValue> left = this->evaluateExpr(leftExpr);
      if ( left->toBool() == false ) {
        return left;
      }
      if ( node->right != NULL ) {
        std::shared_ptr<TSNode> rightExpr = node->right;
        return this->evaluateExpr(rightExpr);
      }
    }
  }
  if ( op == std::string("||") ) {
    if ( node->left != NULL ) {
      std::shared_ptr<TSNode> leftExpr_1 = node->left;
      std::shared_ptr<EvalValue> left_1 = this->evaluateExpr(leftExpr_1);
      if ( left_1->toBool() ) {
        return left_1;
      }
      if ( node->right != NULL ) {
        std::shared_ptr<TSNode> rightExpr_1 = node->right;
        return this->evaluateExpr(rightExpr_1);
      }
    }
  }
  std::shared_ptr<EvalValue> left_2 = EvalValue::null();
  std::shared_ptr<EvalValue> right = EvalValue::null();
  if ( node->left != NULL ) {
    std::shared_ptr<TSNode> leftExpr_2 = node->left;
    left_2 = this->evaluateExpr(leftExpr_2);
  }
  if ( node->right != NULL ) {
    std::shared_ptr<TSNode> rightExpr_2 = node->right;
    right = this->evaluateExpr(rightExpr_2);
  }
  if ( op == std::string("+") ) {
    bool isLeftStr = left_2->isString();
    bool isRightStr = right->isString();
    if ( isLeftStr || isRightStr ) {
      return EvalValue::string(((left_2)->toString() + (right)->toString()));
    }
    return EvalValue::number((left_2->toNumber() + right->toNumber()));
  }
  if ( op == std::string("-") ) {
    return EvalValue::number((left_2->toNumber() - right->toNumber()));
  }
  if ( op == std::string("*") ) {
    return EvalValue::number((left_2->toNumber() * right->toNumber()));
  }
  if ( op == std::string("/") ) {
    double rightNum = right->toNumber();
    if ( rightNum != 0 ) {
      return EvalValue::number((left_2->toNumber() / rightNum));
    }
    return EvalValue::number(0);
  }
  if ( op == std::string("%") ) {
    int leftInt = (int)floor( left_2->toNumber());
    int rightInt = (int)floor( right->toNumber());
    if ( rightInt != 0 ) {
      return EvalValue::fromInt((leftInt % rightInt));
    }
    return EvalValue::number(0);
  }
  if ( op == std::string("<") ) {
    return EvalValue::boolean((left_2->toNumber() < right->toNumber()));
  }
  if ( op == std::string(">") ) {
    return EvalValue::boolean((left_2->toNumber() > right->toNumber()));
  }
  if ( op == std::string("<=") ) {
    return EvalValue::boolean((left_2->toNumber() <= right->toNumber()));
  }
  if ( op == std::string(">=") ) {
    return EvalValue::boolean((left_2->toNumber() >= right->toNumber()));
  }
  if ( (op == std::string("==")) || (op == std::string("===")) ) {
    return EvalValue::boolean(left_2->equals(right));
  }
  if ( (op == std::string("!=")) || (op == std::string("!==")) ) {
    return EvalValue::boolean((left_2->equals(right) == false));
  }
  return EvalValue::null();
}
std::shared_ptr<EvalValue>  ComponentEngine::evaluateUnaryExpr( std::shared_ptr<TSNode> node ) {
  std::string op = node->value;
  if ( node->left != NULL ) {
    std::shared_ptr<TSNode> argExpr = node->left;
    std::shared_ptr<EvalValue> arg = this->evaluateExpr(argExpr);
    if ( op == std::string("!") ) {
      return EvalValue::boolean((arg->toBool() == false));
    }
    if ( op == std::string("-") ) {
      return EvalValue::number((0 - arg->toNumber()));
    }
    if ( op == std::string("+") ) {
      return EvalValue::number(arg->toNumber());
    }
  }
  return EvalValue::null();
}
std::shared_ptr<EvalValue>  ComponentEngine::evaluateConditionalExpr( std::shared_ptr<TSNode> node ) {
  if ( node->test != NULL ) {
    std::shared_ptr<TSNode> testExpr = node->test;
    std::shared_ptr<EvalValue> test = this->evaluateExpr(testExpr);
    if ( test->toBool() ) {
      if ( node->consequent != NULL ) {
        std::shared_ptr<TSNode> conseqNode = node->consequent;
        return this->evaluateExpr(conseqNode);
      }
    } else {
      if ( node->alternate != NULL ) {
        std::shared_ptr<TSNode> altNode = node->alternate;
        return this->evaluateExpr(altNode);
      }
    }
  }
  return EvalValue::null();
}
std::shared_ptr<EvalValue>  ComponentEngine::evaluateMemberExpr( std::shared_ptr<TSNode> node ) {
  if ( node->left != NULL ) {
    std::shared_ptr<TSNode> leftExpr = node->left;
    std::shared_ptr<EvalValue> obj = this->evaluateExpr(leftExpr);
    std::string propName = node->name;
    if ( node->computed ) {
      if ( node->right != NULL ) {
        std::shared_ptr<TSNode> indexExpr = node->right;
        std::shared_ptr<EvalValue> indexVal = this->evaluateExpr(indexExpr);
        if ( indexVal->isNumber() ) {
          int idx = (int)floor( indexVal->toNumber());
          return obj->getIndex(idx);
        }
        if ( indexVal->isString() ) {
          return obj->getMember(indexVal->stringValue);
        }
      }
    }
    return obj->getMember(propName);
  }
  return EvalValue::null();
}
std::shared_ptr<EvalValue>  ComponentEngine::evaluateArrayExpr( std::shared_ptr<TSNode> node ) {
  std::vector<std::shared_ptr<EvalValue>> items;
  int i = 0;
  while (i < ((int)(node->children.size()))) {
    std::shared_ptr<TSNode> elem = node->children.at(i);
    std::shared_ptr<EvalValue> value = this->evaluateExpr(elem);
    items.push_back( value  );
    i = i + 1;
  };
  return EvalValue::array(items);
}
std::shared_ptr<EvalValue>  ComponentEngine::evaluateObjectExpr( std::shared_ptr<TSNode> node ) {
  std::vector<std::string> keys;
  std::vector<std::shared_ptr<EvalValue>> values;
  int i = 0;
  while (i < ((int)(node->children.size()))) {
    std::shared_ptr<TSNode> prop = node->children.at(i);
    if ( prop->nodeType == std::string("Property") ) {
      std::string key = prop->name;
      keys.push_back( key  );
      if ( prop->left != NULL ) {
        std::shared_ptr<TSNode> valueNode = prop->left;
        values.push_back( this->evaluateExpr(valueNode)  );
      } else {
        values.push_back( EvalValue::null()  );
      }
    }
    i = i + 1;
  };
  return EvalValue::object(keys, values);
}
std::string  ComponentEngine::mapTagName( std::string jsxTag ) {
  if ( jsxTag == std::string("Print") ) {
    return std::string("print");
  }
  if ( jsxTag == std::string("Section") ) {
    return std::string("section");
  }
  if ( jsxTag == std::string("Page") ) {
    return std::string("page");
  }
  if ( jsxTag == std::string("View") ) {
    return std::string("div");
  }
  if ( jsxTag == std::string("Label") ) {
    return std::string("text");
  }
  if ( jsxTag == std::string("Image") ) {
    return std::string("image");
  }
  if ( jsxTag == std::string("Path") ) {
    return std::string("path");
  }
  if ( jsxTag == std::string("Spacer") ) {
    return std::string("spacer");
  }
  if ( jsxTag == std::string("Divider") ) {
    return std::string("divider");
  }
  if ( jsxTag == std::string("div") ) {
    return std::string("div");
  }
  if ( jsxTag == std::string("span") ) {
    return std::string("text");
  }
  if ( jsxTag == std::string("img") ) {
    return std::string("image");
  }
  if ( jsxTag == std::string("path") ) {
    return std::string("path");
  }
  return std::string("div");
}
std::string  ComponentEngine::trimText( std::string text ) {
  std::string result = std::string("");
  bool started = false;
  int i = 0;
  int __len = (int)(text.length());
  while (i < __len) {
    int c = text.at(i);
    bool isWhitespace = (((c == 32) || (c == 9)) || (c == 10)) || (c == 13);
    if ( started ) {
      result = result + (std::string(1, char(c)));
    } else {
      if ( isWhitespace == false ) {
        started = true;
        result = std::string(1, char(c));
      }
    }
    i = i + 1;
  };
  int trimLen = (int)(result.length());
  while (trimLen > 0) {
    int lastC = result.at((trimLen - 1));
    if ( (((lastC == 32) || (lastC == 9)) || (lastC == 10)) || (lastC == 13) ) {
      result = r_utf8_substr(result, 0, (trimLen - 1) - 0);
      trimLen = trimLen - 1;
    } else {
      trimLen = 0;
    }
  };
  return result;
}
std::string  ComponentEngine::normalizeWhitespace( std::string text ) {
  std::string result = std::string("");
  bool lastWasSpace = false;
  int i = 0;
  int __len = (int)(text.length());
  while (i < __len) {
    int c = text.at(i);
    bool isWhitespace = (((c == 32) || (c == 9)) || (c == 10)) || (c == 13);
    if ( isWhitespace ) {
      if ( lastWasSpace == false ) {
        result = result + std::string(" ");
        lastWasSpace = true;
      }
    } else {
      result = result + (std::string(1, char(c)));
      lastWasSpace = false;
    }
    i = i + 1;
  };
  return result;
}
bool  ComponentEngine::startsWithPunctuation( std::string s ) {
  if ( ((int)(s.length())) == 0 ) {
    return false;
  }
  int first = s.at(0);
  if ( (((((first == 44) || (first == 46)) || (first == 33)) || (first == 63)) || (first == 58)) || (first == 59) ) {
    return true;
  }
  if ( ((first == 41) || (first == 93)) || (first == 125) ) {
    return true;
  }
  if ( ((first == 39) || (first == 34)) || (first == 45) ) {
    return true;
  }
  return false;
}
bool  ComponentEngine::endsWithOpenPunctuation( std::string s ) {
  int __len = (int)(s.length());
  if ( __len == 0 ) {
    return false;
  }
  int last = s.at((__len - 1));
  if ( (((last == 40) || (last == 91)) || (last == 123)) || (last == 45) ) {
    return true;
  }
  return false;
}
std::string  ComponentEngine::smartJoinText( std::string existing , std::string newText ) {
  if ( ((int)(existing.length())) == 0 ) {
    return newText;
  }
  if ( ((int)(newText.length())) == 0 ) {
    return existing;
  }
  if ( this->startsWithPunctuation(newText) ) {
    return existing + newText;
  }
  if ( this->endsWithOpenPunctuation(existing) ) {
    return existing + newText;
  }
  return (existing + std::string(" ")) + newText;
}
std::string  ComponentEngine::unquote( std::string s ) {
  int __len = (int)(s.length());
  if ( __len < 2 ) {
    return s;
  }
  int first = s.at(0);
  int last = s.at((__len - 1));
  if ( ((first == 34) || (first == 39)) && (first == last) ) {
    return r_utf8_substr(s, 1, (__len - 1) - 1);
  }
  return s;
}
EVGComponentTool::EVGComponentTool( ) {
  this->pageWidth = 595;
  this->pageHeight = 842;
  this->inputPath = std::string("");
  this->outputPath = std::string("");
  this->fontsDir = std::string("./Fonts");
  this->assetPaths = std::string("");
  this->fontManager =  std::make_shared<FontManager>();
}
void  EVGComponentTool::main( std::vector<std::string> args ) {
  std::cout << std::string("EVG Component Tool v1.0 - PDF Generator with TSX Components") << std::endl;
  std::cout << std::string("============================================================") << std::endl;
  if ( ((int)(args.size())) < 3 ) {
    std::cout << std::string("Usage: evg_component_tool <input.tsx> <output.pdf> [--assets=path1;path2;...]") << std::endl;
    std::cout << std::string("") << std::endl;
    std::cout << std::string("Options:") << std::endl;
    std::cout << std::string("  --assets=PATHS  Semicolon-separated list of asset directories") << std::endl;
    std::cout << std::string("                  Used for fonts, components, and images") << std::endl;
    std::cout << std::string("") << std::endl;
    std::cout << std::string("Example:") << std::endl;
    std::cout << std::string("  evg_component_tool test.tsx output.pdf --assets=./Fonts;./components") << std::endl;
    return;
  }
  inputPath = args.at(1);
  outputPath = args.at(2);
  int i = 3;
  while (i < ((int)(args.size()))) {
    std::string arg = args.at(i);
    if ( (r_string_index_of(arg , std::string("--assets="))) == 0 ) {
      assetPaths = r_utf8_substr(arg, 9, ((int)(arg.length())) - 9);
      std::cout << std::string("Asset paths: ") + assetPaths << std::endl;
    }
    i = i + 1;
  };
  if ( ((int)(assetPaths.length())) == 0 ) {
    std::cout << std::string("") << std::endl;
    std::cout << std::string("ERROR: Missing required --assets argument") << std::endl;
    std::cout << std::string("") << std::endl;
    std::cout << std::string("The --assets argument is required to specify where fonts and components are located.") << std::endl;
    std::cout << std::string("") << std::endl;
    std::cout << std::string("Usage: evg_component_tool <input.tsx> <output.pdf> --assets=path1;path2;...") << std::endl;
    std::cout << std::string("") << std::endl;
    std::cout << std::string("Example:") << std::endl;
    std::cout << std::string("  evg_component_tool test.tsx output.pdf --assets=./Fonts;./components") << std::endl;
    return;
  }
  std::cout << std::string("Input:  ") + inputPath << std::endl;
  std::cout << std::string("Output: ") + outputPath << std::endl;
  std::cout << std::string("") << std::endl;
  std::string basePath = this->getDirectory(inputPath);
  std::string fileName = this->getFileName(inputPath);
  std::cout << std::string("Base path: ") + basePath << std::endl;
  std::cout << std::string("File name: ") + fileName << std::endl;
  std::cout << std::string("") << std::endl;
  this->initFonts();
  if ( fontManager->getFontCount() == 0 ) {
    std::cout << std::string("") << std::endl;
    std::cout << std::string("ERROR: No fonts were loaded!") << std::endl;
    std::cout << std::string("") << std::endl;
    std::cout << std::string("Please check that your --assets path contains a fonts directory with .ttf files.") << std::endl;
    std::cout << std::string("Expected structure: <assets-path>/Open_Sans/OpenSans-Regular.ttf") << std::endl;
    std::cout << std::string("") << std::endl;
    std::cout << std::string("Current asset paths: ") + assetPaths << std::endl;
    return;
  }
  std::shared_ptr<ComponentEngine> engine =  std::make_shared<ComponentEngine>();
  engine->pageWidth = pageWidth;
  engine->pageHeight = pageHeight;
  if ( ((int)(assetPaths.length())) > 0 ) {
    engine->setAssetPaths(assetPaths);
  }
  std::cout << std::string("Parsing TSX with components...") << std::endl;
  std::shared_ptr<EVGElement> evgRoot = engine->parseFile(basePath, fileName);
  if ( ((int)(evgRoot->tagName.length())) == 0 ) {
    std::cout << std::string("Error: Failed to generate EVG tree") << std::endl;
    return;
  }
  std::cout << std::string("EVG tree generated successfully") << std::endl;
  std::cout << std::string("") << std::endl;
  std::cout << std::string("EVG Tree Structure:") << std::endl;
  std::cout << std::string("-------------------") << std::endl;
  this->printEVGTree(evgRoot, 0);
  std::cout << std::string("") << std::endl;
  std::cout << std::string("Rendering to PDF...") << std::endl;
  std::shared_ptr<EVGPDFRenderer> renderer =  std::make_shared<EVGPDFRenderer>();
  renderer->init();
  renderer->setPageSize(pageWidth, pageHeight);
  renderer->setFontManager(fontManager);
  renderer->setBaseDir(basePath);
  if ( ((int)(assetPaths.length())) > 0 ) {
    renderer->setAssetPaths(assetPaths);
  }
  std::shared_ptr<TTFTextMeasurer> ttfMeasurer =  std::make_shared<TTFTextMeasurer>(fontManager);
  renderer->setMeasurer(ttfMeasurer);
  std::vector<uint8_t> pdfBuffer = renderer->render(evgRoot);
  std::string outputDir = this->getDirectory(outputPath);
  std::string outputFileName = this->getFileName(outputPath);
  r_buffer_write_file(outputDir, outputFileName, pdfBuffer);
  std::cout << std::string("PDF generated successfully: ") + outputPath << std::endl;
}
void  EVGComponentTool::printEVGTree( std::shared_ptr<EVGElement> el , int depth ) {
  std::string indent = std::string("");
  int i = 0;
  while (i < depth) {
    indent = indent + std::string("  ");
    i = i + 1;
  };
  std::string info = (indent + std::string("<")) + el->tagName;
  if ( ((int)(el->id.length())) > 0 ) {
    info = ((info + std::string(" id=\"")) + el->id) + std::string("\"");
  }
  if ( ((int)(el->textContent.length())) > 0 ) {
    if ( ((int)(el->textContent.length())) > 30 ) {
      info = ((info + std::string(" text=\"")) + (r_utf8_substr(el->textContent, 0, 30 - 0))) + std::string("...\"");
    } else {
      info = ((info + std::string(" text=\"")) + el->textContent) + std::string("\"");
    }
  }
  info = (((((((info + std::string("> pos=(")) + (std::to_string(el->calculatedX))) + std::string(",")) + (std::to_string(el->calculatedY))) + std::string(") size=")) + (std::to_string(el->calculatedWidth))) + std::string("x")) + (std::to_string(el->calculatedHeight));
  std::cout << info << std::endl;
  i = 0;
  while (i < ((int)(el->children.size()))) {
    std::shared_ptr<EVGElement> child = el->children.at(i);
    this->printEVGTree(child, depth + 1);
    i = i + 1;
  };
}
void  EVGComponentTool::initFonts() {
  std::cout << std::string("Loading fonts...") << std::endl;
  if ( ((int)(assetPaths.length())) > 0 ) {
    fontManager->setFontsDirectories(assetPaths);
  } else {
    fontManager->setFontsDirectory(fontsDir);
  }
  fontManager->loadFont(std::string("Open_Sans/OpenSans-Regular.ttf"));
  fontManager->loadFont(std::string("Open_Sans/OpenSans-Bold.ttf"));
  fontManager->loadFont(std::string("Helvetica/Helvetica.ttf"));
  fontManager->loadFont(std::string("Noto_Sans/NotoSans-Regular.ttf"));
  fontManager->loadFont(std::string("Noto_Sans/NotoSans-Bold.ttf"));
  fontManager->loadFont(std::string("Cinzel/Cinzel-Regular.ttf"));
  fontManager->loadFont(std::string("Josefin_Sans/JosefinSans-Regular.ttf"));
  fontManager->loadFont(std::string("Gloria_Hallelujah/GloriaHallelujah.ttf"));
  fontManager->loadFont(std::string("Great_Vibes/GreatVibes-Regular.ttf"));
  fontManager->loadFont(std::string("Kaushan_Script/KaushanScript-Regular.ttf"));
}
std::string  EVGComponentTool::getDirectory( std::string path ) {
  int lastSlash = -1;
  int i = 0;
  int __len = (int)(path.length());
  while (i < __len) {
    std::string ch = r_utf8_substr(path, i, (i + 1) - i);
    if ( (ch == std::string("/")) || (ch == std::string("\\")) ) {
      lastSlash = i;
    }
    i = i + 1;
  };
  if ( lastSlash >= 0 ) {
    return r_utf8_substr(path, 0, (lastSlash + 1) - 0);
  }
  return std::string("./");
}
std::string  EVGComponentTool::getFileName( std::string path ) {
  int lastSlash = -1;
  int i = 0;
  int __len = (int)(path.length());
  while (i < __len) {
    std::string ch = r_utf8_substr(path, i, (i + 1) - i);
    if ( (ch == std::string("/")) || (ch == std::string("\\")) ) {
      lastSlash = i;
    }
    i = i + 1;
  };
  if ( lastSlash >= 0 ) {
    return r_utf8_substr(path, (lastSlash + 1), __len - (lastSlash + 1));
  }
  return path;
}
int main(int argc, char* argv[]) {
  __g_argc = argc;
  __g_argv = argv;
  std::shared_ptr<EVGComponentTool> tool =  std::make_shared<EVGComponentTool>();
  int argCount = __g_argc - 1;
  if ( argCount < 2 ) {
    std::cout << std::string("Usage: evg_component_tool <input.tsx> <output.pdf>") << std::endl;
    return 0;
  }
  std::vector<std::string> args;
  args.push_back( std::string("evg_component_tool")  );
  int i = 0;
  while (i < argCount) {
    args.push_back( std::string(__g_argv[i + 1])  );
    i = i + 1;
  };
  tool->main(args);
  return 0;
}
