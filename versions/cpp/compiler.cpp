#include  <string>
#include  <vector>
#include  <map>
#include  <iostream>
#include  <iterator>
#include  <algorithm>
#include  <sstream>
#include  <sys/stat.h>
#include  <sys/types.h>
#include  <cctype>
#include  <fstream>
#include  <ctime>

// define classes here to avoid compiler errors
class RangerAppTodo;
class RangerCompilerMessage;
class RangerParamEventHandler;
class RangerParamEventList;
class RangerParamEventMap;
class RangerAppArrayValue;
class RangerAppHashValue;
class RangerAppValue;
class RangerRefForce;
class RangerAppParamDesc;
class RangerAppFunctionDesc;
class RangerAppMethodVariants;
class RangerAppInterfaceImpl;
class RangerAppClassDesc;
class RangerTypeClass;
class SourceCode;
class CodeNode;
class RangerNodeValue;
class RangerBackReference;
class RangerAppEnum;
class OpFindResult;
class RangerAppWriterContext;
class CodeFile;
class CodeFileSystem;
class CodeSlice;
class CodeWriter;
class RangerLispParser;
class RangerArgMatch;
class ClassJoinPoint;
class RangerFlowParser;
class NodeEvalState;
class RangerGenericClassWriter;
class RangerJava7ClassWriter;
class RangerSwift3ClassWriter;
class RangerCppClassWriter;
class RangerKotlinClassWriter;
class RangerCSharpClassWriter;
class RangerScalaClassWriter;
class RangerGolangClassWriter;
class RangerPHPClassWriter;
class RangerJavaScriptClassWriter;
class RangerRangerClassWriter;
class LiveCompiler;
class ColorConsole;
class DictNode;
class RangerSerializeClass;
class CompilerInterface;


template< typename T >
int r_arr_index_of( std::vector<T> vec, T elem )  { 
    auto it = std::find(vec.begin(),vec.end(),elem);
    if(it!=vec.end()) {
        return it - vec.begin();
    } 
    return -1;
}


std::vector<std::string> r_str_split(std::string str, std::string  delimiter) {
    size_t first_index = 0;
    size_t prev_index = 0;
    std::vector<std::string> res;
    while( std::string::npos != ( first_index = str.find_first_of( delimiter , prev_index ) )) {
        res.push_back( str.substr( prev_index, first_index - prev_index) );
        prev_index = first_index + 1;
    }
    if(res.size() == 0 ) {
      res.push_back(str);
    }    
    return res;
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


template<typename T>
r_optional_primitive<int> cpp_get_map_int_value( std::map<std::string, int> m , std::string key) {
r_optional_primitive<int> result;
try {
result.value = m[key];
result.has_value = true;
} catch (...) {

}
return result;
}

bool  r_cpp_dir_exists(std::string name) 
{
  struct stat buffer;
  return (stat (name.c_str(), &buffer) == 0);
}    
    

void  r_cpp_create_dir(std::string name) 
{
  mkdir( name.c_str(), S_IRWXU | S_IRWXG | S_IROTH | S_IXOTH );
}    
    

void  r_cpp_write_file(std::string path, std::string filename, std::string text) 
{
  std::ofstream outputFile;
  outputFile.open(path + "/" + filename);
  outputFile << text;
  outputFile.close();
}    
    

inline std::string  r_cpp_trim(std::string &s) 
{
   auto wsfront=std::find_if_not(s.begin(),s.end(),[](int c){return std::isspace(c);});
   auto wsback=std::find_if_not(s.rbegin(),s.rend(),[](int c){return std::isspace(c);}).base();
   return (wsback<=wsfront ? std::string() : std::string(wsfront,wsback));
}    
    
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
template< typename T >
auto r_m_arr_extract( T & a, int i )  { 
    auto elem = a.at(i); 
    a.erase(a.begin() + i);
    return elem;
}

std::string  r_cpp_readFile(std::string path, std::string filename) 
{
  std::ifstream ifs(path + "/" + filename);
  std::string content( (std::istreambuf_iterator<char>(ifs) ),
                       (std::istreambuf_iterator<char>()    ) );
  return content;
}    
    

template <typename T>
std::string join(const T& v, const std::string& delim) {
    std::ostringstream s;
    for (const auto& i : v) {
        if (&i != &v[0]) {
            s << delim;
        }
        s << i;
    }
    return s.str();
}   
    

bool r_cpp_file_exists(std::string name) 
{
  struct stat buffer;
  return (stat (name.c_str(), &buffer) == 0);
}    
    

// header definitions
class RangerAppTodo : public std::enable_shared_from_this<RangerAppTodo>  { 
  public :
    std::string description;
    std::shared_ptr<CodeNode> todonode;
    /* class constructor */ 
    RangerAppTodo( );
};
class RangerCompilerMessage : public std::enable_shared_from_this<RangerCompilerMessage>  { 
  public :
    int error_level     /** note: unused */;
    int code_line     /** note: unused */;
    std::string fileName     /** note: unused */;
    std::string description;
    std::shared_ptr<CodeNode> node;
    /* class constructor */ 
    RangerCompilerMessage( );
};
class RangerParamEventHandler : public std::enable_shared_from_this<RangerParamEventHandler>  { 
  public :
    /* class constructor */ 
    RangerParamEventHandler( );
    /* instance methods */ 
    void callback( std::shared_ptr<RangerAppParamDesc> param );
};
class RangerParamEventList : public std::enable_shared_from_this<RangerParamEventList>  { 
  public :
    std::vector<std::shared_ptr<RangerParamEventHandler>> list;
    /* class constructor */ 
    RangerParamEventList( );
};
class RangerParamEventMap : public std::enable_shared_from_this<RangerParamEventMap>  { 
  public :
    std::map<std::string,std::shared_ptr<RangerParamEventList>> events;
    /* class constructor */ 
    RangerParamEventMap( );
    /* instance methods */ 
    void clearAllEvents();
    void addEvent( std::string name , std::shared_ptr<RangerParamEventHandler> e );
    void fireEvent( std::string name , std::shared_ptr<RangerAppParamDesc> from );
};
class RangerAppArrayValue : public std::enable_shared_from_this<RangerAppArrayValue>  { 
  public :
    int value_type     /** note: unused */;
    std::string value_type_name     /** note: unused */;
    std::vector<std::shared_ptr<RangerAppValue>> values     /** note: unused */;
    /* class constructor */ 
    RangerAppArrayValue( );
};
class RangerAppHashValue : public std::enable_shared_from_this<RangerAppHashValue>  { 
  public :
    int value_type     /** note: unused */;
    std::string key_type_name     /** note: unused */;
    std::string value_type_name     /** note: unused */;
    std::map<std::string,std::shared_ptr<RangerAppValue>> s_values     /** note: unused */;
    std::map<int,std::shared_ptr<RangerAppValue>> i_values     /** note: unused */;
    std::map<bool,std::shared_ptr<RangerAppValue>> b_values     /** note: unused */;
    std::map<double,std::shared_ptr<RangerAppValue>> d_values     /** note: unused */;
    /* class constructor */ 
    RangerAppHashValue( );
};
class RangerAppValue : public std::enable_shared_from_this<RangerAppValue>  { 
  public :
    int double_value     /** note: unused */;
    std::string string_value     /** note: unused */;
    int int_value     /** note: unused */;
    bool boolean_value     /** note: unused */;
    std::shared_ptr<RangerAppArrayValue> arr     /** note: unused */;
    std::shared_ptr<RangerAppHashValue> hash     /** note: unused */;
    /* class constructor */ 
    RangerAppValue( );
};
class RangerRefForce : public std::enable_shared_from_this<RangerRefForce>  { 
  public :
    int strength;
    int lifetime;
    std::shared_ptr<CodeNode> changer;
    /* class constructor */ 
    RangerRefForce( );
};
class RangerAppParamDesc : public std::enable_shared_from_this<RangerAppParamDesc>  { 
  public :
    std::string name;
    std::shared_ptr<RangerAppValue> value     /** note: unused */;
    std::string compiledName;
    std::string debugString;
    int ref_cnt;
    int init_cnt;
    int set_cnt;
    int return_cnt;
    int prop_assign_cnt     /** note: unused */;
    int value_type;
    bool has_default     /** note: unused */;
    std::shared_ptr<CodeNode> def_value;
    std::shared_ptr<RangerNodeValue> default_value     /** note: unused */;
    bool isThis     /** note: unused */;
    std::shared_ptr<RangerAppClassDesc> classDesc     /** note: unused */;
    std::shared_ptr<RangerAppFunctionDesc> fnDesc     /** note: unused */;
    std::vector<std::shared_ptr<RangerRefForce>> ownerHistory;
    int varType;
    int refType;
    int initRefType;
    bool isParam     /** note: unused */;
    int paramIndex     /** note: unused */;
    bool is_optional;
    bool is_mutating     /** note: unused */;
    bool is_set     /** note: unused */;
    bool is_class_variable;
    bool is_captured;
    std::shared_ptr<CodeNode> node;
    std::shared_ptr<CodeNode> nameNode;
    std::string description     /** note: unused */;
    std::string git_doc     /** note: unused */;
    bool has_events;
    std::shared_ptr<RangerParamEventMap> eMap;
    /* class constructor */ 
    RangerAppParamDesc( );
    /* instance methods */ 
    virtual void addEvent( std::string name , std::shared_ptr<RangerParamEventHandler> e );
    virtual void changeStrength( int newStrength , int lifeTime , std::shared_ptr<CodeNode> changer );
    virtual bool isProperty();
    virtual bool isClass();
    virtual bool doesInherit();
    virtual bool isAllocatedType();
    virtual void moveRefTo( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppParamDesc> target , std::shared_ptr<RangerAppWriterContext> ctx );
    virtual int originalStrength();
    virtual int getLifetime();
    virtual int getStrength();
    virtual void debugRefChanges();
    virtual bool pointsToObject( std::shared_ptr<RangerAppWriterContext> ctx );
    virtual bool isObject();
    virtual bool isArray();
    virtual bool isHash();
    virtual bool isPrimitive();
    virtual std::string getRefTypeName();
    virtual std::string getVarTypeName();
    virtual std::string getTypeName();
};
class RangerAppFunctionDesc : public RangerAppParamDesc { 
  public :
    std::string name;
    int ref_cnt;
    std::shared_ptr<CodeNode> node;
    std::shared_ptr<CodeNode> nameNode;
    std::shared_ptr<CodeNode> fnBody;
    std::vector<std::shared_ptr<RangerAppParamDesc>> params;
    std::shared_ptr<RangerAppParamDesc> return_value     /** note: unused */;
    bool is_method     /** note: unused */;
    bool is_static;
    std::shared_ptr<RangerAppClassDesc> container_class     /** note: unused */;
    int refType;
    std::shared_ptr<RangerAppWriterContext> fnCtx;
    /* class constructor */ 
    RangerAppFunctionDesc( );
    /* instance methods */ 
    bool isClass();
    bool isProperty();
};
class RangerAppMethodVariants : public std::enable_shared_from_this<RangerAppMethodVariants>  { 
  public :
    std::string name     /** note: unused */;
    std::vector<std::shared_ptr<RangerAppFunctionDesc>> variants;
    /* class constructor */ 
    RangerAppMethodVariants( );
};
class RangerAppInterfaceImpl : public std::enable_shared_from_this<RangerAppInterfaceImpl>  { 
  public :
    std::string name     /** note: unused */;
    std::shared_ptr<CodeNode> typeParams     /** note: unused */;
    /* class constructor */ 
    RangerAppInterfaceImpl( );
};
class RangerAppClassDesc : public RangerAppParamDesc { 
  public :
    std::string name;
    bool is_system;
    std::string compiledName     /** note: unused */;
    std::map<std::string,std::string> systemNames;
    std::shared_ptr<CodeNode> systemInfo     /** note: unused */;
    bool is_interface;
    bool is_system_union;
    bool is_template     /** note: unused */;
    bool is_serialized;
    bool is_trait;
    std::shared_ptr<CodeNode> generic_params     /** note: unused */;
    std::shared_ptr<RangerAppWriterContext> ctx;
    std::vector<std::shared_ptr<RangerAppParamDesc>> variables;
    std::vector<std::shared_ptr<RangerAppParamDesc>> capturedLocals;
    std::vector<std::shared_ptr<RangerAppFunctionDesc>> methods;
    std::map<std::string,bool> defined_methods;
    std::vector<std::shared_ptr<RangerAppFunctionDesc>> static_methods;
    std::map<std::string,bool> defined_static_methods;
    std::vector<std::string> defined_variants;
    std::map<std::string,std::shared_ptr<RangerAppMethodVariants>> method_variants;
    bool has_constructor;
    std::shared_ptr<CodeNode> constructor_node;
    std::shared_ptr<RangerAppFunctionDesc> constructor_fn;
    bool has_destructor     /** note: unused */;
    std::shared_ptr<CodeNode> destructor_node     /** note: unused */;
    std::shared_ptr<RangerAppFunctionDesc> destructor_fn     /** note: unused */;
    std::vector<std::string> extends_classes;
    std::vector<std::string> implements_interfaces;
    std::vector<std::string> consumes_traits;
    std::vector<std::string> is_union_of;
    std::shared_ptr<CodeNode> nameNode;
    std::shared_ptr<CodeNode> classNode;
    std::vector<std::shared_ptr<CodeWriter>> contr_writers     /** note: unused */;
    bool is_inherited;
    /* class constructor */ 
    RangerAppClassDesc( );
    /* instance methods */ 
    bool isClass();
    bool isProperty();
    bool doesInherit();
    bool isSameOrParentClass( std::string class_name , std::shared_ptr<RangerAppWriterContext> ctx );
    bool hasOwnMethod( std::string m_name );
    bool hasMethod( std::string m_name );
    std::shared_ptr<RangerAppFunctionDesc> findMethod( std::string f_name );
    bool hasStaticMethod( std::string m_name );
    std::shared_ptr<RangerAppFunctionDesc> findStaticMethod( std::string f_name );
    std::shared_ptr<RangerAppParamDesc> findVariable( std::string f_name );
    void addParentClass( std::string p_name );
    void addVariable( std::shared_ptr<RangerAppParamDesc> desc );
    void addMethod( std::shared_ptr<RangerAppFunctionDesc> desc );
    void addStaticMethod( std::shared_ptr<RangerAppFunctionDesc> desc );
};
class RangerTypeClass : public std::enable_shared_from_this<RangerTypeClass>  { 
  public :
    std::string name     /** note: unused */;
    std::string compiledName     /** note: unused */;
    int value_type     /** note: unused */;
    std::string type_name     /** note: unused */;
    std::string key_type     /** note: unused */;
    std::string array_type     /** note: unused */;
    bool is_primitive     /** note: unused */;
    bool is_mutable     /** note: unused */;
    bool is_optional     /** note: unused */;
    bool is_generic     /** note: unused */;
    bool is_lambda     /** note: unused */;
    std::shared_ptr<CodeNode> nameNode     /** note: unused */;
    std::shared_ptr<CodeNode> templateParams     /** note: unused */;
    /* class constructor */ 
    RangerTypeClass( );
};
class SourceCode : public std::enable_shared_from_this<SourceCode>  { 
  public :
    std::string code;
    std::vector<std::string> lines;
    std::string filename;
    /* class constructor */ 
    SourceCode( std::string code_str  );
    /* instance methods */ 
    std::string getLineString( int line_index );
    int getLine( int sp );
    std::string getColumnStr( int sp );
    int getColumn( int sp );
};
class CodeNode : public std::enable_shared_from_this<CodeNode>  { 
  public :
    std::shared_ptr<SourceCode> code;
    int sp;
    int ep;
    bool has_operator;
    bool disabled_node;
    int op_index;
    bool is_system_class;
    bool mutable_def;
    bool expression;
    std::string vref;
    bool is_block_node;
    bool infix_operator;
    std::shared_ptr<CodeNode> infix_node;
    bool infix_subnode;
    bool has_lambda;
    bool has_lambda_call;
    int operator_pred;
    bool to_the_right;
    std::shared_ptr<CodeNode> right_node;
    std::string type_type;
    std::string type_name;
    std::string key_type;
    std::string array_type;
    std::vector<std::string> ns;
    bool has_vref_annotation;
    std::shared_ptr<CodeNode> vref_annotation;
    bool has_type_annotation;
    std::shared_ptr<CodeNode> type_annotation;
    int parsed_type;
    int value_type;
    int ref_type;
    int ref_need_assign     /** note: unused */;
    double double_value;
    std::string string_value;
    int int_value;
    bool boolean_value;
    std::shared_ptr<CodeNode> expression_value;
    std::map<std::string,std::shared_ptr<CodeNode>> props;
    std::vector<std::string> prop_keys;
    std::vector<std::shared_ptr<CodeNode>> comments;
    std::vector<std::shared_ptr<CodeNode>> children;
    std::shared_ptr<CodeNode> parent;
    std::shared_ptr<RangerTypeClass> typeClass;
    std::shared_ptr<RangerAppWriterContext> lambda_ctx;
    std::vector<std::shared_ptr<RangerAppParamDesc>> nsp;
    int eval_type;
    std::string eval_type_name;
    std::string eval_key_type;
    std::string eval_array_type;
    std::shared_ptr<CodeNode> eval_function;
    bool flow_done;
    bool ref_change_done;
    std::shared_ptr<CodeNode> eval_type_node     /** note: unused */;
    int didReturnAtIndex;
    bool hasVarDef;
    bool hasClassDescription;
    bool hasNewOper;
    std::shared_ptr<RangerAppClassDesc> clDesc;
    bool hasFnCall;
    std::shared_ptr<RangerAppFunctionDesc> fnDesc;
    bool hasParamDesc;
    std::shared_ptr<RangerAppParamDesc> paramDesc;
    std::shared_ptr<RangerAppParamDesc> ownParamDesc;
    std::shared_ptr<RangerAppWriterContext> evalCtx;
    std::shared_ptr<NodeEvalState> evalState     /** note: unused */;
    /* class constructor */ 
    CodeNode( std::shared_ptr<SourceCode> source , int start , int end  );
    /* instance methods */ 
    std::string getParsedString();
    std::string getFilename();
    std::shared_ptr<CodeNode> getFlag( std::string flagName );
    bool hasFlag( std::string flagName );
    void setFlag( std::string flagName );
    std::string getTypeInformationString();
    int getLine();
    std::string getLineString( int line_index );
    std::string getColStartString();
    std::string getLineAsString();
    std::string getPositionalString();
    bool isParsedAsPrimitive();
    bool isPrimitive();
    bool isPrimitiveType();
    bool isAPrimitiveType();
    std::shared_ptr<CodeNode> getFirst();
    std::shared_ptr<CodeNode> getSecond();
    std::shared_ptr<CodeNode> getThird();
    bool isSecondExpr();
    std::string getOperator();
    std::string getVRefAt( int idx );
    std::string getStringAt( int idx );
    bool hasExpressionProperty( std::string name );
    std::shared_ptr<CodeNode> getExpressionProperty( std::string name );
    bool hasIntProperty( std::string name );
    int getIntProperty( std::string name );
    bool hasDoubleProperty( std::string name );
    double getDoubleProperty( std::string name );
    bool hasStringProperty( std::string name );
    std::string getStringProperty( std::string name );
    bool hasBooleanProperty( std::string name );
    bool getBooleanProperty( std::string name );
    bool isFirstTypeVref( std::string vrefName );
    bool isFirstVref( std::string vrefName );
    std::string getString();
    void walk();
    void writeCode( std::shared_ptr<CodeWriter> wr );
    std::string getCode();
    std::shared_ptr<CodeNode> rebuildWithType( std::shared_ptr<RangerArgMatch> match , bool changeVref );
    std::string buildTypeSignatureUsingMatch( std::shared_ptr<RangerArgMatch> match );
    std::string buildTypeSignature();
    std::string getVRefSignatureWithMatch( std::shared_ptr<RangerArgMatch> match );
    std::string getVRefSignature();
    std::string getTypeSignatureWithMatch( std::shared_ptr<RangerArgMatch> match );
    std::string getTypeSignature();
    int typeNameAsType( std::shared_ptr<RangerAppWriterContext> ctx );
    void copyEvalResFrom( std::shared_ptr<CodeNode> node );
    void defineNodeTypeTo( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx );
    void ifNoTypeSetToVoid();
    bool ifNoTypeSetToEvalTypeOf( std::shared_ptr<CodeNode> node );
};
class RangerNodeValue : public std::enable_shared_from_this<RangerNodeValue>  { 
  public :
     r_optional_primitive<double>  double_value     /** note: unused */;
    std::string string_value     /** note: unused */;
     r_optional_primitive<int>  int_value     /** note: unused */;
    bool boolean_value     /** note: unused */;
    std::shared_ptr<CodeNode> expression_value     /** note: unused */;
    /* class constructor */ 
    RangerNodeValue( );
};
class RangerBackReference : public std::enable_shared_from_this<RangerBackReference>  { 
  public :
    std::string from_class     /** note: unused */;
    std::string var_name     /** note: unused */;
    std::string ref_type     /** note: unused */;
    /* class constructor */ 
    RangerBackReference( );
};
class RangerAppEnum : public std::enable_shared_from_this<RangerAppEnum>  { 
  public :
    std::string name     /** note: unused */;
    int cnt;
    std::map<std::string,int> values;
    std::shared_ptr<CodeNode> node     /** note: unused */;
    /* class constructor */ 
    RangerAppEnum( );
    /* instance methods */ 
    void add( std::string n );
};
class OpFindResult : public std::enable_shared_from_this<OpFindResult>  { 
  public :
    bool did_find     /** note: unused */;
    std::shared_ptr<CodeNode> node     /** note: unused */;
    /* class constructor */ 
    OpFindResult( );
};
class RangerAppWriterContext : public std::enable_shared_from_this<RangerAppWriterContext>  { 
  public :
    std::shared_ptr<CodeNode> langOperators;
    std::shared_ptr<CodeNode> stdCommands;
    std::shared_ptr<CodeNode> reservedWords;
    int intRootCounter     /** note: unused */;
    std::string targetLangName;
    std::shared_ptr<RangerAppWriterContext> parent;
    std::vector<std::string> defined_imports     /** note: unused */;
    std::map<std::string,bool> already_imported;
    std::shared_ptr<CodeFileSystem> fileSystem;
    bool is_function;
    bool class_level_context;
    bool function_level_context;
    bool in_main;
    bool is_block     /** note: unused */;
    bool is_capturing;
    std::vector<std::string> captured_variables;
    bool has_block_exited     /** note: unused */;
    bool in_expression     /** note: unused */;
    std::vector<bool> expr_stack;
    bool expr_restart;
    bool in_method     /** note: unused */;
    std::vector<bool> method_stack;
    std::vector<std::string> typeNames     /** note: unused */;
    std::map<std::string,std::shared_ptr<RangerTypeClass>> typeClasses     /** note: unused */;
    std::string currentClassName     /** note: unused */;
    bool in_class;
    bool in_static_method;
    std::shared_ptr<RangerAppClassDesc> currentClass;
    std::shared_ptr<RangerAppFunctionDesc> currentMethod;
    std::string thisName;
    std::map<std::string,std::shared_ptr<RangerAppEnum>> definedEnums;
    std::map<std::string,std::shared_ptr<RangerAppClassDesc>> definedInterfaces     /** note: unused */;
    std::vector<std::string> definedInterfaceList     /** note: unused */;
    std::map<std::string,std::shared_ptr<RangerAppClassDesc>> definedClasses;
    std::vector<std::string> definedClassList;
    std::map<std::string,std::shared_ptr<CodeNode>> templateClassNodes;
    std::vector<std::string> templateClassList;
    std::map<std::string,std::string> classSignatures;
    std::map<std::string,std::string> classToSignature;
    std::map<std::string,std::shared_ptr<RangerAppClassDesc>> templateClasses     /** note: unused */;
    std::map<std::string,std::shared_ptr<CodeWriter>> classStaticWriters;
    std::map<std::string,std::shared_ptr<RangerAppParamDesc>> localVariables;
    std::vector<std::string> localVarNames;
    std::map<std::string,bool> compilerFlags;
    std::map<std::string,std::string> compilerSettings;
    std::vector<std::shared_ptr<RangerCompilerMessage>> parserErrors;
    std::vector<std::shared_ptr<RangerCompilerMessage>> compilerErrors;
    std::vector<std::shared_ptr<RangerCompilerMessage>> compilerMessages;
    std::map<std::string,std::shared_ptr<RangerCompilerMessage>> compilerLog     /** note: unused */;
    std::vector<std::shared_ptr<RangerAppTodo>> todoList;
    std::map<std::string,bool> definedMacro     /** note: unused */;
    std::map<std::string,int> defCounts;
    std::map<std::string,std::string> refTransform;
    std::string rootFile;
    /* class constructor */ 
    RangerAppWriterContext( );
    /* instance methods */ 
    bool isCapturing();
    bool isLocalToCapture( std::string name );
    void addCapturedVariable( std::string name );
    std::vector<std::string> getCapturedVariables();
    std::string transformWord( std::string input_word );
    bool initReservedWords();
    bool initStdCommands();
    std::string transformTypeName( std::string typeName );
    bool isPrimitiveType( std::string typeName );
    bool isDefinedType( std::string typeName );
    bool hadValidType( std::shared_ptr<CodeNode> node );
    std::string getTargetLang();
    std::shared_ptr<CodeNode> findOperator( std::shared_ptr<CodeNode> node );
    std::shared_ptr<CodeNode> getStdCommands();
    std::shared_ptr<RangerAppClassDesc> findClassWithSign( std::shared_ptr<CodeNode> node );
    std::string createSignature( std::string origClass , std::string classSig );
    void createOperator( std::shared_ptr<CodeNode> fromNode );
    std::shared_ptr<CodeWriter> getFileWriter( std::string path , std::string fileName );
    void addTodo( std::shared_ptr<CodeNode> node , std::string descr );
    void setThisName( std::string the_name );
    std::string getThisName();
    void printLogs( std::string logName );
    void log( std::shared_ptr<CodeNode> node , std::string logName , std::string descr );
    void addMessage( std::shared_ptr<CodeNode> node , std::string descr );
    void addError( std::shared_ptr<CodeNode> targetnode , std::string descr );
    void addParserError( std::shared_ptr<CodeNode> targetnode , std::string descr );
    void addTemplateClass( std::string name , std::shared_ptr<CodeNode> node );
    bool hasTemplateNode( std::string name );
    std::shared_ptr<CodeNode> findTemplateNode( std::string name );
    void setStaticWriter( std::string className , std::shared_ptr<CodeWriter> writer );
    std::shared_ptr<CodeWriter> getStaticWriter( std::string className );
    bool isEnumDefined( std::string n );
    std::shared_ptr<RangerAppEnum> getEnum( std::string n );
    bool isVarDefined( std::string name );
    void setCompilerFlag( std::string name , bool value );
    bool hasCompilerFlag( std::string s_name );
    std::string getCompilerSetting( std::string s_name );
    bool hasCompilerSetting( std::string s_name );
    std::shared_ptr<RangerAppParamDesc> getVariableDef( std::string name );
    std::shared_ptr<RangerAppWriterContext> findFunctionCtx();
    int getFnVarCnt( std::string name );
    void debugVars();
    int getVarTotalCnt( std::string name );
    int getFnVarCnt2( std::string name );
    int getFnVarCnt3( std::string name );
    bool isMemberVariable( std::string name );
    void defineVariable( std::string name , std::shared_ptr<RangerAppParamDesc> desc );
    bool isDefinedClass( std::string name );
    std::shared_ptr<RangerAppWriterContext> getRoot();
    std::vector<std::shared_ptr<RangerAppClassDesc>> getClasses();
    void addClass( std::string name , std::shared_ptr<RangerAppClassDesc> desc );
    std::shared_ptr<RangerAppClassDesc> findClass( std::string name );
    bool hasClass( std::string name );
    std::shared_ptr<RangerAppFunctionDesc> getCurrentMethod();
    void setCurrentClass( std::shared_ptr<RangerAppClassDesc> cc );
    void disableCurrentClass();
    bool hasCurrentClass();
    std::shared_ptr<RangerAppClassDesc> getCurrentClass();
    void restartExpressionLevel();
    bool isInExpression();
    int expressionLevel();
    void setInExpr();
    void unsetInExpr();
    int getErrorCount();
    bool isInStatic();
    bool isInMain();
    bool isInMethod();
    void setInMethod();
    void unsetInMethod();
    std::shared_ptr<RangerAppWriterContext> findMethodLevelContext();
    std::shared_ptr<RangerAppWriterContext> findClassLevelContext();
    std::shared_ptr<RangerAppWriterContext> fork();
    std::string getRootFile();
    void setRootFile( std::string file_name );
};
class CodeFile : public std::enable_shared_from_this<CodeFile>  { 
  public :
    std::string path_name;
    std::string name;
    std::shared_ptr<CodeWriter> writer;
    std::map<std::string,std::string> import_list;
    std::vector<std::string> import_names;
    std::shared_ptr<CodeFileSystem> fileSystem;
    /* class constructor */ 
    CodeFile( std::string filePath , std::string fileName  );
    /* instance methods */ 
    void addImport( std::string import_name );
    std::shared_ptr<CodeWriter> testCreateWriter();
    std::vector<std::string> getImports();
    std::shared_ptr<CodeWriter> getWriter();
    std::string getCode();
};
class CodeFileSystem : public std::enable_shared_from_this<CodeFileSystem>  { 
  public :
    std::vector<std::shared_ptr<CodeFile>> files;
    /* class constructor */ 
    CodeFileSystem( );
    /* instance methods */ 
    std::shared_ptr<CodeFile> getFile( std::string path , std::string name );
    void mkdir( std::string path );
    void saveTo( std::string path );
};
class CodeSlice : public std::enable_shared_from_this<CodeSlice>  { 
  public :
    std::string code;
    std::shared_ptr<CodeWriter> writer;
    /* class constructor */ 
    CodeSlice( );
    /* instance methods */ 
    std::string getCode();
};
class CodeWriter : public std::enable_shared_from_this<CodeWriter>  { 
  public :
    std::string tagName     /** note: unused */;
    std::string codeStr     /** note: unused */;
    std::string currentLine;
    std::string tabStr;
    int lineNumber     /** note: unused */;
    int indentAmount;
    std::map<std::string,bool> compiledTags;
    std::map<std::string,int> tags;
    std::vector<std::shared_ptr<CodeSlice>> slices;
    std::shared_ptr<CodeSlice> current_slice;
    std::shared_ptr<CodeFile> ownerFile;
    std::vector<std::shared_ptr<CodeWriter>> forks     /** note: unused */;
    int tagOffset     /** note: unused */;
    std::shared_ptr<CodeWriter> parent;
    bool had_nl     /** note: unused */;
    /* class constructor */ 
    CodeWriter( );
    /* instance methods */ 
    std::shared_ptr<CodeWriter> getFileWriter( std::string path , std::string fileName );
    std::vector<std::string> getImports();
    void addImport( std::string name );
    void indent( int delta );
    void addIndent();
    std::shared_ptr<CodeWriter> createTag( std::string name );
    std::shared_ptr<CodeWriter> getTag( std::string name );
    bool hasTag( std::string name );
    std::shared_ptr<CodeWriter> fork();
    void newline();
    void writeSlice( std::string str , bool newLine );
    void out( std::string str , bool newLine );
    void raw( std::string str , bool newLine );
    std::string getCode();
};
class RangerLispParser : public std::enable_shared_from_this<RangerLispParser>  { 
  public :
    std::shared_ptr<SourceCode> code;
    const char* buff;
    int __len;
    int i;
    std::vector<std::shared_ptr<CodeNode>> parents;
    std::shared_ptr<CodeNode> next     /** note: unused */;
    int paren_cnt;
    int get_op_pred     /** note: unused */;
    std::shared_ptr<CodeNode> rootNode;
    std::shared_ptr<CodeNode> curr_node;
    bool had_error;
    /* class constructor */ 
    RangerLispParser( std::shared_ptr<SourceCode> code_module  );
    /* instance methods */ 
    void joo( std::shared_ptr<SourceCode> cm );
    std::shared_ptr<CodeNode> parse_raw_annotation();
    bool skip_space( bool is_block_parent );
    bool end_expression();
    int getOperator();
    int isOperator();
    int getOperatorPred( std::string str );
    void insert_node( std::shared_ptr<CodeNode> p_node );
    void parse();
};
class RangerArgMatch : public std::enable_shared_from_this<RangerArgMatch>  { 
  public :
    std::map<std::string,std::string> matched;
    /* class constructor */ 
    RangerArgMatch( );
    /* instance methods */ 
    bool matchArguments( std::shared_ptr<CodeNode> args , std::shared_ptr<CodeNode> callArgs , std::shared_ptr<RangerAppWriterContext> ctx , int firstArgIndex );
    bool add( std::string tplKeyword , std::string typeName , std::shared_ptr<RangerAppWriterContext> ctx );
    bool doesDefsMatch( std::shared_ptr<CodeNode> arg , std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx );
    bool doesMatch( std::shared_ptr<CodeNode> arg , std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx );
    bool areEqualTypes( std::string type1 , std::string type2 , std::shared_ptr<RangerAppWriterContext> ctx );
    std::string getTypeName( std::string n );
    int getType( std::string n );
    bool setRvBasedOn( std::shared_ptr<CodeNode> arg , std::shared_ptr<CodeNode> node );
};
class ClassJoinPoint : public std::enable_shared_from_this<ClassJoinPoint>  { 
  public :
    std::shared_ptr<RangerAppClassDesc> class_def;
    std::shared_ptr<CodeNode> node;
    /* class constructor */ 
    ClassJoinPoint( );
};
class RangerFlowParser : public std::enable_shared_from_this<RangerFlowParser>  { 
  public :
    std::shared_ptr<CodeNode> stdCommands;
    std::shared_ptr<CodeNode> lastProcessedNode;
    std::vector<std::shared_ptr<CodeNode>> collectWalkAtEnd     /** note: unused */;
    std::vector<std::shared_ptr<CodeNode>> walkAlso;
    std::vector<std::shared_ptr<RangerAppClassDesc>> serializedClasses;
    std::vector<std::shared_ptr<ClassJoinPoint>> classesWithTraits;
    std::vector<std::shared_ptr<RangerAppClassDesc>> collectedIntefaces;
    std::map<std::string,bool> definedInterfaces     /** note: unused */;
    /* class constructor */ 
    RangerFlowParser( );
    /* instance methods */ 
    void cmdEnum( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr );
    void initStdCommands();
    std::shared_ptr<CodeNode> findLanguageOper( std::shared_ptr<CodeNode> details , std::shared_ptr<RangerAppWriterContext> ctx );
    std::shared_ptr<CodeNode> buildMacro( std::shared_ptr<CodeNode> langOper , std::shared_ptr<CodeNode> args , std::shared_ptr<RangerAppWriterContext> ctx );
    bool stdParamMatch( std::shared_ptr<CodeNode> callArgs , std::shared_ptr<RangerAppWriterContext> inCtx , std::shared_ptr<CodeWriter> wr );
    bool cmdImport( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr );
    std::string getThisName();
    void WriteThisVar( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr );
    void WriteVRef( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr );
    void CreateClass( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr );
    void DefineVar( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr );
    void WriteComment( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr );
    void cmdLog( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr );
    void cmdDoc( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr );
    void cmdGitDoc( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr );
    void cmdNative( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr );
    void LangInit( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr );
    std::string getWriterLang();
    void StartCodeWriting( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr );
    void Constructor( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr );
    void WriteScalarValue( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr );
    void buildGenericClass( std::shared_ptr<CodeNode> tpl , std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr );
    void cmdNew( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr );
    std::vector<std::shared_ptr<CodeNode>> transformParams( std::vector<std::shared_ptr<CodeNode>> list , std::vector<std::shared_ptr<RangerAppParamDesc>> fnArgs , std::shared_ptr<RangerAppWriterContext> ctx );
    bool cmdLocalCall( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr );
    void cmdReturn( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr );
    void cmdAssign( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr );
    void EnterTemplateClass( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr );
    void EnterClass( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr );
    void EnterMethod( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr );
    void EnterStaticMethod( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr );
    void EnterLambdaMethod( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr );
    void EnterVarDef( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr );
    void WalkNodeChildren( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr );
    bool matchNode( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr );
    void StartWalk( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr );
    bool WalkNode( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr );
    void mergeImports( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr );
    void CollectMethods( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr );
    void WalkCollectMethods( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr );
    void FindWeakRefs( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr );
    std::shared_ptr<RangerAppFunctionDesc> findFunctionDesc( std::shared_ptr<CodeNode> obj , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr );
    std::shared_ptr<RangerAppParamDesc> findParamDesc( std::shared_ptr<CodeNode> obj , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr );
    bool areEqualTypes( std::shared_ptr<CodeNode> n1 , std::shared_ptr<CodeNode> n2 , std::shared_ptr<RangerAppWriterContext> ctx );
    void shouldBeEqualTypes( std::shared_ptr<CodeNode> n1 , std::shared_ptr<CodeNode> n2 , std::shared_ptr<RangerAppWriterContext> ctx , std::string msg );
    void shouldBeExpression( std::shared_ptr<CodeNode> n1 , std::shared_ptr<RangerAppWriterContext> ctx , std::string msg );
    void shouldHaveChildCnt( int cnt , std::shared_ptr<CodeNode> n1 , std::shared_ptr<RangerAppWriterContext> ctx , std::string msg );
    void shouldBeNumeric( std::shared_ptr<CodeNode> n1 , std::shared_ptr<RangerAppWriterContext> ctx , std::string msg );
    void shouldBeArray( std::shared_ptr<CodeNode> n1 , std::shared_ptr<RangerAppWriterContext> ctx , std::string msg );
    void shouldBeType( std::string type_name , std::shared_ptr<CodeNode> n1 , std::shared_ptr<RangerAppWriterContext> ctx , std::string msg );
};
class NodeEvalState : public std::enable_shared_from_this<NodeEvalState>  { 
  public :
    std::shared_ptr<RangerAppWriterContext> ctx     /** note: unused */;
    bool is_running     /** note: unused */;
    int child_index     /** note: unused */;
    int cmd_index     /** note: unused */;
    bool is_ready     /** note: unused */;
    bool is_waiting     /** note: unused */;
    bool exit_after     /** note: unused */;
    bool expand_args     /** note: unused */;
    bool ask_expand     /** note: unused */;
    bool eval_rest     /** note: unused */;
    int exec_cnt     /** note: unused */;
    bool b_debugger     /** note: unused */;
    bool b_top_node     /** note: unused */;
    bool ask_eval     /** note: unused */;
    bool param_eval_on     /** note: unused */;
    int eval_index     /** note: unused */;
    int eval_end_index     /** note: unused */;
    int ask_eval_start     /** note: unused */;
    int ask_eval_end     /** note: unused */;
    std::shared_ptr<CodeNode> evaluating_cmd     /** note: unused */;
    /* class constructor */ 
    NodeEvalState( );
};
class RangerGenericClassWriter : public std::enable_shared_from_this<RangerGenericClassWriter>  { 
  public :
    std::shared_ptr<LiveCompiler> compiler;
    /* class constructor */ 
    RangerGenericClassWriter( );
    /* instance methods */ 
    virtual std::string EncodeString( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr );
    virtual void CustomOperator( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr );
    virtual void WriteSetterVRef( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr );
    virtual void writeArrayTypeDef( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr );
    virtual void WriteEnum( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr );
    virtual void WriteScalarValue( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr );
    virtual std::string getTypeString( std::string type_string );
    virtual void import_lib( std::string lib_name , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr );
    virtual std::string getObjectTypeString( std::string type_string , std::shared_ptr<RangerAppWriterContext> ctx );
    virtual void release_local_vars( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr );
    virtual void WalkNode( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr );
    virtual void writeTypeDef( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr );
    virtual void writeRawTypeDef( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr );
    virtual std::string adjustType( std::string tn );
    virtual void WriteVRef( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr );
    virtual void writeVarDef( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr );
    virtual void CreateLambdaCall( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr );
    virtual void CreateLambda( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr );
    virtual void writeFnCall( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr );
    virtual void writeNewCall( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr );
    virtual void writeInterface( std::shared_ptr<RangerAppClassDesc> cl , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr );
    virtual void disabledVarDef( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr );
    virtual void writeClass( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr );
};
class RangerJava7ClassWriter : public RangerGenericClassWriter { 
  public :
    std::shared_ptr<LiveCompiler> compiler     /** note: unused */;
    std::map<std::string,int> signatures;
    int signature_cnt;
    std::map<std::string,bool> iface_created;
    /* class constructor */ 
    RangerJava7ClassWriter( );
    /* instance methods */ 
    std::string getSignatureInterface( std::string s );
    std::string adjustType( std::string tn );
    std::string getObjectTypeString( std::string type_string , std::shared_ptr<RangerAppWriterContext> ctx );
    std::string getTypeString( std::string type_string );
    void writeTypeDef( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr );
    void WriteVRef( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr );
    void disabledVarDef( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr );
    void writeVarDef( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr );
    void writeArgsDef( std::shared_ptr<RangerAppFunctionDesc> fnDesc , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr );
    void CustomOperator( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr );
    std::string buildLambdaSignature( std::shared_ptr<CodeNode> node );
    void CreateLambdaCall( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr );
    void CreateLambda( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr );
    void writeClass( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> orig_wr );
};
class RangerSwift3ClassWriter : public RangerGenericClassWriter { 
  public :
    std::shared_ptr<LiveCompiler> compiler     /** note: unused */;
    bool header_created;
    /* class constructor */ 
    RangerSwift3ClassWriter( );
    /* instance methods */ 
    std::string adjustType( std::string tn );
    std::string getObjectTypeString( std::string type_string , std::shared_ptr<RangerAppWriterContext> ctx );
    std::string getTypeString( std::string type_string );
    void writeTypeDef( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr );
    void WriteEnum( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr );
    void WriteVRef( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr );
    void writeVarDef( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr );
    void writeArgsDef( std::shared_ptr<RangerAppFunctionDesc> fnDesc , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr );
    void writeFnCall( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr );
    void CreateLambdaCall( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr );
    void CreateLambda( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr );
    void writeNewCall( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr );
    bool haveSameSig( std::shared_ptr<RangerAppFunctionDesc> fn1 , std::shared_ptr<RangerAppFunctionDesc> fn2 , std::shared_ptr<RangerAppWriterContext> ctx );
    void writeClass( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr );
};
class RangerCppClassWriter : public RangerGenericClassWriter { 
  public :
    std::shared_ptr<LiveCompiler> compiler     /** note: unused */;
    bool header_created;
    /* class constructor */ 
    RangerCppClassWriter( );
    /* instance methods */ 
    std::string adjustType( std::string tn );
    void WriteScalarValue( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr );
    std::string getObjectTypeString( std::string type_string , std::shared_ptr<RangerAppWriterContext> ctx );
    std::string getTypeString2( std::string type_string , std::shared_ptr<RangerAppWriterContext> ctx );
    void writePtr( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr );
    void writeTypeDef( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr );
    void WriteVRef( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr );
    void writeVarDef( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr );
    void disabledVarDef( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr );
    void CustomOperator( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr );
    void CreateLambdaCall( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr );
    void CreateLambda( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr );
    void writeCppHeaderVar( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr , bool do_initialize );
    void writeArgsDef( std::shared_ptr<RangerAppFunctionDesc> fnDesc , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr );
    void writeFnCall( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr );
    void writeNewCall( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr );
    void writeClassHeader( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr );
    void writeClass( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> orig_wr );
};
class RangerKotlinClassWriter : public RangerGenericClassWriter { 
  public :
    std::shared_ptr<LiveCompiler> compiler     /** note: unused */;
    /* class constructor */ 
    RangerKotlinClassWriter( );
    /* instance methods */ 
    void WriteScalarValue( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr );
    std::string adjustType( std::string tn );
    std::string getObjectTypeString( std::string type_string , std::shared_ptr<RangerAppWriterContext> ctx );
    std::string getTypeString( std::string type_string );
    void writeTypeDef( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr );
    void WriteVRef( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr );
    void writeVarDef( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr );
    void writeArgsDef( std::shared_ptr<RangerAppFunctionDesc> fnDesc , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr );
    void writeFnCall( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr );
    void writeNewCall( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr );
    void writeClass( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> orig_wr );
};
class RangerCSharpClassWriter : public RangerGenericClassWriter { 
  public :
    std::shared_ptr<LiveCompiler> compiler     /** note: unused */;
    /* class constructor */ 
    RangerCSharpClassWriter( );
    /* instance methods */ 
    std::string adjustType( std::string tn );
    std::string getObjectTypeString( std::string type_string , std::shared_ptr<RangerAppWriterContext> ctx );
    std::string getTypeString( std::string type_string );
    void writeTypeDef( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr );
    void WriteVRef( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr );
    void writeVarDef( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr );
    void writeArgsDef( std::shared_ptr<RangerAppFunctionDesc> fnDesc , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr );
    void writeClass( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> orig_wr );
};
class RangerScalaClassWriter : public RangerGenericClassWriter { 
  public :
    std::shared_ptr<LiveCompiler> compiler     /** note: unused */;
    /* class constructor */ 
    RangerScalaClassWriter( );
    /* instance methods */ 
    std::string getObjectTypeString( std::string type_string , std::shared_ptr<RangerAppWriterContext> ctx );
    std::string getTypeString( std::string type_string );
    void writeTypeDef( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr );
    void writeTypeDefNoOption( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr );
    void WriteVRef( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr );
    void writeVarDef( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr );
    void writeArgsDef( std::shared_ptr<RangerAppFunctionDesc> fnDesc , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr );
    void writeClass( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> orig_wr );
};
class RangerGolangClassWriter : public RangerGenericClassWriter { 
  public :
    std::shared_ptr<LiveCompiler> compiler     /** note: unused */;
    std::string thisName;
    bool write_raw_type;
    bool did_write_nullable;
    /* class constructor */ 
    RangerGolangClassWriter( );
    /* instance methods */ 
    void WriteScalarValue( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr );
    std::string getObjectTypeString( std::string type_string , std::shared_ptr<RangerAppWriterContext> ctx );
    std::string getTypeString2( std::string type_string , std::shared_ptr<RangerAppWriterContext> ctx );
    void writeRawTypeDef( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr );
    void writeTypeDef( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr );
    void writeArrayTypeDef( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr );
    void writeTypeDef2( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr );
    void WriteVRef( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr );
    void WriteSetterVRef( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr );
    void goExtractAssign( std::shared_ptr<CodeNode> value , std::shared_ptr<RangerAppParamDesc> p , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr );
    void writeStructField( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr );
    void writeVarDef( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr );
    void writeArgsDef( std::shared_ptr<RangerAppFunctionDesc> fnDesc , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr );
    void writeNewCall( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr );
    void CreateLambdaCall( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr );
    void CreateLambda( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr );
    void CustomOperator( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr );
    void writeInterface( std::shared_ptr<RangerAppClassDesc> cl , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr );
    void writeClass( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> orig_wr );
};
class RangerPHPClassWriter : public RangerGenericClassWriter { 
  public :
    std::shared_ptr<LiveCompiler> compiler     /** note: unused */;
    std::string thisName;
    bool wrote_header;
    /* class constructor */ 
    RangerPHPClassWriter( );
    /* instance methods */ 
    std::string adjustType( std::string tn );
    std::string EncodeString( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr );
    void WriteScalarValue( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr );
    void WriteVRef( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr );
    void writeVarInitDef( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr );
    void writeVarDef( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr );
    void disabledVarDef( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr );
    void CreateLambdaCall( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr );
    void CreateLambda( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr );
    void writeClassVarDef( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr );
    void writeArgsDef( std::shared_ptr<RangerAppFunctionDesc> fnDesc , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr );
    void writeFnCall( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr );
    void writeNewCall( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr );
    void writeClass( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> orig_wr );
};
class RangerJavaScriptClassWriter : public RangerGenericClassWriter { 
  public :
    std::shared_ptr<LiveCompiler> compiler     /** note: unused */;
    std::string thisName     /** note: unused */;
    bool wrote_header;
    /* class constructor */ 
    RangerJavaScriptClassWriter( );
    /* instance methods */ 
    std::string adjustType( std::string tn );
    void WriteVRef( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr );
    void writeVarInitDef( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr );
    void writeVarDef( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr );
    void writeClassVarDef( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr );
    void writeArgsDef( std::shared_ptr<RangerAppFunctionDesc> fnDesc , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr );
    void writeClass( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> orig_wr );
};
class RangerRangerClassWriter : public RangerGenericClassWriter { 
  public :
    std::shared_ptr<LiveCompiler> compiler     /** note: unused */;
    /* class constructor */ 
    RangerRangerClassWriter( );
    /* instance methods */ 
    std::string adjustType( std::string tn );
    std::string getObjectTypeString( std::string type_string , std::shared_ptr<RangerAppWriterContext> ctx );
    std::string getTypeString( std::string type_string );
    void writeTypeDef( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr );
    void WriteVRef( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr );
    void WriteVRefWithOpt( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr );
    void writeVarDef( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr );
    void writeFnCall( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr );
    void writeNewCall( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr );
    void writeArgsDef( std::shared_ptr<RangerAppFunctionDesc> fnDesc , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr );
    void writeClass( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> orig_wr );
};
class LiveCompiler : public std::enable_shared_from_this<LiveCompiler>  { 
  public :
    std::shared_ptr<RangerGenericClassWriter> langWriter;
    std::map<std::string,bool> hasCreatedPolyfill     /** note: unused */;
    std::shared_ptr<CodeNode> lastProcessedNode;
    int repeat_index;
    /* class constructor */ 
    LiveCompiler( );
    /* instance methods */ 
    void initWriter( std::shared_ptr<RangerAppWriterContext> ctx );
    std::string EncodeString( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr );
    void WriteScalarValue( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr );
    std::string adjustType( std::string tn );
    void WriteVRef( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr );
    void writeTypeDef( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr );
    void CreateLambdaCall( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr );
    void CreateLambda( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr );
    std::string getTypeString( std::string str , std::shared_ptr<RangerAppWriterContext> ctx );
    void findOpCode( std::shared_ptr<CodeNode> op , std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr );
    std::shared_ptr<CodeNode> findOpTemplate( std::shared_ptr<CodeNode> op , std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr );
    bool localCall( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr );
    void WalkNode( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr );
    void walkCommandList( std::shared_ptr<CodeNode> cmd , std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr );
    void walkCommand( std::shared_ptr<CodeNode> cmd , std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr );
    void compile( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr );
    std::shared_ptr<RangerAppParamDesc> findParamDesc( std::shared_ptr<CodeNode> obj , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr );
};
class ColorConsole : public std::enable_shared_from_this<ColorConsole>  { 
  public :
    /* class constructor */ 
    ColorConsole( );
    /* instance methods */ 
    void out( std::string color , std::string str );
};
class DictNode : public std::enable_shared_from_this<DictNode>  { 
  public :
    bool is_property;
    bool is_property_value;
    std::string vref;
    int value_type;
    double double_value;
    int int_value;
    std::string string_value;
    bool boolean_value;
    std::shared_ptr<DictNode> object_value;
    std::vector<std::shared_ptr<DictNode>> children;
    std::map<std::string,std::shared_ptr<DictNode>> objects;
    std::vector<std::string> keys;
    /* class constructor */ 
    DictNode( );
    /* static methods */ 
    static std::shared_ptr<DictNode> createEmptyObject();
    static void tester();
    /* instance methods */ 
    std::string EncodeString( std::string orig_str );
    void addString( std::string key , std::string value );
    void addDouble( std::string key , double value );
    void addInt( std::string key , int value );
    void addBoolean( std::string key , bool value );
    std::shared_ptr<DictNode> addObject( std::string key );
    void setObject( std::string key , std::shared_ptr<DictNode> value );
    std::shared_ptr<DictNode> addArray( std::string key );
    void push( std::shared_ptr<DictNode> obj );
    double getDoubleAt( int index );
    std::string getStringAt( int index );
    int getIntAt( int index );
    bool getBooleanAt( int index );
    std::string getString( std::string key );
     r_optional_primitive<double>  getDouble( std::string key );
     r_optional_primitive<int>  getInt( std::string key );
    bool getBoolean( std::string key );
    std::shared_ptr<DictNode> getArray( std::string key );
    std::shared_ptr<DictNode> getArrayAt( int index );
    std::shared_ptr<DictNode> getObject( std::string key );
    std::shared_ptr<DictNode> getObjectAt( int index );
    std::string stringify();
};
class RangerSerializeClass : public std::enable_shared_from_this<RangerSerializeClass>  { 
  public :
    /* class constructor */ 
    RangerSerializeClass( );
    /* instance methods */ 
    bool isSerializedClass( std::string cName , std::shared_ptr<RangerAppWriterContext> ctx );
    void createWRWriter( std::shared_ptr<RangerAppParamDesc> pvar , std::shared_ptr<CodeNode> nn , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr );
    void createJSONSerializerFn( std::shared_ptr<RangerAppClassDesc> cl , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr );
};
class CompilerInterface : public std::enable_shared_from_this<CompilerInterface>  { 
  public :
    /* class constructor */ 
    CompilerInterface( );
    /* static methods */ 
    static void hello();
    static void displayCompilerErrors( std::shared_ptr<RangerAppWriterContext> appCtx );
    static void displayParserErrors( std::shared_ptr<RangerAppWriterContext> appCtx );
};


RangerAppTodo::RangerAppTodo( ) {
  this->description = std::string("");
}

RangerCompilerMessage::RangerCompilerMessage( ) {
  this->error_level = 0;
  this->code_line = 0;
  this->fileName = std::string("");
  this->description = std::string("");
}

RangerParamEventHandler::RangerParamEventHandler( ) {
}

void  RangerParamEventHandler::callback( std::shared_ptr<RangerAppParamDesc> param ) {
}

RangerParamEventList::RangerParamEventList( ) {
}

RangerParamEventMap::RangerParamEventMap( ) {
}

void  RangerParamEventMap::clearAllEvents() {
}

void  RangerParamEventMap::addEvent( std::string name , std::shared_ptr<RangerParamEventHandler> e ) {
  if ( (events.count(name)) == false ) {
    events[name] =  std::make_shared<RangerParamEventList>();
  }
  std::shared_ptr<RangerParamEventList> list = (events[name]);
  list->list.push_back( e  );
}

void  RangerParamEventMap::fireEvent( std::string name , std::shared_ptr<RangerAppParamDesc> from ) {
  if ( events.count(name) ) {
    std::shared_ptr<RangerParamEventList> list = (events[name]);
    for ( std::vector< std::shared_ptr<RangerParamEventHandler>>::size_type i = 0; i != list->list.size(); i++) {
      std::shared_ptr<RangerParamEventHandler> ev = list->list.at(i);
      ev->callback(from);
    }
  }
}

RangerAppArrayValue::RangerAppArrayValue( ) {
  this->value_type = 0;
  this->value_type_name = std::string("");
}

RangerAppHashValue::RangerAppHashValue( ) {
  this->value_type = 0;
  this->key_type_name = std::string("");
  this->value_type_name = std::string("");
}

RangerAppValue::RangerAppValue( ) {
  this->double_value = 0;
  this->string_value = std::string("");
  this->int_value = 0;
  this->boolean_value = false;
}

RangerRefForce::RangerRefForce( ) {
  this->strength = 0;
  this->lifetime = 1;
}

RangerAppParamDesc::RangerAppParamDesc( ) {
  this->name = std::string("");
  this->compiledName = std::string("");
  this->debugString = std::string("");
  this->ref_cnt = 0;
  this->init_cnt = 0;
  this->set_cnt = 0;
  this->return_cnt = 0;
  this->prop_assign_cnt = 0;
  this->value_type = 0;
  this->has_default = false;
  this->isThis = false;
  this->varType = 0;
  this->refType = 0;
  this->initRefType = 0;
  this->paramIndex = 0;
  this->is_optional = false;
  this->is_mutating = false;
  this->is_set = false;
  this->is_class_variable = false;
  this->is_captured = false;
  this->description = std::string("");
  this->git_doc = std::string("");
  this->has_events = false;
}

void  RangerAppParamDesc::addEvent( std::string name , std::shared_ptr<RangerParamEventHandler> e ) {
  if ( has_events == false ) {
    eMap  =  std::make_shared<RangerParamEventMap>();
    has_events = true;
  }
  eMap->addEvent(name, e);
}

void  RangerAppParamDesc::changeStrength( int newStrength , int lifeTime , std::shared_ptr<CodeNode> changer ) {
  std::shared_ptr<RangerRefForce> entry =  std::make_shared<RangerRefForce>();
  entry->strength = newStrength;
  entry->lifetime = lifeTime;
  entry->changer  = changer;
  ownerHistory.push_back( entry  );
}

bool  RangerAppParamDesc::isProperty() {
  return true;
}

bool  RangerAppParamDesc::isClass() {
  return false;
}

bool  RangerAppParamDesc::doesInherit() {
  return false;
}

bool  RangerAppParamDesc::isAllocatedType() {
  if ( nameNode != NULL  ) {
    if ( nameNode->eval_type != 0 ) {
      if ( nameNode->eval_type == 6 ) {
        return true;
      }
      if ( nameNode->eval_type == 7 ) {
        return true;
      }
      if ( (((((nameNode->eval_type == 13) || (nameNode->eval_type == 12)) || (nameNode->eval_type == 4)) || (nameNode->eval_type == 2)) || (nameNode->eval_type == 5)) || (nameNode->eval_type == 3) ) {
        return false;
      }
      if ( nameNode->eval_type == 11 ) {
        return false;
      }
      return true;
    }
    if ( nameNode->eval_type == 11 ) {
      return false;
    }
    if ( nameNode->value_type == 9 ) {
      if ( false == nameNode->isPrimitive() ) {
        return true;
      }
    }
    if ( nameNode->value_type == 6 ) {
      return true;
    }
    if ( nameNode->value_type == 7 ) {
      return true;
    }
  }
  return false;
}

void  RangerAppParamDesc::moveRefTo( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppParamDesc> target , std::shared_ptr<RangerAppWriterContext> ctx ) {
  if ( node->ref_change_done ) {
    return;
  }
  if ( false == target->isAllocatedType() ) {
    return;
  }
  if ( false == this->isAllocatedType() ) {
    return;
  }
  node->ref_change_done = true;
  int other_s = target->getStrength();
  int my_s = this->getStrength();
  int my_lifetime = this->getLifetime();
  int other_lifetime = target->getLifetime();
  bool a_lives = false;
  bool b_lives = false;
  bool tmp_var = nameNode->hasFlag(std::string("temp"));
  if ( target->nameNode != NULL  ) {
    if ( target->nameNode->hasFlag(std::string("lives")) ) {
      my_lifetime = 2;
      b_lives = true;
    }
  }
  if ( nameNode != NULL  ) {
    if ( nameNode->hasFlag(std::string("lives")) ) {
      my_lifetime = 2;
      a_lives = true;
    }
  }
  if ( other_s > 0 ) {
    if ( my_s == 1 ) {
      int lt = my_lifetime;
      if ( other_lifetime > my_lifetime ) {
        lt = other_lifetime;
      }
      this->changeStrength(0, lt, node);
    } else {
      if ( my_s == 0 ) {
        if ( tmp_var == false ) {
          ctx->addError(node, std::string("Can not move a weak reference to a strong target, at ") + node->getCode());
          std::cout << std::string("can not move weak refs to strong target:") << std::endl;
          this->debugRefChanges();
        }
      } else {
        ctx->addError(node, std::string("Can not move immutable reference to a strong target, evald type ") + nameNode->eval_type_name);
      }
    }
  } else {
    if ( a_lives || b_lives ) {
    } else {
      if ( (my_lifetime < other_lifetime) && (return_cnt == 0) ) {
        if ( nameNode->hasFlag(std::string("returnvalue")) == false ) {
          ctx->addError(node, std::string("Can not create a weak reference if target has longer lifetime than original, current lifetime == ") + std::to_string(my_lifetime));
        }
      }
    }
  }
}

int  RangerAppParamDesc::originalStrength() {
  int __len = ownerHistory.size();
  if ( __len > 0 ) {
    std::shared_ptr<RangerRefForce> firstEntry = ownerHistory.at(0);
    return firstEntry->strength;
  }
  return 1;
}

int  RangerAppParamDesc::getLifetime() {
  int __len = ownerHistory.size();
  if ( __len > 0 ) {
    std::shared_ptr<RangerRefForce> lastEntry = ownerHistory.at((__len - 1));
    return lastEntry->lifetime;
  }
  return 1;
}

int  RangerAppParamDesc::getStrength() {
  int __len = ownerHistory.size();
  if ( __len > 0 ) {
    std::shared_ptr<RangerRefForce> lastEntry = ownerHistory.at((__len - 1));
    return lastEntry->strength;
  }
  return 1;
}

void  RangerAppParamDesc::debugRefChanges() {
  std::cout << (std::string("variable ") + name) + std::string(" ref history : ") << std::endl;
  for ( std::vector< std::shared_ptr<RangerRefForce>>::size_type i = 0; i != ownerHistory.size(); i++) {
    std::shared_ptr<RangerRefForce> h = ownerHistory.at(i);
    std::cout << ((std::string(" => change to ") + std::to_string(h->strength)) + std::string(" by ")) + h->changer->getCode() << std::endl;
  }
}

bool  RangerAppParamDesc::pointsToObject( std::shared_ptr<RangerAppWriterContext> ctx ) {
  if ( nameNode != NULL  ) {
    bool is_primitive = false;
    bool caseMatched = false;
    if( nameNode->array_type == std::string("string")) {
      caseMatched = true;
      is_primitive = true;
    }
    if( nameNode->array_type == std::string("int")) {
      caseMatched = true;
      is_primitive = true;
    }
    if( nameNode->array_type == std::string("boolean")) {
      caseMatched = true;
      is_primitive = true;
    }
    if( nameNode->array_type == std::string("double")) {
      caseMatched = true;
      is_primitive = true;
    }
    if ( is_primitive ) {
      return false;
    }
    if ( (nameNode->value_type == 6) || (nameNode->value_type == 7) ) {
      bool is_object = true;
      bool caseMatched_2 = false;
      if( nameNode->array_type == std::string("string")) {
        caseMatched_2 = true;
        is_object = false;
      }
      if( nameNode->array_type == std::string("int")) {
        caseMatched_2 = true;
        is_object = false;
      }
      if( nameNode->array_type == std::string("boolean")) {
        caseMatched_2 = true;
        is_object = false;
      }
      if( nameNode->array_type == std::string("double")) {
        caseMatched_2 = true;
        is_object = false;
      }
      return is_object;
    }
    if ( nameNode->value_type == 9 ) {
      bool is_object_1 = true;
      bool caseMatched_3 = false;
      if( nameNode->type_name == std::string("string")) {
        caseMatched_3 = true;
        is_object_1 = false;
      }
      if( nameNode->type_name == std::string("int")) {
        caseMatched_3 = true;
        is_object_1 = false;
      }
      if( nameNode->type_name == std::string("boolean")) {
        caseMatched_3 = true;
        is_object_1 = false;
      }
      if( nameNode->type_name == std::string("double")) {
        caseMatched_3 = true;
        is_object_1 = false;
      }
      if ( ctx->isEnumDefined(nameNode->type_name) ) {
        return false;
      }
      return is_object_1;
    }
  }
  return false;
}

bool  RangerAppParamDesc::isObject() {
  if ( nameNode != NULL  ) {
    if ( nameNode->value_type == 9 ) {
      if ( false == nameNode->isPrimitive() ) {
        return true;
      }
    }
  }
  return false;
}

bool  RangerAppParamDesc::isArray() {
  if ( nameNode != NULL  ) {
    if ( nameNode->value_type == 6 ) {
      return true;
    }
  }
  return false;
}

bool  RangerAppParamDesc::isHash() {
  if ( nameNode != NULL  ) {
    if ( nameNode->value_type == 7 ) {
      return true;
    }
  }
  return false;
}

bool  RangerAppParamDesc::isPrimitive() {
  if ( nameNode != NULL  ) {
    return nameNode->isPrimitive();
  }
  return false;
}

std::string  RangerAppParamDesc::getRefTypeName() {
  switch (refType ) { 
    case 0 : 
      {
        return std::string("NoType");
        break;
      }
    case 1 : 
      {
        return std::string("Weak");
        break;
      }
  }
  return std::string("");
}

std::string  RangerAppParamDesc::getVarTypeName() {
  switch (refType ) { 
    case 0 : 
      {
        return std::string("NoType");
        break;
      }
    case 1 : 
      {
        return std::string("This");
        break;
      }
  }
  return std::string("");
}

std::string  RangerAppParamDesc::getTypeName() {
  std::string s = nameNode->type_name;
  return s;
}

RangerAppFunctionDesc::RangerAppFunctionDesc( ) {
  this->name = std::string("");
  this->ref_cnt = 0;
  this->is_method = false;
  this->is_static = false;
  this->refType = 0;
}

bool  RangerAppFunctionDesc::isClass() {
  return false;
}

bool  RangerAppFunctionDesc::isProperty() {
  return false;
}

RangerAppMethodVariants::RangerAppMethodVariants( ) {
  this->name = std::string("");
}

RangerAppInterfaceImpl::RangerAppInterfaceImpl( ) {
  this->name = std::string("");
}

RangerAppClassDesc::RangerAppClassDesc( ) {
  this->name = std::string("");
  this->is_system = false;
  this->compiledName = std::string("");
  this->is_interface = false;
  this->is_system_union = false;
  this->is_template = false;
  this->is_serialized = false;
  this->is_trait = false;
  this->has_constructor = false;
  this->has_destructor = false;
  this->is_inherited = false;
}

bool  RangerAppClassDesc::isClass() {
  return true;
}

bool  RangerAppClassDesc::isProperty() {
  return false;
}

bool  RangerAppClassDesc::doesInherit() {
  return is_inherited;
}

bool  RangerAppClassDesc::isSameOrParentClass( std::string class_name , std::shared_ptr<RangerAppWriterContext> ctx ) {
  if ( ctx->isPrimitiveType(class_name) ) {
    if ( (r_arr_index_of<std::string>(is_union_of, class_name)) >= 0 ) {
      return true;
    }
    return false;
  }
  if ( class_name == name ) {
    return true;
  }
  if ( (r_arr_index_of<std::string>(extends_classes, class_name)) >= 0 ) {
    return true;
  }
  if ( (r_arr_index_of<std::string>(consumes_traits, class_name)) >= 0 ) {
    return true;
  }
  if ( (r_arr_index_of<std::string>(implements_interfaces, class_name)) >= 0 ) {
    return true;
  }
  if ( (r_arr_index_of<std::string>(is_union_of, class_name)) >= 0 ) {
    return true;
  }
  for ( std::vector< std::string>::size_type i = 0; i != extends_classes.size(); i++) {
    std::string c_name = extends_classes.at(i);
    std::shared_ptr<RangerAppClassDesc> c = ctx->findClass(c_name);
    if ( c->isSameOrParentClass(class_name, ctx) ) {
      return true;
    }
  }
  for ( std::vector< std::string>::size_type i_1 = 0; i_1 != consumes_traits.size(); i_1++) {
    std::string c_name_1 = consumes_traits.at(i_1);
    std::shared_ptr<RangerAppClassDesc> c_1 = ctx->findClass(c_name_1);
    if ( c_1->isSameOrParentClass(class_name, ctx) ) {
      return true;
    }
  }
  for ( std::vector< std::string>::size_type i_2 = 0; i_2 != implements_interfaces.size(); i_2++) {
    std::string i_name = implements_interfaces.at(i_2);
    std::shared_ptr<RangerAppClassDesc> c_2 = ctx->findClass(i_name);
    if ( c_2->isSameOrParentClass(class_name, ctx) ) {
      return true;
    }
  }
  for ( std::vector< std::string>::size_type i_3 = 0; i_3 != is_union_of.size(); i_3++) {
    std::string i_name_1 = is_union_of.at(i_3);
    if ( this->isSameOrParentClass(i_name_1, ctx) ) {
      return true;
    }
    if ( ctx->isDefinedClass(i_name_1) ) {
      std::shared_ptr<RangerAppClassDesc> c_3 = ctx->findClass(i_name_1);
      if ( c_3->isSameOrParentClass(class_name, ctx) ) {
        return true;
      }
    } else {
      std::cout << std::string("did not find union class ") + i_name_1 << std::endl;
    }
  }
  return false;
}

bool  RangerAppClassDesc::hasOwnMethod( std::string m_name ) {
  if ( defined_methods.count(m_name) ) {
    return true;
  }
  return false;
}

bool  RangerAppClassDesc::hasMethod( std::string m_name ) {
  if ( defined_methods.count(m_name) ) {
    return true;
  }
  for ( std::vector< std::string>::size_type i = 0; i != extends_classes.size(); i++) {
    std::string cname = extends_classes.at(i);
    std::shared_ptr<RangerAppClassDesc> cDesc = ctx->findClass(cname);
    if ( cDesc->hasMethod(m_name) ) {
      return cDesc->hasMethod(m_name);
    }
  }
  return false;
}

std::shared_ptr<RangerAppFunctionDesc>  RangerAppClassDesc::findMethod( std::string f_name ) {
  std::shared_ptr<RangerAppFunctionDesc> res;
  for ( std::vector< std::shared_ptr<RangerAppFunctionDesc>>::size_type i = 0; i != methods.size(); i++) {
    std::shared_ptr<RangerAppFunctionDesc> m = methods.at(i);
    if ( m->name == f_name ) {
      res  = m;
      return res;
    }
  }
  for ( std::vector< std::string>::size_type i_1 = 0; i_1 != extends_classes.size(); i_1++) {
    std::string cname = extends_classes.at(i_1);
    std::shared_ptr<RangerAppClassDesc> cDesc = ctx->findClass(cname);
    if ( cDesc->hasMethod(f_name) ) {
      return cDesc->findMethod(f_name);
    }
  }
  return res;
}

bool  RangerAppClassDesc::hasStaticMethod( std::string m_name ) {
  return defined_static_methods.count(m_name);
}

std::shared_ptr<RangerAppFunctionDesc>  RangerAppClassDesc::findStaticMethod( std::string f_name ) {
  std::shared_ptr<RangerAppFunctionDesc> e;
  for ( std::vector< std::shared_ptr<RangerAppFunctionDesc>>::size_type i = 0; i != static_methods.size(); i++) {
    std::shared_ptr<RangerAppFunctionDesc> m = static_methods.at(i);
    if ( m->name == f_name ) {
      e  = m;
      return e;
    }
  }
  for ( std::vector< std::string>::size_type i_1 = 0; i_1 != extends_classes.size(); i_1++) {
    std::string cname = extends_classes.at(i_1);
    std::shared_ptr<RangerAppClassDesc> cDesc = ctx->findClass(cname);
    if ( cDesc->hasStaticMethod(f_name) ) {
      return cDesc->findStaticMethod(f_name);
    }
  }
  return e;
}

std::shared_ptr<RangerAppParamDesc>  RangerAppClassDesc::findVariable( std::string f_name ) {
  std::shared_ptr<RangerAppParamDesc> e;
  for ( std::vector< std::shared_ptr<RangerAppParamDesc>>::size_type i = 0; i != variables.size(); i++) {
    std::shared_ptr<RangerAppParamDesc> m = variables.at(i);
    if ( m->name == f_name ) {
      e  = m;
      return e;
    }
  }
  for ( std::vector< std::string>::size_type i_1 = 0; i_1 != extends_classes.size(); i_1++) {
    std::string cname = extends_classes.at(i_1);
    std::shared_ptr<RangerAppClassDesc> cDesc = ctx->findClass(cname);
    return cDesc->findVariable(f_name);
  }
  return e;
}

void  RangerAppClassDesc::addParentClass( std::string p_name ) {
  extends_classes.push_back( p_name  );
}

void  RangerAppClassDesc::addVariable( std::shared_ptr<RangerAppParamDesc> desc ) {
  variables.push_back( desc  );
}

void  RangerAppClassDesc::addMethod( std::shared_ptr<RangerAppFunctionDesc> desc ) {
  defined_methods[desc->name] = true;
  methods.push_back( desc  );
  std::shared_ptr<RangerAppMethodVariants> defVs = method_variants[desc->name];
  if ( defVs == NULL ) {
    std::shared_ptr<RangerAppMethodVariants> new_v =  std::make_shared<RangerAppMethodVariants>();
    method_variants[desc->name] = new_v;
    defined_variants.push_back( desc->name  );
    new_v->variants.push_back( desc  );
  } else {
    std::shared_ptr<RangerAppMethodVariants> new_v2 = defVs;
    new_v2->variants.push_back( desc  );
  }
}

void  RangerAppClassDesc::addStaticMethod( std::shared_ptr<RangerAppFunctionDesc> desc ) {
  defined_static_methods[desc->name] = true;
  static_methods.push_back( desc  );
}

RangerTypeClass::RangerTypeClass( ) {
  this->name = std::string("");
  this->compiledName = std::string("");
  this->value_type = 0;
  this->is_primitive = false;
  this->is_mutable = false;
  this->is_optional = false;
  this->is_generic = false;
  this->is_lambda = false;
}

SourceCode::SourceCode( std::string code_str  ) {
  this->code = std::string("");
  this->filename = std::string("");
  code = code_str;
  lines = r_str_split( code_str, std::string("\n"));
}

std::string  SourceCode::getLineString( int line_index ) {
  if ( (lines.size()) > line_index ) {
    return lines.at(line_index);
  }
  return std::string("");
}

int  SourceCode::getLine( int sp ) {
  int cnt = 0;
  for ( std::vector< std::string>::size_type i = 0; i != lines.size(); i++) {
    std::string str = lines.at(i);
    cnt = cnt + ((str.length()) + 1);
    if ( cnt > sp ) {
      return i;
    }
  }
  return -1;
}

std::string  SourceCode::getColumnStr( int sp ) {
  int cnt = 0;
  int last = 0;
  for ( std::vector< std::string>::size_type i = 0; i != lines.size(); i++) {
    std::string str = lines.at(i);
    cnt = cnt + ((str.length()) + 1);
    if ( cnt > sp ) {
      int ll = sp - last;
      std::string ss = std::string("");
      while (ll > 0) {
        ss = ss + std::string(" ");
        ll = ll - 1;
      }
      return ss;
    }
    last = cnt;
  }
  return std::string("");
}

int  SourceCode::getColumn( int sp ) {
  int cnt = 0;
  int last = 0;
  for ( std::vector< std::string>::size_type i = 0; i != lines.size(); i++) {
    std::string str = lines.at(i);
    cnt = cnt + ((str.length()) + 1);
    if ( cnt > sp ) {
      return sp - last;
    }
    last = cnt;
  }
  return -1;
}

CodeNode::CodeNode( std::shared_ptr<SourceCode> source , int start , int end  ) {
  this->sp = 0;
  this->ep = 0;
  this->has_operator = false;
  this->disabled_node = false;
  this->op_index = 0;
  this->is_system_class = false;
  this->mutable_def = false;
  this->expression = false;
  this->vref = std::string("");
  this->is_block_node = false;
  this->infix_operator = false;
  this->infix_subnode = false;
  this->has_lambda = false;
  this->has_lambda_call = false;
  this->operator_pred = 0;
  this->to_the_right = false;
  this->type_type = std::string("");
  this->type_name = std::string("");
  this->key_type = std::string("");
  this->array_type = std::string("");
  this->has_vref_annotation = false;
  this->has_type_annotation = false;
  this->parsed_type = 0;
  this->value_type = 0;
  this->ref_type = 0;
  this->ref_need_assign = 0;
  this->double_value = 0;
  this->string_value = std::string("");
  this->int_value = 0;
  this->boolean_value = false;
  this->eval_type = 0;
  this->eval_type_name = std::string("");
  this->eval_key_type = std::string("");
  this->eval_array_type = std::string("");
  this->flow_done = false;
  this->ref_change_done = false;
  this->didReturnAtIndex = -1;
  this->hasVarDef = false;
  this->hasClassDescription = false;
  this->hasNewOper = false;
  this->hasFnCall = false;
  this->hasParamDesc = false;
  sp = start;
  ep = end;
  code  = source;
}

std::string  CodeNode::getParsedString() {
  return code->code.substr(sp, ep - sp);
}

std::string  CodeNode::getFilename() {
  return code->filename;
}

std::shared_ptr<CodeNode>  CodeNode::getFlag( std::string flagName ) {
  std::shared_ptr<CodeNode> res;
  if ( false == has_vref_annotation ) {
    return res;
  }
  for ( std::vector< std::shared_ptr<CodeNode>>::size_type i = 0; i != vref_annotation->children.size(); i++) {
    std::shared_ptr<CodeNode> ch = vref_annotation->children.at(i);
    if ( ch->vref == flagName ) {
      res  = ch;
      return res;
    }
  }
  return res;
}

bool  CodeNode::hasFlag( std::string flagName ) {
  if ( false == has_vref_annotation ) {
    return false;
  }
  for ( std::vector< std::shared_ptr<CodeNode>>::size_type i = 0; i != vref_annotation->children.size(); i++) {
    std::shared_ptr<CodeNode> ch = vref_annotation->children.at(i);
    if ( ch->vref == flagName ) {
      return true;
    }
  }
  return false;
}

void  CodeNode::setFlag( std::string flagName ) {
  if ( false == has_vref_annotation ) {
    vref_annotation  =  std::make_shared<CodeNode>(code, sp, ep);
  }
  if ( this->hasFlag(flagName) ) {
    return;
  }
  std::shared_ptr<CodeNode> flag =  std::make_shared<CodeNode>(code, sp, ep);
  flag->vref = flagName;
  flag->value_type = 9;
  vref_annotation->children.push_back( flag  );
  has_vref_annotation = true;
}

std::string  CodeNode::getTypeInformationString() {
  std::string s = std::string("");
  if ( (vref.length()) > 0 ) {
    s = ((s + std::string("<vref:")) + vref) + std::string(">");
  } else {
    s = s + std::string("<no.vref>");
  }
  if ( (type_name.length()) > 0 ) {
    s = ((s + std::string("<type_name:")) + type_name) + std::string(">");
  } else {
    s = s + std::string("<no.type_name>");
  }
  if ( (array_type.length()) > 0 ) {
    s = ((s + std::string("<array_type:")) + array_type) + std::string(">");
  } else {
    s = s + std::string("<no.array_type>");
  }
  if ( (key_type.length()) > 0 ) {
    s = ((s + std::string("<key_type:")) + key_type) + std::string(">");
  } else {
    s = s + std::string("<no.key_type>");
  }
  switch (value_type ) { 
    case 5 : 
      {
        s = s + std::string("<value_type=Boolean>");
        break;
      }
    case 4 : 
      {
        s = s + std::string("<value_type=String>");
        break;
      }
  }
  return s;
}

int  CodeNode::getLine() {
  return code->getLine(sp);
}

std::string  CodeNode::getLineString( int line_index ) {
  return code->getLineString(line_index);
}

std::string  CodeNode::getColStartString() {
  return code->getColumnStr(sp);
}

std::string  CodeNode::getLineAsString() {
  int idx = this->getLine();
  int line_name_idx = idx + 1;
  return (((this->getFilename() + std::string(", line ")) + std::to_string(line_name_idx)) + std::string(" : ")) + code->getLineString(idx);
}

std::string  CodeNode::getPositionalString() {
  if ( (ep > sp) && ((ep - sp) < 50) ) {
    int start = sp;
    int end = ep;
    start = start - 100;
    end = end + 50;
    if ( start < 0 ) {
      start = 0;
    }
    if ( end >= (code->code.length()) ) {
      end = (code->code.length()) - 1;
    }
    return code->code.substr(start, end - start);
  }
  return std::string("");
}

bool  CodeNode::isParsedAsPrimitive() {
  if ( (((((parsed_type == 2) || (parsed_type == 4)) || (parsed_type == 3)) || (parsed_type == 12)) || (parsed_type == 13)) || (parsed_type == 5) ) {
    return true;
  }
  return false;
}

bool  CodeNode::isPrimitive() {
  if ( (((((value_type == 2) || (value_type == 4)) || (value_type == 3)) || (value_type == 12)) || (value_type == 13)) || (value_type == 5) ) {
    return true;
  }
  return false;
}

bool  CodeNode::isPrimitiveType() {
  std::string tn = type_name;
  if ( (((((tn == std::string("double")) || (tn == std::string("string"))) || (tn == std::string("int"))) || (tn == std::string("char"))) || (tn == std::string("charbuffer"))) || (tn == std::string("boolean")) ) {
    return true;
  }
  return false;
}

bool  CodeNode::isAPrimitiveType() {
  std::string tn = type_name;
  if ( (value_type == 6) || (value_type == 7) ) {
    tn = array_type;
  }
  if ( (((((tn == std::string("double")) || (tn == std::string("string"))) || (tn == std::string("int"))) || (tn == std::string("char"))) || (tn == std::string("charbuffer"))) || (tn == std::string("boolean")) ) {
    return true;
  }
  return false;
}

std::shared_ptr<CodeNode>  CodeNode::getFirst() {
  return children.at(0);
}

std::shared_ptr<CodeNode>  CodeNode::getSecond() {
  return children.at(1);
}

std::shared_ptr<CodeNode>  CodeNode::getThird() {
  return children.at(2);
}

bool  CodeNode::isSecondExpr() {
  if ( (children.size()) > 1 ) {
    std::shared_ptr<CodeNode> second = children.at(1);
    if ( second->expression ) {
      return true;
    }
  }
  return false;
}

std::string  CodeNode::getOperator() {
  std::string s = std::string("");
  if ( (children.size()) > 0 ) {
    std::shared_ptr<CodeNode> fc = children.at(0);
    if ( fc->value_type == 9 ) {
      return fc->vref;
    }
  }
  return s;
}

std::string  CodeNode::getVRefAt( int idx ) {
  std::string s = std::string("");
  if ( (children.size()) > idx ) {
    std::shared_ptr<CodeNode> fc = children.at(idx);
    return fc->vref;
  }
  return s;
}

std::string  CodeNode::getStringAt( int idx ) {
  std::string s = std::string("");
  if ( (children.size()) > idx ) {
    std::shared_ptr<CodeNode> fc = children.at(idx);
    if ( fc->value_type == 4 ) {
      return fc->string_value;
    }
  }
  return s;
}

bool  CodeNode::hasExpressionProperty( std::string name ) {
  std::shared_ptr<CodeNode> ann = props[name];
  if ( ann != NULL  ) {
    return ann->expression;
  }
  return false;
}

std::shared_ptr<CodeNode>  CodeNode::getExpressionProperty( std::string name ) {
  std::shared_ptr<CodeNode> ann = props[name];
  if ( ann != NULL  ) {
    return ann;
  }
  return ann;
}

bool  CodeNode::hasIntProperty( std::string name ) {
  std::shared_ptr<CodeNode> ann = props[name];
  if ( ann != NULL  ) {
    std::shared_ptr<CodeNode> fc = ann->children.at(0);
    if ( fc->value_type == 3 ) {
      return true;
    }
  }
  return false;
}

int  CodeNode::getIntProperty( std::string name ) {
  std::shared_ptr<CodeNode> ann = props[name];
  if ( ann != NULL  ) {
    std::shared_ptr<CodeNode> fc = ann->children.at(0);
    if ( fc->value_type == 3 ) {
      return fc->int_value;
    }
  }
  return 0;
}

bool  CodeNode::hasDoubleProperty( std::string name ) {
  std::shared_ptr<CodeNode> ann = props[name];
  if ( ann != NULL  ) {
    if ( ann->value_type == 2 ) {
      return true;
    }
  }
  return false;
}

double  CodeNode::getDoubleProperty( std::string name ) {
  std::shared_ptr<CodeNode> ann = props[name];
  if ( ann != NULL  ) {
    if ( ann->value_type == 2 ) {
      return ann->double_value;
    }
  }
  return 0;
}

bool  CodeNode::hasStringProperty( std::string name ) {
  if ( false == (props.count(name)) ) {
    return false;
  }
  std::shared_ptr<CodeNode> ann = props[name];
  if ( ann != NULL  ) {
    if ( ann->value_type == 4 ) {
      return true;
    }
  }
  return false;
}

std::string  CodeNode::getStringProperty( std::string name ) {
  std::shared_ptr<CodeNode> ann = props[name];
  if ( ann != NULL  ) {
    if ( ann->value_type == 4 ) {
      return ann->string_value;
    }
  }
  return std::string("");
}

bool  CodeNode::hasBooleanProperty( std::string name ) {
  std::shared_ptr<CodeNode> ann = props[name];
  if ( ann != NULL  ) {
    if ( ann->value_type == 5 ) {
      return true;
    }
  }
  return false;
}

bool  CodeNode::getBooleanProperty( std::string name ) {
  std::shared_ptr<CodeNode> ann = props[name];
  if ( ann != NULL  ) {
    if ( ann->value_type == 5 ) {
      return ann->boolean_value;
    }
  }
  return false;
}

bool  CodeNode::isFirstTypeVref( std::string vrefName ) {
  if ( (children.size()) > 0 ) {
    std::shared_ptr<CodeNode> fc = children.at(0);
    if ( fc->value_type == 9 ) {
      return true;
    }
  }
  return false;
}

bool  CodeNode::isFirstVref( std::string vrefName ) {
  if ( (children.size()) > 0 ) {
    std::shared_ptr<CodeNode> fc = children.at(0);
    if ( fc->vref == vrefName ) {
      return true;
    }
  }
  return false;
}

std::string  CodeNode::getString() {
  return code->code.substr(sp, ep - sp);
}

void  CodeNode::walk() {
  switch (value_type ) { 
    case 2 : 
      {
        std::cout << std::string("Double : ") + std::to_string(double_value) << std::endl;
        break;
      }
    case 4 : 
      {
        std::cout << std::string("String : ") + string_value << std::endl;
        break;
      }
  }
  if ( expression ) {
    std::cout << std::string("(") << std::endl;
  } else {
    std::cout << code->code.substr(sp, ep - sp) << std::endl;
  }
  for ( std::vector< std::shared_ptr<CodeNode>>::size_type i = 0; i != children.size(); i++) {
    std::shared_ptr<CodeNode> item = children.at(i);
    item->walk();
  }
  if ( expression ) {
    std::cout << std::string(")") << std::endl;
  }
}

void  CodeNode::writeCode( std::shared_ptr<CodeWriter> wr ) {
  switch (value_type ) { 
    case 2 : 
      {
        wr->out(std::to_string(double_value), false);
        break;
      }
    case 4 : 
      {
        wr->out(((std::string(1, char(34))) + string_value) + (std::string(1, char(34))), false);
        break;
      }
    case 3 : 
      {
        wr->out(std::string("") + std::to_string(int_value), false);
        break;
      }
    case 5 : 
      {
        if ( boolean_value ) {
          wr->out(std::string("true"), false);
        } else {
          wr->out(std::string("false"), false);
        }
        break;
      }
    case 9 : 
      {
        wr->out(vref, false);
        break;
      }
    case 7 : 
      {
        wr->out(vref, false);
        wr->out((((std::string(":[") + key_type) + std::string(":")) + array_type) + std::string("]"), false);
        break;
      }
    case 6 : 
      {
        wr->out(vref, false);
        wr->out((std::string(":[") + array_type) + std::string("]"), false);
        break;
      }
  }
  if ( expression ) {
    wr->out(std::string("("), false);
    for ( std::vector< std::shared_ptr<CodeNode>>::size_type i = 0; i != children.size(); i++) {
      std::shared_ptr<CodeNode> ch = children.at(i);
      ch->writeCode(wr);
    }
    wr->out(std::string(")"), false);
  }
}

std::string  CodeNode::getCode() {
  std::shared_ptr<CodeWriter> wr =  std::make_shared<CodeWriter>();
  this->writeCode(wr);
  return wr->getCode();
}

std::shared_ptr<CodeNode>  CodeNode::rebuildWithType( std::shared_ptr<RangerArgMatch> match , bool changeVref ) {
  std::shared_ptr<CodeNode> newNode =  std::make_shared<CodeNode>(code, sp, ep);
  newNode->has_operator = has_operator;
  newNode->op_index = op_index;
  newNode->mutable_def = mutable_def;
  newNode->expression = expression;
  if ( changeVref ) {
    newNode->vref = match->getTypeName(vref);
  } else {
    newNode->vref = vref;
  }
  newNode->is_block_node = is_block_node;
  newNode->type_type = match->getTypeName(type_type);
  newNode->type_name = match->getTypeName(type_name);
  newNode->key_type = match->getTypeName(key_type);
  newNode->array_type = match->getTypeName(array_type);
  newNode->value_type = value_type;
  if ( has_vref_annotation ) {
    newNode->has_vref_annotation = true;
    std::shared_ptr<CodeNode> ann = vref_annotation;
    newNode->vref_annotation  = ann->rebuildWithType(match, true);
  }
  if ( has_type_annotation ) {
    newNode->has_type_annotation = true;
    std::shared_ptr<CodeNode> t_ann = type_annotation;
    newNode->type_annotation  = t_ann->rebuildWithType(match, true);
  }
  for ( std::vector< std::string>::size_type i = 0; i != ns.size(); i++) {
    std::string n = ns.at(i);
    if ( changeVref ) {
      std::string new_ns = match->getTypeName(n);
      newNode->ns.push_back( new_ns  );
    } else {
      newNode->vref = vref;
      newNode->ns.push_back( n  );
    }
  }
  switch (value_type ) { 
    case 2 : 
      {
        newNode->double_value = double_value;
        break;
      }
    case 4 : 
      {
        newNode->string_value = string_value;
        break;
      }
    case 3 : 
      {
        newNode->int_value = int_value;
        break;
      }
    case 5 : 
      {
        newNode->boolean_value = boolean_value;
        break;
      }
    case 15 : 
      {
        if ( expression_value != NULL  ) {
          newNode->expression_value  = expression_value->rebuildWithType(match, changeVref);
        }
        break;
      }
  }
  for ( std::vector< std::string>::size_type i_1 = 0; i_1 != prop_keys.size(); i_1++) {
    std::string key = prop_keys.at(i_1);
    newNode->prop_keys.push_back( key  );
    std::shared_ptr<CodeNode> oldp = props[key];
    std::shared_ptr<CodeNode> np = oldp->rebuildWithType(match, changeVref);
    newNode->props[key] = np;
  }
  for ( std::vector< std::shared_ptr<CodeNode>>::size_type i_2 = 0; i_2 != children.size(); i_2++) {
    std::shared_ptr<CodeNode> ch = children.at(i_2);
    std::shared_ptr<CodeNode> newCh = ch->rebuildWithType(match, changeVref);
    newCh->parent  = newNode;
    newNode->children.push_back( newCh  );
  }
  return newNode;
}

std::string  CodeNode::buildTypeSignatureUsingMatch( std::shared_ptr<RangerArgMatch> match ) {
  std::string tName = match->getTypeName(type_name);
  bool caseMatched = false;
  if( tName == std::string("double")) {
    caseMatched = true;
    return std::string("double");
  }
  if( tName == std::string("string")) {
    caseMatched = true;
    return std::string("string");
  }
  if( tName == std::string("integer")) {
    caseMatched = true;
    return std::string("int");
  }
  if( tName == std::string("boolean")) {
    caseMatched = true;
    return std::string("boolean");
  }
  std::string s = std::string("");
  if ( value_type == 6 ) {
    s = s + std::string("[");
    s = s + match->getTypeName(array_type);
    s = s + this->getTypeSignatureWithMatch(match);
    s = s + std::string("]");
    return s;
  }
  if ( value_type == 7 ) {
    s = s + std::string("[");
    s = s + match->getTypeName(key_type);
    s = s + std::string(":");
    s = s + match->getTypeName(array_type);
    s = s + this->getTypeSignatureWithMatch(match);
    s = s + std::string("]");
    return s;
  }
  s = match->getTypeName(type_name);
  s = s + this->getVRefSignatureWithMatch(match);
  return s;
}

std::string  CodeNode::buildTypeSignature() {
  switch (value_type ) { 
    case 2 : 
      {
        return std::string("double");
        break;
      }
    case 4 : 
      {
        return std::string("string");
        break;
      }
    case 3 : 
      {
        return std::string("int");
        break;
      }
    case 5 : 
      {
        return std::string("boolean");
        break;
      }
    case 12 : 
      {
        return std::string("char");
        break;
      }
    case 13 : 
      {
        return std::string("charbuffer");
        break;
      }
  }
  std::string s = std::string("");
  if ( value_type == 6 ) {
    s = s + std::string("[");
    s = s + array_type;
    s = s + this->getTypeSignature();
    s = s + std::string("]");
    return s;
  }
  if ( value_type == 7 ) {
    s = s + std::string("[");
    s = s + key_type;
    s = s + std::string(":");
    s = s + array_type;
    s = s + this->getTypeSignature();
    s = s + std::string("]");
    return s;
  }
  s = type_name;
  return s;
}

std::string  CodeNode::getVRefSignatureWithMatch( std::shared_ptr<RangerArgMatch> match ) {
  if ( has_vref_annotation ) {
    std::shared_ptr<CodeNode> nn = vref_annotation->rebuildWithType(match, true);
    return std::string("@") + nn->getCode();
  }
  return std::string("");
}

std::string  CodeNode::getVRefSignature() {
  if ( has_vref_annotation ) {
    return std::string("@") + vref_annotation->getCode();
  }
  return std::string("");
}

std::string  CodeNode::getTypeSignatureWithMatch( std::shared_ptr<RangerArgMatch> match ) {
  if ( has_type_annotation ) {
    std::shared_ptr<CodeNode> nn = type_annotation->rebuildWithType(match, true);
    return std::string("@") + nn->getCode();
  }
  return std::string("");
}

std::string  CodeNode::getTypeSignature() {
  if ( has_type_annotation ) {
    return std::string("@") + type_annotation->getCode();
  }
  return std::string("");
}

int  CodeNode::typeNameAsType( std::shared_ptr<RangerAppWriterContext> ctx ) {
  bool caseMatched = false;
  if( type_name == std::string("double")) {
    caseMatched = true;
    return 2;
  }
  if( type_name == std::string("int")) {
    caseMatched = true;
    return 3;
  }
  if( type_name == std::string("string")) {
    caseMatched = true;
    return 4;
  }
  if( type_name == std::string("boolean")) {
    caseMatched = true;
    return 5;
  }
  if( type_name == std::string("char")) {
    caseMatched = true;
    return 12;
  }
  if( type_name == std::string("charbuffer")) {
    caseMatched = true;
    return 13;
  }
  if( ! caseMatched) {
    if ( true == expression ) {
      return 15;
    }
    if ( value_type == 9 ) {
      if ( ctx->isEnumDefined(type_name) ) {
        return 11;
      }
      if ( ctx->isDefinedClass(type_name) ) {
        return 8;
      }
    }
  }
  return value_type;
}

void  CodeNode::copyEvalResFrom( std::shared_ptr<CodeNode> node ) {
  if ( node->hasParamDesc ) {
    hasParamDesc = node->hasParamDesc;
    paramDesc  = node->paramDesc;
  }
  if ( node->typeClass != NULL  ) {
    typeClass  = node->typeClass;
  }
  eval_type = node->eval_type;
  eval_type_name = node->eval_type_name;
  if ( node->hasFlag(std::string("optional")) ) {
    this->setFlag(std::string("optional"));
  }
  if ( node->value_type == 7 ) {
    eval_key_type = node->eval_key_type;
    eval_array_type = node->eval_array_type;
    eval_type = 7;
  }
  if ( node->value_type == 6 ) {
    eval_key_type = node->eval_key_type;
    eval_array_type = node->eval_array_type;
    eval_type = 6;
  }
  if ( node->value_type == 15 ) {
    eval_type = 15;
    eval_function  = node->eval_function;
  }
}

void  CodeNode::defineNodeTypeTo( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx ) {
  bool caseMatched = false;
  if( type_name == std::string("double")) {
    caseMatched = true;
    node->value_type = 2;
    node->eval_type = 2;
    node->eval_type_name = std::string("double");
  }
  if( type_name == std::string("int")) {
    caseMatched = true;
    node->value_type = 3;
    node->eval_type = 3;
    node->eval_type_name = std::string("int");
  }
  if( type_name == std::string("char")) {
    caseMatched = true;
    node->value_type = 12;
    node->eval_type = 12;
    node->eval_type_name = std::string("char");
  }
  if( type_name == std::string("charbuffer")) {
    caseMatched = true;
    node->value_type = 13;
    node->eval_type = 13;
    node->eval_type_name = std::string("charbuffer");
  }
  if( type_name == std::string("string")) {
    caseMatched = true;
    node->value_type = 4;
    node->eval_type = 4;
    node->eval_type_name = std::string("string");
  }
  if( type_name == std::string("boolean")) {
    caseMatched = true;
    node->value_type = 5;
    node->eval_type = 5;
    node->eval_type_name = std::string("string");
  }
  if( ! caseMatched) {
    if ( true == expression ) {
      node->value_type = 15;
      node->eval_type = 15;
      node->expression = true;
    }
    if ( value_type == 6 ) {
      node->value_type = 6;
      node->eval_type = 6;
      node->eval_type_name = type_name;
      node->eval_array_type = array_type;
    }
    if ( value_type == 7 ) {
      node->value_type = 7;
      node->eval_type = 7;
      node->eval_type_name = type_name;
      node->eval_array_type = array_type;
      node->key_type = key_type;
    }
    if ( value_type == 11 ) {
      node->value_type = 11;
      node->eval_type = 11;
      node->eval_type_name = type_name;
    }
    if ( value_type == 9 ) {
      if ( ctx->isEnumDefined(type_name) ) {
        node->value_type = 11;
        node->eval_type = 11;
        node->eval_type_name = type_name;
      }
      if ( ctx->isDefinedClass(type_name) ) {
        node->value_type = 8;
        node->eval_type = 8;
        node->eval_type_name = type_name;
      }
    }
  }
}

void  CodeNode::ifNoTypeSetToVoid() {
  if ( (((type_name.length()) == 0) && ((key_type.length()) == 0)) && ((array_type.length()) == 0) ) {
    type_name = std::string("void");
  }
}

bool  CodeNode::ifNoTypeSetToEvalTypeOf( std::shared_ptr<CodeNode> node ) {
  if ( (((type_name.length()) == 0) && ((key_type.length()) == 0)) && ((array_type.length()) == 0) ) {
    type_name = node->eval_type_name;
    array_type = node->eval_array_type;
    key_type = node->eval_key_type;
    value_type = node->eval_type;
    eval_type = node->eval_type;
    eval_type_name = node->eval_type_name;
    eval_array_type = node->eval_array_type;
    eval_key_type = node->eval_key_type;
    if ( node->value_type == 15 ) {
      if ( expression_value == NULL ) {
        std::shared_ptr<CodeNode> copyOf = node->rebuildWithType( std::make_shared<RangerArgMatch>(), false);
        copyOf->children.pop_back();
        expression_value  = copyOf;
      }
    }
    return true;
  }
  return false;
}

RangerNodeValue::RangerNodeValue( ) {
}

RangerBackReference::RangerBackReference( ) {
}

RangerAppEnum::RangerAppEnum( ) {
  this->name = std::string("");
  this->cnt = 0;
}

void  RangerAppEnum::add( std::string n ) {
  values[n] = cnt;
  cnt = cnt + 1;
}

OpFindResult::OpFindResult( ) {
  this->did_find = false;
}

RangerAppWriterContext::RangerAppWriterContext( ) {
  this->intRootCounter = 1;
  this->targetLangName = std::string("");
  this->is_function = false;
  this->class_level_context = false;
  this->function_level_context = false;
  this->in_main = false;
  this->is_block = false;
  this->is_capturing = false;
  this->has_block_exited = false;
  this->in_expression = false;
  this->expr_restart = false;
  this->in_method = false;
  this->in_class = false;
  this->in_static_method = false;
  this->thisName = std::string("this");
  this->rootFile = std::string("--not-defined--");
}

bool  RangerAppWriterContext::isCapturing() {
  if ( is_capturing ) {
    return true;
  }
  if ( parent != NULL ) {
    return parent->isCapturing();
  }
  return false;
}

bool  RangerAppWriterContext::isLocalToCapture( std::string name ) {
  if ( localVariables.count(name) ) {
    return true;
  }
  if ( is_capturing ) {
    return false;
  }
  if ( parent != NULL ) {
    return parent->isLocalToCapture(name);
  }
  return false;
}

void  RangerAppWriterContext::addCapturedVariable( std::string name ) {
  if ( is_capturing ) {
    if ( (r_arr_index_of<std::string>(captured_variables, name)) < 0 ) {
      captured_variables.push_back( name  );
    }
    return;
  }
  if ( parent != NULL ) {
    parent->addCapturedVariable(name);
  }
}

std::vector<std::string>  RangerAppWriterContext::getCapturedVariables() {
  if ( is_capturing ) {
    return captured_variables;
  }
  if ( parent != NULL ) {
    std::vector<std::string> r = parent->getCapturedVariables();
    return r;
  }
  std::vector<std::string> res;
  return res;
}

std::string  RangerAppWriterContext::transformWord( std::string input_word ) {
  std::shared_ptr<RangerAppWriterContext> root = this->getRoot();
  root->initReservedWords();
  if ( refTransform.count(input_word) ) {
    return (refTransform[input_word]);
  }
  return input_word;
}

bool  RangerAppWriterContext::initReservedWords() {
  if ( reservedWords != NULL  ) {
    return true;
  }
  std::shared_ptr<CodeNode> main = langOperators;
  std::shared_ptr<CodeNode> lang;
  for ( std::vector< std::shared_ptr<CodeNode>>::size_type i = 0; i != main->children.size(); i++) {
    std::shared_ptr<CodeNode> m = main->children.at(i);
    std::shared_ptr<CodeNode> fc = m->getFirst();
    if ( fc->vref == std::string("language") ) {
      lang  = m;
    }
  }
  /** unused:  std::shared_ptr<CodeNode> cmds   **/ ;
  std::shared_ptr<CodeNode> langNodes = lang->children.at(1);
  for ( std::vector< std::shared_ptr<CodeNode>>::size_type i_1 = 0; i_1 != langNodes->children.size(); i_1++) {
    std::shared_ptr<CodeNode> lch = langNodes->children.at(i_1);
    std::shared_ptr<CodeNode> fc_1 = lch->getFirst();
    if ( fc_1->vref == std::string("reserved_words") ) {
      /** unused:  std::shared_ptr<CodeNode> n = lch->getSecond()   **/ ;
      reservedWords  = lch->getSecond();
      for ( std::vector< std::shared_ptr<CodeNode>>::size_type i_2 = 0; i_2 != reservedWords->children.size(); i_2++) {
        std::shared_ptr<CodeNode> ch = reservedWords->children.at(i_2);
        std::shared_ptr<CodeNode> word = ch->getFirst();
        std::shared_ptr<CodeNode> transform = ch->getSecond();
        refTransform[word->vref] = transform->vref;
      }
    }
  }
  return true;
}

bool  RangerAppWriterContext::initStdCommands() {
  if ( stdCommands != NULL  ) {
    return true;
  }
  if ( langOperators == NULL ) {
    return true;
  }
  std::shared_ptr<CodeNode> main = langOperators;
  std::shared_ptr<CodeNode> lang;
  for ( std::vector< std::shared_ptr<CodeNode>>::size_type i = 0; i != main->children.size(); i++) {
    std::shared_ptr<CodeNode> m = main->children.at(i);
    std::shared_ptr<CodeNode> fc = m->getFirst();
    if ( fc->vref == std::string("language") ) {
      lang  = m;
    }
  }
  /** unused:  std::shared_ptr<CodeNode> cmds   **/ ;
  std::shared_ptr<CodeNode> langNodes = lang->children.at(1);
  for ( std::vector< std::shared_ptr<CodeNode>>::size_type i_1 = 0; i_1 != langNodes->children.size(); i_1++) {
    std::shared_ptr<CodeNode> lch = langNodes->children.at(i_1);
    std::shared_ptr<CodeNode> fc_1 = lch->getFirst();
    if ( fc_1->vref == std::string("commands") ) {
      /** unused:  std::shared_ptr<CodeNode> n = lch->getSecond()   **/ ;
      stdCommands  = lch->getSecond();
    }
  }
  return true;
}

std::string  RangerAppWriterContext::transformTypeName( std::string typeName ) {
  if ( this->isPrimitiveType(typeName) ) {
    return typeName;
  }
  if ( this->isEnumDefined(typeName) ) {
    return typeName;
  }
  if ( this->isDefinedClass(typeName) ) {
    std::shared_ptr<RangerAppClassDesc> cl = this->findClass(typeName);
    if ( cl->is_system ) {
      return (cl->systemNames[this->getTargetLang()]);
    }
  }
  return typeName;
}

bool  RangerAppWriterContext::isPrimitiveType( std::string typeName ) {
  if ( (((((typeName == std::string("double")) || (typeName == std::string("string"))) || (typeName == std::string("int"))) || (typeName == std::string("char"))) || (typeName == std::string("charbuffer"))) || (typeName == std::string("boolean")) ) {
    return true;
  }
  return false;
}

bool  RangerAppWriterContext::isDefinedType( std::string typeName ) {
  if ( (((((typeName == std::string("double")) || (typeName == std::string("string"))) || (typeName == std::string("int"))) || (typeName == std::string("char"))) || (typeName == std::string("charbuffer"))) || (typeName == std::string("boolean")) ) {
    return true;
  }
  if ( this->isEnumDefined(typeName) ) {
    return true;
  }
  if ( this->isDefinedClass(typeName) ) {
    return true;
  }
  return false;
}

bool  RangerAppWriterContext::hadValidType( std::shared_ptr<CodeNode> node ) {
  if ( node->isPrimitiveType() || node->isPrimitive() ) {
    return true;
  }
  if ( node->value_type == 6 ) {
    if ( this->isDefinedType(node->array_type) ) {
      return true;
    } else {
      this->addError(node, std::string("Unknown type for array values: ") + node->array_type);
      return false;
    }
  }
  if ( node->value_type == 7 ) {
    if ( this->isDefinedType(node->array_type) && this->isPrimitiveType(node->key_type) ) {
      return true;
    } else {
      if ( this->isDefinedType(node->array_type) == false ) {
        this->addError(node, std::string("Unknown type for map values: ") + node->array_type);
      }
      if ( this->isDefinedType(node->array_type) == false ) {
        this->addError(node, std::string("Unknown type for map keys: ") + node->key_type);
      }
      return false;
    }
  }
  if ( this->isDefinedType(node->type_name) ) {
    return true;
  } else {
    if ( node->value_type == 15 ) {
    } else {
      this->addError(node, ((std::string("Unknown type: ") + node->type_name) + std::string(" type ID : ")) + std::to_string(node->value_type));
    }
  }
  return false;
}

std::string  RangerAppWriterContext::getTargetLang() {
  if ( (targetLangName.length()) > 0 ) {
    return targetLangName;
  }
  if ( parent != NULL ) {
    return parent->getTargetLang();
  }
  return std::string("ranger");
}

std::shared_ptr<CodeNode>  RangerAppWriterContext::findOperator( std::shared_ptr<CodeNode> node ) {
  std::shared_ptr<RangerAppWriterContext> root = this->getRoot();
  root->initStdCommands();
  return root->stdCommands->children.at(node->op_index);
}

std::shared_ptr<CodeNode>  RangerAppWriterContext::getStdCommands() {
  std::shared_ptr<RangerAppWriterContext> root = this->getRoot();
  root->initStdCommands();
  return root->stdCommands;
}

std::shared_ptr<RangerAppClassDesc>  RangerAppWriterContext::findClassWithSign( std::shared_ptr<CodeNode> node ) {
  std::shared_ptr<RangerAppWriterContext> root = this->getRoot();
  std::shared_ptr<CodeNode> tplArgs = node->vref_annotation;
  std::string sign = node->vref + tplArgs->getCode();
  std::string theName = root->classSignatures[sign];
  return this->findClass((theName));
}

std::string  RangerAppWriterContext::createSignature( std::string origClass , std::string classSig ) {
  if ( classSignatures.count(classSig) ) {
    return (classSignatures[classSig]);
  }
  int ii = 1;
  std::string sigName = (origClass + std::string("V")) + std::to_string(ii);
  while (classToSignature.count(sigName)) {
    ii = ii + 1;
    sigName = (origClass + std::string("V")) + std::to_string(ii);
  }
  classToSignature[sigName] = classSig;
  classSignatures[classSig] = sigName;
  return sigName;
}

void  RangerAppWriterContext::createOperator( std::shared_ptr<CodeNode> fromNode ) {
  std::shared_ptr<RangerAppWriterContext> root = this->getRoot();
  if ( root->initStdCommands() ) {
    root->stdCommands->children.push_back( fromNode  );
    /** unused:  std::shared_ptr<CodeNode> fc = fromNode->children.at(0)   **/ ;
  }
}

std::shared_ptr<CodeWriter>  RangerAppWriterContext::getFileWriter( std::string path , std::string fileName ) {
  std::shared_ptr<RangerAppWriterContext> root = this->getRoot();
  std::shared_ptr<CodeFileSystem> fs = root->fileSystem;
  std::shared_ptr<CodeFile> file = fs->getFile(path, fileName);
  std::shared_ptr<CodeWriter> wr;
  wr  = file->getWriter();
  return wr;
}

void  RangerAppWriterContext::addTodo( std::shared_ptr<CodeNode> node , std::string descr ) {
  std::shared_ptr<RangerAppTodo> e =  std::make_shared<RangerAppTodo>();
  e->description = descr;
  e->todonode  = node;
  std::shared_ptr<RangerAppWriterContext> root = this->getRoot();
  root->todoList.push_back( e  );
}

void  RangerAppWriterContext::setThisName( std::string the_name ) {
  std::shared_ptr<RangerAppWriterContext> root = this->getRoot();
  root->thisName = the_name;
}

std::string  RangerAppWriterContext::getThisName() {
  std::shared_ptr<RangerAppWriterContext> root = this->getRoot();
  return root->thisName;
}

void  RangerAppWriterContext::printLogs( std::string logName ) {
}

void  RangerAppWriterContext::log( std::shared_ptr<CodeNode> node , std::string logName , std::string descr ) {
}

void  RangerAppWriterContext::addMessage( std::shared_ptr<CodeNode> node , std::string descr ) {
  std::shared_ptr<RangerCompilerMessage> e =  std::make_shared<RangerCompilerMessage>();
  e->description = descr;
  e->node  = node;
  std::shared_ptr<RangerAppWriterContext> root = this->getRoot();
  root->compilerMessages.push_back( e  );
}

void  RangerAppWriterContext::addError( std::shared_ptr<CodeNode> targetnode , std::string descr ) {
  std::shared_ptr<RangerCompilerMessage> e =  std::make_shared<RangerCompilerMessage>();
  e->description = descr;
  e->node  = targetnode;
  std::shared_ptr<RangerAppWriterContext> root = this->getRoot();
  root->compilerErrors.push_back( e  );
}

void  RangerAppWriterContext::addParserError( std::shared_ptr<CodeNode> targetnode , std::string descr ) {
  std::shared_ptr<RangerCompilerMessage> e =  std::make_shared<RangerCompilerMessage>();
  e->description = descr;
  e->node  = targetnode;
  std::shared_ptr<RangerAppWriterContext> root = this->getRoot();
  root->parserErrors.push_back( e  );
}

void  RangerAppWriterContext::addTemplateClass( std::string name , std::shared_ptr<CodeNode> node ) {
  std::shared_ptr<RangerAppWriterContext> root = this->getRoot();
  root->templateClassList.push_back( name  );
  root->templateClassNodes[name] = node;
}

bool  RangerAppWriterContext::hasTemplateNode( std::string name ) {
  std::shared_ptr<RangerAppWriterContext> root = this->getRoot();
  return root->templateClassNodes.count(name);
}

std::shared_ptr<CodeNode>  RangerAppWriterContext::findTemplateNode( std::string name ) {
  std::shared_ptr<RangerAppWriterContext> root = this->getRoot();
  return (root->templateClassNodes[name]);
}

void  RangerAppWriterContext::setStaticWriter( std::string className , std::shared_ptr<CodeWriter> writer ) {
  std::shared_ptr<RangerAppWriterContext> root = this->getRoot();
  root->classStaticWriters[className] = writer;
}

std::shared_ptr<CodeWriter>  RangerAppWriterContext::getStaticWriter( std::string className ) {
  std::shared_ptr<RangerAppWriterContext> root = this->getRoot();
  return (root->classStaticWriters[className]);
}

bool  RangerAppWriterContext::isEnumDefined( std::string n ) {
  if ( definedEnums.count(n) ) {
    return true;
  }
  if ( parent == NULL ) {
    return false;
  }
  return parent->isEnumDefined(n);
}

std::shared_ptr<RangerAppEnum>  RangerAppWriterContext::getEnum( std::string n ) {
  if ( definedEnums.count(n) ) {
    return definedEnums[n];
  }
  if ( parent != NULL  ) {
    return parent->getEnum(n);
  }
  std::shared_ptr<RangerAppEnum> none;
  return none;
}

bool  RangerAppWriterContext::isVarDefined( std::string name ) {
  if ( localVariables.count(name) ) {
    return true;
  }
  if ( parent == NULL ) {
    return false;
  }
  return parent->isVarDefined(name);
}

void  RangerAppWriterContext::setCompilerFlag( std::string name , bool value ) {
  compilerFlags[name] = value;
}

bool  RangerAppWriterContext::hasCompilerFlag( std::string s_name ) {
  if ( compilerFlags.count(s_name) ) {
    return (compilerFlags[s_name]);
  }
  if ( parent == NULL ) {
    return false;
  }
  return parent->hasCompilerFlag(s_name);
}

std::string  RangerAppWriterContext::getCompilerSetting( std::string s_name ) {
  if ( compilerSettings.count(s_name) ) {
    return (compilerSettings[s_name]);
  }
  if ( parent == NULL ) {
    return std::string("");
  }
  return parent->getCompilerSetting(s_name);
}

bool  RangerAppWriterContext::hasCompilerSetting( std::string s_name ) {
  if ( compilerSettings.count(s_name) ) {
    return true;
  }
  if ( parent == NULL ) {
    return false;
  }
  return parent->hasCompilerSetting(s_name);
}

std::shared_ptr<RangerAppParamDesc>  RangerAppWriterContext::getVariableDef( std::string name ) {
  if ( localVariables.count(name) ) {
    return (localVariables[name]);
  }
  if ( parent == NULL ) {
    std::shared_ptr<RangerAppParamDesc> tmp =  std::make_shared<RangerAppParamDesc>();
    return tmp;
  }
  return parent->getVariableDef(name);
}

std::shared_ptr<RangerAppWriterContext>  RangerAppWriterContext::findFunctionCtx() {
  if ( is_function ) {
    return shared_from_this();
  }
  if ( parent == NULL ) {
    return shared_from_this();
  }
  return parent->findFunctionCtx();
}

int  RangerAppWriterContext::getFnVarCnt( std::string name ) {
  std::shared_ptr<RangerAppWriterContext> fnCtx = this->findFunctionCtx();
  int ii = 0;
  if ( fnCtx->defCounts.count(name) ) {
    ii = (cpp_get_map_int_value<std::string>(fnCtx->defCounts, name)).value;
    ii = 1 + ii;
  } else {
    fnCtx->defCounts[name] = ii;
    return 0;
  }
  bool scope_has = this->isVarDefined(((name + std::string("_")) + std::to_string(ii)));
  while (scope_has) {
    ii = 1 + ii;
    scope_has = this->isVarDefined(((name + std::string("_")) + std::to_string(ii)));
  }
  fnCtx->defCounts[name] = ii;
  return ii;
}

void  RangerAppWriterContext::debugVars() {
  std::cout << std::string("--- context vars ---") << std::endl;
  for ( std::vector< std::string>::size_type i = 0; i != localVarNames.size(); i++) {
    std::string na = localVarNames.at(i);
    std::cout << std::string("var => ") + na << std::endl;
  }
  if ( parent != NULL  ) {
    parent->debugVars();
  }
}

int  RangerAppWriterContext::getVarTotalCnt( std::string name ) {
  std::shared_ptr<RangerAppWriterContext> fnCtx = shared_from_this();
  int ii = 0;
  if ( fnCtx->defCounts.count(name) ) {
    ii = (cpp_get_map_int_value<std::string>(fnCtx->defCounts, name)).value;
  }
  if ( fnCtx->parent != NULL  ) {
    ii = ii + fnCtx->parent->getVarTotalCnt(name);
  }
  if ( this->isVarDefined(name) ) {
    ii = ii + 1;
  }
  return ii;
}

int  RangerAppWriterContext::getFnVarCnt2( std::string name ) {
  std::shared_ptr<RangerAppWriterContext> fnCtx = shared_from_this();
  int ii = 0;
  if ( fnCtx->defCounts.count(name) ) {
    ii = (cpp_get_map_int_value<std::string>(fnCtx->defCounts, name)).value;
    ii = 1 + ii;
    fnCtx->defCounts[name] = ii;
  } else {
    fnCtx->defCounts[name] = 1;
  }
  if ( fnCtx->parent != NULL  ) {
    ii = ii + fnCtx->parent->getFnVarCnt2(name);
  }
  bool scope_has = this->isVarDefined(name);
  if ( scope_has ) {
    ii = 1 + ii;
  }
  bool scope_has_2 = this->isVarDefined(((name + std::string("_")) + std::to_string(ii)));
  while (scope_has_2) {
    ii = 1 + ii;
    scope_has_2 = this->isVarDefined(((name + std::string("_")) + std::to_string(ii)));
  }
  return ii;
}

int  RangerAppWriterContext::getFnVarCnt3( std::string name ) {
  std::shared_ptr<RangerAppWriterContext> classLevel = this->findMethodLevelContext();
  std::shared_ptr<RangerAppWriterContext> fnCtx = shared_from_this();
  int ii = 0;
  if ( fnCtx->defCounts.count(name) ) {
    ii = (cpp_get_map_int_value<std::string>(fnCtx->defCounts, name)).value;
    fnCtx->defCounts[name] = ii + 1;
  } else {
    fnCtx->defCounts[name] = 1;
  }
  if ( classLevel->isVarDefined(name) ) {
    ii = ii + 1;
  }
  bool scope_has = this->isVarDefined(((name + std::string("_")) + std::to_string(ii)));
  while (scope_has) {
    ii = 1 + ii;
    scope_has = this->isVarDefined(((name + std::string("_")) + std::to_string(ii)));
  }
  return ii;
}

bool  RangerAppWriterContext::isMemberVariable( std::string name ) {
  if ( this->isVarDefined(name) ) {
    std::shared_ptr<RangerAppParamDesc> vDef = this->getVariableDef(name);
    if ( vDef->varType == 8 ) {
      return true;
    }
  }
  return false;
}

void  RangerAppWriterContext::defineVariable( std::string name , std::shared_ptr<RangerAppParamDesc> desc ) {
  int cnt = 0;
  std::shared_ptr<RangerAppWriterContext> fnLevel = this->findMethodLevelContext();
  if ( false == (((desc->varType == 8) || (desc->varType == 4)) || (desc->varType == 10)) ) {
    cnt = fnLevel->getFnVarCnt3(name);
  }
  if ( 0 == cnt ) {
    if ( name == std::string("len") ) {
      desc->compiledName = std::string("__len");
    } else {
      desc->compiledName = name;
    }
  } else {
    desc->compiledName = (name + std::string("_")) + std::to_string(cnt);
  }
  localVariables[name] = desc;
  localVarNames.push_back( name  );
}

bool  RangerAppWriterContext::isDefinedClass( std::string name ) {
  if ( definedClasses.count(name) ) {
    return true;
  } else {
    if ( parent != NULL  ) {
      return parent->isDefinedClass(name);
    }
  }
  return false;
}

std::shared_ptr<RangerAppWriterContext>  RangerAppWriterContext::getRoot() {
  if ( parent == NULL ) {
    return shared_from_this();
  }
  return parent->getRoot();
}

std::vector<std::shared_ptr<RangerAppClassDesc>>  RangerAppWriterContext::getClasses() {
  std::vector<std::shared_ptr<RangerAppClassDesc>> list;
  for ( std::vector< std::string>::size_type i = 0; i != definedClassList.size(); i++) {
    std::string n = definedClassList.at(i);
    list.push_back( (definedClasses[n])  );
  }
  return list;
}

void  RangerAppWriterContext::addClass( std::string name , std::shared_ptr<RangerAppClassDesc> desc ) {
  std::shared_ptr<RangerAppWriterContext> root = this->getRoot();
  if ( root->definedClasses.count(name) ) {
  } else {
    root->definedClasses[name] = desc;
    root->definedClassList.push_back( name  );
  }
}

std::shared_ptr<RangerAppClassDesc>  RangerAppWriterContext::findClass( std::string name ) {
  std::shared_ptr<RangerAppWriterContext> root = this->getRoot();
  return (root->definedClasses[name]);
}

bool  RangerAppWriterContext::hasClass( std::string name ) {
  std::shared_ptr<RangerAppWriterContext> root = this->getRoot();
  return root->definedClasses.count(name);
}

std::shared_ptr<RangerAppFunctionDesc>  RangerAppWriterContext::getCurrentMethod() {
  if ( currentMethod != NULL  ) {
    return currentMethod;
  }
  if ( parent != NULL  ) {
    return parent->getCurrentMethod();
  }
  return  std::make_shared<RangerAppFunctionDesc>();
}

void  RangerAppWriterContext::setCurrentClass( std::shared_ptr<RangerAppClassDesc> cc ) {
  in_class = true;
  currentClass  = cc;
}

void  RangerAppWriterContext::disableCurrentClass() {
  if ( in_class ) {
    in_class = false;
  }
  if ( parent != NULL  ) {
    parent->disableCurrentClass();
  }
}

bool  RangerAppWriterContext::hasCurrentClass() {
  if ( in_class && (currentClass != NULL ) ) {
    return true;
  }
  if ( parent != NULL  ) {
    return parent->hasCurrentClass();
  }
  return false;
}

std::shared_ptr<RangerAppClassDesc>  RangerAppWriterContext::getCurrentClass() {
  if ( in_class && (currentClass != NULL ) ) {
    return currentClass;
  }
  if ( parent != NULL  ) {
    return parent->getCurrentClass();
  }
  std::shared_ptr<RangerAppClassDesc> non;
  return non;
}

void  RangerAppWriterContext::restartExpressionLevel() {
  expr_restart = true;
}

bool  RangerAppWriterContext::isInExpression() {
  if ( (expr_stack.size()) > 0 ) {
    return true;
  }
  if ( (parent != NULL ) && (expr_restart == false) ) {
    return parent->isInExpression();
  }
  return false;
}

int  RangerAppWriterContext::expressionLevel() {
  int level = expr_stack.size();
  if ( (parent != NULL ) && (expr_restart == false) ) {
    return level + parent->expressionLevel();
  }
  return level;
}

void  RangerAppWriterContext::setInExpr() {
  expr_stack.push_back( true  );
}

void  RangerAppWriterContext::unsetInExpr() {
  expr_stack.pop_back();
}

int  RangerAppWriterContext::getErrorCount() {
  int cnt = compilerErrors.size();
  if ( parent != NULL ) {
    cnt = cnt + parent->getErrorCount();
  }
  return cnt;
}

bool  RangerAppWriterContext::isInStatic() {
  if ( in_static_method ) {
    return true;
  }
  if ( parent != NULL ) {
    return parent->isInStatic();
  }
  return false;
}

bool  RangerAppWriterContext::isInMain() {
  if ( in_main ) {
    return true;
  }
  if ( parent != NULL ) {
    return parent->isInMain();
  }
  return false;
}

bool  RangerAppWriterContext::isInMethod() {
  if ( (method_stack.size()) > 0 ) {
    return true;
  }
  if ( parent != NULL  ) {
    return parent->isInMethod();
  }
  return false;
}

void  RangerAppWriterContext::setInMethod() {
  method_stack.push_back( true  );
}

void  RangerAppWriterContext::unsetInMethod() {
  method_stack.pop_back();
}

std::shared_ptr<RangerAppWriterContext>  RangerAppWriterContext::findMethodLevelContext() {
  std::shared_ptr<RangerAppWriterContext> res;
  if ( function_level_context ) {
    res  = shared_from_this();
    return res;
  }
  if ( parent != NULL ) {
    return parent->findMethodLevelContext();
  }
  res  = shared_from_this();
  return res;
}

std::shared_ptr<RangerAppWriterContext>  RangerAppWriterContext::findClassLevelContext() {
  std::shared_ptr<RangerAppWriterContext> res;
  if ( class_level_context ) {
    res  = shared_from_this();
    return res;
  }
  if ( parent != NULL ) {
    return parent->findClassLevelContext();
  }
  res  = shared_from_this();
  return res;
}

std::shared_ptr<RangerAppWriterContext>  RangerAppWriterContext::fork() {
  std::shared_ptr<RangerAppWriterContext> new_ctx =  std::make_shared<RangerAppWriterContext>();
  new_ctx->parent  = shared_from_this();
  return new_ctx;
}

std::string  RangerAppWriterContext::getRootFile() {
  std::shared_ptr<RangerAppWriterContext> root = this->getRoot();
  return root->rootFile;
}

void  RangerAppWriterContext::setRootFile( std::string file_name ) {
  std::shared_ptr<RangerAppWriterContext> root = this->getRoot();
  root->rootFile = file_name;
}

CodeFile::CodeFile( std::string filePath , std::string fileName  ) {
  this->path_name = std::string("");
  this->name = std::string("");
  name = fileName;
  path_name = filePath;
  writer  =  std::make_shared<CodeWriter>();
  writer->createTag(std::string("imports"));
}

void  CodeFile::addImport( std::string import_name ) {
  if ( false == (import_list.count(import_name)) ) {
    import_list[import_name] = import_name;
    import_names.push_back( import_name  );
  }
}

std::shared_ptr<CodeWriter>  CodeFile::testCreateWriter() {
  return  std::make_shared<CodeWriter>();
}

std::vector<std::string>  CodeFile::getImports() {
  return import_names;
}

std::shared_ptr<CodeWriter>  CodeFile::getWriter() {
  writer->ownerFile  = shared_from_this();
  return writer;
}

std::string  CodeFile::getCode() {
  return writer->getCode();
}

CodeFileSystem::CodeFileSystem( ) {
}

std::shared_ptr<CodeFile>  CodeFileSystem::getFile( std::string path , std::string name ) {
  for ( std::vector< std::shared_ptr<CodeFile>>::size_type idx = 0; idx != files.size(); idx++) {
    std::shared_ptr<CodeFile> file = files.at(idx);
    if ( (file->path_name == path) && (file->name == name) ) {
      return file;
    }
  }
  std::shared_ptr<CodeFile> new_file =  std::make_shared<CodeFile>(path, name);
  new_file->fileSystem  = shared_from_this();
  files.push_back( new_file  );
  return new_file;
}

void  CodeFileSystem::mkdir( std::string path ) {
  std::vector<std::string> parts = r_str_split( path, std::string("/"));
  std::string curr_path = std::string("");
  for ( std::vector< std::string>::size_type i = 0; i != parts.size(); i++) {
    std::string p = parts.at(i);
    curr_path = (curr_path + std::string("/")) + p;
    if ( false == (r_cpp_dir_exists( curr_path )) ) {
      r_cpp_create_dir( curr_path );
    }
  }
}

void  CodeFileSystem::saveTo( std::string path ) {
  for ( std::vector< std::shared_ptr<CodeFile>>::size_type idx = 0; idx != files.size(); idx++) {
    std::shared_ptr<CodeFile> file = files.at(idx);
    std::string file_path = (path + std::string("/")) + file->path_name;
    this->mkdir(file_path);
    std::cout << ((std::string("Writing to file ") + file_path) + std::string("/")) + file->name << std::endl;
    std::string file_content = file->getCode();
    if ( (file_content.length()) > 0 ) {
      r_cpp_write_file( file_path , file->name , file_content  );
    }
  }
}

CodeSlice::CodeSlice( ) {
  this->code = std::string("");
}

std::string  CodeSlice::getCode() {
  if ( writer == NULL ) {
    return code;
  }
  return writer->getCode();
}

CodeWriter::CodeWriter( ) {
  this->tagName = std::string("");
  this->codeStr = std::string("");
  this->currentLine = std::string("");
  this->tabStr = std::string("  ");
  this->lineNumber = 1;
  this->indentAmount = 0;
  this->tagOffset = 0;
  this->had_nl = true;
  std::shared_ptr<CodeSlice> new_slice =  std::make_shared<CodeSlice>();
  slices.push_back( new_slice  );
  current_slice  = new_slice;
}

std::shared_ptr<CodeWriter>  CodeWriter::getFileWriter( std::string path , std::string fileName ) {
  std::shared_ptr<CodeFileSystem> fs = ownerFile->fileSystem;
  std::shared_ptr<CodeFile> file = fs->getFile(path, fileName);
  std::shared_ptr<CodeWriter> wr = file->getWriter();
  return wr;
}

std::vector<std::string>  CodeWriter::getImports() {
  std::shared_ptr<CodeWriter> p = shared_from_this();
  while ((p->ownerFile == NULL) && (p->parent != NULL )) {
    p = p->parent;
  }
  if ( p->ownerFile != NULL  ) {
    std::shared_ptr<CodeFile> f = p->ownerFile;
    return f->import_names;
  }
  std::vector<std::string> nothing;
  return nothing;
}

void  CodeWriter::addImport( std::string name ) {
  if ( ownerFile != NULL  ) {
    ownerFile->addImport(name);
  } else {
    if ( parent != NULL  ) {
      parent->addImport(name);
    }
  }
}

void  CodeWriter::indent( int delta ) {
  indentAmount = indentAmount + delta;
  if ( indentAmount < 0 ) {
    indentAmount = 0;
  }
}

void  CodeWriter::addIndent() {
  int i = 0;
  if ( 0 == (currentLine.length()) ) {
    while (i < indentAmount) {
      currentLine = currentLine + tabStr;
      i = i + 1;
    }
  }
}

std::shared_ptr<CodeWriter>  CodeWriter::createTag( std::string name ) {
  std::shared_ptr<CodeWriter> new_writer =  std::make_shared<CodeWriter>();
  std::shared_ptr<CodeSlice> new_slice =  std::make_shared<CodeSlice>();
  tags[name] = slices.size();
  slices.push_back( new_slice  );
  new_slice->writer  = new_writer;
  new_writer->indentAmount = indentAmount;
  std::shared_ptr<CodeSlice> new_active_slice =  std::make_shared<CodeSlice>();
  slices.push_back( new_active_slice  );
  current_slice  = new_active_slice;
  new_writer->parent  = shared_from_this();
  return new_writer;
}

std::shared_ptr<CodeWriter>  CodeWriter::getTag( std::string name ) {
  if ( tags.count(name) ) {
    int idx = (cpp_get_map_int_value<std::string>(tags, name)).value;
    std::shared_ptr<CodeSlice> slice = slices.at(idx);
    return slice->writer;
  } else {
    if ( parent != NULL  ) {
      return parent->getTag(name);
    }
  }
  return shared_from_this();
}

bool  CodeWriter::hasTag( std::string name ) {
  if ( tags.count(name) ) {
    return true;
  } else {
    if ( parent != NULL  ) {
      return parent->hasTag(name);
    }
  }
  return false;
}

std::shared_ptr<CodeWriter>  CodeWriter::fork() {
  std::shared_ptr<CodeWriter> new_writer =  std::make_shared<CodeWriter>();
  std::shared_ptr<CodeSlice> new_slice =  std::make_shared<CodeSlice>();
  slices.push_back( new_slice  );
  new_slice->writer  = new_writer;
  new_writer->indentAmount = indentAmount;
  new_writer->parent  = shared_from_this();
  std::shared_ptr<CodeSlice> new_active_slice =  std::make_shared<CodeSlice>();
  slices.push_back( new_active_slice  );
  current_slice  = new_active_slice;
  return new_writer;
}

void  CodeWriter::newline() {
  if ( (currentLine.length()) > 0 ) {
    this->out(std::string(""), true);
  }
}

void  CodeWriter::writeSlice( std::string str , bool newLine ) {
  this->addIndent();
  currentLine = currentLine + str;
  if ( newLine ) {
    current_slice->code = (current_slice->code + currentLine) + std::string("\n");
    currentLine = std::string("");
  }
}

void  CodeWriter::out( std::string str , bool newLine ) {
  std::vector<std::string> lines = r_str_split( str, std::string("\n"));
  int rowCnt = lines.size();
  if ( rowCnt == 1 ) {
    this->writeSlice(str, newLine);
  } else {
    for ( std::vector< std::string>::size_type idx = 0; idx != lines.size(); idx++) {
      std::string row = lines.at(idx);
      this->addIndent();
      if ( idx < (rowCnt - 1) ) {
        this->writeSlice(r_cpp_trim( row), true);
      } else {
        this->writeSlice(row, newLine);
      }
    }
  }
}

void  CodeWriter::raw( std::string str , bool newLine ) {
  std::vector<std::string> lines = r_str_split( str, std::string("\n"));
  int rowCnt = lines.size();
  if ( rowCnt == 1 ) {
    this->writeSlice(str, newLine);
  } else {
    for ( std::vector< std::string>::size_type idx = 0; idx != lines.size(); idx++) {
      std::string row = lines.at(idx);
      this->addIndent();
      if ( idx < (rowCnt - 1) ) {
        this->writeSlice(row, true);
      } else {
        this->writeSlice(row, newLine);
      }
    }
  }
}

std::string  CodeWriter::getCode() {
  std::string res = std::string("");
  for ( std::vector< std::shared_ptr<CodeSlice>>::size_type idx = 0; idx != slices.size(); idx++) {
    std::shared_ptr<CodeSlice> slice = slices.at(idx);
    res = res + slice->getCode();
  }
  res = res + currentLine;
  return res;
}

RangerLispParser::RangerLispParser( std::shared_ptr<SourceCode> code_module  ) {
  this->__len = 0;
  this->i = 0;
  this->paren_cnt = 0;
  this->get_op_pred = 0;
  this->had_error = false;
  buff  = code_module->code.c_str();
  code  = code_module;
  __len = strlen( (buff) );
  rootNode  =  std::make_shared<CodeNode>(code, 0, 0);
  rootNode->is_block_node = true;
  rootNode->expression = true;
  curr_node  = rootNode;
  parents.push_back( curr_node  );
  paren_cnt = 1;
}

void  RangerLispParser::joo( std::shared_ptr<SourceCode> cm ) {
  /** unused:  int ll = cm->code.length()   **/ ;
}

std::shared_ptr<CodeNode>  RangerLispParser::parse_raw_annotation() {
  int sp = i;
  int ep = i;
  i = i + 1;
  sp = i;
  ep = i;
  if ( i < __len ) {
    std::shared_ptr<CodeNode> a_node2 =  std::make_shared<CodeNode>(code, sp, ep);
    a_node2->expression = true;
    curr_node  = a_node2;
    parents.push_back( a_node2  );
    i = i + 1;
    paren_cnt = paren_cnt + 1;
    this->parse();
    return a_node2;
  } else {
  }
  return  std::make_shared<CodeNode>(code, sp, ep);
}

bool  RangerLispParser::skip_space( bool is_block_parent ) {
  const char* s = buff;
  bool did_break = false;
  if ( i >= __len ) {
    return true;
  }
  char c = s[i];
  /** unused:  bool bb = c == (46)   **/ ;
  while ((i < __len) && (c <= 32)) {
    if ( is_block_parent && ((c == 10) || (c == 13)) ) {
      this->end_expression();
      did_break = true;
      break;
    }
    i = 1 + i;
    if ( i >= __len ) {
      return true;
    }
    c = s[i];
  }
  return did_break;
}

bool  RangerLispParser::end_expression() {
  i = 1 + i;
  if ( i >= __len ) {
    return false;
  }
  paren_cnt = paren_cnt - 1;
  if ( paren_cnt < 0 ) {
    std::cout << std::string("Parser error ) mismatch") << std::endl;
  }
  parents.pop_back();
  if ( curr_node != NULL  ) {
    curr_node->ep = i;
    curr_node->infix_operator = false;
  }
  if ( (parents.size()) > 0 ) {
    curr_node  = parents.at(((parents.size()) - 1));
  } else {
    curr_node  = rootNode;
  }
  curr_node->infix_operator = false;
  return true;
}

int  RangerLispParser::getOperator() {
  const char* s = buff;
  if ( (i + 2) >= __len ) {
    return 0;
  }
  char c = s[i];
  char c2 = s[(i + 1)];
  switch (c ) { 
    case 42 : 
      {
        i = i + 1;
        return 14;
        break;
      }
    case 47 : 
      {
        i = i + 1;
        return 14;
        break;
      }
    case 43 : 
      {
        i = i + 1;
        return 13;
        break;
      }
    case 45 : 
      {
        i = i + 1;
        return 13;
        break;
      }
    case 60 : 
      {
        if ( c2 == (61) ) {
          i = i + 2;
          return 11;
        }
        i = i + 1;
        return 11;
        break;
      }
    case 62 : 
      {
        if ( c2 == (61) ) {
          i = i + 2;
          return 11;
        }
        i = i + 1;
        return 11;
        break;
      }
    case 33 : 
      {
        if ( c2 == (61) ) {
          i = i + 2;
          return 10;
        }
        return 0;
        break;
      }
    case 61 : 
      {
        if ( c2 == (61) ) {
          i = i + 2;
          return 10;
        }
        i = i + 1;
        return 3;
        break;
      }
    case 38 : 
      {
        if ( c2 == (38) ) {
          i = i + 2;
          return 6;
        }
        return 0;
        break;
      }
    case 124 : 
      {
        if ( c2 == (124) ) {
          i = i + 2;
          return 5;
        }
        return 0;
        break;
      }
    default: 
      break;
  }
  return 0;
}

int  RangerLispParser::isOperator() {
  const char* s = buff;
  if ( (i - 2) > __len ) {
    return 0;
  }
  char c = s[i];
  char c2 = s[(i + 1)];
  switch (c ) { 
    case 42 : 
      {
        return 1;
        break;
      }
    case 47 : 
      {
        return 14;
        break;
      }
    case 43 : 
      {
        return 13;
        break;
      }
    case 45 : 
      {
        return 13;
        break;
      }
    case 60 : 
      {
        if ( c2 == (61) ) {
          return 11;
        }
        return 11;
        break;
      }
    case 62 : 
      {
        if ( c2 == (61) ) {
          return 11;
        }
        return 11;
        break;
      }
    case 33 : 
      {
        if ( c2 == (61) ) {
          return 10;
        }
        return 0;
        break;
      }
    case 61 : 
      {
        if ( c2 == (61) ) {
          return 10;
        }
        return 3;
        break;
      }
    case 38 : 
      {
        if ( c2 == (38) ) {
          return 6;
        }
        return 0;
        break;
      }
    case 124 : 
      {
        if ( c2 == (124) ) {
          return 5;
        }
        return 0;
        break;
      }
    default: 
      break;
  }
  return 0;
}

int  RangerLispParser::getOperatorPred( std::string str ) {
  bool caseMatched = false;
  if( str == std::string("<")) {
    caseMatched = true;
    return 11;
  }
  if( str == std::string(">")) {
    caseMatched = true;
    return 11;
  }
  if( str == std::string("<=")) {
    caseMatched = true;
    return 11;
  }
  if( str == std::string(">=")) {
    caseMatched = true;
    return 11;
  }
  if( str == std::string("==")) {
    caseMatched = true;
    return 10;
  }
  if( str == std::string("!=")) {
    caseMatched = true;
    return 10;
  }
  if( str == std::string("=")) {
    caseMatched = true;
    return 3;
  }
  if( str == std::string("&&")) {
    caseMatched = true;
    return 6;
  }
  if( str == std::string("||")) {
    caseMatched = true;
    return 5;
  }
  if( str == std::string("+")) {
    caseMatched = true;
    return 13;
  }
  if( str == std::string("-")) {
    caseMatched = true;
    return 13;
  }
  if( str == std::string("*")) {
    caseMatched = true;
    return 14;
  }
  if( str == std::string("/")) {
    caseMatched = true;
    return 14;
  }
  if( ! caseMatched) {
  }
  return 0;
}

void  RangerLispParser::insert_node( std::shared_ptr<CodeNode> p_node ) {
  std::shared_ptr<CodeNode> push_target = curr_node;
  if ( curr_node->infix_operator ) {
    push_target  = curr_node->infix_node;
    if ( push_target->to_the_right ) {
      push_target  = push_target->right_node;
      p_node->parent  = push_target;
    }
  }
  push_target->children.push_back( p_node  );
}

void  RangerLispParser::parse() {
  const char* s = buff;
  char c = s[0];
  /** unused:  char next_c = 0   **/ ;
  char fc = 0;
  std::shared_ptr<CodeNode> new_node;
  int sp = 0;
  int ep = 0;
  int last_i = 0;
  bool had_lf = false;
  while (i < __len) {
    if ( had_error ) {
      break;
    }
    last_i = i;
    bool is_block_parent = false;
    if ( had_lf ) {
      had_lf = false;
      this->end_expression();
      break;
    }
    if ( curr_node != NULL  ) {
      if ( curr_node->parent != NULL  ) {
        std::shared_ptr<CodeNode> nodeParent = curr_node->parent;
        if ( nodeParent->is_block_node ) {
          is_block_parent = true;
        }
      }
    }
    if ( this->skip_space(is_block_parent) ) {
      break;
    }
    had_lf = false;
    c = s[i];
    if ( i < __len ) {
      c = s[i];
      if ( c == 59 ) {
        sp = i + 1;
        while ((i < __len) && ((s[i]) > 31)) {
          i = 1 + i;
        }
        if ( i >= __len ) {
          break;
        }
        new_node  =  std::make_shared<CodeNode>(code, sp, i);
        new_node->parsed_type = 10;
        new_node->value_type = 10;
        new_node->string_value = std::string( s + sp, i - sp );
        curr_node->comments.push_back( new_node  );
        continue;
      }
      if ( i < (__len - 1) ) {
        fc = s[(i + 1)];
        if ( (((c == 40) || (c == (123))) || ((c == 39) && (fc == 40))) || ((c == 96) && (fc == 40)) ) {
          paren_cnt = paren_cnt + 1;
          if ( curr_node == NULL ) {
            rootNode  =  std::make_shared<CodeNode>(code, i, i);
            curr_node  = rootNode;
            if ( c == 96 ) {
              curr_node->parsed_type = 30;
              curr_node->value_type = 30;
            }
            if ( c == 39 ) {
              curr_node->parsed_type = 29;
              curr_node->value_type = 29;
            }
            curr_node->expression = true;
            parents.push_back( curr_node  );
          } else {
            std::shared_ptr<CodeNode> new_qnode =  std::make_shared<CodeNode>(code, i, i);
            if ( c == 96 ) {
              new_qnode->value_type = 30;
            }
            if ( c == 39 ) {
              new_qnode->value_type = 29;
            }
            new_qnode->expression = true;
            this->insert_node(new_qnode);
            parents.push_back( new_qnode  );
            curr_node  = new_qnode;
          }
          if ( c == (123) ) {
            curr_node->is_block_node = true;
          }
          i = 1 + i;
          this->parse();
          continue;
        }
      }
      sp = i;
      ep = i;
      fc = s[i];
      if ( (((fc == 45) && ((s[(i + 1)]) >= 46)) && ((s[(i + 1)]) <= 57)) || ((fc >= 48) && (fc <= 57)) ) {
        bool is_double = false;
        sp = i;
        i = 1 + i;
        c = s[i];
        while ((i < __len) && ((((c >= 48) && (c <= 57)) || (c == (46))) || ((i == sp) && ((c == (43)) || (c == (45)))))) {
          if ( c == (46) ) {
            is_double = true;
          }
          i = 1 + i;
          c = s[i];
        }
        ep = i;
        std::shared_ptr<CodeNode> new_num_node =  std::make_shared<CodeNode>(code, sp, ep);
        if ( is_double ) {
          new_num_node->parsed_type = 2;
          new_num_node->value_type = 2;
          new_num_node->double_value = (cpp_str_to_double((std::string( s + sp, ep - sp )))).value;
        } else {
          new_num_node->parsed_type = 3;
          new_num_node->value_type = 3;
          new_num_node->int_value = (cpp_str_to_int((std::string( s + sp, ep - sp )))).value;
        }
        this->insert_node(new_num_node);
        continue;
      }
      if ( fc == 34 ) {
        sp = i + 1;
        ep = sp;
        c = s[i];
        bool must_encode = false;
        while (i < __len) {
          i = 1 + i;
          c = s[i];
          if ( c == 34 ) {
            break;
          }
          if ( c == 92 ) {
            i = 1 + i;
            if ( i < __len ) {
              must_encode = true;
              c = s[i];
            } else {
              break;
            }
          }
        }
        ep = i;
        if ( i < __len ) {
          std::string encoded_str = std::string("");
          if ( must_encode ) {
            const char* orig_str = (std::string( s + sp, ep - sp )).c_str();
            int str_length = strlen( orig_str );
            int ii = 0;
            while (ii < str_length) {
              char cc = orig_str[ii];
              if ( cc == 92 ) {
                char next_ch = orig_str[(ii + 1)];
                switch (next_ch ) { 
                  case 34 : 
                    {
                      encoded_str = encoded_str + (std::string(1, char(34)));
                      break;
                    }
                  case 92 : 
                    {
                      encoded_str = encoded_str + (std::string(1, char(92)));
                      break;
                    }
                  case 47 : 
                    {
                      encoded_str = encoded_str + (std::string(1, char(47)));
                      break;
                    }
                  case 98 : 
                    {
                      encoded_str = encoded_str + (std::string(1, char(8)));
                      break;
                    }
                  case 102 : 
                    {
                      encoded_str = encoded_str + (std::string(1, char(12)));
                      break;
                    }
                  case 110 : 
                    {
                      encoded_str = encoded_str + (std::string(1, char(10)));
                      break;
                    }
                  case 114 : 
                    {
                      encoded_str = encoded_str + (std::string(1, char(13)));
                      break;
                    }
                  case 116 : 
                    {
                      encoded_str = encoded_str + (std::string(1, char(9)));
                      break;
                    }
                  case 117 : 
                    {
                      ii = ii + 4;
                      break;
                    }
                  default: 
                    break;
                }
                ii = ii + 2;
              } else {
                encoded_str = encoded_str + (std::string( orig_str + ii, (1 + ii) - ii ));
                ii = ii + 1;
              }
            }
          }
          std::shared_ptr<CodeNode> new_str_node =  std::make_shared<CodeNode>(code, sp, ep);
          new_str_node->parsed_type = 4;
          new_str_node->value_type = 4;
          if ( must_encode ) {
            new_str_node->string_value = encoded_str;
          } else {
            new_str_node->string_value = std::string( s + sp, ep - sp );
          }
          this->insert_node(new_str_node);
          i = 1 + i;
          continue;
        }
      }
      if ( (((fc == (116)) && ((s[(i + 1)]) == (114))) && ((s[(i + 2)]) == (117))) && ((s[(i + 3)]) == (101)) ) {
        std::shared_ptr<CodeNode> new_true_node =  std::make_shared<CodeNode>(code, sp, sp + 4);
        new_true_node->value_type = 5;
        new_true_node->parsed_type = 5;
        new_true_node->boolean_value = true;
        this->insert_node(new_true_node);
        i = i + 4;
        continue;
      }
      if ( ((((fc == (102)) && ((s[(i + 1)]) == (97))) && ((s[(i + 2)]) == (108))) && ((s[(i + 3)]) == (115))) && ((s[(i + 4)]) == (101)) ) {
        std::shared_ptr<CodeNode> new_f_node =  std::make_shared<CodeNode>(code, sp, sp + 5);
        new_f_node->value_type = 5;
        new_f_node->parsed_type = 5;
        new_f_node->boolean_value = false;
        this->insert_node(new_f_node);
        i = i + 5;
        continue;
      }
      if ( fc == (64) ) {
        i = i + 1;
        sp = i;
        ep = i;
        c = s[i];
        while (((((i < __len) && ((s[i]) > 32)) && (c != 40)) && (c != 41)) && (c != (125))) {
          i = 1 + i;
          c = s[i];
        }
        ep = i;
        if ( (i < __len) && (ep > sp) ) {
          std::shared_ptr<CodeNode> a_node2 =  std::make_shared<CodeNode>(code, sp, ep);
          std::string a_name = std::string( s + sp, ep - sp );
          a_node2->expression = true;
          curr_node  = a_node2;
          parents.push_back( a_node2  );
          i = i + 1;
          paren_cnt = paren_cnt + 1;
          this->parse();
          bool use_first = false;
          if ( 1 == (a_node2->children.size()) ) {
            std::shared_ptr<CodeNode> ch1 = a_node2->children.at(0);
            use_first = ch1->isPrimitive();
          }
          if ( use_first ) {
            std::shared_ptr<CodeNode> theNode = r_m_arr_extract<std::vector<std::shared_ptr<CodeNode>>>(a_node2->children, 0);
            curr_node->props[a_name] = theNode;
          } else {
            curr_node->props[a_name] = a_node2;
          }
          curr_node->prop_keys.push_back( a_name  );
          continue;
        }
      }
      std::vector<std::string> ns_list;
      int last_ns = i;
      int ns_cnt = 1;
      bool vref_had_type_ann = false;
      std::shared_ptr<CodeNode> vref_ann_node;
      int vref_end = i;
      if ( (((((i < __len) && ((s[i]) > 32)) && (c != 58)) && (c != 40)) && (c != 41)) && (c != (125)) ) {
        if ( curr_node->is_block_node == true ) {
          std::shared_ptr<CodeNode> new_expr_node =  std::make_shared<CodeNode>(code, sp, ep);
          new_expr_node->parent  = curr_node;
          new_expr_node->expression = true;
          curr_node->children.push_back( new_expr_node  );
          curr_node  = new_expr_node;
          parents.push_back( new_expr_node  );
          paren_cnt = 1 + paren_cnt;
          this->parse();
          continue;
        }
      }
      int op_c = 0;
      op_c = this->getOperator();
      bool last_was_newline = false;
      if ( op_c > 0 ) {
      } else {
        while ((((((i < __len) && ((s[i]) > 32)) && (c != 58)) && (c != 40)) && (c != 41)) && (c != (125))) {
          if ( i > sp ) {
            int is_opchar = this->isOperator();
            if ( is_opchar > 0 ) {
              break;
            }
          }
          i = 1 + i;
          c = s[i];
          if ( (c == 10) || (c == 13) ) {
            last_was_newline = true;
            break;
          }
          if ( c == (46) ) {
            ns_list.push_back( std::string( s + last_ns, i - last_ns )  );
            last_ns = i + 1;
            ns_cnt = 1 + ns_cnt;
          }
          if ( (i > vref_end) && (c == (64)) ) {
            vref_had_type_ann = true;
            vref_end = i;
            vref_ann_node  = this->parse_raw_annotation();
            c = s[i];
            break;
          }
        }
      }
      ep = i;
      if ( vref_had_type_ann ) {
        ep = vref_end;
      }
      ns_list.push_back( std::string( s + last_ns, ep - last_ns )  );
      c = s[i];
      while (((i < __len) && (c <= 32)) && (false == last_was_newline)) {
        i = 1 + i;
        c = s[i];
        if ( is_block_parent && ((c == 10) || (c == 13)) ) {
          i = i - 1;
          c = s[i];
          had_lf = true;
          break;
        }
      }
      if ( c == 58 ) {
        i = i + 1;
        while ((i < __len) && ((s[i]) <= 32)) {
          i = 1 + i;
        }
        int vt_sp = i;
        int vt_ep = i;
        c = s[i];
        if ( c == (40) ) {
          std::shared_ptr<CodeNode> vann_arr2 = this->parse_raw_annotation();
          vann_arr2->expression = true;
          std::shared_ptr<CodeNode> new_expr_node_1 =  std::make_shared<CodeNode>(code, sp, vt_ep);
          new_expr_node_1->vref = std::string( s + sp, ep - sp );
          new_expr_node_1->ns = ns_list;
          new_expr_node_1->expression_value  = vann_arr2;
          new_expr_node_1->parsed_type = 15;
          new_expr_node_1->value_type = 15;
          if ( vref_had_type_ann ) {
            new_expr_node_1->vref_annotation  = vref_ann_node;
            new_expr_node_1->has_vref_annotation = true;
          }
          curr_node->children.push_back( new_expr_node_1  );
          continue;
        }
        if ( c == (91) ) {
          i = i + 1;
          vt_sp = i;
          int hash_sep = 0;
          bool had_array_type_ann = false;
          c = s[i];
          while (((i < __len) && (c > 32)) && (c != 93)) {
            i = 1 + i;
            c = s[i];
            if ( c == (58) ) {
              hash_sep = i;
            }
            if ( c == (64) ) {
              had_array_type_ann = true;
              break;
            }
          }
          vt_ep = i;
          if ( hash_sep > 0 ) {
            vt_ep = i;
            std::string type_name = std::string( s + (1 + hash_sep), vt_ep - (1 + hash_sep) );
            std::string key_type_name = std::string( s + vt_sp, hash_sep - vt_sp );
            std::shared_ptr<CodeNode> new_hash_node =  std::make_shared<CodeNode>(code, sp, vt_ep);
            new_hash_node->vref = std::string( s + sp, ep - sp );
            new_hash_node->ns = ns_list;
            new_hash_node->parsed_type = 7;
            new_hash_node->value_type = 7;
            new_hash_node->array_type = type_name;
            new_hash_node->key_type = key_type_name;
            if ( vref_had_type_ann ) {
              new_hash_node->vref_annotation  = vref_ann_node;
              new_hash_node->has_vref_annotation = true;
            }
            if ( had_array_type_ann ) {
              std::shared_ptr<CodeNode> vann_hash = this->parse_raw_annotation();
              new_hash_node->type_annotation  = vann_hash;
              new_hash_node->has_type_annotation = true;
              std::cout << std::string("--> parsed HASH TYPE annotation") << std::endl;
            }
            new_hash_node->parent  = curr_node;
            curr_node->children.push_back( new_hash_node  );
            i = 1 + i;
            continue;
          } else {
            vt_ep = i;
            std::string type_name_1 = std::string( s + vt_sp, vt_ep - vt_sp );
            std::shared_ptr<CodeNode> new_arr_node =  std::make_shared<CodeNode>(code, sp, vt_ep);
            new_arr_node->vref = std::string( s + sp, ep - sp );
            new_arr_node->ns = ns_list;
            new_arr_node->parsed_type = 6;
            new_arr_node->value_type = 6;
            new_arr_node->array_type = type_name_1;
            new_arr_node->parent  = curr_node;
            curr_node->children.push_back( new_arr_node  );
            if ( vref_had_type_ann ) {
              new_arr_node->vref_annotation  = vref_ann_node;
              new_arr_node->has_vref_annotation = true;
            }
            if ( had_array_type_ann ) {
              std::shared_ptr<CodeNode> vann_arr = this->parse_raw_annotation();
              new_arr_node->type_annotation  = vann_arr;
              new_arr_node->has_type_annotation = true;
              std::cout << std::string("--> parsed ARRAY TYPE annotation") << std::endl;
            }
            i = 1 + i;
            continue;
          }
        }
        bool had_type_ann = false;
        while (((((((i < __len) && ((s[i]) > 32)) && (c != 58)) && (c != 40)) && (c != 41)) && (c != (125))) && (c != (44))) {
          i = 1 + i;
          c = s[i];
          if ( c == (64) ) {
            had_type_ann = true;
            break;
          }
        }
        if ( i < __len ) {
          vt_ep = i;
          /** unused:  std::string type_name_2 = std::string( s + vt_sp, vt_ep - vt_sp )   **/ ;
          std::shared_ptr<CodeNode> new_ref_node =  std::make_shared<CodeNode>(code, sp, ep);
          new_ref_node->vref = std::string( s + sp, ep - sp );
          new_ref_node->ns = ns_list;
          new_ref_node->parsed_type = 9;
          new_ref_node->value_type = 9;
          new_ref_node->type_name = std::string( s + vt_sp, vt_ep - vt_sp );
          new_ref_node->parent  = curr_node;
          if ( vref_had_type_ann ) {
            new_ref_node->vref_annotation  = vref_ann_node;
            new_ref_node->has_vref_annotation = true;
          }
          curr_node->children.push_back( new_ref_node  );
          if ( had_type_ann ) {
            std::shared_ptr<CodeNode> vann = this->parse_raw_annotation();
            new_ref_node->type_annotation  = vann;
            new_ref_node->has_type_annotation = true;
          }
          continue;
        }
      } else {
        if ( (i < __len) && (ep > sp) ) {
          std::shared_ptr<CodeNode> new_vref_node =  std::make_shared<CodeNode>(code, sp, ep);
          new_vref_node->vref = std::string( s + sp, ep - sp );
          new_vref_node->parsed_type = 9;
          new_vref_node->value_type = 9;
          new_vref_node->ns = ns_list;
          new_vref_node->parent  = curr_node;
          int op_pred = this->getOperatorPred(new_vref_node->vref);
          if ( new_vref_node->vref == std::string(",") ) {
            curr_node->infix_operator = false;
            continue;
          }
          std::shared_ptr<CodeNode> pTarget = curr_node;
          if ( curr_node->infix_operator ) {
            std::shared_ptr<CodeNode> iNode = curr_node->infix_node;
            if ( (op_pred > 0) || (iNode->to_the_right == false) ) {
              pTarget  = iNode;
            } else {
              std::shared_ptr<CodeNode> rn = iNode->right_node;
              new_vref_node->parent  = rn;
              pTarget  = rn;
            }
          }
          pTarget->children.push_back( new_vref_node  );
          if ( vref_had_type_ann ) {
            new_vref_node->vref_annotation  = vref_ann_node;
            new_vref_node->has_vref_annotation = true;
          }
          if ( (i + 1) < __len ) {
            if ( ((s[(i + 1)]) == (40)) || ((s[(i + 0)]) == (40)) ) {
              if ( ((0 == op_pred) && curr_node->infix_operator) && (1 == (curr_node->children.size())) ) {
              }
            }
          }
          if ( ((op_pred > 0) && curr_node->infix_operator) || ((op_pred > 0) && ((curr_node->children.size()) >= 2)) ) {
            if ( (op_pred == 3) && (2 == (curr_node->children.size())) ) {
              std::shared_ptr<CodeNode> n_ch = r_m_arr_extract<std::vector<std::shared_ptr<CodeNode>>>(curr_node->children, 0);
              curr_node->children.push_back( n_ch  );
            } else {
              if ( false == curr_node->infix_operator ) {
                std::shared_ptr<CodeNode> if_node =  std::make_shared<CodeNode>(code, sp, ep);
                curr_node->infix_node  = if_node;
                curr_node->infix_operator = true;
                if_node->infix_subnode = true;
                curr_node->value_type = 0;
                curr_node->expression = true;
                if_node->expression = true;
                int ch_cnt = curr_node->children.size();
                int ii_1 = 0;
                int start_from = ch_cnt - 2;
                std::shared_ptr<CodeNode> keep_nodes =  std::make_shared<CodeNode>(code, sp, ep);
                while (ch_cnt > 0) {
                  std::shared_ptr<CodeNode> n_ch_1 = r_m_arr_extract<std::vector<std::shared_ptr<CodeNode>>>(curr_node->children, 0);
                  std::shared_ptr<CodeNode> p_target = if_node;
                  if ( (ii_1 < start_from) || n_ch_1->infix_subnode ) {
                    p_target = keep_nodes;
                  }
                  p_target->children.push_back( n_ch_1  );
                  ch_cnt = ch_cnt - 1;
                  ii_1 = 1 + ii_1;
                }
                for ( std::vector< std::shared_ptr<CodeNode>>::size_type i_1 = 0; i_1 != keep_nodes->children.size(); i_1++) {
                  std::shared_ptr<CodeNode> keep = keep_nodes->children.at(i_1);
                  curr_node->children.push_back( keep  );
                }
                curr_node->children.push_back( if_node  );
              }
              std::shared_ptr<CodeNode> ifNode = curr_node->infix_node;
              std::shared_ptr<CodeNode> new_op_node =  std::make_shared<CodeNode>(code, sp, ep);
              new_op_node->expression = true;
              new_op_node->parent  = ifNode;
              int until_index = (ifNode->children.size()) - 1;
              bool to_right = false;
              bool just_continue = false;
              if ( (ifNode->operator_pred > 0) && (ifNode->operator_pred < op_pred) ) {
                to_right = true;
              }
              if ( (ifNode->operator_pred > 0) && (ifNode->operator_pred > op_pred) ) {
                ifNode->to_the_right = false;
              }
              if ( (ifNode->operator_pred > 0) && (ifNode->operator_pred == op_pred) ) {
                to_right = ifNode->to_the_right;
              }
              /** unused:  std::shared_ptr<CodeNode> opTarget = ifNode   **/ ;
              if ( to_right ) {
                std::shared_ptr<CodeNode> op_node = r_m_arr_extract<std::vector<std::shared_ptr<CodeNode>>>(ifNode->children, until_index);
                std::shared_ptr<CodeNode> last_value = r_m_arr_extract<std::vector<std::shared_ptr<CodeNode>>>(ifNode->children, (until_index - 1));
                new_op_node->children.push_back( op_node  );
                new_op_node->children.push_back( last_value  );
              } else {
                if ( false == just_continue ) {
                  while (until_index > 0) {
                    std::shared_ptr<CodeNode> what_to_add = r_m_arr_extract<std::vector<std::shared_ptr<CodeNode>>>(ifNode->children, 0);
                    new_op_node->children.push_back( what_to_add  );
                    until_index = until_index - 1;
                  }
                }
              }
              if ( to_right || (false == just_continue) ) {
                ifNode->children.push_back( new_op_node  );
              }
              if ( to_right ) {
                ifNode->right_node  = new_op_node;
                ifNode->to_the_right = true;
              }
              ifNode->operator_pred = op_pred;
              continue;
            }
          }
          continue;
        }
      }
      if ( (c == 41) || (c == (125)) ) {
        if ( ((c == (125)) && is_block_parent) && ((curr_node->children.size()) > 0) ) {
          this->end_expression();
        }
        i = 1 + i;
        paren_cnt = paren_cnt - 1;
        if ( paren_cnt < 0 ) {
          break;
        }
        parents.pop_back();
        if ( curr_node != NULL  ) {
          curr_node->ep = i;
        }
        if ( (parents.size()) > 0 ) {
          curr_node  = parents.at(((parents.size()) - 1));
        } else {
          curr_node  = rootNode;
        }
        break;
      }
      if ( last_i == i ) {
        i = 1 + i;
      }
    }
  }
}

RangerArgMatch::RangerArgMatch( ) {
}

bool  RangerArgMatch::matchArguments( std::shared_ptr<CodeNode> args , std::shared_ptr<CodeNode> callArgs , std::shared_ptr<RangerAppWriterContext> ctx , int firstArgIndex ) {
  /** unused:  std::shared_ptr<CodeNode> fc = callArgs->children.at(0)   **/ ;
  std::vector<std::string> missed_args;
  bool all_matched = true;
  if ( ((args->children.size()) == 0) && ((callArgs->children.size()) > 1) ) {
    return false;
  }
  std::shared_ptr<CodeNode> lastArg;
  for ( std::vector< std::shared_ptr<CodeNode>>::size_type i = 0; i != callArgs->children.size(); i++) {
    std::shared_ptr<CodeNode> callArg = callArgs->children.at(i);
    if ( i == 0 ) {
      continue;
    }
    int arg_index = i - 1;
    if ( arg_index < (args->children.size()) ) {
      lastArg  = args->children.at(arg_index);
    }
    std::shared_ptr<CodeNode> arg = lastArg;
    if ( arg->hasFlag(std::string("ignore")) ) {
      continue;
    }
    if ( arg->hasFlag(std::string("mutable")) ) {
      if ( callArg->hasParamDesc ) {
        std::shared_ptr<RangerAppParamDesc> pa = callArg->paramDesc;
        bool b = pa->nameNode->hasFlag(std::string("mutable"));
        if ( b == false ) {
          missed_args.push_back( std::string("was mutable")  );
          all_matched = false;
        }
      } else {
        all_matched = false;
      }
    }
    if ( arg->hasFlag(std::string("optional")) ) {
      if ( callArg->hasParamDesc ) {
        std::shared_ptr<RangerAppParamDesc> pa_1 = callArg->paramDesc;
        bool b_1 = pa_1->nameNode->hasFlag(std::string("optional"));
        if ( b_1 == false ) {
          missed_args.push_back( std::string("optional was missing")  );
          all_matched = false;
        }
      } else {
        if ( callArg->hasFlag(std::string("optional")) ) {
        } else {
          all_matched = false;
        }
      }
    }
    if ( callArg->hasFlag(std::string("optional")) ) {
      if ( false == arg->hasFlag(std::string("optional")) ) {
        all_matched = false;
      }
    }
    if ( (arg->value_type != 7) && (arg->value_type != 6) ) {
      if ( callArg->eval_type == 11 ) {
        if ( arg->type_name == std::string("enum") ) {
          continue;
        }
      }
      if ( false == this->add(arg->type_name, callArg->eval_type_name, ctx) ) {
        all_matched = false;
        return all_matched;
      }
    }
    if ( arg->value_type == 6 ) {
      if ( false == this->add(arg->array_type, callArg->eval_array_type, ctx) ) {
        std::cout << std::string("--> Failed to add the argument  ") << std::endl;
        all_matched = false;
      }
    }
    if ( arg->value_type == 7 ) {
      if ( false == this->add(arg->key_type, callArg->eval_key_type, ctx) ) {
        std::cout << std::string("--> Failed to add the key argument  ") << std::endl;
        all_matched = false;
      }
      if ( false == this->add(arg->array_type, callArg->eval_array_type, ctx) ) {
        std::cout << std::string("--> Failed to add the key argument  ") << std::endl;
        all_matched = false;
      }
    }
    bool did_match = false;
    if ( this->doesMatch(arg, callArg, ctx) ) {
      did_match = true;
    } else {
      missed_args.push_back( ((std::string("matching arg ") + arg->vref) + std::string(" faileg against ")) + callArg->vref  );
    }
    if ( false == did_match ) {
      all_matched = false;
    }
  }
  return all_matched;
}

bool  RangerArgMatch::add( std::string tplKeyword , std::string typeName , std::shared_ptr<RangerAppWriterContext> ctx ) {
  bool caseMatched = false;
  if( tplKeyword == std::string("string")) {
    caseMatched = true;
    return true;
  }
  if( tplKeyword == std::string("int")) {
    caseMatched = true;
    return true;
  }
  if( tplKeyword == std::string("double")) {
    caseMatched = true;
    return true;
  }
  if( tplKeyword == std::string("boolean")) {
    caseMatched = true;
    return true;
  }
  if( tplKeyword == std::string("enum")) {
    caseMatched = true;
    return true;
  }
  if( tplKeyword == std::string("char")) {
    caseMatched = true;
    return true;
  }
  if( tplKeyword == std::string("charbuffer")) {
    caseMatched = true;
    return true;
  }
  if ( (tplKeyword.length()) > 1 ) {
    return true;
  }
  if ( matched.count(tplKeyword) ) {
    std::string s = (matched[tplKeyword]);
    if ( this->areEqualTypes(s, typeName, ctx) ) {
      return true;
    }
    if ( s == typeName ) {
      return true;
    } else {
      return false;
    }
  }
  matched[tplKeyword] = typeName;
  return true;
}

bool  RangerArgMatch::doesDefsMatch( std::shared_ptr<CodeNode> arg , std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx ) {
  if ( node->value_type == 11 ) {
    if ( arg->type_name == std::string("enum") ) {
      return true;
    } else {
      return false;
    }
  }
  if ( (arg->value_type != 7) && (arg->value_type != 6) ) {
    bool eq = this->areEqualTypes(arg->type_name, node->type_name, ctx);
    std::string t_name = arg->type_name;
    bool caseMatched = false;
    if( t_name == std::string("expression")) {
      caseMatched = true;
      return node->expression;
    }
    if( t_name == std::string("block")) {
      caseMatched = true;
      return node->expression;
    }
    if( t_name == std::string("arguments")) {
      caseMatched = true;
      return node->expression;
    }
    if( t_name == std::string("keyword")) {
      caseMatched = true;
      return node->eval_type == 9;
    }
    if( t_name == std::string("T.name")) {
      caseMatched = true;
      return node->eval_type_name == t_name;
    }
    return eq;
  }
  if ( (arg->value_type == 6) && (node->eval_type == 6) ) {
    bool same_arrays = this->areEqualTypes(arg->array_type, node->array_type, ctx);
    return same_arrays;
  }
  if ( (arg->value_type == 7) && (node->eval_type == 7) ) {
    bool same_arrays_1 = this->areEqualTypes(arg->array_type, node->array_type, ctx);
    bool same_keys = this->areEqualTypes(arg->key_type, node->key_type, ctx);
    return same_arrays_1 && same_keys;
  }
  return false;
}

bool  RangerArgMatch::doesMatch( std::shared_ptr<CodeNode> arg , std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx ) {
  if ( node->value_type == 11 ) {
    if ( arg->type_name == std::string("enum") ) {
      return true;
    } else {
      return false;
    }
  }
  if ( (arg->value_type != 7) && (arg->value_type != 6) ) {
    bool eq = this->areEqualTypes(arg->type_name, node->eval_type_name, ctx);
    std::string t_name = arg->type_name;
    bool caseMatched = false;
    if( t_name == std::string("expression")) {
      caseMatched = true;
      return node->expression;
    }
    if( t_name == std::string("block")) {
      caseMatched = true;
      return node->expression;
    }
    if( t_name == std::string("arguments")) {
      caseMatched = true;
      return node->expression;
    }
    if( t_name == std::string("keyword")) {
      caseMatched = true;
      return node->eval_type == 9;
    }
    if( t_name == std::string("T.name")) {
      caseMatched = true;
      return node->eval_type_name == t_name;
    }
    return eq;
  }
  if ( (arg->value_type == 6) && (node->eval_type == 6) ) {
    bool same_arrays = this->areEqualTypes(arg->array_type, node->eval_array_type, ctx);
    return same_arrays;
  }
  if ( (arg->value_type == 7) && (node->eval_type == 7) ) {
    bool same_arrays_1 = this->areEqualTypes(arg->array_type, node->eval_array_type, ctx);
    bool same_keys = this->areEqualTypes(arg->key_type, node->eval_key_type, ctx);
    return same_arrays_1 && same_keys;
  }
  return false;
}

bool  RangerArgMatch::areEqualTypes( std::string type1 , std::string type2 , std::shared_ptr<RangerAppWriterContext> ctx ) {
  std::string t_name = type1;
  if ( matched.count(type1) ) {
    t_name = (matched[type1]);
  }
  bool caseMatched = false;
  if( t_name == std::string("string")) {
    caseMatched = true;
    return type2 == std::string("string");
  }
  if( t_name == std::string("int")) {
    caseMatched = true;
    return type2 == std::string("int");
  }
  if( t_name == std::string("double")) {
    caseMatched = true;
    return type2 == std::string("double");
  }
  if( t_name == std::string("boolean")) {
    caseMatched = true;
    return type2 == std::string("boolean");
  }
  if( t_name == std::string("enum")) {
    caseMatched = true;
    return type2 == std::string("enum");
  }
  if( t_name == std::string("char")) {
    caseMatched = true;
    return type2 == std::string("char");
  }
  if( t_name == std::string("charbuffer")) {
    caseMatched = true;
    return type2 == std::string("charbuffer");
  }
  if ( ctx->isDefinedClass(t_name) && ctx->isDefinedClass(type2) ) {
    std::shared_ptr<RangerAppClassDesc> c1 = ctx->findClass(t_name);
    std::shared_ptr<RangerAppClassDesc> c2 = ctx->findClass(type2);
    if ( c1->isSameOrParentClass(type2, ctx) ) {
      return true;
    }
    if ( c2->isSameOrParentClass(t_name, ctx) ) {
      return true;
    }
  } else {
    if ( ctx->isDefinedClass(t_name) ) {
      std::shared_ptr<RangerAppClassDesc> c1_1 = ctx->findClass(t_name);
      if ( c1_1->isSameOrParentClass(type2, ctx) ) {
        return true;
      }
    }
  }
  return t_name == type2;
}

std::string  RangerArgMatch::getTypeName( std::string n ) {
  std::string t_name = n;
  if ( matched.count(t_name) ) {
    t_name = (matched[t_name]);
  }
  if ( 0 == (t_name.length()) ) {
    return std::string("");
  }
  return t_name;
}

int  RangerArgMatch::getType( std::string n ) {
  std::string t_name = n;
  if ( matched.count(t_name) ) {
    t_name = (matched[t_name]);
  }
  if ( 0 == (t_name.length()) ) {
    return 0;
  }
  bool caseMatched = false;
  if( t_name == std::string("expression")) {
    caseMatched = true;
    return 14;
  }
  if( t_name == std::string("block")) {
    caseMatched = true;
    return 14;
  }
  if( t_name == std::string("arguments")) {
    caseMatched = true;
    return 14;
  }
  if( t_name == std::string("string")) {
    caseMatched = true;
    return 4;
  }
  if( t_name == std::string("int")) {
    caseMatched = true;
    return 3;
  }
  if( t_name == std::string("char")) {
    caseMatched = true;
    return 12;
  }
  if( t_name == std::string("charbuffer")) {
    caseMatched = true;
    return 13;
  }
  if( t_name == std::string("boolean")) {
    caseMatched = true;
    return 5;
  }
  if( t_name == std::string("double")) {
    caseMatched = true;
    return 2;
  }
  if( t_name == std::string("enum")) {
    caseMatched = true;
    return 11;
  }
  return 8;
}

bool  RangerArgMatch::setRvBasedOn( std::shared_ptr<CodeNode> arg , std::shared_ptr<CodeNode> node ) {
  if ( arg->hasFlag(std::string("optional")) ) {
    node->setFlag(std::string("optional"));
  }
  if ( (arg->value_type != 7) && (arg->value_type != 6) ) {
    node->eval_type = this->getType(arg->type_name);
    node->eval_type_name = this->getTypeName(arg->type_name);
    return true;
  }
  if ( arg->value_type == 6 ) {
    node->eval_type = 6;
    node->eval_array_type = this->getTypeName(arg->array_type);
    return true;
  }
  if ( arg->value_type == 7 ) {
    node->eval_type = 7;
    node->eval_key_type = this->getTypeName(arg->key_type);
    node->eval_array_type = this->getTypeName(arg->array_type);
    return true;
  }
  return false;
}

ClassJoinPoint::ClassJoinPoint( ) {
}

RangerFlowParser::RangerFlowParser( ) {
}

void  RangerFlowParser::cmdEnum( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr ) {
  std::shared_ptr<CodeNode> fNameNode = node->children.at(1);
  std::shared_ptr<CodeNode> enumList = node->children.at(2);
  std::shared_ptr<RangerAppEnum> new_enum =  std::make_shared<RangerAppEnum>();
  for ( std::vector< std::shared_ptr<CodeNode>>::size_type i = 0; i != enumList->children.size(); i++) {
    std::shared_ptr<CodeNode> item = enumList->children.at(i);
    new_enum->add(item->vref);
  }
  ctx->definedEnums[fNameNode->vref] = new_enum;
}

void  RangerFlowParser::initStdCommands() {
}

std::shared_ptr<CodeNode>  RangerFlowParser::findLanguageOper( std::shared_ptr<CodeNode> details , std::shared_ptr<RangerAppWriterContext> ctx ) {
  std::string langName = ctx->getTargetLang();
  for ( std::vector< std::shared_ptr<CodeNode>>::size_type i = 0; i != details->children.size(); i++) {
    std::shared_ptr<CodeNode> det = details->children.at(i);
    if ( (det->children.size()) > 0 ) {
      std::shared_ptr<CodeNode> fc = det->children.at(0);
      if ( fc->vref == std::string("templates") ) {
        std::shared_ptr<CodeNode> tplList = det->children.at(1);
        for ( std::vector< std::shared_ptr<CodeNode>>::size_type i_1 = 0; i_1 != tplList->children.size(); i_1++) {
          std::shared_ptr<CodeNode> tpl = tplList->children.at(i_1);
          std::shared_ptr<CodeNode> tplName = tpl->getFirst();
          std::shared_ptr<CodeNode> tplImpl;
          tplImpl  = tpl->getSecond();
          if ( (tplName->vref != std::string("*")) && (tplName->vref != langName) ) {
            continue;
          }
          std::shared_ptr<CodeNode> rv;
          rv  = tpl;
          return rv;
        }
      }
    }
  }
  std::shared_ptr<CodeNode> none;
  return none;
}

std::shared_ptr<CodeNode>  RangerFlowParser::buildMacro( std::shared_ptr<CodeNode> langOper , std::shared_ptr<CodeNode> args , std::shared_ptr<RangerAppWriterContext> ctx ) {
  std::shared_ptr<RangerAppWriterContext> subCtx = ctx->fork();
  std::shared_ptr<CodeWriter> wr =  std::make_shared<CodeWriter>();
  std::shared_ptr<LiveCompiler> lcc =  std::make_shared<LiveCompiler>();
  lcc->langWriter  =  std::make_shared<RangerRangerClassWriter>();
  lcc->langWriter->compiler  = lcc;
  subCtx->targetLangName = std::string("ranger");
  subCtx->restartExpressionLevel();
  std::shared_ptr<CodeNode> macroNode = langOper;
  std::shared_ptr<CodeNode> cmdList = macroNode->getSecond();
  lcc->walkCommandList(cmdList, args, subCtx, wr);
  std::string lang_str = wr->getCode();
  std::shared_ptr<SourceCode> lang_code =  std::make_shared<SourceCode>(lang_str);
  lang_code->filename = (std::string("<macro ") + macroNode->vref) + std::string(">");
  std::shared_ptr<RangerLispParser> lang_parser =  std::make_shared<RangerLispParser>(lang_code);
  lang_parser->parse();
  std::shared_ptr<CodeNode> node = lang_parser->rootNode;
  return node;
}

bool  RangerFlowParser::stdParamMatch( std::shared_ptr<CodeNode> callArgs , std::shared_ptr<RangerAppWriterContext> inCtx , std::shared_ptr<CodeWriter> wr ) {
  stdCommands  = inCtx->getStdCommands();
  std::shared_ptr<CodeNode> callFnName = callArgs->getFirst();
  std::shared_ptr<CodeNode> cmds = stdCommands;
  bool some_matched = false;
  /** unused:  bool found_fn = false   **/ ;
  /** unused:  std::vector<std::string> missed_args   **/ ;
  std::shared_ptr<RangerAppWriterContext> ctx = inCtx->fork();
  /** unused:  std::string lang_name = ctx->getTargetLang()   **/ ;
  bool expects_error = false;
  int err_cnt = inCtx->getErrorCount();
  if ( callArgs->hasBooleanProperty(std::string("error")) ) {
    expects_error = true;
  }
  for ( std::vector< std::shared_ptr<CodeNode>>::size_type main_index = 0; main_index != cmds->children.size(); main_index++) {
    std::shared_ptr<CodeNode> ch = cmds->children.at(main_index);
    std::shared_ptr<CodeNode> fc = ch->getFirst();
    std::shared_ptr<CodeNode> nameNode = ch->getSecond();
    std::shared_ptr<CodeNode> args = ch->getThird();
    if ( callFnName->vref == fc->vref ) {
      /** unused:  int line_index = callArgs->getLine()   **/ ;
      int callerArgCnt = (callArgs->children.size()) - 1;
      int fnArgCnt = args->children.size();
      bool has_eval_ctx = false;
      bool is_macro = false;
      if ( nameNode->hasFlag(std::string("newcontext")) ) {
        ctx = inCtx->fork();
        has_eval_ctx = true;
      }
      bool expanding_node = nameNode->hasFlag(std::string("expands"));
      if ( (callerArgCnt == fnArgCnt) || expanding_node ) {
        std::shared_ptr<CodeNode> details_list = ch->children.at(3);
        std::shared_ptr<CodeNode> langOper = this->findLanguageOper(details_list, ctx);
        if ( langOper == NULL ) {
          continue;
        }
        if ( langOper->hasBooleanProperty(std::string("macro")) ) {
          is_macro = true;
        }
        std::shared_ptr<RangerArgMatch> match =  std::make_shared<RangerArgMatch>();
        int last_walked = 0;
        for ( std::vector< std::shared_ptr<CodeNode>>::size_type i = 0; i != args->children.size(); i++) {
          std::shared_ptr<CodeNode> arg = args->children.at(i);
          std::shared_ptr<CodeNode> callArg = callArgs->children.at((i + 1));
          if ( arg->hasFlag(std::string("define")) ) {
            std::shared_ptr<RangerAppParamDesc> p =  std::make_shared<RangerAppParamDesc>();
            p->name = callArg->vref;
            p->value_type = arg->value_type;
            p->node  = callArg;
            p->nameNode  = callArg;
            p->is_optional = false;
            p->init_cnt = 1;
            ctx->defineVariable(p->name, p);
            callArg->hasParamDesc = true;
            callArg->ownParamDesc  = p;
            callArg->paramDesc  = p;
            if ( (callArg->type_name.length()) == 0 ) {
              callArg->type_name = arg->type_name;
              callArg->value_type = arg->value_type;
            }
            callArg->eval_type = arg->value_type;
            callArg->eval_type_name = arg->type_name;
          }
          if ( arg->hasFlag(std::string("ignore")) ) {
            continue;
          }
          ctx->setInExpr();
          last_walked = i + 1;
          this->WalkNode(callArg, ctx, wr);
          ctx->unsetInExpr();
        }
        if ( expanding_node ) {
          for ( std::vector< std::shared_ptr<CodeNode>>::size_type i2 = 0; i2 != callArgs->children.size(); i2++) {
            std::shared_ptr<CodeNode> caCh = callArgs->children.at(i2);
            if ( i2 > last_walked ) {
              ctx->setInExpr();
              this->WalkNode(caCh, ctx, wr);
              ctx->unsetInExpr();
            }
          }
        }
        bool all_matched = match->matchArguments(args, callArgs, ctx, 1);
        if ( all_matched ) {
          if ( is_macro ) {
            std::shared_ptr<CodeNode> macroNode = this->buildMacro(langOper, callArgs, ctx);
            int arg_len = callArgs->children.size();
            while (arg_len > 0) {
              callArgs->children.pop_back();
              arg_len = arg_len - 1;
            }
            callArgs->children.push_back( macroNode  );
            macroNode->parent  = callArgs;
            this->WalkNode(macroNode, ctx, wr);
            match->setRvBasedOn(nameNode, callArgs);
            return true;
          }
          if ( nameNode->hasFlag(std::string("moves")) ) {
            std::shared_ptr<CodeNode> moves_opt = nameNode->getFlag(std::string("moves"));
            std::shared_ptr<CodeNode> moves = moves_opt;
            std::shared_ptr<CodeNode> ann = moves->vref_annotation;
            std::shared_ptr<CodeNode> from = ann->getFirst();
            std::shared_ptr<CodeNode> to = ann->getSecond();
            std::shared_ptr<CodeNode> cA = callArgs->children.at(from->int_value);
            std::shared_ptr<CodeNode> cA2 = callArgs->children.at(to->int_value);
            if ( cA->hasParamDesc ) {
              std::shared_ptr<RangerAppParamDesc> pp = cA->paramDesc;
              std::shared_ptr<RangerAppParamDesc> pp2 = cA2->paramDesc;
              pp->moveRefTo(callArgs, pp2, ctx);
            }
          }
          if ( nameNode->hasFlag(std::string("returns")) ) {
            std::shared_ptr<RangerAppFunctionDesc> activeFn = ctx->getCurrentMethod();
            if ( activeFn->nameNode->type_name != std::string("void") ) {
              if ( (callArgs->children.size()) < 2 ) {
                ctx->addError(callArgs, std::string(" missing return value !!!"));
              } else {
                std::shared_ptr<CodeNode> returnedValue = callArgs->children.at(1);
                if ( match->doesMatch((activeFn->nameNode), returnedValue, ctx) == false ) {
                  if ( activeFn->nameNode->ifNoTypeSetToEvalTypeOf(returnedValue) ) {
                  } else {
                    ctx->addError(returnedValue, std::string("invalid return value type!!!"));
                  }
                }
                std::shared_ptr<CodeNode> argNode = activeFn->nameNode;
                if ( returnedValue->hasFlag(std::string("optional")) ) {
                  if ( false == argNode->hasFlag(std::string("optional")) ) {
                    ctx->addError(callArgs, std::string("function return value optionality does not match, expected non-optional return value, optional given at ") + argNode->getCode());
                  }
                }
                if ( argNode->hasFlag(std::string("optional")) ) {
                  if ( false == returnedValue->hasFlag(std::string("optional")) ) {
                    ctx->addError(callArgs, std::string("function return value optionality does not match, expected optional return value ") + argNode->getCode());
                  }
                }
                std::shared_ptr<RangerAppParamDesc> pp_1 = returnedValue->paramDesc;
                if ( pp_1 != NULL  ) {
                  pp_1->moveRefTo(callArgs, activeFn, ctx);
                }
              }
            }
            if ( callArgs->parent == NULL ) {
              ctx->addError(callArgs, std::string("did not have parent"));
              std::cout << std::string("no parent => ") + callArgs->getCode() << std::endl;
            }
            callArgs->parent->didReturnAtIndex = r_arr_index_of<std::shared_ptr<CodeNode>>(callArgs->parent->children, callArgs);
          }
          if ( nameNode->hasFlag(std::string("returns")) == false ) {
            match->setRvBasedOn(nameNode, callArgs);
          }
          if ( has_eval_ctx ) {
            callArgs->evalCtx  = ctx;
          }
          std::shared_ptr<CodeNode> nodeP = callArgs->parent;
          if ( nodeP != NULL  ) {
          } else {
          }
          /** unused:  std::string sig = nameNode->buildTypeSignatureUsingMatch(match)   **/ ;
          some_matched = true;
          callArgs->has_operator = true;
          callArgs->op_index = main_index;
          for ( std::vector< std::shared_ptr<CodeNode>>::size_type arg_index = 0; arg_index != args->children.size(); arg_index++) {
            std::shared_ptr<CodeNode> arg_1 = args->children.at(arg_index);
            if ( arg_1->has_vref_annotation ) {
              std::shared_ptr<CodeNode> anns = arg_1->vref_annotation;
              for ( std::vector< std::shared_ptr<CodeNode>>::size_type i_1 = 0; i_1 != anns->children.size(); i_1++) {
                std::shared_ptr<CodeNode> ann_1 = anns->children.at(i_1);
                if ( ann_1->vref == std::string("mutates") ) {
                  std::shared_ptr<CodeNode> theArg = callArgs->children.at((arg_index + 1));
                  if ( theArg->hasParamDesc ) {
                    theArg->paramDesc->set_cnt = theArg->paramDesc->set_cnt + 1;
                  }
                }
              }
            }
          }
          break;
        }
      }
    }
  }
  if ( some_matched == false ) {
    ctx->addError(callArgs, std::string("stdMatch -> Could not match argument types for ") + callFnName->vref);
  }
  if ( expects_error ) {
    int cnt_now = ctx->getErrorCount();
    if ( cnt_now == err_cnt ) {
      ctx->addParserError(callArgs, ((std::string("LANGUAGE_PARSER_ERROR: expected generated error, err counts : ") + std::to_string(err_cnt)) + std::string(" : ")) + std::to_string(cnt_now));
    }
  } else {
    int cnt_now_1 = ctx->getErrorCount();
    if ( cnt_now_1 > err_cnt ) {
      ctx->addParserError(callArgs, ((std::string("LANGUAGE_PARSER_ERROR: did not expect generated error, err counts : ") + std::to_string(err_cnt)) + std::string(" : ")) + std::to_string(cnt_now_1));
    }
  }
  return true;
}

bool  RangerFlowParser::cmdImport( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr ) {
  return false;
}

std::string  RangerFlowParser::getThisName() {
  return std::string("this");
}

void  RangerFlowParser::WriteThisVar( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr ) {
}

void  RangerFlowParser::WriteVRef( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr ) {
  if ( node->vref == std::string("_") ) {
    return;
  }
  std::string rootObjName = node->ns.at(0);
  if ( ctx->isInStatic() ) {
    if ( rootObjName == std::string("this") ) {
      ctx->addError(node, std::string("This can not be used in static context"));
    }
  }
  if ( ctx->isEnumDefined(rootObjName) ) {
    std::string enumName = node->ns.at(1);
    std::shared_ptr<RangerAppEnum> ee = ctx->getEnum(rootObjName);
    std::shared_ptr<RangerAppEnum> e = ee;
    if ( e->values.count(enumName) ) {
      node->eval_type = 11;
      node->eval_type_name = rootObjName;
      node->int_value = (cpp_get_map_int_value<std::string>(e->values, enumName)).value;
    } else {
      ctx->addError(node, ((std::string("Undefined Enum ") + rootObjName) + std::string(".")) + enumName);
      node->eval_type = 1;
    }
    return;
  }
  if ( node->vref == this->getThisName() ) {
    std::shared_ptr<RangerAppClassDesc> cd = ctx->getCurrentClass();
    std::shared_ptr<RangerAppClassDesc> thisClassDesc = cd;
    node->eval_type = 8;
    node->eval_type_name = thisClassDesc->name;
    node->ref_type = 4;
    return;
  }
  if ( ctx->isCapturing() ) {
    if ( ctx->isVarDefined(rootObjName) ) {
      if ( ctx->isLocalToCapture(rootObjName) == false ) {
        std::shared_ptr<RangerAppParamDesc> captDef = ctx->getVariableDef(rootObjName);
        std::shared_ptr<RangerAppClassDesc> cd_1 = ctx->getCurrentClass();
        cd_1->capturedLocals.push_back( captDef  );
        captDef->is_captured = true;
        ctx->addCapturedVariable(rootObjName);
      }
    }
  }
  if ( (rootObjName == std::string("this")) || ctx->isVarDefined(rootObjName) ) {
    /** unused:  std::shared_ptr<RangerAppParamDesc> vDef2 = ctx->getVariableDef(rootObjName)   **/ ;
    /** unused:  std::shared_ptr<RangerAppFunctionDesc> activeFn = ctx->getCurrentMethod()   **/ ;
    std::shared_ptr<RangerAppParamDesc> vDef = this->findParamDesc(node, ctx, wr);
    if ( vDef != NULL  ) {
      node->hasParamDesc = true;
      node->ownParamDesc  = vDef;
      node->paramDesc  = vDef;
      vDef->ref_cnt = 1 + vDef->ref_cnt;
      std::shared_ptr<CodeNode> vNameNode = vDef->nameNode;
      if ( vNameNode != NULL  ) {
        if ( vNameNode->hasFlag(std::string("optional")) ) {
          node->setFlag(std::string("optional"));
        }
        node->eval_type = vNameNode->typeNameAsType(ctx);
        node->eval_type_name = vNameNode->type_name;
        if ( vNameNode->value_type == 6 ) {
          node->eval_type = 6;
          node->eval_array_type = vNameNode->array_type;
        }
        if ( vNameNode->value_type == 7 ) {
          node->eval_type = 7;
          node->eval_key_type = vNameNode->key_type;
          node->eval_array_type = vNameNode->array_type;
        }
      }
    }
  } else {
    bool class_or_this = rootObjName == this->getThisName();
    if ( ctx->isDefinedClass(rootObjName) ) {
      class_or_this = true;
      node->eval_type = 23;
      node->eval_type_name = rootObjName;
    }
    if ( ctx->hasTemplateNode(rootObjName) ) {
      class_or_this = true;
    }
    if ( false == class_or_this ) {
      std::shared_ptr<RangerAppClassDesc> udesc = ctx->getCurrentClass();
      std::shared_ptr<RangerAppClassDesc> desc = udesc;
      ctx->addError(node, ((std::string("Undefined variable ") + rootObjName) + std::string(" in class ")) + desc->name);
    }
    return;
  }
}

void  RangerFlowParser::CreateClass( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr ) {
}

void  RangerFlowParser::DefineVar( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr ) {
}

void  RangerFlowParser::WriteComment( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr ) {
}

void  RangerFlowParser::cmdLog( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr ) {
}

void  RangerFlowParser::cmdDoc( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr ) {
}

void  RangerFlowParser::cmdGitDoc( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr ) {
}

void  RangerFlowParser::cmdNative( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr ) {
}

void  RangerFlowParser::LangInit( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr ) {
}

std::string  RangerFlowParser::getWriterLang() {
  return std::string("_");
}

void  RangerFlowParser::StartCodeWriting( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr ) {
}

void  RangerFlowParser::Constructor( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr ) {
  this->shouldHaveChildCnt(3, node, ctx, std::string("Method expexts four arguments"));
  /** unused:  std::shared_ptr<CodeNode> cn = node->children.at(1)   **/ ;
  std::shared_ptr<CodeNode> fnBody = node->children.at(2);
  std::shared_ptr<RangerAppClassDesc> udesc = ctx->getCurrentClass();
  std::shared_ptr<RangerAppClassDesc> desc = udesc;
  std::shared_ptr<RangerAppFunctionDesc> m = desc->constructor_fn;
  std::shared_ptr<RangerAppWriterContext> subCtx = m->fnCtx;
  subCtx->is_function = true;
  subCtx->currentMethod  = m;
  subCtx->setInMethod();
  for ( std::vector< std::shared_ptr<RangerAppParamDesc>>::size_type i = 0; i != m->params.size(); i++) {
    std::shared_ptr<RangerAppParamDesc> v = m->params.at(i);
    subCtx->defineVariable(v->name, v);
  }
  this->WalkNodeChildren(fnBody, subCtx, wr);
  subCtx->unsetInMethod();
  if ( fnBody->didReturnAtIndex >= 0 ) {
    ctx->addError(node, std::string("constructor should not return any values!"));
  }
  for ( std::vector< std::string>::size_type i_1 = 0; i_1 != subCtx->localVarNames.size(); i_1++) {
    std::string n = subCtx->localVarNames.at(i_1);
    std::shared_ptr<RangerAppParamDesc> p = subCtx->localVariables[n];
    if ( p->set_cnt > 0 ) {
      std::shared_ptr<CodeNode> defNode = p->node;
      defNode->setFlag(std::string("mutable"));
      std::shared_ptr<CodeNode> nNode = p->nameNode;
      nNode->setFlag(std::string("mutable"));
    }
  }
}

void  RangerFlowParser::WriteScalarValue( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr ) {
  node->eval_type = node->value_type;
  switch (node->value_type ) { 
    case 2 : 
      {
        node->eval_type_name = std::string("double");
        break;
      }
    case 4 : 
      {
        node->eval_type_name = std::string("string");
        break;
      }
    case 3 : 
      {
        node->eval_type_name = std::string("int");
        break;
      }
    case 5 : 
      {
        node->eval_type_name = std::string("boolean");
        break;
      }
  }
}

void  RangerFlowParser::buildGenericClass( std::shared_ptr<CodeNode> tpl , std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr ) {
  std::shared_ptr<RangerAppWriterContext> root = ctx->getRoot();
  std::shared_ptr<CodeNode> cn = tpl->getSecond();
  std::shared_ptr<CodeNode> newName = node->getSecond();
  std::shared_ptr<CodeNode> tplArgs = cn->vref_annotation;
  std::shared_ptr<CodeNode> givenArgs = newName->vref_annotation;
  std::string sign = cn->vref + givenArgs->getCode();
  if ( root->classSignatures.count(sign) ) {
    return;
  }
  std::cout << std::string("could build generic class... ") + cn->vref << std::endl;
  std::shared_ptr<RangerArgMatch> match =  std::make_shared<RangerArgMatch>();
  for ( std::vector< std::shared_ptr<CodeNode>>::size_type i = 0; i != tplArgs->children.size(); i++) {
    std::shared_ptr<CodeNode> arg = tplArgs->children.at(i);
    std::shared_ptr<CodeNode> given = givenArgs->children.at(i);
    std::cout << ((std::string(" setting ") + arg->vref) + std::string(" => ")) + given->vref << std::endl;
    if ( false == match->add(arg->vref, given->vref, ctx) ) {
      std::cout << std::string("set failed!") << std::endl;
    } else {
      std::cout << std::string("set OK") << std::endl;
    }
    std::cout << std::string(" T == ") + match->getTypeName(arg->vref) << std::endl;
  }
  std::cout << std::string(" T == ") + match->getTypeName(std::string("T")) << std::endl;
  std::shared_ptr<CodeNode> newClassNode = tpl->rebuildWithType(match, false);
  std::cout << std::string("build done") << std::endl;
  std::cout << newClassNode->getCode() << std::endl;
  std::string sign_2 = cn->vref + givenArgs->getCode();
  std::cout << std::string("signature ==> ") + sign_2 << std::endl;
  std::shared_ptr<CodeNode> cName = newClassNode->getSecond();
  std::string friendlyName = root->createSignature(cn->vref, sign_2);
  std::cout << std::string("class common name => ") + friendlyName << std::endl;
  cName->vref = friendlyName;
  cName->has_vref_annotation = false;
  std::cout << newClassNode->getCode() << std::endl;
  this->WalkCollectMethods(newClassNode, ctx, wr);
  this->WalkNode(newClassNode, root, wr);
  std::cout << std::string("the class collected the methods...") << std::endl;
}

void  RangerFlowParser::cmdNew( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr ) {
  if ( (node->children.size()) < 2 ) {
    ctx->addError(node, std::string("the new operator expects at lest two arguments"));
    return;
  }
  if ( (node->children.size()) < 3 ) {
    std::shared_ptr<CodeNode> expr =  std::make_shared<CodeNode>(node->code, node->sp, node->ep);
    expr->expression = true;
    node->children.push_back( expr  );
  }
  std::shared_ptr<CodeNode> obj = node->getSecond();
  std::shared_ptr<CodeNode> params = node->getThird();
  std::shared_ptr<RangerAppClassDesc> currC;
  bool b_template = false;
  bool expects_error = false;
  int err_cnt = ctx->getErrorCount();
  if ( node->hasBooleanProperty(std::string("error")) ) {
    expects_error = true;
  }
  if ( ctx->hasTemplateNode(obj->vref) ) {
    std::cout << std::string(" ==> template class") << std::endl;
    b_template = true;
    std::shared_ptr<CodeNode> tpl = ctx->findTemplateNode(obj->vref);
    if ( obj->has_vref_annotation ) {
      std::cout << std::string("generic class OK") << std::endl;
      this->buildGenericClass(tpl, node, ctx, wr);
      currC  = ctx->findClassWithSign(obj);
      if ( currC != NULL  ) {
        std::cout << std::string("@@ class was found ") + obj->vref << std::endl;
      }
    } else {
      ctx->addError(node, std::string("generic class requires a type annotation"));
      return;
    }
  }
  this->WalkNode(obj, ctx, wr);
  for ( std::vector< std::shared_ptr<CodeNode>>::size_type i = 0; i != params->children.size(); i++) {
    std::shared_ptr<CodeNode> arg = params->children.at(i);
    ctx->setInExpr();
    this->WalkNode(arg, ctx, wr);
    ctx->unsetInExpr();
  }
  node->eval_type = 8;
  node->eval_type_name = obj->vref;
  if ( b_template == false ) {
    currC  = ctx->findClass(obj->vref);
  }
  node->hasNewOper = true;
  node->clDesc  = currC;
  std::shared_ptr<RangerAppFunctionDesc> fnDescr = currC->constructor_fn;
  if ( fnDescr != NULL  ) {
    for ( std::vector< std::shared_ptr<RangerAppParamDesc>>::size_type i_1 = 0; i_1 != fnDescr->params.size(); i_1++) {
      std::shared_ptr<RangerAppParamDesc> param = fnDescr->params.at(i_1);
      bool has_default = false;
      if ( param->nameNode->hasFlag(std::string("default")) ) {
        has_default = true;
      }
      if ( (params->children.size()) <= i_1 ) {
        if ( has_default ) {
          continue;
        }
        ctx->addError(node, std::string("Missing arguments for function"));
        ctx->addError(param->nameNode, std::string("To fix the previous error: Check original function declaration"));
      }
      std::shared_ptr<CodeNode> argNode = params->children.at(i_1);
      if ( false == this->areEqualTypes((param->nameNode), argNode, ctx) ) {
        ctx->addError(argNode, (std::string("ERROR, invalid argument type for ") + currC->name) + std::string(" constructor "));
      }
      std::shared_ptr<CodeNode> pNode = param->nameNode;
      if ( pNode->hasFlag(std::string("optional")) ) {
        if ( false == argNode->hasFlag(std::string("optional")) ) {
          ctx->addError(node, std::string("new parameter optionality does not match, expected optional parameter") + argNode->getCode());
        }
      }
      if ( argNode->hasFlag(std::string("optional")) ) {
        if ( false == pNode->hasFlag(std::string("optional")) ) {
          ctx->addError(node, std::string("new parameter optionality does not match, expected non-optional, optional given") + argNode->getCode());
        }
      }
    }
  }
  if ( expects_error ) {
    int cnt_now = ctx->getErrorCount();
    if ( cnt_now == err_cnt ) {
      ctx->addParserError(node, ((std::string("LANGUAGE_PARSER_ERROR: expected generated error, err counts : ") + std::to_string(err_cnt)) + std::string(" : ")) + std::to_string(cnt_now));
    }
  } else {
    int cnt_now_1 = ctx->getErrorCount();
    if ( cnt_now_1 > err_cnt ) {
      ctx->addParserError(node, ((std::string("LANGUAGE_PARSER_ERROR: did not expect generated error, err counts : ") + std::to_string(err_cnt)) + std::string(" : ")) + std::to_string(cnt_now_1));
    }
  }
}

std::vector<std::shared_ptr<CodeNode>>  RangerFlowParser::transformParams( std::vector<std::shared_ptr<CodeNode>> list , std::vector<std::shared_ptr<RangerAppParamDesc>> fnArgs , std::shared_ptr<RangerAppWriterContext> ctx ) {
  std::vector<std::shared_ptr<CodeNode>> res;
  for ( std::vector< std::shared_ptr<CodeNode>>::size_type i = 0; i != list.size(); i++) {
    std::shared_ptr<CodeNode> item = list.at(i);
    if ( item->is_block_node ) {
      /** unused:  std::shared_ptr<CodeNode> newNode =  std::make_shared<CodeNode>(item->code, item->sp, item->ep)   **/ ;
      std::shared_ptr<RangerAppParamDesc> fnArg = fnArgs.at(i);
      std::shared_ptr<CodeNode> nn = fnArg->nameNode;
      if ( nn->expression_value == NULL ) {
        ctx->addError(item, std::string("Parameter is not lambda expression"));
        break;
      }
      std::shared_ptr<CodeNode> fnDef = nn->expression_value;
      std::shared_ptr<RangerArgMatch> match =  std::make_shared<RangerArgMatch>();
      std::shared_ptr<CodeNode> copyOf = fnDef->rebuildWithType(match, false);
      std::shared_ptr<CodeNode> fc = copyOf->children.at(0);
      fc->vref = std::string("fun");
      std::shared_ptr<CodeNode> itemCopy = item->rebuildWithType(match, false);
      copyOf->children.push_back( itemCopy  );
      int cnt = item->children.size();
      while (cnt > 0) {
        item->children.pop_back();
        cnt = cnt - 1;
      }
      for ( std::vector< std::shared_ptr<CodeNode>>::size_type i_1 = 0; i_1 != copyOf->children.size(); i_1++) {
        std::shared_ptr<CodeNode> ch = copyOf->children.at(i_1);
        item->children.push_back( ch  );
      }
    }
    res.push_back( item  );
  }
  return res;
}

bool  RangerFlowParser::cmdLocalCall( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr ) {
  std::shared_ptr<CodeNode> fnNode = node->getFirst();
  std::shared_ptr<RangerAppClassDesc> udesc = ctx->getCurrentClass();
  std::shared_ptr<RangerAppClassDesc> desc = udesc;
  bool expects_error = false;
  int err_cnt = ctx->getErrorCount();
  if ( node->hasBooleanProperty(std::string("error")) ) {
    expects_error = true;
  }
  if ( (fnNode->ns.size()) > 1 ) {
    std::string rootName = fnNode->ns.at(0);
    std::shared_ptr<RangerAppParamDesc> vDef2 = ctx->getVariableDef(rootName);
    if ( ((rootName != std::string("this")) && (vDef2->init_cnt == 0)) && (vDef2->set_cnt == 0) ) {
      if ( (vDef2->is_class_variable == false) && (ctx->isDefinedClass(rootName) == false) ) {
        ctx->addError(node, std::string("Call to uninitialized object ") + rootName);
      }
    }
    std::shared_ptr<RangerAppFunctionDesc> vFnDef = this->findFunctionDesc(fnNode, ctx, wr);
    if ( vFnDef != NULL  ) {
      vFnDef->ref_cnt = vFnDef->ref_cnt + 1;
      std::shared_ptr<RangerAppWriterContext> subCtx = ctx->fork();
      node->hasFnCall = true;
      node->fnDesc  = vFnDef;
      std::shared_ptr<RangerAppParamDesc> p =  std::make_shared<RangerAppParamDesc>();
      p->name = fnNode->vref;
      p->value_type = fnNode->value_type;
      p->node  = fnNode;
      p->nameNode  = fnNode;
      p->varType = 10;
      subCtx->defineVariable(p->name, p);
      this->WalkNode(fnNode, subCtx, wr);
      std::shared_ptr<CodeNode> callParams = node->children.at(1);
      std::vector<std::shared_ptr<CodeNode>> nodeList = this->transformParams(callParams->children, vFnDef->params, subCtx);
      for ( std::vector< std::shared_ptr<CodeNode>>::size_type i = 0; i != nodeList.size(); i++) {
        std::shared_ptr<CodeNode> arg = nodeList.at(i);
        ctx->setInExpr();
        this->WalkNode(arg, subCtx, wr);
        ctx->unsetInExpr();
        std::shared_ptr<RangerAppParamDesc> fnArg = vFnDef->params.at(i);
        std::shared_ptr<RangerAppParamDesc> callArgP = arg->paramDesc;
        if ( callArgP != NULL  ) {
          callArgP->moveRefTo(node, fnArg, ctx);
        }
      }
      int cp_len = callParams->children.size();
      if ( cp_len > (vFnDef->params.size()) ) {
        std::shared_ptr<CodeNode> lastCallParam = callParams->children.at((cp_len - 1));
        ctx->addError(lastCallParam, std::string("Too many arguments for function"));
        ctx->addError(vFnDef->nameNode, std::string("NOTE: To fix the previous error: Check original function declaration which was"));
      }
      for ( std::vector< std::shared_ptr<RangerAppParamDesc>>::size_type i_1 = 0; i_1 != vFnDef->params.size(); i_1++) {
        std::shared_ptr<RangerAppParamDesc> param = vFnDef->params.at(i_1);
        if ( (callParams->children.size()) <= i_1 ) {
          if ( param->nameNode->hasFlag(std::string("default")) ) {
            continue;
          }
          ctx->addError(node, std::string("Missing arguments for function"));
          ctx->addError(param->nameNode, std::string("NOTE: To fix the previous error: Check original function declaration which was"));
          break;
        }
        std::shared_ptr<CodeNode> argNode = callParams->children.at(i_1);
        if ( false == this->areEqualTypes((param->nameNode), argNode, ctx) ) {
          ctx->addError(argNode, std::string("ERROR, invalid argument type for method ") + vFnDef->name);
        }
        std::shared_ptr<CodeNode> pNode = param->nameNode;
        if ( pNode->hasFlag(std::string("optional")) ) {
          if ( false == argNode->hasFlag(std::string("optional")) ) {
            ctx->addError(node, std::string("function parameter optionality does not match, consider making parameter optional ") + argNode->getCode());
          }
        }
        if ( argNode->hasFlag(std::string("optional")) ) {
          if ( false == pNode->hasFlag(std::string("optional")) ) {
            ctx->addError(node, std::string("function parameter optionality does not match, consider unwrapping ") + argNode->getCode());
          }
        }
      }
      std::shared_ptr<CodeNode> nn = vFnDef->nameNode;
      node->eval_type = nn->typeNameAsType(ctx);
      node->eval_type_name = nn->type_name;
      node->eval_array_type = nn->array_type;
      node->eval_key_type = nn->key_type;
      if ( nn->hasFlag(std::string("optional")) ) {
        node->setFlag(std::string("optional"));
      }
      if ( expects_error ) {
        int cnt_now = ctx->getErrorCount();
        if ( cnt_now == err_cnt ) {
          ctx->addParserError(node, ((std::string("LANGUAGE_PARSER_ERROR: expected generated error, err counts : ") + std::to_string(err_cnt)) + std::string(" : ")) + std::to_string(cnt_now));
        }
      } else {
        int cnt_now_1 = ctx->getErrorCount();
        if ( cnt_now_1 > err_cnt ) {
          ctx->addParserError(node, ((std::string("LANGUAGE_PARSER_ERROR: did not expect generated error, err counts : ") + std::to_string(err_cnt)) + std::string(" : ")) + std::to_string(cnt_now_1));
        }
      }
      return true;
    } else {
      ctx->addError(node, std::string("Called Object or Property was not defined"));
    }
  }
  if ( desc->hasMethod(fnNode->vref) ) {
    std::shared_ptr<RangerAppFunctionDesc> fnDescr = desc->findMethod(fnNode->vref);
    std::shared_ptr<RangerAppWriterContext> subCtx_1 = ctx->fork();
    node->hasFnCall = true;
    node->fnDesc  = fnDescr;
    std::shared_ptr<RangerAppParamDesc> p_1 =  std::make_shared<RangerAppParamDesc>();
    p_1->name = fnNode->vref;
    p_1->value_type = fnNode->value_type;
    p_1->node  = fnNode;
    p_1->nameNode  = fnNode;
    p_1->varType = 10;
    subCtx_1->defineVariable(p_1->name, p_1);
    this->WriteThisVar(fnNode, subCtx_1, wr);
    this->WalkNode(fnNode, subCtx_1, wr);
    for ( std::vector< std::shared_ptr<CodeNode>>::size_type i_2 = 0; i_2 != node->children.size(); i_2++) {
      std::shared_ptr<CodeNode> arg_1 = node->children.at(i_2);
      if ( i_2 < 1 ) {
        continue;
      }
      ctx->setInExpr();
      this->WalkNode(arg_1, subCtx_1, wr);
      ctx->unsetInExpr();
    }
    for ( std::vector< std::shared_ptr<RangerAppParamDesc>>::size_type i_3 = 0; i_3 != fnDescr->params.size(); i_3++) {
      std::shared_ptr<RangerAppParamDesc> param_1 = fnDescr->params.at(i_3);
      if ( (node->children.size()) <= (i_3 + 1) ) {
        ctx->addError(node, std::string("Argument was not defined"));
        break;
      }
      std::shared_ptr<CodeNode> argNode_1 = node->children.at((i_3 + 1));
      if ( false == this->areEqualTypes((param_1->nameNode), argNode_1, ctx) ) {
        ctx->addError(argNode_1, ((std::string("ERROR, invalid argument type for ") + desc->name) + std::string(" method ")) + fnDescr->name);
      }
    }
    std::shared_ptr<CodeNode> nn_1 = fnDescr->nameNode;
    nn_1->defineNodeTypeTo(node, ctx);
    if ( expects_error ) {
      int cnt_now_2 = ctx->getErrorCount();
      if ( cnt_now_2 == err_cnt ) {
        ctx->addParserError(node, ((std::string("LANGUAGE_PARSER_ERROR: expected generated error, err counts : ") + std::to_string(err_cnt)) + std::string(" : ")) + std::to_string(cnt_now_2));
      }
    } else {
      int cnt_now_3 = ctx->getErrorCount();
      if ( cnt_now_3 > err_cnt ) {
        ctx->addParserError(node, ((std::string("LANGUAGE_PARSER_ERROR: did not expect generated error, err counts : ") + std::to_string(err_cnt)) + std::string(" : ")) + std::to_string(cnt_now_3));
      }
    }
    return true;
  }
  if ( ctx->isVarDefined(fnNode->vref) ) {
    std::shared_ptr<RangerAppParamDesc> d = ctx->getVariableDef(fnNode->vref);
    d->ref_cnt = 1 + d->ref_cnt;
    if ( d->nameNode->value_type == 15 ) {
      /** unused:  std::shared_ptr<CodeNode> lambdaDefArgs = d->nameNode->expression_value->children.at(1)   **/ ;
      std::shared_ptr<CodeNode> callParams_1 = node->children.at(1);
      for ( std::vector< std::shared_ptr<CodeNode>>::size_type i_4 = 0; i_4 != callParams_1->children.size(); i_4++) {
        std::shared_ptr<CodeNode> arg_2 = callParams_1->children.at(i_4);
        ctx->setInExpr();
        this->WalkNode(arg_2, ctx, wr);
        ctx->unsetInExpr();
      }
      std::shared_ptr<CodeNode> lambdaDef = d->nameNode->expression_value->children.at(0);
      /** unused:  std::shared_ptr<CodeNode> lambdaArgs = d->nameNode->expression_value->children.at(1)   **/ ;
      node->has_lambda_call = true;
      node->eval_type = lambdaDef->typeNameAsType(ctx);
      node->eval_type_name = lambdaDef->type_name;
      node->eval_array_type = lambdaDef->array_type;
      node->eval_key_type = lambdaDef->key_type;
      return true;
    }
  }
  ctx->addError(node, ((std::string("ERROR, could not find class ") + desc->name) + std::string(" method ")) + fnNode->vref);
  ctx->addError(node, std::string("definition : ") + node->getCode());
  if ( expects_error ) {
    int cnt_now_4 = ctx->getErrorCount();
    if ( cnt_now_4 == err_cnt ) {
      ctx->addParserError(node, ((std::string("LANGUAGE_PARSER_ERROR: expected generated error, err counts : ") + std::to_string(err_cnt)) + std::string(" : ")) + std::to_string(cnt_now_4));
    }
  } else {
    int cnt_now_5 = ctx->getErrorCount();
    if ( cnt_now_5 > err_cnt ) {
      ctx->addParserError(node, ((std::string("LANGUAGE_PARSER_ERROR: did not expect generated error, err counts : ") + std::to_string(err_cnt)) + std::string(" : ")) + std::to_string(cnt_now_5));
    }
  }
  return false;
}

void  RangerFlowParser::cmdReturn( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr ) {
  node->has_operator = true;
  node->op_index = 5;
  std::cout << std::string("cmdReturn") << std::endl;
  if ( (node->children.size()) > 1 ) {
    std::shared_ptr<CodeNode> fc = node->getSecond();
    if ( fc->vref == std::string("_") ) {
    } else {
      ctx->setInExpr();
      this->WalkNode(fc, ctx, wr);
      ctx->unsetInExpr();
      /** unused:  std::shared_ptr<RangerAppFunctionDesc> activeFn = ctx->getCurrentMethod()   **/ ;
      if ( fc->hasParamDesc ) {
        fc->paramDesc->return_cnt = 1 + fc->paramDesc->return_cnt;
        fc->paramDesc->ref_cnt = 1 + fc->paramDesc->ref_cnt;
      }
      std::shared_ptr<RangerAppFunctionDesc> currFn = ctx->getCurrentMethod();
      if ( fc->hasParamDesc ) {
        std::cout << std::string("cmdReturn move-->") << std::endl;
        std::shared_ptr<RangerAppParamDesc> pp = fc->paramDesc;
        pp->moveRefTo(node, currFn, ctx);
      } else {
        std::cout << std::string("cmdReturn had no param desc") << std::endl;
      }
    }
  }
}

void  RangerFlowParser::cmdAssign( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr ) {
  wr->newline();
  std::shared_ptr<CodeNode> n1 = node->getSecond();
  std::shared_ptr<CodeNode> n2 = node->getThird();
  this->WalkNode(n1, ctx, wr);
  ctx->setInExpr();
  this->WalkNode(n2, ctx, wr);
  ctx->unsetInExpr();
  if ( n1->hasParamDesc ) {
    n1->paramDesc->ref_cnt = n1->paramDesc->ref_cnt + 1;
    n1->paramDesc->set_cnt = n1->paramDesc->set_cnt + 1;
  }
  if ( n2->hasParamDesc ) {
    n2->paramDesc->ref_cnt = n2->paramDesc->ref_cnt + 1;
  }
  if ( n2->hasFlag(std::string("optional")) ) {
    if ( false == n1->hasFlag(std::string("optional")) ) {
      ctx->addError(node, std::string("Can not assign optional to non-optional type"));
    }
  }
  this->stdParamMatch(node, ctx, wr);
}

void  RangerFlowParser::EnterTemplateClass( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr ) {
}

void  RangerFlowParser::EnterClass( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr ) {
  if ( (node->children.size()) != 3 ) {
    ctx->addError(node, std::string("Invalid class declaration"));
    return;
  }
  if ( node->hasBooleanProperty(std::string("trait")) ) {
    return;
  }
  std::shared_ptr<CodeNode> cn = node->children.at(1);
  std::shared_ptr<CodeNode> cBody = node->children.at(2);
  std::shared_ptr<RangerAppClassDesc> desc = ctx->findClass(cn->vref);
  if ( cn->has_vref_annotation ) {
    std::cout << std::string("--> generic class, not processed") << std::endl;
    return;
  }
  std::shared_ptr<RangerAppWriterContext> subCtx = desc->ctx;
  subCtx->setCurrentClass(desc);
  subCtx->class_level_context = true;
  for ( std::vector< std::shared_ptr<RangerAppParamDesc>>::size_type i = 0; i != desc->variables.size(); i++) {
    std::shared_ptr<RangerAppParamDesc> p = desc->variables.at(i);
    std::shared_ptr<CodeNode> vNode = p->node;
    if ( (vNode->children.size()) > 2 ) {
      std::shared_ptr<CodeNode> value = vNode->children.at(2);
      ctx->setInExpr();
      this->WalkNode(value, ctx, wr);
      ctx->unsetInExpr();
    }
    p->is_class_variable = true;
    p->nameNode->eval_type = p->nameNode->typeNameAsType(ctx);
    p->nameNode->eval_type_name = p->nameNode->type_name;
  }
  for ( std::vector< std::shared_ptr<CodeNode>>::size_type i_1 = 0; i_1 != cBody->children.size(); i_1++) {
    std::shared_ptr<CodeNode> fNode = cBody->children.at(i_1);
    if ( fNode->isFirstVref(std::string("fn")) || fNode->isFirstVref(std::string("Constructor")) ) {
      this->WalkNode(fNode, subCtx, wr);
    }
  }
  for ( std::vector< std::shared_ptr<CodeNode>>::size_type i_2 = 0; i_2 != cBody->children.size(); i_2++) {
    std::shared_ptr<CodeNode> fNode_1 = cBody->children.at(i_2);
    if ( fNode_1->isFirstVref(std::string("fn")) || fNode_1->isFirstVref(std::string("PublicMethod")) ) {
      this->WalkNode(fNode_1, subCtx, wr);
    }
  }
  std::shared_ptr<RangerAppWriterContext> staticCtx = ctx->fork();
  staticCtx->setCurrentClass(desc);
  for ( std::vector< std::shared_ptr<CodeNode>>::size_type i_3 = 0; i_3 != cBody->children.size(); i_3++) {
    std::shared_ptr<CodeNode> fNode_2 = cBody->children.at(i_3);
    if ( fNode_2->isFirstVref(std::string("sfn")) || fNode_2->isFirstVref(std::string("StaticMethod")) ) {
      this->WalkNode(fNode_2, staticCtx, wr);
    }
  }
  node->hasClassDescription = true;
  node->clDesc  = desc;
  desc->classNode  = node;
}

void  RangerFlowParser::EnterMethod( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr ) {
  this->shouldHaveChildCnt(4, node, ctx, std::string("Method expexts four arguments"));
  std::shared_ptr<CodeNode> cn = node->children.at(1);
  std::shared_ptr<CodeNode> fnBody = node->children.at(3);
  std::shared_ptr<RangerAppClassDesc> udesc = ctx->getCurrentClass();
  std::shared_ptr<RangerAppClassDesc> desc = udesc;
  std::shared_ptr<RangerAppFunctionDesc> um = desc->findMethod(cn->vref);
  std::shared_ptr<RangerAppFunctionDesc> m = um;
  std::shared_ptr<RangerAppWriterContext> subCtx = m->fnCtx;
  subCtx->function_level_context = true;
  subCtx->currentMethod  = m;
  for ( std::vector< std::shared_ptr<RangerAppParamDesc>>::size_type i = 0; i != m->params.size(); i++) {
    std::shared_ptr<RangerAppParamDesc> v = m->params.at(i);
    v->nameNode->eval_type = v->nameNode->typeNameAsType(subCtx);
    v->nameNode->eval_type_name = v->nameNode->type_name;
    ctx->hadValidType(v->nameNode);
  }
  subCtx->setInMethod();
  this->WalkNodeChildren(fnBody, subCtx, wr);
  subCtx->unsetInMethod();
  if ( fnBody->didReturnAtIndex == -1 ) {
    if ( cn->type_name != std::string("void") ) {
      ctx->addError(node, std::string("Function does not return any values!"));
    }
  }
  for ( std::vector< std::string>::size_type i_1 = 0; i_1 != subCtx->localVarNames.size(); i_1++) {
    std::string n = subCtx->localVarNames.at(i_1);
    std::shared_ptr<RangerAppParamDesc> p = subCtx->localVariables[n];
    if ( p->set_cnt > 0 ) {
      std::shared_ptr<CodeNode> defNode = p->node;
      defNode->setFlag(std::string("mutable"));
      std::shared_ptr<CodeNode> nNode = p->nameNode;
      nNode->setFlag(std::string("mutable"));
    }
  }
}

void  RangerFlowParser::EnterStaticMethod( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr ) {
  this->shouldHaveChildCnt(4, node, ctx, std::string("Method expexts four arguments"));
  std::shared_ptr<CodeNode> cn = node->children.at(1);
  std::shared_ptr<CodeNode> fnBody = node->children.at(3);
  std::shared_ptr<RangerAppClassDesc> udesc = ctx->getCurrentClass();
  std::shared_ptr<RangerAppClassDesc> desc = udesc;
  std::shared_ptr<RangerAppWriterContext> subCtx = ctx->fork();
  subCtx->is_function = true;
  std::shared_ptr<RangerAppFunctionDesc> um = desc->findStaticMethod(cn->vref);
  std::shared_ptr<RangerAppFunctionDesc> m = um;
  subCtx->currentMethod  = m;
  subCtx->in_static_method = true;
  m->fnCtx  = subCtx;
  if ( cn->hasFlag(std::string("weak")) ) {
    m->changeStrength(0, 1, node);
  } else {
    m->changeStrength(1, 1, node);
  }
  subCtx->setInMethod();
  for ( std::vector< std::shared_ptr<RangerAppParamDesc>>::size_type i = 0; i != m->params.size(); i++) {
    std::shared_ptr<RangerAppParamDesc> v = m->params.at(i);
    subCtx->defineVariable(v->name, v);
    v->nameNode->eval_type = v->nameNode->typeNameAsType(ctx);
    v->nameNode->eval_type_name = v->nameNode->type_name;
  }
  this->WalkNodeChildren(fnBody, subCtx, wr);
  subCtx->unsetInMethod();
  subCtx->in_static_method = false;
  subCtx->function_level_context = true;
  if ( fnBody->didReturnAtIndex == -1 ) {
    if ( cn->type_name != std::string("void") ) {
      ctx->addError(node, std::string("Function does not return any values!"));
    }
  }
  for ( std::vector< std::string>::size_type i_1 = 0; i_1 != subCtx->localVarNames.size(); i_1++) {
    std::string n = subCtx->localVarNames.at(i_1);
    std::shared_ptr<RangerAppParamDesc> p = subCtx->localVariables[n];
    if ( p->set_cnt > 0 ) {
      std::shared_ptr<CodeNode> defNode = p->node;
      defNode->setFlag(std::string("mutable"));
      std::shared_ptr<CodeNode> nNode = p->nameNode;
      nNode->setFlag(std::string("mutable"));
    }
  }
}

void  RangerFlowParser::EnterLambdaMethod( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr ) {
  std::shared_ptr<CodeNode> args = node->children.at(1);
  std::shared_ptr<CodeNode> body = node->children.at(2);
  std::shared_ptr<RangerAppWriterContext> subCtx = ctx->fork();
  subCtx->is_capturing = true;
  std::shared_ptr<CodeNode> cn = node->children.at(0);
  std::shared_ptr<RangerAppFunctionDesc> m =  std::make_shared<RangerAppFunctionDesc>();
  m->name = std::string("lambda");
  m->node  = node;
  m->nameNode  = node->children.at(0);
  subCtx->is_function = true;
  subCtx->currentMethod  = m;
  if ( cn->hasFlag(std::string("weak")) ) {
    m->changeStrength(0, 1, node);
  } else {
    m->changeStrength(1, 1, node);
  }
  m->fnBody  = node->children.at(2);
  for ( std::vector< std::shared_ptr<CodeNode>>::size_type ii = 0; ii != args->children.size(); ii++) {
    std::shared_ptr<CodeNode> arg = args->children.at(ii);
    std::shared_ptr<RangerAppParamDesc> p2 =  std::make_shared<RangerAppParamDesc>();
    p2->name = arg->vref;
    p2->value_type = arg->value_type;
    p2->node  = arg;
    p2->nameNode  = arg;
    p2->init_cnt = 1;
    p2->refType = 1;
    p2->initRefType = 1;
    if ( args->hasBooleanProperty(std::string("strong")) ) {
      p2->refType = 2;
      p2->initRefType = 2;
    }
    p2->varType = 4;
    m->params.push_back( p2  );
    arg->hasParamDesc = true;
    arg->paramDesc  = p2;
    arg->eval_type = arg->value_type;
    arg->eval_type_name = arg->type_name;
    if ( arg->hasFlag(std::string("strong")) ) {
      p2->changeStrength(1, 1, p2->nameNode);
    } else {
      arg->setFlag(std::string("lives"));
      p2->changeStrength(0, 1, p2->nameNode);
    }
    subCtx->defineVariable(p2->name, p2);
  }
  /** unused:  int cnt = body->children.size()   **/ ;
  for ( std::vector< std::shared_ptr<CodeNode>>::size_type i = 0; i != body->children.size(); i++) {
    std::shared_ptr<CodeNode> item = body->children.at(i);
    this->WalkNode(item, subCtx, wr);
    if ( i == ((body->children.size()) - 1) ) {
      if ( (item->children.size()) > 0 ) {
        std::shared_ptr<CodeNode> fc = item->getFirst();
        if ( fc->vref != std::string("return") ) {
          cn->type_name = std::string("void");
        }
      }
    }
  }
  node->has_lambda = true;
  node->lambda_ctx  = subCtx;
  node->eval_type = 15;
  node->eval_function  = node;
}

void  RangerFlowParser::EnterVarDef( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr ) {
  if ( ctx->isInMethod() ) {
    if ( (node->children.size()) > 3 ) {
      ctx->addError(node, std::string("invalid variable definition"));
      return;
    }
    if ( (node->children.size()) < 2 ) {
      ctx->addError(node, std::string("invalid variable definition"));
      return;
    }
    std::shared_ptr<CodeNode> cn = node->children.at(1);
    std::shared_ptr<RangerAppParamDesc> p =  std::make_shared<RangerAppParamDesc>();
    std::shared_ptr<CodeNode> defaultArg;
    if ( (node->children.size()) == 2 ) {
      if ( (cn->value_type != 6) && (cn->value_type != 7) ) {
        cn->setFlag(std::string("optional"));
      }
    }
    if ( (cn->vref.length()) == 0 ) {
      ctx->addError(node, std::string("invalid variable definition"));
    }
    if ( cn->hasFlag(std::string("weak")) ) {
      p->changeStrength(0, 1, node);
    } else {
      p->changeStrength(1, 1, node);
    }
    node->hasVarDef = true;
    if ( cn->value_type == 15 ) {
      std::cout << std::string("Expression node...") << std::endl;
    }
    if ( (node->children.size()) > 2 ) {
      p->init_cnt = 1;
      p->def_value  = node->children.at(2);
      p->is_optional = false;
      defaultArg  = node->children.at(2);
      ctx->setInExpr();
      this->WalkNode(defaultArg, ctx, wr);
      ctx->unsetInExpr();
      if ( defaultArg->hasFlag(std::string("optional")) ) {
        cn->setFlag(std::string("optional"));
      }
      if ( defaultArg->eval_type == 6 ) {
        node->op_index = 1;
      }
      if ( cn->value_type == 11 ) {
        cn->eval_type_name = defaultArg->ns.at(0);
      }
      if ( cn->value_type == 12 ) {
        if ( (defaultArg->eval_type != 3) && (defaultArg->eval_type != 12) ) {
          ctx->addError(defaultArg, std::string("Char should be assigned char or integer value --> ") + defaultArg->getCode());
        } else {
          defaultArg->eval_type = 12;
        }
      }
    } else {
      if ( ((cn->value_type != 7) && (cn->value_type != 6)) && (false == cn->hasFlag(std::string("optional"))) ) {
        cn->setFlag(std::string("optional"));
      }
    }
    if ( (node->children.size()) > 2 ) {
      if ( ((cn->type_name.length()) == 0) && ((cn->array_type.length()) == 0) ) {
        std::shared_ptr<CodeNode> nodeValue = node->children.at(2);
        if ( nodeValue->eval_type == 15 ) {
          if ( node->expression_value == NULL ) {
            std::shared_ptr<CodeNode> copyOf = nodeValue->rebuildWithType( std::make_shared<RangerArgMatch>(), false);
            copyOf->children.pop_back();
            cn->expression_value  = copyOf;
          }
        }
        cn->value_type = nodeValue->eval_type;
        cn->type_name = nodeValue->eval_type_name;
        cn->array_type = nodeValue->eval_array_type;
        cn->key_type = nodeValue->eval_key_type;
      }
    }
    ctx->hadValidType(cn);
    cn->defineNodeTypeTo(cn, ctx);
    p->name = cn->vref;
    if ( p->value_type == 0 ) {
      if ( (0 == (cn->type_name.length())) && (defaultArg != NULL ) ) {
        p->value_type = defaultArg->eval_type;
        cn->type_name = defaultArg->eval_type_name;
        cn->eval_type_name = defaultArg->eval_type_name;
        cn->value_type = defaultArg->eval_type;
      }
    } else {
      p->value_type = cn->value_type;
    }
    p->node  = node;
    p->nameNode  = cn;
    p->varType = 5;
    if ( cn->has_vref_annotation ) {
      ctx->log(node, std::string("ann"), std::string("At a variable -> Found has_vref_annotation annotated reference "));
      std::shared_ptr<CodeNode> ann = cn->vref_annotation;
      if ( (ann->children.size()) > 0 ) {
        std::shared_ptr<CodeNode> fc = ann->children.at(0);
        ctx->log(node, std::string("ann"), ((std::string("value of first annotation ") + fc->vref) + std::string(" and variable name ")) + cn->vref);
      }
    }
    if ( cn->has_type_annotation ) {
      ctx->log(node, std::string("ann"), std::string("At a variable -> Found annotated reference "));
      std::shared_ptr<CodeNode> ann_1 = cn->type_annotation;
      if ( (ann_1->children.size()) > 0 ) {
        std::shared_ptr<CodeNode> fc_1 = ann_1->children.at(0);
        ctx->log(node, std::string("ann"), ((std::string("value of first annotation ") + fc_1->vref) + std::string(" and variable name ")) + cn->vref);
      }
    }
    cn->hasParamDesc = true;
    cn->ownParamDesc  = p;
    cn->paramDesc  = p;
    node->hasParamDesc = true;
    node->paramDesc  = p;
    cn->eval_type = cn->typeNameAsType(ctx);
    cn->eval_type_name = cn->type_name;
    if ( (node->children.size()) > 2 ) {
      if ( cn->eval_type != defaultArg->eval_type ) {
        if ( ((cn->eval_type == 12) && (defaultArg->eval_type == 3)) || ((cn->eval_type == 3) && (defaultArg->eval_type == 12)) ) {
        } else {
          ctx->addError(node, ((std::string("Variable was assigned an incompatible type. Types were ") + std::to_string(cn->eval_type)) + std::string(" vs ")) + std::to_string(defaultArg->eval_type));
        }
      }
    } else {
      p->is_optional = true;
    }
    ctx->defineVariable(p->name, p);
    this->DefineVar(node, ctx, wr);
    if ( (node->children.size()) > 2 ) {
      this->shouldBeEqualTypes(cn, p->def_value, ctx, std::string("Variable was assigned an incompatible type."));
    }
  } else {
    std::shared_ptr<CodeNode> cn_1 = node->children.at(1);
    cn_1->eval_type = cn_1->typeNameAsType(ctx);
    cn_1->eval_type_name = cn_1->type_name;
    this->DefineVar(node, ctx, wr);
    if ( (node->children.size()) > 2 ) {
      this->shouldBeEqualTypes(node->children.at(1), node->children.at(2), ctx, std::string("Variable was assigned an incompatible type."));
    }
  }
}

void  RangerFlowParser::WalkNodeChildren( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr ) {
  if ( node->hasStringProperty(std::string("todo")) ) {
    ctx->addTodo(node, node->getStringProperty(std::string("todo")));
  }
  if ( node->expression ) {
    for ( std::vector< std::shared_ptr<CodeNode>>::size_type i = 0; i != node->children.size(); i++) {
      std::shared_ptr<CodeNode> item = node->children.at(i);
      item->parent  = node;
      this->WalkNode(item, ctx, wr);
      node->copyEvalResFrom(item);
    }
  }
}

bool  RangerFlowParser::matchNode( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr ) {
  if ( 0 == (node->children.size()) ) {
    return false;
  }
  std::shared_ptr<CodeNode> fc = node->getFirst();
  stdCommands  = ctx->getStdCommands();
  for ( std::vector< std::shared_ptr<CodeNode>>::size_type i = 0; i != stdCommands->children.size(); i++) {
    std::shared_ptr<CodeNode> cmd = stdCommands->children.at(i);
    std::shared_ptr<CodeNode> cmdName = cmd->getFirst();
    if ( cmdName->vref == fc->vref ) {
      this->stdParamMatch(node, ctx, wr);
      if ( node->parent != NULL  ) {
        node->parent->copyEvalResFrom(node);
      }
      return true;
    }
  }
  return false;
}

void  RangerFlowParser::StartWalk( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr ) {
  this->WalkNode(node, ctx, wr);
  for ( std::vector< std::shared_ptr<CodeNode>>::size_type i = 0; i != walkAlso.size(); i++) {
    std::shared_ptr<CodeNode> ch = walkAlso.at(i);
    this->WalkNode(ch, ctx, wr);
  }
}

bool  RangerFlowParser::WalkNode( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr ) {
  /** unused:  int line_index = node->getLine()   **/ ;
  if ( node->flow_done ) {
    return true;
  }
  node->flow_done = true;
  this->lastProcessedNode  = node;
  if ( node->hasStringProperty(std::string("todo")) ) {
    ctx->addTodo(node, node->getStringProperty(std::string("todo")));
  }
  if ( node->isPrimitive() ) {
    if ( ctx->expressionLevel() == 0 ) {
      ctx->addError(node, std::string("Primitive element at top level!"));
    }
    this->WriteScalarValue(node, ctx, wr);
    return true;
  }
  if ( node->value_type == 9 ) {
    this->WriteVRef(node, ctx, wr);
    return true;
  }
  if ( node->value_type == 10 ) {
    this->WriteComment(node, ctx, wr);
    return true;
  }
  if ( node->isFirstVref(std::string("fun")) ) {
    this->EnterLambdaMethod(node, ctx, wr);
    return true;
  }
  if ( node->isFirstVref(std::string("fn")) ) {
    if ( ctx->isInMethod() ) {
      this->EnterLambdaMethod(node, ctx, wr);
      return true;
    }
  }
  if ( node->isFirstVref(std::string("Extends")) ) {
    return true;
  }
  if ( node->isFirstVref(std::string("extension")) ) {
    this->EnterClass(node, ctx, wr);
    return true;
  }
  if ( node->isFirstVref(std::string("operators")) ) {
    return true;
  }
  if ( node->isFirstVref(std::string("systemclass")) ) {
    return true;
  }
  if ( node->isFirstVref(std::string("systemunion")) ) {
    return true;
  }
  if ( node->isFirstVref(std::string("Import")) ) {
    this->cmdImport(node, ctx, wr);
    return true;
  }
  if ( node->isFirstVref(std::string("def")) ) {
    this->EnterVarDef(node, ctx, wr);
    return true;
  }
  if ( node->isFirstVref(std::string("let")) ) {
    this->EnterVarDef(node, ctx, wr);
    return true;
  }
  if ( node->isFirstVref(std::string("TemplateClass")) ) {
    this->EnterTemplateClass(node, ctx, wr);
    return true;
  }
  if ( node->isFirstVref(std::string("CreateClass")) ) {
    this->EnterClass(node, ctx, wr);
    return true;
  }
  if ( node->isFirstVref(std::string("class")) ) {
    this->EnterClass(node, ctx, wr);
    return true;
  }
  if ( node->isFirstVref(std::string("trait")) ) {
    return true;
  }
  if ( node->isFirstVref(std::string("PublicMethod")) ) {
    this->EnterMethod(node, ctx, wr);
    return true;
  }
  if ( node->isFirstVref(std::string("StaticMethod")) ) {
    this->EnterStaticMethod(node, ctx, wr);
    return true;
  }
  if ( node->isFirstVref(std::string("fn")) ) {
    this->EnterMethod(node, ctx, wr);
    return true;
  }
  if ( node->isFirstVref(std::string("sfn")) ) {
    this->EnterStaticMethod(node, ctx, wr);
    return true;
  }
  if ( node->isFirstVref(std::string("=")) ) {
    this->cmdAssign(node, ctx, wr);
    return true;
  }
  if ( node->isFirstVref(std::string("Constructor")) ) {
    this->Constructor(node, ctx, wr);
    return true;
  }
  if ( node->isFirstVref(std::string("new")) ) {
    this->cmdNew(node, ctx, wr);
    return true;
  }
  if ( this->matchNode(node, ctx, wr) ) {
    return true;
  }
  if ( (node->children.size()) > 0 ) {
    std::shared_ptr<CodeNode> fc = node->children.at(0);
    if ( fc->value_type == 9 ) {
      bool was_called = true;
      bool caseMatched = false;
      if( fc->vref == std::string("Enum")) {
        caseMatched = true;
        this->cmdEnum(node, ctx, wr);
      }
      if( ! caseMatched) {
        was_called = false;
      }
      if ( was_called ) {
        return true;
      }
      if ( (node->children.size()) > 1 ) {
        if ( this->cmdLocalCall(node, ctx, wr) ) {
          return true;
        }
      }
    }
  }
  if ( node->expression ) {
    for ( std::vector< std::shared_ptr<CodeNode>>::size_type i = 0; i != node->children.size(); i++) {
      std::shared_ptr<CodeNode> item = node->children.at(i);
      item->parent  = node;
      this->WalkNode(item, ctx, wr);
      node->copyEvalResFrom(item);
    }
    return true;
  }
  ctx->addError(node, std::string("Could not understand this part"));
  return true;
}

void  RangerFlowParser::mergeImports( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr ) {
  if ( node->isFirstVref(std::string("Import")) ) {
    std::shared_ptr<CodeNode> fNameNode = node->children.at(1);
    std::string import_file = fNameNode->string_value;
    if ( ctx->already_imported.count(import_file) ) {
      return;
    }
    ctx->already_imported[import_file] = true;
    std::string c = r_cpp_readFile( std::string(".") , import_file);
    std::shared_ptr<SourceCode> code =  std::make_shared<SourceCode>(c);
    code->filename = import_file;
    std::shared_ptr<RangerLispParser> parser =  std::make_shared<RangerLispParser>(code);
    parser->parse();
    node->expression = true;
    node->vref = std::string("");
    node->children.pop_back();
    node->children.pop_back();
    std::shared_ptr<CodeNode> rn = parser->rootNode;
    this->mergeImports(rn, ctx, wr);
    node->children.push_back( rn  );
  } else {
    for ( std::vector< std::shared_ptr<CodeNode>>::size_type i = 0; i != node->children.size(); i++) {
      std::shared_ptr<CodeNode> item = node->children.at(i);
      this->mergeImports(item, ctx, wr);
    }
  }
}

void  RangerFlowParser::CollectMethods( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr ) {
  this->WalkCollectMethods(node, ctx, wr);
  for ( std::vector< std::shared_ptr<ClassJoinPoint>>::size_type i = 0; i != classesWithTraits.size(); i++) {
    std::shared_ptr<ClassJoinPoint> point = classesWithTraits.at(i);
    std::shared_ptr<RangerAppClassDesc> cl = point->class_def;
    /** unused:  std::shared_ptr<CodeNode> joinPoint = point->node   **/ ;
    std::shared_ptr<CodeNode> traitClassDef = point->node->children.at(1);
    std::string name = traitClassDef->vref;
    std::shared_ptr<RangerAppClassDesc> t = ctx->findClass(name);
    if ( (t->extends_classes.size()) > 0 ) {
      ctx->addError(point->node, (std::string("Can not join class ") + name) + std::string(" because it is inherited. Currently on base classes can be used as traits."));
      continue;
    }
    if ( t->has_constructor ) {
      ctx->addError(point->node, (std::string("Can not join class ") + name) + std::string(" because it has a constructor function"));
    } else {
      std::shared_ptr<CodeNode> origBody = cl->node->children.at(2);
      std::shared_ptr<RangerArgMatch> match =  std::make_shared<RangerArgMatch>();
      std::shared_ptr<CodeNode> params = t->node->getExpressionProperty(std::string("params"));
      std::shared_ptr<CodeNode> initParams = point->node->getExpressionProperty(std::string("params"));
      if ( (params != NULL ) && (initParams != NULL ) ) {
        for ( std::vector< std::shared_ptr<CodeNode>>::size_type i_1 = 0; i_1 != params->children.size(); i_1++) {
          std::shared_ptr<CodeNode> typeName = params->children.at(i_1);
          std::shared_ptr<CodeNode> pArg = initParams->children.at(i_1);
          match->add(typeName->vref, pArg->vref, ctx);
        }
      } else {
        match->add(std::string("T"), cl->name, ctx);
      }
      ctx->setCurrentClass(cl);
      std::shared_ptr<RangerAppClassDesc> traitClass = ctx->findClass(traitClassDef->vref);
      for ( std::vector< std::shared_ptr<RangerAppParamDesc>>::size_type i_2 = 0; i_2 != traitClass->variables.size(); i_2++) {
        std::shared_ptr<RangerAppParamDesc> pvar = traitClass->variables.at(i_2);
        std::shared_ptr<CodeNode> ccopy = pvar->node->rebuildWithType(match, true);
        this->WalkCollectMethods(ccopy, ctx, wr);
        origBody->children.push_back( ccopy  );
      }
      for ( std::vector< std::string>::size_type i_3 = 0; i_3 != traitClass->defined_variants.size(); i_3++) {
        std::string fnVar = traitClass->defined_variants.at(i_3);
        std::shared_ptr<RangerAppMethodVariants> mVs = traitClass->method_variants[fnVar];
        for ( std::vector< std::shared_ptr<RangerAppFunctionDesc>>::size_type i_4 = 0; i_4 != mVs->variants.size(); i_4++) {
          std::shared_ptr<RangerAppFunctionDesc> variant = mVs->variants.at(i_4);
          std::shared_ptr<CodeNode> ccopy_1 = variant->node->rebuildWithType(match, true);
          this->WalkCollectMethods(ccopy_1, ctx, wr);
          origBody->children.push_back( ccopy_1  );
        }
      }
    }
  }
  for ( std::vector< std::shared_ptr<RangerAppClassDesc>>::size_type i_5 = 0; i_5 != serializedClasses.size(); i_5++) {
    std::shared_ptr<RangerAppClassDesc> cl_1 = serializedClasses.at(i_5);
    cl_1->is_serialized = true;
    std::shared_ptr<RangerSerializeClass> ser =  std::make_shared<RangerSerializeClass>();
    std::shared_ptr<CodeWriter> extWr =  std::make_shared<CodeWriter>();
    ser->createJSONSerializerFn(cl_1, cl_1->ctx, extWr);
    std::string theCode = extWr->getCode();
    std::shared_ptr<SourceCode> code =  std::make_shared<SourceCode>(theCode);
    code->filename = std::string("extension ") + ctx->currentClass->name;
    std::shared_ptr<RangerLispParser> parser =  std::make_shared<RangerLispParser>(code);
    parser->parse();
    std::shared_ptr<CodeNode> rn = parser->rootNode;
    this->WalkCollectMethods(rn, cl_1->ctx, wr);
    walkAlso.push_back( rn  );
  }
}

void  RangerFlowParser::WalkCollectMethods( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr ) {
  bool find_more = true;
  if ( node->isFirstVref(std::string("systemunion")) ) {
    std::shared_ptr<CodeNode> nameNode = node->getSecond();
    std::shared_ptr<CodeNode> instances = node->getThird();
    std::shared_ptr<RangerAppClassDesc> new_class =  std::make_shared<RangerAppClassDesc>();
    new_class->name = nameNode->vref;
    new_class->nameNode  = nameNode;
    ctx->addClass(nameNode->vref, new_class);
    new_class->is_system_union = true;
    for ( std::vector< std::shared_ptr<CodeNode>>::size_type i = 0; i != instances->children.size(); i++) {
      std::shared_ptr<CodeNode> ch = instances->children.at(i);
      new_class->is_union_of.push_back( ch->vref  );
    }
    nameNode->clDesc  = new_class;
    return;
  }
  if ( node->isFirstVref(std::string("systemclass")) ) {
    std::shared_ptr<CodeNode> nameNode_1 = node->getSecond();
    std::shared_ptr<CodeNode> instances_1 = node->getThird();
    std::shared_ptr<RangerAppClassDesc> new_class_1 =  std::make_shared<RangerAppClassDesc>();
    new_class_1->name = nameNode_1->vref;
    new_class_1->nameNode  = nameNode_1;
    ctx->addClass(nameNode_1->vref, new_class_1);
    new_class_1->is_system = true;
    for ( std::vector< std::shared_ptr<CodeNode>>::size_type i_1 = 0; i_1 != instances_1->children.size(); i_1++) {
      std::shared_ptr<CodeNode> ch_1 = instances_1->children.at(i_1);
      std::shared_ptr<CodeNode> langName = ch_1->getFirst();
      std::shared_ptr<CodeNode> langClassName = ch_1->getSecond();
      new_class_1->systemNames[langName->vref] = langClassName->vref;
    }
    nameNode_1->is_system_class = true;
    nameNode_1->clDesc  = new_class_1;
    return;
  }
  if ( node->isFirstVref(std::string("Extends")) ) {
    std::shared_ptr<CodeNode> extList = node->children.at(1);
    std::shared_ptr<RangerAppClassDesc> currC = ctx->currentClass;
    for ( std::vector< std::shared_ptr<CodeNode>>::size_type ii = 0; ii != extList->children.size(); ii++) {
      std::shared_ptr<CodeNode> ee = extList->children.at(ii);
      currC->addParentClass(ee->vref);
      std::shared_ptr<RangerAppClassDesc> ParentClass = ctx->findClass(ee->vref);
      ParentClass->is_inherited = true;
    }
  }
  if ( node->isFirstVref(std::string("Constructor")) ) {
    std::shared_ptr<RangerAppClassDesc> currC_1 = ctx->currentClass;
    std::shared_ptr<RangerAppWriterContext> subCtx = currC_1->ctx->fork();
    currC_1->has_constructor = true;
    currC_1->constructor_node  = node;
    std::shared_ptr<RangerAppFunctionDesc> m =  std::make_shared<RangerAppFunctionDesc>();
    m->name = std::string("Constructor");
    m->node  = node;
    m->nameNode  = node->children.at(0);
    m->fnBody  = node->children.at(2);
    m->fnCtx  = subCtx;
    std::shared_ptr<CodeNode> args = node->children.at(1);
    for ( std::vector< std::shared_ptr<CodeNode>>::size_type ii_1 = 0; ii_1 != args->children.size(); ii_1++) {
      std::shared_ptr<CodeNode> arg = args->children.at(ii_1);
      std::shared_ptr<RangerAppParamDesc> p =  std::make_shared<RangerAppParamDesc>();
      p->name = arg->vref;
      p->value_type = arg->value_type;
      p->node  = arg;
      p->nameNode  = arg;
      p->refType = 1;
      p->varType = 4;
      m->params.push_back( p  );
      arg->hasParamDesc = true;
      arg->paramDesc  = p;
      arg->eval_type = arg->value_type;
      arg->eval_type_name = arg->type_name;
      subCtx->defineVariable(p->name, p);
    }
    currC_1->constructor_fn  = m;
    find_more = false;
  }
  if ( node->isFirstVref(std::string("trait")) ) {
    std::string s = node->getVRefAt(1);
    std::shared_ptr<CodeNode> classNameNode = node->getSecond();
    std::shared_ptr<RangerAppClassDesc> new_class_2 =  std::make_shared<RangerAppClassDesc>();
    new_class_2->name = s;
    std::shared_ptr<RangerAppWriterContext> subCtx_1 = ctx->fork();
    ctx->setCurrentClass(new_class_2);
    subCtx_1->setCurrentClass(new_class_2);
    new_class_2->ctx  = subCtx_1;
    new_class_2->nameNode  = classNameNode;
    ctx->addClass(s, new_class_2);
    new_class_2->classNode  = node;
    new_class_2->node  = node;
    new_class_2->is_trait = true;
  }
  if ( node->isFirstVref(std::string("CreateClass")) || node->isFirstVref(std::string("class")) ) {
    std::string s_1 = node->getVRefAt(1);
    std::shared_ptr<CodeNode> classNameNode_1 = node->getSecond();
    if ( classNameNode_1->has_vref_annotation ) {
      std::cout << std::string("%% vref_annotation") << std::endl;
      std::shared_ptr<CodeNode> ann = classNameNode_1->vref_annotation;
      std::cout << (classNameNode_1->vref + std::string(" : ")) + ann->getCode() << std::endl;
      ctx->addTemplateClass(classNameNode_1->vref, node);
      find_more = false;
    } else {
      std::shared_ptr<RangerAppClassDesc> new_class_3 =  std::make_shared<RangerAppClassDesc>();
      new_class_3->name = s_1;
      std::shared_ptr<RangerAppWriterContext> subCtx_2 = ctx->fork();
      ctx->setCurrentClass(new_class_3);
      subCtx_2->setCurrentClass(new_class_3);
      new_class_3->ctx  = subCtx_2;
      new_class_3->nameNode  = classNameNode_1;
      ctx->addClass(s_1, new_class_3);
      new_class_3->classNode  = node;
      new_class_3->node  = node;
      if ( node->hasBooleanProperty(std::string("trait")) ) {
        new_class_3->is_trait = true;
      }
    }
  }
  if ( node->isFirstVref(std::string("TemplateClass")) ) {
    std::string s_2 = node->getVRefAt(1);
    ctx->addTemplateClass(s_2, node);
    find_more = false;
  }
  if ( node->isFirstVref(std::string("Extends")) ) {
    std::shared_ptr<CodeNode> list = node->children.at(1);
    for ( std::vector< std::shared_ptr<CodeNode>>::size_type i_2 = 0; i_2 != list->children.size(); i_2++) {
      std::shared_ptr<CodeNode> cname = list->children.at(i_2);
      std::shared_ptr<RangerAppClassDesc> extC = ctx->findClass(cname->vref);
      for ( std::vector< std::shared_ptr<RangerAppParamDesc>>::size_type i_3 = 0; i_3 != extC->variables.size(); i_3++) {
        std::shared_ptr<RangerAppParamDesc> vv = extC->variables.at(i_3);
        std::shared_ptr<RangerAppClassDesc> currC_2 = ctx->currentClass;
        std::shared_ptr<RangerAppWriterContext> subCtx_3 = currC_2->ctx;
        subCtx_3->defineVariable(vv->name, vv);
      }
    }
    find_more = false;
  }
  if ( node->isFirstVref(std::string("def")) || node->isFirstVref(std::string("let")) ) {
    std::string s_3 = node->getVRefAt(1);
    std::shared_ptr<CodeNode> vDef = node->children.at(1);
    std::shared_ptr<RangerAppParamDesc> p_1 =  std::make_shared<RangerAppParamDesc>();
    if ( s_3 != ctx->transformWord(s_3) ) {
      ctx->addError(node, (std::string("Can not use reserved word ") + s_3) + std::string(" as class propery"));
    }
    p_1->name = s_3;
    p_1->value_type = vDef->value_type;
    p_1->node  = node;
    p_1->is_class_variable = true;
    p_1->varType = 8;
    p_1->node  = node;
    p_1->nameNode  = vDef;
    vDef->hasParamDesc = true;
    vDef->ownParamDesc  = p_1;
    vDef->paramDesc  = p_1;
    node->hasParamDesc = true;
    node->paramDesc  = p_1;
    if ( vDef->hasFlag(std::string("weak")) ) {
      p_1->changeStrength(0, 2, p_1->nameNode);
    } else {
      p_1->changeStrength(2, 2, p_1->nameNode);
    }
    if ( (node->children.size()) > 2 ) {
      p_1->set_cnt = 1;
      p_1->init_cnt = 1;
      p_1->def_value  = node->children.at(2);
      p_1->is_optional = false;
      if ( p_1->def_value->value_type == 4 ) {
        vDef->type_name = std::string("string");
      }
      if ( p_1->def_value->value_type == 3 ) {
        vDef->type_name = std::string("int");
      }
      if ( p_1->def_value->value_type == 2 ) {
        vDef->type_name = std::string("double");
      }
      if ( p_1->def_value->value_type == 5 ) {
        vDef->type_name = std::string("boolean");
      }
    } else {
      p_1->is_optional = true;
      if ( false == ((vDef->value_type == 6) || (vDef->value_type == 7)) ) {
        vDef->setFlag(std::string("optional"));
      }
    }
    std::shared_ptr<RangerAppClassDesc> currC_3 = ctx->currentClass;
    currC_3->addVariable(p_1);
    std::shared_ptr<RangerAppWriterContext> subCtx_4 = currC_3->ctx;
    subCtx_4->defineVariable(p_1->name, p_1);
    p_1->is_class_variable = true;
  }
  if ( node->isFirstVref(std::string("operators")) ) {
    std::shared_ptr<CodeNode> listOf = node->getSecond();
    for ( std::vector< std::shared_ptr<CodeNode>>::size_type i_4 = 0; i_4 != listOf->children.size(); i_4++) {
      std::shared_ptr<CodeNode> item = listOf->children.at(i_4);
      ctx->createOperator(item);
    }
    find_more = false;
  }
  if ( node->isFirstVref(std::string("Import")) || node->isFirstVref(std::string("import")) ) {
    std::shared_ptr<CodeNode> fNameNode = node->children.at(1);
    std::string import_file = fNameNode->string_value;
    if ( ctx->already_imported.count(import_file) ) {
      return;
    } else {
      ctx->already_imported[import_file] = true;
    }
    std::string c = r_cpp_readFile( std::string(".") , import_file);
    std::shared_ptr<SourceCode> code =  std::make_shared<SourceCode>(c);
    code->filename = import_file;
    std::shared_ptr<RangerLispParser> parser =  std::make_shared<RangerLispParser>(code);
    parser->parse();
    std::shared_ptr<CodeNode> rnode = parser->rootNode;
    this->WalkCollectMethods(rnode, ctx, wr);
    find_more = false;
  }
  if ( node->isFirstVref(std::string("does")) ) {
    std::shared_ptr<CodeNode> defName = node->getSecond();
    std::shared_ptr<RangerAppClassDesc> currC_4 = ctx->currentClass;
    currC_4->consumes_traits.push_back( defName->vref  );
    std::shared_ptr<ClassJoinPoint> joinPoint =  std::make_shared<ClassJoinPoint>();
    joinPoint->class_def  = currC_4;
    joinPoint->node  = node;
    classesWithTraits.push_back( joinPoint  );
  }
  if ( node->isFirstVref(std::string("StaticMethod")) || node->isFirstVref(std::string("sfn")) ) {
    std::string s_4 = node->getVRefAt(1);
    std::shared_ptr<RangerAppClassDesc> currC_5 = ctx->currentClass;
    std::shared_ptr<RangerAppFunctionDesc> m_1 =  std::make_shared<RangerAppFunctionDesc>();
    m_1->name = s_4;
    m_1->compiledName = ctx->transformWord(s_4);
    m_1->node  = node;
    m_1->is_static = true;
    m_1->nameNode  = node->children.at(1);
    m_1->nameNode->ifNoTypeSetToVoid();
    std::shared_ptr<CodeNode> args_1 = node->children.at(2);
    m_1->fnBody  = node->children.at(3);
    for ( std::vector< std::shared_ptr<CodeNode>>::size_type ii_2 = 0; ii_2 != args_1->children.size(); ii_2++) {
      std::shared_ptr<CodeNode> arg_1 = args_1->children.at(ii_2);
      std::shared_ptr<RangerAppParamDesc> p_2 =  std::make_shared<RangerAppParamDesc>();
      p_2->name = arg_1->vref;
      p_2->value_type = arg_1->value_type;
      p_2->node  = arg_1;
      p_2->init_cnt = 1;
      p_2->nameNode  = arg_1;
      p_2->refType = 1;
      p_2->varType = 4;
      m_1->params.push_back( p_2  );
      arg_1->hasParamDesc = true;
      arg_1->paramDesc  = p_2;
      arg_1->eval_type = arg_1->value_type;
      arg_1->eval_type_name = arg_1->type_name;
      if ( arg_1->hasFlag(std::string("strong")) ) {
        p_2->changeStrength(1, 1, p_2->nameNode);
      } else {
        arg_1->setFlag(std::string("lives"));
        p_2->changeStrength(0, 1, p_2->nameNode);
      }
    }
    currC_5->addStaticMethod(m_1);
    find_more = false;
  }
  if ( node->isFirstVref(std::string("extension")) ) {
    std::string s_5 = node->getVRefAt(1);
    std::shared_ptr<RangerAppClassDesc> old_class = ctx->findClass(s_5);
    ctx->setCurrentClass(old_class);
    std::cout << std::string("extension for ") + s_5 << std::endl;
  }
  if ( node->isFirstVref(std::string("PublicMethod")) || node->isFirstVref(std::string("fn")) ) {
    std::shared_ptr<CodeNode> cn = node->getSecond();
    std::string s_6 = node->getVRefAt(1);
    cn->ifNoTypeSetToVoid();
    std::shared_ptr<RangerAppClassDesc> currC_6 = ctx->currentClass;
    if ( currC_6->hasOwnMethod(s_6) ) {
      ctx->addError(node, std::string("Error: method of same name declared earlier. Overriding function declarations is not currently allowed!"));
      return;
    }
    if ( cn->hasFlag(std::string("main")) ) {
      ctx->addError(node, std::string("Error: dynamic method declared as @(main). Use static 'sfn' instead of 'fn'."));
      return;
    }
    std::shared_ptr<RangerAppFunctionDesc> m_2 =  std::make_shared<RangerAppFunctionDesc>();
    m_2->name = s_6;
    m_2->compiledName = ctx->transformWord(s_6);
    m_2->node  = node;
    m_2->nameNode  = node->children.at(1);
    if ( node->hasBooleanProperty(std::string("strong")) ) {
      m_2->refType = 2;
    } else {
      m_2->refType = 1;
    }
    std::shared_ptr<RangerAppWriterContext> subCtx_5 = currC_6->ctx->fork();
    subCtx_5->is_function = true;
    subCtx_5->currentMethod  = m_2;
    m_2->fnCtx  = subCtx_5;
    if ( cn->hasFlag(std::string("weak")) ) {
      m_2->changeStrength(0, 1, node);
    } else {
      m_2->changeStrength(1, 1, node);
    }
    std::shared_ptr<CodeNode> args_2 = node->children.at(2);
    m_2->fnBody  = node->children.at(3);
    for ( std::vector< std::shared_ptr<CodeNode>>::size_type ii_3 = 0; ii_3 != args_2->children.size(); ii_3++) {
      std::shared_ptr<CodeNode> arg_2 = args_2->children.at(ii_3);
      std::shared_ptr<RangerAppParamDesc> p2 =  std::make_shared<RangerAppParamDesc>();
      p2->name = arg_2->vref;
      p2->value_type = arg_2->value_type;
      p2->node  = arg_2;
      p2->nameNode  = arg_2;
      p2->init_cnt = 1;
      p2->refType = 1;
      p2->initRefType = 1;
      p2->debugString = std::string("--> collected ");
      if ( args_2->hasBooleanProperty(std::string("strong")) ) {
        p2->debugString = std::string("--> collected as STRONG");
        ctx->log(node, std::string("memory5"), std::string("strong param should move local ownership to call ***"));
        p2->refType = 2;
        p2->initRefType = 2;
      }
      p2->varType = 4;
      m_2->params.push_back( p2  );
      arg_2->hasParamDesc = true;
      arg_2->paramDesc  = p2;
      arg_2->eval_type = arg_2->value_type;
      arg_2->eval_type_name = arg_2->type_name;
      if ( arg_2->hasFlag(std::string("strong")) ) {
        p2->changeStrength(1, 1, p2->nameNode);
      } else {
        arg_2->setFlag(std::string("lives"));
        p2->changeStrength(0, 1, p2->nameNode);
      }
      subCtx_5->defineVariable(p2->name, p2);
    }
    currC_6->addMethod(m_2);
    find_more = false;
  }
  if ( find_more ) {
    for ( std::vector< std::shared_ptr<CodeNode>>::size_type i_5 = 0; i_5 != node->children.size(); i_5++) {
      std::shared_ptr<CodeNode> item_1 = node->children.at(i_5);
      this->WalkCollectMethods(item_1, ctx, wr);
    }
  }
  if ( node->hasBooleanProperty(std::string("serialize")) ) {
    serializedClasses.push_back( ctx->currentClass  );
  }
}

void  RangerFlowParser::FindWeakRefs( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr ) {
  std::vector<std::shared_ptr<RangerAppClassDesc>> list = ctx->getClasses();
  for ( std::vector< std::shared_ptr<RangerAppClassDesc>>::size_type i = 0; i != list.size(); i++) {
    std::shared_ptr<RangerAppClassDesc> classDesc = list.at(i);
    for ( std::vector< std::shared_ptr<RangerAppParamDesc>>::size_type i2 = 0; i2 != classDesc->variables.size(); i2++) {
      std::shared_ptr<RangerAppParamDesc> varD = classDesc->variables.at(i2);
      if ( varD->refType == 1 ) {
        if ( varD->isArray() ) {
          /** unused:  std::shared_ptr<CodeNode> nn = varD->nameNode   **/ ;
        }
        if ( varD->isHash() ) {
          /** unused:  std::shared_ptr<CodeNode> nn_1 = varD->nameNode   **/ ;
        }
        if ( varD->isObject() ) {
          /** unused:  std::shared_ptr<CodeNode> nn_2 = varD->nameNode   **/ ;
        }
      }
    }
  }
}

std::shared_ptr<RangerAppFunctionDesc>  RangerFlowParser::findFunctionDesc( std::shared_ptr<CodeNode> obj , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr ) {
  std::shared_ptr<RangerAppParamDesc> varDesc;
  std::shared_ptr<RangerAppFunctionDesc> varFnDesc;
  if ( obj->vref != this->getThisName() ) {
    if ( (obj->ns.size()) > 1 ) {
      int cnt = obj->ns.size();
      std::shared_ptr<RangerAppParamDesc> classRefDesc;
      std::shared_ptr<RangerAppClassDesc> classDesc;
      for ( std::vector< std::string>::size_type i = 0; i != obj->ns.size(); i++) {
        std::string strname = obj->ns.at(i);
        if ( i == 0 ) {
          if ( strname == this->getThisName() ) {
            classDesc  = ctx->getCurrentClass();
          } else {
            if ( ctx->isDefinedClass(strname) ) {
              classDesc  = ctx->findClass(strname);
              continue;
            }
            classRefDesc  = ctx->getVariableDef(strname);
            if ( (classRefDesc == NULL) || (classRefDesc->nameNode == NULL) ) {
              ctx->addError(obj, std::string("Error, no description for called object: ") + strname);
              break;
            }
            classRefDesc->ref_cnt = 1 + classRefDesc->ref_cnt;
            classDesc  = ctx->findClass(classRefDesc->nameNode->type_name);
            if ( classDesc == NULL ) {
              return varFnDesc;
            }
          }
        } else {
          if ( classDesc == NULL ) {
            return varFnDesc;
          }
          if ( i < (cnt - 1) ) {
            varDesc  = classDesc->findVariable(strname);
            if ( varDesc == NULL ) {
              ctx->addError(obj, std::string("Error, no description for refenced obj: ") + strname);
            }
            std::string subClass = varDesc->getTypeName();
            classDesc  = ctx->findClass(subClass);
            continue;
          }
          if ( classDesc != NULL  ) {
            varFnDesc  = classDesc->findMethod(strname);
            if ( varFnDesc == NULL ) {
              varFnDesc  = classDesc->findStaticMethod(strname);
              if ( varFnDesc == NULL ) {
                ctx->addError(obj, std::string(" function variable not found ") + strname);
              }
            }
          }
        }
      }
      return varFnDesc;
    }
    std::shared_ptr<RangerAppClassDesc> udesc = ctx->getCurrentClass();
    std::shared_ptr<RangerAppClassDesc> currClass = udesc;
    varFnDesc  = currClass->findMethod(obj->vref);
    if ( varFnDesc->nameNode != NULL  ) {
    } else {
      ctx->addError(obj, std::string("Error, no description for called function: ") + obj->vref);
    }
    return varFnDesc;
  }
  ctx->addError(obj, std::string("Can not call 'this' like function"));
  varFnDesc  =  std::make_shared<RangerAppFunctionDesc>();
  return varFnDesc;
}

std::shared_ptr<RangerAppParamDesc>  RangerFlowParser::findParamDesc( std::shared_ptr<CodeNode> obj , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr ) {
  std::shared_ptr<RangerAppParamDesc> varDesc;
  bool set_nsp = false;
  std::shared_ptr<RangerAppClassDesc> classDesc;
  if ( 0 == (obj->nsp.size()) ) {
    set_nsp = true;
  }
  if ( obj->vref != this->getThisName() ) {
    if ( (obj->ns.size()) > 1 ) {
      int cnt = obj->ns.size();
      std::shared_ptr<RangerAppParamDesc> classRefDesc;
      for ( std::vector< std::string>::size_type i = 0; i != obj->ns.size(); i++) {
        std::string strname = obj->ns.at(i);
        if ( i == 0 ) {
          if ( strname == this->getThisName() ) {
            classDesc  = ctx->getCurrentClass();
            if ( set_nsp ) {
              obj->nsp.push_back( classDesc  );
            }
          } else {
            if ( ctx->isDefinedClass(strname) ) {
              classDesc  = ctx->findClass(strname);
              if ( set_nsp ) {
                obj->nsp.push_back( classDesc  );
              }
              continue;
            }
            classRefDesc  = ctx->getVariableDef(strname);
            if ( classRefDesc == NULL ) {
              ctx->addError(obj, std::string("Error, no description for called object: ") + strname);
              break;
            }
            if ( set_nsp ) {
              obj->nsp.push_back( classRefDesc  );
            }
            classRefDesc->ref_cnt = 1 + classRefDesc->ref_cnt;
            classDesc  = ctx->findClass(classRefDesc->nameNode->type_name);
          }
        } else {
          if ( i < (cnt - 1) ) {
            varDesc  = classDesc->findVariable(strname);
            if ( varDesc == NULL ) {
              ctx->addError(obj, std::string("Error, no description for refenced obj: ") + strname);
            }
            std::string subClass = varDesc->getTypeName();
            classDesc  = ctx->findClass(subClass);
            if ( set_nsp ) {
              obj->nsp.push_back( varDesc  );
            }
            continue;
          }
          if ( classDesc != NULL  ) {
            varDesc  = classDesc->findVariable(strname);
            if ( varDesc == NULL ) {
              std::shared_ptr<RangerAppFunctionDesc> classMethod = classDesc->findMethod(strname);
              if ( classMethod == NULL ) {
                classMethod  = classDesc->findStaticMethod(strname);
                if ( classMethod == NULL ) {
                  ctx->addError(obj, std::string("variable not found ") + strname);
                }
              }
              if ( classMethod != NULL  ) {
                if ( set_nsp ) {
                  obj->nsp.push_back( classMethod  );
                }
                return classMethod;
              }
            }
            if ( set_nsp ) {
              obj->nsp.push_back( varDesc  );
            }
          }
        }
      }
      return varDesc;
    }
    varDesc  = ctx->getVariableDef(obj->vref);
    if ( varDesc->nameNode != NULL  ) {
    } else {
      std::cout << std::string("findParamDesc : description not found for ") + obj->vref << std::endl;
      if ( varDesc != NULL  ) {
        std::cout << std::string("Vardesc was found though...") + varDesc->name << std::endl;
      }
      ctx->addError(obj, std::string("Error, no description for called object: ") + obj->vref);
    }
    return varDesc;
  }
  std::shared_ptr<RangerAppClassDesc> cc = ctx->getCurrentClass();
  return cc;
}

bool  RangerFlowParser::areEqualTypes( std::shared_ptr<CodeNode> n1 , std::shared_ptr<CodeNode> n2 , std::shared_ptr<RangerAppWriterContext> ctx ) {
  if ( (((n1->eval_type != 0) && (n2->eval_type != 0)) && ((n1->eval_type_name.length()) > 0)) && ((n2->eval_type_name.length()) > 0) ) {
    if ( n1->eval_type_name == n2->eval_type_name ) {
    } else {
      bool b_ok = false;
      if ( ctx->isEnumDefined(n1->eval_type_name) && (n2->eval_type_name == std::string("int")) ) {
        b_ok = true;
      }
      if ( ctx->isEnumDefined(n2->eval_type_name) && (n1->eval_type_name == std::string("int")) ) {
        b_ok = true;
      }
      if ( (n1->eval_type_name == std::string("char")) && (n2->eval_type_name == std::string("int")) ) {
        b_ok = true;
      }
      if ( (n1->eval_type_name == std::string("int")) && (n2->eval_type_name == std::string("char")) ) {
        b_ok = true;
      }
      if ( ctx->isDefinedClass(n1->eval_type_name) && ctx->isDefinedClass(n2->eval_type_name) ) {
        std::shared_ptr<RangerAppClassDesc> c1 = ctx->findClass(n1->eval_type_name);
        std::shared_ptr<RangerAppClassDesc> c2 = ctx->findClass(n2->eval_type_name);
        if ( c1->isSameOrParentClass(n2->eval_type_name, ctx) ) {
          return true;
        }
        if ( c2->isSameOrParentClass(n1->eval_type_name, ctx) ) {
          return true;
        }
      }
      if ( b_ok == false ) {
        return false;
      }
    }
  }
  return true;
}

void  RangerFlowParser::shouldBeEqualTypes( std::shared_ptr<CodeNode> n1 , std::shared_ptr<CodeNode> n2 , std::shared_ptr<RangerAppWriterContext> ctx , std::string msg ) {
  if ( (((n1->eval_type != 0) && (n2->eval_type != 0)) && ((n1->eval_type_name.length()) > 0)) && ((n2->eval_type_name.length()) > 0) ) {
    if ( n1->eval_type_name == n2->eval_type_name ) {
    } else {
      bool b_ok = false;
      if ( ctx->isEnumDefined(n1->eval_type_name) && (n2->eval_type_name == std::string("int")) ) {
        b_ok = true;
      }
      if ( ctx->isEnumDefined(n2->eval_type_name) && (n1->eval_type_name == std::string("int")) ) {
        b_ok = true;
      }
      if ( ctx->isDefinedClass(n2->eval_type_name) ) {
        std::shared_ptr<RangerAppClassDesc> cc = ctx->findClass(n2->eval_type_name);
        if ( cc->isSameOrParentClass(n1->eval_type_name, ctx) ) {
          b_ok = true;
        }
      }
      if ( (n1->eval_type_name == std::string("char")) && (n2->eval_type_name == std::string("int")) ) {
        b_ok = true;
      }
      if ( (n1->eval_type_name == std::string("int")) && (n2->eval_type_name == std::string("char")) ) {
        b_ok = true;
      }
      if ( b_ok == false ) {
        ctx->addError(n1, ((((std::string("Type mismatch ") + n2->eval_type_name) + std::string(" <> ")) + n1->eval_type_name) + std::string(". ")) + msg);
      }
    }
  }
}

void  RangerFlowParser::shouldBeExpression( std::shared_ptr<CodeNode> n1 , std::shared_ptr<RangerAppWriterContext> ctx , std::string msg ) {
  if ( n1->expression == false ) {
    ctx->addError(n1, msg);
  }
}

void  RangerFlowParser::shouldHaveChildCnt( int cnt , std::shared_ptr<CodeNode> n1 , std::shared_ptr<RangerAppWriterContext> ctx , std::string msg ) {
  if ( (n1->children.size()) != cnt ) {
    ctx->addError(n1, msg);
  }
}

void  RangerFlowParser::shouldBeNumeric( std::shared_ptr<CodeNode> n1 , std::shared_ptr<RangerAppWriterContext> ctx , std::string msg ) {
  if ( (n1->eval_type != 0) && ((n1->eval_type_name.length()) > 0) ) {
    if ( false == ((n1->eval_type_name == std::string("double")) || (n1->eval_type_name == std::string("int"))) ) {
      ctx->addError(n1, ((std::string("Not numeric: ") + n1->eval_type_name) + std::string(". ")) + msg);
    }
  }
}

void  RangerFlowParser::shouldBeArray( std::shared_ptr<CodeNode> n1 , std::shared_ptr<RangerAppWriterContext> ctx , std::string msg ) {
  if ( n1->eval_type != 6 ) {
    ctx->addError(n1, std::string("Expecting array. ") + msg);
  }
}

void  RangerFlowParser::shouldBeType( std::string type_name , std::shared_ptr<CodeNode> n1 , std::shared_ptr<RangerAppWriterContext> ctx , std::string msg ) {
  if ( (n1->eval_type != 0) && ((n1->eval_type_name.length()) > 0) ) {
    if ( n1->eval_type_name == type_name ) {
    } else {
      bool b_ok = false;
      if ( ctx->isEnumDefined(n1->eval_type_name) && (type_name == std::string("int")) ) {
        b_ok = true;
      }
      if ( ctx->isEnumDefined(type_name) && (n1->eval_type_name == std::string("int")) ) {
        b_ok = true;
      }
      if ( (n1->eval_type_name == std::string("char")) && (type_name == std::string("int")) ) {
        b_ok = true;
      }
      if ( (n1->eval_type_name == std::string("int")) && (type_name == std::string("char")) ) {
        b_ok = true;
      }
      if ( b_ok == false ) {
        ctx->addError(n1, ((((std::string("Type mismatch ") + type_name) + std::string(" <> ")) + n1->eval_type_name) + std::string(". ")) + msg);
      }
    }
  }
}

NodeEvalState::NodeEvalState( ) {
  this->is_running = false;
  this->child_index = -1;
  this->cmd_index = -1;
  this->is_ready = false;
  this->is_waiting = false;
  this->exit_after = false;
  this->expand_args = false;
  this->ask_expand = false;
  this->eval_rest = false;
  this->exec_cnt = 0;
  this->b_debugger = false;
  this->b_top_node = false;
  this->ask_eval = false;
  this->param_eval_on = false;
  this->eval_index = -1;
  this->eval_end_index = -1;
  this->ask_eval_start = 0;
  this->ask_eval_end = 0;
}

RangerGenericClassWriter::RangerGenericClassWriter( ) {
}

std::string  RangerGenericClassWriter::EncodeString( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr ) {
  /** unused:  std::string encoded_str = std::string("")   **/ ;
  int str_length = node->string_value.length();
  std::string encoded_str_2 = std::string("");
  int ii = 0;
  while (ii < str_length) {
    int cc = node->string_value.at(ii);
    switch (cc ) { 
      case 8 : 
        {
          encoded_str_2 = (encoded_str_2 + (std::string(1, char(92)))) + (std::string(1, char(98)));
          break;
        }
      case 9 : 
        {
          encoded_str_2 = (encoded_str_2 + (std::string(1, char(92)))) + (std::string(1, char(116)));
          break;
        }
      case 10 : 
        {
          encoded_str_2 = (encoded_str_2 + (std::string(1, char(92)))) + (std::string(1, char(110)));
          break;
        }
      case 12 : 
        {
          encoded_str_2 = (encoded_str_2 + (std::string(1, char(92)))) + (std::string(1, char(102)));
          break;
        }
      case 13 : 
        {
          encoded_str_2 = (encoded_str_2 + (std::string(1, char(92)))) + (std::string(1, char(114)));
          break;
        }
      case 34 : 
        {
          encoded_str_2 = (encoded_str_2 + (std::string(1, char(92)))) + (std::string(1, char(34)));
          break;
        }
      case 92 : 
        {
          encoded_str_2 = (encoded_str_2 + (std::string(1, char(92)))) + (std::string(1, char(92)));
          break;
        }
      default: 
        encoded_str_2 = encoded_str_2 + (std::string(1, char(cc)));
        break;
    }
    ii = ii + 1;
  }
  return encoded_str_2;
}

void  RangerGenericClassWriter::CustomOperator( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr ) {
}

void  RangerGenericClassWriter::WriteSetterVRef( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr ) {
}

void  RangerGenericClassWriter::writeArrayTypeDef( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr ) {
}

void  RangerGenericClassWriter::WriteEnum( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr ) {
  if ( node->eval_type == 11 ) {
    std::string rootObjName = node->ns.at(0);
    std::shared_ptr<RangerAppEnum> e = ctx->getEnum(rootObjName);
    if ( e != NULL  ) {
      std::string enumName = node->ns.at(1);
      wr->out(std::string("") + std::to_string(((cpp_get_map_int_value<std::string>(e->values, enumName)).value)), false);
    } else {
      if ( node->hasParamDesc ) {
        std::shared_ptr<RangerAppParamDesc> pp = node->paramDesc;
        std::shared_ptr<CodeNode> nn = pp->nameNode;
        this->WriteVRef(nn, ctx, wr);
      }
    }
  }
}

void  RangerGenericClassWriter::WriteScalarValue( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr ) {
  switch (node->value_type ) { 
    case 2 : 
      {
        wr->out(std::string("") + std::to_string(node->double_value), false);
        break;
      }
    case 4 : 
      {
        std::string s = this->EncodeString(node, ctx, wr);
        wr->out((std::string("\"") + s) + std::string("\""), false);
        break;
      }
    case 3 : 
      {
        wr->out(std::string("") + std::to_string(node->int_value), false);
        break;
      }
    case 5 : 
      {
        if ( node->boolean_value ) {
          wr->out(std::string("true"), false);
        } else {
          wr->out(std::string("false"), false);
        }
        break;
      }
  }
}

std::string  RangerGenericClassWriter::getTypeString( std::string type_string ) {
  return type_string;
}

void  RangerGenericClassWriter::import_lib( std::string lib_name , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr ) {
  wr->addImport(lib_name);
}

std::string  RangerGenericClassWriter::getObjectTypeString( std::string type_string , std::shared_ptr<RangerAppWriterContext> ctx ) {
  bool caseMatched = false;
  if( type_string == std::string("int")) {
    caseMatched = true;
    return std::string("Integer");
  }
  if( type_string == std::string("string")) {
    caseMatched = true;
    return std::string("String");
  }
  if( type_string == std::string("chararray")) {
    caseMatched = true;
    return std::string("byte[]");
  }
  if( type_string == std::string("char")) {
    caseMatched = true;
    return std::string("byte");
  }
  if( type_string == std::string("boolean")) {
    caseMatched = true;
    return std::string("Boolean");
  }
  if( type_string == std::string("double")) {
    caseMatched = true;
    return std::string("Double");
  }
  return type_string;
}

void  RangerGenericClassWriter::release_local_vars( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr ) {
  for ( std::vector< std::string>::size_type i = 0; i != ctx->localVarNames.size(); i++) {
    std::string n = ctx->localVarNames.at(i);
    std::shared_ptr<RangerAppParamDesc> p = ctx->localVariables[n];
    if ( p->ref_cnt == 0 ) {
      continue;
    }
    if ( p->isAllocatedType() ) {
      if ( 1 == p->getStrength() ) {
        if ( p->nameNode->eval_type == 7 ) {
        }
        if ( p->nameNode->eval_type == 6 ) {
        }
        if ( (p->nameNode->eval_type != 6) && (p->nameNode->eval_type != 7) ) {
        }
      }
      if ( 0 == p->getStrength() ) {
        if ( p->nameNode->eval_type == 7 ) {
        }
        if ( p->nameNode->eval_type == 6 ) {
        }
        if ( (p->nameNode->eval_type != 6) && (p->nameNode->eval_type != 7) ) {
        }
      }
    }
  }
  if ( ctx->is_function ) {
    return;
  }
  if ( ctx->parent != NULL  ) {
    this->release_local_vars(node, ctx->parent, wr);
  }
}

void  RangerGenericClassWriter::WalkNode( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr ) {
  this->compiler->WalkNode(node, ctx, wr);
}

void  RangerGenericClassWriter::writeTypeDef( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr ) {
  wr->out(node->type_name, false);
}

void  RangerGenericClassWriter::writeRawTypeDef( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr ) {
  this->writeTypeDef(node, ctx, wr);
}

std::string  RangerGenericClassWriter::adjustType( std::string tn ) {
  return tn;
}

void  RangerGenericClassWriter::WriteVRef( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr ) {
  if ( node->eval_type == 11 ) {
    if ( (node->ns.size()) > 1 ) {
      std::string rootObjName = node->ns.at(0);
      std::string enumName = node->ns.at(1);
      std::shared_ptr<RangerAppEnum> e = ctx->getEnum(rootObjName);
      if ( e != NULL  ) {
        wr->out(std::string("") + std::to_string(((cpp_get_map_int_value<std::string>(e->values, enumName)).value)), false);
        return;
      }
    }
  }
  if ( (node->nsp.size()) > 0 ) {
    for ( std::vector< std::shared_ptr<RangerAppParamDesc>>::size_type i = 0; i != node->nsp.size(); i++) {
      std::shared_ptr<RangerAppParamDesc> p = node->nsp.at(i);
      if ( i > 0 ) {
        wr->out(std::string("."), false);
      }
      if ( (p->compiledName.length()) > 0 ) {
        wr->out(this->adjustType(p->compiledName), false);
      } else {
        if ( (p->name.length()) > 0 ) {
          wr->out(this->adjustType(p->name), false);
        } else {
          wr->out(this->adjustType((node->ns.at(i))), false);
        }
      }
    }
    return;
  }
  for ( std::vector< std::string>::size_type i_1 = 0; i_1 != node->ns.size(); i_1++) {
    std::string part = node->ns.at(i_1);
    if ( i_1 > 0 ) {
      wr->out(std::string("."), false);
    }
    wr->out(this->adjustType(part), false);
  }
}

void  RangerGenericClassWriter::writeVarDef( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr ) {
  if ( node->hasParamDesc ) {
    std::shared_ptr<RangerAppParamDesc> p = node->paramDesc;
    if ( p->set_cnt > 0 ) {
      wr->out(std::string("var ") + p->name, false);
    } else {
      wr->out(std::string("const ") + p->name, false);
    }
    if ( (node->children.size()) > 2 ) {
      wr->out(std::string(" = "), false);
      ctx->setInExpr();
      std::shared_ptr<CodeNode> value = node->getThird();
      this->WalkNode(value, ctx, wr);
      ctx->unsetInExpr();
      wr->out(std::string(";"), true);
    } else {
      wr->out(std::string(";"), true);
    }
  }
}

void  RangerGenericClassWriter::CreateLambdaCall( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr ) {
  std::shared_ptr<CodeNode> fName = node->children.at(0);
  std::shared_ptr<CodeNode> args = node->children.at(1);
  this->WriteVRef(fName, ctx, wr);
  wr->out(std::string("("), false);
  for ( std::vector< std::shared_ptr<CodeNode>>::size_type i = 0; i != args->children.size(); i++) {
    std::shared_ptr<CodeNode> arg = args->children.at(i);
    if ( i > 0 ) {
      wr->out(std::string(", "), false);
    }
    this->WalkNode(arg, ctx, wr);
  }
  wr->out(std::string(")"), false);
  if ( ctx->expressionLevel() == 0 ) {
    wr->out(std::string(";"), true);
  }
}

void  RangerGenericClassWriter::CreateLambda( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr ) {
  std::shared_ptr<RangerAppWriterContext> lambdaCtx = node->lambda_ctx;
  std::shared_ptr<CodeNode> args = node->children.at(1);
  std::shared_ptr<CodeNode> body = node->children.at(2);
  wr->out(std::string("("), false);
  for ( std::vector< std::shared_ptr<CodeNode>>::size_type i = 0; i != args->children.size(); i++) {
    std::shared_ptr<CodeNode> arg = args->children.at(i);
    if ( i > 0 ) {
      wr->out(std::string(", "), false);
    }
    this->WalkNode(arg, lambdaCtx, wr);
  }
  wr->out(std::string(")"), false);
  wr->out(std::string(" => { "), true);
  wr->indent(1);
  lambdaCtx->restartExpressionLevel();
  for ( std::vector< std::shared_ptr<CodeNode>>::size_type i_1 = 0; i_1 != body->children.size(); i_1++) {
    std::shared_ptr<CodeNode> item = body->children.at(i_1);
    this->WalkNode(item, lambdaCtx, wr);
  }
  wr->newline();
  wr->indent(-1);
  wr->out(std::string("}"), true);
}

void  RangerGenericClassWriter::writeFnCall( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr ) {
  if ( node->hasFnCall ) {
    std::shared_ptr<CodeNode> fc = node->getFirst();
    this->WriteVRef(fc, ctx, wr);
    wr->out(std::string("("), false);
    std::shared_ptr<CodeNode> givenArgs = node->getSecond();
    ctx->setInExpr();
    for ( std::vector< std::shared_ptr<RangerAppParamDesc>>::size_type i = 0; i != node->fnDesc->params.size(); i++) {
      std::shared_ptr<RangerAppParamDesc> arg = node->fnDesc->params.at(i);
      if ( i > 0 ) {
        wr->out(std::string(", "), false);
      }
      if ( (givenArgs->children.size()) <= i ) {
        std::shared_ptr<CodeNode> defVal = arg->nameNode->getFlag(std::string("default"));
        if ( defVal != NULL  ) {
          std::shared_ptr<CodeNode> fc_1 = defVal->vref_annotation->getFirst();
          this->WalkNode(fc_1, ctx, wr);
        } else {
          ctx->addError(node, std::string("Default argument was missing"));
        }
        continue;
      }
      std::shared_ptr<CodeNode> n = givenArgs->children.at(i);
      this->WalkNode(n, ctx, wr);
    }
    ctx->unsetInExpr();
    wr->out(std::string(")"), false);
    if ( ctx->expressionLevel() == 0 ) {
      wr->out(std::string(";"), true);
    }
  }
}

void  RangerGenericClassWriter::writeNewCall( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr ) {
  if ( node->hasNewOper ) {
    std::shared_ptr<RangerAppClassDesc> cl = node->clDesc;
    /** unused:  std::shared_ptr<CodeNode> fc = node->getSecond()   **/ ;
    wr->out(std::string("new ") + node->clDesc->name, false);
    wr->out(std::string("("), false);
    std::shared_ptr<RangerAppFunctionDesc> constr = cl->constructor_fn;
    std::shared_ptr<CodeNode> givenArgs = node->getThird();
    if ( constr != NULL  ) {
      for ( std::vector< std::shared_ptr<RangerAppParamDesc>>::size_type i = 0; i != constr->params.size(); i++) {
        std::shared_ptr<RangerAppParamDesc> arg = constr->params.at(i);
        std::shared_ptr<CodeNode> n = givenArgs->children.at(i);
        if ( i > 0 ) {
          wr->out(std::string(", "), false);
        }
        if ( true || (arg->nameNode != NULL ) ) {
          this->WalkNode(n, ctx, wr);
        }
      }
    }
    wr->out(std::string(")"), false);
  }
}

void  RangerGenericClassWriter::writeInterface( std::shared_ptr<RangerAppClassDesc> cl , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr ) {
}

void  RangerGenericClassWriter::disabledVarDef( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr ) {
}

void  RangerGenericClassWriter::writeClass( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr ) {
  std::shared_ptr<RangerAppClassDesc> cl = node->clDesc;
  if ( cl == NULL ) {
    return;
  }
  wr->out((std::string("class ") + cl->name) + std::string(" { "), true);
  wr->indent(1);
  for ( std::vector< std::shared_ptr<RangerAppParamDesc>>::size_type i = 0; i != cl->variables.size(); i++) {
    std::shared_ptr<RangerAppParamDesc> pvar = cl->variables.at(i);
    wr->out((((std::string("/* var ") + pvar->name) + std::string(" => ")) + pvar->nameNode->parent->getCode()) + std::string(" */ "), true);
  }
  for ( std::vector< std::shared_ptr<RangerAppFunctionDesc>>::size_type i_1 = 0; i_1 != cl->static_methods.size(); i_1++) {
    std::shared_ptr<RangerAppFunctionDesc> pvar_1 = cl->static_methods.at(i_1);
    wr->out((std::string("/* static ") + pvar_1->name) + std::string(" */ "), true);
  }
  for ( std::vector< std::string>::size_type i_2 = 0; i_2 != cl->defined_variants.size(); i_2++) {
    std::string fnVar = cl->defined_variants.at(i_2);
    std::shared_ptr<RangerAppMethodVariants> mVs = cl->method_variants[fnVar];
    for ( std::vector< std::shared_ptr<RangerAppFunctionDesc>>::size_type i_3 = 0; i_3 != mVs->variants.size(); i_3++) {
      std::shared_ptr<RangerAppFunctionDesc> variant = mVs->variants.at(i_3);
      wr->out((std::string("function ") + variant->name) + std::string("() {"), true);
      wr->indent(1);
      wr->newline();
      std::shared_ptr<RangerAppWriterContext> subCtx = ctx->fork();
      this->WalkNode(variant->fnBody, subCtx, wr);
      wr->newline();
      wr->indent(-1);
      wr->out(std::string("}"), true);
    }
  }
  wr->indent(-1);
  wr->out(std::string("}"), true);
}

RangerJava7ClassWriter::RangerJava7ClassWriter( ) {
  this->signature_cnt = 0;
}

std::string  RangerJava7ClassWriter::getSignatureInterface( std::string s ) {
   r_optional_primitive<int>  idx = cpp_get_map_int_value<std::string>(signatures, s);
  if ( idx.has_value ) {
    return std::string("LambdaSignature") + std::to_string((idx.value));
  }
  signature_cnt = signature_cnt + 1;
  signatures[s] = signature_cnt;
  return std::string("LambdaSignature") + std::to_string(signature_cnt);
}

std::string  RangerJava7ClassWriter::adjustType( std::string tn ) {
  if ( tn == std::string("this") ) {
    return std::string("this");
  }
  return tn;
}

std::string  RangerJava7ClassWriter::getObjectTypeString( std::string type_string , std::shared_ptr<RangerAppWriterContext> ctx ) {
  bool caseMatched = false;
  if( type_string == std::string("int")) {
    caseMatched = true;
    return std::string("Integer");
  }
  if( type_string == std::string("string")) {
    caseMatched = true;
    return std::string("String");
  }
  if( type_string == std::string("charbuffer")) {
    caseMatched = true;
    return std::string("byte[]");
  }
  if( type_string == std::string("char")) {
    caseMatched = true;
    return std::string("byte");
  }
  if( type_string == std::string("boolean")) {
    caseMatched = true;
    return std::string("Boolean");
  }
  if( type_string == std::string("double")) {
    caseMatched = true;
    return std::string("Double");
  }
  return type_string;
}

std::string  RangerJava7ClassWriter::getTypeString( std::string type_string ) {
  bool caseMatched = false;
  if( type_string == std::string("int")) {
    caseMatched = true;
    return std::string("int");
  }
  if( type_string == std::string("string")) {
    caseMatched = true;
    return std::string("String");
  }
  if( type_string == std::string("charbuffer")) {
    caseMatched = true;
    return std::string("byte[]");
  }
  if( type_string == std::string("char")) {
    caseMatched = true;
    return std::string("byte");
  }
  if( type_string == std::string("boolean")) {
    caseMatched = true;
    return std::string("boolean");
  }
  if( type_string == std::string("double")) {
    caseMatched = true;
    return std::string("double");
  }
  return type_string;
}

void  RangerJava7ClassWriter::writeTypeDef( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr ) {
  int v_type = node->value_type;
  std::string t_name = node->type_name;
  std::string a_name = node->array_type;
  std::string k_name = node->key_type;
  if ( ((v_type == 8) || (v_type == 9)) || (v_type == 0) ) {
    v_type = node->typeNameAsType(ctx);
  }
  if ( node->eval_type != 0 ) {
    v_type = node->eval_type;
    if ( (node->eval_type_name.length()) > 0 ) {
      t_name = node->eval_type_name;
    }
    if ( (node->eval_array_type.length()) > 0 ) {
      a_name = node->eval_array_type;
    }
    if ( (node->eval_key_type.length()) > 0 ) {
      k_name = node->eval_key_type;
    }
  }
  if ( node->hasFlag(std::string("optional")) ) {
    wr->addImport(std::string("java.util.Optional"));
    wr->out(std::string("Optional<"), false);
    switch (v_type ) { 
      case 15 : 
        {
          std::string sig = this->buildLambdaSignature((node->expression_value));
          std::string iface_name = this->getSignatureInterface(sig);
          wr->out(iface_name, false);
          if ( (iface_created.count(iface_name)) == false ) {
            std::shared_ptr<CodeNode> fnNode = node->expression_value->children.at(0);
            std::shared_ptr<CodeNode> args = node->expression_value->children.at(1);
            iface_created[iface_name] = true;
            std::shared_ptr<CodeWriter> utilWr = wr->getFileWriter(std::string("."), (iface_name + std::string(".java")));
            utilWr->out((std::string("public interface ") + iface_name) + std::string(" { "), true);
            utilWr->indent(1);
            utilWr->out(std::string("public "), false);
            this->writeTypeDef(fnNode, ctx, utilWr);
            utilWr->out(std::string(" run("), false);
            for ( std::vector< std::shared_ptr<CodeNode>>::size_type i = 0; i != args->children.size(); i++) {
              std::shared_ptr<CodeNode> arg = args->children.at(i);
              if ( i > 0 ) {
                utilWr->out(std::string(", "), false);
              }
              this->writeTypeDef(arg, ctx, utilWr);
              utilWr->out(std::string(" "), false);
              utilWr->out(arg->vref, false);
            }
            utilWr->out(std::string(");"), true);
            utilWr->indent(-1);
            utilWr->out(std::string("}"), true);
          }
          break;
        }
      case 11 : 
        {
          wr->out(std::string("Integer"), false);
          break;
        }
      case 3 : 
        {
          wr->out(std::string("Integer"), false);
          break;
        }
      case 2 : 
        {
          wr->out(std::string("Double"), false);
          break;
        }
      case 4 : 
        {
          wr->out(std::string("String"), false);
          break;
        }
      case 5 : 
        {
          wr->out(std::string("Boolean"), false);
          break;
        }
      case 12 : 
        {
          wr->out(std::string("byte"), false);
          break;
        }
      case 13 : 
        {
          wr->out(std::string("byte[]"), false);
          break;
        }
      case 7 : 
        {
          wr->out((((std::string("HashMap<") + this->getObjectTypeString(k_name, ctx)) + std::string(",")) + this->getObjectTypeString(a_name, ctx)) + std::string(">"), false);
          wr->addImport(std::string("java.util.*"));
          break;
        }
      case 6 : 
        {
          wr->out((std::string("ArrayList<") + this->getObjectTypeString(a_name, ctx)) + std::string(">"), false);
          wr->addImport(std::string("java.util.*"));
          break;
        }
      default: 
        if ( t_name == std::string("void") ) {
          wr->out(std::string("void"), false);
        } else {
          wr->out(this->getObjectTypeString(t_name, ctx), false);
        }
        break;
    }
  } else {
    switch (v_type ) { 
      case 15 : 
        {
          std::string sig_1 = this->buildLambdaSignature((node->expression_value));
          std::string iface_name_1 = this->getSignatureInterface(sig_1);
          wr->out(iface_name_1, false);
          if ( (iface_created.count(iface_name_1)) == false ) {
            std::shared_ptr<CodeNode> fnNode_1 = node->expression_value->children.at(0);
            std::shared_ptr<CodeNode> args_1 = node->expression_value->children.at(1);
            iface_created[iface_name_1] = true;
            std::shared_ptr<CodeWriter> utilWr_1 = wr->getFileWriter(std::string("."), (iface_name_1 + std::string(".java")));
            utilWr_1->out((std::string("public interface ") + iface_name_1) + std::string(" { "), true);
            utilWr_1->indent(1);
            utilWr_1->out(std::string("public "), false);
            this->writeTypeDef(fnNode_1, ctx, utilWr_1);
            utilWr_1->out(std::string(" run("), false);
            for ( std::vector< std::shared_ptr<CodeNode>>::size_type i_1 = 0; i_1 != args_1->children.size(); i_1++) {
              std::shared_ptr<CodeNode> arg_1 = args_1->children.at(i_1);
              if ( i_1 > 0 ) {
                utilWr_1->out(std::string(", "), false);
              }
              this->writeTypeDef(arg_1, ctx, utilWr_1);
              utilWr_1->out(std::string(" "), false);
              utilWr_1->out(arg_1->vref, false);
            }
            utilWr_1->out(std::string(");"), true);
            utilWr_1->indent(-1);
            utilWr_1->out(std::string("}"), true);
          }
          break;
        }
      case 11 : 
        {
          wr->out(std::string("int"), false);
          break;
        }
      case 3 : 
        {
          wr->out(std::string("int"), false);
          break;
        }
      case 2 : 
        {
          wr->out(std::string("double"), false);
          break;
        }
      case 12 : 
        {
          wr->out(std::string("byte"), false);
          break;
        }
      case 13 : 
        {
          wr->out(std::string("byte[]"), false);
          break;
        }
      case 4 : 
        {
          wr->out(std::string("String"), false);
          break;
        }
      case 5 : 
        {
          wr->out(std::string("boolean"), false);
          break;
        }
      case 7 : 
        {
          wr->out((((std::string("HashMap<") + this->getObjectTypeString(k_name, ctx)) + std::string(",")) + this->getObjectTypeString(a_name, ctx)) + std::string(">"), false);
          wr->addImport(std::string("java.util.*"));
          break;
        }
      case 6 : 
        {
          wr->out((std::string("ArrayList<") + this->getObjectTypeString(a_name, ctx)) + std::string(">"), false);
          wr->addImport(std::string("java.util.*"));
          break;
        }
      default: 
        if ( t_name == std::string("void") ) {
          wr->out(std::string("void"), false);
        } else {
          wr->out(this->getTypeString(t_name), false);
        }
        break;
    }
  }
  if ( node->hasFlag(std::string("optional")) ) {
    wr->out(std::string(">"), false);
  }
}

void  RangerJava7ClassWriter::WriteVRef( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr ) {
  if ( node->vref == std::string("this") ) {
    wr->out(std::string("this"), false);
    return;
  }
  if ( node->eval_type == 11 ) {
    if ( (node->ns.size()) > 1 ) {
      std::string rootObjName = node->ns.at(0);
      std::string enumName = node->ns.at(1);
      std::shared_ptr<RangerAppEnum> e = ctx->getEnum(rootObjName);
      if ( e != NULL  ) {
        wr->out(std::string("") + std::to_string(((cpp_get_map_int_value<std::string>(e->values, enumName)).value)), false);
        return;
      }
    }
  }
  int max_len = node->ns.size();
  if ( (node->nsp.size()) > 0 ) {
    for ( std::vector< std::shared_ptr<RangerAppParamDesc>>::size_type i = 0; i != node->nsp.size(); i++) {
      std::shared_ptr<RangerAppParamDesc> p = node->nsp.at(i);
      if ( i == 0 ) {
        std::string part = node->ns.at(0);
        if ( part == std::string("this") ) {
          wr->out(std::string("this"), false);
          continue;
        }
      }
      if ( i > 0 ) {
        wr->out(std::string("."), false);
      }
      if ( (p->compiledName.length()) > 0 ) {
        wr->out(this->adjustType(p->compiledName), false);
      } else {
        if ( (p->name.length()) > 0 ) {
          wr->out(this->adjustType(p->name), false);
        } else {
          wr->out(this->adjustType((node->ns.at(i))), false);
        }
      }
      if ( i < (max_len - 1) ) {
        if ( p->nameNode->hasFlag(std::string("optional")) ) {
          wr->out(std::string(".get()"), false);
        }
      }
    }
    return;
  }
  if ( node->hasParamDesc ) {
    std::shared_ptr<RangerAppParamDesc> p_1 = node->paramDesc;
    wr->out(p_1->compiledName, false);
    return;
  }
  for ( std::vector< std::string>::size_type i_1 = 0; i_1 != node->ns.size(); i_1++) {
    std::string part_1 = node->ns.at(i_1);
    if ( i_1 > 0 ) {
      wr->out(std::string("."), false);
    }
    wr->out(this->adjustType(part_1), false);
  }
}

void  RangerJava7ClassWriter::disabledVarDef( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr ) {
  if ( node->hasParamDesc ) {
    std::shared_ptr<CodeNode> nn = node->children.at(1);
    std::shared_ptr<RangerAppParamDesc> p = nn->paramDesc;
    if ( (p->ref_cnt == 0) && (p->is_class_variable == false) ) {
      wr->out(std::string("/** unused:  "), false);
    }
    wr->out(p->compiledName, false);
    if ( (node->children.size()) > 2 ) {
      wr->out(std::string(" = "), false);
      ctx->setInExpr();
      std::shared_ptr<CodeNode> value = node->getThird();
      this->WalkNode(value, ctx, wr);
      ctx->unsetInExpr();
    } else {
      bool b_was_set = false;
      if ( nn->value_type == 6 ) {
        wr->out(std::string(" = new "), false);
        this->writeTypeDef(p->nameNode, ctx, wr);
        wr->out(std::string("()"), false);
        b_was_set = true;
      }
      if ( nn->value_type == 7 ) {
        wr->out(std::string(" = new "), false);
        this->writeTypeDef(p->nameNode, ctx, wr);
        wr->out(std::string("()"), false);
        b_was_set = true;
      }
      if ( (b_was_set == false) && nn->hasFlag(std::string("optional")) ) {
        wr->out(std::string(" = Optional.empty()"), false);
      }
    }
    if ( (p->ref_cnt == 0) && (p->is_class_variable == true) ) {
      wr->out(std::string("     /** note: unused */"), false);
    }
    if ( (p->ref_cnt == 0) && (p->is_class_variable == false) ) {
      wr->out(std::string("   **/ ;"), true);
    } else {
      wr->out(std::string(";"), false);
      wr->newline();
    }
  }
}

void  RangerJava7ClassWriter::writeVarDef( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr ) {
  if ( node->hasParamDesc ) {
    std::shared_ptr<CodeNode> nn = node->children.at(1);
    std::shared_ptr<RangerAppParamDesc> p = nn->paramDesc;
    if ( (p->ref_cnt == 0) && (p->is_class_variable == false) ) {
      wr->out(std::string("/** unused:  "), false);
    }
    if ( (p->set_cnt > 0) || p->is_class_variable ) {
      wr->out(std::string(""), false);
    } else {
      wr->out(std::string("final "), false);
    }
    this->writeTypeDef(p->nameNode, ctx, wr);
    wr->out(std::string(" "), false);
    wr->out(p->compiledName, false);
    if ( (node->children.size()) > 2 ) {
      wr->out(std::string(" = "), false);
      ctx->setInExpr();
      std::shared_ptr<CodeNode> value = node->getThird();
      this->WalkNode(value, ctx, wr);
      ctx->unsetInExpr();
    } else {
      bool b_was_set = false;
      if ( nn->value_type == 6 ) {
        wr->out(std::string(" = new "), false);
        this->writeTypeDef(p->nameNode, ctx, wr);
        wr->out(std::string("()"), false);
        b_was_set = true;
      }
      if ( nn->value_type == 7 ) {
        wr->out(std::string(" = new "), false);
        this->writeTypeDef(p->nameNode, ctx, wr);
        wr->out(std::string("()"), false);
        b_was_set = true;
      }
      if ( (b_was_set == false) && nn->hasFlag(std::string("optional")) ) {
        wr->out(std::string(" = Optional.empty()"), false);
      }
    }
    if ( (p->ref_cnt == 0) && (p->is_class_variable == true) ) {
      wr->out(std::string("     /** note: unused */"), false);
    }
    if ( (p->ref_cnt == 0) && (p->is_class_variable == false) ) {
      wr->out(std::string("   **/ ;"), true);
    } else {
      wr->out(std::string(";"), false);
      wr->newline();
    }
  }
}

void  RangerJava7ClassWriter::writeArgsDef( std::shared_ptr<RangerAppFunctionDesc> fnDesc , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr ) {
  for ( std::vector< std::shared_ptr<RangerAppParamDesc>>::size_type i = 0; i != fnDesc->params.size(); i++) {
    std::shared_ptr<RangerAppParamDesc> arg = fnDesc->params.at(i);
    if ( i > 0 ) {
      wr->out(std::string(","), false);
    }
    wr->out(std::string(" "), false);
    this->writeTypeDef(arg->nameNode, ctx, wr);
    wr->out((std::string(" ") + arg->name) + std::string(" "), false);
  }
}

void  RangerJava7ClassWriter::CustomOperator( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr ) {
  std::shared_ptr<CodeNode> fc = node->getFirst();
  std::string cmd = fc->vref;
  if ( cmd == std::string("return") ) {
    wr->newline();
    if ( (node->children.size()) > 1 ) {
      std::shared_ptr<CodeNode> value = node->getSecond();
      if ( value->hasParamDesc ) {
        std::shared_ptr<CodeNode> nn = value->paramDesc->nameNode;
        if ( ctx->isDefinedClass(nn->type_name) ) {
          /** unused:  std::shared_ptr<RangerAppClassDesc> cl = ctx->findClass(nn->type_name)   **/ ;
          std::shared_ptr<RangerAppFunctionDesc> activeFn = ctx->getCurrentMethod();
          std::shared_ptr<CodeNode> fnNameNode = activeFn->nameNode;
          if ( fnNameNode->hasFlag(std::string("optional")) ) {
            wr->out(std::string("return Optional.ofNullable(("), false);
            this->WalkNode(value, ctx, wr);
            wr->out(std::string(".isPresent() ? ("), false);
            wr->out(fnNameNode->type_name, false);
            wr->out(std::string(")"), false);
            this->WalkNode(value, ctx, wr);
            wr->out(std::string(".get() : null ) );"), true);
            return;
          }
        }
      }
      wr->out(std::string("return "), false);
      ctx->setInExpr();
      this->WalkNode(value, ctx, wr);
      ctx->unsetInExpr();
      wr->out(std::string(";"), true);
    } else {
      wr->out(std::string("return;"), true);
    }
  }
}

std::string  RangerJava7ClassWriter::buildLambdaSignature( std::shared_ptr<CodeNode> node ) {
  std::shared_ptr<CodeNode> exp = node;
  std::string exp_s = std::string("");
  std::shared_ptr<CodeNode> fc = exp->getFirst();
  std::shared_ptr<CodeNode> args = exp->getSecond();
  exp_s = exp_s + fc->buildTypeSignature();
  exp_s = exp_s + std::string("(");
  for ( std::vector< std::shared_ptr<CodeNode>>::size_type i = 0; i != args->children.size(); i++) {
    std::shared_ptr<CodeNode> arg = args->children.at(i);
    exp_s = exp_s + arg->buildTypeSignature();
    exp_s = exp_s + std::string(",");
  }
  exp_s = exp_s + std::string(")");
  return exp_s;
}

void  RangerJava7ClassWriter::CreateLambdaCall( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr ) {
  std::shared_ptr<CodeNode> fName = node->children.at(0);
  std::shared_ptr<CodeNode> givenArgs = node->children.at(1);
  this->WriteVRef(fName, ctx, wr);
  std::shared_ptr<RangerAppParamDesc> param = ctx->getVariableDef(fName->vref);
  std::shared_ptr<CodeNode> args = param->nameNode->expression_value->children.at(1);
  wr->out(std::string(".run("), false);
  for ( std::vector< std::shared_ptr<CodeNode>>::size_type i = 0; i != args->children.size(); i++) {
    std::shared_ptr<CodeNode> arg = args->children.at(i);
    std::shared_ptr<CodeNode> n = givenArgs->children.at(i);
    if ( i > 0 ) {
      wr->out(std::string(", "), false);
    }
    if ( arg->value_type != 0 ) {
      this->WalkNode(n, ctx, wr);
    }
  }
  if ( ctx->expressionLevel() == 0 ) {
    wr->out(std::string(");"), true);
  } else {
    wr->out(std::string(")"), false);
  }
}

void  RangerJava7ClassWriter::CreateLambda( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr ) {
  std::shared_ptr<RangerAppWriterContext> lambdaCtx = node->lambda_ctx;
  std::shared_ptr<CodeNode> fnNode = node->children.at(0);
  std::shared_ptr<CodeNode> args = node->children.at(1);
  std::shared_ptr<CodeNode> body = node->children.at(2);
  std::string sig = this->buildLambdaSignature(node);
  std::string iface_name = this->getSignatureInterface(sig);
  if ( (iface_created.count(iface_name)) == false ) {
    iface_created[iface_name] = true;
    std::shared_ptr<CodeWriter> utilWr = wr->getFileWriter(std::string("."), (iface_name + std::string(".java")));
    utilWr->out((std::string("public interface ") + iface_name) + std::string(" { "), true);
    utilWr->indent(1);
    utilWr->out(std::string("public "), false);
    this->writeTypeDef(fnNode, ctx, utilWr);
    utilWr->out(std::string(" run("), false);
    for ( std::vector< std::shared_ptr<CodeNode>>::size_type i = 0; i != args->children.size(); i++) {
      std::shared_ptr<CodeNode> arg = args->children.at(i);
      if ( i > 0 ) {
        utilWr->out(std::string(", "), false);
      }
      this->writeTypeDef(arg, lambdaCtx, utilWr);
      utilWr->out(std::string(" "), false);
      utilWr->out(arg->vref, false);
    }
    utilWr->out(std::string(");"), true);
    utilWr->indent(-1);
    utilWr->out(std::string("}"), true);
  }
  wr->out((std::string("new ") + iface_name) + std::string("() { "), true);
  wr->indent(1);
  wr->out(std::string("public "), false);
  this->writeTypeDef(fnNode, ctx, wr);
  wr->out(std::string(" run("), false);
  for ( std::vector< std::shared_ptr<CodeNode>>::size_type i_1 = 0; i_1 != args->children.size(); i_1++) {
    std::shared_ptr<CodeNode> arg_1 = args->children.at(i_1);
    if ( i_1 > 0 ) {
      wr->out(std::string(", "), false);
    }
    this->writeTypeDef(arg_1, lambdaCtx, wr);
    wr->out(std::string(" "), false);
    wr->out(arg_1->vref, false);
  }
  wr->out(std::string(") {"), true);
  wr->indent(1);
  lambdaCtx->restartExpressionLevel();
  for ( std::vector< std::shared_ptr<CodeNode>>::size_type i_2 = 0; i_2 != body->children.size(); i_2++) {
    std::shared_ptr<CodeNode> item = body->children.at(i_2);
    this->WalkNode(item, lambdaCtx, wr);
  }
  wr->newline();
  for ( std::vector< std::string>::size_type i_3 = 0; i_3 != lambdaCtx->captured_variables.size(); i_3++) {
    std::string cname = lambdaCtx->captured_variables.at(i_3);
    wr->out(std::string("// captured var ") + cname, true);
  }
  wr->indent(-1);
  wr->out(std::string("}"), true);
  wr->indent(-1);
  wr->out(std::string("}"), false);
}

void  RangerJava7ClassWriter::writeClass( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> orig_wr ) {
  std::shared_ptr<RangerAppClassDesc> cl = node->clDesc;
  if ( cl == NULL ) {
    return;
  }
  std::map<std::string,bool> declaredVariable;
  if ( (cl->extends_classes.size()) > 0 ) {
    for ( std::vector< std::string>::size_type i = 0; i != cl->extends_classes.size(); i++) {
      std::string pName = cl->extends_classes.at(i);
      std::shared_ptr<RangerAppClassDesc> pC = ctx->findClass(pName);
      for ( std::vector< std::shared_ptr<RangerAppParamDesc>>::size_type i_1 = 0; i_1 != pC->variables.size(); i_1++) {
        std::shared_ptr<RangerAppParamDesc> pvar = pC->variables.at(i_1);
        declaredVariable[pvar->name] = true;
      }
    }
  }
  std::shared_ptr<CodeWriter> wr = orig_wr->getFileWriter(std::string("."), (cl->name + std::string(".java")));
  std::shared_ptr<CodeWriter> importFork = wr->fork();
  for ( std::vector< std::shared_ptr<RangerAppParamDesc>>::size_type i_2 = 0; i_2 != cl->capturedLocals.size(); i_2++) {
    std::shared_ptr<RangerAppParamDesc> dd = cl->capturedLocals.at(i_2);
    if ( dd->is_class_variable == false ) {
      wr->out(std::string("// local captured ") + dd->name, true);
      std::cout << std::string("java captured") << std::endl;
      std::cout << dd->node->getLineAsString() << std::endl;
      dd->node->disabled_node = true;
      cl->addVariable(dd);
      std::shared_ptr<RangerAppWriterContext> csubCtx = cl->ctx;
      csubCtx->defineVariable(dd->name, dd);
      dd->is_class_variable = true;
    }
  }
  wr->out(std::string(""), true);
  wr->out(std::string("class ") + cl->name, false);
  std::shared_ptr<RangerAppClassDesc> parentClass;
  if ( (cl->extends_classes.size()) > 0 ) {
    wr->out(std::string(" extends "), false);
    for ( std::vector< std::string>::size_type i_3 = 0; i_3 != cl->extends_classes.size(); i_3++) {
      std::string pName_1 = cl->extends_classes.at(i_3);
      wr->out(pName_1, false);
      parentClass  = ctx->findClass(pName_1);
    }
  }
  wr->out(std::string(" { "), true);
  wr->indent(1);
  wr->createTag(std::string("utilities"));
  for ( std::vector< std::shared_ptr<RangerAppParamDesc>>::size_type i_4 = 0; i_4 != cl->variables.size(); i_4++) {
    std::shared_ptr<RangerAppParamDesc> pvar_1 = cl->variables.at(i_4);
    if ( declaredVariable.count(pvar_1->name) ) {
      continue;
    }
    wr->out(std::string("public "), false);
    this->writeVarDef(pvar_1->node, ctx, wr);
  }
  if ( cl->has_constructor ) {
    std::shared_ptr<RangerAppFunctionDesc> constr = cl->constructor_fn;
    wr->out(std::string(""), true);
    wr->out(cl->name + std::string("("), false);
    this->writeArgsDef(constr, ctx, wr);
    wr->out(std::string(" ) {"), true);
    wr->indent(1);
    wr->newline();
    std::shared_ptr<RangerAppWriterContext> subCtx = constr->fnCtx;
    subCtx->is_function = true;
    this->WalkNode(constr->fnBody, subCtx, wr);
    wr->newline();
    wr->indent(-1);
    wr->out(std::string("}"), true);
  }
  for ( std::vector< std::shared_ptr<RangerAppFunctionDesc>>::size_type i_5 = 0; i_5 != cl->static_methods.size(); i_5++) {
    std::shared_ptr<RangerAppFunctionDesc> variant = cl->static_methods.at(i_5);
    wr->out(std::string(""), true);
    if ( variant->nameNode->hasFlag(std::string("main")) && (variant->nameNode->code->filename != ctx->getRootFile()) ) {
      continue;
    }
    if ( variant->nameNode->hasFlag(std::string("main")) ) {
      wr->out(std::string("public static void main(String [] args ) {"), true);
    } else {
      wr->out(std::string("public static "), false);
      this->writeTypeDef(variant->nameNode, ctx, wr);
      wr->out(std::string(" "), false);
      wr->out(variant->compiledName + std::string("("), false);
      this->writeArgsDef(variant, ctx, wr);
      wr->out(std::string(") {"), true);
    }
    wr->indent(1);
    wr->newline();
    std::shared_ptr<RangerAppWriterContext> subCtx_1 = variant->fnCtx;
    subCtx_1->is_function = true;
    this->WalkNode(variant->fnBody, subCtx_1, wr);
    wr->newline();
    wr->indent(-1);
    wr->out(std::string("}"), true);
  }
  for ( std::vector< std::string>::size_type i_6 = 0; i_6 != cl->defined_variants.size(); i_6++) {
    std::string fnVar = cl->defined_variants.at(i_6);
    std::shared_ptr<RangerAppMethodVariants> mVs = cl->method_variants[fnVar];
    for ( std::vector< std::shared_ptr<RangerAppFunctionDesc>>::size_type i_7 = 0; i_7 != mVs->variants.size(); i_7++) {
      std::shared_ptr<RangerAppFunctionDesc> variant_1 = mVs->variants.at(i_7);
      wr->out(std::string(""), true);
      wr->out(std::string("public "), false);
      this->writeTypeDef(variant_1->nameNode, ctx, wr);
      wr->out(std::string(" "), false);
      wr->out(variant_1->compiledName + std::string("("), false);
      this->writeArgsDef(variant_1, ctx, wr);
      wr->out(std::string(") {"), true);
      wr->indent(1);
      wr->newline();
      std::shared_ptr<RangerAppWriterContext> subCtx_2 = variant_1->fnCtx;
      subCtx_2->is_function = true;
      this->WalkNode(variant_1->fnBody, subCtx_2, wr);
      wr->newline();
      wr->indent(-1);
      wr->out(std::string("}"), true);
    }
  }
  wr->indent(-1);
  wr->out(std::string("}"), true);
  std::vector<std::string> import_list = wr->getImports();
  for ( std::vector< std::string>::size_type i_8 = 0; i_8 != import_list.size(); i_8++) {
    std::string codeStr = import_list.at(i_8);
    importFork->out((std::string("import ") + codeStr) + std::string(";"), true);
  }
}

RangerSwift3ClassWriter::RangerSwift3ClassWriter( ) {
  this->header_created = false;
}

std::string  RangerSwift3ClassWriter::adjustType( std::string tn ) {
  if ( tn == std::string("this") ) {
    return std::string("self");
  }
  return tn;
}

std::string  RangerSwift3ClassWriter::getObjectTypeString( std::string type_string , std::shared_ptr<RangerAppWriterContext> ctx ) {
  bool caseMatched = false;
  if( type_string == std::string("int")) {
    caseMatched = true;
    return std::string("Int");
  }
  if( type_string == std::string("string")) {
    caseMatched = true;
    return std::string("String");
  }
  if( type_string == std::string("charbuffer")) {
    caseMatched = true;
    return std::string("[UInt8]");
  }
  if( type_string == std::string("char")) {
    caseMatched = true;
    return std::string("UInt8");
  }
  if( type_string == std::string("boolean")) {
    caseMatched = true;
    return std::string("Bool");
  }
  if( type_string == std::string("double")) {
    caseMatched = true;
    return std::string("Double");
  }
  return type_string;
}

std::string  RangerSwift3ClassWriter::getTypeString( std::string type_string ) {
  bool caseMatched = false;
  if( type_string == std::string("int")) {
    caseMatched = true;
    return std::string("Int");
  }
  if( type_string == std::string("string")) {
    caseMatched = true;
    return std::string("String");
  }
  if( type_string == std::string("charbuffer")) {
    caseMatched = true;
    return std::string("[UInt8]");
  }
  if( type_string == std::string("char")) {
    caseMatched = true;
    return std::string("UInt8");
  }
  if( type_string == std::string("boolean")) {
    caseMatched = true;
    return std::string("Bool");
  }
  if( type_string == std::string("double")) {
    caseMatched = true;
    return std::string("Double");
  }
  return type_string;
}

void  RangerSwift3ClassWriter::writeTypeDef( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr ) {
  int v_type = node->value_type;
  std::string t_name = node->type_name;
  std::string a_name = node->array_type;
  std::string k_name = node->key_type;
  if ( ((v_type == 8) || (v_type == 9)) || (v_type == 0) ) {
    v_type = node->typeNameAsType(ctx);
  }
  if ( node->eval_type != 0 ) {
    v_type = node->eval_type;
    if ( (node->eval_type_name.length()) > 0 ) {
      t_name = node->eval_type_name;
    }
    if ( (node->eval_array_type.length()) > 0 ) {
      a_name = node->eval_array_type;
    }
    if ( (node->eval_key_type.length()) > 0 ) {
      k_name = node->eval_key_type;
    }
  }
  switch (v_type ) { 
    case 15 : 
      {
        std::shared_ptr<CodeNode> rv = node->expression_value->children.at(0);
        std::shared_ptr<CodeNode> sec = node->expression_value->children.at(1);
        /** unused:  std::shared_ptr<CodeNode> fc = sec->getFirst()   **/ ;
        wr->out(std::string("("), false);
        for ( std::vector< std::shared_ptr<CodeNode>>::size_type i = 0; i != sec->children.size(); i++) {
          std::shared_ptr<CodeNode> arg = sec->children.at(i);
          if ( i > 0 ) {
            wr->out(std::string(", "), false);
          }
          wr->out(std::string(" _ : "), false);
          this->writeTypeDef(arg, ctx, wr);
        }
        wr->out(std::string(") -> "), false);
        this->writeTypeDef(rv, ctx, wr);
        break;
      }
    case 11 : 
      {
        wr->out(std::string("Int"), false);
        break;
      }
    case 3 : 
      {
        wr->out(std::string("Int"), false);
        break;
      }
    case 2 : 
      {
        wr->out(std::string("Double"), false);
        break;
      }
    case 4 : 
      {
        wr->out(std::string("String"), false);
        break;
      }
    case 12 : 
      {
        wr->out(std::string("UInt8"), false);
        break;
      }
    case 13 : 
      {
        wr->out(std::string("[UInt8]"), false);
        break;
      }
    case 5 : 
      {
        wr->out(std::string("Bool"), false);
        break;
      }
    case 7 : 
      {
        wr->out((((std::string("[") + this->getObjectTypeString(k_name, ctx)) + std::string(":")) + this->getObjectTypeString(a_name, ctx)) + std::string("]"), false);
        break;
      }
    case 6 : 
      {
        wr->out((std::string("[") + this->getObjectTypeString(a_name, ctx)) + std::string("]"), false);
        break;
      }
    default: 
      if ( t_name == std::string("void") ) {
        wr->out(std::string("Void"), false);
        return;
      }
      wr->out(this->getTypeString(t_name), false);
      break;
  }
  if ( node->hasFlag(std::string("optional")) ) {
    wr->out(std::string("?"), false);
  }
}

void  RangerSwift3ClassWriter::WriteEnum( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr ) {
  if ( node->eval_type == 11 ) {
    std::string rootObjName = node->ns.at(0);
    std::shared_ptr<RangerAppEnum> e = ctx->getEnum(rootObjName);
    if ( e != NULL  ) {
      std::string enumName = node->ns.at(1);
      wr->out(std::string("") + std::to_string(((cpp_get_map_int_value<std::string>(e->values, enumName)).value)), false);
    } else {
      if ( node->hasParamDesc ) {
        std::shared_ptr<RangerAppParamDesc> pp = node->paramDesc;
        std::shared_ptr<CodeNode> nn = pp->nameNode;
        wr->out(nn->vref, false);
      }
    }
  }
}

void  RangerSwift3ClassWriter::WriteVRef( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr ) {
  if ( node->vref == std::string("this") ) {
    wr->out(std::string("self"), false);
    return;
  }
  if ( node->eval_type == 11 ) {
    if ( (node->ns.size()) > 1 ) {
      std::string rootObjName = node->ns.at(0);
      std::string enumName = node->ns.at(1);
      std::shared_ptr<RangerAppEnum> e = ctx->getEnum(rootObjName);
      if ( e != NULL  ) {
        wr->out(std::string("") + std::to_string(((cpp_get_map_int_value<std::string>(e->values, enumName)).value)), false);
        return;
      }
    }
  }
  int max_len = node->ns.size();
  if ( (node->nsp.size()) > 0 ) {
    for ( std::vector< std::shared_ptr<RangerAppParamDesc>>::size_type i = 0; i != node->nsp.size(); i++) {
      std::shared_ptr<RangerAppParamDesc> p = node->nsp.at(i);
      if ( i == 0 ) {
        std::string part = node->ns.at(0);
        if ( part == std::string("this") ) {
          wr->out(std::string("self"), false);
          continue;
        }
      }
      if ( i > 0 ) {
        wr->out(std::string("."), false);
      }
      if ( (p->compiledName.length()) > 0 ) {
        wr->out(this->adjustType(p->compiledName), false);
      } else {
        if ( (p->name.length()) > 0 ) {
          wr->out(this->adjustType(p->name), false);
        } else {
          wr->out(this->adjustType((node->ns.at(i))), false);
        }
      }
      if ( i < (max_len - 1) ) {
        if ( p->nameNode->hasFlag(std::string("optional")) ) {
          wr->out(std::string("!"), false);
        }
      }
    }
    return;
  }
  if ( node->hasParamDesc ) {
    std::shared_ptr<RangerAppParamDesc> p_1 = node->paramDesc;
    wr->out(p_1->compiledName, false);
    return;
  }
  for ( std::vector< std::string>::size_type i_1 = 0; i_1 != node->ns.size(); i_1++) {
    std::string part_1 = node->ns.at(i_1);
    if ( i_1 > 0 ) {
      wr->out(std::string("."), false);
    }
    wr->out(this->adjustType(part_1), false);
  }
}

void  RangerSwift3ClassWriter::writeVarDef( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr ) {
  if ( node->hasParamDesc ) {
    std::shared_ptr<CodeNode> nn = node->children.at(1);
    std::shared_ptr<RangerAppParamDesc> p = nn->paramDesc;
    if ( (p->ref_cnt == 0) && (p->is_class_variable == false) ) {
      wr->out(std::string("/** unused:  "), false);
    }
    if ( (p->set_cnt > 0) || p->is_class_variable ) {
      wr->out((std::string("var ") + p->compiledName) + std::string(" : "), false);
    } else {
      wr->out((std::string("let ") + p->compiledName) + std::string(" : "), false);
    }
    this->writeTypeDef(p->nameNode, ctx, wr);
    if ( (node->children.size()) > 2 ) {
      wr->out(std::string(" = "), false);
      ctx->setInExpr();
      std::shared_ptr<CodeNode> value = node->getThird();
      this->WalkNode(value, ctx, wr);
      ctx->unsetInExpr();
    } else {
      if ( nn->value_type == 6 ) {
        wr->out(std::string(" = "), false);
        this->writeTypeDef(p->nameNode, ctx, wr);
        wr->out(std::string("()"), false);
      }
      if ( nn->value_type == 7 ) {
        wr->out(std::string(" = "), false);
        this->writeTypeDef(p->nameNode, ctx, wr);
        wr->out(std::string("()"), false);
      }
    }
    if ( (p->ref_cnt == 0) && (p->is_class_variable == true) ) {
      wr->out(std::string("     /** note: unused */"), false);
    }
    if ( (p->ref_cnt == 0) && (p->is_class_variable == false) ) {
      wr->out(std::string("   **/ "), true);
    } else {
      wr->newline();
    }
  }
}

void  RangerSwift3ClassWriter::writeArgsDef( std::shared_ptr<RangerAppFunctionDesc> fnDesc , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr ) {
  for ( std::vector< std::shared_ptr<RangerAppParamDesc>>::size_type i = 0; i != fnDesc->params.size(); i++) {
    std::shared_ptr<RangerAppParamDesc> arg = fnDesc->params.at(i);
    if ( i > 0 ) {
      wr->out(std::string(", "), false);
    }
    wr->out(arg->name + std::string(" : "), false);
    this->writeTypeDef(arg->nameNode, ctx, wr);
  }
}

void  RangerSwift3ClassWriter::writeFnCall( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr ) {
  if ( node->hasFnCall ) {
    std::shared_ptr<CodeNode> fc = node->getFirst();
    std::shared_ptr<CodeNode> fnName = node->fnDesc->nameNode;
    if ( ctx->expressionLevel() == 0 ) {
      if ( fnName->type_name != std::string("void") ) {
        wr->out(std::string("_ = "), false);
      }
    }
    this->WriteVRef(fc, ctx, wr);
    wr->out(std::string("("), false);
    ctx->setInExpr();
    std::shared_ptr<CodeNode> givenArgs = node->getSecond();
    for ( std::vector< std::shared_ptr<RangerAppParamDesc>>::size_type i = 0; i != node->fnDesc->params.size(); i++) {
      std::shared_ptr<RangerAppParamDesc> arg = node->fnDesc->params.at(i);
      if ( i > 0 ) {
        wr->out(std::string(", "), false);
      }
      if ( (givenArgs->children.size()) <= i ) {
        std::shared_ptr<CodeNode> defVal = arg->nameNode->getFlag(std::string("default"));
        if ( defVal != NULL  ) {
          std::shared_ptr<CodeNode> fc_1 = defVal->vref_annotation->getFirst();
          this->WalkNode(fc_1, ctx, wr);
        } else {
          ctx->addError(node, std::string("Default argument was missing"));
        }
        continue;
      }
      std::shared_ptr<CodeNode> n = givenArgs->children.at(i);
      wr->out(arg->name + std::string(" : "), false);
      this->WalkNode(n, ctx, wr);
    }
    ctx->unsetInExpr();
    wr->out(std::string(")"), false);
    if ( ctx->expressionLevel() == 0 ) {
      wr->newline();
    }
  }
}

void  RangerSwift3ClassWriter::CreateLambdaCall( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr ) {
  std::shared_ptr<CodeNode> fName = node->children.at(0);
  std::shared_ptr<CodeNode> givenArgs = node->children.at(1);
  this->WriteVRef(fName, ctx, wr);
  std::shared_ptr<RangerAppParamDesc> param = ctx->getVariableDef(fName->vref);
  std::shared_ptr<CodeNode> args = param->nameNode->expression_value->children.at(1);
  wr->out(std::string("("), false);
  for ( std::vector< std::shared_ptr<CodeNode>>::size_type i = 0; i != args->children.size(); i++) {
    std::shared_ptr<CodeNode> arg = args->children.at(i);
    std::shared_ptr<CodeNode> n = givenArgs->children.at(i);
    if ( i > 0 ) {
      wr->out(std::string(", "), false);
    }
    if ( arg->value_type != 0 ) {
      this->WalkNode(n, ctx, wr);
    }
  }
  wr->out(std::string(")"), false);
  if ( ctx->expressionLevel() == 0 ) {
    wr->out(std::string(""), true);
  }
}

void  RangerSwift3ClassWriter::CreateLambda( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr ) {
  std::shared_ptr<RangerAppWriterContext> lambdaCtx = node->lambda_ctx;
  std::shared_ptr<CodeNode> fnNode = node->children.at(0);
  std::shared_ptr<CodeNode> args = node->children.at(1);
  std::shared_ptr<CodeNode> body = node->children.at(2);
  wr->out(std::string("{ ("), false);
  for ( std::vector< std::shared_ptr<CodeNode>>::size_type i = 0; i != args->children.size(); i++) {
    std::shared_ptr<CodeNode> arg = args->children.at(i);
    if ( i > 0 ) {
      wr->out(std::string(", "), false);
    }
    wr->out(arg->vref, false);
  }
  wr->out(std::string(") ->  "), false);
  this->writeTypeDef(fnNode, lambdaCtx, wr);
  wr->out(std::string(" in "), true);
  wr->indent(1);
  lambdaCtx->restartExpressionLevel();
  for ( std::vector< std::shared_ptr<CodeNode>>::size_type i_1 = 0; i_1 != body->children.size(); i_1++) {
    std::shared_ptr<CodeNode> item = body->children.at(i_1);
    this->WalkNode(item, lambdaCtx, wr);
  }
  wr->newline();
  for ( std::vector< std::string>::size_type i_2 = 0; i_2 != lambdaCtx->captured_variables.size(); i_2++) {
    std::string cname = lambdaCtx->captured_variables.at(i_2);
    wr->out(std::string("// captured var ") + cname, true);
  }
  wr->indent(-1);
  wr->out(std::string("}"), false);
}

void  RangerSwift3ClassWriter::writeNewCall( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr ) {
  if ( node->hasNewOper ) {
    std::shared_ptr<RangerAppClassDesc> cl = node->clDesc;
    /** unused:  std::shared_ptr<CodeNode> fc = node->getSecond()   **/ ;
    wr->out(node->clDesc->name, false);
    wr->out(std::string("("), false);
    std::shared_ptr<RangerAppFunctionDesc> constr = cl->constructor_fn;
    std::shared_ptr<CodeNode> givenArgs = node->getThird();
    if ( constr != NULL  ) {
      for ( std::vector< std::shared_ptr<RangerAppParamDesc>>::size_type i = 0; i != constr->params.size(); i++) {
        std::shared_ptr<RangerAppParamDesc> arg = constr->params.at(i);
        std::shared_ptr<CodeNode> n = givenArgs->children.at(i);
        if ( i > 0 ) {
          wr->out(std::string(", "), false);
        }
        wr->out(arg->name + std::string(" : "), false);
        this->WalkNode(n, ctx, wr);
      }
    }
    wr->out(std::string(")"), false);
  }
}

bool  RangerSwift3ClassWriter::haveSameSig( std::shared_ptr<RangerAppFunctionDesc> fn1 , std::shared_ptr<RangerAppFunctionDesc> fn2 , std::shared_ptr<RangerAppWriterContext> ctx ) {
  if ( fn1->name != fn2->name ) {
    return false;
  }
  std::shared_ptr<RangerArgMatch> match =  std::make_shared<RangerArgMatch>();
  std::shared_ptr<CodeNode> n1 = fn1->nameNode;
  std::shared_ptr<CodeNode> n2 = fn1->nameNode;
  if ( match->doesDefsMatch(n1, n2, ctx) == false ) {
    return false;
  }
  if ( (fn1->params.size()) != (fn2->params.size()) ) {
    return false;
  }
  for ( std::vector< std::shared_ptr<RangerAppParamDesc>>::size_type i = 0; i != fn1->params.size(); i++) {
    std::shared_ptr<RangerAppParamDesc> p = fn1->params.at(i);
    std::shared_ptr<RangerAppParamDesc> p2 = fn2->params.at(i);
    if ( match->doesDefsMatch((p->nameNode), (p2->nameNode), ctx) == false ) {
      return false;
    }
  }
  return true;
}

void  RangerSwift3ClassWriter::writeClass( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr ) {
  std::shared_ptr<RangerAppClassDesc> cl = node->clDesc;
  if ( cl == NULL ) {
    return;
  }
  std::map<std::string,bool> declaredVariable;
  std::map<std::string,bool> declaredFunction;
  if ( (cl->extends_classes.size()) > 0 ) {
    for ( std::vector< std::string>::size_type i = 0; i != cl->extends_classes.size(); i++) {
      std::string pName = cl->extends_classes.at(i);
      std::shared_ptr<RangerAppClassDesc> pC = ctx->findClass(pName);
      for ( std::vector< std::shared_ptr<RangerAppParamDesc>>::size_type i_1 = 0; i_1 != pC->variables.size(); i_1++) {
        std::shared_ptr<RangerAppParamDesc> pvar = pC->variables.at(i_1);
        declaredVariable[pvar->name] = true;
      }
      for ( std::vector< std::string>::size_type i_2 = 0; i_2 != pC->defined_variants.size(); i_2++) {
        std::string fnVar = pC->defined_variants.at(i_2);
        std::shared_ptr<RangerAppMethodVariants> mVs = pC->method_variants[fnVar];
        for ( std::vector< std::shared_ptr<RangerAppFunctionDesc>>::size_type i_3 = 0; i_3 != mVs->variants.size(); i_3++) {
          std::shared_ptr<RangerAppFunctionDesc> variant = mVs->variants.at(i_3);
          declaredFunction[variant->compiledName] = true;
        }
      }
    }
  }
  if ( header_created == false ) {
    wr->createTag(std::string("utilities"));
    header_created = true;
  }
  wr->out((((std::string("func ==(l: ") + cl->name) + std::string(", r: ")) + cl->name) + std::string(") -> Bool {"), true);
  wr->indent(1);
  wr->out(std::string("return l == r"), true);
  wr->indent(-1);
  wr->out(std::string("}"), true);
  wr->out(std::string("class ") + cl->name, false);
  std::shared_ptr<RangerAppClassDesc> parentClass;
  if ( (cl->extends_classes.size()) > 0 ) {
    wr->out(std::string(" : "), false);
    for ( std::vector< std::string>::size_type i_4 = 0; i_4 != cl->extends_classes.size(); i_4++) {
      std::string pName_1 = cl->extends_classes.at(i_4);
      wr->out(pName_1, false);
      parentClass  = ctx->findClass(pName_1);
    }
  } else {
    wr->out(std::string(" : Equatable "), false);
  }
  wr->out(std::string(" { "), true);
  wr->indent(1);
  for ( std::vector< std::shared_ptr<RangerAppParamDesc>>::size_type i_5 = 0; i_5 != cl->variables.size(); i_5++) {
    std::shared_ptr<RangerAppParamDesc> pvar_1 = cl->variables.at(i_5);
    if ( declaredVariable.count(pvar_1->name) ) {
      wr->out(std::string("// WAS DECLARED : ") + pvar_1->name, true);
      continue;
    }
    this->writeVarDef(pvar_1->node, ctx, wr);
  }
  if ( cl->has_constructor ) {
    std::shared_ptr<RangerAppFunctionDesc> constr = cl->constructor_fn;
    bool b_must_override = false;
    if ( parentClass != NULL ) {
      if ( (constr->params.size()) == 0 ) {
        b_must_override = true;
      } else {
        if ( parentClass->has_constructor ) {
          std::shared_ptr<RangerAppFunctionDesc> p_constr = parentClass->constructor_fn;
          if ( this->haveSameSig((constr), p_constr, ctx) ) {
            b_must_override = true;
          }
        }
      }
    }
    if ( b_must_override ) {
      wr->out(std::string("override "), false);
    }
    wr->out(std::string("init("), false);
    this->writeArgsDef(constr, ctx, wr);
    wr->out(std::string(" ) {"), true);
    wr->indent(1);
    if ( parentClass != NULL ) {
      wr->out(std::string("super.init()"), true);
    }
    wr->newline();
    std::shared_ptr<RangerAppWriterContext> subCtx = constr->fnCtx;
    subCtx->is_function = true;
    this->WalkNode(constr->fnBody, subCtx, wr);
    wr->newline();
    wr->indent(-1);
    wr->out(std::string("}"), true);
  }
  for ( std::vector< std::shared_ptr<RangerAppFunctionDesc>>::size_type i_6 = 0; i_6 != cl->static_methods.size(); i_6++) {
    std::shared_ptr<RangerAppFunctionDesc> variant_1 = cl->static_methods.at(i_6);
    if ( variant_1->nameNode->hasFlag(std::string("main")) ) {
      continue;
    }
    wr->out((std::string("static func ") + variant_1->compiledName) + std::string("("), false);
    this->writeArgsDef(variant_1, ctx, wr);
    wr->out(std::string(") -> "), false);
    this->writeTypeDef(variant_1->nameNode, ctx, wr);
    wr->out(std::string(" {"), true);
    wr->indent(1);
    wr->newline();
    std::shared_ptr<RangerAppWriterContext> subCtx_1 = variant_1->fnCtx;
    subCtx_1->is_function = true;
    this->WalkNode(variant_1->fnBody, subCtx_1, wr);
    wr->newline();
    wr->indent(-1);
    wr->out(std::string("}"), true);
  }
  for ( std::vector< std::string>::size_type i_7 = 0; i_7 != cl->defined_variants.size(); i_7++) {
    std::string fnVar_1 = cl->defined_variants.at(i_7);
    std::shared_ptr<RangerAppMethodVariants> mVs_1 = cl->method_variants[fnVar_1];
    for ( std::vector< std::shared_ptr<RangerAppFunctionDesc>>::size_type i_8 = 0; i_8 != mVs_1->variants.size(); i_8++) {
      std::shared_ptr<RangerAppFunctionDesc> variant_2 = mVs_1->variants.at(i_8);
      if ( declaredFunction.count(variant_2->name) ) {
        wr->out(std::string("override "), false);
      }
      wr->out((std::string("func ") + variant_2->compiledName) + std::string("("), false);
      this->writeArgsDef(variant_2, ctx, wr);
      wr->out(std::string(") -> "), false);
      this->writeTypeDef(variant_2->nameNode, ctx, wr);
      wr->out(std::string(" {"), true);
      wr->indent(1);
      wr->newline();
      std::shared_ptr<RangerAppWriterContext> subCtx_2 = variant_2->fnCtx;
      subCtx_2->is_function = true;
      this->WalkNode(variant_2->fnBody, subCtx_2, wr);
      wr->newline();
      wr->indent(-1);
      wr->out(std::string("}"), true);
    }
  }
  wr->indent(-1);
  wr->out(std::string("}"), true);
  for ( std::vector< std::shared_ptr<RangerAppFunctionDesc>>::size_type i_9 = 0; i_9 != cl->static_methods.size(); i_9++) {
    std::shared_ptr<RangerAppFunctionDesc> variant_3 = cl->static_methods.at(i_9);
    if ( variant_3->nameNode->hasFlag(std::string("main")) && (variant_3->nameNode->code->filename == ctx->getRootFile()) ) {
      wr->newline();
      wr->out(std::string("func __main__swift() {"), true);
      wr->indent(1);
      std::shared_ptr<RangerAppWriterContext> subCtx_3 = variant_3->fnCtx;
      subCtx_3->is_function = true;
      this->WalkNode(variant_3->fnBody, subCtx_3, wr);
      wr->newline();
      wr->indent(-1);
      wr->out(std::string("}"), true);
      wr->out(std::string("// call the main function"), true);
      wr->out(std::string("__main__swift()"), true);
    }
  }
}

RangerCppClassWriter::RangerCppClassWriter( ) {
  this->header_created = false;
}

std::string  RangerCppClassWriter::adjustType( std::string tn ) {
  if ( tn == std::string("this") ) {
    return std::string("this");
  }
  return tn;
}

void  RangerCppClassWriter::WriteScalarValue( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr ) {
  switch (node->value_type ) { 
    case 2 : 
      {
        wr->out(std::string("") + std::to_string(node->double_value), false);
        break;
      }
    case 4 : 
      {
        std::string s = this->EncodeString(node, ctx, wr);
        wr->out((std::string("std::string(") + ((std::string("\"") + s) + std::string("\""))) + std::string(")"), false);
        break;
      }
    case 3 : 
      {
        wr->out(std::string("") + std::to_string(node->int_value), false);
        break;
      }
    case 5 : 
      {
        if ( node->boolean_value ) {
          wr->out(std::string("true"), false);
        } else {
          wr->out(std::string("false"), false);
        }
        break;
      }
  }
}

std::string  RangerCppClassWriter::getObjectTypeString( std::string type_string , std::shared_ptr<RangerAppWriterContext> ctx ) {
  bool caseMatched = false;
  if( type_string == std::string("char")) {
    caseMatched = true;
    return std::string("char");
  }
  if( type_string == std::string("charbuffer")) {
    caseMatched = true;
    return std::string("const char*");
  }
  if( type_string == std::string("int")) {
    caseMatched = true;
    return std::string("int");
  }
  if( type_string == std::string("string")) {
    caseMatched = true;
    return std::string("std::string");
  }
  if( type_string == std::string("boolean")) {
    caseMatched = true;
    return std::string("bool");
  }
  if( type_string == std::string("double")) {
    caseMatched = true;
    return std::string("double");
  }
  if ( ctx->isEnumDefined(type_string) ) {
    return std::string("int");
  }
  if ( ctx->isDefinedClass(type_string) ) {
    return (std::string("std::shared_ptr<") + type_string) + std::string(">");
  }
  return type_string;
}

std::string  RangerCppClassWriter::getTypeString2( std::string type_string , std::shared_ptr<RangerAppWriterContext> ctx ) {
  bool caseMatched = false;
  if( type_string == std::string("char")) {
    caseMatched = true;
    return std::string("char");
  }
  if( type_string == std::string("charbuffer")) {
    caseMatched = true;
    return std::string("const char*");
  }
  if( type_string == std::string("int")) {
    caseMatched = true;
    return std::string("int");
  }
  if( type_string == std::string("string")) {
    caseMatched = true;
    return std::string("std::string");
  }
  if( type_string == std::string("boolean")) {
    caseMatched = true;
    return std::string("bool");
  }
  if( type_string == std::string("double")) {
    caseMatched = true;
    return std::string("double");
  }
  if ( ctx->isEnumDefined(type_string) ) {
    return std::string("int");
  }
  return type_string;
}

void  RangerCppClassWriter::writePtr( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr ) {
  if ( node->type_name == std::string("void") ) {
    return;
  }
}

void  RangerCppClassWriter::writeTypeDef( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr ) {
  int v_type = node->value_type;
  std::string t_name = node->type_name;
  std::string a_name = node->array_type;
  std::string k_name = node->key_type;
  if ( ((v_type == 8) || (v_type == 9)) || (v_type == 0) ) {
    v_type = node->typeNameAsType(ctx);
  }
  if ( node->eval_type != 0 ) {
    v_type = node->eval_type;
    if ( (node->eval_type_name.length()) > 0 ) {
      t_name = node->eval_type_name;
    }
    if ( (node->eval_array_type.length()) > 0 ) {
      a_name = node->eval_array_type;
    }
    if ( (node->eval_key_type.length()) > 0 ) {
      k_name = node->eval_key_type;
    }
  }
  switch (v_type ) { 
    case 15 : 
      {
        std::shared_ptr<CodeNode> rv = node->expression_value->children.at(0);
        std::shared_ptr<CodeNode> sec = node->expression_value->children.at(1);
        /** unused:  std::shared_ptr<CodeNode> fc = sec->getFirst()   **/ ;
        wr->out(std::string("std::function<"), false);
        this->writeTypeDef(rv, ctx, wr);
        wr->out(std::string("("), false);
        for ( std::vector< std::shared_ptr<CodeNode>>::size_type i = 0; i != sec->children.size(); i++) {
          std::shared_ptr<CodeNode> arg = sec->children.at(i);
          if ( i > 0 ) {
            wr->out(std::string(", "), false);
          }
          this->writeTypeDef(arg, ctx, wr);
        }
        wr->out(std::string(")>"), false);
        break;
      }
    case 11 : 
      {
        wr->out(std::string("int"), false);
        break;
      }
    case 3 : 
      {
        if ( node->hasFlag(std::string("optional")) ) {
          wr->out(std::string(" r_optional_primitive<int> "), false);
        } else {
          wr->out(std::string("int"), false);
        }
        break;
      }
    case 12 : 
      {
        wr->out(std::string("char"), false);
        break;
      }
    case 13 : 
      {
        wr->out(std::string("const char*"), false);
        break;
      }
    case 2 : 
      {
        if ( node->hasFlag(std::string("optional")) ) {
          wr->out(std::string(" r_optional_primitive<double> "), false);
        } else {
          wr->out(std::string("double"), false);
        }
        break;
      }
    case 4 : 
      {
        wr->addImport(std::string("<string>"));
        wr->out(std::string("std::string"), false);
        break;
      }
    case 5 : 
      {
        wr->out(std::string("bool"), false);
        break;
      }
    case 7 : 
      {
        wr->out((((std::string("std::map<") + this->getObjectTypeString(k_name, ctx)) + std::string(",")) + this->getObjectTypeString(a_name, ctx)) + std::string(">"), false);
        wr->addImport(std::string("<map>"));
        break;
      }
    case 6 : 
      {
        wr->out((std::string("std::vector<") + this->getObjectTypeString(a_name, ctx)) + std::string(">"), false);
        wr->addImport(std::string("<vector>"));
        break;
      }
    default: 
      if ( node->type_name == std::string("void") ) {
        wr->out(std::string("void"), false);
        return;
      }
      if ( ctx->isDefinedClass(t_name) ) {
        std::shared_ptr<RangerAppClassDesc> cc = ctx->findClass(t_name);
        wr->out(std::string("std::shared_ptr<"), false);
        wr->out(cc->name, false);
        wr->out(std::string(">"), false);
        return;
      }
      if ( node->hasFlag(std::string("optional")) ) {
        wr->out(std::string("std::shared_ptr<std::vector<"), false);
        wr->out(this->getTypeString2(t_name, ctx), false);
        wr->out(std::string(">"), false);
        return;
      }
      wr->out(this->getTypeString2(t_name, ctx), false);
      break;
  }
}

void  RangerCppClassWriter::WriteVRef( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr ) {
  if ( node->vref == std::string("this") ) {
    wr->out(std::string("shared_from_this()"), false);
    return;
  }
  if ( node->eval_type == 11 ) {
    std::string rootObjName = node->ns.at(0);
    if ( (node->ns.size()) > 1 ) {
      std::string enumName = node->ns.at(1);
      std::shared_ptr<RangerAppEnum> e = ctx->getEnum(rootObjName);
      if ( e != NULL  ) {
        wr->out(std::string("") + std::to_string(((cpp_get_map_int_value<std::string>(e->values, enumName)).value)), false);
        return;
      }
    }
  }
  bool had_static = false;
  if ( (node->nsp.size()) > 0 ) {
    for ( std::vector< std::shared_ptr<RangerAppParamDesc>>::size_type i = 0; i != node->nsp.size(); i++) {
      std::shared_ptr<RangerAppParamDesc> p = node->nsp.at(i);
      if ( i > 0 ) {
        if ( had_static ) {
          wr->out(std::string("::"), false);
        } else {
          wr->out(std::string("->"), false);
        }
      }
      if ( i == 0 ) {
        std::string part = node->ns.at(0);
        if ( part == std::string("this") ) {
          wr->out(std::string("this"), false);
          continue;
        }
      }
      if ( (p->compiledName.length()) > 0 ) {
        wr->out(this->adjustType(p->compiledName), false);
      } else {
        if ( (p->name.length()) > 0 ) {
          wr->out(this->adjustType(p->name), false);
        } else {
          wr->out(this->adjustType((node->ns.at(i))), false);
        }
      }
      if ( p->isClass() ) {
        had_static = true;
      }
    }
    return;
  }
  if ( node->hasParamDesc ) {
    std::shared_ptr<RangerAppParamDesc> p_1 = node->paramDesc;
    wr->out(p_1->compiledName, false);
    return;
  }
  for ( std::vector< std::string>::size_type i_1 = 0; i_1 != node->ns.size(); i_1++) {
    std::string part_1 = node->ns.at(i_1);
    if ( i_1 > 0 ) {
      if ( had_static ) {
        wr->out(std::string("::"), false);
      } else {
        wr->out(std::string("->"), false);
      }
    }
    if ( ctx->hasClass(part_1) ) {
      had_static = true;
    } else {
      had_static = false;
    }
    wr->out(this->adjustType(part_1), false);
  }
}

void  RangerCppClassWriter::writeVarDef( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr ) {
  if ( node->hasParamDesc ) {
    std::shared_ptr<CodeNode> nn = node->children.at(1);
    std::shared_ptr<RangerAppParamDesc> p = nn->paramDesc;
    if ( (p->ref_cnt == 0) && (p->is_class_variable == false) ) {
      wr->out(std::string("/** unused:  "), false);
    }
    if ( (p->set_cnt > 0) || p->is_class_variable ) {
      wr->out(std::string(""), false);
    } else {
      wr->out(std::string(""), false);
    }
    this->writeTypeDef(p->nameNode, ctx, wr);
    wr->out(std::string(" "), false);
    wr->out(p->compiledName, false);
    if ( (node->children.size()) > 2 ) {
      wr->out(std::string(" = "), false);
      ctx->setInExpr();
      std::shared_ptr<CodeNode> value = node->getThird();
      this->WalkNode(value, ctx, wr);
      ctx->unsetInExpr();
    } else {
    }
    if ( (p->ref_cnt == 0) && (p->is_class_variable == true) ) {
      wr->out(std::string("     /** note: unused */"), false);
    }
    if ( (p->ref_cnt == 0) && (p->is_class_variable == false) ) {
      wr->out(std::string("   **/ ;"), true);
    } else {
      wr->out(std::string(";"), false);
      wr->newline();
    }
  }
}

void  RangerCppClassWriter::disabledVarDef( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr ) {
  if ( node->hasParamDesc ) {
    std::shared_ptr<CodeNode> nn = node->children.at(1);
    std::shared_ptr<RangerAppParamDesc> p = nn->paramDesc;
    if ( (p->set_cnt > 0) || p->is_class_variable ) {
      wr->out(std::string(""), false);
    } else {
      wr->out(std::string(""), false);
    }
    wr->out(p->compiledName, false);
    if ( (node->children.size()) > 2 ) {
      wr->out(std::string(" = "), false);
      ctx->setInExpr();
      std::shared_ptr<CodeNode> value = node->getThird();
      this->WalkNode(value, ctx, wr);
      ctx->unsetInExpr();
    } else {
    }
    wr->out(std::string(";"), false);
    wr->newline();
  }
}

void  RangerCppClassWriter::CustomOperator( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr ) {
  std::shared_ptr<CodeNode> fc = node->getFirst();
  std::string cmd = fc->vref;
  if ( cmd == std::string("return") ) {
    if ( ctx->isInMain() ) {
      wr->out(std::string("return 0;"), true);
    } else {
      wr->out(std::string("return;"), true);
    }
    return;
  }
  if ( cmd == std::string("switch") ) {
    std::shared_ptr<CodeNode> condition = node->getSecond();
    std::shared_ptr<CodeNode> case_nodes = node->getThird();
    wr->newline();
    std::shared_ptr<RangerAppParamDesc> p =  std::make_shared<RangerAppParamDesc>();
    p->name = std::string("caseMatched");
    p->value_type = 5;
    ctx->defineVariable(p->name, p);
    wr->out((std::string("bool ") + p->compiledName) + std::string(" = false;"), true);
    for ( std::vector< std::shared_ptr<CodeNode>>::size_type i = 0; i != case_nodes->children.size(); i++) {
      std::shared_ptr<CodeNode> ch = case_nodes->children.at(i);
      std::shared_ptr<CodeNode> blockName = ch->getFirst();
      if ( blockName->vref == std::string("default") ) {
        std::shared_ptr<CodeNode> defBlock = ch->getSecond();
        wr->out(std::string("if( ! "), false);
        wr->out(p->compiledName, false);
        wr->out(std::string(") {"), true);
        wr->indent(1);
        this->WalkNode(defBlock, ctx, wr);
        wr->indent(-1);
        wr->out(std::string("}"), true);
      } else {
        std::shared_ptr<CodeNode> caseValue = ch->getSecond();
        std::shared_ptr<CodeNode> caseBlock = ch->getThird();
        wr->out(std::string("if( "), false);
        this->WalkNode(condition, ctx, wr);
        wr->out(std::string(" == "), false);
        this->WalkNode(caseValue, ctx, wr);
        wr->out(std::string(") {"), true);
        wr->indent(1);
        wr->out(p->compiledName + std::string(" = true;"), true);
        this->WalkNode(caseBlock, ctx, wr);
        wr->indent(-1);
        wr->out(std::string("}"), true);
      }
    }
  }
}

void  RangerCppClassWriter::CreateLambdaCall( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr ) {
  std::shared_ptr<CodeNode> fName = node->children.at(0);
  std::shared_ptr<CodeNode> givenArgs = node->children.at(1);
  this->WriteVRef(fName, ctx, wr);
  std::shared_ptr<RangerAppParamDesc> param = ctx->getVariableDef(fName->vref);
  std::shared_ptr<CodeNode> args = param->nameNode->expression_value->children.at(1);
  wr->out(std::string("("), false);
  for ( std::vector< std::shared_ptr<CodeNode>>::size_type i = 0; i != args->children.size(); i++) {
    std::shared_ptr<CodeNode> arg = args->children.at(i);
    std::shared_ptr<CodeNode> n = givenArgs->children.at(i);
    if ( i > 0 ) {
      wr->out(std::string(", "), false);
    }
    if ( arg->value_type != 0 ) {
      this->WalkNode(n, ctx, wr);
    }
  }
  wr->out(std::string(")"), false);
  if ( ctx->expressionLevel() == 0 ) {
    wr->out(std::string(";"), true);
  }
}

void  RangerCppClassWriter::CreateLambda( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr ) {
  std::shared_ptr<RangerAppWriterContext> lambdaCtx = node->lambda_ctx;
  /** unused:  std::shared_ptr<CodeNode> fnNode = node->children.at(0)   **/ ;
  std::shared_ptr<CodeNode> args = node->children.at(1);
  std::shared_ptr<CodeNode> body = node->children.at(2);
  wr->out(std::string("[this"), false);
  wr->out(std::string("]("), false);
  for ( std::vector< std::shared_ptr<CodeNode>>::size_type i = 0; i != args->children.size(); i++) {
    std::shared_ptr<CodeNode> arg = args->children.at(i);
    if ( i > 0 ) {
      wr->out(std::string(", "), false);
    }
    this->writeTypeDef(arg, ctx, wr);
    wr->out(std::string(" "), false);
    wr->out(arg->vref, false);
  }
  wr->out(std::string(") mutable { "), true);
  wr->indent(1);
  lambdaCtx->restartExpressionLevel();
  for ( std::vector< std::shared_ptr<CodeNode>>::size_type i_1 = 0; i_1 != body->children.size(); i_1++) {
    std::shared_ptr<CodeNode> item = body->children.at(i_1);
    this->WalkNode(item, lambdaCtx, wr);
  }
  wr->newline();
  wr->indent(-1);
  wr->out(std::string("}"), false);
}

void  RangerCppClassWriter::writeCppHeaderVar( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr , bool do_initialize ) {
  if ( node->hasParamDesc ) {
    std::shared_ptr<CodeNode> nn = node->children.at(1);
    std::shared_ptr<RangerAppParamDesc> p = nn->paramDesc;
    if ( (p->ref_cnt == 0) && (p->is_class_variable == false) ) {
      wr->out(std::string("/** unused:  "), false);
    }
    if ( (p->set_cnt > 0) || p->is_class_variable ) {
      wr->out(std::string(""), false);
    } else {
      wr->out(std::string(""), false);
    }
    this->writeTypeDef(p->nameNode, ctx, wr);
    wr->out(std::string(" "), false);
    wr->out(p->compiledName, false);
    if ( (p->ref_cnt == 0) && (p->is_class_variable == true) ) {
      wr->out(std::string("     /** note: unused */"), false);
    }
    if ( (p->ref_cnt == 0) && (p->is_class_variable == false) ) {
      wr->out(std::string("   **/ ;"), true);
    } else {
      wr->out(std::string(";"), false);
      wr->newline();
    }
  }
}

void  RangerCppClassWriter::writeArgsDef( std::shared_ptr<RangerAppFunctionDesc> fnDesc , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr ) {
  for ( std::vector< std::shared_ptr<RangerAppParamDesc>>::size_type i = 0; i != fnDesc->params.size(); i++) {
    std::shared_ptr<RangerAppParamDesc> arg = fnDesc->params.at(i);
    if ( i > 0 ) {
      wr->out(std::string(","), false);
    }
    wr->out(std::string(" "), false);
    this->writeTypeDef(arg->nameNode, ctx, wr);
    wr->out((std::string(" ") + arg->name) + std::string(" "), false);
  }
}

void  RangerCppClassWriter::writeFnCall( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr ) {
  if ( node->hasFnCall ) {
    std::shared_ptr<CodeNode> fc = node->getFirst();
    this->WriteVRef(fc, ctx, wr);
    wr->out(std::string("("), false);
    ctx->setInExpr();
    std::shared_ptr<CodeNode> givenArgs = node->getSecond();
    for ( std::vector< std::shared_ptr<RangerAppParamDesc>>::size_type i = 0; i != node->fnDesc->params.size(); i++) {
      std::shared_ptr<RangerAppParamDesc> arg = node->fnDesc->params.at(i);
      if ( i > 0 ) {
        wr->out(std::string(", "), false);
      }
      if ( i >= (givenArgs->children.size()) ) {
        std::shared_ptr<CodeNode> defVal = arg->nameNode->getFlag(std::string("default"));
        if ( defVal != NULL  ) {
          std::shared_ptr<CodeNode> fc_1 = defVal->vref_annotation->getFirst();
          this->WalkNode(fc_1, ctx, wr);
        } else {
          ctx->addError(node, std::string("Default argument was missing"));
        }
        continue;
      }
      std::shared_ptr<CodeNode> n = givenArgs->children.at(i);
      this->WalkNode(n, ctx, wr);
    }
    ctx->unsetInExpr();
    wr->out(std::string(")"), false);
    if ( ctx->expressionLevel() == 0 ) {
      wr->out(std::string(";"), true);
    }
  }
}

void  RangerCppClassWriter::writeNewCall( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr ) {
  if ( node->hasNewOper ) {
    std::shared_ptr<RangerAppClassDesc> cl = node->clDesc;
    /** unused:  std::shared_ptr<CodeNode> fc = node->getSecond()   **/ ;
    wr->out(std::string(" std::make_shared<"), false);
    wr->out(node->clDesc->name, false);
    wr->out(std::string(">("), false);
    std::shared_ptr<RangerAppFunctionDesc> constr = cl->constructor_fn;
    std::shared_ptr<CodeNode> givenArgs = node->getThird();
    if ( constr != NULL  ) {
      for ( std::vector< std::shared_ptr<RangerAppParamDesc>>::size_type i = 0; i != constr->params.size(); i++) {
        std::shared_ptr<RangerAppParamDesc> arg = constr->params.at(i);
        std::shared_ptr<CodeNode> n = givenArgs->children.at(i);
        if ( i > 0 ) {
          wr->out(std::string(", "), false);
        }
        if ( true || (arg->nameNode != NULL ) ) {
          this->WalkNode(n, ctx, wr);
        }
      }
    }
    wr->out(std::string(")"), false);
  }
}

void  RangerCppClassWriter::writeClassHeader( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr ) {
  std::shared_ptr<RangerAppClassDesc> cl = node->clDesc;
  if ( cl == NULL ) {
    return;
  }
  wr->out(std::string("class ") + cl->name, false);
  std::shared_ptr<RangerAppClassDesc> parentClass;
  if ( (cl->extends_classes.size()) > 0 ) {
    wr->out(std::string(" : "), false);
    for ( std::vector< std::string>::size_type i = 0; i != cl->extends_classes.size(); i++) {
      std::string pName = cl->extends_classes.at(i);
      wr->out(std::string("public "), false);
      wr->out(pName, false);
      parentClass  = ctx->findClass(pName);
    }
  } else {
    wr->out((std::string(" : public std::enable_shared_from_this<") + cl->name) + std::string("> "), false);
  }
  wr->out(std::string(" { "), true);
  wr->indent(1);
  wr->out(std::string("public :"), true);
  wr->indent(1);
  for ( std::vector< std::shared_ptr<RangerAppParamDesc>>::size_type i_1 = 0; i_1 != cl->variables.size(); i_1++) {
    std::shared_ptr<RangerAppParamDesc> pvar = cl->variables.at(i_1);
    this->writeCppHeaderVar(pvar->node, ctx, wr, false);
  }
  wr->out(std::string("/* class constructor */ "), true);
  wr->out(cl->name + std::string("("), false);
  if ( cl->has_constructor ) {
    std::shared_ptr<RangerAppFunctionDesc> constr = cl->constructor_fn;
    this->writeArgsDef(constr, ctx, wr);
  }
  wr->out(std::string(" );"), true);
  for ( std::vector< std::shared_ptr<RangerAppFunctionDesc>>::size_type i_2 = 0; i_2 != cl->static_methods.size(); i_2++) {
    std::shared_ptr<RangerAppFunctionDesc> variant = cl->static_methods.at(i_2);
    if ( i_2 == 0 ) {
      wr->out(std::string("/* static methods */ "), true);
    }
    wr->out(std::string("static "), false);
    this->writeTypeDef(variant->nameNode, ctx, wr);
    wr->out((std::string(" ") + variant->compiledName) + std::string("("), false);
    this->writeArgsDef(variant, ctx, wr);
    wr->out(std::string(");"), true);
  }
  for ( std::vector< std::string>::size_type i_3 = 0; i_3 != cl->defined_variants.size(); i_3++) {
    std::string fnVar = cl->defined_variants.at(i_3);
    if ( i_3 == 0 ) {
      wr->out(std::string("/* instance methods */ "), true);
    }
    std::shared_ptr<RangerAppMethodVariants> mVs = cl->method_variants[fnVar];
    for ( std::vector< std::shared_ptr<RangerAppFunctionDesc>>::size_type i_4 = 0; i_4 != mVs->variants.size(); i_4++) {
      std::shared_ptr<RangerAppFunctionDesc> variant_1 = mVs->variants.at(i_4);
      if ( cl->is_inherited ) {
        wr->out(std::string("virtual "), false);
      }
      this->writeTypeDef(variant_1->nameNode, ctx, wr);
      wr->out((std::string(" ") + variant_1->compiledName) + std::string("("), false);
      this->writeArgsDef(variant_1, ctx, wr);
      wr->out(std::string(");"), true);
    }
  }
  wr->indent(-1);
  wr->indent(-1);
  wr->out(std::string("};"), true);
}

void  RangerCppClassWriter::writeClass( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> orig_wr ) {
  std::shared_ptr<RangerAppClassDesc> cl = node->clDesc;
  std::shared_ptr<CodeWriter> wr = orig_wr;
  if ( cl == NULL ) {
    return;
  }
  if ( header_created == false ) {
    wr->createTag(std::string("c++Imports"));
    wr->out(std::string(""), true);
    wr->out(std::string("// define classes here to avoid compiler errors"), true);
    wr->createTag(std::string("c++ClassDefs"));
    wr->out(std::string(""), true);
    wr->createTag(std::string("utilities"));
    wr->out(std::string(""), true);
    wr->out(std::string("// header definitions"), true);
    wr->createTag(std::string("c++Header"));
    wr->out(std::string(""), true);
    header_created = true;
  }
  std::shared_ptr<CodeWriter> classWriter = orig_wr->getTag(std::string("c++ClassDefs"));
  std::shared_ptr<CodeWriter> headerWriter = orig_wr->getTag(std::string("c++Header"));
  /** unused:  std::string projectName = std::string("project")   **/ ;
  for ( std::vector< std::shared_ptr<RangerAppParamDesc>>::size_type i = 0; i != cl->capturedLocals.size(); i++) {
    std::shared_ptr<RangerAppParamDesc> dd = cl->capturedLocals.at(i);
    if ( dd->is_class_variable == false ) {
      wr->out(std::string("// local captured ") + dd->name, true);
      dd->node->disabled_node = true;
      cl->addVariable(dd);
      std::shared_ptr<RangerAppWriterContext> csubCtx = cl->ctx;
      csubCtx->defineVariable(dd->name, dd);
      dd->is_class_variable = true;
    }
  }
  classWriter->out((std::string("class ") + cl->name) + std::string(";"), true);
  this->writeClassHeader(node, ctx, headerWriter);
  wr->out(std::string(""), true);
  wr->out(((cl->name + std::string("::")) + cl->name) + std::string("("), false);
  if ( cl->has_constructor ) {
    std::shared_ptr<RangerAppFunctionDesc> constr = cl->constructor_fn;
    this->writeArgsDef(constr, ctx, wr);
  }
  wr->out(std::string(" ) "), false);
  if ( (cl->extends_classes.size()) > 0 ) {
    for ( std::vector< std::string>::size_type i_1 = 0; i_1 != cl->extends_classes.size(); i_1++) {
      std::string pName = cl->extends_classes.at(i_1);
      std::shared_ptr<RangerAppClassDesc> pcc = ctx->findClass(pName);
      if ( pcc->has_constructor ) {
        wr->out((std::string(" : ") + pcc->name) + std::string("("), false);
        std::shared_ptr<RangerAppFunctionDesc> constr_1 = cl->constructor_fn;
        for ( std::vector< std::shared_ptr<RangerAppParamDesc>>::size_type i_2 = 0; i_2 != constr_1->params.size(); i_2++) {
          std::shared_ptr<RangerAppParamDesc> arg = constr_1->params.at(i_2);
          if ( i_2 > 0 ) {
            wr->out(std::string(","), false);
          }
          wr->out(std::string(" "), false);
          wr->out((std::string(" ") + arg->name) + std::string(" "), false);
        }
        wr->out(std::string(")"), false);
      }
    }
  }
  wr->out(std::string("{"), true);
  wr->indent(1);
  for ( std::vector< std::shared_ptr<RangerAppParamDesc>>::size_type i_3 = 0; i_3 != cl->variables.size(); i_3++) {
    std::shared_ptr<RangerAppParamDesc> pvar = cl->variables.at(i_3);
    std::shared_ptr<CodeNode> nn = pvar->node;
    if ( pvar->is_captured ) {
      continue;
    }
    if ( (nn->children.size()) > 2 ) {
      std::shared_ptr<CodeNode> valueNode = nn->children.at(2);
      wr->out((std::string("this->") + pvar->compiledName) + std::string(" = "), false);
      this->WalkNode(valueNode, ctx, wr);
      wr->out(std::string(";"), true);
    }
  }
  if ( cl->has_constructor ) {
    std::shared_ptr<RangerAppFunctionDesc> constr_2 = cl->constructor_fn;
    wr->newline();
    std::shared_ptr<RangerAppWriterContext> subCtx = constr_2->fnCtx;
    subCtx->is_function = true;
    this->WalkNode(constr_2->fnBody, subCtx, wr);
    wr->newline();
  }
  wr->indent(-1);
  wr->out(std::string("}"), true);
  for ( std::vector< std::shared_ptr<RangerAppFunctionDesc>>::size_type i_4 = 0; i_4 != cl->static_methods.size(); i_4++) {
    std::shared_ptr<RangerAppFunctionDesc> variant = cl->static_methods.at(i_4);
    if ( variant->nameNode->hasFlag(std::string("main")) ) {
      continue;
    }
    wr->out(std::string(""), true);
    this->writeTypeDef(variant->nameNode, ctx, wr);
    wr->out(std::string(" "), false);
    wr->out((std::string(" ") + cl->name) + std::string("::"), false);
    wr->out(variant->compiledName + std::string("("), false);
    this->writeArgsDef(variant, ctx, wr);
    wr->out(std::string(") {"), true);
    wr->indent(1);
    wr->newline();
    std::shared_ptr<RangerAppWriterContext> subCtx_1 = variant->fnCtx;
    subCtx_1->is_function = true;
    this->WalkNode(variant->fnBody, subCtx_1, wr);
    wr->newline();
    wr->indent(-1);
    wr->out(std::string("}"), true);
  }
  for ( std::vector< std::string>::size_type i_5 = 0; i_5 != cl->defined_variants.size(); i_5++) {
    std::string fnVar = cl->defined_variants.at(i_5);
    std::shared_ptr<RangerAppMethodVariants> mVs = cl->method_variants[fnVar];
    for ( std::vector< std::shared_ptr<RangerAppFunctionDesc>>::size_type i_6 = 0; i_6 != mVs->variants.size(); i_6++) {
      std::shared_ptr<RangerAppFunctionDesc> variant_1 = mVs->variants.at(i_6);
      wr->out(std::string(""), true);
      this->writeTypeDef(variant_1->nameNode, ctx, wr);
      wr->out(std::string(" "), false);
      wr->out((std::string(" ") + cl->name) + std::string("::"), false);
      wr->out(variant_1->compiledName + std::string("("), false);
      this->writeArgsDef(variant_1, ctx, wr);
      wr->out(std::string(") {"), true);
      wr->indent(1);
      wr->newline();
      std::shared_ptr<RangerAppWriterContext> subCtx_2 = variant_1->fnCtx;
      subCtx_2->is_function = true;
      this->WalkNode(variant_1->fnBody, subCtx_2, wr);
      wr->newline();
      wr->indent(-1);
      wr->out(std::string("}"), true);
    }
  }
  for ( std::vector< std::shared_ptr<RangerAppFunctionDesc>>::size_type i_7 = 0; i_7 != cl->static_methods.size(); i_7++) {
    std::shared_ptr<RangerAppFunctionDesc> variant_2 = cl->static_methods.at(i_7);
    if ( variant_2->nameNode->hasFlag(std::string("main")) && (variant_2->nameNode->code->filename == ctx->getRootFile()) ) {
      wr->out(std::string(""), true);
      wr->out(std::string("int main(int argc, char* argv[]) {"), true);
      wr->indent(1);
      wr->newline();
      std::shared_ptr<RangerAppWriterContext> subCtx_3 = variant_2->fnCtx;
      subCtx_3->in_main = true;
      subCtx_3->is_function = true;
      this->WalkNode(variant_2->fnBody, subCtx_3, wr);
      wr->newline();
      wr->out(std::string("return 0;"), true);
      wr->indent(-1);
      wr->out(std::string("}"), true);
    }
  }
}

RangerKotlinClassWriter::RangerKotlinClassWriter( ) {
}

void  RangerKotlinClassWriter::WriteScalarValue( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr ) {
  switch (node->value_type ) { 
    case 2 : 
      {
        wr->out(node->getParsedString(), false);
        break;
      }
    case 4 : 
      {
        std::string s = this->EncodeString(node, ctx, wr);
        wr->out((std::string("\"") + s) + std::string("\""), false);
        break;
      }
    case 3 : 
      {
        wr->out(std::string("") + std::to_string(node->int_value), false);
        break;
      }
    case 5 : 
      {
        if ( node->boolean_value ) {
          wr->out(std::string("true"), false);
        } else {
          wr->out(std::string("false"), false);
        }
        break;
      }
  }
}

std::string  RangerKotlinClassWriter::adjustType( std::string tn ) {
  if ( tn == std::string("this") ) {
    return std::string("this");
  }
  return tn;
}

std::string  RangerKotlinClassWriter::getObjectTypeString( std::string type_string , std::shared_ptr<RangerAppWriterContext> ctx ) {
  bool caseMatched = false;
  if( type_string == std::string("int")) {
    caseMatched = true;
    return std::string("Integer");
  }
  if( type_string == std::string("string")) {
    caseMatched = true;
    return std::string("String");
  }
  if( type_string == std::string("chararray")) {
    caseMatched = true;
    return std::string("CharArray");
  }
  if( type_string == std::string("char")) {
    caseMatched = true;
    return std::string("char");
  }
  if( type_string == std::string("boolean")) {
    caseMatched = true;
    return std::string("Boolean");
  }
  if( type_string == std::string("double")) {
    caseMatched = true;
    return std::string("Double");
  }
  return type_string;
}

std::string  RangerKotlinClassWriter::getTypeString( std::string type_string ) {
  bool caseMatched = false;
  if( type_string == std::string("int")) {
    caseMatched = true;
    return std::string("Integer");
  }
  if( type_string == std::string("string")) {
    caseMatched = true;
    return std::string("String");
  }
  if( type_string == std::string("chararray")) {
    caseMatched = true;
    return std::string("CharArray");
  }
  if( type_string == std::string("char")) {
    caseMatched = true;
    return std::string("Char");
  }
  if( type_string == std::string("boolean")) {
    caseMatched = true;
    return std::string("Boolean");
  }
  if( type_string == std::string("double")) {
    caseMatched = true;
    return std::string("Double");
  }
  return type_string;
}

void  RangerKotlinClassWriter::writeTypeDef( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr ) {
  int v_type = node->value_type;
  if ( node->eval_type != 0 ) {
    v_type = node->eval_type;
  }
  switch (v_type ) { 
    case 11 : 
      {
        wr->out(std::string("Int"), false);
        break;
      }
    case 3 : 
      {
        wr->out(std::string("Int"), false);
        break;
      }
    case 2 : 
      {
        wr->out(std::string("Double"), false);
        break;
      }
    case 12 : 
      {
        wr->out(std::string("Char"), false);
        break;
      }
    case 13 : 
      {
        wr->out(std::string("CharArray"), false);
        break;
      }
    case 4 : 
      {
        wr->out(std::string("String"), false);
        break;
      }
    case 5 : 
      {
        wr->out(std::string("Boolean"), false);
        break;
      }
    case 7 : 
      {
        wr->out((((std::string("MutableMap<") + this->getObjectTypeString(node->key_type, ctx)) + std::string(",")) + this->getObjectTypeString(node->array_type, ctx)) + std::string(">"), false);
        break;
      }
    case 6 : 
      {
        wr->out((std::string("MutableList<") + this->getObjectTypeString(node->array_type, ctx)) + std::string(">"), false);
        break;
      }
    default: 
      if ( node->type_name == std::string("void") ) {
        wr->out(std::string("Unit"), false);
      } else {
        wr->out(this->getTypeString(node->type_name), false);
      }
      break;
  }
  if ( node->hasFlag(std::string("optional")) ) {
    wr->out(std::string("?"), false);
  }
}

void  RangerKotlinClassWriter::WriteVRef( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr ) {
  if ( node->eval_type == 11 ) {
    if ( (node->ns.size()) > 1 ) {
      std::string rootObjName = node->ns.at(0);
      std::string enumName = node->ns.at(1);
      std::shared_ptr<RangerAppEnum> e = ctx->getEnum(rootObjName);
      if ( e != NULL  ) {
        wr->out(std::string("") + std::to_string(((cpp_get_map_int_value<std::string>(e->values, enumName)).value)), false);
        return;
      }
    }
  }
  if ( (node->nsp.size()) > 0 ) {
    for ( std::vector< std::shared_ptr<RangerAppParamDesc>>::size_type i = 0; i != node->nsp.size(); i++) {
      std::shared_ptr<RangerAppParamDesc> p = node->nsp.at(i);
      if ( i > 0 ) {
        wr->out(std::string("."), false);
      }
      if ( (p->compiledName.length()) > 0 ) {
        wr->out(this->adjustType(p->compiledName), false);
      } else {
        if ( (p->name.length()) > 0 ) {
          wr->out(this->adjustType(p->name), false);
        } else {
          wr->out(this->adjustType((node->ns.at(i))), false);
        }
      }
      if ( i == 0 ) {
        if ( p->nameNode->hasFlag(std::string("optional")) ) {
          wr->out(std::string("!!"), false);
        }
      }
    }
    return;
  }
  if ( node->hasParamDesc ) {
    std::shared_ptr<RangerAppParamDesc> p_1 = node->paramDesc;
    wr->out(p_1->compiledName, false);
    return;
  }
  for ( std::vector< std::string>::size_type i_1 = 0; i_1 != node->ns.size(); i_1++) {
    std::string part = node->ns.at(i_1);
    if ( i_1 > 0 ) {
      wr->out(std::string("."), false);
    }
    wr->out(this->adjustType(part), false);
  }
}

void  RangerKotlinClassWriter::writeVarDef( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr ) {
  if ( node->hasParamDesc ) {
    std::shared_ptr<CodeNode> nn = node->children.at(1);
    std::shared_ptr<RangerAppParamDesc> p = nn->paramDesc;
    if ( (p->ref_cnt == 0) && (p->is_class_variable == false) ) {
      wr->out(std::string("/** unused:  "), false);
    }
    if ( (p->set_cnt > 0) || p->is_class_variable ) {
      wr->out(std::string("var "), false);
    } else {
      wr->out(std::string("val "), false);
    }
    wr->out(p->compiledName, false);
    wr->out(std::string(" : "), false);
    this->writeTypeDef(p->nameNode, ctx, wr);
    wr->out(std::string(" "), false);
    if ( (node->children.size()) > 2 ) {
      wr->out(std::string(" = "), false);
      ctx->setInExpr();
      std::shared_ptr<CodeNode> value = node->getThird();
      this->WalkNode(value, ctx, wr);
      ctx->unsetInExpr();
    } else {
      if ( nn->value_type == 6 ) {
        wr->out(std::string(" = arrayListOf()"), false);
      }
      if ( nn->value_type == 7 ) {
        wr->out(std::string(" = hashMapOf()"), false);
      }
    }
    if ( (p->ref_cnt == 0) && (p->is_class_variable == true) ) {
      wr->out(std::string("     /** note: unused */"), false);
    }
    if ( (p->ref_cnt == 0) && (p->is_class_variable == false) ) {
      wr->out(std::string("   **/ ;"), true);
    } else {
      wr->out(std::string(";"), false);
      wr->newline();
    }
  }
}

void  RangerKotlinClassWriter::writeArgsDef( std::shared_ptr<RangerAppFunctionDesc> fnDesc , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr ) {
  for ( std::vector< std::shared_ptr<RangerAppParamDesc>>::size_type i = 0; i != fnDesc->params.size(); i++) {
    std::shared_ptr<RangerAppParamDesc> arg = fnDesc->params.at(i);
    if ( i > 0 ) {
      wr->out(std::string(","), false);
    }
    wr->out(std::string(" "), false);
    wr->out(arg->name + std::string(" : "), false);
    this->writeTypeDef(arg->nameNode, ctx, wr);
  }
}

void  RangerKotlinClassWriter::writeFnCall( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr ) {
  if ( node->hasFnCall ) {
    std::shared_ptr<CodeNode> fc = node->getFirst();
    this->WriteVRef(fc, ctx, wr);
    wr->out(std::string("("), false);
    std::shared_ptr<CodeNode> givenArgs = node->getSecond();
    for ( std::vector< std::shared_ptr<RangerAppParamDesc>>::size_type i = 0; i != node->fnDesc->params.size(); i++) {
      std::shared_ptr<RangerAppParamDesc> arg = node->fnDesc->params.at(i);
      if ( i > 0 ) {
        wr->out(std::string(", "), false);
      }
      if ( (givenArgs->children.size()) <= i ) {
        std::shared_ptr<CodeNode> defVal = arg->nameNode->getFlag(std::string("default"));
        if ( defVal != NULL  ) {
          std::shared_ptr<CodeNode> fc_1 = defVal->vref_annotation->getFirst();
          this->WalkNode(fc_1, ctx, wr);
        } else {
          ctx->addError(node, std::string("Default argument was missing"));
        }
        continue;
      }
      std::shared_ptr<CodeNode> n = givenArgs->children.at(i);
      this->WalkNode(n, ctx, wr);
    }
    wr->out(std::string(")"), false);
    if ( ctx->expressionLevel() == 0 ) {
      wr->out(std::string(";"), true);
    }
  }
}

void  RangerKotlinClassWriter::writeNewCall( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr ) {
  if ( node->hasNewOper ) {
    std::shared_ptr<RangerAppClassDesc> cl = node->clDesc;
    /** unused:  std::shared_ptr<CodeNode> fc = node->getSecond()   **/ ;
    wr->out(std::string(" "), false);
    wr->out(node->clDesc->name, false);
    wr->out(std::string("("), false);
    std::shared_ptr<RangerAppFunctionDesc> constr = cl->constructor_fn;
    std::shared_ptr<CodeNode> givenArgs = node->getThird();
    if ( constr != NULL  ) {
      for ( std::vector< std::shared_ptr<RangerAppParamDesc>>::size_type i = 0; i != constr->params.size(); i++) {
        std::shared_ptr<RangerAppParamDesc> arg = constr->params.at(i);
        std::shared_ptr<CodeNode> n = givenArgs->children.at(i);
        if ( i > 0 ) {
          wr->out(std::string(", "), false);
        }
        if ( true || (arg->nameNode != NULL ) ) {
          this->WalkNode(n, ctx, wr);
        }
      }
    }
    wr->out(std::string(")"), false);
  }
}

void  RangerKotlinClassWriter::writeClass( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> orig_wr ) {
  std::shared_ptr<RangerAppClassDesc> cl = node->clDesc;
  if ( cl == NULL ) {
    return;
  }
  std::shared_ptr<CodeWriter> wr = orig_wr;
  /** unused:  std::shared_ptr<CodeWriter> importFork = wr->fork()   **/ ;
  wr->out(std::string(""), true);
  wr->out(std::string("class ") + cl->name, false);
  if ( cl->has_constructor ) {
    std::shared_ptr<RangerAppFunctionDesc> constr = cl->constructor_fn;
    wr->out(std::string("("), false);
    this->writeArgsDef(constr, ctx, wr);
    wr->out(std::string(" ) "), true);
  }
  wr->out(std::string(" {"), true);
  wr->indent(1);
  for ( std::vector< std::shared_ptr<RangerAppParamDesc>>::size_type i = 0; i != cl->variables.size(); i++) {
    std::shared_ptr<RangerAppParamDesc> pvar = cl->variables.at(i);
    this->writeVarDef(pvar->node, ctx, wr);
  }
  if ( cl->has_constructor ) {
    std::shared_ptr<RangerAppFunctionDesc> constr_1 = cl->constructor_fn;
    wr->out(std::string(""), true);
    wr->out(std::string("init {"), true);
    wr->indent(1);
    wr->newline();
    std::shared_ptr<RangerAppWriterContext> subCtx = constr_1->fnCtx;
    subCtx->is_function = true;
    this->WalkNode(constr_1->fnBody, subCtx, wr);
    wr->newline();
    wr->indent(-1);
    wr->out(std::string("}"), true);
  }
  if ( (cl->static_methods.size()) > 0 ) {
    wr->out(std::string("companion object {"), true);
    wr->indent(1);
  }
  for ( std::vector< std::shared_ptr<RangerAppFunctionDesc>>::size_type i_1 = 0; i_1 != cl->static_methods.size(); i_1++) {
    std::shared_ptr<RangerAppFunctionDesc> variant = cl->static_methods.at(i_1);
    wr->out(std::string(""), true);
    if ( variant->nameNode->hasFlag(std::string("main")) ) {
      continue;
    }
    wr->out(std::string("fun "), false);
    wr->out(std::string(" "), false);
    wr->out(variant->name + std::string("("), false);
    this->writeArgsDef(variant, ctx, wr);
    wr->out(std::string(") : "), false);
    this->writeTypeDef(variant->nameNode, ctx, wr);
    wr->out(std::string(" {"), true);
    wr->indent(1);
    wr->newline();
    std::shared_ptr<RangerAppWriterContext> subCtx_1 = variant->fnCtx;
    subCtx_1->is_function = true;
    this->WalkNode(variant->fnBody, subCtx_1, wr);
    wr->newline();
    wr->indent(-1);
    wr->out(std::string("}"), true);
  }
  if ( (cl->static_methods.size()) > 0 ) {
    wr->indent(-1);
    wr->out(std::string("}"), true);
  }
  for ( std::vector< std::string>::size_type i_2 = 0; i_2 != cl->defined_variants.size(); i_2++) {
    std::string fnVar = cl->defined_variants.at(i_2);
    std::shared_ptr<RangerAppMethodVariants> mVs = cl->method_variants[fnVar];
    for ( std::vector< std::shared_ptr<RangerAppFunctionDesc>>::size_type i_3 = 0; i_3 != mVs->variants.size(); i_3++) {
      std::shared_ptr<RangerAppFunctionDesc> variant_1 = mVs->variants.at(i_3);
      wr->out(std::string(""), true);
      wr->out(std::string("fun "), false);
      wr->out(std::string(" "), false);
      wr->out(variant_1->name + std::string("("), false);
      this->writeArgsDef(variant_1, ctx, wr);
      wr->out(std::string(") : "), false);
      this->writeTypeDef(variant_1->nameNode, ctx, wr);
      wr->out(std::string(" {"), true);
      wr->indent(1);
      wr->newline();
      std::shared_ptr<RangerAppWriterContext> subCtx_2 = variant_1->fnCtx;
      subCtx_2->is_function = true;
      this->WalkNode(variant_1->fnBody, subCtx_2, wr);
      wr->newline();
      wr->indent(-1);
      wr->out(std::string("}"), true);
    }
  }
  wr->indent(-1);
  wr->out(std::string("}"), true);
  for ( std::vector< std::shared_ptr<RangerAppFunctionDesc>>::size_type i_4 = 0; i_4 != cl->static_methods.size(); i_4++) {
    std::shared_ptr<RangerAppFunctionDesc> variant_2 = cl->static_methods.at(i_4);
    wr->out(std::string(""), true);
    if ( variant_2->nameNode->hasFlag(std::string("main")) && (variant_2->nameNode->code->filename == ctx->getRootFile()) ) {
      wr->out(std::string("fun main(args : Array<String>) {"), true);
      wr->indent(1);
      wr->newline();
      std::shared_ptr<RangerAppWriterContext> subCtx_3 = variant_2->fnCtx;
      subCtx_3->is_function = true;
      this->WalkNode(variant_2->fnBody, subCtx_3, wr);
      wr->newline();
      wr->indent(-1);
      wr->out(std::string("}"), true);
    }
  }
}

RangerCSharpClassWriter::RangerCSharpClassWriter( ) {
}

std::string  RangerCSharpClassWriter::adjustType( std::string tn ) {
  if ( tn == std::string("this") ) {
    return std::string("this");
  }
  return tn;
}

std::string  RangerCSharpClassWriter::getObjectTypeString( std::string type_string , std::shared_ptr<RangerAppWriterContext> ctx ) {
  bool caseMatched = false;
  if( type_string == std::string("int")) {
    caseMatched = true;
    return std::string("Integer");
  }
  if( type_string == std::string("string")) {
    caseMatched = true;
    return std::string("String");
  }
  if( type_string == std::string("chararray")) {
    caseMatched = true;
    return std::string("byte[]");
  }
  if( type_string == std::string("char")) {
    caseMatched = true;
    return std::string("byte");
  }
  if( type_string == std::string("boolean")) {
    caseMatched = true;
    return std::string("Boolean");
  }
  if( type_string == std::string("double")) {
    caseMatched = true;
    return std::string("Double");
  }
  return type_string;
}

std::string  RangerCSharpClassWriter::getTypeString( std::string type_string ) {
  bool caseMatched = false;
  if( type_string == std::string("int")) {
    caseMatched = true;
    return std::string("int");
  }
  if( type_string == std::string("string")) {
    caseMatched = true;
    return std::string("String");
  }
  if( type_string == std::string("chararray")) {
    caseMatched = true;
    return std::string("byte[]");
  }
  if( type_string == std::string("char")) {
    caseMatched = true;
    return std::string("byte");
  }
  if( type_string == std::string("boolean")) {
    caseMatched = true;
    return std::string("boolean");
  }
  if( type_string == std::string("double")) {
    caseMatched = true;
    return std::string("double");
  }
  return type_string;
}

void  RangerCSharpClassWriter::writeTypeDef( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr ) {
  int v_type = node->value_type;
  if ( node->eval_type != 0 ) {
    v_type = node->eval_type;
  }
  switch (v_type ) { 
    case 11 : 
      {
        wr->out(std::string("int"), false);
        break;
      }
    case 3 : 
      {
        wr->out(std::string("int"), false);
        break;
      }
    case 2 : 
      {
        wr->out(std::string("double"), false);
        break;
      }
    case 12 : 
      {
        wr->out(std::string("byte"), false);
        break;
      }
    case 13 : 
      {
        wr->out(std::string("byte[]"), false);
        break;
      }
    case 4 : 
      {
        wr->out(std::string("String"), false);
        break;
      }
    case 5 : 
      {
        wr->out(std::string("boolean"), false);
        break;
      }
    case 7 : 
      {
        wr->out((((std::string("Dictionary<") + this->getObjectTypeString(node->key_type, ctx)) + std::string(",")) + this->getObjectTypeString(node->array_type, ctx)) + std::string(">"), false);
        wr->addImport(std::string("System.Collections"));
        break;
      }
    case 6 : 
      {
        wr->out((std::string("List<") + this->getObjectTypeString(node->array_type, ctx)) + std::string(">"), false);
        wr->addImport(std::string("System.Collections"));
        break;
      }
    default: 
      if ( node->type_name == std::string("void") ) {
        wr->out(std::string("void"), false);
      } else {
        wr->out(this->getTypeString(node->type_name), false);
      }
      break;
  }
  if ( node->hasFlag(std::string("optional")) ) {
    wr->out(std::string("?"), false);
  }
}

void  RangerCSharpClassWriter::WriteVRef( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr ) {
  if ( node->eval_type == 11 ) {
    if ( (node->ns.size()) > 1 ) {
      std::string rootObjName = node->ns.at(0);
      std::string enumName = node->ns.at(1);
      std::shared_ptr<RangerAppEnum> e = ctx->getEnum(rootObjName);
      if ( e != NULL  ) {
        wr->out(std::string("") + std::to_string(((cpp_get_map_int_value<std::string>(e->values, enumName)).value)), false);
        return;
      }
    }
  }
  if ( (node->nsp.size()) > 0 ) {
    for ( std::vector< std::shared_ptr<RangerAppParamDesc>>::size_type i = 0; i != node->nsp.size(); i++) {
      std::shared_ptr<RangerAppParamDesc> p = node->nsp.at(i);
      if ( i > 0 ) {
        wr->out(std::string("."), false);
      }
      if ( i == 0 ) {
        if ( p->nameNode->hasFlag(std::string("optional")) ) {
        }
      }
      if ( (p->compiledName.length()) > 0 ) {
        wr->out(this->adjustType(p->compiledName), false);
      } else {
        if ( (p->name.length()) > 0 ) {
          wr->out(this->adjustType(p->name), false);
        } else {
          wr->out(this->adjustType((node->ns.at(i))), false);
        }
      }
    }
    return;
  }
  if ( node->hasParamDesc ) {
    std::shared_ptr<RangerAppParamDesc> p_1 = node->paramDesc;
    wr->out(p_1->compiledName, false);
    return;
  }
  for ( std::vector< std::string>::size_type i_1 = 0; i_1 != node->ns.size(); i_1++) {
    std::string part = node->ns.at(i_1);
    if ( i_1 > 0 ) {
      wr->out(std::string("."), false);
    }
    wr->out(this->adjustType(part), false);
  }
}

void  RangerCSharpClassWriter::writeVarDef( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr ) {
  if ( node->hasParamDesc ) {
    std::shared_ptr<CodeNode> nn = node->children.at(1);
    std::shared_ptr<RangerAppParamDesc> p = nn->paramDesc;
    if ( (p->ref_cnt == 0) && (p->is_class_variable == false) ) {
      wr->out(std::string("/** unused:  "), false);
    }
    if ( (p->set_cnt > 0) || p->is_class_variable ) {
      wr->out(std::string(""), false);
    } else {
      wr->out(std::string("const "), false);
    }
    this->writeTypeDef(p->nameNode, ctx, wr);
    wr->out(std::string(" "), false);
    wr->out(p->compiledName, false);
    if ( (node->children.size()) > 2 ) {
      wr->out(std::string(" = "), false);
      ctx->setInExpr();
      std::shared_ptr<CodeNode> value = node->getThird();
      this->WalkNode(value, ctx, wr);
      ctx->unsetInExpr();
    } else {
      if ( nn->value_type == 6 ) {
        wr->out(std::string(" = new "), false);
        this->writeTypeDef(p->nameNode, ctx, wr);
        wr->out(std::string("()"), false);
      }
      if ( nn->value_type == 7 ) {
        wr->out(std::string(" = new "), false);
        this->writeTypeDef(p->nameNode, ctx, wr);
        wr->out(std::string("()"), false);
      }
    }
    if ( (p->ref_cnt == 0) && (p->is_class_variable == true) ) {
      wr->out(std::string("     /** note: unused */"), false);
    }
    if ( (p->ref_cnt == 0) && (p->is_class_variable == false) ) {
      wr->out(std::string("   **/ ;"), true);
    } else {
      wr->out(std::string(";"), false);
      wr->newline();
    }
  }
}

void  RangerCSharpClassWriter::writeArgsDef( std::shared_ptr<RangerAppFunctionDesc> fnDesc , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr ) {
  for ( std::vector< std::shared_ptr<RangerAppParamDesc>>::size_type i = 0; i != fnDesc->params.size(); i++) {
    std::shared_ptr<RangerAppParamDesc> arg = fnDesc->params.at(i);
    if ( i > 0 ) {
      wr->out(std::string(","), false);
    }
    wr->out(std::string(" "), false);
    this->writeTypeDef(arg->nameNode, ctx, wr);
    wr->out((std::string(" ") + arg->name) + std::string(" "), false);
  }
}

void  RangerCSharpClassWriter::writeClass( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> orig_wr ) {
  std::shared_ptr<RangerAppClassDesc> cl = node->clDesc;
  if ( cl == NULL ) {
    return;
  }
  std::shared_ptr<CodeWriter> wr = orig_wr->getFileWriter(std::string("."), (cl->name + std::string(".cs")));
  std::shared_ptr<CodeWriter> importFork = wr->fork();
  wr->out(std::string(""), true);
  wr->out((std::string("class ") + cl->name) + std::string(" {"), true);
  wr->indent(1);
  for ( std::vector< std::shared_ptr<RangerAppParamDesc>>::size_type i = 0; i != cl->variables.size(); i++) {
    std::shared_ptr<RangerAppParamDesc> pvar = cl->variables.at(i);
    wr->out(std::string("public "), false);
    this->writeVarDef(pvar->node, ctx, wr);
  }
  if ( cl->has_constructor ) {
    std::shared_ptr<RangerAppFunctionDesc> constr = cl->constructor_fn;
    wr->out(std::string(""), true);
    wr->out(cl->name + std::string("("), false);
    this->writeArgsDef(constr, ctx, wr);
    wr->out(std::string(" ) {"), true);
    wr->indent(1);
    wr->newline();
    std::shared_ptr<RangerAppWriterContext> subCtx = constr->fnCtx;
    subCtx->is_function = true;
    this->WalkNode(constr->fnBody, subCtx, wr);
    wr->newline();
    wr->indent(-1);
    wr->out(std::string("}"), true);
  }
  for ( std::vector< std::shared_ptr<RangerAppFunctionDesc>>::size_type i_1 = 0; i_1 != cl->static_methods.size(); i_1++) {
    std::shared_ptr<RangerAppFunctionDesc> variant = cl->static_methods.at(i_1);
    wr->out(std::string(""), true);
    if ( variant->nameNode->hasFlag(std::string("main")) && (variant->nameNode->code->filename != ctx->getRootFile()) ) {
      continue;
    }
    if ( variant->nameNode->hasFlag(std::string("main")) ) {
      wr->out(std::string("static int Main( string [] args ) {"), true);
    } else {
      wr->out(std::string("public static "), false);
      this->writeTypeDef(variant->nameNode, ctx, wr);
      wr->out(std::string(" "), false);
      wr->out(variant->name + std::string("("), false);
      this->writeArgsDef(variant, ctx, wr);
      wr->out(std::string(") {"), true);
    }
    wr->indent(1);
    wr->newline();
    std::shared_ptr<RangerAppWriterContext> subCtx_1 = variant->fnCtx;
    subCtx_1->is_function = true;
    this->WalkNode(variant->fnBody, subCtx_1, wr);
    wr->newline();
    wr->indent(-1);
    wr->out(std::string("}"), true);
  }
  for ( std::vector< std::string>::size_type i_2 = 0; i_2 != cl->defined_variants.size(); i_2++) {
    std::string fnVar = cl->defined_variants.at(i_2);
    std::shared_ptr<RangerAppMethodVariants> mVs = cl->method_variants[fnVar];
    for ( std::vector< std::shared_ptr<RangerAppFunctionDesc>>::size_type i_3 = 0; i_3 != mVs->variants.size(); i_3++) {
      std::shared_ptr<RangerAppFunctionDesc> variant_1 = mVs->variants.at(i_3);
      wr->out(std::string(""), true);
      wr->out(std::string("public "), false);
      this->writeTypeDef(variant_1->nameNode, ctx, wr);
      wr->out(std::string(" "), false);
      wr->out(variant_1->name + std::string("("), false);
      this->writeArgsDef(variant_1, ctx, wr);
      wr->out(std::string(") {"), true);
      wr->indent(1);
      wr->newline();
      std::shared_ptr<RangerAppWriterContext> subCtx_2 = variant_1->fnCtx;
      subCtx_2->is_function = true;
      this->WalkNode(variant_1->fnBody, subCtx_2, wr);
      wr->newline();
      wr->indent(-1);
      wr->out(std::string("}"), true);
    }
  }
  wr->indent(-1);
  wr->out(std::string("}"), true);
  std::vector<std::string> import_list = wr->getImports();
  for ( std::vector< std::string>::size_type i_4 = 0; i_4 != import_list.size(); i_4++) {
    std::string codeStr = import_list.at(i_4);
    importFork->out((std::string("using ") + codeStr) + std::string(";"), true);
  }
}

RangerScalaClassWriter::RangerScalaClassWriter( ) {
}

std::string  RangerScalaClassWriter::getObjectTypeString( std::string type_string , std::shared_ptr<RangerAppWriterContext> ctx ) {
  bool caseMatched = false;
  if( type_string == std::string("int")) {
    caseMatched = true;
    return std::string("Int");
  }
  if( type_string == std::string("string")) {
    caseMatched = true;
    return std::string("String");
  }
  if( type_string == std::string("boolean")) {
    caseMatched = true;
    return std::string("Boolean");
  }
  if( type_string == std::string("double")) {
    caseMatched = true;
    return std::string("Double");
  }
  if( type_string == std::string("chararray")) {
    caseMatched = true;
    return std::string("Array[Byte]");
  }
  if( type_string == std::string("char")) {
    caseMatched = true;
    return std::string("byte");
  }
  return type_string;
}

std::string  RangerScalaClassWriter::getTypeString( std::string type_string ) {
  bool caseMatched = false;
  if( type_string == std::string("int")) {
    caseMatched = true;
    return std::string("Int");
  }
  if( type_string == std::string("string")) {
    caseMatched = true;
    return std::string("String");
  }
  if( type_string == std::string("boolean")) {
    caseMatched = true;
    return std::string("Boolean");
  }
  if( type_string == std::string("double")) {
    caseMatched = true;
    return std::string("Double");
  }
  if( type_string == std::string("chararray")) {
    caseMatched = true;
    return std::string("Array[Byte]");
  }
  if( type_string == std::string("char")) {
    caseMatched = true;
    return std::string("byte");
  }
  return type_string;
}

void  RangerScalaClassWriter::writeTypeDef( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr ) {
  if ( node->hasFlag(std::string("optional")) ) {
    wr->out(std::string("Option["), false);
  }
  int v_type = node->value_type;
  if ( node->eval_type != 0 ) {
    v_type = node->eval_type;
  }
  switch (v_type ) { 
    case 11 : 
      {
        wr->out(std::string("Int"), false);
        break;
      }
    case 3 : 
      {
        wr->out(std::string("Int"), false);
        break;
      }
    case 2 : 
      {
        wr->out(std::string("Double"), false);
        break;
      }
    case 4 : 
      {
        wr->out(std::string("String"), false);
        break;
      }
    case 5 : 
      {
        wr->out(std::string("Boolean"), false);
        break;
      }
    case 12 : 
      {
        wr->out(std::string("Byte"), false);
        break;
      }
    case 13 : 
      {
        wr->out(std::string("Array[Byte]"), false);
        break;
      }
    case 7 : 
      {
        wr->addImport(std::string("scala.collection.mutable"));
        wr->out((((std::string("collection.mutable.HashMap[") + this->getObjectTypeString(node->key_type, ctx)) + std::string(", ")) + this->getObjectTypeString(node->array_type, ctx)) + std::string("]"), false);
        break;
      }
    case 6 : 
      {
        wr->addImport(std::string("scala.collection.mutable"));
        wr->out((std::string("collection.mutable.ArrayBuffer[") + this->getObjectTypeString(node->array_type, ctx)) + std::string("]"), false);
        break;
      }
    default: 
      if ( node->type_name == std::string("void") ) {
        wr->out(std::string("Unit"), false);
        return;
      }
      wr->out(this->getTypeString(node->type_name), false);
      break;
  }
  if ( node->hasFlag(std::string("optional")) ) {
    wr->out(std::string("]"), false);
  }
}

void  RangerScalaClassWriter::writeTypeDefNoOption( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr ) {
  int v_type = node->value_type;
  if ( node->eval_type != 0 ) {
    v_type = node->eval_type;
  }
  switch (v_type ) { 
    case 11 : 
      {
        wr->out(std::string("Int"), false);
        break;
      }
    case 3 : 
      {
        wr->out(std::string("Int"), false);
        break;
      }
    case 2 : 
      {
        wr->out(std::string("Double"), false);
        break;
      }
    case 4 : 
      {
        wr->out(std::string("String"), false);
        break;
      }
    case 5 : 
      {
        wr->out(std::string("Boolean"), false);
        break;
      }
    case 12 : 
      {
        wr->out(std::string("Byte"), false);
        break;
      }
    case 13 : 
      {
        wr->out(std::string("Array[Byte]"), false);
        break;
      }
    case 7 : 
      {
        wr->addImport(std::string("scala.collection.mutable"));
        wr->out((((std::string("collection.mutable.HashMap[") + this->getObjectTypeString(node->key_type, ctx)) + std::string(", ")) + this->getObjectTypeString(node->array_type, ctx)) + std::string("]"), false);
        break;
      }
    case 6 : 
      {
        wr->addImport(std::string("scala.collection.mutable"));
        wr->out((std::string("collection.mutable.ArrayBuffer[") + this->getObjectTypeString(node->array_type, ctx)) + std::string("]"), false);
        break;
      }
    default: 
      if ( node->type_name == std::string("void") ) {
        wr->out(std::string("Unit"), false);
        return;
      }
      wr->out(this->getTypeString(node->type_name), false);
      break;
  }
}

void  RangerScalaClassWriter::WriteVRef( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr ) {
  if ( node->eval_type == 11 ) {
    if ( (node->ns.size()) > 1 ) {
      std::string rootObjName = node->ns.at(0);
      std::string enumName = node->ns.at(1);
      std::shared_ptr<RangerAppEnum> e = ctx->getEnum(rootObjName);
      if ( e != NULL  ) {
        wr->out(std::string("") + std::to_string(((cpp_get_map_int_value<std::string>(e->values, enumName)).value)), false);
        return;
      }
    }
  }
  if ( (node->nsp.size()) > 0 ) {
    for ( std::vector< std::shared_ptr<RangerAppParamDesc>>::size_type i = 0; i != node->nsp.size(); i++) {
      std::shared_ptr<RangerAppParamDesc> p = node->nsp.at(i);
      if ( i > 0 ) {
        wr->out(std::string("."), false);
      }
      if ( (p->compiledName.length()) > 0 ) {
        wr->out(this->adjustType(p->compiledName), false);
      } else {
        if ( (p->name.length()) > 0 ) {
          wr->out(this->adjustType(p->name), false);
        } else {
          wr->out(this->adjustType((node->ns.at(i))), false);
        }
      }
      if ( i == 0 ) {
        if ( p->nameNode->hasFlag(std::string("optional")) ) {
          wr->out(std::string(".get"), false);
        }
      }
    }
    return;
  }
  if ( node->hasParamDesc ) {
    std::shared_ptr<RangerAppParamDesc> p_1 = node->paramDesc;
    wr->out(p_1->compiledName, false);
    return;
  }
  for ( std::vector< std::string>::size_type i_1 = 0; i_1 != node->ns.size(); i_1++) {
    std::string part = node->ns.at(i_1);
    if ( i_1 > 0 ) {
      wr->out(std::string("."), false);
    }
    wr->out(this->adjustType(part), false);
  }
}

void  RangerScalaClassWriter::writeVarDef( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr ) {
  if ( node->hasParamDesc ) {
    std::shared_ptr<RangerAppParamDesc> p = node->paramDesc;
    /** unused:  std::shared_ptr<CodeNode> nn = node->children.at(1)   **/ ;
    if ( (p->ref_cnt == 0) && (p->is_class_variable == false) ) {
      wr->out(std::string("/** unused "), false);
    }
    if ( (p->set_cnt > 0) || p->is_class_variable ) {
      wr->out((std::string("var ") + p->compiledName) + std::string(" : "), false);
    } else {
      wr->out((std::string("val ") + p->compiledName) + std::string(" : "), false);
    }
    this->writeTypeDef(p->nameNode, ctx, wr);
    if ( (node->children.size()) > 2 ) {
      wr->out(std::string(" = "), false);
      ctx->setInExpr();
      std::shared_ptr<CodeNode> value = node->getThird();
      this->WalkNode(value, ctx, wr);
      ctx->unsetInExpr();
    } else {
      bool b_inited = false;
      if ( p->nameNode->value_type == 6 ) {
        b_inited = true;
        wr->out(std::string("= new collection.mutable.ArrayBuffer()"), false);
      }
      if ( p->nameNode->value_type == 7 ) {
        b_inited = true;
        wr->out(std::string("= new collection.mutable.HashMap()"), false);
      }
      if ( p->nameNode->hasFlag(std::string("optional")) ) {
        wr->out(std::string(" = Option.empty["), false);
        this->writeTypeDefNoOption(p->nameNode, ctx, wr);
        wr->out(std::string("]"), false);
      } else {
        if ( b_inited == false ) {
          wr->out(std::string(" = _"), false);
        }
      }
    }
    if ( (p->ref_cnt == 0) && (p->is_class_variable == false) ) {
      wr->out(std::string("**/ "), true);
    } else {
      wr->newline();
    }
  }
}

void  RangerScalaClassWriter::writeArgsDef( std::shared_ptr<RangerAppFunctionDesc> fnDesc , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr ) {
  for ( std::vector< std::shared_ptr<RangerAppParamDesc>>::size_type i = 0; i != fnDesc->params.size(); i++) {
    std::shared_ptr<RangerAppParamDesc> arg = fnDesc->params.at(i);
    if ( i > 0 ) {
      wr->out(std::string(","), false);
    }
    wr->out(std::string(" "), false);
    wr->out(arg->name + std::string(" : "), false);
    this->writeTypeDef(arg->nameNode, ctx, wr);
  }
}

void  RangerScalaClassWriter::writeClass( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> orig_wr ) {
  std::shared_ptr<RangerAppClassDesc> cl = node->clDesc;
  if ( cl == NULL ) {
    return;
  }
  std::shared_ptr<CodeWriter> wr = orig_wr->getFileWriter(std::string("."), (cl->name + std::string(".scala")));
  std::shared_ptr<CodeWriter> importFork = wr->fork();
  wr->out(std::string(""), true);
  wr->out((std::string("class ") + cl->name) + std::string(" "), false);
  if ( cl->has_constructor ) {
    wr->out(std::string("("), false);
    std::shared_ptr<RangerAppFunctionDesc> constr = cl->constructor_fn;
    for ( std::vector< std::shared_ptr<RangerAppParamDesc>>::size_type i = 0; i != constr->params.size(); i++) {
      std::shared_ptr<RangerAppParamDesc> arg = constr->params.at(i);
      if ( i > 0 ) {
        wr->out(std::string(", "), false);
      }
      wr->out(arg->name + std::string(" : "), false);
      this->writeTypeDef(arg->nameNode, ctx, wr);
    }
    wr->out(std::string(")"), false);
  }
  wr->out(std::string(" {"), true);
  wr->indent(1);
  for ( std::vector< std::shared_ptr<RangerAppParamDesc>>::size_type i_1 = 0; i_1 != cl->variables.size(); i_1++) {
    std::shared_ptr<RangerAppParamDesc> pvar = cl->variables.at(i_1);
    this->writeVarDef(pvar->node, ctx, wr);
  }
  if ( cl->has_constructor ) {
    std::shared_ptr<RangerAppFunctionDesc> constr_1 = cl->constructor_fn;
    wr->newline();
    std::shared_ptr<RangerAppWriterContext> subCtx = constr_1->fnCtx;
    subCtx->is_function = true;
    this->WalkNode(constr_1->fnBody, subCtx, wr);
    wr->newline();
  }
  for ( std::vector< std::string>::size_type i_2 = 0; i_2 != cl->defined_variants.size(); i_2++) {
    std::string fnVar = cl->defined_variants.at(i_2);
    std::shared_ptr<RangerAppMethodVariants> mVs = cl->method_variants[fnVar];
    for ( std::vector< std::shared_ptr<RangerAppFunctionDesc>>::size_type i_3 = 0; i_3 != mVs->variants.size(); i_3++) {
      std::shared_ptr<RangerAppFunctionDesc> variant = mVs->variants.at(i_3);
      wr->out(std::string(""), true);
      wr->out(std::string("def "), false);
      wr->out(std::string(" "), false);
      wr->out(variant->name + std::string("("), false);
      this->writeArgsDef(variant, ctx, wr);
      wr->out(std::string(") : "), false);
      this->writeTypeDef(variant->nameNode, ctx, wr);
      wr->out(std::string(" = {"), true);
      wr->indent(1);
      wr->newline();
      std::shared_ptr<RangerAppWriterContext> subCtx_1 = variant->fnCtx;
      subCtx_1->is_function = true;
      this->WalkNode(variant->fnBody, subCtx_1, wr);
      wr->newline();
      wr->indent(-1);
      wr->out(std::string("}"), true);
    }
  }
  wr->indent(-1);
  wr->out(std::string("}"), true);
  bool b_had_app = false;
  std::shared_ptr<RangerAppFunctionDesc> app_obj;
  if ( (cl->static_methods.size()) > 0 ) {
    wr->out(std::string(""), true);
    wr->out(std::string("// companion object for static methods of ") + cl->name, true);
    wr->out((std::string("object ") + cl->name) + std::string(" {"), true);
    wr->indent(1);
  }
  for ( std::vector< std::shared_ptr<RangerAppFunctionDesc>>::size_type i_4 = 0; i_4 != cl->static_methods.size(); i_4++) {
    std::shared_ptr<RangerAppFunctionDesc> variant_1 = cl->static_methods.at(i_4);
    if ( variant_1->nameNode->hasFlag(std::string("main")) ) {
      b_had_app = true;
      app_obj  = variant_1;
      continue;
    }
    wr->out(std::string(""), true);
    wr->out(std::string("def "), false);
    wr->out(std::string(" "), false);
    wr->out(variant_1->name + std::string("("), false);
    this->writeArgsDef(variant_1, ctx, wr);
    wr->out(std::string(") : "), false);
    this->writeTypeDef(variant_1->nameNode, ctx, wr);
    wr->out(std::string(" = {"), true);
    wr->indent(1);
    wr->newline();
    std::shared_ptr<RangerAppWriterContext> subCtx_2 = variant_1->fnCtx;
    subCtx_2->is_function = true;
    this->WalkNode(variant_1->fnBody, subCtx_2, wr);
    wr->newline();
    wr->indent(-1);
    wr->out(std::string("}"), true);
  }
  if ( (cl->static_methods.size()) > 0 ) {
    wr->newline();
    wr->indent(-1);
    wr->out(std::string("}"), true);
  }
  if ( b_had_app ) {
    std::shared_ptr<RangerAppFunctionDesc> variant_2 = app_obj;
    wr->out(std::string(""), true);
    wr->out(std::string("// application main function for ") + cl->name, true);
    wr->out((std::string("object App") + cl->name) + std::string(" extends App {"), true);
    wr->indent(1);
    wr->indent(1);
    wr->newline();
    std::shared_ptr<RangerAppWriterContext> subCtx_3 = variant_2->fnCtx;
    subCtx_3->is_function = true;
    this->WalkNode(variant_2->fnBody, subCtx_3, wr);
    wr->newline();
    wr->indent(-1);
    wr->out(std::string("}"), true);
  }
  std::vector<std::string> import_list = wr->getImports();
  for ( std::vector< std::string>::size_type i_5 = 0; i_5 != import_list.size(); i_5++) {
    std::string codeStr = import_list.at(i_5);
    importFork->out((std::string("import ") + codeStr) + std::string(";"), true);
  }
}

RangerGolangClassWriter::RangerGolangClassWriter( ) {
  this->thisName = std::string("this");
  this->write_raw_type = false;
  this->did_write_nullable = false;
}

void  RangerGolangClassWriter::WriteScalarValue( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr ) {
  switch (node->value_type ) { 
    case 2 : 
      {
        wr->out(node->getParsedString(), false);
        break;
      }
    case 4 : 
      {
        std::string s = this->EncodeString(node, ctx, wr);
        wr->out((std::string("\"") + s) + std::string("\""), false);
        break;
      }
    case 3 : 
      {
        wr->out(std::string("") + std::to_string(node->int_value), false);
        break;
      }
    case 5 : 
      {
        if ( node->boolean_value ) {
          wr->out(std::string("true"), false);
        } else {
          wr->out(std::string("false"), false);
        }
        break;
      }
  }
}

std::string  RangerGolangClassWriter::getObjectTypeString( std::string type_string , std::shared_ptr<RangerAppWriterContext> ctx ) {
  if ( type_string == std::string("this") ) {
    return thisName;
  }
  if ( ctx->isDefinedClass(type_string) ) {
    std::shared_ptr<RangerAppClassDesc> cc = ctx->findClass(type_string);
    if ( cc->doesInherit() ) {
      return std::string("IFACE_") + ctx->transformTypeName(type_string);
    }
  }
  bool caseMatched = false;
  if( type_string == std::string("int")) {
    caseMatched = true;
    return std::string("int64");
  }
  if( type_string == std::string("string")) {
    caseMatched = true;
    return std::string("string");
  }
  if( type_string == std::string("boolean")) {
    caseMatched = true;
    return std::string("bool");
  }
  if( type_string == std::string("double")) {
    caseMatched = true;
    return std::string("float64");
  }
  if( type_string == std::string("char")) {
    caseMatched = true;
    return std::string("byte");
  }
  if( type_string == std::string("charbuffer")) {
    caseMatched = true;
    return std::string("[]byte");
  }
  return ctx->transformTypeName(type_string);
}

std::string  RangerGolangClassWriter::getTypeString2( std::string type_string , std::shared_ptr<RangerAppWriterContext> ctx ) {
  if ( type_string == std::string("this") ) {
    return thisName;
  }
  bool caseMatched = false;
  if( type_string == std::string("int")) {
    caseMatched = true;
    return std::string("int64");
  }
  if( type_string == std::string("string")) {
    caseMatched = true;
    return std::string("string");
  }
  if( type_string == std::string("boolean")) {
    caseMatched = true;
    return std::string("bool");
  }
  if( type_string == std::string("double")) {
    caseMatched = true;
    return std::string("float64");
  }
  if( type_string == std::string("char")) {
    caseMatched = true;
    return std::string("byte");
  }
  if( type_string == std::string("charbuffer")) {
    caseMatched = true;
    return std::string("[]byte");
  }
  return ctx->transformTypeName(type_string);
}

void  RangerGolangClassWriter::writeRawTypeDef( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr ) {
  write_raw_type = true;
  this->writeTypeDef(node, ctx, wr);
  write_raw_type = false;
}

void  RangerGolangClassWriter::writeTypeDef( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr ) {
  this->writeTypeDef2(node, ctx, wr);
}

void  RangerGolangClassWriter::writeArrayTypeDef( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr ) {
  int v_type = node->value_type;
  std::string a_name = node->array_type;
  if ( ((v_type == 8) || (v_type == 9)) || (v_type == 0) ) {
    v_type = node->typeNameAsType(ctx);
  }
  if ( node->eval_type != 0 ) {
    v_type = node->eval_type;
    if ( (node->eval_array_type.length()) > 0 ) {
      a_name = node->eval_array_type;
    }
  }
  switch (v_type ) { 
    case 7 : 
      {
        if ( ctx->isDefinedClass(a_name) ) {
          std::shared_ptr<RangerAppClassDesc> cc = ctx->findClass(a_name);
          if ( cc->doesInherit() ) {
            wr->out(std::string("IFACE_") + this->getTypeString2(a_name, ctx), false);
            return;
          }
        }
        if ( ctx->isPrimitiveType(a_name) == false ) {
          wr->out(std::string("*"), false);
        }
        wr->out(this->getObjectTypeString(a_name, ctx) + std::string(""), false);
        break;
      }
    case 6 : 
      {
        if ( ctx->isDefinedClass(a_name) ) {
          std::shared_ptr<RangerAppClassDesc> cc_1 = ctx->findClass(a_name);
          if ( cc_1->doesInherit() ) {
            wr->out(std::string("IFACE_") + this->getTypeString2(a_name, ctx), false);
            return;
          }
        }
        if ( (write_raw_type == false) && (ctx->isPrimitiveType(a_name) == false) ) {
          wr->out(std::string("*"), false);
        }
        wr->out(this->getObjectTypeString(a_name, ctx) + std::string(""), false);
        break;
      }
    default: 
      break;
  }
}

void  RangerGolangClassWriter::writeTypeDef2( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr ) {
  int v_type = node->value_type;
  std::string t_name = node->type_name;
  std::string a_name = node->array_type;
  std::string k_name = node->key_type;
  if ( ((v_type == 8) || (v_type == 9)) || (v_type == 0) ) {
    v_type = node->typeNameAsType(ctx);
  }
  if ( node->eval_type != 0 ) {
    v_type = node->eval_type;
    if ( (node->eval_type_name.length()) > 0 ) {
      t_name = node->eval_type_name;
    }
    if ( (node->eval_array_type.length()) > 0 ) {
      a_name = node->eval_array_type;
    }
    if ( (node->eval_key_type.length()) > 0 ) {
      k_name = node->eval_key_type;
    }
  }
  switch (v_type ) { 
    case 15 : 
      {
        std::shared_ptr<CodeNode> rv = node->expression_value->children.at(0);
        std::shared_ptr<CodeNode> sec = node->expression_value->children.at(1);
        /** unused:  std::shared_ptr<CodeNode> fc = sec->getFirst()   **/ ;
        wr->out(std::string("func("), false);
        for ( std::vector< std::shared_ptr<CodeNode>>::size_type i = 0; i != sec->children.size(); i++) {
          std::shared_ptr<CodeNode> arg = sec->children.at(i);
          if ( i > 0 ) {
            wr->out(std::string(", "), false);
          }
          this->writeTypeDef2(arg, ctx, wr);
        }
        wr->out(std::string(") "), false);
        this->writeTypeDef2(rv, ctx, wr);
        break;
      }
    case 11 : 
      {
        wr->out(std::string("int64"), false);
        break;
      }
    case 3 : 
      {
        wr->out(std::string("int64"), false);
        break;
      }
    case 2 : 
      {
        wr->out(std::string("float64"), false);
        break;
      }
    case 4 : 
      {
        wr->out(std::string("string"), false);
        break;
      }
    case 5 : 
      {
        wr->out(std::string("bool"), false);
        break;
      }
    case 12 : 
      {
        wr->out(std::string("byte"), false);
        break;
      }
    case 13 : 
      {
        wr->out(std::string("[]byte"), false);
        break;
      }
    case 7 : 
      {
        if ( write_raw_type ) {
          wr->out(this->getObjectTypeString(a_name, ctx) + std::string(""), false);
        } else {
          wr->out((std::string("map[") + this->getObjectTypeString(k_name, ctx)) + std::string("]"), false);
          if ( ctx->isDefinedClass(a_name) ) {
            std::shared_ptr<RangerAppClassDesc> cc = ctx->findClass(a_name);
            if ( cc->doesInherit() ) {
              wr->out(std::string("IFACE_") + this->getTypeString2(a_name, ctx), false);
              return;
            }
          }
          if ( (write_raw_type == false) && (ctx->isPrimitiveType(a_name) == false) ) {
            wr->out(std::string("*"), false);
          }
          wr->out(this->getObjectTypeString(a_name, ctx) + std::string(""), false);
        }
        break;
      }
    case 6 : 
      {
        if ( false == write_raw_type ) {
          wr->out(std::string("[]"), false);
        }
        if ( ctx->isDefinedClass(a_name) ) {
          std::shared_ptr<RangerAppClassDesc> cc_1 = ctx->findClass(a_name);
          if ( cc_1->doesInherit() ) {
            wr->out(std::string("IFACE_") + this->getTypeString2(a_name, ctx), false);
            return;
          }
        }
        if ( (write_raw_type == false) && (ctx->isPrimitiveType(a_name) == false) ) {
          wr->out(std::string("*"), false);
        }
        wr->out(this->getObjectTypeString(a_name, ctx) + std::string(""), false);
        break;
      }
    default: 
      if ( node->type_name == std::string("void") ) {
        wr->out(std::string("()"), false);
        return;
      }
      bool b_iface = false;
      if ( ctx->isDefinedClass(t_name) ) {
        std::shared_ptr<RangerAppClassDesc> cc_2 = ctx->findClass(t_name);
        b_iface = cc_2->is_interface;
      }
      if ( ctx->isDefinedClass(t_name) ) {
        std::shared_ptr<RangerAppClassDesc> cc_3 = ctx->findClass(t_name);
        if ( cc_3->doesInherit() ) {
          wr->out(std::string("IFACE_") + this->getTypeString2(t_name, ctx), false);
          return;
        }
      }
      if ( ((write_raw_type == false) && (node->isPrimitiveType() == false)) && (b_iface == false) ) {
        wr->out(std::string("*"), false);
      }
      wr->out(this->getTypeString2(t_name, ctx), false);
      break;
  }
}

void  RangerGolangClassWriter::WriteVRef( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr ) {
  if ( node->vref == std::string("this") ) {
    wr->out(thisName, false);
    return;
  }
  if ( node->eval_type == 11 ) {
    if ( (node->ns.size()) > 1 ) {
      std::string rootObjName = node->ns.at(0);
      std::string enumName = node->ns.at(1);
      std::shared_ptr<RangerAppEnum> e = ctx->getEnum(rootObjName);
      if ( e != NULL  ) {
        wr->out(std::string("") + std::to_string(((cpp_get_map_int_value<std::string>(e->values, enumName)).value)), false);
        return;
      }
    }
  }
  bool next_is_gs = false;
  /** unused:  bool last_was_setter = false   **/ ;
  bool needs_par = false;
  int ns_last = (node->ns.size()) - 1;
  if ( (node->nsp.size()) > 0 ) {
    bool had_static = false;
    for ( std::vector< std::shared_ptr<RangerAppParamDesc>>::size_type i = 0; i != node->nsp.size(); i++) {
      std::shared_ptr<RangerAppParamDesc> p = node->nsp.at(i);
      if ( next_is_gs ) {
        if ( p->isProperty() ) {
          wr->out(std::string(".Get_"), false);
          needs_par = true;
        } else {
          needs_par = false;
        }
        next_is_gs = false;
      }
      if ( needs_par == false ) {
        if ( i > 0 ) {
          if ( had_static ) {
            wr->out(std::string("_static_"), false);
          } else {
            wr->out(std::string("."), false);
          }
        }
      }
      if ( (p->nameNode != NULL ) && ctx->isDefinedClass(p->nameNode->type_name) ) {
        std::shared_ptr<RangerAppClassDesc> c = ctx->findClass(p->nameNode->type_name);
        if ( c->doesInherit() ) {
          next_is_gs = true;
        }
      }
      if ( i == 0 ) {
        std::string part = node->ns.at(0);
        if ( part == std::string("this") ) {
          wr->out(thisName, false);
          continue;
        }
        if ( (part != thisName) && ctx->isMemberVariable(part) ) {
          std::shared_ptr<RangerAppClassDesc> cc = ctx->getCurrentClass();
          std::shared_ptr<RangerAppClassDesc> currC = cc;
          std::shared_ptr<RangerAppParamDesc> up = currC->findVariable(part);
          if ( up != NULL  ) {
            /** unused:  std::shared_ptr<RangerAppParamDesc> p3 = up   **/ ;
            wr->out(thisName + std::string("."), false);
          }
        }
      }
      if ( (p->compiledName.length()) > 0 ) {
        wr->out(this->adjustType(p->compiledName), false);
      } else {
        if ( (p->name.length()) > 0 ) {
          wr->out(this->adjustType(p->name), false);
        } else {
          wr->out(this->adjustType((node->ns.at(i))), false);
        }
      }
      if ( needs_par ) {
        wr->out(std::string("()"), false);
        needs_par = false;
      }
      if ( ((p->nameNode != NULL ) && p->nameNode->hasFlag(std::string("optional"))) && (i != ns_last) ) {
        wr->out(std::string(".value.("), false);
        this->writeTypeDef(p->nameNode, ctx, wr);
        wr->out(std::string(")"), false);
      }
      if ( p->isClass() ) {
        had_static = true;
      }
    }
    return;
  }
  if ( node->hasParamDesc ) {
    std::string part_1 = node->ns.at(0);
    if ( (part_1 != thisName) && ctx->isMemberVariable(part_1) ) {
      std::shared_ptr<RangerAppClassDesc> cc_1 = ctx->getCurrentClass();
      std::shared_ptr<RangerAppClassDesc> currC_1 = cc_1;
      std::shared_ptr<RangerAppParamDesc> up_1 = currC_1->findVariable(part_1);
      if ( up_1 != NULL  ) {
        /** unused:  std::shared_ptr<RangerAppParamDesc> p3_1 = up_1   **/ ;
        wr->out(thisName + std::string("."), false);
      }
    }
    std::shared_ptr<RangerAppParamDesc> p_1 = node->paramDesc;
    wr->out(p_1->compiledName, false);
    return;
  }
  bool b_was_static = false;
  for ( std::vector< std::string>::size_type i_1 = 0; i_1 != node->ns.size(); i_1++) {
    std::string part_2 = node->ns.at(i_1);
    if ( i_1 > 0 ) {
      if ( (i_1 == 1) && b_was_static ) {
        wr->out(std::string("_static_"), false);
      } else {
        wr->out(std::string("."), false);
      }
    }
    if ( i_1 == 0 ) {
      if ( part_2 == std::string("this") ) {
        wr->out(thisName, false);
        continue;
      }
      if ( ctx->hasClass(part_2) ) {
        b_was_static = true;
      }
      if ( (part_2 != std::string("this")) && ctx->isMemberVariable(part_2) ) {
        std::shared_ptr<RangerAppClassDesc> cc_2 = ctx->getCurrentClass();
        std::shared_ptr<RangerAppClassDesc> currC_2 = cc_2;
        std::shared_ptr<RangerAppParamDesc> up_2 = currC_2->findVariable(part_2);
        if ( up_2 != NULL  ) {
          /** unused:  std::shared_ptr<RangerAppParamDesc> p3_2 = up_2   **/ ;
          wr->out(thisName + std::string("."), false);
        }
      }
    }
    wr->out(this->adjustType(part_2), false);
  }
}

void  RangerGolangClassWriter::WriteSetterVRef( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr ) {
  if ( node->vref == std::string("this") ) {
    wr->out(thisName, false);
    return;
  }
  if ( node->eval_type == 11 ) {
    std::string rootObjName = node->ns.at(0);
    std::string enumName = node->ns.at(1);
    std::shared_ptr<RangerAppEnum> e = ctx->getEnum(rootObjName);
    if ( e != NULL  ) {
      wr->out(std::string("") + std::to_string(((cpp_get_map_int_value<std::string>(e->values, enumName)).value)), false);
      return;
    }
  }
  bool next_is_gs = false;
  /** unused:  bool last_was_setter = false   **/ ;
  bool needs_par = false;
  int ns_len = (node->ns.size()) - 1;
  if ( (node->nsp.size()) > 0 ) {
    bool had_static = false;
    for ( std::vector< std::shared_ptr<RangerAppParamDesc>>::size_type i = 0; i != node->nsp.size(); i++) {
      std::shared_ptr<RangerAppParamDesc> p = node->nsp.at(i);
      if ( next_is_gs ) {
        if ( p->isProperty() ) {
          wr->out(std::string(".Get_"), false);
          needs_par = true;
        } else {
          needs_par = false;
        }
        next_is_gs = false;
      }
      if ( needs_par == false ) {
        if ( i > 0 ) {
          if ( had_static ) {
            wr->out(std::string("_static_"), false);
          } else {
            wr->out(std::string("."), false);
          }
        }
      }
      if ( ctx->isDefinedClass(p->nameNode->type_name) ) {
        std::shared_ptr<RangerAppClassDesc> c = ctx->findClass(p->nameNode->type_name);
        if ( c->doesInherit() ) {
          next_is_gs = true;
        }
      }
      if ( i == 0 ) {
        std::string part = node->ns.at(0);
        if ( part == std::string("this") ) {
          wr->out(thisName, false);
          continue;
        }
        if ( (part != thisName) && ctx->isMemberVariable(part) ) {
          std::shared_ptr<RangerAppClassDesc> cc = ctx->getCurrentClass();
          std::shared_ptr<RangerAppClassDesc> currC = cc;
          std::shared_ptr<RangerAppParamDesc> up = currC->findVariable(part);
          if ( up != NULL  ) {
            /** unused:  std::shared_ptr<RangerAppParamDesc> p3 = up   **/ ;
            wr->out(thisName + std::string("."), false);
          }
        }
      }
      if ( (p->compiledName.length()) > 0 ) {
        wr->out(this->adjustType(p->compiledName), false);
      } else {
        if ( (p->name.length()) > 0 ) {
          wr->out(this->adjustType(p->name), false);
        } else {
          wr->out(this->adjustType((node->ns.at(i))), false);
        }
      }
      if ( needs_par ) {
        wr->out(std::string("()"), false);
        needs_par = false;
      }
      if ( i < ns_len ) {
        if ( p->nameNode->hasFlag(std::string("optional")) ) {
          wr->out(std::string(".value.("), false);
          this->writeTypeDef(p->nameNode, ctx, wr);
          wr->out(std::string(")"), false);
        }
      }
      if ( p->isClass() ) {
        had_static = true;
      }
    }
    return;
  }
  if ( node->hasParamDesc ) {
    std::string part_1 = node->ns.at(0);
    if ( (part_1 != thisName) && ctx->isMemberVariable(part_1) ) {
      std::shared_ptr<RangerAppClassDesc> cc_1 = ctx->getCurrentClass();
      std::shared_ptr<RangerAppClassDesc> currC_1 = cc_1;
      std::shared_ptr<RangerAppParamDesc> up_1 = currC_1->findVariable(part_1);
      if ( up_1 != NULL  ) {
        /** unused:  std::shared_ptr<RangerAppParamDesc> p3_1 = up_1   **/ ;
        wr->out(thisName + std::string("."), false);
      }
    }
    std::shared_ptr<RangerAppParamDesc> p_1 = node->paramDesc;
    wr->out(p_1->compiledName, false);
    return;
  }
  bool b_was_static = false;
  for ( std::vector< std::string>::size_type i_1 = 0; i_1 != node->ns.size(); i_1++) {
    std::string part_2 = node->ns.at(i_1);
    if ( i_1 > 0 ) {
      if ( (i_1 == 1) && b_was_static ) {
        wr->out(std::string("_static_"), false);
      } else {
        wr->out(std::string("."), false);
      }
    }
    if ( i_1 == 0 ) {
      if ( part_2 == std::string("this") ) {
        wr->out(thisName, false);
        continue;
      }
      if ( ctx->hasClass(part_2) ) {
        b_was_static = true;
      }
      if ( (part_2 != std::string("this")) && ctx->isMemberVariable(part_2) ) {
        std::shared_ptr<RangerAppClassDesc> cc_2 = ctx->getCurrentClass();
        std::shared_ptr<RangerAppClassDesc> currC_2 = cc_2;
        std::shared_ptr<RangerAppParamDesc> up_2 = currC_2->findVariable(part_2);
        if ( up_2 != NULL  ) {
          /** unused:  std::shared_ptr<RangerAppParamDesc> p3_2 = up_2   **/ ;
          wr->out(thisName + std::string("."), false);
        }
      }
    }
    wr->out(this->adjustType(part_2), false);
  }
}

void  RangerGolangClassWriter::goExtractAssign( std::shared_ptr<CodeNode> value , std::shared_ptr<RangerAppParamDesc> p , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr ) {
  std::shared_ptr<CodeNode> arr_node = value->children.at(1);
  wr->newline();
  wr->out(std::string(""), true);
  wr->out(std::string("// array_extract operator "), true);
  wr->out(std::string("var "), false);
  std::shared_ptr<RangerAppParamDesc> pArr =  std::make_shared<RangerAppParamDesc>();
  pArr->name = std::string("_arrTemp");
  pArr->node  = arr_node;
  pArr->nameNode  = arr_node;
  pArr->is_optional = false;
  ctx->defineVariable(p->name, pArr);
  wr->out(pArr->compiledName, false);
  wr->out(std::string(" "), false);
  this->writeTypeDef(arr_node, ctx, wr);
  wr->newline();
  wr->out(((p->compiledName + std::string(" , ")) + pArr->compiledName) + std::string(" = "), false);
  ctx->setInExpr();
  this->WalkNode(value, ctx, wr);
  ctx->unsetInExpr();
  wr->out(std::string(";"), true);
  std::shared_ptr<CodeNode> left = arr_node;
  int a_len = (left->ns.size()) - 1;
  /** unused:  std::string last_part = left->ns.at(a_len)   **/ ;
  bool next_is_gs = false;
  bool last_was_setter = false;
  bool needs_par = false;
  bool b_was_static = false;
  for ( std::vector< std::string>::size_type i = 0; i != left->ns.size(); i++) {
    std::string part = left->ns.at(i);
    if ( next_is_gs ) {
      if ( i == a_len ) {
        wr->out(std::string(".Set_"), false);
        last_was_setter = true;
      } else {
        wr->out(std::string(".Get_"), false);
        needs_par = true;
        next_is_gs = false;
        last_was_setter = false;
      }
    }
    if ( (last_was_setter == false) && (needs_par == false) ) {
      if ( i > 0 ) {
        if ( (i == 1) && b_was_static ) {
          wr->out(std::string("_static_"), false);
        } else {
          wr->out(std::string("."), false);
        }
      }
    }
    if ( i == 0 ) {
      if ( part == std::string("this") ) {
        wr->out(thisName, false);
        continue;
      }
      if ( ctx->hasClass(part) ) {
        b_was_static = true;
      }
      std::shared_ptr<RangerAppParamDesc> partDef = ctx->getVariableDef(part);
      if ( partDef->nameNode != NULL  ) {
        if ( ctx->isDefinedClass(partDef->nameNode->type_name) ) {
          std::shared_ptr<RangerAppClassDesc> c = ctx->findClass(partDef->nameNode->type_name);
          if ( c->doesInherit() ) {
            next_is_gs = true;
          }
        }
      }
      if ( (part != std::string("this")) && ctx->isMemberVariable(part) ) {
        std::shared_ptr<RangerAppClassDesc> cc = ctx->getCurrentClass();
        std::shared_ptr<RangerAppClassDesc> currC = cc;
        std::shared_ptr<RangerAppParamDesc> up = currC->findVariable(part);
        if ( up != NULL  ) {
          /** unused:  std::shared_ptr<RangerAppParamDesc> p3 = up   **/ ;
          wr->out(thisName + std::string("."), false);
        }
      }
    }
    if ( (left->nsp.size()) > 0 ) {
      std::shared_ptr<RangerAppParamDesc> p_1 = left->nsp.at(i);
      wr->out(this->adjustType(p_1->compiledName), false);
    } else {
      if ( left->hasParamDesc ) {
        wr->out(left->paramDesc->compiledName, false);
      } else {
        wr->out(this->adjustType(part), false);
      }
    }
    if ( needs_par ) {
      wr->out(std::string("()"), false);
      needs_par = false;
    }
    if ( (left->nsp.size()) >= (i + 1) ) {
      std::shared_ptr<RangerAppParamDesc> pp = left->nsp.at(i);
      if ( pp->nameNode->hasFlag(std::string("optional")) ) {
        wr->out(std::string(".value.("), false);
        this->writeTypeDef(pp->nameNode, ctx, wr);
        wr->out(std::string(")"), false);
      }
    }
  }
  if ( last_was_setter ) {
    wr->out(std::string("("), false);
    wr->out(pArr->compiledName, false);
    wr->out(std::string("); "), true);
  } else {
    wr->out(std::string(" = "), false);
    wr->out(pArr->compiledName, false);
    wr->out(std::string("; "), true);
  }
  wr->out(std::string(""), true);
}

void  RangerGolangClassWriter::writeStructField( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr ) {
  if ( node->hasParamDesc ) {
    std::shared_ptr<CodeNode> nn = node->children.at(1);
    std::shared_ptr<RangerAppParamDesc> p = nn->paramDesc;
    wr->out(p->compiledName + std::string(" "), false);
    if ( p->nameNode->hasFlag(std::string("optional")) ) {
      wr->out(std::string("*GoNullable"), false);
    } else {
      this->writeTypeDef(p->nameNode, ctx, wr);
    }
    if ( p->ref_cnt == 0 ) {
      wr->out(std::string(" /**  unused  **/ "), false);
    }
    wr->out(std::string(""), true);
    if ( p->nameNode->hasFlag(std::string("optional")) ) {
    }
  }
}

void  RangerGolangClassWriter::writeVarDef( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr ) {
  if ( node->hasParamDesc ) {
    std::shared_ptr<CodeNode> nn = node->children.at(1);
    std::shared_ptr<RangerAppParamDesc> p = nn->paramDesc;
    bool b_not_used = false;
    if ( (p->ref_cnt == 0) && (p->is_class_variable == false) ) {
      wr->out((std::string("/** unused:  ") + p->compiledName) + std::string("*/"), true);
      b_not_used = true;
      return;
    }
    bool map_or_hash = (nn->value_type == 6) || (nn->value_type == 7);
    if ( nn->hasFlag(std::string("optional")) ) {
      wr->out((std::string("var ") + p->compiledName) + std::string(" *GoNullable = new(GoNullable); "), true);
      if ( (node->children.size()) > 2 ) {
        std::shared_ptr<CodeNode> value = node->children.at(2);
        if ( value->hasParamDesc ) {
          std::shared_ptr<CodeNode> pnn = value->paramDesc->nameNode;
          if ( pnn->hasFlag(std::string("optional")) ) {
            wr->out(p->compiledName + std::string(".value = "), false);
            ctx->setInExpr();
            std::shared_ptr<CodeNode> value_1 = node->getThird();
            this->WalkNode(value_1, ctx, wr);
            ctx->unsetInExpr();
            wr->out(std::string(".value;"), true);
            wr->out(p->compiledName + std::string(".has_value = "), false);
            ctx->setInExpr();
            std::shared_ptr<CodeNode> value_2 = node->getThird();
            this->WalkNode(value_2, ctx, wr);
            ctx->unsetInExpr();
            wr->out(std::string(".has_value;"), true);
            return;
          } else {
            wr->out(p->compiledName + std::string(".value = "), false);
            ctx->setInExpr();
            std::shared_ptr<CodeNode> value_3 = node->getThird();
            this->WalkNode(value_3, ctx, wr);
            ctx->unsetInExpr();
            wr->out(std::string(";"), true);
            wr->out(p->compiledName + std::string(".has_value = true;"), true);
            return;
          }
        } else {
          wr->out(p->compiledName + std::string(" = "), false);
          ctx->setInExpr();
          std::shared_ptr<CodeNode> value_4 = node->getThird();
          this->WalkNode(value_4, ctx, wr);
          ctx->unsetInExpr();
          wr->out(std::string(";"), true);
          return;
        }
      }
      return;
    } else {
      if ( ((p->set_cnt > 0) || p->is_class_variable) || map_or_hash ) {
        wr->out((std::string("var ") + p->compiledName) + std::string(" "), false);
      } else {
        wr->out((std::string("var ") + p->compiledName) + std::string(" "), false);
      }
    }
    this->writeTypeDef2(p->nameNode, ctx, wr);
    if ( (node->children.size()) > 2 ) {
      std::shared_ptr<CodeNode> value_5 = node->getThird();
      if ( value_5->expression && ((value_5->children.size()) > 1) ) {
        std::shared_ptr<CodeNode> fc = value_5->children.at(0);
        if ( fc->vref == std::string("array_extract") ) {
          this->goExtractAssign(value_5, p, ctx, wr);
          return;
        }
      }
      wr->out(std::string(" = "), false);
      ctx->setInExpr();
      this->WalkNode(value_5, ctx, wr);
      ctx->unsetInExpr();
    } else {
      if ( nn->value_type == 6 ) {
        wr->out(std::string(" = make("), false);
        this->writeTypeDef(p->nameNode, ctx, wr);
        wr->out(std::string(", 0)"), false);
      }
      if ( nn->value_type == 7 ) {
        wr->out(std::string(" = make("), false);
        this->writeTypeDef(p->nameNode, ctx, wr);
        wr->out(std::string(")"), false);
      }
    }
    wr->out(std::string(";"), false);
    if ( (p->ref_cnt == 0) && (p->is_class_variable == true) ) {
      wr->out(std::string("     /** note: unused */"), false);
    }
    if ( (p->ref_cnt == 0) && (p->is_class_variable == false) ) {
      wr->out(std::string("   **/ "), true);
    } else {
      wr->newline();
    }
    if ( b_not_used == false ) {
      if ( nn->hasFlag(std::string("optional")) ) {
        wr->addImport(std::string("errors"));
      }
    }
  }
}

void  RangerGolangClassWriter::writeArgsDef( std::shared_ptr<RangerAppFunctionDesc> fnDesc , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr ) {
  for ( std::vector< std::shared_ptr<RangerAppParamDesc>>::size_type i = 0; i != fnDesc->params.size(); i++) {
    std::shared_ptr<RangerAppParamDesc> arg = fnDesc->params.at(i);
    if ( i > 0 ) {
      wr->out(std::string(", "), false);
    }
    wr->out(arg->name + std::string(" "), false);
    if ( arg->nameNode->hasFlag(std::string("optional")) ) {
      wr->out(std::string("*GoNullable"), false);
    } else {
      this->writeTypeDef(arg->nameNode, ctx, wr);
    }
  }
}

void  RangerGolangClassWriter::writeNewCall( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr ) {
  if ( node->hasNewOper ) {
    std::shared_ptr<RangerAppClassDesc> cl = node->clDesc;
    /** unused:  std::shared_ptr<CodeNode> fc = node->getSecond()   **/ ;
    wr->out((std::string("CreateNew_") + node->clDesc->name) + std::string("("), false);
    std::shared_ptr<RangerAppFunctionDesc> constr = cl->constructor_fn;
    std::shared_ptr<CodeNode> givenArgs = node->getThird();
    if ( constr != NULL  ) {
      for ( std::vector< std::shared_ptr<RangerAppParamDesc>>::size_type i = 0; i != constr->params.size(); i++) {
        std::shared_ptr<RangerAppParamDesc> arg = constr->params.at(i);
        std::shared_ptr<CodeNode> n = givenArgs->children.at(i);
        if ( i > 0 ) {
          wr->out(std::string(", "), false);
        }
        if ( true || (arg->nameNode != NULL ) ) {
          this->WalkNode(n, ctx, wr);
        }
      }
    }
    wr->out(std::string(")"), false);
  }
}

void  RangerGolangClassWriter::CreateLambdaCall( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr ) {
  std::shared_ptr<CodeNode> fName = node->children.at(0);
  std::shared_ptr<CodeNode> args = node->children.at(1);
  this->WriteVRef(fName, ctx, wr);
  wr->out(std::string("("), false);
  for ( std::vector< std::shared_ptr<CodeNode>>::size_type i = 0; i != args->children.size(); i++) {
    std::shared_ptr<CodeNode> arg = args->children.at(i);
    if ( i > 0 ) {
      wr->out(std::string(", "), false);
    }
    if ( arg->value_type != 0 ) {
      this->WalkNode(arg, ctx, wr);
    }
  }
  wr->out(std::string(")"), false);
  if ( ctx->expressionLevel() == 0 ) {
    wr->out(std::string(";"), true);
  }
}

void  RangerGolangClassWriter::CreateLambda( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr ) {
  std::shared_ptr<RangerAppWriterContext> lambdaCtx = node->lambda_ctx;
  std::shared_ptr<CodeNode> fnNode = node->children.at(0);
  std::shared_ptr<CodeNode> args = node->children.at(1);
  std::shared_ptr<CodeNode> body = node->children.at(2);
  wr->out(std::string("func ("), false);
  for ( std::vector< std::shared_ptr<CodeNode>>::size_type i = 0; i != args->children.size(); i++) {
    std::shared_ptr<CodeNode> arg = args->children.at(i);
    if ( i > 0 ) {
      wr->out(std::string(", "), false);
    }
    this->WalkNode(arg, lambdaCtx, wr);
    wr->out(std::string(" "), false);
    if ( arg->hasFlag(std::string("optional")) ) {
      wr->out(std::string("*GoNullable"), false);
    } else {
      this->writeTypeDef(arg, lambdaCtx, wr);
    }
  }
  wr->out(std::string(") "), false);
  if ( fnNode->hasFlag(std::string("optional")) ) {
    wr->out(std::string("*GoNullable"), false);
  } else {
    this->writeTypeDef(fnNode, lambdaCtx, wr);
  }
  wr->out(std::string(" {"), true);
  wr->indent(1);
  lambdaCtx->restartExpressionLevel();
  for ( std::vector< std::shared_ptr<CodeNode>>::size_type i_1 = 0; i_1 != body->children.size(); i_1++) {
    std::shared_ptr<CodeNode> item = body->children.at(i_1);
    this->WalkNode(item, lambdaCtx, wr);
  }
  wr->newline();
  wr->indent(-1);
  wr->out(std::string("}"), false);
}

void  RangerGolangClassWriter::CustomOperator( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr ) {
  std::shared_ptr<CodeNode> fc = node->getFirst();
  std::string cmd = fc->vref;
  if ( ((cmd == std::string("=")) || (cmd == std::string("push"))) || (cmd == std::string("removeLast")) ) {
    std::shared_ptr<CodeNode> left = node->getSecond();
    std::shared_ptr<CodeNode> right = left;
    if ( (cmd == std::string("=")) || (cmd == std::string("push")) ) {
      right = node->getThird();
    }
    wr->newline();
    bool b_was_static = false;
    if ( left->hasParamDesc ) {
      int a_len = (left->ns.size()) - 1;
      /** unused:  std::string last_part = left->ns.at(a_len)   **/ ;
      bool next_is_gs = false;
      bool last_was_setter = false;
      bool needs_par = false;
      for ( std::vector< std::string>::size_type i = 0; i != left->ns.size(); i++) {
        std::string part = left->ns.at(i);
        if ( next_is_gs ) {
          if ( i == a_len ) {
            wr->out(std::string(".Set_"), false);
            last_was_setter = true;
          } else {
            wr->out(std::string(".Get_"), false);
            needs_par = true;
            next_is_gs = false;
            last_was_setter = false;
          }
        }
        if ( (last_was_setter == false) && (needs_par == false) ) {
          if ( i > 0 ) {
            if ( (i == 1) && b_was_static ) {
              wr->out(std::string("_static_"), false);
            } else {
              wr->out(std::string("."), false);
            }
          }
        }
        if ( i == 0 ) {
          if ( part == std::string("this") ) {
            wr->out(thisName, false);
            continue;
          }
          if ( ctx->hasClass(part) ) {
            b_was_static = true;
          }
          if ( (part != std::string("this")) && ctx->isMemberVariable(part) ) {
            std::shared_ptr<RangerAppClassDesc> cc = ctx->getCurrentClass();
            std::shared_ptr<RangerAppClassDesc> currC = cc;
            std::shared_ptr<RangerAppParamDesc> up = currC->findVariable(part);
            if ( up != NULL  ) {
              /** unused:  std::shared_ptr<RangerAppParamDesc> p3 = up   **/ ;
              wr->out(thisName + std::string("."), false);
            }
          }
        }
        std::shared_ptr<RangerAppParamDesc> partDef = ctx->getVariableDef(part);
        if ( (left->nsp.size()) > i ) {
          partDef = left->nsp.at(i);
        }
        if ( partDef->nameNode != NULL  ) {
          if ( ctx->isDefinedClass(partDef->nameNode->type_name) ) {
            std::shared_ptr<RangerAppClassDesc> c = ctx->findClass(partDef->nameNode->type_name);
            if ( c->doesInherit() ) {
              next_is_gs = true;
            }
          }
        }
        if ( (left->nsp.size()) > 0 ) {
          std::shared_ptr<RangerAppParamDesc> p = left->nsp.at(i);
          wr->out(this->adjustType(p->compiledName), false);
        } else {
          if ( left->hasParamDesc ) {
            wr->out(left->paramDesc->compiledName, false);
          } else {
            wr->out(this->adjustType(part), false);
          }
        }
        if ( needs_par ) {
          wr->out(std::string("()"), false);
          needs_par = false;
        }
        if ( (left->nsp.size()) >= (i + 1) ) {
          std::shared_ptr<RangerAppParamDesc> pp = left->nsp.at(i);
          if ( pp->nameNode->hasFlag(std::string("optional")) ) {
            wr->out(std::string(".value.("), false);
            this->writeTypeDef(pp->nameNode, ctx, wr);
            wr->out(std::string(")"), false);
          }
        }
      }
      if ( cmd == std::string("removeLast") ) {
        if ( last_was_setter ) {
          wr->out(std::string("("), false);
          ctx->setInExpr();
          this->WalkNode(left, ctx, wr);
          wr->out(std::string("[:len("), false);
          this->WalkNode(left, ctx, wr);
          wr->out(std::string(")-1]"), false);
          ctx->unsetInExpr();
          wr->out(std::string("); "), true);
        } else {
          wr->out(std::string(" = "), false);
          ctx->setInExpr();
          this->WalkNode(left, ctx, wr);
          wr->out(std::string("[:len("), false);
          this->WalkNode(left, ctx, wr);
          wr->out(std::string(")-1]"), false);
          ctx->unsetInExpr();
          wr->out(std::string("; "), true);
        }
        return;
      }
      if ( cmd == std::string("push") ) {
        if ( last_was_setter ) {
          wr->out(std::string("("), false);
          ctx->setInExpr();
          wr->out(std::string("append("), false);
          this->WalkNode(left, ctx, wr);
          wr->out(std::string(","), false);
          this->WalkNode(right, ctx, wr);
          ctx->unsetInExpr();
          wr->out(std::string(")); "), true);
        } else {
          wr->out(std::string(" = "), false);
          wr->out(std::string("append("), false);
          ctx->setInExpr();
          this->WalkNode(left, ctx, wr);
          wr->out(std::string(","), false);
          this->WalkNode(right, ctx, wr);
          ctx->unsetInExpr();
          wr->out(std::string("); "), true);
        }
        return;
      }
      if ( last_was_setter ) {
        wr->out(std::string("("), false);
        ctx->setInExpr();
        this->WalkNode(right, ctx, wr);
        ctx->unsetInExpr();
        wr->out(std::string("); "), true);
      } else {
        wr->out(std::string(" = "), false);
        ctx->setInExpr();
        this->WalkNode(right, ctx, wr);
        ctx->unsetInExpr();
        wr->out(std::string("; "), true);
      }
      return;
    }
    this->WriteSetterVRef(left, ctx, wr);
    wr->out(std::string(" = "), false);
    ctx->setInExpr();
    this->WalkNode(right, ctx, wr);
    ctx->unsetInExpr();
    wr->out(std::string("; /* custom */"), true);
  }
}

void  RangerGolangClassWriter::writeInterface( std::shared_ptr<RangerAppClassDesc> cl , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr ) {
  wr->out((std::string("type ") + cl->name) + std::string(" interface { "), true);
  wr->indent(1);
  for ( std::vector< std::string>::size_type i = 0; i != cl->defined_variants.size(); i++) {
    std::string fnVar = cl->defined_variants.at(i);
    std::shared_ptr<RangerAppMethodVariants> mVs = cl->method_variants[fnVar];
    for ( std::vector< std::shared_ptr<RangerAppFunctionDesc>>::size_type i_1 = 0; i_1 != mVs->variants.size(); i_1++) {
      std::shared_ptr<RangerAppFunctionDesc> variant = mVs->variants.at(i_1);
      wr->out(variant->compiledName + std::string("("), false);
      this->writeArgsDef(variant, ctx, wr);
      wr->out(std::string(") "), false);
      if ( variant->nameNode->hasFlag(std::string("optional")) ) {
        wr->out(std::string("*GoNullable"), false);
      } else {
        this->writeTypeDef(variant->nameNode, ctx, wr);
      }
      wr->out(std::string(""), true);
    }
  }
  wr->indent(-1);
  wr->out(std::string("}"), true);
}

void  RangerGolangClassWriter::writeClass( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> orig_wr ) {
  std::shared_ptr<RangerAppClassDesc> cl = node->clDesc;
  if ( cl == NULL ) {
    return;
  }
  std::shared_ptr<CodeWriter> wr = orig_wr;
  if ( did_write_nullable == false ) {
    wr->raw(std::string("\r\ntype GoNullable struct { \r\n  value interface{}\r\n  has_value bool\r\n}\r\n"), true);
    wr->createTag(std::string("utilities"));
    did_write_nullable = true;
  }
  std::map<std::string,bool> declaredVariable;
  wr->out((std::string("type ") + cl->name) + std::string(" struct { "), true);
  wr->indent(1);
  for ( std::vector< std::shared_ptr<RangerAppParamDesc>>::size_type i = 0; i != cl->variables.size(); i++) {
    std::shared_ptr<RangerAppParamDesc> pvar = cl->variables.at(i);
    this->writeStructField(pvar->node, ctx, wr);
    declaredVariable[pvar->name] = true;
  }
  if ( (cl->extends_classes.size()) > 0 ) {
    for ( std::vector< std::string>::size_type i_1 = 0; i_1 != cl->extends_classes.size(); i_1++) {
      std::string pName = cl->extends_classes.at(i_1);
      std::shared_ptr<RangerAppClassDesc> pC = ctx->findClass(pName);
      wr->out(std::string("// inherited from parent class ") + pName, true);
      for ( std::vector< std::shared_ptr<RangerAppParamDesc>>::size_type i_2 = 0; i_2 != pC->variables.size(); i_2++) {
        std::shared_ptr<RangerAppParamDesc> pvar_1 = pC->variables.at(i_2);
        if ( declaredVariable.count(pvar_1->name) ) {
          continue;
        }
        this->writeStructField(pvar_1->node, ctx, wr);
      }
    }
  }
  wr->indent(-1);
  wr->out(std::string("}"), true);
  wr->out((std::string("type IFACE_") + cl->name) + std::string(" interface { "), true);
  wr->indent(1);
  for ( std::vector< std::shared_ptr<RangerAppParamDesc>>::size_type i_3 = 0; i_3 != cl->variables.size(); i_3++) {
    std::shared_ptr<RangerAppParamDesc> p = cl->variables.at(i_3);
    wr->out(std::string("Get_"), false);
    wr->out(p->compiledName + std::string("() "), false);
    if ( p->nameNode->hasFlag(std::string("optional")) ) {
      wr->out(std::string("*GoNullable"), false);
    } else {
      this->writeTypeDef(p->nameNode, ctx, wr);
    }
    wr->out(std::string(""), true);
    wr->out(std::string("Set_"), false);
    wr->out(p->compiledName + std::string("(value "), false);
    if ( p->nameNode->hasFlag(std::string("optional")) ) {
      wr->out(std::string("*GoNullable"), false);
    } else {
      this->writeTypeDef(p->nameNode, ctx, wr);
    }
    wr->out(std::string(") "), true);
  }
  for ( std::vector< std::string>::size_type i_4 = 0; i_4 != cl->defined_variants.size(); i_4++) {
    std::string fnVar = cl->defined_variants.at(i_4);
    std::shared_ptr<RangerAppMethodVariants> mVs = cl->method_variants[fnVar];
    for ( std::vector< std::shared_ptr<RangerAppFunctionDesc>>::size_type i_5 = 0; i_5 != mVs->variants.size(); i_5++) {
      std::shared_ptr<RangerAppFunctionDesc> variant = mVs->variants.at(i_5);
      wr->out(variant->compiledName + std::string("("), false);
      this->writeArgsDef(variant, ctx, wr);
      wr->out(std::string(") "), false);
      if ( variant->nameNode->hasFlag(std::string("optional")) ) {
        wr->out(std::string("*GoNullable"), false);
      } else {
        this->writeTypeDef(variant->nameNode, ctx, wr);
      }
      wr->out(std::string(""), true);
    }
  }
  wr->indent(-1);
  wr->out(std::string("}"), true);
  thisName = std::string("me");
  wr->out(std::string(""), true);
  wr->out((std::string("func CreateNew_") + cl->name) + std::string("("), false);
  if ( cl->has_constructor ) {
    std::shared_ptr<RangerAppFunctionDesc> constr = cl->constructor_fn;
    for ( std::vector< std::shared_ptr<RangerAppParamDesc>>::size_type i_6 = 0; i_6 != constr->params.size(); i_6++) {
      std::shared_ptr<RangerAppParamDesc> arg = constr->params.at(i_6);
      if ( i_6 > 0 ) {
        wr->out(std::string(", "), false);
      }
      wr->out(arg->name + std::string(" "), false);
      this->writeTypeDef(arg->nameNode, ctx, wr);
    }
  }
  wr->out((std::string(") *") + cl->name) + std::string(" {"), true);
  wr->indent(1);
  wr->newline();
  wr->out((std::string("me := new(") + cl->name) + std::string(")"), true);
  for ( std::vector< std::shared_ptr<RangerAppParamDesc>>::size_type i_7 = 0; i_7 != cl->variables.size(); i_7++) {
    std::shared_ptr<RangerAppParamDesc> pvar_2 = cl->variables.at(i_7);
    std::shared_ptr<CodeNode> nn = pvar_2->node;
    if ( (nn->children.size()) > 2 ) {
      std::shared_ptr<CodeNode> valueNode = nn->children.at(2);
      wr->out((std::string("me.") + pvar_2->compiledName) + std::string(" = "), false);
      this->WalkNode(valueNode, ctx, wr);
      wr->out(std::string(""), true);
    } else {
      std::shared_ptr<CodeNode> pNameN = pvar_2->nameNode;
      if ( pNameN->value_type == 6 ) {
        wr->out((std::string("me.") + pvar_2->compiledName) + std::string(" = "), false);
        wr->out(std::string("make("), false);
        this->writeTypeDef(pvar_2->nameNode, ctx, wr);
        wr->out(std::string(",0)"), true);
      }
      if ( pNameN->value_type == 7 ) {
        wr->out((std::string("me.") + pvar_2->compiledName) + std::string(" = "), false);
        wr->out(std::string("make("), false);
        this->writeTypeDef(pvar_2->nameNode, ctx, wr);
        wr->out(std::string(")"), true);
      }
    }
  }
  for ( std::vector< std::shared_ptr<RangerAppParamDesc>>::size_type i_8 = 0; i_8 != cl->variables.size(); i_8++) {
    std::shared_ptr<RangerAppParamDesc> pvar_3 = cl->variables.at(i_8);
    if ( pvar_3->nameNode->hasFlag(std::string("optional")) ) {
      wr->out((std::string("me.") + pvar_3->compiledName) + std::string(" = new(GoNullable);"), true);
    }
  }
  if ( (cl->extends_classes.size()) > 0 ) {
    for ( std::vector< std::string>::size_type i_9 = 0; i_9 != cl->extends_classes.size(); i_9++) {
      std::string pName_1 = cl->extends_classes.at(i_9);
      std::shared_ptr<RangerAppClassDesc> pC_1 = ctx->findClass(pName_1);
      for ( std::vector< std::shared_ptr<RangerAppParamDesc>>::size_type i_10 = 0; i_10 != pC_1->variables.size(); i_10++) {
        std::shared_ptr<RangerAppParamDesc> pvar_4 = pC_1->variables.at(i_10);
        std::shared_ptr<CodeNode> nn_1 = pvar_4->node;
        if ( (nn_1->children.size()) > 2 ) {
          std::shared_ptr<CodeNode> valueNode_1 = nn_1->children.at(2);
          wr->out((std::string("me.") + pvar_4->compiledName) + std::string(" = "), false);
          this->WalkNode(valueNode_1, ctx, wr);
          wr->out(std::string(""), true);
        } else {
          std::shared_ptr<CodeNode> pNameN_1 = pvar_4->nameNode;
          if ( pNameN_1->value_type == 6 ) {
            wr->out((std::string("me.") + pvar_4->compiledName) + std::string(" = "), false);
            wr->out(std::string("make("), false);
            this->writeTypeDef(pvar_4->nameNode, ctx, wr);
            wr->out(std::string(",0)"), true);
          }
          if ( pNameN_1->value_type == 7 ) {
            wr->out((std::string("me.") + pvar_4->compiledName) + std::string(" = "), false);
            wr->out(std::string("make("), false);
            this->writeTypeDef(pvar_4->nameNode, ctx, wr);
            wr->out(std::string(")"), true);
          }
        }
      }
      for ( std::vector< std::shared_ptr<RangerAppParamDesc>>::size_type i_11 = 0; i_11 != pC_1->variables.size(); i_11++) {
        std::shared_ptr<RangerAppParamDesc> pvar_5 = pC_1->variables.at(i_11);
        if ( pvar_5->nameNode->hasFlag(std::string("optional")) ) {
          wr->out((std::string("me.") + pvar_5->compiledName) + std::string(" = new(GoNullable);"), true);
        }
      }
      if ( pC_1->has_constructor ) {
        std::shared_ptr<RangerAppFunctionDesc> constr_1 = pC_1->constructor_fn;
        std::shared_ptr<RangerAppWriterContext> subCtx = constr_1->fnCtx;
        subCtx->is_function = true;
        this->WalkNode(constr_1->fnBody, subCtx, wr);
      }
    }
  }
  if ( cl->has_constructor ) {
    std::shared_ptr<RangerAppFunctionDesc> constr_2 = cl->constructor_fn;
    std::shared_ptr<RangerAppWriterContext> subCtx_1 = constr_2->fnCtx;
    subCtx_1->is_function = true;
    this->WalkNode(constr_2->fnBody, subCtx_1, wr);
  }
  wr->out(std::string("return me;"), true);
  wr->indent(-1);
  wr->out(std::string("}"), true);
  thisName = std::string("this");
  for ( std::vector< std::shared_ptr<RangerAppFunctionDesc>>::size_type i_12 = 0; i_12 != cl->static_methods.size(); i_12++) {
    std::shared_ptr<RangerAppFunctionDesc> variant_1 = cl->static_methods.at(i_12);
    if ( variant_1->nameNode->hasFlag(std::string("main")) ) {
      continue;
    }
    wr->newline();
    wr->out((((std::string("func ") + cl->name) + std::string("_static_")) + variant_1->compiledName) + std::string("("), false);
    this->writeArgsDef(variant_1, ctx, wr);
    wr->out(std::string(") "), false);
    this->writeTypeDef(variant_1->nameNode, ctx, wr);
    wr->out(std::string(" {"), true);
    wr->indent(1);
    wr->newline();
    std::shared_ptr<RangerAppWriterContext> subCtx_2 = variant_1->fnCtx;
    subCtx_2->is_function = true;
    this->WalkNode(variant_1->fnBody, subCtx_2, wr);
    wr->newline();
    wr->indent(-1);
    wr->out(std::string("}"), true);
  }
  std::map<std::string,bool> declaredFn;
  for ( std::vector< std::string>::size_type i_13 = 0; i_13 != cl->defined_variants.size(); i_13++) {
    std::string fnVar_1 = cl->defined_variants.at(i_13);
    std::shared_ptr<RangerAppMethodVariants> mVs_1 = cl->method_variants[fnVar_1];
    for ( std::vector< std::shared_ptr<RangerAppFunctionDesc>>::size_type i_14 = 0; i_14 != mVs_1->variants.size(); i_14++) {
      std::shared_ptr<RangerAppFunctionDesc> variant_2 = mVs_1->variants.at(i_14);
      declaredFn[variant_2->name] = true;
      wr->out((((std::string("func (this *") + cl->name) + std::string(") ")) + variant_2->compiledName) + std::string(" ("), false);
      this->writeArgsDef(variant_2, ctx, wr);
      wr->out(std::string(") "), false);
      if ( variant_2->nameNode->hasFlag(std::string("optional")) ) {
        wr->out(std::string("*GoNullable"), false);
      } else {
        this->writeTypeDef(variant_2->nameNode, ctx, wr);
      }
      wr->out(std::string(" {"), true);
      wr->indent(1);
      wr->newline();
      std::shared_ptr<RangerAppWriterContext> subCtx_3 = variant_2->fnCtx;
      subCtx_3->is_function = true;
      this->WalkNode(variant_2->fnBody, subCtx_3, wr);
      wr->newline();
      wr->indent(-1);
      wr->out(std::string("}"), true);
    }
  }
  if ( (cl->extends_classes.size()) > 0 ) {
    for ( std::vector< std::string>::size_type i_15 = 0; i_15 != cl->extends_classes.size(); i_15++) {
      std::string pName_2 = cl->extends_classes.at(i_15);
      std::shared_ptr<RangerAppClassDesc> pC_2 = ctx->findClass(pName_2);
      wr->out(std::string("// inherited methods from parent class ") + pName_2, true);
      for ( std::vector< std::string>::size_type i_16 = 0; i_16 != pC_2->defined_variants.size(); i_16++) {
        std::string fnVar_2 = pC_2->defined_variants.at(i_16);
        std::shared_ptr<RangerAppMethodVariants> mVs_2 = pC_2->method_variants[fnVar_2];
        for ( std::vector< std::shared_ptr<RangerAppFunctionDesc>>::size_type i_17 = 0; i_17 != mVs_2->variants.size(); i_17++) {
          std::shared_ptr<RangerAppFunctionDesc> variant_3 = mVs_2->variants.at(i_17);
          if ( declaredFn.count(variant_3->name) ) {
            continue;
          }
          wr->out((((std::string("func (this *") + cl->name) + std::string(") ")) + variant_3->compiledName) + std::string(" ("), false);
          this->writeArgsDef(variant_3, ctx, wr);
          wr->out(std::string(") "), false);
          if ( variant_3->nameNode->hasFlag(std::string("optional")) ) {
            wr->out(std::string("*GoNullable"), false);
          } else {
            this->writeTypeDef(variant_3->nameNode, ctx, wr);
          }
          wr->out(std::string(" {"), true);
          wr->indent(1);
          wr->newline();
          std::shared_ptr<RangerAppWriterContext> subCtx_4 = variant_3->fnCtx;
          subCtx_4->is_function = true;
          this->WalkNode(variant_3->fnBody, subCtx_4, wr);
          wr->newline();
          wr->indent(-1);
          wr->out(std::string("}"), true);
        }
      }
    }
  }
  std::map<std::string,bool> declaredGetter;
  for ( std::vector< std::shared_ptr<RangerAppParamDesc>>::size_type i_18 = 0; i_18 != cl->variables.size(); i_18++) {
    std::shared_ptr<RangerAppParamDesc> p_1 = cl->variables.at(i_18);
    declaredGetter[p_1->name] = true;
    wr->newline();
    wr->out(std::string("// getter for variable ") + p_1->name, true);
    wr->out((std::string("func (this *") + cl->name) + std::string(") "), false);
    wr->out(std::string("Get_"), false);
    wr->out(p_1->compiledName + std::string("() "), false);
    if ( p_1->nameNode->hasFlag(std::string("optional")) ) {
      wr->out(std::string("*GoNullable"), false);
    } else {
      this->writeTypeDef(p_1->nameNode, ctx, wr);
    }
    wr->out(std::string(" {"), true);
    wr->indent(1);
    wr->out(std::string("return this.") + p_1->compiledName, true);
    wr->indent(-1);
    wr->out(std::string("}"), true);
    wr->newline();
    wr->out(std::string("// setter for variable ") + p_1->name, true);
    wr->out((std::string("func (this *") + cl->name) + std::string(") "), false);
    wr->out(std::string("Set_"), false);
    wr->out(p_1->compiledName + std::string("( value "), false);
    if ( p_1->nameNode->hasFlag(std::string("optional")) ) {
      wr->out(std::string("*GoNullable"), false);
    } else {
      this->writeTypeDef(p_1->nameNode, ctx, wr);
    }
    wr->out(std::string(") "), false);
    wr->out(std::string(" {"), true);
    wr->indent(1);
    wr->out((std::string("this.") + p_1->compiledName) + std::string(" = value "), true);
    wr->indent(-1);
    wr->out(std::string("}"), true);
  }
  if ( (cl->extends_classes.size()) > 0 ) {
    for ( std::vector< std::string>::size_type i_19 = 0; i_19 != cl->extends_classes.size(); i_19++) {
      std::string pName_3 = cl->extends_classes.at(i_19);
      std::shared_ptr<RangerAppClassDesc> pC_3 = ctx->findClass(pName_3);
      wr->out(std::string("// inherited getters and setters from the parent class ") + pName_3, true);
      for ( std::vector< std::shared_ptr<RangerAppParamDesc>>::size_type i_20 = 0; i_20 != pC_3->variables.size(); i_20++) {
        std::shared_ptr<RangerAppParamDesc> p_2 = pC_3->variables.at(i_20);
        if ( declaredGetter.count(p_2->name) ) {
          continue;
        }
        wr->newline();
        wr->out(std::string("// getter for variable ") + p_2->name, true);
        wr->out((std::string("func (this *") + cl->name) + std::string(") "), false);
        wr->out(std::string("Get_"), false);
        wr->out(p_2->compiledName + std::string("() "), false);
        if ( p_2->nameNode->hasFlag(std::string("optional")) ) {
          wr->out(std::string("*GoNullable"), false);
        } else {
          this->writeTypeDef(p_2->nameNode, ctx, wr);
        }
        wr->out(std::string(" {"), true);
        wr->indent(1);
        wr->out(std::string("return this.") + p_2->compiledName, true);
        wr->indent(-1);
        wr->out(std::string("}"), true);
        wr->newline();
        wr->out(std::string("// getter for variable ") + p_2->name, true);
        wr->out((std::string("func (this *") + cl->name) + std::string(") "), false);
        wr->out(std::string("Set_"), false);
        wr->out(p_2->compiledName + std::string("( value "), false);
        if ( p_2->nameNode->hasFlag(std::string("optional")) ) {
          wr->out(std::string("*GoNullable"), false);
        } else {
          this->writeTypeDef(p_2->nameNode, ctx, wr);
        }
        wr->out(std::string(") "), false);
        wr->out(std::string(" {"), true);
        wr->indent(1);
        wr->out((std::string("this.") + p_2->compiledName) + std::string(" = value "), true);
        wr->indent(-1);
        wr->out(std::string("}"), true);
      }
    }
  }
  for ( std::vector< std::shared_ptr<RangerAppFunctionDesc>>::size_type i_21 = 0; i_21 != cl->static_methods.size(); i_21++) {
    std::shared_ptr<RangerAppFunctionDesc> variant_4 = cl->static_methods.at(i_21);
    if ( variant_4->nameNode->hasFlag(std::string("main")) && (variant_4->nameNode->code->filename == ctx->getRootFile()) ) {
      wr->out(std::string("func main() {"), true);
      wr->indent(1);
      wr->newline();
      std::shared_ptr<RangerAppWriterContext> subCtx_5 = variant_4->fnCtx;
      subCtx_5->is_function = true;
      this->WalkNode(variant_4->fnBody, subCtx_5, wr);
      wr->newline();
      wr->indent(-1);
      wr->out(std::string("}"), true);
    }
  }
}

RangerPHPClassWriter::RangerPHPClassWriter( ) {
  this->thisName = std::string("this");
  this->wrote_header = false;
}

std::string  RangerPHPClassWriter::adjustType( std::string tn ) {
  if ( tn == std::string("this") ) {
    return std::string("this");
  }
  return tn;
}

std::string  RangerPHPClassWriter::EncodeString( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr ) {
  /** unused:  std::string encoded_str = std::string("")   **/ ;
  int str_length = node->string_value.length();
  std::string encoded_str_2 = std::string("");
  int ii = 0;
  while (ii < str_length) {
    int cc = node->string_value.at(ii);
    switch (cc ) { 
      case 8 : 
        {
          encoded_str_2 = (encoded_str_2 + (std::string(1, char(92)))) + (std::string(1, char(98)));
          break;
        }
      case 9 : 
        {
          encoded_str_2 = (encoded_str_2 + (std::string(1, char(92)))) + (std::string(1, char(116)));
          break;
        }
      case 10 : 
        {
          encoded_str_2 = (encoded_str_2 + (std::string(1, char(92)))) + (std::string(1, char(110)));
          break;
        }
      case 12 : 
        {
          encoded_str_2 = (encoded_str_2 + (std::string(1, char(92)))) + (std::string(1, char(102)));
          break;
        }
      case 13 : 
        {
          encoded_str_2 = (encoded_str_2 + (std::string(1, char(92)))) + (std::string(1, char(114)));
          break;
        }
      case 34 : 
        {
          encoded_str_2 = (encoded_str_2 + (std::string(1, char(92)))) + (std::string(1, char(34)));
          break;
        }
      case 36 : 
        {
          encoded_str_2 = (encoded_str_2 + (std::string(1, char(92)))) + (std::string(1, char(34)));
          break;
        }
      case 92 : 
        {
          encoded_str_2 = (encoded_str_2 + (std::string(1, char(92)))) + (std::string(1, char(92)));
          break;
        }
      default: 
        encoded_str_2 = encoded_str_2 + (std::string(1, char(cc)));
        break;
    }
    ii = ii + 1;
  }
  return encoded_str_2;
}

void  RangerPHPClassWriter::WriteScalarValue( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr ) {
  switch (node->value_type ) { 
    case 2 : 
      {
        wr->out(std::string("") + std::to_string(node->double_value), false);
        break;
      }
    case 4 : 
      {
        std::string s = this->EncodeString(node, ctx, wr);
        wr->out((std::string("\"") + s) + std::string("\""), false);
        break;
      }
    case 3 : 
      {
        wr->out(std::string("") + std::to_string(node->int_value), false);
        break;
      }
    case 5 : 
      {
        if ( node->boolean_value ) {
          wr->out(std::string("true"), false);
        } else {
          wr->out(std::string("false"), false);
        }
        break;
      }
  }
}

void  RangerPHPClassWriter::WriteVRef( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr ) {
  if ( node->vref == std::string("this") ) {
    wr->out(std::string("$this"), false);
    return;
  }
  if ( node->eval_type == 11 ) {
    if ( (node->ns.size()) > 1 ) {
      std::string rootObjName = node->ns.at(0);
      std::string enumName = node->ns.at(1);
      std::shared_ptr<RangerAppEnum> e = ctx->getEnum(rootObjName);
      if ( e != NULL  ) {
        wr->out(std::string("") + std::to_string(((cpp_get_map_int_value<std::string>(e->values, enumName)).value)), false);
        return;
      }
    }
  }
  if ( (node->nsp.size()) > 0 ) {
    for ( std::vector< std::shared_ptr<RangerAppParamDesc>>::size_type i = 0; i != node->nsp.size(); i++) {
      std::shared_ptr<RangerAppParamDesc> p = node->nsp.at(i);
      if ( i == 0 ) {
        std::string part = node->ns.at(0);
        if ( part == std::string("this") ) {
          wr->out(std::string("$this"), false);
          continue;
        }
      }
      if ( i > 0 ) {
        wr->out(std::string("->"), false);
      }
      if ( i == 0 ) {
        wr->out(std::string("$"), false);
        if ( p->nameNode->hasFlag(std::string("optional")) ) {
        }
        std::string part_1 = node->ns.at(0);
        if ( (part_1 != std::string("this")) && ctx->hasCurrentClass() ) {
          std::shared_ptr<RangerAppClassDesc> uc = ctx->getCurrentClass();
          std::shared_ptr<RangerAppClassDesc> currC = uc;
          std::shared_ptr<RangerAppParamDesc> up = currC->findVariable(part_1);
          if ( up != NULL  ) {
            if ( false == ctx->isInStatic() ) {
              wr->out(thisName + std::string("->"), false);
            }
          }
        }
      }
      if ( (p->compiledName.length()) > 0 ) {
        wr->out(this->adjustType(p->compiledName), false);
      } else {
        if ( (p->name.length()) > 0 ) {
          wr->out(this->adjustType(p->name), false);
        } else {
          wr->out(this->adjustType((node->ns.at(i))), false);
        }
      }
    }
    return;
  }
  if ( node->hasParamDesc ) {
    wr->out(std::string("$"), false);
    std::string part_2 = node->ns.at(0);
    if ( (part_2 != std::string("this")) && ctx->hasCurrentClass() ) {
      std::shared_ptr<RangerAppClassDesc> uc_1 = ctx->getCurrentClass();
      std::shared_ptr<RangerAppClassDesc> currC_1 = uc_1;
      std::shared_ptr<RangerAppParamDesc> up_1 = currC_1->findVariable(part_2);
      if ( up_1 != NULL  ) {
        if ( false == ctx->isInStatic() ) {
          wr->out(thisName + std::string("->"), false);
        }
      }
    }
    std::shared_ptr<RangerAppParamDesc> p_1 = node->paramDesc;
    wr->out(p_1->compiledName, false);
    return;
  }
  bool b_was_static = false;
  for ( std::vector< std::string>::size_type i_1 = 0; i_1 != node->ns.size(); i_1++) {
    std::string part_3 = node->ns.at(i_1);
    if ( i_1 > 0 ) {
      if ( (i_1 == 1) && b_was_static ) {
        wr->out(std::string("::"), false);
      } else {
        wr->out(std::string("->"), false);
      }
    }
    if ( i_1 == 0 ) {
      if ( ctx->hasClass(part_3) ) {
        b_was_static = true;
      } else {
        wr->out(std::string("$"), false);
      }
      if ( (part_3 != std::string("this")) && ctx->hasCurrentClass() ) {
        std::shared_ptr<RangerAppClassDesc> uc_2 = ctx->getCurrentClass();
        std::shared_ptr<RangerAppClassDesc> currC_2 = uc_2;
        std::shared_ptr<RangerAppParamDesc> up_2 = currC_2->findVariable(part_3);
        if ( up_2 != NULL  ) {
          if ( false == ctx->isInStatic() ) {
            wr->out(thisName + std::string("->"), false);
          }
        }
      }
    }
    wr->out(this->adjustType(part_3), false);
  }
}

void  RangerPHPClassWriter::writeVarInitDef( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr ) {
  if ( node->hasParamDesc ) {
    std::shared_ptr<CodeNode> nn = node->children.at(1);
    std::shared_ptr<RangerAppParamDesc> p = nn->paramDesc;
    if ( (p->ref_cnt == 0) && (p->is_class_variable == false) ) {
      wr->out(std::string("/** unused:  "), false);
    }
    wr->out(std::string("$this->") + p->compiledName, false);
    if ( (node->children.size()) > 2 ) {
      wr->out(std::string(" = "), false);
      ctx->setInExpr();
      std::shared_ptr<CodeNode> value = node->getThird();
      this->WalkNode(value, ctx, wr);
      ctx->unsetInExpr();
    } else {
      if ( nn->value_type == 6 ) {
        wr->out(std::string(" = array()"), false);
      }
      if ( nn->value_type == 7 ) {
        wr->out(std::string(" = array()"), false);
      }
    }
    if ( (p->ref_cnt == 0) && (p->is_class_variable == false) ) {
      wr->out(std::string("   **/"), true);
      return;
    }
    wr->out(std::string(";"), false);
    if ( (p->ref_cnt == 0) && (p->is_class_variable == true) ) {
      wr->out(std::string("     /** note: unused */"), false);
    }
    wr->newline();
  }
}

void  RangerPHPClassWriter::writeVarDef( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr ) {
  if ( node->hasParamDesc ) {
    std::shared_ptr<CodeNode> nn = node->children.at(1);
    std::shared_ptr<RangerAppParamDesc> p = nn->paramDesc;
    if ( (p->ref_cnt == 0) && (p->is_class_variable == false) ) {
      wr->out(std::string("/** unused:  "), false);
    }
    wr->out(std::string("$") + p->compiledName, false);
    if ( (node->children.size()) > 2 ) {
      wr->out(std::string(" = "), false);
      ctx->setInExpr();
      std::shared_ptr<CodeNode> value = node->getThird();
      this->WalkNode(value, ctx, wr);
      ctx->unsetInExpr();
    } else {
      if ( nn->value_type == 6 ) {
        wr->out(std::string(" = array()"), false);
      }
      if ( nn->value_type == 7 ) {
        wr->out(std::string(" = array()"), false);
      }
    }
    if ( (p->ref_cnt == 0) && (p->is_class_variable == true) ) {
      wr->out(std::string("     /** note: unused */"), false);
    }
    if ( (p->ref_cnt == 0) && (p->is_class_variable == false) ) {
      wr->out(std::string("   **/ ;"), true);
    } else {
      wr->out(std::string(";"), false);
      wr->newline();
    }
  }
}

void  RangerPHPClassWriter::disabledVarDef( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr ) {
  if ( node->hasParamDesc ) {
    std::shared_ptr<CodeNode> nn = node->children.at(1);
    std::shared_ptr<RangerAppParamDesc> p = nn->paramDesc;
    wr->out(std::string("$this->") + p->compiledName, false);
    if ( (node->children.size()) > 2 ) {
      wr->out(std::string(" = "), false);
      ctx->setInExpr();
      std::shared_ptr<CodeNode> value = node->getThird();
      this->WalkNode(value, ctx, wr);
      ctx->unsetInExpr();
    } else {
      if ( nn->value_type == 6 ) {
        wr->out(std::string(" = array()"), false);
      }
      if ( nn->value_type == 7 ) {
        wr->out(std::string(" = array()"), false);
      }
    }
    wr->out(std::string(";"), false);
    wr->newline();
  }
}

void  RangerPHPClassWriter::CreateLambdaCall( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr ) {
  std::shared_ptr<CodeNode> fName = node->children.at(0);
  std::shared_ptr<CodeNode> givenArgs = node->children.at(1);
  this->WriteVRef(fName, ctx, wr);
  std::shared_ptr<RangerAppParamDesc> param = ctx->getVariableDef(fName->vref);
  std::shared_ptr<CodeNode> args = param->nameNode->expression_value->children.at(1);
  wr->out(std::string("("), false);
  for ( std::vector< std::shared_ptr<CodeNode>>::size_type i = 0; i != args->children.size(); i++) {
    std::shared_ptr<CodeNode> arg = args->children.at(i);
    std::shared_ptr<CodeNode> n = givenArgs->children.at(i);
    if ( i > 0 ) {
      wr->out(std::string(", "), false);
    }
    if ( arg->value_type != 0 ) {
      this->WalkNode(n, ctx, wr);
    }
  }
  if ( ctx->expressionLevel() == 0 ) {
    wr->out(std::string(");"), true);
  } else {
    wr->out(std::string(")"), false);
  }
}

void  RangerPHPClassWriter::CreateLambda( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr ) {
  std::shared_ptr<RangerAppWriterContext> lambdaCtx = node->lambda_ctx;
  /** unused:  std::shared_ptr<CodeNode> fnNode = node->children.at(0)   **/ ;
  std::shared_ptr<CodeNode> args = node->children.at(1);
  std::shared_ptr<CodeNode> body = node->children.at(2);
  wr->out(std::string("function ("), false);
  for ( std::vector< std::shared_ptr<CodeNode>>::size_type i = 0; i != args->children.size(); i++) {
    std::shared_ptr<CodeNode> arg = args->children.at(i);
    if ( i > 0 ) {
      wr->out(std::string(", "), false);
    }
    this->WalkNode(arg, lambdaCtx, wr);
  }
  wr->out(std::string(") "), false);
  bool had_capture = false;
  if ( had_capture ) {
    wr->out(std::string(")"), false);
  }
  wr->out(std::string(" {"), true);
  wr->indent(1);
  lambdaCtx->restartExpressionLevel();
  for ( std::vector< std::shared_ptr<CodeNode>>::size_type i_1 = 0; i_1 != body->children.size(); i_1++) {
    std::shared_ptr<CodeNode> item = body->children.at(i_1);
    this->WalkNode(item, lambdaCtx, wr);
  }
  wr->newline();
  for ( std::vector< std::string>::size_type i_2 = 0; i_2 != lambdaCtx->captured_variables.size(); i_2++) {
    std::string cname = lambdaCtx->captured_variables.at(i_2);
    wr->out(std::string("// captured var ") + cname, true);
  }
  wr->indent(-1);
  wr->out(std::string("}"), true);
}

void  RangerPHPClassWriter::writeClassVarDef( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr ) {
  if ( node->hasParamDesc ) {
    std::shared_ptr<CodeNode> nn = node->children.at(1);
    std::shared_ptr<RangerAppParamDesc> p = nn->paramDesc;
    wr->out((std::string("var $") + p->compiledName) + std::string(";"), true);
  }
}

void  RangerPHPClassWriter::writeArgsDef( std::shared_ptr<RangerAppFunctionDesc> fnDesc , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr ) {
  for ( std::vector< std::shared_ptr<RangerAppParamDesc>>::size_type i = 0; i != fnDesc->params.size(); i++) {
    std::shared_ptr<RangerAppParamDesc> arg = fnDesc->params.at(i);
    if ( i > 0 ) {
      wr->out(std::string(","), false);
    }
    wr->out((std::string(" $") + arg->name) + std::string(" "), false);
  }
}

void  RangerPHPClassWriter::writeFnCall( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr ) {
  if ( node->hasFnCall ) {
    std::shared_ptr<CodeNode> fc = node->getFirst();
    this->WriteVRef(fc, ctx, wr);
    wr->out(std::string("("), false);
    std::shared_ptr<CodeNode> givenArgs = node->getSecond();
    ctx->setInExpr();
    for ( std::vector< std::shared_ptr<RangerAppParamDesc>>::size_type i = 0; i != node->fnDesc->params.size(); i++) {
      std::shared_ptr<RangerAppParamDesc> arg = node->fnDesc->params.at(i);
      if ( i > 0 ) {
        wr->out(std::string(", "), false);
      }
      if ( (givenArgs->children.size()) <= i ) {
        std::shared_ptr<CodeNode> defVal = arg->nameNode->getFlag(std::string("default"));
        if ( defVal != NULL  ) {
          std::shared_ptr<CodeNode> fc_1 = defVal->vref_annotation->getFirst();
          this->WalkNode(fc_1, ctx, wr);
        } else {
          ctx->addError(node, std::string("Default argument was missing"));
        }
        continue;
      }
      std::shared_ptr<CodeNode> n = givenArgs->children.at(i);
      this->WalkNode(n, ctx, wr);
    }
    ctx->unsetInExpr();
    wr->out(std::string(")"), false);
    if ( ctx->expressionLevel() == 0 ) {
      wr->out(std::string(";"), true);
    }
  }
}

void  RangerPHPClassWriter::writeNewCall( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr ) {
  if ( node->hasNewOper ) {
    std::shared_ptr<RangerAppClassDesc> cl = node->clDesc;
    /** unused:  std::shared_ptr<CodeNode> fc = node->getSecond()   **/ ;
    wr->out(std::string(" new "), false);
    wr->out(node->clDesc->name, false);
    wr->out(std::string("("), false);
    std::shared_ptr<RangerAppFunctionDesc> constr = cl->constructor_fn;
    std::shared_ptr<CodeNode> givenArgs = node->getThird();
    if ( constr != NULL  ) {
      for ( std::vector< std::shared_ptr<RangerAppParamDesc>>::size_type i = 0; i != constr->params.size(); i++) {
        std::shared_ptr<RangerAppParamDesc> arg = constr->params.at(i);
        std::shared_ptr<CodeNode> n = givenArgs->children.at(i);
        if ( i > 0 ) {
          wr->out(std::string(", "), false);
        }
        if ( true || (arg->nameNode != NULL ) ) {
          this->WalkNode(n, ctx, wr);
        }
      }
    }
    wr->out(std::string(")"), false);
  }
}

void  RangerPHPClassWriter::writeClass( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> orig_wr ) {
  std::shared_ptr<RangerAppClassDesc> cl = node->clDesc;
  if ( cl == NULL ) {
    return;
  }
  std::shared_ptr<CodeWriter> wr = orig_wr;
  /** unused:  std::shared_ptr<CodeWriter> importFork = wr->fork()   **/ ;
  for ( std::vector< std::shared_ptr<RangerAppParamDesc>>::size_type i = 0; i != cl->capturedLocals.size(); i++) {
    std::shared_ptr<RangerAppParamDesc> dd = cl->capturedLocals.at(i);
    if ( dd->is_class_variable == false ) {
      wr->out(std::string("// local captured ") + dd->name, true);
      dd->node->disabled_node = true;
      cl->addVariable(dd);
      std::shared_ptr<RangerAppWriterContext> csubCtx = cl->ctx;
      csubCtx->defineVariable(dd->name, dd);
      dd->is_class_variable = true;
    }
  }
  if ( wrote_header == false ) {
    wr->out(std::string("<? "), true);
    wr->out(std::string(""), true);
    wrote_header = true;
  }
  wr->out(std::string("class ") + cl->name, false);
  std::shared_ptr<RangerAppClassDesc> parentClass;
  if ( (cl->extends_classes.size()) > 0 ) {
    wr->out(std::string(" extends "), false);
    for ( std::vector< std::string>::size_type i_1 = 0; i_1 != cl->extends_classes.size(); i_1++) {
      std::string pName = cl->extends_classes.at(i_1);
      wr->out(pName, false);
      parentClass  = ctx->findClass(pName);
    }
  }
  wr->out(std::string(" { "), true);
  wr->indent(1);
  for ( std::vector< std::shared_ptr<RangerAppParamDesc>>::size_type i_2 = 0; i_2 != cl->variables.size(); i_2++) {
    std::shared_ptr<RangerAppParamDesc> pvar = cl->variables.at(i_2);
    this->writeClassVarDef(pvar->node, ctx, wr);
  }
  wr->out(std::string(""), true);
  wr->out(std::string("function __construct("), false);
  if ( cl->has_constructor ) {
    std::shared_ptr<RangerAppFunctionDesc> constr = cl->constructor_fn;
    this->writeArgsDef(constr, ctx, wr);
  }
  wr->out(std::string(" ) {"), true);
  wr->indent(1);
  if ( parentClass != NULL ) {
    wr->out(std::string("parent::__construct();"), true);
  }
  for ( std::vector< std::shared_ptr<RangerAppParamDesc>>::size_type i_3 = 0; i_3 != cl->variables.size(); i_3++) {
    std::shared_ptr<RangerAppParamDesc> pvar_1 = cl->variables.at(i_3);
    this->writeVarInitDef(pvar_1->node, ctx, wr);
  }
  if ( cl->has_constructor ) {
    std::shared_ptr<RangerAppFunctionDesc> constr_1 = cl->constructor_fn;
    wr->newline();
    std::shared_ptr<RangerAppWriterContext> subCtx = constr_1->fnCtx;
    subCtx->is_function = true;
    this->WalkNode(constr_1->fnBody, subCtx, wr);
  }
  wr->newline();
  wr->indent(-1);
  wr->out(std::string("}"), true);
  for ( std::vector< std::shared_ptr<RangerAppFunctionDesc>>::size_type i_4 = 0; i_4 != cl->static_methods.size(); i_4++) {
    std::shared_ptr<RangerAppFunctionDesc> variant = cl->static_methods.at(i_4);
    wr->out(std::string(""), true);
    if ( variant->nameNode->hasFlag(std::string("main")) ) {
      continue;
    } else {
      wr->out(std::string("public static function "), false);
      wr->out(variant->compiledName + std::string("("), false);
      this->writeArgsDef(variant, ctx, wr);
      wr->out(std::string(") {"), true);
    }
    wr->indent(1);
    wr->newline();
    std::shared_ptr<RangerAppWriterContext> subCtx_1 = variant->fnCtx;
    subCtx_1->is_function = true;
    subCtx_1->in_static_method = true;
    this->WalkNode(variant->fnBody, subCtx_1, wr);
    wr->newline();
    wr->indent(-1);
    wr->out(std::string("}"), true);
  }
  for ( std::vector< std::string>::size_type i_5 = 0; i_5 != cl->defined_variants.size(); i_5++) {
    std::string fnVar = cl->defined_variants.at(i_5);
    std::shared_ptr<RangerAppMethodVariants> mVs = cl->method_variants[fnVar];
    for ( std::vector< std::shared_ptr<RangerAppFunctionDesc>>::size_type i_6 = 0; i_6 != mVs->variants.size(); i_6++) {
      std::shared_ptr<RangerAppFunctionDesc> variant_1 = mVs->variants.at(i_6);
      wr->out(std::string(""), true);
      wr->out((std::string("function ") + variant_1->compiledName) + std::string("("), false);
      this->writeArgsDef(variant_1, ctx, wr);
      wr->out(std::string(") {"), true);
      wr->indent(1);
      wr->newline();
      std::shared_ptr<RangerAppWriterContext> subCtx_2 = variant_1->fnCtx;
      subCtx_2->is_function = true;
      this->WalkNode(variant_1->fnBody, subCtx_2, wr);
      wr->newline();
      wr->indent(-1);
      wr->out(std::string("}"), true);
    }
  }
  wr->indent(-1);
  wr->out(std::string("}"), true);
  for ( std::vector< std::shared_ptr<RangerAppFunctionDesc>>::size_type i_7 = 0; i_7 != cl->static_methods.size(); i_7++) {
    std::shared_ptr<RangerAppFunctionDesc> variant_2 = cl->static_methods.at(i_7);
    ctx->disableCurrentClass();
    ctx->in_static_method = true;
    wr->out(std::string(""), true);
    if ( variant_2->nameNode->hasFlag(std::string("main")) && (variant_2->nameNode->code->filename == ctx->getRootFile()) ) {
      wr->out(std::string("/* static PHP main routine */"), false);
      wr->newline();
      this->WalkNode(variant_2->fnBody, ctx, wr);
      wr->newline();
    }
  }
}

RangerJavaScriptClassWriter::RangerJavaScriptClassWriter( ) {
  this->thisName = std::string("this");
  this->wrote_header = false;
}

std::string  RangerJavaScriptClassWriter::adjustType( std::string tn ) {
  if ( tn == std::string("this") ) {
    return std::string("this");
  }
  return tn;
}

void  RangerJavaScriptClassWriter::WriteVRef( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr ) {
  if ( node->eval_type == 11 ) {
    if ( (node->ns.size()) > 1 ) {
      std::string rootObjName = node->ns.at(0);
      std::string enumName = node->ns.at(1);
      std::shared_ptr<RangerAppEnum> e = ctx->getEnum(rootObjName);
      if ( e != NULL  ) {
        wr->out(std::string("") + std::to_string(((cpp_get_map_int_value<std::string>(e->values, enumName)).value)), false);
        return;
      }
    }
  }
  if ( (node->nsp.size()) > 0 ) {
    for ( std::vector< std::shared_ptr<RangerAppParamDesc>>::size_type i = 0; i != node->nsp.size(); i++) {
      std::shared_ptr<RangerAppParamDesc> p = node->nsp.at(i);
      if ( i > 0 ) {
        wr->out(std::string("."), false);
      }
      if ( i == 0 ) {
        std::string part = node->ns.at(0);
        if ( (part != std::string("this")) && ctx->isMemberVariable(part) ) {
          std::shared_ptr<RangerAppClassDesc> uc = ctx->getCurrentClass();
          std::shared_ptr<RangerAppClassDesc> currC = uc;
          std::shared_ptr<RangerAppParamDesc> up = currC->findVariable(part);
          if ( up != NULL  ) {
            wr->out(std::string("this."), false);
          }
        }
        if ( part == std::string("this") ) {
          wr->out(std::string("this"), false);
          continue;
        }
      }
      if ( (p->compiledName.length()) > 0 ) {
        wr->out(this->adjustType(p->compiledName), false);
      } else {
        if ( (p->name.length()) > 0 ) {
          wr->out(this->adjustType(p->name), false);
        } else {
          wr->out(this->adjustType((node->ns.at(i))), false);
        }
      }
    }
    return;
  }
  if ( node->hasParamDesc ) {
    std::string part_1 = node->ns.at(0);
    if ( (part_1 != std::string("this")) && ctx->isMemberVariable(part_1) ) {
      std::shared_ptr<RangerAppClassDesc> uc_1 = ctx->getCurrentClass();
      std::shared_ptr<RangerAppClassDesc> currC_1 = uc_1;
      std::shared_ptr<RangerAppParamDesc> up_1 = currC_1->findVariable(part_1);
      if ( up_1 != NULL  ) {
        wr->out(std::string("this."), false);
      }
    }
    std::shared_ptr<RangerAppParamDesc> p_1 = node->paramDesc;
    wr->out(p_1->compiledName, false);
    return;
  }
  bool b_was_static = false;
  for ( std::vector< std::string>::size_type i_1 = 0; i_1 != node->ns.size(); i_1++) {
    std::string part_2 = node->ns.at(i_1);
    if ( i_1 > 0 ) {
      if ( (i_1 == 1) && b_was_static ) {
        wr->out(std::string("."), false);
      } else {
        wr->out(std::string("."), false);
      }
    }
    if ( i_1 == 0 ) {
      if ( ctx->hasClass(part_2) ) {
        b_was_static = true;
      } else {
        wr->out(std::string(""), false);
      }
      if ( (part_2 != std::string("this")) && ctx->isMemberVariable(part_2) ) {
        std::shared_ptr<RangerAppClassDesc> uc_2 = ctx->getCurrentClass();
        std::shared_ptr<RangerAppClassDesc> currC_2 = uc_2;
        std::shared_ptr<RangerAppParamDesc> up_2 = currC_2->findVariable(part_2);
        if ( up_2 != NULL  ) {
          wr->out(std::string("this."), false);
        }
      }
    }
    wr->out(this->adjustType(part_2), false);
  }
}

void  RangerJavaScriptClassWriter::writeVarInitDef( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr ) {
  if ( node->hasParamDesc ) {
    std::shared_ptr<CodeNode> nn = node->children.at(1);
    std::shared_ptr<RangerAppParamDesc> p = nn->paramDesc;
    bool remove_unused = ctx->hasCompilerFlag(std::string("remove-unused-class-vars"));
    if ( (p->ref_cnt == 0) && (remove_unused || (p->is_class_variable == false)) ) {
      return;
    }
    bool was_set = false;
    if ( (node->children.size()) > 2 ) {
      wr->out((std::string("this.") + p->compiledName) + std::string(" = "), false);
      ctx->setInExpr();
      std::shared_ptr<CodeNode> value = node->getThird();
      this->WalkNode(value, ctx, wr);
      ctx->unsetInExpr();
      was_set = true;
    } else {
      if ( nn->value_type == 6 ) {
        wr->out(std::string("this.") + p->compiledName, false);
        wr->out(std::string(" = []"), false);
        was_set = true;
      }
      if ( nn->value_type == 7 ) {
        wr->out(std::string("this.") + p->compiledName, false);
        wr->out(std::string(" = {}"), false);
        was_set = true;
      }
    }
    if ( was_set ) {
      wr->out(std::string(";"), false);
      if ( (p->ref_cnt == 0) && (p->is_class_variable == true) ) {
        wr->out(std::string("     /** note: unused */"), false);
      }
      wr->newline();
    }
  }
}

void  RangerJavaScriptClassWriter::writeVarDef( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr ) {
  if ( node->hasParamDesc ) {
    std::shared_ptr<CodeNode> nn = node->children.at(1);
    std::shared_ptr<RangerAppParamDesc> p = nn->paramDesc;
    /** unused:  bool opt_js = ctx->hasCompilerFlag(std::string("optimize-js"))   **/ ;
    if ( (p->ref_cnt == 0) && (p->is_class_variable == false) ) {
      wr->out(std::string("/** unused:  "), false);
    }
    bool has_value = false;
    if ( (node->children.size()) > 2 ) {
      has_value = true;
    }
    if ( ((p->set_cnt > 0) || p->is_class_variable) || (has_value == false) ) {
      wr->out(std::string("let ") + p->compiledName, false);
    } else {
      wr->out(std::string("const ") + p->compiledName, false);
    }
    if ( (node->children.size()) > 2 ) {
      wr->out(std::string(" = "), false);
      ctx->setInExpr();
      std::shared_ptr<CodeNode> value = node->getThird();
      this->WalkNode(value, ctx, wr);
      ctx->unsetInExpr();
    } else {
      if ( nn->value_type == 6 ) {
        wr->out(std::string(" = []"), false);
      }
      if ( nn->value_type == 7 ) {
        wr->out(std::string(" = {}"), false);
      }
    }
    if ( (p->ref_cnt == 0) && (p->is_class_variable == true) ) {
      wr->out(std::string("     /** note: unused */"), false);
    }
    if ( (p->ref_cnt == 0) && (p->is_class_variable == false) ) {
      wr->out(std::string("   **/ "), true);
    } else {
      wr->out(std::string(";"), false);
      wr->newline();
    }
  }
}

void  RangerJavaScriptClassWriter::writeClassVarDef( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr ) {
}

void  RangerJavaScriptClassWriter::writeArgsDef( std::shared_ptr<RangerAppFunctionDesc> fnDesc , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr ) {
  for ( std::vector< std::shared_ptr<RangerAppParamDesc>>::size_type i = 0; i != fnDesc->params.size(); i++) {
    std::shared_ptr<RangerAppParamDesc> arg = fnDesc->params.at(i);
    if ( i > 0 ) {
      wr->out(std::string(", "), false);
    }
    wr->out(arg->name, false);
  }
}

void  RangerJavaScriptClassWriter::writeClass( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> orig_wr ) {
  std::shared_ptr<RangerAppClassDesc> cl = node->clDesc;
  if ( cl->is_interface ) {
    orig_wr->out(std::string("// interface : ") + cl->name, true);
    return;
  }
  if ( cl == NULL ) {
    return;
  }
  std::shared_ptr<CodeWriter> wr = orig_wr;
  /** unused:  std::shared_ptr<CodeWriter> importFork = wr->fork()   **/ ;
  if ( wrote_header == false ) {
    wr->out(std::string(""), true);
    wrote_header = true;
  }
  bool b_extd = false;
  wr->out((std::string("class ") + cl->name) + std::string(" "), false);
  for ( std::vector< std::string>::size_type i = 0; i != cl->extends_classes.size(); i++) {
    std::string pName = cl->extends_classes.at(i);
    if ( i == 0 ) {
      wr->out(std::string(" extends "), false);
    }
    wr->out(pName, false);
    b_extd = true;
  }
  wr->out(std::string(" {"), true);
  wr->indent(1);
  for ( std::vector< std::shared_ptr<RangerAppParamDesc>>::size_type i_1 = 0; i_1 != cl->variables.size(); i_1++) {
    std::shared_ptr<RangerAppParamDesc> pvar = cl->variables.at(i_1);
    this->writeClassVarDef(pvar->node, ctx, wr);
  }
  wr->out(std::string("constructor("), false);
  if ( cl->has_constructor ) {
    std::shared_ptr<RangerAppFunctionDesc> constr = cl->constructor_fn;
    this->writeArgsDef(constr, ctx, wr);
  }
  wr->out(std::string(") {"), true);
  wr->indent(1);
  if ( b_extd ) {
    wr->out(std::string("super()"), true);
  }
  for ( std::vector< std::shared_ptr<RangerAppParamDesc>>::size_type i_2 = 0; i_2 != cl->variables.size(); i_2++) {
    std::shared_ptr<RangerAppParamDesc> pvar_1 = cl->variables.at(i_2);
    this->writeVarInitDef(pvar_1->node, ctx, wr);
  }
  if ( cl->has_constructor ) {
    std::shared_ptr<RangerAppFunctionDesc> constr_1 = cl->constructor_fn;
    wr->newline();
    std::shared_ptr<RangerAppWriterContext> subCtx = constr_1->fnCtx;
    subCtx->is_function = true;
    this->WalkNode(constr_1->fnBody, subCtx, wr);
  }
  wr->newline();
  wr->indent(-1);
  wr->out(std::string("}"), true);
  for ( std::vector< std::string>::size_type i_3 = 0; i_3 != cl->defined_variants.size(); i_3++) {
    std::string fnVar = cl->defined_variants.at(i_3);
    std::shared_ptr<RangerAppMethodVariants> mVs = cl->method_variants[fnVar];
    for ( std::vector< std::shared_ptr<RangerAppFunctionDesc>>::size_type i_4 = 0; i_4 != mVs->variants.size(); i_4++) {
      std::shared_ptr<RangerAppFunctionDesc> variant = mVs->variants.at(i_4);
      wr->out((std::string("") + variant->compiledName) + std::string(" ("), false);
      this->writeArgsDef(variant, ctx, wr);
      wr->out(std::string(") {"), true);
      wr->indent(1);
      wr->newline();
      std::shared_ptr<RangerAppWriterContext> subCtx_1 = variant->fnCtx;
      subCtx_1->is_function = true;
      this->WalkNode(variant->fnBody, subCtx_1, wr);
      wr->newline();
      wr->indent(-1);
      wr->out(std::string("}"), true);
    }
  }
  wr->indent(-1);
  wr->out(std::string("}"), true);
  for ( std::vector< std::shared_ptr<RangerAppFunctionDesc>>::size_type i_5 = 0; i_5 != cl->static_methods.size(); i_5++) {
    std::shared_ptr<RangerAppFunctionDesc> variant_1 = cl->static_methods.at(i_5);
    if ( variant_1->nameNode->hasFlag(std::string("main")) ) {
      continue;
    } else {
      wr->out(((cl->name + std::string(".")) + variant_1->compiledName) + std::string(" = function("), false);
      this->writeArgsDef(variant_1, ctx, wr);
      wr->out(std::string(") {"), true);
    }
    wr->indent(1);
    wr->newline();
    std::shared_ptr<RangerAppWriterContext> subCtx_2 = variant_1->fnCtx;
    subCtx_2->is_function = true;
    this->WalkNode(variant_1->fnBody, subCtx_2, wr);
    wr->newline();
    wr->indent(-1);
    wr->out(std::string("}"), true);
  }
  for ( std::vector< std::shared_ptr<RangerAppFunctionDesc>>::size_type i_6 = 0; i_6 != cl->static_methods.size(); i_6++) {
    std::shared_ptr<RangerAppFunctionDesc> variant_2 = cl->static_methods.at(i_6);
    ctx->disableCurrentClass();
    if ( variant_2->nameNode->hasFlag(std::string("main")) && (variant_2->nameNode->code->filename == ctx->getRootFile()) ) {
      wr->out(std::string("/* static JavaSript main routine */"), false);
      wr->newline();
      wr->out(std::string("function __js_main() {"), true);
      wr->indent(1);
      this->WalkNode(variant_2->fnBody, ctx, wr);
      wr->newline();
      wr->indent(-1);
      wr->out(std::string("}"), true);
      wr->out(std::string("__js_main();"), true);
    }
  }
}

RangerRangerClassWriter::RangerRangerClassWriter( ) {
}

std::string  RangerRangerClassWriter::adjustType( std::string tn ) {
  if ( tn == std::string("this") ) {
    return std::string("this");
  }
  return tn;
}

std::string  RangerRangerClassWriter::getObjectTypeString( std::string type_string , std::shared_ptr<RangerAppWriterContext> ctx ) {
  return type_string;
}

std::string  RangerRangerClassWriter::getTypeString( std::string type_string ) {
  return type_string;
}

void  RangerRangerClassWriter::writeTypeDef( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr ) {
  int v_type = node->value_type;
  std::string t_name = node->type_name;
  std::string a_name = node->array_type;
  std::string k_name = node->key_type;
  if ( ((v_type == 8) || (v_type == 9)) || (v_type == 0) ) {
    v_type = node->typeNameAsType(ctx);
  }
  if ( node->eval_type != 0 ) {
    v_type = node->eval_type;
    if ( (node->eval_type_name.length()) > 0 ) {
      t_name = node->eval_type_name;
    }
    if ( (node->eval_array_type.length()) > 0 ) {
      a_name = node->eval_array_type;
    }
    if ( (node->eval_key_type.length()) > 0 ) {
      k_name = node->eval_key_type;
    }
  }
  if ( v_type == 7 ) {
    wr->out((((std::string("[") + k_name) + std::string(":")) + a_name) + std::string("]"), false);
    return;
  }
  if ( v_type == 6 ) {
    wr->out((std::string("[") + a_name) + std::string("]"), false);
    return;
  }
  wr->out(t_name, false);
}

void  RangerRangerClassWriter::WriteVRef( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr ) {
  wr->out(node->vref, false);
}

void  RangerRangerClassWriter::WriteVRefWithOpt( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr ) {
  wr->out(node->vref, false);
  std::vector<std::string> flags = {std::string("optional"),std::string("weak"),std::string("strong"),std::string("temp"),std::string("lives"),std::string("returns"),std::string("returnvalue")};
  bool some_set = false;
  for ( std::vector< std::string>::size_type i = 0; i != flags.size(); i++) {
    std::string flag = flags.at(i);
    if ( node->hasFlag(flag) ) {
      if ( false == some_set ) {
        wr->out(std::string("@("), false);
        some_set = true;
      } else {
        wr->out(std::string(" "), false);
      }
      wr->out(flag, false);
    }
  }
  if ( some_set ) {
    wr->out(std::string(")"), false);
  }
}

void  RangerRangerClassWriter::writeVarDef( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr ) {
  if ( node->hasParamDesc ) {
    std::shared_ptr<CodeNode> nn = node->children.at(1);
    std::shared_ptr<RangerAppParamDesc> p = nn->paramDesc;
    wr->out(std::string("def "), false);
    this->WriteVRefWithOpt(nn, ctx, wr);
    wr->out(std::string(":"), false);
    this->writeTypeDef(p->nameNode, ctx, wr);
    if ( (node->children.size()) > 2 ) {
      wr->out(std::string(" "), false);
      ctx->setInExpr();
      std::shared_ptr<CodeNode> value = node->getThird();
      this->WalkNode(value, ctx, wr);
      ctx->unsetInExpr();
    }
    wr->newline();
  }
}

void  RangerRangerClassWriter::writeFnCall( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr ) {
  if ( node->hasFnCall ) {
    if ( ctx->expressionLevel() > 0 ) {
      wr->out(std::string("("), false);
    }
    std::shared_ptr<CodeNode> fc = node->getFirst();
    this->WriteVRef(fc, ctx, wr);
    wr->out(std::string("("), false);
    std::shared_ptr<CodeNode> givenArgs = node->getSecond();
    ctx->setInExpr();
    for ( std::vector< std::shared_ptr<RangerAppParamDesc>>::size_type i = 0; i != node->fnDesc->params.size(); i++) {
      std::shared_ptr<RangerAppParamDesc> arg = node->fnDesc->params.at(i);
      if ( i > 0 ) {
        wr->out(std::string(", "), false);
      }
      if ( (givenArgs->children.size()) <= i ) {
        std::shared_ptr<CodeNode> defVal = arg->nameNode->getFlag(std::string("default"));
        if ( defVal != NULL  ) {
          std::shared_ptr<CodeNode> fc_1 = defVal->vref_annotation->getFirst();
          this->WalkNode(fc_1, ctx, wr);
        } else {
          ctx->addError(node, std::string("Default argument was missing"));
        }
        continue;
      }
      std::shared_ptr<CodeNode> n = givenArgs->children.at(i);
      this->WalkNode(n, ctx, wr);
    }
    ctx->unsetInExpr();
    wr->out(std::string(")"), false);
    if ( ctx->expressionLevel() > 0 ) {
      wr->out(std::string(")"), false);
    }
    if ( ctx->expressionLevel() == 0 ) {
      wr->newline();
    }
  }
}

void  RangerRangerClassWriter::writeNewCall( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr ) {
  if ( node->hasNewOper ) {
    std::shared_ptr<RangerAppClassDesc> cl = node->clDesc;
    /** unused:  std::shared_ptr<CodeNode> fc = node->getSecond()   **/ ;
    wr->out(std::string("(new ") + node->clDesc->name, false);
    wr->out(std::string("("), false);
    std::shared_ptr<RangerAppFunctionDesc> constr = cl->constructor_fn;
    std::shared_ptr<CodeNode> givenArgs = node->getThird();
    if ( constr != NULL  ) {
      for ( std::vector< std::shared_ptr<RangerAppParamDesc>>::size_type i = 0; i != constr->params.size(); i++) {
        std::shared_ptr<RangerAppParamDesc> arg = constr->params.at(i);
        std::shared_ptr<CodeNode> n = givenArgs->children.at(i);
        if ( i > 0 ) {
          wr->out(std::string(" "), false);
        }
        if ( true || (arg->nameNode != NULL ) ) {
          this->WalkNode(n, ctx, wr);
        }
      }
    }
    wr->out(std::string("))"), false);
  }
}

void  RangerRangerClassWriter::writeArgsDef( std::shared_ptr<RangerAppFunctionDesc> fnDesc , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr ) {
  for ( std::vector< std::shared_ptr<RangerAppParamDesc>>::size_type i = 0; i != fnDesc->params.size(); i++) {
    std::shared_ptr<RangerAppParamDesc> arg = fnDesc->params.at(i);
    if ( i > 0 ) {
      wr->out(std::string(","), false);
    }
    wr->out(std::string(" "), false);
    this->WriteVRefWithOpt(arg->nameNode, ctx, wr);
    wr->out(std::string(":"), false);
    this->writeTypeDef(arg->nameNode, ctx, wr);
  }
}

void  RangerRangerClassWriter::writeClass( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> orig_wr ) {
  std::shared_ptr<RangerAppClassDesc> cl = node->clDesc;
  if ( cl == NULL ) {
    return;
  }
  std::shared_ptr<CodeWriter> wr = orig_wr;
  std::shared_ptr<CodeWriter> importFork = wr->fork();
  wr->out(std::string(""), true);
  wr->out(std::string("class ") + cl->name, false);
  std::shared_ptr<RangerAppClassDesc> parentClass;
  wr->out(std::string(" { "), true);
  wr->indent(1);
  if ( (cl->extends_classes.size()) > 0 ) {
    wr->out(std::string("Extends("), false);
    for ( std::vector< std::string>::size_type i = 0; i != cl->extends_classes.size(); i++) {
      std::string pName = cl->extends_classes.at(i);
      wr->out(pName, false);
      parentClass  = ctx->findClass(pName);
    }
    wr->out(std::string(")"), true);
  }
  wr->createTag(std::string("utilities"));
  for ( std::vector< std::shared_ptr<RangerAppParamDesc>>::size_type i_1 = 0; i_1 != cl->variables.size(); i_1++) {
    std::shared_ptr<RangerAppParamDesc> pvar = cl->variables.at(i_1);
    this->writeVarDef(pvar->node, ctx, wr);
  }
  if ( cl->has_constructor ) {
    std::shared_ptr<RangerAppFunctionDesc> constr = cl->constructor_fn;
    wr->out(std::string(""), true);
    wr->out(std::string("Constructor ("), false);
    this->writeArgsDef(constr, ctx, wr);
    wr->out(std::string(" ) {"), true);
    wr->indent(1);
    wr->newline();
    std::shared_ptr<RangerAppWriterContext> subCtx = constr->fnCtx;
    subCtx->is_function = true;
    this->WalkNode(constr->fnBody, subCtx, wr);
    wr->newline();
    wr->indent(-1);
    wr->out(std::string("}"), true);
  }
  for ( std::vector< std::shared_ptr<RangerAppFunctionDesc>>::size_type i_2 = 0; i_2 != cl->static_methods.size(); i_2++) {
    std::shared_ptr<RangerAppFunctionDesc> variant = cl->static_methods.at(i_2);
    wr->out(std::string(""), true);
    if ( variant->nameNode->hasFlag(std::string("main")) ) {
      wr->out(std::string("sfn m@(main):void () {"), true);
    } else {
      wr->out(std::string("sfn "), false);
      this->WriteVRefWithOpt(variant->nameNode, ctx, wr);
      wr->out(std::string(":"), false);
      this->writeTypeDef(variant->nameNode, ctx, wr);
      wr->out(std::string(" ("), false);
      this->writeArgsDef(variant, ctx, wr);
      wr->out(std::string(") {"), true);
    }
    wr->indent(1);
    wr->newline();
    std::shared_ptr<RangerAppWriterContext> subCtx_1 = variant->fnCtx;
    subCtx_1->is_function = true;
    this->WalkNode(variant->fnBody, subCtx_1, wr);
    wr->newline();
    wr->indent(-1);
    wr->out(std::string("}"), true);
  }
  for ( std::vector< std::string>::size_type i_3 = 0; i_3 != cl->defined_variants.size(); i_3++) {
    std::string fnVar = cl->defined_variants.at(i_3);
    std::shared_ptr<RangerAppMethodVariants> mVs = cl->method_variants[fnVar];
    for ( std::vector< std::shared_ptr<RangerAppFunctionDesc>>::size_type i_4 = 0; i_4 != mVs->variants.size(); i_4++) {
      std::shared_ptr<RangerAppFunctionDesc> variant_1 = mVs->variants.at(i_4);
      wr->out(std::string(""), true);
      wr->out(std::string("fn "), false);
      this->WriteVRefWithOpt(variant_1->nameNode, ctx, wr);
      wr->out(std::string(":"), false);
      this->writeTypeDef(variant_1->nameNode, ctx, wr);
      wr->out(std::string(" "), false);
      wr->out(std::string("("), false);
      this->writeArgsDef(variant_1, ctx, wr);
      wr->out(std::string(") {"), true);
      wr->indent(1);
      wr->newline();
      std::shared_ptr<RangerAppWriterContext> subCtx_2 = variant_1->fnCtx;
      subCtx_2->is_function = true;
      this->WalkNode(variant_1->fnBody, subCtx_2, wr);
      wr->newline();
      wr->indent(-1);
      wr->out(std::string("}"), true);
    }
  }
  wr->indent(-1);
  wr->out(std::string("}"), true);
  std::vector<std::string> import_list = wr->getImports();
  for ( std::vector< std::string>::size_type i_5 = 0; i_5 != import_list.size(); i_5++) {
    std::string codeStr = import_list.at(i_5);
    importFork->out((std::string("Import \"") + codeStr) + std::string("\""), true);
  }
}

LiveCompiler::LiveCompiler( ) {
  this->repeat_index = 0;
}

void  LiveCompiler::initWriter( std::shared_ptr<RangerAppWriterContext> ctx ) {
  if ( langWriter != NULL  ) {
    return;
  }
  std::shared_ptr<RangerAppWriterContext> root = ctx->getRoot();
  bool caseMatched = false;
  if( root->targetLangName == std::string("go")) {
    caseMatched = true;
    langWriter  =  std::make_shared<RangerGolangClassWriter>();
  }
  if( root->targetLangName == std::string("scala")) {
    caseMatched = true;
    langWriter  =  std::make_shared<RangerScalaClassWriter>();
  }
  if( root->targetLangName == std::string("java7")) {
    caseMatched = true;
    langWriter  =  std::make_shared<RangerJava7ClassWriter>();
  }
  if( root->targetLangName == std::string("swift3")) {
    caseMatched = true;
    langWriter  =  std::make_shared<RangerSwift3ClassWriter>();
  }
  if( root->targetLangName == std::string("kotlin")) {
    caseMatched = true;
    langWriter  =  std::make_shared<RangerKotlinClassWriter>();
  }
  if( root->targetLangName == std::string("php")) {
    caseMatched = true;
    langWriter  =  std::make_shared<RangerPHPClassWriter>();
  }
  if( root->targetLangName == std::string("cpp")) {
    caseMatched = true;
    langWriter  =  std::make_shared<RangerCppClassWriter>();
  }
  if( root->targetLangName == std::string("csharp")) {
    caseMatched = true;
    langWriter  =  std::make_shared<RangerCSharpClassWriter>();
  }
  if( root->targetLangName == std::string("es6")) {
    caseMatched = true;
    langWriter  =  std::make_shared<RangerJavaScriptClassWriter>();
  }
  if( root->targetLangName == std::string("ranger")) {
    caseMatched = true;
    langWriter  =  std::make_shared<RangerRangerClassWriter>();
  }
  if ( langWriter != NULL  ) {
    langWriter->compiler  = shared_from_this();
  } else {
    langWriter  =  std::make_shared<RangerGenericClassWriter>();
    langWriter->compiler  = shared_from_this();
  }
}

std::string  LiveCompiler::EncodeString( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr ) {
  /** unused:  std::string encoded_str = std::string("")   **/ ;
  int str_length = node->string_value.length();
  std::string encoded_str_2 = std::string("");
  int ii = 0;
  while (ii < str_length) {
    int ch = node->string_value.at(ii);
    int cc = ch;
    switch (cc ) { 
      case 8 : 
        {
          encoded_str_2 = (encoded_str_2 + (std::string(1, char(92)))) + (std::string(1, char(98)));
          break;
        }
      case 9 : 
        {
          encoded_str_2 = (encoded_str_2 + (std::string(1, char(92)))) + (std::string(1, char(116)));
          break;
        }
      case 10 : 
        {
          encoded_str_2 = (encoded_str_2 + (std::string(1, char(92)))) + (std::string(1, char(110)));
          break;
        }
      case 12 : 
        {
          encoded_str_2 = (encoded_str_2 + (std::string(1, char(92)))) + (std::string(1, char(102)));
          break;
        }
      case 13 : 
        {
          encoded_str_2 = (encoded_str_2 + (std::string(1, char(92)))) + (std::string(1, char(114)));
          break;
        }
      case 34 : 
        {
          encoded_str_2 = (encoded_str_2 + (std::string(1, char(92)))) + (std::string(1, char(34)));
          break;
        }
      case 92 : 
        {
          encoded_str_2 = (encoded_str_2 + (std::string(1, char(92)))) + (std::string(1, char(92)));
          break;
        }
      default: 
        encoded_str_2 = encoded_str_2 + (std::string(1, char(ch)));
        break;
    }
    ii = ii + 1;
  }
  return encoded_str_2;
}

void  LiveCompiler::WriteScalarValue( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr ) {
  langWriter->WriteScalarValue(node, ctx, wr);
}

std::string  LiveCompiler::adjustType( std::string tn ) {
  if ( tn == std::string("this") ) {
    return std::string("self");
  }
  return tn;
}

void  LiveCompiler::WriteVRef( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr ) {
  langWriter->WriteVRef(node, ctx, wr);
}

void  LiveCompiler::writeTypeDef( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr ) {
  langWriter->writeTypeDef(node, ctx, wr);
}

void  LiveCompiler::CreateLambdaCall( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr ) {
  langWriter->CreateLambdaCall(node, ctx, wr);
}

void  LiveCompiler::CreateLambda( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr ) {
  langWriter->CreateLambda(node, ctx, wr);
}

std::string  LiveCompiler::getTypeString( std::string str , std::shared_ptr<RangerAppWriterContext> ctx ) {
  return std::string("");
}

void  LiveCompiler::findOpCode( std::shared_ptr<CodeNode> op , std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr ) {
  std::shared_ptr<CodeNode> fnName = op->children.at(1);
  std::shared_ptr<CodeNode> args = op->children.at(2);
  if ( (op->children.size()) > 3 ) {
    std::shared_ptr<CodeNode> details = op->children.at(3);
    for ( std::vector< std::shared_ptr<CodeNode>>::size_type i = 0; i != details->children.size(); i++) {
      std::shared_ptr<CodeNode> det = details->children.at(i);
      if ( (det->children.size()) > 0 ) {
        std::shared_ptr<CodeNode> fc = det->children.at(0);
        if ( fc->vref == std::string("code") ) {
          std::shared_ptr<RangerArgMatch> match =  std::make_shared<RangerArgMatch>();
          bool all_matched = match->matchArguments(args, node, ctx, 1);
          if ( all_matched == false ) {
            return;
          }
          std::shared_ptr<CodeNode> origCode = det->children.at(1);
          std::shared_ptr<CodeNode> theCode = origCode->rebuildWithType(match, true);
          std::shared_ptr<RangerAppWriterContext> appCtx = ctx->getRoot();
          std::string stdFnName = appCtx->createSignature(fnName->vref, (fnName->vref + theCode->getCode()));
          std::shared_ptr<RangerAppClassDesc> stdClass = ctx->findClass(std::string("RangerStaticMethods"));
          std::shared_ptr<RangerAppWriterContext> runCtx = appCtx->fork();
          bool b_failed = false;
          if ( false == (stdClass->defined_static_methods.count(stdFnName)) ) {
            runCtx->setInMethod();
            std::shared_ptr<RangerAppFunctionDesc> m =  std::make_shared<RangerAppFunctionDesc>();
            m->name = stdFnName;
            m->node  = op;
            m->is_static = true;
            m->nameNode  = fnName;
            m->fnBody  = theCode;
            for ( std::vector< std::shared_ptr<CodeNode>>::size_type ii = 0; ii != args->children.size(); ii++) {
              std::shared_ptr<CodeNode> arg = args->children.at(ii);
              std::shared_ptr<RangerAppParamDesc> p =  std::make_shared<RangerAppParamDesc>();
              p->name = arg->vref;
              p->value_type = arg->value_type;
              p->node  = arg;
              p->nameNode  = arg;
              p->refType = 1;
              p->varType = 4;
              m->params.push_back( p  );
              arg->hasParamDesc = true;
              arg->paramDesc  = p;
              arg->eval_type = arg->value_type;
              arg->eval_type_name = arg->type_name;
              runCtx->defineVariable(p->name, p);
            }
            stdClass->addStaticMethod(m);
            int err_cnt = ctx->compilerErrors.size();
            std::shared_ptr<RangerFlowParser> flowParser =  std::make_shared<RangerFlowParser>();
            std::shared_ptr<CodeWriter> TmpWr =  std::make_shared<CodeWriter>();
            flowParser->WalkNode(theCode, runCtx, TmpWr);
            runCtx->unsetInMethod();
            int err_delta = (ctx->compilerErrors.size()) - err_cnt;
            if ( err_delta > 0 ) {
              b_failed = true;
              std::cout << std::string("Had following compiler errors:") << std::endl;
              for ( std::vector< std::shared_ptr<RangerCompilerMessage>>::size_type i_1 = 0; i_1 != ctx->compilerErrors.size(); i_1++) {
                std::shared_ptr<RangerCompilerMessage> e = ctx->compilerErrors.at(i_1);
                if ( i_1 < err_cnt ) {
                  continue;
                }
                int line_index = e->node->getLine();
                std::cout << (e->node->getFilename() + std::string(" Line: ")) + std::to_string(line_index) << std::endl;
                std::cout << e->description << std::endl;
                std::cout << e->node->getLineString(line_index) << std::endl;
              }
            } else {
              std::cout << std::string("no errors found") << std::endl;
            }
          }
          if ( b_failed ) {
            wr->out(std::string("/* custom operator compilation failed */ "), false);
          } else {
            wr->out((std::string("RangerStaticMethods.") + stdFnName) + std::string("("), false);
            for ( std::vector< std::shared_ptr<CodeNode>>::size_type i_2 = 0; i_2 != node->children.size(); i_2++) {
              std::shared_ptr<CodeNode> cc = node->children.at(i_2);
              if ( i_2 == 0 ) {
                continue;
              }
              if ( i_2 > 1 ) {
                wr->out(std::string(", "), false);
              }
              this->WalkNode(cc, ctx, wr);
            }
            wr->out(std::string(")"), false);
          }
          return;
        }
      }
    }
  }
}

std::shared_ptr<CodeNode>  LiveCompiler::findOpTemplate( std::shared_ptr<CodeNode> op , std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr ) {
  /** unused:  std::shared_ptr<CodeNode> fnName = op->children.at(1)   **/ ;
  /** unused:  std::shared_ptr<RangerAppWriterContext> root = ctx->getRoot()   **/ ;
  std::string langName = ctx->getTargetLang();
  if ( (op->children.size()) > 3 ) {
    std::shared_ptr<CodeNode> details = op->children.at(3);
    for ( std::vector< std::shared_ptr<CodeNode>>::size_type i = 0; i != details->children.size(); i++) {
      std::shared_ptr<CodeNode> det = details->children.at(i);
      if ( (det->children.size()) > 0 ) {
        std::shared_ptr<CodeNode> fc = det->children.at(0);
        if ( fc->vref == std::string("templates") ) {
          std::shared_ptr<CodeNode> tplList = det->children.at(1);
          for ( std::vector< std::shared_ptr<CodeNode>>::size_type i_1 = 0; i_1 != tplList->children.size(); i_1++) {
            std::shared_ptr<CodeNode> tpl = tplList->children.at(i_1);
            std::shared_ptr<CodeNode> tplName = tpl->getFirst();
            std::shared_ptr<CodeNode> tplImpl;
            tplImpl  = tpl->getSecond();
            if ( (tplName->vref != std::string("*")) && (tplName->vref != langName) ) {
              continue;
            }
            if ( tplName->hasFlag(std::string("mutable")) ) {
              if ( false == node->hasFlag(std::string("mutable")) ) {
                continue;
              }
            }
            return tplImpl;
          }
        }
      }
    }
  }
  std::shared_ptr<CodeNode> non;
  return non;
}

bool  LiveCompiler::localCall( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr ) {
  if ( node->hasFnCall ) {
    if ( langWriter != NULL  ) {
      langWriter->writeFnCall(node, ctx, wr);
      return true;
    }
  }
  if ( node->hasNewOper ) {
    langWriter->writeNewCall(node, ctx, wr);
    return true;
  }
  if ( node->hasVarDef ) {
    if ( node->disabled_node ) {
      langWriter->disabledVarDef(node, ctx, wr);
    } else {
      langWriter->writeVarDef(node, ctx, wr);
    }
    return true;
  }
  if ( node->hasClassDescription ) {
    langWriter->writeClass(node, ctx, wr);
    return true;
  }
  return false;
}

void  LiveCompiler::WalkNode( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr ) {
  this->initWriter(ctx);
  if ( node->isPrimitive() ) {
    this->WriteScalarValue(node, ctx, wr);
    return;
  }
  this->lastProcessedNode  = node;
  if ( node->value_type == 9 ) {
    this->WriteVRef(node, ctx, wr);
    return;
  }
  if ( node->value_type == 16 ) {
    this->WriteVRef(node, ctx, wr);
    return;
  }
  if ( (node->children.size()) > 0 ) {
    if ( node->has_operator ) {
      std::shared_ptr<CodeNode> op = ctx->findOperator(node);
      /** unused:  std::shared_ptr<CodeNode> fc = op->getFirst()   **/ ;
      std::shared_ptr<CodeNode> tplImpl = this->findOpTemplate(op, node, ctx, wr);
      std::shared_ptr<RangerAppWriterContext> evalCtx = ctx;
      if ( node->evalCtx != NULL  ) {
        evalCtx = node->evalCtx;
      }
      if ( tplImpl != NULL  ) {
        std::shared_ptr<CodeNode> opName = op->getSecond();
        if ( opName->hasFlag(std::string("returns")) ) {
          langWriter->release_local_vars(node, evalCtx, wr);
        }
        this->walkCommandList(tplImpl, node, evalCtx, wr);
      } else {
        this->findOpCode(op, node, evalCtx, wr);
      }
      return;
    }
    if ( node->has_lambda ) {
      this->CreateLambda(node, ctx, wr);
      return;
    }
    if ( node->has_lambda_call ) {
      this->CreateLambdaCall(node, ctx, wr);
      return;
    }
    if ( (node->children.size()) > 1 ) {
      if ( this->localCall(node, ctx, wr) ) {
        return;
      }
    }
    /** unused:  std::shared_ptr<CodeNode> fc_1 = node->getFirst()   **/ ;
  }
  if ( node->expression ) {
    for ( std::vector< std::shared_ptr<CodeNode>>::size_type i = 0; i != node->children.size(); i++) {
      std::shared_ptr<CodeNode> item = node->children.at(i);
      if ( (node->didReturnAtIndex >= 0) && (node->didReturnAtIndex < i) ) {
        break;
      }
      this->WalkNode(item, ctx, wr);
    }
  } else {
  }
}

void  LiveCompiler::walkCommandList( std::shared_ptr<CodeNode> cmd , std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr ) {
  if ( ctx->expressionLevel() == 0 ) {
    wr->newline();
  }
  if ( ctx->expressionLevel() > 1 ) {
    wr->out(std::string("("), false);
  }
  for ( std::vector< std::shared_ptr<CodeNode>>::size_type i = 0; i != cmd->children.size(); i++) {
    std::shared_ptr<CodeNode> c = cmd->children.at(i);
    this->walkCommand(c, node, ctx, wr);
  }
  if ( ctx->expressionLevel() > 1 ) {
    wr->out(std::string(")"), false);
  }
  if ( ctx->expressionLevel() == 0 ) {
    wr->newline();
  }
}

void  LiveCompiler::walkCommand( std::shared_ptr<CodeNode> cmd , std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr ) {
  if ( cmd->expression ) {
    if ( (cmd->children.size()) < 2 ) {
      ctx->addError(node, std::string("Invalid command"));
      ctx->addError(cmd, std::string("Invalid command"));
      return;
    }
    std::shared_ptr<CodeNode> cmdE = cmd->getFirst();
    std::shared_ptr<CodeNode> cmdArg = cmd->getSecond();
    bool caseMatched = false;
    if( cmdE->vref == std::string("str")) {
      caseMatched = true;
      int idx = cmdArg->int_value;
      if ( (node->children.size()) > idx ) {
        std::shared_ptr<CodeNode> arg = node->children.at(idx);
        wr->out(arg->string_value, false);
      }
    }
    if( cmdE->vref == std::string("block")) {
      caseMatched = true;
      int idx_1 = cmdArg->int_value;
      if ( (node->children.size()) > idx_1 ) {
        std::shared_ptr<CodeNode> arg_1 = node->children.at(idx_1);
        this->WalkNode(arg_1, ctx, wr);
      }
    }
    if( cmdE->vref == std::string("varname")) {
      caseMatched = true;
      if ( ctx->isVarDefined(cmdArg->vref) ) {
        std::shared_ptr<RangerAppParamDesc> p = ctx->getVariableDef(cmdArg->vref);
        wr->out(p->compiledName, false);
      }
    }
    if( cmdE->vref == std::string("defvar")) {
      caseMatched = true;
      std::shared_ptr<RangerAppParamDesc> p_1 =  std::make_shared<RangerAppParamDesc>();
      p_1->name = cmdArg->vref;
      p_1->value_type = cmdArg->value_type;
      p_1->node  = cmdArg;
      p_1->nameNode  = cmdArg;
      p_1->is_optional = false;
      ctx->defineVariable(p_1->name, p_1);
    }
    if( cmdE->vref == std::string("cc")) {
      caseMatched = true;
      int idx_2 = cmdArg->int_value;
      if ( (node->children.size()) > idx_2 ) {
        std::shared_ptr<CodeNode> arg_2 = node->children.at(idx_2);
        char cc = arg_2->string_value.at(0);
        wr->out(std::string("") + std::to_string((cc)), false);
      }
    }
    if( cmdE->vref == std::string("java_case")) {
      caseMatched = true;
      int idx_3 = cmdArg->int_value;
      if ( (node->children.size()) > idx_3 ) {
        std::shared_ptr<CodeNode> arg_3 = node->children.at(idx_3);
        this->WalkNode(arg_3, ctx, wr);
        if ( arg_3->didReturnAtIndex < 0 ) {
          wr->newline();
          wr->out(std::string("break;"), true);
        }
      }
    }
    if( cmdE->vref == std::string("e")) {
      caseMatched = true;
      int idx_4 = cmdArg->int_value;
      if ( (node->children.size()) > idx_4 ) {
        std::shared_ptr<CodeNode> arg_4 = node->children.at(idx_4);
        ctx->setInExpr();
        this->WalkNode(arg_4, ctx, wr);
        ctx->unsetInExpr();
      }
    }
    if( cmdE->vref == std::string("goset")) {
      caseMatched = true;
      int idx_5 = cmdArg->int_value;
      if ( (node->children.size()) > idx_5 ) {
        std::shared_ptr<CodeNode> arg_5 = node->children.at(idx_5);
        ctx->setInExpr();
        langWriter->WriteSetterVRef(arg_5, ctx, wr);
        ctx->unsetInExpr();
      }
    }
    if( cmdE->vref == std::string("pe")) {
      caseMatched = true;
      int idx_6 = cmdArg->int_value;
      if ( (node->children.size()) > idx_6 ) {
        std::shared_ptr<CodeNode> arg_6 = node->children.at(idx_6);
        this->WalkNode(arg_6, ctx, wr);
      }
    }
    if( cmdE->vref == std::string("ptr")) {
      caseMatched = true;
      int idx_7 = cmdArg->int_value;
      if ( (node->children.size()) > idx_7 ) {
        std::shared_ptr<CodeNode> arg_7 = node->children.at(idx_7);
        if ( arg_7->hasParamDesc ) {
          if ( arg_7->paramDesc->nameNode->isAPrimitiveType() == false ) {
            wr->out(std::string("*"), false);
          }
        } else {
          if ( arg_7->isAPrimitiveType() == false ) {
            wr->out(std::string("*"), false);
          }
        }
      }
    }
    if( cmdE->vref == std::string("ptrsrc")) {
      caseMatched = true;
      int idx_8 = cmdArg->int_value;
      if ( (node->children.size()) > idx_8 ) {
        std::shared_ptr<CodeNode> arg_8 = node->children.at(idx_8);
        if ( (arg_8->isPrimitiveType() == false) && (arg_8->isPrimitive() == false) ) {
          wr->out(std::string("&"), false);
        }
      }
    }
    if( cmdE->vref == std::string("nameof")) {
      caseMatched = true;
      int idx_9 = cmdArg->int_value;
      if ( (node->children.size()) > idx_9 ) {
        std::shared_ptr<CodeNode> arg_9 = node->children.at(idx_9);
        wr->out(arg_9->vref, false);
      }
    }
    if( cmdE->vref == std::string("list")) {
      caseMatched = true;
      int idx_10 = cmdArg->int_value;
      if ( (node->children.size()) > idx_10 ) {
        std::shared_ptr<CodeNode> arg_10 = node->children.at(idx_10);
        for ( std::vector< std::shared_ptr<CodeNode>>::size_type i = 0; i != arg_10->children.size(); i++) {
          std::shared_ptr<CodeNode> ch = arg_10->children.at(i);
          if ( i > 0 ) {
            wr->out(std::string(" "), false);
          }
          ctx->setInExpr();
          this->WalkNode(ch, ctx, wr);
          ctx->unsetInExpr();
        }
      }
    }
    if( cmdE->vref == std::string("repeat_from")) {
      caseMatched = true;
      int idx_11 = cmdArg->int_value;
      repeat_index = idx_11;
      if ( (node->children.size()) >= idx_11 ) {
        std::shared_ptr<CodeNode> cmdToRepeat = cmd->getThird();
        int i_1 = idx_11;
        while (i_1 < (node->children.size())) {
          if ( i_1 >= idx_11 ) {
            for ( std::vector< std::shared_ptr<CodeNode>>::size_type ii = 0; ii != cmdToRepeat->children.size(); ii++) {
              std::shared_ptr<CodeNode> cc_1 = cmdToRepeat->children.at(ii);
              if ( (cc_1->children.size()) > 0 ) {
                std::shared_ptr<CodeNode> fc = cc_1->getFirst();
                if ( fc->vref == std::string("e") ) {
                  std::shared_ptr<CodeNode> dc = cc_1->getSecond();
                  dc->int_value = i_1;
                }
                if ( fc->vref == std::string("block") ) {
                  std::shared_ptr<CodeNode> dc_1 = cc_1->getSecond();
                  dc_1->int_value = i_1;
                }
              }
            }
            this->walkCommandList(cmdToRepeat, node, ctx, wr);
            if ( (i_1 + 1) < (node->children.size()) ) {
              wr->out(std::string(","), false);
            }
          }
          i_1 = i_1 + 1;
        }
      }
    }
    if( cmdE->vref == std::string("comma")) {
      caseMatched = true;
      int idx_12 = cmdArg->int_value;
      if ( (node->children.size()) > idx_12 ) {
        std::shared_ptr<CodeNode> arg_11 = node->children.at(idx_12);
        for ( std::vector< std::shared_ptr<CodeNode>>::size_type i_2 = 0; i_2 != arg_11->children.size(); i_2++) {
          std::shared_ptr<CodeNode> ch_1 = arg_11->children.at(i_2);
          if ( i_2 > 0 ) {
            wr->out(std::string(","), false);
          }
          ctx->setInExpr();
          this->WalkNode(ch_1, ctx, wr);
          ctx->unsetInExpr();
        }
      }
    }
    if( cmdE->vref == std::string("swift_rc")) {
      caseMatched = true;
      int idx_13 = cmdArg->int_value;
      if ( (node->children.size()) > idx_13 ) {
        std::shared_ptr<CodeNode> arg_12 = node->children.at(idx_13);
        if ( arg_12->hasParamDesc ) {
          if ( arg_12->paramDesc->ref_cnt == 0 ) {
            wr->out(std::string("_"), false);
          } else {
            std::shared_ptr<RangerAppParamDesc> p_2 = ctx->getVariableDef(arg_12->vref);
            wr->out(p_2->compiledName, false);
          }
        } else {
          wr->out(arg_12->vref, false);
        }
      }
    }
    if( cmdE->vref == std::string("r_ktype")) {
      caseMatched = true;
      int idx_14 = cmdArg->int_value;
      if ( (node->children.size()) > idx_14 ) {
        std::shared_ptr<CodeNode> arg_13 = node->children.at(idx_14);
        if ( arg_13->hasParamDesc ) {
          std::string ss = langWriter->getObjectTypeString(arg_13->paramDesc->nameNode->key_type, ctx);
          wr->out(ss, false);
        } else {
          std::string ss_1 = langWriter->getObjectTypeString(arg_13->key_type, ctx);
          wr->out(ss_1, false);
        }
      }
    }
    if( cmdE->vref == std::string("r_atype")) {
      caseMatched = true;
      int idx_15 = cmdArg->int_value;
      if ( (node->children.size()) > idx_15 ) {
        std::shared_ptr<CodeNode> arg_14 = node->children.at(idx_15);
        if ( arg_14->hasParamDesc ) {
          std::string ss_2 = langWriter->getObjectTypeString(arg_14->paramDesc->nameNode->array_type, ctx);
          wr->out(ss_2, false);
        } else {
          std::string ss_3 = langWriter->getObjectTypeString(arg_14->array_type, ctx);
          wr->out(ss_3, false);
        }
      }
    }
    if( cmdE->vref == std::string("custom")) {
      caseMatched = true;
      langWriter->CustomOperator(node, ctx, wr);
    }
    if( cmdE->vref == std::string("arraytype")) {
      caseMatched = true;
      int idx_16 = cmdArg->int_value;
      if ( (node->children.size()) > idx_16 ) {
        std::shared_ptr<CodeNode> arg_15 = node->children.at(idx_16);
        if ( arg_15->hasParamDesc ) {
          langWriter->writeArrayTypeDef(arg_15->paramDesc->nameNode, ctx, wr);
        } else {
          langWriter->writeArrayTypeDef(arg_15, ctx, wr);
        }
      }
    }
    if( cmdE->vref == std::string("rawtype")) {
      caseMatched = true;
      int idx_17 = cmdArg->int_value;
      if ( (node->children.size()) > idx_17 ) {
        std::shared_ptr<CodeNode> arg_16 = node->children.at(idx_17);
        if ( arg_16->hasParamDesc ) {
          langWriter->writeRawTypeDef(arg_16->paramDesc->nameNode, ctx, wr);
        } else {
          langWriter->writeRawTypeDef(arg_16, ctx, wr);
        }
      }
    }
    if( cmdE->vref == std::string("macro")) {
      caseMatched = true;
      std::shared_ptr<CodeWriter> p_write = wr->getTag(std::string("utilities"));
      std::shared_ptr<CodeWriter> newWriter =  std::make_shared<CodeWriter>();
      std::shared_ptr<RangerAppWriterContext> testCtx = ctx->fork();
      testCtx->restartExpressionLevel();
      this->walkCommandList(cmdArg, node, testCtx, newWriter);
      std::string p_str = newWriter->getCode();
      /** unused:  std::shared_ptr<RangerAppWriterContext> root = ctx->getRoot()   **/ ;
      if ( (p_write->compiledTags.count(p_str)) == false ) {
        p_write->compiledTags[p_str] = true;
        std::shared_ptr<RangerAppWriterContext> mCtx = ctx->fork();
        mCtx->restartExpressionLevel();
        this->walkCommandList(cmdArg, node, mCtx, p_write);
      }
    }
    if( cmdE->vref == std::string("create_polyfill")) {
      caseMatched = true;
      std::shared_ptr<CodeWriter> p_write_1 = wr->getTag(std::string("utilities"));
      std::string p_str_1 = cmdArg->string_value;
      if ( (p_write_1->compiledTags.count(p_str_1)) == false ) {
        p_write_1->raw(p_str_1, true);
        p_write_1->compiledTags[p_str_1] = true;
      }
    }
    if( cmdE->vref == std::string("typeof")) {
      caseMatched = true;
      int idx_18 = cmdArg->int_value;
      if ( (node->children.size()) >= idx_18 ) {
        std::shared_ptr<CodeNode> arg_17 = node->children.at(idx_18);
        if ( arg_17->hasParamDesc ) {
          this->writeTypeDef(arg_17->paramDesc->nameNode, ctx, wr);
        } else {
          this->writeTypeDef(arg_17, ctx, wr);
        }
      }
    }
    if( cmdE->vref == std::string("imp")) {
      caseMatched = true;
      langWriter->import_lib(cmdArg->string_value, ctx, wr);
    }
    if( cmdE->vref == std::string("atype")) {
      caseMatched = true;
      int idx_19 = cmdArg->int_value;
      if ( (node->children.size()) >= idx_19 ) {
        std::shared_ptr<CodeNode> arg_18 = node->children.at(idx_19);
        std::shared_ptr<RangerAppParamDesc> p_3 = this->findParamDesc(arg_18, ctx, wr);
        std::shared_ptr<CodeNode> nameNode = p_3->nameNode;
        std::string tn = nameNode->array_type;
        wr->out(this->getTypeString(tn, ctx), false);
      }
    }
  } else {
    if ( cmd->value_type == 9 ) {
      bool caseMatched_2 = false;
      if( cmd->vref == std::string("nl")) {
        caseMatched_2 = true;
        wr->newline();
      }
      if( cmd->vref == std::string("space")) {
        caseMatched_2 = true;
        wr->out(std::string(" "), false);
      }
      if( cmd->vref == std::string("I")) {
        caseMatched_2 = true;
        wr->indent(1);
      }
      if( cmd->vref == std::string("i")) {
        caseMatched_2 = true;
        wr->indent(-1);
      }
      if( cmd->vref == std::string("op")) {
        caseMatched_2 = true;
        std::shared_ptr<CodeNode> fc_1 = node->getFirst();
        wr->out(fc_1->vref, false);
      }
    } else {
      if ( cmd->value_type == 4 ) {
        wr->out(cmd->string_value, false);
      }
    }
  }
}

void  LiveCompiler::compile( std::shared_ptr<CodeNode> node , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr ) {
}

std::shared_ptr<RangerAppParamDesc>  LiveCompiler::findParamDesc( std::shared_ptr<CodeNode> obj , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr ) {
  std::shared_ptr<RangerAppParamDesc> varDesc;
  bool set_nsp = false;
  std::shared_ptr<RangerAppClassDesc> classDesc;
  if ( 0 == (obj->nsp.size()) ) {
    set_nsp = true;
  }
  if ( obj->vref != std::string("this") ) {
    if ( (obj->ns.size()) > 1 ) {
      int cnt = obj->ns.size();
      std::shared_ptr<RangerAppParamDesc> classRefDesc;
      for ( std::vector< std::string>::size_type i = 0; i != obj->ns.size(); i++) {
        std::string strname = obj->ns.at(i);
        if ( i == 0 ) {
          if ( strname == std::string("this") ) {
            classDesc  = ctx->getCurrentClass();
            if ( set_nsp ) {
              obj->nsp.push_back( classDesc  );
            }
          } else {
            if ( ctx->isDefinedClass(strname) ) {
              classDesc  = ctx->findClass(strname);
              if ( set_nsp ) {
                obj->nsp.push_back( classDesc  );
              }
              continue;
            }
            classRefDesc  = ctx->getVariableDef(strname);
            if ( classRefDesc == NULL ) {
              ctx->addError(obj, std::string("Error, no description for called object: ") + strname);
              break;
            }
            if ( set_nsp ) {
              obj->nsp.push_back( classRefDesc  );
            }
            classRefDesc->ref_cnt = 1 + classRefDesc->ref_cnt;
            classDesc  = ctx->findClass(classRefDesc->nameNode->type_name);
          }
        } else {
          if ( i < (cnt - 1) ) {
            varDesc  = classDesc->findVariable(strname);
            if ( varDesc == NULL ) {
              ctx->addError(obj, std::string("Error, no description for refenced obj: ") + strname);
            }
            std::string subClass = varDesc->getTypeName();
            classDesc  = ctx->findClass(subClass);
            if ( set_nsp ) {
              obj->nsp.push_back( varDesc  );
            }
            continue;
          }
          if ( classDesc != NULL  ) {
            varDesc  = classDesc->findVariable(strname);
            if ( varDesc == NULL ) {
              std::shared_ptr<RangerAppFunctionDesc> classMethod = classDesc->findMethod(strname);
              if ( classMethod == NULL ) {
                classMethod  = classDesc->findStaticMethod(strname);
                if ( classMethod == NULL ) {
                  ctx->addError(obj, std::string("variable not found ") + strname);
                }
              }
              if ( classMethod != NULL  ) {
                if ( set_nsp ) {
                  obj->nsp.push_back( classMethod  );
                }
                return classMethod;
              }
            }
            if ( set_nsp ) {
              obj->nsp.push_back( varDesc  );
            }
          }
        }
      }
      return varDesc;
    }
    varDesc  = ctx->getVariableDef(obj->vref);
    if ( varDesc->nameNode != NULL  ) {
    } else {
      std::cout << std::string("findParamDesc : description not found for ") + obj->vref << std::endl;
      if ( varDesc != NULL  ) {
        std::cout << std::string("Vardesc was found though...") + varDesc->name << std::endl;
      }
      ctx->addError(obj, std::string("Error, no description for called object: ") + obj->vref);
    }
    return varDesc;
  }
  std::shared_ptr<RangerAppClassDesc> cc = ctx->getCurrentClass();
  return cc;
}

ColorConsole::ColorConsole( ) {
}

void  ColorConsole::out( std::string color , std::string str ) {
  std::cout << str << std::endl;
}

DictNode::DictNode( ) {
  this->is_property = false;
  this->is_property_value = false;
  this->vref = std::string("");
  this->value_type = 6;
  this->double_value = 0;
  this->int_value = 0;
  this->string_value = std::string("");
  this->boolean_value = false;
}

std::shared_ptr<DictNode>  DictNode::createEmptyObject() {
  std::shared_ptr<DictNode> v =  std::make_shared<DictNode>();
  v->value_type = 6;
  return v;
}

std::string  DictNode::EncodeString( std::string orig_str ) {
  std::string encoded_str = std::string("");
  /** unused:  int str_length = orig_str.length()   **/ ;
  int ii = 0;
  const char* buff = orig_str.c_str();
  int cb_len = strlen( buff );
  while (ii < cb_len) {
    char cc = buff[ii];
    switch (cc ) { 
      case 8 : 
        {
          encoded_str = (encoded_str + (std::string(1, char(92)))) + (std::string(1, char(98)));
          break;
        }
      case 9 : 
        {
          encoded_str = (encoded_str + (std::string(1, char(92)))) + (std::string(1, char(116)));
          break;
        }
      case 10 : 
        {
          encoded_str = (encoded_str + (std::string(1, char(92)))) + (std::string(1, char(110)));
          break;
        }
      case 12 : 
        {
          encoded_str = (encoded_str + (std::string(1, char(92)))) + (std::string(1, char(102)));
          break;
        }
      case 13 : 
        {
          encoded_str = (encoded_str + (std::string(1, char(92)))) + (std::string(1, char(114)));
          break;
        }
      case 34 : 
        {
          encoded_str = (encoded_str + (std::string(1, char(92)))) + std::string("\"");
          break;
        }
      case 92 : 
        {
          encoded_str = (encoded_str + (std::string(1, char(92)))) + (std::string(1, char(92)));
          break;
        }
      case 47 : 
        {
          encoded_str = (encoded_str + (std::string(1, char(92)))) + (std::string(1, char(47)));
          break;
        }
      default: 
        encoded_str = encoded_str + (std::string(1, char(cc)));
        break;
    }
    ii = 1 + ii;
  }
  return encoded_str;
}

void  DictNode::addString( std::string key , std::string value ) {
  if ( value_type == 6 ) {
    std::shared_ptr<DictNode> v =  std::make_shared<DictNode>();
    v->string_value = value;
    v->value_type = 3;
    v->vref = key;
    v->is_property = true;
    keys.push_back( key  );
    objects[key] = v;
  }
}

void  DictNode::addDouble( std::string key , double value ) {
  if ( value_type == 6 ) {
    std::shared_ptr<DictNode> v =  std::make_shared<DictNode>();
    v->double_value = value;
    v->value_type = 1;
    v->vref = key;
    v->is_property = true;
    keys.push_back( key  );
    objects[key] = v;
  }
}

void  DictNode::addInt( std::string key , int value ) {
  if ( value_type == 6 ) {
    std::shared_ptr<DictNode> v =  std::make_shared<DictNode>();
    v->int_value = value;
    v->value_type = 2;
    v->vref = key;
    v->is_property = true;
    keys.push_back( key  );
    objects[key] = v;
  }
}

void  DictNode::addBoolean( std::string key , bool value ) {
  if ( value_type == 6 ) {
    std::shared_ptr<DictNode> v =  std::make_shared<DictNode>();
    v->boolean_value = value;
    v->value_type = 4;
    v->vref = key;
    v->is_property = true;
    keys.push_back( key  );
    objects[key] = v;
  }
}

std::shared_ptr<DictNode>  DictNode::addObject( std::string key ) {
  std::shared_ptr<DictNode> v;
  if ( value_type == 6 ) {
    std::shared_ptr<DictNode> p =  std::make_shared<DictNode>();
    v  =  std::make_shared<DictNode>();
    p->value_type = 6;
    p->vref = key;
    p->is_property = true;
    v->value_type = 6;
    v->vref = key;
    v->is_property_value = true;
    p->object_value  = v;
    keys.push_back( key  );
    objects[key] = p;
    return v;
  }
  return v;
}

void  DictNode::setObject( std::string key , std::shared_ptr<DictNode> value ) {
  if ( value_type == 6 ) {
    std::shared_ptr<DictNode> p =  std::make_shared<DictNode>();
    p->value_type = 6;
    p->vref = key;
    p->is_property = true;
    value->is_property_value = true;
    value->vref = key;
    p->object_value  = value;
    keys.push_back( key  );
    objects[key] = p;
  }
}

std::shared_ptr<DictNode>  DictNode::addArray( std::string key ) {
  std::shared_ptr<DictNode> v;
  if ( value_type == 6 ) {
    v  =  std::make_shared<DictNode>();
    v->value_type = 5;
    v->vref = key;
    v->is_property = true;
    keys.push_back( key  );
    objects[key] = v;
    return v;
  }
  return v;
}

void  DictNode::push( std::shared_ptr<DictNode> obj ) {
  if ( value_type == 5 ) {
    children.push_back( obj  );
  }
}

double  DictNode::getDoubleAt( int index ) {
  if ( index < (children.size()) ) {
    std::shared_ptr<DictNode> k = children.at(index);
    return k->double_value;
  }
  return 0;
}

std::string  DictNode::getStringAt( int index ) {
  if ( index < (children.size()) ) {
    std::shared_ptr<DictNode> k = children.at(index);
    return k->string_value;
  }
  return std::string("");
}

int  DictNode::getIntAt( int index ) {
  if ( index < (children.size()) ) {
    std::shared_ptr<DictNode> k = children.at(index);
    return k->int_value;
  }
  return 0;
}

bool  DictNode::getBooleanAt( int index ) {
  if ( index < (children.size()) ) {
    std::shared_ptr<DictNode> k = children.at(index);
    return k->boolean_value;
  }
  return false;
}

std::string  DictNode::getString( std::string key ) {
  std::string res;
  if ( objects.count(key) ) {
    std::shared_ptr<DictNode> k = objects[key];
    res  = k->string_value;
  }
  return res;
}

 r_optional_primitive<double>   DictNode::getDouble( std::string key ) {
   r_optional_primitive<double>  res;
  if ( objects.count(key) ) {
    std::shared_ptr<DictNode> k = objects[key];
    res  = k->double_value;
  }
  return res;
}

 r_optional_primitive<int>   DictNode::getInt( std::string key ) {
   r_optional_primitive<int>  res;
  if ( objects.count(key) ) {
    std::shared_ptr<DictNode> k = objects[key];
    res  = k->int_value;
  }
  return res;
}

bool  DictNode::getBoolean( std::string key ) {
  bool res;
  if ( objects.count(key) ) {
    std::shared_ptr<DictNode> k = objects[key];
    res  = k->boolean_value;
  }
  return res;
}

std::shared_ptr<DictNode>  DictNode::getArray( std::string key ) {
  std::shared_ptr<DictNode> res;
  if ( objects.count(key) ) {
    std::shared_ptr<DictNode> obj = objects[key];
    if ( obj->is_property ) {
      res  = obj->object_value;
    }
  }
  return res;
}

std::shared_ptr<DictNode>  DictNode::getArrayAt( int index ) {
  std::shared_ptr<DictNode> res;
  if ( index < (children.size()) ) {
    res  = children.at(index);
  }
  return res;
}

std::shared_ptr<DictNode>  DictNode::getObject( std::string key ) {
  std::shared_ptr<DictNode> res;
  if ( objects.count(key) ) {
    std::shared_ptr<DictNode> obj = objects[key];
    if ( obj->is_property ) {
      res  = obj->object_value;
    }
  }
  return res;
}

std::shared_ptr<DictNode>  DictNode::getObjectAt( int index ) {
  std::shared_ptr<DictNode> res;
  if ( index < (children.size()) ) {
    res  = children.at(index);
  }
  return res;
}

std::string  DictNode::stringify() {
  if ( is_property ) {
    if ( value_type == 7 ) {
      return ((std::string("\"") + vref) + std::string("\"")) + std::string(":null");
    }
    if ( value_type == 4 ) {
      if ( boolean_value ) {
        return (((std::string("\"") + vref) + std::string("\"")) + std::string(":")) + std::string("true");
      } else {
        return (((std::string("\"") + vref) + std::string("\"")) + std::string(":")) + std::string("false");
      }
    }
    if ( value_type == 1 ) {
      return (((std::string("\"") + vref) + std::string("\"")) + std::string(":")) + std::to_string(double_value);
    }
    if ( value_type == 2 ) {
      return (((std::string("\"") + vref) + std::string("\"")) + std::string(":")) + std::to_string(int_value);
    }
    if ( value_type == 3 ) {
      return (((((std::string("\"") + vref) + std::string("\"")) + std::string(":")) + std::string("\"")) + this->EncodeString(string_value)) + std::string("\"");
    }
  } else {
    if ( value_type == 7 ) {
      return std::string("null");
    }
    if ( value_type == 1 ) {
      return std::string("") + std::to_string(double_value);
    }
    if ( value_type == 2 ) {
      return std::string("") + std::to_string(int_value);
    }
    if ( value_type == 3 ) {
      return (std::string("\"") + this->EncodeString(string_value)) + std::string("\"");
    }
    if ( value_type == 4 ) {
      if ( boolean_value ) {
        return std::string("true");
      } else {
        return std::string("false");
      }
    }
  }
  if ( value_type == 5 ) {
    std::string str = std::string("");
    if ( is_property ) {
      str = ((std::string("\"") + vref) + std::string("\"")) + std::string(":[");
    } else {
      str = std::string("[");
    }
    for ( std::vector< std::shared_ptr<DictNode>>::size_type i = 0; i != children.size(); i++) {
      std::shared_ptr<DictNode> item = children.at(i);
      if ( i > 0 ) {
        str = str + std::string(",");
      }
      str = str + item->stringify();
    }
    str = str + std::string("]");
    return str;
  }
  if ( value_type == 6 ) {
    std::string str_1 = std::string("");
    if ( is_property ) {
      return (((std::string("\"") + vref) + std::string("\"")) + std::string(":")) + object_value->stringify();
    } else {
      str_1 = std::string("{");
      for ( std::vector< std::string>::size_type i_1 = 0; i_1 != keys.size(); i_1++) {
        std::string key = keys.at(i_1);
        if ( i_1 > 0 ) {
          str_1 = str_1 + std::string(",");
        }
        std::shared_ptr<DictNode> item_1 = objects[key];
        str_1 = str_1 + item_1->stringify();
      }
      str_1 = str_1 + std::string("}");
      return str_1;
    }
  }
  return std::string("");
}

RangerSerializeClass::RangerSerializeClass( ) {
}

bool  RangerSerializeClass::isSerializedClass( std::string cName , std::shared_ptr<RangerAppWriterContext> ctx ) {
  if ( ctx->hasClass(cName) ) {
    std::shared_ptr<RangerAppClassDesc> clDecl = ctx->findClass(cName);
    if ( clDecl->is_serialized ) {
      return true;
    }
  }
  return false;
}

void  RangerSerializeClass::createWRWriter( std::shared_ptr<RangerAppParamDesc> pvar , std::shared_ptr<CodeNode> nn , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr ) {
  wr->out(std::string("def key@(lives):DictNode (new DictNode())"), true);
  wr->out((std::string("key.addString(\"n\" \"") + pvar->name) + std::string("\")"), true);
  if ( nn->value_type == 6 ) {
    if ( this->isSerializedClass(nn->array_type, ctx) ) {
      wr->out((std::string("def values:DictNode (keys.addArray(\"") + pvar->compiledName) + std::string("\"))"), true);
      wr->out((((std::string("for this.") + pvar->compiledName) + std::string(" item:")) + nn->array_type) + std::string(" i {"), true);
      wr->indent(1);
      wr->out(std::string("def obj@(lives):DictNode (item.serializeToDict())"), true);
      wr->out(std::string("values.push( obj )"), true);
      wr->indent(-1);
      wr->out(std::string("}"), true);
    }
    return;
  }
  if ( nn->value_type == 7 ) {
    if ( this->isSerializedClass(nn->array_type, ctx) ) {
      wr->out((std::string("def values:DictNode (keys.addObject(\"") + pvar->compiledName) + std::string("\"))"), true);
      wr->out((std::string("for this.") + pvar->compiledName) + std::string(" keyname {"), true);
      wr->indent(1);
      wr->out((std::string("def item:DictNode (unwrap (get this.") + pvar->compiledName) + std::string(" keyname))"), true);
      wr->out(std::string("def obj@(lives):DictNode (item.serializeToDict())"), true);
      wr->out(std::string("values.setObject( obj )"), true);
      wr->indent(-1);
      wr->out(std::string("}"), true);
    }
    if ( nn->key_type == std::string("string") ) {
      wr->out((std::string("def values:DictNode (keys.addObject(\"") + pvar->compiledName) + std::string("\"))"), true);
      wr->out((std::string("for this.") + pvar->compiledName) + std::string(" keyname {"), true);
      wr->indent(1);
      if ( nn->array_type == std::string("string") ) {
        wr->out((std::string("values.addString(keyname (unwrap (get this.") + pvar->compiledName) + std::string(" keyname)))"), true);
      }
      if ( nn->array_type == std::string("int") ) {
        wr->out((std::string("values.addInt(keyname (unwrap (get this.") + pvar->compiledName) + std::string(" keyname)))"), true);
      }
      if ( nn->array_type == std::string("boolean") ) {
        wr->out((std::string("values.addBoolean(keyname (unwrap (get this.") + pvar->compiledName) + std::string(" keyname)))"), true);
      }
      if ( nn->array_type == std::string("double") ) {
        wr->out((std::string("values.addDouble(keyname (unwrap (get this.") + pvar->compiledName) + std::string(" keyname)))"), true);
      }
      wr->indent(-1);
      wr->out(std::string("}"), true);
      return;
    }
    return;
  }
  if ( nn->type_name == std::string("string") ) {
    wr->out((((std::string("keys.addString(\"") + pvar->compiledName) + std::string("\" (this.")) + pvar->compiledName) + std::string("))"), true);
    return;
  }
  if ( nn->type_name == std::string("double") ) {
    wr->out((((std::string("keys.addDouble(\"") + pvar->compiledName) + std::string("\" (this.")) + pvar->compiledName) + std::string("))"), true);
    return;
  }
  if ( nn->type_name == std::string("int") ) {
    wr->out((((std::string("keys.addInt(\"") + pvar->compiledName) + std::string("\" (this.")) + pvar->compiledName) + std::string("))"), true);
    return;
  }
  if ( nn->type_name == std::string("boolean") ) {
    wr->out((((std::string("keys.addBoolean(\"") + pvar->compiledName) + std::string("\" (this.")) + pvar->compiledName) + std::string("))"), true);
    return;
  }
  if ( this->isSerializedClass(nn->type_name, ctx) ) {
    wr->out((std::string("def value@(lives):DictNode (this.") + pvar->compiledName) + std::string(".serializeToDict())"), true);
    wr->out((std::string("keys.setObject(\"") + pvar->compiledName) + std::string("\" value)"), true);
  }
}

void  RangerSerializeClass::createJSONSerializerFn( std::shared_ptr<RangerAppClassDesc> cl , std::shared_ptr<RangerAppWriterContext> ctx , std::shared_ptr<CodeWriter> wr ) {
  std::map<std::string,bool> declaredVariable;
  wr->out(std::string("Import \"ng_DictNode.clj\""), true);
  wr->out((std::string("extension ") + cl->name) + std::string(" {"), true);
  wr->indent(1);
  wr->out((std::string("fn unserializeFromDict@(strong):") + cl->name) + std::string(" (dict:DictNode) {"), true);
  wr->indent(1);
  wr->out((((std::string("def obj:") + cl->name) + std::string(" (new ")) + cl->name) + std::string("())"), true);
  wr->out(std::string("return obj"), true);
  wr->indent(-1);
  wr->out(std::string("}"), true);
  wr->newline();
  wr->out(std::string("fn serializeToDict:DictNode () {"), true);
  wr->indent(1);
  wr->out(std::string("def res:DictNode (new DictNode ())"), true);
  wr->out((std::string("res.addString(\"n\" \"") + cl->name) + std::string("\")"), true);
  wr->out(std::string("def keys:DictNode (res.addObject(\"data\"))"), true);
  if ( (cl->extends_classes.size()) > 0 ) {
    for ( std::vector< std::string>::size_type i = 0; i != cl->extends_classes.size(); i++) {
      std::string pName = cl->extends_classes.at(i);
      std::shared_ptr<RangerAppClassDesc> pC = ctx->findClass(pName);
      for ( std::vector< std::shared_ptr<RangerAppParamDesc>>::size_type i_1 = 0; i_1 != pC->variables.size(); i_1++) {
        std::shared_ptr<RangerAppParamDesc> pvar = pC->variables.at(i_1);
        declaredVariable[pvar->name] = true;
        std::shared_ptr<CodeNode> nn = pvar->nameNode;
        if ( nn->isPrimitive() ) {
          wr->out(std::string("; extended "), true);
          wr->out(std::string("def key@(lives):DictNode (new DictNode())"), true);
          wr->out((std::string("key.addString(\"n\" \"") + pvar->name) + std::string("\")"), true);
          wr->out((std::string("key.addString(\"t\" \"") + std::to_string(pvar->value_type)) + std::string("\")"), true);
          wr->out(std::string("keys.push(key)"), true);
        }
      }
    }
  }
  for ( std::vector< std::shared_ptr<RangerAppParamDesc>>::size_type i_2 = 0; i_2 != cl->variables.size(); i_2++) {
    std::shared_ptr<RangerAppParamDesc> pvar_1 = cl->variables.at(i_2);
    if ( declaredVariable.count(pvar_1->name) ) {
      continue;
    }
    std::shared_ptr<CodeNode> nn_1 = pvar_1->nameNode;
    if ( nn_1->hasFlag(std::string("optional")) ) {
      wr->out(std::string("; optional variable"), true);
      wr->out((std::string("if (!null? this.") + pvar_1->name) + std::string(") {"), true);
      wr->indent(1);
      this->createWRWriter(pvar_1, nn_1, ctx, wr);
      wr->indent(-1);
      wr->out(std::string("} {"), true);
      wr->indent(1);
      wr->indent(-1);
      wr->out(std::string("}"), true);
      continue;
    }
    wr->out(std::string("; not extended "), true);
    this->createWRWriter(pvar_1, nn_1, ctx, wr);
  }
  wr->out(std::string("return res"), true);
  wr->indent(-1);
  wr->out(std::string("}"), true);
  wr->indent(-1);
  wr->out(std::string("}"), true);
}

CompilerInterface::CompilerInterface( ) {
}

void  CompilerInterface::displayCompilerErrors( std::shared_ptr<RangerAppWriterContext> appCtx ) {
  std::shared_ptr<ColorConsole> cons =  std::make_shared<ColorConsole>();
  for ( std::vector< std::shared_ptr<RangerCompilerMessage>>::size_type i_3 = 0; i_3 != appCtx->compilerErrors.size(); i_3++) {
    std::shared_ptr<RangerCompilerMessage> e = appCtx->compilerErrors.at(i_3);
    int line_index = e->node->getLine();
    cons->out(std::string("gray"), (e->node->getFilename() + std::string(" Line: ")) + std::to_string((1 + line_index)));
    cons->out(std::string("gray"), e->description);
    cons->out(std::string("gray"), e->node->getLineString(line_index));
    cons->out(std::string(""), e->node->getColStartString() + std::string("^-------"));
  }
}

void  CompilerInterface::displayParserErrors( std::shared_ptr<RangerAppWriterContext> appCtx ) {
  if ( (appCtx->parserErrors.size()) == 0 ) {
    std::cout << std::string("no language test errors") << std::endl;
    return;
  }
  std::cout << std::string("LANGUAGE TEST ERRORS:") << std::endl;
  for ( std::vector< std::shared_ptr<RangerCompilerMessage>>::size_type i_4 = 0; i_4 != appCtx->parserErrors.size(); i_4++) {
    std::shared_ptr<RangerCompilerMessage> e_1 = appCtx->parserErrors.at(i_4);
    int line_index_1 = e_1->node->getLine();
    std::cout << (e_1->node->getFilename() + std::string(" Line: ")) + std::to_string((1 + line_index_1)) << std::endl;
    std::cout << e_1->description << std::endl;
    std::cout << e_1->node->getLineString(line_index_1) << std::endl;
  }
}

int main(int argc, char* argv[]) {
  std::vector<std::string> allowed_languages = {std::string("es6"),std::string("go"),std::string("scala"),std::string("java7"),std::string("swift3"),std::string("cpp"),std::string("php"),std::string("ranger")};
  if ( (argc) < 5 ) {
    std::cout << std::string("Ranger compiler, version 2.0.8") << std::endl;
    std::cout << std::string("usage <file> <language-file> <language> <directory> <targetfile>") << std::endl;
    std::cout << std::string("allowed languages: ") + (join( allowed_languages , std::string(" "))) << std::endl;
    return 0;
  }
  std::string the_file = std::string(argv[0 + 1]);
  std::string the_lang_file = std::string(argv[1 + 1]);
  std::string the_lang = std::string(argv[2 + 1]);
  std::string the_target_dir = std::string(argv[3 + 1]);
  std::string the_target = std::string(argv[4 + 1]);
  std::cout << std::string("language == ") + the_lang << std::endl;
  if ( (r_arr_index_of<std::string>(allowed_languages, the_lang)) < 0 ) {
    std::cout << std::string("Invalid language : ") + the_lang << std::endl;
    /** unused:  std::string s = std::string("")   **/ ;
    std::cout << std::string("allowed languages: ") + (join( allowed_languages , std::string(" "))) << std::endl;
    return 0;
  }
  if ( (r_cpp_file_exists( std::string(".") + "/" + the_file)) == false ) {
    std::cout << std::string("Could not compile.") << std::endl;
    std::cout << std::string("File not found: ") + the_file << std::endl;
    return 0;
  }
  if ( (r_cpp_file_exists( std::string(".") + "/" + the_lang_file)) == false ) {
    std::cout << (std::string("language file ") + the_lang_file) + std::string(" not found!") << std::endl;
    std::cout << std::string("download: https://raw.githubusercontent.com/terotests/Ranger/master/compiler/Lang.clj") << std::endl;
    return 0;
  }
  std::cout << std::string("File to be compiled: ") + the_file << std::endl;
  std::string c = r_cpp_readFile( std::string(".") , the_file);
  std::shared_ptr<SourceCode> code =  std::make_shared<SourceCode>(c);
  code->filename = the_file;
  std::shared_ptr<RangerLispParser> parser =  std::make_shared<RangerLispParser>(code);
  parser->parse();
  std::shared_ptr<LiveCompiler> lcc =  std::make_shared<LiveCompiler>();
  std::shared_ptr<CodeNode> node = parser->rootNode;
  std::shared_ptr<RangerFlowParser> flowParser =  std::make_shared<RangerFlowParser>();
  std::shared_ptr<RangerAppWriterContext> appCtx =  std::make_shared<RangerAppWriterContext>();
  std::shared_ptr<CodeWriter> wr =  std::make_shared<CodeWriter>();
  std::clock_t __begin = std::clock();
  try {
    flowParser->mergeImports(node, appCtx, wr);
    std::string lang_str = r_cpp_readFile( std::string(".") , the_lang_file);
    std::shared_ptr<SourceCode> lang_code =  std::make_shared<SourceCode>(lang_str);
    lang_code->filename = the_lang_file;
    std::shared_ptr<RangerLispParser> lang_parser =  std::make_shared<RangerLispParser>(lang_code);
    lang_parser->parse();
    appCtx->langOperators  = lang_parser->rootNode;
    appCtx->setRootFile(the_file);
    std::cout << std::string("1. Collecting available methods.") << std::endl;
    flowParser->CollectMethods(node, appCtx, wr);
    if ( (appCtx->compilerErrors.size()) > 0 ) {
      CompilerInterface::displayCompilerErrors(appCtx);
      return 0;
    }
    std::cout << std::string("2. Analyzing the code.") << std::endl;
    appCtx->targetLangName = the_lang;
    std::cout << std::string("selected language is ") + appCtx->targetLangName << std::endl;
    flowParser->StartWalk(node, appCtx, wr);
    if ( (appCtx->compilerErrors.size()) > 0 ) {
      CompilerInterface::displayCompilerErrors(appCtx);
      return 0;
    }
    std::cout << std::string("3. Compiling the source code.") << std::endl;
    std::shared_ptr<CodeFileSystem> fileSystem =  std::make_shared<CodeFileSystem>();
    std::shared_ptr<CodeFile> file = fileSystem->getFile(std::string("."), the_target);
    std::shared_ptr<CodeWriter> wr_1 = file->getWriter();
    std::shared_ptr<RangerAppClassDesc> staticMethods;
    std::shared_ptr<CodeWriter> importFork = wr_1->fork();
    for ( std::vector< std::string>::size_type i = 0; i != appCtx->definedClassList.size(); i++) {
      std::string cName = appCtx->definedClassList.at(i);
      if ( cName == std::string("RangerStaticMethods") ) {
        staticMethods  = appCtx->definedClasses[cName];
        continue;
      }
      std::shared_ptr<RangerAppClassDesc> cl = appCtx->definedClasses[cName];
      if ( cl->is_trait ) {
        continue;
      }
      if ( cl->is_system ) {
        continue;
      }
      if ( cl->is_system_union ) {
        continue;
      }
      lcc->WalkNode(cl->classNode, appCtx, wr_1);
    }
    if ( staticMethods != NULL  ) {
      lcc->WalkNode(staticMethods->classNode, appCtx, wr_1);
    }
    for ( std::vector< std::shared_ptr<RangerAppClassDesc>>::size_type i_1 = 0; i_1 != flowParser->collectedIntefaces.size(); i_1++) {
      std::shared_ptr<RangerAppClassDesc> ifDesc = flowParser->collectedIntefaces.at(i_1);
      std::cout << std::string("should define also interface ") + ifDesc->name << std::endl;
      lcc->langWriter->writeInterface(ifDesc, appCtx, wr_1);
    }
    std::vector<std::string> import_list = wr_1->getImports();
    if ( appCtx->targetLangName == std::string("go") ) {
      importFork->out(std::string("package main"), true);
      importFork->newline();
      importFork->out(std::string("import ("), true);
      importFork->indent(1);
    }
    for ( std::vector< std::string>::size_type i_2 = 0; i_2 != import_list.size(); i_2++) {
      std::string codeStr = import_list.at(i_2);
      bool caseMatched = false;
      if( appCtx->targetLangName == std::string("go")) {
        caseMatched = true;
        if ( (codeStr.at(0)) == ((std::string("_").at(0))) ) {
          importFork->out((std::string(" _ \"") + (codeStr.substr(1, (codeStr.length()) - 1))) + std::string("\""), true);
        } else {
          importFork->out((std::string("\"") + codeStr) + std::string("\""), true);
        }
      }
      if( appCtx->targetLangName == std::string("rust")) {
        caseMatched = true;
        importFork->out((std::string("use ") + codeStr) + std::string(";"), true);
      }
      if( appCtx->targetLangName == std::string("cpp")) {
        caseMatched = true;
        importFork->out((std::string("#include  ") + codeStr) + std::string(""), true);
      }
      if( ! caseMatched) {
        importFork->out((std::string("import ") + codeStr) + std::string(""), true);
      }
    }
    if ( appCtx->targetLangName == std::string("go") ) {
      importFork->indent(-1);
      importFork->out(std::string(")"), true);
    }
    fileSystem->saveTo(the_target_dir);
    std::cout << std::string("Ready.") << std::endl;
    CompilerInterface::displayCompilerErrors(appCtx);
  } catch( ... ) {
    if ( lcc->lastProcessedNode != NULL ) {
      std::cout << std::string("Got compiler error close to") << std::endl;
      std::cout << lcc->lastProcessedNode->getLineAsString() << std::endl;
      return 0;
    }
    if ( flowParser->lastProcessedNode != NULL ) {
      std::cout << std::string("Got compiler error close to") << std::endl;
      std::cout << flowParser->lastProcessedNode->getLineAsString() << std::endl;
      return 0;
    }
    std::cout << std::string("Got unknown compiler error") << std::endl;
    return 0;
  }
  std::clock_t __end = std::clock();
  std::cout << std::string("Total time") << ( double(__end - __begin) / CLOCKS_PER_SEC ) << std::endl;
  return 0;
}
