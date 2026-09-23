#include  <memory>
#include  <string>
#include  <optional>
#include  <iostream>

// define classes here to avoid compiler errors
class Point;
class OptionalParams;



// reads a property through an optional object, returning the property's default value when absent
template <class O, class F> auto rg_optional_access(const O& value, F accessor) {
  using R = decltype(accessor(value.value()));
  if (value.has_value()) { return accessor(value.value()); }
  return R{};
}

// header definitions
class Point { 
  public :
    int x;int y;/* class constructor */ 
    Point( );
};
class OptionalParams { 
  public :
    /* class constructor */ 
    OptionalParams( );
    /* static methods */ 
    static void main();
    /* instance methods */ 
    std::string shown(  std::optional<std::string>  maybe );
    int shownInt(  std::optional<int>  a );
    int shownPoint( const std::optional<std::shared_ptr<Point>>& p );
};

int __g_argc;
char **__g_argv;
Point::Point( ) {
  this->x = 0;
  this->y = 0;
}
OptionalParams::OptionalParams( ) {
}
std::string  OptionalParams::shown(  std::optional<std::string>  maybe ) {
  if (maybe.has_value() == false) {
    return std::string("unknown");
  }
  return maybe.value();
}
int  OptionalParams::shownInt(  std::optional<int>  a ) {
  if ((a.has_value() == false)) {
    return 0;
  }
  int r = a.value();
  return r;
}
int  OptionalParams::shownPoint( const std::optional<std::shared_ptr<Point>>& p ) {
  if (!p.has_value()) {
    return 0;
  }
  std::shared_ptr<Point> q = p.value();
  return q->x;
}
int main(int argc, char* argv[]) {
  __g_argc = argc;
  __g_argv = argv;
  std::shared_ptr<OptionalParams> app =  std::make_shared<OptionalParams>();
   std::optional<std::string>  hit;
  hit  = std::string("ada");
  std::cout << std::string("name ") + app->shown(hit) << std::endl;
   std::optional<std::string>  miss;
  std::cout << std::string("miss ") + app->shown(miss) << std::endl;
   std::optional<int>  n;
  n  = 41;
  std::cout << std::string("int ") + std::to_string(app->shownInt(n)) << std::endl;
  std::optional<std::shared_ptr<Point>> p;
  std::shared_ptr<Point> pt =  std::make_shared<Point>();
  pt->x = 7;
  p  = pt;
  std::cout << std::string("point ") + std::to_string(app->shownPoint(p)) << std::endl;
  return 0;
}
