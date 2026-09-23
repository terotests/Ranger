#include  <memory>
#include  <string>
#include  <iostream>
#include  <optional>
#include  <vector>

// define classes here to avoid compiler errors
class GenericsMain;
class Stack_int;
class Stack_string;



// reads a property through an optional object, returning the property's default value when absent
template <class O, class F> auto rg_optional_access(const O& value, F accessor) {
  using R = decltype(accessor(value.value()));
  if (value.has_value()) { return accessor(value.value()); }
  return R{};
}

// header definitions
class GenericsMain { 
  public :
    /* class constructor */ 
    GenericsMain( );
    /* static methods */ 
    static void main();
};
class Stack_int { 
  public :
    std::vector<int> items;/* class constructor */ 
    Stack_int( );
    /* instance methods */ 
    void put( int item );
    int size();
     std::optional<int>  peek();
};
class Stack_string { 
  public :
    std::vector<std::string> items;/* class constructor */ 
    Stack_string( );
    /* instance methods */ 
    void put( const std::string& item );
    int size();
     std::optional<std::string>  peek();
};

int __g_argc;
char **__g_argv;
GenericsMain::GenericsMain( ) {
}
int main(int argc, char* argv[]) {
  __g_argc = argc;
  __g_argv = argv;
  std::shared_ptr<Stack_int> ints =  std::make_shared<Stack_int>();
  ints->put(7);
  ints->put(8);
  std::cout << std::string("int-size ") + std::to_string(ints->size()) << std::endl;
   std::optional<int>  top = ints->peek();
  std::cout << std::string("int-top ") + std::to_string((top.has_value() ? top.value() : 0)) << std::endl;
  std::shared_ptr<Stack_string> words =  std::make_shared<Stack_string>();
  words->put(std::string("ada"));
  words->put(std::string("grace"));
  std::cout << std::string("str-size ") + std::to_string(words->size()) << std::endl;
   std::optional<std::string>  lastWord = words->peek();
  std::cout << std::string("str-top ") + (lastWord.has_value() ? lastWord.value() : std::string("?")) << std::endl;
  return 0;
}
Stack_int::Stack_int( ) {
}
void  Stack_int::put( int item ) {
  items.push_back( item  );
}
int  Stack_int::size() {
  return (int)(items.size());
}
 std::optional<int>   Stack_int::peek() {
   std::optional<int>  found;
  int n = (int)(items.size());
  if (n == 0) {
    return found;
  }
  found  = items.at(n - 1);
  return found;
}
Stack_string::Stack_string( ) {
}
void  Stack_string::put( const std::string& item ) {
  items.push_back( item  );
}
int  Stack_string::size() {
  return (int)(items.size());
}
 std::optional<std::string>   Stack_string::peek() {
   std::optional<std::string>  found;
  int n = (int)(items.size());
  if (n == 0) {
    return found;
  }
  found  = items.at(n - 1);
  return found;
}
