#include  <memory>
#include  <cstddef>
#include  <type_traits>
#include  <variant>
#include  <string>
#include  <iostream>

// define classes here to avoid compiler errors
class User;
class Bot;
class TraitsMain;
class User;
class Bot;
class TraitsMain;

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
typedef std::variant<std::shared_ptr<User>, std::shared_ptr<Bot>, std::shared_ptr<TraitsMain>, int, std::string, bool, double>  r_union_Any;


template <class T> inline T& rg_arg_ref(T&& v) { return v; }

// header definitions
class Named { 
  public :
    virtual ~Named() {}
    virtual std::string label() = 0;
};
class User : public Named  { 
  public :
    std::string uname     /* note: unused */;
    /* class constructor */ 
    User( );
    /* instance methods */ 
    std::string label();
    int weight();
};
class Bot : public Named  { 
  public :
    int id     /* note: unused */;
    /* class constructor */ 
    Bot( );
    /* instance methods */ 
    std::string label();
};
class TraitsMain { 
  public :
    /* class constructor */ 
    TraitsMain( );
    /* static methods */ 
    static void main();
    /* instance methods */ 
    std::string show( std::shared_ptr<Named> n );
};

int __g_argc;
char **__g_argv;
User::User( ) {
}
std::string  User::label() {
  return std::string("anon");
}
int  User::weight() {
  return 1;
}
Bot::Bot( ) {
  this->id = 0;
}
std::string  Bot::label() {
  return std::string("anon");
}
TraitsMain::TraitsMain( ) {
}
std::string  TraitsMain::show( std::shared_ptr<Named> n ) {
  return n->label();
}
int main(int argc, char* argv[]) {
  __g_argc = argc;
  __g_argv = argv;
  std::shared_ptr<TraitsMain> app =  std::make_shared<TraitsMain>();
  std::shared_ptr<User> u =  std::make_shared<User>();
  std::shared_ptr<Bot> b =  std::make_shared<Bot>();
  std::cout << std::string("user ") + app->show(u) << std::endl;
  std::cout << std::string("bot ") + app->show(b) << std::endl;
  std::cout << std::string("weight ") + std::to_string(u->weight()) << std::endl;
  return 0;
}
