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
class User { 
  public :
    int age;
    std::string name;
    /* class constructor */ 
    User( );
    /* instance methods */ 
    std::string asString();
    std::string label();
};
class Bot { 
  public :
    std::string name;
    /* class constructor */ 
    Bot( );
    /* instance methods */ 
    std::string asString();
    std::string label();
};
class TraitsMain { 
  public :
    /* class constructor */ 
    TraitsMain( );
    /* static methods */ 
    static void main();
    /* instance methods */ 
    std::string show( const std::shared_ptr<User>& who );
};

int __g_argc;
char **__g_argv;
User::User( ) {
  this->age = 0;
}
std::string  User::asString() {
  return (name + std::string(" ")) + std::to_string(age);
}
std::string  User::label() {
  return name;
}
Bot::Bot( ) {
}
std::string  Bot::asString() {
  return std::string("bot:") + name;
}
std::string  Bot::label() {
  return name;
}
TraitsMain::TraitsMain( ) {
}
std::string  TraitsMain::show( const std::shared_ptr<User>& who ) {
  return (std::string("label=") + who->label()) + (std::string(" text=") + who->asString());
}
int main(int argc, char* argv[]) {
  __g_argc = argc;
  __g_argv = argv;
  std::shared_ptr<TraitsMain> app =  std::make_shared<TraitsMain>();
  std::shared_ptr<User> u =  std::make_shared<User>();
  u->name = std::string("ada");
  u->age = 36;
  std::cout << app->show(u) << std::endl;
  std::shared_ptr<Bot> b =  std::make_shared<Bot>();
  b->name = std::string("r2");
  std::cout << b->asString() << std::endl;
  return 0;
}
