#include  <memory>
#include  <cstddef>
#include  <type_traits>
#include  <variant>
#include  <string>
#include  <iostream>

// define classes here to avoid compiler errors
class Point;
class OptionalParams;
class Point;
class OptionalParams;

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
typedef std::variant<std::shared_ptr<Point>, std::shared_ptr<OptionalParams>, int, std::string, bool, double>  r_union_Any;

template <class T>
class r_optional_primitive {
  public:
    // has_value has to start false: cpp_str_to_int and its siblings leave the
    // field untouched when the conversion throws, and an indeterminate bool
    // made a failed str2int read back as a value on the C++ target.
    bool has_value = false;
    T value = T();
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
class Point { 
  public :
    int x;
    int y     /* note: unused */;
    /* class constructor */ 
    Point( );
};
class OptionalParams { 
  public :
    /* class constructor */ 
    OptionalParams( );
    /* static methods */ 
    static void main();
    /* instance methods */ 
    std::string shown( std::string maybe );
    int shownInt(  r_optional_primitive<int>  a );
    int shownPoint( const std::shared_ptr<Point>& p );
};

int __g_argc;
char **__g_argv;
Point::Point( ) {
  this->x = 0;
  this->y = 0;
}
OptionalParams::OptionalParams( ) {
}
std::string  OptionalParams::shown( std::string maybe ) {
  if ( maybe.empty() ) {
    return std::string("unknown");
  }
  return maybe;
}
int  OptionalParams::shownInt(  r_optional_primitive<int>  a ) {
  if ( a.has_value == false ) {
    return 0;
  }
  int r = /*unwrap int*/a.value;
  return r;
}
int  OptionalParams::shownPoint( const std::shared_ptr<Point>& p ) {
  if ( p == NULL ) {
    return 0;
  }
  std::shared_ptr<Point> q = p;
  return q->x;
}
int main(int argc, char* argv[]) {
  __g_argc = argc;
  __g_argv = argv;
  std::shared_ptr<OptionalParams> app =  std::make_shared<OptionalParams>();
  std::string hit;
  hit  = std::string("ada");
  std::cout << std::string("name ") + app->shown(hit) << std::endl;
  std::string miss;
  std::cout << std::string("miss ") + app->shown(miss) << std::endl;
   r_optional_primitive<int>  n;
  n  = 41;
  std::cout << std::string("int ") + std::to_string(app->shownInt(n)) << std::endl;
  std::shared_ptr<Point> p;
  std::shared_ptr<Point> pt =  std::make_shared<Point>();
  pt->x = 7;
  p  = pt;
  std::cout << std::string("point ") + std::to_string(app->shownPoint(p)) << std::endl;
  return 0;
}
