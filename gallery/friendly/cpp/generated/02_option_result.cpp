#include  <memory>
#include  <variant>
#include  <string>
#include  <vector>
#include  <iostream>

// define classes here to avoid compiler errors
class ParseOutcome_Err;
class ParseOutcome_Ok;
class ParseOutcome_Err;
class ParseOutcome__ops;
class Lookup;
class OptionResultMain;

typedef std::variant<ParseOutcome_Ok, std::shared_ptr<ParseOutcome_Err>>  r_union_ParseOutcome;

template <class T>
class r_optional_primitive {
  public:
    // has_value has to start false: cpp_str_to_int and its siblings leave the
    // field untouched when the conversion throws, and an indeterminate bool
    // made a failed str2int read back as a value on the C++ target.
    bool has_value = false;
    T value = T();
    r_optional_primitive() {}
    // a plain value placed into an optional slot: returning a bare string
    // from a function declared @(optional):string arrives here. Declaring
    // any constructor takes the implicit default one away, hence the pair.
    r_optional_primitive(const T & a_value) : has_value(true), value(a_value) {}
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

r_optional_primitive<int> cpp_str_to_int(std::string s) {
    r_optional_primitive<int> result;
    try {
        // Ranger `int` is 64-bit on Go, Rust, Java, Kotlin and Python and 32-bit
        // here, so a literal between INT_MAX and INT64_MAX has no C++ int to
        // land in. stoi threw for those and the value stayed 0 -- the compiler
        // read its own `2147483648` bound as zero. Saturating keeps the sign
        // and the magnitude order, which is what a bound check needs.
        long long wide = std::stoll(s);
        if (wide > 2147483647LL) { wide = 2147483647LL; }
        if (wide < -2147483648LL) { wide = -2147483648LL; }
        result.value = (int)wide;
        result.has_value = true;
    } catch (...) {

    }
    return result;
}


// header definitions
class ParseOutcome_Ok { 
  public :
    int value;
    /* class constructor */ 
    ParseOutcome_Ok( int value  );
    /* a value case of a closed family compares by content */ 
    bool operator==(const ParseOutcome_Ok& o) const {
      return value == o.value;
    }
    bool operator!=(const ParseOutcome_Ok& o) const { return !(*this == o); }
};
class ParseOutcome_Err { 
  public :
    std::string message;
    /* class constructor */ 
    ParseOutcome_Err( const std::string& message  );
};
class ParseOutcome__ops { 
  public :
    /* class constructor */ 
    ParseOutcome__ops( );
    /* static methods */ 
    static bool equals( const r_union_ParseOutcome& a , const r_union_ParseOutcome& b );
    static bool notEquals( const r_union_ParseOutcome& a , const r_union_ParseOutcome& b );
};
class Lookup { 
  public :
    /* class constructor */ 
    Lookup( );
    /* instance methods */ 
     r_optional_primitive<std::string>  findName( const std::vector<std::string>& names , const std::string& key );
    r_union_ParseOutcome parseInt( const std::string& text );
    std::string describe( const r_union_ParseOutcome& r );
};
class OptionResultMain { 
  public :
    /* class constructor */ 
    OptionResultMain( );
    /* static methods */ 
    static void main();
};

int __g_argc;
char **__g_argv;
ParseOutcome_Ok::ParseOutcome_Ok( int value  ) {
  this->value = 0;
  this->value = value;
}
ParseOutcome_Err::ParseOutcome_Err( const std::string& message  ) {
  this->message = message;
}
ParseOutcome__ops::ParseOutcome__ops( ) {
}
bool  ParseOutcome__ops::equals( const r_union_ParseOutcome& a , const r_union_ParseOutcome& b ) {
  if( std::holds_alternative<ParseOutcome_Ok>(a) ) {
    ParseOutcome_Ok __ea0 = std::get<ParseOutcome_Ok>(a);
    if( std::holds_alternative<ParseOutcome_Ok>(b) ) {
      ParseOutcome_Ok __eb0 = std::get<ParseOutcome_Ok>(b);
      if ( __ea0.value != __eb0.value ) {
        return false;
      }
      return true;
    };
    return false;
  };
  if( std::holds_alternative<std::shared_ptr<ParseOutcome_Err>>(a) ) {
    std::shared_ptr<ParseOutcome_Err> __ea1 = std::get<std::shared_ptr<ParseOutcome_Err>>(a);
    if( std::holds_alternative<std::shared_ptr<ParseOutcome_Err>>(b) ) {
      std::shared_ptr<ParseOutcome_Err> __eb1 = std::get<std::shared_ptr<ParseOutcome_Err>>(b);
      if ( (__ea1->message != __eb1->message) ) {
        return false;
      }
      return true;
    };
    return false;
  };
  return false;
}
bool  ParseOutcome__ops::notEquals( const r_union_ParseOutcome& a , const r_union_ParseOutcome& b ) {
  if ( ParseOutcome__ops::equals(a, b) ) {
    return false;
  }
  return true;
}
Lookup::Lookup( ) {
}
 r_optional_primitive<std::string>   Lookup::findName( const std::vector<std::string>& names , const std::string& key ) {
   r_optional_primitive<std::string>  found;
  for ( const std::string& n : names ) {
    if ( (n == key) ) {
      found  = n;
      return found;
    }
  }
  return found;
}
r_union_ParseOutcome  Lookup::parseInt( const std::string& text ) {
  if ( (std::string_view(text) == std::string_view("", 0)) ) {
    return  std::make_shared<ParseOutcome_Err>(std::string("empty"));
  }
   r_optional_primitive<int>  parsed = cpp_str_to_int(text);
  if ( parsed.has_value == false ) {
    return  std::make_shared<ParseOutcome_Err>(std::string("not a number"));
  }
  return  ParseOutcome_Ok((/*unwrap int*/parsed.value));
}
std::string  Lookup::describe( const r_union_ParseOutcome& r ) {
  std::string out = std::string("?");
  if( std::holds_alternative<ParseOutcome_Ok>(r) ) {
    ParseOutcome_Ok o = std::get<ParseOutcome_Ok>(r);
    out = std::string("ok:") + std::to_string(o.value);
  };
  if( std::holds_alternative<std::shared_ptr<ParseOutcome_Err>>(r) ) {
    std::shared_ptr<ParseOutcome_Err> e = std::get<std::shared_ptr<ParseOutcome_Err>>(r);
    out = std::string("err:") + e->message;
  };
  return out;
}
OptionResultMain::OptionResultMain( ) {
}
int main(int argc, char* argv[]) {
  __g_argc = argc;
  __g_argv = argv;
  std::shared_ptr<Lookup> box =  std::make_shared<Lookup>();
  std::vector<std::string> names = std::vector<std::string>{std::string("ada"), std::string("grace")};
   r_optional_primitive<std::string>  hit = box->findName(names, std::string("ada"));
  std::cout << std::string("found ") + (hit.has_value ? hit.value : std::string("unknown")) << std::endl;
   r_optional_primitive<std::string>  miss = box->findName(names, std::string("alan"));
  std::cout << std::string("miss ") + (miss.has_value ? miss.value : std::string("unknown")) << std::endl;
  if ( miss.has_value == false ) {
    std::cout << std::string("miss is empty") << std::endl;
  }
  std::cout << box->describe(box->parseInt(std::string("42"))) << std::endl;
  std::cout << box->describe(box->parseInt(std::string(""))) << std::endl;
  std::cout << box->describe(box->parseInt(std::string("nope"))) << std::endl;
  return 0;
}
