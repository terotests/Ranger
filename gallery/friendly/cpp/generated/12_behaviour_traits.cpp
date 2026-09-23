#include  <memory>
#include  <string>
#include  <iostream>

// define classes here to avoid compiler errors
class User;
class Bot;
class TraitsMain;



// reads a property through an optional object, returning the property's default value when absent
template <class O, class F> auto rg_optional_access(const O& value, F accessor) {
  using R = decltype(accessor(value.value()));
  if (value.has_value()) { return accessor(value.value()); }
  return R{};
}

// header definitions
class Named { 
  public :
    virtual ~Named() {}
    virtual std::string label() = 0;
};
class User : public Named  { 
  public :
    std::string uname;/* class constructor */ 
    User( );
    /* instance methods */ 
    std::string label();
    int weight();
};
class Bot : public Named  { 
  public :
    int id;/* class constructor */ 
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
