#include  <memory>
#include  <variant>
#include  <string>
#include  <iostream>

enum class Color : int {
  Red = 0,
  Green = 1,
  Blue = 2,
};

// define classes here to avoid compiler errors
class Message_Text;
class Message_Ping;
class Message_Text;
class Message_Move;
class Message__ops;
class EnumsMain;

typedef std::variant<Message_Ping, std::shared_ptr<Message_Text>, Message_Move>  r_union_Message;


// reads a property through an optional object, returning the property's default value when absent
template <class O, class F> auto rg_optional_access(const O& value, F accessor) {
  using R = decltype(accessor(value.value()));
  if (value.has_value()) { return accessor(value.value()); }
  return R{};
}

// header definitions
class Message_Ping { 
  public :
    /* class constructor */ 
    Message_Ping( );
    /* a value case of a closed family compares by content */ 
    bool operator==(const Message_Ping& o) const {
      return true;
    }
    bool operator!=(const Message_Ping& o) const { return !(*this == o); }
};
class Message_Text { 
  public :
    std::string body;/* class constructor */ 
    Message_Text( const std::string& body  );
};
class Message_Move { 
  public :
    int dx;int dy;/* class constructor */ 
    Message_Move( int dx , int dy  );
    /* a value case of a closed family compares by content */ 
    bool operator==(const Message_Move& o) const {
      return dx == o.dx && dy == o.dy;
    }
    bool operator!=(const Message_Move& o) const { return !(*this == o); }
};
class Message__ops { 
  public :
    /* class constructor */ 
    Message__ops( );
    /* static methods */ 
    static bool equals( const r_union_Message& a , const r_union_Message& b );
    static bool notEquals( const r_union_Message& a , const r_union_Message& b );
};
class EnumsMain { 
  public :
    /* class constructor */ 
    EnumsMain( );
    /* static methods */ 
    static void main();
    /* instance methods */ 
    std::string colorName( Color c );
    std::string describe( const r_union_Message& m );
};

int __g_argc;
char **__g_argv;
Message_Ping::Message_Ping( ) {
}
Message_Text::Message_Text( const std::string& body  ) {
  this->body = body;
}
Message_Move::Message_Move( int dx , int dy  ) {
  this->dx = 0;
  this->dy = 0;
  this->dx = dx;
  this->dy = dy;
}
Message__ops::Message__ops( ) {
}
bool  Message__ops::equals( const r_union_Message& a , const r_union_Message& b ) {
  if( std::holds_alternative<Message_Ping>(a) ) {
    Message_Ping __ea0 = std::get<Message_Ping>(a);
    if( std::holds_alternative<Message_Ping>(b) ) {
      Message_Ping __eb0 = std::get<Message_Ping>(b);
      return true;
    };
    return false;
  };
  if( std::holds_alternative<std::shared_ptr<Message_Text>>(a) ) {
    std::shared_ptr<Message_Text> __ea1 = std::get<std::shared_ptr<Message_Text>>(a);
    if( std::holds_alternative<std::shared_ptr<Message_Text>>(b) ) {
      std::shared_ptr<Message_Text> __eb1 = std::get<std::shared_ptr<Message_Text>>(b);
      if ((__ea1->body != __eb1->body)) {
        return false;
      }
      return true;
    };
    return false;
  };
  if( std::holds_alternative<Message_Move>(a) ) {
    Message_Move __ea2 = std::get<Message_Move>(a);
    if( std::holds_alternative<Message_Move>(b) ) {
      Message_Move __eb2 = std::get<Message_Move>(b);
      if (__ea2.dx != __eb2.dx) {
        return false;
      }
      if (__ea2.dy != __eb2.dy) {
        return false;
      }
      return true;
    };
    return false;
  };
  return false;
}
bool  Message__ops::notEquals( const r_union_Message& a , const r_union_Message& b ) {
  if (Message__ops::equals(a, b)) {
    return false;
  }
  return true;
}
EnumsMain::EnumsMain( ) {
}
std::string  EnumsMain::colorName( Color c ) {
  if (c == Color::Red) {
    return std::string("red");
  }
  if (c == Color::Green) {
    return std::string("green");
  }
  return std::string("blue");
}
std::string  EnumsMain::describe( const r_union_Message& m ) {
  std::string out = std::string("?");
  if( std::holds_alternative<Message_Ping>(m) ) {
    Message_Ping __match0 = std::get<Message_Ping>(m);
    out = std::string("ping");
  };
  if( std::holds_alternative<std::shared_ptr<Message_Text>>(m) ) {
    std::shared_ptr<Message_Text> t = std::get<std::shared_ptr<Message_Text>>(m);
    out = std::string("text:") + t->body;
  };
  if( std::holds_alternative<Message_Move>(m) ) {
    Message_Move mv = std::get<Message_Move>(m);
    out = (std::string("move:") + std::to_string(mv.dx)) + (std::string(",") + std::to_string(mv.dy));
  };
  return out;
}
int main(int argc, char* argv[]) {
  __g_argc = argc;
  __g_argv = argv;
  std::shared_ptr<EnumsMain> app =  std::make_shared<EnumsMain>();
  std::cout << std::string("color ") + app->colorName(Color::Green) << std::endl;
  std::cout << app->describe(( Message_Ping())) << std::endl;
  std::cout << app->describe(( std::make_shared<Message_Text>(std::string("hi")))) << std::endl;
  std::cout << app->describe(( Message_Move(2, 3))) << std::endl;
  return 0;
}
