#include  <memory>
#include  <cstddef>
#include  <type_traits>
#include  <variant>
#include  <string>
#include  <iostream>
#include  <vector>

// define classes here to avoid compiler errors
class GenericsMain;
class GenericsMain;
class Stack_int;
class Stack_string;

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
typedef std::variant<std::shared_ptr<GenericsMain>, int, std::string, bool, double>  r_union_Any;

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



template <class T> inline T& rg_arg_ref(T&& v) { return v; }

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
    std::vector<int> items;
    /* class constructor */ 
    Stack_int( );
    /* instance methods */ 
    void put( int item );
    int size();
     r_optional_primitive<int>  peek();
};
class Stack_string { 
  public :
    std::vector<std::string> items;
    /* class constructor */ 
    Stack_string( );
    /* instance methods */ 
    void put( const std::string& item );
    int size();
     r_optional_primitive<std::string>  peek();
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
   r_optional_primitive<int>  top = ints->peek();
  std::cout << std::string("int-top ") + std::to_string((top.has_value ? (/*unwrap int*/top.value) : 0)) << std::endl;
  std::shared_ptr<Stack_string> words =  std::make_shared<Stack_string>();
  words->put(std::string("ada"));
  words->put(std::string("grace"));
  std::cout << std::string("str-size ") + std::to_string(words->size()) << std::endl;
   r_optional_primitive<std::string>  lastWord = words->peek();
  std::cout << std::string("str-top ") + (lastWord.has_value ? lastWord.value : std::string("?")) << std::endl;
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
 r_optional_primitive<int>   Stack_int::peek() {
   r_optional_primitive<int>  found;
  int n = (int)(items.size());
  if ( n == 0 ) {
    return found;
  }
  found  = items.at((n - 1));
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
 r_optional_primitive<std::string>   Stack_string::peek() {
   r_optional_primitive<std::string>  found;
  int n = (int)(items.size());
  if ( n == 0 ) {
    return found;
  }
  found  = items.at((n - 1));
  return found;
}
