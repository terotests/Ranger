#include  <memory>
#include  <cstddef>
#include  <type_traits>
#include  <variant>
#include  <string>
#include  <vector>
#include  <iostream>

// define classes here to avoid compiler errors
class Point;
class PointOps;
class Counter;
class TreeNode;
class OwnershipMain;
class Point;
class PointOps;
class Counter;
class TreeNode;
class OwnershipMain;

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
typedef std::variant<std::shared_ptr<Point>, std::shared_ptr<PointOps>, std::shared_ptr<Counter>, std::shared_ptr<TreeNode>, std::shared_ptr<OwnershipMain>, int, std::string, bool, double>  r_union_Any;


// a `weak` field: it holds no reference count, and it reads like a std::shared_ptr
template <class T> class r_weak {
  public :
    std::weak_ptr<T> w;
    r_weak() { }
    r_weak(std::nullptr_t) { }
    r_weak(const std::shared_ptr<T>& s) : w(s) { }
    r_weak<T>& operator=(const std::shared_ptr<T>& s) { w = s; return *this; }
    r_weak<T>& operator=(std::nullptr_t) { w.reset(); return *this; }
    operator std::shared_ptr<T>() const { return w.lock(); }
    std::shared_ptr<T> lock() const { return w.lock(); }
    T* operator->() const { return w.lock().get(); }
    explicit operator bool() const { return !w.expired(); }
    bool operator==(std::nullptr_t) const { return w.expired(); }
    bool operator!=(std::nullptr_t) const { return !w.expired(); }
};

template <class T> inline T& rg_arg_ref(T&& v) { return v; }

// header definitions
class Point { 
  public :
    int x;
    int y;
    /* class constructor */ 
    Point( int x , int y  );
};
class PointOps { 
  public :
    /* class constructor */ 
    PointOps( );
    /* instance methods */ 
    int manhattan( const std::shared_ptr<Point>& p );
    std::shared_ptr<Point> addPoints( const std::shared_ptr<Point>& a , const std::shared_ptr<Point>& b );
};
class Counter { 
  public :
    int value;
    /* class constructor */ 
    Counter( );
    /* instance methods */ 
    int reading();
    void add( int amount );
};
class TreeNode : public std::enable_shared_from_this<TreeNode>  { 
  public :
    std::string name;
    std::vector<std::shared_ptr<TreeNode>> kids;
    r_weak<TreeNode> parent;
    /* class constructor */ 
    TreeNode( );
    /* instance methods */ 
    void adopt( std::shared_ptr<TreeNode> c );
    int childCount();
};
class OwnershipMain { 
  public :
    /* class constructor */ 
    OwnershipMain( );
    /* static methods */ 
    static void main();
};

int __g_argc;
char **__g_argv;
Point::Point( int x , int y  ) {
  this->x = 0;
  this->y = 0;
  this->x = x;
  this->y = y;
}
PointOps::PointOps( ) {
}
int  PointOps::manhattan( const std::shared_ptr<Point>& p ) {
  int ax = p->x;
  if ( ax < 0 ) {
    ax = 0 - ax;
  }
  int ay = p->y;
  if ( ay < 0 ) {
    ay = 0 - ay;
  }
  return ax + ay;
}
std::shared_ptr<Point>  PointOps::addPoints( const std::shared_ptr<Point>& a , const std::shared_ptr<Point>& b ) {
  return  std::make_shared<Point>(a->x + b->x, a->y + b->y);
}
Counter::Counter( ) {
  this->value = 0;
}
int  Counter::reading() {
  return value;
}
void  Counter::add( int amount ) {
  value = value + amount;
}
TreeNode::TreeNode( ) {
}
void  TreeNode::adopt( std::shared_ptr<TreeNode> c ) {
  c->parent  = shared_from_this();
  kids.push_back( c  );
}
int  TreeNode::childCount() {
  return (int)(kids.size());
}
OwnershipMain::OwnershipMain( ) {
}
int main(int argc, char* argv[]) {
  __g_argc = argc;
  __g_argv = argv;
  std::shared_ptr<PointOps> ops =  std::make_shared<PointOps>();
  std::shared_ptr<Point> origin =  std::make_shared<Point>(3, 4);
  std::cout << std::string("manhattan ") + std::to_string(ops->manhattan(origin)) << std::endl;
  std::shared_ptr<Point> summed = ops->addPoints(origin, origin);
  std::cout << std::string("sum.x ") + std::to_string(summed->x) << std::endl;
  std::shared_ptr<Counter> left =  std::make_shared<Counter>();
  std::shared_ptr<Counter> alias = left;
  alias->add(1);
  std::cout << std::string("shared ") + std::to_string(left->reading()) << std::endl;
  std::shared_ptr<TreeNode> root =  std::make_shared<TreeNode>();
  root->name = std::string("root");
  std::shared_ptr<TreeNode> leaf =  std::make_shared<TreeNode>();
  leaf->name = std::string("leaf");
  root->adopt(leaf);
  std::cout << std::string("kids ") + std::to_string(root->childCount()) << std::endl;
  if ( leaf->parent == NULL ) {
    std::cout << std::string("parent missing") << std::endl;
  } else {
    std::shared_ptr<TreeNode> back = leaf->parent;
    std::cout << std::string("parent ") + back->name << std::endl;
  }
  return 0;
}
