#include  <memory>
#include  <cstddef>
#include  <type_traits>
#include  <variant>
#include  <string>
#include  <vector>
#include  <iostream>

// define classes here to avoid compiler errors
class TextTools;
class SliceMain;
class TextTools;
class SliceMain;

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
typedef std::variant<std::shared_ptr<TextTools>, std::shared_ptr<SliceMain>, int, std::string, bool, double>  r_union_Any;


template <class T> inline T& rg_arg_ref(T&& v) { return v; }

// header definitions
class TextTools { 
  public :
    /* class constructor */ 
    TextTools( );
    /* instance methods */ 
    std::string greet( const std::string& name );
    int total( const std::vector<int>& xs );
    std::string firstChar( const std::string& s );
    int twice( const std::vector<int>& xs );
};
class SliceMain { 
  public :
    /* class constructor */ 
    SliceMain( );
    /* static methods */ 
    static void main();
};

int __g_argc;
char **__g_argv;
TextTools::TextTools( ) {
}
std::string  TextTools::greet( const std::string& name ) {
  return std::string("hello ") + name;
}
int  TextTools::total( const std::vector<int>& xs ) {
  int acc = 0;
  for ( int i = 0; i != (int)(xs.size()); i++) {
    int v = xs.at(i);
    acc = acc + v;
  };
  return acc;
}
std::string  TextTools::firstChar( const std::string& s ) {
  if ( ((int)(s.length())) == 0 ) {
    return std::string("");
  }
  return s.substr(0, 1 - 0);
}
int  TextTools::twice( const std::vector<int>& xs ) {
  return this->total(xs) + this->total(xs);
}
SliceMain::SliceMain( ) {
}
int main(int argc, char* argv[]) {
  __g_argc = argc;
  __g_argv = argv;
  std::shared_ptr<TextTools> t =  std::make_shared<TextTools>();
  std::cout << t->greet(std::string("ada")) << std::endl;
  std::vector<int> xs = std::vector<int>{1, 2, 3};
  std::cout << std::string("twice ") + std::to_string(t->twice(xs)) << std::endl;
  std::cout << std::string("first ") + t->firstChar(std::string("grace")) << std::endl;
  return 0;
}
