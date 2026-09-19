#include  <memory>
#include  <cstddef>
#include  <type_traits>
#include  <variant>
#include  <string>
#include  <iostream>

// define classes here to avoid compiler errors
class AbsentMain;
class AbsentMain;

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
typedef std::variant<std::shared_ptr<AbsentMain>, int, std::string, bool, double>  r_union_Any;

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
class AbsentMain { 
  public :
    /* class constructor */ 
    AbsentMain( );
    /* static methods */ 
    static void main();
    /* instance methods */ 
    std::string report( const std::string& label ,  r_optional_primitive<std::string>  s );
};

int __g_argc;
char **__g_argv;
AbsentMain::AbsentMain( ) {
}
std::string  AbsentMain::report( const std::string& label ,  r_optional_primitive<std::string>  s ) {
  if ( s.has_value == false ) {
    return label + std::string(": absent");
  }
  return ((label + std::string(": present [")) + s.value) + std::string("]");
}
int main(int argc, char* argv[]) {
  __g_argc = argc;
  __g_argv = argv;
  std::shared_ptr<AbsentMain> app =  std::make_shared<AbsentMain>();
   r_optional_primitive<std::string>  s;
  std::cout << app->report(std::string("unset"), s) << std::endl;
  s  = std::string("");
  std::cout << app->report(std::string("empty"), s) << std::endl;
  std::cout << std::string("empty ?? ") + (s.has_value ? s.value : std::string("FALLBACK")) << std::endl;
  s  = std::string("x");
  std::cout << app->report(std::string("set"), s) << std::endl;
   r_optional_primitive<int>  n;
  if ( n.has_value == false ) {
    std::cout << std::string("int unset: absent") << std::endl;
  } else {
    std::cout << std::string("int unset: present") << std::endl;
  }
  n  = 0;
  if ( n.has_value == false ) {
    std::cout << std::string("int zero: absent") << std::endl;
  } else {
    std::cout << std::string("int zero: present") << std::endl;
  }
  std::cout << std::string("int zero ?? ") + std::to_string((n.has_value ? (/*unwrap int*/n.value) : 99)) << std::endl;
  return 0;
}
