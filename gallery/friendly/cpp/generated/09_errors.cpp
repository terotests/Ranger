#include  <memory>
#include  <cstddef>
#include  <type_traits>
#include  <variant>
#include  <string>
#include  <iostream>

// define classes here to avoid compiler errors
class Guarded_Err;
class Guarded_Err;
class Guarded__ops;
class Guard;
class ErrorsMain;
class Guarded_Ok;
class Guarded_Err;
class Guarded__ops;
class Guard;
class ErrorsMain;

template <class T>
class r_optional_union {
  public:
    bool has_value = false;
    T value = T();
    r_optional_union() {}
    r_optional_union(const T & a_value) : has_value(true), value(a_value) {}
    template <class U, typename std::enable_if<std::is_constructible<T, const U &>::value, int>::type = 0>
    r_optional_union(const U & a_value) : has_value(true), value(a_value) {}
    operator T() const { return value; }
    bool operator!=(std::nullptr_t) const { return has_value; }
    bool operator==(std::nullptr_t) const { return !has_value; }
    explicit operator bool() const { return has_value; }
};
typedef std::variant<Guarded_Ok, std::shared_ptr<Guarded_Err>>  r_union_Guarded;
typedef std::variant<Guarded_Ok, std::shared_ptr<Guarded_Err>, std::shared_ptr<Guarded__ops>, std::shared_ptr<Guard>, std::shared_ptr<ErrorsMain>, int, std::string, bool, double>  r_union_Any;


template <class T> inline T& rg_arg_ref(T&& v) { return v; }

// header definitions
class Guarded_Ok { 
  public :
    int value;
    /* class constructor */ 
    Guarded_Ok( int value  );
    /* a value case of a closed family compares by content */ 
    bool operator==(const Guarded_Ok& o) const {
      return value == o.value;
    }
    bool operator!=(const Guarded_Ok& o) const { return !(*this == o); }
};
class Guarded_Err { 
  public :
    std::string message;
    /* class constructor */ 
    Guarded_Err( const std::string& message  );
};
class Guarded__ops { 
  public :
    /* class constructor */ 
    Guarded__ops( );
    /* static methods */ 
    static bool equals( const r_union_Guarded& a , const r_union_Guarded& b );
    static bool notEquals( const r_union_Guarded& a , const r_union_Guarded& b );
};
class Guard { 
  public :
    /* class constructor */ 
    Guard( );
    /* instance methods */ 
    r_union_Guarded check( int value );
    std::string describe( const r_union_Guarded& g );
};
class ErrorsMain { 
  public :
    /* class constructor */ 
    ErrorsMain( );
    /* static methods */ 
    static void main();
};

int __g_argc;
char **__g_argv;
Guarded_Ok::Guarded_Ok( int value  ) {
  this->value = 0;
  this->value = value;
}
Guarded_Err::Guarded_Err( const std::string& message  ) {
  this->message = message;
}
Guarded__ops::Guarded__ops( ) {
}
bool  Guarded__ops::equals( const r_union_Guarded& a , const r_union_Guarded& b ) {
  if( std::holds_alternative<Guarded_Ok>(a) ) {
    Guarded_Ok __ea0 = std::get<Guarded_Ok>(a);
    if( std::holds_alternative<Guarded_Ok>(b) ) {
      Guarded_Ok __eb0 = std::get<Guarded_Ok>(b);
      if ( __ea0.value != __eb0.value ) {
        return false;
      }
      return true;
    };
    return false;
  };
  if( std::holds_alternative<std::shared_ptr<Guarded_Err>>(a) ) {
    std::shared_ptr<Guarded_Err> __ea1 = std::get<std::shared_ptr<Guarded_Err>>(a);
    if( std::holds_alternative<std::shared_ptr<Guarded_Err>>(b) ) {
      std::shared_ptr<Guarded_Err> __eb1 = std::get<std::shared_ptr<Guarded_Err>>(b);
      if ( (__ea1->message != __eb1->message) ) {
        return false;
      }
      return true;
    };
    return false;
  };
  return false;
}
bool  Guarded__ops::notEquals( const r_union_Guarded& a , const r_union_Guarded& b ) {
  if ( Guarded__ops::equals(a, b) ) {
    return false;
  }
  return true;
}
Guard::Guard( ) {
}
r_union_Guarded  Guard::check( int value ) {
  if ( value < 0 ) {
    return  std::make_shared<Guarded_Err>(std::string("negative"));
  }
  return  Guarded_Ok(value);
}
std::string  Guard::describe( const r_union_Guarded& g ) {
  std::string out = std::string("?");
  if( std::holds_alternative<Guarded_Ok>(g) ) {
    Guarded_Ok o = std::get<Guarded_Ok>(g);
    out = std::string("ok:") + std::to_string(o.value);
  };
  if( std::holds_alternative<std::shared_ptr<Guarded_Err>>(g) ) {
    std::shared_ptr<Guarded_Err> e = std::get<std::shared_ptr<Guarded_Err>>(g);
    out = std::string("err:") + e->message;
  };
  return out;
}
ErrorsMain::ErrorsMain( ) {
}
int main(int argc, char* argv[]) {
  __g_argc = argc;
  __g_argv = argv;
  std::shared_ptr<Guard> g =  std::make_shared<Guard>();
  std::cout << g->describe(g->check(3)) << std::endl;
  std::cout << g->describe(g->check((0 - 1))) << std::endl;
  return 0;
}
