#include  <memory>
#include  <string>
#include  <optional>
#include  <iostream>

// define classes here to avoid compiler errors
class AbsentMain;



// reads a property through an optional object, returning the property's default value when absent
template <class O, class F> auto rg_optional_access(const O& value, F accessor) {
  using R = decltype(accessor(value.value()));
  if (value.has_value()) { return accessor(value.value()); }
  return R{};
}

// header definitions
class AbsentMain { 
  public :
    /* class constructor */ 
    AbsentMain( );
    /* static methods */ 
    static void main();
    /* instance methods */ 
    std::string report( const std::string& label ,  std::optional<std::string>  s );
};

int __g_argc;
char **__g_argv;
AbsentMain::AbsentMain( ) {
}
std::string  AbsentMain::report( const std::string& label ,  std::optional<std::string>  s ) {
  if (s.has_value() == false) {
    return label + std::string(": absent");
  }
  return ((label + std::string(": present [")) + s.value()) + std::string("]");
}
int main(int argc, char* argv[]) {
  __g_argc = argc;
  __g_argv = argv;
  std::shared_ptr<AbsentMain> app =  std::make_shared<AbsentMain>();
   std::optional<std::string>  s;
  std::cout << app->report(std::string("unset"), s) << std::endl;
  s  = std::string("");
  std::cout << app->report(std::string("empty"), s) << std::endl;
  std::cout << std::string("empty ?? ") + (s.has_value() ? s.value() : std::string("FALLBACK")) << std::endl;
  s  = std::string("x");
  std::cout << app->report(std::string("set"), s) << std::endl;
   std::optional<int>  n;
  if ( (n.has_value() == false) ) {
    std::cout << std::string("int unset: absent") << std::endl;
  } else {
    std::cout << std::string("int unset: present") << std::endl;
  }
  n  = 0;
  if ( (n.has_value() == false) ) {
    std::cout << std::string("int zero: absent") << std::endl;
  } else {
    std::cout << std::string("int zero: present") << std::endl;
  }
  std::cout << std::string("int zero ?? ") + std::to_string((n.has_value() ? n.value() : 99)) << std::endl;
  return 0;
}
